import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'uid' | 'dateCreation'>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
    } catch (error: any) {
      toast.error('Erreur de connexion : ' + error.message);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'uid' | 'dateCreation'>, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, password);
      
      const newUser: User = {
        ...userData,
        uid: user.uid,
        dateCreation: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      toast.success('Inscription réussie !');
    } catch (error: any) {
      toast.error('Erreur d\'inscription : ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Déconnexion réussie !');
    } catch (error: any) {
      toast.error('Erreur de déconnexion : ' + error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      toast.error('Erreur : ' + error.message);
      throw error;
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};