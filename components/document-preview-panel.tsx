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

/** Convert box-drawing separators (═══, ───, ___) to markdown --- */
function normalizeMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (/^[═=]{3,}$/.test(t)) return "---";
      if (/^[─\-_]{3,}$/.test(t)) return "---";
      return line;
    })
    .join("\n");
}

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
  const cover = parseCoverData(text);
  const bodyText = isDeclaration
    ? normalizeMarkdown(text)
    : normalizeMarkdown(stripCoverBlock(text));

  const handleDownloadPdf = async () => {
    if (!pagesRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pages = pagesRef.current.querySelectorAll<HTMLElement>("[data-a4-page]");
    if (!pages.length) return;

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
    }

    pdf.save(pdfFileName);
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

          {/* ══ PAGE DE GARDE (acte/PV seulement) ══ */}
          {!isDeclaration && (
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
          <A4Page pageNumber={isDeclaration ? 1 : 2}>
            <article
              className={`
                doc-prose prose prose-sm max-w-none
                prose-headings:font-bold
                prose-h1:text-xl prose-h1:text-center prose-h1:pb-4 prose-h1:mb-8
                prose-h2:text-sm prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-wide prose-h2:mt-8 prose-h2:mb-3
                prose-h2:underline prose-h2:decoration-[#0D2459] prose-h2:underline-offset-4
                prose-h3:text-sm prose-h3:font-bold prose-h3:text-[#0D2459] prose-h3:mt-6 prose-h3:mb-2
                prose-h3:underline prose-h3:decoration-[#0D2459] prose-h3:underline-offset-2
                prose-p:text-sm prose-p:leading-[1.8] prose-p:mb-6
                prose-li:text-sm prose-li:leading-[1.8]
                prose-strong:font-bold
                prose-hr:border-gray-400 prose-hr:my-8
                [&_blockquote]:text-xs [&_blockquote]:italic [&_blockquote]:border-l-2 [&_blockquote]:border-[#5B8DEF] [&_blockquote]:pl-3
                [&_p]:hyphens-auto [&_p]:break-words
                [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_table]:my-4
                [&_thead_tr]:bg-[#0D2459]
                [&_thead_th]:text-white [&_thead_th]:font-bold [&_thead_th]:px-3 [&_thead_th]:py-2 [&_thead_th]:text-left [&_thead_th]:border [&_thead_th]:border-[#0D2459]
                [&_tbody_tr:nth-child(odd)]:bg-white
                [&_tbody_tr:nth-child(even)]:bg-[#F5F6FA]
                [&_td]:text-[#0D2459] [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-gray-300 [&_td]:align-top [&_td]:text-xs
                [&_td:first-child]:font-semibold [&_td:first-child]:w-[32%]
                [&_td:last-child]:w-[68%]
                ${isDeclaration
                  ? "prose-h1:text-[#1A3A6E] prose-p:text-gray-800 prose-p:text-justify prose-li:text-gray-800 prose-strong:text-gray-800"
                  : "prose-headings:text-[#0D2459] prose-h1:border-b-2 prose-h1:border-[#0D2459] prose-h2:text-[#0D2459] prose-p:text-[#0D2459] prose-p:text-justify prose-li:text-[#0D2459] prose-strong:text-[#0D2459] [&_blockquote]:text-[#0D2459]/70"
                }
              `}
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
        data-a4-page=""
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
