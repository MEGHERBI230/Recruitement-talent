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
    const sys = "Tu es un chef d'atelier industriel expert. Tu conçois des tests pratiques atelier réalistes et imprimables, à remettre au candidat sur papier.";
    const user = `Conçois un test pratique atelier pour le poste : ${data.poste} (BU ${data.bu}).
Machines à utiliser : ${(data.machines ?? []).join(", ") || "selon disponibilité"}.
Compétences à évaluer : ${(data.competences ?? []).join(", ") || "—"}.

Le test doit comporter :
- une consigne claire (ce que le candidat doit produire/régler/diagnostiquer)
- la durée estimée
- le matériel nécessaire
- les étapes attendues
- les critères d'évaluation chiffrés (4 à 6 critères, chacun noté sur 5)
- les pièges/points de sécurité à observer.`;

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
    const sys = "Tu es Directeur des Opérations CIRTA. Analyse rigoureusement les réponses d'un candidat à un entretien et donne une évaluation chiffrée et argumentée.";
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
            },
            required: ["score", "recommandation", "forces", "faiblesses", "synthese"],
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
