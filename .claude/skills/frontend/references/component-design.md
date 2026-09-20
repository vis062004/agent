# Reusable Component & Icon Design

## The Reusability Test

Before extracting a shared component, answer this: **"Is this actually reusable, or does it just look similar right now?"**

Create the abstraction when:
- There are (or are imminently going to be) **two or more real call sites** with the same contract.
- The variation between call sites is a small, enumerable set of props (`variant`, `size`, `disabled`...), not divergent business logic.
- The component's purpose is stable — it's describing a UI pattern (a button, a modal, a table), not one screen's specific layout.

Do NOT create the abstraction when:
- Two pieces of code look similar today but represent different, independently-evolving concerns (coincidental duplication). Three similar lines in two places is cheaper than the wrong abstraction.
- You'd need a config object or a `type: 'a' | 'b' | 'c'` prop to steer fundamentally different rendering/behavior inside one component (that's a God component in disguise — split into distinct components, or compose).
- It only exists to shave a few lines off one call site.
- Making it generic would require exposing internal/business-specific concepts through props.

```tsx
// Premature: exists for one call site, hides a business rule
function EmployeeOrManagerBadge({ role }: { role: 'employee' | 'manager' }) {
  return <Badge color={role === 'manager' ? 'blue' : 'gray'}>{role}</Badge>;
}

// Prefer: generic Badge (common/), business mapping stays at the call site
<Badge color={role === 'manager' ? 'blue' : 'gray'}>{role}</Badge>
```

## Balancing Reusability vs. API Complexity

A shared component's prop API is a contract other engineers (or a future npm consumer) will read, not guess at. Every prop you add is a prop someone else has to understand. Add props that make architectural sense for the component's job; resist adding one for every hypothetical caller.

Common, generally-justified props for interactive/form components (pick what applies — don't cargo-cult the whole list onto every component):

`variant`, `size`, `disabled`, `loading`, `fullWidth`, `color`/theme token, `className`, `style`, `icon`, `iconPosition`, `children`, relevant `aria-*`, event handlers (`onChange`, `onClick`...), `label`, `placeholder`, `required`, `readOnly`, `name`, `value`/`defaultValue`, `error`/`helperText`.

Signs the API has grown past what's justified:
- More than ~8–10 props with no natural grouping.
- Multiple boolean props that are mutually exclusive in practice (should be one `variant`/`status` enum instead).
- A prop whose only job is to toggle which of two unrelated things renders (split into two components).
- Consumers regularly passing `undefined`/default values for half the props (the defaults are wrong, or the props shouldn't exist).

```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon && iconPosition === 'left' && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      {loading ? <Spinner size="sm" /> : children}
      {icon && iconPosition === 'right' && <span className="btn__icon" aria-hidden="true">{icon}</span>}
    </button>
  );
}
```

Note what's *not* here: no business-specific props (`employeeStatus`), no data-fetching, no hardcoded copy. Spreading `...rest` onto the native element keeps standard HTML/ARIA attributes available without enumerating every one.

## Keeping Business Logic Out of Common Components

Common components (`components/common/` or equivalent) should be usable in any project, not just this one:

- No imports from `features/*`, no feature-specific types, no hardcoded business copy/values.
- No direct API/service calls — they receive data and callbacks via props.
- No app-specific routing assumptions (don't `useNavigate()` inside a generic `Card`).
- Styling isolated to the component (CSS Modules/scoped SCSS/styled system) — not dependent on a specific page's global styles.

This is what makes a component realistically extractable into an npm package later (see below) — treat that as a design discipline now, not a project you start today.

## Controlled/Uncontrolled, Defaults, and Predictability

- Support both controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) usage for form-like components where reasonable, matching native element conventions.
- Give sensible defaults (`size = 'md'`, `variant = 'primary'`) so most call sites don't need to specify everything.
- Keep the API predictable: same prop name means the same thing across every common component (`onChange` always receives the new value, not the event, unless every component in the set does the event pattern consistently).

## Common Component Catalog

Build these once, reuse everywhere a real second use case appears — do not scaffold ones you don't need yet:

Button, Input, TextArea, Select, Checkbox, Radio, Modal/Dialog, Dropdown, Card, Table, Pagination, Tabs, Badge, Tooltip, Toast, Spinner/Loader, Skeleton (+ `TableSkeleton`/`CardSkeleton`/`PageSkeleton` variants), EmptyState, ErrorState, form field wrappers (label + control + helper/error text), layout primitives (`Stack`, `Grid`/`Container` if the project doesn't already have a CSS-based equivalent), Icon (see below), basic typography components if the project doesn't just use styled HTML tags.

## Icons

Do not hand-roll or duplicate the same inline SVG in multiple components. Centralize icon usage behind one seam so the visual language and bundle strategy stay consistent:

```tsx
// components/common/Icon/Icon.tsx — one wrapper, one import site for every icon
import { icons, type IconName } from './icon-registry';

export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & React.SVGProps<SVGSVGElement>) {
  const IconComponent = icons[name];
  return <IconComponent width={size} height={size} aria-hidden="true" {...rest} />;
}

// usage
<Button icon={<Icon name="trash" />}>Delete</Button>
```

If the project already has (or needs to choose) an icon library (e.g. an SVG icon set, an icon font, a package like a popular icon set), that is a project-specific decision — confirm it rather than introducing one, per `decision-making.md`. Once chosen, route all icon usage through one `Icon` component/registry rather than importing raw SVGs or a third-party icon component directly throughout feature code — this keeps a future icon-set swap to one file.

## Package-Readiness Checklist

Design common components as if they could become an npm package, without actually publishing one unless asked:

- [ ] Public props are typed with an exported `interface`/`type`, documented for anything non-obvious.
- [ ] No import from application/feature code, routing, or global app state.
- [ ] Sensible default values; works with the minimum required props.
- [ ] Controlled/uncontrolled behavior matches native element conventions where applicable.
- [ ] Accessible by default (labels, roles, keyboard support) — see `accessibility.md`.
- [ ] Styles scoped to the component, no reliance on global selectors leaking in.
- [ ] Exported via a barrel (`components/common/index.ts`) so consumers get a stable import path.
- [ ] Has at least a smoke test if the component has non-trivial logic (`testing.md`).

Do not version, publish, or scaffold actual package tooling (separate `package.json`, build config) for these components unless explicitly asked — the checklist is a design discipline, not a task to execute now.
