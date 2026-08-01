import { expect, test } from "@playwright/test";

/**
 * This is the closest thing to "vytvoření objednávky" (spec section 15)
 * this environment can exercise end-to-end: there's no live Supabase
 * project here, so an actual account can't be created and the wizard is
 * unreachable (it's behind a login that requires a real session). What
 * *is* real and testable is the full round-trip up to that point — real
 * browser, real Next.js server action, real Zod validation, and the
 * graceful "not configured" message rather than a crash. Once a real
 * Supabase project exists, extend this test past the submit to assert an
 * actual redirect to /ucet instead.
 */
test("registration form validates input and degrades gracefully without Supabase", async ({
  page,
}) => {
  await page.goto("/registrace");

  await expect(page.getByRole("heading", { name: "Registrace" })).toBeVisible();

  // Submitting with an obviously invalid email should surface a field error,
  // not silently fail or crash.
  await page.getByLabel("Jméno").fill("Test");
  await page.getByLabel("Příjmení").fill("Uživatel");
  await page.getByLabel("E-mail").fill("not-an-email");
  await page.getByLabel("Telefon").fill("+420600000099");
  await page.getByLabel("Heslo", { exact: true }).fill("Heslo1234");
  await page.getByLabel("Heslo znovu").fill("Heslo1234");
  await page.getByRole("button", { name: "Vytvořit účet" }).click();

  await expect(page.getByText("Zadejte platný e-mail.")).toBeVisible();

  // Name/email/phone survive the round trip (echoed back by the server
  // action), but password fields are never echoed back for security, so
  // they come back empty and must be retyped — matching real UX.
  await expect(page.getByLabel("Jméno")).toHaveValue("Test");
  await expect(page.getByLabel("E-mail")).toHaveValue("not-an-email");

  // Fix the email, retype the password, and resubmit — this is now a fully
  // valid submission that reaches the server action's Supabase-configured check.
  await page.getByLabel("E-mail").fill("test.uzivatel@example.com");
  await page.getByLabel("Heslo", { exact: true }).fill("Heslo1234");
  await page.getByLabel("Heslo znovu").fill("Heslo1234");
  await page.getByRole("button", { name: "Vytvořit účet" }).click();

  await expect(
    page.getByText("Přihlašování zatím není nastavené — chybí připojení k Supabase."),
  ).toBeVisible();
});

test("mismatched passwords are rejected before hitting the server", async ({ page }) => {
  await page.goto("/registrace");

  await page.getByLabel("Jméno").fill("Test");
  await page.getByLabel("Příjmení").fill("Uživatel");
  await page.getByLabel("E-mail").fill("test.uzivatel@example.com");
  await page.getByLabel("Telefon").fill("+420600000099");
  await page.getByLabel("Heslo", { exact: true }).fill("Heslo1234");
  await page.getByLabel("Heslo znovu").fill("JinéHeslo1234");
  await page.getByRole("button", { name: "Vytvořit účet" }).click();

  await expect(page.getByText("Hesla se neshodují.")).toBeVisible();
});
