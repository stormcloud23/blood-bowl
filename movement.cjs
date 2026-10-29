"use strict";
// Movement practice engine. Sources and boundaries: docs/MOVEMENT.md.
class MovementGame {
 constructor(teams, {dice=null, scenario="teams"}={}) {
  this.teams=teams; this.dice=dice || (s=>1+Math.floor(Math.random()*s));
  this.active=0; this.turns=[1,0]; this.rerolls=[2,2]; this.mover=null;
  this.pending=null; this.finished=false; this.events=[]; this.ball={x:12,y:7,carrier:null};
  this.players=teams.flatMap((t,team)=>t.lineup.map((role,i)=>({
   id:team+"-"+(i+1),number:i+1,team,role,x:team?16+i%3:9-i%3,y:2+Math.floor(i/3)*3,
   status:"standing",distracted:false,used:false,spent:0,dodgeUsed:false,stunnedAtStart:false
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
  }
  this.note("Movement practice started. Perfect Conditions; two team re-rolls each.");
 }
 profile(p){return this.teams[p.team].positions[p.role];}
 has(p,skill){return this.profile(p).skills.includes(skill);}
 onPitch(p){return Number.isInteger(p.x)&&Number.isInteger(p.y);}
 at(x,y){return this.players.find(p=>this.onPitch(p)&&p.x===x&&p.y===y);}
 inside(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<26&&y>=0&&y<15;}
 distance(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));}
 marking(p,x=p.x,y=p.y){return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x,y})===1).length;}
 note(s){this.events.unshift(s);this.events=this.events.slice(0,150);}
 roll(label,sides=6){const n=this.dice(sides);if(!Number.isInteger(n)||n<1||n>sides)throw Error("Invalid die");this.note(label+": "+n+" (D"+sides+").");return n;}
 success(n,target){return n===6||(n!==1&&n>=target);}
 canStart(p){return p&&this.onPitch(p)&&p.team===this.active&&!p.used&&["standing","prone"].includes(p.status)&&!this.mover&&!this.pending&&!this.finished;}
 start(id){
  const p=this.players.find(p=>p.id===id);if(!this.canStart(p))return false;
  this.mover=id;p.used=true;p.spent=0;p.distracted=false;
  this.note(this.teams[p.team].name+" #"+p.number+" declares Move.");
  const ready=()=>{if(p.status==="prone")this.stand(p);};
  const failed=()=>{p.distracted=true;this.note("#"+p.number+" is Distracted; activation ends (no turnover).");this.mover=null;};
  if(this.has(p,"Bone Head"))this.test(p,"Bone Head",2,ready,failed);
  else if(this.has(p,"Really Stupid")){
   const help=this.players.some(q=>q.id!==p.id&&q.team===p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&!this.has(q,"Really Stupid")&&this.distance(p,q)===1);
   this.test(p,"Really Stupid",help?2:4,ready,failed);
  } else ready();
  return true;
 }
 stand(p){
  const ma=this.profile(p).ma;
  const ok=()=>{p.status="standing";p.spent=Math.min(3,ma);this.note("#"+p.number+" stands up: "+p.spent+" movement spent.");};
  if(ma<=2)this.test(p,"Stand up",4,ok,()=>{this.note("Stand-up failed; activation ends.");this.mover=null;});
  else ok();
 }
 options(p,kind){
  const options=[];
  if(p.status==="standing"&&!p.distracted){
   if(kind==="Dodge"&&this.has(p,"Dodge")&&!p.dodgeUsed)options.push("Dodge");
   if(kind==="Catch"&&this.has(p,"Catch"))options.push("Catch");
   if(this.mover===p.id&&this.has(p,"Pro"))options.push("Pro");
  }
  if(p.team===this.active&&this.rerolls[p.team]>0)options.push("Team");
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
  if(choice!=="Accept"&&!q.options.includes(choice))return false;
  this.pending=null;
  if(choice==="Accept"){q.resolve(q.roll);return true;}
  if(choice==="Dodge")q.p.dodgeUsed=true;
  if(choice==="Pro"&&this.roll("Pro needs 3+")<3){q.resolve(q.roll);return true;}
  if(choice==="Team"){
   this.rerolls[q.p.team]--;
   const loner=this.profile(q.p).skills.find(s=>s.startsWith("Loner ("));
   if(loner&&this.roll("Loner needs "+loner.match(/\d+/)[0]+"+")<Number(loner.match(/\d+/)[0])){q.resolve(q.roll);return true;}
  }
  // A re-rolled die is resolved directly; no further re-roll is offered.
  q.resolve(this.roll(q.kind+" re-roll ("+choice+")"));return true;
 }
 plan(x,y){
  const p=this.players.find(p=>p.id===this.mover);
  if(!p||this.pending||this.finished||p.status!=="standing"||!this.inside(x,y)||this.at(x,y))return null;
  const distance=this.distance(p,{x,y});let cost=1,jump=false;
  if(distance!==1){
   if(distance!==2||!this.players.some(q=>this.onPitch(q)&&["prone","stunned"].includes(q.status)&&this.distance(p,q)===1&&this.distance(q,{x,y})===1))return null;
   jump=true;cost=2;
  }
  const ma=this.profile(p).ma;
  if(p.spent+cost>ma+2)return null;
  const rushes=Math.max(0,p.spent+cost-ma)-Math.max(0,p.spent-ma);
  const originMarks=this.marking(p),targetMarks=this.marking(p,x,y);
  const dodge=!jump&&originMarks>0;
  const target=Number.parseInt(this.profile(p).ag)+(jump?Math.max(originMarks,targetMarks):this.has(p,"Stunty")?0:targetMarks);
  return {x,y,cost,jump,rushes,dodge,target,pickup:!this.ball.carrier&&this.ball.x===x&&this.ball.y===y};
 }
 step(x,y){
  const plan=this.plan(x,y);if(!plan)return false;
  const p=this.players.find(p=>p.id===this.mover),origin={x:p.x,y:p.y};
  p.spent+=plan.cost;
  if(!plan.jump){p.x=x;p.y=y;}
  const arrive=()=>{
   p.x=x;p.y=y;this.note("#"+p.number+" moved to "+(x+1)+", "+(y+1)+"; "+p.spent+"/"+this.profile(p).ma+" movement.");
   if(plan.pickup)this.test(p,"Pick up",Number.parseInt(this.profile(p).ag)+this.marking(p),()=>{
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
 finish(){
  if(!this.mover||this.pending||this.finished)return false;
  const p=this.players.find(p=>p.id===this.mover);this.note("#"+p.number+" ends their Move.");this.mover=null;return true;
 }
 endTurn(turnover=false){
  if(this.pending||this.finished)return false;
  this.note(turnover?"TURNOVER.":"Turn ended.");
  for(const p of this.players)if(p.team===this.active&&p.status==="stunned"&&p.stunnedAtStart)p.status="prone";
  this.mover=null;this.active=1-this.active;this.turns[this.active]++;
  for(const p of this.players){p.dodgeUsed=false;if(p.team===this.active){p.used=false;p.spent=0;p.stunnedAtStart=p.status==="stunned";}}
  this.note(this.teams[this.active].name+" turn "+this.turns[this.active]+".");return true;
 }
 fall(p){
  this.note("#"+p.number+" falls over.");p.status="prone";
  const armour=this.roll("Armour")+this.roll("Armour");
  if(armour>=Number.parseInt(this.profile(p).av)){
   const injury=this.roll("Injury")+this.roll("Injury"),stunty=this.has(p,"Stunty"),thick=this.has(p,"Thick Skull");
   const stunMax=stunty?(thick?7:6):(thick?8:7),koMax=stunty?8:9;
   if(injury<=stunMax)p.status="stunned";
   else if(injury<=koMax)p.status="knocked-out";
   else if(this.has(p,"Regeneration")&&this.roll("Regeneration needs 4+")>=4)p.status="reserve";
   else p.status="casualty";
   this.note("#"+p.number+" injury result: "+p.status+".");
  }else this.note("Armour holds; player remains prone.");
  const {x,y}=p,carrying=this.ball.carrier===p.id;
  if(["knocked-out","casualty","reserve"].includes(p.status)){p.x=null;p.y=null;}
  if(carrying||(!this.ball.carrier&&this.ball.x===x&&this.ball.y===y)){this.ball={x,y,carrier:null};this.bounce(x,y,()=>this.endTurn(true));}
  else this.endTurn(true);
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
 landBall(x,y,thrown,done){
  this.ball={x,y,carrier:null};const p=this.at(x,y);
  if(p&&p.status==="standing"&&!p.distracted){
   this.test(p,"Catch",Number.parseInt(this.profile(p).ag)+1+this.marking(p),()=>{
    this.ball.carrier=p.id;this.note("#"+p.number+" catches the ball.");this.checkScore();done();
   },()=>this.bounce(x,y,done));
  }else if(p||thrown)this.bounce(x,y,done);
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

