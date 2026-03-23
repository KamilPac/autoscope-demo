import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_SOLD_LOT } from "../../helpers/test-data";
import { CarsPage } from "../../pom/cars.page";

test.describe("Sold lot lock", () => {
  test("bidding controls are hidden and lock message is visible for sold lot", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_SOLD_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();

    await expect(page.getByText(/Auction status:\s*Sold/i)).toBeVisible();
    await expect(page.getByText("Bidding is locked because this vehicle is sold/closed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save amount" })).toHaveCount(0);
  });
});
