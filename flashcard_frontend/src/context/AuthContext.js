import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// PUBLIC_INTERFACE
export function useAuth() {
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('free');
  const [loading, setLoading] = useState(true);

  // Fetch user type from Firestore
  const fetchUserType = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, `users/${uid}`));
      if (userDoc.exists()) {
        setUserType(userDoc.data().type || 'free');
      } else {
        setUserType('free');
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
      setUserType('free');
    }
  };

  // Handle Google Sign In
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Handle Sign Out
  const logout = () => {
    return signOut(auth);
  };

  // Subscribe to auth state changes
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          setUser(currentUser);
          if (currentUser) {
            await fetchUserType(currentUser.uid);
          } else {
            setUserType('free');
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setUser(null);
          setUserType('free');
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    userType,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
