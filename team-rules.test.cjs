const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {LeagueStore}=require('./league.cjs'),{MatchGame}=require('./match.cjs');
const catalogue=JSON.parse(fs.readFileSync('rosters.json','utf8')),clone=v=>JSON.parse(JSON.stringify(v)),roster=id=>clone(catalogue.find(r=>r.id===id));
function game(a='human',b='skaven'){return new MatchGame([roster(a),roster(b)]);}
function rolls(g,values){const queue=[...values];g.dice=s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;};return queue;}
function field(p,x=5,y=7){Object.assign(p,{x,y,status:'standing'});return p;}
function captainGame(){const g=game(),p=g.players[0];assert.ok(g.chooseCaptain(0,p.id));field(p);g.phase='play';g.active=0;return {g,p};}
function league(a,b){const s=new LeagueStore(catalogue,null,{dice:()=>6}),l=s.createLeague('Rules'),teams=[a,b].map((id,i)=>{const r=roster(id),t=s.create(id,'Club '+i);for(const role of r.lineup)s.hire(t.id,role);s.setStaff(t.id,'teamRerolls',2);s.submit(t.id);s.enterLeague(l.id,t.id);return t;});return {s,teams};}

test('Team Captain grants free Pro, can be changed in a draft, and excludes Big Guys',()=>{
 const s=new LeagueStore(catalogue),t=s.create('human','Humans'),a=s.hire(t.id,0),b=s.hire(t.id,2),ogre=s.hire(t.id,5),value=s.values(t).tv;
 s.appointCaptain(t.id,a.id);assert.ok(a.profile.skills.includes('Pro'));assert.equal(s.values(t).tv,value);s.appointCaptain(t.id,b.id);assert.ok(!a.profile.skills.includes('Pro'));assert.ok(b.profile.skills.includes('Pro'));assert.throws(()=>s.appointCaptain(t.id,ogre.id),/Big Guy/);assert.equal(t.captainId,b.id);assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));
});
test('a submitted captain can only be released after a characteristic injury, then replaced',()=>{
 const s=new LeagueStore(catalogue),t=s.create('human','Humans');for(let i=0;i<12;i++)s.hire(t.id,0);const p=t.players[0];s.appointCaptain(t.id,p.id);s.submit(t.id);assert.throws(()=>s.appointCaptain(t.id,t.players[1].id),/cannot be replaced/);assert.throws(()=>s.fire(t.id,p.id),/characteristic/);p.injuries.push({attribute:'ma'});p.profile.ma--;s.fire(t.id,p.id);assert.equal(t.captainId,undefined);s.appointCaptain(t.id,t.players[0].id);assert.ok(t.players[0].captain);
});
test('captain nominations reject forged duplicate captains in backups',()=>{
 const s=new LeagueStore(catalogue),t=s.create('human','Humans');s.hire(t.id,0);s.hire(t.id,0);s.appointCaptain(t.id,t.players[0].id);t.players[1].captain=true;assert.throws(()=>new LeagueStore(catalogue,s.data),/Captain/);
});
test('captain on a six saves a regular re-roll, including while prone and distracted',()=>{
 const {g,p}=captainGame();p.status='prone';p.distracted=true;const queue=rolls(g,[6]);assert.equal(g.useTeamReroll(p),true);assert.equal(g.rerolls[0],2);assert.equal(queue.length,0);
});
test('a captain failure spends the normal pool, while a reserve captain rolls nothing',()=>{
 const {g,p}=captainGame();rolls(g,[5]);assert.ok(g.useTeamReroll(p));assert.equal(g.rerolls[0],1);p.x=null;p.y=null;p.status='reserve';const queue=rolls(g,[]);assert.ok(g.useTeamReroll(p));assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('captain preservation happens before Loner and cannot bypass a failed Loner',()=>{
 const {g}=captainGame(),ogre=g.players.find(p=>p.team===0&&g.bigGuy(p));field(ogre,6,7);const queue=rolls(g,[6,1]);assert.equal(g.useTeamReroll(ogre),false);assert.equal(g.rerolls[0],2);assert.equal(queue.length,0);
});
test('captain saves Leader or expiring coaching resources without changing their priority',()=>{
 const {g,p}=captainGame();p.extraSkills.push('Leader');g.leaderPool[0]=true;rolls(g,[6]);assert.ok(g.useTeamReroll(p));assert.equal(g.leaderPool[0],true);assert.equal(g.rerolls[0],2);rolls(g,[2]);assert.ok(g.useTeamReroll(p));assert.equal(g.leaderPool[0],false);assert.equal(g.rerolls[0],2);
 g.leaderPool[0]=true;g.driveBonus[0]=1;rolls(g,[3]);const before=[...g.rerolls];assert.ok(g.useTeamReroll(p));g.consumeBonus(before);assert.equal(g.leaderPool[0],true);assert.equal(g.driveBonus[0],0);
});
test('successful Mascots can be preserved but failed Mascots are spent without a captain roll',()=>{
 const {g,p}=captainGame();g.mascots[0]=1;rolls(g,[4,6]);assert.ok(g.useRerollSource(p,'Mascot'));assert.equal(g.mascots[0],1);const queue=rolls(g,[1]);assert.equal(g.useRerollSource(p,'Mascot'),false);assert.equal(g.mascots[0],0);assert.equal(queue.length,0);
});
test('exhibition captain selection is guarded and setup must field an available captain',()=>{
 const g=game(),base=g.players[0],extra={...base,id:'0-12',number:12,extraSkills:[]};g.players.push(extra);assert.ok(g.chooseCaptain(0,extra.id));g.phase='kickChoice';g.chooseKicking(0);assert.ok(g.onPitch(extra));g.benchSetup(extra.id);assert.ok(g.setupErrors(0).some(e=>e.includes('Captain')));assert.equal(g.chooseCaptain(0,base.id),false);
});
test('captain identity and Pro reach league match snapshots and survive an active backup',()=>{
 const {s,teams}=league('human','skaven');s.appointCaptain(teams[0].id,teams[0].players[0].id);const f=s.startFixture(...teams.map(t=>t.id)),g=new MatchGame(f.teams);assert.ok(g.players[0].captain);assert.ok(g.has(g.players[0],'Pro'));assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));
});
for(const id of ['ogre','snotling'])test(id+' Low Cost Linemen removes hiring fees only from CTV, not Treasury or TV',()=>{
 const s=new LeagueStore(catalogue),r=roster(id),t=s.create(id,id);for(const role of r.lineup)s.hire(t.id,role);const before=s.values(t),linemen=t.players.filter(p=>r.positions[p.role].traits.includes('Lineman')),base=linemen.reduce((n,p)=>n+r.positions[p.role].cost,0);assert.equal(before.tv-before.ctv,base);assert.equal(t.treasury,1000000-before.tv);linemen[0].value+=20000;assert.equal(s.values(t).ctv,before.ctv+20000);assert.equal(s.values(t).tv,before.tv+20000);
});
test('Low Cost Linemen Journeymen add no hiring fee to CTV and active backups validate',()=>{
 const {s,teams}=league('ogre','skaven');teams[0].players[0].missNext=true;teams[0].players[1].missNext=true;const m=s.matchTeam(teams[0]);assert.equal(m.matchPlayers.filter(p=>p.journeyman).length,2);assert.equal(m.ctv,s.values(teams[0]).ctv);s.startFixture(...teams.map(t=>t.id));assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));
});
for(const [id,roles,max] of [['chaos-chosen',[2,3],1],['chaos-renegades',[6,7,8,9],3],['old-world-alliance',[9,10],1],['underworld-denizens',[6,7],1]])test(id+' enforces its combined Big Guy allowance without spending on an illegal hire',()=>{
 const s=new LeagueStore(catalogue),t=s.create(id,id);for(const role of roles.slice(0,max))s.hire(t.id,role);const gold=t.treasury;assert.throws(()=>s.hire(t.id,roles[max]),/full/);assert.equal(t.treasury,gold);
});
test('Chaos alignment is exclusive, enables Nurgle resources, persists and locks after submission',()=>{
 const s=new LeagueStore(catalogue),r=roster('chaos-chosen'),t=s.create(r.id,'Chosen');s.setRosterChoices(t.id,'Chaos Clash','Nurgle');for(const role of r.lineup)s.hire(t.id,role);s.submit(t.id);const g=new MatchGame([s.matchTeam(t),roster('skaven')]);assert.equal(g.hasTeamRule(0,'Favoured of Nurgle'),true);assert.equal(g.hasTeamRule(0,'Favoured of Khorne'),false);assert.equal(g.resourceSpec(0,'plagueDoctors').max,1);assert.throws(()=>s.setRosterChoices(t.id,'Chaos Clash','Khorne'),/fixed/);assert.equal(new LeagueStore(catalogue,s.data).team(t.id).alignment,'Nurgle');
});
test('Norse alignment applies only in Chaos Clash and Halflings get their Chef price',()=>{
 const n=roster('norse'),g=new MatchGame([n,roster('halfling')]);assert.equal(g.hasTeamRule(0,'Favoured of Khorne'),false);g.teams[0].league='Chaos Clash';assert.equal(g.hasTeamRule(0,'Favoured of Khorne'),true);assert.equal(g.resourceSpec(1,'masterChef').cost,100000);assert.equal(g.resourceSpec(0,'masterChef').cost,300000);
});
test('league choice and alignment are validated in active fixture snapshots',()=>{
 const {s,teams}=league('chaos-chosen','gnome');teams[0].alignment='Nurgle';teams[1].teamLeague='Woodland League';const f=s.startFixture(...teams.map(t=>t.id));assert.equal(f.teams[1].league,'Woodland League');assert.equal(f.teams[0].alignment,'Nurgle');assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));teams[0].alignment='Khorne';assert.throws(()=>new LeagueStore(catalogue,s.data),/snapshot|value/);
});
function swarmGame(die=3){const g=game('snotling','human');rolls(g,[die]);g.phase='kickChoice';g.chooseKicking(0);g.confirmSetup();g.confirmSetup();return g;}
test('Swarming occurs after both normal setups, allows up to D3 reserve Linemen and preserves normal formation',()=>{
 const g=swarmGame();assert.equal(g.phase,'swarming');assert.equal(g.swarmState.limit,3);assert.equal(g.players.filter(p=>p.team===0&&g.onPitch(p)).length,11);const eligible=[...g.swarmState.eligible];assert.ok(eligible.every(id=>g.profile(g.players.find(p=>p.id===id)).traits.includes('Lineman')));for(const [i,id] of eligible.slice(0,3).entries())assert.ok(g.placeSwarm(id,1+i,6));assert.equal(g.placeSwarm(eligible[3],4,6),false);assert.ok(g.finishSwarming());assert.equal(g.phase,'kicker');assert.equal(g.players.filter(p=>p.team===0&&g.onPitch(p)).length,14);assert.deepEqual(g.setupErrors(0),[]);assert.equal(g.finishSwarming(),false);
});
test('Swarming cannot move original players, enter the other half or overfill Wide Zones',()=>{
 const g=swarmGame(1),id=g.swarmState.eligible[0],original=g.players.find(p=>p.team===0&&g.onPitch(p));assert.equal(g.placeSwarm(original.id,1,6),false);assert.equal(g.placeSwarm(id,24,6),false);const back=g.players.find(p=>p.team===0&&g.onPitch(p)&&g.centre(p.y)&&p.x!==g.line(0));field(back,2,1);assert.equal(g.placeSwarm(id,1,0),false);assert.ok(g.finishSwarming());assert.equal(g.swarmCounts[0],0);assert.equal(g.players.filter(p=>p.team===0&&g.onPitch(p)).length,11);
});
test('a new drive resets Swarming and rolls only when reserve Linemen exist',()=>{
 const g=swarmGame();g.placeSwarm(g.swarmState.eligible[0],1,6);g.finishSwarming();g.prepareDrive(0);assert.deepEqual(g.swarmCounts,[0,0]);rolls(g,[2]);g.confirmSetup();g.confirmSetup();assert.equal(g.swarmState.limit,2);const ordinary=game();rolls(ordinary,[]);ordinary.phase='kickChoice';ordinary.chooseKicking(0);ordinary.confirmSetup();ordinary.confirmSetup();assert.equal(ordinary.phase,'kicker');
});
test('Masters of Undeath raises an uncredited final death once, after treatment',()=>{
 const g=game('necromantic-horror','human'),victim=g.players.find(p=>p.team===1);field(victim,15,7);rolls(g,[16,1]);let completed=0;g.resolveInjury(victim,12,()=>completed++);const raised=g.players.at(-1);assert.equal(raised.raisedKind,'Masters of Undeath');assert.equal(raised.status,'reserve');assert.equal(g.profile(raised).name,'Zombie Lineman');assert.equal(completed,1);const count=g.players.length;rolls(g,[16,1]);g.resolveInjury(g.players.find(p=>p.team===1&&p!==victim),12);assert.equal(g.players.length,count);
});
test('Masters excludes high Strength/Stunty victims and lets coaches select a lineman type',()=>{
 const g=game('shambling-undead','human'),p=g.players.find(p=>p.team===1);p.profileOverride={...g.profile(p),st:5};g.afterDeath(p,{},()=>{});assert.equal(g.plagueUsed[0],false);p.profileOverride={...g.profile(p),st:3,skills:['Stunty']};g.afterDeath(p,{},()=>{});assert.equal(g.plagueUsed[0],false);p.profileOverride={...g.profile(p),skills:[]};let resumed=0;g.afterDeath(p,{},()=>resumed++);assert.equal(g.pending.kind,'Raise Dead lineman');const q=g.pending;g.decide('Raise Skeleton Lineman');q.resolve('Raise Zombie Lineman');assert.equal(g.profile(g.players.at(-1)).name,'Skeleton Lineman');assert.equal(resumed,1);
});
test('a healed death cannot raise a reserve and no extra death roll is consumed',()=>{
 const g=game('necromantic-horror','human'),p=g.players.find(p=>p.team===1);g.apothecaries[1]=1;rolls(g,[16,1,1,1]);const before=g.players.length;g.resolveInjury(p,12);g.decide('Use Apothecary');assert.equal(p.status,'reserve');assert.equal(g.players.length,before);assert.equal(g.plagueUsed[0],false);
});
test('raised players survive postgame/reload and may be retained free at full TV',()=>{
 const {s,teams}=league('necromantic-horror','human'),f=s.startFixture(...teams.map(t=>t.id)),g=new MatchGame(f.teams);g.leagueFixtureId=f.id;g.players.forEach(p=>p.fieldedDrive=1);const victim=g.players.find(p=>p.team===1);rolls(g,[16,1]);g.resolveInjury(victim,12);g.phase='finished';g.fans=[2,2];const nominations=[0,1].map(i=>g.players.filter(p=>p.team===i&&p.fieldedDrive).slice(0,6).map(p=>p.id));s.finishFixture(g,nominations);const restored=new LeagueStore(catalogue,s.data),t=restored.team(teams[0].id);assert.equal(t.postgame.recruits.length,1);const p=t.postgame.recruits[0],gold=t.treasury,value=restored.values(t).tv;restored.hireRaised(t.id,p.id);assert.equal(t.players.length,12);assert.equal(t.treasury,gold);assert.equal(restored.values(t).tv,value+40000);assert.equal(t.postgame.recruits.length,0);assert.doesNotThrow(()=>new LeagueStore(catalogue,restored.data));
});
test('Vampire profiles recognize Thralls for existing Bloodlust feeding',()=>{
 const g=game('vampire','human'),vamp=g.players.find(p=>g.parameter(p,'Bloodlust')),thrall=g.players.find(p=>g.keywords(p).includes('thrall'));field(vamp,5,7);field(thrall,6,7);assert.ok(g.thralls(vamp).includes(thrall));
});
test('a captain cannot create a re-roll from an empty pool or be appointed late without a vacancy',()=>{
 const {g,p}=captainGame();g.rerolls[0]=0;rolls(g,[]);assert.equal(g.useTeamReroll(p),false);const s=new LeagueStore(catalogue),t=s.create('human','Humans');for(let i=0;i<11;i++)s.hire(t.id,0);s.submit(t.id);t.history.push('already-played');assert.throws(()=>s.appointCaptain(t.id,t.players[0].id),/former captain/);
});
test('a 16-player roster may raise a temporary seventeenth reserve but cannot retain it while full',()=>{
 const {s,teams}=league('necromantic-horror','human');teams[0].treasury+=500000;for(let i=0;i<5;i++)s.hire(teams[0].id,0);const f=s.startFixture(...teams.map(t=>t.id)),g=new MatchGame(f.teams);g.leagueFixtureId=f.id;g.players.forEach(p=>p.fieldedDrive=1);rolls(g,[16,1]);g.resolveInjury(g.players.find(p=>p.team===1),12);assert.equal(g.players.filter(p=>p.team===0).length,17);g.phase='finished';g.fans=[1,1];s.finishFixture(g,[0,1].map(i=>g.players.filter(p=>p.team===i&&p.fieldedDrive).slice(0,6).map(p=>p.id)));const t=s.team(teams[0].id),id=t.postgame.recruits[0].id;assert.throws(()=>s.hireRaised(t.id,id),/full/);assert.equal(t.players.length,16);
});
test('a dead league captain leaves a validated replacement vacancy without transferring free Pro',()=>{
 const {s,teams}=league('human','necromantic-horror');s.appointCaptain(teams[0].id,teams[0].players[0].id);const f=s.startFixture(...teams.map(t=>t.id)),g=new MatchGame(f.teams);g.leagueFixtureId=f.id;g.players.forEach(p=>p.fieldedDrive=1);rolls(g,[16,1]);g.resolveInjury(g.players[0],12);g.phase='finished';g.fans=[1,1];s.finishFixture(g,[0,1].map(i=>g.players.filter(p=>p.team===i&&p.fieldedDrive).slice(0,6).map(p=>p.id)));const t=s.team(teams[0].id);assert.equal(t.captainId,undefined);assert.equal(t.captainVacancy,true);assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));assert.ok(!t.players.some(p=>p.profile.skills.includes('Pro')));s.appointCaptain(t.id,t.players.find(p=>!p.profile.traits.includes("Big Guy")).id);assert.equal(t.captainVacancy,undefined);assert.doesNotThrow(()=>new LeagueStore(catalogue,s.data));
});
test('Masters waits for grouped bomb deaths and raises only once while resuming the medical group',()=>{
 const g=game('shambling-undead','human'),victims=g.players.filter(p=>p.team===1).slice(0,2),context={attacker:victims[0],stage:'blast',injuries:[]};g.bombContext=context;rolls(g,[16,1,16,1]);for(const p of victims)g.resolveInjury(p,12);assert.equal(context.injuries.length,2);assert.equal(g.injuryRecords.length,0);context.stage='medical';let completed=0;g.resolveMedicalGroups(context,()=>completed++);assert.equal(g.pending.kind,'Raise Dead lineman');g.decide('Raise Skeleton Lineman');assert.equal(completed,1);assert.equal(g.injuryRecords.length,2);assert.equal(g.players.filter(p=>p.raisedKind).length,1);assert.equal(g.pending,null);
});
for(const saved of [true,false])test('Masters '+(saved?'does not raise':'can raise')+' a Regeneration victim after its final treatment result',()=>{
 const g=game('necromantic-horror','human'),victim=g.players.find(p=>p.team===1);victim.extraSkills=['Regeneration'];rolls(g,[16,1,saved?6:1]);g.resolveInjury(victim,12);assert.equal(g.players.filter(p=>p.raisedKind).length,saved?0:1);assert.equal(victim.status,saved?'reserve':'casualty');
});
