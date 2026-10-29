// Scenarios translated from the BB2025 FFB source paths recorded in docs/FFB-AUDIT.md.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],scenario='pickup',Class=SkillGame){
 const queue=[...rolls];let calls=0;
 const g=new Class(structuredClone(teams),{scenario,dice:s=>{calls++;assert.ok(queue.length,`Unexpected D${s}`);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});
 g.rerolls=[0,0];return {g,queue,calls:()=>calls};
}
const grant=(p,...skills)=>p.extraSkills=[...(p.extraSkills||[]),...skills];
function choose(g,option){assert.ok(g.pending,`Missing choice: ${option}`);assert.equal(g.decide(option),true);}
function thrower(rolls){const f=fixture(rolls),{g}=f,a=g.players[0],p=g.players[1];grant(a,'Throw Team-mate');grant(p,'Right Stuff');Object.assign(p,{x:9,y:7});assert.ok(g.start(a.id,'throw-team-mate'));assert.ok(g.selectThrowMate(p.id));return {...f,a,p};}
function fouler(rolls){const f=fixture(rolls,'dodge'),{g}=f,a=g.players[0],d=g.players[11];g.players[1].x=1;d.status='prone';assert.ok(g.start(a.id,'foul'));return {...f,a,d};}
function stall(rolls,turn=1){const f=fixture(rolls,'teams',MatchGame),{g}=f;g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));const p=g.players[0];Object.assign(p,{x:23,y:7,status:'standing'});g.phase='play';g.active=0;g.turns=[turn,0];g.ball={x:23,y:7,carrier:p.id};return {...f,p};}

test('FFB permits multiple team re-rolls in one turn, on different dice',()=>{
 const {g,queue}=fixture([1,2,1,2]),p=g.players[0];g.rerolls[0]=2;g.start(p.id);let success=0;
 for(let i=0;i<2;i++){g.test(p,'Rush',2,()=>success++,()=>{});choose(g,'Team');}
 assert.equal(success,2);assert.equal(g.active,0);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Pro is not renewed by a different skill re-roll or a second failed test',()=>{
 const {g}=fixture([1,3,2,1,2,1]),p=g.players[0];grant(p,'Pro','Sure Feet');g.start(p.id);
 g.test(p,'Rush',2,()=>{},()=>{});choose(g,'Pro');assert.equal(p.proUsed,true);
 g.test(p,'Rush',2,()=>{},()=>{});assert.ok(!g.pending.options.includes('Pro'));choose(g,'Sure Feet');
 g.test(p,'Rush',2,()=>{},()=>{});assert.equal(g.pending,null);assert.equal(p.proUsed,true);
 g.finish();g.endTurn();g.endTurn();g.start(p.id);assert.ok(g.options(p,'Rush').includes('Pro'));
});
test('a failed Pro check can spend a team re-roll on Pro before re-rolling the original die',()=>{
 const {g,queue}=fixture([1,1,3,6]),p=g.players[0];grant(p,'Pro');g.rerolls[0]=1;g.start(p.id);let passed=false;
 g.test(p,'Rush',2,()=>passed=true,()=>{});choose(g,'Pro');assert.equal(g.pending.kind,'Pro');assert.equal(g.rerolls[0],1);
 choose(g,'Team re-roll Pro');assert.equal(passed,true);assert.equal(p.proUsed,true);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Loner failing the team re-roll of Pro spends it without rolling Pro or the original die again',()=>{
 const {g,queue}=fixture([1,1,2]),p=g.players[0];grant(p,'Pro','Loner (4+)');g.rerolls[0]=1;g.start(p.id);let failures=0;
 g.test(p,'Rush',2,()=>{},()=>failures++);choose(g,'Pro');choose(g,'Team re-roll Pro');assert.equal(failures,1);assert.equal(g.rerolls[0],0);assert.equal(queue.length,0);
});
test('Block Pro fallback keeps the original dice until the coach selects one to re-roll',()=>{
 const {g,queue}=fixture([1,1,1,3,6],'block'),a=g.players[15];grant(a,'Pro');g.rerolls[1]=1;g.block(a.id,g.players[5].id);
 const before=[...g.blockAction.dice];assert.ok(g.rerollBlock('Pro'));assert.equal(g.pending.kind,'Pro');choose(g,'Team re-roll Pro');
 assert.deepEqual(g.blockAction.dice,before);assert.equal(g.pending.type,'blockProChoose');g.rerollBlockDie(0);assert.equal(g.blockAction.dice[0],6);assert.equal(queue.length,0);
});
test('block dice cannot be re-rolled after selecting a result and cannot consume Leader during a push choice',()=>{
 const {g}=fixture([3,3],'block'),a=g.players[15],d=g.players[5];grant(a,'Leader');g.grantLeader(1);d.disabledSkills=['Stand Firm'];g.block(a.id,d.id);g.selectBlockDie(0);
 assert.equal(g.pending.kind,'Push back');assert.equal(g.rerollBlock('Team'),false);assert.equal(g.leaderPool[1],true);assert.equal(g.rerolls[1],0);
});
test('Break Tackle waits for the coach and can be declined without consuming the skill',()=>{
 const {g}=fixture([2,1,2],'dodge'),p=g.players[0];grant(p,'Break Tackle');g.start(p.id);g.step(9,6);
 assert.equal(g.pending.kind,'Dodge');assert.equal(p.status,'standing');assert.equal(g.used(p,'Break Tackle'),false);
 choose(g,'Accept');assert.equal(p.status,'prone');assert.equal(g.used(p,'Break Tackle'),false);assert.equal(g.active,1);
});
test('Break Tackle can rescue a re-rolled dodge without offering a second re-roll',()=>{
 const {g}=fixture([1,2],'dodge'),p=g.players[0];grant(p,'Break Tackle');g.rerolls[0]=2;g.start(p.id);g.step(9,6);choose(g,'Team');
 assert.deepEqual(g.pending.options,['Break Tackle']);choose(g,'Break Tackle');assert.equal(p.status,'standing');assert.equal(g.rerolls[0],1);assert.equal(g.used(p,'Break Tackle'),true);assert.equal(g.pending,null);
});
test('a naturally successful re-rolled dodge does not consume Break Tackle',()=>{
 const {g}=fixture([2,6],'dodge'),p=g.players[0];grant(p,'Break Tackle');g.rerolls[0]=1;g.start(p.id);g.step(9,6);choose(g,'Team');assert.equal(g.used(p,'Break Tackle'),false);assert.equal(p.status,'standing');
});
test('Strong Arm improves throw accuracy and can be disabled',()=>{
 const {g,a,p}=thrower([3,5,5,5,4]);const before=g.throwPreview(12,7).target;grant(a,'Strong Arm');assert.equal(g.throwPreview(12,7).target,before-1);
 g.toggleSkill(a.id,'Strong Arm');assert.equal(g.throwPreview(12,7).target,before);g.toggleSkill(a.id,'Strong Arm');g.throwTeamMate(12,7);
 assert.ok(g.events.includes('Superb Throw.'));assert.equal(p.status,'standing');
});
test('Strong Arm never converts a natural one into a successful throw',()=>{
 const {g,a}=thrower([1,2,6]);grant(a,'Strong Arm');g.throwTeamMate(12,7);assert.ok(g.events.some(e=>e.startsWith('Fumbled Throw')));
});
test('Bullseye superb throw offers a choice then lands on the target without three scatter dice',()=>{
 const {g,a,p,queue}=thrower([6,4]);grant(a,'Bullseye');g.throwTeamMate(12,7);assert.equal(g.pending.kind,'Bullseye');assert.equal(g.start(g.players[2].id),false);
 choose(g,'Use Bullseye');assert.deepEqual([p.x,p.y],[12,7]);assert.equal(p.status,'standing');assert.equal(queue.length,0);assert.equal(g.events.some(e=>e.startsWith('Thrown player scatter:')),false);
});
test('Bullseye can be declined, and subpar throws do not offer it',()=>{
 const first=thrower([6,5,5,5,4]);grant(first.a,'Bullseye');first.g.throwTeamMate(12,7);choose(first.g,'Scatter normally');assert.equal(first.p.x,15);
 const second=thrower([2,5,5,5,6]);grant(second.a,'Bullseye');second.g.throwTeamMate(12,7);assert.equal(second.p.x,15);assert.equal(second.g.pending,null);
});
test('Bullseye uses the existing collision sequence rather than bypassing an occupied target',()=>{
 const {g,a,p}=thrower([6,1,2,5,1,2]);grant(a,'Bullseye');const victim=g.players[11];Object.assign(victim,{x:12,y:7,status:'standing'});
 g.throwTeamMate(12,7);choose(g,'Use Bullseye');assert.equal(victim.status,'prone');assert.equal(p.status,'prone');assert.equal(p.x,13);
});
test('Strong Arm and Bullseye require Throw Team-mate when added in the laboratory',()=>{
 const {g}=fixture([],'skills'),p=g.players[0];assert.equal(g.addSkill(p.id,'Strong Arm'),false);assert.equal(g.addSkill(p.id,'Bullseye'),false);
 assert.equal(g.addSkill(p.id,'Throw Team-mate'),true);assert.equal(g.addSkill(p.id,'Strong Arm'),true);assert.equal(g.addSkill(p.id,'Bullseye'),true);
});
test('Iron Hard Skin blocks Mighty Blow armour changes but leaves the injury choice available',()=>{
 const {g}=fixture([6,4,4,5,1,1]),a=g.players[0],d=g.players[11];grant(a,'Mighty Blow');grant(d,'Iron Hard Skin');g.fall(d,{turnover:false,mightyBlowBy:a});
 assert.equal(g.pending.kind,'Mighty Blow');assert.ok(g.pending.options.includes('Add +1 to Injury'));choose(g,'Add +1 to Injury');assert.equal(d.status,'casualty');
});
test('Iron Hard Skin armour that holds never offers Mighty Blow on armour',()=>{
 const {g}=fixture([3,4]),a=g.players[0],d=g.players[11];grant(a,'Mighty Blow');grant(d,'Iron Hard Skin');g.fall(d,{turnover:false,mightyBlowBy:a});assert.equal(d.status,'prone');assert.equal(g.pending,null);
});
test('Dirty Player can modify foul injury against Iron Hard Skin',()=>{
 const {g,a,d}=fouler([6,4,4,5,1,1]);grant(a,'Dirty Player');grant(d,'Iron Hard Skin');g.performSpecial(d.id);assert.equal(g.pending.kind,'Dirty Player');choose(g,'Add +1 to Injury');assert.equal(d.status,'casualty');
});
test('Lone Fouler offers a broken-armour double before rolling injury and can erase the send-off',()=>{
 const {g,a,d,queue}=fouler([6,6,6,4,1,2]);grant(a,'Lone Fouler');g.performSpecial(d.id);
 assert.equal(g.pending.kind,'Lone Fouler');assert.equal(queue.length,4);choose(g,'Re-roll Armour');assert.equal(d.status,'stunned');assert.equal(g.pending,null);assert.notEqual(a.status,'sent-off');
});
test('keeping Lone Fouler armour doubles continues injury and then offers send-off decisions',()=>{
 const {g,a,d}=fouler([6,6,1,2]);grant(a,'Lone Fouler');g.performSpecial(d.id);choose(g,'Keep result');assert.equal(d.status,'stunned');assert.match(g.pending.kind,/Sent-off/);
});
test('Lone Fouler does not open a second re-roll window on re-rolled armour doubles',()=>{
 const {g,a,d}=fouler([1,2,6,6,1,2]);grant(a,'Lone Fouler');g.performSpecial(d.id);choose(g,'Re-roll Armour');assert.match(g.pending.kind,/Sent-off/);
});
test('Argue the Call one bans the coach and forbids a Bribe for that send-off',()=>{
 const {g}=fixture([1]),p=g.players[0];g.bribes=[1,0];let result;g.sendOff(p,value=>result=value);choose(g,'Argue the Call');assert.equal(p.status,'sent-off');assert.equal(g.argueBanned[0],true);assert.equal(g.bribes[0],1);assert.equal(result,true);
});
test('other failed Argue the Call results still permit a Bribe',()=>{
 const {g}=fixture([2,2]),p=g.players[0];g.bribes=[1,0];let result;g.sendOff(p,value=>result=value);choose(g,'Argue the Call');choose(g,'Use Bribe');assert.equal(p.status,'standing');assert.equal(g.bribes[0],0);assert.equal(result,false);
});
test('a failed Bribe permits spending another Bribe without another Argue the Call roll',()=>{
 const {g,queue}=fixture([1,2]),p=g.players[0];g.bribes=[2,0];let result;g.sendOff(p,value=>result=value);choose(g,'Accept send-off');choose(g,'Use Bribe');assert.equal(g.pending.kind,'Bribe');choose(g,'Use Bribe');assert.equal(g.bribes[0],0);assert.equal(result,false);assert.equal(queue.length,0);
});
test('ending the turn checks an unactivated stalling carrier once and then advances only one turn',()=>{
 const {g,p,queue}=stall([1,1,2,2]);assert.ok(g.endTurn());assert.equal(g.active,1);assert.equal(p.status,'prone');assert.equal(g.ball.carrier,null);assert.deepEqual(g.turns,[1,1]);assert.equal(queue.length,0);
});
test('an unactivated carrier who escapes the crowd still ends the turn without a second check',()=>{
 const {g,queue}=stall([1],2);g.endTurn();assert.equal(g.active,1);assert.equal(g.ball.carrier,g.players[0].id);assert.equal(queue.length,0);
});
test('turn seven and eight stalling consume no crowd dice',()=>{
 for(const turn of [7,8]){const {g,p,calls}=stall([],turn);g.start(p.id);g.finish();assert.equal(calls(),0);assert.equal(p.status,'standing');g.endTurn();assert.equal(calls(),0);}
});
test('FFB activation-roll traits and distraction exclude a player from stalling',()=>{
 for(const skill of ['Bone Head','Really Stupid','Unchannelled Fury','Animal Savagery','Take Root']){const {g,p}=stall([]);grant(p,skill);assert.equal(g.canScoreWithoutDice(p),false);}
 const {g,p}=stall([]);p.distracted=true;assert.equal(g.canScoreWithoutDice(p),false);
});
test('Brilliant Coaching drive re-rolls are consumed before Leader, including Pro fallback',()=>{
 const {g,p}=stall([1,1,3,6]);p.x=5;g.ball.carrier=null;g.rerolls[0]=1;g.driveBonus[0]=1;grant(p,'Leader','Pro');g.grantLeader(1);g.start(p.id);
 g.test(p,'Rush',2,()=>{},()=>{});choose(g,'Pro');choose(g,'Team re-roll Pro');assert.equal(g.driveBonus[0],0);assert.equal(g.leaderPool[0],true);assert.equal(g.rerolls[0],0);
});
test('Lone Fouler notices a separate unactivated stalling carrier before injury',()=>{
 const {g,p,queue}=stall([6,4]);const a=g.players[1],d=g.players[11];Object.assign(a,{x:10,y:7,status:'standing'});Object.assign(d,{x:11,y:7,status:'prone'});grant(a,'Lone Fouler');g.start(a.id,'foul');g.performSpecial(d.id);assert.equal(g.pending.kind,'Lone Fouler');assert.equal(p.used,false);assert.equal(queue.length,0);
});
