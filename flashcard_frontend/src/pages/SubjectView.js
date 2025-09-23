import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import FlashcardStats from '../components/flashcard/FlashcardStats';
import Navbar from '../components/layout/Navbar';
import ProgressBar from '../components/ui/ProgressBar';
import CreateTopicModal from '../modals/CreateTopicModal';
import DeleteTopicModal from '../modals/DeleteTopicModal';
import CreateFlashcardModal from '../modals/CreateFlashcardModal';
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
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isCreateFlashcardModalOpen, setIsCreateFlashcardModalOpen] = useState(false);

  // Handle flashcard creation
  const handleCreateFlashcard = async ({ frontText, backText }) => {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedTopic) throw new Error('Please select a topic first');

      const newFlashcard = {
        frontText,
        backText,
        topicId: selectedTopic.id,
        createdAt: new Date().toISOString(),
        correctCount: 0,
        incorrectCount: 0
      };

      const flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
      const docRef = await addDoc(flashcardsRef, newFlashcard);

      // Update local state
      setFlashcards(prev => [...prev, { id: docRef.id, ...newFlashcard }]);

      // Update subject's card count
      const subjectRef = doc(db, `users/${user.uid}/subjects/${subjectId}`);
      await updateDoc(subjectRef, {
        cardCount: (subject?.cardCount || 0) + 1
      });
      setSubject(prev => ({
        ...prev,
        cardCount: (prev?.cardCount || 0) + 1
      }));

    } catch (error) {
      console.error("Error creating flashcard:", error);
      throw error;
    }
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch subject, topics, and flashcards data
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchData = async () => {
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

        // Fetch flashcards
        const flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
        const flashcardsSnapshot = await getDocs(flashcardsRef);
        const flashcardsData = flashcardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFlashcards(flashcardsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user, subjectId, navigate]);

  // Handle topic creation
  const handleCreateTopic = async (topicName) => {
    // Check topic limit for free users
    if (userType === 'free' && topics.length >= 3) {
      throw new Error('Free users can only create up to 3 topics. Please upgrade to create more.');
    }

    // Check for duplicate topic names
    const topicsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    const q = query(topicsRef, where("title", "==", topicName));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('A topic with this name already exists');
    }

    // Create new topic
    const newTopic = {
      title: topicName,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(topicsRef, newTopic);
    const topic = { id: docRef.id, ...newTopic };
    setTopics(prev => [...prev, topic]);
    setSelectedTopic(topic);
  };

  // Handle flashcard filtering
  const filteredFlashcards = selectedTopic
    ? flashcards.filter(card => card.topicId === selectedTopic.id)
    : flashcards;

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
                  onClick={(e) => {
                    e.stopPropagation();
                    setTopicToDelete(topic);
                    setIsDeleteTopicModalOpen(true);
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

          {userType === 'free' && (
            <ProgressBar
              value={topics.length}
              maxValue={3}
              label={`${topics.length}/3 Topics Used`}
              error={topics.length >= 3}
              secondaryLabel={topics.length >= 3 ? "Topic limit reached" : undefined}
              style={{ marginTop: '24px' }}
            />
          )}
        </aside>

        {/* Main Content Area */}
        <main style={{ padding: '24px' }}>
          <div className="container">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div>
                <h1 className="section-title">
                  {subject?.title} - {selectedTopic ? selectedTopic.title : 'All Topics'}
                </h1>
                <p className="section-subtitle">
                  {filteredFlashcards.length} flashcards
                </p>
              </div>
              <button
                onClick={() => setIsCreateFlashcardModalOpen(true)}
                className="btn-primary btn-lg"
                disabled={!selectedTopic}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>+</span>
                Create New Flashcard
              </button>
            </div>

            {!selectedTopic && (
              <div style={{
                padding: '12px',
                marginBottom: '24px',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--secondary) 20%, transparent)',
                color: 'var(--secondary)',
              }}>
                Please select a topic to create flashcards
              </div>
            )}

            {/* Flashcard Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {filteredFlashcards.map(flashcard => (
                <div
                  key={flashcard.id}
                  className="feature"
                  style={{
                    position: 'relative',
                    minHeight: '200px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    padding: '16px'
                  }}>
                    <h3 className="feature-title" style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      {flashcard.frontText}
                    </h3>
                    {topics.find(t => t.id === flashcard.topicId)?.title && (
                      <div className="pill">
                        {topics.find(t => t.id === flashcard.topicId)?.title}
                      </div>
                    )}
                    <FlashcardStats
                      correct={flashcard.correctCount || 0}
                      incorrect={flashcard.incorrectCount || 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleCreateTopic}
      />

      {/* Create Flashcard Modal */}
      <CreateFlashcardModal
        isOpen={isCreateFlashcardModalOpen}
        onClose={() => setIsCreateFlashcardModalOpen(false)}
        onSubmit={handleCreateFlashcard}
      />

      {/* Delete Topic Modal */}
      <DeleteTopicModal
        isOpen={isDeleteTopicModalOpen}
        onClose={() => {
          setIsDeleteTopicModalOpen(false);
          setTopicToDelete(null);
        }}
        onConfirm={async () => {
          try {
            // Delete all flashcards in the topic
            const flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
            const q = query(flashcardsRef, where("topicId", "==", topicToDelete.id));
            const snapshot = await getDocs(q);
            
            // Delete each flashcard
            await Promise.all(snapshot.docs.map(doc => 
              deleteDoc(doc.ref)
            ));

            // Update subject's card count
            const subjectRef = doc(db, `users/${user.uid}/subjects/${subjectId}`);
            await updateDoc(subjectRef, {
              cardCount: (subject?.cardCount || 0) - snapshot.docs.length
            });

            // Delete the topic
            await deleteDoc(doc(db, `users/${user.uid}/subjects/${subjectId}/topics/${topicToDelete.id}`));
            
            // Update local state
            setTopics(prev => prev.filter(t => t.id !== topicToDelete.id));
            if (selectedTopic?.id === topicToDelete.id) {
              setSelectedTopic(null);
            }
            setSubject(prev => ({
              ...prev,
              cardCount: (prev?.cardCount || 0) - snapshot.docs.length
            }));
            setFlashcards(prev => prev.filter(card => card.topicId !== topicToDelete.id));
          } catch (error) {
            console.error("Error deleting topic:", error);
            throw new Error('Failed to delete topic and its flashcards');
          }
        }}
        topic={topicToDelete}
      />
    </div>
  );
}

export default SubjectView;
