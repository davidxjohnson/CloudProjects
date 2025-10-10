# Manual EC2 Build Guide for Kubernetes Training

This guide provides the exact specifications to manually build EC2 instances for Kubernetes, based on the perfected configuration from extensive troubleshooting.

## Overview

Build these resources by hand in AWS Console/CLI:
- **2 EC2 instances** (controller + worker)  
- **1 Security Group** with all required Kubernetes ports
- **VPC/Subnet** (use existing default VPC for simplicity)

## 1. Security Group Configuration

### **Create Security Group**
- **Name**: `k8s-manual-sg`
- **Description**: `Security group for manual Kubernetes cluster`
- **VPC**: Use your default VPC in us-east-2

### **Inbound Rules (CRITICAL - from troubleshooting)**

#### **Self-Referencing Rules (Node-to-Node Communication)**
```
Rule 1: All Traffic
- Type: All Traffic
- Protocol: All
- Port Range: All
- Source: k8s-manual-sg (self-reference)
- Description: All traffic between Kubernetes nodes
```

#### **Kubernetes Control Plane Ports**
```
Rule 2: Kubernetes API Server
- Type: Custom TCP
- Port: 6443
- Source: 0.0.0.0/0
- Description: Kubernetes API server

Rule 3: etcd Server Client API
- Type: Custom TCP  
- Port Range: 2379-2380
- Source: k8s-manual-sg
- Description: etcd server client API

Rule 4: Kubelet API
- Type: Custom TCP
- Port: 10250
- Source: k8s-manual-sg
- Description: Kubelet API

Rule 5: kube-controller-manager
- Type: Custom TCP
- Port: 10257
- Source: k8s-manual-sg
- Description: kube-controller-manager

Rule 6: kube-scheduler
- Type: Custom TCP
- Port: 10259
- Source: k8s-manual-sg
- Description: kube-scheduler
```

#### **Worker Node Ports**
```
Rule 7: NodePort Services
- Type: Custom TCP
- Port Range: 30000-32767
- Source: 0.0.0.0/0
- Description: NodePort Services
```

#### **CNI Network Plugin Ports (ESSENTIAL - from troubleshooting)**
```
Rule 8: Flannel VXLAN
- Type: Custom UDP
- Port: 8285
- Source: k8s-manual-sg
- Description: Flannel VXLAN backend

Rule 9: Weave Net Control
- Type: Custom TCP
- Port: 6783
- Source: k8s-manual-sg
- Description: Weave Net control plane

Rule 10: Weave Net Data
- Type: Custom UDP
- Port: 6784
- Source: k8s-manual-sg
- Description: Weave Net data plane
```

#### **SSH Access**
```
Rule 11: SSH
- Type: SSH
- Port: 22
- Source: Your IP or 0.0.0.0/0
- Description: SSH access for manual setup
```

### **Outbound Rules**
```
Default: All Traffic
- Type: All Traffic
- Protocol: All
- Port Range: All
- Destination: 0.0.0.0/0
```

## 2. IAM Role for EC2 Instances

### **Create IAM Role**
- **Name**: `K8sManualNodeRole`
- **Trusted Entity**: EC2
- **Policies**: 
  - `AmazonSSMManagedInstanceCore` (for Session Manager)
  - `CloudWatchAgentServerPolicy` (for monitoring)

## 3. EC2 Instance Specifications

### **Both Instances Use Same Base Config:**

#### **Instance Details**
- **AMI**: Amazon Linux 2023 (latest)
- **Instance Type**: `t3.large` (2 vCPU, 8GB RAM)
- **Key Pair**: Your existing key pair
- **Network**: Default VPC, public subnet (for simplicity)
- **Security Group**: `k8s-manual-sg` (created above)
- **IAM Role**: `K8sManualNodeRole`

#### **Storage Configuration**
- **Root Volume**: 20GB GP3
- **IOPS**: 3000
- **Throughput**: 125 MB/s
- **Encrypted**: Yes

#### **Advanced Details**
- **Detailed Monitoring**: Enabled
- **Termination Protection**: Disabled (for easy cleanup)

### **User Data Script (CRITICAL - All Troubleshooting Fixes)**

Copy this exact user data for BOTH instances:

```bash
#!/bin/bash
# Update system
dnf update -y

# Install basic packages and networking tools
dnf install -y curl wget iproute-tc

# Session Manager for access
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Container runtime
dnf install -y docker containerd
systemctl enable docker containerd
systemctl start docker containerd
usermod -aG docker ec2-user

# Configure containerd for K8s
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
sed -i "s/SystemdCgroup = false/SystemdCgroup = true/g" /etc/containerd/config.toml
systemctl restart containerd

# Install Kubernetes packages
cat <<EOF | tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/repodata/repomd.xml.key
EOF
dnf install -y kubelet kubeadm kubectl --disableexcludes=kubernetes
systemctl enable kubelet

# Ensure networking tools are available
ln -sf /usr/sbin/tc /usr/bin/tc
echo "export PATH=/usr/sbin:/sbin:$PATH" >> /etc/environment

# Configure system for K8s with complete kernel module fix
echo "net.bridge.bridge-nf-call-iptables = 1" >> /etc/sysctl.conf
echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.conf
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl --system

# Load all required kernel modules for CNI networking
modprobe br_netfilter ip_tables iptable_nat iptable_filter

# Create permanent kernel module configuration
cat > /etc/modules-load.d/k8s.conf << "EOF"
br_netfilter
ip_tables
iptable_nat
iptable_filter
EOF

# Create permanent sysctl configuration  
cat > /etc/sysctl.d/k8s.conf << "EOF"
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

# Disable swap
swapoff -a
sed -i "/swap/d" /etc/fstab

# Configure more tolerant liveness probe settings for control plane stability
mkdir -p /root/k8s-fixes
cat > /root/k8s-fixes/configure-probes.sh << "EOF"
#!/bin/bash
# Wait for kubeadm init to complete and static pod manifests to exist
while [ ! -f /etc/kubernetes/manifests/etcd.yaml ]; do
  echo "Waiting for Kubernetes manifests..."
  sleep 10
done
sleep 30  # Additional wait for initial startup

# Make backups
cp /etc/kubernetes/manifests/etcd.yaml /etc/kubernetes/manifests/etcd.yaml.original
cp /etc/kubernetes/manifests/kube-scheduler.yaml /etc/kubernetes/manifests/kube-scheduler.yaml.original
cp /etc/kubernetes/manifests/kube-apiserver.yaml /etc/kubernetes/manifests/kube-apiserver.yaml.original

# Configure more tolerant liveness probe settings
sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/etcd.yaml
sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/etcd.yaml
sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/etcd.yaml

sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/kube-scheduler.yaml
sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/kube-scheduler.yaml
sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/kube-scheduler.yaml

sed -i "s/failureThreshold: 8/failureThreshold: 20/g" /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i "s/initialDelaySeconds: 10/initialDelaySeconds: 30/g" /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i "s/timeoutSeconds: 15/timeoutSeconds: 30/g" /etc/kubernetes/manifests/kube-apiserver.yaml

echo "Liveness probe configuration completed"
systemctl restart kubelet
EOF
chmod +x /root/k8s-fixes/configure-probes.sh

# Create systemd service to run probe configuration after kubeadm init
cat > /etc/systemd/system/k8s-probe-config.service << "EOF"
[Unit]
Description=Configure Kubernetes Liveness Probes
After=kubelet.service
Wants=kubelet.service

[Service]
Type=oneshot
ExecStart=/root/k8s-fixes/configure-probes.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

# Enable the service but don't start it yet (will be triggered after kubeadm init)
systemctl enable k8s-probe-config.service

# Create simple instructions file
cat > /home/ec2-user/k8s-training.txt << "EOF"
=== Linux Foundation Kubernetes Training ===

Ready for manual K8s setup! No automation - practice the commands.

PRE-FLIGHT CHECK (verify kernel modules):
lsmod | grep -E "(br_netfilter|ip_tables|iptable_nat|iptable_filter)"
# Should show all 4 modules loaded

CONTROL PLANE SETUP (CRITICAL - use non-conflicting CIDR):
sudo kubeadm init --pod-network-cidr=172.16.0.0/16 --service-cidr=10.96.0.0/12
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

APPLY LIVENESS PROBE FIX (if control plane unstable):
sudo systemctl start k8s-probe-config.service
# This configures more tolerant liveness probe settings
# to prevent restart loops during cluster initialization

POD NETWORK (Flannel with matching CIDR):
curl -s https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml | \
  sed 's/10.244.0.0\/16/172.16.0.0\/16/' | \
  kubectl apply -f -

WORKER NODE:
# Copy the kubeadm join command from control plane init output

VERIFY:
kubectl get nodes
kubectl get pods --all-namespaces

Good luck with CKA/CKAD training!
EOF
chown ec2-user:ec2-user /home/ec2-user/k8s-training.txt
```

## 4. Instance Naming and Tags

### **Controller Instance**
- **Name**: `k8s-controller-manual`
- **Tags**:
  - `Role`: `kubernetes-controller`
  - `Purpose`: `cka-ckad-training`
  - `Type`: `manual-build`

### **Worker Instance**  
- **Name**: `k8s-worker-manual`
- **Tags**:
  - `Role`: `kubernetes-worker`
  - `Purpose`: `cka-ckad-training`
  - `Type`: `manual-build`

## 5. Post-Launch Verification

### **Check Instance Status**
```bash
# Connect via Session Manager (no SSH keys needed)
aws ssm start-session --target i-<instance-id>

# Verify kernel modules are loaded
lsmod | grep -E "(br_netfilter|ip_tables|iptable_nat|iptable_filter)"

# Check Kubernetes components
kubeadm version
kubectl version --client
containerd --version

# Verify instructions file exists
cat /home/ec2-user/k8s-training.txt
```

## 6. Critical Configuration Summary

### **Why These Settings Matter (From Troubleshooting)**

1. **Kernel Modules**: `br_netfilter`, `ip_tables`, `iptable_nat`, `iptable_filter`
   - **Missing these caused universal CNI crashes**
   - Pre-loaded in user data, made permanent

2. **CIDR Ranges**: 
   - **VPC**: 10.0.0.0/16 (AWS default)
   - **Pods**: 172.16.0.0/16 (avoids conflicts)
   - **Services**: 10.96.0.0/12 (standard)
   - **CIDR conflicts caused intermittent cluster failures**

3. **CNI Network Ports**: UDP 8285, TCP 6783, UDP 6784
   - **Missing these caused CNI networking failures**
   - Pre-configured in security group

4. **Liveness Probe Tolerance**: 20 failures, 30s delays, 30s timeouts
   - **Default probes too aggressive, caused restart loops**
   - Auto-configured via systemd service

5. **Container Runtime**: containerd with systemd cgroups
   - **Docker conflicts disabled**
   - Proper cgroup driver configuration

## 7. Manual Kubernetes Setup

Once instances are running, follow the instructions in `/home/ec2-user/k8s-training.txt` on each instance.

The key difference from standard tutorials: **use the corrected CIDRs and have the liveness probe fix ready**.

This configuration represents months of troubleshooting condensed into a reliable, reproducible setup perfect for CKA/CKAD training!