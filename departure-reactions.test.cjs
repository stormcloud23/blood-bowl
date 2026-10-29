const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls,skills=['Shadowing']){
 const queue=[...rolls],g=new SkillGame(structuredClone(teams),{scenario:'dodge',dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);return queue.shift();}});
 g.rerolls=[0,0];const p=g.players[0],d=g.players[11];d.extraSkills=skills;g.teams[0].positions[p.role].av='9+';g.start(p.id);return {g,p,d,queue};
}
const select=g=>g.decide(g.pending.options[0]);

test('Shadowing is a defender choice after the dodge, and moves only on 4+',()=>{
 for(const die of [1,3,4,6]){
  const {g,p,d,queue}=fixture([6,die]);g.step(9,6);const old=g.pending;
  assert.match(old.kind,/Shadowing/);assert.equal(old.team,1);assert.equal(p.x,9);assert.equal(g.endTurn(),false);
  select(g);assert.equal(d.x,die>=4?10:11);assert.equal(d.y,7);assert.equal(d.spent,0);assert.equal(d.used,false);
  assert.equal(g.shadowingCounts[d.id],1);assert.equal(g.active,0);assert.equal(g.pending,null);assert.equal(old.resolve(old.options[0]),false);assert.equal(queue.length,0);
 }
});
test('declining Shadowing consumes no die or allowance and cannot be replayed',()=>{
 const {g,d,queue}=fixture([6]);g.step(9,6);const old=g.pending;
 assert.equal(g.decide('invalid'),false);g.decide('Decline');assert.equal(g.shadowingCounts?.[d.id],undefined);assert.equal(d.x,11);assert.equal(queue.length,0);assert.equal(old.resolve('Decline'),false);
});
test('Shadowing happens after dodge re-rolls, including when the final dodge fails',()=>{
 const {g,p,d,queue}=fixture([1,1,4,1,1]);g.rerolls=[1,2];d.extraSkills.push('Pro');g.step(9,6);
 assert.equal(g.pending.kind,'Dodge');g.decide('Team');assert.match(g.pending.kind,/Shadowing/);assert.equal(p.status,'standing');
 select(g);assert.equal(d.x,10);assert.equal(p.status,'prone');assert.equal(g.active,1);assert.deepEqual(g.rerolls,[0,2]);assert.equal(d.proUsed,false);assert.equal(queue.length,0);
});
test('only one shadower can react to an exit and failed attempts count toward MA',()=>{
 const {g,d}=fixture([6,1,6]);const second=g.players[12];Object.assign(second,{x:10,y:6,status:'standing',extraSkills:['Shadowing']});
 g.teams[d.team].positions[d.role].ma=1;g.step(9,6);assert.equal(g.pending.options.length,3);select(g);assert.equal(g.pending,null);
 // A failed attempt exhausted this player's allowance. Remove the other marker.
 second.status='reserve';second.x=null;second.y=null;d.x=10;d.y=7;g.step(8,5);assert.equal(g.pending,null);assert.equal(g.shadowingCounts[d.id],1);
 g.endTurn();assert.deepEqual(g.shadowingCounts,{});
});
test('prone, distracted, rooted and disabled shadowers are ineligible',()=>{
 for(const state of ['prone','distracted','rooted','disabled']){
  const {g,d,queue}=fixture([6]);if(state==='prone')d.status='prone';else if(state==='disabled')d.disabledSkills=['Shadowing'];else d[state]=true;
  g.step(9,6);assert.equal(g.pending,null);assert.equal(d.x,11);assert.equal(queue.length,state==='prone'||state==='distracted'?1:0);
 }
});
test('Jump, Leap and unmarked movement cannot trigger Shadowing',()=>{
 const {g,p,d}=fixture([6]);p.extraSkills=['Leap'];g.step(8,7);assert.equal(g.pending,null);assert.equal(d.x,11);
});
test('Shadowing changes pickup tackle zones before the pickup test is rolled',()=>{
 const {g,p,queue}=fixture([6,4,3,6]);g.ball={x:9,y:6,carrier:null};g.rerolls[0]=1;g.step(9,6);
 assert.equal(queue.length,3);select(g);assert.equal(g.pending.kind,'Pick up');assert.equal(g.pending.target,4);assert.equal(g.ball.carrier,null);g.decide('Team');assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('Arm Bar selection suspends armour and permits a post-roll armour bonus only once',()=>{
 const {g,p,queue}=fixture([1,4,4,4,5],['Arm Bar']);g.step(9,6);assert.match(g.pending.kind,/Arm Bar/);assert.equal(queue.length,4);
 select(g);assert.equal(g.pending.kind,'Arm Bar');assert.equal(g.pending.team,1);const old=g.pending;
 g.decide('Add +1 to Armour');assert.equal(p.status,'knocked-out');assert.equal(g.active,1);assert.equal(queue.length,0);assert.equal(old.resolve('Add +1 to Armour'),false);
});
test('Arm Bar can modify injury after natural armour break and records casualty attribution',()=>{
 const {g,p,d}=fixture([1,6,6,4,5],['Arm Bar']);g.step(9,6);select(g);assert.deepEqual(g.pending.options,['Add +1 to Injury','No modifier']);
 g.decide('Add +1 to Injury');assert.equal(p.status,'casualty');assert.deepEqual(p.casualtySource,{playerId:d.id,cause:'Arm Bar'});assert.equal(g.active,1);
});
test('Arm Bar does not borrow Claws or Mighty Blow from its owner',()=>{
 const {g,p,queue}=fixture([1,4,4],['Arm Bar','Claws','Mighty Blow']);g.teams[0].positions[p.role].av='10+';g.step(9,6);select(g);g.decide('Add +1 to Armour');
 assert.equal(p.status,'prone');assert.equal(queue.length,0);
});
test('FFB Arm Bar is suppressed by Iron Hard Skin for armour and injury',()=>{
 const {g,p,queue}=fixture([1,6,6,4,5],['Arm Bar']);p.extraSkills=['Iron Hard Skin'];g.step(9,6);select(g);
 assert.equal(g.pending,null);assert.equal(p.status,'knocked-out');assert.equal(queue.length,0);
});
test('Arm Bar applies to a natural-one Leap fall in the departure square, without Shadowing',()=>{
 const {g,p,queue}=fixture([1,1,1],['Arm Bar','Shadowing']);p.extraSkills=['Leap'];g.step(8,7);select(g);assert.equal(p.x,10);
 g.decide('No modifier');assert.equal(p.status,'prone');assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Arm Bar cannot modify a Rush failure even during a planned dodge',()=>{
 const {g,p,queue}=fixture([1,1,1],['Arm Bar']);p.spent=g.profile(p).ma;g.step(9,6);assert.equal(g.pending,null);assert.equal(p.status,'prone');assert.equal(queue.length,0);
});
test('Arm Bar owner is chosen before Shadowing, and armour waits for both decisions',()=>{
 const {g,p,d,queue}=fixture([1,4,4,4,4,5],['Arm Bar','Shadowing']);g.step(9,6);select(g);assert.match(g.pending.kind,/Shadowing/);assert.equal(queue.length,5);
 select(g);assert.equal(d.x,10);assert.equal(g.pending.kind,'Arm Bar');g.decide('Add +1 to Armour');assert.equal(p.status,'knocked-out');assert.equal(queue.length,0);assert.equal(g.interruptions.length,0);
});
test('exhibition turn changes reset Shadowing attempts for both teams',()=>{
 const g=new MatchGame(structuredClone(teams),{dice:()=>6});g.shadowingCounts={'0-0':3,'1-0':2};g.resetTeam(1);assert.deepEqual(g.shadowingCounts,{});
});
