const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
const {MovementGame}=require("./movement.cjs");
const html=fs.readFileSync("index.html","utf8");
const teams=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],scenario="dodge"){
 const queue=[...rolls];const g=new MovementGame(teams,{scenario,dice:s=>{if(!queue.length)throw Error("Unexpected D"+s);const n=queue.shift();return n;}});
 g.rerolls=[0,0];return g;
}
function choose(g,option="Accept"){assert.ok(g.pending);g.decide(option);}

test("Blitz declares a reachable target, costs one MA, and resumes movement",()=>{
 const g=fixture([3,3],"blitz"),a=g.players[0],d=g.players[11];
 assert.ok(g.startBlitz(a.id,d.id));assert.ok(g.blitzUsed[0]);
 g.step(9,7);g.step(10,7);g.step(11,7);assert.ok(g.blitzBlock());assert.equal(a.spent,4);
 g.selectBlockDie(0);const q=g.pending;q.resolve({x:13,y:7});choose(g,"Stay");
 assert.equal(g.action,"blitz");assert.equal(g.mover,a.id);assert.equal(g.blitzBlock(),false);
 assert.ok(g.step(11,6));g.finish();assert.equal(g.canBlitz(g.players[1],d),false);
});
test("Blitz block rush fails before Block dice and turns over",()=>{
 const g=fixture([1,1,1],"blitz"),a=g.players[0],d=g.players[11];g.startBlitz(a.id,d.id);a.x=11;a.spent=7;
 assert.ok(g.blitzBlock());choose(g,"Accept");assert.equal(a.status,"prone");assert.equal(g.active,1);assert.equal(g.blockAction,null);
});
test("Blitz target is fixed, cannot be unreachable, and may be skipped",()=>{
 const g=fixture([],"blitz"),a=g.players[0],d=g.players[11];d.x=25;assert.equal(g.startBlitz(a.id,d.id),false);
 d.x=12;g.startBlitz(a.id,d.id);g.finish();assert.equal(g.active,0);assert.ok(g.blitzUsed[0]);
 g.endTurn();g.endTurn();assert.equal(g.blitzUsed[0],false);
});
test("Blitz declaration uses activation traits and spends team Blitz on failure",()=>{
 const g=fixture([1],"blitz"),a=g.players[0],d=g.players[11];a.role=4;g.startBlitz(a.id,d.id);
 assert.ok(a.distracted);assert.equal(g.mover,null);assert.ok(g.blitzUsed[0]);assert.equal(g.active,0);
});

test("Block counts assists and gives the stronger coach result selection",()=>{
 const g=fixture([3,6],"block"),a=g.players[15],d=g.players[5];
 assert.ok(g.block(a.id,d.id));assert.equal(g.blockAction.aStrength,5);assert.equal(g.blockAction.dStrength,3);
 assert.equal(g.blockAction.count,2);assert.equal(g.blockAction.chooserTeam,1);assert.ok(a.used);
});
test("Block Player Down causes a turnover after armour",()=>{
 const g=fixture([1,1,1,1],"block"),a=g.players[15];g.block(a.id,g.players[5].id);g.selectBlockDie(0);
 assert.equal(a.status,"prone");assert.equal(g.active,0);assert.equal(g.blockAction,null);
});
test("Wrestle places both players prone without armour and causes a turnover",()=>{
 const g=fixture([2,2],"block"),a=g.players[15],d=g.players[5];g.block(a.id,d.id);g.selectBlockDie(0);choose(g,"Defender uses Wrestle");
 assert.equal(a.status,"prone");assert.equal(d.status,"prone");assert.equal(g.active,0);
});
test("Stand Firm can stop a push and end the Block",()=>{
 const g=fixture([3,3],"block"),a=g.players[15],d=g.players[5];g.block(a.id,d.id);g.selectBlockDie(0);choose(g,"Stand Firm");
 assert.deepEqual([d.x,d.y],[11,7]);assert.equal(g.blockAction,null);assert.equal(g.active,1);
});
test("Secure the Ball uses 2+ and ends activation on success",()=>{
 const g=fixture([2],"secure"),p=g.players[0];assert.ok(g.start(p.id,"secure"));
 for(let x=10;x<=15;x++)assert.ok(g.step(x,7));
 assert.equal(g.ball.carrier,p.id);assert.equal(g.mover,null);assert.equal(g.active,0);assert.ok(g.secureUsed[0]);
});
test("Secure failure bounces and turns over; ending short also turns over",()=>{
 const g=fixture([1,2],"secure"),p=g.players[0];g.start(p.id,"secure");for(let x=10;x<=15;x++)g.step(x,7);
 assert.equal(g.active,1);assert.equal(g.ball.carrier,null);assert.deepEqual([g.ball.x,g.ball.y],[15,6]);
 const h=fixture([],"secure");h.start(h.players[0].id,"secure");h.finish();assert.equal(h.active,1);
});
test("Secure excludes nearby standing opponents and Big Guys",()=>{
 const g=fixture([],"secure"),p=g.players[0],enemy=g.players[11];enemy.x=17;enemy.y=7;enemy.status="standing";
 assert.equal(g.canSecure(p),false);enemy.distracted=true;assert.ok(g.canSecure(p));p.role=4;assert.equal(g.canSecure(p),false);
});
test("Secure rolls immediately when already on the loose ball",()=>{
 const g=fixture([2],"secure"),p=g.players[0];p.x=g.ball.x;p.y=g.ball.y;g.start(p.id,"secure");
 assert.equal(g.ball.carrier,p.id);assert.equal(g.mover,null);
});
test("published engine equals tested source and scripts compile",()=>{
 assert.equal(html.match(/id="movement-engine">\n([\s\S]*?)<\/script>/)[1].trimEnd(),fs.readFileSync("movement.cjs","utf8").trimEnd());
 for(const m of html.matchAll(/<script(?: id="movement-engine")?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
test("adjacency, boundaries, occupation, zero movement and activation lock",()=>{
 const g=fixture([], "pickup");const p=g.players[0];assert.ok(g.start(p.id));
 assert.equal(g.start(g.players[1].id),false);
 assert.equal(g.step(-1,7),false);assert.equal(g.step(12,7),false);assert.equal(g.step(9,7),false);
 assert.ok(g.step(10,6));assert.equal(p.spent,1);assert.ok(g.step(9,5));assert.equal(p.spent,2);
 g.finish();assert.equal(g.start(p.id),false);assert.ok(g.start(g.players[1].id));g.finish();
 g.endTurn();g.endTurn();assert.ok(g.start(p.id));
});
test("six normal moves then exactly two rushes",()=>{
 const g=fixture([2,6],"pickup"),p=g.players[0];g.ball.x=24;g.start(p.id);
 for(const [x,y] of [[10,6],[10,5],[10,4],[10,3],[10,2],[10,1]])assert.ok(g.step(x,y));
 assert.ok(g.step(11,1));assert.ok(g.step(12,1));assert.equal(p.spent,8);assert.equal(g.step(13,1),false);
});
test("2025 dodge has no historical +1 modifier",()=>{
 const g=fixture([2,1,1]),p=g.players[0];g.start(p.id);g.step(9,6);
 assert.equal(p.status,"prone");assert.equal(g.active,1);assert.deepEqual([p.x,p.y],[9,6]);
});
test("destination markers penalize dodge and natural six succeeds",()=>{
 const g=fixture([3,1,1]);g.start(g.players[0].id);
 assert.equal(g.plan(10,6).target,4);g.step(10,6);assert.equal(g.active,1);
 const h=fixture([6]);h.start(h.players[0].id);h.step(10,6);assert.equal(h.active,0);
});
test("Stunty ignores dodge marking penalties, Dodge can re-roll once",()=>{
 const g=fixture([1,4,1,1,1]);const p=g.players[0];p.team=1;p.role=0;g.active=1;g.players[11].team=0;g.players[11].role=0;
 g.start(p.id);assert.equal(g.plan(10,6).target,3);g.step(10,6);assert.ok(g.pending.options.includes("Dodge"));choose(g,"Dodge");
 assert.ok(p.dodgeUsed);g.step(11,6);assert.equal(g.active,0);
});
test("failed rush is before dodge and falls in destination",()=>{
 const g=fixture([1,1,1]);const p=g.players[0];g.start(p.id);p.spent=6;g.step(10,6);
 assert.equal(p.status,"prone");assert.deepEqual([p.x,p.y],[10,6]);assert.equal(g.active,1);
 assert.equal(g.events.some(e=>e.startsWith("Dodge #")),false);
});
test("jump geometry, two movement cost, and no Dodge test",()=>{
 const g=fixture([3],"jump"),p=g.players[0];g.start(p.id);
 assert.equal(g.plan(12,7).jump,true);assert.equal(g.plan(12,8).cost,2);
 assert.equal(g.plan(10,9),null);g.step(12,7);assert.equal(p.spent,2);assert.equal(p.x,12);
 assert.equal(g.events.some(e=>e.startsWith("Dodge #")),false);
});
test("jump failure natural one falls at origin, other failure at target",()=>{
 for(const [roll,x] of [[1,10],[2,12]]){
  const g=fixture([roll,1,1],"jump"),p=g.players[0];g.start(p.id);g.step(12,7);assert.equal(p.x,x);assert.equal(g.active,1);
 }
});
test("jump rushing twice resolves before jump; failure stays at origin",()=>{
 const g=fixture([2,1,1,1],"jump"),p=g.players[0];g.start(p.id);p.spent=6;g.step(12,7);
 assert.equal(p.x,10);assert.equal(g.active,1);assert.equal(g.events.some(e=>e.startsWith("Jump #")),false);
});
test("jump uses higher endpoint marking count",()=>{
 const g=fixture([],"jump"),p=g.players[0],q=g.players[2];Object.assign(q,{team:1,role:0,status:"standing",x:13,y:7});g.start(p.id);
 assert.equal(g.plan(12,7).target,4);
});
test("standing consumes three movement, low MA uses a 4+ test",()=>{
 const g=fixture([],"jump"),p=g.players[1];g.start(p.id);assert.equal(p.status,"standing");assert.equal(p.spent,3);
 const h=fixture([2],"jump");h.teams=structuredClone(teams);h.teams[0].positions[0].ma=2;h.start(h.players[1].id);
 assert.equal(h.players[1].status,"prone");assert.equal(h.mover,null);assert.equal(h.active,0);
});
test("pickup succeeds and follows player",()=>{
 const g=fixture([3],"pickup"),p=g.players[0];g.start(p.id);g.step(11,7);assert.equal(g.ball.carrier,p.id);
 g.step(12,7);assert.equal(g.ball.carrier,p.id);
});
test("failed pickup bounces and turns over even when teammate catches",()=>{
 const g=fixture([1,4,6],"pickup"),p=g.players[0];g.start(p.id);g.step(11,7);
 // West bounce reaches empty origin (10,7).
 assert.equal(g.active,1);assert.equal(g.ball.x,10);
 const h=fixture([1,4,6],"pickup");Object.assign(h.players[1],{x:10,y:7});Object.assign(h.players[0],{x:10,y:6});
 h.start(h.players[0].id);h.step(11,7);assert.equal(h.ball.carrier,h.players[1].id);assert.equal(h.active,1);
});
test("failed pickup stays standing",()=>{
 const g=fixture([1,2],"pickup");g.start(g.players[0].id);g.step(11,7);assert.equal(g.players[0].status,"standing");
});
test("Bone Head failure consumes activation but no turnover; distraction clears on activation",()=>{
 const g=fixture([1,2],"traits"),p=g.players[0];g.start(p.id);assert.ok(p.distracted);assert.equal(g.mover,null);assert.equal(g.active,0);
 g.endTurn();g.endTurn();g.start(p.id);assert.equal(p.distracted,false);assert.equal(g.mover,p.id);
});
test("Really Stupid needs 2+ with standing helper, 4+ alone",()=>{
 const g=fixture([2],"traits"),p=g.players[11];g.endTurn();g.start(p.id);assert.equal(p.distracted,false);
 const h=fixture([3],"traits");h.players[1].status="prone";h.endTurn();h.start(h.players[11].id);assert.ok(h.players[11].distracted);
});
test("team reroll consumes pool and cannot reroll twice",()=>{
 const g=fixture([1,1,1,1]);g.rerolls[0]=2;g.start(g.players[0].id);g.step(9,6);
 assert.equal(g.endTurn(),false);choose(g,"Team");assert.equal(g.rerolls[0],1);assert.equal(g.pending,null);assert.equal(g.active,1);
});
test("multiple team rerolls allowed in same turn",()=>{
 const g=fixture([1,4,1,4]);g.rerolls[0]=2;g.start(g.players[0].id);g.step(10,6);choose(g,"Team");
 assert.equal(g.active,0);g.step(11,6);choose(g,"Team");assert.equal(g.active,0);assert.equal(g.rerolls[0],0);
});
test("Pro failure blocks other sources; successful Pro rerolls original die",()=>{
 const g=fixture([1,2,1,1]);g.players[0].role=1;g.rerolls[0]=2;g.start(g.players[0].id);g.step(9,6);choose(g,"Pro");
 assert.equal(g.rerolls[0],2);assert.equal(g.pending,null);assert.equal(g.active,1);
 const h=fixture([1,3,6]);h.players[0].role=1;h.start(h.players[0].id);h.step(9,6);choose(h,"Pro");assert.equal(h.active,0);
});
test("Loner failure loses team reroll without rerolling activation",()=>{
 const g=fixture([1,2],"traits");g.rerolls[0]=2;g.start(g.players[0].id);choose(g,"Team");
 assert.equal(g.rerolls[0],1);assert.ok(g.players[0].distracted);assert.equal(g.active,0);
});
test("armour, injury and stunned recovery wait through own next turn",()=>{
 const g=fixture([1,6,6,2,2]),p=g.players[0];g.start(p.id);g.step(9,6);assert.equal(p.status,"stunned");
 g.endTurn();assert.equal(p.status,"stunned");assert.equal(g.canStart(p),false);g.endTurn();assert.equal(p.status,"prone");
});
test("Thick Skull changes injury 8 to stunned",()=>{
 const g=fixture([2,1,6,6,4,4],"traits"),p=g.players[0];g.start(p.id);p.spent=5;g.step(10,6);assert.equal(p.status,"stunned");
});
test("knockout removes player from occupied squares",()=>{
 const g=fixture([1,6,6,4,4]),p=g.players[0];g.start(p.id);g.step(9,6);assert.equal(p.status,"knocked-out");assert.equal(g.at(9,6),undefined);
});
test("touchdown stops practice drive",()=>{
 const g=fixture([],"pickup"),p=g.players[0];p.x=24;p.y=7;g.ball.carrier=p.id;g.start(p.id);g.step(25,7);assert.ok(g.finished);assert.equal(g.endTurn(),false);
});

test("fall on loose ball bounces it without pickup",()=>{
 const g=fixture([1,1,1,2],"pickup"),p=g.players[0];g.start(p.id);p.spent=6;g.step(11,7);
 assert.equal(g.ball.carrier,null);assert.deepEqual([g.ball.x,g.ball.y],[11,6]);assert.equal(g.active,1);
});
test("bounce over prone or distracted players repeats without catch roll",()=>{
 const g=fixture([5,2],"jump");let done=false;g.bounce(10,7,()=>done=true);assert.ok(done);
 assert.deepEqual([g.ball.x,g.ball.y],[11,6]);
});
test("throw-in counts starting square, then bounces on empty landing",()=>{
 const g=fixture([3,1,1,2],"pickup");let done=false;g.throwIn(0,7,()=>done=true);
 assert.ok(done);assert.deepEqual([g.ball.x,g.ball.y],[1,6]);
});
test("corner throw-in stays inside and uses inward directions",()=>{
 const g=fixture([3,1,1,5],"pickup");let done=false;g.throwIn(0,0,()=>done=true);
 assert.ok(done);assert.deepEqual([g.ball.x,g.ball.y],[2,1]);
});
test("opposition Catch reroll available but no opposing team reroll",()=>{
 const g=fixture([1,6],"pickup"),p=g.players[11];p.role=3; // Black Orc team has no blitzer: use Nobility as opponent.
 p.team=0;g.active=1;g.rerolls=[2,2];p.x=18;p.y=7;
 g.landBall(18,7,false,()=>{});
 assert.deepEqual(g.pending.options,["Catch"]);choose(g,"Catch");assert.equal(g.ball.carrier,p.id);
});
test("Regeneration removes casualty to reserves",()=>{
 const g=fixture([2,1,6,6,6,6,4],"traits"),p=g.players[11];g.endTurn();g.start(p.id);p.spent=4;g.step(13,6);
 assert.equal(p.status,"reserve");assert.equal(g.onPitch(p),false);
});
test("prone and distracted opponents do not mark",()=>{
 const g=fixture([]),p=g.players[0],q=g.players[11];q.distracted=true;assert.equal(g.marking(p),0);
 q.distracted=false;q.status="prone";assert.equal(g.marking(p),0);
});
test("failed jump can use Pro and final die determines landing square",()=>{
 const g=fixture([1,3,2,1,1],"jump"),p=g.players[0];p.role=1;g.start(p.id);g.step(12,7);choose(g,"Pro");
 assert.equal(p.x,12);assert.equal(p.status,"prone");
});



