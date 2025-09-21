import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateSubjectModal from '../modals/CreateSubjectModal';
import DeleteSubjectModal from '../modals/DeleteSubjectModal';
import UpgradeModal from '../modals/UpgradeModal';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * PUBLIC_INTERFACE
 * Home page component showing user's subjects and navigation
 */
function Home() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Apply theme
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

  const handleCreateSubject = async (subjectName) => {
    // Free user limit check is now handled in CreateSubjectModal

    // Check for duplicate subject names
    const subjectsRef = collection(db, `users/${user.uid}/subjects`);
    const q = query(subjectsRef, where("title", "==", subjectName));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('A subject with this name already exists');
    }

    // Create new subject
    const newSubject = {
      title: subjectName,
      createdAt: new Date().toISOString(),
      cardCount: 0
    };

    const docRef = await addDoc(subjectsRef, newSubject);
    setSubjects(prev => [...prev, { id: docRef.id, ...newSubject }]);
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/subjects/${selectedSubject.id}`));
      setSubjects(prev => prev.filter(subject => subject.id !== selectedSubject.id));
      setIsDeleteModalOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
      setError('Failed to delete subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner container">
          <div className="brand">
            <span className="brand-icon">📘</span>
            <span className="brand-text">Digital Flash Card Manager</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                className="btn-ghost"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <Link 
                to="/practice" 
                className="btn-ghost"
                style={{
                  color: 'var(--muted)',
                  fontWeight: '600'
                }}
              >
                Practice
              </Link>
              <Link 
                to="/home" 
                className="btn-ghost"
                style={{
                  color: 'var(--primary)',
                  fontWeight: '600'
                }}
              >
                My Cards
              </Link>
            </div>
            
            {/* Profile Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  border: '2px solid var(--primary)',
                  padding: '0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--surface)'
                }}
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {user?.email?.[0].toUpperCase() || '?'}
                  </div>
                )}
              </button>
              
              {showProfileMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    zIndex: 100
                  }}
                >
                  <div 
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>
                      {user?.displayName || user?.email}
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: 'var(--muted)'
                    }}>
                      {userRole === 'premium' ? '✨ Premium User' : '🆓 Free User'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {userRole === 'free' && (
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsUpgradeModalOpen(true);
                        }}
                        className="btn-ghost"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '8px 16px',
                          color: 'var(--primary)',
                          fontWeight: '600'
                        }}
                      >
                        ✨ Upgrade to Premium
                      </button>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        padding: '8px 16px',
                        color: 'var(--error)',
                        fontWeight: '600'
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="section">
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px'
          }}>
            <div>
              <h1 className="section-title">My Subjects</h1>
              {userRole === 'free' && (
                <p className="section-subtitle" style={{ marginBottom: '8px' }}>
                  {subjects.length}/3 subjects used (Free Plan)
                </p>
              )}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
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
        </div>
      </main>

      {/* Modals */}
      <CreateSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubject}
        userRole={userRole}
        subjectCount={subjects.length}
        onUpgradeClick={() => {
          setIsModalOpen(false);
          setIsUpgradeModalOpen(true);
        }}
      />

      <DeleteSubjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSubject(null);
        }}
        onConfirm={handleDeleteSubject}
        subject={selectedSubject}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        message="Free users can only create up to 3 subjects. Upgrade to Premium for unlimited subjects!"
      />
    </div>
  );
}

export default Home;
