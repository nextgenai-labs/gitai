#!/usr/bin/env node

const simpleGit = require('simple-git');

function generateCommitMessage(files) {
  const names = files.map(f => f.path || f);

  if (names.some(f => f.includes('README'))) {
    return 'docs: update README';
  }

  if (names.some(f => f.includes('package.json') || f.includes('package-lock.json'))) {
    return 'chore: update dependencies';
  }

  if (names.some(f => f.startsWith('src/'))) {
    return 'feat: update application code';
  }

  if (names.some(f => f.includes('test'))) {
    return 'test: update tests';
  }

  return `chore: update ${names.length} file(s)`;
}

async function main() {
  const git = simpleGit();

  try {
    const status = await git.status();

    if (status.files.length === 0) {
      console.log('No changes detected.');
      return;
    }

    const commitMessage = generateCommitMessage(status.files);

    console.log('Suggested commit message:');
    console.log('');
    console.log(commitMessage);
    
  } catch (err) {
    console.error('Git operation failed:', err);
    process.exit(1);
  }
}

main();
