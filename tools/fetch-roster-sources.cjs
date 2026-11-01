// Development-only source snapshotter. No network is needed by the game.
const fs=require('node:fs'),path=require('node:path');
const slugs=process.argv.slice(2);
async function main(){const dir=path.resolve('..','.codex-attachments','roster-sources');fs.mkdirSync(dir,{recursive:true});for(const slug of slugs){if(!/^[A-Za-z_]+$/.test(slug))throw Error('Invalid roster slug');const url='https://bloodbowlbase.ru/bb2025/teams/'+slug+'/';const response=await fetch(url);if(!response.ok)throw Error(url+': '+response.status);const html=await response.text();fs.writeFileSync(path.join(dir,slug+'.html'),html);console.log(slug+' '+html.length);}}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
