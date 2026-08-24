import { deleteTag, loadTagCatalog, reorderTags, replaceContentTags, saveTag } from "./tag-repository.js";

const esc=(v)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

export function createTagAdminController({ host, supabase, getCatalog=()=>({}), onChanged=()=>{} }={}){
  let isAdmin=false, catalog={tags:[],mappings:[]}, selected="";
  const contentRows=()=>[
    ...(getCatalog().lessons||[]).map((x)=>({type:"lesson",...x})),
    ...(getCatalog().problems||[]).map((x)=>({type:"problem",...x})),
    ...(getCatalog().exams||[]).map((x)=>({type:"exam",...x}))
  ];
  async function refresh(){ catalog=await loadTagCatalog(supabase); render(); return catalog; }
  function render(){
    if(!host) return;
    if(!isAdmin){ host.hidden=true; host.innerHTML=""; return; }
    host.hidden=false;
    const rows=contentRows();
    const options=rows.map((x)=>`<option value="${esc(x.type+":"+x.id)}">${esc(x.type)} · ${esc(x.title_ro||x.title_en||x.id)}</option>`).join("");
    host.innerHTML=`
      <div class="mh-tag-studio-grid">
        <section class="mh-admin-card"><h3>Tag-uri normalizate</h3><p class="legend">Ordine și denumiri globale.</p>
          <form id="mhTagForm" class="mh-tag-form"><input id="mhTagId" placeholder="id-tag" required maxlength="100"><input id="mhTagRo" placeholder="Etichetă RO" required><input id="mhTagEn" placeholder="Label EN" required><select id="mhTagGroup" class="select"><option value="topic">Domeniu matematic</option><option value="method">Metodă / competență</option><option value="context">Context / sursă</option></select><label><input id="mhTagVisible" type="checkbox" checked> În filtre</label><label><input id="mhTagActive" type="checkbox" checked> Activ</label><button class="btn small" type="submit">Salvează</button><button class="btn small" type="button" data-tag-new>Tag nou</button></form>
          <div class="mh-tag-list">${catalog.tags.map((tag,i)=>`<article data-tag-id="${esc(tag.id)}"><div><strong>${esc(tag.label_ro)}</strong><small>${esc(tag.group_key||"topic")} · ${tag.filter_visible!==false?"în filtre":"ascuns"} · ${tag.active?"activ":"inactiv"} · ${esc(tag.id)}</small></div><div><button class="btn small" type="button" data-tag-up ${i?"":"disabled"}>↑</button><button class="btn small" type="button" data-tag-down ${i<catalog.tags.length-1?"":"disabled"}>↓</button><button class="btn small" type="button" data-tag-edit>Editează</button><button class="btn small" type="button" data-tag-delete>Șterge</button></div></article>`).join("")||'<p class="legend">Niciun tag.</p>'}</div>
        </section>
        <section class="mh-admin-card"><h3>Mapping conținut</h3><p class="legend">Lecții, probleme și examene.</p>
          <label>Conținut<select class="select" id="mhTagContent"><option value="">Alege…</option>${options}</select></label>
          <div id="mhTagMapping" class="mh-tag-mapping"></div>
          <button class="btn" id="mhTagMappingSave" type="button" disabled>Salvează mapping</button><span class="legend" id="mhTagStatus"></span>
        </section>
      </div>`;
    bind();
  }
  function bind(){
    const form=host.querySelector("#mhTagForm"), status=host.querySelector("#mhTagStatus"), content=host.querySelector("#mhTagContent"), mapping=host.querySelector("#mhTagMapping"), save=host.querySelector("#mhTagMappingSave");
    form?.addEventListener("submit",async(e)=>{e.preventDefault(); try{await saveTag(supabase,{id:host.querySelector("#mhTagId").value,label_ro:host.querySelector("#mhTagRo").value,label_en:host.querySelector("#mhTagEn").value,group_key:host.querySelector("#mhTagGroup").value,filter_visible:host.querySelector("#mhTagVisible").checked,active:host.querySelector("#mhTagActive").checked}); await refresh(); await onChanged();}catch(err){alert(err.message||err);}});
    host.querySelector("[data-tag-new]")?.addEventListener("click",()=>{const id=host.querySelector("#mhTagId");id.readOnly=false;id.value="";host.querySelector("#mhTagRo").value="";host.querySelector("#mhTagEn").value="";host.querySelector("#mhTagActive").checked=true;host.querySelector("#mhTagVisible").checked=true;host.querySelector("#mhTagGroup").value="topic";id.focus();});
    host.querySelectorAll("[data-tag-id]").forEach((row)=>{
      const id=row.dataset.tagId, idx=catalog.tags.findIndex((x)=>x.id===id), tag=catalog.tags[idx];
      row.querySelector("[data-tag-edit]")?.addEventListener("click",()=>{host.querySelector("#mhTagId").value=tag.id;host.querySelector("#mhTagId").readOnly=true;host.querySelector("#mhTagRo").value=tag.label_ro;host.querySelector("#mhTagEn").value=tag.label_en;host.querySelector("#mhTagGroup").value=tag.group_key||"topic";host.querySelector("#mhTagVisible").checked=tag.filter_visible!==false;host.querySelector("#mhTagActive").checked=tag.active;});
      row.querySelector("[data-tag-delete]")?.addEventListener("click",async()=>{if(!confirm(`Ștergi ${tag.label_ro}? Mapping-urile lui vor fi eliminate.`))return;await deleteTag(supabase,id);await refresh();await onChanged();});
      const move=async(delta)=>{const ids=catalog.tags.map((x)=>x.id);[ids[idx],ids[idx+delta]]=[ids[idx+delta],ids[idx]];await reorderTags(supabase,ids);await refresh();await onChanged();};
      row.querySelector("[data-tag-up]")?.addEventListener("click",()=>void move(-1)); row.querySelector("[data-tag-down]")?.addEventListener("click",()=>void move(1));
    });
    function paintMapping(){
      const value=content.value; selected=value; if(!value){mapping.innerHTML="";save.disabled=true;return;}
      const [type,...rest]=value.split(":"), id=rest.join(":"), active=new Set(catalog.mappings.filter((x)=>x.content_type===type&&x.content_id===id).map((x)=>x.tag_id));
      mapping.innerHTML=catalog.tags.filter(tag=>tag.active!==false).map((tag)=>`<label><input type="checkbox" value="${esc(tag.id)}" ${active.has(tag.id)?"checked":""}> ${esc(tag.label_ro)}</label>`).join(""); save.disabled=false;
    }
    content?.addEventListener("change",paintMapping);
    save?.addEventListener("click",async()=>{if(!selected)return; const [type,...rest]=selected.split(":"), id=rest.join(":"), ids=[...mapping.querySelectorAll('input[type="checkbox"]:checked')].map((x)=>x.value); save.disabled=true;status.textContent="Se salvează…";try{await replaceContentTags(supabase,type,id,ids);status.textContent="Salvat.";await refresh();await onChanged();}catch(err){status.textContent=err.message||String(err);save.disabled=false;}});
  }
  return { setAdmin(value){isAdmin=Boolean(value);render();}, async load(){if(!isAdmin)return null;return refresh();}, invalidate(){catalog={tags:[],mappings:[]};} };
}
