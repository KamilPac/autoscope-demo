import { expect, type Page } from "@playwright/test";

export class PanelPage {
  constructor(private readonly page: Page) {}

  async goto(tab?: "profile" | "observed" | "bids") {
    await this.page.goto(tab ? `/panel?tab=${tab}` : "/panel");
  }

  async signOut() {
    await this.page.getByRole("button", { name: "Sign out" }).click();
  }

  async expectObservedTabHasEntry() {
    await expect(this.page.getByRole("heading", { name: "Observed cars" })).toBeVisible();
    await expect(this.page.getByRole("link", { name: "Open details" }).first()).toBeVisible();
  }

  async expectBidsTabHasAmount(formattedValue: string) {
    await expect(this.page.getByRole("heading", { name: "Bidding plan" })).toBeVisible();
    await expect(this.page.getByText(`Your max bid: ${formattedValue}`)).toBeVisible();
  }
}
