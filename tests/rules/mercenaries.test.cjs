const {projectPath}=require('../helpers/project.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('../../src/engine/match.cjs'),{LeagueStore}=require('../../src/features/league/league.cjs');
const rosters=JSON.parse(fs.readFileSync(projectPath('src/data/rosters.json'),'utf8'));
function game(a='human',b='skaven'){return new MatchGame([a,b].map(id=>structuredClone(rosters.find(r=>r.id===id))));}
function choose(g,s){assert.ok(g.pending?.options.includes(s),g.pending?.kind);g.decide(s);}
function league(){const s=new LeagueStore(rosters,null,{dice:()=>6}),l=s.createLeague('Mercenary tests'),clubs=['human','skaven'].map(id=>{const t=s.create(id,id);for(const role of rosters.find(r=>r.id===id).lineup)s.hire(t.id,role);s.setStaff(t.id,'teamRerolls',2);s.submit(t.id);s.enterLeague(l.id,t.id);return t;});const f=s.startFixture(...clubs.map(t=>t.id)),g=new MatchGame(f.teams);g.leagueFixtureId=f.id;g.phase='leagueSteps';return {s,g,clubs};}

test('mercenary adds a reserve with Loner 4+ for base fee plus 30K, without changing the roster',()=>{
 const g=game(),before=JSON.stringify(g.teams),p=g.hireMercenary(0,0);assert.ok(p);assert.equal(p.status,'reserve');assert.equal(p.mercenary,true);assert.equal(p.raisedKind,undefined);assert.equal(p.journeyman,undefined);assert.equal(g.has(p,'Loner (4+)'),true);assert.equal(g.resourceCosts(0).inducements,g.teams[0].positions[0].cost+30000);assert.equal(JSON.stringify(g.teams),before);
});
test('one optional Primary skill adds 50K and rejects traits, secondary and existing skills',()=>{
 const g=game(),skills=g.mercenarySkills(0,0);assert.ok(skills.includes('Block'));assert.ok(!skills.includes('Dodge'));assert.equal(g.hireMercenary(0,0,'Dodge'),false);assert.equal(g.hireMercenary(0,0,'Loner (4+)'),false);assert.equal(g.hireMercenary(0,-1,'Block'),false);const p=g.hireMercenary(0,0,'Block');assert.ok(p);assert.equal(g.has(p,'Block'),true);assert.equal(g.resourceCosts(0).inducements,g.teams[0].positions[0].cost+80000);
});
test('mercenary optional skills follow FFB Primary category eligibility, including unusual combinations',()=>{
 const g=game('black-orc'),role=g.teams[0].positions.findIndex(p=>p.skills.includes('Grab'));assert.ok(role>=0);assert.ok(g.mercenarySkills(0,role).includes('Frenzy'));assert.equal(g.mercenarySkills(0,role).includes('Grab'),false);
});
test('mercenaries respect position, shared Big Guy and sixteen available-player limits',()=>{
 const g=game(),ogre=g.teams[0].positions.findIndex(p=>p.traits.includes('Big Guy'));g.players=g.players.filter(p=>!(p.team===0&&p.role===ogre));assert.ok(g.hireMercenary(0,ogre));assert.equal(g.hireMercenary(0,ogre),false);while(g.players.filter(p=>p.team===0).length<16)assert.ok(g.hireMercenary(0,0));assert.equal(g.hireMercenary(0,0),false);
 const h=game('chaos-renegades'),group=h.teams[0].groupLimits[0];assert.ok(group);while(h.players.filter(p=>p.team===0&&group.roles.includes(p.role)).length<group.max){const role=group.roles.find(role=>h.canHireMercenary(0,role));assert.ok(h.hireMercenary(0,role));}assert.ok(group.roles.every(role=>!h.canHireMercenary(0,role)));
});
test('mercenaries can be removed before purchases lock, refunding only that purchase',()=>{
 const g=game();g.setResource(0,'wizards',1);const p=g.hireMercenary(0,0,'Block');assert.equal(g.removeMercenary(1,p.id),false);assert.equal(g.removeMercenary(0,p.id),true);assert.equal(g.resourceCosts(0).inducements,150000);assert.equal(g.removeMercenary(0,p.id),false);const q=g.hireMercenary(0,0);g.advancePregame();assert.equal(g.removeMercenary(0,q.id),false);assert.equal(g.hireMercenary(0,0),false);
});
test('mercenary menu purchases and removes the chosen player and returns to staff choices',()=>{
 const g=game();g.configureResources(0);choose(g,'Mercenaries');const label=g.pending.options.find(o=>o.startsWith('Hire Human Lineman'));assert.ok(label);choose(g,label);choose(g,'Hire with Block (+50,000 gp)');const p=g.players.find(p=>p.mercenary);assert.ok(p);choose(g,'Remove mercenary #'+p.number);assert.ok(!g.players.some(p=>p.mercenary));choose(g,'Back');assert.ok(g.pending.kind.startsWith('Staff and inducements'));choose(g,'Done');
});
test('mercenaries consume funded league budgets and cannot be bought by the wrong coach',()=>{
 const {g}=league();const high=g.leaguePurchaseOrder[0],low=1-high;assert.equal(g.hireMercenary(low,0),false);g.teams[high].treasury=0;assert.equal(g.hireMercenary(high,0),false);g.teams[high].treasury=300000;const p=g.hireMercenary(high,0,'Block');assert.ok(p);assert.equal(g.leagueTreasurySpend(high),p.inducementCost);const budget=g.leagueBudget(low);assert.ok(g.removeMercenary(high,p.id));assert.equal(g.leagueBudget(low),budget-p.inducementCost);g.lockLeagueInducements(high);g.teams[low].ctv=g.teams[high].ctv-200000;assert.ok(g.hireMercenary(low,0));g.lockLeagueInducements(low);assert.equal(g.hireMercenary(low,0),false);
});
test('mercenary Loner applies to actual re-rolls and does not replace starting skills',()=>{
 const g=game(),p=g.hireMercenary(0,0,'Block');Object.assign(p,{x:5,y:7,status:'standing'});g.phase='play';g.active=0;g.mover=p.id;const dice=[1,1];g.dice=()=>dice.shift();let failed=false;g.test(p,'Pick up',3,()=>assert.fail(),()=>failed=true);choose(g,'Team');assert.equal(failed,true);assert.equal(g.rerolls[0],1);assert.equal(dice.length,0);assert.equal(g.has(p,'Block'),true);
});
test('mercenaries are excluded from MVP and leave no permanent hire or postgame offer',()=>{
 const {s,g}=league(),team=g.leaguePurchaseOrder[0];g.teams[team].treasury=300000;const p=g.hireMercenary(team,0,'Block');assert.ok(p);g.phase='finished';g.fans=[3,3];g.scores=[0,0];g.players.forEach(p=>p.fieldedDrive=1);const nominations=[0,1].map(i=>g.players.filter(p=>p.team===i&&!p.mercenary).slice(0,6).map(p=>p.id)),bad=structuredClone(nominations);bad[team][0]=p.id;assert.throws(()=>s.finishFixture(g,bad),/eligible/);g.recordStat(p,'touchdown');s.finishFixture(g,nominations);for(const t of s.data.teams){assert.equal(t.players.length,11);assert.equal(t.journeymen?.length||0,0);assert.equal(t.recruits?.length||0,0);assert.ok(t.players.every(p=>!p.name.startsWith('Mercenary')));}
});
