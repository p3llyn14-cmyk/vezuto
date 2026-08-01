import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = { title: "Registrace — VezuTo" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const dict = getDictionary();
  const { role } = await searchParams;
  const defaultRole = role === "driver" ? "driver" : "customer";

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">{dict.auth.registerTitle}</CardTitle>
        <CardDescription>{dict.auth.registerSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm defaultRole={defaultRole} />
      </CardContent>
    </Card>
  );
}
