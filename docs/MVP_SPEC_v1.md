# iCare Local AI — MVP Product & Technical Specification v1.0

**Organisation:** De-Omega-Point  
**Status:** Founder-approved for prototype development; production use **not approved** pending tests and provider authorisation  
**Date:** 6 November 2026  
**Target stack:** HTML5, CSS3, vanilla JavaScript, offline-capable local AI

## 1. Purpose and scope

Enable a disability support worker to enter rough shift observations and generate accurate, structured, editable, dot-point progress notes for manual copy-and-paste into the employer's existing iCare system. iCare remains the system of record.

**Workflow:** Enter → Generate → Compare and review → Edit → Copy → Paste into authorised main system → Clear.

**In MVP:** ten-heading template, source-preserving rewrite, local inference with deterministic rules fallback, factual/source trace check, missing-information alerts, duplicate detection, editable dot points, copy full note or selected section, explicit clear, offline operating status, accessibility, responsive layout.

**Out of scope:** cloud AI, participant database, account management, provider-side integrations, auto-submission, training on real participant data, analytics on notes, voice recording, image/ShiftCard reading, incident-report submission, medication charting, digital signature.

## 2. Screen and interaction requirements

**Top bar:** iCare Local AI name; OFFLINE / AI READY / FALLBACK / SETUP REQUIRED status; privacy indicator.

**Input pane:** Participant name (only if needed), shift date (optional, local), raw observations textarea, clear button. Avoid fields that ask for unnecessary identifiers, addresses or DOB. Browser autocomplete and spellcheck behaviour to be assessed for exposure risks.

**Generation control:** Generate structured notes. Explain that no external AI processes content. If AI runtime unavailable, offer a clearly labelled rules-based formatter and do not pretend AI inference occurred.

**Output pane:** exactly ten headings; editable line-by-line dot points; Nil in undocumented categories; source comparison view; labels for unsupported/ambiguous/missing statements; editable corrections.

**Actions:** Review confirmation checkbox, Copy All, Copy Section, Reset/Clear All. Copy actions require review confirmation; display warning about clipboard exposure and remind worker to paste into approved system.

**Accessibility:** readable contrast, keyboard access, touch-friendly buttons, labels and screen-reader status messages. Mobile-first responsive design.

**Session handling:** no automatic saving of note text, no draft autosave in IndexedDB/localStorage/cache, no note text to URL parameters, telemetry, network, browser console or error reports. Clear discards current in-memory note and output. Closing/reloading loses session; communicate that explicitly. Browser/device memory and OS clipboard are not guaranteed sanitised by 'Clear'.

## 3. Canonical section schema and order

1. **CLIENT NAME** — participant name only if supplied.
2. **CLIENT SUPPORT** — routine, personal care, domestic activities, independence, assistance.
3. **BEHAVIOUR** — observed behaviour only; not ordinary preferences/refusals unless context establishes it is a behaviour concern.
4. **MEDICAL** — only explicitly documented medication/medical actions or observations; no invented diagnoses, doses or administration.
5. **HEALTH** — reported symptoms, wellbeing and relevant health observations, without unsupported clinical interpretation.
6. **COMMUNITY PARTICIPATION** — outings, programs, attendance, community activities.
7. **COMMUNICATION** — communication supports and actual communication observations.
8. **ACTIVE SUPPORT** — specific prompts, guidance, choices offered or assistance actually provided to enable participation and independence.
9. **GOAL** — progress towards an explicitly identified goal; do not invent an NDIS goal.
10. **OBSERVATION** — directly observed, relevant facts not better placed elsewhere; no assumptions.

**Formatting:** upper-case heading; each note on its own line prefixed `• ` by default; alternate `- ` if required by target paste compatibility; past tense, concise and objective Australian English; use `SW` consistently. Empty sections use `• Nil.` to mean the raw input contains no statement for that category, **not** that an event was confirmed absent. Keep all ten headings and exact order.

**Refusals and choice:** preserve participants' exact choices objectively. Never treat an ordinary refusal as an incident or problematic behaviour merely because it is a refusal. Include actual support offered or an adjusted routine only when supplied.

## 4. Note-processing pipeline

1. **Preflight:** verify local/offline runtime, no network calls to process note contents, model licence and integrity checks, text length limits.
2. **Parse:** segment input into atomic source statements, retaining source offsets.
3. **Classify:** map statements to canonical categories using deterministic logic and, when available, a local language model.
4. **Rewrite:** produce short factual dot points; do not fill gaps with plausible details or inferred dates, times, care activities, health conditions, safety outcomes or participant goals.
5. **Validate:** require a source span or explicit user confirmation for every factual output bullet; flag missing facts, unsupported additions, changed negation/refusals, duplicates and ambiguity.
6. **Render:** enforce canonical headings and exact dot-point syntax; show clear warnings to reviewer.
7. **Review and copy:** worker confirms the note accurately reflects the shift before copying into main iCare.
8. **Clear:** explicit reset removes in-app draft and output from app state; clipboard remains under OS control.

**Hard constraints:** The model must never claim a medication was administered, a clinical diagnosis existed, an incident occurred, or a particular prompt/physical assistance was provided unless the source supports that exact statement. It must never claim the worker provided support the source did not describe. A validation warning does not by itself block editing, but unreviewed content cannot be copied via the app button.

## 5. Technical architecture

- Static, self-hosted PWA over HTTPS; HTML/CSS/vanilla JS. No server-side AI or participant-data backend.
- Separate modules: `ui.js`, `template.js`, `rules.js`, `local-model.js`, `fact-check.js`, `security.js`, `clipboard.js`, `sw.js`.
- Local inference candidate: Transformers.js and an appropriately licensed small quantised model; select only after device benchmarking. WebGPU where available, WASM/CPU where practical, deterministic formatter fallback.
- Cache only audited static assets and model weights for offline operation. Never cache participant input or AI output in a service worker.
- Bundle/pin application scripts locally and block third-party scripts, analytics, remote inference and dynamic script execution with appropriate Content Security Policy and network restrictions.
- Test on macOS Firefox and iPhone Safari/iOS home-screen PWA as distinct targets; do not assume equivalent WebGPU support.
- Device security and employer policies are external dependencies. Browser-based code cannot guarantee protection from a compromised device, extensions or clipboard synchronisation.

## 6. Security and privacy acceptance requirements

**S1.** After initial installation/model download, generate and edit notes with airplane mode enabled.  
**S2.** Network instrumentation shows zero participant text sent to any remote domain before, during or after processing.  
**S3.** No notes stored in app localStorage/IndexedDB/Cache API or included in logs, console, crash reporting, URL or analytics.  
**S4.** PWA service worker caches only static application/model assets; cache inspection confirms no note text.  
**S5.** Strong CSP and pinned, locally served runtime dependencies; no third-party scripts in pages that handle participant data.  
**S6.** The worker must review before copying. Clipboard warning and clear action are visible; do not promise clipboard erasure.  
**S7.** The original and generated notes are cleared from application state on Reset and do not reappear after reload. (Not a forensic memory wipe.)  
**S8.** Test on lost-device/shared-device scenarios; require employer device-policy authorisation and secure screen lock.  
**S9.** Before real participant data, confirm organisational authorisation, confidentiality obligations, privacy policy, incident procedures and relevant retention rules.  
**S10.** No use of actual iCare chat/client text as a training dataset without documented authority and robust de-identification/consent basis.

## 7. Factual quality acceptance tests

Create at least 30–50 synthetic/de-identified cases including: client support, medications, declined exercises, choice and consent, illness, domestic tasks, community outings, repeated events, inconsistent input, misspellings and empty headings.

**Q1.** 100% ten headings in correct order.  
**Q2.** 100% generated statements rendered as dot points.  
**Q3.** Zero unsupported factual additions across the release test set; human review remains mandatory because no automated validator guarantees correctness.  
**Q4.** 100% preservation of explicit refusals, uncertainty, negations and significant participant choices in the release set.  
**Q5.** At least 95% agreed heading classification against a human-labelled release set; inspect ambiguous refusals separately.  
**Q6.** All non-source-backed output flagged and traceable to input; missing-information alerts do not fill gaps.  
**Q7.** Copy into test destination retains readable heading and dot-point formatting.  
**Q8.** Core rules-only formatter operates when AI/model acceleration is unsupported.

## 8. Build sequence and approval gates

**Prototype Gate A — Format:** User interface + 10 fixed headings + raw entry + manual edit + copy + clear; synthetic input only.  
**Prototype Gate B — AI:** Add local model, source trace and factual validation; demonstrate offline capability on actual target devices.  
**Prototype Gate C — Security:** Complete S1–S10 tests, device evaluation, model/dependency security review, authorised use and privacy assessment.  
**Release Gate:** Obtain explicit founder and relevant provider approval; only then permit real participant notes. No automatic production release.

**Decision rule:** Prioritise factual safety and human agency over model cleverness. Fall back to transparent rules-based formatting if local AI cannot meet quality, speed or compatibility gates.

## 9. Evidence / references consulted

- OAIC APP 11, updated 3 Oct 2025: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
- NDIS Quality Indicators (information management) as at 1 July 2026: https://www.legislation.gov.au/F2018N00041/2026-07-01/2026-07-01/text/original/epub/OEBPS/document_1/document_1.html
- Transformers.js documentation: https://huggingface.co/docs/transformers.js/index
- Transformers.js WebGPU guidance: https://huggingface.co/docs/transformers.js/guides/webgpu
- MDN browser storage and eviction: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
