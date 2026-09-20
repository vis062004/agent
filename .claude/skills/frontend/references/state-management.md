# State Management Decision Guide

State management is a decision to make per piece of state, not once for the whole app. Most apps end up using several of the tiers below simultaneously — that's correct, not inconsistent.

## The Escalation Path (Not a Rigid Rule)

```
Local state (useState/useReducer)
        │  needs to be read/changed outside this subtree?
        ▼
Context (cross-cutting, low-frequency-change state)
        │  needs to survive refresh / be shareable / bookmarkable?
        ▼
URL state (router search params)
        │  is this actually server-owned data, not UI state?
        ▼
Server state (TanStack Query or equivalent — see data-fetching.md)
        │  is this UI/client state that's genuinely global and complex?
        ▼
Redux / Redux Toolkit (or similar global client-state store)
```

Don't treat this as "always escalate as far as possible" — most state should stop at tier 1 or 2. Escalate only when the current tier's limitation is actually hit, not preemptively.

## Local State — Default Choice

Use `useState`/`useReducer` for anything owned and consumed within one component or a tightly-coupled parent/child pair. This covers the large majority of UI state: form field values before submit, a modal's open state, a selected tab, a hover/focus flag.

## Context — Cross-Cutting, Infrequently-Changing State

Good fit: theme, current authenticated user/session, locale, a feature-local setting read by many descendants. Context re-renders every consumer when its value changes — this is fine for values that change rarely (theme, auth) and a poor fit for values that change often (see `hooks.md`'s `useContext` section).

```tsx
const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

## URL State — Shareable/Bookmarkable UI State

Use the router's search params (not component state) for anything the user would expect to survive a refresh or share via link: current page number, active filters, sort order, selected tab if it's meaningful to link directly to it. This depends on the project's routing library — follow whatever's already chosen (`decision-making.md`).

## Server State — TanStack Query (or Equivalent)

Data that originates from the backend is not the same category as client UI state — it has its own caching/staleness/invalidation lifecycle. See `data-fetching.md` for the full pattern. Don't put server data in Redux/Context "for consistency" if a dedicated server-state tool is already in use or justified — that reintroduces manual cache invalidation the library already solves.

## Redux / Redux Toolkit — Complex, Genuinely Global Client State

Reach for Redux (prefer Redux Toolkit's patterns if Redux is used) when:
- State is shared across many unrelated features/routes, not just one subtree.
- State transitions are complex enough to benefit from explicit, testable reducers and middleware (multi-step workflows, undo/redo, cross-cutting business rules).
- You need devtools-style time-travel debugging or middleware (logging, persistence) for that state specifically.

Avoid Redux for:
- Local component state.
- Simple form state.
- Server state that a data-fetching library already handles.
- Temporary UI state (a single modal's open flag).

```tsx
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as CartItem[] },
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => { state.items.push(action.payload); },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
});

const store = configureStore({ reducer: { cart: cartSlice.reducer } });
type RootState = ReturnType<typeof store.getState>;
const useAppSelector = useSelector.withTypes<RootState>();
```

Introducing Redux (or any global client-state library) where the project doesn't already have one is a project-specific decision — confirm per `decision-making.md` rather than adding it by default because a feature "feels complex."

## Quick Reference

| Need | Use |
|---|---|
| State owned by one component/subtree | `useState`/`useReducer` |
| Cross-cutting, rarely-changing (theme, auth) | Context |
| Should survive refresh / be linkable | URL search params |
| Data that lives on the backend | Server-state tool (`data-fetching.md`) |
| Complex, genuinely app-wide client state | Redux Toolkit (if already adopted, or justified) |
