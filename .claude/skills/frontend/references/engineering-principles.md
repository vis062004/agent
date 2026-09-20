# Engineering Principles

These are guidelines that inform judgment, not rules to apply mechanically. Every principle below has an explicit "don't over-apply this" clause — read it, not just the principle name.

## DRY (Don't Repeat Yourself)

Real duplication — the same logic, the same business rule, expressed in multiple places that must change together — should be consolidated. **DRY does not mean every visually similar block of code must be abstracted.** Three similar-looking lines in two unrelated places is cheaper to maintain than a shared abstraction whose one config knob exists only to paper over the fact that the two call sites weren't actually the same thing. See `component-design.md`'s reusability test for the concrete version of this judgment call for UI components.

## KISS (Keep It Simple)

Prefer the simplest implementation that correctly satisfies the requirement. **KISS does not mean skipping necessary architecture** (state ownership, error handling, accessibility) — it means not adding structure beyond what the requirement and its reasonably foreseeable evolution need. A simple wrong answer is not simpler than a right one.

## YAGNI (You Aren't Gonna Need It)

Build for the requirement in front of you. Don't add a config option, an extensibility hook, or a generalized abstraction for a future requirement that hasn't been stated. If a genuine future need is known (stated by the user, or clearly implied by the requirement), that's not a YAGNI violation to build for — YAGNI is about *speculative* generality, not about ignoring known scope.

## SOLID — Applied Where It Fits React, Not Forced

React components and hooks are not classes, and most SOLID guidance translates as a spirit, not a literal pattern:

- **Single Responsibility** — a component/hook should have one reason to change. A component that both fetches data, manages complex form state, and renders a chart is three responsibilities; split it (see `architecture.md`'s container/presentational split).
- **Open/Closed** — prefer extending behavior via composition/props (a `variant` prop, a `children` slot) over modifying a shared component's internals for one caller's special case.
- **Liskov Substitution** — a component accepting a more specific prop type should still work correctly wherever the more general type is expected; don't narrow behavior in a way that breaks callers relying on the general contract.
- **Interface Segregation** — don't force a component to accept a large prop object when it only needs two fields from it; accept what it actually uses.
- **Dependency Inversion** — a component/hook that needs data or a service should receive it (via props, a hook, or dependency injection through context) rather than importing a concrete implementation deep inside — this is what keeps common components free of business/feature coupling (`component-design.md`).

**SOLID does not mean creating an interface, a class hierarchy, or a dependency-injection framework for every component.** Apply the *spirit* (small, focused, composable units with clear contracts) using React's actual idioms (props, hooks, composition) — not by importing patterns from a different paradigm wholesale.

## Separation of Concerns

Keep UI, state, and data-access as distinct layers (`architecture.md`, `data-fetching.md`) — a component shouldn't know HTTP details, a service shouldn't know about React. This is what makes each layer independently testable and reusable.

## Composition Over Inheritance

React doesn't really offer component inheritance — this principle shows up as: build complex UI by composing small components (`children`, render props, slots) rather than building one large configurable component with many branching props. See `architecture.md`'s composition example.

## Law of Demeter (where relevant)

A component shouldn't reach deep into an object it was handed to pull out a grandchild property (`employee.department.manager.name` scattered across many components) — pass what's needed, or provide a small selector/accessor, so a shape change doesn't ripple through every consumer.

## Clean Boundaries

Each layer (component, hook, service, store) should have a contract that's clear from its signature/props/return type without needing to read its implementation. If understanding how to use something requires reading its internals, the boundary isn't clean yet.

## Comments: WHY, Not WHAT

Code with good names already says *what* it does — don't restate that in a comment. Write a comment when there's a non-obvious reason a reader couldn't infer from the code alone: a hidden constraint, a workaround for a specific bug/browser quirk, a business rule, a performance or security trade-off, a tricky edge case.

```tsx
// Bad — restates the code
// Set loading to true
setLoading(true);

// Good — explains a non-obvious WHY
// Keep the previous page's data visible while the next page loads
// to avoid a layout flash during pagination.
const data = keepPreviousData ? previousData : currentData;
```

Document (in comments, or a short note in the PR/summary — whichever fits): architecture decisions that weren't obvious from the code, non-obvious business rules, performance decisions (why this was memoized when most things aren't), security decisions (why a value is masked/not stored), tricky edge cases, and the contract of a reusable component if it's not self-evident from its prop types.

## Applying All of This Together

None of these principles override the concrete guidance elsewhere in this skill (the reusability test in `component-design.md`, the memoize-only-with-evidence rule in `performance.md`, the ask-before-assuming rule in `decision-making.md`). They're the reasoning behind those rules — use them to make judgment calls in situations this skill doesn't spell out explicitly, not to argue past the explicit guidance.
