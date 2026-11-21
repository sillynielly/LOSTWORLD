import { loadAnimals } from "./animal-data.js";

const feature = document.body.dataset.feature;
const featureDataUrl = new URL("../data/discovery-features.json", import.meta.url);
const animalById = new Map();
let animals = [];
let featureData;

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function localLink(href, text, className) {
  const link = textElement("a", className, text);
  link.href = href;
  return link;
}

function profileHref(animal) {
  return `animal.html?id=${encodeURIComponent(animal.id)}`;
}

function addExternalLink(parent, href, label, className = "") {
  const link = localLink(href, label, className);
  link.target = "_blank";
  link.rel = "noreferrer";
  parent.append(link);
  return link;
}

async function loadFeatureData() {
  const response = await fetch(featureDataUrl);
  if (!response.ok) {
    throw new Error(`Discovery feature data could not be loaded (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (
    data.schemaVersion !== 1 ||
    !Array.isArray(data.timeline?.deepTime) ||
    !Array.isArray(data.timeline?.historical) ||
    !Array.isArray(data.mapRegions) ||
    !Array.isArray(data.quizQuestions)
  ) {
    throw new Error("Discovery feature data has an unsupported format.");
  }

  const timelineIds = [
    ...data.timeline.deepTime.map((item) => item.id),
    ...data.timeline.historical.map((item) => item.id)
  ];
  if (
    timelineIds.length !== animals.length ||
    new Set(timelineIds).size !== animals.length ||
    timelineIds.some((id) => !animalById.has(id))
  ) {
    throw new Error("Discovery timeline must include each collection animal exactly once.");
  }

  for (const region of data.mapRegions) {
    if (
      typeof region.id !== "string" ||
      typeof region.name !== "string" ||
      !Array.isArray(region.nativeRangeIds) ||
      !Array.isArray(region.fossilRangeIds) ||
      !Array.isArray(region.discoveryIds) ||
      [...region.nativeRangeIds, ...region.fossilRangeIds, ...region.discoveryIds].some((id) => !animalById.has(id))
    ) {
      throw new Error(`Discovery map contains an invalid region${region.name ? `: ${region.name}` : ""}.`);
    }
  }

  for (const question of data.quizQuestions) {
    if (
      typeof question.id !== "string" ||
      typeof question.question !== "string" ||
      !animalById.has(question.animalId) ||
      !Array.isArray(question.choices) ||
      question.choices.length < 2 ||
      !question.choices.includes(question.answer) ||
      typeof question.explanation !== "string"
    ) {
      throw new Error(`Discovery quiz contains an invalid question${question.id ? `: ${question.id}` : ""}.`);
    }
  }

  return data;
}

function renderClassification(animal) {
  const details = [];
  for (const rank of ["class", "order", "family", "genus"]) {
    const value = animal.classification?.[rank];
    if (value) details.push(`${rank}: ${value}`);
  }
  const rankNote = animal.taxonomicRank && animal.taxonomicRank !== "species"
    ? `Entry identified to ${animal.taxonomicRank}, not to a named species.`
    : "";
  return [details.join(" · ") || "Classification details are not supplied.", rankNote]
    .filter(Boolean)
    .join(" ");
}

function renderAnimalColumn(animal) {
  const header = textElement("th", "comparison-animal", "");
  header.scope = "col";

  const imageLink = localLink(profileHref(animal), "", "comparison-animal__image-link");
  const image = document.createElement("img");
  image.src = animal.image.src;
  image.alt = animal.image.alt;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.replaceWith(textElement("span", "comparison-image-fallback", `Image unavailable · ${animal.commonName}`));
  }, { once: true });
  imageLink.append(image);

  const nameLink = localLink(profileHref(animal), animal.commonName, "comparison-animal__name");
  const scientificName = textElement("span", "comparison-animal__scientific", animal.scientificName);
  const imageCredit = textElement("span", "comparison-animal__credit", `${animal.image.type} · ${animal.image.creator}`);
  header.append(imageLink, nameLink, scientificName, imageCredit);
  return header;
}

function comparisonCell(value, note = "") {
  const cell = textElement("td", "comparison-value");
  cell.append(textElement("span", "comparison-value__main", value || "Not recorded in this collection."));
  if (note) cell.append(textElement("span", "comparison-value__note", note));
  return cell;
}

function renderComparisonTable(first, second) {
  const output = document.querySelector("#comparison-output");
  output.replaceChildren();

  const table = document.createElement("table");
  table.className = "comparison-table";
  table.append(textElement("caption", "", "Side-by-side comparison of two extinct animal records."));

  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = textElement("th", "comparison-table__corner", "FIELD NOTE");
  corner.scope = "col";
  headerRow.append(corner, renderAnimalColumn(first), renderAnimalColumn(second));
  head.append(headerRow);
  table.append(head);

  const body = document.createElement("tbody");
  const rows = [
    ["Classification", renderClassification(first), renderClassification(second)],
    [
      "Estimated size",
      first.size?.text || "No reliable size description is supplied.",
      second.size?.text || "No reliable size description is supplied.",
      first.size?.estimate || "No precise measurement is stated in this record.",
      second.size?.estimate || "No precise measurement is stated in this record."
    ],
    [
      "Estimated weight",
      first.weight?.text || "Unknown.",
      second.weight?.text || "Unknown.",
      first.weight?.note || "",
      second.weight?.note || ""
    ],
    ["Diet", first.diet || "Not established in this record.", second.diet || "Not established in this record."],
    ["Habitat", first.habitat?.text || "Not established in this record.", second.habitat?.text || "Not established in this record."],
    [
      "Geographic range",
      first.geographicRange?.text || "Not established in this record.",
      second.geographicRange?.text || "Not established in this record.",
      first.geographicRange?.confidence || "",
      second.geographicRange?.confidence || ""
    ],
    ["Geological period or era", first.period.label, second.period.label],
    [
      "Extinction record",
      first.extinction.label,
      second.extinction.label,
      `${first.extinction.confidence}${first.extinction.note ? ` · ${first.extinction.note}` : ""}`,
      `${second.extinction.confidence}${second.extinction.note ? ` · ${second.extinction.note}` : ""}`
    ]
  ];

  for (const [label, firstValue, secondValue, firstNote = "", secondNote = ""] of rows) {
    const row = document.createElement("tr");
    const rowHeading = textElement("th", "comparison-table__row-heading", label);
    rowHeading.scope = "row";
    row.append(rowHeading, comparisonCell(firstValue, firstNote), comparisonCell(secondValue, secondNote));
    body.append(row);
  }

  table.append(body);
  output.append(table);
}

function initializeComparison() {
  const firstSelect = document.querySelector("#compare-first");
  const secondSelect = document.querySelector("#compare-second");
  const status = document.querySelector("#compare-status");

  for (const animal of animals) {
    const firstOption = textElement("option", "", animal.commonName);
    firstOption.value = animal.id;
    firstSelect.append(firstOption);

    const secondOption = textElement("option", "", animal.commonName);
    secondOption.value = animal.id;
    secondSelect.append(secondOption);
  }

  firstSelect.value = animals.find((animal) => animal.id === "woolly-mammoth")?.id || animals[0].id;
  secondSelect.value = animals.find((animal) => animal.id === "dodo")?.id || animals[1]?.id || animals[0].id;

  function compare() {
    if (firstSelect.value === secondSelect.value) {
      status.textContent = "Choose two different animals to compare their records.";
      document.querySelector("#comparison-output").replaceChildren();
      return;
    }

    status.textContent = "";
    renderComparisonTable(animalById.get(firstSelect.value), animalById.get(secondSelect.value));
  }

  document.querySelector("#compare-submit").addEventListener("click", compare);
  document.querySelector("#compare-swap").addEventListener("click", () => {
    const previousFirst = firstSelect.value;
    firstSelect.value = secondSelect.value;
    secondSelect.value = previousFirst;
    compare();
  });
  firstSelect.addEventListener("change", compare);
  secondSelect.addEventListener("change", compare);
  compare();
}

function confidenceClass(confidence = "") {
  const normalized = confidence.toLowerCase();
  if (normalized.includes("documented")) return "documented";
  if (normalized.includes("estimated") || normalized.includes("uncertain")) return "estimated";
  if (normalized.includes("unknown")) return "unknown";
  return "geological";
}

function timelineCard(animal, context) {
  const link = localLink(profileHref(animal), "", "timeline-card");
  const marker = textElement("span", "timeline-card__marker", context);
  const image = document.createElement("img");
  image.className = "timeline-card__image";
  image.src = animal.image.src;
  image.alt = animal.image.alt;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.replaceWith(textElement("span", "timeline-card__image-fallback", "Image unavailable"));
  }, { once: true });

  const copy = textElement("span", "timeline-card__copy");
  copy.append(
    textElement("span", "timeline-card__period", animal.period.label),
    textElement("span", "timeline-card__name", animal.commonName),
    textElement("span", "timeline-card__scientific", animal.scientificName),
    textElement("span", "timeline-card__event", animal.extinction.label)
  );
  const confidence = textElement(
    "span",
    `evidence-badge evidence-badge--${confidenceClass(animal.extinction.confidence)}`,
    animal.extinction.confidence
  );
  link.append(marker, image, copy, confidence, textElement("span", "timeline-card__link", "Open profile ↗"));
  link.setAttribute("aria-label", `Open ${animal.commonName} profile. ${animal.period.label}. ${animal.extinction.label}`);
  return link;
}

function renderTimeline() {
  const target = document.querySelector("#timeline-content");
  target.replaceChildren();

  const deepTime = document.createElement("section");
  deepTime.className = "timeline-deep-time";
  deepTime.setAttribute("aria-labelledby", "deep-time-title");
  const deepHeading = textElement("div", "timeline-section-heading");
  const deepTitle = textElement("h2", "", "Deep time, read in stone.");
  deepTitle.id = "deep-time-title";
  deepHeading.append(
    textElement("p", "eyebrow", "Geological windows"),
    deepTitle
  );
  deepTime.append(deepHeading);

  for (const era of ["Paleozoic", "Mesozoic", "Cenozoic"]) {
    const records = featureData.timeline.deepTime.filter((item) => item.era === era);
    if (records.length === 0) continue;

    const lane = document.createElement("section");
    lane.className = `timeline-era timeline-era--${era.toLowerCase()}`;
    lane.setAttribute("aria-label", `${era} animal records`);
    const laneHeading = textElement("h3", "timeline-era__title", era);
    const list = document.createElement("div");
    list.className = "timeline-era__records";
    for (const record of records) {
      const animal = animalById.get(record.id);
      list.append(timelineCard(animal, "FOSSIL WINDOW"));
    }
    lane.append(laneHeading, list);
    deepTime.append(lane);
  }

  const recent = document.createElement("section");
  recent.className = "timeline-recent";
  recent.setAttribute("aria-labelledby", "recent-records-title");
  const recentHeading = textElement("div", "timeline-section-heading timeline-section-heading--recent");
  const recentTitle = textElement("h2", "", "Names. Dates. Last witnesses.");
  recentTitle.id = "recent-records-title";
  recentHeading.append(
    textElement("p", "eyebrow", "Records in human history"),
    recentTitle
  );
  recent.append(recentHeading);

  const historicalRail = document.createElement("div");
  historicalRail.className = "timeline-historical";
  for (const record of featureData.timeline.historical) {
    const animal = animalById.get(record.id);
    historicalRail.append(timelineCard(animal, "LAST KNOWN RECORD"));
  }
  recent.append(historicalRail);
  target.append(deepTime, recent);
}

function galleryKind(animal) {
  const type = animal.image.type.toLowerCase();
  if (type.includes("reconstruction")) return "reconstruction";
  if (type.includes("fossil") || type.includes("specimen")) return "specimen";
  return "historical";
}

function galleryCard(animal, index) {
  const card = textElement("article", `gallery-item gallery-item--${index % 5}`);
  card.dataset.kind = galleryKind(animal);

  const figure = document.createElement("figure");
  figure.className = "gallery-item__figure";
  const image = document.createElement("img");
  image.src = animal.image.src;
  image.alt = animal.image.alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.replaceWith(textElement("span", "gallery-item__fallback", `Image unavailable · ${animal.commonName}`));
  }, { once: true });
  const type = textElement("figcaption", "gallery-item__type", animal.image.type);
  figure.append(image, type);

  const copy = textElement("div", "gallery-item__copy");
  copy.append(
    textElement("p", "gallery-item__period", animal.period.label),
    localLink(profileHref(animal), animal.commonName, "gallery-item__name"),
    textElement("p", "gallery-item__scientific", animal.scientificName),
    textElement("p", "gallery-item__credit", `Image: ${animal.image.creator}`)
  );

  const links = textElement("div", "gallery-item__sources");
  addExternalLink(links, animal.image.sourceUrl, "Image source ↗");
  addExternalLink(links, animal.image.licenseUrl, animal.image.license);
  copy.append(links);
  card.append(figure, copy);
  return card;
}

function initializeGallery() {
  const filters = document.querySelector("#gallery-filters");
  const grid = document.querySelector("#gallery-grid");
  const count = document.querySelector("#gallery-count");
  const total = document.querySelector("#gallery-total");
  const options = [
    { id: "all", label: "All traces" },
    { id: "reconstruction", label: "Reconstructions" },
    { id: "specimen", label: "Fossils & specimens" },
    { id: "historical", label: "Historical images" }
  ];

  const cards = animals
    .filter((animal) => !animal.image.type.toLowerCase().includes("placeholder"))
    .map((animal, index) => galleryCard(animal, index));
  grid.replaceChildren(...cards);
  total.textContent = `${cards.length} IMAGE RECORDS`;

  function applyFilter(filter) {
    let visible = 0;
    for (const card of cards) {
      card.hidden = filter !== "all" && card.dataset.kind !== filter;
      if (!card.hidden) visible += 1;
    }
    count.textContent = `${visible} of ${cards.length} sourced image records shown. Every image is credited and linked to its source.`;
  }

  for (const option of options) {
    const button = textElement("button", "gallery-filter", option.label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(option.id === "all"));
    button.addEventListener("click", () => {
      for (const candidate of filters.querySelectorAll("button")) {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      }
      applyFilter(option.id);
    });
    filters.append(button);
  }
  applyFilter("all");
}

function regionRecord(animal, recordType) {
  const article = textElement("article", "atlas-record");
  const heading = textElement("h4", "");
  heading.append(localLink(profileHref(animal), animal.commonName, "atlas-record__link"));
  article.append(
    heading,
    textElement("p", "atlas-record__scientific", animal.scientificName),
    textElement(
      "p",
      "atlas-record__detail",
      recordType === "native" ? animal.geographicRange.text : animal.fossilDiscoveries
    )
  );
  return article;
}

function renderMapRegion(region) {
  const target = document.querySelector("#atlas-results");
  target.replaceChildren(
    textElement("p", "eyebrow", "Selected field region"),
    textElement("h2", "", region.name),
    textElement("p", "atlas-results__prompt", "Regional associations are approximate. Read the three evidence types separately.")
  );

  const nativeHeading = textElement("h3", "atlas-results__section-title", "Native geographic range");
  const nativeList = textElement("div", "atlas-results__records");
  for (const id of region.nativeRangeIds) {
    const animal = animalById.get(id);
    nativeList.append(regionRecord(animal, "native"));
  }

  const evidenceHeading = textElement("h3", "atlas-results__section-title", "Fossil & specimen evidence");
  const evidenceList = textElement("div", "atlas-results__records");
  for (const id of region.discoveryIds) {
    const animal = animalById.get(id);
    evidenceList.append(regionRecord(animal, "discovery"));
  }

  if (region.nativeRangeIds.length === 0) {
    nativeList.append(textElement("p", "atlas-results__empty", "No native-range association is listed for this region in the selected records."));
  }
  const fossilHeading = textElement("h3", "atlas-results__section-title", "Fossil-derived geographic occurrence");
  const fossilList = textElement("div", "atlas-results__records");
  for (const id of region.fossilRangeIds) {
    const animal = animalById.get(id);
    fossilList.append(regionRecord(animal, "fossil"));
  }
  if (region.fossilRangeIds.length === 0) {
    fossilList.append(textElement("p", "atlas-results__empty", "No fossil-derived geographic occurrence is listed for this region in the selected records."));
  }
  if (region.discoveryIds.length === 0) {
    evidenceList.append(textElement("p", "atlas-results__empty", "No fossil or specimen location is listed for this region in the selected records."));
  }

  target.append(nativeHeading, nativeList, fossilHeading, fossilList, evidenceHeading, evidenceList);
}

function initializeMap() {
  const buttons = [...document.querySelectorAll(".map-marker")];
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const region = featureData.mapRegions.find((entry) => entry.id === button.dataset.region);
      if (!region) {
        throw new Error(`No map record exists for region: ${button.dataset.region}.`);
      }
      for (const candidate of buttons) {
        const selected = candidate === button;
        candidate.setAttribute("aria-pressed", String(selected));
        candidate.classList.toggle("is-selected", selected);
      }
      renderMapRegion(region);
    });
  }
}

function renderQuizResult(panel, score) {
  panel.replaceChildren();
  const result = textElement("section", "quiz-results");
  result.setAttribute("aria-labelledby", "quiz-results-title");
  const resultTitle = textElement("h2", "", "The record stays with you.");
  resultTitle.id = "quiz-results-title";
  result.append(
    textElement("p", "eyebrow", "Field notes complete"),
    resultTitle
  );

  const scoreSeal = textElement("div", "quiz-results__seal");
  scoreSeal.append(
    textElement("span", "quiz-results__score", `${score} / ${featureData.quizQuestions.length}`),
    textElement("span", "quiz-results__score-label", "correct")
  );
  const percentage = Math.round((score / featureData.quizQuestions.length) * 100);
  const summary = textElement(
    "p",
    "quiz-results__summary",
    `You answered ${score} of ${featureData.quizQuestions.length} questions correctly (${percentage}%). Revisit any profile to explore the evidence further.`
  );
  const restart = textElement("button", "feature-button", "Begin again");
  restart.type = "button";
  restart.addEventListener("click", initializeQuiz);
  result.append(scoreSeal, summary, restart);
  panel.append(result);
}

function initializeQuiz() {
  const panel = document.querySelector("#quiz-panel");
  const questions = featureData.quizQuestions;
  let currentIndex = 0;
  let score = 0;
  let answered = false;

  function renderQuestion() {
    answered = false;
    const question = questions[currentIndex];
    const animal = animalById.get(question.animalId);
    panel.replaceChildren();

    const top = textElement("div", "quiz-panel__top");
    top.append(
      textElement("p", "eyebrow", `Question ${currentIndex + 1} of ${questions.length}`),
      textElement("span", "quiz-panel__score", `SCORE · ${score}`)
    );
    const progress = document.createElement("progress");
    progress.className = "quiz-progress";
    progress.max = questions.length;
    progress.value = currentIndex + 1;
    progress.setAttribute("aria-label", `Question ${currentIndex + 1} of ${questions.length}`);

    const form = document.createElement("form");
    form.className = "quiz-question";
    const heading = textElement("h2", "quiz-question__title", question.question);
    const fieldset = document.createElement("fieldset");
    fieldset.className = "quiz-choices";
    fieldset.append(textElement("legend", "", "Choose one answer"));

    const feedback = textElement("div", "quiz-feedback");
    feedback.hidden = true;
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");

    for (const [index, choice] of question.choices.entries()) {
      const label = textElement("label", "quiz-choice");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = choice;
      const marker = textElement("span", "quiz-choice__marker", String(index + 1).padStart(2, "0"));
      const text = textElement("span", "quiz-choice__text", choice);
      label.append(input, marker, text);
      fieldset.append(label);
    }

    const submit = textElement("button", "feature-button quiz-submit", "Check answer");
    submit.type = "submit";
    const sourceLinks = textElement("div", "quiz-question__links");
    sourceLinks.append(localLink(profileHref(animal), `Review ${animal.commonName}'s profile ↗`));
    const reference = animal.references[0];
    if (reference) addExternalLink(sourceLinks, reference.url, `${reference.organization} source ↗`);

    form.append(heading, fieldset, submit, feedback, sourceLinks);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (answered) {
        currentIndex += 1;
        if (currentIndex >= questions.length) {
          renderQuizResult(panel, score);
        } else {
          renderQuestion();
        }
        return;
      }

      const formData = new FormData(form);
      const selectedAnswer = formData.get("answer");
      if (typeof selectedAnswer !== "string") {
        feedback.hidden = false;
        feedback.className = "quiz-feedback quiz-feedback--notice";
        feedback.textContent = "Choose an answer before continuing.";
        return;
      }

      const correct = selectedAnswer === question.answer;
      if (correct) score += 1;
      answered = true;
      for (const input of fieldset.querySelectorAll("input")) input.disabled = true;
      feedback.hidden = false;
      feedback.className = `quiz-feedback ${correct ? "quiz-feedback--correct" : "quiz-feedback--incorrect"}`;
      feedback.replaceChildren();
      feedback.append(
        textElement("strong", "quiz-feedback__result", correct ? "Correct." : `Not quite. The record says: ${question.answer}.`),
        textElement("span", "quiz-feedback__explanation", question.explanation)
      );
      feedback.append(localLink(profileHref(animal), `Open the ${animal.commonName} profile ↗`, "quiz-feedback__profile"));
      submit.textContent = currentIndex === questions.length - 1 ? "See your result" : "Next question";
      submit.focus();
    });

    panel.append(top, progress, form);
  }

  renderQuestion();
}

function showFailure(error) {
  const target = document.querySelector(
    "#compare-status, #timeline-status, #gallery-count, #atlas-results, #quiz-status"
  );
  if (target) target.textContent = `This experience could not be opened: ${error.message}`;
  console.error(error);
}

async function initialize() {
  try {
    animals = await loadAnimals();
    for (const animal of animals) animalById.set(animal.id, animal);
    featureData = await loadFeatureData();

    if (feature === "compare") initializeComparison();
    else if (feature === "timeline") renderTimeline();
    else if (feature === "gallery") initializeGallery();
    else if (feature === "map") initializeMap();
    else if (feature === "quiz") initializeQuiz();
  } catch (error) {
    showFailure(error);
  }
}

initialize();
