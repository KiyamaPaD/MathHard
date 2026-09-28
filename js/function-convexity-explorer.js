const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>{const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*100)/100).replace('.',',')};
const presets={
 convex:{label:'convexă',fn:x=>0.16*x*x-1.4,classification:'convexă'},
 concave:{label:'concavă',fn:x=>-0.16*x*x+1.4,classification:'concavă'},
 affine:{label:'afină',fn:x=>0.42*x-0.25,classification:'convexă și concavă'},
 neither:{label:'niciuna',fn:x=>0.035*x*x*x+0.12*x,classification:'nici convexă, nici concavă'}
};
function frame(content='',aria='Grafic interactiv pentru convexitate și concavitate'){
 const w=680,h=340,p={l:44,r:22,t:20,b:36},x0=-6,x1=6,y0=-4,y1=4,px=x=>p.l+(x-x0)/(x1-x0)*(w-p.l-p.r),py=y=>h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);
 const xs=[];for(let x=x0;x<=x1;x++)xs.push(x);const ys=[];for(let y=y0;y<=y1;y++)ys.push(y);
 const grid=xs.map(x=>`<line class="mh-fp-grid" x1="${px(x)}" y1="${p.t}" x2="${px(x)}" y2="${h-p.b}"/>`).join('')+ys.map(y=>`<line class="mh-fp-grid" x1="${p.l}" y1="${py(y)}" x2="${w-p.r}" y2="${py(y)}"/>`).join('');
 const labels=xs.filter(x=>x).map(x=>`<text class="mh-fp-tick" x="${px(x)}" y="${py(0)+18}">${x}</text>`).join('')+ys.filter(y=>y).map(y=>`<text class="mh-fp-tick" x="${px(0)-12}" y="${py(y)+4}">${y}</text>`).join('');
 return{px,py,html:`<svg class="mh-function-parity-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${aria}">${grid}<line class="mh-fp-axis" x1="${p.l}" y1="${py(0)}" x2="${w-p.r}" y2="${py(0)}"/><line class="mh-fp-axis" x1="${px(0)}" y1="${h-p.b}" x2="${px(0)}" y2="${p.t}"/>${labels}<text class="mh-fp-axis-name" x="${w-p.r-8}" y="${py(0)-9}">x</text><text class="mh-fp-axis-name" x="${px(0)+9}" y="${p.t+9}">y</text>${content}</svg>`};
}
function curve(fn,px,py){const a=[];for(let x=-6;x<=6.001;x+=.1)a.push(`${px(x)},${py(fn(x))}`);return `<polyline class="mh-fp-curve" points="${a.join(' ')}"/>`;}
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let mode='convex',x1=-3,x2=3,lambda=.5;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator de convexitate și concavitate</strong><small>Compară punctul de pe grafic cu punctul corespunzător de pe segment.</small></div></div><div class="mh-function-parity__tabs" data-cvx-tabs></div><div class="mh-function-parity__slider"><label>x₁: <strong data-cvx-x1v></strong></label><input type="range" min="-5" max="4" step="0.5" data-cvx-x1><label>x₂: <strong data-cvx-x2v></strong></label><input type="range" min="-4" max="5" step="0.5" data-cvx-x2><label>λ: <strong data-cvx-lv></strong></label><input type="range" min="0" max="1" step="0.05" data-cvx-lambda></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-cvx-canvas></div><aside class="mh-function-parity__readout" data-cvx-readout></aside></div></section>`;
 const tabs=host.querySelector('[data-cvx-tabs]'),r1=host.querySelector('[data-cvx-x1]'),r2=host.querySelector('[data-cvx-x2]'),rl=host.querySelector('[data-cvx-lambda]'),v1=host.querySelector('[data-cvx-x1v]'),v2=host.querySelector('[data-cvx-x2v]'),vl=host.querySelector('[data-cvx-lv]'),canvas=host.querySelector('[data-cvx-canvas]'),readout=host.querySelector('[data-cvx-readout]');
 function render(){
  if(x1>=x2-.5){if(document.activeElement===r1)x1=x2-.5;else x2=x1+.5;}x1=clamp(x1,-5,4);x2=clamp(x2,-4,5);lambda=clamp(lambda,0,1);
  const p=presets[mode],f=frame(),y1=p.fn(x1),y2=p.fn(x2),xl=(1-lambda)*x1+lambda*x2,yg=p.fn(xl),ys=(1-lambda)*y1+lambda*y2,d=yg-ys,eps=1e-8,endpoint=lambda<eps||lambda>1-eps,rel=Math.abs(d)<1e-7?'=':d<0?'≤':'≥';
  tabs.innerHTML=Object.entries(presets).map(([k,v])=>`<button type="button" data-cvx-mode="${k}" class="${k===mode?'is-active':''}">${v.label}</button>`).join('');
  r1.value=String(x1);r2.value=String(x2);rl.value=String(lambda);v1.textContent=fmt(x1);v2.textContent=fmt(x2);vl.textContent=fmt(lambda);
  const seg=`<line class="mh-fp-axis" x1="${f.px(x1)}" y1="${f.py(y1)}" x2="${f.px(x2)}" y2="${f.py(y2)}"/><circle class="mh-fp-dot" cx="${f.px(x1)}" cy="${f.py(y1)}" r="6"/><circle class="mh-fp-dot" cx="${f.px(x2)}" cy="${f.py(y2)}" r="6"/><circle class="mh-fp-dot" cx="${f.px(xl)}" cy="${f.py(yg)}" r="7"/><circle class="mh-fp-dot mh-fp-dot--pair" cx="${f.px(xl)}" cy="${f.py(ys)}" r="7"/><line class="mh-fp-axis" x1="${f.px(xl)}" y1="${f.py(yg)}" x2="${f.px(xl)}" y2="${f.py(ys)}"/>`;
  canvas.innerHTML=f.html.replace('</svg>',`${curve(p.fn,f.px,f.py)}${seg}</svg>`);
  let msg;if(endpoint)msg='La capetele segmentului apare întotdeauna egalitate; clasificarea se decide din comportamentul interior.';else if(mode==='convex')msg='Valoarea funcției este sub segment: comportament convex.';else if(mode==='concave')msg='Valoarea funcției este deasupra segmentului: comportament concav.';else if(mode==='affine')msg='Apare egalitate pentru toate combinațiile: funcția este simultan convexă și concavă.';else msg='Această funcție nu păstrează același sens al inegalității pentru toate perechile.';
  readout.innerHTML=`<strong>${p.label}</strong><p>xλ = ${fmt(xl)}</p><p>Poziția graficului: ${fmt(yg)}</p><p>Poziția segmentului: ${fmt(ys)}</p><p>Relație: ${rel}</p><p>Clasificare: ${p.classification}</p><p>${msg}</p>`;
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-cvx-mode]');if(!b)return;mode=b.dataset.cvxMode;if(mode==='neither'){x1=-4;x2=1;lambda=.5}else{x1=-3;x2=3;lambda=.5}render();});
 r1.addEventListener('input',()=>{x1=Number(r1.value);render()});r2.addEventListener('input',()=>{x2=Number(r2.value);render()});rl.addEventListener('input',()=>{lambda=Number(rl.value);render()});host.addEventListener('mathhard:interactive-reset',()=>{mode='convex';x1=-3;x2=3;lambda=.5;render()});render();
}
export function mountFunctionConvexityExplorers(root=document){root.querySelectorAll('[data-mh-function-convexity-lab]').forEach(mount);}
