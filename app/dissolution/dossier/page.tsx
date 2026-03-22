"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, FileText, Download, Loader2, ArrowLeft, Clock, ChevronDown, ChevronUp, Eye, PenLine, Send } from "lucide-react";
import DocPreviewModal from "@/components/dissolution/DocPreviewModal";
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

        // AGE: total parts from associés + feuille de présence
        const rawAssocies = (d.associes as { nom: string; prenom: string; nbParts: number }[] ?? []);
        const totalParts = rawAssocies.reduce(
          (sum: number, a: { nbParts: number }) => sum + (a.nbParts ?? 0), 0
        );
        if (totalParts > 0) {
          setAgePartsPresentes(String(totalParts));
          setAgePartsTotal(String(totalParts));
        }
        if (rawAssocies.length > 0) {
          setFeuilleAssocies(rawAssocies.map((a) => ({
            civilite: "",
            nom: a.nom,
            prenom: a.prenom,
            representant: "",
            qualite: "pleine_propriete" as const,
            nbParts: String(a.nbParts || ""),
          })));
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
  // ── Feuille de présence ───────────────────────────────────────────────────
  interface FeuilleAssoc {
    civilite: string;
    nom: string;
    prenom: string;
    representant: string;
    qualite: "pleine_propriete" | "industrie" | "nue_propriete" | "usufruit";
    nbParts: string;
  }
  const [feuilleAssocies, setFeuilleAssocies] = useState<FeuilleAssoc[]>([]);
  const [feuilleLoading, setFeuilleLoading] = useState(false);
  const [feuilleOpen, setFeuilleOpen] = useState(false);

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

  // ── Preview modal ─────────────────────────────────────────────────────────
  const [preview, setPreview] = useState<{
    open: boolean;
    type: "pv" | "convocation" | "pv-liquidation" | "convocation-liquidation";
    title: string;
  } | null>(null);

  // ── Yousign sign modal ────────────────────────────────────────────────────
  const [signModal, setSignModal] = useState<{
    open: boolean;
    docType: "pv" | "convocation";
  } | null>(null);
  const [signerEmail, setSignerEmail] = useState("");
  const [signerFirstName, setSignerFirstName] = useState("");
  const [signerLastName, setSignerLastName] = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [signResult, setSignResult] = useState<string | null>(null);

  // ── INPI submission ───────────────────────────────────────────────────────
  const [inpiLoading, setInpiLoading] = useState(false);
  const [inpiResult, setInpiResult] = useState<string | null>(null);
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

  // ── Preview helpers ───────────────────────────────────────────────────────
  function buildConvocationData(): ConvocationData {
    return {
      companyName, formeJuridique, capital,
      siegeVille: ville, siegeAdresse: siegeSocial,
      rcsVille, sirenNumero: siren,
      modeConvocation, date, heure: ageHeure || "10h00",
      lieuAssemblee: lieuAssemblee || `au siège social : ${siegeSocial}`,
      emailQuestions,
      dirigeant: formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant",
      decisionType, siegeLiquidation, siegeLiquidationAdresse,
      liqType, liqNom, liqPrenom, liqAdresse, liqEstGerant,
      liqSocieteNom, liqSocieteRCSVille, liqSocieteRCSNum, liqSocieteRep, liqRemuneration,
    };
  }

  async function fetchPreviewHtml(type: "pv" | "convocation" | "pv-liquidation" | "convocation-liquidation"): Promise<string> {
    const data = type === "pv" ? buildData()
      : type === "convocation" ? buildConvocationData()
        : null; // phase 2 handled separately
    const res = await fetch("/api/dissolution/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    if (!res.ok) throw new Error("Erreur aperçu");
    const { html } = await res.json();
    return html as string;
  }

  async function downloadWordBlob(type: "pv" | "convocation"): Promise<void> {
    if (type === "pv") {
      await generate();
    } else {
      await generateConvocation();
    }
  }

  async function handleYousign(docType: "pv" | "convocation") {
    if (!signerEmail || !signerFirstName || !signerLastName) {
      alert("Veuillez remplir le prénom, nom et email du signataire.");
      return;
    }
    setSignLoading(true);
    setSignResult(null);
    try {
      // Génère le DOCX en base64
      const apiPath = docType === "pv" ? "/api/dissolution/pv" : "/api/dissolution/convocation";
      const docData = docType === "pv" ? buildData() : buildConvocationData();
      const docRes = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
      if (!docRes.ok) throw new Error("Erreur génération document");
      const blob = await docRes.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const signRes = await fetch("/api/dissolution/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          companyName,
          documentBase64: base64,
          signers: [{ firstName: signerFirstName, lastName: signerLastName, email: signerEmail }],
        }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error ?? "Erreur Yousign");
      setSignResult(signData.message ?? "Signature envoyée.");
    } catch (err) {
      setSignResult(err instanceof Error ? err.message : "Erreur signature.");
    } finally {
      setSignLoading(false);
    }
  }

  async function downloadFeuillePresence() {
    setFeuilleLoading(true);
    try {
      const data = {
        companyName, formeJuridique, capital, siegeSocial, rcsVille, siren,
        date, heure: ageHeure || "10h00",
        lieuAssemblee: lieuAssemblee || siegeSocial,
        typeActions: ageTypeActions,
        president: agePresident,
        associes: feuilleAssocies.length > 0 ? feuilleAssocies : [
          { civilite: "", nom: "", prenom: "", representant: "", qualite: "pleine_propriete", nbParts: "" },
          { civilite: "", nom: "", prenom: "", representant: "", qualite: "pleine_propriete", nbParts: "" },
          { civilite: "", nom: "", prenom: "", representant: "", qualite: "pleine_propriete", nbParts: "" },
        ],
      };
      const res = await fetch("/api/dissolution/feuille-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur génération feuille de présence");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Feuille_Presence_AGE_${companyName.replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur génération feuille de présence.");
    } finally {
      setFeuilleLoading(false);
    }
  }

  async function handleInpiSubmit(phase: "dissolution" | "liquidation") {
    setInpiLoading(true);
    setInpiResult(null);
    try {
      // Convertir les fichiers uploadés en base64 pour l'INPI
      const justifBase64: Record<string, { name: string; base64: string; size: number }> = {};
      // Note : les fichiers sont stockés localement (justifDiss) ; en production, les convertir en base64 ici
      const res = await fetch("/api/dissolution/inpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siren, formeJuridique, companyName, capital, siegeSocial,
          dateDissolution: date,
          decisionType,
          liquidateur: {
            type: liqType,
            nom: liqNom, prenom: liqPrenom, adresse: liqAdresse,
            societeNom: liqSocieteNom, societeRCSVille: liqSocieteRCSVille,
            societeRCSNumero: liqSocieteRCSNum,
          },
          phase,
          justifFiles: justifBase64,
        }),
      });
      const data = await res.json();
      setInpiResult(data.message ?? data.error ?? "Traitement INPI.");
    } catch (err) {
      setInpiResult(err instanceof Error ? err.message : "Erreur INPI.");
    } finally {
      setInpiLoading(false);
    }
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <>
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date de la décision <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={date ? date.split("/").reverse().join("-") : ""}
                    onChange={(e) => {
                      const [y, m, d2] = e.target.value.split("-");
                      setDate(e.target.value ? `${d2}/${m}/${y}` : "");
                    }}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D9CEC] bg-white text-sm text-gray-800"
                  />
                </div>
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

              {/* Prochaines étapes */}
              <div className="bg-green-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-green-800 text-xs uppercase tracking-wide mb-1">Prochaines étapes</p>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Signer le PV en ligne</strong> — envoi du lien de signature par email (Yousign)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5D9CEC] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong>LegalCorners publie l'annonce légale</strong> de dissolution dans un journal habilité</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Dépôt du dossier</strong> au greffe du tribunal de commerce</span>
                </div>
              </div>

              {/* ── 1. Signature en ligne (action principale) ── */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <PenLine className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-800 text-sm">Étape 1 — Signer le PV en ligne</p>
                </div>
                <p className="text-xs text-gray-500">
                  Renseignez les coordonnées du signataire. Un lien de signature sécurisé lui sera envoyé par email.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Prénom" value={signerFirstName} onChange={setSignerFirstName} placeholder="Jean" />
                  <Field label="Nom" value={signerLastName} onChange={setSignerLastName} placeholder="DUPONT" />
                </div>
                <Field label="Email du signataire" value={signerEmail} onChange={setSignerEmail} placeholder="jean@societe.fr" type="email" />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleYousign("pv")}
                    disabled={signLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm"
                  >
                    {signLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                    Envoyer le PV à signer
                  </button>
                  {decisionType === "age" && (
                    <button
                      onClick={() => handleYousign("convocation")}
                      disabled={signLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-600 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-all text-sm"
                    >
                      {signLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                      Envoyer Convocation
                    </button>
                  )}
                </div>
                {signResult && (
                  <p className={`text-xs font-medium px-1 ${signResult.includes("Erreur") || signResult.includes("échou") ? "text-red-500" : "text-green-700"}`}>
                    {signResult}
                  </p>
                )}
                {/* Aperçu + téléchargement en secondaire */}
                <div className="flex gap-2 pt-1 border-t border-green-200">
                  <button
                    onClick={() => setPreview({ open: true, type: "pv", title: `PV de Dissolution – ${companyName}` })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 font-medium rounded-lg hover:bg-white transition-all text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Aperçu PV
                  </button>
                  <button onClick={generate} disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 font-medium rounded-lg hover:bg-white transition-all text-xs"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Télécharger .docx
                  </button>
                  {decisionType === "age" && (<>
                    <button
                      onClick={() => setPreview({ open: true, type: "convocation", title: `Convocation AGE – ${companyName}` })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 font-medium rounded-lg hover:bg-white transition-all text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Aperçu Convoc.
                    </button>
                    <button onClick={generateConvocation} disabled={convocLoading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 font-medium rounded-lg hover:bg-white transition-all text-xs"
                    >
                      {convocLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Convoc. .docx
                    </button>
                  </>)}
                </div>
              </div>

              {/* ── 2. Annonce légale (LegalCorners publie) ── */}
              <div className="bg-blue-50 border border-[#5D9CEC]/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#5D9CEC]" />
                    <p className="font-semibold text-[#1E3A8A] text-sm">Étape 2 — Annonce légale de dissolution</p>
                  </div>
                  <span className="text-xs font-semibold bg-[#1E3A8A] text-white px-2.5 py-1 rounded-full">Pris en charge par LegalCorners</span>
                </div>
                <p className="text-xs text-gray-500">
                  LegalCorners publie cette annonce dans un journal habilité. Voici le texte qui sera publié :
                </p>
                {/* Texte de l'annonce légale */}
                <div className="bg-white border border-[#5D9CEC]/30 rounded-lg p-4 text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                  {[
                    `${companyName || "[Nom société]"}`,
                    `${formeJuridique || "[Forme juridique]"} au capital de ${capital || "[X]"} €.`,
                    `Siège social : ${siegeSocial || "[Adresse siège]"}.`,
                    `${siren || "[SIREN]"} RCS ${rcsVille || "[Ville]"}.`,
                    `Par ${decisionType === "associe_unique" ? "décision de l'associé unique" : decisionType === "unanimite" ? "décision unanime des associés" : "décision de l'assemblée générale extraordinaire"} en date du ${date || "[date]"}, il a été décidé la dissolution anticipée et la mise en liquidation amiable de la société à compter de ce jour.`,
                    `Le siège de la liquidation est fixé ${siegeLiquidation === "siege_social" ? "au siège de la société" : siegeLiquidation === "domicile_liquidateur" ? "au domicile du liquidateur" : siegeLiquidationAdresse || "[adresse]"}.`,
                    liqType === "personne"
                      ? `Le liquidateur est ${liqPrenom || "[Prénom]"} ${liqNom || "[Nom]"}${liqAdresse ? `, demeurant ${liqAdresse}` : ""}.`
                      : `Le liquidateur est la société ${liqSocieteNom || "[Nom société]"}, RCS ${liqSocieteRCSVille || "[Ville]"} n° ${liqSocieteRCSNum || "[Numéro]"}, représentée par ${liqSocieteRep || "[Représentant]"}.`,
                    `Pour avis.`,
                  ].join("\n")}
                </div>
              </div>

              {/* ── Pièces justificatives Phase 1 ── */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pièces justificatives — Dépôt Greffe (Phase 1)</p>

                {/* PV signé — fourni par Yousign */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {decisionType === "associe_unique" ? "Décision de l'associé unique signée (DAS)" : "PV de dissolution signé"}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                      <PenLine className="w-3 h-3" /> Fourni automatiquement après signature en ligne (Yousign)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">Auto</span>
                </div>

                {/* Attestation AL — LegalCorners */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Attestation de parution de l'annonce légale</p>
                    <p className="text-xs text-[#1E3A8A] mt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Fournie par LegalCorners après publication dans le JAL
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#1E3A8A] bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">LegalCorners</span>
                </div>

                {/* Pièce d'identité liquidateur si nécessaire */}
                {!liqEstGerant && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Pièce d'identité du liquidateur</p>
                      <p className="text-xs text-gray-500 mt-0.5">Copie CNI ou passeport (liquidateur différent du dirigeant)</p>
                      {justifDiss.identiteLiquidateur && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {justifDiss.identiteLiquidateur.name}
                        </p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJustifDissUpload("identiteLiquidateur", f); }} />
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${justifDiss.identiteLiquidateur ? "border-green-300 text-green-700 bg-green-50" : "border-[#5D9CEC] text-[#5D9CEC] bg-white hover:bg-blue-50"}`}>
                        <Download className="w-4 h-4" />
                        {justifDiss.identiteLiquidateur ? "Remplacer" : "Charger"}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* ── Feuille de présence AGE ── */}
              {decisionType === "age" && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFeuilleOpen((o) => !o)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#5D9CEC]" />
                      <span className="font-semibold text-sm text-[#1E3A8A]">Feuille de présence AGE</span>
                      <span className="text-xs text-gray-400 font-normal">(optionnel — à conserver)</span>
                    </div>
                    {feuilleOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {feuilleOpen && (
                    <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                      <p className="text-xs text-gray-500">
                        Document A4 paysage avec tableau nominatif. Pré-rempli depuis le registre Pappers si disponible.
                      </p>

                      {/* Liste des associés */}
                      <div className="space-y-2">
                        {feuilleAssocies.map((a, i) => (
                          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Associé {i + 1}</span>
                              <button
                                onClick={() => setFeuilleAssocies((prev) => prev.filter((_, j) => j !== i))}
                                className="text-red-400 hover:text-red-600 text-xs"
                              >
                                Supprimer
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={a.civilite}
                                onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], civilite: e.target.value }; setFeuilleAssocies(n); }}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                              >
                                <option value="">—</option>
                                <option value="M.">M.</option>
                                <option value="Mme">Mme</option>
                              </select>
                              <input
                                value={a.prenom}
                                onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], prenom: e.target.value }; setFeuilleAssocies(n); }}
                                placeholder="Prénom"
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                              />
                              <input
                                value={a.nom}
                                onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], nom: e.target.value }; setFeuilleAssocies(n); }}
                                placeholder="NOM"
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={a.qualite}
                                onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], qualite: e.target.value as FeuilleAssoc["qualite"] }; setFeuilleAssocies(n); }}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                              >
                                <option value="pleine_propriete">Pleine propriété</option>
                                <option value="nue_propriete">Nu-propriétaire</option>
                                <option value="usufruit">Usufruitier</option>
                                <option value="industrie">Apporteur en industrie</option>
                              </select>
                              <input
                                value={a.nbParts}
                                onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], nbParts: e.target.value }; setFeuilleAssocies(n); }}
                                placeholder={`Nb ${ageTypeActions === "actions" ? "actions" : "parts"}`}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                              />
                            </div>
                            <input
                              value={a.representant}
                              onChange={(e) => { const n = [...feuilleAssocies]; n[i] = { ...n[i], representant: e.target.value }; setFeuilleAssocies(n); }}
                              placeholder="Représentant (si personne morale ou mandataire)"
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                            />
                          </div>
                        ))}

                        <button
                          onClick={() => setFeuilleAssocies((prev) => [
                            ...prev,
                            { civilite: "", nom: "", prenom: "", representant: "", qualite: "pleine_propriete", nbParts: "" }
                          ])}
                          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 text-xs rounded-lg hover:border-[#5D9CEC] hover:text-[#5D9CEC] transition-colors"
                        >
                          + Ajouter un associé
                        </button>
                      </div>

                      <button
                        onClick={downloadFeuillePresence}
                        disabled={feuilleLoading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl transition-all text-sm"
                      >
                        {feuilleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Télécharger la feuille de présence (.docx)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Retour édition ── */}
              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Modifier les informations
              </button>

              {/* ── Dépôt INPI Phase 1 ── */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#5D9CEC]" />
                  Dépôt Guichet Unique INPI – Phase 1
                </p>
                <p className="text-xs text-gray-400">
                  {decisionType === "age"
                    ? "Pièces requises : PV signé, convocation, feuille de présence, attestation annonce légale."
                    : decisionType === "unanimite"
                      ? "Pièces requises : PV signé, attestation annonce légale."
                      : "Pièces requises : Décision de l'associé unique signée, attestation annonce légale."}
                </p>
                <button
                  onClick={() => handleInpiSubmit("dissolution")}
                  disabled={inpiLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all text-sm"
                >
                  {inpiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Déposer au Guichet Unique INPI
                </button>
                {inpiResult && (
                  <p className={`text-xs font-medium ${inpiResult.includes("Erreur") || inpiResult.includes("échou") ? "text-red-500" : "text-green-600"}`}>
                    {inpiResult}
                  </p>
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

                    <div className="space-y-2 pt-2">
                      {/* PV Liquidation */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreview({ open: true, type: "pv-liquidation", title: `PV Liquidation – ${companyName}` })}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm"
                        >
                          <Eye className="w-4 h-4" /> Aperçu PV Liquidation
                        </button>
                        <button onClick={generatePhase2PV} disabled={liqPhase2LoadingPV}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all text-sm">
                          {liqPhase2LoadingPV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          .docx
                        </button>
                      </div>
                      {/* Convocation AGO */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreview({ open: true, type: "convocation-liquidation", title: `Convocation AGO Liquidation – ${companyName}` })}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-400 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm"
                        >
                          <Eye className="w-4 h-4" /> Aperçu Convocation AGO
                        </button>
                        <button onClick={generatePhase2Convoc} disabled={liqPhase2LoadingConvoc}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm">
                          {liqPhase2LoadingConvoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                          .docx
                        </button>
                      </div>
                    </div>

                    {/* INPI Phase 2 */}
                    <div className="border border-gray-100 rounded-xl p-4 space-y-2 mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Send className="w-4 h-4 text-[#5D9CEC]" /> Dépôt INPI – Phase 2 (Radiation)
                      </p>
                      <p className="text-xs text-gray-400">
                        {decisionType === "age"
                          ? "Pièces requises : PV de clôture signé, convocation, feuille de présence, comptes de liquidation, attestation AL clôture."
                          : "Pièces requises : PV/Décision de clôture signée, comptes de liquidation, attestation AL clôture."}
                      </p>
                      <button
                        onClick={() => handleInpiSubmit("liquidation")}
                        disabled={inpiLoading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all text-sm"
                      >
                        {inpiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Déposer au Guichet Unique INPI (Radiation)
                      </button>
                      {inpiResult && (
                        <p className={`text-xs font-medium ${inpiResult.includes("Erreur") ? "text-red-500" : "text-green-600"}`}>
                          {inpiResult}
                        </p>
                      )}
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

    {/* ── Preview modal ── */}
    {preview?.open && (
      <DocPreviewModal
        title={preview.title}
        onClose={() => setPreview(null)}
        onEdit={() => { setPreview(null); setStep(1); }}
        onFetchHtml={() => fetchPreviewHtml(preview.type)}
        onDownloadWord={async () => {
          if (preview.type === "pv") await generate();
          else if (preview.type === "convocation") await generateConvocation();
          else if (preview.type === "pv-liquidation") await generatePhase2PV();
          else await generatePhase2Convoc();
        }}
        onSign={preview.type === "pv" || preview.type === "convocation"
          ? () => handleYousign(preview.type as "pv" | "convocation")
          : undefined
        }
      />
    )}
    </>
  );
}

export default function DossierPage() {
  return (
    <Suspense>
      <DossierForm />
    </Suspense>
  );
}
