import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Trash2 } from "lucide-react";
import { useCirta } from "@/store/useCirta";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/comportement/")({ component: ComptIndex });

function ComptIndex() {
  const candidats = useCirta((s) => s.candidats);
  const comportements = useCirta((s) => s.comportements);
  const deleteComportement = useCirta((s) => s.deleteComportement);
  const [delId, setDelId] = useState<string | null>(null);
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
                {t && <Button size="sm" variant="ghost" onClick={() => setDelId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </div>
          );
        })}
        {!candidats.length && <div className="p-8 text-center text-sm text-muted-foreground">Aucun candidat.</div>}
      </CardContent></Card>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le test comportemental ?</AlertDialogTitle>
            <AlertDialogDescription>Les réponses et l'analyse comportementale seront perdues.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (delId) { deleteComportement(delId); toast.success("Test comportemental supprimé"); setDelId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
