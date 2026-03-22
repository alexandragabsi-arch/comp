"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Loader2,
  User, Briefcase, FileText, Send
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label} <span className="text-red-400">*</span>
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
  { id: 1, label: "Identité" },
  { id: 2, label: "Activité" },
  { id: 3, label: "Régime" },
  { id: 4, label: "Dépôt" },
];

export default function CreationAutoEntrepreneurPage() {
  const [step, setStep] = useState(1);

  // Step 1 — Identité
  const [civilite, setCivilite] = useState("M.");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [nationalite, setNationalite] = useState("Française");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");

  // Step 2 — Activité
  const [typeActivite, setTypeActivite] = useState("commerciale");
  const [descriptionActivite, setDescriptionActivite] = useState("");
  const [codeAPE, setCodeAPE] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [siteWeb, setSiteWeb] = useState("");

  // Step 3 — Régime fiscal
  const [regimeFiscal, setRegimeFiscal] = useState("micro_bic");
  const [versementLiberatoire, setVersementLiberatoire] = useState(false);
  const [accreReduction, setAccreReduction] = useState(false);

  const step1Valid = nom.trim().length > 0 && prenom.trim().length > 0 && dateNaissance.length > 0 && adresse.trim().length > 0 && email.trim().length > 0;
  const step2Valid = typeActivite.length > 0 && descriptionActivite.trim().length > 0 && dateDebut.length > 0;

  const regimeFiscalOptions = [
    { value: "micro_bic", label: "Micro-BIC (activité commerciale/artisanale)" },
    { value: "micro_bnc", label: "Micro-BNC (activité libérale)" },
  ];

  const tauxCotisations: Record<string, string> = {
    micro_bic: typeActivite === "artisanale" ? "12,3 %" : "6,2 %",
    micro_bnc: "22,2 %",
  };

  const abattementForfaitaire: Record<string, string> = {
    micro_bic: typeActivite === "artisanale" ? "50 %" : "71 % (achat-revente) / 50 %",
    micro_bnc: "34 %",
  };

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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EFF4FF] mb-4">
            <Briefcase className="w-6 h-6 text-[#4A6FE3]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A]">Création auto-entrepreneur / EI</h1>
          <p className="text-gray-500 mt-2 text-sm">Déclarez votre activité en quelques minutes — 100 % en ligne via le Guichet Unique INPI</p>
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

          {/* ── STEP 1 — Identité ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A] flex items-center gap-2">
                <User className="w-5 h-5" /> Votre identité
              </h2>

              <SelectField
                label="Civilité"
                value={civilite}
                onChange={setCivilite}
                options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom" value={nom} onChange={setNom} placeholder="DUPONT" />
                <Field label="Prénom" value={prenom} onChange={setPrenom} placeholder="Jean" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de naissance" value={dateNaissance} onChange={setDateNaissance} type="date" />
                <Field label="Lieu de naissance" value={lieuNaissance} onChange={setLieuNaissance} placeholder="Paris 15e" required={false} />
              </div>
              <Field label="Nationalité" value={nationalite} onChange={setNationalite} placeholder="Française" required={false} />
              <Field label="Adresse personnelle" value={adresse} onChange={setAdresse} placeholder="12 rue de la Paix, 75001 Paris" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Code postal" value={codePostal} onChange={setCodePostal} placeholder="75001" />
                <Field label="Ville" value={ville} onChange={setVille} placeholder="Paris" />
              </div>
              <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="jean.dupont@email.fr" />
              <Field label="Téléphone" value={telephone} onChange={setTelephone} placeholder="06 12 34 56 78" required={false} />
            </div>
          )}

          {/* ── STEP 2 — Activité ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A] flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Votre activité
              </h2>

              <SelectField
                label="Nature de l'activité"
                value={typeActivite}
                onChange={setTypeActivite}
                options={[
                  { value: "commerciale", label: "Commerciale (achat-revente, négoce)" },
                  { value: "artisanale", label: "Artisanale (fabrication, transformation)" },
                  { value: "liberale", label: "Libérale (prestation intellectuelle)" },
                  { value: "service", label: "Prestation de services commerciale" },
                ]}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Description de l'activité <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={descriptionActivite}
                  onChange={(e) => setDescriptionActivite(e.target.value)}
                  rows={3}
                  placeholder="Ex : Conseil en marketing digital, création de sites web, vente de vêtements..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm resize-none"
                />
              </div>

              <Field
                label="Date de début d'activité"
                value={dateDebut}
                onChange={setDateDebut}
                type="date"
              />
              <Field
                label="Code APE / NAF (si connu)"
                value={codeAPE}
                onChange={setCodeAPE}
                placeholder="Ex : 6201Z"
                required={false}
              />
              <Field
                label="Site web (si existant)"
                value={siteWeb}
                onChange={setSiteWeb}
                placeholder="https://monsite.fr"
                required={false}
              />

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Bon à savoir</p>
                <p className="text-xs text-blue-600">
                  Si votre activité est artisanale, vous devrez vous immatriculer auprès de la Chambre des Métiers et de l'Artisanat (CMA) et potentiellement justifier de qualifications professionnelles.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Régime fiscal ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A] flex items-center gap-2">
                <FileText className="w-5 h-5" /> Régime fiscal et social
              </h2>

              <SelectField
                label="Régime micro"
                value={regimeFiscal}
                onChange={setRegimeFiscal}
                options={regimeFiscalOptions}
              />

              {/* Simulateur simplifié */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Estimations (régime {regimeFiscal === "micro_bic" ? "Micro-BIC" : "Micro-BNC"})</p>
                <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600">
                  <span className="text-gray-400">Cotisations sociales</span>
                  <span className="font-semibold text-gray-800">{tauxCotisations[regimeFiscal]} du CA</span>
                  <span className="text-gray-400">Abattement fiscal</span>
                  <span className="font-semibold text-gray-800">{abattementForfaitaire[regimeFiscal]}</span>
                  <span className="text-gray-400">Plafond CA</span>
                  <span className="font-semibold text-gray-800">{regimeFiscal === "micro_bic" ? typeActivite === "commerciale" ? "188 700 € / an" : "77 700 € / an" : "77 700 € / an"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={versementLiberatoire}
                    onChange={(e) => setVersementLiberatoire(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Versement libératoire de l'impôt</p>
                    <p className="text-xs text-gray-500">Payer l'IR en même temps que les cotisations. Avantageux si faibles revenus globaux du foyer.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accreReduction}
                    onChange={(e) => setAccreReduction(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">ACRE — Aide à la Création/Reprise d'Entreprise</p>
                    <p className="text-xs text-gray-500">Exonération partielle de cotisations sociales la 1ère année (sous conditions). Demande automatique via le formulaire.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Dépôt ── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#1E3A8A]">Création en ligne — Guichet Unique</h2>

              <div className="bg-green-50 rounded-xl p-5 border border-green-100 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-green-800 mb-1">Dossier prêt !</p>
                <p className="text-xs text-green-700">Toutes les informations sont collectées. Finalisez votre déclaration sur le Guichet Unique INPI.</p>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">Récapitulatif</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-gray-400">Entrepreneur</span><span className="font-medium">{civilite} {prenom} {nom}</span>
                  <span className="text-gray-400">Activité</span><span>{descriptionActivite.slice(0, 40)}{descriptionActivite.length > 40 ? "..." : ""}</span>
                  <span className="text-gray-400">Début</span><span>{dateDebut}</span>
                  <span className="text-gray-400">Régime</span><span>{regimeFiscal === "micro_bic" ? "Micro-BIC" : "Micro-BNC"}</span>
                  {accreReduction && <><span className="text-gray-400">ACRE</span><span className="text-green-600">Demandée</span></>}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Coût de la création</p>
                <p className="text-2xl font-bold text-green-600">Gratuit <span className="text-sm font-normal text-gray-400">(0 € de frais de greffe)</span></p>
                <p className="text-xs text-gray-500">La création d'une micro-entreprise / EI est entièrement gratuite via le Guichet Unique INPI.</p>
              </div>

              <a
                href="https://procedures.inpi.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
                <span className="flex-1">Finaliser ma création — INPI Guichet Unique</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2">Sur le Guichet Unique</p>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Créez un compte ou connectez-vous</li>
                  <li>Choisissez "Créer une entreprise individuelle"</li>
                  <li>Renseignez vos informations personnelles et d'activité</li>
                  <li>Cochez l'ACRE si vous y avez droit</li>
                  <li>Validez — vous recevrez votre SIRET sous 1 à 4 semaines</li>
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
                onClick={() => {
                  if (step === 3) {
                    fetch("/api/dossiers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email,
                        company_name: `${prenom} ${nom}`.trim(),
                        type: "creation_auto_entrepreneur",
                        status: "en_cours",
                        data: { typeActivite, descriptionActivite },
                      }),
                    }).catch(() => {});
                  }
                  setStep(s => s + 1);
                }}
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
