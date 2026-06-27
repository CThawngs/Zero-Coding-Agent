import React, { useState, useEffect } from 'react'
import { X, Key, Plus, Trash2, ExternalLink, RefreshCw, Eye, EyeOff } from 'lucide-react'
import useProviderStore, { PROVIDER_MODELS } from '../../stores/providerStore'
import useMcpStore from '../../stores/mcpStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import './SettingsModal.css'

const TABS = ['Providers', 'MCP', 'GitHub', 'Appearance', 'About']

const PROVIDER_ICONS = {
  google: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg',
  openai: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg',
  anthropic: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude.svg',
  openrouter: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openrouter.svg',
  ollama: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/ollama.svg',
  lmstudio: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lmstudio.svg',
  custom: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lobe.svg',
  '9router': 'https://9router.com/favicon.ico',
}

function ApiKeyInput({ providerId, label }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const { saveApiKey, providers } = useProviderStore()

  const existing = providers[providerId]?.apiKey
  const connected = providers[providerId]?.connected

  const handleSave = async () => {
    if (!value.trim()) return
    setSaving(true)
    setStatus(null)
    const ok = await saveApiKey(providerId, value)
    setSaving(false)
    setStatus(ok ? 'saved' : 'error')
    setTimeout(() => setStatus(null), 3000)
    if (ok) setValue('')
  }

  return (
    <div className="apikey-row">
      <div className="apikey-label">
        <span>{label}</span>
        {connected && <span className="status-dot connected" title="Connected" />}
        {!connected && existing && <span className="status-dot disconnected" title="Not verified" />}
      </div>
      <div className="apikey-input-row">
        <div className="input-with-toggle">
          <input
            type={show ? 'text' : 'password'}
            className="settings-input"
            placeholder={existing ? '••••••••••••' : 'Enter API key...'}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button className="toggle-btn" onClick={() => setShow(v => !v)}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          className={`btn-sm ${saving ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={saving || !value.trim()}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {status === 'saved' && <p className="status-msg success">✓ Saved & connected!</p>}
      {status === 'error' && <p className="status-msg error">✗ Connection failed. Check the key.</p>}
    </div>
  )
}

function ProviderSection({ pid }) {
  const pdef = PROVIDER_MODELS[pid]
  const { 
    providers, 
    addCustomModel, 
    removeCustomModel, 
    connectOllama, 
    connectLMStudio, 
    selectModel, 
    activeModel, 
    activeProvider, 
    selectProvider, 
    getModelsForProvider,
    updateProviderConfig
  } = useProviderStore()

  const provider = providers[pid]
  const isLocal = pid === 'ollama' || pid === 'lmstudio'
  const isCustom = pid === 'custom' || pid === '9router'
  const models = getModelsForProvider(pid)

  const [customModelInput, setCustomModelInput] = useState('')
  const [connecting, setConnecting] = useState(false)

  // Custom Provider state
  const [customName, setCustomName] = useState(provider?.customName || (pid === '9router' ? '9Router' : 'Custom Endpoint'))
  const [customBaseUrl, setCustomBaseUrl] = useState(provider?.baseUrl || (pid === '9router' ? 'http://localhost:20128/v1' : 'http://127.0.0.1:8000/v1'))
  const [customApiKey, setCustomApiKey] = useState(provider?.apiKey || '')
  const [saveStatus, setSaveStatus] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    if (pid === 'ollama') await connectOllama()
    if (pid === 'lmstudio') await connectLMStudio()
    setConnecting(false)
  }

  const handleSaveCustom = () => {
    updateProviderConfig(pid, {
      customName,
      baseUrl: customBaseUrl,
      apiKey: customApiKey,
      connected: true
    })
    setSaveStatus(true)
    setTimeout(() => setSaveStatus(false), 2000)
  }

  const handleAddModel = () => {
    if (customModelInput.trim()) {
      addCustomModel(pid, customModelInput.trim())
      setCustomModelInput('')
    }
  }

  return (
    <div className="provider-section">
      <div className="provider-header">
        <div className="provider-icon">
          {PROVIDER_ICONS[pid]?.startsWith('http') ? (
            <img src={PROVIDER_ICONS[pid]} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          ) : PROVIDER_ICONS[pid]}
        </div>
        <div className="provider-meta">
          <div className="provider-name">{isCustom ? customName : pdef.name}</div>
          <div className={`provider-status ${provider?.connected ? 'connected' : ''}`}>
            {provider?.connected ? '● Connected' : '○ Not connected'}
          </div>
        </div>
      </div>

      {/* API Key - for cloud providers except custom */}
      {!isLocal && !isCustom && (
        <ApiKeyInput providerId={pid} label="API Key" />
      )}

      {/* Custom Endpoint config */}
      {isCustom && (
        <div className="custom-provider-config" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '10px' }}>Name custom endpoint</label>
              <input
                type="text"
                className="settings-input"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Name custom endpoint"
              />
            </div>
            <div style={{ flex: 2 }}>
              <label className="input-label" style={{ fontSize: '10px' }}>Base URL</label>
              <input
                type="text"
                className="settings-input"
                value={customBaseUrl}
                onChange={e => setCustomBaseUrl(e.target.value)}
                placeholder="e.http://127.0.0.1:8000/v1"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '10px' }}>API Key (Optional)</label>
              <input
                type="password"
                className="settings-input"
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                placeholder="API Key (optional)"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveCustom} style={{ height: '32px' }}>
              Connect
            </button>
          </div>
          {saveStatus && <p className="status-msg success" style={{ margin: 0 }}>✓ Config saved & connected!</p>}
        </div>
      )}

      {/* Connect button - for local providers */}
      {isLocal && (
        <div className="local-connect">
          <div className="local-url">
            <span>Base URL: </span>
            <code>{pid === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'}</code>
          </div>
          <button
            className="btn-primary btn-sm"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : (provider?.connected ? 'Reconnect' : 'Connect')}
          </button>
          {provider?.connected && <span className="status-msg success">✓ Connected</span>}
        </div>
      )}

      {/* Models section with full CRUD for ALL providers */}
      <div className="provider-models">
        <div className="models-label">Models</div>
        
        {/* Model Input to Add New Models */}
        <div className="custom-model-input" style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <input
            className="settings-input"
            placeholder="Add model name (e.g. gpt-4o, gemini-2.0-flash)"
            value={customModelInput}
            onChange={e => setCustomModelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddModel()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddModel}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Models Chips list with Remove action */}
        {models.length > 0 ? (
          <div className="model-chips">
            {models.map(m => (
              <div 
                key={m.id} 
                className={`model-chip ${activeProvider === pid && activeModel === m.id ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '8px' }}
              >
                <span 
                  onClick={() => { selectProvider(pid); selectModel(m.id) }}
                  style={{ cursor: 'pointer' }}
                >
                  {m.name || m.id}
                </span>
                <button 
                  className="chip-remove" 
                  onClick={() => removeCustomModel(pid, m.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  title="Delete model"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>No models configured. Add one above.</p>
        )}
      </div>
    </div>
  )
}

function McpSection() {
  const { servers, isLoading, error, fetchServers, addServer, deleteServer } = useMcpStore()
  const [id, setId] = useState('')
  const [command, setCommand] = useState('')
  const [argsStr, setArgsStr] = useState('')
  const [transport, setTransport] = useState('stdio')
  const [expandedServer, setExpandedServer] = useState(null)

  useEffect(() => {
    fetchServers()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!id.trim() || !command.trim()) return
    
    const args = argsStr.split(',').map(a => a.trim()).filter(Boolean)
    const ok = await addServer(id.trim(), command.trim(), args, transport)
    if (ok) {
      setId('')
      setCommand('')
      setArgsStr('')
    }
  }

  return (
    <div className="mcp-settings">
      <div className="settings-section">
        <h3>Model Context Protocol (MCP) Servers</h3>
        <p className="settings-desc">
          Cấu hình các máy chủ MCP ngoài để tích hợp thêm các công cụ (tools) tự động cho AI Agent.
        </p>

        {error && <p className="status-msg error">Error: {error}</p>}

        <div className="mcp-servers-list">
          {Object.keys(servers).length === 0 ? (
            <p className="empty-msg">Chưa cấu hình máy chủ MCP nào.</p>
          ) : (
            Object.entries(servers).map(([sid, srv]) => (
              <div key={sid} className="mcp-server-card">
                <div className="mcp-server-header">
                  <div className="mcp-server-info">
                    <div className="mcp-server-title">
                      <span className={`status-dot ${srv.status}`} />
                      <strong>{sid}</strong>
                      <span className="mcp-server-badge">{srv.config.transport}</span>
                    </div>
                    <div className="mcp-server-cmd">
                      <code>{srv.config.command} {srv.config.args.join(' ')}</code>
                    </div>
                  </div>
                  <div className="mcp-server-actions">
                    <button 
                      className="btn-sm btn-ghost" 
                      onClick={() => setExpandedServer(expandedServer === sid ? null : sid)}
                    >
                      {expandedServer === sid ? 'Hide Tools' : `Show Tools (${srv.toolsCount})`}
                    </button>
                    <button className="icon-btn danger" onClick={() => deleteServer(sid)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expandedServer === sid && (
                  <div className="mcp-server-tools">
                    {srv.tools.length === 0 ? (
                      <p className="empty-msg">Không có công cụ nào được export.</p>
                    ) : (
                      srv.tools.map(t => (
                        <div key={t.name} className="mcp-tool-item">
                          <div className="mcp-tool-name">🛠️ {t.name}</div>
                          <div className="mcp-tool-desc">{t.description || 'Không có mô tả'}</div>
                          <details className="mcp-tool-schema">
                            <summary>Schema Tham Số</summary>
                            <pre>{JSON.stringify(t.inputSchema, null, 2)}</pre>
                          </details>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="add-mcp-form">
          <h4>Thêm máy chủ MCP mới</h4>
          <div className="form-group">
            <label>Tên / ID Server</label>
            <input 
              type="text" 
              className="settings-input" 
              placeholder="e.g. google-developer-knowledge" 
              value={id}
              onChange={e => setId(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Lệnh chạy (Command)</label>
              <input 
                type="text" 
                className="settings-input" 
                placeholder="e.g. npx" 
                value={command}
                onChange={e => setCommand(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Transport</label>
              <select 
                className="settings-input" 
                value={transport}
                onChange={e => setTransport(e.target.value)}
              >
                <option value="stdio">stdio (Cục bộ)</option>
                <option value="sse">SSE (Từ xa)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tham số (Arguments - cách nhau bằng dấu phẩy)</label>
            <input 
              type="text" 
              className="settings-input" 
              placeholder="e.g. -y, @google/mcp-server-developer-knowledge" 
              value={argsStr}
              onChange={e => setArgsStr(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Đang thêm...' : 'Thêm Server'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme, language, setLanguage } = useSettingsStore()
  const t = useTranslation(language)

  return (
    <div className="appearance-settings">
      <div className="settings-section">
        <h3>{t('languageLabel')}</h3>
        <div className="setting-control" style={{ marginBottom: '24px' }}>
          <select 
            className="settings-input" 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            style={{ width: '200px', cursor: 'pointer' }}
          >
            <option value="vi">{t('langVi')}</option>
            <option value="en">{t('langEn')}</option>
          </select>
        </div>

        <h3>{t('themeLabel')}</h3>
        <div className="setting-control">
          <select 
            className="settings-input" 
            value={theme} 
            onChange={e => setTheme(e.target.value)}
            style={{ width: '200px', cursor: 'pointer' }}
          >
            <option value="dark">{t('themeDark')}</option>
            <option value="light">{t('themeLight')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('Providers')
  const [ghToken, setGhToken] = useState('')
  const [ghSaved, setGhSaved] = useState(false)

  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)

  const handleGhSave = () => {
    localStorage.setItem('github_token', ghToken)
    setGhSaved(true)
    setTimeout(() => setGhSaved(false), 2000)
  }

  const translatedTabs = {
    Providers: t('tabProviders'),
    MCP: t('tabMcp'),
    GitHub: t('tabGithub'),
    Appearance: t('tabAppearance'),
    About: t('tabAbout')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-title-icon">⚙️</span>
            {t('settingsTitle')}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {TABS.map(tKey => (
            <button
              key={tKey}
              className={`modal-tab ${tab === tKey ? 'active' : ''}`}
              onClick={() => setTab(tKey)}
            >
              {translatedTabs[tKey]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="modal-content">
          {tab === 'Providers' && (
            <div className="providers-list">
              {Object.keys(PROVIDER_MODELS).map(pid => (
                <ProviderSection key={pid} pid={pid} />
              ))}
            </div>
          )}

          {tab === 'MCP' && (
            <McpSection />
          )}

          {tab === 'GitHub' && (
            <div className="github-settings">
              <div className="settings-section">
                <h3>GitHub Personal Access Token</h3>
                <p className="settings-desc">
                  Dùng để đọc private repositories và tăng rate limit.<br />
                  Token cần có quyền: <code>repo</code>, <code>read:user</code>
                </p>
                <div className="apikey-input-row">
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={ghToken}
                    onChange={e => setGhToken(e.target.value)}
                  />
                  <button className="btn-primary btn-sm" onClick={handleGhSave}>Save</button>
                </div>
                {ghSaved && <p className="status-msg success">✓ Saved!</p>}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="settings-link"
                >
                  <ExternalLink size={13} /> Create token on GitHub
                </a>
              </div>
            </div>
          )}

          {tab === 'Appearance' && (
            <AppearanceSection />
          )}

          {tab === 'About' && (
            <div className="about-tab">
              <div className="about-logo">
                <div className="about-icon">⚡</div>
                <h2 className="gradient-text">Zero Coding Agent</h2>
                <p>AI Coding Agent · Localhost Edition</p>
              </div>
              <div className="about-info">
                <div className="info-row"><span>Version</span><span>1.0.0</span></div>
                <div className="info-row"><span>Backend</span><span>http://localhost:3747</span></div>
                <div className="info-row"><span>Frontend</span><span>http://localhost:5743</span></div>
                <div className="info-row"><span>Providers</span><span>Google, OpenAI, Anthropic, OpenRouter, Ollama, LM Studio, 9Router</span></div>
              </div>
              <div className="about-features">
                <div className="feature-item">📁 Full filesystem access</div>
                <div className="feature-item">🔀 Multi-provider LLM support</div>
                <div className="feature-item">🐙 GitHub integration</div>
                <div className="feature-item">💻 Terminal command execution</div>
                <div className="feature-item">🔄 Real-time streaming</div>
                <div className="feature-item">📝 CodeMirror 6 editor</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
