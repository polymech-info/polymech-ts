#!/bin/bash

# Example script for API access using rclone

# Define variables
LOCAL_DIR="/path/to/local/files"
S3_BUCKET="s3://my-bucket/backup"

# S3 Examples

# Upload to S3
rclone copy "${LOCAL_DIR}" "${S3_BUCKET_}" \
    --progress \
    --s3-chunk-size 10M \
    --s3-upload-concurrency 4

# List files in S3 bucket
rclone ls "${S3_BUCKET}"

# Sync with S3
rclone sync "${LOCAL_DIR}" "${S3_BUCKET_}" \
    --progress \
    --s3-chunk-size 10M \
    --s3-upload-concurrency 4

# Download from S3
rclone copy "${S3_BUCKET_}" "${LOCAL_DIR}" \
    --progress \
    --transfers 4

# Using server side encryption
rclone copy "${LOCAL_DIR}" "${S3_BUCKET}" \
    --progress \
    --s3-sse-kvs-encryption
