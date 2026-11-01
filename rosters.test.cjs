const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {LeagueStore}=require('./league.cjs'),{MatchGame}=require('./match.cjs'),{SKILL_CATALOG}=require('./skills.cjs');
const rosters=JSON.parse(fs.readFileSync('rosters.json','utf8'));
for(const id of ['skaven','dwarf','lizardmen','elven-union','nurgle','dark-elf']){
 test(id+' drafts, submits, saves, reloads and fields its complete demonstration roster',()=>{
  const store=new LeagueStore(rosters),r=rosters.find(t=>t.id===id),t=store.create(id,'Test '+id);
  for(const role of r.lineup)store.hire(t.id,role);store.setStaff(t.id,'teamRerolls',2);store.submit(t.id);assert.ok(t.treasury>=0);
  const restored=new LeagueStore(rosters,JSON.parse(JSON.stringify(store.data))),snapshot=restored.matchTeam(restored.team(t.id));
  const game=new MatchGame([snapshot,rosters[0]],{dice:()=>6});assert.equal(game.players.filter(p=>p.team===0).length,11);
  for(const p of r.positions)for(const skill of p.skills)assert.ok(SKILL_CATALOG.some(e=>e.status==='Implemented'&&(e.name===skill||e.name.includes('(X')&&e.name.split(' (')[0]===skill.split(' (')[0])),skill);
 });
}
test('Dwarfs inherit Brute SPP and discounted corruption resources without changing Skaven',()=>{
 const game=new MatchGame(['dwarf','skaven'].map(id=>rosters.find(t=>t.id===id)));
 assert.deepEqual(game.teamSppAwards(0),{touchdown:2,casualty:3,completion:1,interception:2,mvp:4});assert.equal(game.teamSppAwards(1).touchdown,3);
 assert.equal(game.resourceSpec(0,'bribes').cost,50000);assert.equal(game.resourceSpec(0,'biasedRefs').cost,80000);assert.equal(game.argueRerolls[0],1);assert.equal(game.resourceSpec(1,'bribes').cost,100000);
});
test('2025 roster changes and positional caps are preserved',()=>{
 const s=rosters.find(r=>r.id==='skaven'),d=rosters.find(r=>r.id==='dwarf');assert.equal(s.positions[2].max,2);assert.ok(s.positions[2].skills.includes('Stab'));assert.equal(s.positions[3].ma,8);assert.ok(d.positions[0].skills.includes('Defensive'));assert.ok(d.positions[2].skills.includes('Diving Tackle'));assert.equal(d.positions[4].pa,'-');
 const store=new LeagueStore(rosters),t=store.create('skaven','Rats');store.hire(t.id,2);store.hire(t.id,2);const gold=t.treasury;assert.throws(()=>store.hire(t.id,2),/full/);assert.equal(t.treasury,gold);
});
test('catalogue embedding is exact and original two-roster saves remain valid',()=>{
 const html=fs.readFileSync('index.html','utf8');assert.deepEqual(JSON.parse(html.match(/id="roster-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),rosters);
 const old=JSON.parse(html.match(/id="team-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.deepEqual(rosters.slice(0,2),old);const original=new LeagueStore(old);original.create(old[0].id,'Existing club');assert.doesNotThrow(()=>new LeagueStore(rosters,original.data));
});
test('Nurgle medical restrictions and roster rules apply to real match and league resources',()=>{
 const n=rosters.find(r=>r.id==='nurgle'),d=rosters.find(r=>r.id==='dark-elf'),g=new MatchGame([n,d]);assert.equal(g.resourceSpec(0,'apothecary').max,0);assert.equal(g.resourceSpec(0,'wanderingApothecaries').max,0);assert.equal(g.resourceSpec(0,'plagueDoctors').max,1);assert.equal(g.resourceSpec(1,'plagueDoctors').max,0);assert.equal(g.teamSppAwards(0).casualty,3);assert.equal(g.teamSppAwards(1).touchdown,3);
 const store=new LeagueStore(rosters),t=store.create('nurgle','Rotters'),gold=t.treasury;assert.throws(()=>store.setStaff(t.id,'apothecary',1),/apothecary/);assert.equal(t.treasury,gold);assert.equal(n.positions[1].max,2);assert.ok(n.positions[3].skills.includes('Pick-me-up'));
});
test('Dark Elf 2025 positions include Punt and Hit and Run with two-blitzer limit',()=>{
 const r=rosters.find(r=>r.id==='dark-elf');assert.deepEqual(r.positions[1].skills,['Dump-off','Punt']);assert.ok(r.positions[2].skills.includes('Hit and Run'));const store=new LeagueStore(rosters),t=store.create(r.id,'Druchii');store.hire(t.id,3);store.hire(t.id,3);assert.throws(()=>store.hire(t.id,3),/full/);
});
