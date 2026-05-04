import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, FileText, FileBarChart } from "lucide-react";
import { useCirta } from "@/store/useCirta";
import { POSTES, BU_LABELS, BU, MACHINES, STATUT_LABELS } from "@/data/cirta";
import { printPage } from "@/lib/print";
import logo from "@/assets/logo-cirta.png";

export const Route = createFileRoute("/rapports")({ component: RapportsIndex });

function RapportsIndex() {
  const candidats = useCirta((s) => s.candidats);
  const bus: BU[] = ["BU1", "BU2", "BU3", "BU4", "TRANSV"];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Rapports"
        subtitle="Rapports candidats et diagnostic global recrutement"
        actions={<Button onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer ce rapport</Button>}
      />

      <Card className="mb-4 no-print">
        <CardHeader><CardTitle className="text-base">Rapports candidats</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {candidats.map((c) => (
            <Link key={c.id} to="/rapports/$id" params={{ id: c.id }}
              className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent">
              <div>
                <div className="text-sm font-medium">{c.prenom} {c.nom}</div>
                <div className="text-xs text-muted-foreground">{c.posteVise}</div>
              </div>
              <Badge variant="outline">Score {c.score}%</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="print-area rounded-lg border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CIRTA" className="h-14 w-14" />
            <div>
              <div className="text-lg font-bold">CIRTA AUTOMOTIVE</div>
              <div className="text-xs text-muted-foreground">Z.I. Ben Badis, El Khroub — Constantine</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold uppercase">Rapport global de recrutement</div>
            <div className="text-muted-foreground">Émis le {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
        </div>

        <h2 className="mb-3 text-base font-bold">1. Synthèse</h2>
        <div className="mb-6 grid grid-cols-4 gap-3 text-sm">
          <div className="rounded border border-border p-3"><div className="text-xs text-muted-foreground">Postes</div><div className="text-xl font-bold">{POSTES.length}</div></div>
          <div className="rounded border border-border p-3"><div className="text-xs text-muted-foreground">À pourvoir</div><div className="text-xl font-bold">{POSTES.reduce((s, p) => s + p.quantite, 0)}</div></div>
          <div className="rounded border border-border p-3"><div className="text-xs text-muted-foreground">Candidats</div><div className="text-xl font-bold">{candidats.length}</div></div>
          <div className="rounded border border-border p-3"><div className="text-xs text-muted-foreground">Acceptés</div><div className="text-xl font-bold">{candidats.filter((c) => c.statut === "accepte").length}</div></div>
        </div>

        <h2 className="mb-3 text-base font-bold">2. Couverture par Business Unit</h2>
        <table className="mb-6 w-full border-collapse text-sm">
          <thead><tr className="border-b border-border bg-muted">
            <th className="p-2 text-left">Business Unit</th><th className="p-2">Postes</th><th className="p-2">À pourvoir</th><th className="p-2">Candidats</th><th className="p-2">Couverture</th>
          </tr></thead>
          <tbody>
            {bus.map((bu) => {
              const buPostes = POSTES.filter((p) => p.bu === bu);
              const total = buPostes.reduce((s, p) => s + p.quantite, 0);
              const cands = candidats.filter((c) => c.bu === bu).length;
              const pct = total ? Math.round((cands / total) * 100) : 0;
              return <tr key={bu} className="border-b border-border">
                <td className="p-2">{BU_LABELS[bu]}</td><td className="p-2 text-center">{buPostes.length}</td>
                <td className="p-2 text-center">{total}</td><td className="p-2 text-center">{cands}</td>
                <td className="p-2 text-center font-bold">{pct}%</td>
              </tr>;
            })}
          </tbody>
        </table>

        <h2 className="mb-3 text-base font-bold">3. Top candidats</h2>
        <table className="mb-6 w-full border-collapse text-sm">
          <thead><tr className="border-b border-border bg-muted"><th className="p-2 text-left">Candidat</th><th className="p-2 text-left">Poste</th><th className="p-2">Score IA</th><th className="p-2">Statut</th></tr></thead>
          <tbody>
            {[...candidats].sort((a, b) => b.score - a.score).slice(0, 10).map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="p-2">{c.prenom} {c.nom}</td>
                <td className="p-2">{c.posteVise}</td>
                <td className="p-2 text-center font-bold">{c.score}%</td>
                <td className="p-2 text-center">{STATUT_LABELS[c.statut].label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mb-3 text-base font-bold">4. Parc machines</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {(["opérationnel", "à régler", "non exploité"] as const).map((etat) => (
            <div key={etat} className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">{etat}</div>
              <div className="text-xl font-bold">{MACHINES.filter((m) => m.etat === etat).length}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-3 text-[10px] text-muted-foreground">
          CIRTA RECRUITMENT ASSISTANT — Document confidentiel à usage interne
        </div>
      </div>
    </div>
  );
}
