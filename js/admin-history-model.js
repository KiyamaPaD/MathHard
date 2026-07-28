function asText(value) {
  return String(value ?? "").trim();
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function adminEntityLabel(tableName, language = "ro") {
  const ro = {
    mh_lessons: "Lecție",
    mh_problems: "Problemă",
    mh_exams: "Examen",
    mh_roadmaps: "Roadmap",
    mh_roadmap_sections: "Etapă roadmap",
    mh_roadmap_nodes: "Nod roadmap",
    mh_roadmap_edges: "Prerechizit",
    mh_achievements: "Achievement",
    mh_challenges: "Challenge",
    mh_challenge_templates: "Automatizare"
  };
  const en = {
    mh_lessons: "Lesson",
    mh_problems: "Problem",
    mh_exams: "Exam",
    mh_roadmaps: "Roadmap",
    mh_roadmap_sections: "Roadmap section",
    mh_roadmap_nodes: "Roadmap node",
    mh_roadmap_edges: "Prerequisite",
    mh_achievements: "Achievement",
    mh_challenges: "Challenge",
    mh_challenge_templates: "Automation"
  };
  const dictionary = language === "en" ? en : ro;
  return dictionary[asText(tableName)] || asText(tableName) || (language === "en" ? "Entity" : "Entitate");
}

export function normalizeAuditEntry(value) {
  const row = asObject(value);
  return {
    id: Number(row.id || 0),
    tableName: asText(row.table_name || row.tableName),
    entityId: asText(row.entity_id || row.entityId),
    operation: asText(row.operation || "update").toLowerCase(),
    actorUserId: asText(row.actor_user_id || row.actorUserId),
    actorLabel: asText(row.actor_label || row.actorLabel || "Admin"),
    before: asObject(row.before_data || row.before),
    after: asObject(row.after_data || row.after),
    createdAt: asText(row.created_at || row.createdAt)
  };
}

export function normalizeVersionEntry(value) {
  const row = asObject(value);
  return {
    id: Number(row.id || 0),
    tableName: asText(row.table_name || row.tableName),
    entityId: asText(row.entity_id || row.entityId),
    operation: asText(row.operation || "update").toLowerCase(),
    actorLabel: asText(row.actor_label || row.actorLabel || "Admin"),
    snapshot: asObject(row.snapshot),
    createdAt: asText(row.created_at || row.createdAt),
    restorable: row.restorable !== false
  };
}

export function changedFields(entry) {
  const normalized = normalizeAuditEntry(entry);
  if (normalized.operation === "insert") return Object.keys(normalized.after).sort();
  if (normalized.operation === "delete") return Object.keys(normalized.before).sort();
  const keys = new Set([...Object.keys(normalized.before), ...Object.keys(normalized.after)]);
  return [...keys]
    .filter((key) => JSON.stringify(normalized.before[key]) !== JSON.stringify(normalized.after[key]))
    .sort();
}

export function filterAuditEntries(entries, {
  query = "",
  tableName = "all",
  operation = "all"
} = {}) {
  const needle = asText(query).toLocaleLowerCase("ro");
  return (Array.isArray(entries) ? entries : [])
    .map(normalizeAuditEntry)
    .filter((entry) => {
      if (tableName !== "all" && entry.tableName !== tableName) return false;
      if (operation !== "all" && entry.operation !== operation) return false;
      if (!needle) return true;
      const haystack = [
        entry.tableName,
        entry.entityId,
        entry.operation,
        entry.actorLabel,
        ...changedFields(entry)
      ].join(" ").toLocaleLowerCase("ro");
      return haystack.includes(needle);
    });
}

export function formatAdminTimestamp(value, language = "ro") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function operationLabel(operation, language = "ro") {
  const labels = language === "en"
    ? { insert: "Created", update: "Updated", delete: "Deleted", restore: "Restored" }
    : { insert: "Creat", update: "Modificat", delete: "Șters", restore: "Restaurat" };
  return labels[asText(operation).toLowerCase()] || asText(operation);
}
