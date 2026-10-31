const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// A DOM event harness executes the complete bundled application, including the
// workspace layer. Visual/browser verification remains a separate requirement.
function workspaceFixture(scenario='block'){
 const html=fs.readFileSync('index.html','utf8'),elements=new Map();let context;
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
 const get=id=>{if(!elements.has(id)){const e=new Element(id.startsWith('tab-')?'button':'div');e.id=id;elements.set(id,e);}return elements.get(id);};
 const document={getElementById:get,createElement:tag=>new Element(tag),querySelectorAll:()=>[],listeners:{},addEventListener(k,f){(this.listeners[k]??=[]).push(f);},activeElement:null};
 get('team-data').textContent=html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1];get('scenario').value=scenario;get('player-details').append(get('profile'));
 const storage=new Map();context=vm.createContext({document,console,innerWidth:1200,innerHeight:800,addEventListener(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 const scripts=[...html.matchAll(/<script(?: id="(?:(?:movement|skills|match|league)-engine|league-ui|workspace-ui)")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInContext(scripts,context);
 const run=code=>vm.runInContext(code,context),popup=()=>get('pitch-popup').querySelectorAll('button'),action=label=>{const b=popup().find(b=>b.textContent===label);assert.ok(b,'Popup action '+label);return b;};
 return {get,run,document,popup,action,key:key=>document.listeners.keydown.forEach(fn=>fn({key})),cell:(x,y)=>get('pitch').children[y*26+x]};
}
test('workspace tabs preserve the exact game and support arrow-key selection',()=>{
 const f=workspaceFixture();f.run('globalThis.before=game');f.get('tab-teams').click();assert.equal(f.run('workspaceView'),'teams');assert.equal(f.get('play-view').hidden,true);assert.equal(f.get('teams-view').hidden,false);f.get('tab-teams').emit('keydown',{key:'ArrowRight'});assert.equal(f.run('workspaceView'),'rosters');assert.equal(f.get('tab-rosters').tabIndex,0);assert.equal(f.get('tab-play').tabIndex,-1);f.get('tab-play').click();assert.equal(f.run('game===before'),true);
});
test('clicking a player opens legal actions and a menu click declares only once',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();assert.equal(f.get('pitch-popup').popoverOpen,true);assert.match(f.get('pitch-popup').children[2].textContent,/Black Orcs/);assert.ok(!f.popup().some(b=>b.textContent==='Declare Pass'));const move=f.action('Declare Move');move.click();const mover=f.run('game.mover');assert.ok(mover);move.click();assert.equal(f.run('game.mover'),mover);assert.equal(f.get('pitch-popup').popoverOpen,false);
});
test('an opponent tile offers Block and Blitz without changing the acting player',()=>{
 const f=workspaceFixture(),selected=f.run('selected');f.run('globalThis.target=game.players.find(p=>p.team!==game.active&&game.canBlock(game.players.find(p=>p.id===selected),p));game.dice=()=>3');const target=JSON.parse(f.run('JSON.stringify(target)'));f.cell(target.x,target.y).click();assert.equal(f.run('selected'),selected);const block=f.action('Block #'+target.number);assert.ok(f.popup().some(b=>b.textContent.startsWith('Declare Blitz')));block.click();assert.equal(f.run('game.pending.type'),'blockSelect');const old=f.run('game.pending');block.click();assert.equal(f.run('game.pending'),old);
});
test('Escape closes a menu, returns focus and cancels previews without moving',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();f.key('Escape');assert.equal(f.get('pitch-popup').popoverOpen,false);assert.equal(f.document.activeElement,f.cell(p.x,p.y));f.run('choose(9,8)');assert.ok(f.run('destination'));f.key('Escape');assert.equal(f.run('destination'),null);assert.equal(f.run('game.mover'),null);
});
test('roving pitch navigation has one Tab stop and stays inside pitch boundaries',()=>{
 const f=workspaceFixture();assert.equal(f.get('pitch').children.filter(e=>e.tabIndex===0).length,1);f.get('pitch').emit('keydown',{target:f.cell(0,0),key:'ArrowLeft'});assert.equal(f.document.activeElement,f.cell(0,0));f.get('pitch').emit('keydown',{target:f.cell(0,0),key:'ArrowDown'});assert.equal(f.document.activeElement,f.cell(0,1));assert.equal(f.get('pitch').children.filter(e=>e.tabIndex===0).length,1);f.cell(0,1).focus();f.run('render()');assert.equal(f.document.activeElement,f.cell(0,1));
});
test('hover and focus information include skills, characteristics and ball state',()=>{
 const f=workspaceFixture('pass');const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.get('pitch').emit('focusin',{target:f.cell(p.x,p.y)});assert.match(f.get('pitch-tooltip').textContent,/MA 6|MA 7/);assert.match(f.get('pitch-tooltip').textContent,/ball carrier/);assert.match(f.get('pitch-tooltip').textContent,/Pass/);assert.equal(f.cell(p.x,p.y)['aria-describedby'],'pitch-tooltip');f.get('pitch').emit('focusout');assert.equal(f.get('pitch-tooltip').popoverOpen,false);
});
test('pending coach decisions cannot be bypassed by player menus or selection',()=>{
 const f=workspaceFixture();f.run('game.pending={type:"custom",kind:"Test choice",options:["Continue"],resolve:()=>{game.pending=null;}};render()');const selected=f.run('selected');f.run('choose(11,7)');assert.equal(f.run('selected'),selected);assert.equal(f.get('pitch-popup').popoverOpen,false);assert.equal(f.get('action-disclosure').hidden,true);assert.match(f.get('pitch-hint').textContent,/Decision required/);
});
test('pregame optional staff is collapsed, primary progression remains visible',()=>{
 const f=workspaceFixture('match'),flow=f.get('matchflow');assert.ok(flow.children.some(e=>e.textContent==='Determine fans'));const staff=flow.children.find(e=>e.tagName==='DETAILS');assert.ok(staff);assert.ok(!staff.open);assert.ok(staff.children.some(e=>e.textContent.startsWith('Configure staff')));assert.ok(!f.get('match-scoreboard').children.find(e=>e.className==='match-meta').textContent.includes('Bribes 0 / 0'));
});
test('active movement preview offers commit, with repeated clicks guarded',()=>{
 const f=workspaceFixture('pickup');f.run('selected=game.players[0].id;game.start(selected);render();choose(10,8)');assert.ok(f.run('destination'));const commit=f.action('Commit planned route');commit.click();assert.equal(f.run('destination'),null);const before=f.run('JSON.stringify(game.players)');commit.click();assert.equal(f.run('JSON.stringify(game.players)'),before);
});
test('light-dismissed popup callbacks cannot execute and switching tabs clears overlays',()=>{
 const f=workspaceFixture();const p=JSON.parse(f.run('JSON.stringify(game.players.find(p=>p.id===selected))'));f.cell(p.x,p.y).click();const move=f.action('Declare Move');f.get('pitch-popup').hidePopover();move.click();assert.equal(f.run('game.mover'),null);f.cell(p.x,p.y).click();f.get('tab-teams').click();assert.equal(f.get('pitch-popup').popoverOpen,false);
});
test('new presentation assets are embedded exactly in the standalone page',()=>{
 const html=fs.readFileSync('index.html','utf8');for(const [tag,id,file] of [['script','workspace-ui','workspace-ui.cjs'],['style','workspace-style','workspace.css']])assert.equal(html.match(new RegExp('<'+tag+' id="'+id+'">\\n([\\s\\S]*?)\\n</'+tag+'>'))[1],fs.readFileSync(file,'utf8').trimEnd());assert.ok(html.includes('counts={Implemented:0,Partial:0,Deferred:0}'));
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
