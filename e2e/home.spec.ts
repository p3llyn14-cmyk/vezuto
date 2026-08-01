import { expect, test } from "@playwright/test";

test("home page loads with the core marketing content", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/VezuTo/);
  await expect(
    page.getByRole("heading", { name: /Koupili jste něco velkého/ }),
  ).toBeVisible();
  // These CTAs are <a> elements composed via Base UI's Button (render={<Link .../>}),
  // which intentionally applies role="button" for consistent button semantics.
  await expect(
    page.getByRole("button", { name: "Zadat přepravu" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chci vozit jako řidič" }).first(),
  ).toBeVisible();
});

test("logged-out header shows login and register, not an account button", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Přihlásit se" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Registrovat se" })).toBeVisible();
});
