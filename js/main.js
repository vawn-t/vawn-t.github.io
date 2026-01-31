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
const navDots = document.querySelectorAll('.nav-dot');

// Navigation dots functionality
function updateActiveDot(index) {
	navDots.forEach((dot, i) => {
		dot.classList.toggle('active', i === index);
	});
}

// Click handler for navigation dots
navDots.forEach((dot) => {
	dot.addEventListener('click', () => {
		const sectionIndex = parseInt(dot.dataset.section);
		const targetSection = sections[sectionIndex];
		
		if (targetSection && container) {
			const isDesktop = window.innerWidth > 768;
			
			if (isDesktop) {
				container.scrollTo({
					left: sectionIndex * window.innerWidth,
					behavior: 'smooth'
				});
			} else {
				targetSection.scrollIntoView({ behavior: 'smooth' });
			}
		}
	});
});

// Track scroll position and update active dot
function handleScrollUpdate() {
	if (!container) return;
	
	const isDesktop = window.innerWidth > 768;
	let currentIndex = 0;
	
	if (isDesktop) {
		currentIndex = Math.round(container.scrollLeft / window.innerWidth);
	} else {
		sections.forEach((section, index) => {
			const rect = section.getBoundingClientRect();
			if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
				currentIndex = index;
			}
		});
	}
	
	updateActiveDot(currentIndex);
}

// Add scroll listener for nav dot updates
if (container) {
	container.addEventListener('scroll', handleScrollUpdate, { passive: true });
}

// Section content reveal animation
const sectionContents = document.querySelectorAll('.section-content');

if (sectionContents.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
	const revealObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
				}
			});
		},
		{ threshold: 0.2 }
	);

	sectionContents.forEach((content) => {
		revealObserver.observe(content);
	});
} else {
	// If reduced motion or no elements, make all visible
	sectionContents.forEach((content) => {
		content.classList.add('visible');
	});
}

// Initial call to set active dot
handleScrollUpdate();


