# Alternative Local Kubernetes Options

If Kind or K3d fail due to macOS networking conflicts, use these professional alternatives.

---

## 1. OrbStack (Recommended for macOS)
The fastest and most stable alternative to Docker Desktop.
*   **Description**: Native macOS implementation of Docker and K8s. Uses significantly less RAM/CPU.
*   **Workflow**:
    1.  Download from [orbstack.dev](https://orbstack.dev).
    2.  Install and open the app.
    3.  Go to **Settings > Kubernetes** and check "Enable".
    4.  OrbStack automatically handles all networking and local registries.

---

## 2. Colima (The Open Source Choice)
A high-performance CLI alternative to Docker Desktop.
*   **Description**: Uses Lima (Linux Virtual Machines) to run containerd and K8s.
*   **Workflow**:
    ```bash
    # 1. Install
    brew install colima
    
    # 2. Start with Kubernetes enabled
    colima start --cpu 4 --memory 8 --kubernetes
    
    # 3. Verify
    kubectl cluster-info
    ```

---

## 3. Managed K3s (The "Cloud Sandbox" Path)
If your local machine is completely blocked by security settings.
*   **Description**: A tiny Linux VM (Ubuntu) running K3s.
*   **Workflow**:
    1.  Create a $5/mo VM on DigitalOcean or Hetzner.
    2.  Run the K3s "One-Liner":
        ```bash
        curl -sfL https://get.k3s.io | sh -
        ```
    3.  Copy the `/etc/rancher/k3s/k3s.yaml` to your Mac's `~/.kube/config`.
    4.  Update the `server: https://127.0.0.1:6443` to `https://[YOUR_VM_IP]:6443`.

---

## 4. GitHub Codespaces (The Browser Path)
A pre-configured environment in the cloud.
*   **Description**: GitHub provides a containerized VM with K3s pre-installed.
*   **Workflow**:
    1.  Open your repo on GitHub.
    2.  Press the `.` (period) key or click "Code > Codespaces > Create".
    3.  Wait 10 seconds. You have a full K8s cluster ready in the terminal.
