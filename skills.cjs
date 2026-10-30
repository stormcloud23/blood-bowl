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
 "Violent Innovator":"Requires Star Player Point attribution and league progression.",
 "Insignificant":"Requires the Team Draft List / roster builder.",
};
const SKILL_PARTIAL={"Secret Weapon":"End-of-drive send-off, Argue the Call, Bribes and Bribery and Corruption are supported; grouped end-drive Argue allocation and Biased Referee exceptions remain outside the current resource batch."};
const PASSIVES=new Set(["Claws","Disturbing Presence","Foul Appearance","Iron Hard Skin","Leader","Thick Skull","Animal Savagery","Bloodlust (X+)","Bone Head","Decay","Drunkard","Hatred (X)","Insignificant","Kick Team-mate","Loner (X+)","My Ball","No Ball","Plague Ridden","Really Stupid","Regeneration","Right Stuff","Secret Weapon","Stunty","Take Root","Timmm-ber!","Titchy","Unchannelled Fury","Unsteady"]);
const MANDATORY=new Set(["Frenzy","Disturbing Presence","Foul Appearance","Always Hungry","Animal Savagery","Animosity (X)","Ball & Chain","Bloodlust (X+)","Bone Head","Chainsaw","Decay","Drunkard","Hatred (X)","Insignificant","Loner (X+)","My Ball","No Ball","Really Stupid","Right Stuff","Secret Weapon","Stunty","Take Root","Titchy","Unchannelled Fury","Unsteady"]);
const SKILL_CATALOG=Object.entries(SKILL_GROUPS).flatMap(([category,names])=>names.map(name=>({name,category,kind:PASSIVES.has(name)?"Passive":"Active",mandatory:MANDATORY.has(name),status:SKILL_DEFERRED[name]?"Deferred":SKILL_PARTIAL[name]?"Partial":"Implemented",notes:SKILL_DEFERRED[name]||SKILL_PARTIAL[name]||"Supported in the available actions. Optional abilities may be disabled before action resolution.",source:"https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#"+name.toLowerCase().replace(/[^a-z0-9 ]/g,"").replaceAll(" ","-")})));
class SkillGame extends SkillBase {
 canBomb(p){return !!p&&this.canStart(p)&&p.status==="standing"&&this.has(p,"Bombardier")&&!this.has(p,"Ball & Chain")&&!this.bombUsed?.[p.team];}
 beginBomb(p){
  this.bombContext={original:p,attacker:p,thrower:p,team:p.team,stage:"aim",turnover:false,injuries:[],ball:null};this.bomb={x:p.x,y:p.y,carrier:p.id};this.action="bomb";this.mover=p.id;this.scoreDeferrals=(this.scoreDeferrals||0)+1;this.note("Throw Bomb: choose a highlighted square; no movement before throwing.");
 }
 bombActor(){const c=this.bombContext;return c?.stage==="aim"&&!this.pending&&!this.finished?c.thrower:null;}
 ballActor(kind){return kind==="bomb"?this.bombActor():super.ballActor(kind);}
 canBlitz(p,target){return !!p&&!this.has(p,"Ball & Chain")&&super.canBlitz(p,target);}
 secureBall(p,x,y){if(p.bloodlust){this.feed(p,()=>super.secureBall(p,x,y));return;}super.secureBall(p,x,y);}
 checkScore(){if(this.feedBeforeScore())return;super.checkScore();}
 feedBeforeScore(){
  if(this.scoreDeferrals||this.pending)return false;
  const p=this.players.find(q=>q.id===this.ball.carrier);if(!p?.bloodlust)return false;
  const goal=this.match?(this.right(p.team)?25:0):(p.team===0?25:0);
  if(p.x!==goal||p.status!=="standing")return false;this.feed(p,()=>this.checkScore());return true;
 }
 bombPreview(x,y){
  const p=this.bombActor(),range=p&&this.passRange(p,{x,y});if(!range)return null;const pa=parseInt(this.profile(p).pa);
  let target=(Number.isFinite(pa)?pa:7)+range.band+this.marking(p)+this.disturbance(p)+(this.weather==="Very Sunny"?1:0);
  if(this.skill(p,"Nerves of Steel"))target-=this.marking(p);if(range.band<2&&this.skill(p,"Accurate")||range.band>=2&&this.skill(p,"Cannoneer"))target--;
  return {...range,target};
 }
 throwBomb(x,y,{animosityChecked=false}={}){
  const p=this.bombActor(),preview=this.bombPreview(x,y);if(!p||!preview)return false;
  if(p.bloodlust){this.feed(p,()=>this.throwBomb(x,y));return true;}
  if(!animosityChecked&&this.parameter(p,"Animosity"))return this.animosity(p,this.at(x,y),()=>this.throwBomb(x,y,{animosityChecked:true}),()=>{if(this.bombContext.rethrows)this.explodeBomb(p.x,p.y);else this.finishBomb();});
  const c=this.bombContext;c.stage="flight";const pa=parseInt(this.profile(p).pa),modifier=preview.target-(Number.isFinite(pa)?pa:7),origin={x:p.x,y:p.y};
  const resolve=n=>{
   if(p===c.original)c.allowMove=preview.band===0&&this.has(p,"Give and Go")&&n!==1;
   if(Number.isFinite(pa)&&n===1&&this.has(p,"Safe Pass")){this.note("Safe Pass: bomb retained safely; action ends.");this.finishBomb();return;}
   if(!Number.isFinite(pa)||n===1||n!==6&&n-modifier<=1){this.note("Fumbled bomb: explosion in the thrower's square.");this.explodeBomb(origin.x,origin.y);return;}
   const accurate=!preview.hail&&(n===6||n-modifier>=pa),delivery={kind:"pass",chooserTeam:p.team,accurate,accurateToPlayer:accurate&&this.at(x,y)?.status==="standing"};
   let lx=x,ly=y;if(!accurate)for(let i=0;i<3;i++){const pos=this.bombScatter(lx,ly,"Bomb scatter");lx=pos.x;ly=pos.y;if(!this.inside(lx,ly)){this.finishBomb();return;}}
   const land=()=>this.landBomb(lx,ly,delivery,true);
   if(preview.hail){land();return;}
   const candidates=this.interceptionCandidates(p,{x:lx,y:ly}).filter(q=>!this.has(q,"Ball & Chain"));
   if(!candidates.length){land();return;}
   const options=candidates.map(q=>"Intercept bomb with #"+q.number+" ("+q.id+")").concat("Decline interception");
   this.skillChoice("Bomb interception",1-p.team,options,choice=>{
    const q=candidates[options.indexOf(choice)];if(!q){land();return;}
    const target=parseInt(this.profile(q).ag)+(accurate?3:2)+this.marking(q)+this.disturbance(q)-(this.skill(q,"Extra Arms")?1:0)-(this.skill(q,"Very Long Legs")?2:0);
    this.test(q,"Bomb interception",target,()=>this.rethrowBomb(q),land);
   });
  };
  if(!Number.isFinite(pa))resolve(1);else this.test(p,"Pass",preview.target,resolve,resolve);return true;
 }
 bombScatter(x,y,label){const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],[dx,dy]=dirs[this.roll(label,8)-1];return {x:x+dx,y:y+dy};}
 landBomb(x,y,delivery,mayBounce){
  if(!this.inside(x,y)){this.note("Bomb leaves the pitch.");this.finishBomb();return;}
  this.bomb={x,y,carrier:null};
  const catchWith=p=>{
   if(p?.status==="standing"&&!p.distracted){
    this.bomb={x:p.x,y:p.y,carrier:null};const c=this.bombContext;c.catchTest=p.id;
    const end=fn=>{c.catchTest=null;fn();};this.test(p,"Catch",this.landingTarget(p,delivery),()=>end(()=>this.rethrowBomb(p)),()=>end(()=>this.explodeBomb(p.x,p.y)));return;
   }
   if(!this.at(x,y)&&mayBounce){const pos=this.bombScatter(x,y,"Bomb bounce");this.landBomb(pos.x,pos.y,{kind:"bomb"},false);}else this.explodeBomb(x,y);
  };
  if(delivery.kind==="pass")this.chooseLandingCatcher(x,y,delivery,catchWith);else catchWith(this.at(x,y));
 }
 rethrowBomb(p){const c=this.bombContext;c.thrower=p;c.rethrows=(c.rethrows||0)+1;c.stage="aim";this.bomb={x:p.x,y:p.y,carrier:p.id};this.mover=p.id;this.action="bomb";this.note(this.teams[p.team].name+" #"+p.number+" catches the bomb and must throw it again.");}
 explodeBomb(x,y){
  const c=this.bombContext;c.stage="blast";this.bomb={x,y,carrier:null};
  const victims=this.players.filter(p=>this.onPitch(p)&&this.distance(p,{x,y})<=1).sort((a,b)=>a.y-b.y||a.x-b.x);let i=0;
  this.note("Bomb explodes at "+(x+1)+", "+(y+1)+".");
  const next=()=>{
   if(i===victims.length){c.stage="medical";this.resolveMedicalGroups(c,()=>this.finishBomb());return;}
   const p=victims[i++];if((p.x!==x||p.y!==y)&&this.roll("Adjacent bomb blast needs 4+")<4){next();return;}
   const origin={x:p.x,y:p.y},standing=p.status==="standing",carrier=this.ball.carrier===p.id;
   const damage=()=>{
    if(standing){p.status="prone";p.rooted=false;this.onProne(p);if(p.team===c.team)c.turnover=true;}
    if(carrier&&p.team===c.team)c.turnover=true;
    const finish=()=>this.releaseProneBall(p,origin,next),armour=this.has(p,"Ball & Chain")?Infinity:this.roll("Bomb Armour")+this.roll("Bomb Armour");
    if(armour<parseInt(this.profile(p).av)){finish();return;}
    this.injuryResult(p,this.roll("Bomb Injury")+this.roll("Bomb Injury"),finish,{source:{playerId:c.original.id,cause:"Bomb"}});
   };
   const placed=()=>standing?this.beforeProne(p,origin,damage):damage();if(standing)this.preventFall(p,next,placed);else placed();
  };next();
 }
 finishBomb({allowFeed=true}={}){
  const c=this.bombContext;if(!c)return;this.bombContext=null;this.bomb=null;this.mover=null;this.action=null;this.blockAction=null;
  const finish=()=>{this.scoreDeferrals--;this.syncLeader();const complete=()=>{this.checkScore();if(!this.finished&&c.turnover)this.endTurn(true);else if(!this.finished&&c.allowMove&&c.original.status==="standing"){this.mover=c.original.id;this.action="move";this.note("Give and Go: movement after the bomb is available.");}};if(allowFeed&&c.original.bloodlust)this.feed(c.original,complete);else complete();};
  if(c.ball){const {x,y,kind}=c.ball;if(kind==="throwIn")super.throwIn(x,y,finish);else super.bounce(x,y,finish);}else finish();
 }
 bloodlustActivation(p,action,ready){
  const trait=this.parameter(p,"Bloodlust");if(!trait||p.bloodlustChecked){ready();return;}
  p.bloodlustChecked=true;const easy=["block","blitz","foul"].includes(action)||["Stab","Chainsaw","Projectile Vomit","Breathe Fire","Chomp"].some(s=>action==="special:"+s),target=Math.max(2,Number(trait.match(/\d+/)[0])-(easy?1:0));
  this.test(p,"Bloodlust",target,ready,()=>{
   p.bloodlust=true;this.note("#"+p.number+" must feed before finishing the action, transferring the ball or scoring.");
   if(["block","secure","bomb"].includes(action))this.skillChoice("Bloodlust — action",p.team,["Continue declared action","Replace with Move"],choice=>{
    if(choice==="Continue declared action"){ready();return;}
    if(this.multipleContext){this.multipleContext=null;this.scoreDeferrals--;}
    this.action="move";this.blockAction=null;this.mover=p.id;this.attackRoller=null;
    if(p.status==="prone")this.stand(p);if(this.bombContext)this.finishBomb({allowFeed:false});
   });else ready();
  });
 }
 thralls(p){return this.players.filter(q=>q!==p&&q.team===p.team&&this.onPitch(q)&&this.distance(p,q)===1&&(q.thrall||this.profile(q).thrall||this.keywords(q).includes("thrall")));}
 feed(p,done,{allow=true}={}){
  if(!p?.bloodlust){done();return false;}
  const victims=allow&&p.status==="standing"&&!p.distracted?this.thralls(p):[],fail=()=>{
   p.bloodlust=false;if(this.onPitch(p))p.distracted=true;this.note("Bloodlust: #"+p.number+" fails to feed; turnover.");this.mover=null;this.action=null;this.blockAction=null;
   const finish=()=>this.feedingTurnover();if(this.ball.carrier===p.id){const {x,y}=p;this.ball={x,y,carrier:null};this.bounce(x,y,finish);}else finish();
  };
  if(!victims.length){fail();return true;}
  const options=victims.map(q=>"Bite #"+q.number+" ("+q.id+")").concat("Do not feed");
  this.skillChoice("Bloodlust — choose a Thrall",p.team,options,choice=>{
   const q=victims[options.indexOf(choice)];if(!q){fail();return;}
   p.bloodlust=false;const origin={x:q.x,y:q.y},carrying=this.ball.carrier===q.id;
   this.note("#"+p.number+" bites Thrall #"+q.number+".");q.status="prone";q.rooted=false;this.onProne(q);
   this.injuryResult(q,this.roll("Thrall bite Injury")+this.roll("Thrall bite Injury"),()=>this.releaseProneBall(q,origin,()=>{if(carrying)this.feedingTurnover();else done();}),{stunty:false,automaticBadlyHurt:true,source:{playerId:p.id,cause:"Bloodlust bite"}});
  });return true;
 }
 finish(){if(this.bombContext){if(this.pending||this.bombContext.rethrows)return false;this.finishBomb();return true;}const p=this.players.find(p=>p.id===this.mover);if(p?.bloodlust&&!this.pending){this.feed(p,()=>super.finish());return true;}return super.finish();}
 bloodlustEndTurn(turnover){
  if(this.pending||this.feedingEndTurn)return false;
  const p=this.players.find(q=>q.team===this.active&&q.bloodlust);if(!p)return false;
  this.feedingEndTurn=true;this.feed(p,()=>{this.feedingEndTurn=false;this.endTurn(turnover);},{allow:!turnover});this.feedingEndTurn=false;return true;
 }
 offerChain(){
  const p=this.players.find(p=>p.id===this.mover);if(!p||!this.has(p,"Ball & Chain")||this.pending||p.status!=="standing")return;
  if(p.spent>=this.movementAllowance(p)+this.rushLimit(p)){const end=()=>{this.mover=null;this.action=null;};if(p.bloodlust)this.feed(p,end);else end();return;}
  this.skillChoice("Ball & Chain — aim the movement template",p.team,["Aim North","Aim East","Aim South","Aim West","End activation"],choice=>{
   if(choice==="End activation"){this.finish();return;}this.chainStep(p,choice.slice(4));
  });
 }
 chainStep(p,direction){
  const fans={North:[[-1,-1],[0,-1],[1,-1]],East:[[1,-1],[1,0],[1,1]],South:[[1,1],[0,1],[-1,1]],West:[[-1,1],[-1,0],[-1,-1]]};
  const [dx,dy]=fans[direction][Math.ceil(this.roll("Ball & Chain direction")/2)-1],origin={x:p.x,y:p.y},pos={x:p.x+dx,y:p.y+dy};p.spent++;
  if(!this.inside(pos.x,pos.y)){this.pushPlayer(p,pos,()=>this.endTurn(true));return;}
  const d=this.at(pos.x,pos.y),rush=done=>p.spent>this.movementAllowance(p)?this.test(p,"Rush",2,done,()=>{
   if(d){this.chainContext.rushFailed=true;this.resolvePush(false);}else this.fall(p);
  }):done();
  if(d){
   this.chainContext={attacker:p,target:d,origin,ground:d.status!=="standing",carrierBefore:this.ball.carrier};
   const b={attacker:p,target:d,blitz:false,assists:{offensive:0,defensive:0},aStrength:+this.profile(p).st,dStrength:+this.profile(d).st,chain:true};this.blockAction=b;
   this.dumpOff(p,d,()=>{const roll=()=>rush(()=>{if(this.chainContext.ground)this.resolvePush(true);else this.chainBlockDice(p,d);});const own=+this.profile(p).st,other=+this.profile(d).st;if(!this.chainContext.ground&&this.skill(p,"Dauntless")&&own<other)this.test(p,"Dauntless",other-own+1,()=>{p.blockST=other;roll();},roll);else roll();});this.guardMultipleDecision();return;
  }
  p.x=pos.x;p.y=pos.y;this.refreshChomps();rush(()=>{
   if(!this.ball.carrier&&this.ball.x===p.x&&this.ball.y===p.y)this.bounce(p.x,p.y,()=>this.offerChain());else this.offerChain();
  });
 }
 chainBlockDice(p,d){
  this.attackRoller=p.id;super.rollBlock(p,d,false);this.blockAction.chain=true;this.attackRoller=null;p.blockST=null;
  const hatred=this.parameter(p,"Hatred");if(hatred&&this.keywords(d).includes(hatred.slice(hatred.indexOf("(")+1,-1).toLowerCase())){const i=this.blockAction.dice.indexOf(1);if(i>=0){this.blockAction.poolLocked=true;this.blockAction.dice[i]=this.roll("Hatred Ball & Chain skull re-roll");}}
 }
 chainDamage(p,done,{placed=false,source=null,modifierBy=null,modifierKind="Mighty Blow",plague=false}={}){
  const origin={x:p.x,y:p.y},carrying=this.ball.carrier===p.id;p.status="prone";p.rooted=false;this.onProne(p);
  // The pinned placed-prone InjuryTypeBallAndChain uses the fixed {5,5} roll.
  const dice=placed?10:this.roll("Ball & Chain Injury")+this.roll("Ball & Chain Injury"),apply=bonus=>this.injuryResult(p,dice+bonus,()=>this.releaseProneBall(p,origin,()=>{if(carrying&&p.team===this.active)this.endTurn(true);else done();}),{source,plague});
  if(!placed&&modifierBy)this.skillChoice(modifierKind,modifierBy.team,["Add +1 to Injury","No modifier"],choice=>apply(choice==="Add +1 to Injury"?1:0));else apply(0);
 }
 placeProne(p,done,options={}){if(this.has(p,"Ball & Chain")){this.chainDamage(p,done,{placed:true});return;}super.placeProne(p,done,options);}
 multipleTargets(a){return a?this.players.filter(d=>d.team!==a.team&&d.status==="standing"&&this.onPitch(d)&&this.distance(a,d)===1):[];}
 canMultipleBlock(a){return !this.multipleContext&&!!a&&this.canStart(a)&&this.has(a,"Multiple Block")&&!this.has(a,"Ball & Chain")&&(a.status==="standing"||a.status==="prone"&&this.has(a,"Jump Up"))&&this.multipleTargets(a).length>=2;}
 chooseMultipleBlock(a){
  if(!this.canMultipleBlock(a))return false;
  const targets=this.multipleTargets(a),pairs=[];
  for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++)pairs.push([targets[i],targets[j]],[targets[j],targets[i]]);
  const options=pairs.map(pair=>pair.map(d=>"#"+d.number+" ("+d.id+")").join(" then "));
  this.skillChoice("Multiple Block — choose two targets",a.team,[...options,"Cancel"],choice=>{const pair=pairs[options.indexOf(choice)];if(pair)this.multipleBlock(a.id,pair.map(d=>d.id));});return true;
 }
 multipleBlock(id,ids){
  const a=this.players.find(p=>p.id===id),targets=ids?.map(id=>this.players.find(p=>p.id===id));
  if(!this.canMultipleBlock(a)||targets?.length!==2||targets[0]===targets[1]||targets.some(d=>!this.multipleTargets(a).includes(d)))return false;
  this.multipleContext={attacker:a,targets,pools:[],injuries:[],stage:"activation",index:0,turnover:false,targetSquares:targets.map(d=>({x:d.x,y:d.y})),ball:null};
  this.scoreDeferrals=(this.scoreDeferrals||0)+1;this.note("Multiple Block: two committed attacks; -2 attacker ST, no follow-ups.");
  return this.block(a.id,targets[0].id);
 }
 blockActivationFailed(){if(this.multipleContext)this.finishMultiple();}
 multipleTests(kind,targets,minimum,done){
  const a=this.multipleContext.attacker,rows=targets.map(target=>{const required=minimum(target),roll=this.roll("Multiple Block "+kind+" vs #"+target.number);return {target,required,roll,success:this.success(roll,required),rerolled:false};});
  const offer=()=>{
   const failed=rows.filter(r=>!r.success&&!r.rerolled),choices=[];
   for(const row of failed){
    const reroll=()=>{row.roll=this.roll("Multiple Block "+kind+" re-roll");row.success=this.success(row.roll,row.required);offer();};
    if(this.canTeamReroll(a))choices.push({label:"Team re-roll vs #"+row.target.number,run:()=>{row.rerolled=true;if(this.useTeamReroll(a))reroll();else offer();}});
    if(this.has(a,"Pro")&&!a.proUsed)choices.push({label:"Pro vs #"+row.target.number,run:()=>{row.rerolled=true;this.attemptPro(a,reroll,offer);}});
   }
   if(!choices.length){done(rows);return;}
   this.skillChoice("Multiple Block "+kind+" — failed against "+rows.filter(r=>!r.success).map(r=>"#"+r.target.number).join(", "),a.team,[...choices.map(o=>o.label),"Accept failures"],choice=>{const selected=choices.find(o=>o.label===choice);if(selected)selected.run();else done(rows);});
  };offer();
 }
 prepareMultiple(){
  const c=this.multipleContext,a=c.attacker;c.stage="reactions";this.attackRoller=a.id;
  const appearance=()=>this.multipleTests("Foul Appearance",c.targets.filter(d=>this.has(d,"Foul Appearance")),()=>2,rows=>{
   const failed=new Set(rows.filter(r=>!r.success).map(r=>r.target.id));c.targets=c.targets.filter(d=>!failed.has(d.id));if(!c.targets.length){this.finishMultiple();return;}dump(0);
  });
  const dump=i=>{if(i===c.targets.length){dauntless(0);return;}this.dumpOff(a,c.targets[i],()=>dump(i+1));};
  const dauntless=()=>{
   const own=Math.max(1,+super.profile(a).st-2),targets=this.skill(a,"Dauntless")?c.targets.filter(d=>own<+this.profile(d).st&&own+6>+this.profile(d).st):[];
   this.multipleTests("Dauntless",targets,d=>+this.profile(d).st-own+1,rows=>{c.dauntless=new Set(rows.filter(r=>r.success).map(r=>r.target.id));trick(0);});
  };
  const trick=i=>{if(i===c.targets.length){this.rollMultiple();return;}this.trickster(a,c.targets[i],()=>trick(i+1));};
  const begin=()=>appearance();
  if(a.status==="prone")this.test(a,"Jump Up Block",Math.max(2,parseInt(this.profile(a).ag)-1),()=>{a.status="standing";begin();},()=>this.finishMultiple());else begin();
 }
 rollMultiple(){
  const c=this.multipleContext,a=c.attacker;c.stage="dice";this.attackRoller=null;
  for(const d of c.targets){
   const assists=this.assists(a,d),base=Math.max(1,+this.profile(a).st-2),aStrength=(c.dauntless?.has(d.id)?Math.max(base,+this.profile(d).st):base)+assists.offensive,dStrength=+this.profile(d).st+assists.defensive;
   const count=aStrength===dStrength?1:Math.max(aStrength,dStrength)>2*Math.min(aStrength,dStrength)?3:2;
   const b={attacker:a,target:d,assists,aStrength,dStrength,count,chooserTeam:aStrength>=dStrength?a.team:d.team,dice:Array.from({length:count},()=>this.roll("Multiple Block vs #"+d.number)),poolLocked:false,brawlerUsed:false,blitz:false,multiple:true};
   c.pools.push(b);this.onBlockRolled(a);this.note("Multiple Block vs #"+d.number+": ST "+aStrength+" vs "+dStrength+"; "+count+" dice.");
  }
  this.multipleDiceChoice();
 }
 multipleDiceChoice(){
  const c=this.multipleContext,a=c.attacker;
  if(c.pools.every(b=>b.result)){c.stage="effects";c.index=0;this.resolveMultipleNext();return;}
  const attackerPhase=c.pools.some(b=>!b.result&&!b.delegated),team=attackerPhase?a.team:1-a.team,choices=[];
  for(const b of c.pools.filter(b=>!b.result&&(attackerPhase?!b.delegated:b.delegated))){
   const label="#"+b.target.number;
   if(b.chooserTeam===team)b.dice.forEach((die,index)=>choices.push({label:"Choose "+label+" die "+(index+1)+": "+this.blockFace(die),run:()=>{b.result=this.blockFace(die);b.poolLocked=true;this.multipleDiceChoice();}}));
   if(attackerPhase){
    if(b.chooserTeam!==team)choices.push({label:"Let defender choose "+label,run:()=>{b.delegated=true;b.poolLocked=true;this.multipleDiceChoice();}});
    if(!b.poolLocked){
     if(this.canTeamReroll(a))choices.push({label:"Team re-roll pool "+label,run:()=>{b.poolLocked=true;if(this.useTeamReroll(a))b.dice=b.dice.map(()=>this.roll("Multiple Block team re-roll"));this.multipleDiceChoice();}});
     if(this.has(a,"Brawler")&&!c.brawlerUsed&&b.dice.includes(2))choices.push({label:"Brawler "+label,run:()=>{c.brawlerUsed=true;b.poolLocked=true;b.dice[b.dice.indexOf(2)]=this.roll("Multiple Block Brawler");this.multipleDiceChoice();}});
     if(this.has(a,"Pro")&&!a.proUsed)choices.push({label:"Pro "+label,run:()=>{b.poolLocked=true;this.attemptPro(a,()=>this.skillChoice("Multiple Block Pro die",a.team,b.dice.map((die,i)=>"Re-roll die "+(i+1)),option=>{const i=Number(option.match(/\d+/)[0])-1;b.dice[i]=this.roll("Multiple Block Pro re-roll");this.multipleDiceChoice();}),()=>this.multipleDiceChoice());}});
     const hatred=this.parameter(a,"Hatred");if(hatred&&this.keywords(b.target).includes(hatred.slice(hatred.indexOf("(")+1,-1).toLowerCase())&&b.dice.includes(1))choices.push({label:"Hatred "+label,run:()=>{b.poolLocked=true;b.dice[b.dice.indexOf(1)]=this.roll("Multiple Block Hatred");this.multipleDiceChoice();}});
    }
   }
  }
  this.blockAction=null;
  const pools=c.pools.map(b=>"#"+b.target.number+" ["+b.dice.map(n=>this.blockFace(n)).join(", ")+"]").join("; ");
  this.skillChoice("Multiple Block dice — "+pools,team,choices.map(o=>o.label),option=>choices.find(o=>o.label===option).run());
 }
 resolveMultipleNext(){
  const c=this.multipleContext;
  if(c.index>=c.pools.length){this.blockAction=null;c.stage="medical";this.multipleMedical();return;}
  const b=c.pools[c.index];this.blockAction=b;this.note("Resolve Multiple Block against #"+b.target.number+": "+b.result+".");this.applyBlockResult(b.result);this.guardMultipleDecision();
 }
 guardMultipleDecision(){
  const q=this.pending;if(!(this.multipleContext||this.chainContext||this.bombContext)||!q||q.multipleGuard||!["custom","pushChoice"].includes(q.type))return;
  q.multipleGuard=true;const resolve=q.resolve;
  q.resolve=value=>{if(this.pending!==q||!q.options.includes(value))return false;const result=resolve(value);this.guardMultipleDecision();return result;};
 }
 scheduleInjury(entry,done){
  const c=this.multipleContext?.stage==="effects"?this.multipleContext:this.bombContext?.stage==="blast"?this.bombContext:null;if(c){c.injuries.push(entry);done();return;}
  super.scheduleInjury(entry,done);
 }
 multipleMedical(){this.resolveMedicalGroups(this.multipleContext,()=>this.finishMultiple());}
 resolveMedicalGroups(c,done){
  let teamIndex=0;
  const group=()=>{
   if(teamIndex===2){done();return;}
   const team=teamIndex++===0?1-c.attacker.team:c.attacker.team,entries=c.injuries.filter(e=>e.p.team===team);let i=0;
   const regen=()=>{if(i===entries.length){i=0;retry();return;}entries[i++].regenerate(regen);};
   const retry=()=>{if(i===entries.length){treat();return;}const entry=entries[i++];if(entry.retryRegeneration)entry.retryRegeneration(retry);else retry();};
   const treat=()=>{
    const remaining=entries.filter(e=>!e.processed);if(!remaining.length){group();return;}
    const next=entry=>{entry.processed=true;entry.treat(treat);};
    const automatic=remaining.find(e=>!["casualty","knocked-out"].includes(e.record.medicalStatus)||e.record.treatment==="Saboteur");
    if(automatic){next(automatic);return;}
    if(remaining.length===1||!this.apothecaries[team]){next(remaining[0]);return;}
    const options=remaining.map(e=>"Resolve #"+e.p.number+" injury "+(c.injuries.indexOf(e)+1)+": "+(e.record.medicalStatus==="casualty"?e.record.selected.result:e.record.medicalStatus));
    this.skillChoice((this.bombContext===c?"Bomb":"Multiple Block")+" medical — choose injury to resolve",team,options,option=>next(remaining[options.indexOf(option)]));
   };regen();
  };group();
 }
 finishMultiple(){
  const c=this.multipleContext;if(!c)return;
  // One successful cure must not overwrite a second untreated injury.
  const rank=e=>e.record.status==="casualty"?(e.record.selected.result==="Dead"?6:e.record.selected.result==="Badly hurt"?4:5):({"knocked-out":3,stunned:2,prone:1,reserve:0}[e.record.status]??0);
  for(const p of new Set(c.injuries.map(e=>e.p))){
   const entries=c.injuries.filter(e=>e.p===p&&e.record.status),worst=entries.reduce((a,b)=>!a||rank(b)>rank(a)?b:a,null);
   if(!worst)continue;p.status=worst.record.status;p.casualties=entries.filter(e=>e.record.status==="casualty").map(e=>e.record.selected);p.casualty=p.casualties.length?worst.record.selected:null;
   if(["casualty","knocked-out","reserve"].includes(p.status)){p.x=null;p.y=null;}else Object.assign(p,worst.origin);
   if(worst.record.source)p.casualtySource={...worst.record.source};
  }
  this.multipleContext=null;this.blockAction=null;this.attackRoller=null;this.mover=null;this.action=null;
  const finish=()=>{this.scoreDeferrals--;this.syncLeader();this.note("Multiple Block action resolved.");const complete=()=>{this.checkScore();if(!this.finished&&c.turnover)this.endTurn(true);else this.checkStalling?.(c.attacker);};if(c.attacker.bloodlust)this.feed(c.attacker,complete,{allow:!c.turnover});else complete();};
  if(c.ball){const {kind,x,y}=c.ball;if(kind==="throwIn")super.throwIn(x,y,finish);else super.bounce(x,y,finish);}else finish();
 }
 multipleEndTurn(turnover){
  const c=this.multipleContext;if(!c)return false;
  if(!turnover||this.pending)return true;
  c.turnover=true;if(c.stage==="effects")this.finishBlock();else if(c.stage!=="medical")this.finishMultiple();return true;
 }
 bounce(x,y,done){const c=this.multipleContext?.stage==="effects"?this.multipleContext:this.bombContext?.stage==="blast"?this.bombContext:null;if(c){c.ball||={kind:"bounce",x,y};done();return;}super.bounce(x,y,done);}
 throwIn(x,y,done){const c=this.multipleContext;if(c?.stage==="effects"){c.ball||={kind:"throwIn",x,y};done();return;}super.throwIn(x,y,done);}
 raisePlaguePlayer(victim,source,done){
  const attacker=this.players.find(p=>p.id===source?.playerId),team=attacker?.team;
  if(!attacker||attacker.team===victim.team||!this.has(attacker,"Plague Ridden")||this.plagueUsed[team]||["Decay","Regeneration","Stunty"].some(s=>this.has(victim,s))||this.keywords(victim).includes("big guy")){done();return;}
  const roles=this.teams[team].positions.map((profile,role)=>({profile,role})).filter(({profile})=>profile.traits.split(",").some(k=>k.trim().toLowerCase()==="lineman")&&!/star|irregular|infamous staff/i.test(profile.traits));
  const create=({profile,role})=>{
   const number=Math.max(...this.players.filter(p=>p.team===team).map(p=>p.number))+1;this.plagueUsed[team]=true;
   this.players.push({id:team+"-"+number,number,team,role,x:null,y:null,status:"reserve",used:false,spent:0,raisedFrom:victim.id});
   this.note("Plague Ridden: #"+number+" "+profile.name+" joins "+this.teams[team].name+" in reserves.");done();
  };
  if(!roles.length){done();return;}if(roles.length===1){create(roles[0]);return;}
  const options=roles.map(({profile,role})=>"Raise "+profile.name+" ("+role+")");
  this.treatmentChoice("Plague Ridden lineman",attacker,options,choice=>create(roles[options.indexOf(choice)]));
 }
 // A separate declaration allowance: throwing a player does not consume the Pass.
 canThrowTeamMate(p){return !!(p&&!this.has(p,"Ball & Chain")&&this.canStart(p)&&this.has(p,"Throw Team-mate")&&!this.throwUsed?.[p.team]);}
 canKickTeamMate(p){return !!(p&&!this.has(p,"Ball & Chain")&&this.canStart(p)&&this.has(p,"Kick Team-mate")&&!this.kickUsed?.[p.team]);}
 throwActor(){const p=this.players.find(q=>q.id===this.mover);return ["throw-team-mate","kick-team-mate"].includes(this.action)&&!this.pending&&!this.finished&&!this.ballActionDone&&p?.status==="standing"&&!p.distracted?p:null;}
 throwCandidates(){const a=this.throwActor();return a?this.players.filter(p=>p.id!==a.id&&p.team===a.team&&this.onPitch(p)&&this.distance(a,p)===1&&this.has(p,"Right Stuff")&&!p.rooted&&!this.isChomped(p)&&["standing","prone","stunned"].includes(p.status)):[];}
 selectThrowMate(id){if(!this.throwCandidates().some(p=>p.id===id))return false;this.throwMate=id;return true;}
 throwPreview(x,y){const a=this.throwActor(),p=this.throwCandidates().find(q=>q.id===this.throwMate),range=a&&super.passRange(a,{x,y});if(!a||!p||!range||range.band>1)return null;return {...range,name:range.band?"Short Throw":"Quick Throw",target:parseInt(this.profile(a).pa)+range.band+this.marking(a)+this.disturbance(a)-(this.skill(a,"Strong Arm")?1:0),mate:p};}
 throwTeamMate(x,y){
  const preview=this.throwPreview(x,y);if(!preview)return false;const hungry=this.throwActor();if(hungry.bloodlust){this.feed(hungry,()=>this.throwTeamMate(x,y));return true;}
  const a=this.throwActor(),p=preview.mate,origin={x:p.x,y:p.y},unable=p.status!=="standing"||p.distracted,kicked=this.action==="kick-team-mate";
  this.ballActionDone=true;this.throwMate=null;
  const end=turnover=>{const complete=()=>{this.mover=null;this.action=null;if(turnover)this.endTurn(true);else this.checkScore();};if(a.bloodlust)this.feed(a,complete,{allow:!turnover});else complete();};
  const airborne=()=>{p.x=null;p.y=null;this.refreshChomps();};
  const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const drift=(pos,label)=>{const [dx,dy]=dirs[this.roll(label,8)-1];return {x:pos.x+dx,y:pos.y+dy};};
  let forcedTurnover=false,usingSwoop=false,superbThrow=false;
  const crowd=(from,to)=>{p.x=from.x;p.y=from.y;this.pushPlayer(p,to,()=>end(true));};
  const land=(pos,subpar,crashed=false,from=origin)=>{
   if(!this.inside(pos.x,pos.y)){crowd(from,pos);return;}
   const victim=this.at(pos.x,pos.y);
   if(victim){
    this.note("Thrown #"+p.number+" crashes into #"+victim.number+".");
    const resume=()=>land(drift(pos,"Collision bounce"),subpar,true,pos);
    this.fall(victim,{turnover:false,impactBy:victim.team!==p.team&&this.skill(p,"Lethal Flight")?p:null,prevented:resume,after:()=>{if(victim.team===this.active)forcedTurnover=true;resume();}});return;
   }
   p.x=pos.x;p.y=pos.y;if(this.ball.carrier===p.id){this.ball.x=p.x;this.ball.y=p.y;}
   const fail=()=>this.fall(p,{turnover:false,prevented:()=>ok(),after:()=>end(forcedTurnover||carrying)});
   const ok=(rolled=false)=>{if(rolled){this.recordStat(p,"landing");if(superbThrow)this.recordStat(a,"completion");}this.note("#"+p.number+" lands on their feet.");if(!this.ball.carrier&&this.ball.x===p.x&&this.ball.y===p.y)this.bounce(p.x,p.y,()=>end(forcedTurnover));else end(forcedTurnover);};
   if(unable||crashed){fail();return;}
   p.swooping=usingSwoop;this.test(p,"Landing",parseInt(this.profile(p).ag)+(subpar?1:0)+this.marking(p),()=>{p.swooping=false;ok(true);},()=>{p.swooping=false;fail();});
  };
  const carrying=this.ball.carrier===p.id;
  const fumble=()=>{
   if(kicked){this.note("Fumbled Kick Team-mate: injury without armour.");p.x=origin.x;p.y=origin.y;this.injuryResult(p,this.roll("Kicked player Injury")+this.roll("Kicked player Injury"),()=>{if(carrying){this.ball={...origin,carrier:null};this.bounce(origin.x,origin.y,()=>end(true));}else end(false);},{stunIsKo:true,stunty:false});return;}
   this.note("Fumbled Throw: bounce from the throwing player.");airborne();land(drift(a,"Fumbled player bounce"),true,false,a);
  };
  const resolve=n=>{
   const modifier=preview.target-parseInt(this.profile(a).pa);
   if(n===1||n!==6&&n-modifier===1){fumble();return;}
   const superb=this.success(n,preview.target);superbThrow=superb;this.note(superb?"Superb Throw.":"Subpar Throw.");
   const flight=skipScatter=>{airborne();let pos={x,y};
    if(!skipScatter&&this.skill(p,"Swoop")){
     this.skillChoice("Swoop",p.team,["North","East","South","West","Scatter normally"],choice=>{
      if(choice==="Scatter normally"){scatterFlight(pos,false);return;}
      usingSwoop=true;const fans={North:[[-1,-1],[0,-1],[1,-1]],East:[[1,-1],[1,0],[1,1]],South:[[1,1],[0,1],[-1,1]],West:[[-1,1],[-1,0],[-1,-1]]};
      this.rollChoice(p,"Swoop direction",6,n=>{const [dx,dy]=fans[choice][Math.ceil(n/2)-1];this.rollChoice(p,"Swoop distance",6,distance=>{for(let i=0;i<distance;i++){const from=pos;pos={x:pos.x+dx,y:pos.y+dy};if(!this.inside(pos.x,pos.y)){crowd(from,pos);return;}}land(pos,!superb);});});
     });return;
    }
    scatterFlight(pos,skipScatter);
   };
   const scatterFlight=(pos,skipScatter)=>{
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
 skillChoice(kind,team,options,resolve){
  const q={type:"custom",kind,team,options,resolve:choice=>{if(this.pending!==q||!options.includes(choice))return false;this.pending=null;resolve(choice);return true;}};this.pending=q;return q;
 }
 rollChoice(p,kind,sides,done,skill=null){
  const n=this.roll(kind,sides),options=["Keep "+n];if(this.canTeamReroll(p))options.push("Team re-roll");if(this.skill(p,"Pro")&&!p.proUsed)options.push("Pro");
  if(skill&&this.skill(p,skill)&&!this.used(p,kind+" "+skill))options.push(skill);
  if(options.length===1){done(n);return;}
  this.skillChoice(kind,p.team,options,choice=>{if(choice===skill){this.use(p,kind+" "+skill);done(this.roll(kind+" re-roll ("+skill+")",sides));}else if(choice==="Team re-roll")done(this.useTeamReroll(p)?this.roll(kind+" re-roll",sides):n);else if(choice==="Pro")this.attemptPro(p,()=>done(this.roll(kind+" re-roll",sides)),()=>done(n));else done(n);});
 }
 profile(p){const base=super.profile(p),skills=[...new Set([...base.skills,...(p.extraSkills||[])])].filter(s=>!(p.disabledSkills||[]).includes(s));return {...base,st:+(p.blockST??base.st)+(p.hornsBonus||0),skills};}
 skill(p,name){return !!p&&Number.isInteger(p.team)&&Number.isInteger(p.role)&&this.has(p,name)&&(p.status==="standing"&&!p.distracted||["Jump Up"].includes(name));}
 has(p,name){const b=this.blockAction;if(b&&p.id===b.target.id&&b.blitz&&["Fend","Stand Firm","Wrestle"].includes(name)&&super.has(b.attacker,"Juggernaut"))return false;return super.has(p,name);}
 parameter(p,name){return this.profile(p).skills.find(s=>s.startsWith(name+" ("));}
 keywords(p){return this.profile(p).traits.split(",").map(s=>s.trim().toLowerCase());}
 toggleSkill(id,name){const p=this.players.find(q=>q.id===id),entry=SKILL_CATALOG.find(s=>s.name===name||name.startsWith(s.name.split(" (")[0]+" ("));if(!p||!entry||entry.mandatory||this.pending)return false;p.disabledSkills||=[];p.disabledSkills=p.disabledSkills.includes(name)?p.disabledSkills.filter(s=>s!==name):p.disabledSkills.concat(name);return true;}
 addSkill(id,name){const p=this.players.find(q=>q.id===id),entry=SKILL_CATALOG.find(s=>s.name===name||s.name.includes("(X")&&name.startsWith(s.name.split(" (")[0]+" ("));if(!this.lab||!p||!entry||entry.status==="Deferred"||name.includes("(X"))return false;
  const conflicts={Frenzy:["Grab","Hit and Run"],"Hit and Run":["Frenzy"],Grab:["Frenzy"],Leap:["Pogo"],Pogo:["Leap"]},owned=[...super.profile(p).skills,...(p.extraSkills||[])];const chainConflicts=["Diving Tackle","Defensive","Frenzy","Grab","Hit and Run","Leap","Multiple Block","On the Ball","Shadowing","Steady Footing"];if(name==="Ball & Chain"&&chainConflicts.some(s=>owned.includes(s))||owned.includes("Ball & Chain")&&chainConflicts.includes(name))return false;if((conflicts[name]||[]).some(s=>owned.includes(s))||["Bullseye","Strong Arm"].includes(name)&&!owned.includes("Throw Team-mate")||name==="Lethal Flight"&&!owned.includes("Right Stuff")||name==="Saboteur"&&!owned.includes("Secret Weapon"))return false;p.extraSkills=[...new Set([...(p.extraSkills||[]),name])];return true;}
 used(p,name){return p.skillUses?.[name]===this.skillTurn;}
 use(p,name){p.skillUses||={};p.skillUses[name]=this.skillTurn;this.note("#"+p.number+" uses "+name+".");}
 resetSkillTurn(){this.skillTurn++;this.bombUsed||=[false,false];this.bombUsed[this.active]=false;for(const p of this.players)if(p.team===this.active){p.bloodlust=false;p.bloodlustChecked=false;}this.shadowingCounts={};this.throwUsed||=[false,false];this.throwUsed[this.active]=false;this.kickUsed||=[false,false];this.kickUsed[this.active]=false;this.puntUsed||=[false,false];this.puntUsed[this.active]=false;this.throwMate=null;}
 rushLimit(p){return this.skill(p,"Sprint")?3:2;}
 standCost(p){return this.has(p,"Jump Up")?0:super.standCost(p);}
 stand(p,after=null){if(this.has(p,"Jump Up")){p.status="standing";p.spent=0;this.note("Jump Up: stands for free.");if(after)after();return;}super.stand(p,after);}
 canSecure(p){return !!p&&!this.has(p,"Ball & Chain")&&!this.has(p,"Unsteady")&&!this.has(p,"No Ball")&&super.canSecure(p);}
 canBallAction(p,kind){return !!p&&!this.has(p,"Ball & Chain")&&!this.has(p,"My Ball")&&super.canBallAction(p,kind);}
 canBlock(a,d){if(typeof a==="string")a=this.players.find(p=>p.id===a);if(typeof d==="string")d=this.players.find(p=>p.id===d);if(a&&this.has(a,"Ball & Chain"))return false;return super.canBlock(a,d)||!!(this.canStart(a)&&a.status==="prone"&&this.has(a,"Jump Up")&&d&&d.team!==a.team&&d.status==="standing"&&this.onPitch(d)&&this.distance(a,d)===1);}
 activationExtra(p,action,ready,failed){
  const complete=()=>this.bloodlustActivation(p,action,()=>{ready();if(this.has(p,"Ball & Chain"))this.offerChain();else if(action==="bomb"&&this.action==="bomb"&&!this.pending)this.beginBomb(p);});
  const root=()=>{if(this.has(p,"Take Root")&&p.status==="standing"&&!p.rooted)this.test(p,"Take Root",2,complete,()=>{p.rooted=true;this.note("#"+p.number+" is Rooted.");complete();});else complete();};
  const fury=()=>{if(this.has(p,"Unchannelled Fury"))this.test(p,"Unchannelled Fury",["block","blitz"].includes(action)?2:4,root,()=>{this.mover=null;this.action=null;this.note("Unchannelled Fury ends the activation.");this.blockActivationFailed();});else root();};
  if(!this.has(p,"Animal Savagery")){fury();return;}
  this.test(p,"Animal Savagery",["block","blitz"].includes(action)?2:4,fury,()=>{
   const targets=this.players.filter(q=>q.id!==p.id&&q.team===p.team&&this.onPitch(q)&&q.status==="standing"&&this.distance(p,q)===1);
   if(!targets.length){failed();return;}
   const lash=q=>{const carrier=this.ball.carrier===q.id;this.fall(q,{turnover:carrier,savageryBy:p,prevented:fury,after:fury});};
   if(targets.length===1)lash(targets[0]);else this.skillChoice("Animal Savagery — choose a team-mate",p.team,targets.map(q=>"#"+q.number+" ("+q.id+")"),choice=>lash(targets.find(q=>choice.includes("("+q.id+")"))));
  });
 }
 start(id,action="move"){
  this.refreshChomps();
  if(action==="special:Punt")action="punt";if(action==="special:Throw Bomb")action="bomb";
  const p=this.players.find(q=>q.id===id);if(!this.canStart(p))return false;if(this.has(p,"Ball & Chain")&&(action!=="move"||p.status!=="standing"))return false;if(action==="bomb"){if(!this.canBomb(p))return false;this.bombUsed||=[false,false];this.bombUsed[p.team]=true;}p.bloodlustChecked=false;p.bloodlust=false;if(action==="foul"&&this.foulUsed[this.active])return false;
  if(action==="throw-team-mate"){if(!this.canThrowTeamMate(p))return false;this.throwUsed||=[false,false];this.throwUsed[p.team]=true;this.throwMate=null;this.note("#"+p.number+" declares Throw Team-mate.");}
  if(action==="kick-team-mate"){if(!this.canKickTeamMate(p))return false;this.kickUsed||=[false,false];this.kickUsed[p.team]=true;this.throwMate=null;this.note("#"+p.number+" declares Kick Team-mate.");}
  if(action==="punt"){if(!this.canPunt(p))return false;this.puntUsed||=[false,false];this.puntUsed[p.team]=true;}
  if(p.rooted&&["move","blitz"].includes(action))return false;
  if(action.startsWith("special:")){const name=action.slice(8);if(!this.skill(p,name==="Chomp"?"Monstrous Mouth":name)&&!(p.status==="prone"&&name==="Hypnotic Gaze"&&this.has(p,name)))return false;}
  if(action==="foul")this.foulUsed[this.active]=true;p.specialDone=false;
  p.gouged=false;this.preactivation={p,action};return super.start(id,action);
 }
 // Block declarations retain the base activation-trait order, including prone Jump Up declarations.
 block(a,d){this.refreshChomps();const p=this.players.find(q=>q.id===a);if(!this.canBlock(p,d))return false;p.bloodlustChecked=false;p.bloodlust=false;p.gouged=false;
  return super.block(a,d);
 }
 options(p,kind){let result=super.options(p,kind);if(this.bombContext?.catchTest===p.id)result=result.filter(s=>s!=="Catch"&&s!=="Monstrous Mouth");if(kind==="Dodge"&&this.departureMarkers(p).some(q=>this.skill(q,"Tackle")))result=result.filter(s=>s!=="Dodge");
  if(kind==="Rush"&&this.skill(p,"Sure Feet")&&!this.used(p,"Sure Feet"))result.push("Sure Feet");if(kind==="Pick up"&&this.skill(p,"Sure Hands"))result.push("Sure Hands");
  if(kind==="Landing"&&p.swooping&&this.skill(p,"Swoop")&&!this.used(p,"Swoop landing"))result.push("Swoop");
  if((this.mover===p.id||this.attackRoller===p.id||this.blockAction?.attacker.id===p.id)&&this.skill(p,"Pro")&&!p.proUsed&&!result.includes("Pro"))result.push("Pro");if(this.canTeamReroll(p)&&!result.includes("Team"))result.push("Team");if(this.dumpContext||this.moveContext)result=result.filter(s=>s!=="Pro");return result;
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
  if(["Catch","Pick up","Secure the Ball","Intercept"].includes(kind)&&(this.has(p,"No Ball")||this.has(p,"Ball & Chain"))){no(1);return;}
  this.resolveSkillTest(p,kind,this.checkTarget(p,kind,target),yes,no);
 }
 departureTest(p,plan,origin,kind,target,yes,no){
  const candidates=kind==="Jump"&&this.skill(p,"Pogo")?[]:this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&this.distance(q,origin)===1&&this.distance(q,plan)>1&&this.skill(q,"Diving Tackle")&&!q.rooted);
  const penalty=kind==="Jump"?this.jumpTarget(p,origin.x,origin.y,plan.x,plan.y,2)-target:2;
  this.resolveSkillTest(p,kind,this.checkTarget(p,kind,target),yes,no,{plan,candidates,penalty});
 }
 resolveSkillTest(p,kind,target,yes,no,departure=null){
  const tacklers=departure?.candidates||[];
  const penalty=departure?.penalty||2;
  const finish=(n,bonus=0)=>{
   if(!this.success(n,target-bonus)){no(n);return;}
   if(!tacklers.length){yes(n);return;}
   this.interrupt("Diving Tackle",done=>this.reactionChoice("Diving Tackle"+(this.success(n,target+penalty-bonus)?" (will not trip)":" (will trip)"),1-p.team,tacklers,q=>done(q)),q=>{
    departure.plan.divingTackler=q;
    if(q&&!this.success(n,target+penalty-bonus))no(n);else yes(n);
   });
  };
  // Like FFB's modifier-choice step, keep the failed roll suspended until the coach decides.
  // A modifier can still rescue the re-rolled die, but never opens another re-roll window.
  const resolve=(n,mayReroll)=>{
   const lookAhead=this.success(n,target)&&tacklers.length&&!this.success(n,target+penalty);
   if(this.success(n,target)&&!lookAhead){finish(n);return;}
   const bonus=+this.profile(p).st<=3?1:+this.profile(p).st===4?2:3;
   const breakTackle=kind==="Dodge"&&this.skill(p,"Break Tackle")&&!this.used(p,"Break Tackle")&&this.success(n,target+(tacklers.length?penalty:0)-bonus);
   const options=mayReroll?this.options(p,kind):[];if(breakTackle)options.unshift("Break Tackle");
   if(!options.length){finish(n);return;}
   const q={p,kind,target,roll:n,options,lookAhead,resolved:false};
   const settle=fn=>(...args)=>{if(q.resolved||this.pending&&this.pending!==q)return false;q.resolved=true;if(this.pending===q)this.pending=null;fn(...args);return true;};
   q.resolve=settle(value=>resolve(value,false));q.accept=settle(()=>finish(n));q.useModifier=settle(()=>{this.use(p,"Break Tackle");finish(n,bonus);});this.pending=q;
   this.note(lookAhead?"Diving Tackle may make this "+kind+" fail. Choose modifiers or a re-roll before the defender decides.":kind+" failed. Choose a modifier, re-roll or accept the result.");
  };
  resolve(this.roll(kind+" #"+p.number+" needs "+Math.min(6,Math.max(2,target))+"+"),true);
 }
 decide(option){const q=this.pending;if(q&&option==="Break Tackle"&&q.options?.includes(option)&&q.useModifier){this.pending=null;q.useModifier();return true;}if(q&&["Sure Feet","Sure Hands","Swoop"].includes(option)){if(!q.options.includes(option))return false;this.pending=null;this.use(q.p,option==="Swoop"?"Swoop landing":option);q.resolve(this.roll(q.kind+" re-roll ("+option+")"));return true;}return super.decide(option);}
 leaderOnPitch(team){return this.players.some(p=>p.team===team&&this.onPitch(p)&&this.has(p,"Leader"));}
 grantLeader(half){for(const t of [0,1])if(this.leaderHalf[t]!==half){this.leaderHalf[t]=half;if(this.leaderOnPitch(t)){this.leaderPool[t]=true;this.note("Leader: one additional re-roll for this half.");}}}
 syncLeader(){for(const t of [0,1])if(!this.leaderOnPitch(t))this.leaderPool[t]=false;}
 rerollsAvailable(team){return this.rerolls[team]+(this.leaderPool[team]&&this.leaderOnPitch(team)?1:0);}
 spendLeader(team){if(!this.driveBonus?.[team]&&this.leaderPool[team]&&this.leaderOnPitch(team)){this.leaderPool[team]=false;this.rerolls[team]++;this.note("Leader re-roll used.");}}
 canTeamReroll(p){if(this.dumpContext&&!this.moveContext||this.moveContext&&(!this.dumpContext||this.moveContext.ownHalf!==null))return false;return p.team===this.active&&this.rerollsAvailable(p.team)>0&&(!this.match||this.phase==="play");}
 useTeamReroll(p){if(!this.canTeamReroll(p))return false;this.spendLeader(p.team);return super.useTeamReroll(p);}
 disturbance(p){return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&this.has(q,"Disturbing Presence")&&this.distance(q,p)<=3).length;}
 jumpTarget(p,fx,fy,x,y,diving=0){
  const pogo=this.skill(p,"Pogo"),marks=pogo?0:Math.max(this.marking(p,fx,fy),this.marking(p,x,y));
  const tail=!pogo&&this.players.some(q=>q.team!==p.team&&this.onPitch(q)&&this.distance(q,{x:fx,y:fy})===1&&this.skill(q,"Prehensile Tail"))?1:0;
  const legs=this.skill(p,"Very Long Legs")?1:0,dt=pogo?0:diving;
  let sum=marks+tail-legs+dt;const count=Number(marks>0)+tail+legs+Number(dt>0);
  if(this.skill(p,"Leap")&&(sum>1||sum>0&&count>1))sum--;
  return parseInt(this.profile(p).ag)+sum;
 }
 planFrom(p,x,y,fx,fy,spent){
  if(this.has(p,"Ball & Chain")||this.action==="bomb"&&this.mover===p.id)return null;
  if(p?.rooted||p&&this.isChomped(p)||this.action?.startsWith("special:")&&this.action!=="special:Hypnotic Gaze")return null;let plan=super.planFrom(p,x,y,fx,fy,spent);const jump=Math.max(Math.abs(x-fx),Math.abs(y-fy))===2,leap=this.skill(p,"Leap"),pogo=this.skill(p,"Pogo");
  const ma=this.movementAllowance(p);
  if(!plan&&jump&&(leap||pogo)&&!this.pending&&!this.finished&&this.inside(x,y)&&!this.at(x,y)&&spent+2<=ma+this.rushLimit(p)){
   plan={x,y,cost:2,jump:true,rushes:Math.max(0,spent+2-ma)-Math.max(0,spent-ma),dodge:false,target:parseInt(this.profile(p).ag)+Math.max(this.marking(p,fx,fy),this.marking(p,x,y)),pickup:!this.ball.carrier&&this.ball.x===x&&this.ball.y===y};
  }
  if(!plan)return null;
  const fromMarkers=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x:fx,y:fy})===1);
  if(plan.jump)plan.target=this.jumpTarget(p,fx,fy,x,y);
  if(plan.dodge){if(this.skill(p,"Two Heads"))plan.target--;if(this.has(p,"Titchy"))plan.target--;if(!this.has(p,"Stunty"))plan.target-=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,{x,y})===1&&this.has(q,"Titchy")).length;}
  if(plan.dodge&&!pogo&&fromMarkers.some(q=>this.skill(q,"Prehensile Tail")))plan.target++;
  if((plan.jump||plan.dodge)&&!(plan.jump&&pogo)&&fromMarkers.some(q=>this.skill(q,"Diving Tackle")&&!q.rooted&&this.distance(q,{x,y})>1))plan.divingTackleTarget=plan.jump?this.jumpTarget(p,fx,fy,x,y,2):plan.target+2;
  return plan;
 }
 step(x,y){
  const actor=this.players.find(p=>p.id===this.mover);if(actor&&(this.has(actor,"Ball & Chain")||this.action==="bomb"))return false;
  const plan=this.plan(x,y);if(!plan)return false;
  const p=this.players.find(q=>q.id===this.mover);this.departureOrigin={x:p.x,y:p.y};
  return super.step(x,y);
 }
 beforeMovement(p,plan,origin){
  if(p.dropOnExit&&this.skill(p,"Fumblerooski")&&!this.has(p,"My Ball")&&this.ball.carrier===p.id){plan.fumblerooskiDropped=true;this.ball={x:origin.x,y:origin.y,carrier:null};p.dropOnExit=false;this.note("Fumblerooski: ball left on the ground without turnover.");}
 }
 beforeDepartureTests(p,plan,origin,proceed){
  const holders=(plan.dodge||plan.jump)?this.departureMarkers(p).filter(q=>this.skill(q,"Tentacles")):[];
  if(!holders.length){proceed();return;}
  this.interrupt("Tentacles",done=>this.reactionChoice("Tentacles",1-p.team,holders,holder=>{
   if(!holder){done(false);return;}
   // BB2025 TentaclesBehaviour: defender rolls; neither an opposing team
   // re-roll nor Pro (restricted to the acting player) is available here.
   const target=Math.max(2,6-Number(this.profile(holder).st)+Number(this.profile(p).st));
   done(this.success(this.roll("Tentacles #"+holder.number+" needs "+Math.min(6,target)+"+"),target));
  }),held=>{
   if(held){p.x=origin.x;p.y=origin.y;if(plan.fumblerooskiDropped&&!this.ball.carrier&&this.ball.x===p.x&&this.ball.y===p.y){this.ball.carrier=p.id;p.dropOnExit=true;}if(this.ball.carrier===p.id){this.ball.x=p.x;this.ball.y=p.y;}this.note("Tentacles: #"+p.number+" is held in place; activation ends.");this.mover=null;this.action=null;if(this.moveContext)this.finishBoundedMove(false);}
   else proceed();
  });return true;
 }
 movementOutcome(p,plan,origin,failure,done){
  this.refreshChomps();
  // Capture departure eligibility before Shadowing can relocate a defender.
  const markers=this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,origin)===1);
  const arms=failure&&["Dodge","Jump"].includes(failure.kind)?markers.filter(q=>this.skill(q,"Arm Bar")):[];
  const shadow=armBarBy=>{
   const context={armBarBy};
   const candidates=plan.dodge&&!plan.divingTackler&&!this.at(origin.x,origin.y)?markers.filter(q=>this.skill(q,"Shadowing")&&!q.rooted&&(this.shadowingCounts?.[q.id]||0)<Number(this.profile(q).ma)):[];
   if(!candidates.length){done(context);return;}
   this.interrupt("Shadowing",finish=>this.reactionChoice("Shadowing",1-p.team,candidates,q=>{
    if(q){this.shadowingCounts||={};this.shadowingCounts[q.id]=(this.shadowingCounts[q.id]||0)+1;
     if(this.roll("Shadowing #"+q.number+" needs 4+")>=4){q.x=origin.x;q.y=origin.y;this.note("#"+q.number+" shadows into the vacated square.");if(this.ball.carrier===q.id){this.ball.x=q.x;this.ball.y=q.y;}}
    }
    finish();
   }),()=>done(context));
  };
  const placeTackler=armBarBy=>{
   const q=plan.divingTackler;if(!q){shadow(armBarBy);return;}
   q.x=origin.x;q.y=origin.y;this.note("#"+q.number+" uses Diving Tackle.");
   // FFB StepDropDivingTackler uses dropPlayer's ineligible-for-placement overload.
   this.placeProne(q,()=>shadow(armBarBy),{allowPlacement:false});
  };
  if(!arms.length){placeTackler(null);return;}
  this.interrupt("Arm Bar",finish=>this.reactionChoice("Arm Bar",1-p.team,arms,q=>finish(q)),placeTackler);
 }
 dropBall(){const p=this.players.find(q=>q.id===this.mover);if(!p||this.pending||this.ball.carrier!==p.id||!this.skill(p,"Fumblerooski")||this.has(p,"My Ball"))return false;p.dropOnExit=!p.dropOnExit;return true;}
 passPreview(x,y){if(this.action==="bomb")return this.bombPreview(x,y);const value=super.passPreview(x,y),p=this.players.find(q=>q.id===this.mover);if(!value)return null;value.target+=this.disturbance(p);if(this.skill(p,"Nerves of Steel"))value.target-=this.marking(p);if(value.band<2&&this.skill(p,"Accurate")||value.band>=2&&this.skill(p,"Cannoneer"))value.target--;return value;}
 passRange(from,to){const normal=super.passRange(from,to);if(this.dumpContext?.defender===from.id)return normal;const hail=this.skill(from,"Hail Mary Pass")&&this.inside(to.x,to.y)&&(from.x!==to.x||from.y!==to.y);return hail&&(from.hailMary||!normal)?{band:3,name:"Hail Mary Pass",hail:true}:normal;}
 interceptionCandidates(from,to){if(this.passContext?.preview.hail&&this.passContext.p.id===from.id)return [];const candidates=super.interceptionCandidates(from,to).filter(p=>!this.has(p,"No Ball"));return this.skill(from,"Cloud Burster")?candidates.filter(p=>this.skill(p,"Very Long Legs")):candidates;}
 pass(x,y){if(this.action==="bomb")return this.throwBomb(x,y);const p=this.ballActor("pass");if(!p)return false;
  if(p.bloodlust){this.feed(p,()=>this.pass(x,y));return true;}return this.animosity(p,this.at(x,y),()=>super.pass(x,y));
 }
 feedingTurnover(){if(this.bombContext){this.bombContext.turnover=true;this.finishBomb({allowFeed:false});}else this.endTurn(true);}
 handoff(id){const p=this.ballActor("handoff"),target=this.players.find(q=>q.id===id);if(!this.canHandoff(target))return false;if(p.bloodlust){this.feed(p,()=>{if(this.canHandoff(target))this.handoff(id);else this.finish();});return true;}return this.animosity(p,target,()=>super.handoff(id));}
 animosity(p,target,act,onFailure=null){const trait=this.parameter(p,"Animosity");if(!trait||!target||target.team!==p.team)return act();const word=trait.slice(trait.indexOf("(")+1,-1).toLowerCase();if(word!=="all"&&!this.keywords(target).includes(word))return act();this.test(p,"Animosity",2,act,()=>{this.note("Animosity: player refuses the transfer.");if(onFailure)onFailure();else{this.mover=null;this.action=null;}});return true;}
 armourBroken(p,n,bonus=0,by=null){if(this.has(p,"Iron Hard Skin"))return n>=parseInt(this.profile(p).av);if(by&&this.has(by,"Claws")&&n>=8)return true;return n+bonus+(this.has(p,"Chainsaw")?3:0)>=parseInt(this.profile(p).av);}
 canMighty(by,p){return by&&!by.distracted&&this.has(by,"Mighty Blow");}
 canMightyArmour(by,p){return !this.has(p,"Iron Hard Skin")&&this.canMighty(by,p);}
 assists(a,d){
  if(this.has(a,"Ball & Chain")||this.has(d,"Ball & Chain"))return {offensive:0,defensive:0};
  const guard=p=>this.skill(p,"Guard")&&!this.players.some(q=>q.team!==p.team&&q.team!==this.active&&this.onPitch(q)&&this.skill(q,"Defensive")&&this.distance(p,q)===1);
  const eligible=(p,target,excluded)=>p.id!==a.id&&p.id!==d.id&&!this.multipleContext?.targets.includes(p)&&this.onPitch(p)&&p.status==="standing"&&!p.distracted&&!p.gouged&&this.distance(p,target)===1&&(this.markedByExcept(p,[excluded.id])===0||guard(p));
  return {offensive:this.players.filter(p=>p.team===a.team&&eligible(p,d,d)).length,defensive:this.players.filter(p=>p.team===d.team&&eligible(p,a,a)).length};
 }
 rollBlock(a,d,blitz=false){
  if(this.multipleContext?.stage==="activation"){this.prepareMultiple();return;}
  if(a.status==="prone"&&this.has(a,"Jump Up")){this.mover=a.id;this.test(a,"Jump Up Block",Math.max(2,parseInt(this.profile(a).ag)-1),()=>{a.status="standing";this.mover=null;this.rollBlock(a,d,blitz);},()=>{this.mover=null;this.action=null;});return;}
  const round=this.nextFrenzyRound||1;this.nextFrenzyRound=null;this.attackRoller=a.id;
  const roll=()=>{super.rollBlock(a,d,blitz);this.blockAction.frenzyRound=round;this.attackRoller=null;a.blockST=null;a.hornsBonus=0;
   const hatred=this.parameter(a,"Hatred");if(hatred&&this.keywords(d).includes(hatred.slice(hatred.indexOf("(")+1,-1).toLowerCase())){const index=this.blockAction.dice.indexOf(1);if(index>=0){this.blockAction.poolLocked=true;this.blockAction.dice[index]=this.roll("Hatred Player Down re-roll");}}
  };
  const perform=()=>this.trickster(a,d,roll);
  const strength=()=>{a.hornsBonus=blitz&&this.skill(a,"Horns")?1:0;const own=+super.profile(a).st,other=+this.profile(d).st;
   if(this.skill(a,"Dauntless")&&own<other)this.test(a,"Dauntless",other-own+1,()=>{a.blockST=other;perform();},perform);else perform();};
  const react=()=>this.dumpOff(a,d,strength);
  if(this.has(d,"Foul Appearance"))this.test(a,"Foul Appearance",2,react,()=>{this.note("Foul Appearance cancels the attack and ends the activation.");this.mover=null;this.action=null;this.blockAction=null;this.attackRoller=null;});else react();
 }
 resolvePush(knock){const b=this.blockAction;b.pushResolved=true;if(b.target.rooted||this.isChomped(b.target)){if(knock)this.fall(b.target,{turnover:false,mightyBlowBy:b.attacker,after:()=>this.finishBlock()});else this.finishBlock();return;}super.resolvePush(knock);this.guardMultipleDecision();}
 pushSquares(a,d,grab=false){
  const allowed=squares=>this.multipleContext?squares.filter(pos=>!this.multipleContext.targetSquares.some(s=>s.x===pos.x&&s.y===pos.y)):squares;
  const b=this.blockAction;if(this.skill(d,"Sidestep")&&!(b&&d.team!==b.attacker.team&&this.skill(b.attacker,"Grab"))){const open=[];for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&this.inside(d.x+dx,d.y+dy)&&!this.at(d.x+dx,d.y+dy))open.push({x:d.x+dx,y:d.y+dy});const valid=allowed(open);if(valid.length)return valid;}
  if(!this.multipleContext)return super.pushSquares(a,d,grab);
  // Exclude reserved squares before choosing free squares over chain pushes.
  if(grab){const open=allowed(this.adjacentEmpty(d));if(open.length)return open;}
  const dx=Math.sign(d.x-a.x),dy=Math.sign(d.y-a.y),coords=!dy?[-1,0,1].map(y=>({x:d.x+dx,y:d.y+y})):!dx?[-1,0,1].map(x=>({x:d.x+x,y:d.y+dy})):[{x:d.x+dx,y:d.y+dy},{x:d.x+dx,y:d.y},{x:d.x,y:d.y+dy}];
  const valid=allowed(coords),open=valid.filter(pos=>this.inside(pos.x,pos.y)&&!this.at(pos.x,pos.y));return open.length?open:valid;
 }
 pushPlayer(p,pos,done,depth=0){if(p.rooted||this.isChomped(p)){done(false);return;}super.pushPlayer(p,pos,done,depth);}
 placePushed(p,pos,done){const b=this.blockAction;if(b&&p.id===b.target.id&&this.skill(b.attacker,"Eye Gouge"))p.gouged=true;super.placePushed(p,pos,ok=>{this.refreshChomps();done(ok);});}
 afterPush(origin,knock,pushed){const b=this.blockAction;
  if(this.chainContext){
   const c=this.chainContext,a=b.attacker,d=b.target;
   if(pushed){a.x=origin.x;a.y=origin.y;this.note("Ball & Chain follows up.");}
   this.afterFollow(a,d,knock,()=>{
    if(c.ground&&this.onPitch(d)){
     const old=d.status;this.armourOnly(d,()=>{if(d.status==="standing"||d.status==="prone")d.status=old;this.finishBlock();},{source:{playerId:a.id,cause:"Ball & Chain collision"}});
    }else if(knock&&this.onPitch(d))this.fall(d,{turnover:false,mightyBlowBy:a,after:()=>this.finishBlock()});else this.finishBlock();
   });return;
  }
  super.afterPush(origin,knock,pushed);const q=this.pending;if(!b||!q||q.kind!=="Follow-up")return;
  if(this.multipleContext){q.resolve("Stay");return;}
  if(b.attacker.rooted||this.isChomped(b.attacker)){q.resolve("Stay");return;}
  if(this.skill(b.attacker,"Frenzy")){q.resolve("Follow up");return;}
  if(this.skill(b.target,"Taunt")){q.options.push("Defender uses Taunt");const old=q.resolve;q.resolve=option=>old(option==="Defender uses Taunt"?"Follow up":option);}
 }
 afterFollow(a,d,knock,done){if(this.ball.carrier===d.id&&this.skill(a,"Strip Ball")&&!this.skill(d,"Sure Hands")&&!this.skill(d,"Monstrous Mouth")){this.ball={x:d.x,y:d.y,carrier:null};this.note("Strip Ball: ball drops after follow-up.");this.bounce(d.x,d.y,done);}else done();}
 applyBlockResult(result){const b=this.blockAction;if(result==="Both Down"&&b.blitz&&this.skill(b.attacker,"Juggernaut")){this.pending={type:"custom",kind:"Juggernaut",options:["Treat as Push Back","Apply Both Down"],resolve:choice=>{this.pending=null;super.applyBlockResult(choice==="Treat as Push Back"?"Push Back":"Both Down");}};return;}super.applyBlockResult(result);}
 finishBlock(){
  const b=this.blockAction;
  if(this.chainContext){
   const c=this.chainContext,a=c.attacker;
   if(b?.targetKnocked&&c.target.team===a.team&&!c.ground)b.turnover=true;
   if(c.target.team===a.team&&c.carrierBefore===c.target.id&&this.ball.carrier!==c.target.id)b.turnover=true;
   if(c.rushFailed){this.chainContext=null;this.blockAction=null;this.fall(a);return;}
   if(b?.turnover||a.status!=="standing"||!this.onPitch(a)){this.chainContext=null;this.blockAction=null;this.endTurn(true);return;}
   this.chainContext=null;this.blockAction=null;this.mover=a.id;this.action="move";this.offerChain();return;
  }
  if(this.multipleContext?.stage==="effects"){
   const c=this.multipleContext;c.turnover||=!!b?.turnover;
   c.index++;this.resolveMultipleNext();return;
  }
  if(b?.saboteurTriggered&&b.attacker.status!=="standing"&&!b.turnover){b.blitz=false;this.mover=null;}
  if(b&&!b.pileChecked){
   b.pileChecked=true;const a=b.attacker,d=b.target;
   if(!b.turnover&&b.targetKnocked&&this.skill(a,"Pile Driver")&&this.onPitch(d)&&["prone","stunned"].includes(d.status)&&this.distance(a,d)===1){
    this.skillChoice("Pile Driver",a.team,["Free foul","Finish Block"],choice=>{
     if(choice!=="Free foul"){this.finishBlock();return;}
     this.scoreDeferrals=(this.scoreDeferrals||0)+1;let completed=false;
     this.foul(a,d,{after:turnover=>{
      if(completed)return;completed=true;
      const carrying=this.ball.carrier===a.id,finish=()=>{this.scoreDeferrals--;this.blockAction=null;this.mover=null;this.action=null;this.checkScore();if(!this.finished&&(turnover||carrying))this.endTurn(true);};
      if(this.onPitch(a)&&a.status==="standing")this.placeProne(a,finish);else finish();
     }});
    });return;
   }
  }
  if(b&&!b.turnover&&!b.hitRunResolved){b.hitRunResolved=true;this.hitAndRun(b.attacker,()=>this.finishBlock());return;}
  if(b&&!b.turnover&&b.pushResolved&&b.frenzyRound===1&&this.skill(b.attacker,"Frenzy")&&b.target.status==="standing"&&this.onPitch(b.target)&&this.distance(b.attacker,b.target)===1){
   const a=b.attacker,d=b.target;if(!b.blitz||a.spent<this.profile(a).ma+this.rushLimit(a)){
    this.blockAction=null;this.nextFrenzyRound=2;const hit=()=>this.rollBlock(a,d,b.blitz);if(b.blitz){a.spent++;if(a.spent>this.profile(a).ma)this.test(a,"Rush",2,hit,()=>this.fall(a,{prevented:hit}));else hit();}else hit();return;
   }
  }if(b&&!b.blitz&&b.attacker.bloodlust){this.feed(b.attacker,()=>this.finishBlock());return;}super.finishBlock();
 }
 resolveBothDownChoice(choice){
  const b=this.blockAction,players=[b.attacker,b.target];
  if(choice.includes("Wrestle")&&players.some(p=>this.has(p,"Ball & Chain"))){
   const carrier=players.find(p=>this.ball.carrier===p.id);let i=0,turnover=false;
   const next=()=>{if(i===players.length){if(turnover)this.endTurn(true);else this.finishBlock();return;}this.placeProne(players[i++],next,{allowPlacement:false});};
   if(carrier)this.beforeProne(carrier,{x:carrier.x,y:carrier.y},placed=>{turnover=carrier.team===this.active&&!placed;next();});else next();return;
  }
  if(choice.includes("Wrestle")){b.attacker.rooted=false;b.target.rooted=false;}super.resolveBothDownChoice(choice);
 }
 specialActions(p){if(!p)return [];const result=[];if(this.has(p,"Ball & Chain"))return result;if(this.canBomb(p))result.push("Throw Bomb");if(this.canMultipleBlock(p))result.push("Multiple Block");if(this.skill(p,"Monstrous Mouth")&&(this.canStart(p)||this.action==="blitz"&&this.canBlitzBlock()))result.push("Chomp");if(this.canPunt(p))result.push("Punt");if(this.canStart(p)&&!this.foulUsed[this.active])result.push("Foul");for(const name of ["Stab","Projectile Vomit","Hypnotic Gaze","Breathe Fire","Chainsaw"])if(this.has(p,name)&&(p.status==="standing"||name==="Hypnotic Gaze")&&(this.canStart(p)||this.action==="blitz"&&this.canBlitzBlock()))result.push(name);return result;}
 specialTargets(){const p=this.players.find(q=>q.id===this.mover);if(!p||this.pending||p.specialDone)return [];if(this.action!=="foul"&&!this.action?.startsWith("special:"))return [];return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&this.distance(p,q)===1&&(this.action==="foul"?["prone","stunned"].includes(q.status):q.status==="standing"));}
 performSpecial(targetId,blitzName=null){
  const p=this.players.find(q=>q.id===this.mover),target=this.players.find(q=>q.id===targetId);if(!p||!target)return false;
  if(blitzName){if(!this.canBlitzBlock()||target.id!==this.blitzTarget||!this.skill(p,blitzName==="Chomp"?"Monstrous Mouth":blitzName)||!["Stab","Projectile Vomit","Breathe Fire","Chainsaw","Chomp"].includes(blitzName))return false;p.spent++;this.blitzBlocked=true;const run=()=>this.specialAttack(p,target,blitzName);if(p.spent>this.profile(p).ma)this.test(p,"Rush",2,run,()=>this.fall(p,{prevented:run}));else run();return true;}
  if(!this.specialTargets().includes(target))return false;p.specialDone=true;if(this.action==="foul")this.foul(p,target);else this.specialAttack(p,target,this.action.slice(8));return true;
 }
 specialAttack(p,target,name){
  const finish=()=>{const cleanup=()=>{if(p.bloodlust&&(name!=="Chomp"||this.action!=="blitz")){this.feed(p,cleanup);return;}if(name!=="Chomp"||this.action!=="blitz"){this.mover=null;this.action=null;}this.checkScore();};if(name==="Stab")this.hitAndRun(p,cleanup);else cleanup();},perform=()=>{
   if(name==="Chomp"){this.test(p,"Chomp",3,()=>{target.chompers=[...new Set([...(target.chompers||[]),p.id])];this.note("#"+target.number+" is Chomped.");finish();},finish);return;}
   if(name==="Hypnotic Gaze"){this.test(p,"Hypnotic Gaze",3,()=>{target.distracted=true;this.refreshChomps();finish();},finish);return;}
   const medical={source:{playerId:p.id,cause:name},plague:this.action==="blitz"};
   if(name==="Stab"){this.armourOnly(target,finish,medical);return;}
   if(name==="Projectile Vomit"){this.test(p,name,2,()=>this.armourOnly(target,finish,medical),()=>this.armourOnly(p,finish,medical));return;}
   if(name==="Chainsaw"){this.test(p,"Chainsaw kick-back",2,()=>this.armourOnly(target,finish,{...medical,bonus:this.has(target,"Iron Hard Skin")?0:3}),()=>this.fall(p,{prevented:finish}));return;}
   if(name==="Breathe Fire"){
    const penalty=+this.profile(target).st>=5?1:0;this.test(p,"Breathe Fire",4+penalty,n=>{
     if(n===6){this.fall(target,{turnover:false,after:finish,injurySource:medical.source,plagueEligible:medical.plague});return;}this.placeProne(target,finish);
    },n=>{if(n===1||n-penalty===1)this.fall(p,{prevented:finish});else finish();});
   }
  };
  const react=()=>this.dumpOff(p,target,()=>this.trickster(p,target,perform));
  if(this.has(target,"Foul Appearance"))this.test(p,"Foul Appearance",2,react,()=>{this.mover=null;this.action=null;});else react();
 }
 adjacentEmpty(p){const result=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&this.inside(p.x+dx,p.y+dy)&&!this.at(p.x+dx,p.y+dy))result.push({x:p.x+dx,y:p.y+dy});return result;}
 canPunt(p){return this.canStart(p)&&this.has(p,"Punt")&&!this.has(p,"My Ball")&&!this.has(p,"No Ball")&&!this.puntUsed?.[p.team];}
 puntActor(){const p=this.players.find(q=>q.id===this.mover);return this.action==="punt"&&!this.pending&&!this.ballActionDone&&!this.finished&&p?.status==="standing"&&!p.distracted&&this.ball.carrier===p.id?p:null;}
 punt(){
  const p=this.puntActor();if(!p)return false;if(p.bloodlust){this.feed(p,()=>this.punt());return true;}this.ballActionDone=true;
  const finish=out=>{if(this.finished)return;const carrier=this.players.find(q=>q.id===this.ball.carrier);this.mover=null;this.action=null;if(out||carrier&&carrier.team!==p.team)this.endTurn(true);else this.checkScore();};
  const fans={North:[[-1,-1],[0,-1],[1,-1]],East:[[1,-1],[1,0],[1,1]],South:[[1,1],[0,1],[-1,1]],West:[[-1,1],[-1,0],[-1,-1]]};
  this.skillChoice("Punt template",p.team,Object.keys(fans),choice=>this.rollChoice(p,"Punt direction",6,n=>{
   const [dx,dy]=fans[choice][Math.ceil(n/2)-1],origin={x:p.x,y:p.y};
   const crowd=pos=>{this.ball={...pos,carrier:null};this.throwIn(pos.x,pos.y,()=>finish(true));};
   if(!this.inside(p.x+dx,p.y+dy)){crowd(origin);return;}
   this.rollChoice(p,"Punt distance",6,distance=>{
    let pos=origin;for(let i=0;i<distance;i++){const next={x:pos.x+dx,y:pos.y+dy};if(!this.inside(next.x,next.y)){crowd(pos);return;}pos=next;}
    this.landBall(pos.x,pos.y,false,()=>finish(false),true,{kind:"punt"});
   },"Kick");
  },"Kick"));return true;
 }
 dumpOff(a,d,done){
  if(this.dumpContext||!this.skill(d,"Dump-off")||this.ball.carrier!==d.id||this.has(d,"My Ball")){done();return;}
  const squares=[];for(let y=0;y<15;y++)for(let x=0;x<26;x++)if(super.passRange(d,{x,y})?.band===0)squares.push({x,y});
  const options=squares.map(pos=>"Quick pass to "+(pos.x+1)+", "+(pos.y+1)).concat("Keep the ball");
  this.skillChoice("Dump-off",d.team,options,choice=>{
   const pos=squares[options.indexOf(choice)];if(!pos){done();return;}
   const keys=["mover","action","ballActionDone","passContext","blitzTarget","blitzBlocked","attackRoller","nextFrenzyRound"],saved=Object.fromEntries(keys.map(k=>[k,this[k]]));
   this.dumpContext={defender:d.id,attacker:a.id,saved,done};this.scoreDeferrals=(this.scoreDeferrals||0)+1;this.mover=d.id;this.action="pass";this.ballActionDone=false;this.attackRoller=a.id;
   this.animosity(d,this.at(pos.x,pos.y),()=>super.pass(pos.x,pos.y),()=>this.finishDumpOff());
  });
 }
 finishDumpOff(){
  const context=this.dumpContext;if(!context||this.pending)return false;
  this.dumpContext=null;Object.assign(this,context.saved);this.scoreDeferrals--;context.done();return true;
 }
 beforePass(p,target,done){this.onTheBall(p,done);}
 movementAllowance(p){return this.moveContext?.player.id===p.id?3:super.movementAllowance(p);}
 onTheBall(p,done,{kickoff=false}={}){
  if(kickoff&&this.kickTouchback){done();return;}
  const team=kickoff?this.receiving:1-p.team;
  let remaining=this.players.filter(q=>q.team===team&&this.onPitch(q)&&this.skill(q,"On the Ball")&&!q.rooted&&!this.isChomped(q)&&(!kickoff||!this.marking(q))&&q.id!==this.dumpContext?.attacker);
  const offer=()=>{
   remaining=remaining.filter(q=>this.onPitch(q)&&this.skill(q,"On the Ball"));if(!remaining.length){done();return;}
   const options=remaining.map(q=>"Move #"+q.number+" ("+q.id+")").concat("Finish reactions");
   this.skillChoice("On the Ball",team,options,choice=>{
    const q=remaining[options.indexOf(choice)];if(!q){done();return;}remaining=remaining.filter(v=>v!==q);
    this.beginBoundedMove(q,failed=>{if(failed||kickoff)done();else offer();},{ownHalf:kickoff?team:null});
   });
  };offer();
 }
 beginBoundedMove(p,done,{ownHalf=null}={}){
  const keys=["mover","action","ballActionDone","departureOrigin"],saved=Object.fromEntries(keys.map(k=>[k,this[k]]));
  this.moveContext={player:p,spent:p.spent,saved,done,ownHalf};p.spent=0;this.mover=p.id;this.action="move";this.ballActionDone=false;this.scoreDeferrals=(this.scoreDeferrals||0)+1;this.offerBoundedMove();
 }
 offerBoundedMove(){
  const context=this.moveContext;if(!context)return;const p=context.player;
  if(p.spent>=3||p.status!=="standing"||p.distracted){this.finishBoundedMove(false);return;}
  const squares=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx||dy){const x=p.x+dx,y=p.y+dy,plan=this.plan(x,y);if(plan&&!plan.rushes&&p.spent+plan.cost<=3&&(context.ownHalf===null||this.ownHalf(context.ownHalf,x)))squares.push({x,y});}
  const options=squares.map(pos=>"Move to "+(pos.x+1)+", "+(pos.y+1)).concat("Stop moving");
  if(!squares.length){this.finishBoundedMove(false);return;}
  this.skillChoice("On the Ball movement",p.team,options,choice=>{const pos=squares[options.indexOf(choice)];if(pos)this.step(pos.x,pos.y);else this.finishBoundedMove(false);});
 }
 movementCompleted(p){if(this.moveContext?.player===p)this.offerBoundedMove();}
 finishBoundedMove(failed){const context=this.moveContext;if(!context||this.pending)return false;this.moveContext=null;context.player.spent=context.spent;Object.assign(this,context.saved);this.scoreDeferrals--;context.done(failed);return true;}
 finishBallAction(p,allowGiveAndGo,forcedTurnover=false){if(this.dumpContext?.defender===p.id){this.finishDumpOff();return;}super.finishBallAction(p,allowGiveAndGo,forcedTurnover);}
 reactionMove(p,pos,done,{optionalPickup=false}={}){
  p.x=pos.x;p.y=pos.y;this.refreshChomps();if(this.ball.carrier===p.id){this.ball.x=p.x;this.ball.y=p.y;}
  if(this.ball.carrier||this.ball.x!==p.x||this.ball.y!==p.y){done();return;}
  const pick=()=>this.test(p,"Pick up",parseInt(this.profile(p).ag)+this.marking(p),()=>{this.ball.carrier=p.id;done();},()=>this.bounce(p.x,p.y,()=>optionalPickup?done():this.endTurn(true)));
  if(optionalPickup)this.skillChoice("Trickster pickup",p.team,["Pick up","Leave to bounce"],choice=>{if(choice==="Pick up")pick();else this.bounce(p.x,p.y,done);});else pick();
 }
 trickster(a,d,done){
  if(!this.skill(d,"Trickster")||d.rooted||this.isChomped(d)){done();return;}
  const squares=this.adjacentEmpty(a);if(!squares.length){done();return;}
  const options=squares.map(pos=>"Relocate to "+(pos.x+1)+", "+(pos.y+1)).concat("Stay");
  this.skillChoice("Trickster",d.team,options,choice=>{
   const pos=squares[options.indexOf(choice)];if(!pos){done();return;}
   this.scoreDeferrals=(this.scoreDeferrals||0)+1;
   this.reactionMove(d,pos,()=>{this.scoreDeferrals--;done();},{optionalPickup:true});
  });
 }
 hitAndRun(p,done){
  if(!this.skill(p,"Hit and Run")||this.has(p,"Frenzy")||p.rooted||this.isChomped(p)||this.used(p,"Hit and Run")||this.finished){done();return;}
  const squares=this.adjacentEmpty(p).filter(pos=>!this.players.some(q=>q.team!==p.team&&this.onPitch(q)&&this.distance(q,pos)===1));
  if(!squares.length){done();return;}
  const options=squares.map(pos=>"Move free to "+(pos.x+1)+", "+(pos.y+1)).concat("Stay");
  this.skillChoice("Hit and Run",p.team,options,choice=>{const pos=squares[options.indexOf(choice)];if(pos){this.use(p,"Hit and Run");this.reactionMove(p,pos,done);}else done();});
 }
 injuryResult(p,total,done=()=>{},options={}){this.resolveInjury(p,total,done,options);}
 armourOnly(p,done,{bonus=0,injuryBonus=0,onDice=null,source=null,plague=false}={}){
  const a=this.roll("Armour"),b=this.roll("Armour");if(onDice)onDice("Armour",a,b);if(a+b+bonus<parseInt(this.profile(p).av)){this.note("Armour holds.");done();return;}
  const x=p.x,y=p.y,carrying=this.ball.carrier===p.id;
  this.beforeProne(p,{x,y},()=>{
   const c=this.roll("Injury"),d=this.roll("Injury");if(onDice)onDice("Injury",c,d);const finish=()=>{this.syncLeader?.();if(carrying&&p.team===this.active)this.endTurn(true);else done();};this.injuryResult(p,c+d+injuryBonus,()=>this.releaseProneBall(p,{x,y},finish),{source,plague});
  });
 }
 foul(p,target,{chainsaw=false,chosen=false,after=null}={}){
  if(this.has(p,"Chainsaw")&&!chosen){
   this.skillChoice("Chainsaw foul",p.team,["Use Chainsaw","Foul normally"],choice=>{
    if(choice==="Foul normally"){this.foul(p,target,{chosen:true,after});return;}
    this.test(p,"Chainsaw kick-back",2,()=>this.foul(p,target,{chainsaw:true,chosen:true,after}),()=>{
     const cleanup=()=>{this.mover=null;this.action=null;};
     this.fall(p,{turnover:false,skipPrevention:true,skipPlacement:!after,after:()=>{if(after)after(true);else{cleanup();this.endTurn(true);}}});
    });
   });return;
  }
  const helpers=(team,victim,excluded,offensive)=>this.players.filter(q=>q.team===team&&q.id!==p.id&&q.id!==target.id&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&!q.gouged&&this.distance(q,victim)===1&&(this.markedByExcept(q,[excluded.id])===0||offensive&&this.skill(q,"Put the Boot In")&&!this.players.some(r=>r.team!==q.team&&r.team!==this.active&&this.skill(r,"Defensive")&&this.onPitch(r)&&this.distance(r,q)===1))).length;
  const offense=helpers(p.team,target,target,true),defense=helpers(target.team,p,p,false),modifier=this.has(target,"Iron Hard Skin")?0:offense-defense+(chainsaw?3:0);
  this.note("Foul: "+offense+" offensive and "+defense+" defensive assist(s).");let sent=false;
  const finishNormal=()=>{if(after){after(false);return;}if(this.skill(p,"Quick Foul")){this.note("Quick Foul: remaining movement is available.");}else if(p.bloodlust)this.feed(p,()=>{this.mover=null;this.action=null;});else{this.mover=null;this.action=null;}},finish=()=>{if(sent)this.sendOff(p,turnover=>after?after(turnover):turnover?this.endTurn(true):finishNormal());else finishNormal();},rollArmour=(rerolled=false)=>{
   const a=this.roll("Foul Armour"),b=this.roll("Foul Armour"),raw=a+b,dirty=this.skill(p,"Dirty Player"),skin=this.has(target,"Iron Hard Skin");
   const afterArmour=bonus=>{const broken=raw+modifier+bonus>=parseInt(this.profile(target).av);
    const keep=()=>{if(a===b&&(!this.skill(p,"Sneaky Git")||broken))sent=true;
     if(!broken){finish();return;}
     const c=this.roll("Foul Injury"),d=this.roll("Foul Injury");if(c===d)sent=true;
     const apply=add=>this.injuryResult(target,c+d+add,finish,{source:{playerId:p.id,cause:"Foul"}});if(dirty&&!bonus)this.pending={type:"custom",kind:"Dirty Player",options:["Add +1 to Injury","No modifier"],resolve:choice=>{this.pending=null;apply(choice==="Add +1 to Injury"?1:0);}};else apply(0);
    };
    const stalling=this.wouldEndTurnTriggerStalling?.(p);
    if(!rerolled&&!offense&&!defense&&this.skill(p,"Lone Fouler")&&(!broken||a===b||stalling))this.pending={type:"custom",kind:"Lone Fouler",options:["Re-roll Armour","Keep result"],resolve:choice=>{this.pending=null;if(choice==="Re-roll Armour"){sent=false;rollArmour(true);}else keep();}};
    else keep();
   };
   if(dirty&&!skin&&raw+modifier<parseInt(this.profile(target).av))this.pending={type:"custom",kind:"Dirty Player",options:["Add +1 to Armour","No modifier"],resolve:choice=>{this.pending=null;afterArmour(choice==="Add +1 to Armour"?1:0);}};else afterArmour(0);
  };rollArmour();
 }
 sendOff(p,done){
  this.argueBanned||=[false,false];let resolved=false;
  const complete=turnover=>{if(resolved)return;resolved=true;done(turnover);};
  const remove=()=>{const {x,y}=p,carrying=this.ball.carrier===p.id;Object.assign(p,{x:null,y:null,status:"sent-off"});this.note("Player is Sent-off.");if(carrying){this.ball={x,y,carrier:null};this.bounce(x,y,()=>complete(true));}else complete(true);};
  const bribe=()=>{
   if((this.bribes?.[p.team]||0)<1){remove();return;}
   this.skillChoice("Bribe",p.team,["Use Bribe","Accept send-off"],option=>{
    if(option!=="Use Bribe"){remove();return;}
    this.bribes[p.team]--;if(this.roll("Bribe needs 2+")>=2){this.note("Bribe succeeds: no send-off or turnover.");complete(false);}else bribe();
   });
  };
  const options=["Accept send-off"];if(!this.argueBanned[p.team]&&p.status!=="casualty")options.unshift("Argue the Call");
  this.skillChoice("Sent-off — "+this.teams[p.team].name+" #"+p.number,p.team,options,choice=>{
   if(choice!=="Argue the Call"){bribe();return;}
   let n=this.roll("Argue the Call");
   if(n===1&&(this.argueRerolls?.[p.team]||0)>0){this.argueRerolls[p.team]--;this.note("Bribery and Corruption: re-roll the natural-one Argue the Call.");n=this.roll("Bribery and Corruption Argue re-roll");}
   if(n===6){this.note("Argue the Call succeeds; player remains, turnover still applies.");complete(true);return;}
   if(n===1){this.argueBanned[p.team]=true;remove();return;}
   bribe();
  });
 }
 chooseLandingCatcher(x,y,delivery,done){
  if(!["pass","kickoff","throw-in"].includes(delivery.kind)){super.chooseLandingCatcher(x,y,delivery,done);return;}
  const direct=this.at(x,y),adjacent=this.players.filter(p=>this.onPitch(p)&&this.distance(p,{x,y})===1&&this.skill(p,"Diving Catch")).sort((a,b)=>a.number-b.number);
  if(!adjacent.length){done(direct);return;}
  this.interrupt("Diving Catch",finish=>{
   const first=delivery.chooserTeam??this.active,order=[first,1-first],offer=i=>{
    if(i>=order.length){finish(direct);return;}
    const team=order[i],candidates=adjacent.filter(p=>p.team===team);if(direct?.team===team)candidates.unshift(direct);
    if(!candidates.length){offer(i+1);return;}
    this.reactionChoice("Diving Catch / catcher",team,candidates,p=>{if(p)finish(p);else offer(i+1);});
   };offer(0);
  },done);
 }
 isChomped(p){p.chompers=(p.chompers||[]).filter(id=>{const q=this.players.find(q=>q.id===id);return q&&this.onPitch(q)&&q.status==="standing"&&!q.distracted&&this.distance(q,p)===1;});return p.chompers.length>0;}
 refreshChomps(){for(const p of this.players)this.isChomped(p);}
 onProne(p){for(const q of this.players)if(q.chompers)q.chompers=q.chompers.filter(id=>id!==p.id);}
 landingTarget(p,delivery){return super.landingTarget(p,delivery)-(delivery.kind==="pass"&&delivery.accurateToPlayer&&this.skill(p,"Diving Catch")?1:0);}
 beforeProne(p,origin,done){
  if(this.ball.carrier!==p.id||!this.skill(p,"Safe Pair of Hands")){done(false);return;}
  const squares=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&this.inside(origin.x+dx,origin.y+dy)&&!this.at(origin.x+dx,origin.y+dy))squares.push({x:origin.x+dx,y:origin.y+dy});
  if(!squares.length){done(false);return;}
  this.interrupt("Safe Pair of Hands",finish=>{
   const options=squares.map(pos=>"Place ball at "+(pos.x+1)+", "+(pos.y+1)).concat("Bounce normally");
   const q={type:"custom",kind:"Safe Pair of Hands",team:p.team,options,squares,resolve:choice=>{
    if(this.pending!==q||!options.includes(choice))return false;
    this.pending=null;const pos=squares[options.indexOf(choice)];
    if(pos){this.ball={...pos,carrier:null};this.note("Safe Pair of Hands: ball placed at "+(pos.x+1)+", "+(pos.y+1)+".");}
    finish(!!pos);return true;
   }};this.pending=q;
  },done);
 }
 fall(p,options={}){
  const b=this.blockAction,participant=b&&(p.id===b.attacker.id||p.id===b.target.id),blockFall=participant&&(options.blockBlast||options.mightyBlowBy?.team!==undefined&&options.mightyBlowBy.team!==p.team);
  if(!blockFall){super.fall(p,options);return;}
  if(!b.downOutcomes){b.downOutcomes=new Map();b.carrierBeforeDowns=this.ball.carrier;}b.saboteurAsked||=new Set();
  const resume=prevented=>{if(prevented&&options.prevented)options.prevented();else if(options.after)options.after();else if(!prevented&&(b.saboteurTriggered?b.turnover:options.turnover??true))this.endTurn(true);};
  if(b.downOutcomes.has(p.id)){resume(!b.downOutcomes.get(p.id));return;}
  const normal=()=>super.fall(p,{...options,prevented:()=>{b.downOutcomes.set(p.id,false);resume(true);}});
  if(!this.skill(p,"Saboteur")||b.saboteurAsked.has(p.id)){normal();return;}
  b.saboteurAsked.add(p.id);
  this.skillChoice("Saboteur",p.team,["Use Saboteur","Fall normally"],choice=>{
   if(choice!=="Use Saboteur"||this.roll("Saboteur needs 4+")<4){normal();return;}
   const other=p.id===b.attacker.id?b.target:b.attacker,origin={x:p.x,y:p.y};b.saboteurTriggered=true;
   this.scoreDeferrals=(this.scoreDeferrals||0)+1;let completed=false;
   const finish=()=>{if(completed)return;completed=true;const holder=this.players.find(q=>q.id===b.carrierBeforeDowns);if(holder?.team===this.active&&b.downOutcomes.get(holder.id)===true)b.turnover=true;this.scoreDeferrals--;resume(false);};
   const knockOut=()=>{
    b.downOutcomes.set(p.id,true);if(p.id===b.target.id)b.targetKnocked=true;p.status="knocked-out";p.x=null;p.y=null;p.rooted=false;this.onProne(p);this.syncLeader();this.note("Saboteur: #"+p.number+" is automatically Knocked Out without armour or injury.");
    if(this.multipleContext?.stage==="effects"){
     const record={playerId:p.id,team:p.team,source:{playerId:p.id,cause:"Saboteur"},original:null,selected:null,medicalStatus:"knocked-out",treatment:"Saboteur"};
     this.multipleContext.injuries.push({p,record,origin,regenerate:next=>next(),treat:next=>{record.status="knocked-out";p.status="knocked-out";p.x=null;p.y=null;this.injuryRecords.push(record);next();}});
     // The KO is committed, but keep the actor's square for the other attack.
     if(p===this.multipleContext.attacker){p.status="prone";Object.assign(p,origin);}
    }
    this.releaseProneBall(p,origin,()=>{
     if(!this.onPitch(other)||other.status!=="standing"&& !b.downOutcomes.has(other.id)){finish();return;}
     this.fall(other,{turnover:false,blockBlast:true,after:finish,prevented:finish});
    });
   };
   if(p.id===b.attacker.id)knockOut();else this.beforeProne(p,origin,knockOut);
  });
 }
 preventFall(p,yes,no){
  if(this.has(p,"Ball & Chain")){no();return;}
  if(!this.skill(p,"Steady Footing")){no();return;}
  this.interrupt("Steady Footing",done=>{
   const options=["Use Steady Footing","Fall normally"],q={type:"custom",kind:"Steady Footing",team:p.team,options,resolve:choice=>{
    if(this.pending!==q||!options.includes(choice))return false;
    this.pending=null;
    if(choice===options[0])this.test(p,"Steady Footing",6,()=>done(true),()=>done(false));else done(false);
    return true;
   }};this.pending=q;
  },saved=>{if(saved){this.note("Steady Footing: #"+p.number+" stays standing.");yes();}else no();});
 }
 resolveFall(p,options={}){
  if(this.has(p,"Ball & Chain")){
   const after=()=>{if(options.turnover??true)this.endTurn(true);else if(options.after)options.after();};
   const by=options.impactBy||options.armBarBy||options.mightyBlowBy,kind=options.impactBy?"Lethal Flight":options.armBarBy?"Arm Bar":"Mighty Blow",can=options.impactBy||options.armBarBy&&!this.has(p,"Iron Hard Skin")||!options.savageryBy&&this.canMighty(options.mightyBlowBy,p);
   this.chainDamage(p,after,{source:options.injurySource||(by?{playerId:by.id,cause:options.impactBy?"Lethal Flight":options.armBarBy?"Arm Bar":"Block"}:null),modifierBy:can?by:null,modifierKind:kind,plague:!!by&&!!this.blockAction&&!this.multipleContext&&!this.chainContext});return;
  }
  p.rooted=false;const b=this.blockAction;if(b&&(options.blockBlast||options.mightyBlowBy?.team!==undefined&&options.mightyBlowBy.team!==p.team)&&(p.id===b.attacker.id||p.id===b.target.id)){b.downOutcomes||=new Map();b.downOutcomes.set(p.id,true);}if(b&&p.id===b.target.id&&options.mightyBlowBy?.id===b.attacker.id)b.targetKnocked=true;const old=options.after;return super.resolveFall(p,{...options,after:()=>{this.syncLeader();if(old)old();}});}
 endTurn(turnover=false){if(this.bombContext){if(turnover)this.bombContext.turnover=true;return false;}if(this.moveContext)return this.finishBoundedMove(true);if(this.dumpContext)return this.finishDumpOff();if(this.multipleEndTurn(turnover))return false;if(this.pending||this.finished)return false;if(this.bloodlustEndTurn(turnover))return false;this.chainContext=null;const previous=this.active,result=super.endTurn(turnover);if(result){this.resetSkillTurn();this.foulUsed[this.active]=false;this.pickMeUp(previous);}return result;}
 pickMeUp(endingTeam){const sources=this.players.filter(p=>p.team===1-endingTeam&&this.onPitch(p)&&this.skill(p,"Pick-me-up")),eligible=this.players.filter(p=>p.team===1-endingTeam&&p.status==="prone"&&this.onPitch(p)&&sources.some(q=>this.distance(q,p)<=3));for(const p of eligible)if(this.roll("Pick-me-up #"+p.number)>=5)p.status="standing";}
}
if(typeof module!=="undefined")module.exports={SkillGame,SKILL_CATALOG,SKILL_GROUPS};
