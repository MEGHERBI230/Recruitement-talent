import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCirta, DEFAULT_WEIGHTS, DEFAULT_AI_SETTINGS, type ScoreWeights, type AISettings } from "@/store/useCirta";
import { POSTES, MACHINES } from "@/data/cirta";
import { toast } from "sonner";
import { RotateCcw, Save, Upload, Trash2, HardDrive, Cloud, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AIUsageBadge } from "@/components/AIControls";
import { pingOllama } from "@/lib/ai-client";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";

export const Route = createFileRoute("/parametres")({ component: Parametres });

const profilSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  fonction: z.string().trim().min(1, "Fonction requise").max(100),
  email: z.string().trim().email("Email invalide").max(255).or(z.literal("")),
  telephone: z.string().trim().max(30).regex(/^[+0-9 ()\-./]*$/, "Téléphone invalide").or(z.literal("")),
});

function Parametres() {
  const reset = useCirta((s) => s.reset);
  const user = useCirta((s) => s.user);
  const updateUser = useCirta((s) => s.updateUser);
  const aiSettings = useCirta((s) => s.aiSettings);
  const updateAISettings = useCirta((s) => s.updateAISettings);
  const resetAIUsage = useCirta((s) => s.resetAIUsage);
  const [form, setForm] = useState({ nom: user.nom, fonction: user.fonction, email: user.email, telephone: user.telephone });
  const [weights, setWeights] = useState<ScoreWeights>(user.weights ?? DEFAULT_WEIGHTS);
  const [ai, setAi] = useState<AISettings>(aiSettings);
  const [pingState, setPingState] = useState<{ loading: boolean; ok?: boolean; models?: string[]; error?: string }>({ loading: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const testOllama = async () => {
    setPingState({ loading: true });
    const r = await pingOllama(ai.ollamaUrl);
    setPingState({ loading: false, ...r });
    if (r.ok) toast.success(`Ollama joignable — ${r.models?.length ?? 0} modèle(s)`);
    else toast.error(`Ollama injoignable : ${r.error}`);
  };

  const saveAI = () => {
    updateAISettings(ai);
    toast.success("Paramètres IA enregistrés");
  };

  const save = () => {
    const r = profilSchema.safeParse(form);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Données invalides"); return; }
    updateUser(r.data);
    toast.success("Profil enregistré");
  };

  const onSignature = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error("Image trop lourde (max 2 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      updateUser({ signature: reader.result as string });
      toast.success("Signature enregistrée — apparaîtra sur les documents");
    };
    reader.readAsDataURL(file);
  };

  const totalW = weights.competences + weights.experience + weights.diplome + weights.machines;
  const saveWeights = () => {
    if (totalW <= 0) { toast.error("La somme des pondérations doit être > 0"); return; }
    updateUser({ weights });
    toast.success(`Pondération IA mise à jour (total ${totalW} pts)`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Paramètres" subtitle="Configuration & informations système" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Profil utilisateur (en-tête des documents)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label>Nom complet</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={100} /></div>
            <div><Label>Fonction</Label><Input value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} maxLength={100} /></div>
            <div><Label>Email professionnel</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} placeholder="n.megherbi@cirtaautomotive-dz.com" /></div>
            <div><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} maxLength={30} placeholder="+213 5XX XX XX XX" /></div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={save}><Save className="mr-2 h-4 w-4" /> Enregistrer le profil</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Signature, cachet & griffe</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Téléverse une image (PNG/JPG, fond blanc ou transparent, max 2 Mo) regroupant ta signature, ton cachet et ta griffe. Elle sera apposée automatiquement en bas des documents imprimés (rapports, tests, entretiens).</p>
            <div className="flex items-start gap-4">
              <div className="flex h-32 w-64 items-center justify-center overflow-hidden rounded border border-dashed border-border bg-muted/30">
                {user.signature ? (
                  <img src={user.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Aucune signature</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSignature(f); e.target.value = ""; }} />
                <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Téléverser</Button>
                {user.signature && (
                  <Button variant="ghost" onClick={() => { updateUser({ signature: undefined }); toast.success("Signature supprimée"); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Pondération IA — modifiable</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Ajuste librement le poids de chaque critère. La note finale est ramenée sur 100. Total actuel : <b>{totalW} pts</b>.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div><Label>Compétences</Label><Input type="number" min={0} max={100} value={weights.competences} onChange={(e) => setWeights({ ...weights, competences: Number(e.target.value) || 0 })} /></div>
              <div><Label>Expérience</Label><Input type="number" min={0} max={100} value={weights.experience} onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) || 0 })} /></div>
              <div><Label>Diplôme</Label><Input type="number" min={0} max={100} value={weights.diplome} onChange={(e) => setWeights({ ...weights, diplome: Number(e.target.value) || 0 })} /></div>
              <div><Label>Machines</Label><Input type="number" min={0} max={100} value={weights.machines} onChange={(e) => setWeights({ ...weights, machines: Number(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setWeights(DEFAULT_WEIGHTS)}>Réinitialiser (40/25/15/20)</Button>
              <Button onClick={saveWeights}><Save className="mr-2 h-4 w-4" /> Appliquer la pondération</Button>
            </div>
            <p className="text-xs text-muted-foreground">Recommandation : ≥85 FORT • ≥70 BON • ≥55 MOYEN • ≥40 FAIBLE • &lt;40 REJET</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" /> IA hybride — Local (Ollama) par défaut, Cloud sur demande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              L'IA <b>locale (Ollama)</b> est utilisée par défaut pour toutes les tâches : analyse CV, génération de questionnaires, scoring, analyse d'entretien, génération de tests.
              L'IA <b>Cloud (Lovable AI)</b> n'est utilisée que sur clic explicite du bouton « IA avancée » ou en fallback si Ollama est indisponible.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>URL Ollama</Label>
                <Input value={ai.ollamaUrl} onChange={(e) => setAi({ ...ai, ollamaUrl: e.target.value })} placeholder="http://localhost:11434" />
              </div>
              <div>
                <Label>Modèle local</Label>
                <Input value={ai.ollamaModel} onChange={(e) => setAi({ ...ai, ollamaModel: e.target.value })} placeholder="llama3.1, mistral, qwen2.5..." />
              </div>
            </div>
            <div className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <div className="text-sm font-medium">IA locale par défaut</div>
                <p className="text-xs text-muted-foreground">Toutes les tâches standard utilisent Ollama (gratuit, confidentiel, hors ligne).</p>
              </div>
              <Switch checked={ai.preferLocal} onCheckedChange={(v) => setAi({ ...ai, preferLocal: v })} />
            </div>
            <div className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <div className="text-sm font-medium">Fallback cloud automatique</div>
                <p className="text-xs text-muted-foreground">Si Ollama échoue, bascule sur l'IA cloud. Désactivez pour zéro consommation involontaire.</p>
              </div>
              <Switch checked={ai.fallbackToCloud} onCheckedChange={(v) => setAi({ ...ai, fallbackToCloud: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={testOllama} disabled={pingState.loading}>
                {pingState.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />}
                Tester la connexion Ollama
              </Button>
              {pingState.ok === true && (
                <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Joignable — {pingState.models?.length ?? 0} modèle(s){pingState.models && pingState.models.length > 0 ? ` : ${pingState.models.slice(0, 3).join(", ")}` : ""}</span>
              )}
              {pingState.ok === false && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive"><XCircle className="h-3.5 w-3.5" /> {pingState.error}</span>
              )}
              <div className="flex-1" />
              <Button onClick={saveAI}><Save className="mr-2 h-4 w-4" /> Enregistrer config IA</Button>
            </div>
            <div className="rounded border border-info/30 bg-info/5 p-3 text-xs">
              <div className="font-bold uppercase text-info mb-1">Installation Ollama (rappel)</div>
              <ol className="list-inside list-decimal space-y-0.5 text-muted-foreground">
                <li>Télécharger sur <code>ollama.com/download</code> puis lancer <code>ollama serve</code></li>
                <li>Installer un modèle : <code>ollama pull {ai.ollamaModel}</code></li>
                <li>Cliquer « Tester la connexion » ci-dessus</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4" /> Indicateur de consommation IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AIUsageBadge />
            <p className="text-xs text-muted-foreground">Local = gratuit, confidentiel. Cloud = consomme des crédits Lovable AI.</p>
            <Button variant="outline" size="sm" onClick={() => { resetAIUsage(); toast.success("Compteur remis à zéro"); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Remettre à zéro
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Entreprise (en-tête & sidebar)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Le nom et le logo de l'entreprise apparaîtront en haut de l'application et sur tous les documents imprimés. Laissez vide pour utiliser uniquement « Recruitment Assistant » avec le logo générique.</p>
            <div>
              <Label>Nom de l'entreprise</Label>
              <Input
                value={user.companyName ?? ""}
                onChange={(e) => updateUser({ companyName: e.target.value })}
                maxLength={120}
                placeholder="Ex : CIRTA AUTOMOTIVE"
              />
            </div>
            <div>
              <Label>Logo de l'entreprise (PNG/JPG, max 2 Mo)</Label>
              <div className="mt-2 flex items-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded border border-dashed border-border bg-muted/30">
                  {user.companyLogo ? (
                    <img src={user.companyLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center px-1">Logo générique</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 2 * 1024 * 1024) { toast.error("Image trop lourde (max 2 Mo)"); return; }
                      const r = new FileReader();
                      r.onload = () => { updateUser({ companyLogo: r.result as string }); toast.success("Logo enregistré"); };
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }}
                  />
                  {user.companyLogo && (
                    <Button variant="ghost" size="sm" onClick={() => { updateUser({ companyLogo: undefined }); toast.success("Logo supprimé — logo générique restauré"); }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Retirer le logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Référentiel chargé</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Postes : <b>{POSTES.length}</b> intitulés</div>
            <div>Machines : <b>{MACHINES.length}</b> équipements</div>
            <div>Business Units : <b>5</b> (BU1 à BU4 + Transverse)</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Données</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">Les données sont stockées localement (navigateur). Vous pouvez réinitialiser à tout moment.</p>
            <Button variant="outline" onClick={() => { reset(); toast.success("Données réinitialisées"); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser les données
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
