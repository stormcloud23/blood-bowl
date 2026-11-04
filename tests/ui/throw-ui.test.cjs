const {projectPath}=require('../helpers/project.cjs');
// Execute the actual inline UI with a small DOM harness to cover event wiring.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function uiFixture(scenario='throw-team-mate'){
 const html=fs.readFileSync(projectPath('index.html'),'utf8'),elements=new Map();
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
test('pregame resource buttons configure and display permanent and temporary staff',()=>{
 const {get,run}=uiFixture('match');get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[0].name')).listeners.click();get('choices').children.find(e=>e.textContent==='Assistant coaches: 0').listeners.click();get('choices').children.find(e=>e.textContent==='2 — 20,000 gp').listeners.click();get('choices').children.find(e=>e.textContent==='Part-time Assistant Coaches: 0').listeners.click();get('choices').children.find(e=>e.textContent==='3 — 60,000 gp').listeners.click();get('choices').children.find(e=>e.textContent==='Done').listeners.click();assert.equal(run('game.staffCount(0,"assistants")'),5);assert.equal(run('game.resourceCosts(0).inducements'),60000);assert.ok(get('matchflow').children.some(e=>e.textContent.includes('Coaches 2')));
});
test('Black Orc Bribe choices expose their discounted cost and six-Bribe limit in the real UI',()=>{
 const {get,run}=uiFixture('match');get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[1].name')).listeners.click();get('choices').children.find(e=>e.textContent==='Bribes: 0').listeners.click();const six=get('choices').children.find(e=>e.textContent==='6 — 300,000 gp');assert.ok(six);six.listeners.click();six.listeners.click();get('choices').children.find(e=>e.textContent==='Done').listeners.click();assert.equal(run('game.bribes[1]'),6);assert.equal(run('game.resourceCosts(1).inducements'),300000);
});
test('Wandering Apothecaries combine with the existing team-apothecary UI toggle',()=>{
 const {get,run}=uiFixture('match');get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[0].name')).listeners.click();get('choices').children.find(e=>e.textContent==='Wandering Apothecaries: 0').listeners.click();get('choices').children.find(e=>e.textContent==='2 — 200,000 gp').listeners.click();get('choices').children.find(e=>e.textContent==='Team apothecary: 0').listeners.click();get('choices').children.find(e=>e.textContent==='1 — 50,000 gp').listeners.click();assert.equal(run('game.apothecaries[0]'),3);get('choices').children.find(e=>e.textContent==='Team apothecary: 1').listeners.click();get('choices').children.find(e=>e.textContent==='0 — 0 gp').listeners.click();assert.equal(run('game.apothecaries[0]'),2);
});
test('resource UI changes lock after determining fans and stale value buttons cannot reopen them',()=>{
 const {get,run}=uiFixture('match');run('game.dice=()=>1');get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[0].name')).listeners.click();get('choices').children.find(e=>e.textContent==="Blitzer's Best Kegs: 0").listeners.click();const old=get('choices').children.find(e=>e.textContent==='1 — 50,000 gp');old.listeners.click();get('choices').children.find(e=>e.textContent==='Done').listeners.click();get('matchflow').children.find(e=>e.textContent==='Determine fans').listeners.click();old.listeners.click();assert.equal(run('game.phase'),'weather');assert.equal(run('game.resourceChoices[0].kegs'),1);assert.equal(run('game.pending'),null);assert.ok(!get('matchflow').children.some(e=>e.textContent.startsWith('Configure staff')));
});
test('the real Secret Weapon send-off UI uses the Black Orc rule re-roll and rejects stale replay',()=>{
 const {get,run}=uiFixture('match');run('game.phase="endDrive";game.drive=1;game.kicking=0;globalThis.weapon=game.players[11];weapon.extraSkills=["Secret Weapon"];weapon.status="standing";weapon.x=15;weapon.y=7;weapon.fieldedDrive=1;globalThis.rolls=[1,6];game.dice=()=>rolls.shift();game.continueDrive();render()');assert.equal(run('game.pending.team'),1);const argue=get('choices').children.find(e=>e.textContent==='Argue the Call');argue.listeners.click();argue.listeners.click();assert.equal(run('game.argueRerolls[1]'),0);assert.equal(run('game.argueBanned[1]'),false);assert.equal(run('game.phase'),'setup');assert.notEqual(run('weapon.status'),'sent-off');assert.equal(run('rolls.length'),0);
});

test('Biased Referee resource controls show the Black Orc discount and live selection',()=>{
 const {get,run}=uiFixture('match');get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[1].name')).listeners.click();get('choices').children.find(e=>e.textContent==='Biased Referees: 0').listeners.click();get('choices').children.find(e=>e.textContent==='1 — 80,000 gp').listeners.click();get('choices').children.find(e=>e.textContent==='Done').listeners.click();assert.equal(run('game.biasedRefs[1]'),1);assert.ok(get('matchflow').children.some(e=>e.textContent.includes('Biased Referees 0 / 1')));
});

test('grouped Secret Weapon UI chooses argument order before allocating Bribes',()=>{
 const {get,run}=uiFixture('match');run('game.setResource(0,"bribes",1);game.phase="endDrive";game.drive=1;game.kicking=0;game.players.slice(0,2).forEach((p,i)=>Object.assign(p,{extraSkills:["Secret Weapon"],status:"standing",x:10,y:5+i,fieldedDrive:1}));globalThis.rolls=[2,6,2];game.dice=()=>rolls.shift();game.continueDrive();render()');
 const choose=label=>{const b=get('choices').children.find(e=>e.textContent===label);assert.ok(b,label);b.listeners.click();};
 choose('Argue for #2');choose('Argue the Call');assert.match(run('game.pending.kind'),/Bribes/);const old=get('choices').children.find(e=>e.textContent==='Use Bribe');old.listeners.click();old.listeners.click();assert.equal(run('game.bribes[0]'),0);assert.equal(run('game.phase'),'setup');assert.equal(run('rolls.length'),0);
});

test('Biased Referee end-drive UI offers optional rule re-roll after natural one',()=>{
 const {get,run}=uiFixture('match');run('game.setResource(1,"biasedRefs",1);game.phase="endDrive";game.drive=1;game.kicking=0;Object.assign(game.players[11],{extraSkills:["Secret Weapon"],status:"standing",x:15,y:7,fieldedDrive:1});game.dice=()=>1;game.continueDrive();render()');get('choices').children.find(e=>e.textContent==='Argue the Call').listeners.click();assert.equal(run('game.argueBanned[1]'),false);assert.equal(run('game.argueRerolls[1]'),1);get('choices').children.find(e=>e.textContent==='Keep argument results').listeners.click();assert.equal(run('game.phase'),'setup');assert.equal(run('game.argueRerolls[1]'),1);
});

test('Mascot re-roll appears in the real ordinary-roll and Block menus',()=>{
 const {get,run}=uiFixture('match');run('game.setResource(0,"mascots",1);game.phase="play";globalThis.p=game.players[0];Object.assign(p,{status:"standing",x:10,y:7});game.rerolls=[0,0];globalThis.rolls=[1,4,6];game.dice=()=>rolls.shift();globalThis.success=false;game.test(p,"Pick up",3,()=>success=true,()=>{});render()');get('choices').children.find(e=>e.textContent==='Use Mascot').listeners.click();assert.equal(run('success'),true);assert.equal(run('game.mascots[0]'),0);
 run('game.mascots[0]=1;game.blockAction={attacker:p,target:game.players[11],chooserTeam:0,dice:[1],poolLocked:false,assists:{offensive:0,defensive:0}};game.pending={type:"blockSelect"};globalThis.rolls=[4,6];render()');get('choices').children.find(e=>e.textContent==='Re-roll · Mascot').listeners.click();assert.equal(run('game.blockAction.dice[0]'),6);assert.equal(run('game.mascots[0]'),0);
});

test('Weather Mage start-of-turn and result decisions are reachable through real UI buttons',()=>{
 const {get,run}=uiFixture('match');run('game.setResource(0,"weatherMages",1);game.phase="play";globalThis.rolls=[1,1];game.dice=()=>rolls.shift();game.beginTurn(0);render()');get('choices').children.find(e=>e.textContent==='Use Weather Mage').listeners.click();get('choices').children.find(e=>e.textContent==='Very Sunny').listeners.click();assert.equal(run('game.weather'),'Very Sunny');assert.equal(run('game.weatherMages[0]'),0);assert.equal(run('game.pending'),null);
});

test('Mortuary Assistant injury control retains the defending coach and spends one use',()=>{
 const {get,run}=uiFixture('match');run('game.teams[1].special.push("Masters of Undeath");game.setResource(1,"mortuaryAssistants",1);game.phase="play";game.rerolls=[0,0];globalThis.p=game.players[11];Object.assign(p,{status:"standing",x:15,y:7,extraSkills:["Regeneration"]});globalThis.rolls=[16,1,1,6];game.dice=()=>rolls.shift();game.resolveInjury(p,12);render()');assert.equal(run('game.pending.team'),1);get('choices').children.find(e=>e.textContent==='Mortuary Assistant re-roll Regeneration').listeners.click();assert.equal(run('p.status'),'reserve');assert.equal(run('game.mortuaryAssistants[1]'),0);assert.equal(run('rolls.length'),0);
});

test('Plague Doctor treatment control cures a casualty without spending an apothecary',()=>{
 const {get,run}=uiFixture('match');run('game.teams[1].special.push("Favoured of Nurgle");game.setResource(1,"plagueDoctors",1);game.phase="play";globalThis.p=game.players[11];Object.assign(p,{status:"standing",x:15,y:7});globalThis.rolls=[1,1];game.dice=()=>rolls.shift();game.resolveInjury(p,12);render()');get('choices').children.find(e=>e.textContent==='Use Plague Doctor').listeners.click();assert.equal(run('p.status'),'reserve');assert.equal(run('game.plagueDoctors[1]'),0);assert.equal(run('game.apothecaries[1]'),0);
});
function decisionCell(get,run,prefix=null){
 const expression=prefix===null?'pendingPitchChoices()[0]':'pendingPitchChoices().find(p=>typeof p.option==="string"&&p.option.startsWith('+JSON.stringify(prefix)+'))';
 const pos=JSON.parse(run('JSON.stringify('+expression+')'));assert.ok(pos,'Expected a pitch decision target');return get('pitch').children[pos.y*26+pos.x];
}
function outlierUi(rolls,scenario='skills'){
 const f=uiFixture(scenario);f.run('game.players.forEach(p=>Object.assign(p,{status:"reserve",x:null,y:null,extraSkills:[],profileOverride:{name:"Fixture",cost:0,max:16,primary:"G",secondary:"A",ma:6,st:3,ag:"3+",pa:"3+",av:"9+",skills:[],traits:"Lineman, Human"}}));globalThis.a=game.players[0];globalThis.b=game.players[1];globalThis.d=game.players[11];Object.assign(a,{x:10,y:7,status:"standing"});Object.assign(b,{x:9,y:7,status:"standing"});Object.assign(d,{x:12,y:7,status:"standing"});game.rerolls=[0,0];game.ball={x:20,y:14,carrier:null};game.interceptionCandidates=()=>[];selected=a.id;globalThis.rolls='+JSON.stringify(rolls)+';game.dice=()=>rolls.shift();if(game.match){game.phase="play";game.turns=[1,0];}render()');return f;
}

test('actual Block push highlights legal pitch squares and clicking one resolves once',()=>{
 const {get,run}=outlierUi([3]);run('d.x=11;game.block(a.id,d.id);game.selectBlockDie(0);render()');
 assert.equal(run('game.pending.type'),'pushChoice');
 const squares=get('pitch').children,options=JSON.parse(run('JSON.stringify(game.pending.options)'));
 assert.equal(squares.filter(e=>e.className.includes('push-option')).length,options.length);
 assert.ok(squares[7*26+11].className.includes('push-subject'));
 const pos=options[0],cell=squares[pos.y*26+pos.x];assert.match(cell['aria-label'],/push destination/);
 const selected=run('selected');squares[0].listeners.click();assert.equal(run('game.pending.type'),'pushChoice');assert.equal(run('selected'),selected);
 cell.listeners.click();assert.equal(run('d.x'),pos.x);assert.equal(run('d.y'),pos.y);
 const before=run('JSON.stringify([d.x,d.y,game.pending?.kind])');cell.listeners.click();assert.equal(run('JSON.stringify([d.x,d.y,game.pending?.kind])'),before);
 assert.equal(get('pitch').children.filter(e=>e.className.includes('push-option')).length,0);
});

test('Sidestep destinations on the pitch follow the engine choices',()=>{
 const {get,run}=outlierUi([3]);run('d.x=11;d.extraSkills=["Sidestep"];game.block(a.id,d.id);game.selectBlockDie(0);render()');
 const options=JSON.parse(run('JSON.stringify(game.pending.options)'));assert.ok(options.some(p=>p.x===10));
 for(const pos of options)assert.ok(get('pitch').children[pos.y*26+pos.x].className.includes('push-option'));
 const pos=options.find(p=>p.x===10);get('pitch').children[pos.y*26+pos.x].listeners.click();assert.equal(run('d.x'),pos.x);assert.equal(run('d.y'),pos.y);
});

test('clickable chain pushes mark occupied destinations then transfer to the chained victim',()=>{
 const {get,run}=outlierUi([3,3,3]);run('d.x=11;for(let i=0;i<3;i++)Object.assign(game.players[i+2],{x:12,y:6+i,status:"standing"});game.block(a.id,d.id);game.selectBlockDie(0);render()');
 const old=get('pitch').children[7*26+12];assert.match(old.title,/chain push/);old.listeners.click();
 assert.equal(run('game.pending.kind'),'Chain push');assert.ok(get('pitch').children[7*26+12].className.includes('push-subject'));
 const before=run('game.pending');old.listeners.click();assert.equal(run('game.pending'),before);
 const pos=JSON.parse(run('JSON.stringify(game.pending.options.find(p=>!p.standFirm))'));get('pitch').children[pos.y*26+pos.x].listeners.click();
 assert.equal(run('d.x'),12);assert.equal(run('d.y'),7);
});

test('crowd pushes retain a working explicit button without highlighting an illegal pitch square',()=>{
 const {get,run}=outlierUi([3,1,1]);run('a.x=24;d.x=25;game.block(a.id,d.id);game.selectBlockDie(0);render()');
 assert.equal(get('pitch').children.filter(e=>e.className.includes('push-option')).length,0);
 const crowd=get('choices').children.find(e=>e.textContent.startsWith('Push into the Crowd'));assert.ok(crowd);crowd.listeners.click();assert.equal(run('d.x'),null);assert.equal(run('d.status'),'reserve');
});

test('Stand Firm remains available beside clickable chain-push destinations',()=>{
 const {get,run}=outlierUi([3,3,3]);run('d.x=11;for(let i=0;i<3;i++)Object.assign(game.players[i+2],{x:12,y:6+i,status:"standing",extraSkills:["Stand Firm"]});game.block(a.id,d.id);game.selectBlockDie(0);render()');
 get('pitch').children[7*26+12].listeners.click();assert.equal(run('game.pending.kind'),'Chain push');
 assert.ok(get('pitch').children.some(e=>e.className.includes('push-option')));
 const firm=get('choices').children.find(e=>e.textContent==='Use Stand Firm');assert.ok(firm);firm.listeners.click();assert.equal(run('d.x'),11);assert.equal(run('game.players[3].x'),12);
});
test('the skill laboratory offers parameterized Bloodlust and a Thrall eligibility button',()=>{
 const {get,run}=outlierUi([]);const panel=get('skillcontrols'),select=panel.children.find(e=>e['aria-label']==='Add a laboratory skill');assert.ok(select.children.some(e=>e.value==='Bloodlust (2+)'));select.value='Bloodlust (2+)';panel.children.find(e=>e.textContent==='Add skill to selected lab player').listeners.click();assert.equal(run('game.has(a,"Bloodlust (2+)")'),true);
 run('selected=b.id;render()');get('skillcontrols').children.find(e=>e.textContent==='Mark as Thrall').listeners.click();assert.equal(run('b.thrall'),true);
});
test('Bloodlust End Move UI feeds and cannot repeat the bite after a double click',()=>{
 const {get,run}=outlierUi([1,1,1]);run('a.extraSkills=["Bloodlust (2+)"];b.thrall=true;render()');get('start').listeners.click();get('finish').listeners.click();const bite=get('choices').children.find(e=>e.textContent.startsWith('Bite #'));assert.ok(bite);bite.listeners.click();bite.listeners.click();assert.equal(run('b.status'),'stunned');assert.equal(run('game.injuryRecords.length'),1);assert.equal(run('game.mover'),null);
});
test('Bloodlust touchdown dialog precedes scoring in the match UI',()=>{
 const {get,run}=outlierUi([1,1],'match');run('a.x=25;b.x=24;b.thrall=true;a.bloodlust=true;game.ball={x:25,y:7,carrier:a.id};game.checkScore();render()');assert.equal(run('game.scores[0]'),0);get('choices').children.find(e=>e.textContent.startsWith('Bite #')).listeners.click();assert.equal(run('game.scores[0]'),1);assert.equal(run('game.phase'),'endDrive');
});
test('Ball & Chain movement template buttons spend one movement and reject a stale direction click',()=>{
 const {get,run}=outlierUi([3]);run('a.extraSkills=["Ball & Chain"];render()');get('start').listeners.click();const aim=get('choices').children.find(e=>e.textContent==='Aim East');assert.ok(aim);aim.listeners.click();aim.listeners.click();assert.equal(run('a.x'),11);assert.equal(run('a.spent'),1);assert.ok(get('choices').children.some(e=>e.textContent==='Aim North'));
});
test('Ball & Chain collision UI auto-follows and rejects a stale push button',()=>{
 const {get,run}=outlierUi([3,3]);run('a.extraSkills=["Ball & Chain"];d.x=11;game.start(a.id);render()');get('choices').children.find(e=>e.textContent==='Aim East').listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Die 1')).listeners.click();const push=decisionCell(get,run);push.listeners.click();push.listeners.click();assert.equal(run('a.x'),11);assert.equal(run('a.spent'),1);assert.ok(!get('choices').children.some(e=>e.textContent==='Follow up'));
});
test('Throw Bomb is available from the special-action menu and uses two-click pitch aiming',()=>{
 const {get,run}=outlierUi([6,2]);run('a.extraSkills=["Bombardier"];globalThis.ballBefore=JSON.stringify(game.ball);render()');get('special').listeners.click();get('choices').children.find(e=>e.textContent==='Throw Bomb').listeners.click();assert.equal(run('game.action'),'bomb');assert.ok(get('choices').children.some(e=>e.textContent==='Throw Bomb · no target'));
 get('pitch').children[7*26+16].listeners.click();get('pitch').children[7*26+16].listeners.click();assert.equal(run('game.bombContext'),null);assert.equal(run('JSON.stringify(game.ball)===ballBefore'),true);assert.equal(run('game.passUsed[0]'),false);
});
test('caught-bomb UI switches the coach, requires a rethrow and disables End Move',()=>{
 const {get,run}=outlierUi([6,6]);run('a.extraSkills=["Bombardier"];game.start(a.id,"bomb");render()');get('pitch').children[7*26+12].listeners.click();get('pitch').children[7*26+12].listeners.click();assert.equal(run('game.bombActor().id'),run('d.id'));assert.match(get('coach').textContent,/Must rethrow bomb/);assert.ok(get('coach').textContent.startsWith(run('teams[1].name')));assert.equal(get('finish').disabled,true);assert.equal(get('end').disabled,true);assert.equal(run('d.used'),false);
});
test('bomb medical dialog displays the bomb action and resolves all injuries before cleanup',()=>{
 const {get,run}=outlierUi([6,1,6,6,6,6,1,1,4,6,6,6,6,16,1,1,1]);run('a.extraSkills=["Bombardier"];Object.assign(b,{team:1,x:13,y:7});game.apothecaries[1]=1;game.start(a.id,"bomb");game.throwBomb(d.x,d.y);render()');assert.match(run('game.pending.kind'),/^Bomb medical/);get('choices').children.find(e=>e.textContent.startsWith('Resolve #2 injury')).listeners.click();get('choices').children.find(e=>e.textContent==='Use Apothecary').listeners.click();assert.equal(run('b.status'),'reserve');assert.equal(run('game.bombContext'),null);assert.equal(run('game.active'),0);
});
function multipleUi(rolls){
 const f=uiFixture('dodge');f.run('game.players.forEach(p=>Object.assign(p,{status:"reserve",x:null,y:null}));globalThis.a=game.players[0];globalThis.d=game.players[11];globalThis.e=game.players[12];for(const p of [a,d,e]){p.profileOverride={...game.profile(p),skills:[],st:p===a?5:3,traits:"Lineman, Human"};p.status="standing";}Object.assign(a,{x:10,y:7,extraSkills:["Multiple Block"]});Object.assign(d,{x:11,y:7});Object.assign(e,{x:10,y:8});game.rerolls=[0,0];game.ball={x:20,y:14,carrier:null};selected=a.id;globalThis.rolls='+JSON.stringify(rolls)+';game.dice=()=>rolls.shift();render()');return f;
}
test('Multiple Block is declared through the actual special-action and target-order buttons',()=>{
 const {get,run}=multipleUi([3,3]);get('special').listeners.click();get('choices').children.find(e=>e.textContent==='Multiple Block').listeners.click();assert.equal(run('a.used'),false);
 const pair=get('choices').children.find(e=>e.textContent==='#1 then #2');assert.ok(pair);pair.listeners.click();pair.listeners.click();assert.equal(run('a.used'),true);assert.equal(run('game.multipleContext.pools.length'),2);assert.equal(run('rolls.length'),0);assert.ok(get('choices').children.some(e=>e.textContent.includes('Multiple Block dice')));
});
test('Multiple Block defending coach receives both uphill pool result buttons',()=>{
 const {get,run}=multipleUi([3,3,3,3,3,3]);run('a.profileOverride.st=3;game.multipleBlock(a.id,[d.id,e.id]);render()');
 get('choices').children.find(e=>e.textContent==='Let defender choose #1').listeners.click();get('choices').children.find(e=>e.textContent==='Let defender choose #2').listeners.click();assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.startsWith('Multiple Block dice')));
});
test('Multiple Block UI preserves the second attack after Player Down and rejects a stale push click',()=>{
 const {get,run}=multipleUi([1,6,1,1,1,1]);run('game.multipleBlock(a.id,[d.id,e.id]);render()');
 get('choices').children.find(e=>e.textContent==='Choose #1 die 1: Player Down').listeners.click();get('choices').children.find(e=>e.textContent==='Choose #2 die 1: POW').listeners.click();assert.equal(run('game.active'),0);assert.equal(run('a.status'),'prone');
 const push=decisionCell(get,run);assert.ok(push);push.listeners.click();assert.equal(run('game.active'),1);push.listeners.click();assert.equal(run('game.active'),1);assert.equal(run('game.multipleContext'),null);
});
test('Multiple Block medical UI lets the defender choose the fatal injury before spending the apothecary',()=>{
 const {get,run}=multipleUi([6,6,6,6,6,6,1,1,6,6,6,6,16,1,1,1]);run('game.apothecaries[1]=1;game.multipleBlock(a.id,[d.id,e.id]);render()');
 for(const target of [1,2])get('choices').children.find(e=>e.textContent==='Choose #'+target+' die 1: POW').listeners.click();
 decisionCell(get,run).listeners.click();decisionCell(get,run).listeners.click();assert.equal(run('game.pending.team'),1);
 get('choices').children.find(e=>e.textContent.startsWith('Resolve #2 injury')&&e.textContent.endsWith('Dead')).listeners.click();get('choices').children.find(e=>e.textContent==='Use Apothecary').listeners.click();assert.equal(run('e.status'),'reserve');assert.equal(run('d.status'),'casualty');assert.equal(run('game.apothecaries[1]'),0);assert.equal(run('game.multipleContext'),null);
});
test('Multiple Block Pro button opens a die choice and returns to the correct pool menu',()=>{
 const {get,run}=multipleUi([1,3,3,3]);run('a.extraSkills.push("Pro");game.multipleBlock(a.id,[d.id,e.id]);render()');get('choices').children.find(e=>e.textContent==='Pro #1').listeners.click();get('choices').children.find(e=>e.textContent==='Re-roll die 1').listeners.click();assert.equal(run('game.multipleContext.pools[0].dice[0]'),3);assert.ok(get('choices').children.some(e=>e.textContent==='Choose #1 die 1: Push Back'));assert.ok(!get('choices').children.some(e=>e.textContent==='Pro #2'));
});

test('exhibition pregame buttons add and remove one apothecary per team',()=>{
 const {get,run}=uiFixture('match');
 assert.ok(!get('matchflow').children.some(e=>/apothecaries:|^(Add|Remove) apothecary/.test(e.textContent)));get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[0].name')).listeners.click();get('choices').children.find(e=>e.textContent==='Team apothecary: 0').listeners.click();get('choices').children.find(e=>e.textContent==='1 — 50,000 gp').listeners.click();assert.equal(run('game.apothecaries[0]'),1);
 get('choices').children.find(e=>e.textContent==='Team apothecary: 1').listeners.click();get('choices').children.find(e=>e.textContent==='0 — 0 gp').listeners.click();assert.equal(run('game.apothecaries[0]'),0);
});
test('apothecary UI preserves the defending coach and resumes the suspended action once',()=>{
 const {get,run}=uiFixture('dodge');run('game.apothecaries=[0,1];game.players[11].role=1;globalThis.rolls=[16,1,9,1];game.dice=()=>rolls.shift();globalThis.medicalCalls=0;game.injuryResult(game.players[11],10,()=>medicalCalls++);render()');
 assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.startsWith('Apothecary')));
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
 const choice=decisionCell(get,run);assert.ok(choice);choice.listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.mover'),null);assert.equal(run('game.players[0].x'),10);assert.equal(run('game.active'),0);
});
test('Shadowing defending coach button resumes a dodge in the bundled UI',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Shadowing"];game.dice=()=>6;game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 assert.equal(run('game.pending.team'),1);assert.ok(get('choices').children.some(e=>e.textContent.includes('Shadowing')));
 decisionCell(get,run).listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.players[11].x'),10);assert.equal(run('game.players[0].x'),9);assert.equal(run('game.interruptions.length'),0);
});
test('Arm Bar owner and injury modifier are both reachable through browser buttons',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Arm Bar"];game.rerolls=[0,0];globalThis.rolls=[1,6,6,4,5,1,1];game.dice=()=>rolls.shift();game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 decisionCell(get,run).listeners.click();assert.equal(run('game.pending.team'),1);
 assert.ok(get('choices').children.some(e=>e.textContent==='Arm Bar'));
 get('choices').children.find(e=>e.textContent==='Add +1 to Injury').listeners.click();
 assert.equal(run('game.pending'),null);assert.equal(run('game.players[0].status'),'casualty');assert.equal(run('game.active'),1);
});
test('Diving Tackle UI gives the moving coach the look-ahead re-roll before defender choice',()=>{
 const {get,run}=uiFixture('dodge');
 run('game.players[11].extraSkills=["Diving Tackle"];game.rerolls=[1,0];globalThis.rolls=[3,6];game.dice=()=>rolls.shift();game.start(game.players[0].id);selected=game.players[0].id;choose(9,6);choose(9,6);render()');
 assert.ok(get('choices').children.some(e=>e.textContent.includes('Diving Tackle pending')));assert.ok(get('choices').children.some(e=>e.textContent==='Keep this result'));
 get('choices').children.find(e=>e.textContent==='Use team re-roll').listeners.click();assert.equal(run('game.pending.team'),1);
 decisionCell(get,run).listeners.click();assert.equal(run('game.players[11].status'),'prone');assert.equal(run('game.players[0].status'),'standing');assert.equal(run('game.pending'),null);
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
 assert.ok(get('choices').children.some(e=>e.textContent.includes('Diving Catch')));const choice=decisionCell(get,run);assert.ok(choice);choice.listeners.click();choice.listeners.click();assert.equal(run('game.ball.carrier'),'0-2');assert.equal(run('game.active'),0);assert.equal(run('game.pending'),null);
});
test('Safe Pair of Hands UI places the ball and resumes armour exactly once',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Safe Pair of Hands"];game.ball={x:10,y:7,carrier:game.players[0].id};game.rerolls=[0,0];globalThis.rolls=[1,1];game.dice=()=>rolls.shift();game.fall(game.players[0]);render()');
 assert.equal(run('game.players[0].status'),'standing');const choice=decisionCell(get,run,'Place ball at');assert.ok(choice);choice.listeners.click();choice.listeners.click();assert.equal(run('game.players[0].status'),'prone');assert.equal(run('game.ball.carrier'),null);assert.equal(run('game.active'),1);assert.equal(run('rolls.length'),0);assert.equal(run('game.pending'),null);
});
test('Safe Pair of Hands UI decline bounces the ball normally',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Safe Pair of Hands"];game.ball={x:10,y:7,carrier:game.players[0].id};game.rerolls=[0,0];globalThis.rolls=[1,1,7];game.dice=()=>rolls.shift();game.fall(game.players[0]);render()');
 get('choices').children.find(e=>e.textContent==='Bounce normally').listeners.click();assert.equal(run('game.ball.x'),10);assert.equal(run('game.ball.y'),8);assert.equal(run('game.active'),1);assert.equal(run('rolls.length'),0);
});
test('accurate Pass preview reflects the receiver Diving Catch bonus',()=>{
 const {get,run}=uiFixture('pass');run('game.players[1].extraSkills=["Diving Catch"];game.start(game.players[0].id,"pass");selected=game.players[0].id;ballMode=true;throwDestination={x:14,y:7};render()');assert.ok(get('choices').children.some(e=>e.textContent.includes('Catch 2+ (accurate delivery)')));
});

test('PA-dash pass preview explains the automatic fumble instead of displaying NaN',()=>{
 const {get,run}=uiFixture('pass');run('game.players[0].profileOverride={...game.profile(game.players[0]),pa:"-"};game.start(game.players[0].id,"pass");selected=game.players[0].id;ballMode=true;throwDestination={x:14,y:7};render()');assert.ok(get('choices').children.some(e=>e.textContent.includes('PA –: automatic fumble')));assert.ok(!get('choices').children.some(e=>e.textContent.includes('NaN')));
});
test('Kick Team-mate UI declares, selects a passenger and completes the existing flight flow',()=>{
 const {get,run}=uiFixture('pickup');run('game.players[0].extraSkills=["Kick Team-mate"];game.players[1].extraSkills=["Right Stuff"];game.rerolls=[0,0];game.dice=()=>6;selected=game.players[0].id;render()');
 assert.equal(get('kick-mate').disabled,false);get('kick-mate').listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Throw team-mate #')).listeners.click();run('choose(12,7);choose(12,7)');assert.equal(run('game.players[1].x'),9);assert.equal(run('game.players[1].y'),10);assert.equal(run('game.kickUsed[0]'),true);assert.equal(run('game.passUsed[0]'),false);
});
test('Swoop UI uses the selected template before landing',()=>{
 const {get,run}=uiFixture();run('game.players[11].extraSkills=["Swoop"];game.rerolls=[0,0];game.dice=()=>6');get('throw-mate').listeners.click();get('choices').children.find(e=>e.textContent.startsWith('Throw team-mate #')).listeners.click();run('choose(12,7);choose(12,7)');get('choices').children.find(e=>e.textContent==='North').listeners.click();assert.equal(run('game.players[11].status'),'standing');assert.equal(run('game.pending'),null);
});
test('Trickster UI relocates the defender before selecting Block dice',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Trickster"];game.dice=()=>6;game.block(game.players[0].id,game.players[11].id);render()');decisionCell(get,run,'Relocate to').listeners.click();assert.equal(run('game.pending.type'),'blockSelect');assert.equal(run('game.players[11].x'),9);
});
test('Dump-off UI completes an out-of-turn pass then returns to the interrupted Block',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[11].extraSkills=["Dump-off"];game.ball={x:11,y:7,carrier:game.players[11].id};game.rerolls=[0,0];game.dice=()=>6;game.block(game.players[0].id,game.players[11].id);render()');decisionCell(get,run,'Quick pass to 14, 8').listeners.click();assert.equal(run('game.pending.type'),'blockSelect');assert.equal(run('game.dumpContext'),null);assert.equal(run('game.active'),0);
});
test('Hit and Run UI offers a free move after a Block and retains Blitz state',()=>{
 const {get,run}=uiFixture('dodge');run('game.players[0].extraSkills=["Hit and Run"];game.mover=game.players[0].id;game.action="blitz";game.blockAction={attacker:game.players[0],target:game.players[11],blitz:true,assists:{offensive:0,defensive:0}};game.finishBlock();render()');decisionCell(get,run,'Move free to').listeners.click();assert.equal(run('game.players[0].x'),9);assert.equal(run('game.action'),'blitz');assert.equal(run('game.pending'),null);
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
 const {get,run}=uiFixture('pass');run('game.players[11].extraSkills=["On the Ball"];game.rerolls=[0,0];game.dice=()=>6;game.start(game.players[0].id,"pass");game.pass(14,7);render()');decisionCell(get,run).listeners.click();decisionCell(get,run,'Move to 12, 7').listeners.click();decisionCell(get,run,'Move to 12, 7').listeners.click();assert.equal(run('game.players[11].y'),6);get('choices').children.find(e=>e.textContent==='Stop moving').listeners.click();get('choices').children.find(e=>e.textContent==='Decline interception').listeners.click();assert.equal(run('game.ball.carrier'),'0-2');assert.equal(run('game.moveContext'),null);assert.equal(run('game.active'),0);
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
 assert.ok(get('choices').children.some(c=>c.textContent==='Throw team-mate · no target'));
 vm.runInContext('choose(12,7)',context);assert.ok(get('choices').children.some(c=>c.textContent.includes('Superb Throw')));
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
 assert.ok(get('choices').children.some(e=>e.textContent.includes('After preview · MA 2 · Rush 2 remaining')));
 assert.equal(run('JSON.stringify({players:game.players,ball:game.ball,events:game.events,rerolls:game.rerolls})'),before);
 get('choices').children.find(e=>e.textContent==='Cancel preview').listeners.click();
 assert.equal(run('destination'),null);assert.match(square(15,7).className,/\blegal\b/);
 assert.equal(run('JSON.stringify({players:game.players,ball:game.ball,events:game.events,rerolls:game.rerolls})'),before);
});
test('preview extension preserves waypoints, rush costs and the exact committed route',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;game.dice=()=>6;render();choose(6,5);choose(6,7)');
 assert.equal(run('destination.spent'),6);
 assert.equal(run('destination.path.some(s=>s.x===6&&s.y===5)'),true);
 run('choose(5,7)');assert.equal(run('destination.spent'),7);
 assert.ok(get('choices').children.some(e=>e.textContent.includes('After preview · MA 0 · Rush 1 remaining')));
 get('choices').children.find(e=>e.textContent==='Confirm Move').listeners.click();assert.equal(run('game.players[0].x'),5);assert.equal(run('game.players[0].y'),7);assert.equal(run('game.players[0].spent'),7);assert.equal(run('destination'),null);
 assert.equal(run('game.events.some(e=>e.includes("moved to 7, 6"))'),true);
});
test('active-move cancellation restores the current remaining range and never refunds spent movement',()=>{
 const {get,run}=uiFixture('dodge');run('selected=game.players[0].id;game.dice=()=>6;game.start(selected);game.step(9,6);render()');
 run('choose(5,4)');assert.equal(run('game.players[0].spent'),1);
 get('choices').children.find(e=>e.textContent==='Cancel preview').listeners.click();
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

test('Josef Bugman purchase and Dwarfen Wisdom swaps work through actual inline controls',()=>{
 const {get,run}=uiFixture('match'),choose=label=>{const b=run('pendingPitchChoices().some(p=>typeof p.option==="string"&&p.option.startsWith('+JSON.stringify(label)+'))')?decisionCell(get,run,label):get('choices').children.find(e=>e.textContent===label);assert.ok(b,label);b.listeners.click();};
 get('matchflow').children.find(e=>e.textContent==='Configure staff and inducements — '+run('teams[0].name')).listeners.click();choose('Josef Bugman: 0');choose('1 — 100,000 gp');choose('Done');assert.equal(run('game.resourceCosts(0).inducements'),100000);
 run('game.dice=()=>2;game.phase="kickChoice";game.chooseKicking(0);game.confirmSetup();game.confirmSetup();globalThis.a=game.players[0];globalThis.b=game.players[1];globalThis.apos={x:a.x,y:a.y};globalThis.bpos={x:b.x,y:b.y};render()');assert.equal(run('game.pending.team'),0);choose('Use Dwarfen Wisdom');const old=decisionCell(get,run,'Redeploy #1');old.listeners.click();old.listeners.click();assert.equal(run('game.wisdomState.selected.length'),1);choose('Redeploy #2');assert.equal(run('game.dwarfenWisdom[0]'),0);
 assert.ok(get('matchflow').children.some(e=>e.textContent.includes('Bugman KO bonus 1 / 0')));assert.ok(get('matchflow').children.some(e=>e.textContent==='Wisdom player #1'));
 get('matchflow').children.find(e=>e.textContent==='Wisdom player #1').listeners.click();
 const bpos=JSON.parse(run('JSON.stringify(bpos)'));get('pitch').children[bpos.y*26+bpos.x].listeners.click();assert.equal(run('a.x'),bpos.x);get('matchflow').children.find(e=>e.textContent==='Wisdom player #2').listeners.click();const apos=JSON.parse(run('JSON.stringify(apos)'));get('pitch').children[apos.y*26+apos.x].listeners.click();const finish=get('matchflow').children.find(e=>e.textContent==='Finish Dwarfen Wisdom');finish.listeners.click();finish.listeners.click();assert.equal(run('game.phase'),'kicker');assert.equal(run('game.wisdomState'),null);
});
test('active prayer summaries and event log identify the opposing affected team',()=>{const {get,run}=uiFixture('match');run('game.dice=()=>1;game.applyPrayer(0,"Greasy Cleats");render()');const text=uiDescendants(get('matchflow')).map(e=>e.textContent).join(' ');assert.ok(text.includes(run('teams[1].name')+' #1'));assert.ok(run('game.events.some(s=>s.includes(teams[1].name+" #1"))'));});
test('Rock-only between-turn desk identifies the current window without rules instructions',()=>{const {get,run}=uiFixture('match');run('game.phase="play";game.active=1;game.turns=[1,1];game.rocks[0]=1;game.endTurn();render()');const text=uiDescendants(get('matchflow')).map(e=>e.textContent).join(' ');assert.match(text,/Between turns/);assert.doesNotMatch(text,/random standing opponent|hits on 4/);assert.ok(!text.includes('Select a highlighted square'));});

function uiDescendants(e){return [e,...e.children.flatMap(uiDescendants)];}

test('Jordell real Swift modifier button resolves before the defending Diving Tackle choice',()=>{const {get,run}=uiFixture('match');run('teams[0].league="Woodland League";globalThis.star=game.hireStar(0,"jordell-freshbreeze");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",extraSkills:["Diving Tackle"]});game.phase="play";game.active=0;game.rerolls=[0,0];game.dice=()=>2;game.start(star.id);game.step(4,7);render()');const use=get('choices').children.find(e=>e.textContent==='Use Swift As The Breeze');assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('game.pending.team'),1);const keep=get('choices').children.at(-1);keep.listeners.click();assert.equal(run('star.x'),4);assert.equal(run('star.status'),'standing');assert.equal(run('star.swiftUsed'),true);});
test('Rowana real Bounding Leap controls retain its ignored modifiers through the optional reroll',()=>{const {get,run}=uiFixture('match');run('teams[0].league="Woodland League";globalThis.star=game.hireStar(0,"rowana-forestfoot");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls=[1,3];game.dice=()=>rolls.shift();game.start(star.id);game.step(7,7);render()');get('choices').children.find(e=>e.textContent==='Use Bounding Leap').listeners.click();const reroll=get('choices').children.find(e=>e.textContent==='Use Bounding Leap');assert.ok(reroll);reroll.listeners.click();reroll.listeners.click();assert.equal(run('star.x'),7);assert.equal(run('star.boundingUsed'),true);assert.equal(run('rolls.length'),0);});
test('Cindy actual double-bomb commitment resumes aiming for the same original thrower',()=>{const {get,run}=uiFixture('match');run('globalThis.star=game.hireStar(0,"cindy-piewhistle");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls=[6,5,6,5,4];game.dice=()=>rolls.shift();game.start(star.id,"bomb");render()');const use=get('choices').children.find(e=>e.textContent==='Use All You Can Eat');assert.ok(use);use.listeners.click();use.listeners.click();run('game.throwBomb(10,7);render()');assert.equal(run('game.bombActor()===star'),true);assert.equal(run('game.bombContext.twoBombs'),2);run('game.throwBomb(10,7);render()');assert.equal(run('game.bombContext'),null);assert.equal(run('star.allEatUsed'),true);assert.equal(run('rolls.length'),0);});

for(const [id,league,ability,dice,friendly] of [['hakflem-skuttlespike','Underworld Challenge','Treacherous',[1,1],true],['boa-konssstriktr','Lustrian Superleague','Look Into My Eyes',[2],false]])test(id+' real activation choice takes the correctly previewed holders ball once',()=>{const {get,run}=uiFixture('match');run('teams[0].league='+JSON.stringify(league)+';globalThis.star=game.hireStar(0,'+JSON.stringify(id)+');game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.holder=game.players.find(p=>p!==star&&p.team==='+JSON.stringify(friendly?0:1)+');Object.assign(holder,{x:6,y:7,status:"standing",profileOverride:{...game.profile(holder),skills:[]}});game.ball={x:6,y:7,carrier:holder.id};game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls='+JSON.stringify(dice)+';game.dice=()=>rolls.shift();game.start(star.id);render()');const use=get('choices').children.find(e=>e.textContent==='Use '+ability);assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('game.ball.carrier===star.id'),true);assert.equal(run('star.stealUsed'),true);assert.equal(run('rolls.length'),0);});
test('Luthor actual touchdown choice queues one following-drive re-roll and prevents double scoring',()=>{const {get,run}=uiFixture('match');run('teams[0].league="Sylvanian Spotlight";globalThis.star=game.hireStar(0,"count-luthor");Object.assign(star,{x:25,y:7,status:"standing"});game.phase="play";game.active=0;game.ball={x:25,y:7,carrier:star.id};game.checkScore();render()');const use=get('choices').children.find(e=>e.textContent==='Use Star of the Show');assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('game.scores[0]'),1);assert.equal(run('game.nextDriveStarBonus[0]'),1);});
for(const [id,league,ability,dice,action] of [['rashnak-backstabber','Badlands Brawl','Toxin Connoisseur',[6,6,4,5,15,1],'Stab'],['wilhelm-chaney','Sylvanian Spotlight','Savage Mauling',[6,6,4,4,1,1,6,6,15,1],'Block']])test(id+' bundled damage choice commits its selected outcome once',()=>{const {get,run}=uiFixture('match');run('teams[0].league='+JSON.stringify(league)+';globalThis.star=game.hireStar(0,'+JSON.stringify(id)+');game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",profileOverride:{...game.profile(foe),skills:[],st:3,av:"10+"}});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls='+JSON.stringify(dice)+';game.dice=()=>rolls.shift();'+(action==='Block'?'game.block(star.id,foe.id);game.selectBlockDie(0);game.pending.resolve(game.pending.options.find(p=>!p.standFirm));':'game.start(star.id,"special:Stab");game.performSpecial(foe.id);')+'render()');const use=get('choices').children.find(e=>e.textContent==='Use '+ability);assert.ok(use,run('game.pending?.kind'));use.listeners.click();use.listeners.click();assert.equal(run('foe.status'),'casualty');assert.equal(run('star.injurySpecialUsed'),true);assert.equal(run('rolls.length'),0);});

for(const [id,league,action,ability,skill] of [['gretchen-wachter','Sylvanian Spotlight','move','Incorporeal',null],['gloriel-summerbloom','Elven Kingdoms League','pass','Shot to Nothing','Hail Mary Pass'],['roxanna-darknail','Elven Kingdoms League','blitz','Slashing Nails','Claws'],['grashnak-blackhoof','Chaos Clash','blitz','Gored By The Bull',null]])test(id+' bundled activation button enables a temporary enhancement once',()=>{const {get,run}=uiFixture('match');run('teams[0].league='+JSON.stringify(league)+';globalThis.star=game.hireStar(0,'+JSON.stringify(id)+');game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;game.ball={x:5,y:7,carrier:star.id};game.dice=()=>6;game.start(star.id,'+JSON.stringify(action)+');render()');const use=get('choices').children.find(e=>e.textContent==='Use '+ability);assert.ok(use);use.listeners.click();use.listeners.click();if(skill)assert.equal(run('game.has(star,'+JSON.stringify(skill)+')'),true);else assert.equal(run('game.plan(4,7).dodge'),false);run('game.finish();render()');assert.equal(run('game.activeStarEnhancement(star,'+JSON.stringify(ability)+')'),false);});
test('Skitter and Helmut actual Stab and Chainsaw controls resolve their guarded armour alternatives',()=>{for(const [id,league,action,ability,dice] of [['skitter-stab-stab','Underworld Challenge','Stab','Master Assassin',[1,1,6,6,1,1]],['helmut-wulf','Old World Classic','Chainsaw','Old Pro',[2,2,4,6,1,1,3]]]){const {get,run}=uiFixture('match');run('teams[0].league='+JSON.stringify(league)+';globalThis.star=game.hireStar(0,'+JSON.stringify(id)+');game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",profileOverride:{...game.profile(foe),skills:[],av:"10+"}});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls='+JSON.stringify(dice)+';game.dice=()=>rolls.shift();game.start(star.id,"special:"+'+JSON.stringify(action)+');render()');get('choices').children.find(e=>e.textContent.startsWith(action+' ·')).listeners.click();const use=get('choices').children.find(e=>e.textContent==='Use '+ability);assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('foe.status'),'stunned');assert.equal(run('star.injurySpecialUsed'),true);assert.equal(run('rolls.length'),0);}});

test('Grak real carry controls show temporary skills, unavailable passenger and guarded placement',()=>{const {get,run}=uiFixture('match');run('globalThis.grak=game.hireStar(0,"grak-crumbleberry");globalThis.crumb=game.players.find(p=>p.starRole==="crumbleberry");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(grak,{x:5,y:7,status:"standing"});Object.assign(crumb,{x:6,y:7,status:"standing"});game.phase="play";game.active=0;game.rerolls=[0,0];game.dice=()=>6;game.start(grak.id);render()');const pick=get('choices').children.find(e=>e.textContent==='Carry Crumbleberry');assert.ok(pick);pick.listeners.click();pick.listeners.click();assert.equal(run('crumb.status'),'carried');assert.equal(run('game.has(grak,"Break Tackle")'),true);assert.equal(run('game.onPitch(crumb)'),false);run('game.finish();render()');const place=decisionCell(get,run,'Place Crumbleberry at');assert.ok(place);place.listeners.click();place.listeners.click();assert.equal(run('game.carried'),null);assert.equal(run('game.has(grak,"Dodge")'),false);assert.equal(run('crumb.status'),'standing');});
test('Dribl and Drull actual hire preview and Stab damage use their shared partner ability',()=>{const {get,run}=uiFixture('match');run('teams[0].league="Lustrian Superleague";game.configureStars(0);render()');get('choices').children.find(e=>e.textContent.startsWith('Hire Dribl and Drull')).listeners.click();assert.match(run('game.pending.kind'),/Dribl.*Drull/);assert.match(run('game.pending.kind'),/A Sneaky Pair/);get('choices').children.find(e=>e.textContent==='Confirm hire').listeners.click();run('game.pending=null;globalThis.dribl=game.players.find(p=>p.starRole==="dribl");globalThis.drull=game.players.find(p=>p.starRole==="drull");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(dribl,{x:5,y:7,status:"standing"});Object.assign(drull,{x:6,y:8,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",profileOverride:{...game.profile(foe),av:"10+",skills:[]}});game.phase="play";game.active=0;globalThis.rolls=[4,5,1,1];game.dice=()=>rolls.shift();game.start(drull.id,"special:Stab");render()');const hit=get('choices').children.find(e=>e.textContent.startsWith('Stab ·'));assert.ok(hit);hit.listeners.click();hit.listeners.click();assert.equal(run('foe.status'),'stunned');assert.equal(run('rolls.length'),0);});

for(const [id,skill,dice,big] of [['varag-ghoul-chewer','Krump and Smash',[6,6,1,1,6,6,1,1],false],['mighty-zug','Crushing Blow',[6,6,4,5,1,1,1,1],false],['grim-ironjaw','Slayer',[6,6,4,5,1,1],true]])test(id+' actual Block UI chooses and guards its injury alternative',()=>{
 const {get,run}=uiFixture('match');run('teams[0].league='+JSON.stringify(id==='varag-ghoul-chewer'?'Badlands Brawl':'Worlds Edge Superleague')+';globalThis.star=game.hireStar(0,'+JSON.stringify(id)+');game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",profileOverride:{...game.profile(foe),av:"10+",st:3,skills:[],traits:'+JSON.stringify(big?'Big Guy, Ogre':'Lineman, Human')+'}});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls='+JSON.stringify(dice)+';game.dice=()=>rolls.shift();game.block(star.id,foe.id);game.selectBlockDie(0);game.pending.resolve(game.pending.options.find(p=>!p.standFirm));if(game.pending?.kind==="Follow-up")game.decide("Stay");render()');
 const use=get('choices').children.find(e=>e.textContent==='Use '+skill);assert.ok(use,run('game.pending?.kind'));use.listeners.click();use.listeners.click();assert.equal(run('star.injurySpecialUsed'),true);assert.equal(run('game.injuryRecords.length'),1);assert.equal(run('rolls.length'),0);
});
test('Bugman actual Grit UI preserves the ball and guards a defender-owned armour choice',()=>{const {get,run}=uiFixture('match');run('teams[1].league="Worlds Edge Superleague";globalThis.star=game.hireStar(1,"josef-bugman");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;game.rerolls=[0,0];game.ball={x:5,y:7,carrier:star.id};globalThis.rolls=[6,6,1,1,6,6,15,1];game.dice=()=>rolls.shift();game.armourOnly(star,()=>{},{});render()');assert.equal(run('game.pending.team'),1);const use=get('choices').children.find(e=>e.textContent==='Use Dwarfen Grit');assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('star.status'),'standing');assert.equal(run('game.ball.carrier===star.id'),true);assert.equal(run('rolls.length'),0);});

test('Skrull real passing modifier button rescues a re-roll once for the correct coach',()=>{
 const {get,run}=uiFixture('match');run('teams[0].league="Worlds Edge Superleague";globalThis.star=game.hireStar(0,"skrull-halfheight");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.mate=game.players[0];Object.assign(mate,{x:12,y:7,status:"standing"});game.phase="play";game.active=0;game.rerolls=[0,0];game.ball={x:5,y:7,carrier:star.id};globalThis.rolls=[1,2,6];game.dice=()=>rolls.shift();game.start(star.id,"pass");game.pass(12,7);render()');
 get('choices').children.find(e=>e.textContent==='Use Pass').listeners.click();assert.equal(run('game.pending.team'),0);const use=get('choices').children.find(e=>e.textContent==='Use Strong Passing Game');assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('game.ball.carrier===mate.id'),true);assert.equal(run('star.strongPassingUsed'),true);assert.equal(run('rolls.length'),0);
});
test('Bilerot real post-Blitz Vomit button previews targets and rejects stale choices',()=>{
 const {get,run}=uiFixture('match');run('teams[0].special=["Favoured of Nurgle"];globalThis.star=game.hireStar(0,"bilerot-vomitflesh");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing",extraSkills:["Block"]});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",extraSkills:["Block"],profileOverride:{...game.profile(foe),st:3}});game.phase="play";game.active=0;game.rerolls=[0,0];globalThis.rolls=[2,2,2,1,1];game.dice=()=>rolls.shift();game.startBlitz(star.id,foe.id);game.blitzBlock();game.selectBlockDie(0);game.decide("Both use Block");render()');
 const start=get('choices').children.find(e=>e.textContent==='Putrid Regurgitation (1 MA, ends activation)');assert.ok(start);start.listeners.click();assert.equal(run('game.pending.team'),0);const hit=get('choices').children.find(e=>e.textContent.startsWith('Vomit '));assert.ok(hit);hit.listeners.click();hit.listeners.click();assert.equal(run('star.putridHalf'),1);assert.equal(run('star.spent'),2);assert.equal(run('game.mover'),null);assert.equal(run('rolls.length'),0);
});
test('Deeproot real roster menu previews and hires his full temporary profile',()=>{
 const {get,run}=uiFixture('match');run('teams[0].league="Woodland League";game.configureStars(0);render()');get('choices').children.find(e=>e.textContent.startsWith('Hire Deeproot Strongbranch')).listeners.click();assert.match(run('game.pending.kind'),/MA2.*ST7/);assert.match(run('game.pending.kind'),/Reliable/);const confirm=get('choices').children.find(e=>e.textContent==='Confirm hire');assert.ok(confirm);confirm.listeners.click();confirm.listeners.click();assert.equal(run('game.players.filter(p=>p.star==="deeproot-strongbranch").length'),1);
});

function remainingStarUI(id,dice=[]){const ui=uiFixture('match');ui.run('globalThis.spec=MATCH_STARS.find(s=>s.id==='+JSON.stringify(id)+');teams[0].league=spec.leagues[0];teams[0].special=spec.special||[];globalThis.star=game.hireStar(0,spec.id);game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(star,{x:5,y:7,status:"standing"});globalThis.foe=game.players.find(p=>p.team===1);Object.assign(foe,{x:6,y:7,status:"standing",profileOverride:{...game.profile(foe),st:3,av:"9+",skills:[]}});game.phase="play";game.active=0;game.rerolls=[0,0];selected=star.id;globalThis.rolls='+JSON.stringify(dice)+';game.dice=()=>{if(!rolls.length)throw Error("Unexpected UI die");return rolls.shift();};render()');return ui;}
for(const id of ['jeremiah-kool','swiftvine-glimmershard','nobbla-blackwart'])test(id+' actual Special menu resolves its compound action',()=>{
 const {get,run}=remainingStarUI(id,id==='nobbla-blackwart'?[2,1,1]:[1,1]),name=id==='jeremiah-kool'?'The Flashing Blade':id==='swiftvine-glimmershard'?'Furious Outburst':"Kick 'em While They're Down!";
 if(id==='nobbla-blackwart')run('foe.status="prone";render()');
 get('special').listeners.click();const declare=get('choices').children.find(e=>e.textContent===name);assert.ok(declare);declare.listeners.click();
 const choose=()=>{const label=run('game.pending?.options[0]');const b=run('pendingPitchChoices().length')?decisionCell(get,run):get('choices').children.find(e=>e.textContent===label);assert.ok(b,label);b.listeners.click();return b;};
 if(id==='nobbla-blackwart'){const hit=get('choices').children.find(e=>e.textContent.startsWith('Chainsaw ·'));assert.ok(hit);hit.listeners.click();hit.listeners.click();assert.equal(run('star.kickEmUsed'),true);assert.equal(run('game.foulUsed[0]'),false);}
 else{const old=choose();if(id==='swiftvine-glimmershard'){choose();choose();assert.equal(run('game.blitzUsed[0]'),true);}else assert.equal(run('game.action'),'move');old.listeners.click();}
 assert.equal(run('rolls.length'),0);
});
test('Estelle actual activation choice disables the victim for the next team turn',()=>{const {get,run}=remainingStarUI('estelle-la-veneaux',[2]);run('game.start(star.id);render()');const button=decisionCell(get,run);button.listeners.click();button.listeners.click();assert.equal(run('foe.hexSkip'),true);run('game.finish();game.beginTurn(1);render()');assert.equal(run('game.canStart(foe)'),false);});
test('Black Gobbo actual Foul menu remains available after another teammate declares the normal Foul',()=>{const {get,run}=remainingStarUI('black-gobbo');run('game.foulUsed[0]=true;render()');assert.equal(get('special').disabled,false);get('special').listeners.click();const foul=get('choices').children.find(e=>e.textContent==='Foul');assert.ok(foul);foul.listeners.click();assert.equal(run('game.action'),'foul');});
test('Blast It actual scatter choices consume a reroll once and continue all three scatters',()=>{const {get,run}=remainingStarUI('barik-farblast',[1,5,5,5]);run('game.passContext={p:star,preview:{hail:true}};game.scatterPass(10,7,(x,y)=>globalThis.landed={x,y},()=>{});render()');const use=get('choices').children.find(e=>e.textContent==='Re-roll scatter');assert.ok(use);use.listeners.click();use.listeners.click();for(let i=0;i<2;i++){const label=run('game.pending.options[0]');get('choices').children.find(e=>e.textContent===label).listeners.click();}assert.equal(run('landed.x'),13);assert.equal(run('game.passContext.blastIt'),true);assert.equal(run('rolls.length'),0);});
test('Quick Bite actual catch interruption steals the ball before the continuation',()=>{const {get,run}=remainingStarUI('guffle-pusmaw',[6,6,6,3,3]);run('globalThis.caught=false;game.landBall(foe.x,foe.y,false,()=>caught=true,true);render()');assert.equal(run('caught'),false);const use=get('choices').children.find(e=>e.textContent.startsWith('Use Quick Bite with '));assert.ok(use);use.listeners.click();use.listeners.click();assert.equal(run('caught'),true);assert.equal(run('game.ball.carrier===star.id'),true);assert.equal(run('rolls.length'),0);});
test('Squigmobile actual purchase requires the opposing coach consent before hiring',()=>{const {get,run}=uiFixture('match');run('game.configureStars(0);render()');get('choices').children.find(e=>e.textContent.startsWith("Hire Da Red Gobbo's Squigmobile")).listeners.click();get('choices').children.find(e=>e.textContent==='Confirm hire').listeners.click();assert.equal(run('game.pending.team'),1);assert.equal(run('game.players.some(p=>p.star==="red-gobbo-squigmobile")'),false);const allow=get('choices').children.find(e=>e.textContent==='Allow Squigmobile');assert.ok(allow);allow.listeners.click();allow.listeners.click();assert.equal(run('game.players.filter(p=>p.star==="red-gobbo-squigmobile").length'),1);});
function passOverlayFixture(){
 const f=outlierUi([],'match');f.run('a.profileOverride.pa="2+";b.profileOverride.ag="5+";Object.assign(b,{x:13,y:7});d.status="reserve";d.x=null;d.y=null;game.ball={x:a.x,y:a.y,carrier:a.id};game.start(a.id,"pass");game.dice=()=>{throw Error("Overlay must not roll dice")};ballMode=true;render()');return f;
}
test('pass overlay colors a receiver by the pass roll and previews without dice',()=>{
 const {get,run}=passOverlayFixture(),cell=get('pitch').children[7*26+13];assert.match(cell.className,/risk-2/);assert.equal(cell.dataset.throwRange,'Q');assert.match(cell.title,/Accurate pass 2\+.*Catch 5\+/);assert.ok(cell.children.some(e=>e.textContent==='2+/5+'));assert.equal(run('rolls.length'),0);assert.equal(get('throwing-key').hidden,true);
 const empty=get('pitch').children[7*26+12];assert.match(empty.className,/throw-range/);assert.ok(!empty.children.some(e=>e.className==='throw-range-label'));assert.match(empty.title,/Quick Pass/);
 cell.listeners.click();assert.equal(run('throwDestination.x'),13);assert.equal(run('game.ball.carrier'),run('a.id'));assert.match(get('pitch').children[7*26+13].className,/destination/);
 run('ballMode=false;throwDestination=null;render()');assert.ok(get('pitch').children.every(e=>!e.className.includes('throw-range')));assert.equal(get('throwing-key').hidden,true);
});
test('pass overlay applies catch skills, rain and markers without using reroll odds as roll difficulty',()=>{
 const {get,run}=passOverlayFixture();run('b.profileOverride.ag="3+";b.extraSkills=["Extra Arms","Catch"];game.weather="Pouring Rain";Object.assign(d,{x:14,y:7,status:"standing"});render()');assert.match(get('pitch').children[7*26+13].title,/Catch 4\+/);assert.match(get('pitch').children[7*26+13].className,/risk-2/);
 run('b.extraSkills.push("Nerves of Steel");render()');assert.match(get('pitch').children[7*26+13].className,/risk-2/);assert.ok(get('pitch').children[7*26+13].children.some(e=>e.textContent==='2+/3+'));
});
test('pass overlay uses accurate pass skills and current weather in every range',()=>{
 const {get,run}=passOverlayFixture();run('b.status="reserve";b.x=null;b.y=null;a.extraSkills=["Accurate","Cannoneer"];game.weather="Very Sunny";render()');
 for(const [x,letter,risk] of [[13,'Q',2],[16,'S',3],[20,'L',4],[23,'B',5]]){const cell=get('pitch').children[7*26+x];assert.equal(cell.dataset.throwRange,letter);assert.match(cell.className,new RegExp('risk-'+risk));}
 run('game.weather="Blizzard";render()');assert.ok(!get('pitch').children[7*26+20].className.includes('throw-range'));
});
test('pass overlay displays automatic fumble and unable catchers without NaN',()=>{
 const {get,run}=passOverlayFixture();run('a.profileOverride.pa="-";render()');let cell=get('pitch').children[7*26+13];assert.match(cell.title,/automatic fumble/);assert.match(cell.className,/risk-6/);assert.ok(cell.children.some(e=>e.textContent==='×/5+'));assert.ok(!cell.title.includes('NaN'));
 run('a.profileOverride.pa="2+";b.status="prone";render()');cell=get('pitch').children[7*26+13];assert.match(cell.title,/Cannot catch/);assert.match(cell.className,/risk-2/);
});
test('throw and kick teammate overlays only offer Quick and Short ranges from the thrower',()=>{
 for(const action of ['throw-team-mate','kick-team-mate']){
  const {get,run}=outlierUi([]);run('a.extraSkills=["Throw Team-mate","Kick Team-mate","Strong Arm"];b.extraSkills=["Right Stuff"];a.profileOverride.pa="3+";game.start(a.id,'+JSON.stringify(action)+');game.selectThrowMate(b.id);ballMode=true;render()');
  assert.equal(get('pitch').children[7*26+13].dataset.throwRange,'Q');assert.ok(!get('pitch').children[7*26+13].children.some(e=>e.className==='throw-range-label'));assert.equal(get('pitch').children[7*26+16].dataset.throwRange,'S');assert.ok(!get('pitch').children[7*26+17].className.includes('throw-range'));assert.match(get('pitch').children[7*26+13].title,/Superb Throw 2\+.*Scatters/);assert.equal(get('throwing-key').textContent,'');
 }
});
test('Hail Mary overlay never promises an accurate delivery or a catch at the aimed square',()=>{
 const {get,run}=passOverlayFixture();run('a.extraSkills=["Hail Mary Pass"];a.hailMary=true;render()');const cell=get('pitch').children[7*26+13];assert.equal(cell.dataset.throwRange,'H');assert.match(cell.title,/Always scatters/);assert.ok(!cell.title.includes('Catch 5+'));
});
test('enemy pass labels show interception rolls in red and narrow to the chosen lane',()=>{
 const {get,run}=passOverlayFixture();run('game.interceptionCandidates=MatchGame.prototype.interceptionCandidates;Object.assign(d,{x:12,y:7,status:"standing"});d.profileOverride.ag="3+";render()');
 let enemy=get('pitch').children[7*26+12];assert.match(enemy.className,/interception-risk/);assert.ok(enemy.children.some(e=>e.className==='throw-range-label'&&e.textContent==='6+'));assert.match(enemy.title,/Accurate pass: 6\+/);assert.ok(!enemy.title.includes('Catch 3+'));
 run('throwDestination={x:13,y:7};render()');assert.match(get('pitch').children[7*26+12].className,/interception-risk/);
 run('throwDestination={x:10,y:3};render()');enemy=get('pitch').children[7*26+12];assert.ok(!enemy.className.includes('interception-risk'));assert.ok(!enemy.children.some(e=>e.className==='throw-range-label'));
});
test('interception overlay respects skills, weather, eligibility and Hail Mary',()=>{
 const {get,run}=passOverlayFixture();run('game.interceptionCandidates=MatchGame.prototype.interceptionCandidates;Object.assign(d,{x:12,y:7,status:"standing",extraSkills:["Very Long Legs","Extra Arms"]});d.profileOverride.ag="3+";b.x=14;throwDestination={x:14,y:7};render()');assert.ok(get('pitch').children[7*26+12].children.some(e=>e.textContent==='3+'));
 run('game.weather="Pouring Rain";render()');assert.ok(get('pitch').children[7*26+12].children.some(e=>e.textContent==='4+'));
 for(const change of ['d.status="prone"','d.status="standing";d.distracted=true','d.distracted=false;d.extraSkills=["No Ball"]','d.extraSkills=[];a.extraSkills=["Cloud Burster"]','d.extraSkills=["Very Long Legs"];a.extraSkills=["Hail Mary Pass"];a.hailMary=true']){run(change+';render()');assert.ok(!get('pitch').children[7*26+12].className.includes('interception-risk'));}
});
