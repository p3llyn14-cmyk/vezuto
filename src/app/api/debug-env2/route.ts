import "server-only";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// Temporary — compares process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY against a
// known SHA-256 hash instead of a literal value, so the real secret is
// never present in source code (the previous version of this diagnostic
// hardcoded the plaintext key, which likely triggered Vercel's leaked-
// secret redaction once it was also visible in the public GitHub repo).
const REAL_ANON_KEY_SHA256 =
  "f50d7a4a7ab3309844419b228829b5df4eeef8722e1522d6dc0b8345faea3d66";

export async function GET() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hash = createHash("sha256").update(anon).digest("hex");

  return NextResponse.json({
    anonKeyLength: anon.length,
    anonKeyHash: hash,
    matches: hash === REAL_ANON_KEY_SHA256,
  });
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const { email, password } = await req.json();

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  return NextResponse.json({
    hasSession: !!data?.session,
    errorMessage: error?.message ?? null,
  });
}
