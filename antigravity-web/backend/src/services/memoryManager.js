import { promises as fs, existsSync } from 'fs';
import { resolve, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import skillsManager from './skillsManager.js';

const SKILLS_DIR = resolve('../../skills');
const PREF_SKILL_DIR = join(SKILLS_DIR, 'user-preferences');
const PREF_FILE_PATH = join(PREF_SKILL_DIR, 'SKILL.md');

// Keywords to trigger Hermes self-learning reflection
const PRAISE_KEYWORDS = [
  'cảm ơn', 'cam on', 'tốt lắm', 'tot lam', 'tuyệt vời', 'tuyet voi', 
  'good job', 'thanks', 'well done', 'chính xác', 'chinh xac', 'chuẩn', 'chuan',
  'perfect', 'yêu thích', 'yeu thich', 'ưng ý', 'ung y'
];

export async function checkAndLearnFromPraise(userMessage, conversationHistory) {
  if (!userMessage) return;

  const msgLower = userMessage.toLowerCase();
  const containsPraise = PRAISE_KEYWORDS.some(keyword => msgLower.includes(keyword));

  if (!containsPraise) return;

  console.log('[Hermes Memory] Positive reinforcement detected! Activating self-reflection...');

  // Get API key for reflection (prefer Google Gemini key since it's the main local provider)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('[Hermes Memory] No API Key found for extraction. Skipping self-reflection.');
    return;
  }

  // Gather last few messages for context (max 10 messages)
  const recentHistory = conversationHistory.slice(-10);
  const formattedHistory = recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

  const prompt = `
Bạn là Trợ lý phân tích ký ức hệ thống. Hãy đọc lịch sử cuộc trò chuyện dưới đây giữa một AI Coding Agent và User:

[LỊCH SỬ HỘI THOẠI]
${formattedHistory}

[NHIỆM VỤ]
Hãy phân tích và trích xuất các thông tin sau dưới dạng danh sách gạch đầu dòng ngắn gọn bằng tiếng Việt:
1. Thói quen coding của người dùng (ví dụ: dùng npm thay vì yarn, dùng ES modules, viết Clean Code).
2. Quy định dự án đang phát triển (loại CSDL, thư viện nổi bật, cấu trúc thư mục).
3. Các chỉ dẫn đặc biệt hoặc sở thích của người dùng đối với AI.

[YÊU CẦU]
- Viết ngắn gọn, rõ ràng, thực tế.
- Bỏ qua các chi tiết thừa thãi.
- Chỉ đưa ra danh sách các gạch đầu dòng ký ức, không thêm bất kỳ văn bản chào hỏi hay kết luận nào.
  `;

  try {
    let extractedText = '';

    // Call Google Gemini as default if GOOGLE_API_KEY is set
    if (process.env.GOOGLE_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      extractedText = result.response.text();
    } else {
      // Fallback to OpenAI if configured
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      extractedText = res.choices[0]?.message?.content || '';
    }

    if (!extractedText.trim()) return;

    console.log('[Hermes Memory] Extracted preferences:\n', extractedText);

    // Ensure skills folder exists
    await fs.mkdir(PREF_SKILL_DIR, { recursive: true });

    let existingMemories = '';
    if (existsSync(PREF_FILE_PATH)) {
      const raw = await fs.readFile(PREF_FILE_PATH, 'utf-8');
      // strip yaml frontmatter to get body
      existingMemories = raw.replace(/^---[\s\S]*?---/, '').trim();
    }

    // Merge memories using a second quick prompt to avoid duplication and clutter
    const mergePrompt = `
Dưới đây là Ký ức cũ về người dùng:
${existingMemories || 'Chưa có ký ức cũ.'}

Dưới đây là Ký ức mới vừa trích xuất được:
${extractedText}

Nhiệm vụ: Hãy gộp hai danh sách ký ức trên thành một danh sách gạch đầu dòng duy nhất, đồng thời:
- Loại bỏ các dòng trùng lặp hoặc mâu thuẫn.
- Gom nhóm và sắp xếp logic.
- Giữ độ dài tối đa 15 dòng gạch đầu dòng.
- Chỉ trả về danh sách gạch đầu dòng ký ức, không nói gì thêm.
    `;

    let finalMemories = '';
    if (process.env.GOOGLE_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(mergePrompt);
      finalMemories = result.response.text();
    } else {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: mergePrompt }]
      });
      finalMemories = res.choices[0]?.message?.content || '';
    }

    // Write file back with proper frontmatter
    const skillContent = `---
name: user-preferences
description: Thông tin thói quen, quy chuẩn code, sở thích và thông tin ghi nhớ về người dùng Zero Coding Agent
---

# User Preferences & Learned Memories

Đây là ký ức tự động cập nhật về thói quen lập trình và chỉ dẫn của người dùng:
${finalMemories}
`;

    await fs.writeFile(PREF_FILE_PATH, skillContent, 'utf-8');
    console.log('[Hermes Memory] User preferences successfully saved and loaded into dynamic skills memory!');

    // Reload skills in memory immediately
    await skillsManager.loadSkills();

  } catch (err) {
    console.error('[Hermes Memory] Failed to perform self-learning reflection:', err.message);
  }
}

export default {
  checkAndLearnFromPraise
};
