import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { LoginPage } from "../../pom/login.page";
import { PanelPage } from "../../pom/panel.page";

test.describe("Change password", () => {
  test("shows validation error for wrong current password and allows successful update", async ({ page }) => {
    await loginAsUser(page);

    const panelPage = new PanelPage(page);
    await panelPage.goto("profile");

    await panelPage.changePassword("wrong-current", "user12345");
    await panelPage.expectPasswordMessage("Current password is incorrect");

    await panelPage.changePassword("user123", "user12345");
    await panelPage.expectPasswordMessage("Password updated.");

    await panelPage.signOut();

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn("user", "user12345");
  });
});
