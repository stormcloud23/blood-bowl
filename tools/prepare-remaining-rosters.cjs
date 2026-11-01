// One-time import of reviewed local candidates into the curated catalogue.
const fs=require('node:fs'),rosters=JSON.parse(fs.readFileSync('rosters.json','utf8')),candidates=require('../../.codex-attachments/roster-sources/candidates.json');
for(const r of candidates){
 if(rosters.some(old=>old.id===r.id))continue;
 r.positions.forEach(p=>{p.name=p.name.replace(/\*$/,'');p.skills=p.skills.map(s=>s.replace(/\(\s*(\d+\+)\s*\)/g,'($1)').replace('Dirty Player (+1)','Dirty Player'));});
 const big=r.positions.map((p,i)=>p.traits.includes('Big Guy')?i:-1).filter(i=>i>=0);
 if(['chaos-chosen','old-world-alliance','underworld-denizens'].includes(r.id))r.groupLimits=[{label:'Big Guys',roles:big,max:1}];
 if(r.id==='chaos-renegades')r.groupLimits=[{label:'Big Guys',roles:big,max:3}];
 if(r.id==='chaos-chosen'||r.id==='chaos-renegades'){r.alignments=r.id==='chaos-chosen'?['Undivided','Hashut','Khorne','Nurgle','Slaanesh','Tzeentch']:['Undivided','Khorne','Nurgle','Slaanesh','Tzeentch'];r.special=[];}
 if(r.id==='norse'){r.special=[];r.leagueRules={'Chaos Clash':['Favoured of Khorne']};}
 if(r.id==='halfling')r.rosterKeywords=['Master Chef'];
 const base=r.positions.findIndex(p=>p.max===16&&p.traits.includes('Lineman'));if(base<0)throw Error('No lineman: '+r.id);
 r.lineup=Array(11).fill(base);
 const legal=lineup=>lineup.reduce((n,i)=>n+r.positions[i].cost,0)+2*r.reroll<=1000000&&(r.groupLimits||[]).every(g=>lineup.filter(i=>g.roles.includes(i)).length<=g.max);
 for(let role=0;role<r.positions.length;role++)if(role!==base){for(let n=0;n<r.positions[role].max;n++){const i=r.lineup.lastIndexOf(base);if(i<0)break;const proposed=[...r.lineup];proposed[i]=role;if(legal(proposed))r.lineup=proposed;else break;}}
 if(r.id==='snotling')r.lineup=[1,2,3,3,4,4,5,5,0,0,0,0,0,0,0,0];
 if(r.id==='shambling-undead')r.lineup=[0,0,0,1,1,2,2,3,3,4,4];
 if(r.id==='underworld-denizens')r.lineup=[0,0,0,1,1,1,2,3,4,5,6];
 if(r.id==='ogre')r.lineup=[0,0,0,0,0,0,1,1,1,1,2];
 if(!legal(r.lineup))throw Error('Illegal demonstration budget: '+r.id);
 rosters.push(r);
}
fs.writeFileSync('rosters.json',JSON.stringify(rosters,null,2)+'\n');
console.log(rosters.length+' catalogue rosters');
