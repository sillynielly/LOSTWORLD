import { loadAnimals } from "./animal-data.js";

const randomButton = document.querySelector("#home-random");
const status = document.querySelector("#home-status");
const featuredAgain = document.querySelector("#featured-again");
const featuredImage = document.querySelector("#featured-image");
const featuredName = document.querySelector("#featured-name");
const featuredScientific = document.querySelector("#featured-scientific");
const featuredPeriod = document.querySelector("#featured-period");
const featuredCategory = document.querySelector("#featured-category");
const featuredLink = document.querySelector("#featured-link");
const countLabel = document.querySelector("#home-animal-count");
let animals = [];
let lastFeaturedId = "";

const eraNotes = {
  paleozoic: { index: "CHAPTER 01", name: "Paleozoic Era", date: "About 541 to 252 million years ago", description: "Life diversified dramatically in the oceans, plants spread across land, and the first vertebrates began to explore new environments." },
  mesozoic: { index: "CHAPTER 02", name: "Mesozoic Era", date: "About 252 to 66 million years ago", description: "Often called the Age of Reptiles, this era saw dinosaurs thrive on land while marine reptiles and flying pterosaurs occupied other environments." },
  cenozoic: { index: "CHAPTER 03", name: "Cenozoic Era", date: "About 66 million years ago to the present", description: "Mammals and birds diversified into many forms as continents, climates, and ecosystems continued to change." },
  recent: { index: "CHAPTER 04", name: "Recent past", date: "The latest part of Earth's long story", description: "Some species disappeared within recorded human history, reminding us that extinction is not only a distant prehistoric event." }
};

function setupEraTabs() {
  const tabs = [...document.querySelectorAll(".home-era-tab")];
  const fields = {
    index: document.querySelector("#era-index"),
    name: document.querySelector("#era-name"),
    date: document.querySelector("#era-date"),
    description: document.querySelector("#era-description")
  };
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    const note = eraNotes[tab.dataset.era];
    if (!note) return;
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    Object.keys(fields).forEach((key) => { fields[key].textContent = note[key]; });
  }));
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  elements.forEach((element) => observer.observe(element));
}

function showFeaturedAnimal(animal) {
  if (!animal) return;
  lastFeaturedId = animal.id;
  featuredName.textContent = animal.commonName;
  featuredScientific.textContent = animal.scientificName;
  featuredPeriod.textContent = animal.period?.label || "Period information in profile";
  featuredCategory.textContent = (animal.categories || []).join(" · ").replaceAll("-", " ");
  featuredLink.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
  featuredImage.alt = animal.image?.alt || `Reconstruction or illustration of ${animal.commonName}`;
  featuredImage.style.opacity = "0";
  const nextSrc = animal.image?.src || "";
  const imageLoader = new Image();
  imageLoader.onload = () => {
    featuredImage.src = nextSrc;
    featuredImage.style.opacity = "1";
  };
  imageLoader.onerror = () => {
    featuredImage.src = "assets/images/spinosaurus-aegyptiacus.png";
    featuredImage.alt = `Featured archive specimen: ${animal.commonName}; image unavailable`;
    featuredImage.style.opacity = "1";
  };
  imageLoader.src = nextSrc;
  const card = document.querySelector("#home-specimen-card");
  card.classList.remove("is-changing");
  void card.offsetWidth;
  card.classList.add("is-changing");
}

function chooseRandomAnimal() {
  if (!animals.length) {
    status.textContent = "The archive is still loading. Please try again in a moment.";
    return null;
  }
  const choices = animals.filter((animal) => animal.id !== lastFeaturedId);
  const chosen = choices[Math.floor(Math.random() * choices.length)] || animals[0];
  showFeaturedAnimal(chosen);
  return chosen;
}

async function initialize() {
  setupEraTabs();
  setupRevealAnimations();
  try {
    animals = await loadAnimals();
    if (countLabel) countLabel.textContent = String(animals.length);
    if (animals.length) {
      const spinosaurus = animals.find((animal) => animal.id === "spinosaurus-aegyptiacus");
      showFeaturedAnimal(spinosaurus || animals[0]);
    }
  } catch (error) {
    console.error("The LOST WORLD home features could not load the archive.", error);
    status.textContent = "Some discovery features are unavailable. You can still browse the encyclopedia.";
  }
}

randomButton?.addEventListener("click", () => {
  const animal = chooseRandomAnimal();
  if (animal) window.location.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
});
featuredAgain?.addEventListener("click", chooseRandomAnimal);
initialize();
