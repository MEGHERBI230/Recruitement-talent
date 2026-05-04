import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import { useCirta, type TestData } from "@/store/useCirta";
import { POSTES } from "@/data/cirta";
import { generatePracticalTest, analyzePracticalTest } from "@/server/ai.functions";
import { ArrowLeft, Sparkles, Printer, Save, Loader2, RotateCcw, Camera, Upload, X, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/tests/$id")({ component: TestPage });

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}

function TestPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const data = useCirta((s) => s.tests[id]);
  const save = useCirta((s) => s.saveTest);
  const setScore = useCirta((s) => s.setScore);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [observations, setObservations] = useState(data?.observations ?? "");
  const [photos, setPhotos] = useState<string[]>(data?.photos ?? []);
  const [scan, setScan] = useState<string | undefined>(data?.scanReponses);

  if (!candidat) return <div className="p-6">Candidat introuvable</div>;
  const poste = POSTES.find((p) => p.intitule === candidat.posteVise);

  const generer = async () => {
    setLoading(true);
    try {
      const res = await generatePracticalTest({ data: { poste: candidat.posteVise, bu: candidat.bu, machines: poste?.machines, competences: poste?.competences } });
      const next: TestData = { candidatId: id, date: new Date().toISOString(), test: res };
      save(next);
      toast.success("Test pratique généré");
    } catch (e: any) { toast.error(e.message ?? "Erreur"); } finally { setLoading(false); }
  };

  const onPhotos = async (files: FileList | null) => {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setPhotos((p) => [...p, ...urls]);
  };
  const onScan = async (f?: File) => { if (f) setScan(await fileToDataUrl(f)); };

  const sauver = () => { save({ candidatId: id, observations, photos, scanReponses: scan }); toast.success("Enregistré"); };

  const analyser = async () => {
    if (!data?.test) return;
    setAnalyzing(true);
    try {
      const a = await analyzePracticalTest({
        data: { poste: candidat.posteVise, consigne: data.test.consigne, criteres: data.test.criteres, observations, photos, scanReponses: scan },
      });
      save({ candidatId: id, observations, photos, scanReponses: scan, analyse: a, scoreGlobal: a.total });
      setScore(id, a.total);
      toast.success(`Test évalué — ${a.total}/100 (${a.verdict})`);
    } catch (e: any) { toast.error(e.message ?? "Erreur"); } finally { setAnalyzing(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild><Link to="/candidats/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Fiche candidat</Link></Button>
        <div className="flex gap-2">
          {data?.test && <Button variant="outline" onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer test</Button>}
          {data?.test && <Button variant="outline" onClick={generer} disabled={loading}><RotateCcw className="mr-2 h-4 w-4" /> Régénérer</Button>}
        </div>
      </div>

      <PageHeader
        title="Test pratique atelier"
        subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`}
        actions={data?.scoreGlobal != null ? <Badge variant="outline" className="text-base">Score : {data.scoreGlobal}%</Badge> : undefined}
      />

      {!data?.test && (
        <Card className="no-print">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="mb-4 text-sm text-muted-foreground">Génère un test pratique adapté au poste, aux machines et aux compétences requises.</p>
            <Button size="lg" onClick={generer} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Générer le test pratique</Button>
          </CardContent>
        </Card>
      )}

      {data?.test && (
        <>
          <div className="print-only"><Letterhead title="Test pratique atelier" subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`} /></div>

          <Card className="print-area">
            <CardHeader><CardTitle>{data.test.titre}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3"><div><b>Durée :</b> {data.test.duree}</div><div><b>Poste :</b> {candidat.posteVise}</div></div>
              <div><b>Matériel :</b><ul className="ml-5 list-disc">{data.test.materiel.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              <div><b>Consigne :</b><p className="whitespace-pre-line">{data.test.consigne}</p></div>
              <div><b>Étapes :</b><ol className="ml-5 list-decimal">{data.test.etapes.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
              <div><b>Sécurité :</b><ul className="ml-5 list-disc">{data.test.securite.map((x, i) => <li key={i}>⚠ {x}</li>)}</ul></div>
              <div>
                <b>Critères d'évaluation :</b>
                <table className="mt-2 w-full border-collapse text-xs">
                  <thead><tr className="border-b border-border"><th className="p-2 text-left">Critère</th><th className="p-2 text-right">Note</th></tr></thead>
                  <tbody>{data.test.criteres.map((c) => <tr key={c.id} className="border-b border-border"><td className="p-2">{c.label}</td><td className="p-2 text-right">__ / {c.bareme}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="hidden print:block">
                <p className="mt-6"><b>Signature évaluateur :</b> ____________________</p>
                <p><b>Signature candidat :</b> ____________________</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 no-print">
            <CardHeader><CardTitle className="text-base">Résultats du candidat</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Observations de l'évaluateur</Label>
                <Textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
              </div>
              <div>
                <Label>Photos de la pièce produite (analyse IA)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt="" className="h-24 w-24 rounded border border-border object-cover" />
                      <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded border border-dashed border-border hover:bg-accent">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => onPhotos(e.target.files)} />
                  </label>
                </div>
              </div>
              <div>
                <Label>Feuille de réponses scannée (optionnel)</Label>
                <div className="mt-2 flex items-center gap-3">
                  {scan && <img src={scan} alt="" className="h-24 w-24 rounded border border-border object-cover" />}
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Importer scan<input type="file" accept="image/*" className="hidden" onChange={(e) => onScan(e.target.files?.[0])} /></label>
                  </Button>
                  {scan && <Button variant="ghost" size="sm" onClick={() => setScan(undefined)}><X className="mr-1 h-3 w-3" /> Retirer</Button>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={sauver}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
                <Button onClick={analyser} disabled={analyzing}>
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                  Analyser avec l'IA
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.analyse && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Évaluation IA</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">{data.analyse.total}/100</div>
                  <Badge variant="outline">{data.analyse.verdict}</Badge>
                </div>
                <table className="w-full border-collapse text-xs">
                  <tbody>{data.analyse.notes.map((n) => {
                    const c = data.test!.criteres.find((x) => x.id === n.id);
                    return <tr key={n.id} className="border-b border-border"><td className="p-2">{c?.label ?? n.id}</td><td className="p-2 text-right font-bold">{n.note}/{c?.bareme ?? 5}</td><td className="p-2 text-muted-foreground">{n.justification}</td></tr>;
                  })}</tbody>
                </table>
                <p className="italic">{data.analyse.commentaires}</p>
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
