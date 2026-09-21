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

## Array-Driven Mandatory Fields (Single Source of Truth)

Applies equally to React DOM and React Native — the only platform difference is how you surface the error (an inline message / `role="alert"` on web, `Alert.alert(...)` or an inline message on native) and the input event shape (`onChange`/`e.target.value` vs `onChangeText`/`value`).

The problem this solves: scattering `required`/`isMandatory` booleans and ad-hoc `if (!field)` checks across a form means the "is this field required" fact lives in two or three places that can silently drift out of sync (validation says required, the label's `*` doesn't show, or vice versa). Instead, make **one array the single source of truth**, and derive both validation and the UI indicator from it.

```ts
// One place that says which fields are required — nowhere else hardcodes `required`/`isMandatory`.
const mandatoryFields = ['email', 'phone', 'region', 'quantity'] as const;

const fieldLabels: Record<string, string> = {
  email: 'Email',
  phone: 'Phone Number',
  region: 'Region',
  quantity: 'Quantity',
};

// Membership check, not a per-field hardcoded flag — a field simply absent from
// mandatoryFields is optional by default, with no extra code needed to make it so.
function isFieldMandatory(fieldName: string, mandatoryFields: readonly string[]): boolean {
  return mandatoryFields.includes(fieldName);
}

function validateForm(
  formData: Record<string, unknown>,
  mandatoryFields: readonly string[],
  fieldLabels: Record<string, string>,
  onInvalid: (message: string) => void, // Alert.alert on RN, or set a form-error state on web
): boolean {
  for (const field of mandatoryFields) {
    const value = formData[field];
    const isEmpty = value === null || value === undefined || value.toString().trim() === '';
    if (isEmpty) {
      onInvalid(`${fieldLabels[field] ?? field} is required`);
      return false; // stop at the first missing field
    }
  }
  return true;
}
```

```tsx
// The same array drives the field's UI indicator — never a hardcoded `isMandatory={true}`.
<Field
  label={fieldLabels.email}
  isMandatory={isFieldMandatory('email', mandatoryFields)}
  value={formData.email}
  onChange={(v) => setFormData((f) => ({ ...f, email: v }))}
/>
```

**Trade-off to be explicit about:** `validateForm` above returns on the *first* invalid field (one alert per submit attempt) — a fine, honest choice for a native `Alert.alert`-style flow, but it means the user fixes one field, resubmits, hits the next. If the requirement is "show every invalid field at once" (e.g. inline errors under each field), accumulate into an errors map instead of returning early:

```ts
function validateFormAll(formData: Record<string, unknown>, mandatoryFields: readonly string[], fieldLabels: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const field of mandatoryFields) {
    const value = formData[field];
    const isEmpty = value === null || value === undefined || value.toString().trim() === '';
    if (isEmpty) errors[field] = `${fieldLabels[field] ?? field} is required`;
  }
  return errors; // {} means valid
}
```

Pick one shape per form and be consistent — don't mix "returns false on first error" and "returns an errors map" across forms in the same app.

### Conditional Mandatory Fields — Keep Separate From the Base Array

A field that's only required *sometimes* (depends on another field's value, e.g. a "type" field becomes required only when a toggle is "Yes") is not a fixed member of `mandatoryFields` — don't hardcode it there, and don't bury an `if` for it inside the base loop above. Two clean ways to keep it separate:

**Option A — compute the effective mandatory list at validation time**, merging the base array with whatever's conditionally required right now:

```ts
function getEffectiveMandatoryFields(formData: Record<string, unknown>): string[] {
  const conditional = formData.conversionEntry === 'Yes'
    ? ['conversionType', 'convertedFrom', 'convertedThrough']
    : [];
  return [...mandatoryFields, ...conditional];
}

// validateForm(formData, getEffectiveMandatoryFields(formData), fieldLabels, onInvalid)
```

**Option B — a distinct validator for rules that aren't "just presence"** (numeric comparisons, cross-field rules), run after the base loop passes:

```ts
function validateConditional(formData: Record<string, unknown>, onInvalid: (message: string) => void): boolean {
  if (Number(formData.quantity) <= 0) {
    onInvalid('Quantity must be greater than zero');
    return false;
  }
  if (formData.conversionEntry === 'Yes' && !formData.conversionType) {
    onInvalid('Conversion Type is required when Conversion Entry is Yes');
    return false;
  }
  return true;
}

// const handleSubmit = () => {
//   if (!validateForm(formData, mandatoryFields, fieldLabels, showError)) return;
//   if (!validateConditional(formData, showError)) return;
//   submit(formData);
// };
```

Option A keeps everything flowing through one `validateForm`/one error style; Option B keeps "is it present" cleanly separate from "is it valid" (a quantity can be present *and* invalid — that's never a presence check, so it doesn't belong in the mandatory-fields loop at all). Either is legitimate — don't reach for a third, more generic mechanism until a real form needs it (`engineering-principles.md`'s YAGNI).

## Submission State

- Disable the submit control while a request is in flight; prevent double-submit.
- Show a form-level error banner for submission failures (network/server errors) distinct from field-level errors.
- On success, given the flow: reset the form, navigate away, or show a confirmation — whichever the requirement specifies; don't assume.

## Dynamic / Repeated Field Groups

For "add another" patterns (multiple phone numbers, multiple line items), model the repeated group as an array in form state with a stable key per entry (not array index, since entries can be removed/reordered):

```tsx
const [contacts, setContacts] = useState<Contact[]>([{ id: crypto.randomUUID(), value: '' }]);
```

## Live Input Sanitization (Constrain-as-You-Type)

Distinct from validation: **sanitization** transforms the value on every keystroke so it can never become invalid-shaped in the first place (a numeric field simply can't contain a letter), while **validation** checks a value after the fact (is it present, is it in range). Sanitizing a field removes the need to validate its *format* later — only its presence/range still needs checking.

```tsx
function handleQuantityChange(text: string) {
  const digitsOnly = text.replace(/[^0-9]/g, ''); // strip anything non-numeric as the user types
  setFormData((f) => ({ ...f, quantity: digitsOnly }));
}

<TextInput value={formData.quantity} onChangeText={handleQuantityChange} keyboardType="numeric" />
```

Don't duplicate this regex inline in every screen with a numeric field — put it behind a small shared helper (or a `numericOnly` prop on the shared field component, `component-design.md`) once a second field needs it:

```ts
export function toDigitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}
```

**Be precise about what "numeric" means for this field** before blanket-stripping to `[0-9]` — a quantity is usually digits-only, but a price needs a decimal point, a signed amount needs a leading `-`, and a formatted code (phone number, PIN) may need to keep characters your naive regex would strip. Match the pattern to the field's actual data type rather than reusing one regex everywhere.

## Dependent / Cascading Fields (Auto-Reset on Parent Change)

When one field's valid options depend on another (region → state → city), a previously selected dependent value can become stale/invalid the moment its parent changes — it must be cleared, not left showing a now-wrong selection.

Define the dependency relationships as data, the same single-source-of-truth discipline as `mandatoryFields` above, rather than hardcoding a reset in every place a parent field can change:

```ts
const fieldDependents: Record<string, string[]> = {
  region: ['state', 'city'],
  state: ['city'],
};
```

Handle the reset in the parent field's own change handler — in the same state update, not a separate effect — so the parent value and its now-invalid dependents change together in one render with no stale-value flash:

```tsx
function handleFieldChange(field: string, value: string) {
  setFormData((prev) => {
    const next = { ...prev, [field]: value };
    for (const dependent of fieldDependents[field] ?? []) {
      next[dependent] = ''; // clear directly-dependent fields...
      for (const transitive of fieldDependents[dependent] ?? []) next[transitive] = ''; // ...and anything they in turn control
    }
    return next;
  });

  // also clear any stale error message on the fields that just got reset
  setErrors((prev) => {
    const next = { ...prev };
    for (const dependent of fieldDependents[field] ?? []) delete next[dependent];
    return next;
  });
}

<RegionPicker value={formData.region} onChange={(v) => handleFieldChange('region', v)} />
<StatePicker value={formData.state} onChange={(v) => handleFieldChange('state', v)} options={statesFor(formData.region)} />
```

Prefer handling this in the change handler over a `useEffect` watching the parent value: the change is caused by exactly one user action, so responding to it inline is simpler and avoids the effect running a render late (see `hooks.md`'s `useEffect` — "when not to use" — for the general version of this call). Reach for an effect instead only if the parent's value can also change from *outside* this handler (e.g. reset by a parent component, restored from a saved draft) and every source needs the same cascade to fire.

## Accessibility for Forms

See `accessibility.md` for the full treatment — at minimum: every input has a linked `<label>`, errors are associated via `aria-describedby` and announced (`role="alert"` or a live region), required fields are marked both visually and with `required`/`aria-required`, and focus moves to the first invalid field on a failed submit.
