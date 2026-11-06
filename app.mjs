import {SECTION_ORDER,generateNotes,validateBullet,exportSection,exportAll,MODEL_VERSION} from './engine.mjs';

const $=id=>document.getElementById(id);
const form=$('entryForm'), participant=$('participant'), source=$('sourceText'), shiftDate=$('shiftDate');
const results=$('results'), empty=$('emptyState'), reviewPanel=$('reviewPanel');
const reviewConfirm=$('reviewConfirm'), copyAll=$('copyAll'), bulletStyle=$('bulletStyle');
let current=null, toastTimer=null;
const MAX_INPUT=14000;

function el(tag,cls,text) {
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text!==undefined)element.textContent=text;
  return element;
}
function toast(message){
  const node=$('toast');node.textContent=message;node.classList.add('visible');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>node.classList.remove('visible'),3200);
}
function updateCount(){
  $('charCount').textContent=source.value.length.toLocaleString('en-AU')+' / '+MAX_INPUT.toLocaleString('en-AU');
}
function updateNetwork(){
  const node=$('networkStatus');
  node.textContent=navigator.onLine?'ONLINE · NO UPLOADS':'OFFLINE';
  node.classList.toggle('tag-success',!navigator.onLine);
}
function invalidateReview(){
  reviewConfirm.checked=false;
  copyAll.disabled=true;
  $('reviewStatus').textContent='REVIEW REQUIRED';
  $('reviewStatus').className='tag tag-review';
  results.querySelectorAll('.section-copy').forEach(b=>b.disabled=true);
}
function updateReview(){
  const passed=Boolean(current&&reviewConfirm.checked);
  copyAll.disabled=!passed;
  results.querySelectorAll('.section-copy').forEach(b=>b.disabled=!passed);
  $('reviewStatus').textContent=passed?'HUMAN REVIEW CONFIRMED':'REVIEW REQUIRED';
  $('reviewStatus').className=passed?'tag tag-success':'tag tag-review';
}
function makeBullet(bullet,section) {
  const row=el('div','bullet-row');
  row.append(el('span','bullet-char',bulletStyle.value));
  const body=el('div','bullet-body');
  const input=el('textarea');
  input.setAttribute('rows','2');input.setAttribute('aria-label',section+' note text');
  input.setAttribute('spellcheck','false');input.setAttribute('autocomplete','off');
  input.value=bullet.text;
  input.addEventListener('input',()=>{
    bullet.text=input.value;bullet.edited=true;invalidateReview();
    const status=validateBullet(bullet);
    sourceLine.textContent=bullet.source?'Source: '+bullet.source+' · '+status.reason:status.reason;
    sourceLine.classList.toggle('warning',status.level==='warning');
    showWarnings();
  });
  body.append(input);
  const status=validateBullet(bullet);
  const sourceLine=el('p','bullet-source'+(status.level==='warning'?' warning':''),
    bullet.source?'Source: '+bullet.source+' · '+status.reason:status.reason);
  body.append(sourceLine);
  const remove=el('button','remove-link','Remove statement');
  remove.type='button';
  remove.addEventListener('click',()=>{
    current.sections[section]=current.sections[section].filter(x=>x!==bullet);
    current.warnings.push('A statement was manually removed; verify no material facts were omitted.');
    invalidateReview();render();
  });
  body.append(remove);row.append(body);
  return row;
}
function render(){
  results.replaceChildren();
  if(!current) {results.hidden=true;empty.hidden=false;reviewPanel.hidden=true;return;}
  results.hidden=false;empty.hidden=true;reviewPanel.hidden=false;
  SECTION_ORDER.forEach((section,i)=>{
    const box=el('section','section-card');
    box.setAttribute('aria-labelledby','section-'+i);
    const head=el('div','section-head');
    const title=el('h3','section-title',String(i+1).padStart(2,'0')+'  '+section);title.id='section-'+i;
    const actions=el('div','section-actions');
    const add=el('button','mini-btn','+ Add');add.type='button';
    add.setAttribute('aria-label','Add manual statement to '+section);
    add.addEventListener('click',()=>{
      current.sections[section].push({text:'',source:null,edited:true});
      invalidateReview();render();showWarnings();
      box.scrollIntoView({block:'nearest'});
    });
    const copy=el('button','mini-btn section-copy','Copy section');copy.type='button';copy.disabled=!reviewConfirm.checked;
    copy.addEventListener('click',()=>copyText(exportSection(section,current.sections[section],bulletStyle.value)));
    actions.append(add,copy);head.append(title,actions);box.append(head);
    const notes=current.sections[section];
    if(!notes.length)box.append(el('p','nil',bulletStyle.value+' Nil.'));
    else {const list=el('div','bullets');notes.forEach(b=>list.append(makeBullet(b,section)));box.append(list);}
    results.append(box);
  });
  showWarnings();
}
function showWarnings(){
  const root=$('warnings');root.replaceChildren();
  if(!current)return;
  const messages=[...current.warnings];
  if(shiftDate.value)messages.push('Shift date is for review only. Verify the date when pasting into the main iCare record.');
  let emptyEdited=0, unlinked=0, changed=0;
  for(const section of SECTION_ORDER){for(const bullet of current.sections[section]){
    if(!bullet.text.trim())emptyEdited++;
    const status=validateBullet(bullet);
    if(status.level==='warning')unlinked++;
    if(status.level==='review')changed++;
  }}
  if(emptyEdited)messages.push(emptyEdited+' blank manual statement(s): remove or complete before copying.');
  if(unlinked)messages.push(unlinked+' statement(s) need an explicit source check.');
  if(changed)messages.push(changed+' edited statement(s) need rechecking against the source.');
  if(!messages.length)messages.push('All generated statements link to entered source text. Human verification is still essential.');
  for(const message of messages.slice(0,14)){
    root.append(el('div','warning-item'+(messages.length===1&&!current.warnings.length?' ok':''),message));
  }
  if(messages.length>14)root.append(el('div','warning-item',`${messages.length-14} additional review notices. Please inspect the original input.`));
  const blocking=emptyEdited>0;
  const mayCopy=reviewConfirm.checked&&!blocking;
  copyAll.disabled=!mayCopy;
  results.querySelectorAll('.section-copy').forEach(b=>b.disabled=!mayCopy);
  if(blocking)$('reviewStatus').textContent='COMPLETE BLANK BULLETS';
}
async function copyText(text){
  if(!current||!reviewConfirm.checked) {toast('Confirm human review before copying.');return;}
  if(SECTION_ORDER.some(section=>current.sections[section].some(b=>!b.text.trim()))){
    toast('Complete or remove blank statements before copying.');return;
  }
  try {
    if(!navigator.clipboard?.writeText) throw new Error('Secure clipboard unavailable');
    await navigator.clipboard.writeText(text);
    toast('Copied. Paste only into your authorised iCare record.');
  } catch {
    toast('Clipboard blocked. Use a secure HTTPS or localhost session and check browser permissions.');
  }
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!source.value.trim()) {toast('Enter at least one observation to generate a note.');source.focus();return;}
  try{
    current=generateNotes({participant:participant.value,raw:source.value});
    invalidateReview();render();
    reviewPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
    toast('Structured note generated locally. Check every statement.');
  }catch{toast('Could not format this input. Check its length and try again.');}
});
reviewConfirm.addEventListener('change',()=>{updateReview();showWarnings();});
source.addEventListener('input',()=>{updateCount();if(current){current=null;invalidateReview();render();}});
participant.addEventListener('input',()=>{if(current){current=null;invalidateReview();render();}});
shiftDate.addEventListener('change',()=>{if(current){invalidateReview();showWarnings();}});
bulletStyle.addEventListener('change',()=>{if(current){invalidateReview();render();}});
copyAll.addEventListener('click',()=>copyText(exportAll(current.sections,bulletStyle.value)));
function clearSession(){
  current=null;participant.value='';source.value='';shiftDate.value='';reviewConfirm.checked=false;
  updateCount();invalidateReview();render();source.focus();toast('Session cleared from the app. The device clipboard is unaffected.');
}
$('clearAll').addEventListener('click',()=>{
  if(window.confirm('Clear all notes from this app session? This cannot be undone.'))clearSession();
});
$('exampleBtn').addEventListener('click',()=>{
  if(source.value.trim()&&!window.confirm('Replace your current input with a fictional example?'))return;
  participant.value='Avery (fictional)';
  source.value='Avery prepared lunch independently.\nAvery chose not to join a board game.\nSW prompted Avery to clean the table.\nAvery visited the community library.\nAvery used gestures to request a drink.';
  shiftDate.value='';current=null;reviewConfirm.checked=false;invalidateReview();updateCount();render();
  toast('Fictional example inserted. Generate when ready.');
});
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);
updateNetwork();updateCount();
$('engineStatus').title='Naïve Bayes classifier trained from fictional examples + safety rules; no generative LLM or cloud inference';
$('engineStatus').setAttribute('aria-label','Local classifier ready, '+MODEL_VERSION);
// Register a service worker only on a secure origin. It caches fixed public app assets, never notes.
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))){
  navigator.serviceWorker.register('./sw.js').catch(()=>{toast('Offline install unavailable. The app can still work on this open page.');});
}
