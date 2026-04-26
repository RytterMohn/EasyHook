'use strict';

const path = require('node:path');
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { FridaService } = require('./fridaService');
const scriptStore = require('./scriptStore');

let mainWindow = null;
let fridaService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    title: 'EasyHook',
    backgroundColor: '#111113',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        menuAction('New Script', 'new-script', 'CmdOrCtrl+N'),
        menuAction('Open Script', 'open-script', 'CmdOrCtrl+O'),
        menuAction('Open Folder', 'open-folder', 'CmdOrCtrl+Shift+O'),
        { type: 'separator' },
        menuAction('Save', 'save-script', 'CmdOrCtrl+S'),
        menuAction('Save As', 'save-script-as', 'CmdOrCtrl+Shift+S'),
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Run',
      submenu: [
        menuAction('Run Script', 'run-script', 'F5'),
        menuAction('Stop Script', 'stop-script', 'Shift+F5'),
        { type: 'separator' },
        menuAction('Refresh Devices', 'refresh-devices', 'CmdOrCtrl+R'),
        menuAction('Refresh Processes', 'refresh-processes', 'CmdOrCtrl+Shift+R')
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open Frida Docs',
          click: () => shell.openExternal('https://frida.re/docs/javascript-api/')
        },
        {
          label: 'Open Project Site',
          click: () => shell.openExternal('https://github.com/RytterMohn/EasyHook')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function menuAction(label, action, accelerator) {
  return {
    label,
    accelerator,
    click: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('menu:action', action);
      }
    }
  };
}

function registerIpc() {
  fridaService = new FridaService((channel, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  });

  handle('frida:list-devices', () => fridaService.listDevices());
  handle('frida:list-processes', (_event, deviceId) => fridaService.listProcesses(deviceId));
  handle('frida:list-applications', (_event, deviceId) => fridaService.listApplications(deviceId));
  handle('frida:run', (_event, options) => fridaService.run(options));
  handle('frida:stop', () => fridaService.stop());
  handle('frida:post', (_event, payload) => fridaService.post(payload));

  handle('files:open-script', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Frida Script',
      properties: ['openFile'],
      filters: [
        { name: 'Frida scripts', extensions: ['js', 'ts'] },
        { name: 'All files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return scriptStore.readScript(result.filePaths[0]);
  });

  handle('files:select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Script Folder',
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const folderPath = result.filePaths[0];
    return {
      folderPath,
      scripts: await scriptStore.listScripts(folderPath)
    };
  });

  handle('files:list-scripts', (_event, folderPath) => scriptStore.listScripts(folderPath));
  handle('files:read-script', (_event, filePath) => scriptStore.readScript(filePath));
  handle('files:save-script', async (_event, payload) => {
    const source = payload && typeof payload.source === 'string' ? payload.source : '';
    let filePath = payload ? payload.filePath : '';

    if (!filePath || payload.saveAs) {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Frida Script',
        defaultPath: filePath || 'easyhook-script.js',
        filters: [
          { name: 'JavaScript', extensions: ['js'] },
          { name: 'TypeScript', extensions: ['ts'] },
          { name: 'All files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      filePath = result.filePath;
    }

    return scriptStore.writeScript(filePath, source);
  });
}

function handle(channel, handler) {
  ipcMain.handle(channel, async (event, payload) => {
    try {
      const data = await handler(event, payload);
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpc();
    createApplicationMenu();
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('before-quit', () => {
    if (fridaService) {
      fridaService.stop({ silent: true }).catch(() => {});
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
