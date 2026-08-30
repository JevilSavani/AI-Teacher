import React from 'react';

/**
 * Reusable Form Input component with label, error, and optional hint text.
 */
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  autoComplete,
  disabled = false,
  ...rest
}) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={`form-input${error ? ' form-input-error' : ''}${disabled ? ' form-input-disabled' : ''}`}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
