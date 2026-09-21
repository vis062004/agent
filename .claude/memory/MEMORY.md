# Project Memory

> Read this first in a new session before re-deriving context from the repo. If it answers
> the question, use it — don't re-read the underlying files. If it doesn't, read only the
> specific file(s) the task needs. Update this file after every meaningful change — a
> decision confirmed, a file created/changed, a question answered — not just at session end.

Last updated: 2026-09-21

## Repo State

`vis062004/agent` currently holds only the `.claude/` operating layer — no application code
yet (`app/frontend/`, `app/backend/`, etc. don't exist). They get created once a real feature
is requested and its requirements are gathered per `CLAUDE.md` §4.

## Active Skills

| Skill | Path | Covers |
|---|---|---|
| `frontend` | `.claude/skills/frontend/` | React components/hooks/state/data-fetching (REST+GraphQL)/forms/SCSS/a11y/security/testing — decision-driven, no assumed stack |
| `debugging` | `.claude/skills/debugging/` | Root-cause analysis for bugs/crashes — exact cause, smallest fix, no rewrites |

Not yet created (see `CLAUDE.md` §2 for the routing placeholder): `backend`, `database`,
`testing`. Add each as a sibling folder under `.claude/skills/` the first time that domain is
actually needed — don't pre-build them speculatively.

## Confirmed Project Decisions

None yet. This section fills in as the Requirement-Gathering Protocol (`CLAUDE.md` §4) and
each skill's own decision guide (e.g. `frontend/references/decision-making.md`) get answers
confirmed with the user — framework/version, state management, API style, CSS approach, test
framework, auth mechanism, etc. Once confirmed, a decision goes here so it's never re-asked.

## Open Questions

None currently pending.

## Recent Changes

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
