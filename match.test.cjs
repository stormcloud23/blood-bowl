const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const {MatchGame}=require("./match.cjs");
const html=fs.readFileSync("index.html","utf8"),teams=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],learning=true){const queue=[...rolls];return new MatchGame(teams,{learning,dice:s=>{assert.ok(queue.length,"Unexpected D"+s);const n=queue.shift();assert.ok(n<=s,"Die outside range");return n;}});}
function setup(g,kicking=0){g.phase="kickChoice";g.firstReceiver=1-kicking;assert.ok(g.chooseKicking(kicking));assert.ok(g.confirmSetup());assert.ok(g.confirmSetup());assert.ok(g.nominateKicker(g.eligibleKickers()[0].id));return g;}
function kickoffTouchback(g){g.kick(25,7);assert.equal(g.phase,"touchback");g.decide(g.pending.options[0]);assert.equal(g.phase,"play");}

test("stalling crowd knockdown resolves armour and ball then causes turnover",()=>{
 const g=setup(fixture([1,1,1,2]));g.phase="play";g.active=0;g.turns=[1,0];g.rerolls=[0,0];const p=g.players[0];p.x=23;p.y=7;g.ball.carrier=p.id;
 assert.ok(g.start(p.id));assert.equal(g.stallCandidate,p.id);g.finish();assert.equal(p.status,"prone");assert.equal(g.active,1);assert.equal(g.ball.carrier,null);
});
test("Very Sunny modifies actual pass resolution as well as its preview",()=>{
 const g=setup(fixture([4,2,2,2,2]));g.phase="play";g.active=0;g.rerolls=[0,0];g.turns=[1,0];g.weather="Very Sunny";const p=g.players[0];p.x=5;p.y=7;g.ball.carrier=p.id;g.start(p.id,"pass");
 assert.equal(g.passPreview(7,7).target,5);g.pass(7,7);assert.equal(g.active,1);assert.ok(g.events.some(e=>e.startsWith("Inaccurate Pass")));
});
test("Blizzard changes a Rush 2 into a fall",()=>{
 const g=setup(fixture([2,1,1]));g.phase="play";g.active=0;g.turns=[1,0];g.rerolls=[0,0];g.weather="Blizzard";const p=g.players[0];p.x=5;g.start(p.id);p.spent=6;g.step(6,p.y);assert.equal(p.status,"prone");assert.equal(g.active,1);
});
test("both bundled engines match their source and all scripts compile together",()=>{
 assert.equal(html.match(/id="match-engine">\n([\s\S]*?)<\/script>/)[1].trimEnd(),fs.readFileSync("match.cjs","utf8").trimEnd());
 const source=[...html.matchAll(/<script(?: id="(?:movement|match)-engine")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n");new vm.Script(source);
});
test("exhibition pre-game fans, weather, league steps and tied roll-off resolve in order",()=>{
 const g=fixture([1,6,1,2,2,2,6,1],false);assert.equal(g.canStart(g.players[0]),false);
 g.advancePregame();assert.deepEqual(g.fans,[2,4]);g.advancePregame();assert.equal(g.weather,"Very Sunny");assert.equal(g.phase,"leagueSteps");
 g.advancePregame();g.advancePregame();assert.equal(g.rolloffWinner,0);assert.equal(g.phase,"kickChoice");g.chooseKicking(1);assert.equal(g.setupTeam,1);assert.equal(g.firstReceiver,0);
});
test("learning rules skip fan and weather dice but retain the roll-off",()=>{
 const g=fixture([3,1]);g.advancePregame();g.advancePregame();g.advancePregame();g.advancePregame();assert.deepEqual(g.fans,[1,1]);assert.equal(g.weather,"Perfect Conditions");assert.equal(g.rolloffWinner,0);
});
test("kicking team sets up first and legal formations enforce LOS and Wide Zones",()=>{
 const g=fixture();g.phase="kickChoice";g.chooseKicking(0);assert.deepEqual(g.setupErrors(),[]);assert.equal(g.placeSetup(g.players[0].id,14,6),false);
 g.players[0].x=10;assert.ok(g.setupErrors().some(s=>s.includes("Line")));assert.equal(g.confirmSetup(),false);g.autoSetup();g.confirmSetup();assert.equal(g.setupTeam,1);
 const list=g.players.filter(p=>p.team===1);Object.assign(list[3],{x:16,y:0});Object.assign(list[4],{x:17,y:0});Object.assign(list[5],{x:18,y:0});assert.ok(g.setupErrors().some(s=>s.includes("Wide")));
});
test("short roster fields every available player and three or fewer all take the line",()=>{
 const g=fixture();for(const p of g.players.filter(p=>p.team===0).slice(2))p.status="casualty";g.phase="kickChoice";g.chooseKicking(0);
 assert.equal(g.available(0).length,2);assert.deepEqual(g.setupErrors(),[]);assert.ok(g.players.filter(p=>p.team===0&&g.onPitch(p)).every(p=>p.x===12&&g.centre(p.y)));
});
test("nominate legal central backfield kicker and aim only in receiving half",()=>{
 const g=setup(fixture());assert.equal(g.phase,"kickAim");assert.equal(g.kick(12,7),false);assert.ok(g.eligibleKickers().every(p=>g.centre(p.y)&&p.x!==12));
});
test("kick deviates then lands and bounces before receiving turn one",()=>{
 const g=setup(fixture([1,5,2]));g.kick(20,7);assert.deepEqual([g.ball.x,g.ball.y],[21,6]);assert.equal(g.phase,"play");assert.equal(g.active,1);assert.deepEqual(g.turns,[0,1]);
});
test("off-pitch kick produces touchback instead of throw-in",()=>{
 const g=setup(fixture([6,5]));kickoffTouchback(g);assert.equal(g.ball.carrier,g.players[11].id);assert.equal(g.rerolls[1],2);
});
test("kickoff catch cannot use team reroll; bounce over LOS becomes touchback",()=>{
 const g=setup(fixture([1,4,1,4]));g.kick(14,6);assert.equal(g.phase,"touchback");assert.equal(g.rerolls[1],2);assert.equal(g.pending.kind.startsWith("Touchback"),true);
});
test("touchback with no standing receiver places ball in empty receiving square",()=>{
 const g=setup(fixture());g.players.filter(p=>p.team===1).forEach(p=>p.status="stunned");g.touchback();assert.equal(g.pending,null);assert.equal(g.placeTouchback(4,4),false);assert.ok(g.placeTouchback(24,7));assert.equal(g.phase,"play");
});
test("Kick-off Event occurs before an out-of-bounds kick grants a touchback",()=>{
 const g=setup(fixture([6,5,1,1],false));g.kick(25,7);assert.deepEqual(g.bribes,[1,1]);assert.equal(g.phase,"touchback");
});
test("TIME-OUT moves both markers forwards early and backwards late",()=>{
 const g=setup(fixture([1,5,1,2],false));g.kick(25,7);assert.deepEqual(g.turns,[1,1]);
 const h=setup(fixture([1,5,1,2],false));h.turns=[6,5];h.kick(25,7);assert.deepEqual(h.turns,[5,4]);
});
test("Solid Defence allows limited eligible redeployment and enforces final formation",()=>{
 const g=setup(fixture([1,5,1,3,1],false));g.kick(25,7);assert.equal(g.phase,"eventMove");assert.equal(g.eventState.limit,4);
 const id=g.eventState.eligible[0];assert.ok(id);const p=g.players.find(p=>p.id===id);assert.ok(g.eventPlace(id,10,0));const id2=g.eventState.eligible[1],p2=g.players.find(p=>p.id===id2),old={x:p2.x,y:p2.y};assert.ok(g.eventPlace(id2,11,1));assert.ok(g.setupErrors(0).length);assert.equal(g.finishEvent(),false);assert.ok(g.eventPlace(id2,old.x,old.y));assert.ok(g.finishEvent());assert.equal(g.phase,"touchback");
});
test("High Kick moves one Open receiver beneath the airborne ball",()=>{
 const g=setup(fixture([1,5,2,3,3],false));g.kick(20,7);assert.equal(g.pending.kind,"High Kick");g.decide(g.pending.options[0]);assert.equal(g.phase,"play");assert.ok(g.ball.carrier);
});
test("Cheering Fans grants one offensive assist to the winner's first Block",()=>{
 const g=setup(fixture([1,5,3,3,6,1],false));g.kick(25,7);assert.deepEqual(g.cheer,[true,false]);
 g.decide(g.pending.options[0]);g.endTurn();assert.equal(g.active,0);const a=g.players[0],d=g.players[11];assert.equal(g.assists(a,d).offensive,1);
});
test("Brilliant Coaching bonus reroll expires at end of drive",()=>{
 const g=setup(fixture([1,5,3,4,6,1],false));g.kick(25,7);assert.deepEqual(g.rerolls,[3,2]);g.decide(g.pending.options[0]);g.endDrive(1);g.continueDrive();assert.deepEqual(g.rerolls,[2,2]);
});
test("Changing Weather scatters airborne kick when conditions become Perfect",()=>{
 const g=setup(fixture([1,5,4,4,3,3,2,2,2,2],false));g.kick(21,7);assert.equal(g.weather,"Perfect Conditions");assert.deepEqual([g.ball.x,g.ball.y],[22,3]);assert.equal(g.phase,"play");
});
test("Quick Snap permits one square per selected Open player, including over LOS",()=>{
 const g=setup(fixture([1,5,4,5,1],false));g.kick(25,7);const id=g.eventState.eligible[0],p=g.players.find(p=>p.id===id),origin={x:p.x,y:p.y};
 assert.equal(g.eventPlace(id,p.x-2,p.y),false);assert.ok(g.eventPlace(id,p.x-1,p.y));assert.equal(g.eventPlace(id,origin.x,origin.y),false);g.finishEvent();assert.equal(g.phase,"touchback");
});
test("Charge free activations consume no normal turn and allow only movement or Blitz",()=>{
 const g=setup(fixture([1,5,4,6,1],false));g.kick(25,7);assert.equal(g.phase,"charge");const id=g.eventState.eligible[0];assert.equal(g.start(id,"pass"),false);assert.ok(g.start(id));g.finish();assert.equal(g.start(id),false);assert.deepEqual(g.turns,[0,0]);assert.ok(g.finishEvent());assert.equal(g.phase,"touchback");
});
test("Charge ends on a falling player's failed rush before ball landing",()=>{
 const g=setup(fixture([1,5,4,6,1,1,1,1],false));g.kick(25,7);const p=g.players.find(q=>q.id===g.eventState.eligible[0]);g.start(p.id);p.spent=g.profile(p).ma;
 const x=p.x-1,y=p.y;g.step(x,y);if(g.pending&&g.pending.kind==="Rush")g.decide("Accept");assert.equal(g.phase,"touchback");assert.deepEqual(g.turns,[0,0]);
});
test("Dodgy Snack applies temporary MA/AV loss and removes it after drive",()=>{
 const g=setup(fixture([1,5,5,6,1,6,1,2],false));g.kick(25,7);const p=g.players[0];assert.ok(p.snack);assert.equal(g.profile(p).ma,5);g.decide(g.pending.options[0]);g.endDrive(1);g.continueDrive();assert.equal(g.profile(p).ma,6);
});
test("Pitch Invasion uses Fan Factor and stuns random losers' players without armour",()=>{
 const g=setup(fixture([1,5,6,6,1,6,1,1],false));g.fans=[1,1];g.kick(25,7);assert.equal(g.players[0].status,"stunned");assert.equal(g.phase,"touchback");
});
test("two complete halves finish after 32 turns, swap ends, and replenish rerolls",()=>{
 const g=setup(fixture([6,5,6,5]));kickoffTouchback(g);g.rerolls=[0,0];for(let i=0;i<16;i++)g.endTurn();assert.equal(g.phase,"endDrive");g.continueDrive();
 assert.equal(g.half,2);assert.equal(g.kicking,1);assert.deepEqual(g.rerolls,[2,2]);assert.ok(g.ownHalf(0,20));assert.equal(g.ownHalf(0,3),false);
 g.confirmSetup();g.confirmSetup();g.nominateKicker(g.eligibleKickers()[0].id);kickoffTouchback(g);assert.equal(g.active,0);
 for(let i=0;i<16;i++)g.endTurn();g.continueDrive();assert.equal(g.phase,"finished");assert.deepEqual(g.turns,[8,8]);assert.equal(g.endTurn(),false);
});
test("touchdown records score, ends activation, recovers KO and restarts with scorer kicking",()=>{
 const g=setup(fixture([6,5,4]));kickoffTouchback(g);const p=g.players[11];p.x=0;g.checkScore();assert.deepEqual(g.scores,[0,1]);assert.equal(g.phase,"endDrive");assert.equal(g.canStart(p),false);
 const ko=g.players[0];Object.assign(ko,{x:null,y:null,status:"knocked-out"});g.continueDrive();assert.equal(g.kicking,1);assert.equal(ko.status,"reserve");assert.equal(g.half,1);assert.deepEqual(g.turns,[0,1]);
});
test("opposition-turn touchdown consumes scoring team's next turn before restart",()=>{
 const g=setup(fixture([6,5]));kickoffTouchback(g);const p=g.players[0];p.x=25;g.ball.carrier=p.id;g.checkScore();assert.deepEqual(g.turns,[1,1]);assert.deepEqual(g.scores,[1,0]);
});
test("Sweltering Heat excludes players for one drive; casualties remain unavailable",()=>{
 const g=setup(fixture([1,1,1]));g.weather="Sweltering Heat";g.turns=[1,1];g.endDrive(0);g.continueDrive();assert.equal(g.available(0).length,10);assert.equal(g.available(1).length,10);
 g.weather="Perfect Conditions";g.players[1].status="casualty";g.endDrive(0);g.continueDrive();assert.equal(g.available(0).length,10);assert.equal(g.available(1).length,11);
});
test("weather adjusts rush and ball checks, Sunny accuracy, and Blizzard range",()=>{
 const g=setup(fixture([2]));g.phase="play";g.weather="Pouring Rain";g.active=0;g.rerolls=[0,0];const p=g.players[0];let success=false;g.test(p,"Catch",2,()=>success=true,()=>{});assert.equal(success,false);
 g.weather="Very Sunny";p.x=5;g.start(p.id,"pass");g.ball.carrier=p.id;assert.equal(g.passPreview(p.x-2,p.y).target,5);
 g.weather="Blizzard";assert.equal(g.passRange({x:0,y:0},{x:10,y:0}),null);assert.equal(g.passRange({x:0,y:0},{x:6,y:0}).band,1);
});

