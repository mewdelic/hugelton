const topbar = document.querySelector(".topbar");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileToggle = document.querySelector(".topbar__mobile-toggle");
const mobileClose = document.querySelector(".mobile-menu__close");
const mobileGroupTriggers = document.querySelectorAll(".mobile-menu__group-trigger");

const setMobileMenu = (open) => {
  if (!mobileMenu || !mobileToggle) return;
  mobileMenu.classList.toggle("is-open", open);
  document.body.classList.toggle("has-mobile-menu-open", open);
  mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
  mobileToggle.setAttribute("aria-expanded", open ? "true" : "false");
};

const syncTopbar = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-condensed", window.scrollY > 32);
};

window.addEventListener(
  "scroll",
  () => {
    syncTopbar();
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  syncTopbar();
  if (window.innerWidth > 720) {
    setMobileMenu(false);
  }
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

syncTopbar();
setMobileMenu(false);
