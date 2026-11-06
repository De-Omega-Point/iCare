/** iCare Local AI: entirely local rules + small trained text-classification model.
 *  No network calls, browser storage or external dependencies. Training text is fictional.
 */
export const SECTION_ORDER = Object.freeze([
  'CLIENT NAME','CLIENT SUPPORT','BEHAVIOUR','MEDICAL','HEALTH',
  'COMMUNITY PARTICIPATION','COMMUNICATION','ACTIVE SUPPORT','GOAL','OBSERVATION'
]);
export const MODEL_VERSION = 'local-naive-bayes-1.0.0';

const TRAINING = [
  ['CLIENT SUPPORT','Participant prepared breakfast independently'],
  ['CLIENT SUPPORT','Participant washed dishes after lunch'],
  ['CLIENT SUPPORT','SW prepared breakfast and cleaned the kitchen'],
  ['CLIENT SUPPORT','Participant showered in the morning'],
  ['CLIENT SUPPORT','Participant brushed their teeth independently'],
  ['CLIENT SUPPORT','Participant completed household chores'],
  ['CLIENT SUPPORT','Participant had lunch at home'],
  ['CLIENT SUPPORT','Participant declined exercises'],
  ['CLIENT SUPPORT','Participant chose not to shower'],
  ['CLIENT SUPPORT','Participant sorted clothes and folded laundry'],
  ['CLIENT SUPPORT','Participant made a sandwich for lunch'],
  ['CLIENT SUPPORT','SW cleaned the bathroom and wiped benches'],
  ['BEHAVIOUR','Participant became distressed and shouted'],
  ['BEHAVIOUR','Participant paced repeatedly and appeared unsettled'],
  ['BEHAVIOUR','Participant hit the table during an escalation'],
  ['BEHAVIOUR','Participant shouted loudly for several minutes'],
  ['BEHAVIOUR','Participant threw a cushion across the room'],
  ['BEHAVIOUR','Participant cried after the change of routine'],
  ['BEHAVIOUR','Participant was visibly agitated'],
  ['BEHAVIOUR','Participant struck the wall with their hand'],
  ['BEHAVIOUR','Participant displayed repeated pacing'],
  ['BEHAVIOUR','Participant raised their voice while upset'],
  ['MEDICAL','SW administered medication as documented'],
  ['MEDICAL','SW checked the medication administration chart'],
  ['MEDICAL','Participant declined prescribed medication'],
  ['MEDICAL','The nurse reviewed the medication plan'],
  ['MEDICAL','SW recorded a missed medication dose'],
  ['MEDICAL','Participant attended a scheduled medical consultation'],
  ['MEDICAL','SW contacted the pharmacist about medication'],
  ['MEDICAL','Participant reported an issue with tablets'],
  ['MEDICAL','SW documented medication administration'],
  ['MEDICAL','The nurse inspected the wound dressing'],
  ['HEALTH','Participant remained home due to flu'],
  ['HEALTH','Participant had a cough and felt unwell'],
  ['HEALTH','Participant reported a headache'],
  ['HEALTH','Participant felt tired throughout the afternoon'],
  ['HEALTH','Participant had a runny nose'],
  ['HEALTH','Participant experienced nausea'],
  ['HEALTH','Participant complained of pain in their knee'],
  ['HEALTH','Participant was unwell and rested at home'],
  ['HEALTH','Participant reported difficulty sleeping'],
  ['HEALTH','Participant stayed home with cold symptoms'],
  ['COMMUNITY PARTICIPATION','Participant attended a day options programme'],
  ['COMMUNITY PARTICIPATION','Participant visited the local library'],
  ['COMMUNITY PARTICIPATION','Participant went shopping at the supermarket'],
  ['COMMUNITY PARTICIPATION','Participant did not attend community programme'],
  ['COMMUNITY PARTICIPATION','Participant went for an outing to the park'],
  ['COMMUNITY PARTICIPATION','Participant participated in a local community event'],
  ['COMMUNITY PARTICIPATION','Participant visited the swimming centre'],
  ['COMMUNITY PARTICIPATION','Participant attended the scheduled group activity'],
  ['COMMUNITY PARTICIPATION','Participant went for a walk in the neighbourhood'],
  ['COMMUNITY PARTICIPATION','Participant travelled to the community centre'],
  ['COMMUNICATION','Participant requested a drink using words'],
  ['COMMUNICATION','Participant used their communication device'],
  ['COMMUNICATION','Participant asked SW for assistance verbally'],
  ['COMMUNICATION','Participant communicated a preference using gestures'],
  ['COMMUNICATION','Participant told SW they wished to rest'],
  ['COMMUNICATION','Participant used sign language'],
  ['COMMUNICATION','Participant spoke with family on the phone'],
  ['COMMUNICATION','Participant responded to verbal questions'],
  ['COMMUNICATION','Participant pointed to the preferred picture'],
  ['COMMUNICATION','Participant expressed a request through their communication board'],
  ['ACTIVE SUPPORT','SW prompted participant to brush their teeth'],
  ['ACTIVE SUPPORT','SW assisted participant with drying dishes'],
  ['ACTIVE SUPPORT','SW encouraged participation in personal care'],
  ['ACTIVE SUPPORT','SW provided verbal prompts for hair brushing'],
  ['ACTIVE SUPPORT','SW guided the participant through meal preparation'],
  ['ACTIVE SUPPORT','SW offered choices during the morning routine'],
  ['ACTIVE SUPPORT','SW supported participant to complete tasks independently'],
  ['ACTIVE SUPPORT','SW provided step by step assistance with laundry'],
  ['ACTIVE SUPPORT','SW reminded participant to wash their face'],
  ['ACTIVE SUPPORT','SW assisted with setting the table'],
  ['GOAL','Participant progressed towards their identified cooking goal'],
  ['GOAL','The documented goal was to practise independent meal preparation'],
  ['GOAL','Participant practised their identified mobility goal'],
  ['GOAL','The participant achieved their documented daily living goal'],
  ['GOAL','Progress towards their agreed goal was recorded'],
  ['GOAL','Participant worked on their stated goal of independent travel'],
  ['GOAL','Participant practised their agreed communication goal'],
  ['GOAL','The support plan goal was reviewed with participant'],
  ['GOAL','Participant completed an activity linked to their stated goal'],
  ['GOAL','Participant continued work on the documented personal goal'],
  ['OBSERVATION','The living room window was found open'],
  ['OBSERVATION','The front door was locked at the end of the shift'],
  ['OBSERVATION','A damaged cupboard handle was observed'],
  ['OBSERVATION','The floor was wet near the kitchen doorway'],
  ['OBSERVATION','A maintenance issue was noticed in the hallway'],
  ['OBSERVATION','The smoke alarm indicator was flashing'],
  ['OBSERVATION','The room temperature was recorded as warm'],
  ['OBSERVATION','An empty container was found on the bench'],
  ['OBSERVATION','The gate was closed when SW arrived'],
  ['OBSERVATION','An equipment fault was noted in the bedroom']
];

function words(text) {
  const tokens = String(text).toLowerCase().match(/[a-z]+(?:'[a-z]+)?|\d+/g) || [];
  const features = [...tokens];
  for (let i = 0; i + 1 < tokens.length; i++) features.push(tokens[i] + '_' + tokens[i+1]);
  return features;
}

export function trainLocalClassifier(samples = TRAINING) {
  const labels = SECTION_ORDER.filter(s => s !== 'CLIENT NAME');
  const counts = new Map(labels.map(s => [s, new Map()]));
  const totals = new Map(labels.map(s => [s, 0]));
  const documents = new Map(labels.map(s => [s, 0]));
  const vocabulary = new Set();
  for (const [label, phrase] of samples) {
    if (!counts.has(label)) throw new Error('Unknown training label');
    documents.set(label, documents.get(label) + 1);
    for (const word of words(phrase)) {
      vocabulary.add(word);
      const slot = counts.get(label);
      slot.set(word, (slot.get(word) || 0) + 1);
      totals.set(label, totals.get(label) + 1);
    }
  }
  const totalDocs = samples.length;
  return {
    kind: 'multinomial-naive-bayes', version: MODEL_VERSION, trainingExamples: samples.length,
    predict(text) {
      const features = words(text);
      const scores = labels.map(label => {
        const prior = (documents.get(label) + 1) / (totalDocs + labels.length);
        let log = Math.log(prior);
        const denominator = totals.get(label) + vocabulary.size;
        for (const feature of features) {
          log += Math.log(((counts.get(label).get(feature) || 0) + 1) / denominator);
        }
        return { label, log };
      }).sort((a,b) => b.log-a.log);
      const max = scores[0].log;
      const normaliser = scores.reduce((s,x)=>s+Math.exp(x.log-max),0);
      return { label:scores[0].label, confidence:Math.exp(scores[0].log-max)/normaliser,
        second:scores[1].label };
    }
  };
}
export const localModel = trainLocalClassifier();

// Explicit evidence-based priority rules. These protect against common unsafe
// classification errors, including turning ordinary refusals into behaviour events.
const RULES = [
  ['MEDICAL', /\b(medication|medicines?|tablets?|doses?|pharmacist|prescri(?:bed|ption)|wound dressing|medication chart)\b/i],
  ['GOAL', /\b(identified goal|agreed goal|documented goal|stated goal|support plan goal|progress towards .{0,25}goal)\b/i],
  ['ACTIVE SUPPORT', /\b(sw|support worker|staff)\s+(prompted|assisted|encouraged|guided|reminded|supported|offered choices|provided (?:verbal|physical|step.by.step) (?:prompts|assistance|support))\b/i],
  ['ACTIVE SUPPORT', /\b(verbal prompts|physical assistance|step.by.step assistance)\b/i],
  ['COMMUNITY PARTICIPATION', /\b(community|day options|day program(?:me)?|day centre|library|outing|shopping|supermarket|neighbourhood|local park|swimming centre|group activity)\b/i],
  ['HEALTH', /\b(flu|cold symptoms|fever|unwell|cough|headache|nausea|runny nose|felt tired|pain|fatigue|sick|rested at home|difficulty sleeping)\b/i],
  ['BEHAVIOUR', /\b(shouted|agitat(?:ed|ion)|distressed|threw|hit the|struck|paced|pacing|escalat(?:ion|ed)|cried|raised (?:his|her|their) voice)\b/i],
  ['COMMUNICATION', /\b(communication (?:device|board)|used sign language|using gestures|verbally (?:asked|requested)|responded to (?:verbal|questions)|spoke with|told (?:sw|staff)|expressed a request)\b/i],
  ['OBSERVATION', /\b(observed|noticed|found|fault|damaged|indicator|window|door|equipment|maintenance|gate)\b/i],
  ['CLIENT SUPPORT', /\b(breakfast|lunch|dinner|dishes|laundry|clothes|shower|hair|teeth|face|household|cleaned|kitchen|meals?|sandwich|exercise|personal care|independently|bathroom)\b/i]
];

export function classifyStatement(text, model = localModel) {
  const sentence = String(text).trim();
  if (!sentence) return {section:'OBSERVATION',method:'empty',confidence:0};
  for (const [section, regex] of RULES) {
    if (regex.test(sentence)) return {section,method:'priority-rule',confidence:1};
  }
  // Plain refusals are choices, never evidence of challenging behaviour alone.
  if (/\b(refused|declined|chose not|did not want)\b/i.test(sentence)) {
    return {section:'CLIENT SUPPORT',method:'choice-safeguard',confidence:1};
  }
  const pred = model.predict(sentence);
  if (pred.confidence < .55) return {section:'OBSERVATION',method:'uncertain-model',confidence:pred.confidence,
    suggestion:pred.label};
  return {section:pred.label,method:'local-model',confidence:pred.confidence};
}

function canonicalText(text) {
  return String(text).replace(/^\s*(?:[-•*]\s*|\d+[.)]\s*)/,'').trim()
    .replace(/\bbrekkie\b/gi,'breakfast')
    .replace(/\bsupport worker\b/gi,'SW')
    .replace(/\bSW helped\b/gi,'SW assisted')
    .replace(/\s+/g,' ').replace(/\s+([,.!?])/g,'$1');
}
export function formatSentence(text) {
  let s=canonicalText(text);
  if (!s) return '';
  s=s[0].toUpperCase()+s.slice(1);
  return /[.!?]$/.test(s)?s:s+'.';
}
export function splitStatements(input) {
  const text=String(input||'');
  const segments=[];
  // Keep original source spans to compare generated statements against input.
  const lines=/[^\r\n]+/g;
  let match;
  while ((match=lines.exec(text))) {
    const raw=match[0];
    const clauses=[...raw.matchAll(/[^.!?;]+(?:[.!?;]+|$)/g)];
    for (const clause of clauses) {
      const fragment=clause[0];
      const trimmed=fragment.trim();
      if (!canonicalText(trimmed)) continue;
      segments.push({source:trimmed,start:match.index+clause.index,
        end:match.index+clause.index+fragment.length});
    }
  }
  return segments;
}
function normalized(s) { return canonicalText(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function tokenizeSet(s) {return new Set(normalized(s).split(' ').filter(Boolean));}
export function validateBullet(bullet) {
  if (!bullet.source) return {level:'warning',reason:'No original source linked; manually verify this addition.'};
  if (bullet.edited) {
    const original=tokenizeSet(bullet.source), revised=tokenizeSet(bullet.text);
    const preserved=[...revised].filter(x=>original.has(x)).length/Math.max(revised.size,1);
    const negation=/\b(no|not|never|did not|declined|refused|without)\b/i;
    if (negation.test(bullet.source)!==negation.test(bullet.text)) {
      return {level:'warning',reason:'Choice/negation may have changed; compare with the source.'};
    }
    if (preserved<.7) return {level:'warning',reason:'Edited statement differs from source; verify every fact.'};
    return {level:'review',reason:'Edited after generation; recheck original wording.'};
  }
  return {level:'linked',reason:'Derived from the linked source statement; human review still required.'};
}
export function generateNotes({participant='',raw=''}={}) {
  if (raw.length>14000) throw new Error('Input exceeds 14,000 characters. Split the shift into shorter entries.');
  const sections=Object.fromEntries(SECTION_ORDER.map(x=>[x,[]]));
  const warnings=[];
  const seen=new Set();
  const participantName=String(participant).trim();
  if (participantName) sections['CLIENT NAME'].push({text:formatSentence(participantName),source:participantName,start:null,end:null,edited:false});
  else warnings.push('No participant name supplied. Confirm the correct record before pasting.');
  let classificationMethods={};
  for(const item of splitStatements(raw)) {
    const output=formatSentence(item.source), key=normalized(output);
    if(seen.has(key)) {warnings.push('Repeated statement was omitted: '+output);continue;}
    seen.add(key);
    const decision=classifyStatement(item.source);
    classificationMethods[decision.method]=(classificationMethods[decision.method]||0)+1;
    sections[decision.section].push({...item,text:output,edited:false,classification:decision});
    if(decision.method==='uncertain-model') warnings.push('Uncertain heading for: '+output+' Review classification.');
    if(/\b(?:administered|missed)\b.{0,30}\bmedication\b|\bmedication\b.{0,30}\b(?:administered|missed)\b/i.test(item.source)) {
      warnings.push('Medication-related statement: check the authorised medication documentation process.');
    }
    if(/\b(?:incident|injur(?:y|ies)|fall|police|ambulance)\b/i.test(item.source)) {
      warnings.push('Potential incident-related statement: check the provider reporting procedure separately.');
    }
  }
  if(!raw.trim()) warnings.push('No shift observations supplied.');
  return {sections,warnings:[...new Set(warnings)],classificationMethods,modelVersion:MODEL_VERSION};
}
export function exportSection(section,bullets,prefix='•') {
  return section+'\n'+(bullets?.length?bullets.map(b=>prefix+' '+formatSentence(b.text)).join('\n'):prefix+' Nil.');
}
export function exportAll(sections,prefix='•') {
  return SECTION_ORDER.map(section=>exportSection(section,sections[section],prefix)).join('\n\n');
}
