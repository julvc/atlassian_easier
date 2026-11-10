export interface ProjectProfile {
  id: string;
  name: string;
  projectPath: string; // Ruta local del código en disco
  
  // Módulos activos decididos por el usuario (nada forzado)
  enableJira: boolean;
  enableBitbucket: boolean;
  enableConfluence: boolean;

  // Jira Cloud
  jiraHost: string; // ej: sonda.atlassian.net
  jiraEmail: string;
  jiraToken: string;
  jiraProjectKey: string; // ej: CCYACE
  jiraBoardId: string;    // ej: 6013
  jiraProjectUrl?: string; // Modo backup
  jiraBoardUrl?: string;   // Modo backup

  // Bitbucket Cloud
  bitbucketWorkspace: string; // ej: sondacode
  bitbucketRepoSlug: string;  // ej: cotizador-claude-corporativo
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
      selectDirectory: () => Promise<string | null>;
      
      runProcess: (payload: { cwd: string; command: string; args: string[] }) => Promise<{ code: number; error?: string }>;
      killProcess: () => Promise<boolean>;
      
      onProcessLog: (callback: (data: { text: string; type: 'stdout' | 'stderr' | 'info' | 'error' | 'success' }) => void) => () => void;
      onProcessExit: (callback: (code: number) => void) => () => void;
    };
  }
}
