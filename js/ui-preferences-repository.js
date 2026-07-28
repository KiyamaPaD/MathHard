export const UI_SECTION_KEYS = Object.freeze([
  "hub",
  "roadmap",
  "boss",
  "radar",
  "catalog",
]);

export const DEFAULT_UI_PREFERENCES = Object.freeze({
  version: 2,
  compactHome: false,
  sections: Object.freeze({
    hub: true,
    roadmap: true,
    boss: true,
    radar: true,
    catalog: true,
  }),
  onboarding: Object.freeze({
    completed: false,
    version: 0,
  }),
});

function readBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeUiPreferences(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const rawSections = source.sections && typeof source.sections === "object"
    ? source.sections
    : {};
  const rawOnboarding = source.onboarding && typeof source.onboarding === "object"
    ? source.onboarding
    : {};

  const sections = {};
  for (const key of UI_SECTION_KEYS) {
    sections[key] = readBoolean(
      rawSections[key],
      DEFAULT_UI_PREFERENCES.sections[key]
    );
  }

  return {
    version: 2,
    compactHome: readBoolean(
      source.compactHome ?? source.compact_home,
      DEFAULT_UI_PREFERENCES.compactHome
    ),
    sections,
    onboarding: {
      completed: readBoolean(rawOnboarding.completed, DEFAULT_UI_PREFERENCES.onboarding.completed),
      version: Math.max(0, Math.trunc(readNumber(rawOnboarding.version, DEFAULT_UI_PREFERENCES.onboarding.version))),
    },
  };
}

export function serializeUiPreferences(preferences) {
  const normalized = normalizeUiPreferences(preferences);
  return {
    version: 2,
    compact_home: normalized.compactHome,
    sections: { ...normalized.sections },
    onboarding: { ...normalized.onboarding },
  };
}

export function mergeUiPreferences(base, patch) {
  const current = normalizeUiPreferences(base);
  const next = patch && typeof patch === "object" ? patch : {};
  const patchSections = next.sections && typeof next.sections === "object"
    ? next.sections
    : {};
  const patchOnboarding = next.onboarding && typeof next.onboarding === "object"
    ? next.onboarding
    : {};

  return normalizeUiPreferences({
    compactHome: typeof next.compactHome === "boolean"
      ? next.compactHome
      : current.compactHome,
    sections: {
      ...current.sections,
      ...patchSections,
    },
    onboarding: {
      ...current.onboarding,
      ...patchOnboarding,
    },
  });
}

export async function loadUiPreferences(supabase) {
  if (!supabase?.rpc) {
    throw new Error("Supabase client is required.");
  }

  const { data, error } = await supabase.rpc("mh_get_ui_preferences");
  if (error) throw error;
  return normalizeUiPreferences(data || {});
}

export async function saveUiPreferences(supabase, preferences) {
  if (!supabase?.rpc) {
    throw new Error("Supabase client is required.");
  }

  const payload = serializeUiPreferences(preferences);
  const { data, error } = await supabase.rpc("mh_save_ui_preferences", {
    p_preferences: payload,
  });

  if (error) throw error;
  return normalizeUiPreferences(data || payload);
}
