import { v4 as uuidv4 } from 'uuid';

// In-memory store for active streams (for stop functionality)
const activeStreams = new Map();

export function registerStream(conversationId, abortController) {
  const existing = activeStreams.get(conversationId);
  if (existing) {
    existing.abort();
  }
  activeStreams.set(conversationId, {
    abortController,
    startTime: Date.now(),
  });
}

export function stopStream(conversationId) {
  const entry = activeStreams.get(conversationId);
  if (entry) {
    entry.abortController.abort();
    activeStreams.delete(conversationId);
    return true;
  }
  return false;
}

export function unregisterStream(conversationId) {
  activeStreams.delete(conversationId);
}

export function isStreamActive(conversationId) {
  return activeStreams.has(conversationId);
}

export default {
  registerStream,
  stopStream,
  unregisterStream,
  isStreamActive,
};
