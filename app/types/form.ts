export type FormeJuridique = "SARL" | "SAS" | "SASU" | "EURL" | "SA" | "SCI" | "SNC" | "Autre";
export type TypePersonne = "physique" | "morale";
export type RegimeMatrimonial = "communaute" | "separation" | "celibataire";
export type TypePaiement = "comptant" | "echelonne";
export type TypeAssemblee = "AGE" | "associe_unique" | "unanime";
export type TypeCessionTitre = "pleine_propriete" | "usufruit" | "nue_propriete";

export interface SocieteInfo {
  denomination: string;
  formeJuridique: FormeJuridique;
  capital: string;
  rcsVille: string;
  rcsNumero: string;
  adresse: string;
  nombreTitresTotal: string;
  valeurNominale: string;
  estSPI: boolean;
}

export interface PersonnePhysiqueInfo {
  civilite: "M." | "Mme";
  nom: string;
  prenom: string;
  dateNaissance: string;
  villeNaissance: string;
  nationalite: string;
  adresse: string;
  regime: RegimeMatrimonial;
  conjointCivilite?: "M." | "Mme";
  conjointNom?: string;
  conjointPrenom?: string;
  typeRegime?: "communaute de biens" | "séparation de biens";
}

export interface PersonneMoraleInfo {
  denomination: string;
  formeJuridique: string;
  capital: string;
  adresse: string;
  rcsVille: string;
  rcsNumero: string;
  representantCivilite: "M." | "Mme";
  representantNom: string;
  representantPrenom: string;
  representantQualite: string;
}

export interface CedantInfo {
  typePersonne: TypePersonne;
  physique?: PersonnePhysiqueInfo;
  morale?: PersonneMoraleInfo;
  nombreTitresCedes: string;
}

export interface CessionnaireInfo {
  typePersonne: TypePersonne;
  physique?: PersonnePhysiqueInfo;
  morale?: PersonneMoraleInfo;
  acquisitionBiens?: "propres" | "communs";
}

export interface PaiementEcheance {
  montant: string;
  date: string;
}

export interface PrixInfo {
  prixTotal: string;
  typePaiement: TypePaiement;
  echeances?: PaiementEcheance[];
}

export interface GAPInfo {
  active: boolean;
  seuilParSinistre?: string;
  seuilAnnuel?: string;
  plafond?: string;
  dureeAnnees?: string;
  escrow: boolean;
  escrowMontant?: string;
  escrowBeneficiaire?: string;
  notificationDelaiMois?: string;
  notificationAdresse?: string;
  notificationEmail?: string;
}

export interface ComptesCourantsInfo {
  option: "absent" | "cede" | "conserve";
  solde?: string;
  delaiRemboursementMois?: string;
}

export interface NonConcurrenceInfo {
  active: boolean;
  dureeAns?: string;
  zoneGeographique?: string;
  appliqueAuCessionnaire?: boolean;
  dureeAnsCessionnaire?: string;
  zoneGeoCessionnaire?: string;
}

export interface NatureCessionInfo {
  type: TypeCessionTitre;
  numeroDe?: string;
  numeroA?: string;
}

export interface PVInfo {
  typeAssemblee: TypeAssemblee;
  ville: string;
  date: string;
  heure?: string;
  convocationMode?: string;
  convocationDate?: string;
  presidentCivilite?: "M." | "Mme";
  presidentNom?: string;
  presidentPrenom?: string;
  presidentQualite?: string;
  modificationValeurNominale: boolean;
  changementDirigeant: boolean;
  ancienDirigeantCivilite?: "M." | "Mme";
  ancienDirigeantNom?: string;
  ancienDirigeantPrenom?: string;
  ancienDirigeantDateNaissance?: string;
  ancienDirigeantFonction?: string;
  // Nouveau dirigeant — type
  nouveauDirigeantTypePersonne?: "physique" | "morale";
  // Nouveau dirigeant — personne physique (repris du cessionnaire + champs déclaration)
  nouveauDirigeantCivilite?: "M." | "Mme";
  nouveauDirigeantNom?: string;
  nouveauDirigeantPrenom?: string;
  nouveauDirigeantDateNaissance?: string;
  nouveauDirigeantVilleNaissance?: string;
  nouveauDirigeantNationalite?: string;
  nouveauDirigeantAdresse?: string;
  nouveauDirigeantNomPere?: string;
  nouveauDirigeantPrenomPere?: string;
  nouveauDirigeantNomMere?: string;
  nouveauDirigeantPrenomMere?: string;
  // Nouveau dirigeant — personne morale
  nouveauDirigeantDenomination?: string;
  nouveauDirigeantFormeJuridiqueStr?: string;
  nouveauDirigeantCapitalStr?: string;
  nouveauDirigeantRCSSiege?: string;
  nouveauDirigeantRCSNum?: string;
  nouveauDirigeantSiegeSocial?: string;
  // Représentant permanent (si PM dirigeant)
  rpCivilite?: "M." | "Mme";
  rpNom?: string;
  rpPrenom?: string;
  rpDateNaissance?: string;
  rpVilleNaissance?: string;
  rpNationalite?: string;
  rpAdresse?: string;
  rpNomPere?: string;
  rpPrenomPere?: string;
  rpNomMere?: string;
  rpPrenomMere?: string;
  // Mandat
  nouveauDirigeantFonction?: string;
  dureeMandat?: "illimitée" | string;
  mandataireFormalities?: string;
  questionsEcrites: boolean;
}

export interface FormData {
  societe: Partial<SocieteInfo>;
  cedant: Partial<CedantInfo>;
  cessionnaire: Partial<CessionnaireInfo>;
  cedantIsSocieteCible?: boolean;
  cessionnaireIsSocieteCible?: boolean;
  prix: Partial<PrixInfo>;
  natureCession: Partial<NatureCessionInfo>;
  gap: Partial<GAPInfo>;
  comptesCourants: Partial<ComptesCourantsInfo>;
  nonConcurrence: Partial<NonConcurrenceInfo>;
  pv: Partial<PVInfo>;
  ville: string;
  date: string;
  fraisALaCharge: "Cessionnaire" | "Cédant";
}

export type StepId =
  | "societe"
  | "cedant"
  | "cessionnaire"
  | "prix"
  | "options"
  | "pv"
  | "recap";
