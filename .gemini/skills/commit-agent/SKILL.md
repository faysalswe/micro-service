---
name: commit-agent
description: Specialized agent for grouping and executing atomic, logical git commits in a monorepo. Use when the user has multiple unrelated changes and wants them committed separately with high-quality messages.
---

# Commit Agent

This skill guides Gemini CLI through the process of analyzing, grouping, and executing multiple atomic commits for a given set of changes.

## Workflow

### 1. Gather Change Information
- Run `git status` to identify all staged and unstaged changes.
- Run `git diff HEAD` to see the actual content of the changes.

### 2. Analyze and Group
- Identify logical boundaries for each commit. In this monorepo, groups should usually be:
  - **By Service**: `services/OrderService/...`, `services/PaymentService/...`
  - **By Infrastructure**: `platform/cluster/...`, `platform/charts/...`
  - **By Global Config**: `.github/workflows/...`, `.dockerignore`, `GEMINI.md`
  - **By Scope**: `feat`, `fix`, `chore`, `ci`, `docs`, `test`, `refactor`.
- Group related files together. If a file change depends on another (e.g., a proto change and its service implementation), they **must** be in the same commit.

### 3. Propose Commits
- Present a list of proposed commits to the user in this format:
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
- Wait for user confirmation.

### 4. Execute Commits
- For each group:
  - `git reset` (optional: to clear any current staging)
  - `git add <files>` for that specific group.
  - `git commit -m "<message>"`
- Finally, run `git status` to confirm everything is as expected.

## Commit Message Standards
- Use **Conventional Commits**: `<type>(<scope>): <short summary>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
- Scope: Service name (e.g., `orders`), platform component (e.g., `k3d`), or global.
- Length: Subject line < 50 chars; Body (if any) < 72 chars per line.

## Error Handling
- If a commit fails (e.g., pre-commit hooks), report the error and stop.
- Do not attempt to force commits or skip hooks unless directed.
