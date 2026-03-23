import { expect, type Locator, type Page } from "@playwright/test";

export class CarsPage {
  constructor(private readonly page: Page) {}

  async goto(query?: string) {
    await this.page.goto(query ? `/cars?${query}` : "/cars");
  }

  firstResultCard(): Locator {
    return this.page.locator("article").filter({ has: this.page.getByRole("link", { name: "View details" }) }).first();
  }

  async expectAnyResultCardVisible() {
    await expect(this.firstResultCard()).toBeVisible();
  }

  async openFirstDetails() {
    await this.firstResultCard().getByRole("link", { name: "View details" }).click();
    await expect(this.page).toHaveURL(/\/cars\//);
  }

  async getFirstCardTitle() {
    const text = await this.firstResultCard().locator("h3").first().textContent();
    return (text ?? "").trim();
  }

  async expectRedirectToLoginForCars() {
    await this.page.goto("/cars");
    await expect(this.page).toHaveURL(/\/login\?next=%2Fcars/);
  }
}
