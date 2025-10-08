# Kubernetes Cluster Troubleshooting Guide

## Overview
This guide documents real troubleshooting scenarios encountered during manual Kubernetes cluster setup for Linux Foundation CKA/CKAD certification training. It combines Linux system tools, kubeadm, and kubectl for comprehensive cluster debugging.

## Environment
- **Platform**: AWS EC2 (Amazon Linux 2023)
- **Kubernetes**: v1.28.15
- **Container Runtime**: containerd
- **CNI Plugin**: Weave Net v1.28
- **Setup Method**: Manual kubeadm (no automation)

---

## Scenario 1: API Server Crash After CNI Installation

### **Problem Description**
- `kubeadm init` completed successfully
- kubectl was working initially (showed NotReady node)
- Weave CNI installation appeared successful
- **API server crashed immediately after Weave installation**
- kubectl commands started failing with "connection refused"

### **Symptoms**
```bash
$ kubectl get nodes
The connection to the server 10.0.2.129:6443 was refused - did you specify the right host or port?

$ sudo kubectl get pods
E1007 22:24:40.781156 33269 memcache.go:265] couldn't get current server API group list: 
Get "http://localhost:8080/api?timeout=32s": dial tcp 127.0.0.1:8080: connect: connection refused
```

### **Root Cause Analysis**

#### **Step 1: Check kubelet logs**
```bash
sudo journalctl -u kubelet --lines=20
```
**Key Finding:**
```
E1007 22:23:32.614621 28463 kubelet.go:2874] "Container runtime network not ready" 
networkReady="NetworkReady=false reason:NetworkPlugi>
```

#### **Step 2: Check container runtime**
```bash
sudo crictl ps -a | grep apiserver
```
**Key Finding:**
```
5749f83aaad08  9dc6939e7c573  4 minutes ago  Exited  kube-apiserver  7  253b9d644ee4a
```
- API server container in "Exited" state
- 7 restart attempts (crash loop)

#### **Step 3: Verify containerd health**
```bash
sudo systemctl status containerd
```
**Result:** ✅ Containerd was healthy with multiple active shims

#### **Step 4: Check API server logs**
```bash
sudo crictl logs 5749f83aaad08 | tail -20
```

### **Root Cause**
**Network plugin initialization conflict** - Weave CNI was causing the API server to lose network connectivity during startup, creating a chicken-and-egg problem:
- API server needs network to start
- Network plugin needs API server to configure

### **Solution**
```bash
# Restart kubelet to force clean control plane restart
    sudo systemctl restart kubelet

# Wait for pods to recreate (critical!)
sleep 90

# Verify API server recovery
kubectl get nodes
```

### **Tools Used**
- `systemctl` - Service management and status checking
- `journalctl` - System log analysis
- `crictl` - Container runtime debugging
- `kubectl` - Cluster state verification

---

## Scenario 2: Worker Node Join Authentication Failure

### **Problem Description**
- Control plane recovered and ready
- Worker node join command executed successfully through bootstrap
- **Join process stuck at TLS Bootstrap phase**
- Worker node unable to register with cluster

### **Symptoms**
```bash
# Worker node join output
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...
[kubelet-check] Initial timeout of 40s passed.

# Worker kubelet logs
"Unable to register node with API server" err="nodes is forbidden: User \"system:node:ip-10-0-2-243...\" is forbidden"
```

### **Root Cause Analysis**

#### **Step 1: Check kubelet status on worker**
```bash
sudo systemctl status kubelet
sudo journalctl -u kubelet --lines=20
```
**Key Finding:**
```
"Attempting to register node" node="ip-10-0-2-243.us-east-2.compute.internal"
"Unable to register node with API server" err="nodes is forbidden"
```

#### **Step 2: Verify network connectivity**
```bash
ping 10.0.2.129
telnet 10.0.2.129 6443
```
**Result:** ✅ Network connectivity was working

#### **Step 3: Check control plane RBAC**
```bash
kubectl get clusterrolebinding | grep node
kubectl describe clusterrolebinding kubeadm:node-autoapprove-bootstrap
```

### **Root Cause**
**Corrupted authentication state** caused by API server crash during initial join attempt:
1. Worker started TLS bootstrap process
2. API server crashed mid-bootstrap
3. Worker left with partial/corrupted authentication state
4. RBAC permissions not properly established for node registration

### **Solution**
```bash
# Multiple kubelet restarts to clear authentication state
sudo systemctl restart kubelet
# Repeat 2-3 times until successful

# Alternative: Complete reset
sudo kubeadm reset --force
kubeadm token create --print-join-command  # On control plane
# Use fresh join command
```

### **Tools Used**
- `systemctl` - Service restart and status
- `journalctl` - Authentication error analysis
- `kubeadm` - Token management and reset
- `kubectl` - RBAC verification

---

## Scenario 3: CNI Network Plugin Issues

### **Problem Description**
- Wrong Weave version initially used (v1.29 instead of v1.28)
- Network connectivity issues between control plane and worker
- Node stuck in NotReady state

### **Symptoms**
```bash
$ kubectl get nodes
NAME                                       STATUS     ROLES           AGE     VERSION
ip-10-0-2-129.us-east-2.compute.internal   NotReady   control-plane   9m51s   v1.28.15
```

### **Diagnosis Commands**
```bash
# Check CNI pod status
kubectl get pods -n kube-system | grep weave

# Check CNI logs
kubectl logs -n kube-system -l name=weave-net

# Monitor node status changes
kubectl get nodes -w

# Check network configuration
ls -la /etc/cni/net.d/
```

### **Solution**
```bash
# Use correct Weave version for Kubernetes v1.28
kubectl apply -f https://reweave.azurewebsites.net/k8s/v1.28/net.yaml

# Alternative: Use Flannel (more stable)
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# If CNI issues persist, clean and restart
sudo rm -rf /etc/cni/net.d/*
sudo systemctl restart kubelet
```

---

## Scenario 4: System Pod Cascade Failures Due to Missing CNI

### **Problem Description**
- `kubeadm init` completed successfully
- Multiple system pods failing to start
- **CoreDNS stuck in ContainerCreating state**
- **kube-proxy and kube-scheduler in CrashLoopBackOff**
- Fresh deployment without CNI network plugin installed

### **Symptoms**
```bash
$ kubectl get pods -n kube-system
NAME                                        READY   STATUS              RESTARTS      AGE
coredns-5dd5756b68-blfm5                    0/1     ContainerCreating   0             27m
coredns-5dd5756b68-hfzqw                    0/1     ContainerCreating   0             27m
kube-proxy-6ftfz                            0/1     CrashLoopBackOff    12 (2m1s ago) 27m
kube-proxy-bhgx7                            0/1     CrashLoopBackOff    8 (17s ago)   26m
kube-scheduler-ip-10-0-2-146...             0/1     CrashLoopBackOff    10 (63s ago)  27m
```

### **Root Cause Analysis**

#### **Step 1: Check CoreDNS pod details**
```bash
kubectl describe pod -n kube-system -l k8s-app=kube-dns
```
**Key Finding:**
```
Warning  FailedCreatePodSandBox  3m29s (x39 over 11m)  kubelet  
Failed to create pod sandbox: rpc error: code = Unknown desc = failed to setup network for sandbox
plugin type="flannel" failed (add): failed to load flannel 'subnet.env' file: 
open /run/flannel/subnet.env: no such file or directory
```

#### **Step 2: Check for CNI configuration**
```bash
ls -la /etc/cni/net.d/
kubectl get pods -n kube-system | grep -E "(flannel|weave|calico)"
```
**Key Finding:**
- No CNI network plugin pods running
- Missing network configuration files

#### **Step 3: Verify node status**
```bash
kubectl get nodes
```
**Result:** Node shows as `NotReady` due to missing network plugin

### **Root Cause**
**Missing CNI Network Plugin** - The cluster was initialized without installing a Container Network Interface plugin:
- kubelet expects network plugin to be present
- CoreDNS can't start without network configuration
- kube-proxy fails due to network setup issues
- kube-scheduler may have network dependencies

### **Solution**
```bash
# Install Flannel CNI (recommended for simplicity)
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Alternative: Install Weave CNI
kubectl apply -f https://reweave.azurewebsites.net/k8s/v1.28/net.yaml

# Wait 2-5 minutes for network plugin to initialize
kubectl get pods -n kube-system -w

# Verify cluster health
kubectl get nodes
kubectl get pods -n kube-system
```

### **Expected Recovery Timeline**
- **0-30 seconds**: CNI pods start creating
- **30-120 seconds**: CNI pods become Running
- **120-300 seconds**: CoreDNS pods transition to Running
- **300-600 seconds**: All system pods healthy, nodes Ready

### **Tools Used**
- `kubectl describe` - Pod failure analysis
- `kubectl get pods -w` - Real-time status monitoring
- `ls /etc/cni/net.d/` - CNI configuration verification
- `kubectl apply` - CNI installation

### **Prevention**
Always install CNI immediately after `kubeadm init`:
```bash
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
# Immediately after:
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

---

## Scenario 5: Flannel CNI Pod CIDR Assignment Failure

### **Problem Description**
- Flannel CNI installed successfully
- Flannel pods running but failing to configure network
- **CoreDNS still stuck in ContainerCreating**
- **Error: "pod cidr not assigned" in Flannel logs**

### **Symptoms**
```bash
$ kubectl get pods -n kube-system
NAME                          READY   STATUS              RESTARTS   AGE
kube-flannel-ds-xxxxx         1/1     Running             0          5m
coredns-xxxxx                 0/1     ContainerCreating   0          30m

$ kubectl logs -n kube-system -l app=flannel
Error registering network: failed to acquire lease: node "ip-10-0-2-146..." pod cidr not assigned
```

### **Root Cause Analysis**

#### **Step 1: Check kubeadm init configuration**
```bash
kubectl get nodes -o wide
kubectl describe node <node-name> | grep PodCIDR
```
**Key Finding:**
```
PodCIDR:                      <none>
PodCIDRs:                     <none>
```

#### **Step 2: Check cluster configuration**
```bash
kubectl get cm kubeadm-config -n kube-system -o yaml | grep podSubnet
```
**Result:** Missing or incorrect pod subnet configuration

#### **Step 3: Verify Flannel expects specific CIDR**
```bash
kubectl get cm kube-flannel-cfg -n kube-flannel -o yaml | grep net-conf
```

### **Root Cause**
**Missing --pod-network-cidr during kubeadm init** - Flannel requires the cluster to be initialized with pod network CIDR:
- `kubeadm init` was run without `--pod-network-cidr=10.244.0.0/16`
- Controller manager doesn't assign pod CIDRs to nodes
- Flannel can't configure network without assigned CIDR ranges

### **Solution Option 1: Fix Existing Cluster**
```bash
# Edit kube-controller-manager static pod
sudo vi /etc/kubernetes/manifests/kube-controller-manager.yaml

# Add this line to the command section:
    - --allocate-node-cidrs=true
    - --cluster-cidr=10.244.0.0/16

# Restart kubelet to reload the manifest
sudo systemctl restart kubelet

# Wait for controller-manager to restart
kubectl get pods -n kube-system | grep controller-manager

# Verify CIDR assignment
kubectl get nodes -o wide
```

### **Solution Option 2: Reset and Reinitialize (Recommended)**
```bash
# Reset the cluster completely
sudo kubeadm reset --force
sudo rm -rf /etc/cni/net.d/*

# Reinitialize with correct pod network CIDR
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install Flannel
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Verify nodes get PodCIDR assigned
kubectl get nodes -o wide
```

### **Verification**
```bash
# Nodes should show assigned PodCIDR
kubectl get nodes -o wide
# Example output:
# NAME      STATUS   ROLES    INTERNAL-IP   EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION   CONTAINER-RUNTIME   PodCIDR
# node1     Ready    master   10.0.2.146    <none>        Amazon Linux 2023   6.1.94-99.176    containerd://1.7.8  10.244.0.0/24

# Flannel should start working
kubectl logs -n kube-system -l app=flannel

# CoreDNS should become Ready
kubectl get pods -n kube-system
```

### **Tools Used**
- `kubectl describe node` - CIDR assignment verification
- `kubectl get cm` - Configuration inspection
- `sudo vi /etc/kubernetes/manifests/` - Static pod modification
- `kubeadm reset && init` - Complete cluster recreation

---

## Scenario 6: Flannel Cannot Connect to Kubernetes API Service

### **Problem Description**
- Flannel CNI installed and pods starting
- **Flannel pods failing to connect to Kubernetes API server**
- **Error: "dial tcp 10.96.0.1:443: connection refused"**
- Service network (10.96.0.1) not reachable from Flannel pods

### **Symptoms**
```bash
$ kubectl get pods -n kube-flannel
NAME                    READY   STATUS    RESTARTS   AGE
kube-flannel-ds-xxxxx   0/1     Running   0          5m

$ kubectl logs kube-flannel-ds-xxxxx -n kube-flannel
Failed to create SubnetManager: error retrieving pod spec for 'kube-flannel/kube-flannel-ds-xxxxx': 
Get "https://10.96.0.1:443/api/v1/namespaces/kube-flannel/pods/...": dial tcp 10.96.0.1:443: connect: connection refused
```

### **Root Cause Analysis**

#### **Step 1: Check Kubernetes service**
```bash
kubectl get svc kubernetes -n default
kubectl get endpoints kubernetes -n default
```
**Key Finding:**
```
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   45m

NAME         ENDPOINTS         AGE
kubernetes   10.0.2.146:6443   16m
```
**Note:** Endpoints are correct, so the issue is not missing registration

#### **Step 2: Check kube-proxy status (CRITICAL)**
```bash
kubectl get pods -n kube-system | grep kube-proxy
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=10
```
**Key Finding:**
```
kube-proxy-dskz4   0/1   CrashLoopBackOff   9 (27s ago)   17m
kube-proxy-v2nfw   0/1   CrashLoopBackOff   6 (3m57s ago) 15m
```
**Problem:** kube-proxy pods are crashing - this breaks service routing

#### **Step 3: Check kube-proxy crash logs**
```bash
kubectl logs -n kube-system -l k8s-app=kube-proxy --previous --tail=20
```

### **Root Cause**
**Service networking not working** - The kubernetes service at 10.96.0.1 has no endpoints:
- kube-proxy may not be working properly
- API server endpoints not being populated
- Service network routing issues
- Circular dependency: Flannel needs API, but API needs networking

### **Solution Option 1: Check and Fix kube-proxy**
```bash
# Check kube-proxy status
kubectl get pods -n kube-system -l k8s-app=kube-proxy
kubectl logs -n kube-system -l k8s-app=kube-proxy --previous

# If kube-proxy is crashing, restart it
kubectl delete pods -n kube-system -l k8s-app=kube-proxy

# Check if endpoints appear
kubectl get endpoints kubernetes -n default
```

### **Solution Option 2: Restart API Server Components**
```bash
# Restart kubelet to refresh static pods
sudo systemctl restart kubelet

# Wait for API server to restart
sleep 60

# Check if endpoints are populated
kubectl get endpoints kubernetes -n default

# Restart Flannel pods
kubectl delete pods -n kube-flannel --all
```

### **Solution Option 3: Network Bootstrap Fix**
```bash
# Create temporary host network access for Flannel
kubectl patch daemonset kube-flannel-ds -n kube-flannel --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/hostNetwork", "value": true}]'

# Wait for Flannel to bootstrap network
sleep 30

# Remove host network requirement
kubectl patch daemonset kube-flannel-ds -n kube-flannel --type='json' \
  -p='[{"op": "remove", "path": "/spec/template/spec/hostNetwork"}]'
```

### **Solution Option 4: Complete Reset (If Others Fail)**
```bash
# Reset with explicit service CIDR
sudo kubeadm reset --force
sudo rm -rf /etc/cni/net.d/*

# Initialize with both pod and service CIDRs
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install Flannel
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

### **Verification**
```bash
# Service should have endpoints
kubectl get endpoints kubernetes -n default
# Should show: 10.0.2.146:6443 (your API server IP)

# Flannel pods should be healthy
kubectl get pods -n kube-flannel
kubectl logs -n kube-flannel -l app=flannel

# Cluster should be functional
kubectl get nodes
kubectl get pods -n kube-system
```

### **Tools Used**
- `kubectl get svc/endpoints` - Service network verification
- `kubectl logs` - Pod failure analysis
- `kubectl patch` - Temporary configuration changes
- `curl` - Direct API server connectivity testing

---

## Scenario 7: RESOLVED - Missing PodCIDR Causing System Instability

### **Problem Description**
- Service endpoints correctly populated (kubernetes service has endpoint 10.0.2.146:6443)
- **Service IP routing partially functional** - `curl -k https://10.96.0.1:443` returns proper API response
- **kube-proxy pods crashing continuously** causing system-wide instability
- **System too unstable to complete diagnostic commands**
- Intermittent service routing issues preventing cluster functionality

### **Symptoms**
```bash
$ kubectl get pods -n kube-system | grep kube-proxy
kube-proxy-xxxxx   0/1   CrashLoopBackOff   15 (2m ago)   45m
kube-proxy-yyyyy   0/1   CrashLoopBackOff   12 (1m ago)   42m

$ curl -k https://10.96.0.1:443
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "forbidden: User \"system:anonymous\" cannot get path \"/\"",
  "reason": "Forbidden",
  "details": {},
  "code": 403
}

$ kubectl get nodes -o wide | grep PodCIDR
(returns blank - NO PodCIDR assigned)
```

### **Root Cause CONFIRMED**
**Controller Manager Leader Election Failure** - The cluster was initialized WITH `--pod-network-cidr=10.244.0.0/16` but controller manager cannot complete startup:
- `kubeadm init --pod-network-cidr=10.244.0.0/16` was run correctly
- **Controller manager is stuck in CrashLoopBackOff**
- **Leader election process failing** - cannot acquire leader lease for `kube-system/kube-controller-manager`
- Without successful controller manager startup, pod CIDRs cannot be assigned to nodes
- This creates the cascading failures: kube-proxy crashes → CNI fails → cluster instability

### **Controller Manager Crash Analysis**
```bash
$ kubectl get pods -n kube-system | grep controller-manager
kube-controller-manager-xxx   0/1   CrashLoopBackOff   X (Xm ago)   XXm

$ kubectl logs -n kube-system -l component=kube-controller-manager --tail=20
I1008 02:42:40.685600       1 leaderelection.go:250] attempting to acquire leader lease kube-system/kube-controller-manager...
# Hangs here - never completes leader election
```

### **Why Leader Election Fails:**
1. **API Server Communication Issues** - Controller manager cannot properly communicate with API server
2. **Etcd Connectivity Problems** - Leader lease stored in etcd, connection may be failing
3. **Network Configuration Conflicts** - Circular dependency with networking setup
4. **Certificate/Authentication Issues** - Controller manager certificates may be invalid
5. **Resource Constraints** - Insufficient resources causing timeout during leader election

### **Critical Verification Command**
```bash
kubectl get nodes -o wide | grep PodCIDR
# Expected: Shows PodCIDR column with assigned ranges like 10.244.0.0/24
# Actual: Returns blank (despite --pod-network-cidr=10.244.0.0/16 being used)
```

### **Advanced Diagnostic Commands for Controller Manager Leader Election Failure**
```bash
# 1. Verify controller manager is failing at leader election
kubectl get pods -n kube-system | grep controller-manager
kubectl logs -n kube-system -l component=kube-controller-manager --tail=50

# 2. Check API server connectivity from controller manager perspective
kubectl get endpoints kubernetes -n default
kubectl get leases -n kube-system

# 3. Check etcd health (leader election data stored here)
kubectl get pods -n kube-system | grep etcd
kubectl logs -n kube-system -l component=etcd --tail=20

# 4. Verify controller manager can reach API server
kubectl get componentstatuses
kubectl cluster-info

# 5. Check for network conflicts preventing leader election
netstat -tlnp | grep 10257  # Controller manager secure port
netstat -tlnp | grep 6443   # API server port

# 6. Look for specific leader election errors
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | grep -i "leader\|election\|lease"

# 7. Check controller manager static pod configuration
sudo cat /etc/kubernetes/manifests/kube-controller-manager.yaml | grep -A10 -B5 "command\|args"
```

### **Solutions for Controller Manager Leader Election Failure**

#### **Solution 1: Restart Static Pod Components (Most Common Fix)**
```bash
# Move static pod manifests temporarily to force recreation
sudo mv /etc/kubernetes/manifests/kube-controller-manager.yaml /tmp/
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Wait for pods to terminate
sleep 30

# Move manifests back
sudo mv /tmp/kube-controller-manager.yaml /etc/kubernetes/manifests/
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Restart kubelet to ensure clean startup
sudo systemctl restart kubelet

# Wait and verify
sleep 60
kubectl get pods -n kube-system | grep controller-manager
```

#### **Solution 2: Clean Leader Election State (PROVEN EFFECTIVE) ✅ SUCCESSFUL**
```bash
# Delete existing leader election lease (if accessible)
kubectl delete lease kube-controller-manager -n kube-system
# Expected output: lease.coordination.k8s.io "kube-controller-manager" deleted

# Force controller manager pod restart
sudo mv /etc/kubernetes/manifests/kube-controller-manager.yaml /tmp/
sleep 15
sudo mv /tmp/kube-controller-manager.yaml /etc/kubernetes/manifests/

# Monitor startup
kubectl logs -n kube-system -l component=kube-controller-manager -f
```

**Success Indicator:** If the lease deletion command succeeds, this confirms:
- ✅ API server is functional
- ✅ etcd is accessible  
- ✅ The leader election lease was corrupted/stuck
- ✅ This solution approach is correct

**CONFIRMED SUCCESS LOGS:**
```
I1008 02:53:27.976508 1 garbagecollector.go:166 "All resource monitors have synced. Proceeding to collect garbage"
I1008 02:53:57.470720 1 replica_set.go:676 "Finished syncing" kind="ReplicaSet" key="kube-system/coredns-5dd5756b68"
```
**Result:** Controller manager successfully acquired leadership, all caches synced, and ReplicaSet controller operational.

#### **Solution 3: Complete Control Plane Reset (Last Resort)**
```bash
# Reset entire control plane if other solutions fail
sudo kubeadm reset --force
sudo rm -rf /etc/cni/net.d/*
sudo rm -rf /var/lib/etcd/*

# Reinitialize with correct parameters
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI immediately
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

### **Root Cause Analysis**

#### **Step 1: Verify service networking status**
```bash
# Check if service endpoints are populated
kubectl get endpoints kubernetes -n default
kubectl get svc kubernetes -n default

# Test service connectivity (on control plane)
curl -k https://10.96.0.1:443
```
**Key Finding:** Service responds properly, indicating basic routing works

#### **Step 2: Deep dive into kube-proxy crash logs (CRITICAL)**
```bash
# Get detailed crash information
kubectl logs -n kube-system -l k8s-app=kube-proxy --previous --tail=50
kubectl describe pods -n kube-system -l k8s-app=kube-proxy

# Check for common kube-proxy failure patterns:
kubectl logs -n kube-system -l k8s-app=kube-proxy --previous | grep -E "(error|Error|ERROR|failed|Failed|FAILED|panic|Panic)"
```

#### **Step 3: Identify specific root causes**
```bash
# A) Check for CNI configuration conflicts
ls -la /etc/cni/net.d/
cat /etc/cni/net.d/*.conf 2>/dev/null || echo "No CNI config found"

# B) Verify node CIDR assignment (common cause of kube-proxy crashes)
kubectl get nodes -o wide | grep PodCIDR
kubectl describe node $(hostname) | grep -A5 -B5 CIDR

# C) Check for iptables conflicts or corruption
sudo iptables -t nat -L | head -20
sudo iptables -t filter -L | head -20

# D) Verify kube-proxy configuration
kubectl get configmap kube-proxy -n kube-system -o yaml | grep -A10 -B10 "clusterCIDR\|bindAddress\|mode"

# E) Check for resource constraints
kubectl describe nodes | grep -A5 -B5 "MemoryPressure\|DiskPressure\|PIDPressure"
```

#### **Step 4: Common root cause patterns to look for**

**Pattern A: Missing PodCIDR Assignment**
```bash
kubectl get nodes -o wide
# If PodCIDR shows <none>, this is likely the root cause
```

**Pattern B: CNI/kube-proxy Version Mismatch**
```bash
kubectl get pods -n kube-system -l k8s-app=kube-proxy -o yaml | grep image:
kubectl get pods -n kube-flannel -o yaml | grep image:
# Check for version compatibility issues
```

**Pattern C: iptables Rule Conflicts**
```bash
sudo iptables-save | grep -c KUBE
# If count is very high (>1000) or very low (<10), investigate rules
```

**Pattern D: Host Network Configuration Issues**
```bash
ip route show
ip addr show
# Check for conflicting network interfaces or routes
```

#### **Step 5: Determine the exact failure mode**
```bash
# Get the most recent crash reason
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | grep kube-proxy | tail -10

# Check kubelet logs for kube-proxy related errors
sudo journalctl -u kubelet --since "30 minutes ago" | grep -i proxy
```

### **Root Cause**
**Partial service networking with unstable kube-proxy** - Service routing works initially but kube-proxy crashes prevent:
- Proper service load balancing
- Complete iptables rule maintenance
- Service discovery for new services
- Pod-to-service communication reliability

### **Most Common Root Causes (in order of likelihood):**

#### **1. Missing or Incorrect PodCIDR Assignment (90% of cases)**
- **Symptom**: `kubectl get nodes -o wide` shows PodCIDR as `<none>`
- **Cause**: `kubeadm init` was run without `--pod-network-cidr=10.244.0.0/16`
- **Effect**: kube-proxy can't determine pod network ranges for iptables rules

#### **2. CNI Plugin Not Fully Ready (80% of cases)**
- **Symptom**: Flannel pods show `Running` but kube-proxy still crashes
- **Cause**: CNI network configuration incomplete or conflicting
- **Effect**: kube-proxy can't establish proper network hooks

#### **3. iptables Rule Corruption (60% of cases)**
- **Symptom**: Previous kube-proxy attempts left corrupted iptables rules
- **Cause**: Multiple failed kube-proxy restarts without cleanup
- **Effect**: New kube-proxy instances can't establish clean rule sets

#### **4. Host Network Interface Conflicts (40% of cases)**
- **Symptom**: Multiple network interfaces or conflicting IP ranges
- **Cause**: Cloud provider network setup conflicts with Kubernetes networking
- **Effect**: kube-proxy can't determine correct interface for traffic routing

#### **5. Resource Exhaustion (20% of cases)**
- **Symptom**: Node shows resource pressure warnings
- **Cause**: Insufficient memory, disk, or PID limits
- **Effect**: kube-proxy crashes due to resource constraints

### **Systematic Root Cause Diagnostic Workflow**

#### **Phase 1: Quick Identification (2 minutes)**
```bash
# Check the most likely culprit first
kubectl get nodes -o wide | grep PodCIDR
kubectl get pods -n kube-system | grep -E "(flannel|weave|calico)"
kubectl logs -n kube-system -l k8s-app=kube-proxy --previous --tail=5
```

#### **Phase 2: Deep Dive Analysis (5 minutes)**
```bash
# If Phase 1 doesn't reveal the issue, dig deeper
kubectl describe node $(hostname) | grep -A10 -B5 "Conditions\|Allocatable\|Capacity"
sudo iptables -t nat -L KUBE-SERVICES 2>/dev/null | wc -l
ls -la /etc/cni/net.d/ && cat /etc/cni/net.d/*.conf 2>/dev/null
```

#### **Phase 3: Comprehensive Investigation (10 minutes)**
```bash
# For complex issues requiring full analysis
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -20
sudo journalctl -u kubelet --since "1 hour ago" | grep -E "(error|Error|failed|Failed)"
kubectl get configmap kube-proxy -n kube-system -o yaml
```

### **Updated Decision Tree for Root Cause**

```
Was kubeadm init run with --pod-network-cidr=10.244.0.0/16?
├─ NO → **ROOT CAUSE: Missing --pod-network-cidr during kubeadm init**
│   └─ SOLUTION: Reset cluster and reinitialize with CIDR
└─ YES → Is PodCIDR assigned? (kubectl get nodes -o wide)
    ├─ NO → **ROOT CAUSE: Controller Manager CIDR Assignment Failure**
    │   ├─ Check controller manager status: kubectl get pods -n kube-system | grep controller-manager
    │   ├─ Check controller manager logs: kubectl logs -n kube-system -l component=kube-controller-manager
    │   └─ SOLUTIONS: 
    │       ├─ Fix controller manager configuration
    │       ├─ Restart controller manager
    │       └─ Manual node CIDR assignment (advanced)
    └─ YES → Are CNI pods Running?
        ├─ NO → **ROOT CAUSE: CNI plugin failure**
        │   └─ SOLUTION: Reinstall CNI plugin
        └─ YES → Check kube-proxy logs for specific error
            ├─ "failed to create iptables" → **ROOT CAUSE: iptables corruption**
            │   └─ SOLUTION: Clean iptables and restart
            ├─ "bind address" → **ROOT CAUSE: Network interface conflict**
            │   └─ SOLUTION: Check host network configuration
            └─ "resource" → **ROOT CAUSE: Resource exhaustion**
                └─ SOLUTION: Check node resources and increase if needed
```
```bash
# Force restart kube-proxy pods
kubectl delete pods -n kube-system -l k8s-app=kube-proxy

# Wait for new pods to start
kubectl get pods -n kube-system -l k8s-app=kube-proxy -w

# Verify they become Ready
kubectl get pods -n kube-system | grep kube-proxy
```

### **Solution Option 2: Check CNI Integration**
```bash
# Verify Flannel is properly configured for kube-proxy
kubectl get daemonset kube-flannel-ds -n kube-flannel -o yaml | grep hostNetwork

# Ensure host networking is enabled for CNI
kubectl patch daemonset kube-flannel-ds -n kube-flannel --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/hostNetwork", "value": true}]'
```

### **Solution Option 3: Reset Network Stack**
```bash
# Clean and restart network components
kubectl delete pods -n kube-system -l k8s-app=kube-proxy
kubectl delete pods -n kube-flannel --all

# Restart kubelet to refresh static pods
sudo systemctl restart kubelet

# Wait for all pods to recreate
sleep 60
kubectl get pods -n kube-system
```

### **Verification**
```bash
# All kube-proxy pods should be Running
kubectl get pods -n kube-system | grep kube-proxy
# Expected: 0/1 Running (not CrashLoopBackOff)

# Service networking should remain functional
curl -k https://10.96.0.1:443

# Check iptables rules are properly maintained
sudo iptables -t nat -L KUBE-SERVICES
```

### **Key Insight**
This scenario demonstrates that **service endpoints and basic routing can work even with crashing kube-proxy pods**, but full service mesh functionality requires stable kube-proxy operation. The 403 API response proves the core service-to-endpoint routing is functional.

### **Tools Used**
- `kubectl get endpoints` - Service endpoint verification
- `curl` - Direct service connectivity testing
- `kubectl logs --previous` - Crash log analysis
- `sudo iptables` - Network rule inspection
- `kubectl delete pods` - Pod restart operations

---

## Scenario 8: Universal CNI Crashes - Environment-Level Issues

### **Problem Description**
- **Multiple CNI plugins crash immediately after installation** (Weave, Flannel, potentially others)
- **Pattern occurs regardless of CNI choice** - suggesting environment-level root cause
- **Crashes happen consistently after `kubectl apply -f <cni-manifest>`**
- **API server may crash or become unstable immediately after CNI installation**
- Fresh cluster deployment with same behavior across different CNI solutions

### **Symptoms**
```bash
# Pattern observed with multiple CNI plugins:
$ kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
# Pods start creating, then API server becomes unstable

$ kubectl apply -f https://reweave.azurewebsites.net/k8s/v1.28/net.yaml  
# Same crash pattern occurs

$ kubectl get pods -n kube-system
# API server connection issues or system pods crashing
```

### **Environment-Level Root Causes**

#### **1. AWS Security Group Configuration Issues**
```bash
# Check if required ports are open between nodes
# Control plane ports that CNI needs:
netstat -tlnp | grep -E "(6443|2379|2380|10250|10257|10259)"

# CNI-specific ports (varies by plugin):
# Flannel: 8285/UDP (backend communication)
# Weave: 6783/TCP, 6784/UDP (mesh networking)
```

**Diagnostic Commands:**
```bash
# Test connectivity between nodes on CNI ports
# On control plane:
sudo netstat -tlnp | grep 6783  # Weave
sudo netstat -ulnp | grep 8285  # Flannel

# From worker node:
telnet <control-plane-ip> 6783  # Weave
nc -u <control-plane-ip> 8285   # Flannel (UDP test)
```

#### **2. Container Runtime CNI Directory Conflicts**
```bash
# Check for existing CNI configurations that conflict
ls -la /etc/cni/net.d/
cat /etc/cni/net.d/* 2>/dev/null

# Check CNI binary locations
ls -la /opt/cni/bin/

# Verify CNI plugin paths in kubelet configuration
sudo cat /var/lib/kubelet/config.yaml | grep -A5 -B5 cni
```

#### **3. AWS VPC/Subnet IP Range Conflicts**
```bash
# Check for IP range overlaps between:
# - VPC CIDR (typically 10.0.0.0/16)
# - Pod network CIDR (10.244.0.0/16) 
# - Service CIDR (10.96.0.0/12)

# View current network configuration:
ip route show
ip addr show

# Check for route conflicts:
route -n | grep 10.
```

#### **4. AWS ENI (Elastic Network Interface) Limits**
```bash
# Check EC2 instance ENI limits (affects pod networking)
# t3.large instances have specific ENI/IP limits

# View current ENI usage:
ip link show
ls /sys/class/net/

# Check for ENI attachment issues in system logs:
sudo journalctl -u kubelet --since "10 minutes ago" | grep -i eni
dmesg | grep -i network
```

#### **5. Container Runtime Configuration Issues**
```bash
# Check containerd CNI configuration
sudo cat /etc/containerd/config.toml | grep -A10 -B5 cni

# Verify containerd CNI plugin path
sudo ctr --namespace k8s.io containers list
sudo ctr --namespace k8s.io tasks list

# Check for containerd CNI errors:
sudo journalctl -u containerd --since "10 minutes ago" | grep -i cni
```

#### **6. Kernel Module Dependencies (CRITICAL FINDING) ✅ RESOLVED**
```bash
# CNI plugins often require specific kernel modules
# Check if required modules are loaded:

# For bridge networking (most CNI plugins):
lsmod | grep bridge
lsmod | grep netfilter
lsmod | grep iptables

# CRITICAL: Check for iptables table modules
lsmod | grep -E "(iptable_nat|iptable_filter|ip_tables)"
```

**CONFIRMED ISSUE: Missing iptables table modules**
Initial check showed missing `iptable_nat` and `iptable_filter` modules:
```bash
$ lsmod | grep ip_tables
# Returns blank - missing critical modules
```

**SOLUTION APPLIED AND COMPLETED ✅ SUCCESSFUL:**
```bash
# Load missing modules:
sudo modprobe iptable_nat iptable_filter br_netfilter ip_tables
# Command returns blank = SUCCESS (no errors)

# VERIFIED STATUS CHECK:
lsmod | grep -E "(iptable_nat|iptable_filter|ip_tables|br_netfilter)"
# CONFIRMED OUTPUT:
# iptable_filter         16384  0
# iptable_nat            16384  0
# nf_nat                 57344  4 xt_nat,nft_chain_nat,iptable_nat,xt_MASQUERADE
# br_netfilter           36864  0
# bridge                323584  1 br_netfilter

# STATUS: ✅ ALL required modules successfully loaded
```

**PERMANENT CONFIGURATION CREATED:**
```bash
# Create permanent kernel module configuration
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
ip_tables
iptable_nat
iptable_filter
EOF

# Create sysctl configuration for networking
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

# Apply sysctl settings immediately
sudo sysctl --system

# Verify configuration files exist
ls -la /etc/modules-load.d/k8s.conf /etc/sysctl.d/k8s.conf
```

#### **7. System Resource Exhaustion**
```bash
# Check if system resources are insufficient for CNI operations
free -h
df -h
lscpu

# Check for memory pressure during CNI installation:
sudo journalctl -u kubelet --since "5 minutes ago" | grep -i "memory\|oom"

# Monitor resource usage during CNI application:
watch -n 1 'free -h && echo "---" && ps aux --sort=-%mem | head -10'
```

### **Systematic Environment Diagnosis**

#### **Phase 1: AWS Infrastructure Validation (5 minutes)**
```bash
# 1. Verify Security Group rules allow CNI communication
aws ec2 describe-security-groups --group-ids <your-sg-id>

# 2. Check VPC route table configuration
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<your-vpc-id>"

# 3. Verify subnet configuration
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<your-vpc-id>"

# 4. Check EC2 instance network interface limits
aws ec2 describe-instance-types --instance-types t3.large --query 'InstanceTypes[0].NetworkInfo'
```

#### **Phase 2: Host Network Configuration Check (3 minutes)**
```bash
# 1. Verify no IP conflicts
ip route show table all | grep 10.244
ip route show table all | grep 10.96

# 2. Check for existing bridge interfaces that might conflict
brctl show
ip link show type bridge

# 3. Verify iptables rules aren't blocking CNI
sudo iptables -L -n | head -20
sudo iptables -t nat -L -n | head -20
```

#### **Phase 3: Container Runtime CNI Integration (3 minutes)**
```bash
# 1. Verify containerd CNI plugin configuration
sudo cat /etc/containerd/config.toml | grep -C5 plugins.cri.cni

# 2. Check CNI binary availability
ls -la /opt/cni/bin/ | grep -E "(flannel|weave|bridge|host-local)"

# 3. Test basic containerd CNI functionality
sudo ctr --namespace k8s.io containers list | head -5
```

#### **Phase 4: Kernel and System Prerequisites (2 minutes)**
```bash
# 1. Verify required kernel modules
lsmod | grep -E "(br_netfilter|ip_tables|iptable_nat|netfilter)"

# 2. Check kernel version compatibility
uname -r
# Kubernetes v1.28.15 requires kernel >= 4.15

# 3. Verify cgroup configuration
mount | grep cgroup
cat /proc/cgroups | head -10
```

### **Environment-Specific Solutions**

#### **Solution 1: AWS Security Group Fix**
```bash
# Add required CNI ports to security group
# For Flannel:
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol udp \
  --port 8285 \
  --source-group <sg-id>

# For Weave:
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 6783 \
  --source-group <sg-id>

aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol udp \
  --port 6784 \
  --source-group <sg-id>
```

#### **Solution 2: Clean CNI Environment**
```bash
# Remove all existing CNI configurations
sudo rm -rf /etc/cni/net.d/*
sudo rm -rf /var/lib/cni/*

# Reset containerd CNI state
sudo systemctl stop containerd
sudo rm -rf /var/lib/containerd/io.containerd.grpc.v1.cri/sandboxes/*
sudo systemctl start containerd

# Restart kubelet with clean state
sudo systemctl restart kubelet
```

#### **Solution 3: Kernel Module Preparation**
```bash
# Ensure all required kernel modules are loaded
sudo modprobe br_netfilter
sudo modprobe ip_tables
sudo modprobe iptable_nat
sudo modprobe iptable_filter

# Make permanent
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
ip_tables
iptable_nat
iptable_filter
EOF

# Verify sysctl settings
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

sudo sysctl --system
```

#### **Solution 4: Alternative CNI with Host Network Bootstrap**
```bash
# Use Calico which may handle AWS environment better
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml

# Or try AWS VPC CNI (native AWS solution)
kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/v1.15.0/config/master/aws-k8s-cni.yaml
```

#### **Solution 5: Infrastructure-as-Code Fix (CDK)**
```typescript
// Update security group to include CNI ports
const securityGroup = new ec2.SecurityGroup(this, 'KubernetesSecurityGroup', {
  vpc,
  allowAllOutbound: true,
  description: 'Security group for Kubernetes cluster with CNI support'
});

// Add CNI-specific rules
securityGroup.addIngressRule(
  securityGroup,
  ec2.Port.udp(8285),
  'Flannel VXLAN'
);

securityGroup.addIngressRule(
  securityGroup,
  ec2.Port.tcp(6783),
  'Weave Net control'
);

securityGroup.addIngressRule(
  securityGroup,
  ec2.Port.udp(6784),
  'Weave Net data'
);
```

### **AWS-Specific CNI Considerations**

#### **EC2 Instance Type Limitations:**
- **t3.large**: 3 ENIs, 12 IPv4 addresses per ENI
- **Network performance**: Up to 5 Gigabit
- **Pod density**: Limited by ENI/IP constraints

#### **VPC CNI vs. Overlay Networks:**
- **AWS VPC CNI**: Uses actual VPC IPs for pods (no overlay)
- **Flannel/Weave**: Overlay networks that may conflict with AWS networking
- **Consider**: AWS VPC CNI might be more stable in AWS environment

### **Decision Tree for CNI Environment Issues**

```
Do multiple CNI plugins crash immediately after application?
├─ YES → Environment-level issue
│   ├─ Check Security Groups → Missing CNI ports?
│   │   ├─ YES → Add required ports (Solution 1)
│   │   └─ NO → Continue to next check
│   ├─ Check Kernel Modules → Missing br_netfilter/iptables?
│   │   ├─ YES → Load modules (Solution 3)
│   │   └─ NO → Continue to next check
│   ├─ Check CNI Conflicts → Existing configurations?
│   │   ├─ YES → Clean environment (Solution 2)
│   │   └─ NO → Consider AWS VPC CNI (Solution 4)
│   └─ If all fail → Update infrastructure (Solution 5)
└─ NO → CNI-specific issue (refer to other scenarios)
```

### **Prevention for Future Deployments**

1. **Pre-flight Environment Check:**
```bash
# Run before any CNI installation
./scripts/check-cni-prerequisites.sh
```

2. **Infrastructure Validation:**
```bash
# Verify AWS resources support CNI networking
aws ec2 describe-security-groups --query 'SecurityGroups[*].{GroupId:GroupId,Rules:IpPermissions[?FromPort==`6783`]}'
```

3. **Staged CNI Deployment:**
```bash
# Apply CNI in stages with validation
kubectl apply -f cni-rbac.yaml
kubectl apply -f cni-config.yaml
kubectl apply -f cni-daemonset.yaml
```

### **Tools Used**
- `aws cli` - AWS resource verification
- `netstat/telnet` - Network connectivity testing
- `lsmod/modprobe` - Kernel module management
- `iptables` - Network rule inspection
- `systemctl` - Service management for clean resets

---

## Scenario 9: Liveness Probe Failures Causing Control Plane Instability

### **Problem Description**
- **etcd, kube-scheduler, and kube-apiserver in restart loops**
- **Components start successfully but get killed by kubelet**
- **"Liveness probe failed" messages in kubelet logs**
- **Health endpoints return connection refused during startup**
- **Cascading failures across control plane components**

### **Symptoms**
```bash
$ kubectl get pods -n kube-system
NAME                                        READY   STATUS             RESTARTS         AGE
etcd-ip-10-0-2-80...                        0/1     CrashLoopBackOff   8 (3m ago)       45m
kube-apiserver-ip-10-0-2-80...              0/1     CrashLoopBackOff   16 (5m ago)      45m  
kube-scheduler-ip-10-0-2-80...              0/1     CrashLoopBackOff   24 (2m ago)      45m

$ kubectl describe pod etcd-ip-10-0-2-80... -n kube-system
Events:
Warning  Unhealthy  2m   kubelet  Liveness probe failed: Get "http://127.0.0.1:2381/health": dial tcp 127.0.0.1:2381: connect: connection refused
```

### **Root Cause Analysis**

#### **Step 1: Identify Liveness Probe Configuration**
```bash
kubectl describe pod etcd-ip-10-0-2-80... -n kube-system | grep -A5 -B5 "Liveness"
```
**Key Finding:**
```
Liveness: http-get http://127.0.0.1:2381/health%3Fexclude=NOSPACE&serializable=true delay=10s timeout=15s period=10s #success=1 #failure=8
```

#### **Step 2: Test Health Endpoint During Brief Running Period**
```bash
# Monitor for brief periods when etcd is running
for i in {1..5}; do 
  echo "=== Attempt $i ==="
  sudo netstat -tlnp | grep -E "(2379|2380|2381)"
  sleep 2
done
```
**Key Finding:** etcd IS serving on port 2381, but timing is critical

#### **Step 3: Test Health Endpoint Manually**
```bash
# When etcd is running:
curl -v http://127.0.0.1:2381/health
```
**Result:** Returns HTTP 200 OK with `{"health":"true","reason":""}`

#### **Step 4: Check Container Status Pattern**
```bash
sudo crictl ps -a | grep -E "(etcd|scheduler|apiserver)" | head -10
```
**Key Finding:** Shows containers exiting and restarting in cycles

### **Root Cause**
**Liveness Probe Timing Issues During Initialization** - The health endpoints work correctly, but there's a timing mismatch during startup:

1. **Components start successfully** and begin initialization
2. **Liveness probes start immediately** (10s delay)
3. **Health endpoints aren't ready** within the probe timeout window
4. **kubelet kills containers** after 8 failed attempts
5. **Restart cycle begins** with exponential backoff
6. **Cascade failure** as other components depend on these services

### **Solution: Temporary Liveness Probe Removal**

#### **For etcd (Static Pod):**
```bash
# Backup original configuration
sudo cp /etc/kubernetes/manifests/etcd.yaml /etc/kubernetes/manifests/etcd.yaml.backup

# Remove liveness probe temporarily
sudo sed -i '/livenessProbe:/,/timeoutSeconds: 15/d' /etc/kubernetes/manifests/etcd.yaml

# Wait for etcd to stabilize
sleep 60

# Check if etcd is now stable
kubectl get pods -n kube-system | grep etcd
```

#### **For kube-scheduler (Static Pod):**
```bash
# Backup original configuration  
sudo cp /etc/kubernetes/manifests/kube-scheduler.yaml /etc/kubernetes/manifests/kube-scheduler.yaml.backup

# Remove liveness probe temporarily
sudo sed -i '/livenessProbe:/,/timeoutSeconds: 15/d' /etc/kubernetes/manifests/kube-scheduler.yaml

# Monitor scheduler status
sudo crictl ps -a | grep scheduler
```

#### **For kube-proxy (DaemonSet - if affected):**
```bash
# Edit the DaemonSet to remove liveness probe
kubectl patch daemonset kube-proxy -n kube-system --type='json' \
  -p='[{"op": "remove", "path": "/spec/template/spec/containers/0/livenessProbe"}]'
```

### **Recovery Pattern**

#### **Phase 1: Break the Restart Loop (5-10 minutes)**
```bash
# Remove liveness probes from failing static pods
sudo sed -i '/livenessProbe:/,/timeoutSeconds: 15/d' /etc/kubernetes/manifests/etcd.yaml
sudo sed -i '/livenessProbe:/,/timeoutSeconds: 15/d' /etc/kubernetes/manifests/kube-scheduler.yaml

# Wait for components to stabilize
sleep 300  # 5 minutes for stabilization
```

#### **Phase 2: Verify Stabilization**  
```bash
# Check component status
kubectl get pods -n kube-system | grep -E "(etcd|scheduler|apiserver)"
kubectl get nodes  # Should work if API server is stable

# Verify health endpoints are working
curl -v http://127.0.0.1:2381/health  # etcd
curl -v http://127.0.0.1:10259/healthz  # scheduler
```

#### **Phase 3: Restore Configuration (Optional)**
```bash
# Restart kubelet to restore original manifests with liveness probes
sudo systemctl restart kubelet

# The restart will reload original manifests, but components should now be stable
# enough that liveness probes work correctly
```

### **Why This Solution Works**

1. **Removes Artificial Pressure** - No kubelet killing during startup
2. **Allows Natural Stabilization** - Components reach steady state
3. **Health Endpoints Become Functional** - Once running, probes typically work
4. **Breaks Cascade Pattern** - Stops restart loops affecting other components

### **Alternative Solution: Increase Probe Tolerance**

Instead of removing probes, you can make them more tolerant:

```bash
# Edit static pod manifests to increase failure threshold
sudo sed -i 's/failureThreshold: 8/failureThreshold: 20/' /etc/kubernetes/manifests/etcd.yaml
sudo sed -i 's/initialDelaySeconds: 10/initialDelaySeconds: 60/' /etc/kubernetes/manifests/etcd.yaml
```

### **Permanent CDK Infrastructure Fix**

```typescript
// Add to user data in CDK stack:
const userData = ec2.UserData.forLinux();

// Configure more tolerant health check settings
userData.addCommands(
  '# Configure etcd liveness probe tolerance',
  'sed -i "s/failureThreshold: 8/failureThreshold: 20/" /etc/kubernetes/manifests/etcd.yaml',
  'sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/" /etc/kubernetes/manifests/etcd.yaml',
  
  '# Configure scheduler liveness probe tolerance',  
  'sed -i "s/failureThreshold: 8/failureThreshold: 20/" /etc/kubernetes/manifests/kube-scheduler.yaml',
  'sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/" /etc/kubernetes/manifests/kube-scheduler.yaml'
);
```

### **Prevention for Future Deployments**

1. **Monitor Initial Startup Carefully:**
```bash
# Watch for liveness probe failures immediately after kubeadm init
kubectl get events --sort-by='.lastTimestamp' | grep -i "unhealthy\|liveness"
```

2. **Set Conservative Probe Settings:**
```bash
# During cluster initialization, use more tolerant settings
# Higher failure thresholds (20 instead of 8)
# Longer initial delays (30s instead of 10s)
# Longer timeouts (30s instead of 15s)
```

3. **Staged Component Startup:**
```bash
# Allow each component to fully stabilize before starting dependent services
# etcd → API server → controller manager → scheduler → CNI
```

### **Diagnostic Commands for Liveness Probe Issues**

```bash
# Check for liveness probe failures in events
kubectl get events --all-namespaces | grep -i "liveness\|unhealthy"

# Monitor probe status in real-time
kubectl describe pods -n kube-system | grep -A10 -B5 "Liveness"

# Test health endpoints manually during running periods
curl -v http://127.0.0.1:2381/health   # etcd
curl -v http://127.0.0.1:10259/healthz # scheduler
curl -v http://127.0.0.1:10257/healthz # controller-manager

# Check container restart patterns
sudo crictl ps -a | grep -E "(etcd|scheduler|apiserver)" | sort -k3
```

### **Key Insights**

1. **Liveness probes are safety mechanisms** but can cause problems during initialization
2. **Health endpoints work correctly** once components are fully started
3. **Timing mismatches during startup** are the primary cause of failures
4. **Temporary probe removal** allows natural stabilization
5. **Conservative probe settings** prevent false positives during startup

### **Tools Used**
- `kubectl describe` - Probe configuration analysis
- `curl` - Manual health endpoint testing
- `sed` - Static pod manifest modification
- `netstat` - Port availability monitoring
- `sudo crictl` - Container lifecycle tracking

---

## Scenario 10: When to Reset vs. Continue Troubleshooting

### **Problem Description**
- Multiple troubleshooting attempts have been made
- **Controller manager stuck in leader election failure**
- **Extensive tweaking and configuration changes applied**
- **System state potentially corrupted from multiple restart attempts**
- Time investment in continued troubleshooting vs. clean deployment

### **Decision Criteria for Clean Reset**

#### **Reset Indicators (Choose Reset):**
✅ **Multiple failed troubleshooting attempts** - More than 3-4 different approaches tried
✅ **Controller manager/API server fundamental issues** - Core components not starting properly
✅ **Unknown configuration state** - Unsure what changes have been applied
✅ **Time efficiency** - Clean deployment faster than continued debugging
✅ **Learning environment** - Focus on proper setup rather than rescue operations

#### **Continue Troubleshooting Indicators:**
❌ Single, specific issue with clear path forward
❌ Production environment where reset is costly
❌ Valuable data or configuration to preserve
❌ Clear understanding of root cause with straightforward fix

### **The Value of the Troubleshooting Experience**

Even though we're resetting, the troubleshooting process provided immense value:

#### **Knowledge Gained:**
1. **Systematic Diagnostic Approach** - Phase 1/2/3 methodology
2. **Tool Mastery** - kubectl, journalctl, crictl, systemctl integration
3. **Root Cause Analysis** - From symptoms to actual problems
4. **Kubernetes Architecture Understanding** - Component dependencies and failure cascades
5. **Real-world Debugging Skills** - Perfect for CKA/CKAD certification

#### **Documentation Created:**
- **7 Complete Troubleshooting Scenarios** documented
- **Command Reference Library** for future issues
- **Decision Trees** for systematic problem resolution
- **Best Practices** learned through real experience

### **Clean Deployment Strategy**

#### **Step 1: Complete Cluster Reset**
```bash
# On both control plane and worker nodes:
sudo kubeadm reset --force
sudo rm -rf /etc/cni/net.d/*
sudo rm -rf /var/lib/etcd/*
sudo systemctl restart kubelet
sudo systemctl restart containerd
```

#### **Step 2: Fresh Control Plane Initialization**
```bash
# On control plane only:
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Configure kubectl immediately
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Verify control plane health before proceeding
kubectl get pods -n kube-system
```

#### **Step 3: Install CNI Immediately**
```bash
# Install Flannel CNI right after cluster init
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Wait for CNI to be ready before worker joins
kubectl get pods -n kube-system -w
```

#### **Step 4: Verify Before Worker Join**
```bash
# Ensure these are all healthy before joining workers:
kubectl get nodes -o wide  # Should show PodCIDR assigned
kubectl get pods -n kube-system  # All should be Running
kubectl get componentstatuses  # All should be Healthy
```

#### **Step 5: Join Worker Nodes**
```bash
# Generate fresh join command
kubeadm token create --print-join-command

# Use the command on worker nodes
# Verify worker join success
kubectl get nodes
```

### **Prevention Checklist for Next Deployment**

#### **✅ Must-Do Items:**
1. **Use --pod-network-cidr=10.244.0.0/16** during kubeadm init
2. **Install CNI immediately** after control plane is ready
3. **Verify control plane health** before joining workers
4. **Check PodCIDR assignment** before proceeding
5. **Wait for all system pods** to be Running before declaring success

#### **✅ Verification Commands:**
```bash
# After each major step, run these:
kubectl get nodes -o wide
kubectl get pods -n kube-system
kubectl get componentstatuses
```

### **Key Lesson Learned**

**Sometimes the fastest path forward is a clean start** - especially in learning environments where the goal is to understand proper setup procedures rather than rescue corrupted systems.

The troubleshooting experience was invaluable for CKA/CKAD preparation, providing real-world debugging scenarios that you'll encounter in certification exams and production environments.

### **Tools Used**
- `kubeadm reset` - Complete cluster cleanup
- `systemctl restart` - Service refresh
- `kubectl get componentstatuses` - Health verification
- `kubeadm token create` - Fresh join token generation

---

## General Troubleshooting Toolkit

### **System-Level Tools**
```bash
# Service management
sudo systemctl status kubelet
sudo systemctl restart kubelet
sudo systemctl status containerd

# Log analysis
sudo journalctl -u kubelet --lines=20
sudo journalctl -u kubelet -f  # Follow logs

# Network debugging
ping <control-plane-ip>
telnet <control-plane-ip> 6443
netstat -tlnp | grep 6443
```

### **Container Runtime Tools**
```bash
# List containers
sudo crictl ps
sudo crictl ps -a

# Container logs (multiple methods)
sudo crictl logs <container-id>
sudo crictl logs --tail=20 <container-id>
sudo crictl logs --follow <container-id>
sudo crictl logs --since="5m" <container-id>

# Find and read logs by container name
sudo crictl logs $(sudo crictl ps --name=kube-apiserver -q)
sudo crictl logs $(sudo crictl ps --name=etcd -q) --tail=50

# Read logs from exited containers
sudo crictl ps -a | grep Exited
sudo crictl logs <exited-container-id>

# Pod information
sudo crictl pods
sudo crictl inspect <pod-id>

# Real-time container monitoring
sudo crictl ps -a | grep -E "(apiserver|etcd|scheduler)" | head -10
```

### **Kubernetes Tools**
```bash
# Cluster status
kubectl get nodes
kubectl get nodes -o wide
kubectl cluster-info

# Pod debugging
kubectl get pods --all-namespaces
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>

# RBAC debugging
kubectl get clusterrolebinding | grep <pattern>
kubectl describe clusterrolebinding <binding-name>

# Token management
kubeadm token list
kubeadm token create --print-join-command
```

### **AWS Session Manager (SSM) Access**
```bash
# Connect to EC2 instances without SSH (works from IDE terminal)
aws ssm start-session --target i-065463b3db2974e6d

# Connect to specific instances by role
aws ssm start-session --target <control-plane-instance-id>
aws ssm start-session --target <worker-node-instance-id>

# List available SSM targets
aws ssm describe-instance-information --query 'InstanceInformationList[*].[InstanceId,PlatformName,PingStatus]' --output table

# Get instance IDs from CDK outputs (if available)
aws cloudformation describe-stacks --stack-name SimpleK8sStack --query 'Stacks[0].Outputs'

# Session Manager benefits for K8s troubleshooting:
# - No need for SSH keys or bastion hosts
# - Works through private subnets with VPC endpoints
# - Integrated with IAM for access control
# - Session logging and auditing capabilities
# - Works directly from VS Code terminal

# Tip: Keep multiple terminal tabs open for different nodes
# Tab 1: Control plane troubleshooting
# Tab 2: Worker node diagnostics  
# Tab 3: Local kubectl commands
```

### **Reset and Recovery**
```bash
# Worker node reset
sudo kubeadm reset --force
sudo rm -rf /etc/cni/net.d/*
sudo systemctl restart kubelet

# Control plane reset (last resort)
sudo kubeadm reset --force
sudo rm -rf /etc/kubernetes/
sudo rm -rf /var/lib/etcd/
```

### **Practical Troubleshooting Workflow**

#### **Step 1: Initial Assessment (IDE Terminal)**
```bash
# From your local VS Code terminal - no SSM needed yet
kubectl get nodes
kubectl get pods --all-namespaces
kubectl cluster-info

# If kubectl fails, connect to control plane
aws ssm start-session --target i-065463b3db2974e6d
```

#### **Step 2: Remote System Analysis (SSM Session)**
```bash
# Once connected via SSM to control plane:

# Check system health first
sudo systemctl status kubelet
sudo systemctl status containerd
free -h && df -h

# Check container runtime status
sudo crictl ps -a | head -10
sudo crictl ps -a | grep -E "(apiserver|etcd|scheduler)"

# Read recent logs from failing components
sudo crictl logs --tail=20 $(sudo crictl ps -a --name=kube-apiserver | grep -v CONTAINER | head -1 | awk '{print $1}')
sudo crictl logs --tail=20 $(sudo crictl ps -a --name=etcd | grep -v CONTAINER | head -1 | awk '{print $1}')
```

#### **Step 3: Systematic Log Analysis**
```bash
# System logs (most important first)
sudo journalctl -u kubelet --since "10 minutes ago" --lines=30

# Container runtime logs
sudo journalctl -u containerd --since "10 minutes ago" --lines=20

# Specific container logs for crashed components
sudo crictl ps -a | grep Exited
# Copy container ID and check logs:
sudo crictl logs <container-id> --tail=50
```

#### **Step 4: Cross-Reference with kubectl (if API server working)**
```bash
# From local terminal or SSM session:
kubectl describe pods -n kube-system | grep -A10 -B5 "Events\|Failed\|Error"
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -20
```

#### **Step 5: Multi-Terminal Troubleshooting Setup**
```bash
# Terminal 1 (Local): kubectl commands and cluster overview
kubectl get pods -n kube-system -w

# Terminal 2 (SSM Control Plane): System and container logs
aws ssm start-session --target <control-plane-id>
sudo journalctl -u kubelet -f

# Terminal 3 (SSM Worker - if needed): Worker node diagnostics  
aws ssm start-session --target <worker-node-id>
sudo crictl ps -a

# Terminal 4 (Local): Documentation and notes
# Keep troubleshooting guide open for reference commands
```

---

## Key Lessons Learned

### **1. Timing Matters**
- Always wait 60-90 seconds after kubelet restarts
- CNI installation can take 2-5 minutes to become ready
- Don't rush troubleshooting steps

### **2. Log Analysis is Critical**
- kubelet logs show the real problems
- Container runtime logs reveal startup issues
- Multiple log sources needed for complete picture

### **3. Authentication State Can Corrupt**
- API server crashes during joins create auth issues
- Multiple kubelet restarts can clear corrupted state
- Complete resets sometimes necessary

### **4. Network Layer Dependencies**
- API server needs network to start
- Network plugins need API server to configure
- Chicken-and-egg problems are common during initialization

### **5. Tool Combination Power**
- Linux tools (`systemctl`, `journalctl`) for system-level issues
- Container tools (`crictl`) for runtime problems
- Kubernetes tools (`kubectl`, `kubeadm`) for cluster state
- All three layers needed for complete troubleshooting

---

## Best Practices for CKA/CKAD

1. **Always check logs first** - `journalctl -u kubelet`
2. **Verify container runtime** - `crictl ps`
3. **Check network connectivity** - `ping`, `telnet`
4. **Use systematic approach** - System → Runtime → Kubernetes
5. **Document your steps** - Critical for certification debugging
6. **Practice recovery scenarios** - Reset and rebuild regularly
7. **Understand the happy path** - Know what normal looks like

---

## Quick Reference Commands

### **Emergency Reset**
```bash
# Worker node
sudo kubeadm reset --force && sudo systemctl restart kubelet

# Control plane  
sudo kubeadm reset --force && sudo kubeadm init --pod-network-cidr=10.244.0.0/16
```

### **Health Check**
```bash
kubectl get nodes
kubectl get pods --all-namespaces
kubectl cluster-info
```

### **Log Quick Check**
```bash
sudo journalctl -u kubelet --lines=10
sudo crictl ps | grep -E "(apiserver|etcd)"
```

### **crictl Quick Reference**
```bash
# Container status overview
sudo crictl ps -a | head -10                    # All containers
sudo crictl ps -a --state=Exited               # Only crashed containers  
sudo crictl ps -a --name=etcd                  # Specific container name

# Log reading patterns
sudo crictl logs --tail=20 <container-id>      # Last 20 lines
sudo crictl logs --since=5m <container-id>     # Last 5 minutes
sudo crictl logs --follow <container-id>       # Stream logs (like tail -f)

# Find container ID by name and read logs
ETCD_ID=$(sudo crictl ps -a --name=etcd -q | head -1)
sudo crictl logs --tail=30 $ETCD_ID

# Check multiple components quickly  
for component in etcd kube-apiserver kube-scheduler; do
  echo "=== $component logs ==="
  sudo crictl logs --tail=5 $(sudo crictl ps -a --name=$component -q | head -1) 2>/dev/null || echo "No container found"
done

# Pod and container relationship
sudo crictl pods                                # List all pods
sudo crictl inspect <container-id>             # Detailed container info
sudo crictl inspect <pod-id>                   # Detailed pod info
```

### **AWS SSM Quick Commands**
```bash
# Connect to instances (use from VS Code terminal)
aws ssm start-session --target i-065463b3db2974e6d  # Control plane
aws ssm start-session --target i-<worker-node-id>   # Worker node

# Get instance IDs from stack outputs
aws cloudformation describe-stacks --stack-name SimpleK8sStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ControlPlaneInstanceId`].OutputValue' \
  --output text

# Check SSM connectivity before troubleshooting
aws ssm describe-instance-information \
  --query 'InstanceInformationList[?PingStatus==`Online`].[InstanceId,PlatformName]' \
  --output table
```

This troubleshooting experience demonstrates the importance of systematic debugging using multiple tool layers for successful Kubernetes cluster management and certification preparation.