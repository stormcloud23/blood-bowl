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
