'use client';

import { t } from '@/lib/tool-translations';
import MascotSelector from './mascots/MascotSelector';
import MascotAvatar from './mascots/MascotAvatar';

interface StudentSetupScreenProps {
  studentName: string;
  onNameChange: (name: string) => void;
  selectedMascot: string | null;
  onMascotSelect: (id: string) => void;
  onConfirm: () => void;
  requireName?: boolean;
  enableMascots?: boolean;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  sessionTitle?: string;
  children?: React.ReactNode;
}

export default function StudentSetupScreen({
  studentName,
  onNameChange,
  selectedMascot,
  onMascotSelect,
  onConfirm,
  requireName = false,
  enableMascots = true,
  confirmDisabled = false,
  confirmLabel = 'เข้าร่วม',
  sessionTitle,
  children,
}: StudentSetupScreenProps) {
  const showLivePreview = selectedMascot || studentName.trim();

  return (
    <>
      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center space-y-4">
          {showLivePreview && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-slate-900/50 border border-zinc-100 dark:border-slate-700/30">
              {enableMascots && selectedMascot && (
                <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                  <MascotAvatar mascotId={selectedMascot} size={32} />
                </div>
              )}
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {requireName && studentName.trim() ? studentName.trim() : t('anonymousShort')}
              </span>
            </div>
          )}

          {!showLivePreview && (
            <i aria-hidden="true" className="fi fi-sr-user text-4xl text-blue-400 block" />
          )}

          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {requireName ? t('yourName') : t('yourName')}
            </h2>
            {sessionTitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{sessionTitle}</p>
            )}
          </div>

          {requireName && (
            <input
              type="text"
              value={studentName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('yourNameOptional')}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              autoFocus
            />
          )}

          {enableMascots && (
            <MascotSelector selectedId={selectedMascot} onSelect={onMascotSelect} />
          )}

          <button
            onClick={onConfirm}
            disabled={confirmDisabled || (requireName && !studentName.trim())}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>

          {children}
        </div>
      </div>
    </>
  );
}
