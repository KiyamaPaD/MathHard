const KATEX_OPTS={delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea']};
const renderMath=root=>{try{globalThis.renderMathInElement?.(root,KATEX_OPTS)}catch(_){try{globalThis.MH_render?.(root)}catch(__){}}};

const modes={
 arrows:{label:'Întoarce săgețile'},
 collision:{label:'Caz nebijectiv'},
 graph:{label:'Simetrie pe grafic'},
 square:{label:'Restricția domeniului'}
};

function arrowSvg(inverse=false){
 const left=inverse?['3','5','7']:['1','2','3'];
 const right=inverse?['1','2','3']:['3','5','7'];
 const pairs=[[0,0],[1,1],[2,2]];
 const lx=120,rx=520,H=280,ys=[70,140,210];
 const defs='<defs><marker id="mh-inv-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor"/></marker></defs>';
 const arrows=pairs.map(([i,j])=>`<path d="M ${lx+24} ${ys[i]} C ${lx+130} ${ys[i]}, ${rx-130} ${ys[j]}, ${rx-24} ${ys[j]}" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".82" marker-end="url(#mh-inv-arrow)"/>`).join('');
 const nodes=(arr,x)=>arr.map((v,i)=>`<g><circle cx="${x}" cy="${ys[i]}" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="${x}" y="${ys[i]+5}" text-anchor="middle" class="mh-rep-axis-name">${v}</text></g>`).join('');
 return `<svg viewBox="0 0 640 ${H}" class="mh-representation-graph" role="img" aria-label="Asociere bijectivă și asocierea inversată">${defs}<text x="${lx}" y="32" text-anchor="middle" class="mh-rep-axis-name">${inverse?'B':'A'}</text><text x="${rx}" y="32" text-anchor="middle" class="mh-rep-axis-name">${inverse?'A':'B'}</text>${arrows}${nodes(left,lx)}${nodes(right,rx)}</svg>`;
}

function collisionSvg(kind='collision'){
 const lx=120,rx=520,H=280;
 if(kind==='collision'){
  return `<svg viewBox="0 0 640 ${H}" class="mh-representation-graph" role="img" aria-label="Asociere neinversabilă prin coliziune"><defs><marker id="mh-inv-arrow2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor"/></marker></defs><text x="120" y="32" text-anchor="middle" class="mh-rep-axis-name">A</text><text x="520" y="32" text-anchor="middle" class="mh-rep-axis-name">B</text><circle cx="120" cy="90" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="120" y="95" text-anchor="middle" class="mh-rep-axis-name">1</text><circle cx="120" cy="190" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="120" y="195" text-anchor="middle" class="mh-rep-axis-name">2</text><circle cx="520" cy="140" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="3"/><text x="520" y="145" text-anchor="middle" class="mh-rep-axis-name">a</text><path d="M144 90 C280 90, 360 140, 496 140" fill="none" stroke="currentColor" stroke-width="2.4" marker-end="url(#mh-inv-arrow2)"/><path d="M144 190 C280 190, 360 140, 496 140" fill="none" stroke="currentColor" stroke-width="2.4" marker-end="url(#mh-inv-arrow2)"/><text x="520" y="220" text-anchor="middle" class="mh-rep-axis-label">a are două preimagini</text></svg>`;
 }
 return `<svg viewBox="0 0 640 ${H}" class="mh-representation-graph" role="img" aria-label="Asociere injectivă dar nesurjectivă prin element neatins"><defs><marker id="mh-inv-arrow3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="currentColor"/></marker></defs><text x="120" y="32" text-anchor="middle" class="mh-rep-axis-name">A</text><text x="520" y="32" text-anchor="middle" class="mh-rep-axis-name">B</text><circle cx="120" cy="90" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="120" y="95" text-anchor="middle" class="mh-rep-axis-name">1</text><circle cx="120" cy="190" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="120" y="195" text-anchor="middle" class="mh-rep-axis-name">2</text><circle cx="520" cy="70" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="520" y="75" text-anchor="middle" class="mh-rep-axis-name">a</text><circle cx="520" cy="140" r="22" fill="var(--bg)" stroke="var(--border)" stroke-width="2"/><text x="520" y="145" text-anchor="middle" class="mh-rep-axis-name">b</text><circle cx="520" cy="210" r="22" fill="var(--bg)" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 4"/><text x="520" y="215" text-anchor="middle" class="mh-rep-axis-name">c</text><path d="M144 90 C280 90, 360 70, 496 70" fill="none" stroke="currentColor" stroke-width="2.4" marker-end="url(#mh-inv-arrow3)"/><path d="M144 190 C280 190, 360 140, 496 140" fill="none" stroke="currentColor" stroke-width="2.4" marker-end="url(#mh-inv-arrow3)"/><text x="520" y="258" text-anchor="middle" class="mh-rep-axis-label">c nu este atins</text></svg>`;
}

function graphSvg(a=1){
 const W=660,H=360,cx=330,cy=180,sx=55,sy=40;
 const X=x=>cx+x*sx,Y=y=>cy-y*sy;
 const line=(fn,x1,x2,klass)=>{const pts=[];for(let x=x1;x<=x2+1e-9;x+=.12)pts.push(`${X(x).toFixed(1)},${Y(fn(x)).toFixed(1)}`);return `<polyline points="${pts.join(' ')}" fill="none" class="${klass}" stroke-width="3"/>`};
 const fa=2*a+1,ia=(fa-1)/2;
 return `<svg viewBox="0 0 ${W} ${H}" class="mh-representation-graph" role="img" aria-label="Graficele unei funcții și inversei sale simetrice față de y egal x"><line x1="55" y1="${cy}" x2="610" y2="${cy}" class="mh-rep-axis"/><line x1="${cx}" y1="35" x2="${cx}" y2="325" class="mh-rep-axis"/><line x1="80" y1="${Y(-4.55)}" x2="580" y2="${Y(4.55)}" stroke="currentColor" stroke-width="1.7" stroke-dasharray="6 5" opacity=".55"/><text x="565" y="${Y(4.05)}" class="mh-rep-axis-label">y=x</text>${line(x=>2*x+1,-4,4,'mh-rep-real-line')}${line(x=>(x-1)/2,-4,4,'mh-rep-comparison-line')}<circle cx="${X(a)}" cy="${Y(fa)}" r="6" class="mh-rep-graph-point"/><circle cx="${X(fa)}" cy="${Y(a)}" r="6" class="mh-rep-graph-point"/><line x1="${X(a)}" y1="${Y(fa)}" x2="${X(fa)}" y2="${Y(a)}" stroke="currentColor" stroke-width="1.4" stroke-dasharray="4 4" opacity=".45"/><text x="600" y="${cy-10}" class="mh-rep-axis-name">x</text><text x="${cx+10}" y="42" class="mh-rep-axis-name">y</text></svg>`;
}

function squareSvg(restricted=true){
 const W=660,H=340,cx=330,cy=260,sx=60,sy=36;
 const X=x=>cx+x*sx,Y=y=>cy-y*sy;
 const pts=[];for(let x=restricted?0:-3.1;x<=3.1;x+=.09)pts.push(`${X(x).toFixed(1)},${Y(x*x).toFixed(1)}`);
 const inv=[];for(let x=0;x<=6.5;x+=.12)inv.push(`${X(x).toFixed(1)},${Y(Math.sqrt(x)).toFixed(1)}`);
 return `<svg viewBox="0 0 ${W} ${H}" class="mh-representation-graph" role="img" aria-label="Parabolă cu domeniu ${restricted?'restrâns':'complet'} și inversa rădăcină pătrată"><line x1="55" y1="${cy}" x2="610" y2="${cy}" class="mh-rep-axis"/><line x1="${cx}" y1="35" x2="${cx}" y2="305" class="mh-rep-axis"/><polyline points="${pts.join(' ')}" fill="none" class="mh-rep-real-line" stroke-width="3"/>${restricted?`<polyline points="${inv.join(' ')}" fill="none" class="mh-rep-comparison-line" stroke-width="3"/>`:''}<text x="590" y="${cy-10}" class="mh-rep-axis-name">x</text><text x="${cx+10}" y="42" class="mh-rep-axis-name">y</text></svg>`;
}

function mount(host){
 if(!host||host.dataset.mhMounted==='1')return;host.dataset.mhMounted='1';
 let mode='arrows',inverse=false,nonbij='collision',a=1,restricted=true;
 host.innerHTML=`<section class="mh-function-parity"><div class="mh-function-parity__head"><div><strong>Laborator: funcția inversă</strong><small>Întoarce asocierea, verifică bijectivitatea și urmărește simetria față de \\(y=x\\).</small></div></div><div class="mh-function-parity__tabs" data-inv-tabs></div><div class="mh-function-parity__layout"><div class="mh-function-parity__canvas" data-inv-canvas></div><aside class="mh-function-parity__readout" data-inv-readout></aside></div></section>`;
 const tabs=host.querySelector('[data-inv-tabs]'),canvas=host.querySelector('[data-inv-canvas]'),readout=host.querySelector('[data-inv-readout]');
 function controls(){
  if(mode==='arrows') return `<button type="button" data-inv-flip>${inverse?'Arată funcția f':'Inversează săgețile'}</button>`;
  if(mode==='collision') return `<button type="button" data-inv-nonbij>${nonbij==='collision'?'Arată gol în codomeniu':'Arată coliziune'}</button>`;
  if(mode==='graph') return `<label>Valoare a: <input type="range" min="-1" max="2" step=".5" value="${a}" data-inv-a></label>`;
  return `<button type="button" data-inv-restrict>${restricted?'Arată domeniul complet ℝ':'Restrânge la [0,∞)'}</button>`;
 }
 function render(){
  tabs.innerHTML=Object.entries(modes).map(([k,v])=>`<button type="button" data-inv-mode="${k}" class="${k===mode?'is-active':''}">${v.label}</button>`).join('')+`<span data-inv-controls>${controls()}</span>`;
  if(mode==='arrows'){
   canvas.innerHTML=arrowSvg(inverse);
   readout.innerHTML=inverse?`<strong>Asocierea inversată</strong><p>\\[f^{-1}:B\\to A\\]</p><p>\\[f(2)=5\\iff f^{-1}(5)=2\\]</p><p>Fiecare element are exact o preimagine, deci inversarea rămâne funcție.</p>`:`<strong>Asocierea inițială</strong><p>\\[f:A\\to B\\]</p><p>\\[1\\to3,\\quad2\\to5,\\quad3\\to7\\]</p><p>Funcția este bijectivă: fără coliziuni și fără goluri.</p>`;
  } else if(mode==='collision'){
   canvas.innerHTML=collisionSvg(nonbij);
   readout.innerHTML=nonbij==='collision'?`<strong>Nu este injectivă</strong><p>O valoare din codomeniu are două preimagini.</p><p>Dacă întoarcem săgețile, aceeași intrare ar avea două ieșiri.</p><p>\\[\\boxed{f^{-1}\\text{ nu este funcție}}\\]</p>`:`<strong>Nu este surjectivă</strong><p>Există o valoare din codomeniu fără preimagine.</p><p>Inversa nu poate fi definită pe întreg codomeniul.</p><p>\\[\\boxed{f^{-1}:B\\to A\\text{ nu există}}\\]</p>`;
  } else if(mode==='graph'){
   const fa=2*a+1;
   canvas.innerHTML=graphSvg(a);
   readout.innerHTML=`<strong>Simetrie față de \\(y=x\\)</strong><p>\\[f(x)=2x+1\\]</p><p>\\[f^{-1}(x)=\\frac{x-1}{2}\\]</p><p>\\[(${a},${fa})\\longleftrightarrow(${fa},${a})\\]</p><p>Coordonatele se schimbă între ele.</p>`;
  } else {
   canvas.innerHTML=squareSvg(restricted);
   readout.innerHTML=restricted?`<strong>Domeniu restrâns</strong><p>\\[g:[0,\\infty)\\to[0,\\infty),\\quad g(x)=x^2\\]</p><p>Acum funcția este bijectivă.</p><p>\\[g^{-1}(x)=\\sqrt{x}\\]</p>`:`<strong>Domeniu complet</strong><p>\\[f:\\mathbb R\\to[0,\\infty),\\quad f(x)=x^2\\]</p><p>\\[f(-1)=f(1)\\]</p><p>Nu este injectivă, deci nu admite funcție inversă.</p>`;
  }
  renderMath(host);
 }
 tabs.addEventListener('click',e=>{
  const m=e.target.closest('[data-inv-mode]');if(m){mode=m.dataset.invMode;render();return;}
  if(e.target.closest('[data-inv-flip]')){inverse=!inverse;render();return;}
  if(e.target.closest('[data-inv-nonbij]')){nonbij=nonbij==='collision'?'gap':'collision';render();return;}
  if(e.target.closest('[data-inv-restrict]')){restricted=!restricted;render();}
 });
 tabs.addEventListener('input',e=>{if(e.target.matches('[data-inv-a]')){a=Number(e.target.value);render();}});
 host.addEventListener('mathhard:interactive-reset',()=>{mode='arrows';inverse=false;nonbij='collision';a=1;restricted=true;render();});
 render();
}
export function mountFunctionInverseExplorers(root=document){root.querySelectorAll('[data-mh-function-inverse-lab]').forEach(mount)}
