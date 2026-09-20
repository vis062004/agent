# Responsive UI

Assume the UI will be viewed at more than one size and with more content than the happy-path example — design for that from the start rather than retrofitting.

## Viewport Range

Design and verify (by inspection, or in a running browser per this skill's quality gate) across at least:
- **Mobile** — ~320–480px
- **Tablet** — ~600–1024px
- **Desktop/laptop** — ~1024–1440px
- **Large desktop** — 1440px+

Use the breakpoint tokens from `scss.md` consistently rather than one-off `@media` values scattered per component.

## Layout Patterns

- **Flex/Grid with wrapping**, not fixed-width rows that overflow on narrow viewports.
- **Fluid containers** (`max-width` + centered, or percentage-based) over fixed pixel widths for page-level layout.
- Stack horizontally-arranged elements (nav items, form fields, card grids) vertically below the relevant breakpoint rather than shrinking them until illegible.

```scss
.form-row {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  @include respond-above($breakpoint-md) {
    flex-direction: row;
  }
}
```

## Content That Grows

Don't assume text stays short:
- **Long labels/names** — truncate with ellipsis + a `title` attribute (or tooltip) for the full value, rather than breaking layout; or allow wrapping if truncation would hide necessary information.
- **Text scaling** — layouts should tolerate the user increasing browser font size without breaking (avoid fixed-height containers around text that clip at larger sizes).
- **Localization-like expansion** — if the project may add more languages later, avoid tightly-fit UI (icon-only buttons with no room for a future label, fixed-width buttons sized to exactly fit current copy).

## Tables

Long/wide tables are one of the most common responsive failure points:
- Below a breakpoint, either allow horizontal scroll within the table container (not the whole page), or switch to a stacked card-per-row layout for narrow viewports.
- Never let a wide table force the entire page to scroll horizontally.

## Forms

- Stack fields vertically on narrow viewports; multi-column layouts only above a breakpoint where there's room.
- Ensure touch targets (buttons, checkboxes, inputs) are large enough to tap accurately (effectively ~44×44px on touch devices) — see `accessibility.md`.

## Navigation

- Provide a condensed pattern below a breakpoint (hamburger/drawer, bottom nav, collapsed menu) rather than shrinking a full desktop nav bar until it's unusable.
- Ensure the condensed pattern is still keyboard- and screen-reader-accessible (see `accessibility.md`).

## Dialogs & Modals

- Full-viewport or near-full-viewport on mobile rather than a small fixed-width dialog that leaves awkward margins or gets clipped.
- Ensure the dialog's content area scrolls internally if it exceeds viewport height, rather than the dialog overflowing the screen.

## Cards & Grids

- Use `grid-template-columns: repeat(auto-fill, minmax(...))` (or an equivalent responsive grid) rather than a fixed column count that becomes cramped or too sparse across viewport sizes.

## Overflow

Any container that can receive more content than initially expected (a comment list, a long select dropdown, a wide table) needs an explicit overflow strategy (scroll, truncate, paginate, wrap) — "it happened to fit during development" is not a strategy.
