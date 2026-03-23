import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_LOT } from "../../helpers/test-data";
import { CarsPage } from "../../pom/cars.page";

test.describe("Data consistency", () => {
  test("list card and details show consistent seeded lot values", async ({ page }) => {
    await loginAsUser(page);
    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();

    const card = carsPage.firstResultCard();
    await expect(card.getByText(`${SEEDED_LOT.year} ${SEEDED_LOT.make} ${SEEDED_LOT.model}`)).toBeVisible();
    await expect(card.getByText("2.0L I4 Turbo")).toBeVisible();
    await expect(card.getByText("Automatic")).toBeVisible();
    await expect(card.getByText("58,400 km")).toBeVisible();

    await carsPage.openFirstDetails();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`${SEEDED_LOT.year} ${SEEDED_LOT.make} ${SEEDED_LOT.model}`);
    await expect(page.getByText("Engine:").locator(".."))
      .toContainText("2.0L I4 Turbo");
    await expect(page.getByText("Transmission:").locator(".."))
      .toContainText("Automatic");
    await expect(page.getByText("Mileage:").locator(".."))
      .toContainText("58,400 km");
    await expect(page.getByText("Location:").locator(".."))
      .toContainText("Atlanta (GA)");
  });
});
