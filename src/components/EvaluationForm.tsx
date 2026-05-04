import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface Critere { id: string; label: string; hint?: string }

interface Props {
  title: string;
  subtitle: string;
  candidatId: string;
  candidatNom: string;
  backTo?: string;
  criteres: Critere[];
  initial?: { reponses?: Record<string, number>; commentaires?: string };
  onSave: (d: { reponses: Record<string, number>; commentaires: string; scoreGlobal: number }) => void;
}

export function EvaluationForm({ title, subtitle, candidatId, candidatNom, criteres, initial, onSave }: Props) {
  const [reponses, setReponses] = useState<Record<string, number>>(initial?.reponses ?? Object.fromEntries(criteres.map((c) => [c.id, 3])));
  const [commentaires, setCommentaires] = useState(initial?.commentaires ?? "");
  const navigate = useNavigate();

  const total = criteres.reduce((s, c) => s + (reponses[c.id] ?? 0), 0);
  const max = criteres.length * 5;
  const pct = Math.round((total / max) * 100);

  const submit = () => {
    onSave({ reponses, commentaires, scoreGlobal: pct });
    toast.success(`Évaluation enregistrée — Score: ${pct}%`);
    navigate({ to: "/candidats/$id", params: { id: candidatId } });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3"><Button variant="ghost" size="sm" asChild><Link to="/candidats/$id" params={{ id: candidatId }}><ArrowLeft className="mr-2 h-4 w-4" /> Fiche candidat</Link></Button></div>
      <PageHeader title={title} subtitle={`${candidatNom} — ${subtitle}`} actions={<Badge variant="outline" className="text-base">Score : {pct}%</Badge>} />

      <Card>
        <CardHeader><CardTitle className="text-base">Grille d'évaluation (0 = nul, 5 = excellent)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {criteres.map((c) => (
            <div key={c.id}>
              <div className="mb-1 flex items-baseline justify-between">
                <Label className="font-medium">{c.label}</Label>
                <span className="text-sm font-bold tabular-nums text-foreground">{reponses[c.id] ?? 0}/5</span>
              </div>
              {c.hint && <p className="mb-2 text-xs text-muted-foreground">{c.hint}</p>}
              <Slider value={[reponses[c.id] ?? 0]} min={0} max={5} step={1} onValueChange={(v) => setReponses({ ...reponses, [c.id]: v[0] })} />
            </div>
          ))}
          <div>
            <Label>Commentaires / observations</Label>
            <Textarea value={commentaires} onChange={(e) => setCommentaires(e.target.value)} rows={4} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild><Link to="/candidats/$id" params={{ id: candidatId }}>Annuler</Link></Button>
            <Button onClick={submit}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
