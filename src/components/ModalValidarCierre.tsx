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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🛡️</span>
            <div>
              <h3 className="text-sm font-bold text-white">Validación y Cierre de Tarea CMMI</h3>
              <p className="text-[11px] text-slate-400">Confirmación explícita para transicionar a "Hecho" en Jira Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Issue Summary Card */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/50">
                {issue.key}
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {issue.fields.summary}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Estado actual: <span className="text-slate-300 font-medium">{issue.fields.status.name}</span> · Tipo: <span className="text-slate-300">{issue.fields.issuetype.name}</span>
            </div>
          </div>

          {/* Time spent */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Horas de Trabajo a Registrar en Jira (Worklog) *:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="ej: 8h, 4h 30m"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <div className="flex space-x-1 shrink-0">
                {['4h', '8h', '12h', '16h'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTimeSpent(preset)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-lg border border-slate-700"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Comentario de Evidencia de Cierre CMMI *:
            </label>
            <textarea
              required
              rows={3}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="Describe el entregable, PR o verificación que valida el cierre..."
            />
          </div>

          {/* Warning notice */}
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-300/90 flex items-start space-x-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>
              Al confirmar, el estado de la incidencia pasará a <strong>Hecho / Done</strong>, se registrará el tiempo en la bitácora de Jira y el comentario quedará grabado de forma trazable.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Validando y cerrando...</span>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirmar Validación y Cerrar en Jira</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
