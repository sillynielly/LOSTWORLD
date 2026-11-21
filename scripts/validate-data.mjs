import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const animalsData = JSON.parse(readFileSync(join(root, "data/animals.json"), "utf8"));
const discovery = JSON.parse(readFileSync(join(root, "data/discovery-features.json"), "utf8"));
const animals = animalsData.animals;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

if (animalsData.schemaVersion !== 1 || !Array.isArray(animals) || animals.length === 0) {
  fail("animals.json has an unsupported or empty collection.");
} else {
  const ids = new Set();
  const imageSources = new Map();
  for (const animal of animals) {
    if (!animal.id || !animal.commonName || !animal.scientificName) {
      fail("An animal record is missing its ID or name.");
      continue;
    }
    if (ids.has(animal.id)) fail(`Duplicate animal ID: ${animal.id}`);
    ids.add(animal.id);

    if (!animal.image?.src || !animal.image?.alt) {
      fail(`Missing image source or alt text: ${animal.id}`);
    } else {
      const previousImageUser = imageSources.get(animal.image.src);
      if (previousImageUser) {
        fail(`Duplicate animal image source used by ${previousImageUser} and ${animal.id}: ${animal.image.src}`);
      } else {
        imageSources.set(animal.image.src, animal.id);
      }
      if (!animal.image.sourceUrl || !animal.image.license || !animal.image.licenseUrl) {
        fail(`Image is missing source attribution or license details: ${animal.id}`);
      }
      if (animal.image.src.startsWith("http://") || animal.image.src.startsWith("https://")) {
        // External image URLs must carry attribution and license metadata above.
      } else {
      const localPath = normalize(join(root, "pages", animal.image.src));
      if (!localPath.startsWith(root) || !existsSync(localPath)) {
        fail(`Image file does not exist: ${animal.id} -> ${animal.image.src}`);
      }
      }
    }

    for (const relatedId of animal.relatedIds || []) {
      if (!animals.some((candidate) => candidate.id === relatedId)) {
        fail(`Unknown related animal ID ${relatedId} in ${animal.id}`);
      }
    }
  }

  const timeline = [
    ...(discovery.timeline?.deepTime || []),
    ...(discovery.timeline?.historical || [])
  ].map((entry) => entry.id);
  const timelineSet = new Set(timeline);
  if (timeline.length !== animals.length || timelineSet.size !== timeline.length) {
    fail("Timeline must contain every animal exactly once.");
  }
  for (const id of ids) if (!timelineSet.has(id)) fail(`Animal missing from timeline: ${id}`);
  for (const id of timelineSet) if (!ids.has(id)) fail(`Timeline references unknown animal: ${id}`);

  for (const region of discovery.mapRegions || []) {
    for (const id of [
      ...(region.nativeRangeIds || []),
      ...(region.fossilRangeIds || []),
      ...(region.discoveryIds || [])
    ]) {
      if (!ids.has(id)) fail(`Map region ${region.id} references unknown animal: ${id}`);
    }
  }

  for (const question of discovery.quizQuestions || []) {
    if (!ids.has(question.animalId)) fail(`Quiz question ${question.id} references unknown animal: ${question.animalId}`);
  }
}

if (process.exitCode) {
  console.error("LOST WORLD data validation failed.");
} else {
  console.log(`LOST WORLD data validation passed: ${animals.length} animals, timeline coverage, related links, map references, quiz references, and image attribution/paths.`);
}
