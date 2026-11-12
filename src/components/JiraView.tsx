import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JiraIssue } from '../types';
import { ModalValidarCierre } from './ModalValidarCierre';
import { KanbanJiraIcon } from './icons/NavigationIcons';

export const JiraView: React.FC = () => {
  const {
    activeProfile,
    currentUser,
    jiraIssues,
    isLoadingIssues,
    refreshJiraData,
    assignIssueToMe,
    closeIssueWithValidation,
    transitionIssueDirectly,
    executeRealRun,
    generateInitialCmmi,
    addLog
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'inprogress' | 'done'>('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [closingIssue, setClosingIssue] = useState<JiraIssue | null>(null);
  const [quickWorklogIssue, setQuickWorklogIssue] = useState<JiraIssue | null>(null);
  const [worklogHours, setWorklogHours] = useState('4h');

  if (!activeProfile?.enableJira) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <KanbanJiraIcon size={48} className="mb-3 opacity-60" />
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Módulo de Jira Desactivado</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
          Este perfil tiene la conexión a Jira Cloud desactivada. Puedes activarla en la pestaña <strong>Perfiles de Proyecto</strong>.
        </p>
      </div>
    );
  }

  // Filtrado de incidencias
  const filteredIssues = jiraIssues.filter(issue => {
    const summary = issue.fields.summary.toLowerCase();
    const key = issue.key.toLowerCase();
    const sTerm = search.toLowerCase();
    const matchesSearch = !search || summary.includes(sTerm) || key.includes(sTerm);

    const statusCategory = issue.fields.status?.statusCategory?.key || '';
    const statusName = issue.fields.status?.name?.toLowerCase() || '';

    let matchesStatus = true;
    if (statusFilter === 'done') {
      matchesStatus = statusCategory === 'done' || statusName.includes('hecho') || statusName.includes('done') || statusName.includes('cerr');
    } else if (statusFilter === 'inprogress') {
      matchesStatus = statusCategory === 'indeterminate' || statusName.includes('curso') || statusName.includes('progreso');
    } else if (statusFilter === 'todo') {
      matchesStatus = statusCategory === 'new' || statusName.includes('hacer') || statusName.includes('todo') || statusName.includes('backlog');
    }

    let matchesAssignee = true;
    if (onlyMine && currentUser) {
      matchesAssignee = issue.fields.assignee?.accountId === currentUser.accountId;
    }

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const totalDone = jiraIssues.filter(i => {
    const name = i.fields.status?.name?.toLowerCase() || '';
    return name.includes('hecho') || name.includes('done') || name.includes('cerr') || i.fields.status?.statusCategory?.key === 'done';
  }).length;

  const totalMine = jiraIssues.filter(i => i.fields.assignee?.accountId === currentUser?.accountId).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none">
      {/* Top Banner Stats */}
      <div className="glass-panel border-b border-black/5 dark:border-white/10 p-6 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <KanbanJiraIcon size={24} />
                <span>Tablero Jira: {activeProfile.jiraProjectKey || 'Sin Proyecto'}</span>
              </h2>
              {activeProfile.jiraBoardId && (
                <span className="text-[11px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800 font-mono font-medium">
                  Tablero #{activeProfile.jiraBoardId}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Conexión directa vía Token API · Validado como: <span className="text-brand-600 dark:text-brand-400 font-semibold">{currentUser?.displayName || 'Autenticando...'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => refreshJiraData()}
              disabled={isLoadingIssues}
              className="glass-button px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <span className={isLoadingIssues ? 'animate-spin' : ''}>🔃</span>
              <span>{isLoadingIssues ? 'Sincronizando...' : 'Refrescar'}</span>
            </button>

            <button
              onClick={() => executeRealRun()}
              disabled={isLoadingIssues}
              title="Ejecutar sincronización real para mover las cajas CMMI a 'Hecho' vía atlassian_sync.cjs"
              className="glass-button-primary px-3.5 py-2 text-xs font-bold text-white rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <span>🚀</span>
              <span>Mover Cajas (Ejecución Real)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-black/10 dark:border-white/10 shadow-xs">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Tarjetas</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{jiraIssues.length}</div>
          </div>
          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-black/10 dark:border-white/10 shadow-xs">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Asignadas a Mí</div>
            <div className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">{totalMine}</div>
          </div>
          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-black/10 dark:border-white/10 shadow-xs">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Tareas Finalizadas</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalDone}</div>
          </div>
          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-black/10 dark:border-white/10 shadow-xs">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Avance General</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {jiraIssues.length > 0 ? Math.round((totalDone / jiraIssues.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* CASE 1: PROYECTO NUEVO DESDE CERO (0 TARJETAS) */}
        {!isLoadingIssues && jiraIssues.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-8 shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              <KanbanJiraIcon size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Proyecto Nuevo: Sin tarjetas en Jira</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                Este proyecto en Jira (<strong>{activeProfile.jiraProjectKey}</strong>) está completamente vacío.
                Puedes inicializar la estructura oficial de trabajo bajo el estándar <strong>CMMI v3.0</strong> con 1 solo clic.
                Se crearán las Épicas e Historias con sus estimaciones base y quedarán asignadas automáticamente a tu usuario.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => generateInitialCmmi()}
                className="glass-button-primary px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-2 mx-auto"
              >
                <span>✨</span>
                <span>Generar Estructura Inicial CMMI v3.0 en Jira</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: PROYECTO EXISTENTE (>0 TARJETAS) */}
        {jiraIssues.length > 0 && (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3 rounded-2xl shadow-xs">
              <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
                <span className="text-gray-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por clave o resumen de tarjeta..."
                  className="w-full glass-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-0.5 border border-black/10 dark:border-white/10 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === 'all' ? 'bg-brand-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Todas ({jiraIssues.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('todo')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === 'todo' ? 'bg-brand-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Por Hacer
                  </button>
                  <button
                    onClick={() => setStatusFilter('inprogress')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === 'inprogress' ? 'bg-brand-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    En Curso
                  </button>
                  <button
                    onClick={() => setStatusFilter('done')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${statusFilter === 'done' ? 'bg-brand-600 text-white shadow-xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Hecho ({totalDone})
                  </button>
                </div>

                <label className="flex items-center space-x-2 glass-button px-3 py-1.5 rounded-xl text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={(e) => setOnlyMine(e.target.checked)}
                    className="rounded border-gray-400 text-brand-600 focus:ring-0"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Solo mías</span>
                </label>
              </div>
            </div>

            {/* Issues List Table */}
            <div className="glass-panel border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-semibold border-b border-black/10 dark:border-white/10">
                    <th className="py-3 px-4 w-28">Clave</th>
                    <th className="py-3 px-4">Resumen de la Tarjeta</th>
                    <th className="py-3 px-4 w-32">Estado</th>
                    <th className="py-3 px-4 w-44">Responsable</th>
                    <th className="py-3 px-4 w-28 text-center">Tiempos</th>
                    <th className="py-3 px-4 w-44 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredIssues.map((issue) => {
                    const isAssignedToMe = currentUser && issue.fields.assignee?.accountId === currentUser.accountId;
                    const isDone = issue.fields.status?.statusCategory?.key === 'done' || 
                                   issue.fields.status?.name?.toLowerCase().includes('hecho') ||
                                   issue.fields.status?.name?.toLowerCase().includes('done') ||
                                   issue.fields.status?.name?.toLowerCase().includes('cerr');

                    return (
                      <tr key={issue.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400 font-mono">
                          {issue.key}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          <div className="font-semibold line-clamp-1">{issue.fields.summary}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Tipo: {issue.fields.issuetype?.name || 'Historia'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isDone 
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                              : issue.fields.status?.name?.toLowerCase().includes('curso')
                              ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10'
                          }`}>
                            {issue.fields.status?.name || 'Por Hacer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {issue.fields.assignee ? (
                            <div className="flex items-center space-x-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isAssignedToMe ? 'bg-brand-600' : 'bg-gray-600'}`}>
                                {issue.fields.assignee.displayName?.[0] || 'U'}
                              </div>
                              <span className={`text-[11px] truncate max-w-[120px] ${isAssignedToMe ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                {isAssignedToMe ? 'Tú (Asignado)' : issue.fields.assignee.displayName}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => assignIssueToMe(issue.key)}
                              className="text-[10px] glass-button text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-md font-semibold"
                            >
                              + Asignar a Mí
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-[11px] text-gray-700 dark:text-gray-300 font-mono">
                            {issue.fields.timespent ? `${Math.round(issue.fields.timespent / 3600)}h` : '0h'} 
                            {issue.fields.timeoriginalestimate ? ` / ${Math.round(issue.fields.timeoriginalestimate / 3600)}h` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Mover rápidamente a En Curso si está Por Hacer */}
                            {!isDone && !issue.fields.status?.name?.toLowerCase().includes('curso') && !issue.fields.status?.name?.toLowerCase().includes('progreso') && (
                              <button
                                onClick={() => transitionIssueDirectly(issue.key, 'curso')}
                                title="Mover caja a 'En Curso'"
                                className="glass-button text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 px-2 py-1 text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                              >
                                ▶ Iniciar
                              </button>
                            )}

                            {/* Worklog quick button */}
                            <button
                              onClick={() => setQuickWorklogIssue(issue)}
                              title="Registrar horas de trabajo"
                              className="glass-button px-2.5 py-1 text-[11px] font-medium rounded-lg"
                            >
                              ⏱️ Log
                            </button>

                            {/* Close Task Validated Button */}
                            {!isDone ? (
                              <button
                                onClick={() => setClosingIssue(issue)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                              >
                                ✓ Cerrar
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1">
                                ✓ Cerrada
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredIssues.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  No se encontraron tarjetas que coincidan con los filtros aplicados.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Validación de Cierre */}
      {closingIssue && (
        <ModalValidarCierre
          issue={closingIssue}
          onClose={() => setClosingIssue(null)}
          onConfirm={async (timeSpent, comment) => {
            await closeIssueWithValidation(closingIssue.key, timeSpent, comment);
          }}
        />
      )}

      {/* Modal Rápido de Worklog */}
      {quickWorklogIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f1117] border border-black/10 dark:border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Registrar Horas en {quickWorklogIssue.key}
            </h4>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Horas dedicadas:</label>
              <input
                type="text"
                value={worklogHours}
                onChange={(e) => setWorklogHours(e.target.value)}
                placeholder="ej: 4h, 2h 30m"
                className="w-full glass-input"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setQuickWorklogIssue(null)}
                className="glass-button px-3 py-1.5 text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await atlassianService.addWorklog(activeProfile, quickWorklogIssue.key, worklogHours, 'Registro manual de tiempo');
                  addLog(`✓ Registradas ${worklogHours} en ${quickWorklogIssue.key}.`, 'success');
                  setQuickWorklogIssue(null);
                  refreshJiraData();
                }}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
