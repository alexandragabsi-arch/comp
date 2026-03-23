import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from "docx";

// LegalCorners info
const LC = {
  nom: "LegalCorners",
  siren: "950 811 190",
  adresse: "78 avenue des Champs-Élysées",
  cp: "75008",
  ville: "Paris",
  email: "contact@legalcorners.fr",
  tva: "FR 07 950 811 190",
};

function p(text: string, opts: { bold?: boolean; right?: boolean; center?: boolean; size?: number; color?: string } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      bold: opts.bold,
      size: opts.size,
      color: opts.color,
    })],
    alignment: opts.center ? AlignmentType.CENTER : opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { after: 100 },
  });
}

function hr(): Paragraph {
  return new Paragraph({
    children: [],
    border: { bottom: { color: "E2E8F0", space: 1, style: BorderStyle.SINGLE, size: 4 } },
    spacing: { after: 200, before: 100 },
  });
}

function rowData(label: string, value: string, bold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [p(label, { bold })],
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      }),
      new TableCell({
        children: [p(value, { bold, right: true })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      }),
    ],
  });
}

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id manquant" }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details", "payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Paiement non effectué" }, { status: 400 });
    }

    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const chargeId = typeof pi?.latest_charge === "string" ? pi.latest_charge : null;
    let receiptUrl: string | null = null;
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url ?? null;
    }

    const lineItems = session.line_items?.data ?? [];
    const email = session.customer_details?.email ?? "";
    const name = session.customer_details?.name ?? "";
    const totalTTC = (session.amount_total ?? 0) / 100;
    const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;
    const tva = Math.round((totalTTC - totalHT) * 100) / 100;
    const currency = (session.currency ?? "eur").toUpperCase();
    const created = new Date(session.created * 1000);
    const dateStr = created.toLocaleDateString("fr-FR");
    const ref = sessionId.slice(-12).toUpperCase();

    const formatEur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

    // Lignes de la commande
    const itemRows = lineItems.map((item) =>
      rowData(item.description ?? "", formatEur((item.amount_total ?? 0) / 100))
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1.2),
                right: convertInchesToTwip(1.2),
              },
            },
          },
          children: [
            // ── Tampon PAYÉ ──────────────────────────────────────────────────
            new Paragraph({
              children: [new TextRun({ text: "✓  PAYÉ", bold: true, size: 36, color: "C0392B" })],
              alignment: AlignmentType.RIGHT,
              border: { top: { style: BorderStyle.SINGLE, color: "C0392B", size: 12 }, bottom: { style: BorderStyle.SINGLE, color: "C0392B", size: 12 }, left: { style: BorderStyle.SINGLE, color: "C0392B", size: 12 }, right: { style: BorderStyle.SINGLE, color: "C0392B", size: 12 } },
              shading: { type: ShadingType.CLEAR, color: "FDEDEC", fill: "FDEDEC" },
              spacing: { after: 300 },
            }),

            // ── En-tête émetteur ─────────────────────────────────────────────
            new Paragraph({
              children: [new TextRun({ text: LC.nom, bold: true, size: 40, color: "1E3A8A" })],
              spacing: { after: 60 },
            }),
            p(`${LC.adresse}, ${LC.cp} ${LC.ville}`),
            p(`Email : ${LC.email}`),
            p(`SIREN : ${LC.siren}   |   N° TVA : ${LC.tva}`),

            hr(),

            // ── Titre + référence ────────────────────────────────────────────
            new Paragraph({
              children: [new TextRun({ text: "FACTURE", bold: true, size: 32, color: "1E3A8A" })],
              spacing: { before: 100, after: 120 },
            }),
            p(`Date : ${dateStr}`),
            p(`Référence : ${ref}`),
            ...(name ? [p(`Client : ${name}`)] : []),
            ...(email ? [p(`Email : ${email}`)] : []),

            hr(),

            // ── Tableau des prestations ──────────────────────────────────────
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // En-tête tableau
                new TableRow({
                  children: [
                    new TableCell({
                      children: [p("Description", { bold: true })],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      shading: { type: ShadingType.CLEAR, fill: "EFF4FF" },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: "5D9CEC" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [p("Montant HT", { bold: true, right: true })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      shading: { type: ShadingType.CLEAR, fill: "EFF4FF" },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: "5D9CEC" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                }),
                // Lignes items
                ...itemRows,
                // Séparateur
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [] })],
                      columnSpan: 2,
                      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                }),
                // Sous-total HT
                rowData("Sous-total HT", formatEur(totalHT)),
                // TVA
                rowData("TVA (20%)", formatEur(tva)),
                // Total TTC
                new TableRow({
                  children: [
                    new TableCell({
                      children: [p("TOTAL TTC", { bold: true })],
                      shading: { type: ShadingType.CLEAR, fill: "1E3A8A" },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formatEur(totalTTC), bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT, spacing: { after: 100 } })],
                      shading: { type: ShadingType.CLEAR, fill: "1E3A8A" },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ children: [], spacing: { after: 300 } }),
            p("TVA incluse au taux légal en vigueur (20%)."),
            p(`Paiement effectué le ${dateStr}.`),
            ...(receiptUrl ? [p(`Reçu Stripe : ${receiptUrl}`)] : []),

            hr(),
            p("LegalCorners — Société par actions simplifiée (SAS)", { color: "9CA3AF" }),
            p(`78 avenue des Champs-Élysées, 75008 Paris — SIREN ${LC.siren}`, { color: "9CA3AF" }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Facture_LegalCorners_${ref}.docx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
