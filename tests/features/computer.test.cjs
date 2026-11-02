const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame}=require('../../src/engine/match.cjs');
const {ComputerCoach,computerDecisionTeam}=require('../../src/features/computer/computer.cjs');
const rosters=require('../../src/data/rosters.json');
function fixture(seed=1,ids=['human','orc']){
 let state=seed;
 const g=new MatchGame(ids.map(id=>rosters.find(t=>t.id===id)),{dice:s=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return 1+Math.floor(state/4294967296*s);}});
 g.individualBlockChoices=true;return g;
}
function position(g,team=1){
 g.phase='play';g.active=team;g.turns=[1,1];g.finished=false;g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve',used:false}));
 const p=g.players.find(p=>p.team===team);Object.assign(p,{x:team?1:24,y:7,status:'standing',role:0});return p;
}
test('planning uses forecasts without mutating state or consuming dice',()=>{
 const g=fixture(),p=position(g);g.ball={x:p.x,y:p.y,carrier:p.id};let rolls=0;g.dice=()=>{rolls++;return 6;};
 const before=JSON.stringify(g),coach=new ComputerCoach(1),action=coach.chooseAction(g);
 assert.equal(action.kind,'move');assert.equal(action.route.x,0);assert.equal(JSON.stringify(g),before);assert.equal(rolls,0);
});
test('computer scores an available touchdown and changes direction at halftime',()=>{
 for(const half of [1,2]){
  const g=fixture(),p=position(g);g.half=half;p.x=half===1?1:24;g.ball={x:p.x,y:p.y,carrier:p.id};const coach=new ComputerCoach(1);
  for(let n=0;n<15&&g.scores[1]===0;n++)assert.ok(coach.step(g));
  assert.equal(g.scores[1],1);assert.equal(g.phase,'endDrive');
 }
});
test('computer recovers a loose ball through ordinary movement and pickup rules',()=>{
 const g=fixture(),p=position(g);p.x=10;g.ball={x:9,y:7,carrier:null};g.dice=()=>6;const coach=new ComputerCoach(1);
 for(let n=0;n<15&&!g.ball.carrier;n++)assert.ok(coach.step(g));
 assert.equal(g.ball.carrier,p.id);
});
test('support fills an open rear cage corner instead of adding another player in front',()=>{
 for(const half of [1,2]){
  const g=fixture(),p=position(g);g.half=half;
  const carrier=g.players.find(q=>q.team===1&&q!==p),guards=g.players.filter(q=>q.team===1&&q!==p&&q!==carrier).slice(0,3),dir=g.right(1)?1:-1;
  Object.assign(carrier,{x:13,y:7,status:'standing',used:true});g.ball={x:13,y:7,carrier:carrier.id};
  [[13+dir,6],[13+dir,8],[13-dir,6]].forEach(([x,y],i)=>Object.assign(guards[i],{x,y,status:'standing',used:true}));
  Object.assign(p,{x:13-dir*3,y:9});
  const action=new ComputerCoach(1).chooseAction(g);assert.equal(action.kind,'move');assert.equal(action.p,p);
  assert.deepEqual([action.route.x,action.route.y],[13-dir,8]);
 }
});
test('a complete cage does not attract a wide screen player into redundant coverage',()=>{
 const g=fixture(),p=position(g),carrier=g.players.find(q=>q.team===1&&q!==p),guards=g.players.filter(q=>q.team===1&&q!==p&&q!==carrier).slice(0,4);
 Object.assign(carrier,{x:13,y:7,status:'standing',used:true});g.ball={x:13,y:7,carrier:carrier.id};
 [[12,6],[12,8],[14,6],[14,8]].forEach(([x,y],i)=>Object.assign(guards[i],{x,y,status:'standing',used:true}));Object.assign(p,{x:16,y:2});
 const coach=new ComputerCoach(1),context=coach.positionContext(g,p),routes=coach.routes(g,p),origin=routes[0],crowded=routes.find(n=>n.x===13&&n.y===6);
 assert.ok(crowded);assert.ok(coach.positionValue(g,p,origin,context)>coach.positionValue(g,p,crowded,context));
 const action=coach.chooseAction(g);if(action)assert.ok(g.distance(action.route,carrier)>2);
});
test('an unnecessary Blitz does not pull the only rear corner guard away from the carrier',()=>{
 const g=fixture(),p=position(g),carrier=g.players.find(q=>q.team===1&&q!==p),guards=g.players.filter(q=>q.team===1&&q!==p&&q!==carrier).slice(0,3),enemy=g.players.find(q=>q.team===0);
 Object.assign(carrier,{x:13,y:7,status:'standing',used:true});g.ball={x:13,y:7,carrier:carrier.id};
 [[12,6],[12,8],[14,6]].forEach(([x,y],i)=>Object.assign(guards[i],{x,y,status:'standing',used:true}));Object.assign(p,{x:14,y:8});Object.assign(enemy,{x:9,y:7,status:'standing',role:0});
 const action=new ComputerCoach(1).chooseAction(g);assert.notEqual(action?.kind,'blitz');
});
test('prone, stunned and distracted players do not provide protective tackle zones',()=>{
 const g=fixture(),p=position(g),others=g.players.filter(q=>q.team===1&&q!==p).slice(0,3);
 ['prone','stunned','standing'].forEach((status,i)=>Object.assign(others[i],{x:10+i,y:6,status,distracted:i===2}));
 const coach=new ComputerCoach(1),context=coach.positionContext(g,p);assert.equal(context.allies.length,0);assert.equal(context.coverage.some(Boolean),false);
});
test('carrier protection values distinct unused escorts rather than promising one player to every corner',()=>{
 const g=fixture(),p=position(g),guard=g.players.find(q=>q.team===1&&q!==p);Object.assign(p,{x:13,y:7});Object.assign(guard,{x:17,y:7,status:'standing',used:false});
 const coach=new ComputerCoach(1),context=coach.positionContext(g,p),actual=coach.protectionValue(g,p,[guard],context),potential=coach.protectionValue(g,p,[guard],context,{potential:true});
 assert.ok(potential>actual);assert.ok(potential-actual<3);
 guard.used=true;const usedContext=coach.positionContext(g,p);assert.equal(coach.protectionValue(g,p,[guard],usedContext,{potential:true}),actual);
});
for(const team of [0,1])test('one complete computer turn preserves width and forms a four-corner cage: team '+team,()=>{
 const g=fixture(1,['human','human']);position(g,team);g.dice=()=>6;
 const players=g.players.filter(p=>p.team===team),spots=[[13,6],[13,7],[13,8],[16,5],[16,9],[17,2],[17,12],[19,4],[19,10],[20,6],[20,8]];
 players.forEach((p,i)=>Object.assign(p,{x:g.right(team)?25-spots[i][0]:spots[i][0],y:spots[i][1],status:'standing',role:0}));
 const carrier=players[6];g.ball={x:carrier.x,y:carrier.y,carrier:carrier.id};const coach=new ComputerCoach(team);
 for(let n=0;n<220&&g.active===team;n++)assert.ok(coach.step(g));assert.notEqual(g.active,team);
 const guards=players.filter(p=>p!==carrier&&p.status==='standing'&&!p.distracted);
 for(const dx of [-1,1])for(const dy of [-1,1])assert.ok(guards.some(p=>p.x===carrier.x+dx&&p.y===carrier.y+dy),'Missing cage corner '+dx+','+dy);
 assert.ok(players.some(p=>p.y<=3));assert.ok(players.some(p=>p.y>=11));
 assert.ok(players.filter(p=>g.distance(p,carrier)>3).length>=3,'Whole team collapsed onto the carrier');
});
test('a computer never acts on a human turn or a human-owned defensive prompt',()=>{
 const g=fixture(),coach=new ComputerCoach(1);position(g,0);const before=JSON.stringify(g);assert.equal(coach.step(g),false);assert.equal(JSON.stringify(g),before);
 g.active=1;let resolved=false;g.skillChoice('Defensive choice',0,['Continue'],()=>{resolved=true;});assert.equal(computerDecisionTeam(g),0);assert.equal(coach.step(g),false);assert.equal(resolved,false);
});
test('Both Down asks each coach independently and preserves the other coach choice',()=>{
 const g=fixture(),a=position(g,1),d=g.players.find(p=>p.team===0);Object.assign(d,{x:2,y:7,status:'standing',extraSkills:['Block']});a.extraSkills=['Block'];
 g.blockAction={attacker:a,target:d};g.resolveBothDown();assert.equal(g.pending.team,1);assert.ok(new ComputerCoach(1).step(g));assert.equal(g.pending.team,0);assert.equal(new ComputerCoach(1).step(g),false);
 g.decide('Use Block');assert.equal(a.status,'standing');assert.equal(d.status,'standing');
});
test('defensive block dice and Stand Firm belong to the computer during the human turn',()=>{
 const g=fixture(),a=position(g,0),d=g.players.find(p=>p.team===1);Object.assign(d,{x:25,y:7,status:'standing'});g.blockAction={attacker:a,target:d,chooserTeam:1,dice:[1,6],poolLocked:true};g.pending={type:'blockSelect'};
 assert.equal(computerDecisionTeam(g),1);assert.ok(new ComputerCoach(1).step(g));assert.ok(g.events.includes('Chosen Block result: Player Down.'));
 g.pending={type:'custom',kind:'Stand Firm',options:['Stand Firm','Be pushed'],resolve:()=>{g.pending=null;}};g.blockAction={attacker:a,target:d};assert.equal(computerDecisionTeam(g),1);
});
test('empty computer teams finish their turn rather than stalling',()=>{
 const g=fixture();position(g);g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'casualty'}));assert.ok(new ComputerCoach(1).step(g));assert.notEqual(g.active,1);
});
test('a chain-pushed human owns their optional Stand Firm choice',()=>{
 const g=fixture(),a=position(g,1),d=g.players.find(p=>p.team===0),occupant=g.players.find(p=>p.team===0&&p!==d);
 Object.assign(a,{x:10,y:7});Object.assign(d,{x:11,y:7,status:'standing'});Object.assign(occupant,{x:12,y:7,status:'standing',extraSkills:['Stand Firm']});
 g.blockAction={attacker:a,target:d};let pushed;g.pushPlayer(d,{x:12,y:7},ok=>{pushed=ok;});
 assert.equal(g.pending.kind,'Stand Firm');assert.equal(computerDecisionTeam(g),0);assert.equal(new ComputerCoach(1).step(g),false);
 g.decide('Stand Firm');assert.equal(pushed,false);assert.equal(d.x,11);assert.equal(occupant.x,12);
});
test('a caught bomb is rethrown by its computer catcher during the human turn',()=>{
 const g=fixture(),a=position(g,0),d=g.players.find(p=>p.team===1);Object.assign(d,{x:23,y:7,status:'standing',role:0});
 g.beginBomb(a);g.rethrowBomb(d);g.dice=()=>6;
 assert.equal(computerDecisionTeam(g),1);assert.ok(new ComputerCoach(1).step(g));assert.notEqual(g.bombContext?.stage,'aim');
 assert.ok(g.events.some(e=>e.includes('Pass #')));
});
for(const [seed,ids] of [[33,['human','orc']],[71,['orc','human']],[927,['human','human']]])test('seeded full match reaches full time: '+seed,()=>{
 const g=fixture(seed,ids),coaches=[new ComputerCoach(0),new ComputerCoach(1)],actions=[0,0];let steps=0;
 for(;steps<4000&&g.phase!=='finished';steps++){
  const owner=computerDecisionTeam(g);assert.ok([0,1].includes(owner));
  actions[owner]++;
  assert.ok(coaches[owner].step(g),'Stalled in '+g.phase+' / '+g.pending?.kind);
  const occupied=g.players.filter(p=>g.onPitch(p)).map(p=>p.x+','+p.y);assert.equal(new Set(occupied).size,occupied.length);
  assert.ok(g.turns.every(n=>n>=0&&n<=8));
 }
 assert.equal(g.phase,'finished','Action bound reached at '+steps);assert.equal(g.half,2);assert.deepEqual(g.turns,[8,8]);
 assert.ok(actions.every(n=>n<=1600),'Exceeded browser controller action limit: '+actions.join('/'));
});
