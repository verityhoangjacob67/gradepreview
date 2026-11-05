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
})(globalThis);
