export function createAuthUiController({
  supabase,
  hideAdminButton,
  loadProgress,
  refreshAdminButton,
  onSessionResolved = async () => {}
}) {
  if (!supabase?.auth) {
    throw new Error("createAuthUiController requires supabase.auth");
  }

  let syncEpoch = 0;
  let syncTimer = null;
  let pendingSessionOverride = undefined;
  let started = false;
  let authSubscription = null;

  async function sync(sessionOverride = undefined) {
    const currentEpoch = ++syncEpoch;
    hideAdminButton();

    let session = sessionOverride;

    if (session === undefined) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Could not restore auth session:", error);
        session = null;
      } else {
        session = data?.session || null;
      }
    }

    if (currentEpoch !== syncEpoch) return;

    await onSessionResolved(session || null);

    if (currentEpoch !== syncEpoch) return;
    await loadProgress(session?.user || null);

    if (currentEpoch !== syncEpoch) return;
    if (!session?.user) return;

    await refreshAdminButton();
  }

  function schedule(sessionOverride = undefined) {
    if (sessionOverride !== undefined) {
      pendingSessionOverride = sessionOverride;
    }

    if (syncTimer) clearTimeout(syncTimer);

    syncTimer = setTimeout(() => {
      syncTimer = null;
      const sessionForRun = pendingSessionOverride;
      pendingSessionOverride = undefined;

      sync(sessionForRun).catch((error) => {
        console.error("Auth UI synchronization failed:", error);
      });
    }, 0);
  }

  function onPageShow() {
    schedule();
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") schedule();
  }

  function start() {
    if (started) return;
    started = true;

    const result = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase recommends deferring follow-up client calls from this callback.
      schedule(session || null);
    });

    authSubscription = result?.data?.subscription || result?.subscription || null;
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
  }

  function stop() {
    if (!started) return;
    started = false;
    ++syncEpoch;

    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }

    authSubscription?.unsubscribe?.();
    authSubscription = null;
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return { schedule, start, stop, sync };
}
