import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Cloud, HardDrive, Loader2 } from "lucide-react";
import { useCirta } from "@/store/useCirta";

interface Props {
  onLocal: () => void;
  onCloud: () => void;
  loading?: boolean;
  loadingProvider?: "local" | "cloud" | null;
  label?: string;
  cloudLabel?: string;
  className?: string;
}

/**
 * Boutons jumeaux : IA locale (Ollama, défaut) + IA avancée (Cloud, manuel).
 * L'IA cloud n'est JAMAIS utilisée automatiquement sauf fallback explicite.
 */
export function AIActionButtons({ onLocal, onCloud, loading, loadingProvider, label = "Générer avec l'IA locale", cloudLabel = "Utiliser IA avancée (cloud)", className = "" }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button onClick={onLocal} disabled={loading}>
        {loading && loadingProvider === "local" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      <Button variant="outline" onClick={onCloud} disabled={loading} title="Utilise l'IA cloud (Lovable AI). Consomme des crédits.">
        {loading && loadingProvider === "cloud" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
        {cloudLabel}
      </Button>
    </div>
  );
}

export function AIUsageBadge({ compact = false }: { compact?: boolean }) {
  const usage = useCirta((s) => s.aiUsage);
  const total = usage.local + usage.cloud;
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs" title={`Local: ${usage.local} • Cloud: ${usage.cloud}`}>
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="font-medium"><HardDrive className="inline h-3 w-3" /> {usage.local}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-medium"><Cloud className="inline h-3 w-3" /> {usage.cloud}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
        <HardDrive className="mr-1 h-3 w-3" /> Local : {usage.local}
      </Badge>
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
        <Cloud className="mr-1 h-3 w-3" /> Cloud : {usage.cloud}
      </Badge>
      <span className="text-xs text-muted-foreground">Total {total}</span>
    </div>
  );
}
