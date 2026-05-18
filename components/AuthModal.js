'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setError(e.message || '发送失败，请稍后再试');
    }
    setLoading(false);
  }

  function handleClose() {
    setSent(false);
    setEmail('');
    setError('');
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="settings-modal" style={{ width: 360 }}>
        <div className="settings-title">登录 / 注册</div>
        <div className="settings-desc">
          输入邮箱后，我们会发一封登录链接。点击链接即可登录，无需密码。<br />
          标记内容会自动同步到你的账号，在任何设备上都能看到。
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>📬</div>
            <div style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14, marginBottom: 8 }}>
              登录链接已发送到
            </div>
            <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: '1.25rem' }}>
              {email}
            </div>
            <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.6 }}>
              打开邮件，点击「登录到 Claude Code 共学手册」<br />
              链接 30 分钟内有效
            </div>
          </div>
        ) : (
          <>
            <div className="settings-field">
              <label className="settings-label">邮箱地址</label>
              <input
                type="email"
                className="settings-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                autoFocus
              />
              {error && (
                <div style={{ color: 'var(--red)', fontFamily: 'var(--font-ui)', fontSize: 12, marginTop: 6 }}>
                  {error}
                </div>
              )}
            </div>
            <div className="settings-divider" />
            <div className="settings-actions">
              <button className="modal-cancel" onClick={handleClose}>取消</button>
              <button className="modal-confirm" onClick={handleSend} disabled={loading || !email.trim()}>
                {loading ? '发送中…' : '发送登录链接'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
