import React from 'react'
import { ShieldAlert, Zap, AlertTriangle, ShieldCheck } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'

export default function PermissionModal({ conversationId }) {
  const language = useSettingsStore(state => state.language)
  const updateConversation = useChatStore(state => state.updateConversation)
  const t = useTranslation(language)

  const handleSelectMode = (mode) => {
    updateConversation(conversationId, { permissionMode: mode })
  }

  const isVi = language === 'vi'

  const modes = [
    {
      id: 'strict',
      title: isVi ? 'Chế độ Kiểm soát (100%)' : 'Strict Control Mode (100%)',
      desc: isVi 
        ? 'Mọi thay đổi (ghi, tạo, xóa file và chạy lệnh Terminal) đều cần sự đồng ý của bạn.' 
        : 'Every single change (writing, creating, deleting files and executing terminal commands) requires your explicit approval.',
      icon: <ShieldCheck className="mode-icon" size={24} style={{ color: 'var(--success)' }} />,
      badge: isVi ? 'An toàn nhất' : 'Most Secure',
      badgeClass: 'badge-success'
    },
    {
      id: 'balanced',
      title: isVi ? 'Chế độ Cân bằng (50% - Mặc định)' : 'Balanced Mode (50% - Default)',
      desc: isVi 
        ? 'Tự động thực hiện các thao tác file (đọc/ghi), nhưng các lệnh Terminal bắt buộc phải được phê duyệt.' 
        : 'Automatically performs file operations (reads/writes), but executing terminal commands requires your approval.',
      icon: <AlertTriangle className="mode-icon" size={24} style={{ color: 'var(--warning)' }} />,
      badge: isVi ? 'Khuyên dùng' : 'Recommended',
      badgeClass: 'badge-warning'
    },
    {
      id: 'autonomous',
      title: isVi ? 'Chế độ Tự trị (0% - Tự động)' : 'Autonomous Mode (0% - Full Auto)',
      desc: isVi 
        ? 'AI Agent toàn quyền quyết định và tự động chạy tất cả thao tác trực tiếp trên ổ đĩa của bạn.' 
        : 'AI Agent has full authority and automatically executes all actions directly on your disk.',
      icon: <Zap className="mode-icon" size={24} style={{ color: 'var(--accent-primary)' }} />,
      badge: isVi ? 'Tốc độ nhanh nhất' : 'Fastest Speed',
      badgeClass: 'badge-danger'
    }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backdropFilter: 'blur(16px)',
      background: 'rgba(5, 5, 8, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: '#13141a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        width: '640px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'slideUp 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '12px', 
            borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.2)',
            marginBottom: '16px'
          }}>
            <ShieldAlert size={32} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
            {isVi ? 'Chọn chế độ quyền của AI Agent' : 'Select AI Agent Permission Mode'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
            {isVi 
              ? 'Xác định mức độ kiểm soát của bạn đối với các thay đổi ổ đĩa và terminal thực hiện bởi AI Agent.' 
              : 'Choose how much control you want to retain over disk modifications and terminal commands executed by the AI Agent.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '12px' }}>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className="setup-provider-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                textAlign: 'left',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid var(--accent-primary)'
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid var(--border)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ 
                padding: '8px', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px'
              }}>
                {mode.icon}
              </div>
              <div style={{ flex: 1, paddingRight: '80px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {mode.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {mode.desc}
                </p>
              </div>
              <span className={`badge ${mode.badgeClass}`} style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px',
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {mode.badge}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
