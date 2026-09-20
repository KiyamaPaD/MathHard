const SUPPORTED = new Set([
  "mh_body_ro","mh_body_en","mh_examples_ro","mh_examples_en",
  "mh_statement_ro","mh_statement_en","mh_hint1_ro","mh_hint1_en","mh_hint2_ro","mh_hint2_en",
  "mh_solution_ro","mh_solution_en","mh_explanation_simple_ro","mh_explanation_simple_en","mh_explanation_boss_ro","mh_explanation_boss_en"
]);
function text(value){return String(value??"").trim();}
function slugify(value){return text(value).toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,72)||"sectiune";}
function escAttr(value){return String(value??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");}
function insertAtSelection(field, replacement, cursorOffset = null){
  const start=Number(field.selectionStart??field.value.length), end=Number(field.selectionEnd??start);
  field.setRangeText(replacement,start,end,"end");
  if(Number.isInteger(cursorOffset)){const pos=start+cursorOffset;field.setSelectionRange(pos,pos);}
  field.dispatchEvent(new Event("input",{bubbles:true}));
  field.focus();
}
function selection(field){const start=Number(field.selectionStart??0),end=Number(field.selectionEnd??start);return field.value.slice(start,end);}

export function mountAdminLearningPolishAuthoring({ form, language = "ro" } = {}){
  if(!form||form.dataset.mhPolishAuthoring==="1")return;
  form.dataset.mhPolishAuthoring="1";
  const ro=language!=="en";
  const bar=document.createElement("div");
  bar.className="mh-admin-polish-tools";
  bar.hidden=true;
  bar.innerHTML=`<span>${ro?"UX contextual":"Context UX"}</span>
    <button type="button" data-polish="anchor"># ${ro?"Anchor":"Anchor"}</button>
    <button type="button" data-polish="glossary">⌁ ${ro?"Glosar":"Glossary"}</button>
    <button type="button" data-polish="copy">⧉ ${ro?"Copy":"Copy"}</button>
    <button type="button" data-polish="review">↗ ${ro?"Review target":"Review target"}</button>
    <button type="button" data-polish="visual-help">? ${ro?"Ajutor vizual":"Visual help"}</button>
    <small>${ro?"Selectează textul; marker-ele nu adaugă mastery/evidence.":"Select text; markers add no mastery/evidence."}</small>`;
  form.appendChild(bar);
  let active=null;
  const place=(field)=>{
    active=field;
    if(!SUPPORTED.has(field?.id)){bar.hidden=true;return;}
    const label=field.closest("label")||field.parentElement;
    label?.insertAdjacentElement("beforebegin",bar);
    bar.hidden=false;
    bar.dataset.field=field.id;
  };
  form.addEventListener("focusin",(event)=>{if(event.target?.matches?.("textarea"))place(event.target);});

  bar.addEventListener("mousedown",(event)=>event.preventDefault());
  bar.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-polish]");
    if(!button||!active)return;
    const selected=selection(active);
    const type=button.dataset.polish;
    if(type==="anchor"){
      const raw=selected||prompt(ro?"Nume/slug pentru secțiune:":"Section name/slug:","")||"";
      if(!text(raw))return;
      const slug=slugify(raw);
      insertAtSelection(active,`${selected?`<span data-mh-anchor="${slug}"></span>${selected}`:`<span data-mh-anchor="${slug}"></span>`}`);
    }
    if(type==="glossary"){
      if(!selected){alert(ro?"Selectează termenul pe care vrei să-l explici.":"Select the term to explain.");return;}
      const definition=prompt(ro?"Definiția scurtă afișată la tap/click:":"Short definition shown on tap/click:","")||"";
      if(!text(definition))return;
      insertAtSelection(active,`<span data-mh-glossary="${escAttr(definition)}">${selected}</span>`);
    }
    if(type==="copy"){
      if(!selected){alert(ro?"Selectează formula/textul care trebuie să poată fi copiat.":"Select the formula/text to make copyable.");return;}
      const copyValue=prompt(ro?"Ce se copiază? Poți păstra selecția sau o poți simplifica.":"What should be copied? Keep or simplify the selection.",selected);
      if(copyValue===null)return;
      insertAtSelection(active,`<span data-mh-copyable data-mh-copy-value="${escAttr(copyValue)}">${selected}</span>`);
    }
    if(type==="review"){
      const anchor=slugify(prompt(ro?"Anchor-ul secțiunii din lecția asociată:":"Anchor in the linked lesson:",selected||"")||"");
      if(!anchor)return;
      const label=prompt(ro?"Text scurt pentru buton (opțional):":"Short button label (optional):","")||"";
      insertAtSelection(active,`<span data-mh-review-anchor="${anchor}" data-mh-review-label="${escAttr(label)}"></span>${selected}`);
    }
    if(type==="visual-help"){
      if(!selected||!/<[a-z][^>]*>/i.test(selected)){alert(ro?"Selectează tag-ul/fragmentul HTML al vizualului.":"Select the visual HTML tag/fragment.");return;}
      const help=prompt(ro?"Instrucțiune foarte scurtă pentru butonul ? al vizualului:":"Short instruction for the visual ? button:","")||"";
      if(!text(help))return;
      const replacement=selected.replace(/<([a-z][^>]*?)(\s*\/?>)/i,(match,head,end)=>`<${head} data-mh-interactive-help="${escAttr(help)}"${end}`);
      insertAtSelection(active,replacement);
    }
  });
}
