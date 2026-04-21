# Agentic Development Guide

This guide explains how to extend and manage Gemini CLI using **Skills** and **Sub-agents**. Use these patterns to automate repetitive tasks and keep your development environment disciplined.

---

## 🚀 1. Overview: Skills vs. Sub-agents

| Feature | **Agent Skills** | **Sub-agents** |
| :--- | :--- | :--- |
| **Analogy** | A "Manual" or "Checklist" | A "Coworker" or "Specialist" |
| **Context** | Injected into the current chat | Isolated in a new, private chat |
| **Use Case** | Complex procedures (e.g., Committing) | Research, Batching, or "Chaos" control |
| **File Format** | Directory with `SKILL.md` | Single `.md` file with YAML Frontmatter |

---

## 🛠 2. Creating Custom Skills

Skills are used for **Procedural Expertise**. They provide the agent with instructions on *how* to perform a specific workflow within the same session.

### Structure
1. Create a directory: `.gemini/skills/your-skill-name/`
2. Create the file: `SKILL.md`

### Template (`SKILL.md`)
```markdown
---
name: service-creator
description: Specialized instructions for scaffolding new microservices.
---

# Service Creator Skill

## Workflow
1. **Analyze:** Check existing services in `services/` for naming conventions.
2. **Template:** Use the `scripts/template-generator.sh` to scaffold files.
3. **Verify:** Run `go mod tidy` and ensure `Dockerfile` exists.

## Best Practices
- Always use UID 1001 for security.
- Register the new service in `platform/charts/`.
```

---

## 🤖 3. Creating Sub-agents

Sub-agents are **Isolated Specialists**. They have their own system prompt and a subset of tools. This is the best way to handle "chaotic" or high-volume tasks without cluttering your main session.

### Structure
1. Create a file: `.gemini/agents/expert-name.md`

### Template (`expert-name.md`)
```markdown
---
name: security-audit
description: Specialist for analyzing code for security vulnerabilities.
tools:
  - read_file
  - grep_search
model: gemini-2.0-flash
max_turns: 10
---

You are a Senior Security Engineer. Your goal is to find SQL injection, 
XSS, and insecure container configurations.

## Rules:
- Only report high-severity issues.
- Provide a clear remediation step for every finding.
```

---

## 📈 4. Advanced Patterns for Maximum Leverage

### 1. Persistent Memory (`save_memory`)
Don't repeat yourself. Use `project` scope to teach the agent facts once.
*   **Leverage:** Store local IP addresses, custom port mappings, or project-specific naming rules.
*   **Action:** `save_memory(fact: "Orders always use port 5011", scope: "project")`.

### 2. Strategic Sub-agent Delegation
Your context window is precious. Keep it clean.
*   **Leverage:** For massive batch tasks (e.g., "Refactor 20 files"), delegate to the `generalist` sub-agent.
*   **Result:** You get a single summary message instead of 20 turns of clutter.

### 3. The Codebase Investigator
For complex, cross-service debugging.
*   **Leverage:** Use `@codebase_investigator` for vague problems like "Why is the latency high between Service A and B?".
*   **Result:** A comprehensive report mapping dependencies and code-level bottlenecks.

### 4. Real-World Verification (MCP)
Don't guess—verify.
*   **Leverage:** Use **Docker MCP** to check logs/state and **Browser MCP** to verify UI/Grafana rendering.
*   **Action:** `"Use the browser to check if the Grafana dashboard shows data."`

---

## 🧠 5. Best Practices for Agentic Development

### 1. Control the "Chaos"
If the AI is doing too many things at once, **stop and delegate**. Sub-agents run in parallel and return clean results.

### 2. Context Steering
Be surgical with what you feed the agent. Use `@filename` to pull in exactly what is needed, and use `read_file` with line numbers for large files.

### 3. "Explain Before Acting"
Ensure custom skills follow the **Explain -> Plan -> Act -> Validate** cycle. This keeps the output disciplined and predictable.

---

## 📝 6. Quick Start Checklist
- [ ] Create `.gemini/skills/` or `.gemini/agents/` in your workspace.
- [ ] Use `skill-creator` to bootstrap a new workflow.
- [ ] Save project-specific knowledge using `save_memory`.
- [ ] Call sub-agents explicitly using `@name` for complex research.

---
*Last updated: Tuesday, April 21, 2026*
