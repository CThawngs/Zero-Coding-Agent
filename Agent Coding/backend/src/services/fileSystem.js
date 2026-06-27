import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir, rm, stat, readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, resolve, relative, extname, basename, dirname } from 'path';
import { watch } from 'chokidar';

// ─── File Extension to Icon Mapping ──────────────────────────────────────────
const EXT_ICONS = {
  '.js': '📄', '.ts': '📄', '.jsx': '⚛️', '.tsx': '⚛️',
  '.py': '🐍', '.rb': '💎', '.go': '🐹', '.rs': '🦀',
  '.java': '☕', '.cs': '🎯', '.cpp': '⚙️', '.c': '⚙️',
  '.html': '🌐', '.css': '🎨', '.scss': '🎨', '.sass': '🎨',
  '.json': '📋', '.yaml': '📋', '.yml': '📋', '.toml': '📋',
  '.md': '📝', '.txt': '📝', '.rst': '📝',
  '.sql': '🗄️', '.graphql': '📡',
  '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️', '.svg': '🎨', '.webp': '🖼️',
  '.mp4': '🎬', '.mp3': '🎵', '.wav': '🎵',
  '.pdf': '📕', '.docx': '📘', '.xlsx': '📗',
  '.zip': '📦', '.tar': '📦', '.gz': '📦',
  '.env': '🔐', '.gitignore': '🙈',
  '.sh': '🖥️', '.bat': '🖥️', '.ps1': '🖥️',
  '.dockerfile': '🐳', '.lock': '🔒',
};

// ─── Binary Extension Detection ───────────────────────────────────────────────
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff',
  '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.ogg', '.flac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot',
  '.db', '.sqlite', '.sqlite3',
]);

// ─── Security: Validate Path ──────────────────────────────────────────────────
function validatePath(inputPath) {
  if (!inputPath) throw new Error('Path is required');

  // Normalize separators
  const normalized = inputPath.replace(/\\/g, '/');

  // Block obvious traversal
  if (normalized.includes('../') || normalized.includes('..\\')) {
    throw new Error('Path traversal detected');
  }

  // Resolve to absolute
  const resolved = resolve(inputPath);
  return resolved;
}

function isBinaryFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  return BINARY_EXTS.has(ext);
}

function getIcon(filePath, isDir) {
  if (isDir) return '📁';
  const ext = extname(filePath).toLowerCase();
  const base = basename(filePath).toLowerCase();

  // Special filenames
  if (base === 'dockerfile') return '🐳';
  if (base === '.env' || base.startsWith('.env.')) return '🔐';
  if (base === 'package.json') return '📦';
  if (base === 'readme.md') return '📖';

  return EXT_ICONS[ext] || '📄';
}

// ─── Read File ────────────────────────────────────────────────────────────────
export async function readFile(filePath) {
  const resolved = validatePath(filePath);

  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stats = statSync(resolved);
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory: ${filePath}`);
  }

  if (isBinaryFile(resolved)) {
    return {
      path: resolved,
      content: null,
      isBinary: true,
      size: stats.size,
      message: `Binary file (${extname(resolved)}) - ${stats.size} bytes`,
    };
  }

  const content = await fsReadFile(resolved, 'utf-8');
  return {
    path: resolved,
    content,
    isBinary: false,
    size: stats.size,
    lines: content.split('\n').length,
  };
}

// ─── Write File ───────────────────────────────────────────────────────────────
export async function writeFile(filePath, content) {
  const resolved = validatePath(filePath);
  const dir = dirname(resolved);

  // Ensure directory exists
  await mkdir(dir, { recursive: true });
  await fsWriteFile(resolved, content, 'utf-8');

  return {
    path: resolved,
    size: Buffer.byteLength(content, 'utf-8'),
    written: true,
  };
}

// ─── Create File ──────────────────────────────────────────────────────────────
export async function createFile(filePath, content = '') {
  const resolved = validatePath(filePath);

  if (existsSync(resolved)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  const dir = dirname(resolved);
  await mkdir(dir, { recursive: true });
  await fsWriteFile(resolved, content, 'utf-8');

  return {
    path: resolved,
    created: true,
  };
}

// ─── Delete File ──────────────────────────────────────────────────────────────
export async function deleteFile(filePath) {
  const resolved = validatePath(filePath);

  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }

  await rm(resolved, { recursive: true, force: true });
  return { path: resolved, deleted: true };
}

// ─── List Directory ───────────────────────────────────────────────────────────
export async function listDirectory(dirPath) {
  const resolved = validatePath(dirPath);

  if (!existsSync(resolved)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const stats = statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  const entries = await readdir(resolved, { withFileTypes: true });
  const items = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(resolved, entry.name);
      let size = 0;
      try {
        const s = statSync(fullPath);
        size = s.size;
      } catch { /* ignore */ }

      return {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size,
        icon: getIcon(fullPath, entry.isDirectory()),
        extension: entry.isFile() ? extname(entry.name) : null,
      };
    })
  );

  // Sort: directories first, then files, alphabetically
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return { path: resolved, items };
}

// ─── Create Directory ─────────────────────────────────────────────────────────
export async function createDirectory(dirPath) {
  const resolved = validatePath(dirPath);
  await mkdir(resolved, { recursive: true });
  return { path: resolved, created: true };
}

// ─── Search Files ─────────────────────────────────────────────────────────────
export async function searchFiles(rootPath, pattern) {
  const resolved = validatePath(rootPath);

  if (!existsSync(resolved)) {
    throw new Error(`Root directory not found: ${rootPath}`);
  }

  const results = [];
  const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');

  async function walk(dir, depth = 0) {
    if (depth > 10) return; // Limit depth
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        // Skip node_modules, .git, dist
        if (['node_modules', '.git', 'dist', '.next', '__pycache__', '.cache'].includes(entry.name)) continue;

        if (regex.test(entry.name)) {
          results.push({
            name: entry.name,
            path: fullPath,
            relativePath: relative(resolved, fullPath),
            isDirectory: entry.isDirectory(),
            icon: getIcon(fullPath, entry.isDirectory()),
          });
        }

        if (entry.isDirectory()) {
          await walk(fullPath, depth + 1);
        }

        if (results.length >= 200) return; // Cap results
      }
    } catch { /* ignore permission errors */ }
  }

  await walk(resolved);
  return { root: resolved, pattern, results };
}

// ─── Get File Tree ────────────────────────────────────────────────────────────
export async function getFileTree(rootPath, depth = 0, maxDepth = 4) {
  const resolved = validatePath(rootPath);

  if (!existsSync(resolved)) {
    throw new Error(`Path not found: ${rootPath}`);
  }

  const stats = statSync(resolved);
  const name = basename(resolved);

  if (stats.isFile()) {
    return {
      name,
      path: resolved,
      type: 'file',
      icon: getIcon(resolved, false),
      size: stats.size,
      extension: extname(name),
    };
  }

  if (depth >= maxDepth) {
    return {
      name,
      path: resolved,
      type: 'directory',
      icon: '📁',
      children: null, // truncated
      truncated: true,
    };
  }

  let entries = [];
  try {
    entries = await readdir(resolved, { withFileTypes: true });
  } catch {
    return { name, path: resolved, type: 'directory', icon: '📁', children: [] };
  }

  // Filter out noise
  const SKIP = new Set(['node_modules', '.git', 'dist', '.next', 'build', '__pycache__', '.cache', '.nuxt', '.output', 'coverage']);
  const filtered = entries.filter((e) => !SKIP.has(e.name) && !e.name.startsWith('.'));

  // Sort dirs first
  filtered.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const children = await Promise.all(
    filtered.map((entry) => getFileTree(join(resolved, entry.name), depth + 1, maxDepth))
  );

  return {
    name,
    path: resolved,
    type: 'directory',
    icon: depth === 0 ? '🏠' : '📁',
    children,
  };
}

// ─── Watch Directory ──────────────────────────────────────────────────────────
export function watchDirectory(dirPath, callback) {
  let resolved;
  try {
    resolved = validatePath(dirPath);
  } catch (err) {
    console.error('[watchDirectory] Invalid path:', err.message);
    return () => {};
  }

  if (!existsSync(resolved)) {
    console.error('[watchDirectory] Path not found:', resolved);
    return () => {};
  }

  const watcher = watch(resolved, {
    persistent: false,
    ignoreInitial: true,
    ignored: /(^|[/\\])(node_modules|\.git|dist|build|\.next)([/\\]|$)/,
    depth: 5,
  });

  watcher.on('add', (p) => callback('add', p));
  watcher.on('change', (p) => callback('change', p));
  watcher.on('unlink', (p) => callback('unlink', p));
  watcher.on('addDir', (p) => callback('addDir', p));
  watcher.on('unlinkDir', (p) => callback('unlinkDir', p));
  watcher.on('error', (err) => console.error('[watcher error]', err));

  // Return stop function
  return () => watcher.close();
}

export default { readFile, writeFile, createFile, deleteFile, listDirectory, createDirectory, searchFiles, getFileTree, watchDirectory };
