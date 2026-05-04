import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CANDIDATS, STATUT_LABELS, BU_COLORS } from "@/data/cirta";

export const Route = createFileRoute("/candidats")({
  component: CandidatsPage,
});

function ScoreBar({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-success"
      : value >= 65
      ? "bg-warning"
      : value >= 50
      ? "bg-info"
      : "bg-destructive";
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
  const [q, setQ] = useState("");
  const filtered = CANDIDATS.filter(
    (c) =>
      q === "" ||
      `${c.prenom} ${c.nom} ${c.posteVise}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Candidats / CV"
        subtitle={`${CANDIDATS.length} CV reçus`}
        actions={
          <>
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" /> Analyser tous (IA)
            </Button>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Importer CV
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un candidat..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Poste visé</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Diplôme</TableHead>
                <TableHead>Score IA</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {c.prenom} {c.nom}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.posteVise}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={BU_COLORS[c.bu]}>
                      {c.bu}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.experience} ans</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.diplome}</TableCell>
                  <TableCell>
                    <ScoreBar value={c.score} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUT_LABELS[c.statut].cls}>
                      {STATUT_LABELS[c.statut].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      Voir
                    </Button>
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
