import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/parametres")({
  component: () => (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Paramètres" subtitle="À venir" />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Gestion BU, postes, machines, compétences, grille de notation, charte graphique.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
