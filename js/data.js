const WIDGET_ID = "axa-naturale-1";

window.SERVER_DATA = {
    lessons: [],
    problems: [],
    exams: []
};

const DATA = {
    grades:["V","VI","VII","VIII","IX","X","XI","XII",
            "OL-V","OL-VI","OL-VII","OL-VIII","OL-IX","OL-X","OL-XI","OL-XII",
            "EN","BAC","FAC","ADM","RES","HIST"],

    /* ——— categorii Olimpiadă (nou) ——— */
    olympTiers: [
      "locale",
      "județene",
      "interjudețene/regionale",
      "naționale",
      "balcaniada",
      "internaționale",
      "mondiale"
    ],

    lessons:[
      /* ——— V — Numere Naturale (prima) ——— */
      {
        id:"v-citirea-nr-nat",
        grade:"V",
        chapter:"Numere Naturale",
        title_ro:"Citirea Numerelor Naturale",
        title_en:"Reading Natural Numbers",
        tags:["V","numere naturale","citire","valoare de poziție"],
        learn_ro:"Vei citi corect numere mari, grupate pe perioade (mii, milioane), vei folosi forma extinsă și vei înțelege valoarea de poziție: unități, zeci, sute, mii…",
        learn_en:"Read large natural numbers, use expanded form, and understand place value.",
        why_ro:"Prețuri, adrese, populații, distanțe, telefoane — le citești corect și eviți erori.",
        why_en:"Daily life numbers: prices, addresses, populations, distances.",
        body_ro:`<p><b>1) Scrierea: </b> Pentru scrierea unui număr natural, se folosesc unul sau mai multe din următoarele zece simboluri, numite <i>cifre arabe:</i> \\(0\\,1\\,2\\,3\\,4\\,5\\,6\\,7\\,8\\,9\\).</p>
          <p>2) Fiecare număr se scrie ca o succesiune de cifre, care se pot repeta</p>
          <p>3) <b>TEOREMĂ:</b> Prima cifră a unui număr natural de cel puțin două cifre este diferită de 0. (ex: nu se pot scrie numerele, din punct de vedere matematic: ,,0123" sau ,,0932414")</p>
          <p>4) Fiecare succesiune de cifre reprezintă un număr. (ex: 10, 1234, 1928429) </p>
          <p>5) <b>Citirea: </b> Pentru a citi un număr natural, grupăm cifrele câte trei de la dreapta la stânga. Aceste grupe se numesc <i>clase</i>. Fiecare clasă se compune din unități, zeci și sute.</p>
          <p>6) În ordine de la dreapta la stânga avem: clasa <i> unităților </i>, clasa <i>miilor</i>, clasa <i>milioanelor</i>, clasa <i>miliardelor</i>, etc.</p>
          <p>7) Scrierea numerelor în baza zece este o scriere <i>pozițională</i>, deoarece fiecare cifră are o anumită valoare după locul unde este scrisă.
          <p><b>OBSERVAȚIE:</b> când apare cifra 0 într-un număr cu cel puțin două cifre, atunci se sare peste ordinul de unitate care îl conține pe 0, și se continuă cu citirea numărului. (ex: 12304 -> ,,douasprezece mii trei sute patru") </b>
          <p><b>8) Descompunerea zecimală:</b> Orice număr natural de două sau mai multe cifre se scrie în mod unic sub forma unei sume de produse între fiecare cifră din scrierea numărului și numărul ce indică ordinul cifrei respective (1, 10, 100, 1000, 10000, etc) </p>
          <p><b>9) TEOREMĂ:</b> Numărul de numere naturale n cuprinse între două numere naturale a și b date (incluzându-le și pe a și pe b) se pot calcula după formula generală: <b>b - a + 1</b></p>`,
        body_en:`<p><b>1) Writing:</b> Natural numbers are written using one or more of the ten symbols called <i>Arabic digits</i>: \\(0,1,2,3,4,5,6,7,8,9\\).</p>
          <p><b>2)</b> Every natural number is written as a sequence of digits, and digits may repeat.</p>
          <p><b>3) THEOREM:</b> The first digit of a natural number with at least two digits is different from 0. For example, from a mathematical point of view, we do not write numbers such as “0123” or “0932414” as standard natural numbers.</p>
          <p><b>4)</b> Every valid sequence of digits represents a number. Examples: \\(10\\), \\(1234\\), \\(1928429\\).</p>
          <p><b>5) Reading natural numbers:</b> To read a natural number correctly, we group digits into sets of three from right to left. These groups are called <i>periods</i>. Each period contains units, tens, and hundreds.</p>
          <p><b>6)</b> From right to left, the periods are: the <i>units period</i>, the <i>thousands period</i>, the <i>millions period</i>, the <i>billions period</i>, and so on.</p>
          <p><b>7)</b> Writing numbers in base ten is called a <i>positional system</i>, because each digit has a value depending on the place where it stands.</p>
          <p><b>Remark:</b> When the digit 0 appears inside a number with at least two digits, we skip that empty order while reading and continue with the next meaningful part.</p>
          <p><b>8) Decimal decomposition:</b> Every natural number with at least two digits can be written uniquely as a sum of products between each digit and its place value: \\(1,10,100,1000,10000,\\dots\\).</p>
          <p>Example: \\(5\\,284 = 5\\cdot1000 + 2\\cdot100 + 8\\cdot10 + 4\\).</p>
          <p><b>9) THEOREM:</b> The number of natural numbers between two given numbers \\(a\\) and \\(b\\), including both, is \\(b-a+1\\).</p>`,
        examples_ro:`<ol> 
          <li>\\(1\\,205\\,010\\) → „un milion două sute cinci mii zece”.</li>
          <li>\\(80705=80\\,000+700+5\\). (descompun în baza zece)</li>
          <li>Val. cifrei 6 în \\(6\\,305\\) este \\(6\\,000\\).</li>
        </ol>`,
        examples_en:`<ol><li>Reading large numbers; expanded form; place value.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Reprezentarea Numerelor Naturale Pe Axa Numerică ——— */
      {
        id:"v-reprez-nr-nat",
        grade:"V",
        chapter:"Numere Naturale",
        title_ro:"Reprezentarea Numerelor Naturale Pe Axa Numerică",
        title_en:"Representing Natural Numbers on the Number Line",
        tags:["V","numere naturale","citire","comparare"],
        learn_ro:"Vei reprezenta numere naturale pe axă, vei compara poziții și vei folosi axa pentru rotunjiri simple.",
        learn_en:"You will place natural numbers on the number line, compare positions, and use the line for simple rounding.",
        why_ro:"Axa numerică te ajută să vezi ordinea numerelor, distanțele dintre ele și aproximările rapide.",
        why_en:"The number line helps you see order, distance between numbers, and quick estimates.",
        body_ro:`<p><b>Ce este axa numerică?</b> O linie dreaptă cu săgeată spre dreapta. La mijloc punem <b>0</b>. În dreapta sunt numerele 1, 2, 3, 4, ... Fiecare liniuță înseamnă un pas de <b>+1</b>.</p>
        <p><b>Cum pun un număr pe axă?</b></p>
        <ol>
          <li>Desenez o linie orizontală și marchez <b>0</b>.</li>
          <li>Marchez liniuțe egale pentru 1, 2, 3, ...</li>
          <li>Caut numărul meu și pun un punct deasupra liniuței lui. De exemplu, 5 este la <b>5 pași</b> de 0.</li>
        </ol>
        <p><b>Rotunjirea (rundirea)</b> ne ajută să aproximăm repede. Ea deobicei se notează cu ,,~" și se ce citește (aproximat/rotunjit). Ex: 24 este mai aproape de 20 decât de 30, deci rotunjit/aproximat la zeci: <b>24 ≈ 20</b>.</p> 
        <p><b>Sfat prietenos:</b> Dacă te încurci, desenează o axă scurtă doar între două repere (de ex. 20 și 30) și vezi unde cade numărul (unde se află numărul).</p>`,
        body_en:`<p><b>What is the number line?</b> A straight line with an arrow to the right. We mark <b>0</b> in the middle. To the right are 1, 2, 3, 4, ... Each tick is a step of <b>+1</b>.</p>
        <p><b>How do I place a number?</b></p>
        <ol>
          <li>Draw a horizontal line and mark <b>0</b>.</li>
          <li>Add equal ticks for 1, 2, 3, ...</li>
          <li>Find your number and put a dot above its tick. For example, 5 is <b>5 steps</b> from 0.</li>
        </ol>
        <p><b>Rounding</b> helps you estimate quickly. 24 is closer to 20 than to 30, so to tens: <b>24 ≈ 20</b>.</p>
        <p><b>Friendly tip:</b> If unsure, draw a tiny line only between two landmarks (e.g., 20 and 30) and see where the number sits.</p>`,
        examples_ro:`<ol>
        <li>Plasează pe axă: 2, 5, 9 (sunt din ce în ce mai departe de 0).</li>
        <li>Rotunjire la zeci: 27 ≈ 30, 24 ≈ 20, 29 ~ 30, 569 ~ 570.</li>
        </ol>`,
        examples_en:`<ol>
        <li>Place on the line: 2, 5, 9 (they get farther from 0).</li>
        <li>Rounding to tens: 27 ≈ 30, 24 ≈ 20.</li>
        </ol>`,
        sources:["manual V"]
      },
      
      /* ——— V — Compararea Numerelor Naturale ——— */
      {
        id:"v-comp-nr-nat",
        grade:"V",
        chapter:"Numere Naturale",
        title_ro:"Compararea Numerelor Naturale",
        title_en:"Comparing Natural Numbers",
        tags:["V","numere naturale","citire","comparare"],
        learn_ro:"Vei compara numere naturale folosind numărul de cifre, valoarea de poziție și axa numerică.",
        learn_en:"You will compare natural numbers using digit count, place value, and the number line.",
        why_ro:"Compararea numerelor apare în prețuri, scoruri, clasamente, distanțe și multe alte situații reale.",
        why_en:"Comparing numbers appears in prices, scores, rankings, distances, and many real-life situations.",
        body_ro:`<p><b>Semnele de comparație:</b> <b>&gt;</b> „mai mare decât”, <b>&lt;</b> „mai mic decât”, <b>=</b> „egal cu”.</p>
        <p><b>Cum compar două numere? (pașii simpli)</b></p>
        <ol>
          <li><b>Numărul de cifre:</b> dacă un număr are mai multe cifre, este mai mare. Ex.: 4&nbsp;057 are 4 cifre, 999 are 3 → <b>4&nbsp;057 &gt; 999</b>.</li>
          <li><b>Au tot atâtea cifre?</b> Compar de la <b>stânga la dreapta</b>: mii → sute → zeci → unități. La primul loc unde diferă, câștigă cifra mai mare. Ex.: 120&nbsp;300 vs 120&nbsp;030 → la sute: 3 vs 0 → <b>120&nbsp;300 &gt; 120&nbsp;030</b>.</li>
          <li><b>Pe axa numerică:</b> mai la dreapta înseamnă mai mare. 28 este la dreapta lui 9 → <b>28 &gt; 9</b>.</li>
          <li><b>Atenție la zerouri:</b> 507 = 507 (egale), dar 5&nbsp;070 nu este la fel ca 507 (are o zecime în plus).</li>
        </ol>
        <p><b>Trucuri utile:</b> compară pe <i>perioade</i> (milioane | mii | sute-zeci-unități), scrie forma extinsă ca să vezi „unde e mai greu” numărul (ex.: 12&nbsp;040 = 12&nbsp;000 + 40), iar dacă sunt apropiate, uită-te la următorul loc (zeci, apoi unități).</p>`,
        body_en:`<p><b>Comparison signs:</b> <b>&gt;</b> “greater than”, <b>&lt;</b> “less than”, <b>=</b> “equal to”.</p>
        <p><b>How do I compare two numbers? (easy steps)</b></p>
        <ol>
        <li><b>Digit count:</b> more digits → larger number. Example: 4,057 has 4 digits; 999 has 3 → <b>4,057 &gt; 999</b>.</li>
        <li><b>Same number of digits?</b> Compare from <b>left to right</b>: thousands → hundreds → tens → ones. At the first different place, the bigger digit wins. Example: 120,300 vs 120,030 → at hundreds: 3 vs 0 → <b>120,300 &gt; 120,030</b>.</li>
        <li><b>On the number line:</b> farther to the right means greater. 28 is to the right of 9 → <b>28 &gt; 9</b>.</li>
        <li><b>Beware of zeros:</b> 507 = 507 (equal), but 5,070 is not the same as 507 (one extra ten).</li>
        </ol>
        <p><b>Helpful tips:</b> compare by <i>periods</i> (millions | thousands | hundreds-tens-ones), write the expanded form to see where the number is “heavier” (e.g., 12,040 = 12,000 + 40), and if the numbers are close, check the next place (tens, then ones).</p>`,
        examples_ro:`<ol>
        <li>4&nbsp;057 vs 3&nbsp;999 → <b>4&nbsp;057 &gt; 3&nbsp;999</b>.</li>
        <li>120&nbsp;300 vs 120&nbsp;030 → <b>120&nbsp;300 &gt; 120&nbsp;030</b>.</li>
        <li>Pe axă: 28 este la dreapta lui 9 → <b>28 &gt; 9</b>.</li>
        <li>Egalitate: <b>507 = 507</b>.</li>
        </ol>`,
        examples_en:`<ol>
        <li>4,057 vs 3,999 → <b>4,057 &gt; 3,999</b>.</li>
        <li>120,300 vs 120,030 → <b>120,300 &gt; 120,030</b>.</li>
        <li>On the line: 28 is to the right of 9 → <b>28 &gt; 9</b>.</li>
        <li>Equality: <b>507 = 507</b>.</li>
        </ol>`,
        sources:["manual V"]
      },

      /* ——— V — Metoda reducerii la unitate ——— */
      {
        id:"v-metode-reducerii-la-unitate",
        grade:"V",
        chapter:"Metode aritmetice de rezolvare a problemelor",
        title_ro:"Metoda reducerii la unitate",
        title_en:"Unit-rate method",
        tags:["V","proporționalitate","unit rate","regula de trei simplă"],
        learn_ro:"Rezolvi rapid probleme de tip „cât pentru 1”, apoi multiplici la cât ai nevoie.",
        learn_en:"Find the value for 1 unit, then scale up or down.",
        why_ro:"Prețuri per bucată/kg, producție pe oră, viteză, debit etc.",
        why_en:"Unit prices, rates per hour, speed, flow.",
        body_ro:`<p><b>Pașii metodei</b>:
          <ol>
            <li><i>Reduci la unitate</i>: afli cât revine pentru 1 unitate (1 kg, 1 bucată, 1 oră…).</li>
            <li><i>Scalezi</i>: înmulțești cu numărul dorit de unități.</li>
          </ol>
          </p>
          <p><b>Exemplu (direct proporțional)</b>: 12 caiete costă 30 lei. 1 caiet costă \\(\\dfrac{30}{12}=2{,}5\\) lei. 20 caiete costă \\(20\\cdot2{,}5=50\\) lei.</p>
          <p><b>Debite/Ritmuri</b>: dacă în 8 ore se fac 120 piese, <i>pe oră</i> se fac \\(120/8=15\\) piese; în 5 ore \\(5\\cdot 15=75\\) piese.</p>
          <p><b>Observație</b>: la „mai mulți muncitori, mai puține zile” e <i>proporționalitate inversă</i>. Pentru lucrarea fixă:
          1 muncitor/zi face \\(\\tfrac{1}{T}\\) din lucrare; cu \\(m\\) muncitori, rata e \\(m/T\\).</p>`,
        body_en:`<p><b>The unit-rate method</b> is one of the most useful arithmetic tools.</p>
          <ol>
            <li>First find the value for <b>1 unit</b>.</li>
            <li>Then multiply by the number of units you need.</li>
          </ol>
          <p><b>Direct proportion example:</b> If 12 notebooks cost 30 lei, then 1 notebook costs \\(30/12=2.5\\) lei. Therefore, 20 notebooks cost \\(20\\cdot2.5=50\\) lei.</p>
          <p><b>Production example:</b> If a team makes 120 items in 8 hours, then in one hour it makes \\(120/8=15\\) items. In 5 hours it makes \\(5\\cdot15=75\\) items.</p>
          <p><b>Important note:</b> sometimes more workers mean fewer days. That is <i>inverse proportionality</i>, so you must think in terms of total work being fixed.</p>
          <p><b>Practical advice:</b> always ask yourself: “How much is one?” After that, the rest becomes much easier.</p>`,
        examples_ro:`<ol>
          <li>5 kg mere = 27,5 lei ⇒ 1 kg = 5,5 lei ⇒ 8 kg = 44 lei.</li>
          <li>Rezervor plin în 12 min cu 3 robinete identice ⇒ 1 robinet: 36 min ⇒ 4 robinete: 9 min.</li>
        </ol>`,
        examples_en:`<ol><li>Unit price and faucet-rate examples.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Divizibilitate ——— */
      {
        id:"v-divizibilitatea-numerelor-naturale",
        grade:"V",
        chapter:"Divizibilitatea numerelor naturale",
        title_ro:"Divizibilitatea numerelor naturale",
        title_en:"Divisibility of natural numbers",
        tags:["V","divizibilitate","CMMDC","CMMMC","factori primi"],
        learn_ro:"Reguli (2,3,4,5,8,9,10,25,11), descompunere în factori primi, CMMDC/CMMMC.",
        learn_en:"Rules of divisibility, prime factorization, GCD/LCM.",
        why_ro:"Simplifici calcule, fracții, sincronizări (LCM), împărțiri în grupe.",
        why_en:"Useful for simplifying, scheduling via LCM, grouping.",
        body_ro:`<p><b>Reguli rapide</b>: 2 (cifra pară), 5 (cifra 0/5), 10 (0), 3/9 (suma cifrelor), 4 (ultimele 2 cifre),
          8 (ultimele 3 cifre), 25 (ultimele 2 cifre în {00,25,50,75}).</p>
          <p><b>Factori primi</b>: orice \\(n\\ge2\\) se scrie unic ca \\(\\prod p_i^{\\alpha_i}\\).</p>
          <p><b>CMMDC/CMMMC</b>:
          dacă \\(a=\\prod p^{\\alpha}\\), \\(b=\\prod p^{\\beta}\\) atunci
          \\[
            \\gcd(a,b)=\\prod p^{\\min(\\alpha,\\beta)},\\quad
            \\operatorname{lcm}(a,b)=\\prod p^{\\max(\\alpha,\\beta)}.
          \\]
          </p>
          <p><b>Număr de divizori</b>: pentru \\(n=\\prod p_i^{\\alpha_i}\\) avem \\(d(n)=\\prod (\\alpha_i+1)\\).</p>`,
        body_en:`<p><b>Divisibility</b> tells us whether one number can be divided by another without remainder.</p>
          <p><b>Quick rules:</b></p>
          <ul>
            <li>by 2: last digit is even;</li>
            <li>by 5: last digit is 0 or 5;</li>
            <li>by 10: last digit is 0;</li>
            <li>by 3 or 9: the sum of digits is divisible by 3 or 9;</li>
            <li>by 4: the last two digits form a number divisible by 4;</li>
            <li>by 8: the last three digits form a number divisible by 8;</li>
            <li>by 25: the last two digits are \\(00,25,50,75\\).</li>
          </ul>
          <p><b>Prime factorization:</b> every natural number \\(n\\ge2\\) can be written uniquely as a product of prime powers.</p>
          <p><b>GCD and LCM:</b> if \\(a=\\prod p^{\\alpha}\\) and \\(b=\\prod p^{\\beta}\\), then</p>
          <p>\\[
          \\gcd(a,b)=\\prod p^{\\min(\\alpha,\\beta)}, \\qquad
          \\operatorname{lcm}(a,b)=\\prod p^{\\max(\\alpha,\\beta)}.
          \\]</p>
          <p><b>Number of divisors:</b> if \\(n=\\prod p_i^{\\alpha_i}\\), then \\(d(n)=\\prod(\\alpha_i+1)\\).</p>`,
        examples_ro:`<ol>
          <li>\\(360=2^3\\cdot 3^2\\cdot 5\\) ⇒ \\(d(360)=(3+1)(2+1)(1+1)=24\\).</li>
          <li>\\(\\gcd(84,30)=6\\), \\(\\operatorname{lcm}(12,18)=36\\).</li>
        </ol>`,
        examples_en:`<ol><li>Worked GCD/LCM and divisor-count examples.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Fracții Ordinare ——— */
      {
        id:"v-frac-ord",
        grade:"V",
        chapter:"Fracții Ordinare",
        title_ro:"Fracții ordinare — noțiuni de bază",
        title_en:"Common fractions — basics",
        tags:["V","fracții","echivalență","simplificare","comparare"],
        learn_ro:"Ce este \\(\\tfrac{a}{b}\\) (b≠0), tipuri (proprie, improprie), echivalență, formă ireductibilă, comparare.",
        learn_en:"Definition, types, equivalence, simplest form, and comparison.",
        why_ro:"Rețete, rapoarte, partajări, probabilități simple.",
        why_en:"Recipes, ratios, sharing, simple probabilities.",
        images: [
          {
            src: "img/fractions-pizza.png",
            src2x: "img/fractions-pizza@2x.png",
            alt: "Discuri împărțite în părți egale (fracții)",
            caption_ro: "O fracție \\(\\tfrac{a}{b}\\) reprezintă \\(a\\) părți din \\(b\\) părți egale.",
            caption_en: "A fraction \\(\\tfrac{a}{b}\\) is \\(a\\) out of \\(b\\) equal parts."
          }
        ],
        body_ro:`<p><b>Definiție</b>: \\(\\tfrac{a}{b}\\) înseamnă „a părți din b părți egale”.</p>
        <p><b>Echivalență</b>: \\(\\dfrac{a}{b}=\\dfrac{ka}{kb}\\) pentru orice \\(k\\neq 0\\).</p>
        <p><b>Simplificare</b>: împarți la CMMDC(a,b) pentru forma ireductibilă.</p>
        <p><b>Comparare</b>: la același numitor compari numărătorii; altfel aduci la același numitor sau folosești produsul în cruce.</p>`,
        body_en:`<p><b>A common fraction</b> has the form \\(\\tfrac{a}{b}\\), where \\(b\\ne0\\). It represents “\\(a\\) parts out of \\(b\\) equal parts”.</p>
          <p><b>Types:</b></p>
          <ul>
            <li><b>proper fraction</b>: numerator smaller than denominator;</li>
            <li><b>improper fraction</b>: numerator greater than or equal to denominator.</li>
          </ul>
          <p><b>Equivalent fractions:</b> multiplying or dividing numerator and denominator by the same nonzero number does not change the value.</p>
          <p><b>Simplest form:</b> divide numerator and denominator by their greatest common divisor.</p>
          <p><b>Comparing fractions:</b> use a common denominator, or compare by cross multiplication.</p>
          <p><b>Adding and subtracting:</b> first bring the fractions to a common denominator, then operate on the numerators.</p>`,
        examples_ro:`<ol>
          <li>\\(\\dfrac{24}{36}=\\dfrac{2}{3}\\) (împărțim la 12).</li>
          <li>\\(\\dfrac{3}{4}+\\dfrac{1}{6}=\\dfrac{11}{12}\\).</li>
        </ol>`,
        examples_en:`<ol><li>Reduction and addition examples.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Fracții Zecimale ——— */
      {
        id:"v-frac-scriere",
        grade:"V",
        chapter:"Fracții Zecimale",
        title_ro:"Scrierea fracțiilor cu numitori \\(10,100,1000,\\dots\\) ca zecimale",
        title_en:"Writing denominators 10^k as decimals",
        tags:["V","fracții","zecimale","rotunjire","transformări"],
        learn_ro:"Transformi între zecimale și \\(\\tfrac{a}{10^k}\\), poziția zecimală, rotunjiri.",
        learn_en:"Convert between decimals and fractions with denominator 10^k; place value; rounding.",
        why_ro:"Prețuri, măsurători, procente, tabele.",
        why_en:"Prices, measurements, percent, tables.",
        body_ro:`<p><b>Din fracție în zecimal</b>: deplasezi virgula \\(k\\) poziții la stânga pentru \\(\\tfrac{a}{10^k}\\).
        Ex.: \\(\\tfrac{37}{1000}=0{,}037\\).</p>
        <p><b>Din zecimal în fracție</b>: numără zecimalele. \\(0{,}304=\\tfrac{304}{1000}=\\tfrac{38}{125}\\).</p>
        <p><b>Rotunjire</b>: la sutimi/miimi etc. privești cifra următoare (≥5 crești).</p>
        <p><b>Caz special</b>: dacă numitorul are doar \\(2\\) și \\(5\\) ca factori primi, fracția are scriere zecimală finită.</p>`,
        body_en:`<p><b>Decimals and fractions with denominator \\(10^k\\)</b> are strongly connected.</p>
          <p><b>From fraction to decimal:</b> if the denominator is \\(10,100,1000,\\dots\\), move the decimal point left by as many places as there are zeros.</p>
          <p>Examples: \\(\\tfrac{5}{10}=0.5\\), \\(\\tfrac{37}{1000}=0.037\\).</p>
          <p><b>From decimal to fraction:</b> count the decimal places, write the number over the corresponding power of 10, then reduce if possible.</p>
          <p>Example: \\(0.304=\\tfrac{304}{1000}=\\tfrac{38}{125}\\).</p>
          <p><b>Rounding:</b> to round to tenths, hundredths, or thousandths, look at the next digit. If it is 5 or more, increase the kept digit by 1.</p>
          <p><b>Useful fact:</b> a fraction has a finite decimal representation exactly when, after simplification, the denominator has only prime factors 2 and 5.</p>`,
        examples_ro:`<ol>
          <li>\\(\\tfrac{5}{100}=0{,}05\\).</li>
          <li>\\(0{,}7+0{,}08+0{,}006=0{,}786\\).</li>
        </ol>`,
        examples_en:`<ol><li>Simple decimal conversions.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Elemente de geometrie ——— */
      {
        id:"v-elem-geo",
        grade:"V",
        chapter:"Elemente de geometrie",
        title_ro:"Punctul. Dreapta. Planul. Segmente. Unghiuri (intro)",
        title_en:"Point, line, plane. Segments & angles (intro)",
        tags:["V","geometrie","segmente","unghiuri","paralele","perpendiculare"],
        learn_ro:"Notezi corect puncte/segmente/raze, poziții relative (paralele, perpendiculare), noțiuni de lungime și unghi drept.",
        learn_en:"Basic objects and relations; measure of segments and right angles.",
        why_ro:"Diagrame, schițe, probleme de arii/perimetre ulterior.",
        why_en:"Diagrams and later area/perimeter problems.",
        body_ro:`<p><b>Obiecte</b>: puncte (A,B), dreaptă \\(d\\) sau \\((AB)\\), semidreapta \\([AB)\\), segmentul \\([AB]\\).</p>
          <p><b>Poziții</b>: drepte paralele (fără punct comun), perpendiculare (unghi drept), secante (un punct comun).</p>
          <p><b>Coliniaritate</b>: punctele A,B,C sunt coliniare dacă apar pe aceeași dreaptă.</p>
          <p><b>Segmente în linie</b>: dacă B este între A și C, atunci \\(AC=AB+BC\\).</p>
          <p><b>Unghi drept</b>: 90°; două drepte perpendiculare formează patru unghiuri drepte congruente.</p>`,
        body_en:`<p><b>The basic objects of geometry</b> are the point, the line, and the plane.</p>
          <p><b>Point:</b> it has no size and is marked with capital letters like \\(A,B,C\\).</p>
          <p><b>Line:</b> it extends infinitely in both directions.</p>
          <p><b>Ray:</b> it starts at one point and extends forever in one direction.</p>
          <p><b>Segment:</b> the part of a line between two endpoints.</p>
          <p><b>Relative positions:</b></p>
          <ul>
            <li><b>parallel lines</b>: no common point;</li>
            <li><b>intersecting lines</b>: one common point;</li>
            <li><b>perpendicular lines</b>: they form right angles.</li>
          </ul>
          <p><b>Collinearity:</b> points are collinear if they lie on the same line.</p>
          <p><b>Segment addition:</b> if \\(B\\) lies between \\(A\\) and \\(C\\), then \\(AC=AB+BC\\).</p>
          <p><b>Right angle:</b> an angle of \\(90^\\circ\\).</p>`,
        examples_ro:`<ol>
          <li>Dacă AM=MB și AM=9 cm ⇒ AB=18 cm.</li>
          <li>Două drepte secante formează 4 unghiuri.</li>
        </ol>`,
        examples_en:`<ol><li>Midpoint and intersecting lines facts.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Unități de măsură ——— */
      {
        id:"v-unit-de-masură",
        grade:"V",
        chapter:"Unități de măsură",
        title_ro:"Lungimi. Perimetre. Transformări",
        title_en:"Lengths, perimeters, conversions",
        tags:["V","unități","lungime","perimetru","conversii"],
        learn_ro:"Transformi între mm–cm–dm–m–km și calculezi perimetrul pătratului/dreptunghiului.",
        learn_en:"Convert between length units and compute perimeters.",
        why_ro:"Hărți, planuri, proiecte, sport, construcții.",
        why_en:"Maps, plans, projects, sports, construction.",
        body_ro:`<p><b>Conversii</b>:
          \\(10\\,\\text{mm}=1\\,\\text{cm}\\), \\(10\\,\\text{cm}=1\\,\\text{dm}\\), \\(10\\,\\text{dm}=1\\,\\text{m}\\), \\(1000\\,\\text{m}=1\\,\\text{km}\\).</p>
          <p><b>Perimetru</b>: pătrat \\(P=4a\\); dreptunghi \\(P=2(a+b)\\); poligon — suma laturilor.</p>
          <p><b>Trick</b>: schimbă întâi totul în aceeași unitate, apoi calculează.</p>`,
        body_en:`<p><b>Length units</b> are used to measure distances and sizes.</p>
          <p><b>Main conversions:</b></p>
          <ul>
            <li>\\(10\\,\\text{mm}=1\\,\\text{cm}\\)</li>
            <li>\\(10\\,\\text{cm}=1\\,\\text{dm}\\)</li>
            <li>\\(10\\,\\text{dm}=1\\,\\text{m}\\)</li>
            <li>\\(1000\\,\\text{m}=1\\,\\text{km}\\)</li>
          </ul>
          <p><b>Important rule:</b> convert everything to the same unit before calculating.</p>
          <p><b>Perimeter</b> means the total length around a figure.</p>
          <ul>
            <li>square: \\(P=4a\\)</li>
            <li>rectangle: \\(P=2(a+b)\\)</li>
            <li>polygon: sum of all side lengths</li>
          </ul>
          <p>These ideas are useful in maps, construction, sports, and measuring everyday objects.</p>`,
        examples_ro:`<ol>
          <li>\\(2{,}5\\,\\text{m}=2500\\,\\text{mm}\\).</li>
          <li>Pătrat cu \\(a=7\\,\\text{cm}\\) ⇒ \\(P=28\\,\\text{cm}\\).</li>
        </ol>`,
        examples_en:`<ol><li>Conversions & perimeter basics.</li></ol>`,
        sources:["manual V"]
      },

      /* ——— V — Fracții & Proporții ——— */
      {
        id:"v-frac",
        grade:"V",
        chapter:"Fracții & Proporții",
        title_ro:"Fracții — partea din întreg (lecția bază)",
        title_en:"Fractions — Part of a Whole",
        tags:["V","fracții","simplificare","comparare"],
        learn_ro:"Vei înțelege ce reprezintă o fracție, cum se citește, cum comparăm fracții, cum le simplificăm și cum facem adunări și scăderi simple.",
        learn_en:"You will understand what a fraction represents, how to read it, how to compare fractions, how to simplify them, and how to perform simple additions and subtractions.",
        why_ro:"Fracțiile apar în rețete, procente, împărțirea obiectelor, timp, lungimi și în multe probleme din viața reală.",
        why_en:"Fractions appear in recipes, percentages, sharing objects, time, lengths, and many real-life problems.",
        body_ro:`<p><b>Ce este o fracție?</b> O fracție arată o parte dintr-un întreg împărțit în părți egale. Ea se scrie sub forma \\(\\dfrac{a}{b}\\), unde \\(a\\) este <i>numărătorul</i>, iar \\(b\\) este <i>numitorul</i>, cu \\(b\\neq 0\\).</p>
        <p><b>Exemplu:</b> \\(\\dfrac{3}{4}\\) înseamnă 3 părți din 4 părți egale.</p>
        <p><b>Citirea fracțiilor:</b> \\(\\dfrac{1}{2}\\) se citește „o doime”, \\(\\dfrac{3}{5}\\) se citește „trei cincimi”, \\(\\dfrac{7}{10}\\) se citește „șapte zecimi”.</p>
        <p><b>Fracții echivalente:</b> Două fracții pot arăta diferit, dar să reprezinte aceeași valoare. De exemplu, \\(\\dfrac{1}{2}=\\dfrac{2}{4}=\\dfrac{3}{6}\\).</p>
        <p><b>Simplificarea:</b> O fracție se simplifică împărțind numărătorul și numitorul prin același număr nenul. Exemplu: \\(\\dfrac{12}{18}=\\dfrac{2}{3}\\).</p>
        <p><b>Compararea fracțiilor:</b> Dacă au același numitor, este mai mare fracția cu numărătorul mai mare. Dacă au același numărător, este mai mare fracția cu numitorul mai mic.</p>
        <p><b>Adunarea și scăderea:</b> Dacă fracțiile au același numitor, adunăm sau scădem numărătorii și păstrăm numitorul. Dacă au numitori diferiți, le aducem la același numitor.</p>
        <p><b>Exemplu:</b> \\(\\dfrac{3}{4}+\\dfrac{1}{6}=\\dfrac{9}{12}+\\dfrac{2}{12}=\\dfrac{11}{12}\\).</p>`,
        body_en:`<p><b>What is a fraction?</b> A fraction shows a part of a whole divided into equal parts. It is written as \\(\\dfrac{a}{b}\\), where \\(a\\) is the numerator and \\(b\\) is the denominator, with \\(b\\neq 0\\).</p>
        <p><b>Example:</b> \\(\\dfrac{3}{4}\\) means 3 parts out of 4 equal parts.</p>
        <p><b>Equivalent fractions:</b> Two fractions may look different but represent the same value. For example, \\(\\dfrac{1}{2}=\\dfrac{2}{4}=\\dfrac{3}{6}\\).</p>
        <p><b>Simplifying:</b> We simplify a fraction by dividing numerator and denominator by the same nonzero number. Example: \\(\\dfrac{12}{18}=\\dfrac{2}{3}\\).</p>
        <p><b>Comparing fractions:</b> With the same denominator, the fraction with the larger numerator is greater. With the same numerator, the fraction with the smaller denominator is greater.</p>
        <p><b>Addition and subtraction:</b> If fractions have the same denominator, we add or subtract the numerators and keep the denominator. Otherwise, we first use a common denominator.</p>`,
        examples_ro:`<ol>
          <li>\\(\\dfrac{2}{4}=\\dfrac{1}{2}\\).</li>
          <li>\\(\\dfrac{5}{8}>\\dfrac{3}{8}\\) pentru că au același numitor.</li>
          <li>\\(\\dfrac{3}{4}+\\dfrac{1}{6}=\\dfrac{11}{12}\\).</li>
        </ol>`,
        examples_en:`<ol>
          <li>\\(\\dfrac{2}{4}=\\dfrac{1}{2}\\).</li>
          <li>\\(\\dfrac{5}{8}>\\dfrac{3}{8}\\).</li>
          <li>\\(\\dfrac{3}{4}+\\dfrac{1}{6}=\\dfrac{11}{12}\\).</li>
        </ol>`,
        sources:["manual V"]
      },

      /* ——— VII etc. ——— */
      {
        id:"vii-ec-lin",
        grade:"VII",
        chapter:"Ecuații",
        title_ro:"Ecuații liniare — metoda pașilor egali",
        title_en:"Linear Equations — Balanced Steps",
        tags:["VII","ecuații","gradul I"],
        learn_ro:"Vei rezolva ecuații de forma \\(ax+b=cx+d\\), vei înțelege de ce mutăm termenii și vei verifica soluția corect.",
        learn_en:"You will solve equations of the form \\(ax+b=cx+d\\), understand why we move terms, and check the solution correctly.",
        why_ro:"Ecuațiile apar în probleme de bani, viteză, distanță, vârstă, proporții și în foarte multe aplicații reale.",
        why_en:"Equations appear in money, speed, distance, age, ratio, and many real-world problems.",
        body_ro:`<p><b>Ce este o ecuație?</b> O ecuație este o egalitate care conține una sau mai multe necunoscute. Scopul este să găsim valoarea necunoscutei pentru care egalitatea devine adevărată.</p>
          <p><b>Exemplu simplu:</b> \\(x+5=12\\). Ne întrebăm: ce număr pus în locul lui \\(x\\) dă o egalitate adevărată? Răspuns: \\(x=7\\).</p>
          <p><b>Ideea principală:</b> putem face aceeași operație în ambele membre ale ecuației fără să stricăm egalitatea.</p>
          <p><b>Pașii standard:</b></p>
          <ol>
            <li>Desfacem parantezele, dacă există.</li>
            <li>Reducem termenii asemenea.</li>
            <li>Mutăm termenii cu \\(x\\) într-o parte și numerele în cealaltă parte.</li>
            <li>Împărțim la coeficientul lui \\(x\\).</li>
            <li>Verificăm soluția în ecuația inițială.</li>
          </ol>
          <p><b>Exemplu:</b> \\(5x+3=2x+21\\Rightarrow 5x-2x=21-3\\Rightarrow 3x=18\\Rightarrow x=6\\).</p>
          <p><b>Verificare:</b> \\(5\\cdot 6+3=33\\), iar \\(2\\cdot 6+21=33\\). Deci soluția este corectă.</p>`,
        body_en:`<p><b>Linear equations</b> are equations where the unknown appears only to the first power.</p>
          <p>A common form is \\(ax+b=cx+d\\).</p>
          <p><b>Main idea:</b></p>
          <ol>
            <li>move all terms with \\(x\\) to one side;</li>
            <li>move all numbers to the other side;</li>
            <li>simplify and divide by the coefficient of \\(x\\).</li>
          </ol>
          <p>Example:</p>
          <p>\\[
          5x+3=2x+21 \\Rightarrow 3x=18 \\Rightarrow x=6.
          \\]</p>
          <p><b>Check:</b> always substitute the solution back into the original equation.</p>`,
        examples_ro:`<ol>
          <li>\\(3x-7=11\\Rightarrow 3x=18\\Rightarrow x=6\\).</li>
          <li>\\(2(3x-1)=14\\Rightarrow 6x-2=14\\Rightarrow 6x=16\\Rightarrow x=\\dfrac{8}{3}\\).</li>
        </ol>`,
        examples_en:`<ol>
          <li>\\(3x-7=11\\Rightarrow x=6\\).</li>
          <li>\\(2(3x-1)=14\\Rightarrow x=\\dfrac{8}{3}\\).</li>
        </ol>`,
        sources:["manual VII"]
      },

      /* ——— OLIMPIADĂ (lecții) ——— */
      {
        id:"ol-v-comb",
        grade:"OL-V",
        chapter:"Combinatorică",
        title_ro:"Olimpiadă V — Combinatorică pentru începători",
        title_en:"Olympiad V — Introductory Combinatorics",
        tags:["olimpiadă","numărare","aranjări"],
        learn_ro:"Vei învăța să numeri inteligent cazuri fără să le scrii pe toate, folosind principiul multiplicativ, tabele și aranjări simple.",
        learn_en:"You will learn how to count cases intelligently without listing all of them, using the multiplication principle, tables, and simple arrangements.",
        why_ro:"Combinatorica apare foarte des la olimpiadă pentru că te obligă să gândești clar, organizat și fără formule inutile.",
        why_en:"Combinatorics appears very often in olympiad problems because it forces you to think clearly, systematically, and without unnecessary formulas.",
        body_ro:`<p><b>Ce este combinatorica?</b> Este partea matematicii care se ocupă cu numărarea posibilităților.</p>
          <p><b>Principiul multiplicativ:</b> dacă un lucru se poate face în \\(m\\) moduri și apoi altul în \\(n\\) moduri, atunci împreună se pot face în \\(m\\cdot n\\) moduri.</p>
          <p><b>Exemplu:</b> dacă ai 3 tricouri și 4 pantaloni, poți forma \\(3\\cdot 4=12\\) ținute.</p>
          <p><b>Ordinea contează?</b> În unele probleme da, în altele nu. Dacă ordinea contează, vorbim despre aranjări sau permutări. Dacă nu contează, vorbim despre alegeri.</p>
          <p><b>Permutări cu repetiții:</b> când unele litere sau obiecte se repetă, numărul de aranjări distincte scade. Formula este \\(\\dfrac{n!}{k_1!k_2!\\cdots k_p!}\\).</p>
          <p><b>Exemplu:</b> cuvântul „LEVEL” are 5 litere, dintre care L apare de 2 ori și E apare de 2 ori, deci numărul de aranjări distincte este \\(\\dfrac{5!}{2!2!}=30\\).</p>`,
        body_en:`<p><b>Combinatorics</b> studies how to count efficiently without listing everything one by one.</p>
          <p><b>Product principle:</b> if one action can be done in \\(a\\) ways and a second action in \\(b\\) ways, then together they can be done in \\(a\\cdot b\\) ways.</p>
          <p><b>Permutations with repetitions:</b> if some letters repeat, the number of distinct arrangements is</p>
          <p>\\[
          \\frac{n!}{\\prod k_i!}.
          \\]</p>
          <p>Example: the word LEVEL has 5 letters, with L repeated twice and E repeated twice, so the number of distinct arrangements is \\(\\tfrac{5!}{2!2!}=30\\).</p>`,
        examples_ro:`<ul><li>„LEVEL”: \\(\\dfrac{5!}{2!2!}=30\\).</li><li>2 cifre din \\(\\{1,2,3\\}\\) cu repetare: \\(3\\cdot 3=9\\).</li></ul>`,
        examples_en:`<ul><li>“LEVEL”: \\(\\dfrac{5!}{2!2!}=30\\).</li><li>Two digits from \\(\\{1,2,3\\}\\) with repetition: \\(3\\cdot 3=9\\).</li></ul>`,
        sources:["ONM (insp.)"]
      },

      /* ——— FACULTATE (cursuri și capitole) ——— */
      {
        id:"fac-ac",
        grade:"FAC",
        chapter:"Analiză Complexă",
        title_ro:"Serii de puteri — Cauchy–Hadamard",
        title_en:"Power Series — Cauchy–Hadamard",
        tags:["facultate","AC","serii"],
        learn_ro:"Vei înțelege ce este o serie de puteri, ce înseamnă raza de convergență și cum folosim formula lui Cauchy–Hadamard.",
        learn_en:"You will understand what a power series is, what the radius of convergence means, and how to use the Cauchy–Hadamard formula.",
        why_ro:"Seriile de puteri stau la baza dezvoltărilor în serie, a funcțiilor analitice și a multor idei importante din analiza complexă.",
        why_en:"Power series are fundamental in series expansions, analytic functions, and many key ideas in complex analysis.",
        body_ro:`<p><b>Serie de puteri:</b> o expresie de forma \\(\\sum_{n=0}^{\\infty} a_n (z-z_0)^n\\).</p>
          <p>Ideea principală este că o astfel de serie nu converge peste tot, ci într-un anumit disc centrat în \\(z_0\\).</p>
          <p><b>Raza de convergență</b> este numărul \\(R\\ge 0\\) astfel încât seria converge pentru \\(|z-z_0|<R\\) și diverge pentru \\(|z-z_0|>R\\).</p>
          <p><b>Formula Cauchy–Hadamard:</b> \\[ R=\\frac{1}{\\limsup\\limits_{n\\to\\infty}\\sqrt[n]{|a_n|}}. \\]</p>
          <p><b>Interpretare:</b> coeficienții \\(a_n\\) controlează cât de repede „explodează” termenii, iar asta decide unde mai poate converge seria.</p>
          <p><b>Exemplu:</b> dacă \\(a_n=\\dfrac{1}{n!}\\), atunci \\(\\sqrt[n]{|a_n|}\\to 0\\), deci \\(R=\\infty\\). Seria converge pentru orice \\(z\\).</p>`,
        body_en:`<p><b>A power series</b> has the form \\(\\sum a_n(x-c)^n\\). A central question is: for which values of \\(x\\) does this series converge?</p>
          <p><b>Cauchy–Hadamard formula:</b></p>
          <p>\\[
          R=\\frac{1}{\\limsup\\sqrt[n]{|a_n|}}
          \\]</p>
          <p>Here \\(R\\) is the radius of convergence.</p>
          <p>If \\(|x-c|<R\\), the series converges; if \\(|x-c|>R\\), it diverges.</p>
          <p>Example: if \\(a_n=\\tfrac{1}{n!}\\), then the radius is infinite, so the series converges for all real and complex values of \\(x\\).</p>`,
        examples_ro:`<ul><li>Pentru \\(a_n=1\\), seria \\(\\sum z^n\\) are \\(R=1\\).</li><li>Pentru \\(a_n=1/n!\\), avem \\(R=\\infty\\).</li></ul>`,
        examples_en:`<ul><li>For \\(a_n=1\\), the series \\(\\sum z^n\\) has \\(R=1\\).</li><li>For \\(a_n=1/n!\\), we get \\(R=\\infty\\).</li></ul>`,
        sources:["curs AC"]
      },
      {
        id:"fac-tn",
        grade:"FAC",
        chapter:"Teoria Numerelor",
        title_ro:"Congruențe — Teorema lui Euler–Fermat",
        title_en:"Congruences — Euler–Fermat Theorem",
        tags:["facultate","NT","congruente"],
        learn_ro:"Vei înțelege noțiunea de congruență modulo \\(n\\), funcția lui Euler și teorema Euler–Fermat.",
        learn_en:"You will understand congruences modulo \\(n\\), Euler’s totient function, and the Euler–Fermat theorem.",
        why_ro:"Aceste idei apar în calcule rapide modulo \\(n\\), criptografie și probleme clasice de teoria numerelor.",
        why_en:"These ideas appear in fast modular computations, cryptography, and classical number theory problems.",
        body_ro:`<p><b>Congruență:</b> spunem că \\(a\\equiv b\\pmod n\\) dacă \\(n\\mid(a-b)\\), adică \\(a\\) și \\(b\\) au același rest la împărțirea cu \\(n\\).</p>
          <p><b>Exemplu:</b> \\(17\\equiv 5\\pmod{12}\\), deoarece \\(17-5=12\\).</p>
          <p><b>Funcția lui Euler</b>, \\(\\varphi(n)\\), numără câte numere între 1 și \\(n\\) sunt prime cu \\(n\\).</p>
          <p><b>Teorema lui Euler–Fermat:</b> dacă \\(\\gcd(a,n)=1\\), atunci \\(a^{\\varphi(n)}\\equiv 1\\pmod n\\).</p>
          <p><b>Caz particular:</b> dacă \\(p\\) este prim și \\(p\\nmid a\\), atunci \\(a^{p-1}\\equiv 1\\pmod p\\). Aceasta este mica teoremă a lui Fermat.</p>
          <p><b>Utilitate:</b> teorema ne ajută să reducem exponenți mari în calcule modulo \\(n\\).</p>`,
        body_en:`<p><b>Congruences</b> are a way of working with remainders modulo \\(n\\).</p>
          <p>We write \\(a\\equiv b\\pmod n\\) when \\(a\\) and \\(b\\) leave the same remainder upon division by \\(n\\).</p>
          <p><b>Euler–Fermat theorem:</b> if \\(\\gcd(a,n)=1\\), then</p>
          <p>\\[
          a^{\\varphi(n)}\\equiv 1\\pmod n.
          \\]</p>
          <p>This is extremely useful for reducing large powers modulo \\(n\\).</p>
          <p>It generalizes Fermat’s little theorem and is a key tool in number theory and modular arithmetic.</p>`,
        examples_ro:`<ul><li>\\(2^{10}\\equiv 1\\pmod{11}\\).</li><li>\\(3^4\\equiv 1\\pmod 5\\), deoarece \\(\\varphi(5)=4\\).</li></ul>`,
        examples_en:`<ul><li>\\(2^{10}\\equiv 1\\pmod{11}\\).</li><li>\\(3^4\\equiv 1\\pmod 5\\).</li></ul>`,
        sources:["curs TN"]
      },
      {
        id:"fac-af",
        grade:"FAC",
        chapter:"Analiză Funcțională",
        title_ro:"Spații Banach & Operatorii limitați",
        title_en:"Banach Spaces & Bounded Operators",
        tags:["facultate","AF","norme"],
        learn_ro:"Vei înțelege ce este un spațiu normat complet, ce este un operator liniar mărginit și de ce aceste concepte sunt fundamentale.",
        learn_en:"You will understand what a complete normed space is, what a bounded linear operator is, and why these concepts are fundamental.",
        why_ro:"Analiza funcțională stă la baza ecuațiilor diferențiale, optimizării, analizei operatorilor și multor zone moderne din matematică.",
        why_en:"Functional analysis is fundamental for differential equations, optimization, operator theory, and many modern areas of mathematics.",
        body_ro:`<p><b>Spațiu normat:</b> este un spațiu vectorial în care fiecărui vector i se asociază o normă \\(\\|x\\|\\), adică o „mărime” sau „lungime”.</p>
          <p><b>Spațiu Banach:</b> un spațiu normat complet, adică orice șir Cauchy converge în același spațiu.</p>
          <p><b>Operator liniar:</b> o funcție \\(T\\) care respectă adunarea și înmulțirea cu scalari: \\(T(x+y)=T(x)+T(y)\\), \\(T(\\lambda x)=\\lambda T(x)\\).</p>
          <p><b>Operator mărginit:</b> există un număr \\(M>0\\) astfel încât \\(\\|Tx\\|\\le M\\|x\\|\\) pentru orice \\(x\\).</p>
          <p><b>Important:</b> în spații normate, „operator liniar mărginit” este echivalent cu „operator continuu”.</p>
          <p><b>Teorema punctului fix Banach:</b> într-un spațiu Banach, orice contracție are un unic punct fix.</p>`,
        body_en:`<p><b>A Banach space</b> is a normed vector space that is complete, meaning every Cauchy sequence converges inside the space.</p>
          <p><b>Bounded operators</b> are linear maps \\(T\\) such that</p>
          <p>\\[
          \\|Tx\\|\\le M\\|x\\|
          \\]</p>
          <p>for some constant \\(M\\) and every vector \\(x\\).</p>
          <p>One of the most famous results here is the <b>Banach fixed-point theorem</b>: every contraction on a complete metric space has a unique fixed point.</p>
          <p>This theorem is important in equations, iterative methods, and existence proofs.</p>`,
        examples_ro:`<ul><li>\\(\\mathbb{R}^n\\) cu norma euclidiană este un spațiu Banach.</li><li>Aplicația \\(T(x)=2x\\) este liniară și mărginită.</li></ul>`,
        examples_en:`<ul><li>\\(\\mathbb{R}^n\\) with the Euclidean norm is a Banach space.</li><li>The map \\(T(x)=2x\\) is linear and bounded.</li></ul>`,
        sources:["curs AF"]
      },
      {
        id:"fac-an2",
        grade:"FAC",
        chapter:"Analiză 2",
        title_ro:"Derivate parțiale & Gradient",
        title_en:"Partial Derivatives & Gradient",
        tags:["facultate","Analiza2"],
        learn_ro:"Vei învăța cum derivăm funcții de mai multe variabile, ce este gradientul și cum folosim Hessiana la studiul extremelor.",
        learn_en:"You will learn how to differentiate functions of several variables, what the gradient is, and how to use the Hessian in extremum problems.",
        why_ro:"Funcțiile de mai multe variabile apar în fizică, economie, optimizare, machine learning și geometrie.",
        why_en:"Functions of several variables appear in physics, economics, optimization, machine learning, and geometry.",
        body_ro:`<p><b>Derivată parțială:</b> dacă \\(f(x,y)\\) depinde de două variabile, derivata parțială după \\(x\\) măsoară cum se schimbă funcția când variază doar \\(x\\), iar \\(y\\) rămâne fix.</p>
          <p>Se notează \\(\\partial_x f\\) sau \\(\\dfrac{\\partial f}{\\partial x}\\).</p>
          <p><b>Gradientul</b> este vectorul tuturor derivatelor parțiale de ordin 1: \\(\\nabla f=(\\partial_x f,\\partial_y f,\\ldots)\\).</p>
          <p>Gradientul arată direcția de creștere maximă a funcției.</p>
          <p><b>Hessiana</b> este matricea derivatelor parțiale de ordin 2 și ne ajută să studiem punctele de extrem.</p>
          <p><b>Exemplu:</b> pentru \\(f(x,y)=x^2+xy+y^2\\), avem \\(\\nabla f=(2x+y,x+2y)\\).</p>`,
        body_en:`<p><b>Partial derivatives</b> measure how a function of several variables changes when one variable changes and the others are kept fixed.</p>
          <p>The <b>gradient</b> of a function \\(f(x,y,\\dots)\\) is</p>
          <p>\\[
          \\nabla f=(\\partial_x f,\\partial_y f,\\dots).
          \\]</p>
          <p>It points in the direction of fastest increase.</p>
          <p>For studying local maxima and minima, we also use second derivatives gathered in the <b>Hessian matrix</b>.</p>
          <p>Example: for \\(f(x,y)=x^2+xy+y^2\\), we get \\(\\nabla f=(2x+y,x+2y)\\).</p>`,
        examples_ro:`<ul><li>\\(f(x,y)=x^2y\\Rightarrow \\partial_x f=2xy,\\; \\partial_y f=x^2\\).</li></ul>`,
        examples_en:`<ul><li>\\(f(x,y)=x^2y\\Rightarrow \\partial_x f=2xy,\\; \\partial_y f=x^2\\).</li></ul>`,
        sources:["curs Analiza 2"]
      },
      {
        id:"fac-top",
        grade:"FAC",
        chapter:"Topologie",
        title_ro:"Spații topologice & Continuitate",
        title_en:"Topological Spaces & Continuity",
        tags:["facultate","Topologie"],
        learn_ro:"Vei înțelege ce este o topologie, ce sunt mulțimile deschise și închise și cum definim continuitatea în limbaj topologic.",
        learn_en:"You will understand what a topology is, what open and closed sets are, and how continuity is defined in topological language.",
        why_ro:"Topologia generalizează noțiunile de apropiere și continuitate din analiza clasică și apare în multe ramuri moderne ale matematicii.",
        why_en:"Topology generalizes the notions of nearness and continuity from classical analysis and appears in many modern branches of mathematics.",
        body_ro:`<p><b>Spațiu topologic:</b> o mulțime \\(X\\) împreună cu o familie \\(\\mathcal{T}\\) de submulțimi, numite <i>mulțimi deschise</i>, care respectă anumite axiome.</p>
          <p><b>Axiome:</b> \\(\\varnothing\\) și \\(X\\) sunt deschise; reuniunea oricărei familii de deschise este deschisă; intersecția a finit de multe deschise este deschisă.</p>
          <p><b>Mulțime închisă:</b> complementara unei mulțimi deschise.</p>
          <p><b>Continuitate:</b> o funcție \\(f:X\\to Y\\) este continuă dacă preimaginea oricărei mulțimi deschise din \\(Y\\) este deschisă în \\(X\\).</p>
          <p>Acesta este limbajul general care extinde noțiunea clasică de continuitate din \\(\\mathbb{R}\\).</p>`,
        body_en:`<p><b>Topology</b> studies shapes and spaces in a very general way, focusing on openness, continuity, and structure rather than exact distances.</p>
          <p>A <b>topological space</b> is a set together with a family of subsets called <b>open sets</b>.</p>
          <p>A function is <b>continuous</b> if the preimage of every open set is open.</p>
          <p>This point of view generalizes the familiar notion of continuity from real analysis and is fundamental in modern mathematics.</p>`,
        examples_ro:`<ul><li>În \\(\\mathbb{R}\\), intervalele deschise \\((a,b)\\) sunt exemple clasice de mulțimi deschise.</li></ul>`,
        examples_en:`<ul><li>In \\(\\mathbb{R}\\), open intervals \\((a,b)\\) are classical examples of open sets.</li></ul>`,
        sources:["curs Topologie"]
      },
      {
        id:"fac-gl",
        grade:"FAC",
        chapter:"Geometrie Liniară",
        title_ro:"Forme bilineare & diagonalizare",
        title_en:"Bilinear Forms & Diagonalization",
        tags:["facultate","GeometrieLiniara"],
        learn_ro:"Vei înțelege ce este o formă biliniară, când este simetrică și de ce diagonalizarea simplifică studiul ei.",
        learn_en:"You will understand what a bilinear form is, when it is symmetric, and why diagonalization simplifies its study.",
        why_ro:"Formele bilineare apar în geometrie, algebră liniară, produse scalare și studiul conicelor sau cuadricelor.",
        why_en:"Bilinear forms appear in geometry, linear algebra, inner products, and the study of conics or quadrics.",
        body_ro:`<p><b>Formă biliniară:</b> o aplicație \\(B:V\\times V\\to \\mathbb{R}\\) liniară în fiecare argument.</p>
          <p><b>Simetrie:</b> forma este simetrică dacă \\(B(x,y)=B(y,x)\\).</p>
          <p>Într-o bază fixată, o formă biliniară este reprezentată printr-o matrice \\(A\\), iar expresia ei devine \\(B(x,y)=x^T A y\\).</p>
          <p><b>Diagonalizare:</b> dacă schimbăm baza potrivit, uneori matricea formei devine diagonală. Atunci studiul formei devine mult mai simplu.</p>
          <p><b>Teorema spectrului:</b> matricile simetrice reale pot fi diagonalizate ortogonal.</p>`,
        body_en:`<p><b>Bilinear forms</b> are functions that are linear in each variable separately.</p>
          <p>Important examples are symmetric bilinear forms, which are closely related to quadratic forms.</p>
          <p><b>Diagonalization</b> means rewriting a form in a simpler coordinate system where the mixed terms disappear.</p>
          <p>For real symmetric matrices, this is guaranteed by the <b>spectral theorem</b>, which says that they can be orthogonally diagonalized.</p>`,
        examples_ro:`<ul><li>Produsul scalar standard este o formă biliniară simetrică.</li></ul>`,
        examples_en:`<ul><li>The standard dot product is a symmetric bilinear form.</li></ul>`,
        sources:["curs GL"]
      },
      {
        id:"fac-al2",
        grade:"FAC",
        chapter:"Algebră Liniară 2",
        title_ro:"Endomorfisme & Teorema Cayley–Hamilton",
        title_en:"Endomorphisms & the Cayley–Hamilton Theorem",
        tags:["facultate","AL2"],
        learn_ro:"Vei înțelege ce este un endomorfism, ce este polinomul caracteristic și cum se aplică teorema Cayley–Hamilton.",
        learn_en:"You will understand what an endomorphism is, what the characteristic polynomial is, and how the Cayley–Hamilton theorem works.",
        why_ro:"Teorema Cayley–Hamilton este un instrument foarte puternic pentru matrice, recurențe și calculul puterilor matriceale.",
        why_en:"The Cayley–Hamilton theorem is a powerful tool for matrices, recurrences, and computing matrix powers.",
        body_ro:`<p><b>Endomorfism:</b> o aplicație liniară de la un spațiu vectorial în el însuși.</p>
          <p><b>Polinom caracteristic:</b> pentru o matrice \\(A\\), acesta este \\(p_A(\\lambda)=\\det(\\lambda I-A)\\).</p>
          <p><b>Teorema Cayley–Hamilton:</b> orice matrice își verifică propriul polinom caracteristic, adică \\(p_A(A)=0\\).</p>
          <p>Asta înseamnă că putem înlocui variabila \\(\\lambda\\) din polinom cu matricea \\(A\\), iar rezultatul este matricea nulă.</p>
          <p><b>Utilitate:</b> putem reduce puteri mari ale lui \\(A\\) la combinații liniare de puteri mai mici.</p>`,
        body_en:`<p><b>Endomorphisms</b> are linear maps from a vector space to itself.</p>
          <p>The <b>Cayley–Hamilton theorem</b> says that every square matrix satisfies its own characteristic polynomial:</p>
          <p>\\[
          p_A(A)=0.
          \\]</p>
          <p>This powerful result helps us simplify matrix computations, especially matrix powers and polynomial expressions in matrices.</p>`,
        examples_ro:`<ul><li>Dacă \\(p_A(\\lambda)=\\lambda^2-3\\lambda+2\\), atunci \\(A^2-3A+2I=0\\).</li></ul>`,
        examples_en:`<ul><li>If \\(p_A(\\lambda)=\\lambda^2-3\\lambda+2\\), then \\(A^2-3A+2I=0\\).</li></ul>`,
        sources:["curs AL2"]
      },
      {
        id:"fac-gaa",
        grade:"FAC",
        chapter:"Geometrie Analitică Avansată",
        title_ro:"Conice & Transformări afine",
        title_en:"Conics & Affine Transformations",
        tags:["facultate","GAA"],
        learn_ro:"Vei înțelege ecuația generală a unei conice și rolul transformărilor afine în simplificarea ei.",
        learn_en:"You will understand the general equation of a conic and the role of affine transformations in simplifying it.",
        why_ro:"Conicele apar în geometrie, fizică, astronomie și în multe modele matematice clasice.",
        why_en:"Conics appear in geometry, physics, astronomy, and many classical mathematical models.",
        body_ro:`<p><b>Conicele</b> sunt curbe precum cercul, elipsa, parabola și hiperbola.</p>
          <p>Ecuația generală a unei conice în plan este \\(Ax^2+Bxy+Cy^2+Dx+Ey+F=0\\).</p>
          <p>În funcție de coeficienți, această ecuație poate descrie tipuri diferite de curbe.</p>
          <p><b>Transformări afine:</b> schimbări de coordonate care păstrează linii, paralelism și structura generală a figurilor.</p>
          <p>Prin rotații și translații, putem simplifica termenul \\(Bxy\\) și ajunge la forme canonice mai ușor de interpretat.</p>`,
        body_en:`<p><b>Conics</b> are curves such as ellipses, parabolas, and hyperbolas, usually described by a quadratic equation in two variables.</p>
          <p>A general equation looks like</p>
          <p>\\[
          Ax^2+Bxy+Cy^2+Dx+Ey+F=0.
          \\]</p>
          <p>Using affine changes of coordinates and diagonalization, we can classify the conic and rewrite it in a simpler standard form.</p>`,
        examples_ro:`<ul><li>\\(x^2+y^2=1\\) descrie un cerc.</li><li>\\(y=x^2\\) descrie o parabolă.</li></ul>`,
        examples_en:`<ul><li>\\(x^2+y^2=1\\) describes a circle.</li><li>\\(y=x^2\\) describes a parabola.</li></ul>`,
        sources:["curs GAA"]
      },

      /* ——— EN/BAC/ADM (overview) ——— */
      {
        id:"en-alg",
        grade:"EN",
        chapter:"Aritmetică & Algebră",
        title_ro:"EN — Aritmetică & Algebră",
        title_en:"NE — Arithmetic & Algebra",
        tags:["evaluare națională","EN"],
        learn_ro:"Vei recapitula tipurile clasice de exerciții de la Evaluarea Națională: calcule, fracții, procente, ecuații simple și probleme cu text.",
        learn_en:"You will review the standard National Evaluation tasks: computations, fractions, percentages, simple equations, and word problems.",
        why_ro:"Aceasta este zona de bază din examen și de aici se obțin multe puncte sigure dacă ai metoda clară.",
        why_en:"This is the basic exam area, and many reliable points come from here if your method is clear.",
        body_ro:`<p>La EN, partea de aritmetică și algebră verifică rapiditatea, atenția și înțelegerea conceptelor de bază.</p>
          <p>Trebuie să stăpânești: ordinea operațiilor, fracții, procente, rapoarte, proporții, calcule cu numere întregi și raționale, ecuații de gradul I și interpretarea corectă a problemelor cu text.</p>
          <p><b>Sfat:</b> la exercițiile ușoare, nu complica metoda; la cele cu text, identifică clar ce se cere și ce relație matematică poți scrie.</p>`,
        body_en:`<p>This lesson gathers the most common <b>National Evaluation</b> algebra patterns: fractions, proportions, equations, powers, and arithmetic reasoning.</p>
          <p>The goal is not just to solve isolated exercises, but to recognize the standard structures that appear repeatedly in official exam sets.</p>`,
        examples_ro:`<ul><li>Procente dintr-un număr.</li><li>Ecuații simple.</li><li>Probleme cu fracții și rapoarte.</li></ul>`,
        examples_en:`<ul><li>Percentages of a number.</li><li>Simple equations.</li><li>Problems with fractions and ratios.</li></ul>`,
        sources:["EN 2025 (link în set)"]
      },
      {
        id:"en-geo",
        grade:"EN",
        chapter:"Geometrie",
        title_ro:"EN — Geometrie plană",
        title_en:"NE — Plane Geometry",
        tags:["evaluare națională","EN","geometrie"],
        learn_ro:"Vei recapitula noțiunile clasice de geometrie plană pentru EN: unghiuri, triunghiuri, patrulatere, arii și perimetre.",
        learn_en:"You will review the standard plane geometry topics for the National Evaluation: angles, triangles, quadrilaterals, areas, and perimeters.",
        why_ro:"Geometria de EN cere atenție la desen, vocabular corect și folosirea clară a proprietăților de bază.",
        why_en:"National Evaluation geometry requires careful reading of the figure, correct vocabulary, and clear use of basic properties.",
        body_ro:`<p>În această zonă de examen apar frecvent unghiuri, triunghiuri, perimetre, arii, proprietăți ale figurilor plane și relații simple între segmente.</p>
          <p><b>Important:</b> desenul te ajută, dar demonstrația trebuie făcută prin proprietăți, nu doar „din ochi”.</p>
          <p>La problemele de geometrie, începe prin a nota datele, apoi identifică figura și formula sau proprietatea potrivită.</p>`,
        body_en:`<p>This lesson focuses on the main <b>National Evaluation geometry</b> topics: angles, triangles, basic properties, perimeter, area, and elementary geometric reasoning.</p>
          <p>It is designed to help you identify the standard geometry patterns that appear very often in exam exercises.</p>`,
        sources:["EN 2025 (link în set)"]
      },
      {
        id:"bac-alg",
        grade:"BAC",
        chapter:"Algebră",
        title_ro:"BAC — Matrici & determinanți",
        title_en:"BAC — Matrices & Determinants",
        tags:["bacalaureat","BAC"],
        learn_ro:"Vei recapitula operațiile cu matrici, determinantul și tehnicile de calcul cele mai frecvente la BAC.",
        learn_en:"You will review matrix operations, determinants, and the most common calculation techniques for the baccalaureate exam.",
        why_ro:"La BAC, matricile și determinanții sunt o sursă importantă de puncte dacă știi algoritmii clari.",
        why_en:"In the BAC exam, matrices and determinants are a major source of points if you know the algorithms clearly.",
        body_ro:`<p>În această lecție recapitulezi noțiunile de bază despre matrici: adunare, înmulțire cu scalar, înmulțirea matricilor și interpretarea determinantului.</p>
          <p><b>Determinantul</b> este un număr asociat unei matrice pătrate și oferă informații importante despre invertibilitate și despre sisteme liniare.</p>
          <p>Pentru BAC, este important să stăpânești determinantul de ordin 2 și 3, regula lui Sarrus și calculele corecte cu semne.</p>`,
        body_en:`<p>This lesson reviews the main <b>BAC algebra</b> topics related to matrices and determinants.</p>
          <p>You should know matrix operations, special types of matrices, determinant computation for small matrices, and the standard algebraic tricks used in exam exercises.</p>`,
        sources:["BAC 2025 (link în set)"]
      },
      {
        id:"bac-analiza",
        grade:"BAC",
        chapter:"Analiză",
        title_ro:"BAC — Limite, derivate",
        title_en:"BAC — Limits, Derivatives",
        tags:["bacalaureat","BAC","analiză"],
        learn_ro:"Vei recapitula limitele uzuale, continuitatea, derivatele și interpretarea lor geometrică sau practică.",
        learn_en:"You will review standard limits, continuity, derivatives, and their geometric or practical meaning.",
        why_ro:"Analiza de BAC este importantă pentru că multe exerciții sunt standard și pot fi rezolvate rapid dacă ai schema potrivită.",
        why_en:"BAC calculus is important because many exercises are standard and can be solved quickly if you know the right method.",
        body_ro:`<p>În această parte apar exerciții despre limite, derivate, monotonia funcțiilor și interpretarea rezultatelor.</p>
          <p><b>Limita</b> descrie comportamentul unei funcții când variabila se apropie de un punct.</p>
          <p><b>Derivata</b> măsoară viteza de variație a funcției și panta tangentei la grafic.</p>
          <p>Pentru BAC, trebuie să recunoști limitele clasice, formulele de derivare și legătura dintre semnul derivatei și monotonia funcției.</p>`,
       body_en:`<p>This lesson reviews the main <b>BAC analysis</b> topics: limits, continuity ideas, derivatives, and standard differentiation rules.</p>
          <p>The focus is on classic patterns that appear often in Romanian high school mathematics exams.</p>`,
        sources:["BAC 2025 (link în set)"]
      },
      {
        id:"adm-ubb",
        grade:"ADM",
        chapter:"UBB",
        title_ro:"Admitere UBB — set mixt (algebră/analiză)",
        title_en:"UBB Admission — Mixed Set (Algebra/Analysis)",
        tags:["admitere","UBB","Cluj"],
        learn_ro:"Vei recapitula stilul problemelor de admitere UBB: idei clasice, calcule rapide, atenție la detalii și combinații între capitole.",
        learn_en:"You will review the style of UBB admission problems: classical ideas, fast calculations, attention to detail, and combinations of topics.",
        why_ro:"Problemele UBB nu cer doar formule, ci și viteză, claritate și atenție foarte bună la condiții.",
        why_en:"UBB problems require not only formulas, but also speed, clarity, and very careful reading of the conditions.",
        body_ro:`<p>Admiterea UBB combină adesea idei din algebră și analiză: progresii, polinoame, funcții, limite, integrale, ecuații sau expresii algebrice.</p>
          <p><b>Cheia</b> este să recunoști rapid tiparul exercițiului și să alegi metoda potrivită, nu să calculezi haotic.</p>
          <p>În multe probleme, primele observații simple fac toată diferența: simetrii, factorizări, formule clasice sau substituții bune.</p>`,
        body_en:`<p>This lesson is a mixed <b>UBB admission</b> overview, combining algebra and analysis patterns that appear frequently in admission-style sets.</p>
          <p>The main goal is to recognize recurring ideas quickly: equations, sums, functions, limits, derivatives, and structured reasoning.</p>`,
        sources:["UBB 2025 (link în set)"]
      },

      /* ——— Cercetare & Istorie ——— */
      {
        id:"hist-gauss",
        grade:"HIST",
        chapter:"Istoria matematicii",
        title_ro:"Carl F. Gauss — „princeps mathematicorum”",
        title_en:"Carl F. Gauss — Princeps Mathematicorum",
        tags:["istorie","Gauss"],
        learn_ro:"Vei afla cine a fost Gauss, de ce este considerat unul dintre cei mai mari matematicieni și ce idei importante a lăsat în urmă.",
        learn_en:"You will learn who Gauss was, why he is considered one of the greatest mathematicians, and what important ideas he left behind.",
        why_ro:"Istoria matematicii te ajută să vezi că formulele nu au apărut din nimic, ci din minți extraordinare și probleme reale.",
        why_en:"The history of mathematics helps you see that formulas did not appear from nowhere, but from extraordinary minds and real problems.",
        body_ro:`<p><b>Carl Friedrich Gauss</b> a fost un matematician german extraordinar, numit adesea <i>princeps mathematicorum</i>, adică „prințul matematicienilor”.</p>
          <p>El a lucrat în foarte multe domenii: teoria numerelor, geometrie, analiză, statistică, astronomie și fizică.</p>
          <p>Una dintre cele mai celebre povești despre Gauss este că, fiind copil, a calculat foarte repede suma numerelor de la 1 la 100, observând o metodă inteligentă de împerechere.</p>
          <p>Gauss a contribuit enorm la teoria numerelor, la metoda celor mai mici pătrate, la studiul magnetismului terestru și la multe alte idei fundamentale.</p>
          <p>Importanța lui nu stă doar în numărul de rezultate, ci și în profunzimea lor: multe concepte moderne pornesc direct din lucrările lui.</p>`,
        body_en:`<p><b>Carl Friedrich Gauss</b> is often called <i>princeps mathematicorum</i>, meaning “the prince of mathematicians”.</p>
          <p>He made major contributions to number theory, algebra, astronomy, geometry, statistics, and physics.</p>
          <p>Among many famous ideas, he worked on congruences, least squares, and the study of Earth’s magnetism.</p>
          <p>Gauss is one of the greatest examples of a mathematician whose work influenced many different branches of science at once.</p>`,
      },

      /* ———  Conjectura lui Collatz ——— */
      {
        id:"res-collatz",
        grade:"RES",
        chapter:"CERCETARE",
        title_ro:"Conjectura lui Collatz — explicație pas cu pas (pentru toți)",
        title_en:"The Collatz Conjecture — a step-by-step explanation",
        tags:["collatz","teoria numerelor","iterare","hailstone","3n+1","sir grindină","research"],
        learn_ro:"Înveți regula „3n+1”, cum se formează șirul (hailstone), ce înseamnă „timp de oprire”, de ce e greu, ce știm și ce nu știm.",
        learn_en:"Understand the 3n+1 rule, hailstone sequence, stopping time, what is known and unknown.",
        why_ro:"Enunț simplu, foarte greu de dovedit. Perfect pentru intuiții numerice.",
        why_en:"Simple to state, fiendishly hard to prove; great for numeric intuition.",
        body_ro:
          `<h3>1) Regula jocului</h3>
          <p>Pentru un număr natural \\(n\\ge1\\): dacă e <b>par</b>, mergi la \\(n/2\\); dacă e <b>impar</b>, mergi la \\(3n+1\\). Repetă.</p>
          <p><b>Conjectura:</b> indiferent de numărul de start, ajungi la \\(1\\), apoi se repetă bucla \\(1\\to4\\to2\\to1\\to\\dots\\).</p>

          <h3>2) Exemple „ca pentru copii”</h3>
          <p>\\(6\\): \\(6\\to3\\to10\\to5\\to16\\to8\\to4\\to2\\to1\\).</p>
          <p>\\(7\\): \\(7\\to22\\to11\\to34\\to17\\to52\\to26\\to13\\to40\\to20\\to10\\to5\\to16\\to8\\to4\\to2\\to1\\).</p>

          <h3>3) De ce „șir grindină”?</h3>
          <p>Uneori urcă (pasul \\(3n+1\\)), apoi coboară mult (împărțiri la 2). Seamănă cu boabele de grindină în urcare/cădere.</p>

          <h3>4) Notarea funcției</h3>
          <p>\\(T(n)=\\begin{cases}n/2,& n \\text{ par}\\\\ 3n+1,& n \\text{ impar}\\end{cases}\\). Secvența este \\(n, T(n), T^{(2)}(n), \\ldots\\).</p>

          <h3>5) Timpi de oprire</h3>
          <ul>
            <li><b>Total</b> \\(\\sigma(n)\\): câți pași până apare pentru prima dată \\(1\\).</li>
            <li><b>Clasic</b> \\(\\tau(n)\\): câți pași până când scade pentru prima oară sub \\(n\\).</li>
          </ul>

          <h3>6) De ce e greu?</h3>
          <ul>
            <li>Pașii impari pot crește mult numărul; cei pari îl reduc—dar alternanța e greu de forțat „să coboare mereu”.</li>
            <li>Nu se știe un <i>invariant</i> simplu care să scadă la fiecare pas pentru toate \\(n\\).</li>
          </ul>

          <h3>7) Ce se știe</h3>
          <ul>
            <li>Nu s-au găsit alte cicluri în afară de \\(4\\to2\\to1\\).</li>
            <li>Verificată pe computer pentru intervale enorme.</li>
            <li>Euristici: „în medie” scade datorită împărțirilor repetate la 2.</li>
          </ul>

          <h3>8) „Comprimarea” pașilor pari</h3>
          <p>Definește \\(S(n)=\\dfrac{3n+1}{2^{v_2(3n+1)}}\\), unde \\(v_2\\) e puterea lui 2 care divide numărul. Aici „înghiți” toate împărțirile la 2 deodată.</p>

          <h3>9) Arbore invers (de la 1 în sus)</h3>
          <p>Din \\(m\\) poți ajunge din \\(2m\\) sau din \\((m-1)/3\\) (când \\(m\\equiv1\\pmod3\\)). Îți arată cât de „densă” e rețeaua preimaginii.</p>

          <h3>10) Starea problemei</h3>
          <p><b>Nedemonstrată</b>. Enunț scurt, profunzime uriașă. Nicio dovadă sau contraexemplu cunoscut.</p>

          <h3>11) Explicația pentru copii</h3>
          <ul>
            <li>Dacă numărul e <b>par</b>, împarte-l la 2.</li>
            <li>Dacă e <b>impar</b>, fă \\(3\\times n + 1\\).</li>
            <li>Repetă. Pare că vei ajunge mereu la 1.</li>
          </ul>

          <h3>12) Joacă-te</h3>
          <ul>
            <li>Calculează pentru toate numerele de la 2 la 20.</li>
            <li>Observă \\(27\\): urcă mult înainte să coboare.</li>
            <li>Compară pașii lui \\(n\\) cu cei ai lui \\(n+1\\).</li>
          </ul>
        `,
        body_en:`<h3>1) The rule of the game</h3>
          <p>Start with a natural number \\(n\\ge1\\). If it is <b>even</b>, go to \\(n/2\\). If it is <b>odd</b>, go to \\(3n+1\\). Then repeat.</p>
          <p><b>The conjecture:</b> no matter which positive integer you start from, the sequence eventually reaches \\(1\\), and then falls into the loop \\(1\\to4\\to2\\to1\\to\\dots\\).</p>

          <h3>2) Small examples</h3>
          <p>For \\(6\\): \\(6\\to3\\to10\\to5\\to16\\to8\\to4\\to2\\to1\\).</p>
          <p>For \\(7\\): \\(7\\to22\\to11\\to34\\to17\\to52\\to26\\to13\\to40\\to20\\to10\\to5\\to16\\to8\\to4\\to2\\to1\\).</p>

          <h3>3) Why is it called the hailstone sequence?</h3>
          <p>The sequence can rise and fall many times, like hailstones going up and down in a cloud.</p>

          <h3>4) Function notation</h3>
          <p>\\[
          T(n)=\\begin{cases}
          n/2,& n \\text{ even}\\\\
          3n+1,& n \\text{ odd}
          \\end{cases}
          \\]</p>

          <h3>5) Stopping times</h3>
          <ul>
            <li><b>Total stopping time</b>: number of steps until 1 first appears.</li>
            <li><b>Classical stopping time</b>: number of steps until the value first becomes smaller than the starting number.</li>
          </ul>

          <h3>6) Why is it hard?</h3>
          <ul>
            <li>Odd steps may increase the value a lot.</li>
            <li>Even steps decrease it, but the full pattern is hard to control.</li>
            <li>No simple invariant is known to always decrease.</li>
          </ul>

          <h3>7) What is known</h3>
          <ul>
            <li>No nontrivial cycle has ever been found.</li>
            <li>The conjecture has been checked by computer for extremely large ranges.</li>
            <li>It still has no complete proof.</li>
          </ul>

          <h3>8) Current status</h3>
          <p>The Collatz conjecture is still open. It is famous because it is very easy to state and extremely hard to prove.</p>,
          <li>\\(6\\to3\\to10\\to5\\to16\\to8\\to4\\to2\\to1\\).</li>
          <li>\\(7\\) are \\(16\\) pași până la \\(1\\).</li>
          <li>Secvența finală universală: \\(4,2,1\\).</li>
        </ol>`,
        examples_en:`<ol><li>6 → 1; 7 → 1 has 16 steps; final loop 4–2–1.</li></ol>`,
        sources:["Collatz (3n+1) — prezentare educativă"]
      }
    ],

    problems:[

      /** PENTRU PROBLEME DE ANTRENAMENT **/

      { id:"v-cit-00", lessonId:"v-citirea-nr-nat", difficulty:0,
        title_ro:"Cifra sutelor", title_en:"Hundreds digit (easy)",
        statement_ro:"În numărul \\(582\\), cifra sutelor este?",
        statement_en:"In the number \\(582\\), what is the hundreds digit?",
        answer:"5", source:"Set creat",
        hint1_ro:"Unități, zeci, sute (de la dreapta).", hint1_en:"Ones, tens, hundreds (from the right)." },

      { id:"v-cit-01", lessonId:"v-citirea-nr-nat", difficulty:1,
        title_ro:"Formă extinsă 4070302", title_en:"Expanded form 4070302",
        statement_ro:"Scrie în formă extinsă: \\(4\\,070\\,302\\). (folosește +)",
        statement_en:"Write the expanded form of \\(4\\,070\\,302\\). (use +)",
        answer:"4000000+70000+300+2", source:"Set creat",
        hint1_ro:"Notează contribuțiile \\(10^k\\).", hint1_en:"Write contributions of \\(10^k\\)." },

      { id:"v-cit-02", lessonId:"v-citirea-nr-nat", difficulty:1,
        title_ro:"Din cuvinte la număr", title_en:"Words → number",
        statement_ro:"Scrie ca număr: “trei milioane două sute patruzeci de mii și șapte”.",
        statement_en:"Write as a number: “three million two hundred forty thousand seven”.",
        answer:"3240007", source:"Set creat",
        hint1_ro:"3 000 000 + 240 000 + 7.", hint1_en:"3,000,000 + 240,000 + 7." },

      { id:"v-cit-03", lessonId:"v-citirea-nr-nat", difficulty:1,
        title_ro:"Câte perioade?", title_en:"How many periods?",
        statement_ro:"Câte perioade (grupuri de 3 cifre) are \\(123\\,456\\,789\\)?",
        statement_en:"How many 3-digit periods does \\(123\\,456\\,789\\) have?",
        answer:"3", source:"Set creat",
        hint1_ro:"Numără grupurile separate de spațiu.", hint1_en:"Count the 3-digit groups." },

      { id:"v-cit-04", lessonId:"v-citirea-nr-nat", difficulty:2,
        title_ro:"Care e mai mare?", title_en:"Which is larger?",
        statement_ro:"Care este mai mare: \\(1\\,000\\,000\\) sau \\(999\\,999\\)? (scrie numărul)",
        statement_en:"Which is larger: \\(1\\,000\\,000\\) or \\(999\\,999\\)? (write the number)",
        answer:"1000000", source:"Set creat",
        hint1_ro:"Compară numărul de cifre.", hint1_en:"Compare the number of digits." },

      { id:"v-cit-05", lessonId:"v-citirea-nr-nat", difficulty:2,
        title_ro:"Valoarea cifrei", title_en:"Place value",
        statement_ro:"Ce valoare are cifra 4 în \\(3\\,040\\,120\\)?",
        statement_en:"What is the value of digit 4 in \\(3\\,040\\,120\\)?",
        answer:"40000", source:"Set creat",
        hint1_ro:"Este pe poziția zeci de mii.", hint1_en:"It is in the ten-thousands place." },

      { id:"v-cit-06", lessonId:"v-citirea-nr-nat", difficulty:2,
        title_ro:"Cel mai mic număr din cifre", title_en:"Smallest number from digits",
        statement_ro:"Din cifrele {4,0,7,0,3} formează cel mai mic număr de 5 cifre (nu începe cu 0).",
        statement_en:"From digits {4,0,7,0,3} build the smallest 5-digit number (no leading 0).",
        answer:"30047", source:"Set creat",
        hint1_ro:"Pune cea mai mică cifră nenulă prima, apoi zerourile.", hint1_en:"Put the smallest non-zero first, then zeros." },

      { id:"v-cit-07", lessonId:"v-citirea-nr-nat", difficulty:2,
        title_ro:"Rotunjire la suta de mii", title_en:"Round to hundred-thousands",
        statement_ro:"Rotunjește \\(3\\,478\\,251\\) la suta de mii.",
        statement_en:"Round \\(3\\,478\\,251\\) to the hundred-thousands.",
        answer:"3500000", source:"Set creat",
        hint1_ro:"Privește zecile de mii (78 251 ≥ 50 000).", hint1_en:"Look at the ten-thousands (≥ 50,000)." },

      { id:"v-cit-08", lessonId:"v-citirea-nr-nat", difficulty:1,
        title_ro:"Câte zerouri?", title_en:"How many zeros?",
        statement_ro:"Câte zerouri are \\(100000000\\)? (scrie un număr)",
        statement_en:"How many zeros does \\(10^8\\) have?",
        answer:"8", source:"Set creat",
        hint1_ro:"\\(10^n\\) are n zerouri.", hint1_en:"\\(10^n\\) has n zeros." },

      { id:"v-cit-09", lessonId:"v-citirea-nr-nat", difficulty:1,
        title_ro:"Numere impare între 50 și 89", title_en:"Odd numbers between 50 and 89",
        statement_ro:"Câte numere naturale impare se află cuprinse între 50 și 89 (incluzându-le și pe ele)?",
        statement_en:"How many odd integers are there from 50 to 89 inclusive?",
        answer:"20", source:"Set creat",
        hint1_ro:"Numără din 2 în 2 pornind de la 51.", hint1_en:"Count by 2 starting at 51." },  

      { id:"v-cit-10", lessonId:"v-citirea-nr-nat", difficulty:3,
        title_ro:"Numere impare între 23 și 1006", title_en:"Odd numbers between 23 and 1006",
        statement_ro:"Câte numere naturale impare se află cuprinse între 23 și 1006 (incluzându-le și pe ele)?",
        statement_en:"How many odd integers are there from 23 to 1006 inclusive?",
        answer:"489", source:"Set creat",
        hint1_ro:"Folosește formula: \\(\\lfloor\\tfrac{b+1}{2}\\rfloor-\\lfloor\\tfrac{a}{2}\\rfloor\\).", 
        hint1_en:"Use: ⌊(b+1)/2⌋ − ⌊a/2⌋ (with a=23, b=1006)."},  

      /* ——— problemă la aducerea același numitor ——— */
      {id:"pv-f-2",lessonId:"v-frac",difficulty:2,title_ro:"Aducere la același numitor",
      title_en:"Common denominator",
      statement_ro:"\\(\\frac{3}{4}+\\frac{1}{6}=\\ ?\\) (a/b)",
      statement_en:"\\(\\frac{3}{4}+\\frac{1}{6}= ?\\) (a/b)",
      answer:"11/12", source:"Set creat",
      hint1_ro:"Adu la același numitor (CMMMC).",
      hint1_en:"Use a common denominator (LCM).",
      hint2_ro:"CMMMC(4,6)=12 → transformă la /12.",
      hint2_en:"LCM(4,6)=12 → convert to /12."},

      /* ——— EN/BAC/ADM ——— */
      {id:"en25-1",lessonId:"en-alg",difficulty:2,title_ro:"Fracție + procent",title_en:"Fraction + percent",
        statement_ro:"\\(\\tfrac{3}{5}\\) rezolvate, apoi 20% din rest. Total?",
        statement_en:"\\(\\tfrac{3}{5}\\) solved, then 20% of the rest. Total?",
        answer:"4/5", source:"EN 2025 — format inspirat"},
      {id:"en25-2",lessonId:"en-geo",difficulty:2,title_ro:"Unghiuri adiacente",title_en:"Adjacent angles",
        statement_ro:"\\(\\angle AOB=35^\\circ\\) adiacent cu \\(\\angle BOC\\). Găsește \\(\\angle BOC\\).",
        statement_en:"\\(\\angle AOB=35^\\circ\\), adjacent to \\(\\angle BOC\\). Find \\(\\angle BOC\\).",
        answer:"145", source:"EN 2025 — format inspirat"},
      {id:"bac25-1",lessonId:"bac-alg",difficulty:3,title_ro:"Determinant 3×3",title_en:"3×3 determinant",
        statement_ro:"\\(\\det\\begin{pmatrix}1&1&1\\\\1&2&3\\\\1&3&6\\end{pmatrix}= ?\\)",
        statement_en:"Compute \\(\\det\\begin{pmatrix}1&1&1\\\\1&2&3\\\\1&3&6\\end{pmatrix}\\).",
        answer:"1", source:"BAC 2025 — format inspirat"},
      {id:"bac25-2",lessonId:"bac-analiza",difficulty:2,title_ro:"Limită clasică",title_en:"Classic limit",
        statement_ro:"\\(\\lim\\limits_{x\\to 0}\\frac{\\sin x}{x}= ?\\)",
        statement_en:"\\(\\lim_{x\\to 0}\\frac{\\sin x}{x}= ?\\)",
        answer:"1", source:"BAC 2025 — format inspirat"},
      {id:"adm25-1",lessonId:"adm-ubb",difficulty:3,title_ro:"Sumă în PA",title_en:"AP sum",
        statement_ro:"\\(a_1=5\\), \\(d=2\\), calculați \\(S_{30}\\).",
        statement_en:"\\(a_1=5\\), \\(d=2\\). Compute \\(S_{30}\\).",
        answer:"1020", source:"UBB 2025 — format inspirat"},

      /* ——— Suma lui Gauss ——— */
      { id:"v-gauss-00", lessonId:"v-suma-gauss", difficulty:1,
        title_ro:"1+…+100", title_en:"1+…+100",
        statement_ro:"Calculează \\(1+2+\\cdots+100\\).", statement_en:"Compute \\(1+2+\\cdots+100\\).",
        answer:"5050", source:"Gauss",
        hint1_ro:"Folosește formula \\(n(n+1)/2\\).", hint2_ro:"\\(100\\cdot 101/2\\)."},
      { id:"v-gauss-01", lessonId:"v-suma-gauss", difficulty:2,
        title_ro:"20…80", title_en:"20…80",
        statement_ro:"Calculează \\(20+21+\\cdots+80\\). (număr)",
        statement_en:"Compute \\(20+21+\\cdots+80\\).",
        answer:"3050", source:"Set creat",
        hint1_ro:"Număr de termeni: \\(b-a+1\\).", hint2_ro:"Media: \\((a+b)/2\\)."},
      { id:"v-gauss-02", lessonId:"v-suma-gauss", difficulty:2,
        title_ro:"Primele 50 pare", title_en:"First 50 evens",
        statement_ro:"Suma primelor 50 numere pare (2,4,…).",
        statement_en:"Sum of first 50 even numbers.",
        answer:"2550", source:"Set creat",
        hint1_ro:"\\(2(1+\\cdots+50)\\).", hint2_ro:"Sau \\(n(n+1)\\)."},
      { id:"v-gauss-03", lessonId:"v-suma-gauss", difficulty:3,
        title_ro:"Primele 37 impare", title_en:"First 37 odds",
        statement_ro:"Suma primelor 37 numere impare.",
        statement_en:"Sum of first 37 odd numbers.",
        answer:"1369", source:"Set creat",
        hint1_ro:"\\(1+3+\\cdots+(2n-1)=n^2\\).", hint2_ro:"\\(37^2\\)."},
      { id:"v-gauss-04", lessonId:"v-suma-gauss", difficulty:3,
        title_ro:"AP: a1=7, d=3, n=40", title_en:"AP sum",
        statement_ro:"\\(a_1=7\\), \\(d=3\\). Calculează \\(S_{40}\\).",
        statement_en:"\\(a_1=7, d=3\\). Compute \\(S_{40}\\).",
        answer:"2620", source:"Set creat",
        hint1_ro:"\\(S_n=\\frac{n}{2}(2a_1+(n-1)d)\\).", hint2_ro:"\\(20\\cdot(14+117)\\)."},
      { id:"v-gauss-05", lessonId:"v-suma-gauss", difficulty:3,
        title_ro:"Găsește x", title_en:"Find x",
        statement_ro:"Găsește \\(x\\) astfel încât \\(1+2+\\cdots+x=465\\).",
        statement_en:"Find \\(x\\) with \\(1+2+\\cdots+x=465\\).",
        answer:"30", source:"Set creat",
        hint1_ro:"\\(x(x+1)/2=465\\).", hint2_ro:"Discriminant \\(=61^2\\)."},
      { id:"v-gauss-06", lessonId:"v-suma-gauss", difficulty:2,
        title_ro:"100…999", title_en:"100…999",
        statement_ro:"Suma tuturor numerelor între 100 și 999 (inclusiv).",
        statement_en:"Sum of all integers from 100 to 999 inclusive.",
        answer:"494550", source:"Set creat",
        hint1_ro:"\\((b-a+1)\\cdot\\frac{a+b}{2}\\).", hint2_ro:"\\(900\\cdot 549{,}5\\)."},
      { id:"v-gauss-07", lessonId:"v-suma-gauss", difficulty:3,
        title_ro:"Egalitate sumă", title_en:"Sum equality",
        statement_ro:"Determină \\(n\\) astfel încât \\(1+2+\\cdots+n=2016\\).",
        statement_en:"Find n with \\(1+2+\\cdots+n=2016\\).",
        answer:"63", source:"Set creat",
        hint1_ro:"\\(n(n+1)=4032\\).", hint2_ro:"Verifică \\(63\\)."},
      { id:"v-gauss-09", lessonId:"v-suma-gauss", difficulty:1,
        title_ro:"-50…50", title_en:"-50…50",
        statement_ro:"Suma numerelor întregi de la \\(-50\\) la \\(50\\).",
        statement_en:"Sum of integers from -50 to 50.",
        answer:"0", source:"Set creat",
        hint1_ro:"Pereche \\(k+(-k)=0\\).", hint2_ro:"Rămâne 0."},

      /* ——— Metoda reducerii la unitate ——— */
      { id:"v-mru-00", lessonId:"v-metode-reducerii-la-unitate", difficulty:1,
        title_ro:"Caiete", title_en:"Notebooks",
        statement_ro:"12 caiete costă 30 lei. Cât costă 20 caiete? (număr, fără unități)",
        statement_en:"12 notebooks cost 30 lei. Price for 20?",
        answer:"50", source:"Set creat",
        hint1_ro:"1 caiet = 30/12.", hint2_ro:"Înmulțește cu 20."},
      { id:"v-mru-01", lessonId:"v-metode-reducerii-la-unitate", difficulty:2,
        title_ro:"Mere", title_en:"Apples",
        statement_ro:"5 kg mere = 27,5 lei. Cât costă 8 kg? (număr)",
        statement_en:"5 kg apples cost 27.5 lei. Cost of 8 kg?",
        answer:"44", source:"Set creat",
        hint1_ro:"1 kg = 27,5/5.", hint2_ro:"×8."},
      { id:"v-mru-02", lessonId:"v-metode-reducerii-la-unitate", difficulty:1,
        title_ro:"Viteză", title_en:"Speed",
        statement_ro:"O mașină parcurge 180 km în 3 h. Care e viteza medie (km/h)? (număr)",
        statement_en:"Car travels 180 km in 3 h. Average speed?",
        answer:"60", source:"Set creat",
        hint1_ro:"km pe oră = 180/3.", hint2_ro:"60."},
      { id:"v-mru-03", lessonId:"v-metode-reducerii-la-unitate", difficulty:3,
        title_ro:"Muncitori", title_en:"Workers",
        statement_ro:"1 muncitor face o lucrare în 10 zile. Câte zile îi trebuie la 5 muncitori? (număr)",
        statement_en:"1 worker finishes in 10 days. How many days for 5 workers?",
        answer:"2", source:"Set creat",
        hint1_ro:"Rată: 1/10 lucrări/zi.", hint2_ro:"5× rata ⇒ 1/2/zi ⇒ 2 zile."},
      { id:"v-mru-04", lessonId:"v-metode-reducerii-la-unitate", difficulty:2,
        title_ro:"Piese", title_en:"Items",
        statement_ro:"Echipa face 120 piese în 8 ore. Câte în 5 ore? (număr)",
        statement_en:"120 items in 8 hours. Items in 5 hours?",
        answer:"75", source:"Set creat",
        hint1_ro:"Pe oră: 15.", hint2_ro:"×5."},
      { id:"v-mru-05", lessonId:"v-metode-reducerii-la-unitate", difficulty:3,
        title_ro:"Robinete", title_en:"Faucets",
        statement_ro:"3 robinete umplu un rezervor în 12 min. În câte minute 4 robinete identice? (număr)",
        statement_en:"3 faucets fill tank in 12 min. Time with 4?",
        answer:"9", source:"Set creat",
        hint1_ro:"1 robinet: 36 min.", hint2_ro:"4 robinete: 9 min."},
      { id:"v-mru-06", lessonId:"v-metode-reducerii-la-unitate", difficulty:2,
        title_ro:"Greutate caiete", title_en:"Notebook mass",
        statement_ro:"7 caiete cântăresc 980 g. Cât cântăresc 15 caiete? (g)",
        statement_en:"7 notebooks weigh 980 g. Mass of 15?",
        answer:"2100", source:"Set creat",
        hint1_ro:"1 caiet: 140 g.", hint2_ro:"×15."},
      { id:"v-mru-07", lessonId:"v-metode-reducerii-la-unitate", difficulty:2,
        title_ro:"Buget pahare", title_en:"Glasses",
        statement_ro:"24 pahare costă 72 lei. Câte pahare cumperi cu 45 lei? (număr)",
        statement_en:"24 glasses cost 72 lei. How many for 45 lei?",
        answer:"15", source:"Set creat",
        hint1_ro:"1 pahar=3 lei.", hint2_ro:"45/3."},

      /* ——— Divizibilitate ——— */
      { id:"v-div-00", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:1,
        title_ro:"CMMDC simplu", title_en:"Easy GCD",
        statement_ro:"Calculează \\(\\gcd(84,30)\\).", statement_en:"Compute \\(\\gcd(84,30)\\).",
        answer:"6", source:"Set creat",
        hint1_ro:"Descompune în primi.", hint2_ro:"Alege minimele exponenților."},
      { id:"v-div-01", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:1,
        title_ro:"CMMMC simplu", title_en:"Easy LCM",
        statement_ro:"Calculează \\(\\operatorname{lcm}(12,18)\\).", statement_en:"Compute \\(\\operatorname{lcm}(12,18)\\).",
        answer:"36", source:"Set creat",
        hint1_ro:"Maximele exponenților.", hint2_ro:"36."},
      { id:"v-div-02", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:1,
        title_ro:"Multiplu comun mic", title_en:"Small common multiple",
        statement_ro:"Cel mai mic multiplu comun al lui 2,3,5.", statement_en:"LCM of 2,3,5.",
        answer:"30", source:"Set creat",
        hint1_ro:"Numere coprime.", hint2_ro:"2·3·5."},
      { id:"v-div-03", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:2,
        title_ro:"GCD din puteri", title_en:"GCD from powers",
        statement_ro:"\\(a=2^3\\cdot3^4\\), \\(b=2^5\\cdot3^2\\). Găsește \\(\\gcd(a,b)\\).",
        statement_en:"Find GCD of a and b as given.",
        answer:"72", source:"Set creat",
        hint1_ro:"Min(3,5)=3; Min(4,2)=2.", hint2_ro:"\\(2^3\\cdot3^2\\)."},
      { id:"v-div-04", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:2,
        title_ro:"Divizori 360", title_en:"Divisors of 360",
        statement_ro:"Câți divizori are \\(360\\)? (număr)",
        statement_en:"How many divisors does 360 have?",
        answer:"24", source:"Set creat",
        hint1_ro:"\\(360=2^3\\cdot3^2\\cdot5\\).", hint2_ro:"(3+1)(2+1)(1+1)."},
      { id:"v-div-05", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:3,
        title_ro:"Multiplu 2 și 7", title_en:"Multiple of 2 and 7",
        statement_ro:"Cel mai mic \\(x\\) astfel încât \\(45x\\) e divizibil cu 2 și 7. (număr)",
        statement_en:"Smallest x so that 45x is divisible by 2 and 7.",
        answer:"14", source:"Set creat",
        hint1_ro:"45=3^2·5 → ai nevoie de 2 și 7.", hint2_ro:"x=14."},
      { id:"v-div-06", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:4,
        title_ro:"3 cifre divizibile cu 9", title_en:"3-digit multiples of 9",
        statement_ro:"Câte numere de 3 cifre sunt divizibile cu 9? (număr)",
        statement_en:"How many 3-digit numbers are divisible by 9?",
        answer:"100", source:"Set creat",
        hint1_ro:"De la 108 la 999 din 9 în 9.", hint2_ro:"\\(111-12+1\\)."},
      { id:"v-div-07", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:2,
        title_ro:"Divisibil cu 9 și 10", title_en:"Divisible by 9 and 10",
        statement_ro:"Cel mai mic număr pozitiv care se termină în 0 și e divizibil cu 9.",
        statement_en:"Smallest positive integer ending with 0 and divisible by 9.",
        answer:"90", source:"Set creat",
        hint1_ro:"LCM(9,10).", hint2_ro:"90."},
      { id:"v-div-08", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:3,
        title_ro:"Număr de divizori", title_en:"Divisors count",
        statement_ro:"Pentru \\(n=2^4\\cdot3^3\\cdot5\\), calculează \\(d(n)\\).",
        statement_en:"For n=2^4*3^3*5, compute d(n).",
        answer:"40", source:"Set creat",
        hint1_ro:"(4+1)(3+1)(1+1).", hint2_ro:"=40."},
      { id:"v-div-09", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:1,
        title_ro:"Test 8", title_en:"Rule for 8",
        statement_ro:"Este \\(56\\,000\\) divizibil cu 8? Scrie 1 pt da, 0 pt nu.",
        statement_en:"Is 56,000 divisible by 8? Write 1 for yes, 0 for no.",
        answer:"1", source:"Set creat",
        hint1_ro:"Ultimele 3 cifre.", hint2_ro:"000 → da."},
      { id:"v-div-10", lessonId:"v-divizibilitatea-numerelor-naturale", difficulty:2,
        title_ro:"Rest la 3", title_en:"Remainder mod 3",
        statement_ro:"Restul împărțirii lui \\(10^3\\) la 3.",
        statement_en:"Remainder of 10^3 mod 3.",
        answer:"1", source:"Set creat",
        hint1_ro:"10≡1 (mod 3).", hint2_ro:"1^3."},

      /* ——— Fracții ordinare ——— */
      { id:"v-fo-00", lessonId:"v-frac-ord", difficulty:1,
        title_ro:"Simplifică", title_en:"Reduce",
        statement_ro:"Reduce la forma ireductibilă: \\(\\dfrac{15}{35}\\). (a/b)",
        statement_en:"Reduce 15/35 to simplest form (a/b).",
        answer:"3/7", source:"Set creat",
        hint1_ro:"Împarte la 5.", hint2_ro:"3/7."},
      { id:"v-fo-01", lessonId:"v-frac-ord", difficulty:1,
        title_ro:"Completează x", title_en:"Find x",
        statement_ro:"Găsește \\(x\\) dacă \\(\\dfrac{3}{4}=\\dfrac{x}{20}\\). (număr)",
        statement_en:"Find x with 3/4 = x/20.",
        answer:"15", source:"Set creat",
        hint1_ro:"Înmulțește cu 5.", hint2_ro:"x=15."},
      { id:"v-fo-02", lessonId:"v-frac-ord", difficulty:2,
        title_ro:"Sumă", title_en:"Sum",
        statement_ro:"\\(\\dfrac{2}{3}+\\dfrac{5}{12}=\\ ?\\) (a/b)",
        statement_en:"2/3 + 5/12 = ? (a/b)",
        answer:"13/12", source:"Set creat",
        hint1_ro:"CMMMC(3,12)=12.", hint2_ro:"8/12+5/12."},
      { id:"v-fo-03", lessonId:"v-frac-ord", difficulty:2,
        title_ro:"Diferență", title_en:"Difference",
        statement_ro:"\\(\\dfrac{5}{6}-\\dfrac{1}{4}=\\ ?\\) (a/b)",
        statement_en:"5/6 - 1/4 = ? (a/b)",
        answer:"7/12", source:"Set creat",
        hint1_ro:"CMMMC(6,4)=12.", hint2_ro:"10/12-3/12."},
      { id:"v-fo-04", lessonId:"v-frac-ord", difficulty:2,
        title_ro:"Aducere și reducere", title_en:"Bring & reduce",
        statement_ro:"\\(\\dfrac{7}{8}+\\dfrac{3}{8}=\\ ?\\) (formă ireductibilă)",
        statement_en:"7/8 + 3/8 = ? (simplest)",
        answer:"5/4", source:"Set creat",
        hint1_ro:"10/8=5/4.", hint2_ro:"Împarte la 2."},
      { id:"v-fo-05", lessonId:"v-frac-ord", difficulty:1,
        title_ro:"Scădere ușoară", title_en:"Easy subtract",
        statement_ro:"\\(\\dfrac{9}{10}-\\dfrac{3}{5}=\\ ?\\) (a/b)",
        statement_en:"9/10 - 3/5 = ?",
        answer:"3/10", source:"Set creat",
        hint1_ro:"3/5=6/10.", hint2_ro:"9/10-6/10."},
      { id:"v-fo-06", lessonId:"v-frac-ord", difficulty:1,
        title_ro:"Ireductibil", title_en:"Irreducible",
        statement_ro:"Reduce: \\(\\dfrac{4}{6}\\). (a/b)",
        statement_en:"Reduce 4/6.",
        answer:"2/3", source:"Set creat",
        hint1_ro:"Împarte la 2.", hint2_ro:"Apoi verifică la 3."},
      { id:"v-fo-07", lessonId:"v-frac-ord", difficulty:4,
        title_ro:"Fracții egale cu x", title_en:"Equal fractions with x",
        statement_ro:"Găsește \\(x\\) astfel încât \\(\\dfrac{2}{3}=\\dfrac{x+1}{x+4}\\).",
        statement_en:"Find x such that 2/3 = (x+1)/(x+4).",
        answer:"5", source:"Set creat",
        hint1_ro:"Produs în cruce.", hint2_ro:"2(x+4)=3(x+1)."},
      { id:"v-fo-08", lessonId:"v-frac-ord", difficulty:3,
        title_ro:"Sarcină amestec", title_en:"Mix",
        statement_ro:"\\(\\dfrac{5}{12}+\\dfrac{7}{18}-\\dfrac{1}{9}=\\ ?\\) (a/b)",
        statement_en:"5/12 + 7/18 - 1/9 = ?",
        answer:"29/36", source:"Set creat",
        hint1_ro:"CMMMC(12,18,9)=36.", hint2_ro:"Transformă la /36."},
      { id:"v-fo-09", lessonId:"v-frac-ord", difficulty:2,
        title_ro:"Unde e greșeala?", title_en:"Spot the error",
        statement_ro:"Cineva zice: \\(\\dfrac{a}{b}+\\dfrac{c}{b}=\\dfrac{a+c}{2b}\\). Corect? Scrie 1 dacă <i>nu</i>, 0 dacă da.",
        statement_en:"Someone says (a/b)+(c/b)=(a+c)/(2b). Correct? Write 1 if NO, 0 if yes.",
        answer:"1", source:"Set creat",
        hint1_ro:"Numitorul rămâne b.", hint2_ro:"Corect e (a+c)/b."},

      /* ——— Fracții zecimale ——— */
      { id:"v-fz-00", lessonId:"v-frac-scriere", difficulty:1,
        title_ro:"37/1000", title_en:"37/1000",
        statement_ro:"Scrie ca zecimal: \\(\\dfrac{37}{1000}\\).", statement_en:"Write 37/1000 as decimal.",
        answer:"0.037", source:"Set creat",
        hint1_ro:"3 zecimale.", hint2_ro:"0,037."},
      { id:"v-fz-01", lessonId:"v-frac-scriere", difficulty:1,
        title_ro:"5/100", title_en:"5/100",
        statement_ro:"Scrie ca zecimal: \\(\\dfrac{5}{100}\\).", statement_en:"Write 5/100 as decimal.",
        answer:"0.05", source:"Set creat",
        hint1_ro:"2 zecimale.", hint2_ro:"0,05."},
      { id:"v-fz-02", lessonId:"v-frac-scriere", difficulty:2,
        title_ro:"Fracție din zecimal", title_en:"Fraction from decimal",
        statement_ro:"Scrie în formă ireductibilă: \\(0{,}304\\). (a/b)",
        statement_en:"Write 0.304 as simplest fraction (a/b).",
        answer:"38/125", source:"Set creat",
        hint1_ro:"304/1000.", hint2_ro:"Împarte la 8."},
      { id:"v-fz-03", lessonId:"v-frac-scriere", difficulty:1,
        title_ro:"Adunare zecimale", title_en:"Decimal sum",
        statement_ro:"\\(0{,}7+0{,}08+0{,}006=\\ ?\\)", statement_en:"0.7+0.08+0.006 = ?",
        answer:"0.786", source:"Set creat",
        hint1_ro:"Aliniază virgula.", hint2_ro:"Completează cu zerouri."},
      { id:"v-fz-04", lessonId:"v-frac-scriere", difficulty:2,
        title_ro:"Rotunjire", title_en:"Rounding",
        statement_ro:"Rotunjește la sutimi: \\(12{,}345\\).", statement_en:"Round 12.345 to hundredths.",
        answer:"12.35", source:"Set creat",
        hint1_ro:"Privește a treia zecimală.", hint2_ro:"≥5 crești."},
      { id:"v-fz-05", lessonId:"v-frac-scriere", difficulty:2,
        title_ro:"7/8 zecimal", title_en:"7/8 decimal",
        statement_ro:"Scrie zecimal: \\(\\dfrac{7}{8}\\).", statement_en:"Write 7/8 as decimal.",
        answer:"0.875", source:"Set creat",
        hint1_ro:"×125 sus/jos.", hint2_ro:"=875/1000."},
      { id:"v-fz-06", lessonId:"v-frac-scriere", difficulty:2,
        title_ro:"3/40 zecimal", title_en:"3/40 decimal",
        statement_ro:"Scrie zecimal: \\(\\dfrac{3}{40}\\).", statement_en:"Write 3/40 as decimal.",
        answer:"0.075", source:"Set creat",
        hint1_ro:"×25 sus/jos.", hint2_ro:"=75/1000."},
      { id:"v-fz-07", lessonId:"v-frac-scriere", difficulty:3,
        title_ro:"Zecimi din 2,5", title_en:"Tenths in 2.5",
        statement_ro:"Completează: \\(2{,}5=\\ ?\\) zecimi. (număr)",
        statement_en:"Fill: 2.5 = ? tenths.",
        answer:"25", source:"Set creat",
        hint1_ro:"1 zecime = 0,1.", hint2_ro:"2,5 / 0,1."},

      /* ——— Elemente de geometrie ——— */
      { id:"v-geo-00", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Prin două puncte", title_en:"Through two points",
        statement_ro:"Câte drepte trec prin două puncte distincte? (număr)",
        statement_en:"How many lines through two distinct points?",
        answer:"1", source:"Set creat",
        hint1_ro:"Axiomă de bază.", hint2_ro:"Unică."},
      { id:"v-geo-01", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Paralele", title_en:"Parallels",
        statement_ro:"Câte puncte comune au două drepte paralele? (număr)",
        statement_en:"How many common points do two parallel lines have?",
        answer:"0", source:"Set creat",
        hint1_ro:"Definiție.", hint2_ro:"Niciunul."},
      { id:"v-geo-02", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Intersecție maximă", title_en:"Max intersection",
        statement_ro:"Maxim câte puncte comune pot avea două drepte diferite din plan? (număr)",
        statement_en:"Max number of common points of two distinct lines in a plane?",
        answer:"1", source:"Set creat",
        hint1_ro:"Paralele vs secante.", hint2_ro:"Secante → 1."},
      { id:"v-geo-03", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"A+B=C", title_en:"Segment add.",
        statement_ro:"Pe aceeași dreaptă, B între A și C. Dacă \\(AB=5\\), \\(BC=7\\), cât e \\(AC\\)?",
        statement_en:"On the same line, B between A and C. AB=5, BC=7. Find AC.",
        answer:"12", source:"Set creat",
        hint1_ro:"AC=AB+BC.", hint2_ro:"=12."},
      { id:"v-geo-04", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Mijloc", title_en:"Midpoint",
        statement_ro:"M este mijlocul lui AB și \\(AM=9\\). Cât e \\(AB\\)?",
        statement_en:"M is midpoint of AB; AM=9. Find AB.",
        answer:"18", source:"Set creat",
        hint1_ro:"AM=MB.", hint2_ro:"AB=2·AM."},
      { id:"v-geo-05", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Unghiuri", title_en:"Angles",
        statement_ro:"Două drepte secante formează câte unghiuri? (număr)",
        statement_en:"How many angles do two intersecting lines form?",
        answer:"4", source:"Set creat",
        hint1_ro:"Vizualizează X.", hint2_ro:"4."},
      { id:"v-geo-06", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Suma unghiuri triunghi", title_en:"Triangle sum",
        statement_ro:"Suma unghiurilor interioare într-un triunghi (grade).",
        statement_en:"Sum of interior angles in a triangle (degrees).",
        answer:"180", source:"Set creat",
        hint1_ro:"Faimoasa 180°.", hint2_ro:"Liniile paralele justifică."},
      { id:"v-geo-07", lessonId:"v-elem-geo", difficulty:1,
        title_ro:"Unghi drept", title_en:"Right angle",
        statement_ro:"Câte grade are un unghi drept? (număr)",
        statement_en:"How many degrees in a right angle?",
        answer:"90", source:"Set creat",
        hint1_ro:"Perpendiculare.", hint2_ro:"90."},

      /* ——— Unități de măsură ——— */
      { id:"v-unit-00", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"m → mm", title_en:"m→mm",
        statement_ro:"Transformă: \\(2{,}5\\,\\text{m}=\\ ?\\,\\text{mm}\\). (număr)",
        statement_en:"2.5 m = ? mm.",
        answer:"2500", source:"Set creat",
        hint1_ro:"1 m = 1000 mm.", hint2_ro:"×1000."},
      { id:"v-unit-01", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"dm → cm", title_en:"dm→cm",
        statement_ro:"\\(7\\,\\text{dm}=\\ ?\\,\\text{cm}\\).", statement_en:"7 dm = ? cm.",
        answer:"70", source:"Set creat",
        hint1_ro:"1 dm=10 cm.", hint2_ro:"×10."},
      { id:"v-unit-02", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"km → m", title_en:"km→m",
        statement_ro:"\\(3{,}2\\,\\text{km}=\\ ?\\,\\text{m}\\).", statement_en:"3.2 km = ? m.",
        answer:"3200", source:"Set creat",
        hint1_ro:"×1000.", hint2_ro:"=3200."},
      { id:"v-unit-03", lessonId:"v-unit-de-masură", difficulty:2,
        title_ro:"cm → m", title_en:"cm→m",
        statement_ro:"\\(450\\,\\text{cm}=\\ ?\\,\\text{m}\\). (cu punct zecimal)",
        statement_en:"450 cm = ? m (decimal).",
        answer:"4.5", source:"Set creat",
        hint1_ro:"/100.", hint2_ro:"=4,5 m."},
      { id:"v-unit-04", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"Perimetru pătrat", title_en:"Square perimeter",
        statement_ro:"Pătrat cu latura 7 cm ⇒ perimetru? (număr)",
        statement_en:"Square side 7 cm: perimeter?",
        answer:"28", source:"Set creat",
        hint1_ro:"P=4a.", hint2_ro:"=28."},
      { id:"v-unit-05", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"Perimetru dreptunghi", title_en:"Rectangle perimeter",
        statement_ro:"Dreptunghi cu laturi 8 cm și 13 cm ⇒ perimetru? (număr)",
        statement_en:"Rectangle 8 cm by 13 cm: perimeter?",
        answer:"42", source:"Set creat",
        hint1_ro:"P=2(a+b).", hint2_ro:"=42."},
      { id:"v-unit-06", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"Gard teren", title_en:"Fence",
        statement_ro:"Teren dreptunghi 25 m × 18 m. Lungimea gardului? (număr)",
        statement_en:"Field 25 m by 18 m. Fence length?",
        answer:"86", source:"Set creat",
        hint1_ro:"Perimetru.", hint2_ro:"2(25+18)."},
      { id:"v-unit-07", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"m+cm → cm", title_en:"m+cm→cm",
        statement_ro:"\\(1\\,\\text{m}\\ 25\\,\\text{cm}=\\ ?\\,\\text{cm}\\).",
        statement_en:"1 m 25 cm = ? cm.",
        answer:"125", source:"Set creat",
        hint1_ro:"1 m=100 cm.", hint2_ro:"+25."},
      { id:"v-unit-08", lessonId:"v-unit-de-masură", difficulty:1,
        title_ro:"km → m (mic)", title_en:"Small km→m",
        statement_ro:"\\(0{,}08\\,\\text{km}=\\ ?\\,\\text{m}\\).",
        statement_en:"0.08 km = ? m.",
        answer:"80", source:"Set creat",
        hint1_ro:"×1000.", hint2_ro:"=80."},
      { id:"v-unit-09", lessonId:"v-unit-de-masură", difficulty:2,
        title_ro:"Total pe zile", title_en:"Total over days",
        statement_ro:"Parcurgi 1,5 km pe zi. Câți metri în 12 zile? (număr)",
        statement_en:"You walk 1.5 km per day. How many meters in 12 days?",
        answer:"18000", source:"Set creat",
        hint1_ro:"1,5 km = 1500 m.", hint2_ro:"×12."},

      /* ——— Collatz ——— */
      { id:"p_cz_7_steps", lessonId:"res-collatz", difficulty:2,
        title_ro:"Câți pași până la 1 pentru 7?",
        title_en:"How many steps to 1 for 7?",
        statement_ro:"Aplică regula Collatz. Câți pași sunt de la 7 până la 1 (prima apariție a lui 1)?",
        statement_en:"Apply the Collatz rule. How many steps from 7 to 1 (first time reaching 1)?",
        answer:"16", source:"Collatz — exemplu clasic (7)",
        hint1_ro:"Pornește: 7→22→11→34→17…",
        hint2_ro:"Completează până la 1; numără săgețile.",
        addedAt:"2025-02-01"
      },
      { id:"p_cz_3_5steps", lessonId:"res-collatz", difficulty:1,
        title_ro:"5 pași pornind de la 3",
        title_en:"5 steps starting at 3",
        statement_ro:"Aplică de 5 ori regula T, pornind de la n=3. Ce număr obții?",
        statement_en:"Apply T five times starting at n=3. What number do you get?",
        answer:"4", source:"Collatz — exercițiu scurt",
        hint1_ro:"3→10 (1), 10→5 (2)",
        hint2_ro:"5→16 (3), 16→8 (4), 8→4 (5).",
        addedAt:"2025-02-02"
      },
      { id:"p_cz_27_3steps", lessonId:"res-collatz", difficulty:2,
        title_ro:"T(27) după 3 pași",
        title_en:"T(27) after 3 steps",
        statement_ro:"Calculează \\(T^{(3)}(27)\\) (aplici regula de 3 ori).",
        statement_en:"Compute \\(T^{(3)}(27)\\).",
        answer:"124", source:"Collatz — 27 urcă mult",
        hint1_ro:"27→82 (1), 82→41 (2)",
        hint2_ro:"41→124 (3).",
        addedAt:"2025-02-03"
      },
      { id:"p_cz_final_triplet", lessonId:"res-collatz", difficulty:0,
        title_ro:"Tripleta finală",
        title_en:"Final triplet",
        statement_ro:"Ce triplet apare mereu înainte de 1 în secvențele Collatz?",
        statement_en:"What triplet always appears before 1 in Collatz sequences?",
        answer:"4,2,1", source:"Collatz — bucla finală",
        hint1_ro:"…→4→2→1",
        hint2_ro:"E bucla 4–2–1.",
        addedAt:"2025-02-04"
      }
    ],

    /* ——— EXAMENE ——— */
    exams: [
      {
        id:"exam-en-2025",
        type:"EN",
        year:2025,
        title_ro:"Evaluarea Națională 2025 — Matematică (set demo)",
        title_en:"National Exam 2025 — Mathematics (demo set)",
        defaultHours:2,
        problems:["en25-1","en25-2"],
        credit_html:`Sursă oficială: <a href="https://subiecte.edu.ro/" target="_blank" rel="noopener">subiecte.edu.ro</a>`
      },
      {
        id:"exam-bac-2025",
        type:"BAC",
        year:2025,
        title_ro:"Bacalaureat 2025 — Matematică (set demo)",
        title_en:"Baccalaureate 2025 — Mathematics (demo set)",
        defaultHours:3,
        problems:["bac25-1","bac25-2"],
        credit_html:`Agregator: <a href="#" target="_blank" rel="noopener">pro-matematica.ro</a>`
      },
      {
        id:"exam-adm-ubb-2025",
        type:"ADM",
        year:2025,
        title_ro:"Admitere UBB 2025 — Matematică (set demo)",
        title_en:"UBB Admission 2025 — Mathematics (demo set)",
        defaultHours:2,
        problems:["adm25-1"],
        credit_html:`Sursă: <a href="https://www.cs.ubbcluj.ro/" target="_blank" rel="noopener">UBB CS</a>`
      },
      {
        id: "ubb-demo-2026",
        type: "ADM",
        year: 2026,
        title_ro: "UBB Demo 2026",
        title_en: "UBB Demo 2026",
        defaultHours: 1,
        scoring_profile: "ubb_multi",
        items: [
          {
            id: "ubb_q1",
            type: "mcq",
            prompt_ro: "Selectează variantele corecte.",
            prompt_en: "Select the correct choices.",
            points: 5,
            options_count: 4,
            allow_multiple: true,
            allow_none: true,
            options: [
              { label: "A", text_ro: "2 este prim", text_en: "2 is prime", is_correct: true },
              { label: "B", text_ro: "4 este prim", text_en: "4 is prime", is_correct: false },
              { label: "C", text_ro: "5 este impar", text_en: "5 is odd", is_correct: true },
              { label: "D", text_ro: "6 este impar", text_en: "6 is odd", is_correct: false }
            ]
          },
          {
            id: "ubb_q2",
            type: "open",
            prompt_ro: "Calculează 2+3.",
            prompt_en: "Compute 2+3.",
            answer: "5",
            points: 5
          }
        ],
        credit_html: ""
      }
    ],

    /* ——— Tips & Tricks examen ——— */
    tips: {
      title_ro:"🧠 Tips & Tricks examen",
      title_en:"🧠 Exam tips & mindset",
      body_ro:`<h3>⏱ Managementul timpului</h3>`,
      body_en:`<h3>⏱ Time management</h3>`
    },

    /* ——— EXAM_POINTS (maparea punctajelor) ——— */
    exam_points: {
      "en25-1": 50,
      "en25-2": 50,
      "bac25-1": 50,
      "bac25-2": 50,
      "adm25-1": 100
    }
};

