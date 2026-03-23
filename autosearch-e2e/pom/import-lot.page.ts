import { expect, type Page } from "@playwright/test";

export class ImportLotPage {
  constructor(private readonly page: Page) {}

  async mockSuccessfulImport(payload: unknown) {
    await this.page.route("**/api/lots/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });
  }

  async mockFailedImport(payload: unknown, status = 400) {
    await this.page.route("**/api/lots/import", async (route) => {
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });
  }

  async goto() {
    await this.page.goto("/import-lot");
  }

  async submitImport(url: string) {
    await this.page.getByLabel("Lot URL").fill(url);
    await this.page.getByRole("button", { name: "Import lot" }).click();
  }

  async expectSuccess(message: string, detailsLine: string) {
    await expect(this.page.getByText(message)).toBeVisible();
    await expect(this.page.getByText(detailsLine)).toBeVisible();
    await expect(this.page.getByRole("link", { name: "Show imported lot in results" })).toBeVisible();
  }

  async expectError(message: string, detailsLine: string) {
    await expect(this.page.getByText(message)).toBeVisible();
    await expect(this.page.getByText(detailsLine)).toBeVisible();
    await expect(this.page.getByRole("link", { name: "Show imported lot in results" })).toHaveCount(0);
  }
}
