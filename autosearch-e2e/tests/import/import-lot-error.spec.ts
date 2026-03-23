import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { ImportLotPage } from "../../pom/import-lot.page";

test.describe("Import lot error handling", () => {
  test("shows user friendly error message when import fails", async ({ page }) => {
    await loginAsUser(page);

    const importLotPage = new ImportLotPage(page);
    await importLotPage.mockFailedImport(
      {
        message: "Import failed",
        error: "Unsupported lot URL host",
      },
      422,
    );

    await importLotPage.goto();
    await importLotPage.submitImport("https://bad-source.example/lot/112233");
    await importLotPage.expectError("Import failed", "Unsupported lot URL host");
  });
});
