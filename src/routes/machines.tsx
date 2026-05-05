import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Pencil, Trash2, Image as ImageIcon, ScanLine, Loader2, Eye } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BU_LABELS, BU_COLORS, BU } from "@/data/cirta";
import { useCirta, MachineExt } from "@/store/useCirta";
import { extractMachinePlate } from "@/server/ocr.functions";
import { toast } from "sonner";
import { ImportButton } from "@/components/ImportButton";
import { importMachines } from "@/lib/import-xlsx";

export const Route = createFileRoute("/machines")({ component: MachinesPage });

const ETAT_CLS: Record<string, string> = {
  "opérationnel": "bg-success/15 text-success border-success/30",
  "à régler": "bg-warning/15 text-warning border-warning/30",
  "non exploité": "bg-destructive/10 text-destructive border-destructive/30",
};
const CRIT_CLS: Record<string, string> = {
  haute: "bg-destructive/10 text-destructive border-destructive/30",
  moyenne: "bg-warning/15 text-warning border-warning/30",
  basse: "bg-muted text-muted-foreground border-border",
};

interface FormState {
  nom: string; marque: string; bu: BU; fonction: string;
  criticite: "haute" | "moyenne" | "basse";
  etat: "opérationnel" | "à régler" | "non exploité";
  image?: string;
}
const EMPTY: FormState = { nom: "", marque: "", bu: "BU1", fonction: "", criticite: "moyenne", etat: "opérationnel" };

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function MachinesPage() {
  const machines = useCirta((s) => s.machines);
  const addMachine = useCirta((s) => s.addMachine);
  const updateMachine = useCirta((s) => s.updateMachine);
  const deleteMachine = useCirta((s) => s.deleteMachine);

  const [q, setQ] = useState("");
  const [bu, setBu] = useState<BU | "all">("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [delId, setDelId] = useState<string | null>(null);
  const [preview, setPreview] = useState<MachineExt | null>(null);
  const [scanning, setScanning] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const plateRef = useRef<HTMLInputElement>(null);

  const filtered = machines.filter(
    (m) =>
      (bu === "all" || m.bu === bu) &&
      (q === "" || m.nom.toLowerCase().includes(q.toLowerCase()) || m.marque.toLowerCase().includes(q.toLowerCase())),
  );

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (m: MachineExt) => {
    setEditId(m.id);
    setForm({ nom: m.nom, marque: m.marque, bu: m.bu, fonction: m.fonction, criticite: m.criticite, etat: m.etat, image: m.image });
    setOpen(true);
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Image trop grande (>5MB)"); return; }
    const url = await fileToDataUrl(f);
    setForm((x) => ({ ...x, image: url }));
    e.target.value = "";
  };

  const onPlate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(f);
      const r = await extractMachinePlate({ data: { imageBase64: dataUrl } });
      setForm((x) => ({
        ...x,
        nom: r.nom || x.nom,
        marque: r.marque || x.marque,
        fonction: r.fonction || x.fonction,
      }));
      toast.success("Plaque analysée par IA");
    } catch (err: any) {
      toast.error("Échec analyse: " + (err?.message ?? "erreur"));
    } finally {
      setScanning(false);
    }
  };

  const submit = () => {
    if (!form.nom.trim()) { toast.error("Le nom est requis"); return; }
    if (editId) {
      updateMachine(editId, form);
      toast.success("Machine modifiée");
    } else {
      addMachine({ id: `m${Date.now()}`, ...form });
      toast.success("Machine ajoutée");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (delId) { deleteMachine(delId); toast.success("Machine supprimée"); setDelId(null); }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Parc machines"
        subtitle={`${machines.length} équipements industriels`}
        actions={
          <>
            <ImportButton onFile={async (f) => {
              const { result, machines: imported } = await importMachines(f);
              imported.forEach((m) => addMachine(m));
              toast.success(`${result.added} machine(s) importée(s)${result.skipped ? `, ${result.skipped} ignorée(s)` : ""}`);
              result.errors.slice(0, 3).forEach((e) => toast.error(e));
            }} label="Importer machines" />
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Ajouter machine</Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={bu} onValueChange={(v) => setBu(v as BU | "all")}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Business Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les BU</SelectItem>
              {(Object.keys(BU_LABELS) as BU[]).map((b) => <SelectItem key={b} value={b}>{BU_LABELS[b]}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Aperçu</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Marque / modèle</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Criticité</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <button onClick={() => setPreview(m)} className="block h-12 w-16 overflow-hidden rounded border border-border bg-muted hover:ring-2 hover:ring-primary">
                      {m.image ? (
                        <img src={m.image} alt={m.nom} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{m.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.marque}</TableCell>
                  <TableCell><Badge variant="outline" className={BU_COLORS[m.bu]}>{m.bu}</Badge></TableCell>
                  <TableCell className="text-sm">{m.fonction}</TableCell>
                  <TableCell><Badge variant="outline" className={CRIT_CLS[m.criticite]}>{m.criticite}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={ETAT_CLS[m.etat]}>{m.etat}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(m)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelId(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Aucune machine.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? "Modifier la machine" : "Nouvelle machine"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-start gap-3">
              <div className="h-32 w-40 shrink-0 overflow-hidden rounded border border-border bg-muted">
                {form.image ? (
                  <img src={form.image} alt="aperçu" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                <input ref={plateRef} type="file" accept="image/*" hidden onChange={onPlate} />
                <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" /> {form.image ? "Changer image" : "Ajouter image"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => plateRef.current?.click()} disabled={scanning}>
                  {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                  Plaque référence (IA)
                </Button>
                {form.image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image: undefined })}>
                    Supprimer image
                  </Button>
                )}
              </div>
            </div>

            <div className="col-span-2"><Label>Nom de la machine *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="col-span-2"><Label>Marque / modèle</Label><Input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} /></div>
            <div>
              <Label>Business Unit</Label>
              <Select value={form.bu} onValueChange={(v) => setForm({ ...form, bu: v as BU })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(BU_LABELS) as BU[]).map((b) => <SelectItem key={b} value={b}>{BU_LABELS[b]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fonction</Label><Input value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} /></div>
            <div>
              <Label>Criticité</Label>
              <Select value={form.criticite} onValueChange={(v) => setForm({ ...form, criticite: v as FormState["criticite"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>État</Label>
              <Select value={form.etat} onValueChange={(v) => setForm({ ...form, etat: v as FormState["etat"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opérationnel">Opérationnel</SelectItem>
                  <SelectItem value="à régler">À régler</SelectItem>
                  <SelectItem value="non exploité">Non exploité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>{editId ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{preview?.nom}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                {preview.image ? (
                  <img src={preview.image} alt={preview.nom} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Marque :</span> <strong>{preview.marque}</strong></div>
                <div><span className="text-muted-foreground">BU :</span> <Badge variant="outline" className={BU_COLORS[preview.bu]}>{preview.bu}</Badge></div>
                <div><span className="text-muted-foreground">Fonction :</span> {preview.fonction}</div>
                <div><span className="text-muted-foreground">Criticité :</span> <Badge variant="outline" className={CRIT_CLS[preview.criticite]}>{preview.criticite}</Badge></div>
                <div><span className="text-muted-foreground">État :</span> <Badge variant="outline" className={ETAT_CLS[preview.etat]}>{preview.etat}</Badge></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette machine ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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
