import { useId, type InputHTMLAttributes } from 'react';
import '../Field.scss';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'id'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextField({ label, value, onChange, error, required, name, type = 'text', ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="field__control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={errorId}
        required={required}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
