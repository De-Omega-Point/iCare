import { SECTION_ORDER, generateNotes, validateBullet, exportSection, exportAll } from './engine.mjs';

/** Private, single-session chat-like UI. Notes are never persisted or sent over the network. */
const $ = id => document.getElementById(id);
const stage = $('conversationStage');
const source = $('sourceText');
const form = $('entryForm');
const send = $('generateBtn');
const body = $('noteBody');
const approve = $('reviewConfirm');
const copy = $('copyAllBtn');
const accuracy = $('accuracyDetails');
let current = null;
let editing = false;
let toastTimer = null;

const example = `Name: Avery (fictional)\nAvery prepared lunch independently.\nAvery declined to join the board game.\nSW prompted Avery to clean the table.\nAvery visited the community library.`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function notify(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.add('visible');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3500);
}
function refreshSend() {
  send.disabled = !source.value.trim();
  source.style.height = 'auto';
  source.style.height = Math.min(Math.max(source.scrollHeight, 42), 180) + 'px';
}
function updateNetwork() {
  $('connectionStatus').textContent = navigator.onLine ? 'Local' : 'Offline';
}
function parseInput(text) {
  // Only explicit labels become the name, to avoid misidentifying an observation.
  const lines = text.replace(/\r\n?/g,'\n').split('\n');
  const first = lines.findIndex(line => line.trim().length > 0);
  let participant = '';
  if (first >= 0) {
    const match = lines[first].match(/^\s*(?:CLIENT NAME|NAME|PARTICIPANT)\s*:\s*(.{1,120})\s*$/i);
    if (match) {
      participant = match[1].trim();
      lines.splice(first,1);
    }
  }
  return { participant, raw: lines.join('\n').trim() };
}
function reviewValid() {
  return Boolean(current && !editing && approve.checked && SECTION_ORDER.every(section =>
    current.sections[section].every(point => point.text.trim().length > 0)));
}
function invalidate() {
  approve.checked = false;
  updateApproval();
}
function updateApproval() {
  copy.disabled = !reviewValid();
  body.querySelectorAll('.section-copy').forEach(button => { button.disabled = !reviewValid(); });
  $('reviewHint').textContent = reviewValid()
    ? 'Ready to copy. Paste into your authorised system, then clear this session.'
    : 'Review required before copying.';
}
function allPoints() {
  return SECTION_ORDER.flatMap(section => current.sections[section].map(point => ({ section, point })));
}
function updateAccuracy() {
  if (!current) return;
  const points = allPoints();
  const issues = [...current.warnings];
  const changed = points.filter(({ point }) => validateBullet(point).level === 'review').length;
  const flagged = points.filter(({ point }) => validateBullet(point).level === 'warning').length;
  const blanks = points.filter(({ point }) => !point.text.trim()).length;
  if (changed) issues.push(`${changed} edited statement(s) need comparison with your source.`);
  if (flagged) issues.push(`${flagged} statement(s) require an explicit source check.`);
  if (blanks) issues.push(`${blanks} blank statement(s) must be completed or removed before copying.`);
  $('accuracyTitle').textContent = issues.length
    ? `Accuracy review · ${issues.length} notice${issues.length === 1 ? '' : 's'}`
    : `Accuracy review · ${points.length} source-linked points`;
  const container = $('accuracyItems');
  container.replaceChildren();
  const lead = element('p', '', 'Check each bullet against what happened. Source links are not proof that an event occurred.');
  container.append(lead);
  issues.forEach(message => container.append(element('p','caution','• '+message)));
  points.forEach(({ section, point }) => {
    const status = validateBullet(point);
    const src = point.source ? `Source: ${point.source}` : 'Manually added point: no linked source';
    container.append(element('p','trace',`${section} · ${src}\nReview: ${status.reason}`));
  });
  updateApproval();
}
function makePoint(section, point) {
  const item = element('li', 'note-point');
  item.append(element('span','point-dot','•'));
  const text = element('span','point-text',point.text);
  text.setAttribute('role','textbox');
  text.setAttribute('aria-label',`${section} dot point`);
  text.setAttribute('aria-multiline','false');
  text.setAttribute('contenteditable',editing?'true':'false');
  text.setAttribute('spellcheck','false');
  if (editing) {
    text.addEventListener('beforeinput',event=>{
      if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') event.preventDefault();
    });
    text.addEventListener('paste',event=>{
      event.preventDefault();
      const plain = (event.clipboardData?.getData('text/plain') || '').replace(/\s*\r?\n\s*/g,' ');
      document.execCommand('insertText',false,plain);
    });
    text.addEventListener('input',()=>{
      point.text = text.textContent.replace(/[\r\n]+/g,' ').trim();
      point.edited = true;
      invalidate();
      updateAccuracy();
    });
  }
  item.append(text);
  if (editing) {
    const remove = element('button','remove-point','Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label',`Remove point from ${section}`);
    remove.addEventListener('click',()=>{
      current.sections[section] = current.sections[section].filter(p => p !== point);
      current.warnings.push('A point was manually removed; check for missing information.');
      invalidate();renderDraft();
    });
    item.append(remove);
  }
  return item;
}
function renderDraft() {
  if (!current) return;
  body.replaceChildren();
  body.classList.toggle('editing',editing);
  SECTION_ORDER.forEach(section=>{
    const block = element('section','note-section');
    const heading = element('div','section-heading-row');
    heading.append(element('h3','',section));
    const copySection = element('button','section-copy','Copy');
    copySection.type = 'button';
    copySection.setAttribute('aria-label',`Copy ${section} section`);
    copySection.disabled = !reviewValid();
    copySection.addEventListener('click',()=>copyText(exportSection(section,current.sections[section])));
    heading.append(copySection);
    block.append(heading);
    const points = current.sections[section];
    if (points.length) {
      const list = element('ul','note-list');
      points.forEach(point=>list.append(makePoint(section,point)));
      block.append(list);
    } else {
      block.append(element('p','nil','• Nil.'));
    }
    if (editing) {
      const add = element('button','add-point','+ Add dot point');
      add.type='button';
      add.addEventListener('click',()=>{
        current.sections[section].push({ text:'', source:null, start:null, end:null, edited:true });
        invalidate();renderDraft();
        const selected = [...body.querySelectorAll('.note-section')]
          .find(x=>x.querySelector('h3')?.textContent===section);
        const target = selected?.querySelector('.note-point:last-child .point-text');
        target?.focus();
      });
      block.append(add);
    }
    body.append(block);
  });
  $('editBtn').textContent=editing?'Done editing':'Edit note';
  updateAccuracy();
}
async function copyText(text) {
  if (!reviewValid()) {notify('Please confirm you have reviewed the note first.');return;}
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    notify('Copied. Paste into your authorised care system, then clear the session.');
  } catch {
    notify('Clipboard access is blocked. Use HTTPS/localhost and check browser permissions.');
  }
}
function generate() {
  const text = source.value.trim();
  if (!text) {notify('Type what happened during the shift.');source.focus();return;}
  if (current && !window.confirm('Replace your current note with a new draft?')) return;
  const parsed = parseInput(text);
  if (!parsed.raw) {notify('Add at least one observation after the participant name.');return;}
  try {
    current = generateNotes(parsed);
    current.raw = text;
    editing = false;
      approve.checked = false;
    $('originalMessage').textContent = text;
    $('welcome').hidden = true;
    $('thread').hidden = false;
    accuracy.open = false;
    renderDraft();
    source.value='';
    refreshSend();
    requestAnimationFrame(()=>{stage.scrollTop=0;});
  } catch {
    notify('The note could not be formatted. Check the length and try again.');
  }
}
function clearSession() {
  if ((current || source.value.trim()) && !window.confirm('Clear this session and start a new note? This cannot be undone.')) return;
  current=null; editing=false;
  source.value='';
  body.replaceChildren();
  $('originalMessage').textContent='';
  $('thread').hidden=true;
  $('welcome').hidden=false;
  approve.checked=false;
  $('copyAllBtn').disabled=true;
  accuracy.open=false;
  refreshSend();
  stage.scrollTop=0;
  source.focus();
  notify('Session cleared from this app. Your device clipboard is unaffected.');
}

form.addEventListener('submit',event=>{event.preventDefault();generate();});
source.addEventListener('input',refreshSend);
source.addEventListener('keydown',event=>{
  // Consistent with chat apps: Enter sends on both desktop and mobile hardware keyboards.
  // Shift+Enter always inserts a line break; composition and modifier shortcuts are untouched.
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing &&
      !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    generate();
  }
});
approve.addEventListener('change',updateApproval);
$('copyAllBtn').addEventListener('click',()=>current&&copyText(exportAll(current.sections)));
$('editBtn').addEventListener('click',()=>{editing=!editing;invalidate();renderDraft();});
$('newNoteBtn').addEventListener('click',clearSession);
$('exampleBtn').addEventListener('click',()=>{source.value=example;refreshSend();source.focus();});
window.addEventListener('online',updateNetwork);
window.addEventListener('offline',updateNetwork);
updateNetwork();refreshSend();
if ('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{ /* Online mode still functions. */ });
}
