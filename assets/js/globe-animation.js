// https://cobe.vercel.app/docs
import createGlobe from 'https://cdn.skypack.dev/cobe';

const stoppingPhi = 0;
const defaultPhi = 0.005;
let additionalPhi = defaultPhi;
let phi = 4.5;

let pointerInteract = 0;
let pointerInteractionMovement = 0;

let canvas = document.getElementById('cobe');

// TODO: Get current theme active
// const themeActive = document.querySelector('.theme-active');

const globe = createGlobe(canvas, {
  devicePixelRatio: 2,
  width: 1000,
  height: 1000,
  phi: 0,
  theta: 0,

  // TODO: Handle dark mode
  dark: 0,
  diffuse: 1.2,
  scale: 1,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [1, 1, 1],
  markerColor: [1, 0.5, 1],
  glowColor: [1, 1, 1],
  offset: [0, 0],
  markers: [{ location: [15.969294, 108.195093], size: 0.04 }],
  onRender: (state) => {
    // Called on every animation frame.
    // `state` will be an empty object, return updated params.
    state.phi = phi + pointerInteractionMovement / 300;
    phi += additionalPhi;
  }
});

const handlePointerDown = (e) => {
  // stop auto rotate
  additionalPhi = stoppingPhi;

  // get current pointer position
  pointerInteract = e.clientX;

  canvas.style.cursor = 'grabbing';
};

const handlePointerUp = () => {
  additionalPhi = defaultPhi;
  canvas.style.cursor = 'grab';
};

const handlePointerOut = () => {
  additionalPhi = defaultPhi;
  canvas.style.cursor = 'auto';
};

const handlePointerMove = (e) => {
  canvas.style.cursor = 'grab';
  if (e.buttons == 1) {
    pointerInteractionMovement = e.clientX - pointerInteract;
  }
};

canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointerout', handlePointerOut);
canvas.addEventListener('pointermove', handlePointerMove);
