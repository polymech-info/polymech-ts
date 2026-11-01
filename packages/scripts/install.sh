#!/bin/bash

# This script runs 'npm install' in a predefined list of directories.

# Exit immediately if a command exits with a non-zero status.
set -e

# List of directories to process
DIRECTORIES=(
    "core"
    "fs"
    "cache"
    "ai"
    "commons"
    "log"
    "ai-tools"
    "i18n"
    "cad"
    "media"
    "mail"
    "tasks"
    "sync"
    "search"
    "registry"
    "kbot"
)

# Get the current working directory
CWD=$(pwd)

# Loop through all the directories in the list
for dir in "${DIRECTORIES[@]}"; do
    # Check if it's a directory
    if [ -d "$dir" ]; then
        if [ -d "$dir/node_modules" ]; then
            echo "==> Skipping '$dir', node_modules already exists."
        else
            echo "==> Changing to directory '$dir' and running 'npm install'"
            cd "$dir"
            npm install
            cd "$CWD"
            echo "<== Done with '$dir'"
        fi
    else
        echo "Warning: '$dir' is not a directory. Skipping."
    fi
done

echo "All installations complete."
