import type { ButtonHTMLAttributes } from 'react';
import './Button.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, fullWidth && 'button--full', className]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...rest} />;
}
