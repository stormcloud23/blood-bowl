// Execute the actual inline UI with a small DOM harness to cover event wiring.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function uiFixture(scenario='throw-team-mate'){
 const html=fs.readFileSync('index.html','utf8'),elements=new Map();
 class Element {
  constructor(){this.children=[];this.listeners={};this.value='';this.dataset={};this.textContent='';this.className='';}
  append(...items){this.children.push(...items);} replaceChildren(...items){this.children=[...items];}
  setAttribute(k,v){this[k]=v;} getAttribute(k){return this[k]??null;} addEventListener(k,f){this.listeners[k]=f;}
  after(){} before(){} scrollIntoView(){}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 get('team-data').textContent=html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1];get('scenario').value=scenario;
 const context=vm.createContext({document:{getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>[]},console});
 const scripts=[...html.matchAll(/<script(?: id="(?:movement|skills|match)-engine")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
 vm.runInContext(scripts,context);
 return {get,context,run:code=>vm.runInContext(code,context)};
}
function multipleUi(rolls){
 const f=uiFixture('dodge');f.run('game.players.forEach(p=>Object.assign(p,{status:"reserve",x:null,y:null}));globalThis.a=game.players[0];globalThis.d=game.players[11];globalThis.e=game.players[12];for(const p of [a,d,e]){p.profileOverride={...game.profile(p),skills:[],st:p===a?5:3,traits:"Lineman, Human"};p.status="standing";}Object.assign(a,{x:10,y:7,extraSkills:["Multiple Block"]});Object.assign(d,{x:11,y:7});Object.assign(e,{x:10,y:8});game.rerolls=[0,0];game.ball={x:20,y:14,carrier:null};selected=a.id;globalThis.rolls='+JSON.stringify(rolls)+';game.dice=()=>rolls.shift();render()');return f;
}
test('Multiple Block is declared through the actual special-action and target-order buttons',()=>{
 const {get,run}=multipleUi([3,3]);get('special').listeners.click();get('choices').children.find(e=>e.textContent==='Multiple Block').listeners.click();assert.equal(run('a.used'),false);
 const pair=get('choices').children.find(e=>e.textContent==='#1 (1-1) then #2 (1-2)');assert.ok(pair);pair.listeners.click();pair.listeners.click();assert.equal(run('a.used'),true);assert.equal(run('game.multipleContext.pools.length'),2);assert.equal(run('rolls.length'),0);assert.ok(get('choices').children.some(e=>e.textContent.includes('Multiple Block dice')));
});
test('Multiple Block defending coach receives both uphill pool result buttons',()=>{
 const {get,run}=multipleUi([3,3,3,3,3,3]);run('a.profileOverride.st=3;game.multipleBlock(a.id,[d.id,e.id]);render()');
 get('choices').children.find(e=>e.textContent==='Let defender choose #1').listeners.click();get('choices').children.find(e=>e.textContent==='Let defender choose #2').listeners.click();assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.startsWith(run('teams[1].name')+' — Multiple Block dice')));
});
test('Multiple Block UI preserves the second attack after Player Down and rejects a stale push click',()=>{
 const {get,run}=multipleUi([1,6,1,1,1,1]);run('game.multipleBlock(a.id,[d.id,e.id]);render()');
 get('choices').children.find(e=>e.textContent==='Choose #1 die 1: Player Down').listeners.click();get('choices').children.find(e=>e.textContent==='Choose #2 die 1: POW').listeners.click();assert.equal(run('game.active'),0);assert.equal(run('a.status'),'prone');
 const push=get('choices').children.find(e=>e.textContent.startsWith('Push to '));assert.ok(push);push.listeners.click();assert.equal(run('game.active'),1);push.listeners.click();assert.equal(run('game.active'),1);assert.equal(run('game.multipleContext'),null);
});
test('Multiple Block medical UI lets the defender choose the fatal injury before spending the apothecary',()=>{
 const {get,run}=multipleUi([6,6,6,6,6,6,1,1,6,6,6,6,16,1,1,1]);run('game.apothecaries[1]=1;game.multipleBlock(a.id,[d.id,e.id]);render()');
 for(const target of [1,2])get('choices').children.find(e=>e.textContent==='Choose #'+target+' die 1: POW').listeners.click();
 get('choices').children.find(e=>e.textContent.startsWith('Push to ')).listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Push to ')).listeners.click();assert.equal(run('game.pending.team'),1);
 get('choices').children.find(e=>e.textContent.startsWith('Resolve #2 injury')&&e.textContent.endsWith('Dead')).listeners.click();get('choices').children.find(e=>e.textContent==='Use Apothecary').listeners.click();assert.equal(run('e.status'),'reserve');assert.equal(run('d.status'),'casualty');assert.equal(run('game.apothecaries[1]'),0);assert.equal(run('game.multipleContext'),null);
});
test('Multiple Block Pro button opens a die choice and returns to the correct pool menu',()=>{
 const {get,run}=multipleUi([1,3,3,3]);run('a.extraSkills.push("Pro");game.multipleBlock(a.id,[d.id,e.id]);render()');get('choices').children.find(e=>e.textContent==='Pro #1').listeners.click();get('choices').children.find(e=>e.textContent==='Re-roll die 1').listeners.click();assert.equal(run('game.multipleContext.pools[0].dice[0]'),3);assert.ok(get('choices').children.some(e=>e.textContent==='Choose #1 die 1: Push Back'));assert.ok(!get('choices').children.some(e=>e.textContent==='Pro #2'));
});

test('exhibition pregame buttons add and remove one apothecary per team',()=>{
 const {get,run}=uiFixture('match');
 const add=get('matchflow').children.find(e=>e.textContent==='Add apothecary — '+run('teams[0].name'));assert.ok(add);add.listeners.click();assert.equal(run('game.apothecaries[0]'),1);
 const remove=get('matchflow').children.find(e=>e.textContent==='Remove apothecary — '+run('teams[0].name'));assert.ok(remove);remove.listeners.click();assert.equal(run('game.apothecaries[0]'),0);
});
test('apothecary UI preserves the defending coach and resumes the suspended action once',()=>{
 const {get,run}=uiFixture('dodge');run('game.apothecaries=[0,1];game.players[11].role=1;globalThis.rolls=[16,1,9,1];game.dice=()=>rolls.shift();globalThis.medicalCalls=0;game.injuryResult(game.players[11],10,()=>medicalCalls++);render()');
 assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.includes(run('teams[1].name')+' — Apothecary')));
 const old=get('choices').children.find(e=>e.textContent==='Use Apothecary');old.listeners.click();assert.equal(run('medicalCalls'),0);old.listeners.click();assert.equal(run('game.apothecaries[1]'),0);
 get('choices').children.find(e=>e.textContent==='Use new: Seriously hurt').listeners.click();assert.equal(run('medicalCalls'),1);assert.equal(run('game.players[11].casualty.result'),'Seriously hurt');assert.match(get('dugout').textContent,/Seriously hurt/);
});
test('apothecary cure button cannot erase a fall turnover in the bundled UI',()=>{
 const {get,run}=uiFixture('dodge');run('game.apothecaries=[1,0];globalThis.rolls=[6,6,6,6,1,1];game.dice=()=>rolls.shift();game.fall(game.players[0]);render()');assert.equal(run('game.active'),0);
 get('choices').children.find(e=>e.textContent==='Use Apothecary').listeners.click();assert.equal(run('game.active'),1);assert.equal(run('game.players[0].status'),'reserve');
});
test('Plague Ridden choice buttons create the selected team lineman and reject double clicks',()=>{
 const {get,run}=uiFixture('dodge');run('teams[0].positions.push({...teams[0].positions[0],name:"Alternate Lineman"});game.players[0].extraSkills=["Plague Ridden"];game.players[11].role=1;globalThis.rolls=[16,1];game.dice=()=>rolls.shift();game.resolveInjury(game.players[11],10,()=>{},{source:{playerId:game.players[0].id,cause:"Block"},plague:true});render()');
 assert.equal(run('game.pending.team'),0);const button=get('choices').children.find(e=>e.textContent.startsWith('Raise Alternate Lineman'));assert.ok(button);button.listeners.click();button.listeners.click();assert.equal(run('game.players.length'),23);assert.equal(run('game.profile(game.players.at(-1)).name'),'Alternate Lineman');
});

test('Tentacles defending coach choice in the bundled UI suspends a committed route',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Tentacles"];game.dice=()=>6;game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 assert.equal(run('game.pending.team'),1);
 assert.ok(get('choices').children.some(e=>e.textContent.includes('Tentacles')));
 const choice=get('choices').children.find(e=>e.textContent.includes('(1-1)'));assert.ok(choice);choice.listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.mover'),null);assert.equal(run('game.players[0].x'),10);assert.equal(run('game.active'),0);
});
test('Shadowing defending coach button resumes a dodge in the bundled UI',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Shadowing"];game.dice=()=>6;game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.includes('Shadowing')));
 get('choices').children.find(e=>e.textContent.includes('(1-1)')).listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.players[11].x'),10);assert.equal(run('game.players[0].x'),9);assert.equal(run('game.interruptions.length'),0);
});
test('Arm Bar owner and injury modifier are both reachable through browser buttons',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Arm Bar"];game.rerolls=[0,0];globalThis.rolls=[1,6,6,4,5,1,1];game.dice=()=>rolls.shift();game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 get('choices').children.find(e=>e.textContent.includes('(1-1)')).listeners.click();assert.equal(run('game.pending.team'),1);
 assert.ok(get('choices').children.some(e=>e.textContent===run('teams[1].name')+' — Arm Bar — choose:'));
 get('choices').children.find(e=>e.textContent==='Add +1 to Injury').listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.players[0].status'),'casualty');assert.equal(run('game.active'),1);
});
test('Diving Tackle UI gives the moving coach the look-ahead re-roll before defender choice',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Diving Tackle"];game.rerolls=[1,0];globalThis.rolls=[3,6];game.dice=()=>rolls.shift();game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 assert.ok(get('choices').children.some(e=>e.textContent.includes('before the defender decides')));assert.ok(get('choices').children.some(e=>e.textContent==='Keep this result'));
 get('choices').children.find(e=>e.textContent==='Use team re-roll').listeners.click();assert.equal(run('game.pending.team'),1);
 get('choices').children.find(e=>e.textContent.includes('(1-1)')).listeners.click();assert.equal(run('game.players[11].status'),'prone');assert.equal(run('game.players[0].status'),'standing');assert.equal(run('game.pending'),null);
});
test('Diving Tackle route preview includes the possible defender modifier',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Diving Tackle"];selected=game.players[0].id;render()');
 assert.match(get('pitch').children[6*26+9].title,/Dodge 5\+ \(if Diving Tackle is used\)/);
});
test('Steady Footing UI resumes a failed movement check and rejects a double click',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Steady Footing"];game.rerolls=[0,0];globalThis.rolls=[1,6];game.dice=()=>rolls.shift();game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 const choice=get('choices').children.find(e=>e.textContent==='Use Steady Footing');assert.ok(choice);choice.listeners.click();choice.listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.players[0].status'),'standing');assert.equal(run('game.active'),0);assert.equal(run('game.interruptions.length'),0);
});
test('a stale Steady Footing button cannot answer the next Rush failure decision',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Steady Footing","Leap"];game.rerolls=[0,0];globalThis.rolls=[1,6,1,6,6];game.dice=()=>rolls.shift();game.start(game.players[0].id);game.players[0].spent=game.profile(game.players[0]).ma;game.step(8,7);render()');
 const old=get('choices').children.find(e=>e.textContent==='Use Steady Footing');old.listeners.click();assert.equal(run('rolls.length'),2);old.listeners.click();assert.equal(run('rolls.length'),2);
 get('choices').children.find(e=>e.textContent==='Use Steady Footing').listeners.click();assert.equal(run('game.pending'),null);assert.equal(run('game.players[0].x'),8);assert.equal(run('rolls.length'),0);
});
test('Diving Catch UI selects an adjacent receiver and rejects the stale decision button',()=>{
 const {get,run}=uiFixture('pass');run('game.players[11].status="reserve";game.players[11].x=null;game.players[11].y=null;game.players[1].y=6;game.players[1].extraSkills=["Diving Catch"];game.rerolls=[0,0];game.dice=()=>6;game.start(game.players[0].id,"pass");game.pass(14,7);render()');
 assert.ok(get('choices').children.some(e=>e.textContent.includes('Diving Catch')));const choice=get('choices').children.find(e=>e.textContent.includes('(0-2)'));assert.ok(choice);choice.listeners.click();choice.listeners.click();assert.equal(run('game.ball.carrier'),'0-2');assert.equal(run('game.active'),0);assert.equal(run('game.pending'),null);
});
test('Safe Pair of Hands UI places the ball and resumes armour exactly once',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Safe Pair of Hands"];game.ball={x:10,y:7,carrier:game.players[0].id};game.rerolls=[0,0];globalThis.rolls=[1,1];game.dice=()=>rolls.shift();game.fall(game.players[0]);render()');
 assert.equal(run('game.players[0].status'),'standing');const choice=get('choices').children.find(e=>e.textContent.startsWith('Place ball at'));assert.ok(choice);choice.listeners.click();choice.listeners.click();assert.equal(run('game.players[0].status'),'prone');assert.equal(run('game.ball.carrier'),null);assert.equal(run('game.active'),1);assert.equal(run('rolls.length'),0);assert.equal(run('game.pending'),null);
});
test('Safe Pair of Hands UI decline bounces the ball normally',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Safe Pair of Hands"];game.ball={x:10,y:7,carrier:game.players[0].id};game.rerolls=[0,0];globalThis.rolls=[1,1,7];game.dice=()=>rolls.shift();game.fall(game.players[0]);render()');
 get('choices').children.find(e=>e.textContent==='Bounce normally').listeners.click();assert.equal(run('game.ball.x'),10);assert.equal(run('game.ball.y'),8);assert.equal(run('game.active'),1);assert.equal(run('rolls.length'),0);
});
test('accurate Pass preview reflects the receiver Diving Catch bonus',()=>{
 const {get,run}=uiFixture('pass');run('game.players[1].extraSkills=["Diving Catch"];game.start(game.players[0].id,"pass");selected=game.players[0].id;ballMode=true;throwDestination={x:14,y:7};render()');assert.ok(get('choices').children.some(e=>e.textContent.includes('Catch 2+ (accurate delivery)')));
});
test('Kick Team-mate UI declares, selects a passenger and completes the existing flight flow',()=>{
 const {get,run}=uiFixture('pickup');run('game.players[0].extraSkills=["Kick Team-mate"];game.players[1].extraSkills=["Right Stuff"];game.rerolls=[0,0];game.dice=()=>6;selected=game.players[0].id;render()');
 assert.equal(get('kick-mate').disabled,false);get('kick-mate').listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Throw team-mate #')).listeners.click();run('choose(12,7);choose(12,7)');assert.equal(run('game.players[1].x'),9);assert.equal(run('game.players[1].y'),10);assert.equal(run('game.kickUsed[0]'),true);assert.equal(run('game.passUsed[0]'),false);
});
test('Swoop UI uses the selected template before landing',()=>{
 const {get,run}=uiFixture();run('game.players[11].extraSkills=["Swoop"];game.rerolls=[0,0];game.dice=()=>6');get('throw-mate').listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Throw team-mate #')).listeners.click();run('choose(12,7);choose(12,7)');get('choices').children.find(e=>e.textContent==='North').listeners.click();assert.equal(run('game.players[11].status'),'standing');assert.equal(run('game.pending'),null);
});
test('Trickster UI relocates the defender before selecting Block dice',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Trickster"];game.dice=()=>6;game.block(game.players[0].id,game.players[11].id);render()');get('choices').children.find(e=>e.textContent.startsWith('Relocate to')).listeners.click();assert.equal(run('game.pending.type'),'blockSelect');assert.equal(run('game.players[11].x'),9);
});
test('Dump-off UI completes an out-of-turn pass then returns to the interrupted Block',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Dump-off"];game.ball={x:11,y:7,carrier:game.players[11].id};game.rerolls=[0,0];game.dice=()=>6;game.block(game.players[0].id,game.players[11].id);render()');get('choices').children.find(e=>e.textContent==='Quick pass to 14, 8').listeners.click();assert.equal(run('game.pending.type'),'blockSelect');assert.equal(run('game.dumpContext'),null);assert.equal(run('game.active'),0);
});
test('Hit and Run UI offers a free move after a Block and retains Blitz state',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Hit and Run"];game.mover=game.players[0].id;game.action="blitz";game.blockAction={attacker:game.players[0],target:game.players[11],blitz:true,assists:{offensive:0,defensive:0}};game.finishBlock();render()');get('choices').children.find(e=>e.textContent.startsWith('Move free to')).listeners.click();assert.equal(run('game.players[0].x'),9);assert.equal(run('game.action'),'blitz');assert.equal(run('game.pending'),null);
});
test('Punt UI allows movement declaration, template choice and ground resolution',()=>{
 const {get,run}=uiFixture('pickup');run('game.players[0].extraSkills=["Punt"];game.ball={x:10,y:7,carrier:game.players[0].id};game.rerolls=[0,0];game.dice=()=>6;game.start(game.players[0].id,"special:Punt");render()');get('choices').children.find(e=>e.textContent==='Punt now').listeners.click();get('choices').children.find(e=>e.textContent==='North').listeners.click();assert.equal(run('game.active'),0);assert.equal(run('game.action'),null);assert.equal(run('game.passUsed[0]'),false);
});
test('Chomp UI replaces a Blitz Block without ending the Blitz activation',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Monstrous Mouth"];game.dice=()=>6;game.startBlitz(game.players[0].id,game.players[11].id);render()');get('choices').children.find(e=>e.textContent==='Blitz: Chomp (1 MA)').listeners.click();assert.equal(run('game.isChomped(game.players[11])'),true);assert.equal(run('game.action'),'blitz');
});
test('Pile Driver UI runs a free foul and places the attacker prone',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Pile Driver"];game.players[11].status="prone";game.rerolls=[0,0];globalThis.rolls=[1,2];game.dice=()=>rolls.shift();game.blockAction={attacker:game.players[0],target:game.players[11],blitz:false,targetKnocked:true,assists:{offensive:0,defensive:0}};game.finishBlock();render()');get('choices').children.find(e=>e.textContent==='Free foul').listeners.click();assert.equal(run('game.players[0].status'),'prone');assert.equal(run('game.blockAction'),null);assert.equal(run('game.scoreDeferrals'),0);
});
test('On the Ball UI finishes defensive movement before the pass dice',()=>{
 const {get,run}=uiFixture('pass');run('game.players[11].extraSkills=["On the Ball"];game.rerolls=[0,0];game.dice=()=>6;game.start(game.players[0].id,"pass");game.pass(14,7);render()');get('choices').children.find(e=>e.textContent.includes('(1-1)')).listeners.click();get('choices').children.find(e=>e.textContent==='Move to 12, 7').listeners.click();get('choices').children.find(e=>e.textContent==='Stop moving').listeners.click();assert.equal(run('game.ball.carrier'),'0-2');assert.equal(run('game.moveContext'),null);assert.equal(run('game.active'),0);
});
test('Chainsaw foul UI chooses the chainsaw and runs kickback before armour',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Chainsaw"];game.players[11].status="prone";game.rerolls=[0,0];globalThis.rolls=[2,1,2];game.dice=()=>rolls.shift();game.start(game.players[0].id,"foul");game.performSpecial(game.players[11].id);render()');get('choices').children.find(e=>e.textContent==='Use Chainsaw').listeners.click();assert.equal(run('game.players[0].status'),'standing');assert.equal(run('game.pending'),null);assert.equal(run('rolls.length'),0);
});
test('Saboteur UI resolves the automatic KO and collateral fall before Block cleanup',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Saboteur","Secret Weapon"];game.rerolls=[0,0];globalThis.rolls=[6,1,1];game.dice=()=>rolls.shift();game.blockAction={attacker:game.players[0],target:game.players[11],blitz:false,assists:{offensive:0,defensive:0}};game.fall(game.players[11],{turnover:false,mightyBlowBy:game.players[0],after:()=>game.finishBlock()});render()');const choice=get('choices').children.find(e=>e.textContent==='Use Saboteur');choice.listeners.click();choice.listeners.click();assert.equal(run('game.players[11].status'),'knocked-out');assert.equal(run('game.players[0].status'),'prone');assert.equal(run('game.active'),0);assert.equal(run('game.scoreDeferrals'),0);assert.equal(run('rolls.length'),0);
});
test('throw practice UI declares, selects, previews and commits a throw',()=>{
 const {get,context}=uiFixture();
 vm.runInContext('game.dice=()=>6',context);
 assert.equal(get('throw-mate').disabled,false);get('throw-mate').listeners.click();
 const passenger=get('choices').children.find(c=>c.textContent.startsWith('Throw team-mate #'));assert.ok(passenger);passenger.listeners.click();
 assert.ok(get('choices').children.some(c=>c.textContent.includes('highlighted square')));
 vm.runInContext('choose(12,7)',context);assert.ok(get('choices').children.some(c=>c.textContent.includes('Click again')));
 vm.runInContext('choose(12,7)',context);assert.equal(vm.runInContext('game.mover',context),null);
 assert.ok(vm.runInContext('game.events.some(e=>e.includes("lands on their feet"))',context));
});

test('Break Tackle modifier decision is exposed by the bundled browser UI',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Break Tackle"];game.dice=()=>2;game.start(game.players[0].id);game.step(9,6);render()');
 const choice=get('choices').children.find(e=>e.textContent==='Use Break Tackle');assert.ok(choice);assert.equal(run('game.used(game.players[0],"Break Tackle")'),false);
 choice.listeners.click();assert.equal(run('game.used(game.players[0],"Break Tackle")'),true);assert.equal(run('game.pending'),null);
});

test('Bullseye choice in the bundled UI resumes landing without scatter',()=>{
 const {get,run}=uiFixture();run('game.players.find(p=>p.id===game.practicePlayer).extraSkills=["Bullseye"];game.dice=()=>6');get('throw-mate').listeners.click();
 get('choices').children.find(c=>c.textContent.startsWith('Throw team-mate #')).listeners.click();
 run('choose(12,7);choose(12,7)');const choice=get('choices').children.find(e=>e.textContent==='Use Bullseye');assert.ok(choice);choice.listeners.click();
 assert.equal(run('game.events.some(e=>e.startsWith("Thrown player scatter:"))'),false);assert.equal(run('game.mover'),null);
});

test('Pro fallback is reachable through browser buttons and resumes the original check',()=>{
 const {get,run}=uiFixture('pickup');run('game.players[0].extraSkills=["Pro"];game.rerolls[0]=1;globalThis.rolls=[1,1,3,6];game.dice=()=>rolls.shift();game.start(game.players[0].id);game.test(game.players[0],"Rush",2,()=>game.note("Original check passed"),()=>{});render()');
 get('choices').children.find(e=>e.textContent==='Use Pro').listeners.click();get('choices').children.find(e=>e.textContent==='Team re-roll Pro').listeners.click();
 assert.equal(run('game.events.includes("Original check passed")'),true);assert.equal(run('game.rerolls[0]'),0);assert.equal(run('game.pending'),null);
});
test('movement tiles mark only their arrival check, with route-specific dodge and rush highlights',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;render()');
 const square=(x,y)=>get('pitch').children[y*26+x];
 assert.match(square(9,6).className,/\brisk\b/);
 assert.match(square(9,6).title,/Dodge/);
 assert.doesNotMatch(square(8,5).className,/\brisk\b/);
 assert.match(square(8,5).title,/no roll on this step/);
 assert.match(square(3,7).className,/\brisk\b/);
 assert.match(square(3,7).title,/Rush/);
 run('choose(8,5)');
 assert.match(square(9,6).className,/\broute\b/);
 assert.match(square(9,6).className,/\brisk\b/);
 assert.match(square(8,5).className,/\broute\b/);
 assert.doesNotMatch(square(8,5).className,/\brisk\b/);
});
test('safe detour is green and default while explicit adjacent steps retain the dodge shortcut',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players.forEach(p=>{p.x=null;p.y=null;p.status="reserve"});Object.assign(game.players[0],{x:5,y:5,status:"standing"});Object.assign(game.players[1],{x:6,y:5,status:"standing"});Object.assign(game.players[11],{x:7,y:5,status:"standing"});game.ball={x:0,y:0,carrier:null};selected=game.players[0].id;render()');
 const square=get('pitch').children[7*26+7];
 assert.doesNotMatch(square.className,/\brisk\b/);
 assert.match(square.title,/Reachable in 3 movement/);
 run('choose(7,7)');
 assert.equal(run('destination.spent'),3);
 assert.equal(run('destination.path.some(s=>s.plan.dodge||s.plan.rushes||s.plan.jump||s.plan.pickup)'),false);
 run('cancelMovementPreview();choose(6,6);choose(7,7)');
 assert.equal(run('destination.spent'),2);
 assert.equal(run('destination.path.at(-1).plan.dodge'),true);
});

test('waypoint preview spends hypothetical MA and cancellation restores the starting range without moving',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;render()');
 const square=(x,y)=>get('pitch').children[y*26+x];
 const before=run('JSON.stringify({players:game.players,ball:game.ball,events:game.events,rerolls:game.rerolls})');
 assert.match(square(15,7).className,/\blegal\b/);
 run('choose(6,5)');
 assert.equal(run('previewRoute(planningPlayer()).spent'),4);
 assert.doesNotMatch(square(15,7).className,/\blegal\b/);
 assert.ok(get('choices').children.some(e=>e.textContent.includes('2 normal MA and 2 Rush(es) remaining')));
 assert.equal(run('JSON.stringify({players:game.players,ball:game.ball,events:game.events,rerolls:game.rerolls})'),before);
 get('choices').children.find(e=>e.textContent==='Cancel movement preview').listeners.click();
 assert.equal(run('destination'),null);assert.match(square(15,7).className,/\blegal\b/);
 assert.equal(run('JSON.stringify({players:game.players,ball:game.ball,events:game.events,rerolls:game.rerolls})'),before);
});
test('preview extension preserves waypoints, rush costs and the exact committed route',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;game.dice=()=>6;render();choose(6,5);choose(6,7)');
 assert.equal(run('destination.spent'),6);
 assert.equal(run('destination.path.some(s=>s.x===6&&s.y===5)'),true);
 run('choose(5,7)');assert.equal(run('destination.spent'),7);
 assert.ok(get('choices').children.some(e=>e.textContent.includes('0 normal MA and 1 Rush(es) remaining')));
 get('choices').children.find(e=>e.textContent==='Declare Move to begin').listeners.click();
 assert.equal(run('game.players[0].x'),10);
 run('choose(5,7)');assert.equal(run('game.players[0].x'),5);assert.equal(run('game.players[0].y'),7);assert.equal(run('game.players[0].spent'),7);assert.equal(run('destination'),null);
 assert.equal(run('game.events.some(e=>e.includes("moved to 7, 6"))'),true);
});
test('active-move cancellation restores the current remaining range and never refunds spent movement',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;game.dice=()=>6;game.start(selected);game.step(9,6);render()');
 run('choose(5,4)');assert.equal(run('game.players[0].spent'),1);
 get('choices').children.find(e=>e.textContent==='Cancel movement preview').listeners.click();
 assert.equal(run('game.players[0].spent'),1);assert.equal(run('game.players[0].x'),9);
 assert.equal(run('remainingRange(planningPlayer(),previewRoute(planningPlayer())).get("4,6").spent'),6);
});
test('forecast carries a hypothetically picked-up ball and Secure the Ball offers no continuation',()=>{
 const {run}=uiFixture('pickup');run('selected=game.players[0].id;render();choose(11,7)');
 assert.equal(run('game.ball.carrier'),null);
 assert.equal(run('[...remainingRange(planningPlayer(),previewRoute(planningPlayer())).values()].some(r=>r.path.some(s=>s.plan.pickup))'),false);
 run('cancelMovementPreview();game.start(selected,"secure");choose(11,7)');
 assert.equal(run('remainingRange(planningPlayer(),previewRoute(planningPlayer())).size'),0);
});
