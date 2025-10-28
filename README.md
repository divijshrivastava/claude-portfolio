# Divij Shrivastava - Interactive 3D Portfolio

An interactive 3D portfolio website inspired by Bruno Simon's legendary portfolio. Drive a car through a 3D world and visit different sections to explore professional experience, skills, awards, and achievements.

## ✨ Features

- **🚗 Drive a 3D Car**: Control a purple car through a 3D world with realistic physics
- **🌍 Top-Down View**: Sky camera that follows the car as you drive
- **🎨 Ground Platforms**: Four colored platforms on the ground, each representing a portfolio section
- **🌓 Dark Mode**: Toggle between light and dark themes (affects both UI and 3D scene)
- **📱 Responsive Design**: Optimized for desktop, with mobile-friendly fallback
- **🎭 Smooth Physics**: Acceleration, deceleration, and turning mechanics
- **💜 Purple Color Scheme**: Elegant deep purple palette inspired by divij.tech
- **⚡ Loading Screen**: Smooth loading experience with progress bar
- **📖 Welcome Instructions**: Clear driving controls for first-time visitors
- **🎯 Interactive Prompts**: Get notified when driving over a section
- **📝 Modal Content**: Detailed information displays in elegant overlays
- **📐 Text Labels**: Section names printed directly on the ground platforms
- **🌳 Environmental Objects**: Trees, pillars, boundary markers, and decorative elements for visual feedback
- **🛣️ Path Markers**: Central path guides you between sections

## 🎮 Controls

- **W** or **↑** - Accelerate forward
- **S** or **↓** - Brake / Reverse
- **A** or **←** - Turn left (while moving)
- **D** or **→** - Turn right (while moving)
- **E** - Interact with section (when near a platform)

## 🛠️ Technologies Used

- **Three.js** - 3D graphics and rendering
- **Car Physics** - Custom acceleration, deceleration, and turning mechanics
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

## 🎯 Interactive Elements

The portfolio features four ground platforms:

1. **Experience Platform** (Purple, Left Front) - Professional work history spanning 8 years
2. **Skills Platform** (Dark Purple, Right Front) - Technical expertise and technologies
3. **Awards Platform** (Light Purple, Left Back) - Achievements and recognition
4. **About Platform** (Deep Purple, Right Back) - Personal info and education

Each platform:
- Is positioned on the ground with text labels
- Has a colored border with subtle glow effect
- Shows section name printed on the surface
- Triggers an interaction prompt when car approaches
- Opens a modal with detailed content when pressing E

## 🌳 Environmental Objects

The world is populated with various objects to provide visual feedback and depth:

- **12 Trees** - Brown trunks with green foliage, scattered throughout the world
- **12 Decorative Pillars** - Purple-topped posts positioned around sections
- **28 Boundary Markers** - Purple cubes marking the edges of the playable area
- **9 Decorative Cubes** - Small purple cubes scattered for visual interest
- **9 Path Markers** - White/gray markers creating a central path between sections

All objects:
- Cast and receive shadows for realism
- Adapt colors when switching between light/dark themes
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
