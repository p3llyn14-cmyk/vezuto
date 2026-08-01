"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getDictionary } from "@/i18n";
import { registerAction, type AuthActionState } from "@/modules/auth/actions";

const initialState: AuthActionState = undefined;

export function RegisterForm({ defaultRole }: { defaultRole?: "customer" | "driver" }) {
  const dict = getDictionary();
  const t = dict.auth;
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label>{t.fields.role}</Label>
        <RadioGroup
          name="role"
          defaultValue={state?.values?.role ?? defaultRole ?? "customer"}
          className="grid grid-cols-2 gap-3"
        >
          <Label
            htmlFor="role-customer"
            className="has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent flex cursor-pointer flex-col gap-1 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="customer" id="role-customer" />
              <span className="text-sm font-medium">{t.fields.roleCustomer}</span>
            </div>
            <span className="text-muted-foreground pl-6 text-xs">
              {t.fields.roleCustomerHint}
            </span>
          </Label>
          <Label
            htmlFor="role-driver"
            className="has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent flex cursor-pointer flex-col gap-1 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="driver" id="role-driver" />
              <span className="text-sm font-medium">{t.fields.roleDriver}</span>
            </div>
            <span className="text-muted-foreground pl-6 text-xs">
              {t.fields.roleDriverHint}
            </span>
          </Label>
        </RadioGroup>
        <FieldError messages={state?.errors?.role} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t.fields.firstName}</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={state?.values?.firstName ?? ""}
            required
          />
          <FieldError messages={state?.errors?.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t.fields.lastName}</Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={state?.values?.lastName ?? ""}
            required
          />
          <FieldError messages={state?.errors?.lastName} />
        </div>
      </div>

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
        <Label htmlFor="phone">{t.fields.phone}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+420 600 000 000"
          defaultValue={state?.values?.phone ?? ""}
          required
        />
        <FieldError messages={state?.errors?.phone} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t.fields.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">{t.fields.passwordConfirm}</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state?.errors?.passwordConfirm} />
      </div>

      {state?.message && (
        <p className="bg-accent text-accent-foreground rounded-md p-3 text-sm">
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {t.registerSubmit}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t.haveAccount}{" "}
        <Link href="/prihlaseni" className="text-foreground font-medium hover:underline">
          {t.loginSubmit}
        </Link>
      </p>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
