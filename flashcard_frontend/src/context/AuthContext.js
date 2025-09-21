import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

// PUBLIC_INTERFACE
export function useAuth() {
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch user profile
  const initializeUserProfile = async (user) => {
    try {
      const userRef = doc(db, `users/${user.uid}/profile/role`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Initialize new user as free tier
        await setDoc(userRef, { role: 'free' });
        setUserRole('free');
      } else {
        setUserRole(userDoc.data().role);
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
      setUserRole('free'); // Default to free on error
    }
  };

  // Handle Google Sign In
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await initializeUserProfile(result.user);
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await initializeUserProfile(currentUser);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userRole,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
