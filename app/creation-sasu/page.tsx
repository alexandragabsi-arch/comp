"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, Loader2, HelpCircle, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */

type QuestionType = "choice" | "input" | "textarea" | "date";

interface Choice {
  value: string;
  label: string;
}

interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  choices?: Choice[];
  placeholder?: string;
  optional?: boolean;
  info?: {
    title: string;
    content: React.ReactNode;
  };
  hint?: string;
}

/* ───────── Questions data ───────── */

const QUESTIONS: Question[] = [
  {
    id: "qui_realise",
    title: "Qui réalise cette formalité ?",
    type: "choice",
    choices: [
      { value: "associe", label: "Un des associés fondateurs" },
      { value: "ami", label: "Un ami / famille" },
      { value: "professionnel", label: "Un professionnel mandataire" },
    ],
  },
  {
    id: "nom_societe",
    title: "Quel sera le nom de la société ?",
    type: "input",
    placeholder: "Ex : Ma Société",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
          <p>
            La <strong>dénomination sociale</strong> est le nom officiel de votre société, distinct du nom commercial.
            Vérifiez sa disponibilité sur <strong>infogreffe.fr</strong> ou auprès de l&apos;INPI avant de vous décider.
          </p>
        </>
      ),
    },
  },
  {
    id: "proteger_nom",
    title: "Souhaitez-vous protéger votre nom par une marque ?",
    type: "choice",
    choices: [
      { value: "oui", label: "Je veux protéger mon nom" },
      { value: "non", label: "Je n'ai pas besoin de protéger mon nom" },
      { value: "ne_sais_pas", label: "Je ne sais pas encore" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
          <p>
            En déposant votre marque ou votre logo auprès de l&apos;<strong>INPI</strong> (Institut National de la Propriété Intellectuelle), vous en devenez
            le propriétaire. Cela signifie que vous êtes le seul à pouvoir l&apos;utiliser et vous pouvez empêcher tout concurrent de s&apos;en servir sans votre
            accord. <em>La protection est valable 10 ans et peut être renouvelée indéfiniment.</em> Vous avez aussi la possibilité d&apos;étendre votre
            protection à l&apos;Europe (EUIPO) ou à l&apos;international.
          </p>
        </>
      ),
    },
  },
  {
    id: "capital_social",
    title: "Quel est le montant du capital social de votre SASU ?",
    description:
      "Choisissez le montant qui correspond à vos moyens et à votre projet : il n'y a pas de minimum obligatoire en SASU (à partir de 1 €), mais mieux vaut prévoir un capital qui couvre vos premiers frais et inspire confiance à vos partenaires.",
    type: "input",
    placeholder: "Ex : 1 000",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
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
        </>
      ),
    },
  },
  {
    id: "objet_social",
    title: "Quel est l'objet social de votre SASU ?",
    description:
      "Décrivez précisément l'activité principale de votre société. Rédigez un objet suffisamment large pour ne pas avoir à modifier vos statuts si vous diversifiez votre activité.",
    type: "textarea",
    placeholder:
      "Ex : Conseil en stratégie digitale, développement de sites web et applications mobiles, formation professionnelle...",
    info: {
      title: "Conseil pratique",
      content: (
        <p>
          Ajoutez toujours <em>&quot;et toutes opérations se rattachant directement ou indirectement à cet objet&quot;</em> à la fin de votre objet social.
        </p>
      ),
    },
  },
  {
    id: "activite_artisanale",
    title: "Votre activité est-elle artisanale ? (Coiffeur, boulanger, plombier, etc...)",
    description:
      "Une activité artisanale est une activité manuelle (ex. : coiffure, pâtisserie, couture sur mesure, mécanique, plomberie, etc.). De même, si vous fabriquez ou réparez quelque chose et que vous le vendez ensuite, votre activité est considérée comme partiellement artisanale.",
    type: "choice",
    optional: true,
    choices: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
    hint: "En cas de doute, utilisez le bouton Aide IA pour choisir la bonne réponse.",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
          <p>
            <strong>Toute activité artisanale doit être immatriculée au Répertoire des Métiers (RM)</strong>, tenu par la <strong>Chambre de Métiers et de l&apos;Artisanat
            (CMA)</strong>. Il s&apos;agit d&apos;une <strong>obligation légale distincte</strong> de l&apos;immatriculation au <strong>Registre du Commerce et des Sociétés (RCS)</strong>.
          </p>
          <p className="mt-2 italic text-[#4A6FE3]">
            Si vous souhaitez que nous réalisions cette démarche pour vous, un supplément de 79 € HT sera appliqué, auquel s&apos;ajoutent les
            frais légaux obligatoires (frais CMA et frais de greffe), dont le montant exact sera précisé au moment du paiement.
          </p>
        </>
      ),
    },
  },
  {
    id: "adresse_siege",
    title: "Quelle est l'adresse du siège social ?",
    type: "input",
    placeholder: "Ex : 12 rue de la Paix, 75001 Paris",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>
          Vous pouvez domicilier votre SASU à votre adresse personnelle pour une durée maximale de 5 ans,
          dans une société de domiciliation, ou dans un local commercial.
        </p>
      ),
    },
  },
  {
    id: "president_remunere",
    title: "Le président sera-t-il rémunéré ?",
    type: "choice",
    choices: [
      { value: "oui", label: "Oui — rémunération prévue" },
      { value: "non", label: "Non — pas de rémunération au démarrage" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>
          Le président de SASU est <strong>assimilé salarié</strong> : il bénéficie du régime général de la Sécurité sociale
          (hors assurance chômage). S&apos;il n&apos;est pas rémunéré, aucune cotisation sociale n&apos;est due.
        </p>
      ),
    },
  },
  {
    id: "regime_fiscal",
    title: "Quel régime fiscal souhaitez-vous ?",
    type: "choice",
    choices: [
      { value: "is", label: "Impôt sur les sociétés (IS) — recommandé" },
      { value: "ir", label: "Impôt sur le revenu (IR) — option temporaire, 5 ans max" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>
          L&apos;<strong>IS</strong> est le régime par défaut pour une SASU. Le taux réduit est de <strong>15 %</strong> sur
          les 42 500 premiers euros de bénéfice, puis <strong>25 %</strong> au-delà.
          L&apos;option IR est intéressante si vous prévoyez des pertes les premières années.
        </p>
      ),
    },
  },
  {
    id: "demarrage",
    title: "Quand souhaitez-vous démarrer votre projet ?",
    type: "choice",
    choices: [
      { value: "asap", label: "Dès que possible (un de nos experts vous accompagne)" },
      { value: "semaine", label: "Dans la semaine" },
      { value: "mois", label: "Dans le mois" },
      { value: "ne_sais_pas", label: "Je ne sais pas encore" },
    ],
  },
];

/* ───────── Sidebar steps ───────── */

const STEPS = [
  { id: 1, label: "Informations\nutilisateur", icon: User },
  { id: 2, label: "Société (infos\nde base)", icon: Building2 },
  { id: 3, label: "Paiement", icon: CreditCard },
  { id: 4, label: "Dossier\njuridique", icon: FolderOpen },
  { id: 5, label: "Récapitulatif &\nValidation", icon: CheckCircle2 },
  { id: 6, label: "Pièces\njustificatives", icon: FileUp },
];

/* ───────── Components ───────── */

function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all",
        selected
          ? "border-[#4A6FE3] bg-[#eef2ff] text-[#4A6FE3]"
          : "border-[#e0e7ff] bg-white text-[#4A6FE3] hover:border-[#a5b4fc] hover:bg-[#f8f9ff]"
      )}
    >
      {label}
    </button>
  );
}

function InfoAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-6 border-2 border-[#c5d5f0] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f0f5ff] text-sm font-semibold text-[#1E3A8A]"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Plus d&apos;informations
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-[#c5d5f0]">
          <p className="text-sm font-bold text-[#4A6FE3] mb-2">{title}</p>
          <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ───────── Main page ───────── */

export default function CreationSASUPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;

  // Map question index to sidebar step (approximate)
  const sidebarStep = currentQ < 1 ? 1 : currentQ < 6 ? 2 : currentQ < 8 ? 4 : currentQ < 9 ? 3 : 5;

  const answer = answers[question.id] || "";

  const setAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: val }));
  };

  const canGoNext = question.optional || answer.trim().length > 0;

  const goNext = () => {
    if (currentQ < totalQ - 1) setCurrentQ((q) => q + 1);
  };

  const goPrev = () => {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image
            src="/images/logo-legal-corners.svg"
            alt="LegalCorners"
            width={140}
            height={36}
            className="h-full w-auto object-contain"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-[#1E3A8A] transition-colors flex items-center gap-1">
            Nos services <ChevronDown className="w-4 h-4" />
          </span>
        </nav>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors"
        >
          <User className="w-4 h-4" /> Connexion
        </Link>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* ── Sidebar stepper ── */}
        <aside className="hidden md:flex flex-col items-center w-[220px] min-w-[220px] border-r border-gray-100 py-10 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = sidebarStep > s.id;
            const active = sidebarStep === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                        done
                          ? "bg-[#4A6FE3] text-white"
                          : active
                            ? "bg-[#1E3A8A] text-white ring-4 ring-[#4A6FE3]/20"
                            : "bg-white text-gray-400 border-2 border-gray-200"
                      )}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        active ? "text-[#1E3A8A]" : done ? "text-[#4A6FE3]" : "text-gray-300"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center whitespace-pre-line leading-tight mt-1",
                      active ? "text-[#1E3A8A]" : done ? "text-[#4A6FE3]" : "text-gray-400"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-10 my-2 border-l-2 border-dotted",
                      sidebarStep > s.id + 1 ? "border-[#4A6FE3]" : "border-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </aside>

        {/* ── Mobile stepper ── */}
        <div className="md:hidden flex items-center justify-center gap-1.5 py-4 px-4 border-b border-gray-100 w-full">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                sidebarStep > s.id
                  ? "bg-[#4A6FE3] text-white"
                  : sidebarStep === s.id
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-gray-100 text-gray-400"
              )}
            >
              {sidebarStep > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <main className="flex-1 px-6 md:px-12 py-8 md:py-10 max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-8">
            Création d&apos;une SASU
          </h1>

          {/* ── Question title ── */}
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2">{question.title}</h2>

          {/* ── Description ── */}
          {question.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{question.description}</p>
          )}

          {/* ── Optional badge ── */}
          {question.optional && (
            <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
              optionnel
            </span>
          )}

          {/* ── Choice cards ── */}
          {question.type === "choice" && question.choices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {question.choices.map((c) => (
                <ChoiceCard
                  key={c.value}
                  label={c.label}
                  selected={answer === c.value}
                  onClick={() => setAnswer(c.value)}
                />
              ))}
            </div>
          )}

          {/* ── Text input ── */}
          {question.type === "input" && (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full mt-4 px-5 py-4 rounded-xl border-2 border-[#c5d5f0] focus:border-[#4A6FE3] focus:outline-none text-sm transition-colors"
            />
          )}

          {/* ── Textarea ── */}
          {question.type === "textarea" && (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              rows={4}
              className="w-full mt-4 px-5 py-4 rounded-xl border-2 border-[#c5d5f0] focus:border-[#4A6FE3] focus:outline-none text-sm resize-none transition-colors"
            />
          )}

          {/* ── Hint ── */}
          {question.hint && (
            <p className="text-sm text-[#4A6FE3] italic mt-3">{question.hint}</p>
          )}

          {/* ── Aide IA button ── */}
          {question.optional && (
            <div className="flex justify-end mt-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#4A6FE3] text-[#4A6FE3] text-sm font-semibold hover:bg-[#f0f5ff] transition-colors">
                <HelpCircle className="w-4 h-4" /> Aide IA
              </button>
            </div>
          )}

          {/* ── Info accordion ── */}
          {question.info && (
            <InfoAccordion title={question.info.title}>{question.info.content}</InfoAccordion>
          )}

          {/* ── Navigation ── */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={goPrev}
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors",
                currentQ === 0 && "invisible"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>

            <button
              onClick={goNext}
              disabled={!canGoNext}
              className={cn(
                "flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all",
                canGoNext
                  ? "bg-[#4A6FE3] text-white hover:bg-[#3b5cc5]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
