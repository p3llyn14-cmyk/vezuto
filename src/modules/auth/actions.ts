"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./schemas";

export type AuthActionState =
  | {
      errors?: Partial<Record<string, string[]>>;
      message?: string;
      // Echoed back so the (uncontrolled) form fields can be restored via
      // defaultValue after a round trip — otherwise every non-redirect
      // return here re-renders the form with all inputs wiped, forcing the
      // user to retype everything just because one field was invalid.
      // Never includes password.
      values?: Partial<
        Record<"role" | "firstName" | "lastName" | "email" | "phone", string>
      >;
    }
  | undefined;

function isSafeRedirectPath(path: string | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

const NOT_CONFIGURED_MESSAGE =
  "Přihlašování zatím není nastavené — chybí připojení k Supabase. Zkuste to prosím později.";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    role: formData.get("role"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  };
  const values = {
    role: typeof raw.role === "string" ? raw.role : undefined,
    firstName: typeof raw.firstName === "string" ? raw.firstName : undefined,
    lastName: typeof raw.lastName === "string" ? raw.lastName : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  if (!isSupabaseConfigured()) {
    return { message: NOT_CONFIGURED_MESSAGE, values };
  }

  const { role, firstName, lastName, email, phone, password } = parsed.data;
  const supabase = await createClient();

  // profiles (and, for drivers, driver_profiles) are created server-side by
  // the handle_new_auth_user trigger on auth.users — this metadata is its
  // only input, and the trigger clamps "role" itself rather than trusting
  // it, so a tampered request body still can't self-promote past customer/driver.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    },
  });

  if (error) {
    return { message: mapSupabaseAuthError(error.message), values };
  }

  if (!data.session) {
    return {
      message:
        "Účet byl vytvořen. Zkontrolujte e-mail a potvrďte registraci kliknutím na odkaz, než se přihlásíte.",
    };
  }

  redirect("/ucet");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rawEmail = formData.get("email");
  const values = { email: typeof rawEmail === "string" ? rawEmail : undefined };
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  if (!isSupabaseConfigured()) {
    return { message: NOT_CONFIGURED_MESSAGE, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: "Nesprávný e-mail nebo heslo.", values };
  }

  const redirectTo = formData.get("redirectTo");
  redirect(isSafeRedirectPath(redirectTo as string) ? (redirectTo as string) : "/ucet");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

function mapSupabaseAuthError(message: string): string {
  if (message.toLowerCase().includes("already registered")) {
    return "Tento e-mail už je zaregistrovaný. Zkuste se přihlásit.";
  }
  if (message.toLowerCase().includes("password")) {
    return "Heslo nesplňuje požadavky serveru.";
  }
  return "Registraci se nepodařilo dokončit. Zkuste to prosím znovu.";
}
