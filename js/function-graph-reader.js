const EPS = 1e-9;

const isEnglish = () => String(globalThis.LANG || document.documentElement.lang || "ro").toLowerCase().startsWith("en");
const renderMath = (root) => { try { globalThis.MH_render?.(root); } catch (_) {} };
const fmt = (value) => {
  const n = Math.abs(value) < EPS ? 0 : value;
  if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n));
  return String(Math.round(n * 100) / 100).replace("-0", "0");
};
const setLatex = (values) => values.length ? `\\{${values.map(fmt).join(",")}\\}` : "\\varnothing";
const pointLatex = ([x, y]) => `(${fmt(x)},${fmt(y)})`;

const mainPoints = [[-4,-1],[-3,0],[-1,2],[1,0],[3,-2],[4,0],[5,1]];
const mValues = [-2,-1,0,1,2];

function segments(points) {
  return points.slice(0,-1).map((p,i)=>[p,points[i+1]]);
}
function yOnSegment([a,b], x) {
  if (Math.abs(b[0]-a[0]) < EPS) return null;
  const t=(x-a[0])/(b[0]-a[0]);
  if (t < -EPS || t > 1+EPS) return null;
  return a[1] + t*(b[1]-a[1]);
}
function yAtPolyline(points,x) {
  for (const seg of segments(points)) {
    const lo=Math.min(seg[0][0],seg[1][0]), hi=Math.max(seg[0][0],seg[1][0]);
    if (x>=lo-EPS && x<=hi+EPS) {
      const y=yOnSegment(seg,x);
      if (y!==null) return y;
    }
  }
  return null;
}
function horizontalIntersections(points,m) {
  const out=[];
  for (const [a,b] of segments(points)) {
    const y1=a[1], y2=b[1];
    if (Math.abs(y1-m)<EPS && Math.abs(y2-m)<EPS) {
      out.push({type:"overlap",from:[a[0],m],to:[b[0],m]});
      continue;
    }
    if ((m < Math.min(y1,y2)-EPS) || (m > Math.max(y1,y2)+EPS) || Math.abs(y2-y1)<EPS) continue;
    const t=(m-y1)/(y2-y1);
    if (t>=-EPS && t<=1+EPS) out.push({type:"point",point:[a[0]+t*(b[0]-a[0]),m]});
  }
  const pointsOnly=[]; const overlaps=[];
  for (const item of out) {
    if (item.type==="overlap") { overlaps.push(item); continue; }
    if (!pointsOnly.some(([x,y])=>Math.abs(x-item.point[0])<EPS&&Math.abs(y-item.point[1])<EPS)) pointsOnly.push(item.point);
  }
  return {points:pointsOnly.sort((a,b)=>a[0]-b[0]),overlaps};
}
function segmentLine(points) {
  return segments(points).map(([a,b])=>({a,b,m:(b[1]-a[1])/(b[0]-a[0]),c:a[1]-((b[1]-a[1])/(b[0]-a[0]))*a[0]}));
}
function polylineIntersections(aPoints,bPoints) {
  const points=[]; const overlaps=[];
  for (const sa of segmentLine(aPoints)) for (const sb of segmentLine(bPoints)) {
    const lo=Math.max(Math.min(sa.a[0],sa.b[0]),Math.min(sb.a[0],sb.b[0]));
    const hi=Math.min(Math.max(sa.a[0],sa.b[0]),Math.max(sb.a[0],sb.b[0]));
    if (lo>hi+EPS) continue;
    const dLo=(sa.m*lo+sa.c)-(sb.m*lo+sb.c);
    const dHi=(sa.m*hi+sa.c)-(sb.m*hi+sb.c);
    if (Math.abs(dLo)<EPS && Math.abs(dHi)<EPS) {
      if (hi-lo>EPS) overlaps.push([lo,hi]);
      else points.push([lo,sa.m*lo+sa.c]);
      continue;
    }
    const dm=sa.m-sb.m;
    if (Math.abs(dm)<EPS) continue;
    const x=(sb.c-sa.c)/dm;
    if (x>=lo-EPS && x<=hi+EPS) points.push([x,sa.m*x+sa.c]);
  }
  const uniquePoints=[];
  points.sort((p,q)=>p[0]-q[0]).forEach(p=>{if(!uniquePoints.some(q=>Math.abs(q[0]-p[0])<EPS&&Math.abs(q[1]-p[1])<EPS))uniquePoints.push(p)});
  const merged=[];
  overlaps.sort((a,b)=>a[0]-b[0]).forEach(interval=>{
    const last=merged.at(-1);
    if(last&&interval[0]<=last[1]+EPS) last[1]=Math.max(last[1],interval[1]); else merged.push([...interval]);
  });
  return {points:uniquePoints,overlaps:merged};
}

function graphSvg({points=mainPoints,second=null,m=null,selectedX=null,intersectionPoints=[],overlapIntervals=[]}) {
  const width=680,height=360,originX=330,originY=185,sx=55,sy=55;
  const xToPx=x=>originX+x*sx, yToPx=y=>originY-y*sy;
  const ticksX=[-5,-4,-3,-2,-1,0,1,2,3,4,5];
  const ticksY=[-3,-2,-1,0,1,2,3];
  const gridX=ticksX.map(x=>`<g><line class="mh-gr-grid" x1="${xToPx(x)}" y1="18" x2="${xToPx(x)}" y2="330"/><text class="mh-gr-axis-label" x="${xToPx(x)}" y="${originY+21}">${x}</text></g>`).join("");
  const gridY=ticksY.map(y=>`<g><line class="mh-gr-grid" x1="30" y1="${yToPx(y)}" x2="650" y2="${yToPx(y)}"/><text class="mh-gr-axis-label" x="${originX-14}" y="${yToPx(y)+4}">${y}</text></g>`).join("");
  const path=(arr,cls)=>`<polyline class="${cls}" points="${arr.map(([x,y])=>`${xToPx(x)},${yToPx(y)}`).join(" ")}"/>`;
  const zeroDots=points.filter(p=>Math.abs(p[1])<EPS).map(([x,y])=>`<circle class="mh-gr-zero" cx="${xToPx(x)}" cy="${yToPx(y)}" r="6"/><text class="mh-gr-point-label" x="${xToPx(x)+7}" y="${yToPx(y)-9}">${fmt(x)}</text>`).join("");
  const level=m===null?"":`<line class="mh-gr-level" x1="30" y1="${yToPx(m)}" x2="650" y2="${yToPx(m)}"/><text class="mh-gr-level-label" x="600" y="${yToPx(m)-8}">y=${fmt(m)}</text>`;
  const selected=selectedX===null?"":(()=>{const y=yAtPolyline(points,selectedX);return y===null?"":`<circle class="mh-gr-selected" cx="${xToPx(selectedX)}" cy="${yToPx(y)}" r="8"/><text class="mh-gr-selected-label" x="${xToPx(selectedX)+10}" y="${yToPx(y)-11}">(${fmt(selectedX)},${fmt(y)})</text>`})();
  const hits=intersectionPoints.map(([x,y])=>`<circle class="mh-gr-hit" cx="${xToPx(x)}" cy="${yToPx(y)}" r="7"/><text class="mh-gr-hit-label" x="${xToPx(x)+9}" y="${yToPx(y)-10}">${pointLatex([x,y])}</text>`).join("");
  const overlap=overlapIntervals.map(([lo,hi])=>{
    const y1=second?yAtPolyline(points,lo):m, y2=second?yAtPolyline(points,hi):m;
    if(y1===null||y2===null)return"";
    return `<line class="mh-gr-overlap" x1="${xToPx(lo)}" y1="${yToPx(y1)}" x2="${xToPx(hi)}" y2="${yToPx(y2)}"/>`;
  }).join("");
  return `<svg class="mh-graph-reader-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafic pentru citirea semnului și a ecuațiilor">
    ${gridX}${gridY}
    <line class="mh-gr-axis" x1="30" y1="${originY}" x2="650" y2="${originY}"/><line class="mh-gr-axis" x1="${originX}" y1="330" x2="${originX}" y2="18"/>
    <text class="mh-gr-axis-name" x="642" y="${originY-9}">x</text><text class="mh-gr-axis-name" x="${originX+10}" y="28">y</text>
    ${level}${path(points,"mh-gr-primary")}${second?path(second,"mh-gr-secondary"):""}${overlap}${zeroDots}${selected}${hits}
  </svg>`;
}

const graphPresets = {
  one: {
    labelRo:"1 intersecție",labelEn:"1 intersection",domain:"[-4,5]",
    f:[[-4,-3],[5,6]], g:[[-4,7],[5,-2]]
  },
  two: {
    labelRo:"2 intersecții",labelEn:"2 intersections",domain:"[-4,5]",
    f:[[-4,2],[0,-2],[4,2],[5,3]], g:[[-4,0],[5,0]]
  },
  overlap: {
    labelRo:"Coincid local",labelEn:"Overlap locally",domain:"[-4,5]",
    f:[[-4,-2],[-1,1],[2,1],[5,3]], g:[[-4,3],[-1,1],[2,1],[5,-2]]
  }
};

function mountGraphReader(host) {
  if(!host||host.dataset.mhMounted==="1")return;
  host.dataset.mhMounted="1";
  const en=isEnglish();
  host.dataset.mhInteractiveHelp=en
    ? "Switch reading mode. SIGN reads position versus Ox; f(x)=m moves a horizontal level; f(x)=g(x) first checks the common domain and then graph intersections."
    : "Schimbă modul de citire. SEMN urmărește poziția față de Ox; f(x)=m mută nivelul orizontal; f(x)=g(x) verifică mai întâi domeniul comun și apoi intersecțiile.";
  let mode="sign",selectedX=-2,m=1,preset="one";
  host.innerHTML=`<section class="mh-graph-reader">
    <div class="mh-graph-reader__head"><div><strong>Graph Reader</strong><small>${en?"Read information directly from a graph.":"Citește informația direct din grafic."}</small></div><div class="mh-graph-reader__tabs" role="group">
      <button type="button" data-gr-mode="sign" class="is-active">${en?"SIGN":"SEMN"}</button><button type="button" data-gr-mode="level">f(x)=m</button><button type="button" data-gr-mode="compare">f(x)=g(x)</button>
    </div></div>
    <div class="mh-graph-reader__controls"></div>
    <div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div>
    <div class="mh-graph-reader__rule"></div>
  </section>`;
  const tabs=[...host.querySelectorAll("[data-gr-mode]")], controls=host.querySelector(".mh-graph-reader__controls"), canvas=host.querySelector(".mh-graph-reader__canvas"), readout=host.querySelector(".mh-graph-reader__readout"), rule=host.querySelector(".mh-graph-reader__rule");
  function render(){
    tabs.forEach(b=>b.classList.toggle("is-active",b.dataset.grMode===mode));
    if(mode==="sign"){
      controls.innerHTML=`<span>${en?"Choose x:":"Alege x:"}</span>${[-4,-3,-2,-1,0,1,2,3,4,5].map(x=>`<button type="button" data-gr-x="${x}" class="${x===selectedX?"is-active":""}">${x}</button>`).join("")}`;
      const y=yAtPolyline(mainPoints,selectedX); const sign=y>EPS?(en?"positive":"pozitiv"):y<-EPS?(en?"negative":"negativ"):(en?"zero":"zero");
      canvas.innerHTML=graphSvg({points:mainPoints,selectedX});
      readout.innerHTML=`<strong>${en?"Selected point":"Punct selectat"}</strong><div>\\[x=${fmt(selectedX)},\\qquad f(${fmt(selectedX)})=${fmt(y)}\\]</div><p>${en?"Sign":"Semn"}: <b>${sign}</b></p><p>${en?"Zeros":"Zerouri"}: \\(\\{-3,1,4\\}\\)</p>`;
      rule.innerHTML=`\\[f(x)>0\\iff G_f\\text{ ${en?"is above":"este deasupra lui"} }Ox\\]`;
    } else if(mode==="level"){
      controls.innerHTML=`<span>m:</span>${mValues.map(v=>`<button type="button" data-gr-m="${v}" class="${v===m?"is-active":""}">${v}</button>`).join("")}`;
      const result=horizontalIntersections(mainPoints,m); const xs=result.points.map(p=>p[0]);
      canvas.innerHTML=graphSvg({points:mainPoints,m,intersectionPoints:result.points,overlapIntervals:result.overlaps.map(o=>[o.from[0],o.to[0]])});
      const intersectionText=result.points.length?result.points.map(pointLatex).join(",\\ "):"\\varnothing";
      const solutionMarkup=result.overlaps.length
        ? `\\(${result.overlaps.map(({from,to})=>`[${fmt(from[0])},${fmt(to[0])}]`).join("\\cup")}\\) <span>— ${en?"infinitely many solutions":"infinit de multe soluții"}</span>`
        : `\\(${setLatex(xs)}\\)`;
      readout.innerHTML=`<strong>${en?"Equation":"Ecuație"}</strong><div>\\[f(x)=${fmt(m)}\\]</div><p>${en?"Intersections":"Intersecții"}: \\(${intersectionText}\\)</p><p>${en?"Solutions":"Soluții"}: ${solutionMarkup}</p>`;
      rule.innerHTML=`\\[f(x)=m\\iff G_f\\cap\\{y=m\\}\\]`;
    } else {
      const cfg=graphPresets[preset]; const result=polylineIntersections(cfg.f,cfg.g);
      controls.innerHTML=`<span>${en?"Preset":"Caz"}:</span>${Object.entries(graphPresets).map(([key,val])=>`<button type="button" data-gr-preset="${key}" class="${key===preset?"is-active":""}">${en?val.labelEn:val.labelRo}</button>`).join("")}`;
      canvas.innerHTML=graphSvg({points:cfg.f,second:cfg.g,intersectionPoints:result.points,overlapIntervals:result.overlaps});
      const pts=result.points.length?result.points.map(pointLatex).join(",\\ "):"\\varnothing";
      const xs=result.points.map(p=>p[0]);
      let solutionMarkup=`\\(${setLatex(xs)}\\)`;
      if(result.overlaps.length){
        const ranges=result.overlaps.map(([a,b])=>`[${fmt(a)},${fmt(b)}]`).join("\\cup");
        solutionMarkup=`\\(${ranges}\\) <span>— ${en?"infinitely many solutions":"infinit de multe soluții"}</span>`;
      }
      readout.innerHTML=`<strong>${en?"Common domain":"Domeniu comun"}</strong><div>\\[D_f\\cap D_g=${cfg.domain}\\]</div><p>${en?"Common points":"Puncte comune"}: \\(${pts}\\)</p>${result.overlaps.length?`<p>${en?"Common portion":"Porțiune comună"}: \\(${result.overlaps.map(([a,b])=>`[${fmt(a)},${fmt(b)}]`).join("\\cup")}\\)</p>`:""}<p>${en?"Solutions":"Soluții"}: ${solutionMarkup}</p>`;
      rule.innerHTML=`\\[x\\in D_f\\cap D_g,\\qquad f(x)=g(x)\\iff (x,f(x))\\in G_f\\cap G_g\\]`;
    }
    host.querySelectorAll("[data-gr-x]").forEach(b=>b.addEventListener("click",()=>{selectedX=Number(b.dataset.grX);render()}));
    host.querySelectorAll("[data-gr-m]").forEach(b=>b.addEventListener("click",()=>{m=Number(b.dataset.grM);render()}));
    host.querySelectorAll("[data-gr-preset]").forEach(b=>b.addEventListener("click",()=>{preset=b.dataset.grPreset;render()}));
    renderMath(host);
  }
  tabs.forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.grMode;render()}));
  host.addEventListener("mathhard:interactive-reset",()=>{mode="sign";selectedX=-2;m=1;preset="one";render()});
  render();
}

function miniZeroSvg(kind){
  if(kind==="touch") return `<svg viewBox="0 0 300 180" role="img" aria-label="Grafic care atinge axa Ox"><line class="mh-zero-axis" x1="22" y1="128" x2="278" y2="128"/><path class="mh-zero-curve" d="M28 48 Q150 208 272 48"/><circle class="mh-zero-hit" cx="150" cy="128" r="6"/></svg>`;
  return `<svg viewBox="0 0 300 180" role="img" aria-label="Grafic care traversează axa Ox"><line class="mh-zero-axis" x1="22" y1="90" x2="278" y2="90"/><path class="mh-zero-curve" d="M30 145 C95 125 130 105 150 90 S215 55 270 32"/><circle class="mh-zero-hit" cx="150" cy="90" r="6"/></svg>`;
}
function mountZeroTouch(host){
  if(!host||host.dataset.mhMounted==="1")return;host.dataset.mhMounted="1";const en=isEnglish();
  host.dataset.mhInteractiveHelp=en?"Compare crossing and touching. In both cases x₀ is a zero because f(x₀)=0.":"Compară traversarea cu simpla atingere. În ambele cazuri x₀ este zero deoarece f(x₀)=0.";
  host.innerHTML=`<section class="mh-zero-touch"><div class="mh-zero-touch__head"><strong>${en?"Zero of the function?":"Zero al funcției?"}</strong><small>${en?"Crossing is not required.":"Nu este obligatoriu să traverseze axa."}</small></div><div class="mh-zero-touch__grid"><article>${miniZeroSvg("cross")}<strong>${en?"Crosses Ox":"Traversează Ox"}</strong><p>\\(x_0\\) ${en?"is a zero":"este zero"} ✓</p></article><article>${miniZeroSvg("touch")}<strong>${en?"Only touches Ox":"Doar atinge Ox"}</strong><p>\\(x_0\\) ${en?"is still a zero":"este tot zero"} ✓</p></article></div><div class="mh-zero-touch__rule">\\[f(x_0)=0\\text{ ${en?"is the only required condition":"este condiția necesară"}.}\\]</div></section>`;
  host.addEventListener("mathhard:interactive-reset",()=>{});renderMath(host);
}



function cleanNumeric(value){
  if(!Number.isFinite(value)) return 0;
  const n=Math.abs(value)<EPS?0:Math.round(value*1000000000)/1000000000;
  return Object.is(n,-0)?0:n;
}
function floorValue(value){return Math.floor(cleanNumeric(value));}
function fractionalPart(value){return cleanNumeric(value-floorValue(value));}
function standardGraphSvg(mode,selectedX){
  const width=680,height=360,originX=340,originY=180,sx=56,sy=56;
  const xPx=x=>originX+x*sx,yPx=y=>originY-y*sy;
  const ticks=[-5,-4,-3,-2,-1,0,1,2,3,4,5];
  const gridX=ticks.map(x=>`<g><line class="mh-gr-grid" x1="${xPx(x)}" y1="18" x2="${xPx(x)}" y2="338"/><text class="mh-gr-axis-label" x="${xPx(x)}" y="${originY+21}">${x}</text></g>`).join("");
  const gridY=[-3,-2,-1,0,1,2,3,4,5].map(y=>`<g><line class="mh-gr-grid" x1="34" y1="${yPx(y)}" x2="646" y2="${yPx(y)}"/><text class="mh-gr-axis-label" x="${originX-14}" y="${yPx(y)+4}">${y}</text></g>`).join("");
  let graph="";
  if(mode==="abs"){
    graph=`<polyline class="mh-gr-primary" points="${ticks.map(x=>`${xPx(x)},${yPx(Math.abs(x))}`).join(" ")}"/>`;
  }else if(mode==="floor"){
    for(let n=-5;n<5;n++) graph+=`<line class="mh-gr-primary" x1="${xPx(n)}" y1="${yPx(n)}" x2="${xPx(n+1)}" y2="${yPx(n)}"/><circle class="mh-sf-closed" cx="${xPx(n)}" cy="${yPx(n)}" r="5"/><circle class="mh-sf-open" cx="${xPx(n+1)}" cy="${yPx(n)}" r="5"/>`;
  }else{
    for(let n=-5;n<5;n++) graph+=`<line class="mh-gr-primary" x1="${xPx(n)}" y1="${yPx(0)}" x2="${xPx(n+1)}" y2="${yPx(1)}"/><circle class="mh-sf-closed" cx="${xPx(n)}" cy="${yPx(0)}" r="5"/><circle class="mh-sf-open" cx="${xPx(n+1)}" cy="${yPx(1)}" r="5"/>`;
  }
  const y=mode==="abs"?Math.abs(selectedX):mode==="floor"?floorValue(selectedX):fractionalPart(selectedX);
  const selected=`<circle class="mh-gr-selected" cx="${xPx(selectedX)}" cy="${yPx(y)}" r="8"/><text class="mh-gr-selected-label" x="${xPx(selectedX)+10}" y="${yPx(y)-11}">(${fmt(selectedX)},${fmt(y)})</text>`;
  return `<svg class="mh-graph-reader-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${mode==='abs'?'Graficul funcției modul':mode==='floor'?'Graficul funcției parte întreagă':'Graficul funcției parte fracționară'}">${gridX}${gridY}<line class="mh-gr-axis" x1="34" y1="${originY}" x2="646" y2="${originY}"/><line class="mh-gr-axis" x1="${originX}" y1="338" x2="${originX}" y2="18"/><text class="mh-gr-axis-name" x="638" y="${originY-9}">x</text><text class="mh-gr-axis-name" x="${originX+10}" y="28">y</text>${graph}${selected}</svg>`;
}
function mountStandardFunctionGallery(host){
  if(!host||host.dataset.mhMounted==="1")return;
  host.dataset.mhMounted="1";
  const en=isEnglish();
  host.dataset.mhInteractiveHelp=en?"Choose a function and move x. Closed dots belong to the graph; open dots do not.":"Alege funcția și modifică valoarea lui x. Punctele pline aparțin graficului; punctele goale nu aparțin.";
  let mode="abs",x=-2.4;
  host.innerHTML=`<section class="mh-graph-reader mh-standard-gallery"><div class="mh-graph-reader__head"><div><strong>Function Gallery</strong><small>${en?"Three standard functions, one input.":"Trei funcții uzuale, același input."}</small></div><div class="mh-graph-reader__tabs" role="group"><button type="button" data-sf-mode="abs" class="is-active">|x|</button><button type="button" data-sf-mode="floor">⌊x⌋</button><button type="button" data-sf-mode="fractional">{x}</button></div></div><div class="mh-graph-reader__controls mh-standard-gallery__controls"><label>x = <input type="range" min="-5" max="5" step="0.1" value="-2.4" data-sf-slider></label><input type="number" min="-5" max="5" step="0.1" value="-2.4" data-sf-number aria-label="x"></div><div class="mh-graph-reader__layout"><div class="mh-graph-reader__canvas"></div><aside class="mh-graph-reader__readout"></aside></div><div class="mh-graph-reader__rule"></div></section>`;
  const tabs=[...host.querySelectorAll("[data-sf-mode]")],slider=host.querySelector("[data-sf-slider]"),number=host.querySelector("[data-sf-number]"),canvas=host.querySelector(".mh-graph-reader__canvas"),readout=host.querySelector(".mh-graph-reader__readout"),rule=host.querySelector(".mh-graph-reader__rule");
  function setX(raw){const n=Number(raw);if(!Number.isFinite(n))return;x=Math.max(-5,Math.min(5,cleanNumeric(n)));slider.value=String(x);number.value=String(x);render();}
  function render(){
    tabs.forEach(b=>b.classList.toggle("is-active",b.dataset.sfMode===mode));
    canvas.innerHTML=standardGraphSvg(mode,x);
    if(mode==="abs"){
      const y=Math.abs(x);readout.innerHTML=`<strong>${en?"Absolute value":"Modul"}</strong><div>\\[|${fmt(x)}|=${fmt(y)}\\]</div><p>${en?"Point":"Punct"}: \\(${pointLatex([x,y])}\\)</p><p>${en?"Domain":"Domeniu"}: \\(\\mathbb R\\)<br>${en?"Image":"Imagine"}: \\([0,\\infty)\\)<br>${en?"Zero":"Zero"}: \\(0\\)</p>`;rule.innerHTML=`\\[|x|=\\begin{cases}x,&x\\ge0\\\\-x,&x<0\\end{cases}\\]`;
    }else if(mode==="floor"){
      const n=floorValue(x);readout.innerHTML=`<strong>${en?"Floor":"Partea întreagă"}</strong><div>\\[\\lfloor ${fmt(x)}\\rfloor=${n}\\]</div><p>\\[${n}\\le ${fmt(x)}<${n+1}\\]</p><p>${en?"Active step":"Treapta activă"}: \\([${n},${n+1})\\)</p>`;rule.innerHTML=`\\[\\lfloor x\\rfloor=n\\iff n\\le x<n+1\\]`;
    }else{
      const n=floorValue(x),f=fractionalPart(x);readout.innerHTML=`<strong>${en?"Fractional part":"Partea fracționară"}</strong><div>\\[\\lfloor ${fmt(x)}\\rfloor=${n}\\]</div><p>\\[\\{${fmt(x)}\\}=${fmt(x)}-(${n})=${fmt(f)}\\]</p><p>\\[${fmt(x)}=${n}+${fmt(f)}\\]</p>`;rule.innerHTML=`\\[\\{x\\}=x-\\lfloor x\\rfloor,\\qquad 0\\le\\{x\\}<1\\]`;
    }
    renderMath(host);
  }
  tabs.forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.sfMode;render()}));slider.addEventListener("input",()=>setX(slider.value));number.addEventListener("change",()=>setX(number.value));host.addEventListener("mathhard:interactive-reset",()=>{mode="abs";x=-2.4;slider.value=number.value="-2.4";render()});render();
}

export function mountFunctionGraphReader(root=document){
  root.querySelectorAll("[data-mh-function-graph-reader]").forEach(mountGraphReader);
  root.querySelectorAll("[data-mh-function-zero-touch]").forEach(mountZeroTouch);
  root.querySelectorAll("[data-mh-standard-function-gallery]").forEach(mountStandardFunctionGallery);
}

export const __test = { horizontalIntersections, polylineIntersections, mainPoints, floorValue, fractionalPart };
