# iCare Local AI · Simple conversation prototype v0.3

**Status: DEVELOPMENT ONLY. Fictional test data ONLY. NOT approved for real participant records.**

## One-screen workflow

**Type shift notes → Generate → Review/edit → Copy → Paste into authorised iCare → New note (clear).**

The interface is a minimal chat window with one input at the bottom, a clearly labelled Send button, the user's message bubble and one clean assistant reply. **Enter sends; Shift+Enter adds a new line.** On supported mobile keyboards the return key is labelled Send. No dashboard, logins, sidebars, databases or configuration panels. An expanded accuracy trace is optional. A positive human-review checkbox remains compulsory before copying.

### Try it

Use a local static web server over `localhost` or HTTPS:

```sh
python3 -m http.server 8080
# Visit http://localhost:8080/
```

Type an explicit name on the first non-empty line if desired:

```
Name: Avery
Avery prepared lunch.
Avery declined to participate in exercises.
SW prompted Avery to clean the table.
```

The app generates all ten **fixed** headings: CLIENT NAME, CLIENT SUPPORT, BEHAVIOUR, MEDICAL, HEALTH, COMMUNITY PARTICIPATION, COMMUNICATION, ACTIVE SUPPORT, GOAL, OBSERVATION. All output uses editable dot points; empty sections show `• Nil.`. Unprovided names remain `Nil.` and are flagged for human review. Refusals are preserved without automatically labelling them as problematic behaviour. **Do not infer that Nil means nothing happened.**

## AI disclosure

The local intelligence is a small multinomial Naïve Bayes classifier trained at startup on 92 **fictional** examples, combined with conservative rules and source-preserving formatting. It is *not* a generative LLM and never sends note content to an external inference service. A larger model remains an unapproved evaluation gate.

## Security and limitations

- No persistent app note storage, account, backend, analytics, telemetry or external AI requests; static assets alone are cached for offline reuse. The app cannot protect against all extensions, compromised browsers or device-level capture.
- Clear removes the app's live state but does not clear the operating system clipboard, browser-managed memory, screenshots or other applications' records.
- Clipboard copying is only activated after a worker checks the source and confirms review. Edits invalidate approval. The worker remains the authority on what happened.
- Actual offline reload and clipboard behaviour on macOS Firefox / iPhone Safari require **target-device testing**. GitHub Pages files are only a synthetic-data prototype, not production authorisation.
- Never enter identifiable client information until employer/provider permission, security review and separate production sign-off are complete.

## Tests

```sh
node --test tests/engine.test.mjs
node tests/benchmark.mjs
python3 tests/browser-check.py  # requires Playwright + Chromium
```

See `docs/TEST_REPORT.md` for validation status, and `docs/MVP_SPEC_v1.md` for the unchanged approved behavioural specification.

## Repository

The sole repository for this project is `De-Omega-Point/iCare`. Work is reviewed on `dev/icare-local-ai-mvp-v1`; a deliberately limited static preview lives on `gh-pages`. Neither branch merges into `main` automatically.
