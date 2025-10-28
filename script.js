// Import Three.js
import * as THREE from 'three';

// Portfolio Data
const portfolioData = {
    experience: {
        title: "Experience",
        content: `
            <h2>Professional Experience (8 Years)</h2>

            <h3>Morgan Stanley - Software Engineer</h3>
            <p><strong>August 2021 - Present | Mumbai</strong></p>
            <p>Built DWMS platform which automates the decision making workflow in pre-trade for ESG funds. Worked with Java, Spring to build the backend and Angular for the front end. This platform helped save time and efforts by replacing vendor products that were not scalable for requirement and couldn't integrate with internal products, saving the firm time and expenses and reducing the decision research cycle.</p>
            <div class="tech-tags">
                <span class="tag">Java</span>
                <span class="tag">Spring</span>
                <span class="tag">Angular</span>
            </div>

            <h3>TIAA GBS - Software Engineer</h3>
            <p><strong>June 2019 - August 2021 | Pune</strong></p>
            <p>Worked with Java and Angular to develop an E-commerce like web-application called UD Prime for the purchase of insurance products in which products could be added to cart and later checked out.</p>
            <div class="tech-tags">
                <span class="tag">Java</span>
                <span class="tag">Angular</span>
            </div>

            <h3>TCS - Assistant Systems Engineer</h3>
            <p><strong>March 2017 - June 2019 | Pune</strong></p>
            <p>Engineered a storage drive application called DG Drive where a user or an application could upload numerous documents and receipts with Java, Angular, RESTful Web Services, and MySQL.</p>
            <div class="tech-tags">
                <span class="tag">Java</span>
                <span class="tag">Angular</span>
                <span class="tag">MySQL</span>
                <span class="tag">RESTful</span>
            </div>
        `
    },
    skills: {
        title: "Skills & Technologies",
        content: `
            <h2>Technical Expertise</h2>

            <h3>Backend</h3>
            <div class="tech-tags">
                <span class="tag">Java 8</span>
                <span class="tag">Spring</span>
                <span class="tag">Spring Boot</span>
                <span class="tag">Spring Security</span>
                <span class="tag">Spring MVC</span>
                <span class="tag">Gradle</span>
            </div>

            <h3>Frontend</h3>
            <div class="tech-tags">
                <span class="tag">Angular 8</span>
                <span class="tag">HTML</span>
                <span class="tag">CSS</span>
                <span class="tag">JavaScript</span>
                <span class="tag">RESTful Web Services</span>
            </div>

            <h3>Technologies & Tools</h3>
            <div class="tech-tags">
                <span class="tag">MySQL</span>
                <span class="tag">MongoDB</span>
                <span class="tag">Git</span>
                <span class="tag">Jenkins</span>
            </div>
        `
    },
    awards: {
        title: "Awards & Recognition",
        content: `
            <h2>Achievements</h2>

            <h3>🏆 Tech Showcase Winner</h3>
            <p><strong>Morgan Stanley</strong></p>
            <p>Won Tech Showcase twice in 2023 and 2024</p>

            <h3>⭐ Pat on the Back Award</h3>
            <p><strong>TIAA</strong></p>
            <p>For exceptional performance in delivering applications on time</p>

            <h3>💡 On the Spot Award</h3>
            <p><strong>TCS</strong></p>
            <p>For out-of-box thinking and delivering applications on time. Solved a critical client issue by identifying inadequate database data when everyone was looking for code bugs.</p>

            <h3>❄️ Arctic Code Vault Contributor</h3>
            <p><strong>GitHub</strong></p>
            <p>Contributed to open-source projects archived in GitHub's Arctic Code Vault</p>
        `
    },
    about: {
        title: "About Me",
        content: `
            <h2>Divij Shrivastava</h2>
            <h3>Software Engineer</h3>
            <p>Full-stack developer with 8 years of experience building scalable enterprise applications using Java, Spring, and Angular at leading financial institutions.</p>

            <h3>Education</h3>
            <p><strong>Bachelor of Engineering</strong></p>
            <p>Shri Ram Institute of Technology, Jabalpur</p>
            <p>July 2012 - June 2016 | CGPA: 7.8</p>

            <h3>Contact</h3>
            <ul>
                <li>📧 divij.shrivastava@gmail.com</li>
                <li>📱 (+91) 8871962152</li>
                <li>🌐 divij.tech</li>
            </ul>
        `
    }
};

// Three.js Scene Setup
let scene, camera, renderer;
let car, carBody;
let keysPressed = {};
let carSpeed = 0;
let carRotation = 0;
let interactiveObjects = [];
let solidObjects = [];
let movableObjects = [];
let currentObject = null;

// Car physics
const maxSpeed = 0.3;
const acceleration = 0.01;
const deceleration = 0.005;
const turnSpeed = 0.03;

// Camera control
let cameraAngle = Math.PI / 3; // Start at 60 degrees (top-down view)
const minCameraAngle = Math.PI / 12; // 15 degrees (low angle, near ground)
const maxCameraAngle = Math.PI / 2.2; // ~82 degrees (high top-down view)
const cameraDistance = 30; // Distance from car
const cameraScrollSpeed = 0.05;

// Sound effects
let audioContext;
let engineSound;
let isEngineRunning = false;
let collisionSound;
let isMuted = false;

// Initialize
function init() {
    // Scene
    scene = new THREE.Scene();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1a1a1a : 0xe8e4f0);
    scene.fog = new THREE.Fog(isDark ? 0x1a1a1a : 0xe8e4f0, 50, 150);

    // Camera - Top-down view
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 15);
    camera.lookAt(0, 0, 0);

    // Renderer
    const canvas = document.getElementById('webglCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x242424 : 0xd8d0dc,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initialize audio
    initAudio();

    // Create portfolio objects playground
    createExperienceObjects();
    createSkillsObjects();
    createAwardsObjects();
    createAboutObjects();

    // Create environmental objects
    createEnvironment();

    // Create car
    createCar();

    // Add event listeners
    addEventListeners();

    // Start animation
    animate();
}

function createCar() {
    car = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b5a9e,
        roughness: 0.3,
        metalness: 0.6
    });
    carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.8;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    car.add(carBody);

    // Car top/cabin
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 2.2);
    const cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0x6d4579,
        roughness: 0.3,
        metalness: 0.6
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.4, -0.3);
    cabin.castShadow = true;
    car.add(cabin);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d2d2d,
        roughness: 0.8
    });

    const wheelPositions = [
        { x: -1, z: 1.2 },
        { x: 1, z: 1.2 },
        { x: -1, z: -1.2 },
        { x: 1, z: -1.2 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.castShadow = true;
        car.add(wheel);
    });

    // Position car at start
    car.position.set(0, 0, 15);
    scene.add(car);
}

// Audio initialization
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playEngineSound() {
    if (!audioContext || isEngineRunning || isMuted) return;

    isEngineRunning = true;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    engineSound = { oscillator, gainNode };
    oscillator.start();
}

function updateEngineSound(speed) {
    if (!engineSound) return;

    const frequency = 80 + Math.abs(speed) * 300;
    const volume = 0.05 + Math.abs(speed) * 0.15;

    engineSound.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    engineSound.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
}

function stopEngineSound() {
    if (engineSound && isEngineRunning) {
        engineSound.oscillator.stop();
        isEngineRunning = false;
        engineSound = null;
    }
}

function playCollisionSound() {
    if (!audioContext || isMuted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Helper function to create text textures
function createTextTexture(text, fontSize = 60, bgColor = 'rgba(255, 255, 255, 0.9)', textColor = '#2d2d2d') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;

    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = `bold ${fontSize}px Inter`;
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const lines = text.split('\n');
    lines.forEach((line, index) => {
        const y = canvas.height / 2 + (index - lines.length / 2 + 0.5) * (fontSize + 10);
        context.fillText(line, canvas.width / 2, y);
    });

    return new THREE.CanvasTexture(canvas);
}

// Helper to create interactive objects
function createInteractiveObject(mesh, data, label) {
    mesh.userData = { interactive: true, data, label };
    interactiveObjects.push(mesh);
    return mesh;
}

// EXPERIENCE OBJECTS - Monuments and landmarks
function createExperienceObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Morgan Stanley - Large stone monument
    const msGroup = new THREE.Group();
    const monumentGeometry = new THREE.BoxGeometry(6, 5, 1);
    const monumentMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x4a4a4a : 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });
    const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
    monument.position.y = 2.5;
    monument.castShadow = true;
    monument.receiveShadow = true;
    msGroup.add(monument);

    // Text on monument
    const msTexture = createTextTexture('MORGAN\nSTANLEY\n2021-Present', 45, 'rgba(139, 90, 158, 0.8)', '#ffffff');
    const msTextMaterial = new THREE.MeshStandardMaterial({ map: msTexture, transparent: true });
    const msTextPlane = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), msTextMaterial);
    msTextPlane.position.set(0, 2.5, 0.51);
    msGroup.add(msTextPlane);

    msGroup.position.set(-20, 0, -10);
    scene.add(msGroup);
    createInteractiveObject(msGroup, 'experience', 'Morgan Stanley Experience');
    solidObjects.push(msGroup);

    // TIAA - Wooden signboard
    const tiaaGroup = new THREE.Group();
    const post1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x3d2817 : 0x6b4423, roughness: 0.9 })
    );
    post1.position.set(-1.5, 2, 0);
    post1.castShadow = true;
    tiaaGroup.add(post1);

    const post2 = post1.clone();
    post2.position.set(1.5, 2, 0);
    post2.castShadow = true;
    tiaaGroup.add(post2);

    const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 0.3),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x5a4a3a : 0x8b7355, roughness: 0.8 })
    );
    signBoard.position.y = 3;
    signBoard.castShadow = true;
    tiaaGroup.add(signBoard);

    const tiaaTexture = createTextTexture('TIAA\n2019-2021', 50, 'rgba(245, 222, 179, 0.9)', '#2d2d2d');
    const tiaaTextPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 1.8),
        new THREE.MeshStandardMaterial({ map: tiaaTexture, transparent: true })
    );
    tiaaTextPlane.position.set(0, 3, 0.16);
    tiaaGroup.add(tiaaTextPlane);

    tiaaGroup.position.set(-10, 0, -25);
    scene.add(tiaaGroup);
    createInteractiveObject(tiaaGroup, 'experience', 'TIAA Experience');
    solidObjects.push(tiaaGroup);

    // TCS - Stone pillar/obelisk
    const tcsGroup = new THREE.Group();
    const pillarGeometry = new THREE.CylinderGeometry(0.8, 1.2, 6, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x3a3a3a : 0x707070,
        roughness: 0.9
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 3;
    pillar.castShadow = true;
    tcsGroup.add(pillar);

    const capGeometry = new THREE.ConeGeometry(1, 1.5, 4);
    const cap = new THREE.Mesh(capGeometry, pillarMaterial);
    cap.position.y = 6.5;
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    tcsGroup.add(cap);

    const tcsTexture = createTextTexture('TCS\n2017-19', 40, 'rgba(139, 90, 158, 0.7)', '#ffffff');
    const tcsPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshStandardMaterial({ map: tcsTexture, transparent: true })
    );
    tcsPlane.position.set(0, 3, 0.81);
    tcsGroup.add(tcsPlane);

    tcsGroup.position.set(-25, 0, -40);
    scene.add(tcsGroup);
    createInteractiveObject(tcsGroup, 'experience', 'TCS Experience');
    solidObjects.push(tcsGroup);
}

// SKILLS OBJECTS - Creative themed objects
function createSkillsObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Java - Coffee cup
    const javaCup = new THREE.Group();
    const cupGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1.5, 16);
    const cupMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.2
    });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.y = 0.75;
    cup.castShadow = true;
    javaCup.add(cup);

    const handleGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, cupMaterial);
    handle.rotation.y = -Math.PI / 2;
    handle.position.set(0.7, 0.75, 0);
    handle.castShadow = true;
    javaCup.add(handle);

    javaCup.position.set(10, 0, -8);
    scene.add(javaCup);
    createInteractiveObject(javaCup, 'skills', 'Java');
    solidObjects.push(javaCup);

    // Spring - Coiled spring (movable)
    const springGeometry = new THREE.TorusGeometry(0.8, 0.2, 16, 32);
    const springMaterial = new THREE.MeshStandardMaterial({
        color: 0x6aaa64,
        roughness: 0.4,
        metalness: 0.7
    });
    const spring = new THREE.Mesh(springGeometry, springMaterial);
    spring.position.set(15, 0.5, -15);
    spring.castShadow = true;
    spring.receiveShadow = true;
    scene.add(spring);
    createInteractiveObject(spring, 'skills', 'Spring Framework');
    movableObjects.push({ mesh: spring, velocity: new THREE.Vector3() });

    // Angular - Red angular shape (solid)
    const angularGeometry = new THREE.OctahedronGeometry(1.2);
    const angularMaterial = new THREE.MeshStandardMaterial({
        color: 0xdd0031,
        roughness: 0.3,
        metalness: 0.6
    });
    const angular = new THREE.Mesh(angularGeometry, angularMaterial);
    angular.position.set(20, 1.2, -22);
    angular.castShadow = true;
    scene.add(angular);
    createInteractiveObject(angular, 'skills', 'Angular');
    solidObjects.push(angular);

    // MySQL - Database barrel (movable)
    const mysqlGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
    const mysqlMaterial = new THREE.MeshStandardMaterial({
        color: 0x00758f,
        roughness: 0.5,
        metalness: 0.5
    });
    const mysql = new THREE.Mesh(mysqlGeometry, mysqlMaterial);
    mysql.position.set(25, 0.75, -30);
    mysql.castShadow = true;
    scene.add(mysql);
    createInteractiveObject(mysql, 'skills', 'MySQL');
    movableObjects.push({ mesh: mysql, velocity: new THREE.Vector3() });

    // MongoDB - Green leaf database (movable)
    const mongoGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    const mongoMaterial = new THREE.MeshStandardMaterial({
        color: 0x4db33d,
        roughness: 0.5
    });
    const mongo = new THREE.Mesh(mongoGeometry, mongoMaterial);
    mongo.position.set(30, 0.8, -38);
    mongo.castShadow = true;
    scene.add(mongo);
    createInteractiveObject(mongo, 'skills', 'MongoDB');
    movableObjects.push({ mesh: mongo, velocity: new THREE.Vector3() });

    // Git - Branching structure (solid)
    const gitGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
    const gitMat = new THREE.MeshStandardMaterial({ color: 0xf05032, roughness: 0.7 });
    const trunk = new THREE.Mesh(trunkGeo, gitMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    gitGroup.add(trunk);

    const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), gitMat);
    branch1.position.set(-0.5, 2, 0);
    branch1.rotation.z = Math.PI / 4;
    branch1.castShadow = true;
    gitGroup.add(branch1);

    const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8), gitMat);
    branch2.position.set(0.5, 2, 0);
    branch2.rotation.z = -Math.PI / 4;
    branch2.castShadow = true;
    gitGroup.add(branch2);

    gitGroup.position.set(12, 0, -35);
    scene.add(gitGroup);
    createInteractiveObject(gitGroup, 'skills', 'Git');
    solidObjects.push(gitGroup);

    // HTML - Building block (movable)
    const htmlGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const htmlMaterial = new THREE.MeshStandardMaterial({
        color: 0xe34c26,
        roughness: 0.6
    });
    const htmlBlock = new THREE.Mesh(htmlGeometry, htmlMaterial);
    htmlBlock.position.set(18, 0.6, -42);
    htmlBlock.rotation.y = Math.PI / 6;
    htmlBlock.castShadow = true;
    scene.add(htmlBlock);
    createInteractiveObject(htmlBlock, 'skills', 'HTML');
    movableObjects.push({ mesh: htmlBlock, velocity: new THREE.Vector3() });

    // CSS - Paint bucket (movable)
    const cssGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
    const cssMaterial = new THREE.MeshStandardMaterial({
        color: 0x264de4,
        roughness: 0.5
    });
    const cssBucket = new THREE.Mesh(cssGeometry, cssMaterial);
    cssBucket.position.set(22, 0.6, -48);
    cssBucket.castShadow = true;
    scene.add(cssBucket);
    createInteractiveObject(cssBucket, 'skills', 'CSS');
    movableObjects.push({ mesh: cssBucket, velocity: new THREE.Vector3() });

    // JavaScript - Scroll (movable)
    const jsGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
    const jsMaterial = new THREE.MeshStandardMaterial({
        color: 0xf7df1e,
        roughness: 0.7
    });
    const jsScroll = new THREE.Mesh(jsGeometry, jsMaterial);
    jsScroll.position.set(28, 0.75, -12);
    jsScroll.rotation.z = Math.PI / 2;
    jsScroll.castShadow = true;
    scene.add(jsScroll);
    createInteractiveObject(jsScroll, 'skills', 'JavaScript');
    movableObjects.push({ mesh: jsScroll, velocity: new THREE.Vector3() });

    // Jenkins - Pipeline (solid)
    const jenkinsGroup = new THREE.Group();
    const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0xd24939, roughness: 0.5, metalness: 0.6 })
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 1.5, 0);
    pipe.castShadow = true;
    jenkinsGroup.add(pipe);

    jenkinsGroup.position.set(35, 0, -18);
    scene.add(jenkinsGroup);
    createInteractiveObject(jenkinsGroup, 'skills', 'Jenkins');
    solidObjects.push(jenkinsGroup);
}

// AWARDS OBJECTS - Trophies and monuments
function createAwardsObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Tech Showcase Winner - Golden trophy
    const trophyGroup = new THREE.Group();
    const cupGeometry = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9
    });
    const trophyCup = new THREE.Mesh(cupGeometry, goldMaterial);
    trophyCup.position.y = 2;
    trophyCup.castShadow = true;
    trophyGroup.add(trophyCup);

    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1, 8),
        goldMaterial
    );
    stem.position.y = 1;
    stem.castShadow = true;
    trophyGroup.add(stem);

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
        goldMaterial
    );
    base.position.y = 0.2;
    base.castShadow = true;
    trophyGroup.add(base);

    trophyGroup.position.set(-15, 0, -50);
    scene.add(trophyGroup);
    createInteractiveObject(trophyGroup, 'awards', 'Tech Showcase Winner');
    solidObjects.push(trophyGroup);

    // Pat on the Back - Hand sculpture
    const handGroup = new THREE.Group();
    const palm = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 })
    );
    palm.position.y = 1.5;
    palm.rotation.x = Math.PI / 6;
    palm.castShadow = true;
    handGroup.add(palm);

    const thumb = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.8, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 })
    );
    thumb.position.set(0.6, 1.5, 0);
    thumb.rotation.z = Math.PI / 3;
    thumb.castShadow = true;
    handGroup.add(thumb);

    handGroup.position.set(-8, 0, -55);
    scene.add(handGroup);
    createInteractiveObject(handGroup, 'awards', 'Pat on the Back Award');
    solidObjects.push(handGroup);

    // On the Spot Award - Star monument
    const starGroup = new THREE.Group();
    const starGeometry = new THREE.SphereGeometry(1, 5, 5);
    const starMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.y = 2;
    star.castShadow = true;
    starGroup.add(star);

    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x4a4a4a : 0x808080, roughness: 0.8 })
    );
    pedestal.position.y = 0.75;
    pedestal.castShadow = true;
    starGroup.add(pedestal);

    starGroup.position.set(-2, 0, -60);
    scene.add(starGroup);
    createInteractiveObject(starGroup, 'awards', 'On the Spot Award');
    solidObjects.push(starGroup);

    // Arctic Code Vault - Ice crystal
    const crystalGeometry = new THREE.OctahedronGeometry(1.5);
    const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8,
        emissive: 0x4488ff,
        emissiveIntensity: 0.2
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.position.set(5, 1.5, -65);
    crystal.rotation.y = Math.PI / 4;
    crystal.castShadow = true;
    scene.add(crystal);
    createInteractiveObject(crystal, 'awards', 'Arctic Code Vault Contributor');
    solidObjects.push(crystal);
}

// ABOUT OBJECTS - Education and contact
function createAboutObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Education - Graduation cap
    const capGroup = new THREE.Group();
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.2, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.6 })
    );
    board.position.y = 2;
    board.rotation.y = Math.PI / 4;
    board.castShadow = true;
    capGroup.add(board);

    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.6 })
    );
    top.position.y = 1.5;
    top.castShadow = true;
    capGroup.add(top);

    const tassel = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 })
    );
    tassel.position.set(1.2, 2, 1.2);
    tassel.castShadow = true;
    capGroup.add(tassel);

    capGroup.position.set(30, 0, -55);
    scene.add(capGroup);
    createInteractiveObject(capGroup, 'about', 'Education');
    solidObjects.push(capGroup);

    // Contact Billboard
    const billboardGroup = new THREE.Group();
    const billboard = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x2d2d2d : 0x6d4579, roughness: 0.5 })
    );
    billboard.position.y = 3;
    billboard.castShadow = true;
    billboardGroup.add(billboard);

    const contactTexture = createTextTexture('DIVIJ\nSHRIVASTAVA\nSoftware\nEngineer', 35, 'rgba(139, 90, 158, 0.9)', '#ffffff');
    const contactPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 2.8),
        new THREE.MeshStandardMaterial({ map: contactTexture, transparent: true })
    );
    contactPlane.position.set(0, 3, 0.16);
    billboardGroup.add(contactPlane);

    const support1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 3, 8),
        new THREE.MeshStandardMaterial({ color: isDark ? 0x3a3a3a : 0x505050, roughness: 0.7 })
    );
    support1.position.set(-2, 1.5, 0);
    support1.castShadow = true;
    billboardGroup.add(support1);

    const support2 = support1.clone();
    support2.position.set(2, 1.5, 0);
    support2.castShadow = true;
    billboardGroup.add(support2);

    billboardGroup.position.set(38, 0, -62);
    scene.add(billboardGroup);
    createInteractiveObject(billboardGroup, 'about', 'About Me');
    solidObjects.push(billboardGroup);
}

function createEnvironment() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Trees scattered around
    const treePositions = [
        { x: -25, z: 5 }, { x: 25, z: 5 }, { x: -30, z: -20 },
        { x: 30, z: -20 }, { x: 0, z: -50 }, { x: -35, z: -45 },
        { x: 35, z: -45 }, { x: -40, z: 10 }, { x: 40, z: 10 },
        { x: -10, z: 20 }, { x: 10, z: 20 }, { x: 0, z: -60 }
    ];

    treePositions.forEach(pos => {
        // Tree group (solid obstacle)
        const treeGroup = new THREE.Group();

        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x4a3428 : 0x6b4423,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Tree foliage (sphere)
        const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x2d5a2d : 0x4a9d4a,
            roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 4;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);

        treeGroup.position.set(pos.x, 0, pos.z);
        scene.add(treeGroup);
        solidObjects.push(treeGroup);
    });

    // Decorative pillars/posts around sections
    const pillarPositions = [
        { x: -20, z: -5 }, { x: -10, z: -5 }, { x: 10, z: -5 }, { x: 20, z: -5 },
        { x: -20, z: -15 }, { x: 20, z: -15 },
        { x: -20, z: -30 }, { x: -10, z: -30 }, { x: 10, z: -30 }, { x: 20, z: -30 },
        { x: -20, z: -40 }, { x: 20, z: -40 }
    ];

    pillarPositions.forEach(pos => {
        const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x3a3a3a : 0xb8b0c0,
            roughness: 0.6,
            metalness: 0.4
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(pos.x, 2, pos.z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);

        // Top sphere decoration
        const topGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x6d4579 : 0x8b5a9e,
            roughness: 0.4,
            metalness: 0.6,
            emissive: isDark ? 0x6d4579 : 0x8b5a9e,
            emissiveIntensity: 0.2
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(pos.x, 4.5, pos.z);
        top.castShadow = true;
        scene.add(top);
    });

    // Boundary markers at edges
    const boundaryPositions = [
        // Front
        { x: -50, z: 20 }, { x: -30, z: 20 }, { x: -10, z: 20 },
        { x: 10, z: 20 }, { x: 30, z: 20 }, { x: 50, z: 20 },
        // Back
        { x: -50, z: -70 }, { x: -30, z: -70 }, { x: -10, z: -70 },
        { x: 10, z: -70 }, { x: 30, z: -70 }, { x: 50, z: -70 },
        // Left
        { x: -50, z: 0 }, { x: -50, z: -20 }, { x: -50, z: -40 }, { x: -50, z: -60 },
        // Right
        { x: 50, z: 0 }, { x: 50, z: -20 }, { x: 50, z: -40 }, { x: 50, z: -60 }
    ];

    boundaryPositions.forEach(pos => {
        const boundaryGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
        const boundaryMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x5a3d54 : 0xa87ab8,
            roughness: 0.5,
            metalness: 0.5
        });
        const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundary.position.set(pos.x, 1, pos.z);
        boundary.castShadow = true;
        boundary.receiveShadow = true;
        scene.add(boundary);
    });

    // Small decorative cubes scattered around
    const cubePositions = [
        { x: -5, z: 0, size: 0.8 }, { x: 5, z: 0, size: 0.6 },
        { x: -8, z: -22, size: 0.7 }, { x: 8, z: -22, size: 0.9 },
        { x: 0, z: -45, size: 0.5 }, { x: -25, z: -12, size: 0.6 },
        { x: 25, z: -12, size: 0.8 }, { x: -25, z: -38, size: 0.7 },
        { x: 25, z: -38, size: 0.6 }
    ];

    cubePositions.forEach(pos => {
        const cubeGeometry = new THREE.BoxGeometry(pos.size, pos.size, pos.size);
        const cubeMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x4a3a4a : 0xc0b0d0,
            roughness: 0.6,
            metalness: 0.3
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(pos.x, pos.size / 2, pos.z);
        cube.rotation.y = Math.random() * Math.PI;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
    });

    // Road/path markers between sections
    const pathMarkers = [
        { x: 0, z: 0 }, { x: 0, z: -5 }, { x: 0, z: -10 },
        { x: 0, z: -15 }, { x: 0, z: -20 }, { x: 0, z: -25 },
        { x: 0, z: -30 }, { x: 0, z: -35 }, { x: 0, z: -40 }
    ];

    pathMarkers.forEach(pos => {
        const markerGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x6d6d6d : 0xffffff,
            roughness: 0.8,
            transparent: true,
            opacity: 0.6
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(pos.x, 0.06, pos.z);
        marker.receiveShadow = true;
        scene.add(marker);
    });
}

function addEventListeners() {
    // Start button
    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('welcomeOverlay').classList.add('hidden');
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('contentModal').addEventListener('click', (e) => {
        if (e.target.id === 'contentModal') closeModal();
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Mute toggle
    document.getElementById('muteToggle').addEventListener('click', toggleMute);

    // Mouse wheel for camera angle control
    const canvas = document.getElementById('webglCanvas');
    const cameraAngleDisplay = document.getElementById('cameraAngleValue');

    const handleWheel = (e) => {
        e.preventDefault();
        // Scroll down (positive deltaY) = lower angle (towards ground)
        // Scroll up (negative deltaY) = higher angle (towards top-down)
        const delta = e.deltaY * 0.001;
        cameraAngle -= delta;
        cameraAngle = Math.max(minCameraAngle, Math.min(maxCameraAngle, cameraAngle));

        // Update display
        const angleInDegrees = Math.round(cameraAngle * 180 / Math.PI);
        cameraAngleDisplay.textContent = angleInDegrees + '°';

        console.log('Camera angle:', angleInDegrees, '°');
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function toggleTheme() {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update scene colors
    const isDark = newTheme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1a1a1a : 0xe8e4f0);
    scene.fog.color = new THREE.Color(isDark ? 0x1a1a1a : 0xe8e4f0);

    // Update ground color
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'PlaneGeometry' && child.position.y === 0) {
            child.material.color.setHex(isDark ? 0x242424 : 0xd8d0dc);
        }
        // Update tree colors
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.position.y === 1.5) {
            child.material.color.setHex(isDark ? 0x4a3428 : 0x6b4423);
        }
        if (child.geometry && child.geometry.type === 'SphereGeometry' && child.position.y > 3) {
            if (child.position.y < 4.2) { // Tree foliage
                child.material.color.setHex(isDark ? 0x2d5a2d : 0x4a9d4a);
            } else if (child.position.y > 4.2) { // Pillar tops
                child.material.color.setHex(isDark ? 0x6d4579 : 0x8b5a9e);
                child.material.emissive.setHex(isDark ? 0x6d4579 : 0x8b5a9e);
            }
        }
        // Update pillars
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.position.y === 2) {
            child.material.color.setHex(isDark ? 0x3a3a3a : 0xb8b0c0);
        }
        // Update boundary markers
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y === 1 &&
            (Math.abs(child.position.x) >= 50 || Math.abs(child.position.z) >= 60)) {
            child.material.color.setHex(isDark ? 0x5a3d54 : 0xa87ab8);
        }
        // Update decorative cubes
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y < 0.5 && child.position.y > 0.2) {
            child.material.color.setHex(isDark ? 0x4a3a4a : 0xc0b0d0);
        }
        // Update path markers
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y === 0.06) {
            child.material.color.setHex(isDark ? 0x6d6d6d : 0xffffff);
        }
    });
}

function toggleMute() {
    isMuted = !isMuted;
    const muteButton = document.getElementById('muteToggle');

    if (isMuted) {
        muteButton.classList.add('muted');
        // Stop engine sound if running
        if (isEngineRunning) {
            stopEngineSound();
        }
    } else {
        muteButton.classList.remove('muted');
    }

    // Save mute preference
    localStorage.setItem('soundMuted', isMuted);
}

function showModal(dataKey) {
    const modal = document.getElementById('contentModal');
    const content = document.getElementById('modalContent');
    content.innerHTML = portfolioData[dataKey].content;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('contentModal');
    modal.classList.remove('active');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCar() {
    // Forward/Backward
    const isAccelerating = keysPressed['KeyW'] || keysPressed['ArrowUp'];
    const isBraking = keysPressed['KeyS'] || keysPressed['ArrowDown'];

    if (isAccelerating) {
        carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
        if (!isEngineRunning) playEngineSound();
    } else if (isBraking) {
        carSpeed = Math.max(carSpeed - acceleration, -maxSpeed * 0.5);
        if (!isEngineRunning) playEngineSound();
    } else {
        // Deceleration
        if (carSpeed > 0) {
            carSpeed = Math.max(0, carSpeed - deceleration);
        } else if (carSpeed < 0) {
            carSpeed = Math.min(0, carSpeed + deceleration);
        }
        if (Math.abs(carSpeed) < 0.01 && isEngineRunning) {
            stopEngineSound();
        }
    }

    // Update engine sound
    if (isEngineRunning) {
        updateEngineSound(carSpeed);
    }

    // Turning (only when moving)
    if (Math.abs(carSpeed) > 0.01) {
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
            carRotation += turnSpeed;
        }
        if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
            carRotation -= turnSpeed;
        }
    }

    // Store old position for collision detection
    const oldX = car.position.x;
    const oldZ = car.position.z;

    // Apply movement
    car.position.x += Math.sin(carRotation) * carSpeed;
    car.position.z += Math.cos(carRotation) * carSpeed;
    car.rotation.y = carRotation;

    // Collision detection with solid objects (trees and interactive objects)
    let collision = false;
    const carBoundingBox = new THREE.Box3().setFromObject(car);

    solidObjects.forEach(obj => {
        const objBoundingBox = new THREE.Box3().setFromObject(obj);
        if (carBoundingBox.intersectsBox(objBoundingBox)) {
            collision = true;
            // Revert position
            car.position.x = oldX;
            car.position.z = oldZ;
            carSpeed *= -0.3; // Bounce back
            playCollisionSound();
        }
    });

    // Check collisions with movable objects
    movableObjects.forEach(movObj => {
        const objBoundingBox = new THREE.Box3().setFromObject(movObj.mesh);
        if (carBoundingBox.intersectsBox(objBoundingBox)) {
            // Calculate push direction
            const pushDir = new THREE.Vector3(
                movObj.mesh.position.x - car.position.x,
                0,
                movObj.mesh.position.z - car.position.z
            ).normalize();

            // Apply force to movable object
            const force = Math.abs(carSpeed) * 2;
            movObj.velocity.add(pushDir.multiplyScalar(force));

            playCollisionSound();
            carSpeed *= 0.7; // Slow down car
        }
    });

    // Update movable objects physics
    movableObjects.forEach(movObj => {
        // Apply velocity
        movObj.mesh.position.add(movObj.velocity);

        // Apply friction
        movObj.velocity.multiplyScalar(0.92);

        // Keep within bounds
        const maxDist = 85;
        if (Math.abs(movObj.mesh.position.x) > maxDist) {
            movObj.mesh.position.x = Math.sign(movObj.mesh.position.x) * maxDist;
            movObj.velocity.x *= -0.5;
        }
        if (Math.abs(movObj.mesh.position.z) > maxDist) {
            movObj.mesh.position.z = Math.sign(movObj.mesh.position.z) * maxDist;
            movObj.velocity.z *= -0.5;
        }

        // Stop if velocity is very small
        if (movObj.velocity.length() < 0.01) {
            movObj.velocity.set(0, 0, 0);
        }
    });

    // Keep car within bounds
    const maxDist = 90;
    car.position.x = Math.max(-maxDist, Math.min(maxDist, car.position.x));
    car.position.z = Math.max(-maxDist, Math.min(maxDist, car.position.z));

    // Camera follow car with dynamic angle
    // Calculate camera height and distance based on angle
    const cameraHeight = cameraDistance * Math.sin(cameraAngle);
    const cameraHorizontalDist = cameraDistance * Math.cos(cameraAngle);

    // Create offset vector (camera behind and above the car)
    const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraHorizontalDist);

    // Rotate offset to match car rotation
    const rotatedOffset = cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);

    // Position camera
    camera.position.x = car.position.x + rotatedOffset.x;
    camera.position.y = car.position.y + rotatedOffset.y;
    camera.position.z = car.position.z + rotatedOffset.z;

    // Look at a point slightly ahead of the car for better view
    const lookAtPoint = new THREE.Vector3(
        car.position.x,
        car.position.y + 1,
        car.position.z
    );
    camera.lookAt(lookAtPoint);

    // Check for object proximity
    let nearestObject = null;
    let minDist = Infinity;

    interactiveObjects.forEach(obj => {
        const dist = car.position.distanceTo(obj.position);
        if (dist < 5 && dist < minDist && obj.userData.interactive) {
            minDist = dist;
            nearestObject = obj;
        }
    });

    // Update interaction prompt
    const prompt = document.getElementById('interactionPrompt');
    if (nearestObject && nearestObject !== currentObject) {
        currentObject = nearestObject;
        prompt.classList.add('visible');
        prompt.querySelector('p').innerHTML = `<strong>${currentObject.userData.label}</strong><br>Press <strong>E</strong> to view details`;
    } else if (!nearestObject) {
        currentObject = null;
        prompt.classList.remove('visible');
    }

    // Interaction key
    if (keysPressed['KeyE'] && currentObject) {
        showModal(currentObject.userData.data);
        keysPressed['KeyE'] = false; // Prevent repeated triggers
    }
}

function animate() {
    requestAnimationFrame(animate);

    updateCar();

    // Rotate car body slightly based on turning
    if (carBody) {
        const targetTilt = (keysPressed['KeyA'] || keysPressed['ArrowLeft']) ? 0.05 :
                         (keysPressed['KeyD'] || keysPressed['ArrowRight']) ? -0.05 : 0;
        carBody.rotation.z += (targetTilt - carBody.rotation.z) * 0.1;
    }

    renderer.render(scene, camera);
}

// Loading and initialization
window.addEventListener('DOMContentLoaded', () => {
    // Check theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Check mute state
    const savedMuteState = localStorage.getItem('soundMuted');
    if (savedMuteState === 'true') {
        isMuted = true;
        document.getElementById('muteToggle').classList.add('muted');
    }

    // Simulate loading
    const loadingProgress = document.getElementById('loadingProgress');
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
                init();
            }, 500);
        }
        loadingProgress.style.width = progress + '%';
    }, 200);
});
