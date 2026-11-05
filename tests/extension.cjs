const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const dir=__dirname+'/../';
// Synthetic data; reproduce Synergy's separate header/body tables and hidden columns.
function grid(id,heads,rows){return `<div class="dx-datagrid" role="group"><div><table><tr>${heads.map(([name,index])=>`<td role="columnheader" id="${id}-${index}" aria-colindex="${index}" ${name==='Assignment Type'?'aria-hidden="true"':''}>${name}</td>`).join('')}</tr></table></div><div role="grid"><table>${rows.map((r,i)=>`<tr class="dx-data-row" aria-rowindex="${i+1}">${r.map(([index,text])=>`<td role="gridcell" aria-describedby="${id}-${index}" aria-colindex="${index}">${text}</td>`).join('')}</tr>`).join('')}</table></div></div>`;}
const heads=[['Date',2],['',3],['Assignment',4],['Assignment Type',5],['Score',7],['Points',9],['Notes',10]];
const row=(name,cat,score,points,notes='')=>[[1,'Expand'],[2,'1/1/26'],[3,''],[4,name],[5,cat],[7,score],[9,points],[10,notes]];
const summary=grid('sum',[['Assignment Type',1],['Weight',2],['Points',3],['Points Possible',4]],[
 [[1,'Tests'],[2,'70%'],[3,'80'],[4,'100']],[[1,'Homework'],[2,'30%'],[3,'100'],[4,'100']],[[1,'TOTAL'],[2,'100%'],[3,'180'],[4,'200']]]);
const assignments=grid('asg',heads,[row('Test one','Tests','80 out of 100','80.00/100.0000'),row('Practice','Homework','100 out of 100','100/100'),row('Future quiz','Tests','Not Graded','44.0000 Points Possible'),row('Optional','Tests','3 out of 3','3/3','(Not For Grading)')]);
const dom=new JSDOM('<main><div role=toolbar><input role=combobox value=Term1><input role=combobox value=ClassA></div><div id=gradebook-content><div class=gb-current-grade><div id=current-grade><div class=mark>A</div><div class=score>86%</div></div></div>'+summary+'<div id=assignment-details>'+assignments+'</div></div></main>',{url:'https://synergyportal.anoka.k12.mn.us/',runScripts:'outside-only'});
const w=dom.window;w.structuredClone=structuredClone;
const isUserscript=process.argv.includes('--userscript');
if(isUserscript){
 const bundle=require('../scripts/build.cjs').userscript();
 assert.equal(bundle,fs.readFileSync(dir+'userscript/gradepreview.user.js','utf8'));
 // The page may already own helper globals; the userscript must leave them untouched.
 w.SynergyMath={pageOwned:true};w.SynergyImport={pageOwned:true};w.module={exports:{pageOwned:true}};
 w.eval(bundle);w.eval(bundle);
 assert.equal(w.document.querySelectorAll('#synergy-grade-sandbox').length,1);
 assert.equal(w.SynergyMath.pageOwned,true);assert.equal(w.SynergyImport.pageOwned,true);assert.equal(w.module.exports.pageOwned,true);
 const offsite=new JSDOM('<body></body>',{url:'https://example.com/',runScripts:'outside-only'});offsite.window.eval(bundle);assert.equal(offsite.window.document.querySelector('#synergy-grade-sandbox'),null);offsite.window.close();
}
// Load helpers in the test window for calculation assertions. UI itself is already booted in userscript mode.
for(const f of ['core.js','importer.js',...(isUserscript?[]:['content.js'])])w.eval(fs.readFileSync(dir+f,'utf8'));
const result=w.SynergyImport.readGradebook(w.document);
assert.equal(result.rows.length,4);assert.equal(result.rows[2].earned,'');assert.equal(result.rows[2].possible,44);assert.equal(result.rows[3].include,false);
assert.equal(result.mode,'weighted');assert.equal(result.weights.Tests,70);assert.equal(result.warnings.length,0);
assert.equal(w.SynergyMath.calculate(result.rows,result.mode,result.weights),86);
const sh=w.document.getElementById('synergy-grade-sandbox').shadowRoot,$=id=>id==='launch'?w.document.getElementById('synergy-whatif-grade').shadowRoot.getElementById(id):sh.getElementById(id);
const input=(e,value)=>{e.value=value;e.dispatchEvent(new w.Event('input'));};
(async()=>{
 await new Promise(setImmediate);assert.equal(w.document.getElementById('synergy-grade-sandbox').nextSibling.id,'assignment-details');assert.equal(w.document.querySelectorAll('[data-synergy-row-tools]').length,4);const inline=w.document.querySelector('[data-synergy-row-tools]').shadowRoot;const grade=w.document.getElementById('synergy-whatif-grade').shadowRoot;
 assert.equal(sh.querySelector('#class-context'),null);assert.equal(sh.querySelector('#launch'),null);assert.equal(grade.querySelector('#launch').textContent,'More options');assert.equal(grade.querySelector('.note').textContent,'');assert.equal(inline.querySelector('.box').hidden,true);inline.querySelector('.toggle').click();assert.equal(inline.querySelector('.box').hidden,false);assert.equal(inline.querySelector('.toggle').getAttribute('aria-expanded'),'true');
 assert.equal($('panel').hidden,true);assert.equal(w.document.getElementById('current-grade').nextSibling.id,'synergy-whatif-grade');
 input(inline.querySelector('input[type=number]'),'100');assert.equal(grade.querySelector('.value').textContent,'100.00%');assert.equal($('panel').hidden,true);assert.equal(w.document.querySelector('#current-grade .score').textContent,'86%');assert.equal(inline.querySelector('.toggle').hidden,true);inline.querySelector('[data-close]').click();assert.equal(inline.querySelector('.toggle').hidden,false);assert.equal(inline.querySelector('.box').hidden,true);assert.equal(grade.querySelector('.value').textContent,'100.00%');inline.querySelector('.toggle').click();
 inline.querySelector('[data-reset]').click();assert.equal(grade.querySelector('.value').textContent,'86.00%');
 const editors=[...w.document.querySelectorAll('[data-synergy-row-tools]')].map(e=>e.shadowRoot);
 input(editors[2].querySelector('input[type=number]'),'44');assert.equal(grade.querySelector('.value').textContent,'90.28%');assert.equal($('panel').hidden,true);editors[2].querySelector('[data-reset]').click();
 assert.equal(editors[3].querySelector('input[type=checkbox]'),null);const count=sh.querySelector('[aria-label="include for assignment 4"]');count.checked=true;count.dispatchEvent(new w.Event('input'));assert.equal(grade.querySelector('.value').textContent,'86.41%');editors[3].querySelector('[data-reset]').click();assert.equal(grade.querySelector('.value').textContent,'86.00%');
 input(inline.querySelector('input[type=number]'),'0');assert.equal(grade.querySelector('.value').textContent,'30.00%');inline.querySelector('[data-reset]').click();
 $('launch').click();assert.equal($('panel').hidden,false);$('import').click();assert.equal($('result').textContent,'86.00%');assert.equal($('rows').children.length,4);assert.equal(sh.querySelector('#delta'),null);assert.equal(sh.querySelector('#baseline'),null);assert.equal(grade.querySelector('.delta'),null);const category=sh.querySelector('[aria-label="category for assignment 1"]');assert.equal(category.tagName,'SELECT');assert.deepEqual([...category.options].map(o=>o.value),['Tests','Homework']);input(category,'Homework');assert.equal($('result').textContent,'90.00%');$('reset').click();
 input(sh.querySelector('[aria-label="earned for assignment 1"]'),'100');assert.equal($('result').textContent,'100.00%');
 $('reset').click();assert.equal($('result').textContent,'86.00%');
 input(sh.querySelector('[aria-label="earned for assignment 3"]'),'0');assert.ok(parseFloat($('result').textContent)<86);
 $('add').click();assert.equal($('rows').children.length,5);
// Per-class drafts and automatic mounting after StudentVUE replaces its content.
input(sh.querySelector('[aria-label="earned for assignment 1"]'),'99');
const selectors=w.document.querySelectorAll('[role=combobox]');selectors[1].value='ClassB';
const marker=w.document.createElement('span');w.document.querySelector('main').append(marker);
await new Promise(r=>setTimeout(r,350));assert.equal($('result').textContent,'86.00%');
selectors[1].value='ClassA';marker.remove();await new Promise(r=>setTimeout(r,350));
assert.equal(sh.querySelector('[aria-label="earned for assignment 1"]').value,'99');
$('close').click();const rowTool=w.document.querySelector('[data-synergy-row-tools]').shadowRoot.querySelector('input[type=number]');input(rowTool,'88');assert.equal($('panel').hidden,true);assert.equal(grade.querySelector('.value').textContent,'72.78%');
w.document.getElementById('assignment-details').remove();await new Promise(r=>setTimeout(r,350));assert.equal(w.document.getElementById('synergy-grade-sandbox').hidden,true);

 // Incomplete filtered grids must be detected by their summary totals.
 w.document.querySelector('tr.dx-data-row[aria-rowindex="1"]').remove();
 const truncated=new JSDOM(summary+grid('asg',heads,[row('Test one','Tests','80 out of 100','80/100')])).window.document;
 assert.ok(w.SynergyImport.readGradebook(truncated).warnings.some(x=>x.includes('Homework')));
 console.log('Inline editing with the panel closed, grade placement, official grade preservation, row resets, ungraded and excluded scores, class drafts and incomplete-total checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
