# Android Setup on Windows

EasyHook runs on Windows, but the Frida target should be the connected Android device. If EasyHook shows Windows processes, it means the local Windows Frida device was selected. Current EasyHook builds hide the local device by default and only show USB/tether devices.

## 1. Prepare Windows

Install Android platform-tools and make sure `adb.exe` is in `PATH`.

```powershell
adb version
adb devices -l
```

On the phone, enable:

- Developer options
- USB debugging
- USB debugging authorization for the Windows host

When `adb devices -l` shows `unauthorized`, unlock the phone and approve the RSA prompt.

## 2. Pick the Right frida-server

The Android `frida-server` version should match your desktop Frida client version as closely as possible.

Check the project dependency version:

```powershell
npm ls frida
```

Check Android CPU ABI:

```powershell
adb shell getprop ro.product.cpu.abilist
```

Download the matching Android server from Frida releases:

https://github.com/frida/frida/releases

Common ABI mapping:

| Android ABI | frida-server asset |
| --- | --- |
| `arm64-v8a` | `frida-server-*-android-arm64.xz` |
| `armeabi-v7a` | `frida-server-*-android-arm.xz` |
| `x86_64` | `frida-server-*-android-x86_64.xz` |
| `x86` | `frida-server-*-android-x86.xz` |

Unpack the `.xz` file on Windows before pushing it to the device.

## 3. Start frida-server

Rooted device or rooted emulator:

```powershell
adb push .\frida-server /data/local/tmp/frida-server
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "su -c /data/local/tmp/frida-server &"
```

Some emulator images allow `adb root` instead:

```powershell
adb root
adb push .\frida-server /data/local/tmp/frida-server
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "/data/local/tmp/frida-server &"
```

If the shell returns immediately, that is expected because the server is running in the background.

## 4. Smoke Test

Install Frida CLI tools if you want a command-line test:

```powershell
py -m pip install -U frida-tools
frida-ps -U
frida-ps -Uai
```

Expected result: the process/app list should contain Android packages such as `com.android.settings`, not Windows processes like `explorer.exe`.

## 5. Use EasyHook

1. Run `npm start`.
2. Click `Refresh` in the Target panel.
3. Select the Android USB/tether device.
4. Use `Attach` for already-running Android processes.
5. Use `Spawn` and enter a package name such as `com.example.app`.
6. Click `Run`.

## Common Problems

`No Android USB device found`

- Check `adb devices -l`.
- Reconnect USB and approve authorization on the phone.
- Start `frida-server` as root.
- Make sure the phone is not in charge-only USB mode.

`Unable to load process list`

- The `frida-server` process may not be running.
- The server version may not match the desktop Frida version.
- The device may not be rooted, unless you are using Frida Gadget.

`Java runtime is not available`

- You attached to a native process or attached too early.
- Use `Spawn` for the Android app package, or attach to the app process after it starts.

`Permission denied`

- Run `frida-server` through `su -c`.
- Verify the emulator/device is actually rooted.
