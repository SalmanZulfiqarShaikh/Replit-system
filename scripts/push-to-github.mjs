import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = 'https://github.com/SalmanZulfiqarShaikh/Salman-TODO-System.git';

if (!TOKEN) {
  console.error('GITHUB_TOKEN env var not set');
  process.exit(1);
}

async function run() {
  try {
    console.log('Setting git author config...');
    await git.setConfig({ fs, dir, path: 'user.name', value: 'Salman Zulfiqar' });
    await git.setConfig({ fs, dir, path: 'user.email', value: 'ss3000569@gmail.com' });

    console.log('Staging all files...');
    await git.add({ fs, dir, filepath: '.' });

    console.log('Creating commit...');
    const sha = await git.commit({
      fs,
      dir,
      message: "Salman's System - migration complete (password auth + Supabase + Render)",
      author: { name: 'Salman Zulfiqar', email: 'ss3000569@gmail.com' },
    });
    console.log(`Commit created: ${sha}`);

    console.log('Setting remote...');
    try {
      await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL });
    } catch {
      await git.deleteRemote({ fs, dir, remote: 'github' });
      await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL });
    }

    console.log('Pushing to GitHub...');
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'github',
      remoteRef: 'main',
      force: true,
      onAuth: () => ({ username: 'token', password: TOKEN }),
      onProgress: (progress) => {
        if (progress.phase) process.stdout.write(`\r${progress.phase} ${progress.loaded || ''}/${progress.total || ''}`);
      },
    });

    console.log('\nPush complete!', pushResult);
    process.exit(0);
  } catch (err) {
    console.error('Push failed:', err.message || err);
    process.exit(1);
  }
}

run();
