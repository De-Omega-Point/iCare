# iCare Local AI — Simplified conversation UI test report

**Prototype:** v0.2, 7 November 2026. **Production gate: BLOCKED.** Fictional data only.

## What changed

- Replaced the multi-panel dashboard with a single chat-style composition view, one shift-note input and one AI-response view.
- Kept all ten headings and locally trained classifier; user can edit/remove/add dot points within the response.
- Accuracy review is collapsible. Human confirmation is required before full-note or section clipboard export. Editing invalidates the previous confirmation.
- No persistent note storage, networking libraries or cloud inference. Static-only service worker cache updated to `icare-static-v0.2.0`.
- Simplified explicit client name to `Name: ...` on the first non-empty line, with no automatic name guessing.

## Tests (local authoring environment)

| Test | Result | Scope |
| --- | --- | --- |
| Node engine unit suite | 11/11 pass | Formatting, headings, refusal safeguards, source traces |
| Synthetic model benchmark | 51/51 classification examples correct | Small synthetic test set, not clinical reliability |
| In-memory Chromium interface smoke checks | 17/17 pass | One composer, chat response, edit/review/copy/clear, responsive layout |
| JavaScript runtime errors in smoke checks | None | In-memory Chromium injection |
| Localhost browser navigation | Blocked by test environment | `ERR_BLOCKED_BY_ADMINISTRATOR`; not an application failure |
| Real offline reload after Service Worker installation | **Not verified** | Must test on real origin and devices |
| macOS Firefox / iPhone Safari | **Not verified** | Device/browser validation required |
| Production privacy/security review | **Not completed** | Real participant data prohibited |
| Generative LLM benchmark | **Not done** | The integrated AI is a local text classifier, not a generative LLM |

No production readiness is claimed. Follow the original specifications and organisational authorisation requirements before real data is used.

## v0.3 chat interface regression checks

- Visible Send button adjacent to bottom composer, including on mobile.
- `enterkeyhint="send"` guides supported on-screen keyboards.
- Enter sends on touch and desktop keyboards; Shift+Enter inserts a new line.
- No change to classifier, ten-heading template, mandatory review, or offline-only data handling.
- See reproducible browser test suite; device-specific keyboard and offline behaviour remain release gates.
