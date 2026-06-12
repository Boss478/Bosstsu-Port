'use client';

const HEIC_EXTS = ['.heic', '.heif', '.heics', '.heifs'];

function isHeicFileBrowser(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    HEIC_EXTS.some((ext) => name.endsWith(ext)) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

export async function clientConvertHeic(file: File): Promise<File> {
  if (!isHeicFileBrowser(file)) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const blob = Array.isArray(result) ? result[0] : result;
    const name = file.name.replace(/\.(heic|heif|heics|heifs)$/i, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('HEIC conversion failed, uploading original:', err);
    return file;
  }
}
