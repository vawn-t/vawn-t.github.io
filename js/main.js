(() => {
	'use strict';

	function initChapters() {
		const main = document.querySelector('main.chapters');
		if (!main) return;

		const chapters = Array.from(main.querySelectorAll('.chapter[id]'));
		const links = Array.from(document.querySelectorAll('.chapter-nav .chapter-link'));
		if (!chapters.length) return;

		const desktop = window.matchMedia('(min-width: 768px)');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const header = document.querySelector('.site-header');
		let active = 0;
		let destination = null;
		let scrollFrame = 0;
		let historyFrame = 0;
		let resizeFrame = 0;
		let settleTimer = 0;
		let motionFrame = 0;
		let motionTarget = 0;
		let motionTime = 0;
		let wheelOrigin = 0;
		let wheelTravel = 0;
		let wheelTime = 0;
		let wheelDirection = 0;

		function fragmentId(hash) {
			try {
				return decodeURIComponent(hash.slice(1));
			} catch {
				return '';
			}
		}

		function hashIndex() {
			return chapters.findIndex((chapter) => chapter.id === fragmentId(location.hash));
		}

		function setActive(index) {
			active = index;
			links.forEach((link) => {
				const selected = fragmentId(link.hash) === chapters[index].id;
				link.dataset.active = String(selected);
				if (selected) link.setAttribute('aria-current', 'location');
				else link.removeAttribute('aria-current');
			});
		}

		function writeHash(index, push = false) {
			const hash = `#${chapters[index].id}`;
			if (location.hash === hash) return;
			// History APIs can be unavailable in a sandbox or a local-file preview.
			try {
				history[push ? 'pushState' : 'replaceState'](history.state, '', hash);
			} catch {
				// Navigation and active-link feedback still work without URL updates.
			}
		}

		function headerOffset() {
			if (!header) return 0;
			const position = getComputedStyle(header).position;
			return position === 'sticky' || position === 'fixed' ? header.offsetHeight : 0;
		}

		function chapterLeft(chapter) {
			return main.scrollLeft + chapter.getBoundingClientRect().left
				- main.getBoundingClientRect().left - main.clientLeft;
		}

		function visibleIndex() {
			if (desktop.matches) {
				let nearest = 0;
				let distance = Infinity;
				chapters.forEach((chapter, index) => {
					const difference = Math.abs(chapterLeft(chapter) - main.scrollLeft);
					if (difference < distance) {
						nearest = index;
						distance = difference;
					}
				});
				return nearest;
			}

			const root = document.scrollingElement;
			if (root && window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
				return chapters.length - 1;
			}
			const probe = headerOffset() + Math.max(0, window.innerHeight - headerOffset()) * 0.35;
			let index = 0;
			chapters.forEach((chapter, chapterIndex) => {
				if (chapter.getBoundingClientRect().top <= probe) index = chapterIndex;
			});
			return index;
		}

		function settle() {
			destination = null;
			const index = visibleIndex();
			setActive(index);
			writeHash(index);
		}

		function scheduleSettle() {
			window.clearTimeout(settleTimer);
			// Our animator owns the destination until it finishes. Native scrolling
			// still uses a short debounce to update the URL after the gesture.
			if (!motionFrame) settleTimer = window.setTimeout(settle, 180);
		}

		function resetWheel() {
			wheelTime = 0;
			wheelTravel = 0;
			wheelDirection = 0;
		}

		function stopMotion() {
			window.cancelAnimationFrame(motionFrame);
			window.clearTimeout(settleTimer);
			motionFrame = 0;
			resetWheel();
			destination = null;
			main.classList.remove('is-scrolling');
		}

		function scrollHorizontally(left, { instant = false } = {}) {
			const target = Math.max(0, Math.min(main.scrollWidth - main.clientWidth, left));
			// Momentum events aiming at the same chapter must not restart its easing.
			if (motionFrame && target === motionTarget && !instant && !reducedMotion.matches) return;
			window.cancelAnimationFrame(motionFrame);
			window.clearTimeout(settleTimer);
			motionFrame = 0;
			motionTarget = target;
			main.classList.add('is-scrolling');
			const start = main.scrollLeft;
			const distance = target - start;
			if (instant || reducedMotion.matches || Math.abs(distance) <= 1) {
				main.scrollTo({ left: target, behavior: 'instant' });
				main.classList.remove('is-scrolling');
				scheduleSettle();
				return;
			}

			// One bounded ease-out, straight to the chapter from the first input.
			// No preliminary pixel drift, idle wait, second acceleration, or infinite
			// exponential tail. CSS snap is suspended until we land exactly on target.
			const duration = Math.min(560, 360 + Math.abs(distance) * 0.05);
			motionTime = performance.now();
			function tick(now) {
				const progress = Math.min(1, Math.max(0, (now - motionTime) / duration));
				const eased = 1 - Math.pow(1 - progress, 3);
				main.scrollTo({ left: start + distance * eased, behavior: 'instant' });
				if (progress < 1) {
					motionFrame = window.requestAnimationFrame(tick);
				} else {
					motionFrame = 0;
					main.classList.remove('is-scrolling');
					scheduleSettle();
				}
			}
			motionFrame = window.requestAnimationFrame(tick);
		}

		function onScroll() {
			if (!scrollFrame) {
				scrollFrame = window.requestAnimationFrame(() => {
					scrollFrame = 0;
					if (destination === null) setActive(visibleIndex());
				});
			}
			scheduleSettle();
		}

		function navigate(index, { focus = false, instant = false, push = false, wheel = false } = {}) {
			index = Math.max(0, Math.min(chapters.length - 1, index));
			const chapter = chapters[index];
			if (!wheel) resetWheel();
			destination = index;
			setActive(index);
			if (push) writeHash(index, true);
			if (focus) chapter.focus({ preventScroll: true });

			const behavior = instant || reducedMotion.matches ? 'instant' : 'smooth';
			if (desktop.matches) {
				// Never scroll the whole document to a horizontal chapter: the header stays put.
				scrollHorizontally(chapterLeft(chapter), { instant });
			} else {
				const margin = parseFloat(getComputedStyle(chapter).scrollMarginTop) || 0;
				window.scrollTo({
					top: Math.max(0, chapter.getBoundingClientRect().top + window.scrollY - Math.max(headerOffset(), margin)),
					behavior
				});
			}
			// Bounded debounce, including when the requested chapter is already in view.
			scheduleSettle();
		}

		document.addEventListener('click', (event) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
			const link = event.target.closest('a[href]');
			if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
			const url = new URL(link.href, location.href);
			if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
			const id = fragmentId(url.hash);
			if (id === main.id) {
				event.preventDefault();
				navigate(0, { instant: true });
				main.focus({ preventScroll: true });
				return;
			}
			const index = chapters.findIndex((chapter) => chapter.id === id);
			if (index < 0) return;
			event.preventDefault();
			navigate(index, { focus: true, push: true });
		});

		document.addEventListener('keydown', (event) => {
			if (!desktop.matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
			if (event.target.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="tablist"], [role="listbox"], [role="menu"], audio, video')) return;
			const selection = window.getSelection();
			if (selection && !selection.isCollapsed) return;
			let index;
			switch (event.key) {
				case 'ArrowLeft': index = Math.max(0, active - 1); break;
				case 'ArrowRight': index = Math.min(chapters.length - 1, active + 1); break;
				case 'Home': index = 0; break;
				case 'End': index = chapters.length - 1; break;
				default: return;
			}
			if (index === active) return;
			event.preventDefault();
			navigate(index, { focus: true, push: true });
		});

		// Keep every chapter in the tab order. Native Tab/programmatic focus reveals
		// its chapter immediately, without hiding content or trapping keyboard users.
		main.addEventListener('focusin', (event) => {
			if (!desktop.matches) return;
			const chapter = event.target.closest('.chapter');
			const index = chapters.indexOf(chapter);
			if (index >= 0 && index !== (destination ?? active)) navigate(index, { instant: true });
		});

		function canScrollVertically(target, delta) {
			for (let node = target; node && node !== document.body; node = node.parentElement) {
				if (node.scrollHeight <= node.clientHeight + 1) continue;
				if (!/(auto|scroll)/.test(getComputedStyle(node).overflowY)) continue;
				if (delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 1) return true;
			}
			const root = document.scrollingElement;
			return root && (delta > 0
				? window.scrollY + root.clientHeight < root.scrollHeight - 1
				: window.scrollY > 1);
		}

		main.addEventListener('wheel', (event) => {
			if (!desktop.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
			// Native horizontal trackpad gestures (and browser zoom) are never remapped.
			if (!event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
				stopMotion();
				return;
			}
			if (canScrollVertically(event.target, event.deltaY)) {
				stopMotion();
				return;
			}
			if (!event.cancelable) return;
			const now = performance.now();
			const direction = Math.sign(event.deltaY);
			const newGesture = !wheelTime || direction !== wheelDirection
				|| (!motionFrame && now - wheelTime > 180);
			if (newGesture) {
				wheelOrigin = main.scrollLeft;
				wheelTravel = 0;
			}
			wheelTime = now;
			wheelDirection = direction;
			const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? main.clientWidth : 1;
			wheelTravel += event.deltaY * unit;
			event.preventDefault();
			// Accumulate high-resolution jitter without showing a separate pre-scroll.
			if (Math.abs(wheelTravel) < 24) return;

			const positions = chapters.map(chapterLeft);
			const projected = Math.max(0, Math.min(main.scrollWidth - main.clientWidth, wheelOrigin + wheelTravel));
			let index = positions.reduce((nearest, left, i) =>
				Math.abs(left - projected) < Math.abs(positions[nearest] - projected) ? i : nearest, 0);
			if (wheelTravel > 0 && positions[index] <= wheelOrigin + 2) {
				index = positions.findIndex((left) => left > wheelOrigin + 2);
				if (index < 0) index = chapters.length - 1;
			} else if (wheelTravel < 0 && positions[index] >= wheelOrigin - 2) {
				index = positions.findLastIndex((left) => left < wheelOrigin - 2);
				if (index < 0) index = 0;
			}
			// Decide immediately, not after an idle timer. Further events can extend
			// the destination or reverse it, but never restart the same transition.
			navigate(index, { wheel: true });
		}, { passive: false });

		main.addEventListener('pointerdown', () => {
			if (desktop.matches && motionFrame) {
				stopMotion();
				scheduleSettle();
			}
		});
		main.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });

		function restoreHash() {
			if (historyFrame) return;
			// popstate and hashchange may both fire for the same traversal.
			historyFrame = window.requestAnimationFrame(() => {
				historyFrame = 0;
				const index = hashIndex();
				if (index >= 0 || !location.hash) navigate(index >= 0 ? index : 0, { instant: true });
			});
		}
		window.addEventListener('popstate', restoreHash);
		window.addEventListener('hashchange', restoreHash);

		function realign() {
			if (resizeFrame) return;
			resizeFrame = window.requestAnimationFrame(() => {
				resizeFrame = 0;
				const index = destination ?? active;
				stopMotion();
				if (desktop.matches) navigate(index, { instant: true });
				else {
					// Clear the old horizontal offset when switching to the vertical layout.
					main.scrollTo({ left: 0, behavior: 'instant' });
					navigate(index, { instant: true });
				}
			});
		}
		// Mobile browser chrome also resizes the viewport. Only realign mobile on a
		// breakpoint change, not on every native vertical scroll/address-bar resize.
		window.addEventListener('resize', () => { if (desktop.matches) realign(); });
		desktop.addEventListener('change', realign);
		reducedMotion.addEventListener('change', () => {
			if (reducedMotion.matches && (destination !== null || motionFrame)) {
				navigate(destination ?? visibleIndex(), { instant: true });
			}
		});

		const initial = hashIndex();
		if (initial >= 0) navigate(initial, { instant: true });
		else setActive(visibleIndex());
		// Font loading can change mobile chapter heights after the initial hash jump.
		if (document.fonts) document.fonts.ready.then(() => {
			if (destination !== null) navigate(destination, { instant: true });
		});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChapters, { once: true });
	else initChapters();
})();
