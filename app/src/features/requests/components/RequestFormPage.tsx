import { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { CATEGORY_OPTIONS, URGENCY_OPTIONS, initialRequestValues } from '../types';
import type { ResourceRequestInput } from '../types';
import { fieldLabels, isFieldMandatory, validateRequestForm } from '../validation';
import { toDigitsOnly } from '../../../utils/toDigitsOnly';
import { Button, RadioGroupField, SelectField, TextAreaField, TextField } from '../../../components/common';
import '../RequestFormPage.scss';

type FormErrors = Partial<Record<keyof ResourceRequestInput, string>>;

const categoryOptions = CATEGORY_OPTIONS.map((option) => ({ label: option, value: option }));
const urgencyOptions = URGENCY_OPTIONS.map((option) => ({ label: option, value: option }));

export function RequestFormPage() {
  const { username, logout } = useAuth();

  const [values, setValues] = useState<ResourceRequestInput>(initialRequestValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof ResourceRequestInput>(field: K, value: ResourceRequestInput[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateRequestForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitted(true);
  }

  function handleNewRequest() {
    setValues(initialRequestValues);
    setErrors({});
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <main className="request-page">
        <div className="request-page__card request-page__success" role="status">
          <h1>Request Submitted</h1>
          <p>Your IT resource request has been submitted successfully.</p>
          <Button type="button" onClick={handleNewRequest}>
            Submit Another Request
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="request-page">
      <div className="request-page__card">
        <header className="request-page__header">
          <div>
            <h1>IT Resource Request</h1>
            <p className="request-page__subtitle">Signed in as {username}</p>
          </div>
          <Button type="button" variant="secondary" onClick={logout}>
            Log Out
          </Button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label={fieldLabels.itemName}
            name="itemName"
            value={values.itemName}
            onChange={(value) => updateField('itemName', value)}
            error={errors.itemName}
            required={isFieldMandatory('itemName')}
          />

          <SelectField
            label={fieldLabels.category}
            name="category"
            value={values.category}
            onChange={(value) => updateField('category', value as ResourceRequestInput['category'])}
            options={categoryOptions}
            placeholder="Select a category"
            error={errors.category}
            required={isFieldMandatory('category')}
          />

          <TextField
            label={fieldLabels.quantity}
            name="quantity"
            inputMode="numeric"
            value={values.quantity}
            onChange={(value) => updateField('quantity', toDigitsOnly(value))}
            error={errors.quantity}
            required={isFieldMandatory('quantity')}
          />

          <TextAreaField
            label={fieldLabels.businessJustification}
            name="businessJustification"
            value={values.businessJustification}
            onChange={(value) => updateField('businessJustification', value)}
            error={errors.businessJustification}
            required={isFieldMandatory('businessJustification')}
          />

          <RadioGroupField
            label={fieldLabels.urgency}
            name="urgency"
            value={values.urgency}
            onChange={(value) => updateField('urgency', value as ResourceRequestInput['urgency'])}
            options={urgencyOptions}
            error={errors.urgency}
            required={isFieldMandatory('urgency')}
          />

          <Button type="submit">Submit Request</Button>
        </form>
      </div>
    </main>
  );
}
