/**
 * Demo Script for Workflow Implementation
 * This script shows how to run the backend server and test the workflow
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Start the server
function startServer() {
  console.log('Starting the server...');
  
  const server = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
  
  // Give the server some time to start
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Server should be running now at http://localhost:3000');
      resolve(server);
    }, 3000);
  });
}

// Run the test workflow
function runTests() {
  console.log('\nRunning workflow tests...');
  
  const tests = spawn('node', ['src/examples/test_workflow.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  tests.on('error', (error) => {
    console.error('Failed to run tests:', error);
  });
  
  return new Promise((resolve) => {
    tests.on('close', (code) => {
      console.log(`\nTests completed with code ${code}`);
      resolve();
    });
  });
}

// Main function
async function main() {
  console.log('=== Workflow Implementation Demo ===\n');
  
  try {
    // Start the server
    const server = await startServer();
    
    // Run the tests
    await runTests();
    
    console.log('\nDemo completed! Press Ctrl+C to stop the server.');
    
    // Keep the server running until user terminates
    process.on('SIGINT', () => {
      console.log('\nStopping the server...');
      server.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
main();