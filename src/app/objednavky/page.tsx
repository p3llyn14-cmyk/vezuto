import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { formatCzk, formatDate } from "@/lib/format";
import { requireCustomerProfile } from "@/modules/auth/queries";
import { listCustomerOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Moje objednávky — VezuTo" };

export default async function OrdersListPage() {
  const profile = await requireCustomerProfile("/objednavky");
  const dict = getDictionary();
  const orders = await listCustomerOrders(profile.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Moje objednávky</h1>
        <Button render={<Link href="/objednavky/nova" />} nativeButton={false} size="sm">
          {dict.nav.newOrder}
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Zatím nemáte žádné objednávky.
            <div className="mt-4">
              <Button render={<Link href="/objednavky/nova" />} nativeButton={false}>
                {dict.nav.newOrder}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/objednavky/${order.id}`}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{order.item_title}</CardTitle>
                    <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
                      {order.public_code} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {dict.orders.statusLabels[order.status] ?? order.status}
                  </Badge>
                </CardHeader>
                {order.customer_price_czk !== null && (
                  <CardContent>
                    <p className="font-mono text-sm tabular-nums">
                      {formatCzk(order.customer_price_czk)}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
