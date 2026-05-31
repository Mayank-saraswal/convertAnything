#!/bin/bash
# Install doctl (DigitalOcean CLI)
# macOS: brew install doctl
# Ubuntu/Debian: snap install doctl

# Authenticate
# doctl auth init

# Create Spaces bucket (via web console — doctl doesn't create Spaces directly)
# Go to: https://cloud.digitalocean.com/spaces/new
# Choose region: sgp1
# Name: pdfvault
# File Listing: Restricted (private — never public listing)
# CDN: Enable (free with Spaces)

# After creating via console, get your access keys:
# Go to: API → Spaces Access Keys → Generate New Key
# Copy: Key (DO_SPACES_KEY) and Secret (DO_SPACES_SECRET)

# Apply CORS using AWS CLI (works with DO Spaces):
AWS_ACCESS_KEY_ID=$DO_SPACES_KEY \
AWS_SECRET_ACCESS_KEY=$DO_SPACES_SECRET \
aws s3api put-bucket-cors \
  --bucket pdfvault \
  --cors-configuration file://cors-config.json \
  --endpoint-url https://sgp1.digitaloceanspaces.com \
  --region us-east-1

# Apply lifecycle rules
AWS_ACCESS_KEY_ID=$DO_SPACES_KEY \
AWS_SECRET_ACCESS_KEY=$DO_SPACES_SECRET \
aws s3api put-bucket-lifecycle-configuration \
  --bucket pdfvault \
  --lifecycle-configuration file://lifecycle-config.json \
  --endpoint-url https://sgp1.digitaloceanspaces.com \
  --region us-east-1

echo "DO Spaces setup complete. Enable CDN in the console if not already enabled."
