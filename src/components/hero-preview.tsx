import { Badge } from "@/components/ui/badge";

/**
 * Decorative phone-mockup illustration for the marketing hero — no image
 * assets exist for this pilot, so the "preview" is built from real UI
 * primitives instead, echoing what the actual order-tracking screen looks
 * like rather than a generic stock illustration.
 */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div
        aria-hidden
        className="bg-primary/25 absolute -top-10 -right-6 h-56 w-56 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-accent absolute -bottom-8 -left-8 h-48 w-48 rounded-full blur-3xl"
      />
      <div className="border-foreground/10 bg-background relative rounded-[2.25rem] border-8 shadow-2xl">
        <div className="bg-primary text-primary-foreground rounded-t-[1.6rem] px-5 pt-7 pb-6">
          <p className="text-xs opacity-80">Dobrý den, Petro</p>
          <p className="mt-1 text-lg font-medium">Kam to dnes poveze?</p>
        </div>
        <div className="space-y-2.5 p-3.5">
          <div className="rounded-2xl border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Rohová sedačka</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Vinohrady → Smíchov
                </p>
              </div>
              <Badge className="shrink-0">Na cestě</Badge>
            </div>
            <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5">
              <div className="bg-accent text-accent-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                TN
              </div>
              <p className="text-muted-foreground text-xs">Tomáš přijede za 8 min</p>
            </div>
          </div>
          <div className="rounded-2xl border p-3 opacity-60">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Pračka</p>
                <p className="text-muted-foreground mt-0.5 text-xs">Žižkov → Vršovice</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                Hledá řidiče
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
