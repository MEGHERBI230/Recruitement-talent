import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CANDIDATS, Candidat, CandidatStatut, POSTES, Poste, MACHINES, Machine } from "@/data/cirta";

export interface MachineExt extends Machine {
  image?: string;
}

export interface InterviewQA { question: string; objectif: string; categorie: string }
export interface InterviewAnalyse { score: number; recommandation: "FORT" | "BON" | "MOYEN" | "FAIBLE" | "REJET"; forces: string[]; faiblesses: string[]; synthese: string; risqueSurevaluation?: "faible" | "moyen" | "élevé"; incoherences?: string[]; relances?: string[] }
export interface EntretienData {
  candidatId: string;
  date?: string;
  questions?: InterviewQA[];
  reponses?: string[];
  analyse?: InterviewAnalyse;
  scoreGlobal?: number;
}

export interface PracticalCritere { id: string; label: string; bareme: number }
export interface PracticalTestDef { titre: string; duree: string; materiel: string[]; consigne: string; etapes: string[]; securite: string[]; criteres: PracticalCritere[] }
export interface PracticalAnalyse { notes: { id: string; note: number; justification: string }[]; total: number; verdict: string; commentaires: string }
export interface TestData {
  candidatId: string;
  date?: string;
  test?: PracticalTestDef;
  observations?: string;
  photos?: string[]; // dataURLs
  scanReponses?: string;
  analyse?: PracticalAnalyse;
  scoreGlobal?: number;
}

export interface BehaviorQA { question: string; axe: string }
export interface BehaviorAnalyse { score: number; profil: string; forces: string[]; risques: string[]; synthese: string }
export interface ComportementData {
  candidatId: string;
  date?: string;
  questions?: BehaviorQA[];
  reponses?: string[];
  scanReponses?: string;
  analyse?: BehaviorAnalyse;
  scoreGlobal?: number;
}

export type CandidatTag = "urgent" | "a_former" | "bon_profil" | "rejete_def" | "fort_potentiel" | "a_revoir";

export interface CandidatExt extends Candidat {
  competences?: string[];
  machinesMaitrisees?: string[];
  telephone?: string;
  email?: string;
  ville?: string;
  notes?: string;
  tags?: CandidatTag[];
  historique?: { date: string; event: string }[];
}

export interface ScoreWeights {
  competences: number;
  experience: number;
  diplome: number;
  machines: number;
}

export interface UserProfile {
  nom: string;
  fonction: string;
  email: string;
  telephone: string;
  signature?: string; // dataURL — signature + cachet + griffe
  weights: ScoreWeights;
}

export const DEFAULT_WEIGHTS: ScoreWeights = { competences: 40, experience: 25, diplome: 15, machines: 20 };

export type EvaluationType = "periode_essai" | "renouvellement_cdd" | "cdd_to_cdi";

export interface EvalQuestion { question: string; objectif: string; categorie: string; bareme: number }
export interface EvalNote { idx: number; note: number; commentaire: string }
export interface EvalAnalyse {
  scoreGlobal: number;
  verdict: "VALIDÉ" | "À CONSOLIDER" | "NON VALIDÉ";
  forces: string[];
  axesProgres: string[];
  decisionRecommandee: string;
  synthese: string;
}
export interface EvaluationData {
  id: string;
  candidatId: string;
  type: EvaluationType;
  date: string;
  questions: EvalQuestion[];
  notes: EvalNote[];
  observationsTerrain?: string;
  analyse?: EvalAnalyse;
}

export const EVAL_LABELS: Record<EvaluationType, string> = {
  periode_essai: "Validation période d'essai",
  renouvellement_cdd: "Renouvellement CDD (1 an)",
  cdd_to_cdi: "Passage CDD → CDI",
};

interface AuthState { isLoggedIn: boolean; displayName: string }

export interface AISettings {
  ollamaUrl: string;
  ollamaModel: string;
  preferLocal: boolean;
  fallbackToCloud: boolean;
}
export interface AIUsage {
  local: number;
  cloud: number;
  lastReset: string;
}
export const DEFAULT_AI_SETTINGS: AISettings = {
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.1",
  preferLocal: true,
  fallbackToCloud: true,
};

interface State {
  candidats: CandidatExt[];
  postes: Poste[];
  machines: MachineExt[];
  entretiens: Record<string, EntretienData>;
  tests: Record<string, TestData>;
  comportements: Record<string, ComportementData>;
  evaluations: EvaluationData[];
  user: UserProfile;
  auth: AuthState;
  aiSettings: AISettings;
  aiUsage: AIUsage;
  setStatut: (id: string, s: CandidatStatut) => void;
  setScore: (id: string, score: number) => void;
  updateCandidat: (id: string, patch: Partial<CandidatExt>) => void;
  addCandidat: (c: CandidatExt) => void;
  addPoste: (p: Poste) => void;
  updatePoste: (id: string, patch: Partial<Poste>) => void;
  deletePoste: (id: string) => void;
  addMachine: (m: MachineExt) => void;
  updateMachine: (id: string, patch: Partial<MachineExt>) => void;
  deleteMachine: (id: string) => void;
  saveEntretien: (d: EntretienData) => void;
  saveTest: (d: TestData) => void;
  saveComportement: (d: ComportementData) => void;
  addEvaluation: (e: EvaluationData) => void;
  updateEvaluation: (id: string, patch: Partial<EvaluationData>) => void;
  deleteEvaluation: (id: string) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  login: (displayName: string) => void;
  logout: () => void;
  updateAISettings: (patch: Partial<AISettings>) => void;
  bumpAIUsage: (provider: "local" | "cloud") => void;
  resetAIUsage: () => void;
  reset: () => void;
}

const defaultUser: UserProfile = {
  nom: "MEGHERBI Nabil",
  fonction: "Directeur des Opérations",
  email: "",
  telephone: "",
  signature: undefined,
  weights: DEFAULT_WEIGHTS,
};

const seedExt: CandidatExt[] = CANDIDATS.map((c) => ({
  ...c,
  email: `${c.prenom.toLowerCase()}.${c.nom.toLowerCase()}@email.com`,
  telephone: "+213 5XX XX XX XX",
  ville: "Constantine",
  competences: [],
  machinesMaitrisees: [],
}));

export const useCirta = create<State>()(
  persist(
    (set) => ({
      candidats: seedExt,
      postes: POSTES,
      machines: MACHINES as MachineExt[],
      entretiens: {},
      tests: {},
      comportements: {},
      evaluations: [],
      user: defaultUser,
      auth: { isLoggedIn: false, displayName: "" },
      aiSettings: DEFAULT_AI_SETTINGS,
      aiUsage: { local: 0, cloud: 0, lastReset: new Date().toISOString() },
      setStatut: (id, s) => set((st) => ({ candidats: st.candidats.map((c) => (c.id === id ? { ...c, statut: s } : c)) })),
      setScore: (id, score) => set((st) => ({ candidats: st.candidats.map((c) => (c.id === id ? { ...c, score } : c)) })),
      updateCandidat: (id, patch) => set((st) => ({ candidats: st.candidats.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      addCandidat: (c) => set((st) => ({ candidats: [c, ...st.candidats] })),
      addPoste: (p) => set((st) => ({ postes: [p, ...st.postes] })),
      updatePoste: (id, patch) => set((st) => ({ postes: st.postes.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePoste: (id) => set((st) => ({ postes: st.postes.filter((p) => p.id !== id) })),
      addMachine: (m) => set((st) => ({ machines: [m, ...st.machines] })),
      updateMachine: (id, patch) => set((st) => ({ machines: st.machines.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMachine: (id) => set((st) => ({ machines: st.machines.filter((m) => m.id !== id) })),
      saveEntretien: (d) => set((st) => ({ entretiens: { ...st.entretiens, [d.candidatId]: { ...st.entretiens[d.candidatId], ...d } } })),
      saveTest: (d) => set((st) => ({ tests: { ...st.tests, [d.candidatId]: { ...st.tests[d.candidatId], ...d } } })),
      saveComportement: (d) => set((st) => ({ comportements: { ...st.comportements, [d.candidatId]: { ...st.comportements[d.candidatId], ...d } } })),
      addEvaluation: (e) => set((st) => ({ evaluations: [e, ...st.evaluations] })),
      updateEvaluation: (id, patch) => set((st) => ({ evaluations: st.evaluations.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEvaluation: (id) => set((st) => ({ evaluations: st.evaluations.filter((e) => e.id !== id) })),
      updateUser: (patch) => set((st) => ({ user: { ...st.user, ...patch } })),
      login: (displayName) => set(() => ({ auth: { isLoggedIn: true, displayName } })),
      logout: () => set(() => ({ auth: { isLoggedIn: false, displayName: "" } })),
      updateAISettings: (patch) => set((st) => ({ aiSettings: { ...st.aiSettings, ...patch } })),
      bumpAIUsage: (provider) => set((st) => ({ aiUsage: { ...st.aiUsage, [provider]: st.aiUsage[provider] + 1 } })),
      resetAIUsage: () => set(() => ({ aiUsage: { local: 0, cloud: 0, lastReset: new Date().toISOString() } })),
      reset: () => set((st) => ({ candidats: seedExt, postes: POSTES, machines: MACHINES as MachineExt[], entretiens: {}, tests: {}, comportements: {}, evaluations: [], user: defaultUser, aiSettings: st.aiSettings, aiUsage: st.aiUsage })),
    }),
    { name: "cirta-store-v5" },
  ),
);
