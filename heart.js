/*
  Heart class - health pickup using heart.png
*/

const HEART_SIZE = 25;
const HEART_LIFETIME = 240;

class Heart {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = HEART_SIZE;
        this.lifetime = HEART_LIFETIME;
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
            if (player.gainHeart()) {
                this.collected = true;
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
        let alpha = map(this.lifetime, 0, HEART_LIFETIME, 100, 255);

        imageMode(CENTER);
        tint(255, alpha);
        image(heartImg, 0, 0, this.r * 2 * pulse, this.r * 2 * pulse);
        noTint();

        pop();
    }
}
