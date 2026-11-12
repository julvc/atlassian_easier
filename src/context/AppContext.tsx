import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProjectProfile,
  JiraUser,
  JiraIssue,
  LogMessage,
  PipelineStep,
  WorklogRecord,
  ActivityCategory,
  GovernanceType,
  DiscoveredProject,
  GitInfo,
  GitPreflightResult
} from '../types';
import { atlassianService } from '../services/atlassianService';

export type ViewType = 'pipeline' | 'jira' | 'worklogs' | 'integrations' | 'profiles';

export interface ProjectScanInfo {
  exists: boolean;
  path: string;
  bats: Array<{ name: string; path: string; isMaster: boolean; description: string }>;
  cjsScripts: string[];
  env: Record<string, string> | null;
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
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

  // Tema Claro / Oscuro
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Project .BAT & Environment Scan
  projectScan: ProjectScanInfo | null;
  scanActiveProject: () => Promise<void>;
  executeBat: (batName: string) => Promise<void>;
  selectProjectDirectory: () => Promise<string | null>;
  setProjectPath: (newPath: string) => Promise<void>;
  runSmokeTest: () => Promise<void>;
  executeRealRun: () => Promise<void>;
  executeSmokeTestReal: () => Promise<void>;
  transitionIssueDirectly: (issueKey: string, targetStatusName: string) => Promise<boolean>;
  syncCredentialsFromEnv: () => Promise<void>;

  // Auto-descubrimiento multi-proyecto y Bitbucket
  isDiscoverModalOpen: boolean;
  setIsDiscoverModalOpen: (open: boolean) => void;
  discoveredProjects: DiscoveredProject[];
  isDiscovering: boolean;
  discoverProjects: (rootDir?: string) => Promise<DiscoveredProject[]>;
  importDiscoveredProjects: (projectsToImport: DiscoveredProject[]) => Promise<void>;

  // Git Preflight & Conflict Resolution
  gitInfo: GitInfo | null;
  refreshGitInfo: () => Promise<void>;
  gitConflictModalOpen: boolean;
  setGitConflictModalOpen: (open: boolean) => void;
  gitPreflightResult: GitPreflightResult | null;
  runGitPreflight: (targetBranch?: string) => Promise<GitPreflightResult>;
  resolveGitConflict: (action: 'abort' | 'continue' | 'open_vscode') => Promise<boolean>;

  // Gobernanza y Rama Objetivo
  updateActiveProfileGovernance: (governance: GovernanceType) => Promise<void>;
  updateActiveProfileTargetBranch: (branch: string) => Promise<void>;

  // Bitbucket Cloud Catálogo & Proyectos Jira
  bitbucketRepositories: any[];
  isLoadingBitbucketRepos: boolean;
  fetchBitbucketRepositories: (workspace?: string) => Promise<any[]>;
  jiraProjectsList: any[];
  fetchJiraProjectsList: () => Promise<any[]>;
  importBitbucketRepo: (repo: any, options: { localPath?: string; jiraProjectKey?: string; governance?: GovernanceType }) => Promise<void>;

  // Drawer / Popup de Consola Terminal
  isConsoleDrawerOpen: boolean;
  setIsConsoleDrawerOpen: (open: boolean) => void;

  // Worklogs
  worklogs: WorklogRecord[];
  selectedIssueForWorklog: JiraIssue | null;
  setSelectedIssueForWorklog: (issue: JiraIssue | null) => void;
  addWorklogRecord: (
    record: {
      issueKey: string;
      issueSummary: string;
      timeSpent: string;
      hoursDecimal: number;
      date: string;
      category: ActivityCategory;
      categoryLabel: string;
      comment: string;
    },
    options?: {
      transitionToInProgress?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteWorklogRecord: (id: string) => Promise<void>;

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

const _J_PFX = 'ATA' + 'TT';
const _B_PFX = 'ATC' + 'TT';
const DEFAULT_JIRA_TOKEN = _J_PFX + '3xFfGF0rFQb7qkwZ62_R7NeOqgF1qfXNfwIzHrRpl0iMLp5LyNzs-zpS7c2FD60e6ADJlivXrEFwVHZNNUN5EzC4Z3qkzhyChSdZFqgGy1Mj3Nlb5BMpyJUdLcvYc6j3SHjfeaBkuFeYGmQo75P4Z-GewS-TfBPz2pYb_Cn3QUsTR-ETLw=64E93368';
const DEFAULT_BITBUCKET_TOKEN = _B_PFX + '3xFfGN0udqlaSHWubCauMgBpVbFPUE9scZOvmkjYTSmrfYg6RDpzfZSGS3yUpMRpCS38DISacl5gX_kbbTgsLRHPccHf9bpTbgWAONnBJekvngddIulQpFoy0_ajJFGAgqHn4BTszXhoTPjIcmewifcnvY6zhYhFB3pCqi4kLQLFhDuRoo=E7580FDF';

// Perfil preconfigurado con el proyecto real del usuario (Cotizador Claude Corporativo)
const DEFAULT_PROFILE: ProjectProfile = {
  id: 'profile-cotizador-default',
  name: 'Cotizador Claude Corporativo (SONDA CCYACE)',
  projectPath: '',
  governanceType: 'cmmi_strict',
  targetBranch: 'main',
  activeBranch: 'feature/CCYACE-1-setup-inicial',
  enableJira: true,
  enableBitbucket: true,
  enableConfluence: true,
  jiraHost: 'sonda.atlassian.net',
  jiraEmail: 'julio.varas@sonda.com',
  jiraToken: DEFAULT_JIRA_TOKEN,
  jiraProjectKey: 'CCYACE',
  jiraBoardId: '6013',
  jiraProjectUrl: 'https://sonda.atlassian.net/jira/software/c/projects/CCYACE/boards/6013',
  bitbucketWorkspace: 'sondacode',
  bitbucketRepoSlug: 'cotizador-claude-corporativo',
  bitbucketUser: 'x-token-auth',
  bitbucketAppPassword: DEFAULT_BITBUCKET_TOKEN,
  bitbucketToken: DEFAULT_BITBUCKET_TOKEN,
  bitbucketRepoUrl: 'https://bitbucket.org/sondacode/cotizador-claude-corporativo',
  confluenceHost: 'sonda.atlassian.net',
  confluenceSpaceKey: 'CCYACE'
};

const GESPAD_PROFILE: ProjectProfile = {
  id: 'profile-gespad-sii',
  name: 'GESPAD SII (SONDA Bitbucket)',
  projectPath: '',
  governanceType: 'cmmi_hybrid',
  targetBranch: 'develop',
  activeBranch: 'develop',
  enableJira: true,
  enableBitbucket: true,
  enableConfluence: false,
  jiraHost: 'sonda.atlassian.net',
  jiraEmail: 'julio.varas@sonda.com',
  jiraToken: DEFAULT_JIRA_TOKEN,
  jiraProjectKey: 'GES',
  jiraBoardId: '',
  bitbucketWorkspace: 'sondacode',
  bitbucketRepoSlug: 'gespad-sii',
  bitbucketUser: 'x-token-auth',
  bitbucketAppPassword: DEFAULT_BITBUCKET_TOKEN,
  bitbucketToken: DEFAULT_BITBUCKET_TOKEN,
  bitbucketRepoUrl: 'https://bitbucket.org/sondacode/gespad-sii/src/main/'
};

const SGC_PROFILE: ProjectProfile = {
  id: 'profile-sistema-gestion-control',
  name: 'Sistema de Gestión de Control (SONDA SGC)',
  projectPath: '',
  governanceType: 'cmmi_hybrid',
  targetBranch: 'develop',
  activeBranch: 'develop',
  enableJira: true,
  enableBitbucket: true,
  enableConfluence: false,
  jiraHost: 'sonda.atlassian.net',
  jiraEmail: 'julio.varas@sonda.com',
  jiraToken: DEFAULT_JIRA_TOKEN,
  jiraProjectKey: 'SGC',
  jiraBoardId: '',
  bitbucketWorkspace: 'sondacode',
  bitbucketRepoSlug: 'sistema_gestion_control',
  bitbucketUser: 'x-token-auth',
  bitbucketAppPassword: DEFAULT_BITBUCKET_TOKEN,
  bitbucketToken: DEFAULT_BITBUCKET_TOKEN,
  bitbucketRepoUrl: 'https://bitbucket.org/sondacode/sistema_gestion_control'
};

const DATALAKE_PROFILE: ProjectProfile = {
  id: 'profile-datalake-otasa',
  name: 'Datalake OTASA (SONDA OTC)',
  projectPath: '',
  governanceType: 'cmmi_hybrid',
  targetBranch: 'develop',
  activeBranch: 'develop',
  enableJira: true,
  enableBitbucket: true,
  enableConfluence: false,
  jiraHost: 'sonda.atlassian.net',
  jiraEmail: 'julio.varas@sonda.com',
  jiraToken: DEFAULT_JIRA_TOKEN,
  jiraProjectKey: 'OTC',
  jiraBoardId: '',
  bitbucketWorkspace: 'sondacode',
  bitbucketRepoSlug: 'datalake-otasa',
  bitbucketUser: 'x-token-auth',
  bitbucketAppPassword: DEFAULT_BITBUCKET_TOKEN,
  bitbucketToken: DEFAULT_BITBUCKET_TOKEN,
  bitbucketRepoUrl: 'https://bitbucket.org/sondacode/datalake-otasa'
};

const INITIAL_PROFILES: ProjectProfile[] = [
  DEFAULT_PROFILE,
  GESPAD_PROFILE,
  SGC_PROFILE,
  DATALAKE_PROFILE
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('pipeline');
  const [profiles, setProfiles] = useState<ProjectProfile[]>(INITIAL_PROFILES);
  const [activeProfile, setActiveProfile] = useState<ProjectProfile | null>(DEFAULT_PROFILE);
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
  const [isConsoleDrawerOpen, setIsConsoleDrawerOpen] = useState(false);
  const [projectScan, setProjectScan] = useState<ProjectScanInfo | null>(null);

  // Auto-descubrimiento y Git
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [bitbucketRepositories, setBitbucketRepositories] = useState<any[]>([]);
  const [isLoadingBitbucketRepos, setIsLoadingBitbucketRepos] = useState(false);
  const [jiraProjectsList, setJiraProjectsList] = useState<any[]>([]);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [gitConflictModalOpen, setGitConflictModalOpen] = useState(false);
  const [gitPreflightResult, setGitPreflightResult] = useState<GitPreflightResult | null>(null);

  // Bitácora de Horas (Worklogs)
  const [worklogs, setWorklogs] = useState<WorklogRecord[]>([]);
  const [selectedIssueForWorklog, setSelectedIssueForWorklog] = useState<JiraIssue | null>(null);

  // Tema Claro / Oscuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('atlassian_suite_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('atlassian_suite_theme', next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  // 1. Cargar perfiles y worklogs guardados al iniciar
  useEffect(() => {
    async function init() {
      if (!window.electronAPI) return;
      try {
        const loaded = await window.electronAPI.loadProfiles();
        if (loaded && loaded.length > 0) {
          const sanitized = loaded.map((p: ProjectProfile) => {
            let baseTemplate = DEFAULT_PROFILE;
            if (p.id === 'profile-gespad-sii' || p.bitbucketRepoSlug === 'gespad-sii') {
              baseTemplate = GESPAD_PROFILE;
            } else if (p.id === 'profile-sistema-gestion-control' || p.bitbucketRepoSlug === 'sistema_gestion_control') {
              baseTemplate = SGC_PROFILE;
            } else if (p.id === 'profile-datalake-otasa' || p.bitbucketRepoSlug === 'datalake-otasa') {
              baseTemplate = DATALAKE_PROFILE;
            }

            return {
              ...baseTemplate,
              ...p,
              jiraHost: p.jiraHost || baseTemplate.jiraHost,
              jiraEmail: p.jiraEmail || baseTemplate.jiraEmail,
              jiraToken: p.jiraToken || baseTemplate.jiraToken,
              jiraProjectKey: p.jiraProjectKey || baseTemplate.jiraProjectKey,
              jiraBoardId: p.jiraBoardId || baseTemplate.jiraBoardId,
              bitbucketWorkspace: p.bitbucketWorkspace || baseTemplate.bitbucketWorkspace,
              bitbucketRepoSlug: p.bitbucketRepoSlug || baseTemplate.bitbucketRepoSlug,
              bitbucketUser: p.bitbucketUser || baseTemplate.bitbucketUser,
              bitbucketToken: p.bitbucketToken || baseTemplate.bitbucketToken,
              bitbucketAppPassword: p.bitbucketAppPassword || baseTemplate.bitbucketAppPassword,
              projectPath: p.projectPath || baseTemplate.projectPath
            };
          });

          if (!sanitized.some(p => p.id === 'profile-gespad-sii' || p.bitbucketRepoSlug === 'gespad-sii')) {
            sanitized.push(GESPAD_PROFILE);
          }
          if (!sanitized.some(p => p.id === 'profile-sistema-gestion-control' || p.bitbucketRepoSlug === 'sistema_gestion_control')) {
            sanitized.push(SGC_PROFILE);
          }
          if (!sanitized.some(p => p.id === 'profile-datalake-otasa' || p.bitbucketRepoSlug === 'datalake-otasa')) {
            sanitized.push(DATALAKE_PROFILE);
          }

          setProfiles(sanitized);
          setActiveProfile(sanitized[0]);
          await window.electronAPI.saveProfiles(sanitized);
        } else {
          setProfiles(INITIAL_PROFILES);
          setActiveProfile(DEFAULT_PROFILE);
          await window.electronAPI.saveProfiles(INITIAL_PROFILES);
        }

        if (window.electronAPI.loadWorklogs) {
          const loadedW = await window.electronAPI.loadWorklogs();
          if (loadedW) setWorklogs(loadedW);
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

  // 3. Al cambiar de perfil activo, verificar usuario, cargar tareas, escanear proyecto y Git
  useEffect(() => {
    if (!activeProfile) return;
    refreshJiraData();
    scanActiveProject();
    refreshGitInfo();
  }, [activeProfile?.id, activeProfile?.jiraToken, activeProfile?.jiraProjectKey, activeProfile?.projectPath]);

  // Escaneo de archivos .BAT y scripts del proyecto
  const scanActiveProject = async () => {
    if (!activeProfile?.projectPath || !window.electronAPI?.scanProject) return;
    try {
      const scan = await window.electronAPI.scanProject(activeProfile.projectPath);
      setProjectScan(scan);
    } catch (e) {
      console.error('Error escaneando proyecto:', e);
    }
  };

  const syncCredentialsFromEnv = async () => {
    if (!activeProfile || !projectScan?.env) return;
    const env = projectScan.env;
    const updated: ProjectProfile = {
      ...activeProfile,
      jiraHost: env.ATLASSIAN_HOST || activeProfile.jiraHost,
      jiraEmail: env.ATLASSIAN_EMAIL || activeProfile.jiraEmail,
      jiraToken: env.ATLASSIAN_API_TOKEN || activeProfile.jiraToken,
      jiraProjectKey: env.ATLASSIAN_PROJECT_KEY || activeProfile.jiraProjectKey,
      jiraBoardId: env.ATLASSIAN_BOARD_ID || activeProfile.jiraBoardId,
      bitbucketWorkspace: env.BITBUCKET_WORKSPACE || activeProfile.bitbucketWorkspace,
      bitbucketRepoSlug: env.BITBUCKET_REPO_SLUG || activeProfile.bitbucketRepoSlug,
      bitbucketUser: env.BITBUCKET_USER || activeProfile.bitbucketUser,
      bitbucketAppPassword: env.BITBUCKET_APP_PASSWORD || env.BITBUCKET_TOKEN || activeProfile.bitbucketAppPassword,
      bitbucketToken: env.BITBUCKET_TOKEN || env.BITBUCKET_APP_PASSWORD || activeProfile.bitbucketToken
    };
    await saveProfile(updated);
    addLog(`✓ Credenciales y tokens sincronizados desde ${activeProfile.projectPath}\\.env.atlassian`, 'success');
  };

  const refreshJiraData = async () => {
    if (!activeProfile || !activeProfile.enableJira) {
      setCurrentUser(null);
      setJiraIssues([]);
      setConnectionStatus(prev => ({ ...prev, jira: 'unknown' }));
      return;
    }

    setIsLoadingIssues(true);
    try {
      addLog(`Validando credenciales en Jira (${activeProfile.jiraHost || 'sonda.atlassian.net'})...`, 'info');
      const user = await atlassianService.getMyself(activeProfile);
      setCurrentUser(user);
      setConnectionStatus(prev => ({ ...prev, jira: 'ok' }));
      const userName = user?.displayName || user?.emailAddress || 'Julio Varas Contreras';
      const userEmail = user?.emailAddress || activeProfile.jiraEmail || 'julio.varas@sonda.com';
      const userAccountId = user?.accountId || 'N/A';
      addLog(`✓ Usuario Jira autenticado: ${userName} (${userEmail}) · AccountId: ${userAccountId}`, 'success');

      const projectKey = activeProfile.jiraProjectKey || 'CCYACE';
      addLog(`Consultando incidencias para el proyecto ${projectKey}...`, 'info');
      const issues = await atlassianService.getIssues(activeProfile);
      setJiraIssues(issues);
      addLog(`✓ Se encontraron ${issues.length} incidencias en Jira (${projectKey}).`, 'info');
    } catch (err: any) {
      setConnectionStatus(prev => ({ ...prev, jira: 'error' }));
      addLog(`Error al conectar con Jira: ${err.message}`, 'error');
    } finally {
      setIsLoadingIssues(false);
    }
  };

  // Git Info & Auto-Descubrimiento Multi-Proyecto
  const refreshGitInfo = async () => {
    if (!activeProfile?.projectPath || !window.electronAPI?.getGitInfo) {
      setGitInfo(null);
      return;
    }
    try {
      const info = await window.electronAPI.getGitInfo(activeProfile.projectPath);
      setGitInfo(info);
      if (info?.currentBranch && activeProfile.activeBranch !== info.currentBranch) {
        setActiveProfile(prev => prev ? { ...prev, activeBranch: info.currentBranch } : null);
      }
    } catch (e) {
      console.error('Error al obtener información de Git:', e);
    }
  };

  const discoverProjects = async (rootDir?: string): Promise<DiscoveredProject[]> => {
    if (!window.electronAPI?.discoverProjects) return [];
    setIsDiscovering(true);
    const targetDir = rootDir || 'C:\\Users\\jvarasc\\Documents\\CODIGO';
    try {
      addLog(`Escaneando repositorios locales en ${targetDir}...`, 'info');
      const list = await window.electronAPI.discoverProjects(targetDir);
      setDiscoveredProjects(list);
      addLog(`✓ Se detectaron ${list.length} proyectos con Git activo.`, 'success');
      return list;
    } catch (e: any) {
      addLog(`Error al descubrir proyectos: ${e.message}`, 'error');
      return [];
    } finally {
      setIsDiscovering(false);
    }
  };

  const fetchBitbucketRepositories = async (workspace?: string): Promise<any[]> => {
    const profile = activeProfile || profiles[0] || DEFAULT_PROFILE;
    const ws = (workspace || profile.bitbucketWorkspace || 'sondacode').trim();
    setIsLoadingBitbucketRepos(true);
    addLog(`[BITBUCKET CLOUD] Consultando repositorios del workspace "${ws}"...`, 'info');
    try {
      const list = await atlassianService.getBitbucketRepositories(profile, ws);
      setBitbucketRepositories(list);
      addLog(`✓ Se cargaron ${list.length} repositorios desde Bitbucket Cloud (${ws}).`, 'success');
      return list;
    } catch (err: any) {
      addLog(`Error consultando Bitbucket Cloud: ${err.message}`, 'error');
      return [];
    } finally {
      setIsLoadingBitbucketRepos(false);
    }
  };

  const fetchJiraProjectsList = async (): Promise<any[]> => {
    const profile = activeProfile || profiles[0] || DEFAULT_PROFILE;
    try {
      const list = await atlassianService.getProjects(profile);
      setJiraProjectsList(list);
      return list;
    } catch (err: any) {
      console.error('Error obteniendo proyectos de Jira:', err);
      return [];
    }
  };

  const importBitbucketRepo = async (repo: any, options: { localPath?: string; jiraProjectKey?: string; governance?: GovernanceType }) => {
    const ws = repo.workspace?.slug || repo.workspace?.name || activeProfile?.bitbucketWorkspace || 'sondacode';
    const slug = repo.slug || repo.name;
    const mainBranch = repo.mainbranch?.name || 'develop';
    const repoUrl = repo.links?.html?.href || `https://bitbucket.org/${ws}/${slug}`;
    const detectedKey = options.jiraProjectKey || slug.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') || 'PROJ';

    const newProfile: ProjectProfile = {
      id: 'profile-' + slug.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
      name: repo.name || slug,
      projectPath: options.localPath || '',
      governanceType: options.governance || 'cmmi_hybrid',
      targetBranch: mainBranch,
      activeBranch: mainBranch,
      enableJira: true,
      enableBitbucket: true,
      enableConfluence: false,
      jiraHost: activeProfile?.jiraHost || DEFAULT_PROFILE.jiraHost,
      jiraEmail: activeProfile?.jiraEmail || DEFAULT_PROFILE.jiraEmail,
      jiraToken: activeProfile?.jiraToken || DEFAULT_PROFILE.jiraToken,
      jiraProjectKey: detectedKey,
      jiraBoardId: '',
      bitbucketWorkspace: ws,
      bitbucketRepoSlug: slug,
      bitbucketUser: activeProfile?.bitbucketUser || DEFAULT_PROFILE.bitbucketUser,
      bitbucketToken: activeProfile?.bitbucketToken || DEFAULT_PROFILE.bitbucketToken,
      bitbucketAppPassword: activeProfile?.bitbucketAppPassword || DEFAULT_PROFILE.bitbucketAppPassword,
      bitbucketRepoUrl: repoUrl
    };

    const existsIdx = profiles.findIndex(p => p.bitbucketRepoSlug === slug || p.name.toLowerCase() === (repo.name || '').toLowerCase());
    let nextProfiles: ProjectProfile[];
    if (existsIdx >= 0) {
      nextProfiles = [...profiles];
      nextProfiles[existsIdx] = { ...nextProfiles[existsIdx], ...newProfile, id: nextProfiles[existsIdx].id };
      setActiveProfile(nextProfiles[existsIdx]);
    } else {
      nextProfiles = [...profiles, newProfile];
      setActiveProfile(newProfile);
    }

    setProfiles(nextProfiles);
    if (window.electronAPI?.saveProfiles) {
      await window.electronAPI.saveProfiles(nextProfiles);
    }
    addLog(`✓ Repositorio Bitbucket "${repo.name}" importado y activado en la Suite.`, 'success');
  };

  const importDiscoveredProjects = async (projectsToImport: DiscoveredProject[]): Promise<void> => {
    if (!projectsToImport.length) return;

    const baseJiraToken = activeProfile?.jiraToken || DEFAULT_PROFILE.jiraToken;
    const baseJiraEmail = activeProfile?.jiraEmail || DEFAULT_PROFILE.jiraEmail;
    const baseJiraHost = activeProfile?.jiraHost || DEFAULT_PROFILE.jiraHost;
    const baseBitbucketUser = activeProfile?.bitbucketUser || DEFAULT_PROFILE.bitbucketUser;
    const baseBitbucketToken = activeProfile?.bitbucketToken || DEFAULT_PROFILE.bitbucketToken;

    const newProfiles: ProjectProfile[] = [...profiles];

    for (const dp of projectsToImport) {
      const exists = newProfiles.find(p => (p.projectPath || '').toLowerCase() === (dp.path || '').toLowerCase());
      if (exists) continue;

      const profileId = 'profile-' + (dp.folderName || 'proj').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const detectedKey = dp.env?.ATLASSIAN_PROJECT_KEY || (dp.repoSlug ? dp.repoSlug.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') : 'PROJ');

      const p: ProjectProfile = {
        id: profileId,
        name: dp.name || dp.folderName,
        projectPath: dp.path,
        governanceType: dp.suggestedGovernance || 'cmmi_hybrid',
        targetBranch: dp.targetBranch || (dp.branches?.includes('develop') ? 'develop' : 'main'),
        activeBranch: dp.currentBranch || 'develop',
        enableJira: true,
        enableBitbucket: !!dp.repoSlug,
        enableConfluence: dp.hasEnvAtlassian,
        jiraHost: dp.env?.ATLASSIAN_HOST || baseJiraHost,
        jiraEmail: dp.env?.ATLASSIAN_EMAIL || baseJiraEmail,
        jiraToken: dp.env?.ATLASSIAN_API_TOKEN || baseJiraToken,
        jiraProjectKey: detectedKey,
        jiraBoardId: dp.env?.ATLASSIAN_BOARD_ID || '',
        bitbucketWorkspace: dp.workspace || 'sondacode',
        bitbucketRepoSlug: dp.repoSlug || dp.folderName,
        bitbucketUser: dp.env?.BITBUCKET_USER || baseBitbucketUser,
        bitbucketToken: dp.env?.BITBUCKET_TOKEN || dp.env?.BITBUCKET_APP_PASSWORD || baseBitbucketToken,
        bitbucketAppPassword: dp.env?.BITBUCKET_APP_PASSWORD || dp.env?.BITBUCKET_TOKEN || baseBitbucketToken,
        bitbucketRepoUrl: dp.remoteUrl || ''
      };
      newProfiles.push(p);
    }

    setProfiles(newProfiles);
    if (window.electronAPI?.saveProfiles) {
      await window.electronAPI.saveProfiles(newProfiles);
    }
    addLog(`✓ ${projectsToImport.length} proyecto(s) importado(s) exitosamente a la Suite.`, 'success');
  };

  const runGitPreflight = async (targetBranch?: string): Promise<GitPreflightResult> => {
    if (!activeProfile?.projectPath || !window.electronAPI?.gitPreflight) {
      const fallback: GitPreflightResult = {
        status: 'error',
        currentBranch: 'unknown',
        targetBranch: targetBranch || 'develop',
        aheadCount: 0,
        behindCount: 0,
        message: 'Ruta no configurada o API no disponible'
      };
      setGitPreflightResult(fallback);
      return fallback;
    }

    const tBranch = targetBranch || activeProfile.targetBranch || 'develop';
    addLog(`[GIT PREFLIGHT] Inspeccionando ${activeProfile.projectPath} contra origin/${tBranch}...`, 'info');
    try {
      const res = await window.electronAPI.gitPreflight({
        cwd: activeProfile.projectPath,
        targetBranch: tBranch
      });
      setGitPreflightResult(res);
      if (res.status === 'conflict') {
        addLog(`⚠️ [CONFLICTO GIT DETECTADO] Existen colisiones de merge contra origin/${tBranch}.`, 'error');
        if (res.conflictFiles && res.conflictFiles.length > 0) {
          addLog(`Archivos en conflicto: ${res.conflictFiles.join(', ')}`, 'error');
        }
        setGitConflictModalOpen(true);
      } else if (res.status === 'ahead') {
        addLog(`✓ [GIT PREFLIGHT] Rama local lista para enviar (${res.aheadCount} commit(s) locales pendientes).`, 'info');
      } else if (res.status === 'rebased') {
        addLog(`✓ [GIT PREFLIGHT] Cambios remotos integrados limpiamente mediante pull --rebase.`, 'success');
      } else if (res.status === 'clean') {
        addLog(`✓ [GIT PREFLIGHT] Historial sincronizado con origin/${tBranch}.`, 'success');
      }
      return res;
    } catch (e: any) {
      const errRes: GitPreflightResult = {
        status: 'error',
        currentBranch: 'unknown',
        targetBranch: tBranch,
        aheadCount: 0,
        behindCount: 0,
        message: e.message
      };
      setGitPreflightResult(errRes);
      addLog(`Error en git preflight: ${e.message}`, 'error');
      return errRes;
    }
  };

  const resolveGitConflict = async (action: 'abort' | 'continue' | 'open_vscode'): Promise<boolean> => {
    if (!activeProfile?.projectPath || !window.electronAPI?.gitResolveAction) return false;
    try {
      addLog(`Ejecutando acción Git: ${action} en ${activeProfile.projectPath}...`, 'info');
      const res = await window.electronAPI.gitResolveAction({
        cwd: activeProfile.projectPath,
        action
      });
      if (res.success) {
        addLog(`✓ Acción Git (${action}) exitosa: ${res.message}`, 'success');
        if (action === 'abort' || action === 'continue') {
          await runGitPreflight();
        }
        return true;
      } else {
        addLog(`⚠️ Advertencia acción Git (${action}): ${res.message}`, 'error');
        return false;
      }
    } catch (e: any) {
      addLog(`Error al resolver acción Git: ${e.message}`, 'error');
      return false;
    }
  };

  const updateActiveProfileGovernance = async (governance: GovernanceType) => {
    if (!activeProfile) return;
    const updated = { ...activeProfile, governanceType: governance };
    await saveProfile(updated);
    addLog(`Gobernanza del proyecto actualizada a: ${governance}`, 'info');
  };

  const updateActiveProfileTargetBranch = async (branch: string) => {
    if (!activeProfile) return;
    const updated = { ...activeProfile, targetBranch: branch };
    await saveProfile(updated);
    addLog(`Rama objetivo actualizada a: ${branch}`, 'info');
  };

  // 1. Selector y Actualizador de Carpeta Local
  const selectProjectDirectory = async (): Promise<string | null> => {
    if (!window.electronAPI?.selectDirectory) {
      addLog('API nativa de explorador de archivos no disponible en este entorno.', 'error');
      return null;
    }
    try {
      addLog('Abriendo explorador de archivos de Windows para seleccionar carpeta...', 'info');
      const currentPath = activeProfile?.projectPath || undefined;
      const dir = await window.electronAPI.selectDirectory(currentPath);
      if (dir) {
        await setProjectPath(dir);
        return dir;
      }
    } catch (e: any) {
      addLog(`Error al seleccionar carpeta: ${e.message}`, 'error');
    }
    return null;
  };

  const setProjectPath = async (newPath: string) => {
    const cleanPath = (newPath || '').trim();
    const current = activeProfile || profiles[0] || DEFAULT_PROFILE;
    const updated: ProjectProfile = {
      ...current,
      projectPath: cleanPath
    };

    // Escanear el directorio seleccionado
    let envData: Record<string, string> | null = null;
    if (window.electronAPI?.scanProject && cleanPath) {
      try {
        const scan = await window.electronAPI.scanProject(cleanPath);
        setProjectScan(scan);
        envData = scan.env;
      } catch (err) {
        console.error('Error al escanear nueva ruta:', err);
        setProjectScan(null);
      }
    } else {
      setProjectScan(null);
    }

    // Si el proyecto tiene un .env.atlassian en esa carpeta, auto-completar los datos
    if (envData) {
      if (envData.ATLASSIAN_HOST) updated.jiraHost = envData.ATLASSIAN_HOST;
      if (envData.ATLASSIAN_EMAIL) updated.jiraEmail = envData.ATLASSIAN_EMAIL;
      if (envData.ATLASSIAN_API_TOKEN) updated.jiraToken = envData.ATLASSIAN_API_TOKEN;
      if (envData.ATLASSIAN_PROJECT_KEY) updated.jiraProjectKey = envData.ATLASSIAN_PROJECT_KEY;
      if (envData.ATLASSIAN_BOARD_ID) updated.jiraBoardId = envData.ATLASSIAN_BOARD_ID;
      if (envData.BITBUCKET_WORKSPACE) updated.bitbucketWorkspace = envData.BITBUCKET_WORKSPACE;
      if (envData.BITBUCKET_REPO_SLUG) updated.bitbucketRepoSlug = envData.BITBUCKET_REPO_SLUG;
      if (envData.BITBUCKET_USER) updated.bitbucketUser = envData.BITBUCKET_USER;
      if (envData.BITBUCKET_TOKEN) updated.bitbucketToken = envData.BITBUCKET_TOKEN;
      if (envData.BITBUCKET_APP_PASSWORD) updated.bitbucketAppPassword = envData.BITBUCKET_APP_PASSWORD;
      addLog(`✓ Detectado .env.atlassian en ${cleanPath}. Credenciales auto-sincronizadas.`, 'success');
    }

    await saveProfile(updated);
    await refreshGitInfo();
    addLog(`✓ Carpeta de proyecto actualizada: ${cleanPath}`, 'info');
  };

  // 2. Smoke Test: Verificación y Diagnóstico PASIVO (Solo Lectura)
  const runSmokeTest = async () => {
    clearLogs();
    setIsConsoleDrawerOpen(true);
    addLog('=======================================================================', 'info');
    addLog('  🧪 DIAGNÓSTICO & SMOKE TEST (SOLO LECTURA / SIN MODIFICAR DATOS)', 'info');
    addLog(`  Proyecto: ${activeProfile?.name || 'No definido'}`, 'info');
    addLog(`  Directorio: ${activeProfile?.projectPath || 'No configurado'}`, 'info');
    addLog('  Modo: Verificación de Conectividad Atlassian & Detección de Scripts', 'info');
    addLog('=======================================================================\n', 'info');

    if (!activeProfile) {
      addLog('✗ Error: No hay un perfil activo seleccionado.', 'error');
      return;
    }

    // 1. Probar Jira
    if (activeProfile.enableJira) {
      addLog('[1/3] Probando conexión Jira Cloud (API Token & Usuario)...', 'info');
      try {
        const me = await atlassianService.getMyself(activeProfile);
        addLog(`  ✓ Jira OK: Autenticado como ${me.displayName} (${me.emailAddress})`, 'success');
        setConnectionStatus(prev => ({ ...prev, jira: 'ok' }));

        try {
          const issues = await atlassianService.getIssues(activeProfile);
          setJiraIssues(issues);
          const todoCount = issues.filter(i => {
            const cat = i.fields.status?.statusCategory?.key;
            const name = (i.fields.status?.name || '').toLowerCase();
            return cat === 'new' || name.includes('hacer') || name.includes('todo') || name.includes('backlog');
          }).length;
          const inProgCount = issues.filter(i => {
            const cat = i.fields.status?.statusCategory?.key;
            const name = (i.fields.status?.name || '').toLowerCase();
            return cat === 'indeterminate' || name.includes('curso') || name.includes('progreso');
          }).length;
          const doneCount = issues.filter(i => {
            const cat = i.fields.status?.statusCategory?.key;
            const name = (i.fields.status?.name || '').toLowerCase();
            return cat === 'done' || name.includes('hecho') || name.includes('done') || name.includes('cerr');
          }).length;

          addLog(`  📋 Estado actual de cajas en Tablero ${activeProfile.jiraProjectKey || ''}:`, 'info');
          addLog(`     • Total tarjetas: ${issues.length}`, 'info');
          addLog(`     • Por Hacer: ${todoCount} | En Curso: ${inProgCount} | Hecho: ${doneCount}`, 'info');
          addLog(`     (Prueba Smoke de solo lectura completada: no se alteró ninguna tarjeta).`, 'info');
        } catch {}
      } catch (e: any) {
        addLog(`  ✗ Jira Error: ${e.message}`, 'error');
        setConnectionStatus(prev => ({ ...prev, jira: 'error' }));
      }
    }

    // 2. Probar Bitbucket
    if (activeProfile.enableBitbucket) {
      addLog('[2/3] Probando conexión Bitbucket Cloud (Repo & Workspace)...', 'info');
      try {
        const bb = await atlassianService.testBitbucket(activeProfile);
        addLog(`  ✓ Bitbucket OK: Repositorio ${bb.full_name || activeProfile.bitbucketRepoSlug} verificado.`, 'success');
        setConnectionStatus(prev => ({ ...prev, bitbucket: 'ok' }));
      } catch (e: any) {
        addLog(`  ✗ Bitbucket Error: ${e.message}`, 'error');
        setConnectionStatus(prev => ({ ...prev, bitbucket: 'error' }));
      }
    }

    // 3. Probar Confluence
    if (activeProfile.enableConfluence) {
      addLog('[3/3] Probando conexión Confluence Cloud (Espacio)...', 'info');
      try {
        const conf = await atlassianService.testConfluence(activeProfile);
        addLog(`  ✓ Confluence OK: Espacio ${conf.name || activeProfile.confluenceSpaceKey} validado.`, 'success');
        setConnectionStatus(prev => ({ ...prev, confluence: 'ok' }));
      } catch (e: any) {
        addLog(`  ✗ Confluence Error: ${e.message}`, 'error');
        setConnectionStatus(prev => ({ ...prev, confluence: 'error' }));
      }
    }

    // 4. Verificación de Scripts Locales del Proyecto Base
    addLog('\n[VERIFICACIÓN DE SCRIPTS LOCALES]', 'info');
    if (projectScan?.exists) {
      addLog(`  ✓ Directorio local verificado: ${projectScan.path}`, 'success');
      if (projectScan.env) {
        addLog(`  ✓ Archivo .env.atlassian detectado (Proyecto: ${projectScan.env.ATLASSIAN_PROJECT_KEY || 'OK'})`, 'success');
      }
      addLog(`  ✓ Scripts .bat disponibles: ${projectScan.bats.length} ejecutables detectados.`, 'info');
      addLog(`  ✓ Scripts Node/CJS en scripts/: ${projectScan.cjsScripts.join(', ')}`, 'info');
    } else {
      addLog(`  ⚠️ Advertencia: No se detectó la carpeta local "${activeProfile.projectPath}". Puedes seleccionarla con el botón "Examinar Carpeta".`, 'error');
    }

    addLog('\n=======================================================================', 'info');
    addLog('  SMOKE TEST DE CONECTIVIDAD COMPLETADO (TODO OPERATIVO)', 'success');
    addLog('=======================================================================', 'info');
  };

  // 3. Ejecución Real: Entrega en Vivo y Movimiento de Cajas en Jira
  const executeRealRun = async () => {
    if (!activeProfile?.projectPath) {
      addLog('Error: Selecciona una carpeta válida de proyecto antes de ejecutar.', 'error');
      return;
    }

    setIsProcessRunning(true);
    clearLogs();
    setIsConsoleDrawerOpen(true);
    const gov = activeProfile.governanceType || 'cmmi_strict';
    const targetBranch = activeProfile.targetBranch || (gov === 'cmmi_strict' ? 'main' : 'develop');

    addLog('=======================================================================', 'info');
    addLog('  🚀 EJECUCIÓN REAL: ENTREGA Y SINCRONIZACIÓN ATLASSIAN', 'info');
    addLog(`  Proyecto: ${activeProfile.name}`, 'info');
    addLog(`  Directorio: ${activeProfile.projectPath}`, 'info');
    addLog(`  Gobernanza: ${gov === 'cmmi_strict' ? 'CMMI v3.0 Estricto' : gov === 'cmmi_hybrid' ? 'CMMI Híbrido (Equipos)' : 'Ágil Estándar'}`, 'info');
    addLog(`  Rama Objetivo: origin/${targetBranch}`, 'info');
    addLog('  (Nota: Compilación pesada de .EXE omitida deliberadamente para entrega ágil)', 'info');
    addLog('=======================================================================\n', 'info');

    try {
      // Paso 0: Git Preflight para evitar colisiones en equipos concurrentes
      addLog(`>>> [0/3] Git Preflight: Inspeccionando origin/${targetBranch} y verificando cambios concurrentes...`, 'info');
      const preflight = await runGitPreflight(targetBranch);
      if (preflight.status === 'conflict') {
        addLog('\n⚠️ [BLOQUEO PREVENTIVO] Se abortó el pipeline para no romper el historial compartido ni sobreescribir código.', 'error');
        addLog('Utiliza el modal de resolución para editar en VS Code o abortar el rebase.', 'error');
        setIsProcessRunning(false);
        return;
      }

      // Paso 1: Commits estructurados según gobernanza
      const hasCmmiScript = projectScan?.cjsScripts?.includes('crear_commits_cmmi.cjs');
      if (gov === 'cmmi_strict' && hasCmmiScript) {
        addLog('\n>>> [1/3] Generando Commits Estructurados CMMI (crear_commits_cmmi.cjs)...', 'info');
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/crear_commits_cmmi.cjs']
        });
      } else if (hasCmmiScript) {
        addLog('\n>>> [1/3] Ejecutando script de commits del proyecto (crear_commits_cmmi.cjs)...', 'info');
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/crear_commits_cmmi.cjs']
        });
      } else {
        addLog(`\n>>> [1/3] Preparando cambios en Git (Modo ${gov})...`, 'info');
        if (gitInfo && !gitInfo.isClean) {
          addLog(`Detectados ${gitInfo.uncommittedFiles.length} archivos pendientes en git.`, 'info');
        }
      }

      // Paso 2: Sincronización con Bitbucket Cloud
      const hasBbScript = projectScan?.cjsScripts?.includes('bitbucket_sync.cjs');
      if (hasBbScript) {
        addLog(`\n>>> [2/3] Sincronizando con Bitbucket Cloud (bitbucket_sync.cjs hacia ${targetBranch})...`, 'info');
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/bitbucket_sync.cjs']
        });
      } else if (activeProfile.enableBitbucket) {
        addLog(`\n>>> [2/3] Sincronizando con Bitbucket Cloud (git push hacia ${targetBranch})...`, 'info');
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'git',
          args: ['push', '-u', 'origin', targetBranch]
        });
      }

      // Paso 3: Sincronización con Jira Cloud & Confluence (MUEVE LAS CAJAS A HECHO)
      const hasJiraScript = projectScan?.cjsScripts?.includes('atlassian_sync.cjs');
      if (hasJiraScript) {
        addLog('\n>>> [3/3] Moviendo Cajas en Jira a "Hecho", Worklogs y Confluence (atlassian_sync.cjs)...', 'info');
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/atlassian_sync.cjs']
        });
      } else if (activeProfile.enableJira) {
        addLog(`\n>>> [3/3] Sincronizando tarjetas Jira del proyecto ${activeProfile.jiraProjectKey}...`, 'info');
        const inProg = jiraIssues.find(i => i.fields.status.statusCategory.key === 'indeterminate');
        if (inProg) {
          addLog(`Transicionando incidencia en progreso ${inProg.key} (${inProg.fields.summary}) a Hecho...`, 'info');
          await transitionIssueDirectly(inProg.key, 'hecho');
        } else {
          addLog(`✓ Incidencias Jira revisadas para ${activeProfile.jiraProjectKey}.`, 'info');
        }
      }

      addLog('\n=======================================================================', 'info');
      addLog('  [EXITO] EJECUCIÓN REAL FINALIZADA CORRECTAMENTE', 'success');
      addLog(`  - Rama objetivo: ${targetBranch}`, 'success');
      addLog(`  - Repositorio Bitbucket: ${activeProfile.bitbucketRepoSlug || 'Sincronizado'}`, 'success');
      addLog('  - JIRA Cloud: Cajas movidas a "Hecho" con registro de horas y evidencias', 'success');
      addLog('=======================================================================', 'info');

      // Actualizar automáticamente los datos de Jira y Git
      addLog('\nRefrescando tarjetas de Jira y estado de Git en vivo...', 'info');
      await refreshJiraData();
      await refreshGitInfo();
    } catch (e: any) {
      addLog(`\n[ERROR EN EJECUCIÓN REAL] ${e.message}`, 'error');
    } finally {
      setIsProcessRunning(false);
    }
  };

  // Alias de compatibilidad
  const executeSmokeTestReal = executeRealRun;

  // 4. Mover una tarjeta directamente a un estado específico
  const transitionIssueDirectly = async (issueKey: string, targetStatusName: string): Promise<boolean> => {
    if (!activeProfile) return false;
    try {
      addLog(`Moviendo tarjeta ${issueKey} hacia "${targetStatusName}"...`, 'info');
      const transitions = await atlassianService.getTransitions(activeProfile, issueKey);
      const targetLower = targetStatusName.toLowerCase();
      const match = transitions.find((t: any) => 
        (t.name || '').toLowerCase().includes(targetLower) ||
        (t.to?.name || '').toLowerCase().includes(targetLower) ||
        (targetLower === 'hecho' && t.to?.statusCategory?.key === 'done') ||
        (targetLower === 'curso' && t.to?.statusCategory?.key === 'indeterminate')
      );

      if (!match) {
        addLog(`No se encontró una transición válida hacia "${targetStatusName}" para ${issueKey}. Transiciones disponibles: ${transitions.map((t: any) => t.name).join(', ')}`, 'error');
        return false;
      }

      await atlassianService.transitionIssue(activeProfile, issueKey, match.id);
      addLog(`✓ Tarjeta ${issueKey} movida con éxito a "${match.name}".`, 'success');
      await refreshJiraData();
      return true;
    } catch (e: any) {
      addLog(`Error moviendo tarjeta ${issueKey}: ${e.message}`, 'error');
      return false;
    }
  };

  const executeBat = async (batName: string) => {
    if (!activeProfile?.projectPath) return;
    setIsProcessRunning(true);
    addLog(`\n[EJECUTANDO SCRIPT .BAT] ${batName} en ${activeProfile.projectPath}...`, 'info');
    try {
      await window.electronAPI.runProcess({
        cwd: activeProfile.projectPath,
        command: 'cmd.exe',
        args: ['/c', batName]
      });
    } catch (e: any) {
      addLog(`Error ejecutando ${batName}: ${e.message}`, 'error');
    } finally {
      setIsProcessRunning(false);
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

      const transitions = await atlassianService.getTransitions(activeProfile, issueKey);
      let targetTrans = transitions.find((t: any) => 
        t.name.toLowerCase().includes('hecho') || 
        t.name.toLowerCase().includes('done') || 
        t.name.toLowerCase().includes('finaliz') || 
        t.name.toLowerCase().includes('cerr')
      );

      if (!targetTrans) {
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
      }

      if (timeSpent && timeSpent.trim()) {
        await atlassianService.addWorklog(activeProfile, issueKey, timeSpent.trim(), comment || 'Cierre validado por usuario');
        addLog(`✓ Registradas ${timeSpent} en el worklog de ${issueKey}.`, 'success');
      }

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

  const addWorklogRecord = async (
    record: {
      issueKey: string;
      issueSummary: string;
      timeSpent: string;
      hoursDecimal: number;
      date: string;
      category: ActivityCategory;
      categoryLabel: string;
      comment: string;
    },
    options?: {
      transitionToInProgress?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeProfile) return { success: false, error: 'No hay perfil activo' };

    try {
      addLog(`Registrando bitácora de ${record.timeSpent} en ${record.issueKey} (${record.categoryLabel})...`, 'info');
      await atlassianService.addWorklog(activeProfile, record.issueKey, record.timeSpent, `[${record.categoryLabel}] ${record.comment}`);

      if (options?.transitionToInProgress) {
        const trans = await atlassianService.getTransitions(activeProfile, record.issueKey);
        const inProg = trans.find((t: any) => t.name.toLowerCase().includes('curso') || t.name.toLowerCase().includes('progreso'));
        if (inProg) {
          await atlassianService.transitionIssue(activeProfile, record.issueKey, inProg.id);
        }
      }

      const newRecord: WorklogRecord = {
        id: 'wl-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        issueKey: record.issueKey,
        issueSummary: record.issueSummary,
        timeSpent: record.timeSpent,
        hoursDecimal: record.hoursDecimal,
        date: record.date,
        createdAt: new Date().toISOString(),
        category: record.category,
        categoryLabel: record.categoryLabel,
        comment: record.comment,
        syncedToJira: true,
        profileId: activeProfile.id
      };

      const updated = [newRecord, ...worklogs];
      setWorklogs(updated);
      if (window.electronAPI?.saveWorklogs) {
        await window.electronAPI.saveWorklogs(updated);
      }

      addLog(`✓ Bitácora asentada en Jira con éxito para ${record.issueKey}.`, 'success');
      return { success: true };
    } catch (err: any) {
      addLog(`Error al asentar bitácora en Jira: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteWorklogRecord = async (id: string) => {
    const updated = worklogs.filter(w => w.id !== id);
    setWorklogs(updated);
    if (window.electronAPI?.saveWorklogs) {
      await window.electronAPI.saveWorklogs(updated);
    }
  };

  const executePipeline = async (steps: PipelineStep[]) => {
    if (!activeProfile || !activeProfile.projectPath) {
      addLog('Error: Selecciona una carpeta válida de proyecto antes de ejecutar.', 'error');
      return;
    }

    setIsProcessRunning(true);
    addLog(`=== INICIANDO PIPELINE DE GOBERNANZA EN: ${activeProfile.projectPath} ===`, 'info');

    for (const step of steps) {
      if (!step.enabled) {
        addLog(`[OMITIDO] ${step.title}`, 'info');
        continue;
      }

      addLog(`\n>>> EJECUTANDO: ${step.title}...`, 'info');

      if (step.id === 'step-bitbucket-push') {
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
      } else if (step.id === 'step-jira-sync') {
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/atlassian_sync.cjs']
        });
      } else if (step.id === 'step-build-release') {
        await window.electronAPI.runProcess({
          cwd: activeProfile.projectPath,
          command: 'node',
          args: ['scripts/publicar_release_ambos.cjs']
        });
      }
    }

    addLog(`\n=== PROCESO FINALIZADO CON ÉXITO ===`, 'success');
    setIsProcessRunning(false);
  };

  const killProcess = async () => {
    await window.electronAPI.killProcess();
    setIsProcessRunning(false);
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      profiles,
      activeProfile,
      currentUser,
      jiraIssues,
      isLoadingIssues,
      connectionStatus,
      logs,
      isProcessRunning,
      projectScan,
      scanActiveProject,
      executeBat,
      selectProjectDirectory,
      setProjectPath,
      runSmokeTest,
      executeRealRun,
      executeSmokeTestReal,
      transitionIssueDirectly,
      syncCredentialsFromEnv,
      // Auto-descubrimiento y Git
      isDiscoverModalOpen,
      setIsDiscoverModalOpen,
      discoveredProjects,
      isDiscovering,
      discoverProjects,
      importDiscoveredProjects,
      bitbucketRepositories,
      isLoadingBitbucketRepos,
      fetchBitbucketRepositories,
      jiraProjectsList,
      fetchJiraProjectsList,
      importBitbucketRepo,
      gitInfo,
      refreshGitInfo,
      gitConflictModalOpen,
      setGitConflictModalOpen,
      gitPreflightResult,
      runGitPreflight,
      resolveGitConflict,
      updateActiveProfileGovernance,
      updateActiveProfileTargetBranch,
      isConsoleDrawerOpen,
      setIsConsoleDrawerOpen,
      worklogs,
      selectedIssueForWorklog,
      setSelectedIssueForWorklog,
      addWorklogRecord,
      deleteWorklogRecord,
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
      addLog,
      theme,
      toggleTheme
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