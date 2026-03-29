import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = 'https://github.com/SalmanZulfiqarShaikh/Salman-TODO-System.git';

if (!TOKEN) { console.error('GITHUB_TOKEN not set'); process.exit(1); }

const AUTH_HEADER = 'Basic ' + Buffer.from('SalmanZulfiqarShaikh:' + TOKEN).toString('base64');

const http = {
  async request({ url, method, headers, body }) {
    const u = new URL(url);
    return new Promise((resolve, reject) => {
      const req = https.request(
        { hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers: { ...headers, Authorization: AUTH_HEADER } },
        (res) => {
          console.log(`  ${method} ${u.pathname.split('/').slice(-1)[0]} → ${res.statusCode}`);
          resolve({ url, method, statusCode: res.statusCode, headers: res.headers, body: res });
        }
      );
      req.on('error', reject);
      if (body) { (async () => { try { for await (const c of body) req.write(c); req.end(); } catch(e){ reject(e); } })(); }
      else req.end();
    });
  }
};

async function run() {
  await git.setConfig({ fs, dir, path: 'user.name', value: 'Salman Zulfiqar' });
  await git.setConfig({ fs, dir, path: 'user.email', value: 'ss3000569@gmail.com' });
  await git.add({ fs, dir, filepath: '.' });
  const sha = await git.commit({ fs, dir, message: 'Add vercel.json for frontend deployment', author: { name: 'Salman Zulfiqar', email: 'ss3000569@gmail.com' } });
  console.log('Commit:', sha);
  try { await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL }); }
  catch { await git.deleteRemote({ fs, dir, remote: 'github' }); await git.addRemote({ fs, dir, remote: 'github', url: REPO_URL }); }
  const result = await git.push({ fs, http, dir, remote: 'github', remoteRef: 'main', force: true });
  console.log('Push:', result.ok ? 'SUCCESS' : 'FAILED', JSON.stringify(result.refs));
}

run().then(() => process.exit(0)).catch(e => { console.error('Error:', e.message); process.exit(1); });
