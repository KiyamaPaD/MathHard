export function createKeyedMutationQueue() {
  const queues = new Map();

  function enqueue(key, task) {
    if (!key) throw new Error("Mutation queue key is required.");
    if (typeof task !== "function") throw new TypeError("Mutation queue task must be a function.");

    const previous = queues.get(key) || Promise.resolve();
    const queued = previous.catch(() => undefined).then(task);

    queues.set(key, queued);
    void queued.finally(() => {
      if (queues.get(key) === queued) queues.delete(key);
    }).catch(() => undefined);

    return queued;
  }

  return {
    enqueue,
    hasPending(key) {
      return queues.has(key);
    },
    get pendingCount() {
      return queues.size;
    }
  };
}

export function mergeCanonicalProblemProgress(current = {}, row = {}, eventName = "") {
  const terminalEvent = eventName === "solved" || eventName === "solved_no_xp";
  const preserveOptimisticSolve = !!current.solved && !row.solved && !terminalEvent;

  const record = {
    xp: preserveOptimisticSolve
      ? Number(current.xp || 0)
      : Number(row.xp_earned || 0),
    wrong: Number(row.wrong_attempts || 0),
    hints: Number(row.hints_used || 0),
    solved: preserveOptimisticSolve ? true : !!row.solved,
    usedHint1: !!row.used_hint1,
    usedHint2: !!row.used_hint2
  };

  return {
    record,
    terminalEvent,
    solved: record.solved
  };
}
