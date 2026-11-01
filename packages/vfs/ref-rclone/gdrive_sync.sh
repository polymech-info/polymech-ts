#!/bin/bash

# Example script for Google Drive operations using rclone

# Define local and remote paths
LOCAL_DIR="./test"
GDRIVE_DIR="gdrive:/"

# Upload files to Google Drive
#rclone copy "${LOCAL_DIR}" "${GDRIVE_DIR}" --progress --transfers 4

# List files in Google Drive directory
#rclone ls "${GDRIVE_DIR}"

# Synchronize local directory with Google Drive
rclone sync "${GDRIVE_DIR}" "${LOCAL_DIR}" --progress --track-renames

# Check for differences
#rclone check "${LOCAL_DIR}" "${GDRIVE_DIR}" --one-way

# Download from Google Drive
#rclone copy "${GDRIVE_DIR}" "${LOCAL_DIR}" --progress --transfers 4
