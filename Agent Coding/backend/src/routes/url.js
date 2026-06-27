import express from 'express';
import * as urlFetcher from '../services/urlFetcher.js';

const router = express.Router();

// POST /api/url/fetch
router.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    
    const result = await urlFetcher.fetchUrl(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
