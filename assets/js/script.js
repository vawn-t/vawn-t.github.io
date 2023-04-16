const wrapper = document.querySelector('.wrapper');

/**
 * Handle horizontal scroll
 */
const handleScroll = (event) => {
  event.preventDefault();

  // Scroll the page horizontally by the calculated amount
  wrapper.scrollBy(event.deltaY, 0);
};

wrapper.addEventListener('wheel', handleScroll);
