const fs=require('node:fs');
let html=fs.readFileSync('index.html','utf8');
for(const [id,file] of [['movement-engine','movement.cjs'],['skills-engine','skills.cjs'],['match-engine','match.cjs'],['league-engine','league.cjs'],['league-ui','league-ui.cjs'],['workspace-ui','workspace-ui.cjs']])html=html.replace(new RegExp('<script id="'+id+'">[\\s\\S]*?<\\/script>'),()=>'<script id="'+id+'">\n'+fs.readFileSync(file,'utf8').trimEnd()+'\n</script>');
html=html.replace(/<style id="workspace-style">[\s\S]*?<\/style>/,()=>'<style id="workspace-style">\n'+fs.readFileSync('workspace.css','utf8').trimEnd()+'\n</style>');
fs.writeFileSync('index.html',html);
