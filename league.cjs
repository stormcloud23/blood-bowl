"use strict";
// Local roster management. Match behavior remains in the existing engines.
const LeagueSkills=typeof module!=="undefined"?require("./skills.cjs").SKILL_GROUPS:SKILL_GROUPS;
const LeagueSpecialTraits=typeof module!=="undefined"?require("./skills.cjs").SPECIAL_ACTION_TRAITS:SPECIAL_ACTION_TRAITS;
const ADVANCEMENT_COSTS=[[3,6,10,14],[4,8,12,16],[6,12,16,20],[8,16,20,24],[10,20,24,28],[15,30,34,38]];
const ELITE_SKILLS=["Block","Dodge","Guard","Mighty Blow"];
const cloneLeague=value=>JSON.parse(JSON.stringify(value));
const leagueCanonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
class LeagueStore {
 constructor(rosters,data=null,{dice=null}={}){this.rosters=rosters;this.dice=dice||((s)=>1+Math.floor(Math.random()*s));this.data=data?cloneLeague(data):{version:1,teams:[],matches:[],leagues:[],active:null};this.validate();}
 roll(s=6){const n=this.dice(s);if(!Number.isInteger(n)||n<1||n>s)throw Error("Invalid league die");return n;}
 id(){return typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
 validate(){
  const d=this.data;
  if(!d||d.version!==1||!Array.isArray(d.teams)||!Array.isArray(d.matches)||!Array.isArray(d.leagues))throw Error("Unsupported league backup");
  const ids=new Set(),playerIds=new Set();
  for(const t of d.teams){
   if(!t||typeof t.id!=="string"||!t.id||ids.has(t.id))throw Error("Duplicate or invalid team ID");
   ids.add(t.id);this.checkTeam(t);
   for(const p of [...t.players,...t.archive,...(t.postgame?.journeymen||[])]){
    this.checkPlayer(t,p);
    if(playerIds.has(p.id))throw Error("Duplicate player ID");
    playerIds.add(p.id);
   }
  }
  const leagueIds=new Set(),entered=new Map();
  for(const l of d.leagues){
   if(!l||typeof l.id!=="string"||!l.id||leagueIds.has(l.id)||typeof l.name!=="string"||!l.name.trim()||!Array.isArray(l.teamIds))throw Error("Invalid league data");
   leagueIds.add(l.id);
   for(const id of l.teamIds){if(!ids.has(id)||entered.has(id)||this.team(id).draft)throw Error("Invalid league membership");entered.set(id,l.id);}
  }
  const matchIds=new Set();
  const validPair=(pair,lid)=>Array.isArray(pair)&&pair.length===2&&new Set(pair).size===2&&pair.every(id=>ids.has(id)&&entered.get(id)===lid);
  for(const m of d.matches){
   if(!m||typeof m.id!=="string"||!m.id||matchIds.has(m.id)||!leagueIds.has(m.leagueId)||!validPair(m.teamIds,m.leagueId)||!Array.isArray(m.scores)||m.scores.length!==2||m.scores.some(n=>!Number.isSafeInteger(n)||n<0))throw Error("Invalid match record");
   matchIds.add(m.id);
  }
  for(const t of d.teams){
   if(new Set(t.history).size!==t.history.length||t.history.some(id=>!d.matches.some(m=>m.id===id&&m.teamIds.includes(t.id))))throw Error("Invalid team match history");
   if(t.postgame&&(!t.history.includes(t.postgame.matchId)||t.postgame.matchId!==t.history.at(-1)))throw Error("Invalid post-game record");
  }
  if(d.active){
   const a=d.active;
   if(typeof a.id!=="string"||!a.id||matchIds.has(a.id)||!leagueIds.has(a.leagueId)||!validPair(a.teamIds,a.leagueId)||!Array.isArray(a.teams)||a.teams.length!==2||!Array.isArray(a.versions)||a.versions.length!==2)throw Error("Invalid active fixture");
   const fixtureIds=new Set();
   for(const [i,snapshot] of a.teams.entries()){
    const t=this.team(a.teamIds[i]);
    if(t.postgame||t.pendingAdvance||a.versions[i]!==t.history.length||!snapshot||snapshot.leagueTeamId!==t.id||snapshot.id!==t.rosterId||!Array.isArray(snapshot.matchPlayers)||snapshot.matchPlayers.length<11||snapshot.matchPlayers.length>16||!Array.isArray(snapshot.lineup)||snapshot.lineup.length!==snapshot.matchPlayers.length||leagueCanonical(snapshot.positions)!==leagueCanonical(this.roster(t).positions)||snapshot.treasury!==t.treasury||leagueCanonical(snapshot.matchResources)!==leagueCanonical(t.staff))throw Error("Invalid active fixture team");
    let ctv=this.values(t).ctv;
    for(const [n,p] of snapshot.matchPlayers.entries()){
     this.checkPlayer(t,p);
     if(fixtureIds.has(p.id)||snapshot.lineup[n]!==p.role||p.missNext||p.retired)throw Error("Invalid active fixture player");
     fixtureIds.add(p.id);
     if(p.journeyman){
      const base=this.roster(t).positions[p.role];
      if(playerIds.has(p.id)||base.max!==16||!base.traits.includes("Lineman")||p.value!==base.cost||!p.profile.skills.includes("Loner (4+)"))throw Error("Invalid active Journeyman");
      ctv+=p.value;
     }else if(leagueCanonical(p)!==leagueCanonical(t.players.find(q=>q.id===p.id)))throw Error("Active fixture roster changed");
    }
    const expected={...cloneLeague(this.roster(t)),name:t.name,lineup:snapshot.lineup,matchPlayers:snapshot.matchPlayers,matchResources:t.staff,leagueTeamId:t.id,treasury:t.treasury,ctv};
    if(leagueCanonical(snapshot)!==leagueCanonical(expected)||snapshot.ctv!==ctv||snapshot.matchPlayers.filter(p=>!p.journeyman).length!==t.players.filter(p=>!p.missNext&&!p.retired).length||snapshot.matchPlayers.some(p=>p.journeyman)&&snapshot.matchPlayers.length!==11)throw Error("Invalid active fixture value");
   }
  }
 }
 checkPlayer(t,p){
  const r=this.roster(t),count=n=>Number.isSafeInteger(n)&&n>=0;
  if(!p||typeof p.id!=="string"||!p.id||!Number.isInteger(p.role)||!r.positions[p.role]||typeof p.name!=="string"||!p.name.trim()||p.name.length>80||!Number.isSafeInteger(p.number)||p.number<1||!count(p.spp)||!count(p.earnedSpp)||!count(p.value)||!Array.isArray(p.advances)||p.advances.length>6||!Array.isArray(p.injuries)||!count(p.nigglingInjuries)||typeof p.missNext!=="boolean"||typeof p.retired!=="boolean"||!p.stats)throw Error("Invalid player data");
  for(const key of ["touchdown","casualty","completion","interception","landing","mvp","games"])if(!count(p.stats[key]))throw Error("Invalid player statistics");
  for(const n of Object.values(p.stats))if(!count(n))throw Error("Invalid player statistics");
  const profile=p.profile;
  if(!profile||!Array.isArray(profile.skills)||profile.skills.some(s=>typeof s!=="string")||typeof profile.traits!=="string"||typeof profile.primary!=="string"||typeof profile.secondary!=="string")throw Error("Invalid player profile");
  for(const [key,min,max] of [["ma",1,9],["st",1,8],["ag",1,6],["pa",1,6],["av",3,11]]){
   const v=profile[key];if(key==="pa"&&v==="-")continue;
   if(key==="ma"||key==="st"){if(!Number.isInteger(v)||v<min||v>max)throw Error("Invalid player characteristic");}
   else if(typeof v!=="string"||!/^\d+\+$/.test(v)||Number(v.slice(0,-1))<min||Number(v.slice(0,-1))>max)throw Error("Invalid player characteristic");
  }
 }

 roster(t){const r=this.rosters.find(r=>r.id===t.rosterId);if(!r)throw Error("Unknown roster");return r;}
 team(id){const t=this.data.teams.find(t=>t.id===id);if(!t)throw Error("Unknown team");return t;}
 assertIdle(id){if(this.data.active?.teamIds.includes(id))throw Error("Finish this team's active fixture first");}
 updateDetails(id,name,coach=""){this.assertIdle(id);const t=this.team(id),clean=name.trim(),cleanCoach=coach.trim();if(!clean||clean.length>80)throw Error("Enter a team name (1–80 characters)");t.name=clean;t.coach=cleanCoach;}
 updatePlayerDetails(id,pid,name,number){this.assertIdle(id);const t=this.team(id),p=t.players.find(p=>p.id===pid),clean=name.trim();if(!p)throw Error("Unknown player");if(!clean||clean.length>80)throw Error("Enter a player name (1–80 characters)");if(!Number.isSafeInteger(number)||number<1||t.players.some(q=>q.id!==pid&&q.number===number))throw Error("Choose an unused positive shirt number");p.name=clean;p.number=number;}
 create(rosterId,name,coach=""){const t={id:this.id(),rosterId,name:name.trim(),coach:coach.trim(),draft:true,budget:1000000,treasury:1000000,players:[],archive:[],staff:{teamRerolls:0,apothecary:0,assistants:0,cheerleaders:0,dedicatedFans:1},record:{played:0,won:0,drawn:0,lost:0,points:0,tdFor:0,tdAgainst:0,casualties:0},history:[]};this.roster(t);if(!t.name||t.name.length>80)throw Error("Enter a team name (1–80 characters)");this.data.teams.push(t);return t;}
 newPlayer(t,role,name){const base=this.roster(t).positions[role];if(!base)throw Error("Unknown position");return {id:this.id(),role,name:(name?.trim()||base.name).slice(0,80),number:Math.max(0,...t.players.map(p=>p.number))+1,profile:cloneLeague(base),value:base.cost,spp:0,earnedSpp:0,advances:[],injuries:[],nigglingInjuries:0,missNext:false,retired:false,stats:{touchdown:0,casualty:0,completion:0,interception:0,landing:0,mvp:0,games:0}};}
 checkTeam(t){
  const r=this.roster(t),count=n=>Number.isSafeInteger(n)&&n>=0;
  if(typeof t.draft!=="boolean"||typeof t.coach!=="string"||typeof t.name!=="string"||!t.name.trim()||t.name.length>80||!count(t.treasury)||!Array.isArray(t.players)||t.players.length>16)throw Error("Invalid team data");
  const ids=new Set(),numbers=new Set();
  for(const p of t.players){this.checkPlayer(t,p);if(ids.has(p.id)||numbers.has(p.number))throw Error("Duplicate player ID or number");ids.add(p.id);numbers.add(p.number);}
  if(!t.record||["played","won","drawn","lost","points","tdFor","tdAgainst","casualties"].some(k=>!count(t.record[k]))||!Array.isArray(t.history)||!Array.isArray(t.archive)||t.postgame&&!Array.isArray(t.postgame.journeymen))throw Error("Invalid team record");
  for(const n of Object.values(t.record))if(!count(n))throw Error("Invalid team statistics");
  for(let i=0;i<r.positions.length;i++)if(t.players.filter(p=>p.role===i).length>r.positions[i].max)throw Error("Position allowance exceeded");
  for(const [key,max] of Object.entries({teamRerolls:8,apothecary:r.staff.apothecary?1:0,assistants:6,cheerleaders:6,dedicatedFans:t.draft?3:7}))if(!Number.isInteger(t.staff?.[key])||t.staff[key]<(key==="dedicatedFans"?1:0)||t.staff[key]>max)throw Error("Invalid "+key);
  if(t.pendingAdvance){
   const a=t.pendingAdvance,p=t.players.find(p=>p.id===a.playerId);
   if(t.draft||!p||p.advances.length>=6||!Array.isArray(a.options)||!a.options.length||!ADVANCEMENT_COSTS[p.advances.length].includes(a.cost))throw Error("Invalid pending advancement");
   const skills=[...this.skillOptions(p),...this.skillOptions(p,true)];
   if(a.options.some(n=>!["ma","st","ag","pa","av"].includes(n)?!skills.includes(n):!this.canImprove(p,n)))throw Error("Invalid pending advancement option");
  }
 }
 canImprove(p,key){const n=parseInt(p.profile[key]);return Number.isFinite(n)&&p.advances.filter(a=>a.name===key).length<2&&(["ag","pa"].includes(key)?n>1:n<{ma:9,st:8,av:11}[key]);}

 hire(id,role,name){this.assertIdle(id);const t=this.team(id),p=this.newPlayer(t,role,name);if(t.players.length>=16||t.players.filter(p=>p.role===role).length>=this.roster(t).positions[role].max)throw Error("Position or roster is full");if(t.treasury<p.value)throw Error("Not enough gold");t.players.push(p);t.treasury-=p.value;return p;}
 fire(id,pid){this.assertIdle(id);const t=this.team(id),p=t.players.find(p=>p.id===pid);if(!p)throw Error("Unknown player");if(!t.draft&&t.players.filter(q=>q.id!==pid&&!q.missNext&&!q.retired).length<11)throw Error("Release would leave fewer than 11 eligible players");if(t.pendingAdvance?.playerId===pid)throw Error("Resolve the pending advancement");t.players=t.players.filter(q=>q.id!==pid);if(t.draft)t.treasury+=p.value;else t.archive.push({...p,reason:"Released"});}
 setStaff(id,key,count){this.assertIdle(id);const t=this.team(id),r=this.roster(t),old=t.staff[key],prices={teamRerolls:r.reroll,apothecary:r.staff.apothecary,assistants:10000,cheerleaders:10000,dedicatedFans:5000};if(!(key in prices)||(!t.draft&&key==="dedicatedFans"))throw Error("Unavailable staff purchase");const proposal=cloneLeague(t);proposal.staff[key]=count;this.checkTeam(proposal);if(!t.draft&&key==="teamRerolls"&&count<old)throw Error("Purchased re-rolls cannot be removed");const change=count-old,cost=change>0?change*prices[key]*(key==="teamRerolls"&&!t.draft?2:1):t.draft?change*prices[key]:0;if(cost>t.treasury)throw Error("Not enough gold");t.staff[key]=count;t.treasury-=cost;}
 values(t){const staff=t.staff.teamRerolls*this.roster(t).reroll+t.staff.apothecary*50000+(t.staff.assistants+t.staff.cheerleaders)*10000;return {tv:staff+t.players.reduce((n,p)=>n+p.value,0),ctv:staff+t.players.filter(p=>!p.missNext&&!p.retired).reduce((n,p)=>n+p.value,0)};}
 submit(id){const t=this.team(id);this.checkTeam(t);if(!t.draft)throw Error("Team is already submitted");if(t.players.length<11)throw Error("A rookie team needs at least 11 players");if(t.players.filter(p=>p.profile.skills.includes("Insignificant")).length>t.players.length/2)throw Error("Too many Insignificant players");t.draft=false;return t;}
 createLeague(name){if(!name.trim())throw Error("Enter a league name");const league={id:this.id(),name:name.trim().slice(0,80),teamIds:[]};this.data.leagues.push(league);return league;}
 enterLeague(lid,tid){this.assertIdle(tid);const l=this.data.leagues.find(l=>l.id===lid),t=this.team(tid);if(!l||t.draft)throw Error("Submit the team before league entry");if(this.data.leagues.some(l=>l.teamIds.includes(tid)))throw Error("Team already belongs to a league");l.teamIds.push(tid);}
 eligibleSkill(p,name){if(p.profile.skills.includes(name))return false;const pairs=[["Frenzy","Grab"],["Frenzy","Hit and Run"],["Leap","Pogo"]];if(pairs.some(([a,b])=>name===a&&p.profile.skills.includes(b)||name===b&&p.profile.skills.includes(a)))return false;const needs={"Lethal Flight":"Right Stuff","Saboteur":"Secret Weapon","Strong Arm":"Throw Team-mate","Bullseye":"Throw Team-mate"};if(needs[name]&&!p.profile.skills.includes(needs[name]))return false;if(name==="Violent Innovator"&&!p.profile.skills.some(s=>LeagueSpecialTraits.includes(s)))return false;return true;}
 skillOptions(p,secondary=false){const access=p.profile[secondary?"secondary":"primary"].split(/\s+/);return Object.entries(LeagueSkills).filter(([cat])=>cat!=="Traits"&&access.includes(cat[0])).flatMap(([,names])=>names).filter(n=>this.eligibleSkill(p,n));}
 advance(id,pid,name,secondary=false){this.assertIdle(id);const t=this.team(id),p=t.players.find(p=>p.id===pid);if(!p||t.draft||p.advances.length>=6)throw Error("Player cannot advance");const pending=t.pendingAdvance;if(pending&&pending.playerId!==pid)throw Error("Resolve the pending advancement first");if(pending){if(!pending.options.includes(name))throw Error("Choose one of the rolled advances");}else {if(!this.skillOptions(p,secondary).includes(name))throw Error("Skill is unavailable");const cost=ADVANCEMENT_COSTS[p.advances.length][secondary?2:1];if(p.spp<cost)throw Error("Not enough SPP");p.spp-=cost;}
 let value;if(["ma","st","ag","pa","av"].includes(name)){const v=parseInt(p.profile[name]);p.profile[name]=["ma","st"].includes(name)?v+1:(v+(["ag","pa"].includes(name)?-1:1))+"+";value={ma:20000,st:60000,ag:30000,pa:20000,av:10000}[name];}else {secondary=!p.profile.primary.split(/\s+/).some(c=>(LeagueSkills[Object.keys(LeagueSkills).find(k=>k[0]===c)]||[]).includes(name));p.profile.skills.push(name);value=(secondary?40000:20000)+(ELITE_SKILLS.includes(name)?10000:0);}
 p.value+=value;p.advances.push({name,value,cost:pending?.cost??ADVANCEMENT_COSTS[p.advances.length][secondary?2:1]});delete t.pendingAdvance;return p;}
 rollAdvance(id,pid,kind,category){this.assertIdle(id);const t=this.team(id),p=t.players.find(p=>p.id===pid);if(!["random","characteristic"].includes(kind)||t.draft||!p||p.advances.length>=6||t.pendingAdvance)throw Error("Cannot roll advancement");const cost=ADVANCEMENT_COSTS[p.advances.length][kind==="characteristic"?3:0];if(p.spp<cost)throw Error("Not enough SPP");let options=[];
 if(kind==="characteristic"){const roll=this.roll(8),table=[[],["av"],["av","pa"],["av","ma","pa"],["av","ma","pa"],["ma","pa"],["ag","ma"],["ag","st"],["ma","st","ag","pa","av"]];options=table[roll].filter(k=>this.canImprove(p,k));options.push(...this.skillOptions(p),...this.skillOptions(p,true));}
 else {if(!p.profile.primary.split(/\s+/).includes(category?.[0])||!LeagueSkills[category])throw Error("Choose a Primary category");const eligible=LeagueSkills[category].filter(n=>this.eligibleSkill(p,n));if(!eligible.length)throw Error("No eligible skills in category");for(let i=0;i<2;i++){let n;let attempts=0;do {if(++attempts>1000)throw Error("Random skill dice failed");n=LeagueSkills[category][(this.roll()>3?6:0)+this.roll()-1];}while(!eligible.includes(n));options.push(n);}}
 p.spp-=cost;t.pendingAdvance={playerId:pid,cost,options:[...new Set(options)]};return t.pendingAdvance;}
 matchTeam(t){const r=cloneLeague(this.roster(t)),available=t.players.filter(p=>!p.missNext&&!p.retired).map(cloneLeague),lineman=r.positions.findIndex(p=>p.max===16&&p.traits.includes("Lineman"));if(lineman<0)throw Error("No Journeyman position");while(available.length<11){const p=this.newPlayer(t,lineman,"Journeyman");p.journeyman=true;p.profile.skills.push("Loner (4+)");p.number=Math.max(0,...t.players.map(p=>p.number),...available.map(p=>p.number))+1;available.push(p);}r.name=t.name;r.lineup=available.map(p=>p.role);r.matchPlayers=available;r.matchResources=cloneLeague(t.staff);r.leagueTeamId=t.id;r.treasury=t.treasury;r.ctv=this.values(t).ctv+available.filter(p=>p.journeyman).reduce((n,p)=>n+p.value,0);return r;}
 startFixture(home,away){if(this.data.active)throw Error("A fixture is already active");if(home===away)throw Error("Choose two different teams");const league=this.data.leagues.find(l=>l.teamIds.includes(home)&&l.teamIds.includes(away));if(!league)throw Error("Both teams must enter the same league");const ts=[home,away].map(id=>this.team(id));if(ts.some(t=>t.draft||t.postgame||t.pendingAdvance||t.players.some(p=>p.advances.length<6&&p.spp>=ADVANCEMENT_COSTS[p.advances.length][3])))throw Error("Finish post-game steps and required advancements first");const teams=ts.map(t=>this.matchTeam(t));this.data.active={id:this.id(),leagueId:league.id,teamIds:[home,away],teams,versions:ts.map(t=>t.history.length)};return cloneLeague(this.data.active);}
 finishFixture(game,nominations){const a=this.data.active;if(!a||game.leagueFixtureId!==a.id||game.phase!=="finished"||game.pending)throw Error("Complete the active fixture first");if(this.data.matches.some(m=>m.id===a.id))throw Error("Fixture already recorded");for(let i=0;i<2;i++){const eligible=game.players.filter(p=>p.team===i&&p.fieldedDrive!=null);const list=nominations[i];if(!Array.isArray(list)||list.length!==6||new Set(list).size!==6||list.some(id=>!eligible.some(p=>p.id===id)))throw Error("Nominate six different eligible players for each MVP");}
 // Work on a clone; both teams and the match record commit together.
 const draft=new LeagueStore(this.rosters,this.data,{dice:this.dice}),record={id:a.id,leagueId:a.leagueId,teamIds:a.teamIds,scores:[...game.scores],date:new Date().toISOString(),teams:[]};
 for(let i=0;i<2;i++){const t=draft.team(a.teamIds[i]),mvp=nominations[i][draft.roll()-1],score=game.scores[i],opponent=game.scores[1-i],outcome=score>opponent?"won":score===opponent?"drawn":"lost",winnings=((game.fans[0]+game.fans[1])/2+score+(game.stalledTeams?.[i]?0:1))*10000;for(const p of t.players)p.missNext=false;
 const journeymen=[];for(const mp of game.players.filter(p=>p.team===i)){let p=t.players.find(p=>p.id===mp.leaguePlayerId);if(!p&&mp.journeyman){p=cloneLeague(mp.leagueRecord);journeymen.push(p);}if(!p)continue;const stats={...(game.playerStats?.[mp.id]||{})};if(mp.id===mvp)stats.mvp=(stats.mvp||0)+1;let earned=0;const awards={...game.teamSppAwards(i),landing:1};for(const [key,n] of Object.entries(stats)){p.stats[key]=(p.stats[key]||0)+n;earned+=n*(awards[key]||0);}p.spp+=earned;p.earnedSpp+=earned;if(mp.fieldedDrive!=null)p.stats.games++;const injuries=game.injuryRecords.filter(r=>r.playerId===mp.id&&r.status==="casualty"&&r.selected).map(r=>r.selected);if(mp.eaten)injuries.push({dead:true,result:"Eaten"});for(const injury of injuries){p.injuries.push(cloneLeague(injury));if(injury.dead)p.dead=true;if(injury.missNext)p.missNext=true;if(injury.niggling)p.nigglingInjuries++;if(injury.attribute){p.lastLastingMatch=a.id;const k=injury.attribute,v=parseInt(p.profile[k]),n=v+(["ag","pa"].includes(k)?1:-1);p.profile[k]=k==="pa"&&p.profile[k]==="-"?"-":["ma","st"].includes(k)?Math.max(1,n):Math.min(k==="av"?11:6,Math.max(k==="av"?3:1,n))+"+";}}}
 t.archive.push(...t.players.filter(p=>p.dead).map(p=>({...p,reason:"Dead"})));t.players=t.players.filter(p=>!p.dead);t.treasury+=winnings-(game.leagueTreasurySpend?.(i)||0);if(outcome!=="drawn"){const die=draft.roll();if(outcome==="won"&&die>=t.staff.dedicatedFans)t.staff.dedicatedFans=Math.min(7,t.staff.dedicatedFans+1);if(outcome==="lost"&&die<t.staff.dedicatedFans)t.staff.dedicatedFans=Math.max(1,t.staff.dedicatedFans-1);}const casualties=game.players.filter(p=>p.team===i).reduce((n,p)=>n+(game.playerStats?.[p.id]?.casualty||0),0);t.record.played++;t.record[outcome]++;t.record.points+=outcome==="won"?3:outcome==="drawn"?1:0;t.record.tdFor+=score;t.record.tdAgainst+=opponent;t.record.casualties+=casualties;t.history.push(a.id);t.postgame={matchId:a.id,journeymen:journeymen.filter(p=>!p.dead)};record.teams.push({teamId:t.id,outcome,winnings,mvp,casualties});}
 draft.data.matches.push(record);draft.data.active=null;this.data=draft.data;return record;}
 temporarilyRetire(id,pid){this.assertIdle(id);const t=this.team(id),p=t.players.find(p=>p.id===pid);if(!p||!t.postgame||p.lastLastingMatch!==t.postgame.matchId||p.retired)throw Error("Only a new Lasting Injury permits temporary retirement");p.retired=true;}
 hireJourneyman(id,pid){this.assertIdle(id);const t=this.team(id),p=t.postgame?.journeymen.find(p=>p.id===pid);if(!p)throw Error("Unknown Journeyman");const base=this.roster(t).positions[p.role];if(t.players.length>=16||t.players.filter(q=>q.role===p.role).length>=base.max||t.treasury<p.value)throw Error("Cannot hire Journeyman");t.treasury-=p.value;p.profile.skills=p.profile.skills.filter(s=>s!=="Loner (4+)");p.journeyman=false;if(t.players.some(q=>q.number===p.number))p.number=Math.max(0,...t.players.map(q=>q.number))+1;t.players.push(p);t.postgame.journeymen=t.postgame.journeymen.filter(q=>q!==p);}
 prepareNext(id){this.assertIdle(id);const t=this.team(id);if(!t.postgame||t.pendingAdvance)throw Error("Resolve post-game decisions first");if(t.players.some(p=>p.advances.length<6&&p.spp>=ADVANCEMENT_COSTS[p.advances.length][3]))throw Error("A player must take an advancement");let loss=0,result="No roll required";if(t.treasury>=100000){const band=Math.min(5,Math.floor(t.treasury/100000)-1),n=this.roll(),table=[[1,0,0,0,0,0],[1,1,0,0,0,0],[2,1,1,0,0,0],[2,2,1,1,0,0],[3,2,2,1,0,0],[3,3,2,2,1,1]],severity=table[band][n-1];result=["Crisis averted","Minor incident","Major incident","Catastrophe"][severity];loss=severity===1?Math.ceil(this.roll()/2)*10000:severity===2?t.treasury-Math.floor(t.treasury/2/5000)*5000:severity===3?Math.max(0,t.treasury-(this.roll()+this.roll())*10000):0;}t.treasury-=loss;t.lastMistake={result,loss};delete t.postgame;return t.lastMistake;}
}
if(typeof module!=="undefined")module.exports={LeagueStore,ADVANCEMENT_COSTS,ELITE_SKILLS};
