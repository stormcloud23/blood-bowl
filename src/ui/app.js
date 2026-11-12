
"use strict";
const teams=JSON.parse(document.getElementById("team-data").textContent);
const rosterCatalog=JSON.parse(document.getElementById("roster-data")?.textContent||document.getElementById("team-data").textContent);
const portraitCatalog=JSON.parse(document.getElementById("portrait-data")?.textContent||"{}");
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
const portraitRims={
 Lineman:"#bac3cd",Blitzer:"#ffe54c",Blocker:"#c84c68",Special:"#b48ce8",
 Thrower:"#65b5f6",Catcher:"#b6da62",Runner:"#36c3ad","Big Guy":"#f07839","Star Player":"#e4b84f"
};
function playerPortrait(roster,profile,star){
 return portraitCatalog[star?"star-players":roster.id]?.[profile.id];
}
function playerToken(roster,profile,{team,number,star,classes=""}){
 const marker=positionMarker(profile),portrait=playerPortrait(roster,profile,star);
 const token=document.createElement("span");
 token.className="token role-"+marker.shape+(team===1?" blue":"")+(portrait?" portrait-token":"")+(classes?" "+classes:"");
 token.dataset.role=marker.label;
 token.setAttribute("aria-hidden","true");
 if(portrait){
  token.setAttribute("style","--portrait-rim:"+portraitRims[star?"Star Player":marker.label]);
  const frame=document.createElement("span"),photo=document.createElement("img");
  frame.className="token-portrait";
  photo.alt="";
  photo.setAttribute("style",`width:${portrait.width}%;left:${portrait.left}%;top:${portrait.top}%`);
  frame.append(photo);
  token.append(frame);
  photo.addEventListener("error",()=>{
   token.classList.remove("portrait-token");
   frame.replaceWith(markerGraphic(marker));
  },{once:true});
  photo.src=portrait.url;
 }else{
  token.append(markerGraphic(marker));
 }
 if(number!=null){
  const badge=document.createElement("span");
  badge.className="token-number";
  badge.textContent=number;
  token.append(badge);
 }
 return token;
}
let blitzExecution=null,reactionExecution=null,ballExecution=null,foulExecution=null;
let game,selected=null,destination=null,blockMode=false,ballMode=false,throwDestination=null;
function reset(){if(globalThis.resetLeagueTeams)globalThis.resetLeagueTeams();const scenario=document.getElementById("scenario").value;game=scenario.startsWith("match")?new MatchGame(teams,{learning:scenario==="match-learning"}):new SkillGame(teams,{scenario});selected=game.practicePlayer;destination=null;blockMode=false;ballMode=false;throwDestination=null;render();const p=game.players.find(p=>p.id===selected);showProfile(p?.team??0,p?.role??0,p?.number??null);}
function escapeTeamText(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));}
function playerLabel(p){const profile=game.profile(p),name=p.leagueRecord?.name;return name&&name!==profile.name?name+" · "+profile.name:profile.name;}
function skillHelpText(name){
 if(typeof SKILL_DESCRIPTIONS==="undefined")return name;
 const base=name.replace(/\([^)]*\)/g,"").trim(),key=Object.keys(SKILL_DESCRIPTIONS).find(key=>key.replace(/\([^)]*\)/g,"").trim()===base);
 return SKILL_DESCRIPTIONS[name]||SKILL_DESCRIPTIONS[key]||"See Skills & traits in Reference for this ability.";
}
function showProfile(team,role,number,roster=null){
 const t=roster||teams[team],live=!roster&&number&&game.players.find(p=>p.team===team&&p.number===number),p=live?game.profile(live):t.positions[role],record=live?.leagueRecord,base=live?.star?p:t.positions[role],escape=escapeTeamText;
 const title=record?.name||p.name||base.name,source=/^https?:\/\//i.test(t.source||"")?t.source:"",cost=record?.value??p.cost??base.cost;
 document.getElementById("profile").innerHTML='<div class="eyebrow">'+escape(t.name)+'</div><h2>'+(number?'#'+number+' · ':'')+escape(title)+'</h2><p class="muted">'+(record?escape(p.name||base.name)+' · ':'')+escape(p.traits)+'</p><div class="stats">'+["ma","st","ag","pa","av"].map(k=>'<div class="stat"><small>'+k.toUpperCase()+'</small>'+escape(p[k])+'</div>').join("")+'</div><div class="profile-skills">'+p.skills.map(name=>'<details class="skill-help"><summary>'+escape(name)+'</summary><p>'+escape(skillHelpText(name))+'</p></details>').join("")+'</div><p class="muted">'+(live?.pairedStar?'Pair fee: ':record?'Current value: ':'Cost: ')+money(cost)+' · Limit: 0–'+escape(base.max)+'<br>Primary: '+escape(p.primary)+' · Secondary: '+escape(p.secondary)+(record?'<br>Saved SPP: '+escape(record.spp)+' · Niggling Injuries: '+escape(live.nigglingInjuries||0):'')+'</p>'+(source?'<a class="muted" href="'+escape(source)+'">2025 roster source</a>':'');
 if(playerPortrait(t,p,live?.star)){
  const portrait=playerToken(t,p,{team,number,star:live?.star,classes:"profile-portrait"});
  document.getElementById("profile").prepend(portrait);
 }
}


function planningPlayer(){
 if(game.observing)return null;
 const mover=game.players.find(p=>p.id===game.mover);if(mover)return mover;
 const p=game.players.find(p=>p.id===selected);return game.canStart(p)?p:null;
}
function plannedStart(p){
 return {x:p.x,y:p.y,spent:game.mover===p.id?p.spent:p.status==="prone"?game.standCost(p):0};
}
function onTheBallMove(q=game.pending){return !!(game.moveContext&&q?.kind==="On the Ball movement");}
function rangeFor(p){
 if(!p||game.finished||game.pending&&!onTheBallMove())return new Map();const start=plannedStart(p);
 if(!onTheBallMove())return game.search(p,start.x,start.y,start.spent);
 const forecast=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{pending:null});
 return forecast.search(p,start.x,start.y,start.spent);
}
function previewRoute(p){
 if(!p||!destination||destination.reactionContext&&destination.reactionContext!==game.moveContext)return null;const s=plannedStart(p);
 if(destination.playerId===p.id&&destination.startX===s.x&&destination.startY===s.y&&destination.startSpent===s.spent)return destination;
 return null;
}
function canPlanBallAction(player,kind){
 if(!player||game.pending||game.finished||player.team!==game.active||game.ball.carrier!==player.id||game.moveContext||game.dumpContext||game.bombContext)return false;
 return game.mover?game.mover===player.id&&game.action===kind&&!game.ballActionDone:game.canBallAction(player,kind);
}
function ballForecastFor(player,route,kind){
 const view=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{players:game.players.map(p=>({...p})),pending:null,mover:player.id,action:kind,ballActionDone:false,passContext:null});
 const actor=view.players.find(p=>p.id===player.id);
 Object.assign(actor,{x:route.x,y:route.y,spent:route.spent,status:"standing",distracted:game.mover===player.id?player.distracted:false});
 view.ball={x:actor.x,y:actor.y,carrier:actor.id};return view;
}
function previewBallTransfer(player,target){
 if(!player||!target||target.id===player.id||target.team!==player.team||!game.onPitch(target)||game.ball.carrier!==player.id)return false;
 const start=plannedStart(player),previous=previewRoute(player);
 const route=previous&&!previous.blockTarget&&!previous.blitzTarget&&!previous.foulTarget&&!previous.reactionContext?previous:{x:player.x,y:player.y,spent:start.spent,path:[]};
 const kind=game.mover&&["pass","handoff"].includes(game.action)?game.action:route.path.length&&game.distance(route,target)===1?"handoff":"pass";
 if(!canPlanBallAction(player,kind))return false;
 const view=ballForecastFor(player,route,kind),receiver=view.players.find(p=>p.id===target.id);
 if(kind==="handoff"?!view.canHandoff(receiver):!view.passPreview(target.x,target.y))return false;
 if(previous?.ballAction===kind&&previous.ballTarget===target.id&&previous.targetX===target.x&&previous.targetY===target.y){commitRoute();return true;}
 destination={...route,ballAction:kind,ballTarget:target.id,targetX:target.x,targetY:target.y,playerId:player.id,startX:start.x,startY:start.y,startSpent:start.spent};
 blockMode=false;ballMode=false;throwDestination=null;render();return true;
}
function continueBallRoute(){
 const run=ballExecution;if(!run)return;
 const player=game.players.find(p=>p.id===run.playerId),target=game.players.find(p=>p.id===run.targetId);
 if(run.game!==game||game.finished||game.mover!==run.playerId||game.action!==run.kind||game.ballActionDone||game.ball.carrier!==run.playerId||!target||target.x!==run.targetX||target.y!==run.targetY){ballExecution=null;return;}
 if(game.pending)return;
 if(player.status!=="standing"||player.distracted||player.x!==run.x||player.y!==run.y){ballExecution=null;return;}
 while(run.index<run.path.length){
  const next=run.path[run.index++];run.x=next.x;run.y=next.y;
  if(!game.step(next.x,next.y)){ballExecution=null;return;}
  if(game.pending)return;
  if(game.mover!==run.playerId||game.finished||game.ball.carrier!==run.playerId||player.status!=="standing"||player.x!==run.x||player.y!==run.y){ballExecution=null;return;}
 }
 ballExecution=null;
 if(run.kind==="handoff"){if(game.canHandoff(target))game.handoff(target.id);}
 else if(game.passPreview(target.x,target.y))game.pass(target.x,target.y);
}
function canPlanFoul(player){
 if(!player||game.pending||game.finished||player.team!==game.active||game.moveContext||game.dumpContext||game.bombContext||game.match&&game.phase!=="play")return false;
 return game.mover?game.mover===player.id&&game.action==="foul"&&!player.specialDone&&player.status==="standing"&&!player.distracted:game.specialActions(player).includes("Foul");
}
function foulTargetLegal(player,target){return !!(player&&target&&target.team!==player.team&&game.onPitch(target)&&["prone","stunned"].includes(target.status));}
function foulArmour(target){const value=game.profile(target).av,n=Number.parseInt(value);return Number.isFinite(n)?n+"+":String(value);}
function previewFoul(player,target){
 if(!foulTargetLegal(player,target)||!canPlanFoul(player))return false;
 const start=plannedStart(player),previous=previewRoute(player);
 if(previous?.foulTarget===target.id&&previous.targetX===target.x&&previous.targetY===target.y){commitRoute();return true;}
 const planned=previous?.foulTarget?previous.foulBaseRoute:previous,base=planned&&!planned.ballAction&&!planned.blockTarget&&!planned.blitzTarget&&!planned.reactionContext?planned:null,from=base||start;
 const approaches=game.distance(from,target)===1?[{x:from.x,y:from.y,spent:from.spent,path:[]}]:[...remainingRange(player,base).values()].filter(n=>game.distance(n,target)===1);
 approaches.sort((a,b)=>a.checks-b.checks||a.spent-b.spent||a.turns-b.turns||a.order-b.order);
 const route=approaches[0];if(!route)return false;
 destination={...route,path:[...(base?.path||[]),...route.path],foulBaseRoute:base,foulTarget:target.id,targetX:target.x,targetY:target.y,playerId:player.id,startX:start.x,startY:start.y,startSpent:start.spent};
 blockMode=false;ballMode=false;throwDestination=null;render();return true;
}
function continueFoulRoute(){
 const run=foulExecution;if(!run)return;
 const player=game.players.find(p=>p.id===run.playerId),target=game.players.find(p=>p.id===run.targetId);
 if(run.game===game&&!game.finished&&game.pending&&!game.mover&&player&&!player.used)return;
 if(run.game!==game||game.finished||game.mover!==run.playerId||game.action!=="foul"||!player||player.specialDone||!foulTargetLegal(player,target)||target.x!==run.targetX||target.y!==run.targetY){foulExecution=null;return;}
 if(game.pending)return;
 if(player.status!=="standing"||player.distracted||player.x!==run.x||player.y!==run.y){foulExecution=null;return;}
 while(run.index<run.path.length){
  const next=run.path[run.index++];run.x=next.x;run.y=next.y;
  if(!game.step(next.x,next.y)){foulExecution=null;return;}
  if(game.pending)return;
  if(game.mover!==run.playerId||game.finished||player.status!=="standing"||player.x!==run.x||player.y!==run.y){foulExecution=null;return;}
 }
 foulExecution=null;
 if(game.specialTargets().includes(target))game.performSpecial(target.id);
}
function previewBlock(player,target){
 if(!game.canBlock(player,target))return;
 if(destination?.blockTarget===target.id&&previewRoute(player)){commitRoute();return;}
 const start=plannedStart(player);
 destination={x:player.x,y:player.y,spent:start.spent,path:[],blockTarget:target.id,playerId:player.id,startX:start.x,startY:start.y,startSpent:start.spent};blockMode=false;render();
}
function blitzRoute(player,target){
 const limit=game.profile(player).ma+game.rushLimit(player);
 return [...rangeFor(player).values()].filter(n=>game.distance(n,target)===1&&n.spent<limit).sort((a,b)=>a.checks-b.checks||a.spent-b.spent||a.turns-b.turns||a.order-b.order)[0];
}
function blockLabel(count,ours){return count+" die "+(ours||count===1?"block":"uphill");}
function blockDifficulty(player,target,route,blitz){
 // Evaluate assists at the planned contact square on a separate board.
 const forecast=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{players:game.players.map(p=>({...p}))});
 const actor=forecast.players.find(p=>p.id===player.id),defender=forecast.players.find(p=>p.id===target.id);
 Object.assign(actor,{x:route?.x??player.x,y:route?.y??player.y,status:"standing",distracted:false,hornsBonus:blitz&&forecast.skill(actor,"Horns")?1:0});
 const assists=forecast.assists(actor,defender),a=+forecast.profile(actor).st+assists.offensive,d=+forecast.profile(defender).st+assists.defensive;
 const count=a===d?1:Math.max(a,d)>2*Math.min(a,d)?3:2,ours=a>=d;
 const risk=count===1?4:ours?(count===3?2:3):(count===3?6:5);
 const detail=count+" block "+(count===1?"die":"dice")+" · "+(ours?"you choose":"opponent chooses")+" · ST "+a+" vs "+d+" (including assists)"+(forecast.skill(actor,"Dauntless")?" · before Dauntless":"");
 return {risk,detail,label:blockLabel(count,ours)};
}
function previewBlitz(player,target){
 if(destination?.blitzTarget===target.id&&previewRoute(player)){commitRoute();return;}
 if(!game.canBlitz(player,target))return;
 const start=plannedStart(player),route=blitzRoute(player,target);if(!route)return;
 destination={...route,blitzTarget:target.id,playerId:player.id,startX:start.x,startY:start.y,startSpent:start.spent};blockMode=false;render();
}
function canCommitBlitzRoute(player,route,target){
 return !!(game.action==="blitz"&&!game.pending&&!game.blitzBlocked&&player&&player.id===game.mover&&route?.path.length&&target&&target.id===game.blitzTarget&&game.onPitch(target)&&game.blitzTargetLegal(player,target)&&game.distance(route,target)===1&&route.spent<game.profile(player).ma+game.rushLimit(player));
}
function executeBlitzRoute(player,route){
 blitzExecution={game,playerId:player.id,path:route.path,index:0,x:player.x,y:player.y};
 destination=null;continueBlitz();render();
}
function continueBlitz(){
 const run=blitzExecution;if(!run)return;
 if(run.game!==game||game.finished||game.mover!==run.playerId||game.action!=="blitz"||game.blitzBlocked){blitzExecution=null;return;}
 if(game.pending)return;
 const player=game.players.find(p=>p.id===run.playerId);
 if(player.status!=="standing"||player.distracted||player.x!==run.x||player.y!==run.y){blitzExecution=null;return;}
 while(run.index<run.path.length){
  const next=run.path[run.index++];run.x=next.x;run.y=next.y;
  if(!game.step(next.x,next.y)){blitzExecution=null;return;}
  if(game.pending)return;
  if(game.mover!==run.playerId||game.finished||player.status!=="standing"){blitzExecution=null;return;}
 }
 blitzExecution=null;if(game.canBlitzBlock())game.blitzBlock();
}
function remainingRange(p,route){
 if(!route)return rangeFor(p);
 if(game.pending&&!onTheBallMove()||game.finished||game.action==="secure"&&route.path.some(s=>s.plan.pickup))return new Map();
 // Forecast on a separate board: vacate the starting square and move the carried ball,
 // without changing the live player, dice, activation or movement allowance.
 const forecast=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{players:game.players.map(q=>({...q})),ball:{...game.ball},pending:onTheBallMove()?null:game.pending});
 const actor=forecast.players.find(q=>q.id===p.id);Object.assign(actor,{x:route.x,y:route.y,spent:route.spent,status:"standing"});
 if(forecast.ball.carrier===p.id||route.path.some(s=>s.plan.pickup))forecast.ball={x:actor.x,y:actor.y,carrier:p.id};
 return forecast.search(actor,actor.x,actor.y,route.spent);
}
function chooseReactionRoute(x,y){
 const player=game.moveContext.player,previous=previewRoute(player);
 if(player.x===x&&player.y===y){destination=null;render();return;}
 if(previous?.x===x&&previous?.y===y){commitRoute();return;}
 let route=remainingRange(player,previous).get(routeKey(x,y));
 const from=previous||plannedStart(player);
 if(route&&game.distance(from,{x,y})===1){
  const forecast=Object.assign(Object.create(Object.getPrototypeOf(game)),game,{pending:null});
  const plan=forecast.planFrom(player,x,y,from.x,from.y,from.spent);
  if(plan)route={x,y,spent:from.spent+plan.cost,path:[{x,y,plan}]};
 }
 if(!route?.path.length)return;
 const start=plannedStart(player);
 destination={...route,path:[...(previous?.path||[]),...route.path],playerId:player.id,startX:start.x,startY:start.y,startSpent:start.spent,reactionContext:game.moveContext};render();
}
function continueReactionRoute(){
 const run=reactionExecution;if(!run)return;
 if(run.game!==game||run.context!==game.moveContext||game.finished){reactionExecution=null;return;}
 if(!onTheBallMove())return;
 const player=run.context.player;
 if(player.status!=="standing"||player.distracted||player.x!==run.x||player.y!==run.y){reactionExecution=null;return;}
 while(run.index<run.path.length){
  const next=run.path[run.index],choice=pendingPitchChoices().find(pos=>pos.x===next.x&&pos.y===next.y);
  if(!choice){reactionExecution=null;return;}
  run.index++;run.x=next.x;run.y=next.y;
  if(!game.decide(choice.option)){reactionExecution=null;return;}
  if(game.moveContext!==run.context){reactionExecution=null;return;}
  if(!onTheBallMove())return;
  if(player.x!==run.x||player.y!==run.y){reactionExecution=null;return;}
 }
 reactionExecution=null;
}
function cancelMovementPreview(){destination=null;render();}
function routeKey(x,y){return x+","+y;}
function pendingPitchChoices(q=game.pending){
 if(!q)return [];
 const choices=q.type==="pushChoice"?q.options.filter(pos=>!pos.standFirm).map(pos=>({x:pos.x,y:pos.y,option:pos})):q.pitchChoices||[];
 return choices.filter(pos=>game.inside(pos.x,pos.y)&&q.options.includes(pos.option));
}
function onTheBallPresentation(q=game.pending){
 const targets=pendingPitchChoices(q);
 if(q?.kind==="On the Ball")return {selecting:true,players:new Set(targets.map(pos=>game.at(pos.x,pos.y)?.id).filter(Boolean))};
 if(game.moveContext&&(q?.kind==="On the Ball movement"||!targets.length))return {selecting:false,players:new Set([game.moveContext.player.id])};
 return null;
}
function kickDeviationPreview(){
 if(!game.match||game.phase!=="kickAim"||game.kickLanding||game.pending||!destination)return null;
 const kicker=game.players.find(p=>p.id===game.kicker),hasKick=game.skill(kicker,"Kick");
 const max=hasKick&&(!game.kickChoiceMade||game.kickDistanceHalved)?3:6,squares=new Map();
 for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])for(let distance=1;distance<=max;distance++){
  const x=destination.x+dx*distance,y=destination.y+dy*distance;
  if(game.inside(x,y))squares.set(routeKey(x,y),true);
 }
 return {squares};
}
function visibleKickLanding(){
 const pos=game.kickLanding;
 return game.match&&!game.kickTouchback&&["kickAim","kickEvent","eventMove","charge"].includes(game.phase)&&pos&&game.inside(pos.x,pos.y)?pos:null;
}
function resolvePitchChoice(q,choice){
 if(game.pending!==q||!pendingPitchChoices(q).some(pos=>pos.x===choice.x&&pos.y===choice.y&&pos.option===choice.option))return false;
 if(q.type==="pushChoice")q.resolve(choice.option);else game.decide(choice.option);
 destination=null;throwDestination=null;blockMode=false;ballMode=false;render();return true;
}
function resolvePushChoice(q,pos){
 if(game.pending!==q||!q.options.includes(pos))return;
 q.resolve(pos);destination=null;throwDestination=null;ballMode=false;blockMode=false;render();
}
function choose(x,y,pushDecision=game.pending){
 if(pushDecision!==game.pending)return;
 if(onTheBallMove(pushDecision)){chooseReactionRoute(x,y);return;}
 if(game.match&&game.pending?.spell){game.aimSpell(x,y);render();return;}
 const targets=pendingPitchChoices(pushDecision);
 if(targets.length){const choice=targets.find(pos=>pos.x===x&&pos.y===y);if(choice)resolvePitchChoice(pushDecision,choice);else selection.textContent="Choose a highlighted decision target on the pitch.";return;}
 if(pushDecision?.type==="pushChoice"){
  if(game.pending!==pushDecision)return;
  const pos=pushDecision.options.find(pos=>!pos.standFirm&&pos.x===x&&pos.y===y);
  if(pos)resolvePushChoice(pushDecision,pos);else selection.textContent="Choose a gold push square. Use the side-panel buttons for a crowd push or Stand Firm.";
  return;
 }
 if(game.pending)return;
 const p=game.at(x,y);
 if(game.match&&!["play","charge"].includes(game.phase)){
  if(game.phase==="setup"||game.phase==="eventMove"||game.phase==="swarming"||game.phase==="dwarfenWisdom"){
   const team=game.phase==="setup"?game.setupTeam:game.phase==="swarming"?game.swarmState.team:game.phase==="dwarfenWisdom"?game.wisdomState.team:game.eventState.team;
   if(p?.team===team){
    const swapped=game.phase==="setup"&&selected&&selected!==p.id&&game.placeSetup(selected,x,y);
    if(swapped)selected=null;else selected=p.id;
    const chosen=game.players.find(q=>q.id===selected);if(chosen)showProfile(chosen.team,chosen.role,chosen.number);
   }
   else if(selected){if(game.phase==="setup"){if(game.placeSetup(selected,x,y))selected=null;}else if(game.phase==="swarming")game.placeSwarm(selected,x,y);else if(game.phase==="dwarfenWisdom")game.placeWisdom(selected,x,y);else game.eventPlace(selected,x,y);}
  }else if(game.phase==="kickAim"){
   if(destination?.x===x&&destination?.y===y){if(game.skill(game.players.find(p=>p.id===game.kicker),"Kick")&&!game.kickChoiceMade){game.kickChoiceMade=true;game.kickDistanceHalved=true;}game.kick(x,y);destination=null;}else if(game.ownHalf(game.receiving,x))destination={x,y};
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
  if(blockMode==="blitz"){
   if(p&&game.canBlitz(attacker,p)){matchRun(()=>game.startBlitz(attacker.id,p.id));}
   else selection.textContent="Choose a highlighted Blitz target.";
   return;
  }
  if(p&&game.canBlock(attacker,p)){game.block(attacker.id,p.id);blockMode=false;destination=null;render();}
  else selection.textContent="Choose a highlighted Standing opponent next to the selected player.";
  return;
 }
 if(game.pending)return;
 const blitzActor=game.players.find(q=>q.id===selected);
 if(p&&!destination?.blitzTarget&&game.canBlock(blitzActor,p)){previewBlock(blitzActor,p);return;}
 if(p&&game.canBlitz(blitzActor,p)){previewBlitz(blitzActor,p);return;}
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
 const player=planningPlayer();if(!player||!destination||game.pending&&!onTheBallMove())return;
 const route=previewRoute(player);if(!route)return;
 if(route.foulTarget){
  const target=game.players.find(p=>p.id===route.foulTarget);if(!canPlanFoul(player)||!foulTargetLegal(player,target)||target.x!==route.targetX||target.y!==route.targetY)return;
  if(!game.mover&&!game.start(player.id,"foul"))return;
  foulExecution={game,playerId:player.id,targetId:target.id,targetX:target.x,targetY:target.y,path:route.path,index:0,x:player.x,y:player.y};destination=null;ballMode=false;throwDestination=null;continueFoulRoute();render();return;
 }
 if(route.ballAction){
  const target=game.players.find(p=>p.id===route.ballTarget);if(!canPlanBallAction(player,route.ballAction)||!target||target.x!==route.targetX||target.y!==route.targetY)return;
  if(!game.mover&&!game.start(player.id,route.ballAction))return;
  ballExecution={game,kind:route.ballAction,playerId:player.id,targetId:target.id,targetX:target.x,targetY:target.y,path:route.path,index:0,x:player.x,y:player.y};destination=null;throwDestination=null;ballMode=false;continueBallRoute();render();return;
 }
 if(route.reactionContext){
  if(!onTheBallMove()||route.reactionContext!==game.moveContext)return;
  reactionExecution={game,context:game.moveContext,path:route.path,index:0,x:player.x,y:player.y};destination=null;continueReactionRoute();render();return;
 }
 if(route.blockTarget){destination=null;game.block(player.id,route.blockTarget);render();return;}
 if(route.blitzTarget){
  if(!game.startBlitz(player.id,route.blitzTarget))return;
  executeBlitzRoute(player,route);return;
 }
 if(!game.mover){if(!game.start(player.id,"move"))return;if(game.pending||game.mover!==player.id||game.finished){destination=null;render();return;}}
 for(const next of route.path){
  if(game.mover!==player.id||game.pending||game.finished||!game.step(next.x,next.y))break;
  if(game.pending||game.mover!==player.id||game.finished)break;
 }
 destination=null;render();
}
// Display engine forecasts only: targeting never rolls dice or changes the game.
function throwingOverlay(x,y,board=game,enabled=ballMode){
 if(!enabled||board.pending)return null;
 if(board.action==="handoff"){
  const target=board.at(x,y);if(!board.canHandoff(target))return null;
  const unable=board.has(target,"No Ball")||board.has(target,"Ball & Chain"),catching=unable?null:Math.max(2,Math.min(6,board.forecastTarget(target,"Catch",Number.parseInt(board.profile(target).ag)+board.marking(target))));
  return {range:"handoff",risk:catching??6,label:catching===null?"×":catching+"+",detail:"Hand-off · Catch "+(catching===null?"unavailable":catching+"+")};
 }
 const teammate=["throw-team-mate","kick-team-mate"].includes(board.action);
 if(!teammate&&board.action!=="pass")return null;
 const preview=teammate?board.throwPreview(x,y):board.passPreview(x,y);if(!preview)return null;
 const roll=n=>Number.isFinite(n)?Math.max(2,Math.min(6,n)):null;
 let accuracy=roll(preview.target),catching=null;
 const actor=teammate?board.throwActor():board.ballActor("pass"),target=board.at(x,y);
 const range=preview.hail?"H":preview.partner?"P":["Q","S","L","B"][preview.band];
 const details=[preview.name];
 if(preview.hail){
  accuracy=roll(2+preview.target-Number.parseInt(board.profile(actor).pa));
  details.push(accuracy===null?"PA –: automatic fumble":"Avoid fumble "+accuracy+"+", "Always scatters; catch depends on the landing square");
 }else {
  details.push(accuracy===null?"PA –: automatic fumble":(teammate?"Superb Throw ":"Accurate pass ")+accuracy+"+");
  if(teammate)details.push("Scatters before landing; landing roll is not included in this color");
  else if(target&&target.team===actor.team){
   const unable=target.status!=="standing"||target.distracted||board.has(target,"No Ball");
   catching=unable?null:roll(board.forecastTarget(target,"Catch",board.landingTarget(target,{kind:"pass",accurate:true,accurateToPlayer:true})));
   if(catching===null){details.push("Cannot catch in current state");}
   else {details.push("Catch "+catching+"+ (accurate delivery)");}
   if(target.team!==actor.team)details.push("Opposing player");
  }else details.push(target?"Opposing target; enemy labels show interception risk for passes over them":"Empty target; Diving Catch or bounce may follow");
 }
 return {range,band:preview.band,risk:accuracy??6,label:target&&(teammate||target.team===actor.team)?(accuracy===null?"×":accuracy+"+")+(teammate?"":"/"+(preview.hail?"?":catching===null?"×":catching+"+")):null,detail:details.join(" · ")};
}
function passingInterceptions(board=game,enabled=ballMode,target=throwDestination){
 const threats=new Map(),actor=enabled&&board.action==="pass"&&!board.pending&&board.ballActor("pass");
 if(!actor||!Number.isFinite(Number.parseInt(board.profile(actor).pa)))return threats;
 const destinations=target?[target]:Array.from({length:390},(_,i)=>({x:i%26,y:Math.floor(i/26)}));
 for(const pos of destinations){
  const preview=board.passPreview(pos.x,pos.y);if(!preview||preview.hail)continue;
  for(const p of board.interceptionCandidates(actor,pos)){
   if(board.has(p,"Ball & Chain"))continue;
   const needed=bonus=>Math.max(2,Math.min(6,board.forecastTarget(p,"Intercept",Number.parseInt(board.profile(p).ag)+bonus+board.marking(p))));
   threats.set(p.id,{label:needed(3)+"+",risk:6,range:"interception",detail:"Interception risk · Accurate pass: "+needed(3)+"+ · Inaccurate pass: "+needed(2)+"+"});
  }
 }
 return threats;
}
function render(){
 continueBlitz();continueBallRoute();continueFoulRoute();continueReactionRoute();
 if(destination?.reactionContext&&destination.reactionContext!==game.moveContext)destination=null;
 if(game.bombActor()){const p=game.bombActor();ballMode=true;if(selected!==p.id)showProfile(p.team,p.role,p.number);selected=p.id;}
 if(ballMode&&!(["throw-team-mate","kick-team-mate"].includes(game.action)?game.throwActor():game.ballActor(game.action))){ballMode=false;throwDestination=null;}
 if(blockMode&&(game.mover||game.pending))blockMode=false;
 const mover=game.players.find(p=>p.id===game.mover),inspected=game.moveContext?.player||game.players.find(p=>p.id===selected);
 const planner=planningPlayer(),chosen=previewRoute(planner),range=ballMode||chosen?.ballAction||chosen?.foulTarget?new Map():remainingRange(planner,chosen);
 const ballBoard=chosen?.ballAction?ballForecastFor(planner,chosen,chosen.ballAction):game,ballTargeting=ballMode||!!chosen?.ballAction;
 const blockAttacker=blockMode?game.players.find(p=>p.id===selected):null;
 const pushDecision=game.pending?.type==="pushChoice"?game.pending:null;
 const pitchDecision=game.pending,pitchTargets=new Map((onTheBallMove()?[]:pendingPitchChoices(pitchDecision)).map(pos=>[routeKey(pos.x,pos.y),pos]));
 const onTheBall=onTheBallPresentation(pitchDecision),kickLanding=visibleKickLanding(),kickPreview=kickDeviationPreview();
 const placementTargets=new Set((game.match&&game.phase!=="setup"?game.placementSquares(selected):[]).map(pos=>routeKey(pos.x,pos.y)));
 const interceptions=passingInterceptions(ballBoard,ballTargeting,chosen?.ballAction?{x:chosen.targetX,y:chosen.targetY}:throwDestination);
 const routeIndices=new Map((chosen?.path||[]).map((step,i)=>[routeKey(step.x,step.y),i+1]));
 const routePlans=new Map((chosen?.path||[]).map(step=>[routeKey(step.x,step.y),step.plan]));
 pitch.replaceChildren();
 for(let y=0;y<15;y++)for(let x=0;x<26;x++){
  const p=game.at(x,y),reach=range.get(routeKey(x,y)),plan=routePlans.get(routeKey(x,y))||reach?.path.at(-1)?.plan,cell=document.createElement("button"),routeIndex=routeIndices.get(routeKey(x,y)),blockTarget=!!(p&&(p.id===chosen?.blitzTarget||p.id===chosen?.blockTarget))||!!(blockAttacker&&p&&blockMode===true&&game.canBlock(blockAttacker,p));
  const blitzTarget=p&&(blockMode==="blitz"?game.canBlitz(blockAttacker,p):game.action==="blitz"&&!game.blitzBlocked&&p.id===game.blitzTarget);
  const blockForecast=blockTarget?blockDifficulty(blockAttacker||planner,p,chosen,!!chosen?.blitzTarget):null;
  const checks=plan&&planner?planChecks(plan,planner):[],risky=checks.length>0;
  cell.type="button";cell.className="square"+((x+y)%2===0?" turf-light":"")+(x===0?" endzone endzone-left":x===25?" endzone endzone-right":"")+(x===12?" middle":"")+(y===3||y===10?" wide":"")+(p&&p.id===(game.moveContext?.player.id??selected)&&(!onTheBall||onTheBall.players.has(p.id))?" selected":"")+(reach&&reach.path.length||routeIndex?" legal":"")+(risky?" risk risk-"+Math.max(...checks.map(check=>Number(check.match(/([2-6])\+/)?.[1]||2))):"")+(plan?.jump?" jump":"")+(routeIndex?" route":"")+(destination?.x===x&&destination?.y===y?" destination":"")+(blockTarget?" block-target risk risk-"+blockForecast.risk:"");
  if(p&&p.id===chosen?.foulTarget){
   const armour=foulArmour(p),badge=document.createElement("span");badge.className="throw-range-label foul-armour-label";badge.textContent=armour;badge.setAttribute("aria-hidden","true");cell.append(badge);cell.className+=" foul-target destination";cell.dataset.foulArmour=armour;
  }
  const ballTarget=ballTargeting&&(["throw-team-mate","kick-team-mate"].includes(ballBoard.action)?!!ballBoard.throwPreview(x,y):ballBoard.action==="handoff"?ballBoard.canHandoff(ballBoard.at(x,y)):!!ballBoard.passPreview(x,y));
  if(ballTarget)cell.className+=" legal";
  const interception=interceptions.get(p?.id),throwing=interception||throwingOverlay(x,y,ballBoard,ballTargeting);
  if(throwing){cell.className+=" throw-range risk risk-"+throwing.risk+(interception?" interception-risk":"");cell.dataset.throwRange=throwing.range;cell.dataset.throwDifficulty=String(throwing.risk);}
  if(game.match&&game.pending?.spell&&game.spellTargets(game.pending.spell,x,y).length){cell.className+=" kick-target";cell.setAttribute("data-spell-target",game.pending.spell);}
  if(throwDestination?.x===x&&throwDestination?.y===y||p&&p.id===chosen?.ballTarget)cell.className+=" destination";
  const label=p?teams[p.team].name+" #"+p.number+" "+playerLabel(p)+" ("+p.status+(p.distracted?", distracted":"")+(p.used?", activated":"")+")":"empty";
  const ballHere=game.ball.carrier?p?.id===game.ball.carrier:game.ball.x===x&&game.ball.y===y;
  cell.setAttribute("aria-label","Square "+(x+1)+", "+(y+1)+", "+label+(ballHere?", ball":"")+(routeIndex?", route step "+routeIndex:""));cell.title=blockTarget?"Valid Block target · "+label:routeIndex?"Route step "+routeIndex+" of "+chosen.path.length+" · "+label:reach?.path.length?"Reachable in "+reach.spent+" movement · "+label:label;
  if(blitzTarget){const detail=canCommitBlitzRoute(planner,chosen,p)?"Click to follow the planned route and Blitz":"Blitz target";cell.className+=" block-target";cell.title=detail+" · "+label;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+detail);}
  if(p&&p.id===chosen?.foulTarget){const detail="Foul target · Armour "+foulArmour(p);cell.title+=" · "+detail;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+detail);}
  if(blockForecast){cell.title+=" · "+blockForecast.detail;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+blockForecast.detail);cell.dataset.blockDifficulty=String(blockForecast.risk);}
  if(plan){const detail=checks.length?checks.join(" → "):"no roll on this step";cell.title+=" · "+detail;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+detail);}
  if(throwing){if(throwing.label){const badge=document.createElement("span");badge.className="throw-range-label";badge.textContent=throwing.label;badge.setAttribute("aria-hidden","true");cell.append(badge);}cell.title+=" · "+throwing.detail;cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+throwing.detail);}
  const deviation=kickPreview?.squares.get(routeKey(x,y));
  if(deviation){
   cell.className+=" kick-deviation";
   cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", possible kick deviation");
  }
  if(y===7&&(x===6||x===19)){const spot=document.createElement("span");spot.className="sweet-spot";spot.setAttribute("aria-hidden","true");cell.append(spot);cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", kick sweet spot");}
  if(game.match&&((x===6&&y===1)||(x===19&&y===13))){cell.className+=" trapdoor";if(game.onTrapdoor({x,y})){cell.className+=" trapdoor-active";cell.title+=" · Trapdoor: falls through on 1";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", trapdoor (2+ to cross)");const marker=document.createElement("span");marker.className="trapdoor-marker";marker.textContent="⊠";marker.setAttribute("aria-hidden","true");cell.append(marker);}else {cell.title+=" · Closed trapdoor";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", closed trapdoor");}}
  if(p){
   const profile=game.profile(p),marker=positionMarker(profile),available=onTheBall?.players.has(p.id);
   const classes=[p.status];
   if(p.used&&p.id!==game.mover&&!available)classes.push("used");
   if(p.distracted)classes.push("distracted");
   if(onTheBall)classes.push(available?"reaction-available":"reaction-unavailable");
   const token=playerToken(game.teams[p.team],profile,{team:p.team,number:p.number,star:p.star,classes:classes.join(" ")});
   cell.append(token);
   const markerDescription=playerPortrait(game.teams[p.team],profile,p.star)?" portrait":" marker ("+marker.shape+")";
   cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+marker.label+markerDescription+(onTheBall?(available?", On the Ball reactor":", not available for On the Ball"):""));
  }
  if(routeIndex){const n=document.createElement("span");n.className="route-index";n.textContent=routeIndex;cell.append(n);}
  if(game.bomb&&game.bomb.x===x&&game.bomb.y===y){const b=document.createElement("span");b.className="ball";b.textContent="●";b.title="Bomb";cell.append(b);cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", bomb");}
  const landingHere=kickLanding?.x===x&&kickLanding?.y===y;
  if(ballHere||landingHere){const b=document.createElement("span");b.className="ball"+(landingHere?" airborne-ball":"");b.textContent="◆";b.title=landingHere?"Expected kick landing square — ball still airborne":"Ball";cell.append(b);}
  if(landingHere){cell.className+=" kick-landing";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", expected kick landing square, ball still airborne");}
  const pushOption=pushDecision?.options.find(pos=>!pos.standFirm&&pos.x===x&&pos.y===y);
  if(pushOption){
   cell.className+=" push-option";cell.title="Click to push here"+(p?" — chain push #"+p.number:"");
   cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", push destination"+(p?", chain push":""));
   const marker=document.createElement("span");marker.className="push-marker";marker.textContent="↪";marker.setAttribute("aria-hidden","true");cell.append(marker);
  }
  if(pushDecision&&pushDecision.target===p){cell.className+=" push-subject";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", player being pushed");}
  if(pitchTargets.has(routeKey(x,y))&&!pushDecision){
   cell.className+=onTheBall?.selecting?" reaction-choice":" tile-choice";cell.title=pitchDecision.kind+" — click this highlighted target";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", "+pitchDecision.kind+" decision target");
   if(!onTheBall){const marker=document.createElement("span");marker.className="push-marker";marker.textContent="◎";marker.setAttribute("aria-hidden","true");cell.append(marker);}
  }
  if(p&&pitchDecision?.subjectId===p.id&&!onTheBall){cell.className+=" tile-subject";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", player resolving "+pitchDecision.kind);}
  if(placementTargets.has(routeKey(x,y))){cell.className+=" tile-choice";cell.title=game.phase==="touchback"?"Place the touchback ball here":p?"Swap with or replace this teammate":"Place the selected player here";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", legal "+game.phase+" placement");}
  if(game.match&&game.phase==="kickAim"&&!game.kickLanding&&game.ownHalf(game.receiving,x)){cell.className+=" kick-target";cell.title="Kick target in "+teams[game.receiving].name+" half — click to aim, repeat to kick";cell.setAttribute("aria-label",cell.getAttribute("aria-label")+", valid kick target");}
  cell.addEventListener("click",()=>choose(x,y,pitchDecision));pitch.append(cell);
 }
 coach.textContent=game.bombActor()?teams[game.bombActor().team].name+(game.bombContext.rethrows?" · Must rethrow bomb":" · Throw Bomb"):teams[game.active].name+" · Turn "+game.turns[game.active];
 selection.textContent=game.finished?"Practice drive complete.":blockMode?"Targeting for #"+(blockAttacker?.number??"?")+".":inspected?"#"+inspected.number+" "+playerLabel(inspected)+" · "+inspected.status+(inspected.distracted?" · Distracted":"")+(inspected.used?" · activated this turn":""):"No player selected.";
 const throwingKey=document.getElementById("throwing-key");
 throwingKey.hidden=true;throwingKey.textContent="";
 const movement=document.getElementById("movement");
 movement.textContent=(game.blockAction?blockLabel(game.blockAction.count,game.blockAction.chooserTeam===game.blockAction.attacker.team):mover?"#"+mover.number+" · MA "+mover.spent+" / "+game.movementAllowance(mover)+" · Rush "+Math.max(0,mover.spent-game.profile(mover).ma)+" / "+game.rushLimit(mover):planner?"#"+planner.number+" · MA "+game.profile(planner).ma+" · Rush "+game.rushLimit(planner):"")+(planner||mover||game.blockAction?" · ":"")+"Re-rolls: "+game.rerollsAvailable(game.active)+(game.action==="blitz"?" · Blitz #"+game.players.find(p=>p.id===game.blitzTarget)?.number+(game.blitzBlocked?" · block completed":""):"");
 if(game.moveContext)movement.textContent="#"+game.moveContext.player.number+" · On the Ball · "+game.moveContext.player.spent+" / 3 squares";
 const choices=document.getElementById("choices");choices.replaceChildren();
 if(blockMode)choices.append(button(blockMode==="blitz"?"Cancel Blitz targeting":"Cancel Block targeting",()=>{blockMode=false;render();}));
 if(game.canBlitzBlock())choices.append(button("Blitz Block (1 MA)",()=>document.getElementById("block").click()));
 if(chosen?.foulTarget){const target=game.players.find(p=>p.id===chosen.foulTarget),detail=document.createElement("p");detail.textContent="Foul #"+target.number+" · AV "+foulArmour(target);choices.append(detail);}
 if(chosen?.ballAction){
  const target=ballBoard.players.find(p=>p.id===chosen.ballTarget),overlay=throwingOverlay(target.x,target.y,ballBoard,true),detail=document.createElement("p");
  detail.textContent=(chosen.ballAction==="handoff"?"Hand-off":"Pass")+" #"+target.number+" · "+(chosen.ballAction==="handoff"?"Catch ":"")+(overlay?.label||"×");choices.append(detail);
 }
 if(chosen?.blockTarget||chosen?.blitzTarget){
  const target=game.players.find(p=>p.id===(chosen.blockTarget||chosen.blitzTarget)),forecast=blockDifficulty(planner,target,chosen,!!chosen.blitzTarget),detail=document.createElement("p");
  detail.textContent=forecast.label;choices.append(detail);
 }
 if(chosen&&!ballMode){const remaining=document.createElement("p");remaining.textContent=chosen.reactionContext?"After preview · "+Math.max(0,3-chosen.spent)+" squares remaining":"After preview · MA "+Math.max(0,(chosen.reactionContext?3:game.profile(planner).ma)-chosen.spent-(chosen.blitzTarget?1:0))+" · Rush "+Math.max(0,game.rushLimit(planner)-Math.max(0,chosen.spent+(chosen.blitzTarget?1:0)-(chosen.reactionContext?3:game.profile(planner).ma)))+" remaining";if(!chosen.blockTarget&&(!(chosen.ballAction||chosen.foulTarget)||chosen.path.length))choices.append(remaining);const routeGame=game;choices.append(button(chosen.foulTarget?"Confirm Foul":chosen.ballAction==="handoff"?"Confirm Hand-off":chosen.ballAction==="pass"?"Confirm Pass":chosen.blockTarget?"Confirm Block":chosen.blitzTarget?"Confirm Blitz":"Confirm Move",()=>{if(game===routeGame&&destination===chosen&&(!game.pending||onTheBallMove()))commitRoute();}));choices.append(button("Cancel preview",()=>{if(game===routeGame&&destination===chosen&&(!game.pending||onTheBallMove()))cancelMovementPreview();}));}
 if(ballMode&&["throw-team-mate","kick-team-mate"].includes(game.action)){
  const p=document.createElement("p"),preview=throwDestination&&game.throwPreview(throwDestination.x,throwDestination.y);p.textContent=preview?preview.name+" · "+(Number.isFinite(preview.target)?"Superb Throw "+Math.min(6,preview.target)+"+":"PA –: automatic fumble")+" · #"+preview.mate.number:"Throw team-mate · no target";choices.append(p);
 }else if(ballMode){
  const p=document.createElement("p"),target=throwDestination&&game.at(throwDestination.x,throwDestination.y),preview=throwDestination&&game.passPreview(throwDestination.x,throwDestination.y);
  p.textContent=throwDestination?(game.action==="handoff"?"Hand-off to #"+target.number+" · Catch "+Math.min(6,game.forecastTarget(target,"Catch",Number.parseInt(game.profile(target).ag)+game.marking(target)))+"+":preview.name+" · "+(Number.isFinite(preview.target)?"Pass "+Math.min(6,preview.target)+"+":"PA –: automatic fumble")+(target?" · Catch "+Math.min(6,Math.max(2,game.forecastTarget(target,"Catch",game.landingTarget(target,{kind:"pass",accurate:true,accurateToPlayer:true}))))+"+ (accurate delivery)":" · empty target")) :game.action+" · no target";if(game.action==="bomb")p.textContent=(throwDestination?"Throw Bomb · "+preview.name+" · "+(Number.isFinite(preview.target)?"PA "+Math.min(6,Math.max(2,preview.target))+"+":"PA –: automatic fumble") :"Throw Bomb · no target");choices.append(p);
 }
 if(game.pending){
  const q=game.pending;
  if(q.type==="blockSelect"){
   const {attacker:actor,target,chooserTeam}=game.blockAction,p=document.createElement("p");p.textContent=teams[chooserTeam].name+" chooses · "+teams[actor.team].name+" #"+actor.number+" blocks "+teams[target.team].name+" #"+target.number;choices.append(p);
   game.blockAction.dice.forEach((die,i)=>choices.append(button("Die "+(i+1)+" · "+game.blockFace(die),()=>{if(game.pending!==q)return;game.selectBlockDie(i);destination=null;render();})));
   if(!game.blockAction.poolLocked){
    for(const source of game.rerollSources(actor))choices.append(button(source==="Team"?"Team re-roll":"Re-roll · "+source,()=>{if(game.pending!==q)return;game.rerollBlock(source);render();}));
    if(!game.blockAction.blitz&&game.has(actor,"Brawler")&&!game.blockAction.brawlerUsed)game.blockAction.dice.forEach((die,i)=>{if(game.blockFace(die)==="Both Down")choices.append(button("Brawler re-roll die "+(i+1),()=>{game.rerollBlock("Brawler",i);render();}));});
    if(game.match)for(const indices of game.savageBlockSelections())choices.append(button("Savage Blow re-roll dice "+indices.map(i=>i+1).join(", "),()=>{if(game.pending!==q)return;game.rerollBlock("Savage Blow",indices);render();}));
    if(game.match)for(const source of game.starBlockSources())game.blockAction.dice.forEach((die,i)=>choices.append(button(source+" re-roll die "+(i+1),()=>{if(game.pending!==q)return;game.rerollBlock(source,i);render();})));
    if(game.has(actor,"Pro")&&!actor.proUsed)choices.append(button("Use Pro",()=>{game.rerollBlock("Pro");render();}));
   }
  }else if(q.type==="blockProChoose"){
   const p=document.createElement("p");p.textContent="Pro · re-roll one die";choices.append(p);
   game.blockAction.dice.forEach((die,i)=>choices.append(button("Re-roll die "+(i+1)+" · "+game.blockFace(die),()=>{game.rerollBlockDie(i);render();})));
  }else if(q.type==="pushChoice"){
   const p=document.createElement("p");p.textContent=(q.kind==="Chain push"?"Chain push: ":"")+"Push #"+q.target.number;choices.append(p);
   q.options.filter(pos=>pos.standFirm||!game.inside(pos.x,pos.y)).forEach(pos=>{const label=pos.standFirm?"Use Stand Firm":"Push into the Crowd — "+(pos.y<0?"top":pos.y>14?"bottom":pos.x<0?"left":"right")+" edge";choices.append(button(label,()=>resolvePushChoice(q,pos)));});
  }else if(q.type==="custom"){
   const targets=pendingPitchChoices(q),p=document.createElement("p");p.textContent=q.kind==="Stand Firm"&&q.target?"Stand Firm · "+teams[q.target.team].name+" #"+q.target.number+" "+playerLabel(q.target):deskDecisionTitle(q);if(!onTheBallMove())choices.append(p);
   q.options.filter(option=>!targets.some(pos=>pos.option===option)).forEach(option=>choices.append(button(option.replace(/ \(\d+-\d+\)/g,""),()=>{if(game.pending!==q)return;game.decide(option);destination=null;render();})));
  }else{
   const p=document.createElement("p");p.textContent=q.kind+" · roll "+q.roll+" / "+Math.min(6,Math.max(2,q.target))+"+ · "+(q.lookAhead?"Diving Tackle pending":"failed");choices.append(p);
   for(const option of [...q.options,"Accept"])choices.append(button(option==="Team"?"Use team re-roll":option==="Accept"?(q.lookAhead?"Keep this result":"Accept failure"):"Use "+option,()=>{if(game.pending!==q)return;game.decide(option);destination=null;render();}));
  }
 }
 if(!ballMode&&destination&&chosen){
  const initialSpent=mover?mover.spent:planner.status==="prone"?game.standCost(planner):0;
  if(chosen.path.length){const title=document.createElement("p");title.textContent="Planned route: "+chosen.path.length+" step(s) · "+(chosen.spent-initialSpent)+" MA";choices.append(title);}
  chosen.path.forEach((step,i)=>{
   const row=document.createElement("p"),checks=planChecks(step.plan,planner);
   row.textContent=(i+1)+". "+(step.plan.jump?"Jump to ":"Move to ")+(step.x+1)+", "+(step.y+1)+" · "+step.plan.cost+" MA · "+(checks.length?checks.join(" → "):"no roll");choices.append(row);
  });
  if(!chosen.path.length&&!chosen.blockTarget&&!chosen.blitzTarget&&!chosen.ballAction&&!chosen.foulTarget)choices.append(button("Clear destination",()=>{destination=null;render();}));
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
 document.getElementById("mode-notice").textContent=game.observing?"Observation match: both coaches are computer-controlled. Pause to inspect players or step through individual actions. These matches do not change saved teams or league records.":game.match?(game.league?"League fixture: saved players and resources are in use. Record the completed result for SPP, injuries and post-game progression.":"Exhibition match: play through pre-game, setup, kickoff, turns, drive recovery, and two halves."):"Practice actions with Perfect Conditions. Select a drill to try individual rules.";
 if(game.match)renderMatch();else document.getElementById("matchflow").hidden=true;
 if(inspected)showProfile(inspected.team,inspected.role,inspected.number);
 renderSkillControls();
 document.getElementById("dugout").textContent=game.players.filter(p=>!game.onPitch(p)&&p.status!=="reserve").map(p=>teams[p.team].name+" #"+p.number+": "+p.status+(p.casualty?" — "+p.casualty.result:"")).join(" · ");
}
function deskDecisionTitle(q){
 const title=(q.kind||"Decision").replace(Number.isInteger(q.team)?" — "+teams[q.team].name:"\u0000","");
 const exact={
  "Star players — max two hires; pairs need two roster places; no MVP or permanent recruitment":"Star players",
  "Mercenaries — Loner (4+), one optional Primary skill for 50,000 gp":"Mercenaries",
  "Ball & Chain — aim the movement template":"Ball & Chain · direction",
  "Bloodlust — choose a Thrall":"Bloodlust · Thrall target",
  "Quick Bite — before scoring or finishing the catch":"Quick Bite",
  "Bounding Leap — ignore Jump modifiers before rolling":"Bounding Leap",
  "All You Can Eat — Bribe (no Argue the Call)":"All You Can Eat · Bribe"
 };
 if(exact[title])return exact[title];
 if(q.spell)return q.spell+" · target";
 return title.replace(/ — opposing coach chooses the victim$/,"").replace(/ — choose (?:an opponent|a different opponent|a victim|player|a skill|two targets|injury to resolve|injury to retry)$/,match=>({" — choose two targets":" · 2 targets"," — choose injury to resolve":" · injury"," — choose injury to retry":" · injury retry"}[match]||""));
}
function skillEntry(name){return SKILL_CATALOG.find(s=>s.name===name||s.name.includes("(X")&&name.startsWith(s.name.split(" (")[0]+" ("));}
function renderSkillControls(){
 let panel=document.getElementById("skillcontrols");if(!panel){panel=document.createElement("div");panel.id="skillcontrols";document.getElementById("profile").after(panel);}panel.replaceChildren();
 const p=game.moveContext?.player||game.players.find(q=>q.id===selected),mover=game.players.find(q=>q.id===game.mover),choices=document.getElementById("choices");
 if(p){const title=document.createElement("p");title.textContent="Abilities · #"+p.number;title.className="muted";panel.append(title);
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
  if(game.skill(mover,"Fumblerooski")&&game.ball.carrier===mover.id)choices.append(button(mover.dropOnExit?"Cancel ball drop":"Fumblerooski · drop on exit",()=>{game.dropBall();render();}));
  if(game.action==="pass"&&game.skill(mover,"Hail Mary Pass")&&!game.ballActionDone)choices.append(button(mover.hailMary?"Use normal passing range":"Use Hail Mary Pass",()=>{mover.hailMary=!mover.hailMary;throwDestination=null;render();}));
 }
 if(game.match&&game.phase!=="play"&&game.action!=="blitz")document.getElementById("special").disabled=true;
}
function renderSkillCoverage(){
 const section=document.createElement("details");section.className="panel";section.id="skillcoverage";section.open=true;
 const summary=document.createElement("summary");summary.textContent="Skills & traits · "+SKILL_CATALOG.length+" quick descriptions";section.append(summary);
 const intro=document.createElement("p");intro.textContent="Find an ability by name, category or effect. These are short reminders; consult the linked full rules for exceptions and timing. X identifies the listed player type or required roll. Mandatory abilities cannot normally be switched off.";section.append(intro);
 const rows=[...SKILL_CATALOG].sort((a,b)=>a.name.localeCompare(b.name)).map(s=>{if(!SKILL_DESCRIPTIONS[s.name])throw Error("Missing skill description: "+s.name);return [s.name,s.category,SKILL_DESCRIPTIONS[s.name]];});
 referenceTable(section,"Skill and trait descriptions",["Skill / Trait","Category","What it does"],rows);
 const link=document.createElement("a");link.href="https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/";link.textContent="Full BB2025 skill and trait rules";section.append(link);document.getElementById("reference-view").append(section);
}
function matchRun(fn){fn();destination=null;blockMode=false;ballMode=false;throwDestination=null;render();}
function renderMatch(){
 const panel=document.getElementById("matchflow");panel.hidden=false;panel.replaceChildren();
 const title=document.createElement("h2");title.textContent=teams[0].name+" "+game.scores[0]+" – "+game.scores[1]+" "+teams[1].name;panel.append(title);
 const info=document.createElement("p");info.className="match-meta";const resources=[["Dwarfen Wisdom",game.dwarfenWisdom],["Bugman KO bonus",game.resourceChoices.map(r=>r.josefBugman)],["Rocks",game.rocks],["Wizards",game.wizards],["Apothecaries",game.apothecaries],["Bribes",game.bribes],["Mortuary Assistants",game.mortuaryAssistants],["Plague Doctors",game.plagueDoctors],["Mascots",game.mascots],["Weather Mages",game.weatherMages],["Biased Referees",game.biasedRefs],["Kegs",game.resourceChoices.map(r=>r.kegs)]].filter(([,values])=>values.some(n=>n>0));info.textContent="Half "+game.half+" · Drive "+game.drive+" · Turn markers "+game.turns.join(" / ")+" · "+game.weather+" · Fan Factors "+game.fans.join(" / ")+resources.map(([name,values])=>" · "+name+" "+values.join(" / ")).join("")+(game.learning?" · Learning match":"");panel.append(info);
 const say=(text,kind="")=>{const p=document.createElement("p");p.textContent=text;p.className=kind;panel.append(p);};
 const add=(label,fn,kind="",owner=null)=>{const b=button(label,()=>matchRun(fn));if(kind)b.className+=" "+kind;if(Number.isInteger(owner))b.dataset.coachTeam=String(owner);panel.append(b);};
 if(game.match){
  for(const team of [0,1]){const value=game.teamValues(team);say((team===0?"Home":"Away")+" — "+teams[team].name+": "+(value.tv===null?"":"Team value (TV) "+money(value.tv)+" · players "+money(value.players)+" + permanent staff/re-rolls "+money(value.staff)+". ")+"Current team value (CTV) "+money(value.ctv)+" · inducements "+money(value.inducements)+" · match value including inducements "+money(value.match)+".","team-value-summary");}
 }
 if(["fans","weather","leagueSteps","prayers","rolloff","kickChoice"].includes(game.phase)&&game.selectedStars?.some(list=>list.length)){for(const team of [0,1])if(game.selectedStars[team].length){const p=document.createElement("p");p.className="muted";p.textContent=teams[team].name+" star hires: "+game.selectedStars[team].map(id=>{const star=MATCH_STARS.find(s=>s.id===id);return star.name+(game.starsFinalized&&!game.players.some(p=>p.team===team&&p.star===id)?" (unavailable: hired by both teams)":"");}).join(" · ");panel.append(p);}}
 if(game.prayers?.some(list=>list.length)){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Active prayers";details.append(summary);for(const team of [0,1])if(game.prayers[team].length){const p=document.createElement("p");p.textContent=teams[team].name+": "+game.prayers[team].map(name=>{const affected=game.prayerHistory.find(r=>r.team===team&&r.name===name);return name+(affected?.wasted?" (no eligible player)":affected?.players.length?" ("+affected.players.map(id=>{const p=game.players.find(p=>p.id===id);return teams[p.team].name+" #"+p.number;}).join(", ")+")":"");}).join(" · ");details.append(p);}panel.append(details);}
 if(["fans","weather","leagueSteps","rolloff"].includes(game.phase)){
  say(game.phase==="fans"?"Fans":game.phase==="weather"?"Weather":game.phase==="leagueSteps"?"Inducements":"Kick/receive roll-off","phase-instruction");
  if(game.phase==="fans"&&!game.league||game.phase==="leagueSteps"&&game.league){
   for(const team of [0,1]){
    const costs=game.resourceCosts(team),r=game.resourceChoices[team];
    say(teams[team].name+" · Re-rolls "+r.teamRerolls+" · Coaches "+r.assistants+" · Cheerleaders "+r.cheerleaders+" · Fans "+r.dedicatedFans+" · Staff "+money(costs.staff)+" · Fan upgrades "+money(costs.fans)+" · Inducements "+money(costs.inducements),"resource-summary");
    if(!game.league||game.leaguePurchaseOrder[game.leaguePurchaseStep]===team){if(game.league)say(teams[team].name+" · Budget "+money(game.leagueBudget(team)),"resource-summary");add("Configure staff and inducements — "+teams[team].name,()=>game.configureResources(team),"resource-control",team);}
    if(!game.league&&game.hasTeamRule(team,"Team Captain")){const captain=game.players.find(p=>p.team===team&&p.captain);say(teams[team].name+": "+(captain?"Team Captain #"+captain.number:"no Team Captain chosen"),"resource-summary");add("Choose Team Captain — "+teams[team].name,()=>game.configureCaptain(team),"resource-control",team);}
   }
  }
  add(game.phase==="fans"?"Determine fans":game.phase==="weather"?"Determine weather":game.phase==="leagueSteps"?(game.league?"Continue league pre-game":"Continue exhibition pre-game"):"Roll for kick or receive",()=>game.advancePregame(),"next-step");
 }else if(game.phase==="prayers")say("Underdog prayers");
 else if(game.phase==="kickChoice"){
  say(teams[game.rolloffWinner].name+" · roll-off winner");for(const t of [0,1])add(teams[t].name+" kicks",()=>game.chooseKicking(t));
 }else if(game.phase==="setup"){
  say("Setup · "+teams[game.setupTeam].name);
  say(game.setupErrors().join(" ")||"Formation legal");
  for(const p of game.available(game.setupTeam))add("Select #"+p.number+" · "+playerLabel(p),()=>{selected=p.id;showProfile(p.team,p.role,p.number);},"setup-player");
  add("Use suggested formation",()=>game.autoSetup());if(game.players.some(p=>p.id===selected&&p.team===game.setupTeam&&game.onPitch(p)))add("Bench selected player",()=>game.benchSetup(selected));add("Confirm formation",()=>game.confirmSetup());
 }else if(game.phase==="dwarfenWisdom"){
  const s=game.wisdomState;say("Dwarfen Wisdom · "+teams[s.team].name+(s.placing?" · "+s.selected.length+" players":""));
  if(s.placing){for(const id of s.selected){const p=game.players.find(p=>p.id===id);add("Wisdom player #"+p.number,()=>{if(game.wisdomState!==s)return;selected=id;showProfile(p.team,p.role,p.number);});}say(game.setupErrors(s.team).join(" ")||"Formation legal");add("Finish Dwarfen Wisdom",()=>{if(game.wisdomState===s)game.finishDwarfenWisdom();});}
 }else if(game.phase==="swarming"){
  const s=game.swarmState;say(teams[s.team].name+" Swarming: "+s.placed.length+" / "+s.limit+" Linemen placed");for(const id of s.eligible){const p=game.players.find(p=>p.id===id);add("Swarming Lineman #"+p.number,()=>{if(game.swarmState!==s)return;selected=id;showProfile(p.team,p.role,p.number);});}add("Finish Swarming",()=>{if(game.swarmState===s)game.finishSwarming();});
 }else if(game.phase==="kicker"){
  say("Kicker · "+teams[game.kicking].name);for(const p of game.eligibleKickers())add("Kicker #"+p.number+" · "+playerLabel(p),()=>game.nominateKicker(p.id));
 }else if(game.phase==="kickAim"){
  say(game.kickLanding?"Kick airborne":"Kick target · "+(destination?(destination.x+1)+", "+(destination.y+1):"not selected"));
  if(!game.kickLanding&&game.skill(game.players.find(p=>p.id===game.kicker),"Kick")){
   const reduced=!game.kickChoiceMade||game.kickDistanceHalved;
   say("Kick skill · "+(reduced?"D3 deviation":"D6 deviation"));
   panel.append(button(reduced?"Use D6 deviation":"Use D3 deviation",()=>{if(game.phase!=="kickAim"||game.kickLanding||game.pending)return;game.kickChoiceMade=true;game.kickDistanceHalved=!reduced;render();}));
  }
 }
 else if(game.phase==="eventMove"||game.phase==="charge"){
  const e=game.eventState;say(e.kind+": "+teams[e.team].name+" · "+e.used.length+" / "+e.limit+" players used");
  for(const id of e.eligible){const p=game.players.find(q=>q.id===id);if(!e.used.includes(id)||e.kind==="defence")add("Event player #"+p.number,()=>{selected=id;showProfile(p.team,p.role,p.number);});}
  if(e.kind==="defence"&&e.eligible.includes(selected)&&game.onPitch(game.players.find(p=>p.id===selected)))add("Lift selected for Solid Defence",()=>game.liftDefence(selected));
  add("Finish Kick-off Event",()=>game.finishEvent());
 }else if(game.phase==="touchback")say("Touchback · "+teams[game.receiving].name);
 else if(game.phase==="endDrive"){say("Drive ended");add("Continue",()=>game.continueDrive());}
 else if(game.phase==="finished")say("Full time: "+(game.scores[0]===game.scores[1]?"draw":teams[game.scores[0]>game.scores[1]?0:1].name+" wins")+(game.league?" · result unrecorded":""));
 else if(game.phase==="play"){/* The active coach and turn are already in the desk heading. */}
 else if(game.phase==="betweenTurns")say("Between turns · "+teams[game.active].name);
 else say("Kick-off decision");
 if(["play","charge"].includes(game.phase)){const p=game.players.find(p=>p.id===game.mover);if(p&&!game.pending&&game.starDistractionTargets(p).length)add("Use "+game.starDistraction(p),()=>{if(game.mover===p.id)game.offerStarDistraction(p);});}
 coach.textContent=teams[game.active].name+" · Half "+game.half+" · Turn "+game.turns[game.active];
 if(game.phase!=="play"&&game.phase!=="charge")selection.textContent="Phase · "+({kickChoice:"Kick/receive",leagueSteps:"Inducements",kickAim:"Kick target",eventMove:"Kick-off movement",dwarfenWisdom:"Dwarfen Wisdom",endDrive:"End of drive",betweenTurns:"Between turns"}[game.phase]||game.phase);
 document.getElementById("end").disabled=!!game.pending||game.finished||!["play","charge"].includes(game.phase);
 if(game.phase==="charge"&&game.action!=="blitz")document.getElementById("block").disabled=true;
}
function rosterRuleSummary(t){const rules=[...t.special];if(t.alignments?.length)rules.push("Favoured alignment: "+t.alignments.join(" / "));for(const [league,names] of Object.entries(t.leagueRules||{}))rules.push(league+": "+names.join(", "));for(const group of t.groupLimits||[])rules.push(group.label+": combined maximum "+group.max);return rules.length?rules.join(" · "):"No team special rules listed";}
const rosterPlayNotes={
 "imperial-nobility": {"strength":"Hold running lanes with Stand Firm Bodyguards and Fend Retainers.","weakness":"Slow Bodyguards struggle to recover when the attack switches flanks."},
 "black-orc": {"strength":"Use Grab to pull opponents into favorable blocks or away from your Goblins.","weakness":"Slow Black Orcs struggle to switch flanks, leaving fragile Goblins exposed."},
 "skaven": {"strength":"Use MA9 Gutter Runners to turn a small opening into a touchdown.","weakness":"Most players have light armor, so prolonged contact can leave you short-handed."},
 "dwarf": {"strength":"Advance behind armored linemen whose starting Block makes routine hits safer.","weakness":"MA4 linemen struggle to recover when the opposition breaks down the far flank."},
 "lizardmen": {"strength":"Open lanes with ST4 Saurus and sprint through them with MA8 Skinks.","weakness":"Poor Saurus agility leaves ball duty to fragile ST2 Skinks."},
 "elven-union": {"strength":"Use AG2+ Catchers with Nerves of Steel to receive even when marked.","weakness":"Light armor across most of the roster makes repeated contact costly."},
 "nurgle": {"strength":"Use Stand Firm Bloaters and Disturbing Presence to clog lanes and disrupt passes.","weakness":"Slow blockers struggle to recover after a switch, and only Pestigors have AG3+."},
 "dark-elf": {"strength":"Build a running screen with AG2+ players and armored Block Blitzers.","weakness":"With no starting Catch or Pass, a long passing drive can burn team rerolls."},
 "amazon": {"strength":"Use widespread Dodge to reposition behind ST4 Jaguar Warriors.","weakness":"Tackle strips away much of Dodge's protection, exposing your lightly armored players."},
 "bretonnian": {"strength":"Use cheap Wrestle Squires to open lanes or bring down Block ball carriers.","weakness":"Every player is ST3, so prolonged scrums favor stronger teams despite Dauntless."},
 "chaos-chosen": {"strength":"Use ST4 Chosen to control contact and Horns Beastmen to blitz at ST4.","weakness":"With no starting Block or Sure Hands, routine hits and pickups can drain rerolls."},
 "chaos-dwarf": {"strength":"Anchor the drive with armored Block Dwarfs, then send a ST4 Bull Centaur through the gap.","weakness":"AG4+ on the armored players makes lightly armored Hobgoblins your easiest pickups."},
 "chaos-renegades": {"strength":"Anchor the line with Big Guys and use the AG2+ Dark Elf for ball duty.","weakness":"Big Guy activation rolls and Animosity can interrupt a drive, so plan around failed actions."},
 "gnome": {"strength":"Hold the middle with Treemen and use a fast AG2+ Fox to run the ball.","weakness":"My Ball prevents the Fox from handing off or passing, so protect its route to the end zone."},
 "goblin": {"strength":"Use Secret Weapons to disrupt a drive and make space for your mobile Goblins.","weakness":"Secret Weapons risk ejection after the drive, leaving ST2 Goblins to take the hits."},
 "halfling": {"strength":"Run behind ST6 Treemen or use them to throw a Catcher over the defense.","weakness":"Slow, lightly armored ST2 Halflings are easy to isolate away from the trees."},
 "high-elf": {"strength":"Use AG2+ across the team and MA8 Dragon Princes to move the ball quickly.","weakness":"Expensive players strain the starting budget for reserves and team rerolls."},
 "human": {"strength":"Secure the ball with Sure Hands and use MA8 Catchers to threaten either flank.","weakness":"Most players are ST3, so heavier teams can win a sustained scrum."},
 "khorne": {"strength":"Use Frenzy to push opponents off the sideline or open running lanes.","weakness":"Forced follow-up blocks can drag players into unfavorable dice unless you plan assists."},
 "necromantic-horror": {"strength":"Hold lanes with Flesh Golems and use MA8 Werewolves to exploit gaps.","weakness":"Slow Zombies struggle to keep up with a breakout, and Wraiths cannot carry the ball."},
 "norse": {"strength":"Use widespread starting Block to win early exchanges and open a lane.","weakness":"Most players have light armor, so a long brawl can cost you numbers."},
 "ogre": {"strength":"Use multiple ST5 Ogres with Mighty Blow to control the line.","weakness":"Bone Head can open holes in the screen and leave fragile ST1 Gnoblars exposed."},
 "old-world-alliance": {"strength":"Hold the middle with armored Dwarfs while Human specialists move the ball.","weakness":"Slow Dwarfs can fall behind a fast drive, leaving the carrier short of cover."},
 "orc": {"strength":"Advance behind AV10+ players and use ST4 Big Uns to clear the way.","weakness":"Modest speed makes it hard to chase a fast break or score in a hurry."},
 "shambling-undead": {"strength":"Let ST5 Mummies clear space for MA7 Dodge Ghouls to carry the ball.","weakness":"Slow Mummies and linemen struggle to protect Ghouls when a drive changes direction."},
 "snotling": {"strength":"Use cheap Sidestep Snotlings to screen and Pump Wagons to hit.","weakness":"ST1 and AV6+ make Snotlings easy to remove if they stay in contact."},
 "tomb-kings": {"strength":"Use four ST5 Tomb Guardians to control the middle and shield a slow drive.","weakness":"Nobody has better than AG4+, so a loose ball is hard to recover under pressure."},
 "underworld-denizens": {"strength":"Use cheap Stunty players to screen while fast Skaven handle the ball.","weakness":"Most players are lightly armored, and losing a Skaven specialist limits your scoring options."},
 "vampire": {"strength":"Use Hypnotic Gaze to open a cage or screen before sending in an agile Vampire.","weakness":"Bloodlust can hurt Thralls or derail an activation, so keep Thralls within reach."},
 "wood-elf": {"strength":"Use mobile AG2+ players to switch flanks and Wardancers to threaten caged carriers.","weakness":"Light armor and pricey players make a long fight costly."}
};
function renderRosters(){
 document.getElementById("roster-list").innerHTML=[1,2,3,4].map(tier=>'<section class="roster-tier" aria-labelledby="roster-tier-'+tier+'"><h2 id="roster-tier-'+tier+'">Tier '+tier+'</h2>'+rosterCatalog.map((t,team)=>{
 if(Number(t.tier)!==tier)return "";
 const total=t.lineup.reduce((n,r)=>n+t.positions[r].cost,0);
 const {strength,weakness}=rosterPlayNotes[t.id];
 const overview='<span class="roster-overview"><span><span class="roster-strength" aria-label="Strength">+</span>'+escapeTeamText(strength)+'</span><span><span class="roster-weakness" aria-label="Weakness">−</span>'+escapeTeamText(weakness)+'</span></span>';
 return '<article class="panel" data-roster-name="'+escapeTeamText(t.name)+'"><details class="roster-details"><summary>'+escapeTeamText(t.name)+''+overview+'</summary><div class="roster-content"><p class="team-summary">'+(t.leagues||[t.league]).join(" / ")+' · '+rosterRuleSummary(t)+'</p><div class="table-scroll"><table><caption>Available positions · click a position to inspect</caption><thead><tr>'+["Position","Limit","MA","ST","AG","PA","AV","Skills & traits","Primary","Secondary","Cost"].map(h=>'<th scope="col">'+h+'</th>').join("")+'</tr></thead><tbody>'+t.positions.map((p,r)=>'<tr><td><button class="role-button" data-team="'+team+'" data-role="'+r+'">'+p.name+'</button><br><small>'+p.traits+'</small></td><td>0–'+p.max+'</td>'+["ma","st","ag","pa","av"].map(k=>'<td>'+p[k]+'</td>').join("")+'<td class="skills">'+p.skills.join(", ")+'</td><td>'+p.primary+'</td><td>'+p.secondary+'</td><td>'+money(p.cost)+'</td></tr>').join("")+'</tbody></table></div><p class="team-summary"><strong>Demo lineup:</strong> '+t.positions.map((p,r)=>({p,count:t.lineup.filter(v=>v===r).length})).filter(v=>v.count).map(v=>v.count+" × "+v.p.name).join(" · ")+'<br>11 players: '+money(total)+'. With 2 re-rolls: '+money(total+2*t.reroll)+'. These are demonstration selections, not a roster builder.</p><p class="muted">Re-roll: '+money(t.reroll)+' · Apothecary: '+(t.staff.apothecary?money(t.staff.apothecary):'unavailable')+' · Assistant coach: '+money(t.staff.assistantCoach)+' · Cheerleader: '+money(t.staff.cheerleader)+'</p><a class="muted" href="'+t.source+'">Source of truth · reviewed '+t.reviewed+'</a></div></details></article>';
 }).join("")+'</section>').join("");
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
document.getElementById("end").addEventListener("click",()=>matchRun(()=>{game.endTurn();selected=null;}));
document.getElementById("reset").addEventListener("click",()=>reset());
document.getElementById("scenario").addEventListener("change",()=>reset());
renderRosters();renderRulesReference();renderSkillCoverage();reset();
