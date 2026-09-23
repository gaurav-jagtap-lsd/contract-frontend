'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

type FirebaseUserType = FirebaseUser | null;

interface AuthContextValue {
  firebaseUser: FirebaseUserType;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const res = await authApi.login(token);
          setUser(res.data.data.user);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    const res = await authApi.login(token);
    setUser(res.data.data.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      const token = await cred.user.getIdToken();
      const res = await authApi.login(token, displayName);
      setUser(res.data.data.user);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code !== 'auth/email-already-in-use') throw err;
      try {
        await login(email, password);
      } catch (signInErr: unknown) {
        const signInCode = (signInErr as { code?: string }).code || '';
        if (signInCode.includes('invalid-credential') || signInCode.includes('wrong-password')) {
          throw new Error('This email is already registered. Sign in with your password, or reset it.');
        }
        throw signInErr;
      }
    }
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
