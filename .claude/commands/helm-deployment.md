# Helm Deployment

Standardized workflow for deploying and verifying a Helm chart in this project.

The target service is: $ARGUMENTS

## Step 1: Preparation

1. Validate `values.yaml` for missing required fields.
2. Run `helm lint platform/charts/apps/<service-name>` and fix any warnings.

## Step 2: Execution

Deploy using:
```bash
helm upgrade --install <release-name> platform/charts/apps/<service-name> \
  --namespace <namespace> \
  --create-namespace \
  --atomic
```

Always use `--atomic` for production/remote clusters — it enables automatic rollback on failure.

## Step 3: Verification

Run these checks in order:

```bash
# Wait for rollout to complete
kubectl rollout status deployment/<deployment-name> -n <namespace>

# Check for startup crashes
kubectl logs -l app=<name> -n <namespace> --tail 20

# Confirm endpoints are populated
kubectl get endpoints <service-name> -n <namespace>
```

## Common Pitfalls

- Ensure the `ExistingSecret` for database credentials exists in the namespace **before** deploying.
- Verify `image.tag` in `values.yaml` matches the image built and pushed to the local registry.
- If `--atomic` triggers a rollback, check `kubectl describe pod` for the failed pod's events.
