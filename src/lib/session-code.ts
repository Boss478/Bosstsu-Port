import dbConnect from './db';
import ToolSession from '@/models/ToolSession';
import { CONFIG } from '@/lib/config';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < CONFIG.TOOLS.SESSION_CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateUniqueSessionCode(maxAttempts = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateSessionCode();
    await dbConnect();
    const existing = await ToolSession.findOne({ sessionCode: code }).lean();
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique session code after max attempts');
}