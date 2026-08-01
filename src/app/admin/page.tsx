import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { formatCzk } from "@/lib/format";
import { getDashboardStats } from "@/modules/admin/queries";

export const metadata: Metadata = { title: "Admin — přehled — VezuTo" };

export default async function AdminDashboardPage() {
  const dict = getDictionary().admin;
  const stats = await getDashboardStats();

  const cards: { label: string; value: string }[] = [
    { label: dict.stats.newOrders, value: String(stats.newOrders) },
    { label: dict.stats.activeOrders, value: String(stats.activeOrders) },
    { label: dict.stats.completedOrders, value: String(stats.completedOrders) },
    { label: dict.stats.cancelledOrders, value: String(stats.cancelledOrders) },
    { label: dict.stats.totalOrderValue, value: formatCzk(stats.totalOrderValueCzk) },
    { label: dict.stats.platformRevenue, value: formatCzk(stats.platformRevenueCzk) },
    { label: dict.stats.activeDrivers, value: String(stats.activeDriverCount) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {dict.dashboardTitle}
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
