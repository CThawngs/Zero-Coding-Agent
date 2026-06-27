import { promises as fs, existsSync } from 'fs';
import { join, resolve } from 'path';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = resolve(process.env.DATA_DIR || './data');
const CONVERSATIONS_DIR = join(DATA_DIR, 'conversations');

// Ensure dir exists
async function ensureDir() {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
}

// Generate title from message content
function generateTitle(content) {
  if (!content) return 'New Chat';
  const text = content.slice(0, 80).replace(/\n/g, ' ').trim();
  return text.length < content.length ? text + '...' : text;
}

// ============================================================
// CREATE CONVERSATION
// ============================================================
export async function createConversation(data = {}) {
  await ensureDir();
  
  const id = uuid();
  const now = new Date().toISOString();
  
  const conversation = {
    id,
    title: data.title || 'New Chat',
    provider: data.provider || null,
    model: data.model || null,
    contextWindow: data.contextWindow || 'auto',
    workspace: data.workspace || null,
    messages: [],
    attachments: [],
    createdAt: now,
    updatedAt: now
  };
  
  const filePath = join(CONVERSATIONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
  
  return conversation;
}

// ============================================================
// GET CONVERSATION
// ============================================================
export async function getConversation(id) {
  const filePath = join(CONVERSATIONS_DIR, `${id}.json`);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

// ============================================================
// UPDATE CONVERSATION
// ============================================================
export async function updateConversation(id, updates) {
  const conversation = await getConversation(id);
  if (!conversation) throw new Error(`Conversation not found: ${id}`);
  
  const updated = {
    ...conversation,
    ...updates,
    id, // preserve id
    updatedAt: new Date().toISOString()
  };
  
  const filePath = join(CONVERSATIONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  
  return updated;
}

// ============================================================
// DELETE CONVERSATION
// ============================================================
export async function deleteConversation(id) {
  const filePath = join(CONVERSATIONS_DIR, `${id}.json`);
  
  if (!existsSync(filePath)) {
    throw new Error(`Conversation not found: ${id}`);
  }
  
  await fs.unlink(filePath);
  return { success: true, id };
}

// ============================================================
// LIST CONVERSATIONS
// ============================================================
export async function listConversations() {
  await ensureDir();
  
  let files;
  try {
    files = await fs.readdir(CONVERSATIONS_DIR);
  } catch {
    return [];
  }
  
  const conversations = [];
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    try {
      const raw = await fs.readFile(join(CONVERSATIONS_DIR, file), 'utf-8');
      const conv = JSON.parse(raw);
      // Return summary (without full messages array)
      conversations.push({
        id: conv.id,
        title: conv.title,
        provider: conv.provider,
        model: conv.model,
        workspace: conv.workspace || null,
        permissionMode: conv.permissionMode || 'balanced',
        messageCount: conv.messages?.length || 0,
        lastMessage: conv.messages?.length > 0 
          ? conv.messages[conv.messages.length - 1]?.content?.slice(0, 100) 
          : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      });
    } catch (err) {
      console.warn(`[ConvStore] Failed to read ${file}:`, err.message);
    }
  }
  
  // Sort by updatedAt desc
  return conversations.sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

// ============================================================
// ADD MESSAGE
// ============================================================
export async function addMessage(conversationId, message) {
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error(`Conversation not found: ${conversationId}`);
  
  const msg = {
    id: uuid(),
    role: message.role,
    content: message.content,
    toolCalls: message.toolCalls || [],
    toolResults: message.toolResults || [],
    attachments: message.attachments || [],
    provider: message.provider,
    model: message.model,
    usage: message.usage || null,
    timestamp: new Date().toISOString()
  };
  
  conversation.messages.push(msg);
  
  // Auto-generate title from first user message
  if (conversation.messages.length === 1 && msg.role === 'user' && conversation.title === 'New Chat') {
    conversation.title = generateTitle(msg.content);
  }
  
  conversation.updatedAt = new Date().toISOString();
  
  const filePath = join(CONVERSATIONS_DIR, `${conversationId}.json`);
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
  
  return conversation;
}

// ============================================================
// CLEAR MESSAGES
// ============================================================
export async function clearMessages(conversationId) {
  return updateConversation(conversationId, { messages: [] });
}
