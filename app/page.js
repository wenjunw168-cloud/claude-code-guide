'use client';
import { useState, useEffect, useRef } from 'react';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import ChapterContent from '../components/ChapterContent';
import Resizer from '../components/Resizer';
import ChatPanel from '../components/ChatPanel';
import SettingsModal from '../components/SettingsModal';
import HighlightPanel from '../components/HighlightPanel';
import AuthModal from '../components/AuthModal';
import {
  supabase,
  mergeHighlights,
  fetchCloudHighlights,
  upsertCloudHighlight,
  upsertAllCloudHighlights,
  deleteCloudHighlight,
} from '../lib/supabase';

function safeLocalGet(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export default function Home() {
  const [data, setData] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [readChapters, setReadChapters] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [sectionEdits, setSectionEdits] = useState({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hlPanelOpen, setHlPanelOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [currentProvider, setCurrentProvider] = useState('anthropic');
  const [customProviderConfig, setCustomProviderConfig] = useState({ url: '', model: '' });
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [user, setUser] = useState(null);
  const [syncToast, setSyncToast] = useState('');
  const chatPanelRef = useRef(null);

  // Load from storage on mount
  useEffect(() => {
    setBookmarks(safeLocalGet('cc-bookmarks', []));
    setReadChapters(safeLocalGet('cc-read', []));
    const hl = safeLocalGet('cc-highlights', []);
    hl.forEach((h, i) => { if (!h.num) h.num = i + 1; });
    setHighlights(hl);

    const savedKey = sessionStorage.getItem('cc-apikey');
    const savedProvider = sessionStorage.getItem('cc-provider');
    if (savedKey) setApiKey(savedKey);
    if (savedProvider) setCurrentProvider(savedProvider);

    const savedWidth = parseInt(localStorage.getItem('cc-chat-width'));
    if (savedWidth && savedWidth >= 200 && savedWidth <= 600 && chatPanelRef.current) {
      chatPanelRef.current.style.width = savedWidth + 'px';
    }
  }, []);

  // Supabase auth listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncFromCloud(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        syncFromCloud(u);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function syncFromCloud(u) {
    try {
      const cloudHighlights = await fetchCloudHighlights(u.id);
      const localHighlights = safeLocalGet('cc-highlights', []);
      const merged = mergeHighlights(localHighlights, cloudHighlights);
      localStorage.setItem('cc-highlights', JSON.stringify(merged));
      setHighlights(merged);
      await upsertAllCloudHighlights(merged, u.id);
      showSyncToast(`☁ 已同步 ${merged.length} 条标记`);
    } catch (e) {
      console.error('Sync failed:', e);
    }
  }

  function showSyncToast(msg) {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(''), 3000);
  }

  // Load content.json
  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(json => {
        const edits = {};
        json.chapters.forEach(ch => {
          ch.sections.forEach((_, idx) => {
            const saved = localStorage.getItem(`cc-edits-${ch.id}-${idx}`);
            if (saved !== null) edits[`${ch.id}-${idx}`] = saved;
          });
        });
        setSectionEdits(edits);
        setData(json);

        const hash = window.location.hash.slice(1);
        const startId = (hash && json.chapters.find(c => c.id === hash))
          ? hash
          : json.chapters[0].id;
        selectChapter(json, startId, []);
      })
      .catch(console.error);
  }, []);

  function selectChapter(dataObj, id, currentRead) {
    const chapters = (dataObj || data)?.chapters || [];
    if (!chapters.find(c => c.id === id)) return;
    setCurrentChapterId(id);
    if (typeof window !== 'undefined') history.replaceState(null, '', '#' + id);

    const read = currentRead || readChapters;
    if (!read.includes(id)) {
      const newRead = [...read, id];
      setReadChapters(newRead);
      localStorage.setItem('cc-read', JSON.stringify(newRead));
    }
  }

  function handleSelectChapter(id) { selectChapter(null, id, null); }

  function toggleBookmark(id) {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      localStorage.setItem('cc-bookmarks', JSON.stringify(next));
      return next;
    });
  }

  async function addHighlight(newHighlight) {
    setHighlights(prev => {
      const next = [...prev, newHighlight];
      localStorage.setItem('cc-highlights', JSON.stringify(next));
      return next;
    });
    if (user) {
      try { await upsertCloudHighlight(newHighlight, user.id); } catch {}
    }
  }

  async function deleteHighlight(id) {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id).map((h, i) => ({ ...h, num: i + 1 }));
      localStorage.setItem('cc-highlights', JSON.stringify(next));
      return next;
    });
    if (user) {
      try { await deleteCloudHighlight(id); } catch {}
    }
  }

  function saveEdit(chapterId, sectionIdx, value) {
    const key = `${chapterId}-${sectionIdx}`;
    setSectionEdits(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`cc-edits-${chapterId}-${sectionIdx}`, value);
  }

  function handleSettingsSave({ apiKey: key, provider, customUrl, customModel }) {
    setApiKey(key);
    setCurrentProvider(provider);
    setCustomProviderConfig({ url: customUrl, model: customModel });
    sessionStorage.setItem('cc-apikey', key);
    sessionStorage.setItem('cc-provider', provider);
    setSettingsOpen(false);
  }

  function handleSettingsClear() {
    setApiKey(null);
    sessionStorage.removeItem('cc-apikey');
    sessionStorage.removeItem('cc-provider');
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  function exportContent() {
    if (!data) return;
    const exported = JSON.parse(JSON.stringify(data));
    exported.chapters.forEach(ch => {
      ch.sections.forEach((s, idx) => {
        const edit = sectionEdits[`${ch.id}-${idx}`];
        if (edit !== undefined) s.body = edit;
      });
    });
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'content.json'; a.click();
    URL.revokeObjectURL(url);
  }

  const currentChapter = data?.chapters.find(c => c.id === currentChapterId);

  if (!data) {
    return (
      <main>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontFamily: 'var(--font-ui)', fontSize: '13px', gap: '8px' }}>
          <div className="dot-spin" />加载中…
        </div>
      </main>
    );
  }

  return (
    <main>
      <Topbar
        meta={data.meta}
        readChapters={readChapters}
        totalChapters={data.chapters.length}
        apiKey={apiKey}
        currentProvider={currentProvider}
        hlCount={highlights.length}
        onSettingsOpen={() => setSettingsOpen(true)}
        onHlPanelOpen={() => setHlPanelOpen(true)}
        onMobileNavOpen={() => setMobileNavOpen(true)}
        user={user}
        onLoginOpen={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      <div className="layout">
        <Sidebar
          chapters={data.chapters}
          currentChapterId={currentChapterId}
          bookmarks={bookmarks}
          onSelectChapter={handleSelectChapter}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="main">
          {currentChapter ? (
            <ChapterContent
              key={currentChapterId}
              chapter={currentChapter}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onAskQuiz={text => setQuizQuestion({ text: '我来回答思考题：' + text, id: Date.now() })}
              highlights={highlights}
              onAddHighlight={addHighlight}
              sectionEdits={sectionEdits}
              onSaveEdit={saveEdit}
            />
          ) : (
            <div className="loading"><div className="dot-spin" />加载内容中…</div>
          )}
        </div>

        <Resizer panelRef={chatPanelRef} />

        <ChatPanel
          ref={chatPanelRef}
          chapter={currentChapter}
          apiKey={apiKey}
          currentProvider={currentProvider}
          customProviderConfig={customProviderConfig}
          onNeedSettings={() => setSettingsOpen(true)}
          quizQuestion={quizQuestion}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
        onClear={handleSettingsClear}
        onExport={exportContent}
        initialProvider={currentProvider}
        initialKey={apiKey || ''}
      />

      <HighlightPanel
        open={hlPanelOpen}
        highlights={highlights}
        onClose={() => setHlPanelOpen(false)}
        onDelete={deleteHighlight}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      {/* Sync toast */}
      <div className={`sync-toast${syncToast ? ' show' : ''}`}>{syncToast}</div>
    </main>
  );
}
