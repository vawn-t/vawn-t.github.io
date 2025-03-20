// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Set initial theme based on system preference
function setInitialTheme() {
	if (prefersDarkScheme.matches) {
		document.body.setAttribute('data-theme', 'dark');
	} else {
		document.body.setAttribute('data-theme', 'light');
	}
}

setInitialTheme();

themeToggle.addEventListener('click', () => {
	const currentTheme = document.body.getAttribute('data-theme');
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
	document.body.setAttribute('data-theme', newTheme);
});

// Responsive scroll handling
const container = document.querySelector('.container');
let isScrolling = false;
let startX;
let scrollLeft;
let isAnimating = false;
let lastWheelTime = 0;

// Only enable horizontal scroll handling for desktop
if (window.innerWidth > 768) {
	// Mouse wheel horizontal scrolling - Safari compatible
	container.addEventListener(
		'wheel',
		(e) => {
			e.preventDefault();

			// Ignore wheel events during animation or if fired too quickly
			const now = Date.now();
			if (isAnimating || now - lastWheelTime < 150) return;

			lastWheelTime = now;

			// More reliable cross-browser method
			const delta =
				Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

			// Calculate target position considering snap points
			const currentPosition = container.scrollLeft;
			const pageWidth = window.innerWidth;

			// Determine direction and target snap point
			let targetPosition;
			if (delta > 0) {
				// Scrolling right/down
				const nextPage = Math.floor(currentPosition / pageWidth) + 1;
				targetPosition = nextPage * pageWidth;
			} else {
				// Scrolling left/up
				const prevPage = Math.ceil(currentPosition / pageWidth) - 1;
				targetPosition = prevPage * pageWidth;
			}

			// Set animation flag and perform scroll
			isAnimating = true;
			container.scrollTo({
				left: targetPosition,
				behavior: 'smooth'
			});

			// Set a safety timeout to ensure animation flag gets reset
			const safetyTimeout = setTimeout(() => {
				isAnimating = false;
			}, 1000);

			// Reset animation flag when scroll completes
			const checkScrollComplete = () => {
				if (Math.abs(container.scrollLeft - targetPosition) < 5) {
					isAnimating = false;
					clearTimeout(safetyTimeout);
				} else {
					requestAnimationFrame(checkScrollComplete);
				}
			};

			// Start checking if scroll has completed
			requestAnimationFrame(checkScrollComplete);
		},
		{ passive: false }
	);

	// Drag to scroll
	// container.addEventListener('mousedown', (e) => {
	// 	isScrolling = true;
	// 	startX = e.pageX - container.offsetLeft;
	// 	scrollLeft = container.scrollLeft;
	// });

	// container.addEventListener('mouseleave', () => {
	// 	isScrolling = false;
	// });

	// container.addEventListener('mouseup', () => {
	// 	isScrolling = false;
	// });

	// container.addEventListener('mousemove', (e) => {
	// 	if (!isScrolling) return;
	// 	e.preventDefault();
	// 	const x = e.pageX - container.offsetLeft;
	// 	const walk = (x - startX) * 2;
	// 	container.scrollLeft = scrollLeft - walk;
	// });

	// Touch events for mobile horizontal scroll
	container.addEventListener(
		'touchstart',
		(e) => {
			startX = e.touches[0].pageX - container.offsetLeft;
			scrollLeft = container.scrollLeft;
		},
		{ passive: true }
	);

	container.addEventListener(
		'touchmove',
		(e) => {
			if (e.touches.length !== 1) return;
			const x = e.touches[0].pageX - container.offsetLeft;
			const walk = (startX - x) * 2;
			container.scrollLeft = scrollLeft + walk;
		},
		{ passive: true }
	);
}

// Fix the sections variable reference issue
// Use a conditional check to prevent errors if sections don't exist
const sections = document.querySelectorAll('.section');

// Handle resize events for responsive behavior only if sections exist
if (sections.length > 0) {
	window.addEventListener('resize', () => {
		const isDesktop = window.innerWidth > 768;

		sections.forEach((section) => {
			section.style.transform = isDesktop
				? 'translateX(50px)'
				: 'translateY(50px)';
		});
	});
}
