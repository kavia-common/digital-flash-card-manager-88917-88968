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
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError('Failed to load practice session');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, subjectId, topicId, navigate]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    }, 300);
  };

  const handlePreviousCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => 
        prev === 0 ? flashcards.length - 1 : prev - 1
      );
    }, 300);
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
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 60px)',
          color: 'var(--muted)'
        }}>
          Loading practice session...
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
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

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

      <main style={{ padding: '24px' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
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
                transition: 'transform 0.6s',
                cursor: 'pointer'
              }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'var(--surface)',
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
              </div>

              {/* Back Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'var(--surface)',
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

          {/* Navigation Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <button
              onClick={handlePreviousCard}
              className="btn-ghost"
              style={{
                padding: '12px 24px',
                fontSize: '16px'
              }}
            >
              ← Previous
            </button>
            <button
              onClick={handleNextCard}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '16px'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PracticeView;
