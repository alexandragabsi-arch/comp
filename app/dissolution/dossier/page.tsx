"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, FileText, Download, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PVData } from "@/app/api/dissolution/pv/route";
import type { ConvocationData } from "@/app/api/dissolution/convocation/route";

// ── Helpers ─────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder = "", type = "text", required = true,
}: {
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

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "w-12 h-6 rounded-full transition-colors relative",
          value ? "bg-[#5D9CEC]" : "bg-gray-200"
        )}
      >
        <span className={cn(
          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
          value ? "translate-x-6" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Société" },
  { id: 2, label: "Décision" },
  { id: 3, label: "Liquidateur" },
  { id: 4, label: "Génération" },
];

function DossierForm() {
  const params = useSearchParams();
  const stateRaw = params.get("state") ?? "";

  // Decode state from payment page
  let company: { nom: string; formeJuridique: string; siren: string; siege?: string; capital?: string } | null = null;
  let decisionTypeAuto: "associe_unique" | "unanimite" | "age" = "age";
  try {
    const parsed = JSON.parse(atob(stateRaw));
    company = parsed.company ?? null;
    const fj = (company?.formeJuridique ?? "").toUpperCase();
    decisionTypeAuto = fj.includes("EURL") || fj.includes("SASU") ? "associe_unique" : "age";
  } catch { /* */ }

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [convocLoading, setConvocLoading] = useState(false);
  // Convocation extra fields
  const [modeConvocation, setModeConvocation] = useState<"LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres">("LRAR");
  const [emailQuestions, setEmailQuestions] = useState("");
  const [lieuAssemblee, setLieuAssemblee] = useState("");

  // ── Step 1: Société ──────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState(company?.nom ?? "");
  const [formeJuridique, setFormeJuridique] = useState(company?.formeJuridique ?? "");
  const [capital, setCapital] = useState(company?.capital ?? "");
  const [rcsVille, setRcsVille] = useState("");
  const [siren, setSiren] = useState(company?.siren ?? "");
  const [siegeSocial, setSiegeSocial] = useState(company?.siege ?? "");
  const [date, setDate] = useState("");
  const [ville, setVille] = useState("");

  // ── Step 2: Décision ────────────────────────────────────────────────────
  const [decisionType, setDecisionType] = useState<"associe_unique" | "unanimite" | "age">(decisionTypeAuto);
  const [associeUniqueNom, setAssocieUniqueNom] = useState("");
  const [associeUniquePrenom, setAssocieUniquePrenom] = useState("");
  // AGE
  const [ageHeure, setAgeHeure] = useState("");
  const [agePartsPresentes, setAgePartsPresentes] = useState("");
  const [agePartsTotal, setAgePartsTotal] = useState("");
  const [ageTypeActions, setAgeTypeActions] = useState<"actions" | "parts sociales">("parts sociales");
  const [ageCacPresent, setAgeCacPresent] = useState<boolean | null>(null);
  const [ageCacNom, setAgeCacNom] = useState("");
  const [ageCePresent, setAgeCePresent] = useState<boolean | null>(null);
  const [agePresident, setAgePresident] = useState("");
  const [ageResUnanimite, setAgeResUnanimite] = useState([true, true, true, true]);
  const [agePour, setAgePour] = useState(["", "", "", ""]);
  const [ageContre, setAgeContre] = useState(["", "", "", ""]);
  const [ageAbstentions, setAgeAbstentions] = useState(["", "", "", ""]);
  const toggleResUnanimite = (i: number) => {
    const next = [...ageResUnanimite];
    next[i] = !next[i];
    setAgeResUnanimite(next);
  };

  // ── Step 3: Liquidateur ─────────────────────────────────────────────────
  const [liqType, setLiqType] = useState<"personne" | "societe">("personne");
  const [liqNom, setLiqNom] = useState("");
  const [liqPrenom, setLiqPrenom] = useState("");
  const [liqAdresse, setLiqAdresse] = useState("");
  const [liqEstGerant, setLiqEstGerant] = useState(true);
  const [liqSocieteNom, setLiqSocieteNom] = useState("");
  const [liqSocieteRCSVille, setLiqSocieteRCSVille] = useState("");
  const [liqSocieteRCSNum, setLiqSocieteRCSNum] = useState("");
  const [liqSocieteRep, setLiqSocieteRep] = useState("");
  const [liqRemuneration, setLiqRemuneration] = useState("");
  const [siegeLiquidation, setSiegeLiquidation] = useState<"siege_social" | "domicile_liquidateur" | "autre">("siege_social");
  const [siegeLiquidationAdresse, setSiegeLiquidationAdresse] = useState("");

  // ── Build PVData ─────────────────────────────────────────────────────────
  function buildData(): PVData {
    return {
      companyName,
      formeJuridique,
      capital,
      rcsVille,
      siren,
      siegeSocial,
      decisionType,
      date,
      ville,
      associeUniqueNom: decisionType !== "age" ? associeUniqueNom : undefined,
      associeUniquePrenom: decisionType !== "age" ? associeUniquePrenom : undefined,
      age: decisionType === "age"
        ? {
            heure: ageHeure,
            partsPresentes: agePartsPresentes,
            partsTotal: agePartsTotal,
            typeActions: ageTypeActions,
            cacPresent: ageCacPresent ?? undefined,
            cacNom: ageCacNom || undefined,
            cePresent: ageCePresent ?? undefined,
            president: agePresident,
            resolutions: ["r1", "r2", "r3", "r4"].map((id, i) => ({
              id,
              unanimite: ageResUnanimite[i],
              pour: agePour[i],
              contre: ageContre[i],
              abstentions: ageAbstentions[i],
            })),
          }
        : undefined,
      liquidateur: {
        type: liqType,
        nom: liqNom || undefined,
        prenom: liqPrenom || undefined,
        adresse: liqAdresse || undefined,
        estGerantActuel: liqEstGerant,
        societeNom: liqSocieteNom || undefined,
        societeRCSVille: liqSocieteRCSVille || undefined,
        societeRCSNumero: liqSocieteRCSNum || undefined,
        societeRepresentantPar: liqSocieteRep || undefined,
        remuneration: liqRemuneration || undefined,
      },
      siegeLiquidation,
      siegeLiquidationAdresse: siegeLiquidation === "autre" ? siegeLiquidationAdresse : undefined,
    };
  }

  async function generateConvocation() {
    setConvocLoading(true);
    try {
      const data: ConvocationData = {
        companyName,
        formeJuridique,
        capital,
        siegeVille: ville,
        siegeAdresse: siegeSocial,
        rcsVille,
        sirenNumero: siren,
        modeConvocation,
        date,
        heure: ageHeure || "10h00",
        lieuAssemblee: lieuAssemblee || `au siège social : ${siegeSocial}`,
        emailQuestions,
        dirigeant: formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant",
        decisionType,
        siegeLiquidation,
        siegeLiquidationAdresse,
        liqType,
        liqNom,
        liqPrenom,
        liqAdresse,
        liqEstGerant,
        liqSocieteNom,
        liqSocieteRCSVille,
        liqSocieteRCSNum,
        liqSocieteRep,
        liqRemuneration,
      };
      const res = await fetch("/api/dissolution/convocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Convocation_AGE_${companyName.replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur génération convocation.");
    } finally {
      setConvocLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/dissolution/pv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildData()),
      });
      if (!res.ok) throw new Error("Erreur génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PV_Dissolution_${companyName.replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setStep(4);
    } catch {
      alert("Erreur lors de la génération du document.");
    } finally {
      setLoading(false);
    }
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Image src="/images/logo.svg" alt="LegalCorners" width={120} height={30} /></Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                step > s.id ? "bg-green-500 text-white" :
                step === s.id ? "bg-[#5D9CEC] text-white" : "bg-gray-100 text-gray-400"
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn("font-medium", step === s.id ? "text-[#1E3A8A]" : "text-gray-400")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
        {company && <span className="text-xs text-gray-400 hidden md:block">{company.nom}</span>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Étape 1 : Société ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-[#5D9CEC] uppercase tracking-widest">Étape 1 / 3</p>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Informations sur la société</h1>
              <p className="text-sm text-gray-500">Ces informations apparaîtront en en-tête du PV</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <Field label="Dénomination sociale" value={companyName} onChange={setCompanyName} placeholder="NOM DE LA SOCIÉTÉ" />
              <Field label="Forme juridique" value={formeJuridique} onChange={setFormeJuridique} placeholder="SAS, SARL, EURL..." />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Capital (€)" value={capital} onChange={setCapital} placeholder="10 000" />
                <Field label="Ville du RCS" value={rcsVille} onChange={setRcsVille} placeholder="Paris" />
              </div>
              <Field label="Numéro SIREN" value={siren} onChange={setSiren} placeholder="XXX XXX XXX" />
              <Field label="Siège social (adresse complète)" value={siegeSocial} onChange={setSiegeSocial} placeholder="1 rue de la Paix, 75001 Paris" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de la décision" value={date} onChange={setDate} placeholder="JJ/MM/AAAA" />
                <Field label="Ville de signature" value={ville} onChange={setVille} placeholder="Paris" />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!companyName || !formeJuridique || !capital || !rcsVille || !siren || !siegeSocial || !date || !ville}
              className="w-full py-4 bg-[#5D9CEC] hover:bg-[#4a8bd4] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-all text-sm"
            >
              Suivant →
            </button>
          </div>
        )}

        {/* ── Étape 2 : Décision ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-[#5D9CEC] uppercase tracking-widest">Étape 2 / 3</p>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Type de décision</h1>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <Select
                label="Type de procès-verbal"
                value={decisionType}
                onChange={(v) => setDecisionType(v as typeof decisionType)}
                options={[
                  { value: "associe_unique", label: "Décisions de l'associé unique" },
                  { value: "unanimite", label: "Décisions unanimes des associés" },
                  { value: "age", label: "Assemblée générale extraordinaire (AGE)" },
                ]}
              />

              {decisionType !== "age" && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom de l'associé" value={associeUniquePrenom} onChange={setAssocieUniquePrenom} placeholder="Jean" />
                  <Field label="Nom de l'associé" value={associeUniqueNom} onChange={setAssocieUniqueNom} placeholder="DUPONT" />
                </div>
              )}

              {decisionType === "age" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Heure de l'assemblée" value={ageHeure} onChange={setAgeHeure} placeholder="10h00" />
                    <Select
                      label="Type de titres"
                      value={ageTypeActions}
                      onChange={(v) => setAgeTypeActions(v as "actions" | "parts sociales")}
                      options={[
                        { value: "parts sociales", label: "Parts sociales (SARL/SCI)" },
                        { value: "actions", label: "Actions (SAS/SA)" },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={`${ageTypeActions === "actions" ? "Actions" : "Parts"} présentes`} value={agePartsPresentes} onChange={setAgePartsPresentes} placeholder="100" />
                    <Field label={`Total ${ageTypeActions === "actions" ? "actions" : "parts"}`} value={agePartsTotal} onChange={setAgePartsTotal} placeholder="100" />
                  </div>
                  <Field label="Président de séance" value={agePresident} onChange={setAgePresident} placeholder="Jean DUPONT" />

                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Commissaire aux comptes (CAC)</p>
                    <div className="flex gap-3">
                      <button onClick={() => setAgeCacPresent(true)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCacPresent === true ? "border-[#5D9CEC] bg-blue-50 text-[#1E3A8A] font-semibold" : "border-gray-200")}>Présent</button>
                      <button onClick={() => setAgeCacPresent(false)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCacPresent === false ? "border-[#5D9CEC] bg-blue-50 text-[#1E3A8A] font-semibold" : "border-gray-200")}>Absent</button>
                      <button onClick={() => setAgeCacPresent(null)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCacPresent === null ? "border-gray-300 bg-gray-50 text-gray-500 font-semibold" : "border-gray-200")}>Sans objet</button>
                    </div>
                    {ageCacPresent !== null && (
                      <Field label="Nom du CAC" value={ageCacNom} onChange={setAgeCacNom} placeholder="Cabinet X" required={false} />
                    )}
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Représentant du Comité d'entreprise</p>
                    <div className="flex gap-3">
                      <button onClick={() => setAgeCePresent(true)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCePresent === true ? "border-[#5D9CEC] bg-blue-50 text-[#1E3A8A] font-semibold" : "border-gray-200")}>Présent</button>
                      <button onClick={() => setAgeCePresent(false)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCePresent === false ? "border-[#5D9CEC] bg-blue-50 text-[#1E3A8A] font-semibold" : "border-gray-200")}>Absent</button>
                      <button onClick={() => setAgeCePresent(null)} className={cn("flex-1 py-2 rounded-xl text-sm border-2", ageCePresent === null ? "border-gray-300 bg-gray-50 text-gray-500 font-semibold" : "border-gray-200")}>Sans objet</button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vote par résolution</p>
                    {["Résolution 1 – Dissolution", "Résolution 2 – Liquidateur", "Résolution 3 – Missions", "Résolution 4 – Délégation"].map((label, i) => (
                      <div key={i} className="space-y-2">
                        <Toggle label={`${label} — à l'unanimité`} value={ageResUnanimite[i]} onChange={() => toggleResUnanimite(i)} />
                        {!ageResUnanimite[i] && (
                          <div className="grid grid-cols-3 gap-2 pl-2">
                            <Field label="Pour" value={agePour[i]} onChange={(v) => { const n = [...agePour]; n[i] = v; setAgePour(n); }} placeholder="0" required={false} />
                            <Field label="Contre" value={ageContre[i]} onChange={(v) => { const n = [...ageContre]; n[i] = v; setAgeContre(n); }} placeholder="0" required={false} />
                            <Field label="Abstentions" value={ageAbstentions[i]} onChange={(v) => { const n = [...ageAbstentions]; n[i] = v; setAgeAbstentions(n); }} placeholder="0" required={false} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A] transition-colors px-4 py-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-2xl transition-all text-sm"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Liquidateur ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-[#5D9CEC] uppercase tracking-widest">Étape 3 / 3</p>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Liquidateur</h1>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <Select
                label="Le liquidateur est"
                value={liqType}
                onChange={(v) => setLiqType(v as "personne" | "societe")}
                options={[
                  { value: "personne", label: "Une personne physique" },
                  { value: "societe", label: "Une personne morale (société)" },
                ]}
              />

              {liqType === "personne" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" value={liqPrenom} onChange={setLiqPrenom} placeholder="Jean" />
                    <Field label="Nom" value={liqNom} onChange={setLiqNom} placeholder="DUPONT" />
                  </div>
                  <Field label="Adresse du liquidateur" value={liqAdresse} onChange={setLiqAdresse} placeholder="1 rue de la Paix, 75001 Paris" />
                  <Toggle label="Est le gérant / président actuel de la société" value={liqEstGerant} onChange={setLiqEstGerant} />
                </>
              ) : (
                <>
                  <Field label="Dénomination de la société liquidatrice" value={liqSocieteNom} onChange={setLiqSocieteNom} placeholder="CABINET X SARL" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ville du RCS" value={liqSocieteRCSVille} onChange={setLiqSocieteRCSVille} placeholder="Paris" />
                    <Field label="Numéro RCS" value={liqSocieteRCSNum} onChange={setLiqSocieteRCSNum} placeholder="XXX XXX XXX" />
                  </div>
                  <Field label="Représentée par" value={liqSocieteRep} onChange={setLiqSocieteRep} placeholder="M. Jean DUPONT" />
                </>
              )}

              <Field label="Rémunération mensuelle du liquidateur (€) — laisser vide si aucune" value={liqRemuneration} onChange={setLiqRemuneration} placeholder="0" required={false} />

              {decisionType === "age" && (
                <>
                  <Select
                    label="Mode de convocation"
                    value={modeConvocation}
                    onChange={(v) => setModeConvocation(v as typeof modeConvocation)}
                    options={[
                      { value: "LRAR", label: "LRAR" },
                      { value: "lettre simple", label: "Lettre simple" },
                      { value: "voie électronique", label: "Voie électronique" },
                      { value: "remise en mains propres", label: "Remise en mains propres" },
                    ]}
                  />
                  <Field label="Lieu de l'assemblée" value={lieuAssemblee} onChange={setLieuAssemblee} placeholder="au siège social ou adresse complète" required={false} />
                  <Field label="Email pour questions écrites" value={emailQuestions} onChange={setEmailQuestions} placeholder="contact@societe.fr" type="email" required={false} />
                </>
              )}

              <Select
                label="Siège de la liquidation"
                value={siegeLiquidation}
                onChange={(v) => setSiegeLiquidation(v as typeof siegeLiquidation)}
                options={[
                  { value: "siege_social", label: "Au siège de la société" },
                  { value: "domicile_liquidateur", label: "Au domicile du liquidateur" },
                  { value: "autre", label: "Autre adresse" },
                ]}
              />
              {siegeLiquidation === "autre" && (
                <Field label="Adresse du siège de liquidation" value={siegeLiquidationAdresse} onChange={setSiegeLiquidationAdresse} placeholder="1 rue X, 75001 Paris" />
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A] transition-colors px-4 py-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 py-4 bg-[#1E3A8A] hover:bg-[#162d6e] disabled:bg-gray-200 text-white font-semibold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Générer et télécharger le PV (.docx)
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Succès ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="text-center space-y-6 py-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">PV généré avec succès !</h1>
              <p className="text-gray-500 text-sm mt-1">Votre document a été téléchargé au format Word (.docx)</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 text-left space-y-3">
              <p className="text-sm font-semibold text-[#1E3A8A]">Prochaines étapes :</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] flex-shrink-0 mt-0.5" />Faire signer le PV par l'associé unique / les associés</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] flex-shrink-0 mt-0.5" />Publier l'annonce légale de dissolution dans un journal habilité</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] flex-shrink-0 mt-0.5" />Déposer le dossier de dissolution au greffe du tribunal</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#5D9CEC] text-[#5D9CEC] font-semibold rounded-2xl hover:bg-blue-50 transition-all text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Re-télécharger le PV
              </button>
              {decisionType === "age" && (
                <button
                  onClick={generateConvocation}
                  disabled={convocLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-2xl hover:bg-blue-50 transition-all text-sm"
                >
                  {convocLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Télécharger la Convocation AGE
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DossierPage() {
  return (
    <Suspense>
      <DossierForm />
    </Suspense>
  );
}
