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
let sectionPlatforms = [];
let currentSection = null;

// Car physics
const maxSpeed = 0.3;
const acceleration = 0.01;
const deceleration = 0.005;
const turnSpeed = 0.03;

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

    // Create portfolio section platforms
    createSectionPlatforms();

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

function createSectionPlatforms() {
    const sections = [
        { x: -15, z: -10, data: 'experience', color: 0x8b5a9e, label: 'EXPERIENCE\n8 Years' },
        { x: 15, z: -10, data: 'skills', color: 0x6d4579, label: 'SKILLS\nTechnologies' },
        { x: -15, z: -35, data: 'awards', color: 0xa87ab8, label: 'AWARDS\nRecognition' },
        { x: 15, z: -35, data: 'about', color: 0x5a3d54, label: 'ABOUT\nMe' }
    ];

    sections.forEach(section => {
        // Platform
        const platformGeometry = new THREE.BoxGeometry(12, 0.5, 12);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: section.color,
            roughness: 0.4,
            metalness: 0.5
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(section.x, 0.25, section.z);
        platform.receiveShadow = true;
        platform.castShadow = true;
        platform.userData = { type: section.data, label: section.label };
        scene.add(platform);
        sectionPlatforms.push(platform);

        // Border/frame around platform
        const borderGeometry = new THREE.BoxGeometry(12.5, 0.3, 12.5);
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: section.color,
            roughness: 0.6,
            metalness: 0.8,
            emissive: section.color,
            emissiveIntensity: 0.2
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.set(section.x, 0.05, section.z);
        border.receiveShadow = true;
        scene.add(border);

        // Text label on platform using canvas texture
        createPlatformText(section.label, section.x, section.z);
    });
}

function createPlatformText(text, x, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;

    // Background
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    context.font = 'bold 60px Inter';
    context.fillStyle = '#2d2d2d';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const lines = text.split('\n');
    lines.forEach((line, index) => {
        const y = canvas.height / 2 + (index - lines.length / 2 + 0.5) * 80;
        context.fillText(line, canvas.width / 2, y);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95
    });

    const geometry = new THREE.PlaneGeometry(10, 10);
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, 0.51, z);
    scene.add(plane);
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
    });
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
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
        carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
    } else if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
        carSpeed = Math.max(carSpeed - acceleration, -maxSpeed * 0.5);
    } else {
        // Deceleration
        if (carSpeed > 0) {
            carSpeed = Math.max(0, carSpeed - deceleration);
        } else if (carSpeed < 0) {
            carSpeed = Math.min(0, carSpeed + deceleration);
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

    // Apply movement
    car.position.x += Math.sin(carRotation) * carSpeed;
    car.position.z += Math.cos(carRotation) * carSpeed;
    car.rotation.y = carRotation;

    // Keep car within bounds
    const maxDist = 90;
    car.position.x = Math.max(-maxDist, Math.min(maxDist, car.position.x));
    car.position.z = Math.max(-maxDist, Math.min(maxDist, car.position.z));

    // Camera follow car
    const cameraOffset = new THREE.Vector3(0, 25, 15);
    const rotatedOffset = cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);
    camera.position.x = car.position.x + rotatedOffset.x;
    camera.position.y = car.position.y + rotatedOffset.y;
    camera.position.z = car.position.z + rotatedOffset.z;
    camera.lookAt(car.position);

    // Check for section proximity
    let nearestSection = null;
    let minDist = Infinity;

    sectionPlatforms.forEach(platform => {
        const dist = car.position.distanceTo(platform.position);
        if (dist < 8 && dist < minDist) {
            minDist = dist;
            nearestSection = platform;
        }
    });

    // Update interaction prompt
    const prompt = document.getElementById('interactionPrompt');
    if (nearestSection && nearestSection !== currentSection) {
        currentSection = nearestSection;
        prompt.classList.add('visible');
        prompt.querySelector('p').innerHTML = `<strong>${currentSection.userData.label.split('\n')[0]}</strong><br>Press <strong>E</strong> to view details`;
    } else if (!nearestSection) {
        currentSection = null;
        prompt.classList.remove('visible');
    }

    // Interaction key
    if (keysPressed['KeyE'] && currentSection) {
        showModal(currentSection.userData.type);
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
