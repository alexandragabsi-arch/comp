"use client";

import { useRef } from "react";
import { X, FileText, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentPreviewPanelProps {
  title: string;
  text: string;
  docxBlobUrl: string;
  docxFileName: string;
  pdfFileName: string;
  onClose: () => void;
}

/** Extract short party name from whatever precedes "— Rôle" */
function extractPartyName(text: string, role: string): string | null {
  // Try bold format first: **NAME** — Rôle
  const bold = text.match(new RegExp(`\\*\\*(.+?)\\*\\*[^\\n]*[—–-]\\s*${role}`, "i"));
  if (bold) return bold[1].trim();

  // Plain format: find line(s) before "— Rôle"
  const idx = text.search(new RegExp(`[—–-]\\s*${role}`, "im"));
  if (idx === -1) return null;

  const before = text.slice(0, idx).trimEnd();
  // Get last non-empty line
  const lines = before.split("\n").filter((l) => l.trim());
  const lastLine = lines[lines.length - 1] || "";
  const cleaned = lastLine
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^(?:La société|la société|Entre la société|M\.|Mme)\s+/i, "")
    .trim();
  return cleaned.split(",")[0].trim() || null;
}

function parseCoverData(text: string) {
  const h1 = text.match(/^#\s+(.+)$/m);
  const h2 = text.match(/^##\s+(.+)$/m);
  const soc =
    text.match(/\*\*Société cible\s*[:\s]+(.+?)\*\*/) ||
    text.match(/Soci[eé]t[eé] cible\s*:\s*([^\n]+)/i);
  const date = text.match(/Fait à\s+(.+?),?\s+le\s+(\d{1,2}\s+\w+\s+\d{4})/);
  const disclaimer = text.match(/>\s*\*?([^*\n]{10,})\*?/);

  const title = h1 ? h1[1] : "Document juridique";
  const rawSubtitle = h2 ? h2[1] : null;
  // Suppress subtitle if it's already contained in the title (avoids double display)
  const subtitle =
    rawSubtitle && !title.toLowerCase().includes(rawSubtitle.toLowerCase())
      ? rawSubtitle
      : null;

  // Strip any remaining ** around société name
  const societeRaw = soc ? soc[1].trim() : null;
  const societe = societeRaw ? societeRaw.replace(/\*\*/g, "").trim() : null;

  return {
    doctitle: title,
    subtitle,
    cedant: extractPartyName(text, "Cédant"),
    cessionnaire: extractPartyName(text, "Cessionnaire"),
    societe,
    date: date ? `Fait à ${date[1]}, le ${date[2]}` : null,
    disclaimer: disclaimer ? disclaimer[1].trim() : null,
  };
}

function stripCoverBlock(text: string): string {
  const idx = text.indexOf("\n---");
  if (idx === -1) return text;
  const second = text.indexOf("\n---", idx + 4);
  if (second === -1) return text.slice(idx + 4);
  return text.slice(second + 4).trimStart();
}

function normalizeMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      // Remove separator lines entirely (═══, ───, ---) — don't convert to <hr>
      if (/^[═=]{3,}$/.test(t)) return "";
      if (/^[─\-_]{3,}$/.test(t)) return "";
      return line;
    })
    .join("\n");
}

// ─── PDF GENERATION ──────────────────────────────────────────────────────────

async function generatePDF(
  text: string,
  pdfFileName: string,
  isDeclaration: boolean,
  cover: ReturnType<typeof parseCoverData>,
  bodyText: string
) {
  const { jsPDF } = await import("jspdf");

  const PW = 210, PH = 297;
  const ML = 25, MR = 25, MT = 25, MB = 22;
  const CW = PW - ML - MR; // 160 mm
  const NAVY: [number, number, number] = [13, 36, 89];
  const BLUE: [number, number, number] = [91, 141, 239];

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ── helpers ──────────────────────────────────────────────────────────────
  let pageNum = 1;

  const addFooter = () => {
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.2);
    doc.line(ML, PH - MB + 4, PW - MR, PH - MB + 4);
    doc.setFont("times", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`— ${isDeclaration ? pageNum : pageNum - 1} —`, PW / 2, PH - MB + 10, { align: "center" });
  };

  let y = MT;

  const ensureSpace = (needed: number) => {
    if (y + needed > PH - MB) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = MT;
    }
  };

  // Strip **bold** markers from a string
  const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "");

  // Render paragraph with justified text, returns new y
  const renderPara = (raw: string, indent = ML, extraColor?: [number, number, number]) => {
    const stripped = plain(raw);
    if (!stripped.trim()) return;

    const isSubHead = /^\d+\.\d+/.test(stripped) || /^\*\*[^*]+\*\*$/.test(raw.trim());

    if (isSubHead) {
      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...(extraColor ?? NAVY));
    } else {
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...(extraColor ?? ([30, 30, 30] as [number, number, number])));
    }

    const lineW = PW - indent - MR;
    const lines = doc.splitTextToSize(stripped, lineW);
    const h = lines.length * 5.2;
    ensureSpace(h + 4);

    if (isSubHead) {
      doc.text(lines, indent, y + 5.2);
    } else {
      doc.text(lines, indent, y + 5.2, { align: "justify", maxWidth: lineW });
    }
    y += h + 4;
  };

  // ── COVER PAGE (acte/PV) ─────────────────────────────────────────────────
  if (!isDeclaration) {
    // Top bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 5, "F");

    // Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text("Legal", 15, 14);
    doc.setFont("helvetica", "normal");
    doc.text("corners", 28.5, 14);

    // Title
    const titleText = plain(cover.doctitle).toUpperCase();
    const titleLines = doc.splitTextToSize(titleText, CW);
    const titleY = 68;

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(1.2);
    doc.line(ML + 8, titleY - 8, PW - MR - 8, titleY - 8);

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.text(titleLines, PW / 2, titleY, { align: "center" });

    const afterTitle = titleY + titleLines.length * 9;
    doc.setDrawColor(...BLUE);
    doc.line(ML + 8, afterTitle + 2, PW - MR - 8, afterTitle + 2);

    // Subtitle
    if (cover.subtitle) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 80, 150);
      doc.text(plain(cover.subtitle), PW / 2, afterTitle + 13, { align: "center" });
    }

    // Parties boxes
    if (cover.cedant || cover.cessionnaire) {
      const bW = 58, bH = 26, bY = afterTitle + 30;

      const drawBox = (x: number, label: string, name: string) => {
        doc.setFillColor(247, 249, 255);
        doc.setDrawColor(...BLUE);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, bY, bW, bH, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...BLUE);
        doc.text(label, x + bW / 2, bY + 7, { align: "center" });

        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...NAVY);
        const nLines = doc.splitTextToSize(name, bW - 6);
        doc.text(nLines, x + bW / 2, bY + 15, { align: "center" });
      };

      if (cover.cedant) drawBox(ML, "CÉDANT", cover.cedant);

      doc.setFont("times", "normal");
      doc.setFontSize(16);
      doc.setTextColor(...BLUE);
      doc.text("→", PW / 2, bY + 15, { align: "center" });

      if (cover.cessionnaire) drawBox(PW - MR - bW, "CESSIONNAIRE", cover.cessionnaire);
    }

    // Société cible
    if (cover.societe) {
      const socY = afterTitle + 75;
      doc.setFont("times", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text("SOCIÉTÉ CIBLE", PW / 2, socY, { align: "center" });
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...NAVY);
      doc.text(plain(cover.societe), PW / 2, socY + 7, { align: "center" });
    }

    // Date
    if (cover.date) {
      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(cover.date, PW / 2, 240, { align: "center" });
    }

    // Disclaimer
    if (cover.disclaimer) {
      doc.setFont("times", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(185, 185, 185);
      const dLines = doc.splitTextToSize(cover.disclaimer, CW);
      doc.text(dLines, PW / 2, 262, { align: "center" });
    }

    // Bottom bar
    doc.setFillColor(...NAVY);
    doc.rect(0, PH - 5, PW, 5, "F");

    // Start content on page 2
    doc.addPage();
    pageNum = 2;
    y = MT;
  }

  // ── CONTENT ──────────────────────────────────────────────────────────────
  const lines = bodyText.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      y += 1.5;
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-─═_]{3,}$/.test(trimmed)) {
      ensureSpace(5);
      y += 1;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(ML, y, PW - MR, y);
      y += 4;
      i++;
      continue;
    }

    // H1
    if (trimmed.startsWith("# ")) {
      const txt = plain(trimmed.slice(2)).toUpperCase();
      const lns = doc.splitTextToSize(txt, CW);
      ensureSpace(lns.length * 8 + 10);
      y += 5;
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...NAVY);
      doc.text(lns, PW / 2, y + 8, { align: "center" });
      y += lns.length * 8 + 3;
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.5);
      doc.line(ML, y, PW - MR, y);
      y += 5;
      i++;
      continue;
    }

    // H2
    if (trimmed.startsWith("## ")) {
      const txt = plain(trimmed.slice(3)).toUpperCase();
      const lns = doc.splitTextToSize(txt, CW);
      ensureSpace(lns.length * 7 + 10);
      y += 6;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text(lns, ML, y + 7);
      y += lns.length * 7 + 1;
      doc.setDrawColor(180, 190, 220);
      doc.setLineWidth(0.3);
      doc.line(ML, y, PW - MR, y);
      y += 4;
      i++;
      continue;
    }

    // H3
    if (trimmed.startsWith("### ")) {
      const txt = plain(trimmed.slice(4));
      const lns = doc.splitTextToSize(txt, CW);
      ensureSpace(lns.length * 5.5 + 6);
      y += 4;
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(lns, ML, y + 5.5);
      y += lns.length * 5.5 + 3;
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith("|")) {
      const rawTable: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rawTable.push(lines[i].trim());
        i++;
      }

      const rows = rawTable
        .filter((l) => !/^\|[\s\-:|]+\|$/.test(l))
        .map((l) =>
          l.split("|").slice(1, -1).map((c) => plain(c.trim()))
        );

      if (rows.length < 1) continue;

      const cols = rows[0].length;
      // First column wider for definition tables
      const col0W = cols === 2 ? CW * 0.35 : CW / cols;
      const otherW = cols === 2 ? CW * 0.65 : CW / cols;
      const getColW = (ci: number) => (ci === 0 ? col0W : otherW);
      const getColX = (ci: number) => {
        let x = ML;
        for (let k = 0; k < ci; k++) x += getColW(k);
        return x;
      };

      const HEADER_H = 8;
      const ROW_H = 6;

      const [headerRow, ...dataRows] = rows;

      // Check space for header + at least 1 row
      ensureSpace(HEADER_H + ROW_H + 4);
      y += 3;

      const tableStartY = y;

      const drawHeader = (startY: number) => {
        doc.setFillColor(...NAVY);
        doc.rect(ML, startY, CW, HEADER_H, "F");
        doc.setFont("times", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        headerRow.forEach((cell, ci) => {
          const cw = getColW(ci) - 4;
          const cx = getColX(ci) + 2;
          const cLines = doc.splitTextToSize(cell, cw);
          doc.text(cLines, cx, startY + 5.5);
        });
        return startY + HEADER_H;
      };

      y = drawHeader(y);

      dataRows.forEach((row, ri) => {
        if (y + ROW_H > PH - MB) {
          addFooter();
          doc.addPage();
          pageNum++;
          y = MT;
          y = drawHeader(y);
        }

        // Alternate rows
        if (ri % 2 === 0) {
          doc.setFillColor(249, 250, 255);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(ML, y, CW, ROW_H, "F");

        row.forEach((cell, ci) => {
          const cw = getColW(ci) - 4;
          const cx = getColX(ci) + 2;
          if (ci === 0) {
            doc.setFont("times", "bold");
            doc.setTextColor(...NAVY);
          } else {
            doc.setFont("times", "normal");
            doc.setTextColor(30, 30, 30);
          }
          doc.setFontSize(8);
          const cLines = doc.splitTextToSize(cell, cw);
          doc.text(cLines, cx, y + 4);
        });

        // Row separator
        doc.setDrawColor(215, 215, 225);
        doc.setLineWidth(0.2);
        doc.line(ML, y + ROW_H, ML + CW, y + ROW_H);

        // Column separators
        for (let ci = 1; ci < cols; ci++) {
          doc.line(getColX(ci), tableStartY, getColX(ci), y + ROW_H);
        }

        y += ROW_H;
      });

      // Outer border
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.4);
      doc.rect(ML, tableStartY, CW, y - tableStartY, "D");

      y += 5;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const qText = trimmed.replace(/^>\s*\*?/, "").replace(/\*?$/, "");
      const qStripped = plain(qText);
      const qLines = doc.splitTextToSize(qStripped, CW - 8);
      const qH = qLines.length * 4.5 + 6;
      ensureSpace(qH + 3);

      doc.setFillColor(248, 249, 255);
      doc.rect(ML, y, CW, qH, "F");
      doc.setFillColor(...BLUE);
      doc.rect(ML, y, 1.5, qH, "F");

      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 110);
      doc.text(qLines, ML + 5, y + 4);
      y += qH + 3;
      i++;
      continue;
    }

    // List item
    if (trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
      const isNum = /^(\d+)\.\s/.exec(trimmed);
      const bullet = isNum ? `${isNum[1]}.` : "–";
      const txt = plain(isNum ? trimmed.replace(/^\d+\.\s/, "") : trimmed.slice(2));
      const listLines = doc.splitTextToSize(txt, CW - 7);
      const lh = listLines.length * 5 + 2;
      ensureSpace(lh);

      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 30);
      doc.text(bullet, ML, y + 5);
      doc.text(listLines, ML + 6, y + 5, { align: "justify", maxWidth: CW - 7 });
      y += lh;
      i++;
      continue;
    }

    // Regular paragraph
    renderPara(trimmed);
    i++;
  }

  // Footer on last page
  addFooter();

  doc.save(pdfFileName);
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function DocumentPreviewPanel({
  title,
  text,
  docxBlobUrl,
  docxFileName,
  pdfFileName,
  onClose,
}: DocumentPreviewPanelProps) {
  const pagesRef = useRef<HTMLDivElement>(null);

  const isDeclaration = /^#\s+DÉCLARATION/i.test(text.trimStart());
  const isStatuts = /^#\s+STATUTS/i.test(text.trimStart());
  const cover = parseCoverData(text);
  const bodyText = (isDeclaration || isStatuts)
    ? normalizeMarkdown(text)
    : normalizeMarkdown(stripCoverBlock(text));

  const handleDownloadPdf = async () => {
    try {
      const { generateReactPDF } = await import("@/app/lib/generatePdfReact");
      await generateReactPDF(cover, bodyText, isDeclaration || isStatuts, pdfFileName);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      alert("Erreur PDF : " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0D2459] shrink-0 shadow-lg">
        <h2 className="font-semibold text-white text-base truncate">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <a href={docxBlobUrl} download={docxFileName}>
            <Button size="sm"
              className="bg-white/15 border border-white/50 text-white hover:bg-white/25 gap-1.5 text-xs font-medium">
              <FileText className="w-3.5 h-3.5" /> Word (.docx)
            </Button>
          </a>
          <Button size="sm" onClick={handleDownloadPdf}
            className="bg-white/15 border border-white/50 text-white hover:bg-white/25 gap-1.5 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
          <button onClick={onClose} className="ml-3 text-white/60 hover:text-white transition-colors" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Pages scroll area ── */}
      <div className="flex-1 overflow-y-auto py-8 px-4" style={{ background: "#F8F8F5" }}>
        <div ref={pagesRef} className="flex flex-col items-center gap-8 max-w-[900px] mx-auto">

          {/* ══ PAGE DE GARDE ══ */}
          {!isDeclaration && !isStatuts && (
            <A4Page pageNumber={1}>
              <div className="h-full flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-1.5 mb-auto">
                  <Search className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="text-sm font-bold text-[#1E3A8A]">Legal<span className="font-light">corners</span></span>
                </div>

                {/* Main title block */}
                <div className="text-center my-auto py-16">
                  <div className="inline-block border-t-4 border-[#5B8DEF] pt-6 mb-6">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5B8DEF] mb-3">Document juridique</p>
                    <h1 className="text-3xl font-bold text-[#0D2459] leading-tight mb-3">{cover.doctitle}</h1>
                    {cover.subtitle && (
                      <p className="text-base font-medium text-[#1E3A8A] mt-2">{cover.subtitle}</p>
                    )}
                  </div>

                  {/* Parties */}
                  {(cover.cedant || cover.cessionnaire) && (
                    <div className="mt-10 flex items-center justify-center gap-6">
                      {cover.cedant && (
                        <div className="text-center bg-[#F7F9FF] rounded-xl px-6 py-4 border border-[#DBEAFE] min-w-[160px]">
                          <p className="text-[10px] uppercase tracking-wider text-[#5B8DEF] font-semibold mb-1">Cédant</p>
                          <p className="text-sm font-bold text-[#0D2459]">{cover.cedant}</p>
                        </div>
                      )}
                      {cover.cedant && cover.cessionnaire && (
                        <div className="text-[#5B8DEF] text-xl font-light">→</div>
                      )}
                      {cover.cessionnaire && (
                        <div className="text-center bg-[#F7F9FF] rounded-xl px-6 py-4 border border-[#DBEAFE] min-w-[160px]">
                          <p className="text-[10px] uppercase tracking-wider text-[#5B8DEF] font-semibold mb-1">Cessionnaire</p>
                          <p className="text-sm font-bold text-[#0D2459]">{cover.cessionnaire}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Société cible */}
                  {cover.societe && (
                    <div className="mt-5">
                      <p className="text-xs text-gray-500 mb-1">Société cible</p>
                      <p className="font-semibold text-[#1E3A8A] text-sm">{cover.societe}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-5 mt-auto">
                  {cover.date && (
                    <p className="text-sm text-gray-600 mb-2 font-medium">{cover.date}</p>
                  )}
                  {cover.disclaimer && (
                    <p className="text-[9px] text-gray-400 leading-relaxed italic">{cover.disclaimer}</p>
                  )}
                </div>
              </div>
            </A4Page>
          )}

          {/* ══ PAGES DE CONTENU ══ */}
          {isStatuts ? (
            /* For statuts: continuous scroll without A4 page simulation */
            <div className="relative w-full" style={{ maxWidth: "794px" }}>
              <div className="bg-white shadow-xl rounded-sm w-full" style={{ padding: "60px 72px 50px 72px" }}>
                <article style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#0D2459", paddingTop: "20px" }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 style={{ fontSize: "22px", fontWeight: "bold", textAlign: "center", color: "#0D2459", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px", marginTop: "8px", paddingBottom: "12px", borderBottom: "2px solid #0D2459" }}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#0D2459", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", marginTop: "36px", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2.5px solid #0D2459" }}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ fontSize: "11.5px", fontWeight: "bold", color: "#0D2459", marginTop: "24px", marginBottom: "10px", borderLeft: "3px solid #0D2459", backgroundColor: "#F5F6FA", padding: "6px 10px" }}>
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 style={{ fontSize: "11px", fontWeight: "bold", fontStyle: "italic", color: "#0D2459", marginTop: "18px", marginBottom: "8px" }}>
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p style={{ fontSize: "11.5px", lineHeight: "1.85", color: "#0D2459", marginBottom: "14px", textAlign: "justify" }}>
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ fontWeight: "bold", color: "#0D2459" }}>{children}</strong>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ paddingLeft: "18px", marginBottom: "14px" }}>{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li style={{ fontSize: "11.5px", lineHeight: "1.85", color: "#0D2459", marginBottom: "4px" }}>{children}</li>
                      ),
                      hr: () => <div style={{ borderTop: "1px solid #d1d5db", margin: "16px 0" }} />,
                      blockquote: ({ children }) => (
                        <blockquote style={{ borderLeft: "3px solid #5B8DEF", paddingLeft: "12px", margin: "12px 0", color: "#64748b", fontStyle: "italic", fontSize: "10.5px" }}>
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {bodyText}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          ) : (
          <A4Page pageNumber={(isDeclaration) ? 1 : 2}>
            <article style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#0D2459", paddingTop: isDeclaration ? "40px" : "0" }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 style={{ fontSize: isStatuts ? "22px" : "15px", fontWeight: "bold", textAlign: "center", color: "#0D2459", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: isStatuts ? "8px" : (isDeclaration ? "48px" : "20px"), marginTop: "8px", paddingBottom: "12px", borderBottom: "2px solid #0D2459" }}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    isStatuts ? (
                      <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#0D2459", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", marginTop: "36px", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2.5px solid #0D2459" }}>
                        {children}
                      </h2>
                    ) : (
                      <h2 style={{ fontSize: "12px", fontWeight: "bold", color: "#0D2459", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "28px", marginBottom: "10px", textDecoration: "underline", textDecorationColor: "#0D2459", textUnderlineOffset: "4px" }}>
                        {children}
                      </h2>
                    )
                  ),
                  h3: ({ children }) => (
                    isStatuts ? (
                      <h3 style={{ fontSize: "11.5px", fontWeight: "bold", color: "#0D2459", marginTop: "24px", marginBottom: "10px", paddingLeft: "10px", borderLeft: "3px solid #0D2459", backgroundColor: "#F5F6FA", padding: "6px 10px" }}>
                        {children}
                      </h3>
                    ) : (
                      <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0D2459", marginTop: "18px", marginBottom: "8px", textDecoration: "underline", textDecorationColor: "#0D2459", textUnderlineOffset: "3px" }}>
                        {children}
                      </h3>
                    )
                  ),
                  p: ({ children }) => (
                    <p style={{ fontSize: "11.5px", lineHeight: "1.85", color: "#0D2459", marginBottom: "14px", textAlign: "justify", hyphens: "auto" } as React.CSSProperties}>
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: "bold", color: "#0D2459" }}>{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: "18px", marginBottom: "14px" }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: "18px", marginBottom: "14px" }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ fontSize: "11.5px", lineHeight: "1.85", color: "#0D2459", marginBottom: "4px" }}>{children}</li>
                  ),
                  table: ({ children }) => (
                    <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0", fontSize: "11px" }}>
                      {children}
                    </table>
                  ),
                  thead: ({ children }) => (
                    <thead style={{ backgroundColor: "#0D2459" }}>{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th style={{ color: "white", padding: "8px 12px", textAlign: "left", fontWeight: "bold", fontSize: "11px", border: "1px solid #0D2459" }}>
                      {children}
                    </th>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  td: ({ children }) => (
                    <td style={{ padding: "7px 12px", border: "1px solid #e5e7eb", verticalAlign: "top", color: "#1e293b", lineHeight: "1.55", fontSize: "11px" }}>
                      {children}
                    </td>
                  ),
                  hr: () => isStatuts
                    ? <div style={{ borderTop: "1px solid #d1d5db", margin: "16px 0" }} />
                    : null,
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: "3px solid #5B8DEF", paddingLeft: "12px", margin: "12px 0", color: "#64748b", fontStyle: "italic", fontSize: "10.5px" }}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {bodyText}
              </ReactMarkdown>
            </article>
          </A4Page>
          )}

        </div>
      </div>
    </div>
  );
}

function A4Page({ children, pageNumber }: { children: React.ReactNode; pageNumber: number }) {
  return (
    <div className="relative w-full" style={{ maxWidth: "794px" }}>
      <div
        data-a4-page=""
        className="bg-white shadow-xl rounded-sm w-full"
        style={{ minHeight: "1123px", padding: "60px 72px 50px 72px" }}
      >
        {children}
        {/* Numéro de page en bas de la page blanche */}
        <div style={{
          position: "absolute",
          bottom: "18px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "10px",
          color: "#9ca3af",
          borderTop: "1px solid #e5e7eb",
          marginLeft: "72px",
          marginRight: "72px",
          paddingTop: "6px",
        }}>
          — {pageNumber} —
        </div>
      </div>
    </div>
  );
}
