function text(value) {
  return String(value ?? "").trim();
}

export function buildProblemRecommendations({ currentProblem, problems = [], solvedIds = new Set(), limit = 4 }) {
  const currentId = text(currentProblem?.id);
  const currentLesson = text(currentProblem?.lessonId || currentProblem?.lesson_id);
  const currentDifficulty = Number(currentProblem?.difficulty || 0);

  return [...problems]
    .filter((problem) => text(problem?.id) && text(problem?.id) !== currentId)
    .map((problem) => {
      const lesson = text(problem?.lessonId || problem?.lesson_id);
      const difficulty = Number(problem?.difficulty || 0);
      const sameLesson = Boolean(currentLesson && lesson === currentLesson);
      const unsolved = !solvedIds.has(text(problem?.id));
      const distance = Math.abs(difficulty - currentDifficulty);
      const score = (unsolved ? 100 : 0) + (sameLesson ? 50 : 0) - distance * 5;
      return { problem, score };
    })
    .sort((a, b) => b.score - a.score || text(a.problem?.id).localeCompare(text(b.problem?.id), "ro"))
    .slice(0, Math.max(0, Number(limit) || 0))
    .map((entry) => entry.problem);
}

export function feedbackForAttempt({ language = "ro", wrongAttempts = 0, hasHint1 = false, hasHint2 = false }) {
  const ro = language !== "en";
  const wrong = Math.max(0, Number(wrongAttempts) || 0);

  if (wrong >= 4 && hasHint2) {
    return ro
      ? "Ai ajuns la Hint 2. Compară ideea ta cu structura sugerată și reconstruiește soluția, nu doar rezultatul."
      : "Hint 2 is now available. Compare your approach with the suggested structure and rebuild the solution, not just the result.";
  }
  if (wrong >= 2 && hasHint1) {
    return ro
      ? "Hint 1 este disponibil. Folosește-l ca direcție, apoi încearcă din nou fără să sari direct la răspuns."
      : "Hint 1 is available. Use it as direction, then try again without jumping straight to the answer.";
  }
  if (wrong > 0) {
    return ro
      ? "Verifică semnele, cazurile speciale și forma exactă cerută. Încearcă să scrii pașii pe scurt înainte de următoarea trimitere."
      : "Check signs, special cases and the exact requested form. Write the key steps briefly before your next submission.";
  }
  return ro
    ? "Începe prin a identifica datele, necunoscuta și teorema sau metoda potrivită."
    : "Start by identifying the given data, the unknown and the relevant theorem or method.";
}

export function formatAttemptTime(value, language = "ro") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
