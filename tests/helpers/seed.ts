import mongoose from 'mongoose';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';

interface SeedSessionOptions {
  sessionCode?: string;
  type?: 'padlet' | 'poll' | 'assignment' | 'qa_board' | 'quiz' | 'exit_ticket';
  title?: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
  steps?: Array<{ type: string; title: string; config?: Record<string, unknown> }>;
  currentStep?: number;
  allowStudentNavigation?: boolean;
}

export async function seedSession(
  opts: SeedSessionOptions = {},
): Promise<InstanceType<typeof ToolSession>> {
  const session = await ToolSession.create({
    sessionCode: opts.sessionCode || 'TEST0',
    type: opts.type || 'padlet',
    title: opts.title || 'Test Session',
    isActive: opts.isActive !== undefined ? opts.isActive : true,
    config: opts.config || { maxSubmissions: 3 },
    steps: opts.steps || [],
    currentStep: opts.currentStep !== undefined ? opts.currentStep : -1,
    allowStudentNavigation: opts.allowStudentNavigation || false,
    participantCount: 0,
    responseCount: 0,
  });
  return session;
}

interface SeedResponseOptions {
  sessionId: mongoose.Types.ObjectId | string;
  studentName?: string;
  content?: Record<string, unknown>;
  studentToken?: string;
  editToken?: string;
  fileUrl?: string;
  stepIndex?: number;
  ip?: string;
}

export async function seedResponse(
  opts: SeedResponseOptions,
): Promise<InstanceType<typeof ToolResponse>> {
  const doc: Record<string, unknown> = {
    sessionId: opts.sessionId,
    content: opts.content || {},
    studentToken: opts.studentToken || new mongoose.Types.ObjectId().toString(),
    editToken: opts.editToken || new mongoose.Types.ObjectId().toString(),
    ip: opts.ip || '127.0.0.1',
  };
  if (opts.studentName) doc.studentName = opts.studentName;
  if (opts.fileUrl) doc.fileUrl = opts.fileUrl;
  if (opts.stepIndex !== undefined) doc.stepIndex = opts.stepIndex;

  const response = await ToolResponse.create(doc);
  return response;
}
