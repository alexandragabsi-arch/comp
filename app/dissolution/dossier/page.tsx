"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, FileText, Download, Loader2, ArrowLeft, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PVData } from "@/app/api/dissolution/pv/route";
import type { ConvocationData } from "@/app/api/dissolution/convocation/route";
import type { PVLiquidationData } from "@/app/api/dissolution/pv-liquidation/route";
import type { ConvocationLiquidationData } from "@/app/api/dissolution/convocation-liquidation/route";

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
  let initCompany: { nom: string; formeJuridique: string; siren: string } | null = null;
  let initAnswers: Record<string, string> = {};
  try {
    const parsed = JSON.parse(atob(stateRaw));
    initCompany = parsed.company ?? null;
    initAnswers = parsed.answers ?? {};
  } catch { /* */ }

  function autoDecisionType(fj: string): "associe_unique" | "unanimite" | "age" {
    const up = fj.toUpperCase();
    return up.includes("EURL") || up.includes("SASU") ? "associe_unique" : "age";
  }

  const [sirenLoading, setSirenLoading] = useState(!!initCompany?.siren);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [convocLoading, setConvocLoading] = useState(false);
  // Convocation extra fields
  const [modeConvocation, setModeConvocation] = useState<"LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres">("LRAR");
  const [emailQuestions, setEmailQuestions] = useState("");
  const [lieuAssemblee, setLieuAssemblee] = useState("");

  // ── Step 1: Société ──────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState(initCompany?.nom ?? "");
  const [formeJuridique, setFormeJuridique] = useState(initCompany?.formeJuridique ?? "");
  const [capital, setCapital] = useState("");
  const [rcsVille, setRcsVille] = useState("");
  const [siren, setSiren] = useState(initCompany?.siren ?? "");
  const [siegeSocial, setSiegeSocial] = useState("");
  const [date, setDate] = useState("");
  const [ville, setVille] = useState(initCompany ? "" : "");

  // ── Step 2: Décision ────────────────────────────────────────────────────
  const [decisionType, setDecisionType] = useState<"associe_unique" | "unanimite" | "age">(
    autoDecisionType(initCompany?.formeJuridique ?? "")
  );

  // ── Step 2 states (declared here so useEffect can reference setters) ──────
  const [associeUniqueNom, setAssocieUniqueNom] = useState("");
  const [associeUniquePrenom, setAssocieUniquePrenom] = useState("");
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

  // ── Step 3 states ─────────────────────────────────────────────────────────
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

  // ── Fetch SIREN details on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!initCompany?.siren) return;
    fetch(`/api/siren?siren=${initCompany.siren}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        // Société
        setCompanyName(d.denominationSociale || initCompany!.nom);
        setFormeJuridique(d.formeJuridique || initCompany!.formeJuridique);
        setCapital(d.capitalSocial ?? "");
        setRcsVille(d.greffe ?? d.ville ?? "");
        setSiren(d.siren ?? initCompany!.siren);
        const adresse = [d.siegeSocial, d.codePostal, d.ville].filter(Boolean).join(" ");
        setSiegeSocial(adresse);
        setVille(d.ville ?? "");

        // Décision type
        const dt = autoDecisionType(d.formeJuridique || initCompany!.formeJuridique);
        setDecisionType(dt);

        // AGE: total parts from associés
        const totalParts = (d.associes as { nbParts: number }[] ?? []).reduce(
          (sum: number, a: { nbParts: number }) => sum + (a.nbParts ?? 0), 0
        );
        if (totalParts > 0) {
          setAgePartsPresentes(String(totalParts));
          setAgePartsTotal(String(totalParts));
        }

        // Type actions (SAS/SA → actions, sinon parts sociales)
        const fj = (d.formeJuridique ?? "").toUpperCase();
        if (fj.includes("SAS") || fj.includes("SA")) setAgeTypeActions("actions");

        // Liquidateur = dirigeant actuel → pré-remplir
        const dir0 = (d.dirigeants as { nom: string; prenom: string }[] ?? [])[0];
        if (dir0) {
          setAgePresident(`${dir0.prenom} ${dir0.nom}`.trim());
          if (initAnswers.liquidateur === "dirigeant" || dt === "associe_unique") {
            setLiqNom(dir0.nom);
            setLiqPrenom(dir0.prenom);
            setLiqEstGerant(true);
          }
          if (dt === "associe_unique") {
            setAssocieUniqueNom(dir0.nom);
            setAssocieUniquePrenom(dir0.prenom);
          }
        }
        if (initAnswers.liquidateur === "autre") {
          setLiqEstGerant(false);
        }
      })
      .finally(() => setSirenLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Pièces justificatives Greffe ─────────────────────────────────────────
  type JustifKeyDiss = "pvDissolution" | "attestationAL" | "identiteLiquidateur" | "pvLiquidation" | "comptesLiquidation" | "attestationALCloture";
  interface JustifFileDiss { name: string; size: number; }
  const [justifDiss, setJustifDiss] = useState<Partial<Record<JustifKeyDiss, JustifFileDiss>>>({});
  const handleJustifDissUpload = (key: JustifKeyDiss, file: File) => {
    setJustifDiss(prev => ({ ...prev, [key]: { name: file.name, size: file.size } }));
  };

  // ── Phase 2 : Liquidation states ─────────────────────────────────────────
  const [phase2Open, setPhase2Open] = useState(false);
  const [liqDate, setLiqDate] = useState("");
  const [liqHeure, setLiqHeure] = useState("");
  const [liqVille, setLiqVille] = useState("");
  const [liqLieu, setLiqLieu] = useState("");
  const [liqEmail, setLiqEmail] = useState("");
  const [liqModeConvoc, setLiqModeConvoc] = useState<"LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres">("LRAR");
  const [liqDateArret, setLiqDateArret] = useState("");
  const [liqSoldeSigne, setLiqSoldeSigne] = useState<"positif" | "negatif">("positif");
  const [liqSoldeMontant, setLiqSoldeMontant] = useState("");
  const [liqPhase2LoadingPV, setLiqPhase2LoadingPV] = useState(false);
  const [liqPhase2LoadingConvoc, setLiqPhase2LoadingConvoc] = useState(false);
  const [liqResUnanimite, setLiqResUnanimite] = useState([true, true, true, true]);
  const [liqPour, setLiqPour] = useState(["", "", "", ""]);
  const [liqContre, setLiqContre] = useState(["", "", "", ""]);
  const [liqAbstentions, setLiqAbstentions] = useState(["", "", "", ""]);

  async function generatePhase2PV() {
    setLiqPhase2LoadingPV(true);
    try {
      const data: PVLiquidationData = {
        companyName, formeJuridique, capital, rcsVille, siren, siegeSocial,
        decisionType,
        date: liqDate, heure: liqHeure, ville: liqVille || ville,
        associeUniqueNom: decisionType !== "age" ? associeUniqueNom : undefined,
        associeUniquePrenom: decisionType !== "age" ? associeUniquePrenom : undefined,
        age: decisionType === "age" ? {
          partsPresentes: agePartsPresentes, partsTotal: agePartsTotal,
          typeActions: ageTypeActions,
          cacPresent: ageCacPresent ?? undefined, cacNom: ageCacNom || undefined,
          cePresent: ageCePresent ?? undefined,
          president: agePresident,
          resolutions: ["r5", "r6", "r7", "r8"].map((id, i) => ({
            id, unanimite: liqResUnanimite[i],
            pour: liqPour[i], contre: liqContre[i], abstentions: liqAbstentions[i],
          })),
        } : undefined,
        liquidateurNom: liqNom || liqSocieteNom,
        liquidateurPrenom: liqPrenom,
        dateArretComptes: liqDateArret,
        soldeSigne: liqSoldeSigne,
        soldeMontant: liqSoldeMontant,
      };
      const res = await fetch("/api/dissolution/pv-liquidation", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `PV_Liquidation_${companyName.replace(/\s+/g, "_")}.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erreur génération PV liquidation."); }
    finally { setLiqPhase2LoadingPV(false); }
  }

  async function generatePhase2Convoc() {
    setLiqPhase2LoadingConvoc(true);
    try {
      // Parse siege for CP/ville
      const siegeParts = siegeSocial.split(" ");
      const cp = siegeParts.find((p) => /^\d{5}$/.test(p)) ?? "";
      const data: ConvocationLiquidationData = {
        companyName, formeJuridique, capital,
        siegeVille: ville, siegeCP: cp, siegeAdresse: siegeSocial,
        rcsVille, sirenNumero: siren,
        modeConvocation: liqModeConvoc,
        date: liqDate, heure: liqHeure,
        lieuAssemblee: liqLieu || `au siège social : ${siegeSocial}`,
        emailQuestions: liqEmail,
        dirigeant: formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant",
        decisionType,
        dateArretComptes: liqDateArret,
        soldeSigne: liqSoldeSigne,
        soldeMontant: liqSoldeMontant,
      };
      const res = await fetch("/api/dissolution/convocation-liquidation", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `Convocation_AGO_Liquidation_${companyName.replace(/\s+/g, "_")}.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erreur génération convocation liquidation."); }
    finally { setLiqPhase2LoadingConvoc(false); }
  }

  const toggleResUnanimite = (i: number) => {
    const next = [...ageResUnanimite];
    next[i] = !next[i];
    setAgeResUnanimite(next);
  };

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
        {companyName && <span className="text-xs text-gray-400 hidden md:block">{companyName}</span>}
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

            {sirenLoading && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#5D9CEC] flex-shrink-0" />
                <span className="text-sm text-[#1E3A8A] font-medium">Récupération des données de la société depuis le registre…</span>
              </div>
            )}

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

        {/* ── Étape 4 : Succès + 2 phases ─────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6 py-4">

            {/* Phase 1 — Dissolution */}
            <div className="bg-white rounded-2xl border-2 border-green-200 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-[#1E3A8A]">Phase 1 — Dissolution</p>
                  <p className="text-xs text-gray-500">Documents prêts à signer et déposer</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-green-800 text-xs uppercase tracking-wide mb-1">Prochaines étapes</p>
                <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span>Faire signer le PV par l'associé unique / les associés</span></div>
                <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span>Publier l'annonce légale de dissolution dans un journal habilité</span></div>
                <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span>Déposer le dossier de dissolution au greffe du tribunal de commerce</span></div>
              </div>

              {/* Pièces justificatives Phase 1 */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pièces justificatives — Dépôt Greffe (Phase 1)</p>
                {(
                  [
                    {
                      key: "pvDissolution" as const,
                      label: decisionType === "associe_unique" ? "Décision de l'associé unique signée (DAS)" : "PV de dissolution signé",
                      desc: decisionType === "associe_unique"
                        ? "Décision unilatérale de dissolution, signée par l'associé unique"
                        : "Procès-verbal de l'assemblée générale extraordinaire, signé",
                    },
                    {
                      key: "attestationAL" as const,
                      label: "Attestation de parution de l'annonce légale",
                      desc: "Fournie par le journal habilité après publication de l'avis de dissolution",
                    },
                    ...(!liqEstGerant ? [{
                      key: "identiteLiquidateur" as const,
                      label: "Pièce d'identité du liquidateur",
                      desc: "Copie CNI ou passeport du liquidateur désigné (si différent du dirigeant)",
                    }] : []),
                  ] as { key: JustifKeyDiss; label: string; desc: string }[]
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      {justifDiss[key] && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {justifDiss[key]!.name} ({Math.round(justifDiss[key]!.size / 1024)} Ko)
                        </p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJustifDissUpload(key, f); }} />
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${justifDiss[key] ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-[#5D9CEC] text-[#5D9CEC] bg-white hover:bg-blue-50"}`}>
                        <Download className="w-4 h-4" />
                        {justifDiss[key] ? "Remplacer" : "Charger PDF"}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={generate} disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#5D9CEC] text-[#5D9CEC] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PV de Dissolution
                </button>
                {decisionType === "age" && (
                  <button onClick={generateConvocation} disabled={convocLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm">
                    {convocLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Convocation AGE Dissolution
                  </button>
                )}
              </div>
            </div>

            {/* Phase 2 — Liquidation (collapsible) */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setPhase2Open((o) => !o)}
                className="w-full flex items-center gap-3 p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1E3A8A]">Phase 2 — Clôture de la liquidation</p>
                  <p className="text-xs text-gray-500">À compléter dans 6 à 12 mois, lors de la clôture</p>
                </div>
                {phase2Open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {phase2Open && (
                <div className="border-t border-gray-100 p-6 space-y-5">
                  <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 font-medium">
                    Ces documents sont générés lors de la clôture de la liquidation. Revenez sur cette page quand vous êtes prêt à convoquer l'assemblée de clôture.
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Date de l'assemblée de clôture" value={liqDate} onChange={setLiqDate} placeholder="JJ/MM/AAAA" />
                      <Field label="Heure" value={liqHeure} onChange={setLiqHeure} placeholder="10h00" />
                    </div>
                    <Field label="Ville de signature" value={liqVille} onChange={setLiqVille} placeholder="Paris" required={false} />
                    <Field label="Lieu de l'assemblée" value={liqLieu} onChange={setLiqLieu} placeholder="au siège social ou adresse complète" required={false} />
                    <Field label="Email pour questions écrites" value={liqEmail} onChange={setLiqEmail} placeholder="contact@societe.fr" type="email" required={false} />
                    <Select label="Mode de convocation" value={liqModeConvoc}
                      onChange={(v) => setLiqModeConvoc(v as typeof liqModeConvoc)}
                      options={[
                        { value: "LRAR", label: "LRAR" },
                        { value: "lettre simple", label: "Lettre simple" },
                        { value: "voie électronique", label: "Voie électronique" },
                        { value: "remise en mains propres", label: "Remise en mains propres" },
                      ]}
                    />
                    <Field label="Date d'arrêté des comptes de liquidation" value={liqDateArret} onChange={setLiqDateArret} placeholder="JJ/MM/AAAA" required={false} />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Solde de liquidation</label>
                      <div className="flex gap-3">
                        <button onClick={() => setLiqSoldeSigne("positif")} className={cn("flex-1 py-3 rounded-xl text-sm border-2 font-semibold", liqSoldeSigne === "positif" ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200")}>Boni (positif)</button>
                        <button onClick={() => setLiqSoldeSigne("negatif")} className={cn("flex-1 py-3 rounded-xl text-sm border-2 font-semibold", liqSoldeSigne === "negatif" ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200")}>Mali (négatif)</button>
                      </div>
                    </div>
                    <Field label="Montant du solde (€)" value={liqSoldeMontant} onChange={setLiqSoldeMontant} placeholder="0" required={false} />

                    {decisionType === "age" && (
                      <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vote par résolution (phase 2)</p>
                        {["Résolution 5 – Comptes de liquidation", "Résolution 6 – Répartition", "Résolution 7 – Clôture", "Résolution 8 – Formalités"].map((label, i) => (
                          <div key={i} className="space-y-2">
                            <Toggle label={`${label} — à l'unanimité`} value={liqResUnanimite[i]} onChange={() => { const n = [...liqResUnanimite]; n[i] = !n[i]; setLiqResUnanimite(n); }} />
                            {!liqResUnanimite[i] && (
                              <div className="grid grid-cols-3 gap-2 pl-2">
                                <Field label="Pour" value={liqPour[i]} onChange={(v) => { const n = [...liqPour]; n[i] = v; setLiqPour(n); }} placeholder="0" required={false} />
                                <Field label="Contre" value={liqContre[i]} onChange={(v) => { const n = [...liqContre]; n[i] = v; setLiqContre(n); }} placeholder="0" required={false} />
                                <Field label="Abstentions" value={liqAbstentions[i]} onChange={(v) => { const n = [...liqAbstentions]; n[i] = v; setLiqAbstentions(n); }} placeholder="0" required={false} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button onClick={generatePhase2PV} disabled={liqPhase2LoadingPV}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all text-sm">
                        {liqPhase2LoadingPV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        PV de Liquidation
                      </button>
                      <button onClick={generatePhase2Convoc} disabled={liqPhase2LoadingConvoc}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm">
                        {liqPhase2LoadingConvoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Convocation AGO Liquidation
                      </button>
                    </div>

                    {/* Pièces justificatives Phase 2 */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pièces justificatives — Dépôt Greffe (Phase 2)</p>
                      {(
                        [
                          {
                            key: "pvLiquidation" as const,
                            label: decisionType === "associe_unique" ? "Décision de clôture de liquidation signée" : "PV de clôture de liquidation signé",
                            desc: decisionType === "associe_unique"
                              ? "Décision unilatérale approuvant les comptes et constatant la clôture"
                              : "Procès-verbal de l'AGO de clôture, approuvant les comptes et constatant la clôture",
                          },
                          {
                            key: "comptesLiquidation" as const,
                            label: "Comptes de liquidation approuvés",
                            desc: `Bilan de clôture de liquidation — solde ${liqSoldeSigne === "positif" ? "positif (boni)" : "négatif (mali)"}`,
                          },
                          {
                            key: "attestationALCloture" as const,
                            label: "Attestation de parution de l'annonce légale de clôture",
                            desc: "Fournie par le journal habilité après publication de l'avis de clôture de liquidation",
                          },
                        ] as { key: JustifKeyDiss; label: string; desc: string }[]
                      ).map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            {justifDiss[key] && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> {justifDiss[key]!.name} ({Math.round(justifDiss[key]!.size / 1024)} Ko)
                              </p>
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJustifDissUpload(key, f); }} />
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${justifDiss[key] ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-[#5D9CEC] text-[#5D9CEC] bg-white hover:bg-blue-50"}`}>
                              <Download className="w-4 h-4" />
                              {justifDiss[key] ? "Remplacer" : "Charger PDF"}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
