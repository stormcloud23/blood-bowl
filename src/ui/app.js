
"use strict";
const teams=JSON.parse(document.getElementById("team-data").textContent);
const rosterCatalog=JSON.parse(document.getElementById("roster-data")?.textContent||document.getElementById("team-data").textContent);
const pitch=document.getElementById("pitch"),coach=document.getElementById("coach"),selection=document.getElementById("selection"),log=document.getElementById("log");
const money=n=>n.toLocaleString("en-US")+" gp";
// Presentation roles follow roster keywords, never the player's skills or team.
const POSITION_MARKERS={
 lineman:{label:"Lineman",shape:"circle",svg:'<circle cx="20" cy="20" r="17"/>'},
 blitzer:{label:"Blitzer",shape:"triangle",svg:'<polygon points="20,2 38,37 2,37"/>'},
 blocker:{label:"Blocker",shape:"square",svg:'<rect x="3" y="3" width="34" height="34" rx="2"/>'},
 special:{label:"Special",shape:"star",svg:'<polygon points="20,2 25,14 38,15 28,24 31,38 20,31 9,38 12,24 2,15 15,14"/>'},
 thrower:{label:"Thrower",shape:"diamond",svg:'<polygon points="20,1 39,20 20,39 1,20"/>'},
 catcher:{label:"Catcher",shape:"hexagon",svg:'<polygon points="10,3 30,3 39,20 30,37 10,37 1,20"/>'},
 runner:{label:"Runner",shape:"pentagon",svg:'<polygon points="20,2 39,16 32,38 8,38 1,16"/>'},
 "big guy":{label:"Big Guy",shape:"octagon",svg:'<polygon points="12,2 28,2 38,12 38,28 28,38 12,38 2,28 2,12"/>'}
};
function positionMarker(profile){
 const tags=(profile.traits||"").toLowerCase().split(",").map(s=>s.trim());
 const role=tags.includes("big guy")?"big guy":tags.includes("special")?"special":tags.find(tag=>POSITION_MARKERS[tag])||"special";
 return POSITION_MARKERS[role];
}
function markerGraphic(marker){const graphic=document.createElement("span");graphic.className="token-shape";graphic.setAttribute("aria-hidden","true");graphic.innerHTML='<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">'+marker.svg+'</svg>';return graphic;}
let game,selected=null,destination=null,blockMode=false,ballMode=false,throwDestination=null;
function reset(){if(globalThis.resetLeagueTeams)globalThis.resetLeagueTeams();const scenario=document.getElementById("scenario").value;game=scenario.startsWith("match")?new MatchGame(teams,{learning:scenario==="match-learning"}):new SkillGame(teams,{scenario});selected=game.practicePlayer;destination=null;blockMode=false;ballMode=false;throwDestination=null;render();document.getElementById("coach-panel").scrollTop=0;const p=game.players.find(p=>p.id===selected);showProfile(p?.team??0,p?.role??0,p?.number??null);}
function escapeTeamText(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));}
function playerLabel(p){const profile=game.profile(p),name=p.leagueRecord?.name;return name&&name!==profile.name?name+" · "+profile.name:profile.name;}
function showProfile(team,role,number,roster=null){
 const t=roster||teams[team],live=!roster&&number&&game.players.find(p=>p.team===team&&p.number===number),p=live?game.profile(live):t.positions[role],record=live?.leagueRecord,base=live?.star?p:t.positions[role],escape=escapeTeamText;
 const title=record?.name||p.name||base.name,source=/^https?:\/\//i.test(t.source||"")?t.source:"",cost=record?.value??p.cost??base.cost;
 document.getElementById("profile").innerHTML='<div class="eyebrow">'+escape(t.name)+'</div><h2>'+(number?'#'+number+' · ':'')+escape(title)+'</h2><p class="muted">'+(record?escape(p.name||base.name)+' · ':'')+escape(p.traits)+'</p><div class="stats">'+["ma","st","ag","pa","av"].map(k=>'<div class="stat"><small>'+k.toUpperCase()+'</small>'+escape(p[k])+'</div>').join("")+'</div><p class="profile-skills">'+p.skills.map(escape).join(" · ")+'</p><p class="muted">'+(live?.pairedStar?'Pair fee: ':record?'Current value: ':'Cost: ')+money(cost)+' · Limit: 0–'+escape(base.max)+'<br>Primary: '+escape(p.primary)+' · Secondary: '+escape(p.secondary)+(record?'<br>Saved SPP: '+escape(record.spp)+' · Niggling Injuries: '+escape(live.nigglingInjuries||0):'')+'</p>'+(source?'<a class="muted" href="'+escape(source)+'">2025 roster source</a>':'');
}


function planningPlayer(){
 const mover=game.players.find(p=>p.id===game.mover);if(mover)return mover;
 const p=game.players.find(p=>p.id===selected);return game.canStart(p)?p:null;
}
function plannedStart(p){
 return {x:p.x,y:p.y,spent:game.mover===p.id?p.spent:p.status==="prone"?game.standCost(p):0};
}
function rangeFor(p){if(!p||game.pending||game.finished)return new Map();const s=plannedStart(p);return game.search(p,s.x,s.y,s.spent);}
function previewRoute(p){
 if(!p||!destination)return null;const s=plannedStart(p);
 if(destination.playerId===p.id&&destination.startX===s.x&&destination.startY===s.y&&destination.startSpent===s.spent)return destination;
 return null;
}
function remainingRange(p,route){
 if(!route)return rangeFor(p);
 if(game.pending||game.finished||game.action==="secure"&&route.path.some(s=>s.plan.pickup))return new Map();
 // Forecast on a separate board: vacate the starting square and move the carried ball,
 // without changing the live player, dice, activation or movement allowance.
 const forecast=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{players:game.players.map(q=>({...q})),ball:{...game.ball}});
 const actor=forecast.players.find(q=>q.id===p.id);Object.assign(actor,{x:route.x,y:route.y,spent:route.spent,status:"standing"});
 if(forecast.ball.carrier===p.id||route.path.some(s=>s.plan.pickup))forecast.ball={x:actor.x,y:actor.y,carrier:p.id};
 return forecast.search(actor,actor.x,actor.y,route.spent);
}
function cancelMovementPreview(){destination=null;render();}
function routeKey(x,y){return x+","+y;}
function resolvePushChoice(q,pos){
 if(game.pending!==q||!q.options.includes(pos))return;
 q.resolve(pos);destination=null;throwDestination=null;ballMode=false;blockMode=false;render();
}
function choose(x,y,pushDecision=game.pending){
 if(game.match&&game.pending?.spell){game.aimSpell(x,y);render();return;}
 if(pushDecision?.type==="pushChoice"){
  if(game.pending!==pushDecision)return;
  const pos=pushDecision.options.find(pos=>!pos.standFirm&&pos.x===x&&pos.y===y);
  if(pos)resolvePushChoice(pushDecision,pos);else selection.textContent="Choose a gold push square. Use the side-panel buttons for a crowd push or Stand Firm.";
  return;
 }
 const p=game.at(x,y);
 if(game.match&&!["play","charge"].includes(game.phase)){
  if(game.phase==="setup"||game.phase==="eventMove"||game.phase==="swarming"||game.phase==="dwarfenWisdom"){
   const team=game.phase==="setup"?game.setupTeam:game.phase==="swarming"?game.swarmState.team:game.phase==="dwarfenWisdom"?game.wisdomState.team:game.eventState.team;
   if(p?.team===team){selected=p.id;showProfile(p.team,p.role,p.number);}
   else if(selected){if(game.phase==="setup")game.placeSetup(selected,x,y);else if(game.phase==="swarming")game.placeSwarm(selected,x,y);else if(game.phase==="dwarfenWisdom")game.placeWisdom(selected,x,y);else game.eventPlace(selected,x,y);}
  }else if(game.phase==="kickAim"){
   if(destination?.x===x&&destination?.y===y){game.kick(x,y);destination=null;}else if(game.ownHalf(game.receiving,x))destination={x,y};
  }else if(game.phase==="touchback")game.placeTouchback(x,y);
  render();return;
 }
 if(ballMode&&["throw-team-mate","kick-team-mate"].includes(game.action)){
  const preview=game.throwPreview(x,y);if(!preview)return;
  if(throwDestination?.x===x&&throwDestination?.y===y){game.throwTeamMate(x,y);ballMode=false;throwDestination=null;}else throwDestination={x,y};render();return;
 }
 if(ballMode){
  const valid=game.action==="handoff"?game.canHandoff(p):!!game.passPreview(x,y);
  if(!valid){selection.textContent="Choose a highlighted ball target.";return;}
  if(throwDestination?.x===x&&throwDestination?.y===y){if(game.action==="handoff")game.handoff(p.id);else game.pass(x,y);ballMode=false;throwDestination=null;render();return;}
  throwDestination={x,y};render();return;
 }
 if(blockMode){
  const attacker=game.players.find(p=>p.id===selected);
  if(blockMode==="blitz"&&p&&game.canBlitz(attacker,p)){game.startBlitz(attacker.id,p.id);blockMode=false;destination=null;render();return;}
  if(blockMode!=="blitz"&&p&&game.canBlock(attacker,p)){game.block(attacker.id,p.id);blockMode=false;destination=null;render();}
  else selection.textContent="Choose a highlighted Standing opponent next to the selected player.";
  return;
 }
 if(game.pending)return;
 if(p){selected=p.id;destination=null;showProfile(p.team,p.role,p.number);render();return;}
 const mover=planningPlayer(),previous=previewRoute(mover);
 if(previous?.x===x&&previous?.y===y){commitRoute();return;}
 let route=remainingRange(mover,previous).get(routeKey(x,y));
 // An adjacent click is an explicit step, preserving coach-selected shortcuts.
 const from=previous||(mover?plannedStart(mover):null);
 if(mover&&route&&game.distance(from,{x,y})===1){
  const plan=game.planFrom(mover,x,y,from.x,from.y,previous?.spent??from.spent);
  if(plan)route={x,y,spent:(previous?.spent??from.spent)+plan.cost,path:[{x,y,plan}]};
 }
 if(route&&route.path.length){
  const start=plannedStart(mover);destination={x,y,spent:route.spent,path:[...(previous?.path||[]),...route.path],playerId:mover.id,startX:start.x,startY:start.y,startSpent:start.spent};render();
 }
 else {destination=null;render();selection.textContent=game.pending?"Resolve the dice result first.":"Choose a highlighted square for the active Move. Squares occupied by players cannot be entered.";}
}
function button(label,fn){const b=document.createElement("button");b.className="control";b.textContent=label;b.addEventListener("click",fn);return b;}
function planChecks(plan,mover){
 const checks=[];for(let i=0;i<plan.rushes;i++)checks.push("Rush "+Math.min(6,Math.max(2,game.forecastTarget(mover,"Rush",2)))+"+");
 if(plan.jump||plan.dodge)checks.push((plan.jump?"Jump ":"Dodge ")+Math.min(6,Math.max(2,plan.divingTackleTarget??plan.target))+"+"+(plan.divingTackleTarget?" (if Diving Tackle is used)":""));
 if(plan.pickup)checks.push(game.action==="secure"?"Secure the Ball 2+":"Pickup "+Math.min(6,game.forecastTarget({...mover,x:plan.x,y:plan.y},"Pick up",Number.parseInt(game.profile(mover).ag)+game.marking(mover,plan.x,plan.y)))+"+");
 if(game.match&&game.onTrapdoor({x:plan.x,y:plan.y}))checks.push("Trapdoor 2+");
 return checks;
}
function commitRoute(){
 const player=planningPlayer();if(!player||!destination||game.pending)return;
 const route=previewRoute(player);if(!route)return;
 if(!game.mover){if(!game.start(player.id,"move"))return;if(game.pending||game.mover!==player.id||game.finished){destination=null;render();return;}}
 for(const next of route.path){
  if(game.mover!==player.id||game.pending||game.finished||!game.step(next.x,next.y))break;
  if(game.pending||game.mover!==player.id||game.finished)break;
 }
 destination=null;render();
}
function render(){
 if(game.bombActor()){const p=game.bombActor();ballMode=true;if(selected!==p.id)showProfile(p.team,p.role,p.number);selected=p.id;}
 if(ballMode&&!(["throw-team-mate","kick-team-mate"].includes(game.action)?game.throwActor():game.ballActor(game.action))){ballMode=false;throwDestination=null;}
 if(blockMode&&(game.mover||game.pending))blockMode=false;
 const mover=game.players.find(p=>p.id===game.mover),inspected=game.players.find(p=>p.id===selected);
 const planner=planningPlayer(),chosen=previewRoute(planner),range=ballMode?new Map():remainingRange(planner,chosen);
 const blockAttacker=blockMode?game.players.find(p=>p.id===selected):null;
 const pushDecision=game.pending?.type==="pushChoice"?game.pending:null;
 const routeIndices=new Map((chosen?.path||[]).map((step,i)=>[routeKey(step.x,step.y),i+1]));
 const routePlans=new Map((chosen?.path||[]).map(step=>[routeKey(step.x,step.y),step.plan]));
 pitch.replaceChildren();
 for(let y=0;y<15;y++)for(let x=0;x<26;x++){
  const p=game.at(x,y),reach=range.get(routeKey(x,y)),plan=routePlans.get(routeKey(x,y))||reach?.path.at(-1)?.plan,cell=document.createElement("button"),routeIndex=routeIndices.get(routeKey(x,y)),blockTarget=!!(blockAttacker&&p&&(blockMode==="blitz"?game.canBlitz(blockAttacker,p):game.canBlock(blockAttacker,p)));
  const checks=plan&&planner?planChecks(plan,planner):[],risky=checks.length>0;
  cell.type="button";cell.className="square"+((x+y)%2===0?" turf-light":"")+(x===0?" endzone endzone-left":x===25?" endzone endzone-right":"")+(x===12?" middle":"")+(y===3||y===10?" wide":"")+(p&&p.id===selected?" selected":"")+(reach&&reach.path.length||routeIndex?" legal":"")+(risky?" risk":"")+(plan?.jump?" jump":"")+(routeIndex?" route":"")+(destination?.x===x&&destination?.y===y?" destination":"")+(blockTarget?" block-target":"");
  const ballTarget=ballMode&&(["throw-team-mate","kick-team-mate"].includes(game.action)?!!game.throwPreview(x,y):game.action==="handoff"?game.canHandoff(p):!!game.passPreview(x,y));
  if(ballTarget)cell.className+=" legal";
  if(game.match&&game.pending?.spell&&game.spellTargets(game.pending.spell,x,y).length){cell.className+=" kick-target";cell.setAttribute("data-spell-target",game.pending.spell);}
  if(throwDestination?.x===x&&throwDestination?.y===y)cell.className+=" destination";
  const label=p?teams[p.team].name+" #"+p.number+" "+playerLabel(p)+" ("+p.status+(p.distracted?", distracted":"")+(p.used?", activated":"")+")":"empty";
  const ballHere=game.ball.carrier?p?.id===game.ball.carrier:game.ball.x===x&&game.ball.y===y;
  cell.setAttribute("aria-label","Square "+(x+1)+", "+(y+1)+", "+label+(ballHere?", ball":"")+(routeIndex?", route step "+routeIndex:""));cell.title=blockTarget?"Valid Block target · "+label:routeIndex?"Route step "+routeIndex+" of "+chosen.path.length+" · "+label:reach?.path.length?"Reachable in "+reach.spent+" movement · "+label:label;
  if(plan){const detail=checks.length?checks.join(" → "):"no roll on this step";cell.title+=" · "+detail;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+detail);}
  if(game.match&&game.onTrapdoor({x,y})){cell.className+=" trapdoor";cell.title+=" · Trapdoor: falls through on 1";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", trapdoor (2+ to cross)");const marker=document.createElement("span");marker.className="trapdoor-marker";marker.textContent="⊠";marker.setAttribute("aria-hidden","true");cell.append(marker);}
  if(p){const marker=positionMarker(game.profile(p)),token=document.createElement("span");token.className="token role-"+marker.shape+(p.team?" blue":"")+(p.used&&p.id!==game.mover?" used":"")+" "+p.status+(p.distracted?" distracted":"");token.dataset.role=marker.label;token.append(markerGraphic(marker));const number=document.createElement("span");number.className="token-number";number.textContent=p.number;token.append(number);cell.append(token);cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+marker.label+" marker ("+marker.shape+")");}
  if(routeIndex){const n=document.createElement("span");n.className="route-index";n.textContent=routeIndex;cell.append(n);}
  if(game.bomb&&game.bomb.x===x&&game.bomb.y===y){const b=document.createElement("span");b.className="ball";b.textContent="●";b.title="Bomb";cell.append(b);cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", bomb");}
  if(ballHere){const b=document.createElement("span");b.className="ball";b.textContent="◆";cell.append(b);}
  const pushOption=pushDecision?.options.find(pos=>!pos.standFirm&&pos.x===x&&pos.y===y);
  if(pushOption){
   cell.className+=" push-option";cell.title="Click to push here"+(p?" — chain push #"+p.number:"");
   cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", push destination"+(p?", chain push":""));
   const marker=document.createElement("span");marker.className="push-marker";marker.textContent="↪";marker.setAttribute("aria-hidden","true");cell.append(marker);
  }
  if(pushDecision&&pushDecision.target===p){cell.className+=" push-subject";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", player being pushed");}
  if(game.match&&game.phase==="kickAim"&&game.ownHalf(game.receiving,x)){cell.className+=" kick-target";cell.title="Kick target in "+teams[game.receiving].name+" half — click to aim, repeat to kick";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", valid kick target");}
  cell.addEventListener("click",()=>pushDecision?choose(x,y,pushDecision):choose(x,y));pitch.append(cell);
 }
 coach.textContent=game.bombActor()?teams[game.bombActor().team].name+(game.bombContext.rethrows?" · Must rethrow bomb":" · Throw Bomb"):teams[game.active].name+" · Turn "+game.turns[game.active];
 selection.textContent=game.finished?"Practice drive complete. Reset to start again.":blockMode?"Select a highlighted target for #"+(blockAttacker?.number??"?")+".":inspected?"#"+inspected.number+" "+playerLabel(inspected)+" · "+inspected.status+(inspected.distracted?" · Distracted":"")+(inspected.used?" · activated this turn":""):"Select a player to inspect or activate.";
 const movement=document.getElementById("movement");
 const rangeCount=Math.max(0,range.size-1);
 movement.textContent=(game.blockAction?"Block: ST "+game.blockAction.aStrength+" vs "+game.blockAction.dStrength+" · "+game.blockAction.assists.offensive+" offensive assist(s), "+game.blockAction.assists.defensive+" defensive assist(s). ":mover?"Moving #"+mover.number+": "+mover.spent+" / "+game.profile(mover).ma+" MA used · "+Math.max(0,mover.spent-game.profile(mover).ma)+" / "+game.rushLimit(mover)+" rushes used. ":planner?"Forecast for #"+planner.number+": "+rangeCount+" reachable destinations, including up to "+game.rushLimit(planner)+" rushes. ":"")+"Team re-rolls left: "+game.rerollsAvailable(game.active)+"."+(game.action==="blitz"?" Blitz target: #"+game.players.find(p=>p.id===game.blitzTarget)?.number+(game.blitzBlocked?" · block completed; continue moving.":" · move adjacent, then choose Blitz Block (1 MA).") : "");
 const choices=document.getElementById("choices");choices.replaceChildren();
 if(chosen&&!ballMode){const remaining=document.createElement("p");remaining.textContent="From preview square "+(chosen.x+1)+", "+(chosen.y+1)+": "+Math.max(0,game.profile(planner).ma-chosen.spent)+" normal MA and "+Math.max(0,game.rushLimit(planner)-Math.max(0,chosen.spent-game.profile(planner).ma))+" Rush(es) remaining · "+rangeCount+" possible next destinations. The player has not moved.";choices.append(remaining);const routeGame=game;choices.append(button("Confirm Move",()=>{if(game===routeGame&&destination===chosen&&!game.pending)commitRoute();}));choices.append(button("Cancel movement preview",()=>{if(game===routeGame&&destination===chosen&&!game.pending)cancelMovementPreview();}));}
 if(ballMode&&["throw-team-mate","kick-team-mate"].includes(game.action)){
  const p=document.createElement("p"),preview=throwDestination&&game.throwPreview(throwDestination.x,throwDestination.y);p.textContent=preview?preview.name+" · "+(Number.isFinite(preview.target)?"Superb Throw "+Math.min(6,preview.target)+"+":"PA –: automatic fumble")+". Click again to throw #"+preview.mate.number+". Both Superb and Subpar throws scatter before landing.":"Choose a highlighted square, then click it again to throw your team-mate.";choices.append(p);
 }else if(ballMode){
  const p=document.createElement("p"),target=throwDestination&&game.at(throwDestination.x,throwDestination.y),preview=throwDestination&&game.passPreview(throwDestination.x,throwDestination.y);
  p.textContent=throwDestination?(game.action==="handoff"?"Hand-off to #"+target.number+" · Catch "+Math.min(6,game.forecastTarget(target,"Catch",Number.parseInt(game.profile(target).ag)+game.marking(target)))+"+":preview.name+" · "+(Number.isFinite(preview.target)?"Pass "+Math.min(6,preview.target)+"+":"PA –: automatic fumble")+(target?" · Catch "+Math.min(6,Math.max(2,game.forecastTarget(target,"Catch",game.landingTarget(target,{kind:"pass",accurate:true,accurateToPlayer:true}))))+"+ (accurate delivery)":" · Diving Catch may apply before the ball bounces"))+". Click the same square again to commit.":"Click a highlighted ball target to preview, then click it again to commit. Click Choose ball target again to return to movement.";if(game.action==="bomb")p.textContent=(throwDestination?"Throw Bomb · "+preview.name+" · "+(Number.isFinite(preview.target)?"PA "+Math.min(6,Math.max(2,preview.target))+"+":"PA –: automatic fumble")+". Click the same square again to throw.":"Choose a highlighted bomb target. A caught bomb must be thrown again; the match ball stays separate.");choices.append(p);
 }
 if(game.pending){
  const q=game.pending;
  if(q.type==="blockSelect"){
   const actor=game.blockAction.attacker,chooser=teams[game.blockAction.chooserTeam],p=document.createElement("p");p.textContent=chooser.name+" chooses one Block result for #"+actor.number+":";choices.append(p);
   game.blockAction.dice.forEach((die,i)=>choices.append(button("Die "+(i+1)+" · "+game.blockFace(die),()=>{if(game.pending!==q)return;game.selectBlockDie(i);destination=null;render();})));
   if(!game.blockAction.poolLocked){
    for(const source of game.rerollSources(actor))choices.append(button(source==="Team"?"Re-roll the dice with a team re-roll":"Re-roll the dice with "+source,()=>{if(game.pending!==q)return;game.rerollBlock(source);render();}));
    if(!game.blockAction.blitz&&game.has(actor,"Brawler")&&!game.blockAction.brawlerUsed)game.blockAction.dice.forEach((die,i)=>{if(game.blockFace(die)==="Both Down")choices.append(button("Brawler re-roll die "+(i+1),()=>{game.rerollBlock("Brawler",i);render();}));});
    if(game.match)for(const indices of game.savageBlockSelections())choices.append(button("Savage Blow re-roll dice "+indices.map(i=>i+1).join(", "),()=>{if(game.pending!==q)return;game.rerollBlock("Savage Blow",indices);render();}));
    if(game.match)for(const source of game.starBlockSources())game.blockAction.dice.forEach((die,i)=>choices.append(button(source+" re-roll die "+(i+1),()=>{if(game.pending!==q)return;game.rerollBlock(source,i);render();})));
    if(game.has(actor,"Pro")&&!actor.proUsed)choices.append(button("Use Pro",()=>{game.rerollBlock("Pro");render();}));
   }
  }else if(q.type==="blockProChoose"){
   const p=document.createElement("p");p.textContent="Pro succeeded. Choose one Block die to re-roll:";choices.append(p);
   game.blockAction.dice.forEach((die,i)=>choices.append(button("Re-roll die "+(i+1)+" · "+game.blockFace(die),()=>{game.rerollBlockDie(i);render();})));
  }else if(q.type==="pushChoice"){
   const p=document.createElement("p");p.textContent=(q.kind==="Chain push"?"Chain push: ":"")+"Click a gold square on the pitch to push the red-outlined player. Buttons below also work, including crowd pushes and Stand Firm:";choices.append(p);
   q.options.forEach(pos=>{const label=pos.standFirm?"Use Stand Firm":!game.inside(pos.x,pos.y)?"Push into the Crowd":"Push to "+(pos.x+1)+", "+(pos.y+1);choices.append(button(label,()=>resolvePushChoice(q,pos)));});
  }else if(q.type==="custom"){
   const p=document.createElement("p"),coach=Number.isInteger(q.team)?teams[q.team].name:"";p.textContent=(coach&&!q.kind.includes(coach)?coach+" — ":"")+q.kind+" — choose:";choices.append(p);
   q.options.forEach(option=>choices.append(button(option,()=>{if(game.pending!==q)return;game.decide(option);destination=null;render();})));
  }else{
   const p=document.createElement("p");p.textContent=teams[q.p.team].name+" #"+q.p.number+" — "+q.kind+(q.lookAhead?" succeeded ("+q.roll+"), but Diving Tackle may make it fail. Choose before the defender decides:":" failed ("+q.roll+"). Choose:");choices.append(p);
   for(const option of [...q.options,"Accept"])choices.append(button(option==="Team"?"Use team re-roll":option==="Accept"?(q.lookAhead?"Keep this result":"Accept failure"):"Use "+option,()=>{if(game.pending!==q)return;game.decide(option);destination=null;render();}));
  }
 }else if(!ballMode&&destination&&chosen){
  const initialSpent=mover?mover.spent:planner.status==="prone"?game.standCost(planner):0;
  const title=document.createElement("p");title.textContent=chosen.path.length?"Planned route: "+chosen.path.length+" step(s), "+(chosen.spent-initialSpent)+" movement point(s). Click another highlighted square to extend this route. "+"Confirm Move, or click the same destination again, to activate and follow this route."+" Cancel movement preview to start planning again. Required checks appear below; dice are rolled only when committed.":"Destination reached. Choose another highlighted square to continue moving.";choices.append(title);
  chosen.path.forEach((step,i)=>{
   const row=document.createElement("p"),checks=planChecks(step.plan,planner);
   row.textContent=(i+1)+". "+(step.plan.jump?"Jump to ":"Move to ")+(step.x+1)+", "+(step.y+1)+" · "+step.plan.cost+" MA · "+(checks.length?checks.join(" → "):"no roll");choices.append(row);
  });
  if(!chosen.path.length)choices.append(button("Clear destination",()=>{destination=null;render();}));
 }
 document.getElementById("pass").disabled=!game.canBallAction(inspected,"pass");
 document.getElementById("handoff").disabled=!game.canBallAction(inspected,"handoff");
 document.getElementById("transfer").disabled=["throw-team-mate","kick-team-mate"].includes(game.action)?!game.throwActor()||!game.throwCandidates().some(p=>p.id===game.throwMate):!game.ballActor(game.action)||!["pass","handoff"].includes(game.action);
 document.getElementById("transfer").textContent=ballMode?"Return to movement":"Choose ball target";
 document.getElementById("special").disabled=!game.specialActions(mover||inspected).length;
 document.getElementById("start").disabled=!game.canStart(inspected);
 document.getElementById("start").textContent="Activate in place";
 document.getElementById("blitz").disabled=!game.players.some(p=>game.canBlitz(inspected,p));
 document.getElementById("blitz").textContent=blockMode==="blitz"?"Cancel Blitz":"Declare Blitz";
 document.getElementById("block").disabled=game.action==="blitz"?!game.canBlitzBlock():!game.canStart(inspected)||!game.players.some(p=>game.canBlock(inspected,p));
 document.getElementById("block").textContent=game.action==="blitz"?"Blitz Block (1 MA)":blockMode===true?"Cancel Block":"Block";
 document.getElementById("secure").disabled=!game.canSecure(inspected);
 document.getElementById("finish").textContent=game.action==="bomb"?(game.bombContext?.rethrows?"Rethrow required":"Cancel Throw Bomb"):mover&&game.action==="secure"?"End Secure the Ball":mover&&game.action==="blitz"?"End Blitz":mover&&game.action==="pass"?"End Pass":mover&&game.action==="handoff"?"End Hand-off":"End Move";
 document.getElementById("finish").disabled=!game.mover||!!game.pending||game.finished||!!game.bombContext?.rethrows;
 document.getElementById("end").disabled=!!game.pending||game.finished||!!game.bombContext;
 log.replaceChildren(...game.events.map(e=>{const li=document.createElement("li");li.textContent=e;return li;}));
 document.getElementById("mode-notice").textContent=game.match?(game.league?"League fixture: saved players and resources are in use. Record the completed result for SPP, injuries and post-game progression.":"Exhibition match: play through pre-game, setup, kickoff, turns, drive recovery, and two halves."):"Practice actions with Perfect Conditions. Select a drill to try individual rules.";
 if(game.match)renderMatch();else document.getElementById("matchflow").hidden=true;
 if(inspected)showProfile(inspected.team,inspected.role,inspected.number);
 renderSkillControls();
 document.getElementById("dugout").textContent=game.players.filter(p=>!game.onPitch(p)&&p.status!=="reserve").map(p=>teams[p.team].name+" #"+p.number+": "+p.status+(p.casualty?" — "+p.casualty.result:"")).join(" · ");
}
function skillEntry(name){return SKILL_CATALOG.find(s=>s.name===name||s.name.includes("(X")&&name.startsWith(s.name.split(" (")[0]+" ("));}
function renderSkillControls(){
 let panel=document.getElementById("skillcontrols");if(!panel){panel=document.createElement("div");panel.id="skillcontrols";document.getElementById("profile").after(panel);}panel.replaceChildren();
 const p=game.players.find(q=>q.id===selected),mover=game.players.find(q=>q.id===game.mover),choices=document.getElementById("choices");
 if(p){const title=document.createElement("p");title.textContent="Abilities for #"+p.number+". Toggle optional abilities before resolving dice.";title.className="muted";panel.append(title);
  const names=[...new Set([...(p.profileOverride||teams[p.team].positions[p.role]).skills,...(p.extraSkills||[])])];
  for(const name of names){const entry=skillEntry(name),enabled=!(p.disabledSkills||[]).includes(name),b=button(entry?.mandatory?name+" · automatic":(enabled?"✓ ":"Off · ")+name,()=>{game.toggleSkill(p.id,name);showProfile(p.team,p.role,p.number);render();});b.disabled=!entry||entry.mandatory||entry.status==="Deferred"||!!game.pending;b.title=entry?.notes||"Not audited";if(entry?.mandatory)b.className+=" mandatory-skill";else b.setAttribute("aria-pressed",String(enabled));panel.append(b);}
  if(game.lab&&!game.pending){panel.append(button(p.thrall?"Unmark Thrall":"Mark as Thrall",()=>{p.thrall=!p.thrall;render();}));const select=document.createElement("select");select.setAttribute("aria-label","Add a laboratory skill");for(const entry of SKILL_CATALOG.filter(s=>s.status!=="Deferred")){
    const name=entry.name==="Bloodlust (X+)"?"Bloodlust (2+)":entry.name==="Loner (X+)"?"Loner (3+)":entry.name==="Animosity (X)"?"Animosity (Human)":entry.name==="Hatred (X)"?"Hatred (Human)":entry.name;const option=document.createElement("option");option.value=name;option.textContent=name;select.append(option);
   }panel.append(select,button("Add skill to selected lab player",()=>{if(!game.addSkill(p.id,select.value))selection.textContent="This combination is not permitted.";else{showProfile(p.team,p.role,p.number);render();}}));}
 }
 document.getElementById("throw-mate").disabled=!game.canThrowTeamMate(p);document.getElementById("kick-mate").disabled=!game.canKickTeamMate(p);
 if(!game.pending&&mover){
  if(game.puntActor())choices.append(button("Punt now",()=>{game.punt();destination=null;render();}));
  if(game.throwActor())for(const mate of game.throwCandidates())choices.append(button("Throw team-mate #"+mate.number+" · "+mate.status,()=>{game.selectThrowMate(mate.id);ballMode=true;throwDestination=null;destination=null;render();}));
  for(const target of game.specialTargets())choices.append(button((game.action==="foul"?"Foul":game.action.slice(8))+" · "+teams[target.team].name+" #"+target.number,()=>{game.performSpecial(target.id);destination=null;render();}));
  if(game.canStealDuringActivation?.(mover))choices.append(button("Use "+game.stealAbility(mover),()=>{game.useStealAbility();render();}));
  if(game.canCarryDuringActivation?.(mover))choices.append(button("Carry Crumbleberry",()=>{game.useCarryPartner();render();}));
  if(game.putridTargets?.(mover).length)choices.append(button("Putrid Regurgitation (1 MA, ends activation)",()=>{game.usePutridAfterBlock();destination=null;render();}));
  if(game.action==="blitz"&&game.canBlitzBlock())for(const name of game.specialActions(mover).filter(s=>["Stab","Projectile Vomit","Breathe Fire","Chainsaw","Chomp"].includes(s)))choices.append(button("Blitz: "+name+(name==="Chomp"?" (1 MA)":" (1 MA, ends activation)"),()=>{game.performSpecial(game.blitzTarget,name);destination=null;render();}));
  if(game.skill(mover,"Fumblerooski")&&game.ball.carrier===mover.id)choices.append(button(mover.dropOnExit?"Cancel ball drop":"Fumblerooski: leave ball when moving out",()=>{game.dropBall();render();}));
  if(game.action==="pass"&&game.skill(mover,"Hail Mary Pass")&&!game.ballActionDone)choices.append(button(mover.hailMary?"Use normal passing range":"Use Hail Mary Pass",()=>{mover.hailMary=!mover.hailMary;throwDestination=null;render();}));
 }
 if(game.match&&game.phase!=="play"&&game.action!=="blitz")document.getElementById("special").disabled=true;
}
function renderSkillCoverage(){
 const section=document.createElement("details");section.className="panel";section.id="skillcoverage";const summary=document.createElement("summary"),counts={Implemented:0,Partial:0,Deferred:0};SKILL_CATALOG.forEach(s=>counts[s.status]=(counts[s.status]||0)+1);summary.textContent="Skills & traits coverage · "+SKILL_CATALOG.length+" audited · "+counts.Implemented+" implemented · "+counts.Partial+" partial · "+counts.Deferred+" deferred";section.append(summary);
 const intro=document.createElement("p");intro.textContent="The Skills laboratory can add abilities to practice players. These coverage labels describe supported interactions, not complete FFB parity. Optional abilities default on; their owner can turn them off before a roll.";section.append(intro);
 const table=document.createElement("table"),head=document.createElement("tr");for(const label of ["Skill / Trait","Category","Use","Status","Coverage / next dependency"]){const th=document.createElement("th");th.textContent=label;head.append(th);}table.append(head);
 for(const s of SKILL_CATALOG){const row=document.createElement("tr");for(const value of [s.name,s.category,s.kind+(s.mandatory?" · mandatory":""),s.status,s.notes]){const td=document.createElement("td");td.textContent=value;row.append(td);}table.append(row);}const wrap=document.createElement("div");wrap.className="table-scroll";wrap.append(table);section.append(wrap);document.getElementById("reference-view").append(section);
}
function matchRun(fn){fn();destination=null;blockMode=false;ballMode=false;throwDestination=null;render();}
function renderMatch(){
 const panel=document.getElementById("matchflow");panel.hidden=false;panel.replaceChildren();
 const title=document.createElement("h2");title.textContent=teams[0].name+" "+game.scores[0]+" – "+game.scores[1]+" "+teams[1].name;panel.append(title);
 const info=document.createElement("p");info.className="match-meta";const resources=[["Dwarfen Wisdom",game.dwarfenWisdom],["Bugman KO bonus",game.resourceChoices.map(r=>r.josefBugman)],["Rocks",game.rocks],["Wizards",game.wizards],["Apothecaries",game.apothecaries],["Bribes",game.bribes],["Mortuary Assistants",game.mortuaryAssistants],["Plague Doctors",game.plagueDoctors],["Mascots",game.mascots],["Weather Mages",game.weatherMages],["Biased Referees",game.biasedRefs],["Kegs",game.resourceChoices.map(r=>r.kegs)]].filter(([,values])=>values.some(n=>n>0));info.textContent="Half "+game.half+" · Drive "+game.drive+" · Turn markers "+game.turns.join(" / ")+" · "+game.weather+" · Fan Factors "+game.fans.join(" / ")+resources.map(([name,values])=>" · "+name+" "+values.join(" / ")).join("")+(game.learning?" · Learning rules: configured Dedicated Fans, Perfect Conditions, no Kick-off Event.":"");panel.append(info);
 const say=(text,kind="")=>{const p=document.createElement("p");p.textContent=text;p.className=kind;panel.append(p);};
 const add=(label,fn,kind="")=>{const b=button(label,()=>matchRun(fn));if(kind)b.className+=" "+kind;panel.append(b);};
 if(game.selectedStars?.some(list=>list.length)){for(const team of [0,1])if(game.selectedStars[team].length){const p=document.createElement("p");p.className="muted";p.textContent=teams[team].name+" star hires: "+game.selectedStars[team].map(id=>{const star=MATCH_STARS.find(s=>s.id===id);return star.name+(game.starsFinalized&&!game.players.some(p=>p.team===team&&p.star===id)?" (unavailable: hired by both teams)":"");}).join(" · ");panel.append(p);}}
 if(game.prayers?.some(list=>list.length)){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Active prayers · last until full time";details.append(summary);for(const team of [0,1])if(game.prayers[team].length){const p=document.createElement("p");p.textContent=teams[team].name+": "+game.prayers[team].map(name=>{const affected=game.prayerHistory.find(r=>r.team===team&&r.name===name);return name+(affected?.wasted?" (no eligible player)":affected?.players.length?" ("+affected.players.map(id=>{const p=game.players.find(p=>p.id===id);return teams[p.team].name+" #"+p.number;}).join(", ")+")":"");}).join(" · ");details.append(p);}panel.append(details);}
 if(["fans","weather","leagueSteps","rolloff"].includes(game.phase)){
  say(game.phase==="fans"?"Pre-game 1: determine the fans in attendance.":game.phase==="weather"?"Pre-game 2: determine the weather.":game.phase==="leagueSteps"?"Pre-game 3–4: league fixtures include Journeymen and funded inducements. Exhibitions use configured resources.":"Pre-game 5: roll off. The winning coach chooses which team kicks.","phase-instruction");
  if(game.phase==="fans"&&!game.league||game.phase==="leagueSteps"&&game.league){
   say(game.league?"Permanent staff are fixed. Buy supported inducements in CTV order using Petty Cash and permitted Treasury spending.":"Choose staff and supported inducements for this exhibition. Costs are shown; exhibition selections do not spend a saved team Treasury.","resource-summary");
   for(const team of [0,1]){
    const costs=game.resourceCosts(team),r=game.resourceChoices[team];
    say(teams[team].name+": "+r.teamRerolls+" team re-rolls, "+r.assistants+" assistant coaches, "+r.cheerleaders+" cheerleaders, "+r.dedicatedFans+" Dedicated Fans. Selected staff/re-rolls "+money(costs.staff)+", fan improvements "+money(costs.fans)+", inducements "+money(costs.inducements)+".","resource-summary");
    if(!game.league||game.leaguePurchaseOrder[game.leaguePurchaseStep]===team){if(game.league)say("Available inducement budget: "+money(game.leagueBudget(team))+". The higher CTV team completes purchases first. Choose Done to lock purchases.","resource-summary");add("Configure staff and inducements — "+teams[team].name,()=>game.configureResources(team),"resource-control");}
    if(!game.league&&teams[team].staff?.apothecary){say(teams[team].name+" apothecaries: "+game.apothecaries[team],"resource-summary");add((r.apothecary?"Remove":"Add")+" apothecary — "+teams[team].name,()=>game.setApothecary(team,!r.apothecary),"resource-control");}
    if(!game.league&&game.hasTeamRule(team,"Team Captain")){const captain=game.players.find(p=>p.team===team&&p.captain);say(teams[team].name+": "+(captain?"Team Captain #"+captain.number:"no Team Captain chosen"),"resource-summary");add("Choose Team Captain — "+teams[team].name,()=>game.configureCaptain(team),"resource-control");}
   }
  }
  add(game.phase==="fans"?"Determine fans":game.phase==="weather"?"Determine weather":game.phase==="leagueSteps"?(game.league?"Continue league pre-game":"Continue exhibition pre-game"):"Roll for kick or receive",()=>game.advancePregame(),"next-step");
 }else if(game.phase==="prayers")say("Underdog prayers: complete the owning coach's player or skill choices below. Effects last until full time; Riotous Rookies are added afterwards.");
 else if(game.phase==="kickChoice"){
  say(teams[game.rolloffWinner].name+" won the roll-off. Choose who kicks first.");for(const t of [0,1])add(teams[t].name+" kicks",()=>game.chooseKicking(t));
 }else if(game.phase==="setup"){
  say(teams[game.setupTeam].name+" sets up. Select a player, then an empty square in their own half. Central LOS needs three players; each Wide Zone permits two.");
  say(game.setupErrors().join(" ")||"Formation is legal. Confirm when ready.");
  for(const p of game.available(game.setupTeam))add("Select #"+p.number+" · "+playerLabel(p),()=>{selected=p.id;showProfile(p.team,p.role,p.number);},"setup-player");
  add("Use suggested formation",()=>game.autoSetup());if(game.players.some(p=>p.id===selected&&p.team===game.setupTeam&&game.onPitch(p)))add("Bench selected player",()=>game.benchSetup(selected));add("Confirm formation",()=>game.confirmSetup());
 }else if(game.phase==="dwarfenWisdom"){
  const s=game.wisdomState;say(teams[s.team].name+" Dwarfen Wisdom: choose whether to spend the once-per-match redeployment. After choosing players, select each lifted player below and click an empty square in your own half.");
  if(s.placing){for(const id of s.selected){const p=game.players.find(p=>p.id===id);add("Wisdom player #"+p.number,()=>{if(game.wisdomState!==s)return;selected=id;showProfile(p.team,p.role,p.number);});}say(game.setupErrors(s.team).join(" ")||"Formation is legal.");add("Finish Dwarfen Wisdom",()=>{if(game.wisdomState===s)game.finishDwarfenWisdom();});}
 }else if(game.phase==="swarming"){
  const s=game.swarmState;say(teams[s.team].name+" Swarming: "+s.placed.length+" / "+s.limit+" additional Linemen placed. Select a reserve Lineman, then click an empty square in your own half.");for(const id of s.eligible){const p=game.players.find(p=>p.id===id);add("Swarming Lineman #"+p.number,()=>{if(game.swarmState!==s)return;selected=id;showProfile(p.team,p.role,p.number);});}add("Finish Swarming",()=>{if(game.swarmState===s)game.finishSwarming();});
 }else if(game.phase==="kicker"){
  say(teams[game.kicking].name+": nominate a kicker outside the Wide Zones and away from the LOS when possible.");for(const p of game.eligibleKickers())add("Kicker #"+p.number+" · "+playerLabel(p),()=>game.nominateKicker(p.id));
 }else if(game.phase==="kickAim")say("Click any square in the receiving half to aim the kick; click the same square again to kick. Deviation and the Kick-off Event resolve before the ball lands.");
 else if(game.phase==="eventMove"||game.phase==="charge"){
  const e=game.eventState;say(e.kind+": "+teams[e.team].name+" · "+e.used.length+" / "+e.limit+" players used. "+(e.kind==="charge"?"Select an eligible Open player and declare Move or Blitz. End their activation before selecting the next. One player may declare Throw Team-mate. Kick Team-mate remains deferred.":"Select an eligible player below, then click an empty square. "+(e.kind==="snap"?"Each player moves at most one square.":"Finish with a legal formation.")));
  for(const id of e.eligible){const p=game.players.find(q=>q.id===id);if(!e.used.includes(id)||e.kind==="defence")add("Event player #"+p.number,()=>{selected=id;showProfile(p.team,p.role,p.number);});}
  if(e.kind==="defence"&&e.eligible.includes(selected)&&game.onPitch(game.players.find(p=>p.id===selected)))add("Lift selected for Solid Defence",()=>game.liftDefence(selected));
  add("Finish Kick-off Event",()=>game.finishEvent());
 }else if(game.phase==="touchback")say("Touchback: the receiving coach chooses who gets the ball below. If no one is standing, click an empty square in the receiving half.");
 else if(game.phase==="endDrive"){say("Drive ended. Resolve weather effects, recover Knocked-out players, expire drive effects, then set up the next drive or advance to half/full time.");add("Resolve end of drive and continue",()=>game.continueDrive());}
 else if(game.phase==="finished")say("Full time: "+(game.scores[0]===game.scores[1]?"draw":teams[game.scores[0]>game.scores[1]?0:1].name+" wins")+(game.league?". Open Teams & leagues to nominate MVPs and record this result.":". Reset to start a new match."));
 else if(game.phase==="play")say(teams[game.active].name+" to play. End team turn when finished; turnovers also advance play.");
 else if(game.phase==="betweenTurns")say("Between turns: "+teams[game.active].name+" may use an available Wizard or Rock. "+(game.pending?.spell?"Select a highlighted square and confirm the spell.":"Choose an option below. Throw a Rock selects a random standing opponent and hits on 4+."));
 else say("Resolve the pending kickoff decision below.");
 if(["play","charge"].includes(game.phase)){const p=game.players.find(p=>p.id===game.mover);if(p&&!game.pending&&game.starDistractionTargets(p).length)add("Use "+game.starDistraction(p),()=>{if(game.mover===p.id)game.offerStarDistraction(p);});}
 coach.textContent=teams[game.active].name+" · Half "+game.half+" · Turn "+game.turns[game.active];
 if(game.phase!=="play"&&game.phase!=="charge")selection.textContent="Match phase: "+game.phase+". Follow the current step in the coach panel.";
 document.getElementById("end").disabled=!!game.pending||game.finished||!["play","charge"].includes(game.phase);
 if(game.phase==="charge"&&game.action!=="blitz")document.getElementById("block").disabled=true;
}
function rosterRuleSummary(t){const rules=[...t.special];if(t.alignments?.length)rules.push("Favoured alignment: "+t.alignments.join(" / "));for(const [league,names] of Object.entries(t.leagueRules||{}))rules.push(league+": "+names.join(", "));for(const group of t.groupLimits||[])rules.push(group.label+": combined maximum "+group.max);return rules.length?rules.join(" · "):"No team special rules listed";}
function renderRosters(){
 document.getElementById("roster-list").innerHTML=rosterCatalog.map((t,team)=>{
 const total=t.lineup.reduce((n,r)=>n+t.positions[r].cost,0);
 return '<article class="panel" data-roster-name="'+escapeTeamText(t.name)+'"><div class="roster-heading"><h2>'+t.name+'</h2><span class="badge">Tier '+t.tier+'</span></div><p class="team-summary">'+(t.leagues||[t.league]).join(" / ")+' · '+rosterRuleSummary(t)+'</p><div class="table-scroll"><table><caption>Available positions · click a position to inspect</caption><thead><tr>'+["Position","Limit","MA","ST","AG","PA","AV","Skills & traits","Primary","Secondary","Cost"].map(h=>'<th scope="col">'+h+'</th>').join("")+'</tr></thead><tbody>'+t.positions.map((p,r)=>'<tr><td><button class="role-button" data-team="'+team+'" data-role="'+r+'">'+p.name+'</button><br><small>'+p.traits+'</small></td><td>0–'+p.max+'</td>'+["ma","st","ag","pa","av"].map(k=>'<td>'+p[k]+'</td>').join("")+'<td class="skills">'+p.skills.join(", ")+'</td><td>'+p.primary+'</td><td>'+p.secondary+'</td><td>'+money(p.cost)+'</td></tr>').join("")+'</tbody></table></div><p class="team-summary"><strong>Demo lineup:</strong> '+t.positions.map((p,r)=>({p,count:t.lineup.filter(v=>v===r).length})).filter(v=>v.count).map(v=>v.count+" × "+v.p.name).join(" · ")+'<br>11 players: '+money(total)+'. With 2 re-rolls: '+money(total+2*t.reroll)+'. These are demonstration selections, not a roster builder.</p><p class="muted">Re-roll: '+money(t.reroll)+' · Apothecary: '+(t.staff.apothecary?money(t.staff.apothecary):'unavailable')+' · Assistant coach: '+money(t.staff.assistantCoach)+' · Cheerleader: '+money(t.staff.cheerleader)+'</p><p class="muted">Advancement categories: A = Agility · D = Devious · G = General · P = Passing · S = Strength. Configure staff and basic inducements before an exhibition. Use League teams & progression to draft, save and develop your own team. Star players and their unique abilities are deferred.</p><a class="muted" href="'+t.source+'">Source of truth · reviewed '+t.reviewed+'</a></article>';
 }).join("");
 document.querySelectorAll(".role-button").forEach(button=>button.addEventListener("click",()=>{showProfile(0,Number(button.dataset.role),null,rosterCatalog[Number(button.dataset.team)]);if(globalThis.inspectRosterPosition)globalThis.inspectRosterPosition();else document.getElementById("profile").scrollIntoView({behavior:"smooth",block:"center"});}));
}

document.getElementById("special").addEventListener("click",()=>{
 const p=game.players.find(q=>q.id===game.mover)||game.players.find(q=>q.id===selected),names=game.specialActions(p);if(!names.length)return;
 if(game.action==="blitz"){render();return;}
 game.pending={type:"custom",kind:"Declare Foul / special action",options:[...names,"Cancel"],resolve:name=>{game.pending=null;if(name==="Multiple Block")game.chooseMultipleBlock(p);else if(name!=="Cancel")game.start(p.id,name==="Foul"?"foul":"special:"+name);destination=null;render();}};render();
});
document.getElementById("kick-mate").addEventListener("click",()=>{game.start(selected,"kick-team-mate");destination=null;ballMode=false;throwDestination=null;render();});
document.getElementById("throw-mate").addEventListener("click",()=>{game.start(selected,"throw-team-mate");destination=null;ballMode=false;throwDestination=null;render();});
for(const kind of ["pass","handoff"])document.getElementById(kind).addEventListener("click",()=>{game.start(selected,kind);destination=null;ballMode=false;throwDestination=null;render();});
document.getElementById("transfer").addEventListener("click",()=>{ballMode=!ballMode;throwDestination=null;destination=null;render();});
document.getElementById("start").addEventListener("click",()=>{game.start(selected);render();});
document.getElementById("block").addEventListener("click",()=>{if(game.action==="blitz"){game.blitzBlock();destination=null;render();return;}blockMode=blockMode===true?false:true;destination=null;render();});
document.getElementById("blitz").addEventListener("click",()=>{blockMode=blockMode==="blitz"?false:"blitz";destination=null;render();});
document.getElementById("secure").addEventListener("click",()=>{game.start(selected,"secure");destination=null;render();});
document.getElementById("finish").addEventListener("click",()=>{game.finish();destination=null;render();});
document.getElementById("end").addEventListener("click",()=>{game.endTurn();destination=null;selected=null;render();});
document.getElementById("reset").addEventListener("click",reset);
document.getElementById("scenario").addEventListener("change",reset);
renderRosters();renderSkillCoverage();reset();
