import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getAdminPerspectiveAuthOptions,
  getAdminPerspectiveMode,
  installAdminPerspectivePreviewUi,
  wrapSupabaseForAdminPerspective
} from "./admin-perspective-preview.js";

const ADMIN_PERSPECTIVE_MODE = getAdminPerspectiveMode();

const baseSupabase = createClient(
  "https://wvbwbmnibibkzctiymmj.supabase.co",
  "sb_publishable_J6voVgKxnv6becElN0Gsxg_ChNSHrbU",
  {
    auth: getAdminPerspectiveAuthOptions(ADMIN_PERSPECTIVE_MODE)
  }
);

export const supabase = wrapSupabaseForAdminPerspective(
  baseSupabase,
  ADMIN_PERSPECTIVE_MODE
);

installAdminPerspectivePreviewUi(ADMIN_PERSPECTIVE_MODE);
