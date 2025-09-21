import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import FlashcardStats from '../components/flashcard/FlashcardStats';
import Navbar from '../components/layout/Navbar';
import ProgressBar from '../components/ui/ProgressBar';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Set up Modal for accessibility
Modal.setAppElement('#root');

/**
 * PUBLIC_INTERFACE
 * Subject view component showing topics in sidebar and flashcards in main area
 */
function SubjectView() {
  // ... [Previous state and hooks remain the same until the return statement]
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Topic modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  // Flashcard modal state
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  
  // Focused flashcard modal state
  const [focusedCard, setFocusedCard] = useState(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedFrontText, setEditedFrontText] = useState('');
  const [editedBackText, setEditedBackText] = useState('');
  const [theme, setTheme] = useState('light');

  // ... [Previous useEffects and handlers remain the same]

  // Calculate success rate data
  const successRateData = React.useMemo(() => {
    if (flashcards.length === 0) return null;
    
    const totalCorrect = flashcards.reduce((sum, card) => sum + (card.correctCount || 0), 0);
    const totalIncorrect = flashcards.reduce((sum, card) => sum + (card.incorrectCount || 0), 0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    
    return {
      totalCorrect,
      totalAttempts,
      successRate
    };
  }, [flashcards]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ... [Previous methods remain the same]

  return (
    <div className="App">
      <Navbar theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />

      {/* Main Content with Sidebar */}
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
              Topics
            </h2>
            {userType === 'free' && topics.length >= 3 ? (
              <button
                className="btn-ghost"
                style={{
                  padding: '6px 10px',
                  fontSize: '14px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
                disabled
                title="Upgrade to Premium to create more topics"
              >
                + New Topic
              </button>
            ) : (
              <button
                onClick={() => setIsTopicModalOpen(true)}
                className="btn-ghost"
                style={{
                  padding: '6px 10px',
                  fontSize: '14px'
                }}
              >
                + New Topic
              </button>
            )}
          </div>

          {/* Topics List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => setSelectedTopic(null)}
              className="btn-ghost"
              style={{
                justifyContent: 'flex-start',
                fontWeight: '600',
                color: !selectedTopic ? 'var(--primary)' : 'var(--text)'
              }}
            >
              All Topics
            </button>
            {topics.map(topic => (
              <div
                key={topic.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <button
                  onClick={() => setSelectedTopic(topic)}
                  className="btn-ghost"
                  style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    fontWeight: '600',
                    color: selectedTopic?.id === topic.id ? 'var(--primary)' : 'var(--text)'
                  }}
                >
                  {topic.title}
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${topic.title}"?`)) {
                      try {
                        await deleteDoc(doc(db, `users/${user.uid}/subjects/${subjectId}/topics/${topic.id}`));
                        setTopics(prev => prev.filter(t => t.id !== topic.id));
                        if (selectedTopic?.id === topic.id) {
                          setSelectedTopic(null);
                        }
                      } catch (error) {
                        console.error("Error deleting topic:", error);
                      }
                    }
                  }}
                  className="btn-ghost"
                  style={{
                    padding: '6px',
                    minWidth: 'unset',
                    color: 'var(--error)',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0'}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ padding: '24px' }}>
          <div className="container">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                {/* Topics limit progress for free users */}
                {userType === 'free' && (
                  <ProgressBar
                    value={topics.length}
                    maxValue={3}
                    label={`${topics.length}/3 Topics Used`}
                    error={topics.length >= 3}
                    secondaryLabel={topics.length >= 3 ? "Topic limit reached" : undefined}
                  />
                )}
                
                {/* Success rate progress for free users */}
                {userType === 'free' && successRateData && (
                  <ProgressBar
                    value={successRateData.totalCorrect}
                    maxValue={successRateData.totalAttempts}
                    label={`Success Rate: ${successRateData.successRate}%`}
                  />
                )}
                
                <h1 className="section-title">
                  {selectedTopic ? selectedTopic.title : 'All Flashcards'}
                </h1>
              </div>
              
              {topics.length === 0 && (
                <button 
                  className="btn-primary"
                  onClick={() => setIsTopicModalOpen(true)}
                >
                  + Create Topic
                </button>
              )}
              {topics.length > 0 && selectedTopic && (
                <button 
                  className="btn-primary"
                  onClick={() => setIsFlashcardModalOpen(true)}
                >
                  + Create Flashcard
                </button>
              )}
            </div>

            {/* Rest of the component remains the same */}
            {/* ... [Previous JSX for flashcards grid and modals] */}
          </div>
        </main>
      </div>

      {/* Previous modals remain the same */}
    </div>
  );
}

export default SubjectView;
