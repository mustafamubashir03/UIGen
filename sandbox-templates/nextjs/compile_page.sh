#!/bin/bash

# Create missing utils file if it doesn't exist
UTILS_FILE="/home/user/lib/utils.ts"
if [ ! -f "$UTILS_FILE" ]; then
  mkdir -p "$(dirname "$UTILS_FILE")"
  cat <<EOT > "$UTILS_FILE"
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
EOT
  echo "[INFO] Created missing lib/utils.ts"
fi

# Function to ping server until it responds
function ping_server() {
  counter=0
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  while [[ ${response} -ne 200 ]]; do
    let counter++
    if (( counter % 20 == 0 )); then
      echo "Waiting for server to start..."
      sleep 0.1
    fi
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  done
}

# Run ping_server in background
ping_server &

# Start Next.js dev server
cd /home/user && npx next dev --turbopack