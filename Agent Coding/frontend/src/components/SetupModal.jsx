import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'
import useProviderStore, { PROVIDER_MODELS } from '../stores/providerStore'
import { useTranslation } from '../utils/translations'
import './SetupModal.css'

const PROVIDER_IDS = ['google', 'openai', 'anthropic', 'openrouter', 'ollama', 'lmstudio', '9router', 'custom']

const PROVIDER_ICONS = {
  google: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini-color.svg',
  openai: '/openai.png',
  anthropic: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude-color.svg',
  openrouter: '/openrouter.png',
  ollama: '/ollama.png',
  lmstudio: '/lmstudio.png',
  '9router': '/nine-router.png',
  custom: null,
}

const PROVIDER_DESCRIPTIONS = {
  google: 'Gemini 2.0, 1.5 Pro & Flash',
  openai: 'GPT-4o, o1, o3, o4 models',
  anthropic: 'Claude Opus, Sonnet, Haiku',
  openrouter: 'Access 100+ models via one key',
  ollama: 'Run models locally (free)',
  lmstudio: 'Local models with GUI (free)',
  '9router': 'Smart proxy and local AI gateway',
  custom: 'Self-hosted or custom compatible endpoint',
}

export default function SetupModal({ onComplete }) {
  const [step, setStep] = useState(0)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [customName, setCustomName] = useState('Custom Endpoint')
  const [baseUrl, setBaseUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const t = useTranslation()

  const { saveApiKey, connectOllama, connectLMStudio, selectProvider, selectModel, getModelsForProvider } = useProviderStore()

  useEffect(() => {
    if (selectedProvider === '9router') {
      setBaseUrl('http://localhost:20128/v1')
      setCustomName('9Router')
    } else if (selectedProvider === 'custom') {
      setBaseUrl('http://127.0.0.1:8000/v1')
      setCustomName('Custom Endpoint')
    }
  }, [selectedProvider])

  const isLocal = selectedProvider === 'ollama' || selectedProvider === 'lmstudio'

  const handleNext = async () => {
    if (step === 0) {
      // Provider selected
      setStep(1)
    } else if (step === 1) {
      // Save key / connect
      setSaving(true)
      const store = useProviderStore.getState()
      
      if (selectedProvider === 'custom' || selectedProvider === '9router') {
        store.updateProviderConfig(selectedProvider, {
          customName: selectedProvider === '9router' ? '9Router' : customName || 'Custom Endpoint',
          baseUrl: baseUrl || (selectedProvider === '9router' ? 'http://localhost:20128/v1' : 'http://127.0.0.1:8000/v1'),
          apiKey: apiKey || '',
          connected: true
        })
        if (apiKey.trim()) {
          await saveApiKey(selectedProvider, apiKey)
        }
      } else if (isLocal) {
        if (selectedProvider === 'ollama') await connectOllama()
        else await connectLMStudio()
      } else if (apiKey.trim()) {
        await saveApiKey(selectedProvider, apiKey)
      }
      setSaving(false)

      // Set default model
      const models = getModelsForProvider(selectedProvider)
      if (models.length > 0) {
        selectProvider(selectedProvider)
        selectModel(models[0].id)
      } else {
        // Fallback for custom model if empty
        const defaultModel = selectedProvider === '9router' ? '9router-model' : 'custom-model'
        store.addCustomModel(selectedProvider, defaultModel)
        selectProvider(selectedProvider)
        selectModel(defaultModel)
      }

      setDone(true)
      setTimeout(() => onComplete(), 1500)
    }
  }

  return (
    <div className="setup-overlay">
      <div className="setup-modal">
        {/* Logo */}
        <div className="setup-logo">
          <div className="setup-logo-icon">⚡</div>
          <h1 className="gradient-text">Zero Coding Agent</h1>
          <p>AI Coding Agent · Localhost</p>
        </div>

        {!done ? (
          <>
            {/* Step indicator */}
            <div className="setup-steps">
              <div className={`step-dot ${step >= 0 ? 'active' : ''}`} />
              <div className="step-line" />
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
            </div>

            {step === 0 && (
              <div className="setup-step">
                <h2>{t('chooseProvider')}</h2>
                <p className="setup-desc">{t('chooseDesc')}</p>
                <div className="provider-grid">
                  {PROVIDER_IDS.map(pid => (
                    <button
                      key={pid}
                      className={`provider-option ${selectedProvider === pid ? 'selected' : ''}`}
                      onClick={() => setSelectedProvider(pid)}
                    >
                      <div className="option-icon">
                        {PROVIDER_ICONS[pid] ? (
                          <img src={PROVIDER_ICONS[pid]} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {PROVIDER_MODELS[pid].name[0]}
                          </div>
                        )}
                      </div>
                      <div className="option-meta">
                        <div className="option-name">{PROVIDER_MODELS[pid].name}</div>
                        <div className="option-desc">{PROVIDER_DESCRIPTIONS[pid]}</div>
                      </div>
                      {selectedProvider === pid && <Check size={16} className="option-check" />}
                    </button>
                  ))}
                </div>
                <button
                  className="btn-primary setup-cta"
                  disabled={!selectedProvider}
                  onClick={handleNext}
                >
                  {t('continue')} <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 1 && selectedProvider && (
              <div className="setup-step">
                <div className="step-provider-header">
                  <span className="step-provider-icon">
                    {PROVIDER_ICONS[selectedProvider] ? (
                      <img src={PROVIDER_ICONS[selectedProvider]} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {PROVIDER_MODELS[selectedProvider].name[0]}
                      </div>
                    )}
                   </span>
                  <h2>Cấu hình {PROVIDER_MODELS[selectedProvider].name}</h2>
                </div>

                {isLocal ? (
                  <div className="local-setup">
                    <p className="setup-desc">
                      {selectedProvider === 'ollama'
                        ? 'Đảm bảo Ollama đang chạy tại http://localhost:11434'
                        : 'Đảm bảo LM Studio đang chạy tại http://localhost:1234'}
                    </p>
                    <div className="local-steps">
                      <div className="local-step">
                        <span className="step-num">1</span>
                        <span>{selectedProvider === 'ollama' ? 'Cài Ollama: brew install ollama' : 'Tải LM Studio tại lmstudio.ai'}</span>
                      </div>
                      <div className="local-step">
                        <span className="step-num">2</span>
                        <span>{selectedProvider === 'ollama' ? 'Chạy: ollama serve' : 'Bật Local Server trong LM Studio'}</span>
                      </div>
                      <div className="local-step">
                        <span className="step-num">3</span>
                        <span>Nhấn Connect bên dưới</span>
                      </div>
                    </div>
                  </div>
                ) : (selectedProvider === 'custom' || selectedProvider === '9router') ? (
                  <div className="custom-setup" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '16px' }}>
                    {selectedProvider === 'custom' && (
                      <div className="setup-input-group">
                        <label className="input-label" style={{ display: 'block', fontSize: '12px', marginBottom: '4px', textAlign: 'left' }}>Tên Custom Provider</label>
                        <input
                          type="text"
                          className="setup-input"
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          placeholder="Custom Endpoint"
                        />
                      </div>
                    )}
                    <div className="setup-input-group">
                      <label className="input-label" style={{ display: 'block', fontSize: '12px', marginBottom: '4px', textAlign: 'left' }}>Base URL (Endpoint)</label>
                      <input
                        type="text"
                        className="setup-input"
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                        placeholder={selectedProvider === '9router' ? 'http://localhost:20128/v1' : 'http://127.0.0.1:8000/v1'}
                      />
                    </div>
                    <div className="setup-input-group">
                      <label className="input-label" style={{ display: 'block', fontSize: '12px', marginBottom: '4px', textAlign: 'left' }}>API Key (Nếu có)</label>
                      <input
                        type="password"
                        className="setup-input"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="apikey-setup">
                    <p className="setup-desc">Nhập API key của bạn:</p>
                    <input
                      autoFocus
                      type="password"
                      className="setup-input"
                      placeholder={selectedProvider === 'openrouter' ? 'sk-or-...' : 'API key...'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNext()}
                    />
                  </div>
                )}

                <div className="setup-nav">
                  <button className="btn-ghost setup-back" onClick={() => setStep(0)}>
                    ← Back
                  </button>
                  <button
                    className="btn-primary setup-cta"
                    onClick={handleNext}
                    disabled={saving || (!isLocal && !(selectedProvider === 'custom' || selectedProvider === '9router') && !apiKey.trim())}
                  >
                    {saving ? 'Connecting...' : (isLocal ? 'Connect' : 'Save & Continue')}
                    {!saving && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button className="setup-skip" onClick={onComplete}>
              {t('skip')}
            </button>
          </>
        ) : (
          <div className="setup-done">
            <div className="done-check">✓</div>
            <h2>{t('ready')}</h2>
            <p>{t('setupDoneDesc')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
