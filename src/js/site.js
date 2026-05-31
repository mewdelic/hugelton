import { defineCustomElements } from "/vendor/ionicons/loader/index.js";

defineCustomElements(window);

const topbar = document.querySelector(".topbar");
const mainShell = document.querySelector(".main-shell");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileToggle = document.querySelector(".topbar__mobile-toggle");
const mobileClose = document.querySelector(".mobile-menu__close");
const mobileGroupTriggers = document.querySelectorAll(".mobile-menu__group-trigger");
const cursorDot = document.querySelector(".cursor-dot");
const animatedBlocks = document.querySelectorAll(
  ".hero-grid, .showcase-card, .catalog-card, .contact-card"
);
const interactiveCards = document.querySelectorAll(
  ".catalog-card, .contact-card"
);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
let cursorX = -window.innerWidth;
let cursorY = -window.innerHeight;
let cursorScale = 1;

const setMobileMenu = (open) => {
  if (!mobileMenu || !mobileToggle) return;
  mobileMenu.classList.toggle("is-open", open);
  document.body.classList.toggle("has-mobile-menu-open", open);
  mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
  mobileToggle.setAttribute("aria-expanded", open ? "true" : "false");
};

const syncTopbar = () => {
  if (!topbar || !mainShell) return;
  topbar.classList.toggle("is-condensed", mainShell.scrollTop > 32);
};

const syncScrollMotion = () => {
  if (!mainShell) return;
  const maxScroll = Math.max(mainShell.scrollHeight - mainShell.clientHeight, 1);
  const progress = Math.min(Math.max(mainShell.scrollTop / maxScroll, 0), 1);
  const heroShift = Math.min(mainShell.scrollTop * 0.08, 18);
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  document.documentElement.style.setProperty("--hero-shift", `${heroShift.toFixed(2)}px`);
};

const syncRevealState = () => {
  if (!mainShell) return;
  const shellRect = mainShell.getBoundingClientRect();
  const revealThreshold = shellRect.top + mainShell.clientHeight * 0.88;

  animatedBlocks.forEach((block, index) => {
    const rect = block.getBoundingClientRect();
    const inView = rect.top < revealThreshold;
    if (inView) {
      block.classList.add("is-visible");
      block.style.setProperty("--reveal-delay", `${Math.min(index * 30, 220)}ms`);
    }
  });
};

const scrollMainToHash = (hash, smooth = true) => {
  if (!mainShell || !hash || hash === "#") return;
  const target = document.querySelector(hash);
  if (!target || !mainShell.contains(target)) return;
  const top = target.offsetTop;
  mainShell.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
};

const syncCursorMode = () => {
  document.body.classList.toggle("has-cursor-dot", finePointer.matches);
  if (!finePointer.matches) {
    document.body.classList.remove("cursor-active");
  }
};

const renderCursorDot = () => {
  if (!cursorDot) return;
  cursorDot.style.transform =
    `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) scale(${cursorScale})`;
};

mainShell?.addEventListener(
  "scroll",
  () => {
    syncTopbar();
    syncScrollMotion();
    syncRevealState();
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  syncTopbar();
  syncScrollMotion();
  syncRevealState();
  syncCursorMode();
  if (window.innerWidth > 720) {
    setMobileMenu(false);
  }
});

window.addEventListener("pointermove", (event) => {
  if (!finePointer.matches || !cursorDot) return;
  cursorX = event.clientX;
  cursorY = event.clientY;
  renderCursorDot();
});

document.addEventListener("pointerleave", () => {
  document.body.classList.remove("has-cursor-dot", "cursor-active");
  cursorX = -window.innerWidth;
  cursorY = -window.innerHeight;
  renderCursorDot();
});

document.addEventListener("pointerenter", () => {
  syncCursorMode();
});

interactiveCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 5;
    const rotateY = (x - 0.5) * 5;
    card.style.setProperty("--card-rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--card-rotate-y", `${rotateY.toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--card-rotate-x");
    card.style.removeProperty("--card-rotate-y");
  });
});

mobileToggle?.addEventListener("click", () => {
  const open = mobileToggle.getAttribute("aria-expanded") !== "true";
  setMobileMenu(open);
});

mobileClose?.addEventListener("click", () => setMobileMenu(false));

mobileMenu?.addEventListener("click", (event) => {
  if (event.target === mobileMenu) {
    setMobileMenu(false);
  }
});

mobileGroupTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const group = trigger.closest(".mobile-menu__group");
    if (!group) return;
    const willOpen = !group.classList.contains("is-open");
    group.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMobileMenu(false));
});

document.querySelectorAll("a, button, [role='button']").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    if (!finePointer.matches) return;
    document.body.classList.add("cursor-active");
    cursorScale = 1.75;
    renderCursorDot();
  });

  element.addEventListener("pointerleave", () => {
    document.body.classList.remove("cursor-active");
    cursorScale = 1;
    renderCursorDot();
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    event.preventDefault();
    history.replaceState(null, "", href);
    scrollMainToHash(href);
  });
});

syncTopbar();
syncScrollMotion();
syncRevealState();
syncCursorMode();
renderCursorDot();
setMobileMenu(false);

if (location.hash) {
  requestAnimationFrame(() => scrollMainToHash(location.hash, false));
}
