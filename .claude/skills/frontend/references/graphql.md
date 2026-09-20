# GraphQL

Only load/use this when the project has chosen (or is genuinely choosing) GraphQL over REST — confirm per `decision-making.md`. Do not introduce GraphQL alongside an existing REST layer without a real reason (e.g. the backend only exposes GraphQL, or there's an explicit requirement); running both without cause doubles the data-layer surface for no benefit.

## REST vs. GraphQL — When Each Fits

| Signal | Favor |
|---|---|
| Backend already exposes a GraphQL endpoint / schema | GraphQL |
| Backend already exposes REST endpoints | REST |
| Clients need to fetch deeply nested, variably-shaped data (avoiding over/under-fetching matters a lot) | GraphQL |
| Simple CRUD over a small set of resources | REST |
| Strong existing team/tooling familiarity with one or the other | Follow it unless there's a concrete reason to switch |
| No backend contract decided yet | Ask — this is a backend-architecture decision, not one to make from the frontend alone |

If the API contract is unknown, this blocks implementation entirely — ask before building either layer.

## Client Configuration

Keep GraphQL client setup centralized and reusable (potential future extraction), the same discipline as the Axios instance in `data-fetching.md`:

```ts
// services/graphqlClient.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL });

const authLink = setContext((_, { headers }) => ({
  headers: { ...headers, authorization: authStore.getToken() ? `Bearer ${authStore.getToken()}` : '' },
}));

export const graphqlClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
  },
});
```

## Queries & Fragments

Co-locate a component's data needs with the component, and share overlapping fields via fragments instead of duplicating field lists:

```ts
const EMPLOYEE_FIELDS = gql`
  fragment EmployeeFields on Employee {
    id
    name
    email
    role
  }
`;

const GET_EMPLOYEES = gql`
  query GetEmployees($page: Int!, $pageSize: Int!) {
    employees(page: $page, pageSize: $pageSize) {
      items { ...EmployeeFields }
      totalCount
    }
  }
  ${EMPLOYEE_FIELDS}
`;
```

```tsx
function useEmployees(page: number, pageSize: number) {
  return useQuery(GET_EMPLOYEES, { variables: { page, pageSize } });
}
```

## Mutations

```ts
const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) { ...EmployeeFields }
  }
  ${EMPLOYEE_FIELDS}
`;
```

```tsx
function useCreateEmployee() {
  return useMutation(CREATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES }],
    // or update the cache directly for an optimistic feel:
    optimisticResponse: (vars) => ({
      createEmployee: { __typename: 'Employee', id: 'temp-id', ...vars.input },
    }),
  });
}
```

## Error Handling

Distinguish network errors from GraphQL errors (a 200 response can still carry an `errors` array). Normalize both into the same `ApiError` shape used by the REST layer (`data-fetching.md`) so UI components don't need to know which transport was used:

```ts
function normalizeGraphQLError(error: ApolloError): ApiError {
  if (error.networkError) return { status: 'network', message: 'Network error. Check your connection.' };
  const first = error.graphQLErrors[0];
  return { status: (first?.extensions?.code as number) ?? 400, message: first?.message ?? 'Request failed.' };
}
```

## Caching & Request Policies

- Default to `cache-first` for data that rarely changes, `cache-and-network` for data that should feel fresh but can show cached data immediately, `network-only` for data that must never be stale (right after a mutation, sensitive counts).
- Use the cache's normalized identity (`id` + `__typename`) so mutations updating one entity automatically update every query referencing it — don't manually refetch everything if the cache can update itself.

## Pagination

Prefer the connection/cursor pattern (`edges`/`pageInfo`/`cursor`) when the schema supports it — it composes with client caching better than raw offset pagination. Follow whatever the actual schema defines; don't invent a pagination shape the backend doesn't implement.

## Authentication

Attach the auth token via a link (as shown above), the same place all requests flow through — never per-query. Handle 401s in a link/error handler that triggers a single re-auth/logout flow, not per-component.

## Reusable Hooks/Utilities (Package-Readiness)

Structure query/mutation hooks the same way as the REST service layer — one hook per operation, typed inputs/outputs, no component-specific logic inside the hook — so this data layer could plausibly be extracted the same way `component-design.md` describes for UI components. Keep generated types (from a codegen tool, if the project uses one) separate from hand-written hook logic.

## Types

If the project uses GraphQL Code Generator (or equivalent) against the schema, use the generated types for query/mutation variables and results rather than hand-writing types that can drift from the schema. If no codegen is set up, that's a project-specific tooling decision — confirm before introducing it.
