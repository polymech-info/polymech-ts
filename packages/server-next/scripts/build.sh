#!/bin/bash

# Deployment Script for Server
# Creates a self-contained 'dist' folder ready for syncing to the server

echo "Starting deployment setup..."

# 1. Build the application
echo "Building server..."
npm run build:webpack

# Ensure dist exists (webpack should create it, but just in case)
mkdir -p dist

# 2. Copy Package Files
echo "Copying package files..."
# Copy the minimal package.json template from scripts
cp scripts/package.json dist/package.json
# We don't copy the lockfile as we want to resolve fresh based on minimal deps
# cp package-lock.json dist/ # (Optional: omit lockfile for minimal deploy or generate one)

# 3. Copy Scripts
echo "Copying scripts..."
cp scripts/install.sh dist/
cp scripts/run.sh dist/

# 4. Setup Configuration
echo "Setting up configuration..."
rimraf dist/config
cp -rf config dist/config

rimraf dist/config
cp -rf config dist/config
rm dist/config/ban.json


#rimraf dist/tests
#cp -rf tests dist/tests

rimraf dist/logs
rimraf dist/data

# Copy templates
rimraf dist/templates
mkdir -p dist/templates
cp -r ../public/widgets dist/templates/email

# Copy data
cp -r data/ dist/data


# Copy Apache config
mkdir -p dist/etc
if [ -f "etc/apache.conf" ]; then
    cp etc/apache.conf dist/etc/apache.conf
    echo "Copied apache.conf to dist/etc/"
fi

if [ -f "etc/pm-pics.service" ]; then
    cp etc/pm-pics.service dist/etc/pm-pics.service
    echo "Copied pm-pics.service to dist/etc/"
fi

if [ -f "etc/nginx.conf" ]; then
    cp etc/nginx.conf dist/etc/nginx.conf
    echo "Copied nginx.conf to dist/etc/"
fi

# 5. Setup Environment Variables
echo "Setting up environment variables..."
cp .env-client dist/.env-client
cp .env.production dist/.env
cp .env.production dist/.env.production

echo "Copied .env and .env.production to dist/"
