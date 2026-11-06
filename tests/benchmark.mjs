// Held-out synthetic examples; not used for model training. Human-labelled for this prototype.
import {performance} from 'node:perf_hooks';
import {classifyStatement,generateNotes,exportAll,SECTION_ORDER,localModel} from '../engine.mjs';
const CASES=[
['CLIENT SUPPORT','Avery prepared a sandwich without assistance.'],
['CLIENT SUPPORT','Taylor washed the breakfast dishes.'],
['CLIENT SUPPORT','Riley chose not to complete the warm-up exercises.'],
['CLIENT SUPPORT','Casey refused the offered morning shower.'],
['CLIENT SUPPORT','Avery folded laundry after lunch.'],
['CLIENT SUPPORT','Taylor completed the kitchen cleaning.'],
['CLIENT SUPPORT','Riley brushed their teeth independently.'],
['CLIENT SUPPORT','Casey made the bed before lunch.'],
['BEHAVIOUR','Avery shouted and hit the table during an escalation.'],
['BEHAVIOUR','Taylor appeared visibly agitated after the schedule change.'],
['BEHAVIOUR','Casey cried when the game ended.'],
['BEHAVIOUR','Riley paced the hallway repeatedly.'],
['BEHAVIOUR','Avery threw a pillow across the room.'],
['MEDICAL','SW administered the scheduled medication.'],
['MEDICAL','Taylor declined their prescribed tablets.'],
['MEDICAL','The nurse updated the medication chart.'],
['MEDICAL','SW checked the medicine dose information.'],
['MEDICAL','The pharmacist called about a prescription.'],
['HEALTH','Casey had a headache in the afternoon.'],
['HEALTH','Riley stayed home with cold symptoms.'],
['HEALTH','Avery reported nausea before lunch.'],
['HEALTH','Taylor felt tired and rested at home.'],
['HEALTH','Casey had a cough and a runny nose.'],
['HEALTH','Avery described pain in their shoulder.'],
['COMMUNITY PARTICIPATION','Casey visited the community garden.'],
['COMMUNITY PARTICIPATION','Riley did not attend the day options programme.'],
['COMMUNITY PARTICIPATION','Taylor went shopping at the supermarket.'],
['COMMUNITY PARTICIPATION','Avery attended a group activity at the centre.'],
['COMMUNITY PARTICIPATION','Casey visited the local library.'],
['COMMUNITY PARTICIPATION','Riley took part in a community outing.'],
['COMMUNICATION','Avery used a communication device to ask for a drink.'],
['COMMUNICATION','Taylor expressed a request using gestures.'],
['COMMUNICATION','Casey spoke with family on the phone.'],
['COMMUNICATION','Riley responded to verbal questions.'],
['COMMUNICATION','Avery used sign language to describe their preference.'],
['ACTIVE SUPPORT','SW prompted Casey to wash hands.'],
['ACTIVE SUPPORT','SW assisted Taylor with drying dishes.'],
['ACTIVE SUPPORT','SW guided Riley through meal preparation.'],
['ACTIVE SUPPORT','SW offered choices during the morning routine.'],
['ACTIVE SUPPORT','SW reminded Avery to comb their hair.'],
['ACTIVE SUPPORT','SW encouraged Taylor to complete their hygiene routine.'],
['GOAL','Casey practised an identified goal of independent meal preparation.'],
['GOAL','Riley made progress towards their agreed communication goal.'],
['GOAL','Avery continued working on their documented travel goal.'],
['GOAL','Taylor reviewed an identified goal with staff.'],
['OBSERVATION','The front gate was found open at shift commencement.'],
['OBSERVATION','The bathroom door handle was damaged.'],
['OBSERVATION','An equipment fault was noticed in the living area.'],
['OBSERVATION','A maintenance issue was reported for the hallway.'],
['OBSERVATION','The smoke alarm indicator was flashing.'],
['OBSERVATION','The living room window was open when SW arrived.'],
];
const t0=performance.now();
const results=CASES.map(([expected,raw])=>({expected,raw,actual:classifyStatement(raw)}));
const elapsed=performance.now()-t0;
const correct=results.filter(x=>x.expected===x.actual.section).length;
const misses=results.filter(x=>x.expected!==x.actual.section);
const example='Avery prepared a sandwich. SW prompted Avery to clean the bench. Avery visited the local library.';
const startGenerate=performance.now();
for(let i=0;i<500;i++)generateNotes({participant:'Avery (fictional)',raw:example});
const averageGenerationMs=(performance.now()-startGenerate)/500;
const notes=generateNotes({participant:'Avery (fictional)',raw:example});
const exported=exportAll(notes.sections);
const headings=exported.split('\n').filter(line=>SECTION_ORDER.includes(line));
const dotpoints=exported.split('\n').filter(line=>line.startsWith('• '));
const sourceMismatch=SECTION_ORDER.flatMap(s=>notes.sections[s]).filter(b=>b.start!==null&&!example.slice(b.start,b.end).includes(b.source));
console.log(JSON.stringify({model:localModel.version,modelType:localModel.kind,trainingCases:localModel.trainingExamples,
  heldOutCases:CASES.length,classificationCorrect:correct,classificationAccuracyPercent:Number((100*correct/CASES.length).toFixed(1)),
  classificationMs:Number(elapsed.toFixed(2)),averageGenerationMs:Number(averageGenerationMs.toFixed(3)),
  headingOrderPass:JSON.stringify(headings)===JSON.stringify(SECTION_ORDER),
  allNoteLinesBulleted:dotpoints.length>=10,sourceSpanMismatches:sourceMismatch.length,
  misses:misses.map(x=>({expected:x.expected,got:x.actual.section,text:x.raw}))},null,2));
if(correct/CASES.length<.95)process.exitCode=1;
