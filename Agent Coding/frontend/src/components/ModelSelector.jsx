import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
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

export default function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const t = useTranslation()
  const {
    activeProvider, activeModel, providers,
    selectProvider, selectModel, getModelsForProvider,
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
    return { pid, pdef, models: filtered }
  }).filter(p => p.models.length > 0 || !search)

  const isProviderConnected = (pid) => {
    const p = providers[pid]
    if (!p) return false
    if (pid === 'ollama' || pid === 'lmstudio') return p.connected
    return p.connected || (p.apiKey && p.apiKey.length > 5)
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
              placeholder="Tìm model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className={`free-toggle ${showFreeOnly ? 'active' : ''}`}
              onClick={toggleFreeFilter}
              title="Chỉ hiện model miễn phí"
            >
              Free
            </button>
          </div>

          <div className="model-list">
            {filteredProviders.map(({ pid, pdef, models }) => {
              const connected = isProviderConnected(pid)
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
                  {models.length === 0 && (
                    <div className="no-models" style={{fontSize: '11px', lineHeight: '1.3'}}>
                      <div>{t('noModelsInSettings')}</div>
                      {pid !== 'openrouter' && pid !== 'ollama' && pid !== 'lmstudio' && (
                        <div style={{marginTop: 2}}>{t('noApiKeyConfigured')}</div>
                      )}
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
