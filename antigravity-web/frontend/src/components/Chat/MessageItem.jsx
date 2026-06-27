import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check, ChevronDown, ChevronRight, FileText, Terminal, Globe, Folder } from 'lucide-react'
import { format } from 'date-fns'
import './MessageItem.css'

function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={`copy-btn ${small ? 'copy-btn-sm' : ''}`} onClick={handleCopy} title="Copy">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function ToolCallBlock({ toolCall }) {
  const [expanded, setExpanded] = useState(false)

  const toolIcons = {
    read_file: <FileText size={14} />,
    write_file: <FileText size={14} />,
    create_file: <FileText size={14} />,
    delete_file: <FileText size={14} />,
    list_directory: <Folder size={14} />,
    create_directory: <Folder size={14} />,
    search_files: <Folder size={14} />,
    run_terminal_command: <Terminal size={14} />,
    fetch_url: <Globe size={14} />,
    read_github_repo: <Globe size={14} />,
  }

  const toolName = toolCall.tool || toolCall.name || 'unknown'
  const params = toolCall.params || toolCall.arguments || {}
  const result = toolCall.result
  const hasError = result?.error || toolCall.error

  return (
    <div className={`tool-call-block ${hasError ? 'tool-call-error' : 'tool-call-success'}`}>
      <button className="tool-call-header" onClick={() => setExpanded(v => !v)}>
        <div className="tool-call-icon">{toolIcons[toolName] || <Terminal size={14} />}</div>
        <span className="tool-call-name">{toolName.replace(/_/g, ' ')}</span>
        {params.path && <span className="tool-call-path">{params.path}</span>}
        {params.command && <span className="tool-call-path">{params.command}</span>}
        <div className="tool-call-status">
          {hasError ? <span className="badge badge-error">Error</span> : <span className="badge badge-success">Done</span>}
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {expanded && (
        <div className="tool-call-body">
          {Object.keys(params).length > 0 && (
            <div className="tool-call-section">
              <div className="tool-call-section-label">Params</div>
              <pre className="tool-call-code">{JSON.stringify(params, null, 2)}</pre>
            </div>
          )}
          {result && (
            <div className="tool-call-section">
              <div className="tool-call-section-label">Result</div>
              <pre className="tool-call-code">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CodeBlock({ children, className }) {
  const code = String(children).replace(/\n$/, '')
  const language = className?.replace('language-', '') || 'text'

  if (language === 'tool_call') {
    try {
      const parsed = JSON.parse(code)
      return <ToolCallBlock toolCall={parsed} />
    } catch {}
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{language}</span>
        <CopyButton text={code} small />
      </div>
      <pre className="code-block-pre">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

const markdownComponents = {
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return <code className="inline-code" {...props}>{children}</code>
    }
    return <CodeBlock className={className}>{children}</CodeBlock>
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="md-link">{children}</a>
  ),
  table: ({ children }) => (
    <div className="table-wrapper"><table className="md-table">{children}</table></div>
  ),
}

export default function MessageItem({ message, isStreaming, streamingContent }) {
  const isUser = message.role === 'user'
  const content = isStreaming ? streamingContent : message.content
  const toolCalls = message.toolCalls || []

  return (
    <div className={`message-item ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '⚡'}
      </div>
      <div className="message-content-wrap">
        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((att, i) => (
              <div key={i} className="attachment-chip">
                {att.type === 'file' && <FileText size={12} />}
                {att.type === 'folder' && <Folder size={12} />}
                {att.type === 'url' && <Globe size={12} />}
                {att.type === 'github' && <Globe size={12} />}
                <span>{att.name || att.path || att.url}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
          {isUser ? (
            <div className="message-text">{content}</div>
          ) : (!content && isStreaming) ? (
            <div className="thinking-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
              <span className="thinking-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: 'thinkingPulse 1.4s infinite ease-in-out both' }}></span>
              <span className="thinking-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'inline-block', animation: 'thinkingPulse 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
              <span className="thinking-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: 'thinkingPulse 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: 500 }}>
                Zero Coding Agent is thinking...
              </span>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes thinkingPulse {
                  0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; }
                  40% { transform: scale(1); opacity: 1; }
                }
              `}} />
            </div>
          ) : (
            <div className="message-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {content || ''}
              </ReactMarkdown>
              {isStreaming && <span className="typing-cursor">▋</span>}
            </div>
          )}
        </div>

        {/* Tool calls */}
        {toolCalls.length > 0 && (
          <div className="message-tool-calls">
            {toolCalls.map((tc, i) => (
              <ToolCallBlock key={i} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="message-footer">
          {message.timestamp && (
            <span className="message-time">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          )}
          {!isUser && content && <CopyButton text={content} small />}
          {message.error && <span className="badge badge-error">Error</span>}
        </div>
      </div>
    </div>
  )
}
