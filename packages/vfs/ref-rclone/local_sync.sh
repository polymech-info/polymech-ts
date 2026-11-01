#!/bin/bash

# Example script for local filesystem operations using rclone

# Define source and destination directories
SRC_DIR="/path/to/source"
DEST_DIR="/path/to/destination"

# Synchronize files
rclone sync "${SRC_DIR}" "${DEST_DIR}" -v --progress

# List files in destination
rclone ls "${DEST_DIR}"

# Copy specific files or directories
rclone copy "${SRC_DIR}/specific-file.txt" "${DEST_DIR}" --progress

# Check for differences
rclone check "${SRC_DIR}" "${DEST_DIR}" --one-way
