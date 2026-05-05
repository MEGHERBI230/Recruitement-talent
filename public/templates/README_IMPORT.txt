CIRTA — GUIDE D'IMPORT EN MASSE (XLSX)
=======================================

Téléchargez le modèle depuis n'importe quelle page (Postes, Machines, Personnel) :
bouton « Modèle XLSX ». Remplissez-le, puis cliquez « Importer ».

Le classeur contient 3 onglets : Postes, Machines, Personnel.
NE PAS renommer les onglets ni modifier la 1ère ligne (en-têtes).
Remplir à partir de la ligne 2. Les lignes vides sont ignorées.

Champs multiples : séparer par un point-virgule  ;
Dates : format AAAA-MM-JJ (ex : 2026-05-15)


------------------------------------------------------
ONGLET « Postes » — colonnes (ordre EXACT)
------------------------------------------------------
1.  intitule          (texte, obligatoire)        ex : Opérateur laser CNC
2.  bu                BU1 | BU2 | BU3 | BU4 | TRANSV
3.  quantite          (nombre)                    ex : 2
4.  priorite          urgent | prioritaire | phase2 | cible
5.  experienceMin     (nombre années)             ex : 3
6.  diplome           (texte libre)               ex : TS Chaudronnerie
7.  competences       (liste ; séparée par ;)     ex : Découpe laser; Lecture plan
8.  machines          (liste ; séparée par ;)     ex : Laser PENTA BOLT 6020
9.  hardSkills        (liste ; séparée par ;)
10. softSkills        (liste ; séparée par ;)


------------------------------------------------------
ONGLET « Machines » — colonnes (ordre EXACT)
------------------------------------------------------
1. nom         (texte, obligatoire)
2. marque      (texte)
3. bu          BU1 | BU2 | BU3 | BU4 | TRANSV
4. fonction    (texte)
5. criticite   haute | moyenne | basse
6. etat        opérationnel | à régler | non exploité


------------------------------------------------------
ONGLET « Personnel » — colonnes (ordre EXACT)
------------------------------------------------------
Identité :
1.  nom                  (obligatoire)
2.  prenom               (obligatoire)
3.  dateNaissance        AAAA-MM-JJ
4.  lieuNaissance
5.  cin
6.  nss
7.  telephone
8.  email
9.  adresse
10. situationFamiliale   Célibataire | Marié(e) | Divorcé(e) | Veuf(ve)
11. nbEnfants            (nombre)
12. niveauEtudes
13. specialite
14. diplomes

Poste / contrat :
15. intituleposte
16. departement
17. responsable
18. lieuTravail
19. typeContrat          CDI | CDD | Intérim | Stage | Apprentissage
20. dateEmbauche         AAAA-MM-JJ
21. dateFinContrat       AAAA-MM-JJ (laisser vide si CDI)
22. salaireBrut          (nombre, DZD)
23. modePaiement         ex : Virement
24. rib
25. banque


------------------------------------------------------
LÉGENDE BU
------------------------------------------------------
BU1     Tôlerie / Chaudronnerie
BU2     Élastomères / Caoutchouc
BU3     Usinage CNC & Mécanique
BU4     Fonderie Alu & Presses
TRANSV  Transverse (BE / Qualité / Maintenance / HSE)


------------------------------------------------------
PROCÉDURE
------------------------------------------------------
1. Ouvrir CIRTA → page Postes (ou Machines / Personnel)
2. Cliquer « Modèle XLSX » → un fichier .xlsx est téléchargé
3. L'envoyer à la personne qui doit remplir
4. Une fois rempli, revenir dans CIRTA → cliquer « Importer … »
5. Sélectionner le fichier rempli → tout est ajouté en base
6. En cas d'erreur (BU invalide, contrat inconnu...) un message
   s'affiche en bas à droite : la ligne est simplement ignorée,
   les autres sont bien importées.
