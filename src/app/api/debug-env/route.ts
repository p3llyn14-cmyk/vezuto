import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Temporary diagnostic route — deployed to check why production auth was
// failing despite the exact same credentials working outside Vercel.
// Never exposes secret values, only lengths/prefixes, and only for the two
// vars that are inherently public anyway (URL, anon key) plus a presence
// check for the service role key. Remove once the mismatch is found.
const REAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXhiZXBpdWtqY2JwaHZyeHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1ODQ5MzMsImV4cCI6MjEwMTE2MDkzM30.eqdpYBA3LPyM-ECfJfmsbFpPFdA4bXv_0Rzu4gJqe-c";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // Boolean-only comparison — no secret substring anywhere in this response
  // body, so if Vercel is redacting on output-content-match, this proves it
  // either way: matchesRealValue tells us if process.env is genuinely
  // correct at rest, independent of whatever happens when it's echoed.
  return NextResponse.json({
    url,
    anonKeyLength: anon.length,
    anonKeyMatchesRealValue: anon === REAL_ANON_KEY,
    anonKeyHasWhitespace: /\s/.test(anon),
    serviceKeyLength: service.length,
    serviceKeyPresent: service.length > 0,
    serviceKeyHasWhitespace: /\s/.test(service),
  });
}

// Temporary — mirrors exactly what loginAction does, but returns the real
// Supabase error instead of the app's generic "wrong email or password"
// message that was swallowing whatever the actual cause is.
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const { email, password } = await req.json();

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  return NextResponse.json({
    hasSession: !!data?.session,
    errorMessage: error?.message ?? null,
    errorStatus: error?.status ?? null,
    errorCode: (error as { code?: string } | null)?.code ?? null,
  });
}
