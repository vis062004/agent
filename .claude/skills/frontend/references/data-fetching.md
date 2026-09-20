# Data Fetching — Axios, Service Layer, TanStack Query

Covers REST integration end to end. Axios is this skill's documented default HTTP client for REST — do not introduce a different client, or GraphQL, without confirming per `decision-making.md`; see `graphql.md` if the project uses/needs GraphQL instead.

## Layered Architecture

Never call `axios`/`fetch` directly inside a component. Keep a strict layering so UI code never knows about HTTP:

```
Component
    ↓  (reads data/state, calls actions)
Hook / Query (useEmployees, useCreateEmployee)
    ↓  (owns loading/error/cache concerns)
Service (employeeService.getAll(), employeeService.create())
    ↓  (maps DTOs, calls the shared client)
Axios instance (baseURL, interceptors, auth header)
    ↓
Backend API
```

## Centralized Axios Instance

One instance per API base URL, configured once:

```ts
// services/httpClient.ts
import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // env-driven, never hardcoded
  timeout: 10_000,
});

httpClient.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);
```

- **Base URL** comes from an environment variable, never hardcoded per-file.
- **Timeout** set explicitly — an unbounded request hangs the UI's loading state indefinitely.
- **Auth header** attached once, in the interceptor — not repeated at every call site.
- **Cancellation** — pass an `AbortController`'s signal (or Axios's `CancelToken` on older versions) from the calling hook/effect so unmounted components don't set state after the fact.

```ts
export async function getEmployees(signal?: AbortSignal): Promise<Employee[]> {
  const { data } = await httpClient.get<EmployeeDto[]>('/employees', { signal });
  return data.map(toEmployee);
}
```

## Error Normalization

Interceptors convert whatever shape the backend/network returns into one consistent error object the rest of the app can rely on — never let raw Axios errors (with backend-specific fields) leak into UI code:

```ts
export interface ApiError {
  status: number | 'network' | 'timeout';
  message: string;       // user-safe, never a raw backend message by default
  fieldErrors?: Record<string, string>;
}

function normalizeApiError(error: AxiosError): ApiError {
  if (error.code === 'ECONNABORTED') return { status: 'timeout', message: 'Request timed out. Please try again.' };
  if (!error.response) return { status: 'network', message: 'Network error. Check your connection.' };

  const { status, data } = error.response;
  return {
    status,
    message: status >= 500 ? 'Something went wrong. Please try again.' : (data as any)?.message ?? 'Request failed.',
    fieldErrors: (data as any)?.errors,
  };
}
```

Follow the backend's actual response/error envelope shape — if it's not yet defined, that blocks this layer; ask (`decision-making.md`).

## Service Layer

Each feature (or API resource) gets a thin service module: request building + DTO↔domain-type mapping, nothing else.

```ts
// features/employees/api/employeeService.ts
export const employeeService = {
  list: (params: EmployeeListParams, signal?: AbortSignal) =>
    httpClient.get<EmployeeDto[]>('/employees', { params, signal }).then((r) => r.data.map(toEmployee)),
  getById: (id: string, signal?: AbortSignal) =>
    httpClient.get<EmployeeDto>(`/employees/${id}`, { signal }).then((r) => toEmployee(r.data)),
  create: (input: CreateEmployeeInput) =>
    httpClient.post<EmployeeDto>('/employees', input).then((r) => toEmployee(r.data)),
};
```

## Retry Strategy

Retry idempotent GET requests on transient network failures with backoff (a library-level option if using TanStack Query, or a small wrapper otherwise). Do not retry non-idempotent mutations (POST/PATCH creating side effects) automatically — a retried "create" can double-submit. If a mutation must be retryable, that requires backend idempotency support (e.g. an idempotency key) — confirm with the backend contract rather than assuming.

## Request Deduplication

Multiple components requesting the same resource simultaneously should share one in-flight request, not fire duplicates. TanStack Query (below) handles this by query key automatically; without it, dedupe manually in the service/hook layer (a simple in-flight promise cache keyed by URL+params).

## TanStack Query — Server State

Use when server-state concerns (caching, background refetch, invalidation, loading/error tracking, deduplication) are non-trivial enough to be worth the dependency — not by default just because it's popular; confirm adoption per `decision-making.md` if it isn't already in the project.

```tsx
function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: ({ signal }) => employeeService.list(params, signal),
    staleTime: 60_000,   // how long data is considered fresh (no automatic refetch)
    gcTime: 5 * 60_000,  // how long unused cache entries are kept before eviction
    retry: 1,
  });
}

function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}
```

- **Query keys** should encode every input the query depends on (`['employees', filters, page]`) so different params get distinct cache entries.
- **Invalidation** — invalidate the affected query key(s) after a mutation succeeds, rather than manually patching the cache, unless an optimistic update is specifically needed.
- **Dependent queries** — use `enabled` to gate a query on a prior query's result (`enabled: !!employeeId`).
- **Pagination/infinite queries** — `useInfiniteQuery` (or manual `page` in the query key) once the backend's pagination style is known (`decision-making.md` if it isn't).
- **Optimistic updates** — update the cache immediately in `onMutate`, roll back in `onError`, only where the UI benefit (instant feedback) clearly outweighs the rollback complexity.

```tsx
function useEmployee(id: string) {
  const employeeQuery = useQuery({ queryKey: ['employees', id], queryFn: () => employeeService.getById(id) });
  const permissionsQuery = useQuery({
    queryKey: ['permissions', employeeQuery.data?.roleId],
    queryFn: () => permissionService.getForRole(employeeQuery.data!.roleId),
    enabled: !!employeeQuery.data,
  });
  return { employeeQuery, permissionsQuery };
}
```

If the project doesn't use TanStack Query (or an equivalent), a plain custom hook following the same shape (`{ data, isLoading, error, refetch }`, cancellation via `AbortController`, one hook per resource) is a legitimate simpler alternative — don't introduce the dependency just to match this reference.

## Logging Without Leaking Secrets

Log request failures for debugging (status, URL path, correlation id if the backend provides one) — never log full request/response bodies that may contain tokens, passwords, or PII. Never log the `Authorization` header.

## Environment Configuration

API base URL(s) come from build-time env vars (e.g. `VITE_API_BASE_URL`), documented in a committed `.env.example` with placeholder values — never a real `.env` committed, never a secret embedded in frontend code (anything shipped to the browser is public).
