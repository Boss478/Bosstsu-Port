export interface FormState<T = unknown> {
  isSubmitting: boolean;
  error: string | null;
  data?: T;
}

export interface UploadConfig {
  field: string;
  folder: string;
  convertToWebP?: boolean;
}

export interface CrudActionResponse {
  error?: string;
  id?: string;
}
