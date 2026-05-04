import { createFileRoute } from "@tanstack/react-router";
import { EvaluationForm } from "@/components/EvaluationForm";
import { useCirta } from "@/store/useCirta";

export const Route = createFileRoute("/comportement/$id")({ component: ComptPage });

const CRITERES = [
  { id: "discipline", label: "Discipline & ponctualité" },
  { id: "stabilite", label: "Stabilité professionnelle" },
  { id: "sincerite", label: "Sincérité & cohérence" },
  { id: "stress", label: "Gestion du stress" },
  { id: "securite", label: "Conscience sécurité (HSE)" },
  { id: "equipe", label: "Esprit d'équipe" },
  { id: "autonomie", label: "Autonomie & initiative" },
  { id: "ethique", label: "Éthique & loyauté" },
];

function ComptPage() {
  const { id } = Route.useParams();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const initial = useCirta((s) => s.comportements[id]);
  const save = useCirta((s) => s.saveComportement);
  if (!candidat) return <div className="p-6">Candidat introuvable</div>;
  return (
    <EvaluationForm
      title="Évaluation comportementale"
      subtitle={candidat.posteVise}
      candidatId={id}
      candidatNom={`${candidat.prenom} ${candidat.nom}`}
      criteres={CRITERES}
      initial={initial ? { reponses: initial.reponses, commentaires: initial.commentaires } : undefined}
      onSave={(d) => save({ candidatId: id, reponses: d.reponses, commentaires: d.commentaires, scoreGlobal: d.scoreGlobal, date: new Date().toISOString() })}
    />
  );
}
