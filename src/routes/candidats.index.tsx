import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, Sparkles, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUT_LABELS, BU_COLORS, POSTES, BU } from "@/data/cirta";
import { useCirta } from "@/store/useCirta";
import { scoreCandidat } from "@/lib/scoring";
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

function CandidatsPage() {
  const candidats = useCirta((s) => s.candidats);
  const setScore = useCirta((s) => s.setScore);
  const addCandidat = useCirta((s) => s.addCandidat);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", posteVise: POSTES[0].intitule, experience: 0, diplome: "TS", competences: "", machines: "" });

  const filtered = candidats.filter((c) => q === "" || `${c.prenom} ${c.nom} ${c.posteVise}`.toLowerCase().includes(q.toLowerCase()));

  const analyserTous = () => {
    candidats.forEach((c) => {
      const s = scoreCandidat({ experience: c.experience, diplome: c.diplome, competences: c.competences, machinesMaitrisees: c.machinesMaitrisees, posteVise: c.posteVise });
      setScore(c.id, s.total);
    });
    toast.success(`Analyse IA terminée — ${candidats.length} candidats notés`);
  };

  const submitNew = () => {
    if (!form.nom || !form.prenom) { toast.error("Nom et prénom requis"); return; }
    const poste = POSTES.find((p) => p.intitule === form.posteVise)!;
    const competences = form.competences.split(",").map((s) => s.trim()).filter(Boolean);
    const machines = form.machines.split(",").map((s) => s.trim()).filter(Boolean);
    const sc = scoreCandidat({ experience: form.experience, diplome: form.diplome, competences, machinesMaitrisees: machines, posteVise: form.posteVise });
    addCandidat({
      id: `c${Date.now()}`, nom: form.nom, prenom: form.prenom, posteVise: form.posteVise,
      experience: form.experience, diplome: form.diplome, score: sc.total, statut: "analyse",
      bu: poste.bu, competences, machinesMaitrisees: machines, email: "", telephone: "", ville: "",
    });
    toast.success(`Candidat ajouté — Score IA: ${sc.total}%`);
    setOpen(false);
    setForm({ nom: "", prenom: "", posteVise: POSTES[0].intitule, experience: 0, diplome: "TS", competences: "", machines: "" });
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
                <Button><Plus className="mr-2 h-4 w-4" /> Nouveau candidat</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Nouveau candidat</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prénom</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
                  <div><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Poste visé</Label>
                    <Select value={form.posteVise} onValueChange={(v) => setForm({ ...form, posteVise: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POSTES.map((p) => <SelectItem key={p.id} value={p.intitule}>{p.intitule}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Expérience (ans)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: +e.target.value })} /></div>
                  <div><Label>Diplôme</Label>
                    <Select value={form.diplome} onValueChange={(v) => setForm({ ...form, diplome: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["CAP", "BEP", "TS", "Ingénieur"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Compétences (séparées par virgules)</Label><Textarea value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Machines maîtrisées (séparées par virgules)</Label><Textarea value={form.machines} onChange={(e) => setForm({ ...form, machines: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button onClick={submitNew}>Créer & Analyser</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => toast.info("Import CV PDF disponible en V2")}>
              <Upload className="mr-2 h-4 w-4" /> Importer CV
            </Button>
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
                <TableHead>Score IA</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
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
                  <TableCell><Button size="sm" variant="ghost" asChild><Link to="/candidats/$id" params={{ id: c.id }}>Voir</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
