import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_LOT } from "../../helpers/test-data";
import { CarDetailsPage } from "../../pom/car-details.page";
import { CarsPage } from "../../pom/cars.page";

test.describe("Search to details", () => {
  test("opens first car details and returns back to listing", async ({ page }) => {
    await loginAsUser(page);
    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);

    await carsPage.expectAnyResultCardVisible();
    const firstTitle = await carsPage.getFirstCardTitle();
    await carsPage.openFirstDetails();

    const detailsPage = new CarDetailsPage(page);

    if (firstTitle) {
      await detailsPage.expectHeadingContains(firstTitle.split(" ").slice(1).join(" "));
    }

    await detailsPage.goBackToSearch();
    await expect(page).toHaveURL(/\/cars/);
  });
});
