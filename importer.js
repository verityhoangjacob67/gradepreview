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
})(globalThis);
