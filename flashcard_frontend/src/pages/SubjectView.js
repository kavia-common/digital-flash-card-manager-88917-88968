import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import FlashcardStats from '../components/flashcard/FlashcardStats';
import Navbar from '../components/layout/Navbar';
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

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Helper functions for navigation
  const getFocusedCardIndex = () => {
    return flashcards.findIndex(card => card.id === focusedCard?.id);
  };

  const navigateCards = (direction) => {
    const currentIndex = getFocusedCardIndex();
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % flashcards.length
      : (currentIndex - 1 + flashcards.length) % flashcards.length;
    setFocusedCard(flashcards[newIndex]);
    setIsFlipped(false);
  };

  const handleEditCard = async () => {
    if (!focusedCard) return;
    setIsSubmitting(true);

    try {
      const cardRef = doc(db, `users/${user.uid}/subjects/${subjectId}/flashcards/${focusedCard.id}`);
      await updateDoc(cardRef, {
        frontText: editedFrontText.trim(),
        backText: editedBackText.trim()
      });

      setFlashcards(prev => prev.map(card => 
        card.id === focusedCard.id 
          ? { ...card, frontText: editedFrontText.trim(), backText: editedBackText.trim() }
          : card
      ));

      setIsEditMode(false);
      setFocusedCard(prev => ({
        ...prev,
        frontText: editedFrontText.trim(),
        backText: editedBackText.trim()
      }));
    } catch (error) {
      console.error("Error updating flashcard:", error);
      setError('Failed to update flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!focusedCard) return;
    setIsSubmitting(true);

    try {
      const cardRef = doc(db, `users/${user.uid}/subjects/${subjectId}/flashcards/${focusedCard.id}`);
      await deleteDoc(cardRef);
      setFlashcards(prev => prev.filter(card => card.id !== focusedCard.id));
      setIsFocusModalOpen(false);
      setFocusedCard(null);
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      setError('Failed to delete flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubjectAndTopics = async () => {
      try {
        // Fetch subject details
        const subjectDoc = await getDoc(doc(db, `users/${user.uid}/subjects/${subjectId}`));
        if (!subjectDoc.exists()) {
          navigate('/home');
          return;
        }
        setSubject({ id: subjectDoc.id, ...subjectDoc.data() });

        // Fetch topics
        const topicsSnapshot = await getDocs(collection(db, `users/${user.uid}/subjects/${subjectId}/topics`));
        const topicsData = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTopics(topicsData);
      } catch (error) {
        console.error("Error fetching subject and topics:", error);
      }
    };

    fetchSubjectAndTopics();
  }, [user, subjectId, navigate]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user || !subjectId) return;

      try {
        let flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
        let q = flashcardsRef;
        
        if (selectedTopic) {
          q = query(flashcardsRef, where("topicId", "==", selectedTopic.id));
        }

        const snapshot = await getDocs(q);
        const cards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFlashcards(cards);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };

    fetchFlashcards();
  }, [user, subjectId, selectedTopic]);

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!frontText.trim()) {
      setError('Please provide text for the front side');
      return;
    }
    if (!backText.trim()) {
      setError('Please provide text for the back side');
      return;
    }

    setIsSubmitting(true);

    try {
      const flashcardData = {
        frontText: frontText.trim(),
        backText: backText.trim(),
        topicId: selectedTopic?.id || null,
      };

      if (editingFlashcard) {
        // Update existing flashcard
        const cardRef = doc(db, `users/${user.uid}/subjects/${subjectId}/flashcards/${editingFlashcard.id}`);
        await updateDoc(cardRef, flashcardData);
        
        setFlashcards(prev => prev.map(card => 
          card.id === editingFlashcard.id 
            ? { ...card, ...flashcardData }
            : card
        ));
      } else {
        // Create new flashcard
        const flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
        const newFlashcard = {
          ...flashcardData,
          createdAt: new Date().toISOString(),
          correctCount: 0,
          incorrectCount: 0,
          totalAttempts: 0
        };

        const docRef = await addDoc(flashcardsRef, newFlashcard);
        setFlashcards(prev => [...prev, { id: docRef.id, ...newFlashcard }]);
      }

      // Reset form
      setFrontText('');
      setBackText('');
      setIsFlashcardModalOpen(false);
      setEditingFlashcard(null);
    } catch (error) {
      console.error("Error saving flashcard:", error);
      setError('Failed to save flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newTopicName.trim()) {
      setError('Please enter a topic name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate topic names
      const topicsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/topics`);
      const q = query(topicsRef, where("title", "==", newTopicName.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('A topic with this name already exists');
        setIsSubmitting(false);
        return;
      }

      // Create new topic
      const newTopic = {
        title: newTopicName.trim(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(topicsRef, newTopic);
      setTopics(prev => [...prev, { id: docRef.id, ...newTopic }]);
      setNewTopicName('');
      setIsTopicModalOpen(false);
    } catch (error) {
      console.error("Error creating topic:", error);
      setError('Failed to create topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom styles for Modal following Ocean Professional theme
  const modalStyles = {
    focusedCard: {
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        padding: '0',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      },
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
      },
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      maxWidth: '400px',
      width: '90%',
      padding: '24px',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-color)',
      background: 'var(--surface)',
      boxShadow: 'var(--shadow-lg)',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };

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
                {/* Show progress bar for free users */}
                {userType === 'free' && flashcards.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--primary)'
                      }}>
                        {(() => {
                          const totalCorrect = flashcards.reduce((sum, card) => sum + (card.correctCount || 0), 0);
                          const totalAttempts = flashcards.reduce((sum, card) => 
                            sum + ((card.correctCount || 0) + (card.incorrectCount || 0)), 0);
                          const successRate = totalAttempts > 0 
                            ? Math.round((totalCorrect / totalAttempts) * 100) 
                            : 0;
                          return `Success Rate: ${successRate}%`;
                        })()}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      background: 'color-mix(in srgb, var(--text) 10%, transparent)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      {(() => {
                        const totalCorrect = flashcards.reduce((sum, card) => sum + (card.correctCount || 0), 0);
                        const totalIncorrect = flashcards.reduce((sum, card) => sum + (card.incorrectCount || 0), 0);
                        const total = totalCorrect + totalIncorrect;
                        const correctPercentage = total > 0 ? (totalCorrect / total) * 100 : 0;
                        const incorrectPercentage = total > 0 ? (totalIncorrect / total) * 100 : 0;
                        
                        return (
                          <>
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${correctPercentage}%`,
                              background: 'var(--success)',
                              transition: 'width 0.3s ease-in-out',
                            }} />
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: `${incorrectPercentage}%`,
                              background: 'var(--error)',
                              transition: 'width 0.3s ease-in-out',
                            }} />
                          </>
                        );
                      })()}
                    </div>
                  </div>
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

            {/* Flashcards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {flashcards.length > 0 ? (
                flashcards.map(card => (
                  <div
                    key={card.id}
                    className="feature"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      minHeight: '200px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setFocusedCard(card);
                      setIsFocusModalOpen(true);
                      setIsFlipped(false);
                      setEditedFrontText(card.frontText);
                      setEditedBackText(card.backText);
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        {/* Topic Chip */}
                        {card.topicId && (
                          <div className="pill" style={{
                            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {topics.find(t => t.id === card.topicId)?.title || 'Unknown Topic'}
                          </div>
                        )}
=======
                        <button 
                          className="btn-ghost"
                          style={{
                            padding: '6px',
                            minWidth: 'unset',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFlashcard(card);
                            setFrontText(card.frontText);
                            setBackText(card.backText);
                            setIsFlashcardModalOpen(true);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                      
                      {/* Front Text */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        {card.frontText ? (
                          <h3 className="feature-title" style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            {card.frontText}
                          </h3>
                        ) : (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--muted)',
                          }}>
                            <div className="feature-icon">📝</div>
                            <span>Empty Card</span>
                          </div>
                        )}
                      </div>
                      {/* Removed individual card stats */}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--muted)',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                    📝
                  </div>
                  <h3 style={{ 
                    margin: '0 0 8px',
                    color: 'var(--text)',
                    fontSize: '18px'
                  }}>
                    No flashcards yet
                  </h3>
                  <p style={{ margin: '0 0 24px' }}>
                    Create your first flashcard to start learning
                  </p>
                  {topics.length === 0 ? (
                    <button className="btn-primary" onClick={() => setIsTopicModalOpen(true)}>
                      Create Topic
                    </button>
                  ) : (
                    selectedTopic && (
                      <button className="btn-primary" onClick={() => setIsFlashcardModalOpen(true)}>
                        Create Flashcard
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Flashcard Modal */}
      <Modal
        isOpen={isFlashcardModalOpen}
        onRequestClose={() => {
          setIsFlashcardModalOpen(false);
          setFrontText('');
          setBackText('');
          setError('');
        }}
        style={modalStyles}
        contentLabel="Create New Flashcard"
      >
        <h2 style={{ 
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {editingFlashcard ? 'Edit Flashcard' : 'Create New Flashcard'}
        </h2>
        <form onSubmit={handleCreateFlashcard}>
          {/* Front Side */}
          <div style={{ marginBottom: '24px' }}>
            <label 
              style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600'
              }}
            >
              Front Side
            </label>
            <input
              type="text"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Enter front side text"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--muted)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
              required
            />
          </div>

          {/* Back Side */}
          <div style={{ marginBottom: '24px' }}>
            <label 
              style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600'
              }}
            >
              Back Side
            </label>
            <textarea
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="Enter back side text"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--muted)',
                background: 'var(--surface)',
                color: 'var(--text)',
                minHeight: '100px',
                resize: 'vertical'
              }}
              required
            />
          </div>
          
          {error && (
            <div style={{ 
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
            }}>
              {error}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsFlashcardModalOpen(false);
                setFrontText('');
                setBackText('');
                setError('');
              }}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingFlashcard ? 'Save Changes' : 'Create Flashcard'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onRequestClose={() => {
          setIsTopicModalOpen(false);
          setNewTopicName('');
          setError('');
        }}
        style={modalStyles}
        contentLabel="Create New Topic"
      >
        <h2 style={{ 
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Create New Topic
        </h2>
        <form onSubmit={handleCreateTopic}>
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="topicName" 
              style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600'
              }}
            >
              Topic Name
            </label>
            <input
              id="topicName"
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Enter topic name"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--muted)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
              required
            />
          </div>
          
          {error && (
            <div style={{ 
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
            }}>
              {error}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsTopicModalOpen(false);
                setNewTopicName('');
                setError('');
              }}
              className="btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Focused Flashcard Modal */}
      <Modal
        isOpen={isFocusModalOpen}
        onRequestClose={() => {
          setIsFocusModalOpen(false);
          setFocusedCard(null);
          setIsFlipped(false);
          setIsEditMode(false);
          setError('');
        }}
        style={{
          content: {
            ...modalStyles.focusedCard.content,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '24px'
          },
          overlay: modalStyles.focusedCard.overlay
        }}
        contentLabel="View Flashcard"
      >
        {focusedCard && (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            perspective: '1000px',
          }}>
            {/* Card Container */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '400px',
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                  transition: 'transform 0.6s',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => !isEditMode && setIsFlipped(!isFlipped)}
              >
              {/* Front Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedFrontText}
                      onChange={(e) => setEditedFrontText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '24px',
                        textAlign: 'center',
                        border: '1px solid var(--muted)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  ) : (
                    <h2 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      {focusedCard.frontText}
                    </h2>
                  )}
                </div>
              </div>

              {/* Back Side */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  padding: '24px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'var(--surface)',
                }}>
                  {isEditMode ? (
                    <textarea
                      value={editedBackText}
                      onChange={(e) => setEditedBackText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        minHeight: '200px',
                        textAlign: 'center',
                        border: '1px solid var(--muted)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        resize: 'vertical',
                      }}
                    />
                  ) : (
                    <p style={{
                      margin: 0,
                      fontSize: '18px',
                      textAlign: 'center',
                    }}>
                      {focusedCard.backText}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              position: 'absolute',
              top: '200px',
              left: '0',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}>
              <button
                onClick={() => navigateCards('prev')}
                className="btn-ghost"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                }}
                aria-label="Previous card"
              >
                ←
              </button>
            </div>
            <div style={{
              position: 'absolute',
              top: '200px',
              right: '0',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}>
              <button
                onClick={() => navigateCards('next')}
                className="btn-ghost"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                }}
                aria-label="Next card"
              >
                →
              </button>
            </div>

            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '24px'
            }}>
              {isEditMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditedFrontText(focusedCard.frontText);
                      setEditedBackText(focusedCard.backText);
                    }}
                    className="btn-ghost"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditCard}
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingFlashcard(focusedCard);
                      setFrontText(focusedCard.frontText);
                      setBackText(focusedCard.backText);
                      setIsFlashcardModalOpen(true);
                      setIsFocusModalOpen(false);
                    }}
                    className="btn-ghost"
                    style={{
                      color: 'var(--primary)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteCard}
                    className="btn-ghost"
                    style={{
                      color: 'var(--error)',
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SubjectView;
