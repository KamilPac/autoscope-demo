import { expect, type Page } from "@playwright/test";

export class PanelPage {
  constructor(private readonly page: Page) {}

  async goto(tab?: "profile" | "observed" | "bids") {
    await this.page.goto(tab ? `/panel?tab=${tab}` : "/panel");
  }

  async signOut() {
    await this.page.getByRole("button", { name: "Sign out" }).click();
  }

  async saveProfileDisplayName(displayName: string) {
    await this.page.getByLabel("Display name").fill(displayName);
    await this.page.getByRole("button", { name: "Save profile" }).click();
  }

  async expectProfileSaved() {
    await expect(this.page.getByText("Settings saved.")).toBeVisible();
  }

  async expectWelcomeHeadingFor(name: string) {
    await expect(this.page.getByRole("heading", { name: `Welcome ${name}` })).toBeVisible();
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.page.getByLabel("Current password").fill(currentPassword);
    await this.page.getByLabel("New password").fill(newPassword);
    await this.page.getByRole("button", { name: "Change password" }).click();
  }

  async expectPasswordMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
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
