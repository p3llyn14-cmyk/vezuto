import {
  Archive,
  Briefcase,
  Dumbbell,
  MapPin,
  Package,
  Refrigerator,
  Sofa,
  Truck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { HeroPreview } from "@/components/hero-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { getCurrentProfile } from "@/modules/auth/queries";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sofa: Sofa,
  wardrobe: Archive,
  appliance: Refrigerator,
  furniture: Package,
  washingMachine: Refrigerator,
  gym: Dumbbell,
  office: Briefcase,
  other: Package,
};

const STEP_ICONS = [MapPin, Truck, UserCheck];

export default async function Home() {
  const dict = getDictionary();
  const profile = await getCurrentProfile();
  const primaryCtaHref =
    profile?.role === "customer" ? "/objednavky/nova" : "/registrace";
  const categories = Object.entries(dict.home.categories);
  const steps = [
    dict.home.steps.step1Title,
    dict.home.steps.step2Title,
    dict.home.steps.step3Title,
  ].map((title, i) => ({
    title,
    body: [
      dict.home.steps.step1Body,
      dict.home.steps.step2Body,
      dict.home.steps.step3Body,
    ][i],
  }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5">
              {dict.footer.praguePilot}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href={primaryCtaHref} />}
                nativeButton={false}
                size="lg"
                className="h-12 px-6 text-base"
              >
                {dict.home.ctaPrimary}
              </Button>
              <Button
                render={<Link href="/registrace?role=driver" />}
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base"
              >
                {dict.home.ctaSecondary}
              </Button>
            </div>
            <p className="text-muted-foreground mt-5 text-sm">{dict.home.trustNote}</p>
          </div>
          <div className="hidden lg:block">
            <HeroPreview />
          </div>
        </section>

        <section className="bg-muted/30 border-t py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {dict.home.categoriesTitle}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map(([key, label]) => {
                const Icon = CATEGORY_ICONS[key] ?? Package;
                return (
                  <span
                    key={key}
                    className="bg-background inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm shadow-sm"
                  >
                    <Icon className="text-primary h-4 w-4" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section id="jak-to-funguje" className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              {dict.home.howItWorksTitle}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? MapPin;
                return (
                  <Card key={step.title} className="border-border/70">
                    <CardHeader>
                      <div className="bg-primary text-primary-foreground mb-1 flex h-11 w-11 items-center justify-center rounded-full">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {step.body}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pro-ridice" className="border-t py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              {dict.home.forWhomTitle}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{dict.home.forCustomer.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {dict.home.forCustomer.body}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    render={<Link href={primaryCtaHref} />}
                    nativeButton={false}
                    variant="outline"
                  >
                    {dict.nav.newOrder}
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{dict.home.forDriver.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {dict.home.forDriver.body}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    render={<Link href="/registrace?role=driver" />}
                    nativeButton={false}
                    variant="outline"
                  >
                    {dict.home.ctaSecondary}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
