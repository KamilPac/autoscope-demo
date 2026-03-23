import { expect, type Page } from "@playwright/test";

export class AdminCarsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/panel/admin-cars");
  }

  private carRowByLot(lotNumber: string) {
    return this.page
      .locator("div.grid.gap-3.rounded-lg.border.border-slate-200.bg-slate-50.p-3")
      .filter({ hasText: `lot: ${lotNumber}` })
      .first();
  }

  async expectCarPresent(lotNumber: string) {
    await expect(this.carRowByLot(lotNumber)).toBeVisible();
  }

  async deleteCarByLot(lotNumber: string) {
    const row = this.carRowByLot(lotNumber);
    await row.getByRole("button", { name: "Delete this car" }).click();
  }

  async expectDeleteSuccessMessage() {
    await expect(this.page.getByText("Car deleted from local storage")).toBeVisible();
  }

  async expectCarMissing(lotNumber: string) {
    await expect(this.carRowByLot(lotNumber)).toHaveCount(0);
  }
}
