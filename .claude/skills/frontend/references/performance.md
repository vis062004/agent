# Rendering & Performance

**Diagnose before you optimize.** Every technique below has a cost (complexity, readability, sometimes worse performance if misapplied). Identify the actual cause — an unnecessarily re-rendering subtree, an expensive computation on the render path, a network waterfall, a bundle that's too large for the initial route — before reaching for a fix. "This might be slow" is not a diagnosis.

## Diagnosing Re-renders First

Before adding `memo`/`useMemo`/`useCallback` anywhere, confirm there's a real problem:
- Use React DevTools Profiler to see which components re-render and why.
- Ask: does this component re-render more often than its output actually changes? Is the re-render itself expensive (large DOM, heavy computation), or is a cheap re-render just being mistaken for a problem?
- A component re-rendering is not inherently bad — React's reconciliation is fast for small trees. Optimize the ones that are both frequent and expensive.

## Component Boundaries & Stable Props

Often the actual fix for "too much re-renders" is restructuring, not memoizing:
- Move state closer to where it's used so a state change re-renders a smaller subtree, not the whole page.
- Split a component so the part that changes often (a live counter, a form field) is isolated from the part that's expensive to render (a large list, a chart).
- Pass primitives instead of new objects/arrays where possible — a new `{}`/`[]` literal every render defeats prop-equality checks (`React.memo`, dependency arrays) regardless of memoization elsewhere.

```tsx
// Problem: style/onClick are new references every render, breaking memo(Child)
function Parent() {
  return <Child style={{ color: 'red' }} onClick={() => doThing()} />;
}

// Fix: lift the stable value out, memoize the handler only if Child is memoized
const redStyle = { color: 'red' };
function Parent() {
  const handleClick = useCallback(() => doThing(), []);
  return <Child style={redStyle} onClick={handleClick} />;
}
```

## React.memo, useMemo, useCallback

Use them once you've identified a specific, expensive re-render or computation — see `hooks.md` for per-hook when/when-not guidance. A rule of thumb: memoizing a component only helps if its props are actually stable across the parent's re-renders; memoizing a component whose props change every render adds overhead for nothing.

```tsx
const ExpensiveRow = memo(function ExpensiveRow({ item }: { item: Row }) {
  return <tr>{/* expensive render */}</tr>;
});
```

## List Rendering & Virtualization

- Always use a stable, unique `key` (an id from the data) — never array index for a list that can reorder, filter, or have items inserted/removed.
- Paginate or filter server-side before rendering when the full dataset is large; don't fetch 10,000 rows to render 20.
- Virtualize (render only visible rows) once a list is large enough that DOM node count itself is the bottleneck (roughly hundreds+ of rows, not tens) — a heavy dependency to add for a 30-row table.

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```

## Code Splitting & Suspense

Split heavy, infrequently-needed routes/components so the initial bundle stays small:

```tsx
const AdminPanel = lazy(() => import('./AdminPanel'));

<Suspense fallback={<PageSkeleton />}>
  {showAdmin && <AdminPanel />}
</Suspense>
```

Apply Suspense boundaries where the project's data-fetching approach supports them (e.g. a library with Suspense-enabled queries, React 19 `use()`); don't force a Suspense boundary around code that isn't actually async.

## Network: Waterfalls, Duplicate Requests, Caching

- Kick off independent requests in parallel, not sequentially awaited one after another (a network waterfall). If B doesn't depend on A's result, start both immediately.
- Avoid duplicate in-flight requests for the same resource from multiple components — centralize fetching in a hook/query layer that dedupes by key (see `data-fetching.md`'s TanStack Query section, or a shared in-flight-request map if not using a library).
- Cache server responses with an explicit staleness policy rather than refetching on every mount; see `data-fetching.md`.
- Consider optimistic updates for actions where immediate feedback matters and rollback-on-failure is straightforward (see `data-fetching.md`) — not for actions with complex server-side side effects that are hard to predict/rollback.

## Expensive Calculations

Profile before assuming a calculation is the bottleneck. If it genuinely is (large sort/filter/aggregation on the render path), memoize it with `useMemo` keyed on its actual inputs, or move it server-side/into a worker if it's large enough to block the main thread noticeably.

## What NOT to Do

- Don't wrap every component in `React.memo` "defensively."
- Don't add `useMemo`/`useCallback` to values/functions with no memoized consumer.
- Don't virtualize a list of 20 items.
- Don't introduce a caching library before confirming the project needs one (see `decision-making.md`).
- Don't chase a performance concern that hasn't been observed or profiled — a hypothetical slow list on a page nobody has reported as slow is not a task.
