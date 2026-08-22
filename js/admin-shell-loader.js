let adminShellPromise = null;

async function readAdminRole(supabase, userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role === "admin";
}

export async function ensureAdminShellForUser({ supabase, user } = {}) {
  if (typeof document === "undefined" || !supabase || !user?.id) return false;
  if (document.getElementById("adminDrawer")) return true;
  if (!(await readAdminRole(supabase, user.id))) return false;
  if (adminShellPromise) return adminShellPromise;

  adminShellPromise = (async () => {
    const response = await fetch("/admin-studio.html", {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Admin shell HTTP ${response.status}`);

    const markup = (await response.text()).trim();
    if (!markup.includes('id="adminDrawer"')) {
      throw new Error("Admin shell payload is invalid.");
    }

    const mount = document.getElementById("mhAdminMount");
    if (!mount) throw new Error("Admin mount point is missing.");

    const template = document.createElement("template");
    template.innerHTML = markup;
    mount.replaceWith(template.content);
    window.dispatchEvent(new CustomEvent("mh:admin-shell-mounted"));
    return true;
  })().catch((error) => {
    adminShellPromise = null;
    throw error;
  });

  return adminShellPromise;
}
