function cleanId(value,label="id"){const id=String(value||"").trim();if(!id||id.length>200)throw new TypeError(`Invalid ${label}.`);return id;}
function locale(value){return String(value||"ro").toLowerCase().startsWith("en")?"en":"ro";}
async function rpc(supabase,name,args={}){if(!supabase?.rpc)throw new Error("Supabase client is required.");const {data,error}=await supabase.rpc(name,args);if(error)throw error;return Array.isArray(data)&&data.length===1?data[0]:data;}
export const loadProblemReplayState=(supabase,problemId)=>rpc(supabase,"mh_get_problem_replay_state",{p_problem_id:cleanId(problemId,"problem id")});
export const startProblemReplay=(supabase,problemId)=>rpc(supabase,"mh_start_problem_replay",{p_problem_id:cleanId(problemId,"problem id")});
export const submitProblemReplayAnswer=(supabase,replayId,answer)=>rpc(supabase,"mh_submit_problem_replay_answer",{p_replay_id:cleanId(replayId,"replay id"),p_answer:String(answer??"").trim()});
export const requestProblemReplayHint=(supabase,replayId,hintNumber,lang="ro")=>rpc(supabase,"mh_get_problem_replay_hint",{p_replay_id:cleanId(replayId,"replay id"),p_hint_number:Number(hintNumber),p_locale:locale(lang)});
export const revealProblemReplayAnswer=(supabase,replayId)=>rpc(supabase,"mh_reveal_problem_replay_answer",{p_replay_id:cleanId(replayId,"replay id")});
export const loadPracticeReplayAnalytics=(supabase,limit=12)=>rpc(supabase,"mh_get_practice_replay_analytics",{p_limit:Math.max(1,Math.min(50,Number(limit)||12))});
