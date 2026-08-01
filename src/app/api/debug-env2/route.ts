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

// Per-character fingerprint at fixed positions (index -> expected char
// code) — computed offline from the real key, never the key itself, so
// this can't be used to reconstruct the secret. Lets us see WHERE a
// mismatched runtime value diverges.
const REAL_ANON_KEY_CHAR_FINGERPRINT = [
  { i: 0, code: 101 },
  { i: 5, code: 71 },
  { i: 8, code: 79 },
  { i: 10, code: 74 },
  { i: 15, code: 49 },
  { i: 20, code: 73 },
  { i: 30, code: 112 },
  { i: 40, code: 112 },
  { i: 50, code: 88 },
  { i: 60, code: 115 },
  { i: 70, code: 110 },
  { i: 80, code: 112 },
  { i: 90, code: 72 },
  { i: 100, code: 105 },
  { i: 120, code: 112 },
  { i: 140, code: 115 },
  { i: 160, code: 122 },
  { i: 180, code: 102 },
  { i: 200, code: 117 },
  { i: 205, code: 101 },
  { i: 207, code: 99 },
];

export async function GET() {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hash = createHash("sha256").update(anon).digest("hex");

  const fingerprint = REAL_ANON_KEY_CHAR_FINGERPRINT.map(({ i, code }) => ({
    i,
    matches: anon.charCodeAt(i) === code,
  }));

  return NextResponse.json({
    anonKeyLength: anon.length,
    anonKeyHash: hash,
    matches: hash === REAL_ANON_KEY_SHA256,
    fingerprint,
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
