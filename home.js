import { loadAnimals } from "./animal-data.js";

const randomLink = document.querySelector("#home-random");
const status = document.querySelector("#home-status");

randomLink.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    const animals = await loadAnimals();
    if (animals.length === 0) throw new Error("The collection contains no animal records.");
    const animal = animals[Math.floor(Math.random() * animals.length)];
    window.location.href = `pages/animal.html?id=${encodeURIComponent(animal.id)}`;
  } catch (error) {
    console.error("Random animal discovery failed.", error);
    status.textContent = "Random discovery is unavailable. Browse the encyclopedia instead.";
    randomLink.href = "pages/encyclopedia.html";
    randomLink.textContent = "Browse the encyclopedia";
  }
});
