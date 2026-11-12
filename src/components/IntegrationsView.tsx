import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { atlassianService } from '../services/atlassianService';
import { ChainIntegrationsIcon } from './icons/NavigationIcons';

export const IntegrationsView: React.FC = () => {
  const { activeProfile, saveProfile, addLog } = useApp();

  const [bitbucketStatus, setBitbucketStatus] = useState<string | null>(null);
  const [confluenceStatus, setConfluenceStatus] = useState<string | null>(null);
  const [isTestingBB, setIsTestingBB] = useState(false);
  const [isTestingConf, setIsTestingConf] = useState(false);

  // Commit CMMI State
  const [jiraKeyForCommit, setJiraKeyForCommit] = useState(activeProfile?.jiraProjectKey ? `${activeProfile.jiraProjectKey}-` : 'CCYACE-');
  const [commitMessage, setCommitMessage] = useState('Implementación y ajustes de gobernanza CMMI v3.0');

  if (!activeProfile) return null;

  const testBitbucketConnection = async () => {
    setIsTestingBB(true);
    setBitbucketStatus('Probando conexión con Bitbucket Cloud...');
    try {
      const data = await atlassianService.testBitbucket(activeProfile);
      setBitbucketStatus(`✓ Repositorio verificado: ${data.full_name || activeProfile.bitbucketRepoSlug} (UUID: ${data.uuid})`);
      addLog(`✓ Bitbucket OK: Repositorio ${data.full_name} conectado.`, 'success');
    } catch (e: any) {
      setBitbucketStatus(`✗ Error Bitbucket: ${e.message}`);
      addLog(`Error Bitbucket: ${e.message}`, 'error');
    } finally {
      setIsTestingBB(false);
    }
  };

  const testConfluenceConnection = async () => {
    setIsTestingConf(true);
    setConfluenceStatus('Probando conexión con Confluence Cloud...');
    try {
      const data = await atlassianService.testConfluence(activeProfile);
      setConfluenceStatus(`✓ Espacio verificado: ${data.name || activeProfile.confluenceSpaceKey} (Key: ${data.key})`);
      addLog(`✓ Confluence OK: Espacio ${data.name} validado.`, 'success');
    } catch (e: any) {
      setConfluenceStatus(`✗ Error Confluence: ${e.message}`);
      addLog(`Error Confluence: ${e.message}`, 'error');
    } finally {
      setIsTestingConf(false);
    }
  };

  const executeManualCmmiCommit = async () => {
    if (!activeProfile.projectPath) {
      addLog('Error: No hay carpeta de proyecto local configurada en este perfil.', 'error');
      return;
    }

    const fullMessage = `${jiraKeyForCommit.trim()} ${commitMessage.trim()}`;
    addLog(`Generando commit CMMI: "${fullMessage}" en ${activeProfile.projectPath}...`, 'info');

    // Git add y commit
    await window.electronAPI.runProcess({
      cwd: activeProfile.projectPath,
      command: 'git',
      args: ['add', '.']
    });

    await window.electronAPI.runProcess({
      cwd: activeProfile.projectPath,
      command: 'git',
      args: ['commit', '-m', fullMessage]
    });

    addLog('✓ Commit CMMI registrado localmente.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      <div className="flex items-center space-x-3">
        <ChainIntegrationsIcon size={26} />
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Integraciones Bitbucket & Confluence</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Conexión por URLs directas y tokens para control de versiones y documentación de entrega.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BITBUCKET PANEL */}
        <div className={`glass-panel p-6 rounded-2xl border transition-all ${
          activeProfile.enableBitbucket 
            ? 'border-brand-500/30 dark:border-brand-500/40' 
            : 'opacity-60 border-black/10 dark:border-white/10'
        } space-y-4 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">🐙</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Bitbucket Cloud</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Control de código, ramas y tags de release</p>
              </div>
            </div>
            <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={activeProfile.enableBitbucket}
                onChange={(e) => saveProfile({ ...activeProfile, enableBitbucket: e.target.checked })}
                className="rounded border-gray-400 text-brand-600 focus:ring-0"
              />
              <span>Habilitar</span>
            </label>
          </div>

          {activeProfile.enableBitbucket && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">URL Directa del Repositorio (Manual):</label>
                <input
                  type="text"
                  value={activeProfile.bitbucketRepoUrl || ''}
                  onChange={(e) => saveProfile({ ...activeProfile, bitbucketRepoUrl: e.target.value })}
                  placeholder="https://bitbucket.org/sondacode/cotizador-claude-corporativo"
                  className="w-full glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Workspace:</label>
                  <input
                    type="text"
                    value={activeProfile.bitbucketWorkspace}
                    onChange={(e) => saveProfile({ ...activeProfile, bitbucketWorkspace: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Repo Slug:</label>
                  <input
                    type="text"
                    value={activeProfile.bitbucketRepoSlug}
                    onChange={(e) => saveProfile({ ...activeProfile, bitbucketRepoSlug: e.target.value })}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={testBitbucketConnection}
                  disabled={isTestingBB}
                  className="glass-button px-4 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
                >
                  <span>{isTestingBB ? '⏳' : '🧪'}</span>
                  <span>Probar Conexión Bitbucket</span>
                </button>
              </div>

              {bitbucketStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${
                  bitbucketStatus.startsWith('✓') 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50' 
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/50'
                }`}>
                  {bitbucketStatus}
                </div>
              )}

              {/* Commit Assistant */}
              <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Asistente de Commits CMMI
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Clave Jira:</label>
                    <input
                      type="text"
                      value={jiraKeyForCommit}
                      onChange={(e) => setJiraKeyForCommit(e.target.value)}
                      placeholder="CCYACE-31"
                      className="w-full glass-input font-mono font-bold text-brand-600 dark:text-brand-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Mensaje descriptivo:</label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={executeManualCmmiCommit}
                  className="glass-button-primary w-full py-2.5 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  ✓ Generar Commit CMMI en Repositorio Local
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONFLUENCE PANEL */}
        <div className={`glass-panel p-6 rounded-2xl border transition-all ${
          activeProfile.enableConfluence 
            ? 'border-brand-500/30 dark:border-brand-500/40' 
            : 'opacity-60 border-black/10 dark:border-white/10'
        } space-y-4 shadow-xs`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">📘</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Confluence Cloud</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Documentación de arquitectura y entregables</p>
              </div>
            </div>
            <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={activeProfile.enableConfluence}
                onChange={(e) => saveProfile({ ...activeProfile, enableConfluence: e.target.checked })}
                className="rounded border-gray-400 text-brand-600 focus:ring-0"
              />
              <span>Habilitar</span>
            </label>
          </div>

          {activeProfile.enableConfluence && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">URL Directa del Espacio o Página (Manual):</label>
                <input
                  type="text"
                  value={activeProfile.confluenceUrl || ''}
                  onChange={(e) => saveProfile({ ...activeProfile, confluenceUrl: e.target.value })}
                  placeholder="https://sonda.atlassian.net/wiki/spaces/CCYACE/pages/..."
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Space Key (Clave del Espacio):</label>
                <input
                  type="text"
                  value={activeProfile.confluenceSpaceKey || ''}
                  onChange={(e) => saveProfile({ ...activeProfile, confluenceSpaceKey: e.target.value })}
                  placeholder="ej: CCYACE"
                  className="w-full glass-input uppercase font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={testConfluenceConnection}
                  disabled={isTestingConf}
                  className="glass-button px-4 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
                >
                  <span>{isTestingConf ? '⏳' : '🧪'}</span>
                  <span>Probar Conexión Confluence</span>
                </button>
              </div>

              {confluenceStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${
                  confluenceStatus.startsWith('✓') 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50' 
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/50'
                }`}>
                  {confluenceStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
