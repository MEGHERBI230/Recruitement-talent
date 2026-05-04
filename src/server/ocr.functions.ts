import { createServerFn } from "@tanstack/react-start";

export const extractMachinePlate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { imageBase64?: string };
    if (!d?.imageBase64) throw new Error("imageBase64 requis");
    return { imageBase64: d.imageBase64 };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY non configurée");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:image/jpeg;base64,${data.imageBase64}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en lecture de plaques signalétiques de machines industrielles. Extrait les informations visibles sur la plaque.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Lis cette plaque signalétique et retourne UNIQUEMENT un JSON {\"nom\":\"...\",\"marque\":\"...\",\"fonction\":\"...\"}. nom = modèle/désignation, marque = constructeur + modèle/puissance, fonction = usage industriel deviné.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI Gateway ${resp.status}: ${t.slice(0, 200)}`);
    }
    const j = await resp.json();
    const txt: string = j.choices?.[0]?.message?.content ?? "{}";
    const match = txt.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(match ? match[0] : txt);
    } catch {
      return { nom: "", marque: "", fonction: "" };
    }
  });
