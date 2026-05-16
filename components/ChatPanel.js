'use client';
import { useState, useRef, useEffect, forwardRef } from 'react';
import { marked } from 'marked';
import { PROVIDERS } from '../lib/providers';

marked.setOptions({ breaks: true, gfm: true });

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ChatPanel = forwardRef(function ChatPanel({ chapter, apiKey, currentProvider, customProviderConfig, onNeedSettings, quizQuestion }, ref) {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Reset chat when chapter changes
  useEffect(() => {
    setMessages([]);
    setChatHistory([]);
  }, [chapter?.id]);

  // Pre-fill quiz question
  useEffect(() => {
    if (quizQuestion) {
      setInputValue(quizQuestion.text);
      inputRef.current?.focus();
    }
  }, [quizQuestion]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function buildContext() {
    if (!chapter) return '你是一个 Claude Code 学习助手，帮助用户学习 AI 编程工具。';
    const sections = chapter.sections.map(s => `### ${s.heading}\n${s.body}`).join('\n\n');
    return `你是一个 Claude Code 学习助手，正在帮助一个零基础的小白学习 AI 编程工具。

当前用户正在阅读的章节是：【${chapter.title}】
章节摘要：${chapter.summary}

章节核心内容：
${sections}

本章要点：
${chapter.keypoints.map(k => '- ' + k).join('\n')}

回答规则：
1. 优先结合章节内容回答，用通俗易懂的语言
2. 多用生活化比喻解释技术概念
3. 回答长度适中，复杂问题分步骤说明
4. 如果问题超出本章范围，可以简短回答并说明在哪个章节有详细讲解
5. 鼓励小白继续学习，保持正面积极的态度`;
  }

  async function sendMessage(text) {
    const msg = (text || inputValue).trim();
    if (!msg || isLoading) return;

    if (!apiKey) {
      onNeedSettings();
      return;
    }

    setInputValue('');
    const userMsg = { role: 'user', content: msg };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsLoading(true);

    const provider = PROVIDERS[currentProvider];
    const chapterContext = buildContext();

    try {
      let reply;

      if (provider.format === 'anthropic') {
        const res = await fetch(provider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model: provider.model, max_tokens: 1000, system: chapterContext, messages: newHistory }),
        });
        const result = await res.json();
        reply = result.content?.[0]?.text || result.error?.message || '出现错误，请重试。';
      } else {
        const targetUrl = currentProvider === 'custom' ? customProviderConfig?.url : provider.url;
        const model = currentProvider === 'custom' ? customProviderConfig?.model : provider.model;
        const msgs = [{ role: 'system', content: chapterContext }, ...newHistory];
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ __target_url__: targetUrl, __api_key__: apiKey, model, max_tokens: 1000, messages: msgs }),
        });
        const result = await res.json();
        reply = result.choices?.[0]?.message?.content || result.error?.message || '出现错误，请重试。';
      }

      const assistantMsg = { role: 'assistant', content: reply };
      setChatHistory(prev => [...prev, assistantMsg]);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (e) {
      const errMsg = e.message || String(e);
      let hint = '网络请求失败。';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        hint = '连接失败：请检查网络连接和 API 地址是否正确。';
      } else if (errMsg.includes('CORS')) {
        hint = 'CORS 跨域错误：该 API 服务不允许浏览器直接访问。';
      } else {
        hint = '错误详情：' + errMsg;
      }
      setMessages(prev => [...prev, { role: 'assistant', text: hint }]);
    }

    setIsLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaInput(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    setInputValue(el.value);
  }

  const quickQuestions = [
    '用一个生活中的例子解释这章的核心概念',
    '小白最容易在这章犯哪些错误？',
    '这章和上一章有什么联系？',
    '给我一个具体的操作步骤清单',
  ];

  return (
    <div className="chat-panel" id="chatPanel" ref={ref}>
      <div className="chat-header">
        <div className="chat-header-title">章节助手</div>
        <div className="chat-header-sub">针对当前章节提问</div>
        <div className="chat-context-pill">
          <span>◎</span>
          <span>{chapter?.title || '未选择章节'}</span>
        </div>
      </div>

      <div className="chat-messages" ref={messagesRef}>
        {messages.length === 0 && !isLoading && (
          <div className="msg-empty">
            <span className="msg-empty-icon">◇</span>
            选择左侧章节后，<br />在这里针对章节内容<br />向 AI 提问
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <div className="msg-role">{msg.role === 'user' ? '你' : 'AI 助手'}</div>
            <div
              className="msg-bubble"
              dangerouslySetInnerHTML={{
                __html: msg.role === 'assistant' ? marked.parse(msg.text) : escapeHtml(msg.text),
              }}
            />
          </div>
        ))}
        {isLoading && <div className="msg-thinking">正在思考…</div>}
      </div>

      <div className="chat-quick">
        <div className="quick-label">快速提问</div>
        {quickQuestions.map((q, i) => (
          <button key={i} className="quick-btn" onClick={() => sendMessage(q)}>{q}</button>
        ))}
      </div>

      <div className="chat-input-wrap">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="问任何关于本章的问题…"
          rows={1}
          value={inputValue}
          onChange={handleTextareaInput}
          onKeyDown={handleKey}
        />
        <button className="chat-send" disabled={isLoading} onClick={() => sendMessage()}>↑</button>
      </div>
    </div>
  );
});

export default ChatPanel;
