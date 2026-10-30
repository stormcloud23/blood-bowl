const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {LeagueStore,ADVANCEMENT_COSTS}=require('./league.cjs'),{MatchGame}=require('./match.cjs');
const html=fs.readFileSync('index.html','utf8'),rosters=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function setup(){const s=new LeagueStore(rosters,null,{dice:()=>6}),l=s.createLeague('Local League'),ts=rosters.map((r,i)=>{const t=s.create(r.id,'Team '+i);for(let n=0;n<11;n++)s.hire(t.id,0,'Player '+n);s.setStaff(t.id,'teamRerolls',2);s.submit(t.id);s.enterLeague(l.id,t.id);return t;});return {s,ts,l};}
function played(beforeStart=()=>{}){const f=setup();beforeStart(f);const a=f.s.startFixture(...f.ts.map(t=>t.id)),g=new MatchGame(a.teams,{dice:()=>6});g.leagueFixtureId=a.id;g.players.forEach(p=>p.fieldedDrive=1);g.phase='finished';g.fans=[4,3];g.scores=[1,0];return {...f,a,g,nominations:[0,1].map(i=>g.players.filter(p=>p.team===i).slice(0,6).map(p=>p.id))};}
test('rookie budget, roster limits, Treasury, TV and CTV are separate',()=>{const s=new LeagueStore(rosters),t=s.create(rosters[0].id,'Nobles');assert.throws(()=>s.submit(t.id),/11/);for(let i=0;i<11;i++)s.hire(t.id,0);s.setStaff(t.id,'dedicatedFans',3);s.setStaff(t.id,'teamRerolls',2);const cost=11*rosters[0].positions[0].cost+2*rosters[0].reroll;assert.equal(t.treasury,1000000-cost-10000);assert.equal(s.values(t).tv,cost);assert.throws(()=>s.setStaff(t.id,'dedicatedFans',4));t.players[0].missNext=true;assert.equal(s.values(t).ctv,cost-t.players[0].value);});
test('position caps, sixteen-player cap and unaffordable hires do not spend gold',()=>{const s=new LeagueStore(rosters),t=s.create(rosters[1].id,'Orcs');for(let i=0;i<6;i++)s.hire(t.id,1);const gold=t.treasury;assert.throws(()=>s.hire(t.id,1),/full/);assert.equal(t.treasury,gold);assert.throws(()=>s.setStaff(t.id,'teamRerolls',8),/gold/);assert.equal(t.staff.teamRerolls,0);});
test('draft removals refund, league releases do not, later re-rolls cost double with normal TV',()=>{const {s,ts:[t]}=setup(),gold=t.treasury,old=s.values(t).tv;s.setStaff(t.id,'teamRerolls',3);assert.equal(t.treasury,gold-rosters[0].reroll*2);assert.equal(s.values(t).tv,old+rosters[0].reroll);assert.throws(()=>s.setStaff(t.id,'teamRerolls',2),/removed/);assert.throws(()=>s.fire(t.id,t.players[0].id),/11/);s.hire(t.id,0);const remaining=t.treasury;s.fire(t.id,t.players[0].id);assert.equal(t.treasury,remaining);});
test('teams must be submitted and share a league; active fixture locks management and other fixtures',()=>{const {s,ts}=setup();assert.throws(()=>s.startFixture(ts[0].id,ts[0].id));s.startFixture(...ts.map(t=>t.id));assert.throws(()=>s.hire(ts[0].id,0),/active/);assert.throws(()=>s.fire(ts[0].id,ts[0].players[0].id),/active/);assert.throws(()=>s.startFixture(...ts.map(t=>t.id)),/active/);});
test('missing players get temporary Loner Journeymen and injured players are excluded from match/CTV',()=>{const {s,ts:[t]}=setup();t.players[0].missNext=true;t.players[1].missNext=true;t.players[2].profile.skills.push('Guard');t.players[2].nigglingInjuries=1;const m=s.matchTeam(t);assert.equal(m.lineup.length,11);assert.equal(m.matchPlayers.filter(p=>p.journeyman).length,2);assert.ok(m.matchPlayers.filter(p=>p.journeyman).every(p=>p.profile.skills.includes('Loner (4+)')));assert.equal(m.ctv,s.values(t).tv);const g=new MatchGame([m,s.matchTeam(s.data.teams[1])]);assert.ok(g.players[0].profileOverride.skills.includes('Guard'));assert.equal(g.players[0].nigglingInjuries,1);assert.equal(t.players.length,11);});
test('league staff stay fixed and inducements obey CTV/Petty Cash and Treasury caps',()=>{const {s,ts}=setup();ts[0].players[0].value+=20000;const a=s.startFixture(...ts.map(t=>t.id)),g=new MatchGame(a.teams);g.phase='leagueSteps';assert.equal(g.setResource(0,'teamRerolls',8),false);const high=g.teams[0].ctv>g.teams[1].ctv?0:1,low=1-high;assert.equal(g.setResource(high,'kegs',1),true);assert.equal(g.leagueTreasurySpend(high),50000);g.lockLeagueInducements(high);assert.equal(g.setResource(low,'kegs',1),true);assert.equal(g.leagueTreasurySpend(low),0);g.teams[0].ctv=g.teams[1].ctv;g.resourceChoices.forEach(r=>r.kegs=0);assert.equal(g.setResource(0,'kegs',1),false);});
test('league constructor supports Dedicated Fans seven without loosening exhibition limit',()=>{const {s,ts}=setup();ts[0].staff.dedicatedFans=7;assert.doesNotThrow(()=>new MatchGame(ts.map(t=>s.matchTeam(t))));assert.throws(()=>new MatchGame(rosters,{resources:[{dedicatedFans:7}]}));});
test('post-game records both teams atomically, awards MVP and winnings, then refuses duplicate application',()=>{const {s,g,nominations}=played(),old=s.data.teams[0].treasury;g.recordStat(g.players[0],'touchdown');const result=s.finishFixture(g,nominations),t=s.data.teams[0];assert.equal(t.players[0].spp,3);assert.equal(t.players[5].spp,4);assert.equal(t.treasury,old+55000);assert.equal(t.record.points,3);assert.equal(t.record.played,1);assert.equal(result.teams[0].winnings,55000);assert.equal(s.data.active,null);const json=JSON.stringify(s.data);assert.throws(()=>s.finishFixture(g,nominations));assert.equal(JSON.stringify(s.data),json);});
test('MVP requires six distinct participants and failed validation changes neither team',()=>{const {s,g,nominations}=played(),before=JSON.stringify(s.data);nominations[1][0]=nominations[1][1];assert.throws(()=>s.finishFixture(g,nominations),/six/);assert.equal(JSON.stringify(s.data),before);});
test('unfinished games cannot progress teams',()=>{const {s,g,nominations}=played();g.phase='play';assert.throws(()=>s.finishFixture(g,nominations),/Complete/);assert.equal(s.data.teams[0].record.played,0);});
test('Black Orc TD and casualty awards differ from ordinary awards',()=>{const {s,g,nominations}=played(),p=g.players.find(p=>p.team===1);g.recordStat(p,'touchdown');g.recordStat(p,'casualty');s.finishFixture(g,nominations);assert.equal(s.data.teams[1].players[0].spp,5);});
test('effective casualties apply MNG, niggles and characteristic loss; existing MNG clears after sitting out',()=>{const {s,g,nominations}=played(({ts})=>ts[0].players[2].missNext=true);const t=s.data.teams[0];g.injuryRecords.push({playerId:g.players[0].id,status:'casualty',selected:{result:'Smashed knee',missNext:true,attribute:'ma'}},{playerId:g.players[1].id,status:'casualty',selected:{result:'Serious injury',missNext:true,niggling:true}});s.finishFixture(g,nominations);const next=s.data.teams[0];assert.equal(next.players[0].profile.ma,t.players[0].profile.ma-1);assert.equal(next.players[0].missNext,true);assert.equal(next.players[1].nigglingInjuries,1);assert.equal(next.players[2].missNext,false);assert.ok(!s.matchTeam(next).matchPlayers.some(p=>p.id===next.players[0].id));});
test('healed casualty gives SPP without permanent injury, death and eaten players leave roster',()=>{const {s,g,nominations}=played(),p=g.players[0],victim=g.players[11];g.resolveInjury(victim,12,()=>{},{source:{playerId:p.id,cause:'Block'}});assert.equal(g.playerStats[p.id].casualty,1);g.injuryRecords[0].status='reserve';g.players[1].eaten=true;s.finishFixture(g,nominations);assert.equal(s.data.teams[0].players.length,10);assert.equal(s.data.teams[1].players[0].injuries.length,0);assert.equal(s.data.teams[0].players[0].spp,2);});
test('only opposing qualifying casualties earn credit, including Arm Bar and Lethal Flight',()=>{const g=new MatchGame(rosters,{dice:()=>6});for(const cause of ['Foul','Animal Savagery','Bomb','Block','Arm Bar','Lethal Flight'])g.resolveInjury(g.players[11],12,()=>{},{source:{playerId:g.players[0].id,cause}});assert.equal(g.playerStats[g.players[0].id].casualty,3);g.resolveInjury(g.players[1],12,()=>{},{source:{playerId:g.players[0].id,cause:'Block'}});assert.equal(g.playerStats[g.players[0].id].casualty,3);});
test('chosen skills spend correct SPP, Elite value adds 10k and advances reach match profiles',()=>{const {s,ts:[t]}=setup(),p=t.players[0],value=p.value;p.spp=30;s.advance(t.id,p.id,'Block');assert.equal(p.spp,24);assert.equal(p.value,value+30000);assert.equal(p.advances[0].cost,6);assert.ok(s.matchTeam(t).matchPlayers[0].profile.skills.includes('Block'));assert.throws(()=>s.advance(t.id,p.id,'Block'));s.advance(t.id,p.id,'Dodge',true);assert.equal(p.spp,12);assert.equal(p.value,value+80000);});
test('prerequisites and FFB ownership conflicts prevent unusable skills, traits cannot be learned',()=>{const {s,ts:[t]}=setup(),p=t.players[0];p.spp=100;assert.throws(()=>s.advance(t.id,p.id,'Saboteur',true));assert.throws(()=>s.advance(t.id,p.id,'Loner (4+)',true));p.profile.skills.push('Frenzy');assert.equal(s.eligibleSkill(p,'Grab'),false);assert.equal(s.eligibleSkill(p,'Hit and Run'),false);assert.equal(s.eligibleSkill(p,'Multiple Block'),true);});
test('random advancement commits SPP and two table rolls before choosing, survives reload',()=>{const {s,ts:[t]}=setup(),p=t.players[0];p.spp=10;const seq=[1,1,6,6];s.dice=()=>seq.shift();const pending=s.rollAdvance(t.id,p.id,'random','General');assert.deepEqual(pending.options,['Block','Wrestle']);assert.equal(p.spp,7);const reload=new LeagueStore(rosters,s.data);assert.throws(()=>reload.advance(t.id,p.id,'Tackle'));reload.advance(t.id,p.id,'Block');assert.equal(reload.team(t.id).players[0].spp,7);assert.equal(reload.team(t.id).pendingAdvance,undefined);});
test('characteristic roll offers only rolled attributes or fallback skills and accounts for value',()=>{const {s,ts:[t]}=setup(),p=t.players[0];p.spp=20;s.dice=()=>1;s.rollAdvance(t.id,p.id,'characteristic');assert.equal(p.spp,6);assert.throws(()=>s.advance(t.id,p.id,'st'));const av=parseInt(p.profile.av);s.advance(t.id,p.id,'av');assert.equal(p.profile.av,av+1+'+');assert.equal(p.advances[0].value,10000);});
test('six advances is maximum; mandatory advancement blocks starting another fixture',()=>{const {s,ts}=setup();ts[0].players[0].spp=14;assert.throws(()=>s.startFixture(...ts.map(t=>t.id)),/advancement/);const p=ts[0].players[0];p.advances=Array.from({length:6},()=>({name:'test'}));assert.throws(()=>s.advance(ts[0].id,p.id,'Block'));assert.equal(ADVANCEMENT_COSTS[5][3],38);});
test('Expensive Mistakes runs after hiring and only once',()=>{const {s,g,nominations}=played();s.finishFixture(g,nominations);const t=s.data.teams[0];t.treasury=300000;s.dice=()=>1;const result=s.prepareNext(t.id);assert.equal(result.result,'Major incident');assert.equal(t.treasury,150000);assert.throws(()=>s.prepareNext(t.id));});
test('earned Journeyman SPP can be retained by hiring at base cost without Loner',()=>{const {s,ts}=setup();ts[0].players[0].missNext=true;const a=s.startFixture(...ts.map(t=>t.id)),g=new MatchGame(a.teams);g.leagueFixtureId=a.id;g.phase='finished';g.fans=[2,2];g.players.forEach(p=>p.fieldedDrive=1);const j=g.players.find(p=>p.journeyman);g.recordStat(j,'touchdown');s.finishFixture(g,[0,1].map(i=>g.players.filter(p=>p.team===i).slice(0,6).map(p=>p.id)));const t=s.data.teams[0],pid=t.postgame.journeymen[0].id;s.hireJourneyman(t.id,pid);const p=t.players.find(p=>p.id===pid);assert.equal(p.spp,3);assert.ok(!p.profile.skills.includes('Loner (4+)'));});
test('storage schema rejects unsupported backups, duplicate teams and invalid roster allowances',()=>{assert.throws(()=>new LeagueStore(rosters,{version:2}));const {s}=setup();s.data.teams.push(s.data.teams[0]);assert.throws(()=>new LeagueStore(rosters,s.data),/Duplicate/);});
test('all committed league scripts match source and all browser JavaScript compiles',()=>{for(const id of ['league-engine','league-ui']){const script=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'))[1];assert.equal(script.trim(),fs.readFileSync(id==='league-engine'?'league.cjs':'league-ui.cjs','utf8').trim());}new vm.Script([...html.matchAll(/<script(?: id="[^"]+")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n'));});
test('touchdown hook credits scorer once before ending the drive',()=>{const g=new MatchGame(rosters);g.phase='play';const p=g.players[0];Object.assign(p,{x:25,y:7,status:'standing'});g.ball={x:25,y:7,carrier:p.id};g.checkScore();g.checkScore();assert.equal(g.playerStats[p.id].touchdown,1);});
test('accurate pass awards a completion before a scoring catch clears the action',()=>{const g=new MatchGame(rosters,{dice:()=>6});g.phase='play';const p=g.players[0],catcher=g.players[1];Object.assign(catcher,{x:25,y:7,status:'standing'});g.passContext={p};g.landBall(25,7,false,()=>{},true,{kind:'pass',accurate:true,accurateToPlayer:true,target:{x:25,y:7}});assert.equal(g.playerStats[p.id].completion,1);assert.equal(g.playerStats[catcher.id].touchdown,1);});
test('inaccurate catches and bounced passes do not award completions',()=>{const g=new MatchGame(rosters,{dice:()=>6}),p=g.players[0],c=g.players[1];g.phase='play';Object.assign(c,{x:10,y:7,status:'standing'});g.passContext={p};g.landBall(10,7,false,()=>{},true,{kind:'pass',accurate:false,target:{x:10,y:7}});assert.equal(g.playerStats[p.id]?.completion,undefined);g.landBall(10,7,false,()=>{},false,{kind:'bounce'});assert.equal(g.playerStats[p.id]?.completion,undefined);});
test('successful interception credits two-SPP statistic',()=>{const g=new MatchGame(rosters,{dice:()=>6}),p=g.players[0],q=g.players[11];g.phase='play';g.interceptionCandidates=()=>[q];g.interceptPass(p,{x:20,y:7},true,()=>assert.fail('Intercepted'));g.decide('Intercept with #'+q.number);assert.equal(g.playerStats[q.id].interception,1);});
test('a successful Superb Throw credits thrower and passenger; failed landing credits neither',()=>{const {SkillGame}=require('./skills.cjs');for(const [rolls,successful] of [[[6,5,5,5,6],true],[[2,5,5,5,1,1,2],false]]){const queue=[...rolls],g=new SkillGame(rosters,{scenario:'pickup',dice:()=>queue.shift()}),a=g.players[0],p=g.players[1];g.rerolls=[0,0];a.extraSkills=['Throw Team-mate'];p.extraSkills=['Right Stuff'];Object.assign(p,{x:9,y:7});g.start(a.id,'throw-team-mate');g.selectThrowMate(p.id);g.throwTeamMate(12,7);assert.equal(g.playerStats?.[a.id]?.completion,successful?1:undefined);assert.equal(g.playerStats?.[p.id]?.landing,successful?1:undefined);}});
test('a new Lasting Injury can retire a player while retaining roster slot and TV',()=>{const {s,g,nominations}=played();g.injuryRecords.push({playerId:g.players[0].id,status:'casualty',selected:{result:'Smashed knee',missNext:true,attribute:'ma'}});s.finishFixture(g,nominations);const t=s.data.teams[0],p=t.players[0],tv=s.values(t).tv;s.temporarilyRetire(t.id,p.id);assert.equal(t.players.length,11);assert.equal(s.values(t).tv,tv);assert.ok(!s.matchTeam(t).matchPlayers.some(q=>q.id===p.id));assert.throws(()=>s.temporarilyRetire(t.id,t.players[1].id));});
test('fans respect 1–7 bounds, stalling removes only the winnings bonus',()=>{const {s,g,nominations}=played(({ts})=>{ts[0].staff.dedicatedFans=7;ts[1].staff.dedicatedFans=1;});g.stalledTeams=[true,false];const r=s.finishFixture(g,nominations);assert.equal(r.teams[0].winnings,45000);assert.equal(s.data.teams[0].staff.dedicatedFans,7);assert.equal(s.data.teams[1].staff.dedicatedFans,1);});

test('backups reject malformed profiles, incomplete records and duplicate shirt numbers',()=>{
 for(const mutate of [
  d=>d.teams[0].players[0].profile.ma='6oops',
  d=>d.teams[0].players[0].profile.ag='0+',
  d=>d.teams[0].players[0].profile.traits=null,
  d=>delete d.teams[0].players[0].stats.games,
  d=>delete d.teams[0].record.played,
  d=>d.teams[0].players[1].number=d.teams[0].players[0].number,
  d=>d.teams[1].players[0].id=d.teams[0].players[0].id,
  d=>d.teams[0].history.push('missing-match')
 ]){const {s}=setup();mutate(s.data);assert.throws(()=>new LeagueStore(rosters,s.data));}
});

test('stored active fixtures validate rosters, budgets, membership and snapshot versions',()=>{
 for(const mutate of [
  d=>d.active.teams[0].lineup.pop(),
  d=>d.active.teams[0].lineup[0]=4,
  d=>d.active.teams[0].matchPlayers[0].profile.ma=9,
  d=>d.active.teams[0].ctv=0,
  d=>d.active.teams[0].treasury+=50000,
  d=>d.active.teams[0].matchResources.teamRerolls=8,
  d=>d.active.teams[0].special.push('Master Chef'),
  d=>d.active.versions[0]++,
  d=>d.leagues[0].teamIds.pop()
 ]){const {s,ts}=setup();s.startFixture(...ts.map(t=>t.id));mutate(s.data);assert.throws(()=>new LeagueStore(rosters,s.data));}
});

test('valid active backups survive reordered object keys and include injured-player Journeymen',()=>{
 const {s,ts}=setup();ts[0].players[0].missNext=true;ts[1].players[1].retired=true;
 s.startFixture(...ts.map(t=>t.id));
 const reordered=JSON.parse(JSON.stringify(s.data,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).reverse()):v));
 const reload=new LeagueStore(rosters,reordered),g=new MatchGame(reload.data.active.teams);
 assert.equal(g.players.filter(p=>p.journeyman).length,2);assert.equal(reload.data.active.id,s.data.active.id);
});

test('completed match backups keep dead archives and reject same-team or foreign-league matches',()=>{
 const {s,g,nominations}=played();g.players[0].eaten=true;s.finishFixture(g,nominations);
 assert.doesNotThrow(()=>new LeagueStore(rosters,s.data));
 const invalid=structuredClone(s.data);invalid.matches[0].teamIds[1]=invalid.matches[0].teamIds[0];
 assert.throws(()=>new LeagueStore(rosters,invalid),/match record/);
});

test('pending advancement backups reject forged skills and impossible characteristic gains',()=>{
 for(const option of ['Secret Weapon','st','not a skill']){
  const {s,ts:[t]}=setup(),p=t.players[0];p.spp=14;s.dice=()=>1;s.rollAdvance(t.id,p.id,'characteristic');
  if(option==='st')p.profile.st=8;t.pendingAdvance.options=[option];
  assert.throws(()=>new LeagueStore(rosters,s.data),/advancement/);
 }
});

test('a PA-dash player retains the dash after a passing characteristic injury',()=>{
 const {s,g,nominations}=played(({ts})=>ts[0].players[0].profile.pa='-');
 g.injuryRecords.push({playerId:g.players[0].id,status:'casualty',selected:{result:'Broken arm',missNext:true,attribute:'pa'}});
 s.finishFixture(g,nominations);assert.equal(s.data.teams[0].players[0].profile.pa,'-');
 assert.doesNotThrow(()=>new LeagueStore(rosters,s.data));
});

test('blank player names use the position name and unknown advancement modes spend nothing',()=>{
 const {s,ts:[t]}=setup();const p=s.hire(t.id,0,'   ');assert.equal(p.name,rosters[0].positions[0].name);p.spp=20;
 assert.throws(()=>s.rollAdvance(t.id,p.id,'bogus','General'));assert.equal(p.spp,20);
});

test('MVP nominations cannot contain a seventh entry duplicating one of the six choices',()=>{
 const {s,g,nominations}=played();nominations[0].push(nominations[0][0]);const before=JSON.stringify(s.data);
 assert.throws(()=>s.finishFixture(g,nominations),/six/);assert.equal(JSON.stringify(s.data),before);
});

test('hiring a Journeyman after a rookie assigns a free shirt number and survives reload',()=>{
 const {s,g,nominations}=played(({ts})=>ts[0].players[0].missNext=true);
 s.finishFixture(g,nominations);const t=s.data.teams[0],j=t.postgame.journeymen[0];
 const rookie=s.hire(t.id,0);assert.equal(rookie.number,j.number);s.hireJourneyman(t.id,j.id);
 assert.notEqual(rookie.number,j.number);assert.doesNotThrow(()=>new LeagueStore(rosters,s.data));
});

test('pinned Right Stuff awards landing and Superb Throw credit after a successful kick',()=>{
 const {SkillGame}=require('./skills.cjs'),rolls=[6,5,5,5,6],g=new SkillGame(rosters,{scenario:'pickup',dice:()=>rolls.shift()}),a=g.players[0],p=g.players[1];
 g.rerolls=[0,0];a.extraSkills=['Kick Team-mate'];p.extraSkills=['Right Stuff'];g.start(a.id,'kick-team-mate');g.selectThrowMate(p.id);g.throwTeamMate(12,7);
 assert.equal(g.playerStats[p.id].landing,1);assert.equal(g.playerStats[a.id].completion,1);
});
