/*
  FlyingEnemy class - enemies that fly from top to bottom
  Player loses a heart if touched
*/

// Constants
const FLYING_ENEMY_SPEED = 5;
const FLYING_ENEMY_SIZE = 23;

class FlyingEnemy {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, FLYING_ENEMY_SPEED);
        this.r = FLYING_ENEMY_SIZE;
    }

    update() {
        this.pos.add(this.vel);
    }

    isOffScreen() {
        return this.pos.y > height + this.r;
    }

    checkPlayerCollision(player) {
        if (player.isExploding || player.isDashing) return false;

        let d = p5.Vector.dist(this.pos, player.pos);
        if (d < this.r + player.r) {
            return player.loseHeart();
        }
        return false;
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        imageMode(CENTER);
        let imgSize = this.r * 2;

        if (flyingEnemyImg && flyingEnemyImg.width > 0) {
            rotate(PI / 2);
            image(flyingEnemyImg, 0, 0, imgSize, imgSize);
        } else {
            fill(255, 50, 50);
            stroke(200, 0, 0);
            strokeWeight(3);
            triangle(0, imgSize / 2, -imgSize / 3, -imgSize / 3, imgSize / 3, -imgSize / 3);

            fill(255, 255, 0);
            noStroke();
            ellipse(-8, -5, 8, 8);
            ellipse(8, -5, 8, 8);
        }

        pop();
    }
}
