# Hooks

Before reaching for any hook, ask: **why does this need to exist as a hook, and would the component be simpler without it?** A hook is justified by a real requirement (side effect, expensive computation with proven cost, stable reference genuinely needed by a memoized child) — not by habit or "best practice" reflex.

## useState

**When to use:** a value that changes over time and drives what renders, owned by this component.
**When not to use:** for anything derivable from props/other state (compute it inline or `useMemo` if expensive — see Derived State below); for values that don't affect rendering (use `useRef` instead).
**Common misuse:** storing a copy of a prop in state and forgetting to sync it (stale prop mirror); splitting one logical value into many `useState` calls that must always update together (prefer one object/`useReducer`).
**Performance:** every `setState` call schedules a re-render of this component and its subtree — batch related updates, don't call `setState` in a tight loop without batching.
**Stale closures:** an event handler or effect closing over a `useState` value captures the value from that render. Use the functional updater (`setCount(c => c + 1)`) when the new value depends on the previous one, especially inside effects/callbacks with stale-looking dependencies.

```tsx
const [count, setCount] = useState(0);
setCount((c) => c + 1); // safe under stale closures / rapid updates
```

## useEffect

**When to use:** synchronizing with something outside React — subscriptions, manual DOM measurement, logging, imperative third-party library setup, a fetch that isn't already handled by a data-fetching hook/library.
**When not to use:** to compute a derived value from props/state (compute it during render instead); to respond to a prop change by calling `setState` (often it can be computed during render instead); as a general-purpose "run this after render" hammer.
**Common misuse:** fetching data directly in `useEffect` inside components instead of a dedicated data hook/library (duplicated loading/error/race-condition handling everywhere); missing cleanup causing duplicate subscriptions/memory leaks; effects that both read and write the same state, causing update loops.
**Dependency management:** the dependency array must list every reactive value the effect reads. Don't suppress the lint rule to silence it — fix the actual issue (wrap a stable function in `useCallback`, move a constant outside the component, or split the effect).
**Cleanup:** return a cleanup function for anything that persists past one render — event listeners, timers, subscriptions, in-flight requests (`AbortController`).
**Stale closures:** an effect only re-runs when its dependencies change; anything else it reads is frozen at the value from when the effect last ran. This is the #1 source of "why is this using an old value" bugs — fix by adding the missing dependency, not by disabling the rule.

```tsx
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  fetchData(id, { signal: controller.signal })
    .then((data) => { if (!cancelled) setData(data); })
    .catch((err) => { if (err.name !== 'AbortError') setError(err); });

  return () => { cancelled = true; controller.abort(); };
}, [id]);
```

## useMemo

**When to use:** a computation that is measurably expensive (sorting/filtering large arrays, heavy math) AND whose inputs don't change every render; or to preserve a stable object/array reference passed to a memoized child or an effect's dependency array.
**When not to use:** for cheap computations "just in case" — the memoization bookkeeping itself has a cost, and unmeasured `useMemo` sprinkled everywhere adds cognitive overhead for no proven benefit.
**Common misuse:** memoizing a value whose dependency array changes every render anyway (defeats the purpose); using it as a caching layer for server data (that belongs in the data-fetching layer, not `useMemo`).
**Performance implications:** recomputes whenever any listed dependency changes by reference — objects/arrays created inline in the dependency list defeat memoization.
**Derived state:** this is the correct tool for derived state that's actually expensive to compute — not a general substitute for `useState`.

```tsx
const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
```

## useCallback

**When to use:** the function is passed to a `React.memo`-wrapped child (to keep its prop reference stable) or is a dependency of another hook's dependency array.
**When not to use:** for every event handler by default — if the function isn't passed to a memoized child or used as a dependency, a new function reference each render costs nothing meaningful.
**Common misuse:** wrapping every function in `useCallback` "for performance" without a memoized consumer downstream, adding noise with no measurable benefit.
**Dependency management:** same rules as `useEffect` — list every reactive value the function closes over, or it will read stale values.

```tsx
const handleSelect = useCallback((id: string) => setSelectedId(id), []); // stable, no external deps
```

## useRef

**When to use:** a mutable value that must persist across renders but should NOT trigger a re-render when it changes (DOM node access, a timer/interval ID, a previous-value tracker, an instance of a non-React object).
**When not to use:** as a substitute for state that should drive rendering — if the UI needs to reflect the value, it's `useState`, not `useRef`.
**Common misuse:** reading/writing `ref.current` during render (refs are for effects/event handlers, not render logic — reading a ref during render can read stale or not-yet-attached values).
**Cleanup:** if a ref holds something with a lifecycle (a timer, a subscription object), clear/clean it up in the same effect that created it.

```tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => () => clearTimeout(timeoutRef.current), []);
```

## useContext

**When to use:** reading a value provided by an ancestor `Context.Provider` for genuinely cross-cutting state (theme, current user/session, a feature-local shared setting) — see `state-management.md` and `architecture.md`.
**When not to use:** as a substitute for prop-drilling avoidance at shallow depth (2-3 levels of props is often clearer than a Context); for state that changes very frequently and is read by many components (every consumer re-renders on every Provider value change — this can become a performance problem before Redux/a selector-based store would).
**Common misuse:** putting the entire app's state in one giant Context value, causing unrelated components to re-render on unrelated changes. Split into multiple Contexts by concern, or use a selector-capable store instead.

## useReducer

**When to use:** state transitions are complex enough that several related `useState` calls are hard to keep consistent (multi-field form/wizard state, state machines with distinct named actions), or the next state genuinely depends on the previous state via a well-defined transition function.
**When not to use:** for a single independent value — that's just `useState` with more ceremony.
**Common misuse:** using `useReducer` purely to mimic Redux's shape locally when `useState` would be simpler and equally clear.

```tsx
type Action = { type: 'setField'; field: string; value: string } | { type: 'reset' };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'setField': return { ...state, [action.field]: action.value };
    case 'reset': return initialState;
  }
}
```

## useId

**When to use:** generating a stable, unique id to link a label to an input, or an element to its `aria-describedby`/`aria-controls` target, especially in a component that may render multiple times on a page (SSR-safe, unlike `Math.random()` or a module-level counter).
**When not to use:** as a general-purpose unique key generator for list rendering — list `key` should come from stable data identity, not `useId`.

```tsx
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} type="email" />
```

## useTransition

**When to use:** marking a state update as non-urgent so an urgent update (typing in an input) stays responsive while a more expensive update (filtering a large list, navigating) happens without blocking.
**When not to use:** for updates that are already cheap — the pending-state bookkeeping isn't worth it if there's nothing to keep responsive.

```tsx
const [isPending, startTransition] = useTransition();
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setQuery(e.target.value); // urgent
  startTransition(() => setResults(filterLargeList(e.target.value))); // can be interrupted
}
```

## useDeferredValue

**When to use:** deferring a fast-changing value (like a text input) so a slow-rendering child based on it doesn't block typing — similar goal to `useTransition` but for a value you receive rather than a state setter you own.
**When not to use:** when you control the setter and can use `useTransition` directly; not needed for cheap renders.

```tsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => filterLargeList(deferredQuery), [deferredQuery]);
```

## useActionState

**When to use:** wiring a form to an async action (server action or async submit handler) while tracking pending state and the action's returned result/error, in React 19+.
**When not to use:** if the project isn't on React 19, or the form doesn't need pending/result tracking beyond simple local state — confirm the React version per `decision-making.md` before using it.

```tsx
async function submit(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;
  return await api.subscribe(email);
}

const [state, formAction, isPending] = useActionState(submit, initialState);
```

## Custom Hooks

Extract a custom hook when logic (state + effect + derived value, typically) would otherwise be duplicated across components, or when it meaningfully clarifies a component by naming a cohesive unit of behavior. A custom hook is just a function that calls other hooks — it follows every rule above (dependency arrays, cleanup, stale closures) for whatever hooks it composes.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

Don't extract a custom hook for a single `useState` with no other logic — that adds indirection without reducing duplication.

## Quick Reference

| Hook | Core purpose | Watch for |
|---|---|---|
| `useState` | Local render-driving value | Derived-state duplication |
| `useEffect` | Sync with something outside React | Missing deps, missing cleanup |
| `useMemo` | Cache an expensive computation / stable reference | Unmeasured "just in case" use |
| `useCallback` | Stable function reference for memoized children/deps | Overuse with no memoized consumer |
| `useRef` | Mutable value that shouldn't trigger render | Reading/writing during render |
| `useContext` | Read cross-cutting ancestor state | Over-broad Context causing over-rendering |
| `useReducer` | Complex, related state transitions | Used for simple independent state |
| `useId` | Stable unique id for a11y linking | Used as a list `key` |
| `useTransition` | Keep urgent updates responsive | Used where nothing is actually slow |
| `useDeferredValue` | Defer a fast-changing value | Overlaps with `useTransition` — pick one |
| `useActionState` | Async form action + pending/result | Requires React 19 — confirm first |
