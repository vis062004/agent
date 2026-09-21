# Project Memory

> Read this first in a new session before re-deriving context from the repo. If it answers
> the question, use it — don't re-read the underlying files. If it doesn't, read only the
> specific file(s) the task needs. Update this file after every meaningful change — a
> decision confirmed, a file created/changed, a question answered — not just at session end.

Last updated: 2026-09-21

## Repo State

`vis062004/agent` holds the `.claude/` operating layer plus `app/` — a Vite + React +
TypeScript app (SCSS, react-router-dom, no state library, no backend). It implements the
first slice of the "Access Request & Approval System": hardcoded admin/admin login persisted
to localStorage, and a protected IT Resource Request form.

## Active Skills

| Skill | Path | Covers |
|---|---|---|
| `frontend` | `.claude/skills/frontend/` | React components/hooks/state/data-fetching (REST+GraphQL)/forms/SCSS/a11y/security/testing — decision-driven, no assumed stack |
| `debugging` | `.claude/skills/debugging/` | Root-cause analysis for bugs/crashes — exact cause, smallest fix, no rewrites |

Not yet created (see `CLAUDE.md` §2 for the routing placeholder): `backend`, `database`,
`testing`. Add each as a sibling folder under `.claude/skills/` the first time that domain is
actually needed — don't pre-build them speculatively.

## Confirmed Project Decisions

**Access Request & Approval System (first slice: login + IT Resource Request form)**
- Stack: React + TypeScript + Vite, SCSS, react-router-dom (chosen over conditional-render
  for future scalability), no state library, no backend.
- Auth: hardcoded `admin`/`admin`, client-side only — prototype-level check, not real
  authorization (no token/session from a backend). Login state (username) persisted to
  `localStorage` under key `access-request-system:auth` — a refresh keeps the user logged in
  until they explicitly log out. Auth exposed via `AuthContext`/`useAuth`
  (`app/src/features/auth/context/AuthContext.tsx`).
- Routes: `/login` (public), `/request` (protected via `ProtectedRoute`, redirects to
  `/login` if not authenticated). `/` and unknown paths redirect to `/request`.
- Request form fields (all mandatory, array-driven validation per `forms.md`): item name
  (text), category (dropdown: Laptop/Monitor/Peripheral/Software/Other), quantity (number,
  digits-only live sanitization, must be a whole number > 0), business justification
  (textarea), urgency (radio: Low/Medium/High).
- Submit behavior: validate client-side, then show an in-page success state — **no
  persistence** of submitted requests (not localStorage, no backend). "Submit Another
  Request" resets the form.
- Folder structure: hybrid/feature-based — `app/src/features/auth/`,
  `app/src/features/requests/`, shared `app/src/styles/` (SCSS tokens/mixins),
  `app/src/utils/`, and `app/src/components/common/` (see below).
- Shared field components (`component-design.md`'s reusability test: login + request form
  both need the label/control/error/a11y contract, so it's a real 2-call-site abstraction,
  not premature): `components/common/{Button,TextField,SelectField,TextAreaField,
  RadioGroupField}` + barrel `components/common/index.ts`. Each owns its own scoped SCSS
  (`Button.scss`, shared `Field.scss` for the four field components) — no business
  logic/feature imports inside `components/common`, per the skill's constraints. Both
  `LoginPage` and `RequestFormPage` are built from these rather than raw `<input>`/`<button>`
  JSX.
- Verified end-to-end with Playwright against `vite preview`: wrong-credentials error,
  successful login, empty-form validation (5 errors), successful submit, and
  refresh-persists-login. Playwright itself was a throwaway dev dependency, not added to
  `app/package.json`.

## Open Questions

None currently pending.

## Recent Changes

- 2026-09-21 — Refactored the first-slice form UI to use shared `components/common/` field
  components (`Button`, `TextField`, `SelectField`, `TextAreaField`, `RadioGroupField`)
  instead of inline JSX in `LoginPage`/`RequestFormPage`, per `component-design.md`'s
  reusability test (2 genuine call sites) — the initial version had skipped this. Re-verified
  with the same Playwright flow; unchanged behavior. PR #1 not yet re-pushed — pending user
  review.
- 2026-09-21 — Built the Access Request & Approval System's first slice (see Confirmed
  Project Decisions above) in `app/`: `AuthProvider`/`useAuth`, `ProtectedRoute`,
  `LoginPage`, `RequestFormPage` + validation module, SCSS tokens/mixins/base styles,
  react-router setup in `App.tsx`/`main.tsx`. Not yet pushed — pending user confirmation.
- 2026-09-21 — Added `CLAUDE.md` (root router: memory check, skill routing table, task-mode
  classification, requirement-gathering protocol, change/git discipline, token rules),
  `.claude/skills/debugging/SKILL.md` (root-cause-analysis workflow), and this memory file.
- 2026-09-20 — Added `.claude/skills/frontend/` (18 files: SKILL.md + 17 references covering
  architecture, component design, hooks, performance, state management, data fetching,
  GraphQL, forms, SCSS/theming, responsive UI, accessibility, loading/error states, security,
  testing, folder structure, engineering principles, decision-making). Two rounds of
  follow-up fixes: (1) trivial-dependency guidance + sr-only a11y technique, found by
  building a sample Employee list/form feature against the skill; (2) array-driven mandatory
  field validation, live input sanitization, and dependent/cascading field reset patterns in
  `forms.md`, generalized from a real React Native form the user described.
