const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {LeagueStore}=require('./league.cjs'),{MatchGame}=require('./match.cjs');
const {SkillGame,SKILL_CATALOG,SPECIAL_ACTION_TRAITS}=require('./skills.cjs');
const rosters=JSON.parse(fs.readFileSync('index.html','utf8').match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);

test('Insignificant draft submission permits equality and rejects a majority after reload',()=>{
 for(const [ordinary,small,legal] of [[6,6,true],[6,5,true],[5,6,false],[5,7,false]]){
  const roster=structuredClone(rosters[0]);roster.positions=[{...roster.positions[0],cost:10000,max:16},{...roster.positions[0],cost:10000,max:16,skills:['Insignificant']}];
  const s=new LeagueStore([roster]),t=s.create(roster.id,'Draft');
  for(let n=0;n<ordinary;n++)s.hire(t.id,0);for(let n=0;n<small;n++)s.hire(t.id,1);
  const reload=new LeagueStore([roster],s.data);
  if(legal){reload.submit(t.id);assert.equal(reload.team(t.id).draft,false);}
  else {const before=JSON.stringify(reload.data);assert.throws(()=>reload.submit(t.id),/Insignificant/);assert.equal(JSON.stringify(reload.data),before);reload.hire(t.id,0);if(small===ordinary+1)assert.doesNotThrow(()=>reload.submit(t.id));}
 }
});

test('Violent Innovator requires a special-action trait in advancement and the laboratory',()=>{
 const s=new LeagueStore(rosters),t=s.create(rosters[0].id,'Advances'),p=s.hire(t.id,0);
 for(const trait of [...SPECIAL_ACTION_TRAITS,'Monstrous Mouth','Punt','Throw Team-mate','Right Stuff','Block']){
  p.profile.skills=[trait];assert.equal(s.eligibleSkill(p,'Violent Innovator'),SPECIAL_ACTION_TRAITS.includes(trait),trait);
  const g=new SkillGame(rosters,{scenario:'skills'}),q=g.players[0];q.profileOverride={...g.profile(q),skills:[trait]};q.extraSkills=[];
  assert.equal(g.addSkill(q.id,'Violent Innovator'),SPECIAL_ACTION_TRAITS.includes(trait),trait);
  if(SPECIAL_ACTION_TRAITS.includes(trait)){p.profile.skills.push('Violent Innovator');assert.equal(s.eligibleSkill(p,'Violent Innovator'),false);}
 }
});

test('Violent Innovator awards opposing special casualties but excludes fouls, self-harm and pinned Vomit',()=>{
 for(const enabled of [false,true])for(const cause of ['Stab','Chainsaw','Breathe Fire','Bomb','Ball & Chain collision','Kick Team-mate','Projectile Vomit','Foul','Saboteur','Animal Savagery']){
  const g=new MatchGame(rosters,{dice:()=>6}),p=g.players[0];p.extraSkills=enabled?['Violent Innovator']:[];
  g.resolveInjury(g.players[11],12,()=>{},{source:{playerId:p.id,cause}});
  const earns=enabled&&!['Projectile Vomit','Foul','Saboteur','Animal Savagery'].includes(cause);
  assert.equal(g.playerStats?.[p.id]?.casualty||0,+earns,cause);
  g.resolveInjury(g.players[1],12,()=>{},{source:{playerId:p.id,cause}});
  g.resolveInjury(p,12,()=>{},{source:{playerId:p.id,cause}});
  assert.equal(g.playerStats?.[p.id]?.casualty||0,+earns,cause+' friendly/self');
 }
});

test('actual Stab, Chainsaw and Breathe Fire casualties reach the Violent Innovator statistic',()=>{
 for(const name of ['Stab','Chainsaw','Breathe Fire'])for(const enabled of [false,true]){
  const g=new MatchGame(rosters,{dice:()=>6}),p=g.players[0],d=g.players[11];g.phase='play';p.extraSkills=[name,...(enabled?['Violent Innovator']:[])];
  g.specialAttack(p,d,name);assert.equal(d.status,'casualty',name);assert.equal(g.playerStats?.[p.id]?.casualty||0,+enabled,name);
 }
});

test('bomb rethrows credit the original bombardier for each opposing casualty only',()=>{
 for(const enabled of [false,true]){
  const g=new SkillGame(rosters,{dice:()=>6});g.rerolls=[0,0];g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));
  const a=g.players[0],friend=g.players[1],d=g.players[11],other=g.players[12],rethrower=g.players[13];
  for(const [p,x,y] of [[a,10,7],[friend,12,8],[d,12,7],[other,13,7],[rethrower,20,7]])Object.assign(p,{x,y,status:'standing'});
  a.extraSkills=['Bombardier',...(enabled?['Violent Innovator']:[])];rethrower.extraSkills=['Violent Innovator'];
  g.beginBomb(a);g.rethrowBomb(rethrower);g.explodeBomb(12,7);
  assert.equal(g.bombContext,null);assert.equal(g.playerStats?.[a.id]?.casualty||0,enabled?2:0);assert.equal(g.playerStats?.[rethrower.id]?.casualty||0,0);
  assert.equal(friend.status,'casualty');assert.equal(d.status,'casualty');assert.equal(other.status,'casualty');
 }
});

test('Ball & Chain ground collision credits only a Violent Innovator against an opponent',()=>{
 for(const enabled of [false,true])for(const friendly of [false,true]){
  const queue=[3,6,6,6,6,1,1],g=new SkillGame(rosters,{dice:s=>{assert.ok(queue.length,'Unexpected D'+s);return queue.shift();}});g.rerolls=[0,0];
  g.players.forEach(p=>Object.assign(p,{x:null,y:null,status:'reserve'}));
  const a=g.players[0],d=g.players[friendly?1:11];Object.assign(a,{x:10,y:7,status:'standing',extraSkills:['Ball & Chain',...(enabled?['Violent Innovator']:[])]});Object.assign(d,{x:11,y:7,status:'prone'});
  g.start(a.id);g.decide('Aim East');assert.equal(g.pending.type,'pushChoice');g.pending.resolve(g.pending.options.find(s=>!s.standFirm));
  assert.equal(d.status,'casualty');assert.equal(g.playerStats?.[a.id]?.casualty||0,+(enabled&&!friendly));assert.equal(queue.length,0);
 }
});

test('Kick Team-mate collision credits kicker and Lethal Flight passenger independently',()=>{
 for(const kick of [false,true])for(const violent of [false,true])for(const lethal of [false,true])for(const friendly of [false,true]){
  const queue=[6,5,5,5,6,6,6,6,1,1,5,1,1],g=new SkillGame(rosters,{scenario:'pickup',dice:s=>{assert.ok(queue.length,'Unexpected D'+s);return queue.shift();}});
  g.rerolls=[0,0];const a=g.players[0],p=g.players[1],d=g.players[friendly?2:11];
  a.extraSkills=[kick?'Kick Team-mate':'Throw Team-mate',...(violent?['Violent Innovator']:[])];p.extraSkills=['Right Stuff',...(lethal?['Lethal Flight']:[])];
  Object.assign(p,{x:9,y:7});Object.assign(d,{x:15,y:7,status:'standing'});
  g.start(a.id,kick?'kick-team-mate':'throw-team-mate');g.selectThrowMate(p.id);g.throwTeamMate(12,7);
  if(g.pending){assert.equal(g.pending.kind,'Lethal Flight');g.decide('No modifier');}
  assert.equal(d.status,'casualty');assert.equal(g.playerStats?.[a.id]?.casualty||0,+(kick&&violent&&!friendly));
  assert.equal(g.playerStats?.[p.id]?.casualty||0,+(lethal&&!friendly));assert.equal(queue.length,0);
 }
});

test('healed special-action casualty retains league SPP through atomic post-game save and reload',()=>{
 const s=new LeagueStore(rosters,null,{dice:()=>6}),l=s.createLeague('Awards'),ts=rosters.map((r,i)=>{
  const t=s.create(r.id,'Team '+i);for(let n=0;n<11;n++)s.hire(t.id,0);s.submit(t.id);s.enterLeague(l.id,t.id);return t;
 });
 const learned=ts[0].players[0];learned.profile.skills.push('Stab');learned.profile.primary='D';learned.spp=6;
 s.advance(ts[0].id,learned.id,'Violent Innovator');
 const a=s.startFixture(...ts.map(t=>t.id)),g=new MatchGame(a.teams,{dice:()=>6});g.leagueFixtureId=a.id;g.phase='play';g.players.forEach(p=>p.fieldedDrive=1);g.fans=[2,2];
 const attacker=g.players[0],victim=g.players[11];g.apothecaries[1]=1;g.specialAttack(attacker,victim,'Stab');
 assert.match(g.pending.kind,/Apothecary/);g.decide('Use Apothecary');assert.equal(victim.status,'reserve');
 assert.equal(g.playerStats[attacker.id].casualty,1);g.phase='finished';g.pending=null;
 const nominations=[0,1].map(i=>g.players.filter(p=>p.team===i).slice(0,6).map(p=>p.id));
 s.finishFixture(g,nominations);const reload=new LeagueStore(rosters,s.data),player=reload.team(ts[0].id).players[0];
 assert.equal(player.spp,2);assert.equal(player.earnedSpp,2);assert.equal(player.stats.casualty,1);
 assert.equal(reload.team(ts[1].id).players[0].injuries.length,0);
 const before=JSON.stringify(reload.data);assert.throws(()=>reload.finishFixture(g,nominations));assert.equal(JSON.stringify(reload.data),before);
});
