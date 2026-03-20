"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Users,
  Scale,
  PenTool,
} from "lucide-react";
import { generatePVDissolution, DissolutionData } from "../lib/generatePVDissolution";
import { generateDissolutionDocx } from "../lib/generateDocx";

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "La société", icon: Building2 },
  { id: 2, label: "Type de décision", icon: Users },
  { id: 3, label: "Détails", icon: FileText },
  { id: 4, label: "Le liquidateur", icon: Scale },
  { id: 5, label: "Options", icon: PenTool },
  { id: 6, label: "Document", icon: CheckCircle },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function DissolutionPage() {
  const [step, setStep] = useState(1);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // Step 1 — Société
  const [sirenInput, setSirenInput] = useState("");
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError] = useState("");
  const [denomination, setDenomination] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("SARL");
  const [capital, setCapital] = useState("");
  const [rcsVille, setRcsVille] = useState("");
  const [rcsNumero, setRcsNumero] = useState("");
  const [adresse, setAdresse] = useState("");
  const [nombrePartsTotal, setNombrePartsTotal] = useState("");

  // Step 2 — Type de décision
  const [typeAssemblee, setTypeAssemblee] = useState<"associe_unique" | "unanime" | "AGE">("associe_unique");

  // Step 3 — Détails assemblée
  const [dateDecision, setDateDecision] = useState("");
  const [villeDecision, setVilleDecision] = useState("");
  const [heureDecision, setHeureDecision] = useState("");
  // Associé unique
  const [assocUniqueCivilite, setAssocUniqueCivilite] = useState<"M." | "Mme">("M.");
  const [assocUniqueNom, setAssocUniqueNom] = useState("");
  const [assocUniquePrenom, setAssocUniquePrenom] = useState("");
  // AGE
  const [partsPresentes, setPartsPresentes] = useState("");
  const [presidentCivilite, setPresidentCivilite] = useState<"M." | "Mme">("M.");
  const [presidentNom, setPresidentNom] = useState("");
  const [presidentPrenom, setPresidentPrenom] = useState("");
  const [presidentQualite, setPresidentQualite] = useState("Président");
  const [hasCac, setHasCac] = useState(false);
  const [cacNom, setCacNom] = useState("");
  const [cacPresent, setCacPresent] = useState(true);
  const [hasCe, setHasCe] = useState(false);
  const [cePresent, setCePresent] = useState(true);

  // Step 4 — Liquidateur
  const [typeLiquidateur, setTypeLiquidateur] = useState<"physique" | "morale">("physique");
  const [liqCivilite, setLiqCivilite] = useState<"M." | "Mme">("M.");
  const [liqNom, setLiqNom] = useState("");
  const [liqPrenom, setLiqPrenom] = useState("");
  const [liqAdresse, setLiqAdresse] = useState("");
  const [estActuelGerant, setEstActuelGerant] = useState(false);
  const [liqDenomination, setLiqDenomination] = useState("");
  const [liqRcsVille, setLiqRcsVille] = useState("");
  const [liqRcsNumero, setLiqRcsNumero] = useState("");
  const [liqRepresentant, setLiqRepresentant] = useState("");

  // Step 5 — Options
  const [siegeLiquidation, setSiegeLiquidation] = useState<"siege" | "domicile" | "autre">("siege");
  const [adresseLiquidationAutre, setAdresseLiquidationAutre] = useState("");
  const [hasRemuneration, setHasRemuneration] = useState(false);
  const [remunerationMontant, setRemunerationMontant] = useState("");
  const [toutesResUnanimesAGE, setToutesResUnanimesAGE] = useState(true);
  const [res1Pour, setRes1Pour] = useState(""); const [res1Contre, setRes1Contre] = useState(""); const [res1Abstentions, setRes1Abstentions] = useState("");
  const [res2Pour, setRes2Pour] = useState(""); const [res2Contre, setRes2Contre] = useState(""); const [res2Abstentions, setRes2Abstentions] = useState("");
  const [res3Pour, setRes3Pour] = useState(""); const [res3Contre, setRes3Contre] = useState(""); const [res3Abstentions, setRes3Abstentions] = useState("");
  const [res4Pour, setRes4Pour] = useState(""); const [res4Contre, setRes4Contre] = useState(""); const [res4Abstentions, setRes4Abstentions] = useState("");

  // Step 6 — Document
  const [pvText, setPvText] = useState("");
  const [docxLoading, setDocxLoading] = useState(false);

  // ── SIREN lookup ─────────────────────────────────────────────────────────────
  async function lookupSiren() {
    if (!sirenInput.trim()) return;
    setSirenLoading(true);
    setSirenError("");
    try {
      const res = await fetch(`/api/siren?siren=${sirenInput.trim()}`);
      if (!res.ok) throw new Error("SIREN non trouvé");
      const d = await res.json();
      setDenomination(d.denominationSociale || "");
      setCapital(d.capitalSocial || "");
      setRcsVille(d.greffe || d.ville || "");
      setRcsNumero(d.rcs || d.siren || "");
      const addr = [d.siegeSocial, d.codePostal, d.ville].filter(Boolean).join(", ");
      setAdresse(addr);
      // Detect formeJuridique
      const fj = (d.formeJuridique || "").toUpperCase();
      if (fj.includes("SARL") || fj.includes("EURL")) setFormeJuridique(fj.includes("EURL") ? "EURL" : "SARL");
      else if (fj.includes("SAS") || fj.includes("SASU")) setFormeJuridique(fj.includes("SASU") ? "SASU" : "SAS");
      else if (fj.includes("SA")) setFormeJuridique("SA");
      else if (fj.includes("SCI")) setFormeJuridique("SCI");
      else if (fj.includes("SNC")) setFormeJuridique("SNC");
    } catch {
      setSirenError("SIREN introuvable. Renseignez les informations manuellement.");
    } finally {
      setSirenLoading(false);
    }
  }

  // ── Generate document ─────────────────────────────────────────────────────
  function buildData(): DissolutionData {
    return {
      denomination, formeJuridique, capital, rcsVille, rcsNumero, adresse, nombrePartsTotal,
      typeAssemblee,
      date: dateDecision, ville: villeDecision, heure: heureDecision,
      associeUniqueCivilite: assocUniqueCivilite,
      associeUniqueNom: assocUniqueNom, associeUniquePrenom: assocUniquePrenom,
      partsPresentes,
      presidentCivilite, presidentNom, presidentPrenom, presidentQualite,
      hasCac, cacNom, cacPresent,
      hasCe, cePresent,
      typeLiquidateur,
      liquidateurCivilite: liqCivilite,
      liquidateurNom: liqNom, liquidateurPrenom: liqPrenom, liquidateurAdresse: liqAdresse,
      estActuelGerant,
      liquidateurDenomination: liqDenomination,
      liquidateurRcsVille: liqRcsVille, liquidateurRcsNumero: liqRcsNumero,
      liquidateurRepresentant: liqRepresentant,
      siegeLiquidation, adresseLiquidationAutre, hasRemuneration, remunerationMontant,
      toutesResUnanimesAGE,
      res1Pour, res1Contre, res1Abstentions,
      res2Pour, res2Contre, res2Abstentions,
      res3Pour, res3Contre, res3Abstentions,
      res4Pour, res4Contre, res4Abstentions,
    };
  }

  function generateDocument() {
    const text = generatePVDissolution(buildData());
    setPvText(text);
  }

  async function downloadDocx() {
    if (!pvText) return;
    setDocxLoading(true);
    try {
      const blob = await generateDissolutionDocx(pvText);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PV-Dissolution-${denomination || "societe"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDocxLoading(false);
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function next() {
    if (step === 5) generateDocument();
    setStep((s) => Math.min(s + 1, STEPS.length));
  }
  function prev() { setStep((s) => Math.max(s - 1, 1)); }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Procès-Verbal de Dissolution</h1>
          <p className="text-sm text-slate-500">Génération automatique de votre PV de dissolution</p>
        </div>
      </header>

      {/* Steps indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max mx-auto max-w-4xl">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? "bg-blue-600 text-white" : done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                }`}>
                  {done ? <CheckCircle size={12} /> : <Icon size={12} />}
                  {s.label}
                </div>
                {s.id < STEPS.length && <div className={`w-4 h-px ${done ? "bg-green-300" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── STEP 1 — La société ───────────────────────────────────────── */}
            {step === 1 && (
              <Card title="La société" subtitle="Informations d'identification de la société concernée">
                <div className="space-y-4">
                  {/* SIREN lookup */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recherche par SIREN (optionnel)</label>
                    <div className="flex gap-2">
                      <Input
                        value={sirenInput}
                        onChange={(e) => setSirenInput(e.target.value)}
                        placeholder="ex : 123 456 789"
                        onKeyDown={(e) => e.key === "Enter" && lookupSiren()}
                      />
                      <Button variant="outline" onClick={lookupSiren} disabled={sirenLoading}>
                        {sirenLoading ? <Loader2 size={16} className="animate-spin" /> : "Rechercher"}
                      </Button>
                    </div>
                    {sirenError && <p className="text-sm text-red-500 mt-1">{sirenError}</p>}
                  </div>

                  <div className="border-t border-slate-100 pt-4 grid grid-cols-1 gap-4">
                    <Field label="Dénomination sociale *">
                      <Input value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="ex : DUPONT CONSEILS" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Forme juridique *">
                        <Select value={formeJuridique} onValueChange={setFormeJuridique}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["SARL","EURL","SAS","SASU","SA","SCI","SNC","Autre"].map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Capital social (€) *">
                        <Input value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="ex : 10 000" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ville du RCS *">
                        <Input value={rcsVille} onChange={(e) => setRcsVille(e.target.value)} placeholder="ex : Paris" />
                      </Field>
                      <Field label="Numéro RCS *">
                        <Input value={rcsNumero} onChange={(e) => setRcsNumero(e.target.value)} placeholder="ex : 123 456 789" />
                      </Field>
                    </div>
                    <Field label="Siège social (adresse complète) *">
                      <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="ex : 10 rue de la Paix, 75001 Paris" />
                    </Field>
                    <Field label="Nombre total de parts / actions">
                      <Input value={nombrePartsTotal} onChange={(e) => setNombrePartsTotal(e.target.value)} placeholder="ex : 1000" />
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {/* ── STEP 2 — Type de décision ─────────────────────────────────── */}
            {step === 2 && (
              <Card title="Type de décision" subtitle="Comment la décision de dissolution est-elle prise ?">
                <div className="space-y-3">
                  {([
                    { value: "associe_unique", label: "Décision de l'associé unique", desc: "Société à associé unique (EURL, SASU...)" },
                    { value: "unanime", label: "Décisions unanimes des associés", desc: "Tous les associés décident sans réunion formelle" },
                    { value: "AGE", label: "Assemblée Générale Extraordinaire", desc: "Réunion formelle avec quorum, président, procès-verbal complet" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTypeAssemblee(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        typeAssemblee === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="font-semibold text-slate-800">{opt.label}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* ── STEP 3 — Détails assemblée ───────────────────────────────── */}
            {step === 3 && (
              <Card
                title="Détails de la décision"
                subtitle={typeAssemblee === "AGE" ? "Informations relatives à l'Assemblée Générale Extraordinaire" : "Date et lieu de la décision"}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Date de la décision *">
                      <Input type="date" value={dateDecision} onChange={(e) => setDateDecision(e.target.value)} />
                    </Field>
                    <Field label="Lieu *">
                      <Input value={villeDecision} onChange={(e) => setVilleDecision(e.target.value)} placeholder="ex : Paris" />
                    </Field>
                  </div>

                  {/* Associé unique */}
                  {typeAssemblee === "associe_unique" && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Identité de l'associé unique</p>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Civilité">
                          <Select value={assocUniqueCivilite} onValueChange={(v) => setAssocUniqueCivilite(v as "M." | "Mme")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.">M.</SelectItem>
                              <SelectItem value="Mme">Mme</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Nom *">
                          <Input value={assocUniqueNom} onChange={(e) => setAssocUniqueNom(e.target.value)} placeholder="NOM" />
                        </Field>
                        <Field label="Prénom *">
                          <Input value={assocUniquePrenom} onChange={(e) => setAssocUniquePrenom(e.target.value)} placeholder="Prénom" />
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* AGE */}
                  {typeAssemblee === "AGE" && (
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <Field label="Heure de la réunion">
                        <Input type="time" value={heureDecision} onChange={(e) => setHeureDecision(e.target.value)} />
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Parts/actions présentes">
                          <Input value={partsPresentes} onChange={(e) => setPartsPresentes(e.target.value)} placeholder="ex : 900" />
                        </Field>
                        <Field label="Total parts/actions">
                          <Input value={nombrePartsTotal} onChange={(e) => setNombrePartsTotal(e.target.value)} placeholder="ex : 1000" />
                        </Field>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-3">Président de séance</p>
                        <div className="grid grid-cols-4 gap-3">
                          <Field label="Civilité">
                            <Select value={presidentCivilite} onValueChange={(v) => setPresidentCivilite(v as "M." | "Mme")}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M.">M.</SelectItem>
                                <SelectItem value="Mme">Mme</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Nom">
                            <Input value={presidentNom} onChange={(e) => setPresidentNom(e.target.value)} placeholder="NOM" />
                          </Field>
                          <Field label="Prénom">
                            <Input value={presidentPrenom} onChange={(e) => setPresidentPrenom(e.target.value)} placeholder="Prénom" />
                          </Field>
                          <Field label="Qualité">
                            <Input value={presidentQualite} onChange={(e) => setPresidentQualite(e.target.value)} placeholder="Président" />
                          </Field>
                        </div>
                      </div>

                      {/* CAC */}
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={hasCac} onCheckedChange={(v) => setHasCac(!!v)} />
                          <span className="text-sm font-medium text-slate-700">Commissaire aux comptes présent(e) à convoquer</span>
                        </label>
                        {hasCac && (
                          <div className="pl-6 grid grid-cols-2 gap-3">
                            <Field label="Nom du CAC">
                              <Input value={cacNom} onChange={(e) => setCacNom(e.target.value)} placeholder="ex : Cabinet AUDIT SA" />
                            </Field>
                            <Field label="Présence">
                              <Select value={cacPresent ? "present" : "absent"} onValueChange={(v) => setCacPresent(v === "present")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Présent</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                        )}
                      </div>

                      {/* CE */}
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={hasCe} onCheckedChange={(v) => setHasCe(!!v)} />
                          <span className="text-sm font-medium text-slate-700">Comité d'entreprise à convoquer</span>
                        </label>
                        {hasCe && (
                          <div className="pl-6">
                            <Field label="Présence des représentants du CE">
                              <Select value={cePresent ? "present" : "absent"} onValueChange={(v) => setCePresent(v === "present")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Présents</SelectItem>
                                  <SelectItem value="absent">Absents</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── STEP 4 — Le liquidateur ───────────────────────────────────── */}
            {step === 4 && (
              <Card title="Le liquidateur" subtitle="Identité de la personne ou société nommée liquidateur">
                <div className="space-y-4">
                  {/* Type toggle */}
                  <div className="flex gap-2">
                    {(["physique", "morale"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeLiquidateur(t)}
                        className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          typeLiquidateur === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {t === "physique" ? "Personne physique" : "Personne morale (société)"}
                      </button>
                    ))}
                  </div>

                  {typeLiquidateur === "physique" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Civilité">
                          <Select value={liqCivilite} onValueChange={(v) => setLiqCivilite(v as "M." | "Mme")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.">M.</SelectItem>
                              <SelectItem value="Mme">Mme</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Nom *">
                          <Input value={liqNom} onChange={(e) => setLiqNom(e.target.value)} placeholder="NOM" />
                        </Field>
                        <Field label="Prénom *">
                          <Input value={liqPrenom} onChange={(e) => setLiqPrenom(e.target.value)} placeholder="Prénom" />
                        </Field>
                      </div>
                      <Field label="Adresse domicile *">
                        <Input value={liqAdresse} onChange={(e) => setLiqAdresse(e.target.value)} placeholder="ex : 5 rue Victor Hugo, 75001 Paris" />
                      </Field>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={estActuelGerant} onCheckedChange={(v) => setEstActuelGerant(!!v)} />
                        <span className="text-sm text-slate-700">Le liquidateur est l'actuel gérant/président de la Société</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Field label="Dénomination de la société *">
                        <Input value={liqDenomination} onChange={(e) => setLiqDenomination(e.target.value)} placeholder="ex : GESTION LIQUI SAS" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Ville du RCS *">
                          <Input value={liqRcsVille} onChange={(e) => setLiqRcsVille(e.target.value)} placeholder="ex : Lyon" />
                        </Field>
                        <Field label="Numéro RCS *">
                          <Input value={liqRcsNumero} onChange={(e) => setLiqRcsNumero(e.target.value)} placeholder="ex : 987 654 321" />
                        </Field>
                      </div>
                      <Field label="Représentant (nom & qualité) *">
                        <Input value={liqRepresentant} onChange={(e) => setLiqRepresentant(e.target.value)} placeholder="ex : M. Jean DUPONT, Président" />
                      </Field>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── STEP 5 — Options ─────────────────────────────────────────── */}
            {step === 5 && (
              <Card title="Options de dissolution" subtitle="Siège de liquidation, rémunération et votes">
                <div className="space-y-6">
                  {/* Siège de liquidation */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Siège social de la liquidation</p>
                    <div className="space-y-2">
                      {([
                        { value: "siege", label: "Au siège de la Société" },
                        { value: "domicile", label: "Au domicile du liquidateur" },
                        { value: "autre", label: "À une autre adresse" },
                      ] as const).map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="siege"
                            value={opt.value}
                            checked={siegeLiquidation === opt.value}
                            onChange={() => setSiegeLiquidation(opt.value)}
                            className="accent-blue-600"
                          />
                          <span className="text-sm text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {siegeLiquidation === "autre" && (
                      <div className="mt-3">
                        <Field label="Adresse de liquidation *">
                          <Input value={adresseLiquidationAutre} onChange={(e) => setAdresseLiquidationAutre(e.target.value)} placeholder="ex : 12 avenue Foch, 75016 Paris" />
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* Rémunération du liquidateur */}
                  <div className="border-t border-slate-100 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <Checkbox checked={hasRemuneration} onCheckedChange={(v) => setHasRemuneration(!!v)} />
                      <span className="text-sm font-medium text-slate-700">Le liquidateur perçoit une rémunération</span>
                    </label>
                    {hasRemuneration && (
                      <Field label="Montant mensuel (€) *">
                        <Input value={remunerationMontant} onChange={(e) => setRemunerationMontant(e.target.value)} placeholder="ex : 500" />
                      </Field>
                    )}
                  </div>

                  {/* Votes AGE */}
                  {typeAssemblee === "AGE" && (
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={toutesResUnanimesAGE} onCheckedChange={(v) => setToutesResUnanimesAGE(!!v)} />
                        <span className="text-sm font-medium text-slate-700">Toutes les résolutions adoptées à l'unanimité</span>
                      </label>

                      {!toutesResUnanimesAGE && (
                        <div className="space-y-4">
                          {[
                            { label: "Résolution 1 — Dissolution", pour: res1Pour, setPour: setRes1Pour, contre: res1Contre, setContre: setRes1Contre, abstentions: res1Abstentions, setAbstentions: setRes1Abstentions },
                            { label: "Résolution 2 — Nomination du liquidateur", pour: res2Pour, setPour: setRes2Pour, contre: res2Contre, setContre: setRes2Contre, abstentions: res2Abstentions, setAbstentions: setRes2Abstentions },
                            { label: "Résolution 3 — Missions du liquidateur", pour: res3Pour, setPour: setRes3Pour, contre: res3Contre, setContre: setRes3Contre, abstentions: res3Abstentions, setAbstentions: setRes3Abstentions },
                            { label: "Résolution 4 — Délégation de pouvoirs", pour: res4Pour, setPour: setRes4Pour, contre: res4Contre, setContre: setRes4Contre, abstentions: res4Abstentions, setAbstentions: setRes4Abstentions },
                          ].map((res) => (
                            <div key={res.label} className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-slate-600 mb-2">{res.label}</p>
                              <div className="grid grid-cols-3 gap-3">
                                <Field label="Votes pour">
                                  <Input value={res.pour} onChange={(e) => res.setPour(e.target.value)} placeholder="ex : 8" />
                                </Field>
                                <Field label="Votes contre">
                                  <Input value={res.contre} onChange={(e) => res.setContre(e.target.value)} placeholder="ex : 1" />
                                </Field>
                                <Field label="Abstentions">
                                  <Input value={res.abstentions} onChange={(e) => res.setAbstentions(e.target.value)} placeholder="ex : 0" />
                                </Field>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── STEP 6 — Document généré ──────────────────────────────────── */}
            {step === 6 && (
              <Card title="Procès-Verbal de Dissolution" subtitle="Votre document est prêt">
                <div className="space-y-4">
                  {/* Download button */}
                  <div className="flex gap-3">
                    <Button onClick={downloadDocx} disabled={docxLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                      {docxLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      Télécharger en DOCX
                    </Button>
                    <Button variant="outline" onClick={() => { setStep(1); setPvText(""); }}>
                      Nouveau document
                    </Button>
                  </div>

                  {/* Preview */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {pvText}
                    </pre>
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    Ce document est fourni à titre indicatif et ne constitue pas un conseil juridique. Consultez un professionnel pour toute démarche officielle.
                  </p>
                </div>
              </Card>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 6 && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prev} disabled={step === 1} className="flex items-center gap-2">
              <ArrowLeft size={16} /> Précédent
            </Button>
            <Button onClick={next} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {step === 5 ? "Générer le document" : "Suivant"} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
