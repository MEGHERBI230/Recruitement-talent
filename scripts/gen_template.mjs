import * as XLSX from "xlsx";
import fs from "fs";

const wb = XLSX.utils.book_new();

// --- INSTRUCTIONS ---
const instructions = [
  ["CIRTA — Modèle d'import en masse"],
  [""],
  ["Règles générales"],
  ["1. Ne pas modifier les noms d'onglets : Postes, Machines, Personnel."],
  ["2. Ne pas modifier la 1ère ligne (en-têtes). Remplir à partir de la ligne 2."],
  ["3. Respecter EXACTEMENT les valeurs autorisées (BU, priorité, contrat, etc.) listées ci-dessous."],
  ["4. Pour les champs multiples (compétences, machines...), séparer par un point-virgule ;"],
  ["5. Les dates au format AAAA-MM-JJ (ex : 2026-05-15)."],
  ["6. Les lignes vides sont ignorées. Une ligne sans 'intitule' / 'nom' / 'prenom' est ignorée."],
  [""],
  ["Valeurs autorisées"],
  ["BU :", "BU1, BU2, BU3, BU4, TRANSV"],
  ["Priorité poste :", "urgent, prioritaire, phase2, cible"],
  ["Criticité machine :", "haute, moyenne, basse"],
  ["État machine :", "opérationnel, à régler, non exploité"],
  ["Type contrat :", "CDI, CDD, Intérim, Stage, Apprentissage"],
  ["Situation familiale :", "Célibataire, Marié(e), Divorcé(e), Veuf(ve)"],
  [""],
  ["Légende BU"],
  ["BU1", "Tôlerie / Chaudronnerie"],
  ["BU2", "Élastomères / Caoutchouc"],
  ["BU3", "Usinage CNC & Mécanique"],
  ["BU4", "Fonderie Alu & Presses"],
  ["TRANSV", "Transverse (BE / Qualité / Maintenance / HSE)"],
];
const ws0 = XLSX.utils.aoa_to_sheet(instructions);
ws0["!cols"] = [{ wch: 30 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws0, "Instructions");

// --- POSTES ---
const postesHeaders = ["intitule","bu","quantite","priorite","experienceMin","diplome","competences","machines","hardSkills","softSkills"];
const postesExample = [
  ["Opérateur laser CNC","BU1",2,"urgent",3,"TS Chaudronnerie","Découpe laser; Lecture plan","Laser PENTA BOLT 6020","Conduite laser fibre; Lantek","Précision; Autonomie"],
  ["Soudeur MIG/TIG","BU1",4,"prioritaire",3,"CAP Soudage qualifié","MIG; TIG","Postes soudage","Soudage acier; Soudage inox","Concentration; Discipline EPI"],
];
const wsP = XLSX.utils.aoa_to_sheet([postesHeaders, ...postesExample]);
wsP["!cols"] = postesHeaders.map(() => ({ wch: 22 }));
XLSX.utils.book_append_sheet(wb, wsP, "Postes");

// --- MACHINES ---
const machHeaders = ["nom","marque","bu","fonction","criticite","etat"];
const machExample = [
  ["Laser PENTA BOLT 6020","PENTA","BU1","Découpe tôle laser fibre","haute","opérationnel"],
  ["Plieuse RAYMAX WF67K-200T","RAYMAX","BU1","Pliage CNC","haute","à régler"],
];
const wsM = XLSX.utils.aoa_to_sheet([machHeaders, ...machExample]);
wsM["!cols"] = machHeaders.map(() => ({ wch: 24 }));
XLSX.utils.book_append_sheet(wb, wsM, "Machines");

// --- PERSONNEL ---
const empHeaders = [
  "nom","prenom","dateNaissance","lieuNaissance","cin","nss","telephone","email","adresse",
  "situationFamiliale","nbEnfants","niveauEtudes","specialite","diplomes",
  "intituleposte","departement","responsable","lieuTravail","typeContrat",
  "dateEmbauche","dateFinContrat","salaireBrut","modePaiement","rib","banque",
];
const empExample = [
  ["MEGHERBI","Ahmed","1990-03-12","Alger","12345678","SS-1234","0555000000","ahmed@cirta.dz","Cité 100 Logts, Alger",
   "Marié(e)",2,"TS","Mécanique","TS Mécanique CNC",
   "Tourneur CNC","Atelier CNC","Chef d'atelier","Site Alger","CDD",
   "2026-05-01","2026-10-31",55000,"Virement","DZ12...","BNA"],
];
const wsE = XLSX.utils.aoa_to_sheet([empHeaders, ...empExample]);
wsE["!cols"] = empHeaders.map(() => ({ wch: 18 }));
XLSX.utils.book_append_sheet(wb, wsE, "Personnel");

const outApp = "/dev-server/public/templates/CIRTA_Import_Template.xlsx";
const outDocs = "/mnt/documents/CIRTA_Import_Template.xlsx";
XLSX.writeFile(wb, outApp);
fs.copyFileSync(outApp, outDocs);
console.log("OK", outApp, outDocs);
