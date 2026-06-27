// ============================================================
// File Utilities for Antigravity Frontend
// ============================================================

// File type → icon mapping
const FILE_ICONS = {
  // Languages
  js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
  py: '🐍', rb: '💎', go: '🐹', rs: '🦀',
  java: '☕', kt: '🎯', swift: '🍎', cpp: '⚙️',
  c: '⚙️', cs: '🔷', php: '🐘', lua: '🌙',
  // Web
  html: '🌐', css: '🎨', scss: '🎨', sass: '🎨',
  less: '🎨', vue: '💚', svelte: '🔶',
  // Data
  json: '📋', yaml: '📋', yml: '📋', toml: '📋',
  xml: '📋', csv: '📊', sql: '🗄️',
  // Config
  env: '🔑', gitignore: '🚫', dockerfile: '🐳',
  makefile: '⚙️', sh: '💻', bash: '💻', zsh: '💻',
  // Docs
  md: '📝', mdx: '📝', txt: '📄', pdf: '📕',
  doc: '📄', docx: '📄',
  // Images
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
  svg: '🎭', ico: '🎯', webp: '🖼️',
  // Media
  mp4: '🎬', mp3: '🎵', wav: '🎵', webm: '🎬',
  // Archives
  zip: '📦', tar: '📦', gz: '📦', rar: '📦',
  // Other
  lock: '🔒', log: '📋',
}

const FOLDER_ICONS = {
  src: '📂', lib: '📚', components: '🧩', pages: '📑',
  assets: '🎨', public: '🌐', styles: '🎨', utils: '🔧',
  hooks: '🪝', store: '📦', stores: '📦', api: '🔌',
  tests: '🧪', test: '🧪', __tests__: '🧪',
  node_modules: '📦', dist: '📤', build: '🏗️',
  '.git': '🔀', '.github': '🐙', docs: '📚',
  config: '⚙️', scripts: '📜',
}

export function getFileIcon(filename) {
  if (!filename) return '📄'
  const name = filename.toLowerCase()
  const parts = name.split('.')
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''

  // Special filenames
  if (name === 'dockerfile') return '🐳'
  if (name === 'makefile') return '⚙️'
  if (name === '.gitignore') return '🚫'
  if (name === '.env' || name.startsWith('.env.')) return '🔑'
  if (name === 'package.json' || name === 'package-lock.json') return '📦'
  if (name === 'yarn.lock' || name === 'pnpm-lock.yaml') return '🔒'
  if (name === 'readme.md') return '📘'

  return FILE_ICONS[ext] || '📄'
}

export function getFolderIcon(folderName) {
  if (!folderName) return '📁'
  const name = folderName.toLowerCase()
  return FOLDER_ICONS[name] || '📁'
}

// CodeMirror language detection
export function getLanguage(filename) {
  if (!filename) return 'text'
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  const langMap = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python',
    css: 'css', scss: 'css', less: 'css',
    html: 'html', htm: 'html',
    json: 'json',
    md: 'markdown', mdx: 'markdown',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    yaml: 'yaml', yml: 'yaml',
    toml: 'toml',
    sql: 'sql',
    rs: 'rust',
    go: 'go',
    rb: 'ruby',
    java: 'java',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    kt: 'kotlin',
    swift: 'swift',
    xml: 'xml',
    lua: 'lua',
    r: 'r',
    vue: 'html',
    svelte: 'html',
  }

  return langMap[ext] || 'text'
}

// Human readable file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes == null) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// Check if file should be opened in editor
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
  'cpp', 'cc', 'cxx', 'c', 'h', 'hpp', 'cs', 'php', 'lua', 'r', 'scala',
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte',
  'json', 'yaml', 'yml', 'toml', 'xml', 'csv',
  'md', 'mdx', 'txt', 'rst', 'log',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'env', 'gitignore', 'gitattributes', 'editorconfig', 'prettierrc',
  'eslintrc', 'babelrc', 'npmrc', 'nvmrc',
  'dockerfile', 'makefile', 'vagrantfile',
  'sql', 'graphql', 'gql',
])

export function isTextFile(filename) {
  if (!filename) return false
  const name = filename.toLowerCase()
  const ext = name.split('.').pop() || ''

  // Special no-extension files
  const noExtTextFiles = ['dockerfile', 'makefile', 'rakefile', 'vagrantfile', 'gemfile', 'procfile']
  if (noExtTextFiles.includes(name)) return true

  // Hidden config files
  if (name.startsWith('.') && !name.includes('.min.')) return true

  return TEXT_EXTENSIONS.has(ext)
}

// Smart path truncation
export function truncatePath(path, maxLength = 40) {
  if (!path || path.length <= maxLength) return path
  const parts = path.replace(/\\/g, '/').split('/')
  if (parts.length <= 2) return '...' + path.slice(-maxLength + 3)

  // Try to show root/.../.../filename
  const filename = parts[parts.length - 1]
  const root = parts[0]

  if (root.length + filename.length + 5 < maxLength) {
    return `${root}/.../${filename}`
  }
  return `.../${filename}`
}

// Get parent directory
export function getParentDir(path) {
  if (!path) return '/'
  const normalized = path.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  if (idx <= 0) return '/'
  return normalized.slice(0, idx)
}

// Get filename from path
export function getFilename(path) {
  if (!path) return ''
  return path.replace(/\\/g, '/').split('/').pop() || ''
}

// Get file extension
export function getExtension(filename) {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

// Is image file
export function isImageFile(filename) {
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'])
  return imageExts.has(getExtension(filename))
}

// Sort file tree entries: folders first, then files, alphabetically
export function sortTree(entries) {
  if (!Array.isArray(entries)) return []
  return [...entries].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1
    if (a.type !== 'directory' && b.type === 'directory') return 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}
