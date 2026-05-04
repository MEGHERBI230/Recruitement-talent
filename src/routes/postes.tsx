import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POSTES, BU_LABELS, BU_COLORS, PRIORITY_LABELS, BU, Priority } from "@/data/cirta";

export const Route = createFileRoute("/postes")({
  component: PostesPage,
});

function PostesPage() {
  const [q, setQ] = useState("");
  const [bu, setBu] = useState<BU | "all">("all");
  const [pr, setPr] = useState<Priority | "all">("all");

  const filtered = POSTES.filter(
    (p) =>
      (bu === "all" || p.bu === bu) &&
      (pr === "all" || p.priorite === pr) &&
      (q === "" || p.intitule.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Postes"
        subtitle={`${POSTES.length} intitulés — ${POSTES.reduce((s, p) => s + p.quantite, 0)} postes à pourvoir`}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un poste
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un poste..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={bu} onValueChange={(v) => setBu(v as BU | "all")}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Business Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les BU</SelectItem>
              {(Object.keys(BU_LABELS) as BU[]).map((b) => (
                <SelectItem key={b} value={b}>
                  {BU_LABELS[b]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pr} onValueChange={(v) => setPr(v as Priority | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p].label}
                </SelectItem>
              ))}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.intitule}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={BU_COLORS[p.bu]}>
                      {p.bu}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{p.quantite}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_LABELS[p.priorite].cls}>
                      {PRIORITY_LABELS[p.priorite].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.experienceMin} ans</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.diplome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.competences.slice(0, 3).join(", ")}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aucun poste ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
