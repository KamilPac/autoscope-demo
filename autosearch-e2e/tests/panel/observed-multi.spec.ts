import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_DUP_IMAGES_LOT, SEEDED_LOT } from "../../helpers/test-data";
import { CarDetailsPage } from "../../pom/car-details.page";
import { CarsPage } from "../../pom/cars.page";
import { PanelPage } from "../../pom/panel.page";

test.describe("Observed multi-item flow", () => {
  test("user can manage multiple observed cars and clear the list", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);
    const detailsPage = new CarDetailsPage(page);

    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();
    await detailsPage.observeThisCar();

    await carsPage.goto(`q=${SEEDED_DUP_IMAGES_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();
    await detailsPage.observeThisCar();

    const panelPage = new PanelPage(page);
    await panelPage.goto("observed");
    await panelPage.expectObservedEntriesCount(2);
    await panelPage.expectObservedLotVisible(SEEDED_LOT.lotNumber);
    await panelPage.expectObservedLotVisible(SEEDED_DUP_IMAGES_LOT.lotNumber);

    await panelPage.removeObservedEntryByLot(SEEDED_LOT.lotNumber);
    await panelPage.expectObservedEntriesCount(1);
    await panelPage.expectObservedLotMissing(SEEDED_LOT.lotNumber);
    await panelPage.expectObservedLotVisible(SEEDED_DUP_IMAGES_LOT.lotNumber);

    await panelPage.removeObservedEntryByLot(SEEDED_DUP_IMAGES_LOT.lotNumber);
    await panelPage.expectObservedTabEmpty();
  });
});
