import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onFile: (file: File) => Promise<void>;
  label?: string;
}

export function ImportButton({ onFile, label = "Importer XLSX" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          e.target.value = "";
          setBusy(true);
          try { await onFile(f); }
          catch (err: any) { toast.error("Import échoué : " + (err?.message ?? "erreur")); }
          finally { setBusy(false); }
        }}
      />
      <Button variant="outline" asChild>
        <a href="/templates/CIRTA_Import_Template.xlsx" download>
          <Download className="mr-2 h-4 w-4" /> Modèle XLSX
        </a>
      </Button>
      <Button variant="outline" onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {label}
      </Button>
    </>
  );
}
