import React, { useState } from 'react';
import { JiraIssue } from '../types';

interface ModalValidarCierreProps {
  issue: JiraIssue;
  onClose: () => void;
  onConfirm: (timeSpent: string, comment: string) => Promise<void>;
}

export const ModalValidarCierre: React.FC<ModalValidarCierreProps> = ({ issue, onClose, onConfirm }) => {
  const [timeSpent, setTimeSpent] = useState('8h');
  const [evidence, setEvidence] = useState('Entregable completado, verificado funcionalmente y con pruebas satisfactorias conforme a CMMI v3.0.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(timeSpent, evidence);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f1117] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50/80 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Validación y Cierre de Tarea CMMI</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Confirmación explícita para transicionar a "Hecho" en Jira Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Issue Summary Card */}
          <div className="p-3.5 bg-gray-50 dark:bg-black/30 rounded-xl border border-black/10 dark:border-white/10 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800/50 font-mono">
                {issue.key}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {issue.fields.summary}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              Estado actual: <span className="text-gray-700 dark:text-gray-300 font-medium">{issue.fields.status.name}</span> · Tipo: <span className="text-gray-700 dark:text-gray-300">{issue.fields.issuetype.name}</span>
            </div>
          </div>

          {/* Time spent */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Horas de Trabajo a Registrar en Jira (Worklog) *:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="ej: 8h, 4h 30m"
                className="w-full glass-input"
              />
              <div className="flex space-x-1 shrink-0">
                {['4h', '8h', '12h', '16h'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTimeSpent(preset)}
                    className="text-[10px] glass-button px-2.5 py-2 rounded-xl"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence comment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Comentario de Evidencia de Cierre CMMI *:
            </label>
            <textarea
              required
              rows={3}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full glass-input"
              placeholder="Detalla las actividades realizadas y pruebas de verificación..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 glass-button text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
            >
              <span>{isSubmitting ? '⏳' : '✓'}</span>
              <span>{isSubmitting ? 'Cerrando...' : 'Confirmar Cierre y Registrar Horas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
