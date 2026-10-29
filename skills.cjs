"use strict";
const SkillBase=typeof module!=="undefined"?require("./movement.cjs").MovementGame:MovementGame;
const SKILL_GROUPS={
 Agility:["Catch","Diving Catch","Diving Tackle","Dodge","Defensive","Hit and Run","Jump Up","Leap","Safe Pair of Hands","Sidestep","Sprint","Sure Feet"],
 Devious:["Dirty Player","Eye Gouge","Fumblerooski","Lethal Flight","Lone Fouler","Pile Driver","Put the Boot In","Quick Foul","Saboteur","Shadowing","Sneaky Git","Violent Innovator"],
 General:["Block","Dauntless","Fend","Frenzy","Kick","Pro","Steady Footing","Strip Ball","Sure Hands","Tackle","Taunt","Wrestle"],
 Mutation:["Big Hand","Claws","Disturbing Presence","Extra Arms","Foul Appearance","Horns","Iron Hard Skin","Monstrous Mouth","Prehensile Tail","Tentacles","Two Heads","Very Long Legs"],
 Passing:["Accurate","Cannoneer","Cloud Burster","Dump-off","Give and Go","Hail Mary Pass","Leader","Nerves of Steel","On the Ball","Pass","Punt","Safe Pass"],
 Strength:["Arm Bar","Brawler","Break Tackle","Bullseye","Grab","Guard","Juggernaut","Mighty Blow","Multiple Block","Stand Firm","Strong Arm","Thick Skull"],
 Traits:["Always Hungry","Animal Savagery","Animosity (X)","Ball & Chain","Bloodlust (X+)","Bombardier","Bone Head","Breathe Fire","Chainsaw","Decay","Drunkard","Hatred (X)","Hypnotic Gaze","Insignificant","Kick Team-mate","Loner (X+)","My Ball","No Ball","Pick-me-up","Plague Ridden","Pogo","Projectile Vomit","Really Stupid","Regeneration","Right Stuff","Secret Weapon","Stab","Stunty","Swoop","Take Root","Throw Team-mate","Timmm-ber!","Titchy","Trickster","Unchannelled Fury","Unsteady"]
};
const SKILL_DEFERRED={
 "Diving Catch":"Needs ball-landing reaction choices, contested adjacent catchers, and original pass target tracking.",
 "Diving Tackle":"Needs a post-reroll reaction window and placement before final movement failure resolution.",
 "Hit and Run":"Needs an optional post-action move that runs before Blitz continuation and turnover cleanup.",
 "Safe Pair of Hands":"Needs one shared pre-prone ball-placement window for falls, Wrestle, and every forced placement.",
 "Lethal Flight":"Requires thrown-player flight, collision and casualty attribution.",
 "Pile Driver":"Requires a nested free Foul that completes before prone placement and original Block cleanup.",
 "Saboteur":"Requires simultaneous knockdown/explosion reactions and the Secret Weapon injury exception.",
 "Violent Innovator":"Requires Star Player Point attribution and league progression.",
 "Steady Footing":"Needs failed movement continuation callbacks for every remaining check after preventing a fall.",
 "Monstrous Mouth":"Needs Chomp constraints on all forced and voluntary movement, including incoming Ball & Chain support.",
 "Dump-off":"Needs a nested out-of-turn Quick Pass before the targeted attack resumes.",
 "On the Ball":"Needs interrupting, multi-player out-of-turn movement before passing and kickoff events.",
 "Punt":"Needs directional kick target and direction/distance re-roll choices separate from normal passing.",
 "Multiple Block":"Needs two simultaneous Block resolutions, both completed even if one causes a turnover.",
 "Animal Savagery":"Needs activation interruption, forced teammate selection, mandatory damage modifiers and continuation.",
 "Ball & Chain":"Needs directional random movement, collision Blocks against either team and special injury handling.",
 "Bloodlust (X+)":"Needs Thrall selection, bite injury, action replacement and feeding before passing or scoring.",
 "Bombardier":"Needs a separate bomb object, explosions, recursive caught-bomb throws and simultaneous injuries.",
 "Decay":"Requires actual Casualty Table rolls; current casualties remove players without persistent injury results.",
 "Insignificant":"Requires the Team Draft List / roster builder.",
 "Kick Team-mate":"Requires thrown-player flight, fumbles and crash landings.",
 "Plague Ridden":"Requires death results, apothecary timing, roster additions and post-game hiring.",
 "Swoop":"Requires thrown-player directional flight and landing re-rolls.",
 "Trickster":"Needs defender relocation and optional pickup before attack dice, including other reactions."
};
const SKILL_PARTIAL={"Leader":"Exhibition re-roll and missing-Leader eligibility are supported; Halfling Master Chef interactions await inducements.","Secret Weapon":"End-of-drive send-off, Argue the Call and available Bribes are supported; bribe-related roster special rules await inducements.","Chainsaw":"Attack, kick-back and incoming armour penalty work. Optional chainsaw use during a Foul is deferred."};
const PASSIVES=new Set(["Claws","Disturbing Presence","Foul Appearance","Iron Hard Skin","Leader","Thick Skull","Animal Savagery","Bloodlust (X+)","Bone Head","Decay","Drunkard","Hatred (X)","Insignificant","Kick Team-mate","Loner (X+)","My Ball","No Ball","Plague Ridden","Really Stupid","Regeneration","Right Stuff","Secret Weapon","Stunty","Take Root","Timmm-ber!","Titchy","Unchannelled Fury","Unsteady"]);
const MANDATORY=new Set(["Frenzy","Disturbing Presence","Foul Appearance","Always Hungry","Animal Savagery","Animosity (X)","Ball & Chain","Bloodlust (X+)","Bone Head","Chainsaw","Decay","Drunkard","Hatred (X)","Insignificant","Loner (X+)","My Ball","No Ball","Really Stupid","Right Stuff","Secret Weapon","Stunty","Take Root","Titchy","Unchannelled Fury","Unsteady"]);
const SKILL_CATALOG=Object.entries(SKILL_GROUPS).flatMap(([category,names])=>names.map(name=>({name,category,kind:PASSIVES.has(name)?"Passive":"Active",mandatory:MANDATORY.has(name),status:SKILL_DEFERRED[name]?"Deferred":SKILL_PARTIAL[name]?"Partial":"Implemented",notes:SKILL_DEFERRED[name]||SKILL_PARTIAL[name]||"Supported in the available actions. Optional abilities may be disabled before action resolution.",source:"https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#"+name.toLowerCase().replace(/[^a-z0-9 ]/g,"").replaceAll(" ","-")})));
class SkillGame extends SkillBase {
 // A separate declaration allowance: throwing a player does not consume the Pass.
 canThrowTeamMate(p){return !!(this.canStart(p)&&this.has(p,"Throw Team-mate")&&!this.throwUsed?.[p.team]);}
 throwActor(){const p=this.players.find(q=>q.id===this.mover);return this.action==="throw-team-mate"&&!this.pending&&!this.finished&&!this.ballActionDone&&p?.status==="standing"&&!p.distracted?p:null;}
 throwCandidates(){const a=this.throwActor();return a?this.players.filter(p=>p.id!==a.id&&p.team===a.team&&this.onPitch(p)&&this.distance(a,p)===1&&this.has(p,"Right Stuff")&&!p.rooted&&["standing","prone","stunned"].includes(p.status)):[];}
 selectThrowMate(id){if(!this.throwCandidates().some(p=>p.id===id))return false;this.throwMate=id;return true;}
 throwPreview(x,y){const a=this.throwActor(),p=this.throwCandidates().find(q=>q.id===this.throwMate),range=a&&super.passRange(a,{x,y});if(!a||!p||!range||range.band>1)return null;return {...range,name:range.band?"Short Throw":"Quick Throw",target:parseInt(this.profile(a).pa)+range.band+this.marking(a)+this.disturbance(a)-(this.skill(a,"Strong Arm")?1:0),mate:p};}
 throwTeamMate(x,y){
  const preview=this.throwPreview(x,y);if(!preview)return false;
  const a=this.throwActor(),p=preview.mate,origin={x:p.x,y:p.y},unable=p.status!=="standing"||p.distracted;
  this.ballActionDone=true;this.throwMate=null;
  const end=turnover=>{this.mover=null;this.action=null;if(turnover)this.endTurn(true);else this.checkScore();};
  const airborne=()=>{p.x=null;p.y=null;};
  const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const drift=(pos,label)=>{const [dx,dy]=dirs[this.roll(label,8)-1];return {x:pos.x+dx,y:pos.y+dy};};
  let forcedTurnover=false;
  const crowd=(from,to)=>{p.x=from.x;p.y=from.y;this.pushPlayer(p,to,()=>end(true));};
  const land=(pos,subpar,crashed=false,from=origin)=>{
   if(!this.inside(pos.x,pos.y)){crowd(from,pos);return;}
   const victim=this.at(pos.x,pos.y);
   if(victim){
    this.note("Thrown #"+p.number+" crashes into #"+victim.number+".");
    if(victim.team===this.active)forcedTurnover=true;
    this.fall(victim,{turnover:false,after:()=>land(drift(pos,"Collision bounce"),subpar,true,pos)});return;
   }
   p.x=pos.x;p.y=pos.y;if(this.ball.carrier===p.id){this.ball.x=p.x;this.ball.y=p.y;}
   const fail=()=>this.fall(p,{turnover:false,after:()=>end(forcedTurnover||carrying)});
   const ok=()=>{this.note("#"+p.number+" lands on their feet.");if(!this.ball.carrier&&this.ball.x===p.x&&this.ball.y===p.y)this.bounce(p.x,p.y,()=>end(forcedTurnover));else end(forcedTurnover);};
   if(unable||crashed){fail();return;}
   this.test(p,"Landing",parseInt(this.profile(p).ag)+(subpar?1:0)+this.marking(p),ok,fail);
  };
  const carrying=this.ball.carrier===p.id;
  const fumble=()=>{this.note("Fumbled Throw: bounce from the throwing player.");airborne();land(drift(a,"Fumbled player bounce"),true,false,a);};
  const resolve=n=>{
   const modifier=preview.target-parseInt(this.profile(a).pa);
   if(n===1||n!==6&&n-modifier===1){fumble();return;}
   const superb=this.success(n,preview.target);this.note(superb?"Superb Throw.":"Subpar Throw.");
   const flight=skipScatter=>{airborne();let pos={x,y};
    if(!skipScatter)for(let i=0;i<3;i++){const from=pos;pos=drift(pos,"Thrown player scatter");if(!this.inside(pos.x,pos.y)){crowd(from,pos);return;}}
    land(pos,!superb);
   };
   if(superb&&this.skill(a,"Bullseye"))this.pending={type:"custom",kind:"Bullseye",options:["Use Bullseye","Scatter normally"],resolve:choice=>{this.pending=null;if(choice==="Use Bullseye")this.note("Bullseye: land in the target square without scatter.");flight(choice==="Use Bullseye");}};
   else flight(false);
  };
  const accuracy=()=>{
   const n=this.roll("Throw Team-mate accuracy #"+a.number);
   // A Subpar result is still a failed PA test; the thrower may re-roll it.
   if(this.success(n,preview.target)){resolve(n);return;}
   const options=this.options(a,"Throw Team-mate");if(!options.length){resolve(n);return;}
   this.pending={p:a,kind:"Throw Team-mate",target:preview.target,roll:n,options,resolve};
  };
  if(this.has(a,"Always Hungry"))this.test(a,"Always Hungry",2,accuracy,()=>{
   this.test(a,"Squirm free",2,fumble,()=>{
    this.note("Always Hungry: #"+p.number+" is eaten and permanently removed.");p.eaten=true;p.status="eaten";p.x=null;p.y=null;
    if(carrying){this.ball={...origin,carrier:null};this.bounce(origin.x,origin.y,()=>end(true));}else end(true);
   });
  });else accuracy();return true;
 }
 constructor(teams,options={}){super(teams,options);this.foulUsed=[false,false];this.leaderPool=[false,false];this.leaderHalf=[0,0];this.lab=options.scenario==="skills";if(this.lab){this.players[0].extraSkills=["Leap","Sprint","Sure Feet","Sure Hands"];this.practicePlayer=this.players[0].id;}this.skillTurn=0;
  if(options.scenario==="throw-team-mate"){
   this.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));this.active=1;this.turns=[0,1];
   const troll=this.players[21],goblin=this.players[11];Object.assign(troll,{x:16,y:7,status:"standing"});Object.assign(goblin,{x:15,y:7,status:"standing"});
   this.ball={x:goblin.x,y:goblin.y,carrier:goblin.id};this.practicePlayer=troll.id;this.note("Throw Team-mate practice: select the Troll, declare the throw, then choose the Goblin and a target square.");
  }
 }
 profile(p){const base=super.profile(p),skills=[...new Set([...base.skills,...(p.extraSkills||[])])].filter(s=>!(p.disabledSkills||[]).includes(s));return {...base,st:+(p.blockST??base.st)+(p.hornsBonus||0),skills};}
 skill(p,name){return !!p&&Number.isInteger(p.team)&&Number.isInteger(p.role)&&this.has(p,name)&&(p.status==="standing"&&!p.distracted||["Jump Up"].includes(name));}
 has(p,name){const b=this.blockAction;if(b&&p.id===b.target.id&&b.blitz&&["Fend","Stand Firm","Wrestle"].includes(name)&&super.has(b.attacker,"Juggernaut"))return false;return super.has(p,name);}
 parameter(p,name){return this.profile(p).skills.find(s=>s.startsWith(name+" ("));}
 keywords(p){return this.profile(p).traits.split(",").map(s=>s.trim().toLowerCase());}
 toggleSkill(id,name){const p=this.players.find(q=>q.id===id),entry=SKILL_CATALOG.find(s=>s.name===name||name.startsWith(s.name.split(" (")[0]+" ("));if(!p||!entry||entry.mandatory||this.pending)return false;p.disabledSkills||=[];p.disabledSkills=p.disabledSkills.includes(name)?p.disabledSkills.filter(s=>s!==name):p.disabledSkills.concat(name);return true;}
 addSkill(id,name){const p=this.players.find(q=>q.id===id),entry=SKILL_CATALOG.find(s=>s.name===name||s.name.includes("(X")&&name.startsWith(s.name.split(" (")[0]+" ("));if(!this.lab||!p||!entry||entry.status==="Deferred"||name.includes("(X"))return false;
  const conflicts={Frenzy:["Grab","Hit and Run","Multiple Block"],Grab:["Frenzy"],Leap:["Pogo"],Pogo:["Leap"]},owned=[...super.profile(p).skills,...(p.extraSkills||[])];if((conflicts[name]||[]).some(s=>owned.includes(s))||["Bullseye","Strong Arm"].includes(name)&&!owned.includes("Throw Team-mate"))return false;p.extraSkills=[...new Set([...(p.extraSkills||[]),name])];return true;}
 used(p,name){return p.skillUses?.[name]===this.skillTurn;}
 use(p,name){p.skillUses||={};p.skillUses[name]=this.skillTurn;this.note("#"+p.number+" uses "+name+".");}
 resetSkillTurn(){this.skillTurn++;this.shadowingCounts={};this.throwUsed||=[false,false];this.throwUsed[this.active]=false;this.throwMate=null;}
 rushLimit(p){return this.skill(p,"Sprint")?3:2;}
 standCost(p){return this.has(p,"Jump Up")?0:super.standCost(p);}
 stand(p,after=null){if(this.has(p,"Jump Up")){p.status="standing";p.spent=0;this.note("Jump Up: stands for free.");if(after)after();return;}super.stand(p,after);}
 canSecure(p){return !!p&&!this.has(p,"Unsteady")&&!this.has(p,"No Ball")&&super.canSecure(p);}
 canBallAction(p,kind){return !!p&&!this.has(p,"My Ball")&&super.canBallAction(p,kind);}
 canBlock(a,d){if(typeof a==="string")a=this.players.find(p=>p.id===a);if(typeof d==="string")d=this.players.find(p=>p.id===d);return super.canBlock(a,d)||!!(this.canStart(a)&&a.status==="prone"&&this.has(a,"Jump Up")&&d&&d.team!==a.team&&d.status==="standing"&&this.onPitch(d)&&this.distance(a,d)===1);}
 activationExtra(p,action,ready,failed){
  const root=()=>{if(this.has(p,"Take Root")&&p.status==="standing"&&!p.rooted)this.test(p,"Take Root",2,ready,()=>{p.rooted=true;this.note("#"+p.number+" is Rooted.");ready();});else ready();};
  if(this.has(p,"Unchannelled Fury"))this.test(p,"Unchannelled Fury",["block","blitz"].includes(action)?2:4,root,()=>{this.mover=null;this.action=null;this.note("Unchannelled Fury ends the activation.");});else root();
 }
 start(id,action="move"){
  const p=this.players.find(q=>q.id===id);if(!this.canStart(p))return false;if(action==="foul"&&this.foulUsed[this.active])return false;
  if(action==="throw-team-mate"){if(!this.canThrowTeamMate(p))return false;this.throwUsed||=[false,false];this.throwUsed[p.team]=true;this.throwMate=null;this.note("#"+p.number+" declares Throw Team-mate.");}
  if(p.rooted&&["move","blitz"].includes(action))return false;
  if(action.startsWith("special:")){const name=action.slice(8);if(!this.skill(p,name)&&!(p.status==="prone"&&name==="Hypnotic Gaze"&&this.has(p,name)))return false;}
  if(action==="foul")this.foulUsed[this.active]=true;p.specialDone=false;
  p.gouged=false;this.preactivation={p,action};return super.start(id,action);
 }
 // Block declarations retain the base activation-trait order, including prone Jump Up declarations.
 block(a,d){const p=this.players.find(q=>q.id===a);if(!this.canBlock(p,d))return false;p.gouged=false;
  return super.block(a,d);
 }
 options(p,kind){let result=super.options(p,kind);if(kind==="Dodge"&&this.departureMarkers(p).some(q=>this.skill(q,"Tackle")))result=result.filter(s=>s!=="Dodge");
  if(kind==="Rush"&&this.skill(p,"Sure Feet")&&!this.used(p,"Sure Feet"))result.push("Sure Feet");if(kind==="Pick up"&&this.skill(p,"Sure Hands"))result.push("Sure Hands");
  if((this.mover===p.id||this.attackRoller===p.id)&&this.skill(p,"Pro")&&!p.proUsed&&!result.includes("Pro"))result.push("Pro");if(this.canTeamReroll(p)&&!result.includes("Team"))result.push("Team");return result;
 }
 departureMarkers(p){const o=this.departureOrigin||p;return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,o)===1);}
 checkTarget(p,kind,target){
  if(["Catch","Pick up","Intercept"].includes(kind)&&this.skill(p,"Extra Arms"))target--;
  if(["Catch","Intercept"].includes(kind))target+=this.disturbance(p);
  if(kind==="Catch"&&this.skill(p,"Nerves of Steel"))target-=this.marking(p);
  if(kind==="Pick up"&&this.skill(p,"Big Hand"))target=parseInt(this.profile(p).ag)-(this.skill(p,"Extra Arms")?1:0);
  if(kind==="Intercept"){if(this.has(p,"Stunty"))target++;if(this.skill(p,"Very Long Legs"))target-=2;}
  if(kind==="Rush"&&this.has(p,"Drunkard"))target++;
  if(kind==="Stand up"&&this.has(p,"Timmm-ber!"))target-=this.players.filter(q=>q.team===p.team&&q.id!==p.id&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,p)===1&&!this.marking(q)).length;
  return target;
 }
 forecastTarget(p,kind,target){if(this.weather==="Blizzard"&&kind==="Rush"||this.weather==="Pouring Rain"&&["Pick up","Catch","Intercept"].includes(kind))target++;return this.checkTarget(p,kind,target);}
 test(p,kind,target,yes,no){
  if(["Catch","Pick up","Secure the Ball","Intercept"].includes(kind)&&this.has(p,"No Ball")){no(1);return;}
  target=this.checkTarget(p,kind,target);
  // Like FFB's modifier-choice step, keep the failed roll suspended until the coach decides.
  // A modifier can still rescue the re-rolled die, but never opens another re-roll window.
  const resolve=(n,mayReroll)=>{
   if(this.success(n,target)){yes(n);return;}
   const bonus=+this.profile(p).st<=3?1:+this.profile(p).st===4?2:3;
   const breakTackle=kind==="Dodge"&&this.skill(p,"Break Tackle")&&!this.used(p,"Break Tackle")&&this.success(n,target-bonus);
   const options=mayReroll?this.options(p,kind):[];if(breakTackle)options.unshift("Break Tackle");
   if(!options.length){no(n);return;}
   this.pending={p,kind,target,roll:n,options,resolve:value=>resolve(value,false),accept:()=>no(n),useModifier:()=>{this.use(p,"Break Tackle");yes(n);}};
   this.note(kind+" failed. Choose a modifier, re-roll or accept the result.");
  };
  resolve(this.roll(kind+" #"+p.number+" needs "+Math.min(6,Math.max(2,target))+"+"),true);
 }
 decide(option){const q=this.pending;if(q&&option==="Break Tackle"&&q.options?.includes(option)&&q.useModifier){this.pending=null;q.useModifier();return true;}if(q&&["Sure Feet","Sure Hands"].includes(option)){if(!q.options.includes(option))return false;this.pending=null;this.use(q.p,option);q.resolve(this.roll(q.kind+" re-roll ("+option+")"));return true;}return super.decide(option);}
 leaderOnPitch(team){return this.players.some(p=>p.team===team&&this.onPitch(p)&&this.has(p,"Leader"));}
 grantLeader(half){for(const t of [0,1])if(this.leaderHalf[t]!==half){this.leaderHalf[t]=half;if(this.leaderOnPitch(t)){this.leaderPool[t]=true;this.note("Leader: one additional re-roll for this half.");}}}
 syncLeader(){for(const t of [0,1])if(!this.leaderOnPitch(t))this.leaderPool[t]=false;}
 rerollsAvailable(team){return this.rerolls[team]+(this.leaderPool[team]&&this.leaderOnPitch(team)?1:0);}
 spendLeader(team){if(!this.driveBonus?.[team]&&this.leaderPool[team]&&this.leaderOnPitch(team)){this.leaderPool[team]=false;this.rerolls[team]++;this.note("Leader re-roll used.");}}
 canTeamReroll(p){return p.team===this.active&&this.rerollsAvailable(p.team)>0&&(!this.match||this.phase==="play");}
 useTeamReroll(p){if(!this.canTeamReroll(p))return false;this.spendLeader(p.team);return super.useTeamReroll(p);}
 disturbance(p){return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&this.has(q,"Disturbing Presence")&&this.distance(q,p)<=3).length;}
 planFrom(p,x,y,fx,fy,spent){
  if(p?.rooted||this.action?.startsWith("special:")&&this.action!=="special:Hypnotic Gaze")return null;let plan=super.planFrom(p,x,y,fx,fy,spent);const jump=Math.max(Math.abs(x-fx),Math.abs(y-fy))===2,leap=this.skill(p,"Leap"),pogo=this.skill(p,"Pogo");
  if(!plan&&jump&&(leap||pogo)&&!this.pending&&!this.finished&&this.inside(x,y)&&!this.at(x,y)&&spent+2<=this.profile(p).ma+this.rushLimit(p)){
   plan={x,y,cost:2,jump:true,rushes:Math.max(0,spent+2-this.profile(p).ma)-Math.max(0,spent-this.profile(p).ma),dodge:false,target:parseInt(this.profile(p).ag)+Math.max(this.marking(p,fx,fy),this.marking(p,x,y)),pickup:!this.ball.carrier&&this.ball.x===x&&this.ball.y===y};
  }
  if(!plan)return null;
  const fromMarkers=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x:fx,y:fy})===1);
  if(plan.jump){const penalty=Math.max(this.marking(p,fx,fy),this.marking(p,x,y));if(pogo)plan.target-=penalty;else if(leap&&penalty>0)plan.target-=penalty-Math.max(1,penalty-1);if(this.skill(p,"Very Long Legs"))plan.target--;}
  if(plan.dodge){if(this.skill(p,"Two Heads"))plan.target--;if(this.has(p,"Titchy"))plan.target--;if(!this.has(p,"Stunty"))plan.target-=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x,y})===1&&this.has(q,"Titchy")).length;}
  if((plan.jump||plan.dodge)&&!pogo&&fromMarkers.some(q=>this.skill(q,"Prehensile Tail")))plan.target++;
  return plan;
 }
 search(p,sx=p?.x,sy=p?.y,spent=p?.spent||0){
  if(!p||!this.skill(p,"Leap")&&!this.skill(p,"Pogo"))return super.search(p,sx,sy,spent);
  const map=new Map(),queue=[{x:sx,y:sy,spent,path:[]}];map.set(sx+","+sy,queue[0]);while(queue.length){queue.sort((a,b)=>a.spent-b.spent);const n=queue.shift();if(map.get(n.x+","+n.y)!==n)continue;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(dx||dy){const x=n.x+dx,y=n.y+dy,plan=this.planFrom(p,x,y,n.x,n.y,n.spent);if(!plan)continue;const next={x,y,spent:n.spent+plan.cost,path:n.path.concat({x,y,plan})},key=x+","+y;if(map.has(key)&&map.get(key).spent<=next.spent)continue;map.set(key,next);queue.push(next);}}return map;
 }
 step(x,y){
  const plan=this.plan(x,y);if(!plan)return false;
  const p=this.players.find(q=>q.id===this.mover);this.departureOrigin={x:p.x,y:p.y};
  const move=()=>{
   if(p.dropOnExit&&this.skill(p,"Fumblerooski")&&!this.has(p,"My Ball")&&this.ball.carrier===p.id){this.ball={x:p.x,y:p.y,carrier:null};p.dropOnExit=false;this.note("Fumblerooski: ball left on the ground without turnover.");}
   return super.step(x,y);
  };
  const holders=(plan.dodge||plan.jump)?this.departureMarkers(p).filter(q=>this.skill(q,"Tentacles")):[];
  if(!holders.length)return move();
  this.interrupt("Tentacles",done=>this.reactionChoice("Tentacles",1-p.team,holders,holder=>{
   if(!holder){done(false);return;}
   // BB2025 TentaclesBehaviour: defender rolls; neither an opposing team
   // re-roll nor Pro (restricted to the acting player) is available here.
   const target=Math.max(2,6-Number(this.profile(holder).st)+Number(this.profile(p).st));
   done(this.success(this.roll("Tentacles #"+holder.number+" needs "+Math.min(6,target)+"+"),target));
  }),held=>{
   if(held){this.note("Tentacles: #"+p.number+" is held in place; activation ends.");this.mover=null;this.action=null;}
   else move();
  });return true;
 }
 movementOutcome(p,plan,origin,failure,done){
  // Capture departure eligibility before Shadowing can relocate a defender.
  const markers=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,origin)===1);
  const arms=failure&&["Dodge","Jump"].includes(failure.kind)?markers.filter(q=>this.skill(q,"Arm Bar")):[];
  const shadow=armBarBy=>{
   const context={armBarBy};
   const candidates=plan.dodge&&!this.at(origin.x,origin.y)?markers.filter(q=>this.skill(q,"Shadowing")&&!q.rooted&&(this.shadowingCounts?.[q.id]||0)<Number(this.profile(q).ma)):[];
   if(!candidates.length){done(context);return;}
   this.interrupt("Shadowing",finish=>this.reactionChoice("Shadowing",1-p.team,candidates,q=>{
    if(q){this.shadowingCounts||={};this.shadowingCounts[q.id]=(this.shadowingCounts[q.id]||0)+1;
     if(this.roll("Shadowing #"+q.number+" needs 4+")>=4){q.x=origin.x;q.y=origin.y;this.note("#"+q.number+" shadows into the vacated square.");if(this.ball.carrier===q.id){this.ball.x=q.x;this.ball.y=q.y;}}
    }
    finish();
   }),()=>done(context));
  };
  if(!arms.length){shadow(null);return;}
  this.interrupt("Arm Bar",finish=>this.reactionChoice("Arm Bar",1-p.team,arms,q=>finish(q)),shadow);
 }
 dropBall(){const p=this.players.find(q=>q.id===this.mover);if(!p||this.pending||this.ball.carrier!==p.id||!this.skill(p,"Fumblerooski")||this.has(p,"My Ball"))return false;p.dropOnExit=!p.dropOnExit;return true;}
 passPreview(x,y){const value=super.passPreview(x,y),p=this.players.find(q=>q.id===this.mover);if(!value)return null;value.target+=this.disturbance(p);if(this.skill(p,"Nerves of Steel"))value.target-=this.marking(p);if(value.band<2&&this.skill(p,"Accurate")||value.band>=2&&this.skill(p,"Cannoneer"))value.target--;return value;}
 passRange(from,to){const normal=super.passRange(from,to),hail=this.skill(from,"Hail Mary Pass")&&this.inside(to.x,to.y)&&(from.x!==to.x||from.y!==to.y);return hail&&(from.hailMary||!normal)?{band:3,name:"Hail Mary Pass",hail:true}:normal;}
 interceptionCandidates(from,to){if(this.passContext?.preview.hail&&this.passContext.p.id===from.id)return [];const candidates=super.interceptionCandidates(from,to).filter(p=>!this.has(p,"No Ball"));return this.skill(from,"Cloud Burster")?candidates.filter(p=>this.skill(p,"Very Long Legs")):candidates;}
 pass(x,y){const p=this.ballActor("pass");if(!p)return false;
  return this.animosity(p,this.at(x,y),()=>super.pass(x,y));
 }
 handoff(id){const p=this.ballActor("handoff"),target=this.players.find(q=>q.id===id);if(!this.canHandoff(target))return false;return this.animosity(p,target,()=>super.handoff(id));}
 animosity(p,target,act){const trait=this.parameter(p,"Animosity");if(!trait||!target||target.team!==p.team)return act();const word=trait.slice(trait.indexOf("(")+1,-1).toLowerCase();if(word!=="all"&&!this.keywords(target).includes(word))return act();this.test(p,"Animosity",2,act,()=>{this.note("Animosity: player refuses the transfer.");this.mover=null;this.action=null;});return true;}
 armourBroken(p,n,bonus=0,by=null){if(this.has(p,"Iron Hard Skin"))return n>=parseInt(this.profile(p).av);if(by&&this.has(by,"Claws")&&n>=8)return true;return n+bonus+(this.has(p,"Chainsaw")?3:0)>=parseInt(this.profile(p).av);}
 canMighty(by,p){return by&&!by.distracted&&this.has(by,"Mighty Blow");}
 canMightyArmour(by,p){return !this.has(p,"Iron Hard Skin")&&this.canMighty(by,p);}
 assists(a,d){
  const guard=p=>this.skill(p,"Guard")&&!this.players.some(q=>q.team!==p.team&&q.team!==this.active&&this.onPitch(q)&&this.skill(q,"Defensive")&&this.distance(p,q)===1);
  const eligible=(p,target,excluded)=>p.id!==a.id&&p.id!==d.id&&this.onPitch(p)&&p.status==="standing"&&!p.distracted&&!p.gouged&&this.distance(p,target)===1&&(this.markedByExcept(p,[excluded.id])===0||guard(p));
  return {offensive:this.players.filter(p=>p.team===a.team&&eligible(p,d,d)).length,defensive:this.players.filter(p=>p.team===d.team&&eligible(p,a,a)).length};
 }
 rollBlock(a,d,blitz=false){
  if(a.status==="prone"&&this.has(a,"Jump Up")){this.mover=a.id;this.test(a,"Jump Up Block",Math.max(2,parseInt(this.profile(a).ag)-1),()=>{a.status="standing";this.mover=null;this.rollBlock(a,d,blitz);},()=>{this.mover=null;this.action=null;});return;}
  const round=this.nextFrenzyRound||1;this.nextFrenzyRound=null;this.attackRoller=a.id;
  const perform=()=>{super.rollBlock(a,d,blitz);this.blockAction.frenzyRound=round;this.attackRoller=null;a.blockST=null;a.hornsBonus=0;
   const hatred=this.parameter(a,"Hatred");if(hatred&&this.keywords(d).includes(hatred.slice(hatred.indexOf("(")+1,-1).toLowerCase())){const index=this.blockAction.dice.indexOf(1);if(index>=0){this.blockAction.poolLocked=true;this.blockAction.dice[index]=this.roll("Hatred Player Down re-roll");}}
  };
  const strength=()=>{a.hornsBonus=blitz&&this.skill(a,"Horns")?1:0;const own=+super.profile(a).st,other=+this.profile(d).st;
   if(this.skill(a,"Dauntless")&&own<other)this.test(a,"Dauntless",other-own+1,()=>{a.blockST=other;perform();},perform);else perform();};
  if(this.has(d,"Foul Appearance"))this.test(a,"Foul Appearance",2,strength,()=>{this.note("Foul Appearance cancels the attack and ends the activation.");this.mover=null;this.action=null;this.blockAction=null;this.attackRoller=null;});else strength();
 }
 resolvePush(knock){const b=this.blockAction;b.pushResolved=true;if(b.target.rooted){if(knock)this.fall(b.target,{turnover:false,mightyBlowBy:b.attacker,after:()=>this.finishBlock()});else this.finishBlock();return;}super.resolvePush(knock);}
 pushSquares(a,d,grab=false){
  const b=this.blockAction;if(this.skill(d,"Sidestep")&&!(b&&d.team!==b.attacker.team&&this.skill(b.attacker,"Grab"))){const open=[];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&this.inside(d.x+dx,d.y+dy)&&!this.at(d.x+dx,d.y+dy))open.push({x:d.x+dx,y:d.y+dy});if(open.length)return open;}
  return super.pushSquares(a,d,grab);
 }
 pushPlayer(p,pos,done,depth=0){if(p.rooted){done(false);return;}super.pushPlayer(p,pos,done,depth);}
 placePushed(p,pos,done){const b=this.blockAction;if(b&&p.id===b.target.id&&this.skill(b.attacker,"Eye Gouge"))p.gouged=true;super.placePushed(p,pos,done);}
 afterPush(origin,knock,pushed){const b=this.blockAction;super.afterPush(origin,knock,pushed);const q=this.pending;if(!b||!q||q.kind!=="Follow-up")return;
  if(b.attacker.rooted){q.resolve("Stay");return;}
  if(this.skill(b.attacker,"Frenzy")){q.resolve("Follow up");return;}
  if(this.skill(b.target,"Taunt")){q.options.push("Defender uses Taunt");const old=q.resolve;q.resolve=option=>old(option==="Defender uses Taunt"?"Follow up":option);}
 }
 afterFollow(a,d,knock,done){if(this.ball.carrier===d.id&&this.skill(a,"Strip Ball")&&!this.skill(d,"Sure Hands")&&!this.skill(d,"Monstrous Mouth")){this.ball={x:d.x,y:d.y,carrier:null};this.note("Strip Ball: ball drops after follow-up.");this.bounce(d.x,d.y,done);}else done();}
 applyBlockResult(result){const b=this.blockAction;if(result==="Both Down"&&b.blitz&&this.skill(b.attacker,"Juggernaut")){this.pending={type:"custom",kind:"Juggernaut",options:["Treat as Push Back","Apply Both Down"],resolve:choice=>{this.pending=null;super.applyBlockResult(choice==="Treat as Push Back"?"Push Back":"Both Down");}};return;}super.applyBlockResult(result);}
 finishBlock(){
  const b=this.blockAction;
  if(b&&!b.turnover&&b.pushResolved&&b.frenzyRound===1&&this.skill(b.attacker,"Frenzy")&&b.target.status==="standing"&&this.onPitch(b.target)&&this.distance(b.attacker,b.target)===1){
   const a=b.attacker,d=b.target;if(!b.blitz||a.spent<this.profile(a).ma+this.rushLimit(a)){
    this.blockAction=null;this.nextFrenzyRound=2;const hit=()=>this.rollBlock(a,d,b.blitz);if(b.blitz){a.spent++;if(a.spent>this.profile(a).ma)this.test(a,"Rush",2,hit,()=>this.fall(a));else hit();}else hit();return;
   }
  }super.finishBlock();
 }
 resolveBothDownChoice(choice){if(choice.includes("Wrestle")){this.blockAction.attacker.rooted=false;this.blockAction.target.rooted=false;}super.resolveBothDownChoice(choice);}
 specialActions(p){if(!p)return [];const result=[];if(this.canStart(p)&&!this.foulUsed[this.active])result.push("Foul");for(const name of ["Stab","Projectile Vomit","Hypnotic Gaze","Breathe Fire","Chainsaw"])if(this.has(p,name)&&(p.status==="standing"||name==="Hypnotic Gaze")&&(this.canStart(p)||this.action==="blitz"&&this.canBlitzBlock()))result.push(name);return result;}
 specialTargets(){const p=this.players.find(q=>q.id===this.mover);if(!p||this.pending||p.specialDone)return [];if(this.action!=="foul"&&!this.action?.startsWith("special:"))return [];return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&this.distance(p,q)===1&&(this.action==="foul"?["prone","stunned"].includes(q.status):q.status==="standing"));}
 performSpecial(targetId,blitzName=null){
  const p=this.players.find(q=>q.id===this.mover),target=this.players.find(q=>q.id===targetId);if(!p||!target)return false;
  if(blitzName){if(!this.canBlitzBlock()||target.id!==this.blitzTarget||!this.skill(p,blitzName)||!["Stab","Projectile Vomit","Breathe Fire","Chainsaw"].includes(blitzName))return false;p.spent++;this.blitzBlocked=true;const run=()=>this.specialAttack(p,target,blitzName);if(p.spent>this.profile(p).ma)this.test(p,"Rush",2,run,()=>this.fall(p));else run();return true;}
  if(!this.specialTargets().includes(target))return false;p.specialDone=true;if(this.action==="foul")this.foul(p,target);else this.specialAttack(p,target,this.action.slice(8));return true;
 }
 specialAttack(p,target,name){
  const finish=()=>{this.mover=null;this.action=null;this.checkScore();},perform=()=>{
   if(name==="Hypnotic Gaze"){this.test(p,"Hypnotic Gaze",3,()=>{target.distracted=true;finish();},finish);return;}
   if(name==="Stab"){this.armourOnly(target,finish);return;}
   if(name==="Projectile Vomit"){this.test(p,name,2,()=>this.armourOnly(target,finish),()=>this.armourOnly(p,finish));return;}
   if(name==="Chainsaw"){this.test(p,"Chainsaw kick-back",2,()=>this.armourOnly(target,finish,{bonus:this.has(target,"Iron Hard Skin")?0:3}),()=>this.fall(p));return;}
   if(name==="Breathe Fire"){
    const penalty=+this.profile(target).st>=5?1:0;this.test(p,"Breathe Fire",4+penalty,n=>{
     if(n===6){this.fall(target,{turnover:false,after:finish});return;}target.status="prone";target.rooted=false;if(this.ball.carrier===target.id){this.ball={x:target.x,y:target.y,carrier:null};this.bounce(target.x,target.y,finish);}else finish();
    },n=>{if(n===1||n-penalty===1)this.fall(p);else finish();});
   }
  };
  if(this.has(target,"Foul Appearance"))this.test(p,"Foul Appearance",2,perform,finish);else perform();
 }
 injuryResult(p,total){const stunty=this.has(p,"Stunty"),thick=this.has(p,"Thick Skull"),stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
  if(total<=stunMax)p.status="stunned";else if(total<=koMax)p.status="knocked-out";else if(this.has(p,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)p.status="reserve";else p.status="casualty";
  if(["knocked-out","casualty","reserve"].includes(p.status)){p.x=null;p.y=null;}p.rooted=false;this.note("#"+p.number+" injury result: "+p.status+".");
 }
 armourOnly(p,done,{bonus=0,injuryBonus=0,onDice=null}={}){
  const a=this.roll("Armour"),b=this.roll("Armour");if(onDice)onDice("Armour",a,b);if(a+b+bonus<parseInt(this.profile(p).av)){this.note("Armour holds.");done();return;}
  const x=p.x,y=p.y,carrying=this.ball.carrier===p.id,c=this.roll("Injury"),d=this.roll("Injury");if(onDice)onDice("Injury",c,d);this.injuryResult(p,c+d+injuryBonus);
  const finish=()=>{this.syncLeader?.();if(carrying&&p.team===this.active)this.endTurn(true);else done();};if(carrying){this.ball={x,y,carrier:null};this.bounce(x,y,finish);}else finish();
 }
 foul(p,target){
  const helpers=(team,victim,excluded,offensive)=>this.players.filter(q=>q.team===team&&q.id!==p.id&&q.id!==target.id&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&!q.gouged&&this.distance(q,victim)===1&&(this.markedByExcept(q,[excluded.id])===0||offensive&&this.skill(q,"Put the Boot In")&&!this.players.some(r=>r.team!==q.team&&r.team!==this.active&&this.skill(r,"Defensive")&&this.onPitch(r)&&this.distance(r,q)===1))).length;
  const offense=helpers(p.team,target,target,true),defense=helpers(target.team,p,p,false),modifier=this.has(target,"Iron Hard Skin")?0:offense-defense;
  this.note("Foul: "+offense+" offensive and "+defense+" defensive assist(s).");let sent=false;
  const finishNormal=()=>{if(this.skill(p,"Quick Foul")){this.note("Quick Foul: remaining movement is available.");}else{this.mover=null;this.action=null;}},finish=()=>{if(sent)this.sendOff(p,turnover=>turnover?this.endTurn(true):finishNormal());else finishNormal();},rollArmour=(rerolled=false)=>{
   const a=this.roll("Foul Armour"),b=this.roll("Foul Armour"),raw=a+b,dirty=this.skill(p,"Dirty Player"),skin=this.has(target,"Iron Hard Skin");
   const afterArmour=bonus=>{const broken=raw+modifier+bonus>=parseInt(this.profile(target).av);
    const keep=()=>{if(a===b&&(!this.skill(p,"Sneaky Git")||broken))sent=true;
     if(!broken){finish();return;}
     const c=this.roll("Foul Injury"),d=this.roll("Foul Injury");if(c===d)sent=true;
     const apply=add=>{this.injuryResult(target,c+d+add);finish();};if(dirty&&!bonus)this.pending={type:"custom",kind:"Dirty Player",options:["Add +1 to Injury","No modifier"],resolve:choice=>{this.pending=null;apply(choice==="Add +1 to Injury"?1:0);}};else apply(0);
    };
    const stalling=this.wouldEndTurnTriggerStalling?.(p);
    if(!rerolled&&!offense&&!defense&&this.skill(p,"Lone Fouler")&&(!broken||a===b||stalling))this.pending={type:"custom",kind:"Lone Fouler",options:["Re-roll Armour","Keep result"],resolve:choice=>{this.pending=null;if(choice==="Re-roll Armour"){sent=false;rollArmour(true);}else keep();}};
    else keep();
   };
   if(dirty&&!skin&&raw+modifier<parseInt(this.profile(target).av))this.pending={type:"custom",kind:"Dirty Player",options:["Add +1 to Armour","No modifier"],resolve:choice=>{this.pending=null;afterArmour(choice==="Add +1 to Armour"?1:0);}};else afterArmour(0);
  };rollArmour();
 }
 sendOff(p,done){
  this.argueBanned||=[false,false];const options=["Accept send-off"];if(!this.argueBanned[p.team])options.unshift("Argue the Call");
  this.pending={type:"custom",kind:"Sent-off — "+this.teams[p.team].name+" #"+p.number,options,resolve:choice=>{
   this.pending=null;let saved=false,rolledOne=false;if(choice==="Argue the Call"){const n=this.roll("Argue the Call");saved=n===6;if(n===1){rolledOne=true;this.argueBanned[p.team]=true;}}
   if(saved){this.note("Argue the Call succeeds; player remains, turnover still applies.");done(true);return;}
   const remove=()=>{const x=p.x,y=p.y,carrying=this.ball.carrier===p.id;Object.assign(p,{x:null,y:null,status:"sent-off"});this.note("Player is Sent-off.");if(carrying){this.ball={x,y,carrier:null};this.bounce(x,y,()=>done(true));}else done(true);};
   const bribe=()=>{if(rolledOne||(this.bribes?.[p.team]||0)<1){remove();return;}
    this.pending={type:"custom",kind:"Bribe",options:["Use Bribe","Accept send-off"],resolve:option=>{this.pending=null;if(option==="Use Bribe"){this.bribes[p.team]--;if(this.roll("Bribe needs 2+")>=2){this.note("Bribe succeeds: no send-off or turnover.");done(false);return;}bribe();}else remove();}};
   };bribe();
  }};
 }
 fall(p,options={}){p.rooted=false;const old=options.after;return super.fall(p,{...options,after:()=>{this.syncLeader();if(old)old();}});}
 endTurn(turnover=false){const previous=this.active,result=super.endTurn(turnover);if(result){this.resetSkillTurn();this.foulUsed[this.active]=false;this.pickMeUp(previous);}return result;}
 pickMeUp(endingTeam){const sources=this.players.filter(p=>p.team===1-endingTeam&&this.onPitch(p)&&this.skill(p,"Pick-me-up")),eligible=this.players.filter(p=>p.team===1-endingTeam&&p.status==="prone"&&this.onPitch(p)&&sources.some(q=>this.distance(q,p)<=3));for(const p of eligible)if(this.roll("Pick-me-up #"+p.number)>=5)p.status="standing";}
}
if(typeof module!=="undefined")module.exports={SkillGame,SKILL_CATALOG,SKILL_GROUPS};
