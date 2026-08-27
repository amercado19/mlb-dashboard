const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','current.html'),'utf8');
// pull the real helper out of the shipped file so we test the shipped code
const m=html.match(/function isPriceMeasurable\(m\)\{[\s\S]*?\n\}/);
assert(m,'isPriceMeasurable not found in current.html');
eval(m[0]);
const fx=n=>JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',n),'utf8'));
let pass=0,fail=0; const t=(name,cond)=>{try{assert(cond);console.log('  [PASS] '+name);pass++;}catch(e){console.log('  [FAIL] '+name);fail++;}};

t('legacy numeric roi_pct with n_priced=0 -> NOT measurable', isPriceMeasurable(fx('legacy-unpriced.json'))===false);
t('new NOT_MEASURABLE -> NOT measurable', isPriceMeasurable(fx('new-unpriced.json'))===false);
t('measurable market -> measurable', isPriceMeasurable(fx('measurable-market.json'))===true);
t('missing learned block -> NOT measurable', isPriceMeasurable(fx('missing-learned-block.json'))===false);
t('partial legacy (n_priced=0, no roi) -> NOT measurable', isPriceMeasurable(fx('partial-learning-data.json'))===false);
t('missing n_priced does not default measurable', isPriceMeasurable({roi_pct:5.0})===false);
t('MEASURABLE flag but 0 priced still NOT measurable', isPriceMeasurable({measurement_status:'MEASURABLE',n_priced:0})===false);
// LIB_ASSUME must not be runtime code (only the historical comment may remain)
t('no runtime LIB_ASSUME assignment', !/LIB_ASSUME\s*=/.test(html));
t('hit-rate render preserved (libPropSummary present)', /libPropSummary/.test(html));
t('measurement-health card present', /Measurement health/.test(html));
console.log('\n  '+pass+' passed, '+fail+' failed'); process.exit(fail?1:0);
