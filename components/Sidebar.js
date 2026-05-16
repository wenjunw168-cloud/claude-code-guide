'use client';

export default function Sidebar({ chapters, currentChapterId, bookmarks, onSelectChapter, mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={onClose}
      />
      <nav className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="mobile-nav-header">
          <span className="mobile-nav-title">章节目录</span>
          <button className="mobile-nav-close" onClick={onClose}>×</button>
        </div>
        <div className="sidebar-label">章节目录</div>
        <div className="nav-list">
          {chapters.map(ch => (
            <div
              key={ch.id}
              className={`nav-item${ch.id === currentChapterId ? ' active' : ''}${bookmarks.includes(ch.id) ? ' bookmarked' : ''}`}
              onClick={() => { onSelectChapter(ch.id); onClose(); }}
            >
              <span className="nav-icon">{ch.icon}</span>
              <span className="nav-title">{ch.title}</span>
              <span className="nav-bookmark" />
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
