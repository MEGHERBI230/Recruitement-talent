import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BU_LABELS, BU_COLORS, PRIORITY_LABELS, BU, Priority, Poste, MACHINES } from "@/data/cirta";
import { useCirta } from "@/store/useCirta";
import { toast } from "sonner";

export const Route = createFileRoute("/postes")({ component: PostesPage });

interface FormState {
  intitule: string; bu: BU; quantite: number; priorite: Priority;
  experienceMin: number; diplome: string; competences: string; machines: string;
}

const EMPTY: FormState = {
  intitule: "", bu: "BU1", quantite: 1, priorite: "prioritaire",
  experienceMin: 1, diplome: "TS", competences: "", machines: "",
};

function PostesPage() {
  const postes = useCirta((s) => s.postes);
  const addPoste = useCirta((s) => s.addPoste);
  const updatePoste = useCirta((s) => s.updatePoste);
  const deletePoste = useCirta((s) => s.deletePoste);

  const [q, setQ] = useState("");
  const [bu, setBu] = useState<BU | "all">("all");
  const [pr, setPr] = useState<Priority | "all">("all");

  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [delId, setDelId] = useState<string | null>(null);

  const filtered = postes.filter(
    (p) =>
      (bu === "all" || p.bu === bu) &&
      (pr === "all" || p.priorite === pr) &&
      (q === "" || p.intitule.toLowerCase().includes(q.toLowerCase())),
  );

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p: Poste) => {
    setEditId(p.id);
    setForm({
      intitule: p.intitule, bu: p.bu, quantite: p.quantite, priorite: p.priorite,
      experienceMin: p.experienceMin, diplome: p.diplome,
      competences: p.competences.join(", "), machines: p.machines.join(", "),
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.intitule.trim()) { toast.error("L'intitulé est requis"); return; }
    const competences = form.competences.split(",").map((s) => s.trim()).filter(Boolean);
    const machines = form.machines.split(",").map((s) => s.trim()).filter(Boolean);
    if (editId) {
      updatePoste(editId, { ...form, competences, machines });
      toast.success("Poste modifié");
    } else {
      addPoste({ id: `p${Date.now()}`, ...form, competences, machines });
      toast.success("Poste ajouté");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (delId) {
      deletePoste(delId);
      toast.success("Poste supprimé");
      setDelId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Postes"
        subtitle={`${postes.length} intitulés — ${postes.reduce((s, p) => s + p.quantite, 0)} postes à pourvoir`}
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Ajouter un poste</Button>}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un poste..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={bu} onValueChange={(v) => setBu(v as BU | "all")}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Business Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les BU</SelectItem>
              {(Object.keys(BU_LABELS) as BU[]).map((b) => <SelectItem key={b} value={b}>{BU_LABELS[b]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={pr} onValueChange={(v) => setPr(v as Priority | "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priorité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Qté</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Diplôme</TableHead>
                <TableHead>Compétences clés</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.intitule}</TableCell>
                  <TableCell><Badge variant="outline" className={BU_COLORS[p.bu]}>{p.bu}</Badge></TableCell>
                  <TableCell className="font-bold">{p.quantite}</TableCell>
                  <TableCell><Badge variant="outline" className={PRIORITY_LABELS[p.priorite].cls}>{PRIORITY_LABELS[p.priorite].label}</Badge></TableCell>
                  <TableCell>{p.experienceMin} ans</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.diplome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.competences.slice(0, 3).join(", ")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Aucun poste trouvé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? "Modifier le poste" : "Nouveau poste"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Intitulé du poste *</Label><Input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} /></div>
            <div>
              <Label>Business Unit</Label>
              <Select value={form.bu} onValueChange={(v) => setForm({ ...form, bu: v as BU })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(BU_LABELS) as BU[]).map((b) => <SelectItem key={b} value={b}>{BU_LABELS[b]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priorite} onValueChange={(v) => setForm({ ...form, priorite: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantité à pourvoir</Label><Input type="number" min={1} value={form.quantite} onChange={(e) => setForm({ ...form, quantite: +e.target.value || 1 })} /></div>
            <div><Label>Expérience minimale (ans)</Label><Input type="number" min={0} value={form.experienceMin} onChange={(e) => setForm({ ...form, experienceMin: +e.target.value || 0 })} /></div>
            <div className="col-span-2">
              <Label>Diplôme requis</Label>
              <Select value={form.diplome} onValueChange={(v) => setForm({ ...form, diplome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["CAP", "BEP", "CAP/BEP", "TS", "TS / Ingénieur", "Ingénieur", "Ingénieur chimiste"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Compétences clés (séparées par virgules)</Label><Textarea rows={2} value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} /></div>
            <div className="col-span-2"><Label>Machines liées (séparées par virgules)</Label><Textarea rows={2} value={form.machines} onChange={(e) => setForm({ ...form, machines: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>{editId ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce poste ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le poste sera retiré du référentiel.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
