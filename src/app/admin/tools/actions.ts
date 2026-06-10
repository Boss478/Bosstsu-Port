'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import ToolStepTemplate from '@/models/ToolStepTemplate';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { generateUniqueSessionCode } from '@/lib/session-code';
import type { ToolType } from '@/models/ToolSession';

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
      // maxSubmissions is handled manually below
    })
    .strict();

  const parsed = updateSessionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await dbConnect();

    // Build update object with nested config.maxSubmissions
    const setData: Record<string, unknown> = { ...parsed.data };
    // Remove any root-level maxSubmissions from parsed.data if present
    delete setData.maxSubmissions;
    if (setData.description !== undefined) {
      setData['config.description'] = setData.description;
      delete setData.description;
    }

    // Set maxSubmissions in config if provided
    if (maxSub !== null) {
      setData['config.maxSubmissions'] = parseInt(maxSub as string);
    }

    await ToolSession.findByIdAndUpdate(sessionId, { $set: setData });
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

    await ToolSession.findByIdAndUpdate(sessionId, { $set: updateData });
    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch {
    return { error: 'Invalid JSON' };
  }
}

export async function addStage(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const raw = {
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    config: formData.get('config') ? JSON.parse(formData.get('config') as string) : {},
    position: formData.get('position') ? parseInt(formData.get('position') as string) : -1,
  };

  const addStageSchema = z
    .object({
      type: z.string().min(1),
      title: z.string().trim().min(1, 'กรุณาระบุชื่อ'),
      config: z.unknown().optional(),
      position: z.number().int().min(-1),
    })
    .strict();

  const parsed = addStageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const toolType = parsed.data.type as ToolType;
  if (!TOOL_TYPES.includes(toolType)) return { error: 'Invalid tool type' };

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId).select('steps currentStep').lean();
    if (!session) return { error: formatError('404') };

    const currentSteps = (session.steps as Array<unknown>) ?? [];
    const step = {
      type: parsed.data.type,
      title: parsed.data.title,
      config: parsed.data.config || {},
    };

    // position: -1 means append; otherwise, clamp to valid range
    const position =
      parsed.data.position === -1
        ? currentSteps.length
        : Math.min(parsed.data.position, currentSteps.length);

    await ToolSession.findByIdAndUpdate(sessionId, {
      $push: { steps: { $each: [step], $position: position } },
    });

    // Adjust currentStep if inserting before the active step
    const currentStep = session.currentStep ?? -1;
    if (currentStep >= 0 && position <= currentStep) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { currentStep: 1 },
      });
    }

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Add stage error:', err);
    return { error: formatError('DB01') };
  }
}

export async function editStage(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const raw = {
    index: parseInt(formData.get('index') as string),
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    config: formData.get('config') ? JSON.parse(formData.get('config') as string) : {},
  };

  const editStageSchema = z
    .object({
      index: z.number().int().min(0),
      type: z.string().min(1),
      title: z.string().trim().min(1, 'กรุณาระบุชื่อ'),
      config: z.unknown().optional(),
    })
    .strict();

  const parsed = editStageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const toolType = parsed.data.type as ToolType;
  if (!TOOL_TYPES.includes(toolType)) return { error: 'Invalid tool type' };

  try {
    await dbConnect();

    // Validate index against actual steps array (prevents corrupting the document)
    const session = await ToolSession.findById(sessionId).select('steps').lean();
    if (!session) return { error: formatError('404') };
    if (parsed.data.index >= ((session.steps as Array<unknown>)?.length ?? 0)) {
      return { error: 'Stage index out of bounds' };
    }

    const step = {
      type: parsed.data.type,
      title: parsed.data.title,
      config: parsed.data.config || {},
    };

    await ToolSession.findByIdAndUpdate(sessionId, {
      $set: { [`steps.${parsed.data.index}`]: step },
    });

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Edit stage error:', err);
    return { error: formatError('DB03') };
  }
}

export async function deleteStage(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const raw = {
    index: parseInt(formData.get('index') as string),
  };

  const deleteStageSchema = z
    .object({
      index: z.number().int().min(0),
    })
    .strict();

  const parsed = deleteStageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId)
      .select('steps currentStep lastActiveStep')
      .lean();
    if (!session) return { error: formatError('404') };

    const steps = session.steps as Array<unknown> | undefined;
    if (!steps || parsed.data.index >= steps.length) {
      return { error: 'Stage index out of bounds' };
    }

    // Remove the step at index
    steps.splice(parsed.data.index, 1);

    // Adjust currentStep if needed
    const currentStep = session.currentStep ?? -1;
    const lastActiveStep = session.lastActiveStep ?? -1;
    let newCurrentStep = currentStep;
    let newLastActiveStep = lastActiveStep;

    if (currentStep === parsed.data.index) {
      // Deleting the active step — reset to waiting
      newCurrentStep = -1;
      newLastActiveStep = -1;
    } else if (currentStep > parsed.data.index) {
      // Deleting a step before the active one — shift down
      newCurrentStep = currentStep - 1;
      if (lastActiveStep > parsed.data.index) {
        newLastActiveStep = lastActiveStep - 1;
      }
    }

    await ToolSession.findByIdAndUpdate(sessionId, {
      $set: {
        steps,
        currentStep: newCurrentStep,
        lastActiveStep: newLastActiveStep >= 0 ? newLastActiveStep : -1,
      },
    });

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Delete stage error:', err);
    return { error: formatError('DB03') };
  }
}

export async function deleteStudentResponses(sessionId: string, studentToken: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const result = await ToolResponse.deleteMany({ sessionId, studentToken });
    if (result.deletedCount > 0) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { responseCount: -result.deletedCount, participantCount: -1 },
      });
    }
    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Delete student responses error:', err);
    return { error: formatError('DB03') };
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

export async function deleteResponse(responseId: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const response = await ToolResponse.findByIdAndDelete(responseId);
    if (response) {
      const sessionId = response.sessionId?.toString();
      if (sessionId) {
        await ToolSession.findByIdAndUpdate(sessionId, {
          $inc: { responseCount: -1 },
        });
      }
    }
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
  return serializeDoc(sessions);
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

export async function advanceStep(sessionId: string, stepIndex: number) {
  const isAuth = await verifyAuth();
  if (!isAuth)
    return { error: formatError('401'), currentStep: undefined, lastActiveStep: undefined };

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId).select('steps currentStep').lean();
    if (!session)
      return { error: formatError('404'), currentStep: undefined, lastActiveStep: undefined };

    const maxStep = (session.steps?.length ?? 1) - 1;
    if (stepIndex < -1 || stepIndex > maxStep) {
      return {
        error: `Step index out of bounds: ${stepIndex} (valid: -1 to ${maxStep})`,
        currentStep: undefined,
        lastActiveStep: undefined,
      };
    }

    const previousStep = (session as { currentStep?: number }).currentStep ?? -1;
    const savedLastActive = stepIndex === -1 ? previousStep : stepIndex;

    await ToolSession.findByIdAndUpdate(sessionId, {
      currentStep: stepIndex,
      lastActiveStep: savedLastActive,
    });

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined, currentStep: stepIndex, lastActiveStep: savedLastActive };
  } catch (err) {
    console.error('Advance step error:', err);
    return { error: formatError('DB02'), currentStep: undefined, lastActiveStep: undefined };
  }
}

const saveTemplateSchema = z
  .object({
    type: z.string().min(1),
    title: z.string().trim().min(1, 'กรุณาระบุชื่อแม่แบบ').max(100),
    config: z.unknown(),
  })
  .strict();

export async function saveTemplate(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401'), template: undefined };

  const raw = {
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    config: formData.get('config') ? JSON.parse(formData.get('config') as string) : {},
  };

  const parsed = saveTemplateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, template: undefined };

  try {
    await dbConnect();
    const template = await ToolStepTemplate.findOneAndUpdate(
      { type: parsed.data.type, title: parsed.data.title },
      { type: parsed.data.type, title: parsed.data.title, config: parsed.data.config },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    revalidatePath('/admin/tools/templates');
    return { error: undefined, template: JSON.parse(JSON.stringify(template)) };
  } catch (err) {
    console.error('Save template error:', err);
    return { error: formatError('DB01'), template: undefined };
  }
}

export async function getTemplates(type?: string) {
  await dbConnect();
  const query = type ? { type } : {};
  const templates = await ToolStepTemplate.find(query).sort({ updatedAt: -1 }).lean();
  return serializeDoc(templates);
}

export async function deleteTemplate(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const id = formData.get('id') as string;
  if (!id) return { error: formatError('404') };

  try {
    await dbConnect();
    await ToolStepTemplate.findByIdAndDelete(id);
    revalidatePath('/admin/tools/templates');
    return { error: undefined };
  } catch (err) {
    console.error('Delete template error:', err);
    return { error: formatError('DB03') };
  }
}
