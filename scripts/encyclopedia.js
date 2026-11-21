import { loadAnimals } from "./animal-data.js";

const categoryOptions = [
  { id: "all", label: "All animals" },
  { id: "mammals", label: "Mammals" },
  { id: "birds", label: "Birds" },
  { id: "dinosaurs-reptiles", label: "Dinosaurs & reptiles" },
  { id: "marine-animals", label: "Marine animals" },
  { id: "fish", label: "Fish" },
  { id: "amphibians", label: "Amphibians" },
  { id: "invertebrates", label: "Invertebrates" }
];
const categoryLabels = {
  mammals: "Mammal",
  birds: "Bird",
  reptiles: "Reptile",
  dinosaurs: "Dinosaur",
  "marine-animals": "Marine animal",
  fish: "Fish",
  amphibians: "Amphibian",
  invertebrates: "Invertebrate"
};
const pageSize = 12;
const animalGrid = document.querySelector("#animal-grid");
const filters = document.querySelector("#category-filters");
const searchForm = document.querySelector("#collection-search");
const searchInput = document.querySelector("#animal-search");
const suggestions = document.querySelector("#search-suggestions");
const resultsCount = document.querySelector("#results-count");
const collectionTotal = document.querySelector("#collection-total");
const emptyMessage = document.querySelector("#collection-empty");
const statusMessage = document.querySelector("#collection-status");
const clearButton = document.querySelector("#clear-filters");
const pagination = document.querySelector("#pagination");
const surpriseButton = document.querySelector("#surprise-animal");
const sortSelect = document.querySelector("#sort-animals");

let animals = [];
let activeCategory = "all";
let query = "";
let currentPage = 1;
let sortMode = "name";

function createText(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function profileHref(animal) {
  return `animal.html?id=${encodeURIComponent(animal.id)}`;
}

function searchableText(animal) {
  return [
    animal.commonName,
    animal.scientificName,
    animal.period.label,
    animal.period.group,
    animal.habitat.text,
    animal.geographicRange.text,
    animal.extinction.label,
    animal.extinction.note,
    ...animal.extinction.causes.map((cause) => cause.claim),
    ...animal.interestingFacts,
    ...Object.values(animal.classification),
    animal.appearance,
    animal.diet,
    animal.livingRelatives,
    animal.fossilDiscoveries,
    ...animal.categories
  ].join(" ").toLocaleLowerCase();
}

function matchesCategory(animal, categoryId) {
  if (categoryId === "all") return true;
  if (categoryId === "dinosaurs-reptiles") {
    return animal.categories.includes("dinosaurs") || animal.categories.includes("reptiles");
  }
  return animal.categories.includes(categoryId);
}

function matchesFilters(animal) {
  return matchesCategory(animal, activeCategory) &&
    (!query || searchableText(animal).includes(query));
}

function updateFilterUrl() {
  const url = new URL(window.location.href);
  if (activeCategory === "all") url.searchParams.delete("category");
  else url.searchParams.set("category", activeCategory);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function categoryLabel(animal) {
  return animal.categories.map((category) => categoryLabels[category] || category).join(" · ");
}

function createImage(animal) {
  const image = document.createElement("img");
  image.className = "species-image";
  image.src = animal.image.src;
  image.alt = animal.image.alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    const fallback = createText("span", "species-image-fallback", `Image unavailable · ${animal.commonName}`);
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", `Image unavailable for ${animal.commonName}`);
    image.replaceWith(fallback);
    console.error(`Image failed to load for ${animal.id}: ${animal.image.src}`);
  }, { once: true });
  return image;
}

function createAnimalCard(animal, index) {
  const card = document.createElement("a");
  card.className = `animal-card animal-card--variant-${index % 3}`;
  card.href = profileHref(animal);
  card.setAttribute("aria-label", `View details for ${animal.commonName}`);

  const imageFrame = document.createElement("figure");
  imageFrame.className = "animal-card__image";
  imageFrame.append(createImage(animal));
  const isPlaceholder = animal.image.type.toLocaleLowerCase().includes("placeholder");
  const imageCaption = createText(
    "figcaption",
    isPlaceholder ? "animal-card__image-label animal-card__image-label--placeholder" : "animal-card__image-label",
    isPlaceholder ? "Placeholder · not a species image" : animal.image.type
  );
  imageFrame.append(imageCaption);

  const copy = document.createElement("div");
  copy.className = "animal-card__copy";
  copy.append(
    createText("p", "animal-card__category", categoryLabel(animal)),
    createText("h2", "animal-card__name", animal.commonName),
    createText("p", "animal-card__scientific", animal.scientificName),
    createText("p", "animal-card__period", animal.period.label)
  );

  const details = createText("span", "animal-card__link", "View details");
  details.append(createText("span", "", "↗"));
  copy.append(details);
  card.append(imageFrame, copy);
  return card;
}

function renderCategoryFilters() {
  filters.replaceChildren();

  categoryOptions.forEach((category) => {
    const count = category.id === "all"
      ? animals.length
      : animals.filter((animal) => matchesCategory(animal, category.id)).length;
    const button = document.createElement("button");
    button.className = "category-filter";
    button.type = "button";
    button.setAttribute("aria-pressed", String(activeCategory === category.id));
    button.textContent = `${category.label} · ${count}`;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      currentPage = 1;
      updateFilterUrl();
      renderCategoryFilters();
      renderCollection();
    });
    filters.append(button);
  });
}

function renderPagination(totalResults) {
  pagination.replaceChildren();
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize));
  pagination.hidden = totalResults <= pageSize;
  if (pagination.hidden) return;

  const previous = createText("button", "pagination__step", "Previous");
  previous.type = "button";
  previous.disabled = currentPage === 1;
  previous.addEventListener("click", () => changePage(currentPage - 1));
  pagination.append(previous);

  const pageList = document.createElement("div");
  pageList.className = "pagination__pages";
  for (let page = 1; page <= pageCount; page += 1) {
    const button = createText("button", "pagination__page", String(page));
    button.type = "button";
    button.setAttribute("aria-label", `Page ${page}`);
    if (page === currentPage) {
      button.setAttribute("aria-current", "page");
      button.disabled = true;
    } else {
      button.addEventListener("click", () => changePage(page));
    }
    pageList.append(button);
  }
  pagination.append(pageList);

  const pageStatus = createText("span", "pagination__status", `Page ${currentPage} of ${pageCount}`);
  pageStatus.setAttribute("aria-live", "polite");
  pagination.append(pageStatus);

  const next = createText("button", "pagination__step", "Next");
  next.type = "button";
  next.disabled = currentPage === pageCount;
  next.addEventListener("click", () => changePage(currentPage + 1));
  pagination.append(next);
}

function changePage(page) {
  const matches = animals.filter(matchesFilters);
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  currentPage = Math.min(Math.max(page, 1), pageCount);
  renderCollection();
  document.querySelector(".collection-results__meta").scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function renderCollection() {
  const matches = animals.filter(matchesFilters).slice().sort((a, b) => {
    if (sortMode === "oldest") return b.period.sortMa - a.period.sortMa;
    if (sortMode === "newest") return a.period.sortMa - b.period.sortMa;
    return a.commonName.localeCompare(b.commonName);
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageAnimals = matches.slice(start, start + pageSize);

  animalGrid.replaceChildren(...pageAnimals.map(createAnimalCard));
  emptyMessage.hidden = matches.length > 0;
  resultsCount.textContent = matches.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, matches.length)} of ${matches.length} animals`
    : "0 animals found";
  renderPagination(matches.length);
}

function renderSuggestions() {
  suggestions.replaceChildren();
  const value = searchInput.value.trim().toLocaleLowerCase();

  if (!value) {
    suggestions.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    return;
  }

  const matches = animals.filter((animal) => searchableText(animal).includes(value)).slice(0, 6);
  if (matches.length === 0) {
    suggestions.append(createText("li", "search-suggestion__empty", "No matching animal in this collection."));
  } else {
    matches.forEach((animal) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "search-suggestion";
      link.href = profileHref(animal);
      link.setAttribute("role", "option");
      link.append(
        createText("span", "", animal.commonName),
        createText("small", "", animal.scientificName)
      );
      item.append(link);
      suggestions.append(item);
    });
  }

  suggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

async function initialize() {
  try {
    animals = await loadAnimals();
    collectionTotal.textContent = `${animals.length} animal records`;

    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const categoryIds = categoryOptions.map((category) => category.id);
    if (categoryIds.includes(requestedCategory)) {
      activeCategory = requestedCategory;
    } else if (requestedCategory === "reptiles" || requestedCategory === "dinosaurs") {
      activeCategory = "dinosaurs-reptiles";
    }

    renderCategoryFilters();
    renderCollection();
  } catch (error) {
    collectionTotal.textContent = "The collection is unavailable.";
    statusMessage.textContent = `The collection could not be opened: ${error.message}`;
    console.error(error);
  }
}

sortSelect?.addEventListener("change", () => {
  sortMode = sortSelect.value;
  currentPage = 1;
  renderCollection();
});

searchInput.addEventListener("input", () => {
  query = searchInput.value.trim().toLocaleLowerCase();
  currentPage = 1;
  statusMessage.textContent = "";
  renderSuggestions();
  renderCollection();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  query = searchInput.value.trim().toLocaleLowerCase();
  currentPage = 1;
  renderCollection();
  statusMessage.textContent = query && animals.filter(matchesFilters).length === 0
    ? "No entries matched that search. Try a broader term or clear the filters."
    : "";
});

surpriseButton?.addEventListener("click", () => {
  const matches = animals.filter(matchesFilters);
  if (!matches.length) {
    statusMessage.textContent = "No animals match the current filters. Clear them to discover a random animal.";
    return;
  }
  const selected = matches[Math.floor(Math.random() * matches.length)];
  window.location.href = profileHref(selected);
});

clearButton.addEventListener("click", () => {
  activeCategory = "all";
  query = "";
  currentPage = 1;
  searchInput.value = "";
  suggestions.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  statusMessage.textContent = "";
  updateFilterUrl();
  renderCategoryFilters();
  renderCollection();
  searchInput.focus();
});

document.addEventListener("click", (event) => {
  if (event.target instanceof Node && !searchForm.contains(event.target)) {
    suggestions.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }
});

initialize();
