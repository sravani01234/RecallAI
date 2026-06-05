import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User as UserIcon, Image as ImageIcon, X } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchNotes = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/notes`, config);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    const currentImage = selectedImage;
    const userMessage = { text: input.trim(), role: 'user', image: currentImage?.previewUrl };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/chat`, { 
        query: userMessage.text,
        noteId: selectedNote || undefined,
        image: currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined
      }, config);
      
      setMessages((prev) => [...prev, { text: data.answer, role: 'bot', context: data.contextUsed }]);
    } catch (error) {
      setMessages((prev) => [...prev, { text: 'Sorry, I encountered an error. Make sure your notes are uploaded.', role: 'bot', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Ask Second Brain</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Answers based only on your uploaded notes.</p>
        </div>
        <select 
          className="input" 
          value={selectedNote} 
          onChange={(e) => setSelectedNote(e.target.value)} 
          style={{ width: '200px', padding: '8px', cursor: 'pointer' }}
        >
          <option value="">All Notes</option>
          {notes.map(note => (
            <option key={note._id} value={note._id}>{note.title}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bot size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>Upload some notes, then ask me anything!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <UserIcon size={16} color="white" /> : <Bot size={16} color="var(--primary)" />}
              </div>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                maxWidth: '80%',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="Uploaded" 
                    style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 8 : 0, maxHeight: 150, objectFit: 'cover' }} 
                  />
                )}
                {msg.text && <p>{msg.text}</p>}
                {msg.role === 'bot' && !msg.error && msg.context > 0 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                    Based on {msg.context} note chunks
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--primary)" />
            </div>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px' }}>
              <span className="typing-dot" style={{ animation: 'blink 1s infinite' }}>...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
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
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            style={{ padding: '8px', color: 'var(--text-muted)' }}
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            className="input" 
            placeholder="Ask about your notes..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || (!input.trim() && !selectedImage)}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
