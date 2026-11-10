



# SONDA · Atlassian Pipeline & Governance Suite (Desktop)
## Herramienta de Apoyo y Automatización CMMI v3.0

```
====
   Atlassian Easy - Suite de Apoyo y Automatización Desktop
   Repositorio: https://github.com/julvc/atlassian_easy.git
   Autor / Responsable: Julio Varas Contreras (jvarascontreras@gmail.com)
====
```

---

## 1. Descripción y Propósito

Esta herramienta es una **aplicación de escritorio gráfica (Electron + React 18 + TypeScript + Tailwind CSS)** diseñada para automatizar y gobernar el flujo de entrega y seguimiento de proyectos corporativos en **Jira Cloud**, **Bitbucket Cloud** y **Confluence**, reemplazando la ejecución manual de scripts batch por una interfaz intuitiva con consola de streaming en vivo.

### Principales Capacidades:

1. **Autenticación por Token y Enlace de Usuario**:
   - Al configurar el token, consulta `/rest/api/3/myself` y captura el `accountId` del usuario.
   - Toda tarjeta creada o gestionada queda validada y asignada al usuario del token. Si una tarjeta existente no está asignada, un botón permite asignarla en 1 clic.
2. **Detección Inteligente de Proyectos**:
   - **Proyectos Existentes (>0 tarjetas)**: No crea tarjetas nuevas automáticamente; opera en modo de gestión, registro de bitácora (Worklogs) y cierre validado.
   - **Proyectos Nuevos (0 tarjetas)**: Habilita el asistente de inicialización estructurada **CMMI v3.0** (Épicas, Historias y estimaciones de esfuerzo).
3. **Modal de Validación de Cierre**:
   - Para transicionar cualquier incidencia a **Hecho / Done**, la aplicación solicita confirmación explícita del usuario mediante un modal con resumen de horas a imputar y comentario de evidencia de cierre CMMI.
4. **Conexiones Modulares y No Forzadas**:
   - Cada servicio (**Jira**, **Bitbucket**, **Confluence**) dispone de su propio interruptor independiente. No se fuerza tener los 3 servicios activos si el proyecto solo requiere Jira y Bitbucket.
5. **Múltiples Perfiles de Proyecto**:
   - Guarda configuraciones completas para alternar rápidamente entre proyectos (ej: Cotizador Claude, Proyecto AMS, etc.) sin volver a tipear credenciales ni rutas.
6. **Pipeline de Automatización en Tiempo Real**:
   - Reemplaza `ejecutar_flujo_completo.bat`. Ejecuta la secuencia (Sincronización Jira -> Compilación de release .exe/.zip -> Commit CMMI y Push Bitbucket) transmitiendo la salida de la consola en vivo directamente en la ventana.

---

## 2. Cómo Iniciar la Aplicación

### Método 1: Lanzador Directo en 1-Clic (Recomendado)
Haz doble clic sobre el archivo:
```text
C:\Users\jvarasc\Documents\CODIGO\PROPUESTA_AUTOMATIZADOR_ATTLASIAN\iniciar_app.bat
```
El script detectará si es la primera ejecución, instalará automáticamente las dependencias de Node.js e iniciará la aplicación de escritorio.

### Método 2: Desde la Terminal (CMD)
```cmd
cd C:\Users\jvarasc\Documents\CODIGO\PROPUESTA_AUTOMATIZADOR_ATTLASIAN
npm install
npm run dev
```

---

## 3. Estructura del Código

```text
PROPUESTA_AUTOMATIZADOR_ATTLASIAN/
├── electron/
│   ├── main.ts              # Proceso principal Electron, clientes HTTPS y runner spawn
│   └── preload.ts           # Puente seguro IPC (contextBridge)
├── src/
│   ├── components/
│   │   ├── Navbar.tsx       # Cabecera con selector de perfil y estado de servicios
│   │   ├── Sidebar.tsx      # Barra de navegación principal
│   │   ├── PipelineView.tsx # Consola en vivo y ejecución 1-clic
│   │   ├── JiraView.tsx     # Tablero de tarjetas, asignación por token y worklogs
│   │   ├── ModalValidarCierre.tsx # Gate de validación para cerrar tarjetas
│   │   ├── IntegrationsView.tsx   # Conexiones manuales Bitbucket/Confluence
│   │   └── ProfilesView.tsx # Gestor de perfiles de proyectos y credenciales
│   ├── context/
│   │   └── AppContext.tsx   # Estado global reactivo
│   ├── services/
│   │   └── atlassianService.ts # Cliente unificado de Jira, Bitbucket y Confluence
│   ├── types/
│   │   └── index.ts         # Definiciones TypeScript
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entrypoint React
│   └── index.css            # Tailwind CSS
├── iniciar_app.bat          # Lanzador autónomo
├── package.json             # Dependencias y scripts
└── README.md                # Este documento
```

---
*SONDA S.A. · Dirección Corporativa de Inteligencia Artificial & Preventa*

