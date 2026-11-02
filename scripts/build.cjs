'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function build(){
let html=read('src/index.template.html');
function embed(pattern,content,label){
 const matches=html.match(new RegExp(pattern.source,'g'));
 if(matches?.length!==1)throw new Error('Expected one '+label+' placeholder in src/index.template.html');
 html=html.replace(pattern,()=>content);
}
embed(/<script id="roster-data" type="application\/json">[\s\S]*?<\/script>/,'<script id="roster-data" type="application/json">\n'+read('src/data/rosters.json').trimEnd()+'\n</script>','roster data');
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
