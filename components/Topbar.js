'use client';
import { useState } from 'react';
import { PROVIDERS } from '../lib/providers';

export default function Topbar({ meta, readChapters, totalChapters, apiKey, currentProvider, hlCount, onSettingsOpen, onHlPanelOpen, onMobileNavOpen }) {
  const [toast, setToast] = useState('');

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('链接已复制到剪贴板');
        setTimeout(() => setToast(''), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setToast('链接已复制到剪贴板');
        setTimeout(() => setToast(''), 2000);
      } catch {
        setToast('复制失败，请手动复制地址栏链接');
        setTimeout(() => setToast(''), 3000);
      }
    }
  }

  const readCount = readChapters.length;
  const isConfigured = !!apiKey;
  const providerName = PROVIDERS[currentProvider]?.name || '设置模型';

  return (
    <>
      <div className="topbar">
        <button className="hamburger-btn" onClick={onMobileNavOpen} aria-label="打开章节目录">
          ☰
        </button>
        <span className="topbar-title">{meta?.title || 'Claude Code 共学手册'}</span>
        <span className="topbar-version">{meta ? `v${meta.version}` : 'v2.0'}</span>

        <div className="topbar-progress">
          <span>{readCount} / {totalChapters}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: totalChapters ? `${(readCount / totalChapters) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <button className="hl-badge-btn" id="hlBadgeBtn" onClick={onHlPanelOpen} title="我的标记">
          <span>📌 标记</span>
          <span className={`hl-badge-count${hlCount > 0 ? ' has-items' : ''}`}>{hlCount}</span>
        </button>

        <button className="share-btn" onClick={handleShare} title="分享当前章节">
          <span>🔗</span>
          <span>分享</span>
        </button>

        <button
          className={`settings-btn${isConfigured ? ' configured' : ''}`}
          onClick={onSettingsOpen}
          title="AI 模型设置"
        >
          <span>⚙</span>
          <span>{isConfigured ? `${providerName} · 已配置` : '设置模型'}</span>
        </button>
      </div>

      {/* Toast */}
      <div className={`copy-toast${toast ? ' show' : ''}`}>{toast}</div>
    </>
  );
}
