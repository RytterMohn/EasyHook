# Contributing

Thanks for helping improve EasyHook.

## Development

```bash
npm install
npm start
```

Run the syntax checker before opening a pull request:

```bash
npm run check
```

## Pull Requests

- Keep changes focused.
- Include screenshots or short recordings for UI changes.
- Add or update examples and docs when behavior changes.
- Avoid committing generated release artifacts.

## Code Style

- Use CommonJS in the Electron main and preload code for now.
- Keep renderer code dependency-light unless a new dependency clearly improves the IDE.
- Prefer small IPC payloads and explicit error messages.
- Clean up Frida sessions when replacing or stopping a script.
