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
import { MACHINES, BU_LABELS, BU_COLORS, BU } from "@/data/cirta";

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
});

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

function MachinesPage() {
  const [q, setQ] = useState("");
  const [bu, setBu] = useState<BU | "all">("all");

  const filtered = MACHINES.filter(
    (m) =>
      (bu === "all" || m.bu === bu) &&
      (q === "" ||
        m.nom.toLowerCase().includes(q.toLowerCase()) ||
        m.marque.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Parc machines"
        subtitle={`${MACHINES.length} équipements industriels`}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Ajouter machine
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Marque / modèle</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Criticité</TableHead>
                <TableHead>État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-foreground">{m.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.marque}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={BU_COLORS[m.bu]}>
                      {m.bu}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.fonction}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={CRIT_CLS[m.criticite]}>
                      {m.criticite}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ETAT_CLS[m.etat]}>
                      {m.etat}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
