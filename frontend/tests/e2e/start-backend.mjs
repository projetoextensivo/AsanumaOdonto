import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const frontendDir = import.meta.dirname;
const backendDir = path.resolve(frontendDir, '../../../backend');
const dbBase = path.join(backendDir, 'data', 'asanumaodonto-e2e');

for (const suffix of ['.mv.db', '.trace.db']) {
  fs.rmSync(`${dbBase}${suffix}`, { force: true });
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'))) {
    return process.env.JAVA_HOME;
  }
  const jdksDir = path.join(os.homedir(), '.jdks');
  if (!fs.existsSync(jdksDir)) return process.env.JAVA_HOME || '';
  const candidates = fs.readdirSync(jdksDir)
    .filter((entry) => /^(corretto|temurin|jdk|openjdk)-21/i.test(entry))
    .sort()
    .reverse();
  for (const candidate of candidates) {
    const home = path.join(jdksDir, candidate);
    if (fs.existsSync(path.join(home, 'bin', 'java.exe')) || fs.existsSync(path.join(home, 'bin', 'java'))) {
      return home;
    }
  }
  return process.env.JAVA_HOME || '';
}

function resolveMaven() {
  if (process.env.MAVEN_CMD) return process.env.MAVEN_CMD;
  const distsDir = path.join(os.homedir(), '.m2', 'wrapper', 'dists');
  if (fs.existsSync(distsDir)) {
    const distributions = fs.readdirSync(distsDir)
      .filter((entry) => entry.startsWith('apache-maven-'))
      .sort()
      .reverse();
    for (const distribution of distributions) {
      const hashesDir = path.join(distsDir, distribution);
      for (const hash of fs.readdirSync(hashesDir)) {
        const root = path.join(hashesDir, hash, distribution.replace('-bin', ''));
        const executable = path.join(root, 'bin', process.platform === 'win32' ? 'mvn.cmd' : 'mvn');
        if (fs.existsSync(executable)) return executable;
      }
    }
  }
  return process.platform === 'win32' ? 'mvn.cmd' : 'mvn';
}

const javaHome = resolveJavaHome();
const maven = resolveMaven();
const dbUrl = `jdbc:h2:file:${dbBase.split(path.sep).join('/')};DB_CLOSE_ON_EXIT=FALSE`;

const child = spawn(maven, ['spring-boot:run', '-q'], {
  cwd: backendDir,
  shell: process.platform === 'win32',
  stdio: 'inherit',
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: javaHome ? `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}` : process.env.PATH,
    PORT: '8080',
    DB_URL: dbUrl,
    DB_USER: 'sa',
    DB_PASSWORD: '',
    DEMO_MODE: 'true',
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
    ALLOWED_ORIGINS: 'http://127.0.0.1:5173,http://localhost:5173',
    COOKIE_SECURE: 'false',
  },
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code, signal) => {
  if (!stopping) process.exit(code ?? (signal ? 1 : 0));
});
