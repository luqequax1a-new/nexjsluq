/* eslint-disable no-console */
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const out = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }

  return out;
}

function isLocalHost(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function checkPortOpen(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (isOpen) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForPort(host, port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const open = await checkPortOpen(host, port, 700);
    if (open) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

async function main() {
  const root = process.cwd();
  const backendEnvPath = path.join(root, "backend", ".env");
  const env = parseDotEnv(backendEnvPath);

  const connection = env.DB_CONNECTION || "pgsql";
  const host = env.DB_HOST || "127.0.0.1";
  const port = Number(env.DB_PORT || 5432);

  if (connection !== "pgsql") {
    console.log(`[predev] DB_CONNECTION=${connection}, postgres auto-start skipped.`);
    return;
  }

  if (!isLocalHost(host)) {
    console.log(`[predev] DB_HOST=${host} (remote), postgres auto-start skipped.`);
    return;
  }

  if (Number.isNaN(port) || port <= 0) {
    console.log(`[predev] Invalid DB_PORT=${env.DB_PORT}. postgres auto-start skipped.`);
    return;
  }

  const isUp = await checkPortOpen(host, port);
  if (isUp) {
    console.log(`[predev] PostgreSQL already running on ${host}:${port}.`);
    return;
  }

  const pgCtlCandidates = [
    process.env.PG_CTL_PATH,
    "C:\\laragon\\bin\\postgresql\\postgresql\\bin\\pg_ctl.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe",
    "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl.exe",
  ].filter(Boolean);

  const pgDataCandidates = [
    process.env.PG_DATA_PATH,
    "C:\\laragon\\data\\postgresql",
  ].filter(Boolean);

  const pgCtl = pgCtlCandidates.find((p) => fs.existsSync(p));
  const dataDir = pgDataCandidates.find((p) => fs.existsSync(p));

  if (!pgCtl || !dataDir) {
    console.error("[predev] PostgreSQL is not running and auto-start prerequisites are missing.");
    console.error(`[predev] Expected pg_ctl and data dir. Found pg_ctl=${Boolean(pgCtl)}, dataDir=${Boolean(dataDir)}.`);
    console.error("[predev] Set PG_CTL_PATH and PG_DATA_PATH env vars or start postgres manually.");
    process.exit(1);
  }

  const logPath = path.join(dataDir, "server.log");
  console.log(`[predev] Starting PostgreSQL with ${pgCtl} ...`);
  const res = spawnSync(pgCtl, ["-D", dataDir, "-l", logPath, "start"], {
    stdio: "inherit",
    shell: false,
  });

  if (res.status !== 0) {
    console.error("[predev] pg_ctl failed to start PostgreSQL.");
    process.exit(1);
  }

  const started = await waitForPort(host, port, 15000);
  if (!started) {
    console.error(`[predev] PostgreSQL did not become ready on ${host}:${port} in time.`);
    process.exit(1);
  }

  console.log(`[predev] PostgreSQL is ready on ${host}:${port}.`);
}

void main();
