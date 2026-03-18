"use client";

import * as React from "react";
import { Calculator } from "lucide-react";

interface SimulateurDroitsProps {
  typeCession: "actions" | "parts-sociales" | null;
  prixTotal: string;
  nombrePartsCedees: string;
  nombrePartsTotal: string;
}

export function SimulateurDroits({
  typeCession,
  prixTotal,
  nombrePartsCedees,
  nombrePartsTotal,
}: SimulateurDroitsProps) {
  const prix = parseFloat(prixTotal.replace(/\s/g, "").replace(",", ".")) || 0;
  const partsCedees = parseFloat(nombrePartsCedees) || 0;
  const partsTotal = parseFloat(nombrePartsTotal) || 1;

  const actifNet = prix;

  let droits = 0;
  let taux = "";
  let base = "";

  if (typeCession === "actions") {
    droits = actifNet * 0.001;
    taux = "0,1%";
    base = "du prix de cession";
    if (droits < 25) droits = 25;
  } else {
    // parts sociales
    const tranche1 = Math.min(actifNet, 23000);
    const tranche2 = Math.max(0, actifNet - 23000);
    droits = tranche1 * 0.03 + tranche2 * 0.05;
    taux = "3% jusqu'à 23 000€, puis 5%";
    base = "du prix de cession";
  }

  const fraisFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(droits);

  return (
    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-5 h-5 text-[#1E3A8A]" />
        <h4 className="font-semibold text-[#1E3A8A]">Estimation droits d&apos;enregistrement</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Type de cession</span>
          <span className="font-medium">{typeCession === "actions" ? "Actions" : "Parts sociales"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Taux applicable</span>
          <span className="font-medium">{taux}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Base de calcul</span>
          <span className="font-medium capitalize">{base}</span>
        </div>
        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
          <span className="font-semibold text-[#1E3A8A]">Droits estimés</span>
          <span className="font-bold text-[#1E3A8A] text-base">{fraisFormatted}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        * Estimation indicative — à confirmer avec votre expert-comptable ou avocat.
      </p>
    </div>
  );
}
