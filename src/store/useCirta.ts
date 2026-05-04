import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CANDIDATS, Candidat, CandidatStatut, POSTES, Poste, MACHINES, Machine } from "@/data/cirta";

export interface MachineExt extends Machine {
  image?: string; // dataURL
}

export interface EntretienData {
  candidatId: string;
  date?: string;
  reponses: Record<string, number>;
  commentaires: string;
  scoreGlobal?: number;
}
export interface TestData {
  candidatId: string;
  date?: string;
  reponses: Record<string, number>; // questionId -> 0..5
  observations: string;
  scoreGlobal?: number;
}
export interface ComportementData {
  candidatId: string;
  date?: string;
  reponses: Record<string, number>;
  scoreGlobal?: number;
  commentaires: string;
}

export interface CandidatExt extends Candidat {
  competences?: string[];
  machinesMaitrisees?: string[];
  telephone?: string;
  email?: string;
  ville?: string;
  notes?: string;
}

interface State {
  candidats: CandidatExt[];
  postes: Poste[];
  machines: MachineExt[];
  entretiens: Record<string, EntretienData>;
  tests: Record<string, TestData>;
  comportements: Record<string, ComportementData>;
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
  reset: () => void;
}

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
      saveEntretien: (d) => set((st) => ({ entretiens: { ...st.entretiens, [d.candidatId]: d } })),
      saveTest: (d) => set((st) => ({ tests: { ...st.tests, [d.candidatId]: d } })),
      saveComportement: (d) => set((st) => ({ comportements: { ...st.comportements, [d.candidatId]: d } })),
      reset: () => set({ candidats: seedExt, postes: POSTES, machines: MACHINES as MachineExt[], entretiens: {}, tests: {}, comportements: {} }),
    }),
    { name: "cirta-store-v2" },
  ),
);
