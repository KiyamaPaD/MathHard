import { supabase } from "./supabase-client.js";

console.log("APP.JS LOADED");

const CHAPTER_TRANSLATIONS = {
  "numere naturale": {
    ro: "Numere Naturale",
    en: "Natural Numbers"
  },
  "multimi": {
    ro: "Mulțimi",
    en: "Sets"
  },
  "divizibilitatea numerelor naturale": {
    ro: "Divizibilitatea Numerelor Naturale",
    en: "Divisibility of Natural Numbers"
  },
  "rapoarte si proportii": {
    ro: "Rapoarte și Proporții",
    en: "Ratios and Proportions"
  },
  "fractii": {
    ro: "Fracții",
    en: "Fractions"
  },
  "fractii ordinare": {
    ro: "Fracții Ordinare",
    en: "Common Fractions"
  },
  "fractii zecimale": {
    ro: "Fracții Zecimale",
    en: "Decimal Fractions"
  },
  "operatii cu fractii": {
    ro: "Operații cu Fracții",
    en: "Operations with Fractions"
  },
  "numere intregi": {
    ro: "Numere Întregi",
    en: "Integers"
  },
  "numere rationale": {
    ro: "Numere Raționale",
    en: "Rational Numbers"
  },
  "numere reale": {
    ro: "Numere Reale",
    en: "Real Numbers"
  },
  "algebra": {
    ro: "Algebră",
    en: "Algebra"
  },
  "geometrie": {
    ro: "Geometrie",
    en: "Geometry"
  },
  "geometrie plana": {
    ro: "Geometrie Plană",
    en: "Plane Geometry"
  },
  "geometrie in spatiu": {
    ro: "Geometrie în Spațiu",
    en: "Solid Geometry"
  },
  "ecuatii": {
    ro: "Ecuații",
    en: "Equations"
  },
  "inecuatii": {
    ro: "Inecuații",
    en: "Inequalities"
  },
  "ecuatii si inecuatii": {
    ro: "Ecuații și Inecuații",
    en: "Equations and Inequalities"
  },
  "functii": {
    ro: "Funcții",
    en: "Functions"
  },
  "siruri": {
    ro: "Șiruri",
    en: "Sequences"
  },
  "progresii": {
    ro: "Progresii",
    en: "Progressions"
  },
  "trigonometrie": {
    ro: "Trigonometrie",
    en: "Trigonometry"
  },
  "combinatorica": {
    ro: "Combinatorică",
    en: "Combinatorics"
  },
  "probabilitati": {
    ro: "Probabilități",
    en: "Probability"
  },
  "statistica": {
    ro: "Statistică",
    en: "Statistics"
  },
  "analiza matematica": {
    ro: "Analiză Matematică",
    en: "Mathematical Analysis"
  },
  "teoria numerelor": {
    ro: "Teoria Numerelor",
    en: "Number Theory"
  },
  "matematica discreta": {
    ro: "Matematică Discretă",
    en: "Discrete Mathematics"
  },
  "logica matematica": {
    ro: "Logică Matematică",
    en: "Mathematical Logic"
  },
  "evaluare nationala": {
    ro: "Evaluare Națională",
    en: "National Evaluation"
  },
  "bacalaureat": {
    ro: "Bacalaureat",
    en: "Baccalaureate"
  },
  "admitere": {
    ro: "Admitere",
    en: "Admissions"
  },
  "olimpiada": {
    ro: "Olimpiadă",
    en: "Olympiad"
  },
  "facultate": {
    ro: "Facultate",
    en: "University"
  },
  "cercetare": {
    ro: "CERCETARE",
    en: "RESEARCH"
  },
  "istoria matematicii": {
    ro: "Istoria matematicii",
    en: "History of Mathematics"
  },
  "istorie": {
    ro: "Istorie",
    en: "History"
  },
  "metode aritmetice de rezolvare a problemelor": {
    ro: "Metode aritmetice de rezolvare a problemelor",
    en: "Arithmetic Problem-Solving Methods"
  },
  "fracții ordinare": {
    ro: "Fracții Ordinare",
    en: "Common Fractions"
  },
  "fracții zecimale": {
    ro: "Fracții Zecimale",
    en: "Decimal Fractions"
  },
  "elemente de geometrie": {
    ro: "Elemente de geometrie",
    en: "Elements of Geometry"
  },
  "unități de măsură": {
    ro: "Unități de măsură",
    en: "Units of Measurement"
  },
  "unitati de masura": {
    ro: "Unități de măsură",
    en: "Units of Measurement"
  },
  "noțiuni fundamentale din geometrie": {
    ro: "Noțiuni Fundamentale Din Geometrie",
    en: "Fundamental Notions of Geometry"
  },
  "notiuni fundamentale din geometrie": {
    ro: "Noțiuni Fundamentale Din Geometrie",
    en: "Fundamental Notions of Geometry"
  },
  "triunghiul": {
    ro: "Triunghiul",
    en: "The Triangle"
  },
  "divizibiliteata numerelor naturale": {
    ro: "Divizibilitatea Numerelor Naturale",
    en: "Divisibility of Natural Numbers"
  }
};

const TAG_TRANSLATIONS = {
  "numere naturale": { ro: "numere naturale", en: "natural numbers" },
  "citire": { ro: "citire", en: "reading" },
  "valoare de pozitie": { ro: "valoare de poziție", en: "place value" },
  "comparare": { ro: "comparare", en: "comparison" },
  "numere": { ro: "numere", en: "numbers" },
  "adunare": { ro: "adunare", en: "addition" },
  "scadere": { ro: "scădere", en: "subtraction" },
  "inmultire": { ro: "înmulțire", en: "multiplication" },
  "impartire": { ro: "împărțire", en: "division" },
  "rest": { ro: "rest", en: "remainder" },
  "operatii": { ro: "operații", en: "operations" },
  "sume": { ro: "sume", en: "sums" },
  "siruri": { ro: "șiruri", en: "sequences" },
  "gauss": { ro: "Gauss", en: "Gauss" },
  "progresie aritmetica": { ro: "progresie aritmetică", en: "arithmetic progression" },
  "proportionalitate": { ro: "proporționalitate", en: "proportionality" },
  "unit rate": { ro: "metoda la unitate", en: "unit rate" },
  "regula de trei simpla": { ro: "regula de trei simplă", en: "rule of three" },
  "divizibilitate": { ro: "divizibilitate", en: "divisibility" },
  "cmmdc": { ro: "CMMDC", en: "GCD" },
  "cmmmc": { ro: "CMMMC", en: "LCM" },
  "factori primi": { ro: "factori primi", en: "prime factors" },
  "fractii": { ro: "fracții", en: "fractions" },
  "echivalenta": { ro: "echivalență", en: "equivalence" },
  "simplificare": { ro: "simplificare", en: "simplifying" },
  "zecimale": { ro: "zecimale", en: "decimals" },
  "rotunjire": { ro: "rotunjire", en: "rounding" },
  "transformari": { ro: "transformări", en: "conversions" },
  "geometrie": { ro: "geometrie", en: "geometry" },
  "segmente": { ro: "segmente", en: "segments" },
  "unghiuri": { ro: "unghiuri", en: "angles" },
  "paralele": { ro: "paralele", en: "parallel lines" },
  "perpendiculare": { ro: "perpendiculare", en: "perpendicular lines" },
  "unitati": { ro: "unități", en: "units" },
  "lungime": { ro: "lungime", en: "length" },
  "perimetru": { ro: "perimetru", en: "perimeter" },
  "conversii": { ro: "conversii", en: "conversions" },
  "ecuatii": { ro: "ecuații", en: "equations" },
  "gradul i": { ro: "gradul I", en: "first degree" },
  "olimpiada": { ro: "olimpiadă", en: "olympiad" },
  "numarare": { ro: "numărare", en: "counting" },
  "aranjari": { ro: "aranjări", en: "arrangements" },
  "facultate": { ro: "facultate", en: "university" },
  "serii": { ro: "serii", en: "series" },
  "congruente": { ro: "congruențe", en: "congruences" },
  "norme": { ro: "norme", en: "norms" },
  "analiza2": { ro: "analiză 2", en: "analysis 2" },
  "topologie": { ro: "topologie", en: "topology" },
  "geometrie liniara": { ro: "geometrie liniară", en: "linear geometry" },
  "al2": { ro: "algebră liniară 2", en: "linear algebra 2" },
  "gaa": { ro: "geometrie analitică avansată", en: "advanced analytic geometry" },
  "evaluare nationala": { ro: "evaluare națională", en: "national evaluation" },
  "bacalaureat": { ro: "bacalaureat", en: "baccalaureate" },
  "analiza": { ro: "analiză", en: "analysis" },
  "admitere": { ro: "admitere", en: "admissions" },
  "ubb": { ro: "UBB", en: "UBB" },
  "cluj": { ro: "Cluj", en: "Cluj" },
  "istorie": { ro: "istorie", en: "history" },
  "collatz": { ro: "Collatz", en: "Collatz" },
  "teoria numerelor": { ro: "teoria numerelor", en: "number theory" },
  "iterare": { ro: "iterare", en: "iteration" },
  "hailstone": { ro: "hailstone", en: "hailstone" },
  "3n+1": { ro: "3n+1", en: "3n+1" },
  "sir grindina": { ro: "șir grindină", en: "hailstone sequence" },
  "research": { ro: "cercetare", en: "research" },
  "prime": { ro: "numere prime", en: "prime numbers" },
  "rapoarte": { ro: "rapoarte", en: "ratios" },
  "multimi": { ro: "mulțimi", en: "sets" }
};

function stripDiacritics(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeChapterKey(chapter) {
  return stripDiacritics(chapter)
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/\s*&\s*/g, " si ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCurrentLangSafe() {
  const lang =
    window.LANG ||
    document.documentElement.lang ||
    "ro";

  return String(lang).toLowerCase().startsWith("en") ? "en" : "ro";
}

function getChapterTranslation(chapter) {
  const raw = String(chapter || "").trim();
  const key = normalizeChapterKey(raw);
  const found = CHAPTER_TRANSLATIONS[key];

  if (found) return found;

  return {
    ro: raw,
    en: raw
  };
}

function getChapterLabel(chapter, lang = getCurrentLangSafe()) {
  const t = getChapterTranslation(chapter);
  return lang === "en" ? t.en : t.ro;
}

function normalizeLesson(L){
  const chapterRo = L.chapter_ro || L.chapter || L.chapter_en || "";
  const chapterEn = L.chapter_en || L.chapter || L.chapter_ro || "";

  return {
    ...L,
    id: L.id || "",
    grade: L.grade || "",

    // legacy + viitor bilingv
    chapter: chapterRo || chapterEn || "",
    chapter_ro: chapterRo,
    chapter_en: chapterEn,

    tags: Array.isArray(L.tags) ? L.tags : [],
    title_ro: L.title_ro || "",
    title_en: L.title_en || "",
    learn_ro: L.learn_ro || "",
    learn_en: L.learn_en || "",
    why_ro: L.why_ro || "",
    why_en: L.why_en || "",
    body_ro: L.body_ro || L.content_ro || "",
    body_en: L.body_en || L.content_en || "",
    examples_ro: L.examples_ro || "",
    examples_en: L.examples_en || "",
    sources: Array.isArray(L.sources)
      ? L.sources
      : (L.source ? [L.source] : [])
  };
}

  function normalizeProblem(P){
    return {
      ...P,
      id: P.id || "",
      lessonId: P.lessonId ?? P.lesson_id ?? "",
      difficulty: Number(P.difficulty ?? 1),
      olympLevel: P.olympLevel ?? P.olymp_level ?? "",
      title_ro: P.title_ro || "",
      title_en: P.title_en || "",
      statement_ro: P.statement_ro || "",
      statement_en: P.statement_en || "",
      answer: P.answer || "",
      hint1_ro: P.hint1_ro || "",
      hint1_en: P.hint1_en || "",
      hint2_ro: P.hint2_ro || "",
      hint2_en: P.hint2_en || "",
      source: P.source || "",
      addedAt: P.addedAt ?? P.added_at ?? ""
    };
  }

  function inferExamOptionMode(item, options) {
    if (item.option_mode) return item.option_mode;

    const count = Number(item.options_count ?? options.length ?? 0);

    if (count === 4) return "A-D";
    if (count === 5) return "A-E";
    return "custom";
  }

  function normalizeExamItem(item = {}, index = 0){
    const options = Array.isArray(item.options)
      ? item.options.map((opt, optIndex) => ({
          id: opt.id || `opt_${index}_${optIndex}`,
          label: opt.label || String.fromCharCode(65 + optIndex),
          text_ro: opt.text_ro || opt.text || "",
          text_en: opt.text_en || opt.text || "",
          is_correct: !!opt.is_correct
        }))
      : [];

    const inferredAllowMultiple =
      typeof item.allow_multiple === "boolean"
        ? item.allow_multiple
        : options.filter(opt => opt.is_correct).length > 1;

    const inferredOptionMode = inferExamOptionMode(item, options);
    const inferredOptionsCount = Number(item.options_count ?? options.length ?? 0);

    return {
      id: item.id || `exam_item_${index}`,
      type: item.type || "open",
      title_ro: item.title_ro || "",
      title_en: item.title_en || "",
      prompt_ro: item.prompt_ro || item.statement_ro || "",
      prompt_en: item.prompt_en || item.statement_en || "",
      answer: item.answer || "",
      points: Number(item.points ?? 0),
      options_count: inferredOptionsCount,
      option_mode: inferredOptionMode,
      allow_multiple: inferredAllowMultiple,
      allow_none: !!item.allow_none,
      image_url: item.image_url || item.image || "",
      image_alt: item.image_alt || "",
      image_caption_ro: item.image_caption_ro || "",
      image_caption_en: item.image_caption_en || "",
      options
    };
  }

  function normalizeExam(E){
    const problemsArray =
      Array.isArray(E.problems) ? E.problems :
      Array.isArray(E.exam_problems) ? E.exam_problems :
      typeof E.exam_problems === "string"
        ? E.exam_problems.split(",").map(x => x.trim()).filter(Boolean)
        : [];

    const itemsArray =
      Array.isArray(E.items)
        ? E.items.map((item, index) => normalizeExamItem(item, index))
        : [];

    return {
      ...E,
      id: E.id || "",
      type: E.type ?? E.exam_type ?? "",
      year: Number(E.year ?? E.exam_year ?? 0),
      title_ro: E.title_ro ?? E.exam_title_ro ?? "",
      title_en: E.title_en ?? E.exam_title_en ?? "",
      defaultHours: Number(E.defaultHours ?? E.exam_hours ?? 2),
      problems: problemsArray,
      items: itemsArray,
      scoring_profile: E.scoring_profile || "default_exact_v1",
      scoring_config: E.scoring_config || null,
      credit_html: E.credit_html ?? E.exam_credit ?? ""
    };
  }

  const BASE_DATA = {
    lessons: (DATA.lessons || []).map(normalizeLesson),
    problems: (DATA.problems || []).map(normalizeProblem),
    exams: (DATA.exams || []).map(normalizeExam)
  };

  /* ===== Utils ===== */
  const esc = s => String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

  const TIP_RO = '💡 Pentru a bifa o lecție: derulează până jos <b>și</b> așteaptă să se termine timerul de 1 minut.';
  const TIP_EN = '💡 To mark a lesson as learned: scroll to the bottom <b>and</b> wait for the 1-minute timer.';
  
  // Texte pentru sloganul din HERO
  const HERO_VARIANTS_RO = [
  "lecții clare, cu exemple",
  "probleme mixte, de la 0 la olimpiadă",
  "seturi EN & BAC organizate",
  "cercetare explicată pe românește",
  "povești din istoria matematicii"
  ];
  const HERO_VARIANTS_EN = [
  "crisp lessons with examples",
  "mixed problems from school to olympiad",
  "structured EN & BAC training",
  "research topics explained simply",
  "stories from the history of math"
  ];

  // Prag de promovare examene
  const PASS_THRESHOLD = 60;

  const MAIN_UI_TEXT = {
    ro: {
      header: {
        info_btn: "ℹ️ Dificultăți & Contoare",
        about_btn: "👤 About me",
        profile_btn: "📊 Profilul tău",
        admin_btn: "🛠 Admin",
        modal_close: "Închide",
        stats_titles: [
          "Probleme rezolvate / Problems solved",
          "Lecții învățate / Lessons learned",
          "Examene promovate / Exams passed",
          "XP total (doar probleme normale)"
        ]
      },

      progress_cards: {
        solved_title: "✅ Probleme rezolvate",
        solved_sub: "Apasă pentru listă",
        learned_title: "📘 Lecții învățate",
        learned_sub: "Apasă pentru listă",
        passed_title: "🏆 Examene promovate",
        passed_sub: "Apasă pentru listă"
      },

      about: {
        title: "👋 Despre MathHard & autor",
        subtitle: `Gândește-te la MathHard ca la un mic joc video de matematică: ai <b>lecții</b>, <b>probleme</b>, <b>XP</b> și <b>„boss fight-uri”</b> la examene.`,
        pills: [
          "📘 Lecții de la clasa a V-a până la facultate",
          "🧩 Probleme cu verificare instant",
          "⚡ XP — puncte de experiență, nu note",
          "📑 EN / BAC / Admitere",
          "🏅 Olimpiadă & 🔬 Cercetare"
        ],
        bullets: [
          "Ce este MathHard?",
          "Cum folosești site-ul",
          "Ce înseamnă tab-urile de sus",
          "Pentru cine e făcut",
          "Cine a făcut MathHard?"
        ],
        sections: {
          what: {
            title: "1. Ce este MathHard?",
            body: `
              <p>MathHard este un loc unde înveți matematică <b>pas cu pas</b>. Nu trebuie să fii „geniu”. Ideea este:</p>
              <ul>
                <li>📘 mai întâi citești o <b>lecție scurtă și clară</b>,</li>
                <li>🧩 apoi rezolvi câteva <b>probleme</b>,</li>
                <li>⚡ primești <b>XP</b> (puncte de experiență),</li>
                <li>🔁 și tot așa, până ajungi la examene, olimpiadă sau chiar cercetare.</li>
              </ul>
              <p>Gândește-te la fiecare lecție ca la un <b>nivel de joc</b>, iar la probleme ca la <b>mini-misiuni</b> care îți dau XP.</p>
            `
          },
          how: {
            title: "2. Cum folosești site-ul",
            body: `
              <ol>
                <li>🔎 <b>Cauți</b> sus ce te interesează (clasă, „fracții”, „ecuații”…).</li>
                <li>📘 Apeși pe o <b>lecție</b> din stânga.</li>
                <li>📜 Se deschide lecția și citești până jos.</li>
                <li>⏳ Aștepți <b>1 minut</b> ca să nu sari lecția instant.</li>
                <li>✅ Butonul „Am înțeles” se deblochează și lecția se bifează.</li>
                <li>🧩 Apoi mergi la tab-ul „Probleme” și exersezi.</li>
              </ol>
              <p>Sus, în header, vezi mereu câte <b>probleme</b>, <b>lecții</b> și <b>examene</b> ai făcut, plus <b>XP total</b>.</p>
            `
          },
          tabs: {
            title: "3. Ce înseamnă tab-urile de sus?",
            body: `
              <ul>
                <li>📘 <b>Lecții</b> — teoria, de la școală până la facultate și research.</li>
                <li>🧩 <b>Probleme</b> — exerciții, antrenament, probleme de școală și olimpiadă.</li>
                <li>⚡ <b>XP Total</b> — vezi experiența strânsă din probleme.</li>
                <li>📑 <b>Examene</b> — seturi EN, BAC și admitere, puse ca mini-examene.</li>
                <li>🔬 <b>CERCETARE</b> — idei mai avansate explicate simplu.</li>
                <li>🕰 <b>Istoria</b> — povești despre oameni și idei faine din matematică.</li>
              </ul>
              <p>Pe scurt: tab-urile sunt ca niște <b>rafturi de bibliotecă</b>. Alegi raftul, apoi conținutul.</p>
            `
          },
          who: {
            title: "4. Pentru cine este MathHard?",
            body: `
              <ul>
                <li>🎒 elevi de gimnaziu care vor explicații liniștite și clare;</li>
                <li>🎓 liceeni care se pregătesc de <b>EN</b> sau <b>BAC</b>;</li>
                <li>🏅 copii și adolescenți pasionați de <b>olimpiadă</b>;</li>
                <li>🏛 studenți la început de drum care vor recapitulare;</li>
                <li>👨‍🏫 profesori / părinți care caută explicații mai simple.</li>
              </ul>
              <p>Dacă îți place să <b>înțelegi cu adevărat</b>, nu doar să memorezi, atunci ești exact unde trebuie.</p>
            `
          },
          me: {
            title: "5. Cine a făcut MathHard?",
            body: `
              <p>Mă cheamă <b>Gabor Cristian-Daniel</b> și sunt licean la <b>Colegiul Tehnic INFOEL din Bistrița</b>.</p>
              <p>Nu am vrut să-mi notez lecțiile, ideile de olimpiadă, research sau facultate prin caiete și foi pierdute. Mi s-a părut mult mai tare să le strâng într-un singur loc și, în același timp, să arăt lumii cât de faină poate fi matematica.</p>
              <ul>
                <li>lecții scurte, clare și ușor de recitit,</li>
                <li>probleme alese, nu doar exerciții clasice,</li>
                <li>idei care merg mai departe decât ce se face la clasă.</li>
              </ul>
              <p>MathHard este locul unde îmi organizez tot ce descopăr și dau mai departe ceea ce mi se pare interesant.</p>
            `
          }
        }
      },

      info_modal: {
        title: "ℹ️ Dificultăți & Contoare",
        body: `
          <h4>Contoare</h4>
          <ul>
            <li>✅ <b>Probleme rezolvate</b> — crește la primul răspuns corect.</li>
            <li>📘 <b>Lecții învățate</b> — după derulare + timer + „Am înțeles”.</li>
            <li>🏆 <b>Examene promovate</b> — scor ≥ ${PASS_THRESHOLD}p.</li>
            <li>⚡ <b>XP total</b> — vine doar din <b>probleme normale</b>, nu din examene.</li>
          </ul>

          <h4>XP</h4>
          <ul>
            <li>pornești de la <b>10 XP</b> pe problemă;</li>
            <li>fiecare răspuns greșit scade <b>1 XP</b>;</li>
            <li>fiecare hint folosit scade <b>1 XP</b>;</li>
            <li>XP-ul rămâne între <b>0 și 10</b>;</li>
            <li>primești XP doar la <b>prima</b> rezolvare corectă.</li>
          </ul>

          <h4>Dificultăți (0–5)</h4>
          <ul>
            <li><b>0</b> — verificare teorie;</li>
            <li><b>1</b> — ușor;</li>
            <li><b>2</b> — intermediar;</li>
            <li><b>3</b> — mediu;</li>
            <li><b>4</b> — dificil;</li>
            <li><b>5</b> — nivel olimpiadă.</li>
          </ul>
        `
      }
    },

    en: {
      header: {
        info_btn: "ℹ️ Difficulty & Counters",
        about_btn: "👤 About me",
        profile_btn: "📊 Your profile",
        admin_btn: "🛠 Admin",
        modal_close: "Close",
        stats_titles: [
          "Problems solved",
          "Lessons learned",
          "Exams passed",
          "Total XP (regular problems only)"
        ]
      },

      progress_cards: {
        solved_title: "✅ Problems solved",
        solved_sub: "Tap to view the list",
        learned_title: "📘 Lessons learned",
        learned_sub: "Tap to view the list",
        passed_title: "🏆 Exams passed",
        passed_sub: "Tap to view the list"
      },

      about: {
        title: "👋 About MathHard & the author",
        subtitle: `Think of MathHard as a small math video game: you have <b>lessons</b>, <b>problems</b>, <b>XP</b>, and <b>boss fights</b> in exams.`,
        pills: [
          "📘 Lessons from grade 5 to university",
          "🧩 Problems with instant checking",
          "⚡ XP — experience points, not grades",
          "📑 EN / BAC / Admissions",
          "🏅 Olympiad & 🔬 Research"
        ],
        bullets: [
          "What is MathHard?",
          "How to use the site",
          "What the top tabs mean",
          "Who it is for",
          "Who built MathHard?"
        ],
        sections: {
          what: {
            title: "1. What is MathHard?",
            body: `
              <p>MathHard is a place where you learn math <b>step by step</b>. You do not need to be a genius. The idea is:</p>
              <ul>
                <li>📘 first you read a <b>short and clear lesson</b>,</li>
                <li>🧩 then you solve a few <b>problems</b>,</li>
                <li>⚡ you earn <b>XP</b> (experience points),</li>
                <li>🔁 and you keep going until exams, olympiads, or even research topics.</li>
              </ul>
              <p>Think of each lesson as a <b>game level</b>, and each problem as a <b>mini mission</b> that gives XP.</p>
            `
          },
          how: {
            title: "2. How to use the site",
            body: `
              <ol>
                <li>🔎 <b>Search</b> at the top for what you need.</li>
                <li>📘 Open a <b>lesson</b> from the left side.</li>
                <li>📜 Read the lesson down to the bottom.</li>
                <li>⏳ Wait <b>1 minute</b> so lessons cannot be skipped instantly.</li>
                <li>✅ The “I understood” button unlocks and the lesson is marked.</li>
                <li>🧩 Then go to the Problems tab and practice.</li>
              </ol>
              <p>At the top, you always see how many <b>problems</b>, <b>lessons</b>, <b>exams</b>, and how much <b>XP</b> you have.</p>
            `
          },
          tabs: {
            title: "3. What do the top tabs mean?",
            body: `
              <ul>
                <li>📘 <b>Lessons</b> — theory from school to university and research.</li>
                <li>🧩 <b>Problems</b> — exercises, training, school and olympiad problems.</li>
                <li>⚡ <b>Total XP</b> — your total experience from problems.</li>
                <li>📑 <b>Exams</b> — EN, BAC, and admission sets shown as mini-exams.</li>
                <li>🔬 <b>RESEARCH</b> — more advanced ideas explained simply.</li>
                <li>🕰 <b>History</b> — stories about people and ideas in mathematics.</li>
              </ul>
              <p>In short: the tabs are like <b>bookshelves</b>. You choose the shelf, then the content.</p>
            `
          },
          who: {
            title: "4. Who is MathHard for?",
            body: `
              <ul>
                <li>🎒 middle school students who want calm and clear explanations;</li>
                <li>🎓 high school students preparing for <b>EN</b> or <b>BAC</b>;</li>
                <li>🏅 students passionate about <b>olympiads</b>;</li>
                <li>🏛 beginners at university who want review material;</li>
                <li>👨‍🏫 teachers / parents looking for simpler explanations.</li>
              </ul>
              <p>If you like to <b>truly understand</b>, not just memorize, you are in the right place.</p>
            `
          },
          me: {
            title: "5. Who built MathHard?",
            body: `
              <p>My name is <b>Gabor Cristian-Daniel</b> and I am a high school student at <b>Colegiul Tehnic INFOEL in Bistrița</b>.</p>
              <p>I did not want to keep olympiad ideas, research notes, and university-level lessons in random notebooks and papers. It felt much better to gather everything in one place and also show people how cool math can be.</p>
              <ul>
                <li>short, clear lessons that are easy to revisit,</li>
                <li>selected problems, not just classic textbook exercises,</li>
                <li>ideas that go a bit beyond normal class material.</li>
              </ul>
              <p>MathHard is the place where I organize what I discover and share what I find interesting.</p>
            `
          }
        }
      },

      info_modal: {
        title: "ℹ️ Difficulty & Counters",
        body: `
          <h4>Counters</h4>
          <ul>
            <li>✅ <b>Problems solved</b> — increases at the first correct answer.</li>
            <li>📘 <b>Lessons learned</b> — after scroll + timer + “I understood”.</li>
            <li>🏆 <b>Exams passed</b> — score ≥ ${PASS_THRESHOLD}p.</li>
            <li>⚡ <b>Total XP</b> — comes only from <b>regular problems</b>, not exams.</li>
          </ul>

          <h4>XP</h4>
          <ul>
            <li>you start from <b>10 XP</b> per problem;</li>
            <li>each wrong answer removes <b>1 XP</b>;</li>
            <li>each hint removes <b>1 XP</b>;</li>
            <li>XP stays between <b>0 and 10</b>;</li>
            <li>you earn XP only on the <b>first</b> correct solve.</li>
          </ul>

          <h4>Difficulties (0–5)</h4>
          <ul>
            <li><b>0</b> — theory check;</li>
            <li><b>1</b> — easy;</li>
            <li><b>2</b> — intermediate;</li>
            <li><b>3</b> — medium;</li>
            <li><b>4</b> — hard;</li>
            <li><b>5</b> — olympiad level.</li>
          </ul>
        `
      }
    }
  };



  function applyMainStaticTexts(){
    const ui = MAIN_UI_TEXT[LANG] || MAIN_UI_TEXT.ro;

    // ===== header buttons =====
    const infoBtn = document.getElementById("infoBtn");
    const aboutBtn = document.getElementById("aboutBtn");
    const profileBtn = document.getElementById("profileBtn");
    const adminBtn = document.getElementById("adminBtn");
    const closeModalBtn = document.getElementById("closeModal");
    const aboutCloseBtn = document.getElementById("aboutCloseBtn");

    if (infoBtn) infoBtn.textContent = ui.header.info_btn;
    if (aboutBtn) aboutBtn.textContent = ui.header.about_btn;
    if (profileBtn) profileBtn.textContent = ui.header.profile_btn;
    if (adminBtn) adminBtn.textContent = ui.header.admin_btn;
    if (closeModalBtn) closeModalBtn.textContent = ui.header.modal_close;
    if (aboutCloseBtn) aboutCloseBtn.textContent = ui.header.modal_close;

    // ===== top counters titles =====
    const topCounters = document.querySelectorAll(".header-stats .counter");
    if (topCounters[0]) topCounters[0].title = ui.header.stats_titles[0];
    if (topCounters[1]) topCounters[1].title = ui.header.stats_titles[1];
    if (topCounters[2]) topCounters[2].title = ui.header.stats_titles[2];
    if (topCounters[3]) topCounters[3].title = ui.header.stats_titles[3];

    // ===== progress cards =====
    const solvedTitle = document.querySelector("#openSolved .title");
    const solvedSub = document.querySelector("#openSolved .legend");
    const learnedTitle = document.querySelector("#openLearned .title");
    const learnedSub = document.querySelector("#openLearned .legend");
    const passedTitle = document.querySelector("#openPassed .title");
    const passedSub = document.querySelector("#openPassed .legend");

    if (solvedTitle) solvedTitle.textContent = ui.progress_cards.solved_title;
    if (solvedSub) solvedSub.textContent = ui.progress_cards.solved_sub;
    if (learnedTitle) learnedTitle.textContent = ui.progress_cards.learned_title;
    if (learnedSub) learnedSub.textContent = ui.progress_cards.learned_sub;
    if (passedTitle) passedTitle.textContent = ui.progress_cards.passed_title;
    if (passedSub) passedSub.textContent = ui.progress_cards.passed_sub;

    // ===== about modal =====
    const aboutTitle = document.querySelector("#aboutModal .about-title");
    const aboutSubtitle = document.querySelector("#aboutModal .about-subtitle");
    const aboutPills = document.querySelectorAll("#aboutModal .about-pill");
    const aboutBullets = document.querySelectorAll("#aboutModal .story-bullet");

    if (aboutTitle) aboutTitle.textContent = ui.about.title;
    if (aboutSubtitle) aboutSubtitle.innerHTML = ui.about.subtitle;

    ui.about.pills.forEach((text, i) => {
      if (aboutPills[i]) aboutPills[i].textContent = text;
    });

    ui.about.bullets.forEach((text, i) => {
      if (aboutBullets[i]) aboutBullets[i].textContent = text;
    });

    const secWhat = document.getElementById("about-what");
    const secHow = document.getElementById("about-how");
    const secTabs = document.getElementById("about-tabs");
    const secWho = document.getElementById("about-who");
    const secMe = document.getElementById("about-me");

    if (secWhat) secWhat.innerHTML = `<h3>${ui.about.sections.what.title}</h3>${ui.about.sections.what.body}`;
    if (secHow) secHow.innerHTML = `<h3>${ui.about.sections.how.title}</h3>${ui.about.sections.how.body}`;
    if (secTabs) secTabs.innerHTML = `<h3>${ui.about.sections.tabs.title}</h3>${ui.about.sections.tabs.body}`;
    if (secWho) secWho.innerHTML = `<h3>${ui.about.sections.who.title}</h3>${ui.about.sections.who.body}`;
    if (secMe) secMe.innerHTML = `<h3>${ui.about.sections.me.title}</h3>${ui.about.sections.me.body}`;
  }

  const MH_MATH_INPUT_GROUPS = [
    {
      title: "Bază",
      buttons: [
        { label: "√", insert: "sqrt(¦)", hint: "sqrt(x)" },
        { label: "ⁿ√", insert: "root(3,¦)", hint: "root(3,x)" },
        { label: "a/b", insert: "frac(¦,b)", hint: "frac(a,b)" },
        { label: "|x|", insert: "abs(¦)", hint: "abs(x)" },
        { label: "||x||", insert: "norm(¦)", hint: "norm(x)" },
        { label: "⌊x⌋", insert: "floor(¦)", hint: "floor(x)" },
        { label: "⌈x⌉", insert: "ceil(¦)", hint: "ceil(x)" },
        { label: "( )", insert: "(¦)", hint: "(...)" },
        { label: "[ ]", insert: "[¦]", hint: "[...]" },
        { label: "{ }", insert: "{¦}", hint: "{...}" },
        { label: "π", insert: "π", hint: "π" },
        { label: "e", insert: "e", hint: "e" },
        { label: "∞", insert: "∞", hint: "∞" },
        { label: "±", insert: "±", hint: "±x" }
      ]
    },
    {
      title: "Funcții",
      buttons: [
        { label: "sin", insert: "sin(¦)", hint: "sin(x)" },
        { label: "cos", insert: "cos(¦)", hint: "cos(x)" },
        { label: "tan", insert: "tan(¦)", hint: "tan(x)" },
        { label: "cot", insert: "cot(¦)", hint: "cot(x)" },
        { label: "ln", insert: "ln(¦)", hint: "ln(x)" },
        { label: "logₐ", insert: "log(2,¦)", hint: "log(a,x)" },
        { label: "exp", insert: "e^(¦)", hint: "e^(x)" },
        { label: "binom", insert: "binom(n,¦)", hint: "binom(n,k)" }
      ]
    },
    {
      title: "Calcul",
      buttons: [
        { label: "d/dx", insert: "diff(¦,x)", hint: "diff(expr,x)" },
        { label: "d²/dx²", insert: "diff(¦,x,2)", hint: "diff(expr,x,2)" },
        { label: "∂/∂x", insert: "pdiff(¦,x)", hint: "pdiff(expr,x)" },
        { label: "∂²/∂x²", insert: "pdiff(¦,x,2)", hint: "pdiff(expr,x,2)" },
        { label: "∫", insert: "int(¦,dx)", hint: "int(expr,dx)" },
        { label: "∫ₐᵇ", insert: "int(0,1,¦,dx)", hint: "int(a,b,expr,dx)" },
        { label: "∬", insert: "iint(D,¦,dA)", hint: "iint(D,expr,dA)" },
        { label: "∭", insert: "iiint(V,¦,dV)", hint: "iiint(V,expr,dV)" },
        { label: "∮", insert: "oint(C,¦,dz)", hint: "oint(C,expr,dz)" },
        { label: "lim", insert: "lim(x->0,¦)", hint: "lim(x->0,expr)" },
        { label: "Σ", insert: "sum(k=1,n,¦)", hint: "sum(k=1,n,expr)" },
        { label: "Π", insert: "prod(k=1,n,¦)", hint: "prod(k=1,n,expr)" },
        { label: "[ ]ₐᵇ", insert: "eval(¦,a,b)", hint: "eval(expr,a,b)" }
      ]
    },
    {
      title: "Mulțimi / logică",
      buttons: [
        { label: "∈", insert: "∈", hint: "apartine" },
        { label: "∉", insert: "∉", hint: "nu apartine" },
        { label: "⊂", insert: "⊂", hint: "submultime" },
        { label: "⊆", insert: "⊆", hint: "submultime sau egal" },
        { label: "∪", insert: "∪", hint: "reuniune" },
        { label: "∩", insert: "∩", hint: "intersectie" },
        { label: "\\", insert: "\\", hint: "diferenta de multimi" },
        { label: "≤", insert: "<=", hint: "<=" },
        { label: "≥", insert: ">=", hint: ">=" },
        { label: "≠", insert: "!=", hint: "!=" },
        { label: "≈", insert: "≈", hint: "aprox egal" },
        { label: "→", insert: "->", hint: "->" },
        { label: "⇔", insert: "<=>", hint: "<=>" },
        { label: "ℕ", insert: "ℕ", hint: "naturale" },
        { label: "ℤ", insert: "ℤ", hint: "intregi" },
        { label: "ℚ", insert: "ℚ", hint: "rationale" },
        { label: "ℝ", insert: "ℝ", hint: "reale" },
        { label: "ℂ", insert: "ℂ", hint: "complexe" },
        { label: "∅", insert: "∅", hint: "multimea vida" }
      ]
    },
    {
      title: "Grecești / utile",
      buttons: [
        { label: "α", insert: "α", hint: "alpha" },
        { label: "β", insert: "β", hint: "beta" },
        { label: "γ", insert: "γ", hint: "gamma" },
        { label: "Δ", insert: "Δ", hint: "Delta" },
        { label: "θ", insert: "θ", hint: "theta" },
        { label: "λ", insert: "λ", hint: "lambda" },
        { label: "μ", insert: "μ", hint: "mu" },
        { label: "σ", insert: "σ", hint: "sigma" },
        { label: "φ", insert: "φ", hint: "phi" },
        { label: "ω", insert: "ω", hint: "omega" },
        { label: "∂", insert: "∂", hint: "partial" },
        { label: "vec", insert: "vec(¦)", hint: "vec(v)" },
        { label: "hat", insert: "hat(¦)", hint: "hat(x)" },
        { label: "bar", insert: "bar(¦)", hint: "bar(x)" }
      ]
    }
  ];

  function mhInsertAtCursor(input, template) {
    if (!input) return;

    const marker = "¦";
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const selected = input.value.slice(start, end);

    let insertText = String(template || "");
    let cursorPos = null;

    const markerIndex = insertText.indexOf(marker);
    if (markerIndex !== -1) {
      insertText = insertText.replace(marker, selected || "");
      cursorPos = start + markerIndex + (selected ? selected.length : 0);
    }

    const before = input.value.slice(0, start);
    const after = input.value.slice(end);

    input.value = before + insertText + after;

    const finalPos = cursorPos ?? (start + insertText.length);
    input.focus();
    input.setSelectionRange(finalPos, finalPos);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function mhSplitTopLevel(str, separator = ",") {
    const out = [];
    let cur = "";
    let par = 0;
    let sq = 0;
    let br = 0;

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      if (ch === "(") par++;
      else if (ch === ")") par--;
      else if (ch === "[") sq++;
      else if (ch === "]") sq--;
      else if (ch === "{") br++;
      else if (ch === "}") br--;

      if (ch === separator && par === 0 && sq === 0 && br === 0) {
        out.push(cur.trim());
        cur = "";
        continue;
      }

      cur += ch;
    }

    if (cur.trim() || out.length) out.push(cur.trim());
    return out.filter(Boolean);
  }

  function mhIsWrappedBy(str, open, close) {
    str = String(str || "").trim();
    if (!str.startsWith(open) || !str.endsWith(close)) return false;

    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === open) depth++;
      if (ch === close) depth--;

      if (depth === 0 && i < str.length - 1) {
        return false;
      }
    }

    return true;
  }

  function mhTryFunctionCall(str) {
    const s = String(str || "").trim();
    const m = s.match(/^([A-Za-z][A-Za-z0-9_]*)\(/);
    if (!m) return null;

    const name = m[1];
    const rest = s.slice(name.length);
    if (!mhIsWrappedBy(rest, "(", ")")) return null;

    const inner = rest.slice(1, -1);
    return {
      name: name.toLowerCase(),
      args: mhSplitTopLevel(inner)
    };
  }

  function mhApplySimpleSymbolLatex(s) {
    let out = String(s || "");

    out = out.replace(/<=>/g, "\\Leftrightarrow ");
    out = out.replace(/<=/g, "\\le ");
    out = out.replace(/>=/g, "\\ge ");
    out = out.replace(/!=/g, "\\ne ");
    out = out.replace(/->/g, "\\to ");
    out = out.replace(/≈/g, "\\approx ");

    out = out.replace(/∪/g, "\\cup ");
    out = out.replace(/∩/g, "\\cap ");
    out = out.replace(/∈/g, "\\in ");
    out = out.replace(/∉/g, "\\notin ");
    out = out.replace(/⊂/g, "\\subset ");
    out = out.replace(/⊆/g, "\\subseteq ");
    out = out.replace(/∅/g, "\\varnothing ");
    out = out.replace(/\\/g, "\\setminus ");

    out = out.replace(/ℕ/g, "\\mathbb{N}");
    out = out.replace(/ℤ/g, "\\mathbb{Z}");
    out = out.replace(/ℚ/g, "\\mathbb{Q}");
    out = out.replace(/ℝ/g, "\\mathbb{R}");
    out = out.replace(/ℂ/g, "\\mathbb{C}");

    out = out.replace(/\bN\b/g, "\\mathbb{N}");
    out = out.replace(/\bZ\b/g, "\\mathbb{Z}");
    out = out.replace(/\bQ\b/g, "\\mathbb{Q}");
    out = out.replace(/\bR\b/g, "\\mathbb{R}");
    out = out.replace(/\bC\b/g, "\\mathbb{C}");

    out = out.replace(/\bpi\b/gi, "\\pi");
    out = out.replace(/π/g, "\\pi");
    out = out.replace(/\binf\b/gi, "\\infty");
    out = out.replace(/∞/g, "\\infty");

    out = out.replace(/\balpha\b/gi, "\\alpha");
    out = out.replace(/\bbeta\b/gi, "\\beta");
    out = out.replace(/\bgamma\b/gi, "\\gamma");
    out = out.replace(/\bdelta\b/gi, "\\delta");
    out = out.replace(/\btheta\b/gi, "\\theta");
    out = out.replace(/\blambda\b/gi, "\\lambda");
    out = out.replace(/\bmu\b/gi, "\\mu");
    out = out.replace(/\bsigma\b/gi, "\\sigma");
    out = out.replace(/\bphi\b/gi, "\\phi");
    out = out.replace(/\bomega\b/gi, "\\omega");

    out = out.replace(/α/g, "\\alpha");
    out = out.replace(/β/g, "\\beta");
    out = out.replace(/γ/g, "\\gamma");
    out = out.replace(/Δ/g, "\\Delta");
    out = out.replace(/δ/g, "\\delta");
    out = out.replace(/θ/g, "\\theta");
    out = out.replace(/λ/g, "\\lambda");
    out = out.replace(/μ/g, "\\mu");
    out = out.replace(/σ/g, "\\sigma");
    out = out.replace(/φ/g, "\\phi");
    out = out.replace(/ω/g, "\\omega");
    out = out.replace(/∂/g, "\\partial ");

    out = out.replace(/\^\(([^()]+)\)/g, (_, inner) => `^{${mhMathPreviewToLatex(inner)}}`);
    out = out.replace(/_\(([^()]+)\)/g, (_, inner) => `_{${mhMathPreviewToLatex(inner)}}`);

    out = out.replace(/\*/g, " \\cdot ");

    return out;
  }

  function mhFormatDiffVar(raw) {
    const s = String(raw || "").trim();
    if (!s) return "dx";

    if (/^d/.test(s) || /^∂/.test(s)) {
      return mhMathPreviewToLatex(s);
    }

    return "d" + mhMathPreviewToLatex(s);
  }

  function mhWrapParen(latex) {
    return `\\left(${latex}\\right)`;
  }

  function mhWrapBracket(latex) {
    return `\\left[${latex}\\right]`;
  }

  function mhWrapBrace(latex) {
    return `\\left\\{${latex}\\right\\}`;
  }

  function mhFunc1(latexName, arg) {
    return `${latexName}${mhWrapParen(mhMathPreviewToLatex(arg))}`;
  }

  function mhMathPreviewToLatex(raw) {
    let s = String(raw || "").trim();
    if (!s) return "";

    s = s
      .replace(/[\u2212\u2013\u2014]/g, "-")
      .replace(/⋅|·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, " ")
      .trim();

    if (mhIsWrappedBy(s, "{", "}")) {
      const inner = s.slice(1, -1);
      const parts = mhSplitTopLevel(inner);
      return mhWrapBrace(parts.map(mhMathPreviewToLatex).join(", "));
    }

    if (
      (s.startsWith("[") || s.startsWith("(")) &&
      (s.endsWith("]") || s.endsWith(")"))
    ) {
      const inner = s.slice(1, -1);
      const parts = mhSplitTopLevel(inner);

      if (parts.length === 2) {
        const left = mhMathPreviewToLatex(parts[0]);
        const right = mhMathPreviewToLatex(parts[1]);
        const open = s.startsWith("[") ? "\\left[" : "\\left(";
        const close = s.endsWith("]") ? "\\right]" : "\\right)";
        return `${open}${left}, ${right}${close}`;
      }
    }

    const call = mhTryFunctionCall(s);
    if (call) {
      const { name, args } = call;

      if (name === "sqrt" && args.length >= 1) {
        return `\\sqrt{${mhMathPreviewToLatex(args[0])}}`;
      }

      if (name === "root" && args.length >= 2) {
        return `\\sqrt[${mhMathPreviewToLatex(args[0])}]{${mhMathPreviewToLatex(args[1])}}`;
      }

      if (name === "frac" && args.length >= 2) {
        return `\\frac{${mhMathPreviewToLatex(args[0])}}{${mhMathPreviewToLatex(args[1])}}`;
      }

      if (name === "abs" && args.length >= 1) {
        return `\\left|${mhMathPreviewToLatex(args[0])}\\right|`;
      }

      if (name === "norm" && args.length >= 1) {
        return `\\left\\lVert ${mhMathPreviewToLatex(args[0])} \\right\\rVert`;
      }

      if (name === "floor" && args.length >= 1) {
        return `\\left\\lfloor ${mhMathPreviewToLatex(args[0])} \\right\\rfloor`;
      }

      if (name === "ceil" && args.length >= 1) {
        return `\\left\\lceil ${mhMathPreviewToLatex(args[0])} \\right\\rceil`;
      }

      if (name === "sin") return mhFunc1("\\sin", args[0] || "");
      if (name === "cos") return mhFunc1("\\cos", args[0] || "");
      if (name === "tan" || name === "tg") return mhFunc1("\\tan", args[0] || "");
      if (name === "cot" || name === "ctg") return mhFunc1("\\cot", args[0] || "");
      if (name === "sec") return mhFunc1("\\sec", args[0] || "");
      if (name === "csc") return mhFunc1("\\csc", args[0] || "");
      if (name === "ln") return mhFunc1("\\ln", args[0] || "");

      if (name === "log") {
        if (args.length === 1) {
          return `\\log${mhWrapParen(mhMathPreviewToLatex(args[0]))}`;
        }
        if (args.length >= 2) {
          return `\\log_{${mhMathPreviewToLatex(args[0])}}${mhWrapParen(mhMathPreviewToLatex(args[1]))}`;
        }
      }

      if (name === "sum" && args.length >= 3) {
        return `\\sum_{${mhMathPreviewToLatex(args[0])}}^{${mhMathPreviewToLatex(args[1])}} ${mhMathPreviewToLatex(args[2])}`;
      }

      if (name === "prod" && args.length >= 3) {
        return `\\prod_{${mhMathPreviewToLatex(args[0])}}^{${mhMathPreviewToLatex(args[1])}} ${mhMathPreviewToLatex(args[2])}`;
      }

      if (name === "lim" && args.length >= 2) {
        return `\\lim_{${mhMathPreviewToLatex(args[0])}} ${mhMathPreviewToLatex(args[1])}`;
      }

      if (name === "int") {
        if (args.length >= 4) {
          return `\\int_{${mhMathPreviewToLatex(args[0])}}^{${mhMathPreviewToLatex(args[1])}} ${mhMathPreviewToLatex(args[2])}\\,${mhFormatDiffVar(args[3])}`;
        }
        if (args.length >= 2) {
          return `\\int ${mhMathPreviewToLatex(args[0])}\\,${mhFormatDiffVar(args[1])}`;
        }
      }

      if (name === "iint") {
        if (args.length >= 3) {
          return `\\iint_{${mhMathPreviewToLatex(args[0])}} ${mhMathPreviewToLatex(args[1])}\\,${mhFormatDiffVar(args[2])}`;
        }
        if (args.length >= 2) {
          return `\\iint ${mhMathPreviewToLatex(args[0])}\\,${mhFormatDiffVar(args[1])}`;
        }
      }

      if (name === "iiint") {
        if (args.length >= 3) {
          return `\\iiint_{${mhMathPreviewToLatex(args[0])}} ${mhMathPreviewToLatex(args[1])}\\,${mhFormatDiffVar(args[2])}`;
        }
        if (args.length >= 2) {
          return `\\iiint ${mhMathPreviewToLatex(args[0])}\\,${mhFormatDiffVar(args[1])}`;
        }
      }

      if (name === "oint") {
        if (args.length >= 3) {
          return `\\oint_{${mhMathPreviewToLatex(args[0])}} ${mhMathPreviewToLatex(args[1])}\\,${mhFormatDiffVar(args[2])}`;
        }
        if (args.length >= 2) {
          return `\\oint ${mhMathPreviewToLatex(args[0])}\\,${mhFormatDiffVar(args[1])}`;
        }
      }

      if ((name === "diff" || name === "dd") && args.length >= 2) {
        const expr = mhMathPreviewToLatex(args[0]);
        const v = mhMathPreviewToLatex(args[1]);
        const order = Math.max(1, Number(args[2] || 1));

        if (order === 1) {
          return `\\frac{d}{d${v}}${mhWrapParen(expr)}`;
        }

        return `\\frac{d^{${order}}}{d${v}^{${order}}}${mhWrapParen(expr)}`;
      }

      if ((name === "pdiff" || name === "partial") && args.length >= 2) {
        const expr = mhMathPreviewToLatex(args[0]);
        const v = mhMathPreviewToLatex(args[1]);
        const order = Math.max(1, Number(args[2] || 1));

        if (order === 1) {
          return `\\frac{\\partial}{\\partial ${v}}${mhWrapParen(expr)}`;
        }

        return `\\frac{\\partial^{${order}}}{\\partial ${v}^{${order}}}${mhWrapParen(expr)}`;
      }

      if (name === "eval" && args.length >= 3) {
        return `\\left[${mhMathPreviewToLatex(args[0])}\\right]_{${mhMathPreviewToLatex(args[1])}}^{${mhMathPreviewToLatex(args[2])}}`;
      }

      if (name === "binom" && args.length >= 2) {
        return `\\binom{${mhMathPreviewToLatex(args[0])}}{${mhMathPreviewToLatex(args[1])}}`;
      }

      if (name === "vec" && args.length >= 1) {
        return `\\vec{${mhMathPreviewToLatex(args[0])}}`;
      }

      if (name === "hat" && args.length >= 1) {
        return `\\hat{${mhMathPreviewToLatex(args[0])}}`;
      }

      if (name === "bar" && args.length >= 1) {
        return `\\overline{${mhMathPreviewToLatex(args[0])}}`;
      }
    }

    if (mhIsWrappedBy(s, "(", ")")) {
      return mhWrapParen(mhMathPreviewToLatex(s.slice(1, -1)));
    }

    if (mhIsWrappedBy(s, "[", "]")) {
      return mhWrapBracket(mhMathPreviewToLatex(s.slice(1, -1)));
    }

    const listParts = mhSplitTopLevel(s);
    if (listParts.length > 1) {
      return listParts.map(mhMathPreviewToLatex).join(", ");
    }

    return mhApplySimpleSymbolLatex(s);
  }

  function mhRenderMathPreview(inputEl, previewEl) {
    if (!inputEl || !previewEl) return;

    const raw = String(inputEl.value || "").trim();

    if (!raw) {
      previewEl.innerHTML = `
        <div class="mh-live-preview-empty">
          ${LANG === "ro" ? "Preview live..." : "Live preview..."}
        </div>
      `;
      return;
    }

    const latex = mhMathPreviewToLatex(raw);

    previewEl.innerHTML = `
      <div class="mh-live-preview-render">\\(${latex}\\)</div>
      <div class="mh-live-preview-raw">${esc(raw)}</div>
      <div class="mh-live-preview-help">
        ${LANG === "ro"
          ? "Exemple: diff(x^3,x,2), int(0,1,x^2,dx), sum(k=1,n,k^2), log(2,x), root(3,x)"
          : "Examples: diff(x^3,x,2), int(0,1,x^2,dx), sum(k=1,n,k^2), log(2,x), root(3,x)"}
      </div>
    `;

    if (typeof MH_render === "function") {
      MH_render(previewEl);
    }
  }

  function mhAttachMathToolbar(inputEl, hostEl) {
    if (!inputEl || !hostEl) return;

    hostEl.innerHTML = `
      <div class="mh-math-toolbar-groups">
        ${MH_MATH_INPUT_GROUPS.map(group => `
          <details class="mh-math-toolbar-group">
            <summary>${group.title}</summary>
            <div class="mh-math-toolbar-row">
              ${group.buttons.map(btn => `
                <button
                  type="button"
                  class="mh-math-toolbtn"
                  data-insert="${esc(btn.insert)}"
                  title="${esc(btn.hint || btn.insert)}"
                >
                  ${btn.label}
                </button>
              `).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    `;

    hostEl.querySelectorAll(".mh-math-toolbtn").forEach(btn => {
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", () => {
        mhInsertAtCursor(inputEl, btn.dataset.insert || "");
      });
    });
  }

  function mhBindMathInputEnhancements(inputEl, previewEl) {
    if (!inputEl || !previewEl) return;

    const sync = () => mhRenderMathPreview(inputEl, previewEl);
    inputEl.addEventListener("input", sync);
    sync();
  }

  globalThis.mhMathPreviewToLatex = mhMathPreviewToLatex;
  globalThis.mhRenderMathPreview = mhRenderMathPreview;
  globalThis.mhBindMathInputEnhancements = mhBindMathInputEnhancements;
  globalThis.mhAttachMathToolbar = mhAttachMathToolbar;

  let heroTimer = null;

  function updateHeroText(){
    const ro = (LANG === "ro");

    const mini = document.getElementById("heroMiniLabel");
    const title = document.getElementById("heroTitle");
    const para = document.getElementById("heroParagraph");
    const hi = document.getElementById("heroHighlightLabel");
    const t1 = document.getElementById("heroTag1");
    const t2 = document.getElementById("heroTag2");
    const t3 = document.getElementById("heroTag3");
    const t4 = document.getElementById("heroTag4");

    if (!mini || !title || !para) return;

    if (ro){
      mini.textContent = "MathHard • antrenament serios, ton prietenos";
      title.innerHTML = 'Construiește-ți <span class="mh-tip" data-tip="XP = experiență, nu note 😊">XP-ul</span> de matematică, lecție cu lecție.';
      para.innerHTML = 'De la clasele mici până la olimpiadă, examene și cercetare: un singur loc în care <b>înveți teoria</b>, <b>rezolvi probleme</b> și <b>vezi matematica „în viață”</b>.';

      if (hi) hi.textContent = "🎯 Azi exersezi:";
      if (t1) t1.textContent = "📘 Lecții structurate";
      if (t2) t2.textContent = "🧩 Probleme de școală & olimpiadă";
      if (t3) t3.textContent = "🔬 Cercetare explicată simplu";
      if (t4) t4.textContent = "🕰 Povești din istoria matematicii";
    } else {
      mini.textContent = "MathHard • serious training, friendly tone";
      title.innerHTML = 'Level up your <span class="mh-tip" data-tip="XP = experience points, not grades 😊">math XP</span>, lesson by lesson.';
      para.innerHTML = 'From middle school to olympiads, exams and research: one place where you <b>learn the theory</b>, <b>solve problems</b> and <b>see math in action</b>.';

      if (hi) hi.textContent = "🎯 Today you practice:";
      if (t1) t1.textContent = "📘 Structured lessons";
      if (t2) t2.textContent = "🧩 School & olympiad problems";
      if (t3) t3.textContent = "🔬 Research made friendly";
      if (t4) t4.textContent = "🕰 Stories from math history";
    }

    MH_render(document.getElementById("hero"));
    startHeroCycle();
  }

  function startHeroCycle(){
  const dyn = document.getElementById("heroDynamic");
  if (!dyn) return;
  if (heroTimer) clearInterval(heroTimer);

  const arr = (LANG === "ro" ? HERO_VARIANTS_RO : HERO_VARIANTS_EN);
  let idx = 0;
  dyn.textContent = arr[0];

  heroTimer = setInterval(() => {
    idx = (idx + 1) % arr.length;
    dyn.classList.add("fade-out");
    setTimeout(() => {
      dyn.textContent = arr[idx];
      dyn.classList.remove("fade-out");
    }, 250);
  }, 3000);
  }

    function updateHubText(){
    const ro = (LANG === "ro");
    const label = document.getElementById("hubLabel");
    const title = document.getElementById("hubTitle");
    const text  = document.getElementById("hubText");

    const lessonTitle = document.getElementById("hubLessonTitle");
    const lessonSub   = document.getElementById("hubLessonSub");
    const drillTitle  = document.getElementById("hubDrillTitle");
    const drillSub    = document.getElementById("hubDrillSub");
    const examTitle   = document.getElementById("hubExamTitle");
    const examSub     = document.getElementById("hubExamSub");
    const progLabel   = document.getElementById("hubProgressLabel");

    if (!label || !title || !text) return;

    if (ro){
      label.textContent = "🔥 Antrenamentul de azi";
      title.textContent = "15–20 de minute în care chiar simți progres.";
      text.innerHTML = "Alege cum vrei să începi: continuă lecția începută, rezolvă un set mic de probleme sau intră direct într-un mini-examen.";

      if (lessonTitle) lessonTitle.textContent = "▶️ Continuă lecțiile";
      if (lessonSub)   lessonSub.textContent   = "te duce la tab-ul de lecții";

      if (drillTitle)  drillTitle.textContent  = "⚡ 5 probleme rapide";
      if (drillSub)    drillSub.textContent    = "antrenament direct pe probleme";

      if (examTitle)   examTitle.textContent   = "🏆 Mini-examen";
      if (examSub)     examSub.textContent     = "intră în seturile de examene";

      if (progLabel)   progLabel.textContent   = "🎯 Ținta de acum: 1 lecție + 5 probleme (poți să-ți schimbi ținta tu)";
    } else {
      label.textContent = "🔥 Today’s training";
      title.textContent = "15–20 minutes where you actually feel progress.";
      text.innerHTML = "Choose how to start: continue a lesson, do a short problem drill or jump into a mini-exam.";

      if (lessonTitle) lessonTitle.textContent = "▶️ Continue lessons";
      if (lessonSub)   lessonSub.textContent   = "takes you to the Lessons tab";

      if (drillTitle)  drillTitle.textContent  = "⚡ 5 quick problems";
      if (drillSub)    drillSub.textContent    = "direct training on problems";

      if (examTitle)   examTitle.textContent   = "🏆 Mini-exam";
      if (examSub)     examSub.textContent     = "jump into the exam sets";

      if (progLabel)   progLabel.textContent   = "🎯 Goal: 1 lesson + 5 problems (you can later customize this)";
    }
  }

  function mhSetRoadmapCard(selector, pill, title, text, cta){
    const card = document.querySelector(selector);
    if (!card) return;

    const pillEl = card.querySelector(".mh-roadmap-pill");
    const titleEl = card.querySelector("h3");
    const textEl = card.querySelector("p");
    const ctaEl = card.querySelector(".mh-roadmap-cta");

    if (pillEl) pillEl.textContent = pill;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (ctaEl) ctaEl.textContent = cta;
  }

  function mhSetRadarCard(tag, label, desc){
    const card = document.querySelector(`.mh-radar-item[data-mh-tag="${tag}"]`);
    if (!card) return;

    const labelEl = card.querySelector(".mh-radar-label");
    const descEl = card.querySelector("p");

    if (labelEl) labelEl.textContent = label;
    if (descEl) descEl.textContent = desc;
  }

  function mhApplyRoadmapBossRadarTexts(){
    const ro = (LANG === "ro");

    // ===== ROADMAP =====
    const roadmapTitle = document.querySelector("#mhRoadmap .mh-section-head h2");
    const roadmapText = document.querySelector("#mhRoadmap .mh-section-head p");
    const roadmapReset = document.querySelector(".mh-roadmap-reset");

    if (roadmapTitle) {
      roadmapTitle.textContent = ro
        ? "🗺️ Parcursul tău la matematică"
        : "🗺️ Your math journey";
    }

    if (roadmapText) {
      roadmapText.textContent = ro
        ? "Alegi etapa care te interesează și îți filtrez automat conținutul."
        : "Choose the stage you care about and I automatically filter the content for you.";
    }

    if (roadmapReset) {
      roadmapReset.textContent = ro
        ? "♻️ Reset filtre"
        : "♻️ Reset filters";
    }

    mhSetRoadmapCard(
      '.mh-roadmap-card[data-mh-tag="V"]',
      ro ? "Fundamente" : "Foundations",
      ro ? "Clasele V–VIII" : "Grades 5–8",
      ro
        ? "Bază solidă: numere, fracții, ecuații simple, geometrie de bază."
        : "Strong foundation: numbers, fractions, simple equations, basic geometry.",
      ro ? "📘 Vezi lecții de gimnaziu" : "📘 View middle school lessons"
    );

    mhSetRoadmapCard(
      '.mh-roadmap-card[data-mh-tag="EN"]',
      ro ? "Examene" : "Exams",
      ro ? "Evaluare Națională" : "National Evaluation",
      ro
        ? "Seturi EN organizate, bune de simulare rapidă."
        : "Structured EN sets, great for quick simulation practice.",
      ro ? "📑 Intră pe EN" : "📑 Open EN"
    );

    mhSetRoadmapCard(
      '.mh-roadmap-card[data-mh-tag="BAC"]',
      ro ? "Examene" : "Exams",
      ro ? "Bacalaureat" : "Baccalaureate",
      ro
        ? "Recapitulare pentru BAC: algebră, analiză, probleme tipice."
        : "BAC review: algebra, calculus, and typical exam-style problems.",
      ro ? "🏆 Intră pe BAC" : "🏆 Open BAC"
    );

    mhSetRoadmapCard(
      '.mh-roadmap-card[data-mh-chip="olymp"]',
      ro ? "Olimpiadă" : "Olympiad",
      ro ? "Probleme de concurs" : "Contest problems",
      ro
        ? "Combinatorică, numere, geometrie mai „hard”."
        : "Combinatorics, number theory, and harder geometry.",
      ro ? "🏅 Probleme de olimpiadă" : "🏅 Olympiad problems"
    );

    mhSetRoadmapCard(
      '.mh-roadmap-card[data-mh-chip="research"]',
      ro ? "Level secret" : "Secret level",
      ro ? "Cercetare & facultate" : "Research & university",
      ro
        ? "Collatz, serii de puteri, topologie, analiză funcțională."
        : "Collatz, power series, topology, functional analysis.",
      ro ? "🔬 Lecții de research" : "🔬 Research lessons"
    );

    // ===== BOSS =====
    const bossTitle = document.querySelector("#mhBoss .mh-boss-text h2");
    const bossText = document.querySelector("#mhBoss .mh-boss-text p");
    const bossMeta = document.querySelectorAll("#mhBoss .mh-boss-meta span");
    const bossBtnProblems = document.getElementById("mhBossProblemsBtn");
    const bossBtnExams = document.getElementById("mhBossExamsBtn");
    const bossChips = document.querySelectorAll("#mhBoss .mh-boss-chip");

    if (bossTitle) {
      bossTitle.textContent = ro
        ? "🧠 Daily Boss Fight"
        : "🧠 Daily Boss Fight";
    }

    if (bossText) {
      bossText.textContent = ro
        ? "Un mini-antrenament cu probleme mixte. Bun de făcut când nu știi de unde să începi."
        : "A mini training session with mixed problems. Great when you do not know where to start.";
    }

    if (bossMeta[0]) {
      bossMeta[0].textContent = ro ? "⏱ ~10–15 minute" : "⏱ ~10–15 minutes";
    }

    if (bossMeta[1]) {
      bossMeta[1].textContent = ro
        ? "⚡ XP bonus moral (nu se calculează încă, doar te motivează 🙂)"
        : "⚡ Moral bonus XP (not counted yet, just for motivation 🙂)";
    }

    if (bossBtnProblems) {
      bossBtnProblems.textContent = ro
        ? "🎯 Începe cu probleme mixte"
        : "🎯 Start with mixed problems";
    }

    if (bossBtnExams) {
      bossBtnExams.textContent = ro
        ? "📑 Deschide seturile de examene"
        : "📑 Open exam sets";
    }

    if (bossChips[0]) bossChips[0].textContent = ro ? "Algebră" : "Algebra";
    if (bossChips[1]) bossChips[1].textContent = ro ? "Geometrie" : "Geometry";
    if (bossChips[2]) bossChips[2].textContent = ro ? "Fracții" : "Fractions";
    if (bossChips[3]) bossChips[3].textContent = ro ? "Divizibilitate" : "Divisibility";

    // ===== RADAR =====
    const radarTitle = document.querySelector("#mhRadar .mh-section-head h2");
    const radarText = document.querySelector("#mhRadar .mh-section-head p");

    if (radarTitle) {
      radarTitle.textContent = ro
        ? "📊 „Radarul” tău de matematică"
        : "📊 Your math radar";
    }

    if (radarText) {
      radarText.textContent = ro
        ? "Vezi rapid în ce zone ai chef să mai lucrezi azi."
        : "Quickly see which areas you feel like working on today.";
    }

    mhSetRadarCard(
      "algebra",
      ro ? "Aritmetică & algebră" : "Arithmetic & algebra",
      ro
        ? "Ecuații, fracții, divizibilitate, sume tip Gauss."
        : "Equations, fractions, divisibility, Gauss-type sums."
    );

    mhSetRadarCard(
      "geometrie",
      ro ? "Geometrie" : "Geometry",
      ro
        ? "Triunghiuri, unghiuri, perimetre, arii, diagrame."
        : "Triangles, angles, perimeters, areas, diagrams."
    );

    mhSetRadarCard(
      "olymp",
      ro ? "Olimpiadă" : "Olympiad",
      ro
        ? "Probleme mai creative, de antrenament serios."
        : "More creative problems for serious training."
    );

    mhSetRadarCard(
      "research",
      ro ? "Cercetare / facultate" : "Research / university",
      ro
        ? "Teorie a numerelor, seriile, topologie, analiză funcțională."
        : "Number theory, series, topology, functional analysis."
    );
  }

  function updateHubNumbers(){
    const lessonsSpan = document.getElementById("hubMiniStatLessons");
    const problemsSpan = document.getElementById("hubMiniStatProblems");
    const progressInner = document.getElementById("hubProgressInner");

    if (!lessonsSpan || !problemsSpan || !progressInner) return;

    const dayState = mhGetTodayProgressState();
    const learnedToday = Number(dayState.learnedToday || 0);
    const solvedToday = Number(dayState.solvedToday || 0);

    if (LANG === "ro"){
      lessonsSpan.textContent  = `📘 ${learnedToday} lecții azi`;
      problemsSpan.textContent = `🧩 ${solvedToday} probleme azi`;
    } else {
      lessonsSpan.textContent  = `📘 ${learnedToday} lessons today`;
      problemsSpan.textContent = `🧩 ${solvedToday} problems today`;
    }

    const stepsDone = Math.min(1, learnedToday) + Math.min(5, solvedToday);
    const pct = (stepsDone / 6) * 100;
    progressInner.style.width = pct + "%";

    const progLabel = document.getElementById("hubProgressLabel");
    if (progLabel){
      if (stepsDone >= 6){
        progLabel.textContent = LANG === "ro"
          ? "🎯 Ținta de azi este completă ✅"
          : "🎯 Today’s goal is complete ✅";
      } else {
        const leftLessons = Math.max(0, 1 - learnedToday);
        const leftProblems = Math.max(0, 5 - solvedToday);
        progLabel.textContent = LANG === "ro"
          ? `🎯 Ținta de azi: ${leftLessons} lecție + ${leftProblems} probleme rămase`
          : `🎯 Today’s goal: ${leftLessons} lesson + ${leftProblems} problems left`;
      }
    }

    const bossStreakEl = document.getElementById("mhBossStreak");
    if (bossStreakEl){
      bossStreakEl.textContent = LANG === "ro"
        ? `${stepsDone}/6 pași azi`
        : `${stepsDone}/6 steps today`;
    }
  }

  function initHubButtons(){
    const lessonBtn = document.getElementById("hubLessonBtn");
    const drillBtn  = document.getElementById("hubDrillBtn");
    const examBtn   = document.getElementById("hubExamBtn");

    if (lessonBtn){
      lessonBtn.onclick = () => mhApplyHomePreset("continue-lessons");
    }

    if (drillBtn){
      drillBtn.onclick = () => mhApplyHomePreset("quick-problems");
    }

    if (examBtn){
      examBtn.onclick = () => mhApplyHomePreset("mini-exam");
    }
  }

  function initMobileAside(){
    const aside = document.getElementById("siteAside");
    const openBtn = document.getElementById("mobileFiltersBtn");
    const closeBtn = document.getElementById("mobileAsideClose");
    const backdrop = document.getElementById("mobileAsideBackdrop");

    if (!aside || !openBtn || !closeBtn || !backdrop) return;

    const openAside = () => {
      aside.classList.add("open");
      backdrop.classList.add("open");
      document.body.classList.add("mobile-aside-open");
    };

    const closeAside = () => {
      aside.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.classList.remove("mobile-aside-open");
    };

    openBtn.addEventListener("click", openAside);
    closeBtn.addEventListener("click", closeAside);
    backdrop.addEventListener("click", closeAside);

    aside.addEventListener("click", (e) => {
      if (window.innerWidth > 980) return;
      const clickable = e.target.closest(".leaf, .chipbtn");
      if (clickable) closeAside();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeAside();
      }
    });
  }

  /* LANG + THEME */
  let LANG = localStorage.getItem("mh_lang") || "ro";
  let THEME = localStorage.getItem("mh_theme") || "dark";
  let MH_PROGRESS_READY = false;
  if(THEME==="light") document.body.classList.add("light");
  document.documentElement.lang = LANG;
  document.body.classList.add("mh-app");

  const qInput = document.getElementById("q");

  const MH_UI_TEXT = {
    ro: {
      header_logo_slogan: "Învață. Exersează. Reușește.",
      header_search_placeholder: "Caută…",
      header_btn_info: "ℹ️ Dificultăți & Contoare",
      header_btn_about: "👤 About me",
      header_btn_focus_off: "🎯 Focus",
      header_btn_focus_on: "🎯 Focus ON",
      header_btn_theme_dark: "🌙 Dark",
      header_btn_theme_light: "☀️ Light",
      header_btn_profile: "📊 Profilul tău",
      header_btn_admin: "🛠 Admin",

      header_counter_solved_title: "Probleme rezolvate / Problems solved",
      header_counter_learned_title: "Lecții învățate / Lessons learned",
      header_counter_exams_title: "Examene promovate / Exams passed",
      header_counter_xp_title: "XP total (doar probleme normale)",

      tip_text: "💡 Pentru a bifa o lecție: derulează până jos <b>și</b> așteaptă să se termine timerul de 1 minut.",

      progress_card_solved_title: "✅ Probleme rezolvate",
      progress_card_solved_sub: "Apasă pentru listă",
      progress_card_learned_title: "📘 Lecții învățate",
      progress_card_learned_sub: "Apasă pentru listă",
      progress_card_passed_title: "🏆 Examene promovate",
      progress_card_passed_sub: "Apasă pentru listă",
    },

    en: {
      header_logo_slogan: "Learn. Practice. Succeed.",
      header_search_placeholder: "Search…",
      header_btn_info: "ℹ️ Difficulty & Counters",
      header_btn_about: "👤 About me",
      header_btn_focus_off: "🎯 Focus",
      header_btn_focus_on: "🎯 Focus ON",
      header_btn_theme_dark: "🌙 Dark",
      header_btn_theme_light: "☀️ Light",
      header_btn_profile: "📊 Your profile",
      header_btn_admin: "🛠 Admin",

      header_counter_solved_title: "Problems solved",
      header_counter_learned_title: "Lessons learned",
      header_counter_exams_title: "Exams passed",
      header_counter_xp_title: "Total XP (regular problems only)",

      tip_text: "💡 To mark a lesson as learned: scroll to the bottom <b>and</b> wait for the 1-minute timer.",

      progress_card_solved_title: "✅ Problems solved",
      progress_card_solved_sub: "Tap to open list",
      progress_card_learned_title: "📘 Lessons learned",
      progress_card_learned_sub: "Tap to open list",
      progress_card_passed_title: "🏆 Exams passed",
      progress_card_passed_sub: "Tap to open list",
    }
  };

  // pornește textul din HERO (PRIMUL LOAD)

  applyMainStaticTexts();
  updateHeroText();
  updateHubText();
  mhApplyRoadmapBossRadarTexts();
  updateHubNumbers();
  initHubButtons();

  let TAB = "lessons", page = 1, pageSize = 9;
  let filter = {
    chip: null,
    q: "",
    minDiff: 0,
    maxDiff: 5,
    byLessonId: null,
    tag: null,
    problemSort: "easy-asc",
    olympOnly: false,
    olympLevel: "",
    gradeSet: null,      
    examType: "",       
    topicPreset: "",     
    unsolvedOnly: false,
    limitOverride: null
  };

  function mhSyncFilterInputs() {
    const qEl = document.getElementById("q");
    const minEl = document.getElementById("minDiff");
    const maxEl = document.getElementById("maxDiff");
    const sortEl = document.getElementById("problemSort");
    const olympBadge = document.getElementById("olympOnlyState");
    const olympLevelEl = document.getElementById("olympLevel");

    if (qEl) qEl.value = filter.q || "";
    if (minEl) minEl.value = filter.minDiff;
    if (maxEl) maxEl.value = filter.maxDiff;
    if (sortEl) sortEl.value = filter.problemSort || "easy-asc";
    if (olympBadge) olympBadge.textContent = filter.olympOnly ? "ON" : "OFF";
    if (olympLevelEl) olympLevelEl.value = filter.olympLevel || "";
  }

  function mhResetContentFilters({ keepDifficulty = false } = {}) {
    filter.byLessonId = null;
    filter.chip = null;
    filter.tag = null;
    filter.q = "";
    filter.gradeSet = null;
    filter.examType = "";
    filter.topicPreset = "";
    filter.unsolvedOnly = false;
    filter.olympOnly = false;
    filter.olympLevel = "";
    filter.limitOverride = null;

    if (!keepDifficulty) {
      filter.minDiff = 0;
      filter.maxDiff = 5;
    }

    mhSyncFilterInputs();
  }

  function mhTextBlob(...parts) {
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function mhMatchesTopicBlob(blob, preset) {
    if (!preset) return true;

    switch (preset) {
      case "algebra":
        return /(algebr|aritmetic|frac|ecua|inecua|divizibil|gauss|raport|propor|numere|sum)/i.test(blob);

      case "geometrie":
        return /(geometr|triunghi|unghi|cerc|arie|perimet|segment|dreptunghi|patrat|diag|poligon|teorem)/i.test(blob);

      case "olymp":
        return /(olimpiad|olymp|onm|imo|jbmo|bmo|concurs|shortlist)/i.test(blob);

      case "research":
        return /(cercetare|research|collatz|serii|topolog|funcțional|functional|facult)/i.test(blob);

      default:
        return true;
    }
  }

  function mhMatchesLessonTopic(L, preset) {
    const blob = mhTextBlob(
      L?.title_ro, L?.title_en, L?.learn_ro, L?.why_ro, L?.body_ro, L?.body_en,
      L?.grade, L?.chapter, ...(L?.tags || [])
    );
    return mhMatchesTopicBlob(blob, preset);
  }

  function mhMatchesProblemTopic(P, preset) {
    const L = DATA.lessons.find(x => x.id === P.lessonId) || {};
    const blob = mhTextBlob(
      P?.title_ro, P?.title_en, P?.statement_ro, P?.statement_en, P?.source,
      L?.title_ro, L?.title_en, L?.chapter, L?.grade, ...(L?.tags || [])
    );
    return mhMatchesTopicBlob(blob, preset);
  }

  function passExam(E) {
    const fakeSearchItem = {
      title_ro: E.title_ro || "",
      title_en: E.title_en || "",
      tags: [E.type || "", String(E.year || "")]
    };

    if (!searchMatch(fakeSearchItem)) return false;

    if (filter.examType && String(E.type || "").toUpperCase() !== String(filter.examType).toUpperCase()) {
      return false;
    }

    return true;
  }

  function mhSortLessons(list) {
    return list.slice().sort((A, B) => {
      const gA = DATA.grades.indexOf(A.grade);
      const gB = DATA.grades.indexOf(B.grade);
      if (gA !== gB) return gA - gB;

      const cc = chapterCompare(A.grade, A.chapter || "", B.chapter || "");
      if (cc !== 0) return cc;

      const tA = (A.title_ro || A.title_en || "");
      const tB = (B.title_ro || B.title_en || "");
      return tA.localeCompare(tB, "ro");
    });
  }

  function getNextLessonCandidate() {
    const pool = DATA.lessons.filter(L =>
      L.chapter !== "CERCETARE" &&
      L.chapter !== "Istoria matematicii" &&
      !learnedSet.has(L.id)
    );

    return mhSortLessons(pool)[0] || null;
  }

  function getNextExamCandidate() {
    return EXAMS.find(ex => !examsPassedSet.has(ex.id)) || EXAMS[0] || null;
  }

  function mhHubDayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function mhGetTodayProgressState() {
    const key = "mh_today_training_v2";
    const today = mhHubDayKey();

    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && saved.day === today) {
        return {
          day: saved.day,
          learnedToday: Number(saved.learnedToday || 0),
          solvedToday: Number(saved.solvedToday || 0)
        };
      }
    } catch (e) {}

    const fresh = {
      day: today,
      learnedToday: 0,
      solvedToday: 0
    };

    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }

  function mhSaveTodayProgressState(state) {
    localStorage.setItem("mh_today_training_v2", JSON.stringify(state));
  }

  function mhIncrementTodayProgress(kind) {
    const state = mhGetTodayProgressState();

    if (kind === "lesson") {
      state.learnedToday = Number(state.learnedToday || 0) + 1;
    }

    if (kind === "problem") {
      state.solvedToday = Number(state.solvedToday || 0) + 1;
    }

    mhSaveTodayProgressState(state);
  }

  function mhApplyHomePreset(preset) {
    page = 1;

    if (preset === "continue-lessons") {
      mhResetContentFilters();
      selectTab("lessons");
      const nextLesson = getNextLessonCandidate();
      if (nextLesson) openViewer(nextLesson);
      else if (typeof mhScrollToMain === "function") mhScrollToMain();
      return;
    }

    if (preset === "mini-exam") {
      mhResetContentFilters();
      selectTab("exams");
      const nextExam = getNextExamCandidate();
      if (nextExam) openExam(nextExam);
      else if (typeof mhScrollToMain === "function") mhScrollToMain();
      return;
    }

    mhResetContentFilters();

    switch (preset) {
      case "quick-problems":
        filter.unsolvedOnly = true;
        filter.limitOverride = 5;
        filter.problemSort = "easy-asc";
        filter.minDiff = 1;
        filter.maxDiff = 3;
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "boss-mixed":
        filter.unsolvedOnly = true;
        filter.problemSort = "easy-asc";
        filter.minDiff = 1;
        filter.maxDiff = 4;
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "roadmap-v-viii":
        filter.gradeSet = ["V", "VI", "VII", "VIII"];
        mhSyncFilterInputs();
        selectTab("lessons");
        break;

      case "roadmap-en":
        filter.examType = "EN";
        mhSyncFilterInputs();
        selectTab("exams");
        break;

      case "roadmap-bac":
        filter.examType = "BAC";
        mhSyncFilterInputs();
        selectTab("exams");
        break;

      case "roadmap-olymp":
        filter.olympOnly = true;
        filter.topicPreset = "olymp";
        filter.problemSort = "easy-desc";
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "roadmap-research":
        mhSyncFilterInputs();
        selectTab("research");
        break;

      case "radar-algebra":
        filter.topicPreset = "algebra";
        filter.unsolvedOnly = true;
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "radar-geometrie":
        filter.topicPreset = "geometrie";
        filter.unsolvedOnly = true;
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "radar-olymp":
        filter.topicPreset = "olymp";
        filter.olympOnly = true;
        mhSyncFilterInputs();
        selectTab("problems");
        break;

      case "radar-research":
        mhSyncFilterInputs();
        selectTab("research");
        break;

      case "open-exams":
        mhSyncFilterInputs();
        selectTab("exams");
        break;

      case "open-history":
        mhSyncFilterInputs();
        selectTab("history");
        break;

      case "open-faculty":
        filter.gradeSet = ["FAC"];
        mhSyncFilterInputs();
        selectTab("lessons");
        break;

      case "open-admit":
        filter.examType = "ADM";
        mhSyncFilterInputs();
        selectTab("exams");
        break;

      case "open-olymp-lessons":
        filter.gradeSet = ["OL-V","OL-VI","OL-VII","OL-VIII","OL-IX","OL-X","OL-XI","OL-XII"];
        mhSyncFilterInputs();
        selectTab("lessons");
        break;

      default:
        mhSyncFilterInputs();
        selectTab("lessons");
        break;
    }

    if (typeof mhScrollToMain === "function") mhScrollToMain();
  }

  let scrollHandler=null;

  /* lesson timer state */
  let lessonTimer=null, lessonSecondsLeft=0, lessonScrolled=false;
  let bottomObserver=null;

  /* ===== FOCUS MODE ===== */

  let FOCUS = localStorage.getItem("mh_focus") === "1";

  function applyFocusMode() {
    const body = document.body;
    const btn  = document.getElementById("focusBtn");
    const ui = MH_UI_TEXT[LANG] || MH_UI_TEXT.ro;

    if (FOCUS) {
      body.classList.add("focus-mode");

     
      TAB = "problems";
      selectTab();

    
      filter.byLessonId = null;
      filter.chip = null;
      filter.q = "";
      filter.tag = null;

      renderCards();
      drawFilterBar();
    } else {
      body.classList.remove("focus-mode");
    }

    if (btn) {
      btn.textContent = FOCUS
        ? ui.header_btn_focus_on
        : ui.header_btn_focus_off;

      if (LANG === "ro") {
        btn.title = FOCUS
          ? "Mod de antrenament: mai puține distrageri, accent pe probleme."
          : "Pornește modul de focus (ascunde decorațiuni & sidebar).";
      } else {
        btn.title = FOCUS
          ? "Training mode: fewer distractions, focus on problems."
          : "Turn on focus mode (hide decorations & sidebar).";
      }
    }
  }

  
  applyFocusMode();

  const focusBtn = document.getElementById("focusBtn");
  if (focusBtn){
  focusBtn.onclick = () => {
    FOCUS = !FOCUS;
    localStorage.setItem("mh_focus", FOCUS ? "1" : "0");
    applyFocusMode();
  };
  }

  // theme toggle
  document.getElementById("themeBtn").onclick=()=>{
    const light = document.body.classList.toggle("light");
    THEME = light ? "light" : "dark";
    localStorage.setItem("mh_theme", THEME);
    mhUpdateHeaderStaticTexts();
  };

  // language toggle
  document.getElementById("langBtn").onclick=()=>{
  LANG=(LANG==="ro"?"en":"ro"); 
  localStorage.setItem("mh_lang",LANG);
  document.documentElement.lang = LANG;
  document.getElementById("tipText").innerHTML = (LANG==="ro" ? TIP_RO : TIP_EN);
  qInput.placeholder = (LANG==="ro" ? "Caută…" : "Search…");

  const numHost = document.getElementById(`numlineHost-${WIDGET_ID}`);
  if (numHost && window.MH_NumberLinePy) {
    MH_NumberLinePy.unmount(WIDGET_ID);
    MH_NumberLinePy.mount(WIDGET_ID, numHost);
  }

  
  mhUpdateSidebarStaticTexts();
  mhUpdateToolbarTexts();
  mhUpdateHeaderStaticTexts();
  mhUpdateLessonDrawerButtons();

  applyMainStaticTexts();
  updateHeroText();
  buildNestedTree(); 
  buildTagPanel(); 
  renderCards(); 
  updateHubText();      
  mhApplyRoadmapBossRadarTexts();
  updateHubNumbers();   
  drawFilterBar();
  };

  /** PROBLEME PENTRU VERIFICAREA LECȚIEI **/

  window.DATA_QUIZZES = window.DATA_QUIZZES || {
    "v-citirea-nr-nat": [
      {
        id: "v-citirea-nr-nat_q1",
        kind: "simple",
        prompt_ro: "În numărul 45 327, cifra 5 este pe poziția:",
        prompt_en: "In the number 45 327, digit 5 is on the:",
        options: [
          { text: "unităților", correct: false },
          { text: "zecilor", correct: false },
          { text: "miilor", correct: true },
          { text: "sutelor", correct: false },
          { text: "zecilor de mii", correct: false }
        ],
        explanation_ro: "În 45 327, cifra 5 reprezintă 5 mii.",
        explanation_en: "In 45 327, digit 5 represents 5 thousands."
      },

      {
        id: "v-citirea-nr-nat_q2",
        kind: "simple",
        prompt_ro: "Cum se citește corect numărul 70 005?",
        prompt_en: "How do you correctly read the number 70 005?",
        options: [
          { text: "șaptezeci mii cinci", correct: true },
          { text: "șapte mii cinci", correct: false },
          { text: "șaptezeci de mii cincizeci", correct: false },
          { text: "șaptezeci mii zero zero cinci", correct: false },
          { text: "șaptezeci și cinci", correct: false }
        ],
        explanation_ro: "70 005 înseamnă 70 de mii și 5 unități.",
        explanation_en: "70 005 means 70 thousand and 5 units."
      },

      {
        id: "v-citirea-nr-nat_q3",
        kind: "simple",
        prompt_ro: "În numărul 902 410, cifra 2 este pe ordinul:",
        prompt_en: "In the number 902 410, digit 2 is on the:",
        options: [
          { text: "sutelor", correct: false },
          { text: "miilor", correct: true },
          { text: "zecilor", correct: false },
          { text: "unităților", correct: false },
          { text: "zecilor de mii", correct: false }
        ],
        explanation_ro: "902 410 = 9 sute de mii, 0 zeci de mii, 2 mii, 4 sute, 1 zece, 0 unități.",
        explanation_en: "902 410 = 9 hundred-thousands, 0 ten-thousands, 2 thousands, 4 hundreds, 1 ten, 0 units."
      },

      {
        id: "v-citirea-nr-nat_q4",
        kind: "multi",
        prompt_ro: "Alege toate afirmațiile corecte despre numărul 308 014.",
        prompt_en: "Choose all correct statements about the number 308 014.",
        options: [
          { text: "Are 3 sute de mii.", correct: true },
          { text: "Are 8 mii.", correct: true },
          { text: "Are 1 sută.", correct: false },
          { text: "Are 4 unități.", correct: true },
          { text: "Se citește „trei sute opt mii paisprezece”.", correct: true }
        ],
        explanation_ro: "308 014 = 3 sute de mii, 8 mii, 1 zece și 4 unități.",
        explanation_en: "308 014 = 3 hundred-thousands, 8 thousands, 1 ten and 4 units."
      },

      {
        id: "v-citirea-nr-nat_q5",
        kind: "recap",
        prompt_ro: "Alege toate scrierile corecte pentru numărul 406 090.",
        prompt_en: "Choose all correct forms for the number 406 090.",
        options: [
          { text: "4 sute de mii + 6 mii + 9 zeci", correct: true },
          { text: "400000 + 6000 + 90", correct: true },
          { text: "4 sute de mii + 6 sute + 9 zeci", correct: false },
          { text: "406 mii 90", correct: true },
          { text: "406090 = 4×100000 + 6×1000 + 9×10", correct: true }
        ],
        explanation_ro: "406 090 poate fi citit, descompus și rescris în mai multe forme echivalente.",
        explanation_en: "406 090 can be read, decomposed and rewritten in several equivalent ways."
      }
    ]
  };

  function upsertById(target, incoming, normalizer){
    (incoming || []).forEach(item => {
      const normalized = normalizer(item);
      const idx = target.findIndex(x => x.id === normalized.id);

      if (idx === -1) {
        target.push(normalized);
      } else {
        target[idx] = { ...target[idx], ...normalized };
      }
    });
  }

  async function loadJsonData() {
    try {
      const resp = await fetch("/data/problems.json", {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!resp.ok) throw new Error("problems.json not ok");

      const json = await resp.json();

      return {
        lessons: Array.isArray(json.lessons) ? json.lessons : [],
        problems: Array.isArray(json.problems) ? json.problems : [],
        exams: Array.isArray(json.exams) ? json.exams : []
      };
    } catch (e) {
      console.warn("Nu am putut încărca /data/problems.json:", e);

      return window.SERVER_DATA || {
        lessons: [],
        problems: [],
        exams: []
      };
    }
  }

  async function loadSupabaseData() {
    try {
      const [
        { data: lessons, error: lessonsError },
        { data: problems, error: problemsError },
        { data: exams, error: examsError }
      ] = await Promise.all([
        supabase.from("mh_lessons").select("*"),
        supabase.from("mh_problems").select("*"),
        supabase.from("mh_exams").select("*")
      ]);

      if (lessonsError) throw lessonsError;
      if (problemsError) throw problemsError;
      if (examsError) throw examsError;

      return {
        lessons: lessons || [],
        problems: problems || [],
        exams: exams || []
      };
    } catch (err) {
      console.error("Eroare la încărcarea din Supabase:", err);
      return { lessons: [], problems: [], exams: [] };
    }
  }

  async function reloadAllContentFromSupabase() {
    const jsonData = await loadJsonData();
    const supabaseData = await loadSupabaseData();

    DATA.lessons.length = 0;
    DATA.problems.length = 0;
    DATA.exams.length = 0;

    // 1) baza hardcodată din data.js
    upsertById(DATA.lessons, BASE_DATA.lessons, normalizeLesson);
    upsertById(DATA.problems, BASE_DATA.problems, normalizeProblem);
    upsertById(DATA.exams, BASE_DATA.exams, normalizeExam);

    // 2) problems.json / SERVER_DATA
    upsertById(DATA.lessons, jsonData.lessons, normalizeLesson);
    upsertById(DATA.problems, jsonData.problems, normalizeProblem);
    upsertById(DATA.exams, jsonData.exams, normalizeExam);

    // 3) Supabase peste toate
    upsertById(DATA.lessons, supabaseData.lessons, normalizeLesson);
    upsertById(DATA.problems, supabaseData.problems, normalizeProblem);
    upsertById(DATA.exams, supabaseData.exams, normalizeExam);

    buildNestedTree();
    buildTagPanel();
    renderCards();
    drawFilterBar();
    updateRadarUI();
    wireOlympControls();
    MH_render(document.getElementById("cards"));

    if (typeof mhRenderAdminList === "function") {
      mhRenderAdminList();
    }
  }

  // Îmbinăm în DATA
  (async function mergeCustom() {
  try {
    await reloadAllContentFromSupabase();
    resumeLockedExamIfAny();
  } catch (err) {
    console.error("Eroare la încărcarea din Supabase:", err);
  }
})();

  /* ===== ADMIN PANEL ===== */
  const adminBtn = document.getElementById("adminBtn");
  const adminDrawer = document.getElementById("adminDrawer");
  const closeAdmin = document.getElementById("closeAdmin");
  const mhPublishForm = document.getElementById("mhPublish");
  const mhPublishStatus = document.getElementById("mhPublishStatus");
  const mhSubmitBtn = document.getElementById("mhSubmitBtn");
  const mhAdminModeBadge = document.getElementById("mhAdminModeBadge");
  const mhAdminList = document.getElementById("mhAdminList");
  const mhAdminListInfo = document.getElementById("mhAdminListInfo");
  const mhResetFormBtn = document.getElementById("mhResetForm");
  const mhRefreshListBtn = document.getElementById("mhRefreshList");
  const mhLogoutBtn = document.getElementById("mhLogoutBtn");
  const mhExamScoringProfile = document.getElementById("mh_exam_scoring_profile");
  const mhAddOpenItemBtn = document.getElementById("mhAddOpenItemBtn");
  const mhAddMcqItemBtn = document.getElementById("mhAddMcqItemBtn");
  const mhExamItemsList = document.getElementById("mhExamItemsList");

  let MH_EXAM_ITEMS_DRAFT = [];

  function mhClampOptionCount(value) {
    return Math.max(2, Math.min(8, Number(value) || 4));
  }

  function mhGetOptionLabels(optionMode, optionsCount) {
    if (optionMode === "A-D") return ["A", "B", "C", "D"];
    if (optionMode === "A-E") return ["A", "B", "C", "D", "E"];

    const count = mhClampOptionCount(optionsCount);
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  }

  function mhEnsureDraftMcqShape(item) {
    const mode = item.option_mode || "A-D";
    const labels = mhGetOptionLabels(mode, item.options_count || item.options?.length || 4);
    const oldOptions = Array.isArray(item.options) ? item.options : [];

    const byLabel = new Map(
      oldOptions.map((opt, idx) => [
        String(opt?.label || labels[idx] || "").trim().toUpperCase(),
        opt
      ])
    );

    item.options = labels.map((label, idx) => {
      const old = byLabel.get(label) || oldOptions[idx] || {};
      return {
        id: old.id || `opt_${item.id || "item"}_${idx}`,
        label,
        text_ro: old.text_ro || old.text || "",
        text_en: old.text_en || old.text || "",
        is_correct: !!old.is_correct
      };
    });

    item.options_count = labels.length;
    item.option_mode = mode;

    if (!item.allow_multiple) {
      let foundOne = false;
      item.options.forEach((opt) => {
        if (opt.is_correct && !foundOne) {
          foundOne = true;
        } else if (opt.is_correct && foundOne) {
          opt.is_correct = false;
        }
      });
    }

    return item;
  }

  function mhNormalizeDraftExamItem(item, index) {
    const base = normalizeExamItem(item, index);

    if (base.type === "mcq") {
      return mhEnsureDraftMcqShape(base);
    }

    return {
      ...base,
      type: "open",
      option_mode: base.option_mode || "A-D"
    };
  }

  function mhRenderExamItemsDraft() {
    if (!mhExamItemsList) return;

    MH_EXAM_ITEMS_DRAFT = MH_EXAM_ITEMS_DRAFT.map((item, index) =>
      mhNormalizeDraftExamItem(item, index)
    );

    if (!MH_EXAM_ITEMS_DRAFT.length) {
      mhExamItemsList.innerHTML = `
        <div class="legend" style="padding:10px;border:1px dashed var(--border);border-radius:12px;">
          Niciun item încă. Apasă pe „Item open” sau „Item grilă”.
        </div>
      `;
      return;
    }

    mhExamItemsList.innerHTML = MH_EXAM_ITEMS_DRAFT.map((item, index) => {
      const isMcq = item.type === "mcq";
      const isCustomMode = item.option_mode === "custom";

      return `
        <div
          data-mh-item-card="${index}"
          style="border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:12px;background:rgba(255,255,255,.02);"
        >
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
            <strong>Item ${index + 1} — ${item.type === "mcq" ? "grilă" : "open"}</strong>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn small" type="button" data-mh-move-up="${index}" ${index === 0 ? "disabled" : ""}>⬆️ Sus</button>
              <button class="btn small" type="button" data-mh-move-down="${index}" ${index === MH_EXAM_ITEMS_DRAFT.length - 1 ? "disabled" : ""}>⬇️ Jos</button>
              <button class="btn small" type="button" data-mh-remove-item="${index}">🗑 Șterge</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:10px;">
            <label>
              <div class="legend">ID item</div>
              <input
                type="text"
                value="${esc(item.id || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="id"
              >
            </label>

            <label>
              <div class="legend">Tip</div>
              <select data-mh-item-index="${index}" data-mh-type-select="1">
                <option value="open" ${item.type === "open" ? "selected" : ""}>open</option>
                <option value="mcq" ${item.type === "mcq" ? "selected" : ""}>mcq</option>
              </select>
            </label>

            <label>
              <div class="legend">Puncte</div>
              <input
                type="number"
                min="0"
                step="1"
                value="${Number(item.points || 0)}"
                data-mh-item-index="${index}"
                data-mh-number-key="points"
              >
            </label>

            ${isMcq ? `
              <label>
                <div class="legend">Mod opțiuni</div>
                <select data-mh-item-index="${index}" data-mh-option-mode="1">
                  <option value="A-D" ${item.option_mode === "A-D" ? "selected" : ""}>A-D</option>
                  <option value="A-E" ${item.option_mode === "A-E" ? "selected" : ""}>A-E</option>
                  <option value="custom" ${item.option_mode === "custom" ? "selected" : ""}>custom</option>
                </select>
              </label>

              <label ${isCustomMode ? "" : 'style="opacity:.55;"'}>
                <div class="legend">Nr. opțiuni custom</div>
                <input
                  type="number"
                  min="2"
                  max="8"
                  step="1"
                  value="${Number(item.options_count || 4)}"
                  data-mh-item-index="${index}"
                  data-mh-options-count="1"
                  ${isCustomMode ? "" : "disabled"}
                >
              </label>
            ` : ""}
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;">
            <label>
              <div class="legend">Titlu RO</div>
              <input
                type="text"
                value="${esc(item.title_ro || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="title_ro"
              >
            </label>

            <label>
              <div class="legend">Titlu EN</div>
              <input
                type="text"
                value="${esc(item.title_en || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="title_en"
              >
            </label>
          </div>

          <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:10px;">
            <label>
              <div class="legend">Prompt RO</div>
              <textarea rows="4" data-mh-item-index="${index}" data-mh-textarea-key="prompt_ro">${esc(item.prompt_ro || "")}</textarea>
            </label>

            <label>
              <div class="legend">Prompt EN</div>
              <textarea rows="4" data-mh-item-index="${index}" data-mh-textarea-key="prompt_en">${esc(item.prompt_en || "")}</textarea>
            </label>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px;">
            <label>
              <div class="legend">Image URL</div>
              <input
                type="text"
                value="${esc(item.image_url || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="image_url"
              >
            </label>

            <label>
              <div class="legend">Image alt</div>
              <input
                type="text"
                value="${esc(item.image_alt || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="image_alt"
              >
            </label>

            <label>
              <div class="legend">Caption RO</div>
              <input
                type="text"
                value="${esc(item.image_caption_ro || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="image_caption_ro"
              >
            </label>

            <label>
              <div class="legend">Caption EN</div>
              <input
                type="text"
                value="${esc(item.image_caption_en || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="image_caption_en"
              >
            </label>
          </div>

          ${!isMcq ? `
            <label style="display:block;margin-bottom:6px;">
              <div class="legend">Răspuns corect (open)</div>
              <input
                type="text"
                value="${esc(item.answer || "")}"
                data-mh-item-index="${index}"
                data-mh-text-key="answer"
              >
            </label>
          ` : `
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
              <label style="display:flex;align-items:center;gap:8px;">
                <input
                  type="checkbox"
                  ${item.allow_multiple ? "checked" : ""}
                  data-mh-item-index="${index}"
                  data-mh-bool-key="allow_multiple"
                >
                <span>Permite mai multe corecte</span>
              </label>

              <label style="display:flex;align-items:center;gap:8px;">
                <input
                  type="checkbox"
                  ${item.allow_none ? "checked" : ""}
                  data-mh-item-index="${index}"
                  data-mh-bool-key="allow_none"
                >
                <span>Permite niciuna corectă</span>
              </label>
            </div>

            <div style="display:grid;gap:8px;">
              ${(item.options || []).map((opt, optIndex) => `
                <div style="border:1px solid var(--border);border-radius:10px;padding:10px;">
                  <div style="display:grid;grid-template-columns:90px 1fr 1fr 130px;gap:8px;align-items:end;">
                    <label>
                      <div class="legend">Label</div>
                      <input
                        type="text"
                        value="${esc(opt.label || "")}"
                        disabled
                      >
                    </label>

                    <label>
                      <div class="legend">Text RO</div>
                      <input
                        type="text"
                        value="${esc(opt.text_ro || "")}"
                        data-mh-item-index="${index}"
                        data-mh-option-index="${optIndex}"
                        data-mh-option-text-key="text_ro"
                      >
                    </label>

                    <label>
                      <div class="legend">Text EN</div>
                      <input
                        type="text"
                        value="${esc(opt.text_en || "")}"
                        data-mh-item-index="${index}"
                        data-mh-option-index="${optIndex}"
                        data-mh-option-text-key="text_en"
                      >
                    </label>

                    <label style="display:flex;align-items:center;gap:8px;height:100%;">
                      <input
                        type="checkbox"
                        ${opt.is_correct ? "checked" : ""}
                        data-mh-item-index="${index}"
                        data-mh-option-index="${optIndex}"
                        data-mh-option-correct="1"
                      >
                      <span>Corectă</span>
                    </label>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      `;
    }).join("");

    mhExamItemsList.querySelectorAll("[data-mh-remove-item]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.mhRemoveItem);
        MH_EXAM_ITEMS_DRAFT.splice(idx, 1);
        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-move-up]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.mhMoveUp);
        if (idx <= 0) return;
        [MH_EXAM_ITEMS_DRAFT[idx - 1], MH_EXAM_ITEMS_DRAFT[idx]] = [MH_EXAM_ITEMS_DRAFT[idx], MH_EXAM_ITEMS_DRAFT[idx - 1]];
        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-move-down]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.mhMoveDown);
        if (idx >= MH_EXAM_ITEMS_DRAFT.length - 1) return;
        [MH_EXAM_ITEMS_DRAFT[idx + 1], MH_EXAM_ITEMS_DRAFT[idx]] = [MH_EXAM_ITEMS_DRAFT[idx], MH_EXAM_ITEMS_DRAFT[idx + 1]];
        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-text-key]").forEach(input => {
      input.addEventListener("input", () => {
        const idx = Number(input.dataset.mhItemIndex);
        const key = input.dataset.mhTextKey;
        MH_EXAM_ITEMS_DRAFT[idx][key] = input.value;
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-textarea-key]").forEach(textarea => {
      textarea.addEventListener("input", () => {
        const idx = Number(textarea.dataset.mhItemIndex);
        const key = textarea.dataset.mhTextareaKey;
        MH_EXAM_ITEMS_DRAFT[idx][key] = textarea.value;
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-number-key]").forEach(input => {
      input.addEventListener("input", () => {
        const idx = Number(input.dataset.mhItemIndex);
        const key = input.dataset.mhNumberKey;
        MH_EXAM_ITEMS_DRAFT[idx][key] = Number(input.value || 0);
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-type-select]").forEach(select => {
      select.addEventListener("change", () => {
        const idx = Number(select.dataset.mhItemIndex);
        const item = MH_EXAM_ITEMS_DRAFT[idx];

        item.type = select.value;

        if (item.type === "mcq") {
          item.option_mode = item.option_mode || "A-D";
          item.options_count = item.options_count || 4;
          item.allow_multiple = !!item.allow_multiple;
          item.allow_none = !!item.allow_none;
          mhEnsureDraftMcqShape(item);
        }

        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-option-mode]").forEach(select => {
      select.addEventListener("change", () => {
        const idx = Number(select.dataset.mhItemIndex);
        const item = MH_EXAM_ITEMS_DRAFT[idx];

        item.option_mode = select.value;

        if (item.option_mode === "A-D") item.options_count = 4;
        if (item.option_mode === "A-E") item.options_count = 5;
        if (item.option_mode === "custom") item.options_count = mhClampOptionCount(item.options_count || item.options?.length || 4);

        mhEnsureDraftMcqShape(item);
        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-options-count]").forEach(input => {
      input.addEventListener("input", () => {
        const idx = Number(input.dataset.mhItemIndex);
        const item = MH_EXAM_ITEMS_DRAFT[idx];

        item.option_mode = "custom";
        item.options_count = mhClampOptionCount(input.value);
        mhEnsureDraftMcqShape(item);
        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-bool-key]").forEach(input => {
      input.addEventListener("change", () => {
        const idx = Number(input.dataset.mhItemIndex);
        const key = input.dataset.mhBoolKey;
        const item = MH_EXAM_ITEMS_DRAFT[idx];

        item[key] = !!input.checked;

        if (key === "allow_multiple" && !item.allow_multiple) {
          let keptOne = false;
          (item.options || []).forEach(opt => {
            if (opt.is_correct && !keptOne) {
              keptOne = true;
            } else {
              opt.is_correct = false;
            }
          });
        }

        mhRenderExamItemsDraft();
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-option-text-key]").forEach(input => {
      input.addEventListener("input", () => {
        const itemIdx = Number(input.dataset.mhItemIndex);
        const optIdx = Number(input.dataset.mhOptionIndex);
        const key = input.dataset.mhOptionTextKey;

        MH_EXAM_ITEMS_DRAFT[itemIdx].options[optIdx][key] = input.value;
      });
    });

    mhExamItemsList.querySelectorAll("[data-mh-option-correct]").forEach(input => {
      input.addEventListener("change", () => {
        const itemIdx = Number(input.dataset.mhItemIndex);
        const optIdx = Number(input.dataset.mhOptionIndex);
        const item = MH_EXAM_ITEMS_DRAFT[itemIdx];

        if (!item.allow_multiple && input.checked) {
          item.options.forEach((opt, idx) => {
            opt.is_correct = idx === optIdx;
          });
          mhRenderExamItemsDraft();
          return;
        }

        item.options[optIdx].is_correct = !!input.checked;
      });
    });
  }

  mhAddOpenItemBtn?.addEventListener("click", () => {
    MH_EXAM_ITEMS_DRAFT.push(
      mhNormalizeDraftExamItem({
        id: `open_${Date.now()}`,
        type: "open",
        points: 1,
        title_ro: "",
        title_en: "",
        prompt_ro: "",
        prompt_en: "",
        answer: "",
        image_url: "",
        image_alt: "",
        image_caption_ro: "",
        image_caption_en: ""
      }, MH_EXAM_ITEMS_DRAFT.length)
    );

    mhRenderExamItemsDraft();
  });

  mhAddMcqItemBtn?.addEventListener("click", () => {
    MH_EXAM_ITEMS_DRAFT.push(
      mhNormalizeDraftExamItem({
        id: `mcq_${Date.now()}`,
        type: "mcq",
        points: 1,
        title_ro: "",
        title_en: "",
        prompt_ro: "",
        prompt_en: "",
        option_mode: "A-D",
        options_count: 4,
        allow_multiple: false,
        allow_none: false,
        image_url: "",
        image_alt: "",
        image_caption_ro: "",
        image_caption_en: "",
        options: [
          { label: "A", text_ro: "", text_en: "", is_correct: false },
          { label: "B", text_ro: "", text_en: "", is_correct: false },
          { label: "C", text_ro: "", text_en: "", is_correct: false },
          { label: "D", text_ro: "", text_en: "", is_correct: false }
        ]
      }, MH_EXAM_ITEMS_DRAFT.length)
    );

    mhRenderExamItemsDraft();
  });

  mhRenderExamItemsDraft();

  function mhSetTypeBlocks(type) {
    const blockLesson = document.getElementById("block-lesson");
    const blockProblem = document.getElementById("block-problem");
    const blockExam = document.getElementById("block-exam");

    if (blockLesson) {
      blockLesson.style.display =
        (type === "lesson" || type === "research" || type === "history")
          ? "block"
          : "none";
    }

    if (blockProblem) {
      blockProblem.style.display = type === "problem" ? "block" : "none";
    }

    if (blockExam) {
      blockExam.style.display = type === "exam" ? "block" : "none";
    }
  }

  function mhFillAdminFormFromItem(item) {
    const type = item.content_type || item.type || "lesson";

    const typeSel = document.getElementById("mh_type");
    if (typeSel) typeSel.value = type;

    mhSetTypeBlocks(type);
    mhSetAdminModeEdit(type, item.id);

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? "";
    };

    setVal("mh_id", item.id);
    setVal("mh_grade", item.grade);
    setVal("mh_chapter", item.chapter_ro ?? item.chapter_en ?? item.chapter);
    setVal("mh_tags", Array.isArray(item.tags) ? item.tags.join(", ") : "");

    setVal("mh_title_ro", item.title_ro);
    setVal("mh_title_en", item.title_en);
    setVal("mh_learn_ro", item.learn_ro);
    setVal("mh_why_ro", item.why_ro);
    setVal("mh_body_ro", item.body_ro);
    setVal("mh_body_en", item.body_en);

    setVal("mh_lesson_id", item.lesson_id ?? item.lessonId);
    setVal("mh_difficulty", item.difficulty ?? 1);
    setVal("mh_olymp_level", item.olymp_level ?? item.olympLevel);
    setVal("mh_statement_ro", item.statement_ro);
    setVal("mh_statement_en", item.statement_en);
    setVal("mh_answer", item.answer);
    setVal("mh_hint1_ro", item.hint1_ro);
    setVal("mh_hint2_ro", item.hint2_ro);

    setVal("mh_exam_type", item.exam_type ?? item.type);
    setVal("mh_exam_year", item.exam_year ?? item.year);
    setVal("mh_exam_hours", item.exam_hours ?? item.defaultHours ?? 2);
    setVal("mh_exam_title_ro", item.exam_title_ro ?? item.title_ro);
    setVal("mh_exam_title_en", item.exam_title_en ?? item.title_en);
    setVal(
      "mh_exam_problems",
      Array.isArray(item.exam_problems)
        ? item.exam_problems.join(", ")
        : Array.isArray(item.problems)
          ? item.problems.join(", ")
          : item.exam_problems || ""
    );
    setVal("mh_exam_credit", item.exam_credit ?? item.credit_html);

    const status = document.getElementById("mhPublishStatus");
    if (status) status.textContent = `Editezi: ${item.id}`;

    if (type === "exam") {
      MH_EXAM_ITEMS_DRAFT = Array.isArray(item.items)
      ? item.items.map((examItem, index) => mhNormalizeDraftExamItem(examItem, index))
      : [];

      if (mhExamScoringProfile) {
        mhExamScoringProfile.value = item.scoring_profile || "default_exact_v1";
      }

      mhRenderExamItemsDraft();
    }
  }

  const mhTypeSelect = document.getElementById("mh_type");

  if (mhTypeSelect) {
    mhTypeSelect.addEventListener("change", (e) => {
      mhSetTypeBlocks(e.target.value);
      mhSetAdminModeCreate();
    });

    mhSetTypeBlocks(mhTypeSelect.value);
  }

  const MH_ADMIN_STATE = {
    mode: "create",
    editType: null,
    editId: null
  };

  function mhSetAdminModeCreate() {
    MH_ADMIN_STATE.mode = "create";
    MH_ADMIN_STATE.editType = null;
    MH_ADMIN_STATE.editId = null;

    const badge = document.getElementById("mhAdminModeBadge");
    const submitBtn = document.getElementById("mhSubmitBtn");
    const idInput = document.getElementById("mh_id");
    const status = document.getElementById("mhPublishStatus");

    if (badge) badge.textContent = "Mod curent: creare";
    if (submitBtn) submitBtn.textContent = "💾 Salvează în Supabase";
    if (idInput) idInput.disabled = false;
    if (status) status.textContent = "";
  }

  function mhSetAdminModeEdit(type, id) {
    MH_ADMIN_STATE.mode = "edit";
    MH_ADMIN_STATE.editType = type;
    MH_ADMIN_STATE.editId = id;

    const badge = document.getElementById("mhAdminModeBadge");
    const submitBtn = document.getElementById("mhSubmitBtn");
    const idInput = document.getElementById("mh_id");

    if (badge) badge.textContent = `Mod curent: editare (${type}) • ${id}`;
    if (submitBtn) submitBtn.textContent = "✏️ Update în Supabase";
    if (idInput) idInput.disabled = true;
  }

  function mhClearAdminForm() {
    const form = document.getElementById("mhPublish");
    if (form) form.reset();

    const typeSel = document.getElementById("mh_type");
    if (typeSel) typeSel.value = "lesson";

    mhSetTypeBlocks("lesson");
    mhSetAdminModeCreate();

    const defaultGrade = document.getElementById("mh_grade");
    const defaultChapter = document.getElementById("mh_chapter");
    const defaultDifficulty = document.getElementById("mh_difficulty");
    const defaultExamType = document.getElementById("mh_exam_type");
    const defaultExamYear = document.getElementById("mh_exam_year");
    const defaultExamHours = document.getElementById("mh_exam_hours");
    const defaultExamTitleRo = document.getElementById("mh_exam_title_ro");
    const defaultExamTitleEn = document.getElementById("mh_exam_title_en");

    if (defaultGrade) defaultGrade.value = "V";
    if (defaultChapter) defaultChapter.value = "Numere Naturale";
    if (defaultDifficulty) defaultDifficulty.value = "1";
    if (defaultExamType) defaultExamType.value = "EN";
    if (defaultExamYear) defaultExamYear.value = "2025";
    if (defaultExamHours) defaultExamHours.value = "2";
    if (defaultExamTitleRo) defaultExamTitleRo.value = "Examen nou";
    if (defaultExamTitleEn) defaultExamTitleEn.value = "New exam";

    MH_EXAM_ITEMS_DRAFT = [];
    if (mhExamScoringProfile) {
      mhExamScoringProfile.value = "default_exact_v1";
    }
    mhRenderExamItemsDraft();

  }

  function mhGetAdminItems() {
    const lessons = DATA.lessons.map(item => ({
      ...item,
      content_type:
        item.chapter === "CERCETARE"
          ? "research"
          : item.chapter === "Istoria matematicii"
            ? "history"
            : "lesson"
    }));

    const problems = DATA.problems.map(item => ({
      ...item,
      content_type: "problem"
    }));

    const exams = DATA.exams.map(item => ({
      ...item,
      content_type: "exam"
    }));

    return [...lessons, ...problems, ...exams].sort((a, b) => {
      const ta = (a.title_ro || a.title_en || a.id || "").toLowerCase();
      const tb = (b.title_ro || b.title_en || b.id || "").toLowerCase();
      return ta.localeCompare(tb, "ro");
    });
  }

  function mhRenderAdminList() {
    const host = document.getElementById("mhAdminList");
    const info = document.getElementById("mhAdminListInfo");
    if (!host) return;

    const items = mhGetAdminItems();
    host.innerHTML = "";
    if (info) info.textContent = `${items.length} iteme`;

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const title = item.title_ro || item.title_en || item.id || "(fără titlu)";
      const metaBits = [
        `Tip: ${item.content_type}`,
        item.grade ? `Clasă: ${item.grade}` : null,
        item.chapter ? `Capitol: ${getChapterLabel(item.chapter)}` : null,
        (item.lesson_id || item.lessonId) ? `lessonId: ${item.lesson_id || item.lessonId}` : null,
        item.year ? `An: ${item.year}` : null
      ].filter(Boolean);

      card.innerHTML = `
        <div class="title">${title}</div>
        <div class="legend" style="margin-top:6px;">ID: ${item.id}</div>
        <div class="legend" style="margin-top:6px;">${metaBits.join(" • ")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <button class="btn small" type="button" data-edit-id="${item.id}">✏️ Edit</button>
          <button class="btn small" type="button" data-delete-id="${item.id}" data-delete-type="${item.content_type}">🗑 Delete</button>
        </div>
      `;

      host.appendChild(card);
    });

    host.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = mhGetAdminItems().find(x => x.id === btn.dataset.editId);
        if (!item) return;

        mhFillAdminFormFromItem(item);
        adminDrawer?.querySelector(".viewer")?.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    host.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        const type = btn.dataset.deleteType;

        const ok = confirm(`Sigur vrei să ștergi ${type}: ${id} ?`);
        if (!ok) return;

        try {
          let query;

          if (type === "lesson" || type === "research" || type === "history") {
            query = supabase.from("mh_lessons").delete().eq("id", id);
          } else if (type === "problem") {
            query = supabase.from("mh_problems").delete().eq("id", id);
          } else if (type === "exam") {
            query = supabase.from("mh_exams").delete().eq("id", id);
          } else {
            throw new Error("Tip necunoscut pentru delete.");
          }

          const { error } = await query;
          if (error) throw error;

          await reloadAllContentFromSupabase();
          mhRenderAdminList();

          const status = document.getElementById("mhPublishStatus");
          if (status) status.textContent = `Șters: ${id}`;

          if (MH_ADMIN_STATE.editId === id) {
            mhClearAdminForm();
          }
        } catch (err) {
          console.error(err);
          alert("Delete failed: " + (err.message || err));
        }
      });
    });
  }

  function mhTagsFromInput(value) {
    return String(value || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function mhProblemsArrayFromInput(value) {
    return String(value || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function mhBuildLessonPayload(formType) {
    const chapterRaw = document.getElementById("mh_chapter")?.value?.trim() || "";

    let finalChapter = chapterRaw;
    if (formType === "research") finalChapter = "CERCETARE";
    if (formType === "history") finalChapter = "Istoria matematicii";

    return {
      id: document.getElementById("mh_id").value.trim(),
      grade: document.getElementById("mh_grade").value.trim(),

  
      chapter: finalChapter,

      tags: mhTagsFromInput(document.getElementById("mh_tags").value),

      title_ro: document.getElementById("mh_title_ro").value.trim(),
      title_en: document.getElementById("mh_title_en").value.trim(),

      learn_ro: document.getElementById("mh_learn_ro").value.trim(),
      why_ro: document.getElementById("mh_why_ro").value.trim(),

      body_ro: document.getElementById("mh_body_ro").value.trim(),
      body_en: document.getElementById("mh_body_en").value.trim()

    };
  }

  function mhBuildProblemPayload() {
    return {
      id: document.getElementById("mh_id").value.trim(),
      lesson_id: document.getElementById("mh_lesson_id").value.trim(),
      difficulty: Number(document.getElementById("mh_difficulty").value || 1),
      olymp_level: document.getElementById("mh_olymp_level").value.trim(),

      title_ro: document.getElementById("mh_title_ro").value.trim(),
      title_en: document.getElementById("mh_title_en").value.trim(),

      statement_ro: document.getElementById("mh_statement_ro").value.trim(),
      statement_en: document.getElementById("mh_statement_en").value.trim(),

      answer: document.getElementById("mh_answer").value.trim(),

      hint1_ro: document.getElementById("mh_hint1_ro").value.trim(),
      hint2_ro: document.getElementById("mh_hint2_ro").value.trim(),

      source: "",
      added_at: new Date().toISOString()

    };
  }

  function mhBuildExamPayload() {
    const normalizedItems = MH_EXAM_ITEMS_DRAFT.map((item, index) =>
      mhNormalizeDraftExamItem(item, index)
    );

    return {
      id: document.getElementById("mh_id").value.trim(),
      exam_type: document.getElementById("mh_exam_type").value.trim(),
      exam_year: Number(document.getElementById("mh_exam_year").value || 0),
      exam_title_ro: document.getElementById("mh_exam_title_ro").value.trim(),
      exam_title_en: document.getElementById("mh_exam_title_en").value.trim(),
      exam_hours: Number(document.getElementById("mh_exam_hours").value || 2),
      exam_problems: mhProblemsArrayFromInput(
        document.getElementById("mh_exam_problems").value
      ),
      items: normalizedItems,
      scoring_profile: mhExamScoringProfile?.value || "default_exact_v1",
      exam_credit: document.getElementById("mh_exam_credit").value.trim()
    };
  }

  function mhHasAnyText(...values) {
  return values.some(v => String(v ?? "").trim() !== "");
}

function mhValidateExamPayload(payload) {
  const errors = [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const legacyProblems = Array.isArray(payload.problems) ? payload.problems.filter(Boolean) : [];

  if (!payload.id) {
    errors.push("Examenul trebuie să aibă ID.");
  }

  if (!mhHasAnyText(payload.title_ro, payload.title_en)) {
    errors.push("Examenul trebuie să aibă titlu RO sau EN.");
  }

  if (!items.length && !legacyProblems.length) {
    errors.push("Examenul trebuie să aibă măcar un item sau un problem ID.");
  }

  const seenIds = new Set();

  items.forEach((rawItem, index) => {
    const item = mhNormalizeDraftExamItem(rawItem, index);
    const label = `Item ${index + 1}`;

    if (!item.id) {
      errors.push(`${label}: lipsește id-ul.`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${label}: id duplicat (${item.id}).`);
    } else {
      seenIds.add(item.id);
    }

    if (!mhHasAnyText(item.prompt_ro, item.prompt_en)) {
      errors.push(`${label}: lipsește prompt-ul (RO sau EN).`);
    }

    if (!Number.isFinite(Number(item.points)) || Number(item.points) < 0) {
      errors.push(`${label}: punctaj invalid.`);
    }

    if (item.type === "open") {
      if (!String(item.answer || "").trim()) {
        errors.push(`${label}: item open fără answer.`);
      }
      return;
    }

    if (item.type === "mcq") {
      const options = Array.isArray(item.options) ? item.options : [];
      const correctCount = options.filter(opt => opt.is_correct).length;

      if (options.length < 2) {
        errors.push(`${label}: item mcq trebuie să aibă cel puțin 2 opțiuni.`);
      }

      if (options.length > 8) {
        errors.push(`${label}: item mcq are prea multe opțiuni (maxim 8).`);
      }

      const labels = options.map(opt => String(opt.label || "").trim()).filter(Boolean);
      if (labels.length !== options.length) {
        errors.push(`${label}: una sau mai multe opțiuni nu au label valid.`);
      } else if (new Set(labels).size !== labels.length) {
        errors.push(`${label}: există label-uri duplicate la opțiuni.`);
      }

      options.forEach((opt, optIndex) => {
        if (!mhHasAnyText(opt.text_ro, opt.text_en)) {
          errors.push(`${label}: opțiunea ${opt.label || optIndex + 1} nu are text.`);
        }
      });

      if (!item.allow_none && correctCount === 0) {
        errors.push(`${label}: trebuie marcată cel puțin o variantă corectă.`);
      }

      if (!item.allow_multiple && correctCount > 1) {
        errors.push(`${label}: allow_multiple este OFF, deci ai voie la o singură variantă corectă.`);
      }

      if (item.option_mode === "A-D" && options.length !== 4) {
        errors.push(`${label}: modul A-D cere exact 4 opțiuni.`);
      }

      if (item.option_mode === "A-E" && options.length !== 5) {
        errors.push(`${label}: modul A-E cere exact 5 opțiuni.`);
      }

      if (item.option_mode === "custom") {
        const expectedCount = mhClampOptionCount(item.options_count || options.length || 4);
        if (options.length !== expectedCount) {
          errors.push(`${label}: numărul de opțiuni nu bate cu options_count.`);
        }
      }

      return;
    }

    errors.push(`${label}: tip necunoscut (${item.type}).`);
  });

  return errors;
}

  async function mhHandleAdminSubmit(e) {
    e.preventDefault();

    const status = document.getElementById("mhPublishStatus");
    const type = document.getElementById("mh_type").value;

    try {
      if (status) status.textContent = "Se salvează...";

      let payload;
      let query;

      if (type === "lesson" || type === "research" || type === "history") {
        payload = mhBuildLessonPayload(type);

        if (!payload.id) throw new Error("Lipsește ID-ul.");
        if (!payload.title_ro && !payload.title_en) throw new Error("Lipsește titlul.");

        if (MH_ADMIN_STATE.mode === "edit") {
          query = supabase.from("mh_lessons").update(payload).eq("id", MH_ADMIN_STATE.editId);
        } else {
          query = supabase.from("mh_lessons").insert(payload);
        }
      }

      if (type === "problem") {
        payload = mhBuildProblemPayload();

        if (!payload.id) throw new Error("Lipsește ID-ul.");
        if (!payload.lesson_id) throw new Error("Lipsește lesson_id.");
        if (!payload.answer) throw new Error("Lipsește answer.");

        if (MH_ADMIN_STATE.mode === "edit") {
          delete payload.added_at;
          query = supabase.from("mh_problems").update(payload).eq("id", MH_ADMIN_STATE.editId);
        } else {
          query = supabase.from("mh_problems").insert(payload);
        }
      }

      if (type === "exam") {
        payload = mhBuildExamPayload();

        const examErrors = mhValidateExamPayload(payload);
        if (examErrors.length) {
          throw new Error(examErrors.join("\n"));
        }

        if (MH_ADMIN_STATE.mode === "edit") {
          query = supabase.from("mh_exams").update(payload).eq("id", MH_ADMIN_STATE.editId);
        } else {
          query = supabase.from("mh_exams").insert(payload);
        }
      }

      if (!query) throw new Error("Nu s-a putut construi query-ul.");

      const { error } = await query;
      if (error) throw error;

      await reloadAllContentFromSupabase();
      mhRenderAdminList();
      mhClearAdminForm();

      if (status) status.textContent = "Salvat cu succes.";
    } catch (err) {
      console.error(err);
      if (status) status.textContent = "Eroare: " + (err.message || err);
      alert("Save failed: " + (err.message || err));
    }
  }

  document.getElementById("mhPublish")?.addEventListener("submit", mhHandleAdminSubmit);

  document.getElementById("mhResetForm")?.addEventListener("click", () => {
    mhClearAdminForm();
  });

  document.getElementById("mhRefreshList")?.addEventListener("click", async () => {
    await reloadAllContentFromSupabase();
    mhRenderAdminList();
  });

  document.getElementById("mhLogoutBtn")?.addEventListener("click", async () => {
    await logoutAdmin();
    adminDrawer?.classList.remove("open");
  });

  mhSetTypeBlocks(document.getElementById("mh_type")?.value || "lesson");
  mhSetAdminModeCreate();
  mhRenderAdminList();

  const ADMIN_EMAILS = [
    "suiramgabor@gmail.com"
  ].map(x => x.trim().toLowerCase());

  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("getUser error:", error);
      return null;
    }
    return data?.user ?? null;
  }

  function isEmailAdmin(email) {
    return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
  }

  async function isCurrentUserAdmin() {
    try {
      const user = await getCurrentUser();
      console.log("current user =", user);

      if (!user) return false;

      const email = (user.email || "").trim().toLowerCase();

      if (ADMIN_EMAILS.includes(email)) {
        console.log("admin by email whitelist");
        return true;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("user_roles data =", data, "error =", error);

      if (error) return false;
      return data?.role === "admin";
    } catch (err) {
      console.error("isCurrentUserAdmin crashed:", err);
      return false;
    }
  }

  async function openAdminFlow() {
    console.log("OPEN ADMIN FLOW START");
    if (!MH_AUTH_READY) {
      console.log("Auth not initialized yet");
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("existing session =", sessionData, "sessionError =", sessionError);

      if (sessionData?.session) {
        const ok = await isCurrentUserAdmin();
        console.log("already admin from existing session =", ok);

        if (ok) {
          adminDrawer?.classList.add("open");
          if (mhPublishStatus) mhPublishStatus.textContent = "";
          return;
        }
      }

      const email = prompt("Email admin:");
      console.log("email =", email);
      if (!email) return;

      const password = prompt("Parola admin:");
      console.log("password filled =", !!password);
      if (!password) return;

      console.log("before signInWithPassword");

      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log("after signInWithPassword", result);

      if (result.error) {
        alert("Login eșuat: " + result.error.message);
        return;
      }

      const ok = await isCurrentUserAdmin();
      console.log("is admin after login =", ok);

      if (!ok) {
        alert("Te-ai logat, dar contul nu are rol admin.");
        return;
      }

      adminDrawer?.classList.add("open");
      if (mhPublishStatus) mhPublishStatus.textContent = "";
    } catch (err) {
      console.error("openAdminFlow crashed:", err);
      alert("Admin flow crashed: " + (err.message || err));
    }
  }

  async function logoutAdmin() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      alert("Logout failed: " + error.message);
      return;
    }

    if (mhPublishStatus) mhPublishStatus.textContent = "";
    alert("Te-ai delogat.");
  }

  console.log("adminBtn element =", adminBtn);

  if (adminBtn) {
    adminBtn.style.display = "inline-flex";

    adminBtn.addEventListener("click", async () => {
      console.log("ADMIN BUTTON CLICKED");
      await openAdminFlow();
    });

    console.log("ADMIN HANDLER WIRED");
  } else {
    console.error("adminBtn NOT FOUND");
  }

  if (closeAdmin && adminDrawer) {
    closeAdmin.onclick = () => adminDrawer.classList.remove("open");
  } 

  // === Aliases pt. compatibilitate===
  const EXAMS = DATA.exams;            
  const EXAM_POINTS = DATA.exam_points || {};
  const TIPS = DATA.tips || {
    title_ro: "Tips",
    title_en: "Tips",
    body_ro: "",
    body_en: ""
  };

  function examHasStructuredItems(exam){
    return Array.isArray(exam?.items) && exam.items.length > 0;
  }

  function getExamRenderableItems(exam){
    if (examHasStructuredItems(exam)) {
      return exam.items;
    }

    return (exam.problems || []).map(pid => {
      const P = DATA.problems.find(pp => pp.id === pid);
      if (!P) return null;

      return {
        id: P.id,
        type: "open",
        prompt_ro: P.statement_ro || "",
        prompt_en: P.statement_en || "",
        answer: P.answer || "",
        points: EXAM_POINTS[P.id] || 0,
        source_problem_id: P.id,
        difficulty: P.difficulty ?? 0
      };
    }).filter(Boolean);
  }

  function getExamScoringProfile(exam){
    return String(exam?.scoring_profile || "default_exact_v1").trim();
  }

  function scoreExamMcqItem(item, selectedLabels, exam){
    const p = Number(item?.points || 0);
    if (p <= 0) return 0;

    const options = Array.isArray(item?.options) ? item.options : [];
    const selected = new Set((selectedLabels || []).map(x => String(x)));

    const correctLabels = options
      .filter(opt => opt.is_correct)
      .map(opt => String(opt.label));

    const wrongLabels = options
      .filter(opt => !opt.is_correct)
      .map(opt => String(opt.label));

    const profile = getExamScoringProfile(exam);

    // UTCN style
    if (profile === "utcn_single_v1") {
      if (correctLabels.length !== 1) return 0;
      if (selected.size !== 1) return 0;
      return selected.has(correctLabels[0]) ? p : 0;
    }

    // UBB style
    if (profile === "ubb_multi_v1") {
      const t = correctLabels.length;
      if (t <= 0) return 0;

 
      if (selected.size === options.length && options.length > 0) {
        return 0;
      }

      let score = 0;

      for (const label of correctLabels) {
        if (selected.has(label)) {
          score += p / t;
        }
      }

      for (const label of wrongLabels) {
        if (selected.has(label)) {
          score += (-0.66) * (p / t);
        }
      }

      score = Math.max(0, Math.min(p, score));
      return Number(score.toFixed(4));
    }

    
    const correctSet = new Set(correctLabels);

    if (selected.size !== correctSet.size) return 0;
    for (const label of correctSet) {
      if (!selected.has(label)) return 0;
    }

    return p;
  }

  function scoreStructuredExamItem(item, exam, result){
    if (!item || !result) return 0;

    if (item.type === "open") {
      return result.correct ? Number(item.points || 0) : 0;
    }

    if (item.type === "mcq") {
      return scoreExamMcqItem(item, result.selected || [], exam);
    }

    return 0;
  }

  function getExamItemStorageKey(examId){
    return `mh_exam_item_results_${examId}`;
  }

  function getExamItemResults(examId){
    try{
      return JSON.parse(localStorage.getItem(getExamItemStorageKey(examId)) || "{}");
    }catch(e){
      return {};
    }
  }

  function setExamItemResult(examId, itemId, payload){
    const all = getExamItemResults(examId);
    all[itemId] = {
      ...(all[itemId] || {}),
      ...payload,
      updated_at: Date.now()
    };
    localStorage.setItem(getExamItemStorageKey(examId), JSON.stringify(all));
  }

  function clearExamItemResults(examId){
    localStorage.removeItem(getExamItemStorageKey(examId));
  }

  function getExamItemTitle(item, index){
    return (LANG === "ro"
      ? (item.title_ro || item.title_en || `Item ${index + 1}`)
      : (item.title_en || item.title_ro || `Item ${index + 1}`));
  }

  function getExamItemPrompt(item){
    return LANG === "ro"
      ? (item.prompt_ro || item.prompt_en || "")
      : (item.prompt_en || item.prompt_ro || "");
  }

  function getExamItemCaption(item){
    return LANG === "ro"
      ? (item.image_caption_ro || item.image_caption_en || "")
      : (item.image_caption_en || item.image_caption_ro || "");
  }

  function renderExamItemImage(item){
    if (!item.image_url) return "";

    const caption = getExamItemCaption(item);

    return `
      <figure class="lesson-figure">
        <img
          class="lesson-img"
          src="${esc(item.image_url)}"
          alt="${esc(item.image_alt || getExamItemTitle(item, 0) || "Exam image")}"
          loading="lazy"
        >
        ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
      </figure>
    `;
  }

  function isExactMcqSelectionCorrect(item, selectedLabels){
    const selected = new Set((selectedLabels || []).map(String));
    const correct = new Set(
      (item.options || [])
        .filter(opt => opt.is_correct)
        .map(opt => String(opt.label))
    );

    if (selected.size !== correct.size) return false;

    for (const label of correct){
      if (!selected.has(label)) return false;
    }

    return true;
  }

  function buildStructuredExamOpenItemBlock(exam, item, index, locked, onChange){
    const wrap = document.createElement("div");
    wrap.className = "problem";

    const saved = getExamItemResults(exam.id)[item.id] || {};
    const title = getExamItemTitle(item, index);
    const prompt = getExamItemPrompt(item);

    wrap.innerHTML = `
      <div class="title" style="font-weight:800;margin-bottom:6px">
        ✍️ ${esc(title)}
      </div>

      <div class="legend" style="margin-bottom:8px;">
        ${LANG === "ro" ? "Puncte" : "Points"}: <b>${Number(item.points || 0)}</b>
      </div>

      ${renderExamItemImage(item)}

      <div style="margin:8px 0">${prompt}</div>

      <div class="checkrow">
        <input
          id="exam-open-${exam.id}-${item.id}"
          autocomplete="off"
          placeholder="${LANG === 'ro' ? 'Răspuns…' : 'Answer…'}"
          value="${esc(saved.answer_text || "")}"
          ${locked ? "disabled" : ""}
        >
        <button
          class="btn"
          id="exam-open-btn-${exam.id}-${item.id}"
          ${locked ? "disabled" : ""}
        >
          ✅ ${LANG === "ro" ? "Verifică" : "Check"}
        </button>
        <div id="exam-open-res-${exam.id}-${item.id}"></div>
      </div>

      <div class="mh-live-preview-wrap">
        <div class="legend">${LANG === "ro" ? "Preview live" : "Live preview"}</div>
        <div class="mh-live-preview-box" id="exam-open-preview-${exam.id}-${item.id}"></div>
      </div>

      <div class="mh-math-input-host" id="exam-open-tools-${exam.id}-${item.id}"></div>

    `;

    const input = wrap.querySelector(`#exam-open-${exam.id}-${item.id}`);
    const btn = wrap.querySelector(`#exam-open-btn-${exam.id}-${item.id}`);
    const res = wrap.querySelector(`#exam-open-res-${exam.id}-${item.id}`);

    const preview = wrap.querySelector(`#exam-open-preview-${exam.id}-${item.id}`);
    mhBindMathInputEnhancements(input, preview);

    const tools = wrap.querySelector(`#exam-open-tools-${exam.id}-${item.id}`);
    mhAttachMathToolbar(input, tools);

    if (saved.correct) {
      if (res) {
        res.innerHTML = `<span class="ok">✅ ${LANG === "ro" ? "Corect" : "Correct"}</span>`;
      }
      if (input) input.disabled = true;
      if (btn) btn.disabled = true;
    }

    const doCheck = () => {
      const raw = (input?.value || "").trim();
      if (!raw) {
        if (res) {
          res.innerHTML = `<span class="bad">${LANG === "ro" ? "Completează răspunsul." : "Type an answer."}</span>`;
        }
        return;
      }

      const result = SmartAnswer.check({
        user: raw,
        expected: item.answer,
        problem: { answer: item.answer, statement_ro: item.prompt_ro, statement_en: item.prompt_en }
      });

      setExamItemResult(exam.id, item.id, {
        type: "open",
        answer_text: raw,
        correct: !!result.ok
      });

      if (result.ok) {
        if (res) {
          res.innerHTML = `<span class="ok">✅ ${LANG === "ro" ? "Corect" : "Correct"}</span>`;
        }
        if (input) input.disabled = true;
        if (btn) btn.disabled = true;
      } else {
        if (res) {
          res.innerHTML = `<span class="bad">❌ ${result.message || (LANG === "ro" ? "Greșit" : "Wrong")}</span>`;
        }
      }

      if (typeof onChange === "function") onChange();
    };

    btn?.addEventListener("click", doCheck);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doCheck();
      }
    });

    return wrap;
  }

  function mhFormatExamScoreValue(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  function getExamMcqSelectionHint(item) {
    const multiText = item.allow_multiple
      ? (LANG === "ro" ? "poți bifa mai multe variante" : "you may select multiple options")
      : (LANG === "ro" ? "poți bifa o singură variantă" : "you may select a single option");

    const noneText = item.allow_none
      ? (LANG === "ro" ? " • este permis și cazul fără nicio variantă bifată" : " • no selection is also allowed")
      : "";

    return multiText + noneText;
  }

  function getExamMcqFeedbackHtml(exam, item, selected, score) {
    const full = Number(item?.points || 0);
    const exact = isExactMcqSelectionCorrect(item, selected);

    const fmtScore = mhFormatExamScoreValue(score);
    const fmtFull = mhFormatExamScoreValue(full);

    if (exact && score >= full) {
      return `
        <span class="ok">
          ✅ ${LANG === "ro" ? "Răspuns înregistrat. Punctaj complet" : "Answer locked. Full score"}:
          ${fmtScore}/${fmtFull}
        </span>
      `;
    }

    if (score > 0) {
      return `
        <span class="legend">
          🟨 ${LANG === "ro" ? "Răspuns înregistrat. Punctaj obținut" : "Answer locked. Score obtained"}:
          ${fmtScore}/${fmtFull}
        </span>
      `;
    }

    return `
      <span class="bad">
        ❌ ${LANG === "ro" ? "Răspuns înregistrat. Punctaj" : "Answer locked. Score"}:
        0/${fmtFull}
      </span>
    `;
  }

  function buildStructuredExamMcqBlock(exam, item, index, locked, onChange){
    const wrap = document.createElement("div");
    wrap.className = "problem";

    const saved = getExamItemResults(exam.id)[item.id] || {};
    const title = getExamItemTitle(item, index);
    const prompt = getExamItemPrompt(item);

    const isMulti = !!item.allow_multiple;
    const inputType = isMulti ? "checkbox" : "radio";
    const inputName = `exam-mcq-${exam.id}-${item.id}`;

    const selectionHint = getExamMcqSelectionHint(item);

    wrap.innerHTML = `
      <div class="title" style="font-weight:800;margin-bottom:6px">
        📝 ${esc(title)}
      </div>

      <div class="legend" style="margin-bottom:8px;">
        ${LANG === "ro" ? "Puncte" : "Points"}: <b>${Number(item.points || 0)}</b>
        • ${isMulti
          ? (LANG === "ro" ? "răspuns multiplu" : "multiple answers")
          : (LANG === "ro" ? "un singur răspuns" : "single answer")}
      </div>

      <div class="legend" style="margin-bottom:10px;">
        ${selectionHint}
      </div>

      ${renderExamItemImage(item)}

      <div style="margin:8px 0">${prompt}</div>

      <div class="qOptions" id="exam-mcq-options-${exam.id}-${item.id}">
        ${(item.options || []).map((opt) => `
          <label class="qOption">
            <input
              type="${inputType}"
              name="${inputName}"
              value="${esc(opt.label)}"
              ${locked ? "disabled" : ""}
            >
            <span>
              <b>(${esc(opt.label)})</b>
              ${esc(LANG === "ro" ? (opt.text_ro || opt.text_en) : (opt.text_en || opt.text_ro))}
            </span>
          </label>
        `).join("")}
      </div>

      <div class="checkrow" style="margin-top:10px;">
        <button
          class="btn"
          id="exam-mcq-btn-${exam.id}-${item.id}"
          ${locked ? "disabled" : ""}
        >
          ✅ ${LANG === "ro" ? "Trimite răspunsul" : "Submit answer"}
        </button>
        <div id="exam-mcq-res-${exam.id}-${item.id}"></div>
      </div>
    `;

    const inputs = [...wrap.querySelectorAll(`input[name="${inputName}"]`)];
    const btn = wrap.querySelector(`#exam-mcq-btn-${exam.id}-${item.id}`);
    const res = wrap.querySelector(`#exam-mcq-res-${exam.id}-${item.id}`);

    if (Array.isArray(saved.selected)) {
      inputs.forEach(input => {
        input.checked = saved.selected.includes(input.value);
      });
    }

    const wasAlreadyLocked = !!saved.locked || !!saved.correct;

    if (wasAlreadyLocked) {
      inputs.forEach(input => input.disabled = true);
      if (btn) btn.disabled = true;

      const restoredSelected = Array.isArray(saved.selected) ? saved.selected : [];
      const restoredScore = Number(saved.score ?? scoreExamMcqItem(item, restoredSelected, exam) ?? 0);

      if (res) {
        res.innerHTML = getExamMcqFeedbackHtml(exam, item, restoredSelected, restoredScore);
      }
    }

    const doCheck = () => {
      const selected = inputs
        .filter(input => input.checked)
        .map(input => input.value);

      if (!selected.length && !item.allow_none) {
        if (res) {
          res.innerHTML = `
            <span class="bad">
              ${LANG === "ro"
                ? "Selectează cel puțin o variantă."
                : "Select at least one option."}
            </span>
          `;
        }
        return;
      }

      const score = scoreExamMcqItem(item, selected, exam);
      const exact = isExactMcqSelectionCorrect(item, selected);

      setExamItemResult(exam.id, item.id, {
        type: "mcq",
        selected,
        correct: exact,
        exact_correct: exact,
        score,
        locked: true
      });

      inputs.forEach(input => input.disabled = true);
      if (btn) btn.disabled = true;

      if (res) {
        res.innerHTML = getExamMcqFeedbackHtml(exam, item, selected, score);
      }

      if (typeof onChange === "function") onChange();
    };

    btn?.addEventListener("click", doCheck);

    return wrap;
  }

  function buildStructuredExamItemBlock(exam, item, index, locked, onChange){
    if (item.type === "mcq") {
      return buildStructuredExamMcqBlock(exam, item, index, locked, onChange);
    }

    return buildStructuredExamOpenItemBlock(exam, item, index, locked, onChange);
  }

  function computeExamScore(exam){
    const items = getExamRenderableItems(exam);

    if (examHasStructuredItems(exam)) {
      const results = getExamItemResults(exam.id);

      return items.reduce((sum, item) => {
        return sum + scoreStructuredExamItem(item, exam, results[item.id]);
      }, 0);
    }

    // fallback legacy: examene vechi bazate pe problems[]
    return items.reduce((sum, item) => {
      const pid = item.source_problem_id || item.id;
      return sum + (Number(item.points || 0) * (solvedSet.has(pid) ? 1 : 0));
    }, 0);
  }

  function computeExamTotal(exam){
    const items = getExamRenderableItems(exam);
    return items.reduce((sum, item) => sum + Number(item.points || 0), 0);
  }

  /* Persistent exam timer  */
  function getExamState(id){
    try{ return JSON.parse(localStorage.getItem("mh_exam_"+id)||"null"); }catch(e){ return null; }
  }
  function setExamState(id, st){
    localStorage.setItem("mh_exam_"+id, JSON.stringify(st));
  }
  function clearExamState(id){
    localStorage.removeItem("mh_exam_"+id);
  }

  const ACTIVE_EXAM_LOCK_KEY = "mh_active_exam_lock_v1";

  let ACTIVE_EXAM_LOCK = readActiveExamLock();
  let EXAM_LOCK_RESUME_DONE = false;

  function readActiveExamLock() {
    try {
      const raw = JSON.parse(localStorage.getItem(ACTIVE_EXAM_LOCK_KEY) || "null");
      if (!raw || !raw.active || !raw.examId) {
        return { active: false, examId: null, endsAt: null };
      }
      return raw;
    } catch (e) {
      return { active: false, examId: null, endsAt: null };
    }
  }

  function writeActiveExamLock() {
    if (!ACTIVE_EXAM_LOCK?.active) {
      localStorage.removeItem(ACTIVE_EXAM_LOCK_KEY);
      document.body.classList.remove("exam-locked");
      return;
    }

    localStorage.setItem(ACTIVE_EXAM_LOCK_KEY, JSON.stringify(ACTIVE_EXAM_LOCK));
    document.body.classList.add("exam-locked");
  }

  function getActiveExamLock() {
    try {
      const raw = localStorage.getItem(ACTIVE_EXAM_LOCK_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!parsed || !parsed.examId || !parsed.endsAt) return null;

    
      if (Date.now() >= Number(parsed.endsAt)) {
        localStorage.removeItem(ACTIVE_EXAM_LOCK_KEY);
        return null;
      }

      return {
        examId: String(parsed.examId),
        endsAt: Number(parsed.endsAt)
      };
    } catch (e) {
      localStorage.removeItem(ACTIVE_EXAM_LOCK_KEY);
      return null;
    }
  }

  function isExamLockActive() {
    return !!getActiveExamLock();
  }

  function setActiveExamLock(payload) {
    if (!payload?.examId || !payload?.endsAt) return;

    localStorage.setItem(
      ACTIVE_EXAM_LOCK_KEY,
      JSON.stringify({
        examId: String(payload.examId),
        endsAt: Number(payload.endsAt)
      })
    );
  }

  function clearActiveExamLock() {
    localStorage.removeItem(ACTIVE_EXAM_LOCK_KEY);
  }

  function showExamLockMessage() {
    const lock = getActiveExamLock();

    if (!lock) return;

    const lockedExam = EXAMS.find(x => x.id === lock.examId);
    const title = lockedExam
      ? (LANG === "ro"
          ? (lockedExam.title_ro || lockedExam.title_en || lockedExam.id)
          : (lockedExam.title_en || lockedExam.title_ro || lockedExam.id))
      : lock.examId;

    alert(
      LANG === "ro"
        ? `Ai deja un examen activ: ${title}. Termină-l, lasă-l să expire sau oprește-l din admin test.`
        : `You already have an active exam: ${title}. Finish it, let it expire, or stop it from admin test.`
    );
  }

  function resumeLockedExamIfAny() {
    if (EXAM_LOCK_RESUME_DONE) return;

    const lock = getActiveExamLock();
    if (!lock) return;

    const exam = EXAMS.find(x => x.id === lock.examId);
    if (!exam) return;

    EXAM_LOCK_RESUME_DONE = true;
    openExam(exam);
  }

  if (ACTIVE_EXAM_LOCK?.active) {
    document.body.classList.add("exam-locked");
  }

  function forceStopExamSession(exam, leftEl, setLocked) {
    if (examTimer) {
      clearInterval(examTimer);
      examTimer = null;
    }

    clearExamState(exam.id);
    clearActiveExamLock();
    refreshExamLockUi();

    setLocked(true);

    if (leftEl) {
      leftEl.style.display = "inline-block";
      leftEl.textContent = (LANG === "ro")
        ? "🛑 Examen oprit de admin"
        : "🛑 Exam stopped by admin";
    }
  }

  async function renderAdminExamForceStopButton(exam, hostEl) {
    if (!hostEl || !exam?.id) return;

    hostEl.querySelector(".admin-force-stop-wrap")?.remove();

    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) return;

    const wrap = document.createElement("div");
    wrap.className = "admin-force-stop-wrap";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.flexWrap = "wrap";

    const btn = document.createElement("button");
    btn.className = "btn small";
    btn.type = "button";
    btn.textContent = "🛑 Oprește examenul (admin test)";
    btn.style.borderColor = "rgba(239,68,68,.45)";
    btn.style.background = "rgba(239,68,68,.12)";

    btn.onclick = async () => {
      const ok = confirm(`Sigur vrei să oprești forțat examenul ${exam.id}?`);
      if (!ok) return;

        try {
          const currentScore = computeExamScore(exam);

          await saveExamAttemptResultSafe(exam.id, currentScore, false);

          clearActiveExamLock();

          if (typeof clearExamState === "function") {
            clearExamState(exam.id);
          }

          if (typeof examTimer !== "undefined" && examTimer) {
            clearInterval(examTimer);
            examTimer = null;
          }

          alert("Examen oprit forțat din admin.");
          document.getElementById("drawer")?.classList.remove("open");
        } catch (err) {
          console.error("Admin force stop exam error:", err);
          alert("Force stop failed: " + (err.message || err));
        }
    };

    wrap.appendChild(btn);
    hostEl.appendChild(wrap);
  }

  /* ===== Olimpiadă — detecție & nivel ===== */
  function isOlympiad(P){
    const L = DATA.lessons.find(x=>x.id===P.lessonId) || {};
    const blob = ((P.source||"")+" "+(P.title_ro||"")+" "+(P.title_en||"")+" "+(L.tags||[]).join(" ")).toLowerCase();
    const bySource = /(olimpiad|olymp|onm|imo|jbmo|bmo|concurs|shortlist)/i.test(blob);
    const byGrade = /^ol-/.test((L.grade||"").toLowerCase());
    const byTag   = (L.tags||[]).some(t=>/olimpiad/i.test(t));
    return bySource || byGrade || byTag;
  }
  function getOlympLevel(P){
    if(P.olympLevel) return P.olympLevel;
    const s = ((P.source||"")+" "+(P.title_ro||"")+" "+(P.title_en||"")).toLowerCase();
    if(/local/.test(s)) return "locala";
    if(/județ|judet/.test(s)) return "judeteana";
    if(/interjud|regional/.test(s)) return "regionala";
    if(/național|national/.test(s)) return "nationala";
    if(/balcan/.test(s)) return "balcaniada";
    if(/internațional|international|\bimo\b/.test(s)) return "internationala";
    if(/mondial/.test(s)) return "mondiala";
    return "";
  }

  /* ===== STATE ===== */
  let solvedSet = new Set();
  let learnedSet = new Set();
  let examsPassedSet = new Set();
  let MH_PROGRESS_USER = null;

  function isGuestContentLocked() {
    return !MH_PROGRESS_USER;
  }

  function getGuestLockTitle() {
    return LANG === "ro"
      ? "🔒 Trebuie să te loghezi"
      : "🔒 You need to log in";
  }

  function getGuestLockText() {
    return LANG === "ro"
      ? "Ca să vezi lecțiile, problemele, examenele, cercetarea și istoria, trebuie să intri în contul tău."
      : "To view lessons, problems, exams, research and history, you need to sign in.";
  }

  function getGuestLockCardHTML() {
    return `
      <div class="card" style="grid-column:1 / -1; min-height:170px; display:flex; flex-direction:column; justify-content:center; gap:10px;">
        <div class="title">${getGuestLockTitle()}</div>
        <div class="legend" style="font-size:14px;">
          ${getGuestLockText()}
        </div>
        <div>
          <a class="btn" href="/profile.html">
            ${LANG === "ro" ? "🔑 Mergi la login / signup" : "🔑 Go to login / signup"}
          </a>
        </div>
      </div>
    `;
  }

  function showGuestContentMessage() {
    alert(
      LANG === "ro"
        ? "Trebuie să te loghezi ca să vezi lecțiile, problemele și examenele."
        : "You need to log in to view lessons, problems and exams."
    );
  }

  function getFreshActiveExamLock() {
    const lock = getActiveExamLock();
    if (!lock) return null;

    if (lock.endsAt && Date.now() >= lock.endsAt) {
      clearActiveExamLock();
      return null;
    }

    return lock;
  }

  function hasActiveExamLock() {
    return !!getFreshActiveExamLock();
  }

  function isSameExamCurrentlyLocked(examId) {
    const lock = getActiveExamLock();
    if (!lock) return false;
    return String(lock.examId || "") === String(examId || "");
  }

  function isOtherExamLocked(targetExamId) {
    const lock = getActiveExamLock();
    if (!lock) return false;

    const lockedExamId = String(lock.examId || "");
    const requestedExamId = String(targetExamId || "");


    if (lockedExamId === requestedExamId) return false;

    
    return true;
  }

  function showGlobalExamLockMessage() {
    alert(
      LANG === "ro"
        ? "Ai un examen activ. Restul site-ului este blocat până termini examenul sau îl oprești ca admin."
        : "You have an active exam. The rest of the site is locked until you finish it or stop it as admin."
    );
  }

  function refreshExamLockUi() {
    const locked = hasActiveExamLock();

    document.body.classList.toggle("exam-site-locked", locked);

    [
      "q",
      "minDiff",
      "maxDiff",
      "problemSort",
      "olympOnlyBtn",
      "olympLevel",
      "loadMore"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = locked;
    });
  }

  function bindExamLockGuard(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.examLockBound === "1") return;
      el.dataset.examLockBound = "1";

      el.addEventListener("click", (e) => {
        if (!hasActiveExamLock()) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showGlobalExamLockMessage();
      }, true);
    });
  }

  function wireGlobalExamClickGuards() {
    bindExamLockGuard("#infoBtn");
    bindExamLockGuard("#aboutBtn");
    bindExamLockGuard("#langBtn");
    bindExamLockGuard("#focusBtn");
    bindExamLockGuard("#themeBtn");
    bindExamLockGuard("#profileBtn");
    bindExamLockGuard("#adminBtn");

    bindExamLockGuard("#hubLessonBtn");
    bindExamLockGuard("#hubDrillBtn");
    bindExamLockGuard("#hubExamBtn");

    bindExamLockGuard("#mhBossProblemsBtn");
    bindExamLockGuard("#mhBossExamsBtn");

    bindExamLockGuard(".mh-roadmap-card");
    bindExamLockGuard(".mh-radar-item");
  }

  // ===== XP SYSTEM (doar probleme normale, nu examene / quiz lecție) =====
  let XP_TOTAL = 0;
  let XP_DETAILS = {};

  function getXPRecord(problemId){
    if (!XP_DETAILS[problemId]){
      XP_DETAILS[problemId] = {
        xp: 0,
        wrong: 0,
        hints: 0,
        solved: false,
        usedHint1: false,
        usedHint2: false
      };
    }
    return XP_DETAILS[problemId];
  }

  function saveXP(){
    queueProgressSync();
  }

  function updateXPHeader(){
    const el = document.getElementById("xpTotalHeader");
    if (el) el.textContent = XP_TOTAL;
  }
  updateXPHeader();

  function recomputeXPTotal(){
    XP_TOTAL = Object.values(XP_DETAILS || {}).reduce((sum, rec) => {
      return sum + Number(rec?.xp || 0);
    }, 0);

    updateXPHeader();
  }

  // probleme „de examen” (nu primesc XP)
  function isExamProblem(P){
    const L = DATA.lessons.find(x=>x.id===P.lessonId) || {};
    const g = (L.grade || "").toUpperCase();
    if (g === "EN" || g === "BAC" || g === "ADM") return true;
    const s = (P.source || "").toLowerCase();
    if (s.includes("evaluarea națională") || s.includes("evaluarea nationala")) return true;
    if (s.includes("bacalaureat") || /\bbac\b/.test(s)) return true;
    if (s.includes("admitere") || s.includes("ubb")) return true;
    return false;
  }

  // acordă XP la prima rezolvare corectă
  function awardXPForProblem(P){
    if (isExamProblem(P)) return; 

    const rec = getXPRecord(P.id);

    if (rec.solved) return;

    const penalty = (rec.wrong || 0) + (rec.hints || 0);
    let xpEarned = 10 - penalty;

    if (xpEarned < 0) xpEarned = 0;
    if (xpEarned > 10) xpEarned = 10;

    rec.solved = true;
    rec.xp = xpEarned;

    saveXP();
    recomputeXPTotal();
  }

  /* attempts state */
  let attempts = JSON.parse(localStorage.getItem("mh_attempts")||"{}");
  function saveAttempts()
  { 
    localStorage.setItem("mh_attempts", JSON.stringify(attempts)); 
  }

  function saveSets(){
    queueProgressSync();
  }

  function updateCounters(){
      document.getElementById("solvedCount").textContent = solvedSet.size;
      document.getElementById("learnedCount").textContent = learnedSet.size;
      document.getElementById("examsCount").textContent = examsPassedSet.size;
      updateHubNumbers();
  }

  function refreshProgressUIFromDb(){
    updateXPHeader();
    updateCounters();
    buildNestedTree();
    buildTagPanel();
    renderCards();
    drawFilterBar();
    updateRadarUI();
  }

  async function getProgressUser(){
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user ?? null;
  }

  let progressSyncTimer = null;
let progressSyncQueued = false;
let progressSyncRunning = false;

function queueProgressSync() {
  progressSyncQueued = true;

  if (progressSyncTimer) {
    clearTimeout(progressSyncTimer);
  }

  progressSyncTimer = setTimeout(() => {
    flushProgressSync().catch(err => {
      console.error("flushProgressSync error:", err);
    });
  }, 250);
}

async function flushProgressSync() {
  if (progressSyncRunning) return;

  progressSyncRunning = true;

  try {
    while (progressSyncQueued) {
      progressSyncQueued = false;

      const user = await getProgressUser();
      if (!user) return;

      await syncLessonsProgressToDb(user.id);
      await syncProblemsProgressToDb(user.id);
      await syncExamsProgressToDb(user.id);
    }
  } finally {
    progressSyncRunning = false;
  }
}

async function syncLessonsProgressToDb(userId) {
  const lessonIds = [...learnedSet];
  if (!lessonIds.length) return;

  const now = new Date().toISOString();

  const rows = lessonIds.map(lessonId => ({
    user_id: userId,
    lesson_id: lessonId,
    learned: true,
    learned_at: now,
    updated_at: now
  }));

  const { error } = await supabase
    .from("user_lesson_progress")
    .upsert(rows, { onConflict: "user_id,lesson_id" });

  if (error) throw error;
}

async function syncProblemsProgressToDb(userId) {
  const ids = new Set([
    ...Object.keys(XP_DETAILS || {}),
    ...Array.from(solvedSet || [])
  ]);

  if (!ids.size) return;

  const now = new Date().toISOString();

  const rows = [...ids].map(problemId => {
    const rec = XP_DETAILS[problemId] || {};
    const solved = !!(rec.solved || solvedSet.has(problemId));

    return {
      user_id: userId,
      problem_id: problemId,
      solved,
      wrong_attempts: Number(rec.wrong || 0),
      hints_used: Number(rec.hints || 0),
      used_hint1: !!rec.usedHint1,
      used_hint2: !!rec.usedHint2,
      revealed_answer: !!attempts?.[problemId]?.revealed,
      xp_earned: Number(rec.xp || 0),
      solved_at: solved ? now : null,
      updated_at: now
    };
  });

  const { error } = await supabase
    .from("user_problem_progress")
    .upsert(rows, { onConflict: "user_id,problem_id" });

  if (error) throw error;
}

async function syncExamsProgressToDb(userId) {
  const examIds = [...examsPassedSet];
  if (!examIds.length) return;

  const { data: existingRows, error: existingError } = await supabase
    .from("user_exam_progress")
    .select("exam_id, best_score")
    .eq("user_id", userId)
    .in("exam_id", examIds);

  if (existingError) throw existingError;

  const existingMap = new Map(
    (existingRows || []).map(row => [row.exam_id, Number(row.best_score || 0)])
  );

  const now = new Date().toISOString();

  const rows = examIds.map(examId => {
    const exam = EXAMS.find(x => x.id === examId);
    const currentScore = exam ? computeExamScore(exam) : 0;
    const oldBest = existingMap.get(examId) || 0;

    return {
      user_id: userId,
      exam_id: examId,
      passed: true,
      best_score: Math.max(currentScore, oldBest),
      passed_at: now,
      updated_at: now
    };
  });

  const { error } = await supabase
    .from("user_exam_progress")
    .upsert(rows, { onConflict: "user_id,exam_id" });

  if (error) throw error;
}

async function recordExamAttemptStart(examId) {
  const user = await getProgressUser();
  if (!user) return;

  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("user_exam_progress")
    .select("attempts_count, best_score, last_score, passed")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const payload = {
    user_id: user.id,
    exam_id: examId,
    attempts_count: Number(existing?.attempts_count || 0) + 1,
    best_score: Number(existing?.best_score || 0),
    last_score: Number(existing?.last_score || 0),
    passed: !!existing?.passed,
    started_at: now,
    updated_at: now
  };

  const { error } = await supabase
    .from("user_exam_progress")
    .upsert(payload, { onConflict: "user_id,exam_id" });

  if (error) throw error;
}

async function updateExamAttemptScore(examId, score, passedNow = false) {
  const user = await getProgressUser();
  if (!user) return;

  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("user_exam_progress")
    .select("attempts_count, best_score, passed")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const alreadyPassed = !!existing?.passed;
  const finalPassed = alreadyPassed || !!passedNow;

  const payload = {
    user_id: user.id,
    exam_id: examId,
    attempts_count: Number(existing?.attempts_count || 0),
    best_score: Math.max(Number(existing?.best_score || 0), Number(score || 0)),
    last_score: Number(score || 0),
    passed: finalPassed,
    passed_at: finalPassed ? now : null,
    updated_at: now
  };

  const { error } = await supabase
    .from("user_exam_progress")
    .upsert(payload, { onConflict: "user_id,exam_id" });

  if (error) throw error;
}

async function saveExamAttemptResultSafe(examId, score, passedNow = false) {
  try {
    await updateExamAttemptScore(examId, score, passedNow);
  } catch (err) {
    console.error("saveExamAttemptResultSafe error:", err);
  }
}

  async function loadAppProgressFromDb(){
    try {
      MH_PROGRESS_USER = await getProgressUser();

     
      solvedSet = new Set();
      learnedSet = new Set();
      examsPassedSet = new Set();
      XP_TOTAL = 0;
      XP_DETAILS = {};

   
      if (!MH_PROGRESS_USER){
        MH_PROGRESS_READY = true;
        refreshProgressUIFromDb();
        return;
      }

      const [
        { data: lessonRows, error: lessonError },
        { data: problemRows, error: problemError },
        { data: examRows, error: examError }
      ] = await Promise.all([
        supabase
          .from("user_lesson_progress")
          .select("lesson_id, learned")
          .eq("user_id", MH_PROGRESS_USER.id),

        supabase
          .from("user_problem_progress")
          .select("problem_id, solved, wrong_attempts, hints_used, used_hint1, used_hint2, xp_earned")
          .eq("user_id", MH_PROGRESS_USER.id),

        supabase
          .from("user_exam_progress")
          .select("exam_id, passed")
          .eq("user_id", MH_PROGRESS_USER.id)
      ]);

      if (lessonError) throw lessonError;
      if (problemError) throw problemError;
      if (examError) throw examError;

      (lessonRows || []).forEach(row => {
        if (row.learned) learnedSet.add(row.lesson_id);
      });

      (problemRows || []).forEach(row => {
        XP_DETAILS[row.problem_id] = {
          xp: Number(row.xp_earned || 0),
          wrong: Number(row.wrong_attempts || 0),
          hints: Number(row.hints_used || 0),
          solved: !!row.solved,
          usedHint1: !!row.used_hint1,
          usedHint2: !!row.used_hint2
        };

        if (row.solved) solvedSet.add(row.problem_id);
      });

      recomputeXPTotal();

      (examRows || []).forEach(row => {
        if (row.passed) examsPassedSet.add(row.exam_id);
      });
      MH_PROGRESS_READY = true;
      refreshProgressUIFromDb();
    } catch (err) {
      console.error("Eroare la load progress din DB:", err);

      solvedSet = new Set();
      learnedSet = new Set();
      examsPassedSet = new Set();
      XP_TOTAL = 0;
      XP_DETAILS = {};
      MH_PROGRESS_READY = true;
      refreshProgressUIFromDb();
    }
  }

  updateCounters();
  function isOlympiadSource(src=""){
    return /(olimpiad|onm|imo|jbmo|bmo|concurs|shortlist|exam)/i.test(src);
  }

  /* ===== Custom chapter order  ===== */
  const CHAPTER_ORDER = {
    "V": ["Numere Naturale", "Metode aritmetice de rezolvare a problemelor", "Divizibilitatea numerelor naturale" ,"Fracții Ordinare", "Fracții Zecimale", "Elemente de geometrie", "Unități de măsură"],
    "VI": ["Mulțimi", "Divizibiliteata Numerelor Naturale", "Rapoarte Și Proporții", "Noțiuni Fundamentale Din Geometrie", "Triunghiul"]
  };
  function chapterOrderIndex(gr, ch){
    const arr = CHAPTER_ORDER[gr];
    if(!arr) return 999;
    const i = arr.indexOf(ch);
    return i === -1 ? 998 : i;
  }
  function chapterCompare(gr, a, b){
    const ia = chapterOrderIndex(gr, a);
    const ib = chapterOrderIndex(gr, b);
    if(ia !== ib) return ia - ib;
    return a.localeCompare(b, 'ro');
  }

  function mhUi(key){
    const dict = {
      ro: {
        mobile_filters_title: "📚 Filtre & capitole",
        mobile_filters_btn: "☰ Filtre",
        advanced_filters: "🏷️ Filtre avansate",
        others: "Altele",
        difficulty_range: "Dificultate probleme (0–5)",
        tags: "Tag-uri",
        global_tags: "🌐 Taguri globale",
        structural_tags: "📂 Taguri structurale",
        special_categories: "Categorii speciale",
        lessons_curriculum: "📚 Lecții / Curriculum",
        school: "🏫 Școală (V–VIII)",
        highschool: "🏫 Liceu (IX–XII)",
        olympiad: "🏅 Olimpiada",
        faculty: "🏛 Facultate",
        faculty_courses: "Cursuri & capitole",
        research: "🔬 CERCETARE",
        history: "🕰 Istoria matematicii",
        exam_problems: "📚 Probleme date la examene",
        exam_sets: "📑 Seturi de examene",
        exam_tips: "🧠 Tips & Tricks examen",
        no_tags: "(fără taguri)",
        login_structure: "🔒 Loghează-te ca să vezi structura lecțiilor și capitolelor.",
        login_tags: "🔒 Tag-urile devin vizibile după login.",
        class_label: "Clasa",
        olymp_class_label: "Olimp. clasa",
        olymp_lessons: "🏅 Lecții de Olimpiadă",
        olymp_problems: "🏅 Probleme de Olimpiadă",
        exam_linked_problems: "📚 Probleme la examene",
        exam_sets_chip: "📑 Seturi de examene",
        faculty_chip: "🏛 Facultate (cursuri)",
        admit_chip: "🎓 Admitere (RO)",
        research_chip: "🔬 CERCETARE",
        history_chip: "🕰 Istoria matematicii"
      },
      en: {
        mobile_filters_title: "📚 Filters & chapters",
        mobile_filters_btn: "☰ Filters",
        advanced_filters: "🏷️ Advanced filters",
        others: "Other",
        difficulty_range: "Problem difficulty (0–5)",
        tags: "Tags",
        global_tags: "🌐 Global tags",
        structural_tags: "📂 Structural tags",
        special_categories: "Special categories",
        lessons_curriculum: "📚 Lessons / Curriculum",
        school: "🏫 Middle school (V–VIII)",
        highschool: "🏫 High school (IX–XII)",
        olympiad: "🏅 Olympiad",
        faculty: "🏛 University",
        faculty_courses: "Courses & chapters",
        research: "🔬 RESEARCH",
        history: "🕰 History of mathematics",
        exam_problems: "📚 Problems from exams",
        exam_sets: "📑 Exam sets",
        exam_tips: "🧠 Exam tips & tricks",
        no_tags: "(no tags)",
        login_structure: "🔒 Log in to view the lesson and chapter structure.",
        login_tags: "🔒 Tags become visible after login.",
        class_label: "Class",
        olymp_class_label: "Olympiad class",
        olymp_lessons: "🏅 Olympiad lessons",
        olymp_problems: "🏅 Olympiad problems",
        exam_linked_problems: "📚 Exam problems",
        exam_sets_chip: "📑 Exam sets",
        faculty_chip: "🏛 University (courses)",
        admit_chip: "🎓 Admissions (RO)",
        research_chip: "🔬 RESEARCH",
        history_chip: "🕰 History of mathematics"
      }
    };

    return (dict[LANG] && dict[LANG][key]) || dict.ro[key] || key;
  }

  function mhClassText(gr){
    return `${mhUi("class_label")} ${gr}`;
  }

  function mhOlympClassText(gr){
    return `${mhUi("olymp_class_label")} ${String(gr || "").replace("OL-","")}`;
  }

  function mhUpdateSidebarStaticTexts(){
    const mobileHead = document.querySelector(".mobile-aside-head strong");
    if (mobileHead) mobileHead.textContent = mhUi("mobile_filters_title");

    const mobileBtn = document.getElementById("mobileFiltersBtn");
    if (mobileBtn) mobileBtn.textContent = mhUi("mobile_filters_btn");

    const advancedTitle = document.querySelector("#siteAside > .section-title");
    if (advancedTitle) advancedTitle.textContent = mhUi("advanced_filters");

    const otherSummary = document.querySelector("#siteAside > details:nth-of-type(1) > summary");
    if (otherSummary) otherSummary.innerHTML = `⚙️ <b>${mhUi("others")}</b>`;

    const diffLegend = document.querySelector("#siteAside .range-row .legend");
    if (diffLegend) diffLegend.textContent = mhUi("difficulty_range");

    const specialSummary = document.querySelector("#siteAside > details:nth-of-type(2) > summary");
    if (specialSummary) specialSummary.innerHTML = `⭐ <b>${mhUi("special_categories")}</b>`;

    const chipTexts = {
      olympL: mhUi("olymp_lessons"),
      olymp: mhUi("olymp_problems"),
      exams: mhUi("exam_linked_problems"),
      examsets: mhUi("exam_sets_chip"),
      faculty: mhUi("faculty_chip"),
      admit: mhUi("admit_chip"),
      research: mhUi("research_chip"),
      history: mhUi("history_chip")
    };

    document.querySelectorAll("[data-chip]").forEach(el => {
      const key = el.dataset.chip;
      if (chipTexts[key]) el.textContent = chipTexts[key];
    });
  }

  function mhOlympLevelLabel(level){
    const map = {
      ro: {
        "": "Toate",
        locala: "Locală",
        judeteana: "Județeană",
        regionala: "Interjud./Regională",
        nationala: "Națională",
        balcaniada: "Balcaniadă",
        internationala: "Internațională",
        mondiala: "Mondială"
      },
      en: {
        "": "All",
        locala: "Local",
        judeteana: "County",
        regionala: "Regional / Inter-county",
        nationala: "National",
        balcaniada: "Balkan",
        internationala: "International",
        mondiala: "World"
      }
    };

    return (map[LANG] && map[LANG][level]) || (map.ro[level] ?? level);
  }

  function mhUpdateToolbarTexts(){
    const mobileBtn = document.getElementById("mobileFiltersBtn");
    if (mobileBtn) mobileBtn.textContent = mhUi("mobile_filters_btn");

    const tabMap = {
      lessons: LANG === "ro" ? "📘 Lecții" : "📘 Lessons",
      problems: LANG === "ro" ? "🧩 Probleme" : "🧩 Problems",
      xp: LANG === "ro" ? "⚡ XP Total" : "⚡ Total XP",
      exams: LANG === "ro" ? "📑 Examene" : "📑 Exams",
      research: LANG === "ro" ? "🔬 CERCETARE" : "🔬 RESEARCH",
      history: LANG === "ro" ? "🕰 Istoria" : "🕰 History"
    };

    document.querySelectorAll(".tab[data-tab]").forEach(tab => {
      const key = tab.dataset.tab;
      if (tabMap[key]) tab.textContent = tabMap[key];
    });

    const loadMoreBtn = document.getElementById("loadMore");
    if (loadMoreBtn) {
      loadMoreBtn.textContent = LANG === "ro" ? "Încarcă mai mult" : "Load more";
    }

    const sortBox = document.getElementById("problemSortBox");
    if (sortBox) {
      const legends = sortBox.querySelectorAll(".legend");

      if (legends[0]) legends[0].textContent = LANG === "ro" ? "Sortare:" : "Sort:";
      if (legends[1]) legends[1].textContent = LANG === "ro" ? "Nivel olimpiadă:" : "Olympiad level:";

      const sortSelect = document.getElementById("problemSort");
      if (sortSelect) {
        const current = sortSelect.value || "easy-asc";

        sortSelect.innerHTML = `
          <option value="easy-asc">${LANG === "ro" ? "⭐ Ușor → Greu (implicit)" : "⭐ Easy → Hard (default)"}</option>
          <option value="easy-desc">${LANG === "ro" ? "⭐ Greu → Ușor" : "⭐ Hard → Easy"}</option>
          <option value="newest">${LANG === "ro" ? "🆕 Cele mai noi" : "🆕 Newest first"}</option>
        `;

        sortSelect.value = current;
      }

      const olympBtn = document.getElementById("olympOnlyBtn");
      const olympState = document.getElementById("olympOnlyState");
      if (olympBtn) {
        const stateText = filter.olympOnly ? "ON" : "OFF";
        olympBtn.title = LANG === "ro"
          ? "Afișează doar probleme de olimpiadă"
          : "Show only olympiad problems";
        olympBtn.innerHTML = `
          🏅 ${LANG === "ro" ? "Doar olimpiadă" : "Olympiad only"}:
          <b id="olympOnlyState">${stateText}</b>
        `;
      }
      if (olympState) {
        olympState.textContent = filter.olympOnly ? "ON" : "OFF";
      }

      const olympLevel = document.getElementById("olympLevel");
      if (olympLevel) {
        const current = olympLevel.value || "";

        olympLevel.innerHTML = `
          <option value="">${mhOlympLevelLabel("")}</option>
          <option value="locala">${mhOlympLevelLabel("locala")}</option>
          <option value="judeteana">${mhOlympLevelLabel("judeteana")}</option>
          <option value="regionala">${mhOlympLevelLabel("regionala")}</option>
          <option value="nationala">${mhOlympLevelLabel("nationala")}</option>
          <option value="balcaniada">${mhOlympLevelLabel("balcaniada")}</option>
          <option value="internationala">${mhOlympLevelLabel("internationala")}</option>
          <option value="mondiala">${mhOlympLevelLabel("mondiala")}</option>
        `;

        olympLevel.value = current;
        olympLevel.title = LANG === "ro"
          ? "Filtrează nivelul olimpiadei"
          : "Filter olympiad level";
      }
    }
  }

 function mhUpdateHeaderStaticTexts(){
    const ui = MH_UI_TEXT[LANG] || MH_UI_TEXT.ro;

    const logoSlogan = document.querySelector(".logo-slogan");
    if (logoSlogan) {
      logoSlogan.textContent = ui.header_logo_slogan;
    }

    const q = document.getElementById("q");
    if (q) {
      q.placeholder = ui.header_search_placeholder;
    }

    const infoBtn = document.getElementById("infoBtn");
    if (infoBtn) infoBtn.textContent = ui.header_btn_info;

    const aboutBtn = document.getElementById("aboutBtn");
    if (aboutBtn) aboutBtn.textContent = ui.header_btn_about;

    const langBtn = document.getElementById("langBtn");
    if (langBtn) {
      langBtn.textContent = LANG === "ro" ? "🌐 RO / EN" : "🌐 EN / RO";
    }

    const focusBtn = document.getElementById("focusBtn");
    if (focusBtn) {
      focusBtn.textContent = FOCUS
        ? ui.header_btn_focus_on
        : ui.header_btn_focus_off;
    }

    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
      themeBtn.textContent = THEME === "light"
        ? ui.header_btn_theme_light
        : ui.header_btn_theme_dark;
    }

    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) profileBtn.textContent = ui.header_btn_profile;

    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) adminBtn.textContent = ui.header_btn_admin;

    const tipEl = document.getElementById("tipText");
    if (tipEl) {
      tipEl.innerHTML = ui.tip_text;
    }

    const solvedCounter = document.getElementById("solvedCount")?.closest(".counter");
    if (solvedCounter) {
      solvedCounter.title = ui.header_counter_solved_title;
    }

    const learnedCounter = document.getElementById("learnedCount")?.closest(".counter");
    if (learnedCounter) {
      learnedCounter.title = ui.header_counter_learned_title;
    }

    const examsCounter = document.getElementById("examsCount")?.closest(".counter");
    if (examsCounter) {
      examsCounter.title = ui.header_counter_exams_title;
    }

    const xpCounter = document.getElementById("xpTotalHeader")?.closest(".counter");
    if (xpCounter) {
      xpCounter.title = ui.header_counter_xp_title;
    }

    const openSolved = document.getElementById("openSolved");
    if (openSolved) {
      const title = openSolved.querySelector(".title");
      const sub = openSolved.querySelector(".legend");
      if (title) title.textContent = ui.progress_card_solved_title;
      if (sub) sub.textContent = ui.progress_card_solved_sub;
    }

    const openLearned = document.getElementById("openLearned");
    if (openLearned) {
      const title = openLearned.querySelector(".title");
      const sub = openLearned.querySelector(".legend");
      if (title) title.textContent = ui.progress_card_learned_title;
      if (sub) sub.textContent = ui.progress_card_learned_sub;
    }

    const openPassed = document.getElementById("openPassed");
    if (openPassed) {
      const title = openPassed.querySelector(".title");
      const sub = openPassed.querySelector(".legend");
      if (title) title.textContent = ui.progress_card_passed_title;
      if (sub) sub.textContent = ui.progress_card_passed_sub;
    }
  }

  function mhUpdateLessonDrawerButtons(){
    const closeBtn = document.getElementById("closeDrawer");
    const quizBtn = document.getElementById("quizBtn");
    const goBtn = document.getElementById("goProblemsBtn");

    if (closeBtn) {
      closeBtn.textContent = LANG === "ro"
        ? "✖️ Închide"
        : "✖️ Close";
    }

    if (quizBtn) {
      quizBtn.textContent = LANG === "ro"
        ? "🧪 Verificare lecție"
        : "🧪 Lesson check";

      quizBtn.title = LANG === "ro"
        ? "Testează-te rapid pe lecție"
        : "Quick lesson check";
    }

    if (goBtn) {
      goBtn.textContent = LANG === "ro"
        ? "📄 Vezi probleme propuse"
        : "📄 View suggested problems";
    }
  }

  function getTagTranslation(tag) {
    const raw = String(tag || "").trim();
    const key = normalizeChapterKey(raw);
    const found = TAG_TRANSLATIONS[key];

    if (found) return found;

    return {
      ro: raw,
      en: raw
    };
  }

  function getTagLabel(tag, lang = getCurrentLangSafe()) {
    const t = getTagTranslation(tag);
    return lang === "en" ? t.en : t.ro;
  }

  function getTagSearchBlob(tags = []) {
    return tags.map(tag => {
      const t = getTagTranslation(tag);
      return `${tag} ${t.ro} ${t.en}`;
    }).join(" ");
  }

  /* ===== Sidebar (super categorii) ===== */
  function buildNestedTree(){
    const root = document.getElementById("treeNested");
    root.innerHTML = "";

    if (isGuestContentLocked()) {
      root.innerHTML = `
        <div class="leaf" style="cursor:default; opacity:.9; border:1px dashed var(--border); border-radius:12px; padding:10px;">
          ${mhUi("login_structure")}
        </div>
      `;
      return;
    }

    const byGrade = {};
    DATA.lessons.forEach(L => {
      if (!byGrade[L.grade]) byGrade[L.grade] = {};
      if (!byGrade[L.grade][L.chapter]) byGrade[L.grade][L.chapter] = [];
      byGrade[L.grade][L.chapter].push(L);
    });

    const schoolGrades = ["V","VI","VII","VIII"];
    const lyceumGrades = ["IX","X","XI","XII"];
    const olympSchool = ["OL-V","OL-VI","OL-VII","OL-VIII"];
    const olympLyceum = ["OL-IX","OL-X","OL-XI","OL-XII"];

    function renderGrades(container, gradesList, labeler){
      gradesList.forEach(gr => {
        const det = document.createElement("details");
        det.open = false;

        const gLabel = labeler ? labeler(gr) : mhClassText(gr);
        det.innerHTML = `<summary>🏫 ${gLabel}</summary>`;

        const branch = document.createElement("div");
        branch.className = "branch sub";

        Object.keys(byGrade[gr] || {})
          .sort((a,b) => chapterCompare(gr, a, b))
          .forEach(ch => {
            const d2 = document.createElement("details");
            d2.innerHTML = `<summary>📂 ${getChapterLabel(ch)}</summary>`;

            const b2 = document.createElement("div");
            b2.className = "branch";

            (byGrade[gr][ch] || []).forEach(lesson => {
              const a = document.createElement("a");
              a.className = "leaf";

              const title = (LANG === "ro")
                ? (lesson.title_ro || lesson.title_en)
                : (lesson.title_en || lesson.title_ro);

              const check = learnedSet.has(lesson.id) ? ` <span class="check">✅</span>` : "";
              a.innerHTML = "📄 " + title + check;
              a.onclick = () => {
                TAB = "lessons";
                selectTab();
                openViewer(lesson);
              };

              b2.appendChild(a);
            });

            d2.appendChild(b2);
            branch.appendChild(d2);
          });

        det.appendChild(branch);
        container.appendChild(det);
      });
    }

    // Lecții / Curriculum
    {
      const top = document.createElement("details");
      top.open = true;
      top.innerHTML = `<summary><b>${mhUi("lessons_curriculum")}</b></summary>`;

      const br = document.createElement("div");
      br.className = "branch";

      const sch = document.createElement("details");
      sch.open = true;
      sch.innerHTML = `<summary>${mhUi("school")}</summary>`;
      const brS = document.createElement("div");
      brS.className = "branch";
      renderGrades(brS, schoolGrades);
      sch.appendChild(brS);
      br.appendChild(sch);

      const lic = document.createElement("details");
      lic.open = true;
      lic.innerHTML = `<summary>${mhUi("highschool")}</summary>`;
      const brL = document.createElement("div");
      brL.className = "branch";
      renderGrades(brL, lyceumGrades);
      lic.appendChild(brL);
      br.appendChild(lic);

      top.appendChild(br);
      root.appendChild(top);
    }

    // Olimpiada
    {
      const top = document.createElement("details");
      top.open = false;
      top.innerHTML = `<summary><b>${mhUi("olympiad")}</b></summary>`;

      const br = document.createElement("div");
      br.className = "branch";

      const detS = document.createElement("details");
      detS.open = false;
      detS.innerHTML = `<summary>${mhUi("school")}</summary>`;
      const brOS = document.createElement("div");
      brOS.className = "branch";
      renderGrades(brOS, olympSchool, mhOlympClassText);
      detS.appendChild(brOS);
      br.appendChild(detS);

      const detL = document.createElement("details");
      detL.open = false;
      detL.innerHTML = `<summary>${mhUi("highschool")}</summary>`;
      const brOL = document.createElement("div");
      brOL.className = "branch";
      renderGrades(brOL, olympLyceum, mhOlympClassText);
      detL.appendChild(brOL);
      br.appendChild(detL);

      top.appendChild(br);
      root.appendChild(top);
    }

    // Facultate
    if (byGrade["FAC"]) {
      const top = document.createElement("details");
      top.open = false;
      top.innerHTML = `<summary><b>${mhUi("faculty")}</b></summary>`;

      const br = document.createElement("div");
      br.className = "branch sub";

      renderGrades(br, ["FAC"], () => mhUi("faculty_courses"));

      top.appendChild(br);
      root.appendChild(top);
    }

    // Cercetare
    {
      const researchList = DATA.lessons.filter(L => L.chapter === "CERCETARE");
      if (researchList.length) {
        const top = document.createElement("details");
        top.open = false;
        top.innerHTML = `<summary><b>${mhUi("research")}</b></summary>`;

        const br = document.createElement("div");
        br.className = "branch";

        researchList.forEach(lesson => {
          const a = document.createElement("a");
          a.className = "leaf";
          a.innerHTML = "📄 " + ((LANG === "ro")
            ? (lesson.title_ro || lesson.title_en)
            : (lesson.title_en || lesson.title_ro));
          a.onclick = () => {
            TAB = "research";
            selectTab();
            openViewer(lesson);
          };
          br.appendChild(a);
        });

        top.appendChild(br);
        root.appendChild(top);
      }
    }

    // Istorie
    {
      const hist = DATA.lessons.filter(L => L.chapter === "Istoria matematicii");
      if (hist.length) {
        const top = document.createElement("details");
        top.open = false;
        top.innerHTML = `<summary><b>${mhUi("history")}</b></summary>`;

        const br = document.createElement("div");
        br.className = "branch";

        hist.forEach(lesson => {
          const a = document.createElement("a");
          a.className = "leaf";
          a.innerHTML = "📄 " + ((LANG === "ro")
            ? (lesson.title_ro || lesson.title_en)
            : (lesson.title_en || lesson.title_ro));
          a.onclick = () => {
            TAB = "history";
            selectTab();
            openViewer(lesson);
          };
          br.appendChild(a);
        });

        top.appendChild(br);
        root.appendChild(top);
      }
    }

    // Probleme la examene
    {
      const top = document.createElement("details");
      top.open = false;
      top.innerHTML = `<summary><b>${mhUi("exam_problems")}</b></summary>`;

      const br = document.createElement("div");
      br.className = "branch";

      const a1 = document.createElement("a");
      a1.className = "leaf";
      a1.textContent = mhUi("exam_sets");
      a1.onclick = () => { TAB = "exams"; selectTab(); };

      const a2 = document.createElement("a");
      a2.className = "leaf";
      a2.textContent = mhUi("exam_tips");
      a2.onclick = () => openTips();

      br.appendChild(a1);
      br.appendChild(a2);

      top.appendChild(br);
      root.appendChild(top);
    }

    document.querySelectorAll("[data-chip]").forEach(el => {
      el.onclick = () => {
        const chip = el.dataset.chip;

        if (chip === "olymp") return mhApplyHomePreset("roadmap-olymp");
        if (chip === "research") return mhApplyHomePreset("roadmap-research");
        if (chip === "history") return mhApplyHomePreset("open-history");
        if (chip === "faculty") return mhApplyHomePreset("open-faculty");
        if (chip === "admit") return mhApplyHomePreset("open-admit");
        if (chip === "examsets" || chip === "exams") return mhApplyHomePreset("open-exams");
        if (chip === "olympL") return mhApplyHomePreset("open-olymp-lessons");

        mhResetContentFilters();
        selectTab("lessons");
      };
    });

    wireGlobalExamClickGuards();
  }

  /* ===== Super-categoria: Tag-uri ===== */
  function buildTagPanel(){
    const host = document.getElementById("tagPanel");
    host.innerHTML = "";

    if (isGuestContentLocked()) {
      host.innerHTML = `
        <details open>
          <summary>🏷️ <b>${mhUi("tags")}</b></summary>
          <div class="branch">
            <div class="leaf" style="cursor:default; opacity:.9;">
              ${mhUi("login_tags")}
            </div>
          </div>
        </details>
      `;
      return;
    }

    const box = document.createElement("details");
    box.open = false;
    box.innerHTML = `<summary>🏷️ <b>${mhUi("tags")}</b></summary>`;

    const br = document.createElement("div");
    br.className = "branch";

    const allTags = new Set();
    DATA.lessons.forEach(L => (L.tags || []).forEach(t => allTags.add(t)));

    // globale
    const detG = document.createElement("details");
    detG.open = false;
    detG.innerHTML = `<summary>${mhUi("global_tags")}</summary>`;

    const brG = document.createElement("div");
    brG.className = "branch";

    [...allTags]
      .sort((a,b) => a.localeCompare(b, "ro"))
      .forEach(tag => {
        const a = document.createElement("a");
        a.className = "leaf";
        a.textContent = `#${getTagLabel(tag, LANG)}`;
        a.onclick = () => {
          filter.tag = tag;
          TAB = "problems";
          filter.byLessonId = null;
          selectTab();
        };
        brG.appendChild(a);
      });

    detG.appendChild(brG);
    br.appendChild(detG);

    // structurale
    const detS = document.createElement("details");
    detS.open = false;
    detS.innerHTML = `<summary>${mhUi("structural_tags")}</summary>`;

    const brS = document.createElement("div");
    brS.className = "branch";

    const byGrade = {};
    DATA.lessons.forEach(L => {
      if (!byGrade[L.grade]) byGrade[L.grade] = {};
      if (!byGrade[L.grade][L.chapter]) byGrade[L.grade][L.chapter] = [];
      byGrade[L.grade][L.chapter].push(L);
    });

    Object.keys(byGrade)
      .sort((a,b) => DATA.grades.indexOf(a) - DATA.grades.indexOf(b))
      .forEach(gr => {
        const d1 = document.createElement("details");
        d1.open = false;
        d1.innerHTML = `<summary>🎓 ${gr}</summary>`;

        const b1 = document.createElement("div");
        b1.className = "branch";

        Object.keys(byGrade[gr])
          .sort((a,b) => chapterCompare(gr, a, b))
          .forEach(ch => {
            const d2 = document.createElement("details");
            d2.open = false;
            d2.innerHTML = `<summary>📂 ${getChapterLabel(ch)}</summary>`;

            const b2 = document.createElement("div");
            b2.className = "branch";

            byGrade[gr][ch].forEach(L => {
              const d3 = document.createElement("details");
              d3.open = false;

              const lt = (LANG === "ro")
                ? (L.title_ro || L.title_en)
                : (L.title_en || L.title_ro);

              d3.innerHTML = `<summary>📘 ${lt}</summary>`;

              const b3 = document.createElement("div");
              b3.className = "branch";

              (L.tags || []).forEach(tag => {
                const a = document.createElement("a");
                a.className = "leaf";
                a.textContent = `#${getTagLabel(tag, LANG)}`;
                a.onclick = () => {
                  filter.tag = tag;
                  filter.byLessonId = L.id;
                  TAB = "problems";
                  selectTab();
                };
                b3.appendChild(a);
              });

              if (!L.tags || !L.tags.length) {
                const p = document.createElement("div");
                p.className = "leaf";
                p.textContent = mhUi("no_tags");
                p.style.opacity = ".6";
                b3.appendChild(p);
              }

              d3.appendChild(b3);
              b2.appendChild(d3);
            });

            d2.appendChild(b2);
            b1.appendChild(d2);
          });

        d1.appendChild(b1);
        brS.appendChild(d1);
      });

    detS.appendChild(brS);
    br.appendChild(detS);

    box.appendChild(br);
    host.appendChild(box);

    wireGlobalExamClickGuards();
  }

  /* ===== Search/Filter & Cards ===== */
  function searchMatch(item){
    const q=filter.q.trim().toLowerCase(); if(!q) return true;
    const text = (
      (item.title_ro || "") + " " +
      (item.title_en || "") + " " +
      getTagSearchBlob(item.tags || [])
    ).toLowerCase();
    return text.includes(q);
  }
  function hasTag(L){
    if(!filter.tag) return true;
    const tags=L?.tags||[];
    return tags.map(x=>String(x).toLowerCase()).includes(filter.tag.toLowerCase());
  }
  function passLesson(L){
    if (filter.gradeSet?.length && !filter.gradeSet.includes(L.grade)) return false;
    if (filter.topicPreset && !mhMatchesLessonTopic(L, filter.topicPreset)) return false;

    if(filter.chip==="research" && L.chapter!=="CERCETARE") return false;
    if(filter.chip==="history" && L.chapter!=="Istoria matematicii") return false;
    if(filter.chip==="faculty" && L.grade!=="FAC") return false;
    if(filter.chip==="olympL" && !/^OL-/.test(L.grade||"")) return false;
    if(filter.chip==="admit" && L.grade!=="ADM") return false;

    if(!hasTag(L)) return false;
    return searchMatch(L);
  }


  const PROBLEM_INDEX = new Map(DATA.problems.map((p,i)=>[p.id,i]));

  function passProblem(P){
    if(P.difficulty < filter.minDiff || P.difficulty > filter.maxDiff) return false;

    const L = DATA.lessons.find(x => x.id === P.lessonId) || {};
    const src = (P.source || "");
    const srcAdmit = /(admitere|ubb|fmi|unibuc|ub|upb|uaic|utcn|uvt|iasi|cluj|bucuresti|bucurești|timișoara|timisoara)/i.test(src);
    const srcEN = /(evaluarea\s+națională|evaluarea nationala|\ben\b)/i.test(src);
    const srcBAC = /(bacalaureat|\bbac\b)/i.test(src);

    // ascundem problemele de examen din tab-ul Probleme
    const isExamLinked = ["EN","BAC","ADM"].includes(L.grade) || srcEN || srcBAC || srcAdmit;
    if(isExamLinked) return false;

    if (filter.gradeSet?.length && !filter.gradeSet.includes(L.grade)) return false;
    if (filter.unsolvedOnly && solvedSet.has(P.id)) return false;
    if (filter.topicPreset && !mhMatchesProblemTopic(P, filter.topicPreset)) return false;

    if(filter.olympOnly && !isOlympiad(P)) return false;
    if(filter.olympLevel){
      const lev = getOlympLevel(P);
      if(lev !== filter.olympLevel) return false;
    }

    if(filter.byLessonId && P.lessonId !== filter.byLessonId) return false;
    if(filter.tag && !hasTag(L)) return false;

    if(filter.q.trim()){
      const text = (
        (P.title_ro || "") + " " +
        (P.title_en || "") + " " +
        (P.statement_ro || "") + " " +
        (P.statement_en || "") + " " +
        getTagSearchBlob(L.tags || [])
      ).toLowerCase();

      return text.includes(filter.q.trim().toLowerCase());
    }

    return true;
  }

  function lessonMeta(L){
    const chips = (L.tags || [])
      .map(t => `<span class="tag">#${esc(getTagLabel(t, LANG))}</span>`)
      .join("");

    return `<div class="meta">${chips}</div>`;
  }
  function problemMeta(P){
    const L=DATA.lessons.find(x=>x.id===P.lessonId);
    const warn=(P.difficulty===5 && !isOlympiadSource(P.source||""))?`<span class="tag warn">⚠️ 5★ fără sursă</span>`:"";
    const olTag = isOlympiad(P) ? `<span class="tag">🏅 Olimpiadă${getOlympLevel(P)?": "+getOlympLevel(P):""}</span>` : "";
    return `<div class="meta">
      <span class="tag">🎓 ${L?.grade||""}</span>
      <span class="tag">📂 ${getChapterLabel(L?.chapter || "")}</span>
      <span class="tag stars">${P.difficulty===0?"0":"★".repeat(P.difficulty)}</span>
      ${olTag}
      ${warn}
    </div>`;
  }

  function sortProblems(list){
    const mode = filter.problemSort || "easy-asc";

    if(mode==="easy-asc"){
      return list.sort((a,b)=>{
        if(a.difficulty!==b.difficulty) return a.difficulty - b.difficulty;
        return (a.title_ro||"").localeCompare(b.title_ro||"", 'ro');
      });
    }

    if(mode==="easy-desc"){
      return list.sort((a,b)=>{
        if(a.difficulty!==b.difficulty) return b.difficulty - a.difficulty;
        return (a.title_ro||"").localeCompare(b.title_ro||"", 'ro');
      });
    }

    const problemIndex = new Map(DATA.problems.map((p,i)=>[p.id,i]));

    return list.sort((a, b) => {
      const idxA = problemIndex.get(a.id) ?? 0;
      const idxB = problemIndex.get(b.id) ?? 0;

      const A = a.addedAt ? Date.parse(a.addedAt) : -idxA;
      const B = b.addedAt ? Date.parse(b.addedAt) : -idxB;

      return B - A;
    });
  }

  function renderXPOverview(){
    const box = document.getElementById("cards");
    if (!box) return;
    box.innerHTML = "";

    const progressRow = document.getElementById("progressRow");
    const pagWrap = document.querySelector(".paginate");
    if (progressRow) progressRow.style.display = "none";
    if (pagWrap) pagWrap.style.display = "none";

    const solvedCount = solvedSet.size;
    const entries = Object.entries(XP_DETAILS || {});
    const problemById = new Map(DATA.problems.map(p => [p.id, p]));

    // === ÎMPĂRȚIRE PE CATEGORII ===
    const solved = [];
    const inProgress = [];  
    const triedWrong = [];  

    entries.forEach(([pid, rec]) => {
      const P = problemById.get(pid);
      if (!P) return;

      if (rec.solved) {
        solved.push([pid, rec]);
      } else if ((rec.wrong || 0) > 0) {
        triedWrong.push([pid, rec]);
      } else {
        inProgress.push([pid, rec]);
      }
    });


    const byXPDesc = ([,a],[,b]) => (b.xp || 0) - (a.xp || 0);
    solved.sort(byXPDesc);
    inProgress.sort(byXPDesc);
    triedWrong.sort(byXPDesc);

    // === CARD DE REZUMAT SUS ===
    const summary = document.createElement("div");
    summary.className = "xp-summary-card";
    summary.innerHTML = `
      <div class="xp-summary-top">
        <div>
          <div class="legend">${LANG==="ro"
            ? "XP total (doar probleme normale)"
            : "Total XP (regular problems only)"}</div>
          <div class="xp-total-number">${XP_TOTAL}</div>
        </div>
        <div class="xp-summary-meta">
          <span>✅ ${LANG==="ro" ? "Probleme rezolvate" : "Problems solved"}: <b>${solvedCount}</b></span>
          <span>⚡ ${LANG==="ro" ? "Probleme cu XP înregistrat" : "Problems with XP record"}: <b>${entries.length}</b></span>
        </div>
      </div>
    `;
    box.appendChild(summary);

    if (!entries.length){
      const p = document.createElement("p");
      p.className = "legend";
      p.style.marginTop = "12px";
      p.innerHTML = LANG === "ro"
        ? "Încă nu ai XP. Rezolvă câteva probleme (din tab-ul „Probleme”, nu examene) și vei vedea aici detalii pe fiecare problemă."
        : "You don’t have XP yet. Solve some regular problems (not exam problems) and you’ll see per-problem details here.";
      box.appendChild(p);
      return;
    }

    const list = document.createElement("div");
    list.className = "xp-list";

    function renderXPSection(titleRo, titleEn, emoji, arr, defaultOpen){
      if (!arr.length) return;

      const section = document.createElement("details");
      section.className = "xp-section";
      section.open = !!defaultOpen;

      const summaryEl = document.createElement("summary");
      summaryEl.className = "xp-section-summary";
      summaryEl.innerHTML = `
        <span>${emoji} ${LANG==="ro" ? titleRo : titleEn}</span>
        <span class="legend">${arr.length}</span>
      `;
      section.appendChild(summaryEl);

      const body = document.createElement("div");
      body.className = "xp-section-body";

      arr.forEach(([pid, rec]) => {
        const P = problemById.get(pid);
        if (!P) return;
        const L = DATA.lessons.find(x => x.id === P.lessonId) || {};

        const title = LANG==="ro"
          ? (P.title_ro || P.title_en || pid)
          : (P.title_en || P.title_ro || pid);

        const lessonTitle = LANG==="ro"
          ? (L.title_ro || L.title_en || L.chapter || "")
          : (L.title_en || L.title_ro || L.chapter || "");

        let statusLabel, statusEmoji;
        if (rec.solved) {
          statusEmoji = "✅";
          statusLabel = LANG==="ro" ? "Rezolvată" : "Solved";
        } else if ((rec.wrong || 0) > 0) {
          statusEmoji = "❌";
          statusLabel = LANG==="ro"
            ? "Probleme nerezolvate (greșite)"
            : "Unsolved (still wrong)";
        } else {
          statusEmoji = "⏳";
          statusLabel = LANG==="ro"
            ? "Probleme în curs"
            : "In progress";
        }

        const card = document.createElement("div");
        card.className = "xp-item";
        card.innerHTML = `
          <div class="xp-item-head">
            <div>
              <div class="xp-item-title">🧩 ${esc(title)}</div>
              <div class="legend">
                📘 ${esc(lessonTitle)}${L.grade ? " • 🎓 " + esc(L.grade) : ""}
              </div>
            </div>
            <div class="xp-item-score">
              <span class="xp-badge">${rec.xp || 0} / 10 XP</span>
              <span class="xp-status">${statusEmoji} ${statusLabel}</span>
            </div>
          </div>
          <div class="xp-item-meta">
            <span>❌ ${LANG==="ro" ? "Greșeli" : "Mistakes"}: <b>${rec.wrong || 0}</b></span>
            <span>💡 ${LANG==="ro" ? "Hinturi" : "Hints"}: <b>${rec.hints || 0}</b></span>
            <span>⚡ ${LANG==="ro" ? "XP problemă" : "Problem XP"}: <b>${rec.xp || 0}</b></span>
          </div>
        `;

        // click pe problemă în XP 
        card.onclick = () => {
          TAB = "problems";
          filter.byLessonId = P.lessonId;
          filter.chip = null;
          filter.q = "";
          page = 1;
          renderCards();
          drawFilterBar();
          openViewer(P);
        };

        body.appendChild(card);
      });

      section.appendChild(body);
      list.appendChild(section);
    }

  
    renderXPSection(
      "Probleme rezolvate",
      "Solved problems",
      "✅",
      solved,
      true       
    );

    renderXPSection(
      "Probleme în curs",
      "Problems in progress",
      "⏳",
      inProgress,
      false
    );

    renderXPSection(
      "Probleme nerezolvate",
      "Unsolved (still wrong)",
      "❌",
      triedWrong,
      false
    );

    box.appendChild(list);
  }

  function renderCards(){
    const box=document.getElementById("cards"); 
    if (!box) return;

    const progressRow = document.getElementById("progressRow");
    const pagWrap = document.querySelector(".paginate");

    if (isGuestContentLocked()) {
      box.innerHTML = getGuestLockCardHTML();

      if (progressRow) progressRow.style.display = "none";
      if (pagWrap) pagWrap.style.display = "none";

      const filterBar = document.getElementById("filterBar");
      if (filterBar) {
        filterBar.innerHTML = "";
        filterBar.style.display = "none";
      }

      const sortBox = document.getElementById("problemSortBox");
      if (sortBox) sortBox.style.display = "none";

      return;
    }

    // tab special: XP
    if (TAB === "xp"){
      if (progressRow) progressRow.style.display = "none";
      if (pagWrap) pagWrap.style.display = "none";
      renderXPOverview();
      return;
    } else {
      if (progressRow) progressRow.style.display = "grid";
      if (pagWrap) pagWrap.style.display = "flex";
    }

    box.innerHTML="";

    let list =
      TAB==="lessons" ? DATA.lessons.filter(passLesson)
      : TAB==="problems" ? sortProblems(DATA.problems.filter(passProblem))
      : TAB==="exams"   ? EXAMS.filter(passExam)    : TAB==="research" ? DATA.lessons.filter(l=>l.chapter==="CERCETARE").filter(passLesson)
      : DATA.lessons.filter(l=>l.chapter==="Istoria matematicii").filter(passLesson);

    // sort lecții
    if(TAB==="lessons"){
      list = list.slice().sort((A,B)=>{
        const gA = DATA.grades.indexOf(A.grade), gB = DATA.grades.indexOf(B.grade);
        if(gA !== gB) return gA - gB;
        const cc = chapterCompare(A.grade, A.chapter||"", B.chapter||"");
        if(cc !== 0) return cc;
        const tA = (A.title_ro||A.title_en||"");
        const tB = (B.title_ro||B.title_en||"");
        return tA.localeCompare(tB,'ro');
      });
    }

    const effectivePageSize = filter.limitOverride || pageSize;
    const total = list.length;
    const slice = list.slice(0, page * effectivePageSize);
    slice.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    if (TAB === "lessons" || TAB === "research" || TAB === "history") {
      // === CARD LECȚIE  ===
      const title = LANG === "ro"
        ? (item.title_ro || item.title_en || "Lecție")
        : (item.title_en || item.title_ro || "Lesson");

      div.innerHTML = `
        <div class="title">📘 ${esc(title)}</div>
        ${lessonMeta(item)}
        <div class="src">${esc((item.sources && item.sources.join(", ")) || "")}</div>
      `;

      div.onclick = () => openViewer(item);

    } else if (TAB === "problems") {
      // === CARD PROBLEMĂ  ===
      const title = LANG === "ro"
        ? (item.title_ro || item.title_en || "Problemă")
        : (item.title_en || item.title_ro || "Problem");

      const solved = solvedSet.has(item.id);
      const rec = getXPRecord(item.id); 
      const hasWrong = (rec.wrong || 0) > 0 && !rec.solved;

      const statusChip = solved
        ? `<span class="tag">✅ ${LANG==="ro" ? "Rezolvată" : "Solved"}</span>`
        : hasWrong
          ? `<span class="tag">❌ ${LANG==="ro" ? "Încercată, dar greșită" : "Tried, still wrong"}</span>`
          : `<span class="tag">⏳ ${LANG==="ro" ? "În curs" : "In progress"}</span>`;

      div.innerHTML = `
        <div class="title">🧩 ${esc(title)}</div>
        ${problemMeta(item)}
        <div class="meta">${statusChip}</div>
        <div class="src">${esc(item.source || "")}</div>
      `;

  
      div.onclick = () => {
        openViewer(item); 
      };

    } else if (TAB === "exams") {
    const title = LANG === "ro"
      ? (item.title_ro || item.title_en || "Examen")
      : (item.title_en || item.title_ro || "Exam");

    const total = computeExamTotal(item);
    const got = computeExamScore(item);
    const passed = got >= PASS_THRESHOLD;

    div.innerHTML = `
      <div class="title">📑 ${esc(title)}</div>
      <div class="meta">
        <span class="tag">🗓 ${item.year || ""}</span>
        <span class="tag">🏷 ${item.type || ""}</span>
        <span class="tag">${LANG==="ro" ? "Punctaj" : "Score"}: ${got}/${total}</span>
        ${passed ? `<span class="tag">🏆 ${LANG==="ro" ? "Promovat" : "Passed"}</span>` : ""}
      </div>
    `;

    div.onclick = () => openExam(item);
    }

    box.appendChild(div);
    });
    document.getElementById("loadMore").style.visibility = (page * effectivePageSize >= total) ? "hidden" : "visible";
    MH_render(box);

    mhUpdateToolbarTexts();

    wireGlobalExamClickGuards();
    refreshExamLockUi();

    document.getElementById("problemSortBox").style.display = (TAB==="problems")?"flex":"none";
  }

  /* ===== Filter bar ===== */
  function drawFilterBar(){
    const fb = document.getElementById("filterBar");
    const chips = [];

    const topicMap = {
      algebra: LANG === "ro" ? "Algebră" : "Algebra",
      geometrie: LANG === "ro" ? "Geometrie" : "Geometry",
      olymp: LANG === "ro" ? "Olimpiadă" : "Olympiad",
      research: LANG === "ro" ? "Research" : "Research"
    };

    if (filter.byLessonId){
      const L = DATA.lessons.find(x => x.id === filter.byLessonId);
      if (L){
        chips.push(`<span class="chipbtn">🎯 ${(LANG === "ro" ? "Din lecția" : "From lesson")}: <b>${esc(LANG === 'ro' ? (L.title_ro || L.title_en) : (L.title_en || L.title_ro))}</b></span>`);
      }
    }

    if (filter.gradeSet?.length){
      chips.push(`<span class="chipbtn">🎓 ${esc(filter.gradeSet.join(", "))}</span>`);
    }

    if (filter.examType){
      chips.push(`<span class="chipbtn">📑 ${LANG === "ro" ? "Examene" : "Exams"}: <b>${esc(filter.examType)}</b></span>`);
    }

    if (filter.topicPreset){
      chips.push(`<span class="chipbtn">🧭 ${esc(topicMap[filter.topicPreset] || filter.topicPreset)}</span>`);
    }

    if (filter.unsolvedOnly){
      chips.push(`<span class="chipbtn">⏳ ${LANG === "ro" ? "Doar nerezolvate" : "Unsolved only"}</span>`);
    }

    if (filter.tag){
      chips.push(`<span class="chipbtn">🏷️ #${esc(getTagLabel(filter.tag, LANG))}</span>`);
    }

    if (filter.q.trim()){
      chips.push(`<span class="chipbtn">🔎 „${esc(filter.q.trim())}”</span>`);
    }

    if (filter.olympOnly){
      chips.push(`<span class="chipbtn">🏅 ${LANG === "ro" ? "Doar olimpiadă" : "Olympiad only"}</span>`);
    }

    if (filter.olympLevel){
      chips.push(`<span class="chipbtn">🏅 ${LANG === "ro" ? "Nivel" : "Level"}: <b>${esc(filter.olympLevel)}</b></span>`);
    }

    if (chips.length){
      chips.push(`<button class="chipbtn clear" id="clearFilters">✖️ ${LANG === "ro" ? "Șterge filtre" : "Clear filters"}</button>`);
      fb.innerHTML = chips.join("");
      fb.style.display = "flex";

      document.getElementById("clearFilters").onclick = () => {
        mhResetContentFilters();
        page = 1;
        renderCards();
        drawFilterBar();
      };
    } else {
      fb.style.display = "none";
      fb.innerHTML = "";
    }
  }

  /* ===== Viewer: Lecții / Tips ===== */
  function fmtTime(s){ const m=Math.floor(s/60), ss=("0"+(s%60)).slice(-2); return `${m}:${ss}`; }
  function stopLessonTimer(){
    if(lessonTimer){ clearInterval(lessonTimer); lessonTimer=null; }
    if(bottomObserver){ bottomObserver.disconnect(); bottomObserver=null; }
    document.getElementById("lessonTimerBox").style.display="none";
    lessonSecondsLeft=0; lessonScrolled=false;
  }
  function setUnderstoodAvailability(contentScrollable){
    const und=document.getElementById("understoodBtn");
    const needScroll = contentScrollable && !lessonScrolled ? (LANG==='ro'?'Derulează până jos':'Scroll to the bottom') : '';
    const needTime = (lessonSecondsLeft>0) ? (LANG==='ro'?'Așteaptă timerul':'Wait for timer') : '';
    const label = (lessonSecondsLeft>0||(!lessonScrolled && contentScrollable)) ? `🔒 ${[needScroll,needTime].filter(Boolean).join(' & ')}` : (LANG==='ro'?'👍 Ai înțeles?':'👍 Understood?');
    und.textContent=label;
    und.disabled=!((lessonSecondsLeft===0) && (lessonScrolled || !contentScrollable));
  }
  function buildLessonHTML(L){
    const isRO = (LANG === "ro");

    const title = isRO
      ? (L.title_ro || L.title_en || "")
      : (L.title_en || L.title_ro || "");

    const learn = isRO
      ? (L.learn_ro || L.learn_en || "")
      : (L.learn_en || L.learn_ro || "");

    const why = isRO
      ? (L.why_ro || L.why_en || "")
      : (L.why_en || L.why_ro || "");

    const body = isRO
      ? (L.body_ro || L.content_ro || L.body_en || L.content_en || "")
      : (L.body_en || L.content_en || L.body_ro || L.content_ro || "");

    const ex = isRO
      ? (L.examples_ro || L.examples_en || "")
      : (L.examples_en || L.examples_ro || "");

    const sourcesArr = Array.isArray(L.sources) ? L.sources.filter(Boolean) : [];

    const imgs = (L.images || []).map(img => {
      const caption = isRO
        ? (img.caption_ro || img.caption_en || "")
        : (img.caption_en || img.caption_ro || "");

      const altText = isRO
        ? (img.alt_ro || img.alt_en || img.alt || title || "lesson image")
        : (img.alt_en || img.alt_ro || img.alt || title || "lesson image");

      return `
        <figure class="lesson-figure">
          <img
            class="lesson-img"
            src="${img.src}"
            ${img.src2x ? `srcset="${img.src} 1x, ${img.src2x} 2x"` : ``}
            alt="${esc(altText)}"
            loading="lazy"
          >
          ${caption ? `<figcaption>${caption}</figcaption>` : ""}
        </figure>
      `;
    }).join("");

    const learnLabel = isRO ? "🎯 Ce vei învăța:" : "🎯 What you will learn:";
    const whyLabel = isRO ? "🌍 La ce te ajută:" : "🌍 Why this matters:";
    const lessonLabel = isRO ? "📘 Lecția" : "📘 Lesson";
    const examplesLabel = isRO ? "🧪 Exemple" : "🧪 Examples";
    const sourcesLabel = isRO ? "📚 Surse" : "📚 Sources";

    const sourcesHtml = sourcesArr.length
      ? `
        <section>
          <h3>${sourcesLabel}</h3>
          <ul>
            ${sourcesArr.map(src => `<li>${esc(src)}</li>`).join("")}
          </ul>
        </section>
      `
      : "";

    return `
      <h2 style="margin:0 0 8px 0">${title}</h2>

      ${learn ? `<p class="legend"><b>${learnLabel}</b> ${learn}</p>` : ""}
      ${why ? `<p class="legend"><b>${whyLabel}</b> ${why}</p>` : ""}

      ${imgs}

      <hr style="border-color:var(--border);opacity:.5;margin:10px 0">

      ${body ? `<section><h3>${lessonLabel}</h3>${body}</section>` : ""}
      ${ex ? `<section><h3>${examplesLabel}</h3>${ex}</section>` : ""}
      ${sourcesHtml}

      <div id="bottomSentinel" style="height:1px"></div>
    `;
  }

  /* ===== Micro-Quiz pe lecție ===== */

  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

  /* ===== Lesson-quiz attempts ===== */
  let quizAttempts = JSON.parse(localStorage.getItem("mh_quiz_attempts")||"{}");
  function saveQuizAttempts(){ localStorage.setItem("mh_quiz_attempts", JSON.stringify(quizAttempts)); }
  function qKey(lessonId, qid){ return `${lessonId}::${qid}`; }
  function qGetTries(lessonId, qid){
    const k=qKey(lessonId,qid);
    return (quizAttempts[k]?.tries)||[];
  }
  function qPushTry(lessonId, qid, rec){
    const k=qKey(lessonId,qid);
    if(!quizAttempts[k]) quizAttempts[k]={tries:[]};
    quizAttempts[k].tries.push(rec);
    saveQuizAttempts();
  }

  function normalizeCustomItem(it, isRO){
    const letters = ['a','b','c','d','e'];
    const prompt = isRO ? (it.prompt_ro || it.prompt_en || '') : (it.prompt_en || it.prompt_ro || '');
    let opts = (it.options || []).map(o => ({ text: String(o.text||''), correct: !!o.correct }));

    while (opts.length < 5) opts.push({ text: '—', correct: false });
    if (opts.length > 5) opts = opts.slice(0,5);

    opts.sort(()=>Math.random()-0.5);
    const out = opts.map((o,i)=>({ key: letters[i], text:o.text, correct:o.correct }));

    const exp = isRO ? (it.explanation_ro || it.explanation_en || '') : (it.explanation_en || it.explanation_ro || '');
    const explanationHTML = exp ? `<p>${exp}</p>` : '';

    const qid = it.id || ('auto_'+(prompt||'').replace(/\s+/g,' ').slice(0,80));

    return { qid, prompt, options: out, explanationHTML };
  }

  function buildLessonQuiz(L){
    const isRO = (typeof LANG !== "undefined" ? LANG === "ro" : true);
    const bank = (window.DATA_QUIZZES && window.DATA_QUIZZES[L.id]) || [];

    if (!bank.length){
      return [{
        qid: `fallback_${L.id}`,
        prompt: isRO
          ? `Nu ai definit încă întrebări pentru lecția „${L.title_ro || L.title_en || L.id}”.`
          : `No questions defined yet for lesson "${L.title_en || L.title_ro || L.id}".`,
        options: [
          { key:'a', text:'OK', correct:true },
          { key:'b', text:'—', correct:false },
          { key:'c', text:'—', correct:false },
          { key:'d', text:'—', correct:false },
          { key:'e', text:'—', correct:false }
        ],
        explanationHTML: isRO
          ? "<p>Adaugă întrebări în <code>DATA_QUIZZES[lessonId]</code>.</p>"
          : "<p>Add questions under <code>DATA_QUIZZES[lessonId]</code>.</p>"
      }];
    }

    const normalized = bank.map((it, idx) => {
      const qid = it.id || `${L.id}_q${idx + 1}`;
      const kind = String(it.kind || "simple").trim().toLowerCase();

      let opts = Array.isArray(it.options) ? [...it.options] : [];
      while (opts.length < 5) opts.push({ text: "—", correct: false });
      if (opts.length > 5) opts = opts.slice(0, 5);

      const letters = ["a","b","c","d","e"];
      opts = opts
        .map((o, i) => ({
          key: letters[i],
          text: String(o.text || ""),
          correct: !!o.correct
        }));

      const prompt = isRO
        ? (it.prompt_ro || it.prompt_en || "")
        : (it.prompt_en || it.prompt_ro || "");

      const explanation = isRO
        ? (it.explanation_ro || it.explanation_en || "")
        : (it.explanation_en || it.explanation_ro || "");

      return {
        qid,
        kind,
        prompt,
        options: opts,
        explanationHTML: explanation ? `<p>${explanation}</p>` : ""
      };
    });

    const simple = normalized.filter(q => q.kind === "simple");
    const multi  = normalized.filter(q => q.kind === "multi");
    const recap  = normalized.filter(q => q.kind === "recap");

    const pickRandom = (arr, n) => {
      return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
    };

    const result = [
      ...pickRandom(simple, 3),
      ...pickRandom(multi, 1),
      ...pickRandom(recap, 1)
    ];

    if (result.length < 5) {
      const used = new Set(result.map(x => x.qid));
      const rest = normalized.filter(x => !used.has(x.qid));
      result.push(...pickRandom(rest, 5 - result.length));
    }

    return result.slice(0, 5);
  }

  // desenează quiz-ul în viewer (înlocuiește conținutul lecției)
  function openLessonQuiz(L){
    stopLessonTimer();

    const isRO = (typeof LANG !== "undefined" ? LANG === "ro" : true);
    const qs = buildLessonQuiz(L, 3);

    const content = document.getElementById("viewContent");
    content.innerHTML = "";

    const box = document.createElement("div");
    box.className = "quizBox";
    box.innerHTML = `
      <div class="quizHead">
        <div class="quizTitle">
          🧪 ${isRO ? 'Verificare lecție' : 'Lesson check'} — ${(isRO ? (L.title_ro || L.title_en) : (L.title_en || L.title_ro))}
        </div>
        <div class="legend">
          ${isRO
            ? 'Selectează toate variantele corecte. După verificare vezi scorul, explicațiile și istoricul greșelilor.'
            : 'Select all correct options. After checking you will see score, explanations and wrong-answer history.'}
        </div>
      </div>

      <div class="problem" style="margin-bottom:12px;">
        <div class="title" style="font-size:1rem;">
          ${isRO ? '📊 Rezumat quiz' : '📊 Quiz summary'}
        </div>
        <div class="legend" id="quizSummaryText">
          ${isRO ? 'Încă nu ai verificat răspunsurile.' : 'You have not checked the answers yet.'}
        </div>
        <div class="progressRow" style="margin-top:10px;">
          <div class="progressBar"><i id="quizSummaryBar" style="width:0%"></i></div>
        </div>
      </div>

      <div id="quizList"></div>

      <div class="quizActions">
        <button class="btn" id="quizCheckAll">✅ ${isRO ? 'Verifică răspunsurile' : 'Check answers'}</button>
        <button class="btn" id="quizRetryWrong">🎯 ${isRO ? 'Resetează doar greșitele' : 'Reset only wrong ones'}</button>
        <button class="btn" id="quizNew">🔄 ${isRO ? 'Alt set de întrebări' : 'New set'}</button>
        <button class="btn" id="quizReset">♻️ ${isRO ? 'Reset tot quiz-ul' : 'Reset whole quiz'}</button>
        <button class="btn" id="quizBack">⬅️ ${isRO ? 'Înapoi la lecție' : 'Back to lesson'}</button>
      </div>
    `;
    content.appendChild(box);

    const list = box.querySelector("#quizList");
    const summaryText = box.querySelector("#quizSummaryText");
    const summaryBar = box.querySelector("#quizSummaryBar");

    const fmtStamp = (ts) => {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${dd} ${hh}:${mm}`;
    };

    function getQuestionCorrectKeys(Q){
      return Q.options.filter(o => o.correct).map(o => o.key);
    }

    function getQuestionChosenKeys(idx){
      return [...list.querySelectorAll(`input[type="checkbox"][data-q="${idx}"]`)]
        .filter(x => x.checked)
        .map(x => x.getAttribute("data-key"));
    }

    function isQuestionCorrect(Q, idx){
      const chosen = new Set(getQuestionChosenKeys(idx));
      const correct = new Set(getQuestionCorrectKeys(Q));

      if (chosen.size !== correct.size) return false;
      for (const k of correct){
        if (!chosen.has(k)) return false;
      }
      return true;
    }

    function paintQAttempts(idx){
      const Q = qs[idx];
      const tries = qGetTries(L.id, Q.qid);
      const ul = list.querySelector(`#qList-${idx}`);
      const cnt = list.querySelector(`#qCnt-${idx}`);
      if (!ul || !cnt) return;

      cnt.textContent = String(tries.length);
      ul.innerHTML = "";

      tries.forEach((t, i) => {
        const item = document.createElement("li");
        const keys = (t.sel || []).join(", ");
        item.innerHTML = `❌ <b>#${i + 1}</b> (${fmtStamp(t.ts)}): <code>${esc(keys || "∅")}</code>`;
        ul.appendChild(item);
      });
    }

    function updateQuizSummary(){
      let correctCount = 0;

      qs.forEach((Q, idx) => {
        const badge = list.querySelector(`#qBadge-${idx}`);
        if (badge && badge.dataset.state === "ok") {
          correctCount++;
        }
      });

      const total = qs.length;
      const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      if (summaryBar) summaryBar.style.width = pct + "%";

      if (correctCount === 0) {
        summaryText.innerHTML = isRO
          ? `Ai <b>0 / ${total}</b> corecte momentan.`
          : `You currently have <b>0 / ${total}</b> correct.`;
        return;
      }

      if (correctCount < total) {
        summaryText.innerHTML = isRO
          ? `Ai <b>${correctCount} / ${total}</b> corecte. Mai sunt de reparat <b>${total - correctCount}</b>.`
          : `You have <b>${correctCount} / ${total}</b> correct. <b>${total - correctCount}</b> still need fixing.`;
        return;
      }

      summaryText.innerHTML = isRO
        ? `🎉 Perfect. Ai <b>${total} / ${total}</b> corecte.`
        : `🎉 Perfect. You got <b>${total} / ${total}</b> correct.`;
    }

    function showExplainButton(idx){
      const expBtn = list.querySelector(`#expBtn-${idx}`);
      if (expBtn) expBtn.style.display = "inline-block";
    }

    function hideExplainButtonIfClean(idx){
      const tries = qGetTries(L.id, qs[idx].qid);
      const expBtn = list.querySelector(`#expBtn-${idx}`);
      if (!expBtn) return;
      expBtn.style.display = tries.length > 0 ? "inline-block" : "none";
    }

    function setQuestionState(idx, ok, messageHtml = ""){
      const badge = list.querySelector(`#qBadge-${idx}`);
      const msgEl = list.querySelector(`#qMsg-${idx}`);

      if (!badge || !msgEl) return;

      badge.style.display = "inline-block";
      badge.dataset.state = ok ? "ok" : "bad";
      badge.textContent = ok
        ? (isRO ? "Corect" : "Correct")
        : (isRO ? "Greșit" : "Wrong");
      badge.className = "qBadge " + (ok ? "ok" : "bad");

      msgEl.innerHTML = messageHtml || "";
    }

    function clearQuestionState(idx){
      const badge = list.querySelector(`#qBadge-${idx}`);
      const msgEl = list.querySelector(`#qMsg-${idx}`);
      const expEl = list.querySelector(`#exp-${idx}`);

      if (badge){
        badge.style.display = "none";
        badge.dataset.state = "";
        badge.className = "qBadge";
      }

      if (msgEl) msgEl.innerHTML = "";
      if (expEl) expEl.style.display = "none";

      hideExplainButtonIfClean(idx);
    }

    function renderQuiz(){
      list.innerHTML = "";

      qs.forEach((Q, idx) => {
        const hasWrongHistory = qGetTries(L.id, Q.qid).length > 0;

        const q = document.createElement("div");
        q.className = "qBlock";
        q.innerHTML = `
          <div class="qText"><b>Q${idx + 1}.</b> ${Q.prompt}</div>

          <div class="qOptions">
            ${Q.options.map(opt => `
              <label class="qOption">
                <input type="checkbox" data-q="${idx}" data-key="${opt.key}">
                <span><b>(${opt.key})</b> <span class="qTxt">${esc(opt.text)}</span></span>
              </label>
            `).join("")}
          </div>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px;">
            <span class="qBadge" id="qBadge-${idx}" data-state="" style="display:none"></span>
            <button class="explainBtn" id="expBtn-${idx}" style="display:${hasWrongHistory ? 'inline-block' : 'none'}">
              📘 ${isRO ? 'Explică' : 'Explain'}
            </button>
          </div>

          <div class="legend" id="qMsg-${idx}" style="margin-top:6px;"></div>
          <div class="explain" id="exp-${idx}" style="display:none">${Q.explanationHTML || ""}</div>

          <details class="collapsible" id="qAtt-${idx}" style="margin-top:8px;">
            <summary>⛔ ${isRO ? 'Răspunsuri greșite' : 'Wrong answers'} (<span id="qCnt-${idx}">0</span>)</summary>
            <ul class="attempts" id="qList-${idx}"></ul>
          </details>
        `;
        list.appendChild(q);

        const btn = q.querySelector(`#expBtn-${idx}`);
        const exd = q.querySelector(`#exp-${idx}`);
        btn.onclick = () => {
          exd.style.display = (exd.style.display === "block" ? "none" : "block");
        };

        paintQAttempts(idx);
      });

      MH_render(list);
      updateQuizSummary();
    }

    function gradeOne(idx){
      const Q = qs[idx];
      const chosen = getQuestionChosenKeys(idx);
      const should = getQuestionCorrectKeys(Q);
      const ok = isQuestionCorrect(Q, idx);

      if (ok) {
        setQuestionState(
          idx,
          true,
          isRO
            ? `✅ Ai bifat exact combinația corectă: <code>${esc(should.join(", "))}</code>`
            : `✅ You selected the exact correct combination: <code>${esc(should.join(", "))}</code>`
        );
        return true;
      }

      qPushTry(L.id, Q.qid, { sel: chosen, ts: Date.now() });
      paintQAttempts(idx);
      showExplainButton(idx);

      const det = list.querySelector(`#qAtt-${idx}`);
      if (det) det.open = true;

      setQuestionState(
        idx,
        false,
        isRO
          ? `❌ Ai ales <code>${esc(chosen.join(", ") || "∅")}</code>. Corect era altă combinație.`
          : `❌ You selected <code>${esc(chosen.join(", ") || "∅")}</code>. The correct combination was different.`
      );

      return false;
    }

    function gradeAll(){
      let correctCount = 0;

      qs.forEach((Q, idx) => {
        if (gradeOne(idx)) correctCount++;
      });

      updateQuizSummary();
      content.scrollTop = 0;

      return correctCount;
    }

    function resetQuestionInputs(idx){
      [...list.querySelectorAll(`input[type="checkbox"][data-q="${idx}"]`)].forEach(cb => {
        cb.checked = false;
      });
    }

    function resetOnlyWrong(){
      qs.forEach((Q, idx) => {
        const badge = list.querySelector(`#qBadge-${idx}`);
        const isWrong = badge && badge.dataset.state === "bad";

        if (isWrong) {
          resetQuestionInputs(idx);
          clearQuestionState(idx);
        }
      });

      updateQuizSummary();
    }

    function resetQuizUI(){
      qs.forEach((Q, idx) => {
        resetQuestionInputs(idx);
        clearQuestionState(idx);
      });

      updateQuizSummary();
    }

    box.querySelector("#quizCheckAll").onclick = gradeAll;

    box.querySelector("#quizRetryWrong").onclick = () => {
      resetOnlyWrong();
    };

    box.querySelector("#quizNew").onclick = () => {
      const fresh = buildLessonQuiz(L, 3);
      qs.length = 0;
      fresh.forEach(x => qs.push(x));
      renderQuiz();
    };

    box.querySelector("#quizReset").onclick = () => {
      resetQuizUI();
    };

    box.querySelector("#quizBack").onclick = () => {
      openViewer(L);
    };

    renderQuiz();
    setTimeout(() => { MH_render(content); }, 0);
  }

  function setLessonOnlyActionsVisible(show) {
    const quizBtn = document.getElementById("quizBtn");
    const goBtn = document.getElementById("goProblemsBtn");
    const undBtn = document.getElementById("understoodBtn");

    if (quizBtn) quizBtn.style.display = show ? "inline-flex" : "none";
    if (goBtn) goBtn.style.display = show ? "inline-flex" : "none";
    if (undBtn) undBtn.style.display = show ? "inline-flex" : "none";
  }

  function openViewer(item){

    if (isGuestContentLocked()) {
      showGuestContentMessage();
      return;
    }

    if (hasActiveExamLock()) {
      showGlobalExamLockMessage();
      return;
    }

    setLessonOnlyActionsVisible(false);
    stopLessonTimer();

    // opresc instanța anterioară (dacă există)
    try{ if (window.MH_NumberLinePy) MH_NumberLinePy.unmount(WIDGET_ID); }catch(e){}
    const isProblem = (TAB==="problems");
    const title=(LANG==="ro"? (item.title_ro||item.title_en):(item.title_en||item.title_ro));
    const done = isProblem ? solvedSet.has(item.id) : learnedSet.has(item.id);

    document.getElementById("viewTitle").textContent = (done?"✅ ":"") + title;
    const meta = isProblem ? ("🟨 " + (item.difficulty===0?"dif. 0":"★".repeat(item.difficulty)))
                          : (item.grade? ("🎓 "+(/^(OL-)/.test(item.grade)?("Olimp. "+item.grade.replace('OL-','')):item.grade)): ("📂 " + getChapterLabel(item.chapter)));
    document.getElementById("viewMeta").textContent=meta;

    const content=document.getElementById("viewContent"); content.innerHTML="";
    if(scrollHandler){ content.removeEventListener("scroll", scrollHandler); scrollHandler=null; }
    stopLessonTimer();

    if(isProblem){
      renderProblem(item, content);
    } else {
      const html=buildLessonHTML(item);
      content.innerHTML=html;
      setTimeout(()=>{ MH_render(content); },0);
      
    if (item && item.id === 'v-reprez-nr-nat') {
      const box = document.createElement('section');
      box.className = 'numlineBox problem';
      box.id = `numline-box-${WIDGET_ID}`;

      const tutRO = `
      <details class="collapsible" open>
      <summary>🎈 Joacă-te pe axa numerelor</summary>
      <ol>
        <li>Apasă <b>+</b> și <b>−</b> ca să te plimbi pe axă. 🐾</li>
        <li>Dă <b>click</b> pe axă și sari direct la număr. ✨</li>
        <li>Bifează <b>pare</b>/<b>impare</b>, ca să vezi culori speciale. 🌈</li>
        <li>Apasă <b>Urm. par</b> sau <b>Urm. impar</b> pentru salturi rapide. 🏃</li>
        <li>Porneste <b>▶︎</b> ca să meargă singură și alege <b>Viteza</b>. ⏱️</li>
        <li>Vrei pași egali? Bifează <b>snap la pas</b>. 📏</li>
        <li>Alege o <b>Țintă</b> (par/impar) și strânge <b>Scor</b> când nimerești! 🏆</li>
        <li><b>Reset</b> readuce totul la început (inclusiv <i>Max</i> și <i>Pas</i>). 🔁</li>
      </ol>
      <p style="opacity:.85">Trucuri: tastele <b>←</b>/<b>→</b>, <b>P</b> (par), <b>I</b> (impar), <b>Space</b> (play).</p>
      </details>`;

      const tutEN = `
      <details class="collapsible" open>
      <summary>🎈 Play with the number line</summary>
      <ol>
        <li>Use <b>+</b> and <b>−</b> to move. 🐾</li>
        <li><b>Click</b> the line to jump to a number. ✨</li>
        <li>Toggle <b>even</b>/<b>odd</b>, for colorful ticks. 🌈</li>
        <li>Press <b>Next even</b>/<b>Next odd</b> for quick jumps. 🏃</li>
        <li>Start <b>▶︎</b> to autoplay and set the <b>Speed</b>. ⏱️</li>
        <li>Want neat steps? Turn on <b>snap to step</b>. 📏</li>
        <li>Pick a <b>Goal</b> (even/odd) and score points when you land on it! 🏆</li>
        <li><b>Reset</b> puts everything back (including <i>Max</i> and <i>Step</i>). 🔁</li>
      </ol>
      <p style="opacity:.85">Tips: keys <b>←</b>/<b>→</b>, <b>P</b> (even), <b>I</b> (odd), <b>Space</b> (play).</p>
      </details>`;
      box.innerHTML = `
        <div class="numlineHead">
          <div>
            🔢 <b>${LANG === "ro" ? "Axa numerică (numere naturale)" : "Number line (natural numbers)"}</b>
          </div>
          <button class="btn small" id="numlineToggleBtn-${WIDGET_ID}">
            ${LANG === "ro" ? "🙈 Ascunde axa" : "🙈 Hide number line"}
          </button>
        </div>
        <div class="numlineHost" id="numlineHost-${WIDGET_ID}"></div>
        ${(typeof LANG !== 'undefined' && LANG === 'en') ? tutEN : tutRO}
      `;

    const sentinel = content.querySelector('#bottomSentinel');
    if (sentinel) {
      sentinel.insertAdjacentElement('beforebegin', box); 
    } else {
      content.appendChild(box);
    }

    const host = box.querySelector(`#numlineHost-${WIDGET_ID}`);
    const btn  = box.querySelector(`#numlineToggleBtn-${WIDGET_ID}`);

    let mounted = false;
    let visible = true;

  function mountAxis(){
    if (!mounted && window.MH_NumberLinePy) {
      MH_NumberLinePy.mount(WIDGET_ID, host);
      mounted = true;
    }
  }
  function unmountAxis(){
    try {
      if (mounted && window.MH_NumberLinePy) {
        MH_NumberLinePy.unmount(WIDGET_ID);
      }
    } catch(e) {}
    mounted = false;
  }
  function setBtnLabel(){
      if (typeof LANG !== 'undefined' && LANG === 'en') {
        btn.textContent = visible ? '🙈 Hide number line' : '👁️ Show number line';
      } else {
        btn.textContent = visible ? '🙈 Ascunde axa' : '👁️ Arată axa';
      }
  }

    function whenNumLineReady(cb){
    if (window.MH_NumberLinePy && typeof MH_NumberLinePy.mount === 'function') {
      cb(); return;
    }
    const iv = setInterval(() => {
      if (window.MH_NumberLinePy && typeof MH_NumberLinePy.mount === 'function') {
        clearInterval(iv); cb();
      }
      }, 100);
      setTimeout(() => clearInterval(iv), 15000);
    }

    whenNumLineReady(() => { mountAxis(); });

    btn.onclick = () => {
        if (visible) {
          unmountAxis();
          host.style.display = 'none';
          visible = false;
          setBtnLabel();
        } else {
          host.style.display = '';
          whenNumLineReady(() => { mountAxis(); });
          visible = true;
          setBtnLabel();
        }
      };
      }

      const goBtn = document.getElementById("goProblemsBtn");
      if (item.id && DATA.problems.some(p => p.lessonId === item.id)) {
        goBtn.style.display = "inline-flex";
        mhUpdateLessonDrawerButtons();
        goBtn.onclick = () => { 
          TAB = "problems"; 
          filter.byLessonId = item.id; 
          filter.problemSort = "easy-asc";
          page = 1;
          selectTab(); 
        };
      } else {
        goBtn.style.display = "none";
      }

      const und=document.getElementById("understoodBtn");
      und.style.display="inline-flex";

      const needsScroll = content.scrollHeight > content.clientHeight + 8;
      lessonScrolled = !needsScroll;

      const quizBtn = document.getElementById("quizBtn");
      quizBtn.style.display = "inline-flex";

      mhUpdateLessonDrawerButtons();
      setLessonOnlyActionsVisible(true);

      quizBtn.onclick = ()=> openLessonQuiz(item);

      const sentinel = content.querySelector('#bottomSentinel');
      if(needsScroll && sentinel){
        bottomObserver = new IntersectionObserver(([entry])=>{
          if(entry.isIntersecting){
            lessonScrolled = true;
            setUnderstoodAvailability(true);
            if(bottomObserver){ bottomObserver.disconnect(); bottomObserver=null; }
          }
        }, { root: content, threshold: 1.0 });
        bottomObserver.observe(sentinel);
      }

      // 1 minute timer
      lessonSecondsLeft = 60;
      const tBox=document.getElementById("lessonTimerBox"), tSpan=document.getElementById("lessonTimer");
      tBox.style.display="inline-flex"; tSpan.textContent=fmtTime(lessonSecondsLeft);
      lessonTimer=setInterval(()=>{
        lessonSecondsLeft=Math.max(0, lessonSecondsLeft-1);
        tSpan.textContent=fmtTime(lessonSecondsLeft);
        if(lessonSecondsLeft===0){ clearInterval(lessonTimer); lessonTimer=null; setUnderstoodAvailability(true); }
      },1000);
      setUnderstoodAvailability(true);

      und.onclick=()=>{
        const ready = (lessonSecondsLeft===0) && (lessonScrolled || !needsScroll);
        if(!ready) return;
        if(!learnedSet.has(item.id)){
          learnedSet.add(item.id);
          mhIncrementTodayProgress("lesson");
          saveSets();
          updateCounters();
          document.getElementById("viewTitle").textContent="✅ "+title;
          renderCards(); buildNestedTree(); buildTagPanel();
          und.textContent = (LANG==='ro'?'✅ Marcată ca înțeleasă!':'✅ Marked as understood!');
          und.disabled=true;
        }
      };
    }

    document.getElementById("drawer").classList.add("open");
    mhUpdateLessonDrawerButtons();
    setTimeout(()=>{ MH_render(document.getElementById("viewContent")); },10);

      // --- PROGRESS PE LECȚIE (SCROLL) ---
    const progressBar = document.getElementById("lessonProgressBar");
    const progressInner = document.getElementById("lesson-progress");
    const viewer = document.getElementById("viewContent");

    if (progressBar && progressInner && viewer){
    if (FOCUS) progressBar.style.display = "block";

    const onScroll = () => {
      const h = viewer.scrollHeight - viewer.clientHeight;
      if (h <= 0){
        progressInner.style.width = "0%";
        return;
      }
      const ratio = viewer.scrollTop / h;
      progressInner.style.width = (Math.min(Math.max(ratio,0),1) * 100).toFixed(1) + "%";
    };

    viewer.removeEventListener("scroll", viewer._mhScrollHandler || (()=>{}));
    viewer._mhScrollHandler = onScroll;
    viewer.addEventListener("scroll", onScroll);
    onScroll();
    }
  }

  function openTips(){

    if (hasActiveExamLock()) {
      showGlobalExamLockMessage();
      return;
    }

    const title=(LANG==='ro'?TIPS.title_ro:TIPS.title_en);
    document.getElementById("viewTitle").textContent = title;
    document.getElementById("viewMeta").textContent = LANG==='ro'?'📎 Ghid rapid pentru examene':'📎 Quick exam guide';

    const content=document.getElementById("viewContent"); content.innerHTML = (LANG==='ro'?TIPS.body_ro:TIPS.body_en);
    setTimeout(()=>{ MH_render(content); },0);

    setLessonOnlyActionsVisible(false);
    stopLessonTimer();

    document.getElementById("drawer").classList.add("open");
  }
  try{ if (window.MH_NumberLinePy) MH_NumberLinePy.unmount(WIDGET_ID); }catch(e){}
  function closeDrawerSafely() {
    if (isExamLockActive()) {
      showExamLockMessage();
      return;
    }

    if (scrollHandler) {
      document.getElementById("viewContent").removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }

    stopLessonTimer();
    document.getElementById("drawer").classList.remove("open");
  }

  document.getElementById("closeDrawer").onclick = () => {
    closeDrawerSafely();
  };

  document.getElementById("drawer").onclick = (e) => {
    if (e.target.id === "drawer") {
      closeDrawerSafely();
    }
  };

  /* ===== Problems (attempts/hints/reveal + RESET) ===== */
  function problemHintsFallback(P){
    const id=P.lessonId||"";
    if(/citirea|numere|valoare/i.test(id)) return { h1:(LANG==='ro'?'Marchează perioadele (mii, milioane).':'Mark periods (thousands, millions).'), h2:(LANG==='ro'?'Gândește în \\(10^k\\).':'Think in \\(10^k\\).') };
    if(/gauss|suma/i.test(id)) return { h1:(LANG==='ro'?'Folosește formula Gauss.':'Use Gauss formula.'), h2:(LANG==='ro'?'Media·număr de termeni.':'Mean·terms count.') };
    if(/reducerii|unitate/i.test(id)) return { h1:(LANG==='ro'?'Calculează întâi pentru 1 unitate.':'Find unit rate first.'), h2:(LANG==='ro'?'Atenție la inversă.':'Watch inverse proportion.') };
    if(/divizibil/i.test(id)) return { h1:(LANG==='ro'?'Descompune în factori primi.':'Prime factorization first.'), h2:(LANG==='ro'?'Reguli 2,3,5,9,10,4,8.':'Use quick tests.') };
    if(/frac|zecim/i.test(id)) return { h1:(LANG==='ro'?'Adu la același numitor.':'Common denominator.'), h2:(LANG==='ro'?'Simplifică la final.':'Reduce at end.') };
    if(/geo/i.test(id)) return { h1:(LANG==='ro'?'Desenează mental situația.':'Visualize the figure.'), h2:(LANG==='ro'?'Folosește definițiile.':'Stick to definitions.') };
    if(/unit|măsură|masura/i.test(id)) return { h1:(LANG==='ro'?'Transformă toate unitățile la fel.':'Unify units.'), h2:(LANG==='ro'?'Apoi calculează.':'Then compute.') };
    if(/collatz|res-collatz/i.test(id)) return { h1:(LANG==='ro'?'Aplică regula corect 5–10 pași.':'Apply the rule for a few steps.'), h2:(LANG==='ro'?'Grupează împărțirile la 2.':'Bundle divisions by 2.') };
    return { h1:(LANG==='ro'?'Revede definițiile.':'Revisit definitions.'), h2:(LANG==='ro'?'Caz particular simplu.':'Try a simple case.') };
  }
  function getHints(P){
    return {
      h1: (LANG==='ro'?(P.hint1_ro||null):(P.hint1_en||null)) || problemHintsFallback(P).h1,
      h2: (LANG==='ro'?(P.hint2_ro||null):(P.hint2_en||null)) || problemHintsFallback(P).h2
    };
  }
  function norm(s){ return (s||"").toString().trim().toLowerCase().replace(/\s+/g,"").replace("√","sqrt"); }

  function renderProblem(problem, host){
  host = host || document.getElementById("viewContent");
  if (!host) return;

  const lesson = DATA.lessons.find(x=>x.id===problem.lessonId) || {};
  const isExam = isExamProblem(problem);
  const rec = getXPRecord(problem.id);

  const title = LANG==="ro"
    ? (problem.title_ro || problem.title_en || ("Problema " + problem.id))
    : (problem.title_en || problem.title_ro || ("Problem " + problem.id));

  const statement = LANG==="ro"
    ? (problem.statement_ro || problem.statement_en || "")
    : (problem.statement_en || problem.statement_ro || "");

  const hint1 = LANG==="ro"
    ? (problem.hint1_ro || problem.hint1_en || "")
    : (problem.hint1_en || problem.hint1_ro || "");

  const hint2 = LANG==="ro"
    ? (problem.hint2_ro || problem.hint2_en || "")
    : (problem.hint2_en || problem.hint2_ro || "");

  const stars = problem.difficulty===0 ? "0★" : "★".repeat(problem.difficulty);

  const existingAttempts = attempts[problem.id] || [];

  host.innerHTML = `
    <article class="problem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div class="stars">🧩 ${stars}</div>
          <h2 style="margin:4px 0 6px;">${esc(title)}</h2>
          <div class="legend">
            📘 ${LANG==="ro"
                  ? (lesson.title_ro || lesson.title_en || lesson.chapter || "")
                  : (lesson.title_en || lesson.title_ro || lesson.chapter || "")}
            ${lesson.grade ? " • 🎓 " + esc(lesson.grade) : ""}
          </div>
        </div>
        ${!isExam ? `
        <div style="text-align:right;" class="problem-xp-box">
          <div class="legend">${LANG==="ro" ? "⚡ XP pe această problemă" : "⚡ XP on this problem"}</div>
          <div class="xp-inline-number" id="probXpValue">${rec.xp || 0} / 10</div>
          <div class="legend" id="probXpStats" style="font-size:11px;">
            ${LANG==="ro" ? "greșeli" : "mistakes"}: ${rec.wrong || 0} • ${LANG==="ro" ? "hinturi" : "hints"}: ${rec.hints || 0}
          </div>
        </div>` : ""}
      </div>

      <hr style="border-color:var(--border);opacity:.4;margin:8px 0 10px;">

      <div class="legend" style="margin-bottom:6px;">
        ${LANG==="ro"
          ? "Scrie răspunsul exact (număr, fracție a/b etc.). XP se calculează ca: 10 − greșeli − hinturi (minim 0)."
          : "Type the exact answer (number, fraction a/b etc.). XP = 10 − mistakes − hints (min 0)."}
      </div>

      <div class="problem-statement">
        ${statement}
      </div>

      <div class="checkrow">
        <input id="answerInput" autocomplete="off" placeholder="${LANG==='ro'?'Răspunsul tău…':'Your answer…'}">
        <button class="btn small" id="checkBtn">${LANG==='ro'?'Verifică':'Check'}</button>
        <span class="legend" id="statusArea"></span>
      </div>

      <div class="mh-live-preview-wrap">
        <div class="legend">Preview live</div>
        <div class="mh-live-preview-box" id="answerPreviewBox"></div>
      </div>

      <div class="mh-math-input-host" id="answerMathToolbar"></div>

      <div class="check-confirm" id="checkConfirm">
        <span>${LANG==='ro'
          ? 'Ești sigur că vrei să trimiți răspunsul? Încercarea se va înregistra (contor + XP).'
          : 'Are you sure you want to submit? The attempt will be recorded for counters & XP.'}</span>
        <div class="check-confirm-buttons">
          <button class="btn small" id="confirmNo">${LANG==='ro'?'Nu':'No'}</button>
          <button class="btn small" id="confirmYes">${LANG==='ro'?'Da':'Yes'}</button>
        </div>
      </div>

      <details class="collapsible" style="margin-top:10px;">
        <summary>📜 ${LANG==='ro'?'Istoric răspunsuri':'Answer history'}</summary>
        <ul class="attempts" id="attemptsList"></ul>
      </details>

      <div class="hints" id="hintsBox" style="margin-top:10px;">
        ${hint1 ? `
        <div class="hint" id="hintWrap1" style="display:none;">
          <details>
            <summary>💡 Hint 1 (se deblochează după 2 răspunsuri greșite${!isExam ? ', scade 1 din cei 10 XP' : ''})</summary>
            <p>${esc(hint1)}</p>
          </details>
        </div>` : ""}

        ${hint2 ? `
        <div class="hint" id="hintWrap2" style="display:none;">
          <details>
            <summary>💡 Hint 2 (se deblochează după 4 răspunsuri greșite${!isExam ? ', scade 1 din cei 10 XP' : ''})</summary>
            <p>${esc(hint2)}</p>
          </details>
        </div>` : ""}
      </div>

      <div class="reveal">
        <button class="reveal-btn" id="revealBtn">${LANG==='ro'?'Arată răspunsul corect':'Show correct answer'}</button>
        <span class="legend" id="revealText" style="display:none;margin-left:8px;">
          ${LANG==='ro'?'Răspuns corect:':'Correct answer:'} <code>${esc(problem.answer)}</code>
        </span>
      </div>
    </article>
  `;

  MH_render(host);

  const attemptsList = host.querySelector("#attemptsList");
  existingAttempts.forEach(row => {
    const li = document.createElement("li");
    li.textContent = (row.ok ? "✅ " : "❌ ") + row.value;
    attemptsList.appendChild(li);
  });

  const input = host.querySelector("#answerInput");
  const checkBtn = host.querySelector("#checkBtn");
  const confirmBox = host.querySelector("#checkConfirm");
  const yesBtn = host.querySelector("#confirmYes");
  const noBtn = host.querySelector("#confirmNo");
  const statusArea = host.querySelector("#statusArea");

  const answerPreviewBox = host.querySelector("#answerPreviewBox");
  mhBindMathInputEnhancements(input, answerPreviewBox);

  console.log("SMART INPUT FUNCS:", {
    mhBind: typeof globalThis.mhBindMathInputEnhancements,
    mhPreview: typeof globalThis.mhRenderMathPreview,
    mhLatex: typeof globalThis.mhMathPreviewToLatex
  });
  
  const hintWrap1 = host.querySelector("#hintWrap1");
  const hintWrap2 = host.querySelector("#hintWrap2");
  const hintDetails1 = hintWrap1 ? hintWrap1.querySelector("details") : null;
  const hintDetails2 = hintWrap2 ? hintWrap2.querySelector("details") : null;

  function refreshHints(){
    const r = getXPRecord(problem.id);
    if (hintWrap1 && r.wrong >= 2) hintWrap1.style.display = "block";
    if (hintWrap2 && r.wrong >= 4) hintWrap2.style.display = "block";
  }
  refreshHints();

  function refreshXPInline(){
    if (isExam) return;
    const r = getXPRecord(problem.id);
    const v = host.querySelector("#probXpValue");
    const s = host.querySelector("#probXpStats");
    if (v) v.textContent = `${r.xp || 0} / 10`;
    if (s) s.textContent =
      `${LANG==='ro'?'greșeli':'mistakes'}: ${r.wrong || 0} • ${LANG==='ro'?'hinturi':'hints'}: ${r.hints || 0}`;
  }

  function pushAttempt(val, ok){
    const arr = attempts[problem.id] || [];
    arr.push({ value:val, ok:!!ok });
    attempts[problem.id] = arr;
    saveAttempts();

    const li = document.createElement("li");
    li.textContent = (ok ? "✅ " : "❌ ") + val;
    attemptsList.appendChild(li);
  }

  function doCheck(){
    const val = (input.value || "").trim();
    if (!val){
      statusArea.textContent = LANG==="ro"
        ? "Completează mai întâi răspunsul."
        : "Type an answer first.";
      return;
    }

    const result = SmartAnswer.check({
      user: val,
      expected: problem.answer,
      problem
    });
    const ok = result.ok;

    pushAttempt(val, ok);

    const rec = getXPRecord(problem.id);

    if (!ok){
      statusArea.innerHTML = LANG==="ro"
        ? `❌ Nu e încă bine. Încearcă din nou.${result.message ? ' <span class="legend">' + esc(result.message) + '</span>' : ''}`
        : `❌ Not correct yet. Try again.${result.message ? ' <span class="legend">' + esc(result.message) + '</span>' : ''}`;
      if (!isExam && !rec.solved){
        rec.wrong = (rec.wrong || 0) + 1;
        saveXP();
        refreshHints();
        refreshXPInline();
      }
    } else {
      statusArea.innerHTML = LANG==="ro"
        ? `✅ Corect! Bravo.${result.message ? ' <span class="legend">' + esc(result.message) + '</span>' : ''}`
        : `✅ Correct, well done.${result.message ? ' <span class="legend">' + esc(result.message) + '</span>' : ''}`;
      checkBtn.disabled = true;
      input.disabled = true;

      const wasAlreadySolved = solvedSet.has(problem.id);

      solvedSet.add(problem.id);

      if (!wasAlreadySolved) {
        mhIncrementTodayProgress("problem");
      }

      saveSets();
      updateCounters();

      if (!isExam && !wasAlreadySolved){
        awardXPForProblem(problem);
        refreshXPInline();
      }
    }
  }

  checkBtn.addEventListener("click", () => {
    if (checkBtn.disabled) return;
    confirmBox.style.display = "flex";
  });
  if (noBtn) noBtn.addEventListener("click", () => {
    confirmBox.style.display = "none";
  });
  if (yesBtn) yesBtn.addEventListener("click", () => {
    confirmBox.style.display = "none";
    doCheck();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
      e.preventDefault();
      checkBtn.click();
    }
  });

  // hint 1 / hint 2 
  if (hintDetails1){
    hintDetails1.addEventListener("toggle", () => {
      const rec = getXPRecord(problem.id);
      if (hintDetails1.open && !isExam && !rec.solved && !rec.usedHint1){
        rec.usedHint1 = true;
        rec.hints = (rec.hints || 0) + 1;
        saveXP();
        refreshXPInline();
      }
    });
  }
  if (hintDetails2){
    hintDetails2.addEventListener("toggle", () => {
      const rec = getXPRecord(problem.id);
      if (hintDetails2.open && !isExam && !rec.solved && !rec.usedHint2){
        rec.usedHint2 = true;
        rec.hints = (rec.hints || 0) + 1;
        saveXP();
        refreshXPInline();
      }
    });
  }

  // buton „Arată răspunsul”
  const revealBtn = host.querySelector("#revealBtn");
  const revealText = host.querySelector("#revealText");
  if (revealBtn && revealText){
    revealBtn.addEventListener("click", () => {
      const show = (revealText.style.display === "none" || !revealText.style.display);
      revealText.style.display = show ? "inline" : "none";
    });
  }
  }

/// MathHard — Smart Answer Engine v2

(function () {
  const isRo = () => (typeof LANG !== "undefined" ? LANG === "ro" : true);

  function msg(key) {
    const ro = {
      not_equal: "Nu se potrivește răspunsul așteptat.",
      rounding: "Aproape! Verifică rotunjirea / cifrele zecimale.",
      need_simplest: "Te rog scrie fracția în formă ireductibilă (a/b redus).",
      prefer_fraction: "Corect numeric, dar aici se cere forma a/b.",
      could_reduce: "Corect. Nota: fracția ta se poate reduce.",
      drop_units: "Scrie doar numărul, fără unități.",
      need_integer: "Se cere un număr întreg.",
      expect_list: "Se așteaptă o listă de valori.",
      list_size: "Număr diferit de elemente față de răspunsul așteptat.",
      unparsable: "Nu am putut interpreta unele elemente din răspuns.",
      interval_mismatch: "Intervalul nu este scris corect.",
      set_mismatch: "Mulțimea nu corespunde răspunsului așteptat."
    };

    const en = {
      not_equal: "Doesn't match the expected answer.",
      rounding: "Close! Check rounding / decimals.",
      need_simplest: "Please write the fraction in simplest form (reduced a/b).",
      prefer_fraction: "Numerically correct, but the task asks for a/b form.",
      could_reduce: "Correct. Note: your fraction can be reduced.",
      drop_units: "Write just the number, without units.",
      need_integer: "An integer is required.",
      expect_list: "A list of values is expected.",
      list_size: "Different number of elements than expected.",
      unparsable: "Could not interpret some items in the answer.",
      interval_mismatch: "The interval is not written correctly.",
      set_mismatch: "The set does not match the expected answer."
    };

    return (isRo() ? ro[key] : en[key]) || key;
  }

  const U = {
    trim(s) {
      return (s || "").toString().trim();
    },

    canon(s) {
      s = (s || "").toString();

      return s
        .replace(/[\u2212\u2013\u2014]/g, "-")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/gi, "pi")
        .replace(/\s+/g, " ")
        .trim();
    },

    stripVariablePrefix(s) {
      return String(s || "")
        .replace(/^\s*[a-zA-Z][a-zA-Z0-9_]*\s*(=|∈)\s*/u, "")
        .trim();
    },

    stripUnits(s) {
      let t = String(s || "").trim();

      const re =
        /\s*(cm|mm|m|km|g|kg|mg|l|ml|lei|ron|eur|euro|usd|h|min|sec|s|grade|°|%)(?![\w/])\s*$/i;

      while (re.test(t)) {
        t = t.replace(re, "").trim();
      }

      return t;
    },

    normalizeNumericComma(s) {
      const t = String(s || "").trim();

      if (/^[+-]?\d+,\d+$/.test(t)) {
        return t.replace(",", ".");
      }

      return t;
    },

    gcd(a, b) {
      a = Math.abs(Number(a) || 0);
      b = Math.abs(Number(b) || 0);

      while (b) {
        const t = a % b;
        a = b;
        b = t;
      }

      return a || 1;
    },

    makeFrac(n, d) {
      n = Number(n);
      d = Number(d);

      if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
        return { n: NaN, d: 0 };
      }

      if (d < 0) {
        n = -n;
        d = -d;
      }

      return { n, d };
    },

    reduceFrac(f) {
      if (!f || !Number.isFinite(f.n) || !Number.isFinite(f.d) || f.d === 0) {
        return f;
      }

      const g = U.gcd(f.n, f.d);
      return U.makeFrac(f.n / g, f.d / g);
    },

    fracEqual(a, b) {
      if (!a || !b || a.d === 0 || b.d === 0) return false;
      return a.n * b.d === b.n * a.d;
    },

    fracToNumber(f) {
      if (!f || f.d === 0) return NaN;
      return f.n / f.d;
    },

    numericEqual(a, b, expectedHint) {
      let eps = 1e-9;

      if (typeof expectedHint === "string" && expectedHint.includes(".")) {
        const k = (expectedHint.split(".")[1] || "").length;
        eps = Math.pow(10, -(k + 1)) * 5;
      }

      return Math.abs(a - b) <= eps;
    },

    unwrapPair(s, open, close) {
      s = String(s || "").trim();
      if (!s.startsWith(open) || !s.endsWith(close)) return null;

      let depth = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === open) depth++;
        if (ch === close) depth--;

        if (depth === 0 && i < s.length - 1) {
          return null;
        }
      }

      return s.slice(1, -1);
    },

    splitTopLevel(s) {
      const out = [];
      let cur = "";
      let par = 0;
      let sq = 0;
      let br = 0;

      for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (ch === "(") par++;
        else if (ch === ")") par--;
        else if (ch === "[") sq++;
        else if (ch === "]") sq--;
        else if (ch === "{") br++;
        else if (ch === "}") br--;

        if ((ch === "," || ch === ";") && par === 0 && sq === 0 && br === 0) {
          out.push(cur.trim());
          cur = "";
          continue;
        }

        cur += ch;
      }

      if (cur.trim() || out.length) out.push(cur.trim());
      return out.filter(Boolean);
    },

    normalizeTextForCompare(s) {
      return U.canon(s)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }
  };

  function decimalStringToFraction(str) {
    str = U.canon(str);

    const sign = str.startsWith("-") ? -1 : 1;
    if (sign < 0) str = str.slice(1);

    if (!str.includes(".")) {
      return U.makeFrac(sign * parseInt(str || "0", 10), 1);
    }

    const [ip, fp] = str.split(".");
    const den = Math.pow(10, fp.length);
    const num = parseInt((ip || "0") + fp, 10);

    return U.reduceFrac(U.makeFrac(sign * num, den));
  }

  function evalMathExpr(raw) {
    let s = U.canon(raw).toLowerCase();
    s = s.replace(/\s+/g, "");

    s = s.replace(/√\(/g, "sqrt(");
    s = s.replace(/√([0-9.]+|pi|\([^)]+\))/g, "sqrt($1)");

    s = s.replace(/(\d|\))(?=(pi|sqrt|abs|\())/g, "$1*");
    s = s.replace(/(pi)(?=\d|\()/g, "$1*");
    s = s.replace(/(\))(?=\d|pi|sqrt|abs)/g, "$1*");

    s = s.replace(/\^/g, "**");

    if (!/^[0-9+\-*/().a-z*]*$/i.test(s)) return NaN;

    const stripped = s.replace(/pi|sqrt|abs/g, "");
    if (/[a-z]/i.test(stripped)) return NaN;

    s = s
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\bsqrt\(/g, "Math.sqrt(")
      .replace(/\babs\(/g, "Math.abs(");

    try {
      const value = Function(`"use strict"; return (${s});`)();
      return Number.isFinite(value) ? value : NaN;
    } catch {
      return NaN;
    }
  }

  function tokenToNumber(tok) {
    if (!tok) return NaN;

    if (tok.kind === "fraction") return U.fracToNumber(tok.f);
    if (tok.kind === "integer") return Number(tok.num);
    if (tok.kind === "decimal") return Number(tok.num);
    if (tok.kind === "expression") return Number(tok.num);

    return NaN;
  }

  function isNumericToken(tok) {
    return ["fraction", "integer", "decimal", "expression"].includes(tok?.kind);
  }

  function parseSingleValue(raw) {
    const before = U.stripVariablePrefix(U.canon(raw));
    const noUnits = U.stripUnits(before);
    let s = U.normalizeNumericComma(noUnits);

    const hadUnits = before !== noUnits;

    if (!s) return { kind: "empty", raw: s, hadUnits };

    let m = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      const sign = m[1].startsWith("-") ? -1 : 1;
      const A = Math.abs(parseInt(m[1], 10));
      const b = parseInt(m[2], 10);
      const c = parseInt(m[3], 10);

      if (c === 0) return { kind: "nan", raw: s, hadUnits };

      const f = U.reduceFrac(U.makeFrac(sign * (A * c + b), c));

      return {
        kind: "fraction",
        f,
        raw: s,
        reducible: false,
        hadUnits
      };
    }

    m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);

      if (b === 0) return { kind: "nan", raw: s, hadUnits };

      const original = U.makeFrac(a, b);
      const reduced = U.reduceFrac(original);

      return {
        kind: "fraction",
        f: reduced,
        raw: s,
        reducible: !(original.n === reduced.n && original.d === reduced.d),
        hadUnits
      };
    }

    if (/^[-+]?\d*(?:\.\d+)?$/.test(s)) {
      const f = decimalStringToFraction(s);

      return {
        kind: s.includes(".") ? "decimal" : "integer",
        f,
        num: U.fracToNumber(f),
        raw: s,
        hadUnits
      };
    }

    const val = evalMathExpr(s);
    if (Number.isFinite(val)) {
      return {
        kind: "expression",
        num: val,
        raw: s,
        hadUnits
      };
    }

    return { kind: "text", raw: s, hadUnits };
  }

  function parseStructured(raw, opts = {}) {
    const forceCollection = !!opts.forceCollection;

    let s = U.stripVariablePrefix(U.stripUnits(U.canon(raw)));
    if (!s) return { kind: "empty", raw: s };

    if (/^±/.test(s)) {
      const inner = parseSingleValue(s.slice(1));
      const n = tokenToNumber(inner);

      if (!Number.isFinite(n)) return { kind: "text", raw: s };

      return {
        kind: "set",
        raw: s,
        items: [
          { kind: "expression", num: -n, raw: String(-n) },
          { kind: "expression", num: n, raw: String(n) }
        ]
      };
    }

    if (
      (s.startsWith("[") || s.startsWith("(")) &&
      (s.endsWith("]") || s.endsWith(")"))
    ) {
      const inner = s.slice(1, -1);
      const parts = U.splitTopLevel(inner);

      if (parts.length === 2) {
        return {
          kind: "interval",
          raw: s,
          leftClosed: s.startsWith("["),
          rightClosed: s.endsWith("]"),
          left: parseSingleValue(parts[0]),
          right: parseSingleValue(parts[1])
        };
      }
    }

    const innerSet = U.unwrapPair(s, "{", "}");
    if (innerSet !== null) {
      const parts = U.splitTopLevel(innerSet);

      return {
        kind: "set",
        raw: s,
        items: parts.map(parseSingleValue)
      };
    }

    if (!forceCollection && /^[+-]?\d+,\d+$/.test(s)) {
      return parseSingleValue(s);
    }

    const top = U.splitTopLevel(s);
    if (top.length > 1) {
      return {
        kind: "list",
        raw: s,
        items: top.map(parseSingleValue)
      };
    }

    return parseSingleValue(s);
  }

  function inferPolicy(problem = {}, expectedRaw = "") {
    const policy = {
      type: "auto",
      simplest: false,
      integer: false
    };

    const st =
      String(problem?.statement_ro || "") +
      " " +
      String(problem?.statement_en || "") +
      " " +
      String(expectedRaw || "");

    const s = st.toLowerCase();

    if (/ireductibil|ireductibilă|simplest|reduced/.test(s)) {
      policy.simplest = true;
    }

    if (/\ba\s*\/\s*b\b/.test(s)) {
      policy.type = "fraction";
    }

    if (/(număr\s*întreg|numar\s*intreg|integer\s*only|integer)/i.test(s)) {
      policy.integer = true;
    }

    if (/(mulțime|multime|set)/i.test(s)) {
      policy.type = "set";
    }

    if (/(interval)/i.test(s)) {
      policy.type = "interval";
    }

    if (typeof problem?.answer === "string" && /\d\s*\/\s*\d/.test(problem.answer)) {
      if (policy.type === "auto") {
        policy.type = "fraction";
      }
    }

    return policy;
  }

  function comparePrimitive(userTok, expTok, policy, expectedRaw) {
    if (isNumericToken(userTok) && isNumericToken(expTok)) {
      const userNum = tokenToNumber(userTok);
      const expNum = tokenToNumber(expTok);

      if (policy.integer) {
        if (!Number.isInteger(userNum)) {
          return { ok: false, reason: msg("need_integer") };
        }

        if (U.numericEqual(userNum, expNum, expectedRaw)) {
          return {
            ok: true,
            note: userTok.hadUnits ? msg("drop_units") : null
          };
        }

        return { ok: false, reason: msg("not_equal") };
      }

      if (policy.type === "fraction") {
        if (userTok.kind !== "fraction") {
          if (U.numericEqual(userNum, expNum, expectedRaw)) {
            return { ok: true, note: msg("prefer_fraction") };
          }

          return { ok: false, reason: msg("not_equal") };
        }

        if (!U.numericEqual(userNum, expNum, expectedRaw)) {
          if (Math.abs(userNum - expNum) <= 1e-3) {
            return { ok: false, reason: msg("rounding") };
          }
          return { ok: false, reason: msg("not_equal") };
        }

        if (policy.simplest && userTok.reducible) {
          return { ok: false, reason: msg("need_simplest") };
        }

        return {
          ok: true,
          note: userTok.hadUnits ? msg("drop_units") : null
        };
      }

      if (U.numericEqual(userNum, expNum, expectedRaw)) {
        if (policy.simplest && userTok.kind === "fraction" && userTok.reducible) {
          return { ok: true, note: msg("could_reduce") };
        }

        return {
          ok: true,
          note: userTok.hadUnits ? msg("drop_units") : null
        };
      }

      if (Math.abs(userNum - expNum) <= 1e-3) {
        return { ok: false, reason: msg("rounding") };
      }

      return { ok: false, reason: msg("not_equal") };
    }

    const a = U.normalizeTextForCompare(userTok?.raw || "");
    const b = U.normalizeTextForCompare(expTok?.raw || "");

    return a === b
      ? { ok: true, note: null }
      : { ok: false, reason: msg("not_equal") };
  }

  function compareCollections(userItems, expItems, unordered, policy, expectedRaw) {
    if (!Array.isArray(userItems) || !Array.isArray(expItems)) {
      return { ok: false, reason: msg("unparsable") };
    }

    if (userItems.length !== expItems.length) {
      return { ok: false, reason: msg("list_size") };
    }

    const expAllNumeric = expItems.every(isNumericToken);
    const userAllNumeric = userItems.every(isNumericToken);

    if (expAllNumeric && userAllNumeric) {
      const ua = userItems.map(tokenToNumber);
      const ea = expItems.map(tokenToNumber);

      if (ua.some((x) => !Number.isFinite(x)) || ea.some((x) => !Number.isFinite(x))) {
        return { ok: false, reason: msg("unparsable") };
      }

      if (unordered) {
        ua.sort((a, b) => a - b);
        ea.sort((a, b) => a - b);
      }

      for (let i = 0; i < ua.length; i++) {
        if (!U.numericEqual(ua[i], ea[i], expectedRaw)) {
          return {
            ok: false,
            reason: unordered ? msg("set_mismatch") : msg("not_equal")
          };
        }
      }

      return { ok: true, note: null };
    }

    const ua = userItems.map((x) => U.normalizeTextForCompare(x?.raw || ""));
    const ea = expItems.map((x) => U.normalizeTextForCompare(x?.raw || ""));

    if (unordered) {
      ua.sort();
      ea.sort();
    }

    for (let i = 0; i < ua.length; i++) {
      if (ua[i] !== ea[i]) {
        return {
          ok: false,
          reason: unordered ? msg("set_mismatch") : msg("not_equal")
        };
      }
    }

    return { ok: true, note: null };
  }

  function compareIntervals(userTok, expTok, policy, expectedRaw) {
    if (!userTok || userTok.kind !== "interval") {
      return { ok: false, reason: msg("interval_mismatch") };
    }

    if (
      !!userTok.leftClosed !== !!expTok.leftClosed ||
      !!userTok.rightClosed !== !!expTok.rightClosed
    ) {
      return { ok: false, reason: msg("interval_mismatch") };
    }

    const leftCmp = comparePrimitive(userTok.left, expTok.left, policy, expectedRaw);
    if (!leftCmp.ok) return { ok: false, reason: msg("interval_mismatch") };

    const rightCmp = comparePrimitive(userTok.right, expTok.right, policy, expectedRaw);
    if (!rightCmp.ok) return { ok: false, reason: msg("interval_mismatch") };

    return { ok: true, note: null };
  }

  function compareTokens(userTok, expTok, policy, expectedRaw) {
    if (expTok.kind === "interval") {
      return compareIntervals(userTok, expTok, policy, expectedRaw);
    }

    if (expTok.kind === "set") {
      let userCollection = userTok;

      if (
        userTok.kind !== "set" &&
        userTok.kind !== "list" &&
        /[,;]/.test(String(userTok.raw || ""))
      ) {
        userCollection = parseStructured(userTok.raw, { forceCollection: true });
      }

      if (userCollection.kind !== "set" && userCollection.kind !== "list") {
        return { ok: false, reason: msg("set_mismatch") };
      }

      return compareCollections(
        userCollection.items,
        expTok.items,
        true,
        policy,
        expectedRaw
      );
    }

    if (expTok.kind === "list") {
      let userCollection = userTok;

      if (
        userTok.kind !== "set" &&
        userTok.kind !== "list" &&
        /[,;]/.test(String(userTok.raw || ""))
      ) {
        userCollection = parseStructured(userTok.raw, { forceCollection: true });
      }

      if (userCollection.kind !== "list") {
        return { ok: false, reason: msg("expect_list") };
      }

      return compareCollections(
        userCollection.items,
        expTok.items,
        false,
        policy,
        expectedRaw
      );
    }

    return comparePrimitive(userTok, expTok, policy, expectedRaw);
  }

  function check({ user, expected, problem }) {
    const expectedRaw = String(expected ?? "");
    const policy = inferPolicy(problem || {}, expectedRaw);

    const normalizedExpected = parseStructured(expectedRaw);
    const normalizedUser = parseStructured(String(user ?? ""));

    const res = compareTokens(
      normalizedUser,
      normalizedExpected,
      policy,
      expectedRaw
    );

    return {
      ok: !!res.ok,
      message: res.ok ? res.note || null : res.reason,
      normalizedUser,
      normalizedExpected,
      policy
    };
  }

  window.SmartAnswer = {
    check,
    _U: U,
    _parseStructured: parseStructured,
    _parseSingleValue: parseSingleValue
  };
})();

  /* ===== PATCH pentru buildProblemBlock() ===== */
  window.defineCheckPatch = function(prefix, P, wrap){
    return function(){
      const inEl = wrap.querySelector(`#${prefix}-ans`);
      const resEl = wrap.querySelector(`#${prefix}-res`);
      const raw = (inEl.value||'');

      const result = SmartAnswer.check({ user: raw, expected: P.answer, problem: P });

      if(result.ok){
        const msg = (typeof LANG!=="undefined" && LANG==='ro') ? '🎉 Corect!' : '🎉 Correct!';
        const note = result.message ? ` <span class="legend">(${result.message})</span>` : '';
        resEl.innerHTML = `<span class="ok">${msg}${note}</span>`;
        if(typeof solvedSet!=="undefined" && !solvedSet.has(P.id)){ solvedSet.add(P.id); if(typeof saveSets==="function") saveSets(); if(typeof updateCounters==="function") updateCounters(); }
        if(typeof renderCards==="function") renderCards();
      } else {
        const bad = (typeof LANG!=="undefined" && LANG==='ro') ? '❌ Mai încearcă.' : '❌ Try again.';
        const hint = result.message ? ` <span class="legend">${result.message}</span>` : '';
        resEl.innerHTML = `<span class="bad">${bad}${hint}</span>`;
        if(typeof attempts!=="undefined"){
          const state = attempts[P.id] || { tries:[], revealStart:null, revealed:false, resetAt:null };
          state.tries.push({ v: raw, ts: Date.now() }); attempts[P.id]=state;
          if(typeof saveAttempts==="function") saveAttempts();
        }
      }
    }
  };


  function buildProblemBlock(P, prefix, locked){
    const L = DATA.lessons.find(x=>x.id===P.lessonId);
    const st = (LANG==="ro"? P.statement_ro : P.statement_en) || (P.statement_ro||"");
    const title=(LANG==="ro"? (P.title_ro||P.title_en):(P.title_en||P.title_ro));
    const {h1,h2}=getHints(P);

    const state = attempts[P.id] || { tries:[], revealStart:null, revealed:false, resetAt:null };
    attempts[P.id]=state; saveAttempts();

    const triesSinceReset = ()=> {
      const cut = state.resetAt||0;
      return (state.tries||[]).filter(t=>(t.ts||0)>cut);
    };

    const wrap=document.createElement("div"); wrap.className="problem";
    wrap.innerHTML=
      `<div class="title" style="font-weight:800;margin-bottom:6px">🧩 ${title}</div>
      <div class="legend" style="margin-bottom:8px">
        ${(LANG==="ro"?"Din lecția: ":"From lesson: ")}<b>${(LANG==="ro"?L?.title_ro:L?.title_en)||''}</b>
        &nbsp;•&nbsp;<span class="stars">${P.difficulty===0?"0":"★".repeat(P.difficulty)}</span>
      </div>
      <div style="margin:8px 0">${st}</div>
      <div class="checkrow">
        <input id="${prefix}-ans" ${locked?'disabled':''} placeholder="${LANG==='ro'?'Răspuns…':'Answer…'}" />
        <button class="btn" id="${prefix}-btn" ${locked?'disabled':''}>✅ ${LANG==='ro'?'Verifică':'Check'}</button>
        <button class="btn" id="${prefix}-reset" ${locked?'disabled':''} title="Resetează UI-ul, păstrând istoricul">♻️ Reset</button>
        <div id="${prefix}-res"></div>
      </div>

      <div class="mh-live-preview-wrap">
        <div class="legend">Preview live</div>
        <div class="mh-live-preview-box" id="${prefix}-preview"></div>
      </div>

      <div class="mh-math-input-host" id="${prefix}-mathtools"></div>

      <details class="collapsible" id="${prefix}-attemptsWrap">
        <summary>⛔ ${LANG==='ro'?'Răspunsuri greșite':'Wrong answers'} (<span id="${prefix}-cnt">0</span>)</summary>
        <ul class="attempts" id="${prefix}-list"></ul>
      </details>

      <div class="hints" id="${prefix}-hints"></div>
      <div class="reveal" id="${prefix}-reveal"></div>`;

    const mathInput = wrap.querySelector(`#${prefix}-ans`);
    const mathTools = wrap.querySelector(`#${prefix}-mathtools`);
    const mathPreview = wrap.querySelector(`#${prefix}-preview`);

    mhBindMathInputEnhancements(mathInput, mathPreview);
    mhAttachMathToolbar(mathInput, mathTools);

    function paintAttempts(openOnNew=false){
      const ul=wrap.querySelector(`#${prefix}-list`); ul.innerHTML="";
      wrap.querySelector(`#${prefix}-cnt`).textContent = state.tries.length;
      state.tries.forEach((t,i)=>{
        const d=new Date(t.ts); const hh=("0"+d.getHours()).slice(-2), mm=("0"+d.getMinutes()).slice(-2);
        const li=document.createElement("li");
        li.innerHTML=`❌ <b>#${i+1}</b> (${hh}:${mm}): <code>${esc(t.v)}</code>`;
        ul.appendChild(li);
      });
      if(openOnNew && state.tries.length>0){ wrap.querySelector(`#${prefix}-attemptsWrap`).open=true; }
    }

    function paintHints(){
      const hb=wrap.querySelector(`#${prefix}-hints`); hb.innerHTML="";
      const k = triesSinceReset().length;
      if(k>=2){
        const det=document.createElement("div"); det.className="hint";
        det.innerHTML=`<details><summary>💡 Hint 1 (opțional)</summary><div style="margin-top:6px">${h1}</div></details>`;
        hb.appendChild(det);
      }
      if(k>=4){
        const det=document.createElement("div"); det.className="hint";
        det.innerHTML=`<details><summary>💡 Hint 2 (opțional)</summary><div style="margin-top:6px">${h2}</div></details>`;
        hb.appendChild(det);
      }
    }

    let revealTimer=null;
    function stopRevealTimer(){ if(revealTimer){ clearInterval(revealTimer); revealTimer=null; } }

    function paintReveal(){
      const rb=wrap.querySelector(`#${prefix}-reveal`); rb.innerHTML="";
      const k = triesSinceReset().length; 
      if(k>=5){
        const REVEAL_WAIT=30;
        let left = REVEAL_WAIT;
        if(state.revealStart){
          const passed = Math.floor((Date.now()-state.revealStart)/1000);
          left = Math.max(0, REVEAL_WAIT - passed);
        } else {
          state.revealStart=Date.now(); saveAttempts();
        }
        const btn = document.createElement("button"); btn.className="reveal-btn";
        btn.id = `${prefix}-revealBtn`;
        if(state.revealed){
          btn.disabled=true; btn.textContent = `${(LANG==='ro'?'Răspuns:':'Answer:')} ${P.answer}`;
        }else{
          btn.disabled = left>0;
          btn.textContent = left>0 ? `🔓 ${(LANG==='ro'?'Arată răspunsul':'Show answer')} (${left}s)` : `🔓 ${(LANG==='ro'?'Arată răspunsul':'Show answer')}`;
          btn.onclick=()=>{ state.revealed=true; saveAttempts(); paintReveal(); };
          stopRevealTimer();
          revealTimer=setInterval(()=>{
            left--; if(left<0) left=0;
            if(left===0){
              btn.disabled=false; btn.textContent=`🔓 ${(LANG==='ro'?'Arată răspunsul':'Show answer')}`;
              stopRevealTimer();
            }else{
              btn.textContent=`🔓 ${(LANG==='ro'?'Arată răspunsul':'Show answer')} (${left}s)`;
            }
          },1000);
        }
        rb.appendChild(btn);
        if(state.revealed){
          const ans = document.createElement("div"); ans.style.marginTop="6px";
          ans.innerHTML = `✅ ${(LANG==='ro'?'Răspuns corect:':'Correct answer:')} <code>${P.answer}</code>`;
          rb.appendChild(ans);
        }
      } else {
        stopRevealTimer();
      }
    }

      // --- CHECK (verificare) ---
    (function initCheck(){
      const doCheck = window.defineCheckPatch(prefix, P, wrap);
      const ansEl = wrap.querySelector(`#${prefix}-ans`);
      const btnEl = wrap.querySelector(`#${prefix}-btn`);
      btnEl.onclick = () => {
        doCheck();
        paintAttempts(true);
        paintHints();
        paintReveal();
      };
      ansEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          doCheck();
          paintAttempts(true);
          paintHints();
          paintReveal();
        }
      });
    })();

    // --- RESET UI ---
    wrap.querySelector(`#${prefix}-reset`).onclick = () => {
      state.resetAt = Date.now();
      saveAttempts();

      // curățăm câmpul și rezultatul
      wrap.querySelector(`#${prefix}-ans`).value = "";
      wrap.querySelector(`#${prefix}-res`).innerHTML = "";

      // redesenăm
      paintAttempts(false);
      paintHints();
      paintReveal();
    };

    // --- la montare: desenează starea existentă ---
    paintAttempts(false);
    paintHints();
    paintReveal();

    return wrap;
  }

  /* ===== Exam viewer ===== */
  let examTimer=null;
  function fmtHMSms(msLeft){
    let s = Math.max(0, Math.floor(msLeft/1000));
    const h=Math.floor(s/3600); s%=3600;
    const m=Math.floor(s/60); s%=60;
    const hh = h>0? (String(h).padStart(2,'0')+':') : '';
    return `${hh}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

function openExam(exam){

  console.log("OPEN EXAM DEBUG", {
    requestedExamId: exam?.id,
    activeLock: getActiveExamLock(),
    isOtherLocked: isOtherExamLocked(exam?.id)
  });

  if (isGuestContentLocked()) {
    showGuestContentMessage();
    return;
  }

  if (isOtherExamLocked(exam.id)) {
    showGlobalExamLockMessage();
    return;
  }

  const title = (LANG === 'ro' ? exam.title_ro : exam.title_en) || exam.title_ro || exam.title_en || exam.id;
  const totalPts = computeExamTotal(exam) || 100;

  document.getElementById("viewTitle").textContent = title;
  document.getElementById("viewMeta").textContent = `🗓 ${exam.year} • ${exam.type} • 🏁 ${computeExamScore(exam)}/${totalPts}`;

  const content = document.getElementById("viewContent");
  content.innerHTML = "";

  const items = getExamRenderableItems(exam);

  const top = document.createElement("div");
  top.className = "examTop";
  top.innerHTML = `
    <span class="examBadge">⏱ ${LANG === 'ro' ? 'Alege timpul' : 'Choose time'}</span>
    <select class="select" id="examHours">
      <option value="1">1h</option>
      <option value="2">2h</option>
      <option value="3">3h</option>
      <option value="4">4h</option>
      <option value="5">5h</option>
    </select>

    <button class="btn" id="startExam">🚀 ${LANG === 'ro' ? 'Start' : 'Start'}</button>
    <span class="examBadge examTimer" id="examLeft" style="display:none">--:--</span>

    <div class="progressRow">
      <span class="legend">Progres către prag (${PASS_THRESHOLD}p):</span>
      <div class="progressBar"><i id="examBar"></i></div>
      <span id="examProg" class="legend">0/${PASS_THRESHOLD}</span>
    </div>

    <div class="legend">
      ${(LANG === "ro" ? "Itemi examen" : "Exam items")}: <b>${items.length}</b>
      ${exam.credit_html ? `• ${exam.credit_html}` : ""}
    </div>
  `;
  content.appendChild(top);

  renderAdminExamForceStopButton(exam, top);

  const list = document.createElement("div");
  content.appendChild(list);

  setLessonOnlyActionsVisible(false);

  const hoursSel = document.getElementById("examHours");
  const startBtn = document.getElementById("startExam");
  const leftEl = document.getElementById("examLeft");

  let examFinished = false;

  function setLocked(lock){
    list.querySelectorAll("input, button, select, textarea").forEach(el => {
      el.disabled = !!lock;
    });
  }

  function renderHiddenUntilStart(){
    list.innerHTML = `
      <div class="problem">
        <div class="title">🔒 ${LANG === "ro" ? "Examen pregătit" : "Exam ready"}</div>
        <div class="legend" style="margin-top:8px;">
          ${LANG === "ro"
            ? "Itemii examenului sunt ascunși până când apeși Start."
            : "Exam items remain hidden until you press Start."}
        </div>
      </div>
    `;
  }

  function renderExamItems(locked){
    list.innerHTML = "";

    if (examHasStructuredItems(exam)) {
      items.forEach((item, index) => {
        const block = buildStructuredExamItemBlock(
          exam,
          item,
          index,
          locked,
          updateExamProgress
        );
        list.appendChild(block);
      });
    } else {
      items.forEach((item) => {
        const legacyProblem = DATA.problems.find(p => p.id === (item.source_problem_id || item.id));
        if (!legacyProblem) return;

        const block = buildProblemBlock(
          legacyProblem,
          "ex-" + legacyProblem.id,
          locked
        );
        list.appendChild(block);
      });
    }

    MH_render(list);
  }

  function updateHeaderMeta(){
    const scoreNow = computeExamScore(exam);
    document.getElementById("viewMeta").textContent =
      `🗓 ${exam.year} • ${exam.type} • 🏁 ${scoreNow}/${totalPts}`;
  }

  async function finishExamSession(passedNow, messageText){
    if (examFinished) return;
    examFinished = true;

    const finalScore = computeExamScore(exam);

    await saveExamAttemptResultSafe(exam.id, finalScore, passedNow);

    if (passedNow && !examsPassedSet.has(exam.id)) {
      examsPassedSet.add(exam.id);
      saveSets();
      updateCounters();
    }

    if (examTimer) {
      clearInterval(examTimer);
      examTimer = null;
    }

    clearExamState(exam.id);
    clearActiveExamLock();
    refreshExamLockUi();

    setLocked(true);
    updateHeaderMeta();

    if (leftEl) {
      leftEl.style.display = "inline-block";
      leftEl.textContent = messageText;
    }

    renderCards();
  }

  function updateExamProgress(){
    const score = computeExamScore(exam);
    const bar = document.getElementById("examBar");
    const prog = document.getElementById("examProg");

    if (prog) prog.textContent = `${Math.min(score, PASS_THRESHOLD)}/${PASS_THRESHOLD}`;
    if (bar) {
      bar.style.width = `${Math.min(100, Math.round(100 * score / PASS_THRESHOLD))}%`;
    }

    updateHeaderMeta();

    if (score >= PASS_THRESHOLD) {
      void finishExamSession(
        true,
        (LANG === "ro") ? "✅ Ai trecut!" : "✅ Passed!"
      );
    }
  }

  const st = getExamState(exam.id);

  if (st && st.endsAt && Date.now() >= st.endsAt) {
    clearExamState(exam.id);
    clearActiveExamLock();
    refreshExamLockUi();

    void saveExamAttemptResultSafe(exam.id, computeExamScore(exam), false);
  }

  if (st && st.endsAt && Date.now() < st.endsAt) {
    renderExamItems(false);
    setLocked(false);

    hoursSel.disabled = true;
    startBtn.disabled = true;

    setActiveExamLock({
      examId: exam.id,
      endsAt: st.endsAt
    });
    refreshExamLockUi();

    const tick = () => {
      const msLeft = st.endsAt - Date.now();

      leftEl.style.display = "inline-block";
      leftEl.textContent = fmtHMSms(msLeft);

      updateExamProgress();

      if (msLeft <= 0) {
        void finishExamSession(
          false,
          (LANG === "ro") ? "⛔ Timp expirat" : "⛔ Time up"
        );
      }
    };

    tick();
    examTimer = setInterval(tick, 1000);
  } else {
    renderHiddenUntilStart();

    hoursSel.value = String(exam.defaultHours || 2);

    startBtn.onclick = async () => {
      const hours = Number(hoursSel.value || 2);
      const endsAt = Date.now() + hours * 3600 * 1000;

      try {
        await recordExamAttemptStart(exam.id);
      } catch (err) {
        console.error("recordExamAttemptStart error:", err);
      }

      if (examHasStructuredItems(exam)) {
        clearExamItemResults(exam.id);
      }

      setExamState(exam.id, { endsAt });
      setActiveExamLock({
        examId: exam.id,
        endsAt
      });
      refreshExamLockUi();

      renderExamItems(false);
      setLocked(false);

      hoursSel.disabled = true;
      startBtn.disabled = true;

      const tick = () => {
        const msLeft = endsAt - Date.now();

        leftEl.style.display = "inline-block";
        leftEl.textContent = fmtHMSms(msLeft);

        updateExamProgress();

        if (msLeft <= 0) {
          void finishExamSession(
            false,
            (LANG === "ro") ? "⛔ Timp expirat" : "⛔ Time up"
          );
        }
      };

      tick();
      examTimer = setInterval(tick, 1000);
    };
  }

  updateExamProgress();
  document.getElementById("drawer").classList.add("open");
}

  /* ===== Inputs & Tabs ===== */
  document.getElementById("q").addEventListener("input", e=>{ filter.q=e.target.value; page=1; renderCards(); drawFilterBar(); });
  document.getElementById("loadMore").onclick=()=>{ page++; renderCards(); };
  const minD=document.getElementById("minDiff"), maxD=document.getElementById("maxDiff");
  minD.onchange=()=>{ let v=Math.max(0,Math.min(5,Number(minD.value)||0)); if(v>maxD.value) maxD.value=v; minD.value=v; filter.minDiff=v; page=1; renderCards(); };
  maxD.onchange=()=>{ let v=Math.max(0,Math.min(5,Number(maxD.value)||5)); if(v<minD.value) minD.value=v; maxD.value=v; filter.maxDiff=v; page=1; renderCards(); };

  function selectTab(nextTab = TAB){
    if (hasActiveExamLock() && nextTab !== "exams") {
      TAB = "exams";
      showGlobalExamLockMessage();
    } else {
      TAB = nextTab;
    }

    document.querySelectorAll(".tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === TAB)
    );

    document
      .querySelector(`.tab[data-tab="${TAB}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

    page = 1;
    renderCards();
    drawFilterBar();

    document.getElementById("goProblemsBtn").style.display = "none";
    document.getElementById("problemSortBox").style.display = (TAB === "problems") ? "flex" : "none";

    refreshExamLockUi();
  }

  document.querySelectorAll(".tab").forEach(tb => {
    tb.onclick = () => selectTab(tb.dataset.tab);
  });
  /* sort select */
  document.getElementById("problemSort").onchange=(e)=>{ filter.problemSort=e.target.value; page=1; renderCards(); };

  /* wire butoane olimpiada */
  function wireOlympControls(){
    const btn = document.getElementById("olympOnlyBtn");
    const badge = document.getElementById("olympOnlyState");
    const levelSel = document.getElementById("olympLevel");

    if(btn && badge){
      btn.onclick = ()=>{
        filter.olympOnly = !filter.olympOnly;
        badge.textContent = filter.olympOnly ? "ON" : "OFF";
        page=1; renderCards(); drawFilterBar();
      };
    }
    if(levelSel){
      levelSel.onchange = (e)=>{
        filter.olympLevel = e.target.value || "";
        page=1; renderCards(); drawFilterBar();
      };
    }
  }

  /* ===== Modal legendă ===== */
  const modal=document.getElementById("modal");
  document.getElementById("infoBtn").onclick = () => {
    const ui = MAIN_UI_TEXT[LANG] || MAIN_UI_TEXT.ro;

    document.getElementById("modalTitle").textContent = ui.info_modal.title;
    document.getElementById("modalBody").innerHTML = ui.info_modal.body;
    modal.classList.add("open");
  };

  document.getElementById("closeModal").onclick=()=> modal.classList.remove("open");
  modal.addEventListener("click",(e)=>{ if(e.target.id==="modal") modal.classList.remove("open"); });

  /* ===== Progress modals ===== */
  document.getElementById("openSolved").onclick=()=>{
    const ids=[...solvedSet];
    const items=DATA.problems.filter(p=>ids.includes(p.id))
      .map(p=>`<li>🧩 ${(LANG==='ro'?p.title_ro:p.title_en)} — <i>${esc(p.source||'')}</i></li>`)
      .join('') || "<li>(gol)</li>";
    document.getElementById("modalTitle").textContent="✅ Probleme rezolvate";
    document.getElementById("modalBody").innerHTML=`<ul>${items}</ul>`;
    modal.classList.add("open");
  };

  document.getElementById("openLearned").onclick=()=>{
    const ids=[...learnedSet];
    const items=DATA.lessons.filter(l=>ids.includes(l.id))
      .map(l=>`<li>📘 ${(LANG==='ro'?l.title_ro:l.title_en)} — <i>${esc(l.grade||'')}</i></li>`)
      .join('') || "<li>(gol)</li>";
    document.getElementById("modalTitle").textContent="📘 Lecții învățate";
    document.getElementById("modalBody").innerHTML=`<ul>${items}</ul>`;
    modal.classList.add("open");
  };

  document.getElementById("openPassed").onclick=()=>{
    const ids=[...examsPassedSet];
    const items=EXAMS.filter(ex=>ids.includes(ex.id))
      .map(ex=>`<li>🏆 ${(LANG==='ro'?ex.title_ro:ex.title_en)} — <i>${ex.year} • ${ex.type}</i></li>`)
      .join('') || "<li>(gol)</li>";
    document.getElementById("modalTitle").textContent="🏆 Examene promovate";
    document.getElementById("modalBody").innerHTML=`<ul>${items}</ul>`;
    modal.classList.add("open");
  };

  // ===== PARTICULE PE FUNDAL =====
  function initParticles(){
  const canvas = document.createElement("canvas");
  canvas.id = "mhParticles";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = window.innerWidth;
  let H = window.innerHeight;

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const N = 70;
  const particles = [];
  for (let i=0;i<N;i++){
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4
    });
  }

  function step(){
    ctx.clearRect(0,0,W,H);
    const isLight = document.body.classList.contains("light");
    const color = isLight ? [15,23,42] : [148,163,184];

    for (const p of particles){
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40;
      if (p.y > H + 40) p.y = -40;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.45)`;
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI*2);
      ctx.fill();
    }

    for (let i=0;i<N;i++){
      for (let j=i+1;j<N;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 120*120){
          const alpha = 1 - (d2/(120*120));
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.15*alpha})`;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  }

  document.addEventListener("DOMContentLoaded", initParticles);

  /* ===== ABOUT ME  ===== */
  (function(){
  const aboutBtn   = document.getElementById("aboutBtn");
  const aboutModal = document.getElementById("aboutModal");
  const aboutClose = document.getElementById("aboutCloseBtn");

  if (!aboutBtn || !aboutModal) return;

  aboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("open");
  });

  if (aboutClose) {
    aboutClose.addEventListener("click", () => {
      aboutModal.classList.remove("open");
    });
  }

  aboutModal.addEventListener("click", (e) => {
    if (e.target === aboutModal) {
      aboutModal.classList.remove("open");
    }
  });

  const bullets = aboutModal.querySelectorAll(".story-bullet");
  bullets.forEach(b => {
    b.addEventListener("click", () => {
      bullets.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const targetSel = b.getAttribute("data-target");
      if (!targetSel) return;
      const sec = aboutModal.querySelector(targetSel);
      if (sec) {
        sec.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    });
  });
  })();

    /* ===== MH ROADMAP + BOSS + RADAR LOGIC + VAI DE CAPUL MEU ===== */

  function mhScrollToMain(){
    const wrap = document.querySelector(".wrap");
    if (wrap){
      wrap.scrollIntoView({behavior:"smooth", block:"start"});
    }
  }

  function mhSafeRender(){
    if (typeof renderCards === "function") renderCards();
    if (typeof drawFilterBar === "function") drawFilterBar();
  }

  function mhChangeTab(tabName){
    const tabEl = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (tabEl) tabEl.click();
  }

  function mhInitRoadmap(){
    const cards = document.querySelectorAll(".mh-roadmap-card");

    cards.forEach(card => {
      card.addEventListener("click", () => {
        const tab  = card.dataset.mhTab || "";
        const tag  = card.dataset.mhTag || "";
        const chip = card.dataset.mhChip || "";

        if (tab === "lessons" && tag === "V")   return mhApplyHomePreset("roadmap-v-viii");
        if (tab === "exams"   && tag === "EN")  return mhApplyHomePreset("roadmap-en");
        if (tab === "exams"   && tag === "BAC") return mhApplyHomePreset("roadmap-bac");
        if (tab === "problems" && chip === "olymp")   return mhApplyHomePreset("roadmap-olymp");
        if (tab === "research" && chip === "research") return mhApplyHomePreset("roadmap-research");
      });
    });

    const resetBtn = document.querySelector(".mh-roadmap-reset");
    if (resetBtn){
      resetBtn.addEventListener("click", () => {
        mhResetContentFilters();
        selectTab("lessons");
        if (typeof mhScrollToMain === "function") mhScrollToMain();
      });
    }
  }

  function mhInitBoss(){
    const btnProblems = document.getElementById("mhBossProblemsBtn");
    const btnExams    = document.getElementById("mhBossExamsBtn");

    if (btnProblems){
      btnProblems.onclick = () => mhApplyHomePreset("boss-mixed");
    }

    if (btnExams){
      btnExams.onclick = () => mhApplyHomePreset("open-exams");
    }
  }

  function mhInitRadar(){
    const items = document.querySelectorAll(".mh-radar-item");

    items.forEach(item => {
      item.addEventListener("click", () => {
        const tag = item.dataset.mhTag || "";

        if (tag === "algebra")   return mhApplyHomePreset("radar-algebra");
        if (tag === "geometrie") return mhApplyHomePreset("radar-geometrie");
        if (tag === "olymp")     return mhApplyHomePreset("radar-olymp");
        if (tag === "research")  return mhApplyHomePreset("radar-research");
      });
    });

    updateRadarUI();
  }

  function mhComputeRadarBucket(preset){
    if (preset === "research"){
      const lessons = DATA.lessons.filter(L => mhMatchesLessonTopic(L, "research"));
      const done = lessons.filter(L => learnedSet.has(L.id)).length;
      return { done, total: lessons.length };
    }

    const problems = DATA.problems.filter(P =>
      !isExamProblem(P) && mhMatchesProblemTopic(P, preset)
    );
    const done = problems.filter(P => solvedSet.has(P.id)).length;
    return { done, total: problems.length };
  }

  function updateRadarUI(){
    const configs = [
      { preset: "algebra", valueId: "mhRadarAlg" },
      { preset: "geometrie", valueId: "mhRadarGeo" },
      { preset: "olymp", valueId: "mhRadarOlymp" },
      { preset: "research", valueId: "mhRadarRes" }
    ];

    configs.forEach(cfg => {
      const box = document.querySelector(`.mh-radar-item[data-mh-tag="${cfg.preset}"]`);
      const valueEl = document.getElementById(cfg.valueId);
      if (!box || !valueEl) return;

      const bar = box.querySelector(".mh-radar-bar i");
      const stats = mhComputeRadarBucket(cfg.preset);
      const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

      if (bar) bar.style.width = pct + "%";

      if (!stats.total){
        valueEl.textContent = LANG === "ro" ? "în curând" : "soon";
        return;
      }

      valueEl.textContent = `${stats.done}/${stats.total} ${LANG === "ro" ? "făcute" : "done"}`;
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    mhInitRoadmap();
    mhInitBoss();
    mhInitRadar();
  });

  /* === CUB 3D: LEGACY */
  (function(){
  function positionCubeLayer(){
    const layer = document.querySelector(".mh-cube-layer");
    if (!layer) return;

    const w = window.innerWidth || document.documentElement.clientWidth;
    const contentWidth = 1200;     
    const cubeWidth = 260;      
    const minMargin = 24;           

    if (w < contentWidth + cubeWidth + 2*minMargin){
      layer.style.display = "none";
      return;
    }

    const sideMargin = (w - contentWidth) / 2;         
    const rightPx = Math.max(minMargin, sideMargin - cubeWidth - 8);

    layer.style.display = "flex";
    layer.style.right = rightPx + "px";
  }

  function initMathCube(){
    const cube = document.getElementById("mhMathCube");
    if (!cube) return;

    const rotations = [
      { x: 0,  y:   0 },  
      { x: 0,  y:  90 },  
      { x: 0,  y: 180 },  
      { x: 0,  y: -90 },   
      { x:-90, y:   0 }, 
      { x: 90, y:   0 }   
    ];

    let index = 0;

    function applyRotation(){
      const r = rotations[index];
      cube.style.setProperty("--mh-rot-x", r.x + "deg");
      cube.style.setProperty("--mh-rot-y", r.y + "deg");
    }

    cube.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      index = (index + 1) % rotations.length; 
      applyRotation();
    });

    applyRotation();
    positionCubeLayer();
    window.addEventListener("resize", positionCubeLayer);

  
    if (typeof MH_render === "function") {
      MH_render(cube);
    }
  }

  window.addEventListener("load", initMathCube);
  })();

  let MH_AUTH_READY = false;

  supabase.auth.onAuthStateChange((event, session) => {
    console.log("AUTH EVENT =", event, session);

    if (event === "INITIAL_SESSION") {
      MH_AUTH_READY = true;
    }

    setTimeout(() => {
      loadAppProgressFromDb();
    }, 0);
  });
  
  /* ===== BOOT SITE IMPORTANT ===== */
  mhUpdateSidebarStaticTexts();
  mhUpdateToolbarTexts();
  mhUpdateHeaderStaticTexts();

  buildNestedTree();
  buildTagPanel();
  initMobileAside();

  if (hasActiveExamLock()) {
    TAB = "exams";
  }

  renderCards();
  drawFilterBar();
  wireOlympControls();
  wireGlobalExamClickGuards();
  refreshExamLockUi();

  (function setupAboutModalAndBullets(){
    const aboutBtn    = document.getElementById("aboutBtn");
    const aboutModal  = document.getElementById("aboutModal");
    const aboutClose  = document.getElementById("aboutCloseBtn");

    if (!aboutBtn || !aboutModal) return;

    const modalBox = aboutModal.querySelector(".about-box") || aboutModal.querySelector(".box");

    function openAbout(){
      aboutModal.classList.add("open");
    
      if (modalBox) modalBox.scrollTop = 0;
    }
    function closeAbout(){
      aboutModal.classList.remove("open");
    }

    aboutBtn.addEventListener("click", openAbout);

    if (aboutClose){
      aboutClose.addEventListener("click", closeAbout);
    }

    aboutModal.addEventListener("click", (e) => {
      if (e.target === aboutModal){
        closeAbout();
      }
    });

    // ===== BULLET-URI DIN STÂNGA =====
    const bullets  = Array.from(aboutModal.querySelectorAll(".story-bullet"));
    const sections = bullets.map(b => {
      const sel = b.getAttribute("data-target");
      return sel ? aboutModal.querySelector(sel) : null;
    });

    // Click pe bullet
    bullets.forEach((bullet, idx) => {
      const target = sections[idx];
      bullet.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (target){
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
        bullets.forEach(b => b.classList.remove("active"));
        bullet.classList.add("active");
      });
    });

    // ===== Sincronizare automată =====
    if ("IntersectionObserver" in window && modalBox){
      const io = new IntersectionObserver((entries) => {
        let best = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting){
            if (!best || entry.intersectionRatio > best.intersectionRatio){
              best = entry;
            }
          }
        });
        if (!best) return;
        const idx = sections.indexOf(best.target);
        if (idx >= 0){
          bullets.forEach(b => b.classList.remove("active"));
          bullets[idx].classList.add("active");
        }
      }, {
        root: modalBox,   
        threshold: 0.3  
      });

      sections.forEach(sec => sec && io.observe(sec));
    }
  })();

///Amin!