#!/bin/bash
# Migrate existing files from Azure Blob → DigitalOcean Spaces
# Uses rclone — handles retries, parallel transfers, and progress

# Configure rclone for Azure (source)
rclone config create azure-source azureblob \
  account "$AZURE_STORAGE_ACCOUNT" \
  key "$AZURE_STORAGE_KEY" \
  container "$AZURE_CONTAINER_NAME"

# Configure rclone for DigitalOcean Spaces (destination)
rclone config create do-spaces s3 \
  provider DigitalOcean \
  access_key_id "$DO_SPACES_KEY" \
  secret_access_key "$DO_SPACES_SECRET" \
  endpoint "sgp1.digitaloceanspaces.com" \
  region "us-east-1"

# DRY RUN first — see what will be transferred
echo "=== DRY RUN — no files transferred ==="
rclone sync azure-source:pdfvault do-spaces:pdfvault \
  --dry-run \
  --progress \
  --transfers 20 \
  --checkers 40

# Confirm before actual transfer
read -p "Proceed with actual migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Migration cancelled."
  exit 1
fi

# ACTUAL MIGRATION
echo "=== Starting actual migration ==="
rclone sync azure-source:pdfvault do-spaces:pdfvault \
  --progress \
  --transfers 20 \
  --checkers 40 \
  --retries 5 \
  --low-level-retries 10 \
  --stats 30s \
  --log-file migration.log \
  --log-level INFO

echo "=== Migration complete. Check migration.log for details ==="

# Verify file count matches
echo "=== Verification ==="
echo "Azure count:"
rclone size azure-source:pdfvault

echo "DO Spaces count:"
rclone size do-spaces:pdfvault
