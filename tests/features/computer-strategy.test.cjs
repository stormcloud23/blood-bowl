const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame}=require('../../src/engine/match.cjs');
const {ComputerCoach}=require('../../src/features/computer/computer.cjs');
const rosters=require('../../src/data/rosters.json');
function board(team=0){
 const human=rosters.find(t=>t.id==='human'),g=new MatchGame([human,human],{dice:()=>1});
 g.phase='play';g.active=team;g.turns=[1,1];g.individualBlockChoices=true;g.ball={x:null,y:null,carrier:null};
 g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve',role:0}));return g;
}
function field(g,team,index,x,y,profile={}){
 const p=g.players.filter(q=>q.team===team)[index];Object.assign(p,{x,y,status:'standing',used:false});p.profileOverride={...g.profile(p),...profile};return p;
}
function carry(g,p){g.ball={x:p.x,y:p.y,carrier:p.id};}
function node(x,y){return {x,y,risk:0,path:[],spent:0};}

test('useful safe cage preparation precedes an optional two-die block',()=>{
 const g=board(),carrier=field(g,0,0,6,7),helper=field(g,0,4,9,8),blocker=field(g,0,5,12,3,{st:4});carry(g,carrier);carrier.used=true;
 [[5,6],[5,8],[7,6]].forEach(([x,y],i)=>{field(g,0,i+1,x,y).used=true;});field(g,1,0,13,3);
 const action=new ComputerCoach(0).chooseAction(g);assert.equal(action.kind,'move');assert.equal(action.p,helper);assert.equal(action.success,1);assert.deepEqual([action.route.x,action.route.y],[7,8]);assert.equal(blocker.used,false);
});
test('a no-movement-roll route with Bone Head is not treated as a guaranteed action',()=>{
 const g=board(),p=field(g,0,0,5,7,{skills:['Bone Head']}),coach=new ComputerCoach(0),route=coach.routes(g,p).find(n=>n.x===6&&n.y===7);
 assert.equal(coach.routeChance(g,p,route,coach.positionContext(g,p)),1);assert.ok(coach.activationChance(g,p,'move')<1);
 const ordinary=field(g,0,1,5,10);assert.equal(coach.activationChance(g,ordinary,'move'),1);
});
test('block selection prefers Block reliability at the same strength and dice count',()=>{
 const g=board(),ordinary=field(g,0,0,8,3,{st:4}),skilled=field(g,0,1,8,10,{st:4,skills:['Block']}),first=field(g,1,0,9,3),second=field(g,1,1,9,10),coach=new ComputerCoach(0);
 assert.ok(Math.abs(coach.blockOdds(g,ordinary,first).failure-1/9)<1e-9);assert.ok(Math.abs(coach.blockOdds(g,skilled,second).failure-1/36)<1e-9);
 const action=coach.chooseAction(g);assert.equal(action.kind,'block');assert.equal(action.p,skilled);
});
test('a needed final-turn touchdown outranks safe positioning even when it requires a Rush',()=>{
 const g=board(),carrier=field(g,0,0,2,7,{ma:1});field(g,0,1,8,4);carry(g,carrier);g.half=2;g.turns=[8,8];g.scores=[0,1];
 const action=new ComputerCoach(0).chooseAction(g);assert.equal(action.p,carrier);assert.equal(action.scoring,true);assert.equal(action.route.x,0);assert.ok(action.success<1);assert.equal(action.priority,4);
});
test('a safe scoring route is still taken immediately instead of importing old stalling advice',()=>{
 const g=board(),carrier=field(g,0,0,24,7);field(g,0,1,8,4);carry(g,carrier);g.turns=[2,2];
 const action=new ComputerCoach(0).chooseAction(g);assert.equal(action.p,carrier);assert.equal(action.scoring,true);assert.equal(action.route.x,25);
});
test('a necessary late ball-carrier sack outranks unrelated safe moves when behind',()=>{
 const g=board(1);g.half=2;g.turns=[6,6];g.scores=[1,0];
 const attacker=field(g,1,0,7,7,{st:4}),carrier=field(g,0,0,8,7);field(g,1,1,15,2);carry(g,carrier);
 const action=new ComputerCoach(1).chooseAction(g);assert.equal(action.kind,'block');assert.equal(action.p,attacker);assert.equal(action.target,carrier);assert.equal(action.priority,3);
});
test('early carrier positioning favours central space more strongly than late sideline commitment',()=>{
 const g=board(),p=field(g,0,0,6,4),coach=new ComputerCoach(0);carry(g,p);
 let context=coach.positionContext(g,p);const early=coach.positionValue(g,p,node(10,7),context)-coach.positionValue(g,p,node(10,2),context);
 g.turns[0]=7;context=coach.positionContext(g,p);const late=coach.positionValue(g,p,node(10,7),context)-coach.positionValue(g,p,node(10,2),context);
 assert.ok(early>0);assert.ok(late>=0&&late<early);
});
test('a cage corner in enemy contact is worth less than an unmarked corner',()=>{
 const g=board(),carrier=field(g,0,0,10,7),coach=new ComputerCoach(0);carry(g,carrier);
 const guards=[[9,6],[9,8],[11,6],[11,8]].map(([x,y],i)=>field(g,0,i+1,x,y));
 const free=coach.protectionValue(g,carrier,guards,coach.positionContext(g,carrier));field(g,1,0,8,5);
 assert.ok(coach.protectionValue(g,carrier,guards,coach.positionContext(g,carrier))<free);
});
for(const team of [0,1])test('defense holds goal-side space when leading and pressures when losing late: team '+team,()=>{
 const g=board(team);g.half=2;const mirror=x=>g.right(team)?25-x:x,p=field(g,team,0,mirror(20),7),carrier=field(g,1-team,0,mirror(13),7),coach=new ComputerCoach(team);carry(g,carrier);
 g.turns=[6,6];g.scores[team]=1;g.scores[1-team]=0;
 let context=coach.positionContext(g,p);assert.equal(context.strategy.holdLine,true);
 assert.ok(coach.positionValue(g,p,node(mirror(17),7),context)>coach.positionValue(g,p,node(mirror(11),7),context));
 g.scores[team]=0;g.scores[1-team]=1;context=coach.positionContext(g,p);assert.equal(context.strategy.mustSteal,true);
 assert.ok(coach.positionValue(g,p,node(mirror(12),7),context)>coach.positionValue(g,p,node(mirror(17),7),context));
});
test('the last deep defender values retaining safety until a teammate provides it',()=>{
 const g=board(1),p=field(g,1,0,20,7),carrier=field(g,0,0,13,7),coach=new ComputerCoach(1);carry(g,carrier);g.scores=[0,1];
 let context=coach.positionContext(g,p);const alone=coach.positionValue(g,p,node(17,7),context)-coach.positionValue(g,p,node(12,7),context);
 field(g,1,1,19,12);context=coach.positionContext(g,p);const supported=coach.positionValue(g,p,node(17,7),context)-coach.positionValue(g,p,node(12,7),context);assert.ok(alone>supported);
});
test('a shutout screen stays off the carrier instead of offering an unnecessary free block',()=>{
 const g=board(1),p=field(g,1,0,20,7),carrier=field(g,0,0,13,7),coach=new ComputerCoach(1);carry(g,carrier);g.scores=[0,1];
 const context=coach.positionContext(g,p);assert.ok(coach.positionValue(g,p,node(15,7),context)>coach.positionValue(g,p,node(14,7),context));
});
test('a carrier prefers unmarked space over equivalent progress into direct enemy contact',()=>{
 const g=board(),p=field(g,0,0,6,7),coach=new ComputerCoach(0);carry(g,p);field(g,1,0,10,6);
 const context=coach.positionContext(g,p);assert.ok(coach.positionValue(g,p,node(10,9),context)>coach.positionValue(g,p,node(10,7),context));
});
test('the last team re-roll is conserved on a peripheral Rush but used on a carrier Rush',()=>{
 for(const carrying of [false,true]){
  const g=board(),p=field(g,0,0,5,7);if(carrying)carry(g,p);g.rerolls=[1,0];let result=null,roll=0;g.dice=()=>++roll===1?1:6;
  g.test(p,'Rush',2,()=>{result=true;},()=>{result=false;});assert.ok(g.pending);
  assert.ok(new ComputerCoach(0).step(g));assert.equal(g.rerolls[0],carrying?0:1);assert.equal(result,carrying);
 }
});
test('a ball recovery may use the last team re-roll before anyone carries it',()=>{
 const g=board(),p=field(g,0,0,5,7);g.rerolls=[1,0];let roll=0,result=false;g.dice=()=>++roll===1?1:6;
 g.test(p,'Pick up',3,()=>{result=true;},()=>{});assert.ok(new ComputerCoach(0).step(g));assert.equal(g.rerolls[0],0);assert.equal(result,true);
});
test('an optional failed block can be accepted while a ball-carrier sack merits the last re-roll',()=>{
 for(const ball of [false,true]){
  const g=board(),p=field(g,0,0,5,7,{st:4}),d=field(g,1,0,6,7);if(ball)carry(g,d);g.rerolls=[1,0];g.dice=()=>1;
  assert.ok(g.block(p.id,d.id));assert.ok(new ComputerCoach(0).step(g));assert.equal(g.rerolls[0],ball?0:1);
  if(ball)assert.equal(g.pending.type,'blockSelect');else assert.equal(p.status,'prone');
 }
});
test('two dodges share one Dodge re-roll and Tackle prevents using it',()=>{
 const g=board(),p=field(g,0,0,5,7,{skills:['Dodge']}),coach=new ComputerCoach(0),route={path:[{x:6,y:7,fromX:5,fromY:7,plan:{dodge:true,target:3,rushes:0}},{x:7,y:7,fromX:6,fromY:7,plan:{dodge:true,target:3,rushes:0}}]};
 assert.ok(Math.abs(coach.routeChance(g,p,route,coach.positionContext(g,p))-20/27)<1e-9);
 field(g,1,0,5,6,{skills:['Tackle']});assert.ok(Math.abs(coach.routeChance(g,p,route,coach.positionContext(g,p))-4/9)<1e-9);
});
test('pickup forecasts use rain and Sure Hands without consuming actual dice',()=>{
 const g=board(),p=field(g,0,0,5,7,{skills:['Sure Hands']}),coach=new ComputerCoach(0),route={path:[{x:6,y:7,fromX:5,fromY:7,plan:{pickup:true,rushes:0}}]};g.weather='Pouring Rain';let rolls=0;g.dice=()=>{rolls++;return 6;};
 assert.ok(Math.abs(coach.routeChance(g,p,route,coach.positionContext(g,p))-3/4)<1e-9);assert.equal(rolls,0);
});
