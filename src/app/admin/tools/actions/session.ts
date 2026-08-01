'use server';

import { revalidatePath } from 'next/cache';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { trackServerEvent } from '@/lib/analytics/server';
import { generateUniqueSessionCode } from '@/lib/session-code';
import type { ToolType } from '@/models/ToolSession';
import { z } from 'zod';

const TOOL_TYPES: ToolType[] = ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket'];

const quickStartSchema = z
  .object({
    type: z.string().min(1),
    title: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100),
    description: z.string().optional(),
    prompt: z.string().optional(),
    allowAnonymous: z.boolean().optional(),
    maxSubmissions: z.number().optional(),
    allowFileUpload: z.boolean().optional(),
    pollMode: z.enum(['mcq', 'wordcloud']).optional(),
    allowCustomChoices: z.boolean().optional(),
    questions: z
      .array(
        z.object({
          question: z.string().optional(),
          options: z.array(z.string()).optional(),
          correctAnswer: z.number().optional(),
        }),
      )
      .optional(),
    steps: z
      .array(
        z.object({
          type: z.string().min(1),
          title: z.string().min(1),
          config: z.unknown().optional(),
        }),
      )
      .optional(),
    allowStudentNavigation: z.boolean().optional(),
    requireStudentName: z.boolean().optional(),
    forceTier: z.string().optional(),
    customTierConfig: z.unknown().optional(),
  })
  .strict();

export async function quickStartSession(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401'), sessionCode: undefined, sessionId: undefined };

  const raw = {
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    prompt: (formData.get('prompt') as string) || undefined,
    allowAnonymous: formData.get('allowAnonymous') === 'on',
    maxSubmissions: formData.get('maxSubmissions')
      ? parseInt(formData.get('maxSubmissions') as string)
      : undefined,
    allowFileUpload: formData.get('allowFileUpload') === 'on',
    pollMode: (formData.get('pollMode') as 'mcq' | 'wordcloud') || undefined,
    allowCustomChoices: formData.get('allowCustomChoices') === 'on',
    questions: formData.get('questions')
      ? JSON.parse(formData.get('questions') as string)
      : undefined,
    steps: formData.get('steps') ? JSON.parse(formData.get('steps') as string) : undefined,
    allowStudentNavigation: formData.get('allowStudentNavigation') === 'on',
    requireStudentName: formData.get('requireStudentName') === 'on',
    forceTier: (formData.get('forceTier') as string) || undefined,
    customTierConfig: formData.get('customTierConfig')
      ? JSON.parse(formData.get('customTierConfig') as string)
      : undefined,
  };

  const parsed = quickStartSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, sessionCode: undefined, sessionId: undefined };

  const toolType = parsed.data.type as ToolType;
  if (!TOOL_TYPES.includes(toolType))
    return { error: 'Invalid tool type', sessionCode: undefined, sessionId: undefined };

  try {
    await dbConnect();
    const sessionCode = await generateUniqueSessionCode();

    const config: Record<string, unknown> = {};
    if (parsed.data.description) config.description = parsed.data.description;
    if (parsed.data.prompt) config.prompt = parsed.data.prompt;
    if (parsed.data.allowAnonymous !== undefined)
      config.allowAnonymous = parsed.data.allowAnonymous;
    if (parsed.data.maxSubmissions) config.maxSubmissions = parsed.data.maxSubmissions;
    if (parsed.data.allowFileUpload !== undefined)
      config.allowFileUpload = parsed.data.allowFileUpload;
    if (parsed.data.pollMode) config.pollMode = parsed.data.pollMode;
    if (parsed.data.allowCustomChoices) config.allowCustomChoices = parsed.data.allowCustomChoices;
    if (parsed.data.questions) config.questions = parsed.data.questions;
    if (formData.get('enableMascots') === 'off') config.enableMascots = false;
    if (parsed.data.forceTier) config.forceTier = parsed.data.forceTier;
    if (parsed.data.customTierConfig) config.customTierConfig = parsed.data.customTierConfig;

    const isMultiStep = parsed.data.steps && parsed.data.steps.length > 0;
    const sessionData: Record<string, unknown> = {
      sessionCode,
      type: isMultiStep ? (parsed.data.steps![0].type as ToolType) : toolType,
      title: parsed.data.title,
      config,
      requireStudentName: parsed.data.requireStudentName ?? false,
      isActive: true,
    };

    if (isMultiStep) {
      sessionData.steps = parsed.data.steps;
      sessionData.currentStep = -1;
      sessionData.allowStudentNavigation = parsed.data.allowStudentNavigation ?? false;
    }

    const session = await ToolSession.create(sessionData);

    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'create' },
    });

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${session._id}`);
    return { error: undefined, sessionCode, sessionId: session._id.toString() };
  } catch (err) {
    console.error('Quick start session error:', err);
    return { error: formatError('DB01'), sessionCode: undefined, sessionId: undefined };
  }
}

export async function updateSession(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const raw: Record<string, unknown> = {};
  const title = formData.get('title') as string;
  if (title) raw.title = title.trim();
  const description = formData.get('description') as string;
  if (description !== null) raw.description = description;
  raw.requireStudentName = formData.has('requireStudentName');
  const maxSub = formData.get('maxSubmissions');

  const updateSessionSchema = z
    .object({
      title: z.string().trim().min(1).max(100).optional(),
      description: z.string().optional(),
      requireStudentName: z.boolean().optional(),
    })
    .strict();

  const parsed = updateSessionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await dbConnect();

    const setData: Record<string, unknown> = { ...parsed.data };
    delete setData.maxSubmissions;
    if (setData.description !== undefined) {
      setData['config.description'] = setData.description;
      delete setData.description;
    }

    if (maxSub !== null) {
      setData['config.maxSubmissions'] = parseInt(maxSub as string);
    }
    if (formData.get('enableMascots') === 'off') {
      setData['config.enableMascots'] = false;
    }
    const forceTier = formData.get('forceTier') as string;
    if (forceTier) setData['config.forceTier'] = forceTier;
    const customTierConfig = formData.get('customTierConfig') as string;
    if (customTierConfig) setData['config.customTierConfig'] = JSON.parse(customTierConfig);

    await ToolSession.findByIdAndUpdate(sessionId, { $set: setData });
    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'edit' },
    });
    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Update session error:', err);
    return { error: formatError('DB03') };
  }
}

export async function updateSessionSteps(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const stepsRaw = formData.get('steps') as string;
  const requireStudentName = formData.has('requireStudentName');
  if (!stepsRaw) return { error: 'Steps required' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  try {
    const steps = JSON.parse(stepsRaw);
    const stepsSchema = z.array(
      z.object({
        type: z.string().min(1),
        title: z.string().min(1),
        config: z.unknown().optional(),
      }),
    );
    const parsed = stepsSchema.safeParse(steps);
    if (!parsed.success) return { error: 'Invalid step data' };

    await dbConnect();

    const updateData: Record<string, unknown> = {
      steps: parsed.data,
      currentStep: -1,
      requireStudentName,
    };
    if (title) updateData.title = title.trim();
    if (description) updateData['config.description'] = description.trim();
    if (formData.get('enableMascots') === 'off') {
      updateData['config.enableMascots'] = false;
    }

    await ToolSession.findByIdAndUpdate(sessionId, { $set: updateData });
    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'edit' },
    });
    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch {
    return { error: 'Invalid JSON' };
  }
}

export async function getAllSessions(options?: {
  search?: string;
  sort?: string;
  type?: string;
  limit?: number;
  skip?: number;
}) {
  await dbConnect();

  const query: Record<string, unknown> = {};
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

  let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
  if (options?.sort === 'oldest') sortQuery = { createdAt: 1 };
  if (options?.sort === 'type_asc') sortQuery = { type: 1 };
  if (options?.sort === 'type_desc') sortQuery = { type: -1 };

  let chain = ToolSession.find(query).sort(sortQuery);
  if (options?.skip !== undefined && options?.limit !== undefined) {
    chain = chain.skip(options.skip).limit(options.limit);
  }

  const sessions = await chain.lean();
  return serializeDoc(sessions);
}

export async function countSessions(search?: string, type?: string) {
  await dbConnect();

  const query: Record<string, unknown> = {};
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
    const session = await ToolSession.findById(id).select('_id isActive').lean();
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

export async function deleteAllResponses(sessionId: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await ToolResponse.deleteMany({ sessionId });
    await ToolSession.findByIdAndUpdate(sessionId, { responseCount: 0 });
  } catch (err) {
    console.error('Delete all responses error:', err);
    return { error: formatError('DB03') };
  }

  revalidatePath('/admin/tools');
  revalidatePath(`/admin/tools/sessions/${sessionId}`);
  return { error: undefined };
}
