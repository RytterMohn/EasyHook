# Security Policy

EasyHook is a Frida IDE and can inject scripts into running processes. Use it only on targets where you have permission.

## Reporting Issues

Please do not open public issues for exploitable vulnerabilities. Report them privately to the project maintainers. If this repository is forked, configure a private security contact in your fork.

## Supported Versions

The project is pre-1.0. Security fixes are expected to land on the main development branch.

## Local Risks

- Scripts can inspect or modify target process memory.
- Scripts may expose sensitive runtime data in logs.
- Device and process names may reveal local environment details.
- Running unknown scripts is equivalent to running untrusted code against a target process.

Review scripts before running them.
