"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronUp, ChevronDown,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── helpers ───────── */

function Field({ label, value, onChange, placeholder = "", type = "text", required = true, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1E3A8A] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border-2 border-[#c5d5f0] focus:border-[#4A6FE3] focus:outline-none text-sm transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1E3A8A] mb-1.5">
        {label} <span className="text-red-400">*</span>
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border-2 border-[#c5d5f0] focus:border-[#4A6FE3] focus:outline-none text-sm transition-colors bg-white"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f0f5ff] border border-[#c5d5f0] rounded-lg p-5 mt-4">
      <p className="text-sm font-bold text-[#4A6FE3] mb-2">{title}</p>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-6">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 mb-4 group">
        <h3 className="text-lg font-bold text-[#1E3A8A]">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-[#1E3A8A]" /> : <ChevronDown className="w-4 h-4 text-[#1E3A8A]" />}
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}

/* ───────── steps config ───────── */

const STEPS = [
  { id: 1, label: "Informations\nutilisateur", icon: User },
  { id: 2, label: "Société (infos\nde base)", icon: Building2 },
  { id: 3, label: "Paiement", icon: CreditCard },
  { id: 4, label: "Dossier\njuridique", icon: FolderOpen },
  { id: 5, label: "Récapitulatif &\nValidation", icon: CheckCircle2 },
  { id: 6, label: "Pièces\njustificatives", icon: FileUp },
];

/* ───────── main page ───────── */

export default function CreationSASUPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Informations utilisateur
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

  // Step 2 — Société
  const [denomination, setDenomination] = useState("");
  const [objetSocial, setObjetSocial] = useState("");
  const [siegeSocial, setSiegeSocial] = useState("");
  const [siegeCodePostal, setSiegeCodePostal] = useState("");
  const [siegeVille, setSiegeVille] = useState("");
  const [capitalSocial, setCapitalSocial] = useState("");
  const [nombreActions, setNombreActions] = useState("");
  const [dateDebutActivite, setDateDebutActivite] = useState("");
  const [dureeStatuts, setDureeStatuts] = useState("99");
  const [dateClotureExercice, setDateClotureExercice] = useState("31/12");

  // Step 4 — Dossier juridique
  const [presidentRemuneration, setPresidentRemuneration] = useState("non");
  const [regimeFiscal, setRegimeFiscal] = useState("is");
  const [regimeTVA, setRegimeTVA] = useState("franchise");
  const [clauseAgrement, setClauseAgrement] = useState(true);

  // Validation
  const step1Valid = nom.trim().length > 0 && prenom.trim().length > 0 && dateNaissance.length > 0 && adresse.trim().length > 0 && email.trim().length > 0;
  const step2Valid = denomination.trim().length > 0 && objetSocial.trim().length > 0 && siegeSocial.trim().length > 0 && capitalSocial.trim().length > 0;

  const canGoNext = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    return true;
  };

  const handleSubmitDossier = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company_name: denomination,
          type: "creation_sasu",
          status: "en_cours",
          data: {
            civilite, nom, prenom, dateNaissance, lieuNaissance, nationalite,
            adresse, codePostal, ville, telephone,
            denomination, objetSocial, siegeSocial, siegeCodePostal, siegeVille,
            capitalSocial, nombreActions, dateDebutActivite, dureeStatuts, dateClotureExercice,
            presidentRemuneration, regimeFiscal, regimeTVA, clauseAgrement,
          },
        }),
      });
    } catch { /* silent */ }
    setSubmitting(false);
    setStep(6);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} className="h-full w-auto object-contain" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-[#1E3A8A] transition-colors flex items-center gap-1">
            Nos services <ChevronDown className="w-4 h-4" />
          </span>
        </nav>
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors">
          <User className="w-4 h-4" /> Connexion
        </Link>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* ── Sidebar stepper ── */}
        <aside className="hidden md:flex flex-col items-center w-[220px] min-w-[220px] border-r border-gray-100 py-10 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <button
                  onClick={() => { if (done) setStep(s.id); }}
                  className={cn("flex flex-col items-center gap-2 group", done && "cursor-pointer")}
                >
                  <div className="relative flex items-center gap-3">
                    {/* Number circle */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      done ? "bg-[#4A6FE3] text-white" :
                      active ? "bg-[#1E3A8A] text-white ring-4 ring-[#4A6FE3]/20" :
                      "bg-white text-gray-400 border-2 border-gray-200"
                    )}>
                      {done ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    {/* Icon */}
                    <Icon className={cn(
                      "w-5 h-5",
                      active ? "text-[#1E3A8A]" : done ? "text-[#4A6FE3]" : "text-gray-300"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center whitespace-pre-line leading-tight mt-1",
                    active ? "text-[#1E3A8A]" : done ? "text-[#4A6FE3]" : "text-gray-400"
                  )}>
                    {s.label}
                  </span>
                </button>
                {/* Dotted connector */}
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-10 my-2 border-l-2 border-dotted",
                    step > s.id + 1 ? "border-[#4A6FE3]" : "border-gray-200"
                  )} />
                )}
              </div>
            );
          })}
        </aside>

        {/* ── Mobile stepper ── */}
        <div className="md:hidden flex items-center justify-center gap-1.5 py-4 px-4 border-b border-gray-100 w-full">
          {STEPS.map((s) => (
            <div key={s.id} className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
              step > s.id ? "bg-[#4A6FE3] text-white" :
              step === s.id ? "bg-[#1E3A8A] text-white" :
              "bg-gray-100 text-gray-400"
            )}>
              {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <main className="flex-1 px-6 md:px-12 py-8 md:py-10 max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-8">Création d&apos;une SASU</h1>

          {/* ════════ STEP 1 — Informations utilisateur ════════ */}
          {step === 1 && (
            <div>
              <Section title="Vos informations personnelles">
                <SelectField
                  label="Civilité"
                  value={civilite}
                  onChange={setCivilite}
                  options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nom" value={nom} onChange={setNom} placeholder="DUPONT" />
                  <Field label="Prénom" value={prenom} onChange={setPrenom} placeholder="Jean" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date de naissance" value={dateNaissance} onChange={setDateNaissance} type="date" />
                  <Field label="Lieu de naissance" value={lieuNaissance} onChange={setLieuNaissance} placeholder="Paris" required={false} />
                </div>
                <Field label="Nationalité" value={nationalite} onChange={setNationalite} placeholder="Française" />
              </Section>

              <Section title="Coordonnées">
                <Field label="Adresse" value={adresse} onChange={setAdresse} placeholder="12 rue de la Paix" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Code postal" value={codePostal} onChange={setCodePostal} placeholder="75001" />
                  <Field label="Ville" value={ville} onChange={setVille} placeholder="Paris" />
                </div>
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="jean.dupont@email.fr" />
                <Field label="Téléphone" value={telephone} onChange={setTelephone} placeholder="06 12 34 56 78" required={false} />
              </Section>

              <InfoBox title="Le saviez-vous ?">
                <p>
                  En <strong>SASU</strong>, vous êtes l&apos;associé unique et pouvez être également le président de votre société.
                  Vous bénéficiez du statut d&apos;assimilé salarié, ce qui vous donne accès au régime général de la Sécurité sociale.
                </p>
              </InfoBox>
            </div>
          )}

          {/* ════════ STEP 2 — Société ════════ */}
          {step === 2 && (
            <div>
              <Section title="Dénomination sociale">
                <Field
                  label="Nom de votre société"
                  value={denomination}
                  onChange={setDenomination}
                  placeholder="Ma Société SASU"
                  hint="Le nom sous lequel votre société sera immatriculée au RCS."
                />

                <InfoBox title="Le saviez-vous ?">
                  <p>
                    La dénomination sociale est le nom officiel de votre société.
                    Il est distinct du nom commercial (enseigne visible par le public).
                    Vérifiez que le nom choisi n&apos;est pas déjà utilisé sur <strong>infogreffe.fr</strong> ou auprès de l&apos;INPI.
                  </p>
                </InfoBox>
              </Section>

              <Section title="Objet social">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A8A] mb-1.5">
                    Description de l&apos;activité <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5">Décrivez précisément l&apos;activité principale de votre société.</p>
                  <textarea
                    value={objetSocial}
                    onChange={(e) => setObjetSocial(e.target.value)}
                    rows={4}
                    placeholder="Ex : Conseil en stratégie digitale, développement de sites web et applications mobiles, formation professionnelle..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#c5d5f0] focus:border-[#4A6FE3] focus:outline-none text-sm resize-none transition-colors"
                  />
                </div>

                <InfoBox title="Conseil pratique">
                  <p>
                    Rédigez un objet social suffisamment large pour ne pas avoir à modifier vos statuts si vous diversifiez votre activité.
                    Ajoutez toujours <em>&quot;et toutes opérations se rattachant directement ou indirectement à cet objet&quot;</em>.
                  </p>
                </InfoBox>
              </Section>

              <Section title="Siège social">
                <Field label="Adresse du siège social" value={siegeSocial} onChange={setSiegeSocial} placeholder="12 rue de la Paix" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Code postal" value={siegeCodePostal} onChange={setSiegeCodePostal} placeholder="75001" />
                  <Field label="Ville" value={siegeVille} onChange={setSiegeVille} placeholder="Paris" />
                </div>

                <InfoBox title="Le saviez-vous ?">
                  <p>
                    Vous pouvez domicilier votre SASU à votre adresse personnelle pour une durée maximale de 5 ans,
                    dans une société de domiciliation, ou dans un local commercial.
                  </p>
                </InfoBox>
              </Section>

              <Section title="Capital social">
                <Field
                  label="Montant du capital social (€)"
                  value={capitalSocial}
                  onChange={setCapitalSocial}
                  placeholder="1 000"
                  hint="Choisissez le montant qui correspond à vos moyens et à votre projet."
                />
                <Field
                  label="Nombre d'actions"
                  value={nombreActions}
                  onChange={setNombreActions}
                  placeholder="100"
                  required={false}
                  hint="Le capital sera divisé en actions d'une valeur nominale égale."
                />

                <InfoBox title="Le saviez-vous ?">
                  <p>
                    En <strong>SASU</strong>, il n&apos;existe aucun minimum obligatoire : vous pouvez créer votre société avec seulement <strong>1 €</strong>.
                    Cependant, le montant choisi n&apos;est pas neutre :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Crédibilité :</strong> un capital trop faible peut donner une image fragile vis-à-vis des banques, partenaires ou investisseurs.</li>
                    <li><strong>Praticité :</strong> un capital plus élevé permet de couvrir vos premiers frais (comptabilité, site internet, dépôt de marque...).</li>
                    <li><strong>Souplesse :</strong> vous restez libre d&apos;augmenter le capital plus tard si nécessaire.</li>
                  </ul>
                  <p className="mt-3 font-semibold text-[#4A6FE3]">
                    Conseil pratique : fixez un capital cohérent avec votre activité et vos besoins immédiats.
                  </p>
                </InfoBox>
              </Section>

              <Section title="Dates & durée" defaultOpen={false}>
                <Field label="Date de début d'activité" value={dateDebutActivite} onChange={setDateDebutActivite} type="date" required={false} />
                <Field label="Durée de la société (années)" value={dureeStatuts} onChange={setDureeStatuts} placeholder="99" hint="Maximum 99 ans, renouvelable." />
                <Field label="Date de clôture de l'exercice social" value={dateClotureExercice} onChange={setDateClotureExercice} placeholder="31/12" hint="Le plus souvent au 31 décembre." />
              </Section>
            </div>
          )}

          {/* ════════ STEP 3 — Paiement ════════ */}
          {step === 3 && (
            <div>
              <Section title="Frais de création">
                <div className="bg-[#f0f5ff] border-2 border-[#c5d5f0] rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">Frais de greffe & formalités</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">0 €</p>
                  <p className="text-xs text-gray-400 mt-1">Pris en charge par LegalCorners</p>
                </div>

                <div className="bg-white border-2 border-[#c5d5f0] rounded-lg p-5 space-y-3">
                  <p className="text-sm font-semibold text-[#1E3A8A]">Ce qui est inclus :</p>
                  <ul className="space-y-2">
                    {[
                      "Rédaction des statuts sur mesure",
                      "Attestation de dépôt de capital",
                      "Publication de l'annonce légale",
                      "Immatriculation au RCS via le Guichet Unique INPI",
                      "Obtention de votre extrait Kbis",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <InfoBox title="Bon à savoir">
                  <p>
                    Les frais d&apos;immatriculation d&apos;une SASU comprennent en général : les frais de greffe (~37 €),
                    l&apos;annonce légale (~150 €) et éventuellement la déclaration des bénéficiaires effectifs (~22 €).
                    Ces frais sont pris en charge dans notre offre.
                  </p>
                </InfoBox>
              </Section>
            </div>
          )}

          {/* ════════ STEP 4 — Dossier juridique ════════ */}
          {step === 4 && (
            <div>
              <Section title="Président de la SASU">
                <div className="bg-[#f0f5ff] border border-[#c5d5f0] rounded-lg p-4 mb-2">
                  <p className="text-sm text-gray-700">
                    <strong>Président désigné :</strong> {civilite} {prenom} {nom}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">En tant qu&apos;associé unique, vous êtes automatiquement proposé comme président.</p>
                </div>

                <SelectField
                  label="Le président est-il rémunéré ?"
                  value={presidentRemuneration}
                  onChange={setPresidentRemuneration}
                  options={[
                    { value: "non", label: "Non — pas de rémunération au démarrage" },
                    { value: "oui", label: "Oui — rémunération prévue" },
                  ]}
                />

                <InfoBox title="Le saviez-vous ?">
                  <p>
                    Le président de SASU est <strong>assimilé salarié</strong> : il bénéficie du régime général de la Sécurité sociale
                    (hors assurance chômage). S&apos;il n&apos;est pas rémunéré, aucune cotisation sociale n&apos;est due.
                  </p>
                </InfoBox>
              </Section>

              <Section title="Régime fiscal">
                <SelectField
                  label="Imposition de la société"
                  value={regimeFiscal}
                  onChange={setRegimeFiscal}
                  options={[
                    { value: "is", label: "Impôt sur les sociétés (IS) — recommandé" },
                    { value: "ir", label: "Impôt sur le revenu (IR) — option temporaire, 5 ans max" },
                  ]}
                />

                <SelectField
                  label="Régime de TVA"
                  value={regimeTVA}
                  onChange={setRegimeTVA}
                  options={[
                    { value: "franchise", label: "Franchise en base de TVA (< 36 800 € de CA)" },
                    { value: "reel_simplifie", label: "Réel simplifié" },
                    { value: "reel_normal", label: "Réel normal" },
                  ]}
                />

                <InfoBox title="Conseil pratique">
                  <p>
                    L&apos;<strong>IS</strong> est le régime par défaut pour une SASU. Le taux réduit est de <strong>15 %</strong> sur
                    les 42 500 premiers euros de bénéfice, puis <strong>25 %</strong> au-delà.
                    L&apos;option IR est intéressante si vous prévoyez des pertes les premières années (imputation sur vos revenus personnels).
                  </p>
                </InfoBox>
              </Section>

              <Section title="Clauses statutaires" defaultOpen={false}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clauseAgrement}
                    onChange={(e) => setClauseAgrement(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1E3A8A]">Clause d&apos;agrément</p>
                    <p className="text-xs text-gray-500">Toute cession d&apos;actions à un tiers nécessitera votre accord préalable. Recommandé pour garder le contrôle.</p>
                  </div>
                </label>
              </Section>
            </div>
          )}

          {/* ════════ STEP 5 — Récapitulatif & Validation ════════ */}
          {step === 5 && (
            <div>
              <Section title="Récapitulatif de votre SASU">
                <div className="bg-white border-2 border-[#c5d5f0] rounded-lg divide-y divide-gray-100">
                  {[
                    { label: "Dénomination", value: denomination },
                    { label: "Forme juridique", value: "SASU — Société par Actions Simplifiée Unipersonnelle" },
                    { label: "Objet social", value: objetSocial.slice(0, 80) + (objetSocial.length > 80 ? "..." : "") },
                    { label: "Siège social", value: `${siegeSocial}, ${siegeCodePostal} ${siegeVille}` },
                    { label: "Capital social", value: `${capitalSocial} €${nombreActions ? ` (${nombreActions} actions)` : ""}` },
                    { label: "Président", value: `${civilite} ${prenom} ${nom}` },
                    { label: "Rémunération président", value: presidentRemuneration === "oui" ? "Oui" : "Non" },
                    { label: "Régime fiscal", value: regimeFiscal === "is" ? "Impôt sur les sociétés (IS)" : "Impôt sur le revenu (IR)" },
                    { label: "Régime TVA", value: regimeTVA === "franchise" ? "Franchise en base" : regimeTVA === "reel_simplifie" ? "Réel simplifié" : "Réel normal" },
                    { label: "Durée", value: `${dureeStatuts} ans` },
                    { label: "Clôture exercice", value: dateClotureExercice },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-start px-5 py-3">
                      <span className="text-sm text-gray-500">{r.label}</span>
                      <span className="text-sm font-medium text-[#1E3A8A] text-right max-w-[60%]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <InfoBox title="Prochaines étapes après validation">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Dépôt du capital social sur un compte bloqué</li>
                  <li>Signature des statuts</li>
                  <li>Publication de l&apos;annonce légale</li>
                  <li>Dépôt du dossier au Guichet Unique INPI</li>
                  <li>Réception du Kbis sous 1 à 2 semaines</li>
                </ol>
              </InfoBox>

              <button
                onClick={handleSubmitDossier}
                disabled={submitting}
                className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-4 rounded-lg bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Check className="w-4 h-4" /> Valider et créer mon dossier</>
                )}
              </button>
            </div>
          )}

          {/* ════════ STEP 6 — Pièces justificatives ════════ */}
          {step === 6 && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-bold text-green-800 text-lg mb-1">Dossier créé avec succès !</p>
                <p className="text-sm text-green-700">Votre dossier de création SASU a bien été enregistré.</p>
              </div>

              <Section title="Pièces justificatives à fournir">
                <div className="space-y-3">
                  {[
                    "Copie recto-verso de votre pièce d'identité (CNI ou passeport)",
                    "Justificatif de domicile de moins de 3 mois (siège social)",
                    "Attestation de dépôt des fonds (fournie par la banque)",
                    "Déclaration de non-condamnation et de filiation",
                    "Attestation de parution de l'annonce légale",
                  ].map((doc) => (
                    <div key={doc} className="flex items-start gap-3 p-4 bg-white border-2 border-[#c5d5f0] rounded-lg">
                      <FileUp className="w-5 h-5 text-[#4A6FE3] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <InfoBox title="Et ensuite ?">
                <p>
                  Rassemblez les pièces listées ci-dessus. Vous recevrez un email avec les instructions
                  pour finaliser votre dossier et déposer vos documents.
                  Votre dossier est consultable à tout moment depuis votre tableau de bord.
                </p>
              </InfoBox>

              <Link
                href="/dashboard"
                className="mt-6 flex items-center justify-center gap-2 w-full px-6 py-4 rounded-lg bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Accéder à mon tableau de bord <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* ── Navigation ── */}
          {step < 5 && (
            <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#c5d5f0] text-[#1E3A8A] text-sm font-medium hover:bg-[#f0f5ff] transition-colors",
                  step === 1 && "invisible"
                )}
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canGoNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#4A6FE3] to-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="flex justify-start mt-6">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#c5d5f0] text-[#1E3A8A] text-sm font-medium hover:bg-[#f0f5ff] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
