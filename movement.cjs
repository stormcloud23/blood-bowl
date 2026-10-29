"use strict";
// Movement practice engine. Sources and boundaries: docs/MOVEMENT.md.
class MovementGame {
 constructor(teams, {dice=null, scenario="teams"}={}) {
  this.teams=teams; this.dice=dice || (s=>1+Math.floor(Math.random()*s));
  this.active=scenario==="block"?1:0; this.turns=[1,0]; this.rerolls=[2,2]; this.mover=null;
  this.pending=null; this.interruptions=[]; this.finished=false; this.events=[]; this.ball={x:12,y:7,carrier:null};
  this.action=null;this.blockAction=null;this.secureUsed=[false,false];this.blitzUsed=[false,false];this.blitzTarget=null;this.blitzBlocked=false;this.practicePlayer=null;
  this.passUsed=[false,false];this.handoffUsed=[false,false];this.ballActionDone=false;
  this.players=teams.flatMap((t,team)=>t.lineup.map((role,i)=>({
   id:team+"-"+(i+1),number:i+1,team,role,x:team?16+i%3:9-i%3,y:2+Math.floor(i/3)*3,
   status:"standing",distracted:false,used:false,spent:0,dodgeUsed:false,proUsed:false,stunnedAtStart:false
  })));
  if(scenario!=="teams") {
   const a=this.players[0],b=this.players[11],c=this.players[1];
   this.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve";});
   [a,b,c].forEach(p=>{p.status="standing";});
   Object.assign(a,{x:10,y:7});Object.assign(b,{x:11,y:7});Object.assign(c,{x:9,y:7});
   this.ball={x:12,y:9,carrier:null};
   if(scenario==="jump"){b.status="prone";c.status="prone";}
   if(scenario==="pickup"){b.x=18;this.ball={x:11,y:7,carrier:null};}
   if(scenario==="traits"){a.role=4;b.role=2;b.x=13;c.x=12;c.team=1;c.role=0;}
   if(scenario==="secure"){this.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve";});Object.assign(a,{x:9,y:7,status:"standing"});this.ball={x:15,y:7,carrier:null};this.practicePlayer=a.id;}
   if(["pass","handoff"].includes(scenario)){
    this.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve";});
    Object.assign(a,{x:8,y:7,status:"standing",role:1});Object.assign(c,{x:scenario==="pass"?14:10,y:7,status:"standing",role:3});
    if(scenario==="pass")Object.assign(b,{x:11,y:7,status:"standing"});
    this.ball={x:a.x,y:a.y,carrier:a.id};this.practicePlayer=a.id;
   }
   if(scenario==="blitz"){
    this.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve";});
    Object.assign(a,{x:8,y:7,status:"standing",role:3});Object.assign(b,{x:12,y:7,status:"standing"});
    this.ball={x:20,y:7,carrier:null};this.practicePlayer=a.id;
   }
   if(scenario==="block"){
    this.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve";});
    const attacker=this.players[15],target=this.players[5],helper=this.players[11];
    [attacker,target,helper].forEach(p=>{p.status="standing";});
    Object.assign(attacker,{x:10,y:7});Object.assign(target,{x:11,y:7});Object.assign(helper,{x:10,y:6});
    this.ball={x:20,y:7,carrier:null};this.practicePlayer=attacker.id;
   }
  }
  this.note((scenario==="block"?"Block practice started.":scenario==="secure"?"Secure the Ball practice started.":"Movement practice started.")+" Perfect Conditions; two team re-rolls each.");
 }
 profile(p){return this.teams[p.team].positions[p.role];}
 has(p,skill){return this.profile(p).skills.includes(skill);}
 rushLimit(p){return 2;}
 standCost(p){return Math.min(3,this.profile(p).ma);}
 armourBroken(p,roll,bonus=0,by=null){return roll+bonus>=Number.parseInt(this.profile(p).av);}
 canMighty(by,p){return by&&this.has(by,"Mighty Blow");}
 canMightyArmour(by,p){return this.canMighty(by,p);}
 canTeamReroll(p){return p.team===this.active&&this.rerolls[p.team]>0;}
 useTeamReroll(p){
  if(!this.canTeamReroll(p))return false;
  this.rerolls[p.team]--;
  const loner=this.profile(p).skills.find(s=>s.startsWith("Loner ("));
  return !loner||this.roll("Loner needs "+loner.match(/\d+/)[0]+"+")>=Number(loner.match(/\d+/)[0]);
 }
 attemptPro(p,yes,no){
  p.proUsed=true;
  if(this.roll("Pro needs 3+")>=3){yes();return;}
  if(!this.canTeamReroll(p)){no();return;}
  this.pending={type:"custom",kind:"Pro",options:["Team re-roll Pro","Accept Pro failure"],resolve:choice=>{
   this.pending=null;if(choice==="Team re-roll Pro"&&this.useTeamReroll(p)&&this.roll("Pro re-roll needs 3+")>=3)yes();else no();
  }};
 }
 // Keep the interrupted action on the stack until its reaction (including nested
 // decisions) completes. Pop before resuming, so a continuation can interrupt again.
 interrupt(kind,react,resume){
  if(this.pending)throw Error("Resolve the pending decision before interrupting");
  const frame={kind,done:false};this.interruptions.push(frame);
  const complete=value=>{
   if(frame.done||this.interruptions.at(-1)!==frame||this.pending)return false;
   frame.done=true;this.interruptions.pop();resume(value);return true;
  };
  react(complete);return complete;
 }
 reactionChoice(kind,team,candidates,resolve){
  const options=candidates.map(p=>"#"+p.number+" ("+p.id+")").concat("Decline");
  const q={type:"custom",kind:this.teams[team].name+" — "+kind,team,options,resolve:choice=>{
   if(this.pending!==q||!options.includes(choice))return false;
   this.pending=null;resolve(candidates[options.indexOf(choice)]||null);return true;
  }};this.pending=q;
 }
 activationExtra(p,action,ready,failed){ready();}
 afterFollow(a,d,knock,done){done();}
 onBlockRolled(p){}
 onPitch(p){return Number.isInteger(p.x)&&Number.isInteger(p.y);}
 at(x,y){return this.players.find(p=>this.onPitch(p)&&p.x===x&&p.y===y);}
 inside(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<26&&y>=0&&y<15;}
 distance(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));}
 marking(p,x=p.x,y=p.y){return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x,y})===1).length;}
 markingAt(p,x,y){return this.marking(p,x,y);}
 bigGuy(p){return this.profile(p).traits.split(",").map(s=>s.trim()).includes("Big Guy");}
 note(s){this.events.unshift(s);this.events=this.events.slice(0,150);}
 roll(label,sides=6){const n=this.dice(sides);if(!Number.isInteger(n)||n<1||n>sides)throw Error("Invalid die");this.note(label+": "+n+" (D"+sides+").");return n;}
 success(n,target){return n===6||(n!==1&&n>=target);}
 canStart(p){return p&&this.onPitch(p)&&p.team===this.active&&!p.used&&["standing","prone"].includes(p.status)&&!this.mover&&!this.pending&&!this.finished;}
 canSecure(p){
  if(!this.canStart(p)||this.secureUsed[this.active]||this.bigGuy(p)||this.ball.carrier||!this.inside(this.ball.x,this.ball.y))return false;
  if(this.players.some(q=>q.team!==this.active&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,this.ball)<=2))return false;
  const spent=p.status==="prone"?this.standCost(p):0;
  return p.x===this.ball.x&&p.y===this.ball.y||this.search(p,p.x,p.y,spent).has(this.ball.x+","+this.ball.y);
 }
 canBlock(attacker,target){
  const a=typeof attacker==="string"?this.players.find(p=>p.id===attacker):attacker;
  const d=typeof target==="string"?this.players.find(p=>p.id===target):target;
  return this.canStart(a)&&a.status==="standing"&&d&&d.team!==this.active&&this.onPitch(d)&&d.status==="standing"&&this.distance(a,d)===1;
 }
 canBallAction(p,kind){return this.canStart(p)&&["pass","handoff"].includes(kind)&&!(kind==="pass"?this.passUsed:this.handoffUsed)[this.active];}
 ballActor(kind){const p=this.players.find(p=>p.id===this.mover);return this.action===kind&&!this.ballActionDone&&!this.pending&&!this.finished&&p?.status==="standing"&&!p.distracted&&this.ball.carrier===p.id?p:null;}
 canHandoff(target){const p=this.ballActor("handoff");return !!(p&&target&&p.id!==target.id&&p.team===target.team&&this.onPitch(target)&&target.status==="standing"&&!target.distracted&&this.distance(p,target)===1);}
 handoff(targetId){
  const target=this.players.find(p=>p.id===targetId);if(!this.canHandoff(target))return false;
  const p=this.ballActor("handoff");this.ballActionDone=true;this.ball={x:target.x,y:target.y,carrier:null};
  this.note("#"+p.number+" hands off to #"+target.number+".");
  this.test(target,"Catch",Number.parseInt(this.profile(target).ag)+this.marking(target),()=>{
   this.ball.carrier=target.id;this.checkScore();this.finishBallAction(p,true);
  },()=>this.bounce(target.x,target.y,()=>this.finishBallAction(p,true)));return true;
 }
 passRange(from,to){
  const x=Math.abs(to.x-from.x),y=Math.abs(to.y-from.y);if(!this.inside(to.x,to.y)||!x&&!y)return null;
  // 2025 Passing Range Chart, indexed by vertical displacement; symmetric under rotation/reflection.
  const limits=[[3,3,2,1],[6,6,6,6,5,4,3],[10,10,10,9,9,8,8,7,6,4,2],[13,13,13,12,12,11,11,10,10,9,8,6,4,2]];
  const band=limits.findIndex(row=>y<row.length&&x<=row[y]);return band<0?null:{band,name:["Quick Pass","Short Pass","Long Pass","Long Bomb"][band]};
 }
 passPreview(x,y){const p=this.ballActor("pass"),range=p&&this.passRange(p,{x,y});if(!range)return null;return {...range,target:Number.parseInt(this.profile(p).pa)+range.band+this.marking(p)};}
 pass(x,y){
  const preview=this.passPreview(x,y);if(!preview)return false;
  const p=this.ballActor("pass");this.ballActionDone=true;
  this.note("#"+p.number+" attempts a "+preview.name+" to "+(x+1)+", "+(y+1)+"; PA "+preview.target+"+.");
  this.passContext={p,preview};
  const modifier=preview.target-Number.parseInt(this.profile(p).pa),target=Number.parseInt(this.profile(p).pa),resolve=n=>{
   this.pending=null;
   if(n===1&&this.has(p,"Safe Pass")){this.note("Safe Pass: possession retained; activation ends.");this.mover=null;this.action=null;this.passContext=null;return;}
   this.ball={x:p.x,y:p.y,carrier:null};
   if(n===1||n-modifier===1&&n!==6){this.note("Fumbled Pass: ball bounces from the thrower; turnover.");this.bounce(p.x,p.y,()=>this.endTurn(true));return;}
   const accurate=!preview.hail&&(n===6||n-modifier>=target);
   this.note(accurate?"Accurate Pass.":"Inaccurate Pass: Scatter (3).");
   const land=(lx,ly)=>this.interceptPass(p,{x:lx,y:ly},accurate,()=>{const ground=!this.at(lx,ly);this.landBall(lx,ly,false,()=>this.finishBallAction(p,preview.band===0,ground),true);});
   if(accurate)land(x,y);else this.scatterPass(x,y,land,()=>this.throwIn(this.ball.x,this.ball.y,()=>this.finishBallAction(p,preview.band===0)));
  };
  const roll=this.roll("Pass accuracy needs "+Math.min(6,preview.target)+"+");
  if(roll===6||roll!==1&&roll>=preview.target){resolve(roll);return true;}
  const options=this.options(p,"Pass");if(options.length)this.pending={p,kind:"Pass",target:preview.target,roll,options,resolve};else resolve(roll);return true;
 }
 scatterPass(x,y,land,out){
  const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  for(let i=0;i<3;i++){const [dx,dy]=dirs[this.roll("Pass scatter",8)-1];if(!this.inside(x+dx,y+dy)){this.ball={x,y,carrier:null};out();return;}x+=dx;y+=dy;}
  land(x,y);
 }
 interceptionCandidates(from,to){
  const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);if(!len)return [];
  // Rectangle of the ruler (one square wide), tested against each player square using separating axes.
  const ux=dx/len,uy=dy/len,mx=(from.x+to.x)/2,my=(from.y+to.y)/2;
  return this.players.filter(p=>p.team!==from.team&&this.onPitch(p)&&p.status==="standing"&&!p.distracted&&
   [[1,0],[0,1],[ux,uy],[-uy,ux]].every(([ax,ay])=>Math.abs((p.x-mx)*ax+(p.y-my)*ay)<.5*(Math.abs(ax)+Math.abs(ay))+len/2*Math.abs(ux*ax+uy*ay)+.5*Math.abs(-uy*ax+ux*ay)-1e-9));
 }
 interceptPass(p,to,accurate,land){
  const candidates=this.interceptionCandidates(p,to);if(!candidates.length){land();return;}
  const options=candidates.map(q=>"Intercept with #"+q.number);options.push("Decline interception");
  this.pending={type:"custom",kind:this.teams[1-p.team].name+" interception",options,resolve:choice=>{
   this.pending=null;const index=options.indexOf(choice);if(index===candidates.length){land();return;}
   const q=candidates[index];this.test(q,"Intercept",Number.parseInt(this.profile(q).ag)+(accurate?3:2)+this.marking(q),()=>{
    this.ball={x:q.x,y:q.y,carrier:q.id};this.note("#"+q.number+" intercepts the pass.");this.checkScore();this.endTurn(true);
   },land);
  }};
 }
 finishBallAction(p,allowGiveAndGo,forcedTurnover=false){
  if(this.finished)return;
  const carrier=this.players.find(q=>q.id===this.ball.carrier);
  if(forcedTurnover||!carrier||carrier.team!==p.team){this.endTurn(true);return;}
  if(allowGiveAndGo&&this.has(p,"Give and Go")){this.note("Give and Go: #"+p.number+" may continue moving.");return;}
  this.note("Ball action resolved; activation ends.");this.mover=null;this.action=null;
 }
 canBlitz(p,target){
  if(!this.canStart(p)||this.blitzUsed[this.active]||!target||target.team===p.team||!this.onPitch(target)||target.status!=="standing")return false;
  const spent=p.status==="prone"?this.standCost(p):0;
  return [...this.search(p,p.x,p.y,spent).values()].some(n=>this.distance(n,target)===1&&n.spent<this.profile(p).ma+this.rushLimit(p));
 }
 startBlitz(id,targetId){
  const p=this.players.find(p=>p.id===id),target=this.players.find(p=>p.id===targetId);
  if(!this.canBlitz(p,target))return false;
  this.blitzUsed[this.active]=true;this.blitzTarget=targetId;this.blitzBlocked=false;
  this.note("Blitz target: "+this.teams[target.team].name+" #"+target.number+".");
  return this.start(id,"blitz");
 }
 canBlitzBlock(){
  const p=this.players.find(p=>p.id===this.mover),target=this.players.find(p=>p.id===this.blitzTarget);
  return this.action==="blitz"&&!this.blitzBlocked&&!this.pending&&!this.finished&&p?.status==="standing"&&!p.distracted&&target?.status==="standing"&&this.onPitch(target)&&this.distance(p,target)===1&&p.spent<this.profile(p).ma+this.rushLimit(p);
 }
 blitzBlock(){
  if(!this.canBlitzBlock())return false;
  const p=this.players.find(p=>p.id===this.mover),target=this.players.find(p=>p.id===this.blitzTarget);
  p.spent++;this.blitzBlocked=true;
  const hit=()=>this.rollBlock(p,target,true);
  if(p.spent>this.profile(p).ma)this.test(p,"Rush",2,hit,()=>this.fall(p));else hit();
  return true;
 }
 markedByExcept(player,excludedIds=[]){
  const excluded=new Set(excludedIds);
  return this.players.filter(q=>q.id!==player.id&&!excluded.has(q.id)&&q.team!==player.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,player)===1).length;
 }
 assists(attacker,target){
  const eligible=(p,markTarget,exclude)=>p.id!==attacker.id&&p.id!==target.id&&p.team===attacker.team&&p.status==="standing"&&!p.distracted&&this.onPitch(p)&&this.distance(p,markTarget)===1&&(this.markedByExcept(p,[exclude.id])===0||this.has(p,"Guard"));
  const offensive=this.players.filter(p=>eligible(p,target,target)).length;
  const defensive=this.players.filter(p=>p.id!==attacker.id&&p.id!==target.id&&p.team===target.team&&p.status==="standing"&&!p.distracted&&this.onPitch(p)&&this.distance(p,attacker)===1&&(this.markedByExcept(p,[attacker.id])===0||this.has(p,"Guard"))).length;
  return {offensive,defensive};
 }
 block(attackerId,targetId){
  const attacker=this.players.find(p=>p.id===attackerId),target=this.players.find(p=>p.id===targetId);
  if(!this.canBlock(attacker,target))return false;
  attacker.used=true;attacker.distracted=false;this.action="block";this.mover=attacker.id;
  const perform=()=>{this.mover=null;this.rollBlock(attacker,target,false);},failed=()=>{attacker.distracted=true;this.mover=null;this.action=null;this.note("Block activation trait failed; activation ends without turnover.");},ready=()=>this.activationExtra(attacker,"block",perform,failed);
  if(this.has(attacker,"Bone Head"))this.test(attacker,"Bone Head",2,ready,failed);
  else if(this.has(attacker,"Really Stupid")){const helper=this.players.some(q=>q.id!==attacker.id&&q.team===attacker.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&!this.has(q,"Really Stupid")&&this.distance(q,attacker)===1);this.test(attacker,"Really Stupid",helper?2:4,ready,failed);}
  else ready();return true;
 }
 rollBlock(attacker,target,blitz=false){
  const assists=this.assists(attacker,target),aStrength=Number(this.profile(attacker).st)+assists.offensive,dStrength=Number(this.profile(target).st)+assists.defensive;
  const higher=Math.max(aStrength,dStrength),lower=Math.min(aStrength,dStrength);
  const count=aStrength===dStrength?1:higher>2*lower?3:2;
  const chooserTeam=aStrength===dStrength?this.active:aStrength>dStrength?attacker.team:target.team;
  this.blockAction={attacker,target,assists,aStrength,dStrength,count,chooserTeam,dice:[],poolLocked:false,brawlerUsed:false,blitz};
  this.note("#"+attacker.number+" declares Block against "+this.teams[target.team].name+" #"+target.number+". Strength "+aStrength+" vs "+dStrength+" after "+assists.offensive+" offensive and "+assists.defensive+" defensive assist(s); roll "+count+" Block Dice.");
  this.blockAction.dice=Array.from({length:count},(_,i)=>this.roll("Block die "+(i+1)));
  this.onBlockRolled(attacker);
  this.pending={type:"blockSelect"};return true;
 }
 blockFace(n){return ["","Player Down","Both Down","Push Back","Push Back","Stumble","POW"][n];}
 rerollBlock(source,index=null){
  const b=this.blockAction;if(!b||this.pending?.type!=="blockSelect"||b.poolLocked)return false;
  if(source==="Team"){
   if(!this.canTeamReroll(b.attacker))return false;
   if(!this.useTeamReroll(b.attacker)){b.poolLocked=true;this.pending={type:"blockSelect"};this.note("Loner failed; the team re-roll is lost.");return true;}
   b.poolLocked=true;b.dice=b.dice.map((_,i)=>this.roll("Block die "+(i+1)+" team re-roll"));
   this.pending={type:"blockSelect"};this.note("Team re-roll: re-rolled the Block Dice pool.");return true;
  }
  if(source==="Brawler"){
   const a=b.attacker;if(b.blitz||!this.has(a,"Brawler")||b.brawlerUsed||index===null||this.blockFace(b.dice[index])!=="Both Down")return false;
   b.brawlerUsed=true;b.poolLocked=true;b.dice[index]=this.roll("Brawler re-roll for Block die "+(index+1));this.pending={type:"blockSelect"};return true;
  }
  if(source==="Pro"){
   const a=b.attacker;if(!this.has(a,"Pro")||a.proUsed)return false;
   b.poolLocked=true;this.pending=null;
   this.attemptPro(a,()=>{this.pending={type:"blockProChoose"};},()=>{this.note("Pro failed; no re-roll.");this.pending={type:"blockSelect"};});return true;
  }
  return false;
 }
 rerollBlockDie(index){
  const b=this.blockAction;if(!b||!this.pending||this.pending.type!=="blockProChoose"||!Number.isInteger(index)||index<0||index>=b.dice.length)return false;
  b.dice[index]=this.roll("Pro re-roll for Block die "+(index+1));this.pending={type:"blockSelect"};return true;
 }
 selectBlockDie(index){
  const b=this.blockAction;if(!b||!this.pending||this.pending.type!=="blockSelect"||!Number.isInteger(index)||index<0||index>=b.dice.length)return false;
  const result=this.blockFace(b.dice[index]);this.pending=null;this.note("Chosen Block result: "+result+".");this.applyBlockResult(result);return true;
 }
 applyBlockResult(result){
  const b=this.blockAction;if(!b)return;
  const {attacker:a,target:d}=b;
  if(result==="Player Down"){this.fall(a,{turnover:a.team===this.active,mightyBlowBy:d,after:()=>this.finishBlock()});return;}
  if(result==="Both Down"){this.resolveBothDown();return;}
  if(result==="Stumble")result=this.has(d,"Dodge")&&!d.distracted&&!this.has(a,"Tackle")?"Push Back":"POW";
  if(result==="Push Back"||result==="POW"){this.resolvePush(result==="POW");return;}
  this.finishBlock();
 }
 resolveBothDown(){
  const b=this.blockAction,{attacker:a,target:d}=b,options=["Apply Both Down"];
  const canAttackerBlock=this.has(a,"Block")&&!a.distracted,canDefenderBlock=this.has(d,"Block")&&!d.distracted;
  if(canAttackerBlock)options.push("Attacker uses Block");
  if(canDefenderBlock)options.push("Defender uses Block");
  if(canAttackerBlock&&canDefenderBlock)options.push("Both use Block");
  if(this.has(a,"Wrestle")&&!a.distracted)options.push("Attacker uses Wrestle");
  if(this.has(d,"Wrestle")&&!d.distracted)options.push("Defender uses Wrestle");
  if(options.length===1){this.resolveBothDownChoice(options[0]);return;}
  this.pending={type:"custom",kind:"Both Down",options,resolve:choice=>{this.pending=null;this.resolveBothDownChoice(choice);}};
 }
 resolveBothDownChoice(choice){
  const b=this.blockAction,{attacker:a,target:d}=b;
  if(choice.includes("Wrestle")){
   this.note(choice+": both players are placed prone without Armour Rolls.");
   let i=0,turnover=false;const prone=[a,d];prone.forEach(p=>p.status="prone");const next=()=>{
    if(i>=prone.length){if(turnover)this.endTurn(true);else this.finishBlock();return;}
    const p=prone[i++],carrying=this.ball.carrier===p.id;if(p.team===this.active&&carrying)turnover=true;
    p.status="prone";this.note("#"+p.number+" is placed prone by Wrestle.");
    if(carrying){const {x,y}=p;this.ball={x,y,carrier:null};this.bounce(x,y,next);}else next();
   };next();return;
  }
  const down=[];
  if(choice!=="Attacker uses Block"&&choice!=="Both use Block")down.push({p:a,by:d});
  if(choice!=="Defender uses Block"&&choice!=="Both use Block")down.push({p:d,by:a});
  this.resolveBlockDowns(down);
 }
 resolveBlockDowns(down){
  let i=0;const turnover=down.some(v=>v.p.team===this.active),next=()=>{
   if(i>=down.length){if(turnover)this.endTurn(true);else this.finishBlock();return;}
   const {p,by}=down[i++];this.fall(p,{turnover:false,mightyBlowBy:by,after:next});
  };next();
 }
 finishBlock(){
  const b=this.blockAction;if(this.finished)return;
  if(b?.turnover){this.blockAction=null;this.action=null;this.endTurn(true);return;}
  this.note("Block action resolved.");this.blockAction=null;if(b?.blitz){this.action="blitz";this.checkScore();}else this.action=null;
 }
 pushSquares(attacker,target,grab=false){
  const dx=Math.sign(target.x-attacker.x),dy=Math.sign(target.y-attacker.y);
  const around=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  let coords=grab?around.map(([x,y])=>({x:target.x+x,y:target.y+y})):!dy?[-1,0,1].map(y=>({x:target.x+dx,y:target.y+y})):!dx?[-1,0,1].map(x=>({x:target.x+x,y:target.y+dy})):[{x:target.x+dx,y:target.y+dy},{x:target.x+dx,y:target.y},{x:target.x,y:target.y+dy}];
  coords=coords.filter((v,i,a)=>a.findIndex(q=>q.x===v.x&&q.y===v.y)===i);
  if(grab){const open=coords.filter(v=>this.inside(v.x,v.y)&&!this.at(v.x,v.y));if(open.length)return open;return this.pushSquares(attacker,target,false);}
  const open=coords.filter(v=>this.inside(v.x,v.y)&&!this.at(v.x,v.y));return open.length?open:coords;
 }
 resolvePush(knockTarget){
  const b=this.blockAction,a=b.attacker,d=b.target;
  const proceed=()=>{
   const options=this.pushSquares(a,d,!b.blitz&&this.has(a,"Grab")&&!a.distracted);
   if(!options.length){if(knockTarget)this.fall(d,{turnover:false,mightyBlowBy:a,after:()=>this.finishBlock()});else this.finishBlock();return;}
   this.pending={type:"pushChoice",kind:"Push back",target:d,options,resolve:pos=>{
    this.pending=null;const origin={x:d.x,y:d.y};this.pushPlayer(d,pos,ok=>this.afterPush(origin,knockTarget,ok));
   }};
  };
  if(this.has(d,"Stand Firm")&&!d.distracted)this.pending={type:"custom",kind:"Stand Firm",options:["Stand Firm","Be pushed"],resolve:choice=>{
   this.pending=null;if(choice==="Stand Firm"){this.note("#"+d.number+" uses Stand Firm.");if(knockTarget)this.fall(d,{turnover:false,mightyBlowBy:a,after:()=>this.finishBlock()});else this.finishBlock();}else proceed();
  }};else proceed();
 }
 pushPlayer(victim,destination,done,depth=0){
  if(depth>this.players.length+1){done(false);return;}
  const from={x:victim.x,y:victim.y};
  if(!this.inside(destination.x,destination.y)){
   const carrying=this.ball.carrier===victim.id;this.note("#"+victim.number+" is pushed into the Crowd.");victim.x=null;victim.y=null;
   if(victim.team===this.active&&this.blockAction)this.blockAction.turnover=true;
   const injury=this.roll("Crowd injury")+this.roll("Crowd injury"),stunty=this.has(victim,"Stunty"),thick=this.has(victim,"Thick Skull"),stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
   if(injury<=stunMax)victim.status="reserve";else if(injury<=koMax)victim.status="knocked-out";else if(this.has(victim,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)victim.status="reserve";else victim.status="casualty";
   this.note("Crowd injury: #"+victim.number+" is "+victim.status+".");
   const after=()=>done(true);if(carrying){this.ball={x:from.x,y:from.y,carrier:null};this.throwIn(from.x,from.y,after);}else after();return;
  }
  const occupant=this.at(destination.x,destination.y);
  if(occupant){
   const choices=this.pushSquares(from,occupant,false),free=choices.filter(pos=>this.inside(pos.x,pos.y)&&!this.at(pos.x,pos.y)),options=free.length?free:choices;
   if(this.has(occupant,"Stand Firm")&&!occupant.distracted)options.unshift({standFirm:true});
   this.pending={type:"pushChoice",kind:"Chain push",target:occupant,options,resolve:pos=>{
    this.pending=null;if(pos.standFirm){this.note("#"+occupant.number+" uses Stand Firm; the chain push stops.");done(false);return;}
    this.pushPlayer(occupant,pos,ok=>{if(!ok){done(false);return;}this.placePushed(victim,destination,done);},depth+1);
   }};return;
  }
  this.placePushed(victim,destination,done);
 }
 placePushed(victim,destination,done){
  victim.x=destination.x;victim.y=destination.y;this.note("#"+victim.number+" is pushed to "+(destination.x+1)+", "+(destination.y+1)+".");
  if(!this.ball.carrier&&this.ball.x===destination.x&&this.ball.y===destination.y){this.note("The ball is pushed and bounces.");this.bounce(destination.x,destination.y,()=>done(true));}else done(true);
 }
 afterPush(origin,knockTarget,pushed){
  const b=this.blockAction,a=b.attacker,d=b.target;
  if(!pushed){if(knockTarget)this.fall(d,{turnover:false,mightyBlowBy:a,after:()=>this.finishBlock()});else this.finishBlock();return;}
  const mayFollow=!this.has(d,"Fend")||d.distracted;
  const continueBlock=follow=>{
   if(follow){a.x=origin.x;a.y=origin.y;this.note("#"+a.number+" follows up.");}
   this.afterFollow(a,d,knockTarget,()=>{if(knockTarget&&d.x!==null)this.fall(d,{turnover:false,mightyBlowBy:a,after:()=>this.finishBlock()});else this.finishBlock();});
  };
  if(mayFollow)this.pending={type:"custom",kind:"Follow-up",options:["Follow up","Stay"],resolve:choice=>{this.pending=null;continueBlock(choice==="Follow up");}};else continueBlock(false);
 }
 start(id,action="move"){
  const p=this.players.find(p=>p.id===id);if(!this.canStart(p))return false;
  if(action==="secure"&&!this.canSecure(p))return false;
  if(["pass","handoff"].includes(action)&&!this.canBallAction(p,action))return false;
  this.mover=id;p.used=true;p.spent=0;p.distracted=false;
  this.action=action;
  this.ballActionDone=false;if(action==="pass")this.passUsed[p.team]=true;if(action==="handoff")this.handoffUsed[p.team]=true;
  if(action==="secure")this.secureUsed[p.team]=true;
  this.note(this.teams[p.team].name+" #"+p.number+" declares "+(action==="secure"?"Secure the Ball":action==="blitz"?"Blitz":action==="pass"?"Pass":action==="handoff"?"Hand-off":"Move")+".");
  const perform=()=>{const afterStand=()=>{if(action==="secure"&&p.x===this.ball.x&&p.y===this.ball.y)this.secureBall(p,p.x,p.y);};if(p.status==="prone")this.stand(p,afterStand);else afterStand();};
  const failed=()=>{p.distracted=true;this.note("#"+p.number+" is Distracted; activation ends (no turnover).");this.mover=null;this.action=null;};
  const ready=()=>this.activationExtra(p,action,perform,failed);
  if(this.has(p,"Bone Head"))this.test(p,"Bone Head",2,ready,failed);
  else if(this.has(p,"Really Stupid")){
   const help=this.players.some(q=>q.id!==p.id&&q.team===p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&!this.has(q,"Really Stupid")&&this.distance(p,q)===1);
   this.test(p,"Really Stupid",help?2:4,ready,failed);
  } else ready();
  return true;
 }
 stand(p,after=null){
  const ma=this.profile(p).ma;
  const ok=()=>{p.status="standing";p.spent=this.standCost(p);this.note("#"+p.number+" stands up: "+p.spent+" movement spent.");if(after)after();};
  if(ma<=2)this.test(p,"Stand up",4,ok,()=>{this.note("Stand-up failed; activation ends.");this.mover=null;this.action=null;});
  else ok();
 }
 options(p,kind){
  const options=[];
  if(p.status==="standing"&&!p.distracted){
   if(kind==="Dodge"&&this.has(p,"Dodge")&&!p.dodgeUsed)options.push("Dodge");
   if(kind==="Catch"&&this.has(p,"Catch"))options.push("Catch");
   if(kind==="Pass"&&this.has(p,"Pass"))options.push("Pass");
   if(this.mover===p.id&&this.has(p,"Pro")&&!p.proUsed)options.push("Pro");
  }
  if(this.canTeamReroll(p))options.push("Team");
  return options;
 }
 test(p,kind,target,yes,no){
  const roll=this.roll(kind+" #"+p.number+" needs "+Math.min(6,Math.max(2,target))+"+");
  const resolve=n=>{if(this.success(n,target))yes(n);else no(n);};
  if(this.success(roll,target)){yes(roll);return;}
  const options=this.options(p,kind);
  if(!options.length){no(roll);return;}
  this.pending={p,kind,target,roll,options,resolve};
  this.note(kind+" failed. Choose a re-roll or accept the result.");
 }
 decide(choice){
  const q=this.pending;if(!q)return false;
  if(q.type==="custom"){
   if(!q.options.includes(choice))return false;
   q.resolve(choice);return true;
  }
  if(choice!=="Accept"&&!q.options.includes(choice))return false;
  this.pending=null;
  if(choice==="Accept"){if(q.accept)q.accept();else q.resolve(q.roll);return true;}
  if(choice==="Dodge")q.p.dodgeUsed=true;
  if(choice==="Pro"){this.attemptPro(q.p,()=>q.resolve(this.roll(q.kind+" re-roll (Pro)")),()=>{if(q.accept)q.accept();else q.resolve(q.roll);});return true;}
  if(choice==="Team"){
   if(!this.useTeamReroll(q.p)){q.resolve(q.roll);return true;}
  }
  // A re-rolled die is resolved directly; no further re-roll is offered.
  q.resolve(this.roll(q.kind+" re-roll ("+choice+")"));return true;
 }
 planFrom(p,x,y,fromX,fromY,spent){
  if(!p||this.pending||this.finished||!this.inside(x,y)||this.at(x,y))return null;
  const from={x:fromX,y:fromY};
  const distance=this.distance(from,{x,y});let cost=1,jump=false;
  if(distance!==1){
   if(distance!==2||!this.players.some(q=>this.onPitch(q)&&["prone","stunned"].includes(q.status)&&this.distance(from,q)===1&&this.distance(q,{x,y})===1))return null;
   jump=true;cost=2;
  }
  const ma=this.profile(p).ma;
  if(spent+cost>ma+this.rushLimit(p))return null;
  const rushes=Math.max(0,spent+cost-ma)-Math.max(0,spent-ma);
  const originMarks=this.markingAt(p,fromX,fromY),targetMarks=this.markingAt(p,x,y);
  const dodge=!jump&&originMarks>0;
  const target=Number.parseInt(this.profile(p).ag)+(jump?Math.max(originMarks,targetMarks):this.has(p,"Stunty")?0:targetMarks);
  return {x,y,cost,jump,rushes,dodge,target,pickup:!this.ball.carrier&&this.ball.x===x&&this.ball.y===y};
 }
 plan(x,y){
  const p=this.players.find(p=>p.id===this.mover);
  if(!p||this.pending||this.finished||p.status!=="standing")return null;
  return this.planFrom(p,x,y,p.x,p.y,p.spent);
 }
 search(p,startX=p?.x,startY=p?.y,startSpent=p?.spent||0){
  const reached=new Map();
  if(!p||!this.onPitch(p)||!this.inside(startX,startY))return reached;
  const key=(x,y)=>x+","+y,origin={x:startX,y:startY,spent:startSpent,path:[]};
  reached.set(key(startX,startY),origin);
  const queue=[origin];
  while(queue.length){
   queue.sort((a,b)=>a.spent-b.spent);const node=queue.shift();
   if(reached.get(key(node.x,node.y))!==node)continue;
   const candidates=[];
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)candidates.push([node.x+dx,node.y+dy]);
   for(const obstacle of this.players){
    if(!this.onPitch(obstacle)||!["prone","stunned"].includes(obstacle.status)||this.distance(obstacle,node)!==1)continue;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===2&&this.distance(obstacle,{x:node.x+dx,y:node.y+dy})===1)candidates.push([node.x+dx,node.y+dy]);
   }
   for(const [x,y] of candidates){
    const plan=this.planFrom(p,x,y,node.x,node.y,node.spent);if(!plan)continue;
    const spent=node.spent+plan.cost,k=key(x,y),old=reached.get(k);if(old&&old.spent<=spent)continue;
    const next={x,y,spent,path:node.path.concat({x,y,plan})};reached.set(k,next);queue.push(next);
   }
  }
  return reached;
 }
 step(x,y){
  const plan=this.plan(x,y);if(!plan)return false;
  const p=this.players.find(p=>p.id===this.mover),origin={x:p.x,y:p.y};
  p.spent+=plan.cost;
  if(!plan.jump){p.x=x;p.y=y;}
  const arrive=()=>{
   p.x=x;p.y=y;this.note("#"+p.number+" moved to "+(x+1)+", "+(y+1)+"; "+p.spent+"/"+this.profile(p).ma+" movement.");
   if(plan.pickup&&this.action==="secure")this.secureBall(p,x,y);
   else if(plan.pickup)this.test(p,"Pick up",Number.parseInt(this.profile(p).ag)+this.marking(p),()=>{
    this.ball.carrier=p.id;this.note("#"+p.number+" picks up the ball.");this.checkScore();
   },()=>{this.note("Failed pickup: turnover regardless of subsequent catches.");this.bounce(x,y,()=>this.endTurn(true));});
   else this.checkScore();
  };
  const movementTest=()=>{
   if(plan.jump)this.test(p,"Jump",plan.target,arrive,n=>{if(n!==1){p.x=x;p.y=y;}else{p.x=origin.x;p.y=origin.y;}this.fall(p);});
   else if(plan.dodge)this.test(p,"Dodge",plan.target,arrive,()=>this.fall(p));
   else arrive();
  };
  const rush=n=>{if(!n){movementTest();return;}this.test(p,"Rush",2,()=>rush(n-1),()=>this.fall(p));};
  rush(plan.rushes);return true;
 }
 secureBall(p,x,y){
  this.test(p,"Secure the Ball",2,()=>{
   this.ball.carrier=p.id;this.note("#"+p.number+" safely secures the ball; activation ends.");this.checkScore();this.mover=null;this.action=null;
  },()=>{this.note("Secure the Ball failed; turnover.");this.bounce(x,y,()=>this.endTurn(true));});
 }
 finish(){
  if(!this.mover||this.pending||this.finished)return false;
  const p=this.players.find(p=>p.id===this.mover);
  if(this.action==="secure"&&(p.x!==this.ball.x||p.y!==this.ball.y)){this.note("Secure the Ball must end on the loose ball; turnover.");this.endTurn(true);return true;}
  this.note("#"+p.number+" ends their "+(this.action==="secure"?"Secure the Ball":"Move")+".");this.mover=null;this.action=null;return true;
 }
 endTurn(turnover=false){
  if(this.pending||this.finished)return false;
  this.note(turnover?"TURNOVER.":"Turn ended.");
  for(const p of this.players)if(p.team===this.active&&p.status==="stunned"&&p.stunnedAtStart)p.status="prone";
  this.mover=null;this.action=null;this.blockAction=null;this.blitzTarget=null;this.active=1-this.active;this.turns[this.active]++;this.secureUsed[this.active]=false;this.blitzUsed[this.active]=false;
  this.passUsed[this.active]=false;this.handoffUsed[this.active]=false;
  for(const p of this.players){p.dodgeUsed=false;p.proUsed=false;if(p.team===this.active){p.used=false;p.spent=0;p.stunnedAtStart=p.status==="stunned";}}
  this.note(this.teams[this.active].name+" turn "+this.turns[this.active]+".");return true;
 }
 fall(p,{turnover=true,after=null,mightyBlowBy=null}={}){
  this.note("#"+p.number+" is knocked down.");p.status="prone";
  const {x,y}=p,carrying=this.ball.carrier===p.id,av=Number.parseInt(this.profile(p).av);
  const complete=()=>{
   const finish=()=>{if(turnover)this.endTurn(true);else if(after)after();};
   if(carrying||(!this.ball.carrier&&this.ball.x===x&&this.ball.y===y)){this.ball={x,y,carrier:null};this.bounce(x,y,finish);}
   else finish();
  };
  const injury=modifier=>{
   const total=this.roll("Injury")+this.roll("Injury")+modifier,stunty=this.has(p,"Stunty"),thick=this.has(p,"Thick Skull");
   const stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
   if(total<=stunMax)p.status="stunned";
   else if(total<=koMax)p.status="knocked-out";
   else if(this.has(p,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)p.status="reserve";
   else p.status="casualty";
   this.note("#"+p.number+" injury result: "+p.status+".");
   if(["knocked-out","casualty","reserve"].includes(p.status)){p.x=null;p.y=null;}
   complete();
  };
  const armour=this.roll("Armour")+this.roll("Armour");
  const continueAfterArmour=bonus=>{
   if(this.armourBroken(p,armour,bonus,mightyBlowBy))injury(0);
   else {this.note("Armour holds; player remains prone.");complete();}
  };
  if(this.armourBroken(p,armour,0,mightyBlowBy)){
   this.note("Armour broken.");
   const dice=this.roll("Injury")+this.roll("Injury");
   if(this.canMighty(mightyBlowBy,p)){
    this.pending={type:"custom",kind:"Mighty Blow",options:["Add +1 to Injury","No modifier"],resolve:choice=>{
     this.pending=null;const stunty=this.has(p,"Stunty"),thick=this.has(p,"Thick Skull"),result=dice+(choice==="Add +1 to Injury"?1:0);
     const stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
     if(result<=stunMax)p.status="stunned";else if(result<=koMax)p.status="knocked-out";else if(this.has(p,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)p.status="reserve";else p.status="casualty";
     this.note("#"+p.number+" injury result: "+p.status+".");if(["knocked-out","casualty","reserve"].includes(p.status)){p.x=null;p.y=null;}complete();
    }};
   }else{
    const stunty=this.has(p,"Stunty"),thick=this.has(p,"Thick Skull"),stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
    if(dice<=stunMax)p.status="stunned";else if(dice<=koMax)p.status="knocked-out";else if(this.has(p,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)p.status="reserve";else p.status="casualty";
    this.note("#"+p.number+" injury result: "+p.status+".");if(["knocked-out","casualty","reserve"].includes(p.status)){p.x=null;p.y=null;}complete();
   }
  }else if(this.canMightyArmour(mightyBlowBy,p)){
   this.pending={type:"custom",kind:"Mighty Blow",options:["Add +1 to Armour","No modifier"],resolve:choice=>{
    this.pending=null;const bonus=choice==="Add +1 to Armour"?1:0;
    if(this.armourBroken(p,armour,bonus,mightyBlowBy)){this.note("Armour broken with Mighty Blow.");injury(0);}else continueAfterArmour(0);
   }};
  }else continueAfterArmour(0);
 }
 bounce(x,y,done){
  const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const [dx,dy]=dirs[this.roll("Ball bounce (1 NW, 2 N, 3 NE, 4 W, 5 E, 6 SW, 7 S, 8 SE)",8)-1];
  if(!this.inside(x+dx,y+dy)){this.throwIn(x,y,done);return;}
  this.landBall(x+dx,y+dy,false,done);
 }
 throwIn(x,y,done){
  let dirs;
  const edgeX=x===0?1:x===25?-1:0,edgeY=y===0?1:y===14?-1:0;
  if(edgeX&&edgeY)dirs=[[edgeX,0],[edgeX,edgeY],[0,edgeY]];
  else if(edgeX)dirs=[[edgeX,-1],[edgeX,0],[edgeX,1]];
  else dirs=[[-1,edgeY],[0,edgeY],[1,edgeY]];
  const [dx,dy]=dirs[Math.ceil(this.roll("Throw-in direction")/2)-1];
  const distance=this.roll("Throw-in distance")+this.roll("Throw-in distance");
  for(let i=1;i<distance;i++){if(!this.inside(x+dx,y+dy)){this.throwIn(x,y,done);return;}x+=dx;y+=dy;}
  this.landBall(x,y,true,done);
 }
 landBall(x,y,thrown,done,direct=false){
  this.ball={x,y,carrier:null};const p=this.at(x,y);
  if(p&&p.status==="standing"&&!p.distracted){
   this.test(p,"Catch",Number.parseInt(this.profile(p).ag)+(direct?0:1)+this.marking(p),()=>{
    this.ball.carrier=p.id;this.note("#"+p.number+" catches the ball.");this.checkScore();done();
   },()=>this.bounce(x,y,done));
  }else if(p||thrown||direct)this.bounce(x,y,done);
  else done();
 }
 checkScore(){
  const p=this.players.find(p=>p.id===this.ball.carrier);
  if(p&&p.status==="standing"&&p.x===(p.team===0?25:0)){
   this.finished=true;this.mover=null;this.note("TOUCHDOWN — "+this.teams[p.team].name+". Practice drive complete; reset to play again.");
  }
 }
}
if(typeof module!=="undefined")module.exports={MovementGame};


