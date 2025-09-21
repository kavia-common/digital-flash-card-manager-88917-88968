import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Navbar from '../../components/layout/Navbar';
import CreateSubjectModal from '../../modals/CreateSubjectModal';
import DeleteSubjectModal from '../../modals/DeleteSubjectModal';

/**
 * PUBLIC_INTERFACE
 * Home page component showing user's subjects and navigation
 */
function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
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
    
    await deleteDoc(doc(db, `users/${user.uid}/subjects/${selectedSubject.id}`));
    setSubjects(prev => prev.filter(subject => subject.id !== selectedSubject.id));
  };

  return (
    <div className="App">
      <Navbar 
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onLogout={handleLogout}
      />

      <main className="section">
        <div className="container">
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
            >
              + Create New Subject
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
    </div>
  );
}

export default HomePage;
