# Accessibility

Accessibility is a default requirement for production UI, not an optional pass at the end. Apply this as each component is built, not retrofitted afterward.

## Semantic HTML First

Use the element that already has the right semantics/behavior before reaching for `div`/`span` + ARIA:

| Need | Use |
|---|---|
| Clickable action | `<button>` (never a `div`/`span` with `onClick`) |
| Navigation link | `<a href>` |
| Form input | `<input>`/`<select>`/`<textarea>` with a linked `<label>` |
| Tabular data | `<table>`/`<thead>`/`<tbody>`/`<th scope>` |
| Landmark regions | `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>` |
| Heading hierarchy | `<h1>`–`<h6>` in document order, no skipped levels for styling reasons |

ARIA is for filling a genuine semantic gap (a custom widget with no native element — a combobox, a custom slider), not a substitute for using the right element.

### Visually Hidden, Screen-Reader-Only Text

For context a sighted user gets visually (a table's purpose, an icon-only button's action, a section landmark's label) but that shouldn't add visible clutter, use a visually-hidden class rather than `aria-label` everywhere or omitting the context entirely — it keeps the text in the accessibility tree and selectable/translatable, unlike `aria-label` on non-interactive elements:

```scss
// styles/base/_accessibility.scss — one shared utility, not reinvented per component
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```tsx
<table>
  <caption className="sr-only">Employee list, sorted by name</caption>
  ...
</table>
```

A "skip to main content" link at the top of the page (visually hidden until focused) is the same technique applied to keyboard navigation — add one once the page has enough repeated navigation (a header/nav) that skipping it matters.

## Keyboard Navigation

- Everything operable by mouse must be operable by keyboard: `Tab`/`Shift+Tab` to move focus, `Enter`/`Space` to activate, arrow keys within composite widgets (menus, tabs, radio groups) per the relevant ARIA pattern.
- Never remove the focus outline (`outline: none`) without providing a replacement `:focus-visible` style — invisible focus makes keyboard navigation unusable.
- Custom interactive elements need `tabIndex={0}` and the matching keydown handler (`Enter`/`Space`) if a native element genuinely can't be used.

```scss
button:focus-visible, a:focus-visible, input:focus-visible {
  @include focus-ring; // from scss.md — never remove focus with nothing in its place
}
```

## Focus Management

- Moving to a new view (route change, opening a modal) should move focus to a sensible starting point (the modal's heading, the new page's main heading) — don't leave focus on a now-hidden/removed element.
- Modals/dialogs trap focus within themselves while open and restore focus to the triggering element on close.
- On a failed form submission, move focus to the first invalid field (or a summary of errors) rather than leaving focus wherever it was.

## Labels

- Every input has a programmatically associated `<label>` (via `htmlFor`/`id`, or wrapping) — a placeholder is not a label.
- Every icon-only control (an icon button with no visible text) has an `aria-label` describing its action ("Delete", not "Icon button").
- Group related inputs (e.g. a radio group) with `<fieldset>` + `<legend>`.

```tsx
<button aria-label="Delete employee">
  <Icon name="trash" />
</button>
```

## Accessible Dialogs

```tsx
<div role="dialog" aria-modal="true" aria-labelledby={titleId}>
  <h2 id={titleId}>Delete Employee</h2>
  {/* focus trapped inside while open; Escape closes; focus returns to trigger on close */}
</div>
```

- Closable via `Escape`.
- Backdrop click closes only if that matches the expected UX for the interaction (a destructive-action confirm dialog may intentionally require an explicit button).

## Forms & Error Announcement

- Errors are associated with their field via `aria-describedby` and announced to assistive tech (`role="alert"` on the error text, or a live region for a form-level error summary) — see `forms.md`.
- `aria-invalid="true"` on a field with an active error.
- Required fields marked with `required`/`aria-required` in addition to any visual indicator (`*`) — never rely on color/an asterisk alone.
- `disabled` vs. `readOnly`: `disabled` removes the field from the tab order and form submission and should be paired with a reason (visible text or `aria-describedby`) if it's not obvious why; `readOnly` keeps it focusable/submittable but non-editable — use the one that matches the actual intent, they are not interchangeable.

## Color & Contrast

- Never use color as the only signal for state (error, success, required, selected) — pair with text, an icon, or a pattern.
- Meet WCAG AA contrast ratios for text (4.5:1 for normal text, 3:1 for large text) against its background — check token combinations in `scss.md` against this, especially muted/secondary text colors.

## Screen Reader Considerations

- Decorative icons/images get `aria-hidden="true"` (or empty `alt=""`); meaningful images get a descriptive `alt`.
- Dynamic content updates that the user should be told about without moving focus (a toast, a "saved" confirmation, a loading-to-loaded transition) use a live region (`aria-live="polite"` for non-urgent, `"assertive"` for urgent/error).
- Avoid `aria-hidden` on a focusable element (creates a keyboard trap for assistive tech users — an element can be reached by Tab but not announced).

## Touch Targets

Interactive elements should have an effective hit area of roughly 44×44px on touch devices, even if the visible element is smaller (pad with CSS rather than shrinking tap area to match a small icon).

## Quick Checklist

- [ ] Semantic element used before any ARIA was added
- [ ] Every input has a linked label; every icon-only control has `aria-label`
- [ ] Full keyboard operability, visible focus indicator
- [ ] Modals trap focus, close on `Escape`, restore focus on close
- [ ] Errors announced and associated with their field
- [ ] No color-only signaling
- [ ] Contrast checked against tokens, not assumed
