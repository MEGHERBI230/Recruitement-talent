// Parser CV local (PDF / DOCX / TXT) — 100% navigateur, hors-ligne.
import * as pdfjs from "pdfjs-dist";
// @ts-expect-error vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(" ") + "\n";
    }
    return out;
  }

  if (name.endsWith(".docx")) {
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return res.value;
  }

  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return new TextDecoder().decode(buf);
  }

  throw new Error("Format non supporté. Utilisez PDF, DOCX ou TXT.");
}

export type ParsedCV = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  experience: number;
  diplome: string;
  competences: string[];
  machines: string[];
  rawText: string;
};

const DIPLOMES = ["Ingénieur", "Master", "Licence", "TS", "Technicien Supérieur", "BTS", "BEP", "CAP"];
const MACHINES_KEYWORDS = [
  "tour", "fraiseuse", "CNC", "presse", "soudure", "TIG", "MIG", "rectifieuse",
  "perceuse", "cintreuse", "découpe laser", "plieuse", "robot", "ABB", "Fanuc",
  "Siemens", "AutoCAD", "SolidWorks", "CATIA",
];
const COMPETENCES_KEYWORDS = [
  "lecture de plan", "métrologie", "qualité", "ISO", "IATF", "SPC", "5S", "Kaizen",
  "maintenance", "électricité", "pneumatique", "hydraulique", "automatisme", "PLC",
  "GMAO", "lean", "production", "sécurité", "HSE", "EPI", "tolérance", "usinage",
];

export function parseCVText(text: string): Omit<ParsedCV, "rawText"> {
  const t = text.replace(/\s+/g, " ").trim();
  const tLower = t.toLowerCase();

  // Email
  const email = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ?? "";

  // Téléphone (algérien + intl)
  const telephone =
    t.match(/(?:\+?213|0)\s?[567]\d(?:[\s.-]?\d{2}){4}/)?.[0] ??
    t.match(/\+?\d[\d\s.-]{8,}\d/)?.[0] ??
    "";

  // Nom / prénom : 2 premiers mots capitalisés
  let prenom = "", nom = "";
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    const m = line.match(/^([A-ZÀ-Ý][a-zà-ÿ'-]+)\s+([A-ZÀ-Ý][A-ZÀ-Ýa-zà-ÿ'-]+)/);
    if (m) { prenom = m[1]; nom = m[2]; break; }
  }

  // Diplôme
  let diplome = "TS";
  for (const d of DIPLOMES) {
    if (tLower.includes(d.toLowerCase())) { diplome = d === "Technicien Supérieur" ? "TS" : d; break; }
  }

  // Expérience (en années)
  let experience = 0;
  const expMatch = tLower.match(/(\d{1,2})\s*(?:ans|années|year|years)\s*(?:d['e]\s*)?(?:exp[ée]rience|exp\.)/);
  if (expMatch) experience = Math.min(40, parseInt(expMatch[1], 10));

  // Compétences & machines
  const competences = COMPETENCES_KEYWORDS.filter((k) => tLower.includes(k.toLowerCase()));
  const machines = MACHINES_KEYWORDS.filter((k) => tLower.includes(k.toLowerCase()));

  return { nom, prenom, email, telephone, experience, diplome, competences, machines };
}

export async function importCVFile(file: File): Promise<ParsedCV> {
  const rawText = await extractTextFromFile(file);
  const parsed = parseCVText(rawText);
  return { ...parsed, rawText };
}
