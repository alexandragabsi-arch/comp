import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";

function p(text: string, bold_ = false, right = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: bold_ })],
    alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { after: 120 },
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
    const total = (session.amount_total ?? 0) / 100;
    const currency = (session.currency ?? "eur").toUpperCase();
    const created = new Date(session.created * 1000);
    const dateStr = created.toLocaleDateString("fr-FR");

    // Generate invoice as .docx
    const rows = lineItems.map((item) =>
      new TableRow({
        children: [
          new TableCell({
            children: [p(item.description ?? "")],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [p(`${((item.amount_total ?? 0) / 100).toFixed(2)} ${currency}`, false, true)],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
            },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "LegalCorners", bold: true, size: 36 })],
              spacing: { after: 80 },
            }),
            p("contact@legalcorners.fr"),
            new Paragraph({ children: [], spacing: { after: 300 } }),
            new Paragraph({ children: [new TextRun({ text: "FACTURE", bold: true, size: 28 })], spacing: { after: 160 } }),
            p(`Date : ${dateStr}`),
            p(`Référence : ${sessionId.slice(-12).toUpperCase()}`),
            ...(email ? [p(`Client : ${name || email}`)] : []),
            ...(email ? [p(`Email : ${email}`)] : []),
            new Paragraph({ children: [], spacing: { after: 300 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [p("Description", true)],
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [p("Montant (TTC)", true, true)],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                }),
                ...rows,
                new TableRow({
                  children: [
                    new TableCell({
                      children: [p("TOTAL TTC", true, true)],
                      borders: { top: { style: BorderStyle.SINGLE, size: 8 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [p(`${total.toFixed(2)} ${currency}`, true, true)],
                      borders: { top: { style: BorderStyle.SINGLE, size: 8 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({ children: [], spacing: { after: 300 } }),
            p("TVA incluse au taux légal en vigueur."),
            ...(receiptUrl ? [p(`Reçu de paiement : ${receiptUrl}`)] : []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Facture_LegalCorners_${sessionId.slice(-8).toUpperCase()}.docx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
