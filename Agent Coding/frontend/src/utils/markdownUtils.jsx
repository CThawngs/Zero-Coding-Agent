import React from 'react'
import { Copy, Check } from 'lucide-react'

// ============================================================
// Custom react-markdown components
// ============================================================

// Code block with copy button and language badge
function CodeBlock({ language, children, ...props }) {
  const [copied, setCopied] = React.useState(false)
  const codeText = typeof children === 'string'
    ? children
    : Array.isArray(children) ? children.join('') : String(children || '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }

  return (
    <div className="code-block" style={{ marginBottom: '0.8em' }}>
      <div className="code-block-header">
        <span className="code-block-lang">{language || 'code'}</span>
        <button
          onClick={copy}
          className="btn btn-ghost btn-icon"
          style={{ width: 28, height: 28, borderRadius: 6, gap: 0 }}
          title="Copy code"
        >
          {copied
            ? <Check size={13} style={{ color: 'var(--success)' }} />
            : <Copy size={13} />
          }
        </button>
      </div>
      <pre {...props}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

// Custom components map for react-markdown
export const markdownComponents = {
  // Code handling
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''

    if (!inline && (match || String(children || '').includes('\n'))) {
      return <CodeBlock language={language} {...props}>{children}</CodeBlock>
    }
    // Inline code
    return <code {...props}>{children}</code>
  },

  // Paragraphs
  p({ children }) {
    return <p style={{ margin: '0.5em 0' }}>{children}</p>
  },

  // Links - open in new tab
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </a>
    )
  },

  // Headings with anchor links
  h1({ children }) { return <h1 style={{ marginTop: '1em', marginBottom: '0.4em' }}>{children}</h1> },
  h2({ children }) { return <h2 style={{ marginTop: '0.9em', marginBottom: '0.3em' }}>{children}</h2> },
  h3({ children }) { return <h3 style={{ marginTop: '0.8em', marginBottom: '0.25em' }}>{children}</h3> },

  // Ordered / Unordered lists
  ul({ children }) {
    return <ul style={{ paddingLeft: '1.4em', margin: '0.5em 0' }}>{children}</ul>
  },
  ol({ children }) {
    return <ol style={{ paddingLeft: '1.4em', margin: '0.5em 0' }}>{children}</ol>
  },

  // Blockquote
  blockquote({ children }) {
    return (
      <blockquote style={{
        borderLeft: '3px solid var(--accent-primary)',
        paddingLeft: '1em',
        margin: '0.8em 0',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        background: 'var(--accent-glow)',
        borderRadius: '0 6px 6px 0',
        padding: '0.5em 1em',
      }}>
        {children}
      </blockquote>
    )
  },

  // Table
  table({ children }) {
    return (
      <div style={{ overflowX: 'auto', margin: '0.8em 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>{children}</table>
      </div>
    )
  },
  th({ children }) {
    return (
      <th style={{
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        textAlign: 'left',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        fontSize: '13px',
      }}>
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td style={{
        padding: '8px 12px',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '13px',
      }}>
        {children}
      </td>
    )
  },
}

export default markdownComponents
