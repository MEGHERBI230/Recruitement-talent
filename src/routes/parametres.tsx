import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCirta } from "@/store/useCirta";
import { POSTES, MACHINES } from "@/data/cirta";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/parametres")({ component: Parametres });

function Parametres() {
  const reset = useCirta((s) => s.reset);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Paramètres" subtitle="Configuration & informations système" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Entreprise</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><b>CIRTA AUTOMOTIVE</b></div>
            <div className="text-muted-foreground">Zone Industrielle Ben Badis</div>
            <div className="text-muted-foreground">El Khroub — Constantine, Algérie</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Référentiel chargé</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Postes : <b>{POSTES.length}</b> intitulés</div>
            <div>Machines : <b>{MACHINES.length}</b> équipements</div>
            <div>Business Units : <b>5</b> (BU1 à BU4 + Transverse)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pondération IA</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Compétences : 40 pts</div><div>Expérience : 25 pts</div>
            <div>Diplôme : 15 pts</div><div>Machines : 20 pts</div>
            <div className="pt-2 text-xs text-muted-foreground">Recommandation : ≥85 FORT • ≥70 BON • ≥55 MOYEN • ≥40 FAIBLE • &lt;40 REJET</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Données</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">Les données sont stockées localement (navigateur). Vous pouvez réinitialiser à tout moment.</p>
            <Button variant="outline" onClick={() => { reset(); toast.success("Données réinitialisées"); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser les données
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
