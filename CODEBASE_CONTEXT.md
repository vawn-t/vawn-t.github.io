# Codebase Context: vawn-t.github.io

> **Purpose**: This document provides comprehensive context about the codebase to help AI agents understand the project structure, tech stack, architecture, and conventions. This enables more effective code generation, debugging, and feature development.

---

## 📋 Project Overview

### Project Type
**Personal Portfolio Website** - A single-page application (SPA) showcasing professional experience, skills, and projects.

### Live URL
- **Production**: https://vawn-t.github.io/
- **Repository**: https://github.com/vawn-t/vawn-t.github.io
- **Deployment**: GitHub Pages (Static Site Hosting)

### Owner Information
- **Name**: Vawn T. (Van Tran)
- **Role**: Full-Stack Developer
- **Email**: vantc.99@gmail.com
- **LinkedIn**: https://www.linkedin.com/in/vawn/
- **Expertise**: React, React Native, Node.js (4+ years frontend experience, transitioning to full-stack)

---

## 🏗️ Architecture & Tech Stack

### Frontend Stack
- **Core**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **No Framework**: Pure JavaScript implementation for maximum performance
- **No Build Tools**: Direct file serving, no bundler required
- **Module System**: ES6 modules via `type="module"` in script tags

### Third-Party Libraries
- **Cobe.js** (via Skypack CDN): Interactive 3D globe animation
  - CDN: `https://cdn.skypack.dev/cobe`
  - Used for visual enhancement on intro section

### Styling Architecture
- **CSS Organization**: Modular CSS with imports
  - `reset.css` - CSS reset
  - `base.css` - Typography, variables, global styles
  - `style.css` - Component-specific styles
- **Design System**: CSS custom properties (CSS variables)
- **Responsive**: Mobile-first with desktop breakpoint at 769px

### Key Features
1. **Horizontal Scroll Navigation** (Desktop): Section-by-section horizontal scroll with snap points
2. **Vertical Scroll** (Mobile): Traditional vertical scrolling with snap points
3. **Theme Toggle**: Light/Dark mode with system preference detection
4. **Interactive Globe**: 3D rotating globe with user interaction (drag, pointer events)
5. **Smooth Animations**: CSS transitions and JavaScript scroll animations

---

## 📁 File Structure

```
/Users/vawn/DEVs/vawn-t.github.io/
├── .agent/                  # AI Agent configuration (170 items)
├── .github/                 # GitHub configuration
├── .vscode/                 # VS Code settings
├── assets/
│   ├── fonts/              # Custom fonts (Figtree)
│   └── images/             # Images and favicon
├── css/
│   ├── reset.css           # CSS reset
│   ├── base.css            # Global styles, variables, typography
│   └── style.css           # Component styles, layout, responsive
├── docs/
│   └── vawn.pdf            # Resume/CV document
├── js/
│   ├── main.js             # Main application logic (theme, scroll)
│   └── globe-animation.js  # Cobe.js globe configuration
├── index.html              # Main HTML file (341 lines)
└── README.md               # Project documentation
```

---

## 🎨 Design System

### Color Palette

#### Light Theme (Default)
```css
--primary-color: #ffc300     /* Gold/Yellow accent */
--text-color: #213547        /* Dark blue-gray */
--bg-color: #ffffff          /* White background */
--card-bg: #f4f4f4          /* Light gray cards */
```

#### Dark Theme
```css
--primary-color: #ffc300     /* Gold/Yellow accent (same) */
--text-color: #ffffff        /* White text */
--bg-color: #1a1a1a         /* Dark background */
--card-bg: #2a2a2a          /* Dark gray cards */
```

### Typography
- **Font Family**: Figtree (Variable Font)
  - Regular: `Figtree-VariableFont_wght.ttf`
  - Italic: `Figtree-Italic-VariableFont_wght.ttf`
- **Font Sizes**:
  - `--fs-1`: 1.1rem (body text)
  - `--fs-2`: 0.75rem (small text)
  - `h1`: 4rem (responsive: 3rem mobile)
  - `h2`: 2.5rem
  - `h3`: 1.5rem
  - `h4`: 1.25rem

### Spacing & Layout
- **Border Radius**:
  - `--radius-primary`: 16px (cards)
  - `--radius-secondary`: 24px (buttons)
- **Transitions**: `all 0.3s ease` (global)

---

## 🧩 Component Architecture

### Sections (Horizontal/Vertical Scroll)
The site uses a unique scroll architecture:

#### Desktop (>768px)
- **Container**: `.container` with horizontal scroll
- **Sections**: Full viewport width (`100vw`) and height (`100vh`)
- **Scroll Type**: Horizontal with snap points (`scroll-snap-type: x mandatory`)
- **Navigation**: Mouse wheel converts vertical scroll to horizontal

#### Mobile (≤768px)
- **Container**: `.container` with vertical scroll
- **Sections**: Minimum full viewport height (`min-height: 100vh`)
- **Scroll Type**: Vertical with snap points (`scroll-snap-type: y mandatory`)

### Section Components

#### 1. Intro Section (`.intro`)
- **Content**: Name, title, animated globe
- **Globe**: Canvas element (`#cobe`) with interactive 3D globe
- **Animation**: Auto-rotate with user interaction (drag to rotate)
- **Location Marker**: Coordinates `[15.969294, 108.195093]` (Vietnam)

#### 2. About Section (`.about`)
- **Content**: Professional bio (3+ years experience)
- **Focus**: Frontend expertise, full-stack transition, AI/ML/DL/NLP learning path

#### 3. Projects Section (`.projects`)
- **Layout**: CSS Grid (`repeat(auto-fit, minmax(300px, 1fr))`)
- **Projects**:
  1. EarlyBird - Parent investment app
  2. Meez - Chef recipe management tool
  3. Agility Kash - White-label banking (Web & Mobile)
  4. Moniflow - Mobile banking extension
  5. Donggames - Gaming news/tournament/shop platform (in development)
- **Interaction**: Hover effect (`translateY(-5px)`)

#### 4. Skills Section (`.skills`)
- **Layout**: CSS Grid (3 columns, responsive)
- **Skill Cards**:
  - Language Proficiency (English - 75%)
  - Front-End Technologies (HTML/CSS 90%, React 80%, React Native 85%, Next.js 70%, Node.js 40%, SQL 40%)
  - Development Goals (Timeline: Current state → 2026 full-stack)
- **Visual**: Progress bars with dynamic width

#### 5. Contact Section (`.contact`)
- **Primary CTA**: Email button with animated icon
- **Social Links**: Instagram, X (Twitter), LinkedIn, WhatsApp
- **Interaction**: Hover color changes, icon slide-in animation

---

## 🔧 JavaScript Functionality

### Theme Toggle (`main.js`)
```javascript
// Features:
- System preference detection (prefers-color-scheme)
- Manual toggle button (sun/moon icons)
- State attribute: data-theme="light|dark"
- Persistent during session
```

### Scroll Management (`main.js`)
```javascript
// Desktop (>768px):
- Wheel event listener (passive: false)
- Converts vertical wheel to horizontal scroll
- Snap-to-section with smooth behavior
- Debounce: 150ms between scroll events
- Animation lock during scroll (prevents multiple triggers)

// Mobile:
- Native vertical scroll with snap points
- Touch events for smooth scrolling
```

### Globe Animation (`globe-animation.js`)
```javascript
// Cobe.js Configuration:
- Device pixel ratio: 2 (retina support)
- Size: 1000x1000px (displayed at 500x500)
- Auto-rotation: phi += 0.005 per frame
- User interaction: Drag to rotate (stops auto-rotation)
- Theme-aware: Adapts to light/dark mode (state.dark)
- Marker: Single location marker (Vietnam)
```

---

## 🎯 SEO & Metadata

### Meta Tags (index.html)
```html
<title>vawn</title>
<meta name="description" content="A personal website for Vawn, a Full-Stack Developer." />
<meta name="keywords" content="vawn, van tran, full-stack developer, react, react native, node.js" />
<meta name="author" content="vawn" />
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow" />
```

### Accessibility
- Semantic HTML5 elements (`<section>`, `<article>`, `<nav>`)
- ARIA-friendly structure
- Keyboard accessible (theme toggle, links)
- High contrast ratios (WCAG compliant)

---

## 🚀 Development Workflow

### Local Development
1. **No build step required** - Static files served directly
2. **Live Server**: Use any static file server (VS Code Live Server, Python SimpleHTTPServer, etc.)
3. **Hot Reload**: Browser refresh on file change

### Deployment
- **Platform**: GitHub Pages
- **Branch**: `main` (or `gh-pages`)
- **Process**: Push to main → Auto-deploy
- **URL**: `https://vawn-t.github.io/`

### File Editing Guidelines
1. **HTML**: Single file (`index.html`) - all content inline
2. **CSS**: Edit specific module (`base.css` for variables, `style.css` for components)
3. **JS**: Separate concerns (`main.js` for app logic, `globe-animation.js` for 3D globe)

---

## 🔒 Browser Compatibility

### Target Browsers
- **Modern browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet

### Key Compatibility Considerations
1. **CSS Scroll Snap**: Supported in all modern browsers
2. **CSS Custom Properties**: IE11 not supported (acceptable for portfolio)
3. **ES6 Modules**: Requires `type="module"` (modern browsers only)
4. **WebGL (Cobe.js)**: Requires WebGL support for globe animation

---

## 📝 Code Conventions

### CSS
- **Naming**: BEM-inspired but simplified (`.project-card`, `.skill-name`)
- **Organization**: Top-to-bottom (variables → layout → components → media queries)
- **Comments**: Section headers with ASCII art dividers
- **Variables**: Prefix with purpose (`--ff-` font-family, `--fs-` font-size, `--fw-` font-weight)

### JavaScript
- **Style**: ES6+ (arrow functions, const/let, template literals)
- **Comments**: Inline explanations for complex logic
- **Functions**: Small, single-purpose functions
- **Event Listeners**: Options object for `passive`, `once` flags

### HTML
- **Indentation**: 2 spaces
- **Attributes**: Logical order (class, id, data-*, aria-*, event handlers)
- **SVG**: Inline for better control and theming

---

## 🐛 Known Issues & Future Enhancements

### Current Limitations
1. No CMS - Content updates require HTML editing
2. No form validation - Contact is email link only
3. Static content - No dynamic data fetching

### Potential Improvements
1. Add project detail pages (modal or separate pages)
2. Implement contact form with backend integration
3. Add blog section for articles/posts
4. Performance: Lazy-load images, optimize assets
5. Analytics: Add Google Analytics or privacy-focused alternative
6. Add more interactive animations (Framer Motion, GSAP)

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Theme toggle works (light/dark)
- [ ] Horizontal scroll on desktop (wheel events)
- [ ] Vertical scroll on mobile (touch events)
- [ ] Globe animation loads and rotates
- [ ] Globe is interactive (drag to rotate)
- [ ] All social links open correctly
- [ ] Email link opens email client
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Cross-browser compatibility

### Performance
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Globe animation runs at 60fps

---

## 📚 Dependencies & External Resources

### CDN Dependencies
```javascript
// Cobe.js (3D Globe Library)
import createGlobe from 'https://cdn.skypack.dev/cobe';
```

### Font Assets
- **Figtree Variable Font** - Locally hosted in `/assets/fonts/`
- **License**: SIL Open Font License (if applicable, verify)

### No Package Manager
- No `package.json`
- No `node_modules`
- No build process

---

## 🎓 Learning Context

### Current Skill Level
- **Frontend**: Advanced (React, React Native, HTML/CSS/JS)
- **Backend**: Beginner (Node.js, SQL)
- **Areas of Growth**: Full-stack development, AI/ML/DL/NLP

### Professional Experience
- 3+ years frontend development
- 4 production projects shipped
- Focus: Banking apps, SaaS tools, mobile applications

---

## 🤖 AI Agent Instructions

### When Modifying This Codebase
1. **Maintain vanilla JS approach** - No framework dependencies
2. **Preserve design system** - Use existing CSS variables
3. **Respect scroll architecture** - Horizontal (desktop) / Vertical (mobile)
4. **Keep performance high** - Lightweight, no heavy libraries
5. **Follow existing conventions** - CSS naming, JS style, HTML structure

### Common Tasks
- **Adding a new section**: Clone existing section structure, add to grid
- **Updating content**: Edit `index.html` directly
- **Styling changes**: Prefer CSS variables over hardcoded values
- **New animations**: Use CSS transitions or requestAnimationFrame
- **Color changes**: Update CSS variables in `base.css`

### Don't Do
- ❌ Add React, Vue, or other frameworks
- ❌ Introduce build tools (Webpack, Vite) without discussion
- ❌ Break the scroll snap architecture
- ❌ Use global scope variables carelessly
- ❌ Add large dependencies (bloat the bundle)

### Do
- ✅ Keep it lightweight and performant
- ✅ Use semantic HTML
- ✅ Maintain accessibility standards
- ✅ Write self-documenting code
- ✅ Test across devices and browsers

---

## 📞 Contact & Support

For questions about this codebase or project:
- **Email**: vantc.99@gmail.com
- **LinkedIn**: https://www.linkedin.com/in/vawn/
- **GitHub Issues**: https://github.com/vawn-t/vawn-t.github.io/issues

---

**Last Updated**: January 2026  
**Document Version**: 1.0  
**Maintainer**: Vawn T.
