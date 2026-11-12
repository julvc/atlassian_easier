import React from 'react';
import { useApp } from '../context/AppContext';
import { KanbanJiraIcon } from './icons/NavigationIcons';

export const JiraLiveCard: React.FC = () => {
  const {
    activeProfile,
    currentUser,
    jiraIssues,
    isLoadingIssues,
    connectionStatus,
    refreshJiraData,
    transitionIssueDirectly,
    setSelectedIssueForWorklog,
    setCurrentView,
    syncCredentialsFromEnv
  } = useApp();

  const todoIssues = jiraIssues.filter(i => i.fields?.status?.statusCategory?.key === 'new');
  const inProgressIssues = jiraIssues.filter(i => i.fields?.status?.statusCategory?.key === 'indeterminate');
  const doneIssues = jiraIssues.filter(i => i.fields?.status?.statusCategory?.key === 'done');

  return (
    <div className="glass-panel p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-md space-y-4 select-none bg-white/80 dark:bg-white/5">
      {/* Top Bar: Connection, User & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
            <KanbanJiraIcon size={24} isActive={true} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <span>Tablero Jira en Vivo</span>
                <span className="font-mono text-brand-600 dark:text-brand-400">({activeProfile?.jiraProjectKey || 'CCYACE'})</span>
              </h3>

              {/* Status Ping */}
              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                connectionStatus.jira === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : connectionStatus.jira === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus.jira === 'ok' ? 'bg-emerald-500 animate-pulse' : connectionStatus.jira === 'error' ? 'bg-rose-500' : 'bg-gray-400'
                }`} />
                <span>{connectionStatus.jira === 'ok' ? 'Conectado a sonda.atlassian.net' : connectionStatus.jira === 'error' ? 'Error de autenticación' : 'Comprobando...'}</span>
              </span>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
              Responsable: <strong className="text-gray-800 dark:text-gray-200">{currentUser?.displayName || activeProfile?.jiraEmail || 'Julio Varas Contreras'}</strong>
              {currentUser?.emailAddress && ` (${currentUser.emailAddress})`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {connectionStatus.jira === 'error' && (
            <button
              type="button"
              onClick={syncCredentialsFromEnv}
              className="glass-button text-xs font-semibold px-3 py-1.5 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 cursor-pointer"
            >
              🔄 Sincronizar de .env
            </button>
          )}

          <button
            type="button"
            onClick={refreshJiraData}
            disabled={isLoadingIssues}
            title="Refrescar tarjetas y estados directamente desde Jira Cloud"
            className="glass-button text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs border border-black/10 dark:border-white/10"
          >
            <span className={isLoadingIssues ? 'animate-spin' : ''}>🔄</span>
            <span>{isLoadingIssues ? 'Sincronizando...' : 'Refrescar Jira'}</span>
          </button>
        </div>
      </div>

      {/* KPI Counters (Cajas de Estado) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Por Hacer */}
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Por Hacer (Backlog)
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono mt-0.5 block">
              {isLoadingIssues ? '...' : todoIssues.length}
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            📋
          </span>
        </div>

        {/* En Curso */}
        <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/30 dark:border-blue-500/40 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              En Curso (Activas)
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
              {isLoadingIssues ? '...' : inProgressIssues.length}
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm animate-pulse">
            ⚡
          </span>
        </div>

        {/* Hecho */}
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Hecho (Finalizadas)
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {isLoadingIssues ? '...' : doneIssues.length}
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            ✓
          </span>
        </div>
      </div>

      {/* Ticket List or Shimmer Loading */}
      {isLoadingIssues ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-2 text-gray-500">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Cargando incidencias en vivo desde Jira ({activeProfile?.jiraProjectKey})...</p>
        </div>
      ) : jiraIssues.length === 0 ? (
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            No se encontraron incidencias en el proyecto {activeProfile?.jiraProjectKey}.
          </p>
          <p className="text-[11px] text-gray-500">
            Verifica el Token Atlassian o genera la estructura CMMI inicial en la pestaña Tablero.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Incidencias del Sprint / Tablero ({Math.min(4, jiraIssues.length)} de {jiraIssues.length}):
            </span>
            <button
              type="button"
              onClick={() => setCurrentView('jira')}
              className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
            >
              Ver todas en el Tablero Kanban →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {jiraIssues.slice(0, 4).map((issue) => {
              const isDone = issue.fields?.status?.statusCategory?.key === 'done';
              const isInProg = issue.fields?.status?.statusCategory?.key === 'indeterminate';

              return (
                <div
                  key={issue.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    isInProg
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/30 dark:border-blue-500/40 shadow-xs'
                      : isDone
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/20 dark:border-emerald-500/30'
                      : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        {issue.key}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : isInProg
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                      }`}>
                        {issue.fields?.status?.name || 'Por Hacer'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1" title={issue.fields?.summary}>
                      {issue.fields?.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-black/5 dark:border-white/5 text-[11px]">
                    <span className="text-gray-500 truncate max-w-[140px]">
                      {issue.fields?.assignee?.displayName || 'Sin asignar'}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => transitionIssueDirectly(issue.key, 'hecho')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                          title="Transicionar directamente a 'Hecho' en Jira"
                        >
                          ✓ Hecho
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIssueForWorklog(issue);
                          setCurrentView('worklogs');
                        }}
                        className="px-2 py-1 glass-button text-gray-700 dark:text-gray-300 hover:text-brand-600 text-[10px] font-semibold rounded-lg cursor-pointer"
                        title="Imputar horas en bitácora para esta tarea"
                      >
                        ⏱️ Horas
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
