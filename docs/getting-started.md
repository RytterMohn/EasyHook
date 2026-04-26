# Getting Started

EasyHook lets you write and run Frida scripts from an Electron desktop IDE. The app uses the `frida` Node.js package, so you do not need to write a Python launcher for every script.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A target process you are authorized to inspect
- For Android targets: a rooted device/emulator with a matching `frida-server` running on the device

## Install

```bash
npm install
npm start
```

## Attach Flow

1. Start EasyHook.
2. Open a script file or script folder.
3. Select the Android USB/tether device.
4. Select `Attach`.
5. Pick a running Android process.
6. Click `Run`.

## Spawn Flow

1. Select the Android USB/tether device.
2. Select `Spawn`.
3. Enter the Android package name, or pick one from installed apps if available.
4. Click `Run`.

For Android this is usually a package name such as `com.example.app`.

## Android Notes

EasyHook is designed to run on Windows while targeting Android over USB. It does not hook a fixed program. It hooks whichever Android process/package you select in the Target panel.

The `frida-server` version on the device should match the desktop Frida client version as closely as possible.

Common setup commands:

```bash
adb devices
adb push frida-server /data/local/tmp/frida-server
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "su -c /data/local/tmp/frida-server &"
```

If the app cannot list USB devices, check that the device is trusted, `adb devices` can see it, and `frida-server` is running. See [Android Setup on Windows](./android-setup.md) for the full setup flow.

## Script Messages

Use `send()` inside a Frida script to print structured output in EasyHook:

```js
send({ event: 'loaded', pid: Process.id });
```

Use the `Post` field in EasyHook to send messages to a running script. Frida scripts can receive them with `recv()`:

```js
recv(function (message) {
  send({ event: 'message-from-ui', message: message });
});
```
