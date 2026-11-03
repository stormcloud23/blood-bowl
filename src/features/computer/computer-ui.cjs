"use strict";
let computerSession=null,computerTimer=null,computerTimerEpoch=0,computerPaused=false,computerFault="",computerSteps=0;
function computerCoach(team){return computerSession?.game===game?computerSession.coaches[team]||null:null;}
function computerOwnsDecision(){return game.phase!=="finished"&&!!computerCoach(computerDecisionTeam(game));}
function inspectingComputerMatch(){return computerSession?.game===game&&computerSession.observing&&computerPaused;}
function cancelComputerTimer(){computerTimerEpoch++;if(computerTimer!==null){clearTimeout(computerTimer);computerTimer=null;}}
function computerProgressKey(){
 const q=game.pending;
 return JSON.stringify([game.phase,game.half,game.drive,game.active,game.turns,game.scores,game.mover,game.action,game.ball,game.rerolls,
  q&&[q.type,q.kind,q.team,q.roll,q.options],game.players.map(p=>[p.id,p.x,p.y,p.status,p.used,p.spent,p.distracted])]);
}
function advanceComputer(){
 const session=computerSession,team=computerDecisionTeam(game),coach=computerCoach(team);
 if(!coach||game.phase==="finished")return false;
 try{
  computerSteps++;
  if(++session.steps[team]>1600)throw new Error("action limit reached; take over to continue");
  if(!coach.step(game))throw new Error("no supported action; take over to continue");
  const state=computerProgressKey();session.repeats=state===session.lastState?session.repeats+1:0;session.lastState=state;
  if(session.repeats>=8)throw new Error("repeated state; take over to continue");
 }catch(error){computerFault=error.message;computerPaused=true;}
 selected=null;destination=null;blockMode=false;ballMode=false;throwDestination=null;render();return !computerFault;
}
function refreshComputer(){
 const panel=document.getElementById("computer-controls"),status=document.getElementById("computer-status");
 panel.hidden=computerSession?.game!==game;document.getElementById("game-session").className=panel.hidden?"":"has-computer";
 if(panel.hidden)return;
 document.getElementById("computer-pause").textContent=computerPaused?"Resume computer":"Pause computer";
 document.getElementById("computer-pause").disabled=game.phase==="finished";
 document.getElementById("computer-step").disabled=!computerPaused||!computerOwnsDecision()||!!computerFault;
 document.getElementById("computer-takeover").textContent=computerSession.observing?"Take over both teams":"Take over computer team";
 document.getElementById("computer-scope").textContent=computerSession.observing?"Both teams use the current computer coach. Pause to inspect players, or step through one action at a time.":"Basic ground-game opponent. Controls the away preset team; no passing or optional inducement purchases.";
 const owner=computerDecisionTeam(game),coach=computerCoach(owner)||computerSession.coach,side=owner===0?"Home":"Away";
 status.textContent=computerFault?"Computer paused: "+computerFault:game.phase==="finished"?"Computer match finished.":computerPaused?"Computer paused. Resume, step or take over to continue.":computerOwnsDecision()?"Computer thinking · "+side+" — "+teams[owner].name+" · "+coach.explanation:"Your decision · "+coach.explanation;
 const actions=document.getElementById("computer-actions");actions.hidden=!computerSession.observing;
 if(computerSession.observing){selection.textContent="Observation · read-only player inspection";}
 if(computerSession.observing)actions.textContent=computerSession.coaches.map((c,i)=>(i===0?"Home computer":"Away computer")+" ("+teams[i].name+")"+": "+c.explanation).join(" | ");
 // Keep the current decision visible, but reserve its actions for its coach.
 if(computerOwnsDecision()){
  for(const id of ["matchflow","choices","current-actions","action-controls","skillcontrols"])for(const b of document.getElementById(id).querySelectorAll("button"))b.disabled=true;
  for(const id of ["finish","end"])document.getElementById(id).disabled=true;
 }
 // Staff for the computer remain at the preset defaults in this first version.
 for(const b of document.getElementById("matchflow").querySelectorAll("button"))if(computerCoach(Number(b.dataset.coachTeam)))b.disabled=true;
 if(computerCoach(game.players.find(p=>p.id===selected)?.team))for(const b of document.getElementById("skillcontrols").querySelectorAll("button"))b.disabled=true;
 if(computerTimer!==null||computerPaused||computerFault||!computerOwnsDecision()||typeof setTimeout!=="function")return;
 const session=computerSession,match=game,decision=game.pending,epoch=++computerTimerEpoch;
 computerTimer=setTimeout(()=>{
  if(epoch!==computerTimerEpoch)return;
  computerTimer=null;
  if(computerSession!==session||game!==match||computerPaused||game.pending!==decision||computerDecisionTeam(game)!==owner||!computerOwnsDecision()){refreshComputer();return;}
  advanceComputer();
 },Number(document.getElementById("computer-speed").value)||350);
}
const resetBeforeComputer=reset;
reset=function(){
 cancelComputerTimer();computerSession=null;computerPaused=false;computerFault="";computerSteps=0;
 const scenario=document.getElementById("scenario").value,observing=scenario==="match-observe",mode=document.getElementById("computer-opponent").value,enabled=COMPUTER_ROSTERS.includes(mode)&&scenario==="match";
 if(enabled){document.getElementById("exhibition-away").value=mode;document.getElementById("exhibition-away-custom").value="";exhibitionRosterChoices("away");}
 resetBeforeComputer();
 if(enabled||observing){
  const coaches=[observing?new ComputerCoach(0):null,new ComputerCoach(1)];
  game.individualBlockChoices=true;game.observing=observing;
  computerSession={game,coach:coaches[1],coaches,observing,steps:[0,0],lastState:null,repeats:0};
 }
 for(const suffix of ["","-custom","-league","-alignment"]){const select=document.getElementById("exhibition-away"+suffix);select.disabled=enabled||(suffix==="-custom"&&!leagueStore.data.teams.some(t=>!t.draft));}
 render();
};
const renderBeforeComputer=render;
render=function(){renderBeforeComputer();refreshComputer();};
const chooseBeforeComputer=choose;
choose=function(...args){
 if(inspectingComputerMatch()){
  const p=game.at(args[0],args[1]);if(p){selected=p.id;showProfile(p.team,p.role,p.number);document.getElementById("player-details").open=true;render();}return;
 }
 if(!computerOwnsDecision())return chooseBeforeComputer(...args);
};
const commitRouteBeforeComputer=commitRoute;
commitRoute=function(){if(!computerOwnsDecision())return commitRouteBeforeComputer();};
document.getElementById("computer-opponent").addEventListener("change",()=>{const mode=document.getElementById("computer-opponent").value,enabled=COMPUTER_ROSTERS.includes(mode);if(enabled){document.getElementById("exhibition-away").value=mode;document.getElementById("exhibition-away-custom").value="";exhibitionRosterChoices("away");}for(const suffix of ["","-custom","-league","-alignment"])document.getElementById("exhibition-away"+suffix).disabled=enabled||(suffix==="-custom"&&!leagueStore.data.teams.some(t=>!t.draft));document.getElementById("match-config-status").textContent="Changes ready. Start a new match to apply them.";});
document.getElementById("computer-pause").addEventListener("click",()=>{cancelComputerTimer();computerPaused=!computerPaused;if(!computerPaused&&computerFault){computerFault="";computerSteps=0;computerSession.steps=[0,0];computerSession.repeats=0;computerSession.lastState=null;}render();});
document.getElementById("computer-step").addEventListener("click",()=>{if(computerPaused&&!computerFault&&computerOwnsDecision()){cancelComputerTimer();advanceComputer();}});
document.getElementById("computer-speed").addEventListener("change",()=>{cancelComputerTimer();refreshComputer();});
document.getElementById("computer-takeover").addEventListener("click",()=>{cancelComputerTimer();if(!computerSession?.observing)document.getElementById("computer-opponent").value="";game.observing=false;computerSession=null;computerFault="";computerPaused=false;for(const suffix of ["","-league","-alignment"])document.getElementById("exhibition-away"+suffix).disabled=false;document.getElementById("exhibition-away-custom").disabled=!leagueStore.data.teams.some(t=>!t.draft);render();});
document.getElementById("start-observation").addEventListener("click",()=>{document.getElementById("scenario").value="match-observe";document.getElementById("testing-scenario").value="match-observe";reset();document.getElementById("testing-launcher").open=false;switchWorkspace("testing");});
// Capture prevents mouse and keyboard-generated clicks from changing the pitch
// or a coach decision while the computer owns it, including while paused.
document.getElementById("game-session").addEventListener("click",event=>{
 if(computerOwnsDecision()&&event.target.closest("button, .square, .dugout-card")&&!event.target.closest("#computer-controls")&&event.target.id!=="reset"&&event.target.id!=="last-action"&&!(inspectingComputerMatch()&&event.target.closest(".square"))){
  event.preventDefault();event.stopImmediatePropagation();
 }
},true);
refreshComputer();
