import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDictionary } from "@/i18n";
import { formatCzk, formatDate } from "@/lib/format";
import { listOrdersForAdmin } from "@/modules/admin/queries";
import type { Database } from "@/types/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const metadata: Metadata = { title: "Admin — objednávky — VezuTo" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const dict = getDictionary();
  const params = await searchParams;

  const orders = await listOrdersForAdmin({
    status: (params.status as OrderStatus) || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.ordersTitle}</h1>

      <Card>
        <CardContent className="pt-6">
          <form className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs">
                {dict.admin.filters.status}
              </Label>
              <Select name="status" defaultValue={params.status ?? "all"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.admin.filters.allStatuses}</SelectItem>
                  {Object.entries(dict.orders.statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-xs">
                {dict.admin.filters.dateFrom}
              </Label>
              <Input
                id="dateFrom"
                type="date"
                name="dateFrom"
                defaultValue={params.dateFrom}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-xs">
                {dict.admin.filters.dateTo}
              </Label>
              <Input id="dateTo" type="date" name="dateTo" defaultValue={params.dateTo} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="minPrice" className="text-xs">
                {dict.admin.filters.minPrice}
              </Label>
              <Input
                id="minPrice"
                type="number"
                name="minPrice"
                defaultValue={params.minPrice}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxPrice" className="text-xs">
                {dict.admin.filters.maxPrice}
              </Label>
              <Input
                id="maxPrice"
                type="number"
                name="maxPrice"
                defaultValue={params.maxPrice}
              />
            </div>
            <Button type="submit" size="sm" className="col-span-2 sm:col-span-1">
              {dict.admin.filters.apply}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {orders.map((order) => (
          <Link key={order.id} href={`/objednavky/${order.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
                <div>
                  <CardTitle className="text-sm">{order.item_title}</CardTitle>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs tabular-nums">
                    {order.public_code} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">
                    {order.customer_price_czk !== null
                      ? formatCzk(order.customer_price_czk)
                      : "—"}
                  </span>
                  <Badge variant="secondary">
                    {dict.orders.statusLabels[order.status] ?? order.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Žádné objednávky.
          </p>
        )}
      </div>
    </div>
  );
}
