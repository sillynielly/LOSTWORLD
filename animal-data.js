const dataUrl = new URL("../data/animals.json", import.meta.url);

export async function loadAnimals() {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Animal data could not be loaded (HTTP ${response.status}).`);
  }

  const collection = await response.json();
  if (collection.schemaVersion !== 1 || !Array.isArray(collection.animals)) {
    throw new Error("Animal data has an unsupported format.");
  }

  const seenIds = new Set();
  for (const animal of collection.animals) {
    if (
      typeof animal.id !== "string" ||
      typeof animal.commonName !== "string" ||
      typeof animal.scientificName !== "string" ||
      !Array.isArray(animal.categories) ||
      typeof animal.period?.label !== "string" ||
      !["Paleozoic", "Mesozoic", "Cenozoic", "Historical"].includes(animal.period.group) ||
      !Number.isFinite(animal.period.sortMa) ||
      typeof animal.extinction?.label !== "string" ||
      !Array.isArray(animal.extinction.causes) ||
      typeof animal.habitat?.text !== "string" ||
      typeof animal.geographicRange?.text !== "string" ||
      typeof animal.livingRelatives !== "string" ||
      typeof animal.fossilDiscoveries !== "string" ||
      !animal.image ||
      typeof animal.image.src !== "string" ||
      typeof animal.image.alt !== "string" ||
      typeof animal.image.sourceUrl !== "string" ||
      typeof animal.image.license !== "string" ||
      !Array.isArray(animal.references) ||
      animal.references.length === 0 ||
      typeof animal.weight?.text !== "string"
    ) {
      throw new Error(`Animal data contains an incomplete record${animal.id ? `: ${animal.id}` : ""}.`);
    }

    if (seenIds.has(animal.id)) {
      throw new Error(`Animal data contains a duplicate ID: ${animal.id}.`);
    }
    seenIds.add(animal.id);
  }

  for (const animal of collection.animals) {
    if (
      !Array.isArray(animal.relatedIds) ||
      animal.relatedIds.some((id) => !seenIds.has(id))
    ) {
      throw new Error(`Animal data contains an invalid related-species link: ${animal.id}.`);
    }
  }

  return collection.animals;
}
