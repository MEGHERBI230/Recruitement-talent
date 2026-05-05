import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import { useCirta, type EntretienData } from "@/store/useCirta";
import { POSTES } from "@/data/cirta";
import { runAI, type AIProvider } from "@/lib/ai-client";
import { ArrowLeft, Sparkles, Printer, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { printPage } from "@/lib/print";
import { recoCls } from "@/lib/scoring";

export const Route = createFileRoute("/entretiens/$id")({ component: EntretienPage });

function EntretienPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const data = useCirta((s) => s.entretiens[id]);
  const save = useCirta((s) => s.saveEntretien);
  const setScore = useCirta((s) => s.setScore);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reponses, setReponses] = useState<string[]>(data?.reponses ?? []);

  if (!candidat) return <div className="p-6">Candidat introuvable</div>;
  const poste = POSTES.find((p) => p.intitule === candidat.posteVise);

  const generer = async () => {
    setLoading(true);
    try {
      const res = await runAI("generateInterview", {
          poste: candidat.posteVise,
          bu: candidat.bu,
          experience: poste?.experienceMin ?? candidat.experience,
          diplome: poste?.diplome ?? candidat.diplome,
          competences: poste?.competences,
          machines: poste?.machines,
        }, { provider });
      const next: EntretienData = { candidatId: id, date: new Date().toISOString(), questions: res.questions, reponses: Array(res.questions.length).fill("") };
      save(next);
      setReponses(next.reponses!);
      toast.success(`Entretien généré (${res.questions.length} questions)`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur génération");
    } finally { setLoading(false); }
  };

  const sauverReponses = () => {
    save({ candidatId: id, reponses });
    toast.success("Réponses enregistrées");
  };

  const analyser = async () => {
    if (!data?.questions) return;
    setAnalyzing(true);
    try {
      const qa = data.questions.map((q, i) => ({ question: q.question, reponse: reponses[i] ?? "" }));
      const a = await runAI("analyzeInterview", { poste: candidat.posteVise, qa }, { provider });
      save({ candidatId: id, reponses, analyse: a, scoreGlobal: a.score });
      setScore(id, a.score);
      toast.success(`Entretien évalué — ${a.score}/100 (${a.recommandation})`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur analyse");
    } finally { setAnalyzing(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild><Link to="/candidats/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Fiche candidat</Link></Button>
        <div className="flex gap-2">
          {data?.questions && <Button variant="outline" onClick={() => printPage()}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>}
          {data?.questions && <Button variant="outline" onClick={generer} disabled={loading}><RotateCcw className="mr-2 h-4 w-4" /> Régénérer</Button>}
        </div>
      </div>

      <PageHeader
        title="Guide d'entretien"
        subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`}
        actions={data?.scoreGlobal != null ? <Badge variant="outline" className={`text-base ${data.analyse ? recoCls(data.analyse.recommandation) : ""}`}>Score : {data.scoreGlobal}%</Badge> : undefined}
      />

      {!data?.questions && (
        <Card className="no-print">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="mb-4 text-sm text-muted-foreground">Aucun entretien généré. L'IA va construire un guide d'entretien personnalisé selon le poste, le CV et les machines associées.</p>
            <Button size="lg" onClick={generer} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Générer l'entretien avec l'IA
            </Button>
          </CardContent>
        </Card>
      )}

      {data?.questions && (
        <>
          <div className="print-only">
            <Letterhead title="Guide d'entretien" subtitle={`${candidat.prenom} ${candidat.nom} — ${candidat.posteVise}`} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Questions ({data.questions.length})</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {data.questions.map((q, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{q.categorie}</Badge>
                    <Label className="font-semibold">Q{i + 1}. {q.question}</Label>
                  </div>
                  <p className="mb-2 text-xs italic text-muted-foreground">Objectif : {q.objectif}</p>
                  <Textarea
                    rows={3}
                    placeholder="Réponse du candidat…"
                    value={reponses[i] ?? ""}
                    onChange={(e) => { const next = [...reponses]; next[i] = e.target.value; setReponses(next); }}
                    className="print:border print:border-black print:min-h-[80px]"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 no-print">
                <Button variant="outline" onClick={sauverReponses}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
                <Button onClick={analyser} disabled={analyzing}>
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analyser avec l'IA
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.analyse && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Évaluation IA</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-bold">{data.analyse.score}/100</div>
                  <Badge variant="outline" className={recoCls(data.analyse.recommandation)}>{data.analyse.recommandation}</Badge>
                  {data.analyse.risqueSurevaluation && (
                    <Badge variant="outline" className={
                      data.analyse.risqueSurevaluation === "élevé" ? "bg-destructive/10 text-destructive border-destructive/30"
                      : data.analyse.risqueSurevaluation === "moyen" ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-success/15 text-success border-success/30"
                    }>⚠️ Risque surévaluation : {data.analyse.risqueSurevaluation}</Badge>
                  )}
                </div>
                <p>{data.analyse.synthese}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs font-bold uppercase text-success">Forces</div>{data.analyse.forces.map((f, i) => <div key={i}>✓ {f}</div>)}</div>
                  <div><div className="text-xs font-bold uppercase text-destructive">Faiblesses</div>{data.analyse.faiblesses.map((f, i) => <div key={i}>✗ {f}</div>)}</div>
                </div>
                {data.analyse.incoherences && data.analyse.incoherences.length > 0 && (
                  <div className="rounded border border-warning/30 bg-warning/10 p-3">
                    <div className="text-xs font-bold uppercase text-warning">Incohérences détectées</div>
                    <ul className="list-inside list-disc">{data.analyse.incoherences.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                )}
                {data.analyse.relances && data.analyse.relances.length > 0 && (
                  <div className="rounded border border-info/30 bg-info/10 p-3">
                    <div className="text-xs font-bold uppercase text-info">Questions de relance / pièges à poser</div>
                    <ol className="list-inside list-decimal">{data.analyse.relances.map((x, i) => <li key={i}>{x}</li>)}</ol>
                  </div>
                )}
                <div className="flex justify-end no-print">
                  <Button size="sm" onClick={() => navigate({ to: "/candidats/$id", params: { id } })}>Retour fiche candidat</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="print-only"><LetterheadFooter /></div>
        </>
      )}
    </div>
  );
}
