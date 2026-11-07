/**
 * iCare Clarity Engine 2.0 - experimental, deterministic safety baseline.
 * NOT a generative model. No network calls or storage.
 * The source text is retained for human comparison.
 */
import { SECTION_ORDER, classifyStatement, formatSentence } from '../engine.mjs';
const HEADINGS = new Set(SECTION_ORDER);
const NIL = /^(?:nil|none|n\/a|not applicable)\.?$/i;
const clean = s => String(s).trim().replace(/^[•*–-]\s*/,'').trim();
const norm = s => clean(s).toLocaleLowerCase('en-AU').replace(/[.!?]+$/,'').replace(/\s+/g,' ');
function headingOf(s) { const v=clean(s).replace(/[:.]\s*$/,'').toUpperCase(); return HEADINGS.has(v)?v:null; }
export function extract(raw) {
  const lines=String(raw).split(/\r?\n/), records=[];
  let name='', currentHeading=null, first=true;
  for(const original of lines) {
    const line=clean(original);
    if(!line) continue;
    const heading=headingOf(line);
    if(heading) {if(!/^\s*[•*–-]/.test(original)) currentHeading=heading;first=false;continue;}
    if(NIL.test(line)) continue;
    if(currentHeading==='CLIENT NAME') {
      if(!name) name=line.replace(/[.]$/,'');
      continue;
    }
    const labelled=line.match(/^(?:client name|name|participant)\s*:\s*(.*)$/i);
    if(first || (!name && labelled)) {
      name=(labelled?labelled[1]:line).replace(/[.]$/,'').trim();
      first=false;continue;
    }
    first=false;
    if(norm(line)===norm(name)) continue;
    records.push({source:line,sourceHeading:currentHeading});
  }
  return {name,records};
}
const CATEGORY_HINTS=[
 ['MEDICAL',/\b(?:medication|medications|medicines?|tablets?|dose|foot therapy|wound|pharmacist|medical appointment)\b/i],
 ['ACTIVE SUPPORT',/\b(?:sw|support worker|staff|carer)\s+(?:support(?:ed|s)?|assist(?:ed|s)?|prompt(?:ed|s)?|help(?:ed|s)?|guid(?:ed|es)?|encourag(?:ed|es)?)\b/i],
 ['COMMUNITY PARTICIPATION',/\b(?:bowling|club strike|day options|community event|library|supermarket|outing|shopping)\b/i],
 ['CLIENT SUPPORT',/\b(?:shower(?:ed)?|dishes|dinner|breakfast|lunch|laundry|washed|cleaned|personal care|exercise)\b/i],
 ['OBSERVATION',/\b(?:damaged|broken|faulty|hazard|unsafe|equipment fault|maintenance issue)\b/i]
];
export function classifyFact(source) {
  for(const [section,re] of CATEGORY_HINTS) if(re.test(source)) return {section,reason:'explicit evidence'};
  const predicted=classifyStatement(source);
  if(predicted.method==='uncertain-model' || predicted.section==='OBSERVATION')
    return {section:'CLIENT SUPPORT',reason:'uncertain; review category'};
  return {section:predicted.section,reason:predicted.method==='local-model'?'model suggestion; review category':'rule match'};
}
export function generateClarityDraft(raw) {
  const {name,records}=extract(raw);
  if(!name) return {name:'',sections:null,flags:['Client name missing.'],traces:[]};
  const sections=Object.fromEntries(SECTION_ORDER.map(x=>[x,[]]));
  sections['CLIENT NAME'].push(name);
  const seen=new Set(),flags=[],traces=[];
  for(const record of records) {
    const key=norm(record.source);
    if(HEADINGS.has(key.toUpperCase()) || NIL.test(record.source) || key===norm(name) || seen.has(key)) continue;
    seen.add(key);
    const classification=classifyFact(record.source);
    // Conservative: punctuation/capitalisation only. No unsupported paraphrase.
    const rewritten=formatSentence(record.source);
    sections[classification.section].push(rewritten);
    traces.push({source:record.source,output:rewritten,category:classification.section,reason:classification.reason});
    if(classification.reason.includes('review')) flags.push('Review category for: '+record.source);
    if(/\b(?:medication|medications|medicine|dose)\b/i.test(record.source)) flags.push('Check medication documentation separately.');
    if(/\b(?:fell|fall|slipped|tripped|injury|incident)\b/i.test(record.source)) flags.push('Check incident reporting requirements separately.');
  }
  return {name,sections,flags:[...new Set(flags)],traces};
}
export function formatClarityDraft(draft) {
  if(!draft.sections)return '';
  return SECTION_ORDER.map(k=>k+'\n'+(draft.sections[k].length?draft.sections[k].map(s=>'• '+s).join('\n'):'• Nil.')).join('\n\n');
}
