import { loadAnimals } from "./animal-data.js";

const profileRoot = document.querySelector("#profile-content");
const profileStatus = document.querySelector("#profile-status");
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

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function localLink(href, text, className) {
  const link = element("a", className, text);
  link.href = href;
  return link;
}

function externalLink(href, text) {
  const link = localLink(href, text);
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function renderBreadcrumb(animal) {
  const nav = element("nav", "profile-breadcrumb");
  nav.setAttribute("aria-label", "Breadcrumb");
  nav.append(
    localLink("encyclopedia.html", "← Back to Encyclopedia", "profile-breadcrumb__back"),
    element("span", "", "/"),
    element("span", "profile-breadcrumb__current", animal.commonName)
  );
  return nav;
}

function renderImage(animal) {
  const figure = element("figure", "profile-visual");
  const imageWrap = element("div", "profile-visual__image");
  const image = element("img", "profile-visual__asset");
  image.src = animal.image.src;
  image.alt = animal.image.alt;
  image.fetchPriority = "high";
  image.addEventListener("error", () => {
    const fallback = element(
      "div",
      "profile-visual__fallback",
      `Image unavailable · ${animal.commonName}`
    );
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", `Image unavailable for ${animal.commonName}`);
    image.replaceWith(fallback);
    console.error(`Image failed to load for ${animal.id}: ${animal.image.src}`);
  }, { once: true });

  const marker = element("span", "profile-visual__marker", "ARCHIVE IMAGE");
  imageWrap.append(image, marker);

  const caption = element("figcaption", "profile-visual__caption");
  const isPlaceholder = animal.image.type.toLocaleLowerCase().includes("placeholder");
  caption.append(
    element(
      "span",
      isPlaceholder ? "profile-visual__type profile-visual__type--placeholder" : "profile-visual__type",
      isPlaceholder ? "Placeholder · not a species image" : animal.image.type
    )
  );

  if (animal.image.sourceUrl) {
    caption.append(
      element("span", "profile-visual__credit", `Image: ${animal.image.creator}. `),
      externalLink(animal.image.sourceUrl, "Source file ↗")
    );
    if (animal.image.licenseUrl) {
      caption.append(document.createTextNode(" · "), externalLink(animal.image.licenseUrl, animal.image.license));
    }
  } else {
    caption.append(element("span", "profile-visual__credit", `${animal.image.creator || "Image creator not listed"} · ${animal.image.license || "License not listed"}. No external species image has been sourced for this entry.`));
  }

  figure.append(imageWrap, caption);
  return figure;
}

function renderFact(label, value, note = "") {
  const item = element("div", "profile-fact");
  item.append(element("dt", "", label), element("dd", "", value));
  if (note) item.append(element("p", "profile-fact__note", note));
  return item;
}

function renderClassification(animal) {
  const section = element("section", "profile-classification");
  section.append(
    element("p", "eyebrow", "Classification"),
    element("h2", "", "Where it belongs")
  );
  if (animal.taxonomicRank !== "species") {
    section.append(
      element("p", "profile-classification__note", `This entry is identified to ${animal.taxonomicRank}, not to a named species.`)
    );
  }

  const list = element("dl", "profile-classification__list");
  Object.entries(animal.classification).forEach(([rank, value]) => {
    list.append(renderFact(rank, value));
  });
  section.append(list);
  return section;
}

function renderEvidencePanel(label, title, copy, className = "") {
  const panel = element("article", `profile-evidence__panel ${className}`.trim());
  panel.append(
    element("p", "eyebrow", label),
    element("h2", "", title),
    element("p", "profile-evidence__copy", copy)
  );
  return panel;
}

function renderProfile(animal, animals) {
  profileRoot.replaceChildren();
  document.title = `${animal.commonName} — LOST WORLD`;
  profileRoot.append(renderBreadcrumb(animal));

  const hero = element("section", "profile-hero");
  const heroCopy = element("div", "profile-hero__copy");
  heroCopy.append(
    element("p", "eyebrow", animal.categories.map((category) => categoryLabels[category] || category).join(" · ")),
    element("h1", "profile-hero__name", animal.commonName),
    element("p", "profile-hero__scientific", animal.scientificName),
    element("p", "profile-hero__lead", animal.appearance)
  );

  const size = element("div", "profile-size");
  size.append(
    element("span", "profile-size__label", "Estimated size"),
    element("p", "profile-size__value", animal.size?.text || "Not reliably established")
  );
  if (animal.size?.estimate) {
    size.append(element("p", "profile-size__note", animal.size.estimate));
  }
  heroCopy.append(size);
  hero.append(heroCopy, renderImage(animal));
  profileRoot.append(hero);

  const facts = element("section", "profile-overview");
  const factHeading = element("div", "profile-section-heading");
  factHeading.append(
    element("p", "eyebrow", "At a glance"),
    element("h2", "", "Habitat, time & diet")
  );
  const factList = element("dl", "profile-facts");
  factList.append(
    renderFact("Geological period / era", animal.period.label, animal.period.confidence),
    renderFact("Habitat", animal.habitat.text, animal.habitat.confidence),
    renderFact("Geographic range", animal.geographicRange.text, animal.geographicRange.confidence),
    renderFact("Diet", animal.diet),
    renderFact("Estimated weight", animal.weight?.text || "Unknown", animal.weight?.note || "")
  );
  facts.append(factHeading, factList, renderClassification(animal));
  profileRoot.append(facts);

  const extinction = element("section", "profile-extinction");
  const extinctionIntro = element("div", "profile-extinction__intro");
  extinctionIntro.append(
    element("p", "eyebrow", "Extinction record"),
    element("h2", "", animal.extinction.label),
    element("p", "profile-copy", animal.extinction.note || `Evidence status: ${animal.extinction.confidence}.`)
  );
  const record = element("div", "profile-last-record");
  record.append(
    element("p", "eyebrow", "Last known record"),
    element("p", "profile-last-record__text", animal.lastKnownRecord.text),
    element("p", "profile-last-record__confidence", animal.lastKnownRecord.confidence)
  );
  const causes = element("ul", "cause-list");
  animal.extinction.causes.forEach((cause) => {
    const item = element("li", "cause-list__item");
    item.append(
      element("p", "cause-list__claim", cause.claim),
      element("span", "cause-list__status", cause.status)
    );
    causes.append(item);
  });
  extinction.append(extinctionIntro, record, causes);
  profileRoot.append(extinction);

  const evidence = element("section", "profile-evidence");
  const fieldNotes = element("article", "profile-evidence__panel profile-evidence__panel--notes");
  fieldNotes.append(
    element("p", "eyebrow", "Field notes"),
    element("h2", "", "Details worth keeping")
  );
  const notesList = element("ul", "profile-notes__list");
  animal.interestingFacts.forEach((fact) => notesList.append(element("li", "", fact)));
  fieldNotes.append(notesList);
  evidence.append(
    fieldNotes,
    renderEvidencePanel("Living relatives", "A surviving branch", animal.livingRelatives),
    renderEvidencePanel("Fossil & specimen record", "Traces in the archive", animal.fossilDiscoveries)
  );
  profileRoot.append(evidence);

  const relatedAnimals = animal.relatedIds
    .map((id) => animals.find((candidate) => candidate.id === id))
    .filter(Boolean);

  if (relatedAnimals.length > 0) {
    const related = element("section", "related-species");
    related.append(
      element("p", "eyebrow", "Explore another record"),
      element("h2", "", "Related animals")
    );
    const links = element("div", "related-species__links");
    relatedAnimals.forEach((candidate) => {
      const link = localLink(`animal.html?id=${encodeURIComponent(candidate.id)}`, "");
      link.append(
        element("span", "related-species__name", candidate.commonName),
        element("span", "related-species__scientific", candidate.scientificName),
        element("span", "related-species__arrow", "View profile ↗")
      );
      links.append(link);
    });
    related.append(links);
    profileRoot.append(related);
  }

  const references = element("section", "profile-references");
  references.append(
    element("p", "eyebrow", "Research trail"),
    element("h2", "", "References & image credit")
  );
  const referenceList = element("ol", "profile-references__list");
  animal.references.forEach((reference) => {
    const item = element("li", "");
    item.append(
      externalLink(reference.url, reference.title),
      element("span", "", reference.organization)
    );
    referenceList.append(item);
  });
  const imageCredit = element("p", "profile-references__credit");
  if (animal.image.sourceUrl) {
    imageCredit.append(
      document.createTextNode(`${animal.image.creator}, ${animal.image.type}. `),
      externalLink(animal.image.sourceUrl, "Image source")
    );
    if (animal.image.licenseUrl) {
      imageCredit.append(document.createTextNode(" · "), externalLink(animal.image.licenseUrl, animal.image.license));
    }
  } else {
    imageCredit.textContent = `${animal.image.creator}: ${animal.image.type}. No external species image is currently available.`;
  }
  references.append(referenceList, imageCredit);
  profileRoot.append(references);
}

async function initialize() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    profileStatus.textContent = "Choose an animal from the encyclopedia to open its profile.";
    profileStatus.append(localLink("encyclopedia.html", "Back to the encyclopedia", "profile-status__link"));
    return;
  }

  try {
    const animals = await loadAnimals();
    const animal = animals.find((entry) => entry.id === id);
    if (!animal) {
      profileStatus.textContent = `No animal record was found for “${id}”.`;
      profileStatus.append(localLink("encyclopedia.html", "Back to the encyclopedia", "profile-status__link"));
      return;
    }

    renderProfile(animal, animals);
    profileStatus.hidden = true;
    profileRoot.hidden = false;
  } catch (error) {
    profileStatus.textContent = `The animal profile could not be opened: ${error.message}`;
    profileStatus.append(localLink("encyclopedia.html", "Back to the encyclopedia", "profile-status__link"));
    console.error(error);
  }
}

initialize();
