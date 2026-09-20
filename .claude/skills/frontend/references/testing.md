# Frontend Testing

Use the project's existing test stack. If none exists and a test framework must be introduced, that's a project-specific tooling decision — ask before adding one (`decision-making.md`); do not default to a particular runner/library unprompted.

## Prioritize by Risk, Not by Coverage Percentage

Don't add tests mechanically to every file touched. Prioritize, in roughly this order:

1. **Business logic** — validation rules, calculations, data transformations (pure functions are cheapest to test and highest value).
2. **Complex custom hooks** — anything with non-trivial state transitions, effects, or derived values.
3. **Reusable components** — shared `components/common/*` are used everywhere; a regression there has wide blast radius.
4. **Critical user flows** — the paths that matter most to the business (checkout, submit, login), end to end.
5. **Error states and edge cases** — empty lists, failed requests, invalid input, boundary values — these are where regressions hide, and where manual QA is least likely to catch a regression.

A simple presentational component with no logic (renders props, no conditionals) usually isn't worth a dedicated test — reviewing it is often sufficient.

## Test Levels

- **Unit tests** — pure functions: validators, formatters, reducers, utility functions. Fast, no rendering, no mocking needed.
- **Component tests** — render a component with React Testing Library, assert on behavior from the user's perspective (what's on screen, what happens on interaction) — not implementation details (internal state, instance methods).
- **Integration tests** — multiple components + a hook/service together (e.g. a form that calls a mocked API and shows the resulting state) — closer to how the feature is actually used.
- **E2E tests** — a real browser driving the full app against a real or realistic backend, for the handful of flows where nothing less gives real confidence (critical business paths, cross-page flows).

Don't reach for E2E to test something a unit or component test already covers faster and more reliably — use the cheapest level that actually gives confidence.

## Component Testing Pattern (React Testing Library)

Query by role/label/text the way a user or assistive technology would, not by test-id-first or implementation detail:

```tsx
test('shows validation error and blocks submit on empty email', async () => {
  const onSubmit = vi.fn();
  render(<EmployeeForm onSubmit={onSubmit} />);

  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
```

## Custom Hook Testing

Test hooks with non-trivial logic in isolation (a testing-library render-hook utility, or via a minimal harness component) — focus on state transitions and side effects, not internals:

```tsx
test('useDebouncedValue delays updates by the given delay', () => {
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
    initialProps: { value: 'a' },
  });

  rerender({ value: 'ab' });
  expect(result.current).toBe('a'); // not yet updated

  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('ab');
});
```

## Testing Data-Fetching Code

Mock at the service/HTTP boundary (the Axios instance or the service module — see `data-fetching.md`), not deep inside component internals, so tests exercise real component behavior against a controlled response:

```tsx
test('shows error state when the request fails', async () => {
  vi.spyOn(employeeService, 'list').mockRejectedValueOnce({ status: 500, message: 'Server error' });

  render(<EmployeeListPage />);

  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Testing Error/Loading/Empty States

Since every async view implements all four states (`loading-error-states.md`), test that each renders correctly for at least the components/flows identified as high-risk — not exhaustively for every screen if the pattern is shared through common components already covered once.

## Accessibility in Tests

Query by accessible role/label (`getByRole`, `getByLabelText`) rather than by class name or test id where possible — this doubles as a lightweight accessibility check, since a query that only works via test-id often means the element isn't properly labeled/semantic.

## What Not to Do

- Don't test implementation details (internal state variables, private methods, exact re-render counts) — test observable behavior.
- Don't write a snapshot test as a substitute for asserting actual behavior; large snapshots rot and get blindly updated.
- Don't mock so deep/broadly that the test no longer exercises real integration between the pieces it claims to test.
- Don't add E2E coverage for something already covered by a faster component/integration test.
