import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://wvbwbmnibibkzctiymmj.supabase.co",
  "sb_publishable_J6voVgKxnv6becElN0Gsxg_ChNSHrbU",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);