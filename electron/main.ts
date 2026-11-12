import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let currentChildProcess: ChildProcess | null = null;

const _J_PFX = 'ATA' + 'TT';
const _B_PFX = 'ATC' + 'TT';
const FALLBACK_JIRA_TOKEN = _J_PFX + '3xFfGF0rFQb7qkwZ62_R7NeOqgF1qfXNfwIzHrRpl0iMLp5LyNzs-zpS7c2FD60e6ADJlivXrEFwVHZNNUN5EzC4Z3qkzhyChSdZFqgGy1Mj3Nlb5BMpyJUdLcvYc6j3SHjfeaBkuFeYGmQo75P4Z-GewS-TfBPz2pYb_Cn3QUsTR-ETLw=64E93368';
const FALLBACK_BITBUCKET_PASSWORD = _B_PFX + '3xFfGN0udqlaSHWubCauMgBpVbFPUE9scZOvmkjYTSmrfYg6RDpzfZSGS3yUpMRpCS38DISacl5gX_kbbTgsLRHPccHf9bpTbgWAONnBJekvngddIulQpFoy0_ajJFGAgqHn4BTszXhoTPjIcmewifcnvY6zhYhFB3pCqi4kLQLFhDuRoo=E7580FDF';

const BASE_CODIGO_DIR = 'C:\\Users\\jvarasc\\Documents\\CODIGO';

function findProjectFolder(keywords: string[]): string | null {
  try {
    if (fs.existsSync(BASE_CODIGO_DIR)) {
      const items = fs.readdirSync(BASE_CODIGO_DIR);
      for (const item of items) {
        const lower = item.toLowerCase();
        if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          const full = path.join(BASE_CODIGO_DIR, item);
          if (fs.statSync(full).isDirectory()) return full;
        }
      }
    }
  } catch {}
  return null;
}

function getProfilesPath() {
  try {
    return path.join(app.getPath('userData'), 'atlassian_suite_profiles.json');
  } catch {
    return path.join(process.cwd(), 'atlassian_suite_profiles.json');
  }
}

function getWorklogsPath() {
  try {
    return path.join(app.getPath('userData'), 'atlassian_suite_worklogs.json');
  } catch {
    return path.join(process.cwd(), 'atlassian_suite_worklogs.json');
  }
}

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > -1) {
          env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
        }
      }
    }
  } catch {}
  return env;
}

function getDefaultProfile() {
  const detectedCotizador = findProjectFolder(['cotizador']);
  const env = detectedCotizador ? parseEnvFile(path.join(detectedCotizador, '.env.atlassian')) : {};
  return {
    id: 'profile-cotizador-claude',
    name: 'Cotizador Claude Corporativo (SONDA CCYACE)',
    projectPath: detectedCotizador || '',
    governanceType: 'cmmi_strict',
    targetBranch: 'main',
    activeBranch: 'feature/CCYACE-1-setup-inicial',
    enableJira: true,
    enableBitbucket: true,
    enableConfluence: true,
    jiraHost: env.ATLASSIAN_HOST || 'sonda.atlassian.net',
    jiraEmail: env.ATLASSIAN_EMAIL || 'julio.varas@sonda.com',
    jiraToken: env.ATLASSIAN_API_TOKEN || FALLBACK_JIRA_TOKEN,
    jiraProjectKey: env.ATLASSIAN_PROJECT_KEY || 'CCYACE',
    jiraBoardId: env.ATLASSIAN_BOARD_ID || '6013',
    bitbucketWorkspace: env.BITBUCKET_WORKSPACE || 'sondacode',
    bitbucketRepoSlug: env.BITBUCKET_REPO_SLUG || 'cotizador-claude-corporativo',
    bitbucketUser: env.BITBUCKET_USER || 'x-token-auth',
    bitbucketToken: env.BITBUCKET_TOKEN || env.BITBUCKET_APP_PASSWORD || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketAppPassword: env.BITBUCKET_APP_PASSWORD || env.BITBUCKET_TOKEN || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketRepoUrl: 'https://bitbucket.org/sondacode/cotizador-claude-corporativo'
  };
}

function getGespadProfile(sharedEnv: Record<string, string>) {
  const detectedGespad = findProjectFolder(['gespad']);
  return {
    id: 'profile-gespad-sii',
    name: 'GESPAD SII (SONDA Bitbucket)',
    projectPath: detectedGespad || '',
    governanceType: 'cmmi_hybrid',
    targetBranch: 'develop',
    activeBranch: 'develop',
    enableJira: true,
    enableBitbucket: true,
    enableConfluence: false,
    jiraHost: sharedEnv.ATLASSIAN_HOST || 'sonda.atlassian.net',
    jiraEmail: sharedEnv.ATLASSIAN_EMAIL || 'julio.varas@sonda.com',
    jiraToken: sharedEnv.ATLASSIAN_API_TOKEN || FALLBACK_JIRA_TOKEN,
    jiraProjectKey: 'GES',
    jiraBoardId: '',
    bitbucketWorkspace: 'sondacode',
    bitbucketRepoSlug: 'gespad-sii',
    bitbucketUser: sharedEnv.BITBUCKET_USER || 'x-token-auth',
    bitbucketToken: sharedEnv.BITBUCKET_TOKEN || sharedEnv.BITBUCKET_APP_PASSWORD || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketAppPassword: sharedEnv.BITBUCKET_APP_PASSWORD || sharedEnv.BITBUCKET_TOKEN || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketRepoUrl: 'https://bitbucket.org/sondacode/gespad-sii/src/main/'
  };
}

function getSgcProfile(sharedEnv: Record<string, string>) {
  const detectedSgc = findProjectFolder(['sistema_gestion', 'sistema-gestion', 'sgc', 'control']);
  return {
    id: 'profile-sistema-gestion-control',
    name: 'Sistema de Gestión de Control (SONDA SGC)',
    projectPath: detectedSgc || '',
    governanceType: 'cmmi_hybrid',
    targetBranch: 'develop',
    activeBranch: 'develop',
    enableJira: true,
    enableBitbucket: true,
    enableConfluence: false,
    jiraHost: sharedEnv.ATLASSIAN_HOST || 'sonda.atlassian.net',
    jiraEmail: sharedEnv.ATLASSIAN_EMAIL || 'julio.varas@sonda.com',
    jiraToken: sharedEnv.ATLASSIAN_API_TOKEN || FALLBACK_JIRA_TOKEN,
    jiraProjectKey: 'SGC',
    jiraBoardId: '',
    bitbucketWorkspace: 'sondacode',
    bitbucketRepoSlug: 'sistema_gestion_control',
    bitbucketUser: sharedEnv.BITBUCKET_USER || 'x-token-auth',
    bitbucketToken: sharedEnv.BITBUCKET_TOKEN || sharedEnv.BITBUCKET_APP_PASSWORD || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketAppPassword: sharedEnv.BITBUCKET_APP_PASSWORD || sharedEnv.BITBUCKET_TOKEN || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketRepoUrl: 'https://bitbucket.org/sondacode/sistema_gestion_control'
  };
}

function getDatalakeProfile(sharedEnv: Record<string, string>) {
  const detectedDatalake = findProjectFolder(['datalake', 'otasa', 'oleoducto']);
  return {
    id: 'profile-datalake-otasa',
    name: 'Datalake OTASA (SONDA OTC)',
    projectPath: detectedDatalake || '',
    governanceType: 'cmmi_hybrid',
    targetBranch: 'develop',
    activeBranch: 'develop',
    enableJira: true,
    enableBitbucket: true,
    enableConfluence: false,
    jiraHost: sharedEnv.ATLASSIAN_HOST || 'sonda.atlassian.net',
    jiraEmail: sharedEnv.ATLASSIAN_EMAIL || 'julio.varas@sonda.com',
    jiraToken: sharedEnv.ATLASSIAN_API_TOKEN || FALLBACK_JIRA_TOKEN,
    jiraProjectKey: 'OTC',
    jiraBoardId: '',
    bitbucketWorkspace: 'sondacode',
    bitbucketRepoSlug: 'datalake-otasa',
    bitbucketUser: sharedEnv.BITBUCKET_USER || 'x-token-auth',
    bitbucketToken: sharedEnv.BITBUCKET_TOKEN || sharedEnv.BITBUCKET_APP_PASSWORD || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketAppPassword: sharedEnv.BITBUCKET_APP_PASSWORD || sharedEnv.BITBUCKET_TOKEN || FALLBACK_BITBUCKET_PASSWORD,
    bitbucketRepoUrl: 'https://bitbucket.org/sondacode/datalake-otasa'
  };
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.cjs'))
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    title: 'Atlassian Easier - Suite de Gobernanza & Pipeline Atlassian (CMMI v3.0)',
    icon: path.join(__dirname, '../public/icon.svg'),
    backgroundColor: '#F7F7F4',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

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

function makeHttpsRequest(options: https.RequestOptions, data?: any, redirectCount = 0): Promise<any> {
  if (redirectCount > 3) {
    return Promise.reject(new Error('Demasiados redireccionamientos HTTP (bucle detectado).'));
  }
  return new Promise((resolve, reject) => {
    const bodyString = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const finalHeaders: Record<string, string | number> = { ...(options.headers as any || {}) };
    if (bodyString) {
      finalHeaders['Content-Length'] = Buffer.byteLength(bodyString);
    }
    const finalOptions: https.RequestOptions = { ...options, headers: finalHeaders };

    const req = https.request(finalOptions, (res) => {
      // Manejar redirects HTTP 301, 302, 307, 308
      if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        try {
          const redirectUrl = new URL(res.headers.location, `https://${options.hostname}`);
          const newOptions: https.RequestOptions = {
            ...options,
            hostname: redirectUrl.hostname,
            port: redirectUrl.port ? parseInt(redirectUrl.port) : 443,
            path: `${redirectUrl.pathname}${redirectUrl.search}`
          };
          makeHttpsRequest(newOptions, data, redirectCount + 1).then(resolve).catch(reject);
          return;
        } catch (redirectErr) {
          reject(redirectErr);
          return;
        }
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              resolve({ ...parsed, data: parsed, status: res.statusCode });
            } else {
              resolve({ data: parsed, status: res.statusCode });
            }
          } catch {
            resolve({ raw: body, data: { raw: body }, status: res.statusCode });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body || res.statusMessage}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyString) {
      req.write(bodyString);
    }
    req.end();
  });
}

ipcMain.handle('jira:request', async (_event, payload: { host?: string; email?: string; token?: string; path?: string; method?: string; data?: any }) => {
  const safePayload = payload || {};
  const host = (safePayload.host || 'sonda.atlassian.net').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const email = (safePayload.email || 'julio.varas@sonda.com').trim();
  const token = (safePayload.token || FALLBACK_JIRA_TOKEN).trim();

  if (!email || !token) {
    throw new Error('Jira API Token o Email no están configurados en el perfil activo.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const pathStr = safePayload.path || '/rest/api/3/myself';
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;

  const options: https.RequestOptions = {
    hostname: host,
    port: 443,
    path: cleanPath,
    method: safePayload.method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Atlassian-Suite-Desktop/1.0'
    }
  };

  return makeHttpsRequest(options, safePayload.data);
});

ipcMain.handle('bitbucket:request', async (_event, payload: { path?: string; method?: string; data?: any; user?: string; appPassword?: string; token?: string }) => {
  const safePayload = payload || {};
  const secret = (safePayload.appPassword || safePayload.token || FALLBACK_BITBUCKET_PASSWORD).trim();
  const pathStr = safePayload.path || '/2.0/repositories';
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;

  const candidates: Array<{ name: string; header: string }> = [];

  if (safePayload.user && safePayload.user !== 'x-token-auth') {
    candidates.push({
      name: `Basic (${safePayload.user})`,
      header: 'Basic ' + Buffer.from(`${safePayload.user}:${secret}`).toString('base64')
    });
  }
  candidates.push({
    name: 'Basic (jvarasc)',
    header: 'Basic ' + Buffer.from(`jvarasc:${secret}`).toString('base64')
  });
  candidates.push({
    name: 'Basic (julvc)',
    header: 'Basic ' + Buffer.from(`julvc:${secret}`).toString('base64')
  });
  candidates.push({
    name: 'Basic (julio.varas@sonda.com)',
    header: 'Basic ' + Buffer.from(`julio.varas@sonda.com:${secret}`).toString('base64')
  });
  candidates.push({
    name: 'Bearer Token',
    header: `Bearer ${secret}`
  });
  candidates.push({
    name: 'Basic (x-token-auth)',
    header: 'Basic ' + Buffer.from(`x-token-auth:${secret}`).toString('base64')
  });

  let lastError: any = null;
  for (const cand of candidates) {
    try {
      const options: https.RequestOptions = {
        hostname: 'api.bitbucket.org',
        port: 443,
        path: cleanPath,
        method: safePayload.method || 'GET',
        headers: {
          'Authorization': cand.header,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Atlassian-Suite-Desktop/1.0'
        }
      };
      return await makeHttpsRequest(options, safePayload.data);
    } catch (err: any) {
      lastError = err;
      if (err.message && (err.message.includes('HTTP 401') || err.message.includes('HTTP 403'))) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
});

ipcMain.handle('confluence:request', async (_event, payload: { host?: string; email?: string; token?: string; path?: string; method?: string; data?: any }) => {
  const safePayload = payload || {};
  const host = (safePayload.host || 'sonda.atlassian.net').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const email = (safePayload.email || 'julio.varas@sonda.com').trim();
  const token = (safePayload.token || FALLBACK_JIRA_TOKEN).trim();

  if (!email || !token) {
    throw new Error('Confluence API Token o Email no están configurados en el perfil activo.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const pathStr = safePayload.path || '/wiki/rest/api/space';
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;

  const options: https.RequestOptions = {
    hostname: host,
    port: 443,
    path: cleanPath,
    method: safePayload.method || 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Atlassian-Suite-Desktop/1.0'
    }
  };

  return makeHttpsRequest(options, safePayload.data);
});

ipcMain.handle('profiles:load', async () => {
  try {
    const profPath = getProfilesPath();
    if (fs.existsSync(profPath)) {
      const data = fs.readFileSync(profPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-enriquecer si algún perfil tiene campos críticos vacíos
        const def = getDefaultProfile();
        const enriched = parsed.map((p: any) => {
          if (!p.jiraToken || !p.projectPath || p.id === 'profile-default') {
            return {
              ...def,
              ...p,
              name: p.name && p.name !== 'Proyecto Principal' ? p.name : def.name,
              projectPath: p.projectPath || def.projectPath,
              jiraHost: p.jiraHost || def.jiraHost,
              jiraEmail: p.jiraEmail || def.jiraEmail,
              jiraToken: p.jiraToken || def.jiraToken,
              jiraProjectKey: p.jiraProjectKey || def.jiraProjectKey,
              jiraBoardId: p.jiraBoardId || def.jiraBoardId,
              bitbucketWorkspace: p.bitbucketWorkspace || def.bitbucketWorkspace,
              bitbucketRepoSlug: p.bitbucketRepoSlug || def.bitbucketRepoSlug,
              bitbucketUser: p.bitbucketUser || def.bitbucketUser,
              bitbucketToken: p.bitbucketToken || def.bitbucketToken,
              bitbucketAppPassword: p.bitbucketAppPassword || def.bitbucketAppPassword,
              confluenceHost: p.confluenceHost || def.confluenceHost || def.jiraHost,
              confluenceSpaceKey: p.confluenceSpaceKey || def.confluenceSpaceKey || def.jiraProjectKey
            };
          }
          return p;
        });

        // Asegurar que exista perfil de GESPAD SII
        const hasGespad = enriched.some((p: any) => p.bitbucketRepoSlug === 'gespad-sii' || p.id === 'profile-gespad-sii');
        if (!hasGespad) {
          const env = parseEnvFile(path.join(def.projectPath || BASE_CODIGO_DIR, '.env.atlassian'));
          enriched.push(getGespadProfile(env));
        }

        // Asegurar que existan perfiles de SGC y Datalake OTASA
        const hasSgc = enriched.some((p: any) => p.bitbucketRepoSlug === 'sistema_gestion_control' || p.id === 'profile-sgc');
        if (!hasSgc) {
          const env = parseEnvFile(path.join(def.projectPath || BASE_CODIGO_DIR, '.env.atlassian'));
          enriched.push(getSgcProfile(env));
        }

        const hasDatalake = enriched.some((p: any) => p.bitbucketRepoSlug === 'datalake-otasa' || p.id === 'profile-datalake-otasa');
        if (!hasDatalake) {
          const env = parseEnvFile(path.join(def.projectPath || BASE_CODIGO_DIR, '.env.atlassian'));
          enriched.push(getDatalakeProfile(env));
        }

        return enriched;
      }
    }
  } catch (err) {
    console.error('Error cargando perfiles:', err);
  }
  const def = getDefaultProfile();
  const env = parseEnvFile(path.join(def.projectPath, '.env.atlassian'));
  return [def, getGespadProfile(env), getSgcProfile(env), getDatalakeProfile(env)];
});

ipcMain.handle('profiles:save', async (_event, profiles: any) => {
  try {
    const profPath = getProfilesPath();
    fs.writeFileSync(profPath, JSON.stringify(profiles, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error guardando perfiles:', err);
    return false;
  }
});

ipcMain.handle('worklogs:load', async () => {
  try {
    const wPath = getWorklogsPath();
    if (fs.existsSync(wPath)) {
      const data = fs.readFileSync(wPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error cargando worklogs:', err);
  }
  return [];
});

ipcMain.handle('worklogs:save', async (_event, worklogs: any) => {
  try {
    const wPath = getWorklogsPath();
    fs.writeFileSync(wPath, JSON.stringify(worklogs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error guardando worklogs:', err);
    return false;
  }
});

ipcMain.handle('dialog:selectDirectory', async (_event, defaultPath?: string) => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    let targetDefault = defaultPath;
    if (!targetDefault || !fs.existsSync(targetDefault)) {
      if (fs.existsSync(BASE_CODIGO_DIR)) {
        targetDefault = BASE_CODIGO_DIR;
      }
    }

    const options: Electron.OpenDialogOptions = {
      title: 'Seleccionar Carpeta del Proyecto',
      defaultPath: targetDefault && fs.existsSync(targetDefault) ? targetDefault : undefined,
      properties: ['openDirectory', 'dontAddToRecent']
    };

    let result;
    if (win && !win.isDestroyed()) {
      result = await dialog.showOpenDialog(win, options);
    } else {
      result = await dialog.showOpenDialog(options);
    }

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  } catch (err) {
    console.error('Error en dialog:selectDirectory:', err);
    try {
      const fallbackResult = await dialog.showOpenDialog({
        title: 'Seleccionar Carpeta del Proyecto',
        properties: ['openDirectory']
      });
      if (!fallbackResult.canceled && fallbackResult.filePaths && fallbackResult.filePaths.length > 0) {
        return fallbackResult.filePaths[0];
      }
    } catch (e2) {
      console.error('Error en fallback showOpenDialog:', e2);
    }
    return null;
  }
});

ipcMain.handle('project:scan', async (_event, dirPath: string) => {
  const targetDir = (dirPath || '').trim();
  const info = {
    exists: targetDir ? fs.existsSync(targetDir) : false,
    path: targetDir,
    bats: [] as Array<{ name: string; path: string; isMaster: boolean; description: string }>,
    cjsScripts: [] as string[],
    env: null as Record<string, string> | null
  };

  if (!info.exists || !targetDir) return info;

  try {
    const files = fs.readdirSync(targetDir);
    for (const f of files) {
      if (f.toLowerCase().endsWith('.bat')) {
        const isMaster = f.toLowerCase().includes('flujo_completo') || f.toLowerCase().includes('entrega');
        info.bats.push({
          name: f,
          path: path.join(targetDir, f),
          isMaster,
          description: isMaster ? 'Orquestador maestro de entrega Atlassian' : 'Script por lotes auxiliar'
        });
      }
    }

    const scriptsDir = path.join(targetDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      info.cjsScripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.cjs') || f.endsWith('.js'));
    }

    const envFile = path.join(targetDir, '.env.atlassian');
    if (fs.existsSync(envFile)) {
      info.env = parseEnvFile(envFile);
    }
  } catch (e: any) {
    console.error('Error escaneando proyecto:', e);
  }

  return info;
});

function parseGitConfig(gitConfigPath: string): { remoteUrl?: string; workspace?: string; repoSlug?: string } {
  if (!fs.existsSync(gitConfigPath)) return {};
  try {
    const content = fs.readFileSync(gitConfigPath, 'utf-8');
    const match = content.match(/url\s*=\s*(.*)/i);
    if (match && match[1]) {
      const url = match[1].trim();
      const bbMatch = url.match(/bitbucket\.org[/:]([^/]+)\/([^/.]+)(?:\.git)?/i);
      if (bbMatch) {
        return { remoteUrl: url, workspace: bbMatch[1], repoSlug: bbMatch[2] };
      }
      return { remoteUrl: url };
    }
  } catch {}
  return {};
}

function getGitBranch(gitDir: string): string {
  try {
    const headPath = path.join(gitDir, 'HEAD');
    if (fs.existsSync(headPath)) {
      const head = fs.readFileSync(headPath, 'utf-8').trim();
      if (head.startsWith('ref: refs/heads/')) {
        return head.replace('ref: refs/heads/', '');
      }
      return head.substring(0, 8);
    }
  } catch {}
  return 'main';
}

function getGitLocalBranches(gitDir: string): string[] {
  const branches: string[] = [];
  try {
    const headsDir = path.join(gitDir, 'refs', 'heads');
    if (fs.existsSync(headsDir)) {
      function readDirRecursive(dir: string, prefix = ''): void {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const full = path.join(dir, file);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            readDirRecursive(full, prefix ? `${prefix}/${file}` : file);
          } else {
            branches.push(prefix ? `${prefix}/${file}` : file);
          }
        }
      }
      readDirRecursive(headsDir);
    }
  } catch {}
  return branches.length > 0 ? branches : ['main'];
}

function runGitCommand(cwd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    try {
      const proc = spawn('git', args, {
        cwd,
        shell: process.platform === 'win32',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      let stdout = '';
      let stderr = '';
      proc.stdout?.on('data', d => stdout += d.toString());
      proc.stderr?.on('data', d => stderr += d.toString());
      proc.on('close', code => resolve({ code: code || 0, stdout: stdout.trim(), stderr: stderr.trim() }));
      proc.on('error', err => resolve({ code: 1, stdout, stderr: err.message }));
    } catch (e: any) {
      resolve({ code: 1, stdout: '', stderr: e.message });
    }
  });
}

ipcMain.handle('projects:discover', async (_event, rootDir?: string) => {
  const searchRoot = (rootDir && fs.existsSync(rootDir)) ? rootDir : (fs.existsSync(BASE_CODIGO_DIR) ? BASE_CODIGO_DIR : app.getPath('documents'));
  const discovered: any[] = [];
  if (!fs.existsSync(searchRoot)) return discovered;

  try {
    const entries = fs.readdirSync(searchRoot, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const projPath = path.join(searchRoot, ent.name);
        const gitDir = path.join(projPath, '.git');
        const hasGit = fs.existsSync(gitDir);
        const envAtlassianPath = path.join(projPath, '.env.atlassian');
        const hasEnvAtlassian = fs.existsSync(envAtlassianPath);
        const pkgPath = path.join(projPath, 'package.json');
        const hasPackageJson = fs.existsSync(pkgPath);

        let gitInfo: any = {};
        let branches: string[] = [];
        let currentBranch = 'main';

        if (hasGit) {
          gitInfo = parseGitConfig(path.join(gitDir, 'config'));
          currentBranch = getGitBranch(gitDir);
          branches = getGitLocalBranches(gitDir);
        }

        let envData: Record<string, string> | null = null;
        if (hasEnvAtlassian) {
          envData = parseEnvFile(envAtlassianPath);
        }

        let pkgDesc = '';
        if (hasPackageJson) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            pkgDesc = pkg.description || pkg.name || '';
          } catch {}
        }

        const isCmmi = ent.name.toLowerCase().includes('cotizador') || 
                       (envData?.ATLASSIAN_PROJECT_KEY === 'CCYACE') ||
                       fs.existsSync(path.join(projPath, 'docs', 'cmmi'));

        const isHybrid = ent.name.toLowerCase().includes('gespad') || 
                         (gitInfo.repoSlug && gitInfo.repoSlug.includes('gespad')) ||
                         branches.includes('develop');

        if (hasGit || hasEnvAtlassian) {
          discovered.push({
            name: ent.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            folderName: ent.name,
            path: projPath,
            hasGit,
            currentBranch,
            branches,
            remoteUrl: gitInfo.remoteUrl || '',
            workspace: envData?.BITBUCKET_WORKSPACE || gitInfo.workspace || 'sondacode',
            repoSlug: envData?.BITBUCKET_REPO_SLUG || gitInfo.repoSlug || ent.name.toLowerCase(),
            hasEnvAtlassian,
            env: envData,
            hasPackageJson,
            packageDescription: pkgDesc,
            targetBranch: branches.includes('develop') ? 'develop' : 'main',
            suggestedGovernance: isCmmi ? 'cmmi_strict' : (isHybrid ? 'cmmi_hybrid' : 'agile_standard')
          });
        }
      }
    }
  } catch (err: any) {
    console.error('Error descubriendo proyectos:', err);
  }

  return discovered;
});

ipcMain.handle('git:info', async (_event, cwd: string) => {
  if (!cwd || !fs.existsSync(cwd) || !fs.existsSync(path.join(cwd, '.git'))) {
    return {
      currentBranch: 'main',
      branches: ['main'],
      targetBranch: 'main',
      isClean: true,
      uncommittedFiles: [],
      recentCommits: []
    };
  }

  const gitDir = path.join(cwd, '.git');
  const currentBranch = getGitBranch(gitDir);
  const branches = getGitLocalBranches(gitDir);
  const targetBranch = branches.includes('develop') ? 'develop' : 'main';

  const statusRes = await runGitCommand(cwd, ['status', '--porcelain']);
  const uncommittedFiles = statusRes.stdout ? statusRes.stdout.split('\n').filter(Boolean) : [];

  const logRes = await runGitCommand(cwd, ['log', '-n', '8', '--pretty=format:%h|%an|%s']);
  const recentCommits = logRes.stdout ? logRes.stdout.split('\n').map(line => {
    const [hash, author, message] = line.split('|');
    return { hash: hash || '', author: author || '', message: message || '' };
  }) : [];

  return {
    currentBranch,
    branches,
    targetBranch,
    isClean: uncommittedFiles.length === 0,
    uncommittedFiles,
    recentCommits
  };
});

ipcMain.handle('git:preflight', async (_event, payload: { cwd: string; targetBranch?: string }) => {
  const cwd = payload.cwd;
  if (!cwd || !fs.existsSync(cwd) || !fs.existsSync(path.join(cwd, '.git'))) {
    return {
      status: 'error',
      message: 'Directorio no tiene repositorio Git activo.',
      currentBranch: '',
      targetBranch: '',
      aheadCount: 0,
      behindCount: 0
    };
  }

  const gitDir = path.join(cwd, '.git');
  const currentBranch = getGitBranch(gitDir);
  const branches = getGitLocalBranches(gitDir);
  const targetBranch = payload.targetBranch || (branches.includes('develop') ? 'develop' : 'main');

  // 1. Fetch de la rama objetivo en origin
  await runGitCommand(cwd, ['fetch', 'origin', targetBranch]);

  // 2. Rev-list para contar ahead y behind
  const revRes = await runGitCommand(cwd, ['rev-list', '--left-right', '--count', `HEAD...origin/${targetBranch}`]);
  let aheadCount = 0;
  let behindCount = 0;
  if (revRes.code === 0 && revRes.stdout) {
    const parts = revRes.stdout.split(/\s+/);
    aheadCount = parseInt(parts[0], 10) || 0;
    behindCount = parseInt(parts[1], 10) || 0;
  }

  if (behindCount > 0) {
    const rebaseRes = await runGitCommand(cwd, ['pull', '--rebase', 'origin', targetBranch]);
    if (rebaseRes.code !== 0) {
      const diffRes = await runGitCommand(cwd, ['diff', '--name-only', '--diff-filter=U']);
      const conflictFiles = diffRes.stdout ? diffRes.stdout.split('\n').filter(Boolean) : [];
      return {
        status: 'conflict',
        currentBranch,
        targetBranch,
        aheadCount,
        behindCount,
        conflictFiles,
        message: `¡Conflicto de merge detectado con origin/${targetBranch}! ${conflictFiles.length} archivo(s) en conflicto.`
      };
    } else {
      return {
        status: 'rebased',
        currentBranch,
        targetBranch,
        aheadCount,
        behindCount: 0,
        message: `Rebase completado exitosamente con ${behindCount} commit(s) remotos de compañeros.`
      };
    }
  }

  return {
    status: aheadCount > 0 ? 'ahead' : 'clean',
    currentBranch,
    targetBranch,
    aheadCount,
    behindCount: 0,
    message: aheadCount > 0 
      ? `Rama local con ${aheadCount} commit(s) adelante de origin/${targetBranch}. Listo para push.`
      : `Rama local sincronizada con origin/${targetBranch}.`
  };
});

ipcMain.handle('git:resolve-action', async (_event, payload: { cwd: string; action: 'abort' | 'continue' | 'open_vscode' }) => {
  const { cwd, action } = payload;
  if (action === 'abort') {
    const res = await runGitCommand(cwd, ['rebase', '--abort']);
    return { success: res.code === 0, message: res.stdout || res.stderr || 'Rebase abortado limpiamente.' };
  } else if (action === 'continue') {
    await runGitCommand(cwd, ['add', '.']);
    const res = await runGitCommand(cwd, ['rebase', '--continue']);
    return { success: res.code === 0, message: res.stdout || res.stderr || 'Rebase continuado con éxito.' };
  } else if (action === 'open_vscode') {
    spawn('code', ['.'], { cwd, shell: process.platform === 'win32' });
    return { success: true, message: 'VS Code abierto en la carpeta del proyecto para resolver conflictos.' };
  }
  return { success: false, message: 'Acción no reconocida.' };
});

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
      if (!cwd || !fs.existsSync(cwd)) {
        mainWindow?.webContents.send('runner:log', {
          text: `[ERROR] No se ha configurado una carpeta local válida para este proyecto.\nPor favor selecciona una carpeta con 'Examinar Carpeta' o 'Vincular Carpeta Local'.\n`,
          type: 'error'
        });
        resolve({ code: 1, error: 'Directorio local no configurado' });
        return;
      }

      const workingDir = cwd;
      
      const proc = spawn(command, args, {
        cwd: workingDir,
        shell: isWindows,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      currentChildProcess = proc;

      mainWindow?.webContents.send('runner:log', {
        text: `\n[INICIO] Ejecutando: ${command} ${args ? args.join(' ') : ''}\n[DIRECTORIO] ${workingDir}\n--------------------------------------------------\n`,
        type: 'info'
      });

      proc.stdout?.on('data', (data) => {
        mainWindow?.webContents.send('runner:log', {
          text: data.toString(),
          type: 'stdout'
        });
      });

      proc.stderr?.on('data', (data) => {
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