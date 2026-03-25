import { NextRequest, NextResponse } from "next/server";

const INPI_BASE = "https://guichet-unique.inpi.fr/api";

async function loginInpi(): Promise<{ token: string; cookie: string }> {
  const username = process.env.INPI_USERNAME;
  const password = process.env.INPI_PASSWORD;
  if (!username || !password) throw new Error("Identifiants INPI manquants");

  const res = await fetch(`${INPI_BASE}/user/login/sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error(`Auth INPI échouée (${res.status})`);
  const data = await res.json();
  const token: string = data.token || data.access_token || "";
  const cookie = res.headers.get("set-cookie") || "";
  if (!token) throw new Error("Token INPI introuvable");
  return { token, cookie };
}

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  DRAFT: { label: "Brouillon", color: "gray", description: "Le dossier n'a pas encore été soumis." },
  SUBMITTED: { label: "Transmis", color: "blue", description: "Votre dossier a été transmis au greffe. Traitement en cours." },
  IN_PROGRESS: { label: "En cours de traitement", color: "blue", description: "Le greffe examine votre dossier." },
  PENDING: { label: "En attente", color: "yellow", description: "Le greffe traite votre dossier." },
  COMPLEMENT_REQUIRED: { label: "Complément demandé", color: "orange", description: "Le greffe demande des documents ou informations supplémentaires." },
  ACCEPTED: { label: "Accepté", color: "green", description: "Votre société est immatriculée ! Le Kbis sera disponible sous 24-48h." },
  REJECTED: { label: "Rejeté", color: "red", description: "Le dossier a été rejeté. Consultez les motifs pour corriger et resoumettre." },
  REGISTERED: { label: "Immatriculé", color: "green", description: "Votre société est officiellement créée. Votre Kbis est disponible." },
};

export async function GET(request: NextRequest) {
  try {
    const dossierId = request.nextUrl.searchParams.get("dossierId");
    if (!dossierId) {
      return NextResponse.json({ error: "dossierId requis" }, { status: 400 });
    }

    const { token, cookie } = await loginInpi();

    const res = await fetch(`${INPI_BASE}/formalities/${dossierId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: cookie,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Récupération statut INPI échouée (${res.status}): ${txt}`);
    }

    const data = await res.json();
    const rawStatus = data.status || data.etat || "UNKNOWN";
    const statusInfo = STATUS_LABELS[rawStatus] || {
      label: rawStatus,
      color: "gray",
      description: "Statut inconnu.",
    };

    return NextResponse.json({
      dossierId,
      status: rawStatus,
      label: statusInfo.label,
      color: statusInfo.color,
      description: statusInfo.description,
      siren: data.siren || data.content?.siren || null,
      denomination: data.content?.denomination || null,
      dateCreation: data.dateCreation || data.createdAt || null,
      dateModification: data.dateModification || data.updatedAt || null,
      motifRejet: data.motifRejet || data.complement?.motif || null,
    });
  } catch (err: unknown) {
    console.error("Erreur statut INPI:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 }
    );
  }
}
