import defaultLogo from "@/assets/recruitment-logo.png";
import { useCirta } from "@/store/useCirta";

export const DEFAULT_APP_NAME = "Recruitment Assistant";
export const DEFAULT_LOGO = defaultLogo;

export function useBranding() {
  const user = useCirta((s) => s.user);
  const companyName = (user.companyName ?? "").trim();
  const companyLogo = user.companyLogo;
  return {
    appName: DEFAULT_APP_NAME,
    companyName, // peut être vide
    logo: companyLogo || DEFAULT_LOGO,
    // Titre composé : "Entreprise — Recruitment Assistant" ou juste "Recruitment Assistant"
    fullTitle: companyName ? `${companyName} — ${DEFAULT_APP_NAME}` : DEFAULT_APP_NAME,
  };
}
