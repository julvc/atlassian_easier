import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PipelineStep } from '../types';

export const PipelineView: React.FC = () => {
  const { activeProfile, logs, isProcessRunning, executePipeline, killProcess, clearLogs } = useApp();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 'step-jira-sync',
      title: 'Paso 1: Sincronizar Jira Cloud & Trazabilidad CMMI',
      description: 'Verifica y actualiza incidencias, asienta bitácoras de trabajo (Worklog) y sincroniza con Jira Cloud.',
      enabled: activeProfile?.enableJira ?? true,
      status: 'idle'
    },
    {
      id: 'step-build-release',
      title: 'Paso 2: Compilar y Empaquetar Ejecutable Windows Offline',
      description: 'Genera el bundle de producción y crea el paquete distribuible (.exe y .zip versionado) en PROYECTOS_SONDA.',
      enabled: true,
      status: 'idle'
    },
    {
      id: 'step-bitbucket-push',
      title: 'Paso 3: Generar Commits CMMI y Push a Bitbucket Cloud',
      description: 'Crea los commits estructurados CMMI con clave Jira, genera el tag de versión y envía la rama a Bitbucket.',
      enabled: activeProfile?.enableBitbucket ?? true,
      status: 'idle'
    }
  ]);

  // Actualizar el estado habilitado si cambia el perfil activo
  useEffect(() => {
    if (!activeProfile) return;
    setSteps(prev => prev.map(s => {
      if (s.id === 'step-jira-sync') return { ...s, enabled: activeProfile.enableJira };
      if (s.id === 'step-bitbucket-push') return { ...s, enabled: activeProfile.enableBitbucket };
      return s;
    }));
  }, [activeProfile?.id, activeProfile?.enableJira, activeProfile?.enableBitbucket]);

  // Auto-scroll al final de la consola
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleStep = (id: string) => {
    if (isProcessRunning) return;
    setSteps(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleRun = async () => {
    await executePipeline(steps);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>🚀 Pipeline de Entrega y Gobernanza</span>
            <span className="text-[10px] bg-sky-950 text-sky-400 font-bold px-2 py-0.5 rounded border border-sky-700/60">
              CAMINO FELIZ
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatiza en secuencia ordenada la sincronización de Jira, compilación del software y push a Bitbucket.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={clearLogs}
            disabled={isProcessRunning}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
          >
            🧹 Limpiar Consola
          </button>

          {!isProcessRunning ? (
            <button
              type="button"
              onClick={handleRun}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-sky-600/30 transition-all flex items-center space-x-2"
            >
              <span>▶️</span>
              <span>Ejecutar Flujo Completo (1-Clic)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={killProcess}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-rose-600/30 transition-all flex items-center space-x-2 animate-pulse"
            >
              <span>⏹️</span>
              <span>Abortar Ejecución</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Directory Card */}
      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xl">📁</span>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Directorio de Ejecución del Proyecto:</div>
            <div className="text-xs font-mono font-bold text-slate-200">
              {activeProfile?.projectPath || '⚠️ Sin ruta local asignada'}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          Proyecto: <span className="text-sky-400 font-semibold">{activeProfile?.name}</span>
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              step.enabled
                ? 'bg-slate-900 border-sky-700/60 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                checked={step.enabled}
                onChange={() => toggleStep(step.id)}
                className="mt-0.5 rounded border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span className="text-sky-400 font-mono">[{idx + 1}/3]</span>
                  <span className="truncate">{step.title.replace(/^Paso \d: /, '')}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Logs Terminal Window */}
      <div className="flex-1 min-h-[300px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Console Header */}
        <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] font-mono text-slate-400 ml-2 font-medium">
              Terminal en Vivo · Node Process Runner
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isProcessRunning && (
              <span className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>En Ejecución...</span>
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-500">
              {logs.length} líneas
            </span>
          </div>
        </div>

        {/* Console Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-0.5 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic select-none py-8 text-center">
              Listo para ejecutar. Presiona "Ejecutar Flujo Completo (1-Clic)" para iniciar el pipeline.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`whitespace-pre-wrap break-all ${
                  log.type === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.type === 'success'
                    ? 'text-emerald-400 font-bold'
                    : log.type === 'stderr'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 text-[10px] mr-2 select-none">
                  [{log.timestamp}]
                </span>
                {log.text}
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
};
