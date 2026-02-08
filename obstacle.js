/*
  Obstacle class - explosive obstacle dropped by player
  Explodes when lifetime expires, killing nearby pursuers
*/

// Constants
const OBSTACLE_RADIUS = 25;
const OBSTACLE_LIFETIME = 180; // frames before exploding
const EXPLOSION_RADIUS = 100; // damage radius when exploding

class Obstacle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = OBSTACLE_RADIUS;
        this.lifetime = OBSTACLE_LIFETIME;
        this.isExploding = false;
        this.explosionTimer = 25;
        this.explosionRadius = EXPLOSION_RADIUS;
    }

    update() {
        if (this.isExploding) {
            this.explosionTimer--;
            return;
        }

        this.lifetime--;

        // Start exploding when lifetime ends
        if (this.lifetime <= 0) {
            this.isExploding = true;
        }
    }

    isDead() {
        return this.isExploding && this.explosionTimer <= 0;
    }

    // Check if explosion kills a pursuer
    checkExplosionDamage(pursuers) {
        if (!this.isExploding || this.explosionTimer < 20) return; // Only check at start of explosion

        for (let pursuer of pursuers) {
            if (pursuer.isExploding) continue;

            let d = p5.Vector.dist(this.pos, pursuer.pos);
            if (d < this.explosionRadius) {
                pursuer.isExploding = true;
            }
        }
    }

    // Check if explosion damages player
    checkPlayerDamage(player) {
        if (!this.isExploding || this.explosionTimer < 20) return false;

        let d = p5.Vector.dist(this.pos, player.pos);
        if (d < this.explosionRadius) {
            return player.loseHeart();
        }
        return false;
    }

    show() {
        if (this.isExploding) {
            this.showExplosion();
            return;
        }

        push();

        // Pulse effect as lifetime decreases
        let pulse = 1 + sin(frameCount * 0.3) * 0.1;
        let alpha = 255;

        // Flash red when about to explode
        if (this.lifetime < 60) {
            if (frameCount % 10 < 5) {
                tint(255, 100, 100, alpha);
            }
        }

        // Draw sprite image
        imageMode(CENTER);
        let imgSize = this.r * 2 * pulse;
        image(obstacleImg, this.pos.x, this.pos.y, imgSize, imgSize);
        noTint();

        // Countdown indicator
        if (this.lifetime < 60) {
            fill(255, 0, 0);
            noStroke();
            textSize(12);
            textAlign(CENTER, CENTER);
            text(ceil(this.lifetime / 60), this.pos.x, this.pos.y - this.r - 10);
        }

        pop();
    }

    showExplosion() {
        push();
        translate(this.pos.x, this.pos.y);

        let progress = 1 - (this.explosionTimer / 25);
        let size = sin(progress * PI) * this.explosionRadius * 2;

        // Expanding explosion circles
        noStroke();
        fill(255, 200, 0, 200 - progress * 200);
        ellipse(0, 0, size * 1.2);
        fill(255, 150, 0, 200 - progress * 200);
        ellipse(0, 0, size * 0.8);
        fill(255, 100, 0, 200 - progress * 200);
        ellipse(0, 0, size * 0.4);
        fill(255, 255, 255, 150 - progress * 150);
        ellipse(0, 0, size * 0.2);

        pop();
    }
}
