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

// Billboard tracking (zoom functionality removed)
let billboards = [];

// NPCs and Traffic
let npcs = [];
let trafficVehicles = [];
let zebraCrossings = []; // Store zebra crossing positions
let activeBubbles = []; // Track active NPC reaction bubbles for position updates
let policeVehicles = [];
let policeStation;
let policeStationPosition = { x: -300, z: 260 };
let policeArrestBoard;
let lastArrestCount = -1;

// NPC Conversations
const npcConversations = [
    ["Hey there!", "Nice ride you got!", "Have a great day!"],
    ["Welcome to the city!", "Lots to explore here!", "Check out the skill areas!"],
    ["Hi! I'm a software engineer too!", "Been coding for years!", "Love this city!"],
    ["Beautiful day, isn't it?", "Traffic is crazy today!", "Stay safe out there!"],
    ["New around here?", "You should visit the career mountains!", "They're amazing!"],
    ["Yo! Cool car!", "Where'd you get it?", "See you around!"],
    ["Greetings!", "This portfolio is impressive!", "Keep driving!"],
    ["Hey friend!", "Looking for something?", "Everything's labeled here!"],
    ["Nice to meet you!", "I love this cyberpunk theme!", "So futuristic!"],
    ["Howdy!", "Watch out for the traffic!", "Drive safe!"],
    ["Hello there!", "Beautiful architecture, right?", "Enjoy your visit!"],
    ["Hi!", "Have you collected all skills?", "Good luck!"],
    ["What's up?", "Great weather for driving!", "Take care!"],
    ["Hey!", "This city never sleeps!", "Just like NYC!"],
    ["Good to see you!", "Check out the lily pond!", "It's relaxing!"]
];

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
    scene.fog = new THREE.Fog(isDark ? 0x0a0e27 : 0xf0f4ff, 400, 1200); // Increased fog distance for larger map

    // Camera - More dynamic angle view (Bruno Simon style, adjusted for larger space)
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 24, 24);
    camera.lookAt(0, 0, 0);

    // Renderer - Optimized for performance
    const canvas = document.getElementById('webglCanvas');
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false, // Disabled for better performance
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from 2
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Faster than PCFSoftShadowMap

    // Lights - Cyberpunk neon style
    const ambientLight = new THREE.AmbientLight(isDark ? 0x4a5a8a : 0xd1dfff, isDark ? 0.4 : 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(isDark ? 0x00d4ff : 0xffffff, isDark ? 0.8 : 1.0); // Cyan/white main light
    directionalLight.position.set(30, 50, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Reduced from 4096 for better performance
    directionalLight.shadow.mapSize.height = 2048; // Reduced from 4096 for better performance
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
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

    // Create traffic vehicles
    createTrafficVehicles();

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

function showConversationBubble(npc, message) {
    // Get screen position of NPC
    const vector = new THREE.Vector3();
    npc.getWorldPosition(vector);
    vector.y += 2.5; // Position above NPC head
    vector.project(camera);

    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'conversation-bubble';
    bubble.style.left = screenX + 'px';
    bubble.style.top = screenY + 'px';
    bubble.textContent = message;
    bubble.setAttribute('data-npc-id', npc.uuid);

    document.body.appendChild(bubble);

    // Return bubble for tracking
    return bubble;
}

function showNPCReaction(npc) {
    // Don't show reaction if already talking or recently reacted
    if (npc.userData.isTalking || npc.userData.recentlyHit) return;

    npc.userData.recentlyHit = true;

    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'conversation-bubble npc-reaction';
    bubble.textContent = "Hey, watch where you're going!";
    bubble.setAttribute('data-npc-id', npc.uuid);
    document.body.appendChild(bubble);

    // Track bubble for position updates
    const bubbleData = {
        element: bubble,
        npc: npc,
        createdAt: Date.now()
    };
    activeBubbles.push(bubbleData);

    // Remove bubble after 2 seconds
    setTimeout(() => {
        bubble.classList.add('fade-out');
        setTimeout(() => {
            bubble.remove();
            // Remove from active bubbles array
            const index = activeBubbles.indexOf(bubbleData);
            if (index > -1) {
                activeBubbles.splice(index, 1);
            }
        }, 300);
    }, 2000);

    // Reset reaction cooldown after 5 seconds
    setTimeout(() => {
        npc.userData.recentlyHit = false;
    }, 5000);
}

function updateBubblePositions() {
    // Update positions of all active reaction bubbles to follow NPCs
    activeBubbles.forEach(bubbleData => {
        const vector = new THREE.Vector3();
        bubbleData.npc.getWorldPosition(vector);
        vector.y += 2.5; // Position above NPC head
        vector.project(camera);

        const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        bubbleData.element.style.left = screenX + 'px';
        bubbleData.element.style.top = screenY + 'px';
    });
}

function removeConversationBubbles(npcId) {
    const bubbles = document.querySelectorAll(`.conversation-bubble[data-npc-id="${npcId}"]`);
    bubbles.forEach(bubble => {
        bubble.classList.add('fade-out');
        setTimeout(() => bubble.remove(), 300);
    });
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

    return board;
}

function createUrbanGround(isDark) {
    // Main ground - cyberpunk neon grid style (4x larger)
    const groundGeometry = new THREE.PlaneGeometry(1600, 1600, 10, 10); // Reduced segments from 20x20 to 10x10
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

    // Buildings removed - CV content should be unobstructed and prominent
    // createCityBuildings(isDark);
}

function createRoadMarkings() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create circular road OUTSIDE the city - encompasses all CV content
    const roadRadius = 350; // Large radius to surround all resume elements
    const roadWidth = 40; // Width of the road
    const segments = 128; // More segments for smoother large circle

    // Create road using RingGeometry for a circular road
    const roadGeometry = new THREE.RingGeometry(roadRadius - roadWidth / 2, roadRadius + roadWidth / 2, segments);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0a0e1f : 0x8896b0,
        roughness: 0.7,
        metalness: isDark ? 0.3 : 0.1,
        emissive: isDark ? 0x1e2744 : 0x000000,
        emissiveIntensity: isDark ? 0.1 : 0
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    scene.add(road);

    // Lane markings - dashed lines around the circle
    const numDashes = 32;
    for (let i = 0; i < numDashes; i++) {
        const angle = (i / numDashes) * Math.PI * 2;
        const x = Math.cos(angle) * roadRadius;
        const z = Math.sin(angle) * roadRadius;

        const lineGeometry = new THREE.PlaneGeometry(2, 8);
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x00d4ff : 0x0099cc,
            emissive: isDark ? 0x00d4ff : 0x00d4ff,
            emissiveIntensity: isDark ? 0.8 : 0.3
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = -angle; // Rotate to align with circle
        line.position.set(x, 0.02, z);
        scene.add(line);
    }

    // Create zebra crossings at cardinal directions on the circular road with traffic lights
    const crossingAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // North, East, South, West
    zebraCrossings = []; // Reset array
    crossingAngles.forEach((angle, index) => {
        createCircularZebraCrossing(angle, roadRadius, roadWidth, isDark);

        // Create traffic light objects - positioned INSIDE the road edge for better visibility
        const lightX = Math.cos(angle) * (roadRadius - roadWidth / 2 - 15);
        const lightZ = Math.sin(angle) * (roadRadius - roadWidth / 2 - 15);
        const initialState = index % 2 === 0 ? 'green' : 'red';
        const trafficLight = createTrafficLight(lightX, lightZ, angle, isDark, initialState);

        // Per-light independent timing with randomized durations and phase offset
        const greenDuration = 240 + Math.floor(Math.random() * 180); // 4-7 seconds
        const redDuration = 240 + Math.floor(Math.random() * 180);   // 4-7 seconds
        const currentDuration = initialState === 'green' ? greenDuration : redDuration;
        const phaseOffset = Math.floor(Math.random() * currentDuration);

        zebraCrossings.push({
            angle: angle,
            radius: roadRadius,
            x: Math.cos(angle) * roadRadius,
            z: Math.sin(angle) * roadRadius,
            roadWidth: roadWidth,
            lightState: initialState, // Alternate starting states
            lightTimer: phaseOffset,
            lightObject: trafficLight,
            greenDuration: greenDuration,
            redDuration: redDuration,
            currentDuration: currentDuration
        });
    });
}

function createTrafficLight(x, z, angle, isDark, initialState) {
    const lightGroup = new THREE.Group();

    // Traffic light pole - Lower height to fit in camera view
    const poleGeometry = new THREE.CylinderGeometry(2, 2, 10, 16);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 5;
    pole.castShadow = true;
    lightGroup.add(pole);

    // Light box - Reasonable size
    const boxGeometry = new THREE.BoxGeometry(6, 10, 3);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 13;
    box.castShadow = true;
    lightGroup.add(box);

    // Red light (top) - Large spheres for visibility from all angles
    const redLightGeometry = new THREE.SphereGeometry(2, 16, 16);
    const redLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: initialState === 'red' ? 2.0 : 0.1
    });
    const redLight = new THREE.Mesh(redLightGeometry, redLightMaterial);
    redLight.position.set(0, 16, 2);
    lightGroup.add(redLight);

    // Green light (bottom) - Large spheres
    const greenLightGeometry = new THREE.SphereGeometry(2, 16, 16);
    const greenLightMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: initialState === 'green' ? 2.0 : 0.1
    });
    const greenLight = new THREE.Mesh(greenLightGeometry, greenLightMaterial);
    greenLight.position.set(0, 10, 2);
    lightGroup.add(greenLight);

    // Duplicate lights on the opposite side so both directions can see the signal
    const backRedLight = new THREE.Mesh(redLightGeometry, redLightMaterial.clone());
    backRedLight.material.emissiveIntensity = initialState === 'red' ? 2.0 : 0.1;
    backRedLight.position.set(0, 16, -2);
    lightGroup.add(backRedLight);

    const backGreenLight = new THREE.Mesh(greenLightGeometry, greenLightMaterial.clone());
    backGreenLight.material.emissiveIntensity = initialState === 'green' ? 2.0 : 0.1;
    backGreenLight.position.set(0, 10, -2);
    lightGroup.add(backGreenLight);

    // Store light meshes for updates
    lightGroup.userData = {
        redLight: redLight, // backward compatibility
        greenLight: greenLight, // backward compatibility
        redLights: [redLight, backRedLight],
        greenLights: [greenLight, backGreenLight]
    };

    // Position and rotate traffic light
    lightGroup.position.set(x, 0, z);
    lightGroup.rotation.y = -angle;
    scene.add(lightGroup);

    return lightGroup;
}

function createCircularZebraCrossing(angle, roadRadius, roadWidth, isDark) {
    // Create white stripes across the circular road
    const stripeWidth = 3;
    const numStripes = 5;
    const spacing = 2;
    const stripeLength = roadWidth;

    const centerX = Math.cos(angle) * roadRadius;
    const centerZ = Math.sin(angle) * roadRadius;

    for (let i = 0; i < numStripes; i++) {
        const offset = (i - (numStripes - 1) / 2) * (stripeWidth + spacing);
        const x = centerX + Math.cos(angle + Math.PI / 2) * offset;
        const z = centerZ + Math.sin(angle + Math.PI / 2) * offset;

        const stripeGeometry = new THREE.PlaneGeometry(stripeLength, stripeWidth);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.1,
            emissive: isDark ? 0xffffff : 0x000000,
            emissiveIntensity: isDark ? 0.1 : 0
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        stripe.rotation.z = angle; // Rotate to be perpendicular to road (radial direction)
        stripe.position.set(x, 0.03, z);
        stripe.receiveShadow = true;
        scene.add(stripe);
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

// FUNCTION DISABLED - Buildings removed to prioritize CV/resume visibility
function createCityBuildings(isDark) {
    const buildingColor = isDark ? 0x1a2340 : 0x8896b0;
    const windowColor = isDark ? 0x00d4ff : 0x6b2bff; // Cyan / purple windows

    // Building positions scaled 4x
    // Buildings - MOVED OFF CARDINAL AXES for CV/resume visibility (heights reduced)
    // PRIMARY GOAL: Don't block Career Mountains, Skills, or Contact Area!
    const buildingPositions = [
        { x: -35, z: -170, w: 50, h: 20, d: 40 }, // North Building - OFF axis, shorter
        { x: 35, z: 70, w: 50, h: 22, d: 40 }, // South Building - OFF axis, shorter
        { x: 170, z: -20, w: 40, h: 22, d: 50 }, // East Building - Pushed back, shorter
        { x: -170, z: 20, w: 40, h: 18, d: 50 }, // West Building - Pushed back, shorter
        { x: 120, z: -120, w: 45, h: 20, d: 45 }, // NE Building - reduced height
        { x: 120, z: 110, w: 45, h: 22, d: 45 }, // SE Building - moved north, reduced height
        { x: -120, z: -120, w: 45, h: 18, d: 45 }, // NW Building - reduced height
        { x: -120, z: 110, w: 45, h: 20, d: 45 } // SW Building - moved north, reduced height
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

// Shared geometries and materials for NPCs (performance optimization)
const npcSharedGeometry = {
    body: new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6),
    head: new THREE.SphereGeometry(0.25, 6, 6),
    leg: new THREE.CylinderGeometry(0.12, 0.12, 0.8, 4)
};
const npcSharedMaterials = {
    head: new THREE.MeshStandardMaterial({ color: 0xffdbac }),
    leg: new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
};

function createNPC(x, z, color) {
    const npc = new THREE.Group();

    // Body (unique material for color)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(npcSharedGeometry.body, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = false;
    npc.add(body);

    // Head (shared material)
    const head = new THREE.Mesh(npcSharedGeometry.head, npcSharedMaterials.head);
    head.position.y = 1.4;
    head.castShadow = false;
    npc.add(head);

    // Legs (shared geometry and material)
    const leftLeg = new THREE.Mesh(npcSharedGeometry.leg, npcSharedMaterials.leg);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.castShadow = false;
    npc.add(leftLeg);

    const rightLeg = new THREE.Mesh(npcSharedGeometry.leg, npcSharedMaterials.leg);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.castShadow = false;
    npc.add(rightLeg);

    npc.position.set(x, 0, z);

    // NPC movement and conversation data
    npc.userData = {
        speed: 0.02 + Math.random() * 0.02,
        direction: Math.random() * Math.PI * 2,
        walkTime: 0,
        pauseTime: 0,
        isPaused: false,
        proximityTime: 0,
        isTalking: false,
        hasSpoken: false,
        conversationIndex: 0,
        wantsToCross: false,
        targetCrossing: null,
        isOnRoad: false // Will be calculated based on circular road
    };

    scene.add(npc);
    npcs.push(npc);

    return npc;
}

function createNPCs() {
    // Expanded color palette for bustling NYC feel
    const npcColors = [
        0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c,
        0x00d4ff, 0xff2e97, 0x6b2bff, 0xff6d00, 0x00ff88, 0xffd700,
        0xe91e63, 0x9c27b0, 0x673ab7, 0x3f51b5, 0x2196f3, 0x00bcd4
    ];

    // Create NPCs for busy streets (30 NPCs) - Spawn in designated pedestrian zones
    // All zones are INSIDE the circular road (radius 250, inner edge 230)
    const pedestrianZones = [
        { name: 'North Park', xMin: -80, xMax: 80, zMin: 140, zMax: 200 },          // North park
        { name: 'East Skills', xMin: 130, xMax: 180, zMin: -80, zMax: 80 },         // East skills area
        { name: 'West Career', xMin: -180, xMax: -130, zMin: -80, zMax: 80 },       // West career area
        { name: 'South Contact', xMin: -60, xMax: 60, zMin: -220, zMax: -140 },     // South contact area
        { name: 'Inner Circle', xMin: -60, xMax: 60, zMin: -60, zMax: 60 },         // Central area
        { name: 'Outer Circle', xMin: -220, xMax: 220, zMin: -220, zMax: 220 },       // Outer circle
        { name: 'Poor Neighborhood', xMin: -320, xMax: 220, zMin: -320, zMax: 220 },       // Poor neighborhood
        { name: 'Industrial Zone', xMin: -320, xMax: 220, zMin: -320, zMax: 220 },       // Industrial zone
        { name: 'Commercial Zone', xMin: -320, xMax: 220, zMin: -320, zMax: 220 },      // Commercial zone
        { name: 'Residential Zone', xMin: -320, xMax: 220, zMin: -320, zMax: 220 },       // Residential zone
        { name: 'Office Zone', xMin: -320, xMax: 220, zMin: -320, zMax: 220 },       // Office zone
        { name: 'Government Zone', xMin: -320, xMax: 220, zMin: -320, zMax: 220 }       // Government zone
    ];

    // Distribute NPCs across zones (6 per zone)
    for (let i = 0; i < 10; i++) {
        const zone = pedestrianZones[i % pedestrianZones.length];
        const x = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
        const z = zone.zMin + Math.random() * (zone.zMax - zone.zMin);

        const color = npcColors[Math.floor(Math.random() * npcColors.length)];
        createNPC(x, z, color);
    }
}

function createTrafficVehicle(x, z, lane) {
    const vehicle = new THREE.Group();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Real-world inspired vehicle categories
    const VEHICLE_CATEGORIES = [
        { name: 'taxi', weight: 0.12, speedFactor: 1.0, size: { x: 1.0, y: 1.0, z: 1.0 }, colors: [0xffd700] },
        { name: 'economy', weight: 0.22, speedFactor: 0.9, size: { x: 0.95, y: 0.95, z: 0.95 }, colors: [0xe0e0e0, 0x1a1a1a, 0x2196f3] },
        { name: 'sedan', weight: 0.28, speedFactor: 1.0, size: { x: 1.0, y: 1.0, z: 1.0 }, colors: [0xe0e0e0, 0x1a1a1a, 0x6b2bff, 0x00d4ff] },
        { name: 'suv', weight: 0.14, speedFactor: 0.95, size: { x: 1.1, y: 1.1, z: 1.1 }, colors: [0x1a1a1a, 0x556b2f, 0x8b8c89] },
        { name: 'sports', weight: 0.08, speedFactor: 1.4, size: { x: 0.95, y: 0.9, z: 1.1 }, colors: [0xff0000, 0xff6d00, 0x00d4ff] },
        { name: 'truck', weight: 0.10, speedFactor: 0.7, size: { x: 1.2, y: 1.2, z: 1.4 }, colors: [0x8b4513, 0x708090, 0x1a1a1a] },
        { name: 'bus', weight: 0.06, speedFactor: 0.6, size: { x: 1.4, y: 1.3, z: 1.8 }, colors: [0xffd700, 0xff6d00] }
    ];

    function pickCategory() {
        const total = VEHICLE_CATEGORIES.reduce((s, c) => s + c.weight, 0);
        let r = Math.random() * total;
        for (const c of VEHICLE_CATEGORIES) {
            if ((r -= c.weight) <= 0) return c;
        }
        return VEHICLE_CATEGORIES[0];
    }

    const category = pickCategory();

    // Random vehicle colors (NYC taxi yellow, various car colors)
    const palette = category.colors;
    const color = palette[Math.floor(Math.random() * palette.length)];

    // Vehicle body (slightly smaller than player car)
    const size = category.size;
    const bodyGeometry = new THREE.BoxGeometry(1.8 * size.x, 0.7 * size.y, 3.5 * size.z);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: isDark ? color : 0x000000,
        emissiveIntensity: isDark ? 0.1 : 0
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    body.castShadow = true; // Keep shadow for main body only
    vehicle.add(body);

    // Vehicle cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5 * size.x, 0.5 * size.y, 2 * size.z);
    const cabinMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a1a1a : 0x333333,
        roughness: 0.2,
        metalness: 0.8
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.2, -0.3);
    cabin.castShadow = false; // Disabled for performance
    vehicle.add(cabin);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.35 * size.y, 0.35 * size.y, 0.25 * size.x, 8); // Reduced segments from 12 to 8
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
    });

    const wheelPositions = [
        { x: -0.9, z: 1 },
        { x: 0.9, z: 1 },
        { x: -0.9, z: -1 },
        { x: 0.9, z: -1 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.35, pos.z);
        wheel.castShadow = false; // Disabled for performance
        vehicle.add(wheel);
    });

    vehicle.position.set(x, 0, z);
    // For circular road: angle represents position on circle, speed is angular velocity
    const angle = Math.atan2(z, x);
    const baseAngular = 0.0018 + Math.random() * 0.0012; // base angular speed range
    const targetSpeed = (baseAngular * category.speedFactor) * (lane === -1 ? 1 : -1);
    vehicle.userData = {
        angle: angle, // Current angle on circular road
		radius: Math.sqrt(x * x + z * z), // Base distance from center (will add small wobble at runtime)
        angularSpeed: targetSpeed, // Current speed
        targetAngularSpeed: targetSpeed, // Target speed for recovery
        lane: lane,
		wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmplitude: 1.5,
        npcBumpCount: 0,
        policeDispatched: false,
        arrested: false,
        exemptFromPolice: false,
        category: category.name,
        stuckTime: 0,
        laneChangeCooldown: 0,
        targetRadius: null
    };
    // Face tangent to circle - rotation depends on movement direction
    // Counter-clockwise (lane -1): rotation = -angle
    // Clockwise (lane 1): rotation = -angle + π (opposite direction)
    vehicle.rotation.y = lane === -1 ? -angle : (-angle + Math.PI);

    scene.add(vehicle);
    trafficVehicles.push(vehicle);

    return vehicle;
}

function createTrafficVehicles() {
    // Create traffic on both lanes of circular road (reduced for performance)
    const numVehicles = 32; // Reduced from 20 for better performance
    const roadRadius = 350; // Updated to match road
	const roadWidth = 40;

	for (let i = 0; i < numVehicles; i++) {
		const lane = Math.random() > 0.5 ? -1 : 1; // Direction: -1 CCW inner half, 1 CW outer half
		// Randomize radius within half of the road width for the chosen direction
		const padding = 2; // keep some buffer from edges and divider
		const dividerGap = 4; // buffer around center divider
		const innerMin = roadRadius - (roadWidth / 2) + padding;
		const innerMax = roadRadius - dividerGap;
		const outerMin = roadRadius + dividerGap;
		const outerMax = roadRadius + (roadWidth / 2) - padding;
		const laneRadius = lane === -1
			? (innerMin + Math.random() * Math.max(1, (innerMax - innerMin)))
			: (outerMin + Math.random() * Math.max(1, (outerMax - outerMin)));

		// Random angle around the circle
		const angle = Math.random() * Math.PI * 2;
		const x = Math.cos(angle) * laneRadius;
		const z = Math.sin(angle) * laneRadius;

		createTrafficVehicle(x, z, lane);
	}
}

function updateTrafficLights() {
    // Independent per-light timers and randomized durations
    zebraCrossings.forEach(crossing => {
        crossing.lightTimer++;

        const duration = crossing.currentDuration || 300;
        if (crossing.lightTimer > duration) {
            // Switch light state
            crossing.lightState = crossing.lightState === 'green' ? 'red' : 'green';
            crossing.lightTimer = 0;
            crossing.currentDuration = crossing.lightState === 'green' ? (crossing.greenDuration || 300) : (crossing.redDuration || 300);

            // Update visual appearance
            if (crossing.lightObject && crossing.lightObject.userData) {
                const redLights = crossing.lightObject.userData.redLights || [crossing.lightObject.userData.redLight];
                const greenLights = crossing.lightObject.userData.greenLights || [crossing.lightObject.userData.greenLight];

                if (crossing.lightState === 'red') {
                    // Red ON, Green OFF
                    redLights.forEach(l => l.material.emissiveIntensity = 2.0);
                    greenLights.forEach(l => l.material.emissiveIntensity = 0.1);
                } else {
                    // Red OFF, Green ON
                    redLights.forEach(l => l.material.emissiveIntensity = 0.1);
                    greenLights.forEach(l => l.material.emissiveIntensity = 2.0);
                }
            }
        }
    });
}

function updateTrafficVehicles() {
    trafficVehicles.forEach(vehicle => {
        // Skip normal movement if vehicle is arrested (being towed/parked)
        if (vehicle.userData && vehicle.userData.arrested) {
            return;
        }
        // Cooldown timers
        if (vehicle.userData.laneChangeCooldown && vehicle.userData.laneChangeCooldown > 0) {
            vehicle.userData.laneChangeCooldown -= 1;
        }
        // Update angle for circular movement
        const nextAngle = vehicle.userData.angle + vehicle.userData.angularSpeed;

		// Apply gentle lateral wobble so vehicles don't trace identical rings
		vehicle.userData.wobblePhase += 0.003;
		const dynamicRadius = (vehicle.userData.radius || 0) + Math.sin(vehicle.userData.wobblePhase) * (vehicle.userData.wobbleAmplitude || 1.5);

		// Calculate next position on (slightly) varying circular path
		const nextX = Math.cos(nextAngle) * dynamicRadius;
		const nextZ = Math.sin(nextAngle) * dynamicRadius;

        const vehicleRadius = 2;
        let canMove = true;

        // Check collision with static objects (trees, rocks, etc.)
        for (const obj of staticObjects) {
            const objRadius = obj.userData.radius || 2;
            if (checkCollision({ x: nextX, z: nextZ }, vehicleRadius, obj.position, objRadius)) {
                canMove = false;
                // Bounce back by reversing angular speed temporarily
                vehicle.userData.angularSpeed *= -0.3;
                break;
            }
        }

        // Check collision with movable objects (barrels, cones, etc.) and push them
        if (canMove) {
            for (const obj of movableObjects) {
                const objRadius = 1;
                if (checkCollision({ x: nextX, z: nextZ }, vehicleRadius, obj.position, objRadius)) {
                    // Calculate push direction
                    const pushDir = {
                        x: obj.position.x - nextX,
                        z: obj.position.z - nextZ
                    };
                    const pushDist = Math.sqrt(pushDir.x * pushDir.x + pushDir.z * pushDir.z);
                    if (pushDist > 0) {
                        pushDir.x /= pushDist;
                        pushDir.z /= pushDist;

                        // Push the object based on vehicle speed and object mass
                        const pushForce = Math.abs(vehicle.userData.angularSpeed * vehicle.userData.radius) * 3 / (obj.userData.mass || 1);
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
                    }
                    // Slow down vehicle after pushing object
                    vehicle.userData.angularSpeed *= 0.7;
                }
            }
        }

        // Check collision with NPCs
        if (canMove) {
            for (const npc of npcs) {
                const npcRadius = 0.5;
                if (checkCollision({ x: nextX, z: nextZ }, vehicleRadius, npc.position, npcRadius)) {
                    canMove = false;
                    // Show NPC reaction
                    showNPCReaction(npc);
					// Mark NPC as bumped by a car to trigger delayed direction change
					npc.userData.bumpedByCarTime = performance.now();
					// Briefly ignore vehicle collisions so NPC can escape overlap
					npc.userData.ignoreVehicleCollisionUntil = performance.now() + 800;
					// Nudge NPC away from the vehicle to prevent being stuck
					const awayX = npc.position.x - nextX;
					const awayZ = npc.position.z - nextZ;
					const len = Math.hypot(awayX, awayZ) || 1;
					npc.position.x += (awayX / len) * 0.6;
					npc.position.z += (awayZ / len) * 0.6;
                    // Track traffic vehicle offenses and possibly dispatch police
                    vehicle.userData.npcBumpCount = (vehicle.userData.npcBumpCount || 0) + 1;
                    if (vehicle.userData.npcBumpCount >= 3 && !vehicle.userData.policeDispatched && !vehicle.userData.exemptFromPolice) {
                        vehicle.userData.policeDispatched = true;
                        spawnPoliceCar(vehicle);
                    }
                    // Slow down significantly
                    vehicle.userData.angularSpeed *= 0.5;
                    break;
                }
            }
        }

        // Check collision with other traffic vehicles
        if (canMove) {
            for (const otherVehicle of trafficVehicles) {
                if (vehicle !== otherVehicle) {
                    const otherVehicleRadius = 2;
                    if (checkCollision({ x: nextX, z: nextZ }, vehicleRadius, otherVehicle.position, otherVehicleRadius)) {
                        canMove = false;
                        // Bounce back slightly
                        vehicle.userData.angularSpeed *= 0.4;
                        break;
                    }
                }
            }
        }

        // Check collision with player car
        const carRadius = 2;
        if (canMove && checkCollision({ x: nextX, z: nextZ }, vehicleRadius, car.position, carRadius)) {
            canMove = false;
            // Stop or slow down significantly
            vehicle.userData.angularSpeed *= 0.3;
        }

        // Apply movement if no collision
        if (canMove) {
            vehicle.userData.angle = nextAngle;
            vehicle.position.x = nextX;
            vehicle.position.z = nextZ;
            // Update rotation to face tangent direction
            // Counter-clockwise (lane -1): rotation = -angle
            // Clockwise (lane 1): rotation = -angle + π
            vehicle.rotation.y = vehicle.userData.lane === -1 ? -vehicle.userData.angle : (-vehicle.userData.angle + Math.PI);

            // Reset stuck counter when moving
            vehicle.userData.stuckFrames = 0;
        } else {
            // Vehicle is blocked - track how long it's been stuck
            vehicle.userData.stuckFrames = (vehicle.userData.stuckFrames || 0) + 1;

            // Quick evasive maneuver: try adjusting radius slightly to navigate around obstacle
            if (vehicle.userData.stuckFrames > 10 && vehicle.userData.stuckFrames < 60) {
                // Try shifting inward or outward slightly every few frames
                if (vehicle.userData.stuckFrames % 15 === 0) {
                    const radiusAdjustment = (Math.random() - 0.5) * 4; // ±2 units
                    vehicle.userData.radius += radiusAdjustment;

                    // Recalculate position with new radius
                    vehicle.position.x = Math.cos(vehicle.userData.angle) * vehicle.userData.radius;
                    vehicle.position.z = Math.sin(vehicle.userData.angle) * vehicle.userData.radius;
                }
            }

            // If stuck for longer, try reversing briefly to get unstuck
            if (vehicle.userData.stuckFrames > 60 && vehicle.userData.stuckFrames < 90) {
                // Reverse angular direction temporarily
                vehicle.userData.angle -= vehicle.userData.angularSpeed * 2;
                vehicle.position.x = Math.cos(vehicle.userData.angle) * vehicle.userData.radius;
                vehicle.position.z = Math.sin(vehicle.userData.angle) * vehicle.userData.radius;
            }
        }

        // Simple collision avoidance with other traffic and stuck detection
        let isTooCloseAhead = false;
        trafficVehicles.forEach(otherVehicle => {
            if (vehicle !== otherVehicle && vehicle.userData.lane === otherVehicle.userData.lane) {
                // Calculate angular distance (accounting for wraparound)
                let angleDiff = Math.abs(vehicle.userData.angle - otherVehicle.userData.angle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                // Convert to actual distance on the circular path
                const arcDistance = angleDiff * vehicle.userData.radius;

                if (arcDistance < 15) {
                    // Slow down if too close to vehicle ahead
                    vehicle.userData.angularSpeed *= 0.95;
                    isTooCloseAhead = true;
                } else if (arcDistance > 30) {
                    // Speed back up
                    const targetAngularSpeed = (0.15 + Math.random() * 0.1) / vehicle.userData.radius;
                    if (vehicle.userData.lane === 1) {
                        vehicle.userData.angularSpeed = Math.max(-targetAngularSpeed, vehicle.userData.angularSpeed * 1.02);
                    } else {
                        vehicle.userData.angularSpeed = Math.min(targetAngularSpeed, vehicle.userData.angularSpeed * 1.02);
                    }
                }
            }
        });

        // Track stuck state
        const targetAbs = Math.abs(vehicle.userData.targetAngularSpeed || 0);
        const currentAbs = Math.abs(vehicle.userData.angularSpeed || 0);
        if (isTooCloseAhead && currentAbs < targetAbs * 0.6) {
            vehicle.userData.stuckTime = (vehicle.userData.stuckTime || 0) + 1;
        } else {
            vehicle.userData.stuckTime = 0;
        }

        // Attempt lane change if stuck for a while and cooldown expired (reduced threshold for faster response)
        if ((vehicle.userData.stuckTime || 0) > 40 && (!vehicle.userData.laneChangeCooldown || vehicle.userData.laneChangeCooldown <= 0)) {
            // Determine road params from crossings (fallback to defaults)
            const rr = zebraCrossings[0] ? zebraCrossings[0].radius : 350;
            const rw = zebraCrossings[0] ? zebraCrossings[0].roadWidth : 40;
            const padding = 2;
            const dividerGap = 4;
            const innerMin = rr - (rw / 2) + padding;
            const innerMax = rr - dividerGap;
            const outerMin = rr + dividerGap;
            const outerMax = rr + (rw / 2) - padding;

            const newLane = vehicle.userData.lane === -1 ? 1 : -1;
            const candidateRadius = newLane === -1
                ? (innerMin + Math.random() * Math.max(1, (innerMax - innerMin)))
                : (outerMin + Math.random() * Math.max(1, (outerMax - outerMin)));

            // Safety check: ensure no vehicles in the target lane too close ahead
            let safeToChange = true;
            trafficVehicles.forEach(other => {
                if (!safeToChange || other === vehicle) return;
                if (other.userData.lane !== newLane) return;
                // Compare angles
                let angleDiff = Math.abs(vehicle.userData.angle - other.userData.angle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                const arcDistance = angleDiff * candidateRadius;
                if (arcDistance < 18) {
                    safeToChange = false;
                }
            });

            if (safeToChange) {
                vehicle.userData.lane = newLane;
                vehicle.userData.targetRadius = candidateRadius;
                vehicle.userData.laneChangeCooldown = 180; // ~3 seconds (reduced for more responsive traffic)
                vehicle.userData.stuckTime = 0;
                vehicle.userData.stuckFrames = 0; // Reset immediate stuck counter too
            }
        }

        // Smoothly move towards new lane radius if needed
        if (vehicle.userData.targetRadius && Math.abs((vehicle.userData.radius || 0) - vehicle.userData.targetRadius) > 0.1) {
            vehicle.userData.radius += (vehicle.userData.targetRadius - vehicle.userData.radius) * 0.05;
        } else if (vehicle.userData.targetRadius) {
            vehicle.userData.radius = vehicle.userData.targetRadius;
            vehicle.userData.targetRadius = null;
        }

        // Avoid player car (additional distance-based slowing)
        const distToCar = Math.sqrt(
            Math.pow(vehicle.position.x - car.position.x, 2) +
            Math.pow(vehicle.position.z - car.position.z, 2)
        );

        if (distToCar < 10) {
            // Slow down near player
            vehicle.userData.angularSpeed *= 0.9;
        }

    // Traffic light coordination at zebra crossings
    let shouldStopForLight = false;
    for (const crossing of zebraCrossings) {
        // Calculate angular distance to crossing and convert to arc distance along the lane
        let angleDiff = Math.abs(vehicle.userData.angle - crossing.angle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const arcDistance = angleDiff * (vehicle.userData.radius || 0);

        const approachDistance = 50; // start reacting within 50 units (doubled)
        const stopDistance = 14;      // near the line, almost stop on red (doubled)

        if (arcDistance < approachDistance) {
            if (crossing.lightState === 'red') {
                if (arcDistance < stopDistance) {
                    vehicle.userData.angularSpeed *= 0.3; // Almost stop
                    shouldStopForLight = true;
                } else {
                    vehicle.userData.angularSpeed *= 0.8; // Slow approach on red
                }
            } else {
                // Green: no slowdown unless very close and needed for safety; keep speed here
            }
            break;
        }
    }

        // Speed recovery when path is clear (no obstacles, not at red light)
        if (!shouldStopForLight && canMove) {
            const speedDiff = Math.abs(vehicle.userData.targetAngularSpeed) - Math.abs(vehicle.userData.angularSpeed);
            if (speedDiff > 0.0001) {
                // Gradually accelerate back to target speed
                const acceleration = vehicle.userData.targetAngularSpeed * 0.02;
                if (vehicle.userData.lane === -1) {
                    vehicle.userData.angularSpeed = Math.min(
                        vehicle.userData.targetAngularSpeed,
                        vehicle.userData.angularSpeed + Math.abs(acceleration)
                    );
                } else {
                    vehicle.userData.angularSpeed = Math.max(
                        vehicle.userData.targetAngularSpeed,
                        vehicle.userData.angularSpeed - Math.abs(acceleration)
                    );
                }
            }
        }
    });
}

function spawnPoliceCar(targetVehicle) {
	// If target not provided, default to player car
	const target = targetVehicle || car;
	// Do not spawn police if target is exempt
	if (target && target.userData && target.userData.exemptFromPolice) return;
	const police = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(2, 0.8, 4),
		new THREE.MeshStandardMaterial({ color: 0x112244, metalness: 0.2, roughness: 0.6 })
	);
	body.position.y = 0.8;
	police.add(body);

	// Light bar
	const bar = new THREE.Mesh(
		new THREE.BoxGeometry(1.4, 0.2, 0.6),
		new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
	);
	bar.position.set(0, 1.2, 0);
	police.add(bar);

	// Siren lights
	const redSiren = new THREE.Mesh(
		new THREE.SphereGeometry(0.2, 8, 8),
		new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 })
	);
	redSiren.position.set(-0.35, 1.25, 0);
	police.add(redSiren);
	const blueSiren = new THREE.Mesh(
		new THREE.SphereGeometry(0.2, 8, 8),
		new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 0.2 })
	);
	blueSiren.position.set(0.35, 1.25, 0);
	police.add(blueSiren);

	police.position.set(policeStationPosition.x, 0, policeStationPosition.z);
	scene.add(police);

	police.userData = {
		state: 'chasing',
		speed: 0.6,
		target: target,
		redSiren: redSiren,
		blueSiren: blueSiren,
		phase: 0
	};

	policeVehicles.push(police);
}

function updatePoliceVehicles() {
	policeVehicles.forEach(police => {
		// Flash sirens
		police.userData.phase += 0.2;
		const rOn = (Math.sin(police.userData.phase) > 0);
		police.userData.redSiren.material.emissiveIntensity = rOn ? 2.0 : 0.2;
		police.userData.blueSiren.material.emissiveIntensity = rOn ? 0.2 : 2.0;

		if (police.userData.state === 'chasing' && police.userData.target) {
			// If target is exempt, stop chasing
			if (police.userData.target.userData && police.userData.target.userData.exemptFromPolice) {
				police.userData.state = 'parked';
				return;
			}
			const targetPos = police.userData.target.position;
			const dx = targetPos.x - police.position.x;
			const dz = targetPos.z - police.position.z;
			const dist = Math.hypot(dx, dz);
			if (dist > 1) {
				const dirX = dx / dist;
				const dirZ = dz / dist;
				police.position.x += dirX * police.userData.speed;
				police.position.z += dirZ * police.userData.speed;
				police.rotation.y = Math.atan2(dirX, dirZ);
			} else {
				// Arrest and tow
				if (police.userData.target === car) {
					car.userData.arrested = true;
				} else {
					police.userData.target.userData.arrested = true;
				}
				police.userData.state = 'towing';
			}
		} else if (police.userData.state === 'towing') {
			// Move both to police station parking
			const targetX = policeStationPosition.x + 0;
			const targetZ = policeStationPosition.z - 8;
			const dx = targetX - police.position.x;
			const dz = targetZ - police.position.z;
			const dist = Math.hypot(dx, dz);
			if (dist > 0.5) {
				const dirX = dx / dist;
				const dirZ = dz / dist;
				police.position.x += dirX * (police.userData.speed * 0.8);
				police.position.z += dirZ * (police.userData.speed * 0.8);
				police.rotation.y = Math.atan2(dirX, dirZ);
				// Tow target vehicle behind
				const target = police.userData.target;
				if (target) {
					target.position.x = police.position.x - Math.sin(police.rotation.y) * 3;
					target.position.z = police.position.z - Math.cos(police.rotation.y) * 3;
					target.rotation.y = police.rotation.y;
				}
			} else {
				police.userData.state = 'parked';
				// If target was a traffic vehicle, remove it from traffic and leave it at station
				const target = police.userData.target;
				if (target && target !== car) {
					trafficVehicles = trafficVehicles.filter(v => v !== target);
				}
				// Start 60s release timer
				police.userData.releaseAt = performance.now() + 60000;
			}
		}
		else if (police.userData.state === 'parked') {
			// Wait for release
			if (performance.now() >= (police.userData.releaseAt || 0)) {
				const target = police.userData.target;
				if (target) {
					// Reset offense state
					target.userData.arrested = false;
					target.userData.policeDispatched = false;
					target.userData.npcBumpCount = 0;

					if (target === car) {
						// Reposition player car to starting spot and enable control
						car.position.set(0, 0, 60);
						car.rotation.y = 0;
						car.userData.arrested = false;
					} else {
						// Respawn traffic vehicle onto circular road with fresh lane and angle
                        const roadRadius = 350;
                        const roadWidth = 40;
						const padding = 2;
						const dividerGap = 4;
						const innerMin = roadRadius - (roadWidth / 2) + padding;
						const innerMax = roadRadius - dividerGap;
						const outerMin = roadRadius + dividerGap;
						const outerMax = roadRadius + (roadWidth / 2) - padding;
						const lane = Math.random() > 0.5 ? -1 : 1;
						const laneRadius = lane === -1
							? (innerMin + Math.random() * Math.max(1, (innerMax - innerMin)))
							: (outerMin + Math.random() * Math.max(1, (outerMax - outerMin)));
						const angle = Math.random() * Math.PI * 2;
						target.userData.lane = lane;
						target.userData.radius = laneRadius;
						target.userData.angle = angle;
						const targetSpeed = (0.002 + Math.random() * 0.001) * (lane === -1 ? 1 : -1);
						target.userData.angularSpeed = targetSpeed;
						target.userData.targetAngularSpeed = targetSpeed;
						target.position.x = Math.cos(angle) * laneRadius;
						target.position.z = Math.sin(angle) * laneRadius;
						target.rotation.y = lane === -1 ? -angle : (-angle + Math.PI);
						// Ensure it's in the traffic list
						if (!trafficVehicles.includes(target)) {
							trafficVehicles.push(target);
						}
					}
				}
				// Despawn police vehicle
				scene.remove(police);
				policeVehicles = policeVehicles.filter(p => p !== police);
			}
		}

		// Update arrest count display per frame
		updatePoliceArrestBoard();
	});
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

		// If NPC was bumped by a car, after 1 second change direction to left/right/forward/backward
		if (npc.userData.bumpedByCarTime) {
			const elapsed = performance.now() - npc.userData.bumpedByCarTime;
			if (elapsed >= 1000) {
				const offsets = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
				npc.userData.direction += offsets[Math.floor(Math.random() * offsets.length)];
				delete npc.userData.bumpedByCarTime;
			}
		}

        npc.userData.walkTime += npc.userData.speed;

        // Animate legs
        const legSwing = Math.sin(npc.userData.walkTime * 10) * 0.3;
        if (npc.children[2]) npc.children[2].rotation.x = legSwing;
        if (npc.children[3]) npc.children[3].rotation.x = -legSwing;

        // Zebra crossing logic for circular road (enlarged to encompass city)
        const distFromCenter = Math.sqrt(npc.position.x * npc.position.x + npc.position.z * npc.position.z);
        const roadRadius = 250; // Match original NPC logic radius
        const roadWidth = 40;
        const currentlyOnRoad = distFromCenter > roadRadius - roadWidth / 2 && distFromCenter < roadRadius + roadWidth / 2;

        // Randomly decide to cross the road (1% chance per frame if not already crossing)
        if (!npc.userData.wantsToCross && !currentlyOnRoad && Math.random() < 0.01) {
            npc.userData.wantsToCross = true;
            // Find nearest zebra crossing (using actual 2D distance for circular road)
            let nearestCrossing = null;
            let minDist = Infinity;
            zebraCrossings.forEach(crossing => {
                const dist = Math.sqrt(
                    Math.pow(crossing.x - npc.position.x, 2) +
                    Math.pow(crossing.z - npc.position.z, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestCrossing = crossing;
                }
            });
            npc.userData.targetCrossing = nearestCrossing;
        }

        // Navigate to zebra crossing if wanting to cross (circular road)
        if (npc.userData.wantsToCross && npc.userData.targetCrossing && !currentlyOnRoad) {
            const crossing = npc.userData.targetCrossing;
            const distToXing = Math.sqrt(
                Math.pow(crossing.x - npc.position.x, 2) +
                Math.pow(crossing.z - npc.position.z, 2)
            );

            // If far from crossing, navigate towards it
            if (distToXing > 10) {
                const angleToXing = Math.atan2(crossing.x - npc.position.x, crossing.z - npc.position.z);
                npc.userData.direction = angleToXing;
            } else {
                // At crossing - check traffic light before crossing
                if (crossing.lightState === 'green') {
                    // Green light - safe to cross
                    const crossInward = distFromCenter > roadRadius;
                    const targetRadius = crossInward ? roadRadius - roadWidth : roadRadius + roadWidth;
                    const angleToCenter = Math.atan2(-npc.position.x, -npc.position.z);
                    npc.userData.direction = crossInward ? angleToCenter : angleToCenter + Math.PI;
                } else {
                    // Red light - WAIT at crossing
                    // Stand still by pausing briefly
                    if (!npc.userData.waitingAtLight) {
                        npc.userData.waitingAtLight = true;
                    }
                    // Stay in place (don't update direction)
                    return;
                }
            }
        } else if (npc.userData.waitingAtLight) {
            // Was waiting at light, now can move again
            npc.userData.waitingAtLight = false;
        }

        // Check if finished crossing
        if (npc.userData.wantsToCross && currentlyOnRoad !== npc.userData.isOnRoad) {
            if (!currentlyOnRoad && npc.userData.isOnRoad) {
                // Just finished crossing
                npc.userData.wantsToCross = false;
                npc.userData.targetCrossing = null;
                npc.userData.direction = Math.random() * Math.PI * 2; // Random direction after crossing
            }
        }
        npc.userData.isOnRoad = currentlyOnRoad;

        // Calculate next position
        const newX = npc.position.x + Math.sin(npc.userData.direction) * npc.userData.speed;
        const newZ = npc.position.z + Math.cos(npc.userData.direction) * npc.userData.speed;
        const npcRadius = 0.5;

        let canMove = true;

        // Prevent NPCs from entering circular road unless at zebra crossing
        const newDistFromCenter = Math.sqrt(newX * newX + newZ * newZ);
        const willBeOnRoad = newDistFromCenter > roadRadius - roadWidth / 2 && newDistFromCenter < roadRadius + roadWidth / 2;
        if (!npc.userData.wantsToCross && willBeOnRoad && !currentlyOnRoad) {
            // Trying to enter road without permission - stop them
            canMove = false;
            // Turn away from road - turn perpendicular to radial direction
            const angleToCenter = Math.atan2(-npc.position.z, -npc.position.x);
            npc.userData.direction = angleToCenter + Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4;
        }

        // Check collision with static objects (trees, rocks, benches, etc.)
        if (canMove) {
            for (const obj of staticObjects) {
                const objRadius = obj.userData.radius || 2;
                if (checkCollision({ x: newX, z: newZ }, npcRadius, obj.position, objRadius)) {
                    canMove = false;
                    // Turn away from obstacle
                    const angleToObj = Math.atan2(
                        npc.position.x - obj.position.x,
                        npc.position.z - obj.position.z
                    );
                    npc.userData.direction = angleToObj + (Math.random() - 0.5) * Math.PI / 2;
                    break;
                }
            }
        }

        // Check collision with movable objects (barrels, cones, buckets, etc.)
        if (canMove) {
            for (const obj of movableObjects) {
                const objRadius = 1;
                if (checkCollision({ x: newX, z: newZ }, npcRadius, obj.position, objRadius)) {
                    canMove = false;
                    // Turn away from obstacle
                    const angleToObj = Math.atan2(
                        npc.position.x - obj.position.x,
                        npc.position.z - obj.position.z
                    );
                    npc.userData.direction = angleToObj + (Math.random() - 0.5) * Math.PI / 2;
                    break;
                }
            }
        }

        // Check collision with other NPCs
        if (canMove) {
            for (const otherNpc of npcs) {
                if (otherNpc !== npc) {
                    if (checkCollision({ x: newX, z: newZ }, npcRadius, otherNpc.position, npcRadius)) {
                        canMove = false;
                        // Turn to avoid other NPC
                        const angleToNpc = Math.atan2(
                            npc.position.x - otherNpc.position.x,
                            npc.position.z - otherNpc.position.z
                        );
                        npc.userData.direction = angleToNpc + (Math.random() - 0.5) * Math.PI / 2;
                        break;
                    }
                }
            }
        }

        // Check collision with traffic vehicles
        if (canMove) {
			for (const vehicle of trafficVehicles) {
                const vehicleRadius = 2;
				// Allow brief grace period after being bumped to avoid re-colliding while escaping
				const ignoreUntil = npc.userData.ignoreVehicleCollisionUntil || 0;
				const nowTs = performance.now();
				if (nowTs < ignoreUntil) {
					continue;
				}
				if (checkCollision({ x: newX, z: newZ }, npcRadius, vehicle.position, vehicleRadius)) {
                    canMove = false;
                    // Turn to avoid vehicle
                    const angleToVehicle = Math.atan2(
                        npc.position.x - vehicle.position.x,
                        npc.position.z - vehicle.position.z
                    );
                    npc.userData.direction = angleToVehicle + (Math.random() - 0.5) * Math.PI / 2;
                    break;
                }
            }
        }

        // Apply movement if no collision
        if (canMove) {
            npc.position.x = newX;
            npc.position.z = newZ;
        }
        npc.rotation.y = npc.userData.direction;

        // Keep within bounds (4x scale)
        const bounds = 320;
        if (Math.abs(npc.position.x) > bounds || Math.abs(npc.position.z) > bounds) {
            npc.userData.direction += Math.PI;
        }

        // Randomly pause sometimes
        if (Math.random() < 0.01) {
            npc.userData.isPaused = true;
        }

        // Avoid car (4x scale) and track proximity for conversations
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

            // Track proximity time for conversations (within 10 units)
            if (distToCar < 10) {
                npc.userData.proximityTime++;

                // After 5 seconds (300 frames at 60fps), start conversation
                if (npc.userData.proximityTime >= 300 && !npc.userData.hasSpoken) {
                    startNPCConversation(npc);
                }
            } else {
                // Reset proximity timer if car moves away
                if (npc.userData.proximityTime > 0 && !npc.userData.isTalking) {
                    npc.userData.proximityTime = 0;
                }
            }
        } else {
            // Reset proximity timer if far away
            if (npc.userData.proximityTime > 0 && !npc.userData.isTalking) {
                npc.userData.proximityTime = 0;
            }
        }
    });
}

function startNPCConversation(npc) {
    // Pick a random conversation set
    const conversationSet = npcConversations[Math.floor(Math.random() * npcConversations.length)];
    npc.userData.conversation = conversationSet;
    npc.userData.conversationIndex = 0;
    npc.userData.isTalking = true;
    npc.userData.hasSpoken = true;

    // Show first message
    showNextMessage(npc);
}

function showNextMessage(npc) {
    if (!npc.userData.conversation || npc.userData.conversationIndex >= npc.userData.conversation.length) {
        // Conversation complete
        npc.userData.isTalking = false;
        removeConversationBubbles(npc.uuid);
        return;
    }

    // Remove previous bubble
    removeConversationBubbles(npc.uuid);

    // Show current message
    const message = npc.userData.conversation[npc.userData.conversationIndex];
    showConversationBubble(npc, message);

    // Move to next message after 2 seconds
    npc.userData.conversationIndex++;
    setTimeout(() => {
        if (npc.userData.isTalking) {
            showNextMessage(npc);
        }
    }, 2000);
}

function createSkillBuckets() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create puddles with skill buckets (4x scale) - cyberpunk colors
    // Skill Stations - PROMINENT VISIBILITY - Moved closer for CV showcase
    const skillGroups = [
        {
            title: 'BACKEND DEVELOPMENT',
            skills: ['Java 8', 'Spring Boot', 'Spring MVC', 'Gradle'],
            x: 145,
            z: 70,
            color: 0x00d4ff // Electric cyan
        },
        {
            title: 'DATA LAYER',
            skills: ['MySQL', 'MongoDB', 'PostgreSQL', 'Redis'],
            x: 145,
            z: 0,
            color: 0x00ff88 // Neon green
        },
        {
            title: 'APIs & ARCHITECTURE',
            skills: ['REST APIs', 'GraphQL', 'Microservices', 'Cloud'],
            x: 145,
            z: -70,
            color: 0xff2e97 // Hot pink
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

            // Label on bucket (4x scale)
            const labelBoard = createTextBoard(skill, 6, 4, `#${group.color.toString(16).padStart(6, '0')}`, '#ffffff', false);
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
    stream.position.set(-145, 0.02, 0); // Aligned with career mountains
    stream.receiveShadow = true;
    scene.add(stream);

    // Title sign (4x scale)
    const titleBoard = createTextBoard('CAREER JOURNEY', 40, 10, '#8b5a9e', '#ffffff', true);
    titleBoard.position.set(-145, 12, 90); // Above stream, visible
    scene.add(titleBoard);

    // Support post (4x scale)
    const postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-100, 6, 32);
    post.castShadow = true;
    scene.add(post);

    // Job milestones as rideable mountains/hills (4x scale)
    // Career mountains - PROMINENT VISIBILITY - Moved closer for CV showcase
    const jobs = [
        { company: 'Morgan Stanley', role: 'Software Engineer', years: '2021-Present', x: -145, z: 70 },
        { company: 'TIAA GBS', role: 'Software Engineer', years: '2019-2021', x: -145, z: 0 },
        { company: 'TCS', role: 'Systems Engineer', years: '2017-2019', x: -145, z: -70 }
    ];

    jobs.forEach((job, index) => {
        const xOffset = job.x;

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
        const plaqueBoard = createTextBoard(`${award.title}\n${award.org}\n${award.year}`, 12, 8, '#ffffff', '#a87ab8', false);
        plaqueBoard.position.set(award.x, 2, award.z + 10);
        scene.add(plaqueBoard);
    });
}

function createTechFlowerGarden() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create a small flower garden for extra tech/tools (4x scale)
    // Tech Gardens - North Park area
    const gardenPositions = [
        { x: 60, z: 180 }, // East garden - Frontend
        { x: -60, z: 180 } // West garden - DevOps
    ];

    const flowers = [
        ['Angular', 'React', 'HTML/CSS', 'JavaScript'],
        ['Docker', 'Kubernetes', 'AWS', 'Jenkins']
    ];

    gardenPositions.forEach((pos, gardenIdx) => {
        const gardenFlowers = flowers[gardenIdx];
        gardenFlowers.forEach((flower, fIdx) => {
            const angle = (fIdx / gardenFlowers.length) * Math.PI * 2;
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
            const labelBoard = createTextBoard(flower, 6, 3.2, '#ffffff', '#2d2d2d', false);
            labelBoard.position.set(x, 2.4, z + 3.6);
            scene.add(labelBoard);
        });
    });
}

function createContactLilyPond() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create lily pond (4x scale) - moved off the road
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
    pond.position.set(0, 0.02, -200); // Centered on southern axis - Contact & Welcome Center
    pond.receiveShadow = true;
    scene.add(pond);

    // Title sign (4x scale) - centered with pond
    const titleBoard = createTextBoard('WELCOME & CONTACT', 48, 12, '#5a3d54', '#ffffff', true);
    titleBoard.position.set(0, 12, -140);
    scene.add(titleBoard);

    // Support post (4x scale) - moved with pond
    const postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4579 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(0, 6, -140); // Centered with new pond position
    post.castShadow = true;
    scene.add(post);

    // Main info lily pad (4x scale)
    const mainLilyGeometry = new THREE.CylinderGeometry(12, 12, 1.2, 8);
    const mainLilyMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.7
    });
    const mainLily = new THREE.Mesh(mainLilyGeometry, mainLilyMaterial);
    mainLily.position.set(0, 0.6, -200); // Centered with new pond position
    mainLily.castShadow = true;
    mainLily.receiveShadow = true;
    scene.add(mainLily);

    // Main info on lily pad (4x scale)
    const mainBoard = createTextBoard('Divij Shrivastava\nSoftware Engineer\n8 Years Experience', 20, 12, '#e8f5e9', '#2d2d2d', false);
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
        const z = -200 + Math.sin(info.angle) * radius; // Updated for new pond center

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

        // Contact info on lily pad (4x scale)
        const contactBoard = createTextBoard(info.text, 14, 8, '#e8f5e9', '#2d2d2d', false);
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
    eduLily.position.set(0, 0.6, -232); // Updated for new pond center (-200 - 32)
    eduLily.castShadow = true;
    eduLily.receiveShadow = true;
    scene.add(eduLily);

    const eduBoard = createTextBoard('Education:\nB.E. Computer\nSRIT Jabalpur\n2012-2016', 16, 12, '#e8f5e9', '#2d2d2d', false);
    eduBoard.rotation.x = -Math.PI / 2;
    eduBoard.position.set(0, 1.24, -252);
    scene.add(eduBoard);
}

function createInteractiveObjects() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Barrels scattered around (4x scale)
    // Barrels - SAFE POSITIONS near buildings, away from road (min 50 units from center)
    const barrelPositions = [
        { x: 50, z: 140 }, { x: -50, z: 140 }, // North area
        { x: 140, z: 100 }, { x: 140, z: -100 }, // East area
        { x: -140, z: 100 }, { x: -140, z: -100 } // West area
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
    // Traffic cones - SAFE POSITIONS in pedestrian zones
    const conePositions = [
        { x: 30, z: 150 }, { x: -30, z: 150 }, // North park area
        { x: 140, z: 30 }, // East skills area
        { x: -140, z: 30 }, // West career area
        { x: 0, z: -160 } // South contact area
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
    // Benches - North Park plaza seating area
    const benchPositions = [
        { x: 30, z: 170, rotation: -Math.PI / 4 }, // Facing inward to plaza
        { x: -30, z: 170, rotation: Math.PI / 4 },
        { x: 40, z: 190, rotation: 0 }, // Park bench
        { x: -40, z: 190, rotation: 0 }
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

	// Initialize bump tracking and arrest flags
	car.userData = car.userData || {};
	car.userData.npcBumpCount = 0;
	car.userData.policeDispatched = false;
	car.userData.arrested = false;
	car.userData.exemptFromPolice = true;
}

function createEnvironment() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Trees scattered around the edges (4x scale) - removed from road
    // Trees for North Park and city boundaries
    const treePositions = [
        // North Park tree line (z > 140)
        { x: -100, z: 160 }, { x: -100, z: 180 }, { x: -100, z: 200 },
        { x: 100, z: 160 }, { x: 100, z: 180 }, { x: 100, z: 200 },
        // East border near skills
        { x: 180, z: 80 }, { x: 180, z: -80 },
        // West border near career
        { x: -180, z: 80 }, { x: -180, z: -80 },
        // South border near contact
        { x: -50, z: -220 }, { x: 50, z: -220 }
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
        treeGroup.userData = { type: 'static', radius: 4 }; // Reduced from 12 to 4 for better collision
        scene.add(treeGroup);
        staticObjects.push(treeGroup);
    });

    // Decorative rocks (4x scale)
    // Decorative rocks flanking contact area (south border)
    const rockPositions = [
        { x: 0, z: -220 }, { x: -50, z: -220 }, { x: 50, z: -220 }
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

	// Create police station outside the outer circle
	createPoliceStation(isDark);
}

function createPoliceStation(isDark) {
	const station = new THREE.Group();

	// Building base
	const base = new THREE.Mesh(
		new THREE.BoxGeometry(30, 12, 20),
		new THREE.MeshStandardMaterial({ color: isDark ? 0x1e3a5f : 0x6fa8dc, roughness: 0.8 })
	);
	base.position.set(0, 6, 0);
	base.castShadow = true;
	base.receiveShadow = true;
	station.add(base);

	// Sign
	const sign = new THREE.Mesh(
		new THREE.BoxGeometry(16, 3, 1),
		new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: isDark ? 0x3366ff : 0x2244aa, emissiveIntensity: 0.4 })
	);
	sign.position.set(0, 12, 10.5);
	station.add(sign);

	// Simple text-like bars to indicate "POLICE"
	for (let i = -6; i <= 6; i += 3) {
		const bar = new THREE.Mesh(
			new THREE.BoxGeometry(1, 2, 0.6),
			new THREE.MeshStandardMaterial({ color: 0x222222 })
		);
		bar.position.set(i, 12, 11);
		station.add(bar);
	}

	// Parking pad
	const pad = new THREE.Mesh(
		new THREE.PlaneGeometry(36, 28),
		new THREE.MeshStandardMaterial({ color: isDark ? 0x111111 : 0xbbbbbb, roughness: 1.0 })
	);
	pad.rotation.x = -Math.PI / 2;
	pad.position.set(0, 0.02, -5);
	pad.receiveShadow = true;
	station.add(pad);

	station.position.set(policeStationPosition.x, 0, policeStationPosition.z);
	scene.add(station);
	policeStation = station;

	// Arrest count board
	policeArrestBoard = createTextBoard('ARRESTED: 0', 24, 8, '#ffffff', '#2d2d2d', true);
	policeArrestBoard.position.set(policeStationPosition.x, 10, policeStationPosition.z - 14);
	policeArrestBoard.rotation.y = Math.PI;
	scene.add(policeArrestBoard);
}

function updatePoliceArrestBoard() {
	if (!policeArrestBoard) return;
	let count = 0;
	if (car && car.userData && car.userData.arrested) count++;
	policeVehicles.forEach(p => {
		const t = p.userData && p.userData.target;
		if (t && t !== car && t.userData && t.userData.arrested) count++;
	});
	if (count !== lastArrestCount) {
		lastArrestCount = count;
		// Replace texture on the existing board
		const newBoard = createTextBoard(`ARRESTED: ${count}`, 24, 8, '#ffffff', '#2d2d2d', true);
		if (policeArrestBoard.material && policeArrestBoard.material.map) {
			policeArrestBoard.material.map.dispose();
		}
		policeArrestBoard.material.map = newBoard.material.map;
		policeArrestBoard.material.needsUpdate = true;
	}
}

function addEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;
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

// Zoom functionality removed

function toggleTheme() {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update scene colors if scene is initialized
    if (!scene) return;

    const isDark = newTheme === 'dark';

    // Update scene background
    scene.background = new THREE.Color(isDark ? 0x0a0e27 : 0xf0f4ff);

    // Update fog
    if (scene.fog) {
        scene.fog.color = new THREE.Color(isDark ? 0x0a0e27 : 0xf0f4ff);
    }

    // Update ground color
    scene.children.forEach(child => {
        // Check for the ground plane (PlaneGeometry at y=0 with rotation)
        if (child.geometry && child.geometry.type === 'PlaneGeometry' &&
            child.rotation.x === -Math.PI / 2) {
            child.material.color.setHex(isDark ? 0x0f1933 : 0xc5d5ff);
        }
    });

    // Update ambient and directional lights
    scene.children.forEach(child => {
        if (child.isAmbientLight) {
            child.color.setHex(isDark ? 0x4a5a8a : 0xd1dfff);
            child.intensity = isDark ? 0.4 : 0.6;
        } else if (child.isDirectionalLight) {
            if (child.position.x === 30) { // Main directional light
                child.color.setHex(isDark ? 0x00d4ff : 0xffffff);
                child.intensity = isDark ? 0.8 : 1.0;
            } else if (child.position.x === -20) { // Fill light
                child.color.setHex(isDark ? 0xff2e97 : 0x6b2bff);
                child.intensity = isDark ? 0.4 : 0.3;
            }
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
	// Disable control if arrested
	if (car && car.userData && car.userData.arrested) {
		carSpeed = 0;
		updateEngineSound(carSpeed);
		return;
	}
    // Check for shift boost (2x speed multiplier)
    const isShiftPressed = keysPressed['ShiftLeft'] || keysPressed['ShiftRight'];
    const speedMultiplier = isShiftPressed ? 2.0 : 1.0;
    const effectiveMaxSpeed = maxSpeed * speedMultiplier;
    const effectiveAcceleration = acceleration * speedMultiplier;

    // Forward/Backward
    const isAccelerating = keysPressed['KeyW'] || keysPressed['ArrowUp'];
    const isBraking = keysPressed['KeyS'] || keysPressed['ArrowDown'];

    if (isAccelerating) {
        carSpeed = Math.min(carSpeed + effectiveAcceleration, effectiveMaxSpeed);
        if (!isEngineRunning) playEngineSound();
    } else if (isBraking) {
        carSpeed = Math.max(carSpeed - effectiveAcceleration, -effectiveMaxSpeed * 0.5);
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

    // Slow down near zebra crossings ONLY if the light is red
    for (const crossing of zebraCrossings) {
        // Calculate distance to crossing using x,z coordinates
        const distToCrossing = Math.sqrt(
            Math.pow(car.position.x - crossing.x, 2) +
            Math.pow(car.position.z - crossing.z, 2)
        );
        if (crossing.lightState === 'red' && distToCrossing < 60) {
            // Gradual slowdown approaching red light only
            carSpeed *= 0.92;
            break;
        }
    }

    // Calculate new position (apply speed multiplier for actual movement)
    const effectiveSpeed = carSpeed * speedMultiplier;
    const newX = car.position.x + Math.sin(carRotation) * effectiveSpeed;
    const newZ = car.position.z + Math.cos(carRotation) * effectiveSpeed;
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

    // Check collision with traffic vehicles
    for (const vehicle of trafficVehicles) {
        const vehicleRadius = 2;
        if (checkCollision({ x: newX, z: newZ }, carRadius, vehicle.position, vehicleRadius)) {
            canMove = false;
            collisionIntensity = Math.abs(carSpeed);
            playCollisionSound(collisionIntensity);

            // Calculate push direction
            const pushDir = {
                x: vehicle.position.x - newX,
                z: vehicle.position.z - newZ
            };
            const pushDist = Math.sqrt(pushDir.x * pushDir.x + pushDir.z * pushDir.z);

            if (pushDist > 0.1) {
                pushDir.x /= pushDist;
                pushDir.z /= pushDist;

                // Push the traffic vehicle based on player car speed
                const pushForce = Math.abs(carSpeed) * 2;
                vehicle.position.x += pushDir.x * pushForce;
                vehicle.position.z += pushDir.z * pushForce;
            }

            // Bounce back player car
            carSpeed *= -0.4;
            break;
        }
    }

    // Check collision with NPCs
    for (const npc of npcs) {
        const npcRadius = 0.5;
        if (checkCollision({ x: newX, z: newZ }, carRadius, npc.position, npcRadius)) {
            canMove = false;
            collisionIntensity = Math.abs(carSpeed) * 0.5;
            playCollisionSound(collisionIntensity);

            // Show NPC reaction
            showNPCReaction(npc);

			// Mark NPC as bumped by the player car to trigger delayed direction change
			npc.userData.bumpedByCarTime = performance.now();

			// Increment player's bump counter and possibly dispatch police (skip if exempt)
			car.userData = car.userData || {};
			if (!car.userData.exemptFromPolice) {
				car.userData.npcBumpCount = (car.userData.npcBumpCount || 0) + 1;
            if (car.userData.npcBumpCount >= 3 && !car.userData.policeDispatched) {
                car.userData.policeDispatched = true;
                spawnPoliceCar(car);
				}
			}

            // Push NPC away
            const pushDir = {
                x: npc.position.x - newX,
                z: npc.position.z - newZ
            };
            const pushDist = Math.sqrt(pushDir.x * pushDir.x + pushDir.z * pushDir.z);

            if (pushDist > 0.1) {
                pushDir.x /= pushDist;
                pushDir.z /= pushDist;

                // Push the NPC
                const pushForce = Math.abs(carSpeed) * 1.5;
                npc.position.x += pushDir.x * pushForce;
                npc.position.z += pushDir.z * pushForce;

                // Make NPC turn away
                npc.userData.direction = Math.atan2(pushDir.x, pushDir.z);
            }

            // Slow down car
            carSpeed *= 0.6;
            break;
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

// Mobile controls setup
function setupMobileControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                     || (window.innerWidth <= 768);

    const mobileControls = document.getElementById('mobileControls');
    const instructions = document.getElementById('instructions');

    if (isMobile && mobileControls) {
        mobileControls.style.display = 'block';
        if (instructions) {
            instructions.style.display = 'none';
        }

        // Button references
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        // Touch event handlers for forward button
        if (upBtn) {
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keysPressed['KeyW'] = true;
            });
            upBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                keysPressed['KeyW'] = false;
            });
        }

        // Touch event handlers for backward button
        if (downBtn) {
            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keysPressed['KeyS'] = true;
            });
            downBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                keysPressed['KeyS'] = false;
            });
        }

        // Touch event handlers for left button
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keysPressed['KeyA'] = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                keysPressed['KeyA'] = false;
            });
        }

        // Touch event handlers for right button
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keysPressed['KeyD'] = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                keysPressed['KeyD'] = false;
            });
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    updateCar();

    // Update traffic lights
    updateTrafficLights();

    // Update NPCs
    updateNPCs();

    // Update traffic vehicles
    updateTrafficVehicles();

	// Update police vehicles
	updatePoliceVehicles();

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

    // Update bubble positions to follow NPCs
    updateBubblePositions();

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

    // Quick loading simulation (1 second max)
    const loadingProgress = document.getElementById('loadingProgress');
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 33; // Much faster: 33% every 100ms = ~300ms total
        if (progress >= 100) {
            progress = 100;
            loadingProgress.style.width = '100%';
            clearInterval(loadingInterval);

            // Hide loading screen immediately after init
            setTimeout(() => {
                init();
                setupMobileControls();

                // Aggressively hide loading screen
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                    loadingScreen.style.display = 'none';
                    loadingScreen.style.opacity = '0';
                    loadingScreen.style.visibility = 'hidden';
                    loadingScreen.style.pointerEvents = 'none';
                }
            }, 200); // Reduced from 500ms
        } else {
            loadingProgress.style.width = progress + '%';
        }
    }, 100); // Faster interval: 200ms -> 100ms

    // Failsafe: Force hide loading screen after 2 seconds no matter what
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('Failsafe: Force hiding loading screen');
            loadingScreen.classList.add('hidden');
            loadingScreen.style.display = 'none';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.pointerEvents = 'none';
        }
    }, 2000);
});
