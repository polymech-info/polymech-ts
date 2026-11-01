# Rclone Configuration Examples

This directory contains example configuration files for rclone demonstrating different storage backends.

## Files Included

1. `local.conf`: Local filesystem configuration
2. `s3.conf`: Amazon S3 configuration
3. `sftp.conf`: SFTP server configuration
4. `api.conf`: Google Drive API configuration

## How to Use

1. Copy the relevant configuration to your rclone config file (usually `~/.config/rclone/rclone.conf`)
2. Replace the placeholder values (e.g., `your_access_key_here`) with your actual credentials
3. Test the configuration using `rclone ls`

### Security Note

These are example configurations only. Never store actual credentials in version control!
