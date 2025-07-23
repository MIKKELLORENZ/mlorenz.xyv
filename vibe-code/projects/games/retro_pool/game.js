/**
 * Retro Pool - PlayStation 1 Style 3D Pool Game
 * Features authentic PS1 graphics with low-poly models, vertex lighting, and pixelated textures
 */

class RetroPoolGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Game state
        this.gameState = 'loading'; // loading, menu, playing, paused
        this.currentPlayer = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.shotPower = 0;
        this.isChargingShot = false;
        this.gameStarted = false;
        
        // 3D objects
        this.table = null;
        this.balls = [];
        this.cue = null;
        this.room = null;
        this.windows = [];
        
        // Camera controls
        this.cameraAngle = 0;
        this.cameraRadius = 8;
        this.cameraHeight = 4;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.menuAnimation = false;
        this.cameraTransitioning = false;
        
        // Aiming system
        this.aimingAngle = 0;
        this.isAiming = false;
        
        // Input handling
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.keys = {};
        
        // Physics simulation
        this.physics = {
            gravity: -0.01,
            friction: 0.98,
            tableFriction: 0.95,
            ballRadius: 0.05,
            tableWidth: 4.5,
            tableHeight: 2.25
        };
        
        this.init();
    }
    
    async init() {
        this.showLoadingScreen();
        await this.simulateLoading();
        this.setupEventListeners();
        this.showMainMenu();
    }
    
    // Loading simulation with authentic PS1 delays
    async simulateLoading() {
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        const loadingSteps = [
            { text: 'Initializing 3D Engine...', duration: 800 },
            { text: 'Loading Textures...', duration: 600 },
            { text: 'Creating Pool Table...', duration: 500 },
            { text: 'Positioning Balls...', duration: 400 },
            { text: 'Setting Up Physics...', duration: 300 },
            { text: 'Preparing Game Environment...', duration: 700 },
            { text: 'Ready!', duration: 200 }
        ];
        
        for (let i = 0; i < loadingSteps.length; i++) {
            const step = loadingSteps[i];
            loadingText.textContent = step.text;
            progressBar.style.width = `${((i + 1) / loadingSteps.length) * 100}%`;
            
            // Add some natural pauses and variations
            const delay = step.duration + Math.random() * 200;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    showLoadingScreen() {
        this.hideAllScreens();
        document.getElementById('loadingScreen').classList.add('active');
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.add('active');
        this.gameState = 'menu';
        
        // Start background scene for menu
        if (!this.gameStarted) {
            this.initializeGame();
            this.startMenuAnimation();
        }
    }
    
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        this.gameState = 'playing';
        
        // Stop menu animation and transition to game view
        this.stopMenuAnimation();
        this.startGameView();
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('playButton').addEventListener('click', () => {
            this.showGameScreen();
        });
        
        document.getElementById('optionsButton').addEventListener('click', () => {
            // Options menu (placeholder)
            console.log('Options menu not implemented yet');
        });
        
        document.getElementById('exitButton').addEventListener('click', () => {
            window.close();
        });
        
        // Pause menu buttons
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('menuButton').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            this.handleKeyUp(event);
        });
        
        // Mouse events
        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
        
        document.addEventListener('click', (event) => {
            this.handleMouseClick(event);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
    
    initializeGame() {
        this.setupThreeJS();
        this.createScene();
        this.positionCamera();
        this.gameStarted = true;
        this.animate();
    }
    
    setupThreeJS() {
        this.canvas = document.getElementById('gameCanvas');
        
        // Create scene with PS1-style settings
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x666666, 8, 15); // PS1-style fog
        
        // Setup camera with PS1-style FOV
        this.camera = new THREE.PerspectiveCamera(
            60, // Lower FOV for PS1 authenticity
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        
        // Setup renderer with PS1-style settings
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false, // No antialiasing for authentic PS1 look
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // Force 1:1 pixel ratio for pixelated look
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Use basic shadow map for PS1 feel
        this.renderer.setClearColor(0x333333);
        
        // Set up lighting with PS1-style vertex lighting
        this.setupLighting();
    }
    
    setupLighting() {
        // Ambient light (PS1 games often had strong ambient lighting)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (simulating window light)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 8, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 512; // Low resolution shadows for PS1 feel
        mainLight.shadow.mapSize.height = 512;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        this.scene.add(mainLight);
        
        // Secondary light for depth
        const secondaryLight = new THREE.DirectionalLight(0x4444ff, 0.3);
        secondaryLight.position.set(-3, 5, -3);
        this.scene.add(secondaryLight);
        
        // Point lights for bar atmosphere
        const barLight1 = new THREE.PointLight(0xffaa00, 0.5, 10);
        barLight1.position.set(-4, 3, -4);
        this.scene.add(barLight1);
        
        const barLight2 = new THREE.PointLight(0xffaa00, 0.5, 10);
        barLight2.position.set(4, 3, -4);
        this.scene.add(barLight2);
    }
    
    createScene() {
        this.createRoom();
        this.createPoolTable();
        this.createBalls();
        this.createCue();
        this.positionCamera();
    }
    
    createRoom() {
        // Create bar room with PS1-style low-poly geometry
        const roomGroup = new THREE.Group();
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20, 4, 4); // Low-poly floor
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: false
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        roomGroup.add(floor);
        
        // Walls
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(20, 8, 2, 2);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 4, -10);
        roomGroup.add(backWall);
        
        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(20, 8, 2, 2);
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 4, 0);
        roomGroup.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 4, 0);
        roomGroup.add(rightWall);
        
        // Windows (bright rectangles)
        this.createWindows(roomGroup);
        
        // Bar elements
        this.createBarElements(roomGroup);
        
        this.scene.add(roomGroup);
        this.room = roomGroup;
    }
    
    createWindows(roomGroup) {
        // Bright blue sky background behind windows
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, // Sky blue
            transparent: false
        });
        
        // Sky planes (positioned slightly behind windows)
        const skyGeometry = new THREE.PlaneGeometry(5, 4);
        
        // Main sky
        const mainSky = new THREE.Mesh(skyGeometry, skyMaterial);
        mainSky.position.set(3, 5, -10.1);
        roomGroup.add(mainSky);
        
        // Side skies
        const sideSky1 = new THREE.Mesh(skyGeometry, skyMaterial);
        sideSky1.rotation.y = Math.PI / 2;
        sideSky1.position.set(-10.1, 5, 3);
        roomGroup.add(sideSky1);
        
        const sideSky2 = new THREE.Mesh(skyGeometry, skyMaterial);
        sideSky2.rotation.y = -Math.PI / 2;
        sideSky2.position.set(10.1, 5, -3);
        roomGroup.add(sideSky2);
        
        // Window frames
        const windowFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
        const frameThickness = 0.05;
        
        // Main window frame
        const windowGeometry = new THREE.PlaneGeometry(4, 3);
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        const mainWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        mainWindow.position.set(3, 5, -9.9);
        roomGroup.add(mainWindow);
        
        // Window frame elements
        const frameGeometry1 = new THREE.BoxGeometry(4.2, 0.1, frameThickness);
        const frameGeometry2 = new THREE.BoxGeometry(0.1, 3.2, frameThickness);
        
        // Top and bottom frame
        const topFrame = new THREE.Mesh(frameGeometry1, windowFrameMaterial);
        topFrame.position.set(3, 6.55, -9.85);
        roomGroup.add(topFrame);
        
        const bottomFrame = new THREE.Mesh(frameGeometry1, windowFrameMaterial);
        bottomFrame.position.set(3, 3.45, -9.85);
        roomGroup.add(bottomFrame);
        
        // Left and right frame
        const leftFrame = new THREE.Mesh(frameGeometry2, windowFrameMaterial);
        leftFrame.position.set(1, 5, -9.85);
        roomGroup.add(leftFrame);
        
        const rightFrame = new THREE.Mesh(frameGeometry2, windowFrameMaterial);
        rightFrame.position.set(5, 5, -9.85);
        roomGroup.add(rightFrame);
        
        // Side windows with frames
        const sideWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
        sideWindow1.rotation.y = Math.PI / 2;
        sideWindow1.position.set(-9.9, 5, 3);
        roomGroup.add(sideWindow1);
        
        const sideWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
        sideWindow2.rotation.y = -Math.PI / 2;
        sideWindow2.position.set(9.9, 5, -3);
        roomGroup.add(sideWindow2);
        
        this.windows = [mainWindow, sideWindow1, sideWindow2];
    }
    
    createBarElements(roomGroup) {
        // Bar counter (simple low-poly)
        const barGeometry = new THREE.BoxGeometry(8, 1, 1.5, 1, 1, 1);
        const barMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(-5, 0.5, -8);
        bar.castShadow = true;
        roomGroup.add(bar);
        
        // Bar top (darker wood)
        const barTopGeometry = new THREE.BoxGeometry(8.2, 0.1, 1.7, 1, 1, 1);
        const barTopMaterial = new THREE.MeshLambertMaterial({ color: 0x2f1b14 });
        const barTop = new THREE.Mesh(barTopGeometry, barTopMaterial);
        barTop.position.set(-5, 1.05, -8);
        barTop.castShadow = true;
        roomGroup.add(barTop);
        
        // Bar stools
        for (let i = 0; i < 3; i++) {
            const stoolGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
            const stoolMaterial = new THREE.MeshLambertMaterial({ color: 0x2f1b14 });
            const stool = new THREE.Mesh(stoolGeometry, stoolMaterial);
            stool.position.set(-6 + i * 2, 0.75, -6.5);
            stool.castShadow = true;
            roomGroup.add(stool);
            
            // Stool seats
            const seatGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 6);
            const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(-6 + i * 2, 1.55, -6.5);
            seat.castShadow = true;
            roomGroup.add(seat);
        }
        
        // Shelving behind bar
        for (let shelf = 0; shelf < 3; shelf++) {
            const shelfGeometry = new THREE.BoxGeometry(7, 0.05, 0.3, 1, 1, 1);
            const shelfMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
            const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelfMesh.position.set(-5, 2 + shelf * 0.8, -9.7);
            shelfMesh.castShadow = true;
            roomGroup.add(shelfMesh);
            
            // Bottles on shelves
            for (let bottle = 0; bottle < 4; bottle++) {
                const bottleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
                const bottleColors = [0x228B22, 0x8B4513, 0x4169E1, 0x800080];
                const bottleMaterial = new THREE.MeshLambertMaterial({ 
                    color: bottleColors[bottle % bottleColors.length] 
                });
                const bottleMesh = new THREE.Mesh(bottleGeometry, bottleMaterial);
                bottleMesh.position.set(-7 + bottle * 1.5, 2.25 + shelf * 0.8, -9.55);
                bottleMesh.castShadow = true;
                roomGroup.add(bottleMesh);
            }
        }
        
        // Hanging light fixtures
        for (let i = 0; i < 2; i++) {
            // Light cord
            const cordGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 4);
            const cordMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const cord = new THREE.Mesh(cordGeometry, cordMaterial);
            cord.position.set(-3 + i * 6, 6, -2);
            roomGroup.add(cord);
            
            // Light shade
            const shadeGeometry = new THREE.ConeGeometry(0.4, 0.6, 6);
            const shadeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
            shade.position.set(-3 + i * 6, 4.7, -2);
            shade.castShadow = true;
            roomGroup.add(shade);
        }
        
        // Pool cue rack on wall
        const rackGeometry = new THREE.BoxGeometry(2, 0.1, 0.1, 1, 1, 1);
        const rackMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
        const rack = new THREE.Mesh(rackGeometry, rackMaterial);
        rack.position.set(8, 3, -9.9);
        rack.castShadow = true;
        roomGroup.add(rack);
        
        // Cues in rack
        for (let i = 0; i < 4; i++) {
            const cueGeometry = new THREE.CylinderGeometry(0.008, 0.012, 1.8, 6);
            const cueMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const cue = new THREE.Mesh(cueGeometry, cueMaterial);
            cue.position.set(7.5 + i * 0.3, 3.9, -9.8);
            cue.rotation.z = Math.PI / 2;
            cue.castShadow = true;
            roomGroup.add(cue);
        }
    }
    
    createPoolTable() {
        const tableGroup = new THREE.Group();
        
        // Table surface (felt)
        const surfaceGeometry = new THREE.BoxGeometry(
            this.physics.tableWidth, 
            0.1, 
            this.physics.tableHeight,
            1, 1, 1
        );
        const surfaceMaterial = new THREE.MeshLambertMaterial({ color: 0x0d5d1e });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.position.y = 1;
        surface.receiveShadow = true;
        tableGroup.add(surface);
        
        // Table legs (fixed positioning and made more visible)
        const legGeometry = new THREE.BoxGeometry(0.15, 1.8, 0.15, 1, 1, 1);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
        
        const legPositions = [
            [-this.physics.tableWidth/2 + 0.3, -0.9, -this.physics.tableHeight/2 + 0.3],
            [this.physics.tableWidth/2 - 0.3, -0.9, -this.physics.tableHeight/2 + 0.3],
            [-this.physics.tableWidth/2 + 0.3, -0.9, this.physics.tableHeight/2 - 0.3],
            [this.physics.tableWidth/2 - 0.3, -0.9, this.physics.tableHeight/2 - 0.3]
        ];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            leg.receiveShadow = true;
            tableGroup.add(leg);
        });
        
        // Table rails
        const railMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c2a });
        
        // Long rails
        const longRailGeometry = new THREE.BoxGeometry(this.physics.tableWidth + 0.2, 0.15, 0.1, 1, 1, 1);
        const topRail = new THREE.Mesh(longRailGeometry, railMaterial);
        topRail.position.set(0, 1.1, this.physics.tableHeight / 2 + 0.05);
        topRail.castShadow = true;
        tableGroup.add(topRail);
        
        const bottomRail = new THREE.Mesh(longRailGeometry, railMaterial);
        bottomRail.position.set(0, 1.1, -this.physics.tableHeight / 2 - 0.05);
        bottomRail.castShadow = true;
        tableGroup.add(bottomRail);
        
        // Short rails
        const shortRailGeometry = new THREE.BoxGeometry(0.1, 0.15, this.physics.tableHeight, 1, 1, 1);
        const leftRail = new THREE.Mesh(shortRailGeometry, railMaterial);
        leftRail.position.set(-this.physics.tableWidth / 2 - 0.05, 1.1, 0);
        leftRail.castShadow = true;
        tableGroup.add(leftRail);
        
        const rightRail = new THREE.Mesh(shortRailGeometry, railMaterial);
        rightRail.position.set(this.physics.tableWidth / 2 + 0.05, 1.1, 0);
        rightRail.castShadow = true;
        tableGroup.add(rightRail);
        
        // Corner pockets (simple black spheres)
        const pocketGeometry = new THREE.SphereGeometry(0.08, 6, 4);
        const pocketMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const pocketPositions = [
            [-this.physics.tableWidth/2, 1.05, -this.physics.tableHeight/2],
            [this.physics.tableWidth/2, 1.05, -this.physics.tableHeight/2],
            [-this.physics.tableWidth/2, 1.05, this.physics.tableHeight/2],
            [this.physics.tableWidth/2, 1.05, this.physics.tableHeight/2]
        ];
        
        pocketPositions.forEach(pos => {
            const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
            pocket.position.set(...pos);
            tableGroup.add(pocket);
        });
        
        this.scene.add(tableGroup);
        this.table = tableGroup;
    }
    
    createBalls() {
        this.balls = [];
        
        // Ball colors (basic PS1-style solid colors)
        const ballColors = [
            0xffffff, // Cue ball
            0xffff00, // 1 - Yellow
            0x0000ff, // 2 - Blue  
            0xff0000, // 3 - Red
            0x800080, // 4 - Purple
            0xffa500, // 5 - Orange
            0x008000, // 6 - Green
            0x800000, // 7 - Maroon
            0x000000, // 8 - Black
            0xffff00, // 9 - Yellow stripe
            0x0000ff, // 10 - Blue stripe
            0xff0000, // 11 - Red stripe
            0x800080, // 12 - Purple stripe
            0xffa500, // 13 - Orange stripe
            0x008000, // 14 - Green stripe
            0x800000  // 15 - Maroon stripe
        ];
        
        // Create ball geometry (low-poly for PS1 authenticity)
        const ballGeometry = new THREE.SphereGeometry(this.physics.ballRadius, 8, 6);
        
        // Position balls in triangle formation
        const ballPositions = this.generateBallPositions();
        
        ballPositions.forEach((pos, index) => {
            const ballMaterial = new THREE.MeshLambertMaterial({ 
                color: ballColors[index] || 0xffffff 
            });
            const ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.set(pos.x, 1.05 + this.physics.ballRadius, pos.z);
            ball.castShadow = true;
            ball.userData = {
                velocity: new THREE.Vector3(0, 0, 0),
                number: index,
                isMoving: false,
                isPocketed: false
            };
            
            this.scene.add(ball);
            this.balls.push(ball);
        });
    }
    
    generateBallPositions() {
        const positions = [];
        const spacing = this.physics.ballRadius * 2.1;
        
        // Cue ball position
        positions.push({ x: -1.5, z: 0 });
        
        // Triangle formation for other balls
        let ballIndex = 1;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                if (ballIndex < 16) {
                    const x = 1 + row * spacing * 0.866; // 0.866 = sqrt(3)/2
                    const z = (col - row / 2) * spacing;
                    positions.push({ x, z });
                    ballIndex++;
                }
            }
        }
        
        return positions;
    }
    
    createCue() {
        const cueGroup = new THREE.Group();
        
        // Cue stick (simple cylinder)
        const cueGeometry = new THREE.CylinderGeometry(0.005, 0.008, 1.5, 6);
        const cueMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const cueStick = new THREE.Mesh(cueGeometry, cueMaterial);
        cueStick.rotation.z = Math.PI / 2;
        cueGroup.add(cueStick);
        
        // Position near cue ball initially
        cueGroup.position.set(-2, 1.1, 0);
        cueGroup.visible = false; // Hidden until player aims
        
        this.scene.add(cueGroup);
        this.cue = cueGroup;
    }
    
    positionCamera() {
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        const x = Math.cos(this.cameraAngle) * this.cameraRadius;
        const z = Math.sin(this.cameraAngle) * this.cameraRadius;
        
        this.camera.position.set(x, this.cameraHeight, z);
        this.camera.lookAt(this.cameraTarget);
    }
    
    startMenuAnimation() {
        this.menuAnimation = true;
        this.cameraAngle = 0;
        this.cameraRadius = 12;
        this.cameraHeight = 6;
    }
    
    stopMenuAnimation() {
        this.menuAnimation = false;
        this.cameraTransitioning = true;
    }
    
    startGameView() {
        // Position camera for gameplay
        this.cameraRadius = 6;
        this.cameraHeight = 3.5;
        this.cameraAngle = Math.PI; // Face the cue ball
        this.cameraTarget.set(0, 1, 0);
    }
    
    startAiming() {
        if (this.balls[0].userData.isMoving) return;
        
        this.isAiming = true;
        this.cue.visible = true;
        this.updateCueAiming();
    }
    
    updateCueAiming() {
        if (!this.isAiming) return;
        
        const cueBall = this.balls[0];
        const distance = 0.3;
        
        // Position cue based on aiming angle
        const x = cueBall.position.x - Math.cos(this.aimingAngle) * distance;
        const z = cueBall.position.z - Math.sin(this.aimingAngle) * distance;
        
        this.cue.position.set(x, cueBall.position.y, z);
        this.cue.rotation.y = this.aimingAngle;
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'Escape':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                }
                break;
                
            case 'Space':
                if (this.gameState === 'playing' && !this.isChargingShot) {
                    this.startChargingShot();
                }
                event.preventDefault();
                break;
                
            case 'KeyR':
                this.resetCamera();
                break;
                
            case 'KeyA':
            case 'ArrowLeft':
                if (this.gameState === 'playing' && this.isAiming) {
                    this.aimingAngle -= 0.05;
                    this.updateCueAiming();
                }
                break;
                
            case 'KeyD':
            case 'ArrowRight':
                if (this.gameState === 'playing' && this.isAiming) {
                    this.aimingAngle += 0.05;
                    this.updateCueAiming();
                }
                break;
                
            case 'KeyS':
                if (this.gameState === 'playing' && !this.isChargingShot) {
                    this.startAiming();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.code) {
            case 'Space':
                if (this.gameState === 'playing' && this.isChargingShot) {
                    this.takeShot();
                }
                event.preventDefault();
                break;
        }
    }
    
    handleMouseMove(event) {
        if (this.gameState !== 'playing') return;
        
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update custom cursor position
        document.body.style.setProperty('--cursor-x', event.clientX + 'px');
        document.body.style.setProperty('--cursor-y', event.clientY + 'px');
    }
    
    handleMouseClick(event) {
        // Handle UI interactions
    }
    
    startChargingShot() {
        if (this.balls[0].userData.isMoving) return; // Can't shoot while balls are moving
        if (!this.isAiming) {
            this.startAiming();
        }
        
        this.isChargingShot = true;
        this.shotPower = 0;
    }
    
    takeShot() {
        if (!this.isChargingShot) return;
        
        this.isChargingShot = false;
        this.isAiming = false;
        this.cue.visible = false;
        
        // Apply force to cue ball based on aiming angle
        const cueBall = this.balls[0];
        const force = this.shotPower * 0.001;
        
        cueBall.userData.velocity.x = Math.cos(this.aimingAngle) * force;
        cueBall.userData.velocity.z = Math.sin(this.aimingAngle) * force;
        cueBall.userData.isMoving = true;
        
        this.shotPower = 0;
        this.updateUI();
    }
    
    resetCamera() {
        this.cameraAngle = 0;
        this.cameraRadius = 8;
        this.cameraHeight = 4;
        this.cameraTarget.set(0, 0, 0);
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseMenu').classList.add('active');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseMenu').classList.remove('active');
    }
    
    restartGame() {
        // Reset game state
        this.currentPlayer = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.resetBalls();
        this.resumeGame();
        this.updateUI();
    }
    
    resetBalls() {
        const positions = this.generateBallPositions();
        this.balls.forEach((ball, index) => {
            if (positions[index]) {
                ball.position.set(
                    positions[index].x, 
                    1.05 + this.physics.ballRadius, 
                    positions[index].z
                );
                ball.userData.velocity.set(0, 0, 0);
                ball.userData.isMoving = false;
                ball.userData.isPocketed = false;
                ball.visible = true;
            }
        });
    }
    
    updatePhysics() {
        let anyBallMoving = false;
        
        this.balls.forEach(ball => {
            if (ball.userData.isPocketed) return;
            
            const velocity = ball.userData.velocity;
            const speed = velocity.length();
            
            if (speed > 0.001) {
                anyBallMoving = true;
                ball.userData.isMoving = true;
                
                // Apply movement
                ball.position.add(velocity);
                
                // Apply friction
                velocity.multiplyScalar(this.physics.tableFriction);
                
                // Check table boundaries
                this.checkTableBoundaries(ball);
                
                // Check ball collisions
                this.checkBallCollisions(ball);
                
                // Check pocket collisions
                this.checkPocketCollisions(ball);
                
            } else {
                velocity.set(0, 0, 0);
                ball.userData.isMoving = false;
            }
        });
        
        // Update turn if all balls stopped
        if (!anyBallMoving && this.balls.some(b => b.userData.isMoving)) {
            this.endTurn();
        }
    }
    
    checkTableBoundaries(ball) {
        const pos = ball.position;
        const vel = ball.userData.velocity;
        const radius = this.physics.ballRadius;
        
        // X boundaries
        if (pos.x - radius < -this.physics.tableWidth / 2) {
            pos.x = -this.physics.tableWidth / 2 + radius;
            vel.x = -vel.x * 0.8;
        } else if (pos.x + radius > this.physics.tableWidth / 2) {
            pos.x = this.physics.tableWidth / 2 - radius;
            vel.x = -vel.x * 0.8;
        }
        
        // Z boundaries
        if (pos.z - radius < -this.physics.tableHeight / 2) {
            pos.z = -this.physics.tableHeight / 2 + radius;
            vel.z = -vel.z * 0.8;
        } else if (pos.z + radius > this.physics.tableHeight / 2) {
            pos.z = this.physics.tableHeight / 2 - radius;
            vel.z = -vel.z * 0.8;
        }
    }
    
    checkBallCollisions(ball1) {
        this.balls.forEach(ball2 => {
            if (ball1 === ball2 || ball2.userData.isPocketed) return;
            
            const distance = ball1.position.distanceTo(ball2.position);
            const minDistance = this.physics.ballRadius * 2;
            
            if (distance < minDistance) {
                // Simple collision response
                const direction = new THREE.Vector3()
                    .subVectors(ball2.position, ball1.position)
                    .normalize();
                
                const relativeVelocity = new THREE.Vector3()
                    .subVectors(ball1.userData.velocity, ball2.userData.velocity);
                
                const speed = relativeVelocity.dot(direction);
                
                if (speed > 0) return; // Balls moving apart
                
                // Apply collision
                const impulse = 2 * speed / 2; // Assuming equal mass
                ball1.userData.velocity.addScaledVector(direction, -impulse);
                ball2.userData.velocity.addScaledVector(direction, impulse);
                
                // Separate balls
                const overlap = minDistance - distance;
                const separation = direction.multiplyScalar(overlap * 0.5);
                ball1.position.sub(separation);
                ball2.position.add(separation);
                
                ball2.userData.isMoving = true;
            }
        });
    }
    
    checkPocketCollisions(ball) {
        const pocketPositions = [
            { x: -this.physics.tableWidth/2, z: -this.physics.tableHeight/2 },
            { x: this.physics.tableWidth/2, z: -this.physics.tableHeight/2 },
            { x: -this.physics.tableWidth/2, z: this.physics.tableHeight/2 },
            { x: this.physics.tableWidth/2, z: this.physics.tableHeight/2 }
        ];
        
        const pocketRadius = 0.08;
        
        pocketPositions.forEach(pocket => {
            const distance = Math.sqrt(
                Math.pow(ball.position.x - pocket.x, 2) + 
                Math.pow(ball.position.z - pocket.z, 2)
            );
            
            if (distance < pocketRadius) {
                this.pocketBall(ball);
            }
        });
    }
    
    pocketBall(ball) {
        ball.userData.isPocketed = true;
        ball.userData.isMoving = false;
        ball.userData.velocity.set(0, 0, 0);
        ball.visible = false;
        
        // Update score based on ball number
        if (ball.userData.number === 0) {
            // Cue ball pocketed - foul
            this.handleFoul();
        } else if (ball.userData.number === 8) {
            // 8-ball pocketed
            this.handle8Ball();
        } else {
            // Regular ball pocketed
            this.updateScore();
        }
    }
    
    handleFoul() {
        console.log('Foul! Cue ball pocketed');
        // Reset cue ball to center
        this.balls[0].position.set(0, 1.05 + this.physics.ballRadius, 0);
        this.balls[0].visible = true;
        this.balls[0].userData.isPocketed = false;
        this.switchPlayer();
    }
    
    handle8Ball() {
        console.log('8-ball pocketed! Game over!');
        // Implement game over logic
    }
    
    updateScore() {
        if (this.currentPlayer === 1) {
            this.player1Score++;
        } else {
            this.player2Score++;
        }
        this.updateUI();
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateUI();
    }
    
    endTurn() {
        // Check if any balls were pocketed to determine if player continues
        // For now, always switch players
        this.switchPlayer();
    }
    
    updateUI() {
        document.getElementById('player1Score').textContent = this.player1Score;
        document.getElementById('currentPlayer').textContent = `Player ${this.currentPlayer}`;
        document.getElementById('shotPower').textContent = Math.round(this.shotPower);
    }
    
    updateCameraIntro() {
        if (this.menuAnimation) {
            this.cameraAngle += 0.008; // Slower rotation for menu
            
            // Keep camera at distance for menu view
            if (this.cameraAngle > Math.PI * 4) { // Multiple rotations
                this.cameraAngle = 0;
            }
        }
        
        if (this.cameraTransitioning) {
            // Smooth transition to game view
            this.cameraRadius = Math.max(6, this.cameraRadius - 0.1);
            this.cameraHeight = Math.max(3.5, this.cameraHeight - 0.05);
            
            if (this.cameraRadius <= 6.1) {
                this.cameraTransitioning = false;
            }
        }
    }
    
    updateShotCharging() {
        if (this.isChargingShot) {
            this.shotPower = Math.min(100, this.shotPower + 1.5);
            this.updateUI();
            
            // Update cue position based on power (pull back effect)
            if (this.isAiming) {
                const cueBall = this.balls[0];
                const baseDistance = 0.3;
                const powerOffset = (this.shotPower * 0.003);
                const totalDistance = baseDistance + powerOffset;
                
                const x = cueBall.position.x - Math.cos(this.aimingAngle) * totalDistance;
                const z = cueBall.position.z - Math.sin(this.aimingAngle) * totalDistance;
                
                this.cue.position.set(x, cueBall.position.y, z);
            }
        }
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameState === 'menu' || this.gameState === 'playing') {
            this.updateCameraIntro();
            
            if (this.gameState === 'playing') {
                this.updateShotCharging();
                this.updatePhysics();
            }
            
            this.updateCameraPosition();
            
            // Animate windows (pulsing bright light)
            const time = Date.now() * 0.001;
            this.windows.forEach((window, index) => {
                const opacity = 0.2 + Math.sin(time + index) * 0.1;
                window.material.opacity = opacity;
            });
            
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new RetroPoolGame();
});

// Custom cursor movement
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('body::after');
    document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
});