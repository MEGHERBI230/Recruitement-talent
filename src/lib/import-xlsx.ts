import * as XLSX from "xlsx";
import type { BU, Priority, Poste, Machine } from "@/data/cirta";
import type { Employe, ContratType, SituationFam, MachineExt } from "@/store/useCirta";

const BU_VALID: BU[] = ["BU1", "BU2", "BU3", "BU4", "TRANSV"];
const PRIO_VALID: Priority[] = ["urgent", "prioritaire", "phase2", "cible"];
const CRIT_VALID = ["haute", "moyenne", "basse"] as const;
const ETAT_VALID = ["opérationnel", "à régler", "non exploité"] as const;
const CONTRAT_VALID: ContratType[] = ["CDI", "CDD", "Intérim", "Stage", "Apprentissage"];

const split = (v: any): string[] =>
  String(v ?? "")
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const str = (v: any) => (v == null ? "" : String(v).trim());
const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array" });
}

function rowsOf(wb: XLSX.WorkBook, sheetName: string): any[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
}

export interface ImportResult { added: number; skipped: number; errors: string[] }

export async function importPostes(file: File): Promise<{ result: ImportResult; postes: Poste[] }> {
  const wb = await readWorkbook(file);
  const rows = rowsOf(wb, "Postes");
  const postes: Poste[] = [];
  const errors: string[] = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    const intitule = str(r.intitule);
    if (!intitule) { skipped++; return; }
    const bu = str(r.bu) as BU;
    if (!BU_VALID.includes(bu)) { errors.push(`Ligne ${i + 2} (Postes): BU invalide "${r.bu}"`); skipped++; return; }
    const priorite = (str(r.priorite) || "prioritaire") as Priority;
    if (!PRIO_VALID.includes(priorite)) { errors.push(`Ligne ${i + 2} (Postes): priorité invalide "${r.priorite}"`); skipped++; return; }
    postes.push({
      id: `p${Date.now()}-${i}`,
      intitule,
      bu,
      quantite: num(r.quantite) || 1,
      priorite,
      experienceMin: num(r.experienceMin),
      diplome: str(r.diplome),
      competences: split(r.competences),
      machines: split(r.machines),
      hardSkills: split(r.hardSkills),
      softSkills: split(r.softSkills),
    });
  });
  return { result: { added: postes.length, skipped, errors }, postes };
}

export async function importMachines(file: File): Promise<{ result: ImportResult; machines: MachineExt[] }> {
  const wb = await readWorkbook(file);
  const rows = rowsOf(wb, "Machines");
  const machines: MachineExt[] = [];
  const errors: string[] = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    const nom = str(r.nom);
    if (!nom) { skipped++; return; }
    const bu = str(r.bu) as BU;
    if (!BU_VALID.includes(bu)) { errors.push(`Ligne ${i + 2} (Machines): BU invalide "${r.bu}"`); skipped++; return; }
    const criticite = (str(r.criticite) || "moyenne") as Machine["criticite"];
    if (!CRIT_VALID.includes(criticite)) { errors.push(`Ligne ${i + 2}: criticité invalide`); skipped++; return; }
    const etat = (str(r.etat) || "opérationnel") as Machine["etat"];
    if (!ETAT_VALID.includes(etat)) { errors.push(`Ligne ${i + 2}: état invalide`); skipped++; return; }
    machines.push({
      id: `m${Date.now()}-${i}`,
      nom,
      marque: str(r.marque),
      bu,
      fonction: str(r.fonction),
      criticite,
      etat,
    });
  });
  return { result: { added: machines.length, skipped, errors }, machines };
}

export async function importPersonnel(file: File): Promise<{ result: ImportResult; employes: Employe[] }> {
  const wb = await readWorkbook(file);
  const rows = rowsOf(wb, "Personnel");
  const employes: Employe[] = [];
  const errors: string[] = [];
  let skipped = 0;
  const today = new Date().toISOString().slice(0, 10);
  rows.forEach((r, i) => {
    const nom = str(r.nom), prenom = str(r.prenom);
    if (!nom || !prenom) { skipped++; return; }
    const typeContrat = (str(r.typeContrat) || "CDI") as ContratType;
    if (!CONTRAT_VALID.includes(typeContrat)) { errors.push(`Ligne ${i + 2} (Personnel): contrat invalide "${r.typeContrat}"`); skipped++; return; }
    const id = `emp-${Date.now()}-${i}`;
    employes.push({
      id,
      nom,
      prenom,
      dateNaissance: str(r.dateNaissance) || undefined,
      lieuNaissance: str(r.lieuNaissance) || undefined,
      cin: str(r.cin) || undefined,
      nss: str(r.nss) || undefined,
      telephone: str(r.telephone) || undefined,
      email: str(r.email) || undefined,
      adresse: str(r.adresse) || undefined,
      situationFamiliale: (str(r.situationFamiliale) || undefined) as SituationFam | undefined,
      nbEnfants: r.nbEnfants !== "" ? num(r.nbEnfants) : undefined,
      niveauEtudes: str(r.niveauEtudes) || undefined,
      specialite: str(r.specialite) || undefined,
      diplomes: str(r.diplomes) || undefined,
      postes: [{
        id: `pos-${Date.now()}-${i}`,
        intituleposte: str(r.intituleposte) || "À définir",
        departement: str(r.departement) || undefined,
        responsable: str(r.responsable) || undefined,
        lieuTravail: str(r.lieuTravail) || undefined,
        typeContrat,
        dateEmbauche: str(r.dateEmbauche) || today,
        dateFinContrat: str(r.dateFinContrat) || undefined,
        salaireBrut: r.salaireBrut !== "" ? num(r.salaireBrut) : undefined,
        modePaiement: str(r.modePaiement) || undefined,
        rib: str(r.rib) || undefined,
        banque: str(r.banque) || undefined,
        estActuel: true,
        dateCreation: today,
      }],
      assiduites: [],
      observations: [],
      documents: [],
      historiqueSalaires: [],
      dateCreation: today,
      actif: true,
    });
  });
  return { result: { added: employes.length, skipped, errors }, employes };
}
