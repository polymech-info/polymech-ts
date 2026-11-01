# Git Changes Summary

Generated: 2026-05-13 16:41 W. Europe Daylight Time

## Overview

This change set implements the `run` shell-execution tool end-to-end, moves its validation/execution code into a dedicated `src/llm/tools/run/` module, wires live stdout/stderr streaming into the chat UI, and adds integration tests for both direct tool execution and an agent-driven CLI-app workflow.

Approximate tracked diff: **31 files changed**, **472 insertions**, **1,527 deletions**. Several generated binaries, build outputs, logs, and test fixture files are also modified or untracked.

## Main functional changes

### Run tool implementation

- Replaces the previous placeholder `run` implementation with a self-contained executable tool module:
  - `packages/media/cpp/src/llm/tools/run/RunTool.cpp`
  - `packages/media/cpp/src/llm/tools/run/RunTool.hpp`
  - `packages/media/cpp/src/llm/tools/run/RunValidators.cpp`
  - `packages/media/cpp/src/llm/tools/run/RunValidators.hpp`
- Adds shell detection for Windows and POSIX:
  - Windows: `pwsh`, Windows PowerShell, `cmd`, Git Bash fallback.
  - POSIX: `$SHELL`, `/bin/bash`, `/bin/sh`, `pwsh`.
- Executes commands with captured stdout/stderr.
- Supports configurable timeout with a hard cap of 120 seconds.
- Normalizes CRLF output and tail-truncates large output to 128 KB.
- Treats command non-zero exit codes as successful tool execution while preserving `exit_code` in the result envelope.
- Adds cancellation/termination support for active shell child processes via `abort_active_run()`.

### Security validators

- Moves validator logic from deleted files:
  - `src/llm/run_tool_validators.cpp`
  - `src/llm/run_tool_validators.hpp`
- New validators remain under `src/llm/tools/run/RunValidators.*`.
- Deny-tier patterns include:
  - download cradles such as `curl | bash` and `iwr | iex`
  - encoded commands
  - nested shell execution
  - privilege escalation
  - recursive system deletes
  - Windows registry writes
  - COM object execution
  - WMI/CIM process creation
  - `Add-Type`
  - scheduled task creation
  - PowerShell module install
  - dynamic invoke / `Invoke-Expression`
  - system download utilities such as `certutil -urlcache`
- Warn-tier patterns are logged and currently allowed by the new implementation.

### Tool executor integration

- `path_tool_executor.cpp` now dispatches `run` to `media::llm::run::execute(...)`.
- `tool_executor.cpp` forwards `llm tools-call --name run` directly to the self-contained run tool.
- `CMakeLists.txt` updated to compile/install the new run tool source/header files.
- `agent_scheduler.cpp` now aborts active shell commands during scheduler shutdown.

### Chat UI streaming support

- Adds a new chat entry role: `shell`.
- Streams run-tool stdout/stderr chunks into the chat transcript in real time.
- Adds `appendRunChunk(runId, chunk, stream)` to the chat store.
- Renders shell output in a monospace transcript bubble with stderr highlighted.
- Treats `shell` entries like tool entries for avatar/body/copy styling.
- Adds `Run Command` to the tool list and i18n labels for EN, FR, ES, IT, PT, and DE.
- Stop/cancel handling now aborts active shell child processes in addition to TTS and scheduler tasks.

## Tests and scripts

### Direct run-tool integration test

- Extracts the previous inline run-tool test suite from `test-media.mjs` into:
  - `packages/media/cpp/orchestrator/test-run-tool.mjs`
- Keeps `test-media.mjs --run-tool-only` support by importing `suiteRunTool(...)`.
- Adds assertions for:
  - deny-tier validator matrix
  - basic stdout capture via `echo`
  - non-zero command exit code reporting
  - stderr capture
  - timeout enforcement

### Agent CLI-app integration test

- Adds:
  - `packages/media/cpp/orchestrator/test-run-tool-agent.mjs`
- New npm script:
  - `test:tools:run:cli-app`
- The test asks the live agent to scaffold a TypeScript/yargs CLI app, use the `run` tool for `npm install`, then verifies the generated app outputs `FOLDER_SIZE_BYTES=<number>`.

### Test fixture/output files

Untracked test-related files include:

- `packages/media/cpp/tests/run/` TypeScript CLI fixture/build output.
- `packages/media/cpp/tests/test-report-last.md`.
- `packages/media/cpp/dry-run-stdout.txt`.
- `packages/media/cpp/dry-run-stderr.txt`.

Note: `packages/media/cpp/tests/run/yt-dlp.exe` is an untracked binary in the test fixture directory and should be reviewed before committing.

## Build/package changes

- `packages/media/cpp/package.json`
  - Adds `test:tools:run:cli-app`.
- `packages/media/cpp/package-lock.json`
  - Large dependency-lock update, likely from test fixture or package install activity.
- `packages/media/cpp/.gitignore`
  - Adds `tests/run-tool`.
- Generated distribution files changed:
  - `dist/chat.html`
  - `dist/viewer.html`
  - `dist/pm-image.exe`
  - `dist/pm-viewer.exe`
  - `dist/sparse/pm-image.exe`
  - `dist/sparse/pm-viewer.exe`

## Other repository changes

- Deletes the `mono-next/` package files:
  - `.gitignore`
  - `.npmignore`
  - `LICENSE`
  - `README.md`
  - `package.json`
  - `src/.gitignore`
- `packages/media/cpp/agent.json` has a large reduction in content.

## Files changed by area

### Core C++

- `packages/media/cpp/CMakeLists.txt`
- `packages/media/cpp/src/llm/agent_factory.cpp`
- `packages/media/cpp/src/llm/agent_scheduler.cpp`
- `packages/media/cpp/src/llm/path_tool_executor.cpp`
- `packages/media/cpp/src/llm/path_tool_executor.hpp`
- `packages/media/cpp/src/llm/tool_executor.cpp`
- `packages/media/cpp/src/llm/tools/run/RunTool.cpp`
- `packages/media/cpp/src/llm/tools/run/RunTool.hpp`
- `packages/media/cpp/src/llm/tools/run/RunValidators.cpp`
- `packages/media/cpp/src/llm/tools/run/RunValidators.hpp`

### Chat frontend / UI host

- `packages/media/cpp/apps/chat-next/src/pm-chat/ChatTranscript.tsx`
- `packages/media/cpp/apps/chat-next/src/pm-chat/PastSessionsSidebar.tsx`
- `packages/media/cpp/apps/chat-next/src/pm-chat/PmImageChatComposer.tsx`
- `packages/media/cpp/apps/chat-next/src/pm-chat/i18n.js`
- `packages/media/cpp/apps/chat-next/src/pm-chat/pmChatStore.ts`
- `packages/media/cpp/src/win/ui_next/ChatWebPanel.cpp`

### Orchestrator/tests

- `packages/media/cpp/orchestrator/test-media.mjs`
- `packages/media/cpp/orchestrator/test-run-tool.mjs`
- `packages/media/cpp/orchestrator/test-run-tool-agent.mjs`
- `packages/media/cpp/tests/run/**`

## Review notes

- Confirm whether generated binaries and `dist/*.html` should be committed.
- Confirm whether `packages/media/cpp/tests/run/yt-dlp.exe` belongs in source control.
- Confirm whether `dry-run-stdout.txt`, `dry-run-stderr.txt`, and `tests/test-report-last.md` should be committed or ignored.
- Review `package-lock.json` changes to ensure they are intentional and not from the generated test app.
- Review deletion of `mono-next/` to confirm it is intentional.
