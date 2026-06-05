import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/upload`, formData, config);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ marginBottom: '16px' }}>Upload Knowledge</h3>
      
      {!file ? (
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            transition: 'var(--transition)',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={handleChange} 
            accept=".pdf,.txt" 
          />
          <UploadCloud size={48} color={dragActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: '500' }}>Drag & drop your file here</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>Supports PDF and TXT</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileIcon size={24} color="var(--primary)" />
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>{file.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button onClick={() => setFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '12px' }}>{error}</p>}

      {file && (
        <button 
          onClick={handleUpload} 
          disabled={uploading}
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '16px' }}
        >
          {uploading ? 'Processing & Embedding...' : 'Upload to Second Brain'}
        </button>
      )}
    </div>
  );
};

export default FileUpload;
