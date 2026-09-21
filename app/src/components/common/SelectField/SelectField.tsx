import { useId, type SelectHTMLAttributes } from 'react';
import '../Field.scss';

export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'id'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  error?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required,
  name,
  ...rest
}: SelectFieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={id}
        name={name}
        className="field__control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={errorId}
        required={required}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
