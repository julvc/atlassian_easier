import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectProfile } from '../types';

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
    const dir = await window.electronAPI.selectDirectory();
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Configuración de Perfiles de Proyecto</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define credenciales, rutas locales y servicios habilitados por proyecto.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              const newP = createNewProfile();
              setFormData(newP);
            }}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <span>➕</span>
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      {/* Profiles tabs selector */}
      <div className="flex space-x-2 overflow-x-auto pb-1 border-b border-slate-800">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => {
              selectProfile(p.id);
              setFormData(p);
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-colors border-t border-x ${
              activeProfile?.id === p.id
                ? 'bg-slate-900 text-sky-400 border-slate-700 -mb-px'
                : 'bg-slate-950 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Perfil *:</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="ej: Cotizador Claude Enterprise"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Carpeta Local del Código (Working Dir) *:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.projectPath}
                onChange={(e) => setFormData({ ...formData, projectPath: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                placeholder="C:\Users\...\COTIZADOR_CLAUDE_CORPORATIVE"
              />
              <button
                type="button"
                onClick={handleSelectDir}
                className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg shrink-0"
              >
                📂 Examinar...
              </button>
            </div>
          </div>
        </div>

        {/* Modules Toggles */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Servicios a Conectar (Modular y No Forzado)
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={formData.enableJira}
                onChange={(e) => setFormData({ ...formData, enableJira: e.target.checked })}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span>Conectar Jira Cloud</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={formData.enableBitbucket}
                onChange={(e) => setFormData({ ...formData, enableBitbucket: e.target.checked })}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span>Conectar Bitbucket Cloud</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={formData.enableConfluence}
                onChange={(e) => setFormData({ ...formData, enableConfluence: e.target.checked })}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span>Conectar Confluence Cloud</span>
            </label>
          </div>
        </div>

        {/* Jira Settings */}
        {formData.enableJira && (
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2">
              <span>📋 Parámetros de Jira Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Atlassian *:</label>
                <input
                  type="email"
                  required
                  value={formData.jiraEmail}
                  onChange={(e) => setFormData({ ...formData, jiraEmail: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">API Token *:</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    value={formData.jiraToken}
                    onChange={(e) => setFormData({ ...formData, jiraToken: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white pr-9"
                    placeholder="ATATT3xFfGF0..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    {showToken ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Host Jira:</label>
                <input
                  type="text"
                  value={formData.jiraHost}
                  onChange={(e) => setFormData({ ...formData, jiraHost: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Key (Clave Proyecto):</label>
                <input
                  type="text"
                  value={formData.jiraProjectKey}
                  onChange={(e) => setFormData({ ...formData, jiraProjectKey: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono uppercase"
                  placeholder="ej: CCYACE"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Board ID (ID Tablero):</label>
                <input
                  type="text"
                  value={formData.jiraBoardId}
                  onChange={(e) => setFormData({ ...formData, jiraBoardId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  placeholder="ej: 6013"
                />
              </div>
            </div>

            {/* Modo Backup URLs */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Modo Backup (URLs Directas):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.jiraProjectUrl || ''}
                  onChange={(e) => setFormData({ ...formData, jiraProjectUrl: e.target.value })}
                  placeholder="URL Proyecto Jira (ej: https://sonda.atlassian.net/...)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-xs text-slate-300"
                />
                <input
                  type="text"
                  value={formData.jiraBoardUrl || ''}
                  onChange={(e) => setFormData({ ...formData, jiraBoardUrl: e.target.value })}
                  placeholder="URL Tablero Jira"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-xs text-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bitbucket Settings */}
        {formData.enableBitbucket && (
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2">
              <span>🐙 Parámetros de Bitbucket Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Workspace:</label>
                <input
                  type="text"
                  value={formData.bitbucketWorkspace}
                  onChange={(e) => setFormData({ ...formData, bitbucketWorkspace: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  placeholder="ej: sondacode"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Repo Slug:</label>
                <input
                  type="text"
                  value={formData.bitbucketRepoSlug}
                  onChange={(e) => setFormData({ ...formData, bitbucketRepoSlug: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  placeholder="ej: cotizador-claude-corporativo"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Bitbucket User / Email:</label>
                <input
                  type="text"
                  value={formData.bitbucketUser}
                  onChange={(e) => setFormData({ ...formData, bitbucketUser: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">App Password / Token:</label>
                <div className="relative">
                  <input
                    type={showBBPassword ? 'text' : 'password'}
                    value={formData.bitbucketAppPassword || ''}
                    onChange={(e) => setFormData({ ...formData, bitbucketAppPassword: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white pr-9"
                    placeholder="Contraseña de aplicación Bitbucket"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBBPassword(!showBBPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    {showBBPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">URL Repositorio Bitbucket (Manual):</label>
                <input
                  type="text"
                  value={formData.bitbucketRepoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, bitbucketRepoUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confluence Settings */}
        {formData.enableConfluence && (
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <span>📘 Parámetros de Confluence Cloud</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Space Key (Clave del Espacio):</label>
                <input
                  type="text"
                  value={formData.confluenceSpaceKey || ''}
                  onChange={(e) => setFormData({ ...formData, confluenceSpaceKey: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white uppercase"
                  placeholder="ej: CCYACE"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">URL Directa del Espacio (Manual):</label>
                <input
                  type="text"
                  value={formData.confluenceUrl || ''}
                  onChange={(e) => setFormData({ ...formData, confluenceUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar el perfil "${formData.name}"?`)) {
                    deleteProfile(formData.id);
                  }
                }}
                className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/60"
              >
                🗑️ Eliminar Perfil
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            💾 Guardar Perfil
          </button>
        </div>
      </form>
    </div>
  );
};
