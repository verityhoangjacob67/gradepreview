const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function userscript(){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  const header=`// ==UserScript==
// @name         GradePreview for StudentVUE
// @namespace    https://github.com/verityhoangjacob67/gradepreview-for-studentvue
// @version      ${manifest.version}
// @description  Preview how assignment and test scores affect your StudentVUE grade.
// @match        https://synergyportal.anoka.k12.mn.us/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==
`;
  const read=name=>fs.readFileSync(path.join(root,name),'utf8');
  // Keep helper names private, even in userscript managers that use page context.
  const helpers=['core.js','importer.js'].map(name=>read(name).replace('})(globalThis);','})(runtime);')).join('\n');
  return header+`\n(function(){
if(location.protocol!=='https:'||location.hostname!=='synergyportal.anoka.k12.mn.us'||window.top!==window.self)return;
const runtime={},module=undefined;
${helpers}
const {SynergyMath,SynergyImport}=runtime;
${read('content.js')}
})();\n`;
}
function build(){
  const out=path.join(root,'userscript');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'gradepreview.user.js'),userscript());
  console.log('Built userscript/gradepreview.user.js');
}
if(require.main===module)build();
module.exports={userscript};
