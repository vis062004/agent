---
name: frontend
description: Guides disciplined, production-grade React frontend engineering through explicit decision frameworks rather than fixed technology choices - component architecture, reusable UI design, hooks, state management, REST/GraphQL data fetching, forms, SCSS styling, accessibility, responsive UI, performance, and frontend security. Use when building, reviewing, or architecting React components, hooks, forms, API integration, state management, styling, or frontend performance/accessibility/security work. Do not use for backend, database, or infrastructure tasks.
metadata:
  domain: frontend
  triggers: React, component, hook, useState, useEffect, state management, Redux, TanStack Query, GraphQL, Axios, form, SCSS, responsive, accessibility, frontend performance, frontend security, design system
  role: specialist
  scope: implementation
  output-format: code
  related-skills: debugging
---

# Frontend Engineering

Senior frontend engineer discipline for React applications. This skill's job is not to hand you a fixed stack — it is to make you reason like a senior engineer: identify what's actually unknown, ask before assuming it, choose the simplest structure that fits the requirement, and avoid both under-engineering (duplicated one-off UI) and over-engineering (generic abstractions nobody asked for).

**This skill does not prescribe a framework version, state library, API style, CSS approach, or test runner.** Every reference in this skill teaches a *decision process* for that category, plus idiomatic implementation patterns once the decision is made. If the current project has already decided (an existing `package.json`, an existing pattern in the codebase, an explicit instruction from the user), follow that — do not relitigate a settled decision. If it is genuinely undecided and material to the task, ask.

## When to Use This Skill

- Building or modifying React components, screens, or custom hooks
- Deciding component boundaries or whether something should become a reusable component
- Choosing or implementing state management (local, Context, URL, server-state, Redux)
- Integrating with a backend API (REST via Axios, or GraphQL)
- Building forms (explicit, field-component, or configuration-driven)
- Styling with SCSS, theming, responsive layout
- Accessibility, loading/error/empty states, or frontend performance work
- Frontend security review (XSS, token handling, sensitive data exposure)
- Frontend testing strategy for components, hooks, or user flows

Not for backend/API-contract design, database work, or infrastructure/DevOps — those belong to other skills.

## Core Workflow

1. **Identify unknowns, then reason through the architecture.** Confirm framework/React version, TypeScript, state management, REST vs GraphQL, CSS approach, and test stack — ask if genuinely unmade and not inferable from the codebase. For anything non-trivial, run the 13-point checklist in `references/decision-making.md` (requirement → reuse → state ownership → API shape → boundaries → a11y → responsive → error/loading states → performance → security → testing → maintainability). A one-file, one-function change doesn't need this ceremony.
2. **Design before abstracting.** Before creating any shared component, hook, or form renderer, apply the reusability test in `references/component-design.md` — real reuse (2+ genuine call sites, stable contract) earns an abstraction; visual similarity alone does not.
3. **Implement** with typed, accessible, responsive code, following the relevant references below. Keep API/service calls in a service layer, never raw `fetch`/`axios` in components (`references/data-fetching.md`).
4. **Cover the async states.** Every data view implements loading, success, empty, and error (with retry) — `references/loading-error-states.md`.
5. **Validate.** Type-check and lint with whatever the project already uses; do not introduce a new tool without asking. Verify keyboard navigation and at least one narrow-viewport layout by inspection.
6. **Test what matters.** Business logic, complex hooks, reusable components, and critical flows — `references/testing.md`. Use the project's existing test stack; ask before introducing one.

## Key Pattern

The layering this skill assumes throughout, once state/data decisions are made (details in `references/architecture.md` and `references/data-fetching.md`):

```tsx
// Container — owns data + state, delegates rendering
function EmployeeListPage() {
  const { data, isLoading, error, refetch } = useEmployees(); // hook wraps the service layer

  if (isLoading) return <TableSkeleton rows={8} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data.length) return <EmptyState title="No employees yet" />;

  return <EmployeeTable employees={data} />; // presentational — props in, render out
}
```

`useEmployees` calls a typed service function, which calls the centralized Axios instance — never `axios`/`fetch` directly here. See `references/data-fetching.md` for the full chain.

## Reference Guide

Load only what the task needs — this file stays the entry point, references carry the depth.

| Topic | Reference | Load When |
|---|---|---|
| Decision process & ask-before-acting rule | `references/decision-making.md` | Start of any non-trivial feature, or any unknown technology decision |
| Component & feature architecture | `references/architecture.md` | Component boundaries, container/presentational split, state ownership, composition |
| Reusable component & icon design | `references/component-design.md` | Creating/evaluating a shared component, prop API design, package-readiness |
| Hooks | `references/hooks.md` | Built-in hooks (useState…useActionState) and custom hooks — when to use, misuse, cleanup |
| Rendering performance | `references/performance.md` | Re-render diagnosis, memoization, virtualization, code splitting |
| State management decision | `references/state-management.md` | Choosing local state vs Context vs URL vs server-state vs Redux |
| Data fetching (Axios/REST/TanStack Query) | `references/data-fetching.md` | HTTP client architecture, service layer, TanStack Query, error normalization |
| GraphQL | `references/graphql.md` | Project has chosen (or is choosing) GraphQL over REST |
| Forms | `references/forms.md` | Any form — decision between explicit, field-component, or config-driven; array-driven mandatory fields, input sanitization, dependent/cascading fields |
| SCSS & theming | `references/scss.md` | Styling architecture, design tokens, theme, responsive breakpoints |
| Responsive UI | `references/responsive-ui.md` | Multi-viewport layout, overflow, text scaling |
| Accessibility | `references/accessibility.md` | Semantic HTML, keyboard nav, focus, ARIA, forms/dialogs a11y |
| Loading/empty/error states & notifications | `references/loading-error-states.md` | Async UI states, skeletons, centralized error handling, toasts |
| Frontend security | `references/security.md` | XSS, token/secret handling, sensitive data, uploads, dependency risk |
| Testing | `references/testing.md` | Unit/component/integration/E2E scope and prioritization |
| Folder structure | `references/folder-structure.md` | Choosing feature-based vs layer-based vs hybrid organization |
| Engineering principles | `references/engineering-principles.md` | DRY/KISS/SOLID/YAGNI as guidelines, comment philosophy (WHY not WHAT) |

## Constraints

### MUST DO
- Ask before assuming any project-specific decision: framework/React version, TypeScript, state library, REST vs GraphQL, CSS approach, design system, test framework, API contract shape. See `references/decision-making.md`.
- Apply the reusability test before creating a shared component, hook, or abstraction (`references/component-design.md`).
- Drive a form's required/mandatory indicators and base validation from one shared array/config, never a hardcoded `required`/`isMandatory` per field (`references/forms.md`).
- Keep business logic out of common/shared UI components.
- Route all HTTP calls through a service layer, never inline `fetch`/`axios` in components (`references/data-fetching.md`).
- Implement loading, error (with retry), and empty states for every async view.
- Treat client-side validation as UX only — the backend is the authorization/validation boundary (`references/security.md`).
- Use semantic HTML and label every interactive control before reaching for ARIA.
- Diagnose an actual rendering or network problem before optimizing it.
- Write comments that explain WHY (a constraint, a workaround, a non-obvious trade-off), never WHAT the code already says.

### MUST NOT DO
- Do not invent a framework version, library, API shape, or convention the project hasn't specified.
- Do not create a generic/config-driven abstraction (form renderer, wrapper component) for a single call site.
- Do not reach for `useMemo`/`useCallback`/`useEffect` by default — justify each with an actual, identified need.
- Do not introduce Redux, GraphQL, TanStack Query, a CSS framework, or a test framework the project hasn't already adopted without asking first.
- Do not treat frontend validation, role hiding, or disabled UI as a security boundary.
- Do not expose stack traces, internal URLs, or raw backend error bodies to end users.
- Do not build a sample application, fake API, or demo component as part of this skill's own work.

## Ask-Before-Acting Examples

> "I need to know whether this API is REST or GraphQL before designing the data layer."
> "I need to know whether Redux (or another global store) is already part of this application, or whether Context/local state is sufficient."
> "I need to know which React version and whether TypeScript is in use before choosing patterns (e.g. `useActionState` requires React 19)."
> "I need to know whether this project uses SCSS modules or global SCSS."
> "I need the API response shape before implementing the service/hook layer."
> "I need to know whether this component is reusable across features or is feature-specific before deciding where it lives."
> "I need to know whether this form is metadata-driven or has custom per-field behavior."

Never silently choose in these cases — ask, then proceed once the decision is known.
