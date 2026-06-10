const CONSENT_KEY = 'boss478-analytics-consent';
type ConsentState = 'accepted' | 'rejected' | null;

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentState;
}

export function setConsent(state: 'accepted' | 'rejected'): void {
  localStorage.setItem(CONSENT_KEY, state);
}

export function hasConsent(): boolean {
  return getConsent() === 'accepted';
}
