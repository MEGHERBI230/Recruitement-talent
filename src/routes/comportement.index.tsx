import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { useCirta } from "@/store/useCirta";

export const Route = createFileRoute("/comportement/")({ component: ComptIndex });

function ComptIndex() {
  const candidats = useCirta((s) => s.candidats);
  const comportements = useCirta((s) => s.comportements);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Test comportemental / RH" subtitle="Discipline, stabilité, sécurité, esprit d'équipe" />
      <Card><CardContent className="divide-y divide-border p-0">
        {candidats.map((c) => {
          const t = comportements[c.id];
          return (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-foreground">{c.prenom} {c.nom}</div>
                <div className="text-xs text-muted-foreground">{c.posteVise}</div>
              </div>
              <div className="flex items-center gap-3">
                {t?.scoreGlobal != null && <Badge variant="outline">Score : {t.scoreGlobal}%</Badge>}
                <Button size="sm" asChild><Link to="/comportement/$id" params={{ id: c.id }}><FlaskConical className="mr-2 h-4 w-4" /> {t ? "Revoir" : "Démarrer"}</Link></Button>
              </div>
            </div>
          );
        })}
      </CardContent></Card>
    </div>
  );
}
