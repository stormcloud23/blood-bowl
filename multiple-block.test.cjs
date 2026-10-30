const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
function fixture(rolls=[],match=false){
 const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]),queue=[...rolls];
 const g=match?new MatchGame(teams):new SkillGame(teams,{scenario:'teams'});
 g.dice=s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;};g.rerolls=[0,0];g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));
 const a=g.players[0],d=g.players[11],e=g.players[12];
 for(const p of [a,d,e]){p.profileOverride={...g.profile(p),st:p===a?5:3,skills:[],traits:'Lineman, Human'};p.status='standing';}
 a.extraSkills=['Multiple Block'];Object.assign(a,{x:10,y:7});Object.assign(d,{x:11,y:7});Object.assign(e,{x:10,y:8});g.ball={x:20,y:14,carrier:null};
 if(match){g.phase='play';g.active=0;g.turns=[1,0];}
 return {g,a,d,e,queue,start:()=>g.multipleBlock(a.id,[d.id,e.id])};
}
function choose(g,text){const q=g.pending;assert.ok(q,'Expected decision '+text);assert.ok(q.options.includes(text),q.kind+': '+q.options.join(' / '));assert.notEqual(q.resolve(text),false);}
function die(g,number,face){choose(g,g.pending.options.find(o=>o.startsWith('Choose #'+number+' ')&&o.endsWith(': '+face)));}
function push(g){const q=g.pending;assert.equal(q.type,'pushChoice');q.resolve(q.options.find(p=>!p.standFirm));}

test('Multiple Block requires two distinct adjacent standing opponents and the skill',()=>{
 const {g,a,d,e,start}=fixture();assert.ok(g.canMultipleBlock(a));assert.equal(g.multipleBlock(a.id,[d.id,d.id]),false);e.status='prone';assert.equal(start(),false);e.status='standing';e.x=15;assert.equal(start(),false);e.x=10;a.extraSkills=[];assert.equal(start(),false);assert.equal(a.used,false);
});
test('declaration previews pairs, Cancel spends no activation, and stale choices do nothing',()=>{
 const {g,a}=fixture();assert.ok(g.chooseMultipleBlock(a));const q=g.pending;choose(g,'Cancel');assert.equal(a.used,false);assert.equal(q.resolve(q.options[0]),false);assert.equal(g.multipleContext,undefined);
});
test('both dice pools are rolled and selected before any push or injury',()=>{
 const {g,a,d,e,queue,start}=fixture([3,3]);start();assert.equal(queue.length,0);assert.equal(g.multipleContext.pools.length,2);assert.equal(g.multipleContext.pools[0].aStrength,3);assert.equal(g.multipleContext.pools[1].aStrength,3);die(g,d.number,'Push Back');assert.equal(d.x,11);assert.equal(g.pending.type,'custom');die(g,e.number,'Push Back');push(g);assert.equal(a.x,10);assert.equal(a.y,7);push(g);assert.equal(g.multipleContext,null);assert.equal(g.action,null);assert.equal(a.used,true);assert.equal(g.pending,null);
});
test('selected targets cannot assist one another, including Guard',()=>{
 const {g,a,d,e,start}=fixture([3,3]);e.extraSkills=['Guard'];d.extraSkills=['Guard'];start();for(const b of g.multipleContext.pools){assert.equal(b.assists.defensive,0);assert.equal(b.dStrength,3);}assert.equal(a.x,10);
});
test('strength reduction has a floor of one and is before assists',()=>{
 const {g,a,d,e,start}=fixture([3,3,3,3]);a.profileOverride.st=1;d.profileOverride.st=e.profileOverride.st=2;start();for(const b of g.multipleContext.pools){assert.equal(b.aStrength,1);assert.equal(b.count,2);assert.equal(b.chooserTeam,1);}
});
test('defending coach selects uphill dice after the attacker declines re-rolls',()=>{
 const {g,a,d,e,start}=fixture([1,6,3,3,3,3]);a.profileOverride.st=3;start();assert.equal(g.pending.team,0);choose(g,'Let defender choose #'+d.number);choose(g,'Let defender choose #'+e.number);assert.equal(g.pending.team,1);die(g,d.number,'POW');die(g,e.number,'Push Back');assert.equal(g.pending.type,'pushChoice');
});
test('first Player Down cannot cancel the second committed attack or advance the turn early',()=>{
 const {g,a,d,e,queue,start}=fixture([1,6,1,1,1,1]);start();die(g,d.number,'Player Down');die(g,e.number,'POW');assert.equal(a.status,'prone');assert.equal(g.active,0);assert.equal(g.pending.type,'pushChoice');push(g);assert.equal(g.active,1);assert.equal(g.multipleContext,null);assert.equal(queue.length,0);assert.equal(e.status,'prone');
});
test('double Player Down rolls two injuries and does not let a cure erase the other death',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,6,6,6,6,16,1,6,6,6,6,16,1,1,1]);g.apothecaries[0]=1;start();die(g,d.number,'Player Down');die(g,e.number,'Player Down');assert.equal(g.multipleContext.injuries.length,2);assert.equal(g.active,0);assert.equal(queue.length,2);assert.match(g.pending.kind,/medical/);
 choose(g,g.pending.options[1]);choose(g,'Use Apothecary');assert.equal(g.active,1);assert.equal(a.status,'casualty');assert.equal(a.casualty.result,'Dead');assert.equal(a.casualties.length,1);assert.equal(g.injuryRecords.length,2);assert.equal(g.apothecaries[0],0);assert.equal(queue.length,0);
});
test('both defender injuries are known before the coach chooses which one to treat',()=>{
 const {g,d,e,start}=fixture([6,6,6,6,6,6,1,1,6,6,6,6,16,1,1,1]);g.apothecaries[1]=1;start();die(g,d.number,'POW');die(g,e.number,'POW');push(g);assert.equal(g.pending.type,'pushChoice');assert.equal(g.injuryRecords.length,0);push(g);assert.equal(g.pending.team,1);assert.match(g.pending.options[0],/Badly hurt/);assert.match(g.pending.options[1],/Dead/);choose(g,g.pending.options[1]);choose(g,'Use Apothecary');assert.equal(d.status,'casualty');assert.equal(e.status,'reserve');assert.equal(g.apothecaries[1],0);assert.equal(g.active,0);
});
test('each casualty has its own Regeneration roll; one success cannot cure the other injury',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,6,6,6,6,16,1,6,6,6,6,1,1,4,1]);a.extraSkills.push('Regeneration');start();die(g,d.number,'Player Down');die(g,e.number,'Player Down');assert.equal(a.status,'casualty');assert.equal(a.casualty.result,'Badly hurt');assert.equal(a.casualties.length,1);assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('two successful Regenerations return the double-casualty attacker to reserves',()=>{
 const {g,a,d,e,start}=fixture([1,1,6,6,6,6,16,1,6,6,6,6,16,1,4,4]);a.extraSkills.push('Regeneration');start();die(g,d.number,'Player Down');die(g,e.number,'Player Down');assert.equal(a.status,'reserve');assert.equal(a.casualty,null);assert.equal(g.active,1);
});
test('first-carrier knockdown bounces the ball only once after both results and treatments',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,1,1,1,1,2]);g.ball={x:a.x,y:a.y,carrier:a.id};start();die(g,d.number,'Player Down');die(g,e.number,'Player Down');assert.equal(g.active,1);assert.equal(queue.length,0);assert.equal(g.events.filter(s=>s.startsWith('Ball bounce')).length,1);
});
test('team re-rolls belong to individual pools and one pool cannot be re-rolled twice',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,3,3]);g.rerolls[0]=2;start();choose(g,'Team re-roll pool #'+d.number);assert.ok(!g.pending.options.includes('Team re-roll pool #'+d.number));choose(g,'Team re-roll pool #'+e.number);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);die(g,d.number,'Push Back');die(g,e.number,'Push Back');push(g);push(g);assert.equal(g.active,0);
});
test('failed Loner locks just the selected pool and spends the re-roll',()=>{
 const {g,a,d,e,start}=fixture([1,3,1]);a.extraSkills.push('Loner (4+)');g.rerolls[0]=1;start();choose(g,'Team re-roll pool #'+d.number);assert.equal(g.multipleContext.pools[0].dice[0],1);assert.equal(g.multipleContext.pools[0].poolLocked,true);assert.equal(g.multipleContext.pools[1].poolLocked,false);assert.equal(g.rerolls[0],0);
});
test('Brawler is shared once per activation across the two pools by FFB default',()=>{
 const {g,a,d,e,start}=fixture([2,2,3]);a.extraSkills.push('Brawler');start();choose(g,'Brawler #'+d.number);assert.ok(!g.pending.options.includes('Brawler #'+e.number));assert.equal(g.multipleContext.pools[1].dice[0],2);
});
test('Pro changes only the chosen pool die and cannot be used again on the other pool',()=>{
 const {g,a,d,e,start}=fixture([1,1,3,3]);a.extraSkills.push('Pro');start();choose(g,'Pro #'+d.number);assert.equal(g.pending.kind,'Multiple Block Pro die');choose(g,'Re-roll die 1');assert.equal(g.multipleContext.pools[0].dice[0],3);assert.ok(!g.pending.options.includes('Pro #'+e.number));assert.equal(g.multipleContext.pools[1].dice[0],1);
});
test('Dauntless uses reduced attacker strength separately against each defender',()=>{
 const {g,a,start}=fixture([4,1,3,3,3]);a.profileOverride.st=4;a.extraSkills.push('Dauntless');start();assert.equal(g.multipleContext.pools[0].aStrength,3);assert.equal(g.multipleContext.pools[1].aStrength,2);
});
test('one failed Foul Appearance removes only that attack and retains the strength penalty',()=>{
 const {g,a,d,e,start}=fixture([1,3,3]);d.extraSkills=['Foul Appearance'];start();assert.equal(g.multipleContext.pools.length,1);assert.equal(g.multipleContext.pools[0].target,e);assert.equal(g.multipleContext.pools[0].aStrength,3);choose(g,'Let defender choose #'+e.number);die(g,e.number,'Push Back');push(g);assert.equal(a.used,true);assert.equal(g.active,0);
});
test('all failed Foul Appearance attacks end the activation without turnover or dice pools',()=>{
 const {g,a,d,e,start}=fixture([1,1]);d.extraSkills=e.extraSkills=['Foul Appearance'];start();assert.equal(g.pending,null);assert.equal(g.multipleContext,null);assert.equal(g.active,0);assert.equal(a.used,true);assert.equal(g.scoreDeferrals,0);
});
test('Bone Head failure cleans up the committed action and pending score deferral',()=>{
 const {g,a,start}=fixture([1]);a.extraSkills.push('Bone Head');start();assert.equal(a.distracted,true);assert.equal(g.multipleContext,null);assert.equal(g.scoreDeferrals,0);assert.equal(g.active,0);
});
test('Unchannelled Fury failure also cleans up the action without turnover',()=>{
 const {g,a,start}=fixture([1]);a.extraSkills.push('Unchannelled Fury');start();assert.equal(g.multipleContext,null);assert.equal(g.scoreDeferrals,0);assert.equal(g.active,0);
});
test('prone Jump Up player makes one test for the entire declaration',()=>{
 const {g,a,start}=fixture([6,3,3]);a.extraSkills.push('Jump Up');a.status='prone';start();assert.equal(a.status,'standing');assert.equal(g.multipleContext.pools.length,2);
});
test('failed Jump Up consumes activation but produces no Block dice',()=>{
 const {g,a,start}=fixture([1]);a.extraSkills.push('Jump Up');a.status='prone';start();assert.equal(a.used,true);assert.equal(g.multipleContext,null);assert.equal(g.active,0);
});
test('Frenzy, Hit and Run and Pile Driver cannot add attacks or movement to Multiple Block',()=>{
 const {g,a,d,e,queue,start}=fixture([3,3]);a.extraSkills.push('Frenzy','Hit and Run','Pile Driver');start();die(g,d.number,'Push Back');die(g,e.number,'Push Back');push(g);push(g);assert.equal(g.pending,null);assert.equal(a.x,10);assert.equal(a.y,7);assert.equal(queue.length,0);
});
test('original selected target squares are forbidden even after the other player moves',()=>{
 const {g,a,d,e,start}=fixture([3,3]);a.extraSkills.push('Grab');start();die(g,d.number,'Push Back');die(g,e.number,'Push Back');push(g);assert.ok(!g.pending.options.some(pos=>pos.x===11&&pos.y===7));
});
test('Stand Firm can stop the first push without dropping the second result',()=>{
 const {g,d,e,start}=fixture([3,3]);d.extraSkills=['Stand Firm'];start();die(g,d.number,'Push Back');die(g,e.number,'Push Back');choose(g,'Stand Firm');assert.equal(g.pending.type,'pushChoice');assert.equal(d.x,11);push(g);assert.equal(g.multipleContext,null);
});
test('stale dice decisions cannot answer a later pool or consume a re-roll',()=>{
 const {g,d,e,start}=fixture([3,3]);g.rerolls[0]=1;start();const old=g.pending;die(g,d.number,'Push Back');assert.equal(old.resolve('Team re-roll pool #'+e.number),false);assert.equal(g.rerolls[0],1);
});
test('match turn cleanup waits for the second attack and final treatment',()=>{
 const {g,a,d,e,start}=fixture([1,6,6,6,6,6,1,1,1,1],true);g.apothecaries[0]=1;start();die(g,d.number,'Player Down');die(g,e.number,'POW');assert.equal(g.active,0);push(g);assert.equal(g.active,0);choose(g,'Use Apothecary');assert.equal(g.active,1);assert.equal(a.status,'reserve');assert.equal(g.multipleContext,null);assert.equal(g.phase,'play');
});
test('initial Foul Appearance rolls for both defenders precede re-roll choices',()=>{
 const {g,d,e,queue,start}=fixture([1,1,6,3,3]);d.extraSkills=e.extraSkills=['Foul Appearance'];g.rerolls[0]=1;start();assert.equal(queue.length,3);assert.match(g.pending.kind,/#1, #2/);choose(g,'Team re-roll vs #'+d.number);assert.equal(g.multipleContext.pools.length,1);assert.equal(g.multipleContext.pools[0].target,d);
});
test('initial Dauntless rolls for both targets precede the selected re-roll',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,6,3,3,3]);a.profileOverride.st=4;a.extraSkills.push('Dauntless');g.rerolls[0]=1;start();assert.equal(queue.length,4);choose(g,'Team re-roll vs #'+d.number);assert.equal(g.multipleContext.pools[0].aStrength,3);assert.equal(g.multipleContext.pools[1].aStrength,2);
});
test('all initial Regeneration dice in the team group precede any retry decision',()=>{
 const {g,a,d,e,queue,start}=fixture([1,1,6,6,6,6,16,1,6,6,6,6,16,1,1,1,4]);a.extraSkills.push('Regeneration');g.rerolls[0]=1;start();die(g,d.number,'Player Down');die(g,e.number,'Player Down');assert.equal(queue.length,1);assert.match(g.pending.kind,/Regeneration/);choose(g,g.pending.options[0]);choose(g,'Accept Regeneration failure');choose(g,'Team re-roll Regeneration');assert.equal(a.status,'casualty');assert.equal(a.casualty.result,'Dead');assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Two Both Down results retain four separate injuries including two on the attacker',()=>{
 const {g,a,d,e,queue,start}=fixture([2,2,6,6,6,6,1,1,6,6,6,6,1,1,6,6,6,6,1,1,6,6,6,6,1,1]);start();die(g,d.number,'Both Down');die(g,e.number,'Both Down');assert.equal(g.injuryRecords.length,4);assert.equal(a.casualties.length,2);assert.equal(d.status,'casualty');assert.equal(e.status,'casualty');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Wrestle on the first attack retains the second attack and does not offer a follow-up',()=>{
 const {g,a,d,e,start}=fixture([2,3]);a.extraSkills.push('Wrestle');start();die(g,d.number,'Both Down');die(g,e.number,'Push Back');choose(g,'Attacker uses Wrestle');assert.equal(a.status,'prone');assert.equal(d.status,'prone');assert.equal(g.pending.type,'pushChoice');push(g);assert.equal(g.active,0);assert.equal(g.pending,null);
});
test('Steady Footing can prevent the first knockdown without losing the second result',()=>{
 const {g,a,d,e,start}=fixture([1,3,6]);a.extraSkills.push('Steady Footing');start();die(g,d.number,'Player Down');die(g,e.number,'Push Back');choose(g,'Use Steady Footing');assert.equal(a.status,'standing');push(g);assert.equal(g.active,0);assert.equal(g.scoreDeferrals,0);
});
test('Mighty Blow decisions resolve in each committed attack before medical choices',()=>{
 const {g,a,d,e,start}=fixture([6,6,6,6,4,5,6,6,4,5,1,1,1,1]);a.extraSkills.push('Mighty Blow');start();die(g,d.number,'POW');die(g,e.number,'POW');push(g);assert.equal(g.pending.kind,'Mighty Blow');choose(g,'No modifier');push(g);assert.equal(g.pending.kind,'Mighty Blow');choose(g,'Add +1 to Injury');assert.equal(d.status,'knocked-out');assert.equal(e.status,'casualty');
});
test('stale push and Both Down buttons cannot advance or replace the next result',()=>{
 const {g,a,d,e,start}=fixture([2,3,1,1]);a.extraSkills.push('Block');start();die(g,d.number,'Both Down');die(g,e.number,'Push Back');const old=g.pending;choose(g,'Attacker uses Block');assert.equal(g.pending.type,'pushChoice');assert.equal(old.resolve('Apply Both Down'),false);const q=g.pending;assert.equal(q.resolve({x:100,y:100}),false);push(g);assert.equal(q.resolve(q.options[0]),false);assert.equal(g.active,0);
});
test('a final death cannot create a Plague Ridden reserve during Multiple Block',()=>{
 const {g,a,d,e,start}=fixture([6,3,6,6,6,6,16,1]);a.extraSkills.push('Plague Ridden');start();die(g,d.number,'POW');die(g,e.number,'Push Back');push(g);push(g);assert.equal(d.casualty.result,'Dead');assert.equal(g.players.length,22);assert.equal(g.plagueUsed[0],false);
});
test('Saboteur automatic KO remains untreated and committed while the second attack resolves',()=>{
 const {g,a,d,e,start}=fixture([1,3,4,1,1]);a.extraSkills.push('Secret Weapon','Saboteur');g.apothecaries[0]=1;start();die(g,d.number,'Player Down');die(g,e.number,'Push Back');choose(g,'Use Saboteur');assert.equal(g.pending.type,'pushChoice');push(g);assert.equal(a.status,'knocked-out');assert.equal(d.status,'prone');assert.equal(g.apothecaries[0],1);assert.equal(g.active,0);assert.equal(g.multipleContext,null);
});
test('Dump-off completes once before either pool is rolled',()=>{
 const {g,d,e,queue,start}=fixture([3,3]);d.extraSkills=['Dump-off'];g.ball={x:d.x,y:d.y,carrier:d.id};start();assert.equal(queue.length,2);assert.equal(g.pending.kind,'Dump-off');choose(g,'Keep the ball');assert.equal(queue.length,0);assert.equal(g.multipleContext.pools.length,2);
});
test('Trickster relocation completes before strengths and dice are committed',()=>{
 const {g,d,start}=fixture([3,3]);d.extraSkills=['Trickster'];start();assert.equal(g.pending.kind,'Trickster');const option=g.pending.options.find(o=>o.startsWith('Relocate to'));choose(g,option);assert.equal(g.multipleContext.pools.length,2);assert.notEqual(d.x+','+d.y,'11,7');
});
test('Multiple Block is unavailable during a Blitz or after another activation',()=>{
 const {g,a}=fixture();a.used=true;g.mover=a.id;g.action='blitz';assert.equal(g.canMultipleBlock(a),false);assert.equal(g.chooseMultipleBlock(a),false);
});
test('Grab falls back to legal occupied chain-push squares when only a reserved square is empty',()=>{
 const {g,a,d,e,start}=fixture([3,3]);start();Object.assign(d,{x:13,y:7});let index=2;
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&!g.at(e.x+dx,e.y+dy)&&!(e.x+dx===11&&e.y+dy===7)){Object.assign(g.players[index++],{x:e.x+dx,y:e.y+dy,status:'standing'});}
 const options=g.pushSquares(a,e,true);assert.ok(options.length);assert.ok(options.every(pos=>pos.y===9));assert.ok(!options.some(pos=>pos.x===11&&pos.y===7));
});
