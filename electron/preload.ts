import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  jiraRequest: (payload: any) => ipcRenderer.invoke('jira:request', payload),
  bitbucketRequest: (payload: any) => ipcRenderer.invoke('bitbucket:request', payload),
  confluenceRequest: (payload: any) => ipcRenderer.invoke('confluence:request', payload),
  
  loadProfiles: () => ipcRenderer.invoke('profiles:load'),
  saveProfiles: (profiles: any) => ipcRenderer.invoke('profiles:save', profiles),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  
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
