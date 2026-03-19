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
  Header,
  Footer,
  PageNumber,
  TableLayoutType,
  VerticalAlign,
  convertInchesToTwip,
} from "docx";
import { FormData } from "../types/form";

// ── Brand colors ───────────────────────────────────────────────────────────────
const NAVY = "1A2744";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F5F6FA";

// ── Helpers ────────────────────────────────────────────────────────────────────
function emptyLine(spaceAfter = 0): Paragraph {
  return new Paragraph({ text: "", spacing: { after: spaceAfter } });
}

/** Parse inline **bold** and return TextRun array */
function parseInline(text: string, baseSize = 22, baseColor = "222222"): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.flatMap((part) => {
    if (!part) return [];
    if (part.startsWith("**") && part.endsWith("**")) {
      return [new TextRun({ text: part.slice(2, -2), bold: true, size: baseSize, color: baseColor })];
    }
    return [new TextRun({ text: part, size: baseSize, color: baseColor })];
  });
}

function navyRun(text: string, bold = false, size = 22): TextRun {
  return new TextRun({ text, bold, color: NAVY, size });
}

// ── Header ─────────────────────────────────────────────────────────────────────
function buildHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "LEGALCORNERS", bold: true, size: 18, color: NAVY }),
          new TextRun({ text: "   —   DOCUMENT CONFIDENTIEL", italics: true, size: 16, color: "999999" }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY } },
        spacing: { after: 100 },
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
    emptyLine(600),
    new Paragraph({
      children: [
        navyRun(`ACTE DE CESSION DE ${typeTitre.toUpperCase()}`, true, 36),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
    }),
    emptyLine(400),
    new Paragraph({
      children: [
        new TextRun({ text: "Entre   ", size: 24, color: "555555" }),
        new TextRun({ text: cedantName.toUpperCase(), bold: true, size: 24, color: NAVY }),
        new TextRun({ text: "   — Cédant", size: 24, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [navyRun("ET", true, 24)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Au profit de   ", size: 24, color: "555555" }),
        new TextRun({ text: cessionnaireName.toUpperCase(), bold: true, size: 24, color: NAVY }),
        new TextRun({ text: "   — Cessionnaire", size: 24, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Société cible : ", size: 22, color: "555555" }),
        new TextRun({ text: data.societe.denomination || "[DÉNOMINATION SOCIALE]", bold: true, size: 22, color: NAVY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Fait à ${data.ville || "[VILLE]"}, le ${data.date || "[DATE]"}`, size: 22, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
  ];
}

// ── Parse a markdown table into a DOCX Table ───────────────────────────────────
function buildMarkdownTable(tableLines: string[]): Table | null {
  // Remove separator rows (|---|---|)
  const rows = tableLines
    .filter((l) => !/^\|[\s\-:|]+\|$/.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    )
    .filter((r) => r.length > 0);

  if (rows.length === 0) return null;

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidthPct = Math.floor(100 / colCount);

  const docxRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;
    return new TableRow({
      tableHeader: isHeader,
      children: row.map((cell) =>
        new TableCell({
          children: [
            new Paragraph({
              children: parseInline(cell, 20, isHeader ? WHITE : "333333"),
              alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            }),
          ],
          shading: isHeader
            ? { type: ShadingType.SOLID, color: NAVY, fill: NAVY }
            : { type: ShadingType.SOLID, color: rowIdx % 2 === 0 ? WHITE : LIGHT_GRAY, fill: rowIdx % 2 === 0 ? WHITE : LIGHT_GRAY },
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          verticalAlign: VerticalAlign.CENTER,
        })
      ),
    });
  });

  return new Table({
    rows: docxRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      left: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      right: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    },
  });
}

// ── Main body text parser ──────────────────────────────────────────────────────
function parseBodyText(text: string): Array<Paragraph | Table> {
  const lines = text.split("\n");
  const result: Array<Paragraph | Table> = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    // ── Empty line ──
    if (!t) {
      result.push(emptyLine(80));
      i++;
      continue;
    }

    // ── Markdown table block ──
    if (t.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const tbl = buildMarkdownTable(tableLines);
      if (tbl) {
        result.push(tbl);
        result.push(emptyLine(120));
      }
      continue;
    }

    // ── Separator lines: ===, ---, ───── ──
    if (/^[═=]{3,}$/.test(t)) {
      result.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
        spacing: { after: 120 },
        text: "",
      }));
      i++;
      continue;
    }
    if (/^[-─]{3,}$/.test(t)) {
      result.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" } },
        spacing: { after: 80 },
        text: "",
      }));
      i++;
      continue;
    }

    // ── Strip markdown heading prefix ──
    const mdH1 = /^#{1}\s+(.+)$/.exec(t);
    const mdH2 = /^#{2}\s+(.+)$/.exec(t);
    const mdH3 = /^#{3,}\s+(.+)$/.exec(t);

    // H1 (# Title)
    if (mdH1) {
      const content = mdH1[1].replace(/\*\*/g, "");
      result.push(new Paragraph({
        children: [navyRun(content, true, 30)],
        alignment: AlignmentType.CENTER,
        spacing: { before: 280, after: 200 },
        heading: HeadingLevel.HEADING_1,
      }));
      i++;
      continue;
    }

    // H2 (## ARTICLE or section)
    if (mdH2) {
      const content = mdH2[1].replace(/\*\*/g, "");
      if (/^(ARTICLE |R[EÉ]SOLUTION |OUVERTURE|CLÔTURE|SIGNATURES|ORDRE DU JOUR)/i.test(content)) {
        result.push(new Paragraph({
          children: [navyRun(content, true, 22)],
          spacing: { before: 300, after: 100 },
          border: { left: { style: BorderStyle.THICK, size: 14, color: "22C55E" } },
          indent: { left: 220 },
          shading: { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY },
        }));
      } else {
        result.push(new Paragraph({
          children: [navyRun(content, true, 24)],
          spacing: { before: 260, after: 120 },
          heading: HeadingLevel.HEADING_2,
        }));
      }
      i++;
      continue;
    }

    // H3 (### sub-section)
    if (mdH3) {
      const content = mdH3[1].replace(/\*\*/g, "");
      result.push(new Paragraph({
        children: [navyRun(content, true, 22)],
        spacing: { before: 200, after: 80 },
        heading: HeadingLevel.HEADING_3,
      }));
      i++;
      continue;
    }

    // Strip any remaining leading # (shouldn't happen but safety)
    const cleanT = t.replace(/^#+\s*/, "");

    // ── ARTICLE / RÉSOLUTION without ## ──
    if (/^(ARTICLE \d+|R[EÉ]SOLUTION \d+|OUVERTURE|CLÔTURE|SIGNATURES|ORDRE DU JOUR)/i.test(cleanT)) {
      result.push(new Paragraph({
        children: [navyRun(cleanT.replace(/\*\*/g, ""), true, 22)],
        spacing: { before: 300, after: 100 },
        border: { left: { style: BorderStyle.THICK, size: 14, color: "22C55E" } },
        indent: { left: 220 },
        shading: { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY },
      }));
      i++;
      continue;
    }

    // ── Main document title (ALL-CAPS, no # prefix) ──
    if (/^(CESSION D|ACTE DE CESSION|PROC[EÈ]S-VERBAL|D[EÉ]CISIONS UNANIMES|D[ÉE]CLARATION DE NON)/i.test(cleanT)) {
      result.push(new Paragraph({
        children: [navyRun(cleanT, true, 28)],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 180 },
        heading: HeadingLevel.HEADING_1,
      }));
      i++;
      continue;
    }

    // ── Sub-section X.X ──
    if (/^\d+\.\d+\s/.test(cleanT)) {
      result.push(new Paragraph({
        children: parseInline(cleanT, 22, NAVY),
        spacing: { before: 180, after: 80 },
      }));
      i++;
      continue;
    }

    // ── Signature block labels ──
    if (/^(LE C[EÉ]DANT|LE CESSIONNAIRE|LE PR[EÉ]SIDENT|LE CONJOINT|L[''']ASSOCI[EÉ]|LE G[EÉ]RANT|L[''']ASSOCI[EÉ] UNIQUE)/i.test(cleanT)) {
      result.push(new Paragraph({
        children: [navyRun(cleanT, true, 22)],
        spacing: { before: 300, after: 80 },
      }));
      i++;
      continue;
    }

    // ── Bullet ──
    if (/^[•*]\s/.test(t) || (/^-\s/.test(t) && !t.startsWith("---"))) {
      const bulletText = cleanT.replace(/^[•*\-]\s+/, "");
      result.push(new Paragraph({
        children: parseInline(bulletText),
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
      i++;
      continue;
    }

    // ── Default paragraph ──
    result.push(new Paragraph({
      children: parseInline(cleanT),
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
    }));
    i++;
  }

  return result;
}

// ── Shared document styles ─────────────────────────────────────────────────────
const DOC_STYLES = {
  default: {
    document: {
      run: { font: "Arial", size: 22, color: "222222" },
      paragraph: { spacing: { line: 340 } },
    },
  },
};

const PAGE_MARGINS = {
  top: convertInchesToTwip(1.1),
  right: convertInchesToTwip(1.1),
  bottom: convertInchesToTwip(1.1),
  left: convertInchesToTwip(1.2),
};

// ── Exports ────────────────────────────────────────────────────────────────────
export async function generateActeDocx(acteText: string, data: FormData): Promise<Blob> {
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.societe.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  const coverChildren = buildCoverPage(data, typeTitre);
  const bodyChildren = parseBodyText(acteText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        properties: { page: { margin: PAGE_MARGINS } },
        children: [...coverChildren, emptyLine(400), ...bodyChildren],
      },
    ],
    styles: DOC_STYLES,
  });

  return Packer.toBlob(doc);
}

export async function generatePVDocx(pvText: string, data: FormData): Promise<Blob> {
  const bodyChildren = parseBodyText(pvText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        properties: { page: { margin: PAGE_MARGINS } },
        children: bodyChildren,
      },
    ],
    styles: DOC_STYLES,
  });

  return Packer.toBlob(doc);
}

export async function generateDeclarationDocx(declarationText: string, data: FormData): Promise<Blob> {
  const bodyChildren = parseBodyText(declarationText);

  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        properties: { page: { margin: PAGE_MARGINS } },
        children: bodyChildren,
      },
    ],
    styles: DOC_STYLES,
  });

  return Packer.toBlob(doc);
}
