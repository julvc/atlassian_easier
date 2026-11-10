import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectProfile, JiraUser, JiraIssue, LogMessage, PipelineStep } from '../types';
import { atlassianService } from '../services/atlassianService';

interface AppContextType {
  profiles: ProjectProfile[];
  activeProfile: ProjectProfile | null;
  currentUser: JiraUser | null;
  jiraIssues: JiraIssue[];
  isLoadingIssues: boolean;
  connectionStatus: {
    jira: 'unknown' | 'ok' | 'error';
    bitbucket: 'unknown' | 'ok' | 'error';
    confluence: 'unknown' | 'ok' | 'error';
  };
  logs: LogMessage[];
  isProcessRunning: boolean;

  saveProfile: (profile: ProjectProfile) => Promise<void>;
  selectProfile: (profileId: string) => void;
  createNewProfile: () => ProjectProfile;
  deleteProfile: (profileId: string) => Promise<void>;
  refreshJiraData: () => Promise<void>;
  assignIssueToMe: (issueKey: string) => Promise<boolean>;
  closeIssueWithValidation: (issueKey: string, timeSpent: string, comment: string) => Promise<boolean>;
  generateInitialCmmi: () => Promise<void>;
  executePipeline: (steps: PipelineStep[]) => Promise<void>;
  killProcess: () => Promise<void>;
  clearLogs: () => void;
  addLog: (text: string, type?: LogMessage['type']) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_PROFILE: ProjectProfile = {
  id: 'profile-cotizador-default',
  name: 'Cotizador Claude Enterprise (SONDA CCYACE)',
  projectPath: 'C:\\Users\\jvarasc\\Documents\\CODIGO\\COTIZADOR_CLAUDE_CORPORATIVE',
  enableJira: true,
  enableBitbucket: true,
  enableConfluence: false,
  jiraHost: 'sonda.atlassian.net',
  jiraEmail: 'julio.varas@sonda.com',
  jiraToken: '',
  jiraProjectKey: 'CCYACE',
  jiraBoardId: '6013',
  jiraProjectUrl: 'https://sonda.atlassian.net/jira/software/c/projects/CCYACE/boards/6013',
  bitbucketWorkspace: 'sondacode',
  bitbucketRepoSlug: 'cotizador-claude-corporativo',
  bitbucketUser: 'julio.varas@sonda.com',
  bitbucketAppPassword: '',
  bitbucketRepoUrl: 'https://bitbucket.org/sondacode/cotizador-claude-corporativo',
  confluenceHost: 'sonda.atlassian.net',
  confluenceSpaceKey: 'CCYACE'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<ProjectProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ProjectProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<JiraUser | null>(null);
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    jira: 'unknown' | 'ok' | 'error';
    bitbucket: 'unknown' | 'ok' | 'error';
    confluence: 'unknown' | 'ok' | 'error';
  }>({ jira: 'unknown', bitbucket: 'unknown', confluence: 'unknown' });
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isProcessRunning, setIsProcessRunning] = useState(false);

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      text,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => setLogs([]);

  // 1. Cargar perfiles guardados al iniciar
  useEffect(() => {
    async function init() {
      if (!window.electronAPI) return;
      try {
        const loaded = await window.electronAPI.loadProfiles();
        if (loaded && loaded.length > 0) {
          setProfiles(loaded);
          setActiveProfile(loaded[0]);
        } else {
          setProfiles([DEFAULT_PROFILE]);
          setActiveProfile(DEFAULT_PROFILE);
          await window.electronAPI.saveProfiles([DEFAULT_PROFILE]);
        }
      } catch (e: any) {
        console.error('Error inicializando perfiles:', e);
      }
    }
    init();
  }, []);

  // 2. Escuchar logs del runner de procesos
  useEffect(() => {
    if (!window.electronAPI?.onProcessLog) return;
    const unsubLog = window.electronAPI.onProcessLog((data) => {
      addLog(data.text, data.type);
    });
    const unsubExit = window.electronAPI.onProcessExit((_code) => {
      setIsProcessRunning(false);
    });
    return () => {
      unsubLog();
      unsubExit();
    };
  }, []);

  // 3. Al cambiar de perfil activo, verificar usuario y cargar tareas
  useEffect(() => {
    if (!activeProfile) return;
    refreshJiraData();
  }, [activeProfile?.id, activeProfile?.jiraToken, activeProfile?.jiraProjectKey]);

  const refreshJiraData = async () => {
    if (!activeProfile || !activeProfile.enableJira || !activeProfile.jiraToken) {
      setCurrentUser(null);
      setJiraIssues([]);
      setConnectionStatus(prev => ({ ...prev, jira: 'unknown' }));
      return;
    }

    setIsLoadingIssues(true);
    try {
      // Validar usuario mediante /myself
      addLog(`Validando credenciales en Jira (${activeProfile.jiraHost})...`, 'info');
      const user = await atlassianService.getMyself(activeProfile);
      setCurrentUser(user);
      setConnectionStatus(prev => ({ ...prev, jira: 'ok' }));
      addLog(`Usuario Jira autenticado: ${user.displayName} (${user.emailAddress}) · AccountId: ${user.accountId}`, 'success');

      // Consultar incidencias existentes
      addLog(`Consultando incidencias para el proyecto ${activeProfile.jiraProjectKey}...`, 'info');
      const issues = await atlassianService.getIssues(activeProfile);
      setJiraIssues(issues);
      addLog(`Se encontraron ${issues.length} incidencias en Jira.`, 'info');
    } catch (err: any) {
      setConnectionStatus(prev => ({ ...prev, jira: 'error' }));
      addLog(`Error al conectar con Jira: ${err.message}`, 'error');
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const saveProfile = async (updated: ProjectProfile) => {
    const list = profiles.map(p => p.id === updated.id ? updated : p);
    if (!list.find(p => p.id === updated.id)) {
      list.push(updated);
    }
    setProfiles(list);
    setActiveProfile(updated);
    await window.electronAPI.saveProfiles(list);
    addLog(`Perfil "${updated.name}" guardado exitosamente.`, 'success');
  };

  const selectProfile = (profileId: string) => {
    const found = profiles.find(p => p.id === profileId);
    if (found) {
      setActiveProfile(found);
      addLog(`Perfil cambiado a: ${found.name}`, 'info');
    }
  };

  const createNewProfile = (): ProjectProfile => {
    const newP: ProjectProfile = {
      id: 'profile-' + Date.now(),
      name: 'Nuevo Proyecto',
      projectPath: '',
      enableJira: true,
      enableBitbucket: true,
      enableConfluence: false,
      jiraHost: 'sonda.atlassian.net',
      jiraEmail: currentUser?.emailAddress || 'julio.varas@sonda.com',
      jiraToken: '',
      jiraProjectKey: '',
      jiraBoardId: '',
      bitbucketWorkspace: 'sondacode',
      bitbucketRepoSlug: '',
      bitbucketUser: currentUser?.emailAddress || 'julio.varas@sonda.com'
    };
    const updated = [...profiles, newP];
    setProfiles(updated);
    setActiveProfile(newP);
    window.electronAPI.saveProfiles(updated);
    return newP;
  };

  const deleteProfile = async (profileId: string) => {
    const remaining = profiles.filter(p => p.id !== profileId);
    setProfiles(remaining);
    if (activeProfile?.id === profileId) {
      setActiveProfile(remaining[0] || null);
    }
    await window.electronAPI.saveProfiles(remaining);
    addLog(`Perfil eliminado.`, 'info');
  };

  const assignIssueToMe = async (issueKey: string): Promise<boolean> => {
    if (!activeProfile || !currentUser) return false;
    try {
      addLog(`Asignando ${issueKey} a ${currentUser.displayName}...`, 'info');
      await atlassianService.assignIssueToUser(activeProfile, issueKey, currentUser.accountId);
      addLog(`✓ ${issueKey} asignada a ti correctamente.`, 'success');
      await refreshJiraData();
      return true;
    } catch (e: any) {
      addLog(`Error al asignar ${issueKey}: ${e.message}`, 'error');
      return false;
    }
  };

  const closeIssueWithValidation = async (issueKey: string, timeSpent: string, comment: string): Promise<boolean> => {
    if (!activeProfile) return false;
    try {
      addLog(`Iniciando cierre validado de ${issueKey}...`, 'info');

      // 1. Obtener transiciones
      const transitions = await atlassianService.getTransitions(activeProfile, issueKey);
      let targetTrans = transitions.find((t: any) => 
        t.name.toLowerCase().includes('hecho') || 
        t.name.toLowerCase().includes('done') || 
        t.name.toLowerCase().includes('finaliz') || 
        t.name.toLowerCase().includes('cerr')
      );

      if (!targetTrans) {
        // Buscar transición intermedia si está en pendiente
        const inProg = transitions.find((t: any) => 
          t.name.toLowerCase().includes('curso') || 
          t.name.toLowerCase().includes('progreso')
        );
        if (inProg) {
          await atlassianService.transitionIssue(activeProfile, issueKey, inProg.id);
          const nextTrans = await atlassianService.getTransitions(activeProfile, issueKey);
          targetTrans = nextTrans.find((t: any) => 
            t.name.toLowerCase().includes('hecho') || 
            t.name.toLowerCase().includes('done') || 
            t.name.toLowerCase().includes('finaliz')
          );
        }
      }

      if (targetTrans) {
        await atlassianService.transitionIssue(activeProfile, issueKey, targetTrans.id);
        addLog(`✓ Estado de ${issueKey} actualizado a: ${targetTrans.name}`, 'success');
      } else {
        addLog(`(Aviso: No se encontró transición directa a "Hecho" para ${issueKey})`, 'info');
      }

      // 2. Registrar Worklog
      if (timeSpent && timeSpent.trim()) {
        await atlassianService.addWorklog(activeProfile, issueKey, timeSpent.trim(), comment || 'Cierre validado por usuario');
        addLog(`✓ Registradas ${timeSpent} en el worklog de ${issueKey}.`, 'success');
      }

      // 3. Comentario de cierre
      if (comment && comment.trim()) {
        await atlassianService.addComment(activeProfile, issueKey, `[VALIDACIÓN DE CIERRE CMMI v3.0]\n• Responsable: ${currentUser?.displayName || activeProfile.jiraEmail}\n• Evidencia: ${comment}`);
      }

      addLog(`✓ Tarea ${issueKey} cerrada y validada exitosamente.`, 'success');
      await refreshJiraData();
      return true;
    } catch (err: any) {
      addLog(`Error al cerrar ${issueKey}: ${err.message}`, 'error');
      return false;
    }
  };

  const generateInitialCmmi = async () => {
    if (!activeProfile || !currentUser) return;
    try {
      addLog(`Generando estructura inicial CMMI v3.0 para el proyecto ${activeProfile.jiraProjectKey}...`, 'info');
      const res = await atlassianService.createInitialCmmiStructure(activeProfile, currentUser.accountId);
      addLog(`✓ ${res.created} tareas creadas y asignadas a ti.`, 'success');
      if (res.errors.length > 0) {
        res.errors.forEach(e => addLog(`Aviso: ${e}`, 'error'));
      }
      await refreshJiraData();
    } catch (e: any) {
      addLog(`Error al inicializar CMMI: ${e.message}`, 'error');
    }
  };

  const executePipeline = async (steps: PipelineStep[]) => {
    if (!activeProfile || !activeProfile.projectPath) {
      addLog('Error: Selecciona una carpeta válida de proyecto antes de ejecutar el pipeline.', 'error');
      return;
    }

    setIsProcessRunning(true);
    addLog(`=== INICIANDO PIPELINE DE AUTOMATIZACIÓN EN: ${activeProfile.projectPath} ===`, 'info');

    for (const step of steps) {
      if (!step.enabled) {
        addLog(`[OMITIDO] ${step.title}`, 'info');
        continue;
      }

      addLog(`\n>>> EJECUTANDO FASE: ${step.title}...`, 'info');

      if (step.id === 'step-jira-sync') {
        // Si existe scripts/atlassian_sync.cjs ejecutarlo, o sincronizar vía API
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/atlassian_sync.cjs']
        });
      } else if (step.id === 'step-build-release') {
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/publicar_release_exe.cjs']
        });
      } else if (step.id === 'step-bitbucket-push') {
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/crear_commits_cmmi.cjs']
        });
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/bitbucket_sync.cjs']
        });
      }
    }

    addLog(`\n=== PIPELINE FINALIZADO CON ÉXITO ===`, 'success');
    setIsProcessRunning(false);
  };

  const killProcess = async () => {
    await window.electronAPI.killProcess();
    setIsProcessRunning(false);
  };

  return (
    <AppContext.Provider value={{
      profiles,
      activeProfile,
      currentUser,
      jiraIssues,
      isLoadingIssues,
      connectionStatus,
      logs,
      isProcessRunning,
      saveProfile,
      selectProfile,
      createNewProfile,
      deleteProfile,
      refreshJiraData,
      assignIssueToMe,
      closeIssueWithValidation,
      generateInitialCmmi,
      executePipeline,
      killProcess,
      clearLogs,
      addLog
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de un AppProvider');
  return context;
};
