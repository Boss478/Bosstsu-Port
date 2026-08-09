# VPS Hosting Research & Suitability Analysis
*Date: July 11, 2026*

This report analyzes the VPS hosting options under consideration for the **Boss478 Portfolio & Educational Platform** (Next.js 16 + MongoDB + Docker) to replace the expired Hostinger KVM1 plan.

---

## 1. Technical Baseline & Requirements
Based on [requirements.md](file:///Users/boss123/Coding-Project/bosstsu-project/boss478/requirements.md) and [AGENTS.md](file:///Users/boss123/Coding-Project/bosstsu-project/boss478/AGENTS.md), the system operates under the following constraints:

*   **Virtualization:** KVM is required (container-based systems like OpenVZ/LXC risk OOM issues due to shared memory limits and lack swap control).
*   **Docker Container RAM Limits:**
    *   Next.js Application: **1,024 MB**
    *   MongoDB Database: **1,536 MB**
    *   Mongo-Express CMS: **128 MB**
    *   *Minimum Docker Allocation:* **2.688 GB**
*   **Operating System Overhead:** Host OS (Ubuntu/Debian) + Docker Daemon requires **350–500 MB** of RAM.
*   **Concurrency Target:** **50–100 concurrent users**.
*   **Storage Load:** Image gallery supporting raw/HEIC image uploads, dynamic optimization (via `sharp`), and database backups.

---

## 2. Plan Comparison Grid
All prices are in THB/month. Standard Thai hosting plans typically exclude **7% VAT** unless stated otherwise; the table below includes both base and VAT-inclusive calculations for accurate budgeting.

| Provider | Core(s) | RAM | Storage | Base Cost (THB) | Est. Cost + 7% VAT | Specs Evaluation |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Hostinger (Expired)** | **1** | **4 GB** | **50 GB SSD** | **~650.00** | **~650.00** | *Baseline reference.* |
| **ReadyIDC** | 1 | 3 GB | 30 GB SSD | 235.40 | 251.88 | 🔴 **Unusable.** RAM is too tight for the 2.688 GB Docker stack + OS. |
| **ReadyIDC** | 1 | 4 GB | 50 GB SSD | 299.60 | 320.57 | 🟡 **Okay.** Replicates Hostinger specs; 1 Core will bottleneck on concurrency. |
| **ReadyIDC** | 1 | 4 GB | 60 GB SSD | 321.00 | 343.47 | 🟡 **Okay.** Replicates Hostinger specs with +10 GB storage. |
| **ReadyIDC** | 1 | 6 GB | 50 GB SSD | 342.40 | 366.37 | 🟡 **RAM-Heavy.** Great RAM headroom, but CPU bottleneck remains. |
| **ReadyIDC** | **2** | **4 GB** | **60 GB SSD** | **428.00** | **457.96** | 🟢 **Recommended.** Great CPU/RAM/Storage balance. |
| **VisperHost** | 1 | 3 GB | 30 GB SSD | 250.00 | 267.50 | 🔴 **Unusable.** RAM is too tight. |
| **VisperHost** | **2** | **4 GB** | **60 GB SSD** | **350.00** | **374.50** | 🏆 **Best Value.** 2 Cores, 4 GB RAM, 60 GB SSD at a great price. |
| **VisperHost** | 4 | 8 GB | 100 GB SSD | 600.00 | 642.00 | 🟢 **Overkill.** Great specs, matches Hostinger's cost but over-resourced for current load. |

---

## 3. Core Resource Analysis

### A. RAM: Why 3 GB is a Risk
*   **The Threat:** If a 3 GB RAM server is selected, the unallocated headroom for the host OS is less than 380 MB. 
*   **The Outcome:** During Next.js production builds or intensive `sharp` image optimizations, memory usage will spike. Without a buffer, the Linux kernel's Out-Of-Memory (OOM) killer will trigger, terminating either `node` or the `mongod` database daemon, resulting in service downtime.
*   **Verdict:** 4 GB RAM is the absolute minimum safe capacity for this application stack.

### B. CPU: 1 Core vs. 2 Cores under Concurrency
*   **The Threat:** With 1 Core, the Next.js event loop and the MongoDB database daemon must share the same physical thread scheduling.
*   **The Outcome:** When 50–100 concurrent users visit the site, rendering, middleware verification, image compression, and database reads will cause high CPU wait times. A single heavy query can block the Next.js main thread, causing request timeouts.
*   **Verdict:** A 2 Core VPS ensures that MongoDB and Node can run on separate threads, preventing database queries from freezing the web server response loop.

### C. Bandwidth & Latency
*   **ReadyIDC:** Operates out of domestic data centers (Muang Thong Thani / Srisaman) with a massive domestic backbone (400 Gbps), but international connections are throttled on cheaper tiers.
*   **VisperHost:** Uses Dell hardware at CSLoxinfo's "The Cloud" datacenter in Bangkok. Offers a 1 Gbps shared port with unlimited domestic bandwidth, though international speeds are typically restricted to 10 Mbps per IP.
*   **Verdict:** Since this is a personal portfolio and educational app targeting Thai users, both local providers will offer significantly lower latency (~2-10ms) compared to Hostinger's overseas routing, resulting in a much faster initial page load.

---

## 4. Quality of Life (QoL) & Operational Differences

### A. Support Channels & Responsiveness
*   **Hostinger:** Primarily unmanaged with automated help centers. Standard support is chat-based, with chatbot filters often delaying access to a human engineer. Support is in English (or translated Thai).
*   **ReadyIDC:** Natively Thai-speaking, CCIE-certified network team. Offers email tickets, phone support, and live portal support. They are fast for network/hardware errors but can be slow to troubleshoot software configurations inside unmanaged servers.
*   **VisperHost:** Very popular local option. Primarily unmanaged, but they offer quick contact via **Line Chat (`@visperhost`)**, which is highly convenient for Thai users. Support is fast for server state resets (reboots, network drops) but expects users to manage internal software configurations independently.

### B. Control Panels & VM Portals
*   **Hostinger:** Custom-built `hPanel` is very polished, offering easy OS reinstalls, basic resource monitoring graphs, and standard console access.
*   **ReadyIDC:** Features the **Ready Cloud Portal** (backed by Proxmox virtualization). It is highly advanced, letting users inspect granular IOPS/CPU metrics, schedule recurring backup tasks, adjust port settings, and perform direct restorations.
*   **VisperHost:** Uses a standard Virtualizor management panel integrated inside their client area (`client.visperhost.net`). Offers standard controls (boot, reboot, OS reinstall, VNC terminal), but feels more basic compared to ReadyIDC.

### C. Automatic Backups & Data Guarantees
*   **Hostinger:** Weekly automated backups are free, with 1 manual snapshot slot included. Daily backups require a paid add-on.
*   **ReadyIDC:** Offers **free automated daily backups (retained for 3 days)**. Users can configure weekly schedules and trigger restores directly through the Ready Cloud Portal.
*   **VisperHost:** Offers **free automated backups every 3 days**. However, their Terms of Service (TOS) explicitly states that they do *not* guarantee data integrity 100%, and users are legally responsible for maintaining off-site backups of their databases.

### D. Uptime & Neighbor Contention
*   **Hostinger:** Maintains standard 99.9% to 99.99% uptime. Resource separation on their KVM host nodes is strictly enforced.
*   **ReadyIDC:** Tier-III data centers ensure 99.95%+ physical uptime. Redundancy is enterprise-level.
*   **VisperHost:** Uses CSLoxinfo's Bangkok facility (excellent physical power/cooling redundancy). However, as a budget provider, neighbor noise (resource theft by other VPS nodes on the same host machine) is occasionally reported, which can cause temporary disk I/O latency.

---

## 5. Recommendations & Conclusions

### Tier 1 Selection (Value Champion): **VisperHost 2 Core / 4 GB RAM / 60 GB SSD (350 THB/mo)**
*   **Why:** For **374.50 THB/mo** (incl. VAT), this option is **42% cheaper** than Hostinger KVM1 while delivering **2x the CPU Cores** and **+10 GB storage**. It is fully unmanaged, using KVM virtualization on enterprise Dell hardware at CSLoxinfo.

### Tier 2 Selection (Premium Local SLA): **ReadyIDC 2 Core / 4 GB RAM / 60 GB SSD (428 THB/mo)**
*   **Why:** For **457.96 THB/mo** (incl. VAT), this provides similar specifications to VisperHost but on ReadyIDC's highly redundant Proxmox-backed Enterprise Cloud platform. ReadyIDC has a slightly more robust administrative panel and network control tools.

### Worst-Option Warnings:
*   **Do not buy any 3 GB RAM plans.** (ReadyIDC 235.40 / VisperHost 250). They are statistically guaranteed to crash under Docker stack memory limits.
*   **Avoid 1 Core plans if target traffic is 50-100 users.** Next.js image compilation (`sharp` processing HEIC uploads) is highly CPU intensive and will cause page lag on 1 Core.
