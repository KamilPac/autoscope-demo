import { test, expect } from "../../fixtures/test";
import { LoginPage } from "../../pom/login.page";
import { TEST_USER } from "../../helpers/test-data";

test.describe("Login next redirect", () => {
  test("redirects to requested next URL after successful sign in", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto("/cars?q=90000001");
    await loginPage.signIn(TEST_USER.username, TEST_USER.password);

    await expect(page).toHaveURL(/\/cars\?q=90000001/);
  });
});
