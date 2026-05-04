import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/entretiens")({
  component: () => <Placeholder title="Entretiens" />,
});

function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} subtitle="Module en préparation pour la prochaine itération" />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Ce module sera activé dans la prochaine version (guide d'entretien généré par IA, saisie
            des réponses, notation automatique).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
