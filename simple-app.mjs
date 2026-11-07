import {generateNotes, SECTION_ORDER, exportAll} from './engine.mjs';
const input=document.getElementById('input'),output=document.getElementById('output'),status=document.getElementById('status'),copy=document.getElementById('copy');
let reviewed=false;
function say(s){status.textContent=s;}
function parse(text){const lines=text.replace(/\r\n?/g,'\n').split('\n');const i=lines.findIndex(x=>x.trim());let participant='';if(i>=0){const m=lines[i].match(/^\s*(?:CLIENT NAME|NAME|PARTICIPANT)\s*:\s*(.{1,120})\s*$/i);if(m){participant=m[1].trim();lines.splice(i,1);}}return {participant,raw:lines.join('\n').trim()};}
function generate(){const raw=input.value.trim();if(!raw){say('Enter your shift notes first.');input.focus();return;}const parsed=parse(raw);if(!parsed.raw){say('Include at least one shift observation.');return;}try{const draft=generateNotes(parsed);output.value=exportAll(draft.sections);reviewed=false;copy.disabled=false;say('Draft generated locally. Check every statement and edit before copying.');output.focus();}catch(e){say('Unable to format notes. Check your input.');}}
document.getElementById('send').addEventListener('click',generate);
// Enter remains a normal newline inside the input. Send uses the blue button only.
output.addEventListener('input',()=>{reviewed=false;say('Edited. Check your draft before copying.');});
copy.addEventListener('click',async()=>{if(!output.value.trim()){say('Nothing to copy.');return;}if(!window.confirm('Have you checked the entire note against the source observations and corrected any errors?'))return;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(output.value);}else{output.focus();output.select();if(!document.execCommand('copy'))throw Error('copy');}reviewed=true;say('Copied. Paste into the authorised iCare system.');}catch{output.focus();output.select();say('Select the text and use your device’s Copy command.');}});
