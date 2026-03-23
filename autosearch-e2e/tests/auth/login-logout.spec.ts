import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { PanelPage } from "../../pom/panel.page";

test.describe("Login and logout", () => {
  test("user can sign in and sign out", async ({ page }) => {
    await loginAsUser(page);

    await expect(page.getByText("Logged in as:")).toBeVisible();

    const panelPage = new PanelPage(page);
    await panelPage.goto();
    await panelPage.signOut();

    await expect(page).toHaveURL(/\/?\?logout=1/);
    await expect(page.getByText("You have been signed out successfully.")).toBeVisible();
  });
});
