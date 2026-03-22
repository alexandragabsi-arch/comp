"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Search, Loader2,
  AlertTriangle, FileText, Send, X
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const STEPS = [
  { id: 1, label: "Identification" },
  { id: 2, label: "Cessation" },
  { id: 3, label: "Confirmation" },
];

const MOTIFS = [
  { value: "retraite", label: "Départ à la retraite" },
  { value: "emploi", label: "Reprise d'un emploi salarié" },
  { value: "sante", label: "Raisons de santé" },
  { value: "autre_societe", label: "Création / reprise d'une autre société" },
  { value: "activite_insuffisante", label: "Activité insuffisante / non rentable" },
  { value: "autre", label: "Autre motif" },
];

export default function FermetureMicroPage() {
  const [step, setStep] = useState(1);

  // Step 1 — Identification
  const [siret, setSiret] = useState("");
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretError, setSiretError] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nomCommercial, setNomCommercial] = useState("");
  const [adresse, setAdresse] = useState("");
  const [email, setEmail] = useState("");

  // Step 2 — Cessation
  const [dateCessation, setDateCessation] = useState("");
  const [motif, setMotif] = useState("activite_insuffisante");
  const [chiffreAffaires, setChiffreAffaires] = useState("");
  const [derniereDeclaration, setDerniereDeclaration] = useState("");

  // Step 3 — Confirmation
  const [confirmed, setConfirmed] = useState(false);

  async function searchSiret() {
    const clean = siret.replace(/\s/g, "");
    if (clean.length < 14) {
      setSiretError("SIRET invalide (14 chiffres requis)");
      return;
    }
    setSiretLoading(true);
    setSiretError("");
    try {
      const res = await fetch(`/api/siren?siren=${clean.slice(0, 9)}`);
      const data = await res.json();
      if (data.denomination) {
        setNomCommercial(data.denomination);
        setAdresse(data.siege || "");
      } else {
        setSiretError("Entreprise introuvable. Vérifiez le SIRET.");
      }
    } catch {
      setSiretError("Erreur lors de la recherche.");
    } finally {
      setSiretLoading(false);
    }
  }

  const step1Valid = siret.replace(/\s/g, "").length >= 14 && nom.trim().length > 0 && email.trim().length > 0;
  const step2Valid = dateCessation.length > 0 && motif.length > 0;

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A]">Fermeture micro-entreprise</h1>
          <p className="text-gray-500 mt-2 text-sm">Cessez votre activité d'auto-entrepreneur en toute conformité — déclaration INPI / URSSAF</p>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

          {/* ── STEP 1 — Identification ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Votre micro-entreprise</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  SIRET <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="123 456 789 00010"
                    maxLength={17}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm"
                  />
                  <button
                    onClick={searchSiret}
                    disabled={siretLoading}
                    className="px-4 py-3 rounded-xl bg-[#EFF4FF] text-[#4A6FE3] font-medium text-sm hover:bg-[#4A6FE3] hover:text-white transition-colors flex items-center gap-2"
                  >
                    {siretLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Rechercher
                  </button>
                </div>
                {siretError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {siretError}
                  </p>
                )}
              </div>

              {nomCommercial && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs font-semibold text-green-700">Entreprise trouvée</p>
                  <p className="text-sm font-medium text-green-800 mt-0.5">{nomCommercial}</p>
                  {adresse && <p className="text-xs text-green-600 mt-0.5">{adresse}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom" value={nom} onChange={setNom} placeholder="DUPONT" />
                <Field label="Prénom" value={prenom} onChange={setPrenom} placeholder="Jean" />
              </div>
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="jean.dupont@email.fr" />

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Avant de fermer
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>Effectuez votre dernière déclaration de chiffre d'affaires à l'URSSAF</li>
                  <li>Réglez toutes les cotisations sociales dues</li>
                  <li>Clôturez vos éventuels livres de comptes</li>
                  <li>Résiliez vos contrats (assurance pro, bail commercial si applicable)</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Cessation ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Informations de cessation</h2>

              <Field
                label="Date de cessation d'activité"
                value={dateCessation}
                onChange={setDateCessation}
                type="date"
              />

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Motif de cessation <span className="text-red-400">*</span>
                </label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm bg-white"
                >
                  {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <Field
                label="Chiffre d'affaires de la dernière période (€)"
                value={chiffreAffaires}
                onChange={setChiffreAffaires}
                placeholder="0"
                type="number"
                required={false}
              />
              <Field
                label="Période de la dernière déclaration URSSAF"
                value={derniereDeclaration}
                onChange={setDerniereDeclaration}
                placeholder="Ex : T4 2024, ou Décembre 2024"
                required={false}
              />

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2">Ce qui va se passer</p>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Déclaration de cessation au Guichet Unique INPI (radiation du RCS/RM)</li>
                  <li>Radiation automatique de l'URSSAF et des organismes sociaux</li>
                  <li>Fin de l'immatriculation — votre SIRET sera clôturé</li>
                  <li>Pas de frais de greffe pour une micro-entreprise</li>
                </ol>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Confirmation ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Confirmer la fermeture</h2>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">Récapitulatif de votre dossier</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-gray-400">Entrepreneur</span>
                  <span className="font-medium">{prenom} {nom}</span>
                  <span className="text-gray-400">SIRET</span>
                  <span>{siret}</span>
                  {nomCommercial && <><span className="text-gray-400">Entreprise</span><span>{nomCommercial}</span></>}
                  <span className="text-gray-400">Date de cessation</span>
                  <span className="font-medium">{dateCessation}</span>
                  <span className="text-gray-400">Motif</span>
                  <span>{MOTIFS.find(m => m.value === motif)?.label}</span>
                </div>
              </div>

              {/* Coût */}
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Coût de la fermeture</p>
                <p className="text-2xl font-bold text-green-600">Gratuit <span className="text-sm font-normal text-gray-400">(0 € de frais)</span></p>
                <p className="text-xs text-gray-500 mt-1">La radiation d'une micro-entreprise est gratuite via le Guichet Unique INPI.</p>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 cursor-pointer border border-amber-200 bg-amber-50 rounded-xl p-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <p className="text-xs text-amber-800">
                  Je confirme vouloir cesser définitivement mon activité de micro-entrepreneur à la date du <strong>{dateCessation || "…"}</strong>. J'ai effectué ma dernière déclaration de CA et réglé mes cotisations sociales dues.
                </p>
              </label>

              {/* CTA */}
              <a
                href="https://procedures.inpi.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 w-full px-5 py-4 rounded-xl font-medium text-sm transition-opacity",
                  confirmed
                    ? "bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400 pointer-events-none"
                )}
              >
                <Send className="w-5 h-5" />
                <span className="flex-1">Déclarer ma cessation — INPI Guichet Unique</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2">Étapes sur le Guichet Unique</p>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Connectez-vous avec vos identifiants INPI (ou créez un compte)</li>
                  <li>Choisissez "Cessation d'activité d'une entreprise individuelle"</li>
                  <li>Renseignez votre SIRET : <strong>{siret}</strong></li>
                  <li>Indiquez la date de cessation et le motif</li>
                  <li>Validez — la radiation est traitée sous quelques jours</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Après la fermeture
                </p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>Conservez vos documents comptables 10 ans</li>
                  <li>Déclarez vos revenus pro de l'année en cours l'année suivante (impôt sur le revenu)</li>
                  <li>Vos droits à la retraite acquis sont conservés</li>
                </ul>
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
            {step < 3 ? (
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
