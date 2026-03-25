"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, Mail, Building2, Check, X } from "lucide-react";

interface RdvAvocat {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date: string;
  heure: string;
  societe: string;
  formule: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  created_at: string;
}

export default function AvocatsPage() {
  const [rdvs, setRdvs] = useState<RdvAvocat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRdvs() {
      try {
        const res = await fetch("/api/admin/avocats/rdv");
        if (res.ok) {
          const data = await res.json();
          setRdvs(data.rdvs || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchRdvs();
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmé",
    done: "Terminé",
    cancelled: "Annulé",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1E3A8A]">Espace Avocats — LegalCorners</h1>
            <p className="text-sm text-gray-500">Demandes de création SASU (formule avocat)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              {rdvs.filter(r => r.status === "pending").length} en attente
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : rdvs.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">Aucune demande pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Les demandes de RDV apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rdvs.map((rdv) => (
              <div key={rdv.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-[#1E3A8A] text-lg">{rdv.prenom} {rdv.nom}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {rdv.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {rdv.telephone}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {rdv.societe || "Non renseigné"}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(rdv.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {rdv.heure}</span>
                      </div>
                      <p className="text-xs text-gray-400">Demande reçue le {new Date(rdv.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[rdv.status] || statusColors.pending}`}>
                      {statusLabels[rdv.status] || rdv.status}
                    </span>
                    {rdv.status === "pending" && (
                      <>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/avocats/rdv", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: rdv.id, status: "confirmed" }),
                            });
                            setRdvs(prev => prev.map(r => r.id === rdv.id ? { ...r, status: "confirmed" } : r));
                          }}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Confirmer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/avocats/rdv", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: rdv.id, status: "cancelled" }),
                            });
                            setRdvs(prev => prev.map(r => r.id === rdv.id ? { ...r, status: "cancelled" } : r));
                          }}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
