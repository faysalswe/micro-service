# Copilot Customization Guide

Welcome! This project includes **specialized agents**, **reusable skills**, and **git hooks** to supercharge your development workflow.

## 🤖 Custom Agents

Agents are specialized personas with role-specific tools and constraints. Each agent focuses on one domain and enforces best practices.

### Available Agents

#### 1. **SRE & Observability** (`@sre-observability`)
**Use for**: Debugging latency, analyzing Jaeger traces, querying Prometheus metrics, configuring alerts

- **Tools**: read, search, execute
- **Expertise**: Distributed tracing, metrics, logs, performance analysis
- **When to use**: "Why is my service slow?", "How do I correlate traces and metrics?", "Configure Prometheus alerting"

**Example**:
```
@sre-observability Analyze why cart-service has p95 latency > 500ms
```

#### 2. **Platform Engineer** (`@platform-engineer`)
**Use for**: Helm charts, k3s/k3d operations, Kong gateway, CI/CD, infrastructure-as-code

- **Tools**: read, search, execute, edit
- **Expertise**: Kubernetes, Helm, cluster operations, deployment automation
- **When to use**: "Deploy this to k3d", "Fix ingress routing", "Create Helm chart for my service"

**Example**:
```
@platform-engineer Create a Helm chart with anti-affinity and resource limits
```

#### 3. **Microservices Developer** (`@microservices-developer`)
**Use for**: Building APIs (gRPC/REST), debugging services, writing tests, optimizing performance

- **Tools**: read, search, execute, edit
- **Expertise**: Go, Node.js, .NET, gRPC, REST, testing, OpenTelemetry
- **When to use**: "Implement this gRPC endpoint", "Fix service-to-service communication", "Add unit tests"

**Example**:
```
@microservices-developer Create a new Go service with health checks and tracing
```

---

## 🔧 Reusable Skills

Skills are on-demand workflows with bundled instructions and templates. Type `/` in chat to see available skills.

### Available Skills

#### 1. **Troubleshoot Latency** (`/troubleshoot-latency`)
Step-by-step guide to diagnose and fix performance bottlenecks using Jaeger, Prometheus, and Loki.

**Use for**:
- Finding root cause of slow requests
- Correlating traces, metrics, and logs
- Identifying serial vs parallel operations in traces

**Example**:
```
/troubleshoot-latency
```

#### 2. **Helm Chart Template** (`/helm-chart-template`)
Scaffold, customize, and validate Helm charts with best practices (anti-affinity, health checks, resources).

**Use for**:
- Creating new charts for microservices
- Adding persistence, ingress, or resource limits
- Testing deployments locally in k3d

**Example**:
```
/helm-chart-template
```

#### 3. **Microservice Scaffold** (`/microservice-scaffold`)
Bootstrap a new microservice with boilerplate code, tests, and OpenTelemetry instrumentation.

**Use for**:
- Starting new Go, Node.js, or .NET services
- Setting up gRPC/REST endpoints with health checks
- Adding distributed tracing and metrics

**Example**:
```
/microservice-scaffold
```

---

## 🎯 Git Hooks

Hooks enforce policies and provide context at key lifecycle points. They're automatic—no configuration needed.

### Hook Behaviors

1. **PreToolUse**: Blocks dangerous commands, asks for confirmation on sensitive file edits
2. **PostToolUse**: Auto-formats YAML, provides helpful error messages for common failures
3. **UserPromptSubmit**: Routes your question to the most relevant agent (suggestion only)

### Examples

```bash
# This will ask for confirmation (file is sensitive)
Edit .env

# This will be blocked (contains secret keyword)
curl https://api.example.com?token=my-secret-key

# This will suggest using @sre-observability
"Why is latency high?"
```

---

## 📖 Quick Start

### 1. **Browse Available Agents**
In VS Code Copilot Chat, click the **Agent** selector (top of chat) to see the three agents listed.

### 2. **Use an Agent**
```
@sre-observability Debug latency spike in the cart service
```

### 3. **Use a Skill**
Type `/` in chat and select from available skills:
- `/troubleshoot-latency`
- `/helm-chart-template`
- `/microservice-scaffold`

### 4. **Let Hooks Help**
- Hooks suggest relevant agents based on your question
- Hooks block dangerous commands automatically
- Hooks auto-format YAML files after edits

---

## 📂 File Structure

```
.github/
├── agents/                          # Custom agents
│   ├── sre-observability.agent.md
│   ├── platform-engineer.agent.md
│   └── microservices-developer.agent.md
├── skills/                          # Reusable skills
│   ├── troubleshoot-latency/
│   │   └── SKILL.md
│   ├── helm-chart-template/
│   │   └── SKILL.md
│   └── microservice-scaffold/
│       └── SKILL.md
├── hooks/                           # Git hooks
│   ├── settings.json                # Hook configuration
│   ├── pre-tool-use.sh              # Pre-tool validation
│   ├── post-tool-use.sh             # Post-tool auto-format
│   └── validate-intent.sh           # Intent routing
```

---

## 🚀 Best Practices

### When to Use Each Agent

| Task | Agent |
|------|-------|
| "Why is latency high?" | @sre-observability |
| "Deploy this service" | @platform-engineer |
| "Build a new API" | @microservices-developer |
| Multiple domains | Use default agent, mention specific tasks |

### When to Use Skills

| Task | Skill |
|------|-------|
| Performance debugging | /troubleshoot-latency |
| Create Helm chart | /helm-chart-template |
| New microservice | /microservice-scaffold |

### Hook Safety

- Hooks block commands with secret keywords (password, token, API_KEY)
- Hooks ask for confirmation before editing `.env`, `.secret`, or `cluster.yaml`
- Hooks provide context for common errors (service not running, command not found)

---

## ❓ FAQ

**Q: Where do I find agents?**
A: In VS Code Copilot Chat, click the **Agent** selector (appears at top of chat window).

**Q: Can I create custom agents?**
A: Yes! See `.github/agents/` for examples. Copy a `.agent.md` file and customize.

**Q: Do hooks run automatically?**
A: Yes. They execute at key lifecycle points (before tool use, after tool use, after you submit a prompt).

**Q: Can I disable hooks?**
A: Remove or rename `.github/hooks/settings.json` to disable all hooks.

**Q: Can I add more agents?**
A: Yes! Add new `.agent.md` files to `.github/agents/` following the same template structure.

---

## 📚 Further Reading

- [Copilot Agents Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [SRE & Observability Master Guide](../docs/OBSERVABILITY_SRE_MASTER_GUIDE.md)
- [Infrastructure Reference](../docs/INFRASTRUCTURE_REFERENCE.md)
- [Networking & OS Internals Guide](../docs/NETWORKING_OS_MASTER_GUIDE.md)

---

**Questions or issues?** Check existing agents in `.github/agents/` for examples, or modify `SKILL.md` files in `.github/skills/`.
