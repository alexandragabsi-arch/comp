"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Building2, FileText, Send, Search,
  Loader2, AlertTriangle, ChevronRight, PenTool, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = "", type = "text", required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors bg-white"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const STEPS = [
  { id: 1, label: "Société" },
  { id: 2, label: "Modification" },
  { id: 3, label: "Documents" },
  { id: 4, label: "Dépôt" },
];

const TYPES_MODIFICATION = [
  { value: "dirigeant", label: "Changement de dirigeant" },
  { value: "siege", label: "Transfert de siège social" },
  { value: "denomination", label: "Changement de dénomination" },
  { value: "objet", label: "Modification de l'objet social" },
  { value: "capital_augmentation", label: "Augmentation de capital" },
  { value: "capital_reduction", label: "Réduction de capital" },
  { value: "statuts", label: "Modification des statuts" },
  { value: "exercice", label: "Changement de date de clôture" },
];

const FORMES_JURIDIQUES = [
  { value: "SARL", label: "SARL" },
  { value: "EURL", label: "EURL" },
  { value: "SAS", label: "SAS" },
  { value: "SASU", label: "SASU" },
  { value: "SA", label: "SA" },
  { value: "SCI", label: "SCI" },
  { value: "SNC", label: "SNC" },
  { value: "autre", label: "Autre" },
];

export default function ModificationSocietePage() {
  const [step, setStep] = useState(1);

  // Step 1 — Société
  const [siren, setSiren] = useState("");
  const [denomination, setDenomination] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("SARL");
  const [siegeSocial, setSiegeSocial] = useState("");
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError] = useState("");

  // Step 2 — Modification
  const [typeModif, setTypeModif] = useState("dirigeant");
  const [dateDecision, setDateDecision] = useState("");
  const [lieuDecision, setLieuDecision] = useState("");
  // Dirigeant
  const [ancienDirigeant, setAncienDirigeant] = useState("");
  const [nouveauDirigeant, setNouveauDirigeant] = useState("");
  // Siège
  const [nouvellAdresse, setNouvelleAdresse] = useState("");
  // Dénomination
  const [nouvelleDenomination, setNouvelleDenomination] = useState("");
  // Capital
  const [ancienCapital, setAncienCapital] = useState("");
  const [nouveauCapital, setNouveauCapital] = useState("");
  // Objet / Statuts
  const [details, setDetails] = useState("");

  // Step 3 — Documents (upload or note)
  const [pvGenere, setPvGenere] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function searchSiren() {
    if (siren.replace(/\s/g, "").length < 9) {
      setSirenError("SIREN invalide (9 chiffres requis)");
      return;
    }
    setSirenLoading(true);
    setSirenError("");
    try {
      const res = await fetch(`/api/siren?siren=${siren.replace(/\s/g, "")}`);
      const data = await res.json();
      if (data.denomination) {
        setDenomination(data.denomination);
        setFormeJuridique(data.formeJuridique || "SARL");
        setSiegeSocial(data.siege || "");
      } else {
        setSirenError("Société introuvable. Vérifiez le SIREN.");
      }
    } catch {
      setSirenError("Erreur lors de la recherche.");
    } finally {
      setSirenLoading(false);
    }
  }

  async function generatePV() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(false);
    setPvGenere(true);
  }

  const step1Valid = siren.replace(/\s/g, "").length >= 9 && denomination.trim().length > 0;
  const step2Valid = typeModif.length > 0 && dateDecision.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} className="h-full w-auto object-contain" priority />
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E3A8A] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EFF4FF] mb-4">
            <RefreshCw className="w-6 h-6 text-[#4A6FE3]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A]">Modification de société</h1>
          <p className="text-gray-500 mt-2 text-sm">Changement de dirigeant, siège, dénomination, capital — dossier complet</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                step > s.id ? "bg-[#4A6FE3] text-white" :
                step === s.id ? "bg-[#1E3A8A] text-white ring-4 ring-[#4A6FE3]/20" :
                "bg-white text-gray-400 border border-gray-200"
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn("text-xs font-medium hidden sm:block", step === s.id ? "text-[#1E3A8A]" : "text-gray-400")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Informations de la société</h2>

              {/* SIREN search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  SIREN <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={siren}
                    onChange={(e) => setSiren(e.target.value)}
                    placeholder="123 456 789"
                    maxLength={11}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm"
                  />
                  <button
                    onClick={searchSiren}
                    disabled={sirenLoading}
                    className="px-4 py-3 rounded-xl bg-[#EFF4FF] text-[#4A6FE3] font-medium text-sm hover:bg-[#4A6FE3] hover:text-white transition-colors flex items-center gap-2"
                  >
                    {sirenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Rechercher
                  </button>
                </div>
                {sirenError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {sirenError}
                  </p>
                )}
              </div>

              <Field label="Dénomination sociale" value={denomination} onChange={setDenomination} placeholder="ACME SAS" />
              <SelectField label="Forme juridique" value={formeJuridique} onChange={setFormeJuridique} options={FORMES_JURIDIQUES} />
              <Field label="Siège social actuel" value={siegeSocial} onChange={setSiegeSocial} placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Nature de la modification</h2>

              <SelectField
                label="Type de modification"
                value={typeModif}
                onChange={setTypeModif}
                options={TYPES_MODIFICATION}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de la décision" value={dateDecision} onChange={setDateDecision} type="date" />
                <Field label="Lieu de la réunion" value={lieuDecision} onChange={setLieuDecision} placeholder="Paris" required={false} />
              </div>

              {/* Champs conditionnels selon type */}
              {typeModif === "dirigeant" && (
                <>
                  <Field label="Nom de l'ancien dirigeant" value={ancienDirigeant} onChange={setAncienDirigeant} placeholder="Jean Dupont" />
                  <Field label="Nom du nouveau dirigeant" value={nouveauDirigeant} onChange={setNouveauDirigeant} placeholder="Marie Martin" />
                </>
              )}
              {typeModif === "siege" && (
                <Field label="Nouvelle adresse du siège" value={nouvellAdresse} onChange={setNouvelleAdresse} placeholder="8 avenue Victor Hugo, 69002 Lyon" />
              )}
              {typeModif === "denomination" && (
                <Field label="Nouvelle dénomination" value={nouvelleDenomination} onChange={setNouvelleDenomination} placeholder="Nouvelle Dénomination SAS" />
              )}
              {(typeModif === "capital_augmentation" || typeModif === "capital_reduction") && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Capital actuel (€)" value={ancienCapital} onChange={setAncienCapital} placeholder="10 000" type="number" />
                  <Field label="Nouveau capital (€)" value={nouveauCapital} onChange={setNouveauCapital} placeholder="20 000" type="number" />
                </div>
              )}
              {(typeModif === "objet" || typeModif === "statuts" || typeModif === "exercice") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Détails de la modification <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    placeholder="Décrivez la modification..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm resize-none"
                  />
                </div>
              )}

              {/* Info sur les documents nécessaires */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2">Documents requis pour ce type</p>
                {typeModif === "dirigeant" && <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>PV de décision (AGE ou associé unique)</li>
                  <li>Déclaration de non-condamnation du nouveau dirigeant</li>
                  <li>Formulaire M3 (Cerfa 11682)</li>
                </ul>}
                {typeModif === "siege" && <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>PV de décision / décision de l'associé unique</li>
                  <li>Justificatif du nouveau siège (bail, attestation domiciliation)</li>
                  <li>Formulaire M2 (Cerfa 11682)</li>
                </ul>}
                {(typeModif === "denomination" || typeModif === "objet" || typeModif === "exercice") && <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>PV d'assemblée générale extraordinaire ou décision d'associé unique</li>
                  <li>Statuts mis à jour</li>
                  <li>Formulaire M2 (Cerfa 11682)</li>
                </ul>}
                {(typeModif === "capital_augmentation" || typeModif === "capital_reduction") && <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>PV d'AGE ou décision d'associé unique</li>
                  <li>Statuts modifiés certifiés conformes</li>
                  <li>Attestation bancaire de dépôt (si augmentation)</li>
                  <li>Formulaire M2 (Cerfa 11682)</li>
                </ul>}
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Documents de la modification</h2>

              {/* PV Generation */}
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#4A6FE3]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">PV / Décision d'associé unique</p>
                      <p className="text-xs text-gray-500">Acte officialisant la modification</p>
                    </div>
                  </div>
                  {pvGenere ? (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Généré
                    </span>
                  ) : (
                    <button
                      onClick={generatePV}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A6FE3] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenTool className="w-3.5 h-3.5" />}
                      Générer
                    </button>
                  )}
                </div>
              </div>

              {/* Autres documents nécessaires */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Documents à préparer par vos soins
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  {typeModif === "dirigeant" && <li>Déclaration de non-condamnation du nouveau dirigeant (formulaire INPI)</li>}
                  {(typeModif === "denomination" || typeModif === "objet" || typeModif === "capital_augmentation" || typeModif === "capital_reduction" || typeModif === "statuts") && (
                    <li>Statuts mis à jour, certifiés conformes et signés</li>
                  )}
                  {typeModif === "siege" && <li>Justificatif d'occupation du nouveau local (bail, attestation)</li>}
                  <li>Formulaire M2 ou M3 (Cerfa 11682*02) — disponible sur le site INPI</li>
                </ul>
              </div>

              {/* Résumé */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">Récapitulatif</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-gray-400">Société</span><span className="font-medium">{denomination}</span>
                  <span className="text-gray-400">SIREN</span><span>{siren}</span>
                  <span className="text-gray-400">Modification</span><span className="font-medium">{TYPES_MODIFICATION.find(t => t.value === typeModif)?.label}</span>
                  <span className="text-gray-400">Date</span><span>{dateDecision}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Dépôt au Guichet Unique INPI</h2>

              <div className="bg-green-50 rounded-xl p-5 border border-green-100 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-green-800 mb-1">Dossier prêt pour le dépôt</p>
                <p className="text-xs text-green-700">Votre PV est généré. Déposez maintenant votre modification sur le Guichet Unique.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium text-gray-700">Coûts estimés</p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Frais de greffe (modification)</span><span className="font-medium">~192 € HT</span></div>
                  <div className="flex justify-between"><span>Annonce légale (si requis)</span><span className="font-medium">~150–200 € HT</span></div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-gray-800"><span>Total estimé</span><span>~342–392 € HT</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Déposer sur le Guichet Unique</p>
                <a
                  href="https://procedures.inpi.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                  <span className="flex-1">Déposer ma modification — INPI Guichet Unique</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Étapes sur le Guichet Unique</p>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Connectez-vous avec vos identifiants INPI</li>
                  <li>Choisissez "Déposer une formalité" → "Modification"</li>
                  <li>Renseignez le SIREN : <strong>{siren}</strong></li>
                  <li>Importez vos documents (PV, statuts, formulaire M2/M3)</li>
                  <li>Réglez les frais de greffe en ligne</li>
                </ol>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors",
                step === 1 && "invisible"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Voir mes dossiers <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
