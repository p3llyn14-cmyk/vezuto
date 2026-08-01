import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { getCurrentProfile } from "@/modules/auth/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      {profile && (profile.role === "customer" || profile.role === "driver") && (
        <BottomNav role={profile.role} />
      )}
    </>
  );
}
