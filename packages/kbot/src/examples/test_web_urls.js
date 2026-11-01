#!/usr/bin/env node
import { spawn } from 'child_process';

const TEST_CASES = [
  { 
    name: 'GitHub README', 
    command: ['kbot', 'Summarize this documentation', '-i', 'https://raw.githubusercontent.com/polymech/polymech-mono/main/README.md'] 
  },
  { 
    name: 'JSON API', 
    command: ['kbot', 'Extract user emails', '-i', 'https://jsonplaceholder.typicode.com/users'] 
  },
  {
    name: 'Mixed Sources',
    command: ['kbot', 'Compare these files and the web content', '-i', 'package.json,https://docs.npmjs.com/cli/v10/commands/npm-install']
  }
];

async function runTest(test) {
  console.log(`\n\n=== Running Test: ${test.name} ===`);
  console.log(`Command: ${test.command.join(' ')}`);
  
  return new Promise((resolve) => {
    const child = spawn(test.command[0], test.command.slice(1), {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      console.log(`Test "${test.name}" completed with exit code ${code}`);
      resolve(code === 0);
    });
  });
}

async function runTests() {
  console.log('Starting Web URL Support Tests');
  
  for (const test of TEST_CASES) {
    const success = await runTest(test);
    console.log(`Test "${test.name}": ${success ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log('\nAll tests completed');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
}); 