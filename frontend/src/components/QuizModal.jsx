import React, { useState } from 'react';
import axios from 'axios';
import { HelpCircle, X, Check, ArrowRight } from 'lucide-react';

const QuizModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState('setup'); // 'setup', 'loading', 'quiz', 'result', 'error'
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  
  const [availableNotes, setAvailableNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const openSetup = async () => {
    setIsOpen(true);
    setPhase('setup');
    setSelectedNotes([]);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/notes`, config);
      setAvailableNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startQuiz = async () => {
    setPhase('loading');
    setError('');
    setQuizData([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/quiz`, { noteIds: selectedNotes }, config);
      
      if (data && data.length > 0) {
        setQuizData(data);
        setPhase('quiz');
      } else {
        setError('Not enough notes to generate a quiz.');
        setPhase('error');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz.');
      setPhase('error');
    }
  };

  const handleOptionClick = (option) => {
    if (selectedOption) return; // Prevent multiple clicks
    setSelectedOption(option);
    
    if (option === quizData[currentQuestion].answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 < quizData.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setPhase('result');
    }
  };

  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId) 
        : [...prev, noteId]
    );
  };

  return (
    <>
      <button onClick={openSetup} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <HelpCircle size={18} /> Test My Knowledge
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass animate-fade-in" style={{ padding: '32px', width: '90%', maxWidth: '600px', borderRadius: 'var(--radius-lg)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            {phase === 'setup' ? (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ marginBottom: 12 }}>Select Notes for Quiz</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
                  Choose which notes you want to be quizzed on. If none are selected, all notes will be used.
                </p>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availableNotes.map(note => (
                      <label key={note._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedNotes.includes(note._id)}
                          onChange={() => toggleNoteSelection(note._id)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>{note.title || 'Untitled Note'}</span>
                      </label>
                    ))}
                    {availableNotes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No notes uploaded yet.</p>}
                  </div>
                </div>
                <button onClick={startQuiz} className="btn btn-primary" style={{ width: '100%' }}>
                  Generate Quiz
                </button>
              </div>
            ) : phase === 'loading' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span className="typing-dot" style={{ animation: 'blink 1s infinite' }}>...</span>
                <h3>Generating Quiz from your notes...</h3>
              </div>
            ) : phase === 'error' ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                <p>{error}</p>
                <button onClick={openSetup} className="btn btn-outline" style={{ marginTop: 16 }}>Try Again</button>
              </div>
            ) : phase === 'result' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h2 className="text-gradient">Quiz Complete!</h2>
                <p style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0' }}>{score} / {quizData.length}</p>
                <button onClick={() => setIsOpen(false)} className="btn btn-outline">Close</button>
              </div>
            ) : phase === 'quiz' && quizData.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>Question {currentQuestion + 1} of {quizData.length}</span>
                  <span>Score: {score}</span>
                </div>
                
                <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>{quizData[currentQuestion].question}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {quizData[currentQuestion].options.map((opt, idx) => {
                    let btnStyle = { textAlign: 'left', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', transition: 'var(--transition)' };
                    
                    if (selectedOption) {
                      if (opt === quizData[currentQuestion].answer) {
                        btnStyle.background = 'rgba(16, 185, 129, 0.2)'; // Green
                        btnStyle.borderColor = '#10b981';
                      } else if (opt === selectedOption && opt !== quizData[currentQuestion].answer) {
                        btnStyle.background = 'rgba(239, 68, 68, 0.2)'; // Red
                        btnStyle.borderColor = '#ef4444';
                      }
                    }

                    return (
                      <button 
                        key={idx} 
                        style={btnStyle}
                        onClick={() => handleOptionClick(opt)}
                        disabled={!!selectedOption}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {selectedOption && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button onClick={handleNext} className="btn btn-primary">
                      {currentQuestion + 1 === quizData.length ? 'See Results' : 'Next Question'} <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default QuizModal;
