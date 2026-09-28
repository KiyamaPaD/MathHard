const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>{const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*10)/10).replace('.',',')};
const periodic=x=>{const t=((x%4)+4)%4;return t<=1?2*t:t<=2?4-2*t:t<=3?-2*(t-2):-2+2*(t-3)};
function frame(content='',aria='Grafic interactiv pentru periodicitate'){
 const w=680,h=330,p={l:42,r:22,t:20,b:34},x0=-7,x1=7,y0=-3,y1=3,px=x=>p.l+(x-x0)/(x1-x0)*(w-p.l-p.r),py=y=>h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);
 const xs=[];for(let x=x0;x<=x1;x++)xs.push(x);const ys=[];for(let y=y0;y<=y1;y++)ys.push(y);
 const grid=xs.map(x=>`<line class="mh-fp-grid" x1="${px(x)}" y1="${p.t}" x2="${px(x)}" y2="${h-p.b}"/>`).join('')+ys.map(y=>`<line class="mh-fp-grid" x1="${p.l}" y1="${py(y)}" x2="${w-p.r}" y2="${py(y)}"/>`).join('');
 const labels=xs.filter(x=>x).map(x=>`<text class="mh-fp-tick" x="${px(x)}" y="${py(0)+18}">${x}</text>`).join('')+ys.filter(y=>y).map(y=>`<text class="mh-fp-tick" x="${px(0)-11}" y="${py(y)+4}">${y}</text>`).join('');
 return{px,py,html:`<svg class="mh-function-parity-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${aria}">${grid}<line class="mh-fp-axis" x1="${p.l}" y1="${py(0)}" x2="${w-p.r}" y2="${py(0)}"/><line class="mh-fp-axis" x1="${px(0)}" y1="${h-p.b}" x2="${px(0)}" y2="${p.t}"/>${labels}<text class="mh-fp-axis-name" x="${w-p.r-8}" y="${py(0)-9}">x</text><text class="mh-fp-axis-name" x="${px(0)+9}" y="${p.t+9}">y</text>${content}</svg>`};
}
function curve(fn,px,py,shift=0,attrs='') {const a=[];for(let x=-7;x<=7.001;x+=.125)a.push(`${px(x+shift)},${py(fn(x))}`);return `<polyline class="mh-fp-curve" ${attrs} points="${a.join(' ')}"/>`;}
const modes={
 valid:{label:'perioadă validă',shift:4,domain:true,msg:'Întregul model coincide: 4 este perioadă.'},
 small:{label:'deplasare prea mică',shift:2,domain:true,msg:'Modelul nu se suprapune complet: 2 nu este perioadă.'},
 constant:{label:'funcție constantă',shift:1.5,domain:true,msg:'Orice T>0 este perioadă. Nu există perioadă principală.'},
 domain:{label:'domeniu incompatibil',shift:2,domain:false,msg:'Testul se oprește: domeniul nu permite repetarea globală.'}
};
function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';let mode='valid',shift=4;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator de periodicitate</strong><small>Deplasează modelul și verifică dacă întregul grafic se suprapune.</small></div></div><div class="mh-function-parity__tabs" data-per-tabs></div><div class="mh-function-parity__slider"><label>Deplasare orizontală: <strong data-per-value></strong></label><input type="range" min="0.5" max="6" step="0.5" data-per-range></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-per-canvas></div><aside class="mh-function-parity__readout" data-per-readout></aside></div></section>`;
 const tabs=host.querySelector('[data-per-tabs]'),range=host.querySelector('[data-per-range]'),value=host.querySelector('[data-per-value]'),canvas=host.querySelector('[data-per-canvas]'),readout=host.querySelector('[data-per-readout]');
 function render(){
  const m=modes[mode];tabs.innerHTML=Object.entries(modes).map(([k,v])=>`<button type="button" data-per-mode="${k}" class="${k===mode?'is-active':''}">${v.label}</button>`).join('');range.value=String(shift);value.textContent=fmt(shift);
  const f=frame();let extra='';let overlap=false,domainOk=m.domain;
  if(mode==='constant'){extra=curve(()=>1.25,f.px,f.py,0)+curve(()=>1.25,f.px,f.py,shift,'opacity=".42" stroke-dasharray="8 5"');overlap=true;}
  else if(mode==='domain'){
   const pts=[];for(let x=-3;x<=3.001;x+=.125)pts.push(`${f.px(x)},${f.py(.22*x*x-1)}`);extra=`<polyline class="mh-fp-curve" points="${pts.join(' ')}"/><circle class="mh-fp-domain-missing" cx="${f.px(5)}" cy="${f.py(0)}" r="9"/><text class="mh-fp-point-label" x="${f.px(5)-44}" y="${f.py(0)-12}">5 ∉ D</text>`;
  }else{extra=curve(periodic,f.px,f.py,0)+curve(periodic,f.px,f.py,shift,'opacity=".42" stroke-dasharray="8 5"');overlap=Math.abs((shift/4)-Math.round(shift/4))<1e-9;}
  canvas.innerHTML=f.html.replace('</svg>',`${extra}</svg>`);
  const msg=mode==='valid'&&shift!==4?(overlap?'Modelul se suprapune complet pentru această deplasare.':'Modelul nu se suprapune complet pentru această deplasare.'):mode==='small'&&shift!==2?(overlap?'Modelul se suprapune complet pentru această deplasare.':'Modelul nu se suprapune complet pentru această deplasare.'):m.msg;
  readout.innerHTML=`<strong>${m.label}</strong><p>Perioadă candidat: ${fmt(shift)}</p><p>Model suprapus: ${overlap?'Da':'Nu'}</p><p>Domeniu compatibil: ${domainOk?'Da':'Nu'}</p><p>${msg}</p>`;
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-per-mode]');if(!b)return;mode=b.dataset.perMode;shift=modes[mode].shift;render();});
 range.addEventListener('input',()=>{shift=clamp(Number(range.value)||modes[mode].shift,.5,6);render();});
 host.addEventListener('mathhard:interactive-reset',()=>{mode='valid';shift=4;render();});render();
}
export function mountFunctionPeriodicityExplorers(root=document){root.querySelectorAll('[data-mh-function-periodicity-lab]').forEach(mount);}
