"use strict";
// Presentation only. Engine guards remain the authority for every offered action.
const workspaceTabs=["play","teams","rosters","testing","reference"];
const workspaceScroll={};
let workspaceView="play",pitchFocus=0,popupAnchor=null,popupEpoch=0,hoverSquare=null,staffDetailsOpen=false,economicsOpen=false,popoverTransition=false;
let setupSelectionContext=null,suppressPitchHover=false;
const popup=document.getElementById("pitch-popup"),tooltip=document.getElementById("pitch-tooltip");
function exhibitionRosterChoices(side){const roster=exhibitionTeam(exhibitionSelection(side),false);if(!roster)return;for(const [kind,options] of [["league",roster.leagues||[roster.league]],["alignment",roster.alignments||[]]]){const select=document.getElementById("exhibition-"+side+"-"+kind),previous=select.value;select.replaceChildren();for(const name of options){const option=document.createElement("option");option.value=name;option.textContent=name;select.append(option);}select.value=options.includes(previous)?previous:options[0]||"";select.hidden=!!roster.exhibitionSaved||options.length<2;document.getElementById("exhibition-"+side+"-"+kind+"-label").hidden=select.hidden;}}
globalThis.refreshExhibitionRosters=()=>{for(const side of ["home","away"]){
 const preset=document.getElementById("exhibition-"+side),custom=document.getElementById("exhibition-"+side+"-custom"),previous=preset.value,saved=custom.value;
 preset.replaceChildren();custom.replaceChildren();
 const option=(select,value,text)=>{const o=document.createElement("option");o.value=value;o.textContent=text;select.append(o);};
 for(const roster of rosterCatalog)option(preset,roster.id,roster.name);
 const clubs=leagueStore.data.teams.filter(t=>!t.draft&&!t.deleted);option(custom,"","Use preset team");
 for(const team of clubs)option(custom,"saved:"+team.id,team.name);
 preset.value=rosterCatalog.some(t=>t.id===previous)?previous:practiceLeagueTeams[side==="home"?0:1].id;
 custom.value=clubs.some(t=>"saved:"+t.id===saved)?saved:"";custom.disabled=!clubs.length;
 document.getElementById("exhibition-"+side+"-custom-note").textContent=clubs.length?"Custom team overrides the preset. Choose Use preset team to switch back.":"No submitted custom teams. Create and submit one in Teams & leagues.";
 exhibitionRosterChoices(side);
}};
refreshExhibitionRosters();
for(const side of ["home","away"]){
 const id="exhibition-"+side;
 for(const suffix of ["","-custom"])document.getElementById(id+suffix).addEventListener("change",()=>{if(!suffix)document.getElementById(id+"-custom").value="";exhibitionRosterChoices(side);document.getElementById("match-config-status").textContent="Changes ready. Start a new match to apply them.";});
 for(const kind of ["league","alignment"])document.getElementById(id+"-"+kind).addEventListener("change",()=>{document.getElementById("match-config-status").textContent="Changes ready. Start a new match to apply them.";});
}
function refreshSessionLocation(){
 const session=document.getElementById("game-session");if(document.getElementById("mode-notice").parentElement!==session)session.prepend(document.getElementById("mode-notice"));
 const play=document.getElementById("play-view"),setup=document.getElementById("exhibition-rosters");
 if(setup.parentElement!==play)play.prepend(setup);
 const testing=document.getElementById("scenario").value!=="match";
 if(testing)setup.open=true;
 const panel=document.getElementById(testing?"testing-view":"play-view");if(session.parentElement!==panel)panel.append(session);
}
document.getElementById("start-exhibition").addEventListener("click",()=>{document.getElementById("scenario").value="match";reset();document.getElementById("exhibition-rosters").open=false;document.getElementById("match-config-status").textContent="";switchWorkspace("play");});
function refreshTestingOptions(){document.getElementById("observer-options").hidden=document.getElementById("testing-scenario").value!=="match-observe";}
document.getElementById("testing-scenario").addEventListener("change",refreshTestingOptions);refreshTestingOptions();
document.getElementById("start-testing").addEventListener("click",()=>{document.getElementById("scenario").value=document.getElementById("testing-scenario").value||"match-learning";reset();switchWorkspace("testing");});
document.getElementById("open-leagues").addEventListener("click",()=>switchWorkspace("teams",true));
function closePitchPopup(restore=false){
 popupEpoch++;popoverTransition=true;
 try{popup.hidden=true;if(restore&&popupAnchor?.isConnected)popupAnchor.focus({preventScroll:true});popupAnchor=null;}finally{popoverTransition=false;}
}
function hidePitchTooltip(){
 if(tooltip.matches(":popover-open"))tooltip.hidePopover();
 if(hoverSquare)hoverSquare.removeAttribute("aria-describedby");hoverSquare=null;
}
function switchWorkspace(view,focus=false){
 if(!workspaceTabs.includes(view))return;
 workspaceScroll[workspaceView]=globalThis.scrollY||0;closePitchPopup();hidePitchTooltip();workspaceView=view;
 if(globalThis.history?.replaceState)history.replaceState(null,"","#"+view);
 for(const key of workspaceTabs){const tab=document.getElementById("tab-"+key),panel=document.getElementById(key==="rosters"?key:key+"-view");tab.setAttribute("aria-selected",String(key===view));tab.tabIndex=key===view?0:-1;panel.hidden=key!==view;}
 if(focus)document.getElementById("tab-"+view).focus({preventScroll:true});
 globalThis.scrollTo?.({top:workspaceScroll[view]||0,behavior:"instant"});
}
for(const view of workspaceTabs){
 const tab=document.getElementById("tab-"+view);
 tab.addEventListener("click",()=>switchWorkspace(view));
 tab.addEventListener("keydown",event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const i=workspaceTabs.indexOf(view),next=event.key==="ArrowRight"?(i+1)%workspaceTabs.length:event.key==="ArrowLeft"?(i+workspaceTabs.length-1)%workspaceTabs.length:event.key==="Home"?0:event.key==="End"?workspaceTabs.length-1:null;
  if(next!==null){event.preventDefault();switchWorkspace(workspaceTabs[next],true);}
 });
}
globalThis.inspectRosterPosition=()=>{
 const profile=document.getElementById("roster-inspection");profile.replaceChildren();profile.hidden=false;const close=button("Close position details",()=>{profile.hidden=true;});profile.append(close);const content=document.createElement("div");content.innerHTML=document.getElementById("profile").innerHTML;profile.append(content);
};
function filterRosterBrowser(){const query=document.getElementById("roster-search").value.trim().toLocaleLowerCase(),cards=Array.from(document.getElementById("roster-list").querySelectorAll("article"));for(const card of cards)card.hidden=!card.dataset.rosterName.toLocaleLowerCase().includes(query);for(const group of document.getElementById("roster-list").querySelectorAll(".roster-tier"))group.hidden=!Array.from(group.querySelectorAll("article")).some(card=>!card.hidden);document.getElementById("roster-search-count").textContent=cards.filter(card=>!card.hidden).length+" / "+rosterCatalog.length+" rosters";}
document.getElementById("roster-search").addEventListener("input",filterRosterBrowser);filterRosterBrowser();
function placePitchOverlay(element,anchor){
 const r=anchor.getBoundingClientRect(),box=element.getBoundingClientRect(),gap=8;
 const width=document.documentElement?.clientWidth||innerWidth,height=document.documentElement?.clientHeight||innerHeight;
 const left=Math.max(gap,Math.min(r.right+gap,width-box.width-gap));
 const top=Math.max(gap,Math.min(r.top,height-box.height-gap));
 element.style.left=left+"px";element.style.top=top+"px";
}
function playerQuickInfo(p){
 const profile=game.profile(p);
 return teams[p.team].name+" · #"+p.number+" "+playerLabel(p)+"\n"+["ma","st","ag","pa","av"].map(k=>k.toUpperCase()+" "+profile[k]).join(" · ")+"\n"+p.status+(p.captain?" · Team Captain":"")+(p.used?" · activated":"")+(p.distracted?" · distracted":"")+(game.ball.carrier===p.id?" · ball carrier":"")+"\n"+profile.skills.join(" · ");
}
const positionKey=document.getElementById("position-key-items");
for(const marker of Object.values(POSITION_MARKERS)){const item=document.createElement("span");item.className="position-key-item";const icon=document.createElement("span");icon.className="token role-"+marker.shape;icon.append(markerGraphic(marker));item.append(icon);const label=document.createElement("span");label.textContent=marker.label+" · "+marker.shape;item.append(label);positionKey.append(item);}
const dugoutStates=[['reserve','Reserves'],['ko','Knocked out'],['injured','Injured'],['dead','Dead'],['sent-off','Sent off'],['unavailable','Unavailable']];
function dugoutState(p){if(p.eaten||p.casualty?.dead||p.casualty?.result==='Dead')return 'dead';if(p.status==='sent-off')return 'sent-off';if(p.status==='casualty')return 'injured';if(p.status==='knocked-out')return 'ko';if(game.onPitch(p))return 'pitch';if(p.fixtureUnavailable&&p.leagueRecord.missNext&&!p.leagueRecord.retired)return 'injured';if(p.heatOut||p.snackOut||p.fixtureUnavailable||p.status!=='reserve')return 'unavailable';return 'reserve';}
function dugoutReason(p){if(p.status==='carried')return 'Carried by Grak — temporarily off the pitch';return p.eaten?'Eaten':p.fixtureUnavailable?(p.leagueRecord.retired?'Temporarily retired':'Misses this fixture'):p.heatOut?'Heat exhaustion — misses this drive':p.snackOut?'Dodgy Snack — misses this drive':p.casualty?.result||(p.riotousRookie?'Riotous Rookie — temporary Loner (4+)':p.status);}
function dugoutPlayers(team){const players=game.players.filter(p=>p.team===team);if(game.league){const saved=leagueStore.data.teams.find(t=>t.id===game.teams[team].leagueTeamId),ids=new Set(players.map(p=>p.leaguePlayerId));for(const record of saved?.players||[])if(!ids.has(record.id)&&(record.missNext||record.retired))players.push({id:'unavailable:'+record.id,number:record.number,team,role:record.role,status:'missing-next',fixtureUnavailable:true,profileOverride:record.profile,leagueRecord:record});}return players;}
function showDugoutTooltip(p,card){if(popoverTransition||!popup.hidden||destination||throwDestination||game.pending||game.mover)return;hidePitchTooltip();hoverSquare=card;card.setAttribute('aria-describedby','pitch-tooltip');tooltip.textContent=playerQuickInfo(p)+'\n'+dugoutReason(p);tooltip.showPopover();placePitchOverlay(tooltip,card);}
function dugoutActions(p){if(game.pending||p.fixtureUnavailable||dugoutState(p)!=='reserve')return [];const setup=game.match&&game.phase==='setup'&&p.team===game.setupTeam&&game.available(p.team).includes(p),swarm=game.phase==='swarming'&&game.swarmState.eligible.includes(p.id)&&game.swarmState.placed.length<game.swarmState.limit;const defence=game.phase==='eventMove'&&game.eventState?.kind==='defence'&&game.eventState.eligible.includes(p.id);const wisdom=game.phase==='dwarfenWisdom'&&game.wisdomState?.placing&&game.wisdomState.selected.includes(p.id);if(!setup&&!swarm&&!defence&&!wisdom)return [];return [{label:wisdom?'Select for Dwarfen Wisdom':swarm?'Select for Swarming':defence?'Select for Solid Defence':'Select for setup',run:()=>{if(!dugoutActions(p).length)return;selected=p.id;showProfile(p.team,p.role,p.number);render();}}];}
function renderDugouts(pregame){const board=document.getElementById('dugout');board.hidden=!!pregame;board.replaceChildren();if(pregame)return;const currentGame=game;for(const team of [0,1]){const players=dugoutPlayers(team),article=document.createElement('article');article.className='dugout-team '+(team?'dugout-blue':'dugout-gold');article.setAttribute('aria-label',teams[team].name+' dugout');const heading=document.createElement('h3');heading.textContent=teams[team].name;article.append(heading);const count=document.createElement('p');count.className='dugout-summary';count.textContent=players.filter(p=>dugoutState(p)==='pitch').length+' on pitch · '+players.filter(p=>dugoutState(p)!=='pitch').length+' off pitch';article.append(count);const lanes=document.createElement('div');lanes.className='dugout-lanes';article.append(lanes);for(const [state,label] of dugoutStates){const lane=document.createElement('section');lane.className='dugout-lane dugout-'+state;lane.dataset.state=state;const list=players.filter(p=>dugoutState(p)===state),title=document.createElement('h4');title.textContent=label+' · '+list.length;lane.append(title);const cards=document.createElement('div');cards.className='dugout-cards';lane.append(cards);if(!list.length){const empty=document.createElement('span');empty.className='dugout-empty';empty.textContent='—';cards.append(empty);}for(const p of list){const card=button('',()=>{if(game!==currentGame)return;showPitchPopup(card,'#'+p.number+' · '+playerLabel(p),playerQuickInfo(p)+'\n'+dugoutReason(p),dugoutActions(p));});card.className='dugout-card';card.dataset.playerId=p.id;card.setAttribute('aria-label','#'+p.number+' '+playerLabel(p)+' — '+label+' — '+dugoutReason(p));const marker=positionMarker(game.profile(p)),icon=document.createElement('span');icon.className='token dugout-icon role-'+marker.shape+(p.team?' blue':'');const number=document.createElement('span');number.className='token-number';number.textContent=p.number;const name=document.createElement('span');name.className='dugout-name';name.textContent=p.riotousRookie?'Riotous Rookie':p.leagueRecord?.name||game.profile(p).name;icon.append(markerGraphic(marker),number);card.append(icon,name);card.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')showDugoutTooltip(p,card);});card.addEventListener('pointerleave',hidePitchTooltip);card.addEventListener('blur',hidePitchTooltip);cards.append(card);}lanes.append(lane);}board.append(article);}}
function kickTargetSelection(){return game.match&&game.phase==="kickAim"&&!game.kickLanding;}
const playerActionIds=["start","block","blitz","handoff","pass","throw-mate","kick-mate","secure","special","transfer","finish"];
function decisionCoachLabel(q){
 if(!q)return "";
 const block=game.blockAction;
 if(q.kind==="Both Down")return "Both coaches";
 const team=Number.isInteger(q.team)?q.team:q.p?q.p.team:q.type==="blockSelect"?block?.chooserTeam:q.type==="pushChoice"?(game.skill(q.target,"Sidestep")&&!(block?.attacker&&game.skill(block.attacker,"Grab"))?q.target.team:block?.attacker.team):q.kind==="Stand Firm"?block?.target.team:game.players.find(p=>p.id===game.mover)?.team??game.active;
 const reactor=q.p||q.target||(q.kind==="Stand Firm"?block?.target:null);
 return Number.isInteger(team)?teams[team].name+(reactor?" · #"+reactor.number+" "+playerLabel(reactor):""):"Decision";
}
function refreshRecordedResult(){
 if(!game.league||game.phase!=="finished"||!leagueStore.data.matches.some(m=>m.id===game.leagueFixtureId))return;
 const flow=document.getElementById("matchflow");for(const p of flow.querySelectorAll("p"))if(p.textContent.startsWith("Full time:"))p.textContent=p.textContent.replace(" · result unrecorded","")+" · result recorded";
 const link=flow.querySelector("button");if(link)link.textContent="View result in Teams & leagues";
}
function canStandInPlace(p){
 return p?.status==="prone"&&!game.mover&&!game.pending&&!game.finished&&!blockMode&&!ballMode&&(!game.match||["play","charge"].includes(game.phase))&&game.canStart(p);
}
function standInPlace(p){
 if(p?.id!==selected||!canStandInPlace(p))return false;
 destination=null;throwDestination=null;
 const result=game.start(p.id,"move");render();return result;
}
function playerContextActions(p){
 if(game.pending||game.finished||!p||p.id!==selected||game.mover&&game.mover!==p.id)return [];
 const actions=playerActionIds.filter(id=>id!=="start").map(id=>document.getElementById(id)).filter(b=>!b.disabled).map(b=>({label:b.textContent,run:()=>b.click()}));
 if(canStandInPlace(p))actions.unshift({label:"Stand up in place",run:()=>standInPlace(p)});
 return actions;
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
function showPitchPopup(cell,title,details,actions,help=""){
 closePitchPopup();hidePitchTooltip();popupAnchor=cell;const epoch=popupEpoch,currentGame=game,currentPending=game.pending;
 popup.replaceChildren();const heading=document.createElement("h3");heading.textContent=title;popup.append(heading);
 const close=button("×",()=>closePitchPopup(true));close.className="popup-close";close.setAttribute("aria-label","Close pitch actions");popup.append(close);
 const lines=details.split("\n").filter(Boolean),summary=document.createElement("p");summary.className="action-summary";summary.textContent=lines.length>=4?lines[0].split(" · #")[0]+" · "+lines[2]:lines[0]||"";popup.append(summary);
 if(help){const hint=document.createElement("p");hint.className="action-hint";hint.textContent=help;popup.append(hint);}const list=document.createElement("div");list.className="popup-actions";popup.append(list);
 for(const [i,action] of actions.entries()){const b=button(action.label,()=>{
  if(epoch!==popupEpoch||game!==currentGame||game.pending!==currentPending||popup.hidden)return;
  closePitchPopup();action.run();
 });if(i>0)b.className+=" secondary";list.append(b);}
 if(lines.length>1){const info=document.createElement("details"),label=document.createElement("summary");label.textContent="Details & checks";info.append(label);for(const line of lines.slice(1)){const p=document.createElement("p");p.textContent=line;info.append(p);}popup.append(info);}popup.hidden=false;
 (list.querySelector("button")||close).focus({preventScroll:true});
}
const chooseBeforeWorkspace=choose;
choose=function(x,y,pushDecision=game.pending){
 if(pushDecision!==game.pending)return;
 suppressPitchHover=true;
 const hadPreview=!!(destination||throwDestination);
 closePitchPopup();hidePitchTooltip();pitchFocus=y*26+x;
 const target=game.at(x,y),actor=game.players.find(p=>p.id===selected),wasTargeting=!!(blockMode||ballMode||game.pending),phase=game.phase;
 if(kickTargetSelection()){chooseBeforeWorkspace(x,y,pushDecision);hidePitchTooltip();return;}
 if(target&&target===actor&&!wasTargeting&&!hadPreview&&(!game.match||["play","charge"].includes(phase))){
  if(canStandInPlace(actor)){standInPlace(actor);return;}
  selected=null;render();return;
 }
 // Clicking the route's actor returns directly to their normal range forecast.
 const planner=planningPlayer();
 if(!wasTargeting&&target){
  const route=previewRoute(planner);
  if(canCommitBlitzRoute(planner,route,target)){executeBlitzRoute(planner,route);return;}
 }
 if(!target&&actor&&!wasTargeting&&(!game.match||["play","charge"].includes(phase))){
  const previous=actor===planner?previewRoute(planner):null,range=actor===planner?remainingRange(planner,previous):new Map();
  const routeSquare=previous?.path.some(step=>step.x===x&&step.y===y);
  if(!range.has(routeKey(x,y))&&!routeSquare){selected=null;destination=null;throwDestination=null;render();return;}
 }
 if(!game.pending&&!ballMode&&target===planner&&previewRoute(planner)){
  selected=planner.id;blockMode=false;destination=null;
 }
 if(!wasTargeting&&!destination?.blitzTarget&&previewFoul(actor,target))return;
 if(!wasTargeting&&previewBallTransfer(actor,target))return;
 if(!game.pending&&!ballMode&&!blockMode&&!destination?.blitzTarget&&game.canBlock(actor,target)){previewBlock(actor,target);return;}
 if(!wasTargeting&&target&&game.canBlitz(actor,target)){previewBlitz(actor,target);return;}
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
  const actions=playerContextActions(target);actions.push({label:"Player profile",run:()=>{document.getElementById("player-details").open=true;}});showPitchPopup(cell,"#"+target.number+" · "+playerLabel(target),playerQuickInfo(target),actions);
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
 if(next!==null){event.preventDefault();pitch.children[index].tabIndex=-1;pitchFocus=next;pitch.children[next].tabIndex=0;pitch.children[next].focus({preventScroll:true});}
});
// Player information is hover-only; click and restored focus must never cover the pitch.
pitch.addEventListener("pointerdown",()=>{suppressPitchHover=true;hidePitchTooltip();});
pitch.addEventListener("pointerleave",()=>{suppressPitchHover=false;hidePitchTooltip();});
pitch.addEventListener("focusout",hidePitchTooltip);
popup.addEventListener("keydown",event=>{
 if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closePitchPopup(true);return;}
 const buttons=Array.from(popup.querySelectorAll("button"));let i=buttons.indexOf(document.activeElement);
 if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();buttons[(i+(event.key==="ArrowDown"?1:buttons.length-1))%buttons.length].focus({preventScroll:true});}
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape")return;hidePitchTooltip();
 if(!popup.hidden){closePitchPopup(true);return;}
 if(["play","testing"].includes(workspaceView)&&(!game.pending||onTheBallMove())&&(blockMode||ballMode||destination)){blockMode=false;ballMode=false;destination=null;throwDestination=null;render();}
});
addEventListener("resize",()=>{closePitchPopup();hidePitchTooltip();});
document.addEventListener("scroll",hidePitchTooltip,true);
document.getElementById("pitch-scale").addEventListener("change",event=>{
 const scale=Number(event.target.value);if(![1,1.5,2].includes(scale))return;
 closePitchPopup();hidePitchTooltip();pitch.style.minWidth=(650*scale)+"px";
});
let concessionReview=null;
function concessionReviewKey(){return JSON.stringify([game.phase,game.active,game.setupTeam,game.half,game.drive,game.turns,game.turnActionStarted]);}
function refreshConcession(){
 const b=document.getElementById("concede"),team=game.concessionTeam?.(),computer=typeof computerCoach==="function"&&computerCoach(team);
 b.hidden=!game.match||workspaceView!=="play";b.disabled=!game.canConcede?.()||!!computer;
 b.title="Concede at the start of your turn, or during setup if fewer than three players are available.";
 const review=document.getElementById("concession-review");
 if(concessionReview&&(concessionReview.game!==game||concessionReview.key!==concessionReviewKey()||b.disabled))concessionReview=null;
 review.hidden=!concessionReview;
}
document.getElementById("concede").addEventListener("click",()=>{
 if(!game.canConcede()||typeof computerCoach==="function"&&computerCoach(game.concessionTeam()))return;
 concessionReview={game,key:concessionReviewKey(),team:game.concessionTeam()};
 const text=game.phase==="setup"?"This concession has no penalties because fewer than three players can set up. Normal post-game rewards apply.":"The conceding team receives no MVP or winnings, loses all SPP earned this match, and loses D3 Dedicated Fans (minimum 1). The opponent receives two MVP awards and all attendance winnings. Player-retention rolls are omitted.";
 document.getElementById("concession-description").textContent=game.teams[concessionReview.team].name+" will concede. The opponent wins "+Math.max(2,game.scores[1-concessionReview.team])+"–0. "+text+" Injuries remain. Post-game decisions stay with you.";
 refreshConcession();
});
document.getElementById("cancel-concession").addEventListener("click",()=>{concessionReview=null;refreshConcession();});
document.getElementById("confirm-concession").addEventListener("click",()=>{
 const review=concessionReview;concessionReview=null;
 if(review?.game===game&&review.key===concessionReviewKey()&&game.concede(review.team)){selected=null;destination=null;render();}else refreshConcession();
});
function refreshWorkspace(){
 refreshConcession();
 refreshSessionLocation();
 closePitchPopup();hidePitchTooltip();
 document.getElementById("exhibition-rosters").hidden=!!game.league&&!game.exhibition;
 const pregame=game.match&&["fans","weather","leagueSteps","prayers","rolloff","kickChoice"].includes(game.phase),overview=document.getElementById("pregame-overview");
 overview.hidden=!pregame;document.getElementById("pitch-board").hidden=!!pregame;document.getElementById("mobile-pitch-help").hidden=!!pregame;document.getElementById("pitch-hint").hidden=!!pregame;
 document.getElementById("pitch-tools").hidden=!!pregame;document.getElementById("position-key").hidden=!!pregame;
 renderDugouts(pregame);
 document.getElementById("pitch-legend").hidden=false;
 selection.hidden=!!pregame;document.getElementById("movement").hidden=!!pregame;document.getElementById("player-details").hidden=!!pregame;
 if(pregame){
  overview.replaceChildren();const heading=document.createElement("h2");heading.textContent="Prepare for kick-off";overview.append(heading);const intro=document.createElement("p");intro.textContent=game.observing?"Both computer coaches complete pre-game and setup automatically. Pause or step through actions using the computer controls.":"Both coaches share this browser. Complete the current step in the coach panel, then arrange your players on the pitch.";overview.append(intro);
  const steps=document.createElement("ol");steps.className="pregame-steps";overview.append(steps);const phaseIndex={fans:0,weather:1,leagueSteps:2,prayers:2,rolloff:3,kickChoice:3}[game.phase];
  ["Fans in attendance","Weather",game.league?"Inducement purchases":"Pre-game checks","Kick or receive","Set up your team"].forEach((name,i)=>{const li=document.createElement("li");li.textContent=name+(i===0&&phaseIndex>0?" — "+teams.map((team,t)=>team.name+" "+game.fans[t]).join(", "):i===1&&phaseIndex>1?" — "+game.weather:"");li.className=i<phaseIndex?"complete":i===phaseIndex?"current":"";if(i===phaseIndex)li.setAttribute("aria-current","step");steps.append(li);});
 }
 Array.from(pitch.children).forEach((cell,i)=>{cell.tabIndex=i===pitchFocus?0:-1;cell.dataset.hint=cell.title;cell.removeAttribute("title");});
 for(const id of playerActionIds){const b=document.getElementById(id);if(id!=="finish")b.hidden=b.disabled;}
 document.getElementById("finish").hidden=document.getElementById("finish").disabled;
 document.getElementById("end").hidden=document.getElementById("end").disabled;
 document.getElementById("action-disclosure").hidden=game.match&&!["play","charge"].includes(game.phase)||!!game.pending;
 const hint=document.getElementById("pitch-hint");
 hint.textContent=pendingPitchChoices().length?"Click a highlighted pitch target to resolve "+game.pending.kind+".":game.pending?"Decision required — resolve the coach’s desk before continuing.":blockMode==="blitz"?"Choose a highlighted Blitz target, then plan your own movement. Escape cancels targeting.":blockMode?"Click a highlighted opponent to declare the action. Escape cancels targeting.":ballMode?"Click a highlighted target to preview; click it again to commit. Escape returns to movement.":destination?.blockTarget?"Block preview: click the highlighted target again to block, or your player to cancel. Choose Declare Blitz to block and move.":destination?.blitzTarget?"Blitz preview: click the highlighted target again to move and block. Escape clears the preview.":destination?"Click another highlighted square to extend the route, then Confirm Move or repeat the destination to commit. Escape clears the preview.":game.action==="blitz"&&!game.blitzBlocked?"Move toward the declared target, then choose Blitz Block (1 MA) when adjacent.":game.match&&game.phase==="setup"?"Select a player, then click an empty square to move or a team-mate to swap. Select reserves from Dugouts or the roster.":"Click a player for legal actions. Player details are in the coach’s desk profile.";
 if(kickTargetSelection())hint.textContent="Aim in the highlighted "+(game.ownHalf(game.receiving,0)?"left":"right")+" half ("+teams[game.receiving].name+"). Click once to preview; click the same square again to kick.";
 if(game.action==="blitz"&&destination){
  const player=planningPlayer(),target=game.players.find(p=>p.id===game.blitzTarget);
  if(canCommitBlitzRoute(player,previewRoute(player),target))hint.textContent="Click the declared Blitz target to follow your planned route and block.";
 }

 if(game.match&&game.phase==="swarming")hint.textContent="Swarming: select a reserve Lineman in the coach panel, then place them in an empty square in their own half.";
 const direction=document.getElementById("pitch-direction"),attacksRight=i=>game.match?game.right(i):i===0;direction.textContent=teams.map((team,i)=>team.name+" "+(attacksRight(i)?"→":"←")).join(" · ");direction.setAttribute("aria-label",teams.map((team,i)=>team.name+" attacks "+(attacksRight(i)?"right":"left")).join("; "));
 const skillPanel=document.getElementById("skillcontrols"),details=document.getElementById("player-details");if(skillPanel&&skillPanel.parentElement!==details)details.append(skillPanel);
 // Keep the decision column reachable on small screens without obscuring the pitch.
 const choices=document.getElementById("choices");choices.setAttribute("aria-label",game.pending?"Required coach decision":"Action choices");
 if(game.pending)coach.textContent=decisionCoachLabel(game.pending);
 const faces={"Player Down":"☠","Both Down":"↔","Push Back":"↪","Stumble":"✦","POW":"✹"};
 for(const b of choices.querySelectorAll("button")){const face=Object.keys(faces).find(name=>b.textContent.startsWith("Die ")&&b.textContent.endsWith(" · "+name));if(face){b.className+=" block-die";b.dataset.glyph=faces[face];b.title=face;b.setAttribute("aria-label",b.textContent);}else if(/^(Use |Re-roll |Cancel |Accept |Keep )/.test(b.textContent))b.className+=" secondary";}
 const flow=document.getElementById("matchflow"),resources=Array.from(flow.children).filter(e=>/resource-summary|resource-control/.test(e.className));
 const score=document.getElementById("match-scoreboard");score.replaceChildren();if(game.match)score.append(...Array.from(flow.children).slice(0,2));
 const economics=Array.from(flow.children).filter(e=>e.className.includes("team-value-summary"));
 if(economics.length){const box=document.createElement("details"),title=document.createElement("summary");box.className="match-economics";title.textContent="Team values & breakdown";box.append(title,...economics);box.open=economicsOpen;box.addEventListener("toggle",()=>{economicsOpen=box.open;});score.append(box);}
 if(game.league&&game.phase==="leagueSteps"&&game.leaguePurchaseStep<game.leaguePurchaseOrder.length){const next=Array.from(flow.children).find(e=>e.className.split(" ").includes("next-step"));if(next){next.disabled=true;next.textContent="Inducement purchases pending";}}
 if(resources.length){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent=game.league?"Inducements":"Staff & inducements";details.append(summary,...resources);details.open=staffDetailsOpen||!!game.league;details.addEventListener("toggle",()=>{staffDetailsOpen=details.open;});flow.append(details);}
 const setupPlayers=Array.from(flow.children).filter(e=>e.className.includes("setup-player"));
 if(setupPlayers.length){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Available players";details.append(summary,...setupPlayers);flow.append(details);}
 if(game.match&&game.phase==="finished"&&game.leagueFixtureId)flow.append(button("Record result in Teams & leagues",()=>switchWorkspace("teams",true)));
 refreshRecordedResult();
 flow.hidden=!game.match||flow.children.length===0;
}
const renderBeforeWorkspace=render;
render=function(){
 const setup=game.match&&game.phase==="setup"?{game,drive:game.drive,team:game.setupTeam}:null;
 if(setup&&(!setupSelectionContext||setup.game!==setupSelectionContext.game||setup.drive!==setupSelectionContext.drive||setup.team!==setupSelectionContext.team))selected=null;
 setupSelectionContext=setup;
 const focused=document.activeElement?.closest?.(".square"),index=focused?Array.from(pitch.children).indexOf(focused):-1,logTop=log.scrollTop;
 const coach=document.getElementById("coach-panel"),coachTop=coach.scrollTop,coachLeft=coach.scrollLeft;
 const board=document.getElementById("pitch-board"),boardTop=board.scrollTop,boardLeft=board.scrollLeft;
 const pageX=globalThis.scrollX||0,pageY=globalThis.scrollY||0;
 renderBeforeWorkspace();refreshWorkspace();
 log.scrollTop=logTop;
 coach.scrollTop=coachTop;coach.scrollLeft=coachLeft;
 board.scrollTop=boardTop;board.scrollLeft=boardLeft;
 if(index>=0)pitch.children[index]?.focus({preventScroll:true});
 // Rebuilding the coach's desk can change browser scroll anchoring or briefly
 // shrink the document. Updating an action should not move the viewport.
 if((globalThis.scrollX||0)!==pageX||(globalThis.scrollY||0)!==pageY)globalThis.scrollTo?.({left:pageX,top:pageY,behavior:"instant"});
};
const startLeagueMatchBeforeWorkspace=startLeagueMatch;
startLeagueMatch=function(fixture){switchWorkspace("play");startLeagueMatchBeforeWorkspace(fixture);};
const leagueDisclosureKey=e=>e.dataset.playerId||e.querySelector("summary")?.textContent.split(" · ")[0]||"";
const renderLeagueBeforeWorkspace=renderLeague;
renderLeague=function(){
 const details=Array.from(leaguePanel.querySelectorAll("details")),open=new Set(details.filter(e=>e.open).map(leagueDisclosureKey));
 const focused=document.activeElement,focusKey=focused?.closest?.("details"),focusLabel=focused?.tagName==="BUTTON"?focused.textContent:null;
 renderLeagueBeforeWorkspace();
 refreshRecordedResult();
 const updated=Array.from(leaguePanel.querySelectorAll("details"));for(const e of updated)if(open.has(leagueDisclosureKey(e)))e.open=true;
 if(focusLabel){const parent=focusKey?updated.find(e=>leagueDisclosureKey(e)===leagueDisclosureKey(focusKey)):leaguePanel;Array.from(parent?.querySelectorAll("button")||[]).find(e=>e.textContent===focusLabel)?.focus({preventScroll:true});}
};
const coverage=document.getElementById("skillcoverage"),coverageTable=coverage.querySelector("table");
if(coverageTable){
 const label=document.createElement("label");label.className="skill-search";label.textContent="Find a skill or trait ";const input=document.createElement("input");input.type="search";input.placeholder="Name, category or behavior";label.append(input);coverage.querySelector("summary").after(label);
 const status=document.createElement("p");status.className="muted";status.setAttribute("role","status");label.after(status);
 const rows=Array.from(coverageTable.querySelectorAll("tr")).slice(1);
 const filterSkills=()=>{const query=input.value.trim().toLocaleLowerCase();for(const row of rows)row.hidden=!row.textContent.toLocaleLowerCase().includes(query);const count=rows.filter(r=>!r.hidden).length;status.textContent=count+" of "+rows.length+" entries";};input.addEventListener("input",filterSkills);filterSkills();
}
const initialWorkspace=globalThis.location?.hash?.slice(1);switchWorkspace(workspaceTabs.includes(initialWorkspace)?initialWorkspace:"play");refreshWorkspace();
