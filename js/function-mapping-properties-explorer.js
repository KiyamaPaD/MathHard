const KATEX_OPTS={delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea']};
const renderMath=root=>{try{globalThis.renderMathInElement?.(root,KATEX_OPTS)}catch(_){}};

const modes={
 inj:{label:'injectivă, nesurjectivă',left:['1','2','3'],right:['a','b','c','d'],arrows:[[0,0],[1,1],[2,2]],inj:true,surj:false},
 surj:{label:'surjectivă, neinjectivă',left:['1','2','3','4'],right:['a','b','c'],arrows:[[0,0],[1,1],[2,2],[3,2]],inj:false,surj:true},
 bij:{label:'bijectivă',left:['1','2','3'],right:['a','b','c'],arrows:[[0,0],[1,1],[2,2]],inj:true,surj:true},
 none:{label:'niciuna',left:['1','2','3','4'],right:['a','b','c','d'],arrows:[[0,0],[1,1],[2,1],[3,2]],inj:false,surj:false}
};

function diagramSvg(cfg,extraCodomain){
 const left=cfg.left,right=extraCodomain?[...cfg.right,'e']:cfg.right;
 const arrows=cfg.arrows;
 const W=900,H=330,lx=140,rx=520,top=64,bottom=286;
 const ly=i=>left.length===1?(top+bottom)/2:top+i*(bottom-top)/(left.length-1);
 const ry=i=>right.length===1?(top+bottom)/2:top+i*(bottom-top)/(right.length-1);
 const incoming=new Array(right.length).fill(0);arrows.forEach(([,j])=>{if(j<incoming.length)incoming[j]++});
 const defs='<defs><marker id="mh-map-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor"/></marker></defs>';
 const arrowSvg=arrows.map(([i,j])=>`<path d="M ${lx+24} ${ly(i)} C ${lx+120} ${ly(i)}, ${rx-120} ${ry(j)}, ${rx-24} ${ry(j)}" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".8" marker-end="url(#mh-map-arrow)"/>`).join('');
 const leftNodes=left.map((v,i)=>`<g><circle cx="${lx}" cy="${ly(i)}" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="${lx}" y="${ly(i)+5}" text-anchor="middle" class="mh-rep-axis-name">${v}</text></g>`).join('');
 const rightNodes=right.map((v,i)=>{const n=incoming[i]||0,kind=n===0?'gol':n>1?'ciocnire':'exact una';return `<g><circle cx="${rx}" cy="${ry(i)}" r="22" fill="var(--bg)" stroke="${n===0?'var(--muted)':'var(--border)'}" stroke-width="${n>1?3:2}" ${n===0?'stroke-dasharray="4 4"':''}/><text x="${rx}" y="${ry(i)+5}" text-anchor="middle" class="mh-rep-axis-name">${v}</text><text x="${rx+132}" y="${ry(i)+5}" class="mh-rep-axis-label">${n} ${n===1?'preimagine':'preimagini'} · ${kind}</text></g>`}).join('');
 return `<svg viewBox="0 0 ${W} ${H}" class="mh-representation-graph" role="img" aria-label="Diagramă cu săgeți între domeniu și codomeniu">${defs}<text x="${lx}" y="30" text-anchor="middle" class="mh-rep-axis-name">Domeniu A</text><text x="${rx}" y="30" text-anchor="middle" class="mh-rep-axis-name">Codomeniu B</text>${arrowSvg}${leftNodes}${rightNodes}</svg>`;
}

function classify(cfg,extra){
 const rightCount=cfg.right.length+(extra?1:0),incoming=new Array(rightCount).fill(0);cfg.arrows.forEach(([,j])=>{if(j<incoming.length)incoming[j]++});
 const inj=incoming.every(n=>n<=1),surj=incoming.every(n=>n>=1);return{inj,surj,bij:inj&&surj,collision:incoming.some(n=>n>1),gap:incoming.some(n=>n===0)};
}

function yn(v){return v?'Da':'Nu'};
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let mode='inj',extra=false;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator: inj, surj și bij</strong><small>Numără preimaginile fiecărui element din codomeniu.</small></div></div><div class="mh-function-parity__tabs" data-map-tabs></div><div class="mh-function-parity__tabs"><button type="button" data-map-extra>Adaugă un element neatins în codomeniu</button></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-map-diagram></div><aside class="mh-function-parity__readout" data-map-readout></aside></div></section>`;
 const tabs=host.querySelector('[data-map-tabs]'),extraBtn=host.querySelector('[data-map-extra]'),diagram=host.querySelector('[data-map-diagram]'),readout=host.querySelector('[data-map-readout]');
 function render(){
  const cfg=modes[mode],c=classify(cfg,extra);
  tabs.innerHTML=Object.entries(modes).map(([k,v])=>`<button type="button" data-map-mode="${k}" class="${k===mode?'is-active':''}">${v.label}</button>`).join('');
  extraBtn.classList.toggle('is-active',extra);extraBtn.textContent=extra?'Elimină elementul suplimentar':'Adaugă un element neatins în codomeniu';
  diagram.innerHTML=diagramSvg(cfg,extra);
  readout.innerHTML=`<strong>Detector rapid</strong><p>\[\text{INJ}\Rightarrow \le 1\]</p><p>\[\text{SURJ}\Rightarrow \ge 1\]</p><p>\[\text{BIJ}\Rightarrow =1\]</p><hr><p><strong>Ciocniri:</strong> ${yn(c.collision)}</p><p><strong>Goluri în codomeniu:</strong> ${yn(c.gap)}</p><p><strong>Injectivă:</strong> ${yn(c.inj)}</p><p><strong>Surjectivă:</strong> ${yn(c.surj)}</p><p><strong>Bijectivă:</strong> ${yn(c.bij)}</p>${extra?'<hr><p><strong>Observă:</strong> săgețile au rămas aceleași, dar codomeniul s-a mărit. Elementul nou este neatins, deci surjectivitatea poate dispărea doar prin schimbarea codomeniului.</p>':''}`;
  renderMath(host);
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-map-mode]');if(!b)return;mode=b.dataset.mapMode;extra=false;render()});
 extraBtn.addEventListener('click',()=>{extra=!extra;render()});
 host.addEventListener('mathhard:interactive-reset',()=>{mode='inj';extra=false;render()});
 render();
}
export function mountFunctionMappingPropertiesExplorers(root=document){root.querySelectorAll('[data-mh-function-mapping-properties-lab]').forEach(mount)}
