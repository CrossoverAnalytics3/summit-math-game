import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const issues = [];
const required = ['.env.example', '.gitignore', '.nvmrc', '.github/workflows/ci.yml', 'LICENSE', 'package-lock.json'];
for (const name of required) {
  if (!existsSync(resolve(root, name))) issues.push(`Missing required source file: ${name}`);
}
if (Number(process.versions.node.split('.')[0]) < 24) issues.push('Use Node.js 24 (see .nvmrc).');
if (existsSync(resolve(root, '.env.example'))) {
  const example = readFileSync(resolve(root, '.env.example'), 'utf8');
  const key = example.match(/^ANTHROPIC_API_KEY[ \t]*=[ \t]*(.*)$/m)?.[1]?.trim();
  if (key !== '') issues.push('.env.example must keep ANTHROPIC_API_KEY empty.');
}

const git = (args, input) => spawnSync('git', args, { cwd: root, input, encoding: 'utf8' });
const top = git(['rev-parse', '--show-toplevel']);
const inRepository = top.status === 0 && realpathSync(top.stdout.trim()) === root;
if (inRepository) {
  const tracked = git(['ls-files', '-z']);
  if (tracked.status !== 0) issues.push('Unable to inspect tracked Git files.');
  for (const path of tracked.stdout.split('\0').filter(Boolean)) {
    const name = path.split('/').at(-1);
    if ((/^\.env(?:\..*)?$/.test(name) && name !== '.env.example') || /\.(?:db|sqlite|sqlite3)(?:-.*)?$/.test(name)) {
      issues.push(`Private runtime file is tracked by Git: ${path}`);
    }
    if (/(?:^|\/)(?:node_modules|dist)\//.test(path)) issues.push(`Generated directory is tracked by Git: ${path}`);
  }
  for (const path of ['.env', '.env.local', 'server/.env', 'server/summit.db', 'node_modules/probe', 'web/dist/probe']) {
    if (git(['check-ignore', '--no-index', '-q', path]).status !== 0) issues.push(`Ignore rules do not protect: ${path}`);
  }
  if (git(['check-ignore', '--no-index', '-q', '.env.example']).status === 0) issues.push('.env.example must remain uploadable.');
}

if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  console.log(`Repository files verified${inRepository ? '; Git tracking and ignore rules verified' : '; Git checks will run in a clone'}.`);
}
