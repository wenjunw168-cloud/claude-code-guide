'use client';

export default function HighlightPanel({ open, highlights, onClose, onDelete }) {
  if (!open) return null;

  return (
    <div className={`hl-panel-overlay${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hl-panel">
        <div className="hl-panel-header">
          <span className="hl-panel-title">我的标记</span>
          <button className="hl-panel-close" onClick={onClose}>×</button>
        </div>
        <div className="hl-panel-body">
          {highlights.length === 0 ? (
            <div className="hl-empty">还没有任何标记</div>
          ) : (
            [...highlights].reverse().map(hl => {
              const d = new Date(hl.createdAt);
              const time = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              return (
                <div key={hl.id} className="hl-item">
                  <div className="hl-item-chapter">{hl.chapterTitle || hl.chapterId}</div>
                  <div className="hl-item-text">{hl.text}</div>
                  {hl.note && <div className="hl-item-note">{hl.note}</div>}
                  <div className="hl-item-footer">
                    <span className="hl-item-time">{time}</span>
                    <button className="hl-item-del" onClick={() => onDelete(hl.id)}>删除</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
