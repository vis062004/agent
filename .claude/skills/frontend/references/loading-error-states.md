# Loading, Empty, Error States & Notifications

Every async view accounts for these states explicitly — treat a missing state as an incomplete implementation, not a nice-to-have:

1. **Loading** — request in flight, no data yet.
2. **Success** — data loaded, render it.
3. **Empty** — request succeeded, zero results.
4. **Error** — request failed.
5. **Retry** — user-initiated recovery from an error.
6. **Disabled/submitting** — an action (not just a data view) in progress; prevents duplicate submission.
7. **Partial data** — where applicable, some data loaded and some failed/is still loading (e.g. two independent queries on one page) — don't block the whole view on the slowest piece if the page can usefully show what's ready.

```tsx
function EmployeeListPage() {
  const { data, isLoading, error, refetch } = useEmployees();

  if (isLoading) return <TableSkeleton rows={8} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data.length) return <EmptyState title="No employees yet" description="Add your first employee to get started." action={<Button onClick={openCreateModal}>Add Employee</Button>} />;

  return <EmployeeTable employees={data} />;
}
```

## Reusable Components (Common, Not Reinvented Per Screen)

Build once, reuse everywhere an async view needs one — inconsistent, one-off loading indicators per screen are a maintainability and UX problem:

- `Spinner` — small, inline loading indicator.
- `Skeleton` — generic placeholder block; `TableSkeleton`, `CardSkeleton`, `PageSkeleton` as shaped variants for common layouts.
- `EmptyState` — title, optional description, optional call-to-action.
- `ErrorState` — human-readable message + retry action.

```tsx
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="error-state">
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry} variant="secondary">Retry</Button>}
    </div>
  );
}
```

Prefer a skeleton over a spinner for content-shaped areas (tables, cards, detail pages) — it communicates the coming layout and reduces perceived load time and layout shift. A spinner is fine for small, non-layout-affecting actions (a button's own loading state).

## Centralized Error Handling

Don't write ad-hoc `try/catch` + custom error copy in every component. Normalize errors once at the data layer (`data-fetching.md`) into a consistent `ApiError`, and handle the *display* of that error consistently:

- **Field-level / view-level errors** (a specific request failed) — render inline via `ErrorState`/field error text, with retry where it makes sense.
- **Global/unexpected errors** (something the UI can't render meaningfully) — an error boundary catches render-time exceptions and shows a fallback, logging the underlying error for diagnostics.

```tsx
class ErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { logError(error); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
```

## Toast / Notification System

Use one centralized toast/notification mechanism (a shared hook/context, e.g. `useToast()` backed by a single `<ToastContainer />` mounted once) — not ad-hoc notification state duplicated in each component that needs to show one.

```tsx
const { showToast } = useToast();

async function handleDelete(id: string) {
  try {
    await employeeService.remove(id);
    showToast({ type: 'success', message: 'Employee removed.' });
  } catch (err) {
    showToast({ type: 'error', message: toUserMessage(err) });
  }
}
```

Use a toast for transient, non-blocking confirmations/errors tied to a user action (saved, deleted, "couldn't save — try again"); use inline `ErrorState`/field errors for errors tied to a specific piece of UI that the user is actively looking at (a failed list load, a failed field validation) — a toast that appears and disappears is a poor fit for something the user needs to act on while looking at that section of the page.

## User-Facing Error Messages

- Clear, short, actionable — "Couldn't save changes. Please try again." not a technical description.
- Never expose: stack traces, raw backend/SQL error text, internal URLs/hostnames, tokens, or any implementation detail (see `security.md`).
- Distinguish categories where it changes the message meaningfully: network/offline, timeout, validation (show field errors instead of a generic banner), authentication (prompt re-login), authorization (explain access is denied, don't imply a bug), server error (generic apology + retry).

```ts
function toUserMessage(error: ApiError): string {
  switch (error.status) {
    case 'network': return "Can't reach the server. Check your connection and try again.";
    case 401: return 'Your session has expired. Please sign in again.';
    case 403: return "You don't have permission to do that.";
    default: return error.message || 'Something went wrong. Please try again.';
  }
}
```
