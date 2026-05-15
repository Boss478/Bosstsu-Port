/**
 * Reusable form field component with consistent styling.
 * Supports text input, textarea, and select variants.
 */

import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, name, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={name}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// Common input className for reuse
export const inputClassName = 
  "w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export function FormInput({ label, required, className = '', ...props }: FormInputProps) {
  return (
    <FormField label={label} name={props.name || ''} required={required}>
      <input
        className={`${inputClassName} ${className}`}
        {...props}
      />
    </FormField>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
}

export function FormTextarea({ label, required, className = '', ...props }: FormTextareaProps) {
  return (
    <FormField label={label} name={props.name || ''} required={required}>
      <textarea
        className={`${inputClassName} ${className}`}
        {...props}
      />
    </FormField>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, required, options, className = '', ...props }: FormSelectProps) {
  return (
    <FormField label={label} name={props.name || ''} required={required}>
      <div className="relative">
        <select
          className={`${inputClassName} appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>
    </FormField>
  );
}

interface FormDateProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export function FormDate({ label, required, className = '', ...props }: FormDateProps) {
  return (
    <FormField label={label} name={props.name || ''} required={required}>
      <input
        type="date"
        className={`${inputClassName} ${className}`}
        {...props}
      />
    </FormField>
  );
}
