// Parse GitHub URL into {owner, repo, branch, path}
export function parseGitHubUrl(url) {
  // Handle: https://github.com/owner/repo
  // Handle: https://github.com/owner/repo/tree/branch/path
  // Handle: https://github.com/owner/repo/blob/branch/path
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+)(\/.*)?)?(?:\/)?$/
  );
  
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] || 'main',
    path: match[4] ? match[4].slice(1) : '' // remove leading /
  };
}

// GitHub API fetch helper
async function ghFetch(url, token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Antigravity-Web/1.0'
  };
  if (token) headers['Authorization'] = `token ${token}`;
  
  const res = await fetch(url, { headers });
  
  if (res.status === 404) throw new Error('Repository or file not found (may be private)');
  if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Add a token to increase limit.');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  
  return res.json();
}

// ============================================================
// READ REPO (tree + key files)
// ============================================================
export async function readRepo(url, token) {
  const { owner, repo, branch } = parseGitHubUrl(url);
  
  // Get repo info
  const repoInfo = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    token
  );
  
  // Get file tree
  const treeData = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch || repoInfo.default_branch}?recursive=1`,
    token
  );
  
  const files = treeData.tree || [];
  const fileTree = files
    .filter(f => f.type === 'blob')
    .slice(0, 200) // Max 200 files
    .map(f => ({ path: f.path, size: f.size, type: 'file' }));
  
  // Read key files (README, package.json, main config files)
  const KEY_FILES = ['README.md', 'readme.md', 'package.json', 'requirements.txt', 'setup.py', 'Cargo.toml'];
  const fileContents = {};
  
  for (const keyFile of KEY_FILES) {
    const found = files.find(f => f.path.toLowerCase() === keyFile.toLowerCase() || f.path.endsWith('/' + keyFile));
    if (found && found.size < 50000) {
      try {
        const content = await readFile(owner, repo, found.path, token, branch || repoInfo.default_branch);
        fileContents[found.path] = content.content;
      } catch { /* skip */ }
    }
  }
  
  const summary = [
    `# Repository: ${owner}/${repo}`,
    `Description: ${repoInfo.description || 'No description'}`,
    `Language: ${repoInfo.language || 'Unknown'}`,
    `Stars: ${repoInfo.stargazers_count}`,
    `Branch: ${branch || repoInfo.default_branch}`,
    '',
    '## File Tree:',
    fileTree.map(f => `- ${f.path}`).join('\n'),
    '',
    '## Key Files:',
    ...Object.entries(fileContents).map(([path, content]) => 
      `### ${path}\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``
    )
  ].join('\n');
  
  return {
    owner,
    repo,
    branch: branch || repoInfo.default_branch,
    description: repoInfo.description,
    language: repoInfo.language,
    stars: repoInfo.stargazers_count,
    fileCount: fileTree.length,
    files: fileTree,
    keyFiles: fileContents,
    summary
  };
}

// ============================================================
// READ SPECIFIC FILE
// ============================================================
export async function readFile(owner, repo, path, token, branch = 'main') {
  const data = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    token
  );
  
  if (data.type !== 'file') throw new Error(`${path} is not a file`);
  if (!data.content) throw new Error('File has no content');
  
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  
  return {
    path,
    content,
    size: data.size,
    sha: data.sha,
    url: data.html_url
  };
}

// ============================================================
// SEARCH CODE
// ============================================================
export async function searchCode(owner, repo, query, token) {
  const searchQuery = `${query}+repo:${owner}/${repo}`;
  const data = await ghFetch(
    `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=20`,
    token
  );
  
  return {
    totalCount: data.total_count,
    items: (data.items || []).map(item => ({
      path: item.path,
      name: item.name,
      url: item.html_url,
      repository: item.repository?.full_name
    }))
  };
}
