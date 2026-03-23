import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { IMPORT_MOCK } from "../../helpers/test-data";
import { ImportLotPage } from "../../pom/import-lot.page";

test.describe("Import lot", () => {
  test("shows imported lot success flow using stable mocked API", async ({ page }) => {
    await loginAsUser(page);

    const importLotPage = new ImportLotPage(page);
    await importLotPage.mockSuccessfulImport(IMPORT_MOCK.payload);

    await importLotPage.goto();
    await importLotPage.submitImport(IMPORT_MOCK.lotUrl);
    await importLotPage.expectSuccess(IMPORT_MOCK.message, IMPORT_MOCK.detailsLine);
  });
});
