const { exec } = require('child_process');

console.log('Testing Angular compilation...');

const child = exec('npx ng version', (error, stdout, stderr) => {
  if (error) {
    console.error('Angular CLI error:', error);
    return;
  }
  console.log('Angular CLI output:', stdout);
  if (stderr) {
    console.error('Angular CLI stderr:', stderr);
  }
});

setTimeout(() => {
  console.log('Angular CLI check completed');
}, 10000);
