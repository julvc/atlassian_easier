import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface ConsoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({ isOpen, onClose }) => {
  const { logs, clearLogs, isProcessRunning } = useApp();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-5xl h-[520px] max-h-[85vh] glass-panel rounded-t-3xl border-t border-x border-black/10 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden bg-[#0A0C10] text-gray-200 animate-in slide-in-from-bottom duration-200"
      >
        {/* Console Header Bar */}
        <div className="h-12 px-6 bg-[#12151D] border-b border-gray-800 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block cursor-pointer hover:opacity-80" onClick={onClose} title="Cerrar consola" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="h-4 w-px bg-gray-700 mx-1" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono font-bold text-gray-100 flex items-center space-x-2">
                <span>💻 Terminal en Vivo</span>
                <span className="text-xs font-normal text-gray-400">· Atlassian Sync & Runner</span>
              </span>
              {isProcessRunning ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Ejecutando en tiempo real...</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-md">
                  {logs.length} líneas
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyLogs}
              title="Copiar contenido de la consola al portapapeles"
              className="px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>📋</span>
              <span>Copiar</span>
            </button>
            <button
              type="button"
              onClick={clearLogs}
              title="Limpiar líneas de la consola"
              className="px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>🧹</span>
              <span>Limpiar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Minimizar consola (seguirá corriendo en segundo plano)"
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ml-2"
            >
              <span>✕ Minimizar</span>
            </button>
          </div>
        </div>

        {/* Console Log Output */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-1 select-text bg-[#0A0C10]">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs italic space-y-2 select-none">
              <span className="text-2xl">⚡</span>
              <span>La terminal está lista. Ejecuta un Smoke Test o Ejecución Real para ver los logs en streaming.</span>
              <span className="text-[11px] text-gray-600">Los procesos Node.js, Git y llamadas API Atlassian se registrarán aquí.</span>
            </div>
          ) : (
            logs.map((log) => {
              let colorClass = 'text-gray-300';
              if (log.type === 'error') colorClass = 'text-rose-400 font-bold bg-rose-950/20 px-2 py-0.5 rounded';
              else if (log.type === 'success') colorClass = 'text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 rounded';
              else if (log.type === 'stderr') colorClass = 'text-amber-400';
              else if (log.type === 'info') colorClass = 'text-sky-400 font-medium';

              return (
                <div key={log.id} className={`leading-relaxed whitespace-pre-wrap break-all ${colorClass}`}>
                  {log.text}
                </div>
              );
            })
          )}
          <div ref={consoleEndRef} />
        </div>

        {/* Footer info strip */}
        <div className="h-8 px-6 bg-[#0E1118] border-t border-gray-800 text-[11px] text-gray-500 font-mono flex items-center justify-between shrink-0 select-none">
          <span>Presiona "Minimizar" para regresar al tablero. Los logs se conservan en memoria.</span>
          <span>Buffer: {logs.length} entradas</span>
        </div>
      </div>
    </div>
  );
};
