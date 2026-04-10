(function(){
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";

  // Namespace global
  window.MH_NumberLinePy = window.MH_NumberLinePy || (function(){
    const _instances = new Map();

    async function _ensurePyodide(){
      if (window.__mh_pyodide_loading) return window.__mh_pyodide_loading;
      if (window.pyodide) return window.pyodide;
      window.__mh_pyodide_loading = (async()=>{
        await new Promise((res,rej)=>{
          const s = document.createElement('script');
          s.src = PYODIDE_URL; s.defer = true;
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" });
        return (window.pyodide = py);
      })();
      return window.__mh_pyodide_loading;
    }

    function getNLang() {
      const lang = String(document.documentElement.lang || window.LANG || "ro").toLowerCase();
      return lang.startsWith("en") ? "en" : "ro";
    }

    const NL_I18N = {
      ro: {
        aria: "Axa numerelor • joc didactic",
        max: "Max:",
        step: "Pas:",
        grid: "grilaj",
        even: "pare",
        odd: "impare",
        snap: "snap",
        trace: "urme",
        hops: "hopuri",
        progress: "bară progres",
        fx: "✨ efect",
        nextEven: "Urm. par",
        nextOdd: "Urm. impar",
        play: "▶︎ Pornește",
        pause: "⏸ Pauză",
        speed: "Viteză:",
        scene: "Scenă:",
        classic: "clasic",
        train: "tren",
        plane: "avion",
        resetView: "Reset view",
        reset: "Reset",
        target: "🎲 Țintă",
        steps: "pași:",
        guessMode: "ghicește numărul",
        metronome: "metronom",
        redMarker: "marker roșu",
        setRed: "Setează roșu = curent",
        compare: "Compară",
        export: "💾 Salvează PNG",
        replay: "▶︎ Replay",
        game20: "⏱ Joc 20s",
        score: "scor:",
        hint: "Click pe axă pentru sărit • rotiță: zoom • drag: pan • taste: ←/→, P (par), I (impar), Space (play/pause), Z/X (zoom ±), R (replay)",
        evenShort: "PAR",
        oddShort: "IMPAR",
        evenLower: "par",
        oddLower: "impar",
        guessHigher: "↑ mai mare",
        guessLower: "↓ mai mic",
        guessExact: "✓ exact"
      },
      en: {
        aria: "Number line • educational game",
        max: "Max:",
        step: "Step:",
        grid: "grid",
        even: "even",
        odd: "odd",
        snap: "snap",
        trace: "traces",
        hops: "hops",
        progress: "progress bar",
        fx: "✨ effect",
        nextEven: "Next even",
        nextOdd: "Next odd",
        play: "▶︎ Start",
        pause: "⏸ Pause",
        speed: "Speed:",
        scene: "Scene:",
        classic: "classic",
        train: "train",
        plane: "plane",
        resetView: "Reset view",
        reset: "Reset",
        target: "🎲 Target",
        steps: "steps:",
        guessMode: "guess the number",
        metronome: "metronome",
        redMarker: "red marker",
        setRed: "Set red = current",
        compare: "Compare",
        export: "💾 Save PNG",
        replay: "▶︎ Replay",
        game20: "⏱ 20s game",
        score: "score:",
        hint: "Click the line to jump • wheel: zoom • drag: pan • keys: ←/→, P (even), I (odd), Space (play/pause), Z/X (zoom ±), R (replay)",
        evenShort: "EVEN",
        oddShort: "ODD",
        evenLower: "even",
        oddLower: "odd",
        guessHigher: "↑ higher",
        guessLower: "↓ lower",
        guessExact: "✓ exact"
      }
    };

    function nlt(key) {
      const lang = getNLang();
      return NL_I18N[lang]?.[key] ?? NL_I18N.ro[key] ?? key;
    }

    function _html(){
      const L = NL_I18N[getNLang()];

      return `
    <div class="mh-nline" style="outline:none" tabindex="0" aria-label="${L.aria}">
      <style>
        .mh-nline .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
        .mh-nline .btn.small{padding:.45rem .7rem;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer}
        .mh-nline .legend{opacity:.85}
        .mh-nline .pill{display:inline-flex;align-items:center;gap:6px;padding:.25rem .6rem;border-radius:999px;background:var(--card);border:1px solid var(--border);font-size:.9em}
        .mh-nline .bad{color:var(--bad)}
        .mh-nline .ok{color:var(--ok)}
        .mh-nline .warn{color:var(--warn)}
        .mh-nline .panel{display:flex;gap:10px;flex-wrap:wrap;margin:.4rem 0}
        .mh-nline .sep{flex:0 0 100%;height:1px;background:var(--border);opacity:.6;margin:.2rem 0}
        .mh-nline .cmp{font-variant-numeric:tabular-nums}
      </style>

      <div class="row">
        <button type="button" class="btn small" data-act="dec" title="←">−</button>
        <div class="counter"><span>🔵</span>&nbsp;<b class="val">0</b> <small class="parity" style="opacity:.8"></small></div>
        <button type="button" class="btn small" data-act="inc" title="→">+</button>

        <span class="legend">${L.max}</span>
        <input type="number" class="max" min="5" max="2000" value="20"
          style="width:84px;padding:6px 8px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text)">

        <span class="legend">${L.step}</span>
        <input type="number" class="step" min="1" max="200" value="1"
          style="width:70px;padding:6px 8px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text)">

        <label class="legend"><input type="checkbox" class="grid" checked> ${L.grid}</label>
        <label class="legend"><input type="checkbox" class="even" checked> ${L.even}</label>
        <label class="legend"><input type="checkbox" class="odd" checked> ${L.odd}</label>
        <label class="legend"><input type="checkbox" class="snap"> ${L.snap}</label>
        <label class="legend"><input type="checkbox" class="trace" checked> ${L.trace}</label>
        <label class="legend"><input type="checkbox" class="hops" checked> ${L.hops}</label>
        <label class="legend"><input type="checkbox" class="progress" checked> ${L.progress}</label>
        <label class="legend"><input type="checkbox" class="fx" checked> ${L.fx}</label>
      </div>

      <div class="row">
        <button type="button" class="btn small" data-act="nextEven" title="P">${L.nextEven}</button>
        <button type="button" class="btn small" data-act="nextOdd"  title="I">${L.nextOdd}</button>

        <button type="button" class="btn small" data-act="play" title="Space">${L.play}</button>
        <span class="legend">${L.speed}</span>
        <input type="range" class="speed" min="150" max="1500" step="50" value="650">

        <span class="legend">${L.scene}</span>
        <select class="scene">
          <option value="classic">${L.classic}</option>
          <option value="train">${L.train}</option>
          <option value="plane">${L.plane}</option>
        </select>

        <button type="button" class="btn small" data-act="zoomIn" title="Z">🔍+</button>
        <button type="button" class="btn small" data-act="zoomOut" title="X">🔍−</button>
        <button type="button" class="btn small" data-act="resetView">${L.resetView}</button>

        <button type="button" class="btn small" data-act="reset">${L.reset}</button>
      </div>

      <div class="row">
        <button type="button" class="btn small" data-act="dice">🎲</button>
        <span class="pill target pill-target"><b class="tgt">—</b></span>
        <span class="pill stepsLeft">${L.steps} <b class="toGoal">—</b></span>
        <label class="legend"><input type="checkbox" class="guessMode"> ${L.guessMode}</label>
        <label class="legend"><input type="checkbox" class="metronome"> ${L.metronome}</label>
      </div>

      <div class="row">
        <label class="legend"><input type="checkbox" class="showM2"> ${L.redMarker}</label>
        <button type="button" class="btn small" data-act="copyToM2">${L.setRed}</button>
        <span class="pill cmp">🔵 ? 🔴</span>

        <button type="button" class="btn small" data-act="export">${L.export}</button>
        <button type="button" class="btn small" data-act="replay">${L.replay}</button>
        <button type="button" class="btn small" data-act="game20">${L.game20}</button>
        <span class="pill score">${L.score} <b class="sc">0</b></span>
      </div>

      <div class="hint" style="font-size:.9em;opacity:.8;margin-bottom:6px">
        ${L.hint}
      </div>

      <div style="position:relative">
        <canvas class="canvas" width="900" height="220"
          style="width:100%;max-width:100%;border:1px dashed var(--border);border-radius:12px;background:var(--card)"></canvas>
        <div class="tt" style="position:absolute;inset:auto auto 8px 8px;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.35);color:#fff;font:12px system-ui;pointer-events:none;backdrop-filter:blur(2px);display:none"></div>
      </div>
    </div>`;
    }

    // —— Python  ——
    const PY_CODE = `
      from js import window
      import math

      def _css(canvas, varname, fallback):
          try:
              v = window.getComputedStyle(canvas).getPropertyValue(varname)
              return v if v and v.strip() else fallback
          except Exception:
              return fallback

      def _arrow(ctx, x, y, dir, size, color):
          ctx.beginPath(); ctx.moveTo(x, y)
          ctx.lineTo(x - dir*size, y - size*0.6)
          ctx.lineTo(x - dir*size, y + size*0.6)
          ctx.closePath(); ctx.fillStyle = color; ctx.fill()

      def _burst(ctx, x, y, color):
          ctx.save(); ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2
          rays = 12; r1, r2 = 10, 22
          for i in range(rays):
              ang = (2*math.pi) * i / rays
              cx1 = x + r1*math.cos(ang); cy1 = y + r1*math.sin(ang)
              cx2 = x + r2*math.cos(ang); cy2 = y + r2*math.sin(ang)
              ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2)
          ctx.stroke(); ctx.restore()

      def _draw_marker_shape(ctx, theme, x, y, color):
          ctx.save()
          if theme == "train":
              # locomotivă simplă
              ctx.fillStyle = color
              ctx.fillRect(x-12, y-14, 24, 18)
              ctx.beginPath(); ctx.arc(x-7, y+6, 3, 0, 2*math.pi); ctx.arc(x+7, y+6, 3, 0, 2*math.pi); ctx.fill()
              ctx.fillRect(x+12, y-10, 6, 10)
          elif theme == "plane":
              # avion stilizat
              ctx.beginPath()
              ctx.moveTo(x, y-18); ctx.lineTo(x-10, y+4); ctx.lineTo(x+10, y+4); ctx.closePath()
              ctx.fillStyle = color; ctx.fill()
              ctx.fillRect(x-2, y+4, 4, 10)
          else:
              # bulină clasică
              ctx.beginPath(); ctx.arc(x, y-10, 6, 0, 2*math.pi); ctx.fillStyle = color; ctx.fill()
          ctx.restore()

      def _scene_train(ctx, w, h, y, col_axis, col_muted):
          # șine
          ctx.beginPath(); ctx.moveTo(36, y-8); ctx.lineTo(w-36, y-8)
          ctx.moveTo(36, y+8); ctx.lineTo(w-36, y+8)
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke()
          # umbră șine
          ctx.beginPath(); ctx.moveTo(36, y-8); ctx.lineTo(w-36, y-8)
          ctx.moveTo(36, y+8); ctx.lineTo(w-36, y+8)
          ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.stroke()

      def _cloud(ctx, x, y, r):
          for dx in (-r, 0, r):
              ctx.beginPath(); ctx.arc(x+dx*0.6, y, r*0.7, 0, 2*math.pi); ctx.fill()
          ctx.beginPath(); ctx.arc(x, y-r*0.2, r, 0, 2*math.pi); ctx.fill()

      def _scene_plane(ctx, w, h):
          # cer (overlay discret pentru a nu strica tema site-ului)
          try:
              grad = ctx.createLinearGradient(0,0,0,h)
              grad.addColorStop(0, "rgba(135,206,250,0.25)")
              grad.addColorStop(1, "rgba(255,255,255,0.0)")
              ctx.fillStyle = grad; ctx.fillRect(0,0,w,h)
          except Exception:
              pass
          # nori
          ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.5)"
          _cloud(ctx, w*0.18, h*0.28, 16)
          _cloud(ctx, w*0.45, h*0.20, 14)
          _cloud(ctx, w*0.72, h*0.30, 18)
          ctx.restore()

      def _draw(args):
          canvas = args["canvas"]; ctx = args["ctx"]
          w = canvas.width; h = canvas.height
          ctx.clearRect(0,0,w,h)

          col_axis   = _css(canvas,'--text',   '#e8ebff')
          col_accent = _css(canvas,'--accent', '#7aa2ff')
          col_muted  = _css(canvas,'--muted',  '#9aa2c7')
          col_even   = _css(canvas,'--ok',     '#6ee7b7')
          col_odd    = _css(canvas,'--warn',   '#f0abfc')
          col_m2     = _css(canvas,'--bad',    '#f87171')

          maxn       = int(args["max"])
          step       = max(1, int(args["step"]))
          cur        = float(args["cur"])
          cur2       = args.get("cur2", None)
          show_m2    = bool(args.get("show_m2", False))
          show_grid  = bool(args["grid"])
          show_even  = bool(args["show_even"])
          show_odd   = bool(args["show_odd"])
          show_land  = bool(args.get("landmarks", True))
          show_labels= bool(args.get("labels", True))
          show_trace = bool(args.get("trace", True))
          show_hops  = bool(args.get("hops", True))
          show_prog  = bool(args.get("progress", True))
          burst      = bool(args["burst"])
          scene      = args.get("scene","classic")
          theme      = args.get("theme","classic")
          pulse_r    = float(args.get("pulse_r", 0.0))
          trail      = args.get("trail", [])
          hops       = args.get("hopsList", [])
          quizParity = bool(args.get("quiz_parity", False))
          guessMode  = bool(args.get("guess_mode", False))
          vmin       = float(args.get("view_min", 0.0))
          vmax       = float(args.get("view_max", float(maxn)))

          pad = 36; y = h//2
          usable = (w - 2*pad)
          visible = max(1.0, vmax - vmin)
          spacing = usable / visible

          # decor scenă
          if scene == "train":
              _scene_train(ctx, w, h, y, col_axis, col_muted)
          elif scene == "plane":
              _scene_plane(ctx, w, h)

          # axa / linia de referință
          if scene == "classic" or scene == "plane":
              ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w-pad, y)
              ctx.strokeStyle = col_axis; ctx.lineWidth = 2; ctx.stroke()
              _arrow(ctx, w-pad, y, +1, 12, col_axis)

          # repere mari (din 5 în 5) – doar dacă nu e guessMode
          if show_land and not guessMode:
              start = int(max(0, math.floor(vmin)))
              end   = int(min(maxn, math.ceil(vmax)))
              for i in range(start, end+1, 5):
                  x = pad + (i - vmin) * spacing
                  ctx.beginPath(); ctx.moveTo(x, y-16); ctx.lineTo(x, y+16)
                  ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.stroke()

          # grilaj + gradații
          if show_grid:
              try: ctx.setLineDash([4,4])
              except Exception: pass
          start = int(max(0, math.floor(vmin)))
          end   = int(min(maxn, math.ceil(vmax)))
          for i in range(start, end+1):
              x = pad + (i - vmin) * spacing
              if show_grid and i % (step*5) == 0:
                  ctx.beginPath(); ctx.moveTo(x, y-40); ctx.lineTo(x, y+40)
                  ctx.lineWidth = 1; ctx.strokeStyle = col_muted; ctx.stroke()

              try: ctx.setLineDash([])
              except Exception: pass

              ctx.beginPath()
              if scene == "train":
                  # traverse (mai late), colorăm pe par/impar
                  ctx.moveTo(x, y-14); ctx.lineTo(x, y+14); ctx.lineWidth = 3
              else:
                  ctx.moveTo(x, y-8); ctx.lineTo(x, y+8); ctx.lineWidth = 2

              if quizParity:
                  ctx.strokeStyle = col_axis
              else:
                  if (i % 2 == 0 and show_even): ctx.strokeStyle = col_even
                  elif (i % 2 == 1 and show_odd): ctx.strokeStyle = col_odd
                  else: ctx.strokeStyle = col_axis
              ctx.stroke()

          # etichete
          if show_labels and not guessMode:
              ctx.fillStyle = col_muted; ctx.font = "14px system-ui"; ctx.textAlign = "center"
              for i in range(start, end+1, step*5):
                  x = pad + (i - vmin) * spacing; ctx.fillText(str(i), x, y+28)

          # urme
          if show_trace and trail:
              try:
                  ctx.save()
                  for idx, n in enumerate(trail):
                      nclip = max(0.0, min(float(maxn), float(n)))
                      if nclip < vmin or nclip > vmax: continue
                      tx = pad + (nclip - vmin)*spacing
                      alpha = max(0.12, 0.1 + 0.7*(idx+1)/max(1,len(trail)))
                      try: ctx.globalAlpha = alpha
                      except Exception: pass
                      ctx.beginPath(); ctx.arc(tx, y-40, 3, 0, 2*math.pi)
                      ctx.fillStyle = col_accent; ctx.fill()
                  try: ctx.globalAlpha = 1.0
                  except Exception: pass
                  ctx.restore()
              except Exception:
                  pass

          # hopuri
          if show_hops and hops:
              ctx.save()
              ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5
              for (a,b) in hops:
                  a = max(0.0, min(float(maxn), float(a)))
                  b = max(0.0, min(float(maxn), float(b)))
                  if (a < vmin and b < vmin) or (a > vmax and b > vmax): continue
                  x1 = pad + (a - vmin)*spacing; x2 = pad + (b - vmin)*spacing
                  xm = (x1 + x2)/2; r = max(12, abs(x2-x1)/2)
                  ctx.beginPath()
                  ctx.moveTo(x1, y); ctx.quadraticCurveTo(xm, y- r, x2, y)
                  ctx.stroke()
              ctx.restore()

          # marker curent
          cur_clip = max(0.0, min(float(maxn), cur))
          cx = pad + (cur_clip - vmin) * spacing
          cur_int = int(round(cur_clip))
          cur_even = (cur_int % 2 == 0)
          col_marker = col_even if cur_even else col_odd
          if quizParity: col_marker = col_accent

          # progres
          if show_prog:
              ctx.beginPath(); ctx.fillStyle = "rgba(122,162,255,0.18)"
              left = pad + max(0.0, (0.0 - vmin)) * spacing
              ctx.fillRect(left, y+36, max(0, cx-left), 10)

          # linie verticală + marker
          ctx.beginPath(); ctx.moveTo(cx, y-30); ctx.lineTo(cx, y+30)
          ctx.lineWidth = 3; ctx.strokeStyle = col_marker; ctx.stroke()

          if args.get("pulse_on", False) and float(args.get("pulse_r",0.0)) > 0.0:
              pr = float(args.get("pulse_r",0.0))
              ctx.beginPath(); ctx.arc(cx, y-12, 8 + pr, 0, 2*math.pi)
              ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; ctx.stroke()

          try: ctx.shadowColor = col_marker; ctx.shadowBlur = 12
          except Exception: pass
          _draw_marker_shape(ctx, theme, cx, y-4, col_marker)
          try: ctx.shadowBlur = 0
          except Exception: pass

          # marker roșu
          cur2v = args.get("cur2", None)
          if show_m2 and cur2v is not None:
              c2 = max(0.0, min(float(maxn), float(cur2v)))
              cx2 = pad + (c2 - vmin) * spacing
              ctx.beginPath(); ctx.moveTo(cx2, y-24); ctx.lineTo(cx2, y+24)
              ctx.lineWidth = 3; ctx.strokeStyle = col_m2; ctx.stroke()
              _draw_marker_shape(ctx, theme, cx2, y-10, col_m2)

          # efect de "burst"
          if burst:
              _burst(ctx, cx, y-12, col_marker)

      def api_draw_full(id, canvas, ctx, args):
          _draw(args)
    `;

    function _ceilToNice(v, step){
      const block = Math.max(5, 5 * Math.max(1, step));
      return Math.ceil(v / block) * block;
    }
    const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeOutBack = t => { const c1=1.70158,c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); };

    async function mount(id, host){
      if (!host) throw new Error('MH_NumberLinePy.mount: host lipsă');
      if (_instances.has(id)) unmount(id);

      host.innerHTML = _html();
      const el = {
        wrap: host.querySelector('.mh-nline'),
        canvas: host.querySelector('canvas.canvas'),
        val: host.querySelector('.val'),
        parity: host.querySelector('.parity'),
        max: host.querySelector('input.max'),
        step: host.querySelector('input.step'),
        grid: host.querySelector('input.grid'),
        even: host.querySelector('input.even'),
        odd: host.querySelector('input.odd'),
        snap: host.querySelector('input.snap'),
        trace: host.querySelector('input.trace'),
        hops: host.querySelector('input.hops'),
        progress: host.querySelector('input.progress'),
        fx: host.querySelector('input.fx'),
        btnInc: host.querySelector('[data-act="inc"]'),
        btnDec: host.querySelector('[data-act="dec"]'),
        btnReset: host.querySelector('[data-act="reset"]'),
        btnNextEven: host.querySelector('[data-act="nextEven"]'),
        btnNextOdd: host.querySelector('[data-act="nextOdd"]'),
        btnPlay: host.querySelector('[data-act="play"]'),
        speed: host.querySelector('input.speed'),
        tt: host.querySelector('.tt'),
        scene: host.querySelector('select.scene'),
        btnZoomIn: host.querySelector('[data-act="zoomIn"]'),
        btnZoomOut: host.querySelector('[data-act="zoomOut"]'),
        btnResetView: host.querySelector('[data-act="resetView"]'),
        btnExport: host.querySelector('[data-act="export"]'),
        btnReplay: host.querySelector('[data-act="replay"]'),
        btnGame20: host.querySelector('[data-act="game20"]'),
        score: host.querySelector('.sc'),
        btnDice: host.querySelector('[data-act="dice"]'),
        tgtPill: host.querySelector('.tgt'),
        toGoal: host.querySelector('.toGoal'),
        guessMode: host.querySelector('.guessMode'),
        metronome: host.querySelector('.metronome'),
        showM2: host.querySelector('.showM2'),
        btnCopyM2: host.querySelector('[data-act="copyToM2"]'),
        cmp: host.querySelector('.cmp'),
      };
      const ctx = el.canvas.getContext('2d');

      const defaults = {
        max: 20, step: 1, grid: true, even:true, odd:true,
        snap:false, trace:true, hops:true, progress:true, fx:true, speed:650,
        scene:'classic'
      };

      const state = {
        cur: 0, cur2: null, showM2:false,
        max: defaults.max, step: defaults.step, userSetMax: false,
        showEven: defaults.even, showOdd: defaults.odd,
        snap: defaults.snap, trace: defaults.trace, hops: defaults.hops,
        progress: defaults.progress, fx: defaults.fx,
        burstOnce: false, playing: false,
        trail: [], hopsList: [],
        target: null, guessMode: false,
        metronome:false, pulseR:0,
        scene: defaults.scene, theme: 'classic',
        viewMin: 0, viewMax: defaults.max,
        game:{ on:false, t0:0, visited:new Set(), timer:null },
        replaying:false
      };

      const py = await _ensurePyodide();
      try{
        await py.runPythonAsync(PY_CODE);
      }catch(err){
        console.error('[NumberLinePy] Eroare Pyodide:', err);
        host.insertAdjacentHTML('beforeend', `<div class="legend bad" style="margin-top:8px;color:var(--bad)">Eroare la încărcarea animației.</div>`);
      }

      function parityTextOf(n){
        return (Math.round(n) % 2 === 0) ? nlt("evenShort") : nlt("oddShort");
      }

      function ensureRoomAhead(target, {force=false} = {}){
        if (!force && state.userSetMax) return;

        const st = +el.step.value || 1;
        const prevMax = state.max;
        const desired = Math.max(state.cur, target ?? state.cur) + 2*st;

        if (desired > state.max){
          state.max = _ceilToNice(desired, st);
          if (state.viewMax >= (prevMax - 1)) state.viewMax = state.max;
          el.max.value = String(state.max);
        }
      }

      const snapToStep = n => state.snap ? Math.round(n / (+el.step.value||1)) * (+el.step.value||1) : n;

      function themeForScene(scene){
        if (scene === 'train') return 'train';
        if (scene === 'plane') return 'plane';
        return 'classic';
      }

      function draw(){
        el.val.textContent = String(Math.round(state.cur));
        el.parity.textContent = state.guessMode ? '' : `(${parityTextOf(state.cur).toLowerCase()})`;
        el.max.value = String(state.max);

        let cmpTxt = '🔵 ? 🔴';
        if (state.showM2 && Number.isFinite(state.cur2)){
          const a = Math.round(state.cur), b = Math.round(state.cur2);
          const sym = (a<b) ? '<' : (a>b) ? '>' : '=';
          cmpTxt = `🔵 ${sym} 🔴  (dist=${Math.abs(a-b)})`;
        }
        el.cmp.textContent = cmpTxt;

        if (Number.isFinite(state.target)){
          const st = +el.step.value || 1;
          const diff = Math.abs(Math.round(state.target) - Math.round(state.cur));
          el.toGoal.textContent = String(Math.ceil(diff / st));
          el.tgtPill.textContent = state.guessMode ? '❓' : String(state.target);
        } else { el.toGoal.textContent = '—'; el.tgtPill.textContent = '—'; }

        if (!py){ return; }

        try{
          const args = {
            canvas: el.canvas, ctx,
            cur: state.cur, cur2: state.cur2, show_m2: state.showM2,
            max: state.max, step: +el.step.value||1,
            grid: !!el.grid.checked, show_even: !!state.showEven, show_odd: !!state.showOdd,
            burst: !!state.burstOnce && !!state.fx,
            trace: !!state.trace, trail: state.trace ? state.trail : [],
            hops: !!state.hops, hopsList: state.hops ? state.hopsList : [],
            progress: !!state.progress, landmarks: true, labels: !state.guessMode,
            scene: state.scene, theme: themeForScene(state.scene),
            pulse_on: !!state.metronome, pulse_r: state.pulseR,
            quiz_parity: false, guess_mode: !!state.guessMode,
            view_min: state.viewMin, view_max: state.viewMax
          };
          const pyArgs = py.toPy(args);
          py.globals.get('api_draw_full')(id, el.canvas, ctx, pyArgs);
          if (pyArgs.destroy) pyArgs.destroy();
        }catch(err){ console.error('[NumberLinePy] draw error:', err); }
        state.burstOnce = false;
      }

      function onArrive(prevInt){
        const n = Math.round(state.cur);
        if (!state.trail.length || state.trail[state.trail.length-1] !== n){
          state.trail.push(n);
          if (state.trail.length > 30) state.trail.shift();
        }
      }
      function addHop(a,b){ if (a!==b){ state.hopsList.push([Math.round(a), Math.round(b)]); if (state.hopsList.length>16) state.hopsList.shift(); } }

      let anim = null;
      function animateTo(target, {dur=280, recordHop=true, forceGrow=false} = {}){
        target = snapToStep(target);
        ensureRoomAhead(target, {force: forceGrow});
        target = clamp(target, 0, state.max);
        const was = Math.round(state.cur);
        const from = state.cur, to = target;
        if (recordHop) addHop(from, to);
        if (from === to) { onArrive(); draw(); return; }
        const start = performance.now();
        anim && cancelAnimationFrame(anim);
        function stepFrame(now){
            const t = clamp((now - start)/dur, 0, 1);
            const p = (to > from) ? easeOutBack(t) : easeOutCubic(t);
            state.cur = from + (to - from) * p;
            draw();
        if (t < 1){ anim = requestAnimationFrame(stepFrame); }
        else { state.cur = to; onArrive(was); state.burstOnce = true; draw(); }
        }
        anim = requestAnimationFrame(stepFrame);
        }

      function tickPlay()
      { 
        if (state.playing){ const st=+el.step.value||1; animateTo(Math.round(state.cur)+st, {forceGrow:true}); } 
      }
      let playTimer = null; 
      function resetPlayTimer()
      { 
        if (playTimer) clearInterval(playTimer); playTimer = setInterval(tickPlay, +el.speed.value || 650); 
      }
      function updatePlayButton()
      {
        el.btnPlay.textContent = state.playing ? nlt("pause") : nlt("play");
      }

      let pulseRAF=null, pulse_t=0;
      function startPulse()
      { 
        cancelPulse(); pulse_t=0; const loop=()=>{ pulse_t+=0.08; state.pulseR=6*(0.5+0.5*Math.sin(pulse_t)); pulseRAF=requestAnimationFrame(loop); draw(); }; pulseRAF=requestAnimationFrame(loop); 
      }
      function cancelPulse()
      { 
        if (pulseRAF) cancelAnimationFrame(pulseRAF), pulseRAF=null;
      }

      function viewLen()
      { 
        return Math.max(1, state.viewMax - state.viewMin); 
      }
      function zoomAt(factor, centerN)
      {
        const len = viewLen();
        let newLen = clamp(len / factor, 5, Math.max(5, state.max)); 
        let c = clamp(centerN, 0, state.max);
        let vmin = c - (newLen/2), vmax = c + (newLen/2);
        if (vmin < 0){ vmax -= vmin; vmin = 0; }
        if (vmax > state.max){ vmin -= (vmax - state.max); vmax = state.max; vmin = Math.max(0, vmin); }
        state.viewMin = Math.max(0, vmin); state.viewMax = Math.max(state.viewMin+1, vmax);
        draw();
      }
      function unitAtCanvasX(x)
      {
        const rect = el.canvas.getBoundingClientRect(); const scale = el.canvas.width / rect.width;
        const px = (x - rect.left) * scale; const pad = 36;
        const usable = el.canvas.width - 2*pad;
        const len = viewLen(); const spacing = usable / len;
        return state.viewMin + clamp((px - pad) / spacing, 0, len);
      }
      function panUnits(deltaUnits)
      {
        let vmin = clamp(state.viewMin + deltaUnits, 0, state.max);
        let vmax = clamp(state.viewMax + deltaUnits, 0, state.max);
        const len = viewLen();
        if (vmax - vmin < len){ 
          if (vmin <= 0){ vmin = 0; vmax = len; }
          if (vmax >= state.max){ vmax = state.max; vmin = state.max - len; }
        }
        state.viewMin = Math.max(0, vmin); state.viewMax = Math.min(state.max, vmax);
        draw();
      }

      el.btnReset.addEventListener('click', ()=>{
        state.cur = 0; state.trail = []; state.hopsList = [];
        state.target = null; state.guessMode = false;
        state.max = defaults.max; state.userSetMax = false; el.max.value = String(defaults.max);
        el.step.value = String(defaults.step);
        el.grid.checked = defaults.grid;
        state.showEven = defaults.even; el.even.checked = defaults.even;
        state.showOdd  = defaults.odd;  el.odd.checked  = defaults.odd;
        state.snap     = defaults.snap; el.snap.checked = defaults.snap;
        state.trace    = defaults.trace;el.trace.checked= defaults.trace;
        state.hops     = defaults.hops; el.hops.checked = defaults.hops;
        state.progress = defaults.progress; el.progress.checked = defaults.progress;
        state.fx       = defaults.fx;   el.fx.checked   = defaults.fx;
        state.scene    = defaults.scene; el.scene.value = defaults.scene;
        state.showM2=false; el.showM2.checked=false; state.cur2=null;
        state.playing=false; updatePlayButton();
        cancelPulse(); state.metronome=false; el.metronome.checked=false; state.pulseR=0;
        state.viewMin = 0; state.viewMax = state.max;
        draw(); resetPlayTimer();
      });

      function repeatPress(direction)
      {
        const st = +el.step.value || 1; let speed = 300, acc = 0.85, min = 40, alive=true;
        function go(){ if (!alive) return; animateTo(Math.round(state.cur)+direction*st,{dur:180, forceGrow:true}); speed=Math.max(min,speed*acc); t=setTimeout(go,speed); }
        let t = setTimeout(go, speed); return ()=>{ alive=false; clearTimeout(t); };
      }
      let stopHold=null;
      el.btnInc.addEventListener('click', ()=>{ const st=+el.step.value||1; animateTo(Math.round(state.cur)+st, {forceGrow:true}); });
      el.btnDec.addEventListener('click', ()=>{ const st=+el.step.value||1; animateTo(Math.round(state.cur)-st, {forceGrow:true}); });
      ['mouseup','mouseleave','blur'].forEach(ev=>{ el.wrap.addEventListener(ev, ()=>{ if(stopHold){stopHold(); stopHold=null;} }); });
      el.btnInc.addEventListener('click', ()=>{ const st=+el.step.value||1; animateTo(Math.round(state.cur)+st); });
      el.btnDec.addEventListener('click', ()=>{ const st=+el.step.value||1; animateTo(Math.round(state.cur)-st); });
      el.btnNextEven.addEventListener('click', ()=>{ const n=Math.round(state.cur); animateTo((n%2===0)?n+2:n+1, {forceGrow:true}); });
      el.btnNextOdd .addEventListener('click', ()=>{ const n=Math.round(state.cur); animateTo((n%2===1)?n+2:n+1, {forceGrow:true}); });
      el.btnPlay.addEventListener('click', ()=>{ state.playing=!state.playing; updatePlayButton(); });

      el.speed.addEventListener('input', resetPlayTimer); resetPlayTimer();

      el.scene.addEventListener('change', ()=>{ state.scene = el.scene.value; draw(); });

      el.btnZoomIn.addEventListener('click', ()=>{ zoomAt(1.25, state.cur); });
      el.btnZoomOut.addEventListener('click', ()=>{ zoomAt(1/1.25, state.cur); });
      el.btnResetView.addEventListener('click', ()=>{ state.viewMin=0; state.viewMax=state.max; draw(); });

      el.btnDice.addEventListener('click', ()=>{ const min=0, max=state.max; state.target = Math.floor(Math.random()*(max-min+1))+min; draw(); });
      el.guessMode.addEventListener('change', ()=>{ state.guessMode = el.guessMode.checked; draw(); });
      el.metronome.addEventListener('change', ()=>{ state.metronome = el.metronome.checked; if (state.metronome) startPulse(); else cancelPulse(); draw(); });

      el.grid.addEventListener('change', draw);
      el.hops.addEventListener('change', ()=>{ state.hops = el.hops.checked; draw(); });
      el.progress.addEventListener('change', ()=>{ state.progress = el.progress.checked; draw(); });
      el.even.addEventListener('change', ()=>{ state.showEven = el.even.checked; draw(); });
      el.odd .addEventListener('change', ()=>{ state.showOdd  = el.odd.checked;  draw(); });
      el.snap.addEventListener('change', ()=>{ state.snap = el.snap.checked; });
      el.trace.addEventListener('change',()=>{ state.trace = el.trace.checked; draw(); });

      el.max.addEventListener('input', ()=>{
        let v = Math.max(5, Math.min(2000, +el.max.value||20));
        state.max = v; if (Math.round(state.cur) > v) state.cur = v;
        state.userSetMax = true; state.viewMax = Math.max(state.viewMin+1, Math.min(state.viewMax, v)); draw();
      });
      el.step.addEventListener('input', ()=>{
        let v = Math.max(1, Math.min(200, +el.step.value||1));
        el.step.value = String(v);
        if (!state.userSetMax) {
          const st = +el.step.value || 1;
          const wanted = Math.max(state.cur, state.cur + 2*st);
          if (wanted > state.max) state.max = Math.ceil(wanted / (5*st)) * 5*st;
          state.viewMax = state.max;
        }
        draw();
      });

      el.showM2.addEventListener('change', ()=>{ state.showM2 = el.showM2.checked; draw(); });
      el.btnCopyM2.addEventListener('click', ()=>{ state.cur2 = Math.round(state.cur); state.showM2 = true; el.showM2.checked = true; draw(); });

      el.btnExport.addEventListener('click', ()=>{
        try{ const a = document.createElement('a'); a.download='axa-numerelor.png'; a.href=el.canvas.toDataURL('image/png'); a.click(); }
        catch(e){ console.error(e); }
      });

      el.btnReplay.addEventListener('click', ()=>{
        if (state.replaying || state.trail.length < 2) return;
        state.replaying = true;
        const seq = state.trail.slice();
        let i = 0;
        const stepNext = ()=>{
          if (i >= seq.length){ state.replaying=false; return; }
          const target = seq[i++];
          animateTo(target, {dur:280, recordHop:false});
          setTimeout(stepNext, 300);
        };
        stepNext();
      });

      el.btnGame20.addEventListener('click', ()=>{
        if (state.game.on){ return; }
        state.game.on = true; state.game.visited = new Set(); state.game.visited.add(Math.round(state.cur));
        state.game.t0 = Date.now();
        el.score.textContent = String(state.game.visited.size);
        const T = 20000;
        if (state.game.timer) clearInterval(state.game.timer);
        state.game.timer = setInterval(()=>{
          const t = Date.now() - state.game.t0;
          if (t >= T){
            clearInterval(state.game.timer); state.game.timer = null; state.game.on = false;
            state.burstOnce = true; draw();
          }
        }, 100);
      });

      el.canvas.addEventListener('mousemove', (ev)=>{
        const rect = el.canvas.getBoundingClientRect(); const scale = el.canvas.width / rect.width;
        const x = (ev.clientX - rect.left) * scale; const pad = 36;
        const usable = el.canvas.width - 2*pad; const len = Math.max(1, state.viewMax - state.viewMin);
        const spacing = usable / len;
        let n = Math.round(state.viewMin + (x - pad) / spacing); n = clamp(n, 0, state.max);
        const par = (n % 2 === 0) ? nlt("evenLower") : nlt("oddLower");
        let guessText = "";
        if (Number.isFinite(state.target) && state.guessMode) {
          guessText =
            n < state.target ? nlt("guessHigher") :
            n > state.target ? nlt("guessLower") :
            nlt("guessExact");
        }

        el.tt.style.display = 'block';
        el.tt.textContent = (Number.isFinite(state.target) && state.guessMode)
          ? `${n} — (${guessText})`
          : `${n} — ${par}`;
      });
      el.canvas.addEventListener('mouseleave', ()=>{ el.tt.style.display = 'none'; });
      el.canvas.addEventListener('click', (ev)=>{
        if (state.replaying) return;
        const n = Math.round(unitAtCanvasX(ev.clientX));
        animateTo(n);
        if (state.game.on){ state.game.visited.add(Math.round(n)); el.score.textContent = String(state.game.visited.size); }
      });

      el.canvas.addEventListener('wheel', (e)=>{
        e.preventDefault();
        const center = unitAtCanvasX(e.clientX);
        const factor = (e.deltaY > 0) ? 1/1.15 : 1.15;
        zoomAt(factor, center);
      }, {passive:false});

      let dragging=false, startX=0, startMin=0, startMax=0;
      el.canvas.addEventListener('mousedown', (e)=>{
        dragging = true; startX = e.clientX; startMin = state.viewMin; startMax = state.viewMax;
      });
      window.addEventListener('mousemove', (e)=>{
        if (!dragging) return;
        const rect = el.canvas.getBoundingClientRect(); const scale = el.canvas.width / rect.width;
        const dx = (e.clientX - startX) * scale;
        const pad = 36; const usable = el.canvas.width - 2*pad; const len = viewLen(); const spacing = usable / len;
        const du = -dx / spacing;
        state.viewMin = clamp(startMin + du, 0, state.max-1);
        state.viewMax = clamp(startMax + du, 1, state.max);
        draw();
      });
      window.addEventListener('mouseup', ()=>{ dragging=false; });

      el.wrap.addEventListener('keydown', (e)=>{
        if (e.key === 'ArrowRight'){ e.preventDefault(); el.btnInc.click(); }
        else if (e.key === 'ArrowLeft'){ e.preventDefault(); el.btnDec.click(); }
        else if (e.key.toLowerCase() === 'p'){ e.preventDefault(); el.btnNextEven.click(); }
        else if (e.key.toLowerCase() === 'i'){ e.preventDefault(); el.btnNextOdd.click(); }
        else if (e.code === 'Space'){ e.preventDefault(); el.btnPlay.click(); }
        else if (e.key.toLowerCase() === 'z'){ e.preventDefault(); el.btnZoomIn.click(); }
        else if (e.key.toLowerCase() === 'x'){ e.preventDefault(); el.btnZoomOut.click(); }
        else if (e.key.toLowerCase() === 'r'){ e.preventDefault(); el.btnReplay.click(); }
      });

      const ro = new ResizeObserver(()=>{
        const rect = el.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        el.canvas.width  = Math.max(600, Math.floor(rect.width * ratio));
        el.canvas.height = Math.floor(220 * ratio);
        el.tt.style.left = '8px'; el.tt.style.bottom = '8px';
        el.tt.style.right = 'auto'; el.tt.style.top = 'auto';
        draw();
      });
      ro.observe(el.canvas);

      _instances.set(id, { host, elements: el, ctx, py, state, ro, timers:{ resetPlayTimer, playTimer } });
      draw(); updatePlayButton(); resetPlayTimer();
    }

    function unmount(id)
    {
      const inst = _instances.get(id);
      if (!inst) return;
      try { inst.ro.disconnect(); } catch(e){}
      if (inst.timers?.playTimer) try { clearInterval(inst.timers.playTimer); } catch(e){}
      try { inst.host.innerHTML = ''; } catch(e){}
      _instances.delete(id);
    }

    return { mount, unmount };
  })();
})();