# Manual de Usuario y Operación Oficial
## Suite de Apoyo y Automatización Atlassian (Jira, Bitbucket, Confluence)
### Herramienta de Escritorio Autónomo · Estándar CMMI v3.0 · SONDA S.A.

```
========================================================================================
   Atlassian Easy - Suite de Apoyo y Automatización Desktop
   Repositorio: https://github.com/julvc/atlassian_easy.git
   Versión del Software: V1.0.0 (Edición Autónoma de Escritorio)
   Documento: Manual de Usuario Integral Paso a Paso
   Autor / Responsable: Julio Varas Contreras (jvarascontreras@gmail.com)
   Estándar de Calidad: CMMI v3.0 / Gobernanza de Entregables
========================================================================================
```

---

## Índice General

1. [Introducción y Propósito](#1-introducción-y-propósito)
2. [Requisitos e Instalación en 1-Clic](#2-requisitos-e-instalación-en-1-clic)
3. [Navegación General y Estructura de la Interfaz](#3-navegación-general-y-estructura-de-la-interfaz)
4. [Gestión de Perfiles de Proyecto y Credenciales](#4-gestión-de-perfiles-de-proyecto-y-credenciales)
5. [Módulo de Jira: Detección, Asignación y Cierre de Tareas](#5-módulo-de-jira-detección-asignación-y-cierre-de-tareas)
   - 5.1. [Validación Automática de Identidad por Token](#51-validación-automática-de-identidad-por-token)
   - 5.2. [Proyectos Existentes (>0 Tarjetas): Modo Seguimiento](#52-proyectos-existentes-0-tarjetas-modo-seguimiento)
   - 5.3. [Proyectos Nuevos (0 Tarjetas): Asistente CMMI v3.0](#53-proyectos-nuevos-0-tarjetas-asistente-cmmi-v30)
   - 5.4. [Registro de Horas (Worklogs) y Estimaciones](#54-registro-de-horas-worklogs-y-estimaciones)
   - 5.5. [Modal de Validación y Cierre de Tareas a "Hecho"](#55-modal-de-validación-y-cierre-de-tareas-a-hecho)
6. [Módulo de Integraciones: Bitbucket y Confluence](#6-módulo-de-integraciones-bitbucket-y-confluence)
   - 6.1. [Conexión Manual a Bitbucket y Asistente de Commits CMMI](#61-conexión-manual-a-bitbucket-y-asistente-de-commits-cmmi)
   - 6.2. [Conexión Manual a Confluence](#62-conexión-manual-a-confluence)
7. [Pipeline de Automatización (Reemplazo de ejecutar_flujo_completo.bat)](#7-pipeline-de-automatización-reemplazo-de-ejecutar_flujo_completobat)
   - 7.1. [Fases Configurables](#71-fases-configurables)
   - 7.2. [Consola Terminal con Streaming de Logs en Vivo](#72-consola-terminal-con-streaming-de-logs-en-vivo)
8. [Preguntas Frecuentes y Solución de Problemas (Troubleshooting)](#8-preguntas-frecuentes-y-solución-de-problemas-troubleshooting)

---

## 1. Introducción y Propósito

La **Suite de Apoyo y Automatización Atlassian** es una aplicación de escritorio desarrollada en **Electron, React 18, TypeScript y Tailwind CSS**. Su objetivo principal es centralizar, modernizar y automatizar los flujos operativos que tradicionalmente se ejecutaban mediante scripts batch (`ejecutar_flujo_completo.bat`, `atlassian_sync.cjs`, `bitbucket_sync.cjs`, `publicar_release_exe.cjs`).

### Características Diferenciales:
- **Aislamiento Total de Git:** La aplicación está diseñada como herramienta de soporte local. No se commitea en los repositorios de los proyectos cliente ni interfiere con sus historias de Git.
- **Conexiones No Forzadas:** Cada módulo (**Jira**, **Bitbucket**, **Confluence**) puede activarse o desactivarse a voluntad. La app funciona fluidamente tanto en proyectos que solo usan Jira, como en aquellos que integran todo el ecosistema.
- **Asignación Obligatoria al Usuario del Token:** El sistema verifica tu identidad en Atlassian (`/rest/api/3/myself`) para que todas las tarjetas gestionadas o cerradas queden asociadas estrictamente a tu cuenta corporativa.
- **Validación Humana en Cierres:** Para evitar cierres accidentales de tarjetas, la transición al estado final (*Hecho*) requiere completar un modal de confirmación con registro de horas y evidencias CMMI.

---

## 2. Requisitos e Instalación en 1-Clic

### Requisitos del Sistema:
- **Sistema Operativo:** Windows 10 o Windows 11 (64-bit).
- **Entorno de Ejecución:** Node.js 18+ LTS instalado en el equipo y disponible en el PATH.
- **Ubicación de la Suite:** `C:\Users\jvarasc\Documents\CODIGO\PROPUESTA_AUTOMATIZADOR_ATTLASIAN`.

### Procedimiento de Inicio en 1-Clic:
1. Dirígete a la carpeta del proyecto en el Explorador de Windows:
   `C:\Users\jvarasc\Documents\CODIGO\PROPUESTA_AUTOMATIZADOR_ATTLASIAN`
2. Haz doble clic sobre el archivo ejecutable por lotes:
   **`iniciar_app.bat`**
3. El script realizará las siguientes acciones de forma automática:
   - Verificará la presencia de Node.js en el sistema.
   - Si es la primera vez que abres la herramienta, ejecutará `npm install` para descargar e instalar los paquetes necesarios.
   - Levantará el entorno de escritorio Electron con la interfaz gráfica en modo oscuro.

---

## 3. Navegación General y Estructura de la Interfaz

La aplicación se compone de tres zonas principales de control:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [S] SONDA SUITE - ATLASSIAN CMMI   [Perfil: Cotizador Claude ▼]   [✓ Jira] [✓ Bitbucket]│
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ [🚀] Pipeline     │                                                                    │
│ [📋] Tablero Jira │                     ÁREA DE TRABAJO PRINCIPAL                      │
│ [🔗] Integraciones│                 (Cambia según la vista seleccionada)               │
│ [⚙️] Perfiles     │                                                                    │
├───────────────────┤                                                                    │
│ Proyecto Activo:  │                                                                    │
│ Cotizador Claude  │                                                                    │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

1. **Barra Superior (Navbar):**
   - **Selector de Perfiles:** Permite cambiar instantáneamente de proyecto sin reconfigurar credenciales.
   - **Badges de Conectividad:** Muestra en color verde esmeralda los servicios con conexión válida (Jira, Bitbucket, Confluence).
   - **Ficha de Usuario:** Muestra el nombre y correo corporativo del colaborador autenticado mediante el API Token.
2. **Barra Lateral Izquierda (Sidebar):**
   - Acceso directo a las 4 vistas principales: *Pipeline de Entrega*, *Tablero Jira*, *Integraciones Bitbucket & Confluence* y *Perfiles de Proyecto*.
   - Muestra la ruta local del proyecto activo en disco.
3. **Área de Trabajo Principal:**
   - Despliega las herramientas interactivas, tablas de tarjetas, paneles de integración o la terminal de logs en tiempo real.

---

## 4. Gestión de Perfiles de Proyecto y Credenciales

La pestaña **Perfiles de Proyecto (⚙️)** te permite administrar múltiples configuraciones para distintos repositorios de trabajo.

### Paso a Paso para Configurar un Proyecto:
1. En el menú lateral, selecciona **Perfiles de Proyecto**.
2. Para editar el proyecto actual, modifica los campos en pantalla; para crear uno nuevo, presiona **`[ ➕ Nuevo Perfil ]`**.
3. **Nombre del Perfil:** Ingresa un nombre representativo (ej. *Cotizador Claude Enterprise*, *Sistema Facturación AMS*).
4. **Carpeta Local del Código (Working Dir):**
   - Haz clic en el botón **`[ 📂 Examinar... ]`**.
   - Se abrirá la ventana nativa de Windows para seleccionar la carpeta donde tienes clonado el repositorio en tu máquina (ej. `C:\Users\jvarasc\Documents\CODIGO\COTIZADOR_CLAUDE_CORPORATIVE`).
5. **Servicios a Conectar (Modular y No Forzado):**
   - Marca solo las casillas de los servicios que apliquen a este proyecto:
     - `[x] Conectar Jira Cloud`
     - `[x] Conectar Bitbucket Cloud`
     - `[ ] Conectar Confluence Cloud` (opcional)
6. **Credenciales de Jira:**
   - **Email Atlassian:** Tu correo SONDA (ej. `julio.varas@sonda.com`).
   - **API Token:** Tu token de API personal generado desde [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
   - **Host Jira:** Generalmente `sonda.atlassian.net`.
   - **Project Key:** Clave del proyecto en Jira (ej. `CCYACE`).
   - **Board ID:** Identificador numérico del tablero ágil (ej. `6013`).
   - **Modo Backup (URLs Directas):** Campos opcionales para pegar la URL completa del proyecto o tablero si no se conocen las claves internas.
7. **Credenciales de Bitbucket:**
   - **Workspace:** Nombre del espacio de trabajo (ej. `sondacode`).
   - **Repo Slug:** Nombre del repositorio (ej. `cotizador-claude-corporativo`).
   - **App Password / Token:** Contraseña de aplicación generada en la configuración de Bitbucket con permisos de lectura y escritura de repositorios.
   - **URL Repositorio:** URL web directa para acceso rápido.
8. Presiona **`[ 💾 Guardar Perfil ]`**. La información se almacena de forma segura en el almacenamiento local del equipo.

---

## 5. Módulo de Jira: Detección, Asignación y Cierre de Tareas

En la pestaña **Tablero & Tareas Jira (📋)** se realiza el seguimiento, control de tiempos y certificación de tareas.

### 5.1. Validación Automática de Identidad por Token
Al abrir la vista, la aplicación contacta el endpoint `/rest/api/3/myself` de Jira:
- Identifica tu identificador inmutable (`accountId`).
- Muestra en el encabezado tu nombre y estado: `Validado como: Julio Varas Contreras`.
- Este `accountId` se utiliza como regla estricta para asignar cualquier tarjeta que vayas a trabajar o cerrar.

---

### 5.2. Proyectos Existentes (>0 Tarjetas): Modo Seguimiento
Si el proyecto consultado ya cuenta con incidencias en Jira (incluso una sola tarjeta creada):
- **Regla Operativa:** La aplicación **NO crea tarjetas nuevas automáticamente**, respetando el backlog definido por el equipo en Jira Cloud.
- **Buscador y Filtros:** Puedes filtrar incidencias por texto, por estado (*Todas*, *Por Hacer*, *En Curso*, *Hecho*) o marcar la casilla **"Solo mías"**.
- **Asignación en 1-Clic:** Si una tarjeta no tiene responsable o está asignada a otra persona, haz clic sobre el botón:  
  `[ + Asignar a Mí ]`  
  La app llamará a la API de Jira y vinculará inmediatamente la tarjeta a tu usuario.

---

### 5.3. Proyectos Nuevos (0 Tarjetas): Asistente CMMI v3.0
Si abres un proyecto recién creado en Jira que tiene 0 tarjetas en su tablero:
- La vista mostrará un banner especial: **"Proyecto Nuevo: Sin tarjetas en Jira"**.
- Se habilitará el botón destacado:  
  **`[ ✨ Generar Estructura Inicial CMMI v3.0 en Jira ]`**
- Al hacer clic, la aplicación creará automáticamente las 6 historias base del ciclo de vida CMMI (Configuración Git, Espacio documental, Plan de Gestión, Arquitectura y SQLite, Módulos Operativos, Pruebas y Validación), estableciendo las horas estimadas y asignándotelas a ti de forma directa.

---

### 5.4. Registro de Horas (Worklogs) y Estimaciones
En cada fila de la tabla puedes ver las horas registradas versus las horas estimadas originalmente:
1. Haz clic en el botón **`[ ⏱️ Log ]`** de cualquier tarjeta.
2. Se abrirá una ventana emergente rápida donde podrás ingresar el tiempo invertido (ej. `4h`, `2h 30m`, `8h`).
3. Presiona **`Registrar`**. Las horas se asentarán inmutablemente en la bitácora de la incidencia en Jira Cloud.

---

### 5.5. Modal de Validación y Cierre de Tareas a "Hecho"
Para cerrar una tarea de forma segura y gobernada:
1. Haz clic en el botón verde **`[ ✓ Cerrar ]`** ubicado a la derecha de la tarjeta.
2. Se desplegará el **Modal de Validación de Cierre de Tarea CMMI**:
   - **Resumen:** Confirma la clave de la tarjeta (`CCYACE-XX`) y su título.
   - **Horas a Registrar (Worklog):** Ingresa las horas de cierre o selecciona los accesos rápidos (`4h`, `8h`, `12h`, `16h`).
   - **Comentario de Evidencia de Cierre CMMI:** Escribe o ajusta la descripción del entregable completado (ej. *PR aprobado en Bitbucket, pruebas funcionales satisfactorias y documentación actualizada*).
3. Presiona el botón verde:  
   **`[ ✓ Confirmar Validación y Cerrar en Jira ]`**
4. La aplicación ejecutará la transición de estado a **Hecho / Done**, registrará el tiempo en el worklog y publicará el comentario de auditoría con tu nombre y fecha.

---

## 6. Módulo de Integraciones: Bitbucket y Confluence

En la pestaña **Bitbucket & Confluence (🔗)** puedes verificar el estado de los repositorios y ejecutar operaciones Git asistidas.

### 6.1. Conexión Manual a Bitbucket y Asistente de Commits CMMI
- **Probar Conexión:** Haz clic en **`[ 🧪 Probar Conexión Bitbucket ]`** para verificar que las credenciales y el repositorio sean accesibles.
- **Asistente de Commits CMMI:**
  1. En el campo **Clave Jira**, ingresa el identificador de la tarea en la que trabajaste (ej. `CCYACE-31`).
  2. En **Mensaje descriptivo**, redacta el alcance del cambio (ej. *Implementación del nuevo filtro interactivo de fechas*).
  3. Haz clic en **`[ ✓ Generar Commit CMMI en Repositorio Local ]`**.
  4. La app ejecutará `git add .` y `git commit -m "CCYACE-31 ..."` en la carpeta local de tu proyecto, asegurando que el commit cumpla con el formato corporativo y sin metadatos de autoría no autorizados.

### 6.2. Conexión Manual a Confluence
- Ingresa la URL de la página o el Space Key del proyecto (ej. `CCYACE`).
- Presiona **`[ 🧪 Probar Conexión Confluence ]`** para confirmar que tienes permisos de lectura y escritura en el espacio documental.

---

## 7. Pipeline de Automatización (Reemplazo de ejecutar_flujo_completo.bat)

La pestaña **Pipeline de Entrega (🚀)** es el centro de control que sustituye por completo los archivos `.bat` de compilación y publicación.

### 7.1. Fases Configurables
Puedes marcar o desmarcar las fases que deseas ejecutar en cada ciclo:
- **[x] [1/3] Sincronizar Jira Cloud & Trazabilidad CMMI:** Ejecuta la rutina de sincronización de incidencias y worklogs (`scripts/atlassian_sync.cjs`).
- **[x] [2/3] Compilar y Empaquetar Ejecutable Windows Offline:** Cierra procesos huérfanos, compila la aplicación y empaqueta el ejecutable `.exe` y archivo `.zip` en la carpeta oficial (`scripts/publicar_release_exe.cjs`).
- **[x] [3/3] Generar Commits CMMI y Push a Bitbucket Cloud:** Resuelve los commits pendientes, genera el tag de versión (ej. `V0.0.8`) y envía los cambios a Bitbucket (`scripts/crear_commits_cmmi.cjs` y `scripts/bitbucket_sync.cjs`).

### 7.2. Consola Terminal con Streaming de Logs en Vivo
1. Presiona el botón azul principal:  
   **`[ ▶️ Ejecutar Flujo Completo (1-Clic) ]`**
2. La ventana inferior de **Terminal en Vivo** comenzará a transmitir en tiempo real la salida estándar de cada script:
   - Texto en color **cian**: Información de inicio y parámetros de ejecución.
   - Texto en color **blanco/verde**: Mensajes de éxito y avances de compilación.
   - Texto en color **ámbar/rojo**: Advertencias o errores detectados.
3. El botón principal cambiará a **`[ ⏹️ Abortar Ejecución ]`**, permitiéndote detener el proceso de inmediato si detectas algún problema.
4. Para vaciar el historial de la pantalla, presiona **`[ 🧹 Limpiar Consola ]`**.

---

## 8. Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

### P1: Al iniciar la aplicación aparece "Error al conectar con Jira: [401] Unauthorized"
- **Causa:** El API Token de Atlassian expiró o el correo ingresado no coincide con el dueño del token.
- **Solución:** Ve a **Perfiles de Proyecto**, ingresa a [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens), genera un nuevo token y pégalo en el campo **API Token**. Luego presiona **Guardar Perfil**.

### P2: ¿Por qué en la vista de Jira veo el mensaje "Proyecto Nuevo: Sin tarjetas en Jira"?
- **Causa:** La consulta JQL `project = "KEY"` no arrojó ninguna incidencia en Jira Cloud.
- **Solución:** Si es un proyecto que recién estás creando, haz clic en **Generar Estructura Inicial CMMI v3.0**. Si es un proyecto existente, verifica en **Perfiles** que el **Project Key** esté bien escrito (ej. `CCYACE` sin espacios).

### P3: ¿La aplicación modifica mi historial de Git si solo la uso para Jira?
- **Respuesta:** No. La herramienta solo ejecuta comandos de Git cuando presionas el botón explícito de **Generar Commit CMMI** o cuando activas la fase de **Push a Bitbucket** en el Pipeline. Si esas opciones están desactivadas, no interactúa con tu repositorio local.

### P4: ¿Dónde se guardan mis perfiles y tokens?
- **Respuesta:** Se almacenan localmente en la carpeta de datos de usuario de Windows (`%APPDATA%/atlassian_suite_profiles.json`). Ningún dato de credenciales ni información de proyectos se transmite a servidores de terceros; la comunicación se realiza exclusivamente y de manera directa contra las APIs oficiales de Atlassian mediante HTTPS.

---
*Fin del Manual de Usuario · SONDA S.A. · Tecnologías Disruptivas & CMMI v3.0*
