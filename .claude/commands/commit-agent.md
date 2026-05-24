# Commit Agent

Analyze all pending changes in this monorepo and execute atomic, logical git commits with high-quality messages.

## Workflow

### 1. Gather Change Information
- Run `git status` to identify all staged and unstaged changes.
- Run `git diff HEAD` to see the actual content of the changes.

### 2. Analyze and Group
Identify logical boundaries for each commit. In this monorepo, groups should usually be:
- **By Service**: `services/OrderService/...`, `services/PaymentService/...`
- **By Infrastructure**: `platform/cluster/...`, `platform/charts/...`
- **By Global Config**: `.github/workflows/...`, `.dockerignore`, `CLAUDE.md`
- **By Scope**: `feat`, `fix`, `chore`, `ci`, `docs`, `test`, `refactor`

Group related files together. If a file change depends on another (e.g., a proto change and its service implementation), they **must** be in the same commit.

### 3. Propose Commits
Present the proposed commits to the user in this format, then wait for confirmation:

```
Proposed Commit 1: [type](scope): <summary>
Files:
  - path/to/file1
Overview: <A brief 1-2 sentence explanation of WHY this change was made and its impact.>

Proposed Commit 2: [type](scope): <summary>
Files:
  - path/to/file3
Overview: <A brief 1-2 sentence explanation of WHY this change was made and its impact.>
```

### 4. Execute Commits
For each group:
- `git add <specific files>` for that group only.
- `git commit -m "<message>"` using a heredoc for proper formatting.
- Run `git status` at the end to confirm everything is clean.

## Commit Message Standards
- Use **Conventional Commits**: `<type>(<scope>): <short summary>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- Scope: service name (e.g., `orders`), platform component (e.g., `k3d`), or global
- Subject line < 50 chars; body lines < 72 chars

## Rules
- Never use `git add -A` or `git add .` — always stage specific files.
- If a commit fails due to a pre-commit hook, report the error and stop. Do not skip hooks.
