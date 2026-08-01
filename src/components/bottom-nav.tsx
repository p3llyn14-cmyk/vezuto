"use client";

import { Home, Package, PlusCircle, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CUSTOMER_ITEMS = [
  { href: "/ucet", label: "Účet", icon: Home },
  { href: "/objednavky", label: "Objednávky", icon: Package },
  { href: "/objednavky/nova", label: "Nová", icon: PlusCircle },
];

const DRIVER_ITEMS = [
  { href: "/ucet", label: "Účet", icon: Home },
  { href: "/zakazky", label: "Zakázky", icon: Truck },
];

export function BottomNav({ role }: { role: "customer" | "driver" }) {
  const pathname = usePathname();
  const items = role === "customer" ? CUSTOMER_ITEMS : DRIVER_ITEMS;

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
