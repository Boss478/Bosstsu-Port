'use client';

import { useState, useEffect, useCallback } from 'react';
import { deleteStudentResponses } from '@/app/admin/tools/actions';

interface Participant {
  studentToken: string;
  studentName?: string;
  createdAt: string;
  responseCount: number;
}

interface StudentListProps {
  sessionId: string;
}

export default function StudentList({ sessionId }: StudentListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/participants?sessionId=${sessionId}`);
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Fetch participants error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleRemove = async (studentToken: string) => {
    if (!confirm('Remove this student and all their responses?')) return;
    setRemoving(studentToken);
    const result = await deleteStudentResponses(sessionId, studentToken);
    setRemoving(null);
    if (!result?.error) {
      setParticipants((prev) => prev.filter((p) => p.studentToken !== studentToken));
    }
  };

  return (
    <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Participants ({participants.length})</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
          title="Refresh participants"
        >
          <i className={`fi fi-sr-refresh text-xs ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="text-center text-zinc-400 py-8">
          <i aria-hidden="true" className="fi fi-sr-spinner animate-spin text-xl" />
        </div>
      ) : participants.length === 0 ? (
        <p className="text-center text-zinc-400 py-8">No participants yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Student</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Responses</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">First submitted</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr
                  key={p.studentToken}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-slate-700/30"
                >
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <i aria-hidden="true" className="fi fi-sr-user text-xs text-zinc-400" />
                      <span>{p.studentName || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{p.responseCount}</td>
                  <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 text-xs">
                    {new Date(p.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(p.studentToken)}
                      disabled={removing === p.studentToken}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 text-xs px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {removing === p.studentToken ? (
                        <i aria-hidden="true" className="fi fi-sr-spinner animate-spin" />
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
