const DEFAULT_CONFIG = {
    durations: { tap: 140, counter: 420, reveal: 360, celebration: 3200 },
    confetti: { problem: 18, lesson: 24, exam: 38, achievement: 30, level: 34, generic: 16 },
    selectors: {
        reveal: [
            ".card",
            ".mh-game-card",
            ".mh-game-level-card",
            ".mh-community-profile-card",
            ".mh-community-leaderboard-row",
            ".mh-roadmap-card",
            ".mh-problem-card",
            ".lesson-section"
        ],
        progress: [
            ".mh-game-progress-track > i",
            ".progress > span",
            ".progress-bar > span",
            "[role='progressbar'] > span"
        ]
    }
};
const COUNTER_SELECTOR = [
    "#solvedCount",
    "#readCount",
    "#learnedCount",
    "#examsCount",
    "#xpTotalHeader",
    "[data-motion-number]"
].join(",");
const INTERACTIVE_SELECTOR = [
    "button",
    ".btn",
    "a.btn",
    "[role='button']",
    ".mh-roadmap-card",
    ".mh-community-leaderboard-row"
].join(",");
function safeNumber(value) {
    if (!value)
        return null;
    const normalized = value.replace(/[^0-9,.-]/g, "").replace(",", ".");
    if (!normalized)
        return null;
    const result = Number(normalized);
    return Number.isFinite(result) ? result : null;
}
function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
async function loadConfig() {
    try {
        const response = await fetch("/data/microinteractions.json?v=4h", { cache: "force-cache" });
        if (!response.ok)
            return DEFAULT_CONFIG;
        const input = await response.json();
        return {
            durations: { ...DEFAULT_CONFIG.durations, ...(input.durations || {}) },
            confetti: { ...DEFAULT_CONFIG.confetti, ...(input.confetti || {}) },
            selectors: {
                reveal: Array.isArray(input.selectors?.reveal) ? input.selectors.reveal : DEFAULT_CONFIG.selectors.reveal,
                progress: Array.isArray(input.selectors?.progress) ? input.selectors.progress : DEFAULT_CONFIG.selectors.progress
            }
        };
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
class MhXpPulse extends HTMLElement {
    valueNode = null;
    labelNode = null;
    connectedCallback() {
        if (this.shadowRoot)
            return;
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = `
      <style>
        :host{display:inline-grid;place-items:center;width:1.55rem;height:1.55rem;vertical-align:middle;margin-inline-start:.28rem;contain:layout paint;pointer-events:none}
        .wrap{position:relative;display:grid;place-items:center;width:100%;height:100%}
        svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);filter:drop-shadow(0 0 .32rem color-mix(in srgb, var(--accent,#7c5cff) 55%, transparent))}
        circle{fill:none;stroke:color-mix(in srgb, var(--accent,#7c5cff) 72%, white);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:52;stroke-dashoffset:52}
        strong{font:700 .61rem/1 system-ui;color:var(--text,#fff);opacity:0;transform:scale(.75)}
        span{position:absolute;inset:auto auto -1.18rem 50%;translate:-50% 0;white-space:nowrap;font:700 .62rem/1 system-ui;color:var(--accent,#7c5cff);opacity:0}
        :host([data-active]) circle{animation:ring .68s cubic-bezier(.2,.8,.2,1)}
        :host([data-active]) strong{animation:value .68s cubic-bezier(.2,.8,.2,1)}
        :host([data-active]) span{animation:label .9s ease-out}
        @keyframes ring{0%{stroke-dashoffset:52;opacity:0}35%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        @keyframes value{0%,100%{opacity:0;transform:scale(.65)}40%,70%{opacity:1;transform:scale(1)}}
        @keyframes label{0%{opacity:0;transform:translateY(.25rem)}25%,65%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-.25rem)}}
        @media(prefers-reduced-motion:reduce){circle,strong,span{animation:none!important}:host([data-active]) span{opacity:1}}
      </style>
      <div class="wrap" aria-hidden="true">
        <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2"/></svg>
        <strong>+</strong><span></span>
      </div>`;
        this.valueNode = shadow.querySelector("strong");
        this.labelNode = shadow.querySelector("span");
    }
    pulse(delta) {
        if (!Number.isFinite(delta) || delta <= 0)
            return;
        if (this.valueNode)
            this.valueNode.textContent = `+${Math.round(delta)}`;
        if (this.labelNode)
            this.labelNode.textContent = `+${Math.round(delta)} XP`;
        this.removeAttribute("data-active");
        void this.offsetWidth;
        this.setAttribute("data-active", "");
        window.setTimeout(() => this.removeAttribute("data-active"), 950);
    }
}
if (!customElements.get("mh-xp-pulse")) {
    customElements.define("mh-xp-pulse", MhXpPulse);
}
class ConfettiCanvas {
    canvas;
    context;
    particles = [];
    frame = 0;
    resizeObserver = null;
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.className = "mh-confetti-canvas";
        this.canvas.setAttribute("aria-hidden", "true");
        const context = this.canvas.getContext("2d", { alpha: true });
        if (!context)
            throw new Error("Canvas 2D unavailable");
        this.context = context;
        document.body.append(this.canvas);
        this.resize();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(document.documentElement);
    }
    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
        this.canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    burst(count, origin) {
        if (prefersReducedMotion() || count <= 0)
            return;
        const x = origin?.x ?? window.innerWidth * 0.5;
        const y = origin?.y ?? Math.min(window.innerHeight * 0.28, 220);
        const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
        const seedHue = accent ? 260 : 235;
        for (let index = 0; index < count; index += 1) {
            const angle = (-Math.PI * 0.92) + Math.random() * Math.PI * 0.84;
            const speed = 4.2 + Math.random() * 5.8;
            const maxLife = 52 + Math.random() * 36;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.13 + Math.random() * 0.08,
                rotation: Math.random() * Math.PI,
                spin: (Math.random() - 0.5) * 0.3,
                size: 3.5 + Math.random() * 4.8,
                life: maxLife,
                maxLife,
                hue: seedHue + (Math.random() * 90 - 25)
            });
        }
        if (!this.frame)
            this.frame = requestAnimationFrame(() => this.draw());
    }
    draw() {
        this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.particles = this.particles.filter((particle) => particle.life > 0);
        for (const particle of this.particles) {
            particle.life -= 1;
            particle.vy += particle.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.spin;
            const alpha = Math.max(0, particle.life / particle.maxLife);
            this.context.save();
            this.context.translate(particle.x, particle.y);
            this.context.rotate(particle.rotation);
            this.context.globalAlpha = alpha;
            this.context.fillStyle = `hsl(${particle.hue} 88% 64%)`;
            this.context.fillRect(-particle.size * 0.55, -particle.size * 0.28, particle.size * 1.1, particle.size * 0.56);
            this.context.restore();
        }
        if (this.particles.length) {
            this.frame = requestAnimationFrame(() => this.draw());
        }
        else {
            this.frame = 0;
            this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }
}
export async function createMicrointeractionEngine() {
    const config = await loadConfig();
    const reduced = prefersReducedMotion();
    document.documentElement.classList.add("mh-motion-ready");
    document.documentElement.classList.toggle("mh-reduced-motion", reduced);
    try {
        if ("registerProperty" in CSS) {
            CSS.registerProperty({ name: "--mh-motion-progress", syntax: "<number>", initialValue: "0", inherits: false });
        }
    }
    catch {
        // Property may already be registered by a hot reload.
    }
    let confetti = null;
    try {
        confetti = new ConfettiCanvas();
    }
    catch {
        confetti = null;
    }
    const seen = new WeakSet();
    const counterValues = new WeakMap();
    const progressValues = new WeakMap();
    const activeCounterAnimations = new WeakSet();
    const revealSelector = config.selectors.reveal.join(",");
    const progressSelector = config.selectors.progress.join(",");
    let xpPulse = null;
    function ensureXpPulse() {
        if (xpPulse?.isConnected)
            return xpPulse;
        const xp = document.querySelector("#xpTotalHeader");
        const counter = xp?.closest(".counter");
        if (!counter)
            return null;
        xpPulse = document.createElement("mh-xp-pulse");
        counter.append(xpPulse);
        return xpPulse;
    }
    function animateElement(element) {
        if (reduced || seen.has(element) || !(element instanceof HTMLElement))
            return;
        if (element.closest("#math-loader, .modal[aria-hidden='true']"))
            return;
        seen.add(element);
        element.classList.add("mh-motion-item");
        const animation = element.animate([
            { opacity: 0, transform: "translateY(8px) scale(.992)" },
            { opacity: 1, transform: "translateY(0) scale(1)" }
        ], { duration: config.durations.reveal, easing: "cubic-bezier(.2,.78,.2,1)", fill: "both" });
        animation.finished.finally(() => {
            element.classList.remove("mh-motion-item");
            element.style.removeProperty("opacity");
            element.style.removeProperty("transform");
        });
    }
    function animateNumber(element) {
        if (!(element instanceof HTMLElement))
            return;
        if (activeCounterAnimations.has(element))
            return;
        const target = safeNumber(element.textContent);
        if (target === null)
            return;
        const previous = counterValues.get(element);
        counterValues.set(element, target);
        if (previous === undefined || previous === target || reduced)
            return;
        const start = performance.now();
        const from = previous;
        const to = target;
        const delta = to - from;
        const formatter = new Intl.NumberFormat(document.documentElement.lang?.startsWith("en") ? "en-US" : "ro-RO", {
            maximumFractionDigits: Number.isInteger(to) ? 0 : 1
        });
        function frame(now) {
            const progress = Math.min(1, (now - start) / config.durations.counter);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = formatter.format(from + delta * eased);
            if (progress < 1)
                requestAnimationFrame(frame);
            else {
                element.textContent = formatter.format(to);
                activeCounterAnimations.delete(element);
            }
        }
        activeCounterAnimations.add(element);
        requestAnimationFrame(frame);
        element.closest(".counter, .mh-stat, .mh-game-card")?.classList.add("mh-number-pop");
        window.setTimeout(() => element.closest(".counter, .mh-stat, .mh-game-card")?.classList.remove("mh-number-pop"), 520);
        if (element.id === "xpTotalHeader" && delta > 0)
            ensureXpPulse()?.pulse(delta);
    }
    function animateProgress(element) {
        if (!(element instanceof HTMLElement))
            return;
        const current = element.style.width || getComputedStyle(element).width;
        const previous = progressValues.get(element);
        progressValues.set(element, current);
        if (reduced || previous === current)
            return;
        element.animate([
            { transform: "scaleX(.92)", filter: "brightness(1.18)" },
            { transform: "scaleX(1)", filter: "brightness(1)" }
        ], { duration: 430, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    function scan(root) {
        if (root instanceof Element) {
            if (root.matches(revealSelector))
                animateElement(root);
            if (root.matches(COUNTER_SELECTOR))
                animateNumber(root);
            if (root.matches(progressSelector))
                animateProgress(root);
        }
        root.querySelectorAll?.(revealSelector).forEach(animateElement);
        root.querySelectorAll?.(COUNTER_SELECTOR).forEach(animateNumber);
        root.querySelectorAll?.(progressSelector).forEach(animateProgress);
    }
    const intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            animateElement(entry.target);
            intersectionObserver.unobserve(entry.target);
        }
    }, { threshold: 0.08, rootMargin: "40px 0px" });
    document.querySelectorAll(revealSelector).forEach((element) => intersectionObserver.observe(element));
    document.querySelectorAll(COUNTER_SELECTOR).forEach((element) => {
        const value = safeNumber(element.textContent);
        if (value !== null)
            counterValues.set(element, value);
    });
    document.querySelectorAll(progressSelector).forEach((element) => progressValues.set(element, element.style.width));
    ensureXpPulse();
    const mutationObserver = new MutationObserver((records) => {
        for (const record of records) {
            if (record.type === "characterData") {
                const parent = record.target.parentElement;
                if (parent?.matches(COUNTER_SELECTOR))
                    animateNumber(parent);
                continue;
            }
            for (const node of record.addedNodes) {
                if (!(node instanceof Element))
                    continue;
                node.querySelectorAll?.(revealSelector).forEach((element) => intersectionObserver.observe(element));
                if (node.matches(revealSelector))
                    intersectionObserver.observe(node);
                scan(node);
            }
            if (record.target instanceof Element) {
                if (record.target.matches(COUNTER_SELECTOR))
                    animateNumber(record.target);
                if (record.target.matches(progressSelector))
                    animateProgress(record.target);
            }
        }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    function createRipple(event) {
        if (reduced || event.button !== 0)
            return;
        const target = event.target?.closest(INTERACTIVE_SELECTOR);
        if (!(target instanceof HTMLElement) || target.matches(":disabled") || target.closest("[aria-disabled='true']"))
            return;
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "mh-motion-ripple";
        ripple.style.setProperty("--mh-ripple-x", `${event.clientX - rect.left}px`);
        ripple.style.setProperty("--mh-ripple-y", `${event.clientY - rect.top}px`);
        target.classList.add("mh-motion-pressable");
        target.append(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    }
    function onPointerUp(event) {
        const target = event.target?.closest(INTERACTIVE_SELECTOR);
        if (!(target instanceof HTMLElement) || reduced)
            return;
        target.animate([{ transform: "scale(.985)" }, { transform: "scale(1)" }], { duration: config.durations.tap, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    function burst(kind = "generic", origin) {
        confetti?.burst(config.confetti[kind] ?? config.confetti.generic, origin);
    }
    function celebrate(detail) {
        const kind = detail.kind || "generic";
        burst(kind);
        document.documentElement.classList.remove("mh-celebrating");
        void document.documentElement.offsetWidth;
        document.documentElement.classList.add("mh-celebrating");
        window.setTimeout(() => document.documentElement.classList.remove("mh-celebrating"), 760);
    }
    function onCelebrate(event) {
        celebrate(event.detail || {});
    }
    document.addEventListener("pointerdown", createRipple, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("mathhard:celebrate", onCelebrate);
    return {
        celebrate,
        burst,
        animateElement,
        destroy() {
            mutationObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener("pointerdown", createRipple);
            document.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("mathhard:celebrate", onCelebrate);
        }
    };
}
