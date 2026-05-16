'use client';
import { useRef, useEffect, useState } from 'react';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function wrapText(container, text, id, num) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.closest('.highlight-mark, textarea')) continue;
    nodes.push(node);
  }
  for (const n of nodes) {
    const idx = n.nodeValue.indexOf(text);
    if (idx === -1) continue;
    const mark = document.createElement('mark');
    mark.className = 'highlight-mark';
    mark.dataset.hid = id;
    mark.dataset.num = num;
    mark.textContent = text;
    const frag = document.createDocumentFragment();
    if (idx > 0) frag.appendChild(document.createTextNode(n.nodeValue.slice(0, idx)));
    frag.appendChild(mark);
    const after = n.nodeValue.slice(idx + text.length);
    if (after) frag.appendChild(document.createTextNode(after));
    n.parentNode.replaceChild(frag, n);
    break;
  }
}

export default function ChapterContent({
  chapter,
  bookmarks,
  onToggleBookmark,
  onAskQuiz,
  highlights,
  onAddHighlight,
  sectionEdits,
  onSaveEdit,
}) {
  const contentRef = useRef(null);
  const [editingSection, setEditingSection] = useState(null); // { sectionIdx, value }
  const [hlToolbar, setHlToolbar] = useState({ visible: false, x: 0, y: 0 });
  const [hlPopup, setHlPopup] = useState({ visible: false, x: 0, y: 0, text: '', quote: '' });
  const [hlNote, setHlNote] = useState('');
  const pendingTextRef = useRef('');

  const isBookmarked = bookmarks.includes(chapter.id);

  // Remove existing marks, normalize text nodes, then re-apply current highlights
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    container.querySelectorAll('.highlight-mark').forEach(mark => {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    container.normalize();
    highlights.filter(h => h.chapterId === chapter.id)
      .forEach(h => wrapText(container, h.text, h.id, h.num));
  });

  // Close toolbar/popup on outside click
  useEffect(() => {
    function onMouseDown(e) {
      const toolbar = document.getElementById('hlToolbar');
      const popup = document.getElementById('hlNotePopup');
      if (toolbar && !toolbar.contains(e.target)) setHlToolbar(t => ({ ...t, visible: false }));
      if (popup && !popup.contains(e.target) && toolbar && !toolbar.contains(e.target)) {
        setHlPopup(p => ({ ...p, visible: false }));
        pendingTextRef.current = '';
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function handleMouseUp() {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 2) { setHlToolbar(t => ({ ...t, visible: false })); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      pendingTextRef.current = text;
      setHlToolbar({
        visible: true,
        x: Math.max(8, rect.left + rect.width / 2 - 70),
        y: rect.top - 44 + window.scrollY,
      });
    }, 10);
  }

  function openNotePopup() {
    const sel = window.getSelection();
    const rect = sel && sel.rangeCount
      ? sel.getRangeAt(0).getBoundingClientRect()
      : { left: window.innerWidth / 2 - 140, bottom: window.innerHeight / 2 };
    const text = pendingTextRef.current;
    const quote = text.length > 40 ? text.slice(0, 40) + '…' : text;
    setHlToolbar(t => ({ ...t, visible: false }));
    setHlNote('');
    setHlPopup({
      visible: true,
      x: Math.min(window.innerWidth - 296, Math.max(8, rect.left)),
      y: rect.bottom + 8 + window.scrollY,
      text,
      quote: `「${quote}」`,
    });
    setTimeout(() => document.getElementById('hlNoteInput')?.focus(), 50);
  }

  function saveHighlight() {
    const text = pendingTextRef.current;
    if (!text) return;
    const note = hlNote.trim();
    const num = highlights.length + 1;
    const newHighlight = {
      id: uid(),
      num,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      text,
      note,
      createdAt: Date.now(),
    };
    onAddHighlight(newHighlight);
    setHlPopup(p => ({ ...p, visible: false }));
    pendingTextRef.current = '';
    window.getSelection()?.removeAllRanges();
  }

  function handleContentClick(e) {
    const mark = e.target.closest('.highlight-mark');
    if (mark) {
      // Clicking a mark opens the highlights panel
      document.getElementById('hlBadgeBtn')?.click();
    }
  }

  function startEdit(sectionIdx) {
    const body = sectionEdits[`${chapter.id}-${sectionIdx}`] ?? chapter.sections[sectionIdx].body;
    setEditingSection({ sectionIdx, value: body });
  }

  function saveEdit() {
    if (!editingSection) return;
    onSaveEdit(chapter.id, editingSection.sectionIdx, editingSection.value);
    setEditingSection(null);
  }

  function cancelEdit() {
    setEditingSection(null);
  }

  function getSectionBody(section, idx) {
    return sectionEdits[`${chapter.id}-${idx}`] ?? section.body;
  }

  return (
    <div
      className="content-area"
      ref={contentRef}
      onMouseUp={handleMouseUp}
      onClick={handleContentClick}
    >
      {/* Highlight toolbar */}
      {hlToolbar.visible && (
        <div
          id="hlToolbar"
          className="highlight-toolbar"
          style={{ left: hlToolbar.x, top: hlToolbar.y }}
        >
          <button onClick={openNotePopup}>📌 标记 + 思考</button>
        </div>
      )}

      {/* Note popup */}
      {hlPopup.visible && (
        <div
          id="hlNotePopup"
          className="highlight-note-popup"
          style={{ left: hlPopup.x, top: hlPopup.y }}
        >
          <div className="highlight-note-popup-quote">{hlPopup.quote}</div>
          <textarea
            id="hlNoteInput"
            placeholder="写下你的思考…"
            value={hlNote}
            onChange={e => setHlNote(e.target.value)}
          />
          <div className="highlight-note-popup-actions">
            <button className="hnp-cancel" onClick={() => { setHlPopup(p => ({ ...p, visible: false })); pendingTextRef.current = ''; }}>取消</button>
            <button className="hnp-save" onClick={saveHighlight}>保存</button>
          </div>
        </div>
      )}

      {/* Chapter header */}
      <div className="chapter-actions">
        <button
          className={`bookmark-btn${isBookmarked ? ' marked' : ''}`}
          onClick={() => onToggleBookmark(chapter.id)}
        >
          <span>{isBookmarked ? '★' : '☆'}</span>
          <span>{isBookmarked ? '已标记难点' : '标记为难点'}</span>
        </button>
      </div>

      <div className="chapter-header">
        <span className="chapter-icon">{chapter.icon}</span>
        <div className="chapter-title">{chapter.title}</div>
        <div className="chapter-summary">{chapter.summary}</div>
      </div>

      {/* Sections */}
      {chapter.sections.map((section, idx) => (
        <div key={idx} className="section">
          <div className="section-heading">
            <span className="section-heading-text">{section.heading}</span>
            {editingSection?.sectionIdx !== idx && (
              <button className="edit-btn" onClick={() => startEdit(idx)} title="编辑此节">✏ 编辑</button>
            )}
          </div>
          {editingSection?.sectionIdx === idx ? (
            <div>
              <textarea
                className="edit-textarea"
                value={editingSection.value}
                onChange={e => setEditingSection(prev => ({ ...prev, value: e.target.value }))}
                autoFocus
              />
              <div className="edit-actions">
                <button className="edit-save" onClick={saveEdit}>✓ 保存</button>
                <button className="edit-cancel" onClick={cancelEdit}>✗ 取消</button>
              </div>
            </div>
          ) : (
            <div
              className="section-body"
              dangerouslySetInnerHTML={{ __html: marked.parse(getSectionBody(section, idx)) }}
            />
          )}
        </div>
      ))}

      {/* Keypoints */}
      <div className="keypoints">
        <div className="keypoints-label">本章要点</div>
        <ul className="keypoints-list">
          {chapter.keypoints.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      </div>

      {/* Quiz */}
      <div className="quiz">
        <div className="quiz-label">思考题</div>
        <div className="quiz-text">{chapter.quiz}</div>
        <button className="quiz-btn" onClick={() => onAskQuiz(chapter.quiz)}>向 AI 讨论这个问题 →</button>
      </div>
    </div>
  );
}
