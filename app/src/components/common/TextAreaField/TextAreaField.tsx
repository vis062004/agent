import { useId, type TextareaHTMLAttributes } from 'react';
import '../Field.scss';

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'id'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextAreaField({ label, value, onChange, error, required, name, ...rest }: TextAreaFieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
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
