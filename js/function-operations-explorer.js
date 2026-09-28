const fmt=n=>{if(n==null||!Number.isFinite(n))return '—';const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*100)/100).replace('.',',')};
const opDefs={
 sum:{label:'sumă',symbol:'+',formula:(f,g)=>`${f} + ${g}`},
 diff:{label:'diferență',symbol:'−',formula:(f,g)=>`${f} − (${g})`},
 prod:{label:'produs',symbol:'·',formula:(f,g)=>`(${f})·(${g})`},
 quot:{label:'cât',symbol:'/',formula:(f,g)=>`(${f}) / (${g})`}
};
const presets={
 simple:{
  label:'domeniu comun simplu',range:[-4,5],step:1,
  f:{label:'f(x)=x+1',domain:'ℝ',ok:x=>true,val:x=>x+1},
  g:{label:'g(x)=x−2',domain:'ℝ',ok:x=>true,val:x=>x-2},
  formula:{sum:'2x−1',diff:'3',prod:'(x+1)(x−2)',quot:'(x+1)/(x−2)'},
  domain:{sum:'ℝ',diff:'ℝ',prod:'ℝ',quot:'ℝ ∖ {2}'}
 },
 mixed:{
  label:'domenii diferite',range:[-1,6],step:1,
  f:{label:'f(x)=√(x−1)',domain:'[1,∞)',ok:x=>x>=1,val:x=>Math.sqrt(x-1)},
  g:{label:'g(x)=1/(x−3)',domain:'ℝ ∖ {3}',ok:x=>x!==3,val:x=>1/(x-3)},
  formula:{sum:'√(x−1)+1/(x−3)',diff:'√(x−1)−1/(x−3)',prod:'√(x−1)/(x−3)',quot:'√(x−1)·(x−3)'},
  domain:{sum:'[1,∞) ∖ {3}',diff:'[1,∞) ∖ {3}',prod:'[1,∞) ∖ {3}',quot:'[1,∞) ∖ {3}'}
 },
 zero:{
  label:'numitor zero',range:[-3,4],step:1,
  f:{label:'f(x)=x²+1',domain:'ℝ',ok:x=>true,val:x=>x*x+1},
  g:{label:'g(x)=x−1',domain:'ℝ',ok:x=>true,val:x=>x-1},
  formula:{sum:'x²+x',diff:'x²−x+2',prod:'(x²+1)(x−1)',quot:'(x²+1)/(x−1)'},
  domain:{sum:'ℝ',diff:'ℝ',prod:'ℝ',quot:'ℝ ∖ {1}'}
 },
 preserve:{
  label:'restricție păstrată',range:[-3,4],step:1,
  f:{label:'f(x)=(x²−1)/(x−1)',domain:'ℝ ∖ {1}',ok:x=>x!==1,val:x=>x+1},
  g:{label:'g(x)=x+1',domain:'ℝ',ok:x=>true,val:x=>x+1},
  formula:{sum:'2x+2',diff:'0',prod:'(x+1)²',quot:'1'},
  domain:{sum:'ℝ ∖ {1}',diff:'ℝ ∖ {1}',prod:'ℝ ∖ {1}',quot:'ℝ ∖ {−1,1}'},
  preserve:true
 }
};
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let presetKey='simple',op='sum',x=0;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator de operații cu funcții</strong><small>Domeniu întâi → formulă după.</small></div></div><div class="mh-function-parity__tabs" data-ops-presets></div><div class="mh-function-parity__tabs" data-ops-tabs></div><div class="mh-function-parity__slider"><label>Alege x: <strong data-ops-xv></strong></label><input type="range" data-ops-x></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-ops-work></div><aside class="mh-function-parity__readout" data-ops-readout></aside></div></section>`;
 const presetTabs=host.querySelector('[data-ops-presets]'),opTabs=host.querySelector('[data-ops-tabs]'),slider=host.querySelector('[data-ops-x]'),xv=host.querySelector('[data-ops-xv]'),work=host.querySelector('[data-ops-work]'),readout=host.querySelector('[data-ops-readout]');
 const calc=(symbol,a,b)=>symbol==='+'?a+b:symbol==='−'?a-b:symbol==='·'?a*b:a/b;
 function render(){
  const p=presets[presetKey],od=opDefs[op],[min,max]=p.range;
  x=Math.max(min,Math.min(max,x));slider.min=String(min);slider.max=String(max);slider.step=String(p.step);slider.value=String(x);xv.textContent=fmt(x);
  presetTabs.innerHTML=Object.entries(presets).map(([k,v])=>`<button type="button" data-ops-preset="${k}" class="${k===presetKey?'is-active':''}">${v.label}</button>`).join('');
  opTabs.innerHTML=Object.entries(opDefs).map(([k,v])=>`<button type="button" data-ops-op="${k}" class="${k===op?'is-active':''}">${v.label}</button>`).join('');
  const fOk=p.f.ok(x),gOk=p.g.ok(x),fv=fOk?p.f.val(x):null,gv=gOk?p.g.val(x):null,denOk=op!=='quot'||(gOk&&Math.abs(gv)>1e-9),defined=fOk&&gOk&&denOk;
  const result=defined?calc(od.symbol,fv,gv):null;
  const checks=[`<div><strong>1. Domeniu</strong></div>`,`<p>${p.f.label}<br><small>D_f = ${p.f.domain}</small></p>`,`<p>${p.g.label}<br><small>D_g = ${p.g.domain}</small></p>`,`<p>x ∈ D_f? <strong>${fOk?'Da':'Nu'}</strong></p>`,`<p>x ∈ D_g? <strong>${gOk?'Da':'Nu'}</strong></p>`];
  if(op==='quot')checks.push(`<p>g(x) ≠ 0? <strong>${gOk?(denOk?'Da':'Nu'):'—'}</strong></p>`);
  checks.push(`<hr><div><strong>2. Formulă</strong></div><p>${op==='quot'?'Domeniu final':'Domeniu'}: <strong>${p.domain[op]}</strong></p><p>Formula: <strong>${p.formula[op]}</strong></p>`);
  if(p.preserve)checks.push(`<p><strong>Restricție păstrată:</strong> formula simplificată nu readaugă punctele excluse.</p>`);
  work.innerHTML=`<div class="mh-function-parity__readout">${checks.join('')}</div>`;
  let status;if(!fOk||!gOk)status='Operația nu este definită aici: una dintre funcțiile inițiale nu există.';else if(op==='quot'&&!denOk)status='Câtul nu este definit: funcția din numitor are valoarea 0.';else status='Operația este definită în acest punct.';
  readout.innerHTML=`<strong>${od.label}</strong><p>f(${fmt(x)}) = ${fmt(fv)}</p><p>g(${fmt(x)}) = ${fmt(gv)}</p><p>${status}</p>${defined?`<p>Rezultat: <strong>${fmt(result)}</strong></p>`:''}${p.preserve?'<p>Formula s-a simplificat, dar punctele excluse rămân în afara domeniului.</p>':''}`;
 }
 presetTabs.addEventListener('click',e=>{const b=e.target.closest('[data-ops-preset]');if(!b)return;presetKey=b.dataset.opsPreset;x=0;render();});
 opTabs.addEventListener('click',e=>{const b=e.target.closest('[data-ops-op]');if(!b)return;op=b.dataset.opsOp;render();});
 slider.addEventListener('input',()=>{x=Number(slider.value);render();});
 host.addEventListener('mathhard:interactive-reset',()=>{presetKey='simple';op='sum';x=0;render();});
 render();
}
export function mountFunctionOperationsExplorers(root=document){root.querySelectorAll('[data-mh-function-operations-lab]').forEach(mount);}
