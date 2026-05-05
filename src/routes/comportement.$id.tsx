import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import { useCirta, type ComportementData } from "@/store/useCirta";
import { runAI, type AIProvider } from "@/lib/ai-client";
import { Cloud, HardDrive } from "lucide-react";
import { ArrowLeft, Sparkles, Printer, Save, Loader2, RotateCcw, Upload, X, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/comportement/$id")({ component: ComptPage });

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}

function ComptPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const data = useCirta((s) => s.comportements[id]);
  const save = useCirta((s) => s.saveComportement);
  const setScore = useCirta((s) => s.setScore);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reponses, setReponses] = useState<string[]>(data?.reponses ?? []);
  const [scan, setScan] = useState<string | undefined>(data?.scanReponses);

  if (!candidat) return <div className="p-6">Candidat introuvable</div>;

  const generer = async (provider: AIProvider = "auto") => {
    setLoading(true);
    try {
      const res = await runAI("generateBehaviorTest", { poste: candidat.posteVise, bu: candidat.bu }, { provider });
      const next: ComportementData = { candidatId: id, date: new Date().toISOString(), questions: res.questions, reponses: Array(res.questions.length).fill("") };
      save(next);
      setReponses(next.reponses!);
      toast.success(`Test généré (${res.questions.length} questions)`);
    } catch (e: any) { toast.error(e.message ?? "Erreur"); } finally { setLoading(false); }
  };

  const onScan = async (f?: File) => { if (f) setScan(await fileToDataUrl(f)); };
  const sauver = () => { save({ candidatId: id, reponses, scanReponses: scan }); toast.success("Enregistré"); };

  const analyser = async (provider: AIProvider = "auto") => {
    if (!data?.questions) return;
    setAnalyzing(true);
    try {
      const qa = data.questions.map((q, i) => ({ ...q, reponse: reponses[i] ?? "" }));
      const a = await runAI("analyzeBehavior", { poste: candidat.posteVise, qa, scanReponses: scan }, { provider });
      save({ candidatId: id, reponses, scanReponses: scan, analyse: a, scoreGlobal: a.score });
      setScore(id, a.score);
      toast.success(`Comportemental évalué — ${a.score}/100`);
    } catch (e: any) { toast.error(e.message ?? "Erreur"); } finally { setAnalyzing(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild><Link to="/candidats/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Fiche candidat</Link></Button>
        <div className="flex gap-2">
          {data?.questions && <Button variant="outline" onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>}
          {data?.questions && <Button variant="outline" onClick={generer} disabled={loading}><RotateCcw className="mr-2 h-4 w-4" /> Régénérer</Button>}
        </div>
      </div>

      <PageHeader
        title="Test comportemental"
        subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`}
        actions={data?.scoreGlobal != null ? <Badge variant="outline" className="text-base">Score : {data.scoreGlobal}%</Badge> : undefined}
      />

      {!data?.questions && (
        <Card className="no-print">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="mb-4 text-sm text-muted-foreground">Génère un test comportemental contextualisé.</p>
            <div className="flex flex-wrap justify-center gap-2"><Button size="lg" onClick={() => generer("auto")} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />} Générer (IA locale)</Button><Button size="lg" variant="outline" onClick={() => generer("cloud")} disabled={loading}><Cloud className="mr-2 h-4 w-4" /> IA avancée (cloud)</Button></div>
          </CardContent>
        </Card>
      )}

      {data?.questions && (
        <>
          <div className="print-only"><Letterhead title="Test comportemental" subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`} /></div>
          <Card>
            <CardHeader><CardTitle className="text-base">Questions ({data.questions.length})</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {data.questions.map((q, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline">{q.axe}</Badge>
                    <Label className="font-semibold">Q{i + 1}. {q.question}</Label>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Réponse…"
                    value={reponses[i] ?? ""}
                    onChange={(e) => { const n = [...reponses]; n[i] = e.target.value; setReponses(n); }}
                    className="print:border print:border-black print:min-h-[80px]"
                  />
                </div>
              ))}
              <div className="no-print">
                <Label>Feuille scannée (optionnel)</Label>
                <div className="mt-2 flex items-center gap-3">
                  {scan && <img src={scan} alt="" className="h-24 w-24 rounded border object-cover" />}
                  <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Importer<input type="file" accept="image/*" className="hidden" onChange={(e) => onScan(e.target.files?.[0])} /></label></Button>
                  {scan && <Button variant="ghost" size="sm" onClick={() => setScan(undefined)}><X className="mr-1 h-3 w-3" /> Retirer</Button>}
                </div>
              </div>
              <div className="flex justify-end gap-2 no-print">
                <Button variant="outline" onClick={sauver}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
                <Button onClick={() => analyser("auto")} disabled={analyzing}>{analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />} Analyser (local)</Button><Button variant="outline" onClick={() => analyser("cloud")} disabled={analyzing}><Cloud className="mr-2 h-4 w-4" /> IA avancée (cloud)</Button>
              </div>
            </CardContent>
          </Card>

          {data.analyse && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Évaluation IA</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><div className="text-3xl font-bold">{data.analyse.score}/100</div><Badge variant="outline">{data.analyse.profil}</Badge></div>
                <p>{data.analyse.synthese}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs font-bold uppercase text-success">Forces</div>{data.analyse.forces.map((f, i) => <div key={i}>✓ {f}</div>)}</div>
                  <div><div className="text-xs font-bold uppercase text-destructive">Risques</div>{data.analyse.risques.map((f, i) => <div key={i}>⚠ {f}</div>)}</div>
                </div>
                <div className="flex justify-end no-print"><Button size="sm" onClick={() => navigate({ to: "/candidats/$id", params: { id } })}>Retour fiche candidat</Button></div>
              </CardContent>
            </Card>
          )}

          <div className="print-only"><LetterheadFooter /></div>
        </>
      )}
    </div>
  );
}
