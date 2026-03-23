import { test, expect } from "../../fixtures/test";
import { loginAsAdmin, loginAsUser } from "../../helpers/auth";
import { CarsPage } from "../../pom/cars.page";

test.describe("Filters, sort and pagination variants", () => {
  test("sort changes first result order for seeded lots", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);

    await carsPage.goto("q=9000000&sort=price_high");
    await carsPage.expectAnyResultCardVisible();
    await expect(carsPage.firstResultCard().getByText("2020 BMW 330i")).toBeVisible();

    await carsPage.goto("q=9000000&sort=newest");
    await carsPage.expectAnyResultCardVisible();
    await expect(carsPage.firstResultCard().getByText("2021 Audi A4")).toBeVisible();
  });

  test("filter by make narrows seeded lot results", async ({ page }) => {
    await loginAsUser(page);

    const carsPage = new CarsPage(page);

    await carsPage.goto("q=9000000&make=Mercedes-Benz&sort=ending_soon");
    await carsPage.expectAnyResultCardVisible();
    await expect(carsPage.firstResultCard().getByText("2019 Mercedes-Benz E300")).toBeVisible();
    await expect(page.getByRole("link", { name: "View details" })).toHaveCount(1);
  });

  test("pagination navigates to page 2 when dataset exceeds one page", async ({ page }) => {
    await loginAsAdmin(page);

    const extraLots = Array.from({ length: 10 }, (_, index) => {
      const seq = index + 1;
      const lotNumber = `910000${seq.toString().padStart(2, "0")}`;

      return {
        id: `marketcheck-${lotNumber}`,
        source: "marketcheck",
        lotNumber,
        vin: `WBATEST${seq.toString().padStart(11, "0")}`,
        year: 2016 + (seq % 6),
        make: seq % 2 === 0 ? "BMW" : "Audi",
        model: seq % 2 === 0 ? "320i" : "A3",
        trim: "E2E",
        engine: "2.0L I4",
        drivetrain: "FWD",
        transmission: "Automatic",
        bodyStyle: "Sedan",
        exteriorColor: "White",
        fuelType: "Gasoline",
        mileageKm: 50000 + seq * 1000,
        location: "Test City",
        damage: "normal_wear",
        titleStatus: "Clean",
        sellerType: "Dealer",
        runAndDrive: true,
        hasKeys: true,
        estimateMinUsd: 7000 + seq * 100,
        estimateMaxUsd: 9000 + seq * 100,
        currentBidUsd: 8000 + seq * 100,
        imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        imageUrls: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80"],
      };
    });

    const bulkResponse = await page.request.post("/api/lots/import-bulk", {
      data: { lots: extraLots },
    });
    expect(bulkResponse.ok()).toBeTruthy();

    const carsPage = new CarsPage(page);
    await carsPage.goto("sort=ending_soon");

    const paginationNav = page.getByRole("navigation").filter({ hasText: "Page 1 of" });
    await expect(paginationNav).toContainText("Page 1 of");
    await expect(page.getByRole("link", { name: "Next" })).toBeVisible();

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("navigation").filter({ hasText: "Page 2 of" })).toContainText("Page 2 of");
  });
});
