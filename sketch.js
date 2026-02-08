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
let obstacleExplosionSound;
let levelCompleteSound;
let obstaclePlaceSound;

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
    obstacleExplosionSound = loadSound('assets/obstacle explosion.mp3');
    levelCompleteSound = loadSound('assets/game-level-complete.mp3');
    obstaclePlaceSound = loadSound('assets/nikin-pop-up-something-160353.mp3');
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
            // Play level complete sound
            if (levelCompleteSound && levelCompleteSound.isLoaded()) {
                levelCompleteSound.play();
            }
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
        // Button coordinates - must match drawMenu()
        let panelCenterY = height / 2;
        let btnX = width / 2;
        let btnY = panelCenterY - 30;
        let btnW = 200;
        let btnH = 55;

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
        // Play obstacle place sound
        if (obstaclePlaceSound && obstaclePlaceSound.isLoaded()) {
            obstaclePlaceSound.play();
        }
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
        // Play obstacle place sound
        if (obstaclePlaceSound && obstaclePlaceSound.isLoaded()) {
            obstaclePlaceSound.play();
        }
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
    
    // ===== SMOOTH GRADIENT BACKGROUND =====
    let gradientTop = color(20, 30, 60);
    let gradientMid = color(30, 50, 80);
    let gradientBottom = color(15, 25, 45);
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c;
        if (inter < 0.5) {
            c = lerpColor(gradientTop, gradientMid, inter * 2);
        } else {
            c = lerpColor(gradientMid, gradientBottom, (inter - 0.5) * 2);
        }
        stroke(c);
        line(0, y, width, y);
    }
    
    // ===== SUBTLE STARS BACKGROUND =====
    noStroke();
    randomSeed(123);
    for (let i = 0; i < 60; i++) {
        let x = random(width);
        let y = random(height);
        let size = random(1, 3);
        let twinkle = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
        fill(255, 255, 255, 50 + twinkle * 80);
        ellipse(x, y, size, size);
    }
    
    // ===== FLOATING PARTICLES =====
    for (let i = 0; i < 30; i++) {
        let x = (noise(i * 10, frameCount * 0.002) * (width + 100)) - 50;
        let y = (noise(i * 20, frameCount * 0.001) * height);
        let size = noise(i * 30) * 8 + 2;
        let alpha = 30 + sin(frameCount * 0.02 + i) * 15;
        fill(100, 180, 255, alpha);
        noStroke();
        ellipse(x, y, size, size);
    }
    
    // ===== ANIMATED PLANE DECORATION =====
    push();
    let planeX = width / 2 + 180;
    let planeY = height / 2 - 180 + sin(frameCount * 0.03) * 10;
    translate(planeX, planeY);
    rotate(-0.3);
    scale(0.8);
    
    // Draw a simple plane silhouette
    fill(255, 255, 255, 40);
    noStroke();
    // Body
    ellipse(0, 0, 60, 18);
    // Wings
    triangle(-5, 0, 10, -30, 10, 0);
    triangle(-5, 0, 10, 30, 10, 0);
    // Tail
    triangle(-25, 0, -30, -12, -20, 0);
    triangle(-25, 0, -30, 12, -20, 0);
    pop();
    
    // ===== MAIN CARD PANEL =====
    let panelCenterY = height / 2;
    let panelW = min(420, width - 80);
    let panelH = 380;
    
    // Card shadow
    fill(0, 0, 0, 30);
    noStroke();
    rectMode(CENTER);
    rect(width / 2 + 4, panelCenterY + 4, panelW, panelH, 24);
    
    // Card background - darker, more solid
    fill(25, 35, 55, 240);
    stroke(80, 120, 180, 60);
    strokeWeight(1);
    rect(width / 2, panelCenterY, panelW, panelH, 24);
    
    // Top accent line
    stroke(0, 200, 150, 150);
    strokeWeight(3);
    line(width / 2 - panelW / 3, panelCenterY - panelH / 2 + 1, 
         width / 2 + panelW / 3, panelCenterY - panelH / 2 + 1);
    
    // ===== TITLE =====
    let titleY = panelCenterY - 130;
    
    // Glow effect
    textAlign(CENTER, CENTER);
    textFont('Arial Black');
    for (let i = 4; i > 0; i--) {
        fill(0, 200, 180, 8);
        textSize(44 + i * 2);
        text("SKYSURVIVOR", width / 2, titleY);
    }
    
    // Main title
    fill(255, 255, 255);
    textSize(44);
    text("SKYSURVIVOR", width / 2, titleY);
    
    // Subtitle
    fill(100, 180, 200, 200);
    textSize(14);
    textFont('Arial');
    text("A Steering Behaviors Game", width / 2, titleY + 35);
    
    // ===== START BUTTON =====
    let btnX = width / 2;
    let btnY = panelCenterY - 30;
    let btnW = 200;
    let btnH = 55;
    
    let isHover = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 &&
                  mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
    
    // Button glow
    if (isHover) {
        fill(0, 220, 150, 30);
        noStroke();
        rect(btnX, btnY, btnW + 20, btnH + 20, 18);
    }
    
    // Button background
    if (isHover) {
        fill(0, 200, 130);
    } else {
        fill(0, 170, 110);
    }
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    rect(btnX, btnY, btnW, btnH, 14);
    
    // Button text
    fill(255);
    noStroke();
    textSize(22);
    textFont('Arial Black');
    text("PLAY", btnX + 10, btnY);
    
    // Play triangle icon
    fill(255);
    let triX = btnX - 45;
    triangle(triX, btnY - 8, triX, btnY + 8, triX + 14, btnY);
    
    // ===== CONTROLS SECTION =====
    let ctrlStartY = panelCenterY + 50;
    
    // Section title
    fill(150, 180, 200, 180);
    textSize(11);
    textFont('Arial');
    text("CONTROLS", width / 2, ctrlStartY);
    
    // Divider line
    stroke(80, 120, 160, 80);
    strokeWeight(1);
    line(width / 2 - 60, ctrlStartY + 15, width / 2 + 60, ctrlStartY + 15);
    
    // Control items - clean list format
    let controlsData = [
        { key: "WASD / Arrows", action: "Move" },
        { key: "E", action: "Dash" },
        { key: "SPACE / Click", action: "Drop Bomb" }
    ];
    
    textFont('Arial');
    let lineY = ctrlStartY + 40;
    let lineSpacing = 28;
    
    for (let i = 0; i < controlsData.length; i++) {
        let ctrl = controlsData[i];
        let y = lineY + i * lineSpacing;
        
        // Key badge
        fill(60, 90, 130, 200);
        stroke(100, 140, 180, 100);
        strokeWeight(1);
        let keyWidth = textWidth(ctrl.key) + 20;
        rectMode(CENTER);
        rect(width / 2 - 50, y, max(keyWidth, 80), 22, 6);
        
        // Key text
        fill(180, 220, 255);
        noStroke();
        textSize(11);
        textFont('Arial Black');
        textAlign(CENTER, CENTER);
        text(ctrl.key, width / 2 - 50, y);
        
        // Action text
        fill(200, 210, 220);
        textSize(12);
        textFont('Arial');
        textAlign(LEFT, CENTER);
        text(ctrl.action, width / 2 + 20, y);
    }
    
    // ===== FOOTER HINT =====
    textAlign(CENTER, CENTER);
    fill(100, 130, 160, 150);
    textSize(10);
    textFont('Arial');
    text("Press ENTER or click PLAY to start", width / 2, panelCenterY + panelH / 2 - 25);
    
    pop();
}

// ===== LEVEL COMPLETE SCREEN =====
function drawLevelComplete() {
    stateTimer--;

    push();
    
    // Dark overlay
    fill(0, 30, 20, 180);
    noStroke();
    rect(0, 0, width, height);
    
    // Floating particles celebration
    for (let i = 0; i < 20; i++) {
        let px = (noise(i * 10, frameCount * 0.01) * width);
        let py = (noise(i * 20, frameCount * 0.008) * height);
        let size = 4 + sin(frameCount * 0.1 + i) * 2;
        fill(0, 255, 150, 60);
        noStroke();
        ellipse(px, py, size, size);
    }

    // Main panel
    let panelY = height / 2;
    let panelW = 380;
    let panelH = 220;
    
    // Panel shadow
    fill(0, 0, 0, 40);
    rectMode(CENTER);
    rect(width / 2 + 4, panelY + 4, panelW, panelH, 20);
    
    // Panel background
    fill(20, 35, 30, 240);
    stroke(0, 200, 120, 100);
    strokeWeight(2);
    rect(width / 2, panelY, panelW, panelH, 20);
    
    // Top accent line
    stroke(0, 255, 150);
    strokeWeight(3);
    line(width / 2 - panelW / 3, panelY - panelH / 2, 
         width / 2 + panelW / 3, panelY - panelH / 2);

    // Stars
    for (let i = 0; i < 3; i++) {
        let starX = width / 2 - 60 + i * 60;
        let starY = panelY - 55;
        let bounce = sin(frameCount * 0.1 + i * 0.5) * 5;
        let scale = 1 + sin(frameCount * 0.08 + i) * 0.1;
        
        // Star glow
        fill(255, 200, 50, 30);
        noStroke();
        ellipse(starX, starY + bounce, 35 * scale, 35 * scale);
        
        // Star
        fill(255, 200, 50);
        drawStar(starX, starY + bounce, 15 * scale, 8 * scale, 5);
    }

    // Title
    fill(0, 255, 150);
    textAlign(CENTER, CENTER);
    textSize(32);
    textFont('Arial Black');
    noStroke();
    text("LEVEL " + (currentLevel + 1) + " COMPLETE", width / 2, panelY + 5);

    // Next level indicator
    fill(150, 200, 180);
    textSize(14);
    textFont('Arial');
    text("Next: Level " + (currentLevel + 2) + " / 3", width / 2, panelY + 40);

    // Continue prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        
        // Button-like prompt
        fill(0, 180, 120, 200 * pulse);
        noStroke();
        rect(width / 2, panelY + 75, 160, 35, 10);
        
        fill(255, 255, 255, 255 * pulse);
        textSize(14);
        textFont('Arial Black');
        text("CONTINUE", width / 2, panelY + 75);
    }

    pop();
}

// ===== GAME OVER SCREEN =====
function drawGameOver() {
    stateTimer--;

    push();
    
    // Dark red overlay
    fill(40, 10, 10, 200);
    noStroke();
    rect(0, 0, width, height);
    
    // Red vignette effect
    for (let i = 0; i < 5; i++) {
        let size = max(width, height) * (1.5 - i * 0.2);
        fill(80, 0, 0, 15);
        noStroke();
        ellipse(width / 2, height / 2, size, size);
    }

    // Main panel
    let panelY = height / 2;
    let panelW = 360;
    let panelH = 240;
    
    // Panel shadow
    fill(0, 0, 0, 40);
    rectMode(CENTER);
    rect(width / 2 + 4, panelY + 4, panelW, panelH, 20);
    
    // Panel background
    fill(30, 15, 15, 240);
    stroke(200, 50, 50, 100);
    strokeWeight(2);
    rect(width / 2, panelY, panelW, panelH, 20);
    
    // Top accent line
    stroke(255, 80, 80);
    strokeWeight(3);
    line(width / 2 - panelW / 3, panelY - panelH / 2, 
         width / 2 + panelW / 3, panelY - panelH / 2);

    // X icon instead of skull emoji
    let iconY = panelY - 60;
    let shake = stateTimer > 100 ? random(-2, 2) : 0;
    
    // Circle background
    fill(80, 20, 20);
    noStroke();
    ellipse(width / 2 + shake, iconY, 60, 60);
    
    // X mark
    stroke(255, 100, 100);
    strokeWeight(5);
    strokeCap(ROUND);
    let xSize = 15;
    line(width / 2 - xSize + shake, iconY - xSize, width / 2 + xSize + shake, iconY + xSize);
    line(width / 2 + xSize + shake, iconY - xSize, width / 2 - xSize + shake, iconY + xSize);

    // Title
    fill(255, 80, 80);
    textAlign(CENTER, CENTER);
    textSize(38);
    textFont('Arial Black');
    noStroke();
    text("GAME OVER", width / 2 + shake, panelY + 10);

    // Stats
    fill(180, 120, 120);
    textSize(14);
    textFont('Arial');
    text("Reached Level " + (currentLevel + 1) + " of 3", width / 2, panelY + 50);

    // Restart prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        
        // Button-like prompt
        fill(180, 60, 60, 200 * pulse);
        noStroke();
        rect(width / 2, panelY + 90, 160, 35, 10);
        
        fill(255, 255, 255, 255 * pulse);
        textSize(14);
        textFont('Arial Black');
        text("TRY AGAIN", width / 2, panelY + 90);
    }

    pop();
}

// ===== VICTORY SCREEN =====
function drawVictory() {
    stateTimer--;

    push();
    
    // Golden overlay
    fill(30, 25, 10, 200);
    noStroke();
    rect(0, 0, width, height);
    
    // Golden vignette
    for (let i = 0; i < 5; i++) {
        let size = max(width, height) * (1.5 - i * 0.2);
        fill(60, 50, 0, 15);
        noStroke();
        ellipse(width / 2, height / 2, size, size);
    }

    // Animated confetti
    for (let i = 0; i < 40; i++) {
        let cx = (noise(i * 100, frameCount * 0.008) * (width + 100)) - 50;
        let cy = ((frameCount * 1.5 + i * 40) % (height + 100)) - 50;
        let colors = [[255, 200, 50], [255, 120, 80], [100, 220, 150], [100, 180, 255]];
        let c = colors[i % 4];
        
        fill(c[0], c[1], c[2], 180);
        noStroke();
        push();
        translate(cx, cy);
        rotate(frameCount * 0.03 + i);
        rect(0, 0, 6, 10, 1);
        pop();
    }

    // Main panel
    let panelY = height / 2;
    let panelW = 400;
    let panelH = 280;
    
    // Panel shadow
    fill(0, 0, 0, 40);
    rectMode(CENTER);
    rect(width / 2 + 4, panelY + 4, panelW, panelH, 20);
    
    // Panel background
    fill(35, 30, 15, 240);
    stroke(220, 180, 50, 100);
    strokeWeight(2);
    rect(width / 2, panelY, panelW, panelH, 20);
    
    // Top accent line
    stroke(255, 200, 50);
    strokeWeight(3);
    line(width / 2 - panelW / 3, panelY - panelH / 2, 
         width / 2 + panelW / 3, panelY - panelH / 2);

    // Custom Trophy icon
    let trophyY = panelY - 75;
    let bob = sin(frameCount * 0.05) * 3;
    
    // Trophy glow
    fill(255, 200, 50, 30);
    noStroke();
    ellipse(width / 2, trophyY + bob, 80, 80);
    
    // Trophy cup
    fill(255, 200, 50);
    noStroke();
    // Cup body
    arc(width / 2, trophyY + bob, 50, 45, 0, PI, CHORD);
    // Cup top rim
    rect(width / 2 - 28, trophyY - 22 + bob, 56, 8, 2);
    // Handles
    stroke(255, 200, 50);
    strokeWeight(4);
    noFill();
    arc(width / 2 - 28, trophyY - 5 + bob, 16, 20, PI * 0.5, PI * 1.5);
    arc(width / 2 + 28, trophyY - 5 + bob, 16, 20, -PI * 0.5, PI * 0.5);
    // Base
    noStroke();
    fill(255, 200, 50);
    rect(width / 2 - 8, trophyY + 20 + bob, 16, 12, 2);
    rect(width / 2 - 15, trophyY + 30 + bob, 30, 6, 2);
    
    // Star on trophy
    fill(255, 255, 200);
    drawStar(width / 2, trophyY - 5 + bob, 8, 4, 5);

    // Title with glow
    for (let i = 3; i > 0; i--) {
        fill(255, 200, 50, 20);
        textAlign(CENTER, CENTER);
        textSize(42 + i * 2);
        textFont('Arial Black');
        text("VICTORY!", width / 2, panelY + 15);
    }
    fill(255, 200, 50);
    textSize(42);
    textFont('Arial Black');
    noStroke();
    text("VICTORY!", width / 2, panelY + 15);

    // Subtitle
    fill(220, 200, 150);
    textSize(16);
    textFont('Arial');
    text("All 3 levels completed!", width / 2, panelY + 55);

    // Play again prompt
    if (stateTimer <= 0) {
        let pulse = sin(frameCount * 0.1) * 0.3 + 0.7;
        
        // Button-like prompt
        fill(200, 160, 40, 200 * pulse);
        noStroke();
        rect(width / 2, panelY + 100, 180, 40, 10);
        
        fill(255, 255, 255, 255 * pulse);
        textSize(15);
        textFont('Arial Black');
        text("PLAY AGAIN", width / 2, panelY + 100);
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
    push();
    
    // ===== TOP LEFT - LEVEL INDICATOR =====
    // Background panel
    fill(0, 0, 0, 120);
    stroke(100, 180, 255, 80);
    strokeWeight(1);
    rectMode(CORNER);
    rect(15, 15, 180, 45, 10);
    
    // Accent line
    stroke(0, 200, 150);
    strokeWeight(2);
    line(15, 15, 15, 60);
    
    // Level text
    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    textFont('Arial Black');
    textSize(18);
    text("LEVEL " + (currentLevel + 1), 28, 30);
    
    // Level progress dots
    for (let i = 0; i < 3; i++) {
        let dotX = 30 + i * 20;
        let dotY = 48;
        if (i <= currentLevel) {
            fill(0, 200, 150);
        } else {
            fill(60, 80, 100);
        }
        noStroke();
        ellipse(dotX, dotY, 10, 10);
    }
    
    // ===== TOP RIGHT - GAME STATS =====
    let statsX = width - 200;
    
    // Background panel
    fill(0, 0, 0, 120);
    stroke(100, 180, 255, 80);
    strokeWeight(1);
    rect(statsX, 15, 185, 75, 10);
    
    // Accent line
    stroke(255, 150, 50);
    strokeWeight(2);
    line(width - 15, 15, width - 15, 90);
    
    // Pursuers counter
    let active = pursuers.filter(p => !p.isExploding).length;
    let total = LEVEL_CONFIG[currentLevel].pursuers;
    
    fill(150, 180, 200);
    noStroke();
    textAlign(LEFT, CENTER);
    textFont('Arial');
    textSize(11);
    text("ENEMIES", statsX + 12, 32);
    
    // Progress bar for enemies
    let barWidth = 160;
    let barHeight = 8;
    let barX = statsX + 12;
    let barY = 42;
    
    // Bar background
    fill(40, 50, 70);
    noStroke();
    rect(barX, barY, barWidth, barHeight, 4);
    
    // Bar fill (inverse - shows how many killed)
    let killProgress = (total - active) / total;
    fill(0, 200, 150);
    rect(barX, barY, barWidth * killProgress, barHeight, 4);
    
    // Counter text
    fill(255);
    textFont('Arial Black');
    textSize(12);
    textAlign(RIGHT, CENTER);
    text(active + " remaining", statsX + 172, 32);
    
    // Obstacles counter
    fill(150, 180, 200);
    textAlign(LEFT, CENTER);
    textFont('Arial');
    textSize(11);
    text("BOMBS", statsX + 12, 68);
    
    // Bomb indicators
    for (let i = 0; i < 5; i++) {
        let bombX = statsX + 65 + i * 22;
        let bombY = 68;
        if (i < obstacles.length) {
            fill(255, 100, 80);
        } else {
            fill(60, 80, 100);
        }
        noStroke();
        ellipse(bombX, bombY, 14, 14);
        
        // Bomb fuse
        if (i < obstacles.length) {
            stroke(255, 200, 100);
            strokeWeight(2);
            line(bombX, bombY - 7, bombX + 3, bombY - 11);
        }
    }
    
    // ===== RELOAD INDICATOR =====
    if (dropCooldown > 0 && gameState === "playing") {
        let reloadProgress = 1 - (dropCooldown / OBSTACLE_COOLDOWN);
        
        // Reload bar at bottom center
        let reloadW = 120;
        let reloadH = 6;
        let reloadX = width / 2 - reloadW / 2;
        let reloadY = height - 40;
        
        // Background
        fill(0, 0, 0, 150);
        stroke(100, 150, 200, 100);
        strokeWeight(1);
        rect(reloadX - 10, reloadY - 15, reloadW + 20, 30, 8);
        
        // Bar background
        fill(40, 50, 70);
        noStroke();
        rect(reloadX, reloadY, reloadW, reloadH, 3);
        
        // Bar fill
        fill(100, 200, 255);
        rect(reloadX, reloadY, reloadW * reloadProgress, reloadH, 3);
        
        // Text
        fill(180, 220, 255);
        textAlign(CENTER, CENTER);
        textFont('Arial');
        textSize(10);
        text("RELOADING", width / 2, reloadY - 8);
    }
    
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
