const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],resources=null){const queue=[...rolls],g=new MatchGame(structuredClone(teams),{learning:true,resources,dice:s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});return {g,queue};}
function weapons(g,team,count=1){return g.players.filter(p=>p.team===team).slice(0,count).map((p,i)=>{Object.assign(p,{x:team?15:10,y:i+3,status:'standing',fieldedDrive:1,extraSkills:['Secret Weapon']});return p;});}
function end(g){g.phase='play';g.drive=1;g.kicking=0;g.firstReceiver=1;g.turns=[1,1];g.endDrive(1);g.continueDrive();}
function choose(g,label){assert.ok(g.pending?.options.includes(label),g.pending?.kind+': '+g.pending?.options.join(' / '));g.decide(label);}

test('Biased Referee has ordinary and Bribery and Corruption prices, cap and locked purchases',()=>{
 const {g}=fixture();assert.equal(g.resourceSpec(0,'biasedRefs').cost,120000);assert.equal(g.resourceSpec(1,'biasedRefs').cost,80000);
 assert.equal(g.setResource(0,'biasedRefs',1),true);assert.equal(g.biasedRefs[0],1);assert.equal(g.resourceCosts(0).inducements,120000);assert.equal(g.setResource(0,'biasedRefs',2),false);
 g.advancePregame();assert.equal(g.setResource(0,'biasedRefs',0),false);
});

test('Biased Referee adds one to foul arguments without protecting a natural-one coach ban',()=>{
 for(const [roll,saved] of [[5,true],[1,false]]){const {g}=fixture([roll],[{biasedRefs:1,bribes:1},{}]),p=weapons(g,0)[0];let result;g.sendOff(p,t=>result=t);choose(g,'Argue the Call');assert.equal(result,true);assert.equal(p.status==='sent-off',!saved);assert.equal(g.argueBanned[0],!saved);assert.equal(g.bribes[0],1);}
});

test('opposing Biased Referee spots a non-doubles foul on five, even against Sneaky Git',()=>{
 const {g,queue}=fixture([1,2,5,6],[{},{biasedRefs:1}]),a=g.players[0],d=g.players[11];g.phase='play';g.turns=[1,0];g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));Object.assign(a,{x:10,y:7,status:'standing',extraSkills:['Sneaky Git']});Object.assign(d,{x:11,y:7,status:'prone'});g.foul(a,d);assert.match(g.pending.kind,/Sent-off/);choose(g,'Argue the Call');assert.equal(a.status,'standing');assert.equal(g.active,1);assert.equal(queue.length,0);
});

test('Biased Referee does not roll again for a foul already spotted on doubles',()=>{
 const {g,queue}=fixture([1,1],[{},{biasedRefs:1}]),a=g.players[0],d=g.players[11];Object.assign(d,{status:'prone'});g.foul(a,d);assert.match(g.pending.kind,/Sent-off/);assert.equal(queue.length,0);
});

test('end-drive arguments for both coaches precede Bribes and the coach chooses weapon order',()=>{
 const {g,queue}=fixture([2,6,2,2],[{bribes:1},{bribes:1}]),home=weapons(g,0)[0],away=weapons(g,1,2);end(g);
 assert.equal(g.pending.team,1);choose(g,'Argue for #'+away[1].number);assert.equal(g.pending.team,1);choose(g,'Argue the Call');assert.equal(g.pending.team,0);choose(g,'Argue the Call');
 assert.equal(g.pending.team,1);assert.match(g.pending.kind,/Bribes/);choose(g,'Use Bribe');assert.equal(g.pending.team,0);choose(g,'Accept send-off');
 assert.notEqual(away[0].status,'sent-off');assert.notEqual(away[1].status,'sent-off');assert.equal(home.status,'sent-off');assert.deepEqual(g.bribes,[1,0]);assert.equal(g.phase,'setup');assert.equal(queue.length,0);
});

test('end-drive natural-one coach ban still allows a Bribe and does not consume later arguments',()=>{
 const {g,queue}=fixture([1,2],[{bribes:1},{}]),list=weapons(g,0,2);end(g);choose(g,'Argue for #'+list[1].number);assert.equal(g.argueBanned[0],true);assert.match(g.pending.kind,/Bribes/);choose(g,'Bribe for #'+list[1].number);assert.equal(g.phase,'setup');assert.equal(list[0].status,'sent-off');assert.notEqual(list[1].status,'sent-off');assert.equal(queue.length,0);
});

test('end-drive Biased Referee avoids the natural-one ban and defers optional rule re-roll allocation',()=>{
 const {g,queue}=fixture([1,1,5,2],[{},{biasedRefs:1,bribes:1}]),list=weapons(g,1,2);end(g);
 choose(g,'Argue for #'+list[0].number);assert.equal(g.argueBanned[1],false);assert.equal(g.argueRerolls[1],1);choose(g,'Argue the Call');
 assert.match(g.pending.kind,/Bribery and Corruption/);choose(g,'Re-roll Argue for #'+list[1].number);assert.equal(g.argueRerolls[1],0);choose(g,'Use Bribe');
 assert.notEqual(list[0].status,'sent-off');assert.notEqual(list[1].status,'sent-off');assert.equal(queue.length,0);
});

test('optional end-drive rule re-roll may be declined while retaining its match use',()=>{
 const {g}=fixture([1],[{},{biasedRefs:1}]);weapons(g,1);end(g);choose(g,'Argue the Call');choose(g,'Keep argument results');assert.equal(g.argueRerolls[1],1);assert.equal(g.argueBanned[1],false);assert.equal(g.phase,'setup');
});

test('a failed end-drive Bribe can be retried or reallocated without another argument',()=>{
 const {g,queue}=fixture([1,2],[{bribes:2},{}]),list=weapons(g,0,2);end(g);choose(g,'Accept send-off');choose(g,'Bribe for #'+list[1].number);choose(g,'Bribe for #'+list[0].number);assert.notEqual(list[0].status,'sent-off');assert.equal(list[1].status,'sent-off');assert.equal(queue.length,0);
});

test('casualties, eaten weapons and unused reserves need no end-drive argument',()=>{
 const {g}=fixture(),[casualty,eaten,reserve]=weapons(g,0,3);casualty.status='casualty';eaten.eaten=true;reserve.fieldedDrive=null;end(g);assert.equal(g.pending,null);assert.equal(casualty.status,'casualty');assert.notEqual(reserve.status,'sent-off');
});

test('full time skips Secret Weapon choices and leaves Bribes unspent',()=>{
 const {g}=fixture([],[{bribes:1},{}]);weapons(g,0);g.phase='play';g.drive=1;g.half=2;g.turns=[8,8];g.endDrive(null);g.continueDrive();assert.equal(g.phase,'finished');assert.equal(g.pending,null);assert.equal(g.bribes[0],1);
});

test('stale grouped argument callbacks cannot spend dice or advance a second time',()=>{
 const {g,queue}=fixture([6]);weapons(g,0);end(g);const old=g.pending;choose(g,'Argue the Call');const phase=g.phase;assert.equal(old.resolve('Argue the Call'),false);assert.equal(g.phase,phase);assert.equal(queue.length,0);
});
