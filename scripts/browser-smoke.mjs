import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const animals = JSON.parse(readFileSync(join(root, "data/animals.json"), "utf8")).animals;
const baseUrl = "http://127.0.0.1:4173";
const expectedCollectionText = `${animals.length} animal records`;
const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore"
});

let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Local website server did not start.");

  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/pages/encyclopedia.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) =>
    document.querySelector("#collection-total")?.textContent.includes(expected),
    expectedCollectionText
  );

  const firstCard = page.locator(".animal-card__name").first();
  await firstCard.waitFor();
  const alphabeticalFirst = [...animals].sort((a, b) => a.commonName.localeCompare(b.commonName))[0].commonName;
  if ((await firstCard.innerText()) !== alphabeticalFirst) {
    throw new Error("Default alphabetical sorting did not render the expected first animal.");
  }

  await page.selectOption("#sort-animals", "oldest");
  const oldestFirst = [...animals].sort((a, b) => b.period.sortMa - a.period.sortMa)[0].commonName;
  if ((await firstCard.innerText()) !== oldestFirst) {
    throw new Error("Oldest-first sorting did not render the expected first animal.");
  }

  await page.selectOption("#sort-animals", "newest");
  const newestFirst = [...animals].sort((a, b) => a.period.sortMa - b.period.sortMa)[0].commonName;
  if ((await firstCard.innerText()) !== newestFirst) {
    throw new Error("Most-recent-first sorting did not render the expected first animal.");
  }

  await page.getByRole("button", { name: /Mammals/ }).click();
  if (!(await page.locator("#results-count").innerText()).includes("of")) {
    throw new Error("Category filtering did not update the results count.");
  }

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await page.locator("#animal-search").fill(animals[0].commonName);
  await page.waitForFunction(() => document.querySelectorAll("#animal-grid .animal-card").length > 0);
  if ((await firstCard.innerText()) !== animals[0].commonName) {
    throw new Error("Encyclopedia search did not return the requested animal.");
  }

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await page.getByRole("button", { name: /Surprise me/ }).click();
  await page.waitForURL(/animal\.html\?id=/);
  await page.locator(".profile-hero__name").waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/pages/encyclopedia.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) =>
    document.querySelector("#collection-total")?.textContent.includes(expected),
    expectedCollectionText
  );
  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 1
  );
  if (hasHorizontalOverflow) throw new Error("Mobile encyclopedia layout has horizontal overflow.");

  if (pageErrors.length) throw new Error(`Browser JavaScript errors: ${pageErrors.join("; ")}`);
  console.log("Browser smoke tests passed: collection load, sorting, category filter, search, Surprise Me, profile navigation, and mobile overflow.");
} finally {
  if (browser) await browser.close();
  server.kill();
}
