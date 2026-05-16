---
name: byan-agent-bridge
description: "Codex bridge that exposes repository BYAN markdown agents as Codex-invokable agent prompts."
---

# BYAN Agent Bridge For Codex

This project treats `_byan/agents/*.md` as the source of truth for BYAN roles.
Codex must expose those roles through `.codex/prompts/byan-*.md` stubs and use
the stubs whenever delegating work to a background Codex subagent.

## Required Runtime Contract

1. Read `{project-root}/_byan/config.yaml` before any BYAN task.
2. Use `communication_language` for conversation with the owner.
3. Use `document_output_language` for project/product documents unless the user says otherwise.
4. Load the full BYAN agent markdown from the `agent_source` declared in the prompt stub.
5. Load optional sidecars when present:
   - `{agent-name}-soul.md`
   - `{agent-name}-tao.md`
6. Treat the BYAN markdown as the persona, rules, menu, and capability source.
7. If the BYAN activation says "display menu and wait" but the user supplied a concrete task, execute the task directly.
8. If there is no concrete task, display the BYAN menu and wait.
9. In reports, identify the work by BYAN role name, not by the generated Codex subagent nickname.
10. Never claim that Codex system nicknames are native BYAN agents. They are Codex workers running BYAN prompt stubs.

## Available BYAN Codex Prompts

- `byan-byan` -> `_byan/agents/byan.md`
- `byan-skeptic` -> `_byan/agents/skeptic.md`
- `byan-rachid` -> `_byan/agents/rachid.md`
- `byan-marc` -> `_byan/agents/marc.md`
- `byan-jimmy` -> `_byan/agents/jimmy.md`
- `byan-mike` -> `_byan/agents/mike.md`
- `byan-tao` -> `_byan/agents/tao.md`
- `byan-turbo-whisper` -> `_byan/agents/turbo-whisper.md`
- `byan-yanstaller` -> `_byan/agents/yanstaller.md`

## Delegation Template

Use this shape when spawning a Codex subagent:

```text
Load `.codex/prompts/byan-skeptic.md` and execute this task as BYAN Skeptic.
Read `_byan/config.yaml`, `_byan/agents/skeptic.md`, and optional soul/tao files.
Do not edit files unless explicitly asked. Report in Russian. Include concrete file references.

Task:
[task here]
```
