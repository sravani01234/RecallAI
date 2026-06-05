import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  HelpCircle, ArrowRight, RotateCcw, CheckCircle2, XCircle, Trophy, Loader2
} from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

const QuizPage = () => {
  const [phase, setPhase] = useState('idle'); // idle | loading | quiz | result | error
  const [quizData, setQuizData] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]); // track all answers
  const [errorMsg, setErrorMsg] = useState('');
  const [availableNotes, setAvailableNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  useEffect(() => {
    if (phase === 'idle') {
      const fetchNotes = async () => {
        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/notes`, config);
          setAvailableNotes(data);
        } catch (err) {
          console.error("Failed to fetch notes", err);
        }
      };
      fetchNotes();
    }
  }, [phase]);

  const startQuiz = async () => {
    setPhase('loading');
    setQuizData([]);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setAnswers([]);
    setErrorMsg('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/quiz`, { noteIds: selectedNotes }, config);
      if (data && data.length > 0) {
        setQuizData(data);
        setPhase('quiz');
      } else {
        setErrorMsg('Not enough notes to generate a quiz. Upload some notes first!');
        setPhase('error');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
      setPhase('error');
    }
  };

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === quizData[currentQ].answer;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { question: quizData[currentQ].question, selected: opt, correct: quizData[currentQ].answer, isCorrect }]);
  };

  const handleNext = () => {
    if (currentQ + 1 < quizData.length) {
      setCurrentQ(q => q + 1);
      setSelected(null);
    } else {
      setPhase('result');
    }
  };

  const pct = quizData.length ? Math.round((score / quizData.length) * 100) : 0;
  const resultEmoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';
  const resultMsg =
    pct >= 80 ? 'Excellent! You really know your stuff.' :
    pct >= 60 ? 'Good job! A little more review will get you there.' :
    pct >= 40 ? 'Keep going — review your notes and try again.' :
    "Don't give up! Upload more notes and practice.";

  const progress = quizData.length ? ((currentQ) / quizData.length) * 100 : 0;

  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId) 
        : [...prev, noteId]
    );
  };

  /* ── IDLE ── */
  if (phase === 'idle') return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1>Test My Knowledge</h1>
        <p>Generate a 10-question AI quiz from your uploaded notes.</p>
      </div>
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <HelpCircle size={44} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 26, marginBottom: 12 }}>Ready to be tested?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.7 }}>
          Select the notes you want to be quizzed on. If no notes are selected, the AI will generate questions from all your uploaded notes.
        </p>

        {availableNotes.length > 0 && (
          <div style={{ textAlign: 'left', background: 'var(--bg-surface-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '15px' }}>Select Study Material:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {availableNotes.map(note => (
                <label key={note._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }} className="hover-bg">
                  <input 
                    type="checkbox" 
                    checked={selectedNotes.includes(note._id)}
                    onChange={() => toggleNoteSelection(note._id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{note.title || 'Untitled Note'}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 16 }} onClick={startQuiz}>
          <HelpCircle size={20} /> Start Quiz
        </button>
      </div>
    </div>
  );

  /* ── LOADING ── */
  if (phase === 'loading') return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
        <h3>Generating your quiz…</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Reading your notes and crafting 10 questions</p>
      </div>
    </div>
  );

  /* ── ERROR ── */
  if (phase === 'error') return (
    <div className="page-content animate-fade-in">
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <XCircle size={56} color="#ef4444" style={{ marginBottom: 20 }} />
        <h3 style={{ marginBottom: 12 }}>Quiz Failed</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{errorMsg}</p>
        <button className="btn btn-primary" onClick={() => setPhase('idle')}><RotateCcw size={16} /> Try Again</button>
      </div>
    </div>
  );

  /* ── RESULT ── */
  if (phase === 'result') return (
    <div className="page-content animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '48px 0 36px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{resultEmoji}</div>
        <h1 className="text-gradient" style={{ fontSize: 36, marginBottom: 8 }}>Quiz Complete!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{resultMsg}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 24, background: 'var(--bg-surface)', padding: '20px 40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: 36 }}>
          <div>
            <p style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Outfit', color: pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{score}/{quizData.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Questions Correct</p>
          </div>
          <div style={{ width: 1, height: 60, background: 'var(--border-color)' }} />
          <div>
            <p style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary)' }}>{pct}%</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Score</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={startQuiz}><RotateCcw size={16} /> Retake Quiz</button>
          <button className="btn btn-outline" onClick={() => setPhase('idle')}>Back to Start</button>
        </div>
      </div>

      {/* Answer review */}
      <h3 style={{ marginBottom: 16, fontSize: 18 }}>Review Answers</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {answers.map((a, idx) => (
          <div key={idx} className="card" style={{ padding: '16px 20px', borderColor: a.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {a.isCorrect
                ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                : <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Q{idx + 1}. {a.question}</p>
                {!a.isCorrect && (
                  <p style={{ fontSize: 13, color: '#fca5a5' }}>Your answer: {a.selected}</p>
                )}
                <p style={{ fontSize: 13, color: '#6ee7b7' }}>✓ {a.correct}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── QUIZ ── */
  const q = quizData[currentQ];
  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20 }}>Test My Knowledge</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Question {currentQ + 1} of {quizData.length}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary)' }}>{score}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Question {currentQ + 1}
        </p>
        <h3 style={{ fontSize: 20, lineHeight: 1.5, marginBottom: 28 }}>{q.question}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options && q.options.map((opt, idx) => {
            let cls = 'quiz-option';
            if (selected) {
              if (opt === q.answer) cls += ' correct';
              else if (opt === selected && opt !== q.answer) cls += ' wrong';
            }
            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={!!selected}
              >
                <span className="opt-letter">{LETTERS[idx]}</span>
                {opt}
              </button>
            );
          })}
          {!q.options && <p style={{ color: '#ef4444' }}>Invalid question data. Please skip or restart.</p>}
        </div>
      </div>

      {/* Next button */}
      {selected && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={handleNext}>
            {currentQ + 1 === quizData.length ? (
              <><Trophy size={16} /> See Results</>
            ) : (
              <>Next Question <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
