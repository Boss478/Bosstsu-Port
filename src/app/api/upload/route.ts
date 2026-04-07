import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveFile, isHeicFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';

const ALLOWED_FOLDERS = [...CONFIG.UPLOAD.ALLOWED_FOLDERS] as string[];
const FOLDERS_CONVERT_TO_WEBP = [...CONFIG.UPLOAD.FOLDERS_CONVERT_TO_WEBP] as string[];

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderInput = (formData.get('folder') as string) || 'misc';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folderInput)) {
      return NextResponse.json({ error: 'Invalid folder specified' }, { status: 400 });
    }

    const maxSize = CONFIG.UPLOAD.MAX_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }

    const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as unknown as string[];

    if (!isHeicFile(file) && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const convertToWebP = FOLDERS_CONVERT_TO_WEBP.includes(folderInput);
    const filePath = await saveFile(file, folderInput, convertToWebP);

    return NextResponse.json({ url: filePath }, { status: 200 });
  } catch (error: Error | unknown) {
    console.error('API Upload Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' }, { status: 500 });
  }
}
