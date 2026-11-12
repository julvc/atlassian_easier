import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  jiraRequest: (payload: any) => ipcRenderer.invoke('jira:request', payload),
  bitbucketRequest: (payload: any) => ipcRenderer.invoke('bitbucket:request', payload),
  confluenceRequest: (payload: any) => ipcRenderer.invoke('confluence:request', payload),
  
  loadProfiles: () => ipcRenderer.invoke('profiles:load'),
  saveProfiles: (profiles: any) => ipcRenderer.invoke('profiles:save', profiles),
  loadWorklogs: () => ipcRenderer.invoke('worklogs:load'),
  saveWorklogs: (worklogs: any) => ipcRenderer.invoke('worklogs:save', worklogs),
  selectDirectory: (defaultPath?: string) => ipcRenderer.invoke('dialog:selectDirectory', defaultPath),
  scanProject: (dirPath: string) => ipcRenderer.invoke('project:scan', dirPath),
  
  discoverProjects: (rootDir?: string) => ipcRenderer.invoke('projects:discover', rootDir),
  getGitInfo: (cwd: string) => ipcRenderer.invoke('git:info', cwd),
  gitPreflight: (payload: { cwd: string; targetBranch?: string }) => ipcRenderer.invoke('git:preflight', payload),
  gitResolveAction: (payload: { cwd: string; action: 'abort' | 'continue' | 'open_vscode' }) => ipcRenderer.invoke('git:resolve-action', payload),
  
  runProcess: (payload: { cwd: string, command: string, args: string[] }) => ipcRenderer.invoke('runner:start', payload),
  killProcess: () => ipcRenderer.invoke('runner:kill'),
  
  onProcessLog: (callback: (data: { text: string, type: 'stdout' | 'stderr' | 'info' | 'error' | 'success' }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('runner:log', handler);
    return () => ipcRenderer.removeListener('runner:log', handler);
  },
  onProcessExit: (callback: (code: number) => void) => {
    const handler = (_event: any, code: number) => callback(code);
    ipcRenderer.on('runner:exit', handler);
    return () => ipcRenderer.removeListener('runner:exit', handler);
  }
});
