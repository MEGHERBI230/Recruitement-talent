import { Candidat, Poste, POSTES, MACHINES } from "@/data/cirta";

export type RisqueNiveau = "faible" | "moyen" | "élevé";

export interface ScoreBreakdown {
  total: number;
  competences: number; // /40
  experience: number;  // /25
  diplome: number;     // /15
  machines: number;    // /20
  technique: number;       // 0-100
  terrain: number;         // 0-100
  autonomie: number;       // 0-100
  comportement: number;    // 0-100
  risque: RisqueNiveau;
  recommandation: "FORT" | "BON" | "MOYEN" | "FAIBLE" | "REJET";
  forces: string[];
  faiblesses: string[];
  posteId?: string;
  matchMachines: { req: string[]; have: string[]; matched: string[] };
  readinessAtelier: number;
}

const DIPLOME_RANK: Record<string, number> = {
  "CAP": 1, "CAP/BEP": 1, "BEP": 1,
  "TS": 2, "TS Mécanique": 2, "TS CNC": 2, "TS / Ingénieur": 2.5,
  "Ingénieur": 3, "Ingénieur chimiste": 3,
};

function rank(d: string) {
  for (const k of Object.keys(DIPLOME_RANK)) if (d.toLowerCase().includes(k.toLowerCase())) return DIPLOME_RANK[k];
  return 1.5;
}

export interface ScoreWeightsInput { competences?: number; experience?: number; diplome?: number; machines?: number }

export function scoreCandidat(c: { experience: number; diplome: string; competences?: string[]; machinesMaitrisees?: string[]; posteVise: string }, weights?: ScoreWeightsInput): ScoreBreakdown {
  const W = {
    competences: weights?.competences ?? 40,
    experience: weights?.experience ?? 25,
    diplome: weights?.diplome ?? 15,
    machines: weights?.machines ?? 20,
  };
  const TOTAL = W.competences + W.experience + W.diplome + W.machines || 100;
  const poste = POSTES.find((p) => p.intitule === c.posteVise);
  const forces: string[] = [];
  const faiblesses: string[] = [];

  // Compétences
  let compScore = 20;
  if (poste && c.competences && c.competences.length) {
    const req = poste.competences.map((x) => x.toLowerCase());
    const have = c.competences.map((x) => x.toLowerCase());
    const matched = req.filter((r) => have.some((h) => h.includes(r) || r.includes(h)));
    compScore = Math.round((matched.length / Math.max(1, req.length)) * 40);
    if (matched.length === req.length) forces.push("Couvre toutes les compétences clés");
    if (matched.length === 0) faiblesses.push("Aucune compétence clé alignée avec le poste");
  }

  // Expérience
  let expScore = 0;
  if (poste) {
    const ratio = c.experience / Math.max(1, poste.experienceMin);
    expScore = Math.min(25, Math.round(ratio * 20));
    if (c.experience >= poste.experienceMin) forces.push(`Expérience suffisante (${c.experience} ans)`);
    else faiblesses.push(`Expérience insuffisante (${c.experience}/${poste.experienceMin} ans)`);
  } else {
    expScore = Math.min(25, c.experience * 3);
  }

  // Diplôme
  let dipScore = 8;
  if (poste) {
    const reqR = rank(poste.diplome);
    const candR = rank(c.diplome);
    dipScore = candR >= reqR ? 15 : Math.max(0, 15 - Math.round((reqR - candR) * 6));
    if (candR >= reqR) forces.push("Diplôme conforme aux exigences");
    else faiblesses.push("Niveau de diplôme inférieur à l'exigence");
  }

  // Machines
  let machScore = 10;
  if (poste && poste.machines.length && c.machinesMaitrisees) {
    const req = poste.machines.map((x) => x.toLowerCase());
    const have = c.machinesMaitrisees.map((x) => x.toLowerCase());
    const matched = req.filter((r) => have.some((h) => h.includes(r.split(" ")[0]) || r.includes(h)));
    machScore = Math.round((matched.length / req.length) * 20);
    if (matched.length === req.length) forces.push("Maîtrise les machines requises");
    else if (matched.length === 0) faiblesses.push("Ne maîtrise aucune machine du poste");
  } else if (poste && !poste.machines.length) {
    machScore = 18;
  }

  const total = Math.min(100, compScore + expScore + dipScore + machScore);
  let recommandation: ScoreBreakdown["recommandation"] = "REJET";
  if (total >= 85) recommandation = "FORT";
  else if (total >= 70) recommandation = "BON";
  else if (total >= 55) recommandation = "MOYEN";
  else if (total >= 40) recommandation = "FAIBLE";

  const reqMach = poste?.machines ?? [];
  const haveMach = c.machinesMaitrisees ?? [];
  const matched = reqMach.filter((r) =>
    haveMach.some((h) => h.toLowerCase().includes(r.split(" ")[0].toLowerCase()) || r.toLowerCase().includes(h.toLowerCase())),
  );
  const technique = Math.round((compScore / 40) * 60 + (machScore / 20) * 40);
  const terrain = Math.min(100, Math.round((c.experience / Math.max(1, poste?.experienceMin ?? 5)) * 80));
  const autonomie = Math.min(100, Math.round(c.experience * 8 + rank(c.diplome) * 10));
  const comportement = 60;
  const readinessAtelier = reqMach.length ? Math.round((matched.length / reqMach.length) * 100) : 80;

  let risque: RisqueNiveau = "faible";
  const expRatio = poste ? c.experience / Math.max(1, poste.experienceMin) : 1;
  if (expRatio < 0.5 || readinessAtelier < 30 || total < 50) risque = "élevé";
  else if (expRatio < 0.8 || readinessAtelier < 60 || total < 70) risque = "moyen";

  return {
    total, competences: compScore, experience: expScore, diplome: dipScore, machines: machScore,
    technique, terrain, autonomie, comportement, risque,
    recommandation, forces, faiblesses, posteId: poste?.id,
    matchMachines: { req: reqMach, have: haveMach, matched },
    readinessAtelier,
  };
}

export function risqueCls(r: RisqueNiveau) {
  if (r === "faible") return "bg-success/15 text-success border-success/30";
  if (r === "moyen") return "bg-warning/15 text-warning border-warning/30";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

export function buReadiness(bu: string, candidats: { bu: string; statut: string; score: number }[]) {
  const buPostes = POSTES.filter((p) => p.bu === bu);
  const totalRequis = buPostes.reduce((s, p) => s + p.quantite, 0);
  const buMachines = MACHINES.filter((m) => m.bu === bu);
  const ops = buMachines.filter((m) => m.etat === "opérationnel").length;
  const machReady = buMachines.length ? ops / buMachines.length : 1;
  const acceptes = candidats.filter((c) => c.bu === bu && (c.statut === "accepte" || c.statut === "preselectionne")).length;
  const rhReady = totalRequis ? Math.min(1, acceptes / totalRequis) : 0;
  const readiness = Math.round((rhReady * 0.7 + machReady * 0.3) * 100);
  let niveau: "CRITIQUE" | "À RISQUE" | "DÉMARRABLE" | "PRÊTE";
  if (readiness < 30) niveau = "CRITIQUE";
  else if (readiness < 55) niveau = "À RISQUE";
  else if (readiness < 80) niveau = "DÉMARRABLE";
  else niveau = "PRÊTE";
  return { readiness, niveau, totalRequis, acceptes, machReady: Math.round(machReady * 100), buPostes };
}

export function recoCls(r: ScoreBreakdown["recommandation"]) {
  switch (r) {
    case "FORT": return "bg-success/15 text-success border-success/30";
    case "BON": return "bg-success/15 text-success border-success/30";
    case "MOYEN": return "bg-warning/15 text-warning border-warning/30";
    case "FAIBLE": return "bg-warning/15 text-warning border-warning/30";
    case "REJET": return "bg-destructive/10 text-destructive border-destructive/30";
  }
}
