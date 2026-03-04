#!/bin/bash
set -e

cd /home/user

# Install deps
npm install

# Build production
npm run build

# Start server in background
npx next start -p 3000 --hostname 0.0.0.0 &

# Wait until server responds
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

ping_server

echo "Next.js is running and ready on port 3000"
# Keep process alive so sandbox stays up
wait