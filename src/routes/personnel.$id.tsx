import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCirta, type Employe, type Assiduite, type Observation, type DocumentEmploye, type AnalyseEmployeIA, type ContratType, type AssiduiteType, type ObservationType, type SituationFam } from "@/store/useCirta";
import { ArrowLeft, Upload, Sparkles, Printer, Trash2, FileText, Plus, UserX } from "lucide-react";
import { toast } from "sonner";
import { runAI } from "@/lib/ai-client";
import { printPage } from "@/lib/print";

export const Route = createFileRoute("/personnel/$id")({ component: FicheEmploye });

function FicheEmploye() {
  const { id } = Route.useParams();
  const employe = useCirta((s) => s.employes.find((e) => e.id === id));
  const updateEmploye = useCirta((s) => s.updateEmploye);
  const desactiver = useCirta((s) => s.desactiverEmploye);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [aiBusy, setAiBusy] = useState(false);

  if (!employe) return <div className="mx-auto max-w-3xl"><PageHeader title="Employé introuvable" /><Button asChild><Link to="/personnel"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></Button></div>;

  const posteActuel = employe.postes.find((p) => p.estActuel);

  const onPhoto = (f: File) => {
    const r = new FileReader();
    r.onload = () => { updateEmploye(employe.id, { photo: r.result as string }); toast.success("Photo enregistrée"); };
    r.readAsDataURL(f);
  };
  const onDoc = (f: File, type: DocumentEmploye["typeDocument"]) => {
    const r = new FileReader();
    r.onload = () => {
      const d: DocumentEmploye = { id: `doc-${Date.now()}`, nomDocument: f.name, typeDocument: type, fichier: r.result as string, tailleKo: Math.round(f.size / 1024), dateAjout: new Date().toISOString() };
      updateEmploye(employe.id, { documents: [d, ...employe.documents] });
      toast.success("Document ajouté");
    };
    r.readAsDataURL(f);
  };

  const lancerAnalyseIA = async (provider: "local" | "cloud" | "auto") => {
    setAiBusy(true);
    try {
      const mois = new Date().toISOString().slice(0, 7);
      const absMois = employe.assiduites.filter((a) => a.dateDebut.startsWith(mois));
      const assi = `${absMois.filter((a) => a.type === "Absence").length} absences, ${absMois.filter((a) => a.type === "Retard").length} retards ce mois`;
      const obs = employe.observations.slice(0, 5).map((o) => `${o.type}: ${o.description}`).join(" | ") || "aucune";
      const essai = employe.periodeEssai
        ? `${employe.periodeEssai.statut} — tech ${employe.periodeEssai.noteTechnique ?? "-"}/10, intégr ${employe.periodeEssai.noteIntegration ?? "-"}/10, consignes ${employe.periodeEssai.noteConsignes ?? "-"}/10`
        : "non renseignée";
      const anc = posteActuel ? Math.round((Date.now() - new Date(posteActuel.dateEmbauche).getTime()) / (30 * 86400000)) : 0;
      const r = await runAI<AnalyseEmployeIA>("analyzeEmploye", {
        nom: `${employe.prenom} ${employe.nom}`, poste: posteActuel?.intituleposte ?? "—",
        ancienneteMois: anc, assiduiteResume: assi, observationsResume: obs, essaiResume: essai,
      }, { provider });
      updateEmploye(employe.id, { derniereAnalyseIA: { ...r, date: new Date().toISOString() } });
      toast.success("Analyse IA générée");
    } catch (e: any) { toast.error(e.message ?? "Erreur IA"); }
    finally { setAiBusy(false); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 no-print"><Button variant="ghost" size="sm" asChild><Link to="/personnel"><ArrowLeft className="mr-2 h-4 w-4" /> Tous les employés</Link></Button></div>
      <PageHeader
        title={`${employe.prenom} ${employe.nom}`}
        subtitle={`${posteActuel?.intituleposte ?? "—"} — ${posteActuel?.departement ?? ""}`}
        actions={
          <>
            <Button variant="outline" disabled={aiBusy} onClick={() => lancerAnalyseIA("local")}><Sparkles className="mr-2 h-4 w-4" /> Analyse IA (local)</Button>
            <Button variant="outline" disabled={aiBusy} onClick={() => lancerAnalyseIA("cloud")}><Sparkles className="mr-2 h-4 w-4" /> Analyse IA (cloud)</Button>
            <Button variant="outline" onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            <Button variant="outline" className="text-destructive" onClick={() => { if (confirm("Désactiver cet employé ?")) { desactiver(employe.id); toast.success("Désactivé"); } }}><UserX className="mr-2 h-4 w-4" /> Désactiver</Button>
          </>
        }
      />

      {employe.derniereAnalyseIA && (
        <Card className="mb-4 border-primary/30 bg-primary/5 print-area">
          <CardHeader><CardTitle className="text-base">Analyse IA — Score {employe.derniereAnalyseIA.scoreGlobal}/10</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{employe.derniereAnalyseIA.synthese}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div><div className="text-xs font-bold uppercase text-success">Points forts</div><ul className="list-inside list-disc text-xs">{employe.derniereAnalyseIA.pointsForts.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
              <div><div className="text-xs font-bold uppercase text-destructive">À améliorer</div><ul className="list-inside list-disc text-xs">{employe.derniereAnalyseIA.pointsAmeliorer.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
            </div>
            <div className="rounded border border-primary/30 bg-background p-2 text-xs"><span className="font-bold">Recommandation : </span>{employe.derniereAnalyseIA.recommandation}</div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="info">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="info">1. Informations</TabsTrigger>
          <TabsTrigger value="contrat">2. Contrat & Poste</TabsTrigger>
          <TabsTrigger value="assi">3. Assiduité</TabsTrigger>
          <TabsTrigger value="comp">4. Comportement</TabsTrigger>
          <TabsTrigger value="essai">5. Période d'essai</TabsTrigger>
          <TabsTrigger value="histo">6. Historique</TabsTrigger>
          <TabsTrigger value="docs">7. Documents</TabsTrigger>
        </TabsList>

        {/* TAB 1 IDENTITÉ */}
        <TabsContent value="info">
          <Card><CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-border hover:border-primary">
                  {employe.photo ? <img src={employe.photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground"><Upload className="mr-1 h-4 w-4" /> Photo</div>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
              </div>
              <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  ["nom", "Nom"], ["prenom", "Prénom"], ["dateNaissance", "Date naissance", "date"], ["lieuNaissance", "Lieu naissance"],
                  ["cin", "CIN"], ["nss", "N° sécurité sociale"], ["telephone", "Téléphone"], ["email", "Email", "email"], ["adresse", "Adresse"],
                ].map(([k, l, t]) => (
                  <div key={k}><Label>{l}</Label><Input type={t ?? "text"} value={(employe as any)[k] ?? ""} onChange={(e) => updateEmploye(employe.id, { [k]: e.target.value } as Partial<Employe>)} /></div>
                ))}
                <div>
                  <Label>Situation familiale</Label>
                  <Select value={employe.situationFamiliale ?? ""} onValueChange={(v) => updateEmploye(employe.id, { situationFamiliale: v as SituationFam })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Nb enfants</Label><Input type="number" value={employe.nbEnfants ?? 0} onChange={(e) => updateEmploye(employe.id, { nbEnfants: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Niveau d'études</Label><Input value={employe.niveauEtudes ?? ""} onChange={(e) => updateEmploye(employe.id, { niveauEtudes: e.target.value })} /></div>
                <div><Label>Spécialité</Label><Input value={employe.specialite ?? ""} onChange={(e) => updateEmploye(employe.id, { specialite: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Diplômes</Label><Textarea rows={2} value={employe.diplomes ?? ""} onChange={(e) => updateEmploye(employe.id, { diplomes: e.target.value })} /></div>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 2 CONTRAT */}
        <TabsContent value="contrat">
          <Card><CardContent className="space-y-3 p-4">
            {posteActuel && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  ["intituleposte", "Intitulé poste"], ["departement", "Département"], ["responsable", "Responsable"], ["lieuTravail", "Lieu de travail"],
                  ["dateEmbauche", "Date embauche", "date"], ["dateFinContrat", "Fin de contrat", "date"], ["salaireBrut", "Salaire brut", "number"],
                  ["modePaiement", "Mode paiement"], ["rib", "RIB"], ["banque", "Banque"],
                ].map(([k, l, t]) => (
                  <div key={k}><Label>{l}</Label><Input type={t ?? "text"} value={(posteActuel as any)[k] ?? ""} onChange={(e) => updateEmploye(employe.id, { postes: employe.postes.map((p) => p.id === posteActuel.id ? { ...p, [k]: t === "number" ? parseFloat(e.target.value) : e.target.value } : p) })} /></div>
                ))}
                <div>
                  <Label>Type contrat</Label>
                  <Select value={posteActuel.typeContrat} onValueChange={(v) => updateEmploye(employe.id, { postes: employe.postes.map((p) => p.id === posteActuel.id ? { ...p, typeContrat: v as ContratType } : p) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["CDI", "CDD", "Intérim", "Stage", "Apprentissage"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Avantages / primes</Label><Textarea rows={2} value={posteActuel.avantages ?? ""} onChange={(e) => updateEmploye(employe.id, { postes: employe.postes.map((p) => p.id === posteActuel.id ? { ...p, avantages: e.target.value } : p) })} /></div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* TAB 3 ASSIDUITE */}
        <TabsContent value="assi"><AssiduiteTab employe={employe} /></TabsContent>

        {/* TAB 4 COMPORTEMENT */}
        <TabsContent value="comp"><ComportementTab employe={employe} /></TabsContent>

        {/* TAB 5 ESSAI */}
        <TabsContent value="essai"><EssaiTab employe={employe} /></TabsContent>

        {/* TAB 6 HISTO */}
        <TabsContent value="histo"><HistoTab employe={employe} /></TabsContent>

        {/* TAB 7 DOCS */}
        <TabsContent value="docs">
          <Card><CardContent className="p-4">
            <div className="mb-3 flex gap-2">
              <Button variant="outline" onClick={() => docRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Ajouter un document</Button>
              <input ref={docRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onDoc(e.target.files[0], "Autre")} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {employe.documents.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-start gap-2 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-1 min-w-0">
                      <a href={d.fichier} download={d.nomDocument} className="block truncate text-sm font-medium hover:underline">{d.nomDocument}</a>
                      <div className="text-xs text-muted-foreground">{d.typeDocument} • {d.tailleKo} Ko</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => updateEmploye(employe.id, { documents: employe.documents.filter((x) => x.id !== d.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
              {employe.documents.length === 0 && <p className="text-sm text-muted-foreground">Aucun document</p>}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssiduiteTab({ employe }: { employe: Employe }) {
  const updateEmploye = useCirta((s) => s.updateEmploye);
  const [form, setForm] = useState({ dateDebut: "", dateFin: "", type: "Absence" as AssiduiteType, justifie: false, note: "" });
  const mois = new Date().toISOString().slice(0, 7);
  const moisItems = employe.assiduites.filter((a) => a.dateDebut.startsWith(mois));
  const absences = moisItems.filter((a) => a.type === "Absence").length;
  const retards = moisItems.filter((a) => a.type === "Retard").length;
  const conges = moisItems.filter((a) => a.type.startsWith("Congé")).length;
  const total = 22; const presence = Math.max(0, Math.min(100, Math.round(((total - absences - conges) / total) * 100)));

  const ajouter = () => {
    if (!form.dateDebut || !form.type) return toast.error("Date et type requis");
    const a: Assiduite = { id: `a-${Date.now()}`, dateDebut: form.dateDebut, dateFin: form.dateFin || form.dateDebut, type: form.type, justifie: form.justifie, note: form.note, dateSaisie: new Date().toISOString() };
    updateEmploye(employe.id, { assiduites: [a, ...employe.assiduites] });
    setForm({ dateDebut: "", dateFin: "", type: "Absence", justifie: false, note: "" });
    toast.success("Saisie enregistrée");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card><CardContent className="p-3"><div className="text-xs uppercase text-muted-foreground">Mois en cours</div><div className="mt-1 text-sm">{absences} absences • {retards} retards • {conges} congés</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-xs uppercase text-muted-foreground">Taux de présence</div><div className="mt-1 text-2xl font-bold">{presence}%</div><Progress value={presence} className="mt-1 h-2" /></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-xs uppercase text-muted-foreground">Solde congés</div><div className="mt-1 text-2xl font-bold">{Math.max(0, 30 - employe.assiduites.filter((a) => a.type === "Congé annuel").length)}j</div></CardContent></Card>
      </div>
      <Card><CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <Input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} placeholder="Début" />
          <Input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} placeholder="Fin" />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AssiduiteType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Présence", "Absence", "Retard", "Congé annuel", "Congé maladie", "Autre"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={form.justifie} onChange={(e) => setForm({ ...form, justifie: e.target.checked })} /> Justifié</label>
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note" />
          <Button onClick={ajouter}><Plus className="mr-1 h-4 w-4" /> Ajouter</Button>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Fin</TableHead><TableHead>Type</TableHead><TableHead>Justifié</TableHead><TableHead>Note</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {employe.assiduites.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.dateDebut}</TableCell><TableCell>{a.dateFin}</TableCell>
                <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                <TableCell>{a.justifie ? "Oui" : "Non"}</TableCell><TableCell className="text-sm">{a.note}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => updateEmploye(employe.id, { assiduites: employe.assiduites.filter((x) => x.id !== a.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
            {employe.assiduites.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Aucune saisie</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

const OBS_CLS: Record<ObservationType, string> = {
  Félicitation: "bg-success/15 text-success border-success/30",
  Avertissement: "bg-warning/15 text-warning border-warning/30",
  Sanction: "bg-destructive/10 text-destructive border-destructive/30",
  Observation: "bg-muted text-foreground",
  Réalisation: "bg-info/15 text-info border-info/30",
  Incident: "bg-destructive/10 text-destructive border-destructive/30",
};

function ComportementTab({ employe }: { employe: Employe }) {
  const updateEmploye = useCirta((s) => s.updateEmploye);
  const userNom = useCirta((s) => s.auth.displayName);
  const [form, setForm] = useState({ dateObs: new Date().toISOString().slice(0, 10), type: "Observation" as ObservationType, description: "" });
  const positifs = employe.observations.filter((o) => o.type === "Félicitation" || o.type === "Réalisation").length;
  const negatifs = employe.observations.filter((o) => o.type === "Avertissement" || o.type === "Sanction" || o.type === "Incident").length;
  const note = Math.max(0, Math.min(10, 7 + positifs - negatifs * 2));

  const ajouter = () => {
    if (!form.description) return toast.error("Description requise");
    const o: Observation = { id: `o-${Date.now()}`, dateObs: form.dateObs, type: form.type, description: form.description, auteur: userNom, dateSaisie: new Date().toISOString() };
    updateEmploye(employe.id, { observations: [o, ...employe.observations] });
    setForm({ dateObs: new Date().toISOString().slice(0, 10), type: "Observation", description: "" });
    toast.success("Observation enregistrée");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3"><div className="text-xs uppercase text-muted-foreground">Note comportementale</div><div className="mt-1 text-3xl font-bold">{note}/10</div><Progress value={note * 10} className="mt-1 h-2" /></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-xs uppercase text-muted-foreground">Bilan</div><div className="mt-1 text-sm">✅ {positifs} positives • ⚠️ {negatifs} négatives</div></CardContent></Card>
      </div>
      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          <Input type="date" value={form.dateObs} onChange={(e) => setForm({ ...form, dateObs: e.target.value })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ObservationType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(OBS_CLS).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input className="md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          <Button onClick={ajouter}><Plus className="mr-1 h-4 w-4" /> Ajouter</Button>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <div className="space-y-2">
          {employe.observations.map((o) => (
            <div key={o.id} className="flex items-start gap-3 border-l-2 border-border pl-3">
              <Badge variant="outline" className={OBS_CLS[o.type]}>{o.type}</Badge>
              <div className="flex-1"><div className="text-sm">{o.description}</div><div className="text-xs text-muted-foreground">{o.dateObs} — {o.auteur}</div></div>
              <Button size="icon" variant="ghost" onClick={() => updateEmploye(employe.id, { observations: employe.observations.filter((x) => x.id !== o.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {employe.observations.length === 0 && <p className="text-sm text-muted-foreground">Aucune observation</p>}
        </div>
      </CardContent></Card>
    </div>
  );
}

function EssaiTab({ employe }: { employe: Employe }) {
  const updateEmploye = useCirta((s) => s.updateEmploye);
  const e = employe.periodeEssai ?? { dateDebut: "", dateFin: "", dureeMois: 3, statut: "En cours" as const };
  const set = (patch: Partial<typeof e>) => updateEmploye(employe.id, { periodeEssai: { ...e, ...patch } });
  const debut = e.dateDebut ? new Date(e.dateDebut).getTime() : 0;
  const fin = e.dateFin ? new Date(e.dateFin).getTime() : 0;
  const total = fin - debut; const ecoule = Date.now() - debut;
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((ecoule / total) * 100))) : 0;
  const restant = fin > Date.now() ? Math.ceil((fin - Date.now()) / 86400000) : 0;

  return (
    <Card><CardContent className="space-y-4 p-4">
      <div>
        <div className="mb-1 flex justify-between text-xs"><span>Avancement</span><span className="font-bold">{pct}% — {restant}j restants</span></div>
        <Progress value={pct} className="h-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div><Label>Date début</Label><Input type="date" value={e.dateDebut} onChange={(ev) => set({ dateDebut: ev.target.value })} /></div>
        <div><Label>Date fin</Label><Input type="date" value={e.dateFin} onChange={(ev) => set({ dateFin: ev.target.value })} /></div>
        <div><Label>Durée (mois)</Label><Input type="number" value={e.dureeMois} onChange={(ev) => set({ dureeMois: parseInt(ev.target.value) || 0 })} /></div>
        <div>
          <Label>Statut</Label>
          <Select value={e.statut} onValueChange={(v) => set({ statut: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["En cours", "Validée", "Non validée", "Prolongée"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Date décision</Label><Input type="date" value={e.dateDecision ?? ""} onChange={(ev) => set({ dateDecision: ev.target.value })} /></div>
      </div>
      <div><Label>Observations pendant l'essai</Label><Textarea rows={3} value={e.notes ?? ""} onChange={(ev) => set({ notes: ev.target.value })} /></div>
      <div><Label>Décision finale & motivation</Label><Textarea rows={3} value={e.decisionMotivation ?? ""} onChange={(ev) => set({ decisionMotivation: ev.target.value })} /></div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {([["noteTechnique", "Technique"], ["noteIntegration", "Intégration"], ["noteConsignes", "Respect consignes"]] as const).map(([k, l]) => (
          <div key={k}>
            <Label>{l} /10</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button type="button" key={i} onClick={() => set({ [k]: i } as any)} className={`h-8 w-8 rounded border text-xs ${e[k] === i ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}>{i}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function HistoTab({ employe }: { employe: Employe }) {
  const updateEmploye = useCirta((s) => s.updateEmploye);
  return (
    <div className="space-y-3">
      <Card><CardHeader><CardTitle className="text-base">Historique des postes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Poste</TableHead><TableHead>Département</TableHead><TableHead>Du</TableHead><TableHead>Au</TableHead><TableHead>Salaire</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {employe.postes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.intituleposte}</TableCell><TableCell>{p.departement}</TableCell>
                  <TableCell>{p.dateEmbauche}</TableCell><TableCell>{p.dateFinContrat ?? "—"}</TableCell>
                  <TableCell>{p.salaireBrut ?? "—"}</TableCell>
                  <TableCell>{p.estActuel ? <Badge>Actuel</Badge> : <Badge variant="outline">Ancien</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">Historique salaires</CardTitle></CardHeader>
        <CardContent className="p-4">
          <Button size="sm" variant="outline" onClick={() => {
            const d = prompt("Date d'effet (AAAA-MM-JJ) :"); if (!d) return;
            const s = parseFloat(prompt("Salaire brut :") ?? "0"); if (!s) return;
            const m = (prompt("Motif (Embauche/Avancement/Promotion/Révision) :") ?? "Révision") as any;
            updateEmploye(employe.id, { historiqueSalaires: [{ id: `hs-${Date.now()}`, salaireBrut: s, dateEffet: d, motif: m }, ...employe.historiqueSalaires] });
          }}><Plus className="mr-1 h-4 w-4" /> Ajouter mouvement</Button>
          <Table className="mt-3">
            <TableHeader><TableRow><TableHead>Date effet</TableHead><TableHead>Motif</TableHead><TableHead>Salaire</TableHead></TableRow></TableHeader>
            <TableBody>
              {employe.historiqueSalaires.map((h) => (
                <TableRow key={h.id}><TableCell>{h.dateEffet}</TableCell><TableCell><Badge variant="outline">{h.motif}</Badge></TableCell><TableCell>{h.salaireBrut}</TableCell></TableRow>
              ))}
              {employe.historiqueSalaires.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Aucun mouvement</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
