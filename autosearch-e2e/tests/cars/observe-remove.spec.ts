import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_LOT } from "../../helpers/test-data";
import { CarDetailsPage } from "../../pom/car-details.page";
import { CarsPage } from "../../pom/cars.page";
import { PanelPage } from "../../pom/panel.page";

test.describe("Observe remove flow", () => {
  test("user can remove observed car and it disappears from panel", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();

    const detailsPage = new CarDetailsPage(page);
    await detailsPage.observeThisCar();

    const panelPage = new PanelPage(page);
    await panelPage.goto("observed");
    await panelPage.expectObservedTabHasEntry();
    await panelPage.removeFirstObservedEntry();
    await panelPage.expectObservedTabEmpty();

    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();
    await detailsPage.expectObserveButtonVisible();
  });
});
