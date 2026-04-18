import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveFile, isHeicFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';
import { createErrorResponse } from '@/lib/error-code';

const ALLOWED_FOLDERS = [...CONFIG.UPLOAD.ALLOWED_FOLDERS] as string[];
const FOLDERS_CONVERT_TO_WEBP = [...CONFIG.UPLOAD.FOLDERS_CONVERT_TO_WEBP] as string[];

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    const err = createErrorResponse('401');
    return NextResponse.json({ error: err }, { status: err.httpStatus });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderInput = (formData.get('folder') as string) || 'misc';

    if (!file) {
      const err = createErrorResponse('400');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    if (!ALLOWED_FOLDERS.includes(folderInput)) {
      const err = createErrorResponse('U04');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const maxSize = CONFIG.UPLOAD.MAX_SIZE;
    if (file.size > maxSize) {
      const err = createErrorResponse('U01');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as unknown as string[];

    if (!isHeicFile(file) && !allowedTypes.includes(file.type)) {
      const err = createErrorResponse('U02');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const convertToWebP = FOLDERS_CONVERT_TO_WEBP.includes(folderInput);
    const filePath = await saveFile(file, folderInput, convertToWebP);

    return NextResponse.json({ url: filePath }, { status: 200 });
  } catch (error: Error | unknown) {
    console.error('API Upload Error:', error);
    const err = createErrorResponse('500');
    return NextResponse.json({ error: err }, { status: err.httpStatus });
  }
}