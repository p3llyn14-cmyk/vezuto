import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { formatCzk, formatDate } from "@/lib/format";
import { requireDriverProfile } from "@/modules/auth/queries";
import { listAvailableJobs, listDriverOrders } from "@/modules/drivers/queries";
import { getOrderStatusBadgeVariant } from "@/modules/orders/status-badge";

export const metadata: Metadata = { title: "Zakázky — VezuTo" };

export default async function JobsPage() {
  const profile = await requireDriverProfile("/zakazky");
  const dict = getDictionary();
  const [availableJobs, myOrders] = await Promise.all([
    listAvailableJobs(),
    listDriverOrders(profile.id),
  ]);
  const activeOrders = myOrders.filter(
    (o) =>
      ![
        "completed",
        "cancelled_by_customer",
        "cancelled_by_driver",
        "cancelled_by_admin",
      ].includes(o.status),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      {activeOrders.length > 0 && (
        <section>
          <h1 className="mb-4 text-xl font-semibold tracking-tight">
            {dict.drivers.myJobsTitle}
          </h1>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} href={`/objednavky/${order.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-base">{order.item_title}</CardTitle>
                    <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                      {dict.orders.statusLabels[order.status] ?? order.status}
                    </Badge>
                  </CardHeader>
                  {order.driver_payout_czk !== null && (
                    <CardContent>
                      <p className="font-mono text-sm tabular-nums">
                        {formatCzk(order.driver_payout_czk)}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h1 className="mb-4 text-xl font-semibold tracking-tight">
          {dict.drivers.availableJobsTitle}
        </h1>
        {availableJobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {dict.drivers.availableJobsEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {availableJobs.map((job) => (
              <Link key={job.order_id} href={`/zakazky/${job.order_id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{job.item_title}</CardTitle>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {job.pickup_area} → {job.destination_area}
                      </p>
                    </div>
                    {job.driver_payout_czk !== null && (
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatCzk(job.driver_payout_czk)}
                      </span>
                    )}
                  </CardHeader>
                  {job.requested_date && (
                    <CardContent>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(job.requested_date)}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
