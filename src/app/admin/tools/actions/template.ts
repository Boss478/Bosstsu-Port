'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolStepTemplate from '@/models/ToolStepTemplate';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import { trackServerEvent } from '@/lib/analytics/server';

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

    await trackServerEvent({
      path: '/admin/tools',
      eventName: 'form_submit',
      metadata: { form: 'tool', action: 'create' },
    });
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
