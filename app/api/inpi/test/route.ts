import { NextResponse } from "next/server";

export async function GET() {
  const username = process.env.INPI_USERNAME;
  const password = process.env.INPI_PASSWORD;

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "Variables INPI_USERNAME / INPI_PASSWORD manquantes" }, { status: 500 });
  }

  try {
    const res = await fetch("https://guichet-unique.inpi.fr/api/user/login/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }

    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, body }, { status: 200 });
    }

    // Masquer le token dans la réponse, juste confirmer qu'il existe
    const data = body as Record<string, unknown>;
    const hasToken = !!(data?.token || data?.access_token || data?.jwt);
    return NextResponse.json({ ok: true, status: res.status, hasToken, username });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
