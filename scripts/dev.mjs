import { spawn } from "node:child_process";

const processes = [
  { name: "api", args: ["server/index.js"] },
  { name: "web", args: ["node_modules/vite/bin/vite.js"] },
];

const children = processes.map(({ name, args }) => {
  const child = spawn(process.execPath, args, { stdio: "inherit" });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] процесс завершился с кодом ${code}`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    child.kill();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
