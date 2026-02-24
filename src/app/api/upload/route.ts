import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';

// Allowed folders to prevent path traversal
const ALLOWED_FOLDERS = ['portfolio', 'gallery', 'portfolio/gallery', 'misc'];

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderInput = (formData.get('folder') as string) || 'misc';

    // 2. Validate input
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folderInput)) {
      return NextResponse.json({ error: 'Invalid folder specified' }, { status: 400 });
    }

    // 3. Security Check: File Size
    const maxSize = CONFIG.UPLOAD.MAX_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }

    // 4. Security Check: MIME Type
    const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as unknown as string[];
    const nameLC = file.name?.toLowerCase() || '';
    const isHeicByName = nameLC.endsWith('.heic') || nameLC.endsWith('.heif');
    
    if (!isHeicByName && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Save File
    // If uploading to 'portfolio', convert to WebP (true), otherwise keep JPEG (false)
    // Adjust based on the original logic inside actions.ts
    const convertToWebP = folderInput === 'portfolio';
    const filePath = await saveFile(file, folderInput, convertToWebP);

    return NextResponse.json({ url: filePath }, { status: 200 });
  } catch (error: Error | unknown) {
    console.error('API Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
