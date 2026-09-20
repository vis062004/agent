# Forms

Forms are the place over-abstraction happens most often. Pick the approach per form, not once for the whole app.

## The Decision

| Approach | Use when |
|---|---|
| **1. Explicit form** | Complex conditional behavior between fields, highly custom per-field UI, business logic dominates the form, only one form of this shape exists, or the abstraction would make debugging harder than it's worth. |
| **2. Reusable field components** (shared `TextField`/`SelectField` etc., form still assembled by hand) | Multiple forms share the same *field* patterns (label + input + error text) but each form's structure/layout/validation differs. This is the most common good default. |
| **3. Configuration-driven form renderer** (fields described as data, rendered generically) | Fields are highly repetitive across many forms, field behavior is itself configuration-driven (e.g. an admin-configurable form builder), the form structure changes frequently without code changes, or multiple screens genuinely share one form model. |
| **4. Schema-driven form** (validation/shape derived from a schema, e.g. a JSON Schema or a validation-library schema driving both validation and rendering) | The validation schema is already the source of truth elsewhere (e.g. shared with the backend or a spec) and duplicating field lists by hand would drift from it. |
| **5. Hybrid** | Most of a form is explicit, but a repeated sub-section (e.g. a dynamic list of "contact methods") is config/array-driven within an otherwise explicit form. |

**Do not build a config-driven form renderer to save a few lines of JSX on one form.** That trade — a generic renderer's indirection, debugging cost, and accessibility risk — is only worth it when the repetition/metadata-driven criteria in row 3 are genuinely met. Default to option 1 or 2.

## 1. Explicit Form

```tsx
function EmployeeForm({ onSubmit }: { onSubmit: (values: EmployeeInput) => Promise<void> }) {
  const [values, setValues] = useState<EmployeeInput>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length) return setErrors(validationErrors);

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({ ...errors, _form: toUserMessage(err) } as any);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField label="Name" name="name" value={values.name}
        onChange={(v) => setValues({ ...values, name: v })} error={errors.name} required />
      <TextField label="Email" name="email" type="email" value={values.email}
        onChange={(v) => setValues({ ...values, email: v })} error={errors.email} required />
      <Button type="submit" loading={submitting}>Save</Button>
    </form>
  );
}
```

## 2. Reusable Field Components

Build the field wrapper once (label + control + helper/error text + a11y wiring — see `component-design.md` and `accessibility.md`), reuse it in every explicit form:

```tsx
function TextField({ label, name, value, onChange, error, required, type = 'text' }: TextFieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={errorId}
        required={required}
      />
      {error && <p id={errorId} role="alert" className="field__error">{error}</p>}
    </div>
  );
}
```

## 3. Configuration-Driven Form Renderer

Only when the criteria above are actually met:

```ts
interface FieldConfig {
  name: string;
  type: 'text' | 'email' | 'select' | 'checkbox';
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

const employeeFields: FieldConfig[] = [
  { name: 'firstName', type: 'text', label: 'First Name', required: true },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'department', type: 'select', label: 'Department', options: departmentOptions },
];
```

```tsx
function ConfigForm({ fields, values, onChange, errors }: ConfigFormProps) {
  return (
    <>
      {fields.map((field) => (
        <FieldRenderer key={field.name} field={field} value={values[field.name]}
          onChange={(v) => onChange(field.name, v)} error={errors[field.name]} />
      ))}
    </>
  );
}
```

Even here, keep field-type rendering delegated to the same reusable field components from option 2 — the renderer's job is just to map config to the right field component, not to reimplement field rendering.

## Validation

- Validate on submit always; validate on blur for fields the user has already touched (not on every keystroke — that's noisy and can flag an in-progress email as invalid mid-type).
- One validation function/schema per form, colocated with the form.
- Client-side validation is UX only — **the backend re-validates everything**; never treat a passed client validation as proof the data is safe or correct (see `security.md`).
- Match client validation rules to the backend's actual rules; a mismatch (client allows what the server rejects, or vice versa) is a bug, not a UX nuance — confirm the backend's rules if unknown.

## Submission State

- Disable the submit control while a request is in flight; prevent double-submit.
- Show a form-level error banner for submission failures (network/server errors) distinct from field-level errors.
- On success, given the flow: reset the form, navigate away, or show a confirmation — whichever the requirement specifies; don't assume.

## Dynamic / Repeated Field Groups

For "add another" patterns (multiple phone numbers, multiple line items), model the repeated group as an array in form state with a stable key per entry (not array index, since entries can be removed/reordered):

```tsx
const [contacts, setContacts] = useState<Contact[]>([{ id: crypto.randomUUID(), value: '' }]);
```

## Accessibility for Forms

See `accessibility.md` for the full treatment — at minimum: every input has a linked `<label>`, errors are associated via `aria-describedby` and announced (`role="alert"` or a live region), required fields are marked both visually and with `required`/`aria-required`, and focus moves to the first invalid field on a failed submit.
