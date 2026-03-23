import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { SEEDED_DUP_IMAGES_LOT } from "../../helpers/test-data";
import { CarsPage } from "../../pom/cars.page";

test.describe("Image dedup regression", () => {
  test("details gallery shows only unique thumbnails for duplicated source images", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${SEEDED_DUP_IMAGES_LOT.lotNumber}`);
    await carsPage.expectAnyResultCardVisible();
    await carsPage.openFirstDetails();

    await expect(page.getByRole("heading", { name: SEEDED_DUP_IMAGES_LOT.detailTitle })).toBeVisible();
    await expect(page.getByRole("img", { name: /photo\s+\d+/i })).toHaveCount(SEEDED_DUP_IMAGES_LOT.expectedVisibleThumbnails);
  });
});
