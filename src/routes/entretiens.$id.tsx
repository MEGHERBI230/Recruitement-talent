import { createFileRoute } from "@tanstack/react-router";
import { EvaluationForm } from "@/components/EvaluationForm";
import { useCirta } from "@/store/useCirta";

export const Route = createFileRoute("/entretiens/$id")({ component: EntretienPage });

const CRITERES = [
  { id: "motivation", label: "Motivation & engagement", hint: "Pourquoi CIRTA ? Pourquoi ce poste ?" },
  { id: "experience", label: "Expérience pertinente", hint: "Réalisations concrètes, machines utilisées" },
  { id: "techniques", label: "Compétences techniques", hint: "Maîtrise des process et outils" },
  { id: "securite", label: "Culture sécurité (HSE)" },
  { id: "communication", label: "Communication & clarté" },
  { id: "stabilite", label: "Stabilité & projection long terme" },
  { id: "resolution", label: "Résolution de problème" },
  { id: "leadership", label: "Leadership / esprit d'équipe" },
];

function EntretienPage() {
  const { id } = Route.useParams();
  const candidat = useCirta((s) => s.candidats.find((c) => c.id === id));
  const initial = useCirta((s) => s.entretiens[id]);
  const save = useCirta((s) => s.saveEntretien);
  if (!candidat) return <div className="p-6">Candidat introuvable</div>;
  return (
    <EvaluationForm
      title="Guide d'entretien"
      subtitle={candidat.posteVise}
      candidatId={id}
      candidatNom={`${candidat.prenom} ${candidat.nom}`}
      criteres={CRITERES}
      initial={initial}
      onSave={(d) => save({ candidatId: id, ...d, date: new Date().toISOString() })}
    />
  );
}
