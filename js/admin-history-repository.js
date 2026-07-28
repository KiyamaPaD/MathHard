function requireRpc(supabase) {
  if (!supabase || typeof supabase.rpc !== "function") {
    throw new Error("Supabase client is unavailable.");
  }
}

async function call(supabase, name, args = {}) {
  requireRpc(supabase);
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data || {};
}

export function loadAdminAuditLog(supabase, {
  query = "",
  tableName = "all",
  operation = "all",
  limit = 200
} = {}) {
  return call(supabase, "mh_admin_get_audit_log", {
    p_query: query || null,
    p_table_name: tableName === "all" ? null : tableName,
    p_operation: operation === "all" ? null : operation,
    p_limit: Math.max(1, Math.min(500, Number(limit) || 200))
  });
}

export function loadAdminEntityVersions(supabase, tableName, entityId, limit = 30) {
  return call(supabase, "mh_admin_get_entity_versions", {
    p_table_name: String(tableName || ""),
    p_entity_id: String(entityId || ""),
    p_limit: Math.max(1, Math.min(100, Number(limit) || 30))
  });
}

export function restoreAdminVersion(supabase, versionId) {
  return call(supabase, "mh_admin_restore_version", {
    p_version_id: Number(versionId)
  });
}

export function getAdminContentUsage(supabase, tableName, entityId) {
  return call(supabase, "mh_admin_get_content_usage", {
    p_table_name: String(tableName || ""),
    p_entity_id: String(entityId || "")
  });
}

export function deleteAdminContentSafely(supabase, tableName, entityId) {
  return call(supabase, "mh_admin_delete_content_safe", {
    p_table_name: String(tableName || ""),
    p_entity_id: String(entityId || "")
  });
}
