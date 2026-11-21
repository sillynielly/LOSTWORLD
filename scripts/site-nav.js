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
