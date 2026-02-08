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
let snakes = [];
// Sprite images
let playerImg;
let enemyImg;
let obstacleImg;
let flyingEnemyImg;
let heartImg;
let dashImg;
// Sound effects
let bgMusic;
let collectSound;
let gameOverSound;
let gameStartSound;
let dashSound;
let heartReduceSound;
let gameWinSound;

// Level configuration - balanced speed
const LEVEL_CONFIG = [
    { pursuers: 3, lifetime: 4000, speed: 3, boundary: 20 },     // Level 1: ~1 min
    { pursuers: 5, lifetime: 5000, speed: 3.3, boundary: 100 },  // Level 2: ~1.5 min
    { pursuers: 8, lifetime: 6000, speed: 3.6, boundary: 150 }   // Level 3: ~1.5 min
];

// Game state
let currentLevel = 0;
let gameState = "menu";  // Start with menu
let stateTimer = 0;

// Obstacle settings
const OBSTACLE_COOLDOWN = 20;
let dropCooldown = 0;

// Flying enemy spawn settings
const FLYING_SPAWN_CHANCE = 0.03;

// Preload images and sounds
function preload() {
    playerImg = loadImage('assets/thunder-plane-airplane-red-plane-game-plane-pixel-sprite-airplane-thumbnail-removebg-preview.png');
    enemyImg = loadImage('assets/enemy.png');
    obstacleImg = loadImage('assets/OBSTACLE-removebg-preview.png');
    flyingEnemyImg = loadImage('assets/FLYING_ENAMY-removebg-preview.png');
    heartImg = loadImage('assets/heart.png');
    dashImg = loadImage('assets/dash.png');

    // Load sounds
    soundFormats('mp3');
    bgMusic = loadSound('assets/bg-music.mp3');
    collectSound = loadSound('assets/collect-points.mp3');
    gameOverSound = loadSound('assets/game-over.mp3');
    gameStartSound = loadSound('assets/game-start.mp3');
    dashSound = loadSound('assets/speeding.mp3');
    heartReduceSound = loadSound('assets/heart-reduce.mp3');
    gameWinSound = loadSound('assets/game-win.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    // Don't start level - stay in menu
    // gameState is already "menu" from initialization
}

function startLevel(levelIndex) {
    pursuers = [];
    obstacles = [];
    hearts = [];
    dashPickups = [];
    flyingEnemies = [];
    snakes = [];

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

    // Spawn one snake at level start
    let sx = random(100, width - 100);
    let sy = random(100, height - 100);
    snakes.push(new SnakeWander(sx, sy, 8, 18, [80, 180, 80]));

    gameState = "playing";
}

function draw() {
    background(30, 40, 60);

    // Draw snow pattern always
    drawSnowPattern();

    switch (gameState) {
        case "menu":
            drawMenu();
            break;
        case "playing":
            drawBoundaryZone();
            updateGame();
            break;
        case "levelComplete":
            drawBoundaryZone();
            drawLevelComplete();
            break;
        case "gameOver":
            drawGameOver();
            break;
        case "victory":
            drawVictory();
            break;
    }

    // Only draw UI when playing
    if (gameState === "playing") {
        drawUI();
    }
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
        // Play game over sound
        if (gameOverSound && gameOverSound.isLoaded()) {
            gameOverSound.play();
        }
        // Stop background music
        if (bgMusic && bgMusic.isPlaying()) {
            bgMusic.stop();
        }
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

    // ===== SNAKES =====
    for (let i = 0; i < snakes.length; i++) {
        snakes[i].move();
        snakes[i].checkPlayerCollision(player);
        snakes[i].show();
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
            // Play game win sound
            if (gameWinSound && gameWinSound.isLoaded()) {
                gameWinSound.play();
            }
            // Stop background music
            if (bgMusic && bgMusic.isPlaying()) {
                bgMusic.stop();
            }
        }
    }
}

function mousePressed() {
    // Menu - Start button click
    if (gameState === "menu") {
        let btnX = width / 2;
        let btnY = height / 2 + 30;
        let btnW = 220;
        let btnH = 60;

        if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 &&
            mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
            // Play game start sound
            if (gameStartSound && gameStartSound.isLoaded()) {
                gameStartSound.play();
            }
            // Start background music
            if (bgMusic && bgMusic.isLoaded() && !bgMusic.isPlaying()) {
                bgMusic.setVolume(0.15);
                bgMusic.loop();
            }
            player = null; // Reset player for fresh start
            currentLevel = 0;
            startLevel(0);
        }
        return;
    }

    // Playing - drop obstacle
    if (mouseButton === LEFT && gameState === "playing" && dropCooldown <= 0 && obstacles.length < 5) {
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
    // Allow starting game from menu with Enter or Space
    if (gameState === "menu" && (keyCode === ENTER || key === ' ')) {
        if (gameStartSound && gameStartSound.isLoaded()) {
            gameStartSound.play();
        }
        if (bgMusic && bgMusic.isLoaded() && !bgMusic.isPlaying()) {
            bgMusic.setVolume(0.3);
            bgMusic.loop();
        }
        player = null;
        currentLevel = 0;
        startLevel(0);
        return;
    }

    if (gameState !== "playing") return;

    // E or 0 to dash
    if (key === 'e' || key === 'E' || key === '0') {
        if (player.dash()) {
            // Play dash sound
            if (dashSound && dashSound.isLoaded()) {
                dashSound.setVolume(0.5);
                dashSound.play();
            }
        }
    }

    // SPACE or 1 to drop obstacle (max 5)
    if ((key === ' ' || key === '1') && dropCooldown <= 0 && obstacles.length < 5) {
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

// ===== START MENU =====
function drawMenu() {
    push();

    // Animated background particles
    for (let i = 0; i < 50; i++) {
        let x = (noise(i * 10, frameCount * 0.005) * width);
        let y = (noise(i * 20, frameCount * 0.003) * height);
        let size = noise(i * 30) * 8 + 2;
        fill(100, 180, 255, 50);
        noStroke();
        ellipse(x, y, size);
    }

    // Title with glow effect
    textAlign(CENTER, CENTER);
    for (let i = 5; i > 0; i--) {
        fill(0, 150, 255, 30);
        textSize(72 + i * 2);
        text("SKYSURVIVOR", width / 2, height / 3);
    }
    fill(255);
    textSize(72);
    textFont('Arial Black');
    text("SKYSURVIVOR", width / 2, height / 3);

    // Subtitle
    fill(150, 200, 255);
    textSize(18);
    textFont('Arial');
    text("A Steering Behaviors Game", width / 2, height / 3 + 50);

    // Start button with hover effect
    let btnX = width / 2;
    let btnY = height / 2 + 30;
    let btnW = 220;
    let btnH = 60;

    let isHover = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 &&
        mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

    // Button glow
    if (isHover) {
        for (let i = 3; i > 0; i--) {
            fill(0, 200, 100, 20);
            noStroke();
            rectMode(CENTER);
            rect(btnX, btnY, btnW + i * 10, btnH + i * 10, 15);
        }
    }

    // Button background
    fill(isHover ? color(0, 220, 100) : color(0, 180, 80));
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    rectMode(CENTER);
    rect(btnX, btnY, btnW, btnH, 12);

    // Button text
    fill(255);
    noStroke();
    textSize(28);
    textFont('Arial Black');
    text("▶ START GAME", btnX, btnY);

    // Controls panel
    let panelY = height / 2 + 140;
    fill(0, 0, 0, 100);
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    rect(width / 2, panelY, 350, 160, 15);

    fill(200, 220, 255);
    textSize(16);
    textFont('Arial');
    noStroke();
    text("━━━ CONTROLS ━━━", width / 2, panelY - 55);

    textAlign(LEFT, CENTER);
    let ctrlX = width / 2 - 140;
    fill(255);
    textSize(14);
    text("🎮  ZQSD / WASD / Arrows  →  Move", ctrlX, panelY - 25);
    text("⚡  E / 0  →  Dash", ctrlX, panelY);
    text("💣  SPACE / 1 / Click  →  Drop Obstacle", ctrlX, panelY + 25);
    text("❤️  Collect hearts to heal", ctrlX, panelY + 55);

    pop();
}

// ===== LEVEL COMPLETE SCREEN =====
function drawLevelComplete() {
    stateTimer--;

    push();
    // Dark overlay with gradient
    for (let y = 0; y < height; y += 10) {
        let alpha = map(y, 0, height, 100, 200);
        fill(0, 50, 30, alpha);
        noStroke();
        rect(0, y, width, 10);
    }

    // Success panel
    let panelY = height / 2;
    fill(0, 0, 0, 150);
    stroke(0, 255, 100, 150);
    strokeWeight(3);
    rectMode(CENTER);
    rect(width / 2, panelY, 450, 200, 20);

    // Animated stars
    for (let i = 0; i < 3; i++) {
        let starX = width / 2 - 80 + i * 80;
        let starY = panelY - 50;
        let bounce = sin(frameCount * 0.1 + i) * 5;
        fill(255, 215, 0);
        noStroke();
        drawStar(starX, starY + bounce, 20, 10, 5);
    }

    // Title
    fill(0, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(42);
    textFont('Arial Black');
    noStroke();
    text("LEVEL " + (currentLevel + 1) + " COMPLETE!", width / 2, panelY + 10);

    // Continue prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        fill(255, 255, 255, 255 * pulse);
        textSize(20);
        textFont('Arial');
        text("Click to continue →", width / 2, panelY + 60);
    }

    pop();
}

// ===== GAME OVER SCREEN =====
function drawGameOver() {
    stateTimer--;

    push();
    // Red gradient overlay
    for (let y = 0; y < height; y += 10) {
        let alpha = map(y, 0, height, 150, 220);
        fill(80, 0, 0, alpha);
        noStroke();
        rect(0, y, width, 10);
    }

    // Panel
    fill(0, 0, 0, 180);
    stroke(255, 50, 50, 200);
    strokeWeight(3);
    rectMode(CENTER);
    rect(width / 2, height / 2, 400, 220, 20);

    // Skull icon
    fill(255, 80, 80);
    textSize(60);
    textAlign(CENTER, CENTER);
    noStroke();
    text("💀", width / 2, height / 2 - 55);

    // Title with shake effect
    let shake = stateTimer > 100 ? random(-3, 3) : 0;
    fill(255, 50, 50);
    textSize(52);
    textFont('Arial Black');
    text("GAME OVER", width / 2 + shake, height / 2 + 10);

    // Stats
    fill(200, 150, 150);
    textSize(16);
    textFont('Arial');
    text("Reached Level " + (currentLevel + 1), width / 2, height / 2 + 50);

    // Restart prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        fill(255, 200, 200, 255 * pulse);
        textSize(20);
        text("Click to try again", width / 2, height / 2 + 85);
    }

    pop();
}

// ===== VICTORY SCREEN =====
function drawVictory() {
    stateTimer--;

    push();
    // Golden gradient overlay
    for (let y = 0; y < height; y += 10) {
        let alpha = map(y, 0, height, 80, 180);
        fill(60, 50, 0, alpha);
        noStroke();
        rect(0, y, width, 10);
    }

    // Animated confetti
    for (let i = 0; i < 30; i++) {
        let cx = (noise(i * 100, frameCount * 0.01) * width);
        let cy = ((frameCount * 2 + i * 50) % (height + 100)) - 50;
        let colors = [[255, 215, 0], [255, 100, 100], [100, 255, 100], [100, 200, 255]];
        let c = colors[i % 4];
        fill(c[0], c[1], c[2], 200);
        noStroke();
        push();
        translate(cx, cy);
        rotate(frameCount * 0.05 + i);
        rect(0, 0, 8, 12);
        pop();
    }

    // Victory panel
    fill(0, 0, 0, 150);
    stroke(255, 215, 0, 200);
    strokeWeight(4);
    rectMode(CENTER);
    rect(width / 2, height / 2, 500, 280, 25);

    // Trophy
    fill(255, 215, 0);
    textSize(80);
    textAlign(CENTER, CENTER);
    noStroke();
    text("🏆", width / 2, height / 2 - 70);

    // Title with glow
    for (let i = 3; i > 0; i--) {
        fill(255, 200, 0, 50);
        textSize(60 + i * 2);
        text("YOU WIN!", width / 2, height / 2 + 10);
    }
    fill(255, 215, 0);
    textSize(60);
    textFont('Arial Black');
    text("YOU WIN!", width / 2, height / 2 + 10);

    // Subtitle
    fill(255);
    textSize(20);
    textFont('Arial');
    text("All 3 levels completed!", width / 2, height / 2 + 60);

    // Play again prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        fill(255, 230, 150, 255 * pulse);
        textSize(22);
        text("Click to play again", width / 2, height / 2 + 105);
    }

    pop();
}

// Helper function to draw stars
function drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
        let sx = x + cos(a) * radius1;
        let sy = y + sin(a) * radius1;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius2;
        sy = y + sin(a + halfAngle) * radius2;
        vertex(sx, sy);
    }
    endShape(CLOSE);
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
    text("ZQSD/WASD/Arrows: Move", 20, 50);
    text("E/0: Dash | SPACE/1: Obstacle (max 5)", 20, 70);
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
