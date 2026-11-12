import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PipelineStep, GovernanceType } from '../types';
import { RocketPipelineIcon } from './icons/NavigationIcons';
import { JiraLiveCard } from './JiraLiveCard';
import { ConsoleDrawer } from './ConsoleDrawer';
import { ModalDescubrirProyectos } from './ModalDescubrirProyectos';
import { ModalConflictoGit } from './ModalConflictoGit';

export const PipelineView: React.FC = () => {
  const {
    activeProfile,
    logs,
    isProcessRunning,
    executePipeline,
    executeRealRun,
    executeSmokeTestReal,
    executeBat,
    runSmokeTest,
    killProcess,
    clearLogs,
    projectScan,
    syncCredentialsFromEnv,
    selectProjectDirectory,
    setProjectPath,
    isDiscoverModalOpen,
    setIsDiscoverModalOpen,
    gitConflictModalOpen,
    setGitConflictModalOpen,
    gitPreflightResult,
    runGitPreflight,
    gitInfo,
    updateActiveProfileGovernance,
    updateActiveProfileTargetBranch,
    isConsoleDrawerOpen,
    setIsConsoleDrawerOpen
  } = useApp();

  const [showAllBats, setShowAllBats] = useState(false);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState(activeProfile?.projectPath || '');

  useEffect(() => {
    if (activeProfile?.projectPath) {
      setPathInput(activeProfile.projectPath);
    }
  }, [activeProfile?.projectPath]);

  const handleSavePath = async () => {
    if (pathInput.trim()) {
      await setProjectPath(pathInput.trim());
      setIsEditingPath(false);
    }
  };

  // Pasos ordenados con paridad a ejecutar_flujo_completo.bat
  // El Paso 3 (compilar ejecutable) está desactivado por defecto para agilizar la entrega Atlassian
  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 'step-bitbucket-push',
      title: 'Paso 1: Commits y Sincronización Git / Bitbucket',
      description: 'Prepara commits (crear_commits_cmmi.cjs o dinámico), sincroniza con origin y publica tag de release (bitbucket_sync.cjs).',
      enabled: activeProfile?.enableBitbucket ?? true,
      status: 'idle'
    },
    {
      id: 'step-jira-sync',
      title: 'Paso 2: Mover Cajas en Jira a "Hecho" & Confluence',
      description: 'Transiciona las tarjetas a "Hecho" (atlassian_sync.cjs), asienta bitácoras (Worklogs) y documenta en Confluence.',
      enabled: activeProfile?.enableJira ?? true,
      status: 'idle'
    },
    {
      id: 'step-build-release',
      title: 'Paso 3: Compilar y Empaquetar Ejecutables (.exe / .zip)',
      description: 'Genera el bundle Vite y empaqueta el ejecutable offline. (Omitido por defecto para entrega rápida).',
      enabled: false,
      status: 'idle'
    }
  ]);

  useEffect(() => {
    if (!activeProfile) return;
    setSteps(prev => prev.map(s => {
      if (s.id === 'step-bitbucket-push') return { ...s, enabled: activeProfile.enableBitbucket };
      if (s.id === 'step-jira-sync') return { ...s, enabled: activeProfile.enableJira };
      return s;
    }));
  }, [activeProfile?.id, activeProfile?.enableJira, activeProfile?.enableBitbucket]);

  const toggleStep = (id: string) => {
    if (isProcessRunning) return;
    setSteps(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleRunFullPipeline = async () => {
    setIsConsoleDrawerOpen(true);
    await executePipeline(steps);
  };

  const currentBranch = gitInfo?.currentBranch || activeProfile?.activeBranch || 'develop';
  const targetBranch = activeProfile?.targetBranch || 'develop';
  const governance = activeProfile?.governanceType || 'cmmi_strict';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-5 select-none pb-20">
      
      {/* 1. Header Minimalista & Hero Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0 pb-1 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <RocketPipelineIcon size={26} />
              <span>Pipeline & Entrega Atlassian</span>
            </h2>
            <span className="text-[10px] font-mono font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              {activeProfile?.jiraProjectKey || 'CCYACE'} · Tablero {activeProfile?.jiraBoardId || '6013'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automatización integral para transicionar tarjetas a "Hecho", imputar horas y sincronizar repositorios Bitbucket.
          </p>
        </div>

        {/* Hero Actions (Unificados y sin botones duplicados) */}
        <div className="flex items-center space-x-3">
          {!isProcessRunning ? (
            <>
              {/* ACCIÓN SECUNDARIA: SMOKE TEST */}
              <button
                type="button"
                onClick={runSmokeTest}
                title="Smoke Test pasivo: valida credenciales, Jira, Bitbucket y Confluence sin mover tarjetas"
                className="glass-button text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center space-x-2 transition-all cursor-pointer shadow-xs border border-black/10 dark:border-white/15"
              >
                <span>🧪</span>
                <span>Smoke Test (Solo Lectura)</span>
              </button>

              {/* ACCIÓN PRIMARIA HERO: EJECUCIÓN REAL */}
              <button
                type="button"
                onClick={executeRealRun || executeSmokeTestReal}
                disabled={!activeProfile?.projectPath}
                title={!activeProfile?.projectPath ? "Debes vincular una carpeta local en tu PC antes de ejecutar la entrega" : "Ejecución Real en Vivo: Sincroniza Git, mueve cajas en Jira a 'Hecho' y asienta bitácoras"}
                className={`text-xs font-bold text-white px-6 py-2.5 rounded-2xl flex items-center space-x-2 shadow-lg transition-all ${
                  !activeProfile?.projectPath
                    ? 'bg-gray-400 dark:bg-gray-700 opacity-60 cursor-not-allowed shadow-none'
                    : 'glass-button-primary shadow-brand-600/30 hover:shadow-brand-600/50 cursor-pointer'
                }`}
              >
                <span>🚀</span>
                <span>Ejecutar Entrega Real</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={killProcess}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center space-x-2 animate-pulse cursor-pointer"
            >
              <span>⏹️</span>
              <span>Abortar Ejecución en Curso</span>
            </button>
          )}

          {/* Botón rápido para abrir consola */}
          <button
            type="button"
            onClick={() => setIsConsoleDrawerOpen(true)}
            title="Abrir terminal en vivo con los logs del sistema"
            className="glass-button p-2.5 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shadow-xs border border-black/10 dark:border-white/15"
          >
            <span className="text-sm">💻</span>
          </button>
        </div>
      </div>

      {/* 2. JIRA LIVE STATUS CARD (Carga Inmediata Jira al abrir) */}
      <JiraLiveCard />

      {/* 3. Directorio del Proyecto & Control Git Concurrente */}
      <div className="glass-panel p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm space-y-4 bg-white/70 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Carpeta y Estado */}
          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-800 flex items-center justify-center text-xl shrink-0 text-brand-600 dark:text-brand-400">
              📁
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Ubicación del Código Local:</span>
                {!activeProfile?.projectPath ? (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                    ⚠️ Sin Carpeta Asignada
                  </span>
                ) : projectScan?.exists ? (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    ✓ Carpeta Verificada
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                    ⚠️ Carpeta No Detectada
                  </span>
                )}
                {projectScan?.env && (
                  <span className="text-[10px] font-mono text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800 font-semibold">
                    .env.atlassian ✓
                  </span>
                )}
              </div>

              {isEditingPath ? (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePath()}
                    placeholder="Ej: C:\Users\jvarasc\Documents\CODIGO\mi-proyecto"
                    className="glass-input text-xs font-mono py-1.5 px-3 flex-1 rounded-xl"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSavePath}
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPathInput(activeProfile?.projectPath || '');
                      setIsEditingPath(false);
                    }}
                    className="glass-button px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-1">
                  {activeProfile?.projectPath ? (
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 truncate max-w-xl" title={activeProfile.projectPath}>
                      {activeProfile.projectPath}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                      Sin carpeta local asignada. Haz clic en "Examinar Carpeta..." para vincularla.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingPath(true)}
                    className="text-[11px] text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 font-semibold underline cursor-pointer ml-1"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botón Explorador Nativo Windows */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={selectProjectDirectory}
              disabled={isProcessRunning}
              title="Abrir explorador de carpetas de Windows para seleccionar proyecto"
              className="glass-button text-xs font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 border border-brand-300 dark:border-brand-800 px-4 py-2 rounded-2xl flex items-center space-x-2 shadow-xs cursor-pointer transition-all"
            >
              <span>📂</span>
              <span>Examinar Carpeta...</span>
            </button>
          </div>
        </div>

        {/* Tira de Gobernanza, Ramas y Concurrencia */}
        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rama local */}
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 font-mono text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/10">
              <span className="text-gray-500">🌿 Rama local:</span>
              <strong className="text-brand-600 dark:text-brand-400">{currentBranch}</strong>
            </span>

            {/* Selector de Rama Objetivo */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-semibold">Rama Objetivo:</span>
              <select
                value={targetBranch}
                onChange={(e) => updateActiveProfileTargetBranch(e.target.value)}
                className="glass-input text-xs font-mono font-bold py-1 px-2.5 rounded-xl text-brand-600 dark:text-brand-400"
              >
                <option value="develop">develop (Equipos Activos)</option>
                <option value="main">main (Producción)</option>
                <option value="master">master</option>
                {gitInfo?.branches?.filter(b => !['develop', 'main', 'master'].includes(b)).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Selector de Gobernanza */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-semibold">Gobernanza:</span>
              <select
                value={governance}
                onChange={(e) => updateActiveProfileGovernance(e.target.value as GovernanceType)}
                className="glass-input text-xs font-semibold py-1 px-2.5 rounded-xl"
              >
                <option value="cmmi_hybrid">CMMI Híbrido (Equipos & Commits Dinámicos)</option>
                <option value="cmmi_strict">CMMI v3.0 Estricto (Auditoría Formal)</option>
                <option value="agile_standard">Ágil Estándar (Sin Prefijos)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => runGitPreflight()}
              disabled={isProcessRunning}
              title="Verificar si otros usuarios empujaron commits concurrentes a origin"
              className="glass-button text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>🛡️</span>
              <span>Preflight Concurrente</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDiscoverModalOpen(true)}
              title="Abrir Catálogo de Repositorios Bitbucket Cloud y Proyectos Locales"
              className="glass-button text-xs font-semibold text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer border border-brand-200 dark:border-brand-800 shadow-xs"
            >
              <span>🌐</span>
              <span>Catálogo Bitbucket</span>
            </button>
          </div>
        </div>

        {/* Banner de Conflicto si preflight reporta 'conflict' */}
        {gitPreflightResult?.status === 'conflict' && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xl">⚠️</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Colisión Detectada: Conflicto Git en origin/{gitPreflightResult.targetBranch}
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 truncate">
                  Hay {gitPreflightResult.conflictFiles?.length || 0} archivo(s) con cambios concurrentes de otros desarrolladores.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGitConflictModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              Resolver Conflicto...
            </button>
          </div>
        )}
      </div>

      {/* Aviso destacado si el proyecto no tiene carpeta vinculada */}
      {!activeProfile?.projectPath && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 select-none">
          <div className="flex items-center space-x-3.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Este proyecto no tiene una carpeta local de código vinculada
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Las tareas y métricas de Jira están activas en tiempo real, pero para ejecutar scripts por lotes (.bat) o sincronizar con Git/Bitbucket necesitas vincular la carpeta local en tu equipo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={selectProjectDirectory}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center space-x-1.5"
          >
            <span>📂</span>
            <span>Vincular Carpeta Local...</span>
          </button>
        </div>
      )}

      {/* 4. Secuencia de Flujo de Entrega */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Secuencia de Entrega Atlassian ({steps.filter(s => s.enabled).length} de {steps.length} pasos activos)
          </span>
          <button
            type="button"
            onClick={handleRunFullPipeline}
            disabled={isProcessRunning}
            className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
          >
            Ejecutar Pasos Seleccionados →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer select-none ${
                step.enabled
                  ? 'glass-card border-brand-500/30 dark:border-brand-500/40 shadow-xs'
                  : 'bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={() => toggleStep(step.id)}
                  className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-0 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-1.5">
                    <span className="text-brand-600 dark:text-brand-400 font-mono">[{idx + 1}/3]</span>
                    <span className="truncate">{step.title.replace(/^Paso \d: /, '')}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {step.description}
                  </p>
                  {step.id === 'step-jira-sync' && (
                    <span className="inline-block mt-2 text-[9px] text-brand-700 dark:text-brand-300 font-bold bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                      🎯 Mueve tarjetas a 'Hecho'
                    </span>
                  )}
                  {step.id === 'step-build-release' && !step.enabled && (
                    <span className="inline-block mt-2 text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      ⚡ Omitido para entrega rápida
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Lanzadores .BAT del Proyecto Base (Colapsable) */}
      {projectScan?.bats && projectScan.bats.length > 0 && (
        <div className="p-4 rounded-3xl glass-card border border-black/5 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">📜</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Scripts Ejecutables (.bat) detectados ({projectScan.bats.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllBats(!showAllBats)}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
            >
              {showAllBats ? 'Ocultar catálogo' : 'Mostrar catálogo'}
            </button>
          </div>

          {showAllBats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
              {projectScan.bats.map(b => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => executeBat(b.name)}
                  disabled={isProcessRunning}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    b.isMaster
                      ? 'bg-brand-50/50 dark:bg-brand-950/40 border-brand-500/40 text-brand-900 dark:text-brand-100 shadow-xs'
                      : 'glass-card border-black/5 dark:border-white/10 hover:border-black/15'
                  }`}
                >
                  <span className="text-xs font-mono font-bold truncate block" title={b.name}>
                    {b.name}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    ▶ Ejecutar
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Barra Dock Inferior Flotante de la Terminal */}
      <div className="fixed bottom-4 left-72 right-8 z-30">
        <div className="glass-panel px-5 py-3 rounded-2xl border border-black/10 dark:border-white/15 shadow-2xl flex items-center justify-between backdrop-blur-md bg-white/90 dark:bg-[#0E1117]/90">
          <div className="flex items-center space-x-3 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isProcessRunning ? 'bg-emerald-500 animate-pulse' : logs.length > 0 ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            
            <div className="flex items-center space-x-2 truncate">
              <span className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                {isProcessRunning ? '⚡ Ejecutando proceso en tiempo real...' : 'Terminal en Reposo'}
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                ({logs.length} líneas registradas)
              </span>
              {logs.length > 0 && !isProcessRunning && (
                <span className="text-[11px] text-gray-400 truncate max-w-md hidden xl:inline">
                  Último: {logs[logs.length - 1].text.substring(0, 60)}...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={clearLogs}
                title="Limpiar logs de la terminal"
                className="glass-button text-xs font-medium px-3 py-1.5 rounded-xl cursor-pointer"
              >
                🧹 Limpiar
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsConsoleDrawerOpen(true)}
              className="glass-button-primary text-xs font-bold text-white px-4 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <span>💻</span>
              <span>Abrir Consola {logs.length > 0 ? `(${logs.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7. Modales de la Suite */}
      <ConsoleDrawer
        isOpen={isConsoleDrawerOpen}
        onClose={() => setIsConsoleDrawerOpen(false)}
      />

      <ModalDescubrirProyectos
        isOpen={isDiscoverModalOpen}
        onClose={() => setIsDiscoverModalOpen(false)}
      />

      <ModalConflictoGit
        isOpen={gitConflictModalOpen}
        onClose={() => setGitConflictModalOpen(false)}
      />
    </div>
  );
};
