# 🌐 The SRE's Guide to Networking & OS Internals

This guide demystifies the "magic" that allows containers, VMs, and microservices to communicate. It covers the foundational OS concepts and networking layers required for **Pillar 1** and **Pillar 2** of the mastery roadmap.

---

## 1. OS Foundations: The "Magic" Behind Containers

Containers are not "mini-VMs." They are just regular Linux processes isolated using two kernel features:

### 🛡️ Namespaces (The "View")
Namespaces restrict what a process can **see**.
*   **PID Namespace:** The process thinks it is PID 1.
*   **NET Namespace:** The process gets its own private network stack (interfaces, IP addresses, routing tables).
*   **MNT Namespace:** The process has its own file system mount points.
*   **UTS Namespace:** Allows the process to have its own hostname.

### ⛓️ Control Groups (Cgroups) (The "Resource")
Cgroups restrict what a process can **use**.
*   **CPU:** Limits how many cycles a process gets.
*   **Memory:** Prevents a process from taking over the RAM (OOMKill).
*   **I/O:** Limits disk read/write speeds.

---

## 2. The Linux Networking Stack (The Virtual Wire)

When you run a container or VM, the Linux kernel creates virtual networking components to connect them.

### 🔌 veth (Virtual Ethernet) Pairs
Think of a `veth` pair as a virtual ethernet cable with two ends.
*   One end stays in the **Host** (the "outside").
*   The other end is "pushed" into the **Container's Network Namespace**.
*   Traffic entering one end instantly pops out of the other.

### 🌉 Bridge (The Virtual Switch)
A Linux Bridge (`docker0` or `cbr0` in K8s) acts like a physical network switch.
*   Multiple `veth` ends from different containers plug into this bridge.
*   It allows containers on the same host to talk to each other directly.

### 📝 Routing & iptables
*   **Routing Table:** Decides where a packet should go next based on its destination IP.
*   **iptables / nftables:** The "Firewall and Traffic Controller."
    *   **NAT (Network Address Translation):** Allows containers with private IPs to reach the public internet.
    *   **Port Forwarding:** How `localhost:8080` reaches your container's port `80`.

---

## 3. Container Networking Modes

How your container connects to the world depends on the "Mode" you choose:

| Mode | Behavior | Best For |
| :--- | :--- | :--- |
| **Bridge (Default)** | Gets a private IP (`172.17.x.x`). Isolated by the bridge. | Most microservices. |
| **Host** | Shares the host's IP and ports. No isolation. | High-performance apps (Removes NAT overhead). |
| **None** | No network interface at all. | Batch jobs with no network needs. |
| **Container** | Shares the network namespace of another container. | **Sidecars** (How a "Service Mesh" or "OTel Collector" works). |

---

## 4. Kubernetes Networking: The "Flat Network"

Kubernetes requires that every Pod can talk to every other Pod without NAT. This is achieved via a **CNI (Container Network Interface)**.

### 🏗️ The CNI (The Orchestrator)
Popular CNIs include:
*   **Flannel:** Simple, uses VXLAN (overlays).
*   **Calico:** High performance, uses BGP (routing).
*   **Cilium:** Uses eBPF for extreme performance and security (The modern standard).

### 🚦 ClusterIP vs. NodePort vs. LoadBalancer
*   **ClusterIP:** Internal-only IP. Only other Pods can reach it.
*   **NodePort:** Opens a port on **every node** in the cluster. (e.g., `30000-32767`).
*   **LoadBalancer:** Triggers a Cloud Provider (AWS/Azure) to create a real external Load Balancer.

---

## 5. VM Networking: Bridged vs. NAT

When setting up your **k3s cluster on a Linux VM** (Pillar 2), understanding VM networking is critical.

### 🌍 NAT Mode (The Default)
*   **How it works:** The VM sits behind the host's IP. The VM can see the internet, but the internet cannot see the VM.
*   **Analogy:** Your laptop behind a home router.

### 🌉 Bridged Mode
*   **How it works:** The VM appears as a "real" device on your physical network. It gets its own IP from your home/office router.
*   **Why use it?** Best for "Server" VMs where you want to hit the VM's IP directly from another laptop.

---

## 6. The SRE's Networking Toolkit

If a service can't talk to another, use these commands to find the "Break":

### 🛠️ Basic Connectivity
*   **`ping [ip]`**: Is the device alive? (Uses ICMP).
*   **`curl -v [url]`**: Test HTTP connectivity and see headers.
*   **`telnet [ip] [port]`** or **`nc -zv [ip] [port]`**: Is the port open and listening?

### 🔍 OS Deep Dives
*   **`ip addr`**: Show all interfaces and their IPs.
*   **`ip route`**: Show the routing table (Where do packets go?).
*   **`ss -tulpn`**: Show every process listening on every port (Socket Statistics).
*   **`nslookup [domain]`** or **`dig [domain]`**: Debug DNS issues.

### 🕵️‍♂️ Advanced Packet Sniffing
*   **`tcpdump -i any port 80`**: See the raw packets flowing through the network.
*   **`mtr [domain]`**: A "Super Traceroute" that shows packet loss at every hop.

---

## 7. 🎤 Networking Interview Questions

**Q: What is a "Sidecar" container, and how does it talk to the main app?**
*   *Answer:* A sidecar shares the **Network Namespace** of the main app. This means both containers share the same `localhost`. The sidecar can talk to the app on `localhost:8080` without any network overhead.

**Q: Why does Kubernetes need a CNI like Calico or Flannel?**
*   *Answer:* Docker by default uses a host-local bridge. If Pod A is on Node 1 and Pod B is on Node 2, they can't see each other's bridge. A CNI creates an "Overlay Network" (like a tunnel) or manages routes so Pods can talk across nodes.

**Q: What is the difference between TCP and UDP?**
*   *Answer:* **TCP** is "Reliable" (handshakes, retries, ordered). Used for APIs and Databases. **UDP** is "Fast" (fire and forget). Used for DNS, Video Streaming, and Metrics (StatsD).
