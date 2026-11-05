// ==UserScript==
// @name         GradePreview for StudentVUE
// @namespace    https://github.com/verityhoangjacob67/gradepreview-for-studentvue
// @version      1.4.0
// @description  Preview how assignment and test scores affect your StudentVUE grade.
// @match        https://synergyportal.anoka.k12.mn.us/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

(function(){
if(location.protocol!=='https:'||location.hostname!=='synergyportal.anoka.k12.mn.us'||window.top!==window.self)return;
const runtime={},module=undefined;
/* Shared pure calculation code. Blank scores remain ungraded. */
(function(root){
  function calculate(rows, mode, weights) {
    const groups = new Map();
    for (const r of rows) {
      if (!r.include || r.earned === '' || r.possible === '') continue;
      const e = Number(r.earned), p = Number(r.possible);
      if (!Number.isFinite(e) || !Number.isFinite(p) || e < 0 || p < 0) throw Error('Scores must be nonnegative finite numbers.');
      const key = mode === 'points' ? 'All' : r.category;
      const g = groups.get(key) || {earned:0, possible:0};
      g.earned += e; g.possible += p; groups.set(key,g);
    }
    let numerator = 0, denominator = 0;
    for (const [name,g] of groups) {
      if (!g.possible) continue;
      const w = mode === 'points' ? 1 : (weights[name] === '' ? NaN : Number(weights[name]));
      if (!Number.isFinite(w) || w < 0) throw Error('Enter a nonnegative weight for every graded category.');
      numerator += g.earned / g.possible * w; denominator += w;
    }
    return denominator ? numerator / denominator * 100 : null;
  }
  function parsePoints(text) {
    const m = String(text).trim().match(/^([\d,]+(?:\.\d+)?)\s*\/\s*([\d,]+(?:\.\d+)?)(?:\s|$)/);
    return m ? {earned:Number(m[1].replaceAll(',','')), possible:Number(m[2].replaceAll(',',''))} : null;
  }
  root.SynergyMath = {calculate, parsePoints};
  if (typeof module !== 'undefined') module.exports = root.SynergyMath;
})(runtime);

(function(root) {
  function readGradebook(doc) {
    const rows=[], weights=Object.create(null), summaries=[], warnings=[];
    const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
    const numeric=s=>{const t=clean(s).replaceAll(',','').replace(/%$/,'');return /^\d+(\.\d+)?$/.test(t)?Number(t):null;};
    const grids=[...doc.querySelectorAll('.dx-datagrid')];
    for(const grid of grids) {
      const headers=[...grid.querySelectorAll('[role="columnheader"]')];
      const header=name=>headers.find(h=>clean(h.textContent)===name);
      const cell=(tr,name)=>{
        const h=header(name);if(!h)return '';
        const cells=[...tr.children];
        const c=cells.find(c=>(c.getAttribute('aria-describedby')||'').split(/\s+/).includes(h.id)) || cells.find(c=>h.getAttribute('aria-colindex') && c.getAttribute('aria-colindex')===h.getAttribute('aria-colindex'));
        return clean(c?.textContent);
      };
      if(header('Assignment') && header('Points')) {
        for(const tr of grid.querySelectorAll('tr.dx-data-row')) {
          const name=cell(tr,'Assignment'), category=cell(tr,'Assignment Type');
          if(!name)continue;
          const text=cell(tr,'Points'), pts=root.SynergyMath.parsePoints(text);
          const notes=cell(tr,'Notes'), score=cell(tr,'Score');
          const excluded=/(not for grading|excused|excluded)/i.test(notes+' '+score+' '+text);
          const possible=text.match(/\/\s*([\d,]+(?:\.\d+)?)/)?.[1] || text.match(/^([\d,]+(?:\.\d+)?)\s+Points Possible/i)?.[1] || score.match(/out of\s+([\d,]+(?:\.\d+)?)/i)?.[1];
          rows.push({name,category:category||'Uncategorized',earned:/not graded|ungraded/i.test(score)?'':pts?.earned??'',possible:pts?.possible??(possible?Number(possible.replaceAll(',','')):''),include:!excluded});
        }
      } else if(header('Assignment Type') && header('Weight') && header('Points Possible')) {
        for(const tr of grid.querySelectorAll('tr.dx-data-row')) {
          const name=cell(tr,'Assignment Type');if(!name||/^total$/i.test(name))continue;
          const weight=numeric(cell(tr,'Weight')),earned=numeric(cell(tr,'Points')),possible=numeric(cell(tr,'Points Possible'));
          if(weight!==null)weights[name]=weight;
          if(earned!==null&&possible!==null)summaries.push({name,earned,possible});
        }
      }
    }
    for(const s of summaries) {
      const group=rows.filter(r=>r.include&&r.category===s.name&&r.earned!==''&&r.possible!=='');
      const e=group.reduce((v,r)=>v+Number(r.earned),0),p=group.reduce((v,r)=>v+Number(r.possible),0);
      if(Math.abs(e-s.earned)>0.011||Math.abs(p-s.possible)>0.011)warnings.push('Loaded assignments do not match summary totals for '+s.name+'. Clear filters and load all rows; special grading rules may also affect totals.');
    }
    if(!Object.keys(weights).length)warnings.push('Category weights unavailable. Select Grid beside the portal chart, then import again, or enter weights manually.');
    if(rows.some(r=>r.possible===''))warnings.push('Some assignments have no numeric possible points. Enter them before simulating a score.');
    return {rows,weights,warnings,mode:Object.keys(weights).length?'weighted':'points'};
  }
  root.SynergyImport={readGradebook};
  if(typeof module!=='undefined')module.exports=root.SynergyImport;
})(runtime);

const {SynergyMath,SynergyImport}=runtime;
(() => {
  if (document.getElementById('synergy-grade-sandbox')) return;
  const host = document.createElement('div'); host.id = 'synergy-grade-sandbox';
  const shadow = host.attachShadow({mode:'open'}); document.documentElement.append(host);
  shadow.innerHTML = `<style>
  :host{all:initial;font:14px system-ui;color:#17263f}*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid #ccd6e6;border-radius:8px;padding:9px 13px;background:white;color:#17263f}button:hover{background:#eaf0ff}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #73a4ff}#launch{position:fixed;bottom:24px;right:24px;background:#2459c4;color:white;z-index:2147483647;box-shadow:0 5px 25px #0003}#panel{position:fixed;right:18px;top:24px;bottom:80px;width:min(850px,calc(100vw - 36px));z-index:2147483647;background:#f5f7fb;border:1px solid #b7c6de;border-radius:16px;box-shadow:0 16px 70px #0005;overflow:auto;padding:22px}h1{font-size:23px;margin:0}h2{font-size:16px}header,.tools{display:flex;align-items:center;gap:9px;flex-wrap:wrap}header{justify-content:space-between}p{line-height:1.5}.muted{color:#52627a;font-size:12px}#result{font-size:36px;font-weight:700;color:#2459c4}.card{background:white;border:1px solid #dae2ee;padding:15px;border-radius:12px;margin:14px 0}input,select{border:1px solid #bfccdf;padding:7px;border-radius:5px;max-width:100%;background:white;color:#17263f}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left}td,th{padding:6px 3px;border-bottom:1px solid #e0e6ef}td input[type=number]{width:80px}td input[type=text]{width:150px}#weights label{display:inline-flex;align-items:center;gap:6px;margin:5px}#weights input{width:75px}.scroll{overflow:auto}#status:empty{display:none}#status{color:#875500;white-space:pre-line}[hidden]{display:none!important}</style>
  <button id="launch" type="button">Grade calculator</button>
  <section id="panel" hidden aria-label="GradePreview for StudentVUE"><header><h1>GradePreview for StudentVUE</h1><button id="close" aria-label="Close calculator">Close</button></header>
  <div class="tools"><button id="import">Refresh from gradebook</button><button id="add">+ Assignment</button><button id="reset">Reset changes</button></div>
  <p id="status" role="status">Open a class's Assignment View, clear filters, and load all rows before importing.</p>
  <div class="card"><label>Grading method <select id="mode"><option value="points">Total points</option><option value="weighted">Weighted categories</option></select></label><div id="weights" hidden></div><div id="result" aria-live="polite">—</div><p id="error" role="alert"></p></div>
  <div class="scroll"><table><thead><tr><th>Count</th><th>Assignment</th><th>Category</th><th>Earned</th><th>Possible</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
  </section>`;
  shadow.querySelectorAll('button').forEach(b=>{b.type='button';});
  const launchButton=shadow.getElementById('launch');
  const $ = id => id==='launch'?launchButton:shadow.getElementById(id);
  let importWarnings = [];
  let rows = [], baseline = [], weights = {}, originalWeights = {}, originalMode = "points";
  const el = (tag,text) => { const e=document.createElement(tag); if(tag==='button')e.type='button'; if(text!==undefined)e.textContent=text; return e; };
  function update(){
    $('error').textContent='';
    try { const n=SynergyMath.calculate(rows,$('mode').value,weights); $('result').textContent=n===null?'—':n.toFixed(2)+'%'; }
    catch(e){$('result').textContent='Check inputs'; $('error').textContent=e.message;}
    syncInlineEditors();
  }
  function renderWeights(){
    $('weights').hidden=$('mode').value!=='weighted'; $('weights').replaceChildren();
    for(const c of new Set(rows.map(r=>r.category))){
      const l=el('label',c+' % '), i=el('input'); i.type='number';i.min='0';i.step='any';i.value=weights[c]??'';
      i.addEventListener('input',()=>{weights[c]=i.value;update();});l.append(i);$('weights').append(l);
    }
  }
  function render(){
    $('rows').replaceChildren();
    rows.forEach((r,index)=>{
      const tr=el('tr');
      for(const key of ['include','name','category','earned','possible']){
        const td=el('td'), i=el(key==='category'?'select':'input');
        if(key==='category'){
          const categories=[...new Set([...baseline.map(b=>b.category),...Object.keys(originalWeights)])].filter(Boolean);
          if(!categories.length)categories.push(r.category||'Assignments');
          if(!categories.includes(r.category)){const placeholder=el('option','Select category');placeholder.value='';placeholder.disabled=true;i.append(placeholder);}
          for(const category of categories){const option=el('option',category);option.value=category;i.append(option);}
        }else i.type=key==='include'?'checkbox':['earned','possible'].includes(key)?'number':'text';
        i.setAttribute('aria-label',key+' for assignment '+(index+1));
        if(i.type==='checkbox')i.checked=r[key];else i.value=r[key];
        if(i.type==='number'){i.min='0';i.step='any';}
        i.addEventListener('input',()=>{r[key]=i.type==='checkbox'?i.checked:i.value;update();});
        if(key==='category')i.addEventListener('change',renderWeights);
        td.append(i);tr.append(td);
      }
      const td=el('td'), b=el('button','×'); b.setAttribute('aria-label','Remove assignment '+(index+1));b.onclick=()=>{rows.splice(index,1);render();};td.append(b);tr.append(td);$('rows').append(tr);
    });renderWeights();update();
  }
  function importRows(){
    const imported=SynergyImport.readGradebook(document);
    if(!imported.rows.length){$('status').textContent='No assignment rows found. Open a class in Assignment View and wait for it to finish loading.';return;}
    importWarnings=imported.warnings;rows=imported.rows.map((r,i)=>({...r,_inlineKey:'import-'+i}));baseline=structuredClone(rows);weights=imported.weights;$('mode').value=imported.mode;
    originalWeights=structuredClone(weights);originalMode=imported.mode;render();
    $('status').textContent=imported.warnings.join(' ');

  }
  $('launch').onclick=()=>{$('panel').hidden=!$('panel').hidden;if(!$('panel').hidden&&!rows.length)importRows();$('launch').setAttribute('aria-expanded',String(!$('panel').hidden));};$('close').onclick=()=>{$('panel').hidden=true;$('launch').setAttribute('aria-expanded','false');$('launch').focus();};
  shadow.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')$('close').click();});
  $('import').onclick=importRows;$('add').onclick=()=>{rows.push({include:true,name:'Hypothetical assignment',category:rows[0]?.category||'Assignments',earned:'',possible:''});render();};
  $('reset').onclick=()=>{rows=structuredClone(baseline);weights=structuredClone(originalWeights);$('mode').value=originalMode;render();};$('mode').onchange=()=>{renderWeights();update();};
  // Place the isolated calculator in StudentVUE's own class content area.
  const theme=el('style');theme.textContent=`
  :host([hidden]){display:none!important}:host{display:block;clear:both;font:14px Arial,sans-serif;color:#333;margin:16px 0}
  #launch{position:static;background:#337ab7;border:1px solid #2e6da4;border-radius:4px;box-shadow:none;font-size:14px;padding:9px 14px;z-index:auto}
  #launch:hover{background:#286090}#class-context{margin-left:12px;color:#555;font-size:13px}
  #panel{position:static;inset:auto;width:100%;max-height:none;overflow:visible;z-index:auto;border:1px solid #ddd;border-radius:4px;box-shadow:none;background:#fff;padding:16px;margin-top:10px}
  header{background:#f5f5f5;border-bottom:1px solid #ddd;margin:-16px -16px 14px;padding:10px 15px}
  h1{font-size:18px;font-weight:600;color:#2b5971}button{border-radius:4px}input,select{border-radius:3px}
  .card{border-radius:4px;background:#fafafa;border-color:#ddd}#result{color:#008b7e;font-size:38px}
  #delta{display:inline-block;margin-left:12px;color:#2b5971}th{background:#f5f5f5;color:#444}td,th{padding:8px 5px}
  td input[type=text]{width:100%;min-width:100px}#rows td:nth-child(2){width:33%}#rows td:nth-child(3){width:24%}
  @media(max-width:600px){#class-context{display:block;margin:8px 0}#panel{padding:12px}header{margin:-12px -12px 12px}td input[type=number]{width:65px}}
  `;shadow.append(theme);
  $('launch').textContent='More options';$('launch').setAttribute('aria-expanded','false');$('launch').setAttribute('aria-controls','panel');
  const drafts=new Map();let activeContext='', timer, sourceSignature='';
  function capture(){return structuredClone({rows,baseline,weights,originalWeights,originalMode,importWarnings,mode:$('mode').value});}
  function restore(d){({rows,baseline,weights,originalWeights,originalMode}=structuredClone(d));importWarnings=d.importWarnings||[];$('mode').value=d.mode;render();}
  function classContext(){
    const labels=[...document.querySelectorAll('main [role="combobox"]')].map(e=>e.value||e.textContent.trim()).filter(Boolean);
    let classID='';
    const link=document.querySelector('#assignment-details a[data-focus]');
    if(link){try{const args=JSON.parse(link.getAttribute('data-focus')).FocusArgs;classID=[args.classID,args.gradePeriodGU,args.markPeriodGU].join('|');}catch{}}
    return {key:[location.search.match(/studentGU=([^&]+)/i)?.[1]||'',...labels,classID].join('|'),label:labels.join(' · ')};
  }
  const rowEditors=new Map(), requestedWeights=new Set();
  const gradeHost=el('div');gradeHost.id='synergy-whatif-grade';
  gradeHost.style.cssText='display:block;flex:0 0 100%;width:100%;margin:12px 0;';
  const gradeShadow=gradeHost.attachShadow({mode:'open'});
  gradeShadow.innerHTML=`<style>:host([hidden]){display:none!important}*{box-sizing:border-box}.preview{font:13px Arial,sans-serif;text-align:center;padding:14px 10px;background:#f0f8f7;border:1px solid #d5e9e5;border-radius:10px;color:#365b55}.label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}.value{font-size:32px;font-weight:600;color:#008577;margin:5px 0}.delta{font-size:12px;color:#42645e;min-height:14px}.note{font-size:11px;line-height:1.4;margin:8px 0;color:#61766f}button{font:12px Arial,sans-serif;color:#326c64;border:0;border-bottom:1px solid #b9d6cf;background:none;padding:4px;cursor:pointer}button:focus-visible{outline:2px solid #008577}</style><div class="preview"><div class="label">What-if grade</div><div class="value" aria-live="polite">—</div><div class="note"></div><button type="button">Reset changes</button></div>`;
  gradeShadow.querySelector('button').onclick=()=>$('reset').click();
  const gradeActions=el('div');gradeActions.style.cssText='display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px';
  gradeActions.append(gradeShadow.querySelector('button'),launchButton);gradeShadow.querySelector('.preview').append(gradeActions);launchButton.removeAttribute('aria-controls');
  const compactTheme=el('style');compactTheme.textContent=`
  :host{margin:0}#launch{background:white;color:#596875;border-color:#d6dce0;font-size:12px;padding:6px 10px;border-radius:6px}#launch:hover{background:#f5f7f8}
  #class-context{font-size:12px;color:#849099}#panel{border-radius:8px;border-color:#e0e5e8}header{background:white}h1{font-size:16px}
  `;shadow.append(compactTheme);
  function rowFor(tr,grid){
    const headers=[...grid.querySelectorAll('[role="columnheader"]')];
    const value=name=>{const h=headers.find(e=>e.textContent.trim()===name);if(!h)return '';return [...tr.children].find(c=>(c.getAttribute('aria-describedby')||'').split(/\s+/).includes(h.id))?.textContent.replace(/\s+/g,' ').trim()||'';};
    const name=value('Assignment'),category=value('Assignment Type')||'Uncategorized';
    // Resolve by original row identity; editing the scenario's name does not detach its inline editor.
    let ordinal=0;
    for(const sibling of grid.querySelectorAll('tr.dx-data-row')){
      if(sibling===tr)break;
      const h=headers.find(e=>e.textContent.trim()==='Assignment');
      const cell=h?[...sibling.children].find(c=>(c.getAttribute('aria-describedby')||'').split(/\s+/).includes(h.id)):null;
      const ch=headers.find(e=>e.textContent.trim()==='Assignment Type');const cc=ch?[...sibling.children].find(c=>(c.getAttribute('aria-describedby')||'').split(/\s+/).includes(ch.id)):null;if(cell?.textContent.replace(/\s+/g,' ').trim()===name&&(cc?.textContent.replace(/\s+/g,' ').trim()||'Uncategorized')===category)ordinal++;
    }
    const matches=baseline.map((r,i)=>({r,i})).filter(x=>x.r.name===name&&x.r.category===category);
    const original=matches[ordinal];
    // Existing imported rows keep their slot unless the advanced editor removes one.
    const target=original?rows.find(r=>r._inlineKey===original.r._inlineKey):null;
    return target||null;
  }
  function syncInlineEditors(){
    gradeShadow.querySelector('.value').textContent=$('result').textContent;
    const note=gradeShadow.querySelector('.note');
    note.textContent=$('error').textContent|| (importWarnings.length?'Check weights and loaded assignments in More options.':'');note.hidden=!note.textContent;
    for(const [wrapper,editor] of rowEditors){
      if(!wrapper.isConnected){rowEditors.delete(wrapper);continue;}
      const r=rowFor(editor.tr,editor.grid);
      editor.earned.disabled=editor.possible.disabled=!r;
      if(!r){editor.note.textContent='Refresh in More options to edit.';continue;}
      if(editor.sr.activeElement!==editor.earned)editor.earned.value=r.earned;
      if(editor.sr.activeElement!==editor.possible)editor.possible.value=r.possible;
      const original=baseline.find(b=>b._inlineKey===r._inlineKey);
      const changed=original&&(String(original.earned)!==String(r.earned)||String(original.possible)!==String(r.possible)||original.include!==r.include);
      editor.box.classList.toggle('changed',Boolean(changed));editor.toggle.classList.toggle('changed',Boolean(changed));editor.toggle.textContent=changed?'What if · '+(r.earned===''?'—':r.earned)+' / '+(r.possible===''?'—':r.possible):'What if';editor.reset.hidden=!changed;editor.reset.parentElement.hidden=!changed;
      editor.note.textContent=!r.include?'Excluded from estimate':'';editor.note.hidden=!editor.note.textContent;
    }
  }
  function attachRowTools(){
    const grid=document.querySelector('#assignment-details .dx-datagrid');if(!grid)return;
    const headers=[...grid.querySelectorAll('[role="columnheader"]')],h=headers.find(e=>e.textContent.trim()==='Points');if(!h)return;
    for(const tr of grid.querySelectorAll('tr.dx-data-row')){
      const cell=[...tr.children].find(e=>(e.getAttribute('aria-describedby')||'').split(/\s+/).includes(h.id));
      if(!cell||cell.querySelector('[data-synergy-row-tools]'))continue;
      const wrapper=el('span');wrapper.setAttribute('data-synergy-row-tools','');wrapper.style.cssText='display:block;white-space:normal;max-width:100%;min-width:0;';
      const sr=wrapper.attachShadow({mode:'open'});
      sr.innerHTML=`<style>*{box-sizing:border-box}.box{font:11px Arial,sans-serif;margin-top:5px;padding:6px;background:#f7f9fa;border:1px solid #e0e6e9;border-radius:7px;display:block;width:155px;max-width:100%;color:#5e6c76}.box:focus-within{border-color:#6bafa4;background:#f3faf8}.box.changed{border-color:#80b9ad;background:#edf8f4}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;gap:8px}.fields{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto;align-items:center;gap:4px;width:100%}input[type=number]{font:13px Arial,sans-serif;border:1px solid #cbd6dc;border-radius:4px;padding:5px 3px;width:100%;min-width:0;max-width:100%;height:30px;appearance:textfield;background:#fff;color:#243d47}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{appearance:none;margin:0}input:focus-visible{outline:2px solid #008577}input[type=checkbox]{margin:0;vertical-align:middle}button{font:11px Arial,sans-serif;border:0;background:none;color:#387c70;cursor:pointer;padding:0}.toggle{font:11px Arial,sans-serif;border:1px solid #dbe4e6;border-radius:5px;background:#f7f9fa;padding:4px 7px;margin-top:5px}.toggle.changed{color:#216b5e;background:#edf8f4;border-color:#80b9ad}button:focus-visible{outline:2px solid #008577}.note{font-size:10px;margin-top:4px;line-height:1.3;max-width:135px}[hidden]{display:none!important}</style><button class="toggle" type="button" aria-expanded="false" aria-controls="score-editor">What if</button><div id="score-editor" class="box" hidden><div class="top"><button data-reset type="button" hidden aria-label="Reset this score">Reset</button></div><div class="fields"><input type="number" min="0" step="any" placeholder="—" aria-label="What-if earned points"><span>/</span><input type="number" min="0" step="any" aria-label="What-if possible points"><button data-close type="button" aria-label="Close score editor" style="font-size:16px;line-height:1;padding:2px">×</button></div><div class="note"></div></div>`;
      const inputs=sr.querySelectorAll('input'),editor={sr,tr,grid,box:sr.querySelector('.box'),earned:inputs[0],possible:inputs[1],note:sr.querySelector('.note'),reset:sr.querySelector('[data-reset]'),toggle:sr.querySelector('.toggle'),close:sr.querySelector('[data-close]')};
      const name=tr.querySelector('a')?.textContent.trim()||'assignment';
      editor.toggle.setAttribute('aria-label','What-if score for '+name);
      editor.toggle.onclick=()=>{editor.box.hidden=false;editor.toggle.hidden=true;editor.toggle.setAttribute('aria-expanded','true');editor.earned.focus();};
      editor.close.onclick=()=>{editor.box.hidden=true;editor.toggle.hidden=false;editor.toggle.setAttribute('aria-expanded','false');editor.toggle.focus();};
      editor.earned.setAttribute('aria-label','What-if earned points for '+name);editor.possible.setAttribute('aria-label','What-if possible points for '+name);
      sr.addEventListener('click',e=>e.stopPropagation());sr.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&e.target.tagName==='INPUT')e.preventDefault();if(e.key==='Escape')editor.close.click();});
      for(const [key,input] of [['earned',editor.earned],['possible',editor.possible]])input.addEventListener('input',()=>{
        const r=rowFor(tr,grid);if(!r)return;r[key]=key==='include'?input.checked:input.value;render();
      });
      editor.reset.onclick=()=>{const r=rowFor(tr,grid),b=r&&baseline.find(b=>b._inlineKey===r._inlineKey);if(b){Object.assign(r,{earned:b.earned,possible:b.possible,include:b.include});editor.earned.value=b.earned;editor.possible.value=b.possible;render();}};
      rowEditors.set(wrapper,editor);cell.append(wrapper);
    }
  }

  function integrate(){
    const anchor=document.getElementById('assignment-details');
    if(!anchor||!anchor.querySelector('.dx-data-row')){host.hidden=true;gradeHost.hidden=true;return;}
    host.hidden=false;
    if(host.parentNode!==anchor.parentNode||host.nextSibling!==anchor)anchor.before(host);
    const context=classContext();
    if(context.key!==activeContext){
      if(activeContext)drafts.set(activeContext,capture());
      activeContext=context.key;
      if(drafts.has(activeContext)){restore(drafts.get(activeContext));$('status').textContent='Restored your what-if changes for this class. Refresh from gradebook to use the latest official scores.';}
      else{importRows();}
      sourceSignature=JSON.stringify(SynergyImport.readGradebook(document));
    }else{
      const next=JSON.stringify(SynergyImport.readGradebook(document));
      if(next!==sourceSignature){sourceSignature=next;const pristine=JSON.stringify(rows)===JSON.stringify(baseline)&&JSON.stringify(weights)===JSON.stringify(originalWeights)&&$('mode').value===originalMode;if(pristine)importRows();else if(!Object.keys(weights).length&&Object.keys(SynergyImport.readGradebook(document).weights).length){const loaded=SynergyImport.readGradebook(document);weights=loaded.weights;originalWeights=structuredClone(weights);originalMode='weighted';$('mode').value='weighted';importWarnings=loaded.warnings;render();}else $('status').textContent='The gradebook view changed. Your what-if edits are preserved. Use Refresh from gradebook to update scores and category weights.';}
    }
    const actual=document.getElementById('current-grade');
    gradeHost.hidden=!actual;
    if(actual && (gradeHost.parentNode!==actual.parentNode||actual.nextSibling!==gradeHost))actual.after(gradeHost);
    attachRowTools();syncInlineEditors();
    if(!Object.keys(weights).length&&!requestedWeights.has(activeContext)){
      const toggle=[...document.querySelectorAll('#ctl00_CategoryWeightsChartSelector .category-graph-icon')].find(e=>e.textContent.trim()==='Grid');
      if(toggle){requestedWeights.add(activeContext);toggle.click();}
    }
  }
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(integrate,250);});
  observer.observe(document.body,{subtree:true,childList:true});
  integrate();

})();

})();
