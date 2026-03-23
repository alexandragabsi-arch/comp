"use client";
// v5.1 - Cache bust: Fixed JSX structure
import { useState, useEffect } from "react";
import { StatutsUpdater } from "@/components/statuts-updater";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  HelpCircle,
  Info,
  User,
  Building2,
  FileText,
  CreditCard,
  PenTool,
  Plus,
  Trash2,
  AlertTriangle,
  Shield,
  Scale,
  Users,
  Briefcase,
  Menu,
  X,
  Download,
  Eye,
  Upload,
  Send,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipHelp, TOOLTIPS } from "@/components/ui/tooltip-help";
import { SimulateurDroits } from "@/components/simulateur-droits";
import { PdfPreviewModal } from "@/components/pdf-preview-modal";
import { DocumentPreviewPanel } from "@/components/document-preview-panel";
import { ExpertComptableInfo } from "@/components/cession/expert-comptable-info";
import { generateActeDocx, generatePVDocx, generateDeclarationDocx } from "../lib/generateDocx";
// Types
type TypeCession = "actions" | "parts-sociales";
type TypePropriete = "pleine-propriete" | "usufruit" | "nue-propriete";
type TypePersonne = "physique" | "morale";
type RegimeMatrimonial = "communaute" | "separation" | "celibataire";
type ModePaiement = "comptant" | "echeances";
type ComptesCourants = "aucun" | "cede" | "conserve";
interface Echeance {
  montant: string;
  date: string;
}
interface PersonnePhysique {
  civilite: "M." | "Mme" | "";
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  email: string;
}
interface PersonneMorale {
  denomination: string;
  formeJuridique: string;
  siegeAdresse: string;
  siegeCP: string;
  siegeVille: string;
  siegePays: string;
  capital: string;
  rcsVille: string;
  rcsNumero: string;
  representantCivilite: "M." | "Mme" | "";
  representantNom: string;
  representantPrenom: string;
  representantQualite: string;
  email: string;
}
// Étapes
const STEPS = [
  { id: 1, label: "Type de cession", icon: FileText },
  { id: 2, label: "Les parties", icon: Users },
  { id: 3, label: "Paiement", icon: CreditCard },
  { id: 4, label: "Société concernée", icon: Building2 },
  { id: 5, label: "Informations cédant", icon: User },
  { id: 6, label: "Informations cessionnaire", icon: User },
  { id: 7, label: "Conditions de cession", icon: Scale },
  { id: 8, label: "Clauses & Options", icon: Shield },
  { id: 9, label: "Récapitulatif", icon: CheckCircle },
  { id: 10, label: "Signature", icon: PenTool },
  { id: 11, label: "Dépôt INPI", icon: Send },
];
export default function CessionPartsPage() {
  // Navigation
  const [step, setStep] = useState(1);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedFormule, setSelectedFormule] = useState<"essentiel" | "premium" | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");

  // Retour depuis Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");
    const formule = params.get("formule") as "essentiel" | "premium" | null;
    const stateKey = params.get("state");

    if (payment === "success" && sessionId) {
      // Vérifier le paiement côté serveur
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.paid) {
            // Restaurer l'état depuis sessionStorage
            let restoredState: Record<string, unknown> = {};
            if (stateKey) {
              try {
                const saved = sessionStorage.getItem(stateKey);
                if (saved) {
                  const s = JSON.parse(saved);
                  restoredState = s;
                  if (s.typeCession) setTypeCession(s.typeCession);
                  if (s.typePropriete) setTypePropriete(s.typePropriete);
                  if (s.cedantType) setCedantType(s.cedantType);
                  if (s.cessionnaireType) setCessionnaireType(s.cessionnaireType);
                  sessionStorage.removeItem(stateKey);
                }
              } catch {}
            }
            if (formule) setSelectedFormule(formule);
            setPaymentComplete(true);
            setStep(4);
            // Sauvegarder le dossier en Supabase
            fetch("/api/dossiers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.email,
                company_name: (restoredState.societe as string) || "Cession de parts",
                siren: (restoredState.siren as string) || "",
                forme_juridique: (restoredState.formeJuridique as string) || "",
                type: "cession",
                status: "en_cours",
                stripe_session_id: sessionId,
                stripe_paid: true,
                data: { formule, ...restoredState },
              }),
            }).catch(() => {});
            // Nettoyer l'URL
            window.history.replaceState({}, "", "/cession-parts");
          }
        })
        .catch(() => {});
    } else if (payment === "cancel") {
      if (formule) setSelectedFormule(formule);
      setStep(3);
      window.history.replaceState({}, "", "/cession-parts");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Step 1: Type de cession
  const [typeCession, setTypeCession] = useState<TypeCession | null>(null);
  const [typePropriete, setTypePropriete] = useState<TypePropriete | null>(null);
  // Step 2: Les parties (avant paiement)
  const [cedantType, setCedantType] = useState<TypePersonne | null>(null);
  const [cedantIsSocieteCible, setCedantIsSocieteCible] = useState(false);
  const [cessionnaireType, setCessionnaireType] = useState<TypePersonne | null>(null);
  const [cessionnaireIsSocieteCible, setCessionnaireIsSocieteCible] = useState(false);
  const [nombrePartsApprox, setNombrePartsApprox] = useState("");
const [prixApprox, setPrixApprox] = useState("");
  const [besoinExpertComptable, setBesoinExpertComptable] = useState<"oui" | "deja" | "non" | null>(null);
  const [includChangementDirigeant, setIncludChangementDirigeant] = useState(false);
  const [nouveauDirigeantPhysique, setNouveauDirigeantPhysique] = useState<PersonnePhysique>({
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    nationalite: "française",
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",
    email: "",
  });
  const [nouveauDirigeantQualite, setNouveauDirigeantQualite] = useState("Gerant");
  const [nouveauDirigeantType, setNouveauDirigeantType] = useState<"physique" | "morale">("physique");
  
  // Filiation du nouveau dirigeant
  const [nouveauDirigeantPereNom, setNouveauDirigeantPereNom] = useState("");
  const [nouveauDirigeantPerePrenom, setNouveauDirigeantPerePrenom] = useState("");
  const [nouveauDirigeantMereNom, setNouveauDirigeantMereNom] = useState("");
  const [nouveauDirigeantMerePrenom, setNouveauDirigeantMerePrenom] = useState("");
  
  // Déclaration de non-condamnation
  const [nouveauDirigeantNonCondamnation, setNouveauDirigeantNonCondamnation] = useState(false);
  
  // Personne morale nouveau dirigeant
  const [nouveauDirigeantMorale, setNouveauDirigeantMorale] = useState({
    denomination: "",
    formeJuridique: "",
    siren: "",
    siegeAdresse: "",
    siegeCP: "",
    siegeVille: "",
  });
  
  // Représentant permanent (si nouveau dirigeant = personne morale)
  const [representantPermanent, setRepresentantPermanent] = useState<PersonnePhysique>({
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    nationalite: "française",
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",
    email: "",
  });
  const [representantPermanentPereNom, setRepresentantPermanentPereNom] = useState("");
  const [representantPermanentPerePrenom, setRepresentantPermanentPerePrenom] = useState("");
  const [representantPermanentMereNom, setRepresentantPermanentMereNom] = useState("");
  const [representantPermanentMerePrenom, setRepresentantPermanentMerePrenom] = useState("");
  const [representantPermanentNonCondamnation, setRepresentantPermanentNonCondamnation] = useState(false);
  
// Step 4: Société concernée
  const [sirenSearch, setSirenSearch] = useState("");
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenFound, setSirenFound] = useState(false);
  const [sirenError, setSirenError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{siren: string, nom: string, ville?: string}>>([]);
  const [showResults, setShowResults] = useState(false);
  const [societeDirigeants, setSocieteDirigeants] = useState<Array<{nom: string, prenom: string, qualite: string}>>([]);
  const [societe, setSociete] = useState({
    denomination: "",
    formeJuridique: "",
    siegeAdresse: "",
    siegeCP: "",
    siegeVille: "",
    siegePays: "France",
    capital: "",
    nombreTotalParts: "",
    rcsVille: "",
    rcsNumero: "",
  });
  // Step 5: Cédant
const [cedantPhysique, setCedantPhysique] = useState<PersonnePhysique>({
  civilite: "",
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "française",
  adresse: "",
  codePostal: "",
  ville: "",
  pays: "France",
  email: "",
  });
  const [cedantMorale, setCedantMorale] = useState<PersonneMorale>({
    denomination: "",
    formeJuridique: "",
    siegeAdresse: "",
    siegeCP: "",
    siegeVille: "",
    siegePays: "France",
    capital: "",
    rcsVille: "",
    rcsNumero: "",
    representantCivilite: "",
    representantNom: "",
    representantPrenom: "",
    representantQualite: "",
    email: "",
  });
  // Cedant morale SIREN search
  const [cedantSirenSearch, setCedantSirenSearch] = useState("");
  const [cedantSirenLoading, setCedantSirenLoading] = useState(false);
  const [cedantSirenFound, setCedantSirenFound] = useState(false);
  const [cedantSearchResults, setCedantSearchResults] = useState<Array<{siren: string, nom: string, ville?: string}>>([]);
  const [showCedantResults, setShowCedantResults] = useState(false);
  const [cedantNombreParts, setCedantNombreParts] = useState("");
  const [cedantRegimeMatrimonial, setCedantRegimeMatrimonial] = useState<RegimeMatrimonial | null>(null);
  const [cedantConjointCivilite, setCedantConjointCivilite] = useState<"M." | "Mme" | "">("");
  const [cedantConjointNom, setCedantConjointNom] = useState("");
  const [cedantConjointPrenom, setCedantConjointPrenom] = useState("");
  // Step 6: Cessionnaire
  const [cessionnairePhysique, setCessionnairePhysique] = useState<PersonnePhysique>({
    civilite: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    nationalite: "française",
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",
    email: "",
  });
  const [cessionnaireMorale, setCessionnaireMorale] = useState<PersonneMorale>({
    denomination: "",
    formeJuridique: "",
    siegeAdresse: "",
    siegeCP: "",
    siegeVille: "",
    siegePays: "France",
    capital: "",
    rcsNumero: "",
    rcsVille: "",
    representantCivilite: "",
    representantNom: "",
    representantPrenom: "",
    representantQualite: "",
    email: "",
  });
  const [cessionnaireSirenSearch, setCessionnaireSirenSearch] = useState("");
  const [cessionnaireSirenFound, setCessionnaireSirenFound] = useState(false);
  const [cessionnaireSirenLoading, setCessionnaireSirenLoading] = useState(false);
  const [cessionnaireSearchResults, setCessionnaireSearchResults] = useState<Array<{siren: string, nom: string, ville?: string}>>([]);
  const [showCessionnaireResults, setShowCessionnaireResults] = useState(false);
  const [cessionnaireRegimeMatrimonial, setCessionnaireRegimeMatrimonial] = useState<RegimeMatrimonial | null>(null);
  const [cessionnaireConjointCivilite, setCessionnaireConjointCivilite] = useState<"M." | "Mme" | "">("");
  const [cessionnaireConjointNom, setCessionnaireConjointNom] = useState("");
  const [cessionnaireConjointPrenom, setCessionnaireConjointPrenom] = useState("");
  const [cessionnaireAchatBiensPropres, setCessionnaireAchatBiensPropres] = useState<boolean | null>(null);
  // Step 7: Conditions de cession
  const [nombrePartsCedees, setNombrePartsCedees] = useState("");
  const [numeroPartsDe, setNumeroPartsDe] = useState("");
  const [numeroPartsA, setNumeroPartsA] = useState("");
  const [prixParPart, setPrixParPart] = useState("");
  const [prixTotal, setPrixTotal] = useState("");
  const [modePaiement, setModePaiement] = useState<ModePaiement | null>(null);
  const [echeances, setEcheances] = useState<Array<{ montant: string; date: string; modePaiement: "virement" | "cheque" }>>([{ montant: "", date: "", modePaiement: "virement" }]);
  const [mandataireFormalities, setMandataireFormalities] = useState("LEGALCORNERS, 78 avenue des Champs-Elysees, 75008 Paris");
  const [modificationValeurNominale, setModificationValeurNominale] = useState(false);
  // Step 8: Clauses & Options
  const [associeUnique, setAssocieUnique] = useState<boolean | null>(null);
  const [dateDeliberation, setDateDeliberation] = useState("");
  const [clauseNonConcurrenceVendeur, setClauseNonConcurrenceVendeur] = useState(false);
  const [clauseNCVZone, setClauseNCVZone] = useState("");
  const [clauseNCVDuree, setClauseNCVDuree] = useState("");
  const [clauseNonConcurrenceAcheteur, setClauseNonConcurrenceAcheteur] = useState(false);
  const [clauseNCAZone, setClauseNCAZone] = useState("");
  const [clauseNCADuree, setClauseNCADuree] = useState("");
  const [comptesCourants, setComptesCourants] = useState<ComptesCourants | null>(null);
  const [garantieActifPassif, setGarantieActifPassif] = useState(true);
  const [garantieMontantMax, setGarantieMontantMax] = useState("");
  const [garantieDuree, setGarantieDuree] = useState("");
  const [garantieSeuilDeclenchement, setGarantieSeuilDeclenchement] = useState("");
  const [garantieAdresse, setGarantieAdresse] = useState("");
  const [garantieEmail, setGarantieEmail] = useState("");
  const [tribunalCompetent, setTribunalCompetent] = useState("");
  const [fraisACharge, setFraisACharge] = useState<"cessionnaire" | "cedant" | null>(null);
  const [droitJouissanceImmeubles, setDroitJouissanceImmeubles] = useState(false);
  // Signature
  const [lieuSignature, setLieuSignature] = useState("");
  const [dateSignature, setDateSignature] = useState("");
  const [documentGenere, setDocumentGenere] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingActe, setIsGeneratingActe] = useState(false);
  const [isGeneratingPv, setIsGeneratingPv] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [acteBlobUrl, setActeBlobUrl] = useState<string | null>(null);
  const [pvBlobUrl, setPvBlobUrl] = useState<string | null>(null);
  const [declarationBlobUrl, setDeclarationBlobUrl] = useState<string | null>(null);
  const [acteText, setActeText] = useState<string | null>(null);
  const [pvText, setPvText] = useState<string | null>(null);
  const [declarationText, setDeclarationText] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; text: string; blobUrl: string; docxFileName: string; pdfFileName: string } | null>(null);
  
  // Documents a generer
  const [generateAgrement, setGenerateAgrement] = useState(true);
  const [generateConstatation, setGenerateConstatation] = useState(true);
  // Step 11: Pièces justificatives & INPI
  type JustifKey = "acte" | "pv" | "statuts" | "identite" | "declaration" | "kbisCedant" | "kbisCessionnaire";
  interface JustifFile { name: string; base64: string; size: number; }
  const [justifFiles, setJustifFiles] = useState<Partial<Record<JustifKey, JustifFile>>>({});
  const [inpiStatus, setInpiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inpiMessage, setInpiMessage] = useState<string>("");
  const [inpiDossierId, setInpiDossierId] = useState<string>("");

  const handleJustifUpload = (key: JustifKey, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setJustifFiles(prev => ({ ...prev, [key]: { name: file.name, base64, size: file.size } }));
    };
    reader.readAsDataURL(file);
  };

  const handleInpiSubmit = async () => {
    setInpiStatus("loading");
    setInpiMessage("");
    try {
      const siren = societe.rcsNumero?.replace(/\s/g, "").slice(0, 9) || "";
      const res = await fetch("/api/inpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siren,
          formeJuridique: societe.formeJuridique,
          denomination: societe.denomination,
          capitalSocial: societe.capital,
          siegeAdresse: `${societe.siegeAdresse} ${societe.siegeCP} ${societe.siegeVille}`.trim(),
          cedant: cedantType === "physique"
            ? { type: "physique", nom: cedantPhysique.nom, prenom: cedantPhysique.prenom, adresse: `${cedantPhysique.adresse} ${cedantPhysique.codePostal} ${cedantPhysique.ville}`.trim() }
            : { type: "morale", denomination: cedantMorale.denomination, siren: cedantMorale.rcsNumero },
          cessionnaire: cessionnaireType === "physique"
            ? { type: "physique", nom: cessionnairePhysique.nom, prenom: cessionnairePhysique.prenom, adresse: `${cessionnairePhysique.adresse} ${cessionnairePhysique.codePostal} ${cessionnairePhysique.ville}`.trim() }
            : { type: "morale", denomination: cessionnaireMorale.denomination, siren: cessionnaireMorale.rcsNumero },
          nombreParts: nombrePartsCedees,
          prixTotal,
          dateSignature,
          includChangementDirigeant,
          nouveauDirigeant: includChangementDirigeant
            ? { nom: nouveauDirigeantPhysique.nom, prenom: nouveauDirigeantPhysique.prenom, fonction: nouveauDirigeantQualite }
            : null,
          justifFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur INPI");
      setInpiStatus("success");
      setInpiDossierId(data.dossierId || "");
      setInpiMessage(data.message || "Dossier envoyé avec succès");
    } catch (err: unknown) {
      setInpiStatus("error");
      setInpiMessage(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };
  // Navigation functions
  const handleNext = () => {
    if (step === 3 && !paymentComplete) {
      setPaymentComplete(true);
      setStep(4);
      return;
    }
    
    // Gerer le step 8.5 (changement dirigeant)
    if (step === 8 && includChangementDirigeant) {
      setStep(8.5 as any);
      return;
    }
    
    if (step === 8.5 && includChangementDirigeant) {
      setStep(9);
      return;
    }
    
    if (step < 11) {
      setStep(step + 1);
    }
  };
  const handlePrev = () => {
    if (step > 1) {
      if (step === 4 && paymentComplete) {
        return;
      }
      if (step === 8.5 && includChangementDirigeant) {
        setStep(8);
        return;
      }
      if (step === 9 && includChangementDirigeant) {
        setStep(8.5 as any);
        return;
      }
      setStep(step - 1);
    }
  };
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return typeCession !== null && typePropriete !== null;
      case 2:
        return cedantType !== null && cessionnaireType !== null;
      case 3:
        return true; // Payment step
      case 4:
        return societe.denomination !== "" && societe.formeJuridique !== "" && societe.rcsNumero !== "";
      case 5:
        if (cedantType === "physique") {
          return cedantPhysique.nom !== "" && cedantPhysique.prenom !== "" && cedantRegimeMatrimonial !== null;
        }
        return cedantMorale.denomination !== "" && cedantMorale.representantNom !== "";
      case 6:
        if (cessionnaireType === "physique") {
          return cessionnairePhysique.nom !== "" && cessionnairePhysique.prenom !== "";
        }
        return cessionnaireMorale.denomination !== "" && cessionnaireMorale.representantNom !== "";
      case 7:
        return nombrePartsCedees !== "" && prixTotal !== "" && modePaiement !== null;
      case 8:
        return comptesCourants !== null && fraisACharge !== null;
      default:
        return true;
    }
  };
  // Add/remove echeances
  const addEcheance = () => {
    setEcheances([...echeances, { montant: "", date: "", modePaiement: "virement" }]);
  };
  const removeEcheance = (index: number) => {
    setEcheances(echeances.filter((_, i) => i !== index));
  };
  const updateEcheance = (index: number, field: "montant" | "date" | "modePaiement", value: string) => {
    const newEcheances = [...echeances];
    (newEcheances[index] as Record<string, string>)[field] = value;
    setEcheances(newEcheances);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGenerate = async (type: "acte" | "pv") => {
    const setLoading = type === "acte" ? setIsGeneratingActe : setIsGeneratingPv;
    setLoading(true);
    try {
      const formData = {
        societe: {
          denomination: societe.denomination,
          formeJuridique: societe.formeJuridique as any,
          capital: societe.capital,
          rcsVille: societe.rcsVille,
          rcsNumero: societe.rcsNumero,
          adresse: `${societe.siegeAdresse}, ${societe.siegeCP} ${societe.siegeVille}`,
          nombreTitresTotal: societe.nombreTotalParts,
          valeurNominale: "",
          estSPI: false,
        },
        cedant: {
          typePersonne: cedantType as "physique" | "morale",
          physique: cedantType === "physique" ? {
            civilite: cedantPhysique.civilite as "M." | "Mme",
            nom: cedantPhysique.nom,
            prenom: cedantPhysique.prenom,
            dateNaissance: cedantPhysique.dateNaissance,
            villeNaissance: cedantPhysique.lieuNaissance,
            nationalite: cedantPhysique.nationalite,
            adresse: `${cedantPhysique.adresse}, ${cedantPhysique.codePostal} ${cedantPhysique.ville}`,
            regime: (cedantRegimeMatrimonial || "celibataire") as any,
            conjointCivilite: cedantConjointCivilite,
            conjointNom: cedantConjointNom,
            conjointPrenom: cedantConjointPrenom,
          } : undefined,
          morale: cedantType === "morale" ? {
            denomination: cedantMorale.denomination,
            formeJuridique: cedantMorale.formeJuridique,
            capital: cedantMorale.capital,
            adresse: `${cedantMorale.siegeAdresse}, ${cedantMorale.siegeCP} ${cedantMorale.siegeVille}`,
            rcsVille: cedantMorale.rcsVille,
            rcsNumero: cedantMorale.rcsNumero,
            representantCivilite: cedantMorale.representantCivilite as "M." | "Mme",
            representantNom: cedantMorale.representantNom,
            representantPrenom: cedantMorale.representantPrenom,
            representantQualite: cedantMorale.representantQualite,
          } : undefined,
          nombreTitresCedes: nombrePartsCedees,
        },
        cessionnaire: {
          typePersonne: cessionnaireType as "physique" | "morale",
          physique: cessionnaireType === "physique" ? {
            civilite: cessionnairePhysique.civilite as "M." | "Mme",
            nom: cessionnairePhysique.nom,
            prenom: cessionnairePhysique.prenom,
            dateNaissance: cessionnairePhysique.dateNaissance,
            villeNaissance: cessionnairePhysique.lieuNaissance,
            nationalite: cessionnairePhysique.nationalite,
            adresse: `${cessionnairePhysique.adresse}, ${cessionnairePhysique.codePostal} ${cessionnairePhysique.ville}`,
            regime: (cessionnaireRegimeMatrimonial || "celibataire") as any,
            conjointCivilite: cessionnaireConjointCivilite,
            conjointNom: cessionnaireConjointNom,
            conjointPrenom: cessionnaireConjointPrenom,
          } : undefined,
          morale: cessionnaireType === "morale" ? {
            denomination: cessionnaireMorale.denomination,
            formeJuridique: cessionnaireMorale.formeJuridique,
            capital: cessionnaireMorale.capital,
            adresse: `${cessionnaireMorale.siegeAdresse}, ${cessionnaireMorale.siegeCP} ${cessionnaireMorale.siegeVille}`,
            rcsVille: cessionnaireMorale.rcsVille,
            rcsNumero: cessionnaireMorale.rcsNumero,
            representantCivilite: cessionnaireMorale.representantCivilite as "M." | "Mme",
            representantNom: cessionnaireMorale.representantNom,
            representantPrenom: cessionnaireMorale.representantPrenom,
            representantQualite: cessionnaireMorale.representantQualite,
          } : undefined,
          acquisitionBiens: cessionnaireAchatBiensPropres ? "propres" : "communs",
        },
        prix: {
          prixTotal: prixTotal,
          typePaiement: (modePaiement === "echeances" ? "echelonne" : "comptant") as any,
          echeances: modePaiement === "echeances" ? echeances.map(e => ({ montant: e.montant, date: e.date })) : undefined,
        },
        natureCession: {
          type: (typePropriete === "pleine-propriete" ? "pleine_propriete" : typePropriete === "usufruit" ? "usufruit" : "nue_propriete") as any,
          numeroDe: numeroPartsDe,
          numeroA: numeroPartsA,
        },
        gap: {
          active: garantieActifPassif,
          plafond: garantieMontantMax,
          dureeAnnees: garantieDuree,
          seuilParSinistre: garantieSeuilDeclenchement,
          notificationAdresse: garantieAdresse,
          notificationEmail: garantieEmail,
          escrow: false,
        },
        comptesCourants: {
          option: (comptesCourants || "absent") as any,
        },
        nonConcurrence: {
          active: clauseNonConcurrenceVendeur || clauseNonConcurrenceAcheteur,
          dureeAns: clauseNCVDuree,
          zoneGeographique: clauseNCVZone,
          appliqueAuCessionnaire: clauseNonConcurrenceAcheteur,
          dureeAnsCessionnaire: clauseNCADuree,
          zoneGeoCessionnaire: clauseNCAZone,
        },
        pv: {
          typeAssemblee: (associeUnique ? "associe_unique" : "unanime") as any,
          ville: lieuSignature,
          date: dateSignature,
          modificationValeurNominale,
          changementDirigeant: includChangementDirigeant,
          nouveauDirigeantTypePersonne: nouveauDirigeantType,
          nouveauDirigeantCivilite: nouveauDirigeantPhysique.civilite as "M." | "Mme",
          nouveauDirigeantNom: nouveauDirigeantPhysique.nom,
          nouveauDirigeantPrenom: nouveauDirigeantPhysique.prenom,
          nouveauDirigeantDateNaissance: nouveauDirigeantPhysique.dateNaissance,
          nouveauDirigeantVilleNaissance: nouveauDirigeantPhysique.lieuNaissance,
          nouveauDirigeantNationalite: nouveauDirigeantPhysique.nationalite,
          nouveauDirigeantAdresse: `${nouveauDirigeantPhysique.adresse}, ${nouveauDirigeantPhysique.codePostal} ${nouveauDirigeantPhysique.ville}`.trim(),
          nouveauDirigeantNomPere: nouveauDirigeantPereNom,
          nouveauDirigeantPrenomPere: nouveauDirigeantPerePrenom,
          nouveauDirigeantNomMere: nouveauDirigeantMereNom,
          nouveauDirigeantPrenomMere: nouveauDirigeantMerePrenom,
          nouveauDirigeantFonction: nouveauDirigeantQualite,
          nouveauDirigeantDenomination: nouveauDirigeantMorale.denomination,
          nouveauDirigeantFormeJuridiqueStr: nouveauDirigeantMorale.formeJuridique,
          nouveauDirigeantCapitalStr: "",
          nouveauDirigeantSiegeSocial: `${nouveauDirigeantMorale.siegeAdresse}, ${nouveauDirigeantMorale.siegeCP} ${nouveauDirigeantMorale.siegeVille}`.trim(),
          nouveauDirigeantRCSSiege: "",
          nouveauDirigeantRCSNum: nouveauDirigeantMorale.siren,
          rpCivilite: representantPermanent.civilite as "M." | "Mme",
          rpNom: representantPermanent.nom,
          rpPrenom: representantPermanent.prenom,
          rpDateNaissance: representantPermanent.dateNaissance,
          rpVilleNaissance: representantPermanent.lieuNaissance,
          rpNationalite: representantPermanent.nationalite,
          rpAdresse: `${representantPermanent.adresse}, ${representantPermanent.codePostal} ${representantPermanent.ville}`.trim(),
          rpNomPere: representantPermanentPereNom,
          rpPrenomPere: representantPermanentPerePrenom,
          rpNomMere: representantPermanentMereNom,
          rpPrenomMere: representantPermanentMerePrenom,
          mandataireFormalities,
          questionsEcrites: false,
        },
        ville: lieuSignature,
        date: dateSignature,
        fraisALaCharge: fraisACharge === "cedant" ? "Cédant" : "Cessionnaire",
        cedantIsSocieteCible,
        cessionnaireIsSocieteCible,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 240000);
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, type }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur serveur: ${response.status}`);
      }
      const result = await response.json();

      if (result.acte) {
        setActeText(result.acte);
        const blob = await generateActeDocx(result.acte, formData as any);
        setActeBlobUrl(window.URL.createObjectURL(blob));
      }
      if (result.pv) {
        setPvText(result.pv);
        const blob = await generatePVDocx(result.pv, formData as any);
        setPvBlobUrl(window.URL.createObjectURL(blob));
      }
      if (result.declaration) {
        setDeclarationText(result.declaration);
        const blob = await generateDeclarationDocx(result.declaration, formData as any);
        setDeclarationBlobUrl(window.URL.createObjectURL(blob));
      }
      setDocumentGenere(true);
    } catch (error) {
      console.error('[generation] error:', error);
      alert(`Erreur lors de la génération : ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
  <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="block h-12 w-auto" style={{ aspectRatio: 'auto' }}>
            <Image 
              src="/images/logo-legal-corners.svg" 
              alt="Legal Corners" 
              width={160} 
              height={50} 
              className="h-full w-auto !w-auto object-contain"
              style={{ width: 'auto', height: '100%' }}
              priority
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/connexion" className="text-sm text-[#1E3A8A]/80 hover:text-[#1E3A8A] flex items-center gap-1">
              <User className="w-4 h-4" />
              Connexion
            </Link>
          </nav>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {/* Mobile Progress Bar */}
      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-[57px] z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1E3A8A]">Etape {step} sur {STEPS.length}</span>
            <span className="text-sm text-[#1E3A8A]/60">{STEPS.find(s => s.id === step)?.label}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#5D9CEC] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        {/* Mini steps indicator */}
        <div className="flex justify-center gap-1.5 pb-3 overflow-x-auto px-2">
          {STEPS.map((s) => (
            <div 
              key={s.id}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0",
                s.id === step ? "bg-[#5D9CEC] text-white" :
                s.id < step ? "bg-green-500 text-white" :
                "bg-gray-100 text-gray-400"
              )}
            >
              {s.id < step ? <Check className="w-3 h-3" /> : s.id}
            </div>
          ))}
        </div>
      </div>
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 bg-white border-r border-gray-100 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="p-6 pt-4">
            <h2 className="text-[#1E3A8A] font-semibold mb-1">Cession de parts</h2>
            <p className="text-sm text-gray-500 mb-6">Document juridique</p>
            
            {/* Steps */}
            <div className="space-y-1">
              {STEPS.map((s, index) => {
                const isActive = s.id === step;
                const isCompleted = s.id < step;
                
                return (
                  <div key={s.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        isActive ? "bg-[#5D9CEC] text-white" : 
                        isCompleted ? "bg-green-500 text-white" : 
                        "bg-gray-100 text-gray-400"
                      )}>
                        {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-6 mt-1",
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        )} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-[#1E3A8A]" : "text-gray-500"
                      )}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Help Box */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-[#1E3A8A] mb-2">Besoin d&apos;aide ?</h3>
              <p className="text-xs text-[#1E3A8A]/80 mb-3">
                Notre equipe est disponible pour vous accompagner
              </p>
              <a href="mailto:support@legalcorners.fr" className="text-[#5D9CEC] text-sm font-medium">
                support@legalcorners.fr
              </a>
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: Type de cession */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Titre centre */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A]">
                  Cession d&apos;actions / parts sociales
                </h1>
                <p className="text-gray-600 mt-1">
                  Generez votre acte de cession en quelques minutes
                </p>
              </div>
  {/* Type de cession */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-semibold text-[#3B6FD9]">Que souhaitez-vous ceder ?</h2>
                  <TooltipHelp title={TOOLTIPS.typeCession.title} content={TOOLTIPS.typeCession.content} />
                </div>
                <p className="text-gray-600 mb-6">Selectionnez le type de titres concernes par la cession</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTypeCession("actions")}
                    className={cn(
                      "p-6 rounded-xl border-2 text-left transition-all",
                      typeCession === "actions"
                        ? "border-[#3B6FD9] bg-[#5D9CEC]/10 shadow-md"
                        : "border-gray-200 hover:border-[#3B6FD9]/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="font-bold text-lg text-[#1E3A8A]">Actions</span>
                    </div>
                    <p className="text-sm text-gray-600">SAS, SASU, SA, SCA</p>
                  </button>
                  <button
                    onClick={() => setTypeCession("parts-sociales")}
                    className={cn(
                      "p-6 rounded-xl border-2 text-left transition-all",
                      typeCession === "parts-sociales"
                        ? "border-[#3B6FD9] bg-[#5D9CEC]/10 shadow-md"
                        : "border-gray-200 hover:border-[#3B6FD9]/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <span className="font-bold text-lg text-[#1E3A8A]">Parts sociales</span>
                    </div>
                    <p className="text-sm text-gray-600">SARL, EURL, SCI, SNC</p>
                  </button>
                </div>
              </div>
              {/* Option changement de dirigeant */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-xl p-6 border border-blue-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="changement-dirigeant"
                    checked={includChangementDirigeant}
                    onChange={(e) => setIncludChangementDirigeant(e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer accent-[#3B6FD9]"
                  />
                  <label htmlFor="changement-dirigeant" className="cursor-pointer flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#1E3A8A]">Inclure un changement de dirigeant</h3>
                    <TooltipHelp title="Changement de dirigeant" content="Genere egalement un PV de changement de dirigeant (ancien dirigeant part, nouveau dirigeant arrive)" />
                  </label>
                </div>
                <p className="text-sm text-gray-600">La cession peut s'accompagner d'un changement de gerant/president. Un PV sera genere pour ce changement.</p>
              </motion.div>
              {/* Type de propriété */}
              {typeCession && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-[#1E3A8A] mb-2">Type de transfert de propriété</h2>
                  <p className="text-gray-600 mb-6">Comment souhaitez-vous transférer les {typeCession === "actions" ? "actions" : "parts sociales"} ?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setTypePropriete("pleine-propriete")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        typePropriete === "pleine-propriete"
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      <span className="font-semibold text-[#1E3A8A] block">Pleine propriété</span>
                      <span className="text-xs text-gray-500">Transfert total</span>
                    </button>
                    <button
                      onClick={() => setTypePropriete("usufruit")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        typePropriete === "usufruit"
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      <span className="font-semibold text-[#1E3A8A] block">Usufruit</span>
                      <span className="text-xs text-gray-500">Droit d&apos;usage</span>
                    </button>
                    <button
                      onClick={() => setTypePropriete("nue-propriete")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        typePropriete === "nue-propriete"
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      <span className="font-semibold text-[#1E3A8A] block">Nue-propriété</span>
                      <span className="text-xs text-gray-500">Sans usufruit</span>
                    </button>
                  </div>
                  <Collapsible className="mt-4">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-[#1E3A8A]">
                      <HelpCircle className="w-4 h-4" />
                      <span>Quelle différence ?</span>
                      <ChevronDown className="w-4 h-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-2">
                      <p><strong>Pleine propriété :</strong> Le cessionnaire acquiert tous les droits (vote, dividendes, vente).</p>
                      <p><strong>Usufruit :</strong> Le cessionnaire perçoit les dividendes mais le nu-propriétaire conserve le titre.</p>
                      <p><strong>Nue-propriété :</strong> Le cessionnaire devient propriétaire mais l&apos;usufruitier conserve les revenus.</p>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              )}
            </motion.div>
          )}
          {/* STEP 2: Les parties (avant paiement) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Qui sont les parties ?</h1>
                <p className="text-gray-600">Quelques informations pour préparer votre document</p>
              </div>
              {/* Cédant */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1E3A8A] mb-4">Le Cédant (vendeur)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setCedantType("physique"); setCedantIsSocieteCible(false); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      cedantType === "physique"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <User className="w-8 h-8 mx-auto mb-2 text-[#1E3A8A]" />
                    <span className="font-medium text-[#1E3A8A] block">Personne physique</span>
                    <span className="text-xs text-gray-500">Un particulier</span>
                  </button>
                  <button
                    onClick={() => { setCedantType("morale"); setCedantIsSocieteCible(false); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      cedantType === "morale"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-[#1E3A8A]" />
                    <span className="font-medium text-[#1E3A8A] block">Personne morale</span>
                    <span className="text-xs text-gray-500">Une société</span>
                  </button>
                </div>
                {cedantType === "morale" && (
                  <button
                    onClick={() => {
                      setCedantIsSocieteCible(!cedantIsSocieteCible);
                      if (!cedantIsSocieteCible) {
                        setCedantMorale({
                          denomination: societe.denomination,
                          formeJuridique: societe.formeJuridique,
                          siegeAdresse: societe.siegeAdresse,
                          siegeCP: societe.siegeCP,
                          siegeVille: societe.siegeVille,
                          siegePays: societe.siegePays,
                          capital: societe.capital,
                          rcsVille: societe.rcsVille,
                          rcsNumero: societe.rcsNumero,
                          representantCivilite: "",
                          representantNom: "",
                          representantPrenom: "",
                          representantQualite: "",
                          email: "",
                        });
                      }
                    }}
                    className={cn(
                      "mt-3 w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                      cedantIsSocieteCible
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <Building2 className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                    <span className="text-sm font-medium text-[#1E3A8A]">
                      Il s&apos;agit de la société cible{societe.denomination ? ` (${societe.denomination})` : ""}
                    </span>
                  </button>
                )}
              </div>
              {/* Cessionnaire */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1E3A8A] mb-4">Le Cessionnaire (acheteur)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setCessionnaireType("physique"); setCessionnaireIsSocieteCible(false); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      cessionnaireType === "physique"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <User className="w-8 h-8 mx-auto mb-2 text-[#1E3A8A]" />
                    <span className="font-medium text-[#1E3A8A] block">Personne physique</span>
                  </button>
                  <button
                    onClick={() => { setCessionnaireType("morale"); setCessionnaireIsSocieteCible(false); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      cessionnaireType === "morale"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-[#1E3A8A]" />
                    <span className="font-medium text-[#1E3A8A] block">Personne morale</span>
                  </button>
                </div>
                {cessionnaireType === "morale" && (
                  <button
                    onClick={() => {
                      setCessionnaireIsSocieteCible(!cessionnaireIsSocieteCible);
                      if (!cessionnaireIsSocieteCible) {
                        setCessionnaireMorale({
                          denomination: societe.denomination,
                          formeJuridique: societe.formeJuridique,
                          siegeAdresse: societe.siegeAdresse,
                          siegeCP: societe.siegeCP,
                          siegeVille: societe.siegeVille,
                          siegePays: societe.siegePays,
                          capital: societe.capital,
                          rcsVille: societe.rcsVille,
                          rcsNumero: societe.rcsNumero,
                          representantCivilite: "",
                          representantNom: "",
                          representantPrenom: "",
                          representantQualite: "",
                          email: "",
                        });
                      }
                    }}
                    className={cn(
                      "mt-3 w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                      cessionnaireIsSocieteCible
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <Building2 className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                    <span className="text-sm font-medium text-[#1E3A8A]">
                      Il s&apos;agit de la société cible{societe.denomination ? ` (${societe.denomination})` : ""}
                    </span>
                  </button>
                )}
              </div>
              {/* Estimation */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1E3A8A] mb-4">Estimation de la cession</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de {typeCession === "actions" ? "actions" : "parts"} à céder
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={nombrePartsApprox}
                      onChange={(e) => setNombrePartsApprox(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix total estimé (€)
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 10000"
                      value={prixApprox}
                      onChange={(e) => setPrixApprox(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* Expert-comptable pour évaluation */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1E3A8A] mb-2">Évaluation des parts/actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Avez-vous besoin d&apos;un expert-comptable pour évaluer la valeur des parts ou actions ?
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setBesoinExpertComptable("oui")}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      besoinExpertComptable === "oui"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-medium text-[#1E3A8A] block">Oui, je souhaite une évaluation</span>
                      <span className="text-xs text-gray-500">Un expert-comptable partenaire vous contactera (+150€)</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setBesoinExpertComptable("deja")}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      besoinExpertComptable === "deja"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-[#1E3A8A] block">J&apos;ai déjà un expert-comptable</span>
                      <span className="text-xs text-gray-500">L&apos;évaluation sera faite de mon côté</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setBesoinExpertComptable("non")}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                      besoinExpertComptable === "non"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-[#1E3A8A] block">Non merci, je connais déjà le prix</span>
                      <span className="text-xs text-gray-500">Le prix a deja ete convenu entre les parties</span>
                    </div>
                  </button>
                </div>
                
                {besoinExpertComptable === "oui" && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <Info className="w-4 h-4 inline mr-1" />
                      Un expert-comptable vous contactera sous 24h pour réaliser l&apos;évaluation. Ce service est facturé 150€ HT en supplément.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* STEP 3: Paiement */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Choisissez votre formule</h1>
                <p className="text-gray-600">Sélectionnez l&apos;offre adaptée à vos besoins</p>
              </div>
              {/* Deux formules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Formule Essentiel - 199€ */}
                <button
                  type="button"
                  onClick={() => setSelectedFormule("essentiel")}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 text-left transition-all",
                    selectedFormule === "essentiel"
                      ? "border-[#5D9CEC] bg-[#5D9CEC]/5 shadow-lg"
                      : "border-gray-200 hover:border-[#5D9CEC]/50 hover:shadow-md"
                  )}
                >
                  {selectedFormule === "essentiel" && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-[#5D9CEC]" />
                    </div>
                  )}
                  
                  <p className="text-sm font-medium text-[#5D9CEC] mb-2">ESSENTIEL</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-[#1E3A8A]">199€</span>
                    <span className="text-gray-500">HT</span>
                  </div>
                  
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Acte de cession complet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">PV d&apos;assemblée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Registre des mouvements de titres</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Formulaire d&apos;enregistrement fiscal</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-400">
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Vérification par un juriste</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-400">
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Accompagnement téléphonique</span>
                    </li>
                  </ul>
                </button>
                {/* Formule Premium - 299€ */}
                <button
                  type="button"
                  onClick={() => setSelectedFormule("premium")}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 text-left transition-all",
                    selectedFormule === "premium"
                      ? "border-[#5D9CEC] bg-[#5D9CEC]/5 shadow-lg"
                      : "border-gray-200 hover:border-[#5D9CEC]/50 hover:shadow-md"
                  )}
                >
                  {/* Badge recommandé */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#5D9CEC] to-[#3B6FD9] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      RECOMMANDÉ
                    </span>
                  </div>
                  
                  {selectedFormule === "premium" && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-[#5D9CEC]" />
                    </div>
                  )}
                  
                  <p className="text-sm font-medium text-[#5D9CEC] mb-2">PREMIUM</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-[#1E3A8A]">299€</span>
                    <span className="text-gray-500">HT</span>
                  </div>
                  
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Acte de cession complet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">PV d&apos;assemblée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Registre des mouvements de titres</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Formulaire d&apos;enregistrement fiscal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Vérification par un juriste</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Accompagnement téléphonique</span>
                    </li>
                  </ul>
                </button>
              </div>
              {/* Simulateur frais d'État */}
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-6">
                <h2 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Frais obligatoires (versés aux administrations)
                </h2>

                {/* Droits enregistrement — à charge des parties */}
                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-orange-800">Droits d&apos;enregistrement — à votre charge directe</p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      {(() => {
                        const prix = parseFloat(prixTotal) || 0;
                        const droits = prix > 0 ? `~${Math.round(Math.max(25, prix * 0.03))}€` : "3% du prix (min. 25€)";
                        return `${droits} — à déclarer et payer directement au Service des Impôts des Entreprises dans le mois suivant la signature.`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Frais cession pris en charge */}
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Formalités cession (inclus dans notre service)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-amber-600 mb-1">Annonce légale (JAL)</p>
                    <p className="font-semibold text-amber-900">~150€</p>
                    <p className="text-[10px] text-amber-500">Journal officiel habilité</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-amber-600 mb-1">Annonce légale (JAL)</p>
                    <p className="font-semibold text-amber-900">~150€</p>
                    <p className="text-[10px] text-amber-500">Journal officiel habilité</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs text-amber-600 mb-1">Frais de Greffe</p>
                    <p className="font-semibold text-amber-900">~60€</p>
                    <p className="text-[10px] text-amber-500">Tribunal de commerce</p>
                  </div>
                </div>

                {/* Frais changement de dirigeant */}
                {includChangementDirigeant && (
                  <>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 mt-4 border-t border-amber-200 pt-3">
                      + Changement de dirigeant
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-white rounded-lg text-center border border-amber-200">
                        <p className="text-xs text-amber-600 mb-1">Annonce légale (JAL)</p>
                        <p className="font-semibold text-amber-900">~150€</p>
                        <p className="text-[10px] text-amber-500">Changement de gérant/président</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg text-center border border-amber-200">
                        <p className="text-xs text-amber-600 mb-1">Frais de Greffe</p>
                        <p className="font-semibold text-amber-900">~200€</p>
                        <p className="text-[10px] text-amber-500">Modification au RCS</p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg text-center mb-3">
                      <p className="text-xs text-amber-700 font-medium">Total formalités estimées (hors droits d&apos;enregistrement)</p>
                      <p className="text-lg font-bold text-amber-900">
                        ~{/* cession: JAL 150 + greffe 60 | dirigeant: JAL 150 + greffe 200 | débours: 12 */}
                        {150 + 60 + 150 + 200 + 12}€
                      </p>
                    </div>
                  </>
                )}

                {/* Débours */}
                <div className="mt-4 border-t border-amber-200 pt-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Débours (documents officiels)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="p-3 bg-white rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-800">Extrait Kbis</p>
                        <p className="text-[10px] text-amber-500">Téléchargé au Greffe</p>
                      </div>
                      <p className="font-semibold text-amber-900">~4€</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-800">Statuts à jour certifiés</p>
                        <p className="text-[10px] text-amber-500">Téléchargés au Greffe</p>
                      </div>
                      <p className="font-semibold text-amber-900">~8€</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-amber-600 text-center mt-2">
                  Ces frais sont versés directement aux administrations et refacturés à l&apos;identique.
                </p>
              </div>
              {/* Paiement */}
              {selectedFormule && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h2 className="font-semibold text-[#1E3A8A] mb-2">Paiement sécurisé</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Vous allez être redirigé vers la page de paiement Stripe. Vos données sont conservées.
                  </p>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mb-5">
                    <div>
                      <p className="font-semibold text-[#1E3A8A]">Formule {selectedFormule === "essentiel" ? "Essentiel" : "Premium"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">TVA 20% incluse</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1E3A8A]">
                        {selectedFormule === "essentiel" ? "238,80" : "358,80"}€
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedFormule === "essentiel" ? "199" : "299"}€ HT
                      </p>
                    </div>
                  </div>

                  {stripeError && (
                    <p className="text-sm text-red-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {stripeError}
                    </p>
                  )}

                  <Button
                    onClick={async () => {
                      setStripeLoading(true);
                      setStripeError("");
                      try {
                        // Sauvegarder l'état dans sessionStorage avant redirect
                        const stateKey = `lc_state_${Date.now()}`;
                        sessionStorage.setItem(stateKey, JSON.stringify({
                          typeCession, typePropriete, cedantType, cessionnaireType,
                        }));
                        const res = await fetch("/api/stripe/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ formule: selectedFormule, stateKey }),
                        });
                        const data = await res.json();
                        if (!res.ok || !data.url) throw new Error(data.error || "Erreur Stripe");
                        window.location.href = data.url;
                      } catch (err: unknown) {
                        setStripeError(err instanceof Error ? err.message : "Erreur inconnue");
                        setStripeLoading(false);
                      }
                    }}
                    disabled={stripeLoading}
                    className="w-full bg-[#5D9CEC] hover:bg-[#4A8BD9] text-white py-6 text-base gap-2"
                  >
                    {stripeLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</>
                    ) : (
                      <>Payer {selectedFormule === "essentiel" ? "238,80" : "358,80"}€ TTC</>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span>Paiement 100% sécurisé par Stripe</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          {/* STEP 4: Société concernée */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">La société concernée</h1>
                <p className="text-gray-600">Recherchez la société par son numéro SIREN</p>
              </div>
              {/* Recherche par SIREN ou Nom */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Recherche par SIREN ou Nom
                </h3>
                
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Entrez le SIREN (9 chiffres) ou le nom de la société"
                      value={sirenSearch}
                      onChange={(e) => {
                        setSirenSearch(e.target.value);
                        setShowResults(false);
                        setSearchResults([]);
                      }}
                      className="text-lg"
                    />
                    
                    {/* Liste déroulante des résultats */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                            onClick={async () => {
                              // Sélectionner cette société et charger ses détails
                              setSirenLoading(true);
                              setShowResults(false);
                              try {
                                const response = await fetch(`/api/siren?siren=${result.siren}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  setSociete({
                                    ...societe,
                                    denomination: data.denominationSociale || result.nom,
                                    formeJuridique: data.formeJuridique?.toUpperCase() || "",
                                    siegeAdresse: data.siegeSocial || "",
                                    siegeCP: data.codePostal || "",
                                    siegeVille: data.ville || result.ville || "",
                                    capital: data.capitalSocial || "",
                                    rcsNumero: result.siren,
                                    rcsVille: data.ville || result.ville || "",
                                  });
                                  setSocieteDirigeants(data.dirigeants || []);
                                  setSirenFound(true);
                                  setSirenSearch(result.nom);
                                }
                              } catch {
                                // Utiliser les infos de base
                                setSociete({...societe, denomination: result.nom, rcsNumero: result.siren, siegeVille: result.ville || ""});
                                setSirenFound(true);
                              } finally {
                                setSirenLoading(false);
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{result.nom}</div>
                              {result.ville && <div className="text-sm text-gray-500">{result.ville}</div>}
                            </div>
                            <div className="text-sm text-blue-600 font-mono">{result.siren}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={async () => {
                      if (sirenSearch.length < 2) {
                        alert("Entrez au moins 2 caractères pour rechercher");
                        return;
                      }
                      setSirenLoading(true);
                      setSirenError(null);
                      setSearchResults([]);
                      setShowResults(false);
                      try {
                        // Détecter si c'est un SIREN (9 chiffres) ou un nom
                        const cleanValue = sirenSearch.replace(/\s/g, '');
                        const isSiren = /^\d{9}$/.test(cleanValue);
                        
                        if (isSiren) {
                          // Recherche directe par SIREN
                          const response = await fetch(`/api/siren?siren=${cleanValue}`);
                          if (response.ok) {
                            const data = await response.json();
                            setSociete({
                              ...societe,
                              denomination: data.denominationSociale || "",
                              formeJuridique: data.formeJuridique?.toUpperCase() || "",
                              siegeAdresse: data.siegeSocial || "",
                              siegeCP: data.codePostal || "",
                              siegeVille: data.ville || "",
                              capital: data.capitalSocial || "",
                              rcsNumero: cleanValue,
                              rcsVille: data.ville || "",
                            });
                            setSocieteDirigeants(data.dirigeants || []);
                            setSirenFound(true);
                          } else {
                            setSirenError("SIREN non trouvé");
                          }
                        } else {
                          // Recherche par nom - afficher la liste des résultats
                          const response = await fetch(`/api/siren?nom=${encodeURIComponent(sirenSearch)}&list=true`);
                          if (response.ok) {
                            const data = await response.json();
                            if (data.resultats && data.resultats.length > 0) {
                              setSearchResults(data.resultats);
                              setShowResults(true);
                            } else {
                              setSirenError("Aucune société trouvée");
                            }
                          } else {
                            setSirenError("Aucune société trouvée avec ce nom");
                          }
                        }
                      } catch {
                        setSirenError("Erreur lors de la recherche");
                      } finally {
                        setSirenLoading(false);
                      }
                    }}
                    disabled={sirenSearch.length < 2 || sirenLoading}
                    className="bg-[#5D9CEC] hover:bg-[#4A8BD9] text-white px-6"
                  >
                    {sirenLoading ? "Recherche..." : "Rechercher"}
                  </Button>
                </div>
                
                {sirenError && (
                  <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    {sirenError}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Recherchez par SIREN (9 chiffres) ou par nom de société (ex: LAW AND CO, LEGALCORNERS)</p>
              </div>
              {/* Formulaire société - affiché après recherche ou directement */}
              {(sirenFound || societe.rcsNumero) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 space-y-4"
                >
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Informations de la société</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination sociale *</label>
                    <Input
                      placeholder="Nom de la société"
                      value={societe.denomination}
                      onChange={(e) => setSociete({...societe, denomination: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du siège social *</label>
                    <Input
                      placeholder="Numéro et rue"
                      value={societe.siegeAdresse}
                      onChange={(e) => setSociete({...societe, siegeAdresse: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                      <Input
                        placeholder="75001"
                        value={societe.siegeCP}
                        onChange={(e) => setSociete({...societe, siegeCP: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                      <Input
                        placeholder="Paris"
                        value={societe.siegeVille}
                        onChange={(e) => setSociete({...societe, siegeVille: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                      <Input
                        value={societe.siegePays}
                        onChange={(e) => setSociete({...societe, siegePays: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capital social (€) *</label>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={societe.capital}
                        onChange={(e) => setSociete({...societe, capital: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre total de {typeCession === "actions" ? "actions" : "parts"} *</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={societe.nombreTotalParts}
                        onChange={(e) => setSociete({...societe, nombreTotalParts: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RCS (ville) *</label>
                      <Input
                        placeholder="Paris"
                        value={societe.rcsVille}
                        onChange={(e) => setSociete({...societe, rcsVille: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro SIREN *</label>
                      <Input
                        placeholder="123456789"
                        value={societe.rcsNumero}
                        onChange={(e) => setSociete({...societe, rcsNumero: e.target.value})}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique *</label>
                    <Select value={societe.formeJuridique} onValueChange={(v) => setSociete({...societe, formeJuridique: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAS">SAS</SelectItem>
                        <SelectItem value="SASU">SASU</SelectItem>
                        <SelectItem value="SARL">SARL</SelectItem>
                        <SelectItem value="EURL">EURL</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="SCI">SCI</SelectItem>
                        <SelectItem value="SNC">SNC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {societeDirigeants.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-[#1E3A8A] mb-3">Dirigeants</h4>
                      <div className="space-y-2">
                        {societeDirigeants.map((dir, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-2 text-sm">
                            <span className="font-medium text-gray-900">{dir.prenom} {dir.nom}</span>
                            <span className="text-[#1E3A8A] bg-white border border-blue-200 rounded px-2 py-0.5 text-xs">{dir.qualite}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Lien pour saisie manuelle si pas de SIREN */}
              {!sirenFound && !societe.rcsNumero && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setSirenFound(true)}
                    className="text-[#5D9CEC] hover:underline text-sm"
                  >
                    Je ne connais pas le SIREN, saisir manuellement
                  </button>
                </div>
              )}
            </motion.div>
          )}
          {/* STEP 5: Informations cédant */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Informations du Cédant</h1>
                <p className="text-gray-600">Le vendeur des {typeCession === "actions" ? "actions" : "parts sociales"}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                {cedantType === "physique" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Civilité *</label>
                        <Select value={cedantPhysique.civilite} onValueChange={(v) => setCedantPhysique({...cedantPhysique, civilite: v as "M." | "Mme"})}>
                          <SelectTrigger>
                            <SelectValue placeholder="--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M.">M.</SelectItem>
                            <SelectItem value="Mme">Mme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                          <Input
                            placeholder="Nom"
                            value={cedantPhysique.nom}
                            onChange={(e) => setCedantPhysique({...cedantPhysique, nom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                          <Input
                            placeholder="Prénom"
                            value={cedantPhysique.prenom}
                            onChange={(e) => setCedantPhysique({...cedantPhysique, prenom: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <Input
                          type="date"
                          value={cedantPhysique.dateNaissance}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, dateNaissance: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                        <Input
                          placeholder="Paris"
                          value={cedantPhysique.lieuNaissance}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, lieuNaissance: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationalité</label>
                        <Input
                          placeholder="française"
                          value={cedantPhysique.nationalite}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, nationalite: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                          type="email"
                          placeholder="prenom@email.com"
                          value={cedantPhysique.email}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <Input
                        placeholder="12 rue de la Paix"
                        value={cedantPhysique.adresse}
                        onChange={(e) => setCedantPhysique({...cedantPhysique, adresse: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                        <Input
                          placeholder="75001"
                          value={cedantPhysique.codePostal}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, codePostal: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                        <Input
                          placeholder="Paris"
                          value={cedantPhysique.ville}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, ville: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <Input
                          placeholder="France"
                          value={cedantPhysique.pays}
                          onChange={(e) => setCedantPhysique({...cedantPhysique, pays: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de {typeCession === "actions" ? "actions" : "parts"} detenues *
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={cedantNombreParts}
                        onChange={(e) => setCedantNombreParts(e.target.value)}
                      />
                    </div>
                    {/* Regime matrimonial */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium text-[#1E3A8A]">Regime matrimonial *</h4>
                        <TooltipHelp title={TOOLTIPS.regimeMatrimonial.title} content={TOOLTIPS.regimeMatrimonial.content} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => setCedantRegimeMatrimonial("communaute")}
                          className={cn(
                            "p-3 rounded-lg border-2 text-center transition-all text-sm",
                            cedantRegimeMatrimonial === "communaute"
                              ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                              : "border-gray-200 hover:border-[#1E3A8A]/50"
                          )}
                        >
                          Communauté de biens
                        </button>
                        <button
                          onClick={() => setCedantRegimeMatrimonial("separation")}
                          className={cn(
                            "p-3 rounded-lg border-2 text-center transition-all text-sm",
                            cedantRegimeMatrimonial === "separation"
                              ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                              : "border-gray-200 hover:border-[#1E3A8A]/50"
                          )}
                        >
                          Séparation de biens
                        </button>
                        <button
                          onClick={() => setCedantRegimeMatrimonial("celibataire")}
                          className={cn(
                            "p-3 rounded-lg border-2 text-center transition-all text-sm",
                            cedantRegimeMatrimonial === "celibataire"
                              ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                              : "border-gray-200 hover:border-[#1E3A8A]/50"
                          )}
                        >
                          Ni marié ni pacsé
                        </button>
                      </div>
                      {cedantRegimeMatrimonial === "communaute" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200"
                        >
                          <p className="text-sm text-amber-800 mb-3">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Le conjoint doit consentir à la cession
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-amber-800 mb-1">Civilité *</label>
                              <Select value={cedantConjointCivilite} onValueChange={(v) => setCedantConjointCivilite(v as "M." | "Mme")}>
                                <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M.">M.</SelectItem>
                                  <SelectItem value="Mme">Mme</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-amber-800 mb-1">Nom *</label>
                              <Input
                                placeholder="Nom"
                                value={cedantConjointNom}
                                onChange={(e) => setCedantConjointNom(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-amber-800 mb-1">Prénom *</label>
                              <Input
                                placeholder="Prénom"
                                value={cedantConjointPrenom}
                                onChange={(e) => setCedantConjointPrenom(e.target.value)}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Recherche par SIREN ou Nom pour cedant morale */}
                    {!cedantSirenFound && !cedantMorale.rcsNumero && (
                      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recherche par SIREN ou Nom du cédant
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Input
                              placeholder="SIREN (9 chiffres) ou nom de la société"
                              value={cedantSirenSearch}
                              onChange={(e) => {
                                setCedantSirenSearch(e.target.value);
                                setShowCedantResults(false);
                                setCedantSearchResults([]);
                              }}
                            />
                            {/* Liste déroulante des résultats */}
                            {showCedantResults && cedantSearchResults.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {cedantSearchResults.map((result, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                                    onClick={async () => {
                                      setCedantSirenLoading(true);
                                      setShowCedantResults(false);
                                      try {
                                        const response = await fetch(`/api/siren?siren=${result.siren}`);
                                        if (response.ok) {
                                          const data = await response.json();
                                          setCedantMorale({
                                            ...cedantMorale,
                                            denomination: data.denominationSociale || result.nom,
                                            formeJuridique: data.formeJuridique?.toUpperCase() || "",
                                            siegeAdresse: data.siegeSocial || "",
                                            siegeCP: data.codePostal || "",
                                            siegeVille: data.ville || result.ville || "",
                                            capital: data.capitalSocial || "",
                                            rcsNumero: result.siren,
                                            rcsVille: data.ville || result.ville || "",
                                          });
                                          setCedantSirenFound(true);
                                          setCedantSirenSearch(result.nom);
                                        }
                                      } catch {
                                        setCedantMorale({...cedantMorale, denomination: result.nom, rcsNumero: result.siren});
                                        setCedantSirenFound(true);
                                      } finally {
                                        setCedantSirenLoading(false);
                                      }
                                    }}
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900">{result.nom}</div>
                                      {result.ville && <div className="text-sm text-gray-500">{result.ville}</div>}
                                    </div>
                                    <div className="text-sm text-blue-600 font-mono">{result.siren}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={async () => {
                              if (cedantSirenSearch.length < 2) {
                                alert("Entrez au moins 2 caractères");
                                return;
                              }
                              setCedantSirenLoading(true);
                              setCedantSearchResults([]);
                              setShowCedantResults(false);
                              try {
                                const cleanValue = cedantSirenSearch.replace(/\s/g, '');
                                const isSiren = /^\d{9}$/.test(cleanValue);
                                
                                if (isSiren) {
                                  const response = await fetch(`/api/siren?siren=${cleanValue}`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    setCedantMorale({
                                      ...cedantMorale,
                                      denomination: data.denominationSociale || "",
                                      formeJuridique: data.formeJuridique?.toUpperCase() || "",
                                      siegeAdresse: data.siegeSocial || "",
                                      siegeCP: data.codePostal || "",
                                      siegeVille: data.ville || "",
                                      capital: data.capitalSocial || "",
                                      rcsNumero: cleanValue,
                                      rcsVille: data.ville || "",
                                    });
                                    setCedantSirenFound(true);
                                  } else {
                                    alert("SIREN non trouvé");
                                  }
                                } else {
                                  const response = await fetch(`/api/siren?nom=${encodeURIComponent(cedantSirenSearch)}&list=true`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    if (data.resultats && data.resultats.length > 0) {
                                      setCedantSearchResults(data.resultats);
                                      setShowCedantResults(true);
                                    } else {
                                      alert("Aucune société trouvée");
                                    }
                                  } else {
                                    alert("Aucune société trouvée");
                                  }
                                }
                              } catch {
                                alert("Erreur lors de la recherche");
                              }
                              setCedantSirenLoading(false);
                            }}
                            disabled={cedantSirenSearch.length < 2 || cedantSirenLoading}
                            className="bg-[#5D9CEC] hover:bg-[#4A89DC]"
                          >
                            {cedantSirenLoading ? "Recherche..." : "Rechercher"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Recherchez par SIREN ou par nom (ex: LEGALCORNERS, DANONE)
                        </p>
                        <button
                          type="button"
                          className="text-sm text-[#5D9CEC] hover:underline mt-2"
                          onClick={() => setCedantSirenFound(true)}
                        >
                          Je ne connais pas le SIREN, saisir manuellement
                        </button>
                      </div>
                    )}
                    {(cedantSirenFound || cedantMorale.rcsNumero) && (
                      <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Denomination sociale *</label>
                        <Input
                          placeholder="Nom de la societe"
                          value={cedantMorale.denomination}
                          onChange={(e) => setCedantMorale({...cedantMorale, denomination: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique *</label>
                        <Select value={cedantMorale.formeJuridique} onValueChange={(v) => setCedantMorale({...cedantMorale, formeJuridique: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SAS">SAS</SelectItem>
                            <SelectItem value="SASU">SASU</SelectItem>
                            <SelectItem value="SARL">SARL</SelectItem>
                            <SelectItem value="EURL">EURL</SelectItem>
                            <SelectItem value="SA">SA</SelectItem>
                            <SelectItem value="SCI">SCI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du siege social *</label>
                      <Input
                        placeholder="Numero et rue"
                        value={cedantMorale.siegeAdresse}
                        onChange={(e) => setCedantMorale({...cedantMorale, siegeAdresse: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                        <Input
                          placeholder="75001"
                          value={cedantMorale.siegeCP}
                          onChange={(e) => setCedantMorale({...cedantMorale, siegeCP: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                        <Input
                          placeholder="Paris"
                          value={cedantMorale.siegeVille}
                          onChange={(e) => setCedantMorale({...cedantMorale, siegeVille: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <Input
                          value={cedantMorale.siegePays}
                          onChange={(e) => setCedantMorale({...cedantMorale, siegePays: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capital social (euros) *</label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={cedantMorale.capital}
                          onChange={(e) => setCedantMorale({...cedantMorale, capital: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero SIREN *</label>
                        <Input
                          placeholder="123 456 789"
                          value={cedantMorale.rcsNumero}
                          onChange={(e) => setCedantMorale({...cedantMorale, rcsNumero: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-[#1E3A8A] mb-3">Representant legal</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Civilite</label>
                          <Select value={cedantMorale.representantCivilite} onValueChange={(v) => setCedantMorale({...cedantMorale, representantCivilite: v as "M." | "Mme"})}>
                            <SelectTrigger>
                              <SelectValue placeholder="--" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.">M.</SelectItem>
                              <SelectItem value="Mme">Mme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                          <Input
                            placeholder="Nom"
                            value={cedantMorale.representantNom}
                            onChange={(e) => setCedantMorale({...cedantMorale, representantNom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                          <Input
                            placeholder="Prenom"
                            value={cedantMorale.representantPrenom}
                            onChange={(e) => setCedantMorale({...cedantMorale, representantPrenom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qualite *</label>
                          <Input
                            placeholder="President"
                            value={cedantMorale.representantQualite}
                            onChange={(e) => setCedantMorale({...cedantMorale, representantQualite: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de {typeCession === "actions" ? "actions" : "parts"} detenues *
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={cedantNombreParts}
                        onChange={(e) => setCedantNombreParts(e.target.value)}
                      />
                    </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
          {/* STEP 6: Informations cessionnaire */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Informations cessionnaire</h1>
                <p className="text-gray-600">Renseignez les coordonnees de l&apos;acheteur</p>
              </div>
              {cessionnaireType === "physique" && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                  <h3 className="font-semibold text-[#1E3A8A] flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations personnelles du cessionnaire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civilité *</label>
                      <Select value={cessionnairePhysique.civilite} onValueChange={(v) => setCessionnairePhysique({...cessionnairePhysique, civilite: v as "M." | "Mme"})}>
                        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M.">M.</SelectItem>
                          <SelectItem value="Mme">Mme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <Input placeholder="Nom" value={cessionnairePhysique.nom} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, nom: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        <Input placeholder="Prénom" value={cessionnairePhysique.prenom} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, prenom: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                      <Input type="date" value={cessionnairePhysique.dateNaissance} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, dateNaissance: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                      <Input placeholder="Paris" value={cessionnairePhysique.lieuNaissance} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, lieuNaissance: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationalité</label>
                      <Input placeholder="française" value={cessionnairePhysique.nationalite} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, nationalite: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" placeholder="prenom@email.com" value={cessionnairePhysique.email} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, email: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <Input placeholder="12 rue de la Paix" value={cessionnairePhysique.adresse} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, adresse: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                      <Input placeholder="75001" value={cessionnairePhysique.codePostal} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, codePostal: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                      <Input placeholder="Paris" value={cessionnairePhysique.ville} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, ville: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                      <Input placeholder="France" value={cessionnairePhysique.pays} onChange={(e) => setCessionnairePhysique({...cessionnairePhysique, pays: e.target.value})} />
                    </div>
                  </div>
                  {/* Regime matrimonial */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium text-[#1E3A8A]">Régime matrimonial *</h4>
                      <TooltipHelp title={TOOLTIPS.regimeMatrimonial.title} content={TOOLTIPS.regimeMatrimonial.content} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setCessionnaireRegimeMatrimonial("communaute")}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all text-sm",
                          cessionnaireRegimeMatrimonial === "communaute"
                            ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                            : "border-gray-200 hover:border-[#1E3A8A]/50"
                        )}
                      >
                        Communauté de biens
                      </button>
                      <button
                        onClick={() => setCessionnaireRegimeMatrimonial("separation")}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all text-sm",
                          cessionnaireRegimeMatrimonial === "separation"
                            ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                            : "border-gray-200 hover:border-[#1E3A8A]/50"
                        )}
                      >
                        Séparation de biens
                      </button>
                      <button
                        onClick={() => setCessionnaireRegimeMatrimonial("celibataire")}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all text-sm",
                          cessionnaireRegimeMatrimonial === "celibataire"
                            ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                            : "border-gray-200 hover:border-[#1E3A8A]/50"
                        )}
                      >
                        Ni marié ni pacsé
                      </button>
                    </div>
                    {cessionnaireRegimeMatrimonial === "communaute" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4"
                      >
                        {/* Biens communs ou biens propres / remploi ? */}
                        <div>
                          <p className="text-sm font-medium text-amber-800 mb-2">L&apos;acquisition est financée par :</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setCessionnaireAchatBiensPropres(false)}
                              className={cn(
                                "p-3 rounded-lg border-2 text-center transition-all text-sm",
                                cessionnaireAchatBiensPropres === false
                                  ? "border-amber-600 bg-amber-100"
                                  : "border-amber-300 hover:border-amber-500"
                              )}
                            >
                              Biens communs
                            </button>
                            <button
                              onClick={() => setCessionnaireAchatBiensPropres(true)}
                              className={cn(
                                "p-3 rounded-lg border-2 text-center transition-all text-sm",
                                cessionnaireAchatBiensPropres === true
                                  ? "border-amber-600 bg-amber-100"
                                  : "border-amber-300 hover:border-amber-500"
                              )}
                            >
                              Biens propres / remploi
                            </button>
                          </div>
                        </div>

                        {/* Biens communs → conjoint intervient */}
                        {cessionnaireAchatBiensPropres === false && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2"
                          >
                            <p className="text-sm text-amber-800">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Le conjoint doit intervenir à l&apos;acte
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-amber-800 mb-1">Civilité *</label>
                                <Select value={cessionnaireConjointCivilite} onValueChange={(v) => setCessionnaireConjointCivilite(v as "M." | "Mme")}>
                                  <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="M.">M.</SelectItem>
                                    <SelectItem value="Mme">Mme</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-amber-800 mb-1">Nom *</label>
                                <Input
                                  placeholder="Nom"
                                  value={cessionnaireConjointNom}
                                  onChange={(e) => setCessionnaireConjointNom(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-amber-800 mb-1">Prénom *</label>
                                <Input
                                  placeholder="Prénom"
                                  value={cessionnaireConjointPrenom}
                                  onChange={(e) => setCessionnaireConjointPrenom(e.target.value)}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Biens propres / remploi → pas d'intervention */}
                        {cessionnaireAchatBiensPropres === true && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                          >
                            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                              Le conjoint n&apos;intervient pas à l&apos;acte. Une déclaration de remploi / emploi de biens propres sera insérée dans l&apos;acte.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
              {cessionnaireType === "morale" && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                  <h3 className="font-semibold text-[#1E3A8A]">Recherche SIREN cessionnaire</h3>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                    <Input
                      placeholder="Entrez le SIREN ou nom de la societe"
                      value={cessionnaireSirenSearch}
                      onChange={(e) => {
                        setCessionnaireSirenSearch(e.target.value);
                        setShowCessionnaireResults(false);
                        setCessionnaireSearchResults([]);
                      }}
                    />
                    {showCessionnaireResults && cessionnaireSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {cessionnaireSearchResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                            onClick={async () => {
                              setCessionnaireSirenLoading(true);
                              setShowCessionnaireResults(false);
                              try {
                                const response = await fetch(`/api/siren?siren=${result.siren}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  const dir0 = data.dirigeants?.[0];
                                  setCessionnaireMorale({
                                    ...cessionnaireMorale,
                                    denomination: data.denominationSociale || result.nom,
                                    formeJuridique: data.formeJuridique?.toUpperCase() || "",
                                    siegeAdresse: data.siegeSocial || "",
                                    siegeCP: data.codePostal || "",
                                    siegeVille: data.ville || result.ville || "",
                                    capital: data.capitalSocial || "",
                                    rcsNumero: result.siren,
                                    rcsVille: data.ville || result.ville || "",
                                    representantNom: dir0?.nom || "",
                                    representantPrenom: dir0?.prenom || "",
                                    representantQualite: dir0?.qualite || "",
                                  });
                                  setCessionnaireSirenFound(true);
                                  setCessionnaireSirenSearch(result.nom);
                                }
                              } catch {
                                setCessionnaireMorale({...cessionnaireMorale, denomination: result.nom, rcsNumero: result.siren, siegeVille: result.ville || ""});
                                setCessionnaireSirenFound(true);
                              } finally {
                                setCessionnaireSirenLoading(false);
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{result.nom}</div>
                              {result.ville && <div className="text-sm text-gray-500">{result.ville}</div>}
                            </div>
                            <div className="text-sm text-blue-600 font-mono">{result.siren}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    </div>
                    <Button
                      onClick={async () => {
                              if (!cessionnaireSirenSearch.trim()) {
                                alert("Veuillez entrer un SIREN ou un nom de société");
                                return;
                              }
                              setCessionnaireSirenLoading(true);
                              setCessionnaireSearchResults([]);
                              setShowCessionnaireResults(false);
                              try {
                                const cleanValue = cessionnaireSirenSearch.replace(/\s/g, "");
                                const isSiren = /^\d{9}$/.test(cleanValue);
                                
                                if (isSiren) {
                                  const response = await fetch(`/api/siren?siren=${cleanValue}`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    const dir0 = data.dirigeants?.[0];
                                    setCessionnaireMorale({
                                      ...cessionnaireMorale,
                                      denomination: data.denominationSociale || "",
                                      formeJuridique: data.formeJuridique?.toUpperCase() || "",
                                      siegeAdresse: data.siegeSocial || "",
                                      siegeCP: data.codePostal || "",
                                      siegeVille: data.ville || "",
                                      capital: data.capitalSocial || "",
                                      rcsNumero: cleanValue,
                                      rcsVille: data.ville || "",
                                      representantNom: dir0?.nom || "",
                                      representantPrenom: dir0?.prenom || "",
                                      representantQualite: dir0?.qualite || "",
                                    });
                                    setCessionnaireSirenFound(true);
                                  } else {
                                    alert("SIREN non trouvé");
                                  }
                                } else {
                                  const response = await fetch(`/api/siren?nom=${encodeURIComponent(cessionnaireSirenSearch)}&list=true`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    if (data.resultats && data.resultats.length > 0) {
                                      setCessionnaireSearchResults(data.resultats);
                                      setShowCessionnaireResults(true);
                                    } else {
                                      alert("Aucune société trouvée");
                                    }
                                  } else {
                                    alert("Aucune société trouvée");
                                  }
                                }
                              } catch {
                                alert("Erreur lors de la recherche");
                              }
                              setCessionnaireSirenLoading(false);
                            }}
                            disabled={!cessionnaireSirenSearch.trim() || cessionnaireSirenLoading}
                            className="bg-[#5D9CEC] hover:bg-[#4A89DC]"
                          >
                            {cessionnaireSirenLoading ? "Recherche..." : "Rechercher"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Recherchez par SIREN (9 chiffres) ou par nom de société
                        </p>
                      </div>
                    )}
                    {(cessionnaireSirenFound || cessionnaireMorale.rcsNumero) && (
                      <>
                    {/* Bouton pour refaire une recherche */}
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        className="text-sm text-[#5D9CEC] hover:underline"
                        onClick={() => {
                          setCessionnaireSirenFound(false);
                          setCessionnaireSirenSearch("");
                          setCessionnaireMorale({
                            denomination: "",
                            formeJuridique: "",
                            siegeAdresse: "",
                            siegeCP: "",
                            siegeVille: "",
                            siegePays: "France",
                            capital: "",
                            rcsNumero: "",
                            rcsVille: "",
                            representantCivilite: "",
                            representantNom: "",
                            representantPrenom: "",
                            representantQualite: "",
                            email: "",
                          });
                        }}
                      >
                        Rechercher une autre societe
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Denomination sociale *</label>
                        <Input
                          value={cessionnaireMorale.denomination}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, denomination: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique *</label>
                        <Input
                          value={cessionnaireMorale.formeJuridique}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, formeJuridique: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du siege *</label>
                      <Input
                        value={cessionnaireMorale.siegeAdresse}
                        disabled={cessionnaireSirenFound}
                        className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                        onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, siegeAdresse: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                        <Input
                          value={cessionnaireMorale.siegeCP}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, siegeCP: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                        <Input
                          value={cessionnaireMorale.siegeVille}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, siegeVille: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                        <Input
                          value={cessionnaireMorale.siegePays}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, siegePays: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capital social (euros) *</label>
                        <Input
                          type="number"
                          value={cessionnaireMorale.capital}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, capital: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero SIREN *</label>
                        <Input
                          value={cessionnaireMorale.rcsNumero}
                          disabled={cessionnaireSirenFound}
                          className={cessionnaireSirenFound ? "bg-gray-100" : ""}
                          onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, rcsNumero: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-[#1E3A8A] mb-3">Représentant légal</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
                          <Select value={cessionnaireMorale.representantCivilite} onValueChange={(v) => setCessionnaireMorale({...cessionnaireMorale, representantCivilite: v as "M." | "Mme"})}>
                            <SelectTrigger>
                              <SelectValue placeholder="--" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.">M.</SelectItem>
                              <SelectItem value="Mme">Mme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                          <Input
                            placeholder="Nom"
                            value={cessionnaireMorale.representantNom}
                            onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, representantNom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                          <Input
                            placeholder="Prénom"
                            value={cessionnaireMorale.representantPrenom}
                            onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, representantPrenom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qualité *</label>
                          <Input
                            placeholder="Gérant"
                            value={cessionnaireMorale.representantQualite}
                            onChange={(e) => setCessionnaireMorale({...cessionnaireMorale, representantQualite: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    </>
                    )}
                {/* Dépliant Expert-Comptable */}
                <div className="mt-6">
                  <ExpertComptableInfo typeCession={typeCession === "actions" ? "actions" : "parts"} />
                </div>
            </motion.div>
          )}
          {/* STEP 7: Conditions de cession */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Conditions de la cession</h1>
                <p className="text-gray-600">Définissez les termes financiers de la transaction</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de {typeCession === "actions" ? "actions" : "parts"} cedees *
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={nombrePartsCedees}
                      onChange={(e) => setNombrePartsCedees(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Prix unitaire (euros) *
                      </label>
                      <TooltipHelp title={TOOLTIPS.prixParPart.title} content={TOOLTIPS.prixParPart.content} />
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      value={prixParPart}
                      onChange={(e) => {
                        setPrixParPart(e.target.value);
                        if (nombrePartsCedees && e.target.value) {
                          setPrixTotal((parseFloat(nombrePartsCedees) * parseFloat(e.target.value)).toFixed(2));
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Numérotation des parts (pour usufruit/nue-propriété) */}
                {(typePropriete === "usufruit" || typePropriete === "nue-propriete") && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-[#1E3A8A] mb-3">
                      Numérotation des {typeCession === "actions" ? "actions" : "parts"} cédées *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Du numéro</label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={numeroPartsDe}
                          onChange={(e) => setNumeroPartsDe(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Au numéro</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={numeroPartsA}
                          onChange={(e) => setNumeroPartsA(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      <Info className="w-3 h-3 inline mr-1" />
                      Indiquez la numérotation des {typeCession === "actions" ? "actions" : "parts"} pour le démembrement ({typePropriete === "usufruit" ? "usufruit" : "nue-propriété"})
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix total (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={prixTotal}
                    onChange={(e) => setPrixTotal(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-[#1E3A8A] mb-3">Mode de paiement *</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setModePaiement("comptant")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        modePaiement === "comptant"
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      <span className="font-semibold text-[#1E3A8A] block">Comptant</span>
                      <span className="text-xs text-gray-500">Paiement intégral à la signature</span>
                    </button>
                    <button
                      onClick={() => setModePaiement("echeances")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        modePaiement === "echeances"
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      <span className="font-semibold text-[#1E3A8A] block">Échéances</span>
                      <span className="text-xs text-gray-500">Paiement en plusieurs fois</span>
                    </button>
                  </div>
                  {modePaiement === "echeances" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 space-y-3"
                    >
                      {echeances.map((echeance, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                          <span className="text-sm font-medium text-gray-500 w-20">Echeance {index + 1}</span>
                          <Input
                            type="number"
                            placeholder="Montant (Euros)"
                            value={echeance.montant}
                            onChange={(e) => updateEcheance(index, "montant", e.target.value)}
                            className="flex-1 min-w-[120px]"
                          />
                          <Input
                            type="date"
                            value={echeance.date}
                            onChange={(e) => updateEcheance(index, "date", e.target.value)}
                            className="flex-1 min-w-[140px]"
                          />
                          <Select
                            value={echeance.modePaiement || "virement"}
                            onValueChange={(value) => updateEcheance(index, "modePaiement", value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="virement">Virement</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          {echeances.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEcheance(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addEcheance}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une échéance
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              {/* Simulateur droits d'enregistrement */}
              {prixTotal && (
                <SimulateurDroits
                  typeCession={typeCession}
                  prixTotal={prixTotal}
                  nombrePartsCedees={nombrePartsCedees}
                  nombrePartsTotal={societe.nombreTotalParts || "1"}
                />
              )}
            </motion.div>
          )}
          {/* STEP 8: Clauses & Options */}
          {step === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Clauses et options</h1>
                <p className="text-gray-600">Personnalisez votre acte de cession</p>
              </div>
              {/* Agrement */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1E3A8A]">Agrement de la cession</h3>
                  <TooltipHelp title={TOOLTIPS.agrement.title} content={TOOLTIPS.agrement.content} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Structure de l&apos;actionnariat *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setAssocieUnique(true)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all text-sm",
                        associeUnique === true
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      Associé unique
                    </button>
                    <button
                      onClick={() => setAssocieUnique(false)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all text-sm",
                        associeUnique === false
                          ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                          : "border-gray-200 hover:border-[#1E3A8A]/50"
                      )}
                    >
                      Plusieurs associés
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de la délibération d&apos;agrément *</label>
                  <Input
                    type="date"
                    value={dateDeliberation}
                    onChange={(e) => setDateDeliberation(e.target.value)}
                  />
                </div>
              </div>
{/* Clauses de non-concurrence */}
  <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
  <div className="flex items-center gap-2">
    <h3 className="font-semibold text-[#1E3A8A]">Clauses de non-concurrence</h3>
    <TooltipHelp title={TOOLTIPS.nonConcurrence.title} content={TOOLTIPS.nonConcurrence.content} />
  </div>
                
                {/* Vendeur */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ncv"
                    checked={clauseNonConcurrenceVendeur}
                    onCheckedChange={(checked) => setClauseNonConcurrenceVendeur(checked === true)}
                  />
                  <label htmlFor="ncv" className="text-sm text-gray-700 cursor-pointer">
                    Clause de non-concurrence pour le <strong>vendeur</strong>
                  </label>
                </div>
                {clauseNonConcurrenceVendeur && (
                  <div className="ml-0 sm:ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone géographique</label>
                      <Input
                        placeholder="Ex: France métropolitaine"
                        value={clauseNCVZone}
                        onChange={(e) => setClauseNCVZone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                      <Input
                        placeholder="Ex: 2 ans"
                        value={clauseNCVDuree}
                        onChange={(e) => setClauseNCVDuree(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {/* Acheteur */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="nca"
                    checked={clauseNonConcurrenceAcheteur}
                    onCheckedChange={(checked) => setClauseNonConcurrenceAcheteur(checked === true)}
                  />
                  <label htmlFor="nca" className="text-sm text-gray-700 cursor-pointer">
                    Clause de non-concurrence pour l&apos;<strong>acheteur</strong>
                  </label>
                </div>
                {clauseNonConcurrenceAcheteur && (
                  <div className="ml-0 sm:ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone géographique</label>
                      <Input
                        placeholder="Ex: Île-de-France"
                        value={clauseNCAZone}
                        onChange={(e) => setClauseNCAZone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                      <Input
                        placeholder="Ex: 3 ans"
                        value={clauseNCADuree}
                        onChange={(e) => setClauseNCADuree(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
{/* Comptes courants */}
  <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
  <div className="flex items-center gap-2">
    <h3 className="font-semibold text-[#1E3A8A]">Comptes courants d&apos;associes *</h3>
    <TooltipHelp title={TOOLTIPS.comptesCourants.title} content={TOOLTIPS.comptesCourants.content} />
  </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setComptesCourants("aucun")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all text-sm",
                      comptesCourants === "aucun"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    Pas de compte courant
                  </button>
                  <button
                    onClick={() => setComptesCourants("cede")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all text-sm",
                      comptesCourants === "cede"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    Cédé au cessionnaire
                  </button>
                  <button
                    onClick={() => setComptesCourants("conserve")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all text-sm",
                      comptesCourants === "conserve"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    Conservé par le cédant
                  </button>
                </div>
              </div>
              {/* Garantie actif/passif */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="garantie"
                    checked={garantieActifPassif}
                    onCheckedChange={(checked) => setGarantieActifPassif(checked === true)}
                  />
<label htmlFor="garantie" className="font-semibold text-[#1E3A8A] cursor-pointer">
  Garantie d&apos;actif et de passif
  </label>
  <TooltipHelp title={TOOLTIPS.garantieActifPassif.title} content={TOOLTIPS.garantieActifPassif.content} />
  </div>
                
                {garantieActifPassif && (
                  <div className="ml-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seuil de déclenchement (€)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 5000"
                          value={garantieSeuilDeclenchement}
                          onChange={(e) => setGarantieSeuilDeclenchement(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant maximum (€)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 50000"
                          value={garantieMontantMax}
                          onChange={(e) => setGarantieMontantMax(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durée (années)</label>
                        <Input
                          placeholder="Ex: 3"
                          value={garantieDuree}
                          onChange={(e) => setGarantieDuree(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de notification du cédant</label>
                      <Input
                        placeholder="Adresse complète"
                        value={garantieAdresse}
                        onChange={(e) => setGarantieAdresse(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email de notification</label>
                      <Input
                        type="email"
                        placeholder="email@exemple.com"
                        value={garantieEmail}
                        onChange={(e) => setGarantieEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
{/* Frais */}
  <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
  <div className="flex items-center gap-2">
    <h3 className="font-semibold text-[#1E3A8A]">Frais de la cession *</h3>
    <TooltipHelp title={TOOLTIPS.fraisCharge.title} content={TOOLTIPS.fraisCharge.content} />
  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setFraisACharge("cessionnaire")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all text-sm",
                      fraisACharge === "cessionnaire"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    �� la charge du cessionnaire (acheteur)
                  </button>
                  <button
                    onClick={() => setFraisACharge("cedant")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all text-sm",
                      fraisACharge === "cedant"
                        ? "border-[#1E3A8A] bg-[#5D9CEC]/10"
                        : "border-gray-200 hover:border-[#1E3A8A]/50"
                    )}
                  >
                    À la charge du cédant (vendeur)
                  </button>
                </div>
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="jouissance"
                    checked={droitJouissanceImmeubles}
                    onCheckedChange={(checked) => setDroitJouissanceImmeubles(checked === true)}
                  />
                  <label htmlFor="jouissance" className="text-sm text-gray-700 cursor-pointer">
                    Les participations cedees conferent un droit a la jouissance d&apos;immeubles (art. 728 CGI)
                  </label>
                </div>
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="modifValeurNominale"
                    checked={modificationValeurNominale}
                    onCheckedChange={(checked) => setModificationValeurNominale(checked === true)}
                  />
                  <label htmlFor="modifValeurNominale" className="text-sm text-gray-700 cursor-pointer">
                    Modification de la valeur nominale des parts/actions
                  </label>
                </div>
              </div>
              {/* Mandataire des formalites */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                <h3 className="font-semibold text-[#1E3A8A]">Mandataire pour les formalites</h3>
                <p className="text-sm text-gray-600">
                  Le mandataire sera charge d&apos;accomplir les formalites legales (enregistrement, depot au greffe, etc.)
                </p>
                <Input
                  placeholder="Nom et adresse du mandataire"
                  value={mandataireFormalities}
                  onChange={(e) => setMandataireFormalities(e.target.value)}
                />
              </div>
            </motion.div>
          )}
          {/* STEP 8bis: Changement de dirigeant (optionnel) */}
          {includChangementDirigeant && step === 8.5 && (
            <motion.div
              key="step8bis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Changement de dirigeant</h1>
                <p className="text-gray-600">Informations du nouveau dirigeant</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
                <h3 className="font-semibold text-[#1E3A8A] mb-4">Nouveau dirigeant</h3>
                
                {/* Type de dirigeant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de nouveau dirigeant *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="nouveauDirigeantType"
                        checked={nouveauDirigeantType === "physique"}
                        onChange={() => setNouveauDirigeantType("physique")}
                        className="w-4 h-4 text-[#1E3A8A]"
                      />
                      <span>Personne physique</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="nouveauDirigeantType"
                        checked={nouveauDirigeantType === "morale"}
                        onChange={() => setNouveauDirigeantType("morale")}
                        className="w-4 h-4 text-[#1E3A8A]"
                      />
                      <span>Personne morale</span>
                    </label>
                  </div>
                </div>
                {/* ═══════════ PERSONNE PHYSIQUE ═══════════ */}
                {nouveauDirigeantType === "physique" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Civilite *</label>
                        <Select value={nouveauDirigeantPhysique.civilite} onValueChange={(v) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, civilite: v as "M." | "Mme"})}>
                          <SelectTrigger>
                            <SelectValue placeholder="--" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M.">M.</SelectItem>
                            <SelectItem value="Mme">Mme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <Input
                          placeholder="Nom"
                          value={nouveauDirigeantPhysique.nom}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, nom: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                        <Input
                          placeholder="Prenom"
                          value={nouveauDirigeantPhysique.prenom}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, prenom: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualité *</label>
                        <Select value={nouveauDirigeantQualite} onValueChange={setNouveauDirigeantQualite}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            {["SAS", "SASU"].includes(societe.formeJuridique) ? (
                              <>
                                <SelectItem value="Président">Président</SelectItem>
                                <SelectItem value="Directeur Général">Directeur Général</SelectItem>
                              </>
                            ) : societe.formeJuridique === "SA" ? (
                              <>
                                <SelectItem value="Président du CA">Président du CA</SelectItem>
                                <SelectItem value="Directeur Général">Directeur Général</SelectItem>
                                <SelectItem value="Directeur Général Délégué">Directeur Général Délégué</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Gérant">Gérant</SelectItem>
                                <SelectItem value="Co-Gérant">Co-Gérant</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                        <Input
                          type="date"
                          value={nouveauDirigeantPhysique.dateNaissance}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, dateNaissance: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance *</label>
                        <Input
                          placeholder="Paris (75)"
                          value={nouveauDirigeantPhysique.lieuNaissance}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, lieuNaissance: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationalite *</label>
                        <Input
                          placeholder="Francaise"
                          value={nouveauDirigeantPhysique.nationalite}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, nationalite: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                      <Input
                        placeholder="Numero, rue"
                        value={nouveauDirigeantPhysique.adresse}
                        onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, adresse: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                        <Input
                          placeholder="75008"
                          value={nouveauDirigeantPhysique.codePostal}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, codePostal: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                        <Input
                          placeholder="Paris"
                          value={nouveauDirigeantPhysique.ville}
                          onChange={(e) => setNouveauDirigeantPhysique({...nouveauDirigeantPhysique, ville: e.target.value})}
                        />
                      </div>
                    </div>
                    {/* FILIATION */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-[#1E3A8A] mb-4">Filiation (obligatoire pour le greffe)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du pere *</label>
                          <Input
                            placeholder="Nom du pere"
                            value={nouveauDirigeantPereNom}
                            onChange={(e) => setNouveauDirigeantPereNom(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prenom du pere *</label>
                          <Input
                            placeholder="Prenom du pere"
                            value={nouveauDirigeantPerePrenom}
                            onChange={(e) => setNouveauDirigeantPerePrenom(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de naissance de la mere *</label>
                          <Input
                            placeholder="Nom de naissance"
                            value={nouveauDirigeantMereNom}
                            onChange={(e) => setNouveauDirigeantMereNom(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prenom de la mere *</label>
                          <Input
                            placeholder="Prenom de la mere"
                            value={nouveauDirigeantMerePrenom}
                            onChange={(e) => setNouveauDirigeantMerePrenom(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    {/* DECLARATION NON-CONDAMNATION */}
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={nouveauDirigeantNonCondamnation}
                          onChange={(e) => setNouveauDirigeantNonCondamnation(e.target.checked)}
                          className="w-5 h-5 mt-0.5 text-[#1E3A8A] rounded"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Declaration de non-condamnation *</span>
                          <p className="text-sm text-gray-600 mt-1">
                            Je declare sur l&apos;honneur n&apos;avoir fait l&apos;objet d&apos;aucune condamnation penale ni de sanction civile ou administrative de nature a m&apos;interdire de gerer, administrer ou diriger une personne morale (art. A 123-51 du Code de commerce).
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                {/* ═══════════ PERSONNE MORALE ═══════════ */}
                {nouveauDirigeantType === "morale" && (
                  <div className="space-y-6">
                    {/* Infos personne morale */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                      <h4 className="font-semibold text-[#1E3A8A]">Personne morale dirigeante</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Denomination *</label>
                          <Input
                            placeholder="SOCIETE XYZ"
                            value={nouveauDirigeantMorale.denomination}
                            onChange={(e) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, denomination: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique *</label>
                          <Select value={nouveauDirigeantMorale.formeJuridique} onValueChange={(v) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, formeJuridique: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SAS">SAS</SelectItem>
                              <SelectItem value="SASU">SASU</SelectItem>
                              <SelectItem value="SARL">SARL</SelectItem>
                              <SelectItem value="EURL">EURL</SelectItem>
                              <SelectItem value="SA">SA</SelectItem>
                              <SelectItem value="SCI">SCI</SelectItem>
                              <SelectItem value="SNC">SNC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SIREN *</label>
                        <Input
                          placeholder="123 456 789"
                          value={nouveauDirigeantMorale.siren}
                          onChange={(e) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, siren: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du siege *</label>
                        <Input
                          placeholder="Numero, rue"
                          value={nouveauDirigeantMorale.siegeAdresse}
                          onChange={(e) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, siegeAdresse: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                          <Input
                            placeholder="75008"
                            value={nouveauDirigeantMorale.siegeCP}
                            onChange={(e) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, siegeCP: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                          <Input
                            placeholder="Paris"
                            value={nouveauDirigeantMorale.siegeVille}
                            onChange={(e) => setNouveauDirigeantMorale({...nouveauDirigeantMorale, siegeVille: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualite *</label>
                        <Select value={nouveauDirigeantQualite} onValueChange={setNouveauDirigeantQualite}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gerant">Gerant</SelectItem>
                            <SelectItem value="President">President</SelectItem>
                            <SelectItem value="Directeur General">Directeur General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Representant permanent */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                      <h4 className="font-semibold text-[#1E3A8A]">Representant permanent</h4>
                      <p className="text-sm text-gray-600">La personne physique qui represente la personne morale dirigeante</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Civilite *</label>
                          <Select value={representantPermanent.civilite} onValueChange={(v) => setRepresentantPermanent({...representantPermanent, civilite: v as "M." | "Mme"})}>
                            <SelectTrigger>
                              <SelectValue placeholder="--" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M.">M.</SelectItem>
                              <SelectItem value="Mme">Mme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                          <Input
                            placeholder="Nom"
                            value={representantPermanent.nom}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, nom: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                          <Input
                            placeholder="Prenom"
                            value={representantPermanent.prenom}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, prenom: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                          <Input
                            type="date"
                            value={representantPermanent.dateNaissance}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, dateNaissance: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance *</label>
                          <Input
                            placeholder="Paris (75)"
                            value={representantPermanent.lieuNaissance}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, lieuNaissance: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nationalite *</label>
                          <Input
                            placeholder="Francaise"
                            value={representantPermanent.nationalite}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, nationalite: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                        <Input
                          placeholder="Numero, rue"
                          value={representantPermanent.adresse}
                          onChange={(e) => setRepresentantPermanent({...representantPermanent, adresse: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                          <Input
                            placeholder="75008"
                            value={representantPermanent.codePostal}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, codePostal: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                          <Input
                            placeholder="Paris"
                            value={representantPermanent.ville}
                            onChange={(e) => setRepresentantPermanent({...representantPermanent, ville: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      {/* Filiation RP */}
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h5 className="font-medium text-gray-700 mb-3">Filiation du representant permanent</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du pere *</label>
                            <Input
                              placeholder="Nom du pere"
                              value={representantPermanentPereNom}
                              onChange={(e) => setRepresentantPermanentPereNom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prenom du pere *</label>
                            <Input
                              placeholder="Prenom du pere"
                              value={representantPermanentPerePrenom}
                              onChange={(e) => setRepresentantPermanentPerePrenom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de naissance de la mere *</label>
                            <Input
                              placeholder="Nom de naissance"
                              value={representantPermanentMereNom}
                              onChange={(e) => setRepresentantPermanentMereNom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prenom de la mere *</label>
                            <Input
                              placeholder="Prenom de la mere"
                              value={representantPermanentMerePrenom}
                              onChange={(e) => setRepresentantPermanentMerePrenom(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Declaration non-condamnation RP */}
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={representantPermanentNonCondamnation}
                            onChange={(e) => setRepresentantPermanentNonCondamnation(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-[#1E3A8A] rounded"
                          />
                          <div>
                            <span className="font-medium text-gray-900">Declaration de non-condamnation *</span>
                            <p className="text-sm text-gray-600 mt-1">
                              Je declare sur l&apos;honneur n&apos;avoir fait l&apos;objet d&apos;aucune condamnation penale ni de sanction civile ou administrative de nature a m&apos;interdire de gerer, administrer ou diriger une personne morale.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* STEP 9: Récapitulatif */}
          {step === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Récapitulatif</h1>
                <p className="text-gray-600">Vérifiez les informations avant de générer votre document</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
                {/* Type de cession */}
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Type de cession</h3>
                  <p className="text-sm">
                    Cession de <strong>{typeCession === "actions" ? "actions" : "parts sociales"}</strong> en <strong>{typePropriete === "pleine-propriete" ? "pleine propriété" : typePropriete}</strong>
                  </p>
                </div>
                {/* Société */}
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Société concernée</h3>
                  <p className="text-sm"><strong>{societe.denomination}</strong> ({societe.formeJuridique})</p>
                  <p className="text-sm text-gray-600">{societe.siegeAdresse}, {societe.siegeCP} {societe.siegeVille}</p>
                  <p className="text-sm text-gray-600">RCS {societe.rcsVille} {societe.rcsNumero} - Capital : {societe.capital}€</p>
                </div>
                {/* Cédant */}
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Cédant (vendeur)</h3>
                  {cedantType === "physique" ? (
                    <p className="text-sm"><strong>{cedantPhysique.civilite} {cedantPhysique.prenom} {cedantPhysique.nom}</strong></p>
                  ) : (
                    <p className="text-sm"><strong>{cedantMorale.denomination}</strong> représentée par {cedantMorale.representantCivilite} {cedantMorale.representantPrenom} {cedantMorale.representantNom}</p>
                  )}
                  <p className="text-sm text-gray-600">Propriétaire de {cedantNombreParts} {typeCession === "actions" ? "actions" : "parts"}</p>
                </div>
                {/* Cessionnaire */}
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Cessionnaire (acheteur)</h3>
                  {cessionnaireType === "physique" ? (
                    <p className="text-sm"><strong>{cessionnairePhysique.civilite} {cessionnairePhysique.prenom} {cessionnairePhysique.nom}</strong></p>
                  ) : (
                    <p className="text-sm"><strong>{cessionnaireMorale.denomination}</strong> représentée par {cessionnaireMorale.representantCivilite} {cessionnaireMorale.representantPrenom} {cessionnaireMorale.representantNom}</p>
                  )}
                </div>
                {/* Conditions */}
                <div className="pb-4 border-b space-y-4">
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Conditions financières</h3>
                  <p className="text-sm"><strong>{nombrePartsCedees}</strong> {typeCession === "actions" ? "actions" : "parts"} cédées</p>
                  <p className="text-sm">Prix unitaire : <strong>{prixParPart}€</strong></p>
                  <p className="text-sm">Prix total : <strong>{prixTotal}€</strong></p>
                  <p className="text-sm">Paiement : <strong>{modePaiement === "comptant" ? "Comptant" : `En ${echeances.length} échéances`}</strong></p>
                  
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tribunal compétent *</label>
                    <Input
                      placeholder="Ex: Tribunal de Commerce de Paris"
                      value={tribunalCompetent}
                      onChange={(e) => setTribunalCompetent(e.target.value)}
                    />
                  </div>
                </div>
                {/* Options */}
                <div>
                  <h3 className="font-semibold text-[#1E3A8A] mb-2">Options</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      {clauseNonConcurrenceVendeur ? <Check className="w-4 h-4 text-green-500" /> : <span className="w-4 h-4 text-gray-300">-</span>}
                      Clause de non-concurrence vendeur
                    </li>
                    <li className="flex items-center gap-2">
                      {garantieActifPassif ? <Check className="w-4 h-4 text-green-500" /> : <span className="w-4 h-4 text-gray-300">-</span>}
                      Garantie d&apos;actif et de passif
                    </li>
                    <li className="flex items-center gap-2">
                      Frais à la charge du <strong>{fraisACharge === "cessionnaire" ? "cessionnaire" : "cédant"}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
          {/* STEP 10: Signature */}
          {step === 10 && (
            <motion.div
              key="step10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Signature</h1>
                <p className="text-gray-600">Finalisez votre acte de cession</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de signature *</label>
                    <Input
                      placeholder="Paris"
                      value={lieuSignature}
                      onChange={(e) => setLieuSignature(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de signature *</label>
                    <Input
                      type="date"
                      value={dateSignature}
                      onChange={(e) => setDateSignature(e.target.value)}
                    />
                  </div>
                </div>
  {/* Selection des documents a generer */}
  <div className="pt-4 border-t mb-6">
    <h3 className="font-semibold text-[#1E3A8A] mb-4">Documents a generer</h3>
    <div className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={generateAgrement}
          onChange={(e) => setGenerateAgrement(e.target.checked)}
          className="w-5 h-5 rounded accent-[#3B6FD9]"
        />
        <span className="text-sm">PV d&apos;agrement (autorisation de la cession)</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={generateConstatation}
          onChange={(e) => setGenerateConstatation(e.target.checked)}
          className="w-5 h-5 rounded accent-[#3B6FD9]"
        />
        <span className="text-sm">PV de constatation de la cession</span>
      </label>
      {includChangementDirigeant && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={true}
            disabled
            className="w-5 h-5 rounded accent-[#3B6FD9]"
          />
          <span className="text-sm">PV de changement de dirigeant</span>
        </label>
      )}
    </div>
  </div>
  <div className="pt-4 border-t">
  <>
    <p className="text-sm text-gray-600 mb-4">
      Générez chaque document séparément. Vous pourrez les télécharger dès qu&apos;ils sont prêts.
    </p>
    <div className="flex flex-col gap-3 mt-3">
      <Button
        onClick={() => handleGenerate("acte")}
        disabled={!lieuSignature || !dateSignature || isGeneratingActe || isGeneratingPv}
        variant="outline"
        className="w-full border-[#5D9CEC] text-[#5D9CEC] hover:bg-[#5D9CEC]/10 py-5 text-base"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGeneratingActe ? "Génération de l'acte..." : acteText ? "Regénérer l'Acte de cession" : "Générer l'Acte de cession"}
      </Button>
      <Button
        onClick={() => handleGenerate("pv")}
        disabled={!lieuSignature || !dateSignature || isGeneratingPv || isGeneratingActe || (!generateAgrement && !generateConstatation && !includChangementDirigeant)}
        variant="outline"
        className="w-full border-[#3B6FD9] text-[#3B6FD9] hover:bg-[#3B6FD9]/10 py-5 text-base"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGeneratingPv ? "Génération du PV..." : pvText ? "Regénérer le(s) PV" : "Générer le(s) PV"}
      </Button>
    </div>
  </>
  {documentGenere && (
    <>
      {previewDoc && (
        <DocumentPreviewPanel
          title={previewDoc.title}
          text={previewDoc.text}
          docxBlobUrl={previewDoc.blobUrl}
          docxFileName={previewDoc.docxFileName}
          pdfFileName={previewDoc.pdfFileName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-green-50 border border-green-200 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-800">Documents générés avec succès !</h3>
            <p className="text-sm text-green-600">Prévisualisez ou téléchargez chaque document</p>
          </div>
        </div>

        <div className="space-y-3">
          {acteBlobUrl && acteText && (() => {
            const nom = (societe.denomination || 'document').replace(/\s+/g, '-');
            return (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800 text-sm">Acte de cession</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewDoc({ title: "Acte de cession", text: acteText!, blobUrl: acteBlobUrl!, docxFileName: `Acte-Cession-${nom}.docx`, pdfFileName: `Acte-Cession-${nom}.pdf` })}>
                    <Eye className="w-3.5 h-3.5" /> Aperçu
                  </Button>
                  <a href={acteBlobUrl} download={`Acte-Cession-${nom}.docx`}>
                    <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                      <FileText className="w-3.5 h-3.5" /> Word (.docx)
                    </Button>
                  </a>
                </div>
              </div>
            );
          })()}

          {pvBlobUrl && pvText && (() => {
            const nom = (societe.denomination || 'document').replace(/\s+/g, '-');
            return (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800 text-sm">PV d&apos;assemblée</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewDoc({ title: "PV d'assemblée générale", text: pvText!, blobUrl: pvBlobUrl!, docxFileName: `PV-AG-${nom}.docx`, pdfFileName: `PV-AG-${nom}.pdf` })}>
                    <Eye className="w-3.5 h-3.5" /> Aperçu
                  </Button>
                  <a href={pvBlobUrl} download={`PV-AG-${nom}.docx`}>
                    <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                      <FileText className="w-3.5 h-3.5" /> Word (.docx)
                    </Button>
                  </a>
                </div>
              </div>
            );
          })()}

          {declarationBlobUrl && declarationText && (() => {
            const nom = (societe.denomination || 'document').replace(/\s+/g, '-');
            return (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800 text-sm">Déclaration de non-condamnation</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewDoc({ title: "Déclaration de non-condamnation", text: declarationText!, blobUrl: declarationBlobUrl!, docxFileName: `Declaration-Non-Condamnation-${nom}.docx`, pdfFileName: `Declaration-Non-Condamnation-${nom}.pdf` })}>
                    <Eye className="w-3.5 h-3.5" /> Aperçu
                  </Button>
                  <a href={declarationBlobUrl} download={`Declaration-Non-Condamnation-${nom}.docx`}>
                    <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                      <FileText className="w-3.5 h-3.5" /> Word (.docx)
                    </Button>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Mise à jour des statuts */}
          {(
            <StatutsUpdater
              cessionData={{
                nomCedant: cedantType === "physique"
                  ? `${cedantPhysique.civilite} ${cedantPhysique.nom} ${cedantPhysique.prenom}`.trim()
                  : cedantMorale.denomination,
                nomCessionnaire: cessionnaireType === "physique"
                  ? `${cessionnairePhysique.civilite} ${cessionnairePhysique.nom} ${cessionnairePhysique.prenom}`.trim()
                  : cessionnaireMorale.denomination,
                nbParts: nombrePartsCedees || "",
                prixTotal: prixTotal || "",
                date: dateSignature || "",
                ville: lieuSignature || "",
                formeJuridique: societe.formeJuridique || "",
                denomination: societe.denomination || "",
                capitalTotal: societe.capital || "",
                nbTitresTotal: societe.nombreTotalParts || "",
                includChangementDirigeant,
                nouveauDirigeantCivilite: nouveauDirigeantPhysique.civilite,
                nouveauDirigeantNom: nouveauDirigeantPhysique.nom,
                nouveauDirigeantPrenom: nouveauDirigeantPhysique.prenom,
                nouveauDirigeantFonction: nouveauDirigeantQualite,
                ancienDirigeantNom: cedantType === "physique"
                  ? `${cedantPhysique.civilite} ${cedantPhysique.nom} ${cedantPhysique.prenom}`.trim()
                  : cedantMorale.denomination,
              }}
            />
          )}

          {selectedFormule === "premium" && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
              <p className="text-sm text-blue-800">
                <Info className="w-4 h-4 inline mr-1" />
                Formule Premium : Un juriste verifiera votre dossier sous 24h.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )}
  </div>
              </div>
            </motion.div>
          )}
          {/* STEP 11: Pièces justificatives & Dépôt INPI */}
          {step === 11 && (
            <motion.div
              key="step11"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Pièces justificatives & Dépôt INPI</h1>
                <p className="text-gray-600">Déposez les documents signés pour soumettre la formalité au Guichet Unique</p>
              </div>

              {/* Documents requis — dynamiques selon la situation */}
              {(() => {
                type DocItem = { key: JustifKey; label: string; desc: string };
                const mandatory: DocItem[] = [
                  { key: "acte", label: "Acte de cession signé", desc: "PDF signé par le cédant et le cessionnaire" },
                  {
                    key: "pv",
                    label: associeUnique === true ? "Décision de l'associé unique signée (DAS)" : "PV d'assemblée signé",
                    desc: associeUnique === true
                      ? "Décision unilatérale constatant la cession, signée par l'associé unique"
                      : "Procès-verbal d'agrément et de constatation signé par les associés",
                  },
                  { key: "statuts", label: "Statuts mis à jour certifiés conformes", desc: "Statuts après cession, avec mention « certifié conforme à l'original »" },
                ];
                const moraleItems: DocItem[] = [
                  ...(cedantType === "morale" ? [{ key: "kbisCedant" as const, label: "Extrait Kbis du cédant (moins de 3 mois)", desc: "Extrait K-bis de la société cédante, datant de moins de 3 mois" }] : []),
                  ...(cessionnaireType === "morale" ? [{ key: "kbisCessionnaire" as const, label: "Extrait Kbis du cessionnaire (moins de 3 mois)", desc: "Extrait K-bis de la société cessionnaire, datant de moins de 3 mois" }] : []),
                ];
                const dirigeantItems: DocItem[] = includChangementDirigeant ? [
                  { key: "identite", label: "Pièce d'identité du nouveau dirigeant", desc: "Copie CNI ou passeport en cours de validité" },
                  { key: "declaration", label: "Déclaration de non-condamnation signée", desc: "Document généré à l'étape précédente, signé à la main" },
                ] : [];

                const renderDoc = (item: DocItem) => (
                  <div key={item.key} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.label} <span className="text-red-500">*</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      {justifFiles[item.key] && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {justifFiles[item.key]!.name} ({Math.round(justifFiles[item.key]!.size / 1024)} Ko)
                        </p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJustifUpload(item.key, f); }} />
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${justifFiles[item.key] ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-[#5D9CEC] text-[#5D9CEC] bg-white hover:bg-blue-50"}`}>
                        <Upload className="w-4 h-4" />
                        {justifFiles[item.key] ? "Remplacer" : "Charger PDF"}
                      </div>
                    </label>
                  </div>
                );

                return (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
                    <h3 className="font-semibold text-[#1E3A8A] mb-1">Documents obligatoires</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      {associeUnique === true ? "Associé unique détecté — la décision remplace le PV d'assemblée." : ""}
                      {cedantType === "morale" || cessionnaireType === "morale" ? " Une ou plusieurs parties sont des personnes morales — Kbis requis." : ""}
                    </p>
                    {mandatory.map(renderDoc)}

                    {moraleItems.length > 0 && (
                      <>
                        <h3 className="font-semibold text-[#1E3A8A] mt-6 mb-2">Personnes morales — Kbis</h3>
                        {moraleItems.map(renderDoc)}
                      </>
                    )}

                    {dirigeantItems.length > 0 && (
                      <>
                        <h3 className="font-semibold text-[#1E3A8A] mt-6 mb-2">Changement de dirigeant</h3>
                        {dirigeantItems.map(renderDoc)}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Bouton soumettre INPI */}
              {(() => {
                const moraleKeys: JustifKey[] = [
                  ...(cedantType === "morale" ? ["kbisCedant" as const] : []),
                  ...(cessionnaireType === "morale" ? ["kbisCessionnaire" as const] : []),
                ];
                const requiredKeys: JustifKey[] = [
                  "acte", "pv", "statuts",
                  ...moraleKeys,
                  ...(includChangementDirigeant ? ["identite" as const, "declaration" as const] : []),
                ];
                const allUploaded = requiredKeys.every(k => !!justifFiles[k]);
                return (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-[#1E3A8A] mb-3">Soumettre au Guichet Unique INPI</h3>
                    {!allUploaded && (
                      <p className="text-sm text-amber-600 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Veuillez charger tous les documents obligatoires avant de soumettre.
                      </p>
                    )}
                    {inpiStatus === "success" && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Dossier envoyé avec succès !
                        </p>
                        {inpiDossierId && <p className="text-xs text-green-700 mt-1">N° de dossier : <strong>{inpiDossierId}</strong></p>}
                        <p className="text-xs text-green-700 mt-1">{inpiMessage}</p>
                      </div>
                    )}
                    {inpiStatus === "error" && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Erreur lors du dépôt
                        </p>
                        <p className="text-xs text-red-700 mt-1">{inpiMessage}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleInpiSubmit}
                      disabled={!allUploaded || inpiStatus === "loading" || inpiStatus === "success"}
                      className="w-full bg-[#1E3A8A] hover:bg-[#1a3278] text-white py-5 text-base gap-2"
                    >
                      {inpiStatus === "loading" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                      ) : inpiStatus === "success" ? (
                        <><Check className="w-4 h-4" /> Dossier envoyé</>
                      ) : (
                        <><Send className="w-4 h-4" /> Envoyer à l&apos;INPI</>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      La formalité sera déposée sur le Guichet Unique INPI via le compte LegalCorners.
                    </p>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1 || (step === 4 && paymentComplete)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </Button>
              {step !== 3 && step !== 11 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-2 bg-[#5D9CEC] hover:bg-[#4A8BD9] text-white"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
      
  {/* FAQ Section */}
  <section className="bg-white py-16 px-4">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] text-center mb-2">
        Les questions à se poser pour céder ses parts ou actions ?
      </h2>
      <p className="text-center text-gray-400 mb-10">
        Découvrez tout ce qu&apos;il faut savoir avant de franchir le pas
      </p>

      <div className="divide-y divide-gray-200">
        {[
          {
            q: "Parts sociales ou actions : quelle différence ?",
            a: "Les parts sociales concernent les SARL, EURL, SCI et SNC. Les actions concernent les SAS, SASU et SA. La cession d'actions est en général plus libre, tandis que les parts sociales sont plus encadrées et requièrent souvent l'accord des associés."
          },
          {
            q: "Ai-je besoin de l'accord des autres associés ?",
            a: "Pour les parts sociales (SARL, SCI…), une procédure d'agrément est généralement obligatoire si vous cédez à un tiers. Pour les actions (SAS, SA), la cession est en principe libre sauf clause contraire dans les statuts (clause d'agrément, de préemption…)."
          },
          {
            q: "Comment se déroule la procédure d'agrément ?",
            a: "Le cédant notifie son projet de cession à la société. Les associés se réunissent en assemblée générale et votent. En SARL, la majorité requise est en principe la majorité des associés représentant au moins la moitié des parts. Le silence pendant 3 mois vaut agrément."
          },
          {
            q: "Comment fixer le prix de cession ?",
            a: "Le prix est librement fixé entre les parties. Il peut être déterminé selon la valeur nominale, la valeur comptable (actif net), la valeur de rendement ou par un expert désigné. Il est recommandé de justifier le prix retenu pour éviter tout risque de requalification fiscale."
          },
          {
            q: "J'ai créé ma société avec des actions à 1 € — puis-je les vendre plus cher ?",
            a: "Oui, tout à fait. La valeur nominale d'une action ne reflète pas sa valeur réelle. Vous pouvez céder vos actions à un prix supérieur si la valeur de la société a augmenté. La différence constitue une plus-value soumise à imposition."
          },
          {
            q: "Qu'est-ce que la garantie actif-passif ?",
            a: "C'est une clause par laquelle le cédant garantit au cessionnaire que l'actif et le passif de la société sont conformes à ce qui a été présenté. Si un passif caché apparaît après la cession, le cédant devra indemniser le cessionnaire. Elle est fortement recommandée."
          },
          {
            q: "Quels droits d'enregistrement dois-je payer ?",
            a: "Pour les parts sociales (SARL, SCI) : 3 % du prix de cession après un abattement de 23 000 € (réparti au prorata). Pour les actions (SAS, SA) : 0,1 % du prix de cession, sans plafond. Ces droits sont à la charge de l'acquéreur sauf convention contraire."
          },
          {
            q: "Comment est imposée la plus-value ?",
            a: "La plus-value de cession est soumise au prélèvement forfaitaire unique (PFU) de 30 % (12,8 % d'impôt sur le revenu + 17,2 % de prélèvements sociaux). Vous pouvez opter pour le barème progressif de l'IR avec des abattements pour durée de détention dans certains cas."
          },
          {
            q: "Quels documents sont obligatoires ?",
            a: "Les documents essentiels sont : l'acte de cession (signé par les parties), le procès-verbal d'assemblée générale (agrément), le formulaire d'enregistrement aux impôts, et la mise à jour des statuts si nécessaire. Un ordre de mouvement peut aussi être requis pour les actions."
          },
          {
            q: "Faut-il déposer des documents au Greffe ?",
            a: "Oui, si la cession entraîne une modification des statuts (changement d'associé, de gérant…), il faut déposer au Greffe : les statuts mis à jour, le PV d'assemblée, et le formulaire M3. Le dépôt peut aussi se faire en ligne via le guichet unique de l'INPI."
          },
          {
            q: "Dans combien de temps la cession est-elle effective ?",
            a: "La cession est effective entre les parties dès la signature de l'acte. Elle est opposable à la société après signification (ou acceptation dans un acte authentique). Elle est opposable aux tiers après publication au RCS. Comptez généralement 2 à 4 semaines pour l'ensemble des formalités."
          },
        ].map((item, index) => (
          <Collapsible key={index}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-5 text-left">
              <span className="text-lg font-semibold text-[#1E3A8A] pr-4">{item.q}</span>
              <ChevronDown className="w-5 h-5 text-[#1E3A8A] flex-shrink-0 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-5 text-gray-600 leading-relaxed text-justify">
              {item.a}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-white border-t border-gray-100 py-4">
    <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-center gap-3 text-sm text-[#1E3A8A]/60">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span>Securise</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        <span>Rapide</span>
      </div>
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        <span>Support</span>
      </div>
    </div>
  </footer>
  </div>
  {/* Apercu PDF plein ecran */}
  {pdfBlobUrl && (
    <PdfPreviewModal
      isOpen={showPdfPreview}
      onClose={() => setShowPdfPreview(false)}
      pdfUrl={pdfBlobUrl}
      fileName={`acte-cession-${societe.denomination || 'document'}.pdf`}
    />
  )}
  </>
  );
}