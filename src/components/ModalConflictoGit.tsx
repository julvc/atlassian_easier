import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface ModalConflictoGitProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalConflictoGit: React.FC<ModalConflictoGitProps> = ({ isOpen, onClose }) => {
  const {
    activeProfile,
    gitPreflightResult,
    resolveGitConflict,
    refreshGitInfo
  } = useApp();

  const [isResolving, setIsResolving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen || !gitPreflightResult) return null;

  const conflictFiles = gitPreflightResult.conflictFiles || [];
  const targetBranch = gitPreflightResult.targetBranch || activeProfile?.targetBranch || 'develop';

  const handleAction = async (action: 'abort' | 'continue' | 'open_vscode') => {
    setIsResolving(true);
    setFeedbackMessage(null);
    try {
      const ok = await resolveGitConflict(action);
      if (action === 'open_vscode') {
        setFeedbackMessage('Se envió la señal para abrir VS Code en el proyecto.');
      } else if (action === 'abort') {
        setFeedbackMessage('Rebase abortado de forma segura. El repositorio volvió al estado previo.');
        await refreshGitInfo();
        setTimeout(() => onClose(), 1200);
      } else if (action === 'continue') {
        if (ok) {
          setFeedbackMessage('Rebase completado con éxito. Rama sincronizada.');
          await refreshGitInfo();
          setTimeout(() => onClose(), 1200);
        } else {
          setFeedbackMessage('Aún quedan archivos en conflicto sin resolver. Resuélvelos en tu editor antes de continuar.');
        }
      }
    } catch (e: any) {
      setFeedbackMessage(`Error: ${e.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="glass-panel w-full max-w-2xl rounded-3xl shadow-2xl border border-rose-500/30 flex flex-col overflow-hidden bg-white/95 dark:bg-[#0E1117]/95">
        
        {/* Header Alert */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/30 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold border border-rose-200 dark:border-rose-800">
              ⚠️
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <span>Conflicto Git en Rama {targetBranch}</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-700">
                  Bloqueo Preventivo
                </span>
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Se detectaron cambios remotos concurrentes en <strong className="font-mono text-rose-600 dark:text-rose-400">origin/{targetBranch}</strong>. Para salvaguardar el trabajo del equipo, el pipeline se detuvo de forma segura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Conflicted Files Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Archivos con conflicto por resolver ({conflictFiles.length}):</span>
              <span className="text-[11px] text-gray-500">HEAD vs origin/{targetBranch}</span>
            </div>

            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
              {conflictFiles.length > 0 ? (
                conflictFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50"
                  >
                    <span className="shrink-0">⚡</span>
                    <span className="truncate font-semibold">{file}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4 text-xs font-sans">
                  No se pudieron listar los archivos o ya fueron reconciliados.
                </div>
              )}
            </div>
          </div>

          {/* Feedback or instructions */}
          {feedbackMessage ? (
            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300 text-xs rounded-xl border border-brand-200 dark:border-brand-800 font-medium">
              {feedbackMessage}
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-1 leading-relaxed">
              <p className="font-bold">¿Cómo proceder?</p>
              <p className="text-[11px]">
                1. Haz clic en <strong>"Abrir en VS Code"</strong> para editar las marcas de conflicto (<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code>).
              </p>
              <p className="text-[11px]">
                2. Guarda los archivos reconciliados y luego pulsa <strong>"Continuar Rebase"</strong>.
              </p>
              <p className="text-[11px]">
                3. Si prefieres cancelar y dejar todo exactamente como estaba antes de intentar la sincronización, pulsa <strong>"Abortar Rebase Seguro"</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleAction('abort')}
            disabled={isResolving}
            className="glass-button text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
          >
            🛡️ Abortar Rebase Seguro
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleAction('open_vscode')}
              disabled={isResolving}
              className="glass-button text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
            >
              <span>💻</span>
              <span>Abrir en VS Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('continue')}
              disabled={isResolving}
              className="glass-button-primary text-xs font-bold text-white px-5 py-2 rounded-xl shadow-md cursor-pointer"
            >
              <span>✓ Continuar Rebase</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
