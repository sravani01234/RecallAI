import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User as UserIcon, Plus, MessageSquare, Loader2, Image as ImageIcon, X } from 'lucide-react';

const formatDate = (d) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const AiPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getConfig = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return { headers: { Authorization: `Bearer ${userInfo.token}`, 'Content-Type': 'application/json' } };
  };

  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/chat/history`, getConfig());
        setSessions(data);
      } catch {
        setSessions([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    setMessages([]);
    setActiveSession(null);
  };

  const loadSession = (session) => {
    setActiveSession(session._id);
    const msgs = session.history.map(h => ({
      text: h.content,
      role: h.role === 'user' ? 'user' : 'bot',
      image: h.image,
    }));
    setMessages(msgs);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: reader.result.split(',')[1],
          mimeType: file.type,
          previewUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim();
    const currentImage = selectedImage;
    
    setMessages(prev => [...prev, { text: userText, role: 'user', image: currentImage?.previewUrl }]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/chat`,
        { 
          query: userText, 
          history: activeSession ? messages : [],
          image: currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined 
        },
        getConfig()
      );
      const botText = data.answer;
      setMessages(prev => [...prev, { text: botText, role: 'bot', context: data.contextUsed }]);

      // Save to backend
      try {
        const { data: saved } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/ai/chat/save`,
          { 
            sessionId: activeSession, 
            userMessage: userText, 
            botMessage: botText,
            userImage: currentImage?.previewUrl 
          },
          getConfig()
        );
        const newSessionId = saved.sessionId;
        setActiveSession(newSessionId);

        // Refresh sidebar
        const { data: updatedSessions } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/chat/history`, getConfig());
        setSessions(updatedSessions);
      } catch { /* non-critical */ }

    } catch {
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Make sure your notes are uploaded.',
        role: 'bot',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page-layout">
      {/* ─── Chat History Panel ─── */}
      <div className="chat-history-panel">
        <div className="chat-history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Chat History</span>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 12, gap: 4 }}
            onClick={startNewChat}
            title="New chat"
          >
            <Plus size={14} /> New
          </button>
        </div>

        <div className="chat-history-list">
          {historyLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <MessageSquare size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>No chats yet</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session._id}
                className={`chat-session-item${activeSession === session._id ? ' active' : ''}`}
                onClick={() => loadSession(session)}
              >
                <p>{session.title || 'Untitled Chat'}</p>
                <span>{formatDate(session.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Chat Main ─── */}
      <div className="chat-main">
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--glass-bg)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15 }}>AI Assistant</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Answers based on your uploaded notes</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={32} color="var(--primary)" />
              </div>
              <h3 style={{ color: 'var(--text-main)' }}>Ask your Second Brain</h3>
              <p style={{ maxWidth: 340 }}>Upload some notes first, then ask me anything — I'll answer based strictly on your knowledge base.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), #818cf8)' : 'var(--bg-surface-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user'
                    ? <UserIcon size={16} color="white" />
                    : <Bot size={16} color="var(--primary)" />}
                </div>
                <div style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), #818cf8)' : 'var(--bg-surface-elevated)',
                  padding: '12px 16px',
                  borderRadius: 16,
                  borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                  borderTopLeftRadius: msg.role === 'bot' ? 4 : 16,
                  maxWidth: '72%',
                  color: 'var(--text-main)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Uploaded" 
                      style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 8 : 0, maxHeight: 200, objectFit: 'cover' }} 
                    />
                  )}
                  {msg.text && <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
                  {msg.role === 'bot' && !msg.error && msg.context > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 8 }}>
                      Based on {msg.context} note chunk{msg.context !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="var(--primary)" />
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px 18px', borderRadius: 16, borderTopLeftRadius: 4 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)',
                      animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--glass-bg)' }}>
          {selectedImage && (
            <div style={{ marginBottom: 12, display: 'inline-block', position: 'relative' }}>
              <img src={selectedImage.previewUrl} alt="Preview" style={{ height: 60, borderRadius: 8, border: '1px solid var(--border-color)' }} />
              <button 
                onClick={() => setSelectedImage(null)}
                style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', padding: 2, border: 'none', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageSelect}
            />
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ padding: '10px', color: 'var(--text-muted)' }}
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
            >
              <ImageIcon size={20} />
            </button>
            <input
              type="text"
              className="input"
              placeholder="Ask about your notes…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '12px 18px', flexShrink: 0 }}
              disabled={loading || (!input.trim() && !selectedImage)}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiPage;
