'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import type { ToolType } from '@/models/ToolSession';
import { trackServerEvent } from '@/lib/analytics/server';

const TOOL_TYPES: ToolType[] = ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket'];

const addStageSchema = z
  .object({
    type: z.string().min(1),
    title: z.string().trim().min(1, 'กรุณาระบุชื่อ'),
    config: z.unknown().optional(),
    position: z.number().int().min(-1),
  })
  .strict();

const editStageSchema = z
  .object({
    index: z.number().int().min(0),
    type: z.string().min(1),
    title: z.string().trim().min(1, 'กรุณาระบุชื่อ'),
    config: z.unknown().optional(),
  })
  .strict();

const deleteStageSchema = z
  .object({
    index: z.number().int().min(0),
  })
  .strict();

export async function addStage(sessionId: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const raw = {
    type: formData.get('type') as string,
    title: formData.get('title') as string,
    config: formData.get('config') ? JSON.parse(formData.get('config') as string) : {},
    position: formData.get('position') ? parseInt(formData.get('position') as string) : -1,
  };

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

    const position =
      parsed.data.position === -1
        ? currentSteps.length
        : Math.min(parsed.data.position, currentSteps.length);

    await ToolSession.findByIdAndUpdate(sessionId, {
      $push: { steps: { $each: [step], $position: position } },
    });

    const currentStep = session.currentStep ?? -1;
    if (currentStep >= 0 && position <= currentStep) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { currentStep: 1 },
      });
    }

    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'create' },
    });
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

  const parsed = editStageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const toolType = parsed.data.type as ToolType;
  if (!TOOL_TYPES.includes(toolType)) return { error: 'Invalid tool type' };

  try {
    await dbConnect();

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

    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'edit' },
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

    steps.splice(parsed.data.index, 1);

    const currentStep = session.currentStep ?? -1;
    const lastActiveStep = session.lastActiveStep ?? -1;
    let newCurrentStep = currentStep;
    let newLastActiveStep = lastActiveStep;

    if (currentStep === parsed.data.index) {
      newCurrentStep = -1;
      newLastActiveStep = -1;
    } else if (currentStep > parsed.data.index) {
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
