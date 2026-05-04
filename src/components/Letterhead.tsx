import logo from "@/assets/cirta-letterhead-logo.jpg";

export function Letterhead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="print-letterhead hidden print:block">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <img src={logo} alt="CIRTA AUTOMOTIVE" className="h-16" />
        <div className="text-center text-xs leading-tight">
          <div className="font-bold">Sarl CIRTA AUTOMOTIVE</div>
          <div>Zone Industrielle Ben Badis ELKhroub Constantine</div>
          <div>RC : 25/00-0063004B99 — AI : 25033038021</div>
          <div>NIF : 09992500630441 — NIS : 099925031171915</div>
        </div>
        <img src={logo} alt="" className="h-16" />
      </div>
      <div className="mt-4 mb-2 text-center">
        <div className="text-lg font-bold uppercase">{title}</div>
        {subtitle && <div className="text-sm">{subtitle}</div>}
        <div className="mt-1 text-xs italic">
          Document établi par <span className="font-bold not-italic">M. MEGHERBI Nabil</span> — Directeur des Opérations, CIRTA AUTOMOTIVE
        </div>
      </div>
    </div>
  );
}

export function LetterheadFooter() {
  return (
    <div className="print-footer hidden print:block">
      <div className="mt-4 border-t border-black pt-2 text-center text-xs">
        Contactez-nous : contact@cirtaautomautive-dz.com — +213 555 00 12 40 — www.cirtaautomotive-dz.com
      </div>
    </div>
  );
}
