function updateOfflinePage() {
  const status = document.querySelector("[data-system-online-status]");
  const retry = document.querySelector('[data-system-action="reload"]');
  if (!status || !retry) return;
  const online = navigator.onLine !== false;
  status.textContent = online
    ? "Conexiunea este disponibilă. Poți încerca din nou."
    : "Verifică internetul și încearcă din nou.";
  retry.textContent = online ? "Continuă" : "Reîncearcă";
}

document.addEventListener("click", (event) => {
  const action = event.target.closest?.("[data-system-action]")?.dataset.systemAction;
  if (action === "back") history.back();
  if (action === "reload") location.reload();
});
window.addEventListener("online", updateOfflinePage);
window.addEventListener("offline", updateOfflinePage);
updateOfflinePage();
