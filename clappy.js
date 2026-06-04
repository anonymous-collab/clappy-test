/* ============================================
   CLAPPY - Character Logic
   SVG body, drag, tap, animations
   ============================================ */

// === BUILD CLAPPY'S SVG BODY ===
const clappySVG = `
<svg id="clappy-svg" viewBox="0 0 90 130" xmlns="http://www.w3.org/2000/svg">

  <!-- === ARMS (behind body) === -->
  <g id="clappy-arm-left">
    <rect x="2" y="58" width="14" height="7" rx="3.5"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
  </g>
  <g id="clappy-arm-right">
    <rect x="74" y="58" width="14" height="7" rx="3.5"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

  <!-- === BODY (main clapperboard) === -->
  <rect x="14" y="44" width="62" height="62" rx="8"
    fill="#1a1a1a" stroke="#e8c84a" stroke-width="2"/>

  <!-- Body stripes detail -->
  <rect x="14" y="56" width="62" height="5" fill="#e8c84a" opacity="0.15"/>
  <rect x="14" y="68" width="62" height="5" fill="#e8c84a" opacity="0.10"/>

  <!-- Body shine -->
  <rect x="18" y="48" width="20" height="3" rx="1.5"
    fill="white" opacity="0.08"/>

  <!-- === CLAPPER HEAD BOTTOM (fixed) === -->
  <rect x="14" y="30" width="62" height="18" rx="6"
    fill="#2a2a2a" stroke="#e8c84a" stroke-width="2"/>

  <!-- Bottom head stripes -->
  <rect x="20" y="34" width="10" height="10" rx="2" fill="#e8c84a"/>
  <rect x="34" y="34" width="10" height="10" rx="2" fill="#1a1a1a"/>
  <rect x="48" y="34" width="10" height="10" rx="2" fill="#e8c84a"/>
  <rect x="62" y="34" width="10" height="10" rx="2" fill="#1a1a1a"/>

  <!-- === CLAPPER HEAD TOP (animates open) === -->
  <g id="clappy-head-top">
    <rect x="14" y="16" width="62" height="16" rx="6"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="2"/>

    <!-- Top head stripes (opposite pattern) -->
    <rect x="20" y="20" width="10" height="8" rx="2" fill="#1a1a1a"/>
    <rect x="34" y="20" width="10" height="8" rx="2" fill="#e8c84a"/>
    <rect x="48" y="20" width="10" height="8" rx="2" fill="#1a1a1a"/>
    <rect x="62" y="20" width="10" height="8" rx="2" fill="#e8c84a"/>

    <!-- Hinge dot -->
    <circle cx="17" cy="24" r="3" fill="#e8c84a"/>
  </g>

  <!-- === EYES (on body) === -->
  <g id="clappy-eye-left" style="transform-origin: 33px 68px">
    <circle cx="33" cy="68" r="9" fill="white"/>
    <circle id="clappy-pupil-left" cx="33" cy="68" r="4.5"
      fill="#1a1a1a"/>
    <circle cx="35" cy="66" r="1.5" fill="white"/>
  </g>

  <g id="clappy-eye-right" style="transform-origin: 57px 68px">
    <circle cx="57" cy="68" r="9" fill="white"/>
    <circle id="clappy-pupil-right" cx="57" cy="68" r="4.5"
      fill="#1a1a1a"/>
    <circle cx="59" cy="66" r="1.5" fill="white"/>
  </g>

  <!-- === MOUTH === -->
  <path d="M 36 84 Q 45 91 54 84" stroke="#e8c84a"
    stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- === LEGS === -->
  <g id="clappy-leg-left">
    <rect x="26" y="104" width="10" height="22" rx="5"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
    <!-- Foot -->
    <rect x="20" y="122" width="18" height="8" rx="4"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

  <g id="clappy-leg-right">
    <rect x="54" y="104" width="10" height="22" rx="5"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
    <!-- Foot -->
    <rect x="52" y="122" width="18" height="8" rx="4"
      fill="#1a1a1a" stroke="#e8c84a" stroke-width="1.5"/>
  </g>

</svg>
`;

// === INJECT SVG INTO PAGE ===
document.getElementById('clappy-char').innerHTML = clappySVG;

// === ELEMENT REFERENCES ===
const clappyRoot   = document.getElementById('clappy-root');
const clappyChar   = document.getElementById('clappy-char');
const clappyBubble = document.getElementById('clappy-bubble');
const headTop      = document.getElementById('clappy-head-top');
const pupilLeft    = document.getElementById('clappy-pupil-left');
const pupilRight   = document.getElementById('clappy-pupil-right');

// === STATE ===
let isDragging    = false;
let dragStartX    = 0;
let dragStartY    = 0;
let rootStartX    = 0;
let rootStartY    = 0;
let hasMoved      = false;
let bubbleTimeout = null;
let isOpen        = false;

// === SPEECH BUBBLE MESSAGES ===
const idleMessages = [
  "Hey! Tap me 🎬",
  "What should we watch? 🍿",
  "I know every movie!",
  "Feeling lucky? 🎲",
  "Let's find something great!",
];

let messageIndex = 0;

function showBubble(text, duration = 3000) {
  if (bubbleTimeout) clearTimeout(bubbleTimeout);
  clappyBubble.textContent = text || idleMessages[messageIndex % idleMessages.length];
  messageIndex++;
  clappyBubble.classList.add('show');
  bubbleTimeout = setTimeout(() => {
    clappyBubble.classList.remove('show');
  }, duration);
}

// Show first bubble after a short delay
setTimeout(() => showBubble(idleMessages[0], 4000), 1200);

// Cycle bubble messages every 8 seconds
setInterval(() => {
  if (!isOpen) {
    showBubble(idleMessages[messageIndex % idleMessages.length], 3500);
  }
}, 8000);

// === PUPILS FOLLOW CURSOR/TOUCH ===
document.addEventListener('mousemove', (e) => {
  movePupils(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
  movePupils(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

function movePupils(cx, cy) {
  moveSinglePupil(pupilLeft,  'clappy-eye-left',  33, 68, cx, cy);
  moveSinglePupil(pupilRight, 'clappy-eye-right', 57, 68, cx, cy);
}

function moveSinglePupil(pupilEl, eyeId, baseX, baseY, cx, cy) {
  if (!pupilEl) return;
  const eyeEl = document.getElementById(eyeId);
  if (!eyeEl) return;
  const rect   = eyeEl.getBoundingClientRect();
  const eyeCX  = rect.left + rect.width  / 2;
  const eyeCY  = rect.top  + rect.height / 2;
  const angle  = Math.atan2(cy - eyeCY, cx - eyeCX);
  const dist   = 2.5;
  const dx     = Math.cos(angle) * dist;
  const dy     = Math.sin(angle) * dist;
  pupilEl.setAttribute('cx', baseX + dx);
  pupilEl.setAttribute('cy', baseY + dy);
}

// === TAP / CLICK ===
clappyChar.addEventListener('click', (e) => {
  if (hasMoved) return; // don't trigger tap after drag

  // Bounce animation
  clappyChar.classList.remove('clappy-tap-bounce');
  void clappyChar.offsetWidth; // reflow trick to restart animation
  clappyChar.classList.add('clappy-tap-bounce');
  setTimeout(() => clappyChar.classList.remove('clappy-tap-bounce'), 450);

  // Toggle clapper head
  isOpen = !isOpen;
  headTop.classList.toggle('open', isOpen);

  // Toggle chat window (chat.js handles this)
  if (typeof toggleChat === 'function') {
    toggleChat(isOpen);
  }

  if (isOpen) {
    showBubble("What are we watching? 🎬", 3000);
  } else {
    showBubble("Come back soon! 👋", 2500);
  }
});

// === DRAG — MOUSE ===
clappyChar.addEventListener('mousedown', (e) => {
  startDrag(e.clientX, e.clientY);
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) doDrag(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => endDrag());

// === DRAG — TOUCH ===
clappyChar.addEventListener('touchstart', (e) => {
  startDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (isDragging) doDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

document.addEventListener('touchend', () => endDrag());

function startDrag(x, y) {
  isDragging = true;
  hasMoved   = false;
  dragStartX = x;
  dragStartY = y;
  const rect = clappyRoot.getBoundingClientRect();
  rootStartX = rect.left;
  rootStartY = rect.top;
  clappyChar.classList.add('dragging');
}

function doDrag(x, y) {
  const dx = x - dragStartX;
  const dy = y - dragStartY;

  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;

  let newX = rootStartX + dx;
  let newY = rootStartY + dy;

  // Keep within screen bounds
  const w = clappyRoot.offsetWidth;
  const h = clappyRoot.offsetHeight;
  newX = Math.max(0, Math.min(window.innerWidth  - w, newX));
  newY = Math.max(0, Math.min(window.innerHeight - h, newY));

  clappyRoot.style.left   = newX + 'px';
  clappyRoot.style.top    = newY + 'px';
  clappyRoot.style.right  = 'auto';
  clappyRoot.style.bottom = 'auto';
}

function endDrag() {
  isDragging = false;
  clappyChar.classList.remove('dragging');
}