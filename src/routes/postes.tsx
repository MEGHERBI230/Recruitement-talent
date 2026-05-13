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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, X, Printer } from "lucide-react";
import { printPage } from "@/lib/print";
import { Letterhead, LetterheadFooter } from "@/components/Letterhead";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BU_LABELS, BU_COLORS, PRIORITY_LABELS, BU, Priority, Poste, MACHINES, ORG_UNITS } from "@/data/cirta";
import { useCirta } from "@/store/useCirta";
import { toast } from "sonner";
import { ImportButton } from "@/components/ImportButton";
import { importPostes } from "@/lib/import-xlsx";

export const Route = createFileRoute("/postes")({ component: PostesPage });

interface FormState {
  intitule: string; bu: BU; unite: string; quantite: number; priorite: Priority;
  experienceMin: number; diplome: string; competences: string; machines: string[];
  hardSkills: string; softSkills: string;
}

const EMPTY: FormState = {
  intitule: "", bu: "BU1", unite: "", quantite: 1, priorite: "prioritaire",
  experienceMin: 1, diplome: "TS", competences: "", machines: [],
  hardSkills: "", softSkills: "",
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
  const [detailPrint, setDetailPrint] = useState(false);
  const [printOneId, setPrintOneId] = useState<string | null>(null);

  const printPoste = (id: string) => {
    setPrintOneId(id);
    setDetailPrint(true);
    // Forcer A4 portrait pour l'impression d'un poste détaillé
    const style = document.createElement("style");
    style.id = "print-portrait-style";
    style.innerHTML = "@media print { @page { size: A4 portrait; margin: 0; } }";
    document.head.appendChild(style);
    setTimeout(() => {
      printPage();
      setTimeout(() => {
        setDetailPrint(false);
        setPrintOneId(null);
        document.getElementById("print-portrait-style")?.remove();
      }, 500);
    }, 100);
  };

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
      competences: p.competences.join(", "), machines: [...p.machines],
      hardSkills: (p.hardSkills ?? []).join(", "),
      softSkills: (p.softSkills ?? []).join(", "),
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.intitule.trim()) { toast.error("L'intitulé est requis"); return; }
    const competences = form.competences.split(",").map((s) => s.trim()).filter(Boolean);
    const machines = form.machines.filter(Boolean);
    const hardSkills = form.hardSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const softSkills = form.softSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      intitule: form.intitule, bu: form.bu, quantite: form.quantite, priorite: form.priorite,
      experienceMin: form.experienceMin, diplome: form.diplome,
      competences, machines, hardSkills, softSkills,
    };
    if (editId) {
      updatePoste(editId, payload);
      toast.success("Poste modifié");
    } else {
      addPoste({ id: `p${Date.now()}`, ...payload });
      toast.success("Poste ajouté");
    }
    setOpen(false);
  };

  const addMachineSlot = () => setForm((f) => ({ ...f, machines: [...f.machines, ""] }));
  const setMachineAt = (i: number, v: string) => setForm((f) => ({ ...f, machines: f.machines.map((m, idx) => (idx === i ? v : m)) }));
  const removeMachineAt = (i: number) => setForm((f) => ({ ...f, machines: f.machines.filter((_, idx) => idx !== i) }));

  const confirmDelete = () => {
    if (delId) {
      deletePoste(delId);
      toast.success("Poste supprimé");
      setDelId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="print:hidden">
      <PageHeader
        title="Postes"
        subtitle={`${postes.length} intitulés — ${postes.reduce((s, p) => s + p.quantite, 0)} postes à pourvoir`}
        actions={
          <>
            <Button variant="outline" onClick={() => { setDetailPrint(false); setTimeout(printPage, 50); }}><Printer className="mr-2 h-4 w-4" /> Imprimer liste</Button>
            <Button variant="outline" onClick={() => { setPrintOneId(null); setDetailPrint(true); setTimeout(() => { printPage(); setTimeout(() => setDetailPrint(false), 500); }, 100); }}><Printer className="mr-2 h-4 w-4" /> Imprimer tous détaillés</Button>
            <ImportButton onFile={async (f) => {
              const { result, postes: imported } = await importPostes(f);
              imported.forEach((p) => addPoste(p));
              toast.success(`${result.added} poste(s) importé(s)${result.skipped ? `, ${result.skipped} ignoré(s)` : ""}`);
              result.errors.slice(0, 3).forEach((e) => toast.error(e));
            }} label="Importer postes" />
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Ajouter un poste</Button>
          </>
        }
      />
      </div>

      <Letterhead title="Liste des postes à pourvoir" subtitle={`${postes.length} intitulés — ${postes.reduce((s, p) => s + p.quantite, 0)} postes au total`} />

      <Card className="mb-4 print:hidden">
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

      <Card className={detailPrint ? "print:hidden" : ""}>
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
                <TableHead className="text-right print:hidden">Actions</TableHead>
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
                  <TableCell className="text-right print:hidden">
                    <Button size="sm" variant="ghost" title="Imprimer ce poste" onClick={() => printPoste(p.id)}><Printer className="h-4 w-4" /></Button>
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

      {detailPrint && (
        <div className="hidden print:block">
          {(printOneId ? filtered.filter((p) => p.id === printOneId) : filtered).map((p, idx) => (
            <section key={p.id} className={"mb-6 " + (idx > 0 ? "print-break" : "")}>
              <h2 className="text-xl font-bold border-b border-black pb-1 mb-3">
                {idx + 1}. {p.intitule}
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="font-semibold">Business Unit :</span> {BU_LABELS[p.bu]} ({p.bu})</div>
                <div><span className="font-semibold">Priorité :</span> {PRIORITY_LABELS[p.priorite].label}</div>
                <div><span className="font-semibold">Quantité à pourvoir :</span> {p.quantite}</div>
                <div><span className="font-semibold">Expérience minimale :</span> {p.experienceMin} ans</div>
                <div className="col-span-2"><span className="font-semibold">Diplôme requis :</span> {p.diplome}</div>
                <div className="col-span-2">
                  <div className="font-semibold">Compétences clés :</div>
                  <div>{p.competences.join(", ") || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Hard skills (savoir-faire) :</div>
                  <div>{(p.hardSkills ?? []).join(", ") || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Soft skills (savoir-être) :</div>
                  <div>{(p.softSkills ?? []).join(", ") || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Machines liées :</div>
                  <div>{p.machines.length ? p.machines.join(", ") : "—"}</div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <LetterheadFooter />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Label>Diplôme requis (libre — adapté au métier)</Label>
              <Input
                value={form.diplome}
                onChange={(e) => setForm({ ...form, diplome: e.target.value })}
                placeholder="Ex : Ingénieur d'État en Génie Mécanique / TS Productique / CAP Soudage qualifié"
                list="diplomes-suggestions"
              />
              <datalist id="diplomes-suggestions">
                {[
                  "CAP/BEP Soudage qualifié (idéalement certif. ISO 9606)",
                  "CAP Conduite de machines / niveau 3ème AS",
                  "CAP/BEP Mécanique générale (tourneur qualifié)",
                  "CAP/BEP Mécanique générale (fraiseur qualifié)",
                  "CAP/BEP Mécanique ou conduite presse",
                  "TS Mécanique / Productique",
                  "TS Mécanique / CFAO / Productique",
                  "TS Chaudronnerie / Construction Métallique",
                  "TS Robotique / Maintenance Industrielle",
                  "TS Plasturgie / Chimie industrielle",
                  "TS Plasturgie / Procédés Plastiques",
                  "TS Métallurgie / Fonderie",
                  "TS Métrologie / Mécanique de précision",
                  "TS Conception Mécanique / Dessin Industriel",
                  "TS Automatisme / Électromécanique / Maintenance Industrielle",
                  "Ingénieur d'État en Génie Mécanique / Productique",
                  "Ingénieur d'État en Conception Mécanique / Génie Mécanique",
                  "Ingénieur Mécanique / Construction Métallique",
                  "Ingénieur Métallurgie / Fonderie / Mécanique",
                  "Ingénieur Chimiste (option polymères / matériaux)",
                  "Ingénieur Chimie des Polymères / Génie des Procédés",
                  "Ingénieur Qualité / Management Industriel",
                  "Ingénieur Maintenance Industrielle / Électromécanique",
                  "Ingénieur HSE / Sécurité Industrielle / Environnement",
                  "Ingénieur en Génie Industriel / Logistique",
                  "Ingénieur d'État en Génie Industriel / Mécanique / Production",
                ].map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="col-span-2"><Label>Compétences clés (séparées par virgules)</Label><Textarea rows={2} value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Hard skills — savoir-faire technique (virgules)</Label>
              <Textarea rows={3} value={form.hardSkills} onChange={(e) => setForm({ ...form, hardSkills: e.target.value })}
                placeholder="Ex : Codes G Fanuc & Siemens, Lecture palmer, Conduite centre 5 axes" />
            </div>
            <div className="col-span-2">
              <Label>Soft skills — savoir-être (virgules)</Label>
              <Textarea rows={2} value={form.softSkills} onChange={(e) => setForm({ ...form, softSkills: e.target.value })}
                placeholder="Ex : Précision, Autonomie, Discipline sécurité, Esprit d'équipe" />
            </div>
            <div className="col-span-2">
              <Label>Machines liées</Label>
              <div className="space-y-2">
                {form.machines.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucune machine. Cliquez sur "Ajouter une machine" pour en associer.</p>
                )}
                {form.machines.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Select value={m} onValueChange={(v) => setMachineAt(i, v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir une machine..." /></SelectTrigger>
                      <SelectContent>
                        {MACHINES.filter((mc) => mc.bu === form.bu || mc.bu === "TRANSV").map((mc) => (
                          <SelectItem key={mc.id} value={mc.nom} disabled={form.machines.includes(mc.nom) && mc.nom !== m}>
                            {mc.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMachineAt(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addMachineSlot}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une machine
                </Button>
              </div>
            </div>
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
