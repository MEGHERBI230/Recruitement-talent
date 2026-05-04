import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCirta } from "@/store/useCirta";
import { POSTES, MACHINES } from "@/data/cirta";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/parametres")({ component: Parametres });

const profilSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  fonction: z.string().trim().min(1, "Fonction requise").max(100),
  email: z.string().trim().email("Email invalide").max(255).or(z.literal("")),
  telephone: z.string().trim().max(30).regex(/^[+0-9 ()\-./]*$/, "Téléphone invalide").or(z.literal("")),
});

function Parametres() {
  const reset = useCirta((s) => s.reset);
  const user = useCirta((s) => s.user);
  const updateUser = useCirta((s) => s.updateUser);
  const [form, setForm] = useState(user);

  const save = () => {
    const r = profilSchema.safeParse(form);
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    updateUser(r.data);
    toast.success("Profil enregistré — apparaîtra sur tous les documents imprimés");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Paramètres" subtitle="Configuration & informations système" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profil utilisateur (en-tête des documents)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Nom complet</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={100} />
            </div>
            <div>
              <Label>Fonction</Label>
              <Input value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} maxLength={100} />
            </div>
            <div>
              <Label>Email professionnel</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} placeholder="n.megherbi@cirtaautomotive-dz.com" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} maxLength={30} placeholder="+213 5XX XX XX XX" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={save}><Save className="mr-2 h-4 w-4" /> Enregistrer le profil</Button>
            </div>
          </CardContent>
        </Card>

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
