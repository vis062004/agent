# Frontend Security

**The frontend is never the security boundary.** Every rule below assumes the backend independently validates and authorizes everything — the frontend's job is UX (fast feedback, hiding actions the user can't perform) and defense-in-depth, never the actual enforcement. If a review finds frontend-only validation/authorization being treated as sufficient, that's a defect, not a stylistic nit.

## XSS

- Never pass unsanitized user/external content to `dangerouslySetInnerHTML`. React's default text interpolation (`{value}`) already escapes — don't defeat it by manually injecting HTML.
- If rendering HTML is genuinely required (rich text from a CMS/editor), sanitize with a maintained library (e.g. DOMPurify) at render time, not just at input time (stored content can be edited elsewhere).
- Never build DOM strings via template concatenation and inject them; never use `eval`/`new Function` on any external input.

```tsx
// Only after sanitizing, and only when HTML rendering is actually required
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(richTextHtml) }} />
```

## Token & Session Handling

- Prefer the backend setting an httpOnly, `Secure`, `SameSite=Strict`/`Lax` cookie for auth tokens over storing them in `localStorage`/`sessionStorage`, which is readable by any injected script (i.e. any successful XSS becomes full session theft).
- If a token must be held in JS (no cookie-based auth available), keep it in memory only, not persistent storage, and accept the trade-off (lost on refresh) unless the project has explicitly decided otherwise — this is a project-specific auth-architecture decision; confirm rather than assume (`decision-making.md`).
- Never put a token in a URL (query string) — URLs end up in browser history, server logs, and referrer headers.
- Attach tokens via the `Authorization` header through the centralized HTTP client interceptor (`data-fetching.md`), never scattered per-call.
- Clear all client-held auth state on logout, including any cached query data that's user-specific.
- Never log tokens, even at debug level.

## Sensitive Data Exposure

- Don't render full sensitive values (card numbers, SSNs, full tokens) in the DOM or `console.log` — mask by default (e.g. `•••• 4242`), reveal only via explicit user action.
- Don't include sensitive data in analytics events, error-tracking payloads, or URLs.
- Scrub sensitive fields before sending anything to a logging/monitoring service.

## Environment Variables & Secrets

- Only bundler-exposed variables (`VITE_*`, `REACT_APP_*`, etc., per the project's bundler) reach the client — and everything that does is **public**, visible to anyone via browser devtools/view-source. Never put an API secret, private key, or credential in a frontend env var.
- Commit a `.env.example` with placeholder values; never commit a real `.env`.
- If a feature seems to need a secret on the client, that's a sign the operation belongs on the backend (a proxy endpoint), not a sign to expose the secret — flag this rather than working around it.

## URL Validation

- Validate/allowlist any URL built from user input before using it in `href`, `src`, a redirect, or `window.open` — an unvalidated `javascript:` URL or open redirect is exploitable.
- Encode any user input interpolated into a URL (`encodeURIComponent`), never string-concatenate raw input into a path/query string.

## File Uploads

- Validate file type/size on the client for UX (fast feedback) but re-validate on the backend — client checks are trivially bypassed.
- Don't render an uploaded file's content (especially SVG, which can contain script) without sanitizing/serving it in a way that prevents execution (e.g. serving from a separate, non-script-executing origin, or sanitizing SVG content).
- Show upload progress/errors clearly; never silently truncate or drop a failed upload.

## Authorization Assumptions

- Hiding a button/route for a role is UX, not security — the backend must independently reject the action for unauthorized users regardless of what the UI shows.
- Don't infer a user's permissions client-side from data shape/presence; use an explicit permissions/role field the backend provides.
- A disabled button is not a security control — a disabled-but-still-rendered form's underlying request must still be rejected server-side if attempted directly.

## CSRF

If the project uses cookie-based auth (the safer default per Token Handling above), coordinate with the backend's CSRF protection (e.g. a CSRF token the frontend reads from a cookie/meta tag and sends back on state-changing requests via a header) — this is a backend-driven mechanism the frontend must wire up correctly, not invent independently. If the project uses token-based auth via `Authorization` header only (no cookies), CSRF risk is substantially reduced but confirm the actual mechanism rather than assuming either way.

## Dependency Risk

- Run the project's dependency audit tool (e.g. `npm audit`) before considering a task with new/updated dependencies done; address high/critical findings.
- Avoid adding a dependency for something trivial (a 5-line utility) — every dependency is attack surface and a maintenance liability.
- Don't add an unmaintained or low-adoption package without checking its activity/security history first.

## Logging

- Never log full request/response bodies that could contain tokens, passwords, or PII.
- Client-side error logging (to a monitoring service) should scrub known-sensitive fields before sending.

## Quick Checklist

- [ ] No unsanitized HTML injection
- [ ] Tokens not in `localStorage` without a documented reason; never in URLs
- [ ] No secrets in frontend env vars or bundled code
- [ ] User-controlled URLs validated/encoded
- [ ] Uploaded files re-validated server-side; risky content not executed client-side
- [ ] UI-hidden actions are also backend-enforced
- [ ] No stack traces / internal details in user-facing errors (`loading-error-states.md`)
- [ ] Dependency audit run, no unresolved high/critical findings
