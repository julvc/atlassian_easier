import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JiraIssue } from '../types';
import { ModalValidarCierre } from './ModalValidarCierre';

export const JiraView: React.FC = () => {
  const {
    activeProfile,
    currentUser,
    jiraIssues,
    isLoadingIssues,
    refreshJiraData,
    assignIssueToMe,
    closeIssueWithValidation,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-3">📋</span>
        <h3 className="text-base font-bold text-white mb-1">Módulo de Jira Desactivado</h3>
        <p className="text-xs text-slate-400 max-w-md">
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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Banner Stats */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-white">
                Tablero Jira: {activeProfile.jiraProjectKey || 'Sin Proyecto'}
              </h2>
              {activeProfile.jiraBoardId && (
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Tablero #{activeProfile.jiraBoardId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Conexión directa vía Token API · Validado como: <span className="text-sky-400 font-semibold">{currentUser?.displayName || 'Autenticando...'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshJiraData()}
              disabled={isLoadingIssues}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5"
            >
              <span>{isLoadingIssues ? '🔄' : '🔃'}</span>
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Total Tarjetas</div>
            <div className="text-lg font-bold text-white mt-0.5">{jiraIssues.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Asignadas a Mí</div>
            <div className="text-lg font-bold text-sky-400 mt-0.5">{totalMine}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Tareas Finalizadas</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalDone}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Avance General</div>
            <div className="text-lg font-bold text-indigo-400 mt-0.5">
              {jiraIssues.length > 0 ? Math.round((totalDone / jiraIssues.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* CASE 1: PROYECTO NUEVO DESDE CERO (0 TARJETAS) */}
        {!isLoadingIssues && jiraIssues.length === 0 && (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-8 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-950/80 border border-sky-800/60 text-sky-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🚀
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Proyecto Nuevo: Sin tarjetas en Jira</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Este proyecto en Jira (<strong>{activeProfile.jiraProjectKey}</strong>) está completamente vacío.
                Puedes inicializar la estructura oficial de trabajo bajo el estándar <strong>CMMI v3.0</strong> con 1 solo clic.
                Se crearán las Épicas e Historias con sus estimaciones base y quedarán asignadas automáticamente a tu usuario.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => generateInitialCmmi()}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-sky-600/30 transition-all flex items-center space-x-2 mx-auto"
              >
                <span>✨</span>
                <span>Generar Estructura Inicial CMMI v3.0 en Jira</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: PROYECTO EXISTENTE (>0 TARJETAS) - FLUJO PASO 2 */}
        {jiraIssues.length > 0 && (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
                <span className="text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por clave o resumen de tarjeta..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium ${statusFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Todas ({jiraIssues.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('todo')}
                    className={`px-2.5 py-1 rounded-md font-medium ${statusFilter === 'todo' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Por Hacer
                  </button>
                  <button
                    onClick={() => setStatusFilter('inprogress')}
                    className={`px-2.5 py-1 rounded-md font-medium ${statusFilter === 'inprogress' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    En Curso
                  </button>
                  <button
                    onClick={() => setStatusFilter('done')}
                    className={`px-2.5 py-1 rounded-md font-medium ${statusFilter === 'done' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Hecho ({totalDone})
                  </button>
                </div>

                <label className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={(e) => setOnlyMine(e.target.checked)}
                    className="rounded border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span className="text-slate-300">Solo mías</span>
                </label>
              </div>
            </div>

            {/* Issues List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
                    <th className="py-3 px-4 w-28">Clave</th>
                    <th className="py-3 px-4">Resumen de la Tarjeta</th>
                    <th className="py-3 px-4 w-32">Estado</th>
                    <th className="py-3 px-4 w-44">Responsable</th>
                    <th className="py-3 px-4 w-28 text-center">Tiempos</th>
                    <th className="py-3 px-4 w-44 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredIssues.map((issue) => {
                    const isAssignedToMe = currentUser && issue.fields.assignee?.accountId === currentUser.accountId;
                    const isDone = issue.fields.status?.statusCategory?.key === 'done' || 
                                   issue.fields.status?.name?.toLowerCase().includes('hecho') ||
                                   issue.fields.status?.name?.toLowerCase().includes('done') ||
                                   issue.fields.status?.name?.toLowerCase().includes('cerr');

                    return (
                      <tr key={issue.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-sky-400 font-mono">
                          {issue.key}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <div className="font-medium line-clamp-1">{issue.fields.summary}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Tipo: {issue.fields.issuetype?.name || 'Historia'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isDone 
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' 
                              : issue.fields.status?.name?.toLowerCase().includes('curso')
                              ? 'bg-sky-950/80 text-sky-300 border-sky-700/50'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {issue.fields.status?.name || 'Por Hacer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {issue.fields.assignee ? (
                            <div className="flex items-center space-x-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isAssignedToMe ? 'bg-sky-600' : 'bg-slate-700'}`}>
                                {issue.fields.assignee.displayName?.[0] || 'U'}
                              </div>
                              <span className={`text-[11px] truncate max-w-[120px] ${isAssignedToMe ? 'text-sky-300 font-semibold' : 'text-slate-400'}`}>
                                {isAssignedToMe ? 'Tú (Asignado)' : issue.fields.assignee.displayName}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => assignIssueToMe(issue.key)}
                              className="text-[10px] bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded-md font-semibold transition-colors"
                            >
                              + Asignar a Mí
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-[11px] text-slate-300 font-mono">
                            {issue.fields.timespent ? `${Math.round(issue.fields.timespent / 3600)}h` : '0h'} 
                            {issue.fields.timeoriginalestimate ? ` / ${Math.round(issue.fields.timeoriginalestimate / 3600)}h` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Worklog quick button */}
                            <button
                              onClick={() => setQuickWorklogIssue(issue)}
                              title="Registrar horas de trabajo"
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700"
                            >
                              ⏱️ Log
                            </button>

                            {/* Close Task Validated Button */}
                            {!isDone ? (
                              <button
                                onClick={() => setClosingIssue(issue)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
                              >
                                ✓ Cerrar
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1">
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
                <div className="p-8 text-center text-xs text-slate-400">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">
              Registrar Horas en {quickWorklogIssue.key}
            </h4>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Horas dedicadas:</label>
              <input
                type="text"
                value={worklogHours}
                onChange={(e) => setWorklogHours(e.target.value)}
                placeholder="ej: 4h, 2h 30m"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setQuickWorklogIssue(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700"
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
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow"
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
