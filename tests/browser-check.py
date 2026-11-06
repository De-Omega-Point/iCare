"""In-memory Chromium smoke tests for iCare chat-like UI.

No live-origin navigation available in this sandbox. Remove CSP only in this test
harness and inject the same local source. Genuine offline PWA and OS clipboard
must still be verified on real localhost or HTTPS target devices.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '', html)
html=re.sub(r'<script type="module"[^>]*></script>', '', html)
html=re.sub(r'<link rel="(?:stylesheet|icon|manifest)"[^>]*>', '', html)
html=html.replace('</head>', '<style>' + (root/'styles.css').read_text() + '</style></head>')
engine=(root/'engine.mjs').read_text().replace('export const ', 'const ').replace('export function ', 'function ')
engine+='\nwindow.iCareEngine={SECTION_ORDER,generateNotes,exportAll,exportSection,validateBullet};'
app=(root/'app.mjs').read_text()
app=re.sub(r"^import .*? from './engine.mjs';\n", 'const {SECTION_ORDER,generateNotes,validateBullet,exportSection,exportAll}=window.iCareEngine;\n', app)

results={}
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1280,'height':900})
    page=ctx.new_page()
    page.on('pageerror', lambda err:errors.append(str(err)))
    page.set_content(html)
    page.add_script_tag(content='(()=>{\n'+engine+'\n})();')
    page.add_script_tag(content="Object.defineProperty(navigator, 'clipboard', { value: {writeText:async t => {window.__clipboard=t;},readText:async()=>window.__clipboard} });")
    page.add_script_tag(content='(()=>{\n'+app+'\n})();')
    page.screenshot(path='/mnt/data/icare-chat-welcome.png',full_page=True)
    results['single_composer']=page.locator('#sourceText').count()==1 and page.locator('#welcome').is_visible()
    results['send_disabled_without_input']=page.locator('#generateBtn').is_disabled()
    page.locator('#exampleBtn').click()
    results['fictional_sample']= 'Avery (fictional)' in page.locator('#sourceText').input_value()
    page.locator('#generateBtn').click()
    results['chat_layout']= page.locator('#thread').is_visible() and page.locator('.user-bubble').is_visible() and page.locator('.assistant-turn').is_visible()
    results['ten_sections']=page.locator('.note-section').count()==10
    results['name_from_explicit_label']= 'Avery (fictional)' in page.locator('.note-section').first.inner_text()
    results['copy_locked_before_review']=page.locator('#copyAllBtn').is_disabled()
    page.locator('#accuracyDetails summary').click()
    results['source_links_available']=page.locator('.accuracy-items .trace').count()>=4
    page.locator('#accuracyDetails summary').click()
    page.evaluate("document.getElementById('conversationStage').scrollTop=0")
    page.screenshot(path='/mnt/data/icare-chat-desktop.png',full_page=True)
    page.locator('#reviewConfirm').check()
    results['copy_unlocked_after_review']=page.locator('#copyAllBtn').is_enabled()
    page.locator('#copyAllBtn').click()
    saved=page.evaluate('window.__clipboard') or ''
    results['clipboard_ten_sections']=all(piece in saved for piece in ('CLIENT NAME\n• Avery (fictional).','ACTIVE SUPPORT\n• ','OBSERVATION\n• Nil.'))
    page.locator('#editBtn').click()
    results['edit_revokes_review']=page.locator('#copyAllBtn').is_disabled() and page.locator('.point-text[contenteditable=true]').count()>=4
    page.locator('.point-text[contenteditable=true]').first.fill('Avery the participant')
    results['edits_keep_copy_locked']=page.locator('#copyAllBtn').is_disabled()
    page.locator('#editBtn').click()
    results['edit_mode_can_close']=page.locator('.point-text[contenteditable=true]').count()==0
    page.on('dialog',lambda dialog:dialog.accept())
    page.locator('#newNoteBtn').click()
    results['clear_session']=page.locator('#welcome').is_visible() and page.locator('#thread').is_hidden() and page.locator('#sourceText').input_value()==''
    page.locator('#toast').evaluate("e => e.classList.remove('visible')")
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='/mnt/data/icare-chat-mobile-welcome.png',full_page=True)
    page.locator('#exampleBtn').click()
    page.locator('#generateBtn').click()
    page.evaluate("document.getElementById('conversationStage').scrollTop=0")
    page.screenshot(path='/mnt/data/icare-chat-mobile-note.png',full_page=True)
    results['mobile_no_horizontal_overflow']=page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    results['mobile_sections']=page.locator('.note-section').count()==10
    results['no_js_errors']=not errors
    browser.close()
print(json.dumps({'results':results,'passed':sum(results.values()),'total':len(results),'errors':errors,'limits':'In-memory Chromium; actual PWA offline and OS clipboard remain device testing gates'},indent=2))
if not all(results.values()):raise SystemExit(1)
