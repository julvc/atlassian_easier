# Preguntas Frecuentes & Resolución de Problemas (Troubleshooting)

Esta guía recopila los errores conocidos, mensajes de consola y situaciones de soporte habituales junto con su solución inmediata y definitiva.

---

## 🛑 1. Problemas de Conectividad con Jira Cloud

### Error: `HTTP 401: Client must be authenticated to access this resource`

* **Causa:** El token de Jira Cloud o el correo electrónico corporativo son incorrectos, expiraron o fueron revocados en `id.atlassian.com`.
* **Solución:**
  1. Ingresa a [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) y genera un nuevo token.
  2. En la Suite, haz clic en **Perfiles de Proyecto** y actualiza el campo **API Token Jira**.
  3. También puedes actualizar la variable `ATLASSIAN_API_TOKEN` en tu archivo `.env.atlassian` local y presionar el botón **`Sincronizar de .env`** en la tarjeta de Jira.

---

### Error: `HTTP 404: Resource not found en /rest/api/3/search/jql`

* **Causa:** Uso de una URL no soportada por Jira Cloud REST API v3.
* **Solución:**
  * Ya corregido en la versión actual de la Suite: la consulta se realiza en el endpoint oficial `/rest/api/3/search` enviando el JQL en el cuerpo JSON (`POST`) con fallback a parámetros URL (`GET`).

---

## ☁️ 2. Problemas con Bitbucket Cloud

### Error: `El Catálogo de Bitbucket muestra 0 repositorios en sondacode`

* **Causa:**
  1. El token configurado no tiene permisos de lectura a nivel de workspace global (`sondacode`), o
  2. La petición utilizó el usuario virtual `x-token-auth` que Bitbucket solo acepta para clones de Git y no para llamadas a su API REST.
* **Solución:**
  * La Suite implementa un bucle inteligente de credenciales que prueba en orden:
    1. Usuario explícito con contraseña de aplicación (`App Password`).
    2. Correo corporativo (`julio.varas@sonda.com`).
    3. Token de portador (`Bearer Token`).
    4. Acceso con rol de miembro (`/2.0/repositories?role=member`).
  * Si la lista de repositorios no se actualiza inmediatamente, haz clic en el botón **`Refrescar Repositorios`** dentro del modal.

---

## 💻 3. Errores de Entorno Electron & Node.js

### Error: `Cannot read properties of undefined (reading 'jiraRequest')`

* **Causa:**
  * El script de precarga de Electron (`preload.js`) falló al inicializarse porque `package.json` tenía `"type": "module"` y el archivo utilizaba sintaxis CommonJS (`require`), lo que impidió exponer `window.electronAPI`.
* **Solución:**
  * La Suite ahora compila y carga de manera forzada `preload.cjs` bajo CommonJS nativo y desactiva el sandbox para dar acceso completo al puente IPC (`sandbox: false`).
  * Al ejecutar mediante `iniciar_app.bat`, `window.electronAPI` se monta de forma 100% garantizada.

---

### Error: `ReferenceError: __dirname is not defined`

* **Causa:**
  * Al trabajar con módulos ES nativos (`"type": "module"`), Node.js no expone la variable global `__dirname`.
* **Solución:**
  * Se definió el polyfill oficial en `electron/main.ts`:
    ```ts
    import { fileURLToPath } from 'url';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    ```

---

### Error: `La directiva de grupo bloquea a este programa (AppLocker)`

* **Causa:**
  * Las políticas de seguridad de la red corporativa de SONDA bloquean la invocación de scripts PowerShell interactivos o consolas no firmadas.
* **Solución:**
  * **Nunca ejecutes scripts de PowerShell de forma directa.**
  * Inicia siempre la aplicación haciendo doble clic en el archivo por lotes aprobado:
    ```cmd
    iniciar_app.bat
    ```
  * El archivo por lotes utiliza únicamente comandos estándar del intérprete de comandos de Windows (`cmd.exe`), verificando `node` y `npm` de manera transparente.

---

## 🗄️ 4. Ubicación de Archivos de Configuración Local

Si necesitas reiniciar la configuración o respaldar tus datos, la Suite almacena sus archivos en la carpeta de datos de usuario de Windows:

| Archivo | Ruta Completa | Propósito |
| :--- | :--- | :--- |
| **Perfiles** | `%APPDATA%\atlassian_suite_profiles.json` | Lista de proyectos, tokens y rutas vinculadas. |
| **Worklogs** | `%APPDATA%\atlassian_suite_worklogs.json` | Histórico local de bitácoras y horas imputadas. |
| **Tema UI** | `localStorage('atlassian_suite_theme')` | Preferencia de tema Claro / Oscuro. |

> [!TIP]
> Si borras `atlassian_suite_profiles.json`, la aplicación volverá a cargar automáticamente los perfiles por defecto del **Cotizador Claude Corporativo** y **GESPAD SII** al iniciarse.
