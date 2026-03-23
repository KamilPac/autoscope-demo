import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(next?: string) {
    if (next) {
      await this.page.goto(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    await this.page.goto("/login");
  }

  async signIn(username: string, password: string) {
    await this.page.getByLabel("Username").fill(username);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign in" }).click();
    await expect(this.page).toHaveURL(/\/cars/);
  }
}
