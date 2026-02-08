/*
  SkySurvivor - Main sketch
  
  Controls:
  - ZQSD/WASD: Move player
  - E: Dash
  - SPACE or Left Click: Drop obstacle
  
  Game mechanics:
  - Player has 3 hearts (persists across levels)
  - Touching boundary = lose a heart
  - Pursuers explode on boundary contact
  - Hearts spawn randomly to heal
  - Pursuers have more lifetime in later levels
  - 3 levels with increasing difficulty
*/

// Game entities
let player;
let pursuers = [];
let obstacles = [];
let hearts = [];
let dashPickups = [];
let flyingEnemies = [];
// Sprite images
let playerImg;
let enemyImg;
let obstacleImg;
let flyingEnemyImg;
let heartImg;
let dashImg;

// Level configuration - balanced speed
const LEVEL_CONFIG = [
    { pursuers: 3, lifetime: 4000, speed: 3, boundary: 20 },     // Level 1: ~1 min
    { pursuers: 5, lifetime: 5000, speed: 3.3, boundary: 100 },  // Level 2: ~1.5 min
    { pursuers: 8, lifetime: 6000, speed: 3.6, boundary: 150 }   // Level 3: ~1.5 min
];

// Game state
let currentLevel = 0;
let gameState = "playing";
let stateTimer = 0;

// Obstacle settings
const OBSTACLE_COOLDOWN = 20;
let dropCooldown = 0;

// Flying enemy spawn settings
const FLYING_SPAWN_CHANCE = 0.03;

// Preload images
function preload() {
    playerImg = loadImage('assets/thunder-plane-airplane-red-plane-game-plane-pixel-sprite-airplane-thumbnail-removebg-preview.png');
    enemyImg = loadImage('assets/enemy.png');
    obstacleImg = loadImage('assets/OBSTACLE-removebg-preview.png');
    flyingEnemyImg = loadImage('assets/FLYING_ENAMY-removebg-preview.png');
    heartImg = loadImage('assets/heart.png');
    dashImg = loadImage('assets/dash.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    startLevel(currentLevel);
}

function startLevel(levelIndex) {
    pursuers = [];
    obstacles = [];
    hearts = [];
    dashPickups = [];
    flyingEnemies = [];

    let config = LEVEL_CONFIG[levelIndex];

    // Set boundary margin for this level
    BOUNDARY_MARGIN = config.boundary;

    if (!player) {
        player = new Player(width / 2, height / 2);
    } else {
        player.resetPosition(width / 2, height / 2);
    }

    // Create pursuers with level-based lifetime
    for (let i = 0; i < config.pursuers; i++) {
        let x, y;
        // Spawn inside play area but away from player
        do {
            x = random(BOUNDARY_MARGIN + 50, width - BOUNDARY_MARGIN - 50);
            y = random(BOUNDARY_MARGIN + 50, height - BOUNDARY_MARGIN - 50);
        } while (dist(x, y, player.pos.x, player.pos.y) < 200);

        let p = new Pursuer(x, y, config.lifetime);
        p.maxSpeed = config.speed;
        pursuers.push(p);
    }

    gameState = "playing";
}

function draw() {
    background(30, 40, 60);

    // Draw boundary zone
    drawBoundaryZone();

    // Draw snow pattern
    drawSnowPattern();

    switch (gameState) {
        case "playing":
            updateGame();
            break;
        case "levelComplete":
            drawLevelComplete();
            break;
        case "gameOver":
            drawGameOver();
            break;
        case "victory":
            drawVictory();
            break;
    }

    drawUI();
}

function updateGame() {
    if (dropCooldown > 0) dropCooldown--;

    // Spawn flying enemies as a wave of 6-7 every ~3 seconds
    if (frameCount % 180 === 0) {
        // Pick a random X position anywhere on screen
        let baseX = 100 + Math.random() * (width - 200);
        let waveSize = 6 + Math.floor(Math.random() * 2); // 6 or 7

        for (let i = 0; i < waveSize; i++) {
            let fx = baseX + (Math.random() - 0.5) * 100;
            if (fx < 50) fx = 50;
            if (fx > width - 50) fx = width - 50;
            let fy = -30 - Math.random() * 50;
            flyingEnemies.push(new FlyingEnemy(fx, fy));
        }
    }

    // Spawn hearts every ~10 seconds at truly random position
    if (frameCount % 600 === 0 && hearts.length < 2) {
        let hx = 100 + Math.random() * (width - 200);
        let hy = 100 + Math.random() * (height - 200);
        hearts.push(new Heart(hx, hy));
    }

    // Spawn dash pickups every ~15 seconds at truly random position
    if (frameCount % 900 === 0 && dashPickups.length < 2) {
        let dx = 100 + Math.random() * (width - 200);
        let dy = 100 + Math.random() * (height - 200);
        dashPickups.push(new DashPickup(dx, dy));
    }

    // ===== PLAYER =====
    player.applyBehaviors();
    player.update();
    player.checkBoundary();
    player.show();
    player.drawHearts();
    player.drawDashCharges();

    if (player.hearts <= 0 && player.isDead()) {
        gameState = "gameOver";
        stateTimer = 180;
        return;
    }

    // ===== FLYING ENEMIES =====
    for (let i = flyingEnemies.length - 1; i >= 0; i--) {
        flyingEnemies[i].update();
        flyingEnemies[i].checkPlayerCollision(player);
        flyingEnemies[i].show();

        if (flyingEnemies[i].isOffScreen()) {
            flyingEnemies.splice(i, 1);
        }
    }

    // ===== HEARTS =====
    for (let i = hearts.length - 1; i >= 0; i--) {
        hearts[i].update();
        hearts[i].checkCollision(player);
        hearts[i].show();

        if (hearts[i].isDead()) {
            hearts.splice(i, 1);
        }
    }

    // ===== DASH PICKUPS =====
    for (let i = dashPickups.length - 1; i >= 0; i--) {
        dashPickups[i].update();
        dashPickups[i].checkCollision(player);
        dashPickups[i].show();

        if (dashPickups[i].isDead()) {
            dashPickups.splice(i, 1);
        }
    }

    // ===== OBSTACLES =====
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        // Check explosion damage to pursuers and player
        obstacles[i].checkExplosionDamage(pursuers);
        obstacles[i].checkPlayerDamage(player);

        obstacles[i].show();

        if (obstacles[i].isDead()) {
            obstacles.splice(i, 1);
        }
    }

    // ===== PURSUERS =====
    for (let i = pursuers.length - 1; i >= 0; i--) {
        let pursuer = pursuers[i];

        pursuer.applyBehaviors(player, obstacles, pursuers);
        pursuer.update();
        pursuer.checkBoundary();
        pursuer.show();

        // Check collision with player
        if (pursuer.canDamage()) {
            let d = p5.Vector.dist(player.pos, pursuer.pos);
            if (d < player.r + pursuer.r_pourDessin) {
                if (player.loseHeart()) {
                    // Push pursuer away after hit
                    let pushDir = p5.Vector.sub(pursuer.pos, player.pos);
                    pushDir.setMag(10);
                    pursuer.vel.add(pushDir);
                }
            }
        }

        if (pursuer.isDead()) {
            pursuers.splice(i, 1);
        }
    }

    // Check level complete
    if (pursuers.length === 0) {
        if (currentLevel < LEVEL_CONFIG.length - 1) {
            gameState = "levelComplete";
            stateTimer = 120;
        } else {
            gameState = "victory";
            stateTimer = 300;
        }
    }
}

function mousePressed() {
    if (mouseButton === LEFT && gameState === "playing" && dropCooldown <= 0) {
        obstacles.push(player.dropObstacle());
        dropCooldown = OBSTACLE_COOLDOWN;
    }

    if (gameState === "levelComplete" && stateTimer <= 0) {
        currentLevel++;
        startLevel(currentLevel);
    }

    if (gameState === "gameOver" && stateTimer <= 0) {
        currentLevel = 0;
        player.fullReset(width / 2, height / 2);
        startLevel(currentLevel);
    }

    if (gameState === "victory" && stateTimer <= 0) {
        currentLevel = 0;
        player.fullReset(width / 2, height / 2);
        startLevel(currentLevel);
    }
}

function keyPressed() {
    if (gameState !== "playing") return;

    // E to dash
    if (key === 'e' || key === 'E') {
        player.dash();
    }

    // SPACE to drop obstacle
    if (key === ' ' && dropCooldown <= 0) {
        obstacles.push(player.dropObstacle());
        dropCooldown = OBSTACLE_COOLDOWN;
    }
}
function drawBoundaryZone() {
    // Draw thin white boundary line
    push();
    noFill();
    stroke(255, 255, 255, 200);
    strokeWeight(3);
    rect(BOUNDARY_MARGIN, BOUNDARY_MARGIN,
        width - BOUNDARY_MARGIN * 2, height - BOUNDARY_MARGIN * 2);
    pop();
}

function drawLevelComplete() {
    stateTimer--;

    fill(0, 150);
    rect(0, 0, width, height);

    fill(0, 255, 100);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("LEVEL " + (currentLevel + 1) + " COMPLETE!", width / 2, height / 2 - 30);

    if (stateTimer <= 0) {
        fill(255);
        textSize(24);
        text("Click to continue", width / 2, height / 2 + 30);
    }
}

function drawGameOver() {
    stateTimer--;

    fill(100, 0, 0, 150);
    rect(0, 0, width, height);

    fill(255, 50, 50);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 30);

    if (stateTimer <= 0) {
        fill(255);
        textSize(24);
        text("Click to restart", width / 2, height / 2 + 40);
    }
}

function drawVictory() {
    stateTimer--;

    fill(50, 50, 0, 150);
    rect(0, 0, width, height);

    fill(255, 215, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("YOU WIN!", width / 2, height / 2 - 30);

    fill(255);
    textSize(24);
    text("All 3 levels completed!", width / 2, height / 2 + 20);

    if (stateTimer <= 0) {
        text("Click to play again", width / 2, height / 2 + 60);
    }
}

function drawSnowPattern() {
    noStroke();
    fill(255, 255, 255, 30);

    randomSeed(42);
    for (let i = 0; i < 100; i++) {
        let x = random(width);
        let y = (random(height) + frameCount * 0.5) % height;
        ellipse(x, y, 3, 3);
    }
}

function drawUI() {
    fill(255);
    noStroke();
    textSize(24);
    textAlign(LEFT, TOP);
    text("LEVEL " + (currentLevel + 1) + " / 3", 20, 20);

    textSize(14);
    text("ZQSD/WASD: Move", 20, 50);
    text("E: Dash | SPACE: Drop Obstacle", 20, 70);
    text("⚠️ Don't touch red borders!", 20, 90);

    textAlign(RIGHT, TOP);
    text("Obstacles: " + obstacles.length, width - 20, 20);

    let active = pursuers.filter(p => !p.isExploding).length;
    text("Pursuers: " + active + " / " + LEVEL_CONFIG[currentLevel].pursuers, width - 20, 40);

    if (dropCooldown > 0 && gameState === "playing") {
        fill(255, 100, 100);
        textAlign(CENTER, CENTER);
        textSize(12);
        text("Reloading...", width / 2, 30);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
