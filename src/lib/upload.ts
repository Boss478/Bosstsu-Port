import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '@/lib/config';
import { formatError } from '@/lib/error-code';
import sharp from 'sharp';
import convert from 'heic-convert';

sharp.concurrency(CONFIG.IMAGE_PROCESSING.CONCURRENT_SHARP);

export function sanitizeFilename(name: string): string {
  if (!name) return '';
  const sanitized = name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-\u0E00-\u0E7F]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return sanitized.length > 30 ? sanitized.substring(0, 30) : sanitized;
}

export function isHeicFile(file: File | { name?: string; type?: string }): boolean {
  const nameLC = file.name?.toLowerCase() || '';
  const typeLC = file.type?.toLowerCase() || '';
  const extMatch = CONFIG.HEIC.EXTENSIONS.some(ext => nameLC.endsWith(ext));
  return extMatch || typeLC === 'image/heic' || typeLC === 'image/heif';
}

export async function saveFile(file: File, folder: string = 'misc', asWebP?: boolean, filenamePrefix?: string): Promise<string> {
  const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as readonly string[];
  const maxSize = CONFIG.UPLOAD.MAX_SIZE;

  const shouldConvert = asWebP ?? (CONFIG.UPLOAD.FOLDERS_CONVERT_TO_WEBP as readonly string[]).includes(folder);

  if (!isHeicFile(file) && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB. Max: ${maxSize / 1024 / 1024}MB`);
  }

  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const uploadDir = path.join(process.cwd(), CONFIG.UPLOAD.ROOT_DIR, folder, year, month);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(formatError('U07'));
    }
    throw new Error(formatError('U05'));
  }

  let filename: string;
  if (filenamePrefix) {
    const shortUuid = uuidv4().replace(/-/g, '').substring(0, 8);
    const ext = shouldConvert ? 'webp' : 'jpg';
    filename = `${filenamePrefix}_${shortUuid}.${ext}`;
  } else {
    const ext = shouldConvert ? 'webp' : 'jpg';
    filename = `${uuidv4()}.${ext}`;
  }
  const filePath = path.join(uploadDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(new Uint8Array(arrayBuffer));

  const isHeic = isHeicFile(file);

  if (isHeic && CONFIG.HEIC.ENABLED) {
    try {
      const converted = await convert({
        buffer,
        format: CONFIG.HEIC.OUTPUT_FORMAT as 'JPEG' | 'PNG',
        quality: CONFIG.HEIC.OUTPUT_QUALITY,
      });
      buffer = Buffer.from(converted);
    } catch (heicError) {
      console.error('HEIC conversion error:', heicError);
      throw new Error('Failed to convert HEIC image. The file may be corrupted.');
    }
  }

  try {
    const img = sharp(buffer).withMetadata();

    if (shouldConvert) {
      buffer = Buffer.from(await img.webp({ quality: CONFIG.IMAGE_PROCESSING.WEBP_QUALITY }).toBuffer());
    } else {
      buffer = Buffer.from(
        await img.jpeg({
          quality: CONFIG.IMAGE_PROCESSING.JPEG_QUALITY,
          mozjpeg: CONFIG.IMAGE_PROCESSING.USE_MOZJPEG,
        }).toBuffer()
      );
    }
  } catch (error) {
    console.error('Sharp Image Processing Error:', error);
    throw new Error('Failed to process/compress image. Ensure the file is not corrupted.');
  }

  try {
    await fs.writeFile(filePath, buffer as unknown as Uint8Array);
  } catch (error) {
    console.error('Error writing file:', error);
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(formatError('U07'));
    }
    throw new Error(formatError('U06'));
  }

  return `/uploads/${folder}/${year}/${month}/${filename}`;
}
