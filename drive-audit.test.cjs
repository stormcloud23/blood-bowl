const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[]){const queue=[...rolls],sizes=[],g=new MatchGame(structuredClone(teams),{dice:s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);sizes.push(s);return n;}});g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));g.landKick=()=>{g.landed=(g.landed||0)+1;};return {g,queue,sizes};}
function field(g,team,count){return g.players.filter(p=>p.team===team).slice(0,count).map((p,i)=>{Object.assign(p,{x:team?16:10,y:3+i,status:'standing'});return p;});}

test('tied Pitch Invasion uses one shared D3 count and samples distinct standing players',()=>{
 const {g,queue,sizes}=fixture([3,3,4,1,1,1,1]),home=field(g,0,3),away=field(g,1,3);home[2].status='prone';away[2].status='prone';g.fans=[1,1];g.kickoffEvent(12);assert.equal(home.filter(p=>p.status==='stunned').length,2);assert.equal(away.filter(p=>p.status==='stunned').length,2);assert.equal(home[2].status,'prone');assert.equal(away[2].status,'prone');assert.deepEqual(sizes,[6,6,6,2,1,2,1]);assert.equal(g.landed,1);assert.equal(queue.length,0);
});

test('Pitch Invasion commits both teams victims before Ball and Chain medical decisions',()=>{
 const {g,queue}=fixture([3,3,1,1,1,16,1]),a=field(g,0,1)[0],d=field(g,1,1)[0];a.extraSkills=['Ball & Chain'];g.apothecaries[0]=1;g.fans=[1,1];g.kickoffEvent(12);assert.match(g.pending.kind,/Apothecary/);assert.equal(g.landed,undefined);assert.equal(d.status,'standing');g.decide('Decline treatment');assert.equal(a.status,'casualty');assert.equal(d.status,'stunned');assert.equal(g.landed,1);assert.equal(queue.length,0);
});

test('Dodgy Snack selects both losing players before applying either effect',()=>{
 const {g,queue,sizes}=fixture([3,3,2,1,1,6]),home=field(g,0,2),away=field(g,1,2);g.kickoffEvent(11);assert.equal(home[1].status,'reserve');assert.equal(home[0].snack,undefined);assert.equal(away[0].snack,true);assert.equal(away[1].snack,undefined);assert.deepEqual(sizes,[6,6,2,2,6,6]);assert.equal(g.landed,1);assert.equal(queue.length,0);
});

test('full time performs no KO, heat or Secret Weapon dice or resource decisions',()=>{
 const {g}=fixture();field(g,0,1)[0].extraSkills=['Secret Weapon'];g.players[0].fieldedDrive=1;g.players[1].status='knocked-out';g.phase='play';g.half=2;g.drive=1;g.turns=[8,8];g.weather='Sweltering Heat';g.endDrive(null);assert.equal(g.continueDrive(),true);assert.equal(g.phase,'finished');assert.equal(g.players[1].status,'knocked-out');assert.equal(g.pending,null);assert.equal(g.continueDrive(),false);
});

test('KO recovery precedes shared heat selection and recovered reserves cannot be exhausted',()=>{
 const {g,queue,sizes}=fixture([4,2,2,1]),home=field(g,0,2),away=field(g,1,1),ko=g.players[2];ko.status='knocked-out';g.weather='Sweltering Heat';g.phase='play';g.turns=[1,1];g.firstReceiver=1;g.kicking=0;g.endDrive(0);g.continueDrive();assert.notEqual(ko.status,'knocked-out');assert.equal(ko.heatOut,false);assert.equal(home[0].heatOut,false);assert.equal(home[1].heatOut,true);assert.equal(away[0].heatOut,true);assert.deepEqual(sizes,[6,6,2,1]);assert.equal(queue.length,0);
});

test('Pitch Invasion handles an empty affected team without consuming a random-player die',()=>{
 const {g,queue,sizes}=fixture([1,6,6]);g.fans=[1,1];field(g,1,2);g.kickoffEvent(12);assert.equal(g.landed,1);assert.deepEqual(sizes,[6,6,6]);assert.equal(queue.length,0);
});
