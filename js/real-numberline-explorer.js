(function(){
  const instances = new Map();

  function lang(){ return String(document.documentElement.lang||'ro').toLowerCase().startsWith('en')?'en':'ro'; }
  const T={
    ro:{title:'Explorer — axa numerelor reale',input:'Număr / expresie',add:'Adaugă',clear:'Șterge punctele',order:'Ordine',interval:'Interval',left:'Stânga',right:'Dreapta',closed:'inclus',unbounded:'nemărginit',hint:'Click pe axă = punct nou • trage markerul = mută punctul',bad:'Expresie neacceptată',empty:'Adaugă cel puțin un punct.',approx:'aprox.'},
    en:{title:'Real-number line explorer',input:'Number / expression',add:'Add',clear:'Clear points',order:'Order',interval:'Interval',left:'Left',right:'Right',closed:'closed',unbounded:'unbounded',hint:'Click the line = add point • drag a marker = move point',bad:'Unsupported expression',empty:'Add at least one point.',approx:'approx.'}
  };
  const tr=k=>T[lang()][k]||k;

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; }
  function normalizeDecimalString(s){ return s.replace(',','.').replace(/\s+/g,''); }
  function parseNumber(raw){
    const src=String(raw??'').trim();
    if(!src) return null;
    let s=normalizeDecimalString(src).toLowerCase();
    s=s.replace(/^\+/, '');
    const pi=s.match(/^(-?)pi$/) || s.match(/^(-?)π$/);
    if(pi){ const sign=pi[1]? -1:1; return {rawInput:src,displayLabel:(sign<0?'−':'')+'π',normalizedValue:{type:'pi',sign},approxValue:sign*Math.PI,exactKey:`pi:${sign}`}; }
    const sq=s.match(/^(-?)sqrt\(([-+]?\d+(?:\.\d+)?)\)$/) || s.match(/^(-?)√\(?([-+]?\d+(?:\.\d+)?)\)?$/);
    if(sq){ const sign=sq[1]?-1:1, rad=Number(sq[2]); if(!(rad>=0)) return null; const v=sign*Math.sqrt(rad); return {rawInput:src,displayLabel:`${sign<0?'−':''}√${sq[2]}`,normalizedValue:{type:'sqrt',sign,radicand:rad},approxValue:v,exactKey:`sqrt:${sign}:${rad}`}; }
    const fr=s.match(/^(-?\d+)\/(-?\d+)$/);
    if(fr){ let n=Number(fr[1]), d=Number(fr[2]); if(!d) return null; if(d<0){n=-n;d=-d;} const g=gcd(n,d); const rn=n/g, rd=d/g; return {rawInput:src,displayLabel:`${n}/${d}`,normalizedValue:{type:'rational',numerator:rn,denominator:rd},approxValue:n/d,exactKey:`q:${rn}/${rd}`}; }
    if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){
      const v=Number(s); if(!Number.isFinite(v)) return null;
      // decimals are grouped by a stable numeric key; exact rational recovery is unnecessary for placement.
      return {rawInput:src,displayLabel:src.replace('.',','),normalizedValue:{type:'decimal',value:v},approxValue:v,exactKey:`n:${Number(v.toPrecision(14))}`};
    }
    return null;
  }
  function equivalent(a,b){ return Math.abs(a.approxValue-b.approxValue) <= 1e-10*Math.max(1,Math.abs(a.approxValue),Math.abs(b.approxValue)); }
  function formatApprox(v){ if(Math.abs(v)<1e-12) v=0; return Number(v.toFixed(6)).toString().replace('.',','); }

  function mount(id,host,options={}){
    unmount(id); if(!host) throw new Error('MH_RealNumberLine.mount: missing host');
    const root=document.createElement('section'); root.className='mh-real-nline';
    root.innerHTML=`<style>
      .mh-real-nline{border:1px solid var(--border);border-radius:16px;padding:14px;background:color-mix(in srgb,var(--card) 96%,transparent);display:grid;gap:12px}
      .mh-real-nline *{box-sizing:border-box}.mh-real-nline__head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .mh-real-nline__controls,.mh-real-nline__interval{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mh-real-nline input[type=text]{min-width:110px;max-width:210px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text)}
      .mh-real-nline button{padding:8px 10px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);cursor:pointer}.mh-real-nline button:hover{border-color:var(--accent)}
      .mh-real-nline__stage{position:relative;height:230px;border:1px dashed var(--border);border-radius:14px;overflow:hidden;background:color-mix(in srgb,var(--bg) 72%,var(--card) 28%);touch-action:none}
      .mh-real-nline svg{width:100%;height:100%;display:block;user-select:none}.mh-real-nline__order{font-weight:800;min-height:24px;overflow-wrap:anywhere}.mh-real-nline__error{color:var(--bad);min-height:20px;font-size:.85rem}.mh-real-nline__hint{color:var(--muted);font-size:.8rem}
      .mh-real-nline__interval{border-top:1px solid var(--border);padding-top:10px}.mh-real-nline__interval label{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;color:var(--muted)}
      @media(max-width:640px){.mh-real-nline__stage{height:260px}.mh-real-nline input[type=text]{max-width:150px}}
    </style>
    <div class="mh-real-nline__head"><strong>↔ ${tr('title')}</strong><span class="mh-real-nline__hint">${tr('hint')}</span></div>
    <div class="mh-real-nline__controls"><input class="mh-rnl-input" type="text" inputmode="text" placeholder="${tr('input')} — ex. -3, 1/2, sqrt(2), pi"><button type="button" data-a="add">＋ ${tr('add')}</button><button type="button" data-a="clear">${tr('clear')}</button></div>
    <div class="mh-real-nline__error"></div><div class="mh-real-nline__stage"><svg aria-label="${tr('title')}"></svg></div>
    <div><span style="color:var(--muted)">${tr('order')}:</span> <span class="mh-real-nline__order"></span></div>
    <div class="mh-real-nline__interval"><strong>${tr('interval')}:</strong>
      <label>${tr('left')} <input class="mh-rnl-left" type="text" value="-2"></label><label><input class="mh-rnl-left-unb" type="checkbox"> −∞</label><label><input class="mh-rnl-left-closed" type="checkbox" checked> ${tr('closed')}</label>
      <label>${tr('right')} <input class="mh-rnl-right" type="text" value="3"></label><label><input class="mh-rnl-right-unb" type="checkbox"> +∞</label><label><input class="mh-rnl-right-closed" type="checkbox"> ${tr('closed')}</label>
    </div>`;
    host.innerHTML=''; host.appendChild(root);
    const svg=root.querySelector('svg'), stage=root.querySelector('.mh-real-nline__stage'), input=root.querySelector('.mh-rnl-input'), err=root.querySelector('.mh-real-nline__error'), order=root.querySelector('.mh-real-nline__order');
    const state={points:[],nextId:1,dragId:null,viewMin:-5,viewMax:5,interval:{left:null,right:null,leftUnbounded:false,rightUnbounded:false,leftClosed:true,rightClosed:false}};
    const NS='http://www.w3.org/2000/svg';
    function E(tag,attrs={}){ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v))); return e; }
    function dims(){ const r=stage.getBoundingClientRect(); return {w:Math.max(320,r.width),h:Math.max(180,r.height),pad:44,y:r.height*0.56}; }
    function xOf(v,d){ return d.pad+(v-state.viewMin)/(state.viewMax-state.viewMin)*(d.w-2*d.pad); }
    function vOf(clientX,d){ const r=stage.getBoundingClientRect(); return state.viewMin+(clientX-r.left-d.pad)/(d.w-2*d.pad)*(state.viewMax-state.viewMin); }
    function recomputeGroups(){ let gid=1; state.points.forEach(p=>p.equivalenceGroupId=null); const sorted=[...state.points].sort((a,b)=>a.approxValue-b.approxValue); for(let i=0;i<sorted.length;i++){ if(sorted[i].equivalenceGroupId) continue; const id=`eq-${gid++}`; sorted[i].equivalenceGroupId=id; for(let j=i+1;j<sorted.length;j++) if(equivalent(sorted[i],sorted[j])) sorted[j].equivalenceGroupId=id; } }
    function parseInterval(){
      const lu=root.querySelector('.mh-rnl-left-unb').checked, ru=root.querySelector('.mh-rnl-right-unb').checked;
      const l=lu?null:parseNumber(root.querySelector('.mh-rnl-left').value), r=ru?null:parseNumber(root.querySelector('.mh-rnl-right').value);
      state.interval={left:l,right:r,leftUnbounded:lu,rightUnbounded:ru,leftClosed:root.querySelector('.mh-rnl-left-closed').checked,rightClosed:root.querySelector('.mh-rnl-right-closed').checked};
      return (lu||l)&&(ru||r);
    }
    function fit(){
      const vals=state.points.map(p=>p.approxValue); const I=state.interval; if(I.left) vals.push(I.left.approxValue); if(I.right) vals.push(I.right.approxValue);
      if(!vals.length){state.viewMin=-5;state.viewMax=5;return;} let lo=Math.min(...vals),hi=Math.max(...vals); if(lo===hi){lo-=2;hi+=2;} const span=Math.max(2,hi-lo),m=span*.22; state.viewMin=I.leftUnbounded?Math.min(lo-m,-5):lo-m; state.viewMax=I.rightUnbounded?Math.max(hi+m,5):hi+m;
    }
    function draw(){
      parseInterval(); recomputeGroups(); fit(); const d=dims(); svg.setAttribute('viewBox',`0 0 ${d.w} ${d.h}`); svg.innerHTML='';
      const css=getComputedStyle(root), text=css.getPropertyValue('--text').trim()||'#ddd', muted=css.getPropertyValue('--muted').trim()||'#999', accent=css.getPropertyValue('--accent').trim()||'#7aa2ff', card=css.getPropertyValue('--card').trim()||'#111';
      const axis=E('line',{x1:d.pad,y1:d.y,x2:d.w-d.pad,y2:d.y,stroke:text,'stroke-width':2}); svg.append(axis);
      svg.append(E('path',{d:`M ${d.w-d.pad} ${d.y} l -10 -6 v 12 z`,fill:text})); svg.append(E('path',{d:`M ${d.pad} ${d.y} l 10 -6 v 12 z`,fill:text}));
      const span=state.viewMax-state.viewMin, rawStep=span/8, mag=Math.pow(10,Math.floor(Math.log10(rawStep))), choices=[1,2,5,10]; let step=choices.find(c=>c*mag>=rawStep)||10*mag; step*=mag===0?1:1; if(step>span) step=span/4;
      const start=Math.ceil(state.viewMin/step)*step;
      for(let v=start;v<=state.viewMax+step*.2;v+=step){ const x=xOf(v,d); svg.append(E('line',{x1:x,y1:d.y-6,x2:x,y2:d.y+6,stroke:muted,'stroke-width':1})); const tx=E('text',{x,y:d.y+24,fill:muted,'font-size':11,'text-anchor':'middle'}); tx.textContent=formatApprox(v); svg.append(tx); }
      const I=state.interval; if((I.leftUnbounded||I.left)&&(I.rightUnbounded||I.right)){
        let lv=I.leftUnbounded?state.viewMin:I.left.approxValue, rv=I.rightUnbounded?state.viewMax:I.right.approxValue; if(lv<=rv){ const x1=xOf(lv,d),x2=xOf(rv,d); svg.append(E('line',{x1,y1:d.y-18,x2,y2:d.y-18,stroke:accent,'stroke-width':8,'stroke-linecap':'round',opacity:.62}));
          if(!I.leftUnbounded){svg.append(E('circle',{cx:x1,cy:d.y-18,r:7,fill:I.leftClosed?accent:card,stroke:accent,'stroke-width':3}));}
          if(!I.rightUnbounded){svg.append(E('circle',{cx:x2,cy:d.y-18,r:7,fill:I.rightClosed?accent:card,stroke:accent,'stroke-width':3}));}
          if(I.leftUnbounded) svg.append(E('path',{d:`M ${d.pad} ${d.y-18} l 10 -6 v 12 z`,fill:accent})); if(I.rightUnbounded) svg.append(E('path',{d:`M ${d.w-d.pad} ${d.y-18} l -10 -6 v 12 z`,fill:accent}));
        }
      }
      const groups=new Map(); state.points.forEach(p=>{if(!groups.has(p.equivalenceGroupId))groups.set(p.equivalenceGroupId,[]);groups.get(p.equivalenceGroupId).push(p)});
      [...groups.values()].forEach((g,gi)=>{ const v=g[0].approxValue,x=xOf(v,d), lane=gi%3; const c=E('circle',{cx:x,cy:d.y,r:8,fill:accent,stroke:card,'stroke-width':2,'data-point-id':g[0].id,style:'cursor:grab'}); svg.append(c); const label=E('text',{x,y:d.y-34-lane*18,fill:text,'font-size':12,'font-weight':700,'text-anchor':'middle','pointer-events':'none'}); label.textContent=g.map(p=>p.displayLabel).join(' = '); svg.append(label); const ap=E('text',{x,y:d.y-19-lane*18,fill:muted,'font-size':10,'text-anchor':'middle','pointer-events':'none'}); ap.textContent=`${tr('approx')} ${formatApprox(v)}`; svg.append(ap); });
      const sorted=[...groups.values()].map(g=>g[0]).sort((a,b)=>a.approxValue-b.approxValue); order.textContent=sorted.length?sorted.map(p=>groups.get(p.equivalenceGroupId).map(q=>q.displayLabel).join(' = ')).join(' < '):tr('empty');
    }
    function addParsed(p){ p.id=state.nextId++; state.points.push(p); err.textContent=''; draw(); }
    function addRaw(raw){ const p=parseNumber(raw); if(!p){err.textContent=tr('bad');return false;} addParsed(p); return true; }
    root.querySelector('[data-a=add]').onclick=()=>{if(addRaw(input.value))input.value='';}; input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();root.querySelector('[data-a=add]').click();}});
    root.querySelector('[data-a=clear]').onclick=()=>{state.points=[];draw();};
    root.querySelectorAll('.mh-real-nline__interval input').forEach(el=>el.addEventListener('input',draw));
    svg.addEventListener('pointerdown',e=>{ const target=e.target.closest('[data-point-id]'); if(target){state.dragId=Number(target.getAttribute('data-point-id'));svg.setPointerCapture?.(e.pointerId);return;} const d=dims(),v=vOf(e.clientX,d); addParsed({rawInput:formatApprox(v),displayLabel:formatApprox(v),normalizedValue:{type:'decimal',value:v},approxValue:v,exactKey:`n:${Number(v.toPrecision(14))}`}); });
    svg.addEventListener('pointermove',e=>{if(!state.dragId)return; const p=state.points.find(x=>x.id===state.dragId); if(!p)return; const v=vOf(e.clientX,dims()); p.rawInput=formatApprox(v);p.displayLabel=formatApprox(v);p.normalizedValue={type:'decimal',value:v};p.approxValue=v;p.exactKey=`n:${Number(v.toPrecision(14))}`;draw();});
    const stop=()=>state.dragId=null; svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);
    (options.initialPoints||['-3','1/2','sqrt(2)','1.7','pi']).forEach(addRaw); draw();
    const ro=new ResizeObserver(draw);ro.observe(stage); instances.set(id,{root,ro}); return {root,state,parseNumber};
  }
  function unmount(id){const x=instances.get(id);if(!x)return;try{x.ro.disconnect();}catch{};try{x.root.remove();}catch{};instances.delete(id);}
  function autoMount(){
    document.querySelectorAll('[data-mh-real-numberline]').forEach((host,index)=>{
      if(host.dataset.mhRealNumberlineMounted==='1') return;
      host.dataset.mhRealNumberlineMounted='1';
      const id=host.dataset.mhRealNumberlineId||`mh-real-numberline-${index}`;
      mount(id,host,{initialPoints:['-3','1/2','sqrt(2)','1.7','pi']});
    });
  }
  window.MH_RealNumberLine={mount,unmount,parseNumber,autoMount};
  const observer=new MutationObserver(()=>autoMount());
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{autoMount();observer.observe(document.body,{childList:true,subtree:true});},{once:true});
  else {autoMount();observer.observe(document.body,{childList:true,subtree:true});}
})();
