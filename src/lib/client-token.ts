export function getStudentToken(): string {
  if (typeof window === 'undefined') return '';
  let token = sessionStorage.getItem('studentToken');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('studentToken', token);
  }
  return token;
}