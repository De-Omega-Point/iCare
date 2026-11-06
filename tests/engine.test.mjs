import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTION_ORDER,generateNotes,exportAll,exportSection,validateBullet,splitStatements,classifyStatement,localModel,trainLocalClassifier,formatSentence} from '../engine.mjs';

test('fixed ten headings and approved order',()=>{
  assert.deepEqual(SECTION_ORDER,['CLIENT NAME','CLIENT SUPPORT','BEHAVIOUR','MEDICAL','HEALTH','COMMUNITY PARTICIPATION','COMMUNICATION','ACTIVE SUPPORT','GOAL','OBSERVATION']);
  const r=generateNotes({participant:'Fictional Avery',raw:'Avery prepared lunch.'});
  const note=exportAll(r.sections);
  assert.deepEqual(note.split('\n').filter(x=>SECTION_ORDER.includes(x)),SECTION_ORDER);
  assert.equal(note.split(/\n/).filter(x=>x.startsWith('•')).length,10);
  assert.ok(note.includes('BEHAVIOUR\n• Nil.'));
});
test('refusals remain explicit and are not automatically behaviour',()=>{
  const r=generateNotes({raw:'Avery declined exercises. Avery chose not to shower.'});
  assert.equal(r.sections.BEHAVIOUR.length,0);
  assert.equal(r.sections['CLIENT SUPPORT'].length,2);
  assert.match(exportAll(r.sections),/declined exercises/);
  assert.match(exportAll(r.sections),/chose not to shower/);
});
test('active support before GOAL and has source evidence',()=>{
  const r=generateNotes({raw:'SW prompted Avery to brush their teeth. Avery made lunch.'});
  assert.equal(r.sections['ACTIVE SUPPORT'].length,1);
  assert.equal(r.sections['ACTIVE SUPPORT'][0].source,'SW prompted Avery to brush their teeth.');
  assert.ok(exportAll(r.sections).indexOf('ACTIVE SUPPORT') < exportAll(r.sections).indexOf('GOAL'));
});
test('medication is not invented and separate alert exists',()=>{
  const r=generateNotes({raw:'SW administered medication.'});
  assert.equal(r.sections.MEDICAL.length,1);
  assert.ok(r.warnings.some(x=>/medication/i.test(x)));
  assert.ok(!exportAll(r.sections).toLowerCase().includes('dose of'));
});
test('duplicate statements suppressed and flagged',()=>{
  const r=generateNotes({raw:'Avery washed dishes. Avery washed dishes.'});
  assert.equal(r.sections['CLIENT SUPPORT'].length,1);
  assert.ok(r.warnings.some(x=>/Repeated/.test(x)));
});
test('source provenance points to original slice',()=>{
  const raw='Avery prepared lunch.\nSW prompted Avery to wash the bench.';
  const r=generateNotes({raw});
  for(const section of SECTION_ORDER)for(const b of r.sections[section]){
    if(b.start!==null)assert.equal(raw.slice(b.start,b.end).trim(),b.source);
  }
});
test('manual additions are flagged, edits are reviewed',()=>{
  assert.equal(validateBullet({text:'New medicine was administered.',source:null,edited:true}).level,'warning');
  assert.equal(validateBullet({text:'Avery participated in exercises.',source:'Avery did not participate in exercises.',edited:true}).level,'warning');
  assert.equal(validateBullet({text:'Avery prepared lunch.',source:'Avery prepared lunch.',edited:true}).level,'review');
});
test('rules-only categorisation protects user choice',()=>{
  assert.equal(classifyStatement('Avery refused to participate in exercises.').section,'CLIENT SUPPORT');
  assert.equal(classifyStatement('Avery declined their medication.').section,'MEDICAL');
  assert.equal(classifyStatement('Avery declined the day options programme.').section,'COMMUNITY PARTICIPATION');
});
test('model is actually trained locally from synthetic examples',()=>{
  assert.equal(localModel.kind,'multinomial-naive-bayes');
  assert.ok(localModel.trainingExamples >= 90);
  const model=trainLocalClassifier([['HEALTH','person felt unwell'],['CLIENT SUPPORT','person made breakfast']]);
  assert.equal(model.predict('person felt unwell').label,'HEALTH');
});
test('format cannot produce extra bullet lines from manual text',()=>{
  assert.equal(formatSentence('SW prompted Avery to wash hands\nUNSUPPORTED HEADING'),
    'SW prompted Avery to wash hands UNSUPPORTED HEADING.');
  assert.equal(exportSection('HEALTH',[],'-'),'HEALTH\n- Nil.');
});
test('empty input, long input errors and no participant name',()=>{
  const r=generateNotes({raw:''});
  assert.ok(r.warnings.some(x=>/No shift observations/.test(x)));
  assert.throws(()=>generateNotes({raw:'x'.repeat(14001)}),/14,000/);
  assert.ok(r.warnings.some(x=>/No participant name/.test(x)));
});
