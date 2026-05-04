import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  AlertTriangle,
  Factory,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { POSTES, MACHINES, BU_LABELS, BU, PRIORITY_LABELS } from "@/data/cirta";
import { useCirta } from "@/store/useCirta";
import { buReadiness } from "@/lib/scoring";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "success" | "destructive" | "warning" | "info";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold leading-tight text-foreground">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const totalPostes = POSTES.reduce((s, p) => s + p.quantite, 0);
  const urgents = POSTES.filter((p) => p.priorite === "urgent");
  const cvRecus = CANDIDATS.length;
  const presel = CANDIDATS.filter((c) => c.statut === "preselectionne").length;
  const rejetes = CANDIDATS.filter((c) => c.statut === "rejete").length;
  const entretiens = CANDIDATS.filter((c) => c.statut === "entretien").length;
  const acceptes = CANDIDATS.filter((c) => c.statut === "accepte").length;
  const scoreMoyen = Math.round(CANDIDATS.reduce((s, c) => s + c.score, 0) / CANDIDATS.length);

  const bus: BU[] = ["BU1", "BU2", "BU3", "BU4", "TRANSV"];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble du recrutement industriel — CIRTA AUTOMOTIVE"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Briefcase} label="Postes à pourvoir" value={totalPostes} hint={`${POSTES.length} intitulés`} tone="primary" />
        <Stat icon={FileText} label="CV reçus" value={cvRecus} tone="info" />
        <Stat icon={Users} label="Présélectionnés" value={presel} tone="warning" />
        <Stat icon={CheckCircle2} label="Acceptés" value={acceptes} tone="success" />
        <Stat icon={Users} label="En entretien" value={entretiens} tone="info" />
        <Stat icon={XCircle} label="Rejetés" value={rejetes} tone="destructive" />
        <Stat icon={TrendingUp} label="Score moyen IA" value={`${scoreMoyen}%`} tone="primary" />
        <Stat icon={AlertTriangle} label="Postes urgents" value={urgents.length} tone="destructive" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Postes urgents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgents.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{p.intitule}</div>
                  <div className="text-xs text-muted-foreground">{BU_LABELS[p.bu]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={PRIORITY_LABELS.urgent.cls}>
                    ×{p.quantite}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Couverture par Business Unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bus.map((bu) => {
              const buPostes = POSTES.filter((p) => p.bu === bu);
              const total = buPostes.reduce((s, p) => s + p.quantite, 0);
              const cands = CANDIDATS.filter((c) => c.bu === bu).length;
              const pct = total ? Math.min(100, Math.round((cands / total) * 100)) : 0;
              return (
                <div key={bu}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{BU_LABELS[bu]}</span>
                    <span className="text-muted-foreground">
                      {cands}/{total} candidats
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Parc machines — état</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(["opérationnel", "à régler", "non exploité"] as const).map((etat) => {
                const n = MACHINES.filter((m) => m.etat === etat).length;
                const tone =
                  etat === "opérationnel"
                    ? "bg-success/15 text-success"
                    : etat === "à régler"
                    ? "bg-warning/15 text-warning"
                    : "bg-destructive/10 text-destructive";
                return (
                  <div key={etat} className={`rounded-lg p-4 ${tone}`}>
                    <div className="text-2xl font-bold">{n}</div>
                    <div className="text-xs uppercase tracking-wide">{etat}</div>
                  </div>
                );
              })}
              <div className="rounded-lg bg-muted p-4">
                <div className="text-2xl font-bold text-foreground">{MACHINES.length}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
