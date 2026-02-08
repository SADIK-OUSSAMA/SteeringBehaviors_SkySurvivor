# SkySurvivor - Rapport de Projet

**Realise par :** ESSALMANI OUSSAMA et SADIK OUSSAMA  
**Annee Universitaire :** 2025-2026

**Lien GitHub Pages (Jeu) :** [https://sadik-oussama.github.io/SteeringBehaviors_SkySurvivor/](https://sadik-oussama.github.io/SteeringBehaviors_SkySurvivor/)  
**Lien YouTube (Demo) :** Coming Soon

---

## 1. Introduction

### Presentation generale

SkySurvivor est un jeu video de type **Action / Arcade / Survival** developpe en JavaScript avec la bibliotheque **p5.js**. Le joueur incarne un avion de combat piege dans une arene. L'objectif est de survivre a des vagues progressives d'ennemis autonomes en utilisant des obstacles explosifs, des dash strategiques, et en evitant les bordures mortelles.

### Objectif principal

Ce projet a ete concu dans le cadre du module **"IA pour le jeu video"** pour demontrer l'implementation pratique des **Steering Behaviors** (comportements de direction) theorises par Craig Reynolds. L'objectif technique n'est pas seulement de creer un jeu fonctionnel, mais de simuler des mouvements organiques et coordonnes pour les ennemis, depassant les simples trajectoires lineaires.

### Contexte de realisation

Le developpement s'est concentre sur la creation d'un moteur de jeu leger mais robuste, capable de gerer de multiples entites a l'ecran grace a une architecture orientee objet (Object-Oriented Programming). Toutes les entites mobiles heritent d'une classe `Vehicle` de base qui implemente les comportements de steering.

---

## 2. Description detaillee du jeu

### Principe & Gameplay

Le joueur evolue dans une arene fermee avec des bordures mortelles. Le but est de survivre le plus longtemps possible en eliminant tous les ennemis de chaque niveau.

**Controles :**

| Touche | Action |
|--------|--------|
| ZQSD / WASD / Fleches | Deplacer l'avion |
| E | Dash (avec charges collectables) |
| ESPACE / Clic | Deposer un obstacle explosif |

### Systeme de Progression (Niveaux)

Le jeu repose sur une difficulte croissante geree par le `LEVEL_CONFIG` :

- **3 Niveaux** avec difficulte progressive
- **Scaling de Difficulte** : A chaque niveau, le nombre d'ennemis augmente, leur duree de vie s'allonge, et leur vitesse augmente
- **Bordures dynamiques** : La marge de securite change selon le niveau

| Niveau | Pursuers | Lifetime | Speed | Boundary |
|--------|----------|----------|-------|----------|
| 1 | 3 | 4000 | 3.0 | 20 |
| 2 | 5 | 5000 | 3.3 | 100 |
| 3 | 8 | 6000 | 3.6 | 150 |

### Entites du Jeu

**Player (Joueur)**
- Controle clavier avec physique d'inertie
- Systeme de 3 coeurs (persiste entre les niveaux)
- Ability de Dash (charges collectables, max 3)
- Peut deposer des obstacles explosifs (max 5 actifs)
- Comportement : Mouvement direct par input, pas de steering behavior

**Pursuer (Ennemi Principal)**
- Utilise `pursue(player)` pour predire et intercepter la position du joueur
- Utilise `avoid(obstacles)` pour contourner les obstacles explosifs
- Utilise `separate(otherPursuers)` pour eviter les collisions entre ennemis
- Explose au contact des bordures ou quand sa duree de vie expire
- Comportements utilises : **Pursue, Avoid, Separate**

**Snake (Serpent)**
- Tete utilise `wander()` pour un mouvement organique aleatoire
- Corps compose de segments qui utilisent `arrive()` pour suivre le segment precedent
- Utilise `boundaries()` pour rester dans l'ecran
- Comportements utilises : **Wander, Arrive, Boundaries**

**FlyingEnemy (Ennemi Volant)**
- Mouvement lineaire simple de haut en bas
- Apparait en vagues de 6-7 toutes les 3 secondes
- Pas de steering behavior (trajectoire fixe)

**Obstacle (Bombe)**
- Deposee par le joueur
- Explose apres un delai (3 secondes)
- Zone d'explosion tue les pursuers et blesse le joueur

### Collectables

| Type | Effet | Spawn |
|------|-------|-------|
| Heart | Restaure 1 coeur | Toutes les 10 secondes |
| Dash | Ajoute 1 charge de dash | Toutes les 15 secondes |

---

## 3. Architecture Technique

### Technologies

- **JavaScript** (ES6+ classes)
- **p5.js** (Canvas API + p5.sound)
- **GitHub Pages** (Hebergement)

### Structure du Code

L'architecture suit strictement les principes de la programmation orientee objet :

```
SteeringBehaviors_SkySurvivor/
├── index.html          # Point d'entree HTML
├── sketch.js           # Boucle principale, gestion des etats, UI
├── vehicle.js          # Classe mere avec tous les steering behaviors
├── player.js           # Joueur (extends Vehicle)
├── pursuer.js          # Ennemi chasseur (extends Vehicle)
├── snake.js            # Serpent multi-segments (utilise Vehicle)
├── flyingEnemy.js      # Ennemi volant simple
├── obstacle.js         # Obstacles explosifs
├── heart.js            # Collectable de soin
├── dashPickup.js       # Collectable de dash
├── assets/             # Images et sons
└── libraries/          # p5.js et p5.sound
```

### Vehicle.js (Classe Mere)

Implemente la physique newtonienne : Position, Vitesse, Acceleration.
Contient les methodes de Steering Behaviors :

| Methode | Description |
|---------|-------------|
| `seek(target)` | Se diriger vers une cible |
| `flee(target)` | Fuir une cible |
| `pursue(vehicle)` | Predire et intercepter un vehicule en mouvement |
| `evade(vehicle)` | Eviter un vehicule en predisant sa trajectoire |
| `arrive(target, d)` | Arriver doucement vers une cible avec deceleration |
| `wander()` | Mouvement aleatoire organique |
| `avoid(obstacles)` | Eviter des obstacles statiques |
| `separate(boids)` | Maintenir une distance avec les voisins |
| `boundaries(x,y,w,h,d)` | Rester dans une zone definie |

Toutes les entites mobiles (Joueur, Ennemis, Serpents) heritent de cette classe.

### Intelligence Artificielle (Steering Behaviors)

**Pursuers (Chasseurs) :**
Utilisent une combinaison de 3 comportements :
1. `pursue(player)` - Prediction de la position future du joueur (poids: 1.0)
2. `avoid(obstacles)` - Contournement des bombes (poids: 4.0)
3. `separate(pursuers)` - Anti-collision entre ennemis (poids: 1.5)

**Snake (Serpent) :**
Utilise une architecture tete-corps :
1. **Tete** : `wander()` + `boundaries()` pour un mouvement naturel
2. **Corps** : Chaque segment utilise `arrive()` vers le segment precedent

**Flocking potentiel :**
Le code `Vehicle.js` contient deja les bases pour implementer le flocking complet (cohesion, alignment, separation) pour de futures extensions.

### Gestion des Etats

Le jeu utilise une machine a etats simple :

```
menu -> playing -> levelComplete -> playing -> ... -> victory
                -> gameOver (si 0 coeurs)
```

---

## 4. Analyse et Critique

### Difficultes rencontrees

**Performance des Collisions**
- Probleme : Verification des collisions entre toutes les entites (complexite O(N^2))
- Solution : Limitation du nombre d'obstacles actifs (max 5) et d'ennemis volants, suppression immediate des entites mortes

**Degats Instantanes (One-Shot)**
- Probleme : Les collisions etant verifiees 60 fois par seconde, toucher un ennemi causait des degats multiples instantanes
- Solution : Ajout d'une periode d'invulnerabilite (i-frames) de 1.5 secondes apres chaque coup recu, avec clignotement visuel (`Player.damageCooldown`)

**Comportement des Bordures**
- Probleme : Les ennemis se bloquaient dans les coins
- Solution : Les pursuers explosent au contact des bordures au lieu d'essayer de les eviter, creant une mecanique de jeu interessante

### Reussites

**Fluidite des Mouvements**
L'IA ne semble pas robotique ; les ennemis s'adaptent dynamiquement grace aux forces de steering combinees. Le comportement `pursue` predit la position future du joueur, rendant les ennemis plus dangereux.

**Architecture Modulaire**
Ajouter un nouvel ennemi prend quelques minutes grace a la structure de classes bien definie. La classe `Vehicle` est reutilisable pour tout nouveau comportement.

**Experience de Jeu ("Game Feel")**
- Effets visuels d'explosion
- Dash avec trainee visuelle
- Barre de vie sur les ennemis
- UI moderne avec panneaux glassmorphism
- Effets sonores pour chaque action

### Utilisation de l'IA Generative

Des outils LLM (Antigravity, ChatGPT) ont assiste le developpement pour :

**Refactoring et Optimisation**
- Optimisation des methodes de calcul vectoriel
- Restructuration du code en classes ES6 modulaires

**Generation d'Assets**
- Assistance pour le design de l'interface utilisateur
- Creation des effets visuels (particules, explosions)

**Debugging**
- Identification des problemes de scope dans les callbacks audio
- Resolution des conflits de collision

**Exemples de prompts utilises :**
```
"Add sound effects: play 'obstacle explosion.mp3' when obstacle explodes, 
'game-level-complete.mp3' when winning a level, 
'nikin-pop-up-something-160353.mp3' when placing an obstacle"

"Redesign the game menu with a premium look: glassmorphism panels, 
animated gradient background, custom drawn icons instead of emojis"

"Improve the in-game HUD with progress bars for enemies, 
bomb indicators, and a reload progress bar"
```

---

## 5. Conclusion

Ce projet a permis de valider la maitrise des concepts d'IA appliques aux jeux video. Le resultat est un jeu complet, techniquement solide et ludique. L'utilisation des Steering Behaviors offre une complexite emergente fascinante : des regles simples appliquees individuellement creent des comportements de groupe complexes et realistes.

Le comportement de `pursue` combine avec `separate` permet aux ennemis de chasser le joueur de maniere coordonnee sans se percuter. Le `wander` du serpent cree un mouvement naturel et imprevisible. La mecanique d'explosion aux bordures cree une strategic unique ou le joueur doit attirer les ennemis vers les bords.

### Pistes d'amelioration futures

- Sauvegarde du meilleur score (LocalStorage)
- Ajout de comportements de flocking complets (cohesion, alignment) pour des nuees d'ennemis
- Nouveaux types de steering : `wander` pour des ennemis passifs, `flee` pour des proies
- Mode Boss avec ennemi utilisant `evade` pour esquiver les obstacles
- Portage sur mobile (controles tactiles)
- Systeme de power-ups avec types varies

---

**Projet universitaire - Master 2 Intelligence Artificielle**
