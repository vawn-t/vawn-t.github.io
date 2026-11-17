# Vawn T. - Full-Stack Developer Portfolio

A static HTML/CSS/JavaScript portfolio, following the [Subframe Horizontal Editorial design](https://app.subframe.com/348a99d30c22/canvas/7765d0ca-ba94-484d-b213-d20cf59da34b/edit). Four chapters scroll horizontally on desktop and stack vertically on mobile. No production build step is required.

## 🌐 Live Site

Visit my portfolio at [vawn-t.github.io](https://vawn-t.github.io/)

## Local preview

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/. The separate wedding invitation remains available at http://127.0.0.1:4173/our-wedding/ and owns its styles/scripts independently.

## Browser tests

```bash
npm ci
npx playwright install chromium
npm test
```

To use an already-installed Google Chrome instead:

```bash
PLAYWRIGHT_CHANNEL=chrome npm test
```

Tests cover chapter navigation, wheel/keyboard/focus, URL history, responsive resizing, reduced motion, no-JavaScript anchors, overflow and wedding route/local assets. They block production Firestore traffic and never submit guestbook messages. Test dependencies are development-only; reports are ignored in Git.

See `PRODUCT.md` for content constraints and `DESIGN.md` for the reference design and responsive implementation decisions.

## 🧑‍💻 About Me

I am a passionate Full-Stack Developer with expertise in React, React Native, and Node.js. I focus on creating responsive, user-friendly applications with clean, maintainable code.

## 📫 Contact

Feel free to reach out to me:

- Email: [vantc.99@gmail.com](mailto:vantc.99@gmail.com)
- LinkedIn: [linkedin.com/in/vawn](https://www.linkedin.com/in/vawn/)
- GitHub: [github.com/vawn-t](https://github.com/vawn-t)
