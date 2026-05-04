import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import { useCirta } from "@/store/useCirta";
import { POSTES, MACHINES, BU_LABELS, BU } from "@/data/cirta";
import { buReadiness } from "@/lib/scoring";
import { planRestart } from "@/server/ai.functions";
import { Sparkles, Loader2, Printer, Factory, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/redemarrage")({ component: Redemarrage });

const BUS: BU[] = ["BU1", "BU2", "BU3", "BU4", "TRANSV"];

function Redemarrage() {
  const candidats = useCirta((s) => s.candidats);
  const [bu, setBu] = useState<BU>("BU2");
  const [objectif, setObjectif] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const r = buReadiness(bu, candidats);
  const niveauColor =
    r.niveau === "PRÊTE" ? "bg-success/15 text-success border-success/30"
    : r.niveau === "DÉMARRABLE" ? "bg-info/15 text-info border-info/30"
    : r.niveau === "À RISQUE" ? "bg-warning/15 text-warning border-warning/30"
    : "bg-destructive/10 text-destructive border-destructive/30";

  const generer = async () => {
    setLoading(true);
    try {
      const postes = POSTES.filter((p) => p.bu === bu);
      const machines = MACHINES.filter((m) => m.bu === bu);
      const cands = candidats.filter((c) => c.bu === bu);
      const res = await planRestart({
        data: {
          bu,
          buLabel: BU_LABELS[bu],
          objectif,
          postes: postes.map((p) => ({
            intitule: p.intitule, quantite: p.quantite, priorite: p.priorite,
            experienceMin: p.experienceMin, competences: p.competences, machines: p.machines,
          })),
          machinesEtat: machines.map((m) => ({ nom: m.nom, etat: m.etat, criticite: m.criticite })),
          candidatsDisponibles: cands.map((c) => ({ posteVise: c.posteVise, score: c.score, statut: c.statut })),
        },
      });
      setPlan(res);
      toast.success("Plan de redémarrage généré");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur génération plan");
    } finally { setLoading(false); }
  };

  const risqueColor = (n: string) => {
    if (n === "faible") return "bg-success/15 text-success border-success/30";
    if (n === "moyen") return "bg-warning/15 text-warning border-warning/30";
    return "bg-destructive/10 text-destructive border-destructive/30";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="no-print">
        <PageHeader
          title="Mode redémarrage usine"
          subtitle="Plan stratégique IA — recrutement & remise en service"
          actions={plan && <Button variant="outline" onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer le plan</Button>}
        />
      </div>

      <Card className="mb-4 no-print">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div>
            <Label>Business Unit à redémarrer</Label>
            <Select value={bu} onValueChange={(v) => { setBu(v as BU); setPlan(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BUS.map((b) => <SelectItem key={b} value={b}>{BU_LABELS[b]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Objectif (libre)</Label>
            <Input value={objectif} onChange={(e) => setObjectif(e.target.value)} placeholder="Ex : démarrer la ligne caoutchouc d'ici 6 semaines" maxLength={300} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={generer} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Générer le plan IA
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 no-print">
        <Card>
          <CardHeader><CardTitle className="text-base">Readiness actuelle</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{r.readiness}%</div>
            <Badge variant="outline" className={`mt-2 ${niveauColor}`}>{r.niveau}</Badge>
            <Progress value={r.readiness} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Couverture RH</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{r.acceptes}<span className="text-xl text-muted-foreground">/{r.totalRequis}</span></div>
            <p className="mt-2 text-xs text-muted-foreground">candidats acceptés / présélectionnés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Parc machines opérationnel</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{r.machReady}%</div>
            <Progress value={r.machReady} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {plan && (
        <>
          <div className="print-only">
            <Letterhead title="Plan de redémarrage" subtitle={BU_LABELS[bu]} />
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4" /> Synthèse stratégique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div><div className="text-3xl font-bold">{plan.readiness}%</div><div className="text-xs text-muted-foreground">Readiness IA</div></div>
                <Badge variant="outline" className={risqueColor(plan.niveauRisque)}>
                  <AlertTriangle className="mr-1 h-3 w-3" /> Risque {plan.niveauRisque}
                </Badge>
              </div>
              <p className="text-sm">{plan.synthese}</p>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Postes critiques</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {plan.postesCritiques.map((p: string, i: number) => (
                <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{p}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Ordre de recrutement</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full border-collapse text-sm">
                <thead><tr className="border-b border-border"><th className="p-2 text-left">#</th><th className="p-2 text-left">Poste</th><th className="p-2">Délai</th><th className="p-2 text-left">Justification</th></tr></thead>
                <tbody>
                  {[...plan.ordreRecrutement].sort((a: any, b: any) => a.priorite - b.priorite).map((o: any, i: number) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-2 font-bold">{o.priorite}</td>
                      <td className="p-2">{o.poste}</td>
                      <td className="p-2 text-center">{o.delaiCible}</td>
                      <td className="p-2 text-xs text-muted-foreground">{o.justification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Risques industriels</CardTitle></CardHeader>
              <CardContent><ul className="space-y-1 text-sm">{plan.risques.map((r: string, i: number) => <li key={i}>⚠️ {r}</li>)}</ul></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Jalons</CardTitle></CardHeader>
              <CardContent><ol className="list-inside list-decimal space-y-1 text-sm">{plan.jalons.map((j: string, i: number) => <li key={i}>{j}</li>)}</ol></CardContent>
            </Card>
          </div>

          <div className="print-only"><LetterheadFooter /></div>
        </>
      )}
    </div>
  );
}
