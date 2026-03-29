import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = 'https://github.com/SalmanZulfiqarShaikh/Salman-TODO-System.git';

if (!TOKEN) {
  console.error('GITHUB_TOKEN env var not set');
  process.exit(1);
}

const AUTH_HEADER = 'Basic ' + Buffer.from('SalmanZulfiqarShaikh:' + TOKEN).toString('base64');

// Custom HTTP plugin that always injects auth headers
const http = {
  async request({ url, method, headers, body }) {
    const u = new URL(url);
    const authHeaders = {
      ...headers,
      'Authorization': AUTH_HEADER,
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method,
        headers: authHeaders,
      };
      const req = https.request(options, (res) => {
        console.log(`  ${method} ${url.split('?')[0].replace('https://github.com', '')} → ${res.statusCode}`);
        resolve({
          url,
          method,
          statusCode: res.statusCode,
          headers: res.headers,
          body: res,
        });
      });
      req.on('error', reject);
      if (body) {
        (async () => {
          try {
            for await (const chunk of body) req.write(chunk);
            req.end();
          } catch (e) { reject(e); }
        })();
      } else {
        req.end();
      }
    });
  }
};

async function run() {
  try {
    console.log('Configuring git author...');
    await git.setConfig({ fs, dir, path: 'user.name', value: 'Salman Zulfiqar' });
    await git.setConfig({ fs, dir, path: 'user.email', value: 'ss3000569@gmail.com' });

    console.log('Staging all files...');
    await git.add({ fs, dir, filepath: '.' });

    console.log('Creating commit...');
    const sha = await git.commit({
      fs,
      dir,
      message: "Salman's System — migration complete (password auth + Supabase + Render config)",
      author: { name: 'Salman Zulfiqar', email: 'ss3000569@gmail.com' },
    });
    console.log(`Commit: ${sha}`);

    console.log('Setting remote...');
    try {
      await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL });
    } catch {
      await git.deleteRemote({ fs, dir, remote: 'github' });
      await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL });
    }

    console.log('Pushing to GitHub...');
    const result = await git.push({
      fs,
      http,
      dir,
      remote: 'github',
      remoteRef: 'main',
      force: true,
    });

    console.log('\nPush successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('\nPush failed:', err.message || err);
    process.exit(1);
  }
}

run();
