#!/bin/bash

# Payment Status Cron Job Runner
# This script should be called by cPanel cron jobs

# Set working directory to the backend folder
cd "$(dirname "$0")/backend"

# Set NODE_ENV to production
export NODE_ENV=production

# Set the path to node (adjust if needed)
NODE_PATH="/usr/local/bin/node"

# Check if node exists at the expected location
if [ ! -f "$NODE_PATH" ]; then
    # Try to find node in common locations
    NODE_PATH=$(which node)
    if [ -z "$NODE_PATH" ]; then
        echo "Error: Node.js not found. Please update NODE_PATH in this script."
        exit 1
    fi
fi

# Log file for this script
SCRIPT_LOG="logs/cron_script.log"

# Create logs directory if it doesn't exist
mkdir -p logs

# Log the start of cron job
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting payment status cron job" >> "$SCRIPT_LOG"

# Run the cron runner
"$NODE_PATH" cron/cron_runner.js >> "$SCRIPT_LOG" 2>&1

# Log the completion
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Payment status cron job completed with exit code: $?" >> "$SCRIPT_LOG"

# Keep only last 1000 lines of log file to prevent it from growing too large
tail -n 1000 "$SCRIPT_LOG" > "${SCRIPT_LOG}.tmp" && mv "${SCRIPT_LOG}.tmp" "$SCRIPT_LOG"

# Exit with the same code as the node script
exit $?