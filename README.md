# Divij Shrivastava - Portfolio Website

A modern, responsive portfolio website showcasing professional experience, skills, awards, and projects.

## Features

- **Dark Mode**: Toggle between light and dark themes with persistent preference saved to local storage
- **Responsive Design**: Fully responsive layout that works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean and professional design with smooth animations and transitions
- **Interactive Navigation**: Fixed navigation bar with smooth scrolling and active section highlighting
- **Timeline**: Visual timeline for work experience with detailed project descriptions
- **Skills Showcase**: Categorized display of technical skills and technologies
- **Awards Section**: Highlighted achievements and recognition
- **Contact Section**: Multiple ways to get in touch with social media integration
- **Performance Optimized**: Fast loading with efficient CSS and JavaScript
- **Purple Color Scheme**: Elegant deep purple color palette inspired by divij.tech

## Technologies Used

- **HTML5**: Semantic markup for better SEO and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: Interactive features without dependencies
- **Google Fonts**: Inter font family for clean typography

## File Structure

```
portfolio/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # This file
└── Divij Resume (4).pdf  # Resume PDF
```

## Local Development

1. Clone or download this repository
2. Open `index.html` in your web browser
3. No build process or dependencies required!

## Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

1. Create a new GitHub repository
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Portfolio website"
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

### Option 4: Traditional Web Hosting

1. Purchase hosting from providers like:
   - Hostinger
   - Bluehost
   - SiteGround
   - DigitalOcean
2. Upload files via FTP/SFTP or cPanel file manager
3. Access your site via your domain

## Customization Guide

### Updating Personal Information

**Contact Details** (in `index.html`):
- Update email, phone number, and social links in the hero section
- Modify contact section links

**Experience**:
- Edit the timeline items in the Experience section
- Update company names, dates, roles, and project descriptions

**Skills**:
- Modify skill categories and items in the Skills section

**Awards**:
- Update award cards with your achievements

**Education**:
- Change education details in the Education section

### Styling Customization

**Colors** (in `styles.css`):
```css
:root {
    --primary-color: #3b82f6;     /* Primary brand color */
    --secondary-color: #10b981;   /* Secondary accent color */
    /* ... other color variables ... */
}
```

**Fonts**:
- Change the Google Fonts import in `index.html` (line 9)
- Update the font-family in `styles.css`

**Hero Background**:
- Modify the gradient in `.hero` class (line 104 in `styles.css`)

### Adding New Sections

1. Add HTML in `index.html`
2. Add corresponding styles in `styles.css`
3. Update navigation menu with new section link
4. Add scroll behavior in `script.js` if needed

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

- Images: Optimize any images you add using tools like TinyPNG
- Fonts: The Inter font is loaded from Google Fonts CDN
- Lazy Loading: Consider adding lazy loading for images if you add many
- Minification: For production, consider minifying CSS and JS files

## SEO Optimization

Current optimizations:
- Semantic HTML5 elements
- Meta description tag
- Proper heading hierarchy
- Alt text for important elements

Additional improvements:
- Add Open Graph tags for social media sharing
- Include Twitter Card meta tags
- Create a sitemap.xml
- Add robots.txt file

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Sufficient color contrast
- Focus states on interactive elements

## Future Enhancements

Potential features to add:
- [x] Dark mode toggle (Completed!)
- [ ] Blog section
- [ ] Project portfolio gallery
- [ ] Testimonials section
- [ ] Download resume button
- [ ] Contact form with backend integration
- [ ] Analytics integration (Google Analytics, Plausible)
- [ ] PWA functionality
- [ ] Multi-language support

## License

This portfolio website is free to use and modify for your personal use.

## Contact

**Divij Shrivastava**
- Email: divij.shrivastava@gmail.com
- Phone: (+91) 8871962152
- GitHub: [github.com/divijshrivastava](https://github.com/divijshrivastava)
- LinkedIn: [linkedin.com/in/divij-shrivastava](https://linkedin.com/in/divij-shrivastava)
- Website: [divij.tech](https://divij.tech)

---

Built with ❤️ using HTML, CSS, and JavaScript
