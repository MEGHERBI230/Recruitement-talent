import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, Sparkles, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUT_LABELS, BU_COLORS, POSTES, MACHINES } from "@/data/cirta";
import { useCirta, type CandidatExt } from "@/store/useCirta";
import { scoreCandidat } from "@/lib/scoring";
import { importCVFile } from "@/lib/cv-parser";
import { toast } from "sonner";

export const Route = createFileRoute("/candidats/")({ component: CandidatsPage });

function ScoreBar({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-success" : value >= 65 ? "bg-warning" : value >= 50 ? "bg-info" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-foreground">{value}%</span>
    </div>
  );
}

type FormState = {
  nom: string; prenom: string; posteVise: string; experience: number;
  diplome: string; competences: string; machines: string[];
};
const EMPTY_FORM: FormState = {
  nom: "", prenom: "", posteVise: POSTES[0].intitule, experience: 0,
  diplome: "TS", competences: "", machines: [],
};

function CandidatsPage() {
  const candidats = useCirta((s) => s.candidats);
  const setScore = useCirta((s) => s.setScore);
  const addCandidat = useCirta((s) => s.addCandidat);
  const updateCandidat = useCirta((s) => s.updateCandidat);
  const deleteCandidat = useCirta((s) => s.deleteCandidat);
  const weights = useCirta((s) => s.user.weights);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pré-sélection avant import CV
  const [importPoste, setImportPoste] = useState<string>(POSTES[0].intitule);
  const [importMachines, setImportMachines] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const posteForImport = POSTES.find((p) => p.intitule === importPoste) ?? POSTES[0];
  const machinesDispoImport = MACHINES.filter((m) => m.bu === posteForImport.bu || m.bu === "TRANSV");

  const posteForForm = POSTES.find((p) => p.intitule === form.posteVise) ?? POSTES[0];
  const machinesDispoForm = MACHINES.filter((m) => m.bu === posteForForm.bu || m.bu === "TRANSV");

  const onChooseFiles = () => {
    setImportDialogOpen(false);
    fileRef.current?.click();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImporting(true);
    let ok = 0, ko = 0;
    const poste = POSTES.find((p) => p.intitule === importPoste)!;
    for (const file of Array.from(files)) {
      try {
        const cv = await importCVFile(file);
        // Fusion : machines choisies + machines détectées dans le CV
        const machines = Array.from(new Set([...(importMachines || []), ...(cv.machines || [])]));
        const sc = scoreCandidat(
          { experience: cv.experience, diplome: cv.diplome, competences: cv.competences, machinesMaitrisees: machines, posteVise: importPoste },
          weights,
        );
        addCandidat({
          id: `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nom: cv.nom || file.name.replace(/\.[^.]+$/, ""),
          prenom: cv.prenom || "",
          posteVise: importPoste, experience: cv.experience, diplome: cv.diplome,
          score: sc.total, statut: "analyse",
          bu: poste.bu, competences: cv.competences, machinesMaitrisees: machines,
          email: cv.email, telephone: cv.telephone, ville: "",
        });
        ok++;
      } catch (e: any) {
        console.error("Import CV échec:", file.name, e);
        ko++;
      }
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok) toast.success(`${ok} CV importé(s) — Poste : ${importPoste}`);
    if (ko) toast.error(`${ko} fichier(s) non lus (format non supporté ou illisible)`);
  };

  const filtered = candidats.filter(
    (c) => q === "" || `${c.prenom} ${c.nom} ${c.posteVise}`.toLowerCase().includes(q.toLowerCase()),
  );

  const analyserTous = () => {
    candidats.forEach((c) => {
      const s = scoreCandidat(
        { experience: c.experience, diplome: c.diplome, competences: c.competences, machinesMaitrisees: c.machinesMaitrisees, posteVise: c.posteVise },
        weights,
      );
      setScore(c.id, s.total);
    });
    toast.success(`Analyse IA terminée — ${candidats.length} candidats notés`);
  };

  const openNew = () => { setEditId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (c: CandidatExt) => {
    setEditId(c.id);
    setForm({
      nom: c.nom, prenom: c.prenom, posteVise: c.posteVise,
      experience: c.experience, diplome: c.diplome,
      competences: (c.competences ?? []).join(", "),
      machines: c.machinesMaitrisees ?? [],
    });
    setOpen(true);
  };

  const submitForm = () => {
    if (!form.nom || !form.prenom) { toast.error("Nom et prénom requis"); return; }
    const poste = POSTES.find((p) => p.intitule === form.posteVise)!;
    const competences = form.competences.split(",").map((s) => s.trim()).filter(Boolean);
    const machines = form.machines.filter(Boolean);
    const sc = scoreCandidat(
      { experience: form.experience, diplome: form.diplome, competences, machinesMaitrisees: machines, posteVise: form.posteVise },
      weights,
    );
    if (editId) {
      updateCandidat(editId, {
        nom: form.nom, prenom: form.prenom, posteVise: form.posteVise,
        experience: form.experience, diplome: form.diplome, score: sc.total,
        bu: poste.bu, competences, machinesMaitrisees: machines,
      });
      toast.success(`Candidat modifié — Score IA: ${sc.total}%`);
    } else {
      addCandidat({
        id: `c${Date.now()}`, nom: form.nom, prenom: form.prenom, posteVise: form.posteVise,
        experience: form.experience, diplome: form.diplome, score: sc.total, statut: "analyse",
        bu: poste.bu, competences, machinesMaitrisees: machines, email: "", telephone: "", ville: "",
      });
      toast.success(`Candidat ajouté — Score IA: ${sc.total}%`);
    }
    setOpen(false);
  };

  const toggleMachine = (list: string[], name: string, set: (v: string[]) => void) => {
    set(list.includes(name) ? list.filter((m) => m !== name) : [...list, name]);
  };

  const confirmDelete = () => {
    if (!delId) return;
    deleteCandidat(delId);
    toast.success("Candidat supprimé");
    setDelId(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Candidats / CV"
        subtitle={`${candidats.length} CV reçus`}
        actions={
          <>
            <Button variant="outline" onClick={analyserTous}>
              <Sparkles className="mr-2 h-4 w-4" /> Analyser tous (IA)
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nouveau candidat</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editId ? "Modifier le candidat" : "Nouveau candidat"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prénom *</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
                  <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Poste visé *</Label>
                    <Select value={form.posteVise} onValueChange={(v) => setForm({ ...form, posteVise: v, machines: [] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POSTES.map((p) => <SelectItem key={p.id} value={p.intitule}>{p.intitule} — {p.bu}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Expérience (ans)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: +e.target.value })} /></div>
                  <div><Label>Diplôme</Label>
                    <Select value={form.diplome} onValueChange={(v) => setForm({ ...form, diplome: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["CAP", "BEP", "TS", "Ingénieur", "Master", "Licence"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Compétences (séparées par virgules)</Label><Textarea value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} /></div>
                  <div className="col-span-2">
                    <Label>Machines maîtrisées (cochez celles du poste)</Label>
                    {posteForForm.machines.length > 0 && (
                      <div className="mb-2 text-xs text-muted-foreground">Machines requises : {posteForForm.machines.join(", ")}</div>
                    )}
                    <div className="grid grid-cols-2 gap-1 rounded border border-border p-2 max-h-40 overflow-y-auto">
                      {machinesDispoForm.length === 0 && <div className="col-span-2 text-xs text-muted-foreground">Aucune machine pour cette BU.</div>}
                      {machinesDispoForm.map((mc) => (
                        <label key={mc.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.machines.includes(mc.nom)} onChange={() => toggleMachine(form.machines, mc.nom, (v) => setForm({ ...form, machines: v }))} />
                          <span className="truncate">{mc.nom}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button onClick={submitForm}>{editId ? "Enregistrer" : "Créer & Analyser"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Pré-sélection avant import */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={importing}>
                  {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {importing ? "Import en cours..." : "Importer CV"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Choisir le poste avant import</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Poste visé *</Label>
                    <Select value={importPoste} onValueChange={(v) => { setImportPoste(v); setImportMachines([]); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POSTES.map((p) => <SelectItem key={p.id} value={p.intitule}>{p.intitule} — {p.bu}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">L'IA analysera le CV en fonction des exigences de ce poste.</p>
                  </div>
                  <div>
                    <Label>Machines à évaluer (optionnel)</Label>
                    {posteForImport.machines.length > 0 && (
                      <div className="mb-2 text-xs text-muted-foreground">Machines du poste : <strong>{posteForImport.machines.join(", ")}</strong></div>
                    )}
                    <div className="grid grid-cols-2 gap-1 rounded border border-border p-2 max-h-40 overflow-y-auto">
                      {machinesDispoImport.length === 0 && <div className="col-span-2 text-xs text-muted-foreground">Pas de machine pour cette BU (poste sans machine).</div>}
                      {machinesDispoImport.map((mc) => (
                        <label key={mc.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" checked={importMachines.includes(mc.nom)} onChange={() => toggleMachine(importMachines, mc.nom, setImportMachines)} />
                          <span className="truncate">{mc.nom}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Cochez les machines sur lesquelles le candidat travaillera. L'IA détectera aussi automatiquement les machines mentionnées dans le CV.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Annuler</Button>
                  <Button onClick={onChooseFiles}><Upload className="mr-2 h-4 w-4" /> Choisir les fichiers CV</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un candidat..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead><TableHead>Poste visé</TableHead><TableHead>BU</TableHead>
                <TableHead>Expérience</TableHead><TableHead>Diplôme</TableHead>
                <TableHead>Score IA</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="font-medium text-foreground">{c.prenom} {c.nom}</div></TableCell>
                  <TableCell className="text-sm">{c.posteVise}</TableCell>
                  <TableCell><Badge variant="outline" className={BU_COLORS[c.bu]}>{c.bu}</Badge></TableCell>
                  <TableCell>{c.experience} ans</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.diplome}</TableCell>
                  <TableCell><ScoreBar value={c.score} /></TableCell>
                  <TableCell><Badge variant="outline" className={STATUT_LABELS[c.statut].cls}>{STATUT_LABELS[c.statut].label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild><Link to="/candidats/$id" params={{ id: c.id }}>Voir</Link></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Aucun candidat. Importez un CV ou créez-en un.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce candidat ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprime définitivement le candidat ainsi que son entretien, son test pratique et son test comportemental.</AlertDialogDescription>
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
