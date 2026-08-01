import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = { title: "Přihlášení — VezuTo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ pokracovat?: string }>;
}) {
  const dict = getDictionary();
  const { pokracovat } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">{dict.auth.loginTitle}</CardTitle>
        <CardDescription>{dict.auth.loginSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo={pokracovat} />
      </CardContent>
    </Card>
  );
}
