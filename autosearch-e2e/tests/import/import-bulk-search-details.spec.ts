import { test, expect } from "../../fixtures/test";
import { loginAsAdmin } from "../../helpers/auth";
import { CarsPage } from "../../pom/cars.page";

test.describe("Import bulk to search/details", () => {
  test("bulk imported lot is visible in search and details", async ({ page }) => {
    await loginAsAdmin(page);

    const lot = {
      id: "marketcheck-92000001",
      source: "marketcheck",
      lotNumber: "92000001",
      vin: "WBA8E9G59GNU12345",
      year: 2018,
      make: "BMW",
      model: "430i",
      trim: "Gran Coupe",
      engine: "2.0L I4 Turbo",
      drivetrain: "RWD",
      transmission: "Automatic",
      bodyStyle: "Coupe",
      exteriorColor: "White",
      fuelType: "Gasoline",
      mileageKm: 88400,
      location: "Seattle (WA)",
      damage: "normal_wear",
      titleStatus: "Clean",
      sellerType: "Dealer",
      runAndDrive: true,
      hasKeys: true,
      estimateMinUsd: 11000,
      estimateMaxUsd: 13600,
      currentBidUsd: 12100,
      imageUrl: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80"],
    } as const;

    const response = await page.request.post("/api/lots/import-bulk", {
      data: { lots: [lot] },
    });

    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { importedCount?: number };
    expect(payload.importedCount).toBe(1);

    const carsPage = new CarsPage(page);
    await carsPage.goto(`q=${lot.lotNumber}&source=marketcheck`);
    await carsPage.expectAnyResultCardVisible();
    await expect(carsPage.firstResultCard().getByText(`${lot.year} ${lot.make} ${lot.model}`)).toBeVisible();

    await carsPage.openFirstDetails();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`${lot.year} ${lot.make} ${lot.model}`);
    await expect(page.getByText("VIN:").locator("..")).toContainText(lot.vin);
  });
});
