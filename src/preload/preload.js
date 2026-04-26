'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel, payload) {
  return ipcRenderer.invoke(channel, payload);
}

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('easyhook', {
  frida: {
    listDevices: () => invoke('frida:list-devices'),
    listProcesses: (deviceId) => invoke('frida:list-processes', deviceId),
    listApplications: (deviceId) => invoke('frida:list-applications', deviceId),
    run: (options) => invoke('frida:run', options),
    stop: () => invoke('frida:stop'),
    post: (payload) => invoke('frida:post', payload)
  },
  files: {
    openScript: () => invoke('files:open-script'),
    selectFolder: () => invoke('files:select-folder'),
    listScripts: (folderPath) => invoke('files:list-scripts', folderPath),
    readScript: (filePath) => invoke('files:read-script', filePath),
    saveScript: (payload) => invoke('files:save-script', payload)
  },
  events: {
    onFridaMessage: (callback) => subscribe('frida:message', callback),
    onFridaStatus: (callback) => subscribe('frida:status', callback),
    onFridaDetached: (callback) => subscribe('frida:detached', callback),
    onMenuAction: (callback) => subscribe('menu:action', callback)
  }
});
