import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveFile, isHeicFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';
import { getError } from '@/lib/error-code';

const ALLOWED_FOLDERS = [...CONFIG.UPLOAD.ALLOWED_FOLDERS] as string[];
const FOLDERS_CONVERT_TO_WEBP = [...CONFIG.UPLOAD.FOLDERS_CONVERT_TO_WEBP] as string[];

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    const err = getError('401');
    return NextResponse.json({ error: err }, { status: err.httpStatus });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderInput = (formData.get('folder') as string) || 'misc';

    if (!file) {
      const err = getError('400');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    if (!ALLOWED_FOLDERS.includes(folderInput)) {
      const err = getError('U04');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const maxSize = CONFIG.UPLOAD.MAX_SIZE;
    if (file.size > maxSize) {
      const err = getError('U01');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const allowedTypes = CONFIG.UPLOAD.ALLOWED_TYPES as unknown as string[];

    if (!isHeicFile(file) && !allowedTypes.includes(file.type)) {
      const err = getError('U02');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }

    const convertToWebP = FOLDERS_CONVERT_TO_WEBP.includes(folderInput);
    const filePath = await saveFile(file, folderInput, convertToWebP);

    return NextResponse.json({ url: filePath }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Upload Error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('ERROR_U05') || msg.includes('ERROR_U06') || msg.includes('ERROR_U07')) {
      const err = getError(msg.includes('U07') ? 'U07' : msg.includes('U06') ? 'U06' : 'U05');
      return NextResponse.json({ error: err }, { status: err.httpStatus });
    }
    const err = getError('500');
    return NextResponse.json({ error: err }, { status: err.httpStatus });
  }
}