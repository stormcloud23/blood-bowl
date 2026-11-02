const {projectPath}=require('../helpers/project.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('../../src/engine/match.cjs');
const teams=JSON.parse(fs.readFileSync(projectPath('index.html'),'utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(dice=[],resources=[{wizards:1},{}]){
 const queue=[...dice],g=new MatchGame(structuredClone(teams),{resources,dice:s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});
 g.firstReceiver=0;g.phase='play';g.turns=[1,0];g.players.forEach(p=>Object.assign(p,{status:'reserve',x:null,y:null}));
 const p=g.players[0],d=g.players.find(p=>p.team===1);
 for(const [q,x] of [[p,10],[d,11]])Object.assign(q,{status:'standing',x,y:7,profileOverride:{...g.profile(q),st:3,av:'9+',skills:[]}});
 return {g,p,d,queue};
}
function choose(g,label){assert.ok(g.pending?.options.includes(label),g.pending?.kind+': '+g.pending?.options.join(' / '));assert.equal(g.decide(label),true);}
function cast(g,spell,x=10,y=7){choose(g,spell);assert.equal(g.aimSpell(x,y),true);choose(g,'Cast '+spell+' at '+(x+1)+', '+(y+1));}

test('Wizard costs 150K, max one, with independent match uses',()=>{
 const {g}=fixture();assert.equal(g.resourceSpec(0,'wizards').cost,150000);assert.equal(g.resourceCosts(0).inducements,150000);assert.equal(g.setResource(0,'wizards',2),false);assert.deepEqual(g.wizards,[1,0]);
});
test('both Wizard windows precede the next turn and reject stale choices',()=>{
 const {g,p}=fixture([],[{wizards:1},{wizards:1}]);g.endTurn();assert.equal(g.phase,'betweenTurns');assert.equal(g.pending.team,0);assert.equal(g.start(p.id),false);assert.equal(g.endTurn(),false);const old=g.pending;
 choose(g,'Keep Wizard');assert.equal(g.pending.team,1);assert.equal(old.resolve('Fireball'),false);assert.deepEqual(g.turns,[1,0]);choose(g,'Keep Wizard');assert.equal(g.phase,'play');assert.equal(g.active,1);assert.deepEqual(g.turns,[1,1]);assert.deepEqual(g.wizards,[1,1]);
});
test('turnover opens Wizard windows but touchdown and end of half skip them',()=>{
 const {g}=fixture();g.endTurn(true);assert.equal(g.pending.kind.startsWith('Wizard'),true);
 for(const end of ['half','touchdown']){const {g,p}=fixture();if(end==='half'){g.turns=[8,8];g.endTurn();}else{p.x=25;g.ball={x:25,y:7,carrier:p.id};g.checkScore();}assert.equal(g.phase,'endDrive');assert.equal(g.pending,null);assert.equal(g.wizards[0],1);}
});
test('invalid spell targets and cancelled targeting preserve dice and Wizard',()=>{
 const {g,queue}=fixture();g.endTurn();choose(g,'Zap');assert.equal(g.aimSpell(0,0),false);assert.equal(g.aimSpell(-1,7),false);assert.equal(g.aimSpell(10.5,7),false);assert.equal(g.aimSpell(10,7),true);choose(g,'Choose another square');choose(g,'Cancel spell');assert.equal(g.pending.kind.startsWith('Wizard'),true);choose(g,'Keep Wizard');assert.equal(g.wizards[0],1);assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Fireball hits both teams on 4+, resolves all effects and advances once',()=>{
 const {g,p,d,queue}=fixture([4,3,4,3]);g.endTurn();cast(g,'Fireball');assert.equal(p.status,'prone');assert.equal(d.status,'standing');assert.equal(g.wizards[0],0);assert.equal(g.active,1);assert.deepEqual(g.turns,[1,1]);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Fireball uses +1 on armour only when needed, otherwise on injury',()=>{
 for(const [armour,expected] of [[[4,4],'stunned'],[[4,5],'knocked-out']]){const {g,p,d,queue}=fixture([4,...armour,4,3]);Object.assign(d,{status:'reserve',x:null,y:null});g.endTurn();cast(g,'Fireball');assert.equal(p.status,expected);assert.equal(queue.length,0);}
});
test('Iron Hard Skin cancels Fireball armour bonus but retains injury bonus',()=>{
 for(const [armour,expected,injury] of [[[4,4],'prone',[]],[[4,5],'knocked-out',[4,3]]]){const {g,p,d,queue}=fixture([4,...armour,...injury]);p.extraSkills=['Iron Hard Skin'];Object.assign(d,{status:'reserve',x:null,y:null});g.endTurn();cast(g,'Fireball');assert.equal(p.status,expected);assert.equal(queue.length,0);}
});
test('Fireball affects prone and stunned players and clips the pitch edge',()=>{
 const {g,p,d,queue}=fixture([4,1,1,4,1,1]);Object.assign(p,{x:0,y:0,status:'prone'});Object.assign(d,{x:1,y:1,status:'stunned'});g.endTurn();cast(g,'Fireball',0,0);assert.equal(p.status,'prone');assert.equal(d.status,'stunned');assert.equal(queue.length,0);
});
test('Steady Footing avoids Fireball damage; Safe Pair of Hands places the ball first',()=>{
 const {g,p,d,queue}=fixture([4,1,1,6]);Object.assign(d,{status:'reserve',x:null,y:null});p.extraSkills=['Steady Footing'];g.endTurn();cast(g,'Fireball');choose(g,'Use Steady Footing');assert.equal(p.status,'standing');assert.equal(queue.length,0);
 const f=fixture([4,1,1]);Object.assign(f.d,{status:'reserve',x:null,y:null});f.p.extraSkills=['Safe Pair of Hands'];f.g.ball={x:10,y:7,carrier:f.p.id};f.g.endTurn();cast(f.g,'Fireball');assert.equal(f.g.pending.kind,'Safe Pair of Hands');choose(f.g,'Place ball at 10, 7');assert.equal(f.g.ball.carrier,null);assert.deepEqual([f.g.ball.x,f.g.ball.y],[9,6]);assert.equal(f.queue.length,0);
});
test('Fireball finishes each victim medical sequence before the next target',()=>{
 const {g,p,d,queue}=fixture([4,6,6,4,4,4,1,1],[{wizards:1,apothecary:1},{}]);g.endTurn();cast(g,'Fireball');assert.equal(g.pending.kind.startsWith('Apothecary'),true);assert.equal(d.status,'standing');assert.equal(g.active,0);assert.deepEqual(g.turns,[1,0]);choose(g,'Decline treatment');assert.equal(p.status,'knocked-out');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Zap replaces all original skills with the pinned Frog profile and drops the ball',()=>{
 const {g,p,d,queue}=fixture([3,1]);Object.assign(d,{status:'reserve',x:null,y:null});p.extraSkills=['Block','Leader','Regeneration'];g.ball={x:10,y:7,carrier:p.id};g.endTurn();cast(g,'Zap');const profile=g.profile(p);assert.deepEqual([profile.ma,profile.st,profile.ag,profile.pa,profile.av],[5,1,'2+','-','5+']);assert.equal(g.has(p,'Block'),false);assert.equal(g.has(p,'Leader'),false);assert.equal(g.has(p,'No Ball'),true);assert.equal(g.ball.carrier,null);assert.equal(p.status,'standing');assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Zap natural one fails and six succeeds above ST6, without rerolls',()=>{
 for(const [roll,st,expected] of [[1,1,false],[2,3,false],[6,7,true]]){const {g,p,queue}=fixture([roll]);p.profileOverride.st=st;g.endTurn();cast(g,'Zap');assert.equal(!!p.zapped,expected);assert.equal(g.wizards[0],0);assert.equal(g.pending,null);assert.equal(queue.length,0);}
});
test('Zap cannot target an existing Frog, and reverts at the next drive',()=>{
 const {g,p}=fixture([6]);g.endTurn();cast(g,'Zap');assert.deepEqual(g.spellTargets('Zap',10,7),[]);g.endDrive(0);g.continueDrive();assert.equal(p.zapped,undefined);assert.equal(g.profile(p).st,3);
});
test('spent Wizard stays spent at halftime and direct casts outside a window fail',()=>{
 const {g,p}=fixture([1]);assert.equal(g.castSpell(0,'Zap',10,7,()=>{}),false);g.endTurn();cast(g,'Zap');g.turns=[8,8];g.endDrive(null);g.continueDrive();assert.equal(g.half,2);assert.equal(g.wizards[0],0);assert.equal(p.zapped,undefined);
});

test('Fireball releases a knocked-out carrier ball before offering medical treatment',()=>{
 const {g,p,d,queue}=fixture([4,6,6,4,3,1],[{wizards:1,apothecary:1},{}]);Object.assign(d,{status:'reserve',x:null,y:null});g.ball={x:10,y:7,carrier:p.id};g.endTurn();cast(g,'Fireball');assert.equal(g.pending.kind.startsWith('Apothecary'),true);assert.equal(g.ball.carrier,null);assert.deepEqual([g.ball.x,g.ball.y],[9,6]);assert.equal(queue.length,0);choose(g,'Use Apothecary');assert.equal(p.status,'stunned');assert.equal(g.phase,'play');
});

test('Fireball injury and casualty dice precede successful Steady Footing and leave no injury record',()=>{
 const {g,p,d,queue}=fixture([4,6,6,6,6,15,1,6]);Object.assign(d,{status:'reserve',x:null,y:null});p.extraSkills=['Steady Footing'];g.endTurn();cast(g,'Fireball');assert.equal(g.pending.kind,'Steady Footing');assert.equal(queue.length,1);choose(g,'Use Steady Footing');assert.equal(p.status,'standing');assert.equal(p.casualty,undefined);assert.equal(g.injuryRecords.length,0);assert.equal(queue.length,0);
});
