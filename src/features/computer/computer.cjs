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
 strategy(g){
  const carrier=g.players.find(p=>p.id===g.ball.carrier),turn=g.turns[this.team]||1,lead=g.scores[this.team]-g.scores[1-this.team];
  const mustSteal=g.half===2&&lead<0&&turn>=5;
  return {carrier,turn,lead,mustSteal,holdLine:!!carrier&&carrier.team!==this.team&&!mustSteal,urgentScore:g.half===2&&lead<0&&turn>=5};
 }
 importantAction(g,p,target=null){
  const carrier=g.players.find(q=>q.id===g.ball.carrier);
  return carrier===p||target===carrier||!!(carrier?.team===this.team&&target&&g.distance(target,carrier)===1);
 }
 spendLastReroll(g,p,target=null){return this.importantAction(g,p,target)||this.strategy(g).mustSteal||(g.turns[p.team]||1)>=7||g.rerollsAvailable(p.team)>1;}
 checkChance(g,target){let successes=0;for(let die=1;die<=6;die++)if(g.success(die,target))successes++;return successes/6;}
 activationChance(g,p,action){
  let chance=1;
  if(g.has(p,"Bone Head"))chance*=this.checkChance(g,2);
  if(g.has(p,"Really Stupid")){
   const helper=g.players.some(q=>q!==p&&q.team===p.team&&g.onPitch(q)&&q.status==="standing"&&!q.distracted&&!g.has(q,"Really Stupid")&&g.distance(q,p)===1);
   chance*=this.checkChance(g,helper?2:4);
  }
  for(const name of ["Unchannelled Fury","Animal Savagery"])if(g.has(p,name))chance*=this.checkChance(g,["block","blitz"].includes(action)?2:4);
  const lust=g.parameter(p,"Bloodlust");if(lust)chance*=this.checkChance(g,Number(lust.match(/\d+/)?.[0]||2));
  if(action!=="block"&&g.has(p,"Take Root"))chance*=this.checkChance(g,2);
  if(action!=="block"&&p.status==="prone"&&g.movementAllowance(p)<=2&&!g.has(p,"Jump Up"))chance*=this.checkChance(g,g.forecastTarget(p,"Stand up",4));
  if(action==="block"&&p.status==="prone")chance*=this.checkChance(g,Math.max(2,Number.parseInt(g.profile(p).ag)-1));
  return chance;
 }
 routeChance(g,p,route,context){
  // Probability mass tracks whether once-per-activation Dodge/Sure Feet is
  // still available. Team re-rolls are deliberately not assumed by planning.
  const initial=(g.skill(p,"Dodge")&&!p.dodgeUsed?1:0)|(g.skill(p,"Sure Feet")&&!g.used(p,"Sure Feet")?2:0);
  let states=[0,0,0,0];states[initial]=1;let pickedUp=false;
  const check=(target,bit=0,free=false)=>{
   const pass=this.checkChance(g,target),next=[0,0,0,0];
   states.forEach((mass,mask)=>{next[mask]+=mass*pass;if(free)next[mask]+=mass*(1-pass)*pass;else if(mask&bit)next[mask^bit]+=mass*(1-pass)*pass;});states=next;
  };
  for(const step of route.path){
   const plan=step.plan||g.planFrom(p,step.x,step.y,step.fromX??p.x,step.fromY??p.y,0);if(!plan)return 0;
   if(plan.dodge||plan.jump){
    const tackle=context.enemies.some(e=>g.distance(e,{x:step.fromX,y:step.fromY})===1&&g.skill(e,"Tackle"));
    check(g.forecastTarget(p,plan.jump?"Jump":"Dodge",plan.divingTackleTarget??plan.target),plan.dodge&&!tackle?1:0);
    // Tentacles can end an activation without a turnover; it still reduces
    // the chance that this route reaches its intended destination.
    let held=0;for(const e of context.enemies)if(g.distance(e,{x:step.fromX,y:step.fromY})===1&&g.skill(e,"Tentacles"))held=Math.max(held,this.checkChance(g,Math.max(2,6-Number(g.profile(e).st)+Number(g.profile(p).st))));
    states=states.map(m=>m*(1-held));
   }
   for(let i=0;i<plan.rushes;i++)check(g.forecastTarget(p,"Rush",2),2);
   if(g.onTrapdoor?.({x:step.x,y:step.y}))check(2);
   if(plan.pickup&&!pickedUp){check(g.forecastTarget(p,"Pick up",Number.parseInt(g.profile(p).ag)+g.markingAt(p,step.x,step.y)),0,g.skill(p,"Sure Hands"));pickedUp=true;}
  }
  return states.reduce((a,b)=>a+b,0);
 }
 blockOdds(g,p,target,origin=p,blitz=false){
  const view=Object.assign(Object.create(Object.getPrototypeOf(g)),g,{players:g.players.map(q=>({...q}))}),actor=view.players.find(q=>q.id===p.id),victim=view.players.find(q=>q.id===target.id);
  Object.assign(actor,{x:origin.x,y:origin.y,status:"standing",distracted:false});actor.hornsBonus=blitz&&view.skill(actor,"Horns")?1:0;
  const assists=view.assists(actor,victim),a=Number(view.profile(actor).st)+assists.offensive,d=Number(view.profile(victim).st)+assists.defensive;
  const count=a===d?1:Math.max(a,d)>2*Math.min(a,d)?3:2,own=a>=d;
  const wrestle=view.skill(actor,"Wrestle")&&g.ball.carrier!==p.id,safeBoth=view.skill(actor,"Block")||wrestle||blitz&&view.skill(actor,"Juggernaut");
  const bad=safeBoth?1/6:2/6,knock=(1+Number(!view.skill(victim,"Dodge")||view.skill(actor,"Tackle"))+Number(view.skill(actor,"Block")&&!view.skill(victim,"Block")||wrestle))/6;
  return {count,own,failure:own?bad**count:1-(1-bad)**count,knockdown:own?1-(1-knock)**count:knock**count};
 }
 blockValue(g,b,face){
  const a=b.attacker,d=b.target;
  const value=face==="POW"?8:face==="Stumble"?(!g.skill(d,"Dodge")||g.skill(a,"Tackle")?8:3):face==="Push Back"?3:face==="Both Down"?(g.skill(a,"Block")?(g.skill(d,"Block")?1:7):g.skill(a,"Wrestle")?(g.ball.carrier===d.id?8:2):-7):-10;
  return a.team===this.team?value:-value;
 }
 decide(g){
  const q=g.pending;
  if(q.type==="blockSelect"){
   const b=g.blockAction,rank=b.dice.map((die,i)=>({i,value:this.blockValue(g,b,g.blockFace(die))})).sort((a,b)=>b.value-a.value);
   const sources=g.rerollSources(b.attacker),source=sources.find(s=>s!=="Team")||(this.spendLastReroll(g,b.attacker,b.target)?sources[0]:null);
   if(b.attacker.team===this.team&&rank[0].value<0&&!b.poolLocked&&source)return this.act(g,"Re-roll an unsafe block",()=>g.rerollBlock(source));
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
   const skill=q.options.find(s=>s!=="Team"&&!g.isRerollSource(s)),source=q.options.find(s=>g.isRerollSource(s)&&s!=="Team"),important=q.kind==="Pick up"||this.importantAction(g,q.p)||this.plan?.scoring&&this.plan.drive===g.drive&&this.plan.turn===g.turns[this.team];
   const choice=q.lookAhead?"Accept":skill||source||(important||this.spendLastReroll(g,q.p)?q.options[0]:null)||"Accept";
   return this.act(g,choice==="Accept"?"Accept the result":"Use "+choice,()=>g.decide(choice));
  }
  const options=q.options;
  // Explicit conservative choices avoid opening optional targeting/configuration
  // workflows. Unknown prompts still select an offered, engine-validated option.
  let choice=options.find(s=>/^(Keep Wizard|Keep Rock|Keep Dwarfen Wisdom|Skip|No |Do not|Decline|Done|Finish|Stay|Keep current)/.test(s));
  if(/interception/i.test(q.kind)&&q.pitchChoices?.length){
   const candidates=q.pitchChoices.map(pos=>({option:pos.option,p:g.at(pos.x,pos.y)})).filter(c=>c.p?.team===this.team&&!g.has(c.p,"No Ball"));
   candidates.sort((a,b)=>this.checkChance(g,g.forecastTarget(b.p,"Intercept",Number.parseInt(g.profile(b.p).ag)+3+g.marking(b.p)))-this.checkChance(g,g.forecastTarget(a.p,"Intercept",Number.parseInt(g.profile(a.p).ag)+3+g.marking(a.p))));
   if(candidates[0])choice=candidates[0].option;
  }
  else if(q.kind==="Dirty Player")choice=options.find(o=>o.startsWith("Add +1"))||choice;
  else if(q.kind==="Chainsaw foul")choice="Foul normally";
  else if(options.includes("Use Block"))choice="Use Block";
  else if(options.includes("Use Wrestle"))choice="Use Wrestle";
  else if(options.includes("Stand Firm"))choice="Stand Firm";
  else if(options.includes("Use D3 deviation"))choice="Use D3 deviation";
  else if(options.some(s=>s.startsWith("Give ball to #"))){
   const best=g.players.filter(p=>p.team===this.team&&options.includes("Give ball to #"+p.number)).sort((a,b)=>this.carrierValue(g,b)-this.carrierValue(g,a))[0];choice="Give ball to #"+best.number;
  }
  return this.act(g,"Resolve "+q.kind,()=>g.decide(choice??options[0]));
 }
 roles(g,p){
  const tags=new Set(String(g.profile(p).traits||"").toLowerCase().split(",").map(s=>s.trim()));
  return {blitzer:tags.has("blitzer"),blocker:tags.has("blocker"),runner:tags.has("runner"),thrower:tags.has("thrower"),catcher:tags.has("catcher"),bigGuy:tags.has("big guy")};
 }
 actionFit(g,p,kind,target=null){
  const r=this.roles(g,p),has=name=>g.has(p,name);let fit=0;
  if(kind==="blitz")fit=(r.blitzer?2.25:r.blocker?.5:0)+(has("Block")?1:has("Wrestle")?.75:0)+(has("Horns")?.75:0)+(has("Juggernaut")?.75:0)+(has("Mighty Blow")?.5:0)+(target&&g.has(target,"Dodge")&&has("Tackle")?.75:0)+(target&&g.ball.carrier===target.id&&!g.has(target,"Sure Hands")&&has("Strip Ball")?.75:0);
  else if(kind==="block")fit=(r.blocker?1.75:r.blitzer?.75:r.bigGuy?.5:0)+(has("Block")?1.25:has("Wrestle")?1:0)+(has("Guard")?.5:0)+(has("Mighty Blow")?.5:0)+(has("Claws")?.5:0);
  else if(kind==="pass")fit=(r.thrower?1.5:0)+(has("Pass")?1:0)+(has("Accurate")?.5:0)+(has("Cannoneer")?.5:0);
  return Math.min(4,fit);
 }
 carrierValue(g,p){
  const r=this.roles(g,p);
  return g.profile(p).ma-Number.parseInt(g.profile(p).ag)*2+(g.skill(p,"Sure Hands")?4:0)+(g.skill(p,"Dodge")?1.25:0)+(g.skill(p,"Extra Arms")?.75:0)+(r.runner?2:r.catcher?1:r.thrower?.75:0)+(g.skill(p,"Pass")?.5:0)-g.marking(p)*2;
 }
 routeRisk(g,p,n,context){
  const risk=n.risk||0;if(!risk||!n.path.length||!["Dodge","Sure Feet","Sure Hands"].some(name=>g.skill(p,name)))return risk;
  let raw=1,picked=false;
  for(const step of n.path){const plan=step.plan;
   if(plan.dodge||plan.jump)raw*=this.checkChance(g,g.forecastTarget(p,plan.jump?"Jump":"Dodge",plan.divingTackleTarget??plan.target));
   for(let i=0;i<plan.rushes;i++)raw*=this.checkChance(g,g.forecastTarget(p,"Rush",2));
   if(plan.pickup&&!picked){raw*=this.checkChance(g,g.forecastTarget(p,"Pick up",Number.parseInt(g.profile(p).ag)+g.markingAt(p,step.x,step.y)));picked=true;}
   if(g.onTrapdoor?.({x:step.x,y:step.y}))raw*=5/6;
  }
  if(raw>=1)return risk;
  const actual=context.chance?context.chance(n):this.routeChance(g,p,n,context);
  return risk*Math.min(1,Math.max(.15,(1-actual)/(1-raw)));
 }
 blockingPosition(g,p,n,context){
  const r=context.roles||this.roles(g,p),strength=Number(g.profile(p).st),fit=r.blocker?1:g.skill(p,"Guard")?.85:r.bigGuy?.7:strength>=4?.55:g.skill(p,"Block")?.25:0;
  if(!fit)return 0;const nearby=context.enemies.filter(e=>g.distance(e,n)===1);let value=0;
  for(const e of nearby){
   const advantage=strength-Number(g.profile(e).st);if(advantage<0&&!g.skill(p,"Guard"))continue;
   const partners=context.allies.filter(q=>g.distance(q,e)===1).length;
   value+=fit*(2+Math.min(2,Math.max(0,advantage))*1.5+(g.skill(p,"Block")?.75:0)+(g.skill(p,"Guard")?Math.min(2,partners):0));
  }
  return Math.min(5,value)-Math.max(0,nearby.length-1)*fit*2;
 }
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
    const next={x:plan.x,y:plan.y,spent:n.spent+plan.cost,risk,path:n.path.concat({x:plan.x,y:plan.y,fromX:n.x,fromY:n.y,plan})},key=next.x+","+next.y,state=key+","+next.spent;
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
  return {allies,coverage,carrier,enemies,roles:this.roles(g,p),strategy:this.strategy(g),budgets:new Map(allies.filter(q=>!q.used).map(q=>[q.id,g.movementAllowance(q)]))};
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
   if(dx&&dy){if(occupied.has(square.x+","+square.y)){value+=context.enemies.some(e=>g.distance(e,square)===1)?1:4;corners++;}else missing.push(square);}
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
  let value=-marks*3-this.routeRisk(g,p,n,context)*5-n.path.length*.12+(carrier===p?0:this.coverageValue(g,n,context.coverage));
  if(carrier===p){
   value+=(n.x-p.x)*dir*((context.strategy.urgentScore?5:3)+((context.roles||this.roles(g,p)).runner?.25:0));
   if(n.x===(dir===1?25:0))value+=200-n.risk*2;
   value+=this.protectionValue(g,n,context.allies,context,{potential:true})*.45;
   value-=Math.max(0,3-Math.min(n.y,14-n.y))*(context.strategy.turn<=4?2:.6);
   value-=marks*10;
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
    if(g.distance(n,carrier)===1)value+=markers===0?(context.strategy.mustSteal?12:3):markers===1?1:0;
    if(context.strategy.holdLine){
     const depth=(carrier.x-n.x)*dir;
     value-=marks*2;
     value+=Math.max(0,4-Math.abs(depth-2))*1.5;
     if(depth<0)value-=Math.min(8,-depth)*1.5;
     const safety=context.allies.some(q=>(carrier.x-q.x)*dir>=4);
     if(!safety)value+=Math.max(0,Math.min(6,depth-2))*1.3;
    }
   }
  }else value+=(n.x-p.x)*dir;
  if(carrier!==p){
   value+=this.blockingPosition(g,p,n,context);
   const roles=context.roles||this.roles(g,p),receiver=(roles.catcher?1.2:roles.runner?.8:0)+(g.skill(p,"Catch")?.3:0);
   if(own&&receiver&&marks===0&&!g.has(p,"No Ball")&&context.allies.some(q=>q!==carrier&&g.distance(q,carrier)<=2))value+=Math.min(6,Math.max(0,(n.x-carrier.x)*dir-1)*receiver);
  }
  if(n.y===0||n.y===14)value-=2;
  return value;
 }
 // Transfer and foul candidates must beat explicit value/risk gates before
 // entering the ordinary action ranking. Team re-rolls are never assumed.
 forecast(g,p,n,kind){
  const view=Object.assign(Object.create(Object.getPrototypeOf(g)),g,{players:g.players.map(q=>({...q})),ball:{x:n.x,y:n.y,carrier:p.id},pending:null,mover:p.id,action:kind,ballActionDone:false,passContext:null});
  Object.assign(view.players.find(q=>q.id===p.id),{x:n.x,y:n.y,spent:n.spent,status:"standing",distracted:false});return view;
 }
 catchChance(g,p,kind){
  if(p.status!=="standing"||p.distracted||g.has(p,"No Ball")||g.has(p,"Ball & Chain"))return 0;
  const target=kind==="handoff"?Number.parseInt(g.profile(p).ag)+g.marking(p):g.landingTarget(p,{kind:"pass",accurate:true,accurateToPlayer:true});
  const chance=this.checkChance(g,g.forecastTarget(p,"Catch",target));return g.skill(p,"Catch")?chance+(1-chance)*chance:chance;
 }
 transferCandidates(g,p,data,analyze){
  if(g.ball.carrier!==p.id||g.has(p,"Hail Mary Pass")&&p.hailMary)return [];
  const {routes,chance,context}=data,goal=g.right(p.team)?25:0,dir=g.right(p.team)?1:-1,result=[];
  const runChance=n=>this.activationChance(g,p,"move")*chance(n);
  const runScore=Math.max(0,...routes.filter(n=>n.x===goal).map(runChance));if(runScore>=.98)return result;
  const safeAdvance=Math.max(...routes.filter(n=>runChance(n)>=.9&&g.markingAt(p,n.x,n.y)===0).map(n=>n.x*dir),p.x*dir);
  const safeEscape=Math.max(0,...routes.filter(n=>g.markingAt(p,n.x,n.y)===0).map(runChance));
  const late=(g.turns[p.team]||1)>=8&&g.scores[p.team]<=g.scores[1-p.team];
  const receivers=g.players.filter(q=>q!==p&&q.team===p.team&&g.onPitch(q)&&q.status==="standing"&&!q.distracted&&!g.has(q,"No Ball")&&!g.has(q,"Ball & Chain")&&(q.x===goal||g.canStart(q)));
  for(const receiver of receivers){
   const receiving=receiver.used?null:analyze(receiver),receiverRoutes=receiving?.routes||[{x:receiver.x,y:receiver.y,path:[],risk:0}];
   const receivingChance=n=>receiver.x===goal?1:this.activationChance(g,receiver,"move")*receiving.chance(n);
   for(const kind of ["handoff","pass"]){
    if(!g.canBallAction(p,kind))continue;
    const positions=routes.filter(n=>chance(n)>=.9&&(!n.path.length||!g.has(p,"Fumblerooski")||!p.dropOnExit)&&(kind!=="handoff"||g.distance(n,receiver)===1))
     .sort((a,b)=>kind==="handoff"?a.risk-b.risk||a.spent-b.spent:(a.risk*4+a.spent*.35+g.distance(a,receiver)*.5+g.markingAt(p,a.x,a.y)*3)-(b.risk*4+b.spent*.35+g.distance(b,receiver)*.5+g.markingAt(p,b.x,b.y)*3)).slice(0,kind==="handoff"?6:12);
    for(const n of positions){
     const view=this.forecast(g,p,n,kind),actor=view.players.find(q=>q.id===p.id),catcher=view.players.find(q=>q.id===receiver.id);
     const preview=kind==="pass"?view.passPreview(receiver.x,receiver.y):null;if(kind==="pass"&&(!preview||preview.hail||!Number.isFinite(preview.target)))continue;
     let success=this.activationChance(g,p,kind)*chance(n)*this.catchChance(view,catcher,kind);
     if(kind==="pass"){
      const accuracy=this.checkChance(view,preview.target);success*=view.skill(actor,"Pass")?accuracy+(1-accuracy)*accuracy:accuracy;
      const threats=view.interceptionCandidates(actor,catcher),intercept=Math.max(0,...threats.map(q=>this.checkChance(view,view.forecastTarget(q,"Intercept",Number.parseInt(view.profile(q).ag)+3+view.marking(q)))));success*=1-intercept;
      const reactive=view.players.some(q=>q.team!==p.team&&view.onPitch(q)&&view.skill(q,"On the Ball")&&!q.rooted&&!view.isChomped(q)&&Array.from({length:49},(_,i)=>({x:q.x+i%7-3,y:q.y+Math.floor(i/7)-3})).some(pos=>view.inside(pos.x,pos.y)&&view.interceptionSquare(actor,catcher,pos)));
      if(reactive)success*=.85;
     }
     const animosity=view.parameter(actor,"Animosity"),word=animosity?.slice(animosity.indexOf("(")+1,-1).toLowerCase();if(word&&(word==="all"||view.keywords(catcher).includes(word)))success*=5/6;
     if(success<(late?(kind==="pass"?.5:.6):(kind==="pass"?.78:.8)))continue;
     const openRoutes=receiverRoutes.filter(r=>!r.path.some(step=>step.x===n.x&&step.y===n.y));
     const scoringChance=Math.max(0,...openRoutes.filter(r=>r.x===goal).map(receivingChance));
     if(scoringChance&&success*scoringChance>= (late?.45:.65)&&success*scoringChance>runScore+.08){result.push({kind,p,target:receiver,route:n,score:190+this.actionFit(g,p,kind,receiver),success:success*scoringChance,scoring:true,transfer:true,goal:"a scoring receiver"});continue;}
     const advances=openRoutes.filter(r=>receivingChance(r)>=.9&&g.markingAt(receiver,r.x,r.y)===0),advance=advances.sort((a,b)=>b.x*dir-a.x*dir)[0];
     const gain=advance?advance.x*dir-safeAdvance:0,escape=g.marking(p)>0&&safeEscape<.85&&view.marking(catcher)===0&&context.allies.filter(q=>q!==receiver&&view.distance(q,catcher)<=1).length>=2;
     if(success>=.86&&(gain>=5||escape))result.push({kind,p,target:receiver,route:n,score:(escape?48:30+gain*3)+this.actionFit(g,p,kind,receiver),success:success*(escape?1:receivingChance(advance)),transfer:true,urgent:escape,goal:escape?"a protected receiver":"a major advance"});
    }
   }
  }
  return result;
 }
 playerValue(g,p){
  const profile=g.profile(p),cost=Number(p.leagueRecord?.value??profile.cost)||50000;
  return cost/1000+(Number(profile.ma)>=8?15:0)+(Number.parseInt(profile.ag)<=2?15:0)+(g.has(p,"Dodge")&&(g.has(p,"Block")||g.has(p,"Wrestle"))?25:0)+(g.has(p,"Guard")?20:0);
 }
 foulOdds(g,p,target,n,cache){
  const view=this.forecast(g,p,n,"foul"),actor=view.players.find(q=>q.id===p.id),victim=view.players.find(q=>q.id===target.id);
  const helpers=(team,at,excluded,offensive)=>view.players.filter(q=>q.team===team&&q.id!==p.id&&q.id!==target.id&&view.onPitch(q)&&q.status==="standing"&&!q.distracted&&!q.gouged&&view.distance(q,at)===1&&(view.markedByExcept(q,[excluded.id])===0||offensive&&view.skill(q,"Put the Boot In")&&!view.players.some(e=>e.team!==q.team&&e.team!==view.active&&view.skill(e,"Defensive")&&view.onPitch(e)&&view.distance(e,q)===1))).length;
  const skin=view.has(victim,"Iron Hard Skin"),modifier=skin?0:helpers(p.team,victim,victim,true)-helpers(target.team,actor,actor,false),key=p.id+":"+target.id+":"+modifier;
  if(cache.has(key))return cache.get(key);
  const dirty=view.skill(actor,"Dirty Player"),git=view.skill(actor,"Sneaky Git"),small=view.has(victim,"Stunty")&&!skin,thick=view.has(victim,"Thick Skull"),stunMax=small?(thick?7:6):(thick?8:7),av=Number.parseInt(view.profile(victim).av);let removal=0,stun=0,sent=0;
  for(let a=1;a<=6;a++)for(let b=1;b<=6;b++){
   const boost=dirty&&!skin&&a+b+modifier<av&&a+b+modifier+1>=av?1:0,broken=a+b+modifier+boost>=av;
   for(let c=1;c<=6;c++)for(let d=1;d<=6;d++){
    if(broken){if(c+d+(dirty&&!boost?1:0)>stunMax)removal++;else stun++;}
    const caught=a===b&&(!git||broken)||broken&&(c===d||view.foulSpottedOnBreak?.(p.team));sent+=caught?1:(view.biasedRefs?.[1-p.team]||0)>0?1/3:0;
   }
  }
  const odds={removal:removal/1296,stun:stun/1296,sent:sent/1296};cache.set(key,odds);return odds;
 }
 foulCandidate(g,p,data,cache){
  if(g.ball.carrier===p.id||!g.specialActions(p).includes("Foul")||g.has(p,"Chainsaw")||this.playerValue(g,p)>80)return null;
  const {routes,context,values,base,chance}=data,carrier=context.carrier;
  if(carrier?.team===p.team&&g.distance(p,carrier)<=1)return null;
  const dir=g.right(p.team)?1:-1;if(context.strategy.holdLine&&carrier&&(carrier.x-p.x)*dir>=0&&!context.allies.some(q=>(carrier.x-q.x)*dir>=0))return null;
  let best=null;
  for(const target of g.players.filter(q=>q.team!==p.team&&g.onPitch(q)&&["prone","stunned"].includes(q.status)&&!g.has(q,"Saboteur"))){
   const value=this.playerValue(g,target),own=this.playerValue(g,p);if(value<100||value<own*1.6||value-own<40)continue;
   const approaches=routes.filter(n=>g.distance(n,target)===1&&n.path.length<=3&&n.risk===0&&g.markingAt(p,n.x,n.y)===0&&values.get(n)-base>=-4&&this.activationChance(g,p,"foul")*chance(n)>=.98).sort((a,b)=>a.spent-b.spent).slice(0,6);
   for(const n of approaches){
    const odds=this.foulOdds(g,p,target,n,cache);if(odds.removal<.16)continue;
    const ownCount=g.players.filter(q=>q.team===p.team&&g.onPitch(q)).length,enemyCount=g.players.filter(q=>q.team!==p.team&&g.onPitch(q)).length,scarcity=1+Math.max(0,enemyCount-ownCount)*.15;
    const net=(odds.removal+odds.stun*.1)*value*(target.status==="stunned"?.55:1)-odds.sent*(own*1.4*scarcity+12)-n.path.length*.4;
    if(net<8)continue;const c={kind:"foul",p,target,route:n,score:net,success:1-odds.sent,fouling:true,goal:"a valuable vulnerable opponent",odds};if(!best||c.score>best.score)best=c;
   }
  }
  return best;
 }
 chooseAction(g){
  let best=null;const analyses=new Map(),foulCache=new Map();
  const analyze=p=>{if(!analyses.has(p.id)){const routes=this.routes(g,p),context=this.positionContext(g,p),chances=new Map(),chance=n=>{if(!chances.has(n))chances.set(n,this.routeChance(g,p,n,context));return chances.get(n);};context.chance=chance;const values=new Map(routes.map(n=>[n,this.positionValue(g,p,n,context)]));analyses.set(p.id,{routes,context,values,base:values.get(routes[0]),chance});}return analyses.get(p.id);};
  const strategy=this.strategy(g),goal=g.right(this.team)?25:0;
  const threatened=!!(strategy.carrier?.team===this.team&&g.marking(strategy.carrier)>0);
  const stopScore=!!(strategy.carrier?.team!==this.team&&strategy.carrier&&Math.abs(strategy.carrier.x-(g.right(strategy.carrier.team)?25:0))<=g.movementAllowance(strategy.carrier));
  const offer=c=>{
   if(c.score<=.75)return;
   c.priority=c.scoring?4:c.urgent?3:c.fouling?0:c.transfer?2:c.success>=1-1e-9?2:1;
   c.utility=c.fouling?c.score:c.score*c.success-(1-c.success)*18;
   if(c.utility<=0&&!c.scoring)return;
   if(!best||c.priority>best.priority||c.priority===best.priority&&c.utility>best.utility)best=c;
  };
  const enemies=g.players.filter(q=>q.team!==this.team&&g.onPitch(q)&&q.status==="standing");
  for(const p of g.players.filter(p=>g.canStart(p))){
   const data=analyze(p),{routes,context,values,base,chance}=data,foul=this.foulCandidate(g,p,data,foulCache);
   if(foul)offer(foul);
   for(const transfer of this.transferCandidates(g,p,data,analyze))offer(transfer);
   const attacks=[];
   const moving=this.activationChance(g,p,"move"),blitzing=this.activationChance(g,p,"blitz"),blocking=this.activationChance(g,p,"block");

   for(const d of enemies){
    const important=this.importantAction(g,p,d);
    if(g.canBlock(p,d)){
     const odds=this.blockOdds(g,p,d);
     if(odds.own)attacks.push({kind:"block",fit:this.actionFit(g,p,"block",d),p,target:d,score:(odds.count>1?8:3)+odds.knockdown*8+(important?10:0)+this.actionFit(g,p,"block",d),success:blocking*(1-odds.failure),urgent:threatened&&important||(stopScore||strategy.mustSteal)&&d===strategy.carrier});
    }
    // A Blitz must leave one MA for the block. Evaluate assists at its landing
    // square with all other players in their current positions.
    if(!g.blitzUsed[this.team]&&g.distance(p,d)<=g.movementAllowance(p)){
     for(const n of routes)if(g.distance(n,d)===1&&n.spent<g.movementAllowance(p)&&n.risk<=2){
      if(!n.path.length&&p.status==="standing"&&g.canBlock(p,d))continue;
      const odds=this.blockOdds(g,p,d,n,true);
      if(odds.own)attacks.push({kind:"blitz",fit:this.actionFit(g,p,"blitz",d),p,target:d,route:n,score:(g.ball.carrier===d.id?30:9)+(threatened&&important?12:0)+values.get(n)-base-n.path.length*.08+this.actionFit(g,p,"blitz",d),success:blitzing*chance(n)*(1-odds.failure),urgent:threatened&&important||(stopScore||strategy.mustSteal)&&d===strategy.carrier});
     }
    }
   }
   const reserve=attacks.some(c=>c.fit>=1&&c.success>=.9&&c.score>=10)&&strategy.carrier!==p,attackValue=Math.max(0,...attacks.map(c=>c.score*c.success-(1-c.success)*18));
   for(const n of routes){
    const score=values.get(n)-base+(p.status==="prone"?5:0);
    if(score>.75&&(n.path.length||p.status==="prone")&&(!foul||strategy.carrier===p)&&(!reserve||strategy.carrier===p||score>=Math.max(8,attackValue+2)))offer({kind:"move",p,route:n,score,success:moving*chance(n),scoring:strategy.carrier===p&&n.x===goal,urgent:threatened&&strategy.carrier===p&&g.markingAt(p,n.x,n.y)===0});
   }
   for(const attack of attacks)offer(attack);
  }
  return best;
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
    if(["pass","handoff","foul"].includes(this.plan.kind)){
     const target=g.players.find(q=>q.id===this.plan.targetId),foul=this.plan.kind==="foul";
     if(!target||!g.onPitch(target)||target.x!==this.plan.targetX||target.y!==this.plan.targetY||(foul?!["prone","stunned"].includes(target.status):target.status!=="standing"||target.distracted||g.ball.carrier!==p.id)){
      this.plan=null;return this.act(g,"Abandon an invalidated target",()=>g.finish());
     }
    }
    const next=this.plan.path[0];
    if(this.plan.released){this.plan=null;return this.act(g,"Finish the activation",()=>g.finish());}
    if(next&&g.plan(next.x,next.y)){this.plan.path.shift();return this.act(g,"Move #"+p.number+" toward "+this.plan.goal,()=>g.step(next.x,next.y));}
    if(next){this.plan=null;return this.act(g,"Stop an invalidated route",()=>g.finish());}
    if(this.plan.kind==="blitz"&&g.canBlitzBlock()){this.plan=null;return this.act(g,"Blitz the opponent",()=>g.blitzBlock());}
    const target=g.players.find(q=>q.id===this.plan.targetId),kind=this.plan.kind;
    if(["pass","handoff","foul"].includes(kind)&&target&&target.x===this.plan.targetX&&target.y===this.plan.targetY&&p.x===this.plan.endX&&p.y===this.plan.endY){
     this.plan.released=true;
     if(kind==="pass"&&g.ball.carrier===p.id&&g.passPreview(target.x,target.y))return this.act(g,"Pass to #"+target.number,()=>g.pass(target.x,target.y));
     if(kind==="handoff"&&g.canHandoff(target))return this.act(g,"Hand off to #"+target.number,()=>g.handoff(target.id));
     if(kind==="foul"&&g.specialTargets().includes(target))return this.act(g,"Foul #"+target.number,()=>g.performSpecial(target.id));
    }
   }
   this.plan=null;return this.act(g,"Finish the activation",()=>g.finish());
  }
  const action=this.chooseAction(g);
  if(!action)return this.act(g,"End the team turn",()=>g.endTurn());
  const {p,route,target,kind}=action;
  if(kind==="block")return this.act(g,"Take a favourable block with #"+p.number,()=>g.block(p.id,target.id));
  const strategy=this.strategy(g),goal=strategy.carrier===p?"the end zone":strategy.holdLine?"a goal-side defensive screen":strategy.carrier?.team===this.team?"supporting space":strategy.carrier?"the opposing carrier":"the ball";
  this.plan={id:p.id,drive:g.drive,turn:g.turns[this.team],kind,path:route.path.slice(),scoring:action.scoring,goal:action.goal||goal,targetId:target?.id,targetX:target?.x,targetY:target?.y,endX:route.x,endY:route.y};
  return this.act(g,(kind==="blitz"?"Declare Blitz":"Activate")+" #"+p.number,()=>kind==="blitz"?g.startBlitz(p.id,target.id):g.start(p.id,["pass","handoff","foul"].includes(kind)?kind:"move"));
 }
}
if(typeof module!=="undefined")module.exports={ComputerCoach,computerDecisionTeam,COMPUTER_ROSTERS};
