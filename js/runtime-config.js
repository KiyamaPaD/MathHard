export const WIDGET_ID = "axa-naturale-1";

const GRADES = [
  "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII",
  "OL-V", "OL-VI", "OL-VII", "OL-VIII",
  "OL-IX", "OL-X", "OL-XI", "OL-XII",
  "EN", "BAC", "FAC", "ADM", "RES", "HIST"
];

const OLYMP_TIERS = [
  "locale",
  "județene",
  "interjudețene/regionale",
  "naționale",
  "balcaniada",
  "internaționale",
  "mondiale"
];

const EXAM_TIPS = {
  title_ro: "🧠 Tips & Tricks examen",
  title_en: "🧠 Exam tips & mindset",
  body_ro: "<h3>⏱ Managementul timpului</h3>",
  body_en: "<h3>⏱ Time management</h3>"
};

const EXAM_POINTS = {
  "en25-1": 50,
  "en25-2": 50,
  "bac25-1": 50,
  "bac25-2": 50,
  "adm25-1": 100
};

export function createRuntimeData() {
  return {
    grades: [...GRADES],
    olympTiers: [...OLYMP_TIERS],
    lessons: [],
    problems: [],
    exams: [],
    tips: { ...EXAM_TIPS },
    exam_points: { ...EXAM_POINTS }
  };
}
