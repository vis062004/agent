import { useId, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { CATEGORY_OPTIONS, URGENCY_OPTIONS, initialRequestValues } from '../types';
import type { ResourceRequestInput } from '../types';
import { fieldLabels, isFieldMandatory, validateRequestForm } from '../validation';
import { toDigitsOnly } from '../../../utils/toDigitsOnly';
import '../RequestFormPage.scss';

type FormErrors = Partial<Record<keyof ResourceRequestInput, string>>;

export function RequestFormPage() {
  const { username, logout } = useAuth();
  const itemNameId = useId();
  const categoryId = useId();
  const quantityId = useId();
  const justificationId = useId();
  const urgencyId = useId();

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
          <button type="button" className="button" onClick={handleNewRequest}>
            Submit Another Request
          </button>
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
          <button type="button" className="button button--secondary" onClick={logout}>
            Log Out
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor={itemNameId}>
              {fieldLabels.itemName}
              {isFieldMandatory('itemName') && <span aria-hidden="true"> *</span>}
            </label>
            <input
              id={itemNameId}
              name="itemName"
              type="text"
              value={values.itemName}
              onChange={(e) => updateField('itemName', e.target.value)}
              aria-invalid={!!errors.itemName}
              aria-describedby={errors.itemName ? `${itemNameId}-error` : undefined}
              required={isFieldMandatory('itemName')}
            />
            {errors.itemName && (
              <p id={`${itemNameId}-error`} role="alert" className="field__error">
                {errors.itemName}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor={categoryId}>
              {fieldLabels.category}
              {isFieldMandatory('category') && <span aria-hidden="true"> *</span>}
            </label>
            <select
              id={categoryId}
              name="category"
              value={values.category}
              onChange={(e) => updateField('category', e.target.value as ResourceRequestInput['category'])}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? `${categoryId}-error` : undefined}
              required={isFieldMandatory('category')}
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.category && (
              <p id={`${categoryId}-error`} role="alert" className="field__error">
                {errors.category}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor={quantityId}>
              {fieldLabels.quantity}
              {isFieldMandatory('quantity') && <span aria-hidden="true"> *</span>}
            </label>
            <input
              id={quantityId}
              name="quantity"
              type="text"
              inputMode="numeric"
              value={values.quantity}
              onChange={(e) => updateField('quantity', toDigitsOnly(e.target.value))}
              aria-invalid={!!errors.quantity}
              aria-describedby={errors.quantity ? `${quantityId}-error` : undefined}
              required={isFieldMandatory('quantity')}
            />
            {errors.quantity && (
              <p id={`${quantityId}-error`} role="alert" className="field__error">
                {errors.quantity}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor={justificationId}>
              {fieldLabels.businessJustification}
              {isFieldMandatory('businessJustification') && <span aria-hidden="true"> *</span>}
            </label>
            <textarea
              id={justificationId}
              name="businessJustification"
              value={values.businessJustification}
              onChange={(e) => updateField('businessJustification', e.target.value)}
              aria-invalid={!!errors.businessJustification}
              aria-describedby={errors.businessJustification ? `${justificationId}-error` : undefined}
              required={isFieldMandatory('businessJustification')}
            />
            {errors.businessJustification && (
              <p id={`${justificationId}-error`} role="alert" className="field__error">
                {errors.businessJustification}
              </p>
            )}
          </div>

          <fieldset className="field">
            <legend>
              {fieldLabels.urgency}
              {isFieldMandatory('urgency') && <span aria-hidden="true"> *</span>}
            </legend>
            <div
              className="request-page__radio-group"
              role="radiogroup"
              aria-invalid={!!errors.urgency}
              aria-describedby={errors.urgency ? `${urgencyId}-error` : undefined}
            >
              {URGENCY_OPTIONS.map((option) => (
                <label key={option} className="request-page__radio-option">
                  <input
                    type="radio"
                    name="urgency"
                    value={option}
                    checked={values.urgency === option}
                    onChange={() => updateField('urgency', option)}
                    required={isFieldMandatory('urgency')}
                  />
                  {option}
                </label>
              ))}
            </div>
            {errors.urgency && (
              <p id={`${urgencyId}-error`} role="alert" className="field__error">
                {errors.urgency}
              </p>
            )}
          </fieldset>

          <button type="submit" className="button">
            Submit Request
          </button>
        </form>
      </div>
    </main>
  );
}
