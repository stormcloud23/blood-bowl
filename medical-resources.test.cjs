const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('./match.cjs');
const rosters=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
function fixture(rolls=[],resource={mortuaryAssistants:1},rules=['Masters of Undeath']){const teams=structuredClone(rosters);teams[1].special.push(...rules);const queue=[...rolls],g=new MatchGame(teams,{resources:[{},resource],dice:s=>{assert.ok(queue.length,'Unexpected D'+s);const n=queue.shift();assert.ok(n>=1&&n<=s);return n;}});g.phase='play';g.rerolls=[0,0];g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));const a=g.players[0],d=g.players[11],e=g.players[12];for(const [i,p] of [a,d,e].entries())Object.assign(p,{status:'standing',x:10+i,y:7,profileOverride:{...g.profile(p),skills:[],traits:'Lineman'}});return {g,a,d,e,queue};}
function choose(g,label){assert.ok(g.pending?.options.includes(label),g.pending?.kind+': '+g.pending?.options.join(' / '));g.decide(label);}

test('regeneration aids cost 100k, require their team rules and cap at one',()=>{
 const g=new MatchGame(structuredClone(rosters));for(const key of ['mortuaryAssistants','plagueDoctors']){assert.equal(g.resourceSpec(0,key).cost,100000);assert.equal(g.setResource(0,key,1),false);assert.throws(()=>new MatchGame(structuredClone(rosters),{resources:[{[key]:1},{}]}));}
 const {g:eligible}=fixture([],{mortuaryAssistants:1,plagueDoctors:1},['Masters of Undeath','Favoured of Nurgle']);assert.equal(eligible.mortuaryAssistants[1],1);assert.equal(eligible.plagueDoctors[1],1);assert.equal(eligible.validResource(1,'plagueDoctors',2),false);
});

test('Mortuary Assistant rerolls defending-team Regeneration without Loner or a team re-roll',()=>{
 const {g,d,queue}=fixture([16,1,1,6]);d.extraSkills=['Regeneration','Loner (4+)'];let done=0;g.resolveInjury(d,12,()=>done++);choose(g,'Mortuary Assistant re-roll Regeneration');assert.equal(d.status,'reserve');assert.equal(g.mortuaryAssistants[1],0);assert.equal(g.injuryRecords[0].treatment,'Regeneration');assert.equal(done,1);assert.equal(queue.length,0);
});

test('available regeneration inducement takes precedence over team re-roll choices',()=>{
 const {g,d,queue}=fixture([16,1,1]);d.extraSkills=['Regeneration'];g.active=1;g.rerolls[1]=2;g.resolveInjury(d,12);assert.deepEqual(g.pending.options,['Mortuary Assistant re-roll Regeneration','Accept Regeneration failure']);choose(g,'Accept Regeneration failure');assert.equal(d.status,'casualty');assert.equal(g.rerolls[1],2);assert.equal(g.mortuaryAssistants[1],1);assert.equal(queue.length,0);
});

test('grouped failed Regeneration rolls let the coach protect the fatal wound first',()=>{
 const {g,a,d,e,queue}=fixture([16,1,1,1,1,1,6]);d.extraSkills=e.extraSkills=['Regeneration'];const c=g.multipleContext={stage:'effects',attacker:a,injuries:[]};
 g.resolveInjury(d,12,()=>{},{source:{playerId:a.id,cause:'Block'}});g.resolveInjury(e,12,()=>{},{source:{playerId:a.id,cause:'Block'}});c.stage='medical';let done=0;g.resolveMedicalGroups(c,()=>done++);
 assert.equal(queue.length,1);assert.match(g.pending.kind,/choose injury to retry/);choose(g,g.pending.options.find(o=>o.endsWith(': Dead')));choose(g,'Mortuary Assistant re-roll Regeneration');assert.equal(d.status,'reserve');assert.equal(e.status,'casualty');assert.equal(g.mortuaryAssistants[1],0);assert.equal(g.playerStats[a.id].casualty,2);assert.equal(done,1);assert.equal(queue.length,0);
});

test('Plague Doctor shares its use between Regeneration and ordinary casualty treatment',()=>{
 const {g,d,e,queue}=fixture([16,1,1,6,1,1],{plagueDoctors:1},['Favoured of Nurgle']);d.extraSkills=['Regeneration'];g.resolveInjury(d,12);choose(g,'Plague Doctor re-roll Regeneration');assert.equal(g.plagueDoctors[1],0);g.resolveInjury(e,12);assert.equal(e.status,'casualty');assert.equal(g.pending,null);assert.equal(queue.length,0);
});

test('Plague Doctor can treat a non-Regeneration player using pinned ApothecaryMechanic eligibility',()=>{
 const {g,d,queue}=fixture([16,1,1,1],{plagueDoctors:1},['Favoured of Nurgle']);g.resolveInjury(d,12);choose(g,'Use Plague Doctor');assert.equal(d.status,'reserve');assert.equal(g.plagueDoctors[1],0);assert.equal(g.injuryRecords[0].treatment,'Plague Doctor');assert.equal(queue.length,0);
});

test('Plague Doctor can treat KO and retains the normal on-pitch stunned result',()=>{
 const {g,d}=fixture([],{plagueDoctors:1},['Favoured of Nurgle']);g.resolveInjury(d,8);choose(g,'Use Plague Doctor');assert.equal(d.status,'stunned');assert.equal(d.x,11);assert.equal(g.plagueDoctors[1],0);
});

test('failed regeneration aid cannot be followed by another aid or a team re-roll',()=>{
 const {g,d,queue}=fixture([16,1,1,1],{mortuaryAssistants:1,plagueDoctors:1},['Masters of Undeath','Favoured of Nurgle']);d.extraSkills=['Regeneration'];g.active=1;g.rerolls[1]=2;g.resolveInjury(d,12);choose(g,'Mortuary Assistant re-roll Regeneration');assert.ok(g.pending.options.includes('Use Plague Doctor'));assert.ok(!g.pending.options.some(o=>o.includes('re-roll')));choose(g,'Decline treatment');assert.equal(g.plagueDoctors[1],1);assert.equal(g.rerolls[1],2);assert.equal(d.status,'casualty');assert.equal(queue.length,0);
});

test('doctor and team apothecary choices spend only the selected pool',()=>{
 const {g,d}=fixture([1,1],{plagueDoctors:1,apothecary:1},['Favoured of Nurgle']);g.resolveInjury(d,12);assert.deepEqual(g.pending.options,['Use Apothecary','Use Plague Doctor','Decline treatment']);choose(g,'Use Plague Doctor');assert.equal(g.apothecaries[1],1);assert.equal(g.plagueDoctors[1],0);
});

test('a stale medical aid callback cannot spend a second use or roll another die',()=>{
 const {g,d,queue}=fixture([16,1,1,6]);d.extraSkills=['Regeneration'];g.resolveInjury(d,12);const q=g.pending;choose(g,'Mortuary Assistant re-roll Regeneration');assert.equal(q.resolve('Mortuary Assistant re-roll Regeneration'),false);assert.equal(g.mortuaryAssistants[1],0);assert.equal(queue.length,0);
});
