# iCare Local AI · Prototype v0.1

**Status:** Development prototype only. **Not approved for real participant data.**

Standalone, offline-first documentation assistant from De-Omega-Point. Intended workflow: **Enter → Generate → Compare → Edit → Review → Copy → Paste into the authorised main system → Clear**.

## What works

- Fixed 10-section iCare template, uppercase headings, editable dot points and `Nil.` for missing categories.
- **Actual on-device machine learning:** dependency-free multinomial Naïve Bayes text classifier, trained at app startup on 92 fictional examples, plus explicit safety classification rules. This is a *classifier*, **not a generative LLM**.
- Conservative source-preserving text formatting, source spans, duplicate suppression, choice/refusal safeguards, medication/incident process flags, and warnings for manual edits.
- Requires positive human review before enabling section/full-note clipboard copying.
- No sign-in, no participant database, no network inference, no analytics, no text autosave. Service worker caches only publicly available application files. `connect-src 'none'` in CSP.
- Works offline after the static shell has been cached. On first visit, install uses network; model classification thereafter is entirely local.

## Run locally

Use a local static HTTPS or localhost server (do not run as `file://`):

```sh
python3 -m http.server 8080
# open http://localhost:8080/
```

For testing:

```sh
node --test tests/*.test.mjs
node tests/benchmark.mjs
```

No npm install, hosted model, tracking script, credentials, or backend needed. The browser needs JavaScript enabled.

## Source of truth

See `docs/MVP_SPEC_v1.md` (founder-approved 6 Nov 2026). It requires all ten headings, manual review, local-only processing, zero persistent note storage and approval gates before production.

## Scope boundaries

- The local AI in this release is a small **trained document classifier**, not a language model that generates fresh prose. This is intentional to avoid hallucination when handling care documentation.
- Automatic factual validation is limited: linking source spans and warning about edits cannot establish truth. Human review is always required.
- Advanced generative LLM integration (e.g. self-hosted Transformers.js runtime + verified ONNX weights) remains a *separate test gate*, not silently downloaded from a cloud provider. No unverified model or third-party script will be loaded into a note-taking page.
- No real-user benchmark on target iPhone/Safari or Mac/Firefox yet. Read `docs/TEST_REPORT.md` for reproducible local synthetic results, device and privacy gates still open.
- No incident-report submission, medication administration charting, clinical advice, provider integrations, account storage or automated posting.

## Local privacy caveats

- Browser tabs and the device's clipboard may be observable by the browser, extensions and other applications, depending on platform settings. `Clear` removes only the live app state; it is not a forensic memory wipe and **cannot clear the OS clipboard**.
- Avoid real participant details until employer/provider authorisation, target-device assessment, security review and founder approval are documented.
- The output is a *draft*. `Nil.` means no source information was supplied for that section, not that the participant did not experience an event.

## Repository workflow

All iCare Local AI work belongs to `De-Omega-Point/iCare` only. This prototype is developed on `dev/icare-local-ai-mvp-v1`; `main` remains unchanged until explicitly reviewed and authorised.
