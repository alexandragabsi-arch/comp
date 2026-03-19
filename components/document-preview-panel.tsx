"use client";

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

/** Extract key metadata from the markdown text for the cover page */
function parseCoverData(text: string) {
  const h1 = text.match(/^#\s+(.+)$/m);
  const h2 = text.match(/^##\s+(.+)$/m);
  const cedant = text.match(/\*\*(.+?)\*\*\s*[—–-]\s*Cédant/);
  const cess = text.match(/\*\*(.+?)\*\*\s*[—–-]\s*Cessionnaire/);
  const soc = text.match(/\*\*Société cible\s*[:\s]+(.+?)\*\*/);
  const date = text.match(/Fait à\s+(.+?),?\s+le\s+(\d{1,2}\s+\w+\s+\d{4})/);
  const disclaimer = text.match(/>\s*\*([^*]+)\*/);

  return {
    doctitle: h1 ? h1[1] : "Document juridique",
    subtitle: h2 ? h2[1] : null,
    cedant: cedant ? cedant[1] : null,
    cessionnaire: cess ? cess[1] : null,
    societe: soc ? soc[1] : null,
    date: date ? `Fait à ${date[1]}, le ${date[2]}` : null,
    disclaimer: disclaimer ? disclaimer[1] : null,
  };
}

/** Strip the very first header block (cover info) so we don't duplicate it */
function stripCoverBlock(text: string): string {
  const idx = text.indexOf("\n---");
  if (idx === -1) return text;
  const second = text.indexOf("\n---", idx + 4);
  if (second === -1) return text.slice(idx + 4);
  return text.slice(second + 4).trimStart();
}

/** Remove **...** markers so they don't show as literal asterisks */
function cleanBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function DocumentPreviewPanel({
  title,
  text,
  docxBlobUrl,
  docxFileName,
  pdfFileName,
  onClose,
}: DocumentPreviewPanelProps) {
  const cover = parseCoverData(text);
  const bodyText = cleanBold(stripCoverBlock(text));

  const handleDownloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const marginL = 22;
    const marginR = 22;
    const marginT = 22;
    const pageWidth = 210 - marginL - marginR;
    const pageHeight = 297 - marginT * 2;
    let y = marginT;

    const addPage = () => { doc.addPage(); y = marginT; };
    const checkPage = (needed: number) => { if (y + needed > marginT + pageHeight) addPage(); };

    const lines = text.split("\n");
    for (const line of lines) {
      const raw = line.trimEnd();
      const isH1 = /^#{1}\s/.test(raw);
      const isH2 = /^#{2}\s/.test(raw);
      const isH3 = /^#{3,}\s/.test(raw);
      const trimmed = raw.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim();
      const isArticle = /^(ARTICLE \d+|RÉSOLUTION \d+)/i.test(trimmed);
      const isEmpty = !trimmed;
      const isSep = /^[-=─═]{3,}$/.test(trimmed);

      if (isEmpty) { y += 3; continue; }
      if (isSep) {
        checkPage(4);
        doc.setDrawColor(180, 180, 180);
        doc.line(marginL, y, 210 - marginR, y);
        y += 4;
        continue;
      }

      if (isH1) {
        checkPage(14);
        y += 4;
        doc.setFont("helvetica", "bold"); doc.setFontSize(15);
        doc.setTextColor(26, 39, 68);
        const wrapped = doc.splitTextToSize(trimmed, pageWidth);
        for (const wl of wrapped) { doc.text(wl, 105, y, { align: "center" }); y += 7; }
        y += 4;
      } else if (isH2 || isArticle) {
        checkPage(12);
        y += 5;
        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.setTextColor(26, 39, 68);
        if (isArticle) {
          doc.setFillColor(245, 246, 250);
          const wrapped = doc.splitTextToSize(trimmed, pageWidth - 6);
          doc.rect(marginL, y - 4, pageWidth, wrapped.length * 6 + 4, "F");
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(0.8);
          doc.line(marginL, y - 4, marginL, y + wrapped.length * 6);
          doc.setLineWidth(0.2);
          for (const wl of wrapped) { doc.text(wl, marginL + 4, y); y += 6; }
        } else {
          const wrapped = doc.splitTextToSize(trimmed, pageWidth);
          for (const wl of wrapped) { doc.text(wl, marginL, y); y += 6; }
        }
        y += 3;
      } else if (isH3) {
        checkPage(10);
        y += 3;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.setTextColor(26, 39, 68);
        const wrapped = doc.splitTextToSize(trimmed, pageWidth);
        for (const wl of wrapped) { doc.text(wl, marginL, y); y += 5.5; }
        y += 2;
      } else if (/^\|/.test(trimmed)) {
        // Table row — skip (handled as group below via previous logic, simplified here)
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
        const colW = pageWidth / Math.max(cells.length, 1);
        checkPage(6);
        cells.forEach((cell, ci) => {
          const wrapped = doc.splitTextToSize(cell, colW - 2);
          doc.text(wrapped[0] || "", marginL + ci * colW + 1, y);
        });
        y += 6;
      } else {
        // Body paragraph
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        const wrapped = doc.splitTextToSize(trimmed, pageWidth);
        for (const wl of wrapped) {
          checkPage(5.5);
          doc.text(wl, marginL, y);
          y += 5.5;
        }
        y += 1.5;
      }
    }
    doc.save(pdfFileName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0D2459] shrink-0 shadow-lg">
        <h2 className="font-semibold text-white text-base truncate">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <a href={docxBlobUrl} download={docxFileName}>
            <Button size="sm" variant="outline"
              className="border-white/50 text-white hover:bg-white/10 hover:text-white gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Word (.docx)
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={handleDownloadPdf}
            className="border-white/50 text-white hover:bg-white/10 hover:text-white gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
          <button onClick={onClose} className="ml-3 text-white/60 hover:text-white transition-colors" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Pages scroll area ── */}
      <div className="flex-1 overflow-y-auto py-8 px-4" style={{ background: "#F8F8F5" }}>
        <div className="flex flex-col items-center gap-8 max-w-[900px] mx-auto">

          {/* ══ PAGE DE GARDE ══ */}
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

          {/* ══ PAGES DE CONTENU ══ */}
          <A4Page pageNumber={2}>
            <article
              className="
                doc-prose prose prose-sm max-w-none
                prose-headings:text-[#0D2459]
                prose-headings:underline
                prose-headings:decoration-[#5B8DEF]
                prose-headings:underline-offset-4
                prose-h1:text-lg prose-h1:font-bold
                prose-h2:text-base prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-6
                prose-p:text-[#0D2459] prose-p:text-sm prose-p:leading-[1.8] prose-p:mb-4
                prose-li:text-[#0D2459] prose-li:text-sm prose-li:leading-[1.8]
                prose-strong:text-[#0D2459]
                prose-table:text-xs
                prose-th:bg-[#F7F9FF] prose-th:text-[#1E3A8A] prose-th:font-semibold
                prose-td:text-[#0D2459] prose-td:border-gray-200
                prose-hr:border-gray-200 prose-hr:my-6
                [&_blockquote]:text-[#0D2459]/60 [&_blockquote]:text-xs [&_blockquote]:italic [&_blockquote]:border-l-[#5B8DEF]
                [&_p]:text-justify [&_p]:hyphens-auto [&_p]:break-words
                [&_p]:orphans-3 [&_p]:widows-3
              "
              lang="fr"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {bodyText}
              </ReactMarkdown>
            </article>
          </A4Page>

        </div>
      </div>
    </div>
  );
}

/** Wrapper that renders an A4-sized page card */
function A4Page({ children, pageNumber }: { children: React.ReactNode; pageNumber: number }) {
  return (
    <div className="relative w-full" style={{ maxWidth: "794px" }}>
      <div
        className="bg-white shadow-xl rounded-sm w-full"
        style={{ minHeight: "1123px", padding: "60px 72px" }}
      >
        {children}
      </div>
      {/* Page number */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 select-none">
        — {pageNumber} —
      </div>
    </div>
  );
}
