import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UploadCloud, FileText, BrainCircuit, HelpCircle, Bot, Sparkles, RotateCcw } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [noteCount, setNoteCount] = useState(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/ai/notes', config);
        setNoteCount(data.length);
      } catch {
        setNoteCount(0);
      }
    };
    fetchCount();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      icon: FileText,
      label: 'Uploaded Notes',
      value: noteCount === null ? '…' : noteCount,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
    },
    {
      icon: BrainCircuit,
      label: 'AI Ready',
      value: 'Active',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      icon: Sparkles,
      label: 'Quiz Engine',
      value: '10 Qs',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
    },
  ];

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>
          {greeting},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p>Here's your Second Brain overview. Upload notes, test yourself, or chat with AI.</p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  color,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="var(--primary)" />
            Upload Knowledge
          </h2>
          <FileUpload onUploadSuccess={() => setNoteCount(c => (c || 0) + 1)} />
        </div>

        {/* Quick actions and Revision column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--secondary)" />
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: HelpCircle, label: 'Test My Knowledge', desc: '10-question AI quiz from your notes', href: '/quiz', color: '#6366f1' },
                { icon: Bot,        label: 'AI Assistant',      desc: 'Chat with your notes using AI',       href: '/ai',   color: '#ec4899' },
                { icon: FileText,   label: 'View History',      desc: 'See all your uploaded documents',    href: '/history', color: '#10b981' },
              ].map(({ icon: Icon, label, desc, href, color }) => (
                <a
                  key={href}
                  href={href}
                  className="card"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: `${color}1a`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
