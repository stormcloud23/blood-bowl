const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls,own=[],opponent=[]){
 const queue=[...rolls],g=new SkillGame(structuredClone(teams),{scenario:'dodge',dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});
 g.rerolls=[0,0];const p=g.players[0],d=g.players[11];p.extraSkills=own;d.extraSkills=opponent;g.start(p.id);return {g,p,d,queue};
}
const select=g=>g.decide(g.pending.options[0]);
const steady=g=>{assert.equal(g.pending.kind,'Steady Footing');g.decide('Use Steady Footing');};

test('Diving Tackle applies after the last die and has no armour roll for the tackler',()=>{
 const {g,p,d,queue}=fixture([3,1,1],[],['Diving Tackle']);g.step(9,6);const old=g.pending;
 assert.match(old.kind,/Diving Tackle.*will trip/);assert.equal(old.team,1);assert.equal(p.status,'standing');select(g);
 assert.equal(d.status,'prone');assert.deepEqual([d.x,d.y],[10,7]);assert.equal(p.status,'prone');assert.equal(g.active,1);assert.equal(queue.length,0);assert.equal(old.resolve(old.options[0]),false);
});
test('natural six still succeeds and the defender may decline or use an ineffective tackle',()=>{
 for(const use of [false,true]){
  const {g,p,d,queue}=fixture([6],[],['Diving Tackle']);g.step(9,6);assert.match(g.pending.kind,/will not trip/);
  if(use)select(g);else g.decide('Decline');assert.equal(d.status,use?'prone':'standing');assert.equal(p.status,'standing');assert.equal(g.active,0);assert.equal(queue.length,0);
 }
});
test('Diving Tackle look-ahead offers the moving coach a re-roll before the defender chooses',()=>{
 const {g,p,d,queue}=fixture([3,6],[],['Diving Tackle']);g.rerolls[0]=1;g.step(9,6);
 assert.equal(g.pending.kind,'Dodge');assert.equal(g.pending.lookAhead,true);g.decide('Team');assert.match(g.pending.kind,/Diving Tackle/);select(g);
 assert.equal(p.status,'standing');assert.equal(d.status,'prone');assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('accepting a successful look-ahead keeps success if the defender declines',()=>{
 const {g,p}=fixture([3],[],['Diving Tackle']);g.rerolls[0]=1;g.step(9,6);const old=g.pending;g.decide('Accept');g.decide('Decline');
 assert.equal(p.status,'standing');assert.equal(g.rerolls[0],1);assert.equal(old.resolve(6),false);assert.equal(g.interruptions.length,0);
});
test('an already re-rolled dodge gets one tackle window and no second dodge re-roll',()=>{
 const {g,p,queue}=fixture([1,3,1,1],[],['Diving Tackle']);g.rerolls[0]=2;g.step(9,6);g.decide('Team');select(g);
 assert.equal(p.status,'prone');assert.equal(g.rerolls[0],1);assert.equal(queue.length,0);assert.equal(g.pending,null);
});
test('an unrescued failed dodge does not offer Diving Tackle',()=>{
 const {g,d,queue}=fixture([1,1,1],[],['Diving Tackle']);g.step(9,6);assert.equal(d.status,'standing');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Break Tackle can rescue a re-rolled dodge against prospective Diving Tackle',()=>{
 const {g,p,queue}=fixture([1,4],['Break Tackle'],['Diving Tackle']);g.rerolls[0]=1;g.step(9,6);g.decide('Team');
 assert.deepEqual(g.pending.options,['Break Tackle']);g.decide('Break Tackle');assert.equal(g.used(p,'Break Tackle'),true);assert.match(g.pending.kind,/will not trip/);select(g);
 assert.equal(p.status,'standing');assert.equal(queue.length,0);
});
test('Break Tackle is not spent on a combination that cannot beat prospective Diving Tackle',()=>{
 const {g,p,queue}=fixture([2,1,1],['Break Tackle'],['Diving Tackle']);g.step(9,6);assert.equal(g.used(p,'Break Tackle'),false);assert.equal(p.status,'prone');assert.equal(queue.length,0);
});
test('only one eligible Diving Tackle player can be chosen',()=>{
 const {g,d}=fixture([6],[],['Diving Tackle']);const other=g.players[12];Object.assign(other,{x:10,y:6,status:'standing',extraSkills:['Diving Tackle']});g.step(9,6);
 assert.equal(g.pending.options.length,3);g.decide(g.pending.options[1]);assert.equal(other.status,'prone');assert.equal(d.status,'standing');assert.equal(g.pending,null);
});
test('prone, distracted, disabled and rooted tacklers are excluded',()=>{
 for(const state of ['prone','distracted','disabled','rooted']){
  const {g,d}=fixture([6],[],['Diving Tackle']);if(state==='prone')d.status=state;else if(state==='disabled')d.disabledSkills=['Diving Tackle'];else d[state]=true;
  g.step(9,6);assert.equal(g.pending,null);
 }
});
test('using Diving Tackle suppresses every Shadowing reaction on that departure',()=>{
 const {g,d,queue}=fixture([6],[],['Diving Tackle','Shadowing']);g.step(9,6);select(g);assert.equal(g.pending,null);assert.equal(d.status,'prone');assert.equal(queue.length,0);assert.deepEqual(g.shadowingCounts||{},{});
});
test('declining Diving Tackle still permits Shadowing',()=>{
 const {g,d,queue}=fixture([6,4],[],['Diving Tackle','Shadowing']);g.step(9,6);g.decide('Decline');assert.match(g.pending.kind,/Shadowing/);select(g);assert.equal(d.x,10);assert.equal(d.status,'standing');assert.equal(queue.length,0);
});
test('Diving Tackle applies to Leap with Leap recalculated after its modifier',()=>{
 const {g,p,d,queue}=fixture([4,1,1],['Leap'],['Diving Tackle']);assert.equal(g.plan(8,7).target,4);assert.equal(g.plan(8,7).divingTackleTarget,5);
 g.step(8,7);select(g);assert.equal(p.status,'prone');assert.equal(p.x,8);assert.equal(d.x,10);assert.equal(queue.length,0);
});
test('Pogo cancels Diving Tackle and Prehensile Tail on jumps',()=>{
 const {g,p,d,queue}=fixture([3],['Pogo'],['Diving Tackle','Prehensile Tail']);assert.equal(g.plan(8,7).divingTackleTarget,undefined);g.step(8,7);assert.equal(p.status,'standing');assert.equal(d.status,'standing');assert.equal(queue.length,0);
});
test('a Diving Tackle carrier drops its ball before the mover finishes arriving',()=>{
 const {g,d,queue}=fixture([6,5],[],['Diving Tackle']);g.ball={x:d.x,y:d.y,carrier:d.id};g.step(9,6);select(g);
 assert.equal(g.ball.carrier,null);assert.deepEqual([g.ball.x,g.ball.y],[11,7]);assert.equal(d.status,'prone');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Steady Footing preserves a failed dodge carrier without armour, bounce or turnover',()=>{
 const {g,p,queue}=fixture([1,6],['Steady Footing']);g.ball={x:p.x,y:p.y,carrier:p.id};g.step(9,6);steady(g);
 assert.equal(p.status,'standing');assert.equal(g.ball.carrier,p.id);assert.equal(g.active,0);assert.equal(g.mover,p.id);assert.equal(queue.length,0);assert.equal(g.interruptions.length,0);
});
test('Steady Footing failed or declined resolves the original fall exactly once',()=>{
 for(const use of [false,true]){
  const {g,p,queue}=fixture(use?[1,2,1,1]:[1,1,1],['Steady Footing']);g.step(9,6);const old=g.pending;
  assert.equal(g.decide('invalid'),false);g.decide(use?'Use Steady Footing':'Fall normally');assert.equal(p.status,'prone');assert.equal(g.active,1);assert.equal(queue.length,0);assert.equal(old.resolve('Use Steady Footing'),false);
 }
});
test('Steady Footing is a separate test eligible for its own team re-roll',()=>{
 const {g,p,queue}=fixture([1,2,6],['Steady Footing']);g.rerolls[0]=1;g.step(9,6);g.decide('Accept');steady(g);assert.ok(g.pending.options.includes('Team'));g.decide('Team');
 assert.equal(p.status,'standing');assert.equal(g.active,0);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Pro can re-roll the acting player Steady Footing test',()=>{
 const {g,p,queue}=fixture([1,2,3,6],['Steady Footing','Pro']);g.step(9,6);g.decide('Accept');steady(g);g.decide('Pro');assert.equal(p.proUsed,true);assert.equal(p.status,'standing');assert.equal(queue.length,0);
});
test('preventing a Rush fall continues the remaining dodge test',()=>{
 const {g,p,queue}=fixture([1,6,6],['Steady Footing']);p.spent=g.profile(p).ma;g.step(9,6);steady(g);assert.equal(p.x,9);assert.equal(p.spent,g.profile(p).ma+1);assert.ok(g.events.some(e=>e.startsWith('Dodge #')));assert.equal(queue.length,0);
});
test('each failed Rush in a two-Rush Leap can independently use Steady Footing',()=>{
 const {g,p,queue}=fixture([1,6,1,6,6],['Steady Footing','Leap']);p.spent=g.profile(p).ma;g.step(8,7);steady(g);steady(g);assert.equal(p.x,8);assert.equal(p.status,'standing');assert.equal(queue.length,0);
});
test('natural-one Jump recovery stays in the origin; other Jump recovery stays at destination',()=>{
 for(const [die,x] of [[1,10],[2,8]]){
  const {g,p,queue}=fixture([die,6],['Steady Footing','Leap']);g.step(8,7);steady(g);assert.equal(p.x,x);assert.equal(p.status,'standing');assert.equal(p.spent,2);assert.equal(g.active,0);assert.equal(queue.length,0);
 }
});
test('Steady Footing runs before Arm Bar and prevents the injury window',()=>{
 const {g,p,d,queue}=fixture([1,6],['Steady Footing'],['Arm Bar','Shadowing']);g.step(9,6);steady(g);assert.match(g.pending.kind,/Shadowing/);g.decide('Decline');assert.equal(p.status,'standing');assert.equal(d.x,11);assert.equal(queue.length,0);
});
test('Steady Footing can save a tackled dodger while the tackler is still placed prone',()=>{
 const {g,p,d,queue}=fixture([3,6],['Steady Footing'],['Diving Tackle','Shadowing']);g.step(9,6);select(g);assert.equal(d.status,'standing');steady(g);
 assert.equal(d.status,'prone');assert.equal(p.status,'standing');assert.equal(g.pending,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Steady Footing prevents a skull turnover and resumes Blitz movement',()=>{
 const {g,p,d}=fixture([6],['Steady Footing']);g.action='blitz';g.blockAction={attacker:p,target:d,blitz:true};g.applyBlockResult('Player Down');steady(g);
 assert.equal(p.status,'standing');assert.equal(g.active,0);assert.equal(g.action,'blitz');assert.equal(g.blockAction,null);assert.equal(g.mover,p.id);
});
test('Both Down completes both footing decisions and retains a turnover caused by the other player',()=>{
 const {g,p,d,queue}=fixture([1,1,1,6],['Steady Footing'],['Steady Footing']);g.blockAction={attacker:p,target:d,blitz:false};g.action='block';
 g.resolveBlockDowns([{p,by:d},{p:d,by:p}]);steady(g);assert.equal(g.active,0);assert.equal(g.pending.team,1);steady(g);assert.equal(p.status,'prone');assert.equal(d.status,'standing');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('saving the Both Down attacker avoids turnover while defender injury still completes',()=>{
 const {g,p,d,queue}=fixture([6,1,1,1],['Steady Footing'],['Steady Footing']);g.blockAction={attacker:p,target:d,blitz:false};g.action='block';
 g.resolveBlockDowns([{p,by:d},{p:d,by:p}]);steady(g);steady(g);assert.equal(p.status,'standing');assert.equal(d.status,'prone');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('opposing Steady Footing has no team re-roll or Pro; preventing a fall keeps Take Root',()=>{
 const {g,d,queue}=fixture([2,1,1],[],['Steady Footing','Pro']);g.rerolls=[2,2];g.fall(d,{turnover:false});steady(g);assert.equal(g.pending,null);assert.equal(d.proUsed,false);assert.deepEqual(g.rerolls,[2,2]);assert.equal(queue.length,0);
 const h=fixture([6],[],['Steady Footing']);h.d.rooted=true;let continued=false;h.g.fall(h.d,{turnover:false,after:()=>continued=true});steady(h.g);assert.equal(h.d.rooted,true);assert.equal(continued,true);
});
test('Wrestle placement is not a fall and cannot use Steady Footing',()=>{
 const {g,p,d,queue}=fixture([],['Steady Footing'],['Steady Footing']);g.blockAction={attacker:p,target:d,blitz:false};g.resolveBothDownChoice('Attacker uses Wrestle');assert.equal(g.pending,null);assert.equal(p.status,'prone');assert.equal(d.status,'prone');assert.equal(queue.length,0);
});
test('failed Rush resolves before Tentacles and can never be rescued by a hold',()=>{
 const {g,p,d,queue}=fixture([1,1,1],[],['Tentacles']);p.spent=g.profile(p).ma;g.step(9,6);assert.equal(g.pending,null);assert.equal(p.status,'prone');assert.equal(d.status,'standing');assert.equal(queue.length,0);
});
test('a Rush saved by Steady Footing resumes Tentacles before rolling the dodge',()=>{
 const {g,p,queue}=fixture([1,6,6],['Steady Footing'],['Tentacles']);p.spent=g.profile(p).ma;g.step(9,6);steady(g);assert.match(g.pending.kind,/Tentacles/);select(g);assert.equal(p.x,10);assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Fumblerooski leaves the ball at departure even when the Rush fails',()=>{
 const {g,p,queue}=fixture([1,1,1],['Fumblerooski']);p.spent=g.profile(p).ma;g.ball={x:p.x,y:p.y,carrier:p.id};p.dropOnExit=true;g.step(9,6);assert.deepEqual(g.ball,{x:10,y:7,carrier:null});assert.equal(queue.length,0);
});
test('distracted, disabled or already prone players cannot prevent a fall',()=>{
 for(const state of ['distracted','disabled','prone']){
  const {g,p,queue}=fixture([1,1],['Steady Footing']);if(state==='disabled')p.disabledSkills=['Steady Footing'];else if(state==='prone')p.status='prone';else p.distracted=true;
  g.fall(p);assert.equal(g.pending,null);assert.equal(queue.length,0);
 }
});

test('Steady Footing on a normal Block attacker can use Pro after the mover was cleared',()=>{
 const {g,p,d,queue}=fixture([2,3,6],['Steady Footing','Pro']);g.mover=null;g.action='block';g.blockAction={attacker:p,target:d,blitz:false};g.applyBlockResult('Player Down');steady(g);g.decide('Pro');assert.equal(p.status,'standing');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('a Blitz Rush saved by Steady Footing still rolls its Block dice',()=>{
 const {g,p,d,queue}=fixture([1,6,6,6],['Steady Footing']);g.action='blitz';g.blitzTarget=d.id;p.spent=g.profile(p).ma;assert.equal(g.blitzBlock(),true);steady(g);assert.equal(g.pending.type,'blockSelect');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('a special-action Blitz Rush saved by Steady Footing continues the special attack',()=>{
 const {g,p,d,queue}=fixture([1,6,1,1],['Steady Footing','Stab']);g.action='blitz';g.blitzTarget=d.id;p.spent=g.profile(p).ma;assert.equal(g.performSpecial(d.id,'Stab'),true);steady(g);assert.equal(d.status,'standing');assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('preventing a Chainsaw kick-back fall ends that special activation without turnover',()=>{
 const {g,p,d,queue}=fixture([1,6],['Steady Footing','Chainsaw']);g.specialAttack(p,d,'Chainsaw');steady(g);assert.equal(p.status,'standing');assert.equal(d.status,'standing');assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
function throwing(rolls){
 const state=fixture(rolls,['Throw Team-mate']);const {g,p:a}=state,p=g.players[1];p.extraSkills=['Right Stuff','Steady Footing'];Object.assign(p,{x:9,y:7,status:'standing'});g.mover=null;g.action=null;a.used=false;g.start(a.id,'throw-team-mate');g.selectThrowMate(p.id);return {...state,a,p};
}
test('Steady Footing rescues a thrown carrier landing, preserving possession and activation eligibility',()=>{
 const {g,p,queue}=throwing([6,5,5,5,1,6]);g.ball={x:p.x,y:p.y,carrier:p.id};g.throwTeamMate(12,7);steady(g);assert.equal(p.status,'standing');assert.equal(g.ball.carrier,p.id);assert.equal(g.active,0);assert.equal(g.canStart(p),true);assert.equal(queue.length,0);
});
test('a rescued landing on a loose ball still resolves its required bounce',()=>{
 const {g,p,queue}=throwing([6,5,5,5,1,6,5]);g.ball={x:15,y:7,carrier:null};g.throwTeamMate(12,7);steady(g);assert.equal(p.status,'standing');assert.deepEqual(g.ball,{x:16,y:7,carrier:null});assert.equal(queue.length,0);
});
test('a later saved thrown-player fall does not erase a prior friendly collision turnover',()=>{
 const {g,p,queue}=throwing([6,5,5,5,1,1,5,6]);const victim=g.players[2];Object.assign(victim,{x:15,y:7,status:'standing'});g.throwTeamMate(12,7);steady(g);assert.equal(victim.status,'prone');assert.equal(p.status,'standing');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('a saved friendly collision victim does not itself cause a turnover',()=>{
 const {g,p,queue}=throwing([6,5,5,5,6,5,6]);const victim=g.players[2];Object.assign(victim,{x:15,y:7,status:'standing',extraSkills:['Steady Footing']});g.throwTeamMate(12,7);steady(g);steady(g);assert.equal(victim.status,'standing');assert.equal(p.status,'standing');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Steady Footing during an exhibition preserves the current turn until the coach ends it',()=>{
 const dice=[1,6],g=new MatchGame(structuredClone(teams),{dice:()=>{assert.ok(dice.length);return dice.shift();}});
 g.phase='play';g.finished=false;g.active=0;g.turns=[1,0];g.pending=null;g.mover=null;g.action=null;g.rerolls=[0,0];
 for(const q of g.players){q.x=null;q.y=null;q.status='reserve';}
 const p=g.players[0],d=g.players[11];Object.assign(p,{x:10,y:7,status:'standing',used:false,extraSkills:['Steady Footing']});Object.assign(d,{x:11,y:7,status:'standing'});
 g.ball={x:2,y:2,carrier:null};g.start(p.id);g.step(9,6);steady(g);assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(g.active,0);g.endTurn();assert.equal(g.active,1);assert.deepEqual(g.turns,[1,1]);
});
test('ending an exhibition turn resumes exactly once after a stalling rock is prevented',()=>{
 for(const activated of [false,true]){
  const dice=[6,6],g=new MatchGame(structuredClone(teams),{dice:()=>{assert.ok(dice.length);return dice.shift();}});
  g.phase='play';g.finished=false;g.active=0;g.turns=[1,0];g.pending=null;g.mover=null;g.action=null;g.rerolls=[0,0];
  for(const q of g.players){q.x=null;q.y=null;q.status='reserve';}
  const p=g.players[0];Object.assign(p,{x:24,y:7,status:'standing',used:activated,extraSkills:['Steady Footing']});g.ball={x:p.x,y:p.y,carrier:p.id};
  if(activated){g.mover=p.id;g.action='move';g.stallCandidate=p.id;}
  g.endTurn();const old=g.pending;assert.equal(g.active,0);steady(g);assert.equal(g.active,1);assert.deepEqual(g.turns,[1,1]);assert.equal(p.status,'standing');assert.equal(g.ball.carrier,p.id);assert.equal(old.resolve('Use Steady Footing'),false);assert.equal(dice.length,0);
 }
});
test('Loner failure on a Steady Footing re-roll spends the pool and resolves the fall',()=>{
 const {g,p,queue}=fixture([1,2,1,1,1],['Steady Footing','Loner (4+)']);g.rerolls[0]=1;g.step(9,6);g.decide('Accept');steady(g);g.decide('Team');assert.equal(p.status,'prone');assert.equal(g.rerolls[0],0);assert.equal(g.active,1);assert.equal(queue.length,0);
});
