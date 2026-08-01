import {
  logLearningEvent,
  requestProblemHint,
  revealProblemAnswer,
  submitProblemAnswer
} from "./secure-evaluation-repository.js";
import {
  loadProblemWorkspace,
  normalizeProblemWorkspace,
  saveContentWorkspace
} from "./problem-workspace-repository.js";
import {
  buildProblemRecommendations,
  feedbackForAttempt,
  formatAttemptTime
} from "./problem-workspace-model.js";

function messageFor(language, key, ok = false) {
  const messages = {
    ro: {
      correct: "✅ Corect.",
      already_solved: "✅ Corect. Problema era deja rezolvată.",
      wrong: "❌ Răspuns incorect. Încearcă din nou.",
      unavailable: "Verificarea nu este disponibilă momentan.",
      checking: "Se verifică…",
      hint_locked: "Indiciul nu este încă deblocat.",
      hint_missing: "Această problemă nu are acest indiciu.",
      reveal_failed: "Răspunsul nu a putut fi afișat."
    },
    en: {
      correct: "✅ Correct, well done.",
      already_solved: "✅ Correct. This problem was already solved.",
      wrong: "❌ Not correct yet. Try again.",
      unavailable: "Checking is temporarily unavailable.",
      checking: "Checking…",
      hint_locked: "The hint is not unlocked yet.",
      hint_missing: "This problem does not have this hint.",
      reveal_failed: "The answer could not be revealed."
    }
  };

  const lang = language === "en" ? "en" : "ro";
  return messages[lang][key] || (ok ? messages[lang].correct : messages[lang].wrong);
}

function debounce(callback, delay = 700) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

function translated(item, language, field = "title") {
  const first = language === "en" ? item?.[`${field}_en`] : item?.[`${field}_ro`];
  const second = language === "en" ? item?.[`${field}_ro`] : item?.[`${field}_en`];
  return String(first || second || item?.id || "");
}

function solutionText(solution, mode, language) {
  if (!solution) return "";
  const safeMode = new Set(["academic", "simple", "boss"]).has(mode) ? mode : "simple";
  return String(solution?.[safeMode] || solution?.simple || solution?.academic || solution?.answer || "");
}

export function createSecureProblemController({
  supabase,
  getLanguage,
  getLessons,
  getProblems = () => [],
  getSolvedIds = () => new Set(),
  onOpenProblem,
  onProblemOpened = () => {},
  onProblemAttempted = () => {},
  isExamProblem,
  getXPRecord,
  isProblemSolved,
  applyProblemProgressResult,
  incrementTodayProgress,
  attempts,
  saveAttempts,
  renderMath,
  bindMathInputEnhancements,
  attachMathToolbar,
  renderConceptDetails = () => "",
  escapeHtml
}) {
  if (!supabase) throw new Error("createSecureProblemController requires Supabase.");

  function renderProblem(problem, host) {
    host = host || document.getElementById("viewContent");
    if (!host) return;

    const language = getLanguage() === "en" ? "en" : "ro";
    const ro = language === "ro";
    const lesson = getLessons().find((item) => item.id === problem.lessonId) || {};
    const isExam = isExamProblem(problem);
    const record = getXPRecord(problem.id);
    const hasHint1 = Boolean(problem.has_hint1 ?? (problem.hint1_ro || problem.hint1_en));
    const hasHint2 = Boolean(problem.has_hint2 ?? (problem.hint2_ro || problem.hint2_en));
    const title = translated(problem, language);
    const statement = translated(problem, language, "statement");
    const stars = problem.difficulty === 0 ? "0★" : "★".repeat(problem.difficulty);
    const existingAttempts = Array.isArray(attempts[problem.id])
      ? attempts[problem.id]
      : [];

    host.innerHTML = `
      <article class="problem mh-problem-workspace">
        <section class="mh-problem-hero" aria-labelledby="mhProblemTitle">
          <div>
            <div class="stars">🧩 ${stars}</div>
            <h2 id="mhProblemTitle">${escapeHtml(title)}</h2>
            <div class="legend">
              📘 ${escapeHtml(translated(lesson, language) || lesson.chapter || "")}
              ${lesson.grade ? ` • 🎓 ${escapeHtml(lesson.grade)}` : ""}
            </div>
          </div>
          <div class="mh-problem-hero-actions">
            <button class="btn small mh-bookmark-btn" id="problemBookmarkBtn" type="button" aria-pressed="false">
              ☆ ${ro ? "Salvează" : "Bookmark"}
            </button>
            ${!isExam ? `
            <div class="mh-problem-progress-box" aria-label="${ro ? "Progres problemă" : "Problem progress"}">
              <div class="mh-problem-progress-top">
                <span class="legend">${ro ? "Progres problemă" : "Problem progress"}</span>
                <strong id="probXpValue">${record.xp || 0} / 10 XP</strong>
              </div>
              <div class="mh-problem-progress-meta" id="probXpStats">
                <span>${ro ? "Greșeli" : "Mistakes"}: ${record.wrong || 0}</span>
                <span>${ro ? "Hinturi" : "Hints"}: ${record.hints || 0}</span>
              </div>
            </div>` : ""}
          </div>
        </section>

        <div class="mh-problem-layout">
          <main class="mh-problem-main">
            <section class="mh-problem-card">
              <div class="legend mh-secure-caption">
                ${ro
                  ? "Rezolvă fără soluție pentru a păstra XP-ul disponibil."
                  : "Solve it without revealing the solution to keep the available XP."}
              </div>
              <div class="problem-statement">${statement}</div>
              ${renderConceptDetails(problem.id)}
            </section>

            <section class="mh-problem-card mh-answer-card">
              <h3>✍️ ${ro ? "Rezolvarea ta" : "Your solution"}</h3>
              <div class="checkrow">
                <input id="answerInput" autocomplete="off" placeholder="${ro ? "Răspunsul tău…" : "Your answer…"}">
                <button class="btn small" id="checkBtn" type="button">${ro ? "Verifică" : "Check"}</button>
              </div>
              <div class="legend mh-problem-status" id="statusArea"></div>
              <div class="mh-live-preview-wrap">
                <div class="legend">${ro ? "Previzualizare" : "Preview"}</div>
                <div class="mh-live-preview-box" id="answerPreviewBox"></div>
              </div>
              <div class="mh-math-input-host" id="answerMathToolbar"></div>

              <div class="check-confirm" id="checkConfirm">
                <span>${ro
                  ? "Trimiți răspunsul?"
                  : "Submit this answer?"}</span>
                <div class="check-confirm-buttons">
                  <button class="btn small" id="confirmNo" type="button">${ro ? "Nu" : "No"}</button>
                  <button class="btn small" id="confirmYes" type="button">${ro ? "Da" : "Yes"}</button>
                </div>
              </div>
            </section>

            <section class="mh-problem-card mh-feedback-card">
              <h3>🧭 ${ro ? "Feedback de lucru" : "Work feedback"}</h3>
              <p id="problemFeedbackText"></p>
            </section>

            <section class="mh-problem-card">
              <details class="collapsible" open>
                <summary>📜 ${ro ? "Istoricul încercărilor" : "Attempt history"} (<span id="attemptCount">${existingAttempts.length}</span>)</summary>
                <div id="attemptHistoryStatus" class="legend">${ro ? "Se încarcă…" : "Loading…"}</div>
                <ul class="attempts mh-server-attempts" id="attemptsList"></ul>
              </details>
            </section>

            <div class="hints" id="hintsBox">
              ${hasHint1 && !isExam ? `
              <div class="hint" id="hintWrap1" style="display:none;">
                <details>
                  <summary>💡 Hint 1 (${ro ? "după 2 greșeli" : "after 2 mistakes"})</summary>
                  <p data-hint-content>${ro ? "Deschide pentru a vedea hintul." : "Open to view the hint."}</p>
                </details>
              </div>` : ""}
              ${hasHint2 && !isExam ? `
              <div class="hint" id="hintWrap2" style="display:none;">
                <details>
                  <summary>💡 Hint 2 (${ro ? "după 4 greșeli" : "after 4 mistakes"})</summary>
                  <p data-hint-content>${ro ? "Deschide pentru a vedea hintul." : "Open to view the hint."}</p>
                </details>
              </div>` : ""}
            </div>

            ${!isExam ? `
            <section class="mh-problem-card mh-solution-card">
              <div class="mh-solution-heading">
                <h3>🧠 ${ro ? "Explicație și soluție" : "Explanation and solution"}</h3>
                <div class="mh-explanation-modes" role="group" aria-label="Explanation mode">
                  <button type="button" data-explanation-mode="academic">🎓 ${ro ? "Completă" : "Detailed"}</button>
                  <button type="button" data-explanation-mode="simple">✨ ${ro ? "Simplă" : "Simple"}</button>
                  <button type="button" data-explanation-mode="boss">◈ ${ro ? "Intuitivă" : "Intuitive"}</button>
                </div>
              </div>
              <div id="solutionLocked" class="legend">
                ${ro ? "Soluția devine disponibilă după rezolvare sau la cerere." : "The solution becomes available after solving or on request."}
              </div>
              <div id="solutionContent" class="mh-solution-content" hidden></div>
              <div class="reveal">
                <button class="reveal-btn" id="revealBtn" type="button">${ro ? "Arată răspunsul și soluția" : "Show answer and solution"}</button>
                <span class="legend" id="revealText" hidden></span>
              </div>
            </section>` : ""}

            <section class="mh-problem-card">
              <h3>➡️ ${ro ? "Continuă antrenamentul" : "Continue training"}</h3>
              <div class="mh-problem-recommendations" id="problemRecommendations"></div>
            </section>
          </main>

          <aside class="mh-problem-side">
            <section class="mh-problem-card mh-note-card">
              <h3>📝 ${ro ? "Notița mea" : "My note"}</h3>
              <textarea id="problemNote" rows="10" maxlength="10000" placeholder="${ro
                ? "Scrie ideea principală, greșeala făcută sau metoda de reținut…"
                : "Write the key idea, your mistake or the method to remember…"}"></textarea>
              <div class="legend" id="problemNoteStatus">${ro ? "Notița se salvează automat." : "Your note is saved automatically."}</div>
            </section>
          </aside>
        </div>
      </article>
    `;

    renderMath(host);
    if (!isExam) onProblemOpened(problem.id);
    void logLearningEvent(supabase, "problem_opened", "problem", problem.id, { language })
      .catch((error) => console.warn("problem_opened event failed:", error));

    const attemptsList = host.querySelector("#attemptsList");
    const attemptCount = host.querySelector("#attemptCount");
    const attemptStatus = host.querySelector("#attemptHistoryStatus");
    const input = host.querySelector("#answerInput");
    const checkButton = host.querySelector("#checkBtn");
    const confirmBox = host.querySelector("#checkConfirm");
    const yesButton = host.querySelector("#confirmYes");
    const noButton = host.querySelector("#confirmNo");
    const statusArea = host.querySelector("#statusArea");
    const feedbackText = host.querySelector("#problemFeedbackText");
    const bookmarkButton = host.querySelector("#problemBookmarkBtn");
    const noteInput = host.querySelector("#problemNote");
    const noteStatus = host.querySelector("#problemNoteStatus");
    const solutionLocked = host.querySelector("#solutionLocked");
    const solutionContent = host.querySelector("#solutionContent");
    const modeButtons = [...host.querySelectorAll("[data-explanation-mode]")];
    bindMathInputEnhancements(input, host.querySelector("#answerPreviewBox"));
    attachMathToolbar?.(input, host.querySelector("#answerMathToolbar"));

    const hintWrap1 = host.querySelector("#hintWrap1");
    const hintWrap2 = host.querySelector("#hintWrap2");
    const hintDetails1 = hintWrap1?.querySelector("details") || null;
    const hintDetails2 = hintWrap2?.querySelector("details") || null;
    let hint1Loaded = false;
    let hint2Loaded = false;
    let submitting = false;
    let workspace = normalizeProblemWorkspace({});
    let workspaceRevision = 0;
    let workspaceLoadEpoch = 0;
    let workspaceSaveChain = Promise.resolve();
    let noteDirty = false;

    function renderAttempts(rows) {
      attemptsList.innerHTML = "";
      rows.forEach((row) => {
        const item = document.createElement("li");
        const when = formatAttemptTime(row.createdAt, language);
        item.innerHTML = `<span>${row.correct ? "✅" : "❌"} ${escapeHtml(row.answer)}</span>${when ? `<small>${escapeHtml(when)}</small>` : ""}`;
        attemptsList.appendChild(item);
      });
      attemptCount.textContent = String(rows.length);
      attemptStatus.textContent = rows.length
        ? (ro ? "Istoricul încercărilor tale." : "Your attempt history.")
        : (ro ? "Nu există încă încercări." : "No attempts yet.");
    }

    function renderFeedback() {
      const current = getXPRecord(problem.id);
      feedbackText.textContent = feedbackForAttempt({
        language,
        wrongAttempts: current.wrong,
        hasHint1,
        hasHint2
      });
    }

    function refreshHints() {
      const current = getXPRecord(problem.id);
      if (hintWrap1) hintWrap1.style.display = current.wrong >= 2 || current.usedHint1 ? "block" : "none";
      if (hintWrap2) hintWrap2.style.display = current.wrong >= 4 || current.usedHint2 ? "block" : "none";
      renderFeedback();
    }

    function refreshXp() {
      if (isExam) return;
      const current = getXPRecord(problem.id);
      const value = host.querySelector("#probXpValue");
      const stats = host.querySelector("#probXpStats");
      if (value) value.textContent = `${current.xp || 0} / 10 XP`;
      if (stats) {
        stats.innerHTML = `<span>${ro ? "Greșeli" : "Mistakes"}: ${current.wrong || 0}</span><span>${ro ? "Hinturi" : "Hints"}: ${current.hints || 0}</span>`;
      }
    }

    function renderWorkspace({ syncNote = true } = {}) {
      bookmarkButton?.setAttribute("aria-pressed", String(workspace.bookmarked));
      if (bookmarkButton) bookmarkButton.innerHTML = workspace.bookmarked
        ? `★ ${ro ? "Salvată" : "Saved"}`
        : `☆ ${ro ? "Salvează" : "Bookmark"}`;
      if (
        syncNote &&
        noteInput &&
        document.activeElement !== noteInput &&
        !noteDirty &&
        noteInput.value !== workspace.note
      ) {
        noteInput.value = workspace.note;
      }
      modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.explanationMode === workspace.explanationMode));

      const unlocked = workspace.canViewSolution && workspace.solution;
      if (solutionLocked) solutionLocked.hidden = Boolean(unlocked);
      if (solutionContent) {
        solutionContent.hidden = !unlocked;
        solutionContent.innerHTML = unlocked
          ? `<div>${escapeHtml(solutionText(workspace.solution, workspace.explanationMode, language)).replaceAll("\n", "<br>")}</div>`
          : "";
        if (unlocked) renderMath(solutionContent);
      }
      renderAttempts(workspace.attempts);
    }

    async function reloadWorkspace() {
      if (isExam) return;
      const requestEpoch = ++workspaceLoadEpoch;
      const revisionAtStart = workspaceRevision;
      try {
        const remote = normalizeProblemWorkspace(await loadProblemWorkspace(supabase, problem.id, language));
        if (requestEpoch !== workspaceLoadEpoch) return;

        // Never let a slow initial/refetch response overwrite changes the user
        // made while the request was in flight.
        if (workspaceRevision !== revisionAtStart) {
          remote.bookmarked = workspace.bookmarked;
          remote.note = workspace.note;
          remote.explanationMode = workspace.explanationMode;
        }
        workspace = remote;
        renderWorkspace({ syncNote: workspaceRevision === revisionAtStart });
      } catch (error) {
        if (requestEpoch !== workspaceLoadEpoch) return;
        console.warn("Problem workspace could not be loaded:", error);
        const fallback = existingAttempts.map((row, index) => ({
          id: index,
          answer: row.value,
          correct: Boolean(row.ok),
          verificationMode: "local",
          createdAt: ""
        }));
        renderAttempts(fallback);
        if (attemptStatus) attemptStatus.textContent = ro
          ? "Istoricul complet nu este disponibil. Sunt afișate încercările din această sesiune."
          : "The complete history is unavailable. Attempts from this session are shown.";
      }
    }

    function saveWorkspace(changes, successText) {
      const revision = ++workspaceRevision;
      const snapshot = { ...changes };

      workspaceSaveChain = workspaceSaveChain
        .catch(() => undefined)
        .then(async () => {
          try {
            const payload = await saveContentWorkspace(supabase, {
              contentType: "problem",
              contentId: problem.id,
              bookmarked: snapshot.bookmarked,
              note: snapshot.note,
              explanationMode: snapshot.explanationMode
            });

            if (revision === workspaceRevision) {
              workspace = normalizeProblemWorkspace({
                ...workspace,
                ...payload,
                attempts: workspace.attempts,
                solution: workspace.solution
              });
              if (Object.prototype.hasOwnProperty.call(snapshot, "note")) noteDirty = false;
              renderWorkspace({ syncNote: false });
              if (noteStatus && successText) noteStatus.textContent = successText;
            }
          } catch (error) {
            console.error("Problem workspace save failed:", error);
            if (revision === workspaceRevision && noteStatus) {
              noteStatus.textContent = ro ? "Salvarea a eșuat. Reîncearcă." : "Save failed. Try again.";
            }
            throw error;
          }
        });

      void workspaceSaveChain.catch(() => undefined);
      return workspaceSaveChain;
    }

    bookmarkButton?.addEventListener("click", () => {
      const next = !workspace.bookmarked;
      workspace.bookmarked = next;
      renderWorkspace({ syncNote: false });
      void saveWorkspace({ bookmarked: next }, next ? (ro ? "Problemă salvată." : "Problem saved.") : (ro ? "Problemă eliminată din salvate." : "Problem removed from saved."));
    });

    const saveNoteDebounced = debounce(() => {
      if (!noteInput) return;
      noteStatus.textContent = ro ? "Se salvează…" : "Saving…";
      void saveWorkspace({ note: noteInput.value }, ro ? "Notiță salvată." : "Note saved.");
    });
    noteInput?.addEventListener("input", () => {
      workspace.note = noteInput.value;
      noteDirty = true;
      saveNoteDebounced();
    });

    modeButtons.forEach((button) => button.addEventListener("click", () => {
      const mode = button.dataset.explanationMode;
      workspace.explanationMode = mode;
      renderWorkspace({ syncNote: false });
      void saveWorkspace({ explanationMode: mode });
    }));

    function pushLocalAttempt(value, ok) {
      const rows = Array.isArray(attempts[problem.id]) ? attempts[problem.id] : [];
      rows.push({ value, ok: Boolean(ok), ts: Date.now() });
      attempts[problem.id] = rows.slice(-200);
      saveAttempts();
    }

    async function checkAnswer() {
      const value = (input.value || "").trim();
      if (!value || submitting) {
        if (!value) statusArea.textContent = ro ? "Completează mai întâi răspunsul." : "Type an answer first.";
        return;
      }

      submitting = true;
      if (!isExam) onProblemAttempted(problem.id);
      checkButton.disabled = true;
      input.disabled = true;
      statusArea.textContent = messageFor(language, "checking");

      try {
        const wasAlreadySolved = isProblemSolved(problem.id);
        const previousXp = Number(getXPRecord(problem.id)?.xp || 0);
        const result = await submitProblemAnswer(supabase, problem.id, value, language);
        const ok = Boolean(result?.ok);
        pushLocalAttempt(value, ok);
        if (result?.progress) applyProblemProgressResult(problem.id, result.progress, ok ? "solved" : "wrong");

        if (ok) {
          statusArea.textContent = messageFor(language, result?.message_key === "already_solved" ? "already_solved" : "correct", true);
          if (!wasAlreadySolved && result?.progress?.solved) {
            incrementTodayProgress("problem");
            const earnedXp = Math.max(0, Number(getXPRecord(problem.id)?.xp || 0) - previousXp);
            window.dispatchEvent(new CustomEvent("mathhard:celebrate", {
              detail: {
                kind: "problem",
                title: ro ? "Problemă rezolvată" : "Problem solved",
                subtitle: translated(problem, language),
                xp: earnedXp
              }
            }));
          }
        } else {
          statusArea.textContent = messageFor(language, "wrong");
          input.disabled = false;
          checkButton.disabled = false;
          input.focus();
        }

        refreshHints();
        refreshXp();
        await reloadWorkspace();
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
      if (content) content.textContent = ro ? "Se încarcă…" : "Loading…";

      try {
        const result = await requestProblemHint(supabase, problem.id, number, language);
        if (!result?.available) {
          const needed = Number(result?.required_wrong_attempts || (number === 1 ? 2 : 4));
          const current = Number(result?.wrong_attempts || 0);
          if (content) content.textContent = `${messageFor(language, "hint_locked")} (${current}/${needed})`;
          return;
        }
        if (result?.progress) applyProblemProgressResult(problem.id, result.progress, `hint${number}`);
        if (content) content.textContent = result?.hint || messageFor(language, "hint_missing");
        if (number === 1) hint1Loaded = true;
        if (number === 2) hint2Loaded = true;
        refreshXp();
        renderFeedback();
      } catch (error) {
        console.error(`Secure hint ${number} failed:`, error);
        if (content) content.textContent = messageFor(language, "unavailable");
      }
    }

    refreshHints();
    refreshXp();
    renderAttempts(existingAttempts.map((row, index) => ({ id: index, answer: row.value, correct: Boolean(row.ok), createdAt: "" })));

    if (record.solved) {
      input.disabled = true;
      checkButton.disabled = true;
      statusArea.textContent = ro ? "✅ Problemă rezolvată." : "✅ Problem solved.";
    }

    checkButton.addEventListener("click", () => {
      if (!checkButton.disabled) confirmBox.style.display = "flex";
    });
    noButton?.addEventListener("click", () => { confirmBox.style.display = "none"; });
    yesButton?.addEventListener("click", () => { confirmBox.style.display = "none"; void checkAnswer(); });
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
        revealText.hidden = !revealText.hidden;
        return;
      }
      revealButton.disabled = true;
      try {
        const result = await revealProblemAnswer(supabase, problem.id, language);
        revealedAnswer = String(result?.answer || "");
        if (result?.progress) applyProblemProgressResult(problem.id, result.progress, "reveal");
        revealText.textContent = `${ro ? "Răspuns corect:" : "Correct answer:"} ${revealedAnswer}`;
        revealText.hidden = false;
        refreshXp();
        await reloadWorkspace();
      } catch (error) {
        console.error("Secure answer reveal failed:", error);
        revealText.textContent = messageFor(language, "reveal_failed");
        revealText.hidden = false;
      } finally {
        revealButton.disabled = false;
      }
    });

    const recommendations = buildProblemRecommendations({
      currentProblem: problem,
      problems: getProblems(),
      solvedIds: getSolvedIds(),
      limit: 4
    });
    const recommendationHost = host.querySelector("#problemRecommendations");
    recommendations.forEach((candidate) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mh-recommendation-card";
      button.innerHTML = `<strong>${escapeHtml(translated(candidate, language))}</strong><span>${"★".repeat(Number(candidate.difficulty || 0)) || "0★"}${getSolvedIds().has(candidate.id) ? ` • ✅ ${ro ? "rezolvată" : "solved"}` : ""}</span>`;
      button.addEventListener("click", () => onOpenProblem?.(candidate));
      recommendationHost.appendChild(button);
    });
    if (!recommendations.length) recommendationHost.textContent = ro ? "Nu există încă recomandări." : "No recommendations yet.";

    void reloadWorkspace();
  }

  return { renderProblem };
}
