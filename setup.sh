#!/bin/bash

# This script creates the complete directory and file structure for the full-stack application.
# Run this in the directory where you want your project to be created.

echo "Creating project root directory: your-project-root..."
mkdir your-project-root
cd your-project-root

echo "Creating top-level directories: client and server..."
mkdir client
mkdir server

echo "Creating client-side structure..."
mkdir client/public
mkdir client/src
mkdir client/src/components
touch client/public/index.html
touch client/src/App.js
touch client/src/index.js
touch client/src/components/Message.js
touch client/package.json

echo "Creating server-side structure..."
mkdir server/api
touch server/api/messages.js
touch server/config.js
touch server/db.js
touch server/server.js
touch server/package.json

echo "Creating .gitignore file..."
# A basic .gitignore for a Node/React project
touch .gitignore
echo "node_modules" >> .gitignore
echo "client/node_modules" >> .gitignore
echo "server/node_modules" >> .gitignore
echo ".env" >> .gitignore
echo "build" >> .gitignore
echo "coverage" >> .gitignore

echo "Project structure created successfully!"
ls -R

