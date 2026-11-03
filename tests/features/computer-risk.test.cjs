const {test}=require('node:test'),assert=require('node:assert/strict');
const {MatchGame}=require('../../src/engine/match.cjs');
const {ComputerCoach}=require('../../src/features/computer/computer.cjs');
const rosters=require('../../src/data/rosters.json');
function fixture(team=1){
 const g=new MatchGame(['human','orc'].map(id=>rosters.find(t=>t.id===id)),{dice:()=>6});
 g.phase='play';g.active=team;g.turns=[1,1];g.individualBlockChoices=true;
 g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve',used:false}));
 return {g,p:g.players.find(p=>p.team===team),coach:new ComputerCoach(team)};
}
function transfer({team=1,half=1,passing=true,from=12,to=5}={}){
 const {g,p,coach}=fixture(team);g.half=half;
 const goal=g.right(team)?25:0,dir=g.right(team)?1:-1,q=g.players.find(r=>r.team===team&&r!==p);
 p.profileOverride={name:'Carrier',cost:75000,ma:6,st:3,ag:'3+',pa:passing?'2+':'6+',av:'9+',skills:passing?['Pass']:[],traits:'Thrower, Human'};
 q.profileOverride={name:'Receiver',cost:75000,ma:8,st:2,ag:'3+',pa:'4+',av:'8+',skills:['Catch','Dodge'],traits:'Catcher, Human'};
 Object.assign(p,{x:goal-dir*from,y:7,status:'standing'});Object.assign(q,{x:goal-dir*to,y:7,status:'standing'});
 g.ball={x:p.x,y:p.y,carrier:p.id};if(passing)g.handoffUsed[team]=true;
 return {g,p,q,coach};
}
for(const team of [0,1])for(const half of [1,2])test('computer completes a valuable scoring pass: '+team+'/'+half,()=>{
 const {g,p,q,coach}=transfer({team,half}),before=JSON.stringify(g),action=coach.chooseAction(g);
 assert.equal(action.kind,'pass');assert.equal(action.p,p);assert.equal(action.target,q);assert.ok(action.success>=.65);assert.equal(JSON.stringify(g),before);
 for(let i=0;i<35&&!g.scores[team];i++)assert.ok(coach.step(g));
 assert.equal(g.scores[team],1);assert.ok(g.events.some(e=>e.includes('attempts a')));assert.equal(g.passUsed[team],true);
});
test('computer hands off to a reliable receiver for a touchdown it cannot run itself',()=>{
 const {g,q,coach}=transfer({passing:false}),action=coach.chooseAction(g);
 assert.equal(action.kind,'handoff');assert.equal(action.target,q);assert.equal(g.distance(action.route,q),1);
 for(let i=0;i<40&&!g.scores[1];i++)assert.ok(coach.step(g));
 assert.equal(g.scores[1],1);assert.equal(g.handoffUsed[1],true);assert.equal(g.passUsed[1],false);
});
test('computer runs a guaranteed touchdown instead of taking transfer risk',()=>{
 const {g,p,coach}=transfer({from:1,to:0}),action=coach.chooseAction(g);
 assert.equal(action.kind,'move');assert.equal(action.route.x,0);assert.equal(action.p,p);
});
test('computer rejects routine lateral exchanges and unavailable receiver activations',()=>{
 const {g,q,coach}=transfer({from:18,to:18});q.y=9;q.profileOverride.ma=6;
 assert.ok(!['pass','handoff'].includes(coach.chooseAction(g)?.kind));
 q.x=3;q.used=true;assert.ok(!['pass','handoff'].includes(coach.chooseAction(g)?.kind));
});
test('computer avoids rainy marked catches and a dangerous interception lane',()=>{
 const rainy=transfer();rainy.g.weather='Pouring Rain';rainy.q.profileOverride.skills=[];
 rainy.g.players.filter(r=>r.team===0).slice(0,2).forEach((r,i)=>Object.assign(r,{x:5,y:6+i*2,status:'standing'}));
 assert.ok(!['pass','handoff'].includes(rainy.coach.chooseAction(rainy.g)?.kind));
 const {g,p,coach}=transfer({from:10,to:5});p.profileOverride.ma=1;
 Object.assign(g.players.find(r=>r.team===0),{x:7,y:7,status:'standing',profileOverride:{...p.profileOverride,ag:'2+',skills:['Very Long Legs','Nerves of Steel']}});
 assert.notEqual(coach.chooseAction(g)?.kind,'pass');
});
test('PA-dash passing is rejected while an already-used end-zone catcher can score',()=>{
 const {g,p,q,coach}=transfer({from:5,to:0});p.profileOverride.ma=1;p.profileOverride.pa='-';
 assert.notEqual(coach.chooseAction(g)?.kind,'pass');p.profileOverride.pa='2+';q.used=true;
 assert.equal(coach.chooseAction(g).kind,'pass');for(let i=0;i<12&&!g.scores[1];i++)assert.ok(coach.step(g));assert.equal(g.scores[1],1);
});
test('computer respects transfer limits and cannot turn a started Move into a Pass',()=>{
 const {g,p,coach}=transfer();g.passUsed[1]=true;assert.ok(!['pass','handoff'].includes(coach.chooseAction(g)?.kind));
 g.start(p.id,'move');coach.plan=null;assert.ok(coach.step(g));assert.equal(g.events.some(e=>e.includes('attempts a')),false);
});
function foul({victim='Wardancer',av=null,expensive=false}={}){
 const {g,p,coach}=fixture(),d=g.players.find(q=>q.team===0),roster=rosters.find(t=>t.id===(victim==='Gutter Runner'?'skaven':'wood-elf'));
 Object.assign(p,{x:10,y:7,status:'standing',profileOverride:{name:'Cheap fouler',cost:expensive?150000:40000,ma:6,st:3,ag:'3+',pa:'4+',av:'8+',skills:[],traits:'Lineman'}});
 Object.assign(d,{x:11,y:7,status:'prone',profileOverride:{...roster.positions.find(r=>r.name===victim)}});if(av)d.profileOverride.av=av;
 if(victim==='Gutter Runner')Object.assign(g.players.find(q=>q.team===1&&q!==p),{x:12,y:7,status:'standing',used:true});
 g.ball={x:null,y:null,carrier:null};let dice=0;g.dice=()=>++dice%2?2:3;return {g,p,d,coach};
}
for(const victim of ['Wardancer','Gutter Runner'])test('computer fouls a vulnerable '+victim+' with a cheap player',()=>{
 const {g,p,d,coach}=foul({victim}),before=JSON.stringify(g),action=coach.chooseAction(g);
 assert.equal(action.kind,'foul');assert.equal(action.p,p);assert.equal(action.target,d);assert.ok(action.odds.removal>=.16);assert.equal(JSON.stringify(g),before);
 assert.ok(coach.step(g));assert.ok(coach.step(g));assert.ok(g.events.some(e=>e.startsWith('Foul:')));assert.equal(g.foulUsed[1],true);
});
test('computer avoids expensive foulers and cheap or heavily armoured victims',()=>{
 const costly=foul({expensive:true});assert.notEqual(costly.coach.chooseAction(costly.g)?.kind,'foul');
 const armour=foul({av:'11+'});assert.notEqual(armour.coach.chooseAction(armour.g)?.kind,'foul');
 Object.assign(armour.d.profileOverride,{cost:40000,ma:6,ag:'3+',skills:[]});assert.notEqual(armour.coach.chooseAction(armour.g)?.kind,'foul');
});
test('computer reserves its fouler while other useful safe actions happen first',()=>{
 const {g,p,coach}=foul(),other=g.players.find(q=>q.team===1&&q!==p);
 Object.assign(other,{x:16,y:2,status:'standing',profileOverride:{...p.profileOverride,cost:150000}});
 assert.notEqual(coach.chooseAction(g).kind,'foul');
 for(let i=0;i<25&&!g.events.some(e=>e.startsWith('Foul:'));i++)assert.ok(coach.step(g));
 assert.ok(g.events.some(e=>e.startsWith('Foul:')));assert.equal(p.used,true);
});
test('computer refuses to gamble a cage guard or its only goal-side defender',()=>{
 const {g,p,d,coach}=foul(),carrier=g.players.find(q=>q.team===1&&q!==p);
 Object.assign(carrier,{x:10,y:8,status:'standing',used:true});g.ball={x:10,y:8,carrier:carrier.id};assert.notEqual(coach.chooseAction(g)?.kind,'foul');
 Object.assign(carrier,{status:'reserve',x:null,y:null});const enemy=g.players.find(q=>q.team===0&&q!==d);Object.assign(enemy,{x:5,y:8,status:'standing'});g.ball={x:5,y:8,carrier:enemy.id};assert.notEqual(coach.chooseAction(g)?.kind,'foul');
});
test('foul forecasts value assists and Dirty Player/Sneaky Git, with armour protections',()=>{
 const {g,p,d,coach}=foul(),plain=coach.foulOdds(g,p,d,p,new Map());p.extraSkills=['Dirty Player','Sneaky Git'];
 const skilled=coach.foulOdds(g,p,d,p,new Map());assert.ok(skilled.removal>plain.removal);assert.ok(skilled.sent<plain.sent);
 Object.assign(g.players.find(q=>q.team===1&&q!==p),{x:12,y:7,status:'standing'});const assisted=coach.foulOdds(g,p,d,p,new Map());assert.ok(assisted.removal>=skilled.removal);
 d.extraSkills=['Iron Hard Skin','Thick Skull'];assert.ok(coach.foulOdds(g,p,d,p,new Map()).removal<assisted.removal);
});
test('computer applies Dirty Player and takes a free interception opportunity',()=>{
 const {g,p,coach}=foul();let chosen;g.skillChoice('Dirty Player',1,['Add +1 to Armour','No modifier'],choice=>{chosen=choice;});assert.ok(coach.step(g));assert.equal(chosen,'Add +1 to Armour');
 g.skillChoice('interception',1,['Intercept with #1','Decline interception'],choice=>{chosen=choice;});g.pending.pitchChoices=[{x:p.x,y:p.y,option:'Intercept with #1'}];assert.ok(coach.step(g));assert.equal(chosen,'Intercept with #1');
});
test('computer uses a reliable hand-off for a major advance but does not exchange the ball for a small gain',()=>{
 const {g,coach}=transfer({passing:false,from:20,to:16});const action=coach.chooseAction(g);
 assert.equal(action.kind,'handoff');assert.equal(action.scoring,undefined);assert.ok(action.success>=.86);
});
test('computer can pass a pressured carrier to a protected receiver when walking away is much less reliable',()=>{
 const {g,p,q,coach}=transfer({from:16,to:12});p.profileOverride.ag='4+';p.profileOverride.skills=['Pass','Accurate','Nerves of Steel'];q.profileOverride.ma=6;
 g.players.filter(r=>r.team===0).slice(0,2).forEach((r,i)=>Object.assign(r,{x:16,y:6+i*2,status:'standing'}));
 g.players.filter(r=>r.team===1&&r!==p&&r!==q).slice(0,2).forEach((r,i)=>Object.assign(r,{x:11,y:6+i*2,status:'standing',used:true}));
 const action=coach.chooseAction(g);assert.equal(action.kind,'pass');assert.equal(action.urgent,true);assert.ok(action.success>=.86);
});
test('last-turn scoring necessity permits a risk that is rejected early in the half',()=>{
 const {g,p,coach}=transfer({from:8,to:5});p.profileOverride.ma=1;p.profileOverride.pa='3+';p.profileOverride.skills=[];
 assert.notEqual(coach.chooseAction(g)?.kind,'pass');g.turns[1]=8;
 assert.equal(coach.chooseAction(g).kind,'pass');
});
test('a potential On the Ball interception move makes an otherwise worthwhile pass unattractive',()=>{
 const {g,p,coach}=transfer({from:10,to:5});p.profileOverride.ma=1;assert.equal(coach.chooseAction(g).kind,'pass');
 Object.assign(g.players.find(r=>r.team===0),{x:7,y:10,status:'standing',extraSkills:['On the Ball']});
 assert.notEqual(coach.chooseAction(g)?.kind,'pass');
});
test('passing pauses for a human On the Ball decision and does not replay the release',()=>{
 const {g,coach}=transfer();Object.assign(g.players.find(r=>r.team===0),{x:20,y:14,status:'standing',extraSkills:['On the Ball']});
 for(let i=0;i<15&&g.pending?.kind!=='On the Ball';i++)assert.ok(coach.step(g));
 assert.equal(g.pending.kind,'On the Ball');const before=JSON.stringify(g);assert.equal(coach.step(g),false);assert.equal(JSON.stringify(g),before);
 g.decide('Finish reactions');for(let i=0;i<20&&!g.scores[1];i++)assert.ok(coach.step(g));
 assert.equal(g.scores[1],1);assert.equal(g.events.filter(e=>e.includes('attempts a')).length,1);
});
test('a failed scoring pass and a detected foul return to the opponent without repeated actions',()=>{
 const ball=transfer();let rolls=[1,1,6];ball.g.dice=()=>rolls.length?rolls.shift():6;
 for(let i=0;i<20&&ball.g.active===1;i++)assert.ok(ball.coach.step(ball.g));
 assert.equal(ball.g.active,0);assert.equal(ball.g.events.filter(e=>e.includes('attempts a')).length,1);
 const kick=foul();kick.g.dice=()=>1;for(let i=0;i<10&&kick.g.active===1;i++)assert.ok(kick.coach.step(kick.g));
 assert.equal(kick.g.active,0);assert.equal(kick.p.status,'sent-off');assert.equal(kick.g.events.filter(e=>e.startsWith('Foul:')).length,1);
});
test('computer abandons a transfer target that moved after the declaration',()=>{
 const {g,q,coach}=transfer();assert.ok(coach.step(g));q.y++;
 assert.ok(coach.step(g));assert.equal(g.mover,null);assert.equal(g.events.some(e=>e.includes('attempts a')),false);
});
test('fouling uses developed player values and respects the team foul allowance',()=>{
 const {g,p,coach}=foul();p.leagueRecord={value:180000};assert.notEqual(coach.chooseAction(g)?.kind,'foul');
 delete p.leagueRecord;g.foulUsed[1]=true;assert.notEqual(coach.chooseAction(g)?.kind,'foul');p.extraSkills=['Sneakiest of the Lot'];assert.equal(coach.chooseAction(g).kind,'foul');
});
test('transfer and foul planning cannot sample dice',()=>{
 for(const sample of [transfer(),foul()]){sample.g.dice=()=>{throw Error('Planning sampled dice');};const before=JSON.stringify(sample.g);assert.ok(sample.coach.chooseAction(sample.g));assert.equal(JSON.stringify(sample.g),before);}
});
test('an ordinary Human Thrower can move into Quick Pass range for a valuable scoring play',()=>{
 const {g,p,coach}=transfer();p.profileOverride.pa='3+';
 const action=coach.chooseAction(g);assert.equal(action.kind,'pass');assert.ok(action.route.path.length>=3);assert.ok(action.success>=.78);
 for(let i=0;i<40&&!g.scores[1];i++)assert.ok(coach.step(g));assert.equal(g.scores[1],1);
});
test('given two eligible foulers the computer chooses the cheaper developed player',()=>{
 const {g,p,coach}=foul(),other=g.players.find(q=>q.team===1&&q!==p);
 Object.assign(other,{x:11,y:8,status:'standing',profileOverride:{...p.profileOverride,cost:60000}});
 const action=coach.chooseAction(g);assert.equal(action.kind,'foul');assert.equal(action.p,p);
});
