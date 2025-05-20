#!/bin/sh
# This script installs dependencies and runs the CentralTeach application server

echo "Installing dependencies for CentralTeach..."
npm install

echo "Starting CentralTeach server..."
node server.js
