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

// Camera control variables (adjusted for 4x playground)
let cameraAngle = Math.PI / 4; // Initial angle (45 degrees from horizontal) - more dynamic
const minCameraAngle = Math.PI / 8; // 22.5 degrees (lower, more behind view)
const maxCameraAngle = Math.PI / 2.5; // ~72 degrees (higher, more top-down)
const cameraDistance = 36; // 2x closer camera relative to scale (was 18, could be 72 for 4x, but 36 is better)

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

// NPCs
let npcs = [];

// Audio context and sounds
let audioContext;
let engineSound, accelerateSound, collisionSound, objectHitSound;

// Engine sound state
let isEngineRunning = false;
let engineGainNode;

// Initialize
function init() {
    // Scene with new cyberpunk color theme
    scene = new THREE.Scene();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? 0x0a0e27 : 0xf0f4ff); // Deep space blue / soft blue white
    scene.fog = new THREE.Fog(isDark ? 0x0a0e27 : 0xf0f4ff, 200, 600); // 4x fog distance

    // Camera - More dynamic angle view (Bruno Simon style, adjusted for larger space)
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 24, 24);
    camera.lookAt(0, 0, 0);

    // Renderer
    const canvas = document.getElementById('webglCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights - Cyberpunk neon style
    const ambientLight = new THREE.AmbientLight(isDark ? 0x4a5a8a : 0xd1dfff, isDark ? 0.4 : 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(isDark ? 0x00d4ff : 0xffffff, isDark ? 0.8 : 1.0); // Cyan/white main light
    directionalLight.position.set(30, 50, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add secondary neon light for depth
    const fillLight = new THREE.DirectionalLight(isDark ? 0xff2e97 : 0x6b2bff, isDark ? 0.4 : 0.3); // Pink/purple fill
    fillLight.position.set(-20, 30, -20);
    scene.add(fillLight);

    // Create urban ground with roads
    createUrbanGround(isDark);

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

    // Create NPCs
    createNPCs();

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

function createTextBoard(text, width, height, bgColor = '#ffffff', textColor = '#2d2d2d', isBillboard = false, isZoomable = false) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 2048;  // Increased for better quality
    canvas.height = 1024; // Increased for better quality

    // Background with slight gradient for depth
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, bgColor);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Border - thicker and more visible
    context.strokeStyle = textColor;
    context.lineWidth = 20;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Text with better readability
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'top';

    const lines = text.split('\n');

    // SIGNIFICANTLY increased font sizes for better readability
    let fontSize = isBillboard ? 180 : 140; // Much larger fonts
    const lineHeight = fontSize + 40;

    // First line (title) is bigger
    lines.forEach((line, index) => {
        if (index === 0 && lines.length > 1) {
            context.font = `bold ${fontSize * 1.4}px Arial, sans-serif`; // Bolder, clearer font
        } else {
            context.font = `600 ${fontSize}px Arial, sans-serif`;
        }

        const y = (canvas.height - lines.length * lineHeight) / 2 + index * lineHeight;

        // Add text shadow for better readability
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 4;
        context.shadowOffsetY = 4;

        context.fillText(line, canvas.width / 2, y);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: false
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const board = new THREE.Mesh(geometry, material);
    board.castShadow = true;
    board.receiveShadow = true;

    // Store data for zoom functionality
    if (isBillboard || isZoomable) {
        board.userData.isZoomable = true;
        board.userData.zoomText = text;
        board.userData.zoomTitle = lines[0];
        billboards.push(board);
    }

    return board;
}

function createUrbanGround(isDark) {
    // Main ground - cyberpunk neon grid style (4x larger)
    const groundGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0f1933 : 0xc5d5ff, // Deep navy / light blue
        roughness: isDark ? 0.8 : 0.9,
        metalness: isDark ? 0.2 : 0.1,
        emissive: isDark ? 0x1a2844 : 0x000000,
        emissiveIntensity: isDark ? 0.2 : 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add road markings
    createRoadMarkings();

    // Add sidewalks
    createSidewalks(isDark);

    // Add city buildings in background
    createCityBuildings(isDark);
}

function createRoadMarkings() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Main road down the center (4x larger) - neon style
    const roadGeometry = new THREE.PlaneGeometry(48, 720);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0a0e1f : 0x8896b0,
        roughness: 0.7,
        metalness: isDark ? 0.3 : 0.1,
        emissive: isDark ? 0x1e2744 : 0x000000,
        emissiveIntensity: isDark ? 0.1 : 0
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -40);
    road.receiveShadow = true;
    scene.add(road);

    // Road lane markings - electric cyan/neon (4x spacing and size)
    for (let z = 80; z > -320; z -= 32) {
        const lineGeometry = new THREE.PlaneGeometry(2, 12);
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x00d4ff : 0x0099cc,
            emissive: isDark ? 0x00d4ff : 0x00d4ff,
            emissiveIntensity: isDark ? 0.8 : 0.3
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.02, z);
        scene.add(line);
    }
}

function createSidewalks(isDark) {
    const sidewalkColor = isDark ? 0x1e2744 : 0xa8b5d1;

    // Left sidewalk (4x larger) - neon accented
    const leftSidewalk = new THREE.Mesh(
        new THREE.PlaneGeometry(32, 720),
        new THREE.MeshStandardMaterial({
            color: sidewalkColor,
            roughness: 0.8,
            metalness: isDark ? 0.2 : 0.1,
            emissive: isDark ? 0x2a3558 : 0x000000,
            emissiveIntensity: isDark ? 0.1 : 0
        })
    );
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.set(-40, 0.02, -40);
    leftSidewalk.receiveShadow = true;
    scene.add(leftSidewalk);

    // Right sidewalk (4x larger)
    const rightSidewalk = new THREE.Mesh(
        new THREE.PlaneGeometry(32, 720),
        new THREE.MeshStandardMaterial({
            color: sidewalkColor,
            roughness: 0.8,
            metalness: isDark ? 0.2 : 0.1,
            emissive: isDark ? 0x2a3558 : 0x000000,
            emissiveIntensity: isDark ? 0.1 : 0
        })
    );
    rightSidewalk.rotation.x = -Math.PI / 2;
    rightSidewalk.position.set(40, 0.02, -40);
    rightSidewalk.receiveShadow = true;
    scene.add(rightSidewalk);
}

function createCityBuildings(isDark) {
    const buildingColor = isDark ? 0x1a2340 : 0x8896b0;
    const windowColor = isDark ? 0x00d4ff : 0x6b2bff; // Cyan / purple windows

    // Building positions scaled 4x
    const buildingPositions = [
        { x: -200, z: -80, w: 60, h: 25, d: 80 },
        { x: -220, z: 40, w: 48, h: 30, d: 60 },
        { x: -180, z: -200, w: 72, h: 20, d: 72 },
        { x: 200, z: -80, w: 60, h: 28, d: 80 },
        { x: 220, z: 40, w: 48, h: 22, d: 60 },
        { x: 180, z: -200, w: 72, h: 35, d: 72 }
    ];

    buildingPositions.forEach(building => {
        // Building body
        const buildingGeometry = new THREE.BoxGeometry(building.w, building.h, building.d);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: buildingColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.set(building.x, building.h / 2, building.z);
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        scene.add(buildingMesh);

        // Add windows
        const windowRows = Math.floor(building.h / 3);
        const windowCols = Math.floor(building.w / 2);

        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                const windowGeometry = new THREE.PlaneGeometry(1, 1.5);
                const windowMaterial = new THREE.MeshStandardMaterial({
                    color: windowColor,
                    emissive: windowColor,
                    emissiveIntensity: 0.3
                });
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(
                    building.x - building.w / 2 + col * 2 + 1,
                    2 + row * 3,
                    building.z + building.d / 2 + 0.1
                );
                scene.add(windowMesh);
            }
        }
    });
}

function createNPC(x, z, color) {
    const npc = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    npc.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    npc.add(head);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.castShadow = true;
    npc.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.castShadow = true;
    npc.add(rightLeg);

    npc.position.set(x, 0, z);

    // NPC movement data
    npc.userData = {
        speed: 0.02 + Math.random() * 0.02,
        direction: Math.random() * Math.PI * 2,
        walkTime: 0,
        pauseTime: 0,
        isPaused: false
    };

    scene.add(npc);
    npcs.push(npc);

    return npc;
}

function createNPCs() {
    const npcColors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];

    // Create NPCs at various locations (4x scale)
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * 240;
        const z = -240 + Math.random() * 320;
        const color = npcColors[Math.floor(Math.random() * npcColors.length)];
        createNPC(x, z, color);
    }
}

function updateNPCs() {
    npcs.forEach(npc => {
        if (npc.userData.isPaused) {
            npc.userData.pauseTime++;
            if (npc.userData.pauseTime > 60) { // Pause for ~1 second
                npc.userData.isPaused = false;
                npc.userData.pauseTime = 0;
                npc.userData.direction += (Math.random() - 0.5) * Math.PI / 2;
            }
            return;
        }

        npc.userData.walkTime += npc.userData.speed;

        // Animate legs
        const legSwing = Math.sin(npc.userData.walkTime * 10) * 0.3;
        if (npc.children[2]) npc.children[2].rotation.x = legSwing;
        if (npc.children[3]) npc.children[3].rotation.x = -legSwing;

        // Move NPC
        npc.position.x += Math.sin(npc.userData.direction) * npc.userData.speed;
        npc.position.z += Math.cos(npc.userData.direction) * npc.userData.speed;
        npc.rotation.y = npc.userData.direction;

        // Keep within bounds (4x scale)
        const bounds = 160;
        if (Math.abs(npc.position.x) > bounds || Math.abs(npc.position.z) > bounds) {
            npc.userData.direction += Math.PI;
        }

        // Randomly pause sometimes
        if (Math.random() < 0.01) {
            npc.userData.isPaused = true;
        }

        // Avoid car (4x scale)
        const distToCar = Math.sqrt(
            Math.pow(npc.position.x - car.position.x, 2) +
            Math.pow(npc.position.z - car.position.z, 2)
        );

        if (distToCar < 20) {
            // Turn away from car
            const angleToCar = Math.atan2(
                npc.position.x - car.position.x,
                npc.position.z - car.position.z
            );
            npc.userData.direction = angleToCar;
        }
    });
}

function createSkillBuckets() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create puddles with skill buckets (4x scale) - cyberpunk colors
    const skillGroups = [
        {
            title: 'BACKEND',
            skills: ['Java 8', 'Spring Boot', 'Spring MVC', 'Gradle'],
            x: 80,
            z: -40,
            color: 0x00d4ff // Electric cyan
        },
        {
            title: 'FRONTEND',
            skills: ['Angular 8', 'HTML/CSS', 'JavaScript', 'REST APIs'],
            x: 80,
            z: -100,
            color: 0xff2e97 // Hot pink
        },
        {
            title: 'DATABASES & TOOLS',
            skills: ['MySQL', 'MongoDB', 'Git', 'Jenkins'],
            x: 80,
            z: -160,
            color: 0x00ff88 // Neon green
        }
    ];

    skillGroups.forEach(group => {
        // Create puddle/water feature (4x scale) - neon glow
        const puddleGeometry = new THREE.CircleGeometry(24, 32);
        const puddleMaterial = new THREE.MeshStandardMaterial({
            color: group.color,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: isDark ? 0.6 : 0.5,
            emissive: group.color,
            emissiveIntensity: isDark ? 0.4 : 0.2
        });
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(group.x, 0.02, group.z);
        puddle.receiveShadow = true;
        scene.add(puddle);

        // Title sign above puddle (4x scale)
        const titleBoard = createTextBoard(group.title, 32, 8, '#ffffff', '#2d2d2d', true);
        titleBoard.position.set(group.x, 8, group.z + 32);
        scene.add(titleBoard);

        // Support post for title (4x scale) - neon style
        const postGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x6b2bff : 0x9d4edd,
            roughness: 0.3,
            metalness: 0.7,
            emissive: isDark ? 0x6b2bff : 0x000000,
            emissiveIntensity: isDark ? 0.2 : 0
        });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(group.x, 4, group.z + 32);
        post.castShadow = true;
        scene.add(post);

        // Create skill buckets in and around the puddle (4x scale)
        group.skills.forEach((skill, idx) => {
            const angle = (idx / group.skills.length) * Math.PI * 2;
            const radius = 12;
            const x = group.x + Math.cos(angle) * radius;
            const z = group.z + Math.sin(angle) * radius;

            // Bucket (4x scale)
            const bucketGeometry = new THREE.CylinderGeometry(3.2, 4, 8, 8);
            const bucketMaterial = new THREE.MeshStandardMaterial({
                color: group.color,
                roughness: 0.5,
                metalness: 0.3
            });
            const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
            bucket.position.set(x, 4, z);
            bucket.castShadow = true;
            bucket.receiveShadow = true;
            bucket.userData = { type: 'movable', mass: 1, isSkill: true, skillName: skill };
            scene.add(bucket);
            movableObjects.push(bucket);

            // Label on bucket - make it zoomable (4x scale)
            const labelBoard = createTextBoard(skill, 6, 4, `#${group.color.toString(16).padStart(6, '0')}`, '#ffffff', false, true);
            labelBoard.position.set(x, 4, z + 4.8);
            scene.add(labelBoard);
        });
    });
}

function createCareerSteppingStones() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a stream (4x scale)
    const streamGeometry = new THREE.PlaneGeometry(48, 160);
    const streamMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a3d5c : 0x5dade2,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const stream = new THREE.Mesh(streamGeometry, streamMaterial);
    stream.rotation.x = -Math.PI / 2;
    stream.position.set(-100, 0.02, -60);
    stream.receiveShadow = true;
    scene.add(stream);

    // Title sign (4x scale)
    const titleBoard = createTextBoard('CAREER JOURNEY', 40, 10, '#8b5a9e', '#ffffff', true);
    titleBoard.position.set(-100, 12, 32);
    scene.add(titleBoard);

    // Support post (4x scale)
    const postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-100, 6, 32);
    post.castShadow = true;
    scene.add(post);

    // Job milestones as rideable mountains/hills (4x scale)
    const jobs = [
        { company: 'Morgan Stanley', role: 'Software Engineer', years: '2021-Present', z: -20 },
        { company: 'TIAA GBS', role: 'Software Engineer', years: '2019-2021', z: -60 },
        { company: 'TCS', role: 'Systems Engineer', years: '2017-2019', z: -100 }
    ];

    jobs.forEach((job, index) => {
        const xOffset = (index % 2 === 0) ? -112 : -88;

        // Create mountain/hill shape using multiple geometries (4x scale)
        const mountainGroup = new THREE.Group();

        // Base - wide and flat for driving up
        const baseGeometry = new THREE.CylinderGeometry(20, 24, 4, 16);
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.9,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, mountainMaterial);
        base.position.y = 2;
        mountainGroup.add(base);

        // Mid section - sloping upward
        const midGeometry = new THREE.CylinderGeometry(14, 20, 6, 16);
        const mid = new THREE.Mesh(midGeometry, mountainMaterial);
        mid.position.y = 7;
        mountainGroup.add(mid);

        // Top section - peak
        const topGeometry = new THREE.CylinderGeometry(8, 14, 4.8, 16);
        const top = new THREE.Mesh(topGeometry, mountainMaterial);
        top.position.y = 12.4;
        mountainGroup.add(top);

        // Add rocky texture with small bumps
        [base, mid, top].forEach(mesh => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });

        mountainGroup.position.set(xOffset, 0, job.z);
        mountainGroup.userData = { type: 'rideable_mountain' };
        scene.add(mountainGroup);

        // Info sign at the base of the mountain (4x scale)
        const infoBoard = createTextBoard(`${job.company}\n${job.role}\n${job.years}`, 24, 14, '#d4c4b0', '#2d2d2d', true);
        infoBoard.position.set(xOffset + 28, 8, job.z);
        infoBoard.rotation.y = -Math.PI / 4;
        scene.add(infoBoard);

        // Support post for sign (4x scale)
        const signPostGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        const signPostMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
        const signPost = new THREE.Mesh(signPostGeometry, signPostMaterial);
        signPost.position.set(xOffset + 28, 4, job.z);
        signPost.castShadow = true;
        scene.add(signPost);
    });
}

function createTrophyPodiums() {
    // Trophy Podiums Area - cyberpunk purple
    const areaColor = 0x9d4edd;

    // Title sign (4x scale)
    const titleBoard = createTextBoard('ACHIEVEMENT PLAZA', 48, 12, '#a87ab8', '#ffffff', true);
    titleBoard.position.set(-100, 12, -152);
    scene.add(titleBoard);

    // Support post (4x scale)
    const postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-100, 6, -152);
    post.castShadow = true;
    scene.add(post);

    // Awards as trophies on podiums (4x scale)
    const awards = [
        { title: 'Tech Showcase', org: 'Morgan Stanley', year: '2023-24', x: -120, z: -192 },
        { title: 'Pat on Back', org: 'TIAA', year: '2020', x: -100, z: -192 },
        { title: 'On the Spot', org: 'TCS', year: '2018', x: -80, z: -192 },
        { title: 'Arctic Vault', org: 'GitHub', year: '2020', x: -100, z: -216 }
    ];

    awards.forEach(award => {
        // Tall podium (4x scale)
        const pedestalGeometry = new THREE.CylinderGeometry(6, 8, 12, 8);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: areaColor,
            roughness: 0.5,
            metalness: 0.4
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestal.position.set(award.x, 6, award.z);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        pedestal.userData = { type: 'static' };
        scene.add(pedestal);
        staticObjects.push(pedestal);

        // Trophy (glowing neon sphere on top, 4x scale)
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const trophyGeometry = new THREE.SphereGeometry(2.8, 16, 16);
        const trophyMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0xff2e97 : 0xffd700, // Hot pink in dark / gold in light
            roughness: 0.2,
            metalness: 0.9,
            emissive: isDark ? 0xff2e97 : 0xffcc00,
            emissiveIntensity: isDark ? 0.5 : 0.3
        });
        const trophy = new THREE.Mesh(trophyGeometry, trophyMaterial);
        trophy.position.set(award.x, 14, award.z);
        trophy.castShadow = true;
        scene.add(trophy);

        // Plaque at base (4x scale)
        const plaqueBoard = createTextBoard(`${award.title}\n${award.org}\n${award.year}`, 12, 8, '#ffffff', '#a87ab8', false, true);
        plaqueBoard.position.set(award.x, 2, award.z + 10);
        scene.add(plaqueBoard);
    });
}

function createTechFlowerGarden() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a small flower garden for extra tech/tools (4x scale)
    const gardenPositions = [
        { x: 40, z: 40 },
        { x: -40, z: 40 }
    ];

    const flowers = ['Docker', 'Kubernetes', 'AWS', 'Microservices'];

    gardenPositions.forEach((pos, idx) => {
        flowers.forEach((flower, fIdx) => {
            const angle = (fIdx / flowers.length) * Math.PI * 2;
            const radius = 12;
            const x = pos.x + Math.cos(angle) * radius;
            const z = pos.z + Math.sin(angle) * radius;

            // Flower pot (movable, 4x scale)
            const potGeometry = new THREE.CylinderGeometry(2, 2.8, 4.8, 8);
            const potMaterial = new THREE.MeshStandardMaterial({
                color: 0xd2691e,
                roughness: 0.8
            });
            const pot = new THREE.Mesh(potGeometry, potMaterial);
            pot.position.set(x, 2.4, z);
            pot.castShadow = true;
            pot.receiveShadow = true;
            pot.userData = { type: 'movable', mass: 0.8, isSkill: true, skillName: flower };
            scene.add(pot);
            movableObjects.push(pot);

            // Flower on top (4x scale)
            const flowerGeometry = new THREE.SphereGeometry(1.6, 8, 8);
            const flowerMaterial = new THREE.MeshStandardMaterial({
                color: [0xff69b4, 0xffa500, 0xff6347, 0x9370db][fIdx % 4],
                roughness: 0.6
            });
            const flowerTop = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flowerTop.position.set(x, 6.4, z);
            flowerTop.castShadow = true;
            scene.add(flowerTop);

            // Label (4x scale)
            const labelBoard = createTextBoard(flower, 6, 3.2, '#ffffff', '#2d2d2d', false, true);
            labelBoard.position.set(x, 2.4, z + 3.6);
            scene.add(labelBoard);
        });
    });
}

function createContactLilyPond() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create lily pond (4x scale)
    const pondGeometry = new THREE.CircleGeometry(40, 32);
    const pondMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a3d5c : 0x5dade2,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(0, 0.02, -220);
    pond.receiveShadow = true;
    scene.add(pond);

    // Title sign (4x scale)
    const titleBoard = createTextBoard('WELCOME & CONTACT', 48, 12, '#5a3d54', '#ffffff', true);
    titleBoard.position.set(0, 12, -160);
    scene.add(titleBoard);

    // Support post (4x scale)
    const postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(0, 6, -160);
    post.castShadow = true;
    scene.add(post);

    // Main info lily pad (4x scale)
    const mainLilyGeometry = new THREE.CylinderGeometry(12, 12, 1.2, 8);
    const mainLilyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.7
    });
    const mainLily = new THREE.Mesh(mainLilyGeometry, mainLilyMaterial);
    mainLily.position.set(0, 0.6, -220);
    mainLily.castShadow = true;
    mainLily.receiveShadow = true;
    scene.add(mainLily);

    // Main info on lily pad - make it zoomable (4x scale)
    const mainBoard = createTextBoard('Divij Shrivastava\nSoftware Engineer\n8 Years Experience', 20, 12, '#e8f5e9', '#2d2d2d', false, true);
    mainBoard.rotation.x = -Math.PI / 2;
    mainBoard.position.set(0, 1.24, -220);
    scene.add(mainBoard);

    // Contact lily pads around the main one
    const contactInfo = [
        { text: 'Email:\ndivij.shrivastava\n@gmail.com', angle: 0 },
        { text: 'Phone:\n+91\n8871962152', angle: Math.PI * 2 / 3 },
        { text: 'Web:\ndivij.tech\nGitHub', angle: Math.PI * 4 / 3 }
    ];

    contactInfo.forEach(info => {
        const radius = 24;
        const x = Math.cos(info.angle) * radius;
        const z = -220 + Math.sin(info.angle) * radius;

        // Lily pad (4x scale)
        const lilyGeometry = new THREE.CylinderGeometry(8, 8, 1.2, 8);
        const lilyMaterial = new THREE.MeshStandardMaterial({
            color: 0x90ee90,
            roughness: 0.7
        });
        const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
        lily.position.set(x, 0.6, z);
        lily.castShadow = true;
        lily.receiveShadow = true;
        scene.add(lily);

        // Contact info on lily pad - make it zoomable (4x scale)
        const contactBoard = createTextBoard(info.text, 14, 8, '#e8f5e9', '#2d2d2d', false, true);
        contactBoard.rotation.x = -Math.PI / 2;
        contactBoard.position.set(x, 1.24, z);
        scene.add(contactBoard);
    });

    // Education lily pad (4x scale)
    const eduLilyGeometry = new THREE.CylinderGeometry(10, 10, 1.2, 8);
    const eduLilyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.7
    });
    const eduLily = new THREE.Mesh(eduLilyGeometry, eduLilyMaterial);
    eduLily.position.set(0, 0.6, -252);
    eduLily.castShadow = true;
    eduLily.receiveShadow = true;
    scene.add(eduLily);

    const eduBoard = createTextBoard('Education:\nB.E. Computer\nSRIT Jabalpur\n2012-2016', 16, 12, '#e8f5e9', '#2d2d2d', false, true);
    eduBoard.rotation.x = -Math.PI / 2;
    eduBoard.position.set(0, 1.24, -252);
    scene.add(eduBoard);
}

function createInteractiveObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Barrels scattered around (4x scale)
    const barrelPositions = [
        { x: 20, z: -20 }, { x: -20, z: -20 }, { x: 48, z: -48 },
        { x: -48, z: -48 }, { x: 32, z: -120 }, { x: -32, z: -120 }
    ];

    barrelPositions.forEach(pos => {
        const barrelGeometry = new THREE.CylinderGeometry(3.2, 3.2, 7.2, 12);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(pos.x, 3.6, pos.z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        barrel.userData = { type: 'movable', mass: 2 };
        scene.add(barrel);
        movableObjects.push(barrel);
    });

    // Traffic cones (4x scale)
    const conePositions = [
        { x: 0, z: 20 }, { x: 12, z: 0 }, { x: -12, z: 0 },
        { x: 60, z: -80 }, { x: -60, z: -80 }
    ];

    conePositions.forEach(pos => {
        const coneGeometry = new THREE.ConeGeometry(2, 6, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.6
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(pos.x, 3, pos.z);
        cone.castShadow = true;
        cone.receiveShadow = true;
        cone.userData = { type: 'movable', mass: 0.5 };
        scene.add(cone);
        movableObjects.push(cone);
    });

    // Benches (static obstacles, 4x scale)
    const benchPositions = [
        { x: 60, z: 20, rotation: Math.PI / 4 },
        { x: -60, z: 20, rotation: -Math.PI / 4 }
    ];

    benchPositions.forEach(pos => {
        const benchGroup = new THREE.Group();

        // Bench seat (4x scale)
        const seatGeometry = new THREE.BoxGeometry(12, 1.2, 4);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 3.2, 0);
        seat.castShadow = true;
        seat.receiveShadow = true;
        benchGroup.add(seat);

        // Bench back (4x scale)
        const backGeometry = new THREE.BoxGeometry(12, 4, 0.8);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 4.8, -1.6);
        back.castShadow = true;
        benchGroup.add(back);

        // Legs (4x scale)
        [-4, 4].forEach(xOffset => {
            const legGeometry = new THREE.BoxGeometry(0.8, 3.2, 0.8);
            const leg = new THREE.Mesh(legGeometry, seatMaterial);
            leg.position.set(xOffset, 1.6, 1.2);
            leg.castShadow = true;
            benchGroup.add(leg);

            const leg2 = new THREE.Mesh(legGeometry, seatMaterial);
            leg2.position.set(xOffset, 1.6, -1.2);
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
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Car body - cyberpunk neon style
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x00d4ff : 0x0099cc, // Electric cyan
        roughness: 0.2,
        metalness: 0.8,
        emissive: isDark ? 0x00d4ff : 0x000000,
        emissiveIntensity: isDark ? 0.3 : 0
    });
    carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.8;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    car.add(carBody);

    // Car top/cabin - purple accent
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 2.2);
    const cabinMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x6b2bff : 0x9d4edd, // Vivid purple
        roughness: 0.2,
        metalness: 0.7,
        emissive: isDark ? 0x6b2bff : 0x000000,
        emissiveIntensity: isDark ? 0.2 : 0
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

    // Position car at start (4x scale)
    car.position.set(0, 0, 60);
    scene.add(car);
}

function createEnvironment() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Trees scattered around the edges (4x scale)
    const treePositions = [
        { x: -140, z: 40 }, { x: -140, z: -40 }, { x: -140, z: -120 }, { x: -140, z: -200 },
        { x: 140, z: 40 }, { x: 140, z: -40 }, { x: 140, z: -120 }, { x: 140, z: -200 },
        { x: -40, z: 72 }, { x: 40, z: 72 }, { x: 0, z: -280 },
        // Add more trees for better boundaries
        { x: -72, z: -140 }, { x: 72, z: -140 }
    ];

    treePositions.forEach(pos => {
        const treeGroup = new THREE.Group();

        // Tree trunk (4x scale)
        const trunkGeometry = new THREE.CylinderGeometry(2, 2.4, 16, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x4a3428 : 0x6b4423,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 8, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Tree foliage (4x scale)
        const foliageGeometry = new THREE.SphereGeometry(10, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x2d5a2d : 0x4a9d4a,
            roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(0, 20, 0);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);

        treeGroup.position.set(pos.x, 0, pos.z);
        treeGroup.userData = { type: 'static', radius: 12 };
        scene.add(treeGroup);
        staticObjects.push(treeGroup);
    });

    // Decorative rocks (4x scale)
    const rockPositions = [
        { x: 32, z: -192 }, { x: -32, z: -192 }, { x: 48, z: -220 }
    ];

    rockPositions.forEach(pos => {
        const rockGeometry = new THREE.DodecahedronGeometry(4.8, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(pos.x, 2.4, pos.z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'static', radius: 6 };
        scene.add(rock);
        staticObjects.push(rock);
    });

    // Path markers (4x scale)
    for (let z = 40; z > -280; z -= 32) {
        const markerGeometry = new THREE.BoxGeometry(8, 0.4, 8);
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x444444 : 0xcccccc,
            roughness: 0.8
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 0.24, z);
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

    // Show bubble if within range (4x scale)
    if (nearestBillboard && nearestDistance < 60) {
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
    if (!nearestBillboard || nearestDistance >= 60) {
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
    const text = nearestBillboard.userData.zoomText || nearestBillboard.userData.billboardText;
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

    // Update scene colors - cyberpunk theme
    const isDark = newTheme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x0a0e27 : 0xf0f4ff);
    scene.fog.color = new THREE.Color(isDark ? 0x0a0e27 : 0xf0f4ff);

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

            // Check if car is over the mountain (4x scale)
            if (dist2D < 24) { // Base radius of mountain (4x)
                onMountain = true;

                // Calculate height based on distance from center
                // Mountains are roughly 14.8 units tall at center (4x)
                const heightFactor = Math.max(0, 1 - dist2D / 24);
                const mountainHeight = 14.8 * heightFactor;
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

    // Keep car within bounds (4x scale)
    const maxDist = 360;
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

    // Update NPCs
    updateNPCs();

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
