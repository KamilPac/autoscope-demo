import { test, expect } from "../../fixtures/test";
import { loginAsAdmin } from "../../helpers/auth";
import { CarsPage } from "../../pom/cars.page";
import { ImportLotPage } from "../../pom/import-lot.page";

test.describe("External import nightly smoke", () => {
  test("imports real external URL when configured", async ({ page }) => {
    const externalUrl = process.env.EXTERNAL_IMPORT_SMOKE_URL;

    test.skip(!externalUrl, "EXTERNAL_IMPORT_SMOKE_URL is not configured");

    await loginAsAdmin(page);

    const importLotPage = new ImportLotPage(page);
    await importLotPage.goto();
    await importLotPage.submitImport(externalUrl!);

    await expect(page.getByText(/Lot imported successfully|Import failed/)).toBeVisible({ timeout: 60_000 });

    const showImportedLink = page.getByRole("link", { name: "Show imported lot in results" });
    if (await showImportedLink.count()) {
      await showImportedLink.click();

      const carsPage = new CarsPage(page);
      await carsPage.expectAnyResultCardVisible();
    }
  });
});
