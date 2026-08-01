import "server-only";
import { NextResponse } from "next/server";

// Temporary diagnostic route — deployed to check why production auth was
// failing despite the exact same credentials working outside Vercel.
// Never exposes secret values, only lengths/prefixes, and only for the two
// vars that are inherently public anyway (URL, anon key) plus a presence
// check for the service role key. Remove once the mismatch is found.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return NextResponse.json({
    url,
    anonKeyLength: anon.length,
    anonKeyStart: anon.slice(0, 25),
    anonKeyEnd: anon.slice(-15),
    anonKeyHasWhitespace: /\s/.test(anon),
    serviceKeyLength: service.length,
    serviceKeyPresent: service.length > 0,
    serviceKeyHasWhitespace: /\s/.test(service),
  });
}
