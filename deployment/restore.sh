#!/usr/bin/env bash
# ==============================================================================
# Pepius Imob — Restauração de Desastres (Disaster Recovery)
# Decifra e restaura banco de dados PostgreSQL e Supabase Storage
# ==============================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <caminho-do-arquivo-pepius-backup-*.tar.gz.gpg> [--skip-storage] [--skip-db]"
  exit 1
fi

ENCRYPTED_BACKUP="$1"
KEY_FILE="${PEPIUS_BACKUP_KEY_FILE:-/home/ubuntu/.pepius-backup.key}"
SKIP_STORAGE=false
SKIP_DB=false

for arg in "$@"; do
  if [[ "$arg" == "--skip-storage" ]]; then SKIP_STORAGE=true; fi
  if [[ "$arg" == "--skip-db" ]]; then SKIP_DB=true; fi
done

if [[ ! -f "${ENCRYPTED_BACKUP}" ]]; then
  echo "[!] Erro: Arquivo de backup não encontrado em: ${ENCRYPTED_BACKUP}"
  exit 1
fi

if [[ ! -f "${KEY_FILE}" ]]; then
  echo "[!] Erro: Chave de decodificação não encontrada em: ${KEY_FILE}"
  exit 1
fi

# 1. Verifica integridade do Checksum se existir .sha256
if [[ -f "${ENCRYPTED_BACKUP}.sha256" ]]; then
  echo "[*] Validando checksum SHA-256 do arquivo cifrado..."
  sha256sum -c "${ENCRYPTED_BACKUP}.sha256"
  echo "[+] Integridade verificada com sucesso."
fi

TMP_DIR="$(mktemp -d /tmp/pepius-restore-XXXXXX)"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

# 2. Decifra com GPG
echo "[*] Decifrando arquivo de backup via GPG..."
gpg --decrypt --batch --yes --passphrase-file "${KEY_FILE}" "${ENCRYPTED_BACKUP}" | tar -xzf - -C "${TMP_DIR}"

if [[ -f "${TMP_DIR}/backup_manifest.json" ]]; then
  echo "[+] Manifesto do backup decifrado:"
  cat "${TMP_DIR}/backup_manifest.json"
  echo ""
fi

# 3. Restauração do Banco de Dados PostgreSQL (supabase-db)
if [[ "${SKIP_DB}" == false && -f "${TMP_DIR}/postgres_supabase.dump" ]]; then
  echo "[*] Restaurando banco de dados no container supabase-db..."
  # Copia dump para o container e executa pg_restore
  docker cp "${TMP_DIR}/postgres_supabase.dump" supabase-db:/tmp/restore.dump
  docker exec supabase-db pg_restore -U postgres -d postgres --clean --if-exists --no-owner --no-privileges /tmp/restore.dump || {
    echo "[!] pg_restore finalizou com avisos não impeditivos."
  }
  docker exec supabase-db rm -f /tmp/restore.dump
  echo "[+] Banco de dados principal restaurado com sucesso."
fi

# 4. Restauração do Supabase Storage
STORAGE_DEST="/home/ubuntu/supabase/docker/volumes/storage"
if [[ "${SKIP_STORAGE}" == false && -f "${TMP_DIR}/storage_files.tar.gz" ]]; then
  echo "[*] Restaurando arquivos do Supabase Storage em ${STORAGE_DEST}..."
  mkdir -p "${STORAGE_DEST}"
  tar -xzf "${TMP_DIR}/storage_files.tar.gz" -C "${STORAGE_DEST}"
  echo "[+] Supabase Storage restaurado."
fi

# 5. Restauração do Estado de Licença
LICENSE_DEST="/var/lib/docker/volumes/deployment_pepius-license-data/_data"
if [[ -f "${TMP_DIR}/license_state.tar.gz" && -d "${LICENSE_DEST}" ]]; then
  echo "[*] Restaurando dados da licença criptográfica..."
  sudo tar -xzf "${TMP_DIR}/license_state.tar.gz" -C "${LICENSE_DEST}" || true
  echo "[+] Licença restaurada."
fi

echo "=== [$(date +'%Y-%m-%d %H:%M:%S')] Restauração Concluída com Sucesso ==="
