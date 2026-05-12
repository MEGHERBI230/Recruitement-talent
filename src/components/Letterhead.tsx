import { useCirta } from "@/store/useCirta";
import { useBranding } from "@/lib/branding";

export function Letterhead({ title, subtitle }: { title: string; subtitle?: string }) {
  const user = useCirta((s) => s.user);
  const { logo, companyName, appName } = useBranding();
  const contact = [user.email, user.telephone].filter(Boolean).join(" — ");
  return (
    <div className="print-letterhead hidden print:block">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <img src={logo} alt={companyName || appName} className="h-16 object-contain" />
        <div className="text-center text-xs leading-tight">
          {companyName ? (
            <div className="font-bold uppercase">{companyName}</div>
          ) : (
            <div className="font-bold uppercase">{appName}</div>
          )}
          <div className="uppercase tracking-wide">{appName}</div>
        </div>
        <div className="h-16 w-16" />
      </div>
      <div className="mt-4 mb-2 text-center">
        <div className="text-lg font-bold uppercase">{title}</div>
        {subtitle && <div className="text-sm">{subtitle}</div>}
        <div className="mt-1 text-xs italic">
          Document établi par <span className="font-bold not-italic">M. {user.nom}</span> — {user.fonction}
          {companyName && <span className="not-italic">, {companyName}</span>}
          {contact && <span className="not-italic"> — {contact}</span>}
        </div>
      </div>
    </div>
  );
}

export function LetterheadFooter() {
  const user = useCirta((s) => s.user);
  const { companyName, appName } = useBranding();
  const contact = [user.email, user.telephone].filter(Boolean).join(" — ");
  return (
    <div className="print-footer hidden print:block">
      <div className="mt-6 flex items-end justify-between">
        <div className="text-xs">
          <div className="font-bold">M. {user.nom}</div>
          <div>{user.fonction}</div>
          {contact && <div className="text-muted-foreground">{contact}</div>}
        </div>
        <div className="flex flex-col items-center">
          {user.signature ? (
            <img src={user.signature} alt="Signature & cachet" className="h-24 object-contain" />
          ) : (
            <div className="h-24 w-48 border-b border-black" />
          )}
          <div className="mt-1 text-xs italic">Signature & cachet</div>
        </div>
      </div>
      <div className="mt-4 border-t border-black pt-2 text-center text-xs">
        <div>{companyName || appName} — M. {user.nom}, {user.fonction}{contact && ` — ${contact}`}</div>
      </div>
    </div>
  );
}
