#!/usr/bin/env bash
set -euo pipefail

URI_ENV_NAME="${1:-}"
DB_NAME="${2:-}"
OUTPUT_ROOT="${BACKUP_OUTPUT_DIR:-$PWD/.maintenance/answers-backups}"

[[ -n "$URI_ENV_NAME" && -n "${!URI_ENV_NAME:-}" && -n "$DB_NAME" ]] || {
  echo "Uso: $0 <mongo-uri-env> <database>; a variável indicada deve conter explicitamente a URI." >&2
  exit 2
}
command -v mongodump >/dev/null
command -v mongorestore >/dev/null
command -v mongosh >/dev/null

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_DIR="$OUTPUT_ROOT/$RUN_ID"
DUMP_ARCHIVE_1="$OUTPUT_DIR/mongodb-1.archive.gz"
DUMP_ARCHIVE_2="$OUTPUT_DIR/mongodb-2.archive.gz"
RESTORE_DB="sv2r_${RUN_ID:0:15}"
RESTORE_URI="${RESTORE_MONGODB_URI:-${!URI_ENV_NAME}}"
mkdir -p "$OUTPUT_DIR"

[[ "$RESTORE_DB" == sv2r_* && ${#RESTORE_DB} -le 38 ]] || { echo "Banco temporário inválido." >&2; exit 1; }
cleanup_restore() {
  mongosh "$RESTORE_URI" --quiet --eval "db.getSiblingDB('$RESTORE_DB').dropDatabase()" >/dev/null 2>&1 || true
}
trap cleanup_restore EXIT

answers_count() {
  local uri="$1"
  local database="$2"
  mongosh "$uri" --quiet --eval "db.getSiblingDB('$database').answers.countDocuments({})"
}

answers_hash() {
  local uri="$1"
  local database="$2"
  mongosh "$uri" --quiet --eval "EJSON.stringify(db.getSiblingDB('$database').answers.find({}, {_id:1,CENTRO_ID:1,QUESTION_ID:1,ANSWER:1,QUIZ_ID:1}).sort({_id:1}).toArray())" \
    | shasum -a 256 | awk '{print $1}'
}

# M0 não oferece Cloud Backup. Criamos dois dumps BSON independentes enquanto
# as escritas de Answers estão bloqueadas e restauramos ambos antes de migrar.
mongodump --uri="${!URI_ENV_NAME}" --db="$DB_NAME" --archive="$DUMP_ARCHIVE_1" --gzip
mongodump --uri="${!URI_ENV_NAME}" --db="$DB_NAME" --archive="$DUMP_ARCHIVE_2" --gzip

SOURCE_COUNT="$(answers_count "${!URI_ENV_NAME}" "$DB_NAME")"
SOURCE_HASH="$(answers_hash "${!URI_ENV_NAME}" "$DB_NAME")"
for archive in "$DUMP_ARCHIVE_1" "$DUMP_ARCHIVE_2"; do
  cleanup_restore
  mongorestore --uri="$RESTORE_URI" --archive="$archive" --gzip \
    --nsInclude="$DB_NAME.answers" --nsFrom="$DB_NAME.*" --nsTo="$RESTORE_DB.*" --drop
  RESTORE_COUNT="$(answers_count "$RESTORE_URI" "$RESTORE_DB")"
  RESTORE_HASH="$(answers_hash "$RESTORE_URI" "$RESTORE_DB")"
  if [[ "$SOURCE_COUNT" != "$RESTORE_COUNT" || "$SOURCE_HASH" != "$RESTORE_HASH" ]]; then
    echo "Teste de restauração falhou para $(basename "$archive"): contagem ou hash divergente." >&2
    exit 1
  fi
done

shasum -a 256 "$DUMP_ARCHIVE_1" "$DUMP_ARCHIVE_2" > "$OUTPUT_DIR/archives.sha256"
jq -n --arg runId "$RUN_ID" --arg database "$DB_NAME" --argjson answerCount "$SOURCE_COUNT" \
  --arg answerHash "$SOURCE_HASH" \
  '{runId:$runId,database:$database,strategy:"m0-double-bson-dump",answerCount:$answerCount,answerCoreHash:$answerHash,restoresVerified:2}' \
  > "$OUTPUT_DIR/manifest.json"
echo "Dois backups e duas restaurações validados em $OUTPUT_DIR (Answers: $SOURCE_COUNT)."
