'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { generateUniqueSessionCode } from '@/lib/session-code';
import type { ToolType } from '@/models/ToolSession';

const TOOL_TYPES: ToolType[] = [
  'padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket', 'discussion'
];

const quickStartSchema = z.object({
  type: z.string().min(1),
  title: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100),
  prompt: z.string().optional(),
  allowAnonymous: z.boolean().optional(),
  maxSubmissions: z.number().optional(),
  allowFileUpload: z.boolean().optional(),
  pollMode: z.enum(['mcq', 'wordcloud']).optional(),
  allowCustomChoices: z.boolean().optional(),
  questions: z.array(z.object({
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.number().optional(),
  })).optional(),
}).strict();

export async function quickStartSession(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401'), sessionCode: undefined, sessionId: undefined };

  const raw = {
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    prompt: formData.get('prompt') as string || undefined,
    allowAnonymous: formData.get('allowAnonymous') === 'on',
    maxSubmissions: formData.get('maxSubmissions') ? parseInt(formData.get('maxSubmissions') as string) : undefined,
    allowFileUpload: formData.get('allowFileUpload') === 'on',
    pollMode: formData.get('pollMode') as 'mcq' | 'wordcloud' || undefined,
    allowCustomChoices: formData.get('allowCustomChoices') === 'on',
    questions: formData.get('questions') ? JSON.parse(formData.get('questions') as string) : undefined,
  };

  const parsed = quickStartSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, sessionCode: undefined, sessionId: undefined };

  const toolType = parsed.data.type as ToolType;
  if (!TOOL_TYPES.includes(toolType)) return { error: 'Invalid tool type', sessionCode: undefined, sessionId: undefined };

  try {
    await dbConnect();
    const sessionCode = await generateUniqueSessionCode();

    const config: Record<string, unknown> = {};
    if (parsed.data.prompt) config.prompt = parsed.data.prompt;
    if (parsed.data.allowAnonymous !== undefined) config.allowAnonymous = parsed.data.allowAnonymous;
    if (parsed.data.maxSubmissions) config.maxSubmissions = parsed.data.maxSubmissions;
    if (parsed.data.allowFileUpload !== undefined) config.allowFileUpload = parsed.data.allowFileUpload;
    if (parsed.data.pollMode) config.pollMode = parsed.data.pollMode;
    if (parsed.data.allowCustomChoices) config.allowCustomChoices = parsed.data.allowCustomChoices;
    if (parsed.data.questions) config.questions = parsed.data.questions;

    const session = await ToolSession.create({
      sessionCode,
      type: toolType,
      title: parsed.data.title,
      config,
      isActive: true,
    });

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${session._id}`);
    return { error: undefined, sessionCode, sessionId: session._id.toString() };
  } catch (err) {
    console.error('Quick start session error:', err);
    return { error: formatError('DB01'), sessionCode: undefined, sessionId: undefined };
  }
}

export async function endSession(formData: FormData): Promise<void> {
  const sessionId = formData.get('sessionId') as string;
  if (!sessionId) return;

  const isAuth = await verifyAuth();
  if (!isAuth) return;

  try {
    await dbConnect();
    await ToolSession.findByIdAndUpdate(sessionId, {
      isActive: false,
      endedAt: new Date(),
    });
  } catch (err) {
    console.error('End session error:', err);
    return;
  }

  revalidatePath('/admin/tools');
  revalidatePath(`/admin/tools/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await ToolResponse.deleteMany({ sessionId });
    await ToolSession.findByIdAndDelete(sessionId);
  } catch (err) {
    console.error('Delete session error:', err);
    return { error: formatError('DB03') };
  }

  revalidatePath('/admin/tools');
  return { error: undefined };
}

export async function deleteResponse(responseId: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await ToolResponse.findByIdAndDelete(responseId);
  } catch (err) {
    console.error('Delete response error:', err);
    return { error: formatError('DB03') };
  }

  return { error: undefined };
}

export async function toggleQAAnswered(responseId: string, isAnswered: boolean) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await ToolResponse.findByIdAndUpdate(responseId, {
      'content.isAnswered': isAnswered,
    });
  } catch (err) {
    console.error('Toggle answered error:', err);
    return { error: formatError('DB02') };
  }

  return { error: undefined };
}

export async function getAllSessions(options?: {
  search?: string;
  sort?: string;
  type?: string;
  limit?: number;
  skip?: number;
}) {
  await dbConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (options?.search) {
    const search = options.search;
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sessionCode: { $regex: search, $options: 'i' } },
    ];
  }
  if (options?.type) {
    query.type = options.type;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sortQuery: any = { createdAt: -1 };
  if (options?.sort === 'oldest') sortQuery = { createdAt: 1 };
  if (options?.sort === 'type_asc') sortQuery = { type: 1 };
  if (options?.sort === 'type_desc') sortQuery = { type: -1 };

  let chain = ToolSession.find(query).sort(sortQuery);
  if (options?.skip !== undefined && options?.limit !== undefined) {
    chain = chain.skip(options.skip).limit(options.limit);
  }

  const sessions = await chain.lean();
  return JSON.parse(JSON.stringify(sessions));
}

export async function countSessions(search?: string, type?: string) {
  await dbConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sessionCode: { $regex: search, $options: 'i' } },
    ];
  }
  if (type) {
    query.type = type;
  }

  return ToolSession.countDocuments(query);
}

export async function toggleActive(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const session = await ToolSession.findById(id).select('_id isActive');
    if (!session) return { error: formatError('404') };

    const newIsActive = !session.isActive;
    await ToolSession.findByIdAndUpdate(id, {
      isActive: newIsActive,
      endedAt: newIsActive ? null : new Date(),
    });
  } catch (err) {
    console.error('Toggle active error:', err);
    return { error: formatError('DB02') };
  }

  revalidatePath('/admin/tools');
  return { error: undefined };
}

