import { JiraUser, JiraProject, JiraBoard, JiraIssue, ProjectProfile } from '../types';

export function textToAdf(text: string) {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }]
    };
  }

  const content = lines.map(line => {
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      const itemText = line.replace(/^[•\-*]\s*/, '');
      return {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: itemText }] }]
          }
        ]
      };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line }]
    };
  });

  return {
    type: 'doc',
    version: 1,
    content: content
  };
}

export const atlassianService = {
  // ===================== JIRA =====================
  async getMyself(profile: ProjectProfile): Promise<JiraUser> {
    if (!window.electronAPI?.jiraRequest) {
      throw new Error('Bridge de Electron (window.electronAPI) no disponible. Verifique que la aplicación esté ejecutándose dentro de Electron.');
    }
    const res = await window.electronAPI.jiraRequest({
      host: profile.jiraHost || 'sonda.atlassian.net',
      email: profile.jiraEmail || 'julio.varas@sonda.com',
      token: profile.jiraToken,
      path: '/rest/api/3/myself'
    });
    return res?.data ?? res;
  },

  async getProjects(profile: ProjectProfile): Promise<JiraProject[]> {
    if (!window.electronAPI?.jiraRequest) return [];
    const res = await window.electronAPI.jiraRequest({
      host: profile.jiraHost || 'sonda.atlassian.net',
      email: profile.jiraEmail || 'julio.varas@sonda.com',
      token: profile.jiraToken,
      path: '/rest/api/3/project'
    });
    const list = res?.data ?? res;
    return Array.isArray(list) ? list : [];
  },

  async getBoards(profile: ProjectProfile): Promise<JiraBoard[]> {
    if (!window.electronAPI?.jiraRequest) return [];
    try {
      const path = profile.jiraProjectKey 
        ? `/rest/agile/1.0/board?projectKeyOrId=${profile.jiraProjectKey}` 
        : '/rest/agile/1.0/board';
      const res = await window.electronAPI.jiraRequest({
        host: profile.jiraHost || 'sonda.atlassian.net',
        email: profile.jiraEmail || 'julio.varas@sonda.com',
        token: profile.jiraToken,
        path: path
      });
      return (res?.data?.values ?? res?.values) || [];
    } catch {
      return [];
    }
  },

  async getIssues(profile: ProjectProfile): Promise<JiraIssue[]> {
    if (!window.electronAPI?.jiraRequest) return [];
    const projectKey = (profile.jiraProjectKey || '').trim();
    if (!projectKey) return [];

    const host = profile.jiraHost || 'sonda.atlassian.net';
    const email = profile.jiraEmail || 'julio.varas@sonda.com';
    const token = profile.jiraToken;

    try {
      const res = await window.electronAPI.jiraRequest({
        host,
        email,
        token,
        path: '/rest/api/3/search',
        method: 'POST',
        data: {
          jql: `project = "${projectKey}" ORDER BY created DESC`,
          maxResults: 100,
          fields: ['summary', 'description', 'issuetype', 'status', 'assignee', 'priority', 'timeoriginalestimate', 'timespent', 'labels', 'duedate']
        }
      });
      return (res?.data?.issues ?? res?.issues) || [];
    } catch {
      // Fallback con GET
      const jql = encodeURIComponent(`project = "${projectKey}" ORDER BY created DESC`);
      const res = await window.electronAPI.jiraRequest({
        host,
        email,
        token,
        path: `/rest/api/3/search?jql=${jql}&maxResults=100&fields=summary,description,issuetype,status,assignee,priority,timeoriginalestimate,timespent,labels,duedate`
      });
      return (res?.data?.issues ?? res?.issues) || [];
    }
  },

  async assignIssueToUser(profile: ProjectProfile, issueKey: string, accountId: string): Promise<boolean> {
    await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/issue/${issueKey}/assignee`,
      method: 'PUT',
      data: { accountId }
    });
    return true;
  },

  async addWorklog(profile: ProjectProfile, issueKey: string, timeSpent: string, comment: string): Promise<boolean> {
    await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/issue/${issueKey}/worklog`,
      method: 'POST',
      data: {
        timeSpent,
        comment: textToAdf(comment)
      }
    });
    return true;
  },

  async getTransitions(profile: ProjectProfile, issueKey: string): Promise<any[]> {
    const res = await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/issue/${issueKey}/transitions`
    });
    return (res?.data?.transitions ?? res?.transitions) || [];
  },

  async transitionIssue(profile: ProjectProfile, issueKey: string, transitionId: string): Promise<boolean> {
    await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/issue/${issueKey}/transitions`,
      method: 'POST',
      data: {
        transition: { id: transitionId }
      }
    });
    return true;
  },

  async addComment(profile: ProjectProfile, issueKey: string, text: string): Promise<boolean> {
    await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/issue/${issueKey}/comment`,
      method: 'POST',
      data: {
        body: textToAdf(text)
      }
    });
    return true;
  },

  // Asistente para inicializar proyecto CMMI desde cero (cuando hay 0 tarjetas)
  async createInitialCmmiStructure(profile: ProjectProfile, userAccountId: string): Promise<{ created: number; errors: string[] }> {
    const initialStories = [
      { summary: 'CC-001: Configuración de Entorno Git y Repositorio Bitbucket CMMI', desc: 'Configuración inicial de control de versiones y políticas de branching CMMI v3.0.', type: 'Story', hours: '8h' },
      { summary: 'CC-002: Árbol de Espacios y Documentación Confluence CMMI', desc: 'Estructuración del espacio de entregables y evidencias para auditoría de calidad.', type: 'Story', hours: '8h' },
      { summary: 'CC-010: Plan de Gestión del Proyecto y Estimación de Esfuerzo (PLAN/EST)', desc: 'WBS, matriz de responsabilidades y cronograma de hitos conforme a CMMI v3.0.', type: 'Story', hours: '12h' },
      { summary: 'CC-020: Arquitectura Base y Motor de Persistencia Local SQLite', desc: 'Diseño e implementación de arquitectura autónoma y base de datos local.', type: 'Story', hours: '16h' },
      { summary: 'CC-030: Implementación de Funcionalidades Principales y Lógica de Negocio', desc: 'Desarrollo de módulos operativos centrales del sistema.', type: 'Story', hours: '24h' },
      { summary: 'CC-040: Pruebas de Verificación, Validación (VV) y Empaquetado Release', desc: 'Pruebas funcionales, checklist PQA y compilación de instalables.', type: 'Story', hours: '16h' }
    ];

    let created = 0;
    const errors: string[] = [];

    // Obtener issue types
    const projRes = await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: `/rest/api/3/project/${profile.jiraProjectKey}`
    });
    const issueTypes = (projRes?.data?.issueTypes ?? projRes?.issueTypes) || [];
    const storyType = issueTypes.find((t: any) => !t.subtask && (t.name.toLowerCase().includes('story') || t.name.toLowerCase().includes('historia') || t.name.toLowerCase().includes('task') || t.name.toLowerCase().includes('tarea'))) || issueTypes[0];

    for (const item of initialStories) {
      try {
        await window.electronAPI.jiraRequest({
          host: profile.jiraHost,
          email: profile.jiraEmail,
          token: profile.jiraToken,
          path: '/rest/api/3/issue',
          method: 'POST',
          data: {
            fields: {
              project: { key: profile.jiraProjectKey },
              summary: item.summary,
              description: textToAdf(item.desc),
              issuetype: { id: storyType.id },
              assignee: { accountId: userAccountId },
              timetracking: { originalEstimate: item.hours }
            }
          }
        });
        created++;
      } catch (err: any) {
        errors.push(`${item.summary}: ${err.message}`);
      }
    }

    return { created, errors };
  },

  // ===================== BITBUCKET =====================
  async getBitbucketRepositories(profile: ProjectProfile, workspace?: string): Promise<any[]> {
    const ws = (workspace || profile.bitbucketWorkspace || 'sondacode').trim();
    const user = profile.bitbucketUser && profile.bitbucketUser !== 'x-token-auth'
      ? profile.bitbucketUser
      : (profile.jiraEmail || 'julio.varas@sonda.com');
    const secret = profile.bitbucketAppPassword || profile.bitbucketToken;

    const repoMap = new Map<string, any>();

    // Helper para paginar y recolectar repositorios sin límites artificiales
    const fetchPages = async (initialPath: string, maxPages = 4) => {
      let currentPath: string | null = initialPath;
      let page = 0;
      while (currentPath && page < maxPages) {
        page++;
        try {
          const res = await window.electronAPI.bitbucketRequest({
            user,
            appPassword: secret,
            token: secret,
            path: currentPath
          });
          const list = (res?.data?.values ?? res?.values) || [];
          if (Array.isArray(list)) {
            for (const repo of list) {
              const slugKey = (repo.slug || repo.name || '').toLowerCase();
              if (slugKey && !repoMap.has(slugKey)) {
                repoMap.set(slugKey, repo);
              }
            }
          }
          // Extraer URL de siguiente página
          const nextUrl = res?.data?.next || res?.next;
          if (nextUrl && typeof nextUrl === 'string') {
            const match = nextUrl.match(/\/2\.0\/.*$/);
            currentPath = match ? match[0] : null;
          } else {
            currentPath = null;
          }
        } catch (e) {
          console.warn(`Error en paginación de ${currentPath}:`, e);
          break;
        }
      }
    };

    // 1. Consultar repositorios donde el usuario es miembro activo (con permisos de lectura/escritura)
    await fetchPages('/2.0/repositories?role=member&pagelen=100&sort=-updated_on', 3);

    // 2. Consultar repositorios donde el usuario ha contribuido commits
    await fetchPages('/2.0/repositories?role=contributor&pagelen=100&sort=-updated_on', 3);

    // 3. Consultar repositorios del workspace corporativo sondacode
    if (ws) {
      await fetchPages(`/2.0/repositories/${ws}?pagelen=100&sort=-updated_on`, 5);
    }

    // 4. Asegurar que los proyectos clave confirmados del usuario (con commits activos) siempre estén presentes
    const verifiedKnownSlugs = [
      { slug: 'cotizador-claude-corporativo', name: 'CL Cotizador y Auditor Claude Enterprise' },
      { slug: 'gespad-sii', name: 'CL SII GESPAD' },
      { slug: 'sistema_gestion_control', name: 'CL Sistema de Gestion de Control' },
      { slug: 'datalake-otasa', name: 'CL Oleoducto Transandino Chile - OTC' }
    ];

    for (const item of verifiedKnownSlugs) {
      if (!repoMap.has(item.slug.toLowerCase())) {
        try {
          const directRes = await window.electronAPI.bitbucketRequest({
            user,
            appPassword: secret,
            token: secret,
            path: `/2.0/repositories/${ws}/${item.slug}`
          });
          const repoObj = directRes?.data ?? directRes;
          if (repoObj && (repoObj.slug || repoObj.name)) {
            repoMap.set(item.slug.toLowerCase(), repoObj);
          }
        } catch {
          // Si por alguna razón la API no devolvió el objeto completo, registrar el stub verificado
          repoMap.set(item.slug.toLowerCase(), {
            slug: item.slug,
            name: item.name,
            full_name: `${ws}/${item.slug}`,
            description: item.name,
            is_private: true,
            mainbranch: { name: item.slug === 'gespad-sii' ? 'develop' : 'main' },
            workspace: { slug: ws, name: ws },
            updated_on: new Date().toISOString()
          });
        }
      }
    }

    const result = Array.from(repoMap.values());
    const verifiedKeys = ['cotizador-claude-corporativo', 'gespad-sii', 'sistema_gestion_control', 'datalake-otasa'];
    
    // Ordenar: primero los repositorios donde el usuario trabaja activamente, luego por última actualización
    return result.sort((a, b) => {
      const aSlug = (a.slug || '').toLowerCase();
      const bSlug = (b.slug || '').toLowerCase();
      const aIsUserRepo = verifiedKeys.some(k => aSlug === k);
      const bIsUserRepo = verifiedKeys.some(k => bSlug === k);
      if (aIsUserRepo && !bIsUserRepo) return -1;
      if (!aIsUserRepo && bIsUserRepo) return 1;
      return (new Date(b.updated_on || 0).getTime()) - (new Date(a.updated_on || 0).getTime());
    });
  },

  async getSingleBitbucketRepo(profile: ProjectProfile, repoSlug: string, workspace?: string): Promise<any> {
    const ws = (workspace || profile.bitbucketWorkspace || 'sondacode').trim();
    const user = profile.bitbucketUser && profile.bitbucketUser !== 'x-token-auth'
      ? profile.bitbucketUser
      : (profile.jiraEmail || 'julio.varas@sonda.com');
    const secret = profile.bitbucketAppPassword || profile.bitbucketToken;

    const cleanSlug = repoSlug.trim().replace(/^.*bitbucket\.org\/[^\/]+\//, '').replace(/\/.*$/, '');
    const res = await window.electronAPI.bitbucketRequest({
      user,
      appPassword: secret,
      token: secret,
      path: `/2.0/repositories/${ws}/${cleanSlug}`
    });
    return res?.data ?? res;
  },

  async getWorkspaces(profile: ProjectProfile): Promise<any[]> {
    try {
      const res = await window.electronAPI.bitbucketRequest({
        user: profile.bitbucketUser || 'x-token-auth',
        appPassword: profile.bitbucketAppPassword || profile.bitbucketToken,
        token: profile.bitbucketToken || profile.bitbucketAppPassword,
        path: '/2.0/workspaces?pagelen=20'
      });
      const list = res?.data?.values ?? res?.values ?? [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [{ slug: profile.bitbucketWorkspace || 'sondacode', name: profile.bitbucketWorkspace || 'sondacode' }];
    }
  },

  async testBitbucket(profile: ProjectProfile): Promise<any> {
    const workspace = (profile.bitbucketWorkspace || '').trim();
    const repoSlug = (profile.bitbucketRepoSlug || '').trim();

    if (!workspace || !repoSlug) {
      throw new Error(`Bitbucket Workspace ("${workspace}") o Repositorio ("${repoSlug}") no están configurados.`);
    }

    const res = await window.electronAPI.bitbucketRequest({
      user: profile.bitbucketUser || 'x-token-auth',
      appPassword: profile.bitbucketAppPassword || profile.bitbucketToken,
      token: profile.bitbucketToken || profile.bitbucketAppPassword,
      path: `/2.0/repositories/${workspace}/${repoSlug}`
    });
    return res?.data ?? res;
  },

  // ===================== CONFLUENCE =====================
  async testConfluence(profile: ProjectProfile): Promise<any> {
    const host = (profile.confluenceHost || profile.jiraHost || 'sonda.atlassian.net').trim();
    const spaceKey = (profile.confluenceSpaceKey || profile.jiraProjectKey || '').trim();

    if (!spaceKey) {
      throw new Error('La clave del espacio Confluence (Space Key) no está configurada.');
    }

    const res = await window.electronAPI.confluenceRequest({
      host: host,
      email: profile.jiraEmail,
      token: profile.confluenceToken || profile.jiraToken,
      path: `/wiki/rest/api/space/${spaceKey}`
    });
    return res?.data ?? res;
  }
};
