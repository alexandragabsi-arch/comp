import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBubbleDossiers, type BubbleDossier } from "@/lib/bubble";
import {
  FileText, CheckCircle, Clock, Send, LogOut,
  Building2, AlertCircle, ExternalLink
} from "lucide-react";

// ── Statuts ───────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  brouillon:   { label: "Brouillon",          color: "bg-gray-100 text-gray-600",     icon: Clock },
  en_cours:    { label: "En cours",            color: "bg-blue-100 text-blue-700",     icon: Clock },
  signe:       { label: "Documents signés",    color: "bg-purple-100 text-purple-700", icon: CheckCircle },
  depose_inpi: { label: "Déposé à l'INPI",    color: "bg-amber-100 text-amber-700",   icon: Send },
  termine:     { label: "Terminé",             color: "bg-green-100 text-green-700",   icon: CheckCircle },
  erreur:      { label: "Action requise",      color: "bg-red-100 text-red-600",       icon: AlertCircle },
};

const TYPE_MAP: Record<string, { label: string; badge: string }> = {
  dissolution:              { label: "Dissolution",             badge: "bg-red-50 text-red-700 border-red-200" },
  cession:                  { label: "Cession de parts",        badge: "bg-blue-50 text-blue-700 border-blue-200" },
  sommeil:                  { label: "Mise en sommeil",         badge: "bg-amber-50 text-amber-700 border-amber-200" },
  creation:                 { label: "Création",                badge: "bg-green-50 text-green-700 border-green-200" },
  modification:             { label: "Modification",            badge: "bg-purple-50 text-purple-700 border-purple-200" },
  creation_auto_entrepreneur: { label: "Création AE / EI",     badge: "bg-teal-50 text-teal-700 border-teal-200" },
  modification_ae:          { label: "Modif. AE / EI",         badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  fermeture_micro:          { label: "Fermeture micro",         badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface SupaDossier {
  id: string;
  company_name: string;
  siren: string;
  type: string;
  status: string;
  inpi_formality_id: string | null;
  inpi_liasse_number: string | null;
  yousign_request_id: string | null;
  created_at: string;
  source: "supabase";
}

type UnifiedDossier =
  | (SupaDossier & { source: "supabase" })
  | (BubbleDossier & { source: "bubble" });

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Dossiers Next.js (dissolution, cession, sommeil)
  const { data: supaDossiers } = await supabase
    .from("dossiers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Dossiers Bubble (création)
  const bubbleDossiers = await getBubbleDossiers(user.email!);

  // Fusion + tri par date décroissante
  const dossiers: UnifiedDossier[] = [
    ...(supaDossiers ?? []).map((d) => ({ ...d, source: "supabase" as const })),
    ...bubbleDossiers.map((d) => ({ ...d, source: "bubble" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const name = user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Client";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">LC</span>
            </div>
            <span className="font-bold text-gray-900">LegalCorners</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">Bonjour, <strong>{name}</strong></span>
            <form action="/auth/signout" method="post">
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes dossiers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Toutes vos formalités juridiques en un seul endroit
          </p>
        </div>

        {dossiers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Aucun dossier pour l'instant</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Vos formalités apparaîtront ici dès leur création.</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <a href="/creation-sasu" className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">Créer une SASU</a>
              <a href="/dissolution" className="px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Dissolution</a>
              <a href="/modification-societe" className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">Modification</a>
              <a href="/mise-en-sommeil" className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">Mise en sommeil</a>
              <a href="/creation-auto-entrepreneur" className="px-4 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors">Créer AE / EI</a>
              <a href="/fermeture-micro" className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">Fermeture micro</a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dossiers.map((d) => <DossierCard key={`${d.source}-${d.id}`} dossier={d} />)}
          </div>
        )}
      </main>
    </div>
  );
}

// ── DossierCard ───────────────────────────────────────────────────────────────
function DossierCard({ dossier }: { dossier: UnifiedDossier }) {
  const status = STATUS_MAP[dossier.status] ?? STATUS_MAP.en_cours;
  const StatusIcon = status.icon;
  const typeInfo = TYPE_MAP[dossier.type] ?? { label: dossier.type, badge: "bg-gray-100 text-gray-600 border-gray-200" };
  const isSupabase = dossier.source === "supabase";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{dossier.company_name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.badge}`}>
                {typeInfo.label}
              </span>
              {dossier.source === "bubble" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-200">
                  Bubble
                </span>
              )}
            </div>
            {dossier.siren && (
              <p className="text-xs text-gray-500 mt-0.5">SIREN {dossier.siren}</p>
            )}
            <p className="text-xs text-gray-400">
              {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Steps — uniquement pour les dossiers Next.js */}
      {isSupabase && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <DossierSteps dossier={dossier as SupaDossier} />
        </div>
      )}

      {/* Liens */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
        {isSupabase && (dossier as SupaDossier).inpi_formality_id && (
          <a
            href={`https://procedures.inpi.fr/?/formalite/${(dossier as SupaDossier).inpi_formality_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Voir sur le portail INPI
          </a>
        )}
        {dossier.source === "bubble" && (dossier as BubbleDossier).bubble_url && (
          <a
            href={(dossier as BubbleDossier).bubble_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Voir le dossier de création
          </a>
        )}
      </div>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────
function DossierSteps({ dossier }: { dossier: SupaDossier }) {
  const steps = [
    { label: "Paiement",  done: true },
    { label: "Documents", done: ["en_cours","signe","depose_inpi","termine"].includes(dossier.status) },
    { label: "Signature", done: ["signe","depose_inpi","termine"].includes(dossier.status) },
    { label: "INPI",      done: ["depose_inpi","termine"].includes(dossier.status) },
    { label: "Terminé",   done: dossier.status === "termine" },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-500" : "bg-gray-200"}`}>
              {step.done
                ? <CheckCircle className="w-3 h-3 text-white" />
                : <div className="w-2 h-2 rounded-full bg-gray-400" />
              }
            </div>
            <span className="text-[10px] text-gray-500 text-center leading-tight">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mb-4 ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
