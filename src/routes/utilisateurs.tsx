import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCirta, type UserRole } from "@/store/useCirta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2, UserPlus, Shield, Power } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/utilisateurs")({
  component: UtilisateursPage,
});

function UtilisateursPage() {
  const auth = useCirta((s) => s.auth);
  const users = useCirta((s) => s.users);
  const addAppUser = useCirta((s) => s.addAppUser);
  const updateAppUser = useCirta((s) => s.updateAppUser);
  const deleteAppUser = useCirta((s) => s.deleteAppUser);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ nom: "", email: "", password: "", role: "user" as UserRole });

  if (!auth.isLoggedIn) return <div className="p-6">Non connecté</div>;
  const isAdmin = auth.role === "admin";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addAppUser({ ...form });
    if (!r.ok) { toast.error(r.error || "Erreur"); return; }
    toast.success("Utilisateur créé");
    setForm({ nom: "", email: "", password: "", role: "user" });
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleString("fr-FR") : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      </div>

      {!isAdmin && (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">
          Seul l'administrateur peut créer ou supprimer des comptes et voir les mots de passe.
        </CardContent></Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Ajouter un utilisateur</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label>Mot de passe</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div>
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end"><Button type="submit" className="w-full">Créer</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Comptes ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Mot de passe</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Dernière connexion</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const online = auth.isLoggedIn && auth.userId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.nom}
                      {online && <Badge className="ml-2" variant="default">En ligne</Badge>}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                    <TableCell>{u.actif ? <Badge variant="outline">Actif</Badge> : <Badge variant="destructive">Désactivé</Badge>}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{show[u.id] ? u.password : "••••••••"}</span>
                          <Button size="icon" variant="ghost" onClick={() => setShow({ ...show, [u.id]: !show[u.id] })}>
                            {show[u.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs">{fmt(u.createdAt)}</TableCell>
                    <TableCell className="text-xs">
                      {online ? <span className="text-primary">Connecté depuis {fmt(auth.loginAt)}</span> : fmt(u.lastLoginAt)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" title={u.actif ? "Désactiver" : "Activer"}
                            onClick={() => updateAppUser(u.id, { actif: !u.actif })} disabled={u.id === auth.userId}>
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Supprimer" disabled={u.id === auth.userId || u.role === "admin" && users.filter(x => x.role === "admin").length === 1}
                            onClick={() => { if (confirm(`Supprimer ${u.nom} ?`)) { deleteAppUser(u.id); toast.success("Supprimé"); } }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
