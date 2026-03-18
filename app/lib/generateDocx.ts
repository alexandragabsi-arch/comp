import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  BorderStyle,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
  TabStopPosition,
  TabStopType,
  TableLayoutType,
  VerticalAlign,
  convertInchesToTwip,
} from "docx";
import { FormData } from "../types/form";

// ── Brand colors ───────────────────────────────────────────────────────────────
const NAVY = "1A2744";
const YELLOW = "FFE900";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F8F9FC";

// ── Helpers ────────────────────────────────────────────────────────────────────
function highlight(text: string): TextRun {
  return new TextRun({
    text,
    bold: true,
    highlight: "yellow",
    color: "000000",
  });
}

function navy(text: string, bold = false, size = 24): TextRun {
  return new TextRun({ text, bold, color: NAVY, size });
}

function plain(text: string, size = 22): TextRun {
  return new TextRun({ text, size, color: "222222" });
}

function emptyLine(): Paragraph {
  return new Paragraph({ text: "" });
}

// ── Header ─────────────────────────────────────────────────────────────────────
function buildHeader(typeTitre: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `ACTE DE CESSION `,
            bold: true,
            size: 18,
            color: NAVY,
          }),
          new TextRun({
            text: `D'${typeTitre.toUpperCase()} / DE PARTS SOCIALES `,
            bold: true,
            size: 18,
            color: NAVY,
            highlight: "yellow",
          }),
          new TextRun({
            text: "DOCUMENT CONFIDENTIEL",
            italics: true,
            size: 16,
            color: "999999",
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
        },
        spacing: { after: 120 },
      }),
    ],
  });
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "Document confidentiel — LegalCorners   ", size: 16, color: "999999" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
          new TextRun({ text: " / ", size: 16, color: "999999" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "999999" }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
        spacing: { before: 100 },
      }),
    ],
  });
}

// ── Cover page ─────────────────────────────────────────────────────────────────
function buildCoverPage(data: FormData, typeTitre: string): Paragraph[] {
  const cedantName =
    data.cedant.typePersonne === "physique" && data.cedant.physique
      ? `${data.cedant.physique.civilite} ${data.cedant.physique.nom} ${data.cedant.physique.prenom}`
      : data.cedant.morale?.denomination || "[CÉDANT]";

  const cessionnaireName =
    data.cessionnaire.typePersonne === "physique" && data.cessionnaire.physique
      ? `${data.cessionnaire.physique.civilite} ${data.cessionnaire.physique.nom} ${data.cessionnaire.physique.prenom}`
      : data.cessionnaire.morale?.denomination || "[CESSIONNAIRE]";

  return [
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    new Paragraph({
      children: [
        navy("CESSION ", true, 36),
        new TextRun({ text: `D'${typeTitre.toUpperCase()} / DE PARTS SOCIALES`, bold: true, size: 36, color: NAVY, highlight: "yellow" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
    }),
    emptyLine(),
    new Paragraph({
      children: [
        plain("Entre "),
        highlight(cedantName.toUpperCase()),
        plain(" — Cédant"),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [navy("ET", true, 24)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        plain("Au profit de "),
        highlight(cessionnaireName.toUpperCase()),
        plain(" — Cessionnaire"),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        plain("Société cible : "),
        highlight(data.societe.denomination || "[DÉNOMINATION SOCIALE]"),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        plain("Fait à "),
        highlight(data.ville || "[VILLE]"),
        plain(", le "),
        highlight(data.date || "[JJ/MM/AAAA]"),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];
}

// ── Index des définitions table ────────────────────────────────────────────────
const DEFINITIONS = [
  ["Acte / Présentes", "Le présent acte de cession et l'ensemble de ses annexes."],
  ["Titres", "Les actions ou parts sociales faisant l'objet de la présente cession."],
  ["Cédant / Vendeur", "La partie qui cède les Titres aux termes des présentes."],
  ["Cessionnaire / Acquéreur", "La partie qui acquiert les Titres aux termes des présentes."],
  ["Société / Cible", "La société dont les Titres sont cédés."],
  ["Prix Ferme", "La partie fixe et certaine du Prix de Cession, payable à la Date d'Effet."],
  ["Quittance", "Reconnaissance par le Cédant du paiement intégral du Prix Ferme par le Cessionnaire."],
  ["Plus-value de Cession", "Différence entre le Prix de Cession et le Prix d'Acquisition des Titres, diminuée des frais."],
  ["GAP", "Garantie d'Actif et de Passif — engagement du Cédant de couvrir tout passif antérieur non révélé."],
  ["Seuil de Déclenchement GAP", "Montant minimal en-deçà duquel la GAP ne peut être mise en œuvre, évitant les micro-litiges."],
];

function buildDefinitionsTable(): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: "TERME DÉFINI", bold: true, color: WHITE, size: 20 })],
          alignment: AlignmentType.LEFT,
        })],
        shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
        columnSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
      }),
    ],
  });

  const dataRows = DEFINITIONS.map(([term, def], i) =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: term, bold: true, color: NAVY, size: 20 })],
          })],
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GRAY, fill: i % 2 === 0 ? WHITE : LIGHT_GRAY },
          width: { size: 35, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: def, size: 20, color: "333333" })],
          })],
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GRAY, fill: i % 2 === 0 ? WHITE : LIGHT_GRAY },
          width: { size: 65, type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      left: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
    },
  });
}

// ── Parse text content into paragraphs ────────────────────────────────────────
function parseBodyText(text: string): Array<Paragraph | Table> {
  const lines = text.split("\n");
  const result: Array<Paragraph | Table> = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) { result.push(emptyLine()); continue; }

    // Separator
    if (/^[═─]{5,}/.test(t)) {
      result.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: t.startsWith("═") ? NAVY : "DDDDDD" } },
        spacing: { after: 80 },
        text: "",
      }));
      continue;
    }

    // Main title
    if (/^(CESSION D|ACTE DE CESSION|PROC[EÈ]S-VERBAL|D[EÉ]CISIONS UNANIMES|D[ÉE]CLARATION DE NON)/i.test(t)) {
      result.push(new Paragraph({
        children: [navy(t, true, 28)],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 160 },
        heading: HeadingLevel.HEADING_1,
      }));
      continue;
    }

    // INDEX DES DÉFINITIONS
    if (/^INDEX DES D[EÉ]FINITIONS/.test(t)) {
      result.push(new Paragraph({
        children: [new TextRun({ text: t, bold: true, size: 24, color: NAVY, underline: {} })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 160 },
      }));
      result.push(buildDefinitionsTable());
      result.push(emptyLine());
      continue;
    }

    // ARTICLE / RÉSOLUTION
    if (/^(ARTICLE \d+|R[EÉ]SOLUTION \d+|OUVERTURE|SIGNATURES|ORDRE DU JOUR)/i.test(t)) {
      result.push(new Paragraph({
        children: [navy(t, true, 22)],
        spacing: { before: 240, after: 80 },
        border: { left: { style: BorderStyle.THICK, size: 12, color: "22C55E" } },
        indent: { left: 200 },
        shading: { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY },
      }));
      continue;
    }

    // Sub-section X.X
    if (/^\d+\.\d+\s/.test(t)) {
      result.push(new Paragraph({
        children: [navy(t, true, 22)],
        spacing: { before: 160, after: 60 },
      }));
      continue;
    }

    // Signature blocks
    if (/^(LE C[EÉ]DANT|LE CESSIONNAIRE|LE PR[EÉ]SIDENT|LE CONJOINT|L[''']ASSOCI[EÉ]|LE G[EÉ]RANT)/i.test(t)) {
      result.push(new Paragraph({
        children: [navy(t, true, 22)],
        spacing: { before: 240, after: 60 },
      }));
      continue;
    }

    // Bullet
    if (/^[•*-]\s/.test(t)) {
      result.push(new Paragraph({
        children: [plain(t.replace(/^[•*-]\s*/, ""))],
        bullet: { level: 0 },
        spacing: { after: 40 },
      }));
      continue;
    }

    // Default paragraph
    result.push(new Paragraph({
      children: [plain(t)],
      spacing: { after: 60 },
    }));
  }

  return result;
}

// ── Main export: generate DOCX ─────────────────────────────────────────────────
export async function generateActeDocx(
  acteText: string,
  data: FormData
): Promise<Blob> {
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.societe.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  const coverChildren = buildCoverPage(data, typeTitre);
  const bodyChildren = parseBodyText(acteText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader(typeTitre) },
        footers: { default: buildFooter() },
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [...coverChildren, ...bodyChildren],
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: "222222" },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

export async function generatePVDocx(
  pvText: string,
  data: FormData
): Promise<Blob> {
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.societe.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  const bodyChildren = parseBodyText(pvText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader(typeTitre) },
        footers: { default: buildFooter() },
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: bodyChildren,
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: "222222" },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
  });

  return Packer.toBlob(doc);
}

export async function generateDeclarationDocx(
  declarationText: string,
  data: FormData
): Promise<Blob> {
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.societe.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  const bodyChildren = parseBodyText(declarationText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader(typeTitre) },
        footers: { default: buildFooter() },
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: bodyChildren,
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: "222222" },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
  });

  return Packer.toBlob(doc);
}
