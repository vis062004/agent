# Folder Structure

There is no single mandatory structure — choose based on project size and complexity, and follow whatever the project has already established over anything below. Don't create empty folders "for completeness"; add a folder when the first file that belongs in it exists.

## The Decision

| Organize by | When |
|---|---|
| **Layer-based** (`components/`, `hooks/`, `services/` at the top, feature code mixed within each) | Small app, few features, a small team — the overhead of feature folders isn't earning its keep yet. |
| **Feature-based** (`features/<name>/` owns its own components/hooks/api, plus a small shared layer) | Growing app, multiple features that don't share much beyond a few common components, multiple people working on different features in parallel. |
| **Hybrid** (this skill's default reference shape) | Most real apps: a feature-based split for anything feature-specific, plus a genuinely shared layer for what's actually reused. |

## Reference Shape (Hybrid)

```
src/
  app/                # app shell: routing setup, providers, top-level layout
  components/
    common/            # shared, business-logic-free UI (Button, Modal, Table...) — see component-design.md
  features/
    <feature>/
      components/       # feature-specific components (not shared)
      hooks/             # feature-specific hooks
      api/                # service layer calls for this feature — see data-fetching.md
      types.ts
  hooks/               # cross-feature reusable hooks (useDebounce, useMediaQuery)
  services/            # shared infra: httpClient/graphqlClient, auth
  store/               # global client-state store, only if one is adopted — see state-management.md
  styles/              # SCSS abstracts/base/layout/themes — see scss.md
  utils/               # pure helper functions with no framework dependency
  types/               # shared cross-feature types
  config/              # environment/config constants
  assets/              # static assets (images, fonts)
  routes/              # route definitions, if not colocated with app/
```

Don't force every one of these folders into existence on day one — start with what the current feature set needs and grow the structure as real second/third use cases appear, the same discipline as `component-design.md`'s reusability test applied to folders.

## Rules That Apply Regardless of Structure

- Don't create a folder for a single file.
- Don't create an abstraction folder (`context/`, `store/`) until at least one thing actually lives there.
- A feature should not import another feature's internals directly — shared code moves to `components/common`, `hooks/`, `services/`, or `utils/` first.
- Naming stays consistent regardless of layer vs. feature split: `PascalCase` for components (one component per file), `useCamelCase` for hooks, `camelCase` for other modules, colocated `ComponentName.test.tsx` for tests.

## Choosing Between Them

Ask: *how often do people work across multiple features at once, and how much do features actually share beyond common UI?* Frequent cross-feature work with heavy sharing favors layer-based; independent parallel feature work favors feature-based. If genuinely unclear and it materially affects how a sizeable piece of work should be organized, this is worth confirming with the user rather than guessing for a large restructure — a single new feature folder within an existing structure does not need to ask, just follow the existing pattern.
