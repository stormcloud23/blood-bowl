'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function build(){
let html=read('src/index.template.html');
const portraits=JSON.parse(read('src/data/portraits.json'));
const portraitMime={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
for(const [team,positions] of Object.entries(portraits)){
 for(const portrait of Object.values(positions)){
  const mime=portraitMime[path.extname(portrait.file).toLowerCase()];
  if(!mime)throw new Error('Unsupported portrait file: '+portrait.file);
  const photo=path.join(root,'portrait-intake',team,portrait.file);
  if(!fs.statSync(photo).isFile())throw new Error('Invalid portrait file: '+photo);
  portrait.url=['portrait-intake',team,portrait.file].map(encodeURIComponent).join('/');
 }
}
function embed(pattern,content,label){
 const matches=html.match(new RegExp(pattern.source,'g'));
 if(matches?.length!==1)throw new Error('Expected one '+label+' placeholder in src/index.template.html');
 html=html.replace(pattern,()=>content);
}
embed(/<script id="roster-data" type="application\/json">[\s\S]*?<\/script>/,'<script id="roster-data" type="application/json">\n'+read('src/data/rosters.json').trimEnd()+'\n</script>','roster data');
embed(/<script id="portrait-data" type="application\/json">[\s\S]*?<\/script>/,'<script id="portrait-data" type="application/json">'+JSON.stringify(portraits)+'</script>','portrait data');
for(const [id,file] of [
 ['movement-engine','src/engine/movement.cjs'],
 ['skills-engine','src/engine/skills.cjs'],
 ['match-engine','src/engine/match.cjs'],
 ['league-engine','src/features/league/league.cjs'],
 ['league-ui','src/features/league/league-ui.cjs'],
 ['workspace-ui','src/ui/workspace-ui.cjs']
])embed(new RegExp('<script id="'+id+'">[\\s\\S]*?<\\/script>'),'<script id="'+id+'">\n'+(read(file)+(id==='workspace-ui'?'\n'+read('src/features/computer/computer-ui.cjs'):'')).trimEnd()+'\n</script>',id);
embed(/<style id="workspace-style">[\s\S]*?<\/style>/,'<style id="workspace-style">\n'+read('src/ui/workspace.css').trimEnd()+'\n</style>','workspace style');
embed(/<script>[\s\S]*?<\/script>/,'<script>\n'+read('src/features/computer/computer.cjs').trimEnd()+'\n'+read('src/ui/reference.cjs').trimEnd()+'\n'+read('src/ui/app.js').trimEnd()+'\n</script>','app UI');
return html;
}
if(require.main===module)fs.writeFileSync(path.join(root,'index.html'),build());
module.exports={build};
