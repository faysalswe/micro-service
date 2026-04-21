---
name: helm-deployment
description: Standardized workflow for deploying and verifying Helm charts in this project.
---

# Helm Deployment Skill

## Workflow

### 1. Preparation
- Validate the `values.yaml` for any missing required fields.
- Run `helm lint platform/charts/apps/<service-name>`.

### 2. Execution
- Use `helm upgrade --install <release-name> platform/charts/apps/<service-name> --namespace <namespace> --create-namespace`.
- Always use the `--atomic` flag for production/remote clusters to ensure automatic rollback on failure.

### 3. Verification
- Run `kubectl rollout status deployment/<deployment-name> -n <namespace>`.
- Check logs for immediate startup crashes: `kubectl logs -l app=<name> -n <namespace> --tail 20`.
- Verify the service is reachable: `kubectl get endpoints <service-name> -n <namespace>`.

## Common Pitfalls
- Ensure `ExistingSecret` for database credentials exists before deploying.
- Check that the `image.tag` matches the build in the local registry.
