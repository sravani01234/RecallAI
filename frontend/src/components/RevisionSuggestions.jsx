import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, RefreshCw } from 'lucide-react';

const RevisionSuggestions = () => {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/revision`, config);
      setSuggestions(data.suggestions);
    } catch (error) {
      setSuggestions('Failed to load revision suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="var(--secondary)" /> Daily Revision
        </h3>
        <button onClick={fetchSuggestions} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span className="typing-dot" style={{ animation: 'blink 1s infinite' }}>...</span>
            <span style={{ fontSize: '14px' }}>Analyzing notes...</span>
          </div>
        ) : (
          <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
            {suggestions}
          </p>
        )}
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RevisionSuggestions;
