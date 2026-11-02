const {projectPath}=require('../helpers/project.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// A DOM event harness executes the complete bundled application, including the
// workspace layer. Visual/browser verification remains a separate requirement.
function workspaceFixture(scenario='block'){
 const html=fs.readFileSync(projectPath('index.html'),'utf8'),elements=new Map();let context;
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.dataset={};this.style={};this.textContent='';this.value='';this.className='';this.parentElement=null;this.disabled=false;this.hidden=false;this.isConnected=true;this.popoverOpen=false;}
  append(...items){for(const item of items){if(item.parentElement)item.parentElement.children=item.parentElement.children.filter(e=>e!==item);item.parentElement=this;this.children.push(item);}}
  prepend(...items){const before=[...this.children];this.children=[];this.append(...items,...before);}
  replaceChildren(...items){for(const child of this.children){child.isConnected=false;child.parentElement=null;}this.children=[];this.append(...items);}
  setAttribute(k,v){this[k]=String(v);}getAttribute(k){return this[k]??null;}removeAttribute(k){delete this[k];}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  emit(k,extra={}){const e={target:this,preventDefault(){},...extra};for(const fn of this.listeners[k]||[])fn(e);}
  click(){if(!this.disabled)this.emit('click');}
  before(){}after(e){this.parentElement?.append(e);}scrollIntoView(){}
  focus(){document.activeElement=this;}
  matches(selector){return selector===':popover-open'?!!this.popoverOpen:selector==='.square'?this.className.split(' ').includes('square'):['button','details','summary','table','tr'].includes(selector)?this.tagName===selector.toUpperCase():false;}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  querySelectorAll(selector){return this.children.flatMap(e=>[...(e.matches(selector)?[e]:[]),...e.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  showPopover(){this.popoverOpen=true;}hidePopover(){this.popoverOpen=false;}
  getBoundingClientRect(){return {top:100,left:200,right:230,bottom:130,width:this===get('pitch-popup')?280:30,height:this===get('pitch-popup')?300:30};}
 }
 const get=id=>{const find=node=>node.id===id?node:node.children.map(find).find(Boolean);const found=[...elements.values()].map(find).find(Boolean);if(found){elements.set(id,found);return found;}if(!elements.has(id)){const e=new Element(id.startsWith('tab-')?'button':'div');e.id=id;elements.set(id,e);}return elements.get(id);};
 const document={getElementById:get,createElement:tag=>new Element(tag),querySelectorAll:()=>[],listeners:{},addEventListener(k,f){(this.listeners[k]??=[]).push(f);},activeElement:null};
 get('team-data').textContent=html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1];get('scenario').value=scenario;get('player-details').append(get('profile'));get('coach-panel').append(get('pitch-popup'));get('pitch-popup').hidden=true;
 get('roster-data').textContent=html.match(/id="roster-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 const storage=new Map();context=vm.createContext({document,console,innerWidth:1200,innerHeight:800,addEventListener(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 const scripts=[...html.matchAll(/<script(?: id="(?:(?:movement|skills|match|league)-engine|league-ui|workspace-ui)")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInContext(scripts,context);
 const run=code=>vm.runInContext(code,context),popup=()=>get('pitch-popup').querySelectorAll('button'),action=label=>{const b=popup().find(b=>b.textContent===label);assert.ok(b,'Popup action '+label);return b;};
 return {get,run,document,popup,action,key:key=>document.listeners.keydown.forEach(fn=>fn({key})),cell:(x,y)=>get('pitch').children[y*26+x]};
}

test('Wizard targeting highlights legal squares, confirms mixed-team victims and rejects stale target dialogs',()=>{
 const f=workspaceFixture('match');f.run(`game.setResource(0,'wizards',1);game.phase='play';game.turns=[1,0];game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));Object.assign(game.players[0],{x:10,y:7,status:'standing'});Object.assign(game.players.find(p=>p.team===1),{x:11,y:7,status:'standing'});game.endTurn();game.decide('Fireball');globalThis.oldTarget=game.pending;render();`);
 assert.equal(f.cell(10,7)['data-spell-target'],'Fireball');assert.equal(f.cell(0,0)['data-spell-target'],undefined);
 f.cell(10,7).click();assert.equal(f.run('game.pending.kind.includes(teams[0].name)&&game.pending.kind.includes(teams[1].name)'),true);assert.equal(f.run('game.wizards[0]'),1);assert.equal(f.run("oldTarget.resolve('Cancel spell')"),false);
 const cancel=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Cancel spell');assert.ok(cancel);cancel.click();assert.equal(f.run('game.pending.kind.startsWith("Wizard")'),true);f.run("game.decide('Keep Wizard');render();");assert.equal(f.run('game.phase'),'play');assert.equal(f.run('game.active'),1);assert.equal(f.run('game.wizards[0]'),1);
});

test('Wizard target confirmation executes the actual inline UI through the next team turn',()=>{
 const f=workspaceFixture('match');f.run(`game.setResource(0,'wizards',1);game.phase='play';game.turns=[1,0];game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));Object.assign(game.players[0],{x:10,y:7,status:'standing'});game.dice=()=>1;game.endTurn();game.decide('Zap');render();`);
 f.cell(10,7).click();const cast=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Cast Zap at 11, 8');assert.ok(cast);cast.click();assert.equal(f.run('game.wizards[0]'),0);assert.equal(f.run('game.phase'),'play');assert.equal(f.run('game.turns[1]'),1);assert.equal(f.run('game.pending'),null);
});

test('mercenary purchase controls hire a labeled reserve, then the dugout places them in setup',()=>{
 const f=workspaceFixture('match');f.run('game.configureResources(0);render();');
 const click=label=>{const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent===label);assert.ok(b,label);b.click();};
 click('Mercenaries');const hire=f.get('choices').querySelectorAll('button').find(b=>b.textContent.startsWith('Hire Imperial Retainer'));assert.ok(hire);hire.click();click('Hire with Block (+50,000 gp)');click('Back');click('Done');
 assert.equal(f.run('game.players.filter(p=>p.mercenary).length'),1);assert.equal(f.run('game.resourceCosts(0).inducements'),125000);
 f.run("game.phase='setup';game.setupTeam=0;render();");const id=f.run('game.players.find(p=>p.mercenary).id'),card=f.get('dugout').querySelectorAll('button').find(b=>b.dataset.playerId===id);assert.ok(card);assert.ok(card['aria-label'].includes('Mercenary'));card.click();f.action('Select for setup').click();f.cell(5,7).click();assert.equal(f.run('game.players.find(p=>p.mercenary).x'),5);
});

test('automatic prayers keep the pregame overview visible and expose the owning coach choice',()=>{
 const f=workspaceFixture('match');f.run("game.teams[0].ctv=900000;game.teams[1].ctv=950000;game.dice=()=>4;game.phase='leagueSteps';game.advancePregame();render();");assert.equal(f.run('game.phase'),'prayers');assert.equal(f.get('pregame-overview').hidden,false);assert.equal(f.get('pitch-board').hidden,true);assert.equal(f.document.activeElement,f.get('choices'));assert.equal(f.run('game.pending.team'),0);const button=f.get('choices').querySelectorAll('button')[0];button.click();assert.equal(f.run('game.phase'),'rolloff');assert.ok(dugoutNodes(f.get('matchflow')).some(e=>e.textContent==='Active prayers · last until full time'));
});
test('trapdoor squares are marked, accessible and included in committed-route check summaries',()=>{
 const f=workspaceFixture('match');f.run("game.applyPrayer(0,'Treacherous Trapdoor');game.phase='play';game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));Object.assign(game.players[0],{x:5,y:1,status:'standing'});selected=game.players[0].id;render();");const cell=f.cell(6,1);assert.ok(cell.className.includes('trapdoor'));assert.ok(cell['aria-label'].includes('trapdoor (2+ to cross)'));assert.equal(f.cell(7,1).className.includes('trapdoor'),false);assert.ok(f.run('planChecks({x:6,y:1,rushes:0},game.players[0]).includes("Trapdoor 2+")'));
});
test('Rock-only decisions use a Rock label and skipping preserves both the resource and turn count',()=>{
 const f=workspaceFixture('match');f.run("game.applyPrayer(0,'Throw a Rock');game.phase='play';game.turns=[1,1];game.active=1;game.endTurn();render();");assert.ok(f.run('game.pending.kind.startsWith("Throw a Rock")'));const keep=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Keep Rock');assert.ok(keep);keep.click();assert.equal(f.run('game.rocks[0]'),1);assert.equal(f.run('game.turns[0]'),2);assert.equal(f.run('game.pending'),null);
});
test('workspace tabs preserve the exact game and support arrow-key selection',()=>{
 const f=workspaceFixture();f.run('globalThis.before=game');f.get('tab-teams').click();assert.equal(f.run('workspaceView'),'teams');assert.equal(f.get('play-view').hidden,true);assert.equal(f.get('teams-view').hidden,false);f.get('tab-teams').emit('keydown',{key:'ArrowRight'});assert.equal(f.run('workspaceView'),'rosters');assert.equal(f.get('tab-rosters').tabIndex,0);assert.equal(f.get('tab-play').tabIndex,-1);f.get('tab-play').click();assert.equal(f.run('game===before'),true);
});
test('clicking a player opens legal actions and a menu click declares only once',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();assert.equal(!f.get('pitch-popup').hidden,true);assert.match(f.get('pitch-popup').children[2].textContent,/Black Orcs/);assert.ok(!f.popup().some(b=>b.textContent==='Declare Pass'));f.run('game.dice=()=>6');f.cell(p.x,p.y+1).click();const move=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm Move');assert.ok(move);move.click();const mover=f.run('game.mover');assert.ok(mover);move.click();assert.equal(f.run('game.mover'),mover);assert.equal(!f.get('pitch-popup').hidden,false);
});
test('an opponent tile offers Block and Blitz without changing the acting player',()=>{
 const f=workspaceFixture(),selected=f.run('selected');f.run('globalThis.target=game.players.find(p=>p.team!==game.active&&game.canBlock(game.players.find(p=>p.id===selected),p));game.dice=()=>3');const target=JSON.parse(f.run('JSON.stringify(target)'));f.cell(target.x,target.y).click();assert.equal(f.run('selected'),selected);const block=f.action('Block #'+target.number);assert.ok(f.popup().some(b=>b.textContent.startsWith('Declare Blitz')));block.click();assert.equal(f.run('game.pending.type'),'blockSelect');const old=f.run('game.pending');block.click();assert.equal(f.run('game.pending'),old);
});
test('Escape closes a menu, returns focus and cancels previews without moving',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();f.key('Escape');assert.equal(!f.get('pitch-popup').hidden,false);assert.equal(f.document.activeElement,f.cell(p.x,p.y));f.run('choose(9,8)');assert.ok(f.run('destination'));f.key('Escape');assert.equal(f.run('destination'),null);assert.equal(f.run('game.mover'),null);
});
test('roving pitch navigation has one Tab stop and stays inside pitch boundaries',()=>{
 const f=workspaceFixture();assert.equal(f.get('pitch').children.filter(e=>e.tabIndex===0).length,1);f.get('pitch').emit('keydown',{target:f.cell(0,0),key:'ArrowLeft'});assert.equal(f.document.activeElement,f.cell(0,0));f.get('pitch').emit('keydown',{target:f.cell(0,0),key:'ArrowDown'});assert.equal(f.document.activeElement,f.cell(0,1));assert.equal(f.get('pitch').children.filter(e=>e.tabIndex===0).length,1);f.cell(0,1).focus();f.run('render()');assert.equal(f.document.activeElement,f.cell(0,1));
});
test('hover and focus information include skills, characteristics and ball state',()=>{
 const f=workspaceFixture('pass');const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.get('pitch').emit('focusin',{target:f.cell(p.x,p.y)});assert.match(f.get('pitch-tooltip').textContent,/MA 6|MA 7/);assert.match(f.get('pitch-tooltip').textContent,/ball carrier/);assert.match(f.get('pitch-tooltip').textContent,/Pass/);assert.equal(f.cell(p.x,p.y)['aria-describedby'],'pitch-tooltip');f.get('pitch').emit('focusout');assert.equal(f.get('pitch-tooltip').popoverOpen,false);
});
test('pending coach decisions cannot be bypassed by player menus or selection',()=>{
 const f=workspaceFixture();f.run('game.pending={type:"custom",kind:"Test choice",options:["Continue"],resolve:()=>{game.pending=null;}};render()');const selected=f.run('selected');f.run('choose(11,7)');assert.equal(f.run('selected'),selected);assert.equal(!f.get('pitch-popup').hidden,false);assert.equal(f.get('action-disclosure').hidden,true);assert.match(f.get('pitch-hint').textContent,/Decision required/);
});
test('pregame optional staff is collapsed, primary progression remains visible',()=>{
 const f=workspaceFixture('match'),flow=f.get('matchflow');assert.ok(flow.children.some(e=>e.textContent==='Determine fans'));const staff=flow.children.find(e=>e.tagName==='DETAILS');assert.ok(staff);assert.ok(!staff.open);assert.ok(staff.children.some(e=>e.textContent.startsWith('Configure staff')));assert.ok(!f.get('match-scoreboard').children.find(e=>e.className==='match-meta').textContent.includes('Bribes 0 / 0'));
});
test('active movement preview offers commit, with repeated clicks guarded',()=>{
 const f=workspaceFixture('pickup');f.run('selected=game.players[0].id;game.start(selected);render();choose(10,8)');assert.ok(f.run('destination'));const commit=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm Move');assert.ok(commit);commit.click();assert.equal(f.run('destination'),null);const before=f.run('JSON.stringify(game.players)');commit.click();assert.equal(f.run('JSON.stringify(game.players)'),before);
});
test('closed action-panel callbacks cannot execute and switching tabs clears the panel',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();const move=f.action('Show full profile & skills');f.run('closePitchPopup()');move.click();assert.equal(f.run('game.mover'),null);f.cell(p.x,p.y).click();f.get('tab-teams').click();assert.equal(!f.get('pitch-popup').hidden,false);
});
test('new presentation assets are embedded exactly in the standalone page',()=>{
 const html=fs.readFileSync(projectPath('index.html'),'utf8');for(const [tag,id,file] of [['script','workspace-ui','src/ui/workspace-ui.cjs'],['style','workspace-style','src/ui/workspace.css']])assert.equal(html.match(new RegExp('<'+tag+' id="'+id+'">\\n([\\s\\S]*?)\\n</'+tag+'>'))[1],fs.readFileSync(projectPath(file),'utf8').trimEnd());assert.ok(html.includes('Skills & traits · '));
});
test('a Foul target is selectable directly from its occupied tile',()=>{
 const f=workspaceFixture('skills');f.run('globalThis.a=game.players[0];globalThis.d=game.players[11];d.x=11;d.y=7;d.status="prone";selected=a.id;game.start(a.id,"foul");render();game.dice=()=>2;choose(d.x,d.y)');assert.ok(f.action('Foul #1'));f.action('Foul #1').click();assert.ok(f.run('game.events.some(e=>e.includes("Foul"))'));
});
test('throwing players can choose a team-mate from the pitch context menu',()=>{
 const f=workspaceFixture('throw-team-mate');f.run('game.dice=()=>6;game.start(selected,"throw-team-mate");render();globalThis.mate=game.throwCandidates()[0];choose(mate.x,mate.y)');const number=f.run('mate.number');f.action('Throw team-mate #'+number).click();assert.equal(f.run('game.throwMate===mate.id'),true);assert.equal(f.run('ballMode'),true);
});
test('pregame overview progresses to the real pitch when setup begins',()=>{
 const f=workspaceFixture('match');assert.equal(f.get('pregame-overview').hidden,false);assert.equal(f.get('pitch-board').hidden,true);f.run('game.phase="setup";game.setupTeam=0;render()');assert.equal(f.get('pregame-overview').hidden,true);assert.equal(f.get('pitch-board').hidden,false);
});
test('league staff disclosures stay open after a purchase and preserve button focus',()=>{
 const f=workspaceFixture();f.run('leagueSelected=leagueStore.create(demoLeagueTeams[0].id,"Nobles").id;leagueSave();renderLeague()');const details=f.run('leaguePanel.querySelectorAll("details")'),staff=details.find(e=>e.querySelector('summary').textContent.startsWith('Staff & re-rolls'));staff.open=true;const buy=staff.querySelectorAll('button').find(e=>e.textContent==='+ Team re-rolls');buy.focus();buy.click();const updated=f.run('leaguePanel.querySelectorAll("details")').find(e=>e.querySelector('summary').textContent.startsWith('Staff & re-rolls'));assert.equal(updated.open,true);assert.equal(f.document.activeElement.textContent,'+ Team re-rolls');assert.equal(f.run('leagueStore.team(leagueSelected).staff.teamRerolls'),1);
});
test('all six actual engine Block faces receive symbols and result explanations',()=>{
 const f=workspaceFixture();f.run('globalThis.a=game.players.find(p=>p.id===selected);globalThis.target=game.players.find(p=>game.canBlock(a,p));game.dice=()=>3;game.block(a.id,target.id);game.blockAction.dice=[1,2,3,4,5,6];render()');const dice=f.get('choices').querySelectorAll('button').filter(e=>e.textContent.startsWith('Die '));assert.equal(dice.length,6);assert.ok(dice.every(e=>e.className.includes('block-die')&&e.dataset.glyph&&e.title&&e['aria-label']===e.textContent));assert.match(dice[0].title,/Attacker/);assert.match(dice[4].title,/Dodge/);
});
test('defending coach is identified for Stand Firm and Sidestep decisions',()=>{
 const f=workspaceFixture();f.run('globalThis.a=game.players.find(p=>p.id===selected);globalThis.d=game.players.find(p=>game.canBlock(a,p));game.dice=()=>3;game.block(a.id,d.id);game.selectBlockDie(0);render()');assert.equal(f.run('game.pending.kind'),'Stand Firm');assert.match(f.get('choices').children[0].textContent,/Imperial Nobility/);f.run('d.extraSkills=["Sidestep"];game.pending.options.includes("Be pushed")&&game.decide("Be pushed");render()');assert.match(f.run('decisionCoachLabel(game.pending)'),/Imperial Nobility/);
});
test('pitch magnification changes only presentation and preserves game state',()=>{
 const f=workspaceFixture();const before=f.run('JSON.stringify(game.players)');f.get('pitch-scale').value='2';f.get('pitch-scale').emit('change');assert.equal(f.get('pitch').style.minWidth,'1300px');assert.equal(f.run('JSON.stringify(game.players)'),before);f.get('pitch-scale').value='1';f.get('pitch-scale').emit('change');assert.equal(f.get('pitch').style.minWidth,'650px');
});
test('league pregame shows that purchases must finish before continuing',()=>{
 const f=workspaceFixture('match');f.run('game.league=true;teams[0].ctv=100000;teams[1].ctv=50000;teams[0].treasury=100000;teams[1].treasury=50000;game.phase="leagueSteps";game.leaguePurchaseOrder=[0,1];game.leaguePurchaseStep=0;render()');const next=f.get('matchflow').children.find(e=>e.textContent==='Complete inducement purchases first');assert.ok(next);assert.equal(next.disabled,true);f.run('game.leaguePurchaseStep=2;render()');assert.ok(f.get('matchflow').children.some(e=>e.textContent==='Continue league pre-game'&&!e.disabled));
});
test('kick aiming highlights the receiving half and directions swap at halftime',()=>{
 const f=workspaceFixture('match');f.run('game.phase="kickAim";game.receiving=0;game.half=1;render()');assert.equal(f.get('pitch').children.filter(e=>e.className.includes('kick-target')).length,195);assert.match(f.get('pitch-hint').textContent,/left half/);assert.match(f.cell(0,0)['aria-label'],/valid kick target/);assert.match(f.get('pitch-direction').textContent,/Imperial Nobility →/);f.run('game.half=2;render()');assert.match(f.get('pitch-hint').textContent,/right half/);assert.match(f.get('pitch-direction').textContent,/Imperial Nobility ←/);assert.ok(!f.cell(0,0).className.includes('kick-target'));
});
test('the movement action panel retains required checks in a collapsed disclosure before committing a risky route',()=>{
 const f=workspaceFixture('dodge');f.run('selected=game.players[0].id;game.start(selected);render();choose(10,8)');const text=dugoutNodes(f.get('choices')).map(e=>e.textContent).join('\n');assert.match(text,/Planned route: 1 step/);assert.match(text,/Dodge/);assert.ok(f.get('pitch-popup').hidden);assert.equal(f.run('game.players[0].spent'),0);
});
test('the dock never uses native popovers and closing restores pitch focus without reopening a tooltip',()=>{
 const f=workspaceFixture(),p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))')),cell=f.cell(p.x,p.y),panel=f.get('pitch-popup');panel.showPopover=panel.hidePopover=()=>{throw Error('Actions must not use floating popovers');};f.get('pitch-tooltip').showPopover=()=>{throw Error('Tooltip must stay closed while restoring focus');};cell.click();const anchor=f.cell(p.x,p.y);anchor.focus=function(){f.document.activeElement=anchor;f.get('pitch').emit('focusin',{target:anchor});};assert.equal(panel.hidden,false);assert.doesNotThrow(()=>f.popup().find(b=>b['aria-label']==='Close pitch actions').click());assert.ok(panel.hidden);assert.equal(f.document.activeElement,anchor);
});

test('exhibition roster selectors create exactly two teams and practice reset restores original fixtures',()=>{
 const f=workspaceFixture('match');assert.equal(f.get('exhibition-home').children.length,30);f.get('exhibition-home').value='lizardmen';f.get('exhibition-away').value='dwarf';f.get('exhibition-home').emit('change');assert.equal(f.run('teams.length'),2);assert.equal(f.run('game.teams[0].id'),'lizardmen');assert.equal(f.run('game.teams[1].id'),'dwarf');f.get('scenario').value='block';f.get('scenario').emit('change');assert.equal(f.run('teams[0].id'),'imperial-nobility');assert.equal(f.run('teams[1].id'),'black-orc');assert.equal(f.get('exhibition-rosters').hidden,true);
});
test('exhibition league/alignment choices affect only the selected side and expose legal options',()=>{
 const f=workspaceFixture('match');f.get('exhibition-home').value='chaos-chosen';f.get('exhibition-home').emit('change');assert.equal(f.get('exhibition-home-alignment').children.length,6);f.get('exhibition-home-alignment').value='Nurgle';f.get('exhibition-home-alignment').emit('change');assert.equal(f.run('game.hasTeamRule(0,"Favoured of Nurgle")'),true);assert.equal(f.run('game.hasTeamRule(1,"Favoured of Nurgle")'),false);f.get('exhibition-home').value='norse';f.get('exhibition-home').emit('change');f.get('exhibition-home-league').value='Chaos Clash';f.get('exhibition-home-league').emit('change');assert.equal(f.run('game.hasTeamRule(0,"Favoured of Khorne")'),true);
});
test('the real Swarming panel selects reserve Linemen and guards stale finish controls across coaches',()=>{
 const f=workspaceFixture('match');f.run('teams.splice(0,2,...[0,1].map(()=>JSON.parse(JSON.stringify(rosterCatalog.find(r=>r.id==="snotling")))));game=new MatchGame(teams,{dice:()=>3});game.phase="kickChoice";game.chooseKicking(0);game.confirmSetup();game.confirmSetup();render()');const number=f.run('game.players.find(p=>p.id===game.swarmState.eligible[0]).number');f.get('matchflow').children.find(e=>e.textContent==='Swarming Lineman #'+number).click();f.run('choose(1,6)');assert.equal(f.run('game.swarmState.placed.length'),1);const finish=f.get('matchflow').children.find(e=>e.textContent==='Finish Swarming');finish.click();assert.equal(f.run('game.swarmState.team'),1);finish.click();assert.equal(f.run('game.swarmState.team'),1);f.get('matchflow').children.find(e=>e.textContent==='Finish Swarming').click();assert.equal(f.run('game.phase'),'kicker');
});
test('new required decisions receive focus and new games reset coach-panel scrolling',()=>{
 const f=workspaceFixture('match');f.run('game.pending={type:"custom",kind:"Decision",team:0,options:["Continue"],resolve:()=>{game.pending=null;}};render()');assert.equal(f.document.activeElement,f.get('choices'));f.get('coach-panel').scrollTop=250;f.get('reset').click();assert.equal(f.get('coach-panel').scrollTop,0);assert.equal(f.run('game.pending'),null);
});
function dugoutNodes(e){return [e,...e.children.flatMap(dugoutNodes)];}
test('visual dugouts partition reserves, KO, injury, death, send-off and drive-unavailable players',()=>{
 const f=workspaceFixture();f.run('game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));game.players[1].status="knocked-out";game.players[2].status="casualty";game.players[2].casualty={result:"Smashed knee"};game.players[3].status="casualty";game.players[3].casualty={result:"Dead",dead:true};game.players[4].status="sent-off";game.players[5].heatOut=true;game.players[6].snackOut=true;Object.assign(game.players[7],{x:5,y:7,status:"stunned"});render()');const cards=dugoutNodes(f.get('dugout')).filter(e=>e.dataset.playerId);assert.equal(cards.length,21);for(const [index,state] of [[1,'ko'],[2,'injured'],[3,'dead'],[4,'sent-off'],[5,'unavailable'],[6,'unavailable']])assert.equal(f.run('dugoutState(game.players['+index+'])'),state);assert.equal(f.run('dugoutState(game.players[7])'),'pitch');assert.equal(f.get('dugout').hidden,false);
});

test('a carried passenger has an informational Unavailable dugout card with the carrier named',()=>{const f=workspaceFixture('match');f.run('const grak=game.hireStar(0,"grak-crumbleberry");globalThis.crumb=game.players.find(p=>p.starRole==="crumbleberry");crumb.status="carried";crumb.x=null;crumb.y=null;render()');assert.equal(f.run('dugoutState(crumb)'),'unavailable');assert.match(f.run('dugoutReason(crumb)'),/Carried by Grak/);assert.equal(f.run('dugoutActions(crumb).length'),0);});
test('dugout information is safe during play and cannot activate a KO player or spend dice',()=>{
 const f=workspaceFixture();f.run('game.players[0].x=null;game.players[0].y=null;game.players[0].status="knocked-out";game.dice=()=>{throw Error("Unexpected die")};render()');const before=f.run('JSON.stringify(game.players)'),card=dugoutNodes(f.get('dugout')).find(e=>e.dataset.playerId==='0-1');card.click();assert.equal(f.run('JSON.stringify(game.players)'),before);assert.ok(!f.popup().some(e=>e.textContent.startsWith('Select for')));assert.match(dugoutNodes(f.get('pitch-popup')).map(e=>e.textContent).join(' '),/knocked-out/);
});
test('reserve cards select only legal setup players and placement still uses the pitch engine',()=>{
 const f=workspaceFixture('match');assert.equal(f.get('dugout').hidden,true);f.run('game.players.push({...game.players[0],id:"0-12",number:12,x:null,y:null,status:"reserve"});game.phase="kickChoice";game.chooseKicking(0);globalThis.vacated={x:game.players[1].x,y:game.players[1].y};game.benchSetup(game.players[1].id);render()');const card=dugoutNodes(f.get('dugout')).find(e=>e.dataset.playerId==='0-12');card.click();f.action('Select for setup').click();assert.equal(f.run('selected'),'0-12');f.cell(f.run('vacated.x'),f.run('vacated.y')).click();assert.equal(f.run('game.players.find(p=>p.id==="0-12").status'),'standing');assert.equal(f.run('game.players.filter(p=>p.team===0&&game.onPitch(p)).length'),11);
});
test('injured saved players appear in the dugout without being added to the live match roster',()=>{
 const f=workspaceFixture('match');f.run('const l=leagueStore.createLeague("Dugouts");const clubs=demoLeagueTeams.slice(0,2).map(r=>{const t=leagueStore.create(r.id,r.name);for(let n=0;n<11;n++)leagueStore.hire(t.id,0);leagueStore.submit(t.id);leagueStore.enterLeague(l.id,t.id);return t;});clubs[0].players[0].missNext=true;const fixture=leagueStore.startFixture(...clubs.map(t=>t.id));teams.splice(0,2,...fixture.teams);game=new MatchGame(teams);game.leagueFixtureId=fixture.id;game.phase="play";selected=null;render()');assert.equal(f.run('game.players.length'),22);assert.equal(f.run('dugoutPlayers(0).length'),12);assert.equal(f.run('dugoutState(dugoutPlayers(0).find(p=>p.fixtureUnavailable))'),'injured');const ghost=dugoutNodes(f.get('dugout')).find(e=>e.dataset.playerId?.startsWith('unavailable:'));assert.ok(ghost);assert.match(ghost['aria-label'],/Misses this fixture/);
});

test('lifted Wisdom participants are selectable from the complete workspace dugouts',()=>{
 const f=workspaceFixture('match');f.run('game.setResource(0,"josefBugman",1);game.dice=()=>1;game.phase="kickChoice";game.chooseKicking(0);game.confirmSetup();game.confirmSetup();globalThis.p=game.players[0];globalThis.pos={x:p.x,y:p.y};game.decide("Use Dwarfen Wisdom");game.decide("Redeploy #1");render()');const card=f.get('dugout').querySelectorAll('button').find(b=>b.dataset.playerId===f.run('p.id'));assert.ok(card);card.click();f.action('Select for Dwarfen Wisdom').click();assert.equal(f.run('selected'),f.run('p.id'));f.cell(f.run('pos.x'),f.run('pos.y')).click();assert.equal(f.run('p.status'),'standing');const finish=f.get('matchflow').querySelectorAll('button').find(b=>b.textContent==='Finish Dwarfen Wisdom');finish.click();finish.click();assert.equal(f.run('game.phase'),'kicker');assert.equal(f.run('game.dwarfenWisdom[0]'),0);
});

test('complete star purchase UI previews Griff, rejects replay and places him from the dugout',()=>{
 const f=workspaceFixture('match'),click=(id,label)=>{const b=f.get(id).querySelectorAll('button').find(b=>b.textContent===label);assert.ok(b,label);b.click();};
 click('matchflow','Configure staff and inducements — '+f.run('teams[0].name'));click('choices','Star players');click('choices','Hire Griff Oberwald — 300,000 gp');assert.ok(f.run('game.pending.kind.includes("Consummate Professional")'));const confirm=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm hire');confirm.click();confirm.click();assert.equal(f.run('game.players.filter(p=>p.star).length'),1);click('choices','Back');click('choices','Done');
 f.run('game.phase="kickChoice";game.chooseKicking(0);globalThis.a=game.players[0];globalThis.pos={x:a.x,y:a.y};game.benchSetup(a.id);render()');const card=f.get('dugout').querySelectorAll('button').find(b=>b.dataset.playerId===f.run('game.players.find(p=>p.star).id'));assert.match(card['aria-label'],/Griff Oberwald/);card.click();f.action('Select for setup').click();f.cell(f.run('pos.x'),f.run('pos.y')).click();assert.equal(f.run('game.players.find(p=>p.star).status'),'standing');assert.ok(f.get('profile').innerHTML.includes('Consummate Professional'));assert.ok(f.get('profile').innerHTML.includes('Limit: 0–1'));
});
test('Griff modifier appears in actual choice controls and stale callbacks cannot spend it twice',()=>{
 const f=workspaceFixture('match');f.run('globalThis.p=game.hireStar(0,"griff-oberwald");game.phase="play";game.active=0;Object.assign(p,{x:5,y:7,status:"standing"});game.dice=()=>2;globalThis.passed=false;game.test(p,"Pick up",3,()=>passed=true,()=>{});render()');const use=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Consummate Professional');assert.ok(use);use.click();use.click();assert.equal(f.run('passed'),true);assert.equal(f.run('p.consummateUsed'),true);assert.equal(f.run('game.pending'),null);
});
test('Lord of Chaos has explicit single-die buttons in the bundled Block controls',()=>{
 const f=workspaceFixture('match');f.run('game.teams[0].league="Chaos Clash";globalThis.p=game.hireStar(0,"lord-borak");game.phase="play";game.active=0;game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"standing",profileOverride:{...game.profile(d),st:3}});globalThis.rolls=[1,2,6];game.dice=()=>rolls.shift();game.rollBlock(p,d);render()');const use=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Lord of Chaos re-roll die 2');assert.ok(use);use.click();use.click();assert.equal(f.run('game.blockAction.dice.join(",")'),'1,6');assert.equal(f.run('p.lordOfChaosUsed'),true);assert.equal(f.run('rolls.length'),0);
});

test('Savage Blow actual controls select a subset of the Block pool and guard replay',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Lustrian Superleague";globalThis.p=game.hireStar(0,"anqi-panqi");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"standing",profileOverride:{...game.profile(d),st:1}});game.phase="play";game.active=0;globalThis.rolls=[1,2,3,5,6];game.dice=()=>rolls.shift();game.rollBlock(p,d);render()');const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Savage Blow re-roll dice 1, 3');assert.ok(b);b.click();b.click();assert.equal(f.run('game.blockAction.dice.join(",")'),'5,2,6');assert.equal(f.run('rolls.length'),0);assert.ok(!f.get('choices').querySelectorAll('button').some(b=>b.textContent.startsWith('Savage Blow')));});
test('Indomitable actual controls suspend a Dauntless block before its dice and resume once',()=>{const f=workspaceFixture('match');f.run('globalThis.p=game.hireStar(0,"karla-von-kill");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"standing",profileOverride:{...game.profile(d),st:5}});game.phase="play";game.active=0;globalThis.rolls=[2,3,4];game.dice=()=>rolls.shift();game.rollBlock(p,d);render()');assert.equal(f.run('rolls.length'),2);const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Indomitable');assert.ok(b);b.click();b.click();assert.equal(f.run('game.blockAction.aStrength'),10);assert.equal(f.run('rolls.length'),0);});
test('Mesmerising Dance actual controls reroll a failed gaze and retire the activation',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Elven Kingdoms League";globalThis.p=game.hireStar(0,"eldril-sidewinder");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"standing"});game.phase="play";game.active=0;globalThis.rolls=[1,6];game.dice=()=>rolls.shift();game.start(p.id,"special:Hypnotic Gaze");game.performSpecial(d.id);render()');const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Mesmerising Dance');assert.ok(b);b.click();b.click();assert.equal(f.run('d.distracted'),true);assert.equal(f.run('game.mover'),null);assert.equal(f.run('rolls.length'),0);});

test('Black Ink start decision appears in the full bundle and can be retained for later in the activation',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Elven Kingdoms League";globalThis.p=game.hireStar(0,"kiroth-krakeneye");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"prone"});game.phase="play";game.active=0;game.dice=()=>{throw Error("Unexpected die")};game.start(p.id);render()');const keep=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Keep Black Ink');assert.ok(keep);keep.click();const use=f.get('matchflow').querySelectorAll('button').find(b=>b.textContent==='Use Black Ink');assert.ok(use);use.click();const target=f.get('choices').querySelectorAll('button').find(b=>b.textContent.startsWith('Distract '));target.click();target.click();assert.equal(f.run('d.distracted'),true);assert.equal(f.run('game.mover'),f.run('p.id'));assert.equal(f.run('p.starDistractionUsed'),true);});
test('Zoat distraction remains available in Charge controls after declining the initial window',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Elven Kingdoms League";globalThis.p=game.hireStar(0,"zolcath");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});Object.assign(game.players.find(p=>p.team===1),{x:8,y:7,status:"standing"});game.phase="charge";game.active=0;game.eventState={kind:"charge",team:0,limit:1,eligible:[p.id],used:[]};game.start(p.id);game.decide(\'Keep "Excuse Me, Are You a Zoat?"\');render()');const use=f.get('matchflow').querySelectorAll('button').find(b=>b.textContent==='Use "Excuse Me, Are You a Zoat?"');assert.ok(use);use.click();f.get('choices').querySelectorAll('button').find(b=>b.textContent.startsWith('Distract ')).click();assert.equal(f.run('p.starDistractionUsed'),true);});

test('Fungus UI shows the proposed direction destination and permits a guarded Whirling Dervish choice',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Underworld Challenge";globalThis.p=game.hireStar(0,"fungus-the-loon");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;globalThis.rolls=[1,6];game.dice=()=>rolls.shift();game.start(p.id);game.decide("Aim East");render()');assert.ok(f.run('game.pending.kind.includes("→ 7, 7")'));const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Whirling Dervish');assert.ok(b);b.click();b.click();assert.equal(f.run('p.x'),6);assert.equal(f.run('p.y'),8);assert.equal(f.run('rolls.length'),0);});
test('Morg UI uses The Ballista on Throw Team-mate before showing Bullseye',()=>{const f=workspaceFixture('match');f.run('globalThis.p=game.hireStar(0,"morg-n-thorg");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});globalThis.mate=game.players[0];mate.extraSkills=["Right Stuff"];Object.assign(mate,{x:6,y:7,status:"standing"});game.phase="play";game.active=0;globalThis.rolls=[1,6];game.dice=()=>rolls.shift();game.start(p.id,"throw-team-mate");game.selectThrowMate(mate.id);game.throwTeamMate(7,7);render()');const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use The Ballista');assert.ok(b);b.click();b.click();assert.equal(f.run('game.pending.kind'),'Bullseye');assert.equal(f.run('p.ballistaUsed'),true);assert.equal(f.run('rolls.length'),0);});
test('Glart UI offers Frenzied Rush for a Blitz and displays temporary profile skills',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Underworld Challenge";globalThis.p=game.hireStar(0,"glart-smashrip");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});game.phase="play";game.active=0;game.start(p.id,"blitz");render()');const b=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Frenzied Rush');assert.ok(b);b.click();b.click();assert.equal(f.run('game.has(p,"Frenzy")'),true);assert.equal(f.run('game.has(p,"Grab")'),false);f.run('showProfile(p.team,p.role,p.number)');assert.ok(f.get('profile').innerHTML.includes('Frenzy'));f.run('game.finish()');assert.equal(f.run('game.has(p,"Frenzy")'),false);});

test('Swift Twins actual purchase preview includes both profiles and creates/removes the pair atomically',()=>{const f=workspaceFixture('match'),click=(id,label)=>{const b=f.get(id).querySelectorAll('button').find(b=>b.textContent===label);assert.ok(b,label);b.click();};f.run('game.teams[0].league="Elven Kingdoms League";render()');click('matchflow','Configure staff and inducements — '+f.run('teams[0].name'));click('choices','Star players');click('choices','Hire The Swift Twins — 300,000 gp');assert.ok(f.run('game.pending.kind.includes("Lucien Swift")&&game.pending.kind.includes("Valen Swift")'));const confirm=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm hire');confirm.click();confirm.click();assert.equal(f.run('game.players.filter(p=>p.star==="swift-twins").length'),2);assert.equal(f.run('game.resourceCosts(0).inducements'),300000);click('choices','Remove The Swift Twins — 300,000 gp');assert.equal(f.run('game.players.filter(p=>p.star==="swift-twins").length'),0);assert.equal(f.run('game.resourceCosts(0).inducements'),0);});
test('Swift Twins dugout cards show separate names and a shared pair fee, while the Block UI offers Tandem',()=>{const f=workspaceFixture('match');f.run('game.teams[0].league="Elven Kingdoms League";game.hireStar(0,"swift-twins");globalThis.l=game.players.find(p=>p.starRole==="lucien-swift");globalThis.v=game.players.find(p=>p.starRole==="valen-swift");game.phase="setup";game.setupTeam=0;render()');const cards=f.get('dugout').querySelectorAll('button');assert.ok(cards.some(b=>b['aria-label'].includes('Lucien Swift')));assert.ok(cards.some(b=>b['aria-label'].includes('Valen Swift')));f.run('showProfile(l.team,l.role,l.number)');assert.ok(f.get('profile').innerHTML.includes('Pair fee: 300,000 gp'));f.run('game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(l,{x:5,y:7,status:"standing"});Object.assign(v,{x:6,y:8,status:"standing"});globalThis.d=game.players.find(p=>p.team===1);Object.assign(d,{x:6,y:7,status:"standing",profileOverride:{...game.profile(d),st:3}});game.phase="play";game.active=0;globalThis.rolls=[1,2,6];game.dice=()=>rolls.shift();game.rollBlock(l,d);render()');const use=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Working in Tandem re-roll die 1');assert.ok(use);use.click();use.click();assert.equal(f.run('game.blockAction.dice.join(",")'),'6,2');assert.equal(f.run('rolls.length'),0);});

test('Maximum Carnage and Kaboom choices are wired in the actual bundled UI',()=>{const f=workspaceFixture('match');f.run('game.teams[0].special.push("Favoured of Khorne");globalThis.p=game.hireStar(0,"max-spleenripper");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:5,y:7,status:"standing"});game.players.filter(p=>p.team===1).slice(0,2).forEach((p,i)=>Object.assign(p,{x:6,y:7+i,status:"standing"}));game.phase="play";game.active=0;globalThis.rolls=[2,1,1,2,1,1];game.dice=()=>rolls.shift();game.start(p.id,"special:Chainsaw");game.performSpecial(game.players.find(p=>p.team===1).id);render()');const hit=f.get('choices').querySelectorAll('button').find(b=>b.textContent.startsWith('Chainsaw '));assert.ok(hit);hit.click();hit.click();assert.equal(f.run('p.maximumCarnageUsed'),true);assert.equal(f.run('rolls.length'),0);
 const b=workspaceFixture('match');b.run('globalThis.p=game.hireStar(1,"bomber-dribblesnot");game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:"reserve"}));Object.assign(p,{x:15,y:7,status:"standing"});globalThis.d=game.players[0];Object.assign(d,{x:12,y:7,status:"standing"});game.phase="play";game.active=1;game.rerolls=[0,0];globalThis.rolls=[6,1,1];game.dice=()=>rolls.shift();game.start(p.id,"bomb");game.throwBomb(d.x,d.y);render()');const use=b.get('choices').querySelectorAll('button').find(b=>b.textContent==='Use Kaboom!');assert.ok(use);use.click();use.click();assert.equal(b.run('p.kaboomUsed'),true);assert.equal(b.run('d.status'),'prone');assert.equal(b.run('rolls.length'),0);
});

test('pitch actions are a coach-panel region with collapsed information and no floating coordinates',()=>{
 const f=workspaceFixture(),p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();const panel=f.get('pitch-popup'),details=panel.children.find(e=>e.tagName==='DETAILS');assert.equal(panel.parentElement,f.get('coach-panel'));assert.equal(panel.style.left,undefined);assert.equal(panel.style.top,undefined);assert.ok(details);assert.ok(!details.open);assert.ok(dugoutNodes(details).some(e=>/MA \d/.test(e.textContent)));assert.ok(!f.popup().some(b=>b.textContent==='Declare Move'));assert.match(dugoutNodes(panel).map(e=>e.textContent).join(' '),/To move: choose/);const html=fs.readFileSync(projectPath('index.html'),'utf8');assert.match(html,/<aside id="coach-panel"[\s\S]*?<section id="pitch-popup" role="region"[^>]*hidden/);assert.doesNotMatch(html,/<[^>]*id="pitch-popup"[^>]*popover=/);
});

test('positional markers use roster keywords consistently, including hybrid roles and unknown specials',()=>{
 const f=workspaceFixture();for(const [traits,shape] of [['Lineman, Human','circle'],['Goblin, Lineman','circle'],['Blitzer, Elf, Runner','triangle'],['Blocker, Undead, Wraith','square'],['Special, Dwarf','star'],['Thrower, Skaven','diamond'],['Catcher, Human, Thrower','hexagon'],['Runner, Snakeman','pentagon'],['Big Guy, Ogre, Thrower','octagon'],['Big Guy, Snotling, Special','octagon'],['Squirrel','star']])assert.equal(f.run('positionMarker({traits:'+JSON.stringify(traits)+'}).shape'),shape,traits);
 assert.equal(f.run('new Set(rosterCatalog.flatMap(t=>t.positions.map(p=>positionMarker(p).shape))).size'),8);
 assert.equal(f.get('position-key-items').children.length,8);
});

test('both teams keep role shapes, shirt numbers, status classes, ball and selected square indicators',()=>{
 const f=workspaceFixture();f.run('globalThis.a=game.players[0];globalThis.b=game.players.find(p=>p.team!==a.team);for(const p of [a,b])p.profileOverride={...game.profile(p),traits:"Blitzer, Human"};Object.assign(a,{x:5,y:7,status:"prone",distracted:true,used:true});Object.assign(b,{x:7,y:7,status:"standing"});selected=a.id;game.ball={x:5,y:7,carrier:a.id};render()');const home=f.cell(5,7),away=f.cell(7,7),a=home.children.find(e=>e.className.includes('token role-')),b=away.children.find(e=>e.className.includes('token role-'));assert.ok(a.className.includes('role-triangle'));assert.ok(b.className.includes('role-triangle'));assert.ok(a.className.includes('prone'));assert.ok(a.className.includes('distracted'));assert.ok(a.className.includes('used'));assert.ok(b.className.includes('blue'));assert.ok(home.className.includes('selected'));assert.ok(home.children.some(e=>e.className==='ball'));assert.equal(String(a.children.find(e=>e.className==='token-number').textContent),String(f.run('a.number')));assert.match(a.children.find(e=>e.className==='token-shape').innerHTML,/<svg.*polygon/);assert.match(home['aria-label'],/Blitzer marker \(triangle\)/);
});

test('repeating an unactivated destination confirms one Move without a separate declaration',()=>{const f=workspaceFixture('dodge');f.run('selected=game.players[0].id;game.dice=()=>6;render();choose(9,6)');assert.equal(f.run('game.mover'),null);assert.equal(f.run('game.players[0].used'),false);assert.ok(f.get('pitch-popup').hidden);f.run('choose(9,6)');assert.equal(f.run('game.players[0].x'),9);assert.equal(f.run('game.players[0].y'),6);assert.equal(f.run('game.players[0].spent'),1);assert.equal(f.run('destination'),null);});
test('route confirmation honours activation-roll interruptions without moving or repeating dice',()=>{const f=workspaceFixture('dodge');f.run('selected=game.players[0].id;game.players[0].extraSkills=["Bone Head"];globalThis.rolls=0;game.dice=()=>{rolls++;return 1};render();choose(9,6)');const commit=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm Move');commit.click();assert.equal(f.run('game.pending.kind'),'Bone Head');assert.equal(f.run('game.players[0].x'),10);assert.equal(f.run('game.players[0].spent'),0);assert.equal(f.run('destination'),null);commit.click();assert.equal(f.run('rolls'),1);});
test('a commit button from an older preview cannot commit or erase its replacement route',()=>{const f=workspaceFixture('dodge');f.run('selected=game.players[0].id;render();choose(9,6)');const commit=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Confirm Move'),cancel=f.get('choices').querySelectorAll('button').find(b=>b.textContent==='Cancel movement preview');f.run('choose(8,6)');const before=f.run('JSON.stringify(destination)');commit.click();cancel.click();assert.equal(f.run('JSON.stringify(destination)'),before);assert.equal(f.run('game.mover'),null);});

test('saved exhibition teams use developed profiles, ordered CTV budgets and isolated snapshots',()=>{
 const f=workspaceFixture('match');
 f.run(`for(let i=0;i<2;i++){const t=leagueStore.create(demoLeagueTeams[0].id,'Custom '+i);for(let n=0;n<11;n++)leagueStore.hire(t.id,0,'Player '+n);leagueStore.submit(t.id);}leagueStore.setStaff(leagueStore.data.teams[0].id,'assistants',1);leagueSave();renderLeague();globalThis.beforeExhibition=JSON.stringify(leagueStore.data);`);
 assert.ok(f.get('exhibition-home-custom').children.some(o=>o.textContent==='Custom 0'));
 f.run(`document.getElementById('exhibition-home-custom').value='saved:'+leagueStore.data.teams[0].id;document.getElementById('exhibition-away-custom').value='saved:'+leagueStore.data.teams[1].id;reset();`);
 assert.equal(f.run('game.exhibition&&game.league'),true);
 assert.equal(f.run('game.teams[0].name'),'Custom 0');
 assert.equal(f.get('exhibition-rosters').hidden,false);
 assert.equal(f.run('game.players[0].profileOverride.ma===leagueStore.data.teams[0].players[0].profile.ma'),true);
 f.run(`game.phase='leagueSteps'`);
 assert.equal(f.run('game.setResource(1,"bribes",1)'),false);
 assert.equal(f.run('game.lockLeagueInducements(0)'),true);
 assert.equal(f.run('game.leagueBudget(1)'),60000);
 assert.equal(f.run('game.setResource(1,"kegs",1)'),true);
 assert.equal(f.run('game.setResource(1,"kegs",2)'),false);
 assert.equal(f.run('JSON.stringify(leagueStore.data)===beforeExhibition'),true);
 f.run(`document.getElementById('exhibition-away-custom').value='';document.getElementById('exhibition-away').value=demoLeagueTeams[1].id;reset();`);
 assert.equal(f.run('game.league'),false);
 assert.equal(f.run('!!game.players[0].profileOverride'),true);
});

test('pitch marks sweet spots and closed or active trapdoors',()=>{
 const f=workspaceFixture('match');
 for(const x of [6,19])assert.ok(f.cell(x,7).children.some(e=>e.className==='sweet-spot'));
 assert.match(f.cell(6,1).className,/trapdoor/);assert.doesNotMatch(f.cell(6,1).className,/trapdoor-active/);
 f.run(`game.prayers[0].push('Treacherous Trapdoor');render();`);
 assert.match(f.cell(6,1).className,/trapdoor-active/);assert.match(f.cell(19,13).className,/trapdoor-active/);
});

test('movement risk colors follow the hardest check on each tile',()=>{
 const f=workspaceFixture('match');
 for(const target of [2,3,4,5,6]){f.run(`game.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));Object.assign(game.players[0],{x:10,y:7,status:'standing'});selected=game.players[0].id;game.phase='play';game.active=0;game.planFrom=()=>({x:11,y:7,cost:1,rushes:0,dodge:true,target:${target}});remainingRange=()=>new Map([['11,7',{spent:1,path:[{x:11,y:7,plan:{x:11,y:7,cost:1,rushes:0,dodge:true,target:${target}}}]}]]);render();`);assert.match(f.cell(11,7).className,new RegExp('risk-'+target));}
});


test('Testing owns drills and learning matches while Play owns full games without resetting on tab changes',()=>{
 const f=workspaceFixture('match');f.run('globalThis.originalGame=game');
 f.get('tab-testing').click();assert.equal(f.run('game===originalGame'),true);assert.equal(f.get('game-session').parentElement,f.get('play-view'));
 f.get('testing-scenario').value='dodge';f.get('start-testing').click();assert.equal(f.run('game.match'),undefined);assert.equal(f.get('game-session').parentElement,f.get('testing-view'));
 f.run('globalThis.practice=game');f.get('tab-play').click();f.get('tab-testing').click();assert.equal(f.run('game===practice'),true);
 f.get('testing-scenario').value='match-learning';f.get('start-testing').click();assert.equal(f.run('game.learning'),true);assert.equal(f.get('game-session').parentElement,f.get('testing-view'));
 f.get('start-exhibition').click();assert.equal(f.run('game.learning'),false);assert.equal(f.run('workspaceView'),'play');assert.equal(f.get('game-session').parentElement,f.get('play-view'));
 f.get('open-leagues').click();assert.equal(f.run('workspaceView'),'teams');
 f.get('tab-rosters').emit('keydown',{key:'ArrowRight'});assert.equal(f.run('workspaceView'),'testing');f.get('tab-testing').emit('keydown',{key:'End'});assert.equal(f.run('workspaceView'),'reference');f.get('tab-reference').emit('keydown',{key:'ArrowRight'});assert.equal(f.run('workspaceView'),'play');
 const html=fs.readFileSync(projectPath('index.html'),'utf8'),testing=html.match(/<select id="testing-scenario">([\s\S]*?)<\/select>/)[1];assert.ok(!testing.includes('value="match"'));assert.ok(testing.includes('value="skills"'));
});

test('preset and custom selectors stay separate and selecting a preset clears the custom override',()=>{
 const f=workspaceFixture('match');assert.equal(f.get('exhibition-home-custom').disabled,true);
 f.run(`const club=leagueStore.create(demoLeagueTeams[0].id,'My custom team');for(let i=0;i<11;i++)leagueStore.hire(club.id,0,'Player '+i);leagueStore.submit(club.id);refreshExhibitionRosters();`);
 assert.equal(f.get('exhibition-home-custom').disabled,false);assert.ok(!f.get('exhibition-home').children.some(o=>o.value.startsWith('saved:')));
 f.get('exhibition-home-custom').value=f.run("'saved:'+leagueStore.data.teams[0].id");f.get('exhibition-home-custom').emit('change');assert.equal(f.run('teams[0].name'),'My custom team');assert.equal(f.get('exhibition-home-league').hidden,true);
 f.run('refreshExhibitionRosters()');assert.ok(f.get('exhibition-home-custom').value.startsWith('saved:'));
 f.get('exhibition-home').value=f.run('demoLeagueTeams[1].id');f.get('exhibition-home').emit('change');assert.equal(f.get('exhibition-home-custom').value,'');assert.equal(f.run('teams[0].id'),f.run('demoLeagueTeams[1].id'));
});


test('Reference explains every catalogue ability and searches names, categories and effects without coverage metadata',()=>{
 const f=workspaceFixture('match'),panel=f.get('skillcoverage'),rows=panel.querySelectorAll('tr');
 assert.equal(rows.length,109);assert.deepEqual(rows[0].children.map(c=>c.textContent),['Skill / Trait','Category','What it does']);
 const names=rows.slice(1).map(row=>row.children[0].textContent);assert.equal(new Set(names).size,108);assert.equal(f.run('SKILL_CATALOG.every(s=>typeof SKILL_DESCRIPTIONS[s.name]==="string"&&SKILL_DESCRIPTIONS[s.name].length>15)'),true);
 for(const row of rows.slice(1)){assert.equal(row.children.length,3);assert.ok(row.children[2].textContent.length>15);assert.doesNotMatch(row.children.map(c=>c.textContent).join(' '),/Implemented|Deferred|Supported in the available actions|Coverage \/ next dependency/);row.textContent=row.children.map(c=>c.textContent).join(' ');}
 const input=panel.children.find(c=>c.className==='skill-search').children[0];input.value='casualty';input.emit('input');assert.ok(rows.slice(1).some(r=>!r.hidden&&r.children[0].textContent==='Violent Innovator'));assert.ok(rows.slice(1).some(r=>r.hidden));input.value='a word with no skill match';input.emit('input');assert.ok(rows.slice(1).every(r=>r.hidden));input.value='';input.emit('input');assert.ok(rows.slice(1).every(r=>!r.hidden));
 assert.equal(f.run('game.match'),true);assert.equal(f.run('game.phase'),'fans');
});

test('Reference includes updated controls and complete quick-reference rule groups in the standalone bundle',()=>{
 const f=workspaceFixture('match'),html=fs.readFileSync(projectPath('index.html'),'utf8');
 const guide=dugoutNodes(f.get('playing-guide')).map(e=>e.textContent).join(' '),sheet=dugoutNodes(f.get('rules-cheat-sheet')).map(e=>e.textContent).join(' ');
 for(const text of ['Confirm Move','Testing','2+ through 6+','six eligible MVP','cannot currently be saved','snapshots'])assert.ok(guide.includes(text),text);
 for(const text of ['Match sequence','Common actions','Strength and dice','Block faces','Weather','Kick-off','Casualty','Lasting injury','turns 7–8','SPP','Crowds skip armour'])assert.ok(sheet.includes(text),text);
 assert.ok(html.includes(fs.readFileSync(projectPath('src/ui/reference.cjs'),'utf8').trimEnd()));
 assert.equal(f.get('rules-cheat-sheet').querySelectorAll('table').length,12);
 const glossary=f.get('skillcoverage').querySelectorAll('tr').slice(1),find=name=>glossary.find(r=>r.children[0].textContent===name).children[2].textContent;
 assert.doesNotMatch(find('Catch'),/intercept/i);assert.match(find('Hypnotic Gaze'),/3\+/);assert.match(find('Decay'),/Casualty/);
});
