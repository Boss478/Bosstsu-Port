'use server';

import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { revalidatePath } from 'next/cache';

export async function deleteStudentResponses(sessionId: string, studentToken: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    const result = await ToolResponse.deleteMany({ sessionId, studentToken });
    if (result.deletedCount > 0) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { responseCount: -result.deletedCount, participantCount: -1 },
        $push: { kickedStudents: studentToken },
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
