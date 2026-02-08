/*
  Pursuer class - extends Vehicle
  AI that chases the player while avoiding obstacles
  Has lifetime - explodes when expired or when hitting boundary
  Health increases with each level
  
  Per rules.md: Extends Vehicle, overrides applyBehaviors() and show()
*/

// Constants
const PURSUER_MAX_SPEED = 4;
const PURSUER_MAX_FORCE = 0.15;
const PURSUER_SIZE = 18;
const PURSUE_WEIGHT = 1;
const AVOID_WEIGHT = 4;
const SEPARATE_WEIGHT = 1.5;
const PURSUER_BOUNDARY_WEIGHT = 2;
const PURSUER_BASE_LIFETIME = 900;

class Pursuer extends Vehicle {
    constructor(x, y, lifetime) {
        super(x, y);
        this.maxSpeed = PURSUER_MAX_SPEED;
        this.maxForce = PURSUER_MAX_FORCE;
        this.r_pourDessin = PURSUER_SIZE;
        this.r = PURSUER_SIZE * 3;
        this.color = color(255, 100, 100);

        // Lifetime system
        this.lifetime = lifetime || PURSUER_BASE_LIFETIME;
        this.maxLifetime = this.lifetime;
        this.isExploding = false;
        this.explosionTimer = 30;

        // Random initial velocity
        this.vel = p5.Vector.random2D();
        this.vel.mult(2);
    }

    // Check if pursuer touches boundary - explode if so
    checkBoundary() {
        if (this.isExploding) return false;

        if (this.pos.x < BOUNDARY_MARGIN || this.pos.x > width - BOUNDARY_MARGIN ||
            this.pos.y < BOUNDARY_MARGIN || this.pos.y > height - BOUNDARY_MARGIN) {
            this.isExploding = true;
            return true;
        }
        return false;
    }

    // Override: Combine pursue + avoid + separate (no boundary force - they explode instead)
    applyBehaviors(player, obstacles, otherPursuers) {
        if (this.isExploding) return;

        // 1. Pursue the player
        let pursueForce = this.pursue(player);
        pursueForce.mult(PURSUE_WEIGHT);

        // 2. Avoid obstacles
        let avoidForce = this.avoid(obstacles);
        avoidForce.mult(AVOID_WEIGHT);

        // 3. Separate from other pursuers
        let separateForce = this.separate(otherPursuers);
        separateForce.mult(SEPARATE_WEIGHT);

        // Apply forces
        this.applyForce(pursueForce);
        this.applyForce(avoidForce);
        this.applyForce(separateForce);
    }

    update() {
        if (this.isExploding) {
            this.explosionTimer--;
            return;
        }

        this.lifetime--;

        if (this.lifetime <= 0) {
            this.isExploding = true;
        }

        super.update();
    }

    isDead() {
        return this.isExploding && this.explosionTimer <= 0;
    }

    canDamage() {
        return !this.isExploding;
    }

    show() {
        if (this.isExploding) {
            this.showExplosion();
            return;
        }

        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());

        // Draw sprite image
        imageMode(CENTER);
        let imgSize = this.r_pourDessin * 3;
        image(enemyImg, 0, 0, imgSize, imgSize);

        pop();

        this.drawLifetimeBar();
    }

    drawLifetimeBar() {
        let barWidth = 30;
        let barHeight = 4;
        let lifePercent = this.lifetime / this.maxLifetime;

        push();
        fill(50, 150);
        noStroke();
        rect(this.pos.x - barWidth / 2, this.pos.y - this.r_pourDessin - 10, barWidth, barHeight);

        let lifeColor = lerpColor(color(255, 0, 0), color(0, 255, 0), lifePercent);
        fill(lifeColor);
        rect(this.pos.x - barWidth / 2, this.pos.y - this.r_pourDessin - 10, barWidth * lifePercent, barHeight);
        pop();
    }

    showExplosion() {
        push();
        translate(this.pos.x, this.pos.y);

        let progress = 1 - (this.explosionTimer / 30);
        let size = sin(progress * PI) * 60;

        noStroke();
        fill(255, 200, 0, 200 - progress * 200);
        ellipse(0, 0, size * 1.5);
        fill(255, 100, 0, 200 - progress * 200);
        ellipse(0, 0, size);
        fill(255, 50, 0, 200 - progress * 200);
        ellipse(0, 0, size * 0.5);

        pop();
    }
}
