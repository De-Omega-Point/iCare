"""In-memory Chromium UI/privacy smoke test; no live HTTP server required.
The execution environment blocks loopback browser navigation, so PWA/Service Worker
registration and actual network isolation must be tested on real localhost/HTTPS.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re
root=Path(__file__).resolve().parents[1]
index=(root/'index.html').read_text()
index=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '', index)
index=re.sub(r'<script type="module"[^>]*></script>', '',index)
index=re.sub(r'<link rel="(?:stylesheet|icon|manifest)"[^>]*>', '',index)
index=index.replace('</head>','<style>'+ (root/'styles.css').read_text() +'</style></head>')
engine=(root/'engine.mjs').read_text().replace('export const ','const ').replace('export function ','function ')
engine+='\nwindow.iCareEngine={SECTION_ORDER,generateNotes,exportAll,validateBullet,MODEL_VERSION};'
app=(root/'app.mjs').read_text()
app=re.sub(r"^import .*? from './engine.mjs';\n",'const {SECTION_ORDER,generateNotes,validateBullet,exportSection,exportAll,MODEL_VERSION}=window.iCareEngine;\n',app)
engine=engine.replace('window.iCareEngine={SECTION_ORDER,generateNotes,exportAll,validateBullet,MODEL_VERSION}',
  'window.iCareEngine={SECTION_ORDER,generateNotes,exportSection,exportAll,validateBullet,MODEL_VERSION}')
results={};errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000})
 page=context.new_page()
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(index)
 page.add_script_tag(content="(()=>{\n"+engine+"\n})();")
 page.add_script_tag(content="Object.defineProperty(navigator, 'clipboard', { value: {writeText:async t => {window.__testClipboard=t;},readText:async()=>window.__testClipboard} });")
 page.add_script_tag(content="(()=>{\n"+app+"\n})();")
 page.locator('#exampleBtn').click()
 page.locator('#generateBtn').click()
 results['all_ten_headings']=page.locator('.section-card').count()==10
 results['source_trace_visible']=page.locator('.bullet-source').count()>=4
 results['copy_blocked_before_review']=page.locator('#copyAll').is_disabled()
 page.locator('#reviewConfirm').check()
 results['copy_enabled_after_review']=page.locator('#copyAll').is_enabled()
 page.locator('#copyAll').click()
 clipboard=page.evaluate('window.__testClipboard') or ''
 results['clipboard_correct_format']=('ACTIVE SUPPORT\n• ' in clipboard and 'OBSERVATION\n• Nil.' in clipboard)
 results['no_storage_api_usage']=all(token not in app+engine for token in ('localStorage', 'sessionStorage', 'indexedDB', 'caches.put'))
 # An edit must revoke the review confirmation before copying again.
 page.locator('.bullet-body textarea').first.fill('Edited fact for manual review.')
 results['edits_revoke_copy_permission']=page.locator('#copyAll').is_disabled()
 page.screenshot(path='/mnt/data/icare-prototype-desktop.png',full_page=True)
 page.on('dialog',lambda dialog:dialog.accept())
 page.locator('#clearAll').click()
 results['clear_removes_visible_note']=page.locator('#results').is_hidden() and page.locator('#sourceText').input_value()==''
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path='/mnt/data/icare-prototype-mobile.png',full_page=True)
 results['no_javascript_errors']=len(errors)==0
 browser.close()
print(json.dumps({'results':results,'passed':sum(results.values()),'total':len(results),'page_errors':errors,
 'limitation':'Browser navigation to localhost is blocked by this test environment; service worker and real offline reload not validated.'},indent=2))
if not all(results.values()):raise SystemExit(1)
