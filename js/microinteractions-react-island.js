import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18.3.1?target=es2022";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?target=es2022";

const ICONS = Object.freeze({
  problem: "check",
  lesson: "book",
  exam: "trophy",
  achievement: "sparkle",
  level: "bolt",
  generic: "sparkle"
});

const DEFAULT_COPY = Object.freeze({
  ro: {
    problem: "Problemă rezolvată",
    lesson: "Lecție învățată",
    exam: "Examen promovat",
    achievement: "Achievement deblocat",
    level: "Nivel nou",
    generic: "Progres salvat"
  },
  en: {
    problem: "Problem solved",
    lesson: "Lesson learned",
    exam: "Exam passed",
    achievement: "Achievement unlocked",
    level: "New level",
    generic: "Progress saved"
  }
});

function language() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ro";
}

function normalizeEvent(detail = {}) {
  const kind = ICONS[detail.kind] ? detail.kind : "generic";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    title: String(detail.title || DEFAULT_COPY[language()][kind]),
    subtitle: String(detail.subtitle || ""),
    xp: Number.isFinite(Number(detail.xp)) && Number(detail.xp) > 0 ? Math.round(Number(detail.xp)) : 0,
    duration: Math.max(1800, Math.min(6000, Number(detail.duration) || 3200))
  };
}

function CelebrationCard({ item, onDone }) {
  const timer = useRef(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    timer.current = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => onDone(item.id), 260);
    }, item.duration);
    return () => window.clearTimeout(timer.current);
  }, [item, onDone]);

  const iconHref = useMemo(() => `/img/microinteractions-sprite.svg?v=4h#${ICONS[item.kind] || "sparkle"}`, [item.kind]);

  return React.createElement(
    "article",
    {
      className: `mh-celebration-card${leaving ? " is-leaving" : ""}`,
      "data-kind": item.kind,
      style: { "--mh-celebration-duration": `${item.duration}ms` },
      role: "status",
      "aria-live": "polite"
    },
    React.createElement(
      "div",
      { className: "mh-celebration-icon", "aria-hidden": "true" },
      React.createElement("svg", { viewBox: "0 0 24 24" }, React.createElement("use", { href: iconHref }))
    ),
    React.createElement(
      "div",
      { className: "mh-celebration-copy" },
      React.createElement("strong", null, item.title),
      item.subtitle ? React.createElement("span", null, item.subtitle) : null
    ),
    item.xp ? React.createElement("span", { className: "mh-celebration-xp" }, `+${item.xp} XP`) : null
  );
}

function CelebrationIsland({ initialEvents = [] }) {
  const [items, setItems] = useState(() => initialEvents.map(normalizeEvent).slice(-3));

  useEffect(() => {
    const onCelebrate = (event) => {
      const next = normalizeEvent(event.detail || {});
      setItems((current) => [...current, next].slice(-3));
    };
    window.addEventListener("mathhard:celebrate", onCelebrate);
    return () => window.removeEventListener("mathhard:celebrate", onCelebrate);
  }, []);

  const remove = React.useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return React.createElement(
    "div",
    { className: "mh-celebration-stack", "aria-live": "polite", "aria-atomic": "false" },
    items.map((item) => React.createElement(CelebrationCard, { key: item.id, item, onDone: remove }))
  );
}

export function mountCelebrationIsland(host, { initialEvents = [] } = {}) {
  if (!(host instanceof Element)) throw new TypeError("Celebration host is required");
  const root = createRoot(host);
  root.render(React.createElement(CelebrationIsland, { initialEvents }));
  return () => root.unmount();
}
