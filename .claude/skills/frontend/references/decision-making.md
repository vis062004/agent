# Decision-Making & Ask-Before-Acting

This is the entry point for any non-trivial frontend task. It has two jobs:
1. Give you a repeatable process for reasoning through a feature before writing code.
2. Tell you exactly which decisions are yours to make and which are the user's.

## The Architectural Decision Process

For any feature beyond a one-file, one-function change, reason through these in order before implementing. Keep it proportional — a few sentences of reasoning for a medium feature, more for something touching multiple screens or the data layer. Do not skip straight to code.

1. **Requirement** — What is actually being asked? What's explicitly in scope vs. adjacent-but-not-asked?
2. **Existing architecture** — What patterns, components, hooks, and conventions already exist in this codebase? Read before writing; match what's there.
3. **Reuse opportunities** — Does a component/hook/service already do this or most of this? See `component-design.md` for the reusability test.
4. **State ownership** — What state does this feature need, and where should it live? See `state-management.md`.
5. **API/data requirements** — What does the backend contract look like? REST or GraphQL? What's the response shape, pagination, error format? If unknown, this blocks implementation — ask.
6. **Component boundaries** — What's a container (fetches/holds state) vs. presentational (renders props)? See `architecture.md`.
7. **Accessibility** — Semantic elements, labels, keyboard paths, focus management for anything new. See `accessibility.md`.
8. **Responsive behavior** — How does this hold up on a narrow viewport, with long content, with more rows/items than the happy-path case? See `responsive-ui.md`.
9. **Error/loading/empty states** — All four states (loading, success, empty, error) for anything async. See `loading-error-states.md`.
10. **Performance** — Any known-expensive operation (large list, heavy computation, frequent re-render source)? Only optimize what you can identify, not speculatively. See `performance.md`.
11. **Security** — Any user input rendered as HTML/URL/attribute? Any sensitive data displayed or stored? See `security.md`.
12. **Testing** — What here is business logic, a complex hook, or a critical path that deserves a test? See `testing.md`.
13. **Maintainability** — Will the next engineer understand this without you? Is anything here duplicated that should be consolidated, or abstracted that shouldn't be?

Then implement.

## Decision Index

Each of these is a genuine fork in the road with more than one valid answer. Don't default silently — follow the guide, and ask when the guide says the answer depends on project facts you don't have.

| Decision | Where it's covered | Default bias if truly unconstrained |
|---|---|---|
| Local state vs. Context vs. URL vs. server-state vs. Redux | `state-management.md` | Start local, escalate only when the next level's justification is met |
| REST vs. GraphQL | `data-fetching.md`, `graphql.md` | Follow the existing/decided backend contract — never introduce a second API style without cause |
| Explicit form vs. field components vs. config-driven renderer | `forms.md` | Explicit, unless the repetition/metadata-driven criteria are clearly met |
| Feature-based vs. layer-based vs. hybrid folders | `folder-structure.md` | Layer-based for small apps, feature-based once feature count/team size grows |
| Global SCSS vs. CSS Modules vs. CSS-in-JS | `scss.md` | Follow what the project already uses; SCSS is this skill's documented default when nothing is chosen yet |
| Memoize vs. leave alone | `performance.md` | Leave alone until you can show the re-render/cost is real |

## What Is Never Assumed

Do not silently decide any of the following. If the codebase already answers it (a `package.json` dependency, an existing pattern used elsewhere in the app), follow that — reading the codebase is not "assuming." If nothing in the codebase answers it and the task needs an answer to proceed, ask the user:

- React version / whether TypeScript is used
- Bundler (Vite, webpack, CRA, Next.js, etc.) and routing library
- State management library (if any beyond built-in React)
- API architecture: REST vs. GraphQL, response envelope shape, pagination style, error format
- Authentication/authorization mechanism and where tokens live
- UI library / component kit (or "no library, build from scratch")
- CSS approach (SCSS, CSS Modules, Tailwind, CSS-in-JS, plain CSS)
- Testing framework (Jest, Vitest, React Testing Library, Playwright, Cypress, none yet)
- Accessibility or browser-support target beyond general best practice
- Design system / brand colors beyond the neutral default this skill documents (`scss.md`)
- Backend contract details (response shapes, pagination, error format) for any endpoint not yet defined
- Package manager, linting/formatting tool choice
- Deployment environment specifics

## How to Ask

State what's blocking, in one sentence, with the concrete options if you know them:

> "I need to know whether this API is REST or GraphQL before designing the data layer."
> "This project has no state-management library yet — is Context sufficient, or is there a reason to add Redux/Zustand/similar?"
> "I don't see an existing form pattern in this codebase — should this be an explicit form, or is there a shared form-field/config pattern I should follow?"

General engineering principles (accessibility basics, avoiding unnecessary re-renders, not committing secrets) apply automatically and do not need to be asked about — those are described throughout this skill's other references. Project-specific technology and architecture choices do.
