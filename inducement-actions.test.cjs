const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],resources=[{mascots:1},{}]){const queue=[...rolls],g=new MatchGame(structuredClone(teams),{resources,dice:s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});g.phase='play';g.rerolls=[0,0];g.players.forEach(p=>Object.assign(p,{status:'reserve',x:null,y:null}));const p=g.players[0];Object.assign(p,{status:'standing',x:10,y:7,profileOverride:{...g.profile(p),skills:[],ag:'3+'}});return {g,p,queue};}
function choose(g,label){assert.ok(g.pending?.options.includes(label),g.pending?.kind+': '+g.pending?.options.join(' / '));g.decide(label);}

test('Mascot and Weather Mage prices and caps use the funded resource catalogue',()=>{
 const {g}=fixture();assert.equal(g.resourceSpec(0,'mascots').cost,25000);assert.equal(g.resourceSpec(0,'weatherMages').cost,30000);assert.equal(g.validResource(0,'mascots',2),false);assert.equal(g.validResource(0,'weatherMages',2),false);
});

test('Mascot grants an ordinary re-roll on four without spending a team re-roll',()=>{
 const {g,p,queue}=fixture([1,4,6]);g.rerolls=[2,0];let success=false;g.test(p,'Pick up',3,()=>success=true,()=>{});choose(g,'Mascot');assert.equal(success,true);assert.equal(g.mascots[0],0);assert.equal(g.rerolls[0],2);assert.equal(queue.length,0);assert.equal(g.pending,null);
});

test('failed Mascot preserves the original failure and cannot offer another re-roll',()=>{
 const {g,p,queue}=fixture([1,3]);g.rerolls=[2,0];let failed=0;g.test(p,'Pick up',3,()=>assert.fail(),()=>failed++);choose(g,'Mascot');assert.equal(failed,1);assert.equal(g.rerolls[0],2);assert.equal(g.pending,null);assert.equal(queue.length,0);
});

test('explicit Mascot fallback spends a team re-roll only when the Mascot fails',()=>{
 for(const mascot of [3,4]){const {g,p,queue}=fixture([1,mascot,6]);g.rerolls=[2,0];let success=false;g.test(p,'Pick up',3,()=>success=true,()=>{});choose(g,'Mascot then Team');assert.equal(success,true);assert.equal(g.rerolls[0],mascot===3?1:2);assert.equal(queue.length,0);}
});

test('Loner applies after a successful Mascot and can waste its use',()=>{
 const {g,p,queue}=fixture([1,4,1]);p.extraSkills=['Loner (4+)'];let failed=0;g.test(p,'Pick up',3,()=>assert.fail(),()=>failed++);choose(g,'Mascot');assert.equal(failed,1);assert.equal(g.mascots[0],0);assert.equal(queue.length,0);
});

test('failed Pro may use a Mascot to retry Pro before rerolling the original die',()=>{
 const {g,p,queue}=fixture([1,1,4,3,6]);p.extraSkills=['Pro'];g.mover=p.id;let success=false;g.test(p,'Pick up',3,()=>success=true,()=>{});choose(g,'Pro');choose(g,'Mascot re-roll Pro');assert.equal(success,true);assert.equal(p.proUsed,true);assert.equal(g.mascots[0],0);assert.equal(queue.length,0);
});

test('Mascot handles the entire Block pool and locks a failed request too',()=>{
 for(const mascot of [3,4]){const {g,p,queue}=fixture(mascot===3?[3]:[4,6,5]);g.blockAction={attacker:p,dice:[1,2],poolLocked:false};g.pending={type:'blockSelect'};
  assert.equal(g.rerollBlock('Mascot'),true);assert.deepEqual(g.blockAction.dice,mascot===3?[1,2]:[6,5]);assert.equal(g.blockAction.poolLocked,true);assert.equal(g.rerollBlock('Mascot'),false);assert.equal(queue.length,0);}
});

test('Mascot cannot be spent during kickoff Charge or the opposing turn',()=>{
 const {g,p}=fixture();g.phase='charge';assert.deepEqual(g.rerollSources(p),[]);assert.equal(g.useRerollSource(p,'Mascot'),false);g.phase='play';g.active=1;assert.deepEqual(g.rerollSources(p),[]);assert.equal(g.mascots[0],1);
});

test('Mascot remains independent of Chef losses and is not renewed at halftime',()=>{
 const {g,p}=fixture([6,6,6],[{mascots:1},{masterChef:1}]);g.rerolls=[2,2];g.startHalfResources();assert.equal(g.mascots[0],1);assert.equal(g.rerolls[0],0);g.mascots[0]=0;g.half=2;g.startHalfResources=MatchGame.prototype.startHalfResources.bind(g);g.resourceChoices[1].masterChef=0;g.startHalfResources();assert.equal(g.mascots[0],0);assert.deepEqual(g.rerollSources(p),[]);
});

test('Mascot Cheering Fans ownership rerolls natural one after its match re-roll is spent',()=>{
 const {g,queue}=fixture([1,6,5]);g.mascots[0]=0;g.landKick=()=>{};g.kickoffEvent(6);assert.deepEqual(g.cheer,[true,false]);assert.equal(g.mascots[0],0);assert.equal(queue.length,0);
});

test('Mascot does not reroll non-one cheering or Brilliant Coaching results',()=>{
 for(const event of [6,7]){const {g,queue}=fixture([2,3]);g.landKick=()=>{};g.kickoffEvent(event);assert.equal(queue.length,0);assert.equal(g.mascots[0],1);}
});

test('Weather Mage may be declined for a turn and used at a later turn start',()=>{
 const {g,queue}=fixture([1,1],[{weatherMages:1},{}]);g.beginTurn(0);choose(g,'Keep weather');assert.equal(g.weatherMages[0],1);assert.equal(g.useWeatherMage(0),false);g.beginTurn(0);choose(g,'Use Weather Mage');assert.equal(g.weatherMages[0],0);assert.deepEqual(g.pending.options,['Sweltering Heat','Very Sunny','Perfect Conditions']);choose(g,'Very Sunny');assert.equal(g.weather,'Very Sunny');assert.equal(queue.length,0);
});

test('Weather Mage offers unique reachable weather results and consumes use when unchanged',()=>{
 for(const [dice,options] of [[[4,4],null],[[5,6],['Pouring Rain','Blizzard','Perfect Conditions']]]){
  const {g,queue}=fixture(dice,[{weatherMages:1},{}]);g.weather='Blizzard';g.beginTurn(0);choose(g,'Use Weather Mage');if(options){assert.deepEqual(g.pending.options,options);choose(g,'Blizzard');assert.equal(g.weather,'Blizzard');}else{assert.equal(g.pending,null);assert.equal(g.weather,'Perfect Conditions');}assert.equal(g.weatherMages[0],0);assert.equal(queue.length,0);
 }
});

test('Weather Mage choices reject stale callbacks and never start another turn',()=>{
 const {g}=fixture([1,1],[{weatherMages:1},{}]);g.beginTurn(0);const old=g.pending;choose(g,'Use Weather Mage');const turn=g.turns[0];assert.equal(old.resolve('Use Weather Mage'),false);choose(g,'Perfect Conditions');assert.equal(g.turns[0],turn);assert.equal(g.weatherMages[0],0);
});

test('Mascot can retry active-team Regeneration without a Pro window',()=>{
 const {g,p,queue}=fixture([1,1,1,4,6]);p.extraSkills=['Regeneration','Pro'];let done=false;g.resolveInjury(p,12,()=>done=true);assert.equal(g.pending.kind,'Regeneration — #1');choose(g,'Mascot re-roll Regeneration');assert.equal(done,true);assert.equal(p.status,'reserve');assert.equal(g.mascots[0],0);assert.equal(p.proUsed,false);assert.equal(queue.length,0);
});

test('Mascot is available for one chosen Multiple Block pool and cannot reroll it twice',()=>{
 const {g,p,queue}=fixture([1,1,4,6]);p.extraSkills=['Multiple Block'];p.profileOverride.st=5;
 const [d,e]=g.players.filter(q=>q.team===1).slice(0,2);for(const [q,pos] of [[d,{x:11,y:7}],[e,{x:10,y:8}]])Object.assign(q,{...pos,status:'standing',profileOverride:{...g.profile(q),st:3,skills:[]}});
 assert.equal(g.multipleBlock(p.id,[d.id,e.id]),true);choose(g,'Mascot re-roll pool #'+e.number);assert.equal(g.mascots[0],0);assert.ok(!g.pending.options.some(o=>o.startsWith('Mascot')));assert.equal(g.multipleContext.pools[1].poolLocked,true);assert.equal(queue.length,0);
});

test('Mascot can reroll Swoop direction through the bounded dice-choice interface',()=>{
 const {g,p,queue}=fixture([1,4,6]);let result;g.rollChoice(p,'Swoop direction',6,n=>result=n);choose(g,'Mascot re-roll');assert.equal(result,6);assert.equal(queue.length,0);
});
