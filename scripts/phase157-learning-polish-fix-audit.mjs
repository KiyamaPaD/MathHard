import fs from "node:fs";
import path from "node:path";
import process from "node:process";
const root=process.cwd();
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
const polish=read("js/learning-polish-controller.js");
const secure=read("js/secure-problem-controller.js");
const admin=read("js/admin-learning-polish-authoring.js");
const css=read("css/learning-workspace.css");
const problemCss=read("css/problem-workspace.css");
const index=read("index.html");
const need=(src,tok,label)=>{if(!src.includes(tok))throw new Error(`${label}: missing ${tok}`)};
for(const [tok,label] of [
 ["data-mh-tools-collapse","collapsible lesson tools"],
 ["data-mh-tools-expand","lesson tools reopen button"],
 ["renderMath(toc)","KaTeX TOC rendering"],
 ["overscroll-behavior:contain","contained TOC scroll"],
 ["position:static","non-overlapping interactive controls"],
 ["min-width:max-content","compact scrollable lesson tables"]
]) need(tok.includes(":")?css:polish,tok,label);
need(secure,"afterWrong > beforeWrong","review action follows wrong-counter growth");
need(secure,"setReviewVisible(false);","review action resets on replay/correct");
need(polish,"Revizuiește lecția","student-facing review copy");
need(polish,"targets.slice(0, 2)","review target cap");
need(admin,"data-mh-review-targets","Admin review target authoring");
need(index,'css/learning-workspace.css?v=1572',"learning CSS cache bust");
need(index,'css/problem-workspace.css?v=157',"problem CSS cache bust");
need(problemCss,"mh-review-links","multi-review layout");
need(polish,'panel.style.position = "absolute"',"TOC popover stays anchored to the lesson toolbar");
need(polish,'panel.style.top = "calc(100% + 6px)"',"TOC popover opens directly below the toolbar");
need(polish,'document.querySelector("#drawer.open .lesson-actions")',"TOC respects the lesson action footer");
need(polish,'lowerBoundary - rect.bottom - 14',"TOC height is capped above the footer");
need(polish,'data-mh-search-toggle',"search remains in the compact lesson toolbar");
need(css,"margin-left:0","collapsed lesson tools stay on the left");
console.log("Phase 157 learning polish fix audit passed.");
