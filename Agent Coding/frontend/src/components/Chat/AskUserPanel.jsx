import { useState } from 'react'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'

export default function AskUserPanel() {
  const askUserQuestion = useChatStore(s => s.askUserQuestion)
  const respondToAskUser = useChatStore(s => s.respondToAskUser)
  const cancelAskUser = useChatStore(s => s.cancelAskUser)
  const language = useSettingsStore(s => s.language)
  const [customInput, setCustomInput] = useState('')

  if (!askUserQuestion) return null

  const { question, options, allowCustom } = askUserQuestion

  const handleSelect = (option) => {
    respondToAskUser(option)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (customInput.trim()) {
      respondToAskUser(customInput.trim())
    }
  }

  return (
    <div className="ask-user-panel">
      <div className="ask-user-header">
        <span className="ask-user-icon">❓</span>
        <span className="ask-user-title">
          {language === 'vi' ? 'AI Agent cần bạn quyết định' : 'AI Agent needs your input'}
        </span>
      </div>

      <div className="ask-user-question">{question}</div>

      {options && options.length > 0 && (
        <div className="ask-user-options">
          {options.map((option, idx) => (
            <button
              key={idx}
              className="ask-user-option-btn"
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {allowCustom && (
        <form className="ask-user-custom" onSubmit={handleCustomSubmit}>
          <input
            type="text"
            className="ask-user-custom-input"
            placeholder={language === 'vi' ? 'Nhập câu trả lời khác...' : 'Type your custom answer...'}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            autoFocus={!options || options.length === 0}
          />
          <button
            type="submit"
            className="ask-user-submit-btn"
            disabled={!customInput.trim()}
          >
            {language === 'vi' ? 'Gửi' : 'Send'}
          </button>
        </form>
      )}

      <button className="ask-user-cancel-btn" onClick={cancelAskUser}>
        {language === 'vi' ? 'Hủy' : 'Cancel'}
      </button>
    </div>
  )
}
