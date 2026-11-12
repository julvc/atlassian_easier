import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectProfile } from '../types';
import { GearProfilesIcon } from './icons/NavigationIcons';

export const ProfilesView: React.FC = () => {
  const { profiles, activeProfile, saveProfile, createNewProfile, deleteProfile, selectProfile } = useApp();
  const [formData, setFormData] = useState<ProjectProfile | null>(activeProfile);
  const [showToken, setShowToken] = useState(false);
  const [showBBPassword, setShowBBPassword] = useState(false);

  React.useEffect(() => {
    setFormData(activeProfile);
  }, [activeProfile]);

  if (!formData) return null;

  const handleSelectDir = async () => {
    const dir = await window.electronAPI.selectDirectory(formData?.projectPath);
    if (dir) {
      setFormData(prev => prev ? { ...prev, projectPath: dir } : null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await saveProfile(formData);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GearProfilesIcon size={26} />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Configuración de Perfiles de Proyecto</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Define credenciales, rutas locales y servicios habilitados por proyecto.
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              const newP = createNewProfile();
              setFormData(newP);
            }}
            className="glass-button-primary px-3.5 py-2 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <span>➕</span>
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      {/* Profiles tabs selector */}
      <div className="flex space-x-2 overflow-x-auto pb-1 border-b border-black/10 dark:border-white/10">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => {
              selectProfile(p.id);
              setFormData(p);
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-colors border-t border-x ${
              activeProfile?.id === p.id
                ? 'bg-white/80 dark:bg-white/10 text-brand-700 dark:text-brand-300 border-black/10 dark:border-white/15 -mb-px shadow-xs'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6 glass-panel p-6 rounded-2xl shadow-xs">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Perfil *:</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full glass-input"
              placeholder="ej: Cotizador Claude Corporativo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Carpeta Local del Código (Working Dir):</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.projectPath}
                onChange={(e) => setFormData({ ...formData, projectPath: e.target.value })}
                className="w-full glass-input font-mono text-xs"
                placeholder="C:\Users\...\mi-proyecto (opcional si aún no está clonado)"
              />
              <button
                type="button"
                onClick={handleSelectDir}
                className="glass-button px-3.5 py-2 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
              >
                📂 Examinar...
              </button>
            </div>
          </div>
        </div>

        {/* Metodología & Gobernanza Git */}
        <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center space-x-2">
            <span>🌿 Metodología y Configuración Git</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Modelo de Gobernanza:
              </label>
              <select
                value={formData.governanceType || 'cmmi_hybrid'}
                onChange={(e) => setFormData({ ...formData, governanceType: e.target.value as any })}
                className="w-full glass-input text-xs font-semibold"
              >
                <option value="cmmi_hybrid">CMMI Híbrido (Equipos concurrentes, historial dinámico)</option>
                <option value="cmmi_strict">CMMI v3.0 Estricto (Auditoría formal, prefijos obligatorios)</option>
                <option value="agile_standard">Ágil Estándar (Sin gobernanza pesada)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                {formData.governanceType === 'cmmi_strict'
                  ? 'Exige estructura de commits formal y scripts CMMI previos.'
                  : formData.governanceType === 'agile_standard'
                  ? 'Commits directos sin prefijos CMMI y push ágil a la rama seleccionada.'
                  : 'Ideal para proyectos como gespad-sii: sincroniza con Jira/Bitbucket sin trabar al equipo.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Rama Objetivo de Integración (Target Branch):
              </label>
              <input
                type="text"
                value={formData.targetBranch || 'develop'}
                onChange={(e) => setFormData({ ...formData, targetBranch: e.target.value })}
                className="w-full glass-input font-mono text-xs font-bold text-brand-600 dark:text-brand-400"
                placeholder="develop o main"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Rama principal donde trabajan los desarrolladores (ej: <span className="font-mono">develop</span> en gespad-sii o <span className="font-mono">main</span>).
              </p>
            </div>
          </div>
        </div>

        {/* Modules Toggles */}
        <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            Servicios a Conectar (Modular y No Forzado)
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.enableJira}
                onChange={(e) => setFormData({ ...formData, enableJira: e.target.checked })}
                className="rounded border-gray-400 text-brand-600 focus:ring-0"
              />
              <span>Conectar Jira Cloud</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.enableBitbucket}
                onChange={(e) => setFormData({ ...formData, enableBitbucket: e.target.checked })}
                className="rounded border-gray-400 text-brand-600 focus:ring-0"
              />
              <span>Conectar Bitbucket Cloud</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.enableConfluence}
                onChange={(e) => setFormData({ ...formData, enableConfluence: e.target.checked })}
                className="rounded border-gray-400 text-brand-600 focus:ring-0"
              />
              <span>Conectar Confluence Cloud</span>
            </label>
          </div>
        </div>

        {/* Jira Settings */}
        {formData.enableJira && (
          <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center space-x-2">
              <span>📋 Parámetros de Jira Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Email Atlassian *:</label>
                <input
                  type="email"
                  required
                  value={formData.jiraEmail}
                  onChange={(e) => setFormData({ ...formData, jiraEmail: e.target.value })}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">API Token *:</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    value={formData.jiraToken}
                    onChange={(e) => setFormData({ ...formData, jiraToken: e.target.value })}
                    className="w-full glass-input pr-9"
                    placeholder="ATATT3xFfGF0..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs"
                  >
                    {showToken ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Host Jira:</label>
                <input
                  type="text"
                  value={formData.jiraHost}
                  onChange={(e) => setFormData({ ...formData, jiraHost: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Project Key (Clave Proyecto):</label>
                <input
                  type="text"
                  value={formData.jiraProjectKey}
                  onChange={(e) => setFormData({ ...formData, jiraProjectKey: e.target.value.toUpperCase() })}
                  className="w-full glass-input font-mono uppercase font-bold text-brand-600 dark:text-brand-400"
                  placeholder="ej: CCYACE"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Board ID (ID Tablero):</label>
                <input
                  type="text"
                  value={formData.jiraBoardId}
                  onChange={(e) => setFormData({ ...formData, jiraBoardId: e.target.value })}
                  className="w-full glass-input font-mono"
                  placeholder="ej: 6013"
                />
              </div>
            </div>

            {/* Modo Backup URLs */}
            <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Modo Backup (URLs Directas):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.jiraProjectUrl || ''}
                  onChange={(e) => setFormData({ ...formData, jiraProjectUrl: e.target.value })}
                  placeholder="URL Proyecto Jira (ej: https://sonda.atlassian.net/...)"
                  className="w-full glass-input"
                />
                <input
                  type="text"
                  value={formData.jiraBoardUrl || ''}
                  onChange={(e) => setFormData({ ...formData, jiraBoardUrl: e.target.value })}
                  placeholder="URL Tablero Jira"
                  className="w-full glass-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bitbucket Settings */}
        {formData.enableBitbucket && (
          <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center space-x-2">
              <span>🐙 Parámetros de Bitbucket Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Workspace:</label>
                <input
                  type="text"
                  value={formData.bitbucketWorkspace}
                  onChange={(e) => setFormData({ ...formData, bitbucketWorkspace: e.target.value })}
                  className="w-full glass-input"
                  placeholder="ej: sondacode"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Repo Slug:</label>
                <input
                  type="text"
                  value={formData.bitbucketRepoSlug}
                  onChange={(e) => setFormData({ ...formData, bitbucketRepoSlug: e.target.value })}
                  className="w-full glass-input"
                  placeholder="ej: cotizador-claude-corporativo"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Bitbucket User / Email:</label>
                <input
                  type="text"
                  value={formData.bitbucketUser}
                  onChange={(e) => setFormData({ ...formData, bitbucketUser: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">App Password / Token:</label>
                <div className="relative">
                  <input
                    type={showBBPassword ? 'text' : 'password'}
                    value={formData.bitbucketAppPassword || ''}
                    onChange={(e) => setFormData({ ...formData, bitbucketAppPassword: e.target.value })}
                    className="w-full glass-input pr-9"
                    placeholder="Contraseña de aplicación Bitbucket"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBBPassword(!showBBPassword)}
                    className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs"
                  >
                    {showBBPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">URL Repositorio Bitbucket (Manual):</label>
                <input
                  type="text"
                  value={formData.bitbucketRepoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, bitbucketRepoUrl: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confluence Settings */}
        {formData.enableConfluence && (
          <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <span>📘 Parámetros de Confluence Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Space Key (Clave del Espacio):</label>
                <input
                  type="text"
                  value={formData.confluenceSpaceKey || ''}
                  onChange={(e) => setFormData({ ...formData, confluenceSpaceKey: e.target.value.toUpperCase() })}
                  className="w-full glass-input uppercase font-mono font-bold"
                  placeholder="ej: CCYACE"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">URL Directa del Espacio (Manual):</label>
                <input
                  type="text"
                  value={formData.confluenceUrl || ''}
                  onChange={(e) => setFormData({ ...formData, confluenceUrl: e.target.value })}
                  className="w-full glass-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
          <div>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar el perfil "${formData.name}"?`)) {
                    deleteProfile(formData.id);
                  }
                }}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
              >
                🗑️ Eliminar Perfil
              </button>
            )}
          </div>

          <button
            type="submit"
            className="glass-button-primary px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            💾 Guardar Perfil
          </button>
        </div>
      </form>
    </div>
  );
};
