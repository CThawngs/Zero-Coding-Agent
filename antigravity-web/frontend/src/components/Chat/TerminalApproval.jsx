import React, { useState, useEffect } from 'react'
import { AlertTriangle, Check, X, Terminal } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'
import './TerminalApproval.css'

export default function TerminalApproval({ approval }) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [feedback, setFeedback] = useState('')
  const { approveCommand, rejectCommand } = useChatStore()
  const language = useSettingsStore(state => state.language)

  useEffect(() => {
    if (timeLeft <= 0) {
      rejectCommand(approval.id)
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const isVi = language === 'vi'
  const isTerminal = !approval.tool || approval.tool === 'run_terminal_command'

  return (
    <div className="terminal-approval" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '12px', background: 'rgba(245, 158, 11, 0.04)', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'borderGlow 3s ease-in-out infinite' }}>
      <div className="approval-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '8px' }}>
        <AlertTriangle size={16} className="approval-icon" style={{ color: 'var(--warning)' }} />
        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
          {isTerminal 
            ? (isVi ? 'Yêu cầu chạy lệnh terminal' : 'Terminal Command Approval') 
            : (isVi ? `Yêu cầu thao tác file (${approval.tool})` : `File Operation Approval (${approval.tool})`)}
        </span>
        <div className="approval-timer" style={{ fontSize: '12px', color: 'var(--warning)', marginLeft: 'auto' }}>
          {timeLeft}s
        </div>
      </div>
      
      {isTerminal ? (
        <div className="approval-command" style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
          <code>{approval.command || approval.params?.command || 'unknown command'}</code>
        </div>
      ) : (
        <div className="approval-command" style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
            📁 Path: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{approval.params?.path || 'unknown path'}</code>
          </div>
          {approval.params?.content && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                {isVi ? 'Nội dung ghi mới (bản xem trước):' : 'New Content Preview:'}
              </div>
              <pre style={{ 
                margin: 0, 
                padding: '6px', 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontFamily: 'var(--font-mono)', 
                overflowX: 'auto',
                maxHeight: '120px',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap'
              }}>
                {approval.params.content.slice(0, 250)}{approval.params.content.length > 250 ? '...' : ''}
              </pre>
            </div>
          )}
        </div>
      )}

      {isTerminal && approval.params?.cwd && (
        <div className="approval-cwd" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📁 {approval.params.cwd}</div>
      )}
      
      {/* Feedback input field for user's custom instruction */}
      <div className="approval-feedback-input" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>
          {isVi ? 'Ý kiến phản hồi / Chỉ dẫn khác:' : 'Feedback / Custom Instructions:'}
        </label>
        <input
          className="settings-input"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border)' }}
          placeholder={isVi ? "Ví dụ: Đổi sang npm install, không được xóa file..." : "e.g. Use yarn instead, don't modify this file..."}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
        />
      </div>

      <div className="approval-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => rejectCommand(approval.id, feedback)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <X size={14} /> {isVi ? 'Từ chối' : 'Reject'} {feedback.trim() ? (isVi ? '& Gửi chỉ dẫn' : '& Send Feedback') : ''}
        </button>
        <button 
          className="btn btn-success btn-sm" 
          onClick={() => approveCommand(approval.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--success)' }}
        >
          <Check size={14} /> {isVi ? 'Cho phép' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
