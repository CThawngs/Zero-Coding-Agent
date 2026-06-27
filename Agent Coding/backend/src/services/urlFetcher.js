const TIMEOUT_MS = 30000;

// Simple HTML to text extractor
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract title from HTML
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : 'Unknown';
}

// ============================================================
// FETCH URL
// ============================================================
export async function fetchUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Antigravity-Web/1.0 (AI Coding Agent)',
        'Accept': 'text/html,application/json,text/plain,*/*'
      },
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    
    let title = url;
    let content = rawText;
    
    if (contentType.includes('text/html')) {
      title = extractTitle(rawText);
      content = htmlToText(rawText);
      // Truncate to reasonable length
      if (content.length > 50000) {
        content = content.slice(0, 50000) + '\n\n[Content truncated - too long]';
      }
    } else if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(rawText);
        content = JSON.stringify(parsed, null, 2);
      } catch { content = rawText; }
    }
    
    return {
      url,
      title,
      content,
      contentType,
      length: content.length
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s: ${url}`);
    }
    throw err;
  }
}
