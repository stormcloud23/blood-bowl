const {test}=require('node:test'),assert=require('node:assert/strict');
const {MovementGame}=require('../../src/engine/movement.cjs');
const rosters=require('../../src/data/rosters.json');
function field(){const g=new MovementGame(rosters.slice(0,2),{dice:()=>{throw Error('Preview rolled dice');}}),p=g.players[0];g.players.forEach(q=>Object.assign(q,{x:null,y:null,status:'reserve'}));Object.assign(p,{x:10,y:7,status:'standing',spent:0});g.ball={x:null,y:null,carrier:null};return {g,p};}
test('equal-risk four-square cardinal routes stay straight in every direction',()=>{
 const {g,p}=field(),before=JSON.stringify({players:g.players,ball:g.ball,events:g.events});const routes=g.search(p);
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const route=routes.get((10+dx*4)+','+(7+dy*4));assert.equal(route.spent,4);assert.equal(route.turns,0);assert.deepEqual(route.path.map(s=>[s.x,s.y]),[1,2,3,4].map(n=>[10+dx*n,7+dy*n]));}
 assert.equal(JSON.stringify({players:g.players,ball:g.ball,events:g.events}),before);
});
test('safer routes still outrank a straight route through opposing tackle zones',()=>{
 const {g,p}=field(),foe=g.players.find(q=>q.team!==p.team);Object.assign(foe,{x:12,y:8,status:'standing'});
 const route=g.search(p).get('14,7');assert.equal(route.checks,0);assert.ok(route.path.some(s=>s.y!==7));
});
test('arrival headings retain the minimum-turn shortest route around obstacles',()=>{
 for(const blocked of [[],[[12,7]],[[12,7],[11,6]],[[12,6],[12,8]]]){
  const {g,p}=field();blocked.forEach(([x,y],i)=>Object.assign(g.players[i+1],{x,y,status:'prone'}));
  let best=Infinity;const visit=(x,y,n,heading,turns)=>{if(n===4){if(x===14&&y===7)best=Math.min(best,turns);return;}for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||g.at(x+dx,y+dy)||g.distance({x:x+dx,y:y+dy},{x:14,y:7})>3-n)continue;const next=dx+','+dy;visit(x+dx,y+dy,n+1,next,turns+Number(heading!==null&&heading!==next));}};
  visit(10,7,0,null,0);const route=g.search(p).get('14,7');assert.equal(route.spent,4);assert.equal(route.turns,best,JSON.stringify(blocked));
 }
});
