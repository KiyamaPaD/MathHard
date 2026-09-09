(function () {
  const instances = new Map();

  function lang() {
    return String(document.documentElement.lang || 'ro').toLowerCase().startsWith('en') ? 'en' : 'ro';
  }

  const T = {
    ro: {
      title: 'Explorer — axa numerelor reale',
      input: 'Număr / expresie',
      add: 'Adaugă',
      clear: 'Șterge punctele',
      order: 'Ordine',
      interval: 'Interval',
      left: 'Stânga',
      right: 'Dreapta',
      closed: 'inclus',
      unbounded: 'nemărginit',
      hint: 'Adaugă numere • trage markerul pentru a-l muta',
      bad: 'Expresie neacceptată',
      empty: 'Adaugă cel puțin un punct.',
      emptyStage: 'Adaugă un număr pentru a începe',
      approx: 'aprox.',
      selected: 'Punct selectat',
      equivalents: 'scrieri echivalente'
    },
    en: {
      title: 'Real-number line explorer',
      input: 'Number / expression',
      add: 'Add',
      clear: 'Clear points',
      order: 'Order',
      interval: 'Interval',
      left: 'Left',
      right: 'Right',
      closed: 'closed',
      unbounded: 'unbounded',
      hint: 'Add numbers • drag a marker to move it',
      bad: 'Unsupported expression',
      empty: 'Add at least one point.',
      emptyStage: 'Add a number to begin',
      approx: 'approx.',
      selected: 'Selected point',
      equivalents: 'equivalent forms'
    }
  };

  const tr = (key) => T[lang()][key] || key;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function normalizeDecimalString(value) {
    return value.replace(',', '.').replace(/\s+/g, '');
  }

  function parseNumber(raw) {
    const src = String(raw ?? '').trim();
    if (!src) return null;

    let s = normalizeDecimalString(src).toLowerCase();
    s = s.replace(/^\+/, '');

    const pi = s.match(/^(-?)pi$/) || s.match(/^(-?)π$/);
    if (pi) {
      const sign = pi[1] ? -1 : 1;
      return {
        rawInput: src,
        displayLabel: `${sign < 0 ? '−' : ''}π`,
        normalizedValue: { type: 'pi', sign },
        approxValue: sign * Math.PI,
        exactKey: `pi:${sign}`
      };
    }

    const sq = s.match(/^(-?)sqrt\(([-+]?\d+(?:\.\d+)?)\)$/) || s.match(/^(-?)√\(?([-+]?\d+(?:\.\d+)?)\)?$/);
    if (sq) {
      const sign = sq[1] ? -1 : 1;
      const radicand = Number(sq[2]);
      if (!(radicand >= 0)) return null;
      return {
        rawInput: src,
        displayLabel: `${sign < 0 ? '−' : ''}√${sq[2]}`,
        normalizedValue: { type: 'sqrt', sign, radicand },
        approxValue: sign * Math.sqrt(radicand),
        exactKey: `sqrt:${sign}:${radicand}`
      };
    }

    const fraction = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (fraction) {
      let numerator = Number(fraction[1]);
      let denominator = Number(fraction[2]);
      if (!denominator) return null;
      if (denominator < 0) {
        numerator = -numerator;
        denominator = -denominator;
      }
      const divisor = gcd(numerator, denominator);
      const reducedNumerator = numerator / divisor;
      const reducedDenominator = denominator / divisor;
      return {
        rawInput: src,
        displayLabel: `${numerator}/${denominator}`,
        normalizedValue: {
          type: 'rational',
          numerator: reducedNumerator,
          denominator: reducedDenominator
        },
        approxValue: numerator / denominator,
        exactKey: `q:${reducedNumerator}/${reducedDenominator}`
      };
    }

    if (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) {
      const value = Number(s);
      if (!Number.isFinite(value)) return null;
      return {
        rawInput: src,
        displayLabel: src.replace('.', ','),
        normalizedValue: { type: 'decimal', value },
        approxValue: value,
        exactKey: `n:${Number(value.toPrecision(14))}`
      };
    }

    return null;
  }

  function equivalent(a, b) {
    return Math.abs(a.approxValue - b.approxValue) <= 1e-10 * Math.max(1, Math.abs(a.approxValue), Math.abs(b.approxValue));
  }

  function formatApprox(value) {
    if (Math.abs(value) < 1e-12) value = 0;
    return Number(value.toFixed(6)).toString().replace('.', ',');
  }

  function mount(id, host, options = {}) {
    unmount(id);
    if (!host) throw new Error('MH_RealNumberLine.mount: missing host');

    const root = document.createElement('section');
    root.className = 'mh-real-nline';
    root.innerHTML = `<style>
      .mh-real-nline{border:1px solid var(--border);border-radius:16px;padding:14px;background:color-mix(in srgb,var(--card) 96%,transparent);display:grid;gap:12px}
      .mh-real-nline *{box-sizing:border-box}
      .mh-real-nline__head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .mh-real-nline__controls,.mh-real-nline__interval{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .mh-real-nline input[type=text]{min-width:110px;max-width:210px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text)}
      .mh-real-nline button{padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);cursor:pointer}
      .mh-real-nline button:hover{border-color:var(--accent)}
      .mh-real-nline__stage{position:relative;height:286px;border:1px dashed var(--border);border-radius:14px;overflow:hidden;background:color-mix(in srgb,var(--bg) 72%,var(--card) 28%);touch-action:none}
      .mh-real-nline svg{width:100%;height:100%;display:block;user-select:none}
      .mh-real-nline__order{font-weight:800;min-height:24px;overflow-wrap:anywhere}
      .mh-real-nline__selection{min-height:24px;padding:7px 9px;border-radius:10px;background:color-mix(in srgb,var(--card) 88%,transparent);color:var(--muted);font-size:.84rem}
      .mh-real-nline__selection strong{color:var(--text)}
      .mh-real-nline__error{color:var(--bad);min-height:20px;font-size:.85rem}
      .mh-real-nline__hint{color:var(--muted);font-size:.8rem}
      .mh-real-nline__interval-wrap{border-top:1px solid var(--border);padding-top:10px;display:grid;gap:8px}
      .mh-real-nline__interval{display:none;gap:8px;align-items:center;flex-wrap:wrap}
      .mh-real-nline__interval-wrap[data-enabled="1"] .mh-real-nline__interval{display:flex}
      .mh-real-nline__interval label{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;color:var(--muted)}
      @media(max-width:640px){
        .mh-real-nline{padding:11px}
        .mh-real-nline__stage{height:300px}
        .mh-real-nline input[type=text]{max-width:150px}
      }
    </style>
    <div class="mh-real-nline__head"><strong>↔ ${tr('title')}</strong><span class="mh-real-nline__hint">${tr('hint')}</span></div>
    <div class="mh-real-nline__controls">
      <input class="mh-rnl-input" type="text" inputmode="text" placeholder="${tr('input')} — ex. -3, 1/2, sqrt(2), pi">
      <button type="button" data-a="add">＋ ${tr('add')}</button>
      <button type="button" data-a="clear">${tr('clear')}</button>
    </div>
    <div class="mh-real-nline__error"></div>
    <div class="mh-real-nline__stage"><svg aria-label="${tr('title')}"></svg></div>
    <div class="mh-real-nline__selection"></div>
    <div><span style="color:var(--muted)">${tr('order')}:</span> <span class="mh-real-nline__order"></span></div>
    <div class="mh-real-nline__interval-wrap" data-enabled="0">
      <label><input class="mh-rnl-interval-enabled" type="checkbox"> <strong>${tr('interval')}</strong> — ${lang() === 'ro' ? 'afișează un interval' : 'show one interval'}</label>
      <div class="mh-real-nline__interval">
        <label>${tr('left')} <input class="mh-rnl-left" type="text" value="-2"></label>
        <label><input class="mh-rnl-left-unb" type="checkbox"> −∞</label>
        <label><input class="mh-rnl-left-closed" type="checkbox" checked> ${tr('closed')}</label>
        <label>${tr('right')} <input class="mh-rnl-right" type="text" value="3"></label>
        <label><input class="mh-rnl-right-unb" type="checkbox"> +∞</label>
        <label><input class="mh-rnl-right-closed" type="checkbox"> ${tr('closed')}</label>
      </div>
    </div>`;

    host.innerHTML = '';
    host.appendChild(root);

    const svg = root.querySelector('svg');
    const stage = root.querySelector('.mh-real-nline__stage');
    const input = root.querySelector('.mh-rnl-input');
    const error = root.querySelector('.mh-real-nline__error');
    const order = root.querySelector('.mh-real-nline__order');
    const selection = root.querySelector('.mh-real-nline__selection');

    const state = {
      points: [],
      nextId: 1,
      dragId: null,
      selectedGroupId: null,
      viewMin: -5,
      viewMax: 5,
      interval: {
        enabled: false,
        left: null,
        right: null,
        leftUnbounded: false,
        rightUnbounded: false,
        leftClosed: true,
        rightClosed: false
      }
    };

    const NS = 'http://www.w3.org/2000/svg';

    function E(tag, attrs = {}) {
      const element = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
      return element;
    }

    function dims() {
      const rect = stage.getBoundingClientRect();
      return {
        w: Math.max(320, rect.width),
        h: Math.max(220, rect.height),
        pad: 44,
        y: rect.height * 0.5
      };
    }

    function xOf(value, d) {
      return d.pad + (value - state.viewMin) / (state.viewMax - state.viewMin) * (d.w - 2 * d.pad);
    }

    function vOf(clientX, d) {
      const rect = stage.getBoundingClientRect();
      return state.viewMin + (clientX - rect.left - d.pad) / (d.w - 2 * d.pad) * (state.viewMax - state.viewMin);
    }

    function recomputeGroups() {
      let groupNumber = 1;
      state.points.forEach((point) => { point.equivalenceGroupId = null; });
      const sorted = [...state.points].sort((a, b) => a.approxValue - b.approxValue);
      for (let i = 0; i < sorted.length; i += 1) {
        if (sorted[i].equivalenceGroupId) continue;
        const groupId = `eq-${groupNumber++}`;
        sorted[i].equivalenceGroupId = groupId;
        for (let j = i + 1; j < sorted.length; j += 1) {
          if (equivalent(sorted[i], sorted[j])) sorted[j].equivalenceGroupId = groupId;
        }
      }
      if (state.selectedGroupId && !state.points.some((point) => point.equivalenceGroupId === state.selectedGroupId)) {
        state.selectedGroupId = null;
      }
    }

    function parseInterval() {
      const enabled = root.querySelector('.mh-rnl-interval-enabled').checked;
      const wrap = root.querySelector('.mh-real-nline__interval-wrap');
      wrap.dataset.enabled = enabled ? '1' : '0';
      const leftUnbounded = root.querySelector('.mh-rnl-left-unb').checked;
      const rightUnbounded = root.querySelector('.mh-rnl-right-unb').checked;
      const left = leftUnbounded ? null : parseNumber(root.querySelector('.mh-rnl-left').value);
      const right = rightUnbounded ? null : parseNumber(root.querySelector('.mh-rnl-right').value);
      state.interval = {
        enabled,
        left,
        right,
        leftUnbounded,
        rightUnbounded,
        leftClosed: root.querySelector('.mh-rnl-left-closed').checked,
        rightClosed: root.querySelector('.mh-rnl-right-closed').checked
      };
      return !enabled || ((leftUnbounded || left) && (rightUnbounded || right));
    }

    function fit() {
      const values = state.points.map((point) => point.approxValue);
      const I = state.interval;
      if (I.enabled && I.left) values.push(I.left.approxValue);
      if (I.enabled && I.right) values.push(I.right.approxValue);
      if (!values.length) {
        state.viewMin = -5;
        state.viewMax = 5;
        return;
      }
      let lo = Math.min(...values);
      let hi = Math.max(...values);
      if (lo === hi) {
        lo -= 2;
        hi += 2;
      }
      const span = Math.max(2, hi - lo);
      const margin = span * 0.24;
      state.viewMin = I.enabled && I.leftUnbounded ? Math.min(lo - margin, -5) : lo - margin;
      state.viewMax = I.enabled && I.rightUnbounded ? Math.max(hi + margin, 5) : hi + margin;
    }

    function compactGroupLabel(group) {
      if (group.length === 1) return group[0].displayLabel;
      return `${group[0].displayLabel}  ·  +${group.length - 1}`;
    }

    function fullGroupLabel(group) {
      return group.map((point) => point.displayLabel).join(' = ');
    }

    function renderSelection(groups) {
      if (!state.selectedGroupId || !groups.has(state.selectedGroupId)) {
        selection.innerHTML = `<span>${lang() === 'ro' ? 'Selectează sau trage un marker pentru detalii.' : 'Select or drag a marker for details.'}</span>`;
        return;
      }
      const group = groups.get(state.selectedGroupId);
      const value = group[0].approxValue;
      const exact = fullGroupLabel(group);
      const extra = group.length > 1 ? ` · ${group.length} ${tr('equivalents')}` : '';
      selection.innerHTML = `<strong>${tr('selected')}:</strong> ${exact} ≈ ${formatApprox(value)}${extra}`;
    }

    function draw() {
      parseInterval();
      recomputeGroups();
      fit();

      const d = dims();
      svg.setAttribute('viewBox', `0 0 ${d.w} ${d.h}`);
      svg.innerHTML = '';

      const css = getComputedStyle(root);
      const text = css.getPropertyValue('--text').trim() || '#ddd';
      const muted = css.getPropertyValue('--muted').trim() || '#999';
      const accent = css.getPropertyValue('--accent').trim() || '#7aa2ff';
      const card = css.getPropertyValue('--card').trim() || '#111';

      svg.append(E('line', { x1: d.pad, y1: d.y, x2: d.w - d.pad, y2: d.y, stroke: text, 'stroke-width': 2 }));
      svg.append(E('path', { d: `M ${d.w - d.pad} ${d.y} l -10 -6 v 12 z`, fill: text }));
      svg.append(E('path', { d: `M ${d.pad} ${d.y} l 10 -6 v 12 z`, fill: text }));

      const span = state.viewMax - state.viewMin;
      const rawStep = span / 8;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const choices = [1, 2, 5, 10];
      let step = choices.find((choice) => choice * magnitude >= rawStep) || 10 * magnitude;
      step *= magnitude === 0 ? 1 : 1;
      if (step > span) step = span / 4;
      const start = Math.ceil(state.viewMin / step) * step;

      for (let value = start; value <= state.viewMax + step * 0.2; value += step) {
        const x = xOf(value, d);
        svg.append(E('line', { x1: x, y1: d.y - 6, x2: x, y2: d.y + 6, stroke: muted, 'stroke-width': 1 }));
        const tick = E('text', { x, y: d.y + 24, fill: muted, 'font-size': 11, 'text-anchor': 'middle' });
        tick.textContent = formatApprox(value);
        svg.append(tick);
      }

      const I = state.interval;
      if (I.enabled && (I.leftUnbounded || I.left) && (I.rightUnbounded || I.right)) {
        const leftValue = I.leftUnbounded ? state.viewMin : I.left.approxValue;
        const rightValue = I.rightUnbounded ? state.viewMax : I.right.approxValue;
        if (leftValue <= rightValue) {
          const x1 = xOf(leftValue, d);
          const x2 = xOf(rightValue, d);
          svg.append(E('line', { x1, y1: d.y - 20, x2, y2: d.y - 20, stroke: accent, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.58 }));
          if (!I.leftUnbounded) svg.append(E('circle', { cx: x1, cy: d.y - 20, r: 7, fill: I.leftClosed ? accent : card, stroke: accent, 'stroke-width': 3 }));
          if (!I.rightUnbounded) svg.append(E('circle', { cx: x2, cy: d.y - 20, r: 7, fill: I.rightClosed ? accent : card, stroke: accent, 'stroke-width': 3 }));
          if (I.leftUnbounded) svg.append(E('path', { d: `M ${d.pad} ${d.y - 20} l 10 -6 v 12 z`, fill: accent }));
          if (I.rightUnbounded) svg.append(E('path', { d: `M ${d.w - d.pad} ${d.y - 20} l -10 -6 v 12 z`, fill: accent }));
        }
      }

      const groups = new Map();
      state.points.forEach((point) => {
        if (!groups.has(point.equivalenceGroupId)) groups.set(point.equivalenceGroupId, []);
        groups.get(point.equivalenceGroupId).push(point);
      });

      const positioned = [...groups.entries()]
        .map(([groupId, group]) => ({ groupId, group, value: group[0].approxValue, x: xOf(group[0].approxValue, d) }))
        .sort((a, b) => a.x - b.x);

      if (!positioned.length && !I.enabled) {
        const emptyLabel = E('text', { x: d.w / 2, y: d.y - 34, fill: muted, 'font-size': 13, 'text-anchor': 'middle' });
        emptyLabel.textContent = tr('emptyStage');
        svg.append(emptyLabel);
      }

      const laneY = [d.y - 42, d.y + 62, d.y - 78, d.y + 98];
      const laneRight = [-Infinity, -Infinity, -Infinity, -Infinity];

      positioned.forEach(({ groupId, group, value, x }) => {
        const labelText = compactGroupLabel(group);
        const estimatedWidth = Math.min(150, Math.max(42, labelText.length * 7.2));
        let lane = -1;
        for (let index = 0; index < laneRight.length; index += 1) {
          if (x - estimatedWidth / 2 > laneRight[index] + 10) {
            lane = index;
            break;
          }
        }
        if (lane < 0) lane = laneRight.indexOf(Math.min(...laneRight));
        laneRight[lane] = x + estimatedWidth / 2;

        const selected = state.selectedGroupId === groupId;
        const marker = E('circle', {
          cx: x,
          cy: d.y,
          r: selected ? 10 : 8,
          fill: selected ? card : accent,
          stroke: accent,
          'stroke-width': selected ? 4 : 2,
          'data-point-id': group[0].id,
          'data-group-id': groupId,
          style: 'cursor:grab'
        });
        const title = E('title');
        title.textContent = `${fullGroupLabel(group)} ≈ ${formatApprox(value)}`;
        marker.append(title);
        svg.append(marker);

        const labelY = laneY[lane];
        const connectorEndY = labelY < d.y ? labelY + 11 : labelY - 15;
        svg.append(E('line', {
          x1: x,
          y1: d.y + (labelY < d.y ? -11 : 11),
          x2: x,
          y2: connectorEndY,
          stroke: muted,
          'stroke-width': 1,
          opacity: 0.45,
          'pointer-events': 'none'
        }));

        const label = E('text', {
          x,
          y: labelY,
          fill: text,
          'font-size': 12,
          'font-weight': 700,
          'text-anchor': 'middle',
          'pointer-events': 'none'
        });
        label.textContent = labelText;
        svg.append(label);
      });

      const sorted = positioned.map(({ group }) => group);
      order.textContent = sorted.length ? sorted.map(fullGroupLabel).join(' < ') : tr('empty');
      renderSelection(groups);
    }

    function addParsed(point) {
      point.id = state.nextId++;
      state.points.push(point);
      error.textContent = '';
      draw();
    }

    function addRaw(raw) {
      const parsed = parseNumber(raw);
      if (!parsed) {
        error.textContent = tr('bad');
        return false;
      }
      addParsed(parsed);
      return true;
    }

    root.querySelector('[data-a=add]').onclick = () => {
      if (addRaw(input.value)) input.value = '';
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        root.querySelector('[data-a=add]').click();
      }
    });

    root.querySelector('[data-a=clear]').onclick = () => {
      state.points = [];
      state.selectedGroupId = null;
      draw();
    };

    root.querySelectorAll('.mh-real-nline__interval input, .mh-rnl-interval-enabled').forEach((element) => element.addEventListener('input', draw));

    svg.addEventListener('pointerdown', (event) => {
      const target = event.target.closest('[data-point-id]');
      if (!target) return;
      state.dragId = Number(target.getAttribute('data-point-id'));
      state.selectedGroupId = target.getAttribute('data-group-id');
      draw();
      svg.setPointerCapture?.(event.pointerId);
    });

    svg.addEventListener('pointermove', (event) => {
      if (!state.dragId) return;
      const point = state.points.find((candidate) => candidate.id === state.dragId);
      if (!point) return;
      const value = vOf(event.clientX, dims());
      point.rawInput = formatApprox(value);
      point.displayLabel = formatApprox(value);
      point.normalizedValue = { type: 'decimal', value };
      point.approxValue = value;
      point.exactKey = `n:${Number(value.toPrecision(14))}`;
      draw();
    });

    const stopDrag = () => { state.dragId = null; };
    svg.addEventListener('pointerup', stopDrag);
    svg.addEventListener('pointercancel', stopDrag);

    (options.initialPoints || []).forEach(addRaw);
    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(stage);
    instances.set(id, { root, resizeObserver });

    return { root, state, parseNumber };
  }

  function unmount(id) {
    const instance = instances.get(id);
    if (!instance) return;
    try { instance.resizeObserver.disconnect(); } catch {}
    try { instance.root.remove(); } catch {}
    instances.delete(id);
  }

  function autoMount() {
    document.querySelectorAll('[data-mh-real-numberline]').forEach((host, index) => {
      if (host.dataset.mhRealNumberlineMounted === '1' && host.querySelector('.mh-real-nline')) return;
      host.dataset.mhRealNumberlineMounted = '1';
      const id = host.dataset.mhRealNumberlineId || `mh-real-numberline-${index}`;
      mount(id, host, { initialPoints: [] });
    });
  }

  window.MH_RealNumberLine = { mount, unmount, parseNumber, autoMount };

  const observer = new MutationObserver(() => autoMount());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoMount();
      observer.observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  } else {
    autoMount();
    observer.observe(document.body, { childList: true, subtree: true });
  }
}());
