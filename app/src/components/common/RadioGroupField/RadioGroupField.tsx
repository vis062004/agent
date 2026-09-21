import { useId } from 'react';
import '../Field.scss';

export interface RadioGroupFieldOption {
  label: string;
  value: string;
}

export interface RadioGroupFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioGroupFieldOption[];
  required?: boolean;
  error?: string;
}

export function RadioGroupField({ label, name, value, onChange, options, required, error }: RadioGroupFieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset className="field">
      <legend className="field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="field__radio-group" role="radiogroup" aria-invalid={!!error} aria-describedby={errorId}>
        {options.map((option) => (
          <label key={option.value} className="field__radio-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required={required}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
