# SCSS Architecture & Theming

SCSS is this skill's documented default styling approach when the project hasn't already chosen one (CSS Modules, Tailwind, CSS-in-JS) — if the project has already chosen differently, follow that instead and treat this file as inapplicable (`decision-making.md`).

## File Organization

A partials-based structure scales without becoming unmanageable; adapt scope to project size, don't scaffold every folder for a small app:

```
styles/
  abstracts/
    _variables.scss   # design tokens: color, spacing, typography, breakpoints, z-index
    _mixins.scss       # reusable mixins (e.g. responsive breakpoint helper)
    _functions.scss     # SCSS functions (e.g. rem() conversion)
  base/
    _reset.scss
    _typography.scss
  layout/
    _grid.scss
    _container.scss
  components/          # one partial per shared component, mirrors components/common/
  themes/
    _light.scss
    _dark.scss          # only if theming beyond one palette is required
  main.scss             # imports everything, in order: abstracts → base → layout → components → themes
```

Component-local styles (scoped to one component, e.g. via CSS Modules `*.module.scss` or a colocated `Component.scss`) can live next to the component instead of in `styles/components/` — follow whatever the project has already established for scoping.

## Design Tokens (Variables)

Centralize every repeated value — color, spacing, radius, shadow, font size, z-index — as a token. No component should hardcode a hex color or a magic pixel value that a token already covers.

```scss
// abstracts/_variables.scss
$color-primary:      #1d4ed8;   // blue — see Default Theme below
$color-primary-dark:  #1e3a8a;
$color-surface:       #ffffff;
$color-surface-alt:   #f8fafc;  // off-white
$color-text:          #0f172a;
$color-text-muted:    #475569;
$color-border:        #e2e8f0;
$color-danger:        #dc2626;
$color-success:       #16a34a;

$space-1: 4px;  $space-2: 8px;  $space-3: 12px;
$space-4: 16px; $space-6: 24px; $space-8: 32px;

$radius-sm: 4px; $radius-md: 8px; $radius-lg: 12px;

$font-size-sm: 0.875rem; $font-size-md: 1rem; $font-size-lg: 1.25rem;

$breakpoint-sm: 480px; $breakpoint-md: 768px; $breakpoint-lg: 1024px; $breakpoint-xl: 1280px;

$z-dropdown: 100; $z-sticky: 200; $z-modal-backdrop: 900; $z-modal: 1000; $z-toast: 1100;
```

If the project renders themeable values at runtime (user-toggleable theme, not just a build-time palette), expose the same tokens as CSS custom properties instead of (or alongside) SCSS variables, since SCSS variables are compile-time only:

```scss
:root {
  --color-primary: #1d4ed8;
  --color-surface: #ffffff;
  --color-text: #0f172a;
}
[data-theme='dark'] {
  --color-surface: #0f172a;
  --color-text: #f8fafc;
}
```

## Default Theme Direction

Absent a specified brand/design system, default to: light, professional, restrained — off-white/white surfaces, blue primary accent, high-contrast text, minimal decoration. This is a **starting point for tokens**, not product branding — do not invent logos, brand names, or a specific palette beyond this neutral direction, and do not treat it as license to skip confirming an actual design system if the project has (or should have) one (`decision-making.md`). Because every color is a token, swapping the palette later is a token-file change, not a component rewrite.

## Mixins & Functions — Use Where They Remove Real Duplication

```scss
// abstracts/_mixins.scss
@mixin respond-above($breakpoint) {
  @media (min-width: $breakpoint) { @content; }
}

@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin focus-ring {
  outline: 2px solid $color-primary;
  outline-offset: 2px;
}
```

```scss
.card {
  @include truncate;
  &:focus-visible { @include focus-ring; }

  @include respond-above($breakpoint-md) {
    padding: $space-6;
  }
}
```

## Placeholders & @extend — Sparingly

Use `%placeholder` + `@extend` only for a small, stable set of shared rules that are truly the *same* concept (e.g. a base "reset button styles" placeholder used by several button-like components) — not as a general DRY tool. `@extend` merges selectors in the output CSS in ways that can produce unexpected specificity/ordering; a mixin is usually the safer default for anything that takes parameters or might change independently per user.

```scss
%unstyled-button {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.icon-button { @extend %unstyled-button; }
```

## What to Avoid

- **Deep nesting** — more than ~3 levels usually signals the selector should be flattened or the component split; deep nesting also raises specificity unnecessarily.
- **Excessive specificity** — prefer a single class per element over ID selectors or long descendant chains; don't fight specificity with `!important`.
- **Duplicated values / magic numbers** — any hardcoded color/spacing that appears twice belongs in `_variables.scss`.
- **Global leakage** — component styles should not depend on a specific ancestor's class existing elsewhere in the DOM; scope styles to the component (CSS Modules, BEM-style naming, or colocated `.scss` per component) so one component's styles can't accidentally break another's.
- **Coupling to unrelated components** — `.employee-table .btn { ... }` styling a shared `Button` differently inside one feature is a sign `Button` needs a `variant` prop instead, not a CSS override.

## Responsive Breakpoints

Use the shared breakpoint tokens and a mobile-first (`min-width`) or desktop-first (`max-width`) convention consistently across the app — pick one and stick to it; don't mix both direction conventions in the same codebase. See `responsive-ui.md` for layout guidance beyond breakpoints.
