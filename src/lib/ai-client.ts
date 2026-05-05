// Client IA hybride : Ollama local par défaut + fallback Lovable Cloud
// L'appel Ollama est exécuté DEPUIS LE NAVIGATEUR (localhost du poste utilisateur).

import { useCirta } from "@/store/useCirta";
import {
  generateInterview,
  analyzeInterview,
  generatePracticalTest,
  analyzePracticalTest,
  generateBehaviorTest,
  analyzeBehavior,
  planRestart,
  generateRhEvaluation,
  analyzeRhEvaluation,
} from "@/server/ai.functions";

export type AITask =
  | "generateInterview"
  | "analyzeInterview"
  | "generatePracticalTest"
  | "analyzePracticalTest"
  | "generateBehaviorTest"
  | "analyzeBehavior"
  | "planRestart"
  | "generateRhEvaluation"
  | "analyzeRhEvaluation";

export type AIProvider = "local" | "cloud" | "auto";

const CLOUD_FN: Record<AITask, (args: any) => Promise<any>> = {
  generateInterview: (data) => generateInterview({ data }),
  analyzeInterview: (data) => analyzeInterview({ data }),
  generatePracticalTest: (data) => generatePracticalTest({ data }),
  analyzePracticalTest: (data) => analyzePracticalTest({ data }),
  generateBehaviorTest: (data) => generateBehaviorTest({ data }),
  analyzeBehavior: (data) => analyzeBehavior({ data }),
  planRestart: (data) => planRestart({ data }),
  generateRhEvaluation: (data) => generateRhEvaluation({ data }),
  analyzeRhEvaluation: (data) => analyzeRhEvaluation({ data }),
};

// === Prompts spécifiques par tâche ===
function buildPrompt(task: AITask, data: any): { system: string; user: string; schema: any } {
  switch (task) {
    case "generateInterview":
      return {
        system: "Directeur des Opérations CIRTA AUTOMOTIVE (industrie automobile algérienne). Tu prépares des guides d'entretien structurés.",
        user: `Génère un guide d'entretien de 10 questions pour : ${data.poste} (BU ${data.bu}, exp ${data.experience}a, ${data.diplome}). Compétences: ${(data.competences ?? []).join(", ")}. Machines: ${(data.machines ?? []).join(", ")}. Mix: 2 motivation, 4 techniques, 2 sécurité, 2 mises en situation. Réponds en JSON: {"questions":[{"question":"...","objectif":"...","categorie":"motivation|technique|securite|situation"}]}`,
        schema: { questions: [{ question: "", objectif: "", categorie: "" }] },
      };
    case "analyzeInterview":
      return {
        system: "DOP CIRTA. Analyse sans complaisance. Détecte incohérences, jargon non étayé, exagérations.",
        user: `Poste : ${data.poste}\n\n${data.qa.map((x: any, i: number) => `Q${i + 1}: ${x.question}\nR: ${x.reponse || "(vide)"}`).join("\n\n")}\n\nRéponds en JSON: {"score":0-100,"recommandation":"FORT|BON|MOYEN|FAIBLE|REJET","forces":[],"faiblesses":[],"synthese":"...","risqueSurevaluation":"faible|moyen|élevé","incoherences":[],"relances":[]}`,
        schema: {},
      };
    case "generatePracticalTest":
      return {
        system: "Chef d'atelier CIRTA. Tu conçois des tests ULTRA-LÉGERS, papier ou pied à coulisse, 15-30 min, sans machine en marche.",
        user: `Poste : ${data.poste} (BU ${data.bu}). Machines réf : ${(data.machines ?? []).join(", ")}. Compétences : ${(data.competences ?? []).join(", ")}. PAS de G-code, PAS d'EPI lourd. Réponds en JSON: {"titre":"","duree":"","materiel":[],"consigne":"","etapes":[],"securite":[],"criteres":[{"id":"","label":"","bareme":5}]}`,
        schema: {},
      };
    case "analyzePracticalTest":
      return {
        system: "Chef d'atelier expert. Évalue résultats test pratique.",
        user: `Poste : ${data.poste}\nConsigne : ${data.consigne}\nCritères : ${data.criteres.map((c: any) => `${c.id}: ${c.label} /${c.bareme}`).join("; ")}\nObs : ${data.observations || "(aucune)"}\nRéponds en JSON: {"notes":[{"id":"","note":0,"justification":""}],"total":0,"verdict":"VALIDÉ|VALIDÉ AVEC RÉSERVE|À REPASSER|ÉCHEC","commentaires":""}`,
        schema: {},
      };
    case "generateBehaviorTest":
      return {
        system: "Psychologue du travail industriel CIRTA AUTOMOTIVE.",
        user: `Test comportemental 10 questions pour : ${data.poste} (BU ${data.bu}). Mix: discipline, stabilité, sincérité, stress, sécurité, équipe, autonomie, éthique. Réponds en JSON: {"questions":[{"question":"","axe":""}]}`,
        schema: {},
      };
    case "analyzeBehavior":
      return {
        system: "Psychologue du travail industriel.",
        user: `Poste : ${data.poste}\n${data.qa.map((x: any, i: number) => `Q${i + 1} (${x.axe}): ${x.question}\nR: ${x.reponse || "(vide)"}`).join("\n\n")}\nRéponds en JSON: {"score":0-100,"profil":"","forces":[],"risques":[],"synthese":""}`,
        schema: {},
      };
    case "planRestart":
      return {
        system: "Directeur Industriel. Plan de redémarrage pragmatique.",
        user: `BU : ${data.buLabel}. Objectif : ${data.objectif || "standard"}.\nPostes : ${data.postes.map((p: any) => `${p.intitule} x${p.quantite} (${p.priorite})`).join("; ")}\nMachines : ${data.machinesEtat.map((m: any) => `${m.nom}:${m.etat}`).join("; ")}\nCandidats : ${data.candidatsDisponibles.length}\nRéponds en JSON: {"readiness":0-100,"niveauRisque":"faible|moyen|élevé|critique","postesCritiques":[],"ordreRecrutement":[{"poste":"","priorite":1,"justification":"","delaiCible":""}],"risques":[],"jalons":[],"synthese":""}`,
        schema: {},
      };
    case "generateRhEvaluation":
      return {
        system: "DOP CIRTA. Grilles d'évaluation RH industrielles courtes.",
        user: `Type : ${data.type}. Poste : ${data.poste} (BU ${data.bu}, ${data.experience}a, anc ${data.moisAnciennete ?? "?"}m). 8 questions max, mix technique/comportement/autonomie/potentiel, barème /5. Réponds en JSON: {"questions":[{"question":"","objectif":"","categorie":"technique|comportement|autonomie|potentiel","bareme":5}]}`,
        schema: {},
      };
    case "analyzeRhEvaluation":
      return {
        system: "DOP CIRTA. Décisions RH fermes et factuelles.",
        user: `Évaluation : ${data.type} — Poste : ${data.poste}\nNotes:\n${data.items.map((it: any, i: number) => `${i + 1}. ${it.question} — ${it.note}/${it.bareme} — ${it.commentaire || "—"}`).join("\n")}\nObs : ${data.observationsTerrain || "(aucune)"}\nRéponds en JSON: {"scoreGlobal":0-100,"verdict":"VALIDÉ|À CONSOLIDER|NON VALIDÉ","forces":[],"axesProgres":[],"decisionRecommandee":"","synthese":""}`,
        schema: {},
      };
  }
}

function extractJSON(text: string): any {
  // Essaie d'extraire le 1er bloc JSON valide
  const cleaned = text.replace(/```json|```/g, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Réponse IA non JSON");
  return JSON.parse(m[0]);
}

async function callOllama(task: AITask, data: any): Promise<any> {
  const { aiSettings } = useCirta.getState();
  const { ollamaUrl, ollamaModel } = aiSettings;
  const { system, user } = buildPrompt(task, data);

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const resp = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        format: "json",
        options: { temperature: 0.3 },
        messages: [
          { role: "system", content: system + " Réponds uniquement avec un objet JSON valide, sans texte autour." },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`Ollama ${resp.status}`);
    const j = await resp.json();
    const content: string = j.message?.content ?? j.response ?? "";
    return extractJSON(content);
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Ollama: délai dépassé (120s)");
    if (e.message?.includes("Failed to fetch")) {
      throw new Error(`Ollama injoignable sur ${ollamaUrl}. Vérifiez qu'Ollama tourne (ollama serve) et que le modèle ${ollamaModel} est installé.`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function callCloud(task: AITask, data: any): Promise<any> {
  return CLOUD_FN[task](data);
}

export interface RunAIOptions {
  provider?: AIProvider; // "local" | "cloud" | "auto" (défaut: auto = suit aiSettings)
  onProviderUsed?: (p: "local" | "cloud") => void;
}

/**
 * Exécute une tâche IA selon la politique choisie.
 * - "local" : Ollama uniquement, ne fallback PAS
 * - "cloud" : IA Lovable Cloud (consomme crédit)
 * - "auto"  : suit aiSettings (local d'abord, fallback cloud si autorisé)
 */
export async function runAI<T = any>(task: AITask, data: any, opts: RunAIOptions = {}): Promise<T> {
  const provider = opts.provider ?? "auto";
  const { aiSettings, bumpAIUsage } = useCirta.getState();

  // Forcé cloud
  if (provider === "cloud") {
    const r = await callCloud(task, data);
    bumpAIUsage("cloud");
    opts.onProviderUsed?.("cloud");
    return r;
  }

  // Forcé local — pas de fallback
  if (provider === "local") {
    const r = await callOllama(task, data);
    bumpAIUsage("local");
    opts.onProviderUsed?.("local");
    return r;
  }

  // Auto : essaye local d'abord (si activé), fallback cloud si autorisé
  if (aiSettings.preferLocal) {
    try {
      const r = await callOllama(task, data);
      bumpAIUsage("local");
      opts.onProviderUsed?.("local");
      return r;
    } catch (err: any) {
      if (!aiSettings.fallbackToCloud) throw err;
      console.warn("[IA] Ollama indisponible, bascule sur cloud :", err.message);
    }
  }
  const r = await callCloud(task, data);
  bumpAIUsage("cloud");
  opts.onProviderUsed?.("cloud");
  return r;
}

export async function pingOllama(url: string): Promise<{ ok: boolean; models?: string[]; error?: string }> {
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/tags`);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const j = await r.json();
    return { ok: true, models: (j.models ?? []).map((m: any) => m.name) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
