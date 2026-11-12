export type GovernanceType = 'cmmi_strict' | 'cmmi_hybrid' | 'agile_standard';

export interface ProjectProfile {
  id: string;
  name: string;
  projectPath: string; // Ruta local del código en disco
  
  // Gobernanza y Metodología
  governanceType?: GovernanceType; // 'cmmi_strict' | 'cmmi_hybrid' | 'agile_standard'
  targetBranch?: string;           // ej: 'develop' o 'main'
  activeBranch?: string;           // Rama activa detectada en disco
  
  // Módulos activos decididos por el usuario (nada forzado)
  enableJira: boolean;
  enableBitbucket: boolean;
  enableConfluence: boolean;

  // Jira Cloud
  jiraHost: string; // ej: sonda.atlassian.net
  jiraEmail: string;
  jiraToken: string;
  jiraProjectKey: string; // ej: CCYACE o GES
  jiraBoardId: string;    // ej: 6013
  jiraProjectUrl?: string; // Modo backup
  jiraBoardUrl?: string;   // Modo backup

  // Bitbucket Cloud
  bitbucketWorkspace: string; // ej: sondacode
  bitbucketRepoSlug: string;  // ej: cotizador-claude-corporativo o gespad-sii
  bitbucketUser: string;
  bitbucketAppPassword?: string;
  bitbucketToken?: string;
  bitbucketRepoUrl?: string;  // Modo backup / URL manual

  // Confluence Cloud
  confluenceHost?: string;
  confluenceSpaceKey?: string;
  confluenceUrl?: string;     // URL manual
  confluenceToken?: string;
}

export interface DiscoveredProject {
  name: string;
  folderName: string;
  path: string;
  hasGit: boolean;
  currentBranch: string;
  branches: string[];
  remoteUrl: string;
  workspace: string;
  repoSlug: string;
  hasEnvAtlassian: boolean;
  env: Record<string, string> | null;
  hasPackageJson: boolean;
  packageDescription: string;
  targetBranch: string;
  suggestedGovernance: GovernanceType;
  isAlreadyAdded?: boolean;
}

export interface GitInfo {
  currentBranch: string;
  branches: string[];
  targetBranch: string;
  isClean: boolean;
  uncommittedFiles: string[];
  recentCommits: Array<{ hash: string; message: string; author?: string }>;
}

export interface GitPreflightResult {
  status: 'clean' | 'ahead' | 'behind' | 'rebased' | 'conflict' | 'error';
  currentBranch: string;
  targetBranch: string;
  aheadCount: number;
  behindCount: number;
  conflictFiles?: string[];
  message: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    issuetype: {
      id: string;
      name: string;
      subtask: boolean;
    };
    status: {
      id: string;
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    assignee?: JiraUser | null;
    priority?: {
      id: string;
      name: string;
    };
    timeoriginalestimate?: number; // en segundos
    timespent?: number;           // en segundos
    labels?: string[];
    duedate?: string;
  };
}

export type ActivityCategory = 
  | 'analysis'
  | 'architecture'
  | 'development'
  | 'code_review'
  | 'testing'
  | 'documentation'
  | 'release';

export interface WorklogRecord {
  id: string;
  profileId: string;
  issueKey: string;
  issueSummary: string;
  timeSpent: string;
  hoursDecimal: number;
  date: string;
  category: ActivityCategory;
  categoryLabel: string;
  comment: string;
  syncedToJira: boolean;
  createdAt: string;
}

export interface WorklogEntry {
  id?: string;
  issueKey: string;
  timeSpent: string; // ej: "4h", "2h 30m"
  started?: string;
  comment: string;
  evidence?: string;
}

export interface PipelineStep {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'success' | 'error';
  command?: string;
  args?: string[];
}

export interface LogMessage {
  id: string;
  timestamp: string;
  text: string;
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'success';
}

declare global {
  interface Window {
    electronAPI: {
      jiraRequest: (payload: { host: string; email: string; token: string; path: string; method?: string; data?: any }) => Promise<{ status: number; data: any }>;
      bitbucketRequest: (payload: { user?: string; appPassword?: string; token?: string; path: string; method?: string; data?: any }) => Promise<{ status: number; data: any }>;
      confluenceRequest: (payload: { host: string; email: string; token: string; path: string; method?: string; data?: any }) => Promise<{ status: number; data: any }>;
      
      loadProfiles: () => Promise<ProjectProfile[]>;
      saveProfiles: (profiles: ProjectProfile[]) => Promise<boolean>;
      loadWorklogs: () => Promise<WorklogRecord[]>;
      saveWorklogs: (worklogs: WorklogRecord[]) => Promise<boolean>;
      selectDirectory: (defaultPath?: string) => Promise<string | null>;
      scanProject: (dirPath: string) => Promise<any>;
      
      // Auto-descubrimiento multi-proyecto y Git
      discoverProjects: (rootDir?: string) => Promise<DiscoveredProject[]>;
      getGitInfo: (cwd: string) => Promise<GitInfo>;
      gitPreflight: (payload: { cwd: string; targetBranch?: string }) => Promise<GitPreflightResult>;
      gitResolveAction: (payload: { cwd: string; action: 'abort' | 'continue' | 'open_vscode' }) => Promise<{ success: boolean; message: string }>;
      
      runProcess: (payload: { cwd: string; command: string; args: string[] }) => Promise<{ code: number; error?: string }>;
      killProcess: () => Promise<boolean>;
      
      onProcessLog: (callback: (data: { text: string; type: 'stdout' | 'stderr' | 'info' | 'error' | 'success' }) => void) => () => void;
      onProcessExit: (callback: (code: number) => void) => () => void;
    };
  }
}
