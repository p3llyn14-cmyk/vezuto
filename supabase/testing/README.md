# Lokální testování migrací a RLS

Tento adresář **není** součástí Supabase migrací a nikdy by neměl běžet proti
reálnému Supabase projektu — `00_local_auth_schema.sql` si vytváří vlastní
zjednodušené `auth` schéma, které by kolidovalo se skutečným Supabase Auth.

Existuje jen proto, aby šlo ověřit `../migrations/*.sql` a `../seed.sql` proti
obyčejnému lokálnímu PostgreSQL, bez Dockeru / Supabase CLI.

## Použití

Pořadí je důležité: `auth.users` musí existovat před migrací `profiles`
(cizí klíč), ale GRANTy pro roli `authenticated` musí běžet až po všech
migracích (až tabulky existují).

```bash
# 1. Vytvoř čistou testovací databázi
psql -U postgres -c "drop database if exists vezuto_rls_test;"
psql -U postgres -c "create database vezuto_rls_test;"

# 2. auth schéma → migrace → granty → seed → testy, přesně v tomto pořadí
psql -U postgres -d vezuto_rls_test -v ON_ERROR_STOP=1 -f 00_local_auth_schema.sql
for f in ../migrations/*.sql; do psql -U postgres -d vezuto_rls_test -v ON_ERROR_STOP=1 -f "$f"; done
psql -U postgres -d vezuto_rls_test -v ON_ERROR_STOP=1 -f 99_local_grants.sql
psql -U postgres -d vezuto_rls_test -v ON_ERROR_STOP=1 -f ../seed.sql
psql -U postgres -d vezuto_rls_test -v ON_ERROR_STOP=1 -f rls_smoke_test.sql
```

`rls_smoke_test.sql` vypisuje `NOTICE: OK — ...` pro každý úspěšný test a
vyhodí `EXCEPTION` (skript skončí chybou) při prvním selhání.
