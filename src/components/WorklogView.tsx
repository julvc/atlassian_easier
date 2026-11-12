import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityCategory } from '../types';
import { ChronoWorklogIcon } from './icons/NavigationIcons';

interface ActivityTemplate {
  key: ActivityCategory;
  label: string;
  icon: string;
  defaultComment: string;
}

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    key: 'analysis',
    label: 'Análisis y Requerimientos',
    icon: '🔍',
    defaultComment: 'Levantamiento de especificaciones técnicas, revisión de criterios de aceptación y dependencias de negocio.'
  },
  {
    key: 'architecture',
    label: 'Diseño y Arquitectura',
    icon: '🏗️',
    defaultComment: 'Evaluación de arquitectura técnica, análisis de viabilidad, revisión de contratos y registro de decisiones de diseño.'
  },
  {
    key: 'development',
    label: 'Desarrollo e Implementación',
    icon: '💻',
    defaultComment: 'Implementación de funcionalidades, refactorización de código, lógica de negocio y control de versiones.'
  },
  {
    key: 'code_review',
    label: 'Revisión de Código & Pair Programming',
    icon: '👀',
    defaultComment: 'Revisión de pull requests, verificación de estándares CMMI v3.0, clean code y buenas prácticas.'
  },
  {
    key: 'testing',
    label: 'Pruebas, QA y Validación',
    icon: '🧪',
    defaultComment: 'Ejecución de pruebas unitarias, integración, smoke test y validación de escenarios de usuario.'
  },
  {
    key: 'documentation',
    label: 'Documentación y CMMI v3.0',
    icon: '📄',
    defaultComment: 'Elaboración de manuales técnicos, actualización de wiki Confluence y evidencias de trazabilidad.'
  },
  {
    key: 'release',
    label: 'Despliegue y Release',
    icon: '🚀',
    defaultComment: 'Empaquetado versionado, control de ramas en Bitbucket, verificación de tag y entrega a testing/producción.'
  }
];

export const WorklogView: React.FC = () => {
  const {
    activeProfile,
    jiraIssues,
    worklogs,
    selectedIssueForWorklog,
    setSelectedIssueForWorklog,
    addWorklogRecord,
    deleteWorklogRecord
  } = useApp();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedIssueKey, setSelectedIssueKey] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<string>('4h');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('development');
  const [comment, setComment] = useState<string>('');
  const [transitionToInProgress, setTransitionToInProgress] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedIssueForWorklog) {
      setSelectedIssueKey(selectedIssueForWorklog.key);
      const tmpl = ACTIVITY_TEMPLATES.find(t => t.key === selectedCategory);
      if (tmpl && (!comment || comment.trim() === '')) {
        setComment(`${selectedIssueForWorklog.fields.summary} - ${tmpl.defaultComment}`);
      }
    } else if (!selectedIssueKey && jiraIssues.length > 0) {
      setSelectedIssueKey(jiraIssues[0].key);
    }
  }, [selectedIssueForWorklog, jiraIssues]);

  const handleCategoryChange = (cat: ActivityCategory) => {
    setSelectedCategory(cat);
    const tmpl = ACTIVITY_TEMPLATES.find(t => t.key === cat);
    if (tmpl) {
      const issue = jiraIssues.find(i => i.key === selectedIssueKey);
      const prefix = issue ? `${issue.fields.summary} - ` : '';
      setComment(prefix + tmpl.defaultComment);
    }
  };

  const handleIssueSelect = (key: string) => {
    setSelectedIssueKey(key);
    const issue = jiraIssues.find(i => i.key === key);
    if (issue) {
      const tmpl = ACTIVITY_TEMPLATES.find(t => t.key === selectedCategory);
      setComment(`${issue.fields.summary} - ${tmpl?.defaultComment || ''}`);
    }
  };

  const parseHoursToDecimal = (str: string): number => {
    const s = str.toLowerCase().trim();
    let total = 0;
    const hMatch = s.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hMatch) total += parseFloat(hMatch[1]);
    const mMatch = s.match(/(\d+(?:\.\d+)?)\s*m/);
    if (mMatch) total += parseFloat(mMatch[1]) / 60;
    if (!hMatch && !mMatch) {
      const num = parseFloat(s);
      if (!isNaN(num)) total = num;
    }
    return Math.round(total * 100) / 100;
  };

  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const isToday = isoDate === getTodayStr();

      const hoursInDay = worklogs
        .filter(w => (!activeProfile || w.profileId === activeProfile.id) && w.date === isoDate)
        .reduce((sum, w) => sum + (w.hoursDecimal || 0), 0);

      days.push({
        dateStr: isoDate,
        name: dayNames[i],
        shortDate: `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' })}`,
        hours: Math.round(hoursInDay * 10) / 10,
        isToday,
        isComplete: hoursInDay >= 8,
        isPartial: hoursInDay > 0 && hoursInDay < 8,
        isEmpty: hoursInDay === 0
      });
    }
    return days;
  }, [worklogs, activeProfile?.id]);

  const totalWeekHours = useMemo(() => {
    return currentWeekDays.reduce((sum, d) => sum + d.hours, 0);
  }, [currentWeekDays]);

  const currentSelectedIssue = useMemo(() => {
    return jiraIssues.find(i => i.key === selectedIssueKey);
  }, [jiraIssues, selectedIssueKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueKey || !timeSpent) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    const hoursDec = parseHoursToDecimal(timeSpent);
    const tmpl = ACTIVITY_TEMPLATES.find(t => t.key === selectedCategory);
    const catLabel = tmpl ? tmpl.label : 'Actividad';

    const res = await addWorklogRecord(
      {
        issueKey: selectedIssueKey,
        issueSummary: currentSelectedIssue?.fields.summary || 'Actividad operativa',
        timeSpent,
        hoursDecimal: hoursDec,
        date: selectedDate,
        category: selectedCategory,
        categoryLabel: catLabel,
        comment: comment.trim()
      },
      {
        transitionToInProgress
      }
    );

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(`✓ Registradas ${timeSpent} en ${selectedIssueKey} para el día ${selectedDate}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setSelectedIssueForWorklog(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <ChronoWorklogIcon size={24} />
            <span>Bitácora & Imputación de Horas</span>
            <span className="text-[10px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              CMMI v3.0
            </span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Registro de actividades operativas, investigación, análisis, QA y CMMI en Jira sin necesidad de commits de código.
          </p>
        </div>

        {/* Indicador Global de Progreso Semanal */}
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center space-x-4 border border-black/5 dark:border-white/10 shadow-xs">
          <div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Semana</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              <span className={totalWeekHours >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}>
                {totalWeekHours}h
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs"> / 40h</span>
            </div>
          </div>
          <div className="w-24 bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden border border-black/5 dark:border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${totalWeekHours >= 40 ? 'bg-emerald-500' : 'bg-brand-600'}`}
              style={{ width: `${Math.min(100, (totalWeekHours / 40) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cuadrícula de Días de la Semana Actual (Lunes a Viernes) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {currentWeekDays.map((day) => (
          <div
            key={day.dateStr}
            onClick={() => setSelectedDate(day.dateStr)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
              selectedDate === day.dateStr
                ? 'glass-card border-brand-500/60 dark:border-brand-500/70 shadow-md ring-2 ring-brand-500/20'
                : 'glass-card border-black/5 dark:border-white/10 hover:border-brand-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{day.name}</span>
              {day.isToday && (
                <span className="text-[9px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold px-1.5 py-0.5 rounded">
                  Hoy
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{day.shortDate}</div>
            <div className="mt-2.5 flex items-baseline space-x-1">
              <span className={`text-base font-black ${
                day.isComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : day.isPartial
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {day.hours}h
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">/ 8h</span>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de Imputación Rápida */}
      <form onSubmit={handleSubmit} className="glass-card p-5 rounded-2xl border border-black/5 dark:border-white/10 space-y-4 shadow-xs">
        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2">
          <span>Registrar Bitácora en Jira Cloud ({activeProfile?.jiraProjectKey || 'Proyecto'})</span>
          {successMessage && (
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-pulse">
              {successMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Incidencia / Tarjeta Jira:
            </label>
            <select
              value={selectedIssueKey}
              onChange={(e) => handleIssueSelect(e.target.value)}
              className="glass-input w-full text-xs rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100"
              required
            >
              {jiraIssues.length === 0 ? (
                <option value="">Cargando tarjetas o sin incidencias...</option>
              ) : (
                jiraIssues.map(i => (
                  <option key={i.key} value={i.key} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {i.key} - {i.fields.summary.substring(0, 50)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tiempo Dedicado:
            </label>
            <input
              type="text"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="ej: 4h, 2h 30m, 8h"
              className="glass-input w-full text-xs rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Fecha de la Actividad:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass-input w-full text-xs rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 font-mono"
              required
            />
          </div>
        </div>

        {/* Categorías CMMI */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Categoría de Actividad CMMI v3.0:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {ACTIVITY_TEMPLATES.map((tmpl) => (
              <button
                type="button"
                key={tmpl.key}
                onClick={() => handleCategoryChange(tmpl.key)}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedCategory === tmpl.key
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500/50 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                    : 'glass-card border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-brand-500/30'
                }`}
              >
                <span className="text-base mb-1">{tmpl.icon}</span>
                <span className="text-[10px] leading-tight line-clamp-2">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descripción / Comentario */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Evidencia / Comentario de Trabajo:
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="glass-input w-full text-xs rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 leading-relaxed resize-none"
            placeholder="Describe brevemente la actividad técnica o de gestión realizada..."
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={transitionToInProgress}
              onChange={(e) => setTransitionToInProgress(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-0 cursor-pointer"
            />
            <span>Mover automáticamente a "En Progreso" si estaba en pendiente</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !selectedIssueKey}
            className="glass-button-primary px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md hover:shadow-brand-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? '⏳' : '✓'}</span>
            <span>{isSubmitting ? 'Asentando en Jira...' : 'Asentar Bitácora en Jira'}</span>
          </button>
        </div>
      </form>

      {/* Historial Local de Bitácoras Registradas */}
      {worklogs.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
            Historial de Horas Asentadas ({worklogs.length} registros)
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {worklogs.map(w => (
              <div
                key={w.id}
                className="glass-card p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 shrink-0">{w.issueKey}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{w.issueSummary}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">({w.categoryLabel})</span>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    {w.timeSpent}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{w.date}</span>
                  <button
                    type="button"
                    onClick={() => deleteWorklogRecord(w.id)}
                    className="text-gray-400 hover:text-rose-600 text-xs px-1"
                    title="Eliminar registro local"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};