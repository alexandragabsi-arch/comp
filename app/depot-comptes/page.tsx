"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Building2,
  Calendar,
  Shield,
  FileText,
  CreditCard,
  CheckCircle2,
  Search,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";

/* ───────── Date Select Component ───────── */
function DateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = (value || "").split("-");
  const year = parts[0] || "";
  const month = parts[1] || "";
  const day = parts[2] || "";
  const update = (y: string, m: string, d: string) => {
    if (y && m && d) onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    else onChange("");
  };
  const currentYear = new Date().getFullYear();
  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={day} onChange={(e) => update(year, month, e.target.value)} className="px-3 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-gray-800 bg-white">
        <option value="">Jour</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (<option key={d} value={String(d).padStart(2, "0")}>{d}</option>))}
      </select>
      <select value={month} onChange={(e) => update(year, e.target.value, day)} className="px-3 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-gray-800 bg-white">
        <option value="">Mois</option>
        {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m, i) => (<option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>))}
      </select>
      <select value={year} onChange={(e) => update(e.target.value, month, day)} className="px-3 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-gray-800 bg-white">
        <option value="">Année</option>
        {Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) => (<option key={y} value={String(y)}>{y}</option>))}
      </select>
    </div>
  );
}

/* ───────── Constants ───────── */
const TOTAL_STEPS = 11;
const NAVY = "#0d1f4e";
const BLUE = "#2563EB";

const HT_PRICE = 99;
const GREFFE_FEES = 44.77;
const TVA_RATE = 0.2;
const TOTAL_HT = HT_PRICE + GREFFE_FEES;
const TOTAL_TTC = +(TOTAL_HT * (1 + TVA_RATE)).toFixed(2);

/* ───────── Transition variants ───────── */
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const pageTransition = { type: "spring" as const, stiffness: 300, damping: 30 };

/* ───────── Upload zone types ───────── */
interface DocZone {
  key: string;
  label: string;
  required: boolean;
}

const DOC_ZONES: DocZone[] = [
  { key: "bilan", label: "Bilan", required: true },
  { key: "compte_resultat", label: "Compte de r\u00e9sultat", required: true },
  { key: "annexe", label: "Annexe comptable", required: true },
  { key: "pv_approbation", label: "PV d\u2019approbation des comptes / D\u00e9cision de l\u2019associ\u00e9 unique", required: true },
  { key: "rapport_gestion", label: "Rapport de gestion (si applicable)", required: false },
  { key: "rapport_cac", label: "Rapport du CAC (si applicable)", required: false },
];

/* ───────── Heure options ───────── */
const HEURE_OPTIONS = ["9h", "9h30", "10h", "10h30", "11h", "14h", "14h30", "15h", "16h", "17h"];

/* ───────── Main component ───────── */
export default function DepotComptesPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<Record<string, any>>({});

  /* ── Stripe return detection ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setStep(5);
      window.history.replaceState({}, "", "/depot-comptes");
    }
  }, []);

  /* SIREN lookup state */
  const [sirenInput, setSirenInput] = useState("");
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError] = useState<string | null>(null);
  const [sirenFound, setSirenFound] = useState(false);

  /* File refs */
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateData = (key: string, value: any) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    setDirection(1);
    setStep((s) => {
      let next = s + 1;
      // Skip step 8 (affectation details) if perte
      if (next === 8 && data.type_resultat === "perte") next = 10;
      // Skip step 9 (dividendes historique) if no dividendes
      if (next === 9 && (!data.dividendes || parseFloat(data.dividendes) <= 0)) next = 10;
      return Math.min(next, TOTAL_STEPS - 1);
    });
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => {
      let prev = s - 1;
      // Skip step 9 going back if no dividendes
      if (prev === 9 && (!data.dividendes || parseFloat(data.dividendes) <= 0)) prev = 8;
      // Skip step 8 going back if perte
      if (prev === 8 && data.type_resultat === "perte") prev = 7;
      return Math.max(prev, 0);
    });
  };

  /* ── SIREN lookup ── */
  const lookupSiren = useCallback(async () => {
    const clean = sirenInput.replace(/\s/g, "");
    if (!/^\d{9}$/.test(clean)) {
      setSirenError("Veuillez entrer un num\u00e9ro SIREN valide (9 chiffres)");
      return;
    }
    setSirenLoading(true);
    setSirenError(null);
    try {
      const res = await fetch(`/api/siren?siren=${clean}`);
      if (res.ok) {
        const json = await res.json();
        updateData("siren", clean);
        updateData("denomination", json.denominationSociale || "");
        updateData("forme_juridique", json.formeJuridique || "");
        updateData(
          "adresse_siege",
          [json.siegeSocial, json.codePostal, json.ville].filter(Boolean).join(", ")
        );
        setSirenFound(true);
      } else {
        setSirenError("SIREN non trouv\u00e9 \u2014 veuillez remplir les informations manuellement.");
        setSirenFound(false);
      }
    } catch {
      setSirenError("Erreur de connexion. Veuillez remplir manuellement.");
      setSirenFound(false);
    } finally {
      setSirenLoading(false);
    }
  }, [sirenInput]);

  /* ── File handler ── */
  const handleFile = (key: string, files: FileList | null) => {
    if (files && files.length > 0) {
      updateData(`file_${key}`, files[0]);
    }
  };

  const removeFile = (key: string) => {
    updateData(`file_${key}`, undefined);
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  /* ───────── Progress bar ───────── */
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  /* ───────── Shared input class ───────── */
  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all placeholder:text-gray-400";

  /* ───────── Step renderers ───────── */

  const renderStep0 = () => (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] flex items-center justify-center shadow-lg shadow-blue-200">
        <FileText className="w-10 h-10 text-white" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: NAVY }}>
          D&eacute;posez vos comptes annuels<br className="hidden sm:block" /> en quelques minutes
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">Simple, rapide et conforme</p>
      </div>
      <button
        onClick={goNext}
        className="mt-4 inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200"
        style={{ background: `linear-gradient(135deg, ${BLUE}, #1E3A8A)` }}
      >
        Commencer <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          Identifiez votre soci&eacute;t&eacute;
        </h2>
        <p className="text-gray-500">Entrez votre num&eacute;ro SIREN pour pr&eacute;-remplir les informations</p>
      </div>

      {/* SIREN input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Num&eacute;ro SIREN</label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={11}
            value={sirenInput}
            onChange={(e) => setSirenInput(e.target.value.replace(/[^0-9\s]/g, ""))}
            placeholder="123 456 789"
            className={inputClass}
          />
          <button
            onClick={lookupSiren}
            disabled={sirenLoading}
            className="flex-shrink-0 px-5 py-3.5 rounded-xl bg-[#2563EB] text-white font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            {sirenLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
        {sirenError && <p className="text-sm text-red-500">{sirenError}</p>}
        {sirenFound && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Soci&eacute;t&eacute; trouv&eacute;e
          </motion.p>
        )}
      </div>

      {/* Company fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">D&eacute;nomination sociale</label>
          <input
            type="text"
            value={data.denomination || ""}
            onChange={(e) => updateData("denomination", e.target.value)}
            placeholder="Ma Soci\u00e9t\u00e9 SAS"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Forme juridique</label>
          <input
            type="text"
            value={data.forme_juridique || ""}
            onChange={(e) => updateData("forme_juridique", e.target.value)}
            placeholder="SAS, SARL, SCI..."
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Adresse du si&egrave;ge social</label>
          <input
            type="text"
            value={data.adresse_siege || ""}
            onChange={(e) => updateData("adresse_siege", e.target.value)}
            placeholder="12 rue de la Paix, 75002 Paris"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          P&eacute;riode de l&apos;exercice comptable
        </h2>
        <p className="text-gray-500">Indiquez les dates de d&eacute;but et de cl&ocirc;ture</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Date de d&eacute;but</label>
          <DateSelect value={data.date_debut || ""} onChange={(v) => updateData("date_debut", v)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Date de cl&ocirc;ture</label>
          <DateSelect value={data.date_cloture || ""} onChange={(v) => updateData("date_cloture", v)} />
        </div>

        {/* Premier exercice toggle */}
        <button
          onClick={() => updateData("premier_exercice", !data.premier_exercice)}
          className="flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all duration-200"
          style={{
            borderColor: data.premier_exercice ? BLUE : "#e5e7eb",
            backgroundColor: data.premier_exercice ? "#eff6ff" : "transparent",
          }}
        >
          <div
            className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0"
            style={{
              borderColor: data.premier_exercice ? BLUE : "#d1d5db",
              backgroundColor: data.premier_exercice ? BLUE : "transparent",
            }}
          >
            {data.premier_exercice && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <span className="text-gray-700 font-medium text-sm">Premier exercice de la soci&eacute;t&eacute;</span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="w-full max-w-xl space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          Souhaitez-vous que vos comptes restent confidentiels ?
        </h2>
        <p className="text-gray-500">Choisissez le mode de publication de vos comptes</p>
      </div>

      <div className="grid gap-4">
        {[
          {
            value: "oui",
            title: "Oui \u2014 Comptes confidentiels",
            desc: "Possible pour les micro-entreprises et petites entreprises. Vos comptes ne seront pas visibles publiquement.",
          },
          {
            value: "non",
            title: "Non \u2014 Publication int\u00e9grale",
            desc: "Vos comptes annuels seront accessibles au public via le greffe du tribunal de commerce.",
          },
        ].map((opt) => {
          const selected = data.confidentialite === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => updateData("confidentialite", opt.value)}
              className="text-left p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: selected ? BLUE : "#e5e7eb",
                backgroundColor: selected ? "#eff6ff" : "white",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{
                    borderColor: selected ? BLUE : "#d1d5db",
                    backgroundColor: selected ? BLUE : "transparent",
                  }}
                >
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="w-full max-w-xl space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          T&eacute;l&eacute;versez vos documents comptables
        </h2>
        <p className="text-gray-500">Formats accept&eacute;s : PDF, JPG, PNG (max 10 Mo)</p>
      </div>

      <div className="space-y-4">
        {DOC_ZONES.map((zone) => {
          const file = data[`file_${zone.key}`] as File | undefined;
          return (
            <div key={zone.key} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {zone.label}
                {zone.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {file ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-emerald-800 font-medium truncate flex-1">{file.name}</span>
                  <button onClick={() => removeFile(zone.key)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#2563EB] hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(zone.key, e.dataTransfer.files);
                  }}
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Glissez un fichier ou <span className="text-[#2563EB] font-medium">parcourir</span>
                  </span>
                  <input
                    ref={(el) => { fileRefs.current[zone.key] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFile(zone.key, e.target.files)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep5 = () => {
    const formatDate = (d: string) => {
      if (!d) return "\u2014";
      const [y, m, day] = d.split("-");
      return `${day}/${m}/${y}`;
    };

    return (
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
            R&eacute;capitulatif
          </h2>
          <p className="text-gray-500">V&eacute;rifiez les informations avant paiement</p>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 divide-y divide-gray-200">
          <div className="p-5 space-y-2">
            <p className="text-sm text-gray-500">Soci&eacute;t&eacute;</p>
            <p className="font-semibold text-gray-900">{data.denomination || "\u2014"}</p>
          </div>
          <div className="p-5 space-y-2">
            <p className="text-sm text-gray-500">Exercice comptable</p>
            <p className="font-semibold text-gray-900">
              {formatDate(data.date_debut)} &rarr; {formatDate(data.date_cloture)}
            </p>
          </div>
          <div className="p-5 space-y-2">
            <p className="text-sm text-gray-500">Confidentialit&eacute;</p>
            <p className="font-semibold text-gray-900">
              {data.confidentialite === "oui" ? "Comptes confidentiels" : "Publication int\u00e9grale"}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex justify-between text-gray-700">
            <span>Service LegalCorners</span>
            <span className="font-medium">{HT_PRICE.toFixed(2)} &euro; HT</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Frais de greffe</span>
            <span className="font-medium">{GREFFE_FEES.toFixed(2)} &euro;</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between items-baseline">
            <span className="text-lg font-bold" style={{ color: NAVY }}>
              Total TTC
            </span>
            <span className="text-2xl font-bold" style={{ color: BLUE }}>
              {TOTAL_TTC.toFixed(2)} &euro;
            </span>
          </div>
        </div>

        <button
          onClick={async () => {
            updateData("stripe_loading", true);
            try {
              const res = await fetch("/api/stripe/checkout-depot-comptes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  formule: "essentiel",
                  stateKey: "",
                }),
              });
              const result = await res.json();
              if (result.url) {
                window.location.href = result.url;
              } else {
                updateData("stripe_error", result.error || "Erreur paiement");
                updateData("stripe_loading", false);
              }
            } catch {
              updateData("stripe_error", "Erreur de connexion");
              updateData("stripe_loading", false);
            }
          }}
          disabled={data.stripe_loading}
          className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${BLUE}, #1E3A8A)` }}
        >
          {data.stripe_loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Redirection...</>
          ) : (
            <>Payer et déposer <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
        {data.stripe_error && <p className="text-sm text-red-500 text-center mt-2">{data.stripe_error}</p>}
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="flex flex-col items-center text-center gap-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>
          Vos comptes ont &eacute;t&eacute; d&eacute;pos&eacute;s avec succ&egrave;s !
        </h2>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Vous recevrez une confirmation par email dans quelques minutes.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200"
        style={{ background: `linear-gradient(135deg, ${BLUE}, #1E3A8A)` }}
      >
        Retour au tableau de bord <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );

  /* ── Step 7: Résultat de l'exercice ── */
  const renderStep7 = () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          Quel est le r&eacute;sultat de l&apos;exercice ?
        </h2>
        <p className="text-gray-500">Indiquez si l&apos;exercice s&apos;est sold&eacute; par un b&eacute;n&eacute;fice ou une perte</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { value: "benefice", label: "Bénéfice", emoji: "📈" },
          { value: "perte", label: "Perte", emoji: "📉" },
        ].map((opt) => {
          const selected = data.type_resultat === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => updateData("type_resultat", opt.value)}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: selected ? BLUE : "#e5e7eb",
                backgroundColor: selected ? "#eff6ff" : "white",
              }}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="font-semibold text-gray-900">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Montant du r&eacute;sultat (&euro;)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={data.montant_resultat || ""}
          onChange={(e) => updateData("montant_resultat", e.target.value)}
          placeholder="0.00"
          className={inputClass}
        />
      </div>
    </div>
  );

  /* ── Step 8: Affectation du résultat ── */
  const renderStep8 = () => {
    const montant = parseFloat(data.montant_resultat) || 0;
    const reserve_legale = parseFloat(data.reserve_legale) || 0;
    const reserve_statutaire = parseFloat(data.reserve_statutaire) || 0;
    const report_nouveau = parseFloat(data.report_nouveau) || 0;
    const dividendes = parseFloat(data.dividendes) || 0;
    const total = reserve_legale + reserve_statutaire + report_nouveau + dividendes;
    const diff = +(montant - total).toFixed(2);

    if (data.type_resultat === "perte") {
      return (
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
              Affectation du r&eacute;sultat
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-amber-800 font-medium">
              La perte de {montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro; sera affect&eacute;e au report &agrave; nouveau d&eacute;biteur.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
            Comment souhaitez-vous affecter le b&eacute;n&eacute;fice ?
          </h2>
          <p className="text-gray-500">
            B&eacute;n&eacute;fice &agrave; r&eacute;partir : {montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">R&eacute;serve l&eacute;gale (&euro;)</label>
            <p className="text-xs text-gray-400">5% du b&eacute;n&eacute;fice jusqu&apos;&agrave; 10% du capital</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.reserve_legale || ""}
              onChange={(e) => updateData("reserve_legale", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">R&eacute;serve statutaire (&euro;)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.reserve_statutaire || ""}
              onChange={(e) => updateData("reserve_statutaire", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Report &agrave; nouveau (&euro;)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.report_nouveau || ""}
              onChange={(e) => updateData("report_nouveau", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Dividendes distribu&eacute;s (&euro;)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.dividendes || ""}
              onChange={(e) => updateData("dividendes", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        {/* Total indicator */}
        <div
          className="p-4 rounded-xl border-2 text-center transition-all"
          style={{
            borderColor: diff === 0 ? "#10b981" : "#f59e0b",
            backgroundColor: diff === 0 ? "#ecfdf5" : "#fffbeb",
          }}
        >
          <p className="text-sm font-medium" style={{ color: diff === 0 ? "#065f46" : "#92400e" }}>
            Total affect&eacute; : {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;
            {diff !== 0 && (
              <span className="ml-2">
                (reste {diff > 0 ? "+" : ""}{diff.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;)
              </span>
            )}
            {diff === 0 && <span className="ml-2">&mdash; Affectation compl&egrave;te</span>}
          </p>
        </div>
      </div>
    );
  };

  /* ── Step 9: Dividendes historique ── */
  const renderStep9 = () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          Historique des dividendes des 3 derniers exercices
        </h2>
        <p className="text-gray-500">Ces informations sont requises pour le PV d&apos;approbation</p>
      </div>

      <div className="space-y-4">
        {[
          { key: "dividendes_n1", label: "Exercice N-1 (€)" },
          { key: "dividendes_n2", label: "Exercice N-2 (€)" },
          { key: "dividendes_n3", label: "Exercice N-3 (€)" },
        ].map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data[field.key] || ""}
              onChange={(e) => updateData(field.key, e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Step 10: Assemblée générale ── */
  const renderStep10 = () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mb-2">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
          Informations sur l&apos;assembl&eacute;e g&eacute;n&eacute;rale
        </h2>
        <p className="text-gray-500">Param&egrave;tres de l&apos;AG d&apos;approbation des comptes</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Date de l&apos;AG</label>
          <DateSelect value={data.date_ag || ""} onChange={(v) => updateData("date_ag", v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Heure d&apos;ouverture</label>
            <select
              value={data.heure_ouverture || ""}
              onChange={(e) => updateData("heure_ouverture", e.target.value)}
              className={inputClass}
            >
              <option value="">Choisir</option>
              {HEURE_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Heure de cl&ocirc;ture</label>
            <select
              value={data.heure_cloture || ""}
              onChange={(e) => updateData("heure_cloture", e.target.value)}
              className={inputClass}
            >
              <option value="">Choisir</option>
              {HEURE_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Lieu de l&apos;AG</label>
          <input
            type="text"
            value={data.lieu_ag ?? data.adresse_siege ?? ""}
            onChange={(e) => updateData("lieu_ag", e.target.value)}
            placeholder="Adresse du lieu de l'assemblée"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Pr&eacute;sident de s&eacute;ance</label>
          <input
            type="text"
            value={data.president_seance ?? data.president_nom ?? ""}
            onChange={(e) => updateData("president_seance", e.target.value)}
            placeholder="Nom du président de séance"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );

  /* ── Step 11: Confirmation finale ── */
  const renderStep11 = () => (
    <div className="flex flex-col items-center text-center gap-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>
          Votre PV d&apos;approbation des comptes a &eacute;t&eacute; g&eacute;n&eacute;r&eacute;
        </h2>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Vous pouvez t&eacute;l&eacute;charger le document ou le pr&eacute;visualiser ci-dessous.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            /* TODO: generateSasuDocumentDocx(buildPVAGO(data)) */
          }}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200"
          style={{ background: `linear-gradient(135deg, ${BLUE}, #1E3A8A)` }}
        >
          <FileText className="w-5 h-5" /> T&eacute;l&eacute;charger le PV (.docx)
        </button>
        <button
          onClick={() => updateData("show_preview", true)}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-gray-200 text-gray-700 hover:border-[#2563EB] hover:text-[#2563EB] transition-all duration-200"
        >
          <Search className="w-5 h-5" /> Aper&ccedil;u du PV
        </button>
      </div>
      <Link
        href="/dashboard"
        className="mt-2 text-[#2563EB] font-medium hover:underline transition-all"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep5, renderStep7, renderStep8, renderStep9, renderStep10, renderStep4, renderStep11];

  /* ───────── Can proceed logic ───────── */
  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return !!(data.denomination && data.forme_juridique && data.adresse_siege);
      case 2:
        return !!(data.date_debut && data.date_cloture);
      case 3:
        return !!data.confidentialite;
      case 4: {
        const requiredKeys = DOC_ZONES.filter((z) => z.required).map((z) => `file_${z.key}`);
        return requiredKeys.every((k) => data[k]);
      }
      case 5:
        return true;
      case 7:
        return !!(data.type_resultat && data.montant_resultat);
      case 8: {
        if (data.type_resultat === "perte") return true;
        const rl = parseFloat(data.reserve_legale) || 0;
        const rs = parseFloat(data.reserve_statutaire) || 0;
        const rn = parseFloat(data.report_nouveau) || 0;
        const dv = parseFloat(data.dividendes) || 0;
        const montant = parseFloat(data.montant_resultat) || 0;
        return Math.abs(rl + rs + rn + dv - montant) < 0.01;
      }
      case 9:
        return true;
      case 10:
        return !!(data.date_ag && data.heure_ouverture);
      default:
        return true;
    }
  };

  /* ───────── Render ───────── */
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div>
              <div className="flex items-center gap-0.5">
                <span className="text-[18px] font-bold text-[#0d1f4e] leading-none" style={{ fontFamily: "Georgia, serif" }}>Legal</span>
                <Search className="w-[11px] h-[11px] text-[#0d1f4e] -mt-0.5" />
              </div>
              <div className="ml-[24px] -mt-0.5">
                <span className="text-[18px] font-bold text-[#0d1f4e] leading-none" style={{ fontFamily: "Georgia, serif" }}>corners</span>
              </div>
            </div>
          </Link>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <span className="text-sm text-gray-400">
              &Eacute;tape {step} / {TOTAL_STEPS - 2}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: `linear-gradient(90deg, ${BLUE}, #1E3A8A)` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="w-full flex flex-col items-center"
          >
            {steps[step]()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom nav ── */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <footer className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            {step < TOTAL_STEPS - 2 && step !== 4 && (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-white font-semibold shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #1E3A8A)` }}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
