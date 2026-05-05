import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2 } from "lucide-react";
import { useCirta } from "@/store/useCirta";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/entretiens/")({ component: EntretiensIndex });

function EntretiensIndex() {
  const candidats = useCirta((s) => s.candidats);
  const entretiens = useCirta((s) => s.entretiens);
  const deleteEntretien = useCirta((s) => s.deleteEntretien);
  const [delId, setDelId] = useState<string | null>(null);
  const list = candidats.filter((c) => ["preselectionne", "entretien", "accepte"].includes(c.statut));
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Entretiens" subtitle="Guide d'entretien structuré par poste" />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {list.map((c) => {
            const ent = entretiens[c.id];
            return (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-foreground">{c.prenom} {c.nom}</div>
                  <div className="text-xs text-muted-foreground">{c.posteVise}</div>
                </div>
                <div className="flex items-center gap-3">
                  {ent?.scoreGlobal != null && <Badge variant="outline">Score : {ent.scoreGlobal}%</Badge>}
                  <Button size="sm" asChild>
                    <Link to="/entretiens/$id" params={{ id: c.id }}><Users className="mr-2 h-4 w-4" /> {ent ? "Revoir" : "Démarrer"}</Link>
                  </Button>
                  {ent && (
                    <Button size="sm" variant="ghost" onClick={() => setDelId(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!list.length && <div className="p-8 text-center text-sm text-muted-foreground">Aucun candidat présélectionné. Présélectionnez un candidat pour démarrer un entretien.</div>}
        </CardContent>
      </Card>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'entretien ?</AlertDialogTitle>
            <AlertDialogDescription>Les questions, réponses et l'analyse IA de l'entretien seront perdues.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (delId) { deleteEntretien(delId); toast.success("Entretien supprimé"); setDelId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
