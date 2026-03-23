import { expect, type Page } from "@playwright/test";

export class CarDetailsPage {
  constructor(private readonly page: Page) {}

  async expectHeadingContains(text: string) {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(text);
  }

  async goBackToSearch() {
    await this.page.getByRole("link", { name: "Back to search" }).click();
    await expect(this.page).toHaveURL(/\/cars/);
  }

  async observeThisCar() {
    await this.page.getByRole("button", { name: "Observe this car" }).click();
    await expect(this.page.getByRole("button", { name: "Remove from observed" })).toBeVisible();
  }

  async setMaxBid(value: number) {
    await this.page.locator("#maxBidInput").fill(String(value));
    await this.page.getByRole("button", { name: "Save amount" }).click();
  }

  async expectBidVisibleTwice(formattedValue: string) {
    await expect(this.page.getByText(formattedValue)).toHaveCount(2);
  }
}
