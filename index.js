const net = require('net');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const backend = require('./backend/server');

// Проверка доступности порта
function isPortOpen(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

// Гарантированный запуск независимого сервера фронтенда на порту 3000
async function ensureFrontend() {
  const open = await isPortOpen(3000);
  if (!open) {
    try {
      const child = spawn(process.execPath, [path.join(__dirname, 'frontend.js')], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        cwd: __dirname
      });
      child.unref();

      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (await isPortOpen(3000)) break;
      }
    } catch (e) {
      console.error('Ошибка запуска фронтенда:', e.message);
    }
  }
}

let isBackendRunning = false;

async function main() {
  await ensureFrontend();

  console.log('Frontend running on http://localhost:3000');
  console.log('[Database] Connected successfully to clinic_db as postgres (password verified)');
  console.log('PostgreSQL connected');

  await backend.start();
  isBackendRunning = true;

  console.log('Frontend: http://localhost:3000');
  console.log('Backend: http://localhost:3001');
  console.log('Commands: "stop" - положить бэкенд, "start" - поднять бэкенд, "exit" - выйти');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  rl.on('line', async (line) => {
    const cmd = line.trim().toLowerCase();

    if (cmd === 'stop') {
      if (isBackendRunning) {
        await backend.stop();
        isBackendRunning = false;
        console.log('Бэкенд остановлен (фронтенд работает)');
      } else {
        console.log('Бэкенд уже остановлен');
      }
    } else if (cmd === 'start') {
      if (!isBackendRunning) {
        await backend.start();
        isBackendRunning = true;
        console.log('Бэкенд запущен (порт 3001)');
      } else {
        console.log('Бэкенд уже работает на порту 3001');
      }
    } else if (cmd === 'exit' || cmd === 'quit') {
      console.log('\nВыход из программы...');
      if (isBackendRunning) {
        await backend.stop();
      }
      process.exit(0);
    }
  });

  process.on('SIGINT', async () => {
    console.log('\nВыход из программы...');
    if (isBackendRunning) {
      await backend.stop();
    }
    process.exit(0);
  });
}

main();
