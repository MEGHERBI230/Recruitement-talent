import { createFileRoute } from "@tanstack/react-router";
import { EvaluationForm } from "@/components/EvaluationForm";
import { useCirta } from "@/store/useCirta";

export const Route = createFileRoute("/tests/$id")({ component: TestPage });

const CRITERES = [
  { id: "lecture_plan", label: "Lecture de plan technique" },
  { id: "manipulation", label: "Manipulation machine / outil" },
  { id: "precision", label: "Précision & qualité du rendu" },
  { id: "rapidite", label: "Rapidité d'exécution" },
  { id: "securite", label: "Respect consignes sécurité" },
  { id: "autonomie", label: "Autonomie / besoin d'assistance" },
  { id: "diagnostic", label: "Diagnostic & autocontrôle" },
];

function TestPage() {
  const { id } = Route.useParams();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const initial = useCirta((s) => s.tests[id]);
  const save = useCirta((s) => s.saveTest);
  if (!candidat) return <div className="p-6">Candidat introuvable</div>;
  return (
    <EvaluationForm
      title="Test pratique atelier"
      subtitle={candidat.posteVise}
      candidatId={id}
      candidatNom={`${candidat.prenom} ${candidat.nom}`}
      criteres={CRITERES}
      initial={initial ? { reponses: initial.reponses, commentaires: initial.observations } : undefined}
      onSave={(d) => save({ candidatId: id, reponses: d.reponses, observations: d.commentaires, scoreGlobal: d.scoreGlobal, date: new Date().toISOString() })}
    />
  );
}
