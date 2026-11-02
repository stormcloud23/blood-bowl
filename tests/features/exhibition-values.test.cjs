const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame,MATCH_STARS}=require('../../src/engine/match.cjs');
const {LeagueStore}=require('../../src/features/league/league.cjs');
const rosters=require('../../src/data/rosters.json');
function game(ids=['human','orc']){return new MatchGame(ids.map(id=>JSON.parse(JSON.stringify(rosters.find(t=>t.id===id)))));}
test('all preset teams include every roster player and purchased staff in TV',()=>{
 for(const roster of rosters){
  const g=game([roster.id,roster.id]),players=roster.lineup.reduce((n,r)=>n+roster.positions[r].cost,0),v=g.teamValues(0);
  assert.equal(v.players,players,roster.id);assert.equal(v.tv,players+2*roster.reroll,roster.id);assert.equal(v.ctv,g.prayerValue(0));assert.equal(v.match,v.ctv);
 }
});
test('fans and inducements are separate from TV while staff changes update it',()=>{
 const g=game(),base=g.teamValues(0);g.setResource(0,'teamRerolls',3);g.setResource(0,'assistants',2);g.setResource(0,'cheerleaders',1);g.setApothecary(0,true);
 const staff=g.teamValues(0);assert.equal(staff.tv,base.tv+g.teams[0].reroll+80000);
 g.setResource(0,'dedicatedFans',6);assert.equal(g.teamValues(0).tv,staff.tv);
 g.setResource(0,'wizards',1);assert.equal(g.teamValues(0).tv,staff.tv);assert.equal(g.teamValues(0).match,staff.ctv+g.resourceCosts(0).inducements);
 g.rerolls[0]=0;assert.equal(g.teamValues(0).tv,staff.tv,'Using re-rolls must not reduce purchased team value');
});
test('Low Cost Linemen changes CTV but not full-roster TV',()=>{
 const g=game(['ogre','snotling']);for(const team of [0,1]){const t=g.teams[team],discount=t.lineup.reduce((n,r)=>n+(t.positions[r].traits.includes('Lineman')?t.positions[r].cost:0),0),v=g.teamValues(team);assert.ok(discount>0);assert.equal(v.tv-v.ctv,discount);}
});
test('paired star hires and mercenaries count once as inducements, not twice as roster players',()=>{
 const g=game(),base=g.teamValues(0),pair=MATCH_STARS.find(s=>s.players&&s.name.includes('Grak'));assert.ok(pair);assert.ok(g.hireStar(0,pair.id));
 const merc=g.hireMercenary(0,0);assert.ok(merc);const v=g.teamValues(0);assert.equal(v.tv,base.tv);assert.equal(v.ctv,base.ctv);assert.equal(v.inducements,pair.cost+merc.inducementCost);assert.equal(v.match,base.ctv+pair.cost+merc.inducementCost);
});
test('saved snapshots preserve improvements, missing players and journeymen in their respective values',()=>{
 const store=new LeagueStore(rosters),t=store.create('human','Saved team');for(let i=0;i<11;i++)store.hire(t.id,0);store.setStaff(t.id,'teamRerolls',2);store.submit(t.id);
 t.players[0].value+=20000;t.players[0].profile.skills.push('Block');t.players[0].missNext=true;
 const before=store.values(t),snapshot={...store.matchTeam(t),exhibitionSaved:true,exhibitionTV:before.tv},g=new MatchGame([snapshot,JSON.parse(JSON.stringify(rosters.find(r=>r.id==='orc')))]);
 assert.equal(g.teamValues(0).tv,before.tv);assert.equal(g.teamValues(0).ctv,snapshot.ctv);assert.equal(g.teamValues(0).tv-g.teamValues(0).ctv,20000);assert.ok(snapshot.matchPlayers.some(p=>p.journeyman));
 t.players[0].value+=30000;assert.equal(g.teamValues(0).tv,before.tv,'Live bank edits cannot change the running exhibition snapshot');
});
