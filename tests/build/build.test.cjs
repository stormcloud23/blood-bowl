const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {build}=require('../../scripts/build.cjs');
const {projectPath}=require('../helpers/project.cjs');

test('the editable template and all source assets reproduce the published standalone page',()=>{
 const html=build();
 assert.equal(html,fs.readFileSync(projectPath('index.html'),'utf8'));
 assert.doesNotMatch(html,/<script\b[^>]*\bsrc\s*=/i);
 assert.doesNotMatch(html,/<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i);
});
