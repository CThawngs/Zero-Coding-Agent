import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
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

const execAsync = promisify(exec);

router.post('/select-directory', async (req, res) => {
  try {
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    
    let selectedPath = null;
    
    if (isWin) {
      // PowerShell script to open FolderBrowserDialog
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms;
        $f = New-Object System.Windows.Forms.FolderBrowserDialog;
        $f.Description = "Select Workspace Folder for Zero Coding Agent";
        $f.ShowNewFolderButton = $true;
        $result = $f.ShowDialog();
        if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
          $f.SelectedPath
        }
      `;
      const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
      if (stderr) {
        console.error("[SelectDirectory] PowerShell stderr:", stderr);
      }
      selectedPath = stdout.trim();
    } else if (isMac) {
      const appleScript = `osascript -e 'POSIX path of (choose folder with prompt "Select Workspace Folder for Zero Coding Agent")'`;
      const { stdout } = await execAsync(appleScript);
      selectedPath = stdout.trim();
    } else {
      try {
        const { stdout } = await execAsync('zenity --file-selection --directory --title="Select Workspace Folder for Zero Coding Agent"');
        selectedPath = stdout.trim();
      } catch (err) {
        selectedPath = process.env.HOME || '/';
      }
    }
    
    if (selectedPath) {
      res.json({ success: true, path: selectedPath });
    } else {
      res.json({ success: false, message: 'Selection cancelled or failed' });
    }
  } catch (err) {
    console.error("[SelectDirectory] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
