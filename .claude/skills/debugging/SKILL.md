---
name: debugging
description: Root-causes a crash, error, or unexpected behavior by identifying the exact responsible code and the specific mechanism by which it causes the symptom, then proposes the smallest possible fix. Use when investigating a bug, crash, or wrong behavior in existing code. Do not use for building new features — that's requirement-gathering + the relevant domain skill.
metadata:
  domain: workflow
  triggers: bug, crash, error, exception, stack trace, unexpected behavior, restart, freeze, regression, root cause
  role: specialist
  scope: analysis
  output-format: analysis-and-code
  related-skills: frontend
---

# Debugging — Root-Cause Analysis

Prioritize **root-cause analysis over code rewriting**. The job is to find the exact line or
operation responsible and explain the causal mechanism — not to hand back generic advice
("optimize the image", "add error handling") unless the code in front of you actually shows
why that specific thing is needed.

## Core Workflow

1. **Reproduce the conditions from the report, not a generic version of them.** "Crashes on image upload" and "crashes sometimes" call for different amounts of evidence before you can name a cause — if the trigger is specific, the cause claim must be specific too.
2. **Identify the exact problematic code.** Name the file, the line(s)/operation, not a general area. If the provided code doesn't contain enough evidence to pin this down, say exactly what additional code/logs/repro steps are needed — do not guess past what's shown.
3. **Explain the causal mechanism.** Why does *this* code cause *this* specific symptom, under *these* specific conditions (e.g. "why does the app restart specifically when a customer uploads an image" — not "large files can cause issues" in the abstract)?
4. **Determine the category.** Memory usage, resource size, file/data handling, third-party/native module behavior, state updates, rendering, network, concurrency, configuration — or another specific cause evident from the code. Name the one that actually applies; don't hedge across several unless the evidence genuinely supports more than one.
5. **Find the smallest fix.** The minimal change that addresses the root cause — not a rewrite, not a refactor, not an unrelated improvement.
6. **Verify against the actual code shown**, not a hypothetical version of it, before presenting the fix.

## Reference Guide

| Topic | Reference | Load When |
|---|---|---|
| Worked example | `references/worked-example.md` | Want a concrete end-to-end pass through the process (memory/OOM root cause) |

## Output Format

### Fix
One or two sentences: the smallest change required and why it resolves the identified cause.

### Corrected Code
Only the changed lines/function — not the surrounding file, not unrelated sections.

## Constraints

### MUST DO
- Point to the exact code responsible (file + line/operation), not a general area of the codebase.
- Explain why this code causes this specific symptom under these specific conditions.
- Give the smallest possible fix.
- State plainly what's missing if the given code isn't enough to identify one root cause, instead of guessing.

### MUST NOT DO
- Do not rewrite, refactor, or modify code unrelated to the identified cause.
- Do not propose multiple speculative fixes when the evidence points to one cause.
- Do not give generic advice ("optimize images", "add try/catch", "add null checks everywhere") unless the code shown specifically demonstrates that's the mechanism.
- Do not assume framework/library internals not evidenced by the code or its imports/version.

## When the Domain Matters

Root-causing the *mechanism* (why this line does this) is domain-independent and lives here.
Once the cause is identified, fixing it correctly may need domain knowledge — e.g. a frontend
rendering/memory cause should follow `../frontend/references/performance.md`'s guidance on
what the correct fix looks like, rather than an ad-hoc patch. Load that domain skill for the
*fix* step if the cause is domain-specific; this skill's job is getting to the cause.
