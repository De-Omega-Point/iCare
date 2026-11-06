# iCare Local AI — Prototype test report (6 November 2026)

**Build:** v0.1 / branch `dev/icare-local-ai-mvp-v1`  
**Gate:** Development prototype only. **NOT** approved for real participant data, production or clinical use.

## Implemented

- Static HTML5, CSS3 and vanilla JavaScript UI, responsive layout, semantic labels and controls.
- Ten exact headings and dot-point text, editable statement fields, add/remove statement, duplicate handling, direct source links, warning summary, manual review confirmation, copy all/section, clear.
- Small **real local trained classifier** (multinomial Naïve Bayes with synthetic examples) and deterministic priority rules. It is **not** a generative LLM and does not download a model or send notes to a service.
- No app note database, localStorage, IndexedDB, cookies, telemetry or note submission code. Static-only service worker and restrictive CSP in HTML.

## Tests executed in the authoring environment

| Test | Result | Limitations |
| --- | --- | --- |
| Node core tests (`node --test tests/*.test.mjs`) | **11/11 pass** | Synthetic unit cases |
| Classification (`node tests/benchmark.mjs`) | **51/51 correct (100%)** | Small held-out synthetic cases from a related distribution; not a field accuracy claim |
| Average generation time, 500 iterations | **~0.03–0.05 ms** | Node.js CPU in authoring environment; not a device benchmark |
| Source-span mismatches in benchmark sample | **0** | A source span is not proof the event is true |
| Headings, bullets, order | **Pass** | Browser and Node checks |
| In-memory Chromium UI smoke test (`python tests/browser-check.py`) | **9/9 pass** | Test strips CSP and injects JS because browser navigation is blocked in this environment |
| Real HTTPS/localhost PWA install, service worker offline reload | **Not verified** | Must test on an actual host and target devices |
| Real clipboard permissions on target devices | **Not verified** | Test uses an in-browser mock clipboard; browser app still calls `navigator.clipboard.writeText` |
| macOS Firefox and iPhone Safari behaviour | **Not verified** | Target-device validation required |
| Security pentest and network instrumentation | **Not verified** | Static inspection alone cannot validate the absence of all leakage |
| Generative Transformers.js / ONNX inference | **Not integrated** | A second model evaluation gate, with self-hosted audited weights and runtime, remains open |
| Organisational approval and de-identified human review | **Not obtained** | Required before real participant data |

## Model and release decision

The prototype meets the initial formatting and rules-based fallback functions of Gate A. A local trained classifier is integrated and benchmarked on a limited synthetic test set. **Do not confuse 100% on 51 cases with clinical-grade accuracy or production approval.**

Prototype Gate B remains **partial** until independent, diverse evaluation on larger de-identified examples, actual device/offline benchmark and approved local generative model evaluation (if needed). Gate C security, privacy and provider approval are **blocked**.

## Reproduce

```sh
node --test tests/*.test.mjs
node tests/benchmark.mjs
# for UI smoke test, with Playwright + Chromium installed:
python tests/browser-check.py
# to test actual PWA, serve over localhost/HTTPS:
python3 -m http.server 8080
```

With real participant records **do not use this prototype** until provider authorisation, security review, device evaluation, verified privacy controls and explicit founder approval.
