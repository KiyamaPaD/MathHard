import {
  logLearningEvent,
  requestProblemHint,
  revealProblemAnswer,
  submitProblemAnswer
} from "./secure-evaluation-repository.js";

function messageFor(language, key, ok = false) {
  const messages = {
    ro: {
      correct: "✅ Corect! Bravo.",
      already_solved: "✅ Corect. Problema era deja rezolvată.",
      wrong: "❌ Nu e încă bine. Încearcă din nou.",
      unavailable: "Evaluarea securizată nu este disponibilă momentan.",
      checking: "Se verifică securizat…",
      hint_locked: "Hintul nu este încă deblocat.",
      hint_missing: "Această problemă nu are acest hint.",
      reveal_failed: "Răspunsul nu a putut fi afișat."
    },
    en: {
      correct: "✅ Correct, well done.",
      already_solved: "✅ Correct. This problem was already solved.",
      wrong: "❌ Not correct yet. Try again.",
      unavailable: "Secure evaluation is temporarily unavailable.",
      checking: "Checking securely…",
      hint_locked: "The hint is not unlocked yet.",
      hint_missing: "This problem does not have this hint.",
      reveal_failed: "The answer could not be revealed."
    }
  };

  const lang = language === "en" ? "en" : "ro";
  return messages[lang][key] || (ok ? messages[lang].correct : messages[lang].wrong);
}

export function createSecureProblemController({
  supabase,
  getLanguage,
  getLessons,
  isExamProblem,
  getXPRecord,
  isProblemSolved,
  applyProblemProgressResult,
  incrementTodayProgress,
  attempts,
  saveAttempts,
  renderMath,
  bindMathInputEnhancements,
  escapeHtml
}) {
  if (!supabase) throw new Error("createSecureProblemController requires Supabase.");

  function renderProblem(problem, host) {
    host = host || document.getElementById("viewContent");
    if (!host) return;

    const language = getLanguage() === "en" ? "en" : "ro";
    const lesson = getLessons().find((item) => item.id === problem.lessonId) || {};
    const isExam = isExamProblem(problem);
    const record = getXPRecord(problem.id);
    const hasHint1 = Boolean(problem.has_hint1 ?? (problem.hint1_ro || problem.hint1_en));
    const hasHint2 = Boolean(problem.has_hint2 ?? (problem.hint2_ro || problem.hint2_en));
    const title = language === "ro"
      ? (problem.title_ro || problem.title_en || `Problema ${problem.id}`)
      : (problem.title_en || problem.title_ro || `Problem ${problem.id}`);
    const statement = language === "ro"
      ? (problem.statement_ro || problem.statement_en || "")
      : (problem.statement_en || problem.statement_ro || "");
    const stars = problem.difficulty === 0 ? "0★" : "★".repeat(problem.difficulty);
    const existingAttempts = attempts[problem.id] || [];

    host.innerHTML = `
      <article class="problem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
          <div>
            <div class="stars">🧩 ${stars}</div>
            <h2 style="margin:4px 0 6px;">${escapeHtml(title)}</h2>
            <div class="legend">
              📘 ${escapeHtml(language === "ro"
                ? (lesson.title_ro || lesson.title_en || lesson.chapter || "")
                : (lesson.title_en || lesson.title_ro || lesson.chapter || ""))}
              ${lesson.grade ? ` • 🎓 ${escapeHtml(lesson.grade)}` : ""}
            </div>
          </div>
          ${!isExam ? `
          <div style="text-align:right;" class="problem-xp-box">
            <div class="legend">${language === "ro" ? "⚡ XP validat de server" : "⚡ Server-validated XP"}</div>
            <div class="xp-inline-number" id="probXpValue">${record.xp || 0} / 10</div>
            <div class="legend" id="probXpStats" style="font-size:11px;">
              ${language === "ro" ? "greșeli" : "mistakes"}: ${record.wrong || 0} • ${language === "ro" ? "hinturi" : "hints"}: ${record.hints || 0}
            </div>
          </div>` : ""}
        </div>

        <hr style="border-color:var(--border);opacity:.4;margin:8px 0 10px;">

        <div class="legend" style="margin-bottom:6px;">
          ${language === "ro"
            ? "Răspunsul este verificat în Supabase. XP = 10 − greșeli − hinturi; după reveal, XP-ul acelei rezolvări este 0."
            : "Your answer is checked in Supabase. XP = 10 − mistakes − hints; after reveal, that solve earns 0 XP."}
        </div>

        <div class="problem-statement">${statement}</div>

        <div class="checkrow">
          <input id="answerInput" autocomplete="off" placeholder="${language === "ro" ? "Răspunsul tău…" : "Your answer…"}">
          <button class="btn small" id="checkBtn">${language === "ro" ? "Verifică" : "Check"}</button>
          <span class="legend" id="statusArea"></span>
        </div>

        <div class="mh-live-preview-wrap">
          <div class="legend">Preview live</div>
          <div class="mh-live-preview-box" id="answerPreviewBox"></div>
        </div>

        <div class="mh-math-input-host" id="answerMathToolbar"></div>

        <div class="check-confirm" id="checkConfirm">
          <span>${language === "ro"
            ? "Ești sigur că vrei să trimiți răspunsul? Încercarea va fi validată și înregistrată pe server."
            : "Are you sure you want to submit? The attempt will be validated and recorded on the server."}</span>
          <div class="check-confirm-buttons">
            <button class="btn small" id="confirmNo">${language === "ro" ? "Nu" : "No"}</button>
            <button class="btn small" id="confirmYes">${language === "ro" ? "Da" : "Yes"}</button>
          </div>
        </div>

        <details class="collapsible" style="margin-top:10px;">
          <summary>📜 ${language === "ro" ? "Istoric local al răspunsurilor" : "Local answer history"}</summary>
          <ul class="attempts" id="attemptsList"></ul>
        </details>

        <div class="hints" id="hintsBox" style="margin-top:10px;">
          ${hasHint1 && !isExam ? `
          <div class="hint" id="hintWrap1" style="display:none;">
            <details>
              <summary>💡 Hint 1 (${language === "ro" ? "după 2 răspunsuri greșite" : "after 2 wrong answers"})</summary>
              <p data-hint-content>${language === "ro" ? "Deschide pentru a încărca hintul securizat." : "Open to load the secure hint."}</p>
            </details>
          </div>` : ""}

          ${hasHint2 && !isExam ? `
          <div class="hint" id="hintWrap2" style="display:none;">
            <details>
              <summary>💡 Hint 2 (${language === "ro" ? "după 4 răspunsuri greșite" : "after 4 wrong answers"})</summary>
              <p data-hint-content>${language === "ro" ? "Deschide pentru a încărca hintul securizat." : "Open to load the secure hint."}</p>
            </details>
          </div>` : ""}
        </div>

        ${!isExam ? `
        <div class="reveal">
          <button class="reveal-btn" id="revealBtn">${language === "ro" ? "Arată răspunsul corect" : "Show correct answer"}</button>
          <span class="legend" id="revealText" style="display:none;margin-left:8px;"></span>
        </div>` : ""}
      </article>
    `;

    renderMath(host);
    void logLearningEvent(
      supabase,
      "problem_opened",
      "problem",
      problem.id,
      { language }
    ).catch((error) => console.warn("problem_opened event failed:", error));

    const attemptsList = host.querySelector("#attemptsList");
    existingAttempts.forEach((row) => {
      const item = document.createElement("li");
      item.textContent = `${row.ok ? "✅" : "❌"} ${row.value}`;
      attemptsList.appendChild(item);
    });

    const input = host.querySelector("#answerInput");
    const checkButton = host.querySelector("#checkBtn");
    const confirmBox = host.querySelector("#checkConfirm");
    const yesButton = host.querySelector("#confirmYes");
    const noButton = host.querySelector("#confirmNo");
    const statusArea = host.querySelector("#statusArea");
    bindMathInputEnhancements(input, host.querySelector("#answerPreviewBox"));

    const hintWrap1 = host.querySelector("#hintWrap1");
    const hintWrap2 = host.querySelector("#hintWrap2");
    const hintDetails1 = hintWrap1?.querySelector("details") || null;
    const hintDetails2 = hintWrap2?.querySelector("details") || null;
    let hint1Loaded = false;
    let hint2Loaded = false;
    let submitting = false;

    function refreshHints() {
      const current = getXPRecord(problem.id);
      if (hintWrap1) {
        hintWrap1.style.display = current.wrong >= 2 || current.usedHint1 ? "block" : "none";
      }
      if (hintWrap2) {
        hintWrap2.style.display = current.wrong >= 4 || current.usedHint2 ? "block" : "none";
      }
    }

    function refreshXp() {
      if (isExam) return;
      const current = getXPRecord(problem.id);
      const value = host.querySelector("#probXpValue");
      const stats = host.querySelector("#probXpStats");
      if (value) value.textContent = `${current.xp || 0} / 10`;
      if (stats) {
        stats.textContent = `${language === "ro" ? "greșeli" : "mistakes"}: ${current.wrong || 0} • ${language === "ro" ? "hinturi" : "hints"}: ${current.hints || 0}`;
      }
    }

    function pushAttempt(value, ok) {
      const rows = attempts[problem.id] || [];
      rows.push({ value, ok: Boolean(ok) });
      attempts[problem.id] = rows;
      saveAttempts();

      const item = document.createElement("li");
      item.textContent = `${ok ? "✅" : "❌"} ${value}`;
      attemptsList.appendChild(item);
    }

    async function checkAnswer() {
      const value = (input.value || "").trim();
      if (!value || submitting) {
        if (!value) {
          statusArea.textContent = language === "ro"
            ? "Completează mai întâi răspunsul."
            : "Type an answer first.";
        }
        return;
      }

      submitting = true;
      checkButton.disabled = true;
      input.disabled = true;
      statusArea.textContent = messageFor(language, "checking");

      try {
        const wasAlreadySolved = isProblemSolved(problem.id);
        const result = await submitProblemAnswer(supabase, problem.id, value, language);
        const ok = Boolean(result?.ok);
        pushAttempt(value, ok);

        if (result?.progress) {
          applyProblemProgressResult(problem.id, result.progress, ok ? "solved" : "wrong");
        }

        if (ok) {
          statusArea.textContent = messageFor(
            language,
            result?.message_key === "already_solved" ? "already_solved" : "correct",
            true
          );
          if (!wasAlreadySolved && result?.progress?.solved) {
            incrementTodayProgress("problem");
          }
        } else {
          statusArea.textContent = messageFor(language, "wrong");
          input.disabled = false;
          checkButton.disabled = false;
          input.focus();
        }

        refreshHints();
        refreshXp();
      } catch (error) {
        console.error("Secure problem submission failed:", error);
        statusArea.textContent = messageFor(language, "unavailable");
        input.disabled = false;
        checkButton.disabled = false;
      } finally {
        submitting = false;
      }
    }

    async function loadHint(number, details, wrap) {
      if (!details?.open || !wrap) return;
      if ((number === 1 && hint1Loaded) || (number === 2 && hint2Loaded)) return;

      const content = wrap.querySelector("[data-hint-content]");
      if (content) content.textContent = language === "ro" ? "Se încarcă…" : "Loading…";

      try {
        const result = await requestProblemHint(supabase, problem.id, number, language);
        if (!result?.available) {
          const needed = Number(result?.required_wrong_attempts || (number === 1 ? 2 : 4));
          const current = Number(result?.wrong_attempts || 0);
          if (content) content.textContent = `${messageFor(language, "hint_locked")} (${current}/${needed})`;
          return;
        }

        if (result?.progress) {
          applyProblemProgressResult(problem.id, result.progress, `hint${number}`);
        }
        if (content) content.textContent = result?.hint || messageFor(language, "hint_missing");
        if (number === 1) hint1Loaded = true;
        if (number === 2) hint2Loaded = true;
        refreshXp();
      } catch (error) {
        console.error(`Secure hint ${number} failed:`, error);
        if (content) content.textContent = messageFor(language, "unavailable");
      }
    }

    refreshHints();
    refreshXp();

    if (record.solved) {
      input.disabled = true;
      checkButton.disabled = true;
      statusArea.textContent = language === "ro" ? "✅ Problemă rezolvată." : "✅ Problem solved.";
    }

    checkButton.addEventListener("click", () => {
      if (!checkButton.disabled) confirmBox.style.display = "flex";
    });
    noButton?.addEventListener("click", () => {
      confirmBox.style.display = "none";
    });
    yesButton?.addEventListener("click", () => {
      confirmBox.style.display = "none";
      void checkAnswer();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        checkButton.click();
      }
    });

    hintDetails1?.addEventListener("toggle", () => void loadHint(1, hintDetails1, hintWrap1));
    hintDetails2?.addEventListener("toggle", () => void loadHint(2, hintDetails2, hintWrap2));

    const revealButton = host.querySelector("#revealBtn");
    const revealText = host.querySelector("#revealText");
    let revealedAnswer = "";

    revealButton?.addEventListener("click", async () => {
      if (revealedAnswer) {
        revealText.style.display = revealText.style.display === "none" ? "inline" : "none";
        return;
      }

      revealButton.disabled = true;
      try {
        const result = await revealProblemAnswer(supabase, problem.id, language);
        revealedAnswer = String(result?.answer || "");
        if (result?.progress) {
          applyProblemProgressResult(problem.id, result.progress, "reveal");
        }
        revealText.textContent = `${language === "ro" ? "Răspuns corect:" : "Correct answer:"} ${revealedAnswer}`;
        revealText.style.display = "inline";
        refreshXp();
      } catch (error) {
        console.error("Secure answer reveal failed:", error);
        revealText.textContent = messageFor(language, "reveal_failed");
        revealText.style.display = "inline";
      } finally {
        revealButton.disabled = false;
      }
    });
  }

  return { renderProblem };
}
