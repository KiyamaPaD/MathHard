const ADMIN_ROOT_SELECTOR = "#adminDrawer";

const EXACT_EN = new Map(Object.entries({
  "Înapoi la site": "Back to site",
  "Administrare": "Admin",
  "Pregătit": "Ready",
  "Caută în Admin": "Search admin",
  "Caută titlu, ID sau capitol": "Search title, ID or chapter",
  "Conținut": "Content",
  "Planuri de studiu": "Roadmaps",
  "Concepte": "Concepts",
  "Verificare și publicare": "Review and publishing",
  "Recompense": "Rewards",
  "Comunitate": "Community",
  "Istoric": "History",
  "Catalog": "Catalog",
  "Lecții": "Lessons",
  "Probleme": "Problems",
  "Examene": "Exams",
  "Cercetare / Istorie": "Research / History",
  "Creează conținut": "Create content",
  "Editează conținut": "Edit content",
  "Toate tipurile": "All types",
  "Toate clasele": "All grades",
  "Toate capitolele": "All chapters",
  "Toate dificultățile": "All difficulty levels",
  "Cele mai recente": "Newest first",
  "Cele mai vechi": "Oldest first",
  "Titlu A–Z": "Title A–Z",
  "Titlu Z–A": "Title Z–A",
  "Niciun rezultat": "No results",
  "Schimbă căutarea sau filtrele.": "Change the search or filters.",
  "Duplică": "Duplicate",
  "Șterge": "Delete",
  "Editează": "Edit",
  "Creează": "Create",
  "Salvează": "Save",
  "Renunță": "Cancel",
  "Actualizează": "Refresh",
  "Selectează": "Select",
  "Publică": "Publish",
  "Publicată": "Published",
  "Ciornă": "Draft",
  "Se încarcă...": "Loading...",
  "Se încarcă…": "Loading…",
  "Se salvează...": "Saving...",
  "Se salvează…": "Saving…",
  "Se șterge...": "Deleting...",
  "Se șterge…": "Deleting…",
  "Șters.": "Deleted.",
  "Caută utilizator": "Search user",
  "Cazurile nu au putut fi încărcate.": "Cases could not be loaded.",
  "Acțiune dintr-o raportare": "Action from a report",
  "Ascunzi profilul și îl excluzi din clasamente?": "Hide the profile and remove it from leaderboards?",
  "Se acordă...": "Assigning...",
  "Integritate actualizată.": "Integrity updated.",
  "Integritatea nu a putut fi salvată.": "Integrity settings could not be saved.",
  "Se schimbă numele de utilizator...": "Changing username...",
  "Se salvează semnalarea...": "Saving flag...",
  "Se salvează domeniul...": "Saving domain...",
  "Selectează mai întâi o etapă.": "Select a stage first.",
  "Se validează planul de studiu…": "Validating roadmap…",
  "Plan de studiu valid. Nu au fost găsite probleme.": "Roadmap valid. No issues were found.",
  "Ștergere plan de studiu": "Delete roadmap",
  "Resetează verificarea": "Reset review",
  "Niciun material selectat nu este publicat.": "None of the selected items is published.",
  "Lecții finalizate": "Lessons completed",
  "Rezolvări perfecte": "Perfect solutions",
  "Acuratețe (%)": "Accuracy (%)",
  "Răspunsuri corecte": "Correct answers",
  "Datele nu au putut fi încărcate. Reîncearcă.": "The data could not be loaded. Try again.",
  "Se generează...": "Generating...",
  "Provocare generată și setată ca activă.": "Challenge generated and set as active.",
  "Nu există date de acoperire.": "No coverage data is available.",
  "Nu există planuri de studiu.": "No roadmaps are available.",
  "Conținut nemapat": "Unmapped content",
  "Tot conținutul este mapat.": "All content is mapped.",
  "Concepte fără conținut": "Concepts without content",
  "Se verifică dependențele...": "Checking dependencies...",
  "Tot conținutul": "All content",
  "afișate": "shown",
  "Ultima versiune disponibilă": "Latest available version",
  "Se restaurează…": "Restoring…",
  "Verificarea a fost salvată și publicată.": "The lesson check was saved and published.",
  "Verificarea a fost salvată ca ciornă.": "The lesson check was saved as a draft.",
  "Renunți la modificările nesalvate și reîncarci versiunea publicată?": "Discard unsaved changes and reload the published version?",
  "Ștergi verificarea acestei lecții?": "Delete this lesson check?",
  "Verificare ștearsă.": "Lesson check deleted.",
  "Se deblochează…": "Unlocking…",
  "🧯 Deblochează examenul activ": "🧯 Unlock active exam",
  "Deblochezi forțat examenul activ? Se șterg cronometrul și răspunsurile locale. MathHard va încerca și anularea tentativei active.": "Force-unlock the active exam? The timer and local answers will be cleared. MathHard will also try to cancel the active attempt.",
  "Blocarea locală a fost eliminată. Unele tentative vechi nu au putut fi ajustate; verifică statisticile examenelor.": "The local lock was removed. Some older attempts could not be updated; check the exam statistics.",
  "Panou administrare": "Admin dashboard",
  "Caută în administrare": "Search admin",
  "Actualizează catalogul": "Refresh catalogue",
  "Deconectare": "Sign out",
  "Planuri de studiu": "Roadmaps",
  "Cercetare / Istorie": "Research / History",
  "Definiție": "Definition",
  "Insignă nouă": "New badge",
  "Insigne": "Badges",
  "Insigne acordate": "Assigned badges",
  "Insignă manuală": "Manual badge",
  "Nicio insignă acordată.": "No badges assigned.",
  "Caută un utilizator pentru a gestiona insignele.": "Search for a user to manage badges.",
  "Selectează un utilizator": "Select a user",
  "Caută după nume de utilizator, nume sau email.": "Search by username, name or email.",
  "Motivul acordării": "Reason for assignment",
  "Expiră la": "Expires at",
  "Setează ca insignă principală": "Set as featured badge",
  "Acordă": "Assign",
  "Retrage": "Revoke",
  "Selectează un caz": "Select a case",
  "Detaliile și acțiunile apar aici.": "Details and actions appear here.",
  "Prioritate": "Priority",
  "Notă internă": "Internal note",
  "Salvează cazul": "Save case",
  "Selectează un profil": "Select a profile",
  "Controlează integritatea, vizibilitatea și tipul contului.": "Manage integrity, visibility and account type.",
  "Integritate comunitate": "Community integrity",
  "Tip cont": "Account type",
  "Verificare profil": "Profile review",
  "Profil public permis": "Public profile allowed",
  "Clasamente permise": "Leaderboards allowed",
  "Descriere și titlu scurt publice": "Public bio and headline allowed",
  "Adrese publice": "Public links allowed",
  "Suspendare temporară din clasamente": "Temporary leaderboard suspension",
  "Permite cont intern în clasamente": "Allow internal account in leaderboards",
  "Salvează integritatea": "Save integrity settings",
  "Resetare nume de utilizator": "Reset username",
  "Motiv intern": "Internal reason",
  "Schimbă numele de utilizator": "Change username",
  "Semnalări de integritate": "Integrity flags",
  "Nu există semnalări pentru acest utilizator.": "There are no flags for this user.",
  "Domenii blocate": "Blocked domains",
  "Motiv opțional": "Optional reason",
  "Blochează": "Block",
  "Fără motiv": "No reason",
  "Scanează": "Scan",
  "Scanare finalizată.": "Scan complete.",
  "Scanarea nu a putut fi finalizată.": "The scan could not be completed.",
  "Se scanează...": "Scanning...",
  "Se retrage...": "Revoking...",
  "Se acordă...": "Assigning...",
  "Se schimbă numele de utilizator...": "Changing username...",
  "Se salvează semnalarea...": "Saving flag...",
  "Se salvează domeniul...": "Saving domain...",
  "Evenimente recente": "Recent events",
  "Acordări, modificări și retrageri": "Assignments, changes and revocations",
  "Nu există evenimente pentru insigne.": "There are no badge events.",
  "Realizare": "Achievement",
  "Provocare manuală": "Manual challenge",
  "Șablon automat": "Automatic template",
  "Selectează un element": "Select an item",
  "Editează, duplică sau creează un element nou.": "Edit, duplicate or create a new item.",
  "Schimbă filtrul sau creează un element nou.": "Change the filter or create a new item.",
  "Provocare generată și setată ca activă.": "Challenge generated and set as active.",
  "Adaugă mai întâi alte noduri în planul de studiu.": "Add other nodes to the roadmap first.",
  "Creează o etapă înainte să adaugi conținut.": "Create a stage before adding content.",
  "Nicio etapă. Folosește formularul «Etapă» de mai jos.": "No stages. Use the Stage form below.",
  "Trage aici un nod sau folosește «＋ Conținut».": "Drag a node here or use ＋ Content.",
  "Se validează planul de studiu…": "Validating roadmap…",
  "Plan de studiu valid. Nu au fost găsite probleme.": "Roadmap valid. No issues were found.",
  "Adăugare conținut": "Add content",
  "Salvare etapă": "Save stage",
  "Reordonare etapă": "Reorder stage",
  "Ștergere nod": "Delete node",
  "Ștergere etapă": "Delete stage",
  "Ștergere plan de studiu": "Delete roadmap",
  "Verificare": "Lesson check",
  "Răspunsurile corecte nu sunt afișate elevilor.": "Correct answers are not shown to learners.",
  "Nicio întrebare": "No questions",
  "Adaugă prima întrebare.": "Add the first question.",
  "Salvează verificarea": "Save lesson check",
  "Verificarea a fost salvată și publicată.": "The lesson check was saved and published.",
  "Verificarea a fost salvată ca ciornă.": "The lesson check was saved as a draft.",
  "Renunți la modificările nesalvate și reîncarci versiunea publicată?": "Discard unsaved changes and reload the published version?",
  "Ștergi verificarea acestei lecții?": "Delete this lesson check?",
  "Verificare ștearsă.": "Lesson check deleted."
}));

const EXACT_RO = new Map(Object.entries({
  "Admin Studio": "Administrare",
  "Admin": "Administrare",
  "Roadmaps": "Planuri de studiu",
  "Roadmap": "Plan de studiu",
  "Analytics": "Analiză",
  "Feedback": "Sugestii",
  "Live preview": "Previzualizare în timp real",
  "Preview live": "Previzualizare în timp real",
  "Status": "Stare",
  "Badges": "Insigne",
  "Badge": "Insignă",
  "Username": "Nume de utilizator",
  "Links": "Adrese",
  "Website": "Site web",
  "Streak": "Serie",
  "Challenge": "Provocare",
  "Achievements": "Realizări",
  "Mastery": "Stăpânire",
  "Hints": "Indicii",
  "Tags": "Etichete",
  "Research": "Cercetare",
  "Draft": "Ciornă",
  "Review": "Verificare",
  "All-time": "Toată perioada",
  "Achievement": "Realizare",
  "Challenge manual": "Provocare manuală",
  "Template automat": "Șablon automat",
  "Content ID": "ID conținut",
  "Review profil": "Verificare profil",
  "Bio și headline publice": "Descrierea și titlul scurt publice",
  "Flag-uri de integritate": "Semnalări de integritate",
  "Flag": "Semnalare",
  "Item": "Element",
  "Items": "Elemente"
}));

const TOKEN_RO = [
  [/\bRoadmap-uri\b/g, "Planuri de studiu"],
  [/\bRoadmap\b/g, "Plan de studiu"],
  [/\bAnalytics\b/g, "Analiză"],
  [/\bFeedback\b/g, "Sugestii"],
  [/\bAdmin Studio\b/g, "Administrare"],
  [/\bPreview live\b/g, "Previzualizare în timp real"],
  [/\bStatusuri\b/g, "Stări"],
  [/\bStatus\b/g, "Stare"],
  [/\bBadge-uri\b/g, "Insigne"],
  [/\bBadge\b/g, "Insignă"],
  [/\bUsername-ul\b/g, "Numele de utilizator"],
  [/\bUsername\b/g, "Nume de utilizator"],
  [/\bLinkuri\b/g, "Adrese"],
  [/\bWebsite\b/g, "Site web"],
  [/\bStreak\b/g, "Serie"],
  [/\bChallenge\b/g, "Provocare"],
  [/\bAchievements\b/g, "Realizări"],
  [/\bMastery\b/g, "Stăpânire"],
  [/\bhinturi\b/gi, "indicii"],
  [/\bTag-uri\b/g, "Etichete"],
  [/\bTaguri\b/g, "Etichete"],
  [/\bResearch\b/g, "Cercetare"],
  [/\bDraft\b/g, "Ciornă"],
  [/\bReview\b/g, "Verificare"],
  [/\bAll-time\b/g, "Toată perioada"]

];

const TOKEN_EN = [
  [/\bPanou administrare\b/g, "Admin dashboard"],
  [/\bAdministrare\b/g, "Admin"],
  [/\bPlanuri de studiu\b/g, "Roadmaps"],
  [/\bPlan de studiu\b/g, "Roadmap"],
  [/\bCercetare\b/g, "Research"],
  [/\bIstorie\b/g, "History"],
  [/\bLecții\b/g, "Lessons"],
  [/\bLecție\b/g, "Lesson"],
  [/\bProbleme\b/g, "Problems"],
  [/\bProblemă\b/g, "Problem"],
  [/\bExamene\b/g, "Exams"],
  [/\bExamen\b/g, "Exam"],
  [/\bConținut\b/g, "Content"],
  [/\bConcepte\b/g, "Concepts"],
  [/\bConcept\b/g, "Concept"],
  [/\bInsigne\b/g, "Badges"],
  [/\bInsignă\b/g, "Badge"],
  [/\bRealizări\b/g, "Achievements"],
  [/\bRealizare\b/g, "Achievement"],
  [/\bProvocare\b/g, "Challenge"],
  [/\bȘablon\b/g, "Template"],
  [/\bElemente\b/g, "Items"],
  [/\bElement\b/g, "Item"],
  [/\bNume de utilizator\b/g, "Username"],
  [/\bDescriere\b/g, "Bio"],
  [/\bTitlu scurt\b/g, "Headline"],
  [/\bAdrese\b/g, "Links"],
  [/\bAdresă\b/g, "Link"],
  [/\bSemnalări\b/g, "Flags"],
  [/\bSemnalare\b/g, "Flag"],
  [/\bVerificare\b/g, "Review"],
  [/\bCiornă\b/g, "Draft"],
  [/\bPublicată\b/g, "Published"],
  [/\bPublicat\b/g, "Published"],
  [/\bPublică\b/g, "Publish"],
  [/\bRetrage\b/g, "Revoke"],
  [/\bSalvează\b/g, "Save"],
  [/\bCreează\b/g, "Create"],
  [/\bEditează\b/g, "Edit"],
  [/\bDuplică\b/g, "Duplicate"],
  [/\bȘterge\b/g, "Delete"],
  [/\bÎnchide\b/g, "Close"],
  [/\bDeschide\b/g, "Open"],
  [/\bActualizează\b/g, "Refresh"],
  [/\bCaută\b/g, "Search"],
  [/\bSelectează\b/g, "Select"],
  [/\bAlege\b/g, "Choose"],
  [/\bAdaugă\b/g, "Add"],
  [/\bReîncearcă\b/g, "Retry"],
  [/\bDeconectare\b/g, "Sign out"],
  [/\bStare\b/g, "Status"],
  [/\bPrioritate\b/g, "Priority"],
  [/\bScăzută?\b/g, "Low"],
  [/\bNormală\b/g, "Normal"],
  [/\bRidicată?\b/g, "High"],
  [/\bUrgentă\b/g, "Urgent"],
  [/\bNou\b/g, "New"],
  [/\bÎn analiză\b/g, "In review"],
  [/\bRezolvat\b/g, "Resolved"],
  [/\bÎnchis\b/g, "Closed"],
  [/\bToți\b/g, "All"],
  [/\bDeschise\b/g, "Open"],
  [/\bCritice\b/g, "Critical"],
  [/\bSuspendați\b/g, "Suspended"],
  [/\bMembru\b/g, "Member"],
  [/\bCont test\b/g, "Test account"],
  [/\bCont intern\b/g, "Internal account"],
  [/\bRestricționat\b/g, "Restricted"],
  [/\bObligatoriu\b/g, "Required"],
  [/\bOpțional\b/g, "Optional"],
  [/\bEtapă\b/g, "Stage"],
  [/\bNod\b/g, "Node"],
  [/\bÎntrebare\b/g, "Question"],
  [/\bRăspuns\b/g, "Answer"],
  [/\bSursă\b/g, "Source"],
  [/\bClasă\b/g, "Grade"],
  [/\bCapitol\b/g, "Chapter"],
  [/\bDificultate\b/g, "Difficulty"],
  [/\bAn\b/g, "Year"],
  [/\bTip\b/g, "Type"],
  [/\bOrdine\b/g, "Order"],
  [/\bCuloare\b/g, "Color"],
  [/\bActiv\b/g, "Active"],
  [/\bMotiv\b/g, "Reason"],
  [/\bNotă internă\b/g, "Internal note"],
  [/\bSe încarcă\b/g, "Loading"],
  [/\bSe salvează\b/g, "Saving"],
  [/\bSe șterge\b/g, "Deleting"],
  [/\bSe generează\b/g, "Generating"],
  [/\bSe scanează\b/g, "Scanning"],
  [/\bNu există\b/g, "There are no"],
  [/\bNiciun rezultat\b/g, "No results"]
];

const ORIGINAL_TEXT = new WeakMap();
const ORIGINAL_ATTRIBUTES = new WeakMap();

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function translateValue(value, lang) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  const exact = lang === "en" ? EXACT_EN.get(trimmed) : EXACT_RO.get(trimmed);
  if (exact) return raw.replace(trimmed, exact);
  if (lang === "ro") return TOKEN_RO.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), raw);
  return TOKEN_EN.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), raw);
}

function shouldSkip(node) {
  const parent = node.parentElement;
  return !parent || parent.closest("script,style,textarea,code,pre,[contenteditable='true'],.lesson-content,.problem-statement,.community-public-bio,.mh-admin-content-title-row strong,.mh-community-user-row strong,.mh-community-user-row small,.mh-community-integrity-row strong,.mh-community-integrity-row small,.mh-community-history-list strong,.mh-community-history-list p");
}

function translateRoot(root) {
  if (!(root instanceof Element)) return;
  const lang = language();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (shouldSkip(node)) return;
    if (!ORIGINAL_TEXT.has(node)) ORIGINAL_TEXT.set(node, node.nodeValue);
    const source = ORIGINAL_TEXT.get(node);
    const next = translateValue(source, lang);
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  root.querySelectorAll("[placeholder],[title],[aria-label]").forEach((element) => {
    if (!ORIGINAL_ATTRIBUTES.has(element)) ORIGINAL_ATTRIBUTES.set(element, new Map());
    const originals = ORIGINAL_ATTRIBUTES.get(element);
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      if (!originals.has(attribute)) originals.set(attribute, element.getAttribute(attribute));
      const source = originals.get(attribute);
      const next = translateValue(source, lang);
      if (next !== element.getAttribute(attribute)) element.setAttribute(attribute, next);
    });
  });
}

function adminRoot() {
  return document.querySelector(ADMIN_ROOT_SELECTOR);
}

function refresh() {
  const root = adminRoot();
  if (root) translateRoot(root);
}

function init() {
  refresh();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target === document.documentElement) {
        refresh();
        return;
      }
      const root = adminRoot();
      if (root && (mutation.target === root || root.contains(mutation.target))) {
        queueMicrotask(refresh);
        return;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"], childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
