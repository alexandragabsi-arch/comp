"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, FileText, Download, Loader2, ArrowLeft, Moon, Search, Upload, AlertTriangle, ArrowRight, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PVSommeilData } from "@/app/api/sommeil/pv/route";
import type { ConvocationSommeilData } from "@/app/api/sommeil/convocation/route";

// ── Helpers ─────────────────────────────────────────────────────────────────
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
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
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
  { id: 2, label: "Décision" },
  { id: 3, label: "Génération" },
];

function autoDecisionType(fj: string): "associe_unique" | "age" {
  const up = fj.toUpperCase();
  return up.includes("EURL") || up.includes("SASU") ? "associe_unique" : "age";
}

function getDirigeantQualite(fj: string): "gérant" | "président" {
  const up = fj.toUpperCase();
  return up.includes("SAS") || up.includes("SA") ? "président" : "gérant";
}

export default function MiseEnSommeilPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [convocLoading, setConvocLoading] = useState(false);
  const [sirenLoading, setSirenLoading] = useState(false);

  // Step 1: Société
  const [companyName, setCompanyName] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [capital, setCapital] = useState("");
  const [rcsVille, setRcsVille] = useState("");
  const [siren, setSiren] = useState("");
  const [siegeAdresse, setSiegeAdresse] = useState("");
  const [siegeCP, setSiegeCP] = useState("");
  const [siegeVille, setSiegeVille] = useState("");
  const [sirenInput, setSirenInput] = useState("");
  const [sirenError, setSirenError] = useState("");

  // Step 2: Décision
  const [decisionType, setDecisionType] = useState<"associe_unique" | "age">("age");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [ville, setVille] = useState("");
  const [dateMiseEnSommeil, setDateMiseEnSommeil] = useState("");
  const [fermetureEtablissement, setFermetureEtablissement] = useState(false);
  // Associé unique
  const [associeUniqueNom, setAssocieUniqueNom] = useState("");
  const [associeUniquePrenom, setAssocieUniquePrenom] = useState("");
  const [associeEstSociete, setAssocieEstSociete] = useState(false);
  const [associeSocieteNom, setAssocieSocieteNom] = useState("");
  const [associeSocieteAdresse, setAssocieSocieteAdresse] = useState("");
  const [associeSocieteRep, setAssocieSocieteRep] = useState("");
  // Dirigeant
  const [dirigeantNom, setDirigeantNom] = useState("");
  const [dirigeantPrenom, setDirigeantPrenom] = useState("");
  // AGE
  const [modeConvocation, setModeConvocation] = useState<"LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres">("LRAR");
  const [dateConvocation, setDateConvocation] = useState("");
  const [partsPresentes, setPartsPresentes] = useState("");
  const [partsTotal, setPartsTotal] = useState("");
  const [typeActions, setTypeActions] = useState<"actions" | "parts sociales">("parts sociales");
  const [president, setPresident] = useState("");
  const [lieuAssemblee, setLieuAssemblee] = useState("");
  const [emailQuestions, setEmailQuestions] = useState("");
  const [resUnanimite, setResUnanimite] = useState([true, true]);

  // Step 3: Pièces justificatives
  type JustifKey = "pv" | "attestation";
  interface JustifFile { name: string; size: number; }
  const [justifFiles, setJustifFiles] = useState<Partial<Record<JustifKey, JustifFile>>>({});

  const handleJustifUpload = (key: JustifKey, file: File) => {
    setJustifFiles(prev => ({ ...prev, [key]: { name: file.name, size: file.size } }));
  };

  // SIREN lookup
  async function lookupSiren() {
    const cleaned = sirenInput.replace(/\s/g, "");
    if (cleaned.length !== 9) { setSirenError("Le SIREN doit contenir 9 chiffres."); return; }
    setSirenLoading(true); setSirenError("");
    try {
      const res = await fetch(`/api/siren?siren=${cleaned}`);
      if (!res.ok) throw new Error("Société introuvable");
      const data = await res.json();
      setSiren(cleaned);
      setCompanyName(data.denomination || "");
      setFormeJuridique((data.formeJuridique || "").toUpperCase());
      setRcsVille(data.ville || "");
      setCapital(data.capital ? String(data.capital) : "");
      setSiegeAdresse(data.siegeAdresse || "");
      setSiegeCP(data.siegeCP || "");
      setSiegeVille(data.siegeVille || "");
      // Auto-detect decision type
      setDecisionType(autoDecisionType(data.formeJuridique || ""));
    } catch {
      setSirenError("Société introuvable. Vérifiez le numéro SIREN.");
    } finally {
      setSirenLoading(false);
    }
  }

  // Generate PV
  async function generatePV() {
    setLoading(true);
    try {
      const data: PVSommeilData = {
        companyName, formeJuridique, capital, rcsVille, siren,
        siegeAdresse, siegeCP, siegeVille,
        decisionType,
        date, heure: decisionType === "age" ? heure : undefined,
        lieu: decisionType === "age" ? lieu : undefined,
        ville,
        associeUniqueNom: decisionType === "associe_unique" ? associeUniqueNom : undefined,
        associeUniquePrenom: decisionType === "associe_unique" ? associeUniquePrenom : undefined,
        associeUniqueEstSociete: associeEstSociete,
        associeUniqueSocieteNom: associeEstSociete ? associeSocieteNom : undefined,
        associeUniqueSocieteAdresse: associeEstSociete ? associeSocieteAdresse : undefined,
        associeUniqueSocieteRepresentantPar: associeEstSociete ? associeSocieteRep : undefined,
        dirigeantNom, dirigeantPrenom,
        dirigeantQualite: getDirigeantQualite(formeJuridique),
        age: decisionType === "age" ? {
          modeConvocation,
          dateConvocation,
          partsPresentes,
          partsTotal,
          typeActions,
          president: president || `${dirigeantPrenom} ${dirigeantNom}`,
          presidentQualite: getDirigeantQualite(formeJuridique),
          questionsPrealables: "aucune",
          resolutions: [
            { id: "1", resultat: resUnanimite[0] ? "unanimite" : "majorite" },
            { id: "2", resultat: resUnanimite[1] ? "unanimite" : "majorite" },
          ],
        } : undefined,
        dateMiseEnSommeil,
        fermetureEtablissement,
        formatDecision: associeEstSociete ? "associe_unique_societe" : "associe_unique",
      };
      const res = await fetch("/api/sommeil/pv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erreur génération PV");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `PV_MiseEnSommeil_${companyName.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { alert("Erreur lors de la génération du PV."); }
    finally { setLoading(false); }
  }

  // Generate Convocation (AGE only)
  async function generateConvocation() {
    setConvocLoading(true);
    try {
      const data: ConvocationSommeilData = {
        companyName, formeJuridique, capital,
        siegeAdresse, siegeCP, siegeVille, rcsVille, sirenNumero: siren,
        modeConvocation, date, heure,
        lieuAssemblee: lieu || lieuAssemblee,
        emailQuestions,
        dirigeant: getDirigeantQualite(formeJuridique),
        dateMiseEnSommeil,
      };
      const res = await fetch("/api/sommeil/convocation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erreur génération convocation");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `Convocation_MiseEnSommeil_${companyName.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { alert("Erreur lors de la génération de la convocation."); }
    finally { setConvocLoading(false); }
  }

  const canNextStep1 = companyName && formeJuridique && capital && rcsVille && siren;
  const canNextStep2 = date && ville && dateMiseEnSommeil && dirigeantNom && (
    decisionType === "associe_unique"
      ? (associeEstSociete ? associeSocieteNom : associeUniqueNom)
      : (heure && dateConvocation && partsPresentes && partsTotal)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="block h-10 w-auto">
            <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={40} className="h-full w-auto object-contain" priority />
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#1E3A8A] font-medium">
            <Moon className="w-4 h-4" />
            Mise en sommeil
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > s.id ? "bg-green-500 text-white" :
                step === s.id ? "bg-[#1E3A8A] text-white" : "bg-gray-200 text-gray-400"
              )}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn("text-sm font-medium hidden sm:block", step === s.id ? "text-[#1E3A8A]" : "text-gray-400")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          {/* ── STEP 1 : Société ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#1E3A8A] mb-1">Informations sur la société</h2>
                <p className="text-sm text-gray-500">Recherchez par SIREN ou remplissez manuellement.</p>
              </div>

              {/* SIREN lookup */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sirenInput}
                  onChange={(e) => setSirenInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupSiren()}
                  placeholder="N° SIREN (9 chiffres)"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm"
                />
                <button
                  onClick={lookupSiren}
                  disabled={sirenLoading}
                  className="px-4 py-3 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#162d6e] disabled:opacity-50 flex items-center gap-2"
                >
                  {sirenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Rechercher
                </button>
              </div>
              {sirenError && <p className="text-xs text-red-500">{sirenError}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Dénomination sociale" value={companyName} onChange={setCompanyName} placeholder="ACME SARL" />
                </div>
                <Field label="Forme juridique" value={formeJuridique} onChange={(v) => { setFormeJuridique(v); setDecisionType(autoDecisionType(v)); }} placeholder="SARL, SAS, EURL…" />
                <Field label="Capital social (€)" value={capital} onChange={setCapital} placeholder="10000" />
                <Field label="Ville RCS" value={rcsVille} onChange={setRcsVille} placeholder="Paris" />
                <Field label="SIREN" value={siren} onChange={setSiren} placeholder="123456789" />
                <div className="sm:col-span-2">
                  <Field label="Adresse du siège" value={siegeAdresse} onChange={setSiegeAdresse} placeholder="1 rue de la Paix" />
                </div>
                <Field label="Code postal" value={siegeCP} onChange={setSiegeCP} placeholder="75001" />
                <Field label="Ville du siège" value={siegeVille} onChange={setSiegeVille} placeholder="Paris" />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canNextStep1}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#162d6e] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Continuer
              </button>
            </div>
          )}

          {/* ── STEP 2 : Décision ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">Décision de mise en sommeil</h2>
                  <p className="text-sm text-gray-500">Informations pour générer le PV ou la décision.</p>
                </div>
              </div>

              {/* Type de décision */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de décision</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "associe_unique", label: "Associé unique", desc: "EURL, SASU ou associé unique" },
                    { value: "age", label: "AGE", desc: "Assemblée Générale Extraordinaire" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDecisionType(opt.value as "associe_unique" | "age")}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all",
                        decisionType === opt.value ? "border-[#1E3A8A] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className="text-sm font-semibold text-[#1E3A8A]">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={decisionType === "age" ? "Date de l'AGE" : "Date de la décision"}
                  value={date} onChange={setDate} placeholder="JJ/MM/AAAA"
                />
                {decisionType === "age" && (
                  <Field label="Heure de l'AGE" value={heure} onChange={setHeure} placeholder="10h00" />
                )}
                <Field label="Date de mise en sommeil" value={dateMiseEnSommeil} onChange={setDateMiseEnSommeil} placeholder="JJ/MM/AAAA" />
                <Field label="Ville de signature" value={ville} onChange={setVille} placeholder="Paris" />
              </div>

              {/* Fermeture établissement */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={fermetureEtablissement} onChange={(e) => setFermetureEtablissement(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">Inclure la fermeture de l&apos;établissement principal</span>
              </label>

              {/* Dirigeant */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {getDirigeantQualite(formeJuridique) === "président" ? "Président" : "Gérant"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom" value={dirigeantPrenom} onChange={setDirigeantPrenom} placeholder="Jean" />
                  <Field label="Nom" value={dirigeantNom} onChange={setDirigeantNom} placeholder="DUPONT" />
                </div>
              </div>

              {/* Associé unique */}
              {decisionType === "associe_unique" && (
                <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50">
                  <p className="text-xs font-semibold text-[#1E3A8A] uppercase tracking-wide">Associé unique</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={associeEstSociete} onChange={(e) => setAssocieEstSociete(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700">L&apos;associé unique est une société</span>
                  </label>
                  {associeEstSociete ? (
                    <div className="space-y-3">
                      <Field label="Dénomination de la société associée" value={associeSocieteNom} onChange={setAssocieSocieteNom} placeholder="HOLDING SAS" />
                      <Field label="Adresse du siège" value={associeSocieteAdresse} onChange={setAssocieSocieteAdresse} placeholder="1 rue de la Paix, 75001 Paris" />
                      <Field label="Représentée par" value={associeSocieteRep} onChange={setAssocieSocieteRep} placeholder="M. Jean DUPONT, Président" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Prénom" value={associeUniquePrenom} onChange={setAssocieUniquePrenom} placeholder="Jean" />
                      <Field label="Nom" value={associeUniqueNom} onChange={setAssocieUniqueNom} placeholder="DUPONT" />
                    </div>
                  )}
                </div>
              )}

              {/* AGE details */}
              {decisionType === "age" && (
                <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Détails de l&apos;AGE</p>
                  <Field label="Lieu de l'assemblée" value={lieu} onChange={setLieu} placeholder="Au siège social ou adresse complète" />
                  <Field label="Email pour questions écrites" value={emailQuestions} onChange={setEmailQuestions} placeholder="contact@societe.fr" type="email" required={false} />
                  <SelectField
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
                  <Field label="Date de convocation" value={dateConvocation} onChange={setDateConvocation} placeholder="JJ/MM/AAAA" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Parts présentes" value={partsPresentes} onChange={setPartsPresentes} placeholder="100" />
                    <Field label="Parts total" value={partsTotal} onChange={setPartsTotal} placeholder="100" />
                  </div>
                  <SelectField
                    label="Type de titres"
                    value={typeActions}
                    onChange={(v) => setTypeActions(v as "actions" | "parts sociales")}
                    options={[
                      { value: "parts sociales", label: "Parts sociales" },
                      { value: "actions", label: "Actions" },
                    ]}
                  />
                  <Field label="Président de séance" value={president} onChange={setPresident} placeholder={`${dirigeantPrenom} ${dirigeantNom}`} required={false} />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vote des résolutions</p>
                    {["Résolution 1 – Cessation d'activité", "Résolution 2 – Délégation de pouvoirs"].map((label, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resUnanimite[i]}
                          onChange={() => { const n = [...resUnanimite]; n[i] = !n[i]; setResUnanimite(n); }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700">{label} — à l&apos;unanimité</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={!canNextStep2}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#162d6e] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Générer les documents
              </button>
            </div>
          )}

          {/* ── STEP 3 : Génération + Pièces justificatives ──────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-[#1E3A8A]">Documents & Pièces justificatives</h2>
                  <p className="text-sm text-gray-500">{companyName} — {formeJuridique}</p>
                </div>
              </div>

              {/* Info INPI */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-800">
                <p className="font-semibold mb-1">Formalité INPI — Mise en sommeil</p>
                <p className="text-xs">La déclaration de cessation temporaire d&apos;activité se dépose via le <strong>Guichet Unique INPI</strong> (modification — formulaire M2). Aucun dépôt en JAL n&apos;est requis pour la mise en sommeil.</p>
              </div>

              {/* Génération des documents */}
              <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1E3A8A]">Documents à générer et faire signer</p>
                    <p className="text-xs text-gray-500">Téléchargez, signez, puis chargez ci-dessous.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={generatePV}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {decisionType === "associe_unique" ? "Décision de l'associé unique" : "PV d'AGE"}
                  </button>
                  {decisionType === "age" && (
                    <button
                      onClick={generateConvocation}
                      disabled={convocLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold rounded-xl hover:bg-blue-50 transition-all text-sm"
                    >
                      {convocLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Convocation AGE
                    </button>
                  )}
                </div>
              </div>

              {/* Pièces justificatives — adaptées à la situation */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Pièces justificatives — Dépôt INPI Guichet Unique
                </p>

                {/* Contexte */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-2">
                  {decisionType === "associe_unique"
                    ? "Associé unique détecté — la décision unilatérale remplace le PV d'assemblée."
                    : "AGE — le PV d'assemblée générale extraordinaire est requis."}
                  {associeEstSociete && " L'associé unique est une personne morale — aucun Kbis n'est requis pour la mise en sommeil."}
                </div>

                {(
                  [
                    {
                      key: "pv" as const,
                      label: decisionType === "associe_unique"
                        ? "Décision de l'associé unique signée"
                        : "PV d'AGE signé",
                      desc: decisionType === "associe_unique"
                        ? "Décision de cessation temporaire d'activité, signée par l'associé unique"
                        : "Procès-verbal de l'AGE décidant la mise en sommeil, signé",
                    },
                    {
                      key: "attestation" as const,
                      label: "Attestation sur l'honneur (si demandée par l'INPI)",
                      desc: "Certifiant la cessation temporaire d'activité — parfois requise en complément du PV",
                    },
                  ] as { key: JustifKey; label: string; desc: string }[]
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      {justifFiles[key] && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {justifFiles[key]!.name} ({Math.round(justifFiles[key]!.size / 1024)} Ko)
                        </p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJustifUpload(key, f); }} />
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${justifFiles[key] ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-[#5D9CEC] text-[#5D9CEC] bg-white hover:bg-blue-50"}`}>
                        <Upload className="w-4 h-4" />
                        {justifFiles[key] ? "Remplacer" : "Charger PDF"}
                      </div>
                    </label>
                  </div>
                ))}

                {/* Warning si PV non chargé */}
                {!justifFiles.pv && (
                  <p className="text-xs text-amber-600 flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Générez et signez d&apos;abord le document ci-dessus, puis chargez-le ici.
                  </p>
                )}
              </div>

              {/* Récapitulatif formalités */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2 text-sm">
                <p className="font-semibold text-amber-800 text-xs uppercase tracking-wide">Récapitulatif des formalités à accomplir</p>
                <div className="flex items-start gap-2 text-amber-900">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {decisionType === "associe_unique"
                      ? "Faire signer la décision de l'associé unique"
                      : "Faire signer le PV par le président de séance"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-amber-900">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Déposer la formalité M2 sur le Guichet Unique INPI (<a href="https://procedures.inpi.fr" target="_blank" rel="noopener noreferrer" className="underline">procedures.inpi.fr</a>)</span>
                </div>
                <div className="flex items-start gap-2 text-amber-900">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Joindre le PV signé (ou la DAS) dans le dossier INPI</span>
                </div>
                {fermetureEtablissement && (
                  <div className="flex items-start gap-2 text-amber-900">
                    <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Si fermeture d&apos;établissement : déclarer également la fermeture de l&apos;établissement dans le même dossier INPI</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-amber-900">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Durée maximale : <strong>2 ans</strong> (art. R.123-48 C. com.) — penser à reprendre l&apos;activité ou procéder à la dissolution avant l&apos;échéance</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-6 text-sm text-[#1E3A8A]/60">
          <Link href="/" className="hover:text-[#1E3A8A] transition-colors">Accueil</Link>
          <Link href="/dissolution" className="hover:text-[#1E3A8A] transition-colors">Dissolution</Link>
          <Link href="/cession-parts" className="hover:text-[#1E3A8A] transition-colors">Cession de parts</Link>
        </div>
      </footer>
    </div>
  );
}
