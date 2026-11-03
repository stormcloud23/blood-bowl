const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame}=require('../../src/engine/match.cjs');
const {ComputerCoach}=require('../../src/features/computer/computer.cjs');
const rosters=require('../../src/data/rosters.json');
function board(){
 const human=rosters.find(t=>t.id==='human'),g=new MatchGame([human,human],{dice:()=>6});g.phase='play';g.active=0;g.turns=[1,1];g.individualBlockChoices=true;g.ball={x:null,y:null,carrier:null};
 g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve',used:false,role:0,extraSkills:[]}));return {g,coach:new ComputerCoach(0)};
}
function field(g,team,index,x,y,changes={}){
 const p=g.players.filter(p=>p.team===team)[index];Object.assign(p,{x,y,status:'standing'});p.profileOverride={name:'Fixture',cost:50000,ma:3,st:3,ag:'3+',pa:'3+',av:'9+',skills:[],traits:'Lineman, Human',...changes};return p;
}
test('role awareness reads roster tags rather than player names or team identity',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{name:'Blitzer',traits:'Lineman, Human'});assert.equal(coach.roles(g,p).blitzer,false);
 p.profileOverride.traits='Blitzer, Thrower, Runner, Human';assert.equal(coach.roles(g,p).blitzer,true);assert.equal(coach.roles(g,p).thrower,true);assert.equal(coach.roles(g,p).runner,true);
});
test('an equally reliable tagged blitzer wins a blitz assignment over a generic player',()=>{
 const {g,coach}=board(),ordinary=field(g,0,0,8,3,{st:4,skills:['Block']}),blitzer=field(g,0,1,8,11,{st:4,skills:['Block'],traits:'Blitzer, Human'});field(g,1,0,11,3);field(g,1,1,11,11);
 const action=coach.chooseAction(g);assert.equal(action.kind,'blitz');assert.equal(action.p,blitzer);assert.equal(ordinary.used,false);
});
test('a role label cannot turn an uphill weak attack into a preferred Blitz',()=>{
 const {g,coach}=board(),skilled=field(g,0,0,8,3,{st:4,skills:['Block']});field(g,1,0,11,3);field(g,0,1,8,11,{traits:'Blitzer, Human'});field(g,1,1,9,11,{st:4});
 const action=coach.chooseAction(g);assert.equal(action.kind,'blitz');assert.equal(action.p,skilled);
});
test('a tagged blocker wins an otherwise equal adjacent blocking assignment',()=>{
 const {g,coach}=board();field(g,0,0,8,3,{st:4,skills:['Block']});const blocker=field(g,0,1,8,11,{st:4,skills:['Block'],traits:'Blocker, Human'});field(g,1,0,9,3);field(g,1,1,9,11);
 const action=coach.chooseAction(g);assert.equal(action.kind,'block');assert.equal(action.p,blocker);
});
test('Horns and Juggernaut change actual Blitz strength and safety forecasts',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{skills:['Horns','Juggernaut']}),d=field(g,1,0,9,7),plain=coach.blockOdds(g,p,d,p),blitz=coach.blockOdds(g,p,d,p,true);
 assert.equal(plain.count,1);assert.equal(blitz.count,2);assert.ok(blitz.failure<plain.failure);assert.equal(g.profile(p).st,3);assert.equal(p.hornsBonus||0,0);assert.ok(g.startBlitz(p.id,d.id));assert.ok(g.blitzBlock());assert.equal(g.blockAction.count,blitz.count);assert.equal(g.blockAction.aStrength,4);
});
test('Tackle and Wrestle receive target-specific value against slippery ball carriers',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{skills:['Wrestle']}),d=field(g,1,0,9,7,{skills:['Block','Dodge']});g.ball={x:d.x,y:d.y,carrier:d.id};
 const without=coach.blockOdds(g,p,d);p.extraSkills=['Tackle'];const withTackle=coach.blockOdds(g,p,d);assert.ok(withTackle.knockdown>without.knockdown);assert.equal(coach.blockValue(g,{attacker:p,target:d},'Both Down'),8);
});
test('a strong blocker values useful single-opponent contact more than a generic player',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{st:4,skills:['Block']}),d=field(g,1,0,11,7),n={x:10,y:7,path:[],risk:0,spent:2};
 const ordinary=coach.positionValue(g,p,n,coach.positionContext(g,p));p.profileOverride.traits='Blocker, Human';assert.ok(coach.positionValue(g,p,n,coach.positionContext(g,p))>ordinary);
 d.profileOverride.st=6;assert.ok(coach.blockingPosition(g,p,n,coach.positionContext(g,p))<=0);
});
test('Guard values joining an ally block, without giving disabled skills a bonus',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{skills:['Guard']}),n={x:10,y:7,path:[],risk:0};field(g,1,0,11,7);field(g,0,1,12,7);
 const support=coach.blockingPosition(g,p,n,coach.positionContext(g,p));p.disabledSkills=['Guard'];assert.ok(support>coach.blockingPosition(g,p,n,coach.positionContext(g,p)));
});
test('Dodge lowers the movement penalty only when its reroll is available and Tackle does not prevent it',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{skills:['Dodge']}),n={x:9,y:7,risk:3,spent:1,path:[{x:9,y:7,fromX:8,fromY:7,plan:{dodge:true,target:3,rushes:0}}]};
 assert.ok(coach.routeRisk(g,p,n,coach.positionContext(g,p))<3);p.dodgeUsed=true;assert.equal(coach.routeRisk(g,p,n,coach.positionContext(g,p)),3);p.dodgeUsed=false;field(g,1,0,8,6,{skills:['Tackle']});assert.equal(coach.routeRisk(g,p,n,coach.positionContext(g,p)),3);
});
test('Sure Hands throwers win otherwise comparable loose-ball collection jobs',()=>{
 const {g,coach}=board();field(g,0,0,5,6,{skills:['Sure Hands']} );const thrower=field(g,0,1,5,8,{skills:['Sure Hands','Pass'],traits:'Thrower, Human'});g.ball={x:6,y:7,carrier:null};
 for(let i=0;i<20&&!g.ball.carrier;i++)assert.ok(coach.step(g));assert.equal(g.ball.carrier,thrower.id);
});
test('runners and catchers are preferred touchback carriers when physical ability is otherwise equal',()=>{
 for(const role of ['Runner','Catcher']){
  const {g,coach}=board();field(g,0,0,8,3);const specialist=field(g,0,1,8,11,{traits:role+', Human'});g.pending={type:'custom',kind:'Touchback',team:0,options:['Give ball to #1','Give ball to #2'],resolve:choice=>{g.pending=null;g.ball={x:specialist.x,y:specialist.y,carrier:choice.endsWith('#2')?specialist.id:null};}};
  assert.ok(coach.step(g));assert.equal(g.ball.carrier,specialist.id);
 }
});
test('runner/catcher positioning values open downfield space while preserving protective support',()=>{
 const {g,coach}=board(),carrier=field(g,0,0,10,7),p=field(g,0,1,11,3),guard=field(g,0,2,9,6),n={x:15,y:3,path:[],risk:0};g.ball={x:10,y:7,carrier:carrier.id};carrier.used=true;guard.used=true;
 const ordinary=coach.positionValue(g,p,n,coach.positionContext(g,p));p.profileOverride.traits='Catcher, Human';assert.ok(coach.positionValue(g,p,n,coach.positionContext(g,p))>ordinary);
});
test('role-aware planning preserves match state and never samples dice',()=>{
 const {g,coach}=board();field(g,0,0,8,3,{st:4,skills:['Block','Horns'],traits:'Blitzer, Human'});field(g,1,0,11,3);g.dice=()=>{throw Error('Planning rolled dice');};const before=JSON.stringify(g);assert.ok(coach.chooseAction(g));assert.equal(JSON.stringify(g),before);
});
test('a blocker actively takes a useful contact square that an ordinary player would avoid',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{ma:2,st:4,skills:['Block']}),d=field(g,1,0,11,7);g.blitzUsed[0]=true;
 const generic=coach.chooseAction(g);assert.equal(generic.kind,'move');assert.ok(g.distance(generic.route,d)>1);
 p.profileOverride.traits='Blocker, Human';const specialist=coach.chooseAction(g);assert.equal(specialist.kind,'move');assert.equal(g.distance(specialist.route,d),1);
});
test('thrower tags cannot make an unreliable pass clear the transfer safety gates',()=>{
 const {g,coach}=board(),p=field(g,0,0,15,7,{ma:1,pa:'6+',traits:'Thrower, Human'});field(g,0,1,20,7,{ma:6,skills:['Catch']});g.handoffUsed[0]=true;g.ball={x:15,y:7,carrier:p.id};assert.notEqual(coach.chooseAction(g)?.kind,'pass');
});
test('the runner role modestly favours downfield advancement while the safe touchdown remains decisive',()=>{
 const {g,coach}=board(),p=field(g,0,0,10,7,{ma:6}),n={x:15,y:7,path:[],risk:0};g.ball={x:10,y:7,carrier:p.id};
 const generic=coach.positionValue(g,p,n,coach.positionContext(g,p));p.profileOverride.traits='Runner, Human';assert.ok(coach.positionValue(g,p,n,coach.positionContext(g,p))>generic);
 p.x=24;g.ball.x=24;const action=coach.chooseAction(g);assert.equal(action.kind,'move');assert.equal(action.scoring,true);assert.equal(action.route.x,25);
});
test('an available Dodge reroll makes a useful runner escape worth attempting, while Tackle removes that advantage',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{st:2,traits:'Runner, Human'}),marker=field(g,1,0,8,6);g.ball={x:8,y:7,carrier:p.id};
 assert.equal(coach.chooseAction(g),null);p.extraSkills=['Dodge'];const escape=coach.chooseAction(g);assert.equal(escape.kind,'move');assert.ok(escape.route.path.some(s=>s.plan.dodge));assert.ok(escape.route.x>p.x);
 marker.extraSkills=['Tackle'];assert.equal(coach.chooseAction(g),null);
});
test('Juggernaut treats Both Down as a safe push without wasting a team reroll',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{st:4,skills:['Juggernaut']}),d=field(g,1,0,9,7);g.rerolls=[1,0];g.dice=()=>2;
 assert.ok(g.startBlitz(p.id,d.id));assert.ok(g.blitzBlock());assert.ok(coach.step(g));assert.equal(g.pending.kind,'Juggernaut');assert.equal(g.rerolls[0],1);
 assert.ok(coach.step(g));assert.equal(g.pending.type,'pushChoice');assert.equal(p.status,'standing');assert.equal(g.rerolls[0],1);
});
test('Juggernaut preserves a better Block knockdown instead of converting it to a push',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{st:4,skills:['Block','Juggernaut']}),d=field(g,1,0,9,7);g.dice=()=>2;
 assert.ok(g.startBlitz(p.id,d.id));assert.ok(g.blitzBlock());for(let i=0;i<8&&d.status==='standing';i++)assert.ok(coach.step(g));assert.equal(d.status,'prone');assert.equal(p.status,'standing');
});
test('Wrestle is not treated as a safe Both Down result while carrying the ball',()=>{
 const {g,coach}=board(),p=field(g,0,0,8,7,{st:4,skills:['Wrestle']}),d=field(g,1,0,9,7);g.ball={x:8,y:7,carrier:p.id};g.rerolls=[1,0];g.dice=()=>2;
 assert.ok(g.block(p.id,d.id));g.dice=()=>6;assert.ok(coach.step(g));assert.equal(g.rerolls[0],0);assert.equal(g.ball.carrier,p.id);assert.equal(p.status,'standing');assert.equal(g.pending.type,'blockSelect');
});
