---
name: helm-chart-template
description: 'Create and validate Helm charts for microservices. Use for: scaffolding new charts, adding ingress/persistence, configuring resource limits, and testing helm deployments locally.'
---

# Helm Chart Template & Validation

## When to Use
- Creating a new Helm chart for a microservice
- Need to add persistence, ingress, or resource limits
- Want to validate chart syntax and template rendering
- Deploying to k3d cluster and need to test locally first

## Procedure

### 1. **Create a New Helm Chart**

```bash
cd platform/charts
helm create my-service
```

This generates a standard structure:
```
my-service/
├── Chart.yaml            # Chart metadata
├── values.yaml           # Default values
├── values-dev.yaml       # Dev overrides
├── values-prod.yaml      # Production overrides
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── hpa.yaml          # Horizontal Pod Autoscaler
├── requirements.yaml     # Chart dependencies
└── README.md
```

### 2. **Customize values.yaml**

Update with your microservice requirements:

```yaml
image:
  repository: my-registry/my-service
  tag: "1.0.0"
  pullPolicy: IfNotPresent

replicaCount: 3

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 250m
    memory: 128Mi

ingress:
  enabled: true
  hosts:
    - host: my-service.local
      paths:
        - path: /
          pathType: Prefix

persistence:
  enabled: true
  storageClass: "local-path"
  size: 10Gi
  mountPath: /data

env:
  - name: LOG_LEVEL
    value: "info"
  - name: DB_HOST
    valueFrom:
      configMapKeyRef:
        name: db-config
        key: host
```

### 3. **Validate Chart Syntax**

```bash
# Lint the chart for errors
helm lint platform/charts/my-service

# Render templates locally to see final manifests
helm template my-service platform/charts/my-service -f values-dev.yaml

# Validate rendered YAML syntax
helm template my-service platform/charts/my-service | kubectl apply --dry-run=client -f -
```

### 4. **Test in k3d**

```bash
# Add chart repo (if using external charts)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install locally in k3d
helm install my-service platform/charts/my-service \
  --namespace dev \
  --create-namespace \
  -f platform/charts/my-service/values-dev.yaml

# Check deployment status
kubectl get pods -n dev
kubectl logs -n dev deployment/my-service

# Upgrade chart after changes
helm upgrade my-service platform/charts/my-service \
  -n dev \
  -f platform/charts/my-service/values-dev.yaml

# Uninstall when done
helm uninstall my-service -n dev
```

### 5. **Pin Dependencies**

For production, lock dependency versions:

```yaml
# requirements.yaml
dependencies:
  - name: redis
    version: "17.x.x"
    repository: "https://charts.bitnami.com/bitnami"

# Lock versions
helm dependency lock platform/charts/my-service
```

## Common Chart Patterns

### Anti-affinity (High Availability)

```yaml
# templates/deployment.yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - "{{ include "my-service.name" . }}"
          topologyKey: kubernetes.io/hostname
```

### Resource Requests/Limits

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "250m"
  limits:
    memory: "128Mi"
    cpu: "500m"
```

### Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

## References

- [Helm Documentation](https://helm.sh/docs/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Pod Affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity)
- [Infrastructure Reference](../../docs/INFRASTRUCTURE_REFERENCE.md)
