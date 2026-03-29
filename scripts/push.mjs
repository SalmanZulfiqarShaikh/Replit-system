import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '..');
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const AUTH_HEADER = 'Basic ' + Buffer.from('SalmanZulfiqarShaikh:' + TOKEN).toString('base64');
const http = {
  async request({ url, method, headers, body }) {
    const u = new URL(url);
    return new Promise((resolve, reject) => {
      const req = https.request(
        { hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers: { ...headers, Authorization: AUTH_HEADER } },
        (res) => { console.log(`  ${method} → ${res.statusCode}`); resolve({ url, method, statusCode: res.statusCode, headers: res.headers, body: res }); }
      );
      req.on('error', reject);
      if (body) { (async () => { try { for await (const c of body) req.write(c); req.end(); } catch(e){ reject(e); } })(); }
      else req.end();
    });
  }
};
await git.setConfig({ fs, dir, path: 'user.name', value: 'Salman Zulfiqar' });
await git.setConfig({ fs, dir, path: 'user.email', value: 'ss3000569@gmail.com' });
await git.add({ fs, dir, filepath: '.' });
const sha = await git.commit({ fs, dir, message: 'Add Vite dev proxy for /api → Express API server', author: { name: 'Salman Zulfiqar', email: 'ss3000569@gmail.com' } });
console.log('Commit:', sha);
try { await git.addRemote({ fs, dir, remote: 'gh', url: 'https://github.com/SalmanZulfiqarShaikh/Salman-TODO-System.git' }); } catch { await git.deleteRemote({ fs, dir, remote: 'gh' }); await git.addRemote({ fs, dir, remote: 'gh', url: 'https://github.com/SalmanZulfiqarShaikh/Salman-TODO-System.git' }); }
const result = await git.push({ fs, http, dir, remote: 'gh', remoteRef: 'main', force: true });
console.log('Push:', result.ok ? 'SUCCESS' : 'FAILED');
