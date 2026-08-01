const lang = (() => {
  try { return localStorage.getItem("mh_lang") === "en" ? "en" : "ro"; }
  catch { return "ro"; }
})();

const COPY = {
  ro: {
    notFoundTitle: "Pagina nu există — MathHard",
    notFoundCode: "404",
    notFoundHeading: "Pagina nu există",
    notFoundText: "Adresa este greșită sau pagina a fost mutată.",
    offlineTitle: "Fără conexiune — MathHard",
    offlineCode: "Fără rețea",
    offlineHeading: "Fără conexiune",
    offlineText: "Verifică internetul și încearcă din nou.",
    onlineText: "Conexiunea este disponibilă. Poți continua.",
    retry: "Reîncearcă",
    continue: "Continuă",
    home: "Acasă",
    back: "Înapoi"
  },
  en: {
    notFoundTitle: "Page not found — MathHard",
    notFoundCode: "404",
    notFoundHeading: "Page not found",
    notFoundText: "The address is incorrect or the page has been moved.",
    offlineTitle: "Offline — MathHard",
    offlineCode: "Offline",
    offlineHeading: "No connection",
    offlineText: "Check your internet connection and try again.",
    onlineText: "The connection is available. You can continue.",
    retry: "Retry",
    continue: "Continue",
    home: "Home",
    back: "Back"
  }
};

const text = COPY[lang];
const offline = Boolean(document.querySelector("[data-system-online-status]"));

document.documentElement.lang = lang;
document.title = offline ? text.offlineTitle : text.notFoundTitle;

const code = document.querySelector(".mh-system-code");
const heading = document.querySelector(".mh-system-page h1");
const paragraph = document.querySelector(".mh-system-page p");
const home = document.querySelector('.mh-system-actions a[href="/index.html"]');
const back = document.querySelector('[data-system-action="back"]');

if (code) code.textContent = offline ? text.offlineCode : text.notFoundCode;
if (heading) heading.textContent = offline ? text.offlineHeading : text.notFoundHeading;
if (paragraph) paragraph.textContent = offline ? text.offlineText : text.notFoundText;
if (home) home.textContent = text.home;
if (back) back.textContent = text.back;

function updateOfflinePage() {
  const status = document.querySelector("[data-system-online-status]");
  const retry = document.querySelector('[data-system-action="reload"]');
  if (!status || !retry) return;
  const online = navigator.onLine !== false;
  status.textContent = online ? text.onlineText : text.offlineText;
  retry.textContent = online ? text.continue : text.retry;
}

document.addEventListener("click", (event) => {
  const action = event.target.closest?.("[data-system-action]")?.dataset.systemAction;
  if (action === "back") history.back();
  if (action === "reload") location.reload();
});
window.addEventListener("online", updateOfflinePage);
window.addEventListener("offline", updateOfflinePage);
updateOfflinePage();
