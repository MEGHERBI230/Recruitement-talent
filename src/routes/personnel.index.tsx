import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCirta, type Employe } from "@/store/useCirta";
import { Users, UserPlus, Printer, AlertTriangle, Clock, ShieldCheck, Search, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/personnel/")({ component: PersonnelList });

function daysUntil(d?: string) { if (!d) return Infinity; return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

function PersonnelList() {
  const employes = useCirta((s) => s.employes);
  const addEmploye = useCirta((s) => s.addEmploye);
  const desactiverEmploye = useCirta((s) => s.desactiverEmploye);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [contrat, setContrat] = useState("all");
  const [delId, setDelId] = useState<string | null>(null);

  const actifs = employes.filter((e) => e.actif);
  const stats = useMemo(() => {
    const essaiEnCours = actifs.filter((e) => e.periodeEssai?.statut === "En cours").length;
    const expirent = actifs.filter((e) => {
      const p = e.postes.find((x) => x.estActuel);
      return p?.dateFinContrat && daysUntil(p.dateFinContrat) <= 30 && daysUntil(p.dateFinContrat) >= 0;
    });
    const today = new Date().toISOString().slice(0, 10);
    const absentsAujourdhui = actifs.filter((e) =>
      e.assiduites.some((a) => (a.type === "Absence" || a.type === "Congé annuel" || a.type === "Congé maladie") && a.dateDebut <= today && (a.dateFin ?? a.dateDebut) >= today),
    ).length;
    return { effectif: actifs.length, essaiEnCours, expirent, absentsAujourdhui };
  }, [actifs]);

  const alertes = useMemo(() => {
    const out: { level: "warning" | "destructive"; text: string; empId: string }[] = [];
    actifs.forEach((e) => {
      const p = e.postes.find((x) => x.estActuel);
      if (p?.dateFinContrat) {
        const d = daysUntil(p.dateFinContrat);
        if (d >= 0 && d <= 7) out.push({ level: "destructive", text: `Contrat ${e.prenom} ${e.nom} expire dans ${d}j`, empId: e.id });
        else if (d > 7 && d <= 30) out.push({ level: "warning", text: `Contrat ${e.prenom} ${e.nom} expire dans ${d}j`, empId: e.id });
      }
      if (e.periodeEssai && e.periodeEssai.statut === "En cours") {
        const d = daysUntil(e.periodeEssai.dateFin);
        if (d >= 0 && d <= 7) out.push({ level: "warning", text: `Période d'essai ${e.prenom} ${e.nom} se termine dans ${d}j`, empId: e.id });
      }
      const mois = new Date().toISOString().slice(0, 7);
      const absNonJust = e.assiduites.filter((a) => a.type === "Absence" && !a.justifie && a.dateDebut.startsWith(mois)).length;
      if (absNonJust >= 3) out.push({ level: "warning", text: `${e.prenom} ${e.nom} : ${absNonJust} absences non justifiées ce mois`, empId: e.id });
    });
    return out;
  }, [actifs]);

  const filtered = actifs.filter((e) => {
    const term = q.toLowerCase();
    const p = e.postes.find((x) => x.estActuel);
    const okQ = !term || `${e.nom} ${e.prenom} ${p?.intituleposte ?? ""}`.toLowerCase().includes(term);
    const okD = dept === "all" || p?.departement === dept;
    const okC = contrat === "all" || p?.typeContrat === contrat;
    return okQ && okD && okC;
  });

  const departements = Array.from(new Set(actifs.map((e) => e.postes.find((x) => x.estActuel)?.departement).filter(Boolean))) as string[];

  const newEmploye = () => {
    const today = new Date().toISOString().slice(0, 10);
    const id = `emp-${Date.now()}`;
    const e: Employe = {
      id, nom: "Nouveau", prenom: "Employé",
      postes: [{ id: `pos-${Date.now()}`, intituleposte: "À définir", typeContrat: "CDI", dateEmbauche: today, estActuel: true, dateCreation: today }],
      assiduites: [], observations: [], documents: [], historiqueSalaires: [],
      dateCreation: today, actif: true,
    };
    addEmploye(e);
    toast.success("Nouvel employé créé");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Gestion du personnel"
        subtitle="Effectif, contrats, période d'essai, assiduité, comportement"
        actions={
          <>
            <Button variant="outline" onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            <Button onClick={newEmploye}><UserPlus className="mr-2 h-4 w-4" /> Nouvel employé</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Effectif total" value={stats.effectif} tone="primary" />
        <Stat icon={ShieldCheck} label="Périodes d'essai" value={stats.essaiEnCours} tone="info" />
        <Stat icon={Clock} label="Contrats < 30j" value={stats.expirent.length} tone="warning" />
        <Stat icon={AlertTriangle} label="Absents aujourd'hui" value={stats.absentsAujourdhui} tone="destructive" />
      </div>

      {alertes.length > 0 && (
        <Card className="mt-4 border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="mb-2 text-xs font-bold uppercase text-warning">Alertes RH</div>
            <ul className="space-y-1 text-sm">
              {alertes.map((a, i) => (
                <li key={i} className={a.level === "destructive" ? "text-destructive" : "text-warning"}>
                  • <Link to="/personnel/$id" params={{ id: a.empId }} className="hover:underline">{a.text}</Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher nom, poste…" className="pl-8" />
            </div>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Département" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous départements</SelectItem>
                {departements.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={contrat} onValueChange={setContrat}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Contrat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous contrats</SelectItem>
                {["CDI", "CDD", "Intérim", "Stage", "Apprentissage"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead>Embauche</TableHead>
                <TableHead>Essai</TableHead>
                <TableHead>Absences mois</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const p = e.postes.find((x) => x.estActuel);
                const mois = new Date().toISOString().slice(0, 7);
                const abs = e.assiduites.filter((a) => a.type === "Absence" && a.dateDebut.startsWith(mois)).length;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {e.photo
                          ? <img src={e.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                          : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">{e.prenom[0]}{e.nom[0]}</div>}
                        <div>
                          <div className="text-sm font-medium">{e.prenom} {e.nom}</div>
                          <div className="text-xs text-muted-foreground">{p?.intituleposte}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p?.departement ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{p?.typeContrat}</Badge></TableCell>
                    <TableCell className="text-sm">{p?.dateEmbauche}</TableCell>
                    <TableCell>
                      {e.periodeEssai ? <Badge variant="outline" className={
                        e.periodeEssai.statut === "Validée" ? "bg-success/15 text-success border-success/30" :
                        e.periodeEssai.statut === "Non validée" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/15 text-warning border-warning/30"
                      }>{e.periodeEssai.statut}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{abs}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild><Link to="/personnel/$id" params={{ id: e.id }}>Ouvrir</Link></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDelId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Aucun employé</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    info: "bg-info/15 text-info",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      <div><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="text-2xl font-bold">{value}</div></div>
    </CardContent></Card>
  );
}
