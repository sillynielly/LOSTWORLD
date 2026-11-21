# LOST WORLD

**A world that once was. A history worth discovering.**

LOST WORLD is a growing, selected digital natural history archive about extinct animals. It combines sourced profiles and museum-style discovery experiences, while labeling estimates, hypotheses, and unknown information instead of presenting them as certain facts. The collection is not intended to include every extinct species.

## Features

- Compact, cinematic homepage with a single primary encyclopedia entry point and random animal discovery.
- Searchable encyclopedia with combined category filters, keyword suggestions, result counts, and 12 animals per page.
- Individual animal profiles with classification, habitat, range, diet, physical traits, size where supported, extinction evidence, last records, references, and image credits.
- Discovery Wing with:
  - Animal comparison
  - Extinction timeline
  - Fossil and image gallery
  - Interactive regional map
  - Extinction quiz with explanations and scoring
- Simplified navigation for Home, Encyclopedia, and About, with the five discovery tools under **More discoveries**.
- Responsive layouts and keyboard-accessible navigation and controls.
- A canonical JSON collection shared by the encyclopedia, profiles, and discovery experiences.

## Technologies

The project uses HTML, CSS, JavaScript modules, and JSON. It has no build step or external framework dependencies.

## Run locally

Use **Visual Studio Code with the Live Server extension**:

1. Open the LOST WORLD folder in VS Code.
2. Open `index.html`.
3. Select **Go Live** in the VS Code status bar.
4. Use the site navigation to open the encyclopedia or Discovery Wing.

Serve the folder over HTTP rather than opening pages as `file://`; the website loads JSON data with JavaScript modules and `fetch`.

## Main pages

| Page | Purpose |
| --- | --- |
| `index.html` | Short homepage introduction and encyclopedia entry point |
| `pages/encyclopedia.html` | Search, filter, and paginate through the animal collection |
| `pages/animal.html?id=<animal-id>` | Reusable profile page selected by animal ID |
| `pages/experiences.html` | Directory for the five Discovery Wing tools |
| `pages/compare.html` | Compare two animals |
| `pages/timeline.html` | Browse animals in approximate chronological order |
| `pages/gallery.html` | Explore sourced fossil, specimen, historical, and reconstruction images |
| `pages/map.html` | Explore broad geographic regions associated with animals |
| `pages/quiz.html` | Take and restart an educational quiz |
| `pages/about.html` | Evidence guide, extinction context, research links, and credits |

## Collection

The expandable collection currently contains **100 unique animal records** in `data/animals.json`. It spans mammals, birds, reptiles, dinosaurs, marine animals, fish, amphibians, and invertebrates across geological time and recent history. Category tags overlap (for example, dinosaurs are also reptiles): mammals 24, birds 17, reptiles 29, dinosaurs 18, marine animals 31, fish 8, amphibians 7, and invertebrates 15. The encyclopedia combines dinosaurs and reptiles into one browse filter to avoid a crowded control row.

Currently, **62 records use sourced, species-appropriate images** and **38 use labeled project-created placeholder plates**. A placeholder is not presented as a photograph or scientific reconstruction. The per-species list and attribution details are in `assets/images/IMAGE-CREDITS.md`; source URLs, licenses, and alt text are also stored in the corresponding records in `data/animals.json`.

The collection is deliberately expandable: add a uniquely identified, referenced animal record to `data/animals.json` and update related timeline, map, or quiz data in `data/discovery-features.json` as appropriate. Follow the existing record format and keep uncertain or unavailable information explicit.

## Folder structure

```text
LOST WORLD/
├── index.html
├── README.md
├── assets/
│   └── images/
│       ├── IMAGE-CREDITS.md
│       └── animals/
├── data/
│   ├── animals.json
│   ├── discovery-features.json
│   └── featured-animals.js
├── pages/
│   ├── about.html
│   ├── animal.html
│   ├── compare.html
│   ├── encyclopedia.html
│   ├── experiences.html
│   ├── gallery.html
│   ├── map.html
│   ├── quiz.html
│   └── timeline.html
├── scripts/
│   ├── animal-data.js
│   ├── animal-profile.js
│   ├── encyclopedia.js
│   ├── features.js
│   ├── home.js
│   └── site-nav.js
└── styles/
    ├── about.css
    ├── animal-profile.css
    ├── archive.css
    ├── base.css
    ├── encyclopedia.css
    ├── features.css
    └── home.css
```

## Sources and image attribution

Animal profile references are maintained with each animal record. Image creator, source, and license details are maintained in both the record and `assets/images/IMAGE-CREDITS.md`. Verify attribution and license terms before reusing or modifying any image outside this project.
