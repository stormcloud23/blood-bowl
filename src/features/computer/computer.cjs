"use strict";
// A local, deterministic policy. Only engine actions mutate the match; planning
// uses public forecasts and never rolls dice or peeks at the dice source.
const COMPUTER_ROSTERS=["human","orc"];
function computerDecisionTeam(g){
 const q=g.pending,b=g.blockAction;
 if(q){
  if(Number.isInteger(q.team))return q.team;
  if(q.p)return q.p.team;
  if(q.type==="blockSelect")return b?.chooserTeam;
  if(q.type==="blockProChoose")return b?.attacker.team;
  if(q.type==="pushChoice")return g.skill(q.target,"Sidestep")&&!g.skill(b?.attacker,"Grab")?q.target.team:b?.attacker.team??g.active;
  if(q.kind==="Stand Firm")return b?.target.team;
  return g.players.find(p=>p.id===g.mover)?.team??b?.attacker.team??g.active;
 }
 if(g.bombActor?.())return g.bombActor().team;
 if(g.phase==="kickChoice")return g.rolloffWinner;
 if(g.phase==="setup")return g.setupTeam;
 if(["kicker","kickAim"].includes(g.phase))return g.kicking;
 if(g.phase==="touchback")return g.receiving;
 return g.active;
}
class ComputerCoach {
 constructor(team){this.team=team;this.plan=null;this.explanation="Ready";}
 act(g,label,run){this.explanation=label;return run()!==false;}
 blockValue(g,b,face){
  const a=b.attacker,d=b.target;
  const value=face==="POW"?8:face==="Stumble"?(!g.skill(d,"Dodge")||g.skill(a,"Tackle")?8:3):face==="Push Back"?3:face==="Both Down"?(g.skill(a,"Block")?(g.skill(d,"Block")?1:7):g.skill(a,"Wrestle")?2:-7):-10;
  return a.team===this.team?value:-value;
 }
 decide(g){
  const q=g.pending;
  if(q.type==="blockSelect"){
   const b=g.blockAction,rank=b.dice.map((die,i)=>({i,value:this.blockValue(g,b,g.blockFace(die))})).sort((a,b)=>b.value-a.value);
   if(b.attacker.team===this.team&&rank[0].value<0&&!b.poolLocked&&g.rerollSources(b.attacker).length)return this.act(g,"Re-roll an unsafe block",()=>g.rerollBlock(g.rerollSources(b.attacker)[0]));
   return this.act(g,"Choose the best block die",()=>g.selectBlockDie(rank[0].i));
  }
  if(q.type==="blockProChoose"){
   const b=g.blockAction,indices=b.dice.map((n,i)=>({i,v:this.blockValue(g,b,g.blockFace(n))})).sort((a,b)=>a.v-b.v);
   return this.act(g,"Re-roll the worst die",()=>g.rerollBlockDie(indices[0].i));
  }
  if(q.type==="pushChoice"){
   const own=q.target.team===this.team;
   const score=pos=>pos.standFirm?(own?100:-100):!g.inside(pos.x,pos.y)?(own?-100:100):(own?1:-1)*(g.right(this.team)?pos.x:25-pos.x)-g.markingAt(q.target,pos.x,pos.y)*(own?3:-1);
   const pos=[...q.options].sort((a,b)=>score(b)-score(a))[0];
   return this.act(g,own?"Choose a safe push destination":"Push the opponent back",()=>{q.resolve(pos);return true;});
  }
  if(q.type!=="custom"){
   const skill=q.options.find(s=>s!=="Team"&&!g.isRerollSource(s)),choice=q.lookAhead?"Accept":skill||q.options[0]||"Accept";
   return this.act(g,choice==="Accept"?"Accept the result":"Use "+choice,()=>g.decide(choice));
  }
  const options=q.options;
  // Explicit conservative choices avoid opening optional targeting/configuration
  // workflows. Unknown prompts still select an offered, engine-validated option.
  let choice=options.find(s=>/^(Keep Wizard|Keep Rock|Keep Dwarfen Wisdom|Skip|No |Do not|Decline|Done|Finish|Stay|Keep current)/.test(s));
  if(options.includes("Use Block"))choice="Use Block";
  else if(options.includes("Use Wrestle"))choice="Use Wrestle";
  else if(options.includes("Stand Firm"))choice="Stand Firm";
  else if(options.includes("Use D3 deviation"))choice="Use D3 deviation";
  else if(options.some(s=>s.startsWith("Give ball to #"))){
   const best=g.players.filter(p=>p.team===this.team&&options.includes("Give ball to #"+p.number)).sort((a,b)=>this.carrierValue(g,b)-this.carrierValue(g,a))[0];choice="Give ball to #"+best.number;
  }
  return this.act(g,"Resolve "+q.kind,()=>g.decide(choice??options[0]));
 }
 carrierValue(g,p){return g.profile(p).ma-Number.parseInt(g.profile(p).ag)*2+(g.skill(p,"Sure Hands")?4:0)-g.marking(p)*2;}
 // Bounded adjacent routes, retaining safe/short alternatives by square and
 // budget. No jumping or speculative match cloning is needed for this policy.
 routes(g,p){
  const spent=g.mover===p.id?p.spent:p.status==="prone"?g.standCost(p):0;
  const origin={x:p.x,y:p.y,spent,risk:0,path:[]},queue=[origin],states=new Map(),best=new Map();
  states.set(p.x+","+p.y+","+spent,0);best.set(p.x+","+p.y,origin);
  for(let i=0;i<queue.length;i++){
   const n=queue[i];if(n.spent>=g.movementAllowance(p)+g.rushLimit(p))continue;
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
    if(!dx&&!dy)continue;
    const plan=g.planFrom(p,n.x+dx,n.y+dy,n.x,n.y,n.spent);if(!plan)continue;
    const risk=n.risk+plan.rushes*1.4+(plan.dodge?Math.max(1,plan.target-1)*1.5:0)+(plan.pickup?Math.max(1,Number.parseInt(g.profile(p).ag)-1):0);
    const next={x:plan.x,y:plan.y,spent:n.spent+plan.cost,risk,path:n.path.concat({x:plan.x,y:plan.y})},key=next.x+","+next.y,state=key+","+next.spent;
    if(states.has(state)&&states.get(state)<=risk)continue;
    states.set(state,risk);queue.push(next);
    const old=best.get(key);if(!old||risk*4+next.spent<old.risk*4+old.spent)best.set(key,next);
   }
  }
  return [...best.values()];
 }
 // Evaluate the marginal value of this player's zones, rather than paying
 // every player to approach the same point. Existing unique coverage matters
 // just as much as new coverage; redundant zones have diminishing returns.
 positionContext(g,p){
  const allies=g.players.filter(q=>q!==p&&q.team===p.team&&g.onPitch(q)&&q.status==="standing"&&!q.distracted),coverage=new Uint8Array(390);
  for(const q of allies)for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&g.inside(q.x+dx,q.y+dy))coverage[(q.y+dy)*26+q.x+dx]++;
  const carrier=g.players.find(q=>q.id===g.ball.carrier),enemies=g.players.filter(q=>q.team!==p.team&&g.onPitch(q)&&q.status==="standing"&&!q.distracted);
  return {allies,coverage,carrier,enemies,budgets:new Map(allies.filter(q=>!q.used).map(q=>[q.id,g.movementAllowance(q)]))};
 }
 coverageValue(g,n,coverage){
  let value=0;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&g.inside(n.x+dx,n.y+dy)){
   const count=coverage[(n.y+dy)*26+n.x+dx];value+=count===0?1.3:count===1?.25:.05;
  }
  return value;
 }
 protectionValue(g,carrier,guards,context,{potential=false}={}){
  const occupied=new Set(guards.map(q=>q.x+","+q.y));let value=0,corners=0;
  const missing=[];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   if(!dx&&!dy)continue;const square={x:carrier.x+dx,y:carrier.y+dy};if(!g.inside(square.x,square.y))continue;
   const count=guards.filter(q=>g.distance(q,square)===1).length;
   value+=count?1.5+(count>1?.5:0):0;
   if(dx&&dy){if(occupied.has(square.x+","+square.y)){value+=4;corners++;}else missing.push(square);}
  }
  if(corners===4)value+=4;
  // A carrier may advance ahead of unused escorts, but used/prone/distracted
  // players cannot promise future corners. Match distinct escorts to corners
  // so one fast player cannot be counted as an entire future cage.
  if(potential){
   const assigned=new Map(),eligible=missing.map(square=>guards.filter(q=>context.budgets.has(q.id)&&g.marking(q)===0&&g.distance(q,square)<=context.budgets.get(q.id)&&!g.at(square.x,square.y)&&!context.enemies.some(e=>g.distance(e,square)===1)));
   const match=(i,seen)=>{for(const q of eligible[i])if(!seen.has(q.id)){seen.add(q.id);if(!assigned.has(q.id)||match(assigned.get(q.id),seen)){assigned.set(q.id,i);return true;}}return false;};
   for(let i=0;i<missing.length;i++)if(match(i,new Set()))value+=1.5;
  }
  return value;
 }
 positionValue(g,p,n,context=this.positionContext(g,p)){
  const dir=g.right(p.team)?1:-1,{carrier}=context,own=carrier?.team===p.team,marks=g.markingAt(p,n.x,n.y);
  let value=-marks*3-n.risk*5-n.path.length*.12+(carrier===p?0:this.coverageValue(g,n,context.coverage));
  if(carrier===p){
   value+=(n.x-p.x)*dir*3;
   if(n.x===(dir===1?25:0))value+=200-n.risk*2;
   value+=this.protectionValue(g,n,context.allies,context,{potential:true})*.45;
  }else if(!carrier&&g.inside(g.ball.x,g.ball.y)&&!g.has(p,"No Ball")){
   value+=(Math.min(6,g.distance(p,g.ball))-Math.min(6,g.distance(n,g.ball)))*2;
   if(n.path.some(s=>s.x===g.ball.x&&s.y===g.ball.y))value+=30+this.carrierValue(g,p);
  }else if(carrier){
   if(own){
    const guards=context.allies.filter(q=>q!==carrier).concat(n);
    value+=this.protectionValue(g,carrier,guards,context)*1.4;
    value+=Math.max(-4,Math.min(4,(n.x-carrier.x)*dir))*.35;
    value-=marks*2;
   }else{
    value+=(Math.min(4,g.distance(p,carrier))-Math.min(4,g.distance(n,carrier)))*2;
    const markers=context.allies.filter(q=>g.distance(q,carrier)===1).length;
    if(g.distance(n,carrier)===1)value+=markers===0?8:markers===1?3:0;
   }
  }else value+=(n.x-p.x)*dir;
  if(n.y===0||n.y===14)value-=2;
  return value;
 }
 chooseAction(g){
  let best=null;
  const offer=c=>{if(!best||c.score>best.score)best=c;};
  const enemies=g.players.filter(q=>q.team!==this.team&&g.onPitch(q)&&q.status==="standing");
  for(const p of g.players.filter(p=>g.canStart(p))){
   const routes=this.routes(g,p),context=this.positionContext(g,p),values=new Map(routes.map(n=>[n,this.positionValue(g,p,n,context)])),base=values.get(routes[0]);
   for(const n of routes){
    const score=values.get(n)-base+(p.status==="prone"?5:0);
    if(n.path.length||p.status==="prone")offer({kind:"move",p,route:n,score});
   }
   for(const d of enemies){
    const assists=g.assists(p,d),strength=Number(g.profile(p).st)+assists.offensive-Number(g.profile(d).st)-assists.defensive;
    if(g.canBlock(p,d)&&strength>=0)offer({kind:"block",p,target:d,score:strength>0?12:4});
    // Prefer a nearby Blitz; a path must leave one MA for the block. Strength
    // is checked conservatively without assuming future assists.
    if(!g.blitzUsed[this.team]&&Number(g.profile(p).st)>=Number(g.profile(d).st)&&g.distance(p,d)<=g.movementAllowance(p)){
     for(const n of routes)if(g.distance(n,d)===1&&n.spent<g.movementAllowance(p)&&n.risk<=2)offer({kind:"blitz",p,target:d,route:n,score:(g.ball.carrier===d.id?30:9)+values.get(n)-base-n.path.length*.08});
    }
   }
  }
  return best?.score>0?best:null;
 }
 step(g){
  if(g.phase==="finished"||computerDecisionTeam(g)!==this.team)return false;
  if(g.pending)return this.decide(g);
  if(g.bombActor?.()){
   // Catching an opponent's bomb requires a throw even outside our own turn.
   // Aim at an empty square to avoid deliberately starting a catch/rethrow loop.
   let best=null;
   for(let x=0;x<26;x++)for(let y=0;y<15;y++){
    const preview=g.bombPreview(x,y);if(!preview||g.at(x,y))continue;
    const score=g.players.filter(p=>g.onPitch(p)&&g.distance(p,{x,y})<=1).reduce((n,p)=>n+(p.team===this.team?-8:4),0)-preview.band*.1;
    if(!best||score>best.score)best={x,y,score};
   }
   return best?this.act(g,"Rethrow the caught bomb",()=>g.throwBomb(best.x,best.y)):false;
  }
  if(["fans","weather","leagueSteps","rolloff"].includes(g.phase))return this.act(g,"Continue pre-game",()=>g.advancePregame());
  if(g.phase==="kickChoice")return this.act(g,"Choose to receive",()=>g.chooseKicking(1-this.team));
  if(g.phase==="setup")return this.act(g,"Confirm a legal formation",()=>{if(g.setupErrors().length)g.autoSetup();return g.confirmSetup();});
  if(g.phase==="kicker")return this.act(g,"Nominate a kicker",()=>g.nominateKicker(g.eligibleKickers()[0].id));
  if(g.phase==="kickAim")return this.act(g,"Kick into the receiving half",()=>g.kick(g.right(g.receiving)?6:19,7));
  if(g.phase==="eventMove"||g.phase==="charge")return this.act(g,"Keep the kickoff formation",()=>g.finishEvent());
  if(g.phase==="swarming")return this.act(g,"Finish Swarming",()=>g.finishSwarming());
  if(g.phase==="touchback"){
   for(let x=0;x<26;x++)for(let y=0;y<15;y++)if(g.ownHalf(this.team,x)&&!g.at(x,y))return this.act(g,"Place the touchback ball",()=>g.placeTouchback(x,y));
  }
  if(g.phase==="endDrive")return this.act(g,"Continue to the next drive",()=>g.continueDrive());
  if(g.phase!=="play")return false;
  if(g.mover){
   const p=g.players.find(p=>p.id===g.mover);
   if(this.plan?.id===p.id&&this.plan.drive===g.drive&&this.plan.turn===g.turns[this.team]){
    const next=this.plan.path[0];
    if(next&&g.plan(next.x,next.y)){this.plan.path.shift();return this.act(g,"Move #"+p.number+" toward "+this.plan.goal,()=>g.step(next.x,next.y));}
    if(this.plan.kind==="blitz"&&g.canBlitzBlock()){this.plan=null;return this.act(g,"Blitz the opponent",()=>g.blitzBlock());}
   }
   this.plan=null;return this.act(g,"Finish the activation",()=>g.finish());
  }
  const action=this.chooseAction(g);
  if(!action)return this.act(g,"End the team turn",()=>g.endTurn());
  const {p,route,target,kind}=action;
  if(kind==="block")return this.act(g,"Take a favourable block with #"+p.number,()=>g.block(p.id,target.id));
  this.plan={id:p.id,drive:g.drive,turn:g.turns[this.team],kind,path:route.path.slice(),goal:g.ball.carrier===p.id?"the end zone":g.ball.carrier?"the ball carrier":"the ball"};
  return this.act(g,(kind==="blitz"?"Declare Blitz":"Activate")+" #"+p.number,()=>kind==="blitz"?g.startBlitz(p.id,target.id):g.start(p.id,"move"));
 }
}
if(typeof module!=="undefined")module.exports={ComputerCoach,computerDecisionTeam,COMPUTER_ROSTERS};
