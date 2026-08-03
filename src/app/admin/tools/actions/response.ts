'use server';

import fs from 'fs';
import path from 'path';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { verifyAuth } from '@/lib/auth';
import { notifyStepChange, notifyResponsesChange } from '@/lib/sse-server';
import { formatError } from '@/lib/error-code';
import { revalidatePath } from 'next/cache';

// Cap on tracked kicked students per session — prevents unbounded array growth
const MAX_KICKED_STUDENTS = 500;

export async function deleteStudentResponses(sessionId: string, studentToken: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId).lean();
    const result = await ToolResponse.deleteMany({ sessionId, studentToken });
    if (result.deletedCount > 0) {
      // Pipeline update: bounded kickedStudents (set-union, capped) + count fixes
      await ToolSession.findByIdAndUpdate(
        sessionId,
        [
          {
            $set: {
              responseCount: {
                $max: [{ $add: [{ $ifNull: ['$responseCount', 0] }, -result.deletedCount] }, 0],
              },
              participantCount: {
                $max: [{ $add: [{ $ifNull: ['$participantCount', 0] }, -1] }, 0],
              },
              kickedStudents: {
                $cond: [
                  { $gte: [{ $size: { $ifNull: ['$kickedStudents', []] } }, MAX_KICKED_STUDENTS] },
                  { $ifNull: ['$kickedStudents', []] },
                  { $setUnion: [{ $ifNull: ['$kickedStudents', []] }, [studentToken]] },
                ],
              },
            },
          },
        ],
        { updatePipeline: true },
      );
      notifyStepChange(sessionId, (session as { currentStep?: number } | null)?.currentStep ?? -1, [
        studentToken,
      ]);
      notifyResponsesChange(sessionId);
    }
    revalidatePath('/admin/tools');
    revalidatePath(`/admin/tools/sessions/${sessionId}`);
    return { error: undefined };
  } catch (err) {
    console.error('Delete student responses error:', err);
    return { error: formatError('DB03') };
  }
}

export async function deleteResponse(responseId: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const response = await ToolResponse.findByIdAndDelete(responseId);
    if (response) {
      // Unlink the uploaded file (mirrors respond DELETE + session delete pattern)
      if (response.fileUrl) {
        const filePath = path.join(process.cwd(), 'public', response.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      const sessionId = response.sessionId?.toString();
      if (sessionId) {
        await ToolSession.findByIdAndUpdate(sessionId, {
          $inc: { responseCount: -1 },
        });
        notifyResponsesChange(sessionId);
        revalidatePath('/admin/tools');
        revalidatePath(`/admin/tools/sessions/${sessionId}`);
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
    const response = await ToolResponse.findByIdAndUpdate(responseId, {
      'content.isAnswered': isAnswered,
    });
    if (response?.sessionId) {
      const sessionId = String(response.sessionId);
      notifyResponsesChange(sessionId);
      revalidatePath('/admin/tools');
      revalidatePath(`/admin/tools/sessions/${sessionId}`);
    }
  } catch (err) {
    console.error('Toggle answered error:', err);
    return { error: formatError('DB02') };
  }

  return { error: undefined };
}
