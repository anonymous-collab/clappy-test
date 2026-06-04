/* ============================================
   CLAPPY - Chat Window Logic
   Open/close, messages, typing, suggestions
   ============================================ */

// === BUILD CHAT WINDOW HTML ===
const chatHTML = `
<div id="clappy-chat">

  <!-- Header -->
  <div id="chat-header">
    <div id="chat-header-avatar">🎬</div>
    <div id="chat-header-info">
      <div id="chat-header-name">Clappy</div>
      <div id="chat-header-status">Online</div>
    </div>
    <button id="chat-close-btn">✕</button>
  </div>

  <!-- Messages -->
  <div id="chat-messages">
    <!-- Messages appear here -->
  </div>

  <!-- Typing indicator -->
  <div id="chat-typing">
    <span></span><span></span><span></span>
  </div>

  <!-- Quick reply suggestions -->
  <div id="chat-suggestions">
    <div class="chat-chip">🎬 Recommend a movie</div>
    <div class="chat-chip">🔥 Trending now</div>
    <div class="chat-chip">⭐ Top rated</div>
    <div class="chat-chip">📅 Upcoming</div>
    <div class="chat-chip">😂 Comedy</div>
    <div class="chat-chip">😱 Horror</div>
    <div class="chat-chip">❤️ Romance</div>
    <div class="chat-chip">🚀 Sci-Fi</div>
  </div>

  <!-- Input bar -->
  <div id="chat-input-bar">
    <input
      id="chat-input"
      type="text"
      placeholder="Ask Clappy anything..."
      autocomplete="off"
    />
    <button id="chat-send-btn">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12L22 2L14 22L11 13L2 12Z"/>
      </svg>
    </button>
  </div>

</div>
`;

// === INJECT CHAT INTO PAGE ===
document.body.insertAdjacentHTML('beforeend', chatHTML);

// === ELEMENT REFERENCES ===
const clappyChat   = document.getElementById('clappy-chat');
const chatMessages = document.getElementById('chat-messages');
const chatTyping   = document.getElementById('chat-typing');
const chatInput    = document.getElementById('chat-input');
const chatSendBtn  = document.getElementById('chat-send-btn');
const chatCloseBtn = document.getElementById('chat-close-btn');
const chatChips    = document.querySelectorAll('.chat-chip');

// === OPEN / CLOSE CHAT ===
function toggleChat(open) {
  if (open) {
    clappyChat.classList.add('open');
    // Show welcome message if first time
    if (chatMessages.children.length === 0) {
      setTimeout(() => {
        addClappyMessage("Hey there! 🎬 I'm Clappy, your personal movie guide! What are we watching today?");
      }, 300);
    }
    chatInput.focus();
  } else {
    clappyChat.classList.remove('open');
  }
}

// === CLOSE BUTTON ===
chatCloseBtn.addEventListener('click', () => {
  clappyChat.classList.remove('open');

  // Also close clapper head on character
  const headTop = document.getElementById('clappy-head-top');
  if (headTop) headTop.classList.remove('open');

  // Update isOpen state in clappy.js
  isOpen = false;
});

// === ADD CLAPPY MESSAGE ===
function addClappyMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-msg', 'clappy');
  msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
  chatMessages.appendChild(msg);
  scrollToBottom();
}

// === ADD USER MESSAGE ===
function addUserMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-msg', 'user');
  msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
  chatMessages.appendChild(msg);
  scrollToBottom();
}

// === TYPING INDICATOR ===
function showTyping() {
  chatTyping.classList.add('show');
  scrollToBottom();
}

function hideTyping() {
  chatTyping.classList.remove('show');
}

// === SCROLL TO BOTTOM ===
function scrollToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

// === SEND MESSAGE ===
function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Show user message
  addUserMessage(trimmed);
  chatInput.value = '';

  // Show typing indicator
  showTyping();

  // Send to AI brain (ai.js handles the response)
  if (typeof askClappy === 'function') {
    askClappy(trimmed).then((response) => {
      hideTyping();
      addClappyMessage(response);
    }).catch(() => {
      hideTyping();
      addClappyMessage("Hmm, I had trouble with that one. Try again? 🎬");
    });
  } else {
    // AI not loaded yet — placeholder response
    setTimeout(() => {
      hideTyping();
      addClappyMessage("I'm still warming up my projector! 🎥 Ask me again in a moment.");
    }, 1200);
  }
}

// === SEND BUTTON CLICK ===
chatSendBtn.addEventListener('click', () => {
  sendMessage(chatInput.value);
});

// === ENTER KEY TO SEND ===
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage(chatInput.value);
  }
});

// === QUICK REPLY CHIPS ===
chatChips.forEach(chip => {
  chip.addEventListener('click', () => {
    sendMessage(chip.textContent.trim());
  });
});

// === REPOSITION CHAT IF CLAPPY IS DRAGGED ===
function repositionChat() {
  const rootRect = document.getElementById('clappy-root').getBoundingClientRect();
  const chatW    = clappyChat.offsetWidth;
  const chatH    = clappyChat.offsetHeight;

  let left = rootRect.left + (rootRect.width / 2) - (chatW / 2);
  let top  = rootRect.top - chatH - 16;

  // Keep within screen
  left = Math.max(8, Math.min(window.innerWidth  - chatW - 8, left));
  top  = Math.max(8, Math.min(window.innerHeight - chatH - 8, top));

  clappyChat.style.left   = left + 'px';
  clappyChat.style.top    = top  + 'px';
  clappyChat.style.right  = 'auto';
  clappyChat.style.bottom = 'auto';
}

// Update chat position when Clappy is dragged
document.addEventListener('touchmove', repositionChat, { passive: true });
document.addEventListener('mousemove', () => {
  if (typeof isDragging !== 'undefined' && isDragging) {
    repositionChat();
  }
});