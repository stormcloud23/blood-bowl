"use strict";
const MatchBase=typeof module!=="undefined"?require("./skills.cjs").SkillGame:SkillGame;
const MatchSkillGroups=typeof module!=="undefined"?require("./skills.cjs").SKILL_GROUPS:SKILL_GROUPS;
const MATCH_PRAYERS=["Treacherous Trapdoor","Friends with the Ref","Stiletto","Iron Man","Knuckle Dusters","Bad Habits","Greasy Cleats","Blessing of Nuffle","Moles under the Pitch","Perfect Passing","Dazzling Catching","Fan Interaction","Fouling Frenzy","Throw a Rock","Under Scrutiny","Intensive Training"];
// BB2025 profile data; unique ability behavior follows pinned FFB.
const MATCH_STARS=[
 {id:"swift-twins",name:"The Swift Twins",cost:300000,leagues:["Elven Kingdoms League"],players:[
  {id:"lucien-swift",name:"Lucien Swift",ma:7,st:3,ag:"2+",pa:"3+",av:"9+",traits:"Blitzer, Elf",skills:["Block","Loner (4+)","Mighty Blow","Tackle","Working in Tandem (block)"]},
  {id:"valen-swift",name:"Valen Swift",ma:7,st:3,ag:"2+",pa:"2+",av:"9+",traits:"Elf, Thrower",skills:["Accurate","Loner (4+)","Nerves of Steel","Pass","Safe Pass","Sure Hands","Working in Tandem (pass)"]}
 ]},
 {id:"glart-smashrip",name:"Glart Smashrip",cost:175000,ma:5,st:4,ag:"4+",pa:"6+",av:"9+",traits:"Blocker, Skaven",skills:["Block","Claws","Grab","Juggernaut","Loner (4+)","Stand Firm","Frenzied Rush"],leagues:["Underworld Challenge"],primary:"",secondary:"",max:1},
 {id:"morg-n-thorg",name:"Morg 'n' Thorg",cost:340000,ma:6,st:6,ag:"3+",pa:"4+",av:"11+",traits:"Big Guy, Ogre",skills:["Block","Bullseye","Hatred (Undead)","Loner (4+)","Mighty Blow","Thick Skull","Throw Team-mate","The Ballista"],anyTeam:true,excludeLeagues:["Sylvanian Spotlight"],leagues:[],primary:"",secondary:"",max:1},
 {id:"fungus-the-loon",name:"Fungus the Loon",cost:80000,ma:4,st:7,ag:"3+",pa:"-",av:"8+",traits:"Goblin, Special",skills:["Ball & Chain","Loner (4+)","Mighty Blow","No Ball","Secret Weapon","Stunty","Whirling Dervish"],leagues:["Badlands Brawl","Underworld Challenge"],primary:"",secondary:"",max:1},
 {id:"kiroth-krakeneye",name:"Kiroth Krakeneye",cost:160000,ma:7,st:3,ag:"2+",pa:"3+",av:"8+",traits:"Elf, Runner",skills:["Disturbing Presence","Foul Appearance","Loner (4+)","On the Ball","Tackle","Tentacles","Black Ink"],leagues:["Elven Kingdoms League"],primary:"",secondary:"",max:1},
 {id:"zolcath",name:"Zolcath the Zoat",cost:220000,ma:5,st:5,ag:"4+",pa:"5+",av:"10+",traits:"Big Guy, Zoat",skills:["Disturbing Presence","Juggernaut","Loner (4+)","Mighty Blow","Prehensile Tail","Regeneration","Sure Feet",'"Excuse Me, Are You a Zoat?"'],leagues:["Elven Kingdoms League","Lustrian Superleague"],primary:"",secondary:"",max:1},
 {id:"anqi-panqi",name:"Anqi Panqi",cost:190000,ma:7,st:4,ag:"5+",pa:"6+",av:"10+",traits:"Blocker, Lizardman",skills:["Block","Grab","Loner (4+)","Stand Firm","Unsteady","Savage Blow"],leagues:["Lustrian Superleague"],primary:"",secondary:"",max:1},
 {id:"karla-von-kill",name:"Karla von Kill",cost:210000,ma:6,st:4,ag:"3+",pa:"3+",av:"9+",traits:"Blitzer, Human",skills:["Block","Dauntless","Dodge","Jump Up","Loner (4+)","Indomitable"],leagues:["Lustrian Superleague","Old World Classic"],primary:"",secondary:"",max:1},
 {id:"eldril-sidewinder",name:"Eldril Sidewinder",cost:220000,ma:8,st:3,ag:"2+",pa:"3+",av:"8+",traits:"Catcher, Elf",skills:["Catch","Dodge","Hypnotic Gaze","Loner (4+)","Nerves of Steel","On the Ball","Mesmerising Dance"],leagues:["Elven Kingdoms League"],primary:"",secondary:"",max:1},
 {id:"akhorne",name:"Akhorne The Squirrel",cost:80000,ma:7,st:1,ag:"2+",pa:"-",av:"6+",traits:"Blitzer, Squirrel",skills:["Claws","Dauntless","Dodge","Frenzy","Jump Up","Loner (4+)","No Ball","Sidestep","Stunty","Titchy","Blind Rage"],anyTeam:true,leagues:[],primary:"",secondary:"",max:1},
 {id:"ripper-bolgrot",name:"Ripper Bolgrot",cost:250000,ma:5,st:6,ag:"5+",pa:"4+",av:"10+",traits:"Big Guy, Troll",skills:["Bullseye","Grab","Loner (4+)","Mighty Blow","Regeneration","Throw Team-mate","Thinking Man's Troll"],leagues:["Badlands Brawl","Underworld Challenge"],primary:"",secondary:"",max:1},
 {id:"puggy-baconbreath",name:"Puggy Baconbreath",cost:130000,ma:5,st:3,ag:"3+",pa:"3+",av:"8+",traits:"Blitzer, Halfling",skills:["Block","Dodge","Loner (3+)","Nerves of Steel","Right Stuff","Stunty","Halfling Luck"],leagues:["Halfling Thimble Cup","Old World Classic"],primary:"",secondary:"",max:1},
 {id:"hthark",name:"H'thark the Unstoppable",cost:300000,ma:6,st:6,ag:"4+",pa:"6+",av:"10+",traits:"Blitzer, Dwarf",skills:["Block","Break Tackle","Defensive","Juggernaut","Loner (4+)","Sprint","Sure Feet","Thick Skull","Unsteady","Unstoppable Momentum"],leagues:["Badlands Brawl"],special:["Favoured of Hashut"],primary:"",secondary:"",max:1},
 {id:"willow-rosebark",name:"Willow Rosebark",cost:160000,ma:6,st:4,ag:"3+",pa:"5+",av:"9+",traits:"Blitzer, Dryad",skills:["Dauntless","Loner (4+)","Sidestep","Thick Skull","Woodland Fury"],leagues:["Woodland League"],primary:"",secondary:"",max:1},
 {id:"griff-oberwald",name:"Griff Oberwald",cost:300000,ma:7,st:4,ag:"2+",pa:"3+",av:"9+",traits:"Blitzer, Human",skills:["Block","Dodge","Fend","Loner (3+)","Sprint","Sure Feet","Consummate Professional"],leagues:["Old World Classic"],primary:"",secondary:"",max:1},
 {id:"lord-borak",name:"Lord Borak the Despoiler",cost:270000,ma:5,st:5,ag:"3+",pa:"5+",av:"10+",traits:"Blocker, Human",skills:["Block","Dirty Player","Leader","Loner (3+)","Mighty Blow","Put the Boot In","Sneaky Git","Lord of Chaos"],leagues:["Chaos Clash"],primary:"",secondary:"",max:1}
];
// Inducement prices/limits follow the pinned BB2025 FFB option factory.
const MATCH_RESOURCES={
 teamRerolls:{label:"Team re-rolls",group:"staff",max:8,initial:2},
 apothecary:{label:"Team apothecary",group:"staff",max:1,initial:0},
 assistants:{label:"Assistant coaches",group:"staff",max:6,cost:10000,initial:0},
 cheerleaders:{label:"Cheerleaders",group:"staff",max:6,cost:10000,initial:0},
 dedicatedFans:{label:"Dedicated Fans",group:"staff",min:1,max:6,cost:5000,initial:1},
 bribes:{label:"Bribes",group:"inducement",max:3,cost:100000,initial:0},
 mortuaryAssistants:{label:"Mortuary Assistants",group:"inducement",max:1,cost:100000,initial:0},
 plagueDoctors:{label:"Plague Doctors",group:"inducement",max:1,cost:100000,initial:0},
 weatherMages:{label:"Weather Mages",group:"inducement",max:1,cost:30000,initial:0},
 mascots:{label:"Team Mascots",group:"inducement",max:1,cost:25000,initial:0},
 biasedRefs:{label:"Biased Referees",group:"inducement",max:1,cost:120000,initial:0},
 kegs:{label:"Blitzer's Best Kegs",group:"inducement",max:2,cost:50000,initial:0},
 extraTraining:{label:"Extra Training",group:"inducement",max:4,cost:100000,initial:0},
 wanderingApothecaries:{label:"Wandering Apothecaries",group:"inducement",max:2,cost:100000,initial:0},
 tempCoaches:{label:"Part-time Assistant Coaches",group:"inducement",max:3,cost:20000,initial:0},
 tempCheerleaders:{label:"Temp Agency Cheerleaders",group:"inducement",max:4,cost:20000,initial:0},
 masterChef:{label:"Halfling Master Chef",group:"inducement",max:1,cost:300000,initial:0},
 riotousRookies:{label:"Riotous Rookies",group:"inducement",max:1,cost:100000,initial:0},
 wizards:{label:"Wizard",group:"inducement",max:1,cost:150000,initial:0},
 josefBugman:{label:"Josef Bugman",group:"inducement",max:1,cost:100000,initial:0}
};
class MatchGame extends MatchBase {
 constructor(teams,{dice=null,learning=false,resources=null}={}){
  super(teams,{dice});this.events=[];this.match=true;this.learning=learning;this.phase="fans";this.half=1;this.drive=0;this.scores=[0,0];this.turns=[0,0];
  this.fans=[0,0];this.dedicatedFans=[1,1];this.weather="Perfect Conditions";this.cheer=[false,false];this.driveBonus=[0,0];this.bribes=[0,0];this.skip=[false,false];this.ball={x:null,y:null,carrier:null};
  this.league=teams.every(t=>t.leagueTeamId);
  this.resourceChoices=teams.map((t,i)=>({...Object.fromEntries(Object.entries(MATCH_RESOURCES).map(([key,spec])=>[key,spec.initial])),...(resources?.[i]||t.matchResources||{})}));
  for(const team of [0,1])for(const [key,value] of Object.entries(this.resourceChoices[team]))if(!this.validResource(team,key,value))throw new Error("Invalid match resource: "+key);
  this.playerStats={};this.stalledTeams=[false,false];this.prayers=[[],[]];this.prayerHistory=[];this.rocks=[0,0];this.selectedStars=[[],[]];
  if(this.league)for(const [team,t] of teams.entries())for(const [i,p] of this.players.filter(p=>p.team===team).entries()){const record=t.matchPlayers[i];Object.assign(p,{leaguePlayerId:record.id,profileOverride:record.profile,nigglingInjuries:record.nigglingInjuries,journeyman:!!record.journeyman,leagueRecord:record,number:record.number,captain:!!record.captain});}
  this.swarmCounts=[0,0];this.raisedDeadUsed=[false,false];
  const high=teams[0].ctv>teams[1].ctv?0:1;this.leaguePurchaseOrder=this.league&&teams[0].ctv!==teams[1].ctv?[high,1-high]:[];this.leaguePurchaseStep=0;
  this.refreshResources();this.chefHalf=0;this.chefHistory=[];
  this.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));this.note(this.league?"League fixture: roster resources are fixed; complete inducement purchases after fans and weather.":"Exhibition match: configure staff and basic inducements before determining fans. Selected named stars and their unique abilities are available under inducements.");
 }
 hasTeamRule(team,name){const roster=this.teams[team],rules=[...(roster.special||[]),...(roster.leagueRules?.[roster.league]||[])];if(roster.alignments?.length)rules.push("Favoured of "+(roster.alignment||roster.alignments[0]));return rules.some(rule=>rule.toLowerCase()===name.toLowerCase());}
 afterDeath(victim,record,done){const team=1-victim.team;if(!this.hasTeamRule(team,"Masters of Undeath")||this.plagueUsed[team]||this.profile(victim).st>4||this.has(victim,"Stunty")){done();return;}const roles=this.teams[team].positions.map((p,i)=>p.traits.includes("Lineman")?i:-1).filter(i=>i>=0),raise=role=>{this.plagueUsed[team]=true;this.raisedDeadUsed[team]=true;const p=this.addRaisedLineman(team,role,victim,"Masters of Undeath");this.note("Masters of Undeath: #"+p.number+" joins reserves.");done();};if(!roles.length){done();return;}if(roles.length===1){raise(roles[0]);return;}const options=roles.map(role=>"Raise "+this.teams[team].positions[role].name);this.skillChoice("Raise Dead lineman",team,options,choice=>raise(roles[options.indexOf(choice)]));}
 chooseCaptain(team,id){if(this.league||this.phase!=="fans"||this.pending||!this.hasTeamRule(team,"Team Captain"))return false;const p=this.players.find(p=>p.id===id&&p.team===team&&!p.star&&!p.mercenary&&!this.bigGuy(p));if(!p)return false;for(const old of this.players.filter(p=>p.team===team&&p.captain)){old.captain=false;if(old.captainGrantedPro)old.extraSkills=(old.extraSkills||[]).filter(s=>s!=="Pro");old.captainGrantedPro=false;}p.captain=true;p.captainGrantedPro=!this.has(p,"Pro");if(p.captainGrantedPro)p.extraSkills=[...(p.extraSkills||[]),"Pro"];return true;}
 configureCaptain(team){if(this.league||this.phase!=="fans"||this.pending||!this.hasTeamRule(team,"Team Captain"))return false;const players=this.players.filter(p=>p.team===team&&!p.star&&!p.mercenary&&!this.bigGuy(p)),options=players.map(p=>"Captain #"+p.number);this.skillChoice("Choose Team Captain",team,[...options,"Keep current choice"],choice=>{const p=players[options.indexOf(choice)];if(p)this.chooseCaptain(team,p.id);});return true;}
 captainSaves(team){if(!this.players.some(p=>p.team===team&&p.captain&&this.onPitch(p)))return false;const saved=this.roll("Team Captain saves re-roll on 6")===6;this.note(saved?"Team Captain preserves the re-roll.":"Team Captain does not preserve the re-roll.");return saved;}
 useTeamReroll(p){if(!this.canTeamReroll(p))return false;if(!this.captainSaves(p.team))return super.useTeamReroll(p);const loner=this.parameter(p,"Loner");return !loner||this.roll("Loner needs "+loner.match(/\d+/)[0]+"+")>=Number(loner.match(/\d+/)[0]);}
 resourceSpec(team,key){
  const base=MATCH_RESOURCES[key];if(!base)return null;const spec={...base};
  if(key==="dedicatedFans"&&this.league)spec.max=7;
  if(key==="teamRerolls")spec.cost=this.teams[team].reroll;
  if(key==="apothecary"){spec.cost=this.teams[team].staff?.apothecary||0;if(!spec.cost)spec.max=0;}
  if(key==="wanderingApothecaries"&&!this.teams[team].staff?.apothecary)spec.max=0;
  if(key==="bribes"&&this.hasTeamRule(team,"Bribery and Corruption")){spec.cost=50000;spec.max=6;}
  if(key==="mortuaryAssistants"&&!this.hasTeamRule(team,"Masters of Undeath"))spec.max=0;
  if(key==="plagueDoctors"&&!this.hasTeamRule(team,"Favoured of Nurgle"))spec.max=0;
  if(key==="biasedRefs"&&this.hasTeamRule(team,"Bribery and Corruption"))spec.cost=80000;
  if(key==="masterChef"&&(this.teams[team].rosterKeywords||[]).some(k=>k.toLowerCase()==="master chef"))spec.cost=100000;
  if(key==="riotousRookies"&&!this.hasTeamRule(team,"Low Cost Linemen"))spec.max=0;
  return spec;
 }
 validResource(team,key,value){if(![0,1].includes(team)||!Number.isInteger(value))return false;const spec=this.resourceSpec(team,key);return !!spec&&value>=(spec.min||0)&&value<=spec.max;}
 setResource(team,key,value){
  if(this.phase!==(this.league?"leagueSteps":"fans")||this.pending||!this.validResource(team,key,value))return false;
  if(this.league&&(MATCH_RESOURCES[key].group==="staff"||this.leaguePurchaseOrder[this.leaguePurchaseStep]!==team))return false;
  const old=this.resourceChoices[team][key];this.resourceChoices[team][key]=value;
  if(this.league&&[0,1].some(t=>this.resourceCosts(t).inducements>this.leagueBudget(t))){this.resourceChoices[team][key]=old;return false;}
  this.refreshResources();return true;
 }
 configureResources(team){
  if(this.phase!==(this.league?"leagueSteps":"fans")||this.pending||![0,1].includes(team)||this.league&&this.leaguePurchaseOrder[this.leaguePurchaseStep]!==team)return false;
  const menu=()=>{
   const keys=Object.keys(MATCH_RESOURCES).filter(key=>this.resourceSpec(team,key).max>0&&(!this.league||MATCH_RESOURCES[key].group==="inducement")),options=keys.map(key=>this.resourceSpec(team,key).label+": "+this.resourceChoices[team][key]);
   this.skillChoice("Staff and inducements — "+this.teams[team].name,team,[...options,"Mercenaries","Star players","Done"],choice=>{
    if(choice==="Star players"){this.configureStars(team,menu);return;}
    if(choice==="Mercenaries"){this.configureMercenaries(team,menu);return;}
    const key=keys[options.indexOf(choice)];if(!key){if(choice==="Done"&&this.league)this.lockLeagueInducements(team);return;}
    const spec=this.resourceSpec(team,key),values=Array.from({length:spec.max-(spec.min||0)+1},(_,i)=>i+(spec.min||0)),labels=values.map(value=>value+" — "+((key==="dedicatedFans"?value-1:value)*spec.cost).toLocaleString()+" gp");
    this.skillChoice(spec.label,team,[...labels,"Back"],label=>{const index=labels.indexOf(label);if(index>=0)this.setResource(team,key,values[index]);menu();});
   });
  };menu();return true;
 }
 canBuyPlayers(team){return [0,1].includes(team)&&!this.pending&&this.phase===(this.league?"leagueSteps":"fans")&&(!this.league||this.leaguePurchaseOrder[this.leaguePurchaseStep]===team);}
 starEligible(team,star){return !!star&&!(star.excludeLeagues||[]).includes(this.teams[team].league)&&(star.anyTeam||star.leagues.includes(this.teams[team].league)||(star.special||[]).some(rule=>this.hasTeamRule(team,rule)));}
 canHireStar(team,id){
  const star=MATCH_STARS.find(s=>s.id===id);return this.canBuyPlayers(team)&&this.starEligible(team,star)&&this.selectedStars[team].length<2&&!this.selectedStars[team].includes(id)&&this.players.filter(p=>p.team===team).length+(star.players?.length||1)<=16&&(!this.league||this.resourceCosts(team).inducements+star.cost<=this.leagueBudget(team));
 }
 hireStar(team,id){
  if(!this.canHireStar(team,id))return false;const star=MATCH_STARS.find(s=>s.id===id),number=Math.max(0,...this.players.filter(p=>p.team===team).map(p=>p.number))+1;
  const hired=(star.players||[star]).map((profile,i)=>({id:team+"-"+(number+i),number:number+i,team,role:0,star:id,starRole:profile.id,pairedStar:!!star.players,profileOverride:JSON.parse(JSON.stringify({...profile,cost:star.cost,max:1,primary:"",secondary:""})),x:null,y:null,status:"reserve",used:false,spent:0}));
  this.selectedStars[team].push(id);this.players.push(...hired);this.note(star.name+" hired by "+this.teams[team].name+" for "+star.cost.toLocaleString()+" gp.");return hired[0];
 }

 removeStar(team,id){if(!this.canBuyPlayers(team)||!this.selectedStars[team].includes(id))return false;this.selectedStars[team]=this.selectedStars[team].filter(s=>s!==id);this.players=this.players.filter(p=>p.team!==team||p.star!==id);return true;}
 configureStars(team,back){
  if(!this.canBuyPlayers(team))return false;
  const menu=()=>{const stars=MATCH_STARS.filter(s=>this.starEligible(team,s)),options=stars.map(s=>(this.selectedStars[team].includes(s.id)?"Remove ":"Hire ")+s.name+" — "+s.cost.toLocaleString()+" gp");
   this.skillChoice("Star players — max two hires; pairs need two roster places; no MVP or permanent recruitment",team,[...options,"Back"],choice=>{
    if(choice==="Back"){back();return;}const star=stars[options.indexOf(choice)];if(!star)return;
    if(this.selectedStars[team].includes(star.id)){this.removeStar(team,star.id);menu();return;}
    this.skillChoice((star.players||[star]).map(p=>p.name+" — MA"+p.ma+" ST"+p.st+" AG"+p.ag+" PA"+p.pa+" AV"+p.av+"; "+p.skills.join(", ")).join(" | "),team,["Confirm hire","Back"],choice=>{if(choice==="Confirm hire"&&!this.hireStar(team,star.id))this.note("Star purchase rejected: check the available budget, roster slots and two-star-selection limit.");menu();});
   });
  };menu();return true;
 }
 finalizeStars(){
  if(this.starsFinalized)return;this.starsFinalized=true;
  const duplicates=this.selectedStars[0].filter(id=>this.selectedStars[1].includes(id));
  for(const id of duplicates){this.players=this.players.filter(p=>p.star!==id);this.note(MATCH_STARS.find(s=>s.id===id).name+" was hired by both teams and plays for neither; both fees remain spent.");}
 }
 chainDirection(p,direction,done){
  const n=this.roll("Ball & Chain direction");if(!this.has(p,"Whirling Dervish")||this.used(p,"Whirling Dervish")){done(n);return;}
  const fans={North:[[-1,-1],[0,-1],[1,-1]],East:[[1,-1],[1,0],[1,1]],South:[[1,1],[0,1],[-1,1]],West:[[-1,1],[-1,0],[-1,-1]]},[dx,dy]=fans[direction][Math.ceil(n/2)-1],x=p.x+dx,y=p.y+dy;this.skillChoice("Whirling Dervish — "+direction+" direction roll "+n+" → "+(this.inside(x,y)?(x+1)+", "+(y+1):"crowd"),p.team,["Keep direction roll "+n,"Use Whirling Dervish"],choice=>{if(choice==="Use Whirling Dervish"){this.use(p,"Whirling Dervish");done(this.roll("Ball & Chain direction re-roll (Whirling Dervish)"));}else done(n);});
 }
 starDistraction(p){if(this.has(p,"Black Ink"))return "Black Ink";if(this.has(p,'"Excuse Me, Are You a Zoat?"'))return '"Excuse Me, Are You a Zoat?"';return null;}
 starDistractionTargets(p){
  const name=this.starDistraction(p);if(!name||p.starDistractionUsed||!this.onPitch(p)||p.status!=="standing"||p.distracted)return [];
  return this.players.filter(q=>q.team!==p.team&&this.onPitch(q)&&!q.distracted&&(name==="Black Ink"?["standing","prone"].includes(q.status)&&this.distance(p,q)===1:q.status==="standing"&&this.distance(p,q)<=3));
 }
 offerStarDistraction(p,done=()=>{}){
  if(this.pending||!["play","charge"].includes(this.phase)||p.team!==this.active||this.mover!==p.id)return false;
  const name=this.starDistraction(p),targets=this.starDistractionTargets(p);if(!targets.length){done();return false;}
  const labels=targets.map(q=>"Distract "+this.teams[q.team].name+" #"+q.number);
  this.skillChoice(name,p.team,[...labels,"Keep "+name],choice=>{const q=targets[labels.indexOf(choice)];if(q){p.starDistractionUsed=true;q.distracted=true;this.refreshChomps();this.note(name+": "+this.teams[q.team].name+" #"+q.number+" is Distracted until their next activation.");}done();});return true;
 }
 offerFrenziedRush(p,action,done){if(action!=="blitz"||!this.has(p,"Frenzied Rush")||p.frenziedRushHalf===this.half){done();return;}this.skillChoice("Frenzied Rush — "+this.profile(p).name,p.team,["Use Frenzied Rush","Keep Frenzied Rush"],choice=>{if(choice==="Use Frenzied Rush"){p.frenziedRushHalf=this.half;p.frenziedRushTurn=this.skillTurn;this.note("Frenzied Rush: Frenzy for this activation; Grab is unavailable this turn.");}done();});}
 activationExtra(p,action,ready,failed){super.activationExtra(p,action,()=>this.offerFrenziedRush(p,action,()=>this.offerStarDistraction(p,ready)),failed);}
 afterDauntless(p,target,done){
  if(!this.has(p,"Indomitable")||p.indomitableUsed){super.afterDauntless(p,target,done);return;}
  this.skillChoice("Indomitable — "+this.profile(p).name,p.team,["Use Indomitable","Keep Indomitable"],choice=>{const use=choice==="Use Indomitable";if(use)p.indomitableUsed=true;p.blockST=+this.profile(target).st*(use?2:1);this.note("#"+p.number+" Dauntless strength: "+p.blockST+" before assists.");done();});
 }
 actionRerollSources(p,kind){return [...this.singleDieSources(p),...(["Pass","Throw Team-mate","Kick Team-mate"].includes(kind)&&this.has(p,"The Ballista")&&!p.ballistaUsed?["The Ballista"]:[]),...(kind==="Hypnotic Gaze"&&this.has(p,"Mesmerising Dance")&&p.danceHalf!==this.half?["Mesmerising Dance"]:[])];}
 useActionRerollSource(p,kind,source){if(!this.actionRerollSources(p,kind).includes(source))return false;if(source==="The Ballista"){p.ballistaUsed=true;this.note("#"+p.number+" uses The Ballista.");return true;}if(source==="Mesmerising Dance"){p.danceHalf=this.half;this.note("#"+p.number+" uses Mesmerising Dance.");return true;}return this.useSingleDieSource(p,source);}
 savageBlockSelections(){const b=this.blockAction;if(this.pending?.type!=="blockSelect"||!b||b.poolLocked||!this.has(b.attacker,"Savage Blow")||b.attacker.savageBlowUsed)return [];return Array.from({length:2**b.dice.length-1},(_,i)=>b.dice.map((_,j)=>j).filter(j=>(i+1)&(1<<j)));}
 rerollSavageBlock(indices){const b=this.blockAction;if(!Array.isArray(indices)||!indices.length||new Set(indices).size!==indices.length||!this.savageBlockSelections().some(list=>list.length===indices.length&&list.every(i=>indices.includes(i))))return false;b.attacker.savageBlowUsed=true;b.poolLocked=true;for(const i of [...indices].sort((a,b)=>a-b))b.dice[i]=this.roll("Savage Blow re-roll die "+(i+1));this.pending={type:"blockSelect"};return true;}
 singleDieSources(p){return [this.has(p,"Thinking Man's Troll")&&p.thinkingHalf!==this.half?"Thinking Man's Troll":null,this.has(p,"Halfling Luck")&&!p.halflingLuckUsed?"Halfling Luck":null].filter(Boolean);}
 useSingleDieSource(p,source){if(!this.singleDieSources(p).includes(source))return false;if(source==="Thinking Man's Troll")p.thinkingHalf=this.half;else p.halflingLuckUsed=true;this.note("#"+p.number+" uses "+source+".");return true;}
 automaticTestReroll(p,kind){return kind==="Dauntless"&&this.has(p,"Blind Rage")?"Blind Rage":null;}
 additionalTestModifiers(p,kind){
  return this.has(p,"Consummate Professional")&&!p.consummateUsed&&["Dodge","Jump","Pick up","Catch","Intercept","Landing","Jump Up Block"].includes(kind)?[{name:"Consummate Professional",bonus:1,use:()=>{p.consummateUsed=true;this.note("#"+p.number+" uses Consummate Professional (+1 to this Agility Test).");}}]:[];
 }
 tandemBlockAvailable(a,target){return this.parameter(a,"Working in Tandem")==="Working in Tandem (block)"&&this.players.some(p=>p!==a&&p.team===a.team&&this.onPitch(p)&&p.status==="standing"&&!p.distracted&&this.distance(p,target)===1&&this.parameter(p,"Working in Tandem")==="Working in Tandem (pass)");}
 starBlockSources(){
  const b=this.blockAction,a=b?.attacker;if(!b||this.pending?.type!=="blockSelect"||b.poolLocked)return [];
  const safe=this.has(a,"Block")||this.has(a,"Wrestle")||b.blitz&&this.has(a,"Juggernaut"),down=die=>die===1||die===2&&!safe,wouldFall=b.chooserTeam!==a.team?b.dice.some(down):b.dice.every(down);
  return [...this.singleDieSources(a),this.tandemBlockAvailable(a,b.target)?"Working in Tandem":null,this.has(a,"Lord of Chaos")&&!a.lordOfChaosUsed?"Lord of Chaos":null,this.has(a,"Unstoppable Momentum")&&b.blitz?"Unstoppable Momentum":null,this.has(a,"Woodland Fury")&&!a.woodlandFuryUsed&&wouldFall?"Woodland Fury":null].filter(Boolean);
 }
 rerollStarBlock(source,index){
  const b=this.blockAction,a=b?.attacker;if(!b||this.pending?.type!=="blockSelect"||b.poolLocked||!this.starBlockSources().includes(source)||!Number.isInteger(index)||index<0||index>=b.dice.length)return false;
  if(this.singleDieSources(a).includes(source))this.useSingleDieSource(a,source);if(source==="Lord of Chaos")a.lordOfChaosUsed=true;if(source==="Woodland Fury")a.woodlandFuryUsed=true;b.poolLocked=true;b.dice[index]=this.roll(source+" re-roll die "+(index+1));this.pending={type:"blockSelect"};return true;
 }
 mercenarySkills(team,role){const p=this.teams[team]?.positions[role];if(!p)return [];const access=p.primary.split(/\s+/);return Object.entries(MatchSkillGroups).filter(([cat])=>cat!=="Traits"&&access.includes(cat[0])).flatMap(([,skills])=>skills).filter(s=>!p.skills.includes(s)).sort();}
 canHireMercenary(team,role){
  if(!this.canBuyPlayers(team))return false;const roster=this.teams[team],profile=roster.positions[role],players=this.players.filter(p=>p.team===team);
  return !!profile&&players.length<16&&players.filter(p=>!p.star&&p.role===role).length<profile.max&&!(roster.groupLimits||[]).some(g=>g.roles.includes(role)&&players.filter(p=>!p.star&&g.roles.includes(p.role)).length>=g.max);
 }
 hireMercenary(team,role,skill=null){
  if(!this.canHireMercenary(team,role)||skill!==null&&!this.mercenarySkills(team,role).includes(skill))return false;
  const cost=this.teams[team].positions[role].cost+30000+(skill?50000:0);
  if(this.league&&this.resourceCosts(team).inducements+cost>this.leagueBudget(team))return false;
  const p=this.addRaisedLineman(team,role,{},"Mercenary");delete p.raisedKind;delete p.raisedFrom;p.mercenary=true;p.inducementCost=cost;
  p.profileOverride=JSON.parse(JSON.stringify(this.teams[team].positions[role]));p.profileOverride.name="Mercenary "+p.profileOverride.name;p.profileOverride.skills=[...new Set([...p.profileOverride.skills.filter(s=>!s.startsWith("Loner")),"Loner (4+)",...(skill?[skill]:[])])];
  if(p.leagueRecord){p.leagueRecord.name=p.profileOverride.name+" #"+p.number;p.leagueRecord.profile=p.profileOverride;}
  this.note("Mercenary #"+p.number+" "+p.profileOverride.name+" hired for "+cost.toLocaleString()+" gp.");return p;
 }
 removeMercenary(team,id){if(!this.canBuyPlayers(team))return false;const p=this.players.find(p=>p.id===id&&p.team===team&&p.mercenary);if(!p)return false;this.players=this.players.filter(q=>q!==p);return true;}
 configureMercenaries(team,back){
  if(!this.canBuyPlayers(team))return false;
  const menu=()=>{
   const roster=this.teams[team],roles=roster.positions.map((p,i)=>i).filter(i=>this.canHireMercenary(team,i)),hired=this.players.filter(p=>p.team===team&&p.mercenary),labels=roles.map(i=>"Hire "+roster.positions[i].name+" — "+(roster.positions[i].cost+30000).toLocaleString()+" gp"),remove=hired.map(p=>"Remove mercenary #"+p.number);
   this.skillChoice("Mercenaries — Loner (4+), one optional Primary skill for 50,000 gp",team,[...labels,...remove,"Back"],choice=>{
    if(choice==="Back"){back();return;}const hiredPlayer=hired[remove.indexOf(choice)];if(hiredPlayer){this.removeMercenary(team,hiredPlayer.id);menu();return;}
    const role=roles[labels.indexOf(choice)];if(role===undefined){menu();return;}
    const skills=this.mercenarySkills(team,role);
    this.skillChoice("Mercenary "+roster.positions[role].name,team,["Hire without extra skill",...skills.map(s=>"Hire with "+s+" (+50,000 gp)"),"Back"],choice=>{
     if(choice!=="Back"){const skill=choice==="Hire without extra skill"?null:skills.find(s=>choice==="Hire with "+s+" (+50,000 gp)");if(!this.hireMercenary(team,role,skill))this.note("Mercenary purchase rejected: check the available budget and roster limits.");}menu();
    });
   });
  };menu();return true;
 }
 lockLeagueInducements(team){if(this.phase!=="leagueSteps"||this.pending||this.leaguePurchaseOrder[this.leaguePurchaseStep]!==team)return false;this.leaguePurchaseStep++;return true;}
 applyRiotousRookies(){if(this.rookiesApplied)return;this.rookiesApplied=true;for(const team of [0,1])if(this.resourceChoices[team].riotousRookies){const role=this.teams[team].positions.findIndex(p=>p.traits.includes("Lineman"));if(role<0)continue;const count=this.roll("Riotous Rookies D3",3)+this.roll("Riotous Rookies D3",3)+1;for(let i=0;i<count;i++){const p=this.addRaisedLineman(team,role,{},"Riotous Rookies");delete p.raisedKind;delete p.raisedFrom;p.riotousRookie=true;p.journeyman=true;if(p.leagueRecord){p.leagueRecord.name="Riotous Rookie #"+p.number;p.leagueRecord.journeyman=true;p.leagueRecord.profile.skills.push("Loner (4+)");}else p.extraSkills=["Loner (4+)"];}this.note(this.teams[team].name+" receives "+count+" Riotous Rookies with Loner (4+).");}}
 leagueBudget(team){const diff=this.teams[team].ctv-this.teams[1-team].ctv;if(diff===0)return 0;if(diff>0)return this.teams[team].treasury;return -diff+this.resourceCosts(1-team).inducements+Math.min(50000,this.teams[team].treasury);}
 leagueTreasurySpend(team){const diff=this.teams[team].ctv-this.teams[1-team].ctv,cost=this.resourceCosts(team).inducements;return diff>=0?cost:Math.max(0,cost-(-diff+this.resourceCosts(1-team).inducements));}
 medicalSources(p){if(p.zapped)return [];const result=super.medicalSources(p);if(this.plagueDoctors?.[p.team]>0)result.push("Use Plague Doctor");return result;}
 useMedicalSource(p,choice){if(p.zapped)return false;if(choice!=="Use Plague Doctor")return super.useMedicalSource(p,choice);if(!this.plagueDoctors?.[p.team])return false;this.plagueDoctors[p.team]--;return true;}
 regenerationSources(p){const sources=this.mortuaryAssistants?.[p.team]>0?["Mortuary Assistant"]:this.plagueDoctors?.[p.team]>0?["Plague Doctor"]:super.regenerationSources(p);return [...sources,...this.singleDieSources(p)];}
 useRegenerationSource(p,source){if(this.singleDieSources(p).includes(source))return this.useSingleDieSource(p,source);if(source==="Mortuary Assistant"&&this.mortuaryAssistants[p.team]>0){this.mortuaryAssistants[p.team]--;return true;}if(source==="Plague Doctor"&&this.plagueDoctors[p.team]>0){this.plagueDoctors[p.team]--;return true;}return super.useRegenerationSource(p,source);}
 isRerollSource(source){return ["Team","Mascot","Mascot then Team"].includes(source);}
 rerollSources(p){const result=super.rerollSources(p);if(this.teamRerollAllowed(p)&&this.mascots?.[p.team]>0){result.push("Mascot");if(this.canTeamReroll(p))result.push("Mascot then Team");}return result;}
 useRerollSource(p,source){
  if(source==="Team")return super.useRerollSource(p,source);
  if(!["Mascot","Mascot then Team"].includes(source)||!this.rerollSources(p).includes(source))return false;
  const success=this.roll("Mascot needs 4+")>=4;if(!success||!this.captainSaves(p.team))this.mascots[p.team]--;this.note(success?"Mascot grants the re-roll.":"Mascot fails to grant the re-roll.");
  if(!success)return source==="Mascot then Team"&&this.useTeamReroll(p);
  const loner=this.parameter(p,"Loner");return !loner||this.roll("Loner for Mascot")>=Number(loner.match(/\d+/)[0]);
 }
 refreshResources(){
  this.dwarfenWisdom=this.resourceChoices.map(r=>r.josefBugman);
  this.wizards=this.resourceChoices.map(r=>r.wizards);
  this.baseRerolls=this.resourceChoices.map(r=>r.teamRerolls);
  this.rerolls=this.resourceChoices.map(r=>r.teamRerolls+r.extraTraining);
  this.apothecaries=this.resourceChoices.map(r=>r.apothecary+r.wanderingApothecaries);
  this.mortuaryAssistants=this.resourceChoices.map(r=>r.mortuaryAssistants);this.plagueDoctors=this.resourceChoices.map(r=>r.plagueDoctors);this.weatherMages=this.resourceChoices.map(r=>r.weatherMages);this.mascots=this.resourceChoices.map(r=>r.mascots);this.biasedRefs=this.resourceChoices.map(r=>r.biasedRefs);this.bribes=this.resourceChoices.map(r=>r.bribes);this.dedicatedFans=this.resourceChoices.map(r=>r.dedicatedFans);
  this.argueRerolls=this.resourceChoices.map((r,t)=>this.hasTeamRule(t,"Bribery and Corruption")?1:0);
 }
 resourceCosts(team){
  let staff=0,inducements=this.selectedStars[team].reduce((n,id)=>n+MATCH_STARS.find(s=>s.id===id).cost,0)+this.players.filter(p=>p.team===team&&p.mercenary).reduce((n,p)=>n+p.inducementCost,0),fans=0;
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
 teamSppAwards(team){const brutes=this.hasTeamRule(team,"Brawlin' Brutes");return {touchdown:brutes?2:3,casualty:brutes?3:2,completion:this.hasPrayer(team,"Perfect Passing")?2:1,interception:2,mvp:4,...(this.hasPrayer(team,"Dazzling Catching")?{prayerCatch:1}:{})};}
 profile(p){let base=super.profile(p);if(p.zapped)base={...base,name:"Frog ("+base.name+")",ma:5,st:1,ag:"2+",pa:"-",av:"5+",skills:["Dodge","No Ball","Titchy","Stunty","Very Long Legs","Leap"]};if(p.prayerSkills||p.prayerMA||p.prayerAV)base={...base,ma:Math.max(1,base.ma+(p.prayerMA||0)),av:Math.min(11,parseInt(base.av)+(p.prayerAV||0))+"+",skills:[...new Set([...base.skills,...(p.prayerSkills||[])])].filter(s=>!(p.disabledSkills||[]).includes(s))};if(!p.zapped&&p.frenziedRushTurn===this.skillTurn){base={...base,skills:base.skills.filter(s=>s!=="Grab")};if((this.mover===p.id||this.blockAction?.attacker===p)&&!(p.disabledSkills||[]).includes("Frenzy"))base.skills=[...new Set([...base.skills,"Frenzy"])];}return p.snack?{...base,ma:Math.max(1,base.ma-1),av:Math.max(3,parseInt(base.av)-1)+"+"}:base;}
 hasPrayer(team,name){return !!this.prayers?.[team]?.includes(name);}
 prayerValue(team){const t=this.teams[team];return (t.ctv??t.lineup.reduce((n,r)=>n+(this.hasTeamRule(team,"Low Cost Linemen")&&t.positions[r].traits.includes("Lineman")?0:t.positions[r].cost),0)+this.resourceCosts(team).staff)+this.resourceCosts(team).inducements;}
 finishInducementPurchases(){
  if(this.prayersApplied)return false;this.finalizeStars();this.prayersApplied=true;this.phase="prayers";
  const values=[this.prayerValue(0),this.prayerValue(1)],team=values[0]<values[1]?0:1,count=this.learning?0:Math.min(16,Math.floor(Math.abs(values[0]-values[1])/50000));
  this.prayerValues=values;this.prayerCount=count;this.note("Post-inducement values: "+values.map(n=>n.toLocaleString()).join(" / ")+" gp; "+count+" underdog prayer(s).");
  const pool=[...MATCH_PRAYERS],queue=[];for(let i=0;i<count;i++){const index=this.roll("Underdog Prayer selection",pool.length)-1;queue.push(pool.splice(index,1)[0]);}
  const next=()=>{if(queue.length){this.applyPrayer(team,queue.shift(),next);return;}this.applyRiotousRookies();this.phase="rolloff";this.note("Inducements and prayers are ready.");};next();return true;
 }
 prayerPlayers(team){return this.players.filter(p=>p.team===team&&p.status==="reserve"&&!p.star&&!p.eaten);}
 prayerSkillOptions(p){const access=this.profile(p).primary.split(/\s+/),needs={"Lethal Flight":"Right Stuff","Saboteur":"Secret Weapon","Strong Arm":"Throw Team-mate","Bullseye":"Throw Team-mate"},conflicts=[["Frenzy","Grab"],["Frenzy","Hit and Run"],["Leap","Pogo"]];return Object.entries(MatchSkillGroups).filter(([cat])=>cat!=="Traits"&&access.includes(cat[0])).flatMap(([,names])=>names).filter(s=>!this.has(p,s)&&(!needs[s]||this.has(p,needs[s]))&&!conflicts.some(([a,b])=>s===a&&this.has(p,b)||s===b&&this.has(p,a))).sort();}
 applyPrayer(team,name,done=()=>{}){
  if(![0,1].includes(team)||!MATCH_PRAYERS.includes(name)||this.pending||this.hasPrayer(team,name))return false;
  this.prayers[team].push(name);const record={team,name,players:[]};this.prayerHistory.push(record);this.note(this.teams[team].name+" prayer: "+name+" (until full time).");
  const add=(p,skill)=>{if(skill)p.prayerSkills=[...new Set([...(p.prayerSkills||[]),skill])];record.players.push(p.id);this.note(name+": "+this.teams[p.team].name+" #"+p.number+(skill?" gains "+skill:" is affected")+".");};
  const wasted=()=>{record.wasted=true;this.note(name+": no eligible player; effect is wasted.");done();};
  if(name==="Throw a Rock"){this.rocks[team]++;done();return true;}
  if(["Iron Man","Knuckle Dusters"].includes(name)){
   const list=this.prayerPlayers(team).filter(p=>name==="Iron Man"?parseInt(this.profile(p).av)<11:!this.has(p,"Mighty Blow"));if(!list.length){wasted();return true;}
   const labels=list.map(p=>"#"+p.number+" · "+this.profile(p).name);this.skillChoice(name+" — choose player",team,labels,choice=>{const p=list[labels.indexOf(choice)];if(name==="Iron Man"){p.prayerAV=1;add(p);}else add(p,"Mighty Blow");done();});return true;
  }
  const skills={Stiletto:"Stab","Blessing of Nuffle":"Pro","Bad Habits":"Loner (2+)"};
  if(["Stiletto","Blessing of Nuffle","Bad Habits","Greasy Cleats","Intensive Training"].includes(name)){
   const other=["Bad Habits","Greasy Cleats"].includes(name),list=this.prayerPlayers(other?1-team:team).filter(p=>name!=="Bad Habits"||!this.parameter(p,"Loner")),count=name==="Bad Habits"?this.roll("Bad Habits players",3):1,chosen=this.randomPlayers(list,count,name+" player");
   if(!chosen.length){wasted();return true;}
   if(name==="Intensive Training"){const p=chosen[0],options=this.prayerSkillOptions(p);if(!options.length){wasted();return true;}this.skillChoice(name+" — #"+p.number+" choose Primary skill",team,options,skill=>{add(p,skill);done();});return true;}
   for(const p of chosen){if(name==="Greasy Cleats")p.prayerMA=-1;add(p,skills[name]);}done();return true;
  }
  done();return true;
 }
 argueModifier(team,roll){return this.hasPrayer(team,"Friends with the Ref")&&roll>1?1:0;}
 foulSpottedOnBreak(team){return this.hasPrayer(1-team,"Under Scrutiny");}
 prayerCasualtySpp(victim,source){const p=this.players.find(p=>p.id===source?.playerId);return p&&p.team!==victim.team&&(source.cause==="Foul"&&this.hasPrayer(p.team,"Fouling Frenzy")||["Crowd push","Trapdoor push"].includes(source.cause)&&this.hasPrayer(p.team,"Fan Interaction"));}
 crowdSource(victim){const a=this.blockAction?.attacker;return a&&a.team!==victim.team&&this.hasPrayer(a.team,"Fan Interaction")?{playerId:a.id,cause:"Crowd push"}:null;}
 forecastTarget(p,kind,target){return super.forecastTarget(p,kind,target+(kind==="Rush"&&this.hasPrayer(1-p.team,"Moles under the Pitch")?1:0));}
 onBallCaught(p,delivery){if((delivery.kind==="pass"||this.passContext&&this.action==="pass"&&["bounce","throw-in"].includes(delivery.kind))&&this.hasPrayer(p.team,"Dazzling Catching"))this.recordStat(p,"prayerCatch");}
 onTrapdoor(p){return this.onPitch(p)&&[0,1].some(t=>this.hasPrayer(t,"Treacherous Trapdoor"))&&((p.x===6&&p.y===1)||(p.x===19&&p.y===13));}
 checkTrapdoor(p,done,{pushed=false}={}){
  if(!this.onTrapdoor(p)){done(false);return;}
  const origin={x:p.x,y:p.y},carrier=this.ball.carrier===p.id;
  this.test(p,"Trapdoor",2,()=>done(false),()=>{
   const attacker=pushed?this.blockAction?.attacker:null,source=attacker&&attacker.team!==p.team&&this.hasPrayer(attacker.team,"Fan Interaction")?{playerId:attacker.id,cause:"Trapdoor push"}:null;
   this.note("#"+p.number+" falls through the trapdoor.");
   this.resolveInjury(p,this.roll("Trapdoor Injury")+this.roll("Trapdoor Injury"),()=>{
    p.x=null;p.y=null;if(p.team===this.active&&this.blockAction)this.blockAction.turnover=true;
    const finish=()=>done(true);if(carrier){this.ball={...origin,carrier:null};this.bounce(origin.x,origin.y,finish);}else finish();
   },{crowd:true,source});
  });
 }
 afterArrival(p,done){this.checkTrapdoor(p,fell=>{if(fell&&p.team===this.active&&!this.blockAction)this.endTurn(true);else done();});}
 beforeThrownLanding(p,done){this.checkTrapdoor(p,done);}
 movementOutcome(p,plan,origin,failure,done){super.movementOutcome(p,plan,origin,failure,context=>{if(failure&&this.onTrapdoor(p))done({...context,turnover:false,after:()=>this.afterArrival(p,()=>this.endTurn(true))});else done(context);});}
 placePushed(p,pos,done){super.placePushed(p,pos,ok=>{if(ok&&this.onTrapdoor(p)){if(this.blockAction){this.blockAction.trapdoorQueue||=[];this.blockAction.trapdoorQueue.push({p,pushed:true});}else {this.checkTrapdoor(p,()=>done(ok),{pushed:true});return;}}done(ok);});}
 onFollowed(p){if(this.blockAction&&this.onTrapdoor(p)){this.blockAction.trapdoorQueue||=[];this.blockAction.trapdoorQueue.push({p,pushed:false});}}
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
  if(this.phase==="leagueSteps"){if(this.league&&this.leaguePurchaseStep<this.leaguePurchaseOrder.length)return false;return this.finishInducementPurchases();}
  if(this.phase==="rolloff"){
   let a,b;do{a=this.roll(this.teams[0].name+" kick/receive roll-off");b=this.roll(this.teams[1].name+" kick/receive roll-off");}while(a===b);
   this.rolloffWinner=a>b?0:1;this.phase="kickChoice";this.note(this.teams[this.rolloffWinner].name+" chooses who kicks.");return true;
  }return false;
 }
 rollWeather(){const sum=this.roll("Weather team 1")+this.roll("Weather team 2");this.weather=sum===2?"Sweltering Heat":sum===3?"Very Sunny":sum===11?"Pouring Rain":sum===12?"Blizzard":"Perfect Conditions";this.note("Weather: "+this.weather+".");return this.weather;}
 weatherName(sum){return sum<=2?"Sweltering Heat":sum===3?"Very Sunny":sum===11?"Pouring Rain":sum>=12?"Blizzard":"Perfect Conditions";}
 useWeatherMage(team){
  if(this.phase!=="play"||this.pending||team!==this.active||this.weatherWindowTeam!==team||this.weatherMages[team]<1||this.mover)return false;
  this.weatherMages[team]--;const sum=this.roll("Weather Mage die 1")+this.roll("Weather Mage die 2"),choices=new Map();
  for(const modifier of [0,1,-1,2,-2]){const name=this.weatherName(Math.max(2,Math.min(12,sum+modifier)));if(!choices.has(name))choices.set(name,modifier);}
  const apply=name=>{this.weather=name;this.note("Weather Mage: "+name+" (roll "+sum+", modifier "+choices.get(name)+").");};
  if(choices.size===1)apply([...choices.keys()][0]);else this.skillChoice("Weather Mage result",team,[...choices.keys()],apply);
  return true;
 }
 chooseKicking(team){if(this.phase!=="kickChoice"||![0,1].includes(team))return false;this.firstReceiver=1-team;this.prepareDrive(team);return true;}
 available(team){return this.players.filter(p=>p.team===team&&!p.eaten&&!["casualty","knocked-out","sent-off"].includes(p.status)&&!p.heatOut);}
 prepareDrive(kicking){
  this.swarmCounts=[0,0];this.swarmState=null;
  this.throwUsed=[false,false];this.throwMate=null;
  this.drive++;this.kicking=kicking;this.receiving=1-kicking;this.active=kicking;this.setupTeam=kicking;this.phase="setup";this.finished=false;this.pending=null;this.mover=null;this.action=null;this.blockAction=null;this.ball={x:null,y:null,carrier:null};this.kickTouchback=false;this.eventState=null;
  this.kickDistanceHalved=false;this.kickChoiceMade=false;for(const p of this.players){p.rooted=false;p.gouged=false;p.chompers=[];if(!p.eaten&&!["casualty","knocked-out","sent-off"].includes(p.status))Object.assign(p,{status:"reserve",x:null,y:null,distracted:false,used:false,spent:0});}
  this.note("Drive "+this.drive+": "+this.teams[kicking].name+" sets up first.");this.autoSetup(kicking);
 }
 setupErrors(team=this.setupTeam){
  const list=this.players.filter(p=>p.team===team&&this.onPitch(p)),needed=Math.min(11+(this.swarmCounts?.[team]||0),this.available(team).length),errors=[];
  if(list.length!==needed)errors.push("Field "+needed+" eligible player(s).");
  if(list.some(p=>!this.ownHalf(team,p.x)||p.heatOut||p.status!=="standing"))errors.push("All players must be eligible and in their own half.");
  if(list.filter(p=>p.x===this.line(team)&&this.centre(p.y)).length<Math.min(3,needed))errors.push("Place at least "+Math.min(3,needed)+" player(s) on the central Line of Scrimmage.");
  if(list.filter(p=>p.y<4).length>2||list.filter(p=>p.y>10).length>2)errors.push("At most two players in each Wide Zone.");if(this.available(team).some(p=>p.captain&&!this.onPitch(p)))errors.push("Field your Team Captain if able.");return errors;
 }
 autoSetup(team=this.setupTeam){
  if(this.phase!=="setup"||team!==this.setupTeam)return false;
  const list=this.available(team).sort((a,b)=>Number(!!b.captain)-Number(!!a.captain));list.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));const line=this.line(team),back=this.right(team)?-1:1;
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
  else this.beginDwarfenWisdom([this.kicking,this.receiving]);return true;
 }
 benchSetup(id){const p=this.players.find(p=>p.id===id);if(this.phase!=="setup"||!p||p.team!==this.setupTeam||!this.onPitch(p))return false;Object.assign(p,{x:null,y:null,status:"reserve"});return true;}
 // FFB BB2025 StepDwarfenWisdom: kicking coach, receiving coach, then Swarming.
 beginDwarfenWisdom(queue){
  if(!queue.length){this.wisdomState=null;this.beginSwarming([this.kicking,this.receiving]);return;}
  const [team,...remaining]=queue;
  if(!this.dwarfenWisdom[team]){this.beginDwarfenWisdom(remaining);return;}
  this.phase="dwarfenWisdom";this.active=team;
  const state=this.wisdomState={team,remaining,eligible:this.players.filter(p=>p.team===team&&this.onPitch(p)).map(p=>p.id),selected:[],limit:0,placing:false};
  this.skillChoice("Dwarfen Wisdom — "+this.teams[team].name,team,["Use Dwarfen Wisdom","Keep Dwarfen Wisdom"],choice=>{
   if(choice==="Keep Dwarfen Wisdom"||!state.eligible.length){this.wisdomState=null;this.beginDwarfenWisdom(remaining);return;}
   state.limit=Math.min(this.roll("Dwarfen Wisdom players",3),state.eligible.length);
   const select=()=>{
    const ids=state.eligible.filter(id=>!state.selected.includes(id)),labels=ids.map(id=>"Redeploy #"+this.players.find(p=>p.id===id).number),finish=()=>{
     this.dwarfenWisdom[team]--;state.placing=true;
     for(const p of this.players.filter(p=>state.selected.includes(p.id)))Object.assign(p,{x:null,y:null,status:"reserve"});
     this.note(this.teams[team].name+" uses Dwarfen Wisdom: re-place "+state.selected.length+" player(s) in a legal formation.");
    };
    this.skillChoice("Dwarfen Wisdom — choose 1–"+state.limit+" players ("+state.selected.length+" selected)",team,[...labels,...(state.selected.length?["Finish selecting"]:[])],choice=>{
     if(choice==="Finish selecting"){finish();return;}
     state.selected.push(ids[labels.indexOf(choice)]);if(state.selected.length===state.limit)finish();else select();
    });
   };select();
  });
 }
 placeWisdom(id,x,y){
  const s=this.wisdomState,p=this.players.find(p=>p.id===id);
  if(this.phase!=="dwarfenWisdom"||this.pending||!s?.placing||!p||!s.selected.includes(id)||!this.inside(x,y)||!this.ownHalf(s.team,x)||this.at(x,y))return false;
  Object.assign(p,{x,y,status:"standing"});return true;
 }
 finishDwarfenWisdom(){
  const s=this.wisdomState;if(this.phase!=="dwarfenWisdom"||this.pending||!s?.placing||this.setupErrors(s.team).length)return false;
  this.wisdomState=null;this.beginDwarfenWisdom(s.remaining);return true;
 }
 beginSwarming(queue){if(!queue.length){this.phase="kicker";this.active=this.kicking;this.startHalfResources();this.grantLeader(this.half);return;}const [team,...remaining]=queue,reserves=this.available(team).filter(p=>!this.onPitch(p)&&this.profile(p).traits.includes("Lineman"));if(!this.hasTeamRule(team,"Swarming")||!reserves.length){this.beginSwarming(remaining);return;}this.phase="swarming";this.active=team;this.swarmState={team,remaining,limit:this.roll("Swarming additional Linemen",3),eligible:reserves.map(p=>p.id),placed:[]};this.note(this.teams[team].name+" may set up "+this.swarmState.limit+" extra Linemen.");}
 placeSwarm(id,x,y){const s=this.swarmState,p=this.players.find(p=>p.id===id);if(this.phase!=="swarming"||!s||!p||!s.eligible.includes(id)||!this.inside(x,y)||!this.ownHalf(s.team,x)||this.at(x,y)||!s.placed.includes(id)&&s.placed.length>=s.limit)return false;const others=this.players.filter(q=>q!==p&&q.team===s.team&&this.onPitch(q));if(y<4&&others.filter(q=>q.y<4).length>=2||y>10&&others.filter(q=>q.y>10).length>=2)return false;Object.assign(p,{x,y,status:"standing",fieldedDrive:this.drive});if(!s.placed.includes(id))s.placed.push(id);return true;}
 finishSwarming(){const s=this.swarmState;if(this.phase!=="swarming"||!s)return false;this.swarmCounts[s.team]=s.placed.length;this.swarmState=null;this.beginSwarming(s.remaining);return true;}
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
 choice(kind,options,fn,team=this.active){this.skillChoice(kind,team,options,fn);}
 randomPlayers(list,count,label){const remaining=[...list],result=[];while(result.length<count&&remaining.length)result.push(remaining.splice(this.roll(label,remaining.length)-1,1)[0]);return result;}
 kickoffEvent(total){
  this.phase="kickEvent";this.note("Kick-off Event "+total+".");
  const finish=()=>this.landKick();
  if(total===2){this.bribes=this.bribes.map(n=>n+1);this.note("Get the Ref: each team receives an additional Bribe.");finish();}
  else if(total===3){const amount=this.turns[this.kicking]>=6?-1:1;this.turns=this.turns.map(n=>Math.max(0,n+amount));this.note("TIME-OUT: both Turn Markers "+(amount>0?"advance":"move back")+" one.");finish();}
  else if(total===4||total===9||total===10){
   const team=total===9?this.receiving:this.kicking,kind=total===4?"defence":total===9?"snap":"charge",limit=Math.ceil(this.roll("Kick-off selected player count")/2)+3;
   this.eventState={kind,team,limit,eligible:this.openPlayers(team).map(p=>p.id),used:[],originalPositions:Object.fromEntries(this.players.filter(p=>p.team===team&&this.onPitch(p)).map(p=>[p.id,{x:p.x,y:p.y}]))};this.active=team;this.phase=kind==="charge"?"charge":"eventMove";this.blitzUsed[team]=false;
   this.note((kind==="defence"?"Solid Defence: redeploy":kind==="snap"?"Quick Snap: move one square with":"Charge: activate")+" up to "+limit+" Open players. Finish the event when ready.");
  }
  else if(total===5){const list=!this.kickTouchback&&!this.at(this.kickLanding.x,this.kickLanding.y)?this.openPlayers(this.receiving):[];
   const options=list.map(p=>"High Kick: #"+p.number);options.push("Skip High Kick");this.choice("High Kick",options,option=>{const p=list[options.indexOf(option)];if(p)Object.assign(p,this.kickLanding);finish();},this.receiving);
  }
  else if(total===6||total===7){
   const kind=total===6?"cheerleaders":"assistants",contest=t=>{let n=this.roll(this.teams[t].name+(total===6?" Cheering Fans":" Brilliant Coaching"));if(total===6&&n===1&&this.resourceChoices[t].mascots){this.note("Team Mascot re-rolls the Cheering Fans natural one.");n=this.roll("Mascot Cheering Fans re-roll");}return n+this.staffCount(t,kind);},a=contest(0),b=contest(1);
   for(const t of [0,1])if((t===0?a:b)>=(t===0?b:a)){if(total===6)this.cheer[t]=true;else{this.rerolls[t]++;this.driveBonus[t]++;}}
  this.note(total===6?"Cheering Fans: winning coach(es) gain an assist on their first Block next turn.":"Brilliant Coaching: winning coach(es) gain a Drive re-roll.");finish();
  }
  else if(total===8){
   if(this.rollWeather()==="Perfect Conditions"&&!this.kickTouchback){const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];for(let i=0;i<3;i++){const [dx,dy]=dirs[this.roll("Airborne weather scatter",8)-1];this.kickLanding.x+=dx;this.kickLanding.y+=dy;this.checkKickBounds();if(this.kickTouchback)break;}}finish();
  }
  else if(total===11||total===12){
   const a=this.roll(this.teams[0].name+" event contest")+(total===12?this.fans[0]:0),b=this.roll(this.teams[1].name+" event contest")+(total===12?this.fans[1]:0),count=total===12?Math.ceil(this.roll("Pitch invasion player count")/2):1;
   // Commit every victim before any Snack effect or Ball & Chain treatment.
   const victims=[0,1].flatMap(t=>(t===0?a:b)<=(t===0?b:a)?this.randomPlayers(this.players.filter(p=>p.team===t&&this.onPitch(p)&&(total!==12||p.status==="standing")),count,"Random event player"):[]);
   if(total===11){for(const p of victims)if(this.roll("Dodgy Snack")===1){Object.assign(p,{status:"reserve",x:null,y:null,snackOut:true});this.note("Dodgy Snack removes #"+p.number+" for the drive.");}else{p.snack=true;this.note("Dodgy Snack: #"+p.number+" loses 1 MA and AV this drive.");}finish();return;}
   let index=0;const stun=()=>{if(index===victims.length){finish();return;}const p=victims[index++];if(this.has(p,"Ball & Chain")){this.chainDamage(p,stun,{placed:true});return;}p.status="stunned";p.rooted=false;this.onProne(p);this.note("Pitch invasion stuns #"+p.number+".");stun();};stun();
  }
 }
 eventPlace(id,x,y){
  const e=this.eventState,p=this.players.find(p=>p.id===id);if(this.phase!=="eventMove"||!e||!p||!e.eligible.includes(id)||!this.inside(x,y)||this.at(x,y))return false;
  if(!e.used.includes(id)&&e.used.length>=e.limit)return false;
  if(e.kind==="snap"&&(e.used.includes(id)||this.distance(p,{x,y})!==1))return false;
  if(e.kind==="defence"&&!this.ownHalf(p.team,x))return false;
  Object.assign(p,{x,y,status:"standing"});if(!e.used.includes(id))e.used.push(id);return true;
 }
 liftDefence(id){const e=this.eventState,p=this.players.find(p=>p.id===id);if(this.phase!=="eventMove"||e?.kind!=="defence"||!p||!e.eligible.includes(id)||!this.onPitch(p)||!e.used.includes(id)&&e.used.length>=e.limit)return false;if(!e.used.includes(id))e.used.push(id);Object.assign(p,{x:null,y:null,status:"reserve"});return true;}
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
  if(this.weatherMages[team]>0){this.weatherWindowTeam=team;this.skillChoice("Weather Mage — "+this.teams[team].name,team,["Use Weather Mage","Keep weather"],choice=>{if(choice==="Use Weather Mage")this.useWeatherMage(team);this.weatherWindowTeam=null;});}
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
 options(p,kind){const result=[...super.options(p,kind),...this.actionRerollSources(p,kind)];return this.phase==="play"?result:result.filter(s=>s!=="Team");}
 test(p,kind,target,yes,no){if((this.weather==="Blizzard"||this.hasPrayer(1-p.team,"Moles under the Pitch"))&&kind==="Rush")target+=(this.weather==="Blizzard"?1:0)+(this.hasPrayer(1-p.team,"Moles under the Pitch")?1:0);if(this.weather==="Pouring Rain"&&["Pick up","Catch","Intercept","Bomb interception"].includes(kind))target++;super.test(p,kind,target,yes,no);}
 passPreview(x,y){const result=super.passPreview(x,y);if(result&&this.weather==="Very Sunny"&&this.action!=="bomb")result.target++;return result;}
 throwPreview(x,y){const result=super.throwPreview(x,y);if(result&&this.weather==="Very Sunny")result.target++;return result;}
 passRange(from,to){const result=super.passRange(from,to);if(this.weather==="Blizzard"&&result?.band>1)return null;const target=this.at(to.x,to.y);return result&&this.action==="pass"&&Number.isInteger(from.team)&&Number.isInteger(from.role)&&this.parameter(from,"Working in Tandem")==="Working in Tandem (pass)"&&target?.team===from.team&&this.parameter(target,"Working in Tandem")==="Working in Tandem (block)"?{...result,band:0,name:"Pass to Partner",partner:true}:result;}
 assists(a,d){const result=super.assists(a,d);if(this.cheer[a.team]&&!this.has(a,"Ball & Chain")&&!this.has(d,"Ball & Chain"))result.offensive++;return result;}
 onBlockRolled(a){this.cheer[a.team]=false;}
 decide(option){const q=this.pending;if(q?.p&&q.options?.includes(option)&&this.actionRerollSources(q.p,q.kind).includes(option)){this.pending=null;this.useActionRerollSource(q.p,q.kind,option);q.resolve(this.roll(q.kind+" re-roll ("+option+")"));return true;}const before=[...this.rerolls],result=super.decide(option);this.consumeBonus(before);return result;}
 rerollBlock(source,index=null){if(source==="Savage Blow")return this.rerollSavageBlock(index);if(["Lord of Chaos","Unstoppable Momentum","Woodland Fury","Thinking Man's Troll","Halfling Luck","Working in Tandem"].includes(source))return this.rerollStarBlock(source,index);const before=[...this.rerolls],result=super.rerollBlock(source,index);this.consumeBonus(before);return result;}
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
  if(this.turns.every(n=>n>=8))this.endDrive(null);else this.openWizardWindows();return true;
 }
 // FFB StepEndFeeding/StepInitInducement: ending coach, then opposing coach,
 // between turns, excluding touchdown/end-of-half. No player action can start.
 openWizardWindows(){
  const ending=this.active,c=this.wizardWindow={ending,index:0};this.phase="betweenTurns";
  const next=()=>{
   if(this.wizardWindow!==c||this.finished)return;
   if(c.index===2){this.wizardWindow=null;this.phase="play";this.beginTurn(1-ending);return;}
   const team=c.index++===0?ending:1-ending;this.active=team;
   if(!this.wizards[team]&&!this.rocks[team]){next();return;}
   this.offerWizard(team,next);
  };next();
 }
 offerWizard(team,done){const keep=this.wizards[team]?"Keep Wizard":"Keep Rock",kind=this.wizards[team]?"Wizard":"Throw a Rock",options=[...(this.wizards[team]?["Fireball","Zap"]:[]),...(this.rocks[team]?["Throw a Rock"]:[]),keep];this.skillChoice(kind+" — "+this.teams[team].name,team,options,choice=>{if(choice===keep)done();else if(choice==="Throw a Rock")this.throwPrayerRock(team,()=>this.wizards[team]?this.offerWizard(team,done):done());else this.selectSpell(team,choice,done);});}
 throwPrayerRock(team,done){
  const list=this.players.filter(p=>p.team!==team&&this.onPitch(p)&&p.status==="standing");if(!list.length){this.note("Throw a Rock: no standing opponent; keep the use.");done();return;}
  this.rocks[team]--;this.prayers[team]=this.prayers[team].filter(n=>n!=="Throw a Rock");const p=this.randomPlayers(list,1,"Throw a Rock target")[0];if(this.roll("Throw a Rock needs 4+")<4){done();return;}
  this.scoreDeferrals=(this.scoreDeferrals||0)+1;const origin={x:p.x,y:p.y},armour=this.roll("Rock Armour")+this.roll("Rock Armour");let entry=null;
  if(armour>=parseInt(this.profile(p).av)){this.spellInjuryCapture=e=>{entry=e;};try{this.resolveInjury(p,this.roll("Rock Injury")+this.roll("Rock Injury"),()=>{},{source:{cause:"Throw a Rock"}});}finally{this.spellInjuryCapture=null;}}
  const complete=()=>{this.scoreDeferrals--;this.syncLeader();done();},damage=()=>{p.status="prone";p.rooted=false;this.onProne(p);if(entry)entry.prepare();this.releaseProneBall(p,origin,()=>entry?super.scheduleInjury(entry,complete):complete());};
  this.preventFall(p,complete,()=>this.beforeProne(p,origin,damage));
 }
 spellTargets(spell,x,y){if(!Number.isInteger(x)||!Number.isInteger(y)||!this.inside(x,y)||!["Fireball","Zap"].includes(spell))return [];return this.players.filter(p=>this.onPitch(p)&&(spell==="Zap"?p.x===x&&p.y===y&&!p.zapped:this.distance(p,{x,y})<=1));}
 selectSpell(team,spell,done){
  const q={type:"custom",kind:spell+" — select a highlighted square, then confirm",team,spell,options:["Cancel spell"],resolve:choice=>{
   if(this.pending!==q||choice!=="Cancel spell")return false;this.pending=null;this.offerWizard(team,done);return true;
  },spellDone:done};this.pending=q;
 }
 aimSpell(x,y){
  const q=this.pending;if(this.phase!=="betweenTurns"||!q?.spell||!this.wizards[q.team]||!this.spellTargets(q.spell,x,y).length)return false;
  const targets=this.spellTargets(q.spell,x,y),label="Cast "+q.spell+" at "+(x+1)+", "+(y+1);
  this.skillChoice(q.spell+" affects "+targets.map(p=>this.teams[p.team].name+" #"+p.number).join(", "),q.team,[label,"Choose another square","Cancel spell"],choice=>{
   if(choice==="Choose another square"){this.selectSpell(q.team,q.spell,q.spellDone);return;}
   if(choice==="Cancel spell"){this.offerWizard(q.team,q.spellDone);return;}this.castSpell(q.team,q.spell,x,y,()=>this.rocks[q.team]?this.offerWizard(q.team,q.spellDone):q.spellDone());
  });return true;
 }
 castSpell(team,spell,x,y,done){
  if(this.pending||this.phase!=="betweenTurns"||!this.wizardWindow||team!==this.active||!this.wizards[team]||!["Fireball","Zap"].includes(spell)||!this.spellTargets(spell,x,y).length)return false;
  const targets=this.spellTargets(spell,x,y).sort((a,b)=>a.y-b.y||a.x-b.x);this.wizards[team]--;this.note(this.teams[team].name+" casts "+spell+".");
  this.scoreDeferrals=(this.scoreDeferrals||0)+1;
  const complete=()=>{this.scoreDeferrals--;this.syncLeader();this.phase="play";this.checkScore();if(!this.finished){this.phase="betweenTurns";done();}};
  if(spell==="Zap"){
   const p=targets[0],n=this.roll("Zap #"+p.number),success=n===6||n>1&&n>=this.profile(p).st;
   if(!success){complete();return;}p.zapped=true;this.note("#"+p.number+" becomes a Frog until the drive ends.");
   if(this.ball.carrier===p.id||!this.ball.carrier&&this.ball.x===p.x&&this.ball.y===p.y){this.ball={x:p.x,y:p.y,carrier:null};this.bounce(p.x,p.y,complete);}else complete();return;
  }
  let i=0;
  const next=()=>{
   if(i===targets.length){complete();return;}
   const p=targets[i++];if(this.roll("Fireball #"+p.number+" needs 4+")<4){next();return;}
   const origin={x:p.x,y:p.y},standing=p.status==="standing";
   // FFB rolls the injury before offering Steady Footing; a successful save
   // discards that result, including any casualty dice already consumed.
   const armour=this.has(p,"Ball & Chain")?Infinity:this.roll("Fireball Armour")+this.roll("Fireball Armour"),av=parseInt(this.profile(p).av),bonus=armour<av&&!this.has(p,"Iron Hard Skin")?1:0;
   let entry=null;
   if(armour+bonus>=av){this.spellInjuryCapture=e=>{entry=e;};try{this.resolveInjury(p,this.roll("Fireball Injury")+this.roll("Fireball Injury")+(bonus?0:1),()=>{},{source:{cause:"Fireball"}});}finally{this.spellInjuryCapture=null;}}
   const damage=()=>{
    if(standing){p.status="prone";p.rooted=false;this.onProne(p);}
    const finish=()=>this.releaseProneBall(p,origin,next);
    if(entry){entry.prepare();this.releaseProneBall(p,origin,()=>super.scheduleInjury(entry,next));}else finish();
   };
   const placed=()=>standing?this.beforeProne(p,origin,damage):damage();if(standing)this.preventFall(p,next,placed);else placed();
  };next();
 }
 scheduleInjury(entry,done){if(this.spellInjuryCapture){this.spellInjuryCapture(entry);return;}super.scheduleInjury(entry,done);}
 finishBlock(){const block=this.blockAction;if(block?.trapdoorQueue?.length&&!block.trapdoorProcessing){block.trapdoorProcessing=true;const next=()=>{if(!block.trapdoorQueue.length){block.trapdoorProcessing=false;this.finishBlock();return;}const {p,pushed}=block.trapdoorQueue.shift();this.checkTrapdoor(p,next,{pushed});};next();return;}if(this.chainContext){super.finishBlock();return;}if(this.multipleContext){super.finishBlock();return;}const b=this.blockAction;super.finishBlock();if(this.pending)return;if(this.phase==="play"||this.phase==="charge")this.checkScore();if(b&&!b.blitz)this.checkStalling(b.attacker);}
 canScoreWithoutDice(p){
  if(!p||this.ball.carrier!==p.id||!this.onPitch(p)||p.status!=="standing"||p.distracted||["Bone Head","Really Stupid","Unchannelled Fury","Animal Savagery","Take Root"].some(s=>this.has(p,s))||this.parameter(p,"Bloodlust"))return false;
  const goal=this.right(p.team)?25:0,queue=[{x:p.x,y:p.y,spent:0}],seen=new Set([p.x+","+p.y]);
  while(queue.length){const n=queue.shift();if(n.x===goal)return true;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(dx||dy){const x=n.x+dx,y=n.y+dy,key=x+","+y;if(seen.has(key))continue;const plan=this.planFrom(p,x,y,n.x,n.y,n.spent);if(!plan||plan.rushes||plan.dodge||plan.jump)continue;seen.add(key);queue.push({x,y,spent:n.spent+1});}}
  return false;
 }
 wouldEndTurnTriggerStalling(excluded=null){const p=this.players.find(q=>q.id===this.ball.carrier);return this.phase==="play"&&this.turns[this.active]<=6&&p&&p!==excluded&&p.team===this.active&&!p.used&&!p.stallingChecked&&this.canScoreWithoutDice(p);}
 checkStalling(p,afterPrevention=null){
  if(this.phase!=="play"||this.finished||this.pending||p?.team!==this.active||p.stallingChecked||this.stallCandidate!==p.id||this.ball.carrier!==p.id)return;
  this.stallCandidate=null;p.stallingChecked=true;this.stalledTeams[p.team]=true;if(this.turns[this.active]>6){this.note("Stalling: no crowd roll in turns 7–8.");return;}
  this.note("Stalling: the crowd may take action.");if(this.roll("Crowd Takes Action")>=this.turns[this.active])this.fall(p,{prevented:afterPrevention});
 }
 finish(){const p=this.players.find(q=>q.id===this.mover),result=super.finish();if(result&&p)this.checkStalling(p);return result;}
 checkScore(){
  if(this.feedBeforeScore())return;
  if(this.scoreDeferrals)return;
  if(!["play","charge"].includes(this.phase))return;const p=this.players.find(q=>q.id===this.ball.carrier);
  if(p&&p.status==="standing"&&p.x===(this.right(p.team)?25:0)){this.scores[p.team]++;this.recordStat(p,"touchdown");this.note("TOUCHDOWN — "+this.teams[p.team].name+"! Score "+this.scores.join("–")+".");if(p.team!==this.active){this.turns[p.team]=Math.min(8,this.turns[p.team]+1);this.note("Scoring during the opponent's turn: the scoring team skips its next turn celebrating.");}this.endDrive(p.team);}
 }
 endDrive(scorer){this.phase="endDrive";this.finished=true;this.pending=null;this.mover=null;this.action=null;this.blockAction=null;this.lastScorer=scorer;this.note("End of Drive: resolve recovery and effects before continuing.");}
 // FFB StepEndTurn: each coach argues/retries, then both Bribe allocations.
 resolveSecretWeapons(){
  let c=this.weaponContext;
  if(!c){
   const players=this.players.filter(p=>p.fieldedDrive===this.drive&&p.weaponResolvedDrive!==this.drive&&this.has(p,"Secret Weapon")&&!["sent-off","casualty"].includes(p.status)&&!p.eaten);
   if(!players.length)return false;
   c=this.weaponContext={players,stage:0,argued:new Set(),saved:new Set(),retry:[],retryDone:new Set()};
  }
  this.argueBanned||=[false,false];
  const resume=()=>this.continueDrive();
  const rollArgue=(p,rerolled=false)=>{
   let n=this.roll(rerolled?"Bribery and Corruption Argue re-roll":"Argue the Call"),modified=n+(this.biasedRefs?.[p.team]||0)+this.argueModifier(p.team,n);
   if(n===1&&!rerolled&&(this.argueRerolls?.[p.team]||0)>0){
    if(modified===1){this.argueRerolls[p.team]--;this.note("Bribery and Corruption: re-roll the natural-one Argue the Call.");rollArgue(p,true);return;}
    c.retry.push(p);
   }
   if(modified>=6){c.saved.add(p.id);this.note("Argue the Call saves #"+p.number+" from the Secret Weapon ban.");}
   if(modified===1){this.argueBanned[p.team]=true;this.note("The coach is banned from further arguments; end-of-drive Bribes remain available.");}
  };
  while(c.stage<6){
   const team=[1,1,0,0,1,0][c.stage],remaining=c.players.filter(p=>p.team===team&&!c.saved.has(p.id));
   if(c.stage<4&&c.stage%2===0){
    const list=remaining.filter(p=>!c.argued.has(p.id));
    if(!list.length||this.argueBanned[team]){c.stage++;continue;}
    const labels=list.map(p=>list.length===1?"Argue the Call":"Argue for #"+p.number);
    this.skillChoice("Secret Weapon arguments — "+this.teams[team].name,team,[...labels,"Accept send-off"],choice=>{
     const p=list[labels.indexOf(choice)];if(p){c.argued.add(p.id);rollArgue(p);}else c.stage++;resume();
    });return true;
   }
   if(c.stage<4){
    const list=c.retry.filter(p=>p.team===team&&!c.saved.has(p.id));
    if(c.retryDone.has(team)||!list.length||!(this.argueRerolls?.[team]>0)){c.stage++;continue;}
    const labels=list.map(p=>"Re-roll Argue for #"+p.number);
    this.skillChoice("Bribery and Corruption — "+this.teams[team].name,team,[...labels,"Keep argument results"],choice=>{
     c.retryDone.add(team);const p=list[labels.indexOf(choice)];if(p){this.argueRerolls[team]--;rollArgue(p,true);}c.stage++;resume();
    });return true;
   }
   if(!remaining.length||!(this.bribes[team]>0)){c.stage++;continue;}
   const labels=remaining.map(p=>remaining.length===1?"Use Bribe":"Bribe for #"+p.number);
   this.skillChoice("Secret Weapon Bribes — "+this.teams[team].name,team,[...labels,"Accept send-off"],choice=>{
    const p=remaining[labels.indexOf(choice)];if(p){this.bribes[team]--;if(this.roll("Bribe needs 2+")>=2){c.saved.add(p.id);this.note("Bribe saves #"+p.number+" from the Secret Weapon ban.");}}else c.stage++;resume();
   });return true;
  }
  for(const p of c.players){p.weaponResolvedDrive=this.drive;if(!c.saved.has(p.id)){Object.assign(p,{x:null,y:null,status:"sent-off"});if(this.ball.carrier===p.id)this.ball={x:null,y:null,carrier:null};this.note("Secret Weapon #"+p.number+" is Sent-off.");}}
  this.weaponContext=null;return false;
 }
 continueDrive(){
  if(this.phase!=="endDrive"||this.pending)return false;
  for(const p of this.players)if(p.zapped){delete p.zapped;this.note("#"+p.number+" returns from Frog form.");}
  if(this.turns.every(n=>n>=8)&&this.half===2){this.phase="finished";this.note(this.scores[0]===this.scores[1]?"Full time — draw.":"Full time — "+this.teams[this.scores[0]>this.scores[1]?0:1].name+" wins.");return true;}
  if(this.resolveSecretWeapons())return true;
  const field=this.players.filter(p=>this.onPitch(p));for(const p of this.players)p.heatOut=false;
  for(const p of this.players){if(p.status==="knocked-out"&&this.roll("KO recovery #"+p.number)+this.resourceChoices[p.team].kegs+this.resourceChoices[p.team].josefBugman>=4){p.status="reserve";this.note("#"+p.number+" recovers from KO.");}p.snack=false;p.snackOut=false;}
  if(this.weather==="Sweltering Heat"){const count=Math.ceil(this.roll("Sweltering Heat player count")/2);for(const t of [0,1])for(const p of this.randomPlayers(field.filter(q=>q.team===t),count,"Heat exhaustion")){p.heatOut=true;this.note("Heat: #"+p.number+" misses the next drive.");}}
  for(const t of [0,1]){this.rerolls[t]=Math.max(0,this.rerolls[t]-this.driveBonus[t]);this.driveBonus[t]=0;}
  if(this.turns.every(n=>n>=8)){
   this.half=2;this.turns=[0,0];this.rerolls=this.resourceChoices.map(r=>r.teamRerolls+r.extraTraining);this.skip=[false,false];this.note("HALF-TIME: change ends and replenish purchased re-rolls and Extra Training.");this.prepareDrive(this.firstReceiver);return true;
  }
  this.prepareDrive(this.lastScorer??this.kicking);return true;
 }
}
if(typeof module!=="undefined")module.exports={MatchGame,MATCH_RESOURCES,MATCH_PRAYERS,MATCH_STARS};
