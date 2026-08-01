import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { formatCzk } from "@/lib/format";
import { logoutAction } from "@/modules/auth/actions";
import { requireProfile } from "@/modules/auth/queries";
import { listDriverOrders } from "@/modules/drivers/queries";
import { listCustomerOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Můj účet — VezuTo" };

const ROLE_LABELS: Record<string, string> = {
  customer: "Zákazník",
  driver: "Řidič",
  admin: "Administrátor",
};

export default async function AccountPage() {
  const profile = await requireProfile("/ucet");
  const dict = getDictionary();
  const recentOrders =
    profile.role === "customer"
      ? await listCustomerOrders(profile.id)
      : profile.role === "driver"
        ? await listDriverOrders(profile.id)
        : [];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <Badge variant="secondary">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
          </div>
          <CardDescription>Přehled vašeho účtu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b py-2">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="flex justify-between border-b py-2">
              <dt className="text-muted-foreground">Telefon</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Stav účtu</dt>
              <dd>
                {profile.account_status === "active" ? "Aktivní" : profile.account_status}
              </dd>
            </div>
          </dl>

          {profile.role === "customer" && (
            <Button
              render={<Link href="/objednavky/nova" />}
              nativeButton={false}
              className="w-full"
            >
              {dict.nav.newOrder}
            </Button>
          )}
          {profile.role === "driver" && (
            <Button
              render={<Link href="/zakazky" />}
              nativeButton={false}
              className="w-full"
            >
              {dict.drivers.availableJobsTitle}
            </Button>
          )}
          {profile.role === "admin" && (
            <Button
              render={<Link href="/admin" />}
              nativeButton={false}
              className="w-full"
            >
              Admin
            </Button>
          )}

          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Odhlásit se
            </Button>
          </form>
        </CardContent>
      </Card>

      {(profile.role === "customer" || profile.role === "driver") &&
        recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {profile.role === "customer"
                  ? "Poslední objednávky"
                  : dict.drivers.myJobsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentOrders.slice(0, 5).map((order) => {
                const price =
                  profile.role === "customer"
                    ? order.customer_price_czk
                    : order.driver_payout_czk;
                return (
                  <Link
                    key={order.id}
                    href={`/objednavky/${order.id}`}
                    className="hover:bg-muted flex items-center justify-between rounded-md p-2 text-sm"
                  >
                    <span>{order.item_title}</span>
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {price !== null ? formatCzk(price) : "—"}
                    </span>
                  </Link>
                );
              })}
              <Link
                href={profile.role === "customer" ? "/objednavky" : "/zakazky"}
                className="text-muted-foreground block pt-1 text-center text-xs hover:underline"
              >
                Zobrazit všechny
              </Link>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
