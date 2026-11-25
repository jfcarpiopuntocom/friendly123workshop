// Usage: node scope-check.cjs <approved-base> <allowed-path> [...]
const { execFileSync } = require('node:child_process');
const [base, ...allowed] = process.argv.slice(2);
if (!base || !allowed.length) {
  console.error('Usage: node scope-check.cjs <approved-base> <allowed-path> [...]');
  process.exit(2);
}
try {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  process.chdir(git('rev-parse', '--show-toplevel').trimEnd());
  const sha = git('rev-parse', '--verify', '--end-of-options', base + '^{commit}').trim();
  const diff = ['diff', '--name-only', '--no-renames', '-z'];
  const changed = new Set([
    git(...diff, sha, 'HEAD', '--'),
    git(...diff, '--cached', 'HEAD', '--'),
    git(...diff, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z'),
  ].flatMap(s => s.split('\0').filter(Boolean)));
  const outside = [...changed].filter(p => !allowed.includes(p)).sort();
  console.log(JSON.stringify({ base: sha, changed: [...changed].sort(), outside }));
  process.exitCode = outside.length ? 1 : 0;
} catch (err) {
  console.error(err.message);
  process.exitCode = 2;
}
