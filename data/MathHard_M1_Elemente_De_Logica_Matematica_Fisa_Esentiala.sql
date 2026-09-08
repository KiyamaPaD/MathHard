-- MathHard Phase 122L R1 — Chapter 2 / Lesson 10 synthesis
-- Sinteză: Elemente de logică matematică
-- Run AFTER 122K FIX1. Supersedes 122L; rerunnable if 122L was already applied.
-- DB integration only; the companion repo patch adds the 4-page PDF under data/.
-- No quiz and no practice bank: synthesis is read-completion only.

begin;

-- ===========================================================================
-- 0. PREFLIGHT
-- ===========================================================================
do $$
declare v_missing text[] := '{}'::text[]; v_core_count integer;
begin
  if to_regclass('public.mh_lessons') is null then v_missing:=array_append(v_missing,'table:mh_lessons'); end if;
  if to_regclass('public.mh_lesson_quizzes') is null then v_missing:=array_append(v_missing,'table:mh_lesson_quizzes'); end if;
  if to_regclass('public.mh_lesson_quiz_items') is null then v_missing:=array_append(v_missing,'table:mh_lesson_quiz_items'); end if;
  if to_regclass('public.mh_problems') is null then v_missing:=array_append(v_missing,'table:mh_problems'); end if;
  if to_regclass('public.mh_roadmap_nodes') is null then v_missing:=array_append(v_missing,'table:mh_roadmap_nodes'); end if;
  if to_regclass('public.mh_chapter_members') is null then v_missing:=array_append(v_missing,'table:mh_chapter_members'); end if;
  if to_regclass('public.mh_content_concepts') is null then v_missing:=array_append(v_missing,'table:mh_content_concepts'); end if;
  if to_regclass('public.mh_tags') is null then v_missing:=array_append(v_missing,'table:mh_tags'); end if;
  if to_regclass('public.mh_content_tags') is null then v_missing:=array_append(v_missing,'table:mh_content_tags'); end if;
  if to_regclass('public.mh_content_quality_reviews') is null then v_missing:=array_append(v_missing,'table:mh_content_quality_reviews'); end if;
  if to_regclass('public.mh_content_publications') is null then v_missing:=array_append(v_missing,'table:mh_content_publications'); end if;

  if not exists(select 1 from public.mh_lessons where id='m1-ix-logic-induction') then
    v_missing:=array_append(v_missing,'lesson:m1-ix-logic-induction (run 122K)');
  end if;
  if not exists(select 1 from public.mh_roadmap_nodes where id='m1-ix-logic-synthesis' and roadmap_id='mathhard-m1') then
    v_missing:=array_append(v_missing,'roadmap-node:m1-ix-logic-synthesis');
  end if;

  select count(*) into v_core_count
  from public.mh_chapter_members m
  join public.mh_lessons l on l.id=m.content_id
  where m.chapter_id='m1-logic' and m.content_type='lesson' and m.role='core_lesson' and m.position between 1 and 9;
  if v_core_count<>9 then v_missing:=array_append(v_missing,'chapter:m1-logic expected 9 integrated core lessons'); end if;

  if exists(select 1 from public.mh_lesson_quizzes where lesson_id='m1-ix-logic-synthesis')
     or exists(select 1 from public.mh_lesson_quiz_items where lesson_id='m1-ix-logic-synthesis')
     or exists(select 1 from public.mh_problems where lesson_id='m1-ix-logic-synthesis') then
    v_missing:=array_append(v_missing,'stale assessments exist for synthesis; L10 must have no quiz/problems');
  end if;

  if cardinality(v_missing)>0 then
    raise exception 'MathHard 122L preflight failed: %',array_to_string(v_missing,', ') using errcode='P0001';
  end if;
end $$;

-- ===========================================================================
-- 1. SYNTHESIS LESSON — NO NEW THEORY / NO ASSESSMENTS
-- ===========================================================================
insert into public.mh_lessons(
 id,grade,chapter,tags,title_ro,title_en,learn_ro,learn_en,why_ro,why_en,
 body_ro,body_en,examples_ro,examples_en,sources
) values (
 'm1-ix-logic-synthesis','IX','Algebră',
 array['mathhard m1','clasa ix','algebra','logica matematica','sinteza','recapitulare','propozitii','predicate','implicatie','echivalenta','cuantificatori','reducere la absurd','inductie'],
 'Sinteză: Elemente de logică matematică','Synthesis: Elements of mathematical logic',
 'Recapitulezi rapid ideile esențiale din L1–L9, legăturile dintre propoziții, predicate, operatori logici, cuantificatori și demonstrații. Sinteza nu introduce teorie nouă.',
 '',
 'Închide capitolul fără un nou bank de probleme. Accentul este pe conexiuni, reguli esențiale, alegerea instrumentului logic potrivit și o fișă PDF compactă de 4 pagini.',
 '',
 $mh122l_lesson_ro$<p><strong>CAPITOL ÎNCHEIAT · L1–L9</strong></p>
<h1>Sinteză rapidă: Elemente de logică matematică</h1>
<p>Ai trecut prin propoziții și valori de adevăr, predicate și mulțimi de adevăr, negație, conjuncție și disjuncție, implicație, echivalență, condiții necesare și suficiente, cuantificatori, reducere la absurd și inducție matematică.</p>
<p>Lecția aceasta <strong>nu introduce teorie nouă</strong> și <strong>nu are un nou set de probleme sau verificare</strong>.</p>
<p>Ideea care le leagă este trecerea:</p>
\[
\boxed{\text{enunț}\rightarrow\text{logică}\rightarrow\text{mulțimi}\rightarrow\text{demonstrație}}
\]

<h2>PDF · 4 pagini</h2>
<h3>MathHard M1 — Elemente de logică: Fișa esențială</h3>
<p>Propoziții, predicate, domeniu, valori de adevăr, operatori logici, implicație, echivalență, cuantificatori, legătura cu mulțimile, reducere la absurd, inducție, BAC și checklist final.</p>
<p><a href="/data/MathHard_M1_Elemente_de_Logica_Fisa_Esentiala.pdf" target="_blank" rel="noopener">Deschide PDF-ul</a></p>

<h2>1. Ce trebuie să rămână după capitol</h2>

<h3>Propoziție vs. predicat</h3>
<p>O propoziție are o valoare de adevăr bine determinată:</p>
\[
A\quad\text{sau}\quad F.
\]
<p>Un predicat \(p(x)\) depinde de o variabilă și de un domeniu \(D\). Mulțimea valorilor pentru care predicatul este adevărat este \(M_p\).</p>
\[
\boxed{\text{un predicat nu se analizează fără domeniu}.}
\]

<h3>Negația</h3>
<p>Negația inversează valoarea de adevăr. Pentru predicate:</p>
\[
\boxed{M_{\neg p}=D\setminus M_p.}
\]
<p>Exemple:</p>
\[
\neg(x>3)\Longrightarrow x\le3,
\]
\[
\neg(x=0)\Longrightarrow x\neq0.
\]

<h3>ȘI și SAU</h3>
<p>\(p\land q\) înseamnă „p ȘI q”, iar \(p\lor q\) înseamnă „p SAU q”. În matematică, SAU este în mod obișnuit inclusiv.</p>
\[
\boxed{M_{p\land q}=M_p\cap M_q}
\]
\[
\boxed{M_{p\lor q}=M_p\cup M_q.}
\]

<h3>De Morgan</h3>
\[
\boxed{\neg(p\land q)\Leftrightarrow\neg p\lor\neg q}
\]
\[
\boxed{\neg(p\lor q)\Leftrightarrow\neg p\land\neg q.}
\]
<p>La negare, \(\land\leftrightarrow\lor\), iar componentele se neagă.</p>

<h3>Implicația</h3>
<p>\(p\Rightarrow q\) înseamnă „dacă p, atunci q”. Singurul caz fals este:</p>
\[
\boxed{p=A,\qquad q=F.}
\]
<p>Pentru predicate pe același domeniu:</p>
\[
\boxed{p(x)\Rightarrow q(x)\text{ pentru orice }x\in D\quad\Longleftrightarrow\quad M_p\subseteq M_q.}
\]
<p>Din \(p\Rightarrow q\), p este suficientă pentru q, iar q este necesară pentru p. Reciproca \(q\Rightarrow p\) nu este automată.</p>

<h3>Echivalența</h3>
<p>\(p\Leftrightarrow q\) înseamnă că avem ambele sensuri: \(p\Rightarrow q\) și \(q\Rightarrow p\).</p>
<p>Pentru predicate pe același domeniu:</p>
\[
\boxed{p(x)\Leftrightarrow q(x)\text{ pentru orice }x\in D\quad\Longleftrightarrow\quad M_p=M_q.}
\]
<p>Dacă două condiții sunt echivalente, fiecare este necesară și suficientă pentru cealaltă.</p>

<h3>Cuantificatorii</h3>
<p>\(\forall\) înseamnă „pentru orice”, \(\exists\) înseamnă „există cel puțin un”, \(\exists!\) înseamnă „există exact unul”, iar \(\nexists\) înseamnă „nu există”.</p>
\[
\boxed{\forall x\in D,\ p(x)\Leftrightarrow M_p=D}
\]
\[
\boxed{\exists x\in D,\ p(x)\Leftrightarrow M_p\neq\varnothing.}
\]

<h3>Martor și contraexemplu</h3>
<p>Pentru a confirma \(\exists x\in D,p(x)\), este suficient un <strong>martor</strong>.</p>
<p>Pentru a infirma \(\forall x\in D,p(x)\), este suficient un <strong>contraexemplu</strong>.</p>

<h3>Negarea cuantificatorilor</h3>
\[
\boxed{\neg(\forall x\in D,\ p(x))\Leftrightarrow\exists x\in D,\neg p(x)}
\]
\[
\boxed{\neg(\exists x\in D,\ p(x))\Leftrightarrow\forall x\in D,\neg p(x).}
\]
<p>Pe scurt, \(\forall\leftrightarrow\exists\), iar proprietatea se neagă.</p>

<h3>Reducerea la absurd</h3>
<p>Pentru a demonstra \(P\), presupunem \(\neg P\). Dacă ajungem la contradicție \(\bot\), atunci P este adevărată.</p>
\[
\boxed{\neg P\Longrightarrow\bot\Longrightarrow P.}
\]
<p>Pentru \(p\Rightarrow q\), presupunerea de absurd este:</p>
\[
\boxed{p\land\neg q.}
\]

<h3>Inducția matematică</h3>
<p>Pentru o afirmație \(P(n)\) valabilă de la \(n_0\) încolo, demonstrăm:</p>
<p><strong>BAZA:</strong></p>
\[
\boxed{P(n_0)}
\]
<p><strong>PASUL:</strong></p>
\[
\boxed{P(k)\Rightarrow P(k+1)}
\]
<p>pentru un k arbitrar relevant. Apoi concluzionăm că \(P(n)\) este adevărată pentru toate \(n\ge n_0\).</p>
\[
\boxed{\text{BAZĂ}+\text{PAS}=\text{INDUCȚIE}.}
\]

<h2>2. Harta care leagă logica de mulțimi</h2>
<p>Pentru predicate definite pe același domeniu D:</p>
<p><strong>NEGAȚIE</strong></p>
\[
M_{\neg p}=D\setminus M_p
\]
<p><strong>ȘI</strong></p>
\[
M_{p\land q}=M_p\cap M_q
\]
<p><strong>SAU</strong></p>
\[
M_{p\lor q}=M_p\cup M_q
\]
<p><strong>IMPLICAȚIE</strong></p>
\[
\boxed{p(x)\Rightarrow q(x)\text{ pentru orice }x\in D\quad\Leftrightarrow\quad M_p\subseteq M_q}
\]
<p><strong>ECHIVALENȚĂ</strong></p>
\[
\boxed{p(x)\Leftrightarrow q(x)\text{ pentru orice }x\in D\quad\Leftrightarrow\quad M_p=M_q}
\]
<p><strong>UNIVERSAL</strong></p>
\[
\forall x\in D,\ p(x)\quad\Leftrightarrow\quad M_p=D
\]
<p><strong>EXISTENȚIAL</strong></p>
\[
\exists x\in D,\ p(x)\quad\Leftrightarrow\quad M_p\neq\varnothing.
\]
<p>Aceasta este una dintre cele mai importante conexiuni dintre Capitolul 1 și Capitolul 2.</p>

<h2>3. Ce instrument aleg?</h2>
<p>Dacă vrei să <strong>infirmi</strong> \(\forall x\in D,p(x)\), caută un <strong>contraexemplu</strong>.</p>
<p>Dacă vrei să <strong>confirmi</strong> \(\exists x\in D,p(x)\), caută un <strong>martor</strong>.</p>
<p>Dacă contrariul afirmației pare să ducă rapid la imposibilitate, poate fi naturală <strong>reducerea la absurd</strong>.</p>
<p>Dacă ai \(P(n)\) pentru numere naturale și cazul următor se leagă de cazul precedent, poate fi naturală <strong>inducția matematică</strong>.</p>
\[
\boxed{\text{Alegem metoda care face demonstrația mai clară}.}
\]

<h2>4. Ce ai câștigat de fapt din acest capitol</h2>
<p>Logica nu te ajută doar să rezolvi exerciții „de logică”.</p>
<p>Te ajută să citești corect aproape orice enunț matematic.</p>
<p>După acest capitol, expresii precum:</p>
\[
\text{„pentru orice”},
\qquad
\text{„există”},
\qquad
\text{„dacă”},
\qquad
\text{„numai dacă”},
\qquad
\text{„dacă și numai dacă”}
\]
<p>nu mai sunt doar cuvinte. Ele îți spun exact ce structură are problema.</p>

<p>Când vezi:</p>
\[
\forall x\in D,
\]
<p>știi că afirmația trebuie să fie adevărată pentru toate valorile din domeniu.</p>

<p>Când vezi:</p>
\[
\exists x\in D,
\]
<p>știi că este suficient să existe cel puțin o valoare potrivită.</p>

<p>Când vezi:</p>
\[
p\Rightarrow q,
\]
<p>știi care este ipoteza și care este concluzia.</p>

<p>Când vezi:</p>
\[
p\Leftrightarrow q,
\]
<p>știi că trebuie analizate ambele sensuri.</p>

<p>Când o propoziție universală pare falsă, te gândești la un <strong>contraexemplu</strong>.</p>
<p>Când trebuie demonstrată inexistența unei situații, <strong>reducerea la absurd</strong> poate deveni naturală.</p>
<p>Când trebuie demonstrată o afirmație pentru toate numerele naturale și cazul următor se leagă de cel precedent, <strong>inducția</strong> poate fi instrumentul potrivit.</p>

<p>Așadar, scopul acestui capitol nu este doar:</p>
\[
\boxed{\text{să înveți logică}}
\]
<p>ci și:</p>
\[
\boxed{\text{să înveți să citești matematic}.}
\]
<p>Dacă înțelegi structura logică a unui enunț, înțelegi mult mai precis ce îți cere exercițiul înainte să începi efectiv calculele.</p>

<h2>5. Cele mai importante capcane</h2>
<ul>
<li>Un predicat are nevoie de domeniu.</li>
<li>Domeniul nu se schimbă când negăm.</li>
<li>\(\exists\) înseamnă „cel puțin unul”.</li>
<li>\(\exists!\) înseamnă „exact unul”.</li>
<li>„Nu toți” NU înseamnă „niciunul”.</li>
<li>Pentru \(\Rightarrow\), singurul caz fals este \(A\Rightarrow F\).</li>
<li>Din \(p\Rightarrow q\) nu rezultă automat \(q\Rightarrow p\).</li>
<li>Dacă \(p\Rightarrow q\), p este suficientă pentru q, iar q este necesară pentru p.</li>
<li>Pentru echivalență trebuie demonstrate ambele sensuri.</li>
<li>Un contraexemplu distruge o afirmație universală.</li>
<li>Un martor confirmă o afirmație existențială.</li>
<li>În reducerea la absurd presupunem negația exactă.</li>
<li>În inducție, \(P(k)\) este ipoteza, iar \(P(k+1)\) este ținta.</li>
<li>Baza fără pas nu este suficientă.</li>
<li>Pasul fără bază nu este suficient.</li>
</ul>

<h2>6. Checklist de închidere</h2>
<ul>
<li>□ Pot deosebi o propoziție de un predicat.</li>
<li>□ Verific întotdeauna domeniul unui predicat.</li>
<li>□ Pot determina o mulțime de adevăr.</li>
<li>□ Pot nega corect egalități și inegalități.</li>
<li>□ Știu regulile pentru \(\land,\lor,\neg\).</li>
<li>□ Știu când \(p\Rightarrow q\) este falsă.</li>
<li>□ Pot diferenția implicația de reciprocă.</li>
<li>□ Pot identifica o condiție necesară și una suficientă.</li>
<li>□ Știu ce înseamnă \(p\Leftrightarrow q\).</li>
<li>□ Pot folosi \(\forall,\exists,\exists!,\nexists\).</li>
<li>□ Pot nega propoziții cuantificate.</li>
<li>□ Știu diferența dintre martor și contraexemplu.</li>
<li>□ Pot recunoaște o reducere la absurd.</li>
<li>□ Pot identifica baza, ipoteza și pasul unei inducții.</li>
<li>□ Pot explica de ce verificarea câtorva exemple nu este demonstrație.</li>
</ul>

<section class="mh-enrichment-box mh-enrichment-box--spoiler" data-enrichment-kind="spoiler" data-enrichment-required="false" data-enrichment-evidence="false">
<h3>👀 Spoiler Alert — logica devine instrument</h3>
<p>Capitolul se termină, dar logica nu dispare.</p>
<p>De aici înainte vei folosi fără să mai fie reintroduse de fiecare dată idei precum \(\Rightarrow,\Leftrightarrow,\forall,\exists\) în aproape toată matematica.</p>
<p>Inducția va reapărea la șiruri și mai târziu la formule de forma \(A^n\) pentru puteri de matrici.</p>
<p>Implicațiile și echivalențele vor apărea în funcții, ecuații și inecuații, geometrie, analiză matematică și probabilități.</p>
\[
\boxed{\text{logica devine un limbaj de lucru}.}
\]
</section>

<h2>🔎 Urmează</h2>
<p>Ai încheiat <strong>ELEMENTE DE LOGICĂ MATEMATICĂ</strong>.</p>
<p>Următorul capitol este <strong>ȘIRURI</strong>.</p>
<p>Acolo vom începe să studiem expresii dependente de \(n\in\mathbb N\) și vom reutiliza natural ideile \(P(n)\), relațiile dintre cazuri consecutive și inducția matematică.</p>

<h2>📚 Surse</h2>
<ul>
<li>MathHard M1 · Lecțiile 1–9 — capitolul Elemente de logică matematică</li>
<li>Programa de examen pentru Matematică — M_mate-info, OMEN nr. 4430/2014</li>
<li>Ministerul Educației și Cercetării · Bacalaureat 2026 / subiecte.edu.ro</li>
</ul>$mh122l_lesson_ro$,
 '', '', '',
 array[
   'MathHard M1 · Lecțiile 1–9 — capitolul Elemente de logică matematică',
   'Programa de examen pentru Matematică — M_mate-info, OMEN nr. 4430/2014',
   'Ministerul Educației și Cercetării · Bacalaureat 2026 / subiecte.edu.ro',
   '/data/MathHard_M1_Elemente_de_Logica_Fisa_Esentiala.pdf'
 ]::text[]
)
on conflict(id) do update set
 grade=excluded.grade,chapter=excluded.chapter,tags=excluded.tags,title_ro=excluded.title_ro,title_en=excluded.title_en,
 learn_ro=excluded.learn_ro,learn_en=excluded.learn_en,why_ro=excluded.why_ro,why_en=excluded.why_en,
 body_ro=excluded.body_ro,body_en=excluded.body_en,examples_ro=excluded.examples_ro,examples_en=excluded.examples_en,sources=excluded.sources;

-- Keep the fixed roadmap identity/title. Only sync the concise synthesis description.
update public.mh_roadmap_nodes
set description_ro='Recapitulare compactă L1–L9, fără teorie nouă și fără un nou bank de probleme; include fișa PDF esențială.',
    description_en='Compact L1–L9 synthesis with no new theory or assessment bank; includes the essential PDF sheet.',
    estimated_minutes=12,
    required=true,
    published=true,
    updated_at=now()
where id='m1-ix-logic-synthesis' and roadmap_id='mathhard-m1';

-- Synthesis is required for chapter completion, but completion is reading-only.
delete from public.mh_chapter_members
where chapter_id='m1-logic' and content_type='lesson' and content_id='m1-ix-logic-synthesis';
insert into public.mh_chapter_members(
 chapter_id,content_type,content_id,role,required_for_completion,requires_verification,position
) values ('m1-logic','lesson','m1-ix-logic-synthesis','synthesis',true,false,10);

-- ===========================================================================
-- 2. CONCEPT ASSOCIATIONS — REVIEW ONLY, NO NEW MASTERY EVIDENCE
-- ===========================================================================
delete from public.mh_content_concepts
where content_type='lesson' and content_id='m1-ix-logic-synthesis';

with chapter_concepts as (
  select cc.concept_id, min(m.position*100 + cc.position) as ord
  from public.mh_chapter_members m
  join public.mh_content_concepts cc
    on cc.content_type='lesson' and cc.content_id=m.content_id
  where m.chapter_id='m1-logic'
    and m.content_type='lesson'
    and m.role='core_lesson'
    and m.position between 1 and 9
    and cc.relation_type in ('primary','supporting')
  group by cc.concept_id
), ordered as (
  select concept_id,row_number() over(order by ord,concept_id)::integer as pos
  from chapter_concepts
)
insert into public.mh_content_concepts(
 concept_id,content_type,content_id,relation_type,evidence_eligible,position
)
select concept_id,'lesson','m1-ix-logic-synthesis','reference',false,pos
from ordered;

-- ===========================================================================
-- 3. TAGGING
-- ===========================================================================
insert into public.mh_tags(id,label_ro,label_en,position,active,group_key,filter_visible) values
('chapter-synthesis','Sinteză de capitol','Chapter synthesis',705,true,'context',false)
on conflict(id) do update set
 label_ro=excluded.label_ro,label_en=excluded.label_en,position=excluded.position,active=true,group_key=excluded.group_key,filter_visible=excluded.filter_visible,updated_at=now();

delete from public.mh_content_tags
where content_type='lesson' and content_id='m1-ix-logic-synthesis';
insert into public.mh_content_tags(content_type,content_id,tag_id,position) values
('lesson','m1-ix-logic-synthesis','chapter-synthesis',0)
on conflict(content_type,content_id,tag_id) do update set position=excluded.position;

-- ===========================================================================
-- 4. EDITORIAL / PUBLICATION
-- ===========================================================================
insert into public.mh_content_quality_reviews(
 content_type,content_id,status,bilingual_checked,math_checked,source_checked,reviewer_notes,source_urls,review_version,reviewed_at
) values (
 'lesson','m1-ix-logic-synthesis','verified',false,true,true,
 '122L: Approved C2 L10 synthesis. No new theory, no verification bank, no practice bank. Compact L1–L9 review; implication/equivalence truth-set links explicitly require validity for every x in D. Includes 4-page essential PDF and nonblocking spoiler about later reuse.',
 '[]'::jsonb,1,now()
)
on conflict(content_type,content_id) do update set
 status='verified',bilingual_checked=false,math_checked=true,source_checked=true,reviewer_notes=excluded.reviewer_notes,source_urls='[]'::jsonb,
 review_version=greatest(public.mh_content_quality_reviews.review_version,1),reviewed_at=now(),updated_at=now();

insert into public.mh_content_publications(content_type,content_id,state,publication_mode,publication_version,reason) values
('lesson','m1-ix-logic-synthesis','unpublished','verified',0,'122L: Approved C2 L10 synthesis integrated; MathHard M1 remains draft/private.')
on conflict(content_type,content_id) do update set
 state='unpublished',publication_mode='verified',reason=excluded.reason,unpublished_at=now(),updated_at=now();

-- Keep whole roadmap private until the M1 release gate is intentionally opened.
update public.mh_roadmaps set published=false where id='mathhard-m1';
notify pgrst, 'reload schema';
commit;
