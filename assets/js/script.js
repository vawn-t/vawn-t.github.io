const wrapper = document.querySelector('.scroll-wrapper');
const selected = document.querySelector('.box-center');

/**
 * Handle horizontal scroll
 */
const handleScroll = (event) => {
  event.preventDefault();

  // Scroll the page horizontally by the calculated amount
  wrapper.scrollBy(event.deltaY, 0);

  const containerRect = wrapper.getBoundingClientRect();

  // Calculate the center of the selected item
  const selectedRect = selected.getBoundingClientRect();
  const center =
    selectedRect.left - containerRect.left + selectedRect.width / 2;
  // updatePositionIndicator(center);

  console.log(center);
};

wrapper.addEventListener('wheel', handleScroll);

// const handleScroll = () => {
//   const selected = document.querySelector('.selected');
//   const wrapper = document.querySelector('.wrapper');
//   const containerRect = wrapper.getBoundingClientRect();

//   // Calculate the center of the selected item
//   const selectedRect = selected.getBoundingClientRect();
//   const center =
//     selectedRect.left - containerRect.left + selectedRect.width / 2;

//   // Do something with the center value, such as update a position indicator
//   updatePositionIndicator(center);
// };

// wrapper.addEventListener('scroll', handleScroll);
