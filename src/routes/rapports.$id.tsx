import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useCirta } from "@/store/useCirta";
import { POSTES, BU_LABELS, STATUT_LABELS } from "@/data/cirta";
import { scoreCandidat, recoCls } from "@/lib/scoring";
import { printPage } from "@/lib/print";
import logo from "@/assets/logo-cirta.png";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/rapports/$id")({ component: RapportCandidat });

function RapportCandidat() {
  const { id } = Route.useParams();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const ent = useCirta((s) => s.entretiens[id]);
  const test = useCirta((s) => s.tests[id]);
  const compt = useCirta((s) => s.comportements[id]);
  if (!candidat) return <div className="p-6">Candidat introuvable</div>;

  const weights = useCirta((s) => s.user.weights);
  const sc = scoreCandidat({ experience: candidat.experience, diplome: candidat.diplome, competences: candidat.competences, machinesMaitrisees: candidat.machinesMaitrisees, posteVise: candidat.posteVise }, weights);
  const poste = POSTES.find((p) => p.intitule === candidat.posteVise);

  const moy = (() => {
    const xs = [sc.total, ent?.scoreGlobal, test?.scoreGlobal, compt?.scoreGlobal].filter((x): x is number => x != null);
    return xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : sc.total;
  })();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" asChild><Link to="/candidats/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Fiche candidat</Link></Button>
        <Button onClick={printPage}><Printer className="mr-2 h-4 w-4" /> Imprimer / Export PDF</Button>
      </div>

      <div className="print-area rounded-lg border border-border bg-card p-8">
        <header className="mb-6 flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CIRTA" className="h-14 w-14" />
            <div>
              <div className="text-lg font-bold">CIRTA AUTOMOTIVE</div>
              <div className="text-xs text-muted-foreground">Constantine, Algérie</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold uppercase">Rapport candidat</div>
            <div className="text-muted-foreground">Émis le {new Date().toLocaleDateString("fr-FR")}</div>
          </div>
        </header>

        <section className="mb-5">
          <h1 className="text-xl font-bold">{candidat.prenom} {candidat.nom}</h1>
          <p className="text-sm text-muted-foreground">Poste visé : <span className="font-medium text-foreground">{candidat.posteVise}</span> — {BU_LABELS[candidat.bu]}</p>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Identité</div>
            <div>Email : {candidat.email || "—"}</div>
            <div>Téléphone : {candidat.telephone || "—"}</div>
            <div>Ville : {candidat.ville || "—"}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Profil</div>
            <div>Diplôme : {candidat.diplome}</div>
            <div>Expérience : {candidat.experience} ans</div>
            <div>Statut : {STATUT_LABELS[candidat.statut].label}</div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold uppercase">Décision recommandée</h2>
          <div className="flex items-center gap-4 rounded border border-border p-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{moy}</div>
              <div className="text-xs text-muted-foreground">/100 (moy.)</div>
            </div>
            <div className="flex-1">
              <Badge variant="outline" className={`${recoCls(sc.recommandation)} text-base`}>{sc.recommandation}</Badge>
              <p className="mt-2 text-xs text-muted-foreground">Synthèse pondérée IA + entretien + test pratique + comportemental.</p>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold uppercase">Analyse IA</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {[["Compétences", sc.competences, 40], ["Expérience", sc.experience, 25], ["Diplôme", sc.diplome, 15], ["Machines", sc.machines, 20], ["Total", sc.total, 100]].map(([l, v, m], i) => (
                <tr key={i} className="border-b border-border"><td className="p-2">{l}</td><td className="p-2 text-right font-bold">{v} / {m}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div><div className="font-bold uppercase">Forces</div><ul>{sc.forces.map((f, i) => <li key={i}>✓ {f}</li>)}</ul></div>
            <div><div className="font-bold uppercase">Points faibles</div><ul>{sc.faiblesses.map((f, i) => <li key={i}>✗ {f}</li>)}</ul></div>
          </div>
        </section>

        {(ent || test || compt) && (
          <section className="mb-5">
            <h2 className="mb-2 text-sm font-bold uppercase">Évaluations</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {ent && <tr className="border-b border-border"><td className="p-2">Entretien</td><td className="p-2 text-right font-bold">{ent.scoreGlobal}%</td></tr>}
                {test && <tr className="border-b border-border"><td className="p-2">Test pratique</td><td className="p-2 text-right font-bold">{test.scoreGlobal}%</td></tr>}
                {compt && <tr className="border-b border-border"><td className="p-2">Comportemental</td><td className="p-2 text-right font-bold">{compt.scoreGlobal}%</td></tr>}
              </tbody>
            </table>
            {ent?.analyse?.synthese && <div className="mt-2 text-xs"><span className="font-bold">Entretien :</span> {ent.analyse.synthese}</div>}
            {test?.analyse?.commentaires && <div className="mt-1 text-xs"><span className="font-bold">Test pratique :</span> {test.analyse.commentaires} — Verdict : {test.analyse.verdict}</div>}
            {compt?.analyse?.synthese && <div className="mt-1 text-xs"><span className="font-bold">Comportemental :</span> {compt.analyse.synthese}</div>}
          </section>
        )}

        {poste && (
          <section className="mb-5">
            <h2 className="mb-2 text-sm font-bold uppercase">Exigences du poste</h2>
            <div className="text-xs">
              <div><b>Compétences :</b> {poste.competences.join(", ") || "—"}</div>
              <div><b>Machines :</b> {poste.machines.join(", ") || "—"}</div>
              <div><b>Expérience min :</b> {poste.experienceMin} ans — <b>Diplôme :</b> {poste.diplome}</div>
            </div>
          </section>
        )}

        <footer className="mt-8 border-t border-border pt-3 text-[10px] text-muted-foreground">
          CIRTA RECRUITMENT ASSISTANT — Document confidentiel établi par M. MEGHERBI Nabil, Directeur des Opérations — Signature : ____________________
        </footer>
      </div>
    </div>
  );
}
