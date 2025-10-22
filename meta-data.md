```bash
### controller package refresh/install
sudo hostnamectl set-hostname controller
sudo apt-get update

# network setup
cat << EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
sudo modprobe br_netfilter
sudo sysctl --system
EOF

sudo sysctl --system

# Disable swap
swapoff -a
sed -i "/swap/d" /etc/fstab

# helper packages for  k8s
sudo apt-get install -y apt-transport-https gnupg2 
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
sudo apt-get update

# install of k8s tools
sudo apt-get install -y kubectl kubeadm kubelet kubernetes-cni docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo kubeadm config images pull

```