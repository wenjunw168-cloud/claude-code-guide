'use client';
import { useState, useEffect } from 'react';
import { PROVIDERS } from '../lib/providers';

export default function SettingsModal({ open, onClose, onSave, onClear, onExport, initialProvider, initialKey }) {
  const [provider, setProvider] = useState(initialProvider || 'anthropic');
  const [apiKey, setApiKey] = useState(initialKey || '');
  const [customUrl, setCustomUrl] = useState('');
  const [customModel, setCustomModel] = useState('');

  useEffect(() => {
    setProvider(initialProvider || 'anthropic');
    setApiKey(initialKey || '');
  }, [initialProvider, initialKey, open]);

  function handleSave() {
    if (!apiKey.trim()) return;
    if (provider === 'custom') {
      if (!customUrl.trim() || !customModel.trim()) {
        alert('自定义模式请填写 API 地址和模型名称');
        return;
      }
    }
    onSave({ apiKey: apiKey.trim(), provider, customUrl: customUrl.trim(), customModel: customModel.trim() });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  }

  const p = PROVIDERS[provider];
  const keyPlaceholder = provider === 'anthropic' ? 'sk-ant-…' : provider === 'kimi' ? 'sk-…（Kimi）' : provider === 'openai' ? 'sk-…（OpenAI）' : '你的 API Key';

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-modal">
        <div className="settings-title">AI 模型设置</div>
        <div className="settings-desc">Key 只存在当前标签页内存中，关闭后自动清除，不会保存到任何地方。</div>

        <div className="provider-grid">
          {Object.entries(PROVIDERS).map(([id, prov]) => (
            <div
              key={id}
              className={`provider-card${provider === id ? ' selected' : ''}`}
              onClick={() => setProvider(id)}
            >
              <div className="provider-name">{prov.name}</div>
              <div className="provider-model">{prov.model || (id === 'anthropic' ? 'claude-sonnet-4-6' : '兼容 OpenAI 格式')}</div>
            </div>
          ))}
        </div>

        <div className="settings-field">
          <label className="settings-label">API Key</label>
          <input
            type="password"
            className="settings-input"
            placeholder={keyPlaceholder}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div
            className="settings-hint"
            dangerouslySetInnerHTML={{ __html: p.keyHint }}
          />
        </div>

        {provider === 'custom' && (
          <>
            <div className="settings-field">
              <label className="settings-label">API 地址</label>
              <input
                type="text"
                className="settings-input"
                placeholder="https://api.example.com/v1/chat/completions"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
              <div className="settings-hint">填写兼容 OpenAI 格式的完整 endpoint 地址</div>
            </div>
            <div className="settings-field">
              <label className="settings-label">模型名称</label>
              <input
                type="text"
                className="settings-input"
                placeholder="model-name"
                value={customModel}
                onChange={e => setCustomModel(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="settings-divider" />
        <div className="settings-field">
          <label className="settings-label">内容导出</label>
          <button
            className="settings-clear"
            style={{ width: '100%', textAlign: 'center' }}
            onClick={() => { onExport(); onClose(); }}
          >
            ⬇ 导出 content.json（含编辑内容）
          </button>
          <div className="settings-hint">将当前所有章节内容（包含你的编辑）下载为 JSON 文件</div>
        </div>
        <div className="settings-divider" />
        <div className="settings-actions">
          <button className="settings-clear" onClick={onClear}>清除已保存的设置</button>
          <button className="modal-cancel" onClick={onClose}>暂时跳过</button>
          <button className="modal-confirm" onClick={handleSave}>保存并开始对话</button>
        </div>
      </div>
    </div>
  );
}
