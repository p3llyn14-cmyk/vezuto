"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary } from "@/i18n";
import { loginAction, type AuthActionState } from "@/modules/auth/actions";

const initialState: AuthActionState = undefined;

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const dict = getDictionary();
  const t = dict.auth;
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="email">{t.fields.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email ?? ""}
          required
        />
        <FieldError messages={state?.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t.fields.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      {state?.message && (
        <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {t.loginSubmit}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t.noAccount}{" "}
        <Link href="/registrace" className="text-foreground font-medium hover:underline">
          {t.registerSubmit}
        </Link>
      </p>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
