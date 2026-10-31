"use strict";
// Presentation only. Engine guards remain the authority for every offered action.
const workspaceTabs=["play","teams","rosters","reference"];
const workspaceScroll={};
let workspaceView="play",pitchFocus=0,popupAnchor=null,popupEpoch=0,hoverSquare=null,staffDetailsOpen=false;
const popup=document.getElementById("pitch-popup"),tooltip=document.getElementById("pitch-tooltip");
function closePitchPopup(restore=false){
 popupEpoch++;if(popup.matches(":popover-open"))popup.hidePopover();
 if(restore&&popupAnchor?.isConnected)popupAnchor.focus();popupAnchor=null;
}
function hidePitchTooltip(){
 if(tooltip.matches(":popover-open"))tooltip.hidePopover();
 if(hoverSquare)hoverSquare.removeAttribute("aria-describedby");hoverSquare=null;
}
function switchWorkspace(view,focus=false){
 if(!workspaceTabs.includes(view))return;
 workspaceScroll[workspaceView]=globalThis.scrollY||0;closePitchPopup();hidePitchTooltip();workspaceView=view;
 for(const key of workspaceTabs){const tab=document.getElementById("tab-"+key),panel=document.getElementById(key==="rosters"?key:key+"-view");tab.setAttribute("aria-selected",String(key===view));tab.tabIndex=key===view?0:-1;panel.hidden=key!==view;}
 if(focus)document.getElementById("tab-"+view).focus({preventScroll:true});
 globalThis.scrollTo?.({top:workspaceScroll[view]||0,behavior:"instant"});
}
for(const view of workspaceTabs){
 const tab=document.getElementById("tab-"+view);
 tab.addEventListener("click",()=>switchWorkspace(view));
 tab.addEventListener("keydown",event=>{
  const i=workspaceTabs.indexOf(view),next=event.key==="ArrowRight"?(i+1)%4:event.key==="ArrowLeft"?(i+3)%4:event.key==="Home"?0:event.key==="End"?3:null;
  if(next!==null){event.preventDefault();switchWorkspace(workspaceTabs[next],true);}
 });
}
globalThis.inspectRosterPosition=()=>{
 const profile=document.getElementById("reference-profile");profile.innerHTML=document.getElementById("profile").innerHTML;profile.hidden=false;document.getElementById("reference-view").prepend(profile);
 switchWorkspace("reference");document.getElementById("tab-reference").focus({preventScroll:true});profile.scrollIntoView({block:"start"});
};
function placePitchOverlay(element,anchor){
 const r=anchor.getBoundingClientRect(),box=element.getBoundingClientRect(),gap=8;
 const left=Math.max(gap,Math.min(r.right+gap,innerWidth-box.width-gap));
 const top=Math.max(gap,Math.min(r.top,innerHeight-box.height-gap));
 element.style.left=left+"px";element.style.top=top+"px";
}
function playerQuickInfo(p){
 const profile=game.profile(p);
 return teams[p.team].name+" · #"+p.number+" "+playerLabel(p)+"\n"+["ma","st","ag","pa","av"].map(k=>k.toUpperCase()+" "+profile[k]).join(" · ")+"\n"+p.status+(p.used?" · activated":"")+(p.distracted?" · distracted":"")+(game.ball.carrier===p.id?" · ball carrier":"")+"\n"+profile.skills.join(" · ");
}
function showPitchTooltip(cell){
 if(popup.matches(":popover-open"))return;
 const i=Array.from(pitch.children).indexOf(cell),p=game.at(i%26,Math.floor(i/26));
 const hint=cell.dataset.hint||cell.title,text=p?playerQuickInfo(p)+(cell.className.includes("push-option")?"\n"+hint:""):hint;
 if(!text||text==="empty"){hidePitchTooltip();return;}
 hidePitchTooltip();hoverSquare=cell;cell.setAttribute("aria-describedby","pitch-tooltip");tooltip.textContent=text;
 tooltip.showPopover();placePitchOverlay(tooltip,cell);
}
const playerActionIds=["start","block","blitz","handoff","pass","throw-mate","kick-mate","secure","special","transfer","finish"];
function decisionCoachLabel(q){
 if(!q)return "";
 const block=game.blockAction;
 if(q.kind==="Both Down")return "Both coaches — choose the applicable result";
 const team=Number.isInteger(q.team)?q.team:q.p?q.p.team:q.type==="blockSelect"?block?.chooserTeam:q.type==="pushChoice"?(game.has(q.target,"Sidestep")?q.target.team:block?.attacker.team):q.kind==="Stand Firm"?block?.target.team:game.players.find(p=>p.id===game.mover)?.team??game.active;
 return Number.isInteger(team)?teams[team].name+" — decision required":"Coach decision required";
}
function playerContextActions(p){
 if(game.pending||game.finished||!p||p.id!==selected||game.mover&&game.mover!==p.id)return [];
 return playerActionIds.map(id=>document.getElementById(id)).filter(b=>!b.disabled).map(b=>({label:b.textContent,run:()=>b.click()}));
}
function targetContextActions(actor,target){
 const actions=[];
 if(!actor||!target||game.pending||game.finished)return actions;
 if(game.canBlock(actor,target))actions.push({label:"Block #"+target.number,run:()=>{game.block(actor.id,target.id);destination=null;render();}});
 if(game.canBlitz(actor,target))actions.push({label:"Declare Blitz on #"+target.number,run:()=>{game.startBlitz(actor.id,target.id);destination=null;render();}});
 if(game.specialTargets().some(p=>p.id===target.id))actions.push({label:(game.action==="foul"?"Foul":game.action.slice(8))+" #"+target.number,run:()=>{game.performSpecial(target.id);destination=null;render();}});
 if(game.throwActor()&&game.throwCandidates().some(p=>p.id===target.id))actions.push({label:(game.action==="kick-team-mate"?"Kick":"Throw")+" team-mate #"+target.number,run:()=>{game.selectThrowMate(target.id);ballMode=true;throwDestination=null;destination=null;render();}});
 return actions;
}
function showPitchPopup(cell,title,details,actions){
 closePitchPopup();hidePitchTooltip();popupAnchor=cell;const epoch=popupEpoch,currentGame=game,currentPending=game.pending;
 popup.replaceChildren();const heading=document.createElement("h3");heading.textContent=title;popup.append(heading);
 const close=button("×",()=>closePitchPopup(true));close.className="popup-close";close.setAttribute("aria-label","Close pitch actions");popup.append(close);
 for(const line of details.split("\n")){if(!line)continue;const p=document.createElement("p");p.textContent=line;popup.append(p);}
 const list=document.createElement("div");list.className="popup-actions";popup.append(list);
 for(const [i,action] of actions.entries()){const b=button(action.label,()=>{
  if(epoch!==popupEpoch||game!==currentGame||game.pending!==currentPending||!popup.matches(":popover-open"))return;
  closePitchPopup();action.run();
 });if(i>0)b.className+=" secondary";list.append(b);}
 popup.showPopover();placePitchOverlay(popup,cell);
 (list.querySelector("button")||close).focus();
}
const chooseBeforeWorkspace=choose;
choose=function(x,y,pushDecision=game.pending){
 closePitchPopup();hidePitchTooltip();pitchFocus=y*26+x;
 const target=game.at(x,y),actor=game.players.find(p=>p.id===selected),wasTargeting=!!(blockMode||ballMode||game.pending),phase=game.phase;
 const targetActions=!wasTargeting&&target&&target.id!==actor?.id?targetContextActions(actor,target):[];
 if(!wasTargeting&&target&&game.match&&phase==="kicker"&&game.eligibleKickers().includes(target)){
  showPitchPopup(pitch.children[pitchFocus],"Kicker #"+target.number,playerQuickInfo(target),[{label:"Nominate kicker #"+target.number,run:()=>matchRun(()=>game.nominateKicker(target.id))}]);return;
 }
 if(targetActions.length){
  const cell=pitch.children[pitchFocus];showPitchPopup(cell,"Target #"+target.number,playerQuickInfo(target),[...targetActions,{label:"Inspect player",run:()=>{chooseBeforeWorkspace(x,y);document.getElementById("player-details").open=true;}}]);return;
 }
 chooseBeforeWorkspace(x,y,pushDecision);
 const cell=pitch.children[pitchFocus];
 if(!wasTargeting&&target&&(!game.match||["play","charge"].includes(phase))){
  const actions=playerContextActions(target);actions.push({label:"Show full profile & skills",run:()=>{document.getElementById("player-details").open=true;}});showPitchPopup(cell,"#"+target.number+" · "+playerLabel(target),playerQuickInfo(target),actions);
 }else if(!wasTargeting&&!target&&destination&&game.mover){
  showPitchPopup(cell,"Movement preview",document.getElementById("movement").textContent,[{label:"Commit planned route",run:commitRoute},{label:"Cancel movement preview",run:cancelMovementPreview}]);
 }
};
pitch.addEventListener("keydown",event=>{
 const cell=event.target.closest(".square");if(!cell)return;
 const index=Array.from(pitch.children).indexOf(cell),x=index%26,y=Math.floor(index/26);
 let next=null;
 if(event.key==="ArrowLeft")next=y*26+Math.max(0,x-1);
 if(event.key==="ArrowRight")next=y*26+Math.min(25,x+1);
 if(event.key==="ArrowUp")next=Math.max(0,y-1)*26+x;
 if(event.key==="ArrowDown")next=Math.min(14,y+1)*26+x;
 if(event.key==="Home")next=y*26;if(event.key==="End")next=y*26+25;
 if(next!==null){event.preventDefault();pitch.children[index].tabIndex=-1;pitchFocus=next;pitch.children[next].tabIndex=0;pitch.children[next].focus();}
});
pitch.addEventListener("pointerover",e=>{if(e.pointerType==="touch")return;const cell=e.target.closest(".square");if(cell&&cell!==hoverSquare)showPitchTooltip(cell);});
pitch.addEventListener("focusin",e=>{const cell=e.target.closest(".square");if(cell)showPitchTooltip(cell);});
pitch.addEventListener("pointerleave",hidePitchTooltip);
pitch.addEventListener("focusout",hidePitchTooltip);
popup.addEventListener("keydown",event=>{
 if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closePitchPopup(true);return;}
 const buttons=Array.from(popup.querySelectorAll("button"));let i=buttons.indexOf(document.activeElement);
 if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();buttons[(i+(event.key==="ArrowDown"?1:buttons.length-1))%buttons.length].focus();}
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape")return;hidePitchTooltip();
 if(popup.matches(":popover-open")){closePitchPopup(true);return;}
 if(workspaceView==="play"&&!game.pending&&(blockMode||ballMode||destination)){blockMode=false;ballMode=false;destination=null;throwDestination=null;render();}
});
addEventListener("resize",()=>{closePitchPopup();hidePitchTooltip();});
document.addEventListener("scroll",hidePitchTooltip,true);
document.getElementById("pitch-scale").addEventListener("change",event=>{
 const scale=Number(event.target.value);if(![1,1.5,2].includes(scale))return;
 closePitchPopup();hidePitchTooltip();pitch.style.minWidth=(650*scale)+"px";
 const p=game.players.find(p=>p.id===selected&&game.onPitch(p));if(p)pitch.children[p.y*26+p.x].scrollIntoView({block:"nearest",inline:"center"});
});
function refreshWorkspace(){
 closePitchPopup();hidePitchTooltip();
 const pregame=game.match&&["fans","weather","leagueSteps","rolloff","kickChoice"].includes(game.phase),overview=document.getElementById("pregame-overview");
 overview.hidden=!pregame;document.getElementById("pitch-board").hidden=!!pregame;document.getElementById("mobile-pitch-help").hidden=!!pregame;document.getElementById("pitch-hint").hidden=!!pregame;
 document.getElementById("pitch-tools").hidden=!!pregame;
 selection.hidden=!!pregame;document.getElementById("movement").hidden=!!pregame;document.getElementById("player-details").hidden=!!pregame;
 if(pregame){
  overview.replaceChildren();const heading=document.createElement("h2");heading.textContent="Prepare for kick-off";overview.append(heading);const intro=document.createElement("p");intro.textContent="Both coaches share this browser. Complete the current step in the coach panel, then arrange your players on the pitch.";overview.append(intro);
  const steps=document.createElement("ol");steps.className="pregame-steps";overview.append(steps);const phaseIndex={fans:0,weather:1,leagueSteps:2,rolloff:3,kickChoice:3}[game.phase];
  ["Fans in attendance","Weather","Staff & inducements","Kick or receive","Set up your team"].forEach((name,i)=>{const li=document.createElement("li");li.textContent=name;li.className=i<phaseIndex?"complete":i===phaseIndex?"current":"";if(i===phaseIndex)li.setAttribute("aria-current","step");steps.append(li);});
 }
 Array.from(pitch.children).forEach((cell,i)=>{cell.tabIndex=i===pitchFocus?0:-1;cell.dataset.hint=cell.title;cell.removeAttribute("title");});
 for(const id of playerActionIds){const b=document.getElementById(id);if(id!=="finish")b.hidden=b.disabled;}
 document.getElementById("finish").hidden=document.getElementById("finish").disabled;
 document.getElementById("end").hidden=document.getElementById("end").disabled;
 document.getElementById("action-disclosure").hidden=game.match&&!["play","charge"].includes(game.phase)||!!game.pending;
 const hint=document.getElementById("pitch-hint");
 hint.textContent=game.pending?"Decision required — resolve the coach’s desk before continuing.":blockMode?"Click a red highlighted opponent to declare the action. Escape cancels targeting.":ballMode?"Click a highlighted target to preview; click it again to commit. Escape returns to movement.":destination?"Click another highlighted square to extend the route, or repeat the destination to commit. Escape clears the preview.":game.match&&game.phase==="setup"?"Select a player, then place them in an empty square in their own half.":"Click a player for legal actions. Hover or focus a square for stats and step checks.";
 const skillPanel=document.getElementById("skillcontrols"),details=document.getElementById("player-details");if(skillPanel&&skillPanel.parentElement!==details)details.append(skillPanel);
 // Keep the decision column reachable on small screens without obscuring the pitch.
 const choices=document.getElementById("choices");choices.setAttribute("aria-label",game.pending?"Required coach decision":"Action choices");
 if(game.pending){const owner=document.createElement("p");owner.className="decision-owner";owner.textContent=decisionCoachLabel(game.pending);choices.prepend(owner);}
 const faces={"Player Down":["☠","Attacker knocked down."],"Both Down":["↔","Both players may fall; Block and Wrestle can affect this result."],"Push Back":["↪","Push the defender to a legal destination."],"Stumble":["✦","Defender falls unless an applicable ability such as Dodge prevents it."],"POW":["✹","Defender knocked down."]};
 for(const b of choices.querySelectorAll("button")){const face=Object.keys(faces).find(name=>b.textContent.startsWith("Die ")&&b.textContent.endsWith(" · "+name));if(face){b.className+=" block-die";b.dataset.glyph=faces[face][0];b.title=faces[face][1];b.setAttribute("aria-label",b.textContent);}else if(/^(Use |Re-roll |Cancel |Accept |Keep )/.test(b.textContent))b.className+=" secondary";}
 const flow=document.getElementById("matchflow"),resources=Array.from(flow.children).filter(e=>/resource-summary|resource-control/.test(e.className));
 const score=document.getElementById("match-scoreboard");score.replaceChildren();if(game.match)score.append(...Array.from(flow.children).slice(0,2));
 if(resources.length){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent=game.league?"Inducement purchases — required before continuing":"Staff & inducements · optional";details.append(summary,...resources);details.open=staffDetailsOpen||!!game.league;details.addEventListener("toggle",()=>{staffDetailsOpen=details.open;});flow.append(details);}
 const setupPlayers=Array.from(flow.children).filter(e=>e.className.includes("setup-player"));
 if(setupPlayers.length){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Select a player from the roster (or click on the pitch)";details.append(summary,...setupPlayers);flow.append(details);}
 if(game.match&&game.phase==="finished"&&game.league)flow.append(button("Record result in Teams & leagues",()=>switchWorkspace("teams",true)));
}
const renderBeforeWorkspace=render;
render=function(){const focused=document.activeElement?.closest?.(".square"),index=focused?Array.from(pitch.children).indexOf(focused):-1,logTop=log.scrollTop,followLog=log.scrollHeight-log.scrollTop-log.clientHeight<24;renderBeforeWorkspace();refreshWorkspace();log.scrollTop=followLog?log.scrollHeight:logTop;if(index>=0)pitch.children[index]?.focus({preventScroll:true});};
const startLeagueMatchBeforeWorkspace=startLeagueMatch;
startLeagueMatch=function(fixture){switchWorkspace("play");startLeagueMatchBeforeWorkspace(fixture);};
const leagueDisclosureKey=e=>e.querySelector("summary")?.textContent.split(" · ")[0]||"";
const renderLeagueBeforeWorkspace=renderLeague;
renderLeague=function(){
 const details=Array.from(leaguePanel.querySelectorAll("details")),open=new Set(details.filter(e=>e.open).map(leagueDisclosureKey));
 const focused=document.activeElement,focusKey=focused?.closest?.("details"),focusLabel=focused?.tagName==="BUTTON"?focused.textContent:null;
 renderLeagueBeforeWorkspace();
 const updated=Array.from(leaguePanel.querySelectorAll("details"));for(const e of updated)if(open.has(leagueDisclosureKey(e)))e.open=true;
 if(focusLabel){const parent=focusKey?updated.find(e=>leagueDisclosureKey(e)===leagueDisclosureKey(focusKey)):leaguePanel;Array.from(parent?.querySelectorAll("button")||[]).find(e=>e.textContent===focusLabel)?.focus({preventScroll:true});}
};
const coverage=document.getElementById("skillcoverage"),coverageTable=coverage.querySelector("table");
if(coverageTable){
 const label=document.createElement("label");label.className="skill-search";label.textContent="Find a skill or trait ";const input=document.createElement("input");input.type="search";input.placeholder="Name, category or behavior";label.append(input);coverage.querySelector("summary").after(label);
 const status=document.createElement("p");status.className="muted";status.setAttribute("role","status");label.after(status);
 const rows=Array.from(coverageTable.querySelectorAll("tr")).slice(1);
 input.addEventListener("input",()=>{const query=input.value.trim().toLocaleLowerCase();for(const row of rows)row.hidden=!row.textContent.toLocaleLowerCase().includes(query);const count=rows.filter(r=>!r.hidden).length;status.textContent=count+" of "+rows.length+" entries";});
}
switchWorkspace("play");refreshWorkspace();
