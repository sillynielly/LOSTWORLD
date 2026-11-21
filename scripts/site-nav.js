const header = document.querySelector(".museum-header");
const toggle = document.querySelector(".museum-menu-toggle");
const navigation = document.querySelector(".museum-nav");

if (header && toggle && navigation) {
  document.documentElement.classList.add("has-site-nav");

  function closeNavigation(returnFocus = false) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
    navigation.querySelectorAll("details[open]").forEach((menu) => {
      menu.open = false;
    });
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const openMenu = navigation.querySelector("details[open]");
    if (openMenu) {
      openMenu.open = false;
      openMenu.querySelector("summary")?.focus();
      return;
    }

    if (toggle.getAttribute("aria-expanded") === "true") {
      closeNavigation(true);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) {
      navigation.querySelectorAll("details[open]").forEach((menu) => {
        menu.open = false;
      });

      if (toggle.getAttribute("aria-expanded") === "true") {
        closeNavigation();
      }
    }
  });
}


// Accessible reveal motion for page sections and dynamically rendered cards.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("has-reveal-motion");
  const revealSelector = [
    ".collection__intro", ".collection-search", ".category-bar",
    ".collection-results__meta", ".animal-card",
    ".profile-hero", ".profile-overview", ".profile-classification",
    ".profile-extinction", ".profile-evidence", ".related-species",
    ".profile-references", ".home-hero__content", ".home-hero__specimen",
    ".discovery-card"
  ].join(",");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
  function observeRevealTargets(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(revealSelector) && !root.classList.contains("reveal-pending")) {
      root.classList.add("reveal-pending");
      revealObserver.observe(root);
    }
    root.querySelectorAll(revealSelector).forEach((target) => {
      if (target.classList.contains("reveal-pending")) return;
      target.classList.add("reveal-pending");
      revealObserver.observe(target);
    });
  }
  observeRevealTargets(document);
  const revealMutationObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) observeRevealTargets(node);
    }));
  });
  if (document.body) revealMutationObserver.observe(document.body, { childList: true, subtree: true });
}
