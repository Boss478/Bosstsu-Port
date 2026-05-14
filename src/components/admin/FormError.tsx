/"/**
 * Form error display component.
 */

interface FormErrorProps {
  error: string | null;
  className?: string;
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;
  
  return (
    <div className={`p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 ${className}`}>
      {error}
    </div>
  );
}
