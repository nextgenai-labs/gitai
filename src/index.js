#!/usr/bin/env node

const simpleGit = require('simple-git');

async function main() {
  const git = simpleGit();

  try {
    const status = await git.status();

    if (status.files.length === 0) {
      console.log('No changes detected.');
      return;
    }

    console.log('Suggested commit message:');
    console.log('');
    console.log('feat: update ' + status.files.length + ' file(s)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
