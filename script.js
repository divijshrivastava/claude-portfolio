// Import Three.js and controls
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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
let scene, camera, renderer, controls;
let raycaster, mouse;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const objects = [];
let interactiveObjects = [];
let nearestObject = null;

// Initialize
function init() {
    // Scene
    scene = new THREE.Scene();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1a1a1a : 0xfafafa);
    scene.fog = new THREE.Fog(isDark ? 0x1a1a1a : 0xfafafa, 50, 100);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 10);

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
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? 0x242424 : 0xede8f0,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);

    // Create Interactive Objects
    createPortfolioObjects();

    // Controls
    controls = new PointerLockControls(camera, document.body);

    // Raycaster for object interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add event listeners
    addEventListeners();

    // Start animation
    animate();
}

function createPortfolioObjects() {
    const positions = [
        { x: -8, z: -5, data: 'experience', color: 0x8b5a9e, label: 'Experience' },
        { x: 8, z: -5, data: 'skills', color: 0x6d4579, label: 'Skills' },
        { x: -8, z: -15, data: 'awards', color: 0xa87ab8, label: 'Awards' },
        { x: 8, z: -15, data: 'about', color: 0x5a3d54, label: 'About' }
    ];

    positions.forEach(pos => {
        // Main cube
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshStandardMaterial({
            color: pos.color,
            roughness: 0.3,
            metalness: 0.5
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(pos.x, 1.5, pos.z);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.userData = { type: pos.data, label: pos.label };
        scene.add(cube);
        interactiveObjects.push(cube);

        // Add floating animation
        cube.userData.originalY = cube.position.y;
        cube.userData.floatOffset = Math.random() * Math.PI * 2;

        // Add text label (using sprite)
        createTextLabel(pos.label, pos.x, 4, pos.z);
    });
}

function createTextLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 48px Inter';
    context.fillStyle = '#2d2d2d';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 1, 1);
    scene.add(sprite);
}

function addEventListeners() {
    // Start button
    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('welcomeOverlay').classList.add('hidden');
        controls.lock();
    });

    // Pointer lock
    controls.addEventListener('lock', () => {
        document.querySelector('.ui-overlay').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        // User pressed ESC
    });

    // Keyboard controls
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = true;
                break;
            case 'Space':
                if (canJump) velocity.y += 8;
                canJump = false;
                break;
            case 'KeyE':
                if (nearestObject) {
                    showModal(nearestObject.userData.type);
                }
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse click for object interaction
    document.addEventListener('click', (event) => {
        if (!controls.isLocked) return;

        if (nearestObject) {
            showModal(nearestObject.userData.type);
        }
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
    scene.background = new THREE.Color(isDark ? 0x1a1a1a : 0xfafafa);
    scene.fog.color = new THREE.Color(isDark ? 0x1a1a1a : 0xfafafa);

    // Update ground color
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'PlaneGeometry') {
            child.material.color.setHex(isDark ? 0x242424 : 0xede8f0);
        }
    });
}

function showModal(dataKey) {
    const modal = document.getElementById('contentModal');
    const content = document.getElementById('modalContent');
    content.innerHTML = portfolioData[dataKey].content;
    modal.classList.add('active');
    controls.unlock();
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

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked) {
        // Movement
        const delta = 0.016; // Assuming 60fps

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 10.0 * delta; // Gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += velocity.y * delta;

        if (camera.position.y < 1.6) {
            velocity.y = 0;
            camera.position.y = 1.6;
            canJump = true;
        }

        // Check nearest object
        let closestDist = Infinity;
        nearestObject = null;

        interactiveObjects.forEach(obj => {
            const dist = camera.position.distanceTo(obj.position);
            if (dist < 5 && dist < closestDist) {
                closestDist = dist;
                nearestObject = obj;
            }
        });

        // Show interaction prompt
        const prompt = document.getElementById('interactionPrompt');
        if (nearestObject) {
            prompt.classList.add('visible');
        } else {
            prompt.classList.remove('visible');
        }
    }

    // Animate interactive objects
    interactiveObjects.forEach((obj, index) => {
        obj.rotation.y += 0.01;
        obj.position.y = obj.userData.originalY + Math.sin(time * 0.001 + obj.userData.floatOffset) * 0.2;
    });

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
