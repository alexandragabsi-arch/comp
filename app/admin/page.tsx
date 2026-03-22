import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Building2, Users, CheckCircle, Clock, Send, AlertCircle,
  FileText, TrendingUp, LogOut, ExternalLink, Search
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  brouillon:   { label: "Brouillon",        color: "bg-gray-100 text-gray-500" },
  en_cours:    { label: "En cours",          color: "bg-blue-100 text-blue-700" },
  signe:       { label: "Signé",             color: "bg-purple-100 text-purple-700" },
  depose_inpi: { label: "Déposé INPI",       color: "bg-amber-100 text-amber-700" },
  termine:     { label: "Terminé",           color: "bg-green-100 text-green-700" },
  erreur:      { label: "⚠ Action requise",  color: "bg-red-100 text-red-600" },
};

const TYPE_MAP: Record<string, string> = {
  dissolution: "Dissolution",
  cession:     "Cession",
  sommeil:     "Sommeil",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") redirect("/dashboard");

  // Tous les dossiers avec info client
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("*, profiles(email, name)")
    .order("created_at", { ascending: false });

  // Stats
  const total = dossiers?.length ?? 0;
  const termines = dossiers?.filter((d) => d.status === "termine").length ?? 0;
  const enCours = dossiers?.filter((d) => ["en_cours", "signe"].includes(d.status)).length ?? 0;
  const deposes = dossiers?.filter((d) => d.status === "depose_inpi").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">LC</span>
            </div>
            <span className="font-bold text-gray-900">LegalCorners</span>
            <span className="px-2 py-0.5 bg-[#1E3A8A] text-white text-xs rounded-full font-medium">Admin</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dossiers total",    value: total,    icon: FileText,   color: "text-gray-700" },
            { label: "En cours",          value: enCours,  icon: Clock,      color: "text-blue-600" },
            { label: "Déposés INPI",      value: deposes,  icon: Send,       color: "text-amber-600" },
            { label: "Terminés",          value: termines, icon: CheckCircle,color: "text-green-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <kpi.icon className={`w-8 h-8 opacity-20 ${kpi.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Table dossiers */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Tous les dossiers</h2>
            <span className="text-xs text-gray-400">{total} dossier{total > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Société</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Client</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">INPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(dossiers ?? []).map((d: DossierRow) => {
                  const status = STATUS_MAP[d.status] ?? STATUS_MAP.en_cours;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{d.company_name}</div>
                        <div className="text-xs text-gray-400">{d.siren}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {TYPE_MAP[d.type] ?? d.type}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {d.profiles?.name ?? d.profiles?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(d.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        {d.inpi_formality_id ? (
                          <a
                            href={`https://procedures.inpi.fr/?/formalite/${d.inpi_formality_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {d.inpi_liasse_number || d.inpi_formality_id}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {total === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Aucun dossier pour l'instant
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

interface DossierRow {
  id: string;
  company_name: string;
  siren: string;
  type: string;
  status: string;
  inpi_formality_id: string | null;
  inpi_liasse_number: string | null;
  created_at: string;
  profiles: { email?: string; name?: string } | null;
}
