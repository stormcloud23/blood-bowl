"use strict";
const MatchBase=typeof module!=="undefined"?require("./skills.cjs").SkillGame:SkillGame;
// Inducement prices/limits follow the pinned BB2025 FFB option factory.
const MATCH_RESOURCES={
 teamRerolls:{label:"Team re-rolls",group:"staff",max:8,initial:2},
 apothecary:{label:"Team apothecary",group:"staff",max:1,initial:0},
 assistants:{label:"Assistant coaches",group:"staff",max:6,cost:10000,initial:0},
 cheerleaders:{label:"Cheerleaders",group:"staff",max:6,cost:10000,initial:0},
 dedicatedFans:{label:"Dedicated Fans",group:"staff",min:1,max:6,cost:5000,initial:1},
 bribes:{label:"Bribes",group:"inducement",max:3,cost:100000,initial:0},
 kegs:{label:"Blitzer's Best Kegs",group:"inducement",max:2,cost:50000,initial:0},
 extraTraining:{label:"Extra Training",group:"inducement",max:4,cost:100000,initial:0},
 wanderingApothecaries:{label:"Wandering Apothecaries",group:"inducement",max:2,cost:100000,initial:0},
 tempCoaches:{label:"Part-time Assistant Coaches",group:"inducement",max:3,cost:20000,initial:0},
 tempCheerleaders:{label:"Temp Agency Cheerleaders",group:"inducement",max:4,cost:20000,initial:0},
 masterChef:{label:"Halfling Master Chef",group:"inducement",max:1,cost:300000,initial:0}
};
class MatchGame extends MatchBase {
 constructor(teams,{dice=null,learning=false,resources=null}={}){
  super(teams,{dice});this.events=[];this.match=true;this.learning=learning;this.phase="fans";this.half=1;this.drive=0;this.scores=[0,0];this.turns=[0,0];
  this.fans=[0,0];this.dedicatedFans=[1,1];this.weather="Perfect Conditions";this.cheer=[false,false];this.driveBonus=[0,0];this.bribes=[0,0];this.skip=[false,false];this.ball={x:null,y:null,carrier:null};
  this.resourceChoices=teams.map((t,i)=>({...Object.fromEntries(Object.entries(MATCH_RESOURCES).map(([key,spec])=>[key,spec.initial])),...(resources?.[i]||t.matchResources||{})}));
  for(const team of [0,1])for(const [key,value] of Object.entries(this.resourceChoices[team]))if(!this.validResource(team,key,value))throw new Error("Invalid match resource: "+key);
  this.refreshResources();this.chefHalf=0;this.chefHistory=[];
  this.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));this.note("Exhibition match: configure staff and basic inducements before determining fans. Star players and unique abilities are deferred.");
 }
 hasTeamRule(team,name){return (this.teams[team].special||[]).some(rule=>rule.toLowerCase()===name.toLowerCase());}
 resourceSpec(team,key){
  const base=MATCH_RESOURCES[key];if(!base)return null;const spec={...base};
  if(key==="teamRerolls")spec.cost=this.teams[team].reroll;
  if(key==="apothecary"){spec.cost=this.teams[team].staff?.apothecary||0;if(!spec.cost)spec.max=0;}
  if(key==="wanderingApothecaries"&&!this.teams[team].staff?.apothecary)spec.max=0;
  if(key==="bribes"&&this.hasTeamRule(team,"Bribery and Corruption")){spec.cost=50000;spec.max=6;}
  if(key==="masterChef"&&(this.teams[team].rosterKeywords||[]).some(k=>k.toLowerCase()==="master chef"))spec.cost=100000;
  return spec;
 }
 validResource(team,key,value){if(![0,1].includes(team)||!Number.isInteger(value))return false;const spec=this.resourceSpec(team,key);return !!spec&&value>=(spec.min||0)&&value<=spec.max;}
 setResource(team,key,value){
  if(this.phase!=="fans"||this.pending||!this.validResource(team,key,value))return false;
  this.resourceChoices[team][key]=value;this.refreshResources();return true;
 }
 configureResources(team){
  if(this.phase!=="fans"||this.pending||![0,1].includes(team))return false;
  const menu=()=>{
   const keys=Object.keys(MATCH_RESOURCES).filter(key=>this.resourceSpec(team,key).max>0),options=keys.map(key=>this.resourceSpec(team,key).label+": "+this.resourceChoices[team][key]);
   this.skillChoice("Staff and inducements — "+this.teams[team].name,team,[...options,"Done"],choice=>{
    const key=keys[options.indexOf(choice)];if(!key)return;
    const spec=this.resourceSpec(team,key),values=Array.from({length:spec.max-(spec.min||0)+1},(_,i)=>i+(spec.min||0)),labels=values.map(value=>value+" — "+((key==="dedicatedFans"?value-1:value)*spec.cost).toLocaleString()+" gp");
    this.skillChoice(spec.label,team,[...labels,"Back"],label=>{const index=labels.indexOf(label);if(index>=0)this.setResource(team,key,values[index]);menu();});
   });
  };menu();return true;
 }
 refreshResources(){
  this.baseRerolls=this.resourceChoices.map(r=>r.teamRerolls);
  this.rerolls=this.resourceChoices.map(r=>r.teamRerolls+r.extraTraining);
  this.apothecaries=this.resourceChoices.map(r=>r.apothecary+r.wanderingApothecaries);
  this.bribes=this.resourceChoices.map(r=>r.bribes);this.dedicatedFans=this.resourceChoices.map(r=>r.dedicatedFans);
  this.argueRerolls=this.resourceChoices.map((r,t)=>this.hasTeamRule(t,"Bribery and Corruption")?1:0);
 }
 resourceCosts(team){
  let staff=0,inducements=0,fans=0;
  for(const [key,value] of Object.entries(this.resourceChoices[team])){const spec=this.resourceSpec(team,key),cost=(key==="dedicatedFans"?value-1:value)*spec.cost;if(key==="dedicatedFans")fans+=cost;else if(spec.group==="staff")staff+=cost;else inducements+=cost;}
  return {staff,inducements,fans,total:staff+inducements+fans};
 }
 staffCount(team,kind){const r=this.resourceChoices[team];return kind==="assistants"?r.assistants+r.tempCoaches:r.cheerleaders+r.tempCheerleaders;}
 startHalfResources(){
  if(this.chefHalf===this.half)return;this.chefHalf=this.half;
  const successes=[0,0];
  for(const team of [0,1])if(this.resourceChoices[team].masterChef){const dice=Array.from({length:3},()=>this.roll(this.teams[team].name+" Master Chef needs 4+"));successes[team]=dice.filter(n=>n>=4).length;this.chefHistory.push({half:this.half,team,dice,successes:successes[team]});}
  const before=[...this.rerolls];this.rerolls=before.map((n,t)=>Math.max(0,n-successes[1-t])+successes[t]);
  if(successes.some(Boolean))this.note("Master Chef: half "+this.half+" gains "+successes.join(" / ")+" re-rolls; opposing regular pools are reduced. Leader is granted afterwards.");
 }
 teamSppAwards(team){const brutes=this.hasTeamRule(team,"Brawlin' Brutes");return {touchdown:brutes?2:3,casualty:brutes?3:2,completion:1,interception:2,mvp:4};}
 profile(p){const base=super.profile(p);return p.snack?{...base,ma:Math.max(1,base.ma-1),av:Math.max(3,parseInt(base.av)-1)+"+"}:base;}
 setApothecary(team,enabled){
  return this.setResource(team,"apothecary",enabled?1:0);
 }
 right(team){return (team===0)===(this.half===1);}
 ownHalf(team,x){return this.inside(x,7)&&(this.right(team)?x<=12:x>=13);}
 line(team){return this.right(team)?12:13;}
 centre(y){return y>=4&&y<=10;}
 advancePregame(){
  if(this.pending)return false;
  if(this.phase==="fans"){
   this.fans=this.dedicatedFans.map((n,t)=>this.learning?n:n+Math.ceil(this.roll(this.teams[t].name+" Fair-weather Fans")/2));
   this.note("Fan Factors: "+this.fans.join(" / ")+".");this.phase="weather";return true;
  }
  if(this.phase==="weather"){if(!this.learning)this.rollWeather();this.phase="leagueSteps";return true;}
  if(this.phase==="leagueSteps"){this.note("Exhibition staff and selected basic inducements are locked. Automatic league cash, Journeymen and star players are deferred.");this.phase="rolloff";return true;}
  if(this.phase==="rolloff"){
   let a,b;do{a=this.roll(this.teams[0].name+" kick/receive roll-off");b=this.roll(this.teams[1].name+" kick/receive roll-off");}while(a===b);
   this.rolloffWinner=a>b?0:1;this.phase="kickChoice";this.note(this.teams[this.rolloffWinner].name+" chooses who kicks.");return true;
  }return false;
 }
 rollWeather(){const sum=this.roll("Weather team 1")+this.roll("Weather team 2");this.weather=sum===2?"Sweltering Heat":sum===3?"Very Sunny":sum===11?"Pouring Rain":sum===12?"Blizzard":"Perfect Conditions";this.note("Weather: "+this.weather+".");return this.weather;}
 chooseKicking(team){if(this.phase!=="kickChoice"||![0,1].includes(team))return false;this.firstReceiver=1-team;this.prepareDrive(team);return true;}
 available(team){return this.players.filter(p=>p.team===team&&!p.eaten&&!["casualty","knocked-out","sent-off"].includes(p.status)&&!p.heatOut);}
 prepareDrive(kicking){
  this.throwUsed=[false,false];this.throwMate=null;
  this.drive++;this.kicking=kicking;this.receiving=1-kicking;this.active=kicking;this.setupTeam=kicking;this.phase="setup";this.finished=false;this.pending=null;this.mover=null;this.action=null;this.blockAction=null;this.ball={x:null,y:null,carrier:null};this.kickTouchback=false;this.eventState=null;
  this.kickDistanceHalved=false;this.kickChoiceMade=false;for(const p of this.players){p.rooted=false;p.gouged=false;p.chompers=[];if(!p.eaten&&!["casualty","knocked-out","sent-off"].includes(p.status))Object.assign(p,{status:"reserve",x:null,y:null,distracted:false,used:false,spent:0});}
  this.note("Drive "+this.drive+": "+this.teams[kicking].name+" sets up first.");this.autoSetup(kicking);
 }
 setupErrors(team=this.setupTeam){
  const list=this.players.filter(p=>p.team===team&&this.onPitch(p)),needed=Math.min(11,this.available(team).length),errors=[];
  if(list.length!==needed)errors.push("Field "+needed+" eligible player(s).");
  if(list.some(p=>!this.ownHalf(team,p.x)||p.heatOut||p.status!=="standing"))errors.push("All players must be eligible and in their own half.");
  if(list.filter(p=>p.x===this.line(team)&&this.centre(p.y)).length<Math.min(3,needed))errors.push("Place at least "+Math.min(3,needed)+" player(s) on the central Line of Scrimmage.");
  if(list.filter(p=>p.y<4).length>2||list.filter(p=>p.y>10).length>2)errors.push("At most two players in each Wide Zone.");return errors;
 }
 autoSetup(team=this.setupTeam){
  if(this.phase!=="setup"||team!==this.setupTeam)return false;
  const list=this.available(team);list.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));const line=this.line(team),back=this.right(team)?-1:1;
  const spots=[[line,6],[line,7],[line,8],[line+back*3,5],[line+back*3,9],[line+back*4,2],[line+back*4,12],[line+back*6,4],[line+back*6,10],[line+back*7,6],[line+back*7,8]];
  list.slice(0,11).forEach((p,i)=>Object.assign(p,{x:spots[i][0],y:spots[i][1],status:"standing"}));return true;
 }
 placeSetup(id,x,y){
  const p=this.players.find(p=>p.id===id);if(this.phase!=="setup"||!p||p.team!==this.setupTeam||!this.available(this.setupTeam).includes(p)||!this.inside(x,y)||!this.ownHalf(p.team,x)||this.at(x,y))return false;
  if(!this.onPitch(p)&&this.players.filter(q=>q.team===p.team&&this.onPitch(q)).length>=11)return false;Object.assign(p,{x,y,status:"standing"});return true;
 }
 confirmSetup(){
  if(this.phase!=="setup"||this.setupErrors().length)return false;
  this.players.filter(p=>p.team===this.setupTeam&&this.onPitch(p)).forEach(p=>p.fieldedDrive=this.drive);
  if(this.setupTeam===this.kicking){this.setupTeam=this.receiving;this.active=this.receiving;this.autoSetup();}
  else{this.phase="kicker";this.active=this.kicking;this.startHalfResources();this.grantLeader(this.half);}return true;
 }
 eligibleKickers(){const list=this.players.filter(p=>p.team===this.kicking&&this.onPitch(p)&&this.centre(p.y)),back=list.filter(p=>p.x!==this.line(p.team));return back.length?back:list;}
 nominateKicker(id){if(this.phase!=="kicker"||!this.eligibleKickers().some(p=>p.id===id))return false;this.kicker=id;this.phase="kickAim";return true;}
 kick(x,y){
  if(this.pending)return false;
  if(this.phase!=="kickAim"||!this.inside(x,y)||!this.ownHalf(this.receiving,x))return false;
  const kicker=this.players.find(p=>p.id===this.kicker);if(this.skill(kicker,"Kick")&&!this.kickChoiceMade){this.choice("Kick skill",["Use D3 deviation","Use D6 deviation"],option=>{this.kickChoiceMade=true;this.kickDistanceHalved=option==="Use D3 deviation";this.kick(x,y);});return true;}
  let distance=this.roll("Kick deviation distance");if(this.kickDistanceHalved)distance=Math.ceil(distance/2);const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],[dx,dy]=dirs[this.roll("Kick deviation direction",8)-1];
  this.kickLanding={x:x+distance*dx,y:y+distance*dy};this.checkKickBounds();this.note("Kick is airborne; resolve the Kick-off Event before catching.");
  this.onTheBall(null,()=>{if(this.learning)this.landKick();else this.kickoffEvent(this.roll("Kick-off Event")+this.roll("Kick-off Event"));},{kickoff:true});return true;
 }
 checkKickBounds(){if(!this.inside(this.kickLanding.x,this.kickLanding.y)||!this.ownHalf(this.receiving,this.kickLanding.x))this.kickTouchback=true;}
 openPlayers(team){return this.players.filter(p=>p.team===team&&this.onPitch(p)&&p.status==="standing"&&!p.distracted&&!this.marking(p));}
 choice(kind,options,fn){this.pending={type:"custom",kind,options,resolve:option=>{if(!options.includes(option))return;this.pending=null;fn(option);}};}
 randomPlayers(list,count,label){const remaining=[...list],result=[];while(result.length<count&&remaining.length)result.push(remaining.splice(this.roll(label,remaining.length)-1,1)[0]);return result;}
 kickoffEvent(total){
  this.phase="kickEvent";this.note("Kick-off Event "+total+".");
  const finish=()=>this.landKick();
  if(total===2){this.bribes=this.bribes.map(n=>n+1);this.note("Get the Ref: each team receives an additional Bribe.");finish();}
  else if(total===3){const amount=this.turns[this.kicking]>=6?-1:1;this.turns=this.turns.map(n=>Math.max(0,n+amount));this.note("TIME-OUT: both Turn Markers "+(amount>0?"advance":"move back")+" one.");finish();}
  else if(total===4||total===9||total===10){
   const team=total===9?this.receiving:this.kicking,kind=total===4?"defence":total===9?"snap":"charge",limit=Math.ceil(this.roll("Kick-off selected player count")/2)+3;
   this.eventState={kind,team,limit,eligible:this.openPlayers(team).map(p=>p.id),used:[]};this.active=team;this.phase=kind==="charge"?"charge":"eventMove";this.blitzUsed[team]=false;
   this.note((kind==="defence"?"Solid Defence: redeploy":kind==="snap"?"Quick Snap: move one square with":"Charge: activate")+" up to "+limit+" Open players. Finish the event when ready.");
  }
  else if(total===5){const list=!this.kickTouchback&&!this.at(this.kickLanding.x,this.kickLanding.y)?this.openPlayers(this.receiving):[];
   const options=list.map(p=>"High Kick: #"+p.number);options.push("Skip High Kick");this.choice("High Kick",options,option=>{const p=list[options.indexOf(option)];if(p)Object.assign(p,this.kickLanding);finish();});
  }
  else if(total===6||total===7){
   const kind=total===6?"cheerleaders":"assistants",a=this.roll(this.teams[0].name+(total===6?" Cheering Fans":" Brilliant Coaching"))+this.staffCount(0,kind),b=this.roll(this.teams[1].name+(total===6?" Cheering Fans":" Brilliant Coaching"))+this.staffCount(1,kind);
   for(const t of [0,1])if((t===0?a:b)>=(t===0?b:a)){if(total===6)this.cheer[t]=true;else{this.rerolls[t]++;this.driveBonus[t]++;}}
  this.note(total===6?"Cheering Fans: winning coach(es) gain an assist on their first Block next turn.":"Brilliant Coaching: winning coach(es) gain a Drive re-roll.");finish();
  }
  else if(total===8){
   if(this.rollWeather()==="Perfect Conditions"&&!this.kickTouchback){const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];for(let i=0;i<3;i++){const [dx,dy]=dirs[this.roll("Airborne weather scatter",8)-1];this.kickLanding.x+=dx;this.kickLanding.y+=dy;this.checkKickBounds();if(this.kickTouchback)break;}}finish();
  }
  else if(total===11||total===12){
   const a=this.roll(this.teams[0].name+" event contest")+(total===12?this.fans[0]:0),b=this.roll(this.teams[1].name+" event contest")+(total===12?this.fans[1]:0);
   for(const t of [0,1])if((t===0?a:b)<=(t===0?b:a)){
    const count=total===11?1:Math.ceil(this.roll("Pitch invasion player count")/2),list=this.randomPlayers(this.players.filter(p=>p.team===t&&this.onPitch(p)),count,"Random event player");
    for(const p of list)if(total===12){p.status="stunned";this.note("Pitch invasion stuns #"+p.number+".");}else if(this.roll("Dodgy Snack")===1){Object.assign(p,{status:"reserve",x:null,y:null});this.note("Dodgy Snack removes #"+p.number+" for the drive.");}else{p.snack=true;this.note("Dodgy Snack: #"+p.number+" loses 1 MA and AV this drive.");}
   }finish();
  }
 }
 eventPlace(id,x,y){
  const e=this.eventState,p=this.players.find(p=>p.id===id);if(this.phase!=="eventMove"||!e||!p||!e.eligible.includes(id)||!this.inside(x,y)||this.at(x,y))return false;
  if(!e.used.includes(id)&&e.used.length>=e.limit)return false;
  if(e.kind==="snap"&&(e.used.includes(id)||this.distance(p,{x,y})!==1))return false;
  if(e.kind==="defence"&&!this.ownHalf(p.team,x))return false;
  Object.assign(p,{x,y});if(!e.used.includes(id))e.used.push(id);return true;
 }
 finishEvent(){if(!["eventMove","charge"].includes(this.phase)||this.pending||this.mover)return false;if(this.eventState.kind==="defence"&&this.setupErrors(this.kicking).length)return false;this.eventState=null;this.landKick();return true;}
 landKick(){
  this.phase="kickLanding";this.active=this.receiving;this.mover=null;this.action=null;this.pending=null;
  if(this.kickTouchback){this.touchback();return;}
  this.landBall(this.kickLanding.x,this.kickLanding.y,false,()=>{if(!this.ownHalf(this.receiving,this.ball.x))this.kickTouchback=true;if(this.kickTouchback)this.touchback();else this.startReceivingTurn();},true,{kind:"kickoff"});
 }
 bounce(x,y,done){
  if(this.phase!=="kickLanding"){super.bounce(x,y,done);return;}
  const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],[dx,dy]=dirs[this.roll("Kick bounce",8)-1];
  if(!this.inside(x+dx,y+dy)||!this.ownHalf(this.receiving,x+dx)){this.kickTouchback=true;done();return;}this.landBall(x+dx,y+dy,false,done);
 }
 touchback(){
  this.phase="touchback";this.ball={x:null,y:null,carrier:null};const list=this.players.filter(p=>p.team===this.receiving&&this.onPitch(p)&&p.status==="standing"&&!this.has(p,"No Ball"));
  if(!list.length){this.note("Touchback: choose any empty square in the receiving half.");return;}
  const options=list.map(p=>"Give ball to #"+p.number);this.choice("Touchback — "+this.teams[this.receiving].name,options,option=>{const p=list[options.indexOf(option)];this.ball={x:p.x,y:p.y,carrier:p.id};this.startReceivingTurn();});
 }
 placeTouchback(x,y){if(this.phase!=="touchback"||this.pending||!this.inside(x,y)||!this.ownHalf(this.receiving,x)||this.at(x,y))return false;this.ball={x,y,carrier:null};this.startReceivingTurn();return true;}
 resetTeam(team){this.resetSkillTurn();this.syncLeader();this.foulUsed[team]=false;this.secureUsed[team]=false;this.blitzUsed[team]=false;this.passUsed[team]=false;this.handoffUsed[team]=false;for(const p of this.players){p.dodgeUsed=false;p.proUsed=false;if(p.team===team)Object.assign(p,{used:false,spent:0,stallingChecked:false,stunnedAtStart:p.status==="stunned"});}}
 startReceivingTurn(){this.phase="play";this.eventState=null;this.finished=false;this.pending=null;this.beginTurn(this.receiving);}
 beginTurn(team){
  if(this.skip[team]){this.skip[team]=false;this.turns[team]++;this.note(this.teams[team].name+" skips a turn celebrating an opposition-turn Touchdown.");}
  if(this.turns[team]>=8){if(this.turns[1-team]>=8){this.endDrive(null);return;}team=1-team;}
  this.active=team;this.turns[team]++;this.resetTeam(team);this.note(this.teams[team].name+" — half "+this.half+", turn "+this.turns[team]+".");
 }
 canStart(p){if(!super.canStart(p))return false;if(this.phase==="play")return true;const e=this.eventState;return this.phase==="charge"&&e?.eligible.includes(p.id)&&!e.used.includes(p.id)&&e.used.length<e.limit;}
 start(id,action="move"){
  if(this.phase==="charge"&&!["move","blitz","throw-team-mate"].includes(action))return false;const valid=this.players.find(p=>p.id===id);if(!this.canStart(valid))return false;
  this.stallCandidate=this.phase==="play"&&this.canScoreWithoutDice(valid)?id:null;
  const result=super.start(id,action);if(result&&this.phase==="charge")this.eventState.used.push(id);return result;
 }
 canSecure(p){return this.phase==="play"&&super.canSecure(p);}
 canKickTeamMate(p){return this.phase==="play"&&super.canKickTeamMate(p);}
 canBallAction(p,kind){return this.phase==="play"&&super.canBallAction(p,kind);}
 block(a,d){if(this.phase!=="play")return false;const p=this.players.find(p=>p.id===a);this.stallCandidate=p&&this.canScoreWithoutDice(p)?a:null;return super.block(a,d);}
 options(p,kind){const result=super.options(p,kind);return this.phase==="play"?result:result.filter(s=>s!=="Team");}
 test(p,kind,target,yes,no){if(this.weather==="Blizzard"&&kind==="Rush")target++;if(this.weather==="Pouring Rain"&&["Pick up","Catch","Intercept"].includes(kind))target++;super.test(p,kind,target,yes,no);}
 passPreview(x,y){const result=super.passPreview(x,y);if(result&&this.weather==="Very Sunny"&&this.action!=="bomb")result.target++;return result;}
 throwPreview(x,y){const result=super.throwPreview(x,y);if(result&&this.weather==="Very Sunny")result.target++;return result;}
 passRange(from,to){const result=super.passRange(from,to);return this.weather==="Blizzard"&&result?.band>1?null:result;}
 assists(a,d){const result=super.assists(a,d);if(this.cheer[a.team]&&!this.has(a,"Ball & Chain")&&!this.has(d,"Ball & Chain"))result.offensive++;return result;}
 onBlockRolled(a){this.cheer[a.team]=false;}
 decide(option){const before=[...this.rerolls],result=super.decide(option);this.consumeBonus(before);return result;}
 rerollBlock(source,index=null){const before=[...this.rerolls],result=super.rerollBlock(source,index);this.consumeBonus(before);return result;}
 consumeBonus(before){for(const t of [0,1])if(this.rerolls[t]<before[t])this.driveBonus[t]=Math.max(0,this.driveBonus[t]-(before[t]-this.rerolls[t]));}
 endTurn(turnover=false){
  if(this.bombContext){if(turnover)this.bombContext.turnover=true;return false;}
  if(this.moveContext)return this.finishBoundedMove(true);
  if(this.dumpContext)return this.finishDumpOff();
  if(this.multipleEndTurn(turnover))return false;
  if(this.pending||this.finished)return false;
  if(this.bloodlustEndTurn(turnover))return false;this.chainContext=null;
  if(this.pending||this.finished||!["play","charge"].includes(this.phase))return false;
  if(this.phase==="charge"){this.note("Charge ends.");this.mover=null;this.action=null;this.blockAction=null;this.eventState=null;this.landKick();return true;}
  const current=this.active,phase=this.phase;
  const resume=()=>{if(this.active===current&&this.phase===phase)this.endTurn(turnover);};
  if(this.mover&&this.stallCandidate){this.checkStalling(this.players.find(p=>p.id===this.mover),resume);if(this.pending||this.active!==current||this.phase!==phase)return true;}
  // FFB's forgone-activation step also checks a carrier whose coach ends the turn without activating them.
  if(this.wouldEndTurnTriggerStalling()){
   const carrier=this.players.find(p=>p.id===this.ball.carrier);this.stallCandidate=carrier.id;this.checkStalling(carrier,resume);
   if(this.pending||this.active!==current||this.phase!==phase)return true;
  }
  this.note(turnover?"TURNOVER.":"Turn ended.");for(const p of this.players)if(p.team===this.active&&p.status==="stunned"&&p.stunnedAtStart)p.status="prone";
  this.cheer[this.active]=false;this.pickMeUp(this.active);this.mover=null;this.action=null;this.blockAction=null;this.blitzTarget=null;
  if(this.turns.every(n=>n>=8))this.endDrive(null);else this.beginTurn(1-this.active);return true;
 }
 finishBlock(){if(this.chainContext){super.finishBlock();return;}if(this.multipleContext){super.finishBlock();return;}const b=this.blockAction;super.finishBlock();if(this.pending)return;if(this.phase==="play"||this.phase==="charge")this.checkScore();if(b&&!b.blitz)this.checkStalling(b.attacker);}
 canScoreWithoutDice(p){
  if(!p||this.ball.carrier!==p.id||!this.onPitch(p)||p.status!=="standing"||p.distracted||["Bone Head","Really Stupid","Unchannelled Fury","Animal Savagery","Take Root"].some(s=>this.has(p,s))||this.parameter(p,"Bloodlust"))return false;
  const goal=this.right(p.team)?25:0,queue=[{x:p.x,y:p.y,spent:0}],seen=new Set([p.x+","+p.y]);
  while(queue.length){const n=queue.shift();if(n.x===goal)return true;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(dx||dy){const x=n.x+dx,y=n.y+dy,key=x+","+y;if(seen.has(key))continue;const plan=this.planFrom(p,x,y,n.x,n.y,n.spent);if(!plan||plan.rushes||plan.dodge||plan.jump)continue;seen.add(key);queue.push({x,y,spent:n.spent+1});}}
  return false;
 }
 wouldEndTurnTriggerStalling(excluded=null){const p=this.players.find(q=>q.id===this.ball.carrier);return this.phase==="play"&&this.turns[this.active]<=6&&p&&p!==excluded&&p.team===this.active&&!p.used&&!p.stallingChecked&&this.canScoreWithoutDice(p);}
 checkStalling(p,afterPrevention=null){
  if(this.phase!=="play"||this.finished||this.pending||p?.team!==this.active||p.stallingChecked||this.stallCandidate!==p.id||this.ball.carrier!==p.id)return;
  this.stallCandidate=null;p.stallingChecked=true;if(this.turns[this.active]>6){this.note("Stalling: no crowd roll in turns 7–8.");return;}
  this.note("Stalling: the crowd may take action.");if(this.roll("Crowd Takes Action")>=this.turns[this.active])this.fall(p,{prevented:afterPrevention});
 }
 finish(){const p=this.players.find(q=>q.id===this.mover),result=super.finish();if(result&&p)this.checkStalling(p);return result;}
 checkScore(){
  if(this.feedBeforeScore())return;
  if(this.scoreDeferrals)return;
  if(!["play","charge"].includes(this.phase))return;const p=this.players.find(q=>q.id===this.ball.carrier);
  if(p&&p.status==="standing"&&p.x===(this.right(p.team)?25:0)){this.scores[p.team]++;this.note("TOUCHDOWN — "+this.teams[p.team].name+"! Score "+this.scores.join("–")+".");if(p.team!==this.active){this.turns[p.team]=Math.min(8,this.turns[p.team]+1);this.note("Scoring during the opponent's turn: the scoring team skips its next turn celebrating.");}this.endDrive(p.team);}
 }
 endDrive(scorer){this.phase="endDrive";this.finished=true;this.pending=null;this.mover=null;this.action=null;this.blockAction=null;this.lastScorer=scorer;this.note("End of Drive: resolve recovery and effects before continuing.");}
 continueDrive(){
  if(this.phase!=="endDrive"||this.pending)return false;
  const weapon=this.players.find(p=>p.fieldedDrive===this.drive&&p.weaponResolvedDrive!==this.drive&&this.has(p,"Secret Weapon")&&p.status!=="sent-off");
  if(weapon){weapon.weaponResolvedDrive=this.drive;this.sendOff(weapon,()=>this.continueDrive());return true;}
  const field=this.players.filter(p=>this.onPitch(p));for(const p of this.players)p.heatOut=false;
  if(this.weather==="Sweltering Heat"){const count=Math.ceil(this.roll("Sweltering Heat player count")/2);for(const t of [0,1])for(const p of this.randomPlayers(field.filter(q=>q.team===t),count,"Heat exhaustion")){p.heatOut=true;this.note("Heat: #"+p.number+" misses the next drive.");}}
  for(const p of this.players){if(p.status==="knocked-out"&&this.roll("KO recovery #"+p.number)+this.resourceChoices[p.team].kegs>=4){p.status="reserve";this.note("#"+p.number+" recovers from KO.");}p.snack=false;}
  for(const t of [0,1]){this.rerolls[t]=Math.max(0,this.rerolls[t]-this.driveBonus[t]);this.driveBonus[t]=0;}
  if(this.turns.every(n=>n>=8)){
   if(this.half===2){this.phase="finished";this.note(this.scores[0]===this.scores[1]?"Full time — draw.":"Full time — "+this.teams[this.scores[0]>this.scores[1]?0:1].name+" wins.");return true;}
   this.half=2;this.turns=[0,0];this.rerolls=this.resourceChoices.map(r=>r.teamRerolls+r.extraTraining);this.skip=[false,false];this.note("HALF-TIME: change ends and replenish purchased re-rolls and Extra Training.");this.prepareDrive(this.firstReceiver);return true;
  }
  this.prepareDrive(this.lastScorer??this.kicking);return true;
 }
}
if(typeof module!=="undefined")module.exports={MatchGame,MATCH_RESOURCES};
