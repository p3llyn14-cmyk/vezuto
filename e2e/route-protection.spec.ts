import { expect, test } from "@playwright/test";

const PROTECTED_ROUTES = [
  "/ucet",
  "/objednavky",
  "/objednavky/nova",
  "/zakazky",
  "/admin",
];

for (const route of PROTECTED_ROUTES) {
  test(`${route} redirects a logged-out visitor to login`, async ({ page }) => {
    await page.goto(route);

    await expect(page).toHaveURL(/\/prihlaseni\?pokracovat=/);
    await expect(page.getByRole("heading", { name: "Přihlášení" })).toBeVisible();
  });
}
