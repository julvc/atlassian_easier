import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let currentChildProcess: ChildProcess | null = null;

const PROFILES_PATH = path.join(app.getPath('userData'), 'atlassian_suite_profiles.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'SONDA - Atlassian Pipeline & Governance Suite',
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// 1. HTTP HTTPS CLIENTS FOR ATLASSIAN APIS
// ==========================================

function makeHttpsRequest(options: https.RequestOptions, postData?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          if (body) json = JSON.parse(body);
        } catch {
          json = { raw: body };
        }

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: json });
        } else {
          const errMsg = json?.errorMessages?.join(', ') || json?.message || (json?.errors ? JSON.stringify(json.errors) : `HTTP ${res.statusCode}: ${body.substring(0, 120)}`);
          reject(new Error(errMsg));
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// Jira IPC Handler
ipcMain.handle('jira:request', async (_event, payload: { host: string; email: string; token: string; path: string; method?: string; data?: any }) => {
  const host = (payload.host || 'sonda.atlassian.net').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${payload.email.trim()}:${payload.token.trim()}`).toString('base64');
  
  const options: https.RequestOptions = {
    hostname: host,
    port: 443,
    path: payload.path,
    method: payload.method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'SONDA-Atlassian-Suite-Desktop/1.0'
    }
  };

  return makeHttpsRequest(options, payload.data);
});

// Bitbucket IPC Handler
ipcMain.handle('bitbucket:request', async (_event, payload: { user?: string; appPassword?: string; token?: string; path: string; method?: string; data?: any }) => {
  let authHeader = '';
  if (payload.token) {
    authHeader = `Bearer ${payload.token.trim()}`;
  } else if (payload.user && payload.appPassword) {
    authHeader = 'Basic ' + Buffer.from(`${payload.user.trim()}:${payload.appPassword.trim()}`).toString('base64');
  }

  const options: https.RequestOptions = {
    hostname: 'api.bitbucket.org',
    port: 443,
    path: payload.path,
    method: payload.method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'SONDA-Atlassian-Suite-Desktop/1.0'
    }
  };

  return makeHttpsRequest(options, payload.data);
});

// Confluence IPC Handler
ipcMain.handle('confluence:request', async (_event, payload: { host: string; email: string; token: string; path: string; method?: string; data?: any }) => {
  const host = (payload.host || 'sonda.atlassian.net').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${payload.email.trim()}:${payload.token.trim()}`).toString('base64');

  const options: https.RequestOptions = {
    hostname: host,
    port: 443,
    path: payload.path,
    method: payload.method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'SONDA-Atlassian-Suite-Desktop/1.0'
    }
  };

  return makeHttpsRequest(options, payload.data);
});

// ==========================================
// 2. PROFILES PERSISTENCE
// ==========================================

ipcMain.handle('profiles:load', async () => {
  try {
    if (fs.existsSync(PROFILES_PATH)) {
      const data = fs.readFileSync(PROFILES_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error cargando perfiles:', err);
  }
  return [];
});

ipcMain.handle('profiles:save', async (_event, profiles: any) => {
  try {
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error guardando perfiles:', err);
    return false;
  }
});

// ==========================================
// 3. DIALOG DIRECTORY SELECTOR
// ==========================================

ipcMain.handle('dialog:selectDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar Carpeta del Proyecto'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// ==========================================
// 4. PROCESS RUNNER (SPAWN CON STREAMING)
// ==========================================

ipcMain.handle('runner:start', async (_event, payload: { cwd: string; command: string; args: string[] }) => {
  if (currentChildProcess) {
    try {
      currentChildProcess.kill();
    } catch {}
    currentChildProcess = null;
  }

  const { cwd, command, args } = payload;
  const isWindows = process.platform === 'win32';

  return new Promise((resolve) => {
    try {
      const proc = spawn(command, args, {
        cwd: cwd && fs.existsSync(cwd) ? cwd : process.cwd(),
        shell: isWindows,
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      currentChildProcess = proc;

      mainWindow?.webContents.send('runner:log', {
        text: `[INICIO] Ejecutando: ${command} ${args.join(' ')}\n[DIRECTORIO] ${cwd}\n--------------------------------------------------\n`,
        type: 'info'
      });

      proc.stdout.on('data', (data) => {
        mainWindow?.webContents.send('runner:log', {
          text: data.toString(),
          type: 'stdout'
        });
      });

      proc.stderr.on('data', (data) => {
        mainWindow?.webContents.send('runner:log', {
          text: data.toString(),
          type: 'stderr'
        });
      });

      proc.on('close', (code) => {
        currentChildProcess = null;
        mainWindow?.webContents.send('runner:exit', code || 0);
        mainWindow?.webContents.send('runner:log', {
          text: `\n--------------------------------------------------\n[FIN] Proceso terminado con código: ${code}\n`,
          type: code === 0 ? 'success' : 'error'
        });
        resolve({ code });
      });

      proc.on('error', (err) => {
        currentChildProcess = null;
        mainWindow?.webContents.send('runner:log', {
          text: `[ERROR EXEC] ${err.message}\n`,
          type: 'error'
        });
        mainWindow?.webContents.send('runner:exit', 1);
        resolve({ code: 1, error: err.message });
      });
    } catch (err: any) {
      mainWindow?.webContents.send('runner:log', {
        text: `[ERROR] No se pudo lanzar el proceso: ${err.message}\n`,
        type: 'error'
      });
      resolve({ code: 1, error: err.message });
    }
  });
});

ipcMain.handle('runner:kill', async () => {
  if (currentChildProcess) {
    try {
      currentChildProcess.kill();
      mainWindow?.webContents.send('runner:log', {
        text: '\n[CANCELADO] Proceso abortado por el usuario.\n',
        type: 'error'
      });
      currentChildProcess = null;
      return true;
    } catch {
      return false;
    }
  }
  return false;
});
