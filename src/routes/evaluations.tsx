import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import { useCirta, EVAL_LABELS, type EvaluationData, type EvaluationType, type EvalNote } from "@/store/useCirta";
import { POSTES } from "@/data/cirta";
import { runAI, type AIProvider } from "@/lib/ai-client";
import { Sparkles, Plus, Printer, Loader2, Save, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/evaluations")({ component: EvaluationsPage });

const VERDICT_CLS: Record<string, string> = {
  "VALIDÉ": "bg-success/15 text-success border-success/30",
  "À CONSOLIDER": "bg-warning/15 text-warning border-warning/30",
  "NON VALIDÉ": "bg-destructive/10 text-destructive border-destructive/30",
};

function EvaluationsPage() {
  const candidats = useCirta((s) => s.candidats);
  const evaluations = useCirta((s) => s.evaluations);
  const addEvaluation = useCirta((s) => s.addEvaluation);
  const updateEvaluation = useCirta((s) => s.updateEvaluation);
  const deleteEvaluation = useCirta((s) => s.deleteEvaluation);

  const eligibles = useMemo(() => candidats.filter((c) => c.statut === "accepte" || c.statut === "preselectionne"), [candidats]);

  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState<{ candidatId: string; type: EvaluationType; mois: number }>({
    candidatId: eligibles[0]?.id ?? "",
    type: "periode_essai",
    mois: 3,
  });
  const [genLoading, setGenLoading] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const active = activeId ? evaluations.find((e) => e.id === activeId) : null;
  const activeCandidat = active ? candidats.find((c) => c.id === active.candidatId) : null;
  const activePoste = activeCandidat ? POSTES.find((p) => p.intitule === activeCandidat.posteVise) : null;

  const launchEval = async () => {
    if (!form.candidatId) { toast.error("Sélectionnez un collaborateur"); return; }
    const c = candidats.find((x) => x.id === form.candidatId);
    if (!c) return;
    const poste = POSTES.find((p) => p.intitule === c.posteVise);
    setGenLoading(true);
    try {
      const res = await generateRhEvaluation({
        data: {
          type: form.type,
          poste: c.posteVise,
          bu: c.bu,
          experience: c.experience,
          competences: poste?.competences,
          machines: poste?.machines,
          moisAnciennete: form.mois,
        },
      });
      const id = `ev${Date.now()}`;
      const evalData: EvaluationData = {
        id,
        candidatId: c.id,
        type: form.type,
        date: new Date().toISOString(),
        questions: res.questions,
        notes: res.questions.map((q, i) => ({ idx: i, note: 0, commentaire: "" })),
        observationsTerrain: "",
      };
      addEvaluation(evalData);
      setOpenNew(false);
      setActiveId(id);
      toast.success(`Grille générée (${res.questions.length} items)`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur IA");
    } finally {
      setGenLoading(false);
    }
  };

  const setNote = (idx: number, patch: Partial<EvalNote>) => {
    if (!active) return;
    const notes = active.notes.map((n) => (n.idx === idx ? { ...n, ...patch } : n));
    updateEvaluation(active.id, { notes });
  };

  const analyser = async () => {
    if (!active || !activeCandidat) return;
    setAnalyzing(true);
    try {
      const items = active.questions.map((q, i) => ({
        question: q.question, objectif: q.objectif, bareme: q.bareme,
        note: active.notes[i]?.note ?? 0, commentaire: active.notes[i]?.commentaire ?? "",
      }));
      const res = await analyzeRhEvaluation({
        data: { type: active.type, poste: activeCandidat.posteVise, items, observationsTerrain: active.observationsTerrain },
      });
      updateEvaluation(active.id, { analyse: res });
      toast.success(`Analyse IA — ${res.verdict} (${res.scoreGlobal}/100)`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Évaluations RH"
        subtitle="Période d'essai • Renouvellement CDD • Passage CDI — décision factuelle assistée par l'IA"
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle évaluation
          </Button>
        }
      />

      <Card className="mb-4 no-print">
        <CardHeader><CardTitle className="text-base">Évaluations en cours</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborateur</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((e) => {
                const c = candidats.find((x) => x.id === e.candidatId);
                return (
                  <TableRow key={e.id} className={activeId === e.id ? "bg-accent/40" : ""}>
                    <TableCell className="font-medium">{c ? `${c.prenom} ${c.nom}` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c?.posteVise ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{EVAL_LABELS[e.type]}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(e.date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      {e.analyse ? (
                        <Badge variant="outline" className={VERDICT_CLS[e.analyse.verdict]}>
                          {e.analyse.verdict} • {e.analyse.scoreGlobal}/100
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">En cours</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setActiveId(e.id)}>Ouvrir</Button>
                      <Button size="sm" variant="ghost" onClick={() => { deleteEvaluation(e.id); if (activeId === e.id) setActiveId(null); toast.success("Supprimée"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!evaluations.length && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Aucune évaluation. Cliquez sur "Nouvelle évaluation" pour démarrer.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {active && activeCandidat && (
        <div className="print-area space-y-4">
          <Letterhead title={EVAL_LABELS[active.type]} subtitle={`${activeCandidat.prenom} ${activeCandidat.nom} — ${activeCandidat.posteVise}`} />

          <div className="flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{EVAL_LABELS[active.type]} — {activeCandidat.prenom} {activeCandidat.nom}</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={analyser} disabled={analyzing}>
                {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyser (IA)
              </Button>
              <Button onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Identité & contexte</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div><div className="text-xs text-muted-foreground">Poste</div><div className="font-medium">{activeCandidat.posteVise}</div></div>
              <div><div className="text-xs text-muted-foreground">BU</div><div className="font-medium">{activeCandidat.bu}</div></div>
              <div><div className="text-xs text-muted-foreground">Diplôme requis</div><div className="font-medium">{activePoste?.diplome ?? "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Expérience</div><div className="font-medium">{activeCandidat.experience} ans</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Grille d'évaluation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {active.questions.map((q, i) => {
                const n = active.notes[i];
                return (
                  <div key={i} className="rounded border border-border p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{i + 1}. {q.question}</div>
                        <div className="text-xs text-muted-foreground">{q.objectif} • <Badge variant="outline" className="text-[10px]">{q.categorie}</Badge></div>
                      </div>
                      <Badge variant="outline" className="text-xs">/ {q.bareme}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr]">
                      <div className="no-print">
                        <Label className="text-xs">Note</Label>
                        <Input
                          type="number" min={0} max={q.bareme} value={n?.note ?? 0}
                          onChange={(e) => setNote(i, { note: Math.max(0, Math.min(q.bareme, Number(e.target.value) || 0)) })}
                        />
                      </div>
                      <div className="hidden print:block text-sm">Note : ____ / {q.bareme}</div>
                      <div>
                        <Label className="text-xs">Commentaire / preuve terrain</Label>
                        <Textarea rows={2} value={n?.commentaire ?? ""} onChange={(e) => setNote(i, { commentaire: e.target.value })} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div>
                <Label className="text-xs">Observations terrain du manager</Label>
                <Textarea rows={3} value={active.observationsTerrain ?? ""} onChange={(e) => updateEvaluation(active.id, { observationsTerrain: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {active.analyse && (
            <Card>
              <CardHeader><CardTitle className="text-base">Décision IA</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={VERDICT_CLS[active.analyse.verdict]}>{active.analyse.verdict}</Badge>
                  <span className="font-bold">{active.analyse.scoreGlobal}/100</span>
                </div>
                <div><b>Décision recommandée :</b> {active.analyse.decisionRecommandee}</div>
                <div><b>Forces :</b> <ul className="list-disc pl-5">{active.analyse.forces.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                <div><b>Axes de progrès :</b> <ul className="list-disc pl-5">{active.analyse.axesProgres.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                <div><b>Synthèse :</b> {active.analyse.synthese}</div>
                <div className="mt-4 grid grid-cols-2 gap-6 text-xs">
                  <div>Décision finale du Directeur : ☐ Validée &nbsp; ☐ Prolongée &nbsp; ☐ Refusée</div>
                  <div>Date : ____________________</div>
                </div>
              </CardContent>
            </Card>
          )}

          <LetterheadFooter />
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle évaluation RH</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Collaborateur</Label>
              <Select value={form.candidatId} onValueChange={(v) => setForm({ ...form, candidatId: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {eligibles.length === 0 && <SelectItem value="none" disabled>Aucun collaborateur entré</SelectItem>}
                  {eligibles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.posteVise}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Seuls les candidats acceptés ou présélectionnés sont listés.</p>
            </div>
            <div>
              <Label>Type d'évaluation</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as EvaluationType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVAL_LABELS) as EvaluationType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EVAL_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ancienneté chez CIRTA (mois)</Label>
              <Input type="number" min={0} value={form.mois} onChange={(e) => setForm({ ...form, mois: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annuler</Button>
            <Button onClick={launchEval} disabled={genLoading}>
              {genLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Générer la grille (IA)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
