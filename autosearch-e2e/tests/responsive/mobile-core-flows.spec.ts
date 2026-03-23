import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { IMPORT_MOCK, SEEDED_LOT } from "../../helpers/test-data";
import { CarsPage } from "../../pom/cars.page";
import { ImportLotPage } from "../../pom/import-lot.page";
import { PanelPage } from "../../pom/panel.page";

test.describe("Mobile responsive core flows", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("search to details works on mobile viewport", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();

    await expect(page.getByRole("heading", { name: "Vehicle Search" })).toBeVisible();
    await expect(carsPage.firstResultCard()).toBeVisible();

    await carsPage.openFirstDetails();
    await expect(page.getByRole("heading", { level: 1, name: /BMW 330i/i })).toBeVisible();

    await page.getByRole("link", { name: "Back to search" }).click();
    await expect(page).toHaveURL(/\/cars/);
  });

  test("panel tabs and import success message are visible on mobile viewport", async ({ page }) => {
    await loginAsUser(page);

    const panelPage = new PanelPage(page);
    await panelPage.goto("profile");
    await expect(page.getByRole("heading", { name: "Account settings" })).toBeVisible();

    await panelPage.goto("observed");
    await expect(page.getByRole("heading", { name: "Observed cars" })).toBeVisible();

    const importLotPage = new ImportLotPage(page);
    await importLotPage.mockSuccessfulImport(IMPORT_MOCK.payload);
    await importLotPage.goto();
    await importLotPage.submitImport(IMPORT_MOCK.lotUrl);
    await importLotPage.expectSuccess(IMPORT_MOCK.message, IMPORT_MOCK.detailsLine);
  });
});
