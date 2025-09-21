import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Set up Modal for accessibility
Modal.setAppElement('#root');

/**
 * PUBLIC_INTERFACE
 * Subject view component showing topics in sidebar and flashcards in main area
 */
function SubjectView() {
  const { user } = useAuth();
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!frontText && !selectedImage) {
      setError('Please provide either text or an image for the front side');
      return;
    }
    if (!backText) {
      setError('Please provide text for the back side');
      return;
    }

    setIsSubmitting(true);

    try {
      let frontImageUrl = '';
      
      // Upload image if selected
      if (selectedImage) {
        const storage = getStorage();
        const imageRef = ref(storage, `flashcards/${user.uid}/${subjectId}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        frontImageUrl = await getDownloadURL(imageRef);
      }

      // Create new flashcard
      const flashcardsRef = collection(db, `users/${user.uid}/subjects/${subjectId}/flashcards`);
      const newFlashcard = {
        frontText: frontText.trim(),
        frontImageUrl,
        backText: backText.trim(),
        topicId: selectedTopic?.id || null,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(flashcardsRef, newFlashcard);
      setFlashcards(prev => [...prev, { id: docRef.id, ...newFlashcard }]);

      // Reset form
      setFrontText('');
      setBackText('');
      setSelectedImage(null);
      setImagePreview('');
      setIsFlashcardModalOpen(false);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      setError('Failed to create flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
          <Link to="/home" className="brand">
            <span className="brand-icon">📘</span>
            <span className="brand-text">
              {subject?.title || 'Loading...'}
            </span>
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
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  fontWeight: '600',
                  color: selectedTopic?.id === topic.id ? 'var(--primary)' : 'var(--text)'
                }}
              >
                {topic.title}
              </button>
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
              <h1 className="section-title">
                {selectedTopic ? selectedTopic.title : 'All Flashcards'}
              </h1>
              {topics.length === 0 ? (
                <button 
                  className="btn-primary"
                  onClick={() => setIsTopicModalOpen(true)}
                >
                  + Create Topic
                </button>
              ) : (
                selectedTopic && (
                  <button 
                    className="btn-primary"
                    onClick={() => setIsFlashcardModalOpen(true)}
                  >
                    + Create Flashcard
                  </button>
                )
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
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div className="feature-icon">
                        📝
                      </div>
                      <button 
                        className="btn-ghost"
                        style={{
                          padding: '6px',
                          minWidth: 'unset'
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                    <div>
                      <h3 className="feature-title">
                        {card.question || 'Question'}
                      </h3>
                      <p className="feature-desc">
                        {card.answer || 'Answer'}
                      </p>
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
                  <button className="btn-primary" onClick={() => setIsFlashcardModalOpen(true)}>
                    Create Flashcard
                  </button>
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
          setSelectedImage(null);
          setImagePreview('');
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
          Create New Flashcard
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
              Front Side (Text and/or Image)
            </label>
            <input
              type="text"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Enter front side text (optional)"
              style={{
                width: '100%',
                padding: '10px 14px',
                marginBottom: '12px',
                borderRadius: '12px',
                border: '1px solid var(--muted)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
            
            <div style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                📷 Upload Image (optional)
              </label>
              
              {imagePreview && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '200px',
                  marginTop: '8px'
                }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      border: '1px solid var(--muted)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview('');
                    }}
                    className="btn-ghost"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      minWidth: 'unset',
                      background: 'var(--surface)',
                      borderRadius: '8px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
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
              Back Side (Required)
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
                setSelectedImage(null);
                setImagePreview('');
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
              {isSubmitting ? 'Creating...' : 'Create Flashcard'}
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
    </div>
  );
}

export default SubjectView;
