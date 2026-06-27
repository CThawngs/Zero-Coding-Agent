import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { platform } from 'os';

// ─── Running Commands Registry ────────────────────────────────────────────────
const runningCommands = new Map();

// ─── Pending Approval Registry ────────────────────────────────────────────────
const pendingCommands = new Map();

// ─── Detect Shell ────────────────────────────────────────────────────────────
function getShell() {
  if (platform() === 'win32') {
    return { shell: 'cmd.exe', flag: '/c' };
  }
  return { shell: process.env.SHELL || '/bin/bash', flag: '-c' };
}

// ─── Execute Command ──────────────────────────────────────────────────────────
export async function executeCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = 60000,
    onData,
    onError: onErrorCb,
  } = options;

  const id = uuidv4();
  const { shell, flag } = getShell();

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    const proc = spawn(shell, [flag, command], {
      cwd,
      env: { ...process.env },
      shell: false,
    });

    const entry = { id, command, cwd, proc, startTime };
    runningCommands.set(id, entry);

    // Timeout handler
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      runningCommands.delete(id);
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (onData) onData({ type: 'stdout', text, id });
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (onErrorCb) onErrorCb({ type: 'stderr', text, id });
      if (onData) onData({ type: 'stderr', text, id });
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      runningCommands.delete(id);
      resolve({
        id,
        command,
        cwd,
        stdout,
        stderr,
        exitCode: code,
        duration: Date.now() - startTime,
        success: code === 0,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      runningCommands.delete(id);
      reject(new Error(`Spawn error: ${err.message}`));
    });
  });
}

// ─── Kill Command ─────────────────────────────────────────────────────────────
export function killCommand(id) {
  const entry = runningCommands.get(id);
  if (!entry) return false;
  entry.proc.kill('SIGKILL');
  runningCommands.delete(id);
  return true;
}

// ─── List Running Commands ─────────────────────────────────────────────────────
export function getRunningCommands() {
  return Array.from(runningCommands.values()).map((e) => ({
    id: e.id,
    command: e.command,
    cwd: e.cwd,
    startTime: e.startTime,
    duration: Date.now() - e.startTime,
  }));
}

// ─── Pending Approval Management ─────────────────────────────────────────────
export function addPendingCommand(command, cwd, metadata = {}) {
  const id = uuidv4();
  pendingCommands.set(id, {
    id,
    command,
    cwd,
    createdAt: Date.now(),
    metadata,
    status: 'pending',
  });
  return id;
}

export function approvePendingCommand(commandId) {
  const cmd = pendingCommands.get(commandId);
  if (!cmd) return null;
  cmd.status = 'approved';
  pendingCommands.set(commandId, cmd);
  return cmd;
}

export function rejectPendingCommand(commandId) {
  const cmd = pendingCommands.get(commandId);
  if (!cmd) return null;
  cmd.status = 'rejected';
  pendingCommands.delete(commandId);
  return cmd;
}

export function getPendingCommand(commandId) {
  return pendingCommands.get(commandId) || null;
}

export function clearPendingCommand(commandId) {
  pendingCommands.delete(commandId);
}

// ─── Execute With Streaming ───────────────────────────────────────────────────
export async function executeCommandStream(command, cwd, onChunk) {
  const { shell, flag } = getShell();
  const id = uuidv4();

  return new Promise((resolve, reject) => {
    const proc = spawn(shell, [flag, command], {
      cwd: cwd || process.cwd(),
      env: { ...process.env },
    });

    const entry = { id, command, cwd, proc, startTime: Date.now() };
    runningCommands.set(id, entry);

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      runningCommands.delete(id);
    }, 60000);

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (onChunk) onChunk({ type: 'stdout', text });
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (onChunk) onChunk({ type: 'stderr', text });
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      runningCommands.delete(id);
      if (onChunk) onChunk({ type: 'exit', exitCode: code });
      resolve({ id, stdout, stderr, exitCode: code, success: code === 0 });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      runningCommands.delete(id);
      reject(err);
    });
  });
}

export default {
  executeCommand,
  executeCommandStream,
  killCommand,
  getRunningCommands,
  addPendingCommand,
  approvePendingCommand,
  rejectPendingCommand,
  getPendingCommand,
  clearPendingCommand,
};
