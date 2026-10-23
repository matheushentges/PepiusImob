#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$(cd "$SCRIPT_DIR/../supabase/migrations" && pwd)"

echo "==> Running migrations from $MIGRATIONS_DIR into supabase-db..."

for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" | sort); do
    filename=$(basename "$file")
    echo "--------------------------------------------------------"
    echo "==> Applying migration: $filename"
    sudo docker exec -i supabase-db psql -U postgres -d postgres < "$file"
done

echo "========================================================"
echo "Todas as migrations foram aplicadas com sucesso no PostgreSQL local!"
echo "========================================================"
