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
    const res = await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: '/rest/api/3/myself'
    });
    return res.data;
  },

  async getProjects(profile: ProjectProfile): Promise<JiraProject[]> {
    const res = await window.electronAPI.jiraRequest({
      host: profile.jiraHost,
      email: profile.jiraEmail,
      token: profile.jiraToken,
      path: '/rest/api/3/project'
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  async getBoards(profile: ProjectProfile): Promise<JiraBoard[]> {
    try {
      const path = profile.jiraProjectKey 
        ? `/rest/agile/1.0/board?projectKeyOrId=${profile.jiraProjectKey}` 
        : '/rest/agile/1.0/board';
      const res = await window.electronAPI.jiraRequest({
        host: profile.jiraHost,
        email: profile.jiraEmail,
        token: profile.jiraToken,
        path: path
      });
      return res.data?.values || [];
    } catch {
      return [];
    }
  },

  async getIssues(profile: ProjectProfile): Promise<JiraIssue[]> {
    const projectKey = profile.jiraProjectKey;
    if (!projectKey) return [];

    try {
      const res = await window.electronAPI.jiraRequest({
        host: profile.jiraHost,
        email: profile.jiraEmail,
        token: profile.jiraToken,
        path: '/rest/api/3/search/jql',
        method: 'POST',
        data: {
          jql: `project = "${projectKey}" ORDER BY created DESC`,
          maxResults: 100,
          fields: ['summary', 'description', 'issuetype', 'status', 'assignee', 'priority', 'timeoriginalestimate', 'timespent', 'labels', 'duedate']
        }
      });
      return res.data?.issues || [];
    } catch {
      // Fallback con GET
      const jql = encodeURIComponent(`project = "${projectKey}" ORDER BY created DESC`);
      const res = await window.electronAPI.jiraRequest({
        host: profile.jiraHost,
        email: profile.jiraEmail,
        token: profile.jiraToken,
        path: `/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,description,issuetype,status,assignee,priority,timeoriginalestimate,timespent,labels,duedate`
      });
      return res.data?.issues || [];
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
    return res.data?.transitions || [];
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
    const issueTypes = projRes.data?.issueTypes || [];
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
  async testBitbucket(profile: ProjectProfile): Promise<any> {
    const res = await window.electronAPI.bitbucketRequest({
      user: profile.bitbucketUser,
      appPassword: profile.bitbucketAppPassword,
      token: profile.bitbucketToken,
      path: `/2.0/repositories/${profile.bitbucketWorkspace}/${profile.bitbucketRepoSlug}`
    });
    return res.data;
  },

  // ===================== CONFLUENCE =====================
  async testConfluence(profile: ProjectProfile): Promise<any> {
    const host = profile.confluenceHost || profile.jiraHost;
    const spaceKey = profile.confluenceSpaceKey || profile.jiraProjectKey;
    const res = await window.electronAPI.confluenceRequest({
      host: host,
      email: profile.jiraEmail,
      token: profile.confluenceToken || profile.jiraToken,
      path: `/wiki/rest/api/space/${spaceKey}`
    });
    return res.data;
  }
};
