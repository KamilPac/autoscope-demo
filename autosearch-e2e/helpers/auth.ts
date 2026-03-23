import type { Page } from "@playwright/test";
import { LoginPage } from "../pom/login.page";
import { TEST_ADMIN, TEST_USER } from "./test-data";

export async function loginAsUser(page: Page, username = "user", password = "user123") {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.signIn(username || TEST_USER.username, password || TEST_USER.password);
}

export async function loginAsAdmin(page: Page, username = "admin", password = "admin123") {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.signIn(username || TEST_ADMIN.username, password || TEST_ADMIN.password);
}
