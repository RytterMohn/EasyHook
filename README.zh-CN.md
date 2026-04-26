# EasyHook

[English](README.en.md) | 简体中文

EasyHook 是一个面向 Android Frida 脚本的 Electron IDE。它运行在 Windows 桌面上，通过 USB/tether Frida device 连接 Android 手机或模拟器，把脚本管理、代码编辑、Android 设备/进程选择、attach/spawn、运行和日志输出放在同一个桌面应用里。

目标是减少“写一段 Frida 脚本还要再写 Python 启动器”的重复工作。

## 它 Hook 哪个程序

EasyHook 不固定 hook 某一个程序。它 hook 的目标是你在右侧 Target 面板里选择的 Android app/process。

- `Attach`: hook 已经运行中的 Android 进程
- `Spawn`: 输入 Android 包名，启动应用后立即注入脚本

默认会隐藏 Windows 本机 `local` device，避免误把 Windows 进程当成 Android 目标。

## 功能

- Electron 桌面 IDE，无前端构建步骤
- 读取单个 Frida 脚本或整个脚本目录
- 内置脚本编辑器、行号、保存和另存为
- Android USB/tether 设备枚举和进程列表
- 支持 attach 已运行 Android 进程
- 支持 spawn Android 包名后注入脚本
- 支持读取 Android installed apps 并填充包名
- Frida `send()`、脚本错误、detach 状态实时显示
- 支持向运行中的脚本 `post()` 消息
- 内置 Android 和 native hook 示例

## 快速开始

```bash
npm install
npm start
```

开发前确认本机有 Node.js 20+ 和 npm 10+。Android 设备端需要 root 或 rooted emulator，并运行匹配版本的 `frida-server`。

## 使用方式

1. 点击 `Folder` 读取一个脚本目录，或点击 `Open` 打开单个脚本。
2. 在右侧选择 Android USB/tether device。
3. 选择 `Attach` 并挑选 Android 进程，或选择 `Spawn` 并输入 Android 包名。
4. 点击 `Run` 执行当前脚本。
5. 在 `Console` 查看 `send()` 输出和错误信息。
6. 点击 `Stop` 卸载脚本并 detach。

Android 设备配置见 [docs/android-setup.md](docs/android-setup.md)。

## 项目结构

```text
EasyHook/
  src/
    main/          Electron main process and Frida lifecycle
    preload/       Safe renderer bridge
    renderer/      IDE UI
  examples/        Frida script examples
  docs/            Setup and architecture notes
  scripts/         Project maintenance scripts
```

## 命令

```bash
npm start       # run the IDE
npm run check   # syntax-check JavaScript files
npm run pack    # create an unpacked desktop build
npm run dist    # create distributable builds
```

## 仓库地址

https://github.com/RytterMohn/EasyHook

## 合规和安全

EasyHook 只能用于你拥有或已获得明确授权的设备、应用和进程。Frida 可以动态修改目标进程行为，运行未知脚本前应先审查脚本内容。

## License

MIT. See [LICENSE](LICENSE).
