import {generateClarityDraft,formatClarityDraft} from './clarity-engine.mjs';
// Dedicated module worker. No fetch, persistence or remote endpoints.
self.onmessage = (event) => {
  const {id,raw}=event.data || {};
  if(typeof id!=='number' || typeof raw!=='string') return;
  if(raw.length>14000){self.postMessage({id,ok:false,error:'Input exceeds 14,000 characters.'});return;}
  try {
    const draft=generateClarityDraft(raw);
    self.postMessage({id,ok:true,output:formatClarityDraft(draft),flags:draft.flags,traces:draft.traces,name:draft.name});
  } catch {
    self.postMessage({id,ok:false,error:'Unable to process the note. Review the input.'});
  }
};
