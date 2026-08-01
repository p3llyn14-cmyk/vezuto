import { getDictionary } from "@/i18n";

export function SiteFooter() {
  const dict = getDictionary();
  const year = new Date().getFullYear();

  return (
    <footer className="text-muted-foreground border-t py-8 text-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 sm:px-6">
        <p>
          {dict.brand.name} · {dict.footer.praguePilot}
        </p>
        <p>
          © {year} {dict.brand.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
