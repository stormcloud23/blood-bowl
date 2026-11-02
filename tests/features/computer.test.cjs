const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame}=require('../../src/engine/match.cjs');
const {ComputerCoach,computerDecisionTeam}=require('../../src/features/computer/computer.cjs');
const rosters=require('../../src/data/rosters.json');
function fixture(seed=1,ids=['human','orc']){
 let state=seed;
 const g=new MatchGame(ids.map(id=>rosters.find(t=>t.id===id)),{dice:s=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return 1+Math.floor(state/4294967296*s);}});
 g.individualBlockChoices=true;return g;
}
function position(g,team=1){
 g.phase='play';g.active=team;g.turns=[1,1];g.finished=false;g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve',used:false}));
 const p=g.players.find(p=>p.team===team);Object.assign(p,{x:team?1:24,y:7,status:'standing',role:0});return p;
}
test('planning uses forecasts without mutating state or consuming dice',()=>{
 const g=fixture(),p=position(g);g.ball={x:p.x,y:p.y,carrier:p.id};let rolls=0;g.dice=()=>{rolls++;return 6;};
 const before=JSON.stringify(g),coach=new ComputerCoach(1),action=coach.chooseAction(g);
 assert.equal(action.kind,'move');assert.equal(action.route.x,0);assert.equal(JSON.stringify(g),before);assert.equal(rolls,0);
});
test('computer scores an available touchdown and changes direction at halftime',()=>{
 for(const half of [1,2]){
  const g=fixture(),p=position(g);g.half=half;p.x=half===1?1:24;g.ball={x:p.x,y:p.y,carrier:p.id};const coach=new ComputerCoach(1);
  for(let n=0;n<15&&g.scores[1]===0;n++)assert.ok(coach.step(g));
  assert.equal(g.scores[1],1);assert.equal(g.phase,'endDrive');
 }
});
test('computer recovers a loose ball through ordinary movement and pickup rules',()=>{
 const g=fixture(),p=position(g);p.x=10;g.ball={x:9,y:7,carrier:null};g.dice=()=>6;const coach=new ComputerCoach(1);
 for(let n=0;n<15&&!g.ball.carrier;n++)assert.ok(coach.step(g));
 assert.equal(g.ball.carrier,p.id);
});
test('a computer never acts on a human turn or a human-owned defensive prompt',()=>{
 const g=fixture(),coach=new ComputerCoach(1);position(g,0);const before=JSON.stringify(g);assert.equal(coach.step(g),false);assert.equal(JSON.stringify(g),before);
 g.active=1;let resolved=false;g.skillChoice('Defensive choice',0,['Continue'],()=>{resolved=true;});assert.equal(computerDecisionTeam(g),0);assert.equal(coach.step(g),false);assert.equal(resolved,false);
});
test('Both Down asks each coach independently and preserves the other coach choice',()=>{
 const g=fixture(),a=position(g,1),d=g.players.find(p=>p.team===0);Object.assign(d,{x:2,y:7,status:'standing',extraSkills:['Block']});a.extraSkills=['Block'];
 g.blockAction={attacker:a,target:d};g.resolveBothDown();assert.equal(g.pending.team,1);assert.ok(new ComputerCoach(1).step(g));assert.equal(g.pending.team,0);assert.equal(new ComputerCoach(1).step(g),false);
 g.decide('Use Block');assert.equal(a.status,'standing');assert.equal(d.status,'standing');
});
test('defensive block dice and Stand Firm belong to the computer during the human turn',()=>{
 const g=fixture(),a=position(g,0),d=g.players.find(p=>p.team===1);Object.assign(d,{x:25,y:7,status:'standing'});g.blockAction={attacker:a,target:d,chooserTeam:1,dice:[1,6],poolLocked:true};g.pending={type:'blockSelect'};
 assert.equal(computerDecisionTeam(g),1);assert.ok(new ComputerCoach(1).step(g));assert.ok(g.events.includes('Chosen Block result: Player Down.'));
 g.pending={type:'custom',kind:'Stand Firm',options:['Stand Firm','Be pushed'],resolve:()=>{g.pending=null;}};g.blockAction={attacker:a,target:d};assert.equal(computerDecisionTeam(g),1);
});
test('empty computer teams finish their turn rather than stalling',()=>{
 const g=fixture();position(g);g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'casualty'}));assert.ok(new ComputerCoach(1).step(g));assert.notEqual(g.active,1);
});
test('a chain-pushed human owns their optional Stand Firm choice',()=>{
 const g=fixture(),a=position(g,1),d=g.players.find(p=>p.team===0),occupant=g.players.find(p=>p.team===0&&p!==d);
 Object.assign(a,{x:10,y:7});Object.assign(d,{x:11,y:7,status:'standing'});Object.assign(occupant,{x:12,y:7,status:'standing',extraSkills:['Stand Firm']});
 g.blockAction={attacker:a,target:d};let pushed;g.pushPlayer(d,{x:12,y:7},ok=>{pushed=ok;});
 assert.equal(g.pending.kind,'Stand Firm');assert.equal(computerDecisionTeam(g),0);assert.equal(new ComputerCoach(1).step(g),false);
 g.decide('Stand Firm');assert.equal(pushed,false);assert.equal(d.x,11);assert.equal(occupant.x,12);
});
test('a caught bomb is rethrown by its computer catcher during the human turn',()=>{
 const g=fixture(),a=position(g,0),d=g.players.find(p=>p.team===1);Object.assign(d,{x:23,y:7,status:'standing',role:0});
 g.beginBomb(a);g.rethrowBomb(d);g.dice=()=>6;
 assert.equal(computerDecisionTeam(g),1);assert.ok(new ComputerCoach(1).step(g));assert.notEqual(g.bombContext?.stage,'aim');
 assert.ok(g.events.some(e=>e.includes('Pass #')));
});
for(const [seed,ids] of [[33,['human','orc']],[71,['orc','human']],[927,['human','human']]])test('seeded full match reaches full time: '+seed,()=>{
 const g=fixture(seed,ids),coaches=[new ComputerCoach(0),new ComputerCoach(1)];let steps=0;
 for(;steps<4000&&g.phase!=='finished';steps++){
  const owner=computerDecisionTeam(g);assert.ok([0,1].includes(owner));
  assert.ok(coaches[owner].step(g),'Stalled in '+g.phase+' / '+g.pending?.kind);
  const occupied=g.players.filter(p=>g.onPitch(p)).map(p=>p.x+','+p.y);assert.equal(new Set(occupied).size,occupied.length);
  assert.ok(g.turns.every(n=>n>=0&&n<=8));
 }
 assert.equal(g.phase,'finished','Action bound reached at '+steps);assert.equal(g.half,2);assert.deepEqual(g.turns,[8,8]);
});
