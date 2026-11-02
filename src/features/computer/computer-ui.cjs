"use strict";
let computerSession=null,computerTimer=null,computerPaused=false,computerFault="",computerSteps=0;
function computerOwnsDecision(){return computerSession?.game===game&&computerDecisionTeam(game)===1&&game.phase!=="finished";}
function cancelComputerTimer(){if(computerTimer!==null){clearTimeout(computerTimer);computerTimer=null;}}
function computerProgressKey(){
 const q=game.pending;
 return JSON.stringify([game.phase,game.half,game.drive,game.active,game.turns,game.scores,game.mover,game.action,game.ball,game.rerolls,
  q&&[q.type,q.kind,q.team,q.roll,q.options],game.players.map(p=>[p.id,p.x,p.y,p.status,p.used,p.spent,p.distracted])]);
}
function refreshComputer(){
 const panel=document.getElementById("computer-controls"),status=document.getElementById("computer-status");
 panel.hidden=computerSession?.game!==game;
 if(panel.hidden)return;
 document.getElementById("computer-pause").textContent=computerPaused?"Resume computer":"Pause computer";
 status.textContent=computerFault?"Computer paused: "+computerFault:computerPaused?"Computer paused. Resume or take over to continue.":game.phase==="finished"?"Computer match finished.":computerOwnsDecision()?"Computer thinking · "+computerSession.coach.explanation:"Your decision · "+computerSession.coach.explanation;
 // Keep the current decision visible, but reserve its actions for its coach.
 if(computerOwnsDecision()){
  for(const id of ["matchflow","choices","action-controls","skillcontrols"])for(const b of document.getElementById(id).querySelectorAll("button"))b.disabled=true;
  for(const id of ["finish","end"])document.getElementById(id).disabled=true;
 }
 // Staff for the computer remain at the preset defaults in this first version.
 for(const b of document.getElementById("matchflow").querySelectorAll("button"))if(b.dataset.coachTeam==="1")b.disabled=true;
 if(game.players.find(p=>p.id===selected)?.team===1)for(const b of document.getElementById("skillcontrols").querySelectorAll("button"))b.disabled=true;
 if(computerTimer!==null||computerPaused||computerFault||!computerOwnsDecision()||typeof setTimeout!=="function")return;
 const session=computerSession,match=game,decision=game.pending;
 computerTimer=setTimeout(()=>{
  computerTimer=null;
  if(computerSession!==session||game!==match||computerPaused||game.pending!==decision||!computerOwnsDecision()){refreshComputer();return;}
  try{
   // A hard bound prevents an unforeseen prompt/action cycle from running
   // forever. No automatic end-turn or human decision is used to hide a bug.
   if(++computerSteps>1600)throw new Error("action limit reached; take over to continue");
   if(!session.coach.step(game))throw new Error("no supported action; take over to continue");
   const state=computerProgressKey();session.repeats=state===session.lastState?session.repeats+1:0;session.lastState=state;
   if(session.repeats>=8)throw new Error("repeated state; take over to continue");
  }catch(error){computerFault=error.message;computerPaused=true;}
  selected=null;destination=null;blockMode=false;ballMode=false;throwDestination=null;render();
 },Number(document.getElementById("computer-speed").value)||350);
}
const resetBeforeComputer=reset;
reset=function(){
 cancelComputerTimer();computerSession=null;computerPaused=false;computerFault="";computerSteps=0;
 const mode=document.getElementById("computer-opponent").value,enabled=COMPUTER_ROSTERS.includes(mode)&&document.getElementById("scenario").value==="match";
 if(enabled){document.getElementById("exhibition-away").value=mode;document.getElementById("exhibition-away-custom").value="";exhibitionRosterChoices("away");}
 resetBeforeComputer();
 if(enabled){game.individualBlockChoices=true;computerSession={game,coach:new ComputerCoach(1),lastState:null,repeats:0};}
 for(const suffix of ["","-custom","-league","-alignment"]){const select=document.getElementById("exhibition-away"+suffix);select.disabled=enabled||(suffix==="-custom"&&!leagueStore.data.teams.some(t=>!t.draft));}
 render();
};
const renderBeforeComputer=render;
render=function(){renderBeforeComputer();refreshComputer();};
const chooseBeforeComputer=choose;
choose=function(...args){if(!computerOwnsDecision())return chooseBeforeComputer(...args);};
const commitRouteBeforeComputer=commitRoute;
commitRoute=function(){if(!computerOwnsDecision())return commitRouteBeforeComputer();};
document.getElementById("computer-opponent").addEventListener("change",()=>{document.getElementById("scenario").value="match";reset();});
document.getElementById("computer-pause").addEventListener("click",()=>{cancelComputerTimer();computerPaused=!computerPaused;if(!computerPaused&&computerFault){computerFault="";computerSteps=0;computerSession.repeats=0;computerSession.lastState=null;}render();});
document.getElementById("computer-speed").addEventListener("change",()=>{cancelComputerTimer();refreshComputer();});
document.getElementById("computer-takeover").addEventListener("click",()=>{cancelComputerTimer();computerSession=null;computerFault="";computerPaused=false;document.getElementById("computer-opponent").value="";for(const suffix of ["","-league","-alignment"])document.getElementById("exhibition-away"+suffix).disabled=false;document.getElementById("exhibition-away-custom").disabled=!leagueStore.data.teams.some(t=>!t.draft);render();});
// Capture prevents mouse and keyboard-generated clicks from changing the pitch
// or a coach decision while the computer owns it, including while paused.
document.getElementById("game-session").addEventListener("click",event=>{
 if(computerOwnsDecision()&&event.target.closest("button, .square, .dugout-card")&&!event.target.closest("#computer-controls")&&event.target.id!=="reset"){
  event.preventDefault();event.stopImmediatePropagation();
 }
},true);
refreshComputer();
