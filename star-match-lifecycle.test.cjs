const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {MatchGame}=require('./match.cjs');const rosters=JSON.parse(fs.readFileSync('rosters.json','utf8'));
function settle(g){let n=0;while(g.pending){assert.ok(n++<30,'Decision loop: '+g.pending.kind);const options=g.pending.options;assert.ok(options?.length,g.pending.kind);const choice=options.find(s=>s==='Finish reactions')||options.find(s=>s==='Accept send-off')||options.find(s=>s.startsWith('Keep '))||options.find(s=>s==='Decline treatment')||options[0];assert.ok(g.decide(choice));}}
function deployStars(g){const team=g.setupTeam,stars=g.available(team).filter(p=>p.star&&!g.onPitch(p));for(const p of stars){const regular=g.players.find(q=>q.team===team&&!q.star&&g.onPitch(q));assert.ok(regular);const {x,y}=regular;assert.ok(g.benchSetup(regular.id));assert.ok(g.placeSetup(p.id,x,y));}assert.deepEqual(g.setupErrors(team),[]);assert.ok(g.confirmSetup());}
function kickoff(g){deployStars(g);deployStars(g);assert.equal(g.phase,'kicker');assert.ok(g.nominateKicker(g.eligibleKickers()[0].id));assert.ok(g.kick(g.ownHalf(g.receiving,25)?25:0,7));settle(g);assert.equal(g.phase,'play');}
const cases=[
 {label:'Griff, Karla, Morg and Hthark',ids:['human','orc'],hires:[['griff-oberwald','karla-von-kill'],['morg-n-thorg','hthark']]},
 {label:'Swift pair, Eldril, Zolcath and Kiroth',ids:['wood-elf','wood-elf'],hires:[['swift-twins','eldril-sidewinder'],['zolcath','kiroth-krakeneye']]},
 {label:'Glart, Ripper, Fungus and Akhorne',ids:['skaven','goblin'],hires:[['glart-smashrip','ripper-bolgrot'],['fungus-the-loon','akhorne']]},
 {label:'Puggy and Borak',ids:['human','norse'],leagues:[null,'Chaos Clash'],hires:[['puggy-baconbreath','griff-oberwald'],['lord-borak','akhorne']]},
 {label:'Anqi and Willow',ids:['lizardmen','wood-elf'],leagues:[null,'Woodland League'],hires:[['anqi-panqi','akhorne'],['willow-rosebark','morg-n-thorg']]}
];
for(const c of cases)test('named-star match completes both halves with '+c.label,()=>{
 const teams=c.ids.map((id,i)=>{const r=structuredClone(rosters.find(r=>r.id===id));if(c.leagues?.[i])r.league=c.leagues[i];return r;}),before=JSON.stringify(teams),g=new MatchGame(teams,{learning:true,dice:s=>s});
 for(const [team,ids] of c.hires.entries())for(const id of ids)assert.ok(g.hireStar(team,id),id);
 const profiles=g.players.filter(p=>p.star).map(p=>[p.id,JSON.stringify(p.profileOverride)]),fees=[0,1].map(i=>g.resourceCosts(i).inducements);
 g.phase='leagueSteps';assert.ok(g.advancePregame());assert.equal(g.prayerCount,0);g.phase='kickChoice';assert.ok(g.chooseKicking(0));kickoff(g);
 assert.ok(g.players.filter(p=>p.star).every(p=>g.onPitch(p)&&p.fieldedDrive===1));
 for(let i=0;i<16;i++){assert.ok(g.endTurn());settle(g);}assert.equal(g.phase,'endDrive');assert.ok(g.continueDrive());settle(g);assert.equal(g.half,2);assert.equal(g.phase,'setup');kickoff(g);
 for(let i=0;i<16;i++){assert.ok(g.endTurn());settle(g);}assert.equal(g.phase,'endDrive');assert.ok(g.continueDrive());settle(g);assert.equal(g.phase,'finished');assert.deepEqual(g.turns,[8,8]);assert.deepEqual([0,1].map(i=>g.resourceCosts(i).inducements),fees);
 assert.equal(JSON.stringify(teams),before);for(const [id,profile] of profiles)assert.equal(JSON.stringify(g.players.find(p=>p.id===id).profileOverride),profile);
 if(c.hires.flat().includes('fungus-the-loon'))assert.equal(g.players.find(p=>p.star==='fungus-the-loon').status,'sent-off');
});
