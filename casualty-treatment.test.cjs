const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=()=>JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],match=false){
 const queue=[...rolls],g=match?new MatchGame(teams()):new SkillGame(teams(),{scenario:'pickup'});
 g.dice=s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s,'Invalid D'+s+': '+n);return n;};g.rerolls=[0,0];
 return {g,p:g.players[0],d:g.players[11],queue};
}
function choose(g,option){assert.ok(g.pending);assert.equal(g.pending.resolve(option),true);}
for(const [die,result] of [[1,'Badly hurt'],[8,'Badly hurt'],[9,'Seriously hurt'],[10,'Seriously hurt'],[11,'Serious injury'],[12,'Serious injury'],[13,'Head injury'],[14,'Head injury'],[15,'Dead'],[16,'Dead']]){
 test('D16 casualty '+die+' maps to '+result,()=>{const {g,p,queue}=fixture([die,1]);let calls=0;g.injuryResult(p,10,()=>calls++);assert.equal(p.casualty.result,result);assert.equal(p.status,'casualty');assert.equal(g.injuryRecords[0].selected.die,die);assert.equal(calls,1);assert.equal(queue.length,0);});
}
for(const [detail,result] of [[1,'Head injury'],[2,'Head injury'],[3,'Smashed knee'],[4,'Broken arm'],[5,'Dislocated hip'],[6,'Dislocated shoulder']]){
 test('Serious injury detail '+detail+' records '+result,()=>{const {g,p}=fixture([13,detail]);g.injuryResult(p,12);assert.equal(p.casualty.result,result);});
}
test('stat reductions at their limit become Seriously hurt without modifying the exhibition profile',()=>{
 for(const [detail,key,value] of [[1,'av','3+'],[3,'ma',1],[4,'pa','-'],[5,'ag','6+'],[6,'st',1]]){
  const {g,p}=fixture([13,detail]);p.profileOverride={...g.profile(p),[key]:value};g.injuryResult(p,10);assert.equal(p.casualty.result,'Seriously hurt');assert.equal(g.profile(p)[key],value);
 }
});
test('Decay adds one to a single casualty die, and applies to the apothecary alternative',()=>{
 const {g,p,queue}=fixture([14,2,7,3]);p.extraSkills=['Decay'];g.apothecaries[0]=1;g.injuryResult(p,12);assert.equal(g.pending.team,0);assert.equal(p.status,'casualty');choose(g,'Use Apothecary');assert.equal(p.status,'reserve');const r=g.injuryRecords[0];assert.equal(r.original.result,'Dead');assert.equal(r.original.modifier,1);assert.equal(r.alternative.total,8);assert.equal(queue.length,0);
});
test('niggling injuries add to the casualty roll without changing injury dice',()=>{const {g,p}=fixture([13,4]);p.nigglingInjuries=2;g.injuryResult(p,10);assert.equal(p.casualty.result,'Dead');assert.equal(p.casualty.modifier,2);});
test('Stunty nine is automatic Badly hurt with no casualty dice or Decay modifier',()=>{const {g,p,queue}=fixture();p.extraSkills=['Stunty','Decay'];g.injuryResult(p,9);assert.equal(p.casualty.result,'Badly hurt');assert.equal(p.casualty.automatic,true);assert.equal(queue.length,0);});
test('Iron Hard Skin suppresses the Stunty injury table',()=>{const {g,p}=fixture();p.extraSkills=['Stunty','Iron Hard Skin'];g.injuryResult(p,9);assert.equal(p.status,'knocked-out');assert.equal(p.casualty,undefined);});
test('Regeneration is after casualty dice and before apothecary, and clears the injury',()=>{
 const {g,p,queue}=fixture([16,6,4]);p.extraSkills=['Regeneration'];g.apothecaries[0]=1;g.injuryResult(p,10);assert.equal(p.status,'reserve');assert.equal(p.casualty,null);assert.equal(g.apothecaries[0],1);assert.equal(g.pending,null);assert.equal(g.injuryRecords[0].original.result,'Dead');assert.equal(queue.length,0);
});
test('failed Regeneration opens the owning coach apothecary offer',()=>{const {g,p}=fixture([16,6,3,1,1]);p.extraSkills=['Regeneration'];g.apothecaries[0]=1;g.injuryResult(p,10);assert.match(g.pending.kind,/Apothecary/);choose(g,'Use Apothecary');assert.equal(p.status,'reserve');assert.equal(g.apothecaries[0],0);});
test('active team can re-roll failed Regeneration, but Pro is excluded',()=>{
 const {g,p}=fixture([16,1,1,4]);p.extraSkills=['Regeneration','Pro'];g.rerolls[0]=1;g.apothecaries[0]=1;g.injuryResult(p,10);assert.deepEqual(g.pending.options,['Team re-roll Regeneration','Accept Regeneration failure']);choose(g,'Team re-roll Regeneration');assert.equal(p.status,'reserve');assert.equal(g.rerolls[0],0);assert.equal(p.proUsed,false);assert.equal(g.apothecaries[0],1);
});
test('failed Loner consumes the Regeneration re-roll but does not roll again',()=>{const {g,p,queue}=fixture([16,1,1,1]);p.extraSkills=['Regeneration','Loner (4+)'];g.rerolls[0]=1;g.injuryResult(p,10);choose(g,'Team re-roll Regeneration');assert.equal(p.status,'casualty');assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);});
test('defending Regeneration cannot use the active team re-roll',()=>{const {g,d}=fixture([16,1,1]);d.extraSkills=['Regeneration'];g.rerolls=[2,2];g.injuryResult(d,10);assert.equal(g.pending,null);assert.equal(d.status,'casualty');assert.deepEqual(g.rerolls,[2,2]);});
test('apothecary treats Badly hurt without rolling and rejects stale or invalid choices',()=>{
 const {g,p}=fixture([1,1]);g.apothecaries[0]=1;let calls=0;g.injuryResult(p,10,()=>calls++);const q=g.pending;assert.equal(q.resolve('invalid'),false);assert.equal(g.apothecaries[0],1);choose(g,'Use Apothecary');assert.equal(p.status,'reserve');assert.equal(calls,1);assert.equal(q.resolve('Use Apothecary'),false);assert.equal(g.apothecaries[0],0);
});
test('declining treatment keeps the injury and resource',()=>{const {g,p}=fixture([16,1]);g.apothecaries[0]=1;g.injuryResult(p,10);choose(g,'Decline treatment');assert.equal(p.casualty.result,'Dead');assert.equal(g.apothecaries[0],1);});
test('coach can retain the original casualty when the apothecary rolls worse',()=>{
 const {g,p}=fixture([9,1,16,1]);g.apothecaries[0]=1;let calls=0;g.injuryResult(p,10,()=>calls++);choose(g,'Use Apothecary');assert.equal(calls,0);assert.equal(g.pending.team,0);choose(g,'Keep original: Seriously hurt');assert.equal(p.casualty.result,'Seriously hurt');assert.equal(calls,1);
});
test('coach can select the alternative casualty without another regeneration roll',()=>{const {g,p,queue}=fixture([16,1,2,9,1]);p.extraSkills=['Regeneration'];g.apothecaries[0]=1;g.injuryResult(p,10);choose(g,'Use Apothecary');choose(g,'Use new: Seriously hurt');assert.equal(p.casualty.result,'Seriously hurt');assert.equal(queue.length,0);});
test('ordinary KO treatment restores a stunned player to the original square',()=>{const {g,p}=fixture();const origin={x:p.x,y:p.y};g.apothecaries[0]=1;g.injuryResult(p,8);assert.equal(p.x,null);choose(g,'Use Apothecary');assert.equal(p.status,'stunned');assert.equal(p.x,origin.x);assert.equal(p.y,origin.y);});
test('crowd KO treatment sends the player to reserves and waits before ball throw-in',()=>{
 const {g,p,queue}=fixture([4,4,1,1,1,5]);Object.assign(p,{x:0,y:7});g.ball={x:0,y:7,carrier:p.id};g.apothecaries[0]=1;let calls=0;g.pushPlayer(p,{x:-1,y:7},()=>calls++);assert.equal(calls,0);assert.equal(queue.length,4);choose(g,'Use Apothecary');assert.equal(p.status,'reserve');assert.equal(calls,1);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('Kicked player KO treatment uses reserves rather than an off-pitch stun',()=>{const {g,p}=fixture();g.apothecaries[0]=1;g.injuryResult(p,4,()=>{},{stunIsKo:true});choose(g,'Use Apothecary');assert.equal(p.status,'reserve');assert.equal(p.x,null);});
test('fall turnover waits for treatment and still occurs after a successful cure',()=>{
 const {g,p}=fixture([6,6,6,6,1,1]);g.apothecaries[0]=1;g.fall(p);assert.equal(g.active,0);assert.equal(g.pending.team,0);choose(g,'Use Apothecary');assert.equal(p.status,'reserve');assert.equal(g.active,1);assert.equal(g.injuryRecords.length,1);
});
test('both committed Both Down injuries finish even while treatment suspends the first',()=>{
 const {g,p,d,queue}=fixture([6,6,6,6,1,1,6,6,6,6,1,1]);g.apothecaries=[1,1];g.blockAction={attacker:p,target:d,blitz:false};g.resolveBlockDowns([{p,by:d},{p:d,by:p}]);assert.equal(g.pending.team,0);choose(g,'Use Apothecary');assert.equal(g.pending.team,1);assert.equal(g.active,0);choose(g,'Decline treatment');assert.equal(g.active,1);assert.equal(g.injuryRecords.length,2);assert.equal(d.status,'casualty');assert.equal(queue.length,0);
});
function infect(rolls=[16,1]){const f=fixture(rolls);f.p.extraSkills=['Plague Ridden'];f.d.role=1;return f;}
function kill(g,p,d){g.resolveInjury(d,10,()=>{},{source:{playerId:p.id,cause:'Block'},plague:true});}
test('Plague Ridden adds one usable predefined reserve after the final death',()=>{
 const {g,p,d}=infect([16,1,16,1]);kill(g,p,d);assert.equal(g.players.length,23);const rotter=g.players.at(-1);assert.equal(rotter.status,'reserve');assert.equal(rotter.raisedFrom,d.id);assert.equal(g.profile(rotter).name,'Imperial Retainer');assert.ok(g.has(rotter,'Fend'));kill(g,p,g.players[12]);assert.equal(g.players.length,23);
});
test('Plague Ridden uses passive attacker skill even when the attacker is already prone',()=>{const {g,p,d}=infect();p.status='prone';kill(g,p,d);assert.equal(g.players.length,23);});
test('Plague Ridden waits for treatment and cannot raise a saved victim',()=>{const {g,p,d}=infect([16,1,1,1]);g.apothecaries[1]=1;kill(g,p,d);assert.equal(g.players.length,22);choose(g,'Use Apothecary');assert.equal(d.status,'reserve');assert.equal(g.players.length,22);assert.equal(g.plagueUsed[0],false);});
test('declined death treatment creates the Plague Ridden reserve exactly once',()=>{const {g,p,d}=infect();g.apothecaries[1]=1;kill(g,p,d);const q=g.pending;choose(g,'Decline treatment');assert.equal(g.players.length,23);q.resolve('Decline treatment');assert.equal(g.players.length,23);});
for(const excluded of ['Decay','Regeneration','Stunty','Big Guy'])test('Plague Ridden excludes '+excluded,()=>{
 const {g,p,d}=infect([16,1,...(excluded==='Regeneration'?[1]:[])]);if(excluded==='Big Guy')d.profileOverride={...g.profile(d),traits:'Big Guy'};else d.extraSkills=[excluded];kill(g,p,d);assert.equal(g.players.length,22);assert.equal(g.plagueUsed[0],false);
});
test('foul and uncredited death cannot trigger Plague Ridden',()=>{const {g,p,d}=infect([16,1,16,1]);g.resolveInjury(d,10,()=>{},{source:{playerId:p.id,cause:'Foul'}});g.resolveInjury(g.players[12],10);assert.equal(g.players.length,22);});
test('match apothecary configuration locks after fans, and treatment persists across drives',()=>{
 const {g,p}=fixture([1,1],true);assert.equal(g.setApothecary(0,true),true);assert.equal(g.apothecaries[0],1);g.phase='play';assert.equal(g.setApothecary(0,false),false);g.injuryResult(p,10);choose(g,'Use Apothecary');g.prepareDrive(0);assert.equal(g.apothecaries[0],0);assert.equal(g.injuryRecords.length,1);assert.ok(g.available(0).includes(p));
});
test('raised reserve is available on the next match setup',()=>{
 const {g,p,d}=fixture([16,1],true);p.extraSkills=['Plague Ridden'];d.role=1;g.phase='play';kill(g,p,d);const rotter=g.players.at(-1);assert.ok(g.available(0).includes(rotter));g.prepareDrive(0);assert.ok(g.available(0).includes(rotter));assert.equal(g.profile(rotter).name,'Imperial Retainer');assert.equal(d.status,'casualty');
});
test('actual Block knockdown creates the Plague Ridden reserve after death treatment',()=>{
 const {g,p,d}=infect([6,6,6,6,16,1]);g.blockAction={attacker:p,target:d,blitz:false};let calls=0;g.fall(d,{turnover:false,mightyBlowBy:p,after:()=>calls++});assert.equal(g.players.length,23);assert.equal(calls,1);assert.deepEqual(d.casualtySource,{playerId:p.id,cause:'Block'});
});
test('ordinary special action deaths are excluded but a special attack during Blitz can infect',()=>{
 for(const blitz of [false,true]){const {g,p,d}=infect([6,6,6,6,16,1]);g.action=blitz?'blitz':'special:Stab';g.specialAttack(p,d,'Stab');assert.equal(g.players.length,blitz?23:22);}
});
test('crowd death with no attacker does not create a Plague Ridden reserve',()=>{
 const {g,p,d}=infect([6,6,16,1]);Object.assign(d,{x:0,y:7});g.blockAction={attacker:p,target:d,blitz:false};g.pushPlayer(d,{x:-1,y:7},()=>{});assert.equal(g.players.length,22);assert.equal(g.plagueUsed[0],false);
});
test('Plague Ridden can raise after a death alternative is retained, but not a lesser result',()=>{
 for(const death of [true,false]){const {g,p,d}=infect([16,1,9,1]);g.apothecaries[1]=1;kill(g,p,d);choose(g,'Use Apothecary');choose(g,death?'Keep original: Dead':'Use new: Seriously hurt');assert.equal(g.players.length,death?23:22);}
});
test('multiple eligible linemen suspend continuation until a valid position is selected',()=>{
 const {g,p,d}=infect();g.teams[0].positions.push({...g.teams[0].positions[0],name:'Alternative'});let calls=0;g.resolveInjury(d,10,()=>calls++,{source:{playerId:p.id,cause:'Block'},plague:true});assert.equal(g.pending.team,0);assert.equal(calls,0);const q=g.pending;assert.equal(q.resolve('invalid'),false);choose(g,q.options[1]);assert.equal(g.profile(g.players.at(-1)).name,'Alternative');assert.equal(calls,1);assert.equal(q.resolve(q.options[1]),false);
});
test('without an eligible team lineman Plague Ridden does not consume its allowance',()=>{
 const {g,p,d}=infect();g.teams[0].positions=g.teams[0].positions.map(profile=>({...profile,traits:'Blitzer'}));kill(g,p,d);assert.equal(g.players.length,22);assert.equal(g.plagueUsed[0],false);
});
test('a treated injured Leader cannot supply its own Regeneration team re-roll',()=>{
 const {g,p}=fixture([16,1,1]);p.extraSkills=['Leader','Regeneration'];g.leaderPool[0]=true;g.injuryResult(p,10);assert.equal(g.pending,null);assert.equal(p.status,'casualty');
});
