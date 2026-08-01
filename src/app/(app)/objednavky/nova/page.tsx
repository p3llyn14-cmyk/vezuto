import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { requireCustomerProfile } from "@/modules/auth/queries";
import { OrderWizard } from "@/modules/orders/components/order-wizard";

export const metadata: Metadata = { title: "Nová přeprava — VezuTo" };

export default async function NewOrderPage() {
  await requireCustomerProfile("/objednavky/nova");
  const dict = getDictionary();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{dict.orders.newOrderTitle}</CardTitle>
          <CardDescription>{dict.home.heroSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderWizard />
        </CardContent>
      </Card>
    </div>
  );
}
