import { buildLessonQuizAnswers } from "./lesson-quiz-model.js";
import { startSecureLessonQuiz, submitSecureLessonQuiz } from "./lesson-quiz-repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function languageCode(getLanguage) {
  return String(getLanguage?.() || "ro").toLowerCase().startsWith("en") ? "en" : "ro";
}

export function createLessonQuizController({
  supabase,
  getLanguage = () => "ro",
  getContentHost = () => document.getElementById("viewContent"),
  renderMath = () => {},
  onBack = () => {},
  onLearned = () => {}
} = {}) {
  let activeLesson = null;
  let activeQuiz = null;
  let requestEpoch = 0;

  function text(ro, en) {
    return languageCode(getLanguage) === "ro" ? ro : en;
  }

  function showError(host, error) {
    host.innerHTML = `
      <section class="quizBox mh-secure-lesson-quiz-error" role="alert">
        <h3>${text("Verificarea nu poate fi încărcată", "The lesson check could not be loaded")}</h3>
        <p>${text("Încearcă din nou peste câteva momente.", "Try again in a few moments.")}</p>
        <button class="btn" data-lesson-quiz-back type="button">${text("Înapoi la lecție", "Back to lesson")}</button>
      </section>`;
    host.querySelector("[data-lesson-quiz-back]")?.addEventListener("click", () => onBack(activeLesson));
  }

  function renderQuiz(host, quiz) {
    const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
    host.innerHTML = `
      <section class="quizBox mh-secure-lesson-quiz">
        <header class="quizHead">
          <div>
            <div class="quizTitle">${text("Verificare lecție", "Lesson check")}</div>
            <div class="legend">${text(
              `Prag de promovare: ${quiz.pass_threshold || 100}%.`,
              `Pass mark: ${quiz.pass_threshold || 100}%.`
            )}</div>
          </div>
        </header>
        <div class="mh-lesson-quiz-status" data-lesson-quiz-status aria-live="polite">
          ${text("Completează toate întrebările.", "Complete all questions.")}
        </div>
        <div class="mh-secure-lesson-quiz-list">
          ${questions.map((question, questionIndex) => {
            const inputType = question.kind === "simple" ? "radio" : "checkbox";
            return `
              <article class="qBlock" data-quiz-question="${escapeHtml(question.id)}">
                <div class="qText"><b>Q${questionIndex + 1}.</b> ${question.prompt || ""}</div>
                <div class="qOptions">
                  ${(Array.isArray(question.options) ? question.options : []).map((option) => `
                    <label class="qOption">
                      <input type="${inputType}" name="lesson_quiz_${escapeHtml(question.id)}" value="${escapeHtml(option.id)}">
                      <span>${option.text || ""}</span>
                    </label>`).join("")}
                </div>
                <div class="qBadge" data-quiz-result hidden></div>
                <div class="explain" data-quiz-explanation hidden></div>
              </article>`;
          }).join("")}
        </div>
        <div class="quizActions">
          <button class="btn" data-lesson-quiz-submit type="button">${text("Verifică răspunsurile", "Check answers")}</button>
          <button class="btn" data-lesson-quiz-reset type="button">${text("Resetează selecțiile", "Reset selections")}</button>
          <button class="btn" data-lesson-quiz-retry type="button" hidden>${text("Alt set", "New set")}</button>
          <button class="btn" data-lesson-quiz-back type="button">${text("Înapoi la lecție", "Back to lesson")}</button>
        </div>
      </section>`;

    renderMath(host);

    const submitButton = host.querySelector("[data-lesson-quiz-submit]");
    const retryButton = host.querySelector("[data-lesson-quiz-retry]");
    const status = host.querySelector("[data-lesson-quiz-status]");

    host.querySelector("[data-lesson-quiz-back]")?.addEventListener("click", () => onBack(activeLesson));
    host.querySelector("[data-lesson-quiz-reset]")?.addEventListener("click", () => {
      host.querySelectorAll("input").forEach((input) => { input.checked = false; });
    });
    retryButton?.addEventListener("click", () => { void open(activeLesson, { force: true }); });

    submitButton?.addEventListener("click", async () => {
      if (!activeQuiz?.attempt_id) return;
      submitButton.disabled = true;
      if (status) status.textContent = text("Se verifică…", "Checking…");
      try {
        const answers = buildLessonQuizAnswers(host, questions);
        const result = await submitSecureLessonQuiz(
          supabase,
          activeQuiz.attempt_id,
          answers,
          languageCode(getLanguage)
        );

        const byId = new Map((Array.isArray(result?.results) ? result.results : []).map((entry) => [String(entry.question_id), entry]));
        questions.forEach((question) => {
          const card = host.querySelector(`[data-quiz-question="${CSS.escape(String(question.id))}"]`);
          const row = byId.get(String(question.id));
          const badge = card?.querySelector("[data-quiz-result]");
          const explanation = card?.querySelector("[data-quiz-explanation]");
          if (!row || !badge) return;
          badge.hidden = false;
          badge.className = `qBadge ${row.correct ? "ok" : "bad"}`;
          badge.textContent = row.correct ? text("Corect", "Correct") : text("Greșit", "Wrong");
          if (explanation && row.explanation) {
            explanation.hidden = false;
            explanation.innerHTML = row.explanation;
          }
        });

        if (status) {
          status.textContent = result?.passed
            ? text(
                `🎓 Lecție învățată · ${result.correct_count}/${result.total_count} corecte`,
                `🎓 Lesson learned · ${result.correct_count}/${result.total_count} correct`
              )
            : text(
                `📖 Lecție citită · ${result.correct_count}/${result.total_count} corecte. Mai încearcă.`,
                `📖 Lesson read · ${result.correct_count}/${result.total_count} correct. Try again.`
              );
          status.classList.toggle("is-complete", Boolean(result?.passed));
        }

        submitButton.hidden = true;
        retryButton.hidden = false;
        host.querySelectorAll("input").forEach((input) => { input.disabled = true; });
        if (result?.passed) onLearned(activeLesson, result);
      } catch (error) {
        console.error("Lesson quiz submission failed:", error);
        if (status) status.textContent = text(
          "Răspunsurile nu au putut fi trimise. Reîncearcă.",
          "The answers could not be submitted. Try again."
        );
        submitButton.disabled = false;
      }
    });
  }

  async function open(lesson, { force = false } = {}) {
    activeLesson = lesson;
    const host = getContentHost();
    if (!host || !lesson?.id) return;
    const epoch = ++requestEpoch;
    host.innerHTML = `<section class="quizBox"><p>${text("Se încarcă verificarea…", "Loading lesson check…")}</p></section>`;
    try {
      const quiz = await startSecureLessonQuiz(supabase, lesson.id, languageCode(getLanguage));
      if (epoch !== requestEpoch) return;
      activeQuiz = quiz;
      renderQuiz(host, quiz);
    } catch (error) {
      if (epoch !== requestEpoch) return;
      showError(host, error);
    }
  }

  return { open };
}
