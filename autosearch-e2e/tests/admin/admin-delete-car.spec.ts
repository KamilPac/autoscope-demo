import { test } from "../../fixtures/test";
import { loginAsAdmin } from "../../helpers/auth";
import { SEEDED_LOT } from "../../helpers/test-data";
import { AdminCarsPage } from "../../pom/admin-cars.page";

test.describe("Admin car operations", () => {
  test("admin can delete a saved local car record", async ({ page }) => {
    await loginAsAdmin(page);

    const adminCarsPage = new AdminCarsPage(page);
    await adminCarsPage.goto();
    await adminCarsPage.expectCarPresent(SEEDED_LOT.lotNumber);

    await adminCarsPage.deleteCarByLot(SEEDED_LOT.lotNumber);
    await adminCarsPage.expectDeleteSuccessMessage();
    await adminCarsPage.expectCarMissing(SEEDED_LOT.lotNumber);
  });
});
