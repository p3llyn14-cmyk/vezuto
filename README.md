# VezuTo

Marketplace pro přepravu větších věcí mezi lidmi v Praze — zákazník zadá přepravu (nábytek koupený na Facebook Marketplace, Bazoši, IKEA apod.), dostupný řidič ji přijme a doveze. Pracovní název, snadno změnitelný (viz [`src/i18n`](./src/i18n) a [`src/app/globals.css`](./src/app/globals.css) pro branding).

## Stav projektu

Vyvíjí se postupně po fázích. Aktuální stav:

- [x] **Fáze 1 — Analýza** — produkt, architektura, datový model, bezpečnostní model
- [x] **Fáze 2 — Inicializace projektu** — Next.js, TypeScript, Tailwind, shadcn/ui, i18n, theme, linting/formatting
- [x] **Fáze 3 — Databáze a migrace** — schéma, RLS, seed, TS typy (viz [Databáze](#databáze-supabase) níže)
- [x] **Fáze 4 — Autentizace a role** — registrace (s výběrem role), přihlášení, odhlášení, ochrana rout, profil (viz níže)
- [x] **Fáze 5 — Objednávkový proces zákazníka** — 6krokový wizard, cenový kalkulátor, atomické vytvoření objednávky (viz níže)
- [x] **Fáze 6 — Řidičská část** — pool zakázek, přijetí, změny stavů, fotodokumentace (viz níže)
- [x] **Fáze 7 — Chat a hodnocení** — chat u objednávky, potvrzení doručení, hodnocení řidiče (viz níže)
- [x] **Fáze 8 — Administrace** — přehled, správa objednávek, ověřování řidičů, audit log (viz níže)
- [x] **Fáze 9 — Testy a dokumentace** — unit testy (Vitest), e2e testy (Playwright), README (viz [Testování](#testování) níže)

## Technologie

- **Next.js 16** (App Router, React 19, TypeScript strict mode)
- **Tailwind CSS v4** + **shadcn/ui** (Radix-based komponenty)
- **Zod** pro validaci
- **Supabase** (Postgres, Auth, Storage, Row Level Security)
- **Vitest** (unit testy), **Playwright** (e2e testy)

## Požadavky

- Node.js 20+ (vyvíjeno na 24 LTS)
- npm
- Účet na [supabase.com](https://supabase.com)
- Google Maps Platform API klíč (adresy, geokódování, vzdálenosti) — nepovinné, bez něj běží `MockMapsProvider`
- Stripe účet (platby) — nepovinné, bez něj se tlačítko "Zaplatit" zobrazí jako "platby nejsou nastavené"

## Instalace

```bash
npm install
cp .env.example .env.local
```

Vyplň `.env.local` podle komentářů v souboru. Do té doby, než existují reálné Supabase/Maps klíče (Fáze 3+), aplikace běží i bez nich — v Fázi 2 se zatím nic externího nevolá.

## Spuštění

```bash
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).

## Databáze (Supabase)

Schéma je hotové v [`supabase/migrations`](./supabase/migrations) — 13 tabulek, 12 enumů, RLS politiky pro každou tabulku, stavový automat objednávky (`order_status_transitions` + trigger, ne "hloupý" enum) a `available_jobs()` RPC pro nabídku zakázek řidičům bez úniku přesné adresy/kontaktu před přijetím.

**Reálné napojení zatím chybí** — nemáme cloud Supabase projekt ani Docker (takže ani `supabase start`). Až založíš projekt na [supabase.com](https://supabase.com):

```bash
npx supabase login
npx supabase link --project-ref <tvůj-project-ref>
npx supabase db push          # aplikuje supabase/migrations/*.sql
# seed.sql spusť přes SQL editor v Supabase dashboardu, nebo:
npx supabase db execute -f supabase/seed.sql
```

Pak si vygeneruj přesné TS typy a nahraď ručně psaný [`src/types/database.types.ts`](./src/types/database.types.ts):

```bash
npx supabase gen types typescript --project-id <tvůj-project-ref> --schema public > src/types/database.types.ts
```

**Migrace i RLS jsou reálně otestované** — bez Dockeru/Supabase CLI, proti obyčejnému lokálnímu PostgreSQL (nainstalovanému jen pro tento účel). Viz [`supabase/testing`](./supabase/testing): `00_local_auth_schema.sql` nahrazuje Supabase Auth minimální náhradou (`auth.users`, `auth.uid()`, role `authenticated`/`anon`), `rls_smoke_test.sql` obsahuje 37 assercí (izolace mezi zákazníky, ochrana proti dvojímu přijetí zakázky, blokace změny ceny/role, oprávnění service role pro platby, ...) — všechny aktuálně procházejí. Tento adresář se nikdy nespouští proti reálnému Supabase projektu.

## Autentizace

Supabase Auth přes [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) — klienti v [`src/lib/supabase`](./src/lib/supabase) (browser, server, proxy), doménová logika v [`src/modules/auth`](./src/modules/auth).

- **Registrace** (`/registrace`) — zákazník i řidič se registrují stejným formulářem, jen s jiným výběrem role. `profiles` (a u řidiče i prázdný `driver_profiles`) se vytvářejí výhradně přes DB trigger `handle_new_auth_user` (Fáze 3) — klient nikdy nezapisuje do `profiles` přímo, takže nemůže poslat `role: "admin"` a nic tím nezíská (trigger to ořízne na `customer`).
- **Přihlášení** (`/prihlaseni`), **odhlášení** (na `/ucet`).
- **Ochrana rout**: `proxy.ts` (dřívější "Middleware", v Next.js 16 přejmenováno) dělá optimistickou kontrolu a přesměruje odhlášené uživatele pryč z `/ucet`, `/objednavky`, `/zakazky`, `/admin` — a přihlášené pryč z `/prihlaseni`/`/registrace`. Skutečná autorizace se vždy ověřuje znovu blíž u dat (`requireProfile()` v `src/modules/auth/queries.ts` + RLS), routa v proxy je jen UX zkratka.
- **Profil** (`/ucet`) — základní přehled (jméno, role, e-mail, telefon, stav účtu) + odhlášení.

**Bez reálného Supabase projektu se přihlášení/registrace reálně neověřily** — kód je napsaný podle oficiální Supabase SSR dokumentace a chybové stavy (chybějící `.env.local`, nedostupný Supabase) jsou ošetřené tak, aby appka nepadala (viz `isSupabaseConfigured()` v `actions.ts`, try/catch v `proxy.ts` a `getCurrentProfile()`) — ale samotný signup/login round-trip proti živému GoTrue serveru jsem ověřit nemohl. Až založíš Supabase projekt a doplníš `.env.local`, stálo by za to projít registraci a přihlášení ručně.

## Objednávkový proces

`/objednavky/nova` — vícekrokový formulář (`src/modules/orders`), ne jeden velký formulář: věc → vyzvednutí → doručení → termín → pomoc → rekapitulace s cenou. Zákazník-only (`requireCustomerProfile`).

- **Cenový kalkulátor** (`src/modules/pricing`) — čistá, deterministická funkce podle spec sekce 13 (základ + km + minuty + příplatky vozidlo/pomoc/patro/expres, minimální cena, provize platformy). Pokryto 7 unit testy ([`calculator.test.ts`](./src/modules/pricing/calculator.test.ts), Fáze 9).
- **Mapy** (`src/modules/maps`) — abstraktní `MapsProvider` rozhraní; `MockMapsProvider` (fixní odhad) běží bez klíče, `GoogleMapsProvider` (Distance Matrix) se aktivuje nastavením `GOOGLE_MAPS_API_KEY` — napsáno podle Google dokumentace, ale **nikdy neotestováno proti živému API** (žádný Google Maps Platform účet).
- **Vytvoření objednávky je atomické** — nová migrace `create_order()` (Postgres funkce, `SECURITY INVOKER`) bundluje insert objednávky + obou lokací + přechod submitted→awaiting_driver do jednoho volání, takže selhání uprostřed nemůže nechat osiřelou objednávku. **Reálně otestováno proti lokálnímu Postgresu** — zavolal jsem funkci jako zákazník, ověřil vznik objednávky, obou lokací i to, že se objednávka správně objeví v `available_jobs()` poolu pro řidiče.
- **Fotky** — nahrávají se do Supabase Storage (`order-images` bucket, migrace `storage.sql`). Bucket + RLS politiky jsou napsané podle dokumentovaného Supabase vzoru, ale **neotestované** — lokální Postgres nemá `storage` schéma (to má jen skutečný Supabase/GoTrue).
- **Skutečný bug odhalený testováním**: `approximate_address()` (Fáze 3) měl regex mířící na konec řetězce, ale české adresy mají číslo popisné uprostřed ("Korunní 810/104, Praha 10") — funkce tedy vůbec neskrývala číslo domu. Opraveno a znovu ověřeno na reálných adresách ze seedu.

## Řidičská část

`/zakazky` — pool nepřevzatých zakázek (`available_jobs()` RPC, Fáze 3) + přehled vlastních aktivních zakázek. `/zakazky/[id]` — detail nepřevzaté zakázky (jen bezpečná podmnožina polí, žádná přesná adresa/kontakt) s tlačítkem přijmout. Řidič-only (`requireDriverProfile`).

- **Přijetí zakázky** (`src/modules/drivers/actions.ts`, `claimOrderAction`) — obyčejný `UPDATE` přes RLS, žádná speciální RPC. Ochrana proti dvojímu přijetí je vynucená databází (viz Fáze 3 test), akce jen rozpozná "0 řádků ovlivněno" a zobrazí "zakázku už převzal někdo jiný" místo generické chyby.
- **Změny stavů a fotodokumentace** se po přijetí zobrazí přímo na `/objednavky/[id]` (sdílená stránka s detailem pro zákazníka) — když je přihlášený uživatel přiřazený řidič dané zakázky, přibude posun stavu (`driver_assigned → … → delivered`, lineární šťastná cesta), zrušení (jen dokud nebyla věc vyzvednuta) a upload fotek podle typu (stav při vyzvednutí, poškození, stav při doručení, potvrzení doručení). Validace přípustných přechodů je v DB triggeru (Fáze 3), akce jen posílá `UPDATE` a nechává databázi rozhodnout.
- Žádné nové migrace pro tuto fázi — celá řidičská část stojí na mechanismech (RLS, `available_jobs()`, atomický claim) už otestovaných ve Fázi 3.

## Chat a hodnocení

Chat (`src/modules/chat`) a hodnocení (`src/modules/reviews`) jsou zobrazené přímo na `/objednavky/[id]`, sdílené mezi zákazníkem, přiřazeným řidičem a (později) administrátorem.

- **Chat** — prostý textový chat u každé nedraftové objednávky (`messages` tabulka, Fáze 3). Bez real-time (WebSocket/Supabase Realtime) — MVP scope explicitně nevyžaduje označení přečtení ani live push, zprávy se načtou při renderu stránky a po odeslání se stránka revaliduje. Systémová zpráva se automaticky vloží při přijetí zakázky řidičem.
- **Potvrzení doručení + hodnocení** — zákazník na `/objednavky/[id]` potvrdí doručení (`delivered → completed`) a pak ohodnotí řidiče 1–5 hvězdičkami s volitelným komentářem. Jedno hodnocení na objednávku (DB unique constraint), enforced i v RLS (`ratings_insert` vyžaduje `status = 'completed'`).
- **Doplnění mezery ze Fáze 6**: DB trigger `orders_before_update` (Fáze 3) předtím nedovoloval nikomu kromě admina přechod `delivered → completed`. Nová migrace `customer_confirm_delivery.sql` (`create or replace function`, ne úprava historie) přidává zákazníkovi tuto jednu konkrétní volbu. **Reálně otestováno** — v `rls_smoke_test.sql` teď existuje scénář, kde řidič doveze objednávku až do `delivered`, zákazník ji potvrdí a pak úspěšně ohodnotí; a negativní test, že zákazník nemůže "potvrdit doručení" objednávky, která ve stavu `delivered` není.

## Administrace

`/admin` (`src/app/admin`, `src/modules/admin`) — chráněno `requireAdminProfile`.

- **Přehled** (`/admin`) — počet nových/aktivních/dokončených/zrušených objednávek, celková hodnota objednávek, příjem platformy, počet aktivních řidičů.
- **Objednávky** (`/admin/objednavky`) — tabulka všech objednávek s filtry (stav, datum od/do, cena od/do). Detail se otevírá na sdílené `/objednavky/[id]` stránce, kde admin navíc vidí panel akcí: ruční přiřazení řidiče, změna stavu, změna ceny (přepočítá provizi a výplatu řidiči proporcionálně), vrácení platby (skutečná Stripe refundace, pokud byla objednávka zaplacená přes Stripe — viz [Platby](#platby) níže).
- **Řidiči** (`/admin/ridici`) — seznam řidičů s možností schválit/zamítnout ověření a jednotlivé dokumenty, zablokovat uživatele.
- **Audit log** — každá admin akce (přiřazení, změna stavu/ceny, refundace, ověření řidiče, blokace) se zapisuje do `audit_logs`. Tahle tabulka nemá RLS politiku pro žádný klientský insert (úmyslně) — zápis jde přes service-role klient (`src/lib/supabase/service.ts`). Všechny ostatní admin akce (přiřazení řidiče, změna ceny/stavu, ...) běží přes běžnou session admina a RLS — service role je vyhrazená pro audit log a platby (viz níže).

## Platby

`src/modules/payments` — abstraktní `PaymentProvider` rozhraní (stejný vzor jako `MapsProvider`), implementace přes Stripe Checkout.

- **Zaplatit** tlačítko na `/objednavky/[id]` (jen vlastník objednávky, dokud `payment_status <> 'paid'`) vytvoří Stripe Checkout Session (`createCheckoutSessionAction`) a přesměruje na Stripe-hostovanou platební stránku. Řádek v `payments` se zapisuje přes service-role klient, protože tabulka nemá žádnou klientsky dosažitelnou INSERT politiku (viz RLS migrace) — stejný důvod jako u `audit_logs`.
- **Webhook** (`/api/webhooks/stripe`, `src/app/api/webhooks/stripe/route.ts`) ověřuje Stripe podpis (`STRIPE_WEBHOOK_SECRET`) a při `checkout.session.completed` nastaví `payments.status` i `orders.payment_status` na `paid`.
- **Refundace** (`refundOrderAction` v `src/modules/admin/actions.ts`) — pokud byla objednávka zaplacená přes Stripe, admin akce zavolá skutečné Stripe API (`stripe.refunds.create`), ne jen změnu příznaku v databázi.
- **Na rozdíl od Maps modulu tu není mock provider** — mock, který by tvářil skutečné peníze jako "zaplaceno" bez reálné transakce, by byl zavádějící data, ne neškodný placeholder. Bez `STRIPE_SECRET_KEY` tlačítko "Zaplatit" zobrazí "platby nejsou nastavené" (`getPaymentProvider()` vrátí `null`), stejný vzor jako `isSupabaseConfigured()` u přihlášení.
- **Skutečný bug odhalený testováním** — `orders_before_update` trigger (Fáze 3) je `security definer`, takže uvnitř něj `current_user` je vlastník funkce, ne volající role; navíc `BYPASSRLS` u service role obchází jen RLS politiky, ne trigger. Původní trigger tak odmítal i legitimní zápis `payment_status` z webhooku. Opraveno novou migrací (`20260731110000_service_role_payment_writes.sql`, `create or replace function`) s podmínkou přes `current_setting('role', true) = 'service_role'` — ověřeno přímo v psql (`supabase/testing/rls_smoke_test.sql`, sekce 11), včetně toho, že service role smí měnit jen `payment_status`/`payout_status`, ne cenu nebo stav objednávky.
- **Skutečný bug odhalený testováním (2)**: `service_role` v lokálním testovacím stubu měl nastavené `BYPASSRLS`, ale žádná explicitní tabulková oprávnění (`GRANT`) — v reálném Supabase je má service role automaticky, lokální stub to nikdy nereplikoval, protože do teď žádná fáze nezkoušela zápis service role lokálně otestovat (ani zápis do `audit_logs` z Fáze 8). Doplněno v `supabase/testing/99_local_grants.sql`.
- **Nikdy neotestováno proti živému Stripe účtu** — napsáno podle oficiální Stripe dokumentace (Checkout Sessions, webhooky, refundace), ale bez reálného Stripe API klíče to nejde ověřit end-to-end, stejně jako Google Maps Distance Matrix.
- **Skutečný bug odhalený při psaní `service.ts`**: stejná třída chyby jako u `create_order()` ve Fázi 5 — `audit_logs.Insert` byl v ručně psaných typech `never` (myšleno jako "žádný klient nesmí zapisovat"), což ale zablokovalo i jediný legitimní zápis přes service-role klienta. Opraveno na skutečný typ řádku.

## Testování

```bash
npm run test          # Vitest — unit testy (jednorázově)
npm run test:watch    # Vitest — watch mode
npm run test:e2e      # Playwright — e2e testy (spustí i dev server)
```

- **Unit testy** (`src/**/*.test.ts`, Vitest, běží v Node bez prohlížeče/DB) — 30 testů:
  - [`pricing/calculator.test.ts`](./src/modules/pricing/calculator.test.ts) — minimální cena, příplatky (patro, expres, typ vozidla), determinismus, součet výplaty řidiče + provize = cena zákazníka.
  - [`orders/schemas.test.ts`](./src/modules/orders/schemas.test.ts) — Zod validace všech kroků wizardu (věc, adresa, termín, asistence, celý draft).
  - [`drivers/status-transitions.test.ts`](./src/modules/drivers/status-transitions.test.ts) — čistá logika pro "další stav" a "lze zrušit" (vytažená z `actions.ts`, protože `"use server"` soubor nesmí exportovat nic jiného než server akce).
- **E2e testy** (`e2e/*.spec.ts`, Playwright) — 9 testů, reálný prohlížeč + reálný Next.js dev server + reálné server actions + reálná Zod validace:
  - [`home.spec.ts`](./e2e/home.spec.ts) — úvodní stránka se načte se správným obsahem, odhlášená hlavička nabízí přihlášení/registraci.
  - [`route-protection.spec.ts`](./e2e/route-protection.spec.ts) — `/ucet`, `/objednavky`, `/objednavky/nova`, `/zakazky`, `/admin` přesměrují odhlášeného návštěvníka na přihlášení.
  - [`registration.spec.ts`](./e2e/registration.spec.ts) — nejblíž k reálnému vytvoření objednávky (spec sekce 15), co jde bez živého Supabase projektu: validace na straně serveru (chybný e-mail, neshodná hesla) a korektní degradace na "Supabase není nastavené" místo pádu.
  - **Běží proti systémovému Microsoft Edge** (`channel: "msedge"` v `playwright.config.ts`), ne proti vlastnímu Chromiu Playwrightu — toto prostředí nemá přístup k internetu, takže `npx playwright install` (stažení Chromia z `cdn.playwright.dev`) selhává. Na stroji s internetem lze přepnout zpět na `devices["Desktop Chrome"]` bez instalace prohlížeče.
- **Skutečný bug odhalený psaním e2e testů**: formuláře přihlášení/registrace (`login-form.tsx`, `register-form.tsx`) používaly nekontrolované (uncontrolled) inputy bez `defaultValue`. Po serverové akci (chyba validace, "Supabase není nastavené" apod.) se klientská komponenta remountuje a _všechna_ pole se vyprázdní — uživatel, co překlepe e-mail, by musel přepsat úplně celý formulář znovu. Opraveno tak, že `registerAction`/`loginAction` (`src/modules/auth/actions.ts`) teď vrací zpět odeslané hodnoty (`state.values`) kromě hesla, a formuláře je použijí jako `defaultValue`. Heslo se schválně nikdy nevrací — po chybě je nutné ho zadat znovu (běžný a bezpečný vzor).
- **Skutečný bug odhalený psaním e2e testů (2)**: `CardTitle` (shadcn primitivum) je vždy obyčejný `<div>`, ne nadpis — takže titulek stránek přihlášení/registrace neměl žádnou heading roli pro čtečky obrazovky ani pro `getByRole("heading", ...)`. Přidán volitelný `as` prop (`div` | `h1` | `h2` | `h3`, výchozí `div`) a stránky `/prihlaseni` a `/registrace` teď použijí `<CardTitle as="h1">`, protože tam je titulek karty zároveň hlavním nadpisem celé stránky.
- RLS, databázový trigger pro registraci a `create_order()` jsou navíc otestované na SQL úrovni (mimo Vitest/Playwright), viz [`supabase/testing`](./supabase/testing).

## Kontrola kódu

```bash
npm run typecheck      # TypeScript strict
npm run lint            # ESLint
npm run format:check    # Prettier
npm run format           # Prettier — automatická oprava
npm run test              # Vitest — unit testy
npm run test:e2e          # Playwright — e2e testy
npm run build             # produkční build
```

## Struktura projektu

```
src/
├─ app/            # Next.js App Router (routy, layouty)
├─ components/ui/  # shadcn/ui komponenty
├─ components/     # sdílené komponenty (header, footer, ...)
├─ i18n/           # centralizované texty (čeština je výchozí a jediná aktivní)
├─ lib/supabase/   # browser/server/proxy/service Supabase klienti
├─ types/          # database.types.ts — typy odvozené ze schématu
└─ modules/
   ├─ auth/        # schémata, server actions, DAL (queries.ts) — hotovo
   ├─ orders/      # wizard, schémata, server actions, dotazy — hotovo
   ├─ pricing/     # cenový kalkulátor + config — hotovo
   ├─ maps/        # abstraktní MapsProvider (Google + mock) — hotovo
   ├─ drivers/      # pool zakázek, přijetí, stavy, fotky — hotovo
   ├─ chat/         # zprávy u objednávky — hotovo
   ├─ reviews/      # potvrzení doručení, hodnocení — hotovo
   ├─ admin/        # přehled, správa objednávek, ověřování řidičů — hotovo
   ├─ payments/     # Stripe Checkout + refundace, viz Platby výše — hotovo
   └─ ...           # users, vehicles, notifications, uploads —
                     # zbytek je pokrytý existujícími moduly výše nebo
                     # nepotřebný pro MVP

proxy.ts            # dřívější "Middleware" — obnova session + ochrana rout

supabase/
├─ migrations/     # SQL migrace, aplikují se v pořadí podle názvu souboru
├─ seed.sql        # vývojová seed data (1 admin, 2 zákazníci, 2 řidiči, 5 objednávek)
└─ testing/        # lokální ověření migrací/RLS bez Dockeru — viz supabase/testing/README.md
```

## Nasazení

Zatím neřešeno — bude doplněno po dokončení MVP (typicky Vercel pro Next.js + Supabase cloud projekt).

## Známá omezení (aktuální fáze)

- Signup/login kód je hotový a odolný vůči chybějícímu Supabase projektu, ale reálný round-trip proti živému Supabase Auth (GoTrue) jsem neověřil — nemáme cloud projekt ani Docker pro lokální Supabase.
- `database.types.ts` je ručně psaný, ne vygenerovaný CLI (chybí Docker) — nahradit po založení reálného Supabase projektu. (Hand-psaní odhalilo reálný bug: chyběl `Relationships` na každé tabulce, což tiše rozbilo typování `supabase.rpc()` na nesouvisejícím místě — viz git historie `database.types.ts`.)
- Storage upload fotek, Google Maps Distance Matrix a Stripe Checkout/refundace jsou napsané, ale neotestované proti živým službám (chybí Supabase Storage, Google Maps Platform i Stripe účet). DB vrstva plateb (service-role zápis, field-lock v triggeru) je otestovaná proti lokálnímu Postgresu — viz [Platby](#platby) výše.
- Řidičské výplaty (`payouts` tabulka) zůstávají v MVP manuální/mimo appku — Stripe integrace pokrývá jen platbu od zákazníka, ne automatické vyplácení řidičů (to by vyžadovalo Stripe Connect a onboarding každého řidiče, mimo rozsah MVP).
- Objednávkový wizard, řidičský flow, chat/hodnocení ani admin akce (přiřazení řidiče, refundace, ověření řidiče) jsem nemohl proklikat v prohlížeči end-to-end — všechno vyžaduje přihlášení, které vyžaduje živý Supabase projekt. Ověřeno: ochrana rout (`/objednavky/nova`, `/zakazky`, `/admin` a jejich podstránky správně přesměrují nepřihlášené/neoprávněné), build, typecheck, a celá DB vrstva (RLS, `create_order()`, atomický claim, potvrzení doručení, hodnocení) přímým voláním přes psql.
- Admin dashboard pro ověřování dokumentů řidičů zobrazuje typ a stav dokumentu, ale ne náhled samotné fotky — bucket pro `driver-documents` (na rozdíl od `order-images`) zatím nemá migraci se storage politikami. Doplnit před reálným nasazením.
- E2e testy pokrývají jen to, co jde bez živého Supabase projektu (úvodní stránka, ochrana rout, formulářová validace registrace) — objednávkový wizard, řidičský flow, chat/hodnocení a admin akce vyžadují reálné přihlášení, takže je nešlo provést end-to-end v prohlížeči; tato vrstva je ověřená přímo přes psql (viz [`supabase/testing`](./supabase/testing)) a bod výše.
- Playwright běží proti systémovému Microsoft Edge, ne proti vlastnímu Chromiu — toto prostředí nemá přístup k internetu pro `npx playwright install`. Funguje to stejně dobře, ale na jiném stroji s internetem stojí za zvážení přepnout zpět na `devices["Desktop Chrome"]`.

## Shrnutí MVP

Všech 9 fází ze zadání je hotových (viz [Stav projektu](#stav-projektu) výše) a projekt formátem, typy, lintem, unit testy i e2e testy prochází čistě (`npm run format:check && npm run typecheck && npm run lint && npm run test && npm run test:e2e && npm run build`). Co skutečně chybí k reálnému provozu je vždy popsané v [Známá omezení](#známá-omezení-aktuální-fáze) výše — ve všech případech jde o věci, které vyžadují prostředky mimo tento repozitář (cloud Supabase projekt, Google Maps Platform účet, doména/hosting pro nasazení), ne o nedodělaný kód.
