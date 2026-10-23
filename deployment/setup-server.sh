#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Pepius Imob On-Premise — Script de Preparação do Servidor (Ubuntu 22.04/24.04)
# Suporta arquiteturas x86_64 e aarch64 (Oracle Cloud Ampere A1 ARM)
# ==============================================================================

echo "==> [1/5] Atualizando pacotes do sistema..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw

echo "==> [2/5] Configurando 4 GB de memória Swap para estabilidade..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap configurado com sucesso!"
else
    echo "Swapfile já existe, pulando."
fi

echo "==> [3/5] Configurando Firewall UFW e regras de rede da Oracle Cloud (SSH, HTTP, HTTPS)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable

# Regras explícitas de iptables necessárias nas imagens Ubuntu da Oracle Cloud
sudo iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT || true
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
if command -v netfilter-persistent >/dev/null 2>&1; then
    sudo netfilter-persistent save || true
fi

echo "==> [4/5] Instalando Docker Engine e Docker Compose oficial..."
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adiciona o usuário atual ao grupo docker para não precisar usar sudo
sudo usermod -aG docker "$USER" || true

echo "==> [5/5] Verificando instalação do Docker..."
docker --version
docker compose version

echo "=============================================================================="
echo "  Servidor preparado com sucesso para o Pepius Imob!"
echo "  - Docker e Compose instalados"
echo "  - 4 GB de Swap ativado"
echo "  - Portas 22, 80 e 443 liberadas"
echo "=============================================================================="
