const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],scenario='dodge'){
 const queue=[...rolls],g=new SkillGame(structuredClone(teams),{scenario,dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});g.rerolls=[0,0];return {g,a:g.players[0],p:g.players[1],d:g.players[11],queue};
}
const grant=(p,...skills)=>p.extraSkills=skills,select=g=>g.decide(g.pending.options[0]);
function flight(rolls,{kick=false,swoop=false,lethal=false,carrier=false}={}){
 const f=fixture(rolls,'pickup'),{g,a,p}=f;grant(a,kick?'Kick Team-mate':'Throw Team-mate');grant(p,'Right Stuff',...(swoop?['Swoop']:[]),...(lethal?['Lethal Flight']:[]));if(carrier)g.ball={x:p.x,y:p.y,carrier:p.id};g.start(a.id,kick?'kick-team-mate':'throw-team-mate');g.selectThrowMate(p.id);return f;
}
test('Kick Team-mate declaration has its own allowance and requires its trait',()=>{
 const {g,a,p}=fixture();assert.equal(g.start(a.id,'kick-team-mate'),false);grant(a,'Kick Team-mate');grant(p,'Throw Team-mate','Kick Team-mate');g.start(a.id,'kick-team-mate');g.finish();assert.equal(g.canKickTeamMate(p),false);assert.equal(g.canThrowTeamMate(p),true);g.endTurn();g.endTurn();a.used=false;assert.equal(g.canKickTeamMate(a),true);
});
test('fumbled Kick Team-mate makes injury only and upgrades stun to KO',()=>{
 const {g,p,queue}=flight([1,1,1],{kick:true});g.throwTeamMate(12,7);assert.equal(p.status,'knocked-out');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('a kicked carrier fumble drops from the original square and turns over',()=>{
 const {g,p,queue}=flight([1,1,1,7],{kick:true,carrier:true});g.throwTeamMate(12,7);assert.deepEqual(g.ball,{x:9,y:8,carrier:null});assert.equal(p.status,'knocked-out');assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('successful kick uses existing scatter and landing without consuming Pass or Throw Team-mate',()=>{
 const {g,p,queue}=flight([6,5,5,5,6],{kick:true});g.throwTeamMate(12,7);assert.equal(p.x,15);assert.equal(p.status,'standing');assert.equal(g.passUsed[0],false);assert.equal(g.throwUsed?.[0]||false,false);assert.equal(queue.length,0);
});
test('Swoop selects a cardinal template, direction and distance, then grants a landing re-roll',()=>{
 const {g,p,queue}=flight([6,3,2,1,6],{swoop:true});g.throwTeamMate(12,7);assert.equal(g.pending.kind,'Swoop');const old=g.pending;g.decide('North');assert.equal(g.pending.kind,'Landing');assert.ok(g.pending.options.includes('Swoop'));g.decide('Swoop');assert.deepEqual([p.x,p.y],[12,5]);assert.equal(p.status,'standing');assert.equal(g.used(p,'Swoop landing'),true);assert.equal(old.resolve('North'),false);assert.equal(queue.length,0);
});
test('declining Swoop uses the ordinary three scatter dice and offers no Swoop re-roll',()=>{
 const {g,p,queue}=flight([6,5,5,5,6],{swoop:true});g.throwTeamMate(12,7);g.decide('Scatter normally');assert.equal(p.x,15);assert.equal(g.pending,null);assert.equal(g.used(p,'Swoop landing'),false);assert.equal(queue.length,0);
});
test('Swoop direction may use a team re-roll with no second direction window',()=>{
 const {g,p,queue}=flight([6,1,3,1,6],{swoop:true});g.rerolls[0]=1;g.throwTeamMate(12,7);g.decide('East');assert.equal(g.pending.kind,'Swoop direction');g.decide('Team re-roll');assert.deepEqual([p.x,p.y],[13,7]);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Lethal Flight modifies an opponent injury and attributes the casualty to the passenger',()=>{
 const {g,p,d,queue}=flight([6,5,5,5,6,6,4,5,1,1,5,1,1],{lethal:true});Object.assign(d,{x:15,y:7});g.throwTeamMate(12,7);assert.equal(g.pending.kind,'Lethal Flight');g.decide('Add +1 to Injury');assert.equal(d.status,'casualty');assert.deepEqual(d.casualtySource,{playerId:p.id,cause:'Lethal Flight'});assert.equal(queue.length,0);
});
test('Iron Hard Skin blocks Lethal Flight armour but permits its injury bonus',()=>{
 const {g,d,queue}=flight([6,5,5,5,6,6,4,5,1,1,5,1,1],{lethal:true});Object.assign(d,{x:15,y:7,extraSkills:['Iron Hard Skin']});g.throwTeamMate(12,7);assert.equal(g.pending.kind,'Lethal Flight');g.decide('Add +1 to Injury');assert.equal(d.status,'casualty');assert.equal(queue.length,0);
});
test('Lethal Flight cannot modify friendly collision damage',()=>{
 const {g,p,queue}=flight([6,5,5,5,1,1,5,1,1],{lethal:true});Object.assign(g.players[2],{x:15,y:7,status:'standing'});g.throwTeamMate(12,7);assert.equal(g.pending,null);assert.equal(g.active,1);assert.equal(queue.length,0);
});
test('Animal Savagery with no standing adjacent team-mate ends distracted without turnover',()=>{
 const {g,a,p,queue}=fixture([1]);grant(a,'Animal Savagery');Object.assign(p,{status:'reserve',x:null,y:null});g.start(a.id);assert.equal(a.distracted,true);assert.equal(g.mover,null);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('Animal Savagery lashes out then resumes the declared Move',()=>{
 const {g,a,p,queue}=fixture([1,1,1]);grant(a,'Animal Savagery');g.start(a.id);assert.equal(p.status,'prone');assert.equal(g.mover,a.id);assert.equal(g.active,0);assert.equal(a.distracted,false);assert.equal(queue.length,0);
});
test('Animal Savagery requires a victim selection when several are adjacent',()=>{
 const {g,a,p,queue}=fixture([1,1,1]);grant(a,'Animal Savagery');Object.assign(g.players[2],{x:10,y:6,status:'standing'});g.start(a.id);assert.equal(g.pending.options.length,2);assert.equal(g.decide('Decline'),false);select(g);assert.equal(p.status,'prone');assert.equal(queue.length,0);
});
test('Animal Savagery forces owned Claws and Mighty Blow armour even when toggled off, never injury',()=>{
 const {g,a,p,queue}=fixture([1,4,4,4,5]);grant(a,'Animal Savagery','Claws','Mighty Blow');a.disabledSkills=['Claws','Mighty Blow'];g.teams[0].positions[p.role].av='12+';g.start(a.id);assert.equal(p.status,'knocked-out');assert.equal(g.mover,a.id);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('a savagery victim saved by Steady Footing keeps the ball and activation continues',()=>{
 const {g,a,p,queue}=fixture([1,6]);grant(a,'Animal Savagery');grant(p,'Steady Footing');g.ball={x:p.x,y:p.y,carrier:p.id};g.start(a.id);g.decide('Use Steady Footing');assert.equal(p.status,'standing');assert.equal(g.ball.carrier,p.id);assert.equal(g.mover,a.id);assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('a savagery carrier knockdown still turns over after Safe Pair of Hands',()=>{
 const {g,a,p,queue}=fixture([1,1,1]);grant(a,'Animal Savagery');grant(p,'Safe Pair of Hands');g.ball={x:p.x,y:p.y,carrier:p.id};g.start(a.id);select(g);assert.equal(g.active,1);assert.equal(g.mover,null);assert.equal(queue.length,0);
});
test('Trickster relocates before Block dice and recomputes the attack',()=>{
 const {g,a,p,d,queue}=fixture([6]);p.status='reserve';p.x=null;p.y=null;g.teams[1].positions[d.role].st=3;grant(d,'Trickster');g.block(a.id,d.id);assert.equal(g.pending.team,1);const old=g.pending;g.decide('Relocate to 10, 7');assert.deepEqual([d.x,d.y],[9,6]);assert.equal(g.pending.type,'blockSelect');assert.equal(old.resolve('Stay'),false);assert.equal(queue.length,0);
});
test('Trickster optional pickup resolves before attack with no opposing team re-roll',()=>{
 const {g,a,p,d,queue}=fixture([6,6]);p.status='reserve';p.x=null;p.y=null;g.teams[1].positions[d.role].st=3;grant(d,'Trickster');g.ball={x:9,y:6,carrier:null};g.block(a.id,d.id);g.decide('Relocate to 10, 7');assert.equal(g.pending.kind,'Trickster pickup');g.decide('Pick up');assert.equal(g.ball.carrier,d.id);assert.equal(g.pending.type,'blockSelect');assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Trickster reacts to a directly targeted special action before its test',()=>{
 const {g,a,d,queue}=fixture([6]);grant(d,'Trickster');g.specialAttack(a,d,'Hypnotic Gaze');assert.equal(queue.length,1);g.decide('Relocate to 10, 7');assert.equal(d.distracted,true);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Hit and Run moves freely after Block and preserves Blitz continuation',()=>{
 const {g,a,d,p,queue}=fixture();grant(a,'Hit and Run');g.mover=a.id;g.action='blitz';a.spent=3;g.blockAction={attacker:a,target:d,blitz:true};g.finishBlock();assert.equal(g.pending.kind,'Hit and Run');g.decide('Move free to 10, 7');assert.deepEqual([a.x,a.y],[9,6]);assert.equal(a.spent,3);assert.equal(g.action,'blitz');assert.equal(g.mover,a.id);assert.equal(g.used(a,'Hit and Run'),true);assert.equal(queue.length,0);
});
test('Hit and Run does not end adjacent to even a prone enemy, matching FFB',()=>{
 const {g,a,d}=fixture();grant(a,'Hit and Run');d.status='prone';g.hitAndRun(a,()=>{});assert.ok(g.pending.options.every(s=>s==='Stay'||!s.includes('12,')));
});
test('Chainsaw foul adds its armour modifier and preserves ordinary foul injury',()=>{
 const {g,a,p,d,queue}=fixture([2,3,4,4,5]);grant(a,'Chainsaw');Object.assign(d,{status:'prone'});p.status='reserve';p.x=null;p.y=null;g.foul(a,d);g.decide('Use Chainsaw');assert.equal(d.status,'casualty');assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('default FFB Chainsaw foul kickback turns over even when armour holds',()=>{
 const {g,a,d,queue}=fixture([1,1,1]);grant(a,'Chainsaw');d.status='prone';g.foul(a,d);g.decide('Use Chainsaw');assert.equal(a.status,'prone');assert.equal(g.active,1);assert.equal(d.status,'prone');assert.equal(queue.length,0);
});
test('Chainsaw foul remains optional and can be declined without a kickback die',()=>{
 const {g,a,p,d,queue}=fixture([1,2]);grant(a,'Chainsaw');d.status='prone';p.status='reserve';p.x=null;p.y=null;g.foul(a,d);g.decide('Foul normally');assert.equal(a.status,'standing');assert.equal(queue.length,0);
});
test('normal FFB foul kickback bypasses Steady Footing and has no Safe Pair placement step',()=>{
 const {g,a,d,queue}=fixture([1,1,1,7]);grant(a,'Chainsaw','Steady Footing','Safe Pair of Hands');g.ball={x:a.x,y:a.y,carrier:a.id};d.status='prone';g.foul(a,d);g.decide('Use Chainsaw');assert.equal(g.pending,null);assert.equal(a.status,'prone');assert.equal(g.active,1);assert.equal(queue.length,0);
});
function dumpFixture(rolls,extra=[]){const f=fixture(rolls);f.p.status='reserve';f.p.x=null;f.p.y=null;f.g.teams[1].positions[f.d.role].st=3;grant(f.d,'Dump-off',...extra);f.g.ball={x:f.d.x,y:f.d.y,carrier:f.d.id};return f;}
test('Dump-off resolves a Quick Pass then restores the interrupted Block exactly once',()=>{
 const {g,a,d,queue}=dumpFixture([6,6,6]);const receiver=g.players[12];Object.assign(receiver,{x:13,y:7,status:'standing'});g.block(a.id,d.id);assert.equal(g.pending.kind,'Dump-off');const old=g.pending;g.decide('Quick pass to 14, 8');
 if(g.pending?.kind?.includes('interception'))g.decide('Decline interception');assert.equal(g.ball.carrier,receiver.id);assert.equal(g.pending.type,'blockSelect');assert.equal(g.active,0);assert.equal(g.dumpContext,null);assert.equal(g.scoreDeferrals,0);assert.equal(old.resolve('Keep the ball'),false);assert.equal(queue.length,0);
});
test('Dump-off fumble bounces but never changes the team turn',()=>{
 const {g,a,d,queue}=dumpFixture([1,7,6]);g.block(a.id,d.id);g.decide('Quick pass to 14, 8');assert.equal(g.active,0);assert.equal(g.pending.type,'blockSelect');assert.equal(g.ball.carrier,null);assert.equal(g.dumpContext,null);assert.equal(queue.length,0);
});
test('Dump-off passing re-rolls exclude opposing team resources and Pro',()=>{
 const {g,a,d,queue}=dumpFixture([1,6,7,6],['Pass','Pro']);g.rerolls=[2,2];g.block(a.id,d.id);g.decide('Quick pass to 14, 8');assert.equal(g.pending.kind,'Pass');assert.deepEqual(g.pending.options,['Pass']);g.decide('Pass');
 if(g.pending?.kind?.includes('interception'))g.decide('Decline interception');assert.equal(g.active,0);assert.deepEqual(g.rerolls,[2,2]);assert.equal(d.proUsed,false);assert.equal(g.pending.type,'blockSelect');assert.equal(queue.length,0);
});
test('declining Dump-off goes straight to Trickster before Block dice',()=>{
 const {g,a,d,queue}=dumpFixture([6],['Trickster']);g.block(a.id,d.id);g.decide('Keep the ball');assert.equal(g.pending.kind,'Trickster');g.decide('Stay');assert.equal(g.pending.type,'blockSelect');assert.equal(g.ball.carrier,d.id);assert.equal(queue.length,0);
});
test('Dump-off does not consume either normal Pass allowance or grant Give and Go',()=>{
 const {g,a,d}=dumpFixture([6,7,6],['Give and Go']);g.passUsed=[true,true];g.block(a.id,d.id);g.decide('Quick pass to 14, 8');if(g.pending?.kind?.includes('interception'))g.decide('Decline interception');assert.deepEqual(g.passUsed,[true,true]);assert.equal(g.action,'block');assert.equal(g.pending.type,'blockSelect');
});
test('Dump-off range cannot be expanded by Hail Mary Pass or selected outside Quick Pass',()=>{
 const {g,a,d}=dumpFixture([],['Hail Mary Pass']);d.hailMary=true;g.block(a.id,d.id);assert.equal(g.decide('Quick pass to 26, 15'),false);assert.equal(g.pending.kind,'Dump-off');assert.ok(g.pending.options.every(s=>s==='Keep the ball'||Number(s.match(/to (\d+)/)[1])<=15));
});
test('Trickster pickup failure bounces and resumes the original attack without turnover',()=>{
 const {g,a,p,d,queue}=fixture([1,7,6]);p.status='reserve';p.x=null;p.y=null;g.teams[1].positions[d.role].st=3;grant(d,'Trickster');g.ball={x:9,y:6,carrier:null};g.block(a.id,d.id);g.decide('Relocate to 10, 7');g.decide('Pick up');assert.equal(g.active,0);assert.equal(g.pending.type,'blockSelect');assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Swoop distance has its own optional re-roll window after direction is accepted',()=>{
 const {g,p,queue}=flight([6,3,6,1,6],{swoop:true});g.rerolls[0]=1;g.throwTeamMate(12,7);g.decide('North');g.decide('Keep 3');assert.equal(g.pending.kind,'Swoop distance');g.decide('Team re-roll');assert.deepEqual([p.x,p.y],[12,6]);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Punt permits movement first, lands on the ground without turnover, and has a separate allowance',()=>{
 const {g,a,p,d,queue}=fixture([3,2,7],'pickup');grant(a,'Punt');g.ball={x:a.x,y:a.y,carrier:a.id};assert.equal(g.start(a.id,'special:Punt'),true);assert.equal(g.step(10,6),true);assert.equal(g.punt(),true);g.decide('North');assert.deepEqual(g.ball,{x:10,y:5,carrier:null});assert.equal(g.active,0);assert.equal(g.mover,null);assert.equal(g.passUsed[0],false);assert.equal(g.puntUsed[0],true);assert.equal(queue.length,0);
});
test('Punt Kick re-rolls direction before distance, each die at most once',()=>{
 const {g,a,queue}=fixture([1,3,6,2,7],'pickup');grant(a,'Punt','Kick');g.ball={x:a.x,y:a.y,carrier:a.id};g.start(a.id,'punt');g.punt();g.decide('North');assert.equal(g.pending.kind,'Punt direction');g.decide('Kick');assert.equal(g.pending.kind,'Punt distance');g.decide('Kick');assert.deepEqual(g.ball,{x:10,y:6,carrier:null});assert.equal(queue.length,0);
});
test('Punt caught by the opposition causes turnover; no interception window is opened',()=>{
 const {g,a,d,queue}=fixture([3,2,6],'pickup');grant(a,'Punt');Object.assign(d,{x:12,y:7});g.ball={x:a.x,y:a.y,carrier:a.id};g.start(a.id,'punt');g.punt();g.decide('East');assert.equal(g.ball.carrier,d.id);assert.equal(g.active,1);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Punt does not offer adjacent Diving Catch at its landing',()=>{
 const {g,a,d,queue}=fixture([3,2,7],'pickup');grant(a,'Punt');Object.assign(d,{x:13,y:7,extraSkills:['Diving Catch']});g.ball={x:a.x,y:a.y,carrier:a.id};g.start(a.id,'punt');g.punt();g.decide('East');assert.equal(g.pending,null);assert.equal(g.ball.carrier,null);assert.equal(queue.length,0);
});
test('a Punt into the crowd forces turnover after its throw-in is resolved',()=>{
 const {g,a,queue}=fixture([3,3,1,1,7],'pickup');grant(a,'Punt');a.x=25;a.y=7;g.ball={x:25,y:7,carrier:a.id};g.start(a.id,'punt');g.punt();g.decide('East');assert.equal(g.active,1);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Chomp blocks voluntary movement, throws, forced pushes, Trickster and Hit and Run',()=>{
 const {g,a,p,d}=fixture([3]);grant(a,'Monstrous Mouth');g.specialAttack(a,d,'Chomp');assert.equal(g.isChomped(d),true);g.active=1;d.used=false;grant(d,'Trickster','Hit and Run','Right Stuff');g.start(d.id);assert.equal(g.plan(12,6),null);let pushed;g.pushPlayer(d,{x:12,y:7},ok=>pushed=ok);assert.equal(pushed,false);let reacted=0;g.trickster(a,d,()=>reacted++);g.hitAndRun(d,()=>reacted++);assert.equal(reacted,2);assert.equal(g.pending,null);
});
test('a Chomp ends permanently when the marker falls, even if it stands again',()=>{
 const {g,a,d,queue}=fixture([3,1,1]);grant(a,'Monstrous Mouth');g.specialAttack(a,d,'Chomp');g.fall(a,{turnover:false});a.status='standing';assert.equal(g.isChomped(d),false);assert.equal(queue.length,0);
});
test('a Chomp ends permanently when the marker moves out of range',()=>{
 const {g,a,d}=fixture([3]);grant(a,'Monstrous Mouth');g.specialAttack(a,d,'Chomp');g.reactionMove(a,{x:8,y:5},()=>{});a.x=10;a.y=7;assert.equal(g.isChomped(d),false);
});
test('multiple Chomp markers keep a victim pinned until every marker is lost',()=>{
 const {g,a,p,d}=fixture();grant(a,'Monstrous Mouth');Object.assign(p,{x:11,y:6});d.chompers=[a.id,p.id];g.placeProne(a,()=>{});assert.equal(g.isChomped(d),true);g.placeProne(p,()=>{});assert.equal(g.isChomped(d),false);
});
test('Hypnotic Gaze breaks Chomp immediately and reactivation cannot revive it',()=>{
 const {g,a,p,d,queue}=fixture([6]);d.chompers=[a.id];g.specialAttack(p,a,'Hypnotic Gaze');a.distracted=false;assert.equal(g.isChomped(d),false);assert.equal(queue.length,0);
});
test('Chomp can replace a Blitz Block and preserve remaining Blitz movement',()=>{
 const {g,a,d,queue}=fixture([3]);grant(a,'Monstrous Mouth');g.startBlitz(a.id,d.id);assert.equal(g.performSpecial(d.id,'Chomp'),true);assert.equal(g.isChomped(d),true);assert.equal(g.action,'blitz');assert.equal(g.mover,a.id);assert.equal(a.spent,1);assert.equal(queue.length,0);
});
test('Swoop direction Pro is owned by the passenger and is not reusable on distance',()=>{
 const {g,p,queue}=flight([6,1,3,3,1,6],{swoop:true});grant(p,'Right Stuff','Swoop','Pro');g.throwTeamMate(12,7);g.decide('North');g.decide('Pro');assert.equal(p.proUsed,true);assert.equal(g.pending,null);assert.deepEqual([p.x,p.y],[12,6]);assert.equal(queue.length,0);
});
test('Pile Driver completes its free foul before prone placement and does not consume normal Foul',()=>{
 const {g,a,d,queue}=fixture([1,1,1,2]);grant(a,'Pile Driver','Quick Foul','Hit and Run');g.blockAction={attacker:a,target:d,blitz:true};g.action='blitz';g.mover=a.id;
 g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});assert.equal(g.pending.kind,'Pile Driver');g.decide('Free foul');assert.equal(a.status,'prone');assert.equal(g.mover,null);assert.equal(g.action,null);assert.equal(g.foulUsed[0],false);assert.equal(g.used(a,'Hit and Run'),false);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Pile Driver free foul resolves referee and Bribe before the attacker becomes prone',()=>{
 const {g,a,d,queue}=fixture([1,1,2,2]);grant(a,'Pile Driver');g.bribes=[1,0];g.blockAction={attacker:a,target:d,blitz:false,targetKnocked:true};d.status='prone';g.finishBlock();g.decide('Free foul');assert.match(g.pending.kind,/Sent-off/);assert.equal(a.status,'standing');g.decide('Argue the Call');g.decide('Use Bribe');assert.equal(a.status,'prone');assert.equal(g.active,0);assert.equal(g.bribes[0],0);assert.equal(queue.length,0);
});
test('Pile Driver carrier can place its ball but the own-skill drop still causes turnover in FFB',()=>{
 const {g,a,d,queue}=fixture([1,2]);grant(a,'Pile Driver','Safe Pair of Hands');g.ball={x:a.x,y:a.y,carrier:a.id};g.blockAction={attacker:a,target:d,blitz:false,targetKnocked:true};d.status='prone';g.finishBlock();g.decide('Free foul');assert.equal(g.pending.kind,'Safe Pair of Hands');select(g);assert.equal(a.status,'prone');assert.equal(g.active,1);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('a prevented target knockdown cannot trigger Pile Driver',()=>{
 const {g,a,d,queue}=fixture([6]);grant(a,'Pile Driver');grant(d,'Steady Footing');g.blockAction={attacker:a,target:d,blitz:false};g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Steady Footing');assert.equal(d.status,'standing');assert.equal(g.pending,null);assert.equal(g.blockAction,null);assert.equal(queue.length,0);
});
test('declining Pile Driver preserves the following Hit and Run decision',()=>{
 const {g,a,d}=fixture();grant(a,'Pile Driver','Hit and Run');g.blockAction={attacker:a,target:d,blitz:true,targetKnocked:true};d.status='prone';g.finishBlock();g.decide('Finish Block');assert.equal(g.pending.kind,'Hit and Run');g.decide('Stay');assert.equal(g.blockAction,null);
});
test('On the Ball moves up to three squares before passing and preserves prior activation state',()=>{
 const {g,a,p,d,queue}=fixture([6,6],'pass');grant(d,'On the Ball');d.used=true;d.spent=4;g.start(a.id,'pass');g.pass(14,7);assert.equal(g.pending.kind,'On the Ball');assert.equal(queue.length,2);select(g);const old=g.pending;assert.equal(g.endTurn(),false);g.decide('Move to 12, 7');g.decide('Move to 12, 6');g.decide('Move to 12, 5');assert.equal(d.y,4);assert.equal(d.used,true);assert.equal(d.spent,4);assert.equal(g.ball.carrier,p.id);assert.equal(g.active,0);assert.equal(g.moveContext,null);assert.equal(old.resolve('Stop moving'),false);assert.equal(queue.length,0);
});
test('an On the Ball fall stops remaining reactors, resumes the pass and causes no turnover',()=>{
 const {g,a,p,d,queue}=fixture([1,1,1,6,6],'pass');grant(d,'On the Ball');d.x=9;d.disabledSkills=['Dodge'];const other=g.players[12];Object.assign(other,{x:20,y:7,status:'standing',extraSkills:['On the Ball']});g.start(a.id,'pass');g.pass(14,7);select(g);g.decide('Move to 10, 7');assert.equal(d.status,'prone');assert.equal(other.x,20);assert.equal(g.ball.carrier,p.id);assert.equal(g.active,0);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Steady Footing may save an On the Ball fall; Pro and team pools remain unavailable',()=>{
 const {g,a,p,d,queue}=fixture([1,6,6,6],'pass');grant(d,'On the Ball','Steady Footing','Pro');d.x=9;d.disabledSkills=['Dodge'];g.rerolls=[2,2];g.start(a.id,'pass');g.pass(14,7);select(g);g.decide('Move to 10, 7');assert.equal(g.pending.kind,'Steady Footing');g.decide('Use Steady Footing');assert.equal(g.pending.kind,'On the Ball movement');g.decide('Stop moving');assert.equal(d.status,'standing');assert.equal(g.ball.carrier,p.id);assert.deepEqual(g.rerolls,[2,2]);assert.equal(d.proUsed,false);assert.equal(queue.length,0);
});
test('On the Ball recalculates passing modifiers after defensive movement',()=>{
 const {g,a,d}=fixture([],'pass');grant(d,'On the Ball');let target;const before=g.passPreview;g.start(a.id,'pass');const original=g.passPreview(14,7).target;g.resolvePass=(p,x,y,preview)=>target=preview.target;g.pass(14,7);select(g);g.decide('Move to 11, 8');g.decide('Move to 10, 8');g.decide('Stop moving');assert.equal(target,original+1);
});
test('On the Ball gives three non-Rush squares even with a lower MA',()=>{
 const {g,a,d,queue}=fixture([6,6],'pass');d.x=20;g.teams[1].positions[d.role].ma=1;grant(d,'On the Ball');g.start(a.id,'pass');g.pass(14,7);select(g);g.decide('Move to 21, 7');g.decide('Move to 21, 6');g.decide('Move to 21, 5');assert.equal(d.y,4);assert.equal(queue.length,0);assert.equal(g.events.some(e=>e.startsWith('Rush #')),false);
});
test('On the Ball can resolve several defenders separately in one pass',()=>{
 const {g,a,d,queue}=fixture([6,6],'pass');grant(d,'On the Ball');const other=g.players[12];Object.assign(other,{x:20,y:7,status:'standing',extraSkills:['On the Ball']});g.start(a.id,'pass');g.pass(14,7);select(g);g.decide('Move to 12, 7');g.decide('Stop moving');assert.equal(g.pending.kind,'On the Ball');assert.equal(g.pending.options.length,2);select(g);g.decide('Move to 21, 7');g.decide('Stop moving');assert.equal(other.y,6);assert.equal(g.moveContext,null);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('On the Ball nested inside Dump-off excludes the interrupted attacker and allows active team re-rolls',()=>{
 const {g,a,p,d,queue}=dumpFixture([6,6,6]);grant(a,'On the Ball');Object.assign(p,{x:9,y:7,status:'standing',extraSkills:['On the Ball','Pro'],used:true,spent:5});const receiver=g.players[12];Object.assign(receiver,{x:13,y:7,status:'standing'});g.rerolls[0]=1;g.block(a.id,d.id);g.decide('Quick pass to 14, 8');assert.equal(g.pending.kind,'On the Ball');assert.equal(g.pending.options.length,2);select(g);assert.equal(g.canTeamReroll(p),true);assert.equal(g.options(p,'Dodge').includes('Pro'),false);g.decide('Move to 10, 7');g.decide('Stop moving');assert.equal(g.pending.type,'blockSelect');assert.equal(p.used,true);assert.equal(p.spent,5);assert.equal(g.dumpContext,null);assert.equal(g.moveContext,null);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
function onBallKick(rolls,{marked=false}={}){
 const queue=[...rolls],g=new MatchGame(structuredClone(teams),{learning:true,dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);return queue.shift();}});g.phase='kickAim';g.kicking=1;g.receiving=0;g.active=1;g.kickTouchback=false;const a=g.players[0],d=g.players[11];Object.assign(a,{x:10,y:7,status:'standing',extraSkills:['On the Ball']});Object.assign(d,{x:marked?11:20,y:7,status:'standing'});g.kicker=d.id;return {g,a,d,queue};
}
test('kickoff On the Ball runs after deviation and before the kickoff event or catch',()=>{
 const {g,a,queue}=onBallKick([1,5,7]);g.kick(9,7);assert.equal(g.pending.kind,'On the Ball');assert.equal(queue.length,1);select(g);assert.ok(g.pending.options.every(option=>option==='Stop moving'||Number(option.match(/to (\d+)/)[1])<=13));g.decide('Move to 10, 8');g.decide('Stop moving');assert.deepEqual([a.x,a.y],[9,7]);assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(a.used,false);assert.equal(a.spent,0);assert.equal(queue.length,0);
});
test('a kickoff touchback skips On the Ball and only one Open receiver may react',()=>{
 const {g,queue}=onBallKick([6,5]);g.kick(12,7);assert.equal(g.phase,'touchback');assert.ok(!g.pending.kind.includes('On the Ball'));assert.equal(queue.length,0);
 const h=onBallKick([1,5,6],{marked:true});h.g.kick(9,7);assert.equal(h.g.phase,'play');assert.equal(h.g.pending,null);assert.equal(h.queue.length,0);
});
test('match turn boundaries reset opposing Dodge use before an On the Ball reaction',()=>{
 const {g,a,d}=onBallKick([]);d.dodgeUsed=true;d.proUsed=true;g.resetTeam(0);assert.equal(d.dodgeUsed,false);assert.equal(d.proUsed,false);
});
function matchFixture(rolls){
 const queue=[...rolls],g=new MatchGame(structuredClone(teams),{dice:s=>{assert.ok(queue.length,`Unexpected D${s}`);return queue.shift();}});g.phase='play';g.active=0;g.turns=[1,0];g.rerolls=[0,0];const a=g.players[0],d=g.players[11];Object.assign(a,{x:10,y:7,status:'standing'});Object.assign(d,{x:11,y:7,status:'standing'});g.teams[1].positions[d.role].st=3;return {g,a,d,queue};
}
test('Dump-off fumble inside a real match resumes Block without advancing either turn marker',()=>{
 const {g,a,d,queue}=matchFixture([1,7,6]);grant(d,'Dump-off');g.ball={x:11,y:7,carrier:d.id};g.block(a.id,d.id);g.decide('Quick pass to 14, 8');assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(g.active,0);assert.equal(g.pending.type,'blockSelect');assert.equal(queue.length,0);
});
test('Trickster carrier entering an end zone scores only after the Block fully resolves',()=>{
 const {g,a,d,queue}=matchFixture([3]);a.x=1;d.x=2;grant(d,'Trickster','Stand Firm');g.ball={x:d.x,y:d.y,carrier:d.id};g.block(a.id,d.id);g.decide('Relocate to 1, 7');assert.deepEqual(g.scores,[0,0]);assert.equal(g.pending.type,'blockSelect');g.selectBlockDie(0);g.decide('Stand Firm');assert.deepEqual(g.scores,[0,1]);assert.equal(g.phase,'endDrive');assert.equal(queue.length,0);
});
test('On the Ball falls in a real match resume the pass without turnover or stuck context',()=>{
 const {g,a,d,queue}=matchFixture([1,1,1,6,6]);a.x=8;d.x=9;grant(d,'On the Ball');d.disabledSkills=['Dodge'];const receiver=g.players[1];Object.assign(receiver,{x:14,y:7,status:'standing'});g.ball={x:8,y:7,carrier:a.id};g.start(a.id,'pass');g.pass(14,7);select(g);g.decide('Move to 10, 7');assert.equal(d.status,'prone');assert.equal(g.phase,'play');assert.deepEqual(g.turns,[1,0]);assert.equal(g.active,0);assert.equal(g.ball.carrier,receiver.id);assert.equal(g.moveContext,null);assert.equal(g.pending,null);assert.equal(queue.length,0);
});
function sabotage(rolls,{attacker=false,both=false}={}){
 const f=fixture(rolls),{g,a,d}=f;grant(attacker?a:d,'Saboteur','Secret Weapon');if(both)grant(d,'Saboteur','Secret Weapon');g.mover=a.id;g.action='block';g.blockAction={attacker:a,target:d,blitz:false};return f;
}
test('Saboteur KO bypasses armour and resolves collateral knockdown without a non-carrier turnover',()=>{
 const {g,a,d,queue}=sabotage([4,1,1]);g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});const old=g.pending;assert.equal(old.kind,'Saboteur');g.decide('Use Saboteur');assert.equal(d.status,'knocked-out');assert.equal(a.status,'prone');assert.equal(g.active,0);assert.equal(g.blockAction,null);assert.equal(g.scoreDeferrals,0);assert.equal(old.resolve('Use Saboteur'),false);assert.equal(queue.length,0);
});
test('failed Saboteur attempts the original armour once without its own re-roll window',()=>{
 const {g,a,d,queue}=sabotage([3,1,1]);grant(d,'Saboteur','Secret Weapon','Pro');g.rerolls=[2,2];g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(d.status,'prone');assert.equal(a.status,'standing');assert.equal(g.pending,null);assert.deepEqual(g.rerolls,[2,2]);assert.equal(d.proUsed,false);assert.equal(queue.length,0);
});
test('declining Saboteur reaches Steady Footing instead of forcing a KO',()=>{
 const {g,a,d,queue}=sabotage([6]);grant(d,'Saboteur','Secret Weapon','Steady Footing');g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Fall normally');assert.equal(g.pending.kind,'Steady Footing');g.decide('Use Steady Footing');assert.equal(d.status,'standing');assert.equal(g.pending,null);assert.equal(queue.length,0);
});
test('Saboteur collateral carrier knockdown causes turnover only after both players resolve',()=>{
 const {g,a,d,queue}=sabotage([6,1,1,7]);g.ball={x:a.x,y:a.y,carrier:a.id};g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(d.status,'knocked-out');assert.equal(a.status,'prone');assert.equal(g.active,1);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Steady Footing saves a collateral carrier without cancelling or repeating the Saboteur KO',()=>{
 const {g,a,d,queue}=sabotage([6,6]);grant(a,'Steady Footing');g.ball={x:a.x,y:a.y,carrier:a.id};g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');g.decide('Use Steady Footing');assert.equal(d.status,'knocked-out');assert.equal(a.status,'standing');assert.equal(g.ball.carrier,a.id);assert.equal(g.active,0);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Both Down Saboteur does not roll collateral armour a second time from the original down list',()=>{
 const {g,a,d,queue}=sabotage([6,1,1],{attacker:true});g.resolveBlockDowns([{p:a,by:d},{p:d,by:a}]);g.decide('Use Saboteur');assert.equal(a.status,'knocked-out');assert.equal(d.status,'prone');assert.equal(g.active,0);assert.equal(g.pending,null);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('two Saboteurs can both explode in one Both Down and finish each victim once',()=>{
 const {g,a,d,queue}=sabotage([6,6],{attacker:true,both:true});g.resolveBlockDowns([{p:a,by:d},{p:d,by:a}]);g.decide('Use Saboteur');assert.equal(g.pending.kind,'Saboteur');g.decide('Use Saboteur');assert.equal(a.status,'knocked-out');assert.equal(d.status,'knocked-out');assert.equal(g.active,0);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Saboteur carrier may place the ball before its automatic KO',()=>{
 const {g,a,d,queue}=sabotage([6,1,1]);grant(d,'Saboteur','Secret Weapon','Safe Pair of Hands');g.ball={x:d.x,y:d.y,carrier:d.id};g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(g.pending.kind,'Safe Pair of Hands');select(g);assert.equal(d.status,'knocked-out');assert.equal(g.ball.carrier,null);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('Saboteur does not react to movement falls or friendly Animal Savagery',()=>{
 const {g,a,d,queue}=sabotage([1,1]);g.fall(d,{turnover:false,after:()=>{}});assert.equal(g.pending,null);assert.equal(d.status,'prone');assert.equal(queue.length,0);
});
test('triggered Saboteur uses standard collateral armour with no Chainsaw bonus',()=>{
 const {g,a,d,queue}=sabotage([6,3,4]);grant(a,'Chainsaw');g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(a.status,'prone');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('FFB collateral Saboteur damage does not collect the Stunty injury modifier',()=>{
 const {g,a,d,queue}=sabotage([6,6,6,4,5]);grant(a,'Stunty');g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(a.status,'knocked-out');assert.equal(g.active,0);assert.equal(queue.length,0);
});
test('an attacker-triggered Saboteur carrier drop still turns over and skips Safe Pair placement',()=>{
 const {g,a,d,queue}=sabotage([6,7,1,1],{attacker:true});grant(a,'Saboteur','Secret Weapon','Safe Pair of Hands');g.ball={x:a.x,y:a.y,carrier:a.id};g.applyBlockResult('Player Down');g.decide('Use Saboteur');assert.equal(a.status,'knocked-out');assert.equal(d.status,'prone');assert.equal(g.pending,null);assert.equal(g.active,1);assert.equal(g.scoreDeferrals,0);assert.equal(queue.length,0);
});
test('laboratory enforces Saboteur and Lethal Flight prerequisites and symmetric Hit and Run conflicts',()=>{
 const {g,a}=fixture([],'skills');assert.equal(g.addSkill(a.id,'Saboteur'),false);assert.equal(g.addSkill(a.id,'Secret Weapon'),true);assert.equal(g.addSkill(a.id,'Saboteur'),true);assert.equal(g.addSkill(a.id,'Lethal Flight'),false);assert.equal(g.addSkill(a.id,'Right Stuff'),true);assert.equal(g.addSkill(a.id,'Lethal Flight'),true);assert.equal(g.addSkill(a.id,'Frenzy'),true);assert.equal(g.addSkill(a.id,'Hit and Run'),false);
});
test('a Saboteur blast ends a downed Blitz attacker activation without incorrectly ending its team turn',()=>{
 const {g,a,p,d,queue}=sabotage([6,1,1]);g.blockAction.blitz=true;g.action='blitz';g.fall(d,{turnover:false,mightyBlowBy:a,after:()=>g.finishBlock()});g.decide('Use Saboteur');assert.equal(a.status,'prone');assert.equal(g.active,0);assert.equal(g.mover,null);assert.equal(g.action,null);assert.equal(g.canStart(p),true);assert.equal(queue.length,0);
});
