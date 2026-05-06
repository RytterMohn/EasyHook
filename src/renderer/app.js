'use strict';

const api = window.easyhook;
const ANDROID_DEVICE_TYPES = new Set(['usb', 'tether']);
const DEFAULT_LANGUAGE = 'en';

const translations = {
  en: {
    'language.button': '中文',
    'language.buttonTitle': 'Switch to Chinese',
    'status.idle': 'Idle',
    'status.modified': 'Modified',
    'status.running': 'Running',
    'common.loading': 'Loading...',
    'common.refresh': 'Refresh',
    'common.unknown': 'unknown',
    'toolbar.new': 'New',
    'toolbar.open': 'Open',
    'toolbar.folder': 'Folder',
    'toolbar.save': 'Save',
    'toolbar.saveAs': 'Save As',
    'sidebar.scripts': 'Scripts',
    'sidebar.refreshTitle': 'Refresh scripts',
    'sidebar.searchPlaceholder': 'Search scripts',
    'sidebar.noFolder': 'No folder selected',
    'sidebar.noScripts': 'No scripts found.',
    'sidebar.openFolder': 'Open a folder to load scripts.',
    'editor.untitled': 'Untitled',
    'editor.unsaved': 'Unsaved script',
    'editor.meta': '{lines} lines / {bytes}',
    'target.title': 'Target',
    'target.androidDevice': 'Android device',
    'target.initialHint': 'Connect an Android device, start frida-server, then click Refresh.',
    'target.mode': 'Mode',
    'target.attach': 'Attach',
    'target.spawn': 'Spawn',
    'target.process': 'Running Android process',
    'target.processPlaceholder': 'Filter package or PID',
    'target.package': 'Android package',
    'target.apps': 'Installed apps',
    'target.appsPlaceholder': 'Filter installed apps',
    'target.runtime': 'Runtime',
    'target.defaultRuntime': 'Default',
    'run.run': 'Run',
    'run.stop': 'Stop',
    'console.title': 'Console',
    'console.clear': 'Clear',
    'console.post': 'Post',
    'devices.none': 'No Android USB device found',
    'devices.noneHint': 'No Android USB/tether device found. Start frida-server on the phone, confirm adb authorization, then click Refresh.',
    'devices.readyHint': 'Android device selected. Attach to a running package or spawn an installed package.',
    'processes.none': 'No processes',
    'processes.connectFirst': 'Connect an Android device first',
    'processes.noMatching': 'No matching processes',
    'apps.none': 'No apps available',
    'apps.connectFirst': 'Connect an Android device first',
    'apps.noMatching': 'No matching apps',
    'log.ready': 'EasyHook is ready.',
    'log.runningTarget': 'Running {mode} target: {target}',
    'log.fridaStopped': 'Frida session stopped.',
    'log.fridaDetached': 'Frida session detached: {reason}',
    'log.createdScript': 'Created a new unsaved script.',
    'log.loadedScripts': 'Loaded {count} script(s).',
    'log.refreshedScripts': 'Refreshed {count} script(s).',
    'log.savedScript': 'Saved {name}.',
    'log.openedScript': 'Opened {name}.',
    'log.devicesLoadError': 'Unable to load Frida devices. Run npm install and check Frida setup.',
    'log.processesLoadError': 'Unable to load process list for the selected device.',
    'log.appsLoadError': 'Unable to load installed Android apps from the selected device.',
    'log.connectDeviceFirst': 'Connect and select an Android USB device first.',
    'log.emptySpawnTarget': 'Spawn target is empty.',
    'log.emptyAttachTarget': 'Select a process first.',
    'log.posted': 'Posted: {payload}',
    'log.unknownError': 'Unknown error.',
    'log.fridaScriptError': 'Frida script error'
  },
  zh: {
    'language.button': 'English',
    'language.buttonTitle': 'Switch to English',
    'status.idle': '空闲',
    'status.modified': '已修改',
    'status.running': '运行中',
    'common.loading': '加载中...',
    'common.refresh': '刷新',
    'common.unknown': '未知',
    'toolbar.new': '新建',
    'toolbar.open': '打开',
    'toolbar.folder': '文件夹',
    'toolbar.save': '保存',
    'toolbar.saveAs': '另存为',
    'sidebar.scripts': '脚本',
    'sidebar.refreshTitle': '刷新脚本',
    'sidebar.searchPlaceholder': '搜索脚本',
    'sidebar.noFolder': '未选择文件夹',
    'sidebar.noScripts': '未找到脚本。',
    'sidebar.openFolder': '打开文件夹以加载脚本。',
    'editor.untitled': '未命名',
    'editor.unsaved': '未保存脚本',
    'editor.meta': '{lines} 行 / {bytes}',
    'target.title': '目标',
    'target.androidDevice': 'Android 设备',
    'target.initialHint': '连接 Android 设备，启动 frida-server，然后点击刷新。',
    'target.mode': '模式',
    'target.attach': '附加',
    'target.spawn': '启动',
    'target.process': '运行中的 Android 进程',
    'target.processPlaceholder': '按包名或 PID 过滤',
    'target.package': 'Android 包名',
    'target.apps': '已安装应用',
    'target.appsPlaceholder': '过滤已安装应用',
    'target.runtime': '运行时',
    'target.defaultRuntime': '默认',
    'run.run': '运行',
    'run.stop': '停止',
    'console.title': '控制台',
    'console.clear': '清空',
    'console.post': '发送',
    'devices.none': '未找到 Android USB 设备',
    'devices.noneHint': '未找到 Android USB/tether 设备。请在手机上启动 frida-server，确认 adb 授权，然后点击刷新。',
    'devices.readyHint': '已选择 Android 设备。可以附加到运行中的包，或启动已安装包。',
    'processes.none': '无进程',
    'processes.connectFirst': '请先连接 Android 设备',
    'processes.noMatching': '没有匹配的进程',
    'apps.none': '无可用应用',
    'apps.connectFirst': '请先连接 Android 设备',
    'apps.noMatching': '没有匹配的应用',
    'log.ready': 'EasyHook 已就绪。',
    'log.runningTarget': '正在以{mode}模式运行目标：{target}',
    'log.fridaStopped': 'Frida 会话已停止。',
    'log.fridaDetached': 'Frida 会话已断开：{reason}',
    'log.createdScript': '已创建新的未保存脚本。',
    'log.loadedScripts': '已加载 {count} 个脚本。',
    'log.refreshedScripts': '已刷新 {count} 个脚本。',
    'log.savedScript': '已保存 {name}。',
    'log.openedScript': '已打开 {name}。',
    'log.devicesLoadError': '无法加载 Frida 设备。请运行 npm install 并检查 Frida 配置。',
    'log.processesLoadError': '无法加载所选设备的进程列表。',
    'log.appsLoadError': '无法从所选设备加载已安装的 Android 应用。',
    'log.connectDeviceFirst': '请先连接并选择 Android USB 设备。',
    'log.emptySpawnTarget': '启动目标为空。',
    'log.emptyAttachTarget': '请先选择进程。',
    'log.posted': '已发送：{payload}',
    'log.unknownError': '未知错误。',
    'log.fridaScriptError': 'Frida 脚本错误'
  }
};

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
  language: DEFAULT_LANGUAGE,
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
  languageToggleButton: document.querySelector('#languageToggleButton'),
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

function t(key, params = {}) {
  const dictionary = translations[state.language] || translations[DEFAULT_LANGUAGE];
  const fallback = translations[DEFAULT_LANGUAGE][key] || key;
  const template = dictionary[key] || fallback;
  return template.replace(/\{(\w+)\}/g, (_match, name) => {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`;
  });
}

function applyLanguage(options = {}) {
  const rerenderDynamic = options.rerenderDynamic !== false;
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';

  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of document.querySelectorAll('[data-i18n-title]')) {
    element.title = t(element.dataset.i18nTitle);
  }

  for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }

  if (rerenderDynamic) {
    updateLocalizedDynamicContent();
  }
}

function toggleLanguage() {
  state.language = state.language === 'en' ? 'zh' : 'en';
  applyLanguage();
}

function updateLocalizedDynamicContent() {
  if (!state.currentFolderPath) {
    dom.scriptFolderPath.textContent = t('sidebar.noFolder');
  }

  updateEditorMeta();
  updateFileHeader();
  renderScriptList();
  updateDeviceLanguageText();
  rerenderSelectPreservingValue(dom.processSelect, renderProcessOptions);
  rerenderSelectPreservingValue(dom.applicationSelect, renderApplicationOptions);
}

function rerenderSelectPreservingValue(select, renderOptions) {
  const selectedValue = select.value;
  renderOptions();

  if (Array.from(select.options).some((option) => option.value === selectedValue)) {
    select.value = selectedValue;
  }
}

function setSelectMessage(select, message, options = {}) {
  select.innerHTML = '';

  const option = new Option(message, '');
  if (options.disabled) {
    option.disabled = true;
  }
  option.selected = true;
  select.add(option);
}

function updateStatusText() {
  dom.appStatus.textContent = state.running ? t('status.running') : state.dirty ? t('status.modified') : t('status.idle');
}

function boot() {
  dom.editor.value = initialSource;
  bindEvents();
  bindBridgeEvents();
  applyLanguage({ rerenderDynamic: false });
  updateEditorMeta();
  updateFileHeader();
  refreshDevices();
  log('info', t('log.ready'));
}

function bindEvents() {
  dom.newScriptButton.addEventListener('click', newScript);
  dom.openScriptButton.addEventListener('click', openScript);
  dom.openFolderButton.addEventListener('click', openFolder);
  dom.saveScriptButton.addEventListener('click', () => saveScript(false));
  dom.saveAsScriptButton.addEventListener('click', () => saveScript(true));
  dom.languageToggleButton.addEventListener('click', toggleLanguage);
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

    if (message.type === 'log') {
      log(formatLogLevel(message.level), formatPayload(message.payload));
      return;
    }

    log('info', JSON.stringify(message, null, 2));
  });

  api.events.onFridaStatus((payload) => {
    setRunning(Boolean(payload.running));
    if (payload.running) {
      log('success', t('log.runningTarget', { mode: formatTargetModeForLog(payload.targetMode), target: payload.target }));
    } else {
      log('warning', t('log.fridaStopped'));
    }
  });

  api.events.onFridaDetached((payload) => {
    setRunning(false);
    log('warning', t('log.fridaDetached', { reason: payload.reason || t('common.unknown') }));
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
  log('info', t('log.createdScript'));
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
  log('info', t('log.loadedScripts', { count: result.scripts.length }));
}

async function refreshScripts() {
  if (!state.currentFolderPath) {
    return;
  }

  const scripts = await unwrap(api.files.listScripts(state.currentFolderPath));
  state.scripts = scripts;
  renderScriptList();
  log('info', t('log.refreshedScripts', { count: scripts.length }));
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
  log('success', t('log.savedScript', { name: result.name }));

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
  log('info', t('log.openedScript', { name: result.name }));
}

async function refreshDevices() {
  setSelectMessage(dom.deviceSelect, t('common.loading'));
  const devices = await unwrap(api.frida.listDevices(), { logError: false });

  if (!devices) {
    state.devices = [];
    renderDeviceOptions();
    clearTargetLists();
    updateRunControls();
    log('error', t('log.devicesLoadError'));
    return;
  }

  state.devices = devices.filter(isAndroidDevice);
  renderDeviceOptions();
  await refreshTargetList();
}

function renderDeviceOptions() {
  dom.deviceSelect.innerHTML = '';

  if (state.devices.length === 0) {
    const option = new Option(t('devices.none'), '');
    option.disabled = true;
    option.selected = true;
    dom.deviceSelect.add(option);
    dom.androidDeviceHint.classList.remove('ready');
    dom.androidDeviceHint.textContent = t('devices.noneHint');
    return;
  }

  for (const device of state.devices) {
    const label = `${device.name} (${device.type})`;
    dom.deviceSelect.add(new Option(label, device.id));
  }

  dom.deviceSelect.selectedIndex = 0;
  dom.androidDeviceHint.classList.add('ready');
  dom.androidDeviceHint.textContent = t('devices.readyHint');
}

function updateDeviceLanguageText() {
  if (state.devices.length === 0) {
    if (dom.deviceSelect.options.length === 0) {
      setSelectMessage(dom.deviceSelect, t('devices.none'), { disabled: true });
    } else if (dom.deviceSelect.options.length === 1 && dom.deviceSelect.options[0].value === '') {
      dom.deviceSelect.options[0].textContent = t('devices.none');
    }

    dom.androidDeviceHint.classList.remove('ready');
    dom.androidDeviceHint.textContent = t('devices.noneHint');
    return;
  }

  dom.androidDeviceHint.classList.add('ready');
  dom.androidDeviceHint.textContent = t('devices.readyHint');
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

  setSelectMessage(dom.processSelect, t('common.loading'));
  const processes = await unwrap(api.frida.listProcesses(deviceId), { logError: false });

  if (!processes) {
    state.processes = [];
    setSelectMessage(dom.processSelect, t('processes.none'));
    log('error', t('log.processesLoadError'));
    return;
  }

  state.processes = processes;
  renderProcessOptions();
}

function renderProcessOptions() {
  if (!getSelectedDeviceId()) {
    dom.processSelect.innerHTML = '';
    dom.processSelect.add(new Option(t('processes.connectFirst'), ''));
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
    dom.processSelect.add(new Option(t('processes.noMatching'), ''));
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

  setSelectMessage(dom.applicationSelect, t('common.loading'));
  const applications = await unwrap(api.frida.listApplications(deviceId), { logError: false });

  if (!applications) {
    state.applications = [];
    setSelectMessage(dom.applicationSelect, t('apps.none'));
    log('error', t('log.appsLoadError'));
    return;
  }

  state.applications = applications;
  renderApplicationOptions();
}

function renderApplicationOptions() {
  if (!getSelectedDeviceId()) {
    dom.applicationSelect.innerHTML = '';
    dom.applicationSelect.add(new Option(t('apps.connectFirst'), ''));
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
    dom.applicationSelect.add(new Option(t('apps.noMatching'), ''));
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
    log('error', t('log.connectDeviceFirst'));
    return;
  }

  const targetMode = dom.targetModeSelect.value;
  const target = targetMode === 'spawn' ? dom.spawnTargetInput.value.trim() : dom.processSelect.value;

  if (!target) {
    log('error', targetMode === 'spawn' ? t('log.emptySpawnTarget') : t('log.emptyAttachTarget'));
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
    log('info', t('log.posted', { payload: formatPayload(payload) }));
    dom.postMessageInput.value = '';
  }
}

function setRunning(running) {
  state.running = running;
  updateRunControls();
  updateStatusText();
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
    empty.textContent = state.currentFolderPath ? t('sidebar.noScripts') : t('sidebar.openFolder');
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
  dom.editorMeta.textContent = t('editor.meta', { lines, bytes: formatBytes(bytes) });
  dom.lineNumbers.textContent = Array.from({ length: lines }, (_value, index) => String(index + 1)).join('\n');
}

function updateFileHeader() {
  const name = state.currentFilePath ? getFileName(state.currentFilePath) : t('editor.untitled');
  dom.activeFileName.textContent = `${name}${state.dirty ? ' *' : ''}`;
  dom.activeFilePath.textContent = state.currentFilePath || t('editor.unsaved');
  updateStatusText();
}

async function unwrap(promise, options = {}) {
  const response = await promise;
  if (response.ok) {
    return response.data;
  }

  if (options.logError !== false) {
    log('error', response.error ? response.error.message : t('log.unknownError'));
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
  const parts = [message.description || t('log.fridaScriptError')];
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

function formatTargetModeForLog(mode) {
  if (state.language === 'zh') {
    if (mode === 'attach') {
      return t('target.attach');
    }

    if (mode === 'spawn') {
      return t('target.spawn');
    }
  }

  return mode;
}

function formatLogLevel(level) {
  if (level === 'warning') {
    return 'warning';
  }

  if (level === 'error') {
    return 'error';
  }

  return 'info';
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
