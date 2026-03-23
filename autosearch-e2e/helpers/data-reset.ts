import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { appDataDir, baselineDir } from "../fixtures/paths";

const filesToReset = [
  "accounts.json",
  "imported-lots.json",
  "recent-cars.json",
  "watchlist.json",
  "user-max-bids.json",
  "search-cache.json",
];

export async function resetAppDataState() {
  await mkdir(appDataDir, { recursive: true });

  for (const fileName of filesToReset) {
    const sourcePath = path.join(baselineDir, fileName);
    const targetPath = path.join(appDataDir, fileName);
    const content = await readFile(sourcePath, "utf-8");
    await writeFile(targetPath, content, "utf-8");
  }
}
