import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/i18n";
import { formatCzk, formatDateTime } from "@/lib/format";
import { AdminOrderActions } from "@/modules/admin/components/admin-order-actions";
import { requireProfile } from "@/modules/auth/queries";
import { OrderChat } from "@/modules/chat/components/order-chat";
import { getMessages } from "@/modules/chat/queries";
import { DriverOrderActions } from "@/modules/drivers/components/driver-order-actions";
import {
  getOrderPhotoUrls,
  getOrderStatusHistory,
  getOrderWithLocations,
  getParticipantNames,
} from "@/modules/orders/queries";
import { getOrderStatusBadgeVariant } from "@/modules/orders/status-badge";
import { PayButton } from "@/modules/payments/components/pay-button";
import { CustomerDeliverySection } from "@/modules/reviews/components/customer-delivery-section";
import { getRatingForOrder } from "@/modules/reviews/queries";

const DRIVER_ACTIONABLE_STATUSES = new Set([
  "driver_assigned",
  "driver_on_the_way",
  "arrived_at_pickup",
  "item_picked_up",
  "in_transit",
  "arrived_at_destination",
]);

export const metadata: Metadata = { title: "Detail objednávky — VezuTo" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ platba?: string }>;
}) {
  const { id } = await params;
  const { platba } = await searchParams;
  const profile = await requireProfile(`/objednavky/${id}`);
  const dict = getDictionary();

  const result = await getOrderWithLocations(id);
  if (!result) notFound();
  const { order, locations } = result;

  const isOwner = order.customer_profile_id === profile.id;
  const isAssignedDriver = order.assigned_driver_profile_id === profile.id;
  if (!isOwner && !isAssignedDriver && profile.role !== "admin") notFound();

  const [history, photoUrls, messages, participantNames, existingRating] =
    await Promise.all([
      getOrderStatusHistory(order.id),
      getOrderPhotoUrls(order.id),
      getMessages(order.id),
      getParticipantNames(order),
      isOwner ? getRatingForOrder(order.id) : Promise.resolve(null),
    ]);

  const pickup = locations.find((l) => l.location_type === "pickup");
  const destination = locations.find((l) => l.location_type === "destination");
  const breakdown = order.pricing_breakdown as Record<string, number> | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{order.item_title}</CardTitle>
            <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
              {order.public_code}
            </p>
          </div>
          <Badge variant={getOrderStatusBadgeVariant(order.status)}>
            {dict.orders.statusLabels[order.status] ?? order.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.item_description && (
            <p className="text-muted-foreground text-sm">{order.item_description}</p>
          )}

          {photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover"
                />
              ))}
            </div>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <LocationBlock title={dict.orders.steps.pickupTitle} location={pickup} />
            <LocationBlock
              title={dict.orders.steps.destinationTitle}
              location={destination}
            />
          </div>

          {order.customer_price_czk !== null && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  {dict.orders.steps.recap.priceBreakdown}
                </h3>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>{dict.orders.steps.recap.total}</span>
                  <span className="font-mono tabular-nums">
                    {formatCzk(order.customer_price_czk)}
                  </span>
                </div>
                {breakdown?.minimumApplied && (
                  <p className="text-muted-foreground text-xs">
                    {dict.orders.steps.recap.minimumNote}
                  </p>
                )}
              </div>

              {isOwner && (
                <div className="space-y-2">
                  {platba === "uspech" && (
                    <p className="text-sm text-green-700">{dict.payments.success}</p>
                  )}
                  {platba === "zruseno" && (
                    <p className="text-destructive text-sm">{dict.payments.cancelled}</p>
                  )}
                  {order.payment_status === "paid" ? (
                    <Badge variant="secondary">{dict.payments.paid}</Badge>
                  ) : order.payment_status === "refunded" ? (
                    <Badge variant="secondary">{dict.payments.refunded}</Badge>
                  ) : (
                    <PayButton orderId={order.id} label={dict.payments.payNow} />
                  )}
                </div>
              )}
            </>
          )}

          {isAssignedDriver && DRIVER_ACTIONABLE_STATUSES.has(order.status) && (
            <>
              <Separator />
              <DriverOrderActions orderId={order.id} status={order.status} />
            </>
          )}

          {profile.role === "admin" && (
            <>
              <Separator />
              <AdminOrderActions
                orderId={order.id}
                currentPriceCzk={order.customer_price_czk}
              />
            </>
          )}

          {isOwner && (order.status === "delivered" || order.status === "completed") && (
            <>
              <Separator />
              <CustomerDeliverySection order={order} existingRating={existingRating} />
            </>
          )}

          {order.status !== "draft" &&
            (isOwner || isAssignedDriver || profile.role === "admin") && (
              <>
                <Separator />
                <OrderChat
                  orderId={order.id}
                  messages={messages}
                  currentProfileId={profile.id}
                  participantNames={participantNames}
                />
              </>
            )}

          {history.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Historie</h3>
                <ul className="space-y-1.5 text-sm">
                  {history.map((h) => (
                    <li key={h.id} className="text-muted-foreground flex justify-between">
                      <span>
                        {dict.orders.statusLabels[h.new_status] ?? h.new_status}
                      </span>
                      <span className="font-mono text-xs tabular-nums">
                        {formatDateTime(h.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LocationBlock({
  title,
  location,
}: {
  title: string;
  location:
    | { full_address: string; floor: number | null; has_elevator: boolean | null }
    | undefined;
}) {
  if (!location) return null;
  return (
    <div>
      <h3 className="text-muted-foreground text-xs font-medium uppercase">{title}</h3>
      <p className="text-sm">{location.full_address}</p>
      {location.floor !== null && location.floor > 0 && (
        <p className="text-muted-foreground text-xs">
          {location.floor}. patro{location.has_elevator ? ", výtah" : ", bez výtahu"}
        </p>
      )}
    </div>
  );
}
