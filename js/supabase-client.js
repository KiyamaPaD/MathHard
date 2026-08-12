import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getPerspectiveMode() {
  try {
    const value = new URL(globalThis.location?.href || "", globalThis.location?.origin || "https://mathhard.app")
      .searchParams.get("mh_preview");
    return value === "guest" || value === "user" ? value : "";
  } catch {
    return "";
  }
}

const ADMIN_PERSPECTIVE_MODE = getPerspectiveMode();
const perspectiveRuntime = ADMIN_PERSPECTIVE_MODE
  ? await import("./admin-perspective-preview.js")
  : null;

const baseSupabase = createClient(
  "https://wvbwbmnibibkzctiymmj.supabase.co",
  "sb_publishable_J6voVgKxnv6becElN0Gsxg_ChNSHrbU",
  {
    auth: perspectiveRuntime
      ? perspectiveRuntime.getAdminPerspectiveAuthOptions(ADMIN_PERSPECTIVE_MODE)
      : {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
  }
);

export const supabase = perspectiveRuntime
  ? perspectiveRuntime.wrapSupabaseForAdminPerspective(baseSupabase, ADMIN_PERSPECTIVE_MODE)
  : baseSupabase;

perspectiveRuntime?.installAdminPerspectivePreviewUi(ADMIN_PERSPECTIVE_MODE);
