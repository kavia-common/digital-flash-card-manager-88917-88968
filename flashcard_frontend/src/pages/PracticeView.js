import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * PUBLIC_INTERFACE
 * Practice view component for reviewing flashcards
 * Displays cards in a practice session format with flip animation
 */
function PracticeView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subjectId, topicId } = useParams();
  
  const [subject, setSubject] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerStats, setAnswerStats] = useState({});
  const [answerFeedback, setAnswerFeedback] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch subject details
        const subjectDoc = await getDoc(doc(db, `users/${user.uid}/subjects/${subjectId}`));
        if (!subjectDoc.exists()) {
          navigate('/home');
          return;
        }
        setSubject({ id: subjectDoc.id, ...subjectDoc.data() });

        // Fetch flashcards
        let flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
        let q = flashcardsRef;
        
        if (topicId && topicId !== 'all') {
          q = query(flashcardsRef, where("topicId", "==", topicId));
        }

        const snapshot = await getDocs(q);
        const cards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Shuffle the cards
        const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffledCards);

        // Initialize answer stats
        const initialStats = {};
        shuffledCards.forEach(card => {
          initialStats[card.id] = { correct: 0, incorrect: 0 };
        });
        setAnswerStats(initialStats);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError('Failed to load practice session');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, subjectId, topicId, navigate]);

  const handleAnswer = (isCorrect) => {
    const currentCard = flashcards[currentCardIndex];
    
    // Show feedback animation
    setAnswerFeedback(isCorrect);
    
    // Update stats
    setAnswerStats(prev => ({
      ...prev,
      [currentCard.id]: {
        correct: prev[currentCard.id].correct + (isCorrect ? 1 : 0),
        incorrect: prev[currentCard.id].incorrect + (isCorrect ? 0 : 1)
      }
    }));

    // Wait for feedback animation before advancing
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // Optional: Loop back to start
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
      setAnswerFeedback(null);
    }, 700);
  };

  if (isLoading) {
    return (
      <div className="App">
        <nav className="nav">
          <div className="nav-inner container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link 
                to={`/subjects/${subjectId}`}
                className="btn-ghost"
                style={{
                  padding: '8px',
                  minWidth: 'unset',
                  color: 'var(--text)'
                }}
              >
                ← Back
              </Link>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Loading...
              </h1>
            </div>
          </div>
        </nav>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          minHeight: 'calc(100vh - 60px)',
        }}>
          <aside style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            <div style={{ color: 'var(--muted)' }}>Loading...</div>
          </aside>
          <main style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            color: 'var(--muted)'
          }}>
            Loading practice session...
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <nav className="nav">
          <div className="nav-inner container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link 
                to={`/subjects/${subjectId}`}
                className="btn-ghost"
                style={{
                  padding: '8px',
                  minWidth: 'unset',
                  color: 'var(--text)'
                }}
              >
                ← Back
              </Link>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Error
              </h1>
            </div>
          </div>
        </nav>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          minHeight: 'calc(100vh - 60px)',
        }}>
          <aside style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            <div style={{ color: 'var(--error)' }}>Failed to load flashcards</div>
          </aside>
          <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '48px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px' }}>😕</div>
            <h2 style={{ margin: 0, color: 'var(--error)' }}>
              {error}
            </h2>
            <Link to={`/subjects/${subjectId}`} className="btn-primary">
              Return to Subject
            </Link>
          </main>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="App">
        <nav className="nav">
          <div className="nav-inner container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link 
                to={`/subjects/${subjectId}`}
                className="btn-ghost"
                style={{
                  padding: '8px',
                  minWidth: 'unset',
                  color: 'var(--text)'
                }}
              >
                ← Back
              </Link>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {subject?.title || 'Practice'}
              </h1>
            </div>
          </div>
        </nav>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          minHeight: 'calc(100vh - 60px)',
        }}>
          <aside style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            <div style={{ color: 'var(--muted)' }}>No flashcards available</div>
          </aside>
          <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '48px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px' }}>📝</div>
            <h2 style={{ margin: '0 0 8px' }}>No flashcards available</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--muted)' }}>
              Create some flashcards to start practicing
            </p>
            <Link to={`/subjects/${subjectId}`} className="btn-primary">
              Return to Subject
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];
  const currentStats = answerStats[currentCard.id] || { correct: 0, incorrect: 0 };
  const totalAttempts = currentStats.correct + currentStats.incorrect;
  const successRate = totalAttempts > 0 ? (currentStats.correct / totalAttempts) * 100 : 0;

  return (
    <div className="App">
      <nav className="nav">
        <div className="nav-inner container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              to={`/subjects/${subjectId}`}
              className="btn-ghost"
              style={{
                padding: '8px',
                minWidth: 'unset',
                color: 'var(--text)'
              }}
            >
              ← Back
            </Link>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {subject?.title || 'Practice'} ({currentCardIndex + 1}/{flashcards.length})
            </h1>
          </div>
        </div>
      </nav>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        minHeight: 'calc(100vh - 60px)',
      }}>
        {/* Sidebar */}
        <aside style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-color)',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0
            }}>
              Flashcards
            </h2>
            <span className="pill" style={{
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {currentCardIndex + 1} / {flashcards.length}
            </span>
          </div>

          {/* Flashcards List - Now non-interactive */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {flashcards.map((card, index) => {
              const stats = answerStats[card.id];
              const total = stats ? stats.correct + stats.incorrect : 0;
              
              return (
                <div
                  key={card.id}
                  style={{
                    position: 'relative',
                    padding: '12px',
                    fontWeight: '600',
                    color: currentCardIndex === index ? 'var(--primary)' : 'var(--text)',
                    background: currentCardIndex === index 
                      ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                      : 'var(--surface)',
                    border: '1px solid ' + (currentCardIndex === index
                      ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                      : 'var(--border-color)'),
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                    minHeight: '48px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <span style={{
                      color: 'var(--muted)',
                      fontSize: '14px',
                      minWidth: '24px'
                    }}>
                      {index + 1}.
                    </span>
                    {card.frontText}
                  </div>
                  {total > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: '#eee',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(stats.correct / total) * 100}%`,
                        background: 'var(--success)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ 
          padding: '24px',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Card Display */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '400px',
            perspective: '1000px',
            marginBottom: '24px'
          }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                transition: 'transform 0.6s, background-color 0.3s ease',
                cursor: 'pointer',
                background: answerFeedback === true 
                  ? 'color-mix(in srgb, var(--success) 10%, var(--surface))'
                  : answerFeedback === false
                    ? 'color-mix(in srgb, var(--error) 10%, var(--surface))'
                    : 'var(--surface)',
              }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'inherit',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  textAlign: 'center'
                }}>
                  {currentCard.frontText}
                </h2>
                {totalAttempts > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    color: 'var(--muted)'
                  }}>
                    Success rate: {successRate.toFixed(0)}% ({currentStats.correct}/{totalAttempts})
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'inherit',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotateY(180deg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '20px',
                  textAlign: 'center'
                }}>
                  {currentCard.backText}
                </p>
              </div>
            </div>
          </div>

          {/* Answer Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => handleAnswer(false)}
              className="btn-ghost"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                color: 'var(--error)',
                borderColor: 'var(--error)'
              }}
            >
              Mark Incorrect
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: 'var(--success)',
                borderColor: 'var(--success)'
              }}
            >
              Mark Correct
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PracticeView;
