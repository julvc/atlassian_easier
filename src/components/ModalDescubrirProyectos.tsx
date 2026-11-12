import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DiscoveredProject, GovernanceType } from '../types';

interface ModalDescubrirProyectosProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalDescubrirProyectos: React.FC<ModalDescubrirProyectosProps> = ({ isOpen, onClose }) => {
  const {
    discoveredProjects,
    isDiscovering,
    discoverProjects,
    importDiscoveredProjects,
    profiles,
    activeProfile,
    selectProfile,
    bitbucketRepositories,
    isLoadingBitbucketRepos,
    fetchBitbucketRepositories,
    jiraProjectsList,
    fetchJiraProjectsList,
    importBitbucketRepo,
    setProjectPath
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bitbucket' | 'local'>('bitbucket');
  const [bitbucketSearch, setBitbucketSearch] = useState('');
  const [selectedJiraKeys, setSelectedJiraKeys] = useState<Record<string, string>>({});
  const [selectedGovs, setSelectedGovs] = useState<Record<string, GovernanceType>>({});
  const [selectedLocalPaths, setSelectedLocalPaths] = useState<Record<string, string>>({});

  // Tab Local
  const [rootDir, setRootDir] = useState('C:\\Users\\jvarasc\\Documents\\CODIGO');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [projectsList, setProjectsList] = useState<DiscoveredProject[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (bitbucketRepositories.length === 0) {
        fetchBitbucketRepositories();
      }
      if (jiraProjectsList.length === 0) {
        fetchJiraProjectsList();
      }
      handleScan(rootDir);
    }
  }, [isOpen]);

  useEffect(() => {
    const profilePaths = new Set(profiles.map(p => (p.projectPath || '').toLowerCase()));
    const enriched = discoveredProjects.map(dp => ({
      ...dp,
      isAlreadyAdded: profilePaths.has((dp.path || '').toLowerCase())
    }));
    setProjectsList(enriched);

    const newSelected = new Set<string>();
    enriched.forEach(p => {
      if (!p.isAlreadyAdded) {
        newSelected.add(p.path);
      }
    });
    setSelectedPaths(newSelected);
  }, [discoveredProjects, profiles]);

  if (!isOpen) return null;

  const handleScan = async (path?: string) => {
    const list = await discoverProjects(path || rootDir);
    const profilePaths = new Set(profiles.map(p => (p.projectPath || '').toLowerCase()));
    const enriched = list.map(dp => ({
      ...dp,
      isAlreadyAdded: profilePaths.has((dp.path || '').toLowerCase())
    }));
    setProjectsList(enriched);
  };

  const handleBrowseDir = async () => {
    if (!window.electronAPI?.selectDirectory) return;
    const dir = await window.electronAPI.selectDirectory(rootDir);
    if (dir) {
      setRootDir(dir);
      await handleScan(dir);
    }
  };

  const handlePickLocalFolderForRepo = async (repoSlug: string) => {
    if (!window.electronAPI?.selectDirectory) return;
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      setSelectedLocalPaths(prev => ({ ...prev, [repoSlug]: dir }));
      // Si el perfil ya existe en la suite, actualizar su ruta
      const existing = profiles.find(p => p.bitbucketRepoSlug === repoSlug);
      if (existing) {
        selectProfile(existing.id);
        await setProjectPath(dir);
      }
    }
  };

  const handleImportSingleBitbucket = async (repo: any) => {
    const slug = repo.slug || repo.name;
    const chosenJira = selectedJiraKeys[slug] || (
      slug.includes('gespad') ? 'GES' :
      slug.includes('cotizador') ? 'CCYACE' :
      slug.includes('sistema_gestion') ? 'SGC' :
      slug.includes('datalake') ? 'OTC' : ''
    );
    const chosenGov = selectedGovs[slug] || 'cmmi_hybrid';
    const chosenPath = selectedLocalPaths[slug] || '';

    await importBitbucketRepo(repo, {
      localPath: chosenPath,
      jiraProjectKey: chosenJira,
      governance: chosenGov
    });
  };

  const filteredBbRepos = bitbucketRepositories.filter(r => {
    if (!bitbucketSearch.trim()) return true;
    const q = bitbucketSearch.toLowerCase();
    const name = (r.name || '').toLowerCase();
    const slug = (r.slug || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return name.includes(q) || slug.includes(q) || desc.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="glass-panel w-full max-w-5xl max-h-[88vh] rounded-3xl shadow-2xl border border-black/10 dark:border-white/15 flex flex-col overflow-hidden bg-white/95 dark:bg-[#0E1117]/95">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xl font-bold border border-brand-200 dark:border-brand-800">
              🌐
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <span>Catálogo & Descubridor de Repositorios Atlassian</span>
                <span className="text-[10px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  Bitbucket · Jira · Local
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Explora todos los repositorios disponibles en tu workspace Bitbucket (<span className="font-mono">sondacode</span>) o escanea tus carpetas locales en el equipo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl glass-button flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('bitbucket')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'bitbucket'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>🌐 Repositorios Bitbucket Cloud</span>
            <span className="text-[10px] bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800 font-mono">
              {bitbucketRepositories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'local'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>💻 Carpetas Locales en mi PC</span>
            <span className="text-[10px] bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">
              {projectsList.length}
            </span>
          </button>
        </div>

        {/* TAB 1: REPOSITORIOS BITBUCKET CLOUD */}
        {activeTab === 'bitbucket' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Actions Bar */}
            <div className="px-6 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex-1 max-w-md relative">
                <input
                  type="text"
                  value={bitbucketSearch}
                  onChange={(e) => setBitbucketSearch(e.target.value)}
                  placeholder="🔍 Buscar por nombre o slug (ej: gespad, cotizador, portal)..."
                  className="glass-input w-full text-xs py-1.5 px-3 rounded-xl"
                />
                {bitbucketSearch && (
                  <button
                    type="button"
                    onClick={() => setBitbucketSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fetchBitbucketRepositories()}
                  disabled={isLoadingBitbucketRepos}
                  className="glass-button text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span className={isLoadingBitbucketRepos ? 'animate-spin' : ''}>🔄</span>
                  <span>{isLoadingBitbucketRepos ? 'Cargando Bitbucket...' : 'Refrescar Repositorios'}</span>
                </button>
              </div>
            </div>

            {/* Repositories List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingBitbucketRepos ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-gray-500">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold">Consultando API de Bitbucket Cloud (workspace sondacode)...</p>
                </div>
              ) : filteredBbRepos.length === 0 ? (
                <div className="py-20 text-center text-gray-500 space-y-2">
                  <span className="text-3xl">📦</span>
                  <p className="text-xs font-semibold">No se encontraron repositorios con ese criterio.</p>
                  <p className="text-[11px] text-gray-400">Verifica que tu App Password tenga permisos de lectura sobre el workspace sondacode.</p>
                </div>
              ) : (
                filteredBbRepos.map((repo) => {
                  const slug = repo.slug || repo.name;
                  const existingProfile = profiles.find(p => p.bitbucketRepoSlug === slug || (p.name || '').toLowerCase() === (repo.name || '').toLowerCase());
                  const isAlreadyAdded = !!existingProfile;
                  const isActive = activeProfile?.id === existingProfile?.id;
                  const currentLocalPath = existingProfile?.projectPath || selectedLocalPaths[slug] || '';
                  const mainBranch = repo.mainbranch?.name || (slug === 'gespad-sii' ? 'develop' : 'main');
                  const isUserActiveRepo = ['cotizador-claude-corporativo', 'gespad-sii', 'sistema_gestion_control', 'datalake-otasa'].includes((slug || '').toLowerCase());

                  return (
                    <div
                      key={slug}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'glass-card border-brand-500/50 dark:border-brand-500/60 shadow-md bg-brand-50/20 dark:bg-brand-950/20'
                          : isUserActiveRepo
                          ? 'glass-card border-rose-300 dark:border-rose-800/80 shadow-xs bg-rose-50/15 dark:bg-rose-950/10'
                          : isAlreadyAdded
                          ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10'
                          : 'glass-card border-black/5 dark:border-white/10 hover:border-black/15'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-[280px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {repo.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/10">
                              {slug}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              🌿 {mainBranch}
                            </span>
                            {isUserActiveRepo && (
                              <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 flex items-center space-x-1">
                                <span>⭐</span>
                                <span>Acceso & Commits Confirmados</span>
                              </span>
                            )}
                            {isAlreadyAdded && (
                              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                ✓ En la Suite
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                ★ Activo Ahora
                              </span>
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {repo.description}
                            </p>
                          )}

                          {/* Vinculación de Carpeta Local */}
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[11px] text-gray-500 font-semibold">Carpeta Local:</span>
                            {currentLocalPath ? (
                              <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200 truncate max-w-md bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                                {currentLocalPath}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                                ⚠️ Sin carpeta asignada
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handlePickLocalFolderForRepo(slug)}
                              className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                            >
                              {currentLocalPath ? 'Cambiar...' : 'Vincular Carpeta...'}
                            </button>
                          </div>
                        </div>

                        {/* Configuración rápida: Jira Project Key & Acciones */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          {/* Selector de Proyecto Jira */}
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] text-gray-500">Jira:</span>
                            <select
                              value={
                                selectedJiraKeys[slug] ||
                                existingProfile?.jiraProjectKey ||
                                (slug.includes('gespad') ? 'GES' :
                                 slug.includes('cotizador') ? 'CCYACE' :
                                 slug.includes('sistema_gestion') ? 'SGC' :
                                 slug.includes('datalake') ? 'OTC' : '')
                              }
                              onChange={(e) => setSelectedJiraKeys(prev => ({ ...prev, [slug]: e.target.value }))}
                              className="glass-input text-xs font-mono font-bold py-1 px-2 rounded-xl text-brand-700 dark:text-brand-300"
                            >
                              <option value="CCYACE">CCYACE</option>
                              <option value="GES">GES</option>
                              <option value="SGC">SGC</option>
                              <option value="OTC">OTC</option>
                              {jiraProjectsList
                                .filter(p => !['CCYACE', 'GES', 'SGC', 'OTC'].includes(p.key))
                                .map(p => (
                                  <option key={p.key} value={p.key}>{p.key} - {p.name}</option>
                                ))}
                            </select>
                          </div>

                          {/* Botón de Importación o Activación */}
                          {isAlreadyAdded ? (
                            <button
                              type="button"
                              onClick={() => {
                                selectProfile(existingProfile.id);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 glass-button text-xs font-bold text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-50 cursor-pointer shadow-xs"
                            >
                              Seleccionar Proyecto →
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleImportSingleBitbucket(repo)}
                              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center space-x-1"
                            >
                              <span>➕</span>
                              <span>Importar a Suite</span>
                            </button>
                          )}

                          <a
                            href={repo.links?.html?.href || `https://bitbucket.org/sondacode/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 glass-button text-gray-500 hover:text-brand-600 rounded-xl text-xs"
                            title="Abrir en Bitbucket Cloud"
                          >
                            ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROYECTOS LOCALES EN PC */}
        {activeTab === 'local' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Directory Bar */}
            <div className="px-6 py-3 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold shrink-0">Carpeta Raíz:</span>
                <input
                  type="text"
                  value={rootDir}
                  onChange={(e) => setRootDir(e.target.value)}
                  className="glass-input text-xs font-mono py-1 px-3 flex-1 rounded-xl"
                  placeholder="C:\Users\jvarasc\Documents\CODIGO"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleBrowseDir}
                  disabled={isDiscovering}
                  className="glass-button text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  📂 Examinar...
                </button>
                <button
                  type="button"
                  onClick={() => handleScan(rootDir)}
                  disabled={isDiscovering}
                  className="glass-button-primary text-xs font-bold text-white px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>{isDiscovering ? '⏳ Escaneando...' : '🔄 Escanear'}</span>
                </button>
              </div>
            </div>

            {/* Local List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isDiscovering ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-gray-500">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold">Escaneando subcarpetas locales en {rootDir}...</p>
                </div>
              ) : projectsList.length === 0 ? (
                <div className="py-20 text-center text-gray-500 space-y-2">
                  <span className="text-3xl">📁</span>
                  <p className="text-xs font-semibold">No se encontraron repositorios Git en esta ruta.</p>
                </div>
              ) : (
                projectsList.map((p) => {
                  const isSelected = selectedPaths.has(p.path);
                  return (
                    <div
                      key={p.path}
                      className={`p-4 rounded-2xl border transition-all ${
                        p.isAlreadyAdded
                          ? 'bg-black/5 dark:bg-white/5 border-black/5 opacity-70'
                          : isSelected
                          ? 'glass-card border-brand-500/50 shadow-md bg-brand-50/20'
                          : 'glass-card border-black/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{p.name}</span>
                            {p.repoSlug && (
                              <span className="text-[10px] font-mono text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md">
                                {p.repoSlug}
                              </span>
                            )}
                            <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              🌿 {p.currentBranch}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-gray-500 truncate max-w-lg">{p.path}</p>
                        </div>

                        {!p.isAlreadyAdded ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await importDiscoveredProjects([p]);
                            }}
                            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            ➕ Importar
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">✓ En la Suite</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>
            {activeTab === 'bitbucket'
              ? `Workspace: sondacode · ${filteredBbRepos.length} repositorio(s) listados`
              : `${projectsList.length} carpeta(s) locales detectadas`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 glass-button text-xs font-semibold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
