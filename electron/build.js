#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set environment variable for base path
process.env.ELECTRON = 'true';

// Ensure dist-electron directory exists
const distElectronDir = path.join(__dirname, '../dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}

// Compile TypeScript files
console.log('Compiling TypeScript files...');
try {
  execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' });
} catch (error) {
  console.error('Error compiling TypeScript files:', error);
  process.exit(1);
}

// Build the Vite app
console.log('Building Vite app...');
try {
  execSync('vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error building Vite app:', error);
  process.exit(1);
}

console.log('Build completed successfully!'); 