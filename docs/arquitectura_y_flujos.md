# Arquitectura Técnica & Diagramas de Secuencia

Este documento proporciona una visión profunda de la arquitectura interna de **Atlassian Easier Suite**, orientada a arquitectos de software, mantenedores y auditores técnicos.

---

## 🏛️ 1. Diagrama de Capas del Sistema

```mermaid
graph TB
    subgraph UI_Layer ["Capa de Presentación (Chromium Renderer)"]
        ReactApp["Aplicación React 18 (Vite Bundled)"]
        Context["AppContext (Estado Reactivo Global)"]
        Views["Vistas: Pipeline, Jira Live, Worklogs, Profiles"]
        Components["Componentes UI: ModalDescubrir, ConsoleDrawer, etc."]
    end

    subgraph Security_Boundary ["Barrera de Seguridad Electron (Sandbox & Context Isolation)"]
        PreloadCJS["preload.cjs (Exposición Segura window.electronAPI)"]
    end

    subgraph Core_Layer ["Capa Principal Electron (Node.js Engine)"]
        MainProcess["main.js (Electron Main Process)"]
        IPCHandlers["IPC Main Handlers (jira:request, bitbucket:request, etc.)"]
        HTTPSClient["makeHttpsRequest (Redirects + Content-Length + Fallbacks)"]
        ProcessRunner["Runner de Subprocesos (.bat, .cjs, git)"]
    end

    subgraph External_APIs ["Nube Atlassian & Sistema Operativo"]
        JiraCloud["Jira Cloud REST API v3 (/rest/api/3)"]
        BitbucketCloud["Bitbucket Cloud REST API v2 (/2.0)"]
        ConfluenceCloud["Confluence Cloud REST API (/wiki/rest/api)"]
        WinFS["Sistema de Archivos Windows (C:\Users\...)"]
    end

    UI_Layer --> Security_Boundary
    Security_Boundary --> Core_Layer
    Core_Layer --> External_APIs
```

---

## ⚡ 2. Diagrama de Secuencia: Flujo de Entrega Real Completo

Muestra la interacción completa cuando el usuario presiona **`Ejecutar Entrega Real`** en la Suite:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Ingeniero
    participant UI as Suite (React UI)
    participant Preload as Preload Bridge (preload.cjs)
    participant Main as Electron Main (main.js)
    participant Git as Git CLI Local
    participant BB as Bitbucket Cloud
    participant Jira as Jira Cloud

    Dev->>UI: Clic en "Ejecutar Entrega Real"
    UI->>UI: Abrir Terminal en Vivo (ConsoleDrawer)
    UI->>Preload: gitPreflight(cwd, targetBranch)
    Preload->>Main: ipcRenderer.invoke('git:preflight')
    Main->>Git: git fetch origin targetBranch
    Main->>Git: git status --porcelain
    Main-->>UI: Preflight OK (Sin conflictos)

    Note over UI,BB: PASO 1: Commits y Sincronización Git / Bitbucket
    UI->>Preload: runProcess('node crear_commits_cmmi.cjs')
    Preload->>Main: runner:start
    Main->>Git: git add -A && git commit -m "[FEAT] CCYACE-XX..."
    Main->>Git: git push origin currentBranch
    Main-->>UI: Runner Log Streaming ("✓ Commits publicados")

    Note over UI,Jira: PASO 2: Mover Cajas en Jira a "Hecho" & Worklogs
    UI->>Preload: jiraRequest('/rest/api/3/search')
    Preload->>Main: ipcRenderer.invoke('jira:request')
    Main->>Jira: POST /rest/api/3/search (JQL project = CCYACE)
    Jira-->>Main: Incidencias encontradas
    loop Por cada incidencia del sprint
        Main->>Jira: POST /rest/api/3/issue/{key}/transitions (Status: Hecho)
        Main->>Jira: POST /rest/api/3/issue/{key}/worklog (Imputar 8h CMMI)
        Main-->>UI: Runner Log ("✓ Tarjeta CCYACE-X movida a Hecho")
    end

    Note over UI,BB: Publicación de Tag de Release
    UI->>Preload: runProcess('node bitbucket_sync.cjs')
    Main->>Git: git tag -a v1.0.X -m "Release CMMI v3.0"
    Main->>Git: git push origin v1.0.X
    Main-->>UI: Runner Exit (Code 0)
    UI-->>Dev: Notificación de Éxito: "🚀 Flujo de Entrega Completado"
```

---

## 🔒 3. Seguridad y Puentes de Contexto (Context Isolation)

En cumplimiento con las directivas de seguridad de Electron:

1. **`nodeIntegration: false`:** La capa del navegador (React) **no tiene acceso directo** al módulo `child_process` de Node ni a primitivas que puedan vulnerar la máquina cliente.
2. **`contextIsolation: true`:** La ventana del navegador y el script de precarga corren en mundos de ejecución separados.
3. **`preload.cjs`:** Se utiliza la extensión `.cjs` para garantizar que Electron cargue el puente bajo CommonJS nativo sin importar si el proyecto define `"type": "module"` en su `package.json`.
4. **Validación de Parámetros:** Todos los handlers de IPC (`jira:request`, `bitbucket:request`, `dialog:selectDirectory`) sanitizan las rutas locales y las URLs de destino para prevenir cualquier inyección.
