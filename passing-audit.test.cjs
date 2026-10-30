const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MovementGame}=require('./movement.cjs'),{SkillGame}=require('./skills.cjs'),{MatchGame}=require('./match.cjs');
const oracle=require('./test-fixtures/ffb-interception.json');
const teams=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('interception squares agree with 152100 outputs from the pinned Java method',()=>{
 const g=Object.create(MovementGame.prototype);let compared=0;
 for(const row of oracle.rows){const bits=Buffer.from(row.mask,'base64');for(let y=0;y<15;y++)for(let x=0;x<26;x++){const bit=y*26+x,expected=!!(bits[bit>>3]&(1<<(bit%8)));assert.equal(g.interceptionSquare({x:0,y:0},{x:row.target[0],y:row.target[1]},{x,y}),expected,JSON.stringify({target:row.target,point:[x,y]}));compared++;}}
 assert.equal(compared,152100);assert.equal(oracle.width,1.74);
});

test('pinned interception masks retain reflection, rotation and translation symmetry',()=>{
 const g=Object.create(MovementGame.prototype);
 for(const row of oracle.rows.filter((_,i)=>i%13===0)){const bits=Buffer.from(row.mask,'base64');for(let y=0;y<15;y++)for(let x=0;x<26;x++){const bit=y*26+x,expected=!!(bits[bit>>3]&(1<<(bit%8)));for(const sx of [-1,1])for(const sy of [-1,1])for(const swap of [false,true]){const transform=(x,y)=>swap?{x:13+sy*y,y:7+sx*x}:{x:13+sx*x,y:7+sy*y};assert.equal(g.interceptionSquare(transform(0,0),transform(...row.target),transform(x,y)),expected);}}}
});

test('every pass-range chart cell agrees with the pinned BB2025 table',()=>{
 const g=Object.create(MovementGame.prototype);for(let y=0;y<14;y++)for(let x=0;x<14;x++)assert.equal(g.passRange({x:0,y:0},{x,y})?.band??null,oracle.passingChart[y][x],x+','+y);
});

test('shared pass classification agrees with 1764 outcomes from pinned Java PassMechanic',()=>{
 const g=Object.create(MovementGame.prototype);for(const [pa,roll,modifier,safe,result] of oracle.passingResults)assert.equal(g.classifyPass(pa,roll,modifier,!!safe),result,JSON.stringify({pa,roll,modifier,safe}));assert.equal(oracle.passingResults.length,1764);
});

test('PA one succeeds on a modified one when the natural die is not one',()=>{
 const g=new MovementGame(teams,{scenario:'pass',dice:()=>2}),a=g.players[0];a.profileOverride={...g.profile(a),pa:'1+',skills:[]};g.rerolls=[0,0];let intercepted=false;g.interceptPass=()=>intercepted=true;g.resolvePass(a,14,7,{band:1,name:'Short Pass',target:2});assert.equal(intercepted,true);assert.ok(g.events.includes('Accurate Pass.'));
});

test('interception endpoint distance limits exclude receiver squares and players beyond either end',()=>{
 const g=Object.create(MovementGame.prototype),from={x:8,y:7},to={x:14,y:7};for(const p of [{x:8,y:7},{x:14,y:7},{x:7,y:7},{x:15,y:7},{x:8,y:8},{x:14,y:8}])assert.equal(g.interceptionSquare(from,to,p),false);assert.equal(g.interceptionSquare(from,to,{x:11,y:8}),true);assert.equal(g.interceptionSquare(from,to,{x:11,y:9}),false);assert.equal(g.interceptionSquare(from,from,{x:8,y:7}),false);
});

test('normal interception uses Nerves of Steel and no interceptor Stunty penalty',()=>{
 const g=new SkillGame(structuredClone(teams),{scenario:'pass',dice:()=>5}),a=g.players[0],d=g.players[11],marker=g.players[1];g.rerolls=[0,0];Object.assign(d,{x:11,y:8,profileOverride:{...g.profile(d),ag:'3+',skills:[]},extraSkills:['Stunty','Nerves of Steel']});Object.assign(marker,{x:12,y:8});let landed=false;g.interceptPass(a,{x:14,y:7},false,()=>landed=true);assert.equal(g.pending.team,1);g.decide('Intercept with #'+d.number);assert.equal(landed,false);assert.equal(g.playerStats[d.id].interception,1);assert.equal(g.active,1);
});

test('Cloud Burster, Very Long Legs and No Ball still filter the wider geometry',()=>{
 const g=new SkillGame(structuredClone(teams),{scenario:'pass'}),a=g.players[0],d=g.players[11];a.extraSkills=['Cloud Burster'];d.y=8;assert.equal(g.interceptionCandidates(a,{x:14,y:7}).length,0);d.extraSkills=['Very Long Legs'];assert.equal(g.interceptionCandidates(a,{x:14,y:7}).length,1);d.extraSkills.push('No Ball');assert.equal(g.interceptionCandidates(a,{x:14,y:7}).length,0);
});

test('invalid and stale interception callbacks cannot roll or resume the pass twice',()=>{
 const g=new MovementGame(teams,{scenario:'pass',dice:()=>assert.fail('Unexpected roll')}),a=g.players[0];let landed=0;g.interceptPass(a,{x:14,y:7},true,()=>landed++);const old=g.pending;assert.equal(old.resolve('not an option'),false);assert.equal(g.pending,old);assert.equal(old.resolve('Decline interception'),true);assert.equal(old.resolve('Decline interception'),false);assert.equal(landed,1);
});

test('PA dash automatically fumbles a normal pass without dice, Pro or Safe Pass rescue',()=>{
 const g=new SkillGame(structuredClone(teams),{scenario:'pass',dice:()=>assert.fail('No passing die')}),a=g.players[0];a.profileOverride={...g.profile(a),pa:'-'};a.extraSkills=['Pass','Pro','Safe Pass'];g.rerolls=[2,0];let bounced;g.bounce=(x,y,done)=>{bounced={x,y};done();};g.start(a.id,'pass');g.pass(14,7);assert.deepEqual(bounced,{x:a.x,y:a.y});assert.equal(g.active,1);assert.equal(a.proUsed,false);assert.equal(g.rerolls[0],2);assert.ok(g.events.some(e=>e.includes('automatic fumble')));
});

test('modified pass totals below one fumble, while a natural six remains accurate',()=>{
 for(const [roll,modifier,kind] of [[2,3,'fumble'],[5,3,'inaccurate'],[6,20,'accurate']]){const g=new MovementGame(teams,{scenario:'pass',dice:()=>roll}),a=g.players[0];a.profileOverride={...g.profile(a),pa:'3+',skills:[]};g.rerolls=[0,0];let actual;g.bounce=()=>actual='fumble';g.scatterPass=()=>actual='inaccurate';g.interceptPass=()=>actual='accurate';g.resolvePass(a,14,7,{band:1,name:'Short Pass',target:3+modifier});assert.equal(actual,kind);}
});

test('PA dash Throw Team-mate consumes its pinned accuracy die but cannot reroll the automatic fumble',()=>{
 const queue=[6,2,6],g=new SkillGame(teams,{scenario:'pickup',dice:()=>{assert.ok(queue.length);return queue.shift();}}),a=g.players[0],p=g.players[1];a.profileOverride={...g.profile(a),pa:'-'};a.extraSkills=['Throw Team-mate','Pro'];p.extraSkills=['Right Stuff'];g.rerolls=[2,0];g.start(a.id,'throw-team-mate');g.selectThrowMate(p.id);g.throwTeamMate(12,7);assert.equal(g.pending,null);assert.equal(a.proUsed,false);assert.equal(g.rerolls[0],2);assert.ok(g.events.some(e=>e.startsWith('Fumbled Throw')));assert.equal(queue.length,0);
});

test('Pouring Rain modifies Bomb interception as well as normal interception',()=>{
 const g=new MatchGame(teams,{dice:()=>4}),p=g.players[11];g.phase='play';g.weather='Pouring Rain';Object.assign(p,{status:'standing',x:11,y:7});let failed=false;g.test(p,'Bomb interception',4,()=>assert.fail('Rain should prevent success'),()=>failed=true);assert.equal(failed,true);assert.ok(g.events.some(e=>e.includes('needs 5+')));
});
