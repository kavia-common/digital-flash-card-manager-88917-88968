import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/layout/Navbar';
import ProgressBar from '../components/ui/ProgressBar';

// Set up Modal for accessibility
Modal.setAppElement('#root');

/**
 * PUBLIC_INTERFACE
 * Home page component showing user's subjects and navigation
 */
function Home() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [theme, setTheme] = useState('light');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch subjects from Firestore
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, `users/${user.uid}/subjects`));
        const subjectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Maximum subjects allowed for free users
  const MAX_FREE_SUBJECTS = 3;

  // Check if user can create more subjects
  const canCreateSubject = () => {
    if (userType === 'premium') return true;
    return subjects.length < MAX_FREE_SUBJECTS;
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newSubjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    // Check subject limit for free users
    if (!canCreateSubject()) {
      setError('Free users can only create up to 3 subjects. Please upgrade to create more.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate subject names
      const subjectsRef = collection(db, `users/${user.uid}/subjects`);
      const q = query(subjectsRef, where("title", "==", newSubjectName.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('A subject with this name already exists');
        setIsSubmitting(false);
        return;
      }

      // Create new subject
      const newSubject = {
        title: newSubjectName.trim(),
        createdAt: new Date().toISOString(),
        cardCount: 0
      };

      const docRef = await addDoc(subjectsRef, newSubject);
      setSubjects(prev => [...prev, { id: docRef.id, ...newSubject }]);
      setNewSubjectName('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating subject:", error);
      setError('Failed to create subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/subjects/${selectedSubject.id}`));
      setSubjects(prev => prev.filter(subject => subject.id !== selectedSubject.id));
      setIsDeleteModalOpen(false);
      setSelectedSubject(null);
      
      // TODO: Implement recursive deletion of topics and flashcards
      // This would require either:
      // 1. Using a Cloud Function to handle cascading deletes
      // 2. Implementing client-side deletion of all subcollections
      
    } catch (error) {
      console.error("Error deleting subject:", error);
      setError('Failed to delete subject. Please try again.');
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
      <Navbar theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />

      {/* Main Content */}
      <main className="section">
        <div className="container">
          {/* Subject limit progress for Free Users */}
          {userType === 'free' && (
            <ProgressBar
              value={subjects.length}
              maxValue={MAX_FREE_SUBJECTS}
              label={`${subjects.length}/${MAX_FREE_SUBJECTS} Subjects Used`}
              button={{
                text: "Upgrade to Premium",
                onClick: () => navigate('/upgrade')
              }}
            />
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <div>
              <h1 className="section-title">My Subjects</h1>
              <p className="section-subtitle">Create and manage your study subjects</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="btn-primary btn-lg"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>+</span>
              Create New Subject
            </button>
          </div>

          {/* Subjects Grid */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {subjects.length > 0 ? (
              subjects.map(subject => (
                <div
                  key={subject.id}
                  className="feature"
                  style={{
                    color: 'var(--text)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="feature-icon">
                        📚
                      </div>
                      <div className="pill">
                        {subject.cardCount || 0} cards
                      </div>
                    </div>
                    <button
                      className="btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubject(subject);
                        setIsDeleteModalOpen(true);
                      }}
                      style={{
                        padding: '8px',
                        minWidth: 'unset',
                        color: 'var(--error)'
                      }}
                      aria-label={`Delete ${subject.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                  <h3 className="feature-title">{subject.title}</h3>
                  <p className="feature-desc">
                    {subject.description || 'No description'}
                  </p>
                </div>
              ))
            ) : (
              <div 
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--muted)',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                  📚
                </div>
                <h3 style={{ 
                  margin: '0 0 8px',
                  color: 'var(--text)',
                  fontSize: '18px'
                }}>
                  No subjects yet
                </h3>
                <p style={{ margin: '0 0 24px' }}>
                  Create your first subject to start learning
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary"
                >
                  Create New Subject
                </button>
              </div>
            )}
          </div>

          {/* Create Subject Modal */}
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => {
              setIsModalOpen(false);
              setNewSubjectName('');
              setError('');
            }}
            style={modalStyles}
            contentLabel="Create New Subject"
          >
            <h2 style={{ 
              margin: '0 0 16px',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Create New Subject
            </h2>
            <form onSubmit={handleCreateSubject}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="subjectName" 
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}
                >
                  Subject Name
                </label>
                <input
                  id="subjectName"
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter subject name"
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
                    setIsModalOpen(false);
                    setNewSubjectName('');
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
                  {isSubmitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={isDeleteModalOpen}
            onRequestClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedSubject(null);
              setError('');
            }}
            style={modalStyles}
            contentLabel="Delete Subject Confirmation"
          >
            <h2 style={{ 
              margin: '0 0 16px',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Delete Subject
            </h2>
            <p style={{
              marginBottom: '24px',
              color: 'var(--muted)'
            }}>
              Are you sure you want to delete "{selectedSubject?.title}"? This action cannot be undone.
            </p>
            
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
                  setIsDeleteModalOpen(false);
                  setSelectedSubject(null);
                  setError('');
                }}
                className="btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
                className="btn-ghost"
                style={{
                  color: 'var(--error)',
                  borderColor: 'var(--error)'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Subject'}
              </button>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}

export default Home;
