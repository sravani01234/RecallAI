import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, FileType2, Clock, Loader2, FolderOpen, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatDate = (d) => {
  if (!d) return 'Unknown';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const HistoryPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/notes`, config);
        setNotes(data);
      } catch {
        setError('Failed to load upload history.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/ai/notes/${id}`, config);
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const isPdf = (fileType) =>
    fileType === 'application/pdf' || (fileType && fileType.includes('pdf'));

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1>Upload History</h1>
        <p>All documents you have uploaded to your Second Brain.</p>
      </div>

      {loading ? (
        <div className="loading-screen">
          <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading your documents…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <FolderOpen size={36} color="var(--primary)" />
          </div>
          <h3>No uploads yet</h3>
          <p style={{ maxWidth: 320 }}>
            You haven't uploaded any notes yet. Go to the Dashboard to upload your first document.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/')}>
            <Upload size={16} /> Upload Now
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {notes.length} document{notes.length !== 1 ? 's' : ''} in your knowledge base
            </p>
            <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => navigate('/')}>
              <Upload size={14} /> Upload More
            </button>
          </div>

          <div className="file-grid">
            {notes.map((note) => {
              const pdf = isPdf(note.metadata?.fileType);
              return (
                <div key={note._id} className="file-card">
                  {/* Icon + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: pdf ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pdf
                        ? <FileType2 size={22} color="#f87171" />
                        : <FileText size={22} color="#a5b4fc" />}
                    </div>
                    <span className={`badge ${pdf ? 'badge-pdf' : 'badge-txt'}`}>
                      {pdf ? 'PDF' : 'TXT'}
                    </span>
                    <button 
                      onClick={() => handleDelete(note._id)}
                      className="btn btn-ghost" 
                      style={{ marginLeft: 'auto', padding: '6px', color: '#ef4444' }}
                      title="Delete Note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Title */}
                  <p style={{
                    fontWeight: 600, fontSize: 14,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    color: 'var(--text-main)',
                  }}>
                    {note.title || note.metadata?.fileName || 'Untitled'}
                  </p>

                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPage;
