import { test, expect } from "../../fixtures/test";
import { loginAsUser } from "../../helpers/auth";

test.describe("Admin access guard", () => {
  test("regular user is redirected from admin panel to user panel", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/panel/admin-cars");
    await expect(page).toHaveURL(/\/panel/);
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
  });
});
