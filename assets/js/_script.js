const wrapper = document.querySelector('.scroll-wrapper');
const selected = document.querySelector('.box-center');
const lightModeBtn = document.getElementById('light-mode');
const darkModeBtn = document.getElementById('dark-mode');

/**
 * Handle horizontal scroll
 */
const handleHorizontalScroll = (event) => {
	event.preventDefault();

	// Scroll the page horizontally by the calculated amount
	wrapper.scrollBy(event.deltaY, 0);
};

/**
 * Handle switch theme
 */
const handleSwitchTheme = (event) => {
	const btn = event.target.closest('a');
	const icon = event.target.closest('img');
	const activeClass = 'theme-active';

	const sectionImage = document.querySelector('.section-img');

	if (!btn.classList.contains(activeClass)) {
		// Remove light-mode class from DOM
		document.querySelector(`.${activeClass}`).classList.remove(activeClass);
		document.body.className = '';

		// Active theme button
		btn.classList.add(activeClass);

		// Active theme background
		document.body.className = '';
		if (btn.getAttribute('id') === 'light-mode') {
			document.body.className = 'light-theme';

			// Update icon
			const darkIcon = document.querySelector('#dark-mode > img');
			icon.src = icon.getAttribute('src').replace('disabled', 'enabled');
			darkIcon.src = darkIcon
				.getAttribute('src')
				.replace('enabled', 'disabled');

			sectionImage.classList.remove('only-dark');
		} else {
			document.body.className = 'dark-theme';

			// Update icon
			const lightIcon = document.querySelector('#light-mode > img');
			icon.src = icon.getAttribute('src').replace('disabled', 'enabled');
			lightIcon.src = lightIcon
				.getAttribute('src')
				.replace('enabled', 'disabled');

			sectionImage.classList.add('only-dark');
		}
	}
};

wrapper.addEventListener('wheel', handleHorizontalScroll);
lightModeBtn.addEventListener('click', handleSwitchTheme);
darkModeBtn.addEventListener('click', handleSwitchTheme);
