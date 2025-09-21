import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import FlashcardStats from '../components/flashcard/FlashcardStats';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import CreateTopicModal from '../modals/CreateTopicModal';
import CreateFlashcardModal from '../modals/CreateFlashcardModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';
import UpgradeModal from '../modals/UpgradeModal';

// Set up Modal for accessibility
Modal.setAppElement('#root');

/**
 * PUBLIC_INTERFACE
 * Subject view component showing topics in sidebar and flashcards in main area
 */
function SubjectView() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Modal states
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Card states
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [focusedCard, setFocusedCard] = useState(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [editedFrontText, setEditedFrontText] = useState('');
  const [editedBackText, setEditedBackText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Topic modal state
  const [newTopicName, setNewTopicName] = useState('');

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

  const handleCreateTopic = async (topicName) => {
    if (userRole === 'free' && topics.length >= 1) {
      setIsTopicModalOpen(false);
      setUpgradeMessage('Free users can only create 1 topic per subject. Upgrade to Premium for unlimited topics!');
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate topic names
      const topicsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/topics`);
      const q = query(topicsRef, where("title", "==", topicName.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('A topic with this name already exists');
      }

      // Create new topic
      const newTopic = {
        title: topicName.trim(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(topicsRef, newTopic);
      setTopics(prev => [...prev, { id: docRef.id, ...newTopic }]);
      setNewTopicName('');
      setIsTopicModalOpen(false);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFlashcard = async (data) => {
    const currentTopicCards = flashcards.filter(f => f.topicId === selectedTopic?.id);
    
    if (userRole === 'free' && currentTopicCards.length >= 5 && !editingFlashcard) {
      setIsFlashcardModalOpen(false);
      setUpgradeMessage('Free users can only create 5 flashcards per topic. Upgrade to Premium for unlimited flashcards!');
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const flashcardData = {
        frontText: data.frontText.trim(),
        backText: data.backText.trim(),
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
        };

        const docRef = await addDoc(flashcardsRef, newFlashcard);
        setFlashcards(prev => [...prev, { id: docRef.id, ...newFlashcard }]);

        // Update subject card count
        const subjectRef = doc(db, `users/${user.uid}/subjects/${subjectId}`);
        await updateDoc(subjectRef, {
          cardCount: increment(1)
        });
      }

      setIsFlashcardModalOpen(false);
      setEditingFlashcard(null);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions for focused card
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

  // Modal styles
  const modalStyles = {
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
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              to="/home" 
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
              {subject?.title || 'Loading...'}
            </h1>
          </div>

          <Link
            to={`/subjects/${subjectId}/practice/${selectedTopic?.id || 'all'}`}
            className="btn-primary"
          >
            Practice
          </Link>
        </div>
      </nav>

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

            {userRole === 'free' && (
              <div style={{
                padding: '12px',
                background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                color: 'var(--muted)'
              }}>
                Free Plan: {topics.length}/1 topics used
              </div>
            )}

            {topics.map(topic => {
              const topicCards = flashcards.filter(f => f.topicId === topic.id);
              return (
                <div
                  key={topic.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
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
                      onClick={async () => {
                        if (window.confirm(`Delete "${topic.title}"?`)) {
                          await deleteDoc(doc(db, `users/${user.uid}/subjects/${subjectId}/topics/${topic.id}`));
                          setTopics(prev => prev.filter(t => t.id !== topic.id));
                          if (selectedTopic?.id === topic.id) {
                            setSelectedTopic(null);
                          }
                        }
                      }}
                      className="btn-ghost"
                      style={{
                        padding: '6px',
                        minWidth: 'unset',
                        color: 'var(--error)',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0'}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {userRole === 'free' && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      paddingLeft: '12px'
                    }}>
                      {topicCards.length}/5 cards used
                    </div>
                  )}
                </div>
              );
            })}
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
              <h1 className="section-title">
                {selectedTopic ? selectedTopic.title : 'All Flashcards'}
              </h1>
              
              {selectedTopic && (
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
                      cursor: 'pointer'
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      {card.topicId && (
                        <div className="pill">
                          {topics.find(t => t.id === card.topicId)?.title}
                        </div>
                      )}
                      <button 
                        className="btn-ghost"
                        style={{
                          padding: '6px',
                          minWidth: 'unset'
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
                    
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '16px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {card.frontText}
                      </h3>
                    </div>

                    <FlashcardStats 
                      correct={card.correctCount || 0}
                      incorrect={card.incorrectCount || 0}
                    />
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
                    {selectedTopic 
                      ? 'No flashcards in this topic yet'
                      : 'Select a topic to create flashcards'}
                  </h3>
                  <p style={{ margin: '0 0 24px' }}>
                    {selectedTopic
                      ? 'Create your first flashcard to start learning'
                      : 'Create a topic or select an existing one'}
                  </p>
                  {selectedTopic ? (
                    <button 
                      className="btn-primary"
                      onClick={() => setIsFlashcardModalOpen(true)}
                    >
                      Create Flashcard
                    </button>
                  ) : (
                    <button 
                      className="btn-primary"
                      onClick={() => setIsTopicModalOpen(true)}
                    >
                      Create Topic
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleCreateTopic}
        userRole={userRole}
        topicCount={topics.length}
        onUpgradeClick={() => {
          setIsTopicModalOpen(false);
          setUpgradeMessage('Free users can only create 1 topic per subject. Upgrade to Premium for unlimited topics!');
          setIsUpgradeModalOpen(true);
        }}
      />

      <CreateFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => {
          setIsFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        onSubmit={handleCreateFlashcard}
        initialData={editingFlashcard}
        userRole={userRole}
        cardCount={flashcards.filter(f => f.topicId === selectedTopic?.id).length}
        onUpgradeClick={() => {
          setIsFlashcardModalOpen(false);
          setUpgradeMessage('Free users can only create 5 flashcards per topic. Upgrade to Premium for unlimited flashcards!');
          setIsUpgradeModalOpen(true);
        }}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        message={upgradeMessage}
      />
    </div>
  );
}

export default SubjectView;
