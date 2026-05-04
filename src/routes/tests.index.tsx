import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";
import { useCirta } from "@/store/useCirta";

export const Route = createFileRoute("/tests/")({ component: TestsIndex });

function TestsIndex() {
  const candidats = useCirta((s) => s.candidats);
  const tests = useCirta((s) => s.tests);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tests pratiques atelier" subtitle="Évaluation terrain par poste" />
      <Card><CardContent className="divide-y divide-border p-0">
        {candidats.map((c) => {
          const t = tests[c.id];
          return (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-foreground">{c.prenom} {c.nom}</div>
                <div className="text-xs text-muted-foreground">{c.posteVise}</div>
              </div>
              <div className="flex items-center gap-3">
                {t?.scoreGlobal != null && <Badge variant="outline">Score : {t.scoreGlobal}%</Badge>}
                <Button size="sm" asChild><Link to="/tests/$id" params={{ id: c.id }}><ClipboardCheck className="mr-2 h-4 w-4" /> {t ? "Revoir" : "Démarrer"}</Link></Button>
              </div>
            </div>
          );
        })}
      </CardContent></Card>
    </div>
  );
}
