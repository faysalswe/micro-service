# Contract Testing (Pact) - How To

This directory contains the "Source of Truth" for service-to-service contracts in this repository.

## 🔄 How to Update Contracts
When you change the API requirements in the **Consumer** (OrderService), you must regenerate these files:

1. Navigate to the consumer test directory:
   ```bash
   cd services/OrderService.Tests
   ```
2. Run the tests:
   ```bash
   dotnet test
   ```
   The files in this directory (`tests/pacts/`) will be automatically updated with the new expectations.

## ✅ How to Verify Contracts
The **Providers** (Identity, Inventory, Payment) should verify themselves against these files:

- **Inventory Service (Go):**
  ```bash
  cd services/InventoryService
  go test ./test/pact_test.go
  ```

## ⚠️ Important Rules
1. **Never edit JSON files manually.** Always update the Consumer tests and regenerate them.
2. **Commit the changes.** When you change an API, you must commit both the code and the updated JSON contract in the same PR.
