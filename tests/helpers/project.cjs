const path=require('node:path');
const root=path.resolve(__dirname,'../..');
module.exports={projectPath:(file)=>path.join(root,file)};
