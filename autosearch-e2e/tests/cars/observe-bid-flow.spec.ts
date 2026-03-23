import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { BID_VALUES, SEEDED_LOT } from "../../helpers/test-data";
import { CarDetailsPage } from "../../pom/car-details.page";
import { CarsPage } from "../../pom/cars.page";
import { PanelPage } from "../../pom/panel.page";

test.describe("Observe and bid flow", () => {
  test("user can observe a car and set max bid", async ({ page }) => {
    await loginAsUser(page);
    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);

    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();

    const detailsPage = new CarDetailsPage(page);
    await detailsPage.observeThisCar();
    await detailsPage.setMaxBid(BID_VALUES.maxBid);
    await detailsPage.expectBidVisibleTwice(BID_VALUES.maxBidFormatted);

    const panelPage = new PanelPage(page);
    await panelPage.goto("observed");
    await panelPage.expectObservedTabHasEntry();

    await panelPage.goto("bids");
    await panelPage.expectBidsTabHasAmount(BID_VALUES.maxBidFormatted);
  });
});
