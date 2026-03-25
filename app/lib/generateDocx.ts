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
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
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
    if (/^(CESSION D|ACTE DE CESSION|PROC[EÈ]S-VERBAL|D[EÉ]CISIONS UNANIMES|D[ÉE]CLARATION DE NON|D[ÉE]CLARATION DE DISPENSE|ATTESTATION D)/i.test(cleanT)) {
      result.push(new Paragraph({
        children: [navyRun(cleanT, true, 28)],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
        heading: HeadingLevel.HEADING_1,
      }));
      i++;
      continue;
    }

    // ── Cover page lines: Entre / ET / Au profit de / Société cible / Fait à ──
    if (/^(Entre\s|ET$|Au profit de\s|Société cible\s*:|Fait à\s)/i.test(cleanT)) {
      result.push(new Paragraph({
        children: parseInline(cleanT, 24, NAVY),
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
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
    if (/^(LE C[EÉ]DANT|LE CESSIONNAIRE|LE PR[EÉ]SIDENT|LE CONJOINT|L[''']ASSOCI[EÉ]|LE G[EÉ]RANT|L[''']ASSOCI[EÉ] UNIQUE|LA SOCI[EÉ]T[EÉ] D[EÉ]NOMM[EÉ]E|Signature\s*:)/i.test(cleanT)) {
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
  // Parse the full AI text directly — no separate cover page to avoid duplication
  const bodyChildren = parseBodyText(acteText);

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

export async function generateDissolutionDocx(pvText: string): Promise<Blob> {
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

// ── Génération générique pour les documents SASU (attestation, dispense, non-condamnation) ──
export async function generateSasuDocumentDocx(text: string): Promise<Blob> {
  const bodyChildren = parseBodyText(text);

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

// ── SASU Statuts ─────────────────────────────────────────────────────────────

const SASU_NAVY = "1A2744";
const SASU_GRAY = "999999";
const SASU_LIGHT_BG = "F5F6FA";

const SASU_PAGE_MARGINS = {
  top: convertInchesToTwip(1),
  bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1.18),
  right: convertInchesToTwip(1),
};

function sasuRun(
  text: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    font?: string;
  } = {},
): TextRun {
  return new TextRun({
    text,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    size: opts.size ?? 22,
    color: opts.color ?? SASU_NAVY,
    font: opts.font ?? "Cambria",
  });
}

/** Parse inline **bold** and __underline-as-bold__ for SASU statuts */
function sasuParseInline(
  text: string,
  baseSize = 22,
  baseColor = SASU_NAVY,
): TextRun[] {
  // Split on **bold** and __bold__ patterns
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/);
  return parts.flatMap((part) => {
    if (!part) return [];
    if (part.startsWith("**") && part.endsWith("**")) {
      return [sasuRun(part.slice(2, -2), { bold: true, size: baseSize, color: baseColor })];
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return [sasuRun(part.slice(2, -2), { bold: true, size: baseSize, color: baseColor })];
    }
    return [sasuRun(part, { size: baseSize, color: baseColor })];
  });
}

function sasuEmptyLine(spaceAfter = 0): Paragraph {
  return new Paragraph({ text: "", spacing: { after: spaceAfter } });
}

function buildSasuCoverPage(meta: {
  denomination: string;
  capital: string;
  siege: string;
}): Paragraph[] {
  const children: Paragraph[] = [];

  // ~30% empty space at top
  for (let i = 0; i < 8; i++) {
    children.push(sasuEmptyLine(100));
  }

  // Thin navy horizontal line
  children.push(
    new Paragraph({
      text: "",
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SASU_NAVY } },
      spacing: { after: 200 },
    }),
  );

  // STATUTS CONSTITUTIFS
  children.push(
    new Paragraph({
      children: [
        sasuRun("STATUTS CONSTITUTIFS", { bold: true, size: 56, color: SASU_NAVY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
  );

  // Subtitle italic
  children.push(
    new Paragraph({
      children: [
        sasuRun("Société par Actions Simplifiée Unipersonnelle", {
          italics: true,
          size: 28,
          color: SASU_NAVY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Thin navy horizontal line
  children.push(
    new Paragraph({
      text: "",
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SASU_NAVY } },
      spacing: { after: 300 },
    }),
  );

  // Empty space
  for (let i = 0; i < 4; i++) {
    children.push(sasuEmptyLine(100));
  }

  // Meta info lines
  children.push(
    new Paragraph({
      children: [
        sasuRun("Dénomination sociale : ", { size: 24, color: SASU_NAVY }),
        sasuRun(meta.denomination, { bold: true, size: 24, color: SASU_NAVY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
  );

  children.push(
    new Paragraph({
      children: [
        sasuRun("Capital social : ", { size: 24, color: SASU_NAVY }),
        sasuRun(`${meta.capital} euros`, { bold: true, size: 24, color: SASU_NAVY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
  );

  children.push(
    new Paragraph({
      children: [
        sasuRun("Siège social : ", { size: 24, color: SASU_NAVY }),
        sasuRun(meta.siege, { bold: true, size: 24, color: SASU_NAVY }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Empty space before bottom tag
  for (let i = 0; i < 6; i++) {
    children.push(sasuEmptyLine(100));
  }

  // Bottom tag
  children.push(
    new Paragraph({
      children: [
        sasuRun("LegalCorners — Statuts constitutifs", {
          size: 16,
          color: SASU_GRAY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
  );

  return children;
}

function buildSasuHeader(denomination: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          sasuRun(denomination, { bold: true, size: 16, color: SASU_NAVY }),
          sasuRun(" | Statuts constitutifs — SASU", { size: 16, color: SASU_NAVY }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: SASU_NAVY } },
        spacing: { after: 80 },
      }),
    ],
  });
}

function buildSasuFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "Page ", size: 16, color: SASU_GRAY, font: "Cambria" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: SASU_GRAY, font: "Cambria" }),
          new TextRun({ text: " sur ", size: 16, color: SASU_GRAY, font: "Cambria" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: SASU_GRAY, font: "Cambria" }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" } },
        spacing: { before: 80 },
      }),
    ],
  });
}

function parseSasuBody(text: string): Array<Paragraph | Table> {
  const lines = text.split("\n");
  const result: Array<Paragraph | Table> = [];
  let i = 0;
  let lastWasHeading = false;

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    // ── Empty line ──
    if (!t) {
      result.push(sasuEmptyLine(60));
      i++;
      lastWasHeading = false;
      continue;
    }

    // ── Separator: === → thick navy line ──
    if (/^[═=]{3,}$/.test(t)) {
      result.push(
        new Paragraph({
          text: "",
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: SASU_NAVY } },
          spacing: { after: 120 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Separator: --- → thin gray line ──
    if (/^[-─]{3,}$/.test(t)) {
      result.push(
        new Paragraph({
          text: "",
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" } },
          spacing: { after: 80 },
        }),
      );
      i++;
      lastWasHeading = true;
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
        result.push(sasuEmptyLine(120));
      }
      lastWasHeading = false;
      continue;
    }

    // Strip markdown heading prefix for detection
    const mdH2 = /^#{2}\s+(.+)$/.exec(t);
    const mdH3 = /^#{3}\s+(.+)$/.exec(t);
    const mdH4 = /^#{4}\s+(.+)$/.exec(t);

    // ── TITRE lines: ## TITRE X — ... or plain TITRE X — ... ──
    const titreContent = mdH2
      ? mdH2[1]
      : /^TITRE\s/i.test(t)
        ? t
        : null;

    if (titreContent && /TITRE\s/i.test(titreContent)) {
      const clean = titreContent.replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [
            sasuRun(clean.toUpperCase(), { bold: true, size: 26, color: SASU_NAVY }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: SASU_NAVY } },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── SOMMAIRE ──
    if (/^(#{1,3}\s+)?SOMMAIRE\s*$/i.test(t)) {
      result.push(
        new Paragraph({
          children: [sasuRun("SOMMAIRE", { bold: true, size: 28, color: SASU_NAVY })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 200 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Article lines: ### Article X — ... or plain Article X ──
    const articleContent = mdH3
      ? mdH3[1]
      : /^Article\s+\d+/i.test(t)
        ? t
        : null;

    if (articleContent && /Article\s+\d+/i.test(articleContent)) {
      const clean = articleContent.replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [sasuRun(clean, { bold: true, size: 23, color: SASU_NAVY })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 280, after: 120 },
          border: { left: { style: BorderStyle.THICK, size: 6, color: SASU_NAVY } },
          shading: { type: ShadingType.SOLID, color: SASU_LIGHT_BG, fill: SASU_LIGHT_BG },
          indent: { left: 200 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Sub-article: #### X.X — ... or lines starting with X.X ──
    const subContent = mdH4
      ? mdH4[1]
      : /^\d+\.\d+\s/.test(t)
        ? t
        : null;

    if (subContent && /\d+\.\d+/.test(subContent)) {
      const clean = subContent.replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [
            sasuRun(clean, { bold: true, italics: true, size: 22, color: SASU_NAVY }),
          ],
          spacing: { before: 200, after: 80 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── H2 that is not TITRE (DÉCLARATIONS PRÉLIMINAIRES, etc.) ──
    if (mdH2) {
      const clean = mdH2[1].replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [sasuRun(clean, { bold: true, size: 24, color: SASU_NAVY })],
          spacing: { before: 300, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SASU_NAVY } },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Plain section headers (DÉCLARATIONS PRÉLIMINAIRES, etc.) ──
    if (
      /^(D[EÉ]CLARATIONS?\s+PR[EÉ]LIMINAIRES?|PRÉAMBULE|DISPOSITIONS?\s+G[EÉ]N[EÉ]RALES?)/i.test(
        t.replace(/\*\*/g, ""),
      )
    ) {
      const clean = t.replace(/\*\*/g, "").replace(/^#+\s*/, "");
      result.push(
        new Paragraph({
          children: [sasuRun(clean, { bold: true, size: 24, color: SASU_NAVY })],
          spacing: { before: 300, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SASU_NAVY } },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Signature blocks ──
    if (
      /^(Fait\s+[àa]|Signature\s*:?|L[''']Associ[éeÉE]|LE PR[EÉ]SIDENT|L[''']ASSOCI[EÉ]\s+UNIQUE)/i.test(
        t.replace(/\*\*/g, ""),
      )
    ) {
      const clean = t.replace(/\*\*/g, "").replace(/^#+\s*/, "");
      result.push(
        new Paragraph({
          children: [sasuRun(clean, { bold: true, size: 22, color: SASU_NAVY })],
          spacing: { before: 300, after: 80 },
        }),
      );
      i++;
      lastWasHeading = false;
      continue;
    }

    // ── H3 not matched as article ──
    if (mdH3) {
      const clean = mdH3[1].replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [sasuRun(clean, { bold: true, size: 22, color: SASU_NAVY })],
          spacing: { before: 200, after: 80 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── H4 not matched as sub-article ──
    if (mdH4) {
      const clean = mdH4[1].replace(/\*\*/g, "");
      result.push(
        new Paragraph({
          children: [
            sasuRun(clean, { bold: true, italics: true, size: 22, color: SASU_NAVY }),
          ],
          spacing: { before: 180, after: 80 },
        }),
      );
      i++;
      lastWasHeading = true;
      continue;
    }

    // ── Strip remaining heading markers ──
    const cleanT = t.replace(/^#+\s*/, "");

    // ── Bullet points ──
    if (/^[•*]\s/.test(cleanT) || (/^-\s/.test(cleanT) && !cleanT.startsWith("---"))) {
      const bulletText = cleanT.replace(/^[•*\-]\s+/, "");
      result.push(
        new Paragraph({
          children: [
            sasuRun("–  ", { size: 21 }),
            ...sasuParseInline(bulletText, 21, SASU_NAVY),
          ],
          indent: { left: 400, hanging: 200 },
          spacing: { after: 60 },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      i++;
      lastWasHeading = false;
      continue;
    }

    // ── Default body paragraph ──
    result.push(
      new Paragraph({
        children: sasuParseInline(cleanT, 22, SASU_NAVY),
        spacing: { after: 80, line: 360 },
        alignment: AlignmentType.JUSTIFIED,
        indent: lastWasHeading ? undefined : { firstLine: 284 }, // 0.5cm = ~284 twips
      }),
    );
    i++;
    lastWasHeading = false;
  }

  return result;
}

export async function generateStatutsSasuDocx(
  statutsText: string,
  meta: { denomination: string; capital: string; siege: string },
): Promise<Blob> {
  const coverChildren = buildSasuCoverPage(meta);
  const bodyChildren = parseSasuBody(statutsText);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Cambria", size: 22, color: SASU_NAVY },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [
      // Cover page section (no header, has footer)
      {
        properties: {
          page: { margin: SASU_PAGE_MARGINS },
        },
        footers: { default: buildSasuFooter() },
        children: coverChildren,
      },
      // Content section (header + footer)
      {
        properties: {
          page: { margin: SASU_PAGE_MARGINS },
        },
        headers: { default: buildSasuHeader(meta.denomination) },
        footers: { default: buildSasuFooter() },
        children: bodyChildren,
      },
    ],
  });

  return Packer.toBlob(doc);
}
