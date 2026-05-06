'use strict';

class FridaService {
  constructor(emit) {
    this.emit = emit;
    this.frida = null;
    this.current = null;
  }

  loadFrida() {
    if (this.frida) {
      return this.frida;
    }

    try {
      this.frida = require('frida');
      return this.frida;
    } catch (error) {
      const message = [
        'Frida Node binding is not available.',
        'Run `npm install` first, and make sure your Node/Electron platform is supported.',
        `Original error: ${error.message}`
      ].join(' ');
      throw new Error(message);
    }
  }

  async listDevices() {
    const frida = this.loadFrida();
    const devices = await frida.enumerateDevices();

    return devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type,
      isUsb: device.type === 'usb' || device.type === 'tether'
    }));
  }

  async listProcesses(deviceId) {
    const device = await this.getDevice(deviceId);
    const processes = await device.enumerateProcesses();

    return processes
      .map((processInfo) => ({
        pid: processInfo.pid,
        name: processInfo.name,
        parameters: processInfo.parameters || {}
      }))
      .sort((left, right) => {
        const byName = left.name.localeCompare(right.name);
        return byName || left.pid - right.pid;
      });
  }

  async listApplications(deviceId) {
    const device = await this.getDevice(deviceId);

    if (typeof device.enumerateApplications !== 'function') {
      return [];
    }

    const applications = await device.enumerateApplications();

    return applications
      .map((application) => ({
        identifier: application.identifier || application.id || '',
        name: application.name || application.identifier || application.id || 'Unknown',
        pid: typeof application.pid === 'number' ? application.pid : null,
        parameters: application.parameters || {}
      }))
      .filter((application) => application.identifier)
      .sort((left, right) => {
        const byName = left.name.localeCompare(right.name);
        return byName || left.identifier.localeCompare(right.identifier);
      });
  }

  async run(options) {
    const normalized = this.normalizeRunOptions(options);
    await this.stop({ silent: true });

    const device = await this.getDevice(normalized.deviceId);
    const sessionState = {
      device,
      pid: null,
      resumed: false,
      script: null,
      session: null,
      target: normalized.target,
      targetMode: normalized.targetMode,
      startedAt: new Date().toISOString()
    };

    try {
      let attachTarget = normalized.target;
      if (normalized.targetMode === 'attach' && /^\d+$/.test(attachTarget)) {
        attachTarget = Number(attachTarget);
      }

      if (normalized.targetMode === 'spawn') {
        sessionState.pid = await device.spawn([normalized.target]);
        attachTarget = sessionState.pid;
      }

      sessionState.session = await device.attach(attachTarget);
      sessionState.session.detached.connect((reason, crash) => {
        this.current = null;
        this.emit('frida:detached', {
          reason,
          crash: crash || null,
          at: new Date().toISOString()
        });
      });

      const scriptOptions = { name: normalized.scriptName };
      if (normalized.runtime !== 'default') {
        scriptOptions.runtime = normalized.runtime;
      }

      sessionState.script = await sessionState.session.createScript(normalized.source, scriptOptions);
      sessionState.script.logHandler = (level, text) => {
        this.emit('frida:message', {
          message: {
            type: 'log',
            level,
            payload: text
          },
          data: null,
          at: new Date().toISOString()
        });
      };

      sessionState.script.message.connect((message, data) => {
        this.emit('frida:message', {
          message,
          data: data ? Buffer.from(data).toString('base64') : null,
          at: new Date().toISOString()
        });
      });

      await sessionState.script.load();

      if (normalized.targetMode === 'spawn') {
        await device.resume(sessionState.pid);
        sessionState.resumed = true;
      }

      this.current = sessionState;
      this.emit('frida:status', {
        running: true,
        pid: sessionState.pid,
        target: sessionState.target,
        targetMode: sessionState.targetMode,
        startedAt: sessionState.startedAt
      });

      return {
        running: true,
        pid: sessionState.pid,
        target: sessionState.target,
        targetMode: sessionState.targetMode
      };
    } catch (error) {
      await this.cleanupSession(sessionState);
      throw error;
    }
  }

  async stop(options = {}) {
    if (!this.current) {
      return { running: false };
    }

    const state = this.current;
    this.current = null;
    await this.cleanupSession(state);

    if (!options.silent) {
      this.emit('frida:status', {
        running: false,
        stoppedAt: new Date().toISOString()
      });
    }

    return { running: false };
  }

  async post(payload) {
    if (!this.current || !this.current.script) {
      throw new Error('No Frida script is running.');
    }

    this.current.script.post(payload);
    return { posted: true };
  }

  async getDevice(deviceId) {
    const frida = this.loadFrida();

    if (!deviceId) {
      throw new Error('Select a connected Android USB device first.');
    }

    if (deviceId === 'local') {
      return frida.getLocalDevice();
    }

    if (deviceId === 'usb') {
      return frida.getUsbDevice({ timeout: 5 });
    }

    const devices = await frida.enumerateDevices();
    const device = devices.find((candidate) => candidate.id === deviceId);
    if (!device) {
      throw new Error(`Frida device not found: ${deviceId}`);
    }

    return device;
  }

  normalizeRunOptions(options = {}) {
    const source = String(options.source || '');
    const targetMode = options.targetMode === 'spawn' ? 'spawn' : 'attach';
    const target = String(options.target || '').trim();
    const runtime = ['default', 'qjs', 'v8'].includes(options.runtime) ? options.runtime : 'default';

    if (!source.trim()) {
      throw new Error('Script source is empty.');
    }

    if (!target) {
      throw new Error(targetMode === 'spawn' ? 'Spawn target is required.' : 'Attach target is required.');
    }

    if (!options.deviceId) {
      throw new Error('Select a connected Android USB device first.');
    }

    return {
      source,
      target,
      targetMode,
      runtime,
      deviceId: options.deviceId,
      scriptName: options.scriptName || 'easyhook-script.js'
    };
  }

  async cleanupSession(state) {
    if (!state) {
      return;
    }

    if (state.script) {
      try {
        await state.script.unload();
      } catch (error) {
        this.emit('frida:message', {
          message: {
            type: 'error',
            description: `Failed to unload script: ${error.message}`
          },
          data: null,
          at: new Date().toISOString()
        });
      }
    }

    if (state.session) {
      try {
        await state.session.detach();
      } catch (error) {
        this.emit('frida:message', {
          message: {
            type: 'error',
            description: `Failed to detach session: ${error.message}`
          },
          data: null,
          at: new Date().toISOString()
        });
      }
    }
  }
}

module.exports = { FridaService };
