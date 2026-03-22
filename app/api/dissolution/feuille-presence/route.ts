import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  convertInchesToTwip,
} from "docx";

export interface FeuillePresenceData {
  companyName: string;
  formeJuridique: string;
  capital: string;
  siegeSocial: string;
  rcsVille: string;
  siren: string;
  date: string;       // JJ/MM/YYYY
  heure: string;
  lieuAssemblee: string;
  typeActions: "actions" | "parts sociales";
  president: string;
  associes: {
    civilite: string;        // "M." | "Mme" | ""
    nom: string;
    prenom: string;
    representant?: string;   // si personne morale ou représentant
    qualite: "pleine_propriete" | "industrie" | "nue_propriete" | "usufruit";
    nbParts: string;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cell(
  children: Paragraph[],
  opts: {
    width?: number;
    bold?: boolean;
    center?: boolean;
    shade?: string;
    vAlign?: "top" | "center" | "bottom";
    borders?: boolean;
  } = {}
): TableCell {
  const borders = opts.borders === false ? {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  } : {
    top: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
  };

  return new TableCell({
    children,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: opts.vAlign ?? "center",
    shading: opts.shade ? { fill: opts.shade, type: "clear" } : undefined,
    borders,
  });
}

function txt(text: string, bold = false, center = false, size = 20): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size })],
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 60, after: 60 },
  });
}

function headerCell(text: string, width: number): TableCell {
  return cell(
    [txt(text, true, true, 18)],
    { width, shade: "D6E4F7", center: true }
  );
}

function qualiteLabel(q: FeuillePresenceData["associes"][0]["qualite"]): string {
  switch (q) {
    case "pleine_propriete": return "Associé en pleine propriété";
    case "nue_propriete":    return "Associé nu-propriétaire";
    case "usufruit":         return "Associé usufruitier";
    case "industrie":        return "Apporteur en industrie";
  }
}

function checkboxCell(width: number): TableCell {
  return cell(
    [
      txt("☐ Présent(e)", false, false, 18),
      txt("☐ Représenté(e)", false, false, 18),
    ],
    { width, vAlign: "center" }
  );
}

export async function POST(req: NextRequest) {
  const d: FeuillePresenceData = await req.json();

  const typeLabel = d.typeActions === "actions" ? "actions" : "parts sociales";
  const totalParts = d.associes
    .filter((a) => a.qualite !== "industrie")
    .reduce((sum, a) => sum + (parseInt(a.nbParts) || 0), 0);

  // ── En-tête société ──────────────────────────────────────────────────────
  const headerBlocks: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: d.companyName, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `${d.formeJuridique} au capital de ${d.capital} €`,
        size: 20,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Siège social : ${d.siegeSocial}`,
        size: 20,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Immatriculée au RCS de ${d.rcsVille} sous le numéro ${d.siren}`,
        size: 20,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Titre
    new Paragraph({
      children: [new TextRun({
        text: "FEUILLE DE PRÉSENCE",
        bold: true,
        size: 36,
        underline: {},
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "1E3A8A" },
      },
    }),

    // Infos assemblée
    new Paragraph({
      children: [
        new TextRun({ text: "Assemblée Générale Extraordinaire — ", bold: true, size: 22 }),
        new TextRun({ text: `${d.date} à ${d.heure}`, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Lieu : ", bold: true, size: 20 }),
        new TextRun({ text: d.lieuAssemblee || d.siegeSocial, size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];

  // ── En-têtes du tableau ──────────────────────────────────────────────────
  const colWidths = [30, 22, 16, 18, 14]; // % total = 100
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Associé\n(Civilité · Nom · Prénom / Dénomination + représentant)", colWidths[0]),
      headerCell("Qualité", colWidths[1]),
      headerCell("Présent(e) /\nReprésenté(e)", colWidths[2]),
      headerCell(`Nombre de\n${typeLabel}\n/ Droits de vote`, colWidths[3]),
      headerCell("Signature", colWidths[4]),
    ],
  });

  // ── Lignes associés ──────────────────────────────────────────────────────
  const associeRows: TableRow[] = d.associes.map((a) => {
    const nomComplet = a.representant
      ? `${a.civilite ? a.civilite + " " : ""}${a.prenom} ${a.nom}\n(représentée par ${a.representant})`
      : `${a.civilite ? a.civilite + " " : ""}${a.prenom} ${a.nom}`;

    const partsDisplay =
      a.qualite === "industrie"
        ? "Droits de vote\nselon statuts"
        : `${a.nbParts || "—"} ${typeLabel}`;

    return new TableRow({
      children: [
        cell([txt(nomComplet, false, false, 18)], { width: colWidths[0] }),
        cell([txt(qualiteLabel(a.qualite), false, false, 18)], { width: colWidths[1] }),
        checkboxCell(colWidths[2]),
        cell([txt(partsDisplay, false, true, 18)], { width: colWidths[3], center: true }),
        cell([txt("")], { width: colWidths[4] }), // vide pour signature
      ],
    });
  });

  // ── Lignes vides supplémentaires (3 si moins de 3 associés) ─────────────
  const blankRows: TableRow[] = d.associes.length < 3
    ? Array.from({ length: 3 - d.associes.length }, () =>
        new TableRow({
          children: [
            cell([txt("", false, false, 18)], { width: colWidths[0] }),
            cell([txt("Associé en pleine propriété", false, false, 18)], { width: colWidths[1] }),
            checkboxCell(colWidths[2]),
            cell([txt("", false, true, 18)], { width: colWidths[3] }),
            cell([txt("")], { width: colWidths[4] }),
          ],
        })
      )
    : [];

  // ── Ligne TOTAL ──────────────────────────────────────────────────────────
  const totalRow = new TableRow({
    children: [
      cell(
        [txt("TOTAL", true, true, 18)],
        { width: colWidths[0] + colWidths[1], shade: "D6E4F7" }
      ),
      cell([txt("", false, false, 18)], { width: colWidths[2], shade: "D6E4F7" }),
      cell(
        [txt(totalParts > 0 ? `${totalParts} ${typeLabel}` : "—", true, true, 18)],
        { width: colWidths[3], shade: "D6E4F7", center: true }
      ),
      cell([txt("")], { width: colWidths[4], shade: "D6E4F7" }),
    ],
  });

  // ── Tableau complet ──────────────────────────────────────────────────────
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...associeRows, ...blankRows, totalRow],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "1E3A8A" },
    },
  });

  // ── Bloc de certification ────────────────────────────────────────────────
  const certifBlocks: Paragraph[] = [
    new Paragraph({ children: [], spacing: { before: 400, after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Certification de la feuille de présence",
          bold: true,
          size: 22,
          underline: {},
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Le Président de l'assemblée certifie que la présente feuille de présence est sincère et véritable et que les associés figurant sur celle-ci étaient bien présents ou représentés à l'Assemblée Générale Extraordinaire du ${d.date}.`,
          size: 20,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Fait à _________________, le ${d.date}`, size: 20 })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Le Président : ${d.president}`, bold: true, size: 20 })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Signature :", size: 20 })],
      spacing: { after: 600 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "333333" },
      },
    }),
  ];

  // ── Assemblage document ──────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(11.7), height: convertInchesToTwip(8.27) }, // A4 paysage
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          ...headerBlocks,
          table,
          ...certifBlocks,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Feuille_Presence_AGE_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
