import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCirta, type CandidatTag } from "@/store/useCirta";
import { scoreCandidat, recoCls, risqueCls } from "@/lib/scoring";
import { STATUT_LABELS, BU_LABELS, BU_COLORS, POSTES, CandidatStatut } from "@/data/cirta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, FileText, ClipboardCheck, FlaskConical, Users, Printer, CheckCircle2, XCircle, AlertTriangle, Tag, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const TAG_LABELS: Record<CandidatTag, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  a_former: { label: "À former", cls: "bg-warning/15 text-warning border-warning/30" },
  bon_profil: { label: "Bon profil", cls: "bg-success/15 text-success border-success/30" },
  fort_potentiel: { label: "Fort potentiel", cls: "bg-primary/15 text-primary border-primary/30" },
  a_revoir: { label: "À revoir", cls: "bg-info/15 text-info border-info/30" },
  rejete_def: { label: "Rejeté définitif", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

export const Route = createFileRoute("/candidats/$id")({ component: FicheCandidat });

function FicheCandidat() {
  const { id } = Route.useParams();
  
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const setStatut = useCirta((s) => s.setStatut);
  const setScore = useCirta((s) => s.setScore);
  const updateCandidat = useCirta((s) => s.updateCandidat);
  const entretien = useCirta((s) => s.entretiens[id]);
  const test = useCirta((s) => s.tests[id]);
  const compt = useCirta((s) => s.comportements[id]);
  const employeFromCandidat = useCirta((s) => s.employeFromCandidat);
  const navigate = useNavigate();

  if (!candidat) {
    return (
      <div className="mx-auto max-w-3xl"><PageHeader title="Candidat introuvable" />
        <Button asChild><Link to="/candidats"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button>
      </div>
    );
  }

  const weights = useCirta((s) => s.user.weights);
  const sc = scoreCandidat({ experience: candidat.experience, diplome: candidat.diplome, competences: candidat.competences, machinesMaitrisees: candidat.machinesMaitrisees, posteVise: candidat.posteVise }, weights);
  const poste = POSTES.find((p) => p.intitule === candidat.posteVise);

  const reanalyser = () => { setScore(candidat.id, sc.total); toast.success(`Score IA recalculé: ${sc.total}%`); };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 no-print"><Button variant="ghost" size="sm" asChild><Link to="/candidats"><ArrowLeft className="mr-2 h-4 w-4" /> Tous les candidats</Link></Button></div>
      <PageHeader
        title={`${candidat.prenom} ${candidat.nom}`}
        subtitle={`${candidat.posteVise} — ${BU_LABELS[candidat.bu]}`}
        actions={
          <>
            <Button variant="outline" onClick={reanalyser}><Sparkles className="mr-2 h-4 w-4" /> Re-analyser IA</Button>
            <Button variant="outline" asChild><Link to="/rapports/$id" params={{ id: candidat.id }}><Printer className="mr-2 h-4 w-4" /> Rapport PDF</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Identité</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email :</span> {candidat.email || "—"}</div>
            <div><span className="text-muted-foreground">Téléphone :</span> {candidat.telephone || "—"}</div>
            <div><span className="text-muted-foreground">Ville :</span> {candidat.ville || "—"}</div>
            <div><span className="text-muted-foreground">Diplôme :</span> {candidat.diplome}</div>
            <div><span className="text-muted-foreground">Expérience :</span> {candidat.experience} ans</div>
            <div className="pt-2"><Badge variant="outline" className={BU_COLORS[candidat.bu]}>{BU_LABELS[candidat.bu]}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Score IA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground">{sc.total}<span className="text-2xl text-muted-foreground">/100</span></div>
              <Badge variant="outline" className={`mt-2 ${recoCls(sc.recommandation)}`}>Recommandation : {sc.recommandation}</Badge>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { l: "Compétences", v: sc.competences, m: 40 },
                { l: "Expérience", v: sc.experience, m: 25 },
                { l: "Diplôme", v: sc.diplome, m: 15 },
                { l: "Machines", v: sc.machines, m: 20 },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between"><span>{r.l}</span><span className="font-bold">{r.v}/{r.m}</span></div>
                  <Progress value={(r.v / r.m) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Statut & Décision</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline" className={`${STATUT_LABELS[candidat.statut].cls} text-sm`}>{STATUT_LABELS[candidat.statut].label}</Badge>
            <Select value={candidat.statut} onValueChange={(v) => { setStatut(candidat.id, v as CandidatStatut); toast.success("Statut mis à jour"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUT_LABELS) as CandidatStatut[]).map((k) => <SelectItem key={k} value={k}>{STATUT_LABELS[k].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => { setStatut(candidat.id, "accepte"); toast.success("Candidat accepté"); }}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Accepter
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => { setStatut(candidat.id, "rejete"); toast.success("Candidat rejeté"); }}>
                <XCircle className="mr-2 h-4 w-4 text-destructive" /> Rejeter
              </Button>
            </div>
            {candidat.statut === "accepte" && (
              <Button className="w-full" onClick={() => {
                const newId = employeFromCandidat(candidat.id);
                if (newId) { toast.success("Fiche employé créée"); navigate({ to: "/personnel/$id", params: { id: newId } }); }
              }}>
                <UserPlus className="mr-2 h-4 w-4" /> Recruter → créer fiche employé
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Profil industriel détaillé</span>
              <Badge variant="outline" className={risqueCls(sc.risque)}>
                <AlertTriangle className="mr-1 h-3 w-3" /> Risque {sc.risque}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { l: "Technique", v: sc.technique },
                { l: "Terrain", v: sc.terrain },
                { l: "Autonomie", v: sc.autonomie },
                { l: "Comportement", v: entretien?.analyse ? Math.round((sc.comportement + (compt?.scoreGlobal ?? sc.comportement)) / 2) : sc.comportement },
              ].map((r) => (
                <div key={r.l} className="rounded border border-border p-3">
                  <div className="text-xs uppercase text-muted-foreground">{r.l}</div>
                  <div className="text-2xl font-bold">{r.v}<span className="text-xs text-muted-foreground">/100</span></div>
                  <Progress value={r.v} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
            <div className="mt-4 rounded border border-border p-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase">Capacité opérationnelle atelier</span>
                <span className="font-bold">{sc.readinessAtelier}%</span>
              </div>
              <Progress value={sc.readinessAtelier} className="h-2" />
              {sc.matchMachines.req.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Machines requises : {sc.matchMachines.req.join(", ")} — maîtrisées : {sc.matchMachines.matched.join(", ") || "aucune"}
                </div>
              )}
            </div>
            {entretien?.analyse?.risqueSurevaluation && (
              <div className="mt-3 rounded border border-warning/30 bg-warning/10 p-3 text-xs">
                <div className="font-bold text-warning uppercase">⚠️ Risque surévaluation : {entretien.analyse.risqueSurevaluation}</div>
                {entretien.analyse.incoherences && entretien.analyse.incoherences.length > 0 && (
                  <ul className="mt-1 list-inside list-disc">{entretien.analyse.incoherences.map((x, i) => <li key={i}>{x}</li>)}</ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Analyse IA détaillée</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-bold uppercase text-success">Forces</div>
                {sc.forces.length ? sc.forces.map((f, i) => <div key={i} className="text-sm">✓ {f}</div>) : <div className="text-xs text-muted-foreground">Aucune force détectée</div>}
              </div>
              <div>
                <div className="mb-2 text-xs font-bold uppercase text-destructive">Points faibles</div>
                {sc.faiblesses.length ? sc.faiblesses.map((f, i) => <div key={i} className="text-sm">✗ {f}</div>) : <div className="text-xs text-muted-foreground">Aucun point faible majeur</div>}
              </div>
            </div>
            {poste && (
              <div className="mt-4 border-t border-border pt-3 text-xs">
                <div className="font-semibold text-foreground">Exigences du poste :</div>
                <div className="mt-1"><span className="text-muted-foreground">Compétences requises :</span> {poste.competences.join(", ") || "—"}</div>
                <div><span className="text-muted-foreground">Machines :</span> {poste.machines.join(", ") || "—"}</div>
                <div><span className="text-muted-foreground">Expérience min :</span> {poste.experienceMin} ans — Diplôme : {poste.diplome}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" /> Tags & qualification</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TAG_LABELS) as CandidatTag[]).map((t) => {
                const active = candidat.tags?.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const cur = candidat.tags ?? [];
                      const next = active ? cur.filter((x) => x !== t) : [...cur, t];
                      updateCandidat(candidat.id, { tags: next });
                      toast.success(active ? "Tag retiré" : "Tag ajouté");
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition ${active ? TAG_LABELS[t].cls : "border-border text-muted-foreground hover:bg-accent"}`}
                  >
                    {TAG_LABELS[t].label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Évaluations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/entretiens/$id" params={{ id: candidat.id }}><Users className="mr-2 h-4 w-4" /> Entretien {entretien?.scoreGlobal != null && <Badge variant="outline" className="ml-auto">{entretien.scoreGlobal}%</Badge>}</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/tests/$id" params={{ id: candidat.id }}><ClipboardCheck className="mr-2 h-4 w-4" /> Test pratique {test?.scoreGlobal != null && <Badge variant="outline" className="ml-auto">{test.scoreGlobal}%</Badge>}</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/comportement/$id" params={{ id: candidat.id }}><FlaskConical className="mr-2 h-4 w-4" /> Test comportemental {compt?.scoreGlobal != null && <Badge variant="outline" className="ml-auto">{compt.scoreGlobal}%</Badge>}</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/rapports/$id" params={{ id: candidat.id }}><FileText className="mr-2 h-4 w-4" /> Voir le rapport complet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
