// Import Three.js
import * as THREE from 'three';

// Three.js Scene Setup
let scene, camera, renderer;
let car, carBody;
let keysPressed = {};
let carSpeed = 0;
let carRotation = 0;

// Car physics
const maxSpeed = 0.3;
const acceleration = 0.01;
const deceleration = 0.005;
const turnSpeed = 0.015; // Reduced from 0.03 for slower rotation

// Camera control variables
let cameraAngle = Math.PI / 3; // Initial angle (60 degrees from horizontal)
const minCameraAngle = Math.PI / 6; // 30 degrees (lower, more behind view)
const maxCameraAngle = Math.PI / 2.2; // ~80 degrees (higher, more top-down)
const cameraDistance = 25;

// Mute state
let isMuted = false;

// Interactive objects arrays
let movableObjects = [];
let staticObjects = [];
let soundsLoaded = false;

// Points system
let points = 0;
let collectedSkills = new Set();

// Billboard tracking for zoom
let billboards = [];
let isZoomed = false;
let nearestBillboard = null;
let nearestDistance = Infinity;

// Audio context and sounds
let audioContext;
let engineSound, accelerateSound, collisionSound, objectHitSound;

// Engine sound state
let isEngineRunning = false;
let engineGainNode;

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

    // Ground - grass-like
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a2a1a : 0x7cb87c,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initialize audio
    initAudio();

    // Create themed playground areas
    createSkillBuckets();
    createCareerSteppingStones();
    createTrophyPodiums();
    createTechFlowerGarden();
    createContactLilyPond();
    createInteractiveObjects();

    // Create environmental objects (trees, obstacles)
    createEnvironment();

    // Create car
    createCar();

    // Add event listeners
    addEventListeners();

    // Start animation
    animate();
}

// Audio initialization
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume audio context on user interaction (required by browsers)
        document.addEventListener('keydown', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });

        // Create engine gain node for volume control
        engineGainNode = audioContext.createGain();
        engineGainNode.gain.value = 0;
        engineGainNode.connect(audioContext.destination);

        // Create oscillator for engine sound
        createEngineSound();

        soundsLoaded = true;
    } catch (e) {
        console.log('Audio not supported:', e);
    }
}

function createEngineSound() {
    if (!audioContext) return;

    // Create a continuous oscillator for engine sound
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 80;

    const oscillator2 = audioContext.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.value = 40;

    const gainNode1 = audioContext.createGain();
    gainNode1.gain.value = 0.3;
    const gainNode2 = audioContext.createGain();
    gainNode2.gain.value = 0.2;

    oscillator.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(engineGainNode);
    gainNode2.connect(engineGainNode);

    oscillator.start();
    oscillator2.start();

    engineSound = { oscillator, oscillator2, gainNode1, gainNode2 };
}

function playCollisionSound(intensity = 1) {
    if (!audioContext || isMuted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = 100;
    gainNode.gain.value = Math.min(intensity * 0.3, 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playObjectHitSound() {
    if (!audioContext || isMuted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 200 + Math.random() * 200;
    gainNode.gain.value = 0.15;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.15);
}

function playSkillCollectSound() {
    if (!audioContext || isMuted) return;

    // Create a pleasant coin/power-up sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Musical interval (major third)
    oscillator1.frequency.value = 523.25; // C5
    oscillator2.frequency.value = 659.25; // E5

    gainNode.gain.value = 0.3;

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator1.start();
    oscillator2.start(audioContext.currentTime + 0.05);

    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator1.stop(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.35);
}

function updateEngineSound(speed) {
    if (!audioContext || !engineSound || isMuted) return;

    const absSpeed = Math.abs(speed);

    if (absSpeed > 0.01) {
        // Engine is running
        const targetVolume = 0.1 + absSpeed * 0.3;
        const targetFreq = 80 + absSpeed * 400;

        engineGainNode.gain.linearRampToValueAtTime(targetVolume, audioContext.currentTime + 0.1);
        engineSound.oscillator.frequency.linearRampToValueAtTime(targetFreq, audioContext.currentTime + 0.1);
        engineSound.oscillator2.frequency.linearRampToValueAtTime(targetFreq / 2, audioContext.currentTime + 0.1);
    } else {
        // Engine idle
        engineGainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 0.2);
        engineSound.oscillator.frequency.linearRampToValueAtTime(80, audioContext.currentTime + 0.2);
        engineSound.oscillator2.frequency.linearRampToValueAtTime(40, audioContext.currentTime + 0.2);
    }
}

function showSkillBubble(skillName, screenX, screenY) {
    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'skill-bubble';
    bubble.style.left = screenX + 'px';
    bubble.style.top = screenY + 'px';

    bubble.innerHTML = `
        <div class="bubble-cloud">
            <div class="bubble-text">${skillName}</div>
            <div class="bubble-points">+1</div>
        </div>
    `;

    document.body.appendChild(bubble);

    // Remove after animation completes
    setTimeout(() => {
        bubble.remove();
    }, 2000);
}

function collectSkill(skillObj) {
    // Check if already collected
    if (collectedSkills.has(skillObj.uuid)) {
        return false;
    }

    // Mark as collected
    collectedSkills.add(skillObj.uuid);

    // Get skill name from userData
    const skillName = skillObj.userData.skillName || 'Skill';

    // Update points
    points++;
    const pointsDisplay = document.getElementById('pointsValue');
    if (pointsDisplay) {
        pointsDisplay.textContent = points;
        // Add animation class
        pointsDisplay.style.transform = 'scale(1.3)';
        setTimeout(() => {
            pointsDisplay.style.transform = 'scale(1)';
        }, 200);
    }

    // Get screen position for bubble
    const vector = new THREE.Vector3();
    skillObj.getWorldPosition(vector);
    vector.project(camera);

    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    // Show bubble effect
    showSkillBubble(skillName, screenX, screenY);

    // Play collection sound
    playSkillCollectSound();

    // Make the skill semi-transparent to show it's collected
    if (skillObj.material) {
        skillObj.material.transparent = true;
        skillObj.material.opacity = 0.3;
    }

    return true;
}

function createTextBoard(text, width, height, bgColor = '#ffffff', textColor = '#2d2d2d', isBillboard = false) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;

    // Background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    context.strokeStyle = textColor;
    context.lineWidth = 8;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Text
    context.fillStyle = textColor;
    context.font = 'bold 48px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    const lines = text.split('\n');
    const lineHeight = 55;
    const startY = (canvas.height - lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const board = new THREE.Mesh(geometry, material);
    board.castShadow = true;
    board.receiveShadow = true;

    // Store billboard data for zoom functionality
    if (isBillboard) {
        board.userData.isBillboard = true;
        board.userData.billboardText = text;
        billboards.push(board);
    }

    return board;
}

function createSkillBuckets() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create puddles with skill buckets
    const skillGroups = [
        {
            title: 'BACKEND',
            skills: ['Java 8', 'Spring Boot', 'Spring MVC', 'Gradle'],
            x: 20,
            z: -10,
            color: 0x4a7ba7
        },
        {
            title: 'FRONTEND',
            skills: ['Angular 8', 'HTML/CSS', 'JavaScript', 'REST APIs'],
            x: 20,
            z: -25,
            color: 0xe67e22
        },
        {
            title: 'DATABASES & TOOLS',
            skills: ['MySQL', 'MongoDB', 'Git', 'Jenkins'],
            x: 20,
            z: -40,
            color: 0x27ae60
        }
    ];

    skillGroups.forEach(group => {
        // Create puddle/water feature (flat blue circle)
        const puddleGeometry = new THREE.CircleGeometry(6, 32);
        const puddleMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x1a3d5c : 0x5dade2,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(group.x, 0.02, group.z);
        puddle.receiveShadow = true;
        scene.add(puddle);

        // Title sign above puddle
        const titleBoard = createTextBoard(group.title, 8, 2, '#ffffff', '#2d2d2d', true);
        titleBoard.position.set(group.x, 2, group.z + 8);
        scene.add(titleBoard);

        // Support post for title
        const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(group.x, 1, group.z + 8);
        post.castShadow = true;
        scene.add(post);

        // Create skill buckets in and around the puddle
        group.skills.forEach((skill, idx) => {
            const angle = (idx / group.skills.length) * Math.PI * 2;
            const radius = 3;
            const x = group.x + Math.cos(angle) * radius;
            const z = group.z + Math.sin(angle) * radius;

            // Bucket
            const bucketGeometry = new THREE.CylinderGeometry(0.8, 1, 2, 8);
            const bucketMaterial = new THREE.MeshStandardMaterial({
                color: group.color,
                roughness: 0.5,
                metalness: 0.3
            });
            const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
            bucket.position.set(x, 1, z);
            bucket.castShadow = true;
            bucket.receiveShadow = true;
            bucket.userData = { type: 'movable', mass: 1, isSkill: true, skillName: skill };
            scene.add(bucket);
            movableObjects.push(bucket);

            // Label on bucket
            const labelBoard = createTextBoard(skill, 1.5, 1, `#${group.color.toString(16).padStart(6, '0')}`, '#ffffff');
            labelBoard.position.set(x, 1, z + 1.2);
            scene.add(labelBoard);
        });
    });
}

function createCareerSteppingStones() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a stream (long water feature)
    const streamGeometry = new THREE.PlaneGeometry(12, 40);
    const streamMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a3d5c : 0x5dade2,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const stream = new THREE.Mesh(streamGeometry, streamMaterial);
    stream.rotation.x = -Math.PI / 2;
    stream.position.set(-25, 0.02, -15);
    stream.receiveShadow = true;
    scene.add(stream);

    // Title sign
    const titleBoard = createTextBoard('CAREER JOURNEY', 10, 2.5, '#8b5a9e', '#ffffff', true);
    titleBoard.position.set(-25, 3, 8);
    scene.add(titleBoard);

    // Support post
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-25, 1.5, 8);
    post.castShadow = true;
    scene.add(post);

    // Job milestones as rideable mountains/hills
    const jobs = [
        { company: 'Morgan Stanley', role: 'Software Engineer', years: '2021-Present', z: -5 },
        { company: 'TIAA GBS', role: 'Software Engineer', years: '2019-2021', z: -15 },
        { company: 'TCS', role: 'Systems Engineer', years: '2017-2019', z: -25 }
    ];

    jobs.forEach((job, index) => {
        const xOffset = (index % 2 === 0) ? -28 : -22;

        // Create mountain/hill shape using multiple geometries
        const mountainGroup = new THREE.Group();

        // Base - wide and flat for driving up
        const baseGeometry = new THREE.CylinderGeometry(5, 6, 1, 16);
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.9,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, mountainMaterial);
        base.position.y = 0.5;
        mountainGroup.add(base);

        // Mid section - sloping upward
        const midGeometry = new THREE.CylinderGeometry(3.5, 5, 1.5, 16);
        const mid = new THREE.Mesh(midGeometry, mountainMaterial);
        mid.position.y = 1.75;
        mountainGroup.add(mid);

        // Top section - peak
        const topGeometry = new THREE.CylinderGeometry(2, 3.5, 1.2, 16);
        const top = new THREE.Mesh(topGeometry, mountainMaterial);
        top.position.y = 3.1;
        mountainGroup.add(top);

        // Add rocky texture with small bumps
        [base, mid, top].forEach(mesh => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });

        mountainGroup.position.set(xOffset, 0, job.z);
        mountainGroup.userData = { type: 'rideable_mountain' };
        scene.add(mountainGroup);

        // Info sign at the base of the mountain
        const infoBoard = createTextBoard(`${job.company}\n${job.role}\n${job.years}`, 6, 3.5, '#d4c4b0', '#2d2d2d', true);
        infoBoard.position.set(xOffset + 7, 2, job.z);
        infoBoard.rotation.y = -Math.PI / 4;
        scene.add(infoBoard);

        // Support post for sign
        const signPostGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const signPostMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
        const signPost = new THREE.Mesh(signPostGeometry, signPostMaterial);
        signPost.position.set(xOffset + 7, 1, job.z);
        signPost.castShadow = true;
        scene.add(signPost);
    });
}

function createTrophyPodiums() {
    // Trophy Podiums Area
    const areaColor = 0xa87ab8;

    // Title sign
    const titleBoard = createTextBoard('ACHIEVEMENT PLAZA', 12, 3, '#a87ab8', '#ffffff', true);
    titleBoard.position.set(-25, 3, -38);
    scene.add(titleBoard);

    // Support post
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-25, 1.5, -38);
    post.castShadow = true;
    scene.add(post);

    // Awards as trophies on podiums
    const awards = [
        { title: 'Tech Showcase', org: 'Morgan Stanley', year: '2023-24', x: -30, z: -48 },
        { title: 'Pat on Back', org: 'TIAA', year: '2020', x: -25, z: -48 },
        { title: 'On the Spot', org: 'TCS', year: '2018', x: -20, z: -48 },
        { title: 'Arctic Vault', org: 'GitHub', year: '2020', x: -25, z: -54 }
    ];

    awards.forEach(award => {
        // Tall podium (static)
        const pedestalGeometry = new THREE.CylinderGeometry(1.5, 2, 3, 8);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: areaColor,
            roughness: 0.5,
            metalness: 0.4
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestal.position.set(award.x, 1.5, award.z);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        pedestal.userData = { type: 'static' };
        scene.add(pedestal);
        staticObjects.push(pedestal);

        // Trophy (golden sphere on top)
        const trophyGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const trophyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.8
        });
        const trophy = new THREE.Mesh(trophyGeometry, trophyMaterial);
        trophy.position.set(award.x, 3.5, award.z);
        trophy.castShadow = true;
        scene.add(trophy);

        // Plaque at base
        const plaqueBoard = createTextBoard(`${award.title}\n${award.org}\n${award.year}`, 3, 2, '#ffffff', '#a87ab8');
        plaqueBoard.position.set(award.x, 0.5, award.z + 2.5);
        scene.add(plaqueBoard);
    });
}

function createTechFlowerGarden() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a small flower garden for extra tech/tools
    const gardenPositions = [
        { x: 10, z: 10 },
        { x: -10, z: 10 }
    ];

    const flowers = ['Docker', 'Kubernetes', 'AWS', 'Microservices'];

    gardenPositions.forEach((pos, idx) => {
        flowers.forEach((flower, fIdx) => {
            const angle = (fIdx / flowers.length) * Math.PI * 2;
            const radius = 3;
            const x = pos.x + Math.cos(angle) * radius;
            const z = pos.z + Math.sin(angle) * radius;

            // Flower pot (movable)
            const potGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8);
            const potMaterial = new THREE.MeshStandardMaterial({
                color: 0xd2691e,
                roughness: 0.8
            });
            const pot = new THREE.Mesh(potGeometry, potMaterial);
            pot.position.set(x, 0.6, z);
            pot.castShadow = true;
            pot.receiveShadow = true;
            pot.userData = { type: 'movable', mass: 0.8, isSkill: true, skillName: flower };
            scene.add(pot);
            movableObjects.push(pot);

            // Flower on top
            const flowerGeometry = new THREE.SphereGeometry(0.4, 8, 8);
            const flowerMaterial = new THREE.MeshStandardMaterial({
                color: [0xff69b4, 0xffa500, 0xff6347, 0x9370db][fIdx % 4],
                roughness: 0.6
            });
            const flowerTop = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flowerTop.position.set(x, 1.6, z);
            flowerTop.castShadow = true;
            scene.add(flowerTop);

            // Label
            const labelBoard = createTextBoard(flower, 1.5, 0.8, '#ffffff', '#2d2d2d');
            labelBoard.position.set(x, 0.6, z + 0.9);
            scene.add(labelBoard);
        });
    });
}

function createContactLilyPond() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create lily pond (circular water feature)
    const pondGeometry = new THREE.CircleGeometry(10, 32);
    const pondMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a3d5c : 0x5dade2,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(0, 0.02, -55);
    pond.receiveShadow = true;
    scene.add(pond);

    // Title sign
    const titleBoard = createTextBoard('WELCOME & CONTACT', 12, 3, '#5a3d54', '#ffffff', true);
    titleBoard.position.set(0, 3, -40);
    scene.add(titleBoard);

    // Support post
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(0, 1.5, -40);
    post.castShadow = true;
    scene.add(post);

    // Main info lily pad (center)
    const mainLilyGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 8);
    const mainLilyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.7
    });
    const mainLily = new THREE.Mesh(mainLilyGeometry, mainLilyMaterial);
    mainLily.position.set(0, 0.15, -55);
    mainLily.castShadow = true;
    mainLily.receiveShadow = true;
    scene.add(mainLily);

    // Main info on lily pad
    const mainBoard = createTextBoard('Divij Shrivastava\nSoftware Engineer\n8 Years Experience', 5, 3, '#e8f5e9', '#2d2d2d');
    mainBoard.rotation.x = -Math.PI / 2;
    mainBoard.position.set(0, 0.31, -55);
    scene.add(mainBoard);

    // Contact lily pads around the main one
    const contactInfo = [
        { text: 'Email:\ndivij.shrivastava\n@gmail.com', angle: 0 },
        { text: 'Phone:\n+91\n8871962152', angle: Math.PI * 2 / 3 },
        { text: 'Web:\ndivij.tech\nGitHub', angle: Math.PI * 4 / 3 }
    ];

    contactInfo.forEach(info => {
        const radius = 6;
        const x = Math.cos(info.angle) * radius;
        const z = -55 + Math.sin(info.angle) * radius;

        // Lily pad
        const lilyGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 8);
        const lilyMaterial = new THREE.MeshStandardMaterial({
            color: 0x90ee90,
            roughness: 0.7
        });
        const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
        lily.position.set(x, 0.15, z);
        lily.castShadow = true;
        lily.receiveShadow = true;
        scene.add(lily);

        // Contact info on lily pad
        const contactBoard = createTextBoard(info.text, 3.5, 2, '#e8f5e9', '#2d2d2d');
        contactBoard.rotation.x = -Math.PI / 2;
        contactBoard.position.set(x, 0.31, z);
        scene.add(contactBoard);
    });

    // Education lily pad
    const eduLilyGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 8);
    const eduLilyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.7
    });
    const eduLily = new THREE.Mesh(eduLilyGeometry, eduLilyMaterial);
    eduLily.position.set(0, 0.15, -63);
    eduLily.castShadow = true;
    eduLily.receiveShadow = true;
    scene.add(eduLily);

    const eduBoard = createTextBoard('Education:\nB.E. Computer\nSRIT Jabalpur\n2012-2016', 4, 3, '#e8f5e9', '#2d2d2d');
    eduBoard.rotation.x = -Math.PI / 2;
    eduBoard.position.set(0, 0.31, -63);
    scene.add(eduBoard);
}

function createInteractiveObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Barrels scattered around
    const barrelPositions = [
        { x: 5, z: -5 }, { x: -5, z: -5 }, { x: 12, z: -12 },
        { x: -12, z: -12 }, { x: 8, z: -30 }, { x: -8, z: -30 }
    ];

    barrelPositions.forEach(pos => {
        const barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 12);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(pos.x, 0.9, pos.z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        barrel.userData = { type: 'movable', mass: 2 };
        scene.add(barrel);
        movableObjects.push(barrel);
    });

    // Traffic cones
    const conePositions = [
        { x: 0, z: 5 }, { x: 3, z: 0 }, { x: -3, z: 0 },
        { x: 15, z: -20 }, { x: -15, z: -20 }
    ];

    conePositions.forEach(pos => {
        const coneGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.6
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(pos.x, 0.75, pos.z);
        cone.castShadow = true;
        cone.receiveShadow = true;
        cone.userData = { type: 'movable', mass: 0.5 };
        scene.add(cone);
        movableObjects.push(cone);
    });

    // Benches (static obstacles)
    const benchPositions = [
        { x: 15, z: 5, rotation: Math.PI / 4 },
        { x: -15, z: 5, rotation: -Math.PI / 4 }
    ];

    benchPositions.forEach(pos => {
        const benchGroup = new THREE.Group();

        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(3, 0.3, 1);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.8, 0);
        seat.castShadow = true;
        seat.receiveShadow = true;
        benchGroup.add(seat);

        // Bench back
        const backGeometry = new THREE.BoxGeometry(3, 1, 0.2);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.2, -0.4);
        back.castShadow = true;
        benchGroup.add(back);

        // Legs
        [-1, 1].forEach(xOffset => {
            const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const leg = new THREE.Mesh(legGeometry, seatMaterial);
            leg.position.set(xOffset, 0.4, 0.3);
            leg.castShadow = true;
            benchGroup.add(leg);

            const leg2 = new THREE.Mesh(legGeometry, seatMaterial);
            leg2.position.set(xOffset, 0.4, -0.3);
            leg2.castShadow = true;
            benchGroup.add(leg2);
        });

        benchGroup.position.set(pos.x, 0, pos.z);
        benchGroup.rotation.y = pos.rotation;
        benchGroup.userData = { type: 'static' };
        scene.add(benchGroup);
        staticObjects.push(benchGroup);
    });
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

function createEnvironment() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Trees scattered around the edges (static obstacles)
    const treePositions = [
        { x: -35, z: 10 }, { x: -35, z: -10 }, { x: -35, z: -30 }, { x: -35, z: -50 },
        { x: 35, z: 10 }, { x: 35, z: -10 }, { x: 35, z: -30 }, { x: 35, z: -50 },
        { x: -10, z: 18 }, { x: 10, z: 18 }, { x: 0, z: -70 },
        // Add more trees for better boundaries
        { x: -18, z: -35 }, { x: 18, z: -35 }
    ];

    treePositions.forEach(pos => {
        const treeGroup = new THREE.Group();

        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.6, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x4a3428 : 0x6b4423,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 2, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Tree foliage
        const foliageGeometry = new THREE.SphereGeometry(2.5, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x2d5a2d : 0x4a9d4a,
            roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(0, 5, 0);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);

        treeGroup.position.set(pos.x, 0, pos.z);
        treeGroup.userData = { type: 'static', radius: 3 };
        scene.add(treeGroup);
        staticObjects.push(treeGroup);
    });

    // Decorative rocks (static)
    const rockPositions = [
        { x: 8, z: -48 }, { x: -8, z: -48 }, { x: 12, z: -55 }
    ];

    rockPositions.forEach(pos => {
        const rockGeometry = new THREE.DodecahedronGeometry(1.2, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(pos.x, 0.6, pos.z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'static', radius: 1.5 };
        scene.add(rock);
        staticObjects.push(rock);
    });

    // Path markers
    for (let z = 10; z > -70; z -= 8) {
        const markerGeometry = new THREE.BoxGeometry(2, 0.1, 2);
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x444444 : 0xcccccc,
            roughness: 0.8
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 0.06, z);
        marker.receiveShadow = true;
        scene.add(marker);
    }
}

function addEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;

        // Zoom functionality (toggle)
        if (e.code === 'KeyZ') {
            if (isZoomed) {
                closeZoom();
            } else {
                zoomToNearestBillboard();
            }
        }

        // Close zoom with ESC
        if (e.code === 'Escape' && isZoomed) {
            closeZoom();
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Mute toggle
    const muteToggle = document.getElementById('muteToggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', toggleMute);
    }

    // Mouse wheel for camera angle control
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        // Scroll down (positive deltaY) = lower angle (towards ground)
        // Scroll up (negative deltaY) = higher angle (towards top-down)
        cameraAngle -= e.deltaY * 0.001;
        cameraAngle = Math.max(minCameraAngle, Math.min(maxCameraAngle, cameraAngle));
    }, { passive: false });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function updateZoomBubble() {
    if (billboards.length === 0 || isZoomed) {
        hideBubble();
        return;
    }

    // Find nearest billboard
    nearestBillboard = null;
    nearestDistance = Infinity;

    billboards.forEach(billboard => {
        const distance = car.position.distanceTo(billboard.position);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestBillboard = billboard;
        }
    });

    // Show bubble if within range
    if (nearestBillboard && nearestDistance < 15) {
        showProximityBubble(nearestBillboard);
    } else {
        hideBubble();
    }
}

function showProximityBubble(billboard) {
    const bubble = document.getElementById('zoomBubble');
    const bubbleText = document.querySelector('.zoom-bubble-text');

    // Get screen position
    const vector = new THREE.Vector3();
    billboard.getWorldPosition(vector);
    vector.project(camera);

    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    bubble.style.left = screenX + 'px';
    bubble.style.top = screenY + 'px';
    bubble.style.transform = 'translate(-50%, -50%)';

    bubbleText.textContent = 'Press Z to view';

    bubble.classList.add('visible', 'small');
    bubble.classList.remove('expanding');
}

function hideBubble() {
    const bubble = document.getElementById('zoomBubble');
    bubble.classList.remove('visible', 'small', 'expanding');
}

function zoomToNearestBillboard() {
    if (!nearestBillboard || nearestDistance >= 15) {
        return;
    }

    // Expand the bubble and show content
    const bubble = document.getElementById('zoomBubble');
    const bubbleText = document.querySelector('.zoom-bubble-text');

    isZoomed = true;

    // Center the bubble
    bubble.style.left = '50%';
    bubble.style.top = '50%';
    bubble.style.transform = 'translate(-50%, -50%)';

    // Format text
    const text = nearestBillboard.userData.billboardText;
    const formattedText = text.split('\n').map((line, index) => {
        if (index === 0) {
            return `<strong>${line}</strong>`;
        }
        return line;
    }).join('<br>');

    // Expand animation
    bubble.classList.remove('small');
    bubble.classList.add('expanding');

    // Update text after a brief delay for smooth animation
    setTimeout(() => {
        bubbleText.innerHTML = formattedText;
    }, 150);
}

function closeZoom() {
    isZoomed = false;
    hideBubble();
    // Update bubble immediately to show "Press Z" again if still in range
    setTimeout(() => updateZoomBubble(), 100);
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

    // Update ground to grass color
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'PlaneGeometry' && child.position.y === 0) {
            child.material.color.setHex(isDark ? 0x1a2a1a : 0x7cb87c);
        }
    });
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('soundMuted', isMuted);

    const muteButton = document.getElementById('muteToggle');
    if (isMuted) {
        muteButton.classList.add('muted');
        if (engineGainNode) {
            engineGainNode.gain.value = 0;
        }
    } else {
        muteButton.classList.remove('muted');
    }
}

function playEngineSound() {
    if (!isMuted && audioContext) {
        isEngineRunning = true;
    }
}

function stopEngineSound() {
    isEngineRunning = false;
    if (engineGainNode) {
        engineGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollision(pos1, radius1, pos2, radius2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < (radius1 + radius2);
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

    // Turning (only when moving)
    if (Math.abs(carSpeed) > 0.01) {
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
            carRotation += turnSpeed;
        }
        if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
            carRotation -= turnSpeed;
        }
    }

    // Update engine sound based on speed
    updateEngineSound(carSpeed);

    // Calculate new position
    const newX = car.position.x + Math.sin(carRotation) * carSpeed;
    const newZ = car.position.z + Math.cos(carRotation) * carSpeed;
    const carRadius = 2;

    let canMove = true;
    let collisionIntensity = 0;

    // Check collision with static objects (trees, rocks, etc.)
    for (const obj of staticObjects) {
        const objRadius = obj.userData.radius || 2;
        if (checkCollision({ x: newX, z: newZ }, carRadius, obj.position, objRadius)) {
            canMove = false;
            collisionIntensity = Math.abs(carSpeed);
            playCollisionSound(collisionIntensity);
            carSpeed *= -0.3; // Bounce back
            break;
        }
    }

    // Check collision with movable objects and push them
    for (const obj of movableObjects) {
        const objRadius = 1;
        if (checkCollision({ x: newX, z: newZ }, carRadius, obj.position, objRadius)) {
            // Check if this is a skill object and collect it
            if (obj.userData.isSkill) {
                collectSkill(obj);
            } else {
                playObjectHitSound();
            }

            // Calculate push direction
            const pushDir = {
                x: obj.position.x - newX,
                z: obj.position.z - newZ
            };
            const pushDist = Math.sqrt(pushDir.x * pushDir.x + pushDir.z * pushDir.z);
            pushDir.x /= pushDist;
            pushDir.z /= pushDist;

            // Push the object based on car speed and object mass
            const pushForce = Math.abs(carSpeed) * 3 / (obj.userData.mass || 1);
            obj.position.x += pushDir.x * pushForce;
            obj.position.z += pushDir.z * pushForce;

            // Add slight rotation for realism
            obj.rotation.y += pushForce * 0.5;

            // Add bounce effect
            if (!obj.userData.bouncing) {
                obj.userData.bouncing = true;
                obj.userData.originalY = obj.position.y;
                obj.userData.bounceTime = 0;
            }

            // Slow down car slightly
            carSpeed *= 0.8;
        }
    }

    // Apply movement if no collision with static objects
    if (canMove) {
        car.position.x = newX;
        car.position.z = newZ;
    }

    car.rotation.y = carRotation;

    // Advanced terrain following for mountains (GTA 5 style)
    let targetY = 0; // Ground level
    let terrainNormalX = 0;
    let terrainNormalZ = 0;
    let onMountain = false;

    scene.children.forEach(child => {
        if (child.userData.type === 'rideable_mountain') {
            const distX = car.position.x - child.position.x;
            const distZ = car.position.z - child.position.z;
            const dist2D = Math.sqrt(distX * distX + distZ * distZ);

            // Check if car is over the mountain (within radius)
            if (dist2D < 6) { // Base radius of mountain
                onMountain = true;

                // Calculate height based on distance from center
                // Mountains are roughly 3.7 units tall at center
                const heightFactor = Math.max(0, 1 - dist2D / 6);
                const mountainHeight = 3.7 * heightFactor;
                targetY = Math.max(targetY, mountainHeight);

                // Calculate slope for car tilting
                // Slope increases as we move away from center
                if (dist2D > 0.1) {
                    const slopeFactor = (1 - heightFactor) * 0.5; // Max tilt of ~28 degrees
                    terrainNormalX = -(distX / dist2D) * slopeFactor;
                    terrainNormalZ = -(distZ / dist2D) * slopeFactor;
                }
            }
        }
    });

    // Smoothly adjust car height with realistic acceleration
    const heightDiff = targetY - car.position.y;
    const lerpSpeed = onMountain ? 0.15 : 0.2; // Slightly slower when on mountain for realism
    car.position.y += heightDiff * lerpSpeed;

    // Apply car tilting based on terrain (GTA 5 style)
    const targetTiltX = terrainNormalX;
    const targetTiltZ = terrainNormalZ;

    // Smoothly interpolate car tilt
    if (!car.userData.tiltX) car.userData.tiltX = 0;
    if (!car.userData.tiltZ) car.userData.tiltZ = 0;

    car.userData.tiltX += (targetTiltX - car.userData.tiltX) * 0.1;
    car.userData.tiltZ += (targetTiltZ - car.userData.tiltZ) * 0.1;

    car.rotation.x = car.userData.tiltX;
    car.rotation.z = car.userData.tiltZ;

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
    camera.lookAt(car.position);
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

    // Update bouncing objects
    movableObjects.forEach(obj => {
        if (obj.userData.bouncing) {
            obj.userData.bounceTime += 0.1;
            const bounceHeight = Math.sin(obj.userData.bounceTime * 3) * 0.3;

            if (bounceHeight < 0.01 && obj.userData.bounceTime > 1) {
                // End bounce
                obj.position.y = obj.userData.originalY;
                obj.userData.bouncing = false;
            } else {
                obj.position.y = obj.userData.originalY + Math.max(0, bounceHeight);
            }
        }
    });

    // Update zoom bubble position and visibility
    updateZoomBubble();

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
        const muteToggleBtn = document.getElementById('muteToggle');
        if (muteToggleBtn) {
            muteToggleBtn.classList.add('muted');
        }
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
