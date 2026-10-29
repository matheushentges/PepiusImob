#!/usr/bin/env bash
# ==============================================================================
# Pepius Imob — Rotina de Backup Criptografado (Disaster Recovery)
# Compatível com Ubuntu 24.04 ARM64 / Docker Compose / PostgreSQL 17
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${PEPIUS_BACKUP_DIR:-/home/ubuntu/backups/pepius}"
KEY_FILE="${PEPIUS_BACKUP_KEY_FILE:-/home/ubuntu/.pepius-backup.key}"
RETENTION_DAYS="${PEPIUS_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')"
TMP_DIR="$(mktemp -d /tmp/pepius-backup-XXXXXX)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "=== [$(date +'%Y-%m-%d %H:%M:%S')] Iniciando Backup Pepius Imob ==="

# 1. Garante chave de criptografia AES-256
mkdir -p "${BACKUP_DIR}"
if [[ ! -f "${KEY_FILE}" ]]; then
  echo "[-] Chave de backup não encontrada em ${KEY_FILE}. Gerando chave segura de 32 bytes..."
  openssl rand -hex 32 > "${KEY_FILE}"
  chmod 600 "${KEY_FILE}"
  echo "[+] Chave gerada e protegida com permissões 0600 em ${KEY_FILE}."
fi

# 2. Dump do PostgreSQL Principal (supabase-db)
echo "[*] Extraindo dump relacional do PostgreSQL (supabase-db)..."
if docker ps --format '{{.Names}}' | grep -q "^supabase-db$"; then
  docker exec supabase-db pg_dump -U postgres -Fc -b -v postgres > "${TMP_DIR}/postgres_supabase.dump"
  echo "[+] Banco principal extraído com sucesso: $(du -h "${TMP_DIR}/postgres_supabase.dump" | cut -f1)"
else
  echo "[!] AVISO: Container supabase-db não está em execução."
fi

# 3. Dump do Banco do WhatsApp / Evolution API
if docker ps --format '{{.Names}}' | grep -q "^pepius-postgres-evo$"; then
  echo "[*] Extraindo dump da Evolution API (pepius-postgres-evo)..."
  docker exec pepius-postgres-evo pg_dump -U evolution -Fc -b evolution > "${TMP_DIR}/postgres_evolution.dump" || true
  if [[ -f "${TMP_DIR}/postgres_evolution.dump" ]]; then
    echo "[+] Banco Evolution extraído: $(du -h "${TMP_DIR}/postgres_evolution.dump" | cut -f1)"
  fi
fi

# 4. Backup do Supabase Storage (Fotos de Imóveis e Mídias)
STORAGE_SRC="/home/ubuntu/supabase/docker/volumes/storage"
if [[ -d "${STORAGE_SRC}" ]]; then
  echo "[*] Compactando arquivos do Supabase Storage..."
  tar -czf "${TMP_DIR}/storage_files.tar.gz" -C "${STORAGE_SRC}" .
  echo "[+] Storage compactado: $(du -h "${TMP_DIR}/storage_files.tar.gz" | cut -f1)"
fi

# 5. Backup do Estado de Licença On-Premise
LICENSE_VOL="/var/lib/docker/volumes/deployment_pepius-license-data/_data"
if [[ -d "${LICENSE_VOL}" ]]; then
  echo "[*] Copiando dados da licença criptográfica..."
  sudo tar -czf "${TMP_DIR}/license_state.tar.gz" -C "${LICENSE_VOL}" . || true
fi

# 6. Metadados do Backup
cat <<EOF > "${TMP_DIR}/backup_manifest.json"
{
  "project": "pepius-imob",
  "timestamp": "${TIMESTAMP}",
  "version": "1.0.0",
  "host": "$(hostname)",
  "storage_included": $(test -f "${TMP_DIR}/storage_files.tar.gz" && echo "true" || echo "false"),
  "postgres_included": $(test -f "${TMP_DIR}/postgres_supabase.dump" && echo "true" || echo "false")
}
EOF

# 7. Empacota e Cifra com GPG (AES-256)
ARCHIVE_NAME="pepius-backup-${TIMESTAMP}.tar.gz"
ENCRYPTED_FILE="${BACKUP_DIR}/${ARCHIVE_NAME}.gpg"

echo "[*] Cifrando arquivo final com GPG AES-256..."
tar -czf - -C "${TMP_DIR}" . | gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase-file "${KEY_FILE}" -o "${ENCRYPTED_FILE}"
chmod 600 "${ENCRYPTED_FILE}"

# 8. Checksum SHA-256 para integridade
sha256sum "${ENCRYPTED_FILE}" > "${ENCRYPTED_FILE}.sha256"

echo "[+] Backup concluído com sucesso!"
echo "    Arquivo: ${ENCRYPTED_FILE} ($(du -h "${ENCRYPTED_FILE}" | cut -f1))"
echo "    Checksum: ${ENCRYPTED_FILE}.sha256"

# 9. Rotação automática (limpeza de backups com mais de N dias)
echo "[*] Executando rotação de backups (retenção: ${RETENTION_DAYS} dias)..."
find "${BACKUP_DIR}" -name "pepius-backup-*.gpg*" -type f -mtime "+${RETENTION_DAYS}" -delete
echo "[+] Concluído."
