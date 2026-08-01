'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { notifyStepChange } from '@/lib/sse-server';

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

    notifyStepChange(sessionId, stepIndex);

    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined, currentStep: stepIndex, lastActiveStep: savedLastActive };
  } catch (err) {
    console.error('Advance step error:', err);
    return { error: formatError('DB02'), currentStep: undefined, lastActiveStep: undefined };
  }
}
