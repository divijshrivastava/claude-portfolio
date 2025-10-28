# Divij Shrivastava - Interactive 3D Portfolio

An interactive 3D portfolio website inspired by Bruno Simon's legendary portfolio. Drive a car through an immersive 3D playground where every skill, experience, and achievement is a physical object you can discover and interact with.

## ✨ Features

- **🚗 Drive a 3D Car**: Control a purple car through a 3D world with realistic physics
- **🌍 Top-Down View**: Sky camera that follows the car as you drive
- **🎮 Interactive Playground**: Each portfolio item is a unique 3D object in the world
- **💥 Physics-Based Collisions**: Solid objects block your path, movable objects get pushed
- **🔊 Sound Effects**: Engine sounds that change with speed, collision sounds
- **🌓 Dark Mode**: Toggle between light and dark themes (affects both UI and 3D scene)
- **📱 Responsive Design**: Optimized for desktop, with mobile-friendly fallback
- **🎭 Realistic Physics**: Acceleration, deceleration, turning, and object interactions
- **💜 Purple Color Scheme**: Elegant deep purple palette inspired by divij.tech
- **⚡ Loading Screen**: Smooth loading experience with progress bar
- **📖 Welcome Instructions**: Clear driving controls for first-time visitors
- **🎯 Smart Object Detection**: Get notified when approaching interactive objects
- **📝 Modal Content**: Detailed information displays in elegant overlays
- **🏛️ Creative Object Design**: Experience as monuments, skills as themed objects, awards as trophies
- **🌳 Environmental Obstacles**: Trees block your path, creating navigation challenges

## 🎮 Controls

- **W** or **↑** - Accelerate forward (with engine sound!)
- **S** or **↓** - Brake / Reverse
- **A** or **←** - Turn left (while moving)
- **D** or **→** - Turn right (while moving)
- **E** - Interact with objects (when nearby)

## 🛠️ Technologies Used

- **Three.js** - 3D graphics and rendering
- **Physics Engine** - Custom collision detection, object physics, and movement
- **Web Audio API** - Dynamic engine sounds and collision effects
- **HTML5 Canvas** - 3D rendering surface
- **CSS3** - Modern styling with CSS variables for theming
- **Vanilla JavaScript** - Interactive features without dependencies
- **Google Fonts** - Inter font family for clean typography

## 📁 File Structure

```
portfolio/
├── index.html          # HTML structure with 3D canvas and overlays
├── styles.css          # CSS styling for UI overlays and modals
├── script.js           # Three.js setup and 3D scene logic
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── Divij Resume (4).pdf  # Original resume (local only)
```

## 🚀 Local Development

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Click "Start Exploring" to begin the 3D experience
4. Navigate using WASD/Arrows and mouse
5. Approach cubes and press E to view content

**Note**: This portfolio requires a modern browser with WebGL support.

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

1. Create a new GitHub repository
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 3D interactive portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Select "main" branch as source
5. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Option 2: Netlify (Free)

1. Create an account at [netlify.com](https://www.netlify.com)
2. Drag and drop your portfolio folder to Netlify
3. Your site will be live instantly with a custom Netlify URL
4. Optional: Configure a custom domain

### Option 3: Vercel (Free)

1. Create an account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. Run `vercel` in your portfolio directory
4. Follow the prompts to deploy

## 🎨 Customization Guide

### Updating Portfolio Content

**Edit `script.js`** - Update the `portfolioData` object (lines 2-111):
- `experience` - Your work history
- `skills` - Technical skills and technologies
- `awards` - Achievements and recognition
- `about` - Personal information and education

### Styling Customization

**Colors** (in `styles.css`, lines 8-42):
```css
:root {
    --primary-color: #8b5a9e;     /* Primary brand color */
    --primary-dark: #6d4579;       /* Darker shade */
    --primary-light: #a87ab8;      /* Lighter shade */
    --deep-purple: #472a3f;        /* Accent color */
    /* ... other color variables ... */
}
```

**3D Scene Colors** (in `script.js`, `createPortfolioObjects` function):
```javascript
const positions = [
    { x: -8, z: -5, data: 'experience', color: 0x8b5a9e, label: 'Experience' },
    // Change color values to customize cube colors
];
```

### Adding More 3D Objects

In `script.js`, modify the `createPortfolioObjects` function to add more cubes with custom positions, colors, and data.

## 🎯 Interactive Objects

The portfolio transforms traditional sections into a living 3D world with creative object representations:

### 💼 Experience Objects (Monuments & Landmarks)
- **Morgan Stanley** - Large engraved stone monument (2021-Present)
- **TIAA** - Wooden signboard on posts (2019-2021)
- **TCS** - Stone pillar/obelisk (2017-2019)

### 🛠️ Skills Objects (Themed Creations)
- **Java** - Coffee cup ☕ (solid obstacle)
- **Spring** - Coiled spring (movable)
- **Angular** - Red angular geometric shape (solid)
- **MySQL/MongoDB** - Database barrels/spheres (movable)
- **Git** - Branching tree structure (solid)
- **Jenkins** - Pipeline structure (solid)
- **HTML/CSS/JavaScript** - Building blocks and scrolls (movable)

### 🏆 Awards Objects (Trophies & Monuments)
- **Tech Showcase Winner** - Golden trophy on pedestal
- **Pat on the Back** - Hand sculpture
- **On the Spot Award** - Glowing star monument
- **Arctic Code Vault** - Ice crystal structure

### 👨‍💻 About Objects
- **Education** - Graduation cap
- **Contact Info** - Billboard with name and title

Each object:
- Has unique visual design reflecting its meaning
- Triggers an interaction prompt when car approaches
- Opens a modal with detailed content when pressing E
- Either blocks the car (solid) or gets pushed around (movable)

## 🌳 Environmental Objects

The world is populated with various objects to provide visual feedback and navigation challenges:

- **12 Trees** - Solid obstacles! Brown trunks with green foliage that block your path
- **12 Decorative Pillars** - Purple-topped posts positioned around sections
- **28 Boundary Markers** - Purple cubes marking the edges of the playable area
- **9 Path Markers** - White/gray markers creating a central path between sections

All objects:
- Cast and receive shadows for realism
- Adapt colors when switching between light/dark themes
- Trees act as solid obstacles requiring navigation around them
- Provide reference points to see car movement clearly

## 🖥️ Browser Support

- Chrome (latest) ✅
- Firefox (latest) ✅
- Safari (latest) ✅
- Edge (latest) ✅
- Requires WebGL support

## ⚡ Performance Tips

- The scene is optimized for 60fps on modern hardware
- Uses Three.js r160 from CDN for fast loading
- Shadow maps are enabled for realistic lighting
- Fog is used to improve performance and aesthetics

## 🎓 Inspiration

This portfolio is inspired by [Bruno Simon's](https://bruno-simon.com) legendary 3D portfolio, reimagined with a professional software engineering focus.

## 📧 Contact

**Divij Shrivastava**
- Email: divij.shrivastava@gmail.com
- Phone: (+91) 8871962152
- GitHub: [github.com/divijshrivastava](https://github.com/divijshrivastava)
- LinkedIn: [linkedin.com/in/divij-shrivastava](https://linkedin.com/in/divij-shrivastava)
- Website: [divij.tech](https://divij.tech)

---

Built with ❤️ using Three.js, HTML, CSS, and JavaScript

Inspired by Bruno Simon's incredible work
