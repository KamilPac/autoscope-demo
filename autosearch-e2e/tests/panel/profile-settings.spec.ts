import { test } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";
import { PanelPage } from "../../pom/panel.page";

test.describe("Profile settings", () => {
  test("user can update display name and sees it in panel heading", async ({ page }) => {
    await loginAsUser(page);

    const panelPage = new PanelPage(page);
    await panelPage.goto("profile");
    await panelPage.saveProfileDisplayName("QA Driver");
    await panelPage.expectProfileSaved();

    await page.reload();
    await panelPage.expectWelcomeHeadingFor("QA Driver");
  });
});
