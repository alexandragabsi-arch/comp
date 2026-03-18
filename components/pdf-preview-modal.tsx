"use client";

import * as React from "react";
import { X, Download } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
}

export function PdfPreviewModal({ isOpen, onClose, pdfUrl, fileName }: PdfPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-[#1E3A8A] truncate">{fileName}</h2>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download={fileName}
              className="flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:underline"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </a>
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden rounded-b-xl">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}
