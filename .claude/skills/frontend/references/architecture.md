# Component & Feature Architecture

## Component Boundaries

Split by responsibility, not by file-size habit:

- **Container/page components** — own data fetching and state for a screen or feature slice. Talk to hooks/services, pass data down as props.
- **Presentational components** — receive props, render UI, raise events via callbacks. No direct API calls, no knowledge of where their data came from.

This split is a default, not a law — a small feature can legitimately keep both in one component. Split when the component starts doing two distinct jobs (fetching *and* complex rendering logic) or when the presentational half becomes reusable elsewhere.

```tsx
// Container — owns data + state
function EmployeeListPage() {
  const { data, isLoading, error } = useEmployees();

  if (isLoading) return <TableSkeleton rows={8} />;
  if (error) return <ErrorState message="Couldn't load employees." onRetry={refetch} />;
  if (!data?.length) return <EmptyState title="No employees yet" />;

  return <EmployeeTable employees={data} />;
}

// Presentational — pure render, no fetching
function EmployeeTable({ employees, onSelect }: { employees: Employee[]; onSelect?: (id: string) => void }) {
  return (
    <table>
      <tbody>
        {employees.map((e) => (
          <tr key={e.id} onClick={() => onSelect?.(e.id)}>
            <td>{e.name}</td>
            <td>{e.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Feature Boundaries

A "feature" is a vertical slice of the app around one business capability (e.g. `employees`, `invoicing`). Keep a feature's components, hooks, and API calls together; only promote something to a shared/common location once a second feature genuinely needs it (see `component-design.md`).

Cross-feature imports should go one direction: features can depend on `components/common`, `hooks/` (cross-cutting), and `services/`, but features should not import from each other's internals. If two features need to share something, that something belongs in a shared location, not in a cross-feature import.

## Composition Over Configuration

Prefer composing small components together over building one component with many conditional branches:

```tsx
// Prefer composition
<Card>
  <CardHeader title="Invoice #1024" />
  <CardBody>{children}</CardBody>
  <CardFooter><Button>Pay</Button></CardFooter>
</Card>

// Over a single component branching on props like variant="withHeaderAndFooter"
```

Composition keeps each piece's contract small and lets call sites opt in to only what they need — see `component-design.md` for where the API-complexity line is.

## Custom Hooks for Logic Extraction

Extract a custom hook when component logic (state + effects + derived values) would otherwise be duplicated, or when a component's render function is dominated by non-rendering logic. Don't extract a hook for a single `useState` call with no other logic — that's not doing enough to earn the indirection. See `hooks.md` for the full custom-hook pattern and cleanup rules.

## Controlled vs. Uncontrolled Components

- **Controlled** — value lives in the parent/React state; the component is a pure reflection of props. Use when the parent needs to read, validate, or react to every change (most form fields in an app with validation).
- **Uncontrolled** — value lives in the DOM, read via `ref` on demand. Use for simple, self-contained inputs (a single search box read on submit, file inputs, third-party widgets that manage their own DOM state).

Don't mix the two for the same input (an input with both a `value` and no `onChange`, or a `defaultValue` fought by external state updates) — that produces the classic "changed a controlled input to be uncontrolled" warning and unpredictable behavior.

## State Ownership & Derived State

- Put state at the lowest component that needs it. Lift only when a sibling or ancestor genuinely needs to read or change it too.
- Don't store what can be computed from existing state/props. `const fullName = \`${first} ${last}\`` is derived, not state — computing it on every render (or via `useMemo` if the computation is actually expensive) beats syncing a redundant `fullName` state variable that can drift out of sync.
- See `state-management.md` for the full local → Context → URL → server-state → Redux decision guide.

## Server State vs. Client State vs. URL State

These are three different categories with different lifecycles — don't collapse them into one state mechanism:

- **Server state** — data that lives on the backend and is cached locally (a list of records, a user profile). Owned by a data-fetching layer (`data-fetching.md`), not `useState`/Redux, because it has its own staleness/invalidation lifecycle.
- **Client state** — UI-only state with no server counterpart (a modal's open/closed flag, a selected tab, form draft values before submit).
- **URL state** — state that should survive a refresh or be shareable/bookmarkable (current page number, active filter, selected tab if it should be linkable). Lives in the router's search params, not component state.

## Context

Use React Context for state that's genuinely cross-cutting within a subtree (theme, current-user/auth session, a feature-local setting shared by many descendants) — not as a default global store. A Context that only one or two components read is unnecessary prop-drilling avoidance for a drilling depth that didn't justify it. See `state-management.md` for the full comparison against Redux.
