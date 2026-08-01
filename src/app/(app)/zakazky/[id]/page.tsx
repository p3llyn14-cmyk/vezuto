import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/i18n";
import { formatCzk } from "@/lib/format";
import { requireDriverProfile } from "@/modules/auth/queries";
import { AcceptJobButton } from "@/modules/drivers/components/accept-job-button";
import { getAvailableJob } from "@/modules/drivers/queries";

export const metadata: Metadata = { title: "Detail zakázky — VezuTo" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDriverProfile(`/zakazky/${id}`);
  const dict = getDictionary();
  const job = await getAvailableJob(id);

  if (!job) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <CardTitle>{job.item_title}</CardTitle>
          <Badge variant="secondary">
            {dict.orders.itemCategories[job.item_category]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>{dict.drivers.reward}</span>
            <span className="font-mono tabular-nums">
              {job.driver_payout_czk !== null ? formatCzk(job.driver_payout_czk) : "—"}
            </span>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground text-xs font-medium uppercase">
                {dict.drivers.pickupArea}
              </h3>
              <p className="text-sm">{job.pickup_area}</p>
              {job.pickup_floor !== null && job.pickup_floor > 0 && (
                <p className="text-muted-foreground text-xs">
                  {job.pickup_floor}. patro
                  {job.pickup_has_elevator ? ", výtah" : ", bez výtahu"}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium uppercase">
                {dict.drivers.destinationArea}
              </h3>
              <p className="text-sm">{job.destination_area}</p>
              {job.destination_floor !== null && job.destination_floor > 0 && (
                <p className="text-muted-foreground text-xs">
                  {job.destination_floor}. patro
                  {job.destination_has_elevator ? ", výtah" : ", bez výtahu"}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2 text-sm">
            {job.requested_vehicle_type && (
              <Badge variant="outline">
                {dict.orders.vehicleTypes[job.requested_vehicle_type]}
              </Badge>
            )}
            <Badge variant="outline">
              {dict.drivers.helpersLabel}:{" "}
              {dict.orders.assistanceLevels[job.assistance_level]}
            </Badge>
            {job.disassembly_required && <Badge variant="outline">Demontáž</Badge>}
            {job.assembly_required && <Badge variant="outline">Montáž</Badge>}
            {job.photo_count > 0 && (
              <Badge variant="outline">
                {job.photo_count} {dict.drivers.photosLabel}
              </Badge>
            )}
          </div>

          <AcceptJobButton orderId={job.order_id} />
        </CardContent>
      </Card>
    </div>
  );
}
