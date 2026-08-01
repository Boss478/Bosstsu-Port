import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, clearAllCollections } from '../helpers/db';
import { seedSession, seedResponse } from '../helpers/seed';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: (html: string) => html },
}));

describe('Tools Server Actions', () => {
  let verifyAuth: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAllCollections();
    vi.clearAllMocks();
    const auth = await import('@/lib/auth');
    verifyAuth = auth.verifyAuth as never;
  });

  describe('quickStartSession', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { quickStartSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Test');
      const result = await quickStartSession(fd);
      expect(result).toHaveProperty('error');
      expect(result.sessionCode).toBeUndefined();
    });

    it('returns validation error for missing title', async () => {
      verifyAuth.mockResolvedValue(true);
      const { quickStartSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', '');
      const result = await quickStartSession(fd);
      expect(result).toHaveProperty('error');
    });

    it('returns error for invalid tool type', async () => {
      verifyAuth.mockResolvedValue(true);
      const { quickStartSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'invalid_type');
      fd.set('title', 'Test Session');
      const result = await quickStartSession(fd);
      expect(result).toHaveProperty('error');
    });

    it('creates a poll session', async () => {
      verifyAuth.mockResolvedValue(true);
      const { quickStartSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Test Poll');
      fd.set('description', 'A poll test');
      fd.set('allowAnonymous', 'on');
      const result = await quickStartSession(fd);
      expect(result.error).toBeUndefined();
      expect(result.sessionCode).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('creates a multi-step session with steps', async () => {
      verifyAuth.mockResolvedValue(true);
      const { quickStartSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'assignment');
      fd.set('title', 'Multi Step');
      fd.set(
        'steps',
        JSON.stringify([
          { type: 'assignment', title: 'Step 1', config: {} },
          { type: 'poll', title: 'Step 2', config: {} },
        ]),
      );
      const result = await quickStartSession(fd);
      expect(result.error).toBeUndefined();
      expect(result.sessionCode).toBeDefined();
    });
  });

  describe('updateSession', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updateSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('title', 'Updated');
      const result = await updateSession('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('updates session title', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({ title: 'Original' });
      const { updateSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('title', 'Updated Title');
      fd.set('description', 'Updated desc');
      const result = await updateSession(session._id.toString(), fd);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('updateSessionSteps', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { updateSessionSteps } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('steps', '[]');
      const result = await updateSessionSteps('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('returns error without steps', async () => {
      verifyAuth.mockResolvedValue(true);
      const { updateSessionSteps } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      const result = await updateSessionSteps('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
      expect((result as { error?: unknown }).error).toBe('Steps required');
    });

    it('updates session steps', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      const { updateSessionSteps } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('steps', JSON.stringify([{ type: 'assignment', title: 'New Step 1', config: {} }]));
      const result = await updateSessionSteps(session._id.toString(), fd);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('addStage', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { addStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Stage');
      const result = await addStage('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('adds a stage to session', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      const { addStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'New Stage');
      const result = await addStage(session._id.toString(), fd);
      expect(result).toEqual({ error: undefined });
    });

    it('returns 404 for non-existent session', async () => {
      verifyAuth.mockResolvedValue(true);
      const { addStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Stage');
      const result = await addStage('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });
  });

  describe('editStage', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { editStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('index', '0');
      fd.set('type', 'poll');
      fd.set('title', 'Updated');
      const result = await editStage('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('edits a stage in session', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        steps: [{ type: 'poll', title: 'Original Stage', config: {} }],
      });
      const { editStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('index', '0');
      fd.set('type', 'poll');
      fd.set('title', 'Edited Stage');
      const result = await editStage(session._id.toString(), fd);
      expect(result).toEqual({ error: undefined });
    });

    it('returns error for out of bounds index', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        steps: [{ type: 'poll', title: 'Only Stage', config: {} }],
      });
      const { editStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('index', '5');
      fd.set('type', 'poll');
      fd.set('title', 'Out of Bounds');
      const result = await editStage(session._id.toString(), fd);
      expect(result).toHaveProperty('error');
      expect((result as { error?: unknown }).error).toBe('Stage index out of bounds');
    });
  });

  describe('deleteStage', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('index', '0');
      const result = await deleteStage('507f1f77bcf86cd799439011', fd);
      expect(result).toHaveProperty('error');
    });

    it('deletes a stage from session', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        steps: [
          { type: 'poll', title: 'Stage 1', config: {} },
          { type: 'assignment', title: 'Stage 2', config: {} },
        ],
      });
      const { deleteStage } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('index', '0');
      const result = await deleteStage(session._id.toString(), fd);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('toggleActive', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { toggleActive } = await import('@/app/admin/tools/actions');
      const result = await toggleActive('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('toggles active status', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({ isActive: true });
      const { toggleActive } = await import('@/app/admin/tools/actions');
      const result = await toggleActive(session._id.toString());
      expect(result).toEqual({ error: undefined });
    });

    it('returns 404 for non-existent session', async () => {
      verifyAuth.mockResolvedValue(true);
      const { toggleActive } = await import('@/app/admin/tools/actions');
      const result = await toggleActive('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });
  });

  describe('advanceStep', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { advanceStep } = await import('@/app/admin/tools/actions');
      const result = await advanceStep('507f1f77bcf86cd799439011', 0);
      expect(result).toHaveProperty('error');
    });

    it('advances to a step', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        steps: [
          { type: 'poll', title: 'Step 1', config: {} },
          { type: 'assignment', title: 'Step 2', config: {} },
        ],
      });
      const { advanceStep } = await import('@/app/admin/tools/actions');
      const result = await advanceStep(session._id.toString(), 0);
      expect(result.error).toBeUndefined();
      expect(result.currentStep).toBe(0);
    });

    it('returns error for out of bounds step', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({
        steps: [{ type: 'poll', title: 'Step 1', config: {} }],
      });
      const { advanceStep } = await import('@/app/admin/tools/actions');
      const result = await advanceStep(session._id.toString(), 5);
      expect(result).toHaveProperty('error');
    });

    describe('DB contract', () => {
      it('persists currentStep and lastActiveStep in database', async () => {
        const { advanceStep } = await import('@/app/admin/tools/actions');
        const ToolSession = (await import('@/models/ToolSession')).default;

        verifyAuth.mockResolvedValue(true);
        const session = await seedSession({
          steps: [
            { type: 'poll', title: 'Step 1', config: {} },
            { type: 'assignment', title: 'Step 2', config: {} },
            { type: 'padlet', title: 'Step 3', config: {} },
          ],
          currentStep: 0,
        });

        await advanceStep(session._id.toString(), 1);

        const updated = await ToolSession.findById(session._id).lean();
        expect(updated).toBeDefined();
        expect((updated as { currentStep?: unknown }).currentStep).toBe(1);
        expect((updated as { lastActiveStep?: unknown }).lastActiveStep).toBe(1);
      });

      it('sets lastActiveStep to previous currentStep when advancing to -1', async () => {
        const { advanceStep } = await import('@/app/admin/tools/actions');
        const ToolSession = (await import('@/models/ToolSession')).default;

        verifyAuth.mockResolvedValue(true);
        const session = await seedSession({
          steps: [
            { type: 'poll', title: 'Step 1', config: {} },
            { type: 'assignment', title: 'Step 2', config: {} },
          ],
          currentStep: 1,
        });

        await advanceStep(session._id.toString(), -1);

        const updated = await ToolSession.findById(session._id).lean();
        expect((updated as { currentStep?: unknown }).currentStep).toBe(-1);
        expect((updated as { lastActiveStep?: unknown }).lastActiveStep).toBe(1);
      });

      it('returns correct lastActiveStep even on first advance', async () => {
        const { advanceStep } = await import('@/app/admin/tools/actions');

        verifyAuth.mockResolvedValue(true);
        const session = await seedSession({
          steps: [
            { type: 'poll', title: 'Step 1', config: {} },
            { type: 'assignment', title: 'Step 2', config: {} },
          ],
          currentStep: -1,
        });

        const result = await advanceStep(session._id.toString(), 0);
        expect(result.currentStep).toBe(0);
        expect(result.lastActiveStep).toBe(0);
      });
    });
  });

  describe('endSession', () => {
    it('does nothing without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { endSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('sessionId', '507f1f77bcf86cd799439011');
      await endSession(fd);
    });

    it('ends a session', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({ isActive: true });
      const { endSession } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('sessionId', session._id.toString());
      await endSession(fd);
    });
  });

  describe('deleteSession', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteSession } = await import('@/app/admin/tools/actions');
      const result = await deleteSession('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a session and its responses', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      await seedResponse({ sessionId: session._id });
      const { deleteSession } = await import('@/app/admin/tools/actions');
      const result = await deleteSession(session._id.toString());
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteAllResponses', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteAllResponses } = await import('@/app/admin/tools/actions');
      const result = await deleteAllResponses('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes all responses for a session', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      await seedResponse({ sessionId: session._id });
      await seedResponse({ sessionId: session._id });
      const { deleteAllResponses } = await import('@/app/admin/tools/actions');
      const result = await deleteAllResponses(session._id.toString());
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteStudentResponses', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteStudentResponses } = await import('@/app/admin/tools/actions');
      const result = await deleteStudentResponses('507f1f77bcf86cd799439011', 'token');
      expect(result).toHaveProperty('error');
    });

    it('deletes responses for a specific student', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      const studentToken = 'test-student-token';
      await seedResponse({ sessionId: session._id, studentToken });
      await seedResponse({ sessionId: session._id, studentToken: 'other-token' });
      const { deleteStudentResponses } = await import('@/app/admin/tools/actions');
      const result = await deleteStudentResponses(session._id.toString(), studentToken);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('deleteResponse', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteResponse } = await import('@/app/admin/tools/actions');
      const result = await deleteResponse('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('error');
    });

    it('deletes a specific response', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession();
      const response = await seedResponse({ sessionId: session._id });
      const { deleteResponse } = await import('@/app/admin/tools/actions');
      const result = await deleteResponse(response._id.toString());
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('toggleQAAnswered', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { toggleQAAnswered } = await import('@/app/admin/tools/actions');
      const result = await toggleQAAnswered('507f1f77bcf86cd799439011', true);
      expect(result).toHaveProperty('error');
    });

    it('toggles answered status', async () => {
      verifyAuth.mockResolvedValue(true);
      const session = await seedSession({ type: 'qa_board' });
      const response = await seedResponse({ sessionId: session._id });
      const { toggleQAAnswered } = await import('@/app/admin/tools/actions');
      const result = await toggleQAAnswered(response._id.toString(), true);
      expect(result).toEqual({ error: undefined });
    });
  });

  describe('getAllSessions', () => {
    it('returns all sessions without auth requirement', async () => {
      await seedSession({ title: 'Session 1' });
      await seedSession({ title: 'Session 2', sessionCode: 'TEST1' });
      const { getAllSessions } = await import('@/app/admin/tools/actions');
      const sessions = await getAllSessions();
      expect(sessions).toHaveLength(2);
    });

    it('filters by search term', async () => {
      await seedSession({ title: 'Alpha Session' });
      await seedSession({ title: 'Beta Session', sessionCode: 'BETA0' });
      const { getAllSessions } = await import('@/app/admin/tools/actions');
      const sessions = await getAllSessions({ search: 'Alpha' });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].title).toBe('Alpha Session');
    });

    it('filters by type', async () => {
      await seedSession({ title: 'Poll 1', type: 'poll' });
      await seedSession({ title: 'Quiz 1', type: 'quiz', sessionCode: 'QUIZ1' });
      const { getAllSessions } = await import('@/app/admin/tools/actions');
      const sessions = await getAllSessions({ type: 'poll' });
      expect(sessions).toHaveLength(1);
    });

    it('supports pagination', async () => {
      await seedSession({ title: 'S1' });
      await seedSession({ title: 'S2', sessionCode: 'TEST1' });
      await seedSession({ title: 'S3', sessionCode: 'TEST2' });
      const { getAllSessions } = await import('@/app/admin/tools/actions');
      const sessions = await getAllSessions({ skip: 0, limit: 2 });
      expect(sessions).toHaveLength(2);
    });
  });

  describe('countSessions', () => {
    it('counts all sessions', async () => {
      await seedSession({ title: 'Count 1' });
      await seedSession({ title: 'Count 2', sessionCode: 'CNT02' });
      const { countSessions } = await import('@/app/admin/tools/actions');
      const count = await countSessions();
      expect(count).toBe(2);
    });

    it('counts with search filter', async () => {
      await seedSession({ title: 'Alpha Count' });
      await seedSession({ title: 'Beta Count', sessionCode: 'BTACN' });
      const { countSessions } = await import('@/app/admin/tools/actions');
      const count = await countSessions('Alpha');
      expect(count).toBe(1);
    });
  });

  describe('saveTemplate', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { saveTemplate } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Template');
      fd.set('config', '{}');
      const result = await saveTemplate(fd);
      expect(result).toHaveProperty('error');
      expect(result.template).toBeUndefined();
    });

    it('saves a template', async () => {
      verifyAuth.mockResolvedValue(true);
      const { saveTemplate } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'My Template');
      fd.set('config', JSON.stringify({ pollMode: 'mcq' }));
      const result = await saveTemplate(fd);
      expect(result.error).toBeUndefined();
      expect(result.template).toBeDefined();
    });
  });

  describe('getTemplates', () => {
    it('returns templates without auth', async () => {
      const { saveTemplate, getTemplates } = await import('@/app/admin/tools/actions');

      verifyAuth.mockResolvedValue(true);
      const fd = new FormData();
      fd.set('type', 'poll');
      fd.set('title', 'Get Template');
      fd.set('config', '{}');
      await saveTemplate(fd);

      verifyAuth.mockClear();
      const templates = await getTemplates();
      expect(templates).toHaveLength(1);
    });

    it('filters by type', async () => {
      const { saveTemplate, getTemplates } = await import('@/app/admin/tools/actions');

      verifyAuth.mockResolvedValue(true);
      const fd1 = new FormData();
      fd1.set('type', 'poll');
      fd1.set('title', 'Poll Template');
      fd1.set('config', '{}');
      await saveTemplate(fd1);

      const fd2 = new FormData();
      fd2.set('type', 'quiz');
      fd2.set('title', 'Quiz Template');
      fd2.set('config', '{}');
      await saveTemplate(fd2);

      verifyAuth.mockClear();
      const pollTemplates = await getTemplates('poll');
      expect(pollTemplates).toHaveLength(1);
    });
  });

  describe('deleteTemplate', () => {
    it('returns error without auth', async () => {
      verifyAuth.mockResolvedValue(false);
      const { deleteTemplate } = await import('@/app/admin/tools/actions');
      const fd = new FormData();
      fd.set('id', '507f1f77bcf86cd799439011');
      const result = await deleteTemplate(fd);
      expect(result).toHaveProperty('error');
    });

    it('deletes a template', async () => {
      verifyAuth.mockResolvedValue(true);
      const { saveTemplate, deleteTemplate } = await import('@/app/admin/tools/actions');

      const fd1 = new FormData();
      fd1.set('type', 'poll');
      fd1.set('title', 'Delete Template');
      fd1.set('config', '{}');
      const saved = await saveTemplate(fd1);
      const templateId = (saved.template as { _id: string })._id;

      const fd2 = new FormData();
      fd2.set('id', templateId);
      const result = await deleteTemplate(fd2);
      expect(result).toEqual({ error: undefined });
    });
  });
});
