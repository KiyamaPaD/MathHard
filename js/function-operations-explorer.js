const KATEX_OPTS={delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea']};
const fmt=n=>{if(n==null||!Number.isFinite(n))return '—';const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*100)/100).replace('.',',')};
const renderMath=root=>{try{globalThis.renderMathInElement?.(root,KATEX_OPTS)}catch(_){}};
const opDefs={
 sum:{label:'sumă',symbol:'+',tex:'+'},
 diff:{label:'diferență',symbol:'−',tex:'-'},
 prod:{label:'produs',symbol:'·',tex:'\\cdot'},
 quot:{label:'cât',symbol:'/',tex:'\\div'}
};
const presets={
 simple:{
  label:'domeniu comun simplu',range:[-4,5],step:1,
  f:{tex:'f(x)=x+1',domainTex:'\\mathbb R',ok:x=>true,val:x=>x+1},
  g:{tex:'g(x)=x-2',domainTex:'\\mathbb R',ok:x=>true,val:x=>x-2},
  formulaTex:{sum:'(f+g)(x)=2x-1',diff:'(f-g)(x)=3',prod:'(fg)(x)=(x+1)(x-2)',quot:'\\left(\\frac fg\\right)(x)=\\frac{x+1}{x-2}'},
  domainTex:{sum:'\\mathbb R',diff:'\\mathbb R',prod:'\\mathbb R',quot:'\\mathbb R\\setminus\\{2\\}'}
 },
 mixed:{
  label:'domenii diferite',range:[-1,6],step:1,
  f:{tex:'f(x)=\\sqrt{x-1}',domainTex:'[1,\\infty)',ok:x=>x>=1,val:x=>Math.sqrt(x-1)},
  g:{tex:'g(x)=\\frac1{x-3}',domainTex:'\\mathbb R\\setminus\\{3\\}',ok:x=>Math.abs(x-3)>1e-9,val:x=>1/(x-3)},
  formulaTex:{sum:'(f+g)(x)=\\sqrt{x-1}+\\frac1{x-3}',diff:'(f-g)(x)=\\sqrt{x-1}-\\frac1{x-3}',prod:'(fg)(x)=\\frac{\\sqrt{x-1}}{x-3}',quot:'\\left(\\frac fg\\right)(x)=\\sqrt{x-1}(x-3)'},
  domainTex:{sum:'[1,\\infty)\\setminus\\{3\\}',diff:'[1,\\infty)\\setminus\\{3\\}',prod:'[1,\\infty)\\setminus\\{3\\}',quot:'[1,\\infty)\\setminus\\{3\\}'}
 },
 zero:{
  label:'numitor zero',range:[-3,4],step:1,
  f:{tex:'f(x)=x^2+1',domainTex:'\\mathbb R',ok:x=>true,val:x=>x*x+1},
  g:{tex:'g(x)=x-1',domainTex:'\\mathbb R',ok:x=>true,val:x=>x-1},
  formulaTex:{sum:'(f+g)(x)=x^2+x',diff:'(f-g)(x)=x^2-x+2',prod:'(fg)(x)=(x^2+1)(x-1)',quot:'\\left(\\frac fg\\right)(x)=\\frac{x^2+1}{x-1}'},
  domainTex:{sum:'\\mathbb R',diff:'\\mathbb R',prod:'\\mathbb R',quot:'\\mathbb R\\setminus\\{1\\}'}
 },
 preserve:{
  label:'restricție păstrată',range:[-3,4],step:1,
  f:{tex:'f(x)=\\frac{x^2-1}{x-1}',domainTex:'\\mathbb R\\setminus\\{1\\}',ok:x=>Math.abs(x-1)>1e-9,val:x=>x+1},
  g:{tex:'g(x)=x+1',domainTex:'\\mathbb R',ok:x=>true,val:x=>x+1},
  formulaTex:{sum:'(f+g)(x)=2x+2',diff:'(f-g)(x)=0',prod:'(fg)(x)=(x+1)^2',quot:'\\left(\\frac fg\\right)(x)=1'},
  domainTex:{sum:'\\mathbb R\\setminus\\{1\\}',diff:'\\mathbb R\\setminus\\{1\\}',prod:'\\mathbb R\\setminus\\{1\\}',quot:'\\mathbb R\\setminus\\{-1,1\\}'},
  preserve:true,holes:{f:[1],g:[],sum:[1],diff:[1],prod:[1],quot:[-1,1]}
 }
};
const calc=(op,a,b)=>op==='sum'?a+b:op==='diff'?a-b:op==='prod'?a*b:a/b;
const valueAt=(p,op,x)=>{const fOk=p.f.ok(x),gOk=p.g.ok(x);if(!fOk||!gOk)return null;const fv=p.f.val(x),gv=p.g.val(x);if(!Number.isFinite(fv)||!Number.isFinite(gv))return null;if(op==='quot'&&Math.abs(gv)<1e-9)return null;const v=calc(op,fv,gv);return Number.isFinite(v)?v:null};
function graphSvg(p,op,selectedX){
 const W=560,H=320,pad={l:42,r:18,t:28,b:34},[xmin,xmax]=p.range;
 const samples=180;
 const series=[
  {key:'f',label:'f',fn:x=>p.f.ok(x)?p.f.val(x):null,dash:'',width:2.8,opacity:.78},
  {key:'g',label:'g',fn:x=>p.g.ok(x)?p.g.val(x):null,dash:'8 5',width:2.8,opacity:.72},
  {key:'result',label:'rezultat',fn:x=>valueAt(p,op,x),dash:'2 4',width:4,opacity:1}
 ];
 const raw=[];
 for(let i=0;i<=samples;i++){const x=xmin+(xmax-xmin)*i/samples;for(const s of series){const y=s.fn(x);if(Number.isFinite(y))raw.push(Math.abs(y));}}
 raw.sort((a,b)=>a-b);const q=raw.length?raw[Math.min(raw.length-1,Math.floor(raw.length*.9))]:4;const ymax=Math.min(18,Math.max(4,Math.ceil(q+1))),ymin=-ymax;
 const xp=x=>pad.l+(x-xmin)/(xmax-xmin)*(W-pad.l-pad.r),yp=y=>pad.t+(ymax-y)/(ymax-ymin)*(H-pad.t-pad.b);
 const xTicks=[];for(let x=Math.ceil(xmin);x<=Math.floor(xmax);x++)xTicks.push(x);
 const yStep=ymax<=6?2:ymax<=12?4:6,yTicks=[];for(let y=-Math.floor(ymax/yStep)*yStep;y<=ymax;y+=yStep)yTicks.push(y);
 const grid=xTicks.map(x=>`<g><line class="mh-rep-grid" x1="${xp(x)}" y1="${pad.t}" x2="${xp(x)}" y2="${H-pad.b}"/><text class="mh-rep-axis-label" x="${xp(x)}" y="${H-12}">${x}</text></g>`).join('')+yTicks.map(y=>`<g><line class="mh-rep-grid" x1="${pad.l}" y1="${yp(y)}" x2="${W-pad.r}" y2="${yp(y)}"/><text class="mh-rep-axis-label" x="${pad.l-14}" y="${yp(y)+4}">${y}</text></g>`).join('');
 const makePaths=s=>{let paths=[],pts=[];const flush=()=>{if(pts.length>1)paths.push(`<path d="M${pts.map(([a,b])=>`${a.toFixed(2)},${b.toFixed(2)}`).join(' L')}" fill="none" class="mh-rep-real-line" style="stroke-width:${s.width};opacity:${s.opacity};${s.dash?`stroke-dasharray:${s.dash};`:''}"/>`);pts=[]};for(let i=0;i<=samples;i++){const x=xmin+(xmax-xmin)*i/samples,y=s.fn(x);if(!Number.isFinite(y)||y<ymin*1.15||y>ymax*1.15){flush();continue}const py=yp(y);if(pts.length&&Math.abs(py-pts[pts.length-1][1])>H*.45)flush();pts.push([xp(x),py]);}flush();return paths.join('')};
 const curves=series.map(makePaths).join('');
 const holes=[];const addHole=(x,y,label)=>{if(Number.isFinite(y)&&y>=ymin&&y<=ymax)holes.push(`<g><circle cx="${xp(x)}" cy="${yp(y)}" r="6" fill="var(--bg)" stroke="var(--accent)" stroke-width="2.5"/><text class="mh-rep-axis-label" x="${xp(x)+10}" y="${yp(y)-9}">${label}</text></g>`)};
 const addExcludedX=(x,label)=>holes.push(`<g><line x1="${xp(x)}" y1="${pad.t}" x2="${xp(x)}" y2="${H-pad.b}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 5" opacity=".75"/><text class="mh-rep-axis-label" x="${xp(x)+12}" y="${pad.t+26}">${label}</text></g>`);
 if(p.holes){for(const x of p.holes.f||[])addHole(x,x+1,'f exclus');if(op==='quot')for(const x of p.holes.quot||[])addHole(x,1,'rez. exclus');else for(const x of p.holes[op]||[])addHole(x,valueAt({...p,f:{...p.f,ok:()=>true}},op,x)??0,'rez. exclus');}
 if(p===presets.simple&&op==='quot')addExcludedX(2,'x=2 exclus');
 if(p===presets.zero&&op==='quot')addExcludedX(1,'x=1 exclus');
 if(p===presets.mixed)addExcludedX(3,'x=3 exclus');
 if(p===presets.preserve){addExcludedX(1,'x=1 exclus');if(op==='quot')addExcludedX(-1,'x=-1 exclus');}
 const selected=[];const addSel=(label,y,dy=0)=>{if(Number.isFinite(y)&&y>=ymin&&y<=ymax)selected.push(`<g class="mh-rep-graph-point is-selected"><circle cx="${xp(selectedX)}" cy="${yp(y)}" r="5"/><text x="${xp(selectedX)+9}" y="${yp(y)+dy-8}">${label}</text></g>`)};
 if(p.f.ok(selectedX))addSel('f',p.f.val(selectedX));if(p.g.ok(selectedX))addSel('g',p.g.val(selectedX),14);const rv=valueAt(p,op,selectedX);if(rv!=null)addSel('rez.',rv,28);
 const xAxisY=(0>=ymin&&0<=ymax)?yp(0):H-pad.b,yAxisX=(0>=xmin&&0<=xmax)?xp(0):pad.l;
 return `<svg class="mh-representation-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graficul funcțiilor și al rezultatului operației">${grid}<line class="mh-rep-axis" x1="${pad.l}" y1="${xAxisY}" x2="${W-pad.r}" y2="${xAxisY}"/><line class="mh-rep-axis" x1="${yAxisX}" y1="${H-pad.b}" x2="${yAxisX}" y2="${pad.t}"/><text class="mh-rep-axis-name" x="${W-24}" y="${xAxisY-8}">x</text><text class="mh-rep-axis-name" x="${yAxisX+9}" y="${pad.t+10}">y</text>${curves}${holes.join('')}${selected.join('')}<g transform="translate(${pad.l+8},${pad.t+12})"><line class="mh-rep-real-line" x1="0" y1="0" x2="28" y2="0" style="stroke-width:2.8;opacity:.78"/><text class="mh-rep-axis-name" x="34" y="4">f</text><line class="mh-rep-real-line" x1="62" y1="0" x2="90" y2="0" style="stroke-width:2.8;opacity:.72;stroke-dasharray:8 5"/><text class="mh-rep-axis-name" x="96" y="4">g</text><line class="mh-rep-real-line" x1="124" y1="0" x2="152" y2="0" style="stroke-width:4;stroke-dasharray:2 4"/><text class="mh-rep-axis-name" x="158" y="4">rezultat</text></g></svg>`;
}
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let presetKey='simple',op='sum',x=0;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator de operații cu funcții</strong><small>Domeniu întâi → formulă după.</small></div></div><div class="mh-function-parity__tabs" data-ops-presets></div><div class="mh-function-parity__tabs" data-ops-tabs></div><div class="mh-function-parity__slider"><label>Alege x: <strong data-ops-xv></strong></label><input type="range" data-ops-x></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas"><div data-ops-graph></div></div><aside class="mh-function-parity__readout" data-ops-readout></aside></div></section>`;
 const presetTabs=host.querySelector('[data-ops-presets]'),opTabs=host.querySelector('[data-ops-tabs]'),slider=host.querySelector('[data-ops-x]'),xv=host.querySelector('[data-ops-xv]'),graph=host.querySelector('[data-ops-graph]'),readout=host.querySelector('[data-ops-readout]');
 function render(){
  const p=presets[presetKey],[min,max]=p.range;x=Math.max(min,Math.min(max,x));slider.min=String(min);slider.max=String(max);slider.step=String(p.step);slider.value=String(x);xv.textContent=fmt(x);
  presetTabs.innerHTML=Object.entries(presets).map(([k,v])=>`<button type="button" data-ops-preset="${k}" class="${k===presetKey?'is-active':''}">${v.label}</button>`).join('');
  opTabs.innerHTML=Object.entries(opDefs).map(([k,v])=>`<button type="button" data-ops-op="${k}" class="${k===op?'is-active':''}">${v.label}</button>`).join('');
  const fOk=p.f.ok(x),gOk=p.g.ok(x),fv=fOk?p.f.val(x):null,gv=gOk?p.g.val(x):null,denOk=op!=='quot'||(gOk&&Math.abs(gv)>1e-9),defined=fOk&&gOk&&denOk,result=defined?calc(op,fv,gv):null;
  graph.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:2px 4px 8px"><strong>Grafic</strong><small style="color:var(--muted)">f · g · rezultatul operației</small></div>${graphSvg(p,op,x)}`;
  let status;if(!fOk||!gOk)status='Operația nu este definită aici: una dintre funcțiile inițiale nu există.';else if(op==='quot'&&!denOk)status='Câtul nu este definit: funcția din numitor are valoarea 0.';else status='Operația este definită în acest punct.';
  const denLine=op==='quot'?`<p>\\(g(${fmt(x)})\\ne0\\)? <strong>${gOk?(denOk?'Da':'Nu'):'—'}</strong></p>`:'';
  readout.innerHTML=`<strong>1. Domeniu</strong><p>\\(${p.f.tex}\\)<br><small>\\(D_f=${p.f.domainTex}\\)</small></p><p>\\(${p.g.tex}\\)<br><small>\\(D_g=${p.g.domainTex}\\)</small></p><p>\\(${fmt(x)}\\in D_f\\)? <strong>${fOk?'Da':'Nu'}</strong></p><p>\\(${fmt(x)}\\in D_g\\)? <strong>${gOk?'Da':'Nu'}</strong></p>${denLine}<hr><strong>2. Formulă</strong><p>Domeniul rezultatului:<br>\\[D=${p.domainTex[op]}\\]</p><p>\\[${p.formulaTex[op]}\\]</p><p><strong>${status}</strong></p>${defined?`<p>La \\(x=${fmt(x)}\\):<br>\\[f(x)=${fmt(fv)},\\quad g(x)=${fmt(gv)},\\quad rezultat=${fmt(result)}\\]</p>`:''}${p.preserve?'<p><strong>Restricție păstrată:</strong> formula simplificată nu readaugă punctele excluse.</p>':''}`;
  renderMath(host);
 }
 presetTabs.addEventListener('click',e=>{const b=e.target.closest('[data-ops-preset]');if(!b)return;presetKey=b.dataset.opsPreset;x=0;render()});
 opTabs.addEventListener('click',e=>{const b=e.target.closest('[data-ops-op]');if(!b)return;op=b.dataset.opsOp;render()});
 slider.addEventListener('input',()=>{x=Number(slider.value);render()});
 host.addEventListener('mathhard:interactive-reset',()=>{presetKey='simple';op='sum';x=0;render()});
 render();
}
export function mountFunctionOperationsExplorers(root=document){root.querySelectorAll('[data-mh-function-operations-lab]').forEach(mount)}
