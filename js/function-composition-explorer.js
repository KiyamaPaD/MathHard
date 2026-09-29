const KATEX_OPTS={delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea']};
const renderMath=root=>{try{globalThis.renderMathInElement?.(root,KATEX_OPTS)}catch(_){}};
const fmt=n=>{if(!Number.isFinite(n))return '—';const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*100)/100).replace('.',',')};
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-7;
const presets={
 basic:{label:'liniar + pătrat',range:[-3,3],step:.25,start:1,
  f:{tex:'f(t)=2t+1',domainTex:'\\mathbb R',ok:()=>true,val:t=>2*t+1},
  g:{tex:'g(x)=x^2',domainTex:'\\mathbb R',ok:()=>true,val:x=>x*x},
  fg:{domainTex:'\\mathbb R',formulaTex:'(f\\circ g)(x)=2x^2+1'},gf:{domainTex:'\\mathbb R',formulaTex:'(g\\circ f)(x)=(2x+1)^2'}},
 radical:{label:'radical la exterior',range:[-2,6],step:.25,start:1,
  f:{tex:'f(t)=\\sqrt t',domainTex:'[0,\\infty)',ok:t=>t>=0,val:t=>Math.sqrt(t)},
  g:{tex:'g(x)=x-2',domainTex:'\\mathbb R',ok:()=>true,val:x=>x-2},
  fg:{domainTex:'[2,\\infty)',formulaTex:'(f\\circ g)(x)=\\sqrt{x-2}'},gf:{domainTex:'[0,\\infty)',formulaTex:'(g\\circ f)(x)=\\sqrt x-2'}},
 rational:{label:'valoare interzisă',range:[-4,4],step:.01,start:Math.sqrt(3),
  f:{tex:'f(t)=\\frac1{t-3}',domainTex:'\\mathbb R\\setminus\\{3\\}',ok:t=>!near(t,3),val:t=>1/(t-3)},
  g:{tex:'g(x)=x^2',domainTex:'\\mathbb R',ok:()=>true,val:x=>x*x},
  fg:{domainTex:'\\mathbb R\\setminus\\{-\\sqrt3,\\sqrt3\\}',formulaTex:'(f\\circ g)(x)=\\frac1{x^2-3}'},gf:{domainTex:'\\mathbb R\\setminus\\{3\\}',formulaTex:'(g\\circ f)(x)=\\left(\\frac1{x-3}\\right)^2'}},
 compare:{label:'compară ordinea',range:[-2,6],step:.25,start:1,
  f:{tex:'f(x)=\\sqrt x',domainTex:'[0,\\infty)',ok:x=>x>=0,val:x=>Math.sqrt(x)},
  g:{tex:'g(x)=x-2',domainTex:'\\mathbb R',ok:()=>true,val:x=>x-2},
  fg:{domainTex:'[2,\\infty)',formulaTex:'(f\\circ g)(x)=\\sqrt{x-2}'},gf:{domainTex:'[0,\\infty)',formulaTex:'(g\\circ f)(x)=\\sqrt x-2'}}
};
function evaluate(p,order,x){
 const inner=order==='fg'?p.g:p.f,outer=order==='fg'?p.f:p.g,innerName=order==='fg'?'g':'f',outerName=order==='fg'?'f':'g';
 const inputOk=inner.ok(x);if(!inputOk)return{inputOk:false,midOk:false,resultOk:false,innerName,outerName,mid:null,result:null};
 const mid=inner.val(x),midOk=Number.isFinite(mid)&&outer.ok(mid);if(!midOk)return{inputOk:true,midOk:false,resultOk:false,innerName,outerName,mid,result:null};
 const result=outer.val(mid);return{inputOk:true,midOk:true,resultOk:Number.isFinite(result),innerName,outerName,mid,result};
}
function pipelineHtml(p,order,x,e){
 const first=e.inputOk?'✓':'×',second=e.midOk?'✓':'×';
 const status=!e.inputOk?`Procesul se oprește: ${e.innerName}(${fmt(x)}) nu poate fi calculat pentru această intrare.`:!e.midOk?`${e.innerName}(${fmt(x)}) există, dar valoarea obținută nu aparține domeniului lui ${e.outerName}.`:'Compunerea este definită pentru această valoare.';
 const mid=e.mid==null?'—':fmt(e.mid),result=e.result==null?'—':fmt(e.result);
 return `<div style="display:grid;grid-template-columns:minmax(80px,1fr) 44px minmax(96px,1fr) 44px minmax(96px,1fr);gap:8px;align-items:center;min-height:210px;padding:18px 10px">
 <div style="text-align:center;padding:16px 8px;border:1px solid var(--border);border-radius:14px"><small>Intrare</small><div style="font-size:1.15rem;font-weight:750;margin-top:8px">\\(x=${fmt(x)}\\)</div><div style="margin-top:10px"><strong>${first}</strong> \\(x\\in D_${e.innerName}\\)</div></div>
 <div style="text-align:center;font-size:1.5rem">→<small style="display:block;font-size:.72rem">${e.innerName}</small></div>
 <div style="text-align:center;padding:16px 8px;border:1px solid var(--border);border-radius:14px"><small>Rezultat intermediar</small><div style="font-size:1.15rem;font-weight:750;margin-top:8px">\\(${e.innerName}(x)=${mid}\\)</div><div style="margin-top:10px"><strong>${second}</strong> \\(${e.innerName}(x)\\in D_${e.outerName}\\)</div></div>
 <div style="text-align:center;font-size:1.5rem;opacity:${e.midOk?1:.35}">→<small style="display:block;font-size:.72rem">${e.outerName}</small></div>
 <div style="text-align:center;padding:16px 8px;border:1px solid var(--border);border-radius:14px;opacity:${e.midOk?1:.45}"><small>Rezultat final</small><div style="font-size:1.15rem;font-weight:750;margin-top:8px">\\(${order==='fg'?'f(g(x))':'g(f(x))'}=${result}\\)</div></div>
 </div><p style="margin:0 12px 12px"><strong>${status}</strong></p>`;
}
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let presetKey='basic',order='fg',x=presets.basic.start;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator de compunere</strong><small>Intrare → funcția interioară → verificare de domeniu → funcția exterioară.</small></div></div><div class="mh-function-parity__tabs" data-comp-presets></div><div class="mh-function-parity__tabs" data-comp-orders></div><div class="mh-function-parity__slider"><label>Alege x: <strong data-comp-xv></strong></label><input type="range" data-comp-x></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-comp-pipeline></div><aside class="mh-function-parity__readout" data-comp-readout></aside></div></section>`;
 const presetTabs=host.querySelector('[data-comp-presets]'),orderTabs=host.querySelector('[data-comp-orders]'),slider=host.querySelector('[data-comp-x]'),xv=host.querySelector('[data-comp-xv]'),pipeline=host.querySelector('[data-comp-pipeline]'),readout=host.querySelector('[data-comp-readout]');
 function render(){
  const p=presets[presetKey],[min,max]=p.range;x=Math.max(min,Math.min(max,x));slider.min=String(min);slider.max=String(max);slider.step=String(p.step);slider.value=String(x);xv.textContent=fmt(x);
  presetTabs.innerHTML=Object.entries(presets).map(([k,v])=>`<button type="button" data-comp-preset="${k}" class="${k===presetKey?'is-active':''}">${v.label}</button>`).join('');
  orderTabs.innerHTML=`<button type="button" data-comp-order="fg" class="${order==='fg'?'is-active':''}">f ∘ g</button><button type="button" data-comp-order="gf" class="${order==='gf'?'is-active':''}">g ∘ f</button>`;
  const e=evaluate(p,order,x),cfg=p[order],other=order==='fg'?'gf':'fg',oe=evaluate(p,other,x),inner=order==='fg'?p.g:p.f,outer=order==='fg'?p.f:p.g;
  pipeline.innerHTML=pipelineHtml(p,order,x,e);
  let stage=!e.inputOk?'blocat la funcția interioară':!e.midOk?'blocat la funcția exterioară':'compunere validă';
  const otherResult=oe.resultOk?fmt(oe.result):'nedefinit';
  readout.innerHTML=`<strong>Ordine</strong><p>\\(${order==='fg'?'(f\\circ g)(x)=f(g(x))':'(g\\circ f)(x)=g(f(x))'}\\)</p><p><strong>Stare:</strong> ${stage}</p><hr><strong>Domeniu</strong><p>Funcția interioară:<br>\\(${inner.tex},\\quad D=${inner.domainTex}\\)</p><p>Funcția exterioară:<br>\\(${outer.tex},\\quad D=${outer.domainTex}\\)</p><p>Domeniul compunerii:<br>\\[D=${cfg.domainTex}\\]</p><hr><strong>Formulă</strong><p>\\[${cfg.formulaTex}\\]</p><p><strong>Ordinea inversă la același x:</strong><br>${other==='fg'?'f ∘ g':'g ∘ f'} → ${otherResult}</p>${presetKey==='compare'?'<p>Schimbarea ordinii poate schimba atât rezultatul, cât și domeniul.</p>':''}`;
  renderMath(host);
 }
 presetTabs.addEventListener('click',e=>{const b=e.target.closest('[data-comp-preset]');if(!b)return;presetKey=b.dataset.compPreset;x=presets[presetKey].start;render()});
 orderTabs.addEventListener('click',e=>{const b=e.target.closest('[data-comp-order]');if(!b)return;order=b.dataset.compOrder;render()});
 slider.addEventListener('input',()=>{x=Number(slider.value);render()});
 host.addEventListener('mathhard:interactive-reset',()=>{presetKey='basic';order='fg';x=presets.basic.start;render()});
 render();
}
export function mountFunctionCompositionExplorers(root=document){root.querySelectorAll('[data-mh-function-composition-lab]').forEach(mount)}
