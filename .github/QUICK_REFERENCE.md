# 🚀 Copilot Customization Quick Reference

## ⚡ Use Agents for Specialized Tasks

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **@sre-observability** | Latency, traces, metrics, performance | Debug slowness, correlate signals, optimize |
| **@platform-engineer** | Helm, k8s, deployment, infrastructure | Deploy services, manage clusters, IaC |
| **@microservices-developer** | APIs, gRPC, services, tests | Build features, fix bugs, write tests |

## 🎯 Use Skills for Workflows (Type `/` in chat)

| Skill | Use Case |
|-------|----------|
| `/troubleshoot-latency` | Find performance bottlenecks (Jaeger + Prometheus) |
| `/helm-chart-template` | Create/validate Helm charts with best practices |
| `/microservice-scaffold` | Bootstrap new service (Go/Node.js/.NET) |

## 🛡️ Hooks Protect You Automatically

```
✅ Blocks commands with secrets (token, password, API_KEY)
✅ Asks for confirmation on sensitive file edits (.env, .secret)
✅ Auto-formats YAML files after edits
✅ Suggests relevant agents based on your question
✅ Provides context for common errors
```

## 💬 Example Conversations

### Scenario 1: "Service is slow"
```
> You: Why is the cart-service slow?
> Hook: Suggests @sre-observability
> You: @sre-observability Show me the latency in Jaeger
```

### Scenario 2: "Deploy to cluster"
```
> You: Deploy my new service
> Hook: Suggests @platform-engineer
> You: @platform-engineer Create Helm chart and deploy
```

### Scenario 3: "Need new service"
```
> You: /microservice-scaffold
> Skill: Guides you through creating a new Go service with tracing
```

## 📁 Where Files Are Located

```
.github/
├── agents/                 # Three specialized agents
├── skills/                 # Three reusable skills
├── hooks/                  # Automated policy enforcement
├── COPILOT_CUSTOMIZATION_GUIDE.md  # Full documentation
```

## 🔗 Remember

- **Agents** = specialist personas with role-specific tools
- **Skills** = on-demand workflows with step-by-step guidance  
- **Hooks** = automatic safety & routing helpers
- All are team-shared in `.github/` (committed to git)

## 📚 Full Guide

Read `.github/COPILOT_CUSTOMIZATION_GUIDE.md` for detailed documentation.
