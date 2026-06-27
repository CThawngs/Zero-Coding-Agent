import express from 'express';
import * as githubReader from '../services/githubReader.js';

const router = express.Router();

// GET /api/github/repo?url=X&token=Y
router.get('/repo', async (req, res) => {
  try {
    const { url, token } = req.query;
    if (!url) return res.status(400).json({ error: 'url is required' });
    
    const result = await githubReader.readRepo(url, token || process.env.GITHUB_TOKEN);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/github/file?owner=X&repo=Y&path=Z&token=W
router.get('/file', async (req, res) => {
  try {
    const { owner, repo, path, token, branch } = req.query;
    if (!owner || !repo || !path) return res.status(400).json({ error: 'owner, repo, and path are required' });
    
    const result = await githubReader.readFile(owner, repo, path, token || process.env.GITHUB_TOKEN, branch);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/github/search
router.post('/search', async (req, res) => {
  try {
    const { owner, repo, query, token } = req.body;
    if (!owner || !repo || !query) return res.status(400).json({ error: 'owner, repo, and query are required' });
    
    const result = await githubReader.searchCode(owner, repo, query, token || process.env.GITHUB_TOKEN);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/github/verify - verify GitHub token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }
    });
    
    if (!response.ok) {
      return res.json({ success: false, valid: false, error: 'Invalid token' });
    }
    
    const user = await response.json();
    res.json({ success: true, valid: true, login: user.login, name: user.name });
  } catch (err) {
    res.json({ success: false, valid: false, error: err.message });
  }
});

export default router;
