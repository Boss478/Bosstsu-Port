export function getStudentToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('studentToken');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('studentToken', token);
  }
  return token;
}