import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { PanelPage } from "../../pom/panel.page";

test.describe("Panel tabs", () => {
  test("profile, observed and bids tabs are accessible", async ({ page }) => {
    await loginAsUser(page);
    const panelPage = new PanelPage(page);

    await panelPage.goto("profile");
    await expect(page.getByRole("heading", { name: "Account settings" })).toBeVisible();

    await panelPage.goto("observed");
    await expect(page.getByRole("heading", { name: "Observed cars" })).toBeVisible();

    await panelPage.goto("bids");
    await expect(page.getByRole("heading", { name: "Bidding plan" })).toBeVisible();
  });
});
