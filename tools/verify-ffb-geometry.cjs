// Development-only source-derived oracle. See THIRD_PARTY_NOTICES.md for FFB's MIT license.
// Requires the pinned FFB checkout and Java 21; the game and normal test suite do not.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),reference=path.resolve(process.env.FFB_SOURCE||path.join(root,'../vendor/ffb'));
function method(source,signature){const start=source.indexOf(signature);assert.ok(start>=0,'Missing pinned method '+signature);let depth=0;const open=source.indexOf('{',start);for(let i=open;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&!--depth)return source.slice(start,i+1);}throw Error('Unclosed reference method');}
const source=fs.readFileSync(path.join(reference,'ffb-common/src/main/java/com/fumbbl/ffb/util/UtilPassing.java'),'utf8');
const geometry=method(source,'private static boolean canIntercept('),width=source.match(/RULER_WIDTH\s*=\s*([\d.]+)/)[1];
const passSource=fs.readFileSync(path.join(reference,'ffb-common/src/main/java/com/fumbbl/ffb/mechanics/bb2025/PassMechanic.java'),'utf8');
const evaluate=method(passSource,'public PassResult evaluatePass(Player<?> thrower, int roll, PassingDistance distance, Collection<PassModifier> modifiers,');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bloodbowl-geometry-')),javaFile=path.join(directory,'GeometryOracle.java');
const java=`import java.util.*;
class GeometryOracle {
 static double RULER_WIDTH=${width};
 record FieldCoordinate(int x,int y){int getX(){return x;}int getY(){return y;}}
 enum PassResult {FUMBLE,SAVED_FUMBLE,ACCURATE,INACCURATE}
 record PassingDistance(int value){int getModifier2020(){return value;}}
 record PassModifier(int value){int getModifier(){return value;}}
 record StatBasedRollModifier(int value){int getModifier(){return value;}}
 static class NamedProperties {static final String dontDropFumbles="safe";}
 static class Player<T> {int pa;boolean safe;Player(int p,boolean s){pa=p;safe=s;}int getPassingWithModifiers(){return pa;}boolean hasSkillProperty(String property){return safe;}}
 int calculateModifiers(Collection<PassModifier> modifiers){return modifiers.stream().mapToInt(PassModifier::getModifier).sum();}
 ${evaluate}
 ${geometry}
 public static void main(String[] args){
  System.out.print("{\\"geometry\\":[");boolean first=true;
  for(int y=0;y<15;y++)for(int x=0;x<26;x++){
   byte[] mask=new byte[49];FieldCoordinate from=new FieldCoordinate(0,0),to=new FieldCoordinate(x,y);
   for(int py=0;py<15;py++)for(int px=0;px<26;px++){int bit=py*26+px;if(canIntercept(from,to,new FieldCoordinate(px,py)))mask[bit/8]|=(byte)(1<<(bit%8));}
   if(!first)System.out.print(",");first=false;
   System.out.print("{\\"target\\":["+x+","+y+"],\\"mask\\":\\""+Base64.getEncoder().encodeToString(mask)+"\\"}");
  }
  System.out.print("],\\"passes\\":[");first=true;GeometryOracle oracle=new GeometryOracle();
  for(int pa=0;pa<=6;pa++)for(int modifier=-10;modifier<=10;modifier++)for(int roll=1;roll<=6;roll++)for(int safe=0;safe<2;safe++){
   PassResult result=oracle.evaluatePass(new Player<Object>(pa,safe==1),roll,new PassingDistance(0),List.of(new PassModifier(modifier)),false,null);
   if(!first)System.out.print(",");first=false;
   System.out.print("["+pa+","+roll+","+modifier+","+safe+",\\""+result+"\\"]");
  }
  System.out.print("]}");
 }
}`;
let rows,passingResults;
try{fs.writeFileSync(javaFile,java);const run=spawnSync('java',[javaFile],{encoding:'utf8',maxBuffer:1024*1024,windowsHide:true});if(run.error)throw run.error;assert.equal(run.status,0,run.stderr);const result=JSON.parse(run.stdout);rows=result.geometry;passingResults=result.passes;}finally{fs.unlinkSync(javaFile);fs.rmdirSync(directory);}
const rangeMethod=method(passSource,'protected String[] throwingRangeTable('),rangeRows=[...rangeMethod.matchAll(/"([TQSLB ]+)"/g)].map(m=>m[1].split(' '));
assert.equal(rangeRows.length,14);
const fixture={reference:'christerk/ffb@bf3f89d96b5143a8730910a841e7430791094492',method:'UtilPassing.canIntercept / BB2025 PassMechanic.evaluatePass',sourceSha256:crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex'),passSourceSha256:crypto.createHash('sha256').update(passSource.replace(/\r\n/g,'\n')).digest('hex'),width:Number(width),origin:[0,0],widthSquares:26,heightSquares:15,rows,passingResults,passingChart:rangeRows.map(row=>Array.from({length:14},(_,x)=>({Q:0,S:1,L:2,B:3}[row[x]]??null)))};
const {MovementGame}=require('../movement.cjs'),game=Object.create(MovementGame.prototype);
let comparisons=0;
for(const row of rows){const bytes=Buffer.from(row.mask,'base64');for(let y=0;y<15;y++)for(let x=0;x<26;x++){const bit=y*26+x;assert.equal(game.interceptionSquare({x:0,y:0},{x:row.target[0],y:row.target[1]},{x,y}),!!(bytes[bit>>3]&(1<<(bit%8))),JSON.stringify({target:row.target,point:[x,y]}));comparisons++;}}
for(const [pa,roll,modifier,safe,result] of passingResults)assert.equal(game.classifyPass(pa,roll,modifier,!!safe),result,JSON.stringify({pa,roll,modifier,safe}));
if(process.argv.includes('--write-fixture')){fs.mkdirSync(path.join(root,'test-fixtures'),{recursive:true});fs.writeFileSync(path.join(root,'test-fixtures/ffb-interception.json'),JSON.stringify(fixture)+'\n');}
else assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'test-fixtures/ffb-interception.json'),'utf8')),fixture);
console.log('Pinned Java agrees on '+comparisons+' geometry pairs and '+passingResults.length+' passing outcomes; BB2025 range chart extracted.');
