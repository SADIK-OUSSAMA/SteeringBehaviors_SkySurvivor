/*
  DashPickup class - gives player dash ability using dash.png
*/

const DASH_PICKUP_SIZE = 30;
const DASH_PICKUP_LIFETIME = 300;

class DashPickup {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = DASH_PICKUP_SIZE;
        this.lifetime = DASH_PICKUP_LIFETIME;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.lifetime--;
    }

    isDead() {
        return this.lifetime <= 0 || this.collected;
    }

    checkCollision(player) {
        if (this.collected) return false;
        let d = p5.Vector.dist(this.pos, player.pos);
        if (d < this.r + player.r) {
            if (player.addDash()) {
                this.collected = true;
                // Play collect sound
                if (typeof collectSound !== 'undefined' && collectSound && collectSound.isLoaded()) {
                    collectSound.setVolume(0.6);
                    collectSound.play();
                }
                return true;
            }
        }
        return false;
    }

    show() {
        if (this.collected) return;

        push();
        let floatY = Math.sin(frameCount * 0.1 + this.floatOffset) * 5;
        translate(this.pos.x, this.pos.y + floatY);

        let pulse = Math.sin(frameCount * 0.15) * 0.2 + 1;
        let alpha = map(this.lifetime, 0, DASH_PICKUP_LIFETIME, 100, 255);

        imageMode(CENTER);
        tint(255, alpha);
        image(dashImg, 0, 0, this.r * 2 * pulse, this.r * 2 * pulse);
        noTint();

        pop();
    }
}
