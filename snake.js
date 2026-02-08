/*
  Snake classes - wandering enemy that player must avoid
  Per rules.md: Extends Vehicle, uses steering behaviors
  
  Snake: Base class with head and body segments (anneaux)
  SnakeWander: Extends Snake, head uses wander behavior
*/

class Snake {
    constructor(x, y, length = 8, taille = 20, couleur = [80, 200, 80]) {
        this.length = length;
        this.taille = taille;
        this.couleur = couleur;

        // Head is a Vehicle for steering behaviors
        this.head = new Vehicle(x, y);
        this.head.maxSpeed = 2.5;
        this.head.maxForce = 0.1;
        this.head.r_pourDessin = taille;
        this.head.r = taille;
        this.head.distanceCercle = 150;
        this.head.wanderRadius = 60;
        this.head.displaceRange = 0.2;

        // Body segments (anneaux) - each is a Vehicle
        this.anneaux = [this.head];
        for (let i = 1; i < length; i++) {
            let anneau = new Vehicle(x - i * taille * 0.8, y);
            anneau.maxSpeed = 4;
            anneau.maxForce = 0.3;
            // Size tapers from head to tail
            anneau.r_pourDessin = taille * (1 - i * 0.06);
            anneau.r = anneau.r_pourDessin;
            this.anneaux.push(anneau);
        }
    }

    move() {
        // To be overridden by subclasses
    }

    checkPlayerCollision(player) {
        if (player.isExploding || player.isDashing) return false;

        for (let i = 0; i < this.anneaux.length; i++) {
            let anneau = this.anneaux[i];
            let d = p5.Vector.dist(anneau.pos, player.pos);
            if (d < anneau.r + player.r * 0.5) {
                return player.loseHeart();
            }
        }
        return false;
    }

    show() {
        // Draw connections between segments
        push();
        strokeCap(ROUND);
        for (let i = 1; i < this.anneaux.length; i++) {
            let prev = this.anneaux[i - 1];
            let curr = this.anneaux[i];
            let alpha = map(i, 0, this.anneaux.length, 255, 100);
            stroke(this.couleur[0], this.couleur[1], this.couleur[2], alpha);
            strokeWeight(curr.r_pourDessin * 1.8);
            line(prev.pos.x, prev.pos.y, curr.pos.x, curr.pos.y);
        }
        pop();

        // Draw each segment
        for (let i = this.anneaux.length - 1; i >= 0; i--) {
            let anneau = this.anneaux[i];
            let alpha = map(i, 0, this.anneaux.length, 255, 150);

            push();
            translate(anneau.pos.x, anneau.pos.y);
            noStroke();

            // Color gradient from head to tail
            let r = map(i, 0, this.anneaux.length, this.couleur[0], this.couleur[0] * 0.5);
            let g = map(i, 0, this.anneaux.length, this.couleur[1], this.couleur[1] * 0.6);
            let b = map(i, 0, this.anneaux.length, this.couleur[2], this.couleur[2] * 0.5);
            fill(r, g, b, alpha);
            ellipse(0, 0, anneau.r_pourDessin * 2);

            // Head details: eyes and tongue
            if (i === 0) {
                let angle = this.head.vel.heading();

                // Animated forked tongue
                let tongueLength = 15 + sin(frameCount * 0.4) * 8;
                stroke(255, 80, 80);
                strokeWeight(3);
                let tongueBaseX = cos(angle) * anneau.r_pourDessin;
                let tongueBaseY = sin(angle) * anneau.r_pourDessin;
                let tongueTipX = tongueBaseX + cos(angle) * tongueLength;
                let tongueTipY = tongueBaseY + sin(angle) * tongueLength;
                line(tongueBaseX, tongueBaseY, tongueTipX, tongueTipY);
                // Forked tips
                strokeWeight(2);
                line(tongueTipX, tongueTipY, tongueTipX + cos(angle + 0.5) * 6, tongueTipY + sin(angle + 0.5) * 6);
                line(tongueTipX, tongueTipY, tongueTipX + cos(angle - 0.5) * 6, tongueTipY + sin(angle - 0.5) * 6);
                noStroke();

                // Eyes
                let eyeOffset = anneau.r_pourDessin * 0.5;
                fill(0);
                ellipse(cos(angle + 0.6) * eyeOffset, sin(angle + 0.6) * eyeOffset, 8);
                ellipse(cos(angle - 0.6) * eyeOffset, sin(angle - 0.6) * eyeOffset, 8);
                // Pupils (looking forward)
                fill(255, 255, 0);
                ellipse(cos(angle + 0.6) * eyeOffset + cos(angle) * 2, sin(angle + 0.6) * eyeOffset + sin(angle) * 2, 4);
                ellipse(cos(angle - 0.6) * eyeOffset + cos(angle) * 2, sin(angle - 0.6) * eyeOffset + sin(angle) * 2, 4);
            }

            pop();
        }
    }
}

class SnakeWander extends Snake {
    constructor(x, y, length = 8, taille = 20, couleur = [80, 200, 80]) {
        super(x, y, length, taille, couleur);

        this.wanderWeight = 0.5;
        this.boundariesWeight = 0.2;
    }

    move() {
        // Head wanders
        let forceWander = this.head.wander();
        // Head stays within screen boundaries
        let forceBoundaries = this.head.boundaries(0, 0, width, height, 50);

        // Apply weights to forces
        forceWander.mult(this.wanderWeight);
        forceBoundaries.mult(this.boundariesWeight);

        // Apply forces to head
        this.head.applyForce(forceWander);
        this.head.applyForce(forceBoundaries);

        this.head.update();

        // Each segment follows the previous one using arrive
        for (let i = 1; i < this.anneaux.length; i++) {
            let anneau = this.anneaux[i];
            let anneauPrecedent = this.anneaux[i - 1];
            let forceSuivi = anneau.arrive(anneauPrecedent.pos, 15);
            anneau.applyForce(forceSuivi);
            anneau.update();
        }
    }
}
