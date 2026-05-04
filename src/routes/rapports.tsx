import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/rapports")({
  component: () => (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Rapports PDF" subtitle="À venir" />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Rapport candidat imprimable + rapport global de diagnostic recrutement CIRTA.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
