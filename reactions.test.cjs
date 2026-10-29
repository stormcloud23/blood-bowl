const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[]){
 const queue=[...rolls],g=new SkillGame(structuredClone(teams),{scenario:'dodge',dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);return queue.shift();}});
 g.rerolls=[0,0];const p=g.players[0],d=g.players[11];d.extraSkills=['Tentacles'];g.start(p.id);return {g,p,d,queue};
}
const select=g=>g.decide(g.pending.options[0]);
test('Tentacles uses strength difference with natural one and six limits',()=>{
 for(const [holderST,moverST,die,held] of [[3,3,5,false],[3,3,6,true],[5,3,4,true],[5,3,3,false],[9,1,1,false],[1,9,6,true]]){
  const {g,p,d}=fixture([die,...(held?[]:[6])]);g.teams[d.team].positions[d.role].st=holderST;g.teams[p.team].positions[p.role].st=moverST;
  g.step(9,6);select(g);assert.equal(g.mover===null,held);assert.equal(p.x,held?10:9);
 }
});
test('Tentacles suspends a departure and a natural six ends only the activation',()=>{
 const {g,p,queue}=fixture([6]);g.ball={x:p.x,y:p.y,carrier:p.id};
 assert.equal(g.step(9,6),true);const choice=g.pending;
 assert.equal(choice.team,1);assert.equal(p.spent,0);assert.equal(p.x,10);
 assert.equal(g.step(9,6),false);assert.equal(g.finish(),false);assert.equal(g.endTurn(),false);
 select(g);assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(p.status,'standing');assert.equal(p.spent,0);assert.equal(g.ball.carrier,p.id);
 assert.equal(g.interruptions.length,0);assert.equal(choice.resolve(choice.options[0]),false);assert.equal(queue.length,0);
});
test('declining Tentacles resumes once and then permits the mover re-roll decision',()=>{
 const {g,p}=fixture([1,6]);g.rerolls[0]=1;g.step(9,6);const old=g.pending;
 assert.equal(g.decide('invalid'),false);assert.equal(g.pending,old);
 g.decide('Decline');assert.equal(g.pending.kind,'Dodge');assert.equal(g.interruptions.length,0);
 assert.equal(old.resolve('Decline'),false);g.decide('Team');assert.equal(p.spent,1);assert.equal(p.x,9);assert.equal(g.pending,null);
});
test('a failed Tentacles roll offers neither defender Pro nor either team pool',()=>{
 const {g,p,d,queue}=fixture([1,6]);d.extraSkills.push('Pro');g.rerolls=[2,2];g.step(9,6);select(g);
 assert.equal(g.pending,null);assert.equal(d.proUsed,false);assert.deepEqual(g.rerolls,[2,2]);assert.equal(p.spent,1);assert.equal(queue.length,0);
});
test('only the chosen Tentacles player rolls when several mark the departure',()=>{
 const {g,p,d}=fixture([6]);const second=g.players[12];Object.assign(second,{x:10,y:6,status:'standing',extraSkills:['Tentacles']});
 g.step(9,6);assert.equal(g.pending.options.length,3);g.decide(g.pending.options[1]);assert.equal(p.x,10);assert.equal(g.mover,null);assert.equal(d.status,'standing');
});
test('prone, distracted and disabled Tentacles players cannot react',()=>{
 for(const state of ['prone','distracted','disabled']){
  const {g,p,d}=fixture([6]);if(state==='prone')d.status='prone';if(state==='distracted')d.distracted=true;if(state==='disabled')d.disabledSkills=['Tentacles'];
  g.step(9,6);assert.equal(g.pending,null);assert.equal(p.x,9);
 }
});
test('Tentacles intercepts Leap before spending movement or rolling Rush',()=>{
 const {g,p}=fixture([6]);p.extraSkills=['Leap'];p.spent=g.profile(p).ma;g.step(8,7);assert.ok(g.pending.kind.includes('Tentacles'));select(g);assert.equal(p.x,10);assert.equal(p.spent,g.profile(p).ma);
});
test('a held Fumblerooski carrier retains the ball and its drop intention',()=>{
 const {g,p}=fixture([6]);p.extraSkills=['Fumblerooski'];g.ball={x:p.x,y:p.y,carrier:p.id};p.dropOnExit=true;g.step(9,6);select(g);assert.equal(g.ball.carrier,p.id);assert.equal(p.dropOnExit,true);
});
test('interruption stack enforces nested completion order and resumes each frame once',()=>{
 const {g}=fixture();let outer,inner;const events=[];
 g.interrupt('outer',done=>{outer=done;g.interrupt('inner',finish=>inner=finish,v=>events.push(v));},v=>events.push(v));
 assert.equal(outer('early'),false);assert.equal(inner('inner'),true);assert.equal(inner('duplicate'),false);assert.equal(outer('outer'),true);assert.deepEqual(events,['inner','outer']);assert.equal(g.interruptions.length,0);
});

