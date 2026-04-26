# Architecture

EasyHook is intentionally small. The first version avoids a frontend build step and keeps the Frida lifecycle in the Electron main process. The default product workflow targets Android USB/tether devices from a Windows host, so the renderer does not automatically select Frida's local desktop device.

## Process Model

- `src/main/main.js` creates the Electron window, menu, dialogs, and IPC handlers.
- `src/main/fridaService.js` owns Frida device discovery, Android process/app listing, script loading, message forwarding, and session cleanup.
- `src/main/scriptStore.js` scans folders and reads or writes script files.
- `src/preload/preload.js` exposes a narrow `window.easyhook` API to the renderer.
- `src/renderer/app.js` manages UI state, script editing, run controls, and console output.

The renderer never receives Node.js primitives directly. It talks to the main process through the preload bridge.

## Frida Lifecycle

1. The renderer sends a `frida:run` IPC request with device, mode, target, runtime, script name, and source code.
2. The main process stops any previous session.
3. The service resolves the selected Android USB/tether device.
4. In `attach` mode, the service attaches to the selected Android PID or process name.
5. In `spawn` mode, the service spawns the Android package, attaches before resume, loads the script, then resumes the process.
6. Frida `send()` and error messages are forwarded to the renderer as `frida:message` events.
7. Stop unloads the script and detaches the session.

## Security Boundaries

EasyHook enables dynamic instrumentation. It should only be used on systems, processes, apps, and devices where you have explicit authorization.

Electron runs with:

- `contextIsolation: true`
- `nodeIntegration: false`
- a small preload API

The current project is a developer-oriented IDE skeleton. Before using it in a hostile environment, add stronger project trust controls, script signing or review, and persistent workspace permission prompts.

## Roadmap

- Monaco or CodeMirror editor integration
- Script templates and snippets
- Per-target launch profiles
- Frida RPC explorer
- Device health checks
- Script bundling with `frida-compile`
- Project-level settings
- Built-in update workflow for desktop releases
