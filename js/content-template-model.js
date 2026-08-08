const TYPES = new Set(["lesson", "research", "history", "problem", "exam"]);

const TEMPLATES = [
  {
    id: "lesson-standard",
    type: "lesson",
    label: { ro: "Lecție standard", en: "Standard lesson" },
    description: { ro: "Obiective, explicație, exemplu și concluzie.", en: "Goals, explanation, example and conclusion." },
    fields: {
      mh_learn_ro: "La finalul lecției, elevul va putea:\n• [[obiectiv 1]]\n• [[obiectiv 2]]",
      mh_learn_en: "By the end of the lesson, the learner will be able to:\n• [[goal 1]]\n• [[goal 2]]",
      mh_why_ro: "[[De ce este important conceptul și unde este folosit.]]",
      mh_why_en: "[[Why the concept matters and where it is used.]]",
      mh_body_ro: "<h2>Ideea principală</h2>\n<p>[[explicație]]</p>\n<h2>Metodă</h2>\n<p>[[pași / proprietăți]]</p>\n<h2>Observații</h2>\n<p>[[observații importante]]</p>",
      mh_body_en: "<h2>Main idea</h2>\n<p>[[explanation]]</p>\n<h2>Method</h2>\n<p>[[steps / properties]]</p>\n<h2>Notes</h2>\n<p>[[important notes]]</p>",
      mh_examples_ro: "<h3>Exemplu</h3>\n<p>[[exemplu rezolvat]]</p>",
      mh_examples_en: "<h3>Example</h3>\n<p>[[worked example]]</p>",
      mh_sources: "[[sursă]]"
    }
  },
  {
    id: "lesson-proof",
    type: "lesson",
    label: { ro: "Lecție cu demonstrație", en: "Proof-based lesson" },
    description: { ro: "Definiție, teoremă, demonstrație și consecințe.", en: "Definition, theorem, proof and consequences." },
    fields: {
      mh_learn_ro: "• [[înțelegerea rezultatului]]\n• [[folosirea rezultatului în probleme]]",
      mh_learn_en: "• [[understand the result]]\n• [[use the result in problems]]",
      mh_why_ro: "[[Rolul rezultatului în capitol.]]",
      mh_why_en: "[[Role of the result in the chapter.]]",
      mh_body_ro: "<h2>Definiție</h2>\n<p>[[definiție]]</p>\n<h2>Teoremă</h2>\n<p>[[enunț]]</p>\n<h2>Demonstrație</h2>\n<p>[[demonstrație pas cu pas]]</p>\n<h2>Consecințe</h2>\n<p>[[consecințe / corolare]]</p>",
      mh_body_en: "<h2>Definition</h2>\n<p>[[definition]]</p>\n<h2>Theorem</h2>\n<p>[[statement]]</p>\n<h2>Proof</h2>\n<p>[[step-by-step proof]]</p>\n<h2>Consequences</h2>\n<p>[[consequences / corollaries]]</p>",
      mh_examples_ro: "<h3>Aplicare</h3>\n<p>[[problemă scurtă care folosește teorema]]</p>",
      mh_examples_en: "<h3>Application</h3>\n<p>[[short problem using the theorem]]</p>",
      mh_sources: "[[sursă]]"
    }
  },
  {
    id: "research-note",
    type: "research",
    label: { ro: "Notă de cercetare", en: "Research note" },
    description: { ro: "Întrebare, context, metodă, rezultat și limite.", en: "Question, context, method, result and limitations." },
    fields: {
      mh_grade: "RES",
      mh_tags: "research, [[temă]]",
      mh_learn_ro: "[[Ideea matematică investigată.]]",
      mh_learn_en: "[[Mathematical idea being investigated.]]",
      mh_why_ro: "[[Motivația și relevanța întrebării.]]",
      mh_why_en: "[[Motivation and relevance of the question.]]",
      mh_body_ro: "<h2>Întrebarea</h2>\n<p>[[întrebare]]</p>\n<h2>Context</h2>\n<p>[[context]]</p>\n<h2>Metodă</h2>\n<p>[[metodă]]</p>\n<h2>Rezultat</h2>\n<p>[[rezultat]]</p>\n<h2>Limitări și direcții</h2>\n<p>[[limitări / pași următori]]</p>",
      mh_body_en: "<h2>Question</h2>\n<p>[[question]]</p>\n<h2>Context</h2>\n<p>[[context]]</p>\n<h2>Method</h2>\n<p>[[method]]</p>\n<h2>Result</h2>\n<p>[[result]]</p>\n<h2>Limitations and next steps</h2>\n<p>[[limitations / next steps]]</p>",
      mh_sources: "[[sursă 1]]\n[[sursă 2]]"
    }
  },
  {
    id: "history-concept",
    type: "history",
    label: { ro: "Istoria unui concept", en: "History of a concept" },
    description: { ro: "Context, cronologie, contribuții și impact matematic.", en: "Context, timeline, contributions and mathematical impact." },
    fields: {
      mh_grade: "HIST",
      mh_tags: "istorie, [[concept]]",
      mh_learn_ro: "[[Cum a apărut și cum s-a dezvoltat conceptul.]]",
      mh_learn_en: "[[How the concept emerged and developed.]]",
      mh_why_ro: "[[Legătura dintre istorie și ideea matematică modernă.]]",
      mh_why_en: "[[Connection between history and the modern mathematical idea.]]",
      mh_body_ro: "<h2>Context</h2>\n<p>[[context istoric]]</p>\n<h2>Cronologie</h2>\n<p>[[momente importante]]</p>\n<h2>Contribuții</h2>\n<p>[[matematicieni / idei]]</p>\n<h2>Impact</h2>\n<p>[[influența asupra matematicii]]</p>",
      mh_body_en: "<h2>Context</h2>\n<p>[[historical context]]</p>\n<h2>Timeline</h2>\n<p>[[important milestones]]</p>\n<h2>Contributions</h2>\n<p>[[mathematicians / ideas]]</p>\n<h2>Impact</h2>\n<p>[[influence on mathematics]]</p>",
      mh_sources: "[[sursă 1]]\n[[sursă 2]]"
    }
  },
  {
    id: "problem-standard",
    type: "problem",
    label: { ro: "Exercițiu standard", en: "Standard exercise" },
    description: { ro: "Enunț, două indicii, soluție și explicații.", en: "Statement, two hints, solution and explanations." },
    fields: {
      mh_difficulty: "2",
      mh_statement_ro: "[[enunțul problemei]]",
      mh_statement_en: "[[problem statement]]",
      mh_hint1_ro: "[[primul indiciu]]",
      mh_hint1_en: "[[first hint]]",
      mh_hint2_ro: "[[al doilea indiciu]]",
      mh_hint2_en: "[[second hint]]",
      mh_solution_ro: "[[soluție academică pas cu pas]]",
      mh_solution_en: "[[step-by-step academic solution]]",
      mh_explanation_simple_ro: "[[explicație simplă]]",
      mh_explanation_simple_en: "[[simple explanation]]",
      mh_explanation_boss_ro: "[[intuiția din spatele soluției]]",
      mh_explanation_boss_en: "[[intuition behind the solution]]",
      mh_source: "[[sursă]]"
    }
  },
  {
    id: "problem-admission",
    type: "problem",
    label: { ro: "Problemă de admitere", en: "Admission problem" },
    description: { ro: "Structură compactă pentru probleme de admitere.", en: "Compact structure for admission problems." },
    fields: {
      mh_difficulty: "3",
      mh_tags: "admitere, [[temă]]",
      mh_statement_ro: "[[enunț de admitere]]",
      mh_statement_en: "[[admission problem statement]]",
      mh_hint1_ro: "[[observația-cheie]]",
      mh_hint1_en: "[[key observation]]",
      mh_solution_ro: "[[rezolvare riguroasă și scurtă]]",
      mh_solution_en: "[[concise rigorous solution]]",
      mh_explanation_simple_ro: "[[ideea centrală în limbaj simplu]]",
      mh_explanation_simple_en: "[[central idea in simple language]]",
      mh_explanation_boss_ro: "[[scurtătura / intuiția utilă]]",
      mh_explanation_boss_en: "[[useful shortcut / intuition]]",
      mh_source: "[[instituție / an / sursă]]"
    }
  },
  {
    id: "problem-olympiad",
    type: "problem",
    label: { ro: "Problemă olimpică", en: "Olympiad problem" },
    description: { ro: "Dificultate ridicată, indicii progresive și soluție completă.", en: "High difficulty, progressive hints and full solution." },
    fields: {
      mh_difficulty: "5",
      mh_olymp_level: "nationala",
      mh_tags: "olimpiadă, [[temă]]",
      mh_statement_ro: "[[enunț olimpic]]",
      mh_statement_en: "[[olympiad statement]]",
      mh_hint1_ro: "[[idee subtilă, fără a da soluția]]",
      mh_hint1_en: "[[subtle idea without giving away the solution]]",
      mh_hint2_ro: "[[pas intermediar mai explicit]]",
      mh_hint2_en: "[[more explicit intermediate step]]",
      mh_solution_ro: "[[demonstrație completă]]",
      mh_solution_en: "[[complete proof]]",
      mh_explanation_simple_ro: "[[scheletul logic al soluției]]",
      mh_explanation_simple_en: "[[logical skeleton of the solution]]",
      mh_explanation_boss_ro: "[[ideea surprinzătoare / invariantul / construcția]]",
      mh_explanation_boss_en: "[[surprising idea / invariant / construction]]",
      mh_source: "[[competiție / etapă / an]]"
    }
  },
  {
    id: "exam-practice",
    type: "exam",
    label: { ro: "Test de antrenament", en: "Practice test" },
    description: { ro: "Set generic pentru verificare sau recapitulare.", en: "Generic set for assessment or review." },
    fields: {
      mh_exam_type: "ALT",
      mh_exam_hours: "1",
      mh_exam_title_ro: "Test de antrenament · [[capitol]]",
      mh_exam_title_en: "Practice test · [[chapter]]",
      mh_exam_credit: "[[autor / sursă]]",
      mh_exam_scoring_profile: "default_exact_v1"
    }
  },
  {
    id: "exam-bac",
    type: "exam",
    label: { ro: "Simulare BAC", en: "Baccalaureate mock" },
    description: { ro: "Preset de 3 ore pentru o simulare BAC creată în MathHard.", en: "Three-hour preset for a MathHard baccalaureate mock." },
    fields: {
      mh_exam_type: "BAC",
      mh_exam_hours: "3",
      mh_exam_title_ro: "Simulare BAC · [[profil / variantă]]",
      mh_exam_title_en: "Baccalaureate mock · [[track / version]]",
      mh_exam_credit: "MathHard · [[surse folosite]]",
      mh_exam_scoring_profile: "default_exact_v1"
    }
  },
  {
    id: "exam-admission",
    type: "exam",
    label: { ro: "Set de admitere", en: "Admission set" },
    description: { ro: "Preset de 3 ore pentru simulări de admitere.", en: "Three-hour preset for admission mocks." },
    fields: {
      mh_exam_type: "ADM",
      mh_exam_hours: "3",
      mh_exam_title_ro: "Simulare admitere · [[instituție / variantă]]",
      mh_exam_title_en: "Admission mock · [[institution / version]]",
      mh_exam_credit: "MathHard · [[surse folosite]]",
      mh_exam_scoring_profile: "default_exact_v1"
    }
  }
];

function normalizeType(value) {
  const type = String(value || "lesson").trim().toLowerCase();
  return TYPES.has(type) ? type : "lesson";
}

function localized(value, language = "ro") {
  const key = String(language || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
  return value?.[key] || value?.ro || value?.en || "";
}

export function contentTemplatesForType(type = "lesson", language = "ro") {
  const normalized = normalizeType(type);
  return TEMPLATES
    .filter((template) => template.type === normalized)
    .map((template) => ({
      id: template.id,
      type: template.type,
      label: localized(template.label, language),
      description: localized(template.description, language)
    }));
}

export function contentTemplateById(templateId) {
  const template = TEMPLATES.find((entry) => entry.id === String(templateId || ""));
  return template ? { ...template, fields: { ...template.fields } } : null;
}

export function hasTemplatePlaceholder(value) {
  return /\[\[[^\[\]]+\]\]/.test(String(value ?? ""));
}

export function templatePlaceholderCount(value) {
  return (String(value ?? "").match(/\[\[[^\[\]]+\]\]/g) || []).length;
}

export { TEMPLATES as CONTENT_TEMPLATES };
