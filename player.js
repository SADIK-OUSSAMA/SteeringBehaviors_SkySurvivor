/*
  Player class - extends Vehicle
  Controlled with mouse, left click to drop obstacles
  Has heart-based health system (persists across levels)
  Has dash ability (collectible pickup)
  Explodes if touches boundaries
  
  Per rules.md: Extends Vehicle, overrides applyBehaviors() and show()
*/

// Constants
const PLAYER_MAX_SPEED = 6;
const PLAYER_MAX_FORCE = 0.4;
const PLAYER_SIZE = 25;
let BOUNDARY_MARGIN = 20; // Will be set per level
const PLAYER_MAX_HEARTS = 3;
const DAMAGE_COOLDOWN = 90;
const DASH_SPEED = 40;      // Faster dash
const DASH_DURATION = 30;   // Half second (30 frames at 60fps)

class Player extends Vehicle {
    constructor(x, y) {
        super(x, y);
        this.maxSpeed = PLAYER_MAX_SPEED;
        this.maxForce = PLAYER_MAX_FORCE;
        this.r_pourDessin = PLAYER_SIZE;
        this.r = PLAYER_SIZE * 2;
        this.color = "cyan";

        // Heart-based health system
        this.hearts = PLAYER_MAX_HEARTS;
        this.maxHearts = PLAYER_MAX_HEARTS;
        this.damageCooldown = 0;
        this.isHit = false;

        // Explosion state
        this.isExploding = false;
        this.explosionTimer = 30;

        // Dash ability
        this.dashCharges = 0;
        this.maxDashCharges = 3;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = createVector(0, 0);
    }

    // Override: Follow mouse position using arrive behavior
    applyBehaviors() {
        if (this.isExploding) return;

        // Handle dash
        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
            return; // Don't apply normal movement while dashing
        }

        // ZQSD / WASD / Arrow keys movement
        let moveDir = createVector(0, 0);

        // Up: W or Z or UP_ARROW
        if (keyIsDown(87) || keyIsDown(90) || keyIsDown(UP_ARROW)) {
            moveDir.y -= 1;
        }
        // Down: S or DOWN_ARROW
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
            moveDir.y += 1;
        }
        // Left: A or Q or LEFT_ARROW
        if (keyIsDown(65) || keyIsDown(81) || keyIsDown(LEFT_ARROW)) {
            moveDir.x -= 1;
        }
        // Right: D or RIGHT_ARROW
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
            moveDir.x += 1;
        }

        // Apply movement force
        if (moveDir.mag() > 0) {
            moveDir.normalize();
            moveDir.mult(this.maxForce * 3);
            this.applyForce(moveDir);
        } else {
            // Slow down when no keys pressed
            this.vel.mult(0.9);
        }

        // Update damage cooldown
        if (this.damageCooldown > 0) {
            this.damageCooldown--;
            this.isHit = true;
        } else {
            this.isHit = false;
        }
    }

    // Dash forward in current direction
    dash() {
        if (this.dashCharges > 0 && !this.isDashing && !this.isExploding) {
            this.dashCharges--;
            this.isDashing = true;
            this.dashTimer = DASH_DURATION;

            // Dash in current velocity direction (or forward if stationary)
            if (this.vel.mag() > 0.5) {
                this.dashDirection = this.vel.copy();
            } else {
                this.dashDirection = createVector(1, 0); // Default right
            }
            this.dashDirection.setMag(DASH_SPEED);
            this.vel = this.dashDirection.copy();
            return true;
        }
        return false;
    }

    // Add a dash charge
    addDash() {
        if (this.dashCharges < this.maxDashCharges) {
            this.dashCharges++;
            return true;
        }
        return false;
    }

    // Check if player touches boundary
    checkBoundary() {
        if (this.isExploding) return false;

        if (this.pos.x < BOUNDARY_MARGIN || this.pos.x > width - BOUNDARY_MARGIN ||
            this.pos.y < BOUNDARY_MARGIN || this.pos.y > height - BOUNDARY_MARGIN) {
            this.loseHeart();
            this.pos.x = constrain(this.pos.x, BOUNDARY_MARGIN + 10, width - BOUNDARY_MARGIN - 10);
            this.pos.y = constrain(this.pos.y, BOUNDARY_MARGIN + 10, height - BOUNDARY_MARGIN - 10);
            this.vel.mult(-0.5);
            this.isDashing = false;
            return true;
        }
        return false;
    }

    loseHeart() {
        if (this.damageCooldown <= 0) {
            this.hearts--;
            this.damageCooldown = DAMAGE_COOLDOWN;
            if (this.hearts <= 0) {
                this.hearts = 0;
                this.isExploding = true;
            }
            return true;
        }
        return false;
    }

    gainHeart() {
        if (this.hearts < this.maxHearts) {
            this.hearts++;
            return true;
        }
        return false;
    }

    isDead() {
        return this.isExploding && this.explosionTimer <= 0;
    }

    update() {
        if (this.isExploding) {
            this.explosionTimer--;
            return;
        }
        super.update();
    }

    resetPosition(x, y) {
        this.pos.set(x, y);
        this.vel.set(0, 0);
        this.acc.set(0, 0);
        this.damageCooldown = 0;
        this.isExploding = false;
        this.explosionTimer = 30;
        this.isDashing = false;
    }

    fullReset(x, y) {
        this.resetPosition(x, y);
        this.hearts = this.maxHearts;
        this.dashCharges = 0;
    }

    dropObstacle() {
        return new Obstacle(this.pos.x, this.pos.y + 30);
    }

    show() {
        if (this.isExploding) {
            this.showExplosion();
            return;
        }

        push();
        translate(this.pos.x, this.pos.y);

        if (this.isHit && frameCount % 10 < 5) {
            pop();
            return;
        }

        // Rotate to face movement direction
        if (this.vel.mag() > 0.5) {
            rotate(this.vel.heading());
        }

        // Dash trail effect
        if (this.isDashing) {
            noStroke();
            fill(0, 200, 255, 100);
            ellipse(-30, 0, 40, 20);
            ellipse(-50, 0, 30, 15);
        }

        // Draw sprite image
        imageMode(CENTER);
        let imgSize = this.r_pourDessin * 3;
        image(playerImg, 0, 0, imgSize, imgSize);

        pop();
    }

    showExplosion() {
        push();
        translate(this.pos.x, this.pos.y);

        let progress = 1 - (this.explosionTimer / 30);
        let size = sin(progress * PI) * 80;

        noStroke();
        fill(0, 200, 255, 200 - progress * 200);
        ellipse(0, 0, size * 1.5);
        fill(100, 255, 255, 200 - progress * 200);
        ellipse(0, 0, size);
        fill(255, 255, 255, 200 - progress * 200);
        ellipse(0, 0, size * 0.5);

        pop();
    }

    drawHearts() {
        const heartSize = 35;
        const startX = 25;
        const startY = height - 50;

        for (let i = 0; i < this.maxHearts; i++) {
            push();
            translate(startX + i * (heartSize + 5), startY);
            imageMode(CENTER);

            image(heartImg, 0, 0, heartSize, heartSize);

            // Draw dark overlay for empty hearts (instead of slow tint)
            if (i >= this.hearts) {
                noStroke();
                fill(30, 40, 60, 180);
                ellipse(0, 0, heartSize, heartSize);
            }

            pop();
        }
    }

    drawDashCharges() {
        const boltSize = 35;
        const startX = 25 + (this.maxHearts * 40) + 20;
        const startY = height - 50;

        for (let i = 0; i < this.maxDashCharges; i++) {
            push();
            translate(startX + i * (boltSize + 5), startY);
            imageMode(CENTER);

            image(dashImg, 0, 0, boltSize, boltSize);

            // Draw dark overlay for empty slots (instead of slow tint)
            if (i >= this.dashCharges) {
                noStroke();
                fill(30, 40, 60, 180);
                ellipse(0, 0, boltSize, boltSize);
            }

            pop();
        }
    }
}
