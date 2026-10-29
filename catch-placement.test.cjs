const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],scenario='pickup'){
 const queue=[...rolls],g=new SkillGame(structuredClone(teams),{scenario,dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});
 g.rerolls=[0,0];return {g,p:g.players[0],r:g.players[1],d:g.players[11],queue};
}
const grant=(p,...skills)=>p.extraSkills=skills;
const select=g=>g.decide(g.pending.options[0]);
const passDelivery={kind:'pass',accurate:true,accurateToPlayer:false,target:{x:11,y:7}};
function catcherFixture(rolls=[]){const f=fixture(rolls);f.d.status='reserve';f.d.x=null;f.d.y=null;f.r.x=10;f.r.y=6;grant(f.p,'Diving Catch');return f;}
function carrierFixture(rolls=[]){const f=fixture(rolls);grant(f.p,'Safe Pair of Hands');f.g.ball={x:f.p.x,y:f.p.y,carrier:f.p.id};return f;}

test('Diving Catch offers a standing adjacent player without moving them',()=>{
 const {g,p,queue}=catcherFixture([6]);let done=0;g.landBall(11,7,false,()=>done++,true,passDelivery);const old=g.pending;
 assert.equal(old.team,0);assert.match(old.kind,/Diving Catch/);select(g);assert.deepEqual([p.x,p.y],[10,7]);assert.deepEqual(g.ball,{x:10,y:7,carrier:p.id});assert.equal(done,1);assert.equal(old.resolve(old.options[0]),false);assert.equal(queue.length,0);
});
test('declining all Diving Catch choices bounces from the landing square',()=>{
 const {g,p,queue}=catcherFixture([8]);let done=0;g.landBall(11,7,false,()=>done++,true,passDelivery);g.decide('Decline');assert.deepEqual(g.ball,{x:12,y:8,carrier:null});assert.equal(p.status,'standing');assert.equal(done,1);assert.equal(queue.length,0);
});
test('failed Diving Catch bounces from the selected catcher square',()=>{
 const {g,p,queue}=catcherFixture([1,7]);let done=0;g.landBall(11,7,false,()=>done++,true,passDelivery);select(g);assert.deepEqual(g.ball,{x:10,y:8,carrier:null});assert.equal(done,1);assert.equal(queue.length,0);
});
test('Diving Catch can use Catch re-roll without reopening catcher selection',()=>{
 const {g,p,queue}=catcherFixture([1,6]);grant(p,'Diving Catch','Catch');g.landBall(11,7,false,()=>{},true,passDelivery);select(g);assert.equal(g.pending.kind,'Catch');assert.ok(g.pending.options.includes('Catch'));g.decide('Catch');assert.equal(g.ball.carrier,p.id);assert.equal(g.interruptions.length,0);assert.equal(queue.length,0);
});
test('active coach has first choice; opposing coach chooses only after decline',()=>{
 const {g,p,d,queue}=catcherFixture([6]);Object.assign(d,{x:12,y:7,status:'standing'});grant(d,'Diving Catch');g.landBall(11,7,false,()=>{},true,passDelivery);
 assert.equal(g.pending.team,0);const old=g.pending;g.decide('Decline');assert.equal(g.pending.team,1);assert.equal(old.resolve(old.options[0]),false);select(g);assert.equal(g.ball.carrier,d.id);assert.equal(queue.length,0);
});
test('active selection ends contested Diving Catch without an opposing roll',()=>{
 const {g,p,d,queue}=catcherFixture([6]);Object.assign(d,{x:12,y:7,status:'standing'});grant(d,'Diving Catch');g.landBall(11,7,false,()=>{},true,passDelivery);select(g);assert.equal(g.pending,null);assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('several friendly Diving Catch players are selectable, rather than cancelling each other',()=>{
 const {g,p,r,queue}=catcherFixture([6]);grant(r,'Diving Catch');g.landBall(11,7,false,()=>{},true,passDelivery);assert.equal(g.pending.options.length,3);g.decide(g.pending.options.find(s=>s.includes('('+r.id+')')));assert.equal(g.ball.carrier,r.id);assert.equal(queue.length,0);
});
test('Diving Catch can be chosen over a player in the landing square',()=>{
 const {g,p,r,queue}=catcherFixture([6]);Object.assign(r,{x:11,y:7});g.landBall(11,7,false,()=>{},true,{...passDelivery,accurateToPlayer:true});assert.equal(g.pending.options.length,3);
 g.decide(g.pending.options.find(s=>s.includes('('+p.id+')')));assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('declining both teams still forces the original standing player to catch',()=>{
 const {g,p,r,d,queue}=catcherFixture([6]);Object.assign(r,{x:11,y:7});Object.assign(d,{x:12,y:7,status:'standing'});grant(d,'Diving Catch');g.landBall(11,7,false,()=>{},true,{...passDelivery,accurateToPlayer:true});g.decide('Decline');g.decide('Decline');assert.equal(g.ball.carrier,r.id);assert.equal(queue.length,0);
});
test('Diving Catch cannot react to bounce, hand-off or placed balls',()=>{
 for(const delivery of [null,{kind:'handoff'},{kind:'placement'}]){
  const {g,queue}=catcherFixture();let done=0;g.landBall(11,7,false,()=>done++,false,delivery);assert.equal(g.pending,null);assert.equal(done,1);assert.equal(queue.length,0);
 }
});
test('prone, distracted and disabled Diving Catch players are excluded',()=>{
 for(const state of ['prone','distracted','disabled']){
  const {g,p,queue}=catcherFixture([8]);if(state==='prone')p.status='prone';else if(state==='disabled')p.disabledSkills=['Diving Catch'];else p.distracted=true;
  g.landBall(11,7,false,()=>{},true,passDelivery);assert.equal(g.pending,null);assert.equal(queue.length,0);
 }
});
test('No Ball cannot gain possession even if selected for Diving Catch',()=>{
 const {g,p,queue}=catcherFixture([7]);grant(p,'Diving Catch','No Ball');g.landBall(11,7,false,()=>{},true,passDelivery);select(g);assert.equal(g.ball.carrier,null);assert.deepEqual([g.ball.x,g.ball.y],[10,8]);assert.equal(queue.length,0);
});
test('accurate delivery uses the FFB Diving Catch bonus; empty/inaccurate delivery does not',()=>{
 const {g,p}=catcherFixture();assert.equal(g.landingTarget(p,{kind:'pass',accurate:true,accurateToPlayer:true}),2);
 assert.equal(g.landingTarget(p,passDelivery),4);assert.equal(g.landingTarget(p,{kind:'pass',accurate:false}),4);assert.equal(g.landingTarget(p,{kind:'kickoff'}),3);assert.equal(g.landingTarget(p,{kind:'throw-in'}),4);
});
test('FFB occupied-target accurate mode keeps its bonus when an adjacent catcher is selected',()=>{
 const {g,p,r,queue}=catcherFixture([2]);r.x=11;r.y=7;g.landBall(11,7,false,()=>{},true,{...passDelivery,accurateToPlayer:true});g.decide(g.pending.options.find(s=>s.includes('('+p.id+')')));assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('Diving Catch bonus combines with Extra Arms and ignores marking with Nerves of Steel',()=>{
 const {g,p,d,queue}=catcherFixture([2]);Object.assign(d,{x:10,y:8,status:'standing'});grant(p,'Diving Catch','Extra Arms','Nerves of Steel');g.landBall(10,7,false,()=>{},true,{...passDelivery,accurateToPlayer:true});assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('crowd throw-in allows Diving Catch before the mandatory bounce',()=>{
 const {g,p,queue}=catcherFixture([3,1,1,6]);p.x=2;p.y=7;g.throwIn(0,7,()=>{});assert.match(g.pending.kind,/Diving Catch/);select(g);assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('an actual empty-target pass saved by Diving Catch avoids turnover',()=>{
 const {g,p,r,d,queue}=fixture([6,6],'pass');d.status='reserve';d.x=null;d.y=null;r.y=6;grant(r,'Diving Catch');g.start(p.id,'pass');g.pass(14,7);assert.match(g.pending.kind,/Diving Catch/);select(g);assert.equal(g.ball.carrier,r.id);assert.equal(g.active,0);assert.equal(g.passContext,null);assert.equal(queue.length,0);
});
test('an inaccurate pass carries no accurate bonus even when scatter returns to its target',()=>{
 const {g,p,r,d,queue}=fixture([3,5,1,7,2,7],'pass');p.role=0;d.status='reserve';d.x=null;d.y=null;grant(r,'Diving Catch');g.start(p.id,'pass');g.pass(14,7);
 // Scatter E,NW,S returns to the original target. The catch still needs 4+.
 assert.ok(g.events.some(e=>e.includes('Catch #'+r.number+' needs 4+')));assert.equal(g.pending.kind,'Catch');g.decide('Accept');assert.equal(g.ball.carrier,null);assert.equal(g.active,1);assert.equal(queue.length,0);
});

test('Safe Pair of Hands places in one empty adjacent square before armour and retains fall turnover',()=>{
 const {g,p,queue}=carrierFixture([1,1]);g.fall(p);const old=g.pending;assert.equal(p.status,'standing');assert.equal(queue.length,2);assert.equal(old.team,p.team);assert.equal(g.endTurn(),false);select(g);
 assert.equal(p.status,'prone');assert.equal(g.active,1);assert.equal(g.ball.carrier,null);assert.notDeepEqual([g.ball.x,g.ball.y],[p.x,p.y]);assert.equal(queue.length,0);assert.equal(old.resolve(old.options[0]),false);
});
test('declining Safe Pair of Hands uses the ordinary bounce and original continuation once',()=>{
 const {g,p,queue}=carrierFixture([1,1,7]);let done=0;g.fall(p,{turnover:false,after:()=>done++});g.decide('Bounce normally');assert.deepEqual(g.ball,{x:10,y:8,carrier:null});assert.equal(done,1);assert.equal(queue.length,0);
});
test('placement rejects unknown choices and excludes occupied or off-pitch squares',()=>{
 const {g,p,r}=carrierFixture([1,1]);p.x=0;p.y=0;r.x=1;r.y=0;g.ball={x:0,y:0,carrier:p.id};g.fall(p);
 assert.equal(g.pending.squares.length,2);assert.ok(g.pending.squares.every(s=>g.inside(s.x,s.y)&&!g.at(s.x,s.y)));const old=g.pending;assert.equal(g.decide('Place ball at 0, 0'),false);assert.equal(g.pending,old);
});
test('with no empty adjacent square the ball bounces without a placement window',()=>{
 const {g,p,queue}=carrierFixture([1,1,5,6]);let i=1;for(let y=6;y<=8;y++)for(let x=9;x<=11;x++)if(x!==10||y!==7)Object.assign(g.players[i++],{x,y,status:'standing'});
 g.fall(p);assert.equal(g.pending,null);assert.notEqual(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('Safe Pair of Hands is unavailable when distracted or disabled',()=>{
 for(const mode of ['distracted','disabled']){
  const {g,p,queue}=carrierFixture([1,1,7]);if(mode==='distracted')p.distracted=true;else p.disabledSkills=['Safe Pair of Hands'];g.fall(p);assert.equal(g.pending,null);assert.equal(queue.length,0);
 }
});
test('a prevented fall never asks for Safe Pair of Hands',()=>{
 const {g,p,queue}=carrierFixture([6]);grant(p,'Safe Pair of Hands','Steady Footing');g.fall(p);g.decide('Use Steady Footing');assert.equal(g.pending,null);assert.equal(p.status,'standing');assert.equal(g.ball.carrier,p.id);assert.equal(queue.length,0);
});
test('failed Steady Footing opens Safe Pair of Hands before the real fall',()=>{
 const {g,p,queue}=carrierFixture([1,1,1]);grant(p,'Safe Pair of Hands','Steady Footing');g.fall(p);g.decide('Use Steady Footing');assert.equal(g.pending.kind,'Safe Pair of Hands');select(g);assert.equal(p.status,'prone');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('a placement does not trigger adjacent Diving Catch or any catch roll',()=>{
 const {g,p,r,queue}=carrierFixture([1,1]);grant(r,'Diving Catch');g.fall(p);select(g);assert.equal(g.pending,null);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('a removed casualty still leaves its placed ball undisturbed',()=>{
 const {g,p,queue}=carrierFixture([6,6,6,6,1,1]);g.fall(p,{turnover:false});select(g);const ball={...g.ball};assert.equal(p.status,'casualty');assert.equal(p.x,null);assert.deepEqual(g.ball,ball);assert.equal(queue.length,0);
});
test('Safe Pair of Hands works on Wrestle and cancels only the active carrier drop turnover',()=>{
 const {g,p,d,queue}=carrierFixture();d.x=11;d.y=7;g.blockAction={attacker:p,target:d,blitz:false};g.resolveBothDownChoice('Defender uses Wrestle');assert.equal(g.pending.kind,'Safe Pair of Hands');assert.equal(p.status,'standing');select(g);assert.equal(p.status,'prone');assert.equal(d.status,'prone');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('declined Wrestle placement still turns over after bouncing the carrier ball',()=>{
 const {g,p,d,queue}=carrierFixture([7]);d.x=11;d.y=7;g.blockAction={attacker:p,target:d,blitz:false};g.resolveBothDownChoice('Defender uses Wrestle');g.decide('Bounce normally');assert.equal(g.active,1);assert.equal(p.status,'prone');assert.equal(d.status,'prone');assert.equal(queue.length,0);
});
test('Wrestle placement cannot erase an independently recorded Block turnover',()=>{
 const {g,p,d}=carrierFixture();d.x=11;d.y=7;g.blockAction={attacker:p,target:d,blitz:false,turnover:true};g.resolveBothDownChoice('Defender uses Wrestle');select(g);assert.equal(g.active,1);
});
test('generic prone placement uses Safe Pair of Hands and never Steady Footing',()=>{
 const {g,p,queue}=carrierFixture();grant(p,'Safe Pair of Hands','Steady Footing');let done=0;g.placeProne(p,()=>done++);assert.equal(g.pending.kind,'Safe Pair of Hands');select(g);assert.equal(p.status,'prone');assert.equal(done,1);assert.equal(queue.length,0);
});
test('FFB Diving Tackle prone placement does not enable Safe Pair of Hands',()=>{
 const {g,p,d,queue}=fixture([6,7],'dodge');grant(d,'Diving Tackle','Safe Pair of Hands');g.ball={x:d.x,y:d.y,carrier:d.id};g.start(p.id);g.step(9,6);select(g);assert.equal(d.status,'prone');assert.equal(g.pending,null);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('Breathe Fire prone placement lets the opposing coach place the ball',()=>{
 const {g,p,d,queue}=fixture([4],'dodge');grant(p,'Breathe Fire');grant(d,'Safe Pair of Hands');g.ball={x:d.x,y:d.y,carrier:d.id};g.specialAttack(p,d,'Breathe Fire');assert.equal(g.pending.team,1);select(g);assert.equal(d.status,'prone');assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Stab holds armour: no prone placement; broken armour permits placement before injury',()=>{
 const a=carrierFixture([1,1]);a.g.armourOnly(a.p,()=>{});assert.equal(a.g.pending,null);assert.equal(a.g.ball.carrier,a.p.id);
 const b=carrierFixture([6,6,6,6,1,1]);b.g.armourOnly(b.p,()=>{});assert.equal(b.g.pending.kind,'Safe Pair of Hands');assert.equal(b.queue.length,4);select(b.g);assert.equal(b.p.status,'casualty');assert.equal(b.g.active,1);assert.equal(b.queue.length,0);
});
test('placing the ball does not suppress pickup-failure or actual knockdown turnovers',()=>{
 const {g,p,queue}=carrierFixture([1,1]);g.fall(p,{turnover:true});select(g);assert.equal(g.active,1);assert.equal(queue.length,0);
});
function kickoffFixture(rolls){
 const queue=[...rolls],g=new MatchGame(structuredClone(teams),{dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);return queue.shift();}});
 g.phase='kickEvent';g.receiving=0;g.kicking=1;g.kickLanding={x:12,y:7};g.kickTouchback=false;g.active=1;g.rerolls=[0,0];
 const p=g.players[0],d=g.players[11];Object.assign(p,{x:11,y:7,status:'standing',extraSkills:['Diving Catch']});Object.assign(d,{x:13,y:7,status:'standing',extraSkills:['Diving Catch']});return {g,p,d,queue};
}
test('kickoff Diving Catch resolves before beginning the receiving turn',()=>{
 const {g,p,queue}=kickoffFixture([6]);g.landKick();assert.equal(g.phase,'kickLanding');assert.equal(g.pending.team,0);assert.deepEqual(g.turns,[0,0]);select(g);assert.equal(g.ball.carrier,p.id);assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(queue.length,0);
});
test('a kickoff Diving Catch that takes the ball outside the receiving half causes touchback',()=>{
 const {g,p,d,queue}=kickoffFixture([6]);g.landKick();g.decide('Decline');assert.equal(g.pending.team,1);select(g);assert.equal(g.phase,'touchback');assert.equal(g.ball.carrier,null);select(g);assert.equal(g.ball.carrier,p.id);assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(queue.length,0);
});
test('failed kickoff Diving Catch bounces without offering adjacent skills again',()=>{
 const {g,p,d,queue}=kickoffFixture([1,8]);g.landKick();select(g);assert.equal(g.pending,null);assert.equal(g.phase,'play');assert.deepEqual(g.ball,{x:12,y:8,carrier:null});assert.equal(queue.length,0);
});
test('Pouring Rain affects the diving catch while team re-rolls remain unavailable during kickoff',()=>{
 const {g,p,queue}=kickoffFixture([3,8]);g.weather='Pouring Rain';g.rerolls=[2,2];g.landKick();select(g);assert.ok(g.events.some(e=>e.includes('Catch #1 needs 4+')));assert.equal(g.pending,null);assert.deepEqual(g.rerolls,[2,2]);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('an opponent who wins the pass catcher decision causes the pass turnover',()=>{
 const {g,p,r,d,queue}=fixture([6,6],'pass');r.y=6;grant(r,'Diving Catch');Object.assign(d,{x:15,y:7});grant(d,'Diving Catch');g.start(p.id,'pass');g.pass(14,7);
 if(g.pending.kind.includes('interception'))g.decide('Decline interception');g.decide('Decline');assert.equal(g.pending.team,1);select(g);assert.equal(g.ball.carrier,d.id);assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Safe Pair of Hands uses a thrown passenger landing square and preserves its turnover',()=>{
 const {g,p:a,r:p,queue}=fixture([6,5,5,5,1,1,1]);grant(a,'Throw Team-mate');grant(p,'Right Stuff','Safe Pair of Hands');g.ball={x:p.x,y:p.y,carrier:p.id};g.start(a.id,'throw-team-mate');g.selectThrowMate(p.id);g.throwTeamMate(12,7);assert.equal(p.x,15);assert.equal(g.pending.kind,'Safe Pair of Hands');assert.ok(g.pending.squares.every(s=>g.distance(s,p)===1));select(g);assert.equal(p.status,'prone');assert.equal(g.active,1);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('opposing carrier placement completes before the attacking coach resumes',()=>{
 const {g,p,d,queue}=fixture([1,1],'dodge');grant(d,'Safe Pair of Hands');g.ball={x:d.x,y:d.y,carrier:d.id};let done=0;g.fall(d,{turnover:false,after:()=>done++});assert.equal(g.pending.team,1);select(g);assert.equal(done,1);assert.equal(g.active,0);assert.equal(d.status,'prone');assert.equal(queue.length,0);
});
test('Strip Ball loss does not open Safe Pair of Hands',()=>{
 const {g,p,d,queue}=fixture([7],'dodge');grant(p,'Strip Ball');grant(d,'Safe Pair of Hands');g.ball={x:d.x,y:d.y,carrier:d.id};let done=0;g.afterFollow(p,d,false,()=>done++);assert.equal(done,1);assert.equal(g.pending,null);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
