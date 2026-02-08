# SkySurvivor - Rapport de Projet

**Réalisé par :** ESSALMANI OUSSAMA et SADIK OUSSAMA  
**Année Universitaire :** 2025-2026

**Lien GitHub Pages (Jeu) :** [https://sadik-oussama.github.io/SteeringBehaviors_SkySurvivor/](https://sadik-oussama.github.io/SteeringBehaviors_SkySurvivor/)  
**Lien YouTube (Démo) :** Coming Soon

---

## 1. Introduction

### Présentation générale

SkySurvivor est un jeu vidéo de type **Action / Arcade / Survival** développé en JavaScript avec la bibliothèque **p5.js**. Le joueur incarne un avion de combat piégé dans une arène. L'objectif est de survivre à des vagues progressives d'ennemis autonomes en utilisant des obstacles explosifs, des dash stratégiques, et en évitant les bordures mortelles.

### Objectif principal

Ce projet a été conçu dans le cadre du module **"IA pour le jeu vidéo"** pour démontrer l'implémentation pratique des **Steering Behaviors** (comportements de direction) théorisés par Craig Reynolds. L'objectif technique n'est pas seulement de créer un jeu fonctionnel, mais de simuler des mouvements organiques et coordonnés pour les ennemis, dépassant les simples trajectoires linéaires.

### Contexte de réalisation

Le développement s'est concentré sur la création d'un moteur de jeu léger mais robuste, capable de gérer de multiples entités à l'écran grâce à une architecture orientée objet (Object-Oriented Programming). Toutes les entités mobiles héritent d'une classe `Vehicle` de base qui implémente les comportements de steering.

---

## 2. Description détaillée du jeu

### Principe & Gameplay

Le joueur évolue dans une arène fermée avec des bordures mortelles. Le but est de survivre le plus longtemps possible en éliminant tous les ennemis de chaque niveau.

**Contrôles :**

| Touche | Action |
|--------|--------|
| ZQSD / WASD / Flèches | Déplacer l'avion |
| E | Dash (avec charges collectables) |
| ESPACE / Clic | Déposer un obstacle explosif |

### Système de Progression (Niveaux)

Le jeu repose sur une difficulté croissante gérée par le `LEVEL_CONFIG` :

- **3 Niveaux** avec difficulté progressive
- **Scaling de Difficulté** : À chaque niveau, le nombre d'ennemis augmente, leur durée de vie s'allonge, et leur vitesse augmente
- **Bordures dynamiques** : La marge de sécurité change selon le niveau

| Niveau | Pursuers | Lifetime | Speed | Boundary |
|--------|----------|----------|-------|----------|
| 1 | 3 | 4000 | 3.0 | 20 |
| 2 | 5 | 5000 | 3.3 | 100 |
| 3 | 8 | 6000 | 3.6 | 150 |

### Entités du Jeu

**Player (Joueur)**
- Contrôle clavier avec physique d'inertie
- Système de 3 coeurs (persiste entre les niveaux)
- Capacité de Dash (charges collectables, max 3)
- Peut déposer des obstacles explosifs (max 5 actifs)
- Comportement : Mouvement direct par input, pas de steering behavior

**Pursuer (Ennemi Principal)**
- Utilise `pursue(player)` pour prédire et intercepter la position du joueur
- Utilise `avoid(obstacles)` pour contourner les obstacles explosifs
- Utilise `separate(otherPursuers)` pour éviter les collisions entre ennemis
- Explose au contact des bordures ou quand sa durée de vie expire
- Comportements utilisés : **Pursue, Avoid, Separate**

**Snake (Serpent)**
- Tête utilise `wander()` pour un mouvement organique aléatoire
- Corps composé de segments qui utilisent `arrive()` pour suivre le segment précédent
- Utilise `boundaries()` pour rester dans l'écran
- Comportements utilisés : **Wander, Arrive, Boundaries**

**FlyingEnemy (Ennemi Volant)**
- Mouvement linéaire simple de haut en bas
- Apparaît en vagues de 6-7 toutes les 3 secondes
- Pas de steering behavior (trajectoire fixe)

**Obstacle (Bombe)**
- Déposée par le joueur
- Explose après un délai (3 secondes)
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
- **GitHub Pages** (Hébergement)

### Structure du Code

L'architecture suit strictement les principes de la programmation orientée objet :

```
SteeringBehaviors_SkySurvivor/
├── index.html          # Point d'entrée HTML
├── sketch.js           # Boucle principale, gestion des états, UI
├── vehicle.js          # Classe mère avec tous les steering behaviors
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

### Vehicle.js (Classe Mère)

Contient les méthodes de Steering Behaviors :

| Méthode | Description |
|---------|-------------|
| `seek(target)` | Se diriger vers une cible |
| `flee(target)` | Fuir une cible |
| `pursue(vehicle)` | Prédire et intercepter un véhicule en mouvement |
| `evade(vehicle)` | Éviter un véhicule en prédisant sa trajectoire |
| `arrive(target, d)` | Arriver doucement vers une cible avec décélération |
| `wander()` | Mouvement aléatoire organique |
| `avoid(obstacles)` | Éviter des obstacles statiques |
| `separate(boids)` | Maintenir une distance avec les voisins |
| `boundaries(x,y,w,h,d)` | Rester dans une zone définie |

Toutes les entités mobiles (Joueur, Ennemis, Serpents) héritent de cette classe.

### Intelligence Artificielle (Steering Behaviors)

**Pursuers (Chasseurs) :**
Utilisent une combinaison de 3 comportements :
1. `pursue(player)` - Prédiction de la position future du joueur (poids: 1.0)
2. `avoid(obstacles)` - Contournement des bombes (poids: 4.0)
3. `separate(pursuers)` - Anti-collision entre ennemis (poids: 1.5)

**Snake (Serpent) :**
Utilise une architecture tête-corps :
1. **Tête** : `wander()` + `boundaries()` pour un mouvement naturel
2. **Corps** : Chaque segment utilise `arrive()` vers le segment précédent

**Flocking potentiel :**
Le code `Vehicle.js` contient déjà les bases pour implémenter le flocking complet (cohésion, alignement, séparation) pour de futures extensions.

---

## 4. Analyse et Critique

### Difficultés rencontrées

**Performance avec les Images Haute Résolution**
- Problème : L'utilisation d'images de sprites en haute résolution (PNG volumineux) causait des ralentissements significatifs du jeu, avec des chutes de FPS notables
- Solution : Redimensionnement des images à des tailles optimisées pour le jeu, compression des assets, et utilisation de dimensions d'affichage appropriées lors du rendu

**Lag lors du Chargement des Sons**
- Problème : Le chargement de multiples fichiers audio MP3 simultanément causait des freeze au démarrage du jeu
- Solution : Utilisation de `loadSound()` dans `preload()` avec vérification `isLoaded()` avant lecture, et réduction de la taille des fichiers audio

**Rendu Canvas avec Beaucoup d'Entités**
- Problème : Avec plusieurs ennemis, particules et effets visuels, le canvas devenait lent à cause des multiples appels de dessin
- Solution : Limitation du nombre d'obstacles actifs (max 5), suppression immédiate des entités mortes, et simplification des effets visuels sur les entités nombreuses

**Dégâts Instantanés (One-Shot)**
- Problème : Les collisions étant vérifiées 60 fois par seconde, toucher un ennemi causait des dégâts multiples instantanés
- Solution : Ajout d'une période d'invulnérabilité (i-frames) de 1.5 secondes après chaque coup reçu, avec clignotement visuel (`Player.damageCooldown`)

### Réussites

**Fluidité des Mouvements**
L'IA ne semble pas robotique ; les ennemis s'adaptent dynamiquement grâce aux forces de steering combinées. Le comportement `pursue` prédit la position future du joueur, rendant les ennemis plus dangereux.



**Expérience de Jeu ("Game Feel")**
- Effets visuels d'explosion
- Dash avec traînée visuelle
- Barre de vie sur les ennemis
- UI moderne avec panneaux glassmorphism
- Effets sonores pour chaque action

### Utilisation de l'IA Générative

Des outils LLM (Antigravity, ChatGPT) ont assisté le développement pour :

**Refactoring et Optimisation**
- Optimisation des méthodes de calcul vectoriel
- Restructuration du code en classes ES6 modulaires

**Génération d'Assets**
- Assistance pour le design de l'interface utilisateur
- Création des effets visuels (particules, explosions)

**Debugging**
- Identification des problèmes de scope dans les callbacks audio
- Résolution des conflits de collision

**Exemples de prompts utilisés :**
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

Ce projet a permis de valider la maîtrise des concepts d'IA appliqués aux jeux vidéo. Le résultat est un jeu complet, techniquement solide et ludique. L'utilisation des Steering Behaviors offre une complexité émergente fascinante : des règles simples appliquées individuellement créent des comportements de groupe complexes et réalistes.

Le comportement de `pursue` combiné avec `separate` permet aux ennemis de chasser le joueur de manière coordonnée sans se percuter. Le `wander` du serpent crée un mouvement naturel et imprévisible. La mécanique d'explosion aux bordures crée une stratégie unique où le joueur doit attirer les ennemis vers les bords.

### Pistes d'amélioration futures

- Sauvegarde du meilleur score (LocalStorage)
- Ajout de comportements de flocking complets (cohésion, alignement) pour des nuées d'ennemis
- Nouveaux types de steering : `wander` pour des ennemis passifs, `flee` pour des proies
- Mode Boss avec ennemi utilisant `evade` pour esquiver les obstacles
- Portage sur mobile (contrôles tactiles)
- Système de power-ups avec types variés

---

**Projet universitaire - Master 2 Intelligence Artificielle**
