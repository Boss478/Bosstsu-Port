/**
 * KruLAW — shared display-formatting helpers.
 *
 * Kept separate from krulaw-reader.ts: `formatVerifiedAt` lives there with
 * its CE→BE +543 shift, while these helpers format Buddhist-era (BE) inputs
 * that must NOT be shifted.
 */

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

/**
 * '2542-08-19' → '19 สิงหาคม 2542'.
 *
 * BE (Buddhist-era) dates — e.g. the gazette/effective dates in the frozen
 * LawDoc shape — already carry the Buddhist year, so there is NO +543 shift
 * here (that is `formatVerifiedAt`'s job for CE inputs). Unparseable or
 * out-of-range input returns the string verbatim.
 */
export function formatThaiBEDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (m === null) return date;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return date;
  return `${day} ${THAI_MONTHS[month - 1]} ${year}`;
}
