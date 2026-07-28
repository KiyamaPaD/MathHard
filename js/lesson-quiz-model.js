export function cleanLessonQuizId(value) {
  const id = String(value || "").trim();
  if (!id || id.length > 200) throw new TypeError("Invalid lesson id.");
  return id;
}

export function normalizeQuizAvailability(rows) {
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const lessonId = String(row?.lesson_id || "").trim();
    if (!lessonId) return;
    map.set(lessonId, {
      lesson_id: lessonId,
      question_count: Math.max(1, Number(row?.question_count || 1)),
      pass_threshold: Math.max(1, Math.min(100, Number(row?.pass_threshold || 100)))
    });
  });
  return map;
}

export function makeQuizOption(index = 0) {
  return {
    id: `opt_${index + 1}`,
    text_ro: "",
    text_en: "",
    is_correct: index === 0
  };
}

export function makeQuizItem(index = 0, lessonId = "lesson") {
  return {
    id: `${String(lessonId || "lesson")}_q${index + 1}`,
    kind: "simple",
    prompt_ro: "",
    prompt_en: "",
    explanation_ro: "",
    explanation_en: "",
    is_active: true,
    options: [0, 1, 2, 3].map(makeQuizOption)
  };
}

export function normalizeQuizItem(raw, index = 0, lessonId = "lesson") {
  const item = raw && typeof raw === "object" ? raw : {};
  const options = Array.isArray(item.options) && item.options.length
    ? item.options
    : [0, 1, 2, 3].map(makeQuizOption);

  return {
    id: String(item.id || `${lessonId}_q${index + 1}`).trim(),
    kind: ["simple", "multi", "recap"].includes(String(item.kind || "").toLowerCase())
      ? String(item.kind).toLowerCase()
      : "simple",
    prompt_ro: String(item.prompt_ro || ""),
    prompt_en: String(item.prompt_en || ""),
    explanation_ro: String(item.explanation_ro || ""),
    explanation_en: String(item.explanation_en || ""),
    is_active: item.is_active !== false,
    options: options.slice(0, 8).map((option, optionIndex) => ({
      id: String(option?.id || `opt_${optionIndex + 1}`).trim(),
      text_ro: String(option?.text_ro ?? option?.text ?? ""),
      text_en: String(option?.text_en ?? option?.text ?? ""),
      is_correct: Boolean(option?.is_correct ?? option?.correct)
    }))
  };
}

export function normalizeAdminLessonQuiz(raw, lessonId = "") {
  const quiz = raw && typeof raw === "object" ? raw : {};
  const safeLessonId = String(quiz.lesson_id || lessonId || "").trim();
  return {
    lesson_id: safeLessonId,
    exists: Boolean(quiz.exists),
    is_published: Boolean(quiz.is_published),
    question_count: Math.max(1, Math.min(20, Number(quiz.question_count || 5))),
    pass_threshold: Math.max(1, Math.min(100, Number(quiz.pass_threshold || 100))),
    randomize_questions: quiz.randomize_questions !== false,
    randomize_options: quiz.randomize_options !== false,
    items: (Array.isArray(quiz.items) ? quiz.items : []).map((item, index) =>
      normalizeQuizItem(item, index, safeLessonId || "lesson")
    )
  };
}


export function buildAdminLessonQuizPayload(raw, lessonId = "") {
  const quiz = normalizeAdminLessonQuiz(raw, lessonId);
  return {
    lesson_id: cleanLessonQuizId(quiz.lesson_id || lessonId),
    is_published: Boolean(quiz.is_published),
    question_count: quiz.question_count,
    pass_threshold: quiz.pass_threshold,
    randomize_questions: Boolean(quiz.randomize_questions),
    randomize_options: Boolean(quiz.randomize_options),
    items: quiz.items.map((item) => ({
      id: String(item.id || "").trim(),
      kind: item.kind,
      prompt_ro: item.prompt_ro,
      prompt_en: item.prompt_en,
      explanation_ro: item.explanation_ro,
      explanation_en: item.explanation_en,
      is_active: Boolean(item.is_active),
      options: item.options.map((option) => ({
        id: String(option.id || "").trim(),
        text_ro: option.text_ro,
        text_en: option.text_en,
        is_correct: Boolean(option.is_correct)
      }))
    }))
  };
}

export function validateAdminLessonQuiz(quiz) {
  const errors = [];
  const lessonId = String(quiz?.lesson_id || "").trim();
  const items = Array.isArray(quiz?.items) ? quiz.items : [];

  if (!lessonId) errors.push("Lipsește ID-ul lecției.");
  if (!items.length) errors.push("Adaugă cel puțin o întrebare.");
  if (Number(quiz?.question_count || 0) < 1 || Number(quiz?.question_count || 0) > 20) {
    errors.push("Numărul de întrebări trebuie să fie între 1 și 20.");
  }
  if (Number(quiz?.pass_threshold || 0) < 1 || Number(quiz?.pass_threshold || 0) > 100) {
    errors.push("Pragul de promovare trebuie să fie între 1 și 100.");
  }

  const ids = new Set();
  items.forEach((item, index) => {
    const label = `Întrebarea ${index + 1}`;
    const id = String(item?.id || "").trim();
    const options = Array.isArray(item?.options) ? item.options : [];
    if (!id) errors.push(`${label}: lipsește ID-ul.`);
    else if (ids.has(id)) errors.push(`${label}: ID duplicat (${id}).`);
    else ids.add(id);
    if (!String(item?.prompt_ro || item?.prompt_en || "").trim()) {
      errors.push(`${label}: lipsește enunțul RO sau EN.`);
    }
    if (options.length < 2 || options.length > 8) {
      errors.push(`${label}: trebuie să aibă între 2 și 8 variante.`);
    }
    const optionIds = new Set();
    let correctCount = 0;
    options.forEach((option, optionIndex) => {
      const optionId = String(option?.id || "").trim();
      if (!optionId) errors.push(`${label}, varianta ${optionIndex + 1}: lipsește ID-ul.`);
      else if (optionIds.has(optionId)) errors.push(`${label}: ID de variantă duplicat (${optionId}).`);
      else optionIds.add(optionId);
      if (!String(option?.text_ro || option?.text_en || "").trim()) {
        errors.push(`${label}, varianta ${optionIndex + 1}: lipsește textul.`);
      }
      if (option?.is_correct) correctCount += 1;
    });
    if (correctCount < 1) errors.push(`${label}: marchează cel puțin o variantă corectă.`);
    if (item?.kind === "simple" && correctCount !== 1) {
      errors.push(`${label}: tipul simplu cere exact o variantă corectă.`);
    }
  });

  return errors;
}

export function buildLessonQuizAnswers(root, questions) {
  return (Array.isArray(questions) ? questions : []).map((question) => ({
    question_id: String(question.id),
    option_ids: [...root.querySelectorAll(`[data-quiz-question="${CSS.escape(String(question.id))}"] input:checked`)]
      .map((input) => String(input.value))
  }));
}
