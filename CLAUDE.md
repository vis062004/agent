# Repo Router — Read This First, Always

This file is the single entry point. It is auto-loaded every session — nothing else in
`.claude/` is. **Do not open any skill's reference files speculatively.** Decide the route
from this file's tables, then open only what that route names. This is the mechanism that
keeps token usage low: one small file read every time, instead of scanning the repo.

## 1. Memory Check (do this before anything else)

Read `.claude/memory/MEMORY.md` first — it's small and answers most "what already exists /
what was decided / what's in progress" questions without re-reading source files or
re-deriving context from scratch.

- If memory answers the question → use it, don't re-read the underlying files.
- If memory doesn't cover it → read only the specific file(s) the current task actually
  touches. Never re-read a file already in this session's context.
- If context is getting heavy and the next task is unrelated to what's loaded → suggest
  `/clear`, then rely on memory to pick the thread back up.
- **After any meaningful change** (a decision confirmed, a file created/changed, a question
  answered) — update `.claude/memory/MEMORY.md` before ending the turn. Stale memory is
  worse than no memory.

## 2. Skill Routing Table

Match the requirement's domain, then load only that skill's `SKILL.md` (which routes further
into its own references as needed):

| Requirement is about... | Route to |
|---|---|
| React components, screens, hooks, forms, state, styling, frontend data-fetching, frontend a11y/security/performance | `.claude/skills/frontend/SKILL.md` |
| A bug, crash, error, or "why does X happen" on existing code | `.claude/skills/debugging/SKILL.md` |
| Node.js/Express backend, API routes | `.claude/skills/backend/SKILL.md` — **not created yet**; say so and ask before improvising backend guidance |
| SQL/database schema, queries | `.claude/skills/database/SKILL.md` — **not created yet**; same rule |
| Test writing/strategy | `.claude/skills/testing/SKILL.md` — **not created yet**; same rule |

If a requirement spans more than one row (e.g. a screen that also needs a new API), route to
each relevant skill for its own layer — don't let one skill improvise another's domain.

## 3. Task Mode — Classify Before Acting

Every incoming requirement is one of three modes. Identify which one before doing anything else.

| Mode | Trigger | What to do |
|---|---|---|
| **New Screen/Feature** | Building something that doesn't exist yet | Run the Requirement-Gathering Protocol (§4) in full before writing any code. |
| **Change Request** | Modifying an existing screen/behavior | Read *only* the specific file(s) the change touches. Confirm the exact scope with the user if it's not fully unambiguous from their message. Implement the minimal diff — no unrelated edits, no drive-by refactors. |
| **Bug Fix** | Something is crashing/erroring/behaving wrong | Route to `.claude/skills/debugging/SKILL.md` — root-cause analysis, smallest fix, no rewrites. |

## 4. Requirement-Gathering Protocol (New Screen/Feature mode)

Do not start implementing until the requirement is actually complete. For a screen/form,
"complete" means you can answer all of:

- What are all the fields/inputs? Exact names, labels/headers, and data types.
- Which fields are mandatory vs. optional, and are any *conditionally* mandatory?
- What validation/business logic applies per field (format, range, cross-field rules)?
- What does the API/data contract look like (if this reads/writes data)?
- What are the loading/empty/error states supposed to show?
- Anything conditional/dynamic about the UI itself (fields that appear/disappear, dependent fields)?

If any of this is missing, **ask** — specific, itemized questions, not one vague "any other
requirements?". Do not assume a field, a validation rule, or a behavior that wasn't stated or
isn't already evident in the codebase. Only once the answers are sufficient to implement
without guessing, proceed — and only then load the relevant skill from §2.

This also applies one level down inside whichever skill is loaded (e.g. `frontend`'s own
`decision-making.md` for stack-level unknowns like state management or API style) — this
protocol is about the *feature's requirements*, the skill's own decision guide is about
*technical* unknowns. Both must be resolved before code is written.

## 5. Change & Git Discipline

- Confirm scope before implementing anything beyond exactly what was asked.
- Confirm with the user before `git push` or any change to remote state, unless they've
  already explicitly told you to push as part of this same request.
- Never fold in an unrelated fix/cleanup while doing a requested change — flag it separately
  instead.

## 6. Token-Optimization Summary

- Read `.claude/memory/MEMORY.md` before anything else (§1).
- Route once (§2), load only the named skill — not every skill folder "just in case."
- For a Change Request, read only the file(s) being changed — not the surrounding module,
  not the whole feature, unless the change genuinely requires that context.
- Don't re-read anything already in this session's context.
- Update memory as you go, not in one big pass at the end of a long session.
