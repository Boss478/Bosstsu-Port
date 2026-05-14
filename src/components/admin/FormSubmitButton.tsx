/"/**
 * Form submit button with loading state.
 */

interface FormSubmitButtonProps {
  pending: boolean;
  isEdit?: boolean;
  createLabel: string;
  className?: string;
}

export function FormSubmitButton({ 
  pending, 
  isEdit = false, 
  createLabel,
  className = '' 
}: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดตข้อมูล' : createLabel)}
    </button>
  );
}
