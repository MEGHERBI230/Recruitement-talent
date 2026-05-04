export type BU = "BU1" | "BU2" | "BU3" | "BU4" | "TRANSV";
export type Priority = "urgent" | "prioritaire" | "phase2" | "cible";

export const BU_LABELS: Record<BU, string> = {
  BU1: "BU1 — Tôlerie / Chaudronnerie",
  BU2: "BU2 — Élastomères / Caoutchouc",
  BU3: "BU3 — Usinage CNC & Mécanique",
  BU4: "BU4 — Fonderie Alu & Presses",
  TRANSV: "Transverse (BE / Qualité / Maintenance / HSE)",
};

export const BU_COLORS: Record<BU, string> = {
  BU1: "bg-destructive/10 text-destructive border-destructive/30",
  BU2: "bg-warning/15 text-warning border-warning/30",
  BU3: "bg-info/15 text-info border-info/30",
  BU4: "bg-accent text-accent-foreground border-primary/40",
  TRANSV: "bg-muted text-muted-foreground border-border",
};

export interface Poste {
  id: string;
  intitule: string;
  bu: BU;
  quantite: number;
  priorite: Priority;
  competences: string[];
  machines: string[];
  experienceMin: number;
  diplome: string;
}

export interface Machine {
  id: string;
  nom: string;
  marque: string;
  bu: BU;
  fonction: string;
  criticite: "haute" | "moyenne" | "basse";
  etat: "opérationnel" | "à régler" | "non exploité";
}

export type CandidatStatut =
  | "recu"
  | "analyse"
  | "preselectionne"
  | "entretien"
  | "accepte"
  | "rejete";

export interface Candidat {
  id: string;
  nom: string;
  prenom: string;
  posteVise: string;
  experience: number;
  diplome: string;
  score: number;
  statut: CandidatStatut;
  bu: BU;
}

export const POSTES: Poste[] = [
  { id: "p1", intitule: "Directeur des Opérations", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["Management", "Lean", "Multi-process"], machines: [], experienceMin: 10, diplome: "Ingénieur" },
  { id: "p2", intitule: "Planificateur production", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["Ordonnancement", "ERP"], machines: [], experienceMin: 5, diplome: "Ingénieur" },
  { id: "p3", intitule: "Chef d'atelier tôlerie", bu: "BU1", quantite: 1, priorite: "urgent", competences: ["Découpe", "Pliage", "Soudage"], machines: ["Laser PENTA BOLT", "Plieuse RAYMAX"], experienceMin: 8, diplome: "TS / Ingénieur" },
  { id: "p4", intitule: "Opérateur laser CNC", bu: "BU1", quantite: 2, priorite: "urgent", competences: ["Découpe laser", "Lecture plan"], machines: ["Laser PENTA BOLT 6020"], experienceMin: 3, diplome: "TS" },
  { id: "p5", intitule: "Plieur CNC", bu: "BU1", quantite: 2, priorite: "urgent", competences: ["Pliage CNC", "Outillage"], machines: ["RAYMAX WF67K-200T"], experienceMin: 3, diplome: "TS" },
  { id: "p6", intitule: "Soudeur MIG/MAG/TIG", bu: "BU1", quantite: 4, priorite: "urgent", competences: ["MIG", "MAG", "TIG"], machines: ["Postes soudage"], experienceMin: 3, diplome: "CAP/BEP" },
  { id: "p7", intitule: "Opérateur robot soudage", bu: "BU1", quantite: 1, priorite: "prioritaire", competences: ["Robotique", "Soudage laser"], machines: ["Robot RAYMAX"], experienceMin: 4, diplome: "TS" },
  { id: "p8", intitule: "Responsable BU caoutchouc", bu: "BU2", quantite: 1, priorite: "urgent", competences: ["Process élastomère", "Formulation"], machines: ["Open Mill", "Presses TungYu"], experienceMin: 8, diplome: "Ingénieur" },
  { id: "p9", intitule: "Formulateur chimiste caoutchouc", bu: "BU2", quantite: 1, priorite: "urgent", competences: ["Chimie polymère", "Formulation"], machines: [], experienceMin: 5, diplome: "Ingénieur chimiste" },
  { id: "p10", intitule: "Régleur presses caoutchouc", bu: "BU2", quantite: 2, priorite: "urgent", competences: ["Réglage presse", "Vulcanisation"], machines: ["Presses TungYu TIP-3000"], experienceMin: 4, diplome: "TS" },
  { id: "p11", intitule: "Opérateur presses caoutchouc", bu: "BU2", quantite: 4, priorite: "prioritaire", competences: ["Conduite presse", "Sécurité"], machines: ["Presses TungYu"], experienceMin: 1, diplome: "CAP" },
  { id: "p12", intitule: "Technicien mélangeage", bu: "BU2", quantite: 1, priorite: "prioritaire", competences: ["Open mill", "Sécurité"], machines: ["Gokdag MG-H"], experienceMin: 3, diplome: "TS" },
  { id: "p13", intitule: "Chef d'atelier usinage CNC", bu: "BU3", quantite: 1, priorite: "urgent", competences: ["CNC", "Management"], machines: ["SPINNER VC1650"], experienceMin: 8, diplome: "Ingénieur" },
  { id: "p14", intitule: "Programmeur CFAO", bu: "BU3", quantite: 1, priorite: "urgent", competences: ["FAO", "SolidCAM", "Mastercam"], machines: [], experienceMin: 5, diplome: "Ingénieur" },
  { id: "p15", intitule: "Opérateur centre CNC", bu: "BU3", quantite: 3, priorite: "urgent", competences: ["Fanuc", "Heidenhain"], machines: ["SPINNER VC1650", "VC1150"], experienceMin: 3, diplome: "TS" },
  { id: "p16", intitule: "Opérateur tour CNC", bu: "BU3", quantite: 2, priorite: "urgent", competences: ["Tournage CNC"], machines: ["SPINNER TC600"], experienceMin: 3, diplome: "TS" },
  { id: "p17", intitule: "Tourneur conventionnel", bu: "BU3", quantite: 1, priorite: "phase2", competences: ["Tournage"], machines: ["TRENS SN50C"], experienceMin: 5, diplome: "CAP" },
  { id: "p18", intitule: "Fraiseur conventionnel", bu: "BU3", quantite: 1, priorite: "phase2", competences: ["Fraisage"], machines: ["X6436"], experienceMin: 5, diplome: "CAP" },
  { id: "p19", intitule: "Technicien EDM électroérosion", bu: "BU3", quantite: 1, priorite: "prioritaire", competences: ["EDM", "Outillage"], machines: ["EUMA MIC-542CG"], experienceMin: 4, diplome: "TS" },
  { id: "p20", intitule: "Chef BU fonderie / presses", bu: "BU4", quantite: 1, priorite: "urgent", competences: ["Fonderie alu", "Injection"], machines: ["MP-400T"], experienceMin: 8, diplome: "Ingénieur" },
  { id: "p21", intitule: "Fondeur / opérateur fusion", bu: "BU4", quantite: 2, priorite: "urgent", competences: ["Fusion alu", "Sécurité"], machines: ["Four Encotherm"], experienceMin: 3, diplome: "TS" },
  { id: "p22", intitule: "Opérateur injection aluminium", bu: "BU4", quantite: 2, priorite: "urgent", competences: ["Injection alu"], machines: ["METAL PRES MP-400T"], experienceMin: 3, diplome: "TS" },
  { id: "p23", intitule: "Opérateur emboutissage", bu: "BU4", quantite: 2, priorite: "prioritaire", competences: ["Emboutissage"], machines: ["ÖZKOÇ T400", "ERKEKOĞLU"], experienceMin: 2, diplome: "CAP" },
  { id: "p24", intitule: "Technicien plasturgie injection", bu: "BU4", quantite: 1, priorite: "phase2", competences: ["Injection plastique"], machines: ["EKIN MAKINA 210T"], experienceMin: 4, diplome: "TS" },
  { id: "p25", intitule: "Responsable BE", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["SolidWorks", "CATIA", "Conception"], machines: [], experienceMin: 8, diplome: "Ingénieur" },
  { id: "p26", intitule: "Dessinateur projeteur SolidWorks", bu: "TRANSV", quantite: 2, priorite: "prioritaire", competences: ["SolidWorks"], machines: [], experienceMin: 3, diplome: "TS" },
  { id: "p27", intitule: "Responsable qualité opérationnelle", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["ISO 9001", "Contrôle"], machines: [], experienceMin: 6, diplome: "Ingénieur" },
  { id: "p28", intitule: "Métrologue dimensionnel", bu: "TRANSV", quantite: 1, priorite: "prioritaire", competences: ["Métrologie", "MMT"], machines: ["Poste métrologie"], experienceMin: 4, diplome: "TS" },
  { id: "p29", intitule: "Responsable maintenance industrielle", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["Maintenance", "Management"], machines: [], experienceMin: 8, diplome: "Ingénieur" },
  { id: "p30", intitule: "Technicien automatisme CNC", bu: "TRANSV", quantite: 1, priorite: "urgent", competences: ["Automatisme", "Variateurs", "CNC"], machines: [], experienceMin: 5, diplome: "TS" },
  { id: "p31", intitule: "Responsable HSE", bu: "TRANSV", quantite: 1, priorite: "prioritaire", competences: ["HSE", "ISO 45001"], machines: [], experienceMin: 5, diplome: "Ingénieur" },
];

export const MACHINES: Machine[] = [
  { id: "m1", nom: "Laser fibre PENTA BOLT 6020", marque: "PENTA — 12 kW — 6000×2000", bu: "BU1", fonction: "Découpe laser tôle", criticite: "haute", etat: "non exploité" },
  { id: "m2", nom: "Cisaille hydraulique QC11Y-8×3200", marque: "RAYMAX", bu: "BU1", fonction: "Cisaillage tôle", criticite: "moyenne", etat: "non exploité" },
  { id: "m3", nom: "Presse plieuse CNC WF67K-200T/4000", marque: "RAYMAX", bu: "BU1", fonction: "Pliage CNC", criticite: "haute", etat: "non exploité" },
  { id: "m4", nom: "Scie à ruban BMSY270", marque: "BEKAMAK", bu: "BU1", fonction: "Sciage", criticite: "moyenne", etat: "opérationnel" },
  { id: "m5", nom: "Scie HS-1124", marque: "BLUETECH", bu: "BU1", fonction: "Sciage", criticite: "basse", etat: "opérationnel" },
  { id: "m6", nom: "Robot soudage laser", marque: "RAYMAX", bu: "BU1", fonction: "Soudage robotisé", criticite: "haute", etat: "non exploité" },
  { id: "m7", nom: "Soudeuse résistance", marque: "ALBAKSAN", bu: "BU1", fonction: "Soudage résistance", criticite: "moyenne", etat: "à régler" },
  { id: "m8", nom: "Open Mill MG-H Ø450×1200", marque: "Gokdag", bu: "BU2", fonction: "Mélangeage caoutchouc", criticite: "haute", etat: "non exploité" },
  { id: "m9", nom: "Extrudeuse", marque: "Gokdag", bu: "BU2", fonction: "Extrusion caoutchouc", criticite: "haute", etat: "non exploité" },
  { id: "m10", nom: "Système automatique pâte MG-4LT", marque: "Gokdag", bu: "BU2", fonction: "Préparation pâte", criticite: "moyenne", etat: "non exploité" },
  { id: "m11", nom: "Presses TungYu TIP-3000 (×3)", marque: "TungYu", bu: "BU2", fonction: "Vulcanisation", criticite: "haute", etat: "non exploité" },
  { id: "m12", nom: "Presses TungYu TYC-V-16 (×3)", marque: "TungYu", bu: "BU2", fonction: "Vulcanisation", criticite: "haute", etat: "non exploité" },
  { id: "m13", nom: "Cabine sablage", marque: "—", bu: "BU2", fonction: "Préparation inserts", criticite: "moyenne", etat: "opérationnel" },
  { id: "m14", nom: "Ligne phosphatation", marque: "—", bu: "BU2", fonction: "Traitement surface", criticite: "moyenne", etat: "à régler" },
  { id: "m15", nom: "Grenailleuse TKM2", marque: "BSM MAKINA", bu: "BU2", fonction: "Grenaillage", criticite: "moyenne", etat: "opérationnel" },
  { id: "m16", nom: "Centre usinage SPINNER VC1650", marque: "SPINNER", bu: "BU3", fonction: "Usinage CNC 3-5 axes", criticite: "haute", etat: "non exploité" },
  { id: "m17", nom: "Centre usinage SPINNER VC1150", marque: "SPINNER", bu: "BU3", fonction: "Usinage CNC", criticite: "haute", etat: "non exploité" },
  { id: "m18", nom: "Tour CNC SPINNER TC600", marque: "SPINNER", bu: "BU3", fonction: "Tournage CNC", criticite: "haute", etat: "non exploité" },
  { id: "m19", nom: "Tour conventionnel SN50C/2000", marque: "TRENS", bu: "BU3", fonction: "Tournage", criticite: "moyenne", etat: "opérationnel" },
  { id: "m20", nom: "Fraiseuse universelle X6436", marque: "—", bu: "BU3", fonction: "Fraisage", criticite: "moyenne", etat: "opérationnel" },
  { id: "m21", nom: "Perceuse radiale TU3032×10", marque: "TOSS", bu: "BU3", fonction: "Perçage", criticite: "basse", etat: "opérationnel" },
  { id: "m22", nom: "Rectifieuse plane", marque: "PERFECT", bu: "BU3", fonction: "Rectification", criticite: "moyenne", etat: "à régler" },
  { id: "m23", nom: "EDM enfonçage MIC-542CG", marque: "EUMA", bu: "BU3", fonction: "Électroérosion", criticite: "haute", etat: "non exploité" },
  { id: "m24", nom: "Presse injection alu MP-400T", marque: "METAL PRES", bu: "BU4", fonction: "Injection aluminium", criticite: "haute", etat: "non exploité" },
  { id: "m25", nom: "Four de fusion grande capacité", marque: "—", bu: "BU4", fonction: "Fusion alu", criticite: "haute", etat: "non exploité" },
  { id: "m26", nom: "Four maintien", marque: "Encotherm", bu: "BU4", fonction: "Maintien température", criticite: "haute", etat: "non exploité" },
  { id: "m27", nom: "Bras doseur MPDK-3", marque: "DIKKAT", bu: "BU4", fonction: "Dosage alu", criticite: "moyenne", etat: "non exploité" },
  { id: "m28", nom: "Extraction fumées", marque: "VANTSAN", bu: "BU4", fonction: "Aspiration", criticite: "moyenne", etat: "opérationnel" },
  { id: "m29", nom: "Presse hydraulique T400", marque: "ÖZKOÇ", bu: "BU4", fonction: "Emboutissage", criticite: "haute", etat: "non exploité" },
  { id: "m30", nom: "Presses excentriques 300T / 250T", marque: "ERKEKOĞLU", bu: "BU4", fonction: "Emboutissage", criticite: "haute", etat: "à régler" },
  { id: "m31", nom: "Injection plastique 210T", marque: "EKIN MAKINA", bu: "BU4", fonction: "Plasturgie", criticite: "moyenne", etat: "non exploité" },
  { id: "m32", nom: "Machine traction", marque: "—", bu: "TRANSV", fonction: "Essais mécaniques", criticite: "moyenne", etat: "opérationnel" },
  { id: "m33", nom: "Rhéomètre MDR", marque: "GIBITRE", bu: "TRANSV", fonction: "Essais caoutchouc", criticite: "moyenne", etat: "opérationnel" },
  { id: "m34", nom: "Marquage laser 50W", marque: "—", bu: "TRANSV", fonction: "Marquage", criticite: "basse", etat: "opérationnel" },
  { id: "m35", nom: "Poste métrologie", marque: "—", bu: "TRANSV", fonction: "Contrôle dimensionnel", criticite: "haute", etat: "opérationnel" },
];

export const CANDIDATS: Candidat[] = [
  { id: "c1", nom: "Benali", prenom: "Karim", posteVise: "Opérateur laser CNC", experience: 6, diplome: "TS Mécanique", score: 87, statut: "preselectionne", bu: "BU1" },
  { id: "c2", nom: "Hamidi", prenom: "Sofiane", posteVise: "Soudeur MIG/MAG/TIG", experience: 8, diplome: "CAP Soudage", score: 91, statut: "entretien", bu: "BU1" },
  { id: "c3", nom: "Boudiaf", prenom: "Yacine", posteVise: "Opérateur centre CNC", experience: 4, diplome: "TS CNC", score: 78, statut: "analyse", bu: "BU3" },
  { id: "c4", nom: "Cherif", prenom: "Amine", posteVise: "Régleur presses caoutchouc", experience: 2, diplome: "TS", score: 54, statut: "recu", bu: "BU2" },
  { id: "c5", nom: "Larbi", prenom: "Mohamed", posteVise: "Programmeur CFAO", experience: 7, diplome: "Ingénieur", score: 84, statut: "accepte", bu: "BU3" },
  { id: "c6", nom: "Saadi", prenom: "Riad", posteVise: "Opérateur injection aluminium", experience: 1, diplome: "CAP", score: 38, statut: "rejete", bu: "BU4" },
  { id: "c7", nom: "Khelifi", prenom: "Nadir", posteVise: "Plieur CNC", experience: 5, diplome: "TS", score: 82, statut: "preselectionne", bu: "BU1" },
  { id: "c8", nom: "Belkacem", prenom: "Walid", posteVise: "Technicien EDM électroérosion", experience: 6, diplome: "TS", score: 76, statut: "analyse", bu: "BU3" },
  { id: "c9", nom: "Daoud", prenom: "Hicham", posteVise: "Fondeur / opérateur fusion", experience: 4, diplome: "TS", score: 69, statut: "entretien", bu: "BU4" },
  { id: "c10", nom: "Meziane", prenom: "Tarek", posteVise: "Responsable maintenance industrielle", experience: 12, diplome: "Ingénieur", score: 88, statut: "preselectionne", bu: "TRANSV" },
];

export const STATUT_LABELS: Record<CandidatStatut, { label: string; cls: string }> = {
  recu: { label: "Reçu", cls: "bg-muted text-muted-foreground border-border" },
  analyse: { label: "Analysé", cls: "bg-info/15 text-info border-info/30" },
  preselectionne: { label: "Présélectionné", cls: "bg-warning/15 text-warning border-warning/30" },
  entretien: { label: "Entretien", cls: "bg-info/15 text-info border-info/30" },
  accepte: { label: "Accepté", cls: "bg-success/15 text-success border-success/30" },
  rejete: { label: "Rejeté", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

export const PRIORITY_LABELS: Record<Priority, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  prioritaire: { label: "Prioritaire", cls: "bg-warning/15 text-warning border-warning/30" },
  phase2: { label: "Phase 2", cls: "bg-info/15 text-info border-info/30" },
  cible: { label: "Cible", cls: "bg-muted text-muted-foreground border-border" },
};
