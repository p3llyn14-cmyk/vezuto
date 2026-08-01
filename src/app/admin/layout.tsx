import Link from "next/link";
import { getDictionary } from "@/i18n";
import { requireAdminProfile } from "@/modules/auth/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminProfile("/admin");
  const dict = getDictionary().admin;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex gap-5 border-b pb-4 text-sm">
        <Link href="/admin" className="hover:text-primary font-medium">
          {dict.dashboardTitle}
        </Link>
        <Link href="/admin/objednavky" className="hover:text-primary font-medium">
          {dict.ordersNav}
        </Link>
        <Link href="/admin/ridici" className="hover:text-primary font-medium">
          {dict.driversNav}
        </Link>
      </nav>
      {children}
    </div>
  );
}
