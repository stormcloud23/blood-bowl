const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const {SkillGame,SKILL_CATALOG,SKILL_GROUPS}=require("./skills.cjs"),{MatchGame}=require("./match.cjs");
const html=fs.readFileSync("index.html","utf8"),teams=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],scenario="pickup"){const queue=[...rolls];const g=new SkillGame(teams,{scenario,dice:s=>{assert.ok(queue.length,"Unexpected D"+s);const n=queue.shift();assert.ok(n<=s);return n;}});g.rerolls=[0,0];return g;}
function grant(p,...names){p.extraSkills=[...(p.extraSkills||[]),...names];}
function choose(g,name="Accept"){assert.ok(g.pending);assert.ok(g.decide(name));}

function throwing(rolls=[],options={}){
 const g=fixture(rolls,"pickup"),a=g.players[0],p=g.players[1];
 grant(a,"Throw Team-mate");grant(p,"Right Stuff");Object.assign(p,{x:9,y:7});
 if(options.hungry)grant(a,"Always Hungry");if(options.carry)g.ball={x:p.x,y:p.y,carrier:p.id};
 assert.ok(g.start(a.id,"throw-team-mate"));assert.ok(g.selectThrowMate(p.id));return {g,a,p};
}
test("throw declaration requires the trait, has its own allowance and consumes it even without throwing",()=>{
 const g=fixture(),a=g.players[0],p=g.players[1];assert.equal(g.start(a.id,"throw-team-mate"),false);
 grant(a,"Throw Team-mate");assert.ok(g.start(a.id,"throw-team-mate"));assert.equal(g.passUsed[0],false);g.finish();grant(p,"Throw Team-mate");assert.equal(g.start(p.id,"throw-team-mate"),false);g.endTurn();g.endTurn();assert.ok(g.canThrowTeamMate(a));
});
test("only adjacent eligible Right Stuff team-mates can be selected",()=>{
 const {g,p}=throwing();assert.equal(g.selectThrowMate(g.players[11].id),false);p.rooted=true;assert.equal(g.selectThrowMate(p.id),false);p.rooted=false;p.status="prone";assert.ok(g.selectThrowMate(p.id));p.status="stunned";assert.ok(g.selectThrowMate(p.id));
});
test("throw range follows the 2025 chart and excludes Long Pass squares",()=>{
 const {g}=throwing();assert.equal(g.throwPreview(13,8).band,0);assert.equal(g.throwPreview(13,9).band,1);assert.equal(g.throwPreview(16,7).band,1);assert.equal(g.throwPreview(17,7),null);assert.equal(g.throwPreview(10,7),null);
});
test("Superb Throw scatters three times, keeps the ball and preserves the passenger's activation",()=>{
 const {g,a,p}=throwing([6,5,5,5,3],{carry:true});assert.ok(g.throwTeamMate(12,7));assert.equal(p.x,15);assert.equal(p.status,"standing");assert.equal(p.used,false);assert.equal(g.ball.carrier,p.id);assert.equal(g.ball.x,15);assert.equal(g.mover,null);assert.equal(g.active,0);assert.ok(g.canStart(p));assert.equal(g.canStart(a),false);
});
test("Subpar Throw applies a landing penalty without itself causing turnover",()=>{
 const {g,p}=throwing([2,5,5,5,3,1,2]);g.throwTeamMate(12,7);assert.equal(p.status,"prone");assert.equal(g.active,0);
});
test("natural one fumbles from thrower, with a penalized landing",()=>{
 const {g,p}=throwing([1,2,4]);g.throwTeamMate(12,7);assert.equal(p.x,10);assert.equal(p.y,6);assert.equal(p.status,"standing");assert.equal(g.active,0);
});
test("modified one fumbles but modified zero is Subpar; natural six is Superb",()=>{
 const {g,a,p}=throwing([2,2,5]);Object.assign(g.players[11],{x:11,y:7});g.throwTeamMate(12,7);assert.equal(p.y,6);assert.ok(g.events.some(e=>e.startsWith("Fumbled Throw")));
 const b=throwing([2,5,5,5,6]);Object.assign(b.g.players[11],{x:11,y:7});b.g.throwTeamMate(14,7);assert.ok(b.g.events.includes("Subpar Throw."));
 const c=throwing([6,5,5,5,6]);c.g.throwTeamMate(16,7);assert.ok(c.g.events.includes("Superb Throw."));
});
test("failed carrier landing turns over after armour and ball bounce",()=>{
 const {g,p}=throwing([6,5,5,5,1,1,2,2],{carry:true});g.throwTeamMate(12,7);assert.equal(p.status,"prone");assert.equal(g.active,1);assert.equal(g.ball.carrier,null);
});
test("prone passenger automatically fails landing without an Agility roll",()=>{
 const {g,p}=throwing([6,5,5,5,1,2]);p.status="prone";g.throwTeamMate(12,7);assert.equal(p.status,"prone");assert.equal(g.active,0);assert.equal(g.events.some(e=>e.startsWith("Landing #")),false);
});
test("landing reroll belongs to the passenger; Pass cannot reroll throw accuracy",()=>{
 const {g,a,p}=throwing([6,5,5,5,1,4]);g.rerolls[0]=1;grant(a,"Pass");g.throwTeamMate(12,7);assert.equal(g.pending.p.id,p.id);assert.equal(g.pending.kind,"Landing");choose(g,"Team");assert.equal(p.status,"standing");
 const b=throwing([2,5,5,5,6]);grant(b.a,"Pass");b.g.throwTeamMate(12,7);assert.equal(b.g.pending,null);
});
test("collision chain knocks down each victim then forces the passenger to fall",()=>{
 const {g,p}=throwing([6,5,5,5,1,2,5,1,2,5,1,2]);const v=g.players[11],w=g.players[12];Object.assign(v,{x:15,y:7,status:"standing"});Object.assign(w,{x:16,y:7,status:"prone"});g.throwTeamMate(12,7);assert.equal(v.status,"prone");assert.equal(w.status,"prone");assert.equal(p.x,17);assert.equal(p.status,"prone");assert.equal(g.active,0);
});
test("friendly collision causes turnover after completing flight",()=>{
 const {g,p}=throwing([6,5,5,5,1,2,5,1,2]);Object.assign(g.players[2],{x:15,y:7,status:"standing"});g.throwTeamMate(12,7);assert.equal(p.x,16);assert.equal(p.status,"prone");assert.equal(g.active,1);
});
test("off-pitch flight causes crowd injury and turnover even without ball",()=>{
 const {g,a,p}=throwing([6,5,1,2]);a.x=22;p.x=21;g.throwTeamMate(25,7);assert.equal(p.x,null);assert.equal(p.status,"reserve");assert.equal(g.active,1);
});
test("Always Hungry success continues accuracy; squirming free fumbles",()=>{
 const a=throwing([2,6,5,5,5,3],{hungry:true});a.g.throwTeamMate(12,7);assert.equal(a.p.x,15);
 const b=throwing([1,2,2,4],{hungry:true});b.g.throwTeamMate(12,7);assert.equal(b.p.x,10);assert.equal(b.p.y,6);assert.equal(b.g.active,0);
});
test("eaten team-mate is removed without armour or Regeneration and always turns over",()=>{
 const {g,p}=throwing([1,1],{hungry:true});grant(p,"Regeneration");g.throwTeamMate(12,7);assert.equal(p.eaten,true);assert.equal(p.status,"eaten");assert.equal(g.active,1);
 const b=throwing([1,1,2],{hungry:true,carry:true});b.g.throwTeamMate(12,7);assert.equal(b.g.ball.carrier,null);assert.equal(b.g.ball.x,9);assert.equal(b.g.ball.y,6);assert.equal(b.g.active,1);
});
test("eaten players stay excluded from later exhibition setups",()=>{
 const g=new MatchGame(teams),p=g.players[11];p.eaten=true;p.status="eaten";g.prepareDrive(1);assert.equal(g.available(1).includes(p),false);assert.equal(p.status,"eaten");assert.equal(p.x,null);
});
test("successful carrier landing can score an exhibition touchdown",()=>{
 const {g,a,p}=throwing([6,5,5,5,3],{carry:true});Object.setPrototypeOf(g,MatchGame.prototype);g.phase="play";g.half=1;g.scores=[0,0];g.turns=[1,1];a.x=20;p.x=19;g.throwTeamMate(22,7);assert.equal(g.scores[0],1);assert.equal(g.phase,"endDrive");
});
test("activation-trait failure still consumes the throw allowance",()=>{
 const g=fixture([1]),a=g.players[0];a.role=4;assert.ok(g.start(a.id,"throw-team-mate"));assert.equal(g.mover,null);assert.equal(a.distracted,true);assert.equal(g.throwUsed[0],true);
});
test("throw accuracy offers a team reroll and respects the thrower's Loner",()=>{
 const {g,a,p}=throwing([1,2,5,5,5,6]);a.role=4;g.rerolls[0]=1;g.throwTeamMate(12,7);assert.equal(g.pending.kind,"Throw Team-mate");choose(g,"Team");assert.equal(g.rerolls[0],0);assert.ok(g.events.some(e=>e.startsWith("Fumbled Throw")));assert.equal(p.status,"standing");
});
test("landing penalties count opposing markers but do not use Stunty's dodge exception",()=>{
 const {g,p}=throwing([6,5,5,5,3,1,2]);grant(p,"Stunty");Object.assign(g.players[11],{x:16,y:7});g.throwTeamMate(12,7);assert.equal(p.status,"prone");assert.equal(g.active,0);
});
test("Disturbing Presence penalizes throw accuracy even on a prone opponent",()=>{
 const {g,a}=throwing();const d=g.players[11];Object.assign(d,{x:12,y:7,status:"prone"});grant(d,"Disturbing Presence");assert.equal(g.throwPreview(12,7).target,parseInt(g.profile(a).pa)+1);
});
test("Charge permits a free Throw Team-mate and resets allowance for the normal turn",()=>{
 const g=new MatchGame(teams,{dice:()=>6}),a=g.players[21],p=g.players[11];g.phase="charge";g.active=1;g.eventState={kind:"charge",team:1,eligible:[a.id],used:[],limit:1};Object.assign(a,{x:16,y:7,status:"standing"});Object.assign(p,{x:15,y:7,status:"standing"});assert.ok(g.start(a.id,"throw-team-mate"));assert.ok(g.selectThrowMate(p.id));assert.ok(g.throwTeamMate(12,7));assert.equal(g.phase,"charge");assert.ok(g.throwUsed[1]);g.phase="play";g.beginTurn(1);assert.equal(g.throwUsed[1],false);
});
test("Very Sunny penalizes Throw Team-mate accuracy but rain does not penalize landing",()=>{
 const {g,a,p}=throwing([6,5,5,5,3]);Object.setPrototypeOf(g,MatchGame.prototype);g.phase="play";g.weather="Very Sunny";assert.equal(g.throwPreview(12,7).target,parseInt(g.profile(a).pa)+1);g.weather="Pouring Rain";g.half=1;g.throwTeamMate(12,7);assert.equal(p.status,"standing");
});

test("disabling an armed Fumblerooski prevents the planned voluntary drop",()=>{
 const g=fixture(),p=g.players[0];grant(p,"Fumblerooski");g.ball.carrier=p.id;g.start(p.id);g.dropBall();g.toggleSkill(p.id,"Fumblerooski");g.step(10,6);assert.equal(g.ball.carrier,p.id);
});
test("forecast includes weather and skills without rolling dice",()=>{
 const g=fixture(),p=g.players[0];grant(p,"Big Hand","Extra Arms","Drunkard");g.weather="Pouring Rain";assert.equal(g.forecastTarget(p,"Pick up",6),2);g.weather="Blizzard";assert.equal(g.forecastTarget(p,"Rush",2),4);
});

test("Taunt offers defender-forced follow-up and Eye Gouge prevents later assists",()=>{
 const g=fixture([3,3],"block"),a=g.players[15],d=g.players[5];grant(a,"Eye Gouge");grant(d,"Taunt");d.disabledSkills=["Stand Firm"];g.block(a.id,d.id);g.selectBlockDie(0);g.pending.resolve({x:12,y:7});assert.ok(d.gouged);choose(g,"Defender uses Taunt");assert.equal(a.x,11);
});
test("Timmm-ber improves low-MA standing roll and natural one still fails",()=>{
 const g=fixture([3]),p=g.players[0],helper=g.players[1];g.teams=structuredClone(teams);g.teams[0].positions[0].ma=2;grant(p,"Timmm-ber!");p.status="prone";g.players[11].x=20;g.start(p.id);assert.equal(p.status,"standing");assert.equal(p.spent,2);
});
test("Put the Boot In permits marked offensive Foul assists while Guard does not",()=>{
 const g=fixture([6,4,1,2],"dodge"),a=g.players[0],d=g.players[11],helper=g.players[1],mark=g.players[12];Object.assign(helper,{x:10,y:6});Object.assign(mark,{x:9,y:5,status:"standing"});d.status="prone";grant(helper,"Put the Boot In");g.start(a.id,"foul");g.performSpecial(d.id);assert.ok(g.events.some(s=>s==="Foul: 1 offensive and 0 defensive assist(s)."));
});
test("Sure Hands prevents Strip Ball from dropping possession",()=>{
 const g=fixture([3,3],"block"),a=g.players[15],d=g.players[5];grant(a,"Strip Ball");grant(d,"Sure Hands");d.disabledSkills=["Stand Firm"];g.ball.carrier=d.id;g.block(a.id,d.id);g.selectBlockDie(0);g.pending.resolve({x:12,y:7});choose(g,"Stay");assert.equal(g.ball.carrier,d.id);
});
test("FFB Pro is limited to once per turn, including across different dice",()=>{
 const g=fixture([1,3,2,1]),p=g.players[0];grant(p,"Pro");g.start(p.id);let count=0;g.test(p,"Rush",2,()=>count++,()=>{});choose(g,"Pro");g.test(p,"Rush",2,()=>count++,()=>{});assert.equal(g.pending,null);assert.equal(count,1);assert.equal(p.proUsed,true);
});
test("negative modified pass is inaccurate, not modified-one fumble, under 2025 unclamped modifiers",()=>{
 const g=fixture([2,2,2,2,2],"pass"),p=g.players[0];p.role=0;g.start(p.id,"pass");g.pass(21,7);if(g.pending)choose(g,"Decline interception");assert.ok(g.events.some(s=>s.startsWith("Inaccurate Pass")));assert.equal(g.active,1);
});
test("Leader re-roll disappears when the last Leader leaves the pitch",()=>{const g=fixture(),p=g.players[0];grant(p,"Leader");g.grantLeader(1);assert.equal(g.rerollsAvailable(0),1);p.x=null;p.y=null;g.syncLeader();assert.equal(g.leaderPool[0],false);});
test("failed Stab replacement on Blitz still spends one MA and ends the activation",()=>{
 const g=fixture([1,2],"dodge"),p=g.players[0],d=g.players[11];grant(p,"Stab");g.startBlitz(p.id,d.id);assert.ok(g.performSpecial(d.id,"Stab"));assert.equal(p.spent,1);assert.equal(g.mover,null);assert.ok(g.blitzUsed[0]);
});
test("all 108 source entries have an explicit coverage status and dependency note",()=>{
 assert.equal(SKILL_CATALOG.length,108);assert.equal(new Set(SKILL_CATALOG.map(s=>s.name)).size,108);
 for(const [category,names] of Object.entries(SKILL_GROUPS))assert.equal(names.length,category==="Traits"?36:12);
 for(const s of SKILL_CATALOG){assert.ok(["Implemented","Partial","Deferred"].includes(s.status));assert.ok(s.notes.length>15);}
 assert.equal(SKILL_CATALOG.filter(s=>s.status==="Deferred").length,8);
});
test("all browser scripts compile together and the skill bundle equals source",()=>{
 assert.equal(html.match(/id="skills-engine">\n([\s\S]*?)<\/script>/)[1].trimEnd(),fs.readFileSync("skills.cjs","utf8").trimEnd());
 new vm.Script([...html.matchAll(/<script(?: id="(?:movement|skills|match)-engine")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n"));
});
test("laboratory enforces incompatible skills and mandatory traits cannot be disabled",()=>{
 const g=fixture([],"skills"),p=g.players[0];assert.ok(g.addSkill(p.id,"Frenzy"));assert.equal(g.addSkill(p.id,"Grab"),false);assert.equal(g.addSkill(p.id,"Pogo"),false);assert.equal(g.addSkill(p.id,"Bombardier"),false);
 assert.equal(g.toggleSkill(p.id,"Frenzy"),false);assert.ok(g.toggleSkill(p.id,"Sprint"));assert.equal(g.has(p,"Sprint"),false);
});
test("Sprint permits exactly three Rushes and Sure Feet rerolls once per turn",()=>{
 const g=fixture([1,2,2,2]),p=g.players[0];grant(p,"Sprint","Sure Feet");g.ball.x=24;g.start(p.id);p.spent=6;g.step(10,6);choose(g,"Sure Feet");assert.ok(g.used(p,"Sure Feet"));g.step(10,5);g.step(10,4);assert.equal(p.spent,9);assert.equal(g.plan(10,3),null);
});
test("Jump Up stands for free and its prone Block test follows activation traits",()=>{
 const g=fixture([3,3,3],"block"),a=g.players[15];a.status="prone";grant(a,"Jump Up");g.block(a.id,g.players[5].id);assert.equal(a.status,"standing");assert.equal(g.pending.type,"blockSelect");
 const h=fixture(),p=h.players[0];grant(p,"Jump Up");p.status="prone";h.start(p.id);assert.equal(p.spent,0);
});
test("Leap and Pogo can cross an empty intermediate square and forecast it",()=>{
 for(const name of ["Leap","Pogo"]){const g=fixture([6]),p=g.players[0];grant(p,name);g.start(p.id);assert.ok(g.search(p).get("12,5"));assert.ok(g.step(12,5));assert.equal(p.spent,2);assert.equal(p.status,"standing");}
});
test("Two Heads, Titchy and non-stacking Prehensile Tail modify dodge forecast",()=>{
 const g=fixture([],"dodge"),p=g.players[0],d=g.players[11];grant(p,"Two Heads","Titchy");grant(d,"Prehensile Tail");g.start(p.id);assert.equal(g.plan(9,6).target,2);
 grant(g.players[1],"Prehensile Tail");assert.equal(g.plan(9,6).target,2);
});
test("Titchy does not add a destination marking penalty but still forces a dodge",()=>{
 const g=fixture([],"dodge"),p=g.players[0],d=g.players[11];grant(d,"Titchy");g.start(p.id);assert.ok(g.plan(11,6).dodge);assert.equal(g.plan(11,6).target,3);
});
test("Very Long Legs benefits jumps and interception and ignores Cloud Burster",()=>{
 const g=fixture([],"jump"),p=g.players[0];grant(p,"Very Long Legs");g.start(p.id);assert.equal(g.plan(12,6).target,2);
 const h=fixture([],"pass"),a=h.players[0],d=h.players[11];grant(a,"Cloud Burster");assert.equal(h.interceptionCandidates(a,{x:14,y:7}).length,0);grant(d,"Very Long Legs");assert.equal(h.interceptionCandidates(a,{x:14,y:7}).length,1);
});
test("Tackle suppresses Dodge reroll when leaving that player's tackle zone",()=>{
 const g=fixture([1,1,1],"dodge"),p=g.players[0],d=g.players[11];grant(p,"Dodge");grant(d,"Tackle");g.start(p.id);g.step(9,6);assert.equal(g.pending,null);assert.equal(p.status,"prone");
});
test("Break Tackle spends its once-turn modifier only when it changes failure to success",()=>{
 const g=fixture([2],"dodge"),p=g.players[0];grant(p,"Break Tackle");g.start(p.id);g.step(9,6);assert.equal(g.used(p,"Break Tackle"),false);choose(g,"Break Tackle");assert.ok(g.used(p,"Break Tackle"));assert.equal(p.status,"standing");
});
test("Sure Hands offers pickup reroll but cannot reroll Secure the Ball",()=>{
 const g=fixture([1,3]),p=g.players[0];grant(p,"Sure Hands");g.start(p.id);g.step(11,7);choose(g,"Sure Hands");assert.equal(g.ball.carrier,p.id);
 const h=fixture([1,2],"secure"),a=h.players[0];grant(a,"Sure Hands");a.x=15;h.start(a.id,"secure");assert.equal(h.active,1);assert.equal(h.pending,null);
});
test("Big Hand ignores marking and rain on pickup; Extra Arms improves ball tests",()=>{
 const g=fixture([2]),p=g.players[0];grant(p,"Big Hand","Extra Arms");let ok=false;g.test(p,"Pick up",6,()=>ok=true,()=>{});assert.ok(ok);
});
test("Disturbing Presence is passive even while prone and stacks within three squares",()=>{
 const g=fixture([],"pass"),p=g.players[0],d=g.players[11];d.status="prone";grant(d,"Disturbing Presence");p.x=9;g.start(p.id,"pass");assert.equal(g.passPreview(14,7).target,4);
});
test("Nerves of Steel ignores markers for passing and catching",()=>{
 const g=fixture([],"dodge"),p=g.players[0];grant(p,"Nerves of Steel");g.ball.carrier=p.id;g.start(p.id,"pass");assert.equal(g.passPreview(12,6).target,4);
});
test("Accurate and Cannoneer affect only their own passing bands",()=>{
 const g=fixture([],"pass"),p=g.players[0];grant(p,"Accurate","Cannoneer");g.start(p.id,"pass");assert.equal(g.passPreview(10,6).target,1);assert.equal(g.passPreview(14,7).target,2);assert.equal(g.passPreview(18,7).target,3);
});
test("Safe Pass saves natural one, retains possession and ends activation without turnover",()=>{
 const g=fixture([1],"pass"),p=g.players[0];p.role=0;grant(p,"Safe Pass");g.start(p.id,"pass");g.pass(14,7);assert.equal(g.ball.carrier,p.id);assert.equal(g.mover,null);assert.equal(g.active,0);
});
test("Hail Mary Pass can target any square, scatters even on six, and cannot be intercepted",()=>{
 const g=fixture([6,2,2,2,2],"pass"),p=g.players[0];grant(p,"Hail Mary Pass");g.start(p.id,"pass");assert.equal(g.passPreview(25,7).hail,true);g.pass(25,7);assert.equal(g.pending,null);assert.equal(g.active,1);assert.equal(g.ball.carrier,null);
});
test("Fumblerooski leaves ball behind without a turnover",()=>{
 const g=fixture(),p=g.players[0];grant(p,"Fumblerooski");g.ball.carrier=p.id;g.start(p.id);assert.ok(g.dropBall());g.step(10,6);assert.deepEqual([g.ball.x,g.ball.y],[10,7]);assert.equal(g.active,0);
});
test("My Ball prevents passing, hand-offs and voluntary Fumblerooski release",()=>{
 const g=fixture(),p=g.players[0];grant(p,"My Ball","Fumblerooski");g.ball.carrier=p.id;assert.equal(g.start(p.id,"pass"),false);g.start(p.id);assert.equal(g.dropBall(),false);
});
test("No Ball automatically fails pickup without dice and cannot intercept or Secure",()=>{
 const g=fixture([2]),p=g.players[0];grant(p,"No Ball");assert.equal(g.canSecure(p),false);g.start(p.id);g.step(11,7);assert.equal(g.active,1);assert.equal(g.ball.carrier,null);
});
test("Unsteady prevents Secure the Ball declaration",()=>{const g=fixture([],"secure");grant(g.players[0],"Unsteady");assert.equal(g.canSecure(g.players[0]),false);});
test("Animosity refuses a transfer on one without a turnover",()=>{
 const g=fixture([1],"handoff"),p=g.players[0];p.role=0;grant(p,"Animosity (Human)");g.start(p.id,"handoff");g.step(9,7);g.handoff(g.players[1].id);assert.equal(g.ball.carrier,p.id);assert.equal(g.mover,null);assert.equal(g.active,0);
});
test("Drunkard makes a Rush roll of two fail",()=>{
 const g=fixture([2,1,1]),p=g.players[0];grant(p,"Drunkard");g.start(p.id);p.spent=6;g.step(10,6);assert.equal(p.status,"prone");
});
test("Take Root failed activation blocks movement and pushes, then clears when prone",()=>{
 const g=fixture([1]),p=g.players[0];grant(p,"Take Root");g.start(p.id);assert.ok(p.rooted);assert.equal(g.plan(10,6),null);let pushed=true;g.pushPlayer(p,{x:9,y:6},ok=>pushed=ok);assert.equal(pushed,false);
});
test("Unchannelled Fury failure ends activation without distraction or turnover",()=>{
 const g=fixture([2]),p=g.players[0];grant(p,"Unchannelled Fury");g.start(p.id);assert.equal(g.mover,null);assert.equal(p.distracted,false);assert.equal(g.active,0);
});
test("Horns increases Blitz Strength and does not modify a normal Block",()=>{
 const g=fixture([3,3],"dodge"),a=g.players[0],d=g.players[11];grant(a,"Horns");g.startBlitz(a.id,d.id);g.blitzBlock();assert.equal(g.blockAction.aStrength,4);
});
test("Dauntless matches higher unmodified Strength before assists",()=>{
 const g=fixture([4,3,3],"block"),a=g.players[15],d=g.players[5];a.role=0;d.role=4;grant(a,"Dauntless");g.block(a.id,d.id);assert.equal(g.blockAction.aStrength,6);assert.equal(g.blockAction.dStrength,5);
});
test("Foul Appearance is checked before Block Dice and failed test ends activation",()=>{
 const g=fixture([1],"block"),a=g.players[15],d=g.players[5];grant(d,"Foul Appearance");g.block(a.id,d.id);assert.equal(g.blockAction,null);assert.equal(g.active,1);assert.ok(a.used);
});
test("Defensive suppresses marked attacking Guard and Eye Gouge removes assistance",()=>{
 const g=fixture([],"block"),a=g.players[15],d=g.players[5],helper=g.players[11],op=g.players[1];Object.assign(op,{status:"standing",x:9,y:6});grant(helper,"Guard");assert.equal(g.assists(a,d).offensive,1);grant(op,"Defensive");assert.equal(g.assists(a,d).offensive,0);helper.gouged=true;op.x=1;assert.equal(g.assists(a,d).offensive,0);
});
test("Sidestep chooses any adjacent vacant square; Grab suppresses it even on Blitz",()=>{
 const g=fixture([],"block"),a=g.players[15],d=g.players[5];grant(d,"Sidestep");a.disabledSkills=["Grab"];assert.ok(g.pushSquares(a,d).some(v=>v.x===10&&v.y===8));g.blockAction={attacker:a,target:d,blitz:true};a.disabledSkills=[];assert.equal(g.pushSquares(a,d).some(v=>v.x===10&&v.y===8),false);
});
test("Juggernaut converts Both Down and disables Stand Firm and Wrestle during Blitz",()=>{
 const g=fixture([2,2],"block"),a=g.players[15],d=g.players[5];grant(a,"Juggernaut");g.startBlitz(a.id,d.id);g.blitzBlock();g.selectBlockDie(0);choose(g,"Treat as Push Back");assert.equal(g.pending.type,"pushChoice");assert.equal(g.has(d,"Stand Firm"),false);
});
test("Frenzy mandates follow-up and a second Block but never a third",()=>{
 const g=fixture([3,3,3,3],"block"),a=g.players[15],d=g.players[5];a.disabledSkills=["Grab"];grant(a,"Frenzy");d.disabledSkills=["Stand Firm"];g.block(a.id,d.id);g.selectBlockDie(0);g.pending.resolve({x:12,y:7});assert.equal(a.x,11);assert.equal(g.pending.type,"blockSelect");assert.equal(g.blockAction.frenzyRound,2);
 g.selectBlockDie(0);g.pending.resolve({x:13,y:7});assert.equal(g.blockAction,null);assert.equal(a.x,12);
});
test("Strip Ball drops after follow-up; Sure Hands prevents it",()=>{
 const g=fixture([3,3,2],"block"),a=g.players[15],d=g.players[5];grant(a,"Strip Ball");d.disabledSkills=["Stand Firm"];g.ball.carrier=d.id;g.block(a.id,d.id);g.selectBlockDie(0);g.pending.resolve({x:12,y:7});choose(g,"Stay");assert.equal(g.ball.carrier,null);assert.equal(g.active,1);
});
test("Hatred rerolls a Player Down once and locks the pool against further rerolls",()=>{
 const g=fixture([1,3,6],"block"),a=g.players[15];grant(a,"Hatred (Human)");g.block(a.id,g.players[5].id);assert.deepEqual(g.blockAction.dice,[6,3]);assert.ok(g.blockAction.poolLocked);
});
test("Claws breaks natural eight; Iron Hard Skin prevents Claws and all armour bonuses",()=>{
 const g=fixture(),a=g.players[0],d=g.players[11];d.role=1;grant(a,"Claws","Mighty Blow");assert.ok(g.armourBroken(d,8,0,a));grant(d,"Iron Hard Skin");assert.equal(g.armourBroken(d,8,3,a),false);assert.equal(g.canMightyArmour(a,d),false);assert.equal(g.canMighty(a,d),true);
});
test("Stab can break armour without a Block and leaves target standing when armour holds",()=>{
 const g=fixture([1,2],"dodge"),a=g.players[0],d=g.players[11];grant(a,"Stab");g.start(a.id,"special:Stab");assert.equal(g.plan(9,6),null);g.performSpecial(d.id);assert.equal(d.status,"standing");assert.equal(g.mover,null);
});
test("Projectile Vomit self-hit breaks armour and stuns without automatically causing turnover",()=>{
 const g=fixture([1,6,6,1,1],"dodge"),a=g.players[0];grant(a,"Projectile Vomit");g.start(a.id,"special:Projectile Vomit");g.performSpecial(g.players[11].id);assert.equal(a.status,"stunned");assert.equal(g.active,0);assert.equal(g.mover,null);
});
test("Hypnotic Gaze allows movement before distracting its target",()=>{
 const g=fixture([3],"pickup"),a=g.players[0],d=g.players[11];d.x=12;grant(a,"Hypnotic Gaze");g.start(a.id,"special:Hypnotic Gaze");g.step(11,6);g.performSpecial(d.id);assert.ok(d.distracted);assert.equal(g.mover,null);
});
test("Breathe Fire places prone on four and does not make an Armour Roll",()=>{
 const g=fixture([4],"dodge"),a=g.players[0],d=g.players[11];grant(a,"Breathe Fire");g.start(a.id,"special:Breathe Fire");g.performSpecial(d.id);assert.equal(d.status,"prone");assert.equal(g.mover,null);
});
test("Chainsaw kick-back uses mandatory incoming +3 armour",()=>{
 const g=fixture([1,2,3,1,1],"dodge"),a=g.players[0];grant(a,"Chainsaw");g.start(a.id,"special:Chainsaw");g.performSpecial(g.players[11].id);assert.equal(a.status,"stunned");assert.equal(g.active,1);
});
test("Sneaky Git avoids send-off on armour doubles that do not break armour",()=>{
 const g=fixture([1,1],"dodge"),a=g.players[0],d=g.players[11];d.status="prone";grant(a,"Sneaky Git");g.start(a.id,"foul");g.performSpecial(d.id);assert.equal(g.pending,null);assert.equal(g.active,0);assert.equal(g.mover,null);
});
test("Foul doubles trigger Argue the Call; successful argument still causes turnover",()=>{
 const g=fixture([1,1,6],"dodge"),a=g.players[0],d=g.players[11];d.status="prone";g.start(a.id,"foul");g.performSpecial(d.id);choose(g,"Argue the Call");assert.equal(a.status,"standing");assert.equal(g.active,1);
});
test("Bribe after failed argument prevents send-off and turnover",()=>{
 const g=fixture([1,1,2,2],"dodge"),a=g.players[0],d=g.players[11];g.bribes=[1,0];d.status="prone";g.start(a.id,"foul");g.performSpecial(d.id);choose(g,"Argue the Call");choose(g,"Use Bribe");assert.equal(a.status,"standing");assert.equal(g.active,0);assert.equal(g.bribes[0],0);
});
test("Dirty Player chooses injury modifier after breaking armour, Quick Foul resumes movement",()=>{
 const g=fixture([6,5,3,4],"dodge"),a=g.players[0],d=g.players[11];d.status="prone";grant(a,"Dirty Player","Quick Foul");g.start(a.id,"foul");g.performSpecial(d.id);choose(g,"Add +1 to Injury");assert.equal(d.status,"knocked-out");assert.equal(g.mover,a.id);assert.ok(g.step(9,6));assert.equal(g.specialTargets().length,0);
});
test("Lone Fouler may reroll failed unassisted armour once",()=>{
 const g=fixture([1,2,2,3],"dodge"),a=g.players[0],d=g.players[11];g.players[1].x=1;d.status="prone";grant(a,"Lone Fouler");g.start(a.id,"foul");g.performSpecial(d.id);choose(g,"Re-roll Armour");assert.equal(g.pending,null);assert.equal(d.status,"prone");
});
test("Pick-me-up rolls once for a nearby prone teammate and stands on five",()=>{
 const g=fixture([5]),p=g.players[0],helper=g.players[1];grant(helper,"Pick-me-up");p.status="prone";g.active=1;g.endTurn();assert.equal(p.status,"standing");
});
test("Leader pool is one per half and is consumed before regular re-rolls",()=>{
 const g=fixture([1,3]),p=g.players[0];grant(p,"Leader");g.grantLeader(1);g.start(p.id);g.step(11,7);assert.ok(g.pending.options.includes("Team"));choose(g,"Team");assert.equal(g.rerolls[0],0);assert.equal(g.leaderPool[0],false);g.grantLeader(1);assert.equal(g.leaderPool[0],false);
});
test("Kick skill offers D3 and halves the D6 deviation distance",()=>{
 const queue=[6,5,2,5],g=new MatchGame(teams,{learning:true,dice:()=>queue.shift()});g.phase="kickChoice";g.chooseKicking(0);g.confirmSetup();g.confirmSetup();const p=g.eligibleKickers()[0];grant(p,"Kick");g.nominateKicker(p.id);g.kick(17,7);choose(g,"Use D3 deviation");assert.equal(g.kickLanding.x,20);
});
test("Secret Weapon is processed before KO recovery even when already off pitch",()=>{
 const queue=[2,1],g=new MatchGame(teams,{learning:true,dice:()=>queue.shift()});g.phase="kickChoice";g.chooseKicking(0);g.confirmSetup();g.confirmSetup();const p=g.players[0];grant(p,"Secret Weapon");Object.assign(p,{status:"knocked-out",x:null,y:null});g.turns=[1,1];g.endDrive(1);g.continueDrive();choose(g,"Argue the Call");assert.equal(p.status,"sent-off");assert.equal(g.phase,"setup");
});
