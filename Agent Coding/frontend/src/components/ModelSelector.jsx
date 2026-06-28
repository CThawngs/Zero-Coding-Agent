import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Check, X } from 'lucide-react'
import useProviderStore, { PROVIDER_MODELS } from '../stores/providerStore'
import { useTranslation } from '../utils/translations'
import './ModelSelector.css'

const PROVIDER_ICONS = {
  google: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini-color.svg',
  openai: '/openai.png',
  anthropic: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude-color.svg',
  openrouter: '/openrouter.png',
  ollama: '/ollama.png',
  lmstudio: '/lmstudio.png',
  custom: null,
  '9router': '/nine-router.png',
}

// Providers with dynamic/empty models where user must type model name
const DYNAMIC_MODEL_PROVIDERS = ['openrouter', '9router', 'custom', 'ollama', 'lmstudio']

export default function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newModelInputs, setNewModelInputs] = useState({}) // { providerId: 'model-name' }
  const ref = useRef(null)
  const t = useTranslation()
  const {
    activeProvider, activeModel, providers,
    selectProvider, selectModel, getModelsForProvider,
    addCustomModel,
    showFreeOnly, toggleFreeFilter, isModelFree
  } = useProviderStore()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const providerList = Object.entries(PROVIDER_MODELS)

  const getModelLabel = () => {
    if (!activeProvider || !activeModel) return t('selectModelText')
    const icon = PROVIDER_ICONS[activeProvider]
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {icon ? (
          <img src={icon} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
        ) : null}
        {activeModel}
      </span>
    )
  }

  const filteredProviders = providerList.map(([pid, pdef]) => {
    const models = getModelsForProvider(pid)
    const filtered = models.filter(m => {
      const matchSearch = !search || m.id.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase())
      const matchFree = !showFreeOnly || isModelFree(m)
      return matchSearch && matchFree
    })
    return { pid, pdef, models: filtered, totalModels: models.length }
  }).filter(p => p.models.length > 0 || !search || DYNAMIC_MODEL_PROVIDERS.includes(p.pid))

  const isProviderConnected = (pid) => {
    const p = providers[pid]
    if (!p) return false
    if (pid === 'ollama' || pid === 'lmstudio') return p.connected
    return p.connected || (p.apiKey && p.apiKey.length > 5)
  }

  const handleAddModelInline = (pid) => {
    const modelName = (newModelInputs[pid] || '').trim()
    if (!modelName) return
    addCustomModel(pid, modelName)
    selectProvider(pid)
    selectModel(modelName)
    setNewModelInputs(prev => ({ ...prev, [pid]: '' }))
    setOpen(false)
  }

  return (
    <div className="model-selector" ref={ref}>
      <button className="model-selector-btn" onClick={() => setOpen(v => !v)}>
        <span className="model-label">{getModelLabel()}</span>
        <ChevronDown size={14} className={`chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="model-dropdown">
          <div className="model-search-row">
            <input
              autoFocus
              className="model-search"
              placeholder={t('searchModel') || 'Search model...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className={`free-toggle ${showFreeOnly ? 'active' : ''}`}
              onClick={toggleFreeFilter}
              title="Show free models only"
            >
              Free
            </button>
          </div>

          <div className="model-list">
            {filteredProviders.map(({ pid, pdef, models, totalModels }) => {
              const connected = isProviderConnected(pid)
              const isDynamic = DYNAMIC_MODEL_PROVIDERS.includes(pid)
              const showAddModel = connected && (isDynamic || models.length === 0)

              return (
                <div key={pid} className="provider-group">
                  <div className="provider-group-header">
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {PROVIDER_ICONS[pid] ? (
                        <img src={PROVIDER_ICONS[pid]} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                      ) : null}
                      {pdef.name}
                    </span>
                    {!connected && <span className="not-connected">Not configured</span>}
                  </div>

                  {/* Existing model buttons */}
                  {models.map(m => (
                    <button
                      key={m.id}
                      className={`model-item ${activeProvider === pid && activeModel === m.id ? 'active' : ''} ${!connected ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!connected) return
                        selectProvider(pid)
                        selectModel(m.id)
                        setOpen(false)
                      }}
                    >
                      <div className="model-item-main">
                        <span className="model-item-name">{m.name || m.id}</span>
                        {m.free && <span className="model-free-badge">Free</span>}
                        {m.size && <span className="model-size">{m.size}</span>}
                      </div>
                      {m.contextWindow && (
                        <span className="model-ctx">
                          {m.contextWindow >= 1000000
                            ? `${(m.contextWindow / 1000000).toFixed(1)}M ctx`
                            : `${Math.round(m.contextWindow / 1000)}K ctx`}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Inline "Add model" input for dynamic providers */}
                  {showAddModel && (
                    <div className="add-model-inline" style={{
                      display: 'flex', gap: '4px', padding: '4px 12px',
                      alignItems: 'center'
                    }}>
                      <Plus size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="settings-input"
                        placeholder={t('addModelPlaceholder') || 'Type model name (e.g. gpt-4o)'}
                        value={newModelInputs[pid] || ''}
                        onChange={e => setNewModelInputs(prev => ({ ...prev, [pid]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddModelInline(pid)
                          if (e.key === 'Escape') setNewModelInputs(prev => ({ ...prev, [pid]: '' }))
                        }}
                        style={{ flex: 1, fontSize: '11px', padding: '2px 6px', height: '22px', minWidth: 0 }}
                      />
                      {(newModelInputs[pid] || '').trim() && (
                        <button
                          className="icon-btn icon-btn-sm"
                          onMouseDown={e => { e.preventDefault(); handleAddModelInline(pid) }}
                          style={{ flexShrink: 0 }}
                          title="Add & select model"
                        >
                          <Check size={12} style={{ color: 'var(--success)' }} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* No models message for non-dynamic providers */}
                  {models.length === 0 && !showAddModel && !connected && (
                    <div className="no-models" style={{fontSize: '11px', lineHeight: '1.3'}}>
                      <div>{t('noApiKeyConfigured') || 'API key not configured'}</div>
                    </div>
                  )}
                  {models.length === 0 && !showAddModel && connected && (
                    <div className="no-models" style={{fontSize: '11px', lineHeight: '1.3'}}>
                      <div>{t('noModelsInSettings') || 'Add model in Settings'}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
