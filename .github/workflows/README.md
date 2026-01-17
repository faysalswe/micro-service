# GitHub Actions CI/CD Pipeline

## Overview
This workflow implements a comprehensive CI pipeline for the microservices architecture, providing automated build, test, and contract verification for all services.

## Pipeline Structure

### Triggers
- **Push**: Automatic execution on commits to `main` or `develop` branches
- **Pull Request**: Validation before merging to `main` or `develop`

### Jobs

#### 1. OrderService Build & Test
- **Runtime**: .NET 10.0
- **Tasks**: 
  - Restore NuGet dependencies
  - Build in Release mode
  - Execute unit tests (OrderProcessingServiceTests)
  - Upload build artifacts

#### 2. PaymentService Build & Test
- **Runtime**: Node.js 20.x
- **Tasks**:
  - Install npm dependencies with `npm ci`
  - Run Jest test suite
  - Generate and upload coverage reports

#### 3. IdentityService Build & Test
- **Runtime**: .NET 10.0
- **Tasks**:
  - Restore dependencies
  - Build verification

#### 4. Contract Tests
- **Dependencies**: Runs after all service builds complete
- **Tasks**:
  - Execute Pact consumer tests
  - Generate contract JSON files
  - Upload contracts as artifacts (30-day retention)
  - Conditional Pact Broker publishing (main branch only)

#### 5. Integration Status Check
- **Dependencies**: Runs after all jobs (even on failure)
- **Tasks**:
  - Aggregate status from all jobs
  - Provide consolidated success/failure report
  - Fail pipeline if any service fails

## Key Features

### Parallel Execution
Jobs 1-3 run in parallel to minimize total pipeline time.

### Artifact Management
- Build artifacts retained for 1 day (debugging)
- Pact contracts retained for 30 days (provider verification)

### Smart Caching
- npm dependencies cached by lockfile hash
- .NET NuGet packages cached automatically

### Quality Gates
No code can merge without:
- Successful builds (all services)
- Passing unit tests
- Valid contract definitions

## Local Testing
To simulate the CI pipeline locally:

```bash
# OrderService
dotnet restore OrderService/OrderService.csproj
dotnet build OrderService/OrderService.csproj --configuration Release
dotnet test OrderService.Tests/OrderService.Tests.csproj

# PaymentService
cd PaymentService
npm ci
npm test

# Contract Tests
dotnet test OrderService.Tests/OrderService.Tests.csproj --filter "ContractTests"
```

## Future Enhancements
- Docker image building and pushing to registry
- Deployment to staging/production environments
- Integration with Pact Broker for provider verification
- Security scanning (SAST/DAST)
- Performance regression testing
