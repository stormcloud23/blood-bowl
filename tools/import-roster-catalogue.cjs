// Parse locally saved BB2025 roster tables. Review candidates before publishing.
const fs=require('node:fs'),path=require('node:path');
const sourceDir=path.resolve('..','.codex-attachments','roster-sources');
function text(html){return html.replace(/<(?:del|s)>[\s\S]*?<\/(?:del|s)>/g,'').replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&rsquo;/g,"'").replace(/\s+/g,' ').trim();}
function section(html,id){return html.match(new RegExp('<h3 id="'+id+'">[\\s\\S]*?(?=<h3|$)'))?.[0]||'';}
function entries(html){return [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>text(m[1]));}
const candidates=[];
for(const file of fs.readdirSync(sourceDir).filter(f=>f.endsWith('.html')).sort()){
 const slug=file.slice(0,-5),html=fs.readFileSync(path.join(sourceDir,file),'utf8'),table=section(html,'positionals');
 const positions=[];
 for(const row of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)){
  const cells=[...row[1].matchAll(/<td(?: [^>]*)?>([\s\S]*?)<\/td>/g)].map(m=>m[1]);if(!cells.length)continue;if(cells.length!==11)throw Error(slug+': irregular table row '+cells.length);
  const c=cells.map(text),name=text(cells[1].replace(/<em>[\s\S]*?<\/em>/,'')),traits=text(cells[1].match(/<em>([\s\S]*?)<\/em>/)?.[1]||'').replace(/^\(|\)$/g,''),skills=cells[7].split(/<br\s*\/?\s*>/i).map(text).map(s=>s.replace(/^•\s*/,'' )).filter(s=>s&&s!=='-');
  positions.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),name,traits,max:+c[0].match(/\d+$/)[0],ma:+c[2],st:+c[3],ag:c[4],pa:c[5],av:c[6],skills,primary:c[8],secondary:c[9],cost:parseInt(c[10])*1000});
 }
 const staff=text(section(html,'staff')),leagues=entries(section(html,'league')),special=entries(section(html,'special-rules'));
 const roster={id:slug.toLowerCase().replaceAll('_','-'),name:slug.replaceAll('_',' '),tier:+html.match(/TIER\s+(\d+)/)[1],league:leagues[0],...(leagues.length>1?{leagues}:{}),special,source:'https://bloodbowlbase.ru/bb2025/teams/'+slug+'/',reroll:+staff.match(/Re-roll\s*-\s*(\d+)K/i)[1]*1000,positions,lineup:[],reviewed:'2026-10-31',staff:{apothecary:/Apothecary\s*-\s*50K/.test(staff)?50000:0,assistantCoach:10000,cheerleader:10000}};
 candidates.push(roster);
 console.log(slug+': '+positions.length+' positions; '+special.join(' / ')+'; leagues '+leagues.join(' / '));
 const note=text(table.slice(table.indexOf('</table>')+8));if(note)console.log('  Footnote: '+note);
}
fs.writeFileSync(path.join(sourceDir,'candidates.json'),JSON.stringify(candidates,null,2)+'\n');
