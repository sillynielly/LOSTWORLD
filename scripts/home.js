import { loadAnimals } from "./animal-data.js";

const randomLink = document.querySelector("#home-random");
const status = document.querySelector("#home-status");
const eraButtons = [...document.querySelectorAll(".era-choice")];
const eraResult = document.querySelector("#era-discovery");
const eraStatus = document.querySelector("#era-status");

randomLink.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    const animals = await loadAnimals();
    if (!animals.length) throw new Error("The collection contains no animal records.");
    const animal = animals[Math.floor(Math.random() * animals.length)];
    window.location.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
  } catch (error) {
    console.error("Random animal discovery failed.", error);
    status.textContent = "Random discovery is unavailable. Browse the encyclopedia instead.";
    randomLink.href = "pages/encyclopedia.html";
    randomLink.textContent = "Browse the encyclopedia";
  }
});

function showEraDiscovery(animal, era, total) {
  const link = document.createElement("a");
  link.className = "field-discovery__card";
  link.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
  const image = document.createElement("img");
  image.src = new URL(animal.image.src, new URL("pages/animal.html", window.location.href)).href;
  image.alt = animal.image.alt || `Image of ${animal.commonName}`;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "field-discovery__image-fallback";
    fallback.textContent = "Image unavailable";
    image.replaceWith(fallback);
  }, { once: true });
  const copy = document.createElement("div");
  copy.className = "field-discovery__copy";
  const label = document.createElement("p");
  label.className = "eyebrow";
  label.textContent = `${era} · ${total} archive entries`;
  const title = document.createElement("h3");
  title.textContent = animal.commonName;
  const scientific = document.createElement("p");
  scientific.className = "field-discovery__scientific";
  scientific.textContent = animal.scientificName;
  const description = document.createElement("p");
  description.textContent = animal.appearance || animal.habitat?.text || "Open the profile to explore its story.";
  const action = document.createElement("span");
  action.className = "field-discovery__open";
  action.textContent = "Open field record →";
  copy.append(label, title, scientific, description, action);
  link.append(image, copy);
  eraResult.replaceChildren(link);
  eraResult.classList.remove("is-changing");
  requestAnimationFrame(() => eraResult.classList.add("is-changing"));
  eraStatus.textContent = `A new ${era} discovery is ready. Select the era again to reveal another animal.`;
}

eraButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    eraButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    eraStatus.textContent = "Searching the collection…";
    try {
      const animals = await loadAnimals();
      const matches = animals.filter((animal) => animal.period?.group === button.dataset.era);
      if (!matches.length) {
        eraStatus.textContent = "No animals are listed for this era yet.";
        eraResult.replaceChildren();
        return;
      }
      const currentLink = eraResult.querySelector("a");
      const previousId = currentLink ? new URL(currentLink.href).searchParams.get("id") : null;
      const alternatives = matches.filter((animal) => animal.id !== previousId);
      const pool = alternatives.length ? alternatives : matches;
      showEraDiscovery(pool[Math.floor(Math.random() * pool.length)], button.dataset.era, matches.length);
    } catch (error) {
      console.error("Era discovery failed.", error);
      eraStatus.textContent = "The era explorer could not load. Please try again.";
    }
  });
});
