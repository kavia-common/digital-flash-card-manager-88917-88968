import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import ProgressBar from '../components/ui/ProgressBar';
import CreateTopicModal from '../modals/CreateTopicModal';
import CreateFlashcardModal from '../modals/CreateFlashcardModal';
import ViewFlashcardModal from '../modals/ViewFlashcardModal';
import FlashcardGrid from '../components/flashcard/FlashcardGrid';
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
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Make sure react-modal is configured for accessibility
Modal.setAppElement('#root');

/**
 * PUBLIC_INTERFACE
 * SubjectView shows topics for a subject and manages creating topics and flashcards.
 * It restores proper functionality for the "New Topic" button by wiring it to a modal and Firestore create flow.
 */
function SubjectView() {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const { subjectId } = useParams();

  // Theme
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Subject, topics, flashcards
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicError, setTopicError] = useState('');
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // Flashcard Modals
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Load subject, topics, and flashcards
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        // Subject
        const subjectDocRef = doc(db, `users/${user.uid}/subjects/${subjectId}`);
        const subjectSnap = await getDoc(subjectDocRef);
        if (!subjectSnap.exists()) {
          navigate('/home');
          return;
        }
        const subjectData = { id: subjectSnap.id, ...subjectSnap.data() };
        setSubject(subjectData);

        // Topics
        const topicsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/topics`);
        const topicsSnap = await getDocs(query(topicsRef));
        const topicsList = topicsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTopics(topicsList);

        // Flashcards
        const cardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
        const cardsSnap = await getDocs(query(cardsRef));
        const cardsList = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFlashcards(cardsList);
      } catch (err) {
        console.error('Failed to load subject data:', err);
      }
    };

    loadData();
  }, [user, subjectId, navigate]);

  // PUBLIC_INTERFACE
  async function createTopic(topicName) {
    /**
     * Create a new topic under the current subject with validation:
     * - Free users limited to 3 topics
     * - No duplicate topic titles
     */
    if (!user) throw new Error('Not authenticated');
    if (!subjectId) throw new Error('No subject selected');

    if (userType === 'free' && topics.length >= 3) {
      throw new Error('Free users can create up to 3 topics. Please upgrade to create more.');
    }

    const name = topicName.trim();
    if (!name) {
      throw new Error('Please enter a topic name');
    }

    // Duplicate check
    const topicsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    const q = query(topicsRef, where('title', '==', name));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error('A topic with this name already exists');
    }

    // Create
    const newTopic = {
      title: name,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(topicsRef, newTopic);
    const created = { id: docRef.id, ...newTopic };
    setTopics(prev => [...prev, created]);
    return created;
  }

  // PUBLIC_INTERFACE
  async function handleCreateTopic(topicName) {
    /**
     * Wrapper to manage UI concerns when creating a topic via the modal.
     */
    setTopicError('');
    setIsSubmittingTopic(true);
    try {
      const topic = await createTopic(topicName);
      setIsTopicModalOpen(false);
      setSelectedTopic(topic);
    } catch (err) {
      setTopicError(err.message || 'Failed to create topic');
    } finally {
      setIsSubmittingTopic(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleOpenView(card) {
    setViewingCard(card);
    setIsViewModalOpen(true);
  }

  // PUBLIC_INTERFACE
  async function handleDeleteCard(card) {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/subjects/${subjectId}/flashcards/${card.id}`));
    setFlashcards(prev => prev.filter(c => c.id !== card.id));
    setIsViewModalOpen(false);
    setViewingCard(null);
  }

  const successRateData = useMemo(() => {
    if (flashcards.length === 0) return null;
    const totalCorrect = flashcards.reduce((sum, c) => sum + (c.correctCount || 0), 0);
    const totalIncorrect = flashcards.reduce((sum, c) => sum + (c.incorrectCount || 0), 0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    return { totalCorrect, totalAttempts, successRate };
  }, [flashcards]);

  // Filtered flashcards by topic
  const shownCards = useMemo(() => {
    if (!selectedTopic) return flashcards;
    return flashcards.filter(c => c.topicId === selectedTopic.id);
  }, [flashcards, selectedTopic]);

  return (
    <div className="App">
      <Navbar theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border-color)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Topics</h2>

            {userType === 'free' && topics.length >= 3 ? (
              <button
                className="btn-ghost"
                style={{ padding: '6px 10px', fontSize: '14px', opacity: 0.5, cursor: 'not-allowed' }}
                disabled
                title="Upgrade to Premium to create more topics"
              >
                + New Topic
              </button>
            ) : (
              <button
                onClick={() => {
                  setTopicError('');
                  setIsTopicModalOpen(true);
                }}
                className="btn-ghost"
                style={{ padding: '6px 10px', fontSize: '14px' }}
              >
                + New Topic
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setSelectedTopic(null)}
              className="btn-ghost"
              style={{
                justifyContent: 'flex-start',
                fontWeight: '600',
                color: !selectedTopic ? 'var(--primary)' : 'var(--text)',
              }}
            >
              All Topics
            </button>
            {topics.map((topic) => (
              <div key={topic.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSelectedTopic(topic)}
                  className="btn-ghost"
                  style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    fontWeight: '600',
                    color: selectedTopic?.id === topic.id ? 'var(--primary)' : 'var(--text)',
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
                        setTopics((prev) => prev.filter((t) => t.id !== topic.id));
                        if (selectedTopic?.id === topic.id) {
                          setSelectedTopic(null);
                        }
                      } catch (error) {
                        console.error('Error deleting topic:', error);
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
                  onMouseEnter={(e) => (e.target.style.opacity = '1')}
                  onMouseLeave={(e) => (e.target.style.opacity = '0')}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: '24px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                {userType === 'free' && (
                  <ProgressBar
                    value={topics.length}
                    maxValue={3}
                    label={`${topics.length}/3 Topics Used`}
                    error={topics.length >= 3}
                    secondaryLabel={topics.length >= 3 ? 'Topic limit reached' : undefined}
                  />
                )}
                {userType === 'free' && successRateData && (
                  <ProgressBar
                    value={successRateData.totalCorrect}
                    maxValue={successRateData.totalAttempts}
                    label={`Success Rate: ${successRateData.successRate}%`}
                  />
                )}

                <h1 className="section-title">{selectedTopic ? selectedTopic.title : 'All Flashcards'}</h1>
              </div>

              {topics.length === 0 ? (
                <button className="btn-primary" onClick={() => setIsTopicModalOpen(true)}>
                  + Create Topic
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setIsFlashcardModalOpen(true)} disabled={!selectedTopic}>
                  + Create Flashcard
                </button>
              )}
            </div>

            {/* Flashcards Grid */}
            {shownCards.length > 0 ? (
              <FlashcardGrid
                flashcards={shownCards}
                topics={topics}
                onCardClick={(card) => handleOpenView(card)}
                onCardEdit={(card) => {
                  setViewingCard(card);
                  setIsViewModalOpen(true);
                }}
              />
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--muted)',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '18px' }}>
                  {selectedTopic ? 'No flashcards in this topic' : 'No flashcards yet'}
                </h3>
                <p style={{ margin: '0 0 24px' }}>
                  {selectedTopic
                    ? 'Add your first flashcard to this topic to start practicing'
                    : 'Select a topic or create one to add flashcards'}
                </p>
                {topics.length === 0 ? (
                  <button onClick={() => setIsTopicModalOpen(true)} className="btn-primary">
                    + Create Topic
                  </button>
                ) : (
                  <button onClick={() => setIsFlashcardModalOpen(true)} className="btn-primary" disabled={!selectedTopic}>
                    + Create Flashcard
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => {
          setIsTopicModalOpen(false);
          setTopicError('');
        }}
        onSubmit={handleCreateTopic}
      />
      {topicError && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '20px',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)',
            zIndex: 1000,
          }}
        >
          {topicError}
        </div>
      )}

      {/* Create Flashcard Modal */}
      <CreateFlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onSubmit={async ({ frontText, backText }) => {
          if (!user || !selectedTopic) throw new Error('Select a topic first');
          const ref = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
          const newCard = {
            frontText,
            backText,
            topicId: selectedTopic.id,
            createdAt: new Date().toISOString(),
            correctCount: 0,
            incorrectCount: 0,
          };
          const created = await addDoc(ref, newCard);
          setFlashcards((prev) => [...prev, { id: created.id, ...newCard }]);
        }}
      />

      {/* View Flashcard Modal */}
      <ViewFlashcardModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingCard(null);
        }}
        card={viewingCard}
        onEdit={() => {
          setIsViewModalOpen(false);
          setIsFlashcardModalOpen(true);
        }}
        onDelete={() => viewingCard && handleDeleteCard(viewingCard)}
        onNext={() => {
          const list = shownCards;
          if (!viewingCard || list.length === 0) return;
          const idx = list.findIndex((c) => c.id === viewingCard.id);
          const next = list[(idx + 1) % list.length];
          setViewingCard(next);
        }}
        onPrev={() => {
          const list = shownCards;
          if (!viewingCard || list.length === 0) return;
          const idx = list.findIndex((c) => c.id === viewingCard.id);
          const prev = list[(idx - 1 + list.length) % list.length];
          setViewingCard(prev);
        }}
      />
    </div>
  );
}

export default SubjectView;
