"use client";

import { X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewPanelProps {
  title: string;
  text: string;
  docxBlobUrl: string;
  docxFileName: string;
  pdfFileName: string;
  onClose: () => void;
}

export function DocumentPreviewPanel({
  title,
  text,
  docxBlobUrl,
  docxFileName,
  pdfFileName,
  onClose,
}: DocumentPreviewPanelProps) {
  const handleDownloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    const margin = 20;
    const pageWidth = 210 - margin * 2;
    const pageHeight = 297 - margin * 2;
    const lineHeight = 5.5;
    let y = margin;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trimEnd();
      // Style headers (ALL CAPS lines or lines starting with "ARTICLE")
      const isHeader =
        /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s\-–—]{6,}$/.test(trimmed) ||
        /^ARTICLE\s+\d+/i.test(trimmed);
      if (isHeader && trimmed.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      const wrapped = doc.splitTextToSize(trimmed || " ", pageWidth);
      for (const wl of wrapped) {
        if (y + lineHeight > margin + pageHeight) {
          doc.addPage();
          y = margin;
        }
        doc.text(wl, margin, y);
        y += lineHeight;
      }
      if (isHeader) y += 1; // extra spacing after headers
    }

    doc.save(pdfFileName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#0D2459] shrink-0">
        <h2 className="font-semibold text-white text-lg truncate">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <a href={docxBlobUrl} download={docxFileName}>
            <Button
              size="sm"
              variant="outline"
              className="border-white/60 text-white hover:bg-white/10 hover:text-white gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Word (.docx)
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPdf}
            className="border-white/60 text-white hover:bg-white/10 hover:text-white gap-1.5"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <button
            onClick={onClose}
            className="ml-2 text-white/70 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="max-w-[210mm] mx-auto bg-white shadow-md rounded-sm px-[20mm] py-[20mm] min-h-[297mm]">
          <pre className="whitespace-pre-wrap font-serif text-[10pt] text-gray-900 leading-[1.6]">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
