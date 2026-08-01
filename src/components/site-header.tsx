import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { getCurrentProfile } from "@/modules/auth/queries";

export async function SiteHeader() {
  const dict = getDictionary();
  const profile = await getCurrentProfile();

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="bg-primary inline-block h-2.5 w-2.5 rounded-full"
          />
          {dict.brand.name}
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-6 text-sm sm:flex">
          <Link href="#jak-to-funguje" className="hover:text-foreground">
            {dict.nav.howItWorks}
          </Link>
          <Link href="#pro-ridice" className="hover:text-foreground">
            {dict.nav.forDrivers}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === "driver" && (
                <Button
                  render={<Link href="/zakazky" />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  {dict.drivers.availableJobsTitle}
                </Button>
              )}
              {profile.role === "admin" && (
                <Button
                  render={<Link href="/admin" />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Admin
                </Button>
              )}
              <Button render={<Link href="/ucet" />} nativeButton={false} size="sm">
                {profile.first_name}
              </Button>
            </>
          ) : (
            <>
              <Button
                render={<Link href="/prihlaseni" />}
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                {dict.nav.login}
              </Button>
              <Button render={<Link href="/registrace" />} nativeButton={false} size="sm">
                {dict.nav.register}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
