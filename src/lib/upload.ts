import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '@/lib/config';
import sharp from 'sharp';
import convert from 'heic-convert';

export async function saveFile(file: File, folder: string = 'misc', asWebP: boolean = false): Promise<string> {
  const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as readonly string[];
  const maxSize = CONFIG.UPLOAD.MAX_SIZE;

  // Browsers often send HEIC with empty or octet-stream MIME type — detect by extension
  const nameLC = file.name?.toLowerCase() || '';
  const isHeicByName = nameLC.endsWith('.heic') || nameLC.endsWith('.heif');

  if (!isHeicByName && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB. Max: ${maxSize / 1024 / 1024}MB`);
  }

  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder, year, month);
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }

  // Determine output extension and filename
  const ext = asWebP ? 'webp' : 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(new Uint8Array(arrayBuffer));

  // Convert HEIC/HEIF to JPEG before Sharp processing
  const isHeic = isHeicByName || file.type === 'image/heic' || file.type === 'image/heif';

  if (isHeic) {
    try {
      const converted = await convert({
        buffer,
        format: 'JPEG',
        quality: 0.9,
      });
      buffer = Buffer.from(converted);
    } catch (heicError) {
      console.error('HEIC conversion error:', heicError);
      throw new Error('Failed to convert HEIC image. The file may be corrupted.');
    }
  }

  // Process image with Sharp
  // Retains original resolution but compresses to 80% using high-efficiency mozjpeg or webp
  try {
    const img = sharp(buffer).withMetadata(); // Crucial: Keeps EXIF (Camera Model, GPS, etc.)
    
    if (asWebP) {
      buffer = Buffer.from(await img.webp({ quality: 80 }).toBuffer());
    } else {
      buffer = Buffer.from(await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer());
    }
  } catch (error) {
    console.error('Sharp Image Processing Error:', error);
    // If sharp fails (e.g., extremely weird format), we fallback to saving original buffer
    // but we should Ideally throw if it's meant to be an image.
    throw new Error('Failed to process/compress image. Ensure the file is not corrupted.');
  }

  await fs.writeFile(filePath, buffer as unknown as Uint8Array);

  // Return public URL
  return `/uploads/${folder}/${year}/${month}/${filename}`;
}
