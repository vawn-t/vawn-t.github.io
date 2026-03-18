/**
 * main.js — Wedding Invitation
 * Firebase Firestore v12.10.0 (modular, CDN)
 * Features: Guestbook (addDoc + onSnapshot), countdown, scroll reveal, album carousel
 */

import { initializeApp }            from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc,
         query, orderBy, onSnapshot, serverTimestamp }
                                    from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { firebaseConfig }           from "./config.js";

// ── Firebase init ────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── [CHANGE 4] Happy icon postfix pool ─────────────
/** Array of happy/romantic emoji icons to randomly append to guest names */
const HAPPY_ICONS = [
  "🌸", "💕", "🌹", "✨", "💖", "🌷", "🥂", "🎊",
  "💐", "🕊️", "🌺", "💞", "🎉", "🌼", "💗", "🍀",
  "🥰", "🌟", "💍", "🎀", "🫶", "🌈",
];

/** Pick a stable random icon based on the Firestore doc id so it never flickers on re-render */
function getIconForDoc(docId) {
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = (hash * 31 + docId.charCodeAt(i)) >>> 0;
  }
  return HAPPY_ICONS[hash % HAPPY_ICONS.length];
}

// ── Countdown ───────────────────────────────────────
(function initCountdown() {
  const weddingDate = new Date("2026-04-26T10:00:00+07:00").getTime();

  const els = {
    days:  document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins:  document.getElementById("cd-mins"),
    secs:  document.getElementById("cd-secs"),
  };

  function pad(n) { return String(Math.max(0, n)).padStart(2, "0"); }

  function tick() {
    const diff = weddingDate - Date.now();

    if (diff <= 0) {
      Object.values(els).forEach(el => { if (el) el.textContent = "00"; });
      return;
    }

    const days  = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins  = Math.floor((diff % 3_600_000) / 60_000);
    const secs  = Math.floor((diff % 60_000) / 1_000);

    if (els.days)  els.days.textContent  = String(days);
    if (els.hours) els.hours.textContent = pad(hours);
    if (els.mins)  els.mins.textContent  = pad(mins);
    if (els.secs) {
      els.secs.textContent = pad(secs);
      els.secs.classList.remove("tick");
      void els.secs.offsetWidth;
      els.secs.classList.add("tick");
    }
  }

  tick();
  setInterval(tick, 1_000);
})();

// ── Scroll reveal ───────────────────────────────────
(function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();

// ── Album carousel (infinite loop + drag + touch) ─
(function initAlbum() {
  const wrapper = document.getElementById("album-track")?.parentElement;
  const track   = document.getElementById("album-track");
  const dotsEl  = document.getElementById("album-dots");

  if (!wrapper || !track || !dotsEl) return;

  const origSlides = Array.from(track.querySelectorAll(".album__slide"));
  const total      = origSlides.length;
  if (total === 0) return;

  // Clone all slides: prepend clones of last N, append clones of first N
  // This gives seamless wrap-around without visible jump
  const clonesBefore = origSlides.map(s => s.cloneNode(true));
  const clonesAfter  = origSlides.map(s => s.cloneNode(true));

  clonesBefore.reverse().forEach(c => track.prepend(c));
  clonesAfter.forEach(c => track.append(c));

  const allSlides = Array.from(track.querySelectorAll(".album__slide"));

  // Build dots (only for real slides)
  origSlides.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.className = "album__dot" + (i === 0 ? " active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Ảnh ${i + 1}`);
    btn.addEventListener("click", () => scrollToReal(i, "smooth"));
    dotsEl.appendChild(btn);
  });

  function getSlideWidth() {
    return (allSlides[0]?.offsetWidth ?? 220) + 16; // gap=16
  }

  // Real slides start at index `total` (after the prepended clones)
  function scrollToReal(realIndex, behavior = "smooth") {
    const offset = (total + realIndex) * getSlideWidth();
    wrapper.scrollTo({ left: offset, behavior });
  }

  function currentRealIndex() {
    const sw    = getSlideWidth();
    const raw   = Math.round(wrapper.scrollLeft / sw);
    return ((raw - total) % total + total) % total;
  }

  function updateDots() {
    const idx = currentRealIndex();
    dotsEl.querySelectorAll(".album__dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
    });
  }

  // Initialise at position of first real slide (instant, no animation)
  scrollToReal(0, "instant");

  // On scroll, jump silently if we've hit a clone region
  wrapper.addEventListener("scroll", () => {
    const sw    = getSlideWidth();
    const total_left = total * sw;      // left edge of real zone
    const total_right = 2 * total * sw; // right edge of real zone

    if (wrapper.scrollLeft < total_left * 0.5) {
      // Hit the far-left clones — jump to end of real zone
      wrapper.scrollLeft += total * sw;
    } else if (wrapper.scrollLeft > total_right + sw * 0.5) {
      // Hit the far-right clones — jump to start of real zone
      wrapper.scrollLeft -= total * sw;
    }
    updateDots();
  }, { passive: true });

  // Drag-to-scroll
  let isDown   = false;
  let startX, scrollLeft;

  wrapper.addEventListener("mousedown", (e) => {
    isDown = true;
    wrapper.classList.add("dragging");
    startX     = e.pageX - wrapper.offsetLeft;
    scrollLeft = wrapper.scrollLeft;
  });
  ["mouseleave", "mouseup"].forEach(ev =>
    wrapper.addEventListener(ev, () => { isDown = false; wrapper.classList.remove("dragging"); })
  );
  wrapper.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    wrapper.scrollLeft = scrollLeft - (e.pageX - wrapper.offsetLeft - startX) * 1.5;
  });

  // Touch swipe
  let touchStartX = 0;
  wrapper.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  wrapper.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      const idx = currentRealIndex();
      scrollToReal(diff > 0 ? (idx + 1) % total : (idx - 1 + total) % total);
    }
  }, { passive: true });
})();

// ── Image lightbox modal ────────────────────────────
(function initModal() {
  const modal    = document.getElementById("img-modal");
  const modalImg = document.getElementById("modal-img");
  const closeBtn = document.getElementById("modal-close");
  const backdrop = modal?.querySelector(".img-modal__backdrop");

  if (!modal || !modalImg) return;

  function openModal(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt ?? "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    modalImg.src = "";
  }

  // Click on album slides (including clones — they inherit data-modal-src)
  document.getElementById("album-track")?.addEventListener("click", (e) => {
    const slide = e.target.closest(".album__slide[data-modal-src]");
    if (!slide) return;
    openModal(slide.dataset.modalSrc, slide.querySelector("img")?.alt);
  });

  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
})();

// ── QR Gift Toggle ──────────────────────────────────
(function initQRToggle() {
  const qrBtn = document.getElementById("qr-gift-btn");
  const qrImg = document.getElementById("qr-gift-img");

  if (!qrBtn || !qrImg) return;

  qrBtn.addEventListener("click", () => {
    qrImg.classList.remove("qr-gift__image--hidden");
    qrBtn.classList.add("qr-gift__overlay--hidden");
    // Optionally focus image or update ARIA
    qrBtn.setAttribute("aria-expanded", "true");
  });
})();

// ── Guestbook ───────────────────────────────────────
const form          = document.getElementById("guestbook-form");
const submitBtn     = document.getElementById("submit-btn");
const nameInput     = document.getElementById("guest-name");
const msgTextarea   = document.getElementById("guest-message");
const successMsg    = document.getElementById("form-success");
const errorMsg      = document.getElementById("form-error");
const messagesList  = document.getElementById("messages-list");
const messagesEmpty = document.getElementById("messages-empty");
const messagesLoad  = document.getElementById("messages-loading");

// ── Send a message ──────────────────────────────────
async function sendMessage(name, message) {
  await addDoc(collection(db, "guestbook"), {
    name:      name.trim(),
    message:   message.trim(),
    timestamp: serverTimestamp(),
  });
}

// ── Format relative timestamp ───────────────────────
function formatTimestamp(ts) {
  if (!ts) return "";

  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff  = (Date.now() - date.getTime()) / 1_000;

  if (diff < 60)     return "vừa xong";
  if (diff < 3_600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86_400) return `${Math.floor(diff / 3_600)} giờ trước`;

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── [CHANGE 4] Render a single message with icon postfix ──
function renderMessage(doc) {
  const data = doc.data();
  const li   = document.createElement("li");
  li.className = "message-bubble";
  li.dataset.id = doc.id;

  const safeName    = sanitize(data.name    || "Khách");
  const safeMessage = sanitize(data.message || "");
  const icon        = getIconForDoc(doc.id); // stable random icon per message

  li.innerHTML = `
    <div class="message-bubble__header">
      <span class="message-bubble__name">${safeName} <span class="message-bubble__icon" aria-hidden="true">${icon}</span></span>
      <time class="message-bubble__time">${formatTimestamp(data.timestamp)}</time>
    </div>
    <p class="message-bubble__text">${safeMessage}</p>
  `;

  return li;
}

// Simple XSS sanitizer
function sanitize(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── Real-time listener (newest first) ──────────────
const guestbookQuery = query(
  collection(db, "guestbook"),
  orderBy("timestamp", "desc")
);

onSnapshot(
  guestbookQuery,
  (snapshot) => {
    if (messagesLoad) messagesLoad.style.display = "none";

    if (snapshot.empty) {
      if (messagesEmpty) messagesEmpty.hidden = false;
      if (messagesList)  messagesList.innerHTML = "";
      return;
    }

    if (messagesEmpty) messagesEmpty.hidden = true;

    if (messagesList) {
      messagesList.innerHTML = "";
      snapshot.docs.forEach((doc) => {
        messagesList.appendChild(renderMessage(doc));
      });
    }
  },
  (err) => {
    console.error("Firestore listener error:", err);
    if (messagesLoad)  messagesLoad.style.display = "none";
    if (messagesEmpty) {
      messagesEmpty.textContent = "Không thể tải lời chúc. Vui lòng thử lại.";
      messagesEmpty.hidden = false;
    }
  }
);

// ── Form submit handler ─────────────────────────────
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name    = nameInput?.value  ?? "";
    const message = msgTextarea?.value ?? "";

    if (!name.trim()) { nameInput?.focus(); return; }
    if (!message.trim()) { msgTextarea?.focus(); return; }

    if (submitBtn) submitBtn.disabled = true;
    if (successMsg) successMsg.hidden = true;
    if (errorMsg)   errorMsg.hidden   = true;

    try {
      await sendMessage(name, message);
      form.reset();
      if (successMsg) successMsg.hidden = false;
      setTimeout(() => { if (successMsg) successMsg.hidden = true; }, 4_000);
    } catch (err) {
      console.error("Error sending message:", err);
      if (errorMsg) errorMsg.hidden = false;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ── Background Music ─────────────────────────────────
(function initMusic() {
  const audio = document.getElementById("bg-music-audio");
  const playerBtn = document.getElementById("bg-music-player");
  if (!audio || !playerBtn) return;

  let isPlaying = false;
  let hasInteracted = false;

  // Set low volume for background music if desired
  audio.volume = 0.5;

  function attemptPlay() {
    if (hasInteracted) return;
    
    audio.play().then(() => {
      hasInteracted = true;
      isPlaying = true;
      playerBtn.classList.add("is-playing");
      playerBtn.setAttribute("aria-label", "Pause Background Music");
    }).catch(() => {
      // Autoplay blocked
      isPlaying = false;
    });

    ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => 
      document.removeEventListener(evt, attemptPlay)
    );
  }

  // Attempt to play immediately
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isPlaying = true;
      hasInteracted = true;
      playerBtn.classList.add("is-playing");
      playerBtn.setAttribute("aria-label", "Pause Background Music");
    }).catch(error => {
      // Autoplay was prevented, add fallback listeners
      ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => 
        document.addEventListener(evt, attemptPlay, { once: true, passive: true })
      );
    });
  }

  // Toggle music when clicking the disk
  playerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hasInteracted = true;

    if (isPlaying) {
      audio.pause();
      playerBtn.classList.remove("is-playing");
      playerBtn.setAttribute("aria-label", "Play Background Music");
      isPlaying = false;
    } else {
      audio.play().then(() => {
        playerBtn.classList.add("is-playing");
        playerBtn.setAttribute("aria-label", "Pause Background Music");
        isPlaying = true;
      }).catch(err => console.error("Could not play audio:", err));
    }
  });

  // Keyboard toggle
  playerBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playerBtn.click();
    }
  });
})();
