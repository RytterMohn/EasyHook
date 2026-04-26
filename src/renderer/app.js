'use strict';

const api = window.easyhook;
const ANDROID_DEVICE_TYPES = new Set(['usb', 'tether']);

const initialSource = `send({
  event: 'loaded',
  pid: Process.id,
  platform: Process.platform,
  arch: Process.arch
});

rpc.exports = {
  ping(value) {
    return 'pong: ' + value;
  }
};
`;

const state = {
  currentFilePath: '',
  currentFolderPath: '',
  dirty: false,
  applications: [],
  devices: [],
  processes: [],
  scripts: [],
  running: false
};

const dom = {
  appStatus: document.querySelector('#appStatus'),
  newScriptButton: document.querySelector('#newScriptButton'),
  openScriptButton: document.querySelector('#openScriptButton'),
  openFolderButton: document.querySelector('#openFolderButton'),
  saveScriptButton: document.querySelector('#saveScriptButton'),
  saveAsScriptButton: document.querySelector('#saveAsScriptButton'),
  refreshScriptsButton: document.querySelector('#refreshScriptsButton'),
  scriptSearchInput: document.querySelector('#scriptSearchInput'),
  scriptFolderPath: document.querySelector('#scriptFolderPath'),
  scriptList: document.querySelector('#scriptList'),
  activeFileName: document.querySelector('#activeFileName'),
  activeFilePath: document.querySelector('#activeFilePath'),
  editorMeta: document.querySelector('#editorMeta'),
  lineNumbers: document.querySelector('#lineNumbers'),
  editor: document.querySelector('#editor'),
  refreshDevicesButton: document.querySelector('#refreshDevicesButton'),
  deviceSelect: document.querySelector('#deviceSelect'),
  targetModeSelect: document.querySelector('#targetModeSelect'),
  androidDeviceHint: document.querySelector('#androidDeviceHint'),
  processField: document.querySelector('#processField'),
  processSearchInput: document.querySelector('#processSearchInput'),
  processSelect: document.querySelector('#processSelect'),
  spawnField: document.querySelector('#spawnField'),
  spawnTargetInput: document.querySelector('#spawnTargetInput'),
  applicationField: document.querySelector('#applicationField'),
  applicationSearchInput: document.querySelector('#applicationSearchInput'),
  applicationSelect: document.querySelector('#applicationSelect'),
  runtimeSelect: document.querySelector('#runtimeSelect'),
  runButton: document.querySelector('#runButton'),
  stopButton: document.querySelector('#stopButton'),
  clearLogButton: document.querySelector('#clearLogButton'),
  logOutput: document.querySelector('#logOutput'),
  postMessageInput: document.querySelector('#postMessageInput'),
  postMessageButton: document.querySelector('#postMessageButton')
};

function boot() {
  dom.editor.value = initialSource;
  bindEvents();
  bindBridgeEvents();
  updateEditorMeta();
  updateFileHeader();
  refreshDevices();
  log('info', 'EasyHook is ready.');
}

function bindEvents() {
  dom.newScriptButton.addEventListener('click', newScript);
  dom.openScriptButton.addEventListener('click', openScript);
  dom.openFolderButton.addEventListener('click', openFolder);
  dom.saveScriptButton.addEventListener('click', () => saveScript(false));
  dom.saveAsScriptButton.addEventListener('click', () => saveScript(true));
  dom.refreshScriptsButton.addEventListener('click', refreshScripts);
  dom.scriptSearchInput.addEventListener('input', renderScriptList);
  dom.editor.addEventListener('input', () => {
    state.dirty = true;
    updateEditorMeta();
    updateFileHeader();
  });
  dom.editor.addEventListener('scroll', () => {
    dom.lineNumbers.scrollTop = dom.editor.scrollTop;
  });
  dom.editor.addEventListener('keydown', handleEditorKeydown);
  dom.refreshDevicesButton.addEventListener('click', refreshDevices);
  dom.deviceSelect.addEventListener('change', refreshTargetList);
  dom.processSearchInput.addEventListener('input', renderProcessOptions);
  dom.applicationSearchInput.addEventListener('input', renderApplicationOptions);
  dom.applicationSelect.addEventListener('change', () => {
    dom.spawnTargetInput.value = dom.applicationSelect.value;
  });
  dom.targetModeSelect.addEventListener('change', updateTargetMode);
  dom.runButton.addEventListener('click', runCurrentScript);
  dom.stopButton.addEventListener('click', stopCurrentScript);
  dom.clearLogButton.addEventListener('click', () => {
    dom.logOutput.textContent = '';
  });
  dom.postMessageButton.addEventListener('click', postMessageToScript);
  dom.postMessageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      postMessageToScript();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'F5' && !event.shiftKey) {
      event.preventDefault();
      runCurrentScript();
    }

    if (event.key === 'F5' && event.shiftKey) {
      event.preventDefault();
      stopCurrentScript();
    }
  });
}

function bindBridgeEvents() {
  api.events.onFridaMessage((payload) => {
    const message = payload.message || {};
    if (message.type === 'send') {
      log('success', formatPayload(message.payload));
      return;
    }

    if (message.type === 'error') {
      log('error', formatFridaError(message));
      return;
    }

    log('info', JSON.stringify(message, null, 2));
  });

  api.events.onFridaStatus((payload) => {
    setRunning(Boolean(payload.running));
    if (payload.running) {
      log('success', `Running ${payload.targetMode} target: ${payload.target}`);
    } else {
      log('warning', 'Frida session stopped.');
    }
  });

  api.events.onFridaDetached((payload) => {
    setRunning(false);
    log('warning', `Frida session detached: ${payload.reason || 'unknown'}`);
  });

  api.events.onMenuAction((action) => {
    const actions = {
      'new-script': newScript,
      'open-script': openScript,
      'open-folder': openFolder,
      'save-script': () => saveScript(false),
      'save-script-as': () => saveScript(true),
      'run-script': runCurrentScript,
      'stop-script': stopCurrentScript,
      'refresh-devices': refreshDevices,
      'refresh-processes': refreshTargetList
    };

    if (actions[action]) {
      actions[action]();
    }
  });
}

function handleEditorKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveScript(event.shiftKey);
    return;
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    const start = dom.editor.selectionStart;
    const end = dom.editor.selectionEnd;
    const value = dom.editor.value;
    dom.editor.value = `${value.slice(0, start)}  ${value.slice(end)}`;
    dom.editor.selectionStart = start + 2;
    dom.editor.selectionEnd = start + 2;
    state.dirty = true;
    updateEditorMeta();
    updateFileHeader();
  }
}

async function newScript() {
  state.currentFilePath = '';
  state.dirty = false;
  dom.editor.value = initialSource;
  updateEditorMeta();
  updateFileHeader();
  log('info', 'Created a new unsaved script.');
}

async function openScript() {
  const result = await unwrap(api.files.openScript());
  if (!result) {
    return;
  }

  loadScriptResult(result);
}

async function openFolder() {
  const result = await unwrap(api.files.selectFolder());
  if (!result) {
    return;
  }

  state.currentFolderPath = result.folderPath;
  state.scripts = result.scripts;
  dom.scriptFolderPath.textContent = result.folderPath;
  renderScriptList();
  log('info', `Loaded ${result.scripts.length} script(s).`);
}

async function refreshScripts() {
  if (!state.currentFolderPath) {
    return;
  }

  const scripts = await unwrap(api.files.listScripts(state.currentFolderPath));
  state.scripts = scripts;
  renderScriptList();
  log('info', `Refreshed ${scripts.length} script(s).`);
}

async function saveScript(saveAs) {
  const result = await unwrap(
    api.files.saveScript({
      filePath: state.currentFilePath,
      source: dom.editor.value,
      saveAs
    })
  );

  if (!result) {
    return;
  }

  state.currentFilePath = result.filePath;
  state.dirty = false;
  updateFileHeader();
  log('success', `Saved ${result.name}.`);

  if (state.currentFolderPath) {
    refreshScripts();
  }
}

async function loadScript(filePath) {
  const result = await unwrap(api.files.readScript(filePath));
  loadScriptResult(result);
}

function loadScriptResult(result) {
  state.currentFilePath = result.filePath;
  state.dirty = false;
  dom.editor.value = result.source;
  updateEditorMeta();
  updateFileHeader();
  renderScriptList();
  log('info', `Opened ${result.name}.`);
}

async function refreshDevices() {
  dom.deviceSelect.innerHTML = '<option value="">Loading...</option>';
  const devices = await unwrap(api.frida.listDevices(), { logError: false });

  if (!devices) {
    state.devices = [];
    renderDeviceOptions();
    clearTargetLists();
    updateRunControls();
    log('error', 'Unable to load Frida devices. Run npm install and check Frida setup.');
    return;
  }

  state.devices = devices.filter(isAndroidDevice);
  renderDeviceOptions();
  await refreshTargetList();
}

function renderDeviceOptions() {
  dom.deviceSelect.innerHTML = '';

  if (state.devices.length === 0) {
    const option = new Option('No Android USB device found', '');
    option.disabled = true;
    option.selected = true;
    dom.deviceSelect.add(option);
    dom.androidDeviceHint.classList.remove('ready');
    dom.androidDeviceHint.textContent = 'No Android USB/tether device found. Start frida-server on the phone, confirm adb authorization, then click Refresh.';
    return;
  }

  for (const device of state.devices) {
    const label = `${device.name} (${device.type})`;
    dom.deviceSelect.add(new Option(label, device.id));
  }

  dom.deviceSelect.selectedIndex = 0;
  dom.androidDeviceHint.classList.add('ready');
  dom.androidDeviceHint.textContent = 'Android device selected. Attach to a running package or spawn an installed package.';
}

async function refreshTargetList() {
  updateRunControls();

  if (dom.targetModeSelect.value === 'spawn') {
    await refreshApplications();
  } else {
    await refreshProcesses();
  }
}

async function refreshProcesses() {
  const deviceId = getSelectedDeviceId();
  if (!deviceId) {
    state.processes = [];
    renderProcessOptions();
    return;
  }

  dom.processSelect.innerHTML = '<option value="">Loading...</option>';
  const processes = await unwrap(api.frida.listProcesses(deviceId), { logError: false });

  if (!processes) {
    state.processes = [];
    dom.processSelect.innerHTML = '<option value="">No processes</option>';
    log('error', 'Unable to load process list for the selected device.');
    return;
  }

  state.processes = processes;
  renderProcessOptions();
}

function renderProcessOptions() {
  if (!getSelectedDeviceId()) {
    dom.processSelect.innerHTML = '';
    dom.processSelect.add(new Option('Connect an Android device first', ''));
    return;
  }

  const query = dom.processSearchInput.value.trim().toLowerCase();
  const filtered = state.processes
    .filter((processInfo) => {
      const haystack = `${processInfo.name} ${processInfo.pid}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 250);

  dom.processSelect.innerHTML = '';

  if (filtered.length === 0) {
    dom.processSelect.add(new Option('No matching processes', ''));
    return;
  }

  for (const processInfo of filtered) {
    dom.processSelect.add(new Option(`${processInfo.name} (${processInfo.pid})`, String(processInfo.pid)));
  }
}

async function refreshApplications() {
  const deviceId = getSelectedDeviceId();
  if (!deviceId) {
    state.applications = [];
    renderApplicationOptions();
    return;
  }

  dom.applicationSelect.innerHTML = '<option value="">Loading...</option>';
  const applications = await unwrap(api.frida.listApplications(deviceId), { logError: false });

  if (!applications) {
    state.applications = [];
    dom.applicationSelect.innerHTML = '<option value="">No apps available</option>';
    log('error', 'Unable to load installed Android apps from the selected device.');
    return;
  }

  state.applications = applications;
  renderApplicationOptions();
}

function renderApplicationOptions() {
  if (!getSelectedDeviceId()) {
    dom.applicationSelect.innerHTML = '';
    dom.applicationSelect.add(new Option('Connect an Android device first', ''));
    return;
  }

  const query = dom.applicationSearchInput.value.trim().toLowerCase();
  const filtered = state.applications
    .filter((application) => {
      const haystack = `${application.name} ${application.identifier}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 250);

  dom.applicationSelect.innerHTML = '';

  if (filtered.length === 0) {
    dom.applicationSelect.add(new Option('No matching apps', ''));
    return;
  }

  for (const application of filtered) {
    const pid = typeof application.pid === 'number' && application.pid > 0 ? ` pid:${application.pid}` : '';
    dom.applicationSelect.add(new Option(`${application.name} (${application.identifier})${pid}`, application.identifier));
  }
}

function updateTargetMode() {
  const spawnMode = dom.targetModeSelect.value === 'spawn';
  dom.processField.classList.toggle('hidden', spawnMode);
  dom.spawnField.classList.toggle('hidden', !spawnMode);
  dom.applicationField.classList.toggle('hidden', !spawnMode);

  refreshTargetList();
}

async function runCurrentScript() {
  const deviceId = getSelectedDeviceId();
  if (!deviceId) {
    log('error', 'Connect and select an Android USB device first.');
    return;
  }

  const targetMode = dom.targetModeSelect.value;
  const target = targetMode === 'spawn' ? dom.spawnTargetInput.value.trim() : dom.processSelect.value;

  if (!target) {
    log('error', targetMode === 'spawn' ? 'Spawn target is empty.' : 'Select a process first.');
    return;
  }

  const scriptName = state.currentFilePath ? getFileName(state.currentFilePath) : 'easyhook-script.js';
  const result = await unwrap(
    api.frida.run({
      deviceId,
      targetMode,
      target,
      runtime: dom.runtimeSelect.value,
      scriptName,
      source: dom.editor.value
    })
  );

  if (result) {
    setRunning(true);
  }
}

async function stopCurrentScript() {
  const result = await unwrap(api.frida.stop());
  if (result) {
    setRunning(false);
  }
}

async function postMessageToScript() {
  if (!state.running) {
    return;
  }

  const raw = dom.postMessageInput.value.trim();
  if (!raw) {
    return;
  }

  let payload = raw;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { type: 'easyhook-input', payload: raw };
  }

  const result = await unwrap(api.frida.post(payload));
  if (result) {
    log('info', `Posted: ${formatPayload(payload)}`);
    dom.postMessageInput.value = '';
  }
}

function setRunning(running) {
  state.running = running;
  updateRunControls();
  dom.appStatus.textContent = running ? 'Running' : state.dirty ? 'Modified' : 'Idle';
}

function updateRunControls() {
  const hasDevice = Boolean(getSelectedDeviceId());
  dom.runButton.disabled = state.running || !hasDevice;
  dom.stopButton.disabled = !state.running;
  dom.postMessageButton.disabled = !state.running;
}

function clearTargetLists() {
  state.processes = [];
  state.applications = [];
  renderProcessOptions();
  renderApplicationOptions();
}

function getSelectedDeviceId() {
  return dom.deviceSelect.value || '';
}

function isAndroidDevice(device) {
  return Boolean(device && (device.isUsb || ANDROID_DEVICE_TYPES.has(device.type)));
}

function renderScriptList() {
  const query = dom.scriptSearchInput.value.trim().toLowerCase();
  const scripts = state.scripts.filter((script) => script.relativePath.toLowerCase().includes(query));

  dom.scriptList.textContent = '';

  if (scripts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = state.currentFolderPath ? 'No scripts found.' : 'Open a folder to load scripts.';
    dom.scriptList.append(empty);
    return;
  }

  for (const script of scripts) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'script-item';
    if (script.path === state.currentFilePath) {
      item.classList.add('active');
    }

    const title = document.createElement('strong');
    title.textContent = script.name;
    const detail = document.createElement('span');
    detail.textContent = script.relativePath;

    item.append(title, detail);
    item.addEventListener('click', () => loadScript(script.path));
    dom.scriptList.append(item);
  }
}

function updateEditorMeta() {
  const lines = dom.editor.value.length === 0 ? 1 : dom.editor.value.split('\n').length;
  const bytes = new Blob([dom.editor.value]).size;
  dom.editorMeta.textContent = `${lines} lines / ${formatBytes(bytes)}`;
  dom.lineNumbers.textContent = Array.from({ length: lines }, (_value, index) => String(index + 1)).join('\n');
}

function updateFileHeader() {
  const name = state.currentFilePath ? getFileName(state.currentFilePath) : 'Untitled';
  dom.activeFileName.textContent = `${name}${state.dirty ? ' *' : ''}`;
  dom.activeFilePath.textContent = state.currentFilePath || 'Unsaved script';

  if (!state.running) {
    dom.appStatus.textContent = state.dirty ? 'Modified' : 'Idle';
  }
}

async function unwrap(promise, options = {}) {
  const response = await promise;
  if (response.ok) {
    return response.data;
  }

  if (options.logError !== false) {
    log('error', response.error ? response.error.message : 'Unknown error.');
  }
  return null;
}

function log(type, message) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  dom.logOutput.append(entry);
  dom.logOutput.scrollTop = dom.logOutput.scrollHeight;
}

function formatFridaError(message) {
  const parts = [message.description || 'Frida script error'];
  if (message.stack) {
    parts.push(message.stack);
  } else if (message.fileName) {
    parts.push(`${message.fileName}:${message.lineNumber || 0}:${message.columnNumber || 0}`);
  }
  return parts.join('\n');
}

function formatPayload(payload) {
  if (typeof payload === 'string') {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
}

function getFileName(filePath) {
  return filePath.split(/[\\/]/).pop() || filePath;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

boot();
