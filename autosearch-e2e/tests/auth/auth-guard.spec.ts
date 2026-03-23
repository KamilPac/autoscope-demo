import { test } from "../../fixtures/test";
import { CarsPage } from "../../pom/cars.page";

test.describe("Auth guard", () => {
  test("redirects guest from protected routes to login", async ({ page }) => {
    const carsPage = new CarsPage(page);
    await carsPage.expectRedirectToLoginForCars();
  });
});
