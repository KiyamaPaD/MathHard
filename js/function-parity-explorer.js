const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const renderMath=(root)=>{try{globalThis.MH_render?.(root);}catch(_){}};
const fmt=(n)=>{const v=Math.abs(n)<1e-9?0:n;return Number.isInteger(v)?String(v):String(Math.round(v*100)/100).replace(".",",");};

function svgFrame({xMin=-5,xMax=5,yMin=-5,yMax=5,width=660,height=330,content="",aria="Grafic interactiv pentru paritate și simetrie"}){
  const pad={l:42,r:24,t:20,b:34};
  const px=(x)=>pad.l+(x-xMin)/(xMax-xMin)*(width-pad.l-pad.r);
  const py=(y)=>height-pad.b-(y-yMin)/(yMax-yMin)*(height-pad.t-pad.b);
  const xTicks=[];for(let x=Math.ceil(xMin);x<=Math.floor(xMax);x++)xTicks.push(x);
  const yTicks=[];for(let y=Math.ceil(yMin);y<=Math.floor(yMax);y++)yTicks.push(y);
  const grid=xTicks.map(x=>`<line class="mh-fp-grid" x1="${px(x)}" y1="${pad.t}" x2="${px(x)}" y2="${height-pad.b}"/>`).join("")+yTicks.map(y=>`<line class="mh-fp-grid" x1="${pad.l}" y1="${py(y)}" x2="${width-pad.r}" y2="${py(y)}"/>`).join("");
  const labels=xTicks.filter(x=>x!==0).map(x=>`<text class="mh-fp-tick" x="${px(x)}" y="${py(0)+18}">${x}</text>`).join("")+yTicks.filter(y=>y!==0).map(y=>`<text class="mh-fp-tick" x="${px(0)-11}" y="${py(y)+4}">${y}</text>`).join("");
  return {html:`<svg class="mh-function-parity-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}">${grid}<line class="mh-fp-axis" x1="${pad.l}" y1="${py(0)}" x2="${width-pad.r}" y2="${py(0)}"/><line class="mh-fp-axis" x1="${px(0)}" y1="${height-pad.b}" x2="${px(0)}" y2="${pad.t}"/>${labels}<text class="mh-fp-axis-name" x="${width-pad.r-8}" y="${py(0)-9}">x</text><text class="mh-fp-axis-name" x="${px(0)+9}" y="${pad.t+9}">y</text>${content}</svg>`,px,py};
}
function polyline(points,px,py){return `<polyline class="mh-fp-curve" points="${points.map(([x,y])=>`${px(x)},${py(y)}`).join(" ")}"/>`;}
function dot(x,y,px,py,{label="",cls="mh-fp-dot"}={}){return `<circle class="${cls}" cx="${px(x)}" cy="${py(y)}" r="6"/>${label?`<text class="mh-fp-point-label" x="${px(x)+8}" y="${py(y)-9}">${label}</text>`:""}`;}

const moduri={
  para:{eticheta:"pară",domeniu:"Domeniu simetric: [-4,4]",fn:x=>Math.abs(x),relatie:"f(-x)=f(x) — reflexie față de axa Oy."},
  impara:{eticheta:"impară",domeniu:"Domeniu simetric: [-4,4]",fn:x=>x,relatie:"f(-x)=-f(x) — simetrie față de origine."},
  niciuna:{eticheta:"niciuna · domeniu simetric",domeniu:"Domeniu simetric: [-4,4]",fn:x=>0.35*x*x+x-1,relatie:"Domeniul este simetric, dar graficul nu respectă nici simetria față de Oy, nici simetria față de origine."},
  domeniu:{eticheta:"domeniu nesimetric",domeniu:"Domeniu: [0,4] — nesimetric față de 0",fn:x=>0.35*x*x,relatie:"Oprește testul: există x în domeniu pentru care -x nu aparține domeniului."}
};
const puncte=(mod)=>{const p=moduri[mod],arr=[],start=mod==="domeniu"?0:-4;for(let x=start;x<=4.0001;x+=0.25)arr.push([x,p.fn(x)]);return arr;};

function mount(host){
  if(!host||host.dataset.mhMounted==="1")return;
  host.dataset.mhMounted="1";let mod="para",x=2.5;
  host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator: paritate și simetrie</strong><small>Compară x și -x înainte de clasificarea graficului.</small></div></div><div class="mh-function-parity__tabs" data-fp-tabs></div><div class="mh-function-parity__slider"><label>Alege x: <strong data-fp-x></strong></label><input type="range" min="1.25" max="4" step="0.25" value="2.5" data-fp-range></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-fp-canvas></div><aside class="mh-function-parity__readout" data-fp-readout></aside></div></section>`;
  const tabs=host.querySelector("[data-fp-tabs]"),range=host.querySelector("[data-fp-range]"),xLabel=host.querySelector("[data-fp-x]"),canvas=host.querySelector("[data-fp-canvas]"),readout=host.querySelector("[data-fp-readout]");
  function render(){
    const p=moduri[mod];
    tabs.innerHTML=Object.entries(moduri).map(([k,v])=>`<button type="button" data-fp-key="${k}" class="${k===mod?"is-active":""}">${v.eticheta}</button>`).join("");
    xLabel.textContent=fmt(x);
    const base=svgFrame({});let extra=polyline(puncte(mod),base.px,base.py);const y=p.fn(x);
    if(mod==="para")extra+=dot(x,y,base.px,base.py,{label:`(${fmt(x)},${fmt(y)})`})+dot(-x,y,base.px,base.py,{label:`(-${fmt(x)},${fmt(y)})`,cls:"mh-fp-dot mh-fp-dot--pair"});
    else if(mod==="impara")extra+=dot(x,y,base.px,base.py,{label:`(${fmt(x)},${fmt(y)})`})+dot(-x,-y,base.px,base.py,{label:`(-${fmt(x)},${fmt(-y)})`,cls:"mh-fp-dot mh-fp-dot--pair"});
    else if(mod==="niciuna"){const yn=p.fn(-x);extra+=dot(x,y,base.px,base.py,{label:`(${fmt(x)},${fmt(y)})`})+dot(-x,yn,base.px,base.py,{label:`(-${fmt(x)},${fmt(yn)})`,cls:"mh-fp-dot mh-fp-dot--warn"});}
    else{extra+=dot(x,y,base.px,base.py,{label:`(${fmt(x)},${fmt(y)})`});extra+=`<circle class="mh-fp-domain-missing" cx="${base.px(-x)}" cy="${base.py(0)}" r="9"/><text class="mh-fp-point-label" x="${base.px(-x)+10}" y="${base.py(0)-10}">-${fmt(x)} ∉ D</text>`;}
    base.html=base.html.replace("</svg>",`${extra}</svg>`);canvas.innerHTML=base.html;
    readout.innerHTML=`<strong>${p.eticheta}</strong><p>${p.domeniu}</p><p>${p.relatie}</p>`;
    renderMath(host);
  }
  tabs.addEventListener("click",e=>{const b=e.target.closest("[data-fp-key]");if(!b)return;mod=b.dataset.fpKey;render();});
  range.addEventListener("input",()=>{x=clamp(Number(range.value)||2.5,1.25,4);render();});
  render();
}
export function mountFunctionParityExplorers(root=document){root.querySelectorAll("[data-mh-function-parity-symmetry-lab]").forEach(mount);}
