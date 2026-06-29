import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, statSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
  readFile,
  writeFile,
  createFile,
  deleteFile,
  listDirectory,
  createDirectory,
  searchFiles,
  getFileTree,
} from '../services/fileSystem.js';

const router = Router();

// ─── GET /api/files/tree?path=X ──────────────────────────────────────────────
router.get('/tree', async (req, res) => {
  const { path: dirPath = process.cwd(), depth } = req.query;

  try {
    // Auto-create workspace directory if it doesn't exist
    const resolved = resolve(dirPath);
    if (!existsSync(resolved)) {
      mkdirSync(resolved, { recursive: true });
    }
    const tree = await getFileTree(dirPath, 0, depth ? parseInt(depth) : 4);
    res.json(tree);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// ─── GET /api/files/read?path=X ──────────────────────────────────────────────
router.get('/read', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'path query parameter required' });

  try {
    const result = await readFile(filePath);
    res.json(result);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// ─── POST /api/files/write ────────────────────────────────────────────────────
router.post('/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path is required' });
  if (content === undefined) return res.status(400).json({ error: 'content is required' });

  try {
    const result = await writeFile(filePath, content);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── POST /api/files/create ───────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const { path: filePath, content = '' } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path is required' });

  try {
    const result = await createFile(filePath, content);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.message.includes('already exists') ? 409 : 400).json({ error: err.message });
  }
});

// ─── DELETE /api/files/delete?path=X ─────────────────────────────────────────
router.delete('/delete', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'path query parameter required' });

  try {
    const result = await deleteFile(filePath);
    res.json(result);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// ─── POST /api/files/mkdir ────────────────────────────────────────────────────
router.post('/mkdir', async (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'path is required' });

  try {
    const result = await createDirectory(dirPath);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/files/list?path=X ──────────────────────────────────────────────
router.get('/list', async (req, res) => {
  const { path: dirPath = process.cwd() } = req.query;

  try {
    const resolved = resolve(dirPath);
    if (!existsSync(resolved)) {
      mkdirSync(resolved, { recursive: true });
    }
    const result = await listDirectory(dirPath);
    res.json(result);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// ─── GET /api/files/search?root=X&pattern=Y ──────────────────────────────────
router.get('/search', async (req, res) => {
  const { root, pattern } = req.query;
  if (!root) return res.status(400).json({ error: 'root query parameter required' });
  if (!pattern) return res.status(400).json({ error: 'pattern query parameter required' });

  try {
    const result = await searchFiles(root, pattern);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/files/exists?path=X ────────────────────────────────────────────
router.get('/exists', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'path query parameter required' });

  try {
    const { existsSync } = await import('fs');
    const { resolve } = await import('path');
    const resolved = resolve(filePath);
    res.json({ exists: existsSync(resolved), path: resolved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/files/stat?path=X ──────────────────────────────────────────────
router.get('/stat', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'path query parameter required' });

  try {
    const { stat } = await import('fs/promises');
    const { resolve, extname, basename } = await import('path');
    const resolved = resolve(filePath);
    const stats = await stat(resolved);
    res.json({
      path: resolved,
      name: basename(resolved),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      extension: extname(resolved),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ─── GET /api/files/drives ───────────────────────────────────────────────────
router.get('/drives', async (req, res) => {
  try {
    const isWin = process.platform === 'win32';
    if (!isWin) {
      return res.json({ drives: ['/'] });
    }
    const { existsSync } = await import('fs');
    const drives = [];
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ':\\';
      try {
        if (existsSync(drive)) {
          drives.push(drive);
        }
      } catch { /* ignore */ }
    }
    res.json({ drives });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/files/resolve-folder ──────────────────────────────────────────
router.post('/resolve-folder', async (req, res) => {
  const { folderName } = req.body;
  if (!folderName) return res.status(400).json({ error: 'folderName is required' });

  try {
    const { promises: fsPromises, existsSync } = await import('fs');
    const os = await import('os');
    const path = await import('path');

    // 1. Check parent directories of the backend
    let current = process.cwd();
    let resolvedPath = null;

    while (true) {
      if (path.basename(current) === folderName) {
        resolvedPath = current;
        break;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    // 2. Check subdirectories of parent directories (siblings)
    if (!resolvedPath) {
      current = process.cwd();
      for (let i = 0; i < 4; i++) {
        const parent = path.dirname(current);
        if (parent === current) break;
        
        const checkPath = path.join(parent, folderName);
        if (existsSync(checkPath)) {
          const stats = await fsPromises.stat(checkPath);
          if (stats.isDirectory()) {
            resolvedPath = checkPath;
            break;
          }
        }
        current = parent;
      }
    }

    // 3. Check inside home directory and common workspace directories
    if (!resolvedPath) {
      const home = os.homedir();
      const searchDirs = [
        home,
        path.join(home, 'Documents'),
        path.join(home, 'Desktop'),
        path.join(home, 'OneDrive'),
        path.join(home, 'OneDrive/Documents'),
        path.join(home, 'OneDrive/Documents/Projects'),
      ];

      for (const sDir of searchDirs) {
        const checkPath = path.join(sDir, folderName);
        if (existsSync(checkPath)) {
          try {
            const stats = await fsPromises.stat(checkPath);
            if (stats.isDirectory()) {
              resolvedPath = checkPath;
              break;
            }
          } catch {}
        }
      }
    }

    // 4. Default fallback: resolve relative to process.cwd()
    if (!resolvedPath) {
      resolvedPath = path.resolve(folderName);
    }

    res.json({ success: true, path: resolvedPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/default-workspace', async (req, res) => {
  try {
    const { resolve, join } = await import('path');
    const defaultWorkspace = resolve(join(process.cwd(), '..'));
    res.json({ success: true, path: defaultWorkspace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const execAsync = promisify(exec);

router.post('/select-directory', async (req, res) => {
  try {
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';
    
    let selectedPath = null;
    
    if (isWin) {
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');
      
      const tempScriptPath = path.join(os.tmpdir(), `select_folder_${Date.now()}.ps1`);
      const tempResultPath = path.join(os.tmpdir(), `selected_folder_${Date.now()}.txt`);
      
      if (fs.existsSync(tempResultPath)) {
        try { fs.unlinkSync(tempResultPath); } catch {}
      }

      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Select Workspace Folder for Zero Coding Agent"
$f.ShowNewFolderButton = $true
$result = $f.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [System.IO.File]::WriteAllText("${tempResultPath.replace(/\\/g, '\\\\')}", $f.SelectedPath)
} else {
    [System.IO.File]::WriteAllText("${tempResultPath.replace(/\\/g, '\\\\')}", "CANCELLED")
}
`;
      fs.writeFileSync(tempScriptPath, psScript, 'utf8');

      try {
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \\"${tempScriptPath}\\"' -WindowStyle Normal -Wait"`;
        await execAsync(cmd);
        
        if (fs.existsSync(tempResultPath)) {
          const content = fs.readFileSync(tempResultPath, 'utf8').trim();
          if (content && content !== 'CANCELLED') {
            selectedPath = content;
          }
        }
      } finally {
        try { if (fs.existsSync(tempScriptPath)) fs.unlinkSync(tempScriptPath); } catch {}
        try { if (fs.existsSync(tempResultPath)) fs.unlinkSync(tempResultPath); } catch {}
      }
    } else if (isMac) {
      const appleScript = `osascript -e 'POSIX path of (choose folder with prompt "Select Workspace Folder for Zero Coding Agent")'`;
      const { stdout } = await execAsync(appleScript);
      selectedPath = stdout.trim();
    } else {
      // Linux / Cloud Run — try zenity, fallback to workspace name
      try {
        const { stdout } = await execAsync('zenity --file-selection --directory --title="Select Workspace Folder for Zero Coding Agent"');
        selectedPath = stdout.trim();
      } catch {
        selectedPath = null;
      }
    }
    
    if (selectedPath) {
      res.json({ success: true, path: selectedPath });
    } else {
      res.json({ success: false, message: 'Selection cancelled' });
    }
  } catch (err) {
    console.error("[SelectDirectory] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/files/resolve-directory ─────────────────────────────────
router.post('/resolve-directory', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.json({ path: null });

    const { promises: fsPromises, existsSync } = await import('fs');
    const os = await import('os');
    const path = await import('path');

    let resolvedPath = null;

    // 1. Check parent directories of process.cwd() (up to 6 levels)
    let current = process.cwd();
    for (let i = 0; i < 6; i++) {
      const checkPath = path.join(current, name);
      if (existsSync(checkPath)) {
        const stats = await fsPromises.stat(checkPath);
        if (stats.isDirectory()) {
          resolvedPath = checkPath;
          break;
        }
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    // 2. Check sibling directories at each level of the parents
    if (!resolvedPath) {
      current = process.cwd();
      for (let i = 0; i < 6; i++) {
        const parent = path.dirname(current);
        if (parent === current) break;

        const checkPath = path.join(parent, name);
        if (existsSync(checkPath)) {
          const stats = await fsPromises.stat(checkPath);
          if (stats.isDirectory()) {
            resolvedPath = checkPath;
            break;
          }
        }
        
        // Also check subdirectories (siblings) of parent
        try {
          const siblings = await fsPromises.readdir(parent, { withFileTypes: true });
          for (const sibling of siblings) {
            if (sibling.isDirectory()) {
              const subPath = path.join(parent, sibling.name, name);
              if (existsSync(subPath)) {
                resolvedPath = subPath;
                break;
              }
            }
          }
        } catch {}
        
        if (resolvedPath) break;
        current = parent;
      }
    }

    // 3. Check inside home directory and common workspace directories
    if (!resolvedPath) {
      const home = os.homedir();
      const searchDirs = [
        home,
        path.join(home, 'Documents'),
        path.join(home, 'Desktop'),
        path.join(home, 'OneDrive'),
        path.join(home, 'OneDrive/Documents'),
        path.join(home, 'OneDrive/Documents/Projects'),
      ];

      for (const sDir of searchDirs) {
        const checkPath = path.join(sDir, name);
        if (existsSync(checkPath)) {
          try {
            const stats = await fsPromises.stat(checkPath);
            if (stats.isDirectory()) {
              resolvedPath = checkPath;
              break;
            }
          } catch {}
        }
      }
    }

    if (resolvedPath) {
      return res.json({ path: resolvedPath });
    }
    
    res.json({ path: null });
  } catch (err) {
    console.error("[ResolveDirectory] Error:", err.message);
    res.json({ path: null });
  }
});
router.get('/download', async (req, res) => {
  const { path: wsPath } = req.query;
  if (!wsPath) return res.status(400).json({ error: 'path is required' });

  try {
    const { resolve, basename, dirname } = await import('path');
    const { existsSync } = await import('fs');
    const resolvedPath = resolve(wsPath);

    if (!existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Workspace folder not found' });
    }

    const archiveName = `${basename(resolvedPath)}.tar.gz`;
    const isWin = process.platform === 'win32';
    
    // Create a temporary file path
    const tempDir = process.platform === 'win32' ? process.env.TEMP : '/tmp';
    const tempArchive = resolve(tempDir, `${Date.now()}-${archiveName}`);

    let cmd;
    if (isWin) {
      // Windows PowerShell tar command
      cmd = `tar -czf "${tempArchive}" -C "${dirname(resolvedPath)}" "${basename(resolvedPath)}"`;
    } else {
      // Linux tar command
      cmd = `tar -czf "${tempArchive}" -C "${dirname(resolvedPath)}" "${basename(resolvedPath)}"`;
    }

    exec(cmd, (err) => {
      if (err) {
        console.error("[Download] tar error:", err);
        return res.status(500).json({ error: 'Failed to compress workspace folder' });
      }

      res.download(tempArchive, archiveName, async (err) => {
        try {
          const { promises: fsPromises } = await import('fs');
          if (existsSync(tempArchive)) {
            await fsPromises.unlink(tempArchive);
          }
        } catch {}
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// ─── POST /api/files/rename ────────────────────────────────────────────────────
router.post('/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'oldPath and newPath are required' });
    }

    const path = await import('path');
    const { promises: fsPromises } = await import('fs');

    const absOld = path.resolve(oldPath);
    const absNew = path.resolve(newPath);

    // Check source exists
    try {
      await fsPromises.access(absOld);
    } catch {
      return res.status(404).json({ error: 'Source path does not exist' });
    }

    // Check destination doesn't already exist
    try {
      await fsPromises.access(absNew);
      return res.status(409).json({ error: 'Destination path already exists' });
    } catch {
      // Good, doesn't exist
    }

    // Ensure parent directory of destination exists
    const parentDir = path.dirname(absNew);
    try {
      await fsPromises.access(parentDir);
    } catch {
      await fsPromises.mkdir(parentDir, { recursive: true });
    }

    // Perform rename/move
    await fsPromises.rename(absOld, absNew);

    console.log(`[Rename] ${absOld} → ${absNew}`);
    res.json({ success: true, oldPath: absOld, newPath: absNew });
  } catch (err) {
    console.error('[Rename] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/files/browse-dirs?path=X ─────────────────────────────────────────
// Returns list of directories AND files for in-app folder browser (Cloud Run / Linux)
router.get('/browse-dirs', async (req, res) => {
  try {
    const { path: dirPath = process.cwd() } = req.query;
    const path = await import('path');
    const { promises: fsPromises } = await import('fs');

    const absPath = path.resolve(dirPath);
    let entries;
    try {
      entries = await fsPromises.readdir(absPath, { withFileTypes: true });
    } catch {
      return res.json({ path: absPath, entries: [], error: 'cannot_read' });
    }

    // Build entries with name, path, isDir, size
    const resultEntries = [];
    for (const e of entries) {
      // Skip hidden files/dirs
      if (e.name.startsWith('.')) continue;
      const entryPath = path.join(absPath, e.name);
      let size = null;
      if (!e.isDirectory()) {
        try {
          const stat = await fsPromises.stat(entryPath);
          size = stat.size;
        } catch {}
      }
      resultEntries.push({
        name: e.name,
        path: entryPath,
        isDir: e.isDirectory(),
        size
      });
    }

    // Also get parent path
    const parent = path.dirname(absPath);
    const hasParent = parent !== absPath;

    res.json({ path: absPath, entries: resultEntries, parent: hasParent ? parent : null });
  } catch (err) {
    console.error('[BrowseDirs] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/files/resolve-folder-path ─────────────────────────────────
// Resolves the real absolute path from webkitRelativePath entries
// Browser's <input webkitdirectory> only gives relative paths like "MyFolder/sub/file.txt"
// This endpoint finds the actual absolute path on disk by searching common locations
router.post('/resolve-folder-path', async (req, res) => {
  try {
    const { paths } = req.body;
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.json({ success: false, path: null });
    }

    const path = await import('path');
    const { existsSync } = await import('fs');

    // The root folder name is the first segment of the relative path
    const rootFolder = paths[0].split('/')[0];

    // Strategy: find a deeply nested file path on disk, then extract the workspace root
    // Try common parent directories where the user might have their project
    const os = await import('os');
    const homeDir = os.homedir();
    const cwd = process.cwd();

    const searchDirs = [
      cwd,
      path.dirname(cwd),
      path.dirname(path.dirname(cwd)),
      homeDir,
      path.join(homeDir, 'Documents'),
      path.join(homeDir, 'Documents', 'Projects'),
      path.join(homeDir, 'Desktop'),
      path.join(homeDir, 'OneDrive', 'Documents', 'Projects'),
    ];

    // For each search dir, try to find the rootFolder, then validate a sub-path from webkitRelativePath
    for (const searchDir of searchDirs) {
      const candidatePath = path.join(searchDir, rootFolder);
      if (existsSync(candidatePath)) {
        // Validate: check if at least one file from the relative paths exists under this candidate
        for (const relPath of paths.slice(0, 10)) {
          const fullPath = path.join(searchDir, relPath);
          if (existsSync(fullPath)) {
            return res.json({ success: true, path: candidatePath });
          }
        }
      }
    }

    // Fallback: recursive search in cwd parents (up to 6 levels)
    let current = cwd;
    for (let i = 0; i < 6; i++) {
      const checkPath = path.join(current, rootFolder);
      if (existsSync(checkPath)) {
        return res.json({ success: true, path: checkPath });
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    // Last fallback: return the folder name (user will need to set path manually)
    res.json({ success: false, path: rootFolder });
  } catch (err) {
    console.error('[ResolveFolderPath] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
