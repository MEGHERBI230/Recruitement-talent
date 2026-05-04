import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY non configurée");
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 429) throw new Error("Limite IA atteinte, réessayez dans un instant.");
    if (resp.status === 402) throw new Error("Crédits IA épuisés. Ajoutez du crédit dans Settings > Workspace > Usage.");
    throw new Error(`Erreur IA ${resp.status}: ${t.slice(0, 200)}`);
  }
  return resp.json();
}

function extractToolArgs(json: any) {
  const tc = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) {
    // fallback: try parse content as JSON
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    const m = content.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : content);
  }
  return JSON.parse(tc.function.arguments);
}

// ========== GÉNÉRATION ENTRETIEN ==========
export const generateInterview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const x = d as { poste: string; bu: string; experience: number; diplome: string; competences?: string[]; machines?: string[] };
    return x;
  })
  .handler(async ({ data }) => {
    const sys =
      "Tu es un Directeur des Opérations expérimenté chez CIRTA AUTOMOTIVE (industrie automobile algérienne : tôlerie, caoutchouc, usinage CNC, fonderie alu). Tu prépares des guides d'entretien structurés, professionnels, opérationnels.";
    const user = `Génère un guide d'entretien de 10 questions pour le poste suivant :
- Poste : ${data.poste}
- Business Unit : ${data.bu}
- Expérience requise : ${data.experience} ans
- Diplôme requis : ${data.diplome}
- Compétences clés : ${(data.competences ?? []).join(", ") || "—"}
- Machines associées : ${(data.machines ?? []).join(", ") || "—"}

Mix : 2 motivation/parcours, 4 techniques précises (machines/process), 2 sécurité HSE, 2 mises en situation.`;

    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "interview",
          description: "Guide d'entretien structuré",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    objectif: { type: "string", description: "Ce qu'on cherche à évaluer" },
                    categorie: { type: "string", enum: ["motivation", "technique", "securite", "situation"] },
                  },
                  required: ["question", "objectif", "categorie"],
                },
              },
            },
            required: ["questions"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "interview" } },
    });
    return extractToolArgs(j) as { questions: { question: string; objectif: string; categorie: string }[] };
  });

// ========== GÉNÉRATION TEST PRATIQUE ==========
export const generatePracticalTest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { poste: string; bu: string; machines?: string[]; competences?: string[] })
  .handler(async ({ data }) => {
    const sys = "Tu es chef d'atelier industriel CIRTA AUTOMOTIVE. Tu conçois des tests pratiques ATELIER ULTRA-LÉGERS, RÉALISTES, FAISABLES SANS MOBILISER LA PRODUCTION. Le recruteur ne dispose PAS d'une vraie machine en marche, ni de programme G/Siemens/Fanuc à exécuter, ni de zéro machine, ni d'EPI complets, ni de matière première coûteuse. Le test doit être réalisable avec UN MINIMUM de matériel d'atelier courant.";
    const user = `Conçois un test pratique ALLÉGÉ pour le poste : ${data.poste} (BU ${data.bu}).
Machines de référence (à titre théorique seulement, NE PAS exiger leur mise en route) : ${(data.machines ?? []).join(", ") || "—"}.
Compétences à évaluer : ${(data.competences ?? []).join(", ") || "—"}.

CONTRAINTES STRICTES :
- UNE SEULE pièce ou tâche simple (forme géométrique facile : cube, cylindre, plaque percée, etc.) OU un exercice papier/diagnostic.
- PAS de programmation G-code, Siemens, Fanuc, ni de réglage zéro machine, ni de mise en route machine.
- Matériel limité au strict minimum (ex : pied à coulisse, palmer/micromètre, règle, crayon, feuille, éventuellement une pièce déjà préparée à mesurer/contrôler ou à monter/démonter).
- PAS d'EPI complexes (pas de demande de chaussures de sécurité, casque, lunettes spécifiques) — le candidat est en tenue normale, le test reste sûr.
- Durée courte : 15 à 30 minutes maximum.
- Doit pouvoir être donné sur une simple feuille imprimée.

Le test doit comporter :
- une consigne claire et courte (ce que le candidat doit faire : mesurer, contrôler, identifier, calculer, dessiner, monter…)
- la durée estimée (15 à 30 min)
- le matériel minimal (3 éléments max)
- les étapes attendues (4 à 6 étapes simples)
- 4 critères d'évaluation chiffrés (chacun noté sur 5)
- 1 ou 2 points de sécurité simples (bon sens atelier, pas d'EPI lourds).`;

    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "practical_test",
          parameters: {
            type: "object",
            properties: {
              titre: { type: "string" },
              duree: { type: "string" },
              materiel: { type: "array", items: { type: "string" } },
              consigne: { type: "string", description: "Consigne complète remise au candidat" },
              etapes: { type: "array", items: { type: "string" } },
              securite: { type: "array", items: { type: "string" } },
              criteres: {
                type: "array",
                items: {
                  type: "object",
                  properties: { id: { type: "string" }, label: { type: "string" }, bareme: { type: "number" } },
                  required: ["id", "label", "bareme"],
                },
              },
            },
            required: ["titre", "duree", "consigne", "etapes", "criteres", "materiel", "securite"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "practical_test" } },
    });
    return extractToolArgs(j);
  });

// ========== GÉNÉRATION TEST COMPORTEMENTAL ==========
export const generateBehaviorTest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { poste: string; bu: string })
  .handler(async ({ data }) => {
    const sys = "Tu es psychologue du travail spécialisé en industrie. Tu conçois des tests comportementaux courts adaptés au contexte industriel CIRTA AUTOMOTIVE.";
    const user = `Crée un test comportemental de 10 questions pour le poste : ${data.poste} (BU ${data.bu}).
Mix : discipline, stabilité, sincérité, gestion du stress, sécurité, esprit d'équipe, autonomie, éthique.
Chaque question doit être ouverte ou en mise en situation, pour que le candidat réponde par écrit.`;

    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "behavior_test",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    axe: { type: "string", description: "Trait évalué" },
                  },
                  required: ["question", "axe"],
                },
              },
            },
            required: ["questions"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "behavior_test" } },
    });
    return extractToolArgs(j) as { questions: { question: string; axe: string }[] };
  });

// ========== ANALYSE ENTRETIEN ==========
export const analyzeInterview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { poste: string; qa: { question: string; reponse: string }[] })
  .handler(async ({ data }) => {
    const sys = "Tu es Directeur des Opérations CIRTA AUTOMOTIVE. Tu analyses sans complaisance les réponses d'un candidat industriel. Tu DÉTECTES : (a) les incohérences entre réponses, (b) le jargon technique non étayé, (c) les expériences exagérées, (d) les contradictions. Tu produis un score, un risque de SURÉVALUATION, et tu proposes des questions de relance ciblées (pièges, vérifications) que le recruteur posera ensuite.";
    const user = `Poste : ${data.poste}\n\nQuestions et réponses :\n${data.qa.map((x, i) => `Q${i + 1}: ${x.question}\nR: ${x.reponse || "(pas de réponse)"}`).join("\n\n")}`;
    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "evaluate",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number", description: "0 à 100" },
              recommandation: { type: "string", enum: ["FORT", "BON", "MOYEN", "FAIBLE", "REJET"] },
              forces: { type: "array", items: { type: "string" } },
              faiblesses: { type: "array", items: { type: "string" } },
              synthese: { type: "string" },
              risqueSurevaluation: { type: "string", enum: ["faible", "moyen", "élevé"] },
              incoherences: { type: "array", items: { type: "string" } },
              relances: { type: "array", items: { type: "string" }, description: "3 à 5 questions de relance / pièges" },
            },
            required: ["score", "recommandation", "forces", "faiblesses", "synthese", "risqueSurevaluation", "incoherences", "relances"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "evaluate" } },
    });
    return extractToolArgs(j);
  });

// ========== ANALYSE TEST PRATIQUE (texte + photos) ==========
export const analyzePracticalTest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as {
    poste: string;
    consigne: string;
    criteres: { id: string; label: string; bareme: number }[];
    observations?: string;
    photos?: string[]; // dataURLs
    scanReponses?: string; // dataURL d'une feuille remplie scannée
  })
  .handler(async ({ data }) => {
    const sys = "Tu es chef d'atelier expert. Tu évalues le résultat d'un test pratique en analysant les photos de la pièce produite et/ou la feuille de réponses scannée du candidat. Sois précis, technique, sans complaisance.";
    const userText = `Poste : ${data.poste}\n\nCONSIGNE :\n${data.consigne}\n\nCRITÈRES :\n${data.criteres.map((c) => `- ${c.id} | ${c.label} (sur ${c.bareme})`).join("\n")}\n\nObservations de l'évaluateur : ${data.observations || "(aucune)"}\n\nAnalyse les images jointes (pièce produite et/ou feuille scannée), puis note chaque critère et donne un verdict.`;
    const content: any[] = [{ type: "text", text: userText }];
    for (const url of data.photos ?? []) content.push({ type: "image_url", image_url: { url } });
    if (data.scanReponses) content.push({ type: "image_url", image_url: { url: data.scanReponses } });

    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content }],
      tools: [{
        type: "function",
        function: {
          name: "evaluate_practical",
          parameters: {
            type: "object",
            properties: {
              notes: {
                type: "array",
                items: {
                  type: "object",
                  properties: { id: { type: "string" }, note: { type: "number" }, justification: { type: "string" } },
                  required: ["id", "note", "justification"],
                },
              },
              total: { type: "number", description: "0 à 100" },
              verdict: { type: "string", enum: ["VALIDÉ", "VALIDÉ AVEC RÉSERVE", "À REPASSER", "ÉCHEC"] },
              commentaires: { type: "string" },
            },
            required: ["notes", "total", "verdict", "commentaires"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "evaluate_practical" } },
    });
    return extractToolArgs(j);
  });

// ========== ANALYSE COMPORTEMENT ==========
export const analyzeBehavior = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { poste: string; qa: { question: string; axe: string; reponse: string }[]; scanReponses?: string })
  .handler(async ({ data }) => {
    const sys = "Tu es psychologue du travail industriel. Évalue avec sévérité bienveillante les réponses comportementales d'un candidat.";
    const userText = `Poste : ${data.poste}\n\nRéponses :\n${data.qa.map((x, i) => `Q${i + 1} (${x.axe}): ${x.question}\nR: ${x.reponse || "(pas de réponse)"}`).join("\n\n")}`;
    const content: any[] = [{ type: "text", text: userText }];
    if (data.scanReponses) content.push({ type: "image_url", image_url: { url: data.scanReponses } });
    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content }],
      tools: [{
        type: "function",
        function: {
          name: "evaluate_behavior",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number" },
              profil: { type: "string", description: "Type de personnalité au travail" },
              forces: { type: "array", items: { type: "string" } },
              risques: { type: "array", items: { type: "string" } },
              synthese: { type: "string" },
            },
            required: ["score", "profil", "forces", "risques", "synthese"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "evaluate_behavior" } },
    });
    return extractToolArgs(j);
  });

// ========== PLAN REDÉMARRAGE BU ==========
export const planRestart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as {
    bu: string;
    buLabel: string;
    postes: { intitule: string; quantite: number; priorite: string; experienceMin: number; competences: string[]; machines: string[] }[];
    machinesEtat: { nom: string; etat: string; criticite: string }[];
    candidatsDisponibles: { posteVise: string; score: number; statut: string }[];
    objectif?: string;
  })
  .handler(async ({ data }) => {
    const sys = "Tu es Directeur Industriel expérimenté. Tu produis un plan de redémarrage opérationnel pragmatique d'une Business Unit automobile. Tu hiérarchises les recrutements, identifies les postes critiques, et signales les risques industriels concrets.";
    const user = `BU à redémarrer : ${data.buLabel}
Objectif utilisateur : ${data.objectif || "redémarrage standard"}

POSTES OUVERTS :
${data.postes.map((p) => `- ${p.intitule} (×${p.quantite}, ${p.priorite}, exp ${p.experienceMin}a) — machines: ${p.machines.join(", ") || "—"}`).join("\n")}

PARC MACHINES :
${data.machinesEtat.map((m) => `- ${m.nom} [${m.criticite}] : ${m.etat}`).join("\n")}

CANDIDATS DÉJÀ EN PIPELINE :
${data.candidatsDisponibles.map((c) => `- ${c.posteVise} | score ${c.score}% | ${c.statut}`).join("\n") || "(aucun)"}

Produis un plan de redémarrage : ordre de recrutement, postes critiques, risques, jalons.`;

    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "restart_plan",
          parameters: {
            type: "object",
            properties: {
              readiness: { type: "number", description: "0 à 100, niveau de préparation actuel" },
              niveauRisque: { type: "string", enum: ["faible", "moyen", "élevé", "critique"] },
              postesCritiques: { type: "array", items: { type: "string" } },
              ordreRecrutement: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    poste: { type: "string" },
                    priorite: { type: "number", description: "1 = à recruter en premier" },
                    justification: { type: "string" },
                    delaiCible: { type: "string", description: "ex: '2 semaines'" },
                  },
                  required: ["poste", "priorite", "justification", "delaiCible"],
                },
              },
              risques: { type: "array", items: { type: "string" } },
              jalons: { type: "array", items: { type: "string" }, description: "étapes clés du redémarrage" },
              synthese: { type: "string" },
            },
            required: ["readiness", "niveauRisque", "postesCritiques", "ordreRecrutement", "risques", "jalons", "synthese"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "restart_plan" } },
    });
    return extractToolArgs(j);
  });

// ========== ÉVALUATIONS RH (période d'essai, renouvellement, CDD→CDI) ==========
export const generateRhEvaluation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as {
    type: "periode_essai" | "renouvellement_cdd" | "cdd_to_cdi";
    poste: string;
    bu: string;
    experience: number;
    competences?: string[];
    machines?: string[];
    moisAnciennete?: number;
  })
  .handler(async ({ data }) => {
    const ctxByType: Record<string, { titre: string; objectif: string; profondeur: string }> = {
      periode_essai: {
        titre: "Validation période d'essai",
        objectif: "Décider si le collaborateur valide sa période d'essai (≈ 3 à 6 mois) et est apte à être confirmé.",
        profondeur: "Centre l'évaluation sur l'intégration, la tenue de poste, le respect des règles, la fiabilité quotidienne, la qualité du travail réalisé pendant l'essai.",
      },
      renouvellement_cdd: {
        titre: "Renouvellement CDD (1 an)",
        objectif: "Décider si l'on renouvelle le CDD pour une nouvelle période d'un an.",
        profondeur: "Évalue la performance sur la durée écoulée, l'évolution des compétences, l'autonomie acquise, la valeur ajoutée pour la BU et la motivation à poursuivre.",
      },
      cdd_to_cdi: {
        titre: "Passage CDD → CDI",
        objectif: "Décider de transformer le CDD en CDI (engagement long terme).",
        profondeur: "Évalue la maîtrise complète du poste, la fiabilité long terme, la capacité à transmettre / encadrer, la loyauté et l'alignement avec la stratégie industrielle.",
      },
    };
    const ctx = ctxByType[data.type];
    const sys = "Tu es Directeur des Opérations CIRTA AUTOMOTIVE. Tu conçois des grilles d'évaluation RH industrielles, courtes, opérationnelles, signées par le manager. Pas de blabla RH générique : questions concrètes, vérifiables sur le terrain, adaptées à l'industrie automobile algérienne.";
    const user = `Génère une grille d'évaluation pour : ${ctx.titre}.
Poste : ${data.poste} (BU ${data.bu})
Expérience candidat : ${data.experience} ans — Ancienneté chez CIRTA : ${data.moisAnciennete ?? "?"} mois
Compétences clés : ${(data.competences ?? []).join(", ") || "—"}
Machines : ${(data.machines ?? []).join(", ") || "—"}

Objectif : ${ctx.objectif}
${ctx.profondeur}

Produis 8 questions max, mix de :
- Tenue de poste (technique, qualité, productivité)
- Comportement (assiduité, sécurité, respect règles, esprit d'équipe)
- Autonomie & initiative
- Évolution / potentiel
Chaque question a un objectif clair et un barème /5.`;
    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "rh_eval",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    objectif: { type: "string" },
                    categorie: { type: "string", enum: ["technique", "comportement", "autonomie", "potentiel"] },
                    bareme: { type: "number" },
                  },
                  required: ["question", "objectif", "categorie", "bareme"],
                },
              },
            },
            required: ["questions"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "rh_eval" } },
    });
    return extractToolArgs(j) as { questions: { question: string; objectif: string; categorie: string; bareme: number }[] };
  });

export const analyzeRhEvaluation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as {
    type: "periode_essai" | "renouvellement_cdd" | "cdd_to_cdi";
    poste: string;
    items: { question: string; objectif: string; bareme: number; note: number; commentaire: string }[];
    observationsTerrain?: string;
  })
  .handler(async ({ data }) => {
    const decisionLabel: Record<string, string> = {
      periode_essai: "Valider / prolonger / ne pas valider la période d'essai",
      renouvellement_cdd: "Renouveler / ne pas renouveler le CDD",
      cdd_to_cdi: "Transformer en CDI / maintenir en CDD / ne pas confirmer",
    };
    const sys = "Tu es Directeur des Opérations CIRTA AUTOMOTIVE. Tu rends des décisions RH fermes, justes, motivées par les faits. Tu ne fais pas de complaisance.";
    const user = `Évaluation : ${data.type} — Poste : ${data.poste}
Notes :
${data.items.map((it, i) => `${i + 1}. [${it.objectif}] ${it.question} — ${it.note}/${it.bareme} — ${it.commentaire || "(sans commentaire)"}`).join("\n")}

Observations terrain du manager :
${data.observationsTerrain || "(aucune)"}

Donne : score global /100, verdict (VALIDÉ / À CONSOLIDER / NON VALIDÉ), forces (3 max), axes de progrès (3 max), décision recommandée concrète parmi : ${decisionLabel[data.type]}, et une synthèse exécutive de 3 lignes max.`;
    const j = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "rh_decision",
          parameters: {
            type: "object",
            properties: {
              scoreGlobal: { type: "number" },
              verdict: { type: "string", enum: ["VALIDÉ", "À CONSOLIDER", "NON VALIDÉ"] },
              forces: { type: "array", items: { type: "string" } },
              axesProgres: { type: "array", items: { type: "string" } },
              decisionRecommandee: { type: "string" },
              synthese: { type: "string" },
            },
            required: ["scoreGlobal", "verdict", "forces", "axesProgres", "decisionRecommandee", "synthese"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "rh_decision" } },
    });
    return extractToolArgs(j);
  });
