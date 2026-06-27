import { v4 as uuidv4 } from 'uuid';

// In-memory store for tools awaiting user approval (HITL)
const pendingTools = new Map();

export function addPendingTool(toolCall, conversationId) {
  const id = uuidv4();
  pendingTools.set(id, {
    id,
    toolCall, // contains: { tool, params, id: originalToolCallId }
    conversationId,
    status: 'pending',
    createdAt: Date.now(),
  });
  return id;
}

export function getPendingTool(id) {
  return pendingTools.get(id) || null;
}

export function approvePendingTool(id) {
  const item = pendingTools.get(id);
  if (!item) return null;
  item.status = 'approved';
  pendingTools.delete(id);
  return item;
}

export function rejectPendingTool(id) {
  const item = pendingTools.get(id);
  if (!item) return null;
  item.status = 'rejected';
  pendingTools.delete(id);
  return item;
}

export function listPendingTools(conversationId) {
  return Array.from(pendingTools.values()).filter(t => t.conversationId === conversationId);
}

export default {
  addPendingTool,
  getPendingTool,
  approvePendingTool,
  rejectPendingTool,
  listPendingTools,
};
