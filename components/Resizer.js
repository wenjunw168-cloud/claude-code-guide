'use client';
import { useRef } from 'react';

const MIN = 200, MAX = 600;

export default function Resizer({ panelRef }) {
  const resizerRef = useRef(null);

  function onMouseDown(e) {
    e.preventDefault();
    const resizer = resizerRef.current;
    const panel = panelRef.current;
    if (!resizer || !panel) return;

    resizer.classList.add('dragging');
    const startX = e.clientX;
    const startWidth = panel.offsetWidth;

    function onMove(e) {
      const newWidth = Math.min(MAX, Math.max(MIN, startWidth - (e.clientX - startX)));
      panel.style.width = newWidth + 'px';
    }
    function onUp() {
      resizer.classList.remove('dragging');
      if (panel) localStorage.setItem('cc-chat-width', panel.offsetWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return <div ref={resizerRef} className="chat-resizer" onMouseDown={onMouseDown} />;
}
